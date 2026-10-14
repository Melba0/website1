/* =========================================================
   feast.js · 成宴（五）：赏月宴图 + 月光卡 + 存图
   ========================================================= */
import { $, el, cnNum, clamp } from './util.js';
import { roomById, weatherById, timeById, moodById, dishById } from './data.js';
import { FeastScene } from './art.js';
import { renderDishSVG, renderTeaSVG, renderSideSVG } from './dishes.js';
import { tuneOf, swapOf, computeScore, guestReactions, feastName, sharingText } from './pair.js';
import { sfx } from './audio.js';

export function initFeast(app) {
  const fx = new FeastScene($('#cvFeast'));
  let served = 0;          // 已上几道 —— 一道一道上，不是一次摆满
  let serving = false;

  app.animate(dt => {
    if (app.scene !== 'feast') return;
    fx.step(dt); fx.draw();
  });

  const ANGLES = [-90, -30, 30, 90, 150, 210];
  const SERVE_LINE = [
    '先上一道清口的 ——',
    '接着是素的 ——',
    '浓的来了 ——',
    '荤的压得住 ——',
    '这道最厚 ——',
    '末了一道，收甜 ——'
  ];
  const LAST_TALK = [
    '客人举筷，先尝那一口酸。',
    '青碧入盘，席上安静了一瞬。',
    '椰香漫开，话就多起来了。',
    '板栗烧得起沙，汁收得正紧。',
    '酥皮一响，满桌都朝这边看。',
    '月饼一切六分，各人得一块。'
  ];

  const note = (sel, val) => { const n = $(sel); if (n) n.querySelector('span').textContent = val; };

  /* 只画已上的菜 */
  function renderTable(st) {
    const room = roomById(st.room);
    const slots = $('#tableSlots');
    slots.replaceChildren();
    st.order.forEach((id, i) => {
      if (i >= served) return;
      const d = dishById(id);
      const plate = st.plates[i] || st.plates[0] || room.platingSet[0];
      const a = ANGLES[i % 6] * Math.PI / 180;
      const x = 50 + Math.cos(a) * 34;
      const y = 50 + Math.sin(a) * 34;
      slots.append(el('div', {
        class: 'slot', style: `left:${x}%;top:${y}%`,
        title: `${d.name} · ${plate}`, onclick: () => openRecipe(i)
      }, [
        el('span', { class: 'slot-no', text: cnNum(i + 1) }),
        el('span', { class: 'slot-art', html: renderDishSVG(d, plate, { flavor: st.flavor, swapped: st.allergies, size: 150, uid: 'f' + i }) }),
        el('span', { class: 'slot-name', text: d.name })
      ]));
    });
  }

  /* 菜卡：未上的压暗等着，已上的亮起来 */
  function renderCards(st) {
    const cards = $('#feastCards');
    cards.replaceChildren();
    st.order.forEach((id, i) => {
      const d = dishById(id);
      const plate = st.plates[i] || st.plates[0];
      const tune = tuneOf(d, st.flavor);
      const isServed = i < served;
      cards.append(el('div', {
        class: 'fcard ' + (isServed ? 'served' : 'pending'),
        style: `--c-accent:${d.accent}`,
        onclick: () => openRecipe(i)
      }, isServed ? [
        el('span', { html: renderDishSVG(d, plate, { flavor: st.flavor, swapped: st.allergies, size: 60, uid: 'c' + i }) }),
        el('b', { text: `${cnNum(i + 1)} · ${d.name}` }),
        el('small', { text: tune.length ? tune.join('；') : `${plate}　本色` })
      ] : [
        el('span', { class: 'fcard-wait', text: '待　上' }),
        el('b', { text: `${cnNum(i + 1)} · ${d.name}` }),
        el('small', { text: '点此上这道' })
      ]));
    });
  }

  function syncServeUi(st) {
    const btn = $('#btnServe');
    const left = st.order.length - served;
    if (btn) {
      if (left > 0) {
        btn.hidden = false;
        btn.textContent = `上 菜 · ${cnNum(served + 1)}　${dishById(st.order[served]).name}`;
      } else {
        btn.hidden = true;
      }
    }
    const hint = $('#serveHint');
    if (hint) {
      hint.textContent = served === 0
        ? '客官请落座 —— 按「上菜」，或点下面任一菜卡，一道一道来。'
        : served < st.order.length
          ? `已上 ${cnNum(served)} 道，尚余 ${cnNum(left)} 道。`
          : '六道已齐 —— 看席面评语，也可抄下宴帖、存下宴图。';
    }
    const done = served >= st.order.length;
    const mc = document.querySelector('.moon-card-wrap');
    if (mc) mc.classList.toggle('ready', done);
    ['#btnFeastDownload', '#btnFeastShare'].forEach(sel => {
      const b = $(sel);
      if (b) { if (done) b.removeAttribute('disabled'); else b.setAttribute('disabled', ''); }
    });
  }

  /* 上菜：可一道，也可连上到第 n 道 */
  function serveTo(n, quiet = false) {
    const st = app.state;
    const target = clamp(n, 0, st.order.length);
    if (target <= served || serving) return;
    serving = true;
    const step = () => {
      served += 1;
      const i = served - 1;
      const d = dishById(st.order[i]);
      renderTable(st);
      const slots = $('#tableSlots').querySelectorAll('.slot');
      const just = slots[slots.length - 1];
      if (just) just.classList.add('fresh');
      renderCards(st);
      syncServeUi(st);
      if (!quiet) {
        sfx(i === st.order.length - 1 ? 'gong' : 'cup');
        app.toast(`${cnNum(i + 1)}　${SERVE_LINE[i] || ''}${d.name}　——　${d.texture}。${LAST_TALK[i] || ''}`, 4600);
      }
      if (served < target) setTimeout(step, 640);
      else serving = false;
    };
    step();
  }

  function renderMeta(st) {
    const room = roomById(st.room);
    const w = weatherById(st.weather);
    const t = timeById(st.time);
    const mood = moodById(st.mood);
    const name = feastName(room, w, t, st.mood);

    fx.setRoom(room, w, t);
    fx.api.fit();

    $('#feastSub').textContent = name;
    $('#feastPoem').textContent = `「${st.poem[0]}」`;
    $('#feastPoemSrc').textContent = `—— ${st.poem[1]}`;
    $('#tcName').textContent = room.name;
    $('#tcLine').textContent = room.couplet;

    note('#noteTea', st.tea.map(x => `${x.stage}${x.name}`).join(' · '));
    note('#noteSide', st.side.join(' · '));
    note('#notePlate', Array.from(new Set(st.plates)).join(' · '));
    note('#noteMood', `${mood.name} · ${room.utensils}`);

    const score = computeScore(st.order);
    st.score = score;
    $('#mcName').textContent = name;
    $('#mcLine').textContent = `${st.poem[0]}　—— ${st.poem[1]}`;
    const guests = guestReactions(score);
    const top = guests.reduce((a, b) => (b.value > a.value ? b : a), guests[0]);
    $('#mcMeta').textContent = `${st.order.length}道 · ${st.tea.map(x => x.name).join('·')} · ${st.side.join('、')} · 席面 ${score.overall} 分 · ${top.name}最合`;

    st.shareText = sharingText({
      room, weather: w, time: t, mood: st.mood,
      flavors: [st.flavor], allergies: st.allergies,
      tea: st.tea, side: st.side, plates: st.plates,
      poem: st.poem, score, order: st.order
    });
  }

  function render() {
    const st = app.state;
    if (!st.order || !st.order.length) return;
    served = 0;
    serving = false;
    renderMeta(st);
    renderTable(st);
    renderCards(st);
    syncServeUi(st);
    app.toast('落座 —— 圆桌空着，等菜。', 3800);
  }

  function openRecipe(i) {
    const st = app.state;
    if (i >= served) { serveTo(i + 1); return; }
    app.room.openRecipe(dishById(st.order[i]));
  }

  /* ---------------- 存下宴图：把宴图重绘成一张 PNG ---------------- */
  function buildCardSVG() {
    const st = app.state;
    const room = roomById(st.room);
    const w = weatherById(st.weather);
    const t = timeById(st.time);
    const mood = moodById(st.mood);
    const name = feastName(room, w, t, st.mood);
    const score = st.score || computeScore(st.order);
    const W = 1240, H = 940;
    const sky0 = w.sky[2], sky1 = '#04070d';
    const COORD = [[620, 300], [880, 430], [880, 690], [620, 820], [360, 690], [360, 430]];
    const esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const dishes = st.order.map((id, i) => {
      const d = dishById(id);
      const plate = st.plates[i] || st.plates[0] || room.platingSet[0];
      const [cx, cy] = COORD[i];
      const inner = renderDishSVG(d, plate, { flavor: st.flavor, swapped: st.allergies, size: 176, uid: 'card' + i });
      const body = inner.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
      return `<g transform="translate(${cx - 88} ${cy - 88})">${body}</g>
        <text x="${cx}" y="${cy + 96}" text-anchor="middle" font-size="17" fill="#efe0b6" font-family="serif">${cnNum(i + 1)}. ${esc(d.name)}</text>`;
    }).join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${sky0}"/><stop offset="55%" stop-color="${w.sky[0]}"/><stop offset="100%" stop-color="${sky1}"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff6d6" stop-opacity=".5"/><stop offset="100%" stop-color="#f4e6b0" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="moon" cx="38%" cy="34%" r="70%">
      <stop offset="0%" stop-color="#fffdf3"/><stop offset="58%" stop-color="#f8f0cf"/><stop offset="100%" stop-color="#ded0a0"/>
    </radialGradient>
    <radialGradient id="tbl" cx="42%" cy="34%" r="72%">
      <stop offset="0%" stop-color="#7d5230"/><stop offset="60%" stop-color="#5c3a22"/><stop offset="100%" stop-color="#33200f"/>
    </radialGradient>
    <radialGradient id="rg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="${room.accent}" stop-opacity=".22"/><stop offset="100%" stop-color="${room.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${Array.from({ length: 70 }, (_, i) => `<circle cx="${(i * 173) % W}" cy="${(i * 97) % 420}" r="${.7 + (i % 3) * .5}" fill="#eaf2ff" opacity="${.25 + (i % 5) * .12}"/>`).join('')}
  <circle cx="1010" cy="180" r="${t.moon.r * 4.6}" fill="url(#halo)"/>
  <circle cx="1010" cy="180" r="${t.moon.r * 1.5}" fill="url(#moon)"/>
  <rect y="560" width="${W}" height="${H - 560}" fill="${room.accent}" opacity=".07"/>
  <rect width="${W}" height="${H}" fill="url(#rg)"/>

  <text x="620" y="76" text-anchor="middle" font-size="40" fill="#f7e8bd" font-family="serif" letter-spacing="10">一枝桂赏月宴图</text>
  <text x="620" y="122" text-anchor="middle" font-size="21" fill="#e8cf94" font-family="serif" letter-spacing="5">${esc(name)}</text>
  <text x="620" y="160" text-anchor="middle" font-size="17" fill="#c9b98d" font-family="serif" letter-spacing="2">${esc(w.name)} · ${esc(t.name)}（${esc(t.moonLabel)}）　心愿：${esc(mood.name)}</text>
  <text x="620" y="196" text-anchor="middle" font-size="20" fill="#efe0b6" font-family="serif" letter-spacing="2">「${esc(st.poem[0])}」</text>
  <text x="620" y="222" text-anchor="middle" font-size="13" fill="#8d8161" font-family="serif" letter-spacing="2">—— ${esc(st.poem[1])}</text>

  <ellipse cx="620" cy="600" rx="470" ry="86" fill="#000" opacity=".35"/>
  <circle cx="620" cy="560" r="330" fill="#2a1c14" opacity=".6"/>
  <circle cx="620" cy="560" r="318" fill="url(#tbl)"/>
  <circle cx="620" cy="560" r="318" fill="none" stroke="#8a5a33" stroke-width="7"/>
  <circle cx="620" cy="560" r="252" fill="none" stroke="#c9a76a" stroke-width="2" opacity=".45"/>
  <circle cx="620" cy="560" r="120" fill="#1d120c" opacity=".45"/>
  <circle cx="620" cy="560" r="120" fill="none" stroke="#c9a76a" stroke-width="2" opacity=".5"/>
  <text x="620" y="548" text-anchor="middle" font-size="30" fill="#f7e5b6" font-family="serif" letter-spacing="8">${esc(room.name)}</text>
  <text x="620" y="584" text-anchor="middle" font-size="16" fill="#bda877" font-family="serif" letter-spacing="4">${esc(room.couplet)}</text>

  ${dishes}

  <text x="60" y="830" font-size="15" fill="#c9b98d" font-family="serif" letter-spacing="1">茶饮　${esc(st.tea.map(x => x.stage + x.name).join(' · '))}</text>
  <text x="60" y="856" font-size="15" fill="#c9b98d" font-family="serif" letter-spacing="1">小菜　${esc(st.side.join(' · '))}</text>
  <text x="60" y="882" font-size="15" fill="#c9b98d" font-family="serif" letter-spacing="1">盘器　${esc(Array.from(new Set(st.plates)).join(' · '))}</text>
  <text x="60" y="908" font-size="15" fill="#c9b98d" font-family="serif" letter-spacing="1">席面　清浓相济 ${score.balance} · 浓淡次第 ${score.order} · 总分 ${score.overall}</text>
  <text x="1180" y="908" text-anchor="end" font-size="13" fill="#8d8161" font-family="serif" letter-spacing="2">一 枝 桂</text>
</svg>`;
  }

  function downloadCard() {
    const svgText = buildCardSVG();
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 1240 * 2; c.height = 940 * 2;
      const ctx = c.getContext('2d');
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0, 1240, 940);
      URL.revokeObjectURL(url);
      try {
        const a = document.createElement('a');
        a.download = `${(app.state.room || 'room')}-赏月宴图.png`;
        a.href = c.toDataURL('image/png');
        a.click();
        app.toast('宴图已存下。');
      } catch (err) {
        const a2 = document.createElement('a');
        a2.download = '一枝桂赏月宴图.svg';
        a2.href = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));
        a2.click();
        app.toast('已存为 SVG 宴图。');
      }
    };
    img.onerror = () => {
      const a = document.createElement('a');
      a.download = '一枝桂赏月宴图.svg';
      a.href = url;
      a.click();
      app.toast('已存为 SVG 宴图。');
    };
    img.src = url;
  }

  /* ---------------- 按钮 ---------------- */
  $('#btnServe')?.addEventListener('click', () => serveTo(served + 1));
  $('#btnServeAll')?.addEventListener('click', () => serveTo(app.state.order.length, true));

  $('#btnFeastWalk')?.addEventListener('click', () => { sfx('door'); app.go('corridor'); });
  $('#btnFeastShare')?.addEventListener('click', async () => {
    sfx('tick');
    const text = app.state.shareText || '';
    try {
      await navigator.clipboard.writeText(text);
      app.toast('宴帖已抄好，粘到哪儿都成。');
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.append(ta);
      ta.select();
      try { document.execCommand('copy'); app.toast('宴帖已抄好。'); }
      catch (e2) { app.toast('抄写不便，请手动选取。'); }
      ta.remove();
    }
  });
  $('#btnFeastAgain')?.addEventListener('click', () => {
    app.state.plates = [];
    app.pair.ov = { tea: false, side: false, poem: false, plates: false, order: false };
    app.randomizeAll();
    sfx('gong');
  });
  $('#btnFeastDownload')?.addEventListener('click', () => { sfx('cup'); downloadCard(); });

  app.onEnter('feast', () => {
    render();
    // ?served=N 便于查看上菜中途的样子（也用于自检）
    const n = Number(new URLSearchParams(location.search).get('served'));
    if (n > 0) setTimeout(() => serveTo(Math.min(n, app.state.order.length), true), 30);
  });
  app.bus.on('sitdown', () => { /* 进入场景时统一渲染 */ });
  app.feast = { render, downloadCard, buildCardSVG };
}
