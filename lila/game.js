const COLORS = ["#e0566b", "#4ba3f2", "#5ccf7a", "#f2b84b", "#b07af2", "#f27ac8"];
const SAVE_KEY = "lila-save-v1";
const PREFS_KEY = "lila-prefs-v1";

const $ = (id) => document.getElementById(id);
const board = $("board");

let state = null;
let busy = false;
let prefs = { theme: "chakra", dice: "classic", autoCard: true };
try { Object.assign(prefs, JSON.parse(localStorage.getItem(PREFS_KEY)) || {}); } catch (e) {}

const theme = () => THEMES.find((t) => t.id === prefs.theme) || THEMES[0];
const diceSkin = () => DICE_SKINS.find((d) => d.id === prefs.dice) || DICE_SKINS[0];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cellName = (n) => `<b>${n}. ${CELLS[n][0]}</b>`;
const val = (v, ...a) => (typeof v === "function" ? v(...a) : v);

// Координаты клетки (центр) в процентах: 1 — левый нижний угол, ряды «змейкой»
function cellPos(n) {
  const row = Math.floor((n - 1) / 9);
  const i = (n - 1) % 9;
  const col = row % 2 === 0 ? i : 8 - i;
  return { x: (col + 0.5) / 9 * 100, y: (7 - row + 0.5) / 8 * 100, row, col };
}
const cellAt = (r, c) => r * 9 + (r % 2 === 0 ? c : 8 - c) + 1;
const cellColor = (t, n, r, c) => (t.cell ? t.cell(n, r, c) : t.rows[r]);

