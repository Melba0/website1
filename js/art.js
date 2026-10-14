/* =========================================================
   art.js · Canvas 引擎：天空、月亮、云、雨、霜、桂、光斑、围炉
   ========================================================= */
import { rand, randInt, lerp, easeOut, clamp } from './util.js';

/* ---------------- 画布基础 ---------------- */
export function makeCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const api = {
    canvas, ctx,
    w: 0, h: 0, dpr: 1,
    fit() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      // 全屏 canvas 用视口尺寸兜底
      const w = Math.max(1, Math.round(r.width || window.innerWidth));
      const h = Math.max(1, Math.round(r.height || window.innerHeight));
      this.dpr = dpr; this.w = w; this.h = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return this;
    }
  };
  api.fit();
  return api;
}

/* ---------------- 粒子群 ---------------- */
export class Particles {
  constructor(max = 420) {
    this.items = [];
    this.max = max;
  }
  /** 桂花瓣：金桂飘落 */
  spawnPetal(w, h) {
    if (this.items.length >= this.max) return;
    this.items.push({
      kind: 'petal',
      x: rand(-0.1 * w, w * 1.1), y: rand(-h * 0.35, -6),
      vx: rand(-14, 14), vy: rand(16, 46),
      s: rand(1.3, 3.4), a: rand(0.5, 1),
      sw: rand(0, 6.283), sws: rand(1.1, 2.6), rot: rand(6.283), rotv: rand(-1.4, 1.4),
      hue: rand(0, 1)
    });
  }
  spawnRain(w, h) {
    if (this.items.length >= this.max) return;
    const sp = rand(0.8, 1.4);
    this.items.push({ kind: 'rain', x: rand(-60, w + 60), y: rand(-h * 0.3, -10), vx: -46 * sp, vy: 620 * sp, len: rand(12, 30), a: rand(0.16, 0.44) });
  }
  spawnSnow(w, h) {
    if (this.items.length >= this.max) return;
    this.items.push({ kind: 'snow', x: rand(-20, w + 20), y: rand(-h * 0.2, -6), vx: rand(-16, 16), vy: rand(14, 38), r: rand(0.7, 2.4), a: rand(0.3, 0.9), sw: rand(0, 6.283), sws: rand(0.6, 1.8) });
  }
  /** 萤火 / 灯下微尘 */
  spawnMote(w, h, cx, cy, spread = 200) {
    if (this.items.length >= this.max) return;
    this.items.push({ kind: 'mote', x: cx + rand(-spread, spread), y: cy + rand(-spread * .6, spread * .6), vx: rand(-6, 6), vy: rand(-10, -2), r: rand(0.6, 1.8), a: rand(0.2, 0.7), sw: rand(0, 6.283), sws: rand(1, 3) });
  }
  spawnRipple(w, h, cx, cy) {
    this.items.push({ kind: 'ripple', x: cx, y: cy, r: 2, vr: rand(26, 52), a: 0.5 });
  }
  clear() { this.items.length = 0; }
  count(kind) { let n = 0; for (const p of this.items) if (p.kind === kind) n++; return n; }
  trim(kind, want) {
    let n = 0;
    for (let i = this.items.length - 1; i >= 0; i--) {
      if (this.items[i].kind === kind) { n++; if (n > want) this.items.splice(i, 1); }
    }
  }
  step(dt, wind = 0.3, vyMul = 1, w, h) {
    const wx = (wind - 0.3) * 190;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      p.sw += p.sws * dt;
      if (p.kind === 'petal') {
        p.x += (p.vx + Math.sin(p.sw) * 26 + wx) * dt;
        p.y += (p.vy * vyMul + Math.cos(p.sw * .7) * 10) * dt;
        p.rot += p.rotv * dt;
        if (p.y > h + 20 || p.x < -120 || p.x > w + 120) { this.items.splice(i, 1); }
      } else if (p.kind === 'rain') {
        p.x += (p.vx + wx * .4) * dt;
        p.y += p.vy * dt;
        if (p.y > h + 30) { this.items.splice(i, 1); }
      } else if (p.kind === 'snow') {
        p.x += (p.vx + Math.sin(p.sw) * 22 + wx * .7) * dt;
        p.y += p.vy * dt;
        if (p.y > h + 20) { this.items.splice(i, 1); }
      } else if (p.kind === 'mote') {
        p.x += (p.vx + Math.sin(p.sw) * 5) * dt;
        p.y += p.vy * dt;
        p.a *= (1 - 0.15 * dt);
        if (p.a < 0.02 || p.y < -20) { this.items.splice(i, 1); }
      } else if (p.kind === 'ripple') {
        p.r += p.vr * dt;
        p.a -= 0.42 * dt;
        if (p.a <= 0.01) { this.items.splice(i, 1); }
      }
    }
  }
  draw(ctx) {
    for (const p of this.items) {
      if (p.kind === 'petal') {
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = p.a * 0.95;
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.s * 3.4);
        g.addColorStop(0, '#fff2c4'); g.addColorStop(.42, '#f7d24a'); g.addColorStop(1, 'rgba(230,170,40,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(0, 0, p.s * 3.4, p.s * 1.9, 0, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = p.a;
        ctx.fillStyle = p.hue > .5 ? '#f6c851' : '#e8b23c';
        ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * .58, 0, 0, 6.2832); ctx.fill();
        ctx.restore();
      } else if (p.kind === 'rain') {
        ctx.save();
        ctx.globalAlpha = p.a;
        ctx.strokeStyle = 'rgba(196,222,246,.9)';
        ctx.lineWidth = 1.05;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.028, p.y - p.len);
        ctx.stroke();
        ctx.restore();
      } else if (p.kind === 'snow') {
        ctx.save();
        ctx.globalAlpha = p.a;
        ctx.fillStyle = '#e8f2ff';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = p.a * .28;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 2.6, 0, 6.2832); ctx.fill();
        ctx.restore();
      } else if (p.kind === 'mote') {
        ctx.save();
        ctx.globalAlpha = p.a;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 7);
        g.addColorStop(0, 'rgba(255,236,190,.95)'); g.addColorStop(1, 'rgba(255,200,110,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 7, 0, 6.2832); ctx.fill();
        ctx.restore();
      } else if (p.kind === 'ripple') {
        ctx.save();
        ctx.globalAlpha = clamp(p.a, 0, .6);
        ctx.strokeStyle = 'rgba(240,232,200,.9)';
        ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * .32, 0, 0, 6.2832); ctx.stroke();
        ctx.restore();
      }
    }
  }
}

