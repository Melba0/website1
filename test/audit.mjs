/* =========================================================
   test/audit.mjs · 几何与一致性审计
   把真实页面在浏览器里跑起来，量出关键元素的盒模型，
   找错位 / 溢出 / 遮挡 / 静态写死的代笔。
   用法： node test/audit.mjs [url]
   前置： node server.mjs 8787
   ========================================================= */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const PORT = 9344;
const BASE = process.argv[2] || 'http://127.0.0.1:8787';
const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find(existsSync);
if (!CHROME) { console.error('找不到浏览器'); process.exit(1); }

const profile = join(tmpdir(), 'dsh-audit-' + Date.now());
mkdirSync(profile, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** 在页内执行的探针：返回一堆量测结果 */
const PROBE = `(() => {
  const box = el => {
    const r = el.getBoundingClientRect();
    return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1),
             cx: +(r.x + r.width / 2).toFixed(1), cy: +(r.y + r.height / 2).toFixed(1),
             r: +r.right.toFixed(1), b: +r.bottom.toFixed(1) };
  };
  const q = s => document.querySelector(s);
  const qa = s => Array.from(document.querySelectorAll(s));
  const out = { vw: innerWidth, vh: innerHeight, scene: document.getElementById('app').dataset.scene, probes: {} };
  const P = out.probes;

  // A. 走廊：门洞 / 门板 / 门楣 / 横匾 / 竖联 / 宫灯 是否共用同一中轴
  const door = q('.cw-door');
  if (door) {
    const d = box(door);
    const pick = {};
    for (const sel of ['.door-frame', '.door-leaf', '.door-lintel', '.door-plate', '.door-couplet', '.door-lamp', '.door-hint', '.door-sill']) {
      const n = door.querySelector(sel);
      if (n) pick[sel] = box(n);
    }
    const axis = Object.entries(pick).filter(([k]) => !k.includes('couplet'));
    const cxs = axis.map(([, v]) => v.cx);
    P.corridor = {
      door: d, parts: pick,
      axisSpread: +(Math.max(...cxs) - Math.min(...cxs)).toFixed(1),
      frameVsLeaf: +(pick['.door-leaf'].x - pick['.door-frame'].x).toFixed(1),
      lintelOverhangL: +(pick['.door-frame'].x - pick['.door-lintel'].x).toFixed(1),
      lintelOverhangR: +(pick['.door-lintel'].r - pick['.door-frame'].r).toFixed(1),
      lintelVsFrameTop: +(pick['.door-frame'].y - pick['.door-lintel'].y).toFixed(1),
      plateVsFrame: +(pick['.door-frame'].y - pick['.door-plate'].b).toFixed(1),
      lampVsPlate: +(pick['.door-plate'].y - pick['.door-lamp'].b).toFixed(1),
      sillVsFrameBottom: +(pick['.door-sill'].y - pick['.door-frame'].b).toFixed(1),
      hintVsSill: +(pick['.door-sill'].y - pick['.door-hint'].b).toFixed(1),
      coupletVsFrameR: +(pick['.door-couplet'].x - pick['.door-frame'].r).toFixed(1)
    };
    const lit = q('.cw-door.open') || door;
    const l = lit.querySelector('.door-leaf');
    if (l) {
      const cs = getComputedStyle(l);
      P.leaf = { transform: cs.transform, origin: cs.transformOrigin, rotateY: cs.transform };
    }
  }

  // B. 门庭：桂枝 / 月亮 / 标题 / 房舍 的纵向层次与遮挡
  if (out.scene === 'gate') {
    const items = {};
    for (const [name, sel] of [['branch', '.branch-a'], ['moon', '.moonwrap'], ['title', '.gate-title'], ['house', '.gate-house'], ['jar', '.jar-wrap'], ['cta', '.gate-cta']]) {
      const n = q(sel); if (n) items[name] = box(n);
    }
    P.gate = items;
  }

  // C. 选天时：序进条 / 匾额 / 诗 / 提问 会不会互相压
  if (out.scene === 'sky') {
    const items = {};
    for (const [name, sel] of [['seq', '#seqBar'], ['frame', '.sky-frame'], ['poem', '#skyPoem'], ['prompt', '#seqPrompt'], ['readout', '.sky-readout'], ['panel', '#timePanel'], ['cta', '.sky-cta'], ['random', '.sky-random']]) {
      const n = q(sel); if (n) items[name] = box(n);
    }
    P.sky = items;
    const hot = qa('.hot').map(n => box(n));
    P.skyHot = hot;
    P.skyHotOverlap = [];
    for (let i = 0; i < hot.length; i++) for (let j = i + 1; j < hot.length; j++) {
      const a = hot[i], b = hot[j];
      if (a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b) P.skyHotOverlap.push([i, j]);
    }
  }

  // D. 包间：卡片 / 底栏 会不会互相压
  if (out.scene === 'room') {
    const items = {};
    for (const [name, sel] of [['body', '.room-body'], ['tabs', '#stageTabs'], ['stage', '.stage.on'], ['cta', '.room-cta'], ['head', '.room-head']]) {
      const n = q(sel); if (n) items[name] = box(n);
    }
    P.room = items;
    const stage = q('.stage.on');
    if (stage) {
      const last = stage.lastElementChild;
      if (last) P.room.lastChildBottomVsBody = +(last.getBoundingClientRect().bottom - q('.room-body').getBoundingClientRect().bottom).toFixed(1);
      const cards = qa('.stage.on .card, .stage.on .course');
      P.room.counts = { cards: cards.length };
      P.room.overflowX = stage.scrollWidth - stage.clientWidth;
      P.room.overflowY = stage.scrollHeight - stage.clientHeight;
    }
    if (stage && stage.dataset.stage === '1') {
      const c = q('.course');
      if (c) {
        const parts = {};
        for (const s of ['.c-no', '.c-thumb', '.c-main', '.c-act', '.adj']) {
          const n = c.querySelector(s); if (n) parts[s] = box(n);
        }
        P.course = parts;
        const m = c.querySelector('.c-main');
        P.courseTextWidth = m ? m.scrollWidth - m.clientWidth : null;
      }
      const list = q('#courseList');
      if (list) {
        const rows = qa('.course').map(x => box(x));
        P.courseRowGaps = rows.slice(1).map((r, i) => +(r.y - rows[i].b).toFixed(1));
      }
    }
  }

  // E. 成宴：圆桌六盘是否落在桌内、卡片是否溢出
  if (out.scene === 'feast') {
    const t = q('.table-stage');
    const slots = qa('.slot').map(n => box(n));
    if (t) {
      const tb = box(t);
      const size = Math.min(tb.w, tb.h);
      const R = size / 2;
      P.feast = {
        table: tb,
        slots,
        radiiPct: slots.map(s => +(Math.hypot(s.cx - tb.cx, s.cy - tb.cy) / R * 100).toFixed(1)),
        outOfTable: slots.filter(s => Math.hypot(s.cx - tb.cx, s.cy - tb.cy) + Math.min(s.w, s.h) / 2 > R).length,
        noteTop: box(q('.feast-notes')).y,
        cardTop: box(q('.feast-cards')).y,
        ctaBottom: box(q('.feast-cta')).b,
        vh: innerHeight
      };
      P.feast.slotNames = qa('.slot-name').map(n => ({ t: n.textContent, w: +n.getBoundingClientRect().width.toFixed(1), wrap: n.scrollWidth > n.clientWidth + 1 }));
    }
  }
  return out;
})()`;

async function getJSON(p) { return (await fetch(`http://127.0.0.1:${PORT}${p}`)).json(); }

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.w = new Map(); }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const c = new CDP(ws);
    ws.onmessage = e => {
      const m = JSON.parse(e.data);
      if (m.id && c.w.has(m.id)) { const { res, rej } = c.w.get(m.id); c.w.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
    };
    return c;
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.w.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => { if (this.w.has(id)) { this.w.delete(id); rej(new Error('超时 ' + method)); } }, 25000);
    });
  }
  close() { try { this.ws.close(); } catch (_) { } }
}