// Уникальные id внутри SVG, чтобы градиенты разных рисунков не путались
let uidCounter = 0;
function artSvg(t) {
  const uid = "u" + uidCounter++;
  const s = (t.art || []).map(([name, opts]) => ART[name](opts)).join("");
  return s.replace(/id="(\w+)"/g, `id="$1_${uid}"`).replace(/url\(#(\w+)\)/g, `url(#$1_${uid})`);
}

/* ---------- Картинки (необязательные) ----------
   Если в папке img/ лежат картинки, игра использует их, иначе рисует сама.
   img/boards/<id темы>.png, img/dice/<id скина>.png, img/tokens/sheet-1..6.png (сетка 5×5) */

const boardImg = (t) => `<img class="art-img" src="img/boards/${t.id}.png" alt="" onerror="this.remove()">`;
const sheetOk = [];
for (let k = 0; k < Math.ceil(TOKENS.length / 25); k++) {
  const im = new Image();
  im.onload = () => { sheetOk[k] = true; if (state) render(); };
  im.src = `img/tokens/sheet-${k + 1}.png`;
}
function tokenHtml(tk) {
  const i = TOKENS.indexOf(tk), k = Math.floor(i / 25);
  if (i < 0 || !sheetOk[k]) return tk;
  const j = i % 25;
  return `<span class="tkimg" style="background-image:url(img/tokens/sheet-${k + 1}.png);background-position:${(j % 5) * 25}% ${Math.floor(j / 5) * 25}%"></span>`;
}

/* ---------- Поле ---------- */

function buildBoard() {
  const t = theme();
  document.body.style.background = t.bg;
  document.body.style.setProperty("--accent", t.accent);
  board.style.setProperty("--board-border", t.border || t.accent);
  board.style.setProperty("--gap", (t.gap || 0) + "px");
  board.style.setProperty("--radius", (t.radius || 0) + "%");
  board.style.setProperty("--cell-border", t.cellBorder || "rgba(0,0,0,.25)");
  board.style.background = t.boardBg || "transparent";
  board.style.fontFamily = t.font;
  board.classList.toggle("glow", !!t.glow);
  board.classList.toggle("shadow", !!t.shadow);

  let cells = "";
  for (let r = 7; r >= 0; r--) {
    for (let c = 0; c < 9; c++) {
      const n = cellAt(r, c);
      const bg = cellColor(t, n, r, c);
      const a = Math.round((t.alpha ?? 1) * 100);
      cells += `<div class="cell${n === GOAL ? " goal" : ""}" id="c${n}" data-n="${n}"
        style="background:color-mix(in srgb, ${bg} ${a}%, transparent);color:${val(t.ink, n, r, c)}">
        <span class="n">${n}</span><span class="t">${CELLS[n][0]}</span></div>`;
    }
  }
  board.innerHTML = `<svg class="art" viewBox="0 0 900 800" preserveAspectRatio="none">${artSvg(t)}</svg>${boardImg(t)}
    <div class="grid">${cells}</div>${overlaySvg(t)}`;
  board.querySelectorAll(".cell").forEach((el) => (el.onclick = () => openCard(+el.dataset.n)));
}

function overlaySvg(t) {
  // viewBox 900x800: клетка 100x100
  const p = (n) => { const q = cellPos(n); return [q.x * 9, q.y * 8]; };
  let s = `<svg class="overlay" viewBox="0 0 900 800" preserveAspectRatio="none">`;
  for (const [from, to] of Object.entries(ARROWS)) {
    const [x1, y1] = p(+from), [x2, y2] = p(to);
    s += arrowSvg(x1, y1, x2, y2, t.arrow);
  }
  for (const [from, to] of Object.entries(SNAKES)) {
    const [x1, y1] = p(+from), [x2, y2] = p(to);
    s += snakeSvg(x1, y1, x2, y2, t.snake, t.snakeStyle);
  }
  return s + "</svg>";
}

function arrowSvg(x1, y1, x2, y2, col) {
  const a = Math.atan2(y2 - y1, x2 - x1), deg = (a * 180) / Math.PI;
  const head = `<path transform="translate(${x2} ${y2}) rotate(${deg})" d="M6 0 L-22 -12 L-16 0 L-22 12 Z" fill="${col}" stroke="#0006" stroke-width="1.5"/>`;
  const fl = `<g transform="translate(${x1} ${y1}) rotate(${deg})" fill="${col}" opacity=".9">
      <path d="M0 0 L-14 -12 L-4 -12 L10 0 Z"/><path d="M0 0 L-14 12 L-4 12 L10 0 Z"/>
      <path d="M14 0 L0 -12 L10 -12 L24 0 Z"/><path d="M14 0 L0 12 L10 12 L24 0 Z"/></g>`;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#0005" stroke-width="7" stroke-linecap="round"/>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="4" stroke-linecap="round"/>${fl}${head}`;
}

function snakeSvg(x1, y1, x2, y2, col, style) {
  const d = wave(x1, y1, x2, y2);
  const a = Math.atan2(y2 - y1, x2 - x1), deg = (a * 180) / Math.PI;
  let s;
  if (style === "outline") {
    s = `<path d="${d}" fill="none" stroke="${col}" stroke-width="12" stroke-linecap="round"/>
      <path d="${d}" fill="none" stroke="#fff8" stroke-width="7" stroke-linecap="round"/>
      <path d="${d}" fill="none" stroke="${col}" stroke-width="2" stroke-dasharray="2 6"/>`;
  } else {
    s = `<path d="${d}" fill="none" stroke="#0006" stroke-width="13" stroke-linecap="round"/>
      <path d="${d}" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round"/>`;
    if (style === "scales") s += `<path d="${d}" fill="none" stroke="#fff7" stroke-width="5" stroke-dasharray="1 7" stroke-linecap="round"/>`;
    else s += `<path d="${d}" fill="none" stroke="#fff3" stroke-width="2.5" stroke-linecap="round"/>`;
  }
  // Голова змеи смотрит против направления к хвосту
  return s + `<g transform="translate(${x1} ${y1}) rotate(${deg + 180})">
      <ellipse cx="4" cy="0" rx="17" ry="12" fill="${col}" stroke="#0007" stroke-width="2"/>
      <circle cx="9" cy="-5" r="2.6" fill="#fff"/><circle cx="9" cy="5" r="2.6" fill="#fff"/>
      <circle cx="10" cy="-5" r="1.2" fill="#000"/><circle cx="10" cy="5" r="1.2" fill="#000"/>
      <path d="M20 0 l10 0 l4 -4 M30 0 l4 4" stroke="#c62828" stroke-width="2" fill="none"/></g>`;
}

function wave(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len, k = Math.max(3, Math.round(len / 90)), amp = 18;
  let d = `M${x1},${y1}`;
  for (let i = 1; i <= k; i++) {
    const t0 = (i - 0.5) / k, t1 = i / k, sgn = i % 2 ? 1 : -1;
    d += ` Q${x1 + dx * t0 + nx * amp * sgn},${y1 + dy * t0 + ny * amp * sgn} ${x1 + dx * t1},${y1 + dy * t1}`;
  }
  return d;
}

/* ---------- Кубик ---------- */

const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
function dieHtml(v, skin, cls = "") {
  const pips = Array.from({ length: 9 }, (_, i) =>
    `<span class="pip">${PIPS[v].includes(i) ? (skin.pipChar ? `<i class="ch">${skin.pipChar}</i>` : "<i></i>") : ""}</span>`).join("");
  const glow = skin.glow ? `0 0 18px ${skin.glow},` : "";
  return `<div class="die ${cls}" style="background:url(img/dice/${skin.id}.png) center/cover, ${skin.bg};border-color:${skin.edge};--pip:${skin.pip};
    box-shadow:${glow} inset 0 -6px 0 ${skin.edge}55, 0 6px 14px rgba(0,0,0,.45)${skin.pipShadow ? ";--pip-shadow:0 0 3px #000" : ""}">${pips}</div>`;
}
function showDie(v, cls) { $("dice").innerHTML = dieHtml(v, diceSkin(), cls); }

/* ---------- Информация и отрисовка ---------- */

function showCell(n) {
  const [name, sk, text] = CELLS[n];
  let extra = "";
  if (ARROWS[n]) extra = ` <i>Стрела → ${ARROWS[n]} «${CELLS[ARROWS[n]][0]}».</i>`;
  if (SNAKES[n]) extra = ` <i>Змея → ${SNAKES[n]} «${CELLS[SNAKES[n]][0]}».</i>`;
  const m = MEANINGS[n];
  $("cellInfo").innerHTML = `<h4>${n}. ${name}</h4><div class="sk">${sk}</div>
    <p>${m && m.hook ? esc(m.hook) : text}${extra}</p>
    <button type="button" class="ghost more">Читать толкование</button>`;
  $("cellInfo").querySelector(".more").onclick = () => openCard(n);
}

/* ---------- Карточка клетки ---------- */

const intentOf = (i) => (state.players[i] && state.players[i].intention) || state.intention || "";

let cardCtx = null;
function cardHtml(n, viaCell, pi) {
  const [name, sk, short] = CELLS[n];
  const m = MEANINGS[n] || {};
  const para = (t) => (t || "").split(/\n+/).filter(Boolean).map((x) => `<p>${esc(x)}</p>`).join("");
  let via = "";
  if (viaCell) {
    const kind = ARROWS[viaCell] ? "Стрела" : "Змея";
    via = `<div class="via">${kind} с клетки ${viaCell} «${CELLS[viaCell][0]}». ${esc((MEANINGS[viaCell] || {}).hook || CELLS[viaCell][2])}</div>`;
  }
  const jump = ARROWS[n] ? `<div class="via up">↑ Стрела ведёт на ${ARROWS[n]} «${CELLS[ARROWS[n]][0]}»</div>`
    : SNAKES[n] ? `<div class="via down">↓ Змея ведёт на ${SNAKES[n]} «${CELLS[SNAKES[n]][0]}»</div>` : "";
  return `<div class="card-head"><span class="card-n">${n}</span><div><h2>${name}</h2><div class="sk">${sk}</div></div></div>
    ${via}${jump}
    ${m.hook ? `<p class="hook">${esc(m.hook)}</p>` : ""}
    ${para(m.text) || `<p>${esc(short)}</p>`}
    ${m.light || m.shadow ? `<div class="ls">${m.light ? `<div><h4>☀ Свет</h4>${para(m.light)}</div>` : ""}${m.shadow ? `<div><h4>☾ Тень</h4>${para(m.shadow)}</div>` : ""}</div>` : ""}
    ${m.scene ? `<h4>Сцена из жизни</h4><p class="scene">${esc(m.scene)}</p>` : ""}
    ${m.veda ? `<blockquote>${esc(m.veda)}</blockquote>` : ""}
    <h4>Вопросы к себе</h4><ul class="qs">
      <li>Прежде чем читать дальше: что слово «${esc(name)}» значит лично для тебя? Что первое приходит на ум?</li>
      ${(m.questions || []).map((q) => `<li>${esc(q)}</li>`).join("")}
      ${intentOf(pi) ? `<li class="bridge">Как эта клетка связана с моим намерением: «${esc(intentOf(pi))}»?</li>` : ""}
    </ul>
    <p class="hint">Не на все вопросы нужно отвечать. Возьми тот, что откликается сильнее всего.</p>
    ${m.practice ? `<h4>Практика</h4>${para(m.practice)}` : ""}`;
}
function openCard(n, logIdx = null, viaCell = null, pi = state.turn) {
  cardCtx = { n, logIdx };
  $("cardBody").innerHTML = cardHtml(n, viaCell, pi);
  const note = logIdx !== null ? (state.notes || {})[logIdx] : null;
  $("cardNote").value = note || "";
  $("cardNote").parentElement.style.display = logIdx !== null ? "" : "none";
  $("autoCard").checked = !!prefs.autoCard;
  $("card").showModal();
  $("card").scrollTop = 0;
}
$("card").addEventListener("close", () => {
  if (cardCtx && cardCtx.logIdx !== null) {
    state.notes = state.notes || {};
    const v = $("cardNote").value.trim();
    if (v) state.notes[cardCtx.logIdx] = v; else delete state.notes[cardCtx.logIdx];
    render();
  }
});
$("autoCard").onchange = () => { prefs.autoCard = $("autoCard").checked; savePrefs(); };

/* ---------- Мой путь ---------- */

const strip = (h) => { const d = document.createElement("div"); d.innerHTML = h; return d.textContent; };
function pathText() {
  let t = "ЛИЛА — мой путь\n" + state.players.map((p, i) => intentOf(i) ? `Намерение (${p.name}): ${intentOf(i)}\n` : "").join("") + "\n";
  state.log.forEach((l, i) => {
    t += (i + 1) + ". " + strip(l) + "\n";
    if (state.notes && state.notes[i]) t += "   ✎ " + state.notes[i] + "\n";
  });
  return t;
}
function openPath() {
  const notes = state.notes || {};
  $("pathBody").innerHTML = state.players.map((p, i) => intentOf(i) ? `<p class="hook">${p.token} ${esc(p.name)}: ${esc(intentOf(i))}</p>` : "").join("") +
    (state.log.length ? `<ol class="path">${state.log.map((l, i) => `<li>${l}${notes[i] ? `<div class="pnote">✎ ${esc(notes[i])}</div>` : ""}</li>`).join("")}</ol>`
      : "<p>Путь ещё не начался. Бросьте кубик.</p>");
  $("pathDlg").showModal();
}
$("btnPath").onclick = openPath;
$("pathCopy").onclick = async () => {
  try { await navigator.clipboard.writeText(pathText()); $("pathCopy").textContent = "Скопировано ✓"; } catch (e) {}
};
$("pathSave").onclick = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([pathText()], { type: "text/plain;charset=utf-8" }));
  a.download = "lila-moy-put.txt";
  a.click();
};

