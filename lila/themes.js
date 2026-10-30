// Темы оформления поля.
// rows — цвета рядов снизу вверх, либо cell(n, row, col) — цвет каждой клетки.
// alpha — непрозрачность клеток (чтобы был виден фоновый рисунок), art — фоновые рисунки (см. ART).

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CHAKRA = ["#e53935", "#fb8c00", "#fdd835", "#43a047", "#1e88e5", "#3949ab", "#8e24aa"];

// Фоновые рисунки: функции, возвращающие SVG-разметку в системе координат 900x800
const ART = {
  cosmos(o = {}) {
    const r = rng(o.seed || 7);
    let s = `<defs>
      <radialGradient id="neb1" cx="30%" cy="30%" r="50%"><stop offset="0" stop-color="${o.c1 || "#c2185b"}" stop-opacity=".7"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <radialGradient id="neb2" cx="75%" cy="65%" r="55%"><stop offset="0" stop-color="${o.c2 || "#3949ab"}" stop-opacity=".8"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <radialGradient id="neb3" cx="50%" cy="90%" r="40%"><stop offset="0" stop-color="${o.c3 || "#00acc1"}" stop-opacity=".5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="900" height="800" fill="${o.base || "#0b0620"}"/>
    <rect width="900" height="800" fill="url(#neb1)"/><rect width="900" height="800" fill="url(#neb2)"/><rect width="900" height="800" fill="url(#neb3)"/>`;
    for (let i = 0; i < (o.stars || 220); i++) {
      const x = r() * 900, y = r() * 800, rad = r() < 0.08 ? 1.8 + r() * 1.5 : 0.4 + r() * 1.1;
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(2)}" fill="#fff" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`;
    }
    return s;
  },
  figure(o = {}) {
    // Медитирующая фигура в позе лотоса с чакрами
    const c = o.color || "#fff", op = o.opacity ?? 0.35;
    let s = `<defs><radialGradient id="aura" cx="50%" cy="45%" r="50%">
        <stop offset="0" stop-color="${o.aura || "#fff"}" stop-opacity="${o.auraOp ?? 0.45}"/><stop offset="1" stop-color="${o.aura || "#fff"}" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="450" cy="400" rx="380" ry="380" fill="url(#aura)"/>
      <g fill="${c}" opacity="${op}">
        <circle cx="450" cy="185" r="50"/>
        <path d="M425 228 h50 v30 h-50z"/>
        <path d="M450 250 C 370 250 340 280 335 330 L 350 470 C 360 500 400 515 450 515 C 500 515 540 500 550 470 L 565 330 C 560 280 530 250 450 250 Z"/>
        <path d="M345 290 C 290 330 270 420 280 520 C 285 560 320 580 360 575 L 380 560 C 335 540 325 480 335 420 Z"/>
        <path d="M555 290 C 610 330 630 420 620 520 C 615 560 580 580 540 575 L 520 560 C 565 540 575 480 565 420 Z"/>
        <path d="M220 610 C 240 540 330 520 450 540 C 570 520 660 540 680 610 C 690 660 600 690 450 680 C 300 690 210 660 220 610 Z"/>
      </g>`;
    if (o.chakras !== false) {
      const ys = [640, 575, 500, 410, 300, 180, 115];
      ys.forEach((y, i) => {
        s += `<circle cx="450" cy="${y}" r="26" fill="${CHAKRA[i]}" opacity=".25"/>
          <circle cx="450" cy="${y}" r="14" fill="${CHAKRA[i]}" opacity="${o.chakraOp ?? 0.85}"/>
          <circle cx="450" cy="${y}" r="5" fill="#fff" opacity=".8"/>`;
      });
    }
    return s;
  },
  flower(o = {}) {
    // Цветок жизни
    const R = o.r || 70, c = o.color || "#fff";
    let s = `<g fill="none" stroke="${c}" stroke-width="${o.w || 2}" opacity="${o.opacity ?? 0.5}">`;
    for (let row = -1; row < 800 / (R * 0.866) + 2; row++) {
      for (let col = -1; col < 900 / R + 2; col++) {
        const x = col * R + (row % 2 ? R / 2 : 0), y = row * R * 0.866;
        s += `<circle cx="${x}" cy="${y}" r="${R}"/>`;
      }
    }
    return s + "</g>";
  },
  mandala(o = {}) {
    const cx = 450, cy = o.cy || 400, c1 = o.c1 || "#ff8a65", c2 = o.c2 || "#f06292";
    let s = `<g opacity="${o.opacity ?? 0.8}">`;
    const rings = [[360, 32, c1, 70], [290, 24, c2, 60], [220, 20, c1, 50], [150, 16, c2, 40], [85, 12, c1, 30]];
    for (const [rad, n, col, len] of rings) {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 360;
        s += `<path transform="rotate(${a} ${cx} ${cy})" d="M${cx} ${cy - rad} q ${len / 3} ${len / 2} 0 ${len} q ${-len / 3} ${-len / 2} 0 ${-len}z" fill="${col}" opacity=".75"/>`;
      }
      s += `<circle cx="${cx}" cy="${cy}" r="${rad + 6}" fill="none" stroke="${col}" stroke-width="3" opacity=".6"/>`;
    }
    return s + `<circle cx="${cx}" cy="${cy}" r="30" fill="${c2}"/></g>`;
  },
  waves(o = {}) {
    let s = `<g fill="none" stroke="${o.color || "#fff"}" stroke-width="3" opacity="${o.opacity ?? 0.25}">`;
    for (let y = 30; y < 820; y += 38) {
      let d = `M-20 ${y}`;
      for (let x = -20; x < 940; x += 60) d += ` q 30 ${y % 76 ? -18 : 18} 60 0`;
      s += `<path d="${d}"/>`;
    }
    return s + "</g>";
  },
  mountains(o = {}) {
    return `<rect width="900" height="800" fill="url(#sky)"/>
      <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe0ff"/><stop offset="1" stop-color="#f4f8fb"/></linearGradient></defs>
      <circle cx="700" cy="150" r="70" fill="#fff6d0" opacity=".9"/>
      <path d="M0 520 L150 300 L260 420 L420 160 L560 380 L680 250 L900 500 V800 H0Z" fill="#8fa6b8" opacity=".7"/>
      <path d="M380 220 L420 160 L460 225 L440 215 L420 240 L400 215Z M640 300 L680 250 L715 305 L690 295Z" fill="#fff"/>
      <path d="M0 640 L200 450 L330 560 L520 400 L700 580 L900 470 V800 H0Z" fill="#5f7a8e" opacity=".7"/>`;
  },
  sun(o = {}) {
    let s = `<g opacity="${o.opacity ?? 0.35}">`;
    for (let i = 0; i < 36; i++) {
      s += `<path transform="rotate(${i * 10} 450 820)" d="M450 820 L435 -300 L465 -300Z" fill="${i % 2 ? "#fff3b0" : "#ffb74d"}"/>`;
    }
    return s + `</g><circle cx="450" cy="820" r="170" fill="#ffe082" opacity=".75"/>`;
  },
  lotus(o = {}) {
    const c = o.color || "#fff";
    let s = `<g opacity="${o.opacity ?? 0.4}" fill="${c}">`;
    const petals = [[-70, 1], [-45, 1], [-20, 1], [0, 1.1], [20, 1], [45, 1], [70, 1]];
    for (const [a, k] of petals) {
      s += `<path transform="rotate(${a} 450 640) scale(1 ${k})" d="M450 640 C 380 520 400 360 450 280 C 500 360 520 520 450 640Z" opacity=".8"/>`;
    }
    return s + `<path d="M180 660 C 300 700 600 700 720 660 C 640 720 260 720 180 660Z"/></g>`;
  },
  tree(o = {}) {
    const r = rng(11);
    let s = `<g opacity="${o.opacity ?? 0.45}"><path d="M420 800 C 430 650 440 560 410 460 L 490 460 C 460 560 470 650 480 800Z" fill="#3e2a14"/>`;
    for (let i = 0; i < 60; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 300;
      s += `<circle cx="${(450 + Math.cos(a) * d * 1.2).toFixed(0)}" cy="${(320 + Math.sin(a) * d * 0.8).toFixed(0)}" r="${(30 + r() * 40).toFixed(0)}" fill="${["#9ccc65", "#7cb342", "#c5e1a5", "#558b2f"][i % 4]}" opacity=".6"/>`;
    }
    return s + "</g>";
  },
  grid(o = {}) {
    let s = `<rect width="900" height="800" fill="#050508"/><g stroke="${o.color || "#ff2bd6"}" stroke-width="1" opacity=".35">`;
    for (let x = 0; x <= 900; x += 25) s += `<line x1="${x}" y1="0" x2="${x}" y2="800"/>`;
    for (let y = 0; y <= 800; y += 25) s += `<line x1="0" y1="${y}" x2="900" y2="${y}"/>`;
    return s + `</g><circle cx="450" cy="400" r="300" fill="none" stroke="#00e5ff" stroke-width="3" opacity=".35"/>`;
  },
  marble() {
    const r = rng(3);
    let s = `<g fill="none" stroke="#b9b0a2" opacity=".5">`;
    for (let i = 0; i < 14; i++) {
      let x = r() * 900, y = 0, d = `M${x.toFixed(0)} 0`;
      while (y < 800) { y += 60 + r() * 60; x += (r() - 0.5) * 160; d += ` L${x.toFixed(0)} ${y.toFixed(0)}`; }
      s += `<path d="${d}" stroke-width="${(0.5 + r() * 2).toFixed(1)}"/>`;
    }
    return s + "</g>";
  },
  wash() {
    const r = rng(5);
    let s = "";
    for (let i = 0; i < 14; i++) {
      s += `<circle cx="${(r() * 900).toFixed(0)}" cy="${(r() * 800).toFixed(0)}" r="${(90 + r() * 150).toFixed(0)}" fill="hsl(${(r() * 360).toFixed(0)} 80% 75%)" opacity=".35"/>`;
    }
    return s;
  },
  sriyantra(o = {}) {
    // Шри-янтра: бхупура, лепестки лотоса, 9 переплетённых треугольников, бинду
    const c = o.color || "#ffd54f", cx = 450, cy = 400;
    let s = `<g fill="none" stroke="${c}" stroke-width="3" opacity="${o.opacity ?? 0.75}">
      <path d="M90 50 H390 V20 H510 V50 H810 V350 H840 V450 H810 V750 H510 V780 H390 V750 H90 V450 H60 V350 H90 Z"/>
      <path d="M105 65 H400 V35 H500 V65 H795 V360 H825 V440 H795 V735 H500 V765 H400 V735 H105 V440 H75 V360 H105 Z" stroke-width="1.5"/>
      <circle cx="${cx}" cy="${cy}" r="330"/><circle cx="${cx}" cy="${cy}" r="318" stroke-width="1.5"/>`;
    const petals = (n, r1, r2) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 360;
        s += `<path transform="rotate(${a} ${cx} ${cy})" d="M${cx - (r2 - r1) * 0.45} ${cy - r1} Q ${cx} ${cy - r2 - 25} ${cx + (r2 - r1) * 0.45} ${cy - r1}"/>`;
      }
    };
    petals(16, 250, 310); s += `<circle cx="${cx}" cy="${cy}" r="250"/>`;
    petals(8, 200, 248); s += `<circle cx="${cx}" cy="${cy}" r="200"/>`;
    const up = [[-130, 120, 190], [-170, 60, 150], [-100, 95, 110], [-55, 45, 75]];
    const down = [[150, -125, 190], [175, -70, 160], [110, -95, 125], [80, -40, 95], [45, -20, 55]];
    for (const [top, base, w] of up) s += `<path d="M${cx} ${cy + top} L${cx + w} ${cy + base} L${cx - w} ${cy + base} Z"/>`;
    for (const [bot, base, w] of down) s += `<path d="M${cx} ${cy + bot} L${cx + w} ${cy + base} L${cx - w} ${cy + base} Z"/>`;
    return s + `</g><circle cx="${cx}" cy="${cy}" r="8" fill="${o.bindu || "#e53935"}"/>`;
  },
  metatron(o = {}) {
    // Куб Метатрона: 13 кругов и линии между всеми центрами
    const c = o.color || "#80deea", cx = 450, cy = 400, d = 120, R = 58;
    const pts = [[cx, cy]];
    for (let k = 1; k <= 2; k++) for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      pts.push([cx + Math.cos(a) * d * k, cy + Math.sin(a) * d * k]);
    }
    let s = `<g fill="none" stroke="${c}" opacity="${o.opacity ?? 0.7}">`;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++)
      s += `<line x1="${pts[i][0].toFixed(1)}" y1="${pts[i][1].toFixed(1)}" x2="${pts[j][0].toFixed(1)}" y2="${pts[j][1].toFixed(1)}" stroke-width="1.2"/>`;
    for (const [x, y] of pts) s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${R}" stroke-width="2.5"/>`;
    return s + `<circle cx="${cx}" cy="${cy}" r="${d * 2 + R + 20}" stroke-width="2"/></g>`;
  },
  shiva(o = {}) {
    // Символы Шивы: ОМ, полумесяц, трезубец-тришула с дамару, третий глаз
    const c = o.color || "#e1f5fe";
    return `<g opacity="${o.opacity ?? 0.55}">
      <text x="450" y="560" text-anchor="middle" font-size="560" fill="${o.om || "#4fc3f7"}" opacity=".25" font-family="serif">ॐ</text>
      <path d="M330 120 A 120 120 0 1 0 330 330 A 95 95 0 1 1 330 120 Z" fill="${c}" opacity=".7"/>
      <g fill="${c}" stroke="${c}">
        <rect x="442" y="150" width="16" height="620" rx="6"/>
        <path d="M450 60 L475 150 L425 150 Z"/>
        <path d="M450 210 C 380 210 360 160 360 90 L 345 90 L 372 40 L 395 90 L 382 90 C 382 150 400 180 450 180 Z"/>
        <path d="M450 210 C 520 210 540 160 540 90 L 555 90 L 528 40 L 505 90 L 518 90 C 518 150 500 180 450 180 Z"/>
        <path d="M410 300 L490 300 L410 380 L490 380 Z" opacity=".85"/>
      </g>
      <path d="M670 330 C 700 290 760 290 790 330 C 760 370 700 370 670 330 Z" fill="none" stroke="${c}" stroke-width="5"/>
      <circle cx="730" cy="330" r="16" fill="#ff7043"/>
      <g stroke="${c}" stroke-width="5" fill="none" opacity=".8">
        <path d="M150 520 h120 M150 560 h120 M150 600 h120"/>
      </g>
      <circle cx="210" cy="560" r="10" fill="#e53935"/>
    </g>`;
  },
  peacock(o = {}) {
    // Перья павлина (Кришна)
    const feather = (x, y, a, k) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(${k})">
        <path d="M0 0 C -8 -150 -4 -300 0 -420" stroke="#c5a14a" stroke-width="4" fill="none"/>
        ${Array.from({ length: 34 }, (_, i) => `<path d="M0 ${-60 - i * 10} q ${i % 2 ? 80 : -80} -30 ${i % 2 ? 110 : -110} -70" stroke="#7cb342" stroke-width="2" fill="none" opacity=".7"/>`).join("")}
        <ellipse cx="0" cy="-430" rx="70" ry="90" fill="#2e7d32"/>
        <ellipse cx="0" cy="-425" rx="52" ry="66" fill="#c0a03a"/>
        <ellipse cx="0" cy="-420" rx="38" ry="48" fill="#00838f"/>
        <ellipse cx="0" cy="-415" rx="24" ry="30" fill="#1a237e"/>
      </g>`;
    return `<g opacity="${o.opacity ?? 0.6}">${feather(450, 820, 0, 1.4)}${feather(250, 820, -25, 1.1)}${feather(650, 820, 25, 1.1)}${feather(120, 820, -45, 0.9)}${feather(780, 820, 45, 0.9)}</g>`;
  },
  oldmap(o = {}) {
    // Старинная морская карта: сетка, румбы, роза ветров, острова
    const r = rng(o.seed || 9), c = o.color || "#6d4c2a";
    let s = `<g fill="none" stroke="${c}" opacity=".35">`;
    for (let x = 0; x <= 900; x += 75) s += `<line x1="${x}" y1="0" x2="${x}" y2="800" stroke-dasharray="4 6"/>`;
    for (let y = 0; y <= 800; y += 75) s += `<line x1="0" y1="${y}" x2="900" y2="${y}" stroke-dasharray="4 6"/>`;
    for (const [px, py] of [[230, 230], [680, 560]]) for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      s += `<line x1="${px}" y1="${py}" x2="${px + Math.cos(a) * 1200}" y2="${py + Math.sin(a) * 1200}" stroke-width=".8"/>`;
    }
    s += "</g>";
    const island = (x, y, size) => {
      let d = "";
      const n = 14;
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2, rr = size * (0.6 + r() * 0.5);
        d += (i ? " L" : "M") + (x + Math.cos(a) * rr * 1.3).toFixed(0) + " " + (y + Math.sin(a) * rr).toFixed(0);
      }
      return `<path d="${d} Z" fill="${o.land || "#cfa86a"}" stroke="${c}" stroke-width="2" stroke-linejoin="round" opacity=".7"/>`;
    };
    s += island(160, 620, 90) + island(760, 170, 110) + island(480, 120, 50) + island(820, 700, 45) + island(90, 140, 60);
    // Роза ветров
    s += `<g transform="translate(450 420)" opacity=".7"><circle r="120" fill="none" stroke="${c}" stroke-width="2"/><circle r="105" fill="none" stroke="${c}"/>`;
    for (let i = 0; i < 8; i++) {
      const L = i % 2 ? 80 : 135;
      s += `<path transform="rotate(${i * 45})" d="M0 ${-L} L14 0 L0 0 Z" fill="${c}"/><path transform="rotate(${i * 45})" d="M0 ${-L} L-14 0 L0 0 Z" fill="${o.land || "#e8cfa0"}" stroke="${c}"/>`;
    }
    return s + `<text y="-145" text-anchor="middle" font-size="34" fill="${c}" font-family="serif">С</text></g>`;
  },
  india(o = {}) {
    // Стилизованная карта Индостана с Гангом и священными городами
    const c = o.color || "#ffcc80";
    const pts = "430,55 500,85 520,150 560,200 620,235 700,255 785,235 830,290 790,330 720,320 690,350 670,395 625,425 590,500 545,580 500,660 465,725 440,740 415,690 390,600 365,510 345,455 300,430 250,410 215,375 250,345 285,320 300,270 335,215 375,150 405,100";
    let s = `<g opacity="${o.opacity ?? 0.6}">
      <polygon points="${pts}" fill="${c}" opacity=".35" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>
      <ellipse cx="505" cy="760" rx="22" ry="32" fill="${c}" opacity=".35" stroke="${c}" stroke-width="3"/>
      <path d="M470 160 C 500 220 540 250 600 290 C 640 320 660 350 680 390" fill="none" stroke="#4fc3f7" stroke-width="6" opacity=".8"/>
      <path d="M440 170 C 440 220 470 250 540 270" fill="none" stroke="#4fc3f7" stroke-width="4" opacity=".7"/>
      <path d="M340 160 C 320 230 300 290 270 350" fill="none" stroke="#4fc3f7" stroke-width="4" opacity=".6"/>
      <path d="M380 130 L420 80 L460 130 L500 90 L540 140" fill="none" stroke="#fff" stroke-width="3" opacity=".8"/>`;
    for (const [x, y, name] of [[470, 150, "Харидвар"], [560, 300, "Варанаси"], [450, 230, "Матхура"], [380, 520, ""], [455, 700, "Каньякумари"], [745, 300, ""]]) {
      s += `<circle cx="${x}" cy="${y}" r="7" fill="#e53935" stroke="#fff" stroke-width="2"/>`;
      if (name) s += `<text x="${x + 12}" y="${y + 5}" font-size="18" fill="#fff" font-family="serif" opacity=".85">${name}</text>`;
    }
    return s + "</g>";
  },
  starmap(o = {}) {
    // Звёздная карта: зодиакальный круг и созвездия
    const r = rng(17), c = o.color || "#ffe082";
    let s = `<g fill="none" stroke="${c}" opacity=".55">
      <circle cx="450" cy="400" r="360" stroke-width="2"/><circle cx="450" cy="400" r="300" stroke-width="1.5"/><circle cx="450" cy="400" r="150" stroke-dasharray="3 6"/>`;
    const signs = "♈♉♊♋♌♍♎♏♐♑♒♓";
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      s += `<line x1="${450 + Math.cos(a) * 300}" y1="${400 + Math.sin(a) * 300}" x2="${450 + Math.cos(a) * 360}" y2="${400 + Math.sin(a) * 360}"/>`;
      const b = a + Math.PI / 12;
      s += `<text x="${(450 + Math.cos(b) * 330).toFixed(0)}" y="${(400 + Math.sin(b) * 330 + 12).toFixed(0)}" text-anchor="middle" font-size="32" fill="${c}" stroke="none">${signs[i]}︎</text>`;
    }
    s += "</g>";
    for (let k = 0; k < 9; k++) {
      let x = 100 + r() * 700, y = 80 + r() * 640, d = `M${x.toFixed(0)} ${y.toFixed(0)}`, stars = "";
      for (let i = 0; i < 4 + r() * 3; i++) {
        x += (r() - 0.5) * 140; y += (r() - 0.5) * 140;
        d += ` L${x.toFixed(0)} ${y.toFixed(0)}`;
        stars += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(2 + r() * 3).toFixed(1)}" fill="#fff"/>`;
      }
      s += `<path d="${d}" fill="none" stroke="#fff" stroke-width="1" opacity=".5"/>${stars}`;
    }
    return s;
  },
  ornament(o = {}) {
    // Орнаментальная рамка
    const c = o.color || "#8a5a2b";
    let s = `<g fill="none" stroke="${c}" opacity="${o.opacity ?? 0.6}"><rect x="10" y="10" width="880" height="780" stroke-width="4"/><rect x="22" y="22" width="856" height="756" stroke-width="1.5"/>`;
    for (let x = 40; x < 880; x += 40) s += `<circle cx="${x}" cy="16" r="4"/><circle cx="${x}" cy="784" r="4"/>`;
    for (let y = 40; y < 780; y += 40) s += `<circle cx="16" cy="${y}" r="4"/><circle cx="884" cy="${y}" r="4"/>`;
    return s + "</g>";
  },
};

