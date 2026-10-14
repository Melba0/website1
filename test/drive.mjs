/* =========================================================
   test/drive.mjs · 在仿真 DOM 中真实走一遍全流程
   node test/drive.mjs
   ========================================================= */
import { installDOM, readIndex } from './dom-shim.mjs';

const html = readIndex();
const { doc, win } = installDOM(html, '');

/* 捕获 --raf 回调，手动推进帧。
   注意：main.js 的帧循环会自己再排一次 rAF，所以这里只保留「本帧待跑的」回调，
   跑完即清空，避免缓冲区指数增长。 */
const frames = [];
globalThis.requestAnimationFrame = cb => { frames.push(cb); return frames.length; };
globalThis.cancelAnimationFrame = () => { };

/* 捕获错误 */
const errors = [];
const origWarn = console.warn, origError = console.error;
console.warn = (...a) => { errors.push('warn: ' + a.join(' ')); origWarn(...a); };
console.error = (...a) => { errors.push('error: ' + a.join(' ')); origError(...a); };
process.on('uncaughtException', e => { errors.push('uncaught: ' + (e && e.stack || e)); });
win.addEventListener('error', e => errors.push('window.error: ' + e.message));

function step(n = 1, dt = 16) {
  for (let i = 0; i < n; i++) {
    const cbs = frames.splice(0, frames.length);   // 取走本帧要跑的回调
    for (const cb of cbs) { try { cb(i * dt + dt); } catch (e) { errors.push('frame: ' + (e.stack || e)); } }
  }
}
const $ = sel => doc.querySelector(sel);
const $$ = sel => Array.from(doc.querySelectorAll(sel));
function click(sel) {
  const el = typeof sel === 'string' ? $(sel) : sel;
  if (!el) { errors.push('click 找不到: ' + sel); return null; }
  el.dispatchEvent({ type: 'click', target: el, preventDefault() { }, stopPropagation() { } });
  return el;
}
function hasTag(node, tag) {
  if (node.tagName && node.tagName.toLowerCase() === tag) return true;
  return (node._children || []).some(c => c instanceof Node && hasTag(c, tag));
}
function check(label, ok, extra = '') {
  console.log(`${ok ? '  ✓' : '  ✗'} ${label}${extra ? '　' + extra : ''}`);
  if (!ok) errors.push('断言失败: ' + label);
}

const app = () => win.__yizhigui;

console.log('① 载入 index.html 与全部模块');
await import('../js/main.js?t=' + Date.now());
step(3);
check('app 已挂载', !!app());
check('开场在门庭', app().scene === 'gate', app().scene);

console.log('② 门庭 → 拾级而上 → 选天时');
click('#btnClimb'); step(4);
check('进入 sky', app().scene === 'sky', app().scene);
for (const w of ['sunny', 'cloudy', 'veiled', 'rain', 'wind', 'frost']) {
  click(`.hot[data-weather="${w}"]`); step(2);
  check(`选天气 ${w}`, app().state.weather === w, app().state.weather);
}
click('#btnWeatherRandom'); step(2);
check('风起随缘有值', !!app().state.weather, app().state.weather);
for (let i = 0; i < 5; i++) {
  click(`#timeTicks button[data-time="${i}"]`); step(2);
  check(`选时刻 ${i}`, app().state.time === ['geng1', 'midnight', 'slant', 'dawn', 'zenith'][i], app().state.time);
}
click('#btnTimeRandom'); step(2);
check('听更有值', !!app().state.time, app().state.time);
check('匾下诗句非空', ($('#skyPoem').textContent || '').length > 4, $('#skyPoem').textContent);

console.log('③ 推门入店 → 大堂');
click('#btnPushDoor');
await new Promise(r => setTimeout(r, 750));
step(4);
check('进入 hall', app().scene === 'hall', app().scene);
check('迎宾语非空', ($('#hallGreet').textContent || '').length > 2, $('#hallGreet').textContent);

