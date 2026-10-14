/* =========================================================
   decor.js · 六个包间的室内意象（全部 SVG 生成）
   ========================================================= */
import { SVGNS } from './util.js';

const W = 1600, H = 900;

/* 窗棂（木格窗）*/
function lattice(x, y, w, h, cols, rows, color = '#c8a86a', op = .5) {
  const p = [];
  for (let i = 1; i < cols; i++) p.push(`<path d="M${x + w / cols * i} ${y} V${y + h}"/>`);
  for (let j = 1; j < rows; j++) p.push(`<path d="M${x} ${y + h / rows * j} H${x + w}"/>`);
  return `<g stroke="${color}" stroke-width="2" fill="none" opacity="${op}">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" stroke-width="5"/>
    ${p.join('')}
  </g>`;
}

/* 窗外月 */
function windowMoon(cx, cy, r, color = '#f8f0cf', op = 1) {
  return `<g opacity="${op}">
    <circle cx="${cx}" cy="${cy}" r="${r * 3.6}" fill="url(#gHalo)"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>
    <circle cx="${cx - r * .3}" cy="${cy - r * .2}" r="${r * .16}" fill="#d6c184" opacity=".4"/>
    <circle cx="${cx + r * .26}" cy="${cy + r * .3}" r="${r * .1}" fill="#d6c184" opacity=".35"/>
  </g>`;
}

/* 桂花枝（横向探入画面） */
function branch(x, y, scale = 1, rot = 0, flip = false, op = .95) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${flip ? -scale : scale} ${scale})" opacity="${op}">
    <path d="M0 0 C 120 40, 240 96, 330 170 C 380 212, 420 262, 460 320" fill="none" stroke="#4a3a22" stroke-width="7" stroke-linecap="round"/>
    <path d="M70 26 C 96 70, 112 104, 118 150" fill="none" stroke="#4a3a22" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M180 82 C 216 84, 250 74, 286 52" fill="none" stroke="#4a3a22" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M240 130 C 262 176, 274 214, 278 260" fill="none" stroke="#4a3a22" stroke-width="3" stroke-linecap="round"/>
    <g fill="#2f4426" opacity=".9">
      <ellipse cx="52" cy="30" rx="26" ry="9" transform="rotate(-16 52 30)"/>
      <ellipse cx="160" cy="80" rx="28" ry="10" transform="rotate(24 160 80)"/>
      <ellipse cx="300" cy="70" rx="24" ry="9" transform="rotate(-8 300 70)"/>
      <ellipse cx="250" cy="210" rx="24" ry="9" transform="rotate(70 250 210)"/>
      <ellipse cx="400" cy="220" rx="22" ry="8" transform="rotate(28 400 220)"/>
    </g>
    <g fill="#f6c851">
      ${[[44, 16], [120, 44], [196, 84], [268, 128], [332, 176], [96, 110], [222, 190], [300, 244], [178, 20], [258, 66]]
      .map(([dx, dy]) => `<g transform="translate(${dx} ${dy}) scale(.9)">
          <circle cx="0" cy="-6" r="4.4"/><circle cx="5.6" cy="-1.7" r="4.4"/><circle cx="3.5" cy="5" r="4.4"/>
          <circle cx="-3.5" cy="5" r="4.4"/><circle cx="-5.6" cy="-1.7" r="4.4"/><circle cx="0" cy="0" r="2.6" fill="#e39b2b"/>
        </g>`).join('')}
    </g>
  </g>`;
}

/* 桌（斜俯） */
function table(x, y, w, d, color = '#4a2f1c', top = '#6d4526') {
  return `<g>
    <ellipse cx="${x}" cy="${y + d * .5}" rx="${w * .5}" ry="${d * .26}" fill="${color}"/>
    <path d="M${x - w / 2} ${y} h${w} v${d * .5} q ${-w / 2} ${d * .35} ${-w} 0 z" fill="${top}"/>
    <ellipse cx="${x}" cy="${y}" rx="${w * .5}" ry="${d * .26}" fill="${top}"/>
    <ellipse cx="${x}" cy="${y}" rx="${w * .5}" ry="${d * .26}" fill="none" stroke="${color}" stroke-width="3"/>
    <ellipse cx="${x}" cy="${y}" rx="${w * .36}" ry="${d * .17}" fill="none" stroke="${color}" stroke-width="1.4" opacity=".45"/>
  </g>`;
}

/* 灯笼（挂） */
function hangLantern(x, y, s = .5, rope = 60) {
  return `<g transform="translate(${x} ${y})">
    <path d="M0 ${-rope} V 0" stroke="#3b2113" stroke-width="2"/>
    <g class="deco-sway" style="transform-origin:0 0; animation-duration:${5 + (x % 3)}s">
      <g transform="translate(0 0) scale(${s}) translate(-50 -14)">
        <use href="#sLantern"/>
      </g>
    </g>
  </g>`;
}

/* 风铃 */
function windChime(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})" class="deco-sway" style="transform-origin:0 0; animation-duration:4.2s">
    <path d="M0 0 V 46" stroke="#b9c4cc" stroke-width="1.6"/>
    <circle cx="0" cy="52" r="12" fill="#d8e2ea" opacity=".9"/>
    <circle cx="0" cy="52" r="12" fill="none" stroke="#9fb0bd" stroke-width="1.2"/>
    <path d="M0 66 V 96" stroke="#cdd8e0" stroke-width="1.2"/>
    <rect x="-9" y="96" width="18" height="24" rx="3" fill="#e8eef4" opacity=".9"/>
  </g>`;
}

