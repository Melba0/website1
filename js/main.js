/* =========================================================
   main.js · 一枝桂赏月宴 · 总纲
   到店 → 看天时 → 推门 → 迎宾 → 大堂 → 走廊 → 包间 → 落座 → 上菜 → 生成月宴图
   ========================================================= */
import { $, $$, pick, emitter } from './util.js';
import { WEATHERS, TIMES, ROOMS, FLAVORS, MOODS } from './data.js';
import { recommendRoom } from './pair.js';
import * as audio from './audio.js';
import { initGate } from './gate.js';
import { initHall } from './hall.js';
import { initCorridor } from './corridor.js';
import { initRoom, roomRerender } from './room.js';
import { initFeast } from './feast.js';

/* ---------------- 应用骨架 ---------------- */
const app = {
  scene: 'gate',
  state: {
    weather: 'sunny',
    time: 'midnight',
    room: null,
    flavor: 'standard',
    allergies: [],
    mood: 'reunion',
    order: [],
    plates: [],
    tea: [],
    side: [],
    poem: ['', ''],
    score: null,
    shareText: ''
  },
  bus: emitter(),
  pair: { ov: { tea: false, side: false, poem: false, plates: false, order: false } },
  _animators: [],
  _enter: new Map()
};

/* ---------------- 循环 ---------------- */
let last = performance.now();
let frozen = false;
function frame(now) {
  if (frozen) return;                 // 冻结后彻底停掉 rAF，页面进入空闲，截图/打印才拿得到帧
  const dt = Math.min(.05, (now - last) / 1000);
  last = now;
  for (const fn of app._animators) {
    try { fn(dt); } catch (e) { console.warn(e); }
  }
  requestAnimationFrame(frame);
}
app.animate = fn => { app._animators.push(fn); };
app.freeze = () => { frozen = true; };
app.onEnter = (scene, fn) => {
  if (!app._enter.has(scene)) app._enter.set(scene, []);
  app._enter.get(scene).push(fn);
};

/* ---------------- 场景切换 ---------------- */
function go(scene, opts) {
  if (scene === app.scene) {
    (app._enter.get(scene) || []).forEach(fn => fn(opts));
    return;
  }
  const prev = $(`#scene-${app.scene}`);
  const next = $(`#scene-${scene}`);
  if (prev) { prev.classList.remove('is-active'); prev.classList.add('is-leaving'); }
  app.scene = scene;
  $('#app').dataset.scene = scene;
  if (next) {
    next.classList.remove('is-leaving');
    next.classList.add('is-active');
  }
  setTimeout(() => { if (prev) prev.classList.remove('is-leaving'); }, 720);

  // 场景音景
  const w = WEATHERS.find(x => x.id === app.state.weather) || WEATHERS[0];
  audio.setScene({ wind: w.wind, rain: w.rain, snow: w.snow, cold: w.cold, room: app.state.room });
  (app._enter.get(scene) || []).forEach(fn => fn(opts));
}
app.go = go;

/* ---------------- 提示条 ---------------- */
let toastTimer = 0;
app.toast = (msg, ms = 3600) => {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.hidden = false;
  requestAnimationFrame(() => t.classList.add('on'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove('on');
    setTimeout(() => { if (!t.classList.contains('on')) t.hidden = true; }, 400);
  }, ms);
};

/* ---------------- 声音 ---------------- */
app.toggleSound = () => audio.toggleMute();
app.soundOn = () => audio.setMuted(false);

/* ---------------- 全局随缘（成宴页用） ---------------- */
app.randomizeAll = () => {
  const w = pick(WEATHERS);
  const t = pick(TIMES);
  const room = recommendRoom(ROOMS, w, t);
  app.state.weather = w.id;
  app.state.time = t.id;
  app.state.room = room.id;
  app.state.flavor = pick(FLAVORS).id;
  app.state.mood = pick(MOODS).id;
  app.state.allergies = [];
  app.state.order = [];
  app.state.plates = [];
  app.pair.ov = { tea: false, side: false, poem: false, plates: false, order: false };
  if (app.gate) { app.gate.applyWeather(w.id, false); app.gate.applyTime(TIMES.indexOf(t), false); }
  app.toast(`全局随缘 · ${room.name} · ${w.name}${t.name}`);
  go('room');
};

/* ---------------- 深链：?scene=corridor&room=jiangyue&weather=frost&time=dawn ---------------- */
function bootFromQuery() {
  const q = new URLSearchParams(location.search);
  const scene = q.get('scene');
  if (!scene) return;
  const setIf = (key, list, target) => {
    const v = q.get(key);
    if (v && list.some(x => x.id === v)) app.state[target] = v;
  };
  setIf('weather', WEATHERS, 'weather');
  setIf('time', TIMES, 'time');
  setIf('room', ROOMS, 'room');
  setIf('flavor', FLAVORS, 'flavor');
  setIf('mood', MOODS, 'mood');
  const al = q.get('allergies');
  if (al) app.state.allergies = al.split(',').filter(Boolean);
  const flavor2 = q.get('flavor');
  void flavor2;
  if (app.gate) {
    app.gate.applyWeather(app.state.weather, false);
    app.gate.applyTime(TIMES.findIndex(x => x.id === app.state.time), false);
  }
  if (scene !== 'gate' && scene !== 'sky' && !app.state.room) {
    app.state.room = recommendRoom(ROOMS, WEATHERS.find(w => w.id === app.state.weather), TIMES.find(t => t.id === app.state.time)).id;
  }
  // 深链直达下游场景时，先把这一席配齐，避免空菜单
  if (['room', 'feast'].includes(scene) && (!app.state.order || !app.state.order.length)) {
    app.state.order = ['shrimp', 'asparagus', 'crab', 'chicken', 'duck', 'mooncake'];
    app.pair.ov = { tea: false, side: false, poem: false, plates: false, order: false };
    if (app.room) app.room.recompute();
  }
  go(scene);
  // 便于静态检查各幕：?step= 定序进，?stage= 定包间幕次（须在入场复位之后再应用）
  const step = q0('step');
  if (scene === 'sky' && step !== '' && app.gate) app.gate.setStep(Number(step), false);
  const stage = q0('stage');
  if (scene === 'room' && stage !== '' && app.room) setTimeout(() => app.room.setStage(Number(stage)), 0);
}

/* ---------------- 初始化 ---------------- */
function boot() {
  initGate(app);
  initHall(app);
  initCorridor(app);
  initRoom(app);
  initFeast(app);

  // 首次交互解锁音频
  const unlock = () => {
    audio.init();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);

  // 说明层
  $$('.modal-help [data-close]').forEach(b => b.addEventListener('click', () => { b.closest('.modal').hidden = true; }));
  $('#helpModal')?.addEventListener('click', e => { if (e.target.id === 'helpModal') e.target.hidden = true; });

  // 开场
  $('#scene-gate').classList.add('is-active');
  requestAnimationFrame(frame);

  if (new URLSearchParams(location.search).get('scene')) {
    bootFromQuery();
  } else {
    setTimeout(() => app.toast('月上东墙，桂花正开着。请拾级而上。', 5200), 1200);
  }

  // 截图模式：?shot=3500 —— 让动画跑够帧数后停住，便于无头截图（浏览器虚拟时间预算不会被无限 rAF 拖住）
  const shot = Number(q0('shot'));
  if (shot > 0) {
    setTimeout(() => { app.freeze(); document.title = 'READY'; }, shot);
  }
}

function q0(k) {
  const v = new URLSearchParams(location.search).get(k);
  return v === null ? '' : v;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

window.__yizhigui = app;