console.log('④ 走廊：走过六间、探头、入此间');
click('#btnToCorridor'); step(3);
check('进入 corridor', app().scene === 'corridor', app().scene);
const doors = $$('.cw-door');
check('走廊有六扇门', doors.length === 6, '门数=' + doors.length);
check('门牌写对', doors.map(d => d.querySelector('.door-plate').textContent).join(',') === '桂影阁,望月台,江月榭,霜天阁,岭南轩,京华厅',
  doors.map(d => d.querySelector('.door-plate').textContent).join(','));
step(40);
check('有门被走近半开', doors.some(d => d.classList.contains('open') || d.classList.contains('near')));
click('#btnWalkRight'); step(20);
click('#btnWalkRight'); step(20);
click('#btnWalkLeft'); step(10);
check('前行按钮未崩', app().scene === 'corridor');

click(doors[2]); step(2);
check('探头打开预览', $('#preview').hidden === false);
check('预览写入门名', $('#pvName').textContent === '江月榭', $('#pvName').textContent);
check('预览写入气味', ($('#pvScent').textContent || '').length > 3, $('#pvScent').textContent);
click('#pvBack'); step(2);
check('退出预览', $('#preview').hidden === true);

click(doors[2]); step(2);
click('#pvEnter');
await new Promise(r => setTimeout(r, 500));
step(3);
check('入此间 → room', app().scene === 'room', app().scene);
check('包间为江月榭', app().state.room === 'jiangyue', app().state.room);

console.log('⑤ 包间：口味 / 忌口 / 心愿 / 次序 / 茶饮小菜盘器诗句');
check('六道菜已排', app().state.order.length === 6, app().state.order.join(','));
check('盘器已配', app().state.plates.length === 6, JSON.stringify(app().state.plates));
check('茶饮已配', app().state.tea.length >= 2, JSON.stringify(app().state.tea.map(t => t.name)));
check('小菜已配', app().state.side.length === 2, app().state.side.join(','));
check('诗句已配', app().state.poem[0].length > 3, app().state.poem[0]);
check('课程列表渲染', $$('.course').length === 6, '' + $$('.course').length);
check('口味按钮 8 个', $$('#flavorChips button').length === 8);
check('忌口按钮 9 个', $$('#allergyChips button').length === 9);
check('心愿按钮 6 个', $$('#moodChips button').length === 6);

for (const f of ['light', 'standard', 'strong', 'sweet', 'sour', 'spicy', 'lessalt', 'lessoil']) {
  click(`#flavorChips button[data-flavor="${f}"]`); step(2);
  check(`口味 ${f}`, app().state.flavor === f, app().state.flavor);
}
/* 忌口后小菜尽量规避：池子小于 2 样时才允许沾一样 */
for (const a of ['shrimp', 'crab', 'duck', 'chicken', 'nuts', 'dairy', 'gluten', 'alcohol', 'chenpi']) {
  click(`#allergyChips button[data-allergy="${a}"]`); step(2);
  check(`忌口 ${a}`, app().state.allergies.includes(a), app().state.allergies.join(','));
}
{
  const als = app().state.allergies;
  const hit = s => [
    (als.includes('nuts') && /花生|栗子/.test(s)),
    (als.includes('chenpi') && /陈皮/.test(s)),
    (als.includes('gluten') && /酱萝卜/.test(s)),
    (als.includes('alcohol') && /糟/.test(s))
  ].filter(Boolean).length;
  // 江月榭小菜池
  const raw = ['糟毛豆', '酱萝卜', '醋泡花生', '陈皮梅'];
  const strict = raw.filter(s => hit(s) === 0);
  const fewest = Math.min(...raw.map(hit));
  // 能凑出两样不犯忌的，就一样都不许犯；否则选「犯忌最少」的两样，容忍下限 = 2 × 最少犯忌数
  const expectMax = strict.length >= 2 ? 0 : fewest * 2;
  const got = app().state.side.reduce((n, s) => n + hit(s), 0);
  check('忌口后小菜已规避（池子不足时才放宽）', got <= expectMax,
    `违规 ${got} 处 ≤ ${expectMax} · 上桌：${app().state.side.join('、')}（不犯忌可凑 ${strict.length} 样）`);
}
check('忌口后茶饮被规避', app().state.tea.every(t => !/酒|酿|陈皮/.test(t.name)), app().state.tea.map(t => t.name).join(','));
click('#btnAllergyClear'); step(2);
check('全不忌', app().state.allergies.length === 0);