/* 芭蕉叶 */
function banana(x, y, s = 1, rot = -10) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" opacity=".92">
    <path d="M0 0 C 40 -70, 130 -120, 240 -128 C 200 -60, 120 -14, 0 0 z" fill="#3f6b3a"/>
    <path d="M0 0 C 40 -70, 130 -120, 240 -128" fill="none" stroke="#2c4d29" stroke-width="3"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M${16 + i * 28} ${-8 - i * 15} C ${30 + i * 30} ${-46 - i * 15}, ${60 + i * 32} ${-84 - i * 14}, ${96 + i * 34} ${-104 - i * 12}" fill="none" stroke="#2c4d29" stroke-width="1.2" opacity=".6"/>`).join('')}
  </g>`;
}

/* 宫灯 */
function palaceLantern(x, y, s = .6) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M0 -70 V -12" stroke="#6b4a2c" stroke-width="3"/>
    <rect x="-30" y="-14" width="60" height="10" rx="3" fill="#8a5a2c"/>
    <path d="M-46 -8 h92 l-8 78 h-76 z" fill="#a8382a"/>
    <path d="M-46 -8 h92 l-8 78 h-76 z" fill="none" stroke="#e0bb5c" stroke-width="2.4"/>
    <path d="M-30 12 h60 M-32 36 h64 M-34 60 h68" stroke="#e0bb5c" stroke-width="1.6" opacity=".8"/>
    <rect x="-18" y="70" width="36" height="8" rx="2" fill="#8a5a2c"/>
    <g stroke="#c9432c" stroke-width="2.4" fill="none"><path d="M-20 78 v 22"/><path d="M0 78 v 26"/><path d="M20 78 v 22"/></g>
  </g>`;
}

/* 圆光晕 */
function glow(x, y, r, color, op = .3) {
  return `<radialGradient id="dg${x}_${y}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${color}" stop-opacity="${op}"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </radialGradient>
    <circle cx="${x}" cy="${y}" r="${r}" fill="url(#dg${x}_${y})"/>`;
}

