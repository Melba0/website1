/* =========================================================
   dishes.js · 用 SVG 一笔一笔"摆盘"
   renderDishSVG(dish, plate, opts) -> 完整 <svg> 字符串
   盘器风格 / 替换 / 口味微调 都会影响画面
   ========================================================= */
import { mix } from './util.js';

/* ---------------- 盘器材质 ---------------- */
export const PLATE_STYLES = {
  '青瓷浅盘':        { kind: 'dish',   base: '#cfe0d2', rim: '#8fb39a', inner: '#e8f1e6', texture: 'crackle', accent: '#6d9c7d' },
  '竹编垫盘':        { kind: 'woven',  base: '#c9a86a', rim: '#9c7a3f', inner: '#dcc48c', texture: 'weave',   accent: '#8a6a34' },
  '老木托盘':        { kind: 'tray',   base: '#8a6038', rim: '#5c3d22', inner: '#a3763f', texture: 'grain',   accent: '#4a2f18' },
  '白瓷高足盘':      { kind: 'stem',   base: '#f6f4ee', rim: '#cfc9bd', inner: '#ffffff', texture: 'plain',   accent: '#b9b2a4' },
  '白玉拼盘':        { kind: 'tray',   base: '#eef2ec', rim: '#c3cec6', inner: '#fbfdfa', texture: 'plain',   accent: '#a9b8b0' },
  '银线攒盘':        { kind: 'silver', base: '#d8dee6', rim: '#9aa4b0', inner: '#eef2f7', texture: 'silver',  accent: '#818c99' },
  '青白瓷水波纹盘':  { kind: 'dish',   base: '#dceced', rim: '#8fb6bd', inner: '#f0f8f8', texture: 'wave',    accent: '#6f9bb8' },
  '影青平底盘':      { kind: 'dish',   base: '#d6e8e4', rim: '#8cb0aa', inner: '#eef7f4', texture: 'plain',   accent: '#6d938d' },
  '白瓷莲瓣碟':      { kind: 'petal',  base: '#f4f2ec', rim: '#cbc5b7', inner: '#ffffff', texture: 'petal',   accent: '#b0a894' },
  '冰裂白瓷盘':      { kind: 'dish',   base: '#eef4f8', rim: '#a8c2d6', inner: '#f9fcff', texture: 'crackle', accent: '#8fb6d8' },
  '青石圆盘':        { kind: 'stone',  base: '#6f7a78', rim: '#4b5654', inner: '#87928e', texture: 'stone',   accent: '#3a4442' },
  '白瓷梅瓶碟':      { kind: 'petal',  base: '#f3f6f7', rim: '#c0ccd4', inner: '#fdfeff', texture: 'plain',   accent: '#a6b6c0' },
  '广彩花鸟盘':      { kind: 'dish',   base: '#f2e6cf', rim: '#c0623a', inner: '#fbf4e4', texture: 'guangcai',accent: '#2f7a5f' },
  '黄铜暖盘':        { kind: 'copper', base: '#d9a44c', rim: '#a8742c', inner: '#eec27a', texture: 'metal',   accent: '#8a5a20' },
  '藤编垫盘':        { kind: 'woven',  base: '#cbb079', rim: '#96743c', inner: '#e0c894', texture: 'weave',   accent: '#7d5f2e' },
  '景泰蓝珐琅盘':    { kind: 'enamel', base: '#2f6f9c', rim: '#c9a24a', inner: '#3f86b4', texture: 'cloisonne', accent: '#e0bb5c' },
  '紫铜暖锅':        { kind: 'copper', base: '#c98b4a', rim: '#8d5a24', inner: '#e0a95e', texture: 'metal',   accent: '#7a4a18' },
  '朱漆描金盘':      { kind: 'lacquer',base: '#8f2318', rim: '#d8b45c', inner: '#a83322', texture: 'gold',    accent: '#e8c86a' }
};

export function plateStyle(name) {
  return PLATE_STYLES[name] || PLATE_STYLES['青瓷浅盘'];
}