for (const m of ['think', 'reunion', 'leisure', 'joy', 'cold', 'warm']) {
  click(`#moodChips button[data-mood="${m}"]`); step(2);
  check(`心愿 ${m}`, app().state.mood === m, app().state.mood);
}

const before = app().state.order.join(',');
click('.course[data-id="mooncake"] .c-move button'); step(2);
check('上移改变次序', app().state.order.join(',') !== before, app().state.order.join(','));
click('#btnOrderRecommend'); step(2);
check('先生定序', app().state.order.join(',') === 'shrimp,asparagus,crab,chicken,duck,mooncake', app().state.order.join(','));
click('#btnOrderRandom'); step(2);
check('随缘排序仍是六道', app().state.order.length === 6 && new Set(app().state.order).size === 6, app().state.order.join(','));

const teaA = app().state.tea.map(t => t.name).join(',');
click('#btnTeaShuffle'); step(2);
check('换一换茶饮', app().state.tea.length >= 2, app().state.tea.map(t => t.name).join(','));
click('#btnSideShuffle'); step(2);
check('换一换小菜', app().state.side.length === 2, app().state.side.join(','));
click('#btnPlateShuffle'); step(2);
check('换器仍在本间风格', app().state.plates.every(p => ['青白瓷水波纹盘', '影青平底盘', '白瓷莲瓣碟'].includes(p)), app().state.plates.join(','));
const poemA = app().state.poem[0];
click('#btnPoemShuffle'); step(2);
check('换一句诗', app().state.poem[0].length > 3, app().state.poem[0]);

click('.course .c-act .mini'); step(2);
check('配方弹层打开', $('#recipeModal').hidden === false);
check('配方列了本色配方', $('#recipeBase').children.length >= 3, '' + $('#recipeBase').children.length);
check('配方列了今夜微调', $('#recipeTune').children.length >= 1, '' + $('#recipeTune').children.length);
check('配方有配图 SVG', hasTag($('#recipeArt'), 'svg'), '');
click('#recipeModal .modal-x'); step(1);
check('配方弹层关闭', $('#recipeModal').hidden === true,
  `hidden=${$('#recipeModal').hidden} 关闭钮=${!!$('#recipeModal .modal-x')} 祖先=${!!($('#recipeModal .modal-x') || {}).closest}`);

check('评分有四项', $$('#scoreRow .sc').length === 4);
check('宾客有四位', $$('#guestRow .guest').length === 4);
check('评分注释非空', ($('#scoreComment').textContent || '').length > 5, $('#scoreComment').textContent);

console.log('⑥ 落座成宴');
click('#btnSitDown'); step(4);
check('进入 feast', app().scene === 'feast', app().scene);
check('圆桌六盘', $$('#tableSlots .slot').length === 6, '' + $$('#tableSlots .slot').length);
check('菜卡六张', $$('#feastCards .fcard').length === 6, '' + $$('#feastCards .fcard').length);
check('月光卡有名字', ($('#mcName').textContent || '').includes('·'), $('#mcName').textContent);
check('宴图副题与月光卡一致', $('#feastSub').textContent === $('#mcName').textContent, $('#feastSub').textContent);
check('宴帖文本已生成', (app().state.shareText || '').length > 80, '' + (app().state.shareText || '').length);
check('桌上每盘都是 svg', $$('#tableSlots .slot').every(s => hasTag(s, 'svg')));

const card = app().feast.buildCardSVG();
check('存图 SVG 完整', card.startsWith('<svg') && card.endsWith('</svg>') && !/undefined|NaN/.test(card), card.length + ' 字符');

