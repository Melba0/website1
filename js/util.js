/* =========================================================
   util.js · 小工具
   ========================================================= */

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** 建元素：el('div', {class:'x'}, [child, '文字']) */
export function el(tag, attrs = {}, kids = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  for (const kid of [].concat(kids)) {
    if (kid === null || kid === undefined || kid === false) continue;
    n.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return n;
}

export const SVGNS = 'http://www.w3.org/2000/svg';

/** 建 SVG 元素 */
export function svg(tag, attrs = {}, kids = []) {
  const n = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'text') n.textContent = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  for (const kid of [].concat(kids)) {
    if (kid === null || kid === undefined || kid === false) continue;
    n.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return n;
}

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const rand  = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick  = arr => arr[Math.floor(Math.random() * arr.length)];
export const pickN = (arr, n) => shuffle(arr.slice()).slice(0, n);

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 线性插值 */
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOut = t => 1 - Math.pow(1 - t, 3);
export const easeInOut = t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** 有限状态事件总线 */
export function emitter() {
  const map = new Map();
  return {
    on(ev, fn) { (map.get(ev) || map.set(ev, []).get(ev)).push(fn); return () => this.off(ev, fn); },
    off(ev, fn) { const l = map.get(ev); if (l) l.splice(l.indexOf(fn) >>> 0, 1); },
    emit(ev, payload) { (map.get(ev) || []).slice().forEach(fn => fn(payload)); }
  };
}

/** 简易节流 */
export function throttle(fn, ms = 16) {
  let last = 0, timer = null, lastArgs = null;
  return (...args) => {
    const now = performance.now();
    lastArgs = args;
    if (now - last >= ms) { last = now; fn(...args); }
    else if (!timer) {
      timer = setTimeout(() => { timer = null; last = performance.now(); fn(...lastArgs); },
        ms - (now - last));
    }
  };
}

/** 深拷贝（纯数据） */
export const clone = o => JSON.parse(JSON.stringify(o));

/** 数组按 key 去重 */
export const uniqBy = (arr, key) => {
  const s = new Set();
  return arr.filter(o => { const k = key(o); if (s.has(k)) return false; s.add(k); return true; });
};

/** 数字转中文（一~十） */
const CN = ['零','一','二','三','四','五','六','七','八','九','十'];
export const cnNum = n => (n <= 10 ? CN[n] : n < 20 ? '十' + CN[n - 10] : String(n));

/** 随机中文吉语后缀 */
export const ordinal = i => ['其一','其二','其三','其四','其五','其六'][i] || `其${cnNum(i + 1)}`;

/** 颜色明暗 */
export function shade(hex, amt) {
  const [r, g, b] = parseColor(hex);
  return `rgb(${clamp(Math.round(r + amt), 0, 255)},${clamp(Math.round(g + amt), 0, 255)},${clamp(Math.round(b + amt), 0, 255)})`;
}

/** 解析 #rgb / #rrggbb / rgb() / rgba() → [r,g,b] */
export function parseColor(c) {
  const s = String(c).trim();
  if (s.startsWith('#')) {
    const h = s.slice(1);
    const full = h.length === 3 ? h.split('').map(x => x + x).join('') : h;
    const n = parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = s.match(/rgba?\(([^)]+)\)/i);
  if (m) {
    const p = m[1].split(',').map(x => parseFloat(x));
    return [p[0] || 0, p[1] || 0, p[2] || 0];
  }
  return [255, 255, 255];
}

/** 把一个色按比例混向另一色，返回 #rrggbb */
export function mix(hex, target, t) {
  const a = parseColor(hex), b = parseColor(target);
  const r = Math.round(lerp(a[0], b[0], t));
  const g = Math.round(lerp(a[1], b[1], t));
  const bl = Math.round(lerp(a[2], b[2], t));
  return `#${[r, g, bl].map(v => clamp(v, 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