/* ---------------- 盘器 ---------------- */
function plateSVG(ps, uid) {
  const { base, rim, inner, texture, accent } = ps;
  const g = [];
  const defs = [];
  defs.push(`<radialGradient id="plg${uid}" cx="42%" cy="34%" r="72%">
    <stop offset="0%" stop-color="${mix(base, '#ffffff', .45)}"/>
    <stop offset="58%" stop-color="${base}"/>
    <stop offset="100%" stop-color="${mix(base, '#000000', .16)}"/>
  </radialGradient>`);
  defs.push(`<radialGradient id="pli${uid}" cx="46%" cy="40%" r="70%">
    <stop offset="0%" stop-color="${inner}"/>
    <stop offset="100%" stop-color="${mix(inner, '#000000', .10)}"/>
  </radialGradient>`);

  // 外廓
  if (ps.kind === 'stem') {
    g.push(`<ellipse cx="100" cy="146" rx="56" ry="12" fill="${mix(rim,'#000',.35)}" opacity=".5"/>`);
    g.push(`<path d="M74 104 h52 l8 34 h-68 z" fill="${mix(base,'#000',.12)}"/>`);
  }
  if (ps.kind === 'copper') {
    g.push(`<ellipse cx="100" cy="104" rx="86" ry="18" fill="${mix(base,'#000',.2)}"/>`);
    g.push(`<path d="M18 100 C 14 128, 26 150, 100 150 C 174 150, 186 128, 182 100 Z" fill="${mix(base,'#000',.28)}"/>`);
  }
  if (ps.kind === 'woven') {
    for (let i = -6; i <= 6; i++) {
      const y = 100 + i * 9;
      const w = Math.sqrt(Math.max(0, 82 * 82 - (i * 11) * (i * 11)));
      g.push(`<path d="M${100 - w} ${y} q ${w} ${i % 2 ? 8 : -8} ${w * 2} 0" fill="none" stroke="${accent}" stroke-width="2.4" opacity=".45"/>`);
    }
  }
  // 盘身
  g.push(`<ellipse cx="100" cy="102" rx="84" ry="70" fill="${rim}" opacity=".95"/>`);
  g.push(`<ellipse cx="100" cy="100" rx="80" ry="66" fill="url(#plg${uid})"/>`);
  g.push(`<ellipse cx="100" cy="101" rx="60" ry="48" fill="url(#pli${uid})"/>`);

  // 纹样
  if (texture === 'crackle') {
    for (let i = 0; i < 8; i++) {
      const a = i * .78;
      g.push(`<path d="M${100 + Math.cos(a) * 18} ${101 + Math.sin(a) * 14} L${100 + Math.cos(a + .5) * 58} ${101 + Math.sin(a + .5) * 44}" stroke="${accent}" stroke-width="1" fill="none" opacity=".35"/>`);
    }
  } else if (texture === 'wave') {
    for (let i = 1; i <= 4; i++) {
      const r = 16 + i * 11;
      g.push(`<ellipse cx="100" cy="101" rx="${r}" ry="${r * .8}" fill="none" stroke="${accent}" stroke-width="1.3" opacity=".45"/>`);
    }
    g.push(`<path d="M42 92 q 14 -10 28 0 t 28 0 t 28 0 t 28 0" fill="none" stroke="${accent}" stroke-width="1.6" opacity=".4"/>`);
  } else if (texture === 'petal') {
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2;
      g.push(`<ellipse cx="${100 + Math.cos(a) * 40}" cy="${101 + Math.sin(a) * 33}" rx="13" ry="7" transform="rotate(${a * 57.3} ${100 + Math.cos(a) * 40} ${101 + Math.sin(a) * 33})" fill="${accent}" opacity=".18"/>`);
    }
  } else if (texture === 'guangcai') {
    g.push(`<circle cx="100" cy="101" r="50" fill="none" stroke="${accent}" stroke-width="2" opacity=".5"/>`);
    ['#c0623a', '#2f7a5f', '#c9a24a'].forEach((c, i) => {
      for (let k = 0; k < 4; k++) {
        const a = k * 1.57 + i * .4;
        g.push(`<ellipse cx="${100 + Math.cos(a) * 64}" cy="${101 + Math.sin(a) * 54}" rx="9" ry="5" fill="${c}" opacity=".55"/>`);
      }
    });
    g.push(`<path d="M72 108 q 16 -20 34 -6 q 12 9 24 2" fill="none" stroke="${accent}" stroke-width="1.4" opacity=".4"/>`);
  } else if (texture === 'cloisonne') {
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      g.push(`<circle cx="${100 + Math.cos(a) * 58}" cy="${101 + Math.sin(a) * 48}" r="4" fill="${accent}" opacity=".8"/>`);
    }
    g.push(`<circle cx="100" cy="101" r="38" fill="none" stroke="${accent}" stroke-width="2.4" opacity=".7"/>`);
  } else if (texture === 'gold') {
    g.push(`<circle cx="100" cy="101" r="56" fill="none" stroke="${accent}" stroke-width="1.4" opacity=".6"/>`);
    g.push(`<circle cx="100" cy="101" r="44" fill="none" stroke="${accent}" stroke-width="1" opacity=".45"/>`);
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2;
      g.push(`<circle cx="${100 + Math.cos(a) * 50}" cy="${101 + Math.sin(a) * 42}" r="1.8" fill="${accent}" opacity=".7"/>`);
    }
  } else if (texture === 'metal') {
    for (let i = 0; i < 5; i++) {
      g.push(`<ellipse cx="100" cy="101" rx="${18 + i * 10}" ry="${15 + i * 8}" fill="none" stroke="${mix(base,'#fff',.4)}" stroke-width="1" opacity=".3"/>`);
    }
  } else if (texture === 'stone') {
    for (let i = 0; i < 22; i++) {
      const x = 40 + (i * 37) % 120, y = 60 + (i * 53) % 84;
      g.push(`<circle cx="${x}" cy="${y}" r="${1 + (i % 3)}" fill="${mix(base,'#000',.25)}" opacity=".35"/>`);
    }
  } else if (texture === 'weave') {
    g.push(`<circle cx="100" cy="101" r="58" fill="none" stroke="${accent}" stroke-width="2.6" opacity=".5"/>`);
  } else if (texture === 'grain') {
    for (let i = 0; i < 7; i++) {
      g.push(`<path d="M40 ${74 + i * 9} q 60 -6 120 0" fill="none" stroke="${accent}" stroke-width="1" opacity=".28"/>`);
    }
  }

  // 高光
  g.push(`<ellipse cx="72" cy="72" rx="26" ry="14" transform="rotate(-28 72 72)" fill="#ffffff" opacity=".2"/>`);
  return { defs: defs.join(''), body: g.join('') };
}