/* ---------------- 天空绘制器 ---------------- */
export class Sky {
  constructor(canvas) {
    this.api = makeCanvas(canvas);
    this.p = new Particles(500);
    this.stars = [];
    this.clouds = [];
    this.acc = 0;
    this.moon = { x: .5, y: .17, r: 46, op: 1, tx: .5, ty: .17, tr: 46, top: 1 };
    this.wind = .3;
    this.rain = 0; this.snow = 0; this.cold = .3;
    this.cloudAmt = .3;
    this.time = 0;
    this.flash = 0;
    this.initStars();
    this.initClouds();
  }
  initStars() {
    this.stars = [];
    for (let i = 0; i < 150; i++) {
      this.stars.push({
        x: Math.random(), y: Math.random() * .74,
        r: rand(.4, 1.5), a: rand(.25, 1), tw: rand(0, 6.28), tws: rand(.6, 2.2)
      });
    }
  }
  initClouds() {
    this.clouds = [];
    for (let i = 0; i < 7; i++) {
      this.clouds.push({
        x: rand(-.15, 1.2), y: rand(.05, .48),
        s: rand(.6, 1.7), sp: rand(.004, .022), a: rand(.4, .95), seed: rand(0, 10)
      });
    }
  }
  setWeather(w) {
    this.wind = w.wind; this.rain = w.rain; this.snow = w.snow; this.cold = w.cold;
    this.cloudAmt = w.cloud; this.moon.top = w.moonOp;
    this.p.trim('rain', Math.round(w.rain * 300));
    this.p.trim('snow', Math.round(w.snow * 200));
    this.p.trim('petal', Math.round(40 + w.wind * 320));
  }
  setTime(t) {
    const m = t.moon;
    this.moon.tx = m.x; this.moon.ty = m.y; this.moon.tr = m.r;
    this.starBase = t.starOp; this.lantern = t.lantern;
    if (t.starOp > .001) this.initStars();
  }
  /** 立即定位（进场用） */
  snap() { this.moon.x = this.moon.tx; this.moon.y = this.moon.ty; this.moon.r = this.moon.tr; }
  ripple(x, y) { this.p.spawnRipple(this.api.w, this.api.h, x, y); }