function render() {
  board.querySelectorAll(".token").forEach((t) => t.remove());
  board.querySelectorAll(".cell.here").forEach((c) => c.classList.remove("here"));
  const cur = state.players[state.turn];
  const offs = [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1]];
  state.players.forEach((pl, i) => {
    if (pl.pos < 1) return;
    const q = cellPos(pl.pos);
    const t = document.createElement("div");
    t.className = "token" + (i === state.turn && !state.over ? " active" : "");
    t.style.borderColor = pl.color;
    t.style.left = `calc(${q.x}% + ${offs[i][0] * 1.7}%)`;
    t.style.top = `calc(${q.y}% + ${offs[i][1] * 1.9}%)`;
    t.innerHTML = tokenHtml(pl.token);
    board.appendChild(t);
  });
  if (cur.pos > 0) $("c" + cur.pos).classList.add("here");

  const ci = intentOf(state.turn);
  $("intention").innerHTML = `<span class="intent-who">${cur.token} Намерение ${state.players.length > 1 ? esc(cur.name) : ""}</span>
    ${ci ? esc(ci) : "<i>не задано</i>"} <span class="intent-edit">✎ изменить</span>`;
  $("players").innerHTML = state.players.map((pl, i) => `
    <div class="player ${i === state.turn && !state.over ? "active" : ""}" data-i="${i}" title="Нажмите, чтобы сменить фишку">
      <span class="ptoken" style="border-color:${pl.color}">${tokenHtml(pl.token)}</span>${esc(pl.name)}
      <span class="where">${pl.done ? "🏆 достиг цели" : pl.pos < 1 ? "ждёт шестёрку" : pl.pos + ". " + CELLS[pl.pos][0]}</span>
    </div>`).join("");
  $("players").querySelectorAll(".player").forEach((el) => {
    el.onclick = () => pickToken(state.players[+el.dataset.i].token, (tk) => { state.players[+el.dataset.i].token = tk; render(); },
      state.players.filter((_, j) => j !== +el.dataset.i).map((p) => p.token));
  });
  $("turnName").innerHTML = state.over
    ? `<span class="win">Игра окончена</span>`
    : `Ходит: <b style="color:${cur.color}">${cur.token} ${esc(cur.name)}</b>`;
  $("btnRoll").disabled = state.over || busy;
  const notes = state.notes || {};
  $("log").innerHTML = state.log.map((l, i) => `<li>${l}${notes[i] ? `<div class="pnote">✎ ${esc(notes[i])}</div>` : ""}</li>`).reverse().join("");
  save();
}