/* ---------------- 菜品内容 ---------------- */
function contentSVG(dish, ctx) {
  const { swapped, flavor } = ctx;
  const c = dish.accent;
  const g = [];
  const lt = flavor === 'light' || flavor === 'lessoil';
  const sp = flavor === 'spicy';

  switch (dish.id) {
    case 'shrimp': {
      const done = !swapped.includes('shrimp');
      const sc = done ? '#f6a06a' : '#f4e6c8';
      // 柚瓣
      for (let i = 0; i < 5; i++) {
        const a = -0.5 + i * 0.72;
        g.push(`<path d="M100 100 l ${14 * Math.cos(a)} ${14 * Math.sin(a)} a 16 12 0 0 1 ${-20 * Math.cos(a + .6)} ${-20 * Math.sin(a + .6)} z" fill="#f2c268" opacity=".92"/>`);
      }
      // 主料
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * 6.283 + .3, r = 26;
        const x = 100 + Math.cos(a) * r, y = 100 + Math.sin(a) * r * .8;
        if (done) {
          g.push(`<path d="M${x - 11} ${y} q 5 -12 11 -8 q 6 -4 11 8 q -11 9 -22 0 z" fill="${sc}"/>
                  <path d="M${x - 8} ${y + 1} q 8 5 16 0" fill="none" stroke="#e07f45" stroke-width="1.4"/>`);
        } else {
          g.push(`<circle cx="${x}" cy="${y}" r="10" fill="${sc}"/><circle cx="${x}" cy="${y}" r="10" fill="none" stroke="#d8c8a0" stroke-width="1.2"/>
                  <path d="M${x - 4} ${y + 4} q 4 -7 8 0" fill="none" stroke="#e6d6b0" stroke-width="1.2"/>`);
        }
      }
      g.push(`<path d="M76 84 q 24 -14 48 0" fill="none" stroke="#7fa86a" stroke-width="2" opacity=".8"/>`);
      g.push(`<circle cx="88" cy="118" r="2.4" fill="#3a2a1c"/><circle cx="112" cy="120" r="2.2" fill="#3a2a1c"/><circle cx="100" cy="126" r="2" fill="#3a2a1c"/>`);
      break;
    }
    case 'asparagus': {
      for (let i = 0; i < 6; i++) {
        const a = -1.5 + i * 0.5, r = 30;
        const x = 100 + Math.cos(a) * r, y = 104 + Math.sin(a) * r * .62;
        g.push(`<g transform="rotate(${-40 + i * 27} ${x} ${y})">
          <rect x="${x - 30}" y="${y - 3.4}" width="60" height="6.8" rx="3.4" fill="#6fa64a"/>
          <path d="M${x + 26} ${y - 4} l 12 4 l -12 4 z" fill="#4e7f34"/>
          <path d="M${x - 22} ${y} h 44" stroke="#8dc36a" stroke-width="1.4" opacity=".7"/>
        </g>`);
      }
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * 6.283, r = 18;
        g.push(`<path d="M${100 + Math.cos(a) * r} ${100 + Math.sin(a) * r * .8} q 6 -10 12 2 q -6 8 -12 -2 z" fill="#f7f3e4" opacity=".96"/>`);
      }
      if (sp) g.push(`<circle cx="118" cy="86" r="3" fill="#d8402c"/><circle cx="86" cy="122" r="2.6" fill="#d8402c"/>`);
      g.push(`<circle cx="100" cy="100" r="3.4" fill="#e6dfc4"/>`);
      break;
    }
    case 'crab': {
      const done = !swapped.includes('crab');
      const curry = flavor === 'strong' ? '#c96a1c' : flavor === 'light' ? '#e2b25e' : '#d98a2e';
      g.push(`<ellipse cx="100" cy="103" rx="52" ry="42" fill="${curry}" opacity=".9"/>`);
      g.push(`<ellipse cx="100" cy="103" rx="52" ry="42" fill="none" stroke="${mix(curry,'#000',.25)}" stroke-width="2"/>`);
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * 6.283 + .4;
        g.push(`<ellipse cx="${100 + Math.cos(a) * 30}" cy="${103 + Math.sin(a) * 24}" rx="11" ry="9" fill="#e8d49a" opacity=".9"/>`);
      }
      if (done) {
        g.push(`<g transform="translate(100 96)">
          <ellipse cx="0" cy="0" rx="26" ry="17" fill="#e0663a"/>
          <path d="M-26 -4 q -12 -9 -18 1 q 9 6 18 3 z" fill="#c74e28"/>
          <path d="M26 -4 q 12 -9 18 1 q -9 6 -18 3 z" fill="#c74e28"/>
          <path d="M-14 12 l -6 10 M0 15 l 0 11 M14 12 l 6 10" stroke="#b8421f" stroke-width="3.4" stroke-linecap="round"/>
          <path d="M-16 -8 q 16 -7 32 0" fill="none" stroke="#f4a172" stroke-width="2" opacity=".8"/>
        </g>`);
      } else {
        g.push(`<rect x="76" y="84" width="48" height="26" rx="7" fill="#f2ead4"/><rect x="76" y="84" width="48" height="26" rx="7" fill="none" stroke="#d6c8a4" stroke-width="1.6"/>`);
        g.push(`<path d="M84 96 h32" stroke="#ded0ac" stroke-width="1.6"/>`);
      }
      if (sp) for (let i = 0; i < 4; i++) g.push(`<circle cx="${70 + i * 22}" cy="${72 + (i % 2) * 6}" r="2.6" fill="#cf2f22"/>`);
      g.push(`<path d="M64 126 q 18 -10 36 0 q 18 10 36 0" fill="none" stroke="#f0dca4" stroke-width="2" opacity=".5"/>`);
      break;
    }
    case 'chicken': {
      const done = !swapped.includes('chicken');
      const mc = done ? '#a85c2c' : '#c9a06a';
      g.push(`<ellipse cx="100" cy="103" rx="52" ry="42" fill="${mix(mc,'#000',.22)}" opacity=".9"/>`);
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * 6.283 + .2, r = 26;
        g.push(`<path d="M${100 + Math.cos(a) * r} ${103 + Math.sin(a) * r * .8} q 12 -8 22 2 q -10 12 -22 -2 z" fill="${mc}"/>`);
      }
      // 板栗
      for (let i = 0; i < 4; i++) {
        const a = i / 4 * 6.283 + .8, r = 34;
        g.push(`<ellipse cx="${100 + Math.cos(a) * r}" cy="${103 + Math.sin(a) * r * .74}" rx="12" ry="10" fill="#b07a34"/>
                <ellipse cx="${100 + Math.cos(a) * r - 3}" cy="${103 + Math.sin(a) * r * .74 - 3}" rx="5" ry="3.6" fill="#cf9a4e" opacity=".7"/>`);
      }
      // 香菇
      for (let i = 0; i < 3; i++) {
        const x = 78 + i * 22;
        g.push(`<ellipse cx="${x}" cy="82" rx="12" ry="7" fill="#6b4a30"/>
                <rect x="${x - 4}" y="82" width="8" height="9" fill="#d8c8a8"/>`);
      }
      if (done) g.push(`<circle cx="100" cy="103" r="6" fill="#e8d9b8" opacity=".5"/>`);
      else g.push(`<path d="M74 108 q 26 -12 52 0" fill="none" stroke="#c8a878" stroke-width="2" opacity=".7"/>`);
      g.push(`<path d="M60 130 q 40 -12 80 0" fill="none" stroke="#e0bf84" stroke-width="2" opacity=".4"/>`);
      break;
    }
    case 'duck': {
      const done = !swapped.includes('duck');
      const dc = done ? '#b4632c' : '#d8b47e';
      for (let i = 0; i < 6; i++) {
        const a = -1.72 + i * 0.52, r = 34;
        const x = 100 + Math.cos(a) * r, y = 100 + Math.sin(a) * r * .78;
        g.push(`<g transform="rotate(${-30 + i * 22} ${x} ${y})">
          <ellipse cx="${x}" cy="${y}" rx="26" ry="13" fill="${dc}"/>
          <ellipse cx="${x}" cy="${y - 3}" rx="24" ry="9" fill="${mix(dc,'#ffd9a0',.42)}" opacity=".55"/>
          <path d="M${x - 20} ${y + 7} q 20 6 40 0" fill="none" stroke="${mix(dc,'#000',.3)}" stroke-width="1.4" opacity=".5"/>
        </g>`);
      }
      // 桂花蜜亮面
      for (let i = 0; i < 9; i++) {
        const a = i / 9 * 6.283;
        g.push(`<circle cx="${100 + Math.cos(a) * (22 + (i % 3) * 9)}" cy="${100 + Math.sin(a) * (18 + (i % 3) * 7)}" r="2.6" fill="#f6c851" opacity=".95"/>`);
      }
      g.push(`<path d="M62 122 q 38 -14 76 0" fill="none" stroke="#f0d9a0" stroke-width="2.4" opacity=".45"/>`);
      break;
    }
    case 'mooncake': {
      g.push(`<circle cx="100" cy="101" r="46" fill="#f0e6f2"/>`);
      g.push(`<circle cx="100" cy="101" r="46" fill="none" stroke="#cbb6d4" stroke-width="1.6"/>`);
      // 切分六份
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * 6.283 - .2;
        g.push(`<path d="M100 101 L${100 + Math.cos(a) * 45} ${101 + Math.sin(a) * 45} A 45 45 0 0 1 ${100 + Math.cos(a + 1.047) * 45} ${101 + Math.sin(a + 1.047) * 45} Z" fill="${i % 2 ? '#f7f1f8' : '#ece0f0'}" opacity=".85"/>`);
      }
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * 6.283;
        g.push(`<path d="M100 101 L${100 + Math.cos(a) * 45} ${101 + Math.sin(a) * 45}" stroke="#cbb6d4" stroke-width="1.2" opacity=".7"/>`);
      }
      // 馅心
      g.push(`<circle cx="100" cy="101" r="10" fill="#a8503c" opacity=".85"/>`);
      // 印花
      g.push(`<circle cx="100" cy="101" r="30" fill="none" stroke="#d8c4e0" stroke-width="1" opacity=".8" stroke-dasharray="3 4"/>`);
      g.push(`<circle cx="100" cy="66" r="3.4" fill="#f6c851"/>`);
      g.push(`<ellipse cx="100" cy="140" rx="40" ry="7" fill="#cbb6d4" opacity=".35"/>`);
      break;
    }
  }
  if (lt && dish.id !== 'mooncake') {
    g.push(`<ellipse cx="100" cy="100" rx="46" ry="36" fill="#ffffff" opacity=".07"/>`);
  }
  return g.join('');
}

