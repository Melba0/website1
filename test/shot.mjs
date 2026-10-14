/* =========================================================
   test/shot.mjs · 用 CDP 精确截图（Chrome --headless=new + remote-debugging-port）
   用法： node test/shot.mjs <输出目录> [宽] [高]
   ========================================================= */
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, process.argv[2] || 'shots');
const W = Number(process.argv[3] || 1600);
const H = Number(process.argv[4] || 900);
const PORT = 9333;
const BASE = process.env.SHOT_BASE || 'http://127.0.0.1:8787';

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];
const CHROME = CHROME_CANDIDATES.find(p => existsSync(p));
if (!CHROME) { console.error('找不到 Chrome/Edge'); process.exit(1); }

mkdirSync(OUT, { recursive: true });
const profile = join(tmpdir(), 'dsh-shot-' + Date.now());
mkdirSync(profile, { recursive: true });

const SHOTS = [
  ['gate',     '/?shot=2600'],
  ['sky1',     '/?scene=sky&weather=wind&time=midnight&shot=2600'],
  ['sky2',     '/?scene=sky&weather=frost&time=zenith&step=1&shot=2600'],
  ['hall',     '/?scene=hall&weather=rain&time=midnight&shot=2600'],
  ['corridor', '/?scene=corridor&room=jiangyue&weather=rain&time=midnight&shot=2600'],
  ['room1',    '/?scene=room&room=lingnan&weather=frost&time=slant&flavor=strong&allergies=nuts,dairy&mood=reunion&shot=2600'],
  ['room2',    '/?scene=room&room=jinghua&weather=sunny&time=zenith&flavor=light&mood=joy&stage=1&shot=2600'],
  ['room3',    '/?scene=room&room=guiying&weather=wind&time=geng1&flavor=sweet&mood=think&stage=2&shot=2600'],
  ['feast',    '/?scene=feast&room=wangyue&weather=sunny&time=zenith&flavor=light&mood=joy&shot=2600'],
  ['feast2',   '/?scene=feast&room=shuangtian&weather=frost&time=dawn&flavor=spicy&allergies=shrimp,crab&mood=think&shot=2600']
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getJSON(path) {
  const r = await fetch(`http://127.0.0.1:${PORT}${path}`);
  return r.json();
}

/** 极简 CDP 客户端 */
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.waiting = new Map(); this.logs = []; }
  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const c = new CDP(ws);
    ws.onmessage = e => {
      const msg = JSON.parse(e.data);
      if (msg.id && c.waiting.has(msg.id)) {
        const { res, rej } = c.waiting.get(msg.id);
        c.waiting.delete(msg.id);
        msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        c.logs.push('[console.' + msg.params.type + '] ' +
          msg.params.args.map(a => a.value ?? a.description ?? a.type).join(' '));
      } else if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params.exceptionDetails;
        c.logs.push('[exception] ' + (d.exception?.description || d.text));
      } else if (msg.method === 'Log.entryAdded') {
        c.logs.push('[' + msg.params.entry.level + '] ' + msg.params.entry.text);
      }
    };
    return c;
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.waiting.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => { if (this.waiting.has(id)) { this.waiting.delete(id); rej(new Error('CDP 超时: ' + method)); } }, 20000);
    });
  }
  close() { try { this.ws.close(); } catch (_) { } }
}

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--hide-scrollbars', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  `--window-size=${W},${H}`, 'about:blank'
], { stdio: 'ignore' });

let ready = false;
for (let i = 0; i < 60; i++) {
  try { await getJSON('/json/version'); ready = true; break; } catch (_) { await sleep(250); }
}
if (!ready) { console.error('Chrome 调试端口未就绪'); chrome.kill(); process.exit(1); }

const results = [];
for (const [name, path] of SHOTS) {
  const target = await getJSON('/json/new?' + encodeURIComponent('about:blank')).catch(() => null);
  const t = target || (await getJSON('/json/list'))[0];
  const cdp = await CDP.connect(t.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await cdp.send('Page.navigate', { url: BASE + path });
  // 等应用自报就绪（?shot= 到点后把 title 置为 READY），最多等 8 秒
  let ok = false;
  for (let i = 0; i < 80; i++) {
    await sleep(100);
    try {
      const r = await cdp.send('Runtime.evaluate', { expression: 'document.title', returnByValue: true });
      if (r.result && r.result.value === 'READY') { ok = true; break; }
    } catch (_) { }
  }
  await sleep(320);   // 让过渡走完
  let shot = null;
  for (let i = 0; i < 12; i++) {
    try { shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); break; }
    catch (_) { await sleep(700); }
  }
  if (!shot) { results.push(`${name.padEnd(9)} 截图失败`); cdp.close(); continue; }
  const file = join(OUT, name + '.png');
  writeFileSync(file, Buffer.from(shot.data, 'base64'));
  const bad = cdp.logs.filter(l => /exception|error/i.test(l));
  results.push(`${name.padEnd(9)} ${ok ? 'ready' : '未就绪(仍截图)'}  ${bad.length ? '⚠ ' + bad.slice(0, 3).join(' | ') : ''}`);
  cdp.close();
  try { await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`); } catch (_) { }
}

console.log(results.join('\n'));
chrome.kill();
await sleep(400);
try { rmSync(profile, { recursive: true, force: true }); } catch (_) { }
