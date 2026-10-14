/* =========================================================
   corridor.js · 走廊长卷（三）：一间一间走过，探头，入此间
   ========================================================= */
import { $, el, clamp, lerp, ordinal } from './util.js';
import { ROOMS, roomById, weatherById, timeById } from './data.js';
import { sfx } from './audio.js';

const DOOR_GAP = 470;      // 门与门的距离
const START_X = 420;       // 第一扇门的位置

export function initCorridor(app) {
  const viewport = $('#corridorViewport');
  const world = $('#corridorWorld');
  const doorsBox = $('#cwDoors');
  const thumb = $('#hudThumb');
  const seenEl = $('#hudSeen');
  const preview = $('#preview');
  const seen = new Set();

  /* ---------------- 生成六扇门 ---------------- */
  const doorEls = ROOMS.map((room, i) => {
    const x = START_X + i * DOOR_GAP;
    const node = el('div', { class: 'cw-door', 'data-room': room.id, 'data-x': x, style: `left:${x}px` }, [
      // 门槛石
      el('div', { class: 'door-sill' }),
      // 灯柱（门两侧各一，纯 CSS 石灯）
      el('div', { class: 'door-post pl' }, [el('i'), el('b')]),
      el('div', { class: 'door-post pr' }, [el('i'), el('b')]),
      // 檐下宫灯
      el('div', { class: 'door-lamp' }, [el('i'), el('b')]),
      // 门牌 · 对联
      el('div', { class: 'door-plate', text: room.name }),
      el('div', { class: 'door-couplet', text: room.couplet }),
      // 门洞
      el('div', { class: 'door-frame' }, [
        el('div', { class: 'door-inner-glow' }),
        el('div', { class: 'door-leaf' }),
        el('div', { class: 'door-lintel' })
      ]),
      el('div', { class: 'door-aura', style: `--door-aura:${room.aura}` }),
      el('div', { class: 'door-hint', text: `探头 · ${room.plating}` })
    ]);
    node.addEventListener('click', () => openPreview(room));
    doorsBox.append(node);
    return node;
  });

  // 走廊尽头
  const endX = START_X + ROOMS.length * DOOR_GAP;
  const endEl = $('.cw-end');
  if (endEl) { endEl.style.left = endX + 'px'; }

  const worldW = endX + 400;

  /* ---------------- 镜头 ---------------- */
  let camX = 0, targetX = 0, maxX = 0;
  let dragging = false, startPX = 0, startCam = 0, lastPX = 0, vel = 0;

  function measure() {
    const vw = viewport.clientWidth || window.innerWidth;
    maxX = Math.max(0, worldW - vw);
    world.style.width = worldW + 'px';
    if (thumb) thumb.style.width = Math.max(40, vw / worldW * (thumb.parentElement?.clientWidth || 340)) + 'px';
    targetX = clamp(targetX, 0, maxX);
    camX = clamp(camX, 0, maxX);
    world.style.transform = `translateX(${-camX}px)`;
    updateHud();
  }

  function updateHud() {
    if (thumb) {
      const track = thumb.parentElement;
      const tw = track ? track.clientWidth - thumb.clientWidth : 0;
      thumb.style.left = (maxX > 0 ? (camX / maxX) * tw : 0) + 'px';
    }
    if (seenEl) seenEl.textContent = String(seen.size);
  }

  function nearest() {
    const vw = viewport.clientWidth || window.innerWidth;
    const center = camX + vw / 2;
    let best = null, bd = Infinity;
    doorEls.forEach(n => {
      const x = Number(n.dataset.x);
      const d = Math.abs(x - center);
      if (d < bd) { bd = d; best = n; }
    });
    return { node: best, dist: bd };
  }

  app.animate(() => {
    if (app.scene !== 'corridor') return;
    if (!dragging) {
      if (Math.abs(vel) > .4) {
        targetX = clamp(targetX + vel, 0, maxX);
        vel *= .90;
      }
      camX = lerp(camX, targetX, .12);
      world.style.transform = `translateX(${-camX}px)`;
      updateHud();
    }
    // 靠近的门半开
    const { node, dist } = nearest();
    const vw = viewport.clientWidth || window.innerWidth;
    const nearR = Math.max(300, vw * .34);
    doorEls.forEach(n => {
      const isNear = n === node && dist < nearR;
      n.classList.toggle('near', isNear);
      n.classList.toggle('open', isNear);
    });
  });

  /* ---------------- 拖动 / 滚轮 / 键盘 ---------------- */
  viewport.addEventListener('pointerdown', e => {
    if (e.target.closest('.cw-door .door-frame')) return;
    dragging = true; vel = 0;
    startPX = lastPX = e.clientX;
    startCam = targetX;
    viewport.classList.add('dragging');
    viewport.setPointerCapture?.(e.pointerId);
  });
  window.addEventListener('pointermove', e => {
    if (!dragging || app.scene !== 'corridor') return;
    const dx = e.clientX - startPX;
    targetX = clamp(startCam - dx, 0, maxX);
    camX = targetX;
    world.style.transform = `translateX(${-camX}px)`;
    vel = -(e.clientX - lastPX) * .9;
    lastPX = e.clientX;
    updateHud();
  });
  window.addEventListener('pointerup', () => {
    dragging = false;
    viewport.classList.remove('dragging');
  });

  viewport.addEventListener('wheel', e => {
    if (app.scene !== 'corridor') return;
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    targetX = clamp(targetX + d * 1.15, 0, maxX);
    e.preventDefault();
  }, { passive: false });

  window.addEventListener('keydown', e => {
    if (app.scene !== 'corridor') return;
    if (e.key === 'ArrowRight') { walk(1); }
    if (e.key === 'ArrowLeft') { walk(-1); }
    if (e.key === 'Escape' && !preview.hidden) closePreview();
  });

  function walk(dir) {
    const { node } = nearest();
    let idx = node ? doorEls.indexOf(node) : 0;
    idx = clamp(idx + dir, 0, doorEls.length - 1);
    // 若已在门中心，则走向下一扇
    const vw = viewport.clientWidth || window.innerWidth;
    const cur = camX + vw / 2;
    if (node && Math.abs(Number(node.dataset.x) - cur) < 60) {
      idx = clamp(doorEls.indexOf(node) + dir, 0, doorEls.length - 1);
    }
    focusDoor(ROOMS[idx].id);
    sfx('tick');
  }
  $('#btnWalkLeft')?.addEventListener('click', () => walk(-1));
  $('#btnWalkRight')?.addEventListener('click', () => walk(1));
  $('#btnBackHall')?.addEventListener('click', () => { sfx('door'); app.go('hall'); });

  function focusDoor(id) {
    const node = doorEls.find(n => n.dataset.room === id);
    if (!node) return;
    const vw = viewport.clientWidth || window.innerWidth;
    targetX = clamp(Number(node.dataset.x) - vw / 2, 0, maxX);
  }

  /* ---------------- 探头预览 ---------------- */
  let previewRoom = null;
  function openPreview(room) {
    previewRoom = room;
    seen.add(room.id);
    doorEls.find(n => n.dataset.room === room.id)?.classList.add('seen');
    updateHud();
    const w = weatherById(app.state.weather);
    const t = timeById(app.state.time);
    $('#pvIndex').textContent = `${room.ordinal} · 门半掩着`;
    $('#pvName').textContent = room.name;
    $('#pvCouplet').textContent = room.couplet;
    $('#pvScent').textContent = room.sense.scent;
    $('#pvSound').textContent = room.sense.sound;
    $('#pvIdea').textContent = room.idea;
    $('#pvPoem').textContent = `「${room.poemPool[0][0]}」　—— ${room.poemPool[0][1]}`;
    $('#pvTip').textContent = `${w.name}${t.name}，${room.plating}已摆好，${room.utensils}在侧。`;
    preview.hidden = false;
    sfx('door');
    app.state.room = room.id;
  }
  function closePreview() {
    preview.hidden = true;
    previewRoom = null;
    sfx('tick');
  }
  $('#previewX')?.addEventListener('click', closePreview);
  $('#pvBack')?.addEventListener('click', closePreview);
  preview?.addEventListener('click', e => { if (e.target === preview) closePreview(); });
  $('#pvEnter')?.addEventListener('click', () => {
    if (!previewRoom) return;
    const room = previewRoom;
    preview.hidden = true;
    sfx('door');
    app.state.room = room.id;
    app.toast(`入 ${room.name}　—— ${room.couplet}`);
    setTimeout(() => app.go('room'), 420);
  });

  // 双击门框直接进入
  doorsBox.addEventListener('dblclick', e => {
    const node = e.target.closest('.cw-door');
    if (!node) return;
    const room = roomById(node.dataset.room);
    seen.add(room.id);
    app.state.room = room.id;
    sfx('door');
    app.go('room');
  });

  /* ---------------- 进入走廊 ---------------- */
  app.onEnter('corridor', opts => {
    measure();
    const focus = opts?.focus || app.state.room;
    const node = focus ? doorEls.find(n => n.dataset.room === focus) : null;
    if (node && opts?.focus) {
      // 小二推荐：先落在这扇门前
      const vw = viewport.clientWidth || window.innerWidth;
      targetX = clamp(Number(node.dataset.x) - vw / 2, 0, maxX);
      camX = targetX;
      world.classList.add('nowalk');
      world.style.transform = `translateX(${-camX}px)`;
      requestAnimationFrame(() => world.classList.remove('nowalk'));
      node.classList.add('seen');
      seen.add(focus);
      updateHud();
      app.toast(`小二提灯：${roomById(focus).name}，请。`);
    } else if (node) {
      focusDoor(focus);
    }
  });

  let rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { measure(); }, 140);
  });
  measure();
}
