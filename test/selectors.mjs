/* =========================================================
   test/selectors.mjs · 选择器一致性检查
   把 js/ 里所有 $('#id') / $('.cls') / $('#id .cls') 字面量，
   放到真实 index.html 的 DOM 里比对，防止「JS 找得到的元素，HTML 里没有」。
   node test/selectors.mjs
   ========================================================= */
import { readFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createDocument, parseHTMLFragment } from './dom-shim.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const doc = createDocument(html);

/* 收集 js/ 中的所有选择器字面量 */
const files = readdirSync(join(ROOT, 'js')).filter(f => f.endsWith('.js'));
const found = new Map(); // selector -> [file:line]
const RE = /(?:\$|\$\$|querySelector|querySelectorAll)\(\s*(['"`])([^'"`]+)\1/g;

for (const f of files) {
  const src = readFileSync(join(ROOT, 'js', f), 'utf8');
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    let m;
    RE.lastIndex = 0;
    while ((m = RE.exec(line))) {
      const sel = m[2];
      if (!sel || sel.includes('${')) continue;
      if (!found.has(sel)) found.set(sel, []);
      found.get(sel).push(`${f}:${i + 1}`);
    }
  });
}

/* 逐条验证 */
let bad = 0, ok = 0;
const rows = [];
for (const [sel, where] of found) {
  let count = 0;
  try { count = doc.querySelectorAll(sel).length; } catch (e) { count = -1; }
  // 「运行时才有」的元素：由 JS 动态创建，静态 HTML 里查不到属正常
  const runtime = /^\.(course|cw-door|slot|fcard|guest|sc|hot|modal|tag|ret|note|chips|mini|toast|btn|preview)/.test(sel)
    || /\.(course|cw-door|slot|fcard|guest|hot|sc-bar|door-|pv-)/.test(sel);
  if (count > 0) { ok++; }
  else if (runtime) { rows.push(['动态', sel, where[0]]); }
  else { bad++; rows.push(['缺失', sel, where.join(', ')]); }
}

const dyn = rows.filter(r => r[0] === '动态');
console.log(`选择器共 ${found.size} 条：命中 ${ok} 条，动态生成 ${dyn.length} 条，静态缺失 ${bad} 条`);
if (bad) {
  console.log('\n静态缺失（HTML 里找不到，需检查）：');
  rows.filter(r => r[0] === '缺失').forEach(r => console.log(`  · ${r[1]}　← ${r[2]}`));
}
if (dyn.length) {
  console.log('\n动态生成（运行时才出现，属正常）：');
  dyn.forEach(r => console.log(`  · ${r[1]}　← ${r[2]}`));
}
process.exitCode = bad ? 1 : 0;
