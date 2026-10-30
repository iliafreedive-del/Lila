const COLORS = ["#e0566b", "#4ba3f2", "#5ccf7a", "#f2b84b", "#b07af2", "#f27ac8"];
const ROW_BG = ["#f4a6a0", "#f7c49a", "#f6e3a1", "#c5e6a6", "#a9e0d6", "#a9c8ee", "#bcb2ec", "#dcb6ee"];
const DICE = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const SAVE_KEY = "lila-save-v1";

const $ = (id) => document.getElementById(id);
const board = $("board");

let state = null;
let busy = false;

// Координаты клетки (центр) в процентах: 1 — левый нижний угол, ряды «змейкой»
function cellPos(n) {
  const row = Math.floor((n - 1) / 9);
  const i = (n - 1) % 9;
  const col = row % 2 === 0 ? i : 8 - i;
  return { x: (col + 0.5) / 9 * 100, y: (7 - row + 0.5) / 8 * 100, row, col };
}

function buildBoard() {
  board.innerHTML = "";
  for (let r = 7; r >= 0; r--) {
    for (let c = 0; c < 9; c++) {
      const n = r * 9 + (r % 2 === 0 ? c : 8 - c) + 1;
      const el = document.createElement("div");
      el.className = "cell" + (n === GOAL ? " goal" : "");
      el.id = "c" + n;
      el.style.background = ROW_BG[r];
      el.innerHTML = `<span class="n">${n}</span><span class="t">${CELLS[n][0]}</span>`;
      el.onclick = () => showCell(n);
      board.appendChild(el);
    }
  }
  board.insertAdjacentHTML("beforeend", overlaySvg());
}

function overlaySvg() {
  // viewBox 900x800: клетка 100x100
  const p = (n) => { const q = cellPos(n); return [q.x * 9, q.y * 8]; };
  let s = `<svg class="overlay" viewBox="0 0 900 800" preserveAspectRatio="none">
    <defs><marker id="ah" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#b8860b"/></marker></defs>`;
  for (const [from, to] of Object.entries(ARROWS)) {
    const [x1, y1] = p(+from), [x2, y2] = p(to);
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fff6" stroke-width="10" stroke-linecap="round"/>
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#b8860b" stroke-width="5" stroke-linecap="round" marker-end="url(#ah)"/>`;
  }
  for (const [from, to] of Object.entries(SNAKES)) {
    const [x1, y1] = p(+from), [x2, y2] = p(to);
    s += `<path d="${wave(x1, y1, x2, y2)}" fill="none" stroke="#0005" stroke-width="11" stroke-linecap="round"/>
      <path d="${wave(x1, y1, x2, y2)}" fill="none" stroke="#2e8b57" stroke-width="7" stroke-linecap="round"/>
      <circle cx="${x1}" cy="${y1}" r="11" fill="#2e8b57" stroke="#0006" stroke-width="2"/>
      <circle cx="${x1 - 4}" cy="${y1 - 3}" r="2.2" fill="#fff"/><circle cx="${x1 + 4}" cy="${y1 - 3}" r="2.2" fill="#fff"/>`;
  }
  return s + "</svg>";
}

function wave(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len, k = Math.max(3, Math.round(len / 90)), amp = 16;
  let d = `M${x1},${y1}`;
  for (let i = 1; i <= k; i++) {
    const t0 = (i - 0.5) / k, t1 = i / k, sgn = i % 2 ? 1 : -1;
    d += ` Q${x1 + dx * t0 + nx * amp * sgn},${y1 + dy * t0 + ny * amp * sgn} ${x1 + dx * t1},${y1 + dy * t1}`;
  }
  return d;
}

function showCell(n) {
  const [name, sk, text] = CELLS[n];
  let extra = "";
  if (ARROWS[n]) extra = ` <i>Стрела → ${ARROWS[n]} «${CELLS[ARROWS[n]][0]}».</i>`;
  if (SNAKES[n]) extra = ` <i>Змея → ${SNAKES[n]} «${CELLS[SNAKES[n]][0]}».</i>`;
  $("cellInfo").innerHTML = `<h4>${n}. ${name}</h4><div class="sk">${sk}</div><p>${text}${extra}</p>`;
}