console.log('⑦ 再走一遍走廊 / 全局随缘 / 抄宴帖');
click('#btnFeastWalk'); step(4);
check('回到走廊', app().scene === 'corridor', app().scene);
click('#btnBackHall'); step(3);
check('回大堂', app().scene === 'hall', app().scene);
click('#btnWaiterPickHall');
await new Promise(r => setTimeout(r, 800));
step(3);
check('小二推荐后回到走廊', app().scene === 'corridor', app().scene);

/* 全局随缘（不经过 room 页也能到 feast 的路径另有，这里走 room） */
click('#btnBackHall'); step(3);
click('#btnToCorridor'); step(3);
click($$('.cw-door')[0]); step(2);
click('#pvEnter');
await new Promise(r => setTimeout(r, 520)); step(3);
check('重入 room', app().scene === 'room', app().scene);
check('重入后包间为桂影阁', app().state.room === 'guiying', app().state.room);
click('#btnGlobalRandom'); step(3);
check('全部重来后仍完整', app().state.tea.length >= 2 && app().state.order.length === 6 && app().state.side.length === 2,
  `${app().state.tea.length}/${app().state.order.length}/${app().state.side.length}`);
check('全部重来后盘器完整', app().state.plates.length === 6, app().state.plates.join(','));

/* 六个包间逐一进入一遍 */
console.log('⑧ 六间逐一推门');
const rooms = ['guiying', 'wangyue', 'jiangyue', 'shuangtian', 'lingnan', 'jinghua'];
for (const r of rooms) {
  click('#btnLeaveRoom'); step(3);
  const door = $$('.cw-door').find(d => d.dataset.room === r);
  click(door); step(2);
  click('#pvEnter');
  await new Promise(res => setTimeout(res, 520)); step(3);
  check(`入 ${r}`, app().state.room === r && app().scene === 'room', app().scene + '/' + app().state.room);
  const deco = $('#roomDeco');
  check(`  ${r} 内饰已画`, deco.innerHTML.length > 2000, deco.innerHTML.length + ' 字符');
  check(`  ${r} 盘器属于本间`, app().state.plates.every(p => {
    const sets = {
      guiying: ['青瓷浅盘', '竹编垫盘', '老木托盘'],
      wangyue: ['白瓷高足盘', '白玉拼盘', '银线攒盘'],
      jiangyue: ['青白瓷水波纹盘', '影青平底盘', '白瓷莲瓣碟'],
      shuangtian: ['冰裂白瓷盘', '青石圆盘', '白瓷梅瓶碟'],
      lingnan: ['广彩花鸟盘', '黄铜暖盘', '藤编垫盘'],
      jinghua: ['景泰蓝珐琅盘', '紫铜暖锅', '朱漆描金盘']
    }[r];
    return sets.includes(p);
  }), app().state.plates.join(','));
  click('#btnSitDown'); step(3);
  check(`  ${r} 成宴`, app().scene === 'feast');
}

console.log('⑨ 六种天气 × 五个时刻 全组合（门庭/选天时/成宴）');
let okCount = 0;
for (const w of ['sunny', 'cloudy', 'veiled', 'rain', 'wind', 'frost']) {
  for (const t of ['geng1', 'midnight', 'slant', 'dawn', 'zenith']) {
    try {
      app().state.weather = w; app().state.time = t;
      app().gate.applyWeather(w, false); app().gate.applyTime(['geng1', 'midnight', 'slant', 'dawn', 'zenith'].indexOf(t), false);
      app().go('sky'); step(3);
      app().go('room'); step(3);
      const c = app().feast.buildCardSVG();
      if (!/undefined|NaN/.test(c)) okCount++;
    } catch (e) { errors.push(`组合 ${w}/${t}: ${e.stack || e}`); }
  }
}
check('30 组天时组合全部可渲染', okCount === 30, okCount + '/30');

console.log('⑩ 收尾');
app().go('gate'); step(3);
check('回门庭', app().scene === 'gate');

/* 输出结论 */
console.log('\n──────────────');
if (errors.length) {
  console.log(`✗ 共 ${errors.length} 处问题：`);
  errors.slice(0, 40).forEach(e => console.log('   · ' + e));
  process.exitCode = 1;
} else {
  console.log('✓ 全流程通过，无运行期错误。');
}