/* ---------- Ход ---------- */

let toastTimer = null;
function toast(text, color) {
  let el = $("toast");
  if (!el) { el = document.createElement("div"); el.id = "toast"; document.body.appendChild(el); }
  el.textContent = text;
  el.style.borderColor = color || "var(--accent)";
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
}

// Вопросы на время ожидания шестёрки: вход в игру — тоже практика
const WAIT_HINTS = [
  "Пока ждёшь шестёрку: готов ли ты по-настоящему увидеть ответ на свой вопрос?",
  "Шестёрки нет. Что во мне ещё сопротивляется входу в игру?",
  "Сделай вдох и выдох. Твоё намерение звучит так же, как в начале, или уточнилось?",
  "Душа ждёт своего часа, чтобы родиться. Чего я жду в своей жизни?",
  "Ожидание — тоже урок. Как я обычно переношу паузы в жизни?",
  "Повтори про себя своё намерение. Что ты почувствовал в теле?",
  "Если бы ответ на мой вопрос уже пришёл, каким бы он мог быть?",
  "Чего я боюсь узнать в этой игре?",
];

async function roll() {
  if (busy || state.over) return;
  busy = true;
  render();
  const pl = state.players[state.turn];
  const v = 1 + Math.floor(Math.random() * 6);
  for (let k = 0; k < 7; k++) { showDie(1 + Math.floor(Math.random() * 6), "rolling"); await sleep(60); }
  showDie(v, "landed");
  state.lastRoll = v;
  await sleep(250);

  const who = `<span style="color:${pl.color}">${pl.token} ${esc(pl.name)}</span>`;
  const startPos = pl.pos;
  let msg, viaCell = null, waitHint = null;
  if (pl.pos < 1) {
    if (v === 6) {
      await stepTo(pl, 1);
      await sleep(250);
      for (let n = 2; n <= 6; n++) await stepTo(pl, n);
      msg = `${who}: выпало 6 — Рождение, вход в игру → ${cellName(6)}`;
    } else {
      msg = `${who}: выпало ${v}, для входа нужна 6`;
      waitHint = WAIT_HINTS[Math.floor(Math.random() * WAIT_HINTS.length)];
    }
  } else if (pl.pos + v > 72) {
    msg = `${who}: выпало ${v}, ход невозможен — остаётся на ${cellName(pl.pos)}`;
  } else {
    const target = pl.pos + v;
    for (let n = pl.pos + 1; n <= target; n++) await stepTo(pl, n);
    msg = `${who}: выпало ${v} → ${cellName(target)}`;
    const jump = ARROWS[target] || SNAKES[target];
    if (jump) {
      viaCell = target;
      await sleep(350);
      await stepTo(pl, jump);
      msg += ARROWS[target] ? ` ↑ стрела → ${cellName(jump)}` : ` ↓ змея → ${cellName(jump)}`;
    }
  }
  const logIdx = state.log.push(msg) - 1;
  const moved = pl.pos !== startPos;
  if (pl.pos > 0) showCell(pl.pos);

  let status = "";
  if (pl.pos === GOAL) {
    pl.done = true;
    state.log.push(`🏆 ${who} достиг Космического сознания!`);
    status = `${pl.name} достиг цели!`;
    if (state.players.every((p) => p.done)) state.over = true;
  }
  if (!state.over) {
    if (v === 6 && !pl.done) status = status || "Выпала 6 — бросайте ещё раз";
    else {
      if (waitHint) status = waitHint;
      const before = state.turn;
      nextTurn();
      if (state.turn !== before) toast(`Ход переходит: ${state.players[state.turn].token} ${state.players[state.turn].name}`, state.players[state.turn].color);
    }
  }
  busy = false;
  $("status").textContent = status;
  render();
  if (pl.pos > 0 && moved && prefs.autoCard) openCard(pl.pos, logIdx, viaCell, state.players.indexOf(pl));
}

