/* =========================================================
   hall.js · 大堂（二）：迎宾与水牌
   ========================================================= */
import { $, pick } from './util.js';
import { weatherById, timeById, GREETINGS, TIME_GREET, WAITER_LINES, ROOMS } from './data.js';
import { HallLight } from './art.js';
import { sfx } from './audio.js';
import { recommendRoom } from './pair.js';

export function initHall(app) {
  const light = new HallLight($('#cvHall'));
  const greetEl = $('#hallGreet');
  const greetSub = $('#hallGreetSub');

  app.animate(dt => {
    if (app.scene !== 'hall') return;
    const w = weatherById(app.state.weather);
    light.cold = w.cold;
    light.step(dt);
    light.draw();
  });

  function greet() {
    const w = weatherById(app.state.weather);
    const t = timeById(app.state.time);
    const line = pick(GREETINGS[w.id] || GREETINGS.sunny);
    if (greetEl) greetEl.textContent = line;
    if (greetSub) {
      greetSub.textContent = `${TIME_GREET[t.id] || ''}　水牌上六道时令，六间雅室：${ROOMS.map(r => r.name).join('、')}。`;
    }
  }

  $('#btnComeBack')?.addEventListener('click', () => { sfx('tick'); app.go('sky'); });
  $('#btnToCorridor')?.addEventListener('click', () => { sfx('door'); app.go('corridor'); });

  function waiterPick() {
    const w = weatherById(app.state.weather);
    const t = timeById(app.state.time);
    const room = recommendRoom(ROOMS, w, t);
    sfx('chime');
    app.state.room = room.id;
    app.toast(`${pick(WAITER_LINES)}　${room.name}——${room.couplet}`);
    setTimeout(() => { app.go('corridor', { focus: room.id }); }, 700);
  }
  $('#btnWaiterPickHall')?.addEventListener('click', waiterPick);
  $('#btnWaiterPick')?.addEventListener('click', waiterPick);

  app.onEnter('hall', () => {
    light.api.fit();
    greet();
  });
}
