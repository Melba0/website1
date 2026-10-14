/* =========================================================
   gate.js · 门庭（零）与 门口选天时（一）
   ========================================================= */
import { $, clamp, pick } from './util.js';
import { WEATHERS, TIMES, weatherById, timeById } from './data.js';
import { Particles, Sky, makeCanvas } from './art.js';
import { sfx } from './audio.js';

export function initGate(app) {
  const sceneGate = $('#scene-gate');
  const sceneSky = $('#scene-sky');
  const moonWrap = $('#gateMoon');

  /* ---------------- 门庭：飘桂 + 水缸月影 ---------------- */
  const api = makeCanvas($('#cvBg'));
  const p = new Particles(320);
  let t = 0, rippleT = 0;

  const sceneRank = () => (app.scene === 'gate' ? 0 : app.scene === 'sky' ? 1 : -1);

  app.animate(dt => {
    const rank = sceneRank();
    if (rank < 0) return;
    t += dt;
    const weather = weatherById(app.state.weather);

    // 桂花：先少后随天气变多
    const petalWant = rank === 0
      ? 60
      : Math.round(24 + weather.wind * 260 + (weather.id === 'wind' ? 200 : 0));
    const have = p.count('petal');
    if (have < petalWant && Math.random() < .85) p.spawnPetal(api.w, api.h);
    if (weather.rain > 0) { const hn = p.count('rain'); for (let i = 0; i < Math.min(10, weather.rain * 260 - hn); i++) p.spawnRain(api.w, api.h); }
    if (weather.snow > 0) { const hs = p.count('snow'); for (let i = 0; i < Math.min(6, weather.snow * 160 - hs); i++) p.spawnSnow(api.w, api.h); }
    if (weather.rain > 0 && rank === 1) {
      rippleT += dt;
      if (rippleT > .16) {
        rippleT = 0;
        p.spawnRipple(api.w, api.h, api.w * (.12 + Math.random() * .2), api.h * (.78 + Math.random() * .14));
      }
    }
    p.step(dt, weather.wind, 1, api.w, api.h);

    // 绘制门庭背景粒子
    api.ctx.clearRect(0, 0, api.w, api.h);
    p.draw(api.ctx);
    // 水缸月影涟漪（固定一处，缓缓扩散）
    if (rank === 0) {
      rippleT += dt;
      if (rippleT > 2.6) {
        rippleT = 0;
        p.spawnRipple(api.w, api.h, api.w * .145, api.h * .795);
      }
    }
  });

  // 鼠标视差
  let mx = 0, my = 0, tx = 0, ty = 0;
  window.addEventListener('pointermove', e => {
    tx = (e.clientX / window.innerWidth - .5) * 2;
    ty = (e.clientY / window.innerHeight - .5) * 2;
  }, { passive: true });
  app.animate(() => {
    if (app.scene !== 'gate') return;
    mx += (tx - mx) * .05; my += (ty - my) * .05;
    if (moonWrap) moonWrap.style.transform = `translate(${-mx * 22}px, ${-my * 14}px)`;
  });

  /* ---------------- 门庭按钮 ---------------- */
  $('#btnClimb')?.addEventListener('click', () => {
    sfx('pluck');
    app.go('sky');
  });
  $('#btnHelp')?.addEventListener('click', () => { sfx('tab'); $('#helpModal').hidden = false; });
  $('#btnSkyBack')?.addEventListener('click', () => { sfx('tick'); app.go('gate'); });

  const btnSound = $('#btnSound');
  btnSound?.addEventListener('click', () => {
    const muted = app.toggleSound();
    btnSound.setAttribute('aria-pressed', String(!muted));
    btnSound.textContent = muted ? '琴 声' : '静 音';
    btnSound.classList.toggle('on', !muted);
    if (!muted) sfx('pluck');
  });

  /* ---------------- 天空画布 ---------------- */
  const sky = new Sky($('#cvSky'));
  sky.setWeather(weatherById(app.state.weather));
  sky.setTime(timeById(app.state.time));
  sky.snap();

  /* ---------------- 天空交互：涟漪 + 拖动月亮 ---------------- */
  const WEATHER_LABEL = {
    sunny: '点云　看晴', cloudy: '点薄云', veiled: '点云　遮月',
    rain: '点雨　微雨', wind: '点桂　起风', frost: '点霜　降霜'
  };
  const hotspotBtns = Array.from(document.querySelectorAll('#weatherHotspots .hot'));
  hotspotBtns.forEach(h => {
    const b = h.querySelector('b');
    if (b && WEATHER_LABEL[h.dataset.weather]) b.textContent = WEATHER_LABEL[h.dataset.weather];
    h.addEventListener('pointerenter', () => {
      const w = weatherById(h.dataset.weather);
      if (poemEl) poemEl.textContent = w.poem;
    });
  });

  const skyCanvas = $('#cvSky');
  let moonDrag = false, rippleAcc = 0;
  skyCanvas?.addEventListener('pointerdown', e => {
    const r = skyCanvas.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top) / r.height;
    sky.ripple(e.clientX - r.left, e.clientY - r.top);
    // 抓月亮：以月心为圆心的一片区域
    const dx = nx - sky.moon.x, dy = (ny - sky.moon.y) * (r.height / r.width);
    if (Math.hypot(dx, dy) < .10) {
      moonDrag = true;
      skyCanvas.setPointerCapture?.(e.pointerId);
      app.toast('月可移 —— 按各时刻的常位略作前后，意思便不同。', 3200);
    }
  });
  window.addEventListener('pointermove', e => {
    if (!moonDrag || app.scene !== 'sky') return;
    const r = skyCanvas.getBoundingClientRect();
    const nx = clamp((e.clientX - r.left) / r.width, .06, .94);
    const ny = clamp((e.clientY - r.top) / r.height, .04, .62);
    sky.moon.x = nx; sky.moon.y = ny;
    sky.moon.tx = nx; sky.moon.ty = ny;
    sky.customMoon = true;
    const w = nx < .34 ? '东' : nx > .66 ? '西' : '中';
    if (roMoon) roMoon.textContent = `月偏${w}（手动）`;
  });
  window.addEventListener('pointerup', () => {
    if (!moonDrag) return;
    moonDrag = false;
    skyCanvas?.releasePointerCapture?.();
  });

  app.animate(dt => {
    if (app.scene !== 'sky') return;
    const weather = weatherById(app.state.weather);
    const time = timeById(app.state.time);
    sky.setWeather(weather);
    if (!moonDrag && !sky.customMoon) sky.setTime(time);
    sky.step(dt);
    sky.draw();
  });

  /* ---------------- 序进：先观天（壹），再择时（贰） ---------------- */
  const seqBar = $('#seqBar');
  const seqSteps = Array.from(document.querySelectorAll('#seqBar .seq-step'));
  const seqPrompt = $('#seqPrompt');
  const seqKicker = $('#seqPrompt .sp-kicker');
  const seqQ = $('#seqPrompt .sp-q');
  const seqNote = $('#seqNote');
  const timePanel = $('#timePanel');
  const btnPush = $('#btnPushDoor');
  const btnSeqBack = $('#btnSeqBack');
  const hotspotBox = $('#weatherHotspots');
  let step = 0;

  const COPY = {
    0: {
      kicker: '石阶之上 · 其 一',
      q: '抬起头，今夜是什么天色？',
      note: '点天上一朵云、一丝雨、一片霜，或让风自己来。'
    },
    1: {
      kicker: '石阶之上 · 其 二',
      q: '再低头看看灯影 —— 今夜是什么时辰？',
      note: '拖动檐下那盏灯笼定更，也可以直接点更次。'
    }
  };

  function setStep(n, announce = true) {
    step = clamp(n, 0, 1);
    seqBar?.setAttribute('data-step', String(step));
    seqSteps.forEach((el, i) => {
      el.classList.toggle('on', i === step);
      el.classList.toggle('done', i < step);
    });
    const c = COPY[step];
    if (seqKicker) seqKicker.textContent = c.kicker;
    if (seqQ) seqQ.textContent = c.q;
    if (seqNote) seqNote.textContent = c.note;
    if (seqPrompt) {
      seqPrompt.classList.remove('flash');
      void seqPrompt.offsetWidth;
      seqPrompt.classList.add('flash');
    }
    hotspotBox?.classList.toggle('folded', step !== 0);
    if (timePanel) timePanel.hidden = step !== 1;
    if (btnPush) btnPush.hidden = step !== 1;
    if (btnSeqBack) btnSeqBack.hidden = step !== 1;
    if (announce) sfx(step === 1 ? 'tick' : 'pluck');
  }

  $('#btnSeqBack')?.addEventListener('click', () => setStep(0));

  /* ---------------- 天气：点天空 ---------------- */
  const poemEl = $('#skyPoem');
  const hotspots = Array.from(document.querySelectorAll('#weatherHotspots .hot'));

  function flashPoem(text) {
    if (!poemEl) return;
    poemEl.textContent = text;
    poemEl.classList.remove('flash');
    void poemEl.offsetWidth;
    poemEl.classList.add('flash');
  }

  function applyWeather(id, announce = true) {
    const w = weatherById(id);
    app.state.weather = w.id;
    sceneSky.dataset.weather = w.id;
    hotspots.forEach(h => h.classList.toggle('on', h.dataset.weather === w.id));
    $('#roWeather').textContent = w.name;
    flashPoem(w.poem);
    if (announce) {
      sfx(id === 'rain' ? 'cup' : id === 'frost' ? 'chime' : 'pluck');
      app.bus.emit('weatherchange', app.state);
    }
  }

  hotspots.forEach(h => h.addEventListener('click', () => {
    applyWeather(h.dataset.weather);
    app.toast(`${weatherById(h.dataset.weather).idea}`, 2800);
    if (step === 0) setTimeout(() => setStep(1), 700);
  }));

  $('#btnWeatherRandom')?.addEventListener('click', () => {
    const others = WEATHERS.filter(w => w.id !== app.state.weather);
    const w = pick(others);
    applyWeather(w.id);
    app.toast(`风起随缘 · ${w.name}：${w.idea}`);
    if (step === 0) setTimeout(() => setStep(1), 700);
  });

  /* ---------------- 时刻：拖灯笼 ---------------- */
  const dragEl = $('#lanternDrag');
  const ticks = Array.from(document.querySelectorAll('#timeTicks button'));
  const roTime = $('#roTime');
  const roMoon = $('#roMoon');

  function applyTime(i, announce = true) {
    const idx = clamp(Math.round(i), 0, TIMES.length - 1);
    const time = TIMES[idx];
    app.state.time = time.id;
    ticks.forEach((b, k) => b.classList.toggle('on', k === idx));
    if (roTime) roTime.textContent = time.name;
    if (roMoon) roMoon.textContent = time.moonLabel;
    dragEl?.setAttribute('aria-valuenow', String(idx));
    if (dragEl) dragEl.dataset.index = String(idx);
    if (announce) {
      flashPoem(time.poem);
      sfx('tick');
      app.bus.emit('timechange', app.state);
    }
    const glow = dragEl?.querySelector('.ld-glow');
    if (glow) glow.style.opacity = String(.35 + time.lantern * .65);
    const svgL = dragEl?.querySelector('.ld-lantern');
    if (svgL) svgL.style.filter = `drop-shadow(0 0 ${18 + time.lantern * 30}px rgba(255,${140 + time.lantern * 60},60,${.4 + time.lantern * .5}))`;
    // 手动挪过月亮的话，就以手动为定；点更次即归还月位给常位
    if (sky) sky.customMoon = false;
    sky.setTime(time);
  }

  ticks.forEach((b, i) => b.addEventListener('click', () => applyTime(i)));

  if (dragEl) {
    let dragging = false, startY = 0, startIdx = 0;
    const onDown = e => {
      dragging = true;
      startY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      startIdx = Number(dragEl.dataset.index || 1);
      dragEl.setPointerCapture?.(e.pointerId);
      dragEl.style.cursor = 'grabbing';
    };
    const onMove = e => {
      if (!dragging) return;
      const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      const dy = y - startY;
      // 向下拖 = 更晚（灯笼被拉低）
      const next = clamp(startIdx + dy / 46, 0, TIMES.length - 1);
      if (Math.round(next) !== Number(dragEl.dataset.index)) applyTime(next);
    };
    const onUp = () => { dragging = false; dragEl.style.cursor = 'grab'; applyTime(Number(dragEl.dataset.index || 1)); };

    dragEl.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    dragEl.addEventListener('keydown', e => {
      const cur = Number(dragEl.dataset.index || 1);
      if (e.key === 'ArrowDown') { applyTime(cur + 1); e.preventDefault(); }
      if (e.key === 'ArrowUp') { applyTime(cur - 1); e.preventDefault(); }
    });
  }

  $('#btnTimeRandom')?.addEventListener('click', () => {
    const idx = Math.floor(Math.random() * TIMES.length);
    applyTime(idx);
    app.toast(`听更 · ${TIMES[idx].name}：${TIMES[idx].sense}`, 3000);
  });

  /* ---------------- 推门入店 ---------------- */
  $('#btnPushDoor')?.addEventListener('click', () => {
    sfx('door');
    const veil = $('#doorVeil');
    veil?.classList.add('on');
    const w = weatherById(app.state.weather);
    app.toast(`${w.name} · ${timeById(app.state.time).name}　${w.poem}`, 4200);
    setTimeout(() => {
      app.go('hall');
      veil?.classList.remove('on');
    }, 620);
  });

  /* ---------------- 进入走廊 ---------------- */
  app.onEnter('sky', () => {
    applyWeather(app.state.weather, false);
    applyTime(TIMES.findIndex(x => x.id === app.state.time), false);
    sky.customMoon = false;
    sky.setWeather(weatherById(app.state.weather));
    sky.setTime(timeById(app.state.time));
    sky.snap();
    api.fit(); sky.api.fit();
    setStep(0, false);
  });
  app.onEnter('gate', () => { api.fit(); });

  app.gate = { applyWeather, applyTime, setStep };
}
