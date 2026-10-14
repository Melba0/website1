/* =========================================================
   audio.js · 全程序化音景：古琴、蟋蟀、雨、风、评弹、风铃
   不使用任何音频文件
   ========================================================= */
import { rand, randInt, pick, clamp } from './util.js';

let AC = null, master = null, busAmb = null, busSfx = null, ready = false, muted = true;
let noiseBuf = null;
let rainSrc = null, rainGain = null, rainFilt = null;
let windSrc = null, windGain = null, windFilt = null;
let cricketTimer = null, musicTimer = null, chimeTimer = null, pingTimer = null;
let current = { wind: .3, rain: 0, snow: 0, cold: .3, room: null };
const PENTA = [196.00, 220.00, 246.94, 293.66, 329.63, 392.00, 440.00, 493.88, 587.33];

export function init() {
  if (AC) return AC;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  AC = new Ctor();
  master = AC.createGain();
  master.gain.value = 0;
  master.connect(AC.destination);

  busAmb = AC.createGain(); busAmb.gain.value = .9; busAmb.connect(master);
  busSfx = AC.createGain(); busSfx.gain.value = .8; busSfx.connect(master);

  // 噪声源（复用）
  const len = AC.sampleRate * 2;
  noiseBuf = AC.createBuffer(1, len, AC.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

  // 雨
  rainSrc = AC.createBufferSource(); rainSrc.buffer = noiseBuf; rainSrc.loop = true;
  rainFilt = AC.createBiquadFilter(); rainFilt.type = 'bandpass'; rainFilt.frequency.value = 1500; rainFilt.Q.value = .4;
  rainGain = AC.createGain(); rainGain.gain.value = 0;
  rainSrc.connect(rainFilt); rainFilt.connect(rainGain); rainGain.connect(busAmb);
  rainSrc.start();

  // 风
  windSrc = AC.createBufferSource(); windSrc.buffer = noiseBuf; windSrc.loop = true;
  windFilt = AC.createBiquadFilter(); windFilt.type = 'lowpass'; windFilt.frequency.value = 420; windFilt.Q.value = 1.2;
  windGain = AC.createGain(); windGain.gain.value = 0;
  windSrc.connect(windFilt); windFilt.connect(windGain); windGain.connect(busAmb);
  windSrc.start();

  ready = true;
  startCrickets();
  startMusic();
  startChimes();
  applyVolumes();
  return AC;
}

export function resume() {
  init();
  if (!AC) return;
  if (AC.state === 'suspended') AC.resume();
}

export const isMuted = () => muted;
export function setMuted(m) {
  muted = !!m;
  if (!muted) { resume(); }
  applyVolumes();
}
export function toggleMute() { setMuted(!muted); return muted; }

function applyVolumes() {
  if (!ready || !AC) return;
  const t = AC.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setTargetAtTime(muted ? 0 : .55, t, .6);
  const rainT = clamp(current.rain, 0, 1);
  rainGain.gain.setTargetAtTime(muted ? 0 : (.12 * rainT + .015 * rainT), t, 1.2);
  rainFilt.frequency.setTargetAtTime(1100 + current.cold * 900, t, 1.5);
  const w = current.wind;
  windGain.gain.setTargetAtTime(muted ? 0 : (.055 + .11 * w), t, 1.6);
  windFilt.frequency.setTargetAtTime(320 + w * 520, t, 1.6);
}

export function setScene(o = {}) {
  Object.assign(current, o);
  applyVolumes();
}

/** 古琴：三角波 + 快速衰减 + 低通，按五声音阶随机成句 */
function pluck(freq, when, vol = .16, dur = 2.6) {
  if (!ready) return;
  const t = when ?? AC.currentTime;
  const o = AC.createOscillator();
  const o2 = AC.createOscillator();
  const g = AC.createGain(), f = AC.createBiquadFilter();
  o.type = 'triangle'; o.frequency.value = freq;
  o2.type = 'sine'; o2.frequency.value = freq * 2.004;
  f.type = 'lowpass'; f.frequency.value = 2400; f.Q.value = .7;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + .008);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(f); o2.connect(f); f.connect(g); g.connect(busAmb);
  o.start(t); o2.start(t);
  o.stop(t + dur + .05); o2.stop(t + dur + .05);
  // 弦尾泛音
  const o3 = AC.createOscillator(), g3 = AC.createGain();
  o3.type = 'sine'; o3.frequency.value = freq * 3.01;
  g3.gain.setValueAtTime(0, t); g3.gain.linearRampToValueAtTime(vol * .16, t + .01);
  g3.gain.exponentialRampToValueAtTime(.0001, t + dur * .5);
  o3.connect(g3); g3.connect(busAmb); o3.start(t); o3.stop(t + dur);
}