function nextTurn() {
  const n = state.players.length;
  for (let k = 1; k <= n; k++) {
    const i = (state.turn + k) % n;
    if (!state.players[i].done) { state.turn = i; return; }
  }
}

async function stepTo(pl, n) {
  pl.pos = n;
  render();
  await sleep(180);
}

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
}
function savePrefs() {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (e) {}
}
function load() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; }
}

/* ---------- Выбор фишки ---------- */

let tokenCallback = null;
function pickToken(current, cb, taken = []) {
  tokenCallback = cb;
  $("tokenGrid").innerHTML = TOKEN_GROUPS.map(([name, list]) => `
    <h4>${name}</h4><div class="tokens">${list.map((tk) =>
      `<button type="button" class="tk${tk === current ? " sel" : ""}" ${taken.includes(tk) ? "disabled" : ""} data-tk="${tk}">${tokenHtml(tk)}</button>`).join("")}</div>`).join("");
  $("tokenGrid").querySelectorAll(".tk").forEach((b) => (b.onclick = () => {
    $("tokens").close();
    tokenCallback && tokenCallback(b.dataset.tk);
  }));
  $("tokens").showModal();
}

/* ---------- Оформление ---------- */

function themeThumb(t) {
  let cells = "";
  for (let r = 0; r < 8; r++) for (let c = 0; c < 9; c++) {
    const n = cellAt(r, c);
    cells += `<rect x="${c * 100 + 3}" y="${(7 - r) * 100 + 3}" width="94" height="94" rx="${t.radius ? 30 : 0}"
      fill="${cellColor(t, n, r, c)}" fill-opacity="${t.alpha ?? 1}" stroke="${t.cellBorder || "#0003"}" stroke-width="3"/>`;
  }
  return `<div class="thumb"><svg viewBox="0 0 900 800" preserveAspectRatio="none" style="background:${t.boardBg || "transparent"}">${artSvg(t)}</svg>${boardImg(t)}
    <svg viewBox="0 0 900 800" preserveAspectRatio="none">${cells}</svg></div>`;
}

