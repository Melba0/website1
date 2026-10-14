/* =========================================================
   pair.js · 搭配引擎
   包间 × 天时 × 口味 × 忌口 × 上菜次序 × 心愿
   → 自动配出 微调配方 / 茶饮 / 小菜 / 盘器 / 诗句 / 宾客反应
   ========================================================= */
import {
  DISHES, dishById, allergenName, MOOD_POEMS, WEATHER_POEM_HINT,
  GUEST_PROFILES, CLASSIC_ORDER, moodById, TEAS
} from './data.js';
import { pick, randInt } from './util.js';

export const dishTag = d => ({
  clear: d.heavy <= 3,
  rich: d.heavy >= 6,
  veg: d.meat <= 2,
  meat: d.meat >= 6,
  sweet: d.sweet >= 6
});

/* ---------- 1. 微调配方 ---------- */
/** 少盐/少油 与 清淡 同基底，再补一条更细的调整 */
export function tuneOf(dish, flavorId) {
  const out = [];
  if (flavorId === 'lessalt') {
    out.push(...(dish.tune.lessalt || dish.tune.light || []));
    if (!dish.tune.lessalt) out.push('盐减半，用鲜味顶');
  } else if (flavorId === 'lessoil') {
    out.push(...(dish.tune.lessoil || dish.tune.light || []));
    if (!dish.tune.lessoil) out.push('撇净浮油，改蒸或炖');
  } else if (flavorId === 'light') {
    out.push(...(dish.tune.light || []));
  } else {
    out.push(...(dish.tune[flavorId] || []));
  }
  return out;
}
export const tuneRaw = tuneOf;

/* ---------- 2. 替换 ---------- */
export function swapOf(dish, allergies) {
  const hit = [];
  for (const s of dish.swaps) {
    if (allergies.includes(s.for)) hit.push(s);
  }
  return hit;
}
/** 忌口是否真正命中这道菜（用于标记） */
export function allergyHits(dish, allergies) {
  return dish.swaps.filter(s => allergies.includes(s.for)).map(s => s.for);
}

/* ---------- 3. 盘器 ---------- */
export function pickPlate(room, dish, flavorId) {
  const set = room.platingSet;
  const light = ['light', 'lessoil', 'lessalt'].includes(flavorId);
  const heavy = ['strong', 'spicy'].includes(flavorId);
  const cold = ['shrimp', 'mooncake'].includes(dish.id);
  if (light) return set.find(p => /青白|冰裂|白瓷|影青/.test(p)) || set[0];
  if (heavy) return set.find(p => /铜|珐琅|木|石|漆/.test(p)) || set[set.length - 1];
  if (cold) return set.find(p => /玉|银|青白|白瓷/.test(p)) || set[1] || set[0];
  return set[randInt(0, set.length - 1)];
}

/** 茶饮池的总过滤：酒精、陈皮 */
function teaAllowed(t, allergies, room) {
  if (allergies.includes('alcohol') && /酒|酿/.test(t)) return false;
  if (allergies.includes('chenpi') && /陈皮/.test(t)) return false;
  return room.teaPool.includes(t);
}

/* ---------- 4. 茶饮 ---------- */
export function buildTea(room, weather, time, flavorId, allergies, rnd = Math.random) {
  const pool = room.teaPool.filter(t => teaAllowed(t, allergies, room));
  const coldOK = weather.cold < .45 && time.chill < .7 && !['hot'].includes(weather.teaBias);
  const warmDay = weather.teaBias === 'warm' || weather.teaBias === 'hot' || weather.cold >= .55 || time.chill >= .8;

  let coldPool = pool.filter(t => !TEAS[t]?.hot);
  const hotPool = pool.filter(t => TEAS[t]?.hot);
  if (!coldOK) coldPool = [];

  const out = [];
  const used = new Set();
  const take = (arr, fallback) => {
    const cand = arr.filter(t => !used.has(t));
    const t = cand.length ? cand[Math.floor(rnd() * cand.length)] : (fallback && !used.has(fallback) ? fallback : null);
    if (t) used.add(t);
    return t;
  };
  const pre = coldOK && coldPool.length ? take(coldPool) : take(hotPool);
  if (pre) out.push({ name: pre, stage: '前段', note: TEAS[pre]?.note || '' });
  // 中段：与口味配
  let midPool = hotPool.filter(t => {
    if (['light', 'lessoil', 'lessalt'].includes(flavorId)) return /龙井|白茶|茉莉|铁观音/.test(t);
    if (['strong', 'spicy'].includes(flavorId)) return /普洱|单丛|乌龙|黄酒|姜/.test(t);
    if (['sweet', 'sour'].includes(flavorId)) return /柚子|桂花|乌龙|白茶/.test(t);
    return true;
  });
  if (!midPool.length) midPool = hotPool;
  const mid = take(midPool);
  if (mid && mid !== pre) out.push({ name: mid, stage: '后段', note: TEAS[mid]?.note || '' });
  if (!mid && pre) out[0].stage = '全席';
  // 甜品配
  let finPool = pool.filter(t => /柚子|桂花|白茶|普洱|姜/.test(t));
  if (!finPool.length) finPool = pool;
  const fin = take(finPool, '柚子茶');
  if (fin && fin !== pre && fin !== mid) out.push({ name: fin, stage: '配月饼', note: TEAS[fin]?.note || '' });
  if (!fin && out.length) out[out.length - 1].stage = '配月饼';
  void warmDay;
  return out;
}

