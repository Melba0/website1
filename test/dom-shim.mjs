/* =========================================================
   test/dom-shim.mjs · 极简 DOM/CSSOM/Canvas 仿真
   目的：在 Node 中真实执行 js/*.js，捕获运行期错误
   ========================================================= */
import { readFileSync } from 'node:fs';

/* ---------------- 选择器解析 ---------------- */
/** 把 'a b > c' 解析为若干「后代/子代」步骤；每步含 tag/id/classes/attrs(带值) */
export function parseSelector(sel) {
  const raw = String(sel).trim();
  const steps = [];
  const parts = raw.split(/\s*>\s*|\s+/).filter(Boolean);
  for (const part of parts) {
    const step = { tag: null, ids: [], classes: [], attrs: [] };
    const re = /([.#]?[\w\u4e00-\u9fa5-]+)|\[([\w-]+)(?:([~^$*|]?=)\s*("([^"]*)"|'([^']*)'|([^\]\s]+)))?\]/g;
    let m;
    while ((m = re.exec(part))) {
      if (m[1]) {
        const t = m[1];
        if (t.startsWith('#')) step.ids.push(t.slice(1));
        else if (t.startsWith('.')) step.classes.push(t.slice(1));
        else step.tag = t.toLowerCase();
      } else if (m[2]) {
        step.attrs.push({ name: m[2], op: m[3] || null, value: m[5] ?? m[6] ?? m[7] ?? null });
      }
    }
    steps.push(step);
  }
  return steps;
}

function attrOf(node, name) {
  if (node._attrs.has(name)) return node._attrs.get(name);
  if (name === 'class') return node.className;
  if (name === 'id') return node.id;
  return null;
}

function matchStep(node, step) {
  if (!(node instanceof Node)) return false;
  if (step.tag && node.tagName.toLowerCase() !== step.tag) return false;
  if (step.ids.length && !step.ids.includes(node.id)) return false;
  if (step.classes.some(c => !node._classes.has(c))) return false;
  for (const a of step.attrs) {
    const v = attrOf(node, a.name);
    if (v === null || v === undefined) return false;
    if (!a.op) continue;
    const s = String(v);
    if (a.op === '=' && s !== a.value) return false;
    if (a.op === '~=' && !s.split(/\s+/).includes(a.value)) return false;
    if (a.op === '^=' && !s.startsWith(a.value)) return false;
    if (a.op === '$=' && !s.endsWith(a.value)) return false;
    if (a.op === '*=' && !s.includes(a.value)) return false;
  }
  return true;
}

/** 断言 node 能被整条选择器匹配（自右向左回溯祖先） */
function matchesChain(node, steps) {
  let i = steps.length - 1;
  if (!matchStep(node, steps[i])) return false;
  i--;
  let n = node.parentNode;
  while (i >= 0 && n) {
    if (matchStep(n, steps[i])) i--;
    n = n.parentNode;
  }
  return i < 0;
}

/** 整条选择器中「最右一步」的概括（用于按 id 快速取候选） */
function rightmost(sel) {
  const steps = parseSelector(sel);
  return steps[steps.length - 1];
}

/* ---------------- 节点 ---------------- */
class ClassList {
  constructor(node) { this.node = node; }
  get _s() { return this.node._classes; }
  contains(c) { return this._s.has(c); }
  add(...c) { c.forEach(x => x && this._s.add(x)); this.node._dirty = true; }
  remove(...c) { c.forEach(x => this._s.delete(x)); this.node._dirty = true; }
  toggle(c, force) {
    const on = force === undefined ? !this._s.has(c) : !!force;
    if (on) this._s.add(c); else this._s.delete(c);
    this.node._dirty = true;
    return on;
  }
}

class Style {
  constructor() { this._m = new Map(); }
  setProperty(k, v) { this._m.set(k, v); }
  getPropertyValue(k) { return this._m.get(k) || ''; }
  removeProperty(k) { this._m.delete(k); }
  get cssText() { return Array.from(this._m, ([k, v]) => `${k}:${v}`).join(';'); }
  set cssText(v) { v.split(';').forEach(p => { const [k, val] = p.split(':'); if (k && val) this._m.set(k.trim(), val.trim()); }); }
}
// 常用 style 属性直通
['transform', 'opacity', 'filter', 'width', 'height', 'left', 'top', 'cursor', 'display'].forEach(p => {
  Object.defineProperty(Style.prototype, p, {
    get() { return this._m.get(p) || ''; },
    set(v) { this._m.set(p, v); }
  });
});

class Dataset {
  constructor(node) { this.node = node; }
  static key(prop) { return 'data-' + prop.replace(/[A-Z]/g, c => '-' + c.toLowerCase()); }
  static prop(attr) { return attr.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase()); }
  get(prop) { return this.node._attrs.get(Dataset.key(prop)); }
  set(prop, v) { this.node._attrs.set(Dataset.key(prop), String(v)); }
  has(prop) { return this.node._attrs.has(Dataset.key(prop)); }
  delete(prop) { this.node._attrs.delete(Dataset.key(prop)); }
  keys() {
    const out = [];
    for (const k of this.node._attrs.keys()) if (k.startsWith('data-')) out.push(Dataset.prop(k));
    return out;
  }
  entries() { return this.keys().map(k => [k, this.get(k)]); }
  [Symbol.iterator]() { return this.entries()[Symbol.iterator](); }
}

class Node {
  constructor(tag, doc) {
    this.tagName = String(tag).toUpperCase();
    this.ownerDocument = doc;
    this._attrs = new Map();
    this._classes = new Set();
    this._children = [];
    this.parentNode = null;
    this._events = new Map();
    this._dirty = true;
    this.classList = new ClassList(this);
    this.style = new Style();
    this._dataset = new Dataset(this);
    this.dataset = new Proxy(this._dataset, {
      get: (t, k) => (k === 'node' ? t : (typeof k === 'string' && k in Dataset.prototype ? t[k].bind(t) : t.get(k))),
      set: (t, k, v) => { t.set(k, v); return true; },
      has: (t, k) => (k in Dataset.prototype) || t.has(k),
      deleteProperty: (t, k) => { t.delete(k); return true; }
    });
    this.hidden = false;
    this.value = '';
    this._text = '';
    this._html = '';
  }
  get className() { return Array.from(this._classes).join(' '); }
  set className(v) { this._classes = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get id() { return this._attrs.get('id') || ''; }
  set id(v) { this._attrs.set('id', v); }
  get children() { return this._children.filter(c => c instanceof Node); }
  get childNodes() { return this._children.slice(); }
  get firstChild() { return this._children[0] || null; }
  get textContent() {
    if (this._children.length) return this._children.map(c => c.textContent ?? '').join('');
    return this._text;
  }
  set textContent(v) { this._children = []; this._text = String(v); }
  get innerHTML() {
    return this._children.map(c =>
      c instanceof TextNode ? c.textContent : serialize(c)
    ).join('');
  }
  set innerHTML(v) { this._html = String(v); this._children = parseHTMLFragment(String(v), this.ownerDocument); this._children.forEach(c => c.parentNode = this); }
  get ownerSVGElement() { return this.tagName === 'svg' ? this : (this.parentNode?.ownerSVGElement || null); }

  setAttribute(k, v) { this._attrs.set(k, String(v)); }
  getAttribute(k) { return this._attrs.has(k) ? this._attrs.get(k) : null; }
  hasAttribute(k) { return this._attrs.has(k); }
  removeAttribute(k) { this._attrs.delete(k); }

  append(...kids) {
    for (const k of kids.flat(9)) {
      if (k === null || k === undefined || k === false) continue;
      const node = k instanceof Node ? k : new TextNode(String(k), this.ownerDocument);
      node.parentNode = this;
      this._children.push(node);
      if (node instanceof Node) registerNode(node);
    }
  }
  appendChild(k) { this.append(k); return k; }
  prepend(...kids) { this._children.unshift(...kids); }
  replaceChildren(...kids) {
    this._children = [];
    this.append(...kids);
  }
  remove() { if (this.parentNode) this.parentNode._children = this.parentNode._children.filter(c => c !== this); }
  insertBefore(n, ref) {
    const i = this._children.indexOf(ref);
    this._children.splice(i < 0 ? this._children.length : i, 0, n);
    n.parentNode = this;
  }

  addEventListener(type, fn) {
    if (!this._events.has(type)) this._events.set(type, []);
    this._events.get(type).push(fn);
  }
  removeEventListener(type, fn) {
    const l = this._events.get(type);
    if (l) this._events.set(type, l.filter(f => f !== fn));
  }
  dispatchEvent(ev) {
    ev.target = ev.target || this;
    // 每次派发独立的「已停止」标记，绝不改写事件对象上的方法
    let stopped = false;
    ev.preventDefault = ev.preventDefault || (() => { ev.defaultPrevented = true; });
    const fn0 = ev.stopPropagation;
    ev.stopPropagation = () => { stopped = true; if (fn0) fn0(); };
    const chain = [];
    let n = this;
    while (n) { chain.push(n); n = n.parentNode; }
    const doc = this.ownerDocument;
    if (doc) { chain.push(doc); if (doc.defaultView) chain.push(doc.defaultView); }
    for (const node of chain) {
      if (stopped) break;
      ev.currentTarget = node;
      // 节点用 _events，document/window 用 _listeners
      const bag = node._events || node._listeners;
      const l = bag && bag.get(ev.type);
      if (l) for (const fn of l.slice()) { fn.call(node, ev); if (stopped) break; }
    }
    return !ev.defaultPrevented;
  }
  click() { this.dispatchEvent({ type: 'click', target: this }); }

  matches(sel) {
    return matchesChain(this, parseSelector(sel));
  }
  closest(sel) {
    let n = this;
    while (n) { if (n.matches && n.matches(sel)) return n; n = n.parentNode; }
    return null;
  }
  querySelector(sel) { return queryAll(this, sel)[0] || null; }
  querySelectorAll(sel) { return queryAll(this, sel); }
  getBoundingClientRect() {
    const w = this.ownerDocument.defaultView.innerWidth;
    const h = this.ownerDocument.defaultView.innerHeight;
    return { width: w, height: h, left: 0, top: 0, right: w, bottom: h, x: 0, y: 0 };
  }
  setPointerCapture() { }
  releasePointerCapture() { }
  focus() { }
  blur() { }
  animate() { return { finished: Promise.resolve(), cancel() { } }; }
  get offsetWidth() { return this.ownerDocument.defaultView.innerWidth; }
  scrollIntoView() { }
}

class TextNode {
  constructor(t, doc) { this._text = t; this.ownerDocument = doc; this.parentNode = null; }
  get textContent() { return this._text; }
  set textContent(v) { this._text = v; }
}

export { Node, TextNode };

/* ---------------- 序列化（让 innerHTML 读得回来） ---------------- */
function serialize(node) {
  if (!(node instanceof Node)) return '';
  const tag = node.tagName.toLowerCase();
  const attrs = Array.from(node._attrs, ([k, v]) => ` ${k}="${v}"`).join('');
  const cls = node._classes.size ? ` class="${node.className}"` : '';
  const inner = node._children.map(c => c instanceof TextNode ? c.textContent : serialize(c)).join('');
  return `<${tag}${cls}${attrs}>${inner}</${tag}>`;
}

/* ---------------- 注册表（按 id / class / tag 索引） ---------------- */
let REGISTRY = [];
function registerNode(node) {
  if (node instanceof Node && !REGISTRY.includes(node)) REGISTRY.push(node);
}
function queryAll(root, sel) {
  const sels = String(sel).split(',').map(s => s.trim()).filter(Boolean);
  const pool = [];
  const walk = n => { for (const c of n._children) { if (c instanceof Node) { pool.push(c); walk(c); } } };
  walk(root);
  const res = pool.filter(n => sels.some(s => matchesChain(n, parseSelector(s))));
  return res;
}

/* ---------------- HTML 片段解析 ---------------- */
export function parseHTMLFragment(html, doc) {
  const root = new Node('div', doc);
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)((?:\s+[^<>]*?)?)(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(html))) {
    const [full, close, open, attrs, selfClose, text] = m;
    if (full.startsWith('<!--')) continue;
    if (close) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    if (text) {
      if (text.trim()) stack[stack.length - 1].append(new TextNode(text, doc));
      continue;
    }
    const node = new Node(open, doc);
    if (attrs) {
      const ar = /([\w:-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
      let a;
      while ((a = ar.exec(attrs))) {
        const k = a[1];
        const v = a[3] ?? a[4] ?? a[5] ?? '';
        if (k === 'class') node.className = v;
        else if (k === 'id') node.id = v;
        else if (k.startsWith('data-')) node.dataset[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
        else if (k === 'style') node.style.cssText = v;
        else node.setAttribute(k, v);
      }
    }
    stack[stack.length - 1].append(node);
    const voidTags = ['br', 'img', 'input', 'hr', 'meta', 'link', 'use', 'path', 'circle', 'rect', 'ellipse', 'line', 'stop', 'animate', 'feDropShadow', 'feGaussianBlur', 'feMerge', 'feMergeNode'];
    if (!selfClose && !voidTags.includes(open) && !['use', 'path', 'circle', 'rect', 'ellipse', 'line'].includes(open)) stack.push(node);
  }
  registerNode(root);
  root._children.forEach(() => { });
  return root._children.slice();
}

/* ---------------- document ---------------- */
export function createDocument(html) {
  const doc = {
    _listeners: new Map(),
    readyState: 'complete',
    defaultView: null
  };
  const documentElement = new Node('html', doc);
  REGISTRY = [documentElement];
  doc.documentElement = documentElement;
  doc.head = new Node('head', doc);
  doc.body = new Node('body', doc);
  documentElement.append(doc.head, doc.body);

  const frag = parseHTMLFragment(html, doc);
  frag.forEach(n => doc.body.append(n));

  doc.createElement = tag => { const n = new Node(tag, doc); registerNode(n); return n; };
  doc.createElementNS = (ns, tag) => { const n = new Node(tag, doc); n._ns = ns; registerNode(n); return n; };
  doc.createTextNode = t => new TextNode(t, doc);
  doc.querySelector = sel => queryAll(documentElement, sel)[0] || null;
  doc.querySelectorAll = sel => queryAll(documentElement, sel);
  doc.getElementById = id => REGISTRY.find(n => n.id === id) || null;
  doc.addEventListener = (t, fn) => { if (!doc._listeners.has(t)) doc._listeners.set(t, []); doc._listeners.get(t).push(fn); };
  doc.removeEventListener = () => { };
  doc.dispatchEvent = ev => { (doc._listeners.get(ev.type) || []).forEach(fn => fn(ev)); };
  doc.execCommand = () => true;
  return doc;
}

/* ---------------- Canvas 2D 仿真 ---------------- */
function ctx2d() {
  const grad = () => ({ addColorStop() { } });
  const c = {
    canvas: null,
    globalAlpha: 1, fillStyle: '#000', strokeStyle: '#000', lineWidth: 1,
    font: '', textAlign: '', textBaseline: '', globalCompositeOperation: 'source-over',
    shadowBlur: 0, shadowColor: '', lineCap: '', lineJoin: '', filter: '',
    setTransform() { }, resetTransform() { }, scale() { }, translate() { }, rotate() { },
    clearRect() { }, fillRect() { }, strokeRect() { }, beginPath() { }, closePath() { },
    moveTo() { }, lineTo() { }, arc() { }, ellipse() { }, rect() { }, fill() { }, stroke() { },
    save() { }, restore() { }, clip() { }, quadraticCurveTo() { }, bezierCurveTo() { },
    fillText() { }, strokeText() { }, measureText() { return { width: 10 }; },
    createLinearGradient: grad, createRadialGradient: grad, createPattern: () => null,
    drawImage() { }, getImageData() { return { data: [] }; }, putImageData() { },
    setLineDash() { }, getLineDash() { return []; }, arcTo() { }, roundRect() { }
  };
  return c;
}
// 让 getContext 生效
Node.prototype.getContext = function (kind) {
  if (kind !== '2d') return null;
  if (!this._ctx) { this._ctx = ctx2d(); this._ctx.canvas = this; }
  return this._ctx;
};
Node.prototype.toDataURL = function () { return 'data:image/png;base64,'; };

/* ---------------- window ---------------- */
export function createWindow(doc) {
  const win = {
    innerWidth: 1600, innerHeight: 900, devicePixelRatio: 1,
    _listeners: new Map(),
    location: { href: 'http://127.0.0.1:8787/', search: '', pathname: '/' },
    navigator: { clipboard: { writeText: async () => { } }, userAgent: 'node' },
    performance: { now: () => Number(process.hrtime.bigint() / 1000000n) },
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => { },
    setTimeout, clearTimeout, setInterval, clearInterval,
    addEventListener(t, fn) { if (!this._listeners.has(t)) this._listeners.set(t, []); this._listeners.get(t).push(fn); },
    removeEventListener(t, fn) { const l = this._listeners.get(t); if (l) this._listeners.set(t, l.filter(f => f !== fn)); },
    dispatchEvent(ev) { (this._listeners.get(ev.type) || []).forEach(fn => fn(ev)); return true; },
    matchMedia: () => ({ matches: false, addEventListener() { } }),
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    AudioContext: undefined,
    webkitAudioContext: undefined,
    Image: class { set src(v) { this._src = v; setTimeout(() => this.onload && this.onload(), 0); } get src() { return this._src; } },
    Blob: class { constructor(p) { this.parts = p; } },
    URL: { createObjectURL: () => 'blob:x', revokeObjectURL() { } },
    URLSearchParams,
    document: doc
  };
  win.window = win;
  win.self = win;
  win.addEventListener = win.addEventListener.bind(win);
  return win;
}

/* ---------------- 安装到 globalThis ---------------- */
function define(name, value) {
  try {
    Object.defineProperty(globalThis, name, { value, writable: true, configurable: true, enumerable: false });
  } catch (e) {
    try { globalThis[name] = value; } catch (e2) { /* 只读则不覆盖 */ }
  }
}

export function installDOM(html, search = '') {
  const doc = createDocument(html);
  const win = createWindow(doc);
  doc.defaultView = win;
  win.location.search = search;

  define('window', win);
  define('document', doc);
  define('navigator', win.navigator);
  define('location', win.location);
  define('requestAnimationFrame', win.requestAnimationFrame);
  define('cancelAnimationFrame', win.cancelAnimationFrame);
  define('performance', win.performance);
  define('Image', win.Image);
  define('Blob', win.Blob);
  define('matchMedia', win.matchMedia);
  define('getComputedStyle', win.getComputedStyle);
  define('Node', Node);
  define('Text', TextNode);
  define('Element', Node);
  define('HTMLElement', Node);
  define('SVGElement', Node);
  return { doc, win, registry: () => REGISTRY };
}

export function readIndex() {
  return readFileSync(new URL('../index.html', import.meta.url), 'utf8');
}