// Карусель: один вариант на весь экран, листается свайпом или стрелками
function carousel(el, items, current, render, onPick) {
  el.innerHTML = `<div class="car">
      <button type="button" class="car-btn prev" aria-label="Назад">‹</button>
      <div class="car-track">${items.map((it) => `<div class="car-item">${render(it)}</div>`).join("")}</div>
      <button type="button" class="car-btn next" aria-label="Вперёд">›</button>
    </div>
    <div class="car-info"><b class="car-name"></b><span class="car-count"></span></div>`;
  const track = el.querySelector(".car-track");
  let idx = current;
  const show = () => {
    el.querySelector(".car-name").textContent = items[idx].name;
    el.querySelector(".car-count").textContent = `${idx + 1} из ${items.length}`;
  };
  const go = (i, smooth = true) => {
    idx = (i + items.length) % items.length;
    track.scrollTo({ left: idx * track.clientWidth, behavior: smooth ? "smooth" : "auto" });
    show(); onPick(items[idx]);
  };
  el.querySelector(".prev").onclick = () => go(idx - 1);
  el.querySelector(".next").onclick = () => go(idx + 1);
  let t = null;
  track.onscroll = () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const i = Math.round(track.scrollLeft / track.clientWidth);
      if (i !== idx && i >= 0 && i < items.length) { idx = i; show(); onPick(items[idx]); }
    }, 120);
  };
  show();
  requestAnimationFrame(() => (track.scrollLeft = idx * track.clientWidth));
  return { refresh: () => (track.scrollLeft = idx * track.clientWidth) };
}