/**
 * 生成一道菜的完整 SVG 字符串
 * @param {object} dish 菜品
 * @param {string} plateName 盘器名
 * @param {object} opts { flavor, swapped:[], size, uid }
 */
export function renderDishSVG(dish, plateName, opts = {}) {
  const { flavor = 'standard', swapped = [], size = 200, uid = Math.random().toString(36).slice(2, 8) } = opts;
  const ps = plateStyle(plateName);
  const pl = plateSVG(ps, uid);
  const inner = contentSVG(dish, { swapped, flavor });
  const rimRing = `<ellipse cx="100" cy="100" rx="80" ry="66" fill="none" stroke="${ps.rim}" stroke-width="2" opacity=".55"/>`;
  return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${dish.name}">
  <defs>${pl.defs}
    <filter id="ds${uid}" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity=".45"/>
    </filter>
  </defs>
  <g filter="url(#ds${uid})">
    ${pl.body}
    ${rimRing}
    ${inner}
  </g>
</svg>`;
}

/* ---------------- 小件：茶盏 / 小菜碟 ---------------- */
export function renderTeaSVG(name, size = 60) {
  const hot = !/冷泡|酒|柚子茶/.test(name);
  const liquid = /普洱|黄酒|姜茶|单丛|乌龙|铁观音|白茶/.test(name) ? '#8a4a1e'
    : /龙井|茉莉/.test(name) ? '#cfe0a8'
    : /柚子|桂花/.test(name) ? '#e0b45c' : '#b98a3a';
  const steam = hot ? `<g opacity=".5" stroke="#e8e0cc" stroke-width="1.6" fill="none" stroke-linecap="round">
      <path d="M40 34 q -5 -8 0 -15 q 5 -7 0 -13"><animate attributeName="opacity" values=".1;.6;.1" dur="4s" repeatCount="indefinite"/></path>
      <path d="M52 32 q -5 -8 0 -15 q 5 -7 0 -13"><animate attributeName="opacity" values=".5;.1;.5" dur="4.6s" repeatCount="indefinite"/></path>
    </g>` : '';
  return `<svg viewBox="0 0 96 96" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="48" cy="78" rx="26" ry="6" fill="#000" opacity=".35"/>
  <path d="M22 40 h52 a 26 26 0 0 1 -52 0 z" fill="#f2efe6"/>
  <path d="M22 40 h52 a 26 26 0 0 1 -52 0 z" fill="none" stroke="#c8c2b2" stroke-width="1.4"/>
  <ellipse cx="48" cy="40" rx="26" ry="7" fill="${liquid}"/>
  <ellipse cx="48" cy="39" rx="18" ry="4" fill="#fff" opacity=".18"/>
  <path d="M74 46 a 10 10 0 0 1 0 14" fill="none" stroke="#d8d2c2" stroke-width="2"/>
  <ellipse cx="48" cy="74" rx="16" ry="4" fill="#e6e0d2"/>
  ${steam}
</svg>`;
}

export function renderSideSVG(name, size = 60) {
  const color = /花生|栗子|陈皮/.test(name) ? '#c08a44'
    : /毛豆|芦笋/.test(name) ? '#7fa84e'
    : /萝卜/.test(name) ? '#e6dfc4'
    : /藕/.test(name) ? '#e0c8a0'
    : /柚/.test(name) ? '#e8b45c' : '#b98a3a';
  let bits = '';
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * 6.283;
    bits += `<ellipse cx="${48 + Math.cos(a) * 15}" cy="${50 + Math.sin(a) * 11}" rx="8" ry="6" fill="${color}" opacity=".95"/>`;
  }
  return `<svg viewBox="0 0 96 96" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="48" cy="72" rx="30" ry="8" fill="#000" opacity=".32"/>
  <ellipse cx="48" cy="56" rx="34" ry="18" fill="#eae4d6"/>
  <ellipse cx="48" cy="53" rx="30" ry="15" fill="#fbf7ee"/>
  <ellipse cx="48" cy="53" rx="30" ry="15" fill="none" stroke="#cfc8b6" stroke-width="1.2"/>
  ${bits}
  <ellipse cx="40" cy="46" rx="10" ry="4" fill="#fff" opacity=".25"/>
</svg>`;
}
