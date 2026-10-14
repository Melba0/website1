/* =========================================================
   test/probe.mjs · 单页几何探针（一次只量一页，独立 Chrome，最稳）
   用法： node test/probe.mjs "http://127.0.0.1:8787/?scene=corridor&...&shot=900"
   输出： 一行 JSON（量测结果）到 stdout
   ========================================================= */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL_ = process.argv[2];
if (!URL_) { console.error('用法: node test/probe.mjs <url>'); process.exit(2); }
const PORT = 9350 + Math.floor(Math.random() * 200);
const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find(existsSync);
if (!CHROME) { console.error('找不到浏览器'); process.exit(1); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
const profile = join(tmpdir(), 'dsh-probe-' + Date.now());
mkdirSync(profile, { recursive: true });

const PROBE = `(() => {
  const box = el => { const r = el.getBoundingClientRect();
    return { x:+r.x.toFixed(1), y:+r.y.toFixed(1), w:+r.width.toFixed(1), h:+r.height.toFixed(1),
             cx:+(r.x+r.width/2).toFixed(1), cy:+(r.y+r.height/2).toFixed(1),
             r:+r.right.toFixed(1), b:+r.bottom.toFixed(1) }; };
  const q = s => document.querySelector(s);
  const qa = s => Array.from(document.querySelectorAll(s));
  const out = { vw: innerWidth, vh: innerHeight, scene: document.getElementById('app').dataset.scene, p: {} };
  const P = out.p;

  const door = q('.cw-door');
  if (door) {
    const parts = {};
    for (const s of ['.door-frame','.door-leaf','.door-lintel','.door-plate','.door-couplet','.door-lamp','.door-hint','.door-sill','.door-post.pl','.door-post.pr']) {
      const n = door.querySelector(s); if (n) parts[s] = box(n);
    }
    const cx = k => parts[k] ? parts[k].cx : null;
    const axisKeys = ['.door-frame','.door-leaf','.door-lintel','.door-plate','.door-lamp','.door-sill'];
    const cxs = axisKeys.map(cx).filter(v => v !== null);
    P.door = {
      parts,
      axisSpread: +(Math.max(...cxs) - Math.min(...cxs)).toFixed(1),
      leafOffX: parts['.door-leaf'].x - parts['.door-frame'].x,
      lintelL: +(parts['.door-frame'].x - parts['.door-lintel'].x).toFixed(1),
      lintelR: +(parts['.door-lintel'].r - parts['.door-frame'].r).toFixed(1),
      lintelTopGap: +(parts['.door-frame'].y - parts['.door-lintel'].y).toFixed(1),
      plateGap: +(parts['.door-frame'].y - parts['.door-plate'].b).toFixed(1),
      lampGap: +(parts['.door-plate'].y - parts['.door-lamp'].b).toFixed(1),
      sillGap: +(parts['.door-sill'].y - parts['.door-frame'].b).toFixed(1),
      hintGap: +(parts['.door-sill'].y - parts['.door-hint'].b).toFixed(1),
      coupletGap: +(parts['.door-couplet'].x - parts['.door-frame'].r).toFixed(1),
      postL: parts['.door-post.pl'] ? +(parts['.door-post.pl'].x - parts['.door-frame'].x).toFixed(1) : null,
      postR: parts['.door-post.pr'] ? +(parts['.door-post.pr'].r - parts['.door-frame'].r).toFixed(1) : null
    };
    const leaf = door.querySelector('.door-leaf');
    const cs = getComputedStyle(leaf);
    P.leaf = { transform: cs.transform, origin: cs.transformOrigin };
  }

  if (out.scene === 'gate') {
    for (const [n, s] of [['branch','.branch-a'],['branchC','.branch-c'],['moon','.moonwrap'],['title','.gate-title'],['house','.gate-house'],['jar','.jar-wrap'],['cta','.gate-cta'],['plaque','.plaque']]) {
      const e = q(s); if (e) P[n] = box(e);
    }
  }

  if (out.scene === 'sky') {
    for (const [n, s] of [['seq','#seqBar'],['frame','.sky-frame'],['poem','#skyPoem'],['prompt','#seqPrompt'],['readout','.sky-readout'],['panel','#timePanel'],['cta','.sky-cta'],['random','.sky-random'],['lantern','#lanternDrag']]) {
      const e = q(s); if (e && !e.hidden) P[n] = box(e);
    }
    P.hot = qa('.hot').map(box);
    P.hotOverlap = [];
    for (let i=0;i<P.hot.length;i++) for (let j=i+1;j<P.hot.length;j++) {
      const a=P.hot[i], b=P.hot[j];
      if (a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b) P.hotOverlap.push([i,j]);
    }
    P.ticks = qa('#timeTicks button').map(box);
  }

  if (out.scene === 'room') {
    for (const [n, s] of [['head','.room-head'],['body','.room-body'],['tabs','#stageTabs'],['stage','.stage.on'],['cta','.room-cta']]) {
      const e = q(s); if (e) P[n] = box(e);
    }
    const st = q('.stage.on');
    if (st) {
      P.overflowX = st.scrollWidth - st.clientWidth;
      P.overflowY = st.scrollHeight - st.clientHeight;
      const kids = Array.from(st.children).map(box);
      P.lastKidBottom = kids.length ? +(kids[kids.length-1].b - P.stage.b).toFixed(1) : null;
      P.kidGaps = kids.slice(1).map((k,i)=>+(k.y - kids[i].b).toFixed(1));
      P.countCards = qa('.stage.on .card').length;
      P.countCourses = qa('.stage.on .course').length;
      P.retCards = qa('.stage.on .ret-grid .card').map(box);
    }
    const tab = q('.stab.on');
    if (tab) P.tabActive = box(tab);
    const c = q('.course');
    if (c) {
      for (const s of ['.c-no','.c-thumb','.c-main','.c-act','.adj','.c-name']) { const e=c.querySelector(s); if (e) P['course'+s] = box(e); }
      const m = c.querySelector('.c-main');
      P.courseTextOverflow = m ? m.scrollWidth - m.clientWidth : null;
      P.courseH = c.getBoundingClientRect().height;
      P.adjH = c.querySelector('.adj') ? c.querySelector('.adj').getBoundingClientRect().height : null;
    }
  }

  if (out.scene === 'feast') {
    const t = q('.table-stage');
    if (t) {
      const tb = box(t); const R = Math.min(tb.w, tb.h)/2;
      P.table = tb;
      P.slots = qa('.slot').map(box);
      P.radii = P.slots.map(s => +(Math.hypot(s.cx-tb.cx, s.cy-tb.cy)/R*100).toFixed(1));
      P.outside = P.slots.filter(s => Math.hypot(s.cx-tb.cx, s.cy-tb.cy) + Math.min(s.w,s.h)/2 > R).length;
      P.slotNames = qa('.slot-name').map(n => ({ t:n.textContent, w:+n.getBoundingClientRect().width.toFixed(1), clipped: n.scrollWidth > n.clientWidth+1 }));
      P.centerName = box(q('.table-center'));
    }
    for (const [n,s] of [['notes','.feast-notes'],['cards','#feastCards'],['moon','.moon-card'],['cta','.feast-cta'],['head','.feast-head']]) { const e=q(s); if (e) P[n]=box(e); }
    P.innerScroll = (()=>{ const i=q('.feast-inner'); return { x:i.scrollWidth-i.clientWidth, y:i.scrollHeight-i.clientHeight }; })();
    P.cardCount = qa('.fcard').length;
  }

  if (out.scene === 'hall') {
    for (const [n,s] of [['title','.hall-text'],['board','#hallBoard'],['greet','.hall-greet'],['cta','.hall-cta'],['hl1','.hl1'],['hl2','.hl2'],['hl3','.hl3']]) { const e=q(s); if (e) P[n]=box(e); }
    const bt = q('.hall-board-list');
    if (bt) P.boardList = box(bt);
  }
  return out;
})()`;

async function getJSON(p) { return (await fetch(`http://127.0.0.1:${PORT}${p}`)).json(); }

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--window-size=1600,900', '--hide-scrollbars', URL_
], { stdio: 'ignore' });