/* ---------------- 各间装饰 ---------------- */
const DECOR = {
  /* 桂影阁：江南庭院，木格窗，老桂树 */
  gui() {
    return `
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#gWall)" opacity=".14"/>
    <rect x="0" y="0" width="${W}" height="${H}" fill="#1a2418" opacity=".42"/>
    <!-- 月洞门 -->
    <g opacity=".92">
      <circle cx="330" cy="470" r="250" fill="#0f1a14" opacity=".85"/>
      <circle cx="330" cy="470" r="250" fill="none" stroke="#c8b086" stroke-width="10"/>
      <circle cx="330" cy="470" r="238" fill="none" stroke="#8a7a58" stroke-width="2" opacity=".6"/>
      ${windowMoon(330, 430, 74, '#f8f0cf', .95)}
      <path d="M150 700 q 60 -60 120 -40 q 50 16 90 -10" fill="none" stroke="#1c2b1e" stroke-width="6" opacity=".8"/>
    </g>
    <!-- 木格窗 -->
    ${lattice(700, 200, 300, 380, 4, 6, '#c8a86a', .4)}
    ${windowMoon(850, 350, 92, '#f6ecc9', .9)}
    ${lattice(1120, 240, 260, 320, 3, 5, '#c8a86a', .35)}
    <!-- 老桂树 -->
    <g opacity=".95">
      <path d="M1440 900 C 1430 760, 1420 660, 1396 560 C 1384 512, 1370 480, 1350 452" fill="none" stroke="#2f2419" stroke-width="26" stroke-linecap="round"/>
      <path d="M1396 560 C 1330 520, 1290 500, 1240 496" fill="none" stroke="#2f2419" stroke-width="12" stroke-linecap="round"/>
      <path d="M1370 620 C 1440 596, 1500 596, 1560 620" fill="none" stroke="#2f2419" stroke-width="12" stroke-linecap="round"/>
      <g fill="#22331f" opacity=".95">
        <ellipse cx="1330" cy="470" rx="180" ry="86"/>
        <ellipse cx="1480" cy="560" rx="150" ry="70"/>
        <ellipse cx="1250" cy="560" rx="120" ry="54"/>
      </g>
    </g>
    ${branch(-40, 120, 1.15, 8, false, .9)}
    ${branch(1660, 60, 1.25, 14, true, .85)}
    <!-- 桌与器物 -->
    ${table(820, 700, 620, 240, '#3b2416', '#5d3a22')}
    <g opacity=".95">
      <ellipse cx="700" cy="676" rx="52" ry="22" fill="#cfe0d2"/>
      <ellipse cx="700" cy="672" rx="46" ry="18" fill="#e8f1e6"/>
      <rect x="880" y="640" width="120" height="46" rx="6" fill="#c9a86a"/>
      <path d="M880 660 h120 M880 670 h120 M900 640 v46 M940 640 v46 M980 640 v46" stroke="#8a6a34" stroke-width="1.6" opacity=".6" fill="none"/>
      <ellipse cx="980" cy="700" rx="70" ry="24" fill="#8a6038"/>
      <ellipse cx="980" cy="696" rx="62" ry="20" fill="#a3763f"/>
    </g>
    ${glow(850, 300, 420, '#e8dcb0', .1)}
    ${hangLantern(1150, 150, .5, 90)}
    ${hangLantern(560, 130, .44, 60)}
    `;
  },
  /* 望月台：高台露台，无遮挡 */
  terrace() {
    return `
    <rect x="0" y="0" width="${W}" height="${H}" fill="#1b2434" opacity=".3"/>
    <rect x="0" y="0" width="${W}" height="${H}" fill="#0e1626" opacity=".22"/>
    <g opacity=".9">
      <path d="M0 640 H1600 V900 H0 Z" fill="#141c2b" opacity=".55"/>
      <!-- 远城郭 -->
      <g fill="#0b1220" opacity=".95">
        <path d="M0 640 L0 560 L60 560 L60 528 L120 528 L120 566 L170 566 L170 540 L240 540 L240 578 L300 578 L300 552 L380 552 L380 590 L440 590 L440 566 L520 566 L520 604 L1600 604 L1600 640 Z"/>
        <path d="M1240 604 L1240 512 L1300 480 L1360 512 L1360 604 Z"/>
        <path d="M1420 604 L1420 540 L1470 516 L1520 540 L1520 604 Z"/>
      </g>
      ${windowMoon(1180, 250, 130, '#fffdf3', 1)}
      <!-- 星 -->
      <g fill="#eaf2ff" opacity=".7">
        ${Array.from({ length: 46 }, (_, i) => {
      const x = (i * 271) % 1600, y = (i * 97) % 470;
      return `<circle cx="${x}" cy="${y}" r="${.8 + (i % 3) * .6}"/>`;
    }).join('')}
      </g>
      <!-- 栏杆 -->
      <g stroke="#8fa4bc" stroke-width="5" fill="none" opacity=".8">
        <path d="M0 700 H1600"/><path d="M0 760 H1600"/>
        ${Array.from({ length: 17 }, (_, i) => `<path d="M${30 + i * 96} 700 V 800"/>`).join('')}
      </g>
      <g stroke="#6d829c" stroke-width="3" fill="none" opacity=".7">
        <path d="M0 800 H1600"/><path d="M0 640 H1600" stroke-width="7"/>
      </g>
    </g>
    <g opacity=".95">
      ${table(800, 760, 700, 200, '#243044', '#33455e')}
      <ellipse cx="640" cy="742" rx="58" ry="24" fill="#f6f4ee"/>
      <ellipse cx="640" cy="738" rx="50" ry="20" fill="#ffffff"/>
      <ellipse cx="640" cy="738" rx="34" ry="13" fill="none" stroke="#c9c3b6" stroke-width="1.4"/>
      <ellipse cx="960" cy="746" rx="64" ry="24" fill="#d8dee6"/>
      <ellipse cx="960" cy="742" rx="56" ry="20" fill="#eef2f7"/>
      <g stroke="#cdd6e0" stroke-width="2.6" fill="none" opacity=".9">
        <path d="M1090 726 h120" transform="rotate(-3 1150 726)"/>
        <path d="M1090 738 h120" transform="rotate(3 1150 738)"/>
      </g>
    </g>
    ${glow(1180, 250, 560, '#dce8ff', .12)}
    ${hangLantern(260, 180, .56, 140)}
    `;
  },
  /* 江月榭：临江水榭 */
  river() {
    return `
    <rect x="0" y="0" width="${W}" height="${H}" fill="#101a26" opacity=".45"/>
    <!-- 大窗 -->
    <g>
      <rect x="180" y="120" width="1240" height="520" fill="#0b1522"/>
      <rect x="180" y="120" width="1240" height="520" fill="none" stroke="#6b4a2c" stroke-width="14"/>
      <path d="M800 120 V640" stroke="#6b4a2c" stroke-width="10"/>
      <path d="M180 380 H1420" stroke="#6b4a2c" stroke-width="8"/>
      <!-- 窗外江面 -->
      <rect x="186" y="470" width="1228" height="164" fill="#132a3e"/>
      ${Array.from({ length: 26 }, (_, i) => `<path d="M${200 + i * 48} ${492 + (i % 5) * 26} h${34 - (i % 3) * 8}" stroke="#9dc0e0" stroke-width="2.4" opacity="${.14 + (i % 4) * .07}"/>`).join('')}
      <!-- 江上灯影 -->
      <g fill="#ffcf8a" opacity=".8">
        <ellipse cx="470" cy="556" rx="18" ry="5"/><ellipse cx="470" cy="576" rx="12" ry="3.4" opacity=".5"/>
        <ellipse cx="1080" cy="540" rx="16" ry="4.6"/><ellipse cx="1080" cy="562" rx="10" ry="3" opacity=".45"/>
      </g>
      <!-- 远山 -->
      <path d="M186 470 L360 400 L470 446 L620 372 L760 442 L900 392 L1080 452 L1240 404 L1414 470 Z" fill="#0d1b28" opacity=".95"/>
      ${windowMoon(1010, 250, 96, '#f4f0dc', .95)}
      <!-- 窗外竹影 -->
      <g opacity=".5">
        <path d="M1200 470 C 1204 380, 1210 300, 1220 210" stroke="#16281c" stroke-width="9" fill="none"/>
        <path d="M1260 470 C 1264 396, 1272 330, 1284 260" stroke="#16281c" stroke-width="7" fill="none"/>
        ${[240, 300, 360, 420].map(y => `<path d="M1200 ${y} q 30 -8 56 4 M1260 ${y + 20} q 26 -10 50 0" stroke="#16281c" stroke-width="2" fill="none"/>`).join('')}
      </g>
    </g>
    ${glow(800, 380, 620, '#a8cde8', .1)}
    <!-- 帐幔 -->
    <g opacity=".38" fill="#2c4a5e">
      <path d="M0 0 H300 C 260 140, 250 320, 300 470 C 200 400, 120 200, 0 120 Z"/>
      <path d="M1600 0 H1300 C 1340 140, 1350 320, 1300 470 C 1400 400, 1480 200, 1600 120 Z"/>
    </g>
    <g opacity=".95">
      ${table(800, 780, 720, 200, '#1c3040', '#28455a')}
      <ellipse cx="620" cy="762" rx="62" ry="25" fill="#dceced"/>
      <ellipse cx="620" cy="758" rx="54" ry="21" fill="#f0f8f8"/>
      <ellipse cx="620" cy="758" rx="36" ry="13" fill="none" stroke="#8fb6bd" stroke-width="1.6" opacity=".7"/>
      <ellipse cx="980" cy="764" rx="60" ry="24" fill="#c9dcdd"/>
      <ellipse cx="980" cy="760" rx="52" ry="20" fill="#eef7f4"/>
      <g stroke="#dbe6ee" stroke-width="2.6" fill="none" opacity=".9">
        <path d="M1110 746 h120" transform="rotate(-3 1170 746)"/>
        <path d="M1110 758 h120" transform="rotate(3 1170 758)"/>
      </g>
    </g>
    ${hangLantern(340, 160, .5, 110)}
    ${hangLantern(1300, 150, .44, 80)}
    `;
  },
  /* 霜天阁：高处清寒 */
  frost() {
    return `
    <rect x="0" y="0" width="${W}" height="${H}" fill="#121a24" opacity=".5"/>
    <rect x="0" y="0" width="${W}" height="${H}" fill="#16283c" opacity=".2"/>
    <!-- 霜色窗棂 -->
    ${lattice(140, 140, 380, 460, 4, 6, '#a8c2d6', .55)}
    ${lattice(1080, 140, 380, 460, 4, 6, '#a8c2d6', .55)}
    ${windowMoon(1180, 320, 84, '#eef4fa', .9)}
    <!-- 冰花 -->
    <g stroke="#dfeaf4" stroke-width="1.2" fill="none" opacity=".5">
      ${Array.from({ length: 22 }, (_, i) => {
      const x = (i * 173) % 1560 + 20, y = (i * 311) % 800 + 40;
      return `<g transform="translate(${x} ${y})">
          ${[0, 1, 2, 3, 4, 5].map(k => `<path d="M0 0 l ${18 * Math.cos(k * 1.047)} ${18 * Math.sin(k * 1.047)}"/>`).join('')}
          <circle cx="0" cy="0" r="1.6" fill="#dfeaf4"/>
        </g>`;
    }).join('')}
    </g>
    <!-- 中堂挂画（寒月） -->
    <g opacity=".9">
      <rect x="620" y="130" width="360" height="400" rx="4" fill="#e6ecf2" opacity=".14"/>
      <rect x="620" y="130" width="360" height="400" rx="4" fill="none" stroke="#b9cbd9" stroke-width="4"/>
      ${windowMoon(800, 300, 76, '#dfe9f2', .7)}
      <path d="M650 470 C 720 420, 780 440, 840 400 C 890 368, 930 380, 950 360" fill="none" stroke="#b9cbd9" stroke-width="3" opacity=".7"/>
    </g>
    <!-- 风铃 -->
    ${windChime(560, 150, 1.2)}
    ${windChime(1050, 190, 1)}
    <!-- 石盘桌 -->
    <g opacity=".95">
      <ellipse cx="800" cy="800" rx="340" ry="86" fill="#2a3436"/>
      <ellipse cx="800" cy="782" rx="330" ry="80" fill="#3c4746"/>
      <ellipse cx="800" cy="776" rx="300" ry="70" fill="#4b5654"/>
      <ellipse cx="800" cy="776" rx="240" ry="52" fill="none" stroke="#5f6a68" stroke-width="2" opacity=".7"/>
      <ellipse cx="640" cy="766" rx="62" ry="24" fill="#eef4f8"/>
      <ellipse cx="640" cy="762" rx="54" ry="20" fill="#f9fcff"/>
      <ellipse cx="960" cy="768" rx="58" ry="23" fill="#cfe0ea"/>
      <ellipse cx="960" cy="764" rx="50" ry="19" fill="#eef4f8"/>
    </g>
    ${glow(800, 300, 700, '#cfe4f6', .11)}
    `;
  },
  /* 岭南轩：芭蕉柚子陈皮，暖黄灯 */
  lingnan() {
    return `
    <rect x="0" y="0" width="${W}" height="${H}" fill="#2a2114" opacity=".5"/>
    <rect x="0" y="0" width="${W}" height="${H}" fill="#3a2a12" opacity=".18"/>
    <!-- 花窗 -->
    <g opacity=".85">
      <circle cx="300" cy="330" r="180" fill="#1d1710"/>
      <circle cx="300" cy="330" r="180" fill="none" stroke="#8a6a34" stroke-width="10"/>
      <circle cx="300" cy="330" r="150" fill="none" stroke="#c99a45" stroke-width="2" opacity=".6"/>
      ${Array.from({ length: 8 }, (_, i) => `<path d="M300 330 L${300 + Math.cos(i * .785) * 150} ${330 + Math.sin(i * .785) * 150}" stroke="#8a6a34" stroke-width="3" opacity=".7"/>`).join('')}
      <circle cx="300" cy="330" r="34" fill="#c99a45" opacity=".5"/>
    </g>
    <!-- 芭蕉 -->
    ${banana(1160, 620, 1.25, -14)}
    ${banana(1330, 700, 1.5, 8)}
    ${banana(1420, 560, 1.05, -28)}
    <!-- 竹帘 -->
    <g opacity=".35">
      ${Array.from({ length: 26 }, (_, i) => `<path d="M820 ${60 + i * 22} H1180" stroke="#c9a86a" stroke-width="2.4"/>`).join('')}
      <path d="M820 60 V 640 M1180 60 V 640" stroke="#8a6a34" stroke-width="3"/>
    </g>
    <!-- 酸枝木桌 -->
    ${table(760, 760, 760, 240, '#2a1a10', '#4a2f1c')}
    <g opacity=".95">
      <ellipse cx="560" cy="740" rx="66" ry="26" fill="#f2e6cf"/>
      <ellipse cx="560" cy="736" rx="58" ry="22" fill="#fbf4e4"/>
      <ellipse cx="560" cy="736" rx="40" ry="14" fill="none" stroke="#c0623a" stroke-width="2" opacity=".65"/>
      <ellipse cx="960" cy="744" rx="70" ry="27" fill="#d9a44c"/>
      <ellipse cx="960" cy="740" rx="62" ry="23" fill="#eec27a"/>
      <g fill="#c98a2c" opacity=".95">
        <circle cx="1090" cy="716" r="16"/><circle cx="1130" cy="726" r="14"/><circle cx="1160" cy="712" r="12"/>
        <path d="M1090 700 q 10 -8 20 0" fill="#6d8a3a"/>
      </g>
      <rect x="660" y="676" width="110" height="40" rx="5" fill="#cbb079"/>
      <path d="M660 690 h110 M660 702 h110 M686 676 v40 M712 676 v40 M738 676 v40" stroke="#7d5f2e" stroke-width="1.6" opacity=".6" fill="none"/>
    </g>
    ${glow(800, 380, 700, '#ffc876', .16)}
    ${hangLantern(500, 150, .5, 90)}
    ${hangLantern(1060, 130, .46, 70)}
    `;
  },
  /* 京华厅：京味华贵 */
  palace() {
    return `
    <rect x="0" y="0" width="${W}" height="${H}" fill="#1e1111" opacity=".55"/>
    <rect x="0" y="0" width="${W}" height="${H}" fill="#3a1c14" opacity=".16"/>
    <!-- 藻井 -->
    <g opacity=".8">
      <rect x="520" y="0" width="560" height="180" fill="#2c1a14"/>
      ${Array.from({ length: 5 }, (_, i) => `<rect x="${560 + i * 46}" y="${20 + i * 14}" width="${480 - i * 92}" height="${140 - i * 28}" fill="none" stroke="#c9a24a" stroke-width="2.6" opacity="${.8 - i * .13}"/>`).join('')}
      <circle cx="800" cy="90" r="30" fill="#c9a24a" opacity=".55"/>
    </g>
    <!-- 朱柱 -->
    <g>
      <rect x="120" y="0" width="66" height="900" fill="#7a1f16"/>
      <rect x="120" y="0" width="66" height="900" fill="none" stroke="#c9a24a" stroke-width="3" opacity=".5"/>
      <rect x="1414" y="0" width="66" height="900" fill="#7a1f16"/>
      <rect x="1414" y="0" width="66" height="900" fill="none" stroke="#c9a24a" stroke-width="3" opacity=".5"/>
    </g>
    <!-- 窗外的宫墙月 -->
    <g opacity=".95">
      <rect x="1000" y="120" width="360" height="380" fill="#0d1420"/>
      <rect x="1000" y="120" width="360" height="380" fill="none" stroke="#c9a24a" stroke-width="10"/>
      <path d="M1180 120 V500" stroke="#c9a24a" stroke-width="6"/>
      <path d="M1000 310 H1360" stroke="#c9a24a" stroke-width="6"/>
      ${windowMoon(1270, 230, 74, '#f8f0cf', .95)}
      <path d="M1006 420 H1354 L1354 380 L1300 352 L1240 372 L1180 344 L1120 372 L1060 350 L1006 380 Z" fill="#3a1c18" opacity=".95"/>
      <path d="M1006 420 H1354" stroke="#c9a24a" stroke-width="3" opacity=".6"/>
    </g>
    <!-- 多宝格 -->
    <g opacity=".9">
      <rect x="220" y="180" width="300" height="360" fill="#3a1f18" stroke="#8a5a2c" stroke-width="6"/>
      <path d="M220 300 H520 M220 420 H520 M320 180 V540 M420 180 V540" stroke="#8a5a2c" stroke-width="5" fill="none"/>
      <ellipse cx="270" cy="286" rx="30" ry="12" fill="#c9a24a" opacity=".7"/>
      <ellipse cx="470" cy="406" rx="26" ry="10" fill="#2f6f9c" opacity=".8"/>
      <rect x="345" y="404" width="52" height="14" rx="3" fill="#c9a24a" opacity=".7"/>
      <ellipse cx="470" cy="286" rx="22" ry="9" fill="#7fa88a" opacity=".8"/>
    </g>
    <!-- 红木圆桌 -->
    <g opacity=".97">
      <ellipse cx="800" cy="806" rx="360" ry="92" fill="#23120e"/>
      <ellipse cx="800" cy="786" rx="350" ry="86" fill="#4a221a"/>
      <ellipse cx="800" cy="780" rx="316" ry="76" fill="#5c2a1e"/>
      <ellipse cx="800" cy="780" rx="250" ry="56" fill="none" stroke="#c9a24a" stroke-width="2" opacity=".55"/>
      <ellipse cx="620" cy="770" rx="66" ry="26" fill="#2f6f9c"/>
      <ellipse cx="620" cy="766" rx="58" ry="22" fill="#3f86b4"/>
      <ellipse cx="620" cy="766" rx="40" ry="15" fill="none" stroke="#e0bb5c" stroke-width="2" opacity=".8"/>
      <ellipse cx="980" cy="772" rx="72" ry="28" fill="#c98b4a"/>
      <ellipse cx="980" cy="768" rx="64" ry="24" fill="#e0a95e"/>
      <ellipse cx="980" cy="768" rx="44" ry="16" fill="none" stroke="#8d5a24" stroke-width="2" opacity=".7"/>
    </g>
    ${glow(800, 360, 760, '#ffb46a', .13)}
    ${palaceLantern(360, 330, .62)}
    ${palaceLantern(1240, 330, .62)}
    `;
  }
};

export function roomDecor(roomId) {
  const fn = DECOR[roomId] || DECOR.gui;
  return fn();
}

/* 把装饰写进 <g id="roomDeco"> 并加上 SVG 命名空间 */
export function applyRoomDecor(gEl, roomId) {
  if (!gEl) return;
  const host = gEl.ownerSVGElement;
  const wrap = document.createElementNS(SVGNS, 'g');
  wrap.innerHTML = roomDecor(roomId);
  gEl.replaceChildren(...Array.from(wrap.childNodes));
  void host;
  return gEl;
}