/* ---------- 5. 小菜 ---------- */
/** 每样小菜可能沾的忌口 */
function sideHits(s, allergies) {
  return [
    allergies.includes('nuts') && /花生|栗子/.test(s),
    allergies.includes('chenpi') && /陈皮/.test(s),
    allergies.includes('gluten') && /酱萝卜/.test(s),
    allergies.includes('alcohol') && /糟/.test(s)
  ].filter(Boolean).length;
}
export function buildSide(room, allergies, rnd = Math.random) {
  const raw = room.sidePool.slice();
  // 先取完全不犯忌的；凑不齐两样，再按「犯忌最少」补，而不是整池放开
  const scored = raw
    .map(s => ({ s, hit: sideHits(s, allergies), k: rnd() }))
    .sort((a, b) => (a.hit - b.hit) || (a.k - b.k));
  const strict = scored.filter(o => o.hit === 0);
  const chosen = (strict.length >= 2 ? strict : scored).slice(0, 2).map(o => o.s);
  return chosen;
}

/* ---------- 6. 诗句 ---------- */
export function buildPoem(room, weather, time, moodId, rnd = Math.random) {
  const hint = WEATHER_POEM_HINT[weather.id] || [];
  const moodPool = MOOD_POEMS[moodId] || [];
  const cands = [];
  // 心愿池 × 本间诗人
  for (const p of moodPool) {
    if (room.poemPool.some(q => q[0] === p[0])) cands.push({ p, w: 3 });
  }
  for (const p of room.poemPool) {
    let w = 1;
    if (room.poets.some(po => p[1].includes(po))) w += 1.6;
    if (hint.some(h => p[0].includes(h))) w += 1.2;
    cands.push({ p, w });
  }
  if (!cands.length) return room.poemPool[0];
  const total = cands.reduce((s, c) => s + c.w, 0);
  let r = rnd() * total;
  for (const c of cands) { r -= c.w; if (r <= 0) return c.p; }
  return cands[0].p;
}

/* ---------- 7. 上菜次序 ---------- */
const EMPTY_SCORE = { balance: 0, order: 0, rich: 0, temp: 0, sweetCurve: 0, story: 0, overall: 0 };

export function computeScore(orderIds) {
  if (!orderIds || !orderIds.length) return { ...EMPTY_SCORE };
  const ds = orderIds.map(dishById);
  const tags = ds.map(dishTag);
  const n = ds.length;
  // 清浓相济：清与浓交替
  let alt = 0;
  for (let i = 0; i < n; i++) {
    const cur = tags[i];
    if (cur.clear && !cur.rich) alt += 1;
    else if (cur.rich && !cur.clear) alt += 1;
    else alt += .5;
  }
  let balAcc = 0;
  for (let i = 1; i < n; i++) {
    const a = tags[i - 1], b = tags[i];
    balAcc += (a.clear !== b.clear || a.rich !== b.rich) ? 1 : .25;
  }
  const balance = Math.round(((alt / n) * .4 + (balAcc / (n - 1)) * .6) * 100);

  // 浓淡曲线：越往后越厚，月饼最甜收尾
  const ideal = [.12, .22, .48, .62, .82, .95];
  let dist = 0;
  for (let i = 0; i < n; i++) {
    const heav = ds[i].heavy / 10 * .6 + (i === n - 1 && ds[i].id === 'mooncake' ? .4 : ds[i].sweet / 10 * .3);
    dist += Math.abs(heav - ideal[Math.min(i, ideal.length - 1)]);
  }
  const order = Math.max(0, Math.round(100 - dist / n * 100));

  const richDish = ds.reduce((a, b) => (b.heavy > a.heavy ? b : a), ds[0]);
  const richIdx = ds.indexOf(richDish);
  const rich = Math.max(0, Math.round(100 - Math.abs(richIdx - 3.2) * 22));

  let temp = 100;
  if (ds[0].warm > 1) temp -= 26;
  for (let i = 1; i < n; i++) if (ds[i - 1].warm >= 3 && ds[i].warm <= 1) temp -= 12;
  const firstSweet = ds.findIndex(d => d.sweet >= 7);
  if (firstSweet > -1 && firstSweet < n - 2) temp -= 16;
  temp = Math.max(0, temp);

  const sweetFirst = ds.findIndex(d => d.sweet >= 7);
  const sweetCurve = Math.max(0, Math.round(
    100 - Math.abs((sweetFirst === -1 ? n : sweetFirst + 1) - n) * 17
  ));

  const meatIdx = ds.map((d, i) => (d.meat >= 6 ? i : -1)).filter(i => i >= 0);
  const story = Math.max(0, Math.round(
    100 - Math.abs((meatIdx.length ? meatIdx.reduce((a, b) => a + b, 0) / meatIdx.length : 2) - 3) * 26
      - (ds[n - 1].id === 'mooncake' ? 0 : 22)
  ));

  const overall = Math.round(balance * .34 + order * .34 + temp * .16 + sweetCurve * .16);
  return { balance, order, rich, temp, sweetCurve, story, overall };
}