let cars = {};
let tokenFor = 0;
var TOKEN_ITEMS = TOKEN_GROUPS.flatMap(([g, list]) => list.map((tk) => ({ tk, name: g })));
function drawTokenCar() {
  $("tokenWho").innerHTML = state.players.length > 1 ? state.players.map((p, i) =>
    `<button type="button" class="who-btn${i === tokenFor ? " sel" : ""}" data-i="${i}" style="border-color:${p.color}">${tokenHtml(p.token)} ${esc(p.name)}</button>`).join("") : "";
  $("tokenWho").querySelectorAll(".who-btn").forEach((b) => (b.onclick = () => { tokenFor = +b.dataset.i; drawTokenCar(); }));
  const cur = Math.max(0, TOKENS.indexOf(state.players[tokenFor].token));
  cars.tokenCar = carousel($("tokenCar"), TOKEN_ITEMS, cur,
    (it) => `<div class="big-token" style="border-color:${state.players[tokenFor].color}">${tokenHtml(it.tk)}</div>`,
    (it) => {
      const me = state.players[tokenFor];
      if (me.token === it.tk) return;
      const other = state.players.find((p) => p !== me && p.token === it.tk);
      if (other) other.token = me.token; // занятую фишку меняем местами
      me.token = it.tk;
      render();
      $("tokenWho").querySelectorAll(".who-btn").forEach((b, i) => (b.innerHTML = `${tokenHtml(state.players[i].token)} ${esc(state.players[i].name)}`));
    });
}
function openLook() {
  $("look").showModal();
  tokenFor = state.turn || 0;
  drawTokenCar();
  cars.themeCar = carousel($("themeCar"), THEMES, Math.max(0, THEMES.findIndex((t) => t.id === prefs.theme)),
    (t) => `<div class="big-thumb">${themeThumb(t)}</div>`,
    (t) => { if (prefs.theme !== t.id) { prefs.theme = t.id; savePrefs(); buildBoard(); render(); } });
  cars.diceCar = carousel($("diceCar"), DICE_SKINS, Math.max(0, DICE_SKINS.findIndex((d) => d.id === prefs.dice)),
    (d) => `<div class="big-die">${dieHtml(5, d)}</div>`,
    (d) => { if (prefs.dice !== d.id) { prefs.dice = d.id; savePrefs(); showDie(state.lastRoll || 6); } });
}
document.querySelectorAll("#look .tab").forEach((b) => (b.onclick = () => {
  document.querySelectorAll("#look .tab").forEach((x) => x.classList.toggle("sel", x === b));
  ["themeCar", "diceCar"].forEach((id) => ($(id).hidden = id !== b.dataset.tab));
  $("tokenPane").hidden = b.dataset.tab !== "tokenCar";
  cars[b.dataset.tab] && cars[b.dataset.tab].refresh();
}));

/* ---------- Новая игра ---------- */

let setupPlayers = [];
let wizStep = 0;
function freeToken() {
  const used = setupPlayers.map((p) => p.token);
  return TOKENS.find((t) => !used.includes(t));
}
const INTENT_TIPS = `<details class="tips"><summary>Как сформулировать намерение</summary>
  <p>Хорошее намерение конкретное, про тебя и про сейчас. Начни со слов «что», «как», «почему я».</p>
  <ul>
    <li>Слишком общо: «Хочу понять себя». Лучше: «Что мешает мне доверять близким?»</li>
    <li>Про других: «Как изменить мужа?» Лучше: «Что во мне откликается на его поведение?»</li>
    <li>Да/нет: «Уходить ли с работы?» Лучше: «Что мне важно в работе, которую я ищу?»</li>
  </ul>
  <p>Намерение можно поправить во время игры.</p></details>`;

