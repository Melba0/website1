/* =========================================================
   test/audit.mjs · 逐页调 probe.mjs，汇总判读
   用法： node test/audit.mjs
   前置： node server.mjs 8787
   ========================================================= */
import { execFile } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE || 'http://127.0.0.1:8787';
const NODE = process.execPath;

const PAGES = [
  ['gate', '/?shot=800'],
  ['sky', '/?scene=sky&weather=frost&time=zenith&step=1&shot=800'],
  ['hall', '/?scene=hall&weather=rain&time=midnight&shot=800'],
  ['corridor', '/?scene=corridor&room=jiangyue&weather=rain&time=midnight&shot=800'],
  ['room1', '/?scene=room&room=lingnan&weather=frost&time=slant&flavor=strong&allergies=nuts,dairy&mood=reunion&shot=800'],
  ['room2', '/?scene=room&room=jinghua&weather=sunny&time=zenith&flavor=light&mood=joy&stage=1&shot=800'],
  ['room3', '/?scene=room&room=guiying&weather=wind&time=geng1&flavor=sweet&mood=think&stage=2&shot=800'],
  ['feast', '/?scene=feast&room=wangyue&weather=sunny&time=zenith&flavor=light&mood=joy&shot=800']
];

function run(url) {
  return new Promise(res => {
    execFile(NODE, [join(HERE, 'probe.mjs'), url], { maxBuffer: 1 << 24, timeout: 60000 },
      (err, stdout) => res(stdout ? stdout.toString() : JSON.stringify({ error: String(err) })));
  });
}

const report = {};
for (const [name, path] of PAGES) {
  const raw = await run(BASE + path);
  try { report[name] = JSON.parse(raw); } catch (_) { report[name] = { error: '解析失败: ' + raw.slice(0, 200) }; }
  process.stdout.write(`  · ${name} 量完\n`);
}
writeFileSync('audit.json', JSON.stringify(report, null, 2), 'utf8');

const L = [];
const hit = (a, b) => a && b && a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b;
const flag = (name, bad, msg) => L.push(`${bad ? '  ✗' : '  ✓'} ${name}${msg ? '　' + msg : ''}`);

console.log('\n================ 走廊：门的中轴与层叠 ================');
{
  const p = report.corridor?.p;
  if (!p?.door) console.log('  无数据:', JSON.stringify(report.corridor).slice(0, 300));
  else {
    const d = p.door;
    console.log('  门洞:', JSON.stringify(d.parts['.door-frame']));
    console.log('  中轴极差(门洞/门板/门楣/门牌/宫灯/门槛):', d.axisSpread, 'px');
    console.log('  门板偏移:', d.leafOffX, ' 门楣左出檐:', d.lintelL, ' 右出檐:', d.lintelR);
    console.log('  门楣顶距门洞顶:', d.lintelTopGap, ' 门牌底距门洞顶:', d.plateGap, ' 宫灯底距门牌顶:', d.lampGap);
    console.log('  门槛顶距门洞底:', d.sillGap, ' 提示底距门槛顶:', d.hintGap, ' 竖联左距门洞右:', d.coupletGap);
    console.log('  灯柱: 左出', d.postL, ' 右出', d.postR);
    console.log('  门板 transform:', p.leaf?.transform, ' origin:', p.leaf?.origin);
    flag('走廊各件共用中轴', d.axisSpread > 1.5, `极差 ${d.axisSpread}px`);
    flag('门板与门洞同心', Math.abs(d.leafOffX) > 1, `偏移 ${d.leafOffX}px`);
    flag('门楣左右等宽', Math.abs(d.lintelL - d.lintelR) > 1, `左 ${d.lintelL} / 右 ${d.lintelR}`);
    flag('门楣压在门洞上沿', d.lintelTopGap < -4 || d.lintelTopGap > 34, `${d.lintelTopGap}px`);
    flag('宫灯不压门牌', d.lampGap < 0, `间隙 ${d.lampGap}px`);
    flag('门牌不压门洞', d.plateGap < 0, `间隙 ${d.plateGap}px`);
    flag('竖联不压门洞', d.coupletGap < 0, `间隙 ${d.coupletGap}px`);
    flag('门槛贴门洞底', Math.abs(d.sillGap) > 14, `错位 ${d.sillGap}px`);
    flag('灯柱左右对称', Math.abs(Math.abs(d.postL) - Math.abs(d.postR)) > 6, `左 ${d.postL} / 右 ${d.postR}`);
  }
}

console.log('\n================ 门庭：层次与对位 ================');
{
  const p = report.gate?.p;
  if (!p) console.log('  无数据');
  else {
    for (const k of ['branch', 'branchC', 'moon', 'title', 'house', 'plaque', 'jar', 'cta']) {
      if (p[k]) console.log(`  ${k.padEnd(8)} x=${p[k].x} y=${p[k].y} ${p[k].w}×${p[k].h} 中心(${p[k].cx},${p[k].cy})`);
    }
    flag('匾额不压标题', hit(p.plaque, p.title), '');
    flag('水缸不压匾额', hit(p.jar, p.plaque), '');
    flag('桂枝不压标题', hit(p.branch, p.title), `枝 ${p.branch?.y}–${p.branch?.b} / 题 ${p.title?.y}–${p.title?.b}`);
  }
}