export function guestReactions(score) {
  return GUEST_PROFILES.map(g => {
    const v = Math.round(g.like(score));
    const level = v >= 78 ? 'high' : v >= 52 ? 'mid' : 'low';
    return { id: g.id, name: g.name, value: v, level, text: g.words[level] };
  });
}

/** 先生定序：最稳的次序（在经典次序基础上按口味做微调）*/
export function recommendOrder(flavorId) {
  const ids = CLASSIC_ORDER.slice();
  if (flavorId === 'strong' || flavorId === 'spicy') {
    // 浓香/偏辣：把最重的提前半位，仍以月饼收尾
    return ['asparagus', 'shrimp', 'crab', 'duck', 'chicken', 'mooncake'];
  }
  if (flavorId === 'sweet') {
    return ['shrimp', 'asparagus', 'crab', 'chicken', 'duck', 'mooncake'];
  }
  return ids;
}

/* ---------- 8. 宴名 / 月光卡文案 ---------- */
export function feastName(room, weather, time, moodId) {
  const m = moodById(moodId);
  return `${room.name}·${weather.name}${time.name}·${m.feast}`;
}
export function sharingText(state) {
  const { room, weather, time, mood, dishes, flavors, allergies, tea, side, poem, score, order } = state;
  const m = moodById(mood);
  const fl = { light: '清淡', standard: '标准', strong: '浓香', sweet: '偏甜', sour: '偏酸', spicy: '偏辣', lessalt: '少盐', lessoil: '少油' }[flavors[0]] || '标准';
  const L = [];
  L.push(`【一枝桂赏月宴】${room.name}·${weather.name}${time.name}·${m.feast}`);
  L.push(`天时：${weather.name} · ${time.name}（${time.moonLabel}）　心愿：${m.name}　口味：${fl}`);
  L.push(`忌口：${allergies.length ? allergies.map(allergenName).join('、') : '不忌'}`);
  L.push('');
  L.push('上菜次第：');
  order.forEach((id, i) => {
    const d = dishById(id);
    const tune = tuneOf(d, flavors[0]);
    L.push(`${i + 1}. ${d.name}${tune.length ? `（${tune.join('；')}）` : ''}`);
  });
  L.push('');
  L.push(`茶饮：${tea.map(t => `${t.stage}${t.name}`).join('，')}`);
  L.push(`小菜：${side.join('、')}`);
  L.push(`盘器：${(state.plates || []).join('、')}`);
  L.push(`诗句：${poem[0]} —— ${poem[1]}`);
  L.push(`席面评分：${score.overall} 分（清浓相济 ${score.balance} · 浓淡次第 ${score.order}）`);
  L.push('');
  L.push('推门入店，看天时，穿走廊，挑包间，落座成宴。');
  return L.join('\n');
}

/* ---------- 9. 一次配齐 ---------- */
export function autoPair({ room, weather, time, flavor, allergies, moodId, order, rnd = Math.random }) {
  const ids = order && order.length ? order : recommendOrder(flavor);
  const dishes = DISHES.map(d => {
    const tune = tuneRaw(d, flavor);
    const swaps = swapOf(d, allergies);
    return { dish: d, tune, swaps, plate: pickPlate(room, d, flavor) };
  });
  return {
    order: ids,
    dishes,
    tea: buildTea(room, weather, time, flavor, allergies, rnd),
    side: buildSide(room, allergies, rnd),
    poem: buildPoem(room, weather, time, moodId, rnd),
    score: computeScore(ids)
  };
}

/** 小二推荐一间：偏爱与天时相合的包间（不排除其他，只是加权重抽） */
export function recommendRoom(rooms, weather, time, rnd = Math.random) {
  const weight = r => {
    let s = 1;
    if (weather.cold > .7 && (r.id === 'shuangtian' || r.id === 'jinghua')) s += 1.6;
    if (weather.id === 'rain' && r.id === 'jiangyue') s += 1.4;
    if (weather.id === 'wind' && r.id === 'guiying') s += 1.6;
    if (time.id === 'zenith' && r.id === 'wangyue') s += 1.8;
    if (time.chill > .8 && r.id === 'shuangtian') s += 1.4;
    if (time.id === 'geng1' && r.id === 'lingnan') s += 1.2;
    return s * s;
  };
  const total = rooms.reduce((s, r) => s + weight(r), 0);
  let x = rnd() * total;
  for (const r of rooms) { x -= weight(r); if (x <= 0) return r; }
  return rooms[0];
}