// Пошаговая настройка: число игроков → каждый игрок (имя, фишка, намерение) → поле → старт
function drawWiz() {
  const total = setupPlayers.length + 2;
  const w = $("wiz");
  const steps = `<div class="wiz-steps">${Array.from({ length: total }, (_, i) => `<span class="${i === wizStep ? "on" : i < wizStep ? "done" : ""}"></span>`).join("")}</div>`;
  const nav = (next, label = "Далее →") => `<div class="wiz-nav">
    ${wizStep > 0 ? `<button type="button" class="ghost" id="wizBack">← Назад</button>` : ""}
    <button type="button" class="roll" id="wizNext">${label}</button></div>`;

  if (wizStep === 0) {
    w.innerHTML = `${steps}<h2>Новая игра</h2><p class="wiz-q">Сколько человек будет играть?</p>
      <div class="count-grid">${[1, 2, 3, 4, 5, 6].map((n) => `<button type="button" class="count${n === setupPlayers.length ? " sel" : ""}" data-n="${n}">${n}</button>`).join("")}</div>
      <p class="hint">Все играют по очереди на одном устройстве. Ход переходит сам.</p>${nav()}`;
    w.querySelectorAll(".count").forEach((b) => (b.onclick = () => {
      const n = +b.dataset.n;
      while (setupPlayers.length < n) setupPlayers.push({ name: "Игрок " + (setupPlayers.length + 1), token: freeToken(), intention: "" });
      setupPlayers.length = n;
      wizStep = 1; drawWiz();
    }));
  } else if (wizStep <= setupPlayers.length) {
    const i = wizStep - 1, p = setupPlayers[i];
    w.innerHTML = `${steps}<h2 style="color:${COLORS[i]}">Игрок ${i + 1}${setupPlayers.length > 1 ? ` из ${setupPlayers.length}` : ""}</h2>
      <label>Имя<input id="wizName" value="${esc(p.name)}" maxlength="20"></label>
      <p class="wiz-q">Выбери фишку</p><div id="wizToken" class="car-wrap"></div>
      <label class="wiz-q">Намерение: вопрос, с которым ${setupPlayers.length > 1 ? "этот игрок входит" : "ты входишь"} в игру
        <textarea id="wizIntent" rows="2" placeholder="Например: почему я третий год не решаюсь сменить работу?">${esc(p.intention || "")}</textarea></label>
      ${INTENT_TIPS}${nav()}`;
    $("wizName").oninput = () => (p.name = $("wizName").value);
    $("wizIntent").oninput = () => (p.intention = $("wizIntent").value);
    carousel($("wizToken"), TOKEN_ITEMS, Math.max(0, TOKENS.indexOf(p.token)),
      (it) => `<div class="big-token mid" style="border-color:${COLORS[i]}">${tokenHtml(it.tk)}</div>`,
      (it) => {
        const other = setupPlayers.find((q) => q !== p && q.token === it.tk);
        if (other) other.token = p.token;
        p.token = it.tk;
      });
  } else {
    w.innerHTML = `${steps}<h2>Выбери поле</h2><p class="hint">Листай влево и вправо. Поле и кубик можно сменить позже в «Оформлении».</p>
      <div id="wizBoard" class="car-wrap"></div>${nav(null, "Начать игру ✦")}`;
    carousel($("wizBoard"), THEMES, Math.max(0, THEMES.findIndex((t) => t.id === prefs.theme)),
      (t) => `<div class="big-thumb">${themeThumb(t)}</div>`,
      (t) => { if (prefs.theme !== t.id) { prefs.theme = t.id; savePrefs(); buildBoard(); render(); } });
  }
  const back = $("wizBack"), next = $("wizNext");
  if (back) back.onclick = () => { wizStep--; drawWiz(); };
  if (next) next.onclick = () => {
    if (wizStep === 0 && !setupPlayers.length) return;
    if (wizStep <= setupPlayers.length) { wizStep++; drawWiz(); $("setup").scrollTop = 0; return; }
    startGame();
  };
}
function startGame() {
  state = {
    players: setupPlayers.map((p, i) => ({ name: p.name.trim() || "Игрок " + (i + 1), token: p.token, intention: (p.intention || "").trim(), color: COLORS[i], pos: 0, done: false })),
    turn: 0, over: false, log: [], notes: {},
  };
  $("setup").close();
  $("status").textContent = "Чтобы войти в игру, выбросьте 6";
  showDie(6);
  $("cellInfo").innerHTML = "";
  render();
  toast(`Первый ход: ${state.players[0].token} ${state.players[0].name}`, state.players[0].color);
}
function openSetup() {
  setupPlayers = state.players.map((p, i) => ({ name: p.name, token: p.token, intention: intentOf(i) }));
  wizStep = 0;
  $("setup").showModal();
  drawWiz();
}

$("setupForm").onsubmit = (e) => e.preventDefault();

// Изменение намерения во время игры
$("intention").onclick = () => {
  const p = state.players[state.turn];
  $("intentWho").textContent = `${p.token} ${p.name}`;
  $("intentText").value = intentOf(state.turn);
  $("intentDlg").showModal();
};
$("intentSave").onclick = () => {
  const p = state.players[state.turn], v = $("intentText").value.trim(), old = intentOf(state.turn);
  if (v !== old) {
    p.intention = v;
    state.log.push(`<span style="color:${p.color}">${p.token} ${esc(p.name)}</span>: ✎ намерение уточнено: «${esc(v)}»`);
  }
  $("intentDlg").close();
  render();
};

// Большой крестик закрытия во всех окнах
document.querySelectorAll("dialog").forEach((d) => {
  const x = document.createElement("button");
  x.type = "button"; x.className = "x-close"; x.setAttribute("aria-label", "Закрыть"); x.textContent = "✕";
  x.onclick = () => d.close();
  d.prepend(x);
});

$("btnRoll").onclick = roll;
$("btnNew").onclick = openSetup;
$("btnLook").onclick = openLook;
$("btnRules").onclick = () => $("rules").showModal();
document.addEventListener("keydown", (e) => {
  if ((e.code === "Space" || e.code === "Enter") && !document.querySelector("dialog[open]")) { e.preventDefault(); roll(); }
});

buildBoard();
state = load();
if (state && state.players) {
  state.players.forEach((p, i) => (p.token = p.token || TOKENS[i]));
  render();
  showDie(state.lastRoll || 6);
} else {
  state = { players: [{ name: "Игрок 1", token: "🐘", intention: "", color: COLORS[0], pos: 0, done: false }], turn: 0, over: false, log: [] };
  render();
  showDie(6);
  openSetup();
}
