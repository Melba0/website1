/* =========================================================
   room.js · 落座（四）：口味忌口心愿 · 上菜次第 · 茶饮小菜盘器诗句
   ========================================================= */
import { $, el, clamp, cnNum, pick } from './util.js';
import {
  DISHES, FLAVORS, ALLERGENS, MOODS,
  roomById, dishById, weatherById, timeById, moodById, allergenName
} from './data.js';
import { RoomAtmosphere } from './art.js';
import { applyRoomDecor } from './decor.js';
import { renderDishSVG, plateStyle } from './dishes.js';
import { tuneOf, swapOf, allergyHits, pickPlate, buildTea, buildSide, buildPoem, computeScore, guestReactions } from './pair.js';
import { sfx } from './audio.js';

export function initRoom(app) {
  const atmo = new RoomAtmosphere($('#cvRoom'));

  app.animate(dt => {
    if (app.scene !== 'room' && app.scene !== 'feast') return;
    if (app.scene === 'room') { atmo.step(dt); atmo.draw(); }
  });

  /* ---------------- 口味 / 忌口 / 心愿 ---------------- */
  const flavorBox = $('#flavorChips');
  const allergyBox = $('#allergyChips');
  const moodBox = $('#moodChips');

  FLAVORS.forEach(f => {
    flavorBox.append(el('button', {
      type: 'button', 'data-flavor': f.id, title: f.short,
      onclick: () => {
        app.state.flavor = f.id; sfx('tab'); roomRerender(app, true);
      }
    }, [f.name]));
  });
  ALLERGENS.forEach(a => {
    allergyBox.append(el('button', {
      type: 'button', 'data-allergy': a.id,
      onclick: e => {
        const has = app.state.allergies.includes(a.id);
        app.state.allergies = has ? app.state.allergies.filter(x => x !== a.id) : [...app.state.allergies, a.id];
        e.currentTarget.classList.toggle('on', !has);
        sfx('tick'); roomRerender(app, true);
      }
    }, [a.name]));
  });
  $('#btnAllergyClear')?.addEventListener('click', () => {
    app.state.allergies = [];
    Array.from(allergyBox.children).forEach(b => b.classList.remove('on'));
    sfx('tick'); roomRerender(app, true);
  });
  MOODS.forEach(m => {
    moodBox.append(el('button', {
      type: 'button', 'data-mood': m.id, title: `庙堂之句：${m.tail}`,
      onclick: () => { app.state.mood = m.id; sfx('tab'); app.pair.ov.poem = false; roomRerender(app, true); }
    }, [m.name]));
  });

  /* ---------------- 上菜次第：每道菜的微调是主角 ---------------- */
  const listEl = $('#courseList');

  function renderCourses() {
    listEl.replaceChildren();
    app.state.order.forEach((id, i) => {
      const d = dishById(id);
      const hits = allergyHits(d, app.state.allergies);
      const tune = tuneOf(d, app.state.flavor);
      const swaps = swapOf(d, app.state.allergies);
      const plate = app.state.plates[i] || app.state.plates[0];

      // 微调框
      const adj = el('div', { class: 'adj' + (tune.length ? '' : ' none') }, [
        el('span', { class: 'adj-k', text: '今 夜 微 调' }),
        el('ul', { class: 'adj-list' },
          tune.length ? tune.map(t => el('li', {}, [t])) : [el('li', {}, ['照本店本色来做，不作加减。'])])
      ]);

      const main = el('div', { class: 'c-main' }, [
        el('div', { class: 'c-name', text: d.name }),
        el('div', { class: 'c-idea', text: `${d.texture} · ${d.idea}` }),
        adj
      ]);

      // 忌口替换
      if (swaps.length) {
        main.append(el('div', { class: 'c-swap' },
          ['已替：' + swaps.map(s => `忌${allergenName(s.for)} → ${s.to}`).join('　')]));
      }

      main.append(el('div', { class: 'c-tags' }, [
        el('span', { class: 'c-tag', text: `${d.light >= 8 ? '清' : d.heavy >= 6 ? '浓' : '中'} · ${d.meat <= 2 ? '素' : d.meat >= 6 ? '荤' : '半荤素'}` }),
        el('span', { class: 'c-tag plate', text: plate || '' }),
        ...hits.map(h => el('span', { class: 'c-tag warn', text: `忌${allergenName(h)}` }))
      ]));

      const node = el('li', {
        class: 'course', draggable: 'true', 'data-id': id, 'data-i': i,
        style: `--c-accent:${d.accent}`
      }, [
        el('span', { class: 'c-no', text: cnNum(i + 1) }),
        el('span', {
          class: 'c-thumb',
          html: renderDishSVG(d, plate, { flavor: app.state.flavor, swapped: app.state.allergies, size: 92, uid: 'r' + i })
        }),
        main,
        el('span', { class: 'c-act' }, [
          el('span', { class: 'c-move' }, [
            el('button', { type: 'button', title: '上移', onclick: e => { e.stopPropagation(); moveCourse(i, -1); } }, ['↑']),
            el('button', { type: 'button', title: '下移', onclick: e => { e.stopPropagation(); moveCourse(i, 1); } }, ['↓'])
          ]),
          el('button', { class: 'mini', type: 'button', onclick: () => openRecipe(d) }, ['配 方 全 卡'])
        ])
      ]);
      listEl.append(node);
    });
    bindDrag();
  }

  function moveCourse(i, dir) {
    const o = app.state.order;
    const j = clamp(i + dir, 0, o.length - 1);
    if (i === j) return;
    [o[i], o[j]] = [o[j], o[i]];
    app.pair.ov.order = true;
    sfx('tick');
    renderCourses(); renderScore(); syncPlates();
  }

  let dragEl = null;
  function bindDrag() {
    Array.from(listEl.children).forEach(node => {
      node.addEventListener('dragstart', e => {
        dragEl = node; node.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', node.dataset.id); } catch (_) { }
      });
      node.addEventListener('dragend', () => {
        node.classList.remove('dragging');
        Array.from(listEl.children).forEach(n => n.classList.remove('drop-target'));
        dragEl = null;
      });
      node.addEventListener('dragover', e => {
        e.preventDefault();
        if (!dragEl || dragEl === node) return;
        node.classList.add('drop-target');
      });
      node.addEventListener('dragleave', () => node.classList.remove('drop-target'));
      node.addEventListener('drop', e => {
        e.preventDefault();
        node.classList.remove('drop-target');
        if (!dragEl || dragEl === node) return;
        const from = app.state.order.indexOf(dragEl.dataset.id);
        const to = app.state.order.indexOf(node.dataset.id);
        if (from < 0 || to < 0) return;
        const o = app.state.order.slice();
        o.splice(to, 0, o.splice(from, 1)[0]);
        app.state.order = o;
        app.pair.ov.order = true;
        sfx('tick');
        renderCourses(); renderScore(); syncPlates();
      });
    });
  }

  /* ---------------- 评分与宾客 ---------------- */
  function renderScore() {
    const s = computeScore(app.state.order);
    app.state.score = s;
    const row = $('#scoreRow');
    row.replaceChildren();
    [['清浓相济', s.balance], ['浓淡次第', s.order], ['冷热相续', s.temp], ['甜意收尾', s.sweetCurve]]
      .forEach(([k, v]) => {
        row.append(el('span', { class: 'sc' }, [
          k,
          el('span', { class: 'sc-bar' }, [el('i', { style: `width:${v}%` })]),
          el('b', { text: String(v) })
        ]));
      });
    const msg = s.overall >= 82 ? '这一席排得极顺，清的先声，浓的押后，甜意收尾，客人能吃到最后一筷。'
      : s.overall >= 62 ? '次第大致安稳，只是有一两处抢了味，调一调更佳。'
        : '眼下这个次序，浓的压了清的，舌头到中段就要钝了。';
    $('#scoreComment').textContent = msg;

    const row2 = $('#guestRow');
    row2.replaceChildren();
    guestReactions(s).forEach(g => {
      row2.append(el('span', { class: `guest ${g.level === 'high' ? 'joy' : g.level === 'low' ? 'meh' : ''}` }, [
        el('b', { text: `${g.name} ` }), g.text
      ]));
    });
  }

  /* ---------------- 茶饮 / 小菜 / 盘器 / 诗 ---------------- */
  function renderRet() {
    const teaList = $('#teaList');
    teaList.replaceChildren();
    app.state.tea.forEach(t => {
      teaList.append(el('li', {}, [`${t.stage} · ${t.name}`, el('small', { text: t.note || '' })]));
    });
    const sideList = $('#sideList');
    sideList.replaceChildren();
    app.state.side.forEach(s => sideList.append(el('li', {}, [s])));
    const names = Array.from(new Set(app.state.plates));
    $('#plateText').textContent = names.join('、') + `　（${roomById(app.state.room).utensils}）`;
    $('#poemText').textContent = `「${app.state.poem[0]}」`;
    $('#poemSrc').textContent = `—— ${app.state.poem[1]}`;
  }

  function syncPlates() {
    app.state.plates = app.state.order.map((id, i) => {
      const d = dishById(id);
      if (app.pair.ov.plates) return app.state.plates[i];
      return pickPlate(roomById(app.state.room), d, app.state.flavor);
    });
  }

  /* ---------------- 组合重算 ---------------- */
  function recompute() {
    const room = roomById(app.state.room);
    const w = weatherById(app.state.weather);
    const t = timeById(app.state.time);
    const ov = app.pair.ov;
    if (!ov.tea) app.state.tea = buildTea(room, w, t, app.state.flavor, app.state.allergies);
    if (!ov.side) app.state.side = buildSide(room, app.state.allergies);
    if (!ov.poem) app.state.poem = buildPoem(room, w, t, app.state.mood);
    if (!ov.plates) syncPlates();
    else app.state.plates = app.state.order.map((id, i) => app.state.plates[i] || pickPlate(room, dishById(id), app.state.flavor));
  }


  /* ---------------- 幕次切换：一次只做一件事 ---------------- */
  const tabs = Array.from(document.querySelectorAll('#stageTabs .stab'));
  const stages = Array.from(document.querySelectorAll('.room-body .stage'));
  const btnStageNext = $('#btnStageNext');
  const wishLine = $('#wishLine');
  const STAGE_NEXT_TEXT = ['次 第 已 定 · 看 看 佐 宴', '佐 宴 已 齐 · 落 座 成 宴', ''];
  let stage = 0;

  function setStage(n) {
    stage = clamp(n, 0, 2);
    const cur = stages[stage];
    // 两帧过渡：先置于偏移态，再落到 'on'，避免入场动画在某些环境下停在起始帧
    stages.forEach((s, i) => {
      if (i === stage) return;
      s.classList.remove('on', 'pre');
    });
    if (cur) {
      cur.classList.remove('on');
      cur.classList.add('pre');
      void cur.offsetHeight;
      requestAnimationFrame(() => {
        cur.classList.remove('pre');
        cur.classList.add('on');
      });
    }
    tabs.forEach((t, i) => t.classList.toggle('on', i === stage));
    if (btnStageNext) {
      btnStageNext.hidden = stage === 2;
      btnStageNext.textContent = STAGE_NEXT_TEXT[stage] || '';
    }
    if (wishLine) {
      const room = roomById(app.state.room);
      const w = weatherById(app.state.weather);
      const t = timeById(app.state.time);
      const mood = moodById(app.state.mood);
      wishLine.textContent =
        `桌上先摆空盘、茶盏、小菜碟 —— 今夜是「${room.name} · ${w.name}${t.name}」，心愿「${mood.name}」。`
        + `口味与忌口定了，佐宴自会相配：${app.state.tea.map(x => x.name).join('、') || '…'}。`;
    }
  }
  tabs.forEach((t, i) => t.addEventListener('click', () => { sfx('tick'); setStage(i); }));
  btnStageNext?.addEventListener('click', () => { sfx('tab'); setStage(stage + 1); });

  /* ---------------- 配方弹层 ---------------- */
  function openRecipe(d) {
    const flavor = app.state.flavor;
    const tune = tuneOf(d, flavor);
    const swaps = swapOf(d, app.state.allergies);
    const idx = app.state.order.indexOf(d.id);
    const plate = app.state.plates[idx] || app.state.plates[0];
    $('#recipeArt').innerHTML = renderDishSVG(d, plate, { flavor, swapped: app.state.allergies, size: 180 });
    $('#recipeName').textContent = d.name;
    $('#recipeIdea').textContent = `${d.texture} · 第${cnNum(idx + 1)}道 · ${plate}`;
    const base = $('#recipeBase');
    base.replaceChildren();
    d.base.forEach(b => base.append(el('li', {}, [b])));
    const tuneEl = $('#recipeTune');
    tuneEl.replaceChildren();
    if (tune.length) tune.forEach(x => tuneEl.append(el('li', {}, [x])));
    else tuneEl.append(el('li', {}, ['照本店本色来做，不作加减。']));
    const sw = $('#recipeSwapSec');
    const swP = $('#recipeSwap');
    if (swaps.length) {
      sw.hidden = false;
      swP.textContent = swaps.map(s => `忌${allergenName(s.for)} → 换 ${s.to}（${s.note}）`).join('；');
    } else {
      sw.hidden = true; swP.textContent = '';
    }
    $('#recipeModal').hidden = false;
    sfx('tick');
  }

  /* ---------------- 随机按钮 ---------------- */
  $('#btnOrderRecommend')?.addEventListener('click', () => {
    app.state.order = recommendOrderLocal();
    app.pair.ov.order = true; app.pair.ov.plates = false;
    sfx('chime'); renderCourses(); renderScore(); syncPlates(); renderRet();
    app.toast('先生定序：清的先行，浓的押后，月饼收尾。');
  });
  $('#btnOrderRandom')?.addEventListener('click', () => {
    app.state.order = shuffleLocal(DISHES.map(d => d.id));
    app.pair.ov.order = true; app.pair.ov.plates = false;
    sfx('toss'); renderCourses(); renderScore(); syncPlates(); renderRet();
    app.toast('随缘排序：这一席由天定。');
  });
  $('#btnTeaShuffle')?.addEventListener('click', () => {
    app.state.tea = buildTea(roomById(app.state.room), weatherById(app.state.weather), timeById(app.state.time), app.state.flavor, app.state.allergies);
    app.pair.ov.tea = true; sfx('cup'); renderRet();
  });
  $('#btnSideShuffle')?.addEventListener('click', () => {
    app.state.side = buildSide(roomById(app.state.room), app.state.allergies);
    app.pair.ov.side = true; sfx('cup'); renderRet();
  });
  $('#btnPlateShuffle')?.addEventListener('click', () => {
    const room = roomById(app.state.room);
    app.state.plates = app.state.order.map(id => {
      const d = dishById(id);
      const cur = app.state.plates[app.state.order.indexOf(id)];
      let p = pickPlate(room, d, app.state.flavor);
      if (p === cur) p = pick(room.platingSet.filter(x => x !== cur)) || p;
      return p;
    });
    app.pair.ov.plates = true; sfx('tick'); renderRet();
    app.toast('换器：仍在本间风格之内。');
  });
  $('#btnPoemShuffle')?.addEventListener('click', () => {
    const room = roomById(app.state.room);
    let p = buildPoem(room, weatherById(app.state.weather), timeById(app.state.time), app.state.mood);
    if (p[0] === app.state.poem[0]) {
      const alt = room.poemPool.filter(x => x[0] !== p[0]);
      if (alt.length) p = pick(alt);
    }
    app.state.poem = p; app.pair.ov.poem = true; sfx('pluck'); renderRet();
  });

  /* ---------------- 离开 / 重来 / 落座 ---------------- */
  $('#btnLeaveRoom')?.addEventListener('click', () => { sfx('door'); app.go('corridor'); });
  $('#btnGlobalRandom')?.addEventListener('click', () => {
    app.state.flavor = pick(FLAVORS).id;
    app.state.mood = pick(MOODS).id;
    app.state.allergies = [];
    app.state.plates = [];
    app.pair.ov = { tea: false, side: false, poem: false, plates: false, order: false };
    app.state.order = recommendOrderLocal();
    recompute();
    sfx('gong'); roomRerender(app, false);
    app.toast('全部重来：口味、心愿、次序、器皿皆重新相配。');
  });
  $('#btnSitDown')?.addEventListener('click', () => {
    recompute();
    sfx('gong');
    app.bus.emit('sitdown', app.state);
    app.go('feast');
  });

  /* ---------------- 统一重绘 ---------------- */
  function renderHead() {
    const room = roomById(app.state.room);
    const w = weatherById(app.state.weather);
    const t = timeById(app.state.time);
    const m = moodById(app.state.mood);
    $('#roomName').textContent = room.name;
    $('#roomCouplet').textContent = room.couplet;
    $('#roomWeatherTag').textContent = `${w.name} · ${t.name}（${t.moonLabel}）`;
    $('#roomSenseTag').textContent = room.sense.scent;
    $('#roomSenseTag').title = room.sense.sound;
    void m;
  }
  function renderChips() {
    Array.from(flavorBox.children).forEach(b => b.classList.toggle('on', b.dataset.flavor === app.state.flavor));
    Array.from(allergyBox.children).forEach(b => b.classList.toggle('on', app.state.allergies.includes(b.dataset.allergy)));
    Array.from(moodBox.children).forEach(b => b.classList.toggle('on', b.dataset.mood === app.state.mood));
  }
  function rerender(recomputePair) {
    if (recomputePair) {
      app.pair.ov.tea = false; app.pair.ov.side = false;
      app.pair.ov.poem = false; app.pair.ov.plates = false;
    }
    recompute();
    renderChips(); renderHead(); renderCourses(); renderScore(); renderRet(); setStage(stage);
  }

  /* ---------------- 打开包间 ---------------- */
  app.onEnter('room', () => {
    atmo.api.fit();
    const room = roomById(app.state.room);
    applyRoomDecor($('#roomDeco'), room.id);
    atmo.set(room, weatherById(app.state.weather), timeById(app.state.time));
    const tint = document.querySelector('.room-tint');
    if (tint) {
      tint.setAttribute('fill', room.palette[0]);
      tint.setAttribute('opacity', room.warm ? '.42' : '.55');
    }
    if (!app.state.order || !app.state.order.length) app.state.order = recommendOrderLocal();
    stage = 0;
    rerender(false);
    app.toast(`落座 ${room.name}　—— 先定口味与忌口，再排次第。`, 4200);
  });

  window.addEventListener('resize', () => atmo.api.fit());
  // 注意：关闭按钮可能点在任何一层，故监听整篇文档
  document.addEventListener('click', e => {
    const t = e.target;
    if (t && t.matches && t.matches('[data-close]')) {
      const m = t.closest && t.closest('.modal');
      if (m) m.hidden = true;
    }
  });
  $('#recipeModal')?.addEventListener('click', e => { if (e.target.id === 'recipeModal') e.target.hidden = true; });

  app.room = {
    renderCourses, renderScore, renderRet, openRecipe, recompute, rerender,
    renderHead, renderChips, setStage
  };
}

/* ---------------- 局部工具（避免循环依赖） ---------------- */
function shuffleLocal(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }
function recommendOrderLocal() { return ['shrimp', 'asparagus', 'crab', 'chicken', 'duck', 'mooncake']; }

/* ---------------- 供外部调用（口味/忌口/心愿变化即整体重绘） ---------------- */
export function roomRerender(app, recomputePair) {
  app.room.rerender(recomputePair);
}