function startMusic() {
  if (musicTimer) return;
  const phrase = () => {
    if (!ready) return;
    if (muted) { musicTimer = setTimeout(phrase, 4000); return; }
    const n = randInt(1, 3);
    let t = AC.currentTime + .1;
    for (let i = 0; i < n; i++) {
      const f = pick(PENTA) * (Math.random() < .2 ? 2 : 1);
      pluck(f, t, rand(.09, .19), rand(2.2, 3.6));
      t += rand(.42, 1.15);
    }
    musicTimer = setTimeout(phrase, rand(6500, 12000));
  };
  musicTimer = setTimeout(phrase, 1200);
}

/** 蟋蟀：短促高频脉冲串 */
function cricketChirp() {
  if (!ready || muted) return;
  const t0 = AC.currentTime;
  const reps = randInt(3, 5);
  for (let r = 0; r < reps; r++) {
    const t = t0 + r * .075;
    const o = AC.createOscillator(), g = AC.createGain(), bp = AC.createBiquadFilter();
    o.type = 'square';
    o.frequency.value = rand(3800, 4700);
    bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 8;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(.028, t + .004);
    g.gain.exponentialRampToValueAtTime(.0001, t + .035);
    o.connect(bp); bp.connect(g); g.connect(busAmb);
    o.start(t); o.stop(t + .05);
  }
}
function startCrickets() {
  if (cricketTimer) return;
  const tick = () => {
    cricketChirp();
    cricketTimer = setTimeout(tick, rand(900, 3400));
  };
  cricketTimer = setTimeout(tick, 1500);
}

/** 檐角风铃：冷天/霜降更密 */
function chime() {
  if (!ready || muted) return;
  const t = AC.currentTime + .05;
  const base = pick([784, 880, 987.77, 1174.66, 1318.51]);
  [[1, .07], [2.76, .028], [5.4, .012]].forEach(([mul, v]) => {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = 'sine'; o.frequency.value = base * mul;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v * (current.cold * .7 + .3), t + .01);
    g.gain.exponentialRampToValueAtTime(.0001, t + 2.6);
    o.connect(g); g.connect(busAmb); o.start(t); o.stop(t + 2.8);
  });
}
function startChimes() {
  if (chimeTimer) return;
  const tick = () => {
    if (current.cold > .55 || current.wind > .6) chime();
    chimeTimer = setTimeout(tick, rand(5000, 11000));
  };
  chimeTimer = setTimeout(tick, 3500);
}

/* ---------------- 音效 ---------------- */
export function sfx(kind) {
  if (!ready || muted) { if (kind !== 'silent') resume(); }
  if (!AC) return;
  const t = AC.currentTime;
  const beep = (f, dur, type = 'sine', vol = .12, slide = 0) => {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(60, f + slide), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + .01);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(busSfx); o.start(t); o.stop(t + dur + .02);
  };
  switch (kind) {
    case 'pluck': pluck(pick(PENTA), t, .22, 2.2); break;
    case 'tick': beep(rand(900, 1300), .09, 'triangle', .06); break;
    case 'tab': beep(520, .16, 'triangle', .1, -120); break;
    case 'door': {
      // 木门吱呀：低频噪声扫频
      if (noiseBuf) {
        const s = AC.createBufferSource(); s.buffer = noiseBuf;
        const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 6;
        f.frequency.setValueAtTime(320, t);
        f.frequency.exponentialRampToValueAtTime(1150, t + .5);
        const g = AC.createGain();
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.07, t + .06);
        g.gain.exponentialRampToValueAtTime(.0001, t + .62);
        s.connect(f); f.connect(g); g.connect(busSfx); s.start(t); s.stop(t + .7);
      }
      beep(196, .5, 'sine', .07, -60);
      break;
    }
    case 'gong': {
      [1, 2.02, 3.05, 4.2].forEach((m, i) => {
        const o = AC.createOscillator(), g = AC.createGain();
        o.type = 'sine'; o.frequency.value = 138 * m;
        g.gain.setValueAtTime(0, t + i * .01);
        g.gain.linearRampToValueAtTime(.12 / (i + 1), t + .02 + i * .01);
        g.gain.exponentialRampToValueAtTime(.0001, t + 3.4 - i * .4);
        o.connect(g); g.connect(busSfx); o.start(t); o.stop(t + 3.6);
      });
      break;
    }
    case 'chime': chime(); break;
    case 'toss': for (let i = 0; i < 4; i++) setTimeout(() => beep(rand(1200, 2000), .06, 'triangle', .05), i * 55); break;
    case 'cup': beep(1180, .1, 'sine', .07, 200); beep(1560, .18, 'sine', .04, -300); break;
  }
}