const PAGES = [
  ['gate', '/?shot=900'],
  ['sky', '/?scene=sky&weather=frost&time=zenith&step=1&shot=900'],
  ['corridor', '/?scene=corridor&room=jiangyue&weather=rain&time=midnight&shot=900'],
  ['room1', '/?scene=room&room=lingnan&weather=frost&time=slant&flavor=strong&allergies=nuts,dairy&mood=reunion&shot=900'],
  ['room2', '/?scene=room&room=jinghua&weather=sunny&time=zenith&flavor=light&mood=joy&stage=1&shot=900'],
  ['room3', '/?scene=room&room=guiying&weather=wind&time=geng1&flavor=sweet&mood=think&stage=2&shot=900'],
  ['feast', '/?scene=feast&room=wangyue&weather=sunny&time=zenith&flavor=light&mood=joy&shot=900']
];

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--window-size=1600,900', 'about:blank'
], { stdio: 'ignore' });

let ok = false;
for (let i = 0; i < 60; i++) { try { await getJSON('/json/version'); ok = true; break; } catch (_) { await sleep(250); } }
if (!ok) { console.error('调试端口未就绪'); chrome.kill(); process.exit(1); }

const report = {};
for (const [name, path] of PAGES) {
  const t = (await getJSON('/json/list'))[0];
  const cdp = await CDP.connect(t.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Page.navigate', { url: BASE + path });
  for (let i = 0; i < 70; i++) {
    await sleep(100);
    try {
      const r = await cdp.send('Runtime.evaluate', { expression: 'document.title', returnByValue: true });
      if (r.result?.value === 'READY') break;
    } catch (_) { }
  }
  await sleep(250);
  const r = await cdp.send('Runtime.evaluate', { expression: PROBE, returnByValue: true, awaitPromise: false });
  report[name] = r.result?.value || { error: r.exceptionDetails?.text };
  cdp.close();
  try { await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`); } catch (_) { }
}

chrome.kill();
await sleep(300);
rmSync(profile, { recursive: true, force: true });
writeFileSync('audit.json', JSON.stringify(report, null, 2), 'utf8');

/* ---------------- 判读 ---------------- */
const lines = [];
const flag = (name, cond, msg) => lines.push(`${cond ? '  ✗' : '  ✓'} ${name}　${msg}`);

console.log('\n=== 走廊：门的中轴对齐 ===');
if (report.corridor?.probes?.corridor) {
  const c = report.corridor.probes.corridor;
  console.log('  门洞', JSON.stringify(c.door));
  console.log('  中轴偏移量（门洞/门板/门楣/门牌/宫灯/门槛 的中心极差）:', c.axisSpread, 'px');
  console.log('  门板相对门洞左边:', c.frameVsLeaf, ' 门楣左出檐:', c.lintelOverhangL, ' 右出檐:', c.lintelOverhangR);
  console.log('  门楣底距门洞顶:', c.lintelVsFrameTop, ' 门牌底距门洞顶:', c.plateVsFrame);
  console.log('  宫灯底距门牌顶:', c.lampVsPlate, ' 门槛顶距门洞底:', c.sillVsFrameBottom);
  console.log('  提示条底距门槛顶:', c.hintVsSill, ' 竖联左距门洞右:', c.coupletVsFrameR);
  flag('走廊中轴', c.axisSpread > 2, `极差 ${c.axisSpread}px（应≈0）`);
  flag('门板未偏移', Math.abs(c.frameVsLeaf) > 1, `偏移 ${c.frameVsLeaf}px`);
  flag('门楣左右等宽', Math.abs(c.lintelOverhangL - c.lintelOverhangR) > 1, `左 ${c.lintelOverhangL} / 右 ${c.lintelOverhangR}`);
  flag('门楣压在门洞上', c.lintelVsFrameTop < 0 || c.lintelVsFrameTop > 30, `${c.lintelVsFrameTop}px`);
  flag('宫灯不压门牌', c.lampVsPlate < 0, `${c.lampVsPlate}px`);
  flag('竖联不压门洞', c.coupletVsFrameR < 0, `${c.coupletVsFrameR}px`);
}
if (report.corridor?.probes?.leaf) console.log('  门板变换:', JSON.stringify(report.corridor.probes.leaf));

console.log('\n=== 选天时：条块是否互压 ===');
if (report.sky?.probes?.sky) {
  const s = report.sky.probes.sky;
  const hit = (a, b) => a && b && a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b;
  console.log('  序进条', JSON.stringify(s.seq), '\n  匾额区', JSON.stringify(s.frame), '\n  提问块', JSON.stringify(s.prompt));
  flag('序进条不压匾额', hit(s.seq, s.frame), '');
  flag('提问块不压匾额', hit(s.prompt, s.frame), '');
  flag('提问块不压灯笼面板', hit(s.prompt, s.panel), '');
  flag('读表不压提问', hit(s.readout, s.prompt), '');
  console.log('  天时热点重叠对:', JSON.stringify(report.sky.probes.skyHotOverlap));
}

console.log('\n=== 包间：卡片与底栏 ===');
for (const k of ['room1', 'room2', 'room3']) {
  const r = report[k]?.probes?.room;
  if (!r) { console.log(`  ${k}: 无数据`); continue; }
  console.log(`  [${k}] 幕区`, JSON.stringify(r.stage), '底栏', JSON.stringify(r.cta));
  flag(`${k} 幕区不溢出竖`, (r.overflowY || 0) > 2, `溢出 ${r.overflowY}px`);
  flag(`${k} 幕区不溢出横`, (r.overflowX || 0) > 2, `溢出 ${r.overflowX}px`);
  flag(`${k} 内容不钻到底栏下`, (r.lastChildBottomVsBody || 0) > 4, `超出幕区底 ${r.lastChildBottomVsBody}px`);
}
if (report.room2?.probes?.course) {
  const c = report.room2.probes.course;
  console.log('  课目四栏:', JSON.stringify(c));
  console.log('  行间距:', JSON.stringify(report.room2.probes.courseRowGaps));
  flag('课目文字未溢出', (report.room2.probes.courseTextWidth || 0) > 1, `溢出 ${report.room2.probes.courseTextWidth}px`);
}

console.log('\n=== 成宴：圆桌六盘 ===');
if (report.feast?.probes?.feast) {
  const f = report.feast.probes.feast;
  console.log('  桌面', JSON.stringify(f.table));
  console.log('  六盘半径（占桌半径 %）:', JSON.stringify(f.radiiPct));
  console.log('  越出桌沿的盘数:', f.outOfTable);
  console.log('  菜单名换行情况:', JSON.stringify(f.slotNames));
  flag('六盘都在桌内', f.outOfTable > 0, `越界 ${f.outOfTable} 个`);
  flag('六盘分散均匀', Math.max(...f.radiiPct) - Math.min(...f.radiiPct) > 6, `半径极差 ${(Math.max(...f.radiiPct) - Math.min(...f.radiiPct)).toFixed(1)}%`);
  flag('成宴一屏不溢出', f.ctaBottom > 900, `底栏底 ${f.ctaBottom}px`);
  const wrap = f.slotNames.filter(x => x.wrap).length;
  flag('盘名不换行', wrap > 0, `${wrap} 个换行`);
}

console.log('\n=== 门庭层次 ===');
if (report.gate?.probes?.gate) {
  const g = report.gate.probes.gate;
  console.log('  ' + Object.entries(g).map(([k, v]) => `${k}=(${v.x},${v.y},${v.w}×${v.h})`).join('\n  '));
}

console.log('\n（明细已写入 audit.json）');
const bad = lines.filter(l => l.includes('✗')).length;
console.log(`\n共 ${lines.length} 项检查，${bad} 项不合格`);
process.exitCode = bad ? 1 : 0;