const THEMES = [
  // Готовые нарисованные поля: клетки, змеи и стрелы уже на картинке. gx/gy — линии сетки в пикселях (картинка 1254×1254)
  { id: "full1", name: "Рассвет", full: "img/boards/full-1.jpg", size: 1254,
    gx: [54, 184, 314, 441, 572, 696, 814, 941, 1069, 1196], gy: [70, 216, 357, 503, 643, 780, 914, 1044, 1186],
    bg: "linear-gradient(#e9c8f0, #f7c6c9 50%, #6b4c8a)", accent: "#d4a017", border: "#d4a017" },
  { id: "full2", name: "Космическая Лила", full: "img/boards/full-2.jpg", size: 1254,
    gx: [59, 183, 314, 441, 570, 697, 817, 941, 1070, 1198], gy: [105, 248, 388, 532, 670, 810, 940, 1067, 1192],
    bg: "radial-gradient(circle at 50% 10%, #5a1f8a, #12052a 75%)", accent: "#ffcf4d", border: "#ffcf4d" },
  { id: "full3", name: "Шива на Кайласе", full: "img/boards/full-3.jpg", size: 1254,
    gx: [60, 181, 312, 440, 571, 692, 815, 942, 1069, 1201], gy: [138, 280, 418, 563, 703, 839, 971, 1095, 1217],
    bg: "radial-gradient(circle at 50% 10%, #1b4f9a, #030b1f 75%)", accent: "#e8c56a", border: "#e8c56a" },
  { id: "full4", name: "Лакшми", full: "img/boards/full-4.jpg", size: 1254,
    gx: [54, 181, 311, 439, 568, 691, 815, 942, 1069, 1194], gy: [145, 280, 418, 562, 703, 838, 969, 1092, 1215],
    bg: "linear-gradient(#ffe3ec, #f6b3c8 50%, #8a3d5c)", accent: "#d4a017", border: "#d4a017" },
  { id: "chakra", name: "Чакры", rows: ["#f4a6a0", "#f7c49a", "#f6e3a1", "#c5e6a6", "#a9e0d6", "#a9c8ee", "#bcb2ec", "#dcb6ee"],
    alpha: 0.8, art: [["figure", { color: "#6a1b9a", opacity: 0.18, aura: "#fff", auraOp: 0.6 }]],
    ink: "#2b1d10", bg: "radial-gradient(circle at 50% 0%, #3a2550, #1c1424 70%)", accent: "#f2b84b",
    snake: "#2e8b57", arrow: "#b8860b", font: "Georgia, serif" },
  { id: "cosmos", name: "Космос", cell: () => "#140a35", alpha: 0.35,
    art: [["cosmos", {}], ["figure", { color: "#ff6fb5", opacity: 0.5, aura: "#ff9ad5", auraOp: 0.35 }]],
    ink: "#ffffff", shadow: true, bg: "radial-gradient(circle at 50% 20%, #2a1260, #05020f 75%)", accent: "#ff9ad5",
    snake: "#4fc3f7", arrow: "#ffb74d", font: "Georgia, serif", border: "#7c4dff", cellBorder: "#ffffff30", snakeStyle: "scales" },
  { id: "shiva", name: "Шива", cell: () => "#0d2238", alpha: 0.45,
    art: [["cosmos", { base: "#06121f", c1: "#0277bd", c2: "#4a148c", c3: "#006064", stars: 160, seed: 4 }], ["shiva", {}]],
    ink: "#e1f5fe", shadow: true, bg: "radial-gradient(circle at 50% 10%, #0d3b66, #020a12 75%)", accent: "#81d4fa",
    snake: "#b0bec5", arrow: "#ffca28", font: "Georgia, serif", border: "#4fc3f7", cellBorder: "#81d4fa40", snakeStyle: "scales" },
  { id: "krishna", name: "Кришна", rows: ["#0d47a1", "#1045a0", "#13489f", "#164c9e", "#1a509d", "#1e549c", "#22589b", "#265c9a"],
    alpha: 0.55, art: [["peacock", {}]],
    ink: "#fff8e1", shadow: true, bg: "linear-gradient(#1a237e, #03091f)", accent: "#ffd54f", boardBg: "#0a2a6b",
    snake: "#8bc34a", arrow: "#ffd54f", font: "Georgia, serif", border: "#ffd54f", cellBorder: "#ffd54f40", snakeStyle: "scales" },
  { id: "lakshmi", name: "Лотос Лакшми", rows: ["#fde4ec", "#fbd3e0", "#f9c2d4", "#f6b0c7", "#f9c2d4", "#fbd3e0", "#fde4ec", "#fff1f5"],
    alpha: 0.65, art: [["lotus", { color: "#e91e63", opacity: 0.35 }], ["mandala", { c1: "#f8bbd0", c2: "#f48fb1", cy: 300, opacity: 0.35 }]],
    ink: "#6b1f3d", bg: "linear-gradient(#f3a6c0, #6b1f3d)", accent: "#ffe6ef", boardBg: "#fff5f8",
    snake: "#7b9e3e", arrow: "#c2185b", font: "Georgia, serif", gap: 3, radius: 14 },
  { id: "mandala", name: "Мандала", cell: () => "#3a0d4a", alpha: 0.55,
    art: [["mandala", { c1: "#ff8a65", c2: "#f06292" }], ["figure", { color: "#2a0838", opacity: 0.7, aura: "#ffab91", auraOp: 0.2 }]],
    ink: "#ffe9f3", shadow: true, bg: "radial-gradient(circle, #6a1b5a, #1f0626 80%)", accent: "#ffab91",
    snake: "#7cb342", arrow: "#ffe082", font: "Georgia, serif", gap: 4, radius: 50, cellBorder: "#ffab9166", snakeStyle: "scales" },
  { id: "sriyantra", name: "Шри-янтра", cell: () => "#5a0e0e", alpha: 0.5,
    art: [["sriyantra", {}]],
    ink: "#fff3c4", shadow: true, bg: "radial-gradient(circle, #8b1a1a, #250404 80%)", accent: "#ffd54f", boardBg: "#3d0808",
    snake: "#66bb6a", arrow: "#fff176", font: "Georgia, serif", border: "#ffd54f", cellBorder: "#ffd54f40" },
  { id: "metatron", name: "Куб Метатрона", cell: () => "#062a30", alpha: 0.45,
    art: [["cosmos", { base: "#021417", c1: "#00695c", c2: "#01579b", c3: "#1de9b6", stars: 120, seed: 8 }], ["metatron", {}]],
    ink: "#e0f7fa", shadow: true, bg: "radial-gradient(circle, #0a4a52, #010a0c 80%)", accent: "#80deea",
    snake: "#ff8a65", arrow: "#ffe082", font: "'Trebuchet MS', sans-serif", border: "#80deea", cellBorder: "#80deea40", glow: true },
  { id: "flower", name: "Цветок жизни", rows: ["#e3f2fd", "#e1f0fc", "#dceefb", "#d7ebfa", "#d2e8f9", "#cde5f8", "#c8e2f7", "#c3dff6"],
    alpha: 0.55, art: [["flower", { color: "#5c8fc7", opacity: 0.35 }], ["figure", { color: "#c08a6a", opacity: 0.35, chakraOp: 0.6, aura: "#fff", auraOp: 0.7 }]],
    ink: "#23344d", bg: "linear-gradient(#dfeefa, #8fb3d9)", accent: "#2f5d8a",
    snake: "#455a64", arrow: "#8d6e63", font: "Georgia, serif", border: "#5c8fc7", snakeStyle: "scales" },
  { id: "india", name: "Карта Индии", cell: () => "#0f3a4a", alpha: 0.45,
    art: [["waves", { opacity: 0.15 }], ["india", {}]],
    ink: "#fff3e0", shadow: true, bg: "linear-gradient(#0b3a4f, #021820)", accent: "#ffcc80", boardBg: "#0b4f66",
    snake: "#ef5350", arrow: "#ffee58", font: "Georgia, serif", border: "#ffcc80", cellBorder: "#ffcc8040" },
  { id: "oldmap", name: "Старинная карта", rows: ["#e9d8b4", "#ecdcb9", "#efe0bf", "#f1e4c4", "#efe0bf", "#ecdcb9", "#e9d8b4", "#e6d3ad"],
    alpha: 0.45, art: [["oldmap", {}], ["ornament", { color: "#6d4c2a" }]],
    ink: "#4a2e12", bg: "linear-gradient(#5b3b1f, #2e1d0e)", accent: "#c9954c", boardBg: "#efdcb5",
    snake: "#7a3b1e", arrow: "#1f4e79", font: "'Palatino Linotype', Palatino, serif", border: "#8a6a3e", cellBorder: "#8a6a3e55", snakeStyle: "outline" },
  { id: "starmap", name: "Звёздная карта", rows: ["#101a3a", "#13204a", "#162658", "#1a2d66", "#1f3474", "#253b80", "#2c428b", "#344a96"],
    alpha: 0.45, art: [["cosmos", { base: "#060b22", c1: "#1a237e", c2: "#283593", c3: "#4527a0", stars: 260, seed: 21 }], ["starmap", {}]],
    ink: "#f5d77a", shadow: true, bg: "radial-gradient(circle at 30% 10%, #1b2a5c, #050816 75%)", accent: "#f5d77a",
    snake: "#9fb7ff", arrow: "#ffd84a", font: "Georgia, serif", border: "#3a4f9a", cellBorder: "#f5d77a33" },
  { id: "himalaya", name: "Гималаи", rows: ["#8a9aa8", "#9eacb8", "#b2bfc9", "#c6d1d9", "#d5dee4", "#e2e9ee", "#eef3f6", "#ffffff"],
    alpha: 0.45, art: [["mountains", {}]],
    ink: "#1f2d3a", bg: "linear-gradient(#cfe4f5, #3e5466)", accent: "#ffffff",
    snake: "#5d4037", arrow: "#1976d2", font: "Verdana, sans-serif", border: "#ffffff" },
  { id: "ocean", name: "Океан", rows: ["#0b3d5c", "#0e4d70", "#125e85", "#176f99", "#1d80ad", "#2492c0", "#2ea4d2", "#3bb6e2"],
    alpha: 0.75, art: [["waves", { opacity: 0.3 }]],
    ink: "#e8fbff", shadow: true, bg: "linear-gradient(#0a2a40, #021018)", accent: "#7fe3ff",
    snake: "#ff8a5c", arrow: "#fff176", font: "'Trebuchet MS', sans-serif", border: "#7fe3ff", boardBg: "#04263a", snakeStyle: "scales" },
  { id: "forest", name: "Древо жизни", rows: ["#2f4a26", "#36552b", "#3e6131", "#466d37", "#4f7a3d", "#598744", "#64944c", "#70a155"],
    alpha: 0.6, art: [["tree", {}]],
    ink: "#f1f7d8", shadow: true, bg: "linear-gradient(#1f3318, #0b140a)", accent: "#d8e86a", boardBg: "#1f3318",
    snake: "#c0392b", arrow: "#ffd54f", font: "Georgia, serif", gap: 2, radius: 6, snakeStyle: "scales" },
  { id: "sunset", name: "Закат над Гангом", rows: ["#3b0a45", "#5a1157", "#7d1a63", "#a3285f", "#c63e55", "#e35d45", "#f5853a", "#fcb045"],
    alpha: 0.65, art: [["sun", {}]],
    ink: "#fff3e6", shadow: true, bg: "linear-gradient(#fcb045, #3b0a45)", accent: "#ffe0a6",
    snake: "#14213d", arrow: "#fff3b0", font: "Georgia, serif", boardBg: "#3b0a45" },
  { id: "neon", name: "Неон", cell: (n, r, c) => (r + c) % 2 ? "#0d0d14" : "#14141f", alpha: 0.7,
    art: [["grid", {}]],
    ink: "#e8e8ff", bg: "#050508", accent: "#ff2bd6", snake: "#39ff14", arrow: "#00e5ff",
    font: "'Courier New', monospace", border: "#ff2bd6", glow: true, cellBorder: "#ff2bd655", gap: 2, radius: 4 },
  { id: "aqua", name: "Акварель", cell: (n) => `hsl(${(n * 47) % 360} 70% 82%)`, alpha: 0.6,
    art: [["wash", {}]],
    ink: "#2d2a3a", bg: "linear-gradient(135deg, #fbe3e8, #d7ecff 50%, #e5f8d8)", accent: "#6a5acd", boardBg: "#fff",
    snake: "#6a5acd", arrow: "#e67e22", font: "'Comic Sans MS', 'Trebuchet MS', sans-serif", gap: 3, radius: 18, light: true },
];