  /** 用户点击天空 —— 也可直接在外部处理 */
  step(dt) {
    const { w, h } = this.api;
    this.time += dt;
    const m = this.moon;
    m.x = lerp(m.x, m.tx, 1 - Math.pow(.001, dt));
    m.y = lerp(m.y, m.ty, 1 - Math.pow(.001, dt));
    m.r = lerp(m.r, m.tr, 1 - Math.pow(.0015, dt));

    // 生成粒子
    if (this.rain > 0) {
      const want = Math.round(this.rain * 300);
      const have = this.p.count('rain');
      for (let i = 0; i < Math.min(14, want - have); i++) this.p.spawnRain(w, h);
    }
    if (this.snow > 0) {
      const want = Math.round(this.snow * 200);
      const have = this.p.count('snow');
      for (let i = 0; i < Math.min(9, want - have); i++) this.p.spawnSnow(w, h);
    }
    // 桂花瓣：晴也有少量，风起最多
    const petalWant = Math.round(24 + this.wind * 280 + (this.cold > .8 ? 0 : 0));
    const petalHave = this.p.count('petal');
    if (petalHave < petalWant && Math.random() < .8) this.p.spawnPetal(w, h);

    this.p.step(dt, this.wind, 1, w, h);
    this.clouds.forEach(c => {
      c.x += c.sp * dt * (0.5 + this.wind);
      if (c.x > 1.28) { c.x = -0.28; c.y = rand(.04, .52); c.s = rand(.55, 1.9); }
    });
    if (this.flash > 0) this.flash -= dt * 2.2;
  }