console.log('\n================ 选天时：条块互压 ================');
{
  const p = report.sky?.p;
  if (!p) console.log('  无数据');
  else {
    for (const k of ['seq', 'frame', 'poem', 'prompt', 'readout', 'panel', 'cta', 'random', 'lantern']) {
      if (p[k]) console.log(`  ${k.padEnd(8)} x=${p[k].x} y=${p[k].y} ${p[k].w}×${p[k].h}`);
    }
    flag('序进条不压匾额区', hit(p.seq, p.frame), '');
    flag('提问块不压匾额区', hit(p.prompt, p.frame), '');
    flag('提问块不压灯笼面板', hit(p.prompt, p.panel), '');
    flag('提问块不压读表', hit(p.prompt, p.readout), '');
    flag('读表不压灯笼面板', hit(p.readout, p.panel), '');
    flag('热点互不重叠', (p.hotOverlap || []).length > 0, JSON.stringify(p.hotOverlap));
    flag('更次按钮不压底栏', hit(p.ticks?.[0], p.cta), '');
  }
}

console.log('\n================ 大堂：匾额/迎宾/按钮 ================');
{
  const p = report.hall?.p;
  if (!p) console.log('  无数据');
  else {
    for (const k of ['title', 'board', 'boardList', 'greet', 'cta', 'hl1', 'hl2', 'hl3']) {
      if (p[k]) console.log(`  ${k.padEnd(10)} x=${p[k].x} y=${p[k].y} ${p[k].w}×${p[k].h}`);
    }
    flag('水牌文字在水牌之内', !(p.boardList.x >= p.board.x - 2 && p.boardList.r <= p.board.r + 2),
      `文 ${p.boardList.x}–${p.boardList.r} / 牌 ${p.board.x}–${p.board.r}`);
    flag('迎宾不压按钮', hit(p.greet, p.cta), '');
    flag('标题与灯笼不重叠', hit(p.title, p.hl1), `题右 ${p.title.r} / 灯左 ${p.hl1.x}`);
  }
}

console.log('\n================ 包间三幕 ================');
for (const k of ['room1', 'room2', 'room3']) {
  const p = report[k]?.p;
  if (!p) { console.log(`  ${k}: 无数据`); continue; }
  console.log(`  [${k}] 头 x=${p.head?.x} y=${p.head?.y} ${p.head?.w}×${p.head?.h}｜栏 ${p.tabs?.w}×${p.tabs?.h}｜幕 y=${p.stage?.y} h=${p.stage?.h}｜底栏 y=${p.cta?.y}`);
  console.log(`        幕内溢出 横 ${p.overflowX} 竖 ${p.overflowY}｜卡片数 ${p.countCards}｜课目数 ${p.countCourses}｜末子底距幕底 ${p.lastKidBottom}`);
  if (p.retCards?.length) console.log('        佐宴卡片:', p.retCards.map(c => `${c.w}×${c.h}@${c.x},${c.y}`).join(' '));
  flag(`${k} 幕区无横向溢出`, p.overflowX > 2, `溢出 ${p.overflowX}px`);
  flag(`${k} 幕区无纵向溢出`, p.overflowY > 2, `溢出 ${p.overflowY}px`);
  flag(`${k} 内容不钻到底栏下`, p.lastKidBottom > 6, `超出幕区底 ${p.lastKidBottom}px`);
  flag(`${k} 幕区不压底栏`, hit(p.stage, p.cta), '');
  flag(`${k} 幕区不压头部`, hit(p.stage, p.head), '');
}
{
  const p = report.room2?.p;
  if (p?.course) {
    console.log('\n  贰上菜·课目四栏:');
    for (const k of ['.c-no', '.c-thumb', '.c-main', '.c-act', '.adj', '.c-name']) {
      if (p['course' + k]) console.log(`    ${k.padEnd(9)} x=${p['course' + k].x} y=${p['course' + k].y} ${p['course' + k].w}×${p['course' + k].h}`);
    }
    console.log('    课目行高:', p.courseH, ' 微调框高:', p.adjH, ' 文字溢出:', p.courseTextOverflow);
    flag('课目文字不溢出', p.courseTextOverflow > 1, `溢出 ${p.courseTextOverflow}px`);
    flag('微调框够高（不挤）', p.adjH < 40, `仅 ${p.adjH}px`);
  }
}

console.log('\n================ 成宴：圆桌与卡片 ================');
{
  const p = report.feast?.p;
  if (!p) console.log('  无数据');
  else {
    console.log('  桌面:', JSON.stringify(p.table));
    console.log('  六盘半径(占桌半径%):', JSON.stringify(p.radii));
    console.log('  越出桌沿:', p.outside, '｜菜卡数:', p.cardCount);
    console.log('  盘名:', JSON.stringify(p.slotNames));
    console.log('  头 y=', p.head?.y, '备注 y=', p.notes?.y, '菜卡 y=', p.cards?.y, '月光卡 y=', p.moon?.y, '底栏底=', p.cta?.b);
    console.log('  inner 溢出:', JSON.stringify(p.innerScroll));
    flag('六盘都在桌内', p.outside > 0, `${p.outside} 个越界`);
    if (p.radii.length) flag('六盘半径均匀', Math.max(...p.radii) - Math.min(...p.radii) > 6, `极差 ${(Math.max(...p.radii) - Math.min(...p.radii)).toFixed(1)}%`);
    else L.push('  ✓ 成宴起始：桌上空着，等上菜');
    flag('盘名不截断', (p.slotNames || []).some(x => x.clipped), '');
    flag('底栏在视口内', p.cta.b > 900, `底 ${p.cta.b}px`);
    flag('月光卡在底栏之上', p.moon.b > p.cta.y, `卡底 ${p.moon.b} / 栏顶 ${p.cta.y}`);
  }
}

const bad = L.filter(x => x.includes('✗')).length;
console.log('\n================ 结论 ================');
L.forEach(x => console.log(x));
console.log(`\n共 ${L.length} 项，${bad} 项不合格（明细见 audit.json）`);