function render() {
  board.querySelectorAll(".token").forEach((t) => t.remove());
  board.querySelectorAll(".cell.here").forEach((c) => c.classList.remove("here"));
  const cur = state.players[state.turn];
  state.players.forEach((pl, i) => {
    if (pl.pos < 1) return;
    const q = cellPos(pl.pos);
    const t = document.createElement("div");
    t.className = "token";
    t.style.background = pl.color;
    const off = [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1]][i];
    t.style.left = `calc(${q.x}% + ${off[0] * 1.6}%)`;
    t.style.top = `calc(${q.y}% + ${off[1] * 1.6}%)`;
    board.appendChild(t);
  });
  if (cur.pos > 0) $("c" + cur.pos).classList.add("here");

  $("intention").textContent = state.intention ? "Намерение: " + state.intention : "";
  $("players").innerHTML = state.players.map((pl, i) => `
    <div class="player ${i === state.turn && !state.over ? "active" : ""}">
      <span class="dot" style="background:${pl.color}"></span>${esc(pl.name)}
      <span class="where">${pl.done ? "🏆 достиг цели" : pl.pos < 1 ? "ждёт шестёрку" : pl.pos + ". " + CELLS[pl.pos][0]}</span>
    </div>`).join("");
  $("turnName").innerHTML = state.over
    ? `<span class="win">Игра окончена</span>`
    : `Ходит: <b style="color:${cur.color}">${esc(cur.name)}</b>`;
  $("btnRoll").disabled = state.over || busy;
  $("log").innerHTML = state.log.slice().reverse().map((l) => `<li>${l}</li>`).join("");
  save();
}

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cellName = (n) => `<b>${n}. ${CELLS[n][0]}</b>`;

async function roll() {
  if (busy || state.over) return;
  busy = true;
  const pl = state.players[state.turn];
  const v = 1 + Math.floor(Math.random() * 6);
  const dice = $("dice");
  dice.classList.remove("spin"); void dice.offsetWidth; dice.classList.add("spin");
  dice.textContent = DICE[v];
  render();
  await sleep(450);

  const who = `<span style="color:${pl.color}">${esc(pl.name)}</span>`;
  let msg;
  if (pl.pos < 1) {
    if (v === 6) {
      await stepTo(pl, 1);
      await sleep(250);
      for (let n = 2; n <= 6; n++) await stepTo(pl, n);
      msg = `${who}: выпало 6 — Рождение, вход в игру → ${cellName(6)}`;
    } else {
      msg = `${who}: выпало ${v}, для входа нужна 6`;
    }
  } else if (pl.pos + v > 72) {
    msg = `${who}: выпало ${v}, ход невозможен — остаётся на ${cellName(pl.pos)}`;
  } else {
    const target = pl.pos + v;
    for (let n = pl.pos + 1; n <= target; n++) await stepTo(pl, n);
    msg = `${who}: выпало ${v} → ${cellName(target)}`;
    const jump = ARROWS[target] || SNAKES[target];
    if (jump) {
      await sleep(350);
      await stepTo(pl, jump);
      msg += ARROWS[target] ? ` ↑ стрела → ${cellName(jump)}` : ` ↓ змея → ${cellName(jump)}`;
    }
  }
  state.log.push(msg);
  if (pl.pos > 0) showCell(pl.pos);

  let status = "";
  if (pl.pos === GOAL) {
    pl.done = true;
    state.log.push(`🏆 ${who} достиг Космического сознания!`);
    status = `${esc(pl.name)} достиг цели!`;
    if (state.players.every((p) => p.done)) state.over = true;
  }
  if (!state.over) {
    if (v === 6 && !pl.done) {
      status = status || "Выпала 6 — бросайте ещё раз";
    } else {
      nextTurn();
    }
  }
  busy = false;
  $("status").textContent = status;
  render();
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
function load() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; }
}

// Настройка новой игры
let names = ["Игрок 1"];
function drawNameFields() {
  $("nameFields").innerHTML = names.map((nm, i) => `
    <label><span style="color:${COLORS[i]}">●</span> Имя игрока ${i + 1}
      <input data-i="${i}" value="${esc(nm)}" maxlength="20">
    </label>`).join("");
  $("nameFields").querySelectorAll("input").forEach((inp) => {
    inp.oninput = () => { names[+inp.dataset.i] = inp.value; };
  });
}
$("addPlayer").onclick = () => { if (names.length < 6) { names.push("Игрок " + (names.length + 1)); drawNameFields(); } };
$("delPlayer").onclick = () => { if (names.length > 1) { names.pop(); drawNameFields(); } };
$("setupForm").onsubmit = () => {
  state = {
    intention: $("inIntention").value.trim(),
    players: names.map((nm, i) => ({ name: nm.trim() || "Игрок " + (i + 1), color: COLORS[i], pos: 0, done: false })),
    turn: 0, over: false, log: [],
  };
  $("status").textContent = "Чтобы войти в игру, выбросьте 6";
  $("dice").textContent = "🎲";
  $("cellInfo").innerHTML = "";
  render();
};
function openSetup() {
  if (state) names = state.players.map((p) => p.name);
  drawNameFields();
  $("setup").showModal();
}

$("btnRoll").onclick = roll;
$("btnNew").onclick = openSetup;
$("btnRules").onclick = () => $("rules").showModal();
document.addEventListener("keydown", (e) => {
  if ((e.code === "Space" || e.code === "Enter") && !document.querySelector("dialog[open]")) { e.preventDefault(); roll(); }
});

buildBoard();
state = load();
if (state && state.players) {
  render();
} else {
  state = { intention: "", players: [{ name: "Игрок 1", color: COLORS[0], pos: 0, done: false }], turn: 0, over: false, log: [] };
  render();
  openSetup();
}