  draw() {
    const { ctx, w, h } = this.api;
    ctx.clearRect(0, 0, w, h);
    const m = this.moon;

    // 星空
    const starOp = (this.starBase ?? 1);
    if (starOp > .01) {
      for (const s of this.stars) {
        const a = s.a * starOp * (.55 + .45 * Math.sin(this.time * s.tws + s.tw));
        if (a <= .02) continue;
        ctx.globalAlpha = a;
        ctx.fillStyle = '#eaf1ff';
        ctx.beginPath(); ctx.arc(s.x * w, s.y * h, s.r, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // 月晕
    const mx = m.x * w, my = m.y * h, mr = m.r;
    const halo = ctx.createRadialGradient(mx, my, mr * .6, mx, my, mr * 12);
    halo.addColorStop(0, `rgba(255,244,206,${.30 * m.op})`);
    halo.addColorStop(.22, `rgba(240,226,168,${.13 * m.op})`);
    halo.addColorStop(1, 'rgba(230,214,150,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(mx, my, mr * 12, 0, 6.2832); ctx.fill();

    // 月亮本体
    ctx.save();
    ctx.globalAlpha = clamp(m.op, 0, 1);
    const mg = ctx.createRadialGradient(mx - mr * .34, my - mr * .36, mr * .12, mx, my, mr);
    mg.addColorStop(0, '#fffdf3'); mg.addColorStop(.55, '#f8f0cf');
    mg.addColorStop(.86, '#e8d79c'); mg.addColorStop(1, '#d6c184');
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, 6.2832); ctx.fill();
    // 环形山
    ctx.globalAlpha = clamp(m.op, 0, 1) * .26;
    ctx.fillStyle = '#bba76d';
    [[-.34, -.20, .19], [.20, .12, .13], [-.06, .40, .10], [.44, -.36, .08], [-.48, .34, .07]]
      .forEach(([dx, dy, rr]) => { ctx.beginPath(); ctx.arc(mx + dx * mr, my + dy * mr, rr * mr, 0, 6.2832); ctx.fill(); });
    ctx.restore();

    // 云：整体一片柔和椭圆（径向渐变到透明，无内边界），再以肩部圆团带出体积
    const cloudOp = clamp(this.cloudAmt * 1.15, 0, 1);
    if (cloudOp > .01) {
      const cold = this.cold > .7;
      const top = cold ? '#c6d8e8' : '#bac8da';
      const bot = cold ? '#4a5f7c' : '#4c5b73';
      for (const c of this.clouds) {
        const a = c.a * cloudOp * .30;
        if (a <= .01) continue;
        const k = Math.max(.75, w / 1600);
        const S = c.s * k;
        const cx = c.x * w, cy = c.y * h;
        // 主体：拉长的柔团
        const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, 230 * S);
        g.addColorStop(0, hexA(top, a));
        g.addColorStop(.42, hexA(top, a * .72));
        g.addColorStop(.72, hexA(bot, a * .34));
        g.addColorStop(1, hexA(bot, 0));
        ctx.save();
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 262 * S, 74 * S, 0, 0, 6.2832);
        ctx.fill();
        // 肩部两团，破掉对称
        for (const [dx, dy, rx, ry] of [[-96, -26, 128, 52], [86, -18, 116, 46], [24, 26, 168, 40]]) {
          const px = cx + dx * S, py = cy + dy * S;
          const g2 = ctx.createRadialGradient(px, py, 1, px, py, Math.max(rx, ry) * S);
          g2.addColorStop(0, hexA(top, a * .82));
          g2.addColorStop(.5, hexA(top, a * .46));
          g2.addColorStop(1, hexA(bot, 0));
          ctx.fillStyle = g2;
          ctx.beginPath();
          ctx.ellipse(px, py, rx * S, ry * S, 0, 0, 6.2832);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // 霜雾（贴地）
    if (this.cold > .72) {
      const g = ctx.createLinearGradient(0, h * .55, 0, h);
      g.addColorStop(0, 'rgba(190,215,240,0)');
      g.addColorStop(1, `rgba(200,222,246,${.14 * (this.cold - .7) / .3})`);
      ctx.fillStyle = g; ctx.fillRect(0, h * .55, w, h * .45);
    }

    // 雨帘 + 粒子
    if (this.rain > 0) {
      ctx.save();
      ctx.globalAlpha = .10 * this.rain;
      ctx.fillStyle = '#9fc4e6';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
    this.p.draw(ctx);

    // 落点涟漪（水缸 / 江面）
    ctx.globalAlpha = 1;
  }
}

/* ---------------- 大堂火光 ---------------- */
export class HallLight {
  constructor(canvas) {
    this.api = makeCanvas(canvas);
    this.p = new Particles(160);
    this.t = 0;
    this.cold = .3;
  }
  step(dt) {
    this.t += dt;
    const { w, h } = this.api;
    if (this.p.count('mote') < 90 && Math.random() < .55) {
      this.p.spawnMote(w, h, w * .5, h * .72, Math.min(w, h) * .42);
    }
    this.p.step(dt, .2, 1, w, h);
  }
  draw() {
    const { ctx, w, h } = this.api;
    ctx.clearRect(0, 0, w, h);
    // 暖光
    const warm = this.cold > .8 ? .55 : 1;
    const g = ctx.createRadialGradient(w * .5, h * .66, 20, w * .5, h * .66, Math.max(w, h) * .72);
    g.addColorStop(0, `rgba(255,186,104,${.20 * warm})`);
    g.addColorStop(.45, `rgba(255,150,60,${.08 * warm})`);
    g.addColorStop(1, 'rgba(255,140,50,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // 灯焰呼吸
    const flick = .82 + .18 * Math.sin(this.t * 3.1) * Math.sin(this.t * 1.7 + 1);
    ctx.globalAlpha = .16 * flick;
    ctx.fillStyle = '#ffb45c';
    ctx.beginPath(); ctx.ellipse(w * .5, h * .5, w * .3, h * .28, 0, 0, 6.2832); ctx.fill();
    ctx.globalAlpha = 1;
    this.p.draw(ctx);
  }
}

/* ---------------- 成宴背景：月光与飘桂 ---------------- */
export class FeastScene {
  constructor(canvas) {
    this.api = makeCanvas(canvas);
    this.p = new Particles(320);
    this.t = 0;
    this.sky = ['#16233a', '#0a111d'];
    this.moon = { x: .5, y: .22, r: 60 };
    this.starOp = .9;
    this.stars = [];
    for (let i = 0; i < 110; i++) this.stars.push({ x: Math.random(), y: Math.random() * .6, r: rand(.4, 1.4), a: rand(.2, .9), tw: rand(0, 6.3), tws: rand(.8, 2.4) });
  }
  setRoom(room, weather, time) {
    this.sky = weather.sky;
    this.moon = { x: time.moon.x * .8 + .1, y: Math.max(.06, time.moon.y * .5), r: Math.min(48, Math.max(30, time.moon.r * .8)) };
    this.starOp = time.starOp;
    this.wind = weather.wind; this.rain = weather.rain; this.snow = weather.snow;
    this.room = room;
  }
  step(dt) {
    const { w, h } = this.api;
    this.t += dt;
    if (this.p.count('petal') < 40 + (this.wind || .3) * 120) this.p.spawnPetal(w, h);
    if (this.rain > 0 && this.p.count('rain') < this.rain * 220) this.p.spawnRain(w, h);
    if (this.snow > 0 && this.p.count('snow') < this.snow * 140) this.p.spawnSnow(w, h);
    this.p.step(dt, this.wind || .3, 1, w, h);
    this.stars.forEach(s => { s.tw += s.tws * dt; });
  }
  draw() {
    const { ctx, w, h } = this.api;
    const [a, b] = this.sky;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, b); g.addColorStop(.55, a); g.addColorStop(1, '#04070d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    // 星
    if (this.starOp > .02) {
      for (const s of this.stars) {
        const al = s.a * this.starOp * (.5 + .5 * Math.sin(s.tw));
        if (al <= .02) continue;
        ctx.globalAlpha = al; ctx.fillStyle = '#e9f1ff';
        ctx.beginPath(); ctx.arc(s.x * w, s.y * h, s.r, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // 月
    const m = this.moon, mx = m.x * w, my = m.y * h;
    const halo = ctx.createRadialGradient(mx, my, m.r * .5, mx, my, m.r * 9);
    halo.addColorStop(0, 'rgba(255,246,212,.26)'); halo.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(mx, my, m.r * 9, 0, 6.2832); ctx.fill();
    const mg = ctx.createRadialGradient(mx - m.r * .3, my - m.r * .34, m.r * .1, mx, my, m.r);
    mg.addColorStop(0, '#fffdf3'); mg.addColorStop(.6, '#f8f0cf'); mg.addColorStop(1, '#ded0a0');
    ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, m.r, 0, 6.2832); ctx.fill();

    // 远山剪影
    ctx.fillStyle = '#070b13';
    ctx.beginPath();
    ctx.moveTo(0, h * .78);
    const pts = [0, .09, .18, .28, .37, .47, .58, .68, .78, .88, 1];
    const hs = [.72, .68, .74, .64, .70, .62, .72, .66, .75, .69, .74];
    pts.forEach((p, i) => ctx.lineTo(p * w, hs[i] * h));
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();

    // 房间辉光
    if (this.room) {
      const c = this.room.accent;
      const rg = ctx.createRadialGradient(w * .5, h * .82, 10, w * .5, h * .82, Math.max(w, h) * .6);
      rg.addColorStop(0, hexA(c, .16)); rg.addColorStop(1, hexA(c, 0));
      ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
    }
    this.p.draw(ctx);
  }
}

/* ---------------- 包间内部光气 ---------------- */
export class RoomAtmosphere {
  constructor(canvas) {
    this.api = makeCanvas(canvas);
    this.p = new Particles(280);
    this.t = 0;
    this.room = null; this.weather = null; this.time = null;
  }
  set(room, weather, time) {
    this.room = room; this.weather = weather; this.time = time;
    this.p.clear();
  }
  step(dt) {
    const { w, h } = this.api;
    this.t += dt;
    if (!this.weather) return;
    const ww = this.weather;
    if (ww.rain > 0) { const have = this.p.count('rain'); for (let i = 0; i < Math.min(6, ww.rain * 140 - have); i++) this.p.spawnRain(w, h); }
    if (ww.snow > 0) { const have = this.p.count('snow'); for (let i = 0; i < Math.min(4, ww.snow * 110 - have); i++) this.p.spawnSnow(w, h); }
    // 窗外的桂（只在桂影阁 / 岭南轩 / 京华厅 轻微飘）
    if (this.room && ['guiying', 'lingnan', 'jinghua'].includes(this.room.id)) {
      if (this.p.count('petal') < 18 + ww.wind * 90 && Math.random() < .5) this.p.spawnPetal(w, h);
    }
    if (Math.random() < .35) this.p.spawnMote(w, h, w * .5, h * .68, Math.min(w, h) * .4);
    this.p.step(dt, ww.wind, 1, w, h);
  }
  draw() {
    if (!this.room) return;
    const { ctx, w, h } = this.api;
    ctx.clearRect(0, 0, w, h);
    const c = this.room.accent;
    const warm = this.room.warm ? 1.15 : .82;
    const g = ctx.createRadialGradient(w * .5, h * .62, 30, w * .5, h * .62, Math.max(w, h) * .78);
    g.addColorStop(0, hexA(c, .13 * warm));
    g.addColorStop(.42, hexA(c, .05 * warm));
    g.addColorStop(1, hexA(c, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // 光斑（窗格投影）
    ctx.globalAlpha = .05 + .02 * Math.sin(this.t * .7);
    ctx.fillStyle = '#fff2cc';
    for (let i = 0; i < 5; i++) {
      const x = w * (.08 + i * .19) + Math.sin(this.t * .3 + i) * 8;
      ctx.fillRect(x, h * .46, w * .085, h * .3);
    }
    ctx.globalAlpha = 1;
    this.p.draw(ctx);
  }
}

function hexA(hex, a) {
  const s = hex.replace('#', '');
  const n = parseInt(s.length === 3 ? s.split('').map(c => c + c).join('') : s, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
export { hexA };

/* ---------------- 通用动画循环 ---------------- */
export function loop(fn) {
  let raf = 0, last = performance.now(), dead = false;
  const tick = now => {
    if (dead) return;
    const dt = Math.min(.05, (now - last) / 1000);
    last = now;
    fn(dt);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => { dead = true; cancelAnimationFrame(raf); };
}