try {
  let list = null;
  for (let i = 0; i < 80; i++) {
    try { list = await getJSON('/json/list'); if (list.length) break; } catch (_) { }
    await sleep(250);
  }
  const page = (list || []).find(t => t.type === 'page');
  if (!page) throw new Error('没有 page 目标');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const wait = new Map();
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && wait.has(m.id)) { const { res, rej } = wait.get(m.id); wait.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
  };
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id; wait.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method, params }));
    setTimeout(() => { if (wait.has(i)) { wait.delete(i); rej(new Error('超时 ' + method)); } }, 20000);
  });

  await send('Runtime.enable');
  // 等应用自报 READY（?shot= 到点会置 title）
  let ready = false;
  for (let i = 0; i < 90; i++) {
    await sleep(120);
    try {
      const r = await send('Runtime.evaluate', { expression: 'document.title + "|" + (window.__yizhigui ? window.__yizhigui.scene : "?")', returnByValue: true });
      const v = r.result?.value || '';
      if (v.startsWith('READY')) { ready = true; break; }
    } catch (_) { }
  }
  await sleep(220);
  const r = await send('Runtime.evaluate', { expression: PROBE, returnByValue: true });
  const out = r.result?.value ?? { error: r.exceptionDetails?.text || '探针无返回' };
  out.__ready = ready;
  process.stdout.write(JSON.stringify(out));
  ws.close();
} catch (e) {
  process.stdout.write(JSON.stringify({ error: String(e && e.message || e) }));
} finally {
  chrome.kill();
  await sleep(250);
  try { rmSync(profile, { recursive: true, force: true }); } catch (_) { }
}
process.exit(0);