// Скины кубика
const DICE_SKINS = [
  { id: "classic", name: "Классика", bg: "#ffffff", pip: "#1a1a1a", edge: "#cfcfcf" },
  { id: "ivory", name: "Слоновая кость", bg: "linear-gradient(135deg, #fffaf0, #e8dcc0)", pip: "#7a1f1f", edge: "#c9b991" },
  { id: "ruby", name: "Рубин", bg: "linear-gradient(135deg, #ff5a6e, #9b0020)", pip: "#fff", edge: "#5c0013" },
  { id: "emerald", name: "Изумруд", bg: "linear-gradient(135deg, #5ee6a0, #0b6b3a)", pip: "#fff", edge: "#063d21" },
  { id: "sapphire", name: "Сапфир", bg: "linear-gradient(135deg, #64a8ff, #0d2d8a)", pip: "#fff", edge: "#071a52" },
  { id: "gold", name: "Золото", bg: "linear-gradient(135deg, #fff1a8, #d4a017 50%, #8a6400)", pip: "#3b2a00", edge: "#6b4e00" },
  { id: "onyx", name: "Оникс", bg: "linear-gradient(135deg, #3a3a3a, #050505)", pip: "#f2c94c", edge: "#000" },
  { id: "neon", name: "Неон", bg: "#0a0a12", pip: "#39ff14", edge: "#ff2bd6", glow: "#ff2bd6" },
  { id: "wood", name: "Дерево", bg: "repeating-linear-gradient(100deg, #b07a46 0 6px, #9c6a3a 6px 11px, #c08a55 11px 15px)", pip: "#2b1a0b", edge: "#5a3a1a" },
  { id: "marble", name: "Мрамор", bg: "linear-gradient(120deg, #fafafa 0 40%, #d9d9d9 42%, #fafafa 46% 70%, #cfcfcf 72%, #f5f5f5 76%)", pip: "#b8860b", edge: "#9e9e9e" },
  { id: "lava", name: "Лава", bg: "radial-gradient(circle at 30% 30%, #ffeb3b, #ff5722 45%, #3e0a00)", pip: "#1a0500", edge: "#3e0a00", glow: "#ff5722" },
  { id: "ice", name: "Лёд", bg: "linear-gradient(135deg, #ffffffcc, #b3e5fccc)", pip: "#0277bd", edge: "#81d4fa", glow: "#b3e5fc" },
  { id: "amethyst", name: "Аметист", bg: "linear-gradient(135deg, #e1bee7, #7b1fa2 60%, #4a0072)", pip: "#fff", edge: "#38006b" },
  { id: "rainbow", name: "Радуга", bg: "linear-gradient(135deg, #e53935, #fb8c00, #fdd835, #43a047, #1e88e5, #8e24aa)", pip: "#fff", edge: "#333", pipShadow: true },
  { id: "space", name: "Космос", bg: "radial-gradient(circle at 70% 30%, #7c4dff, #1a0b4d 60%, #05020f)", pip: "#fff", edge: "#000", pipChar: "★" },
];
