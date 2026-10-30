// Магазин Лилы: закрытые поля и кубики, глубокие толкования, покупки в Telegram (звёзды), MAX и на сайте (ЮKassa).
// Подключается после game.js и оборачивает его функции, не меняя саму игру.

(function () {
  const S = window.LILA_SHOP;
  const tg = S.platform === "tg" && window.Telegram && Telegram.WebApp;
  const mx = S.platform === "max" && window.WebApp;
  const demo = !S.api;
  let owned = [], prices = {}, code = "";
  try { owned = JSON.parse(localStorage.getItem("lila-owned")) || []; } catch (e) {}

  const has = (p) => owned.includes(p) || owned.includes("all");
  const lockedTheme = (t) => !S.freeThemes.includes(t.id) && !has("boards");
  const lockedDie = (d) => !S.freeDice.includes(d.id) && !has("dice");
  const lockOf = (it) => THEMES.includes(it) ? (lockedTheme(it) && "boards") : DICE_SKINS.includes(it) ? (lockedDie(it) && "dice") : false;
  const keep = () => { try { localStorage.setItem("lila-owned", JSON.stringify(owned)); } catch (e) {} };

  /* ---------- Платформа ---------- */

  if (tg) {
    tg.ready(); tg.expand();
    try { tg.disableVerticalSwipes(); } catch (e) {} // чтобы листание поля не закрывало приложение
    try { tg.setHeaderColor("#1c1424"); tg.setBackgroundColor("#1c1424"); } catch (e) {}
  }
  if (mx) { try { mx.ready(); } catch (e) {} }
  if (S.platform !== "web") document.querySelectorAll(".home-tip").forEach((el) => el.remove());

  let deviceId = localStorage.getItem("lila-device");
  if (!deviceId) { deviceId = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join(""); localStorage.setItem("lila-device", deviceId); }
  const auth = () => ({ platform: S.platform, initData: tg ? tg.initData : mx ? mx.initData : undefined, deviceId });

  async function api(path, body = {}) {
    const r = await fetch(S.api + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...auth(), ...body }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Сервер недоступен");
    return j;
  }
  async function refresh() {
    if (demo) return;
    try {
      const j = await api("/api/session");
      const before = owned.join();
      owned = j.owned || []; prices = j.prices || {}; code = j.code || "";
      keep();
      if (owned.join() !== before && $("shopDlg").open) drawShop();
      return j;
    } catch (e) { console.warn(e); }
  }
  const openUrl = (url) => (tg ? tg.openLink(url) : mx && mx.openLink ? mx.openLink(url) : (location.href = url));

  /* ---------- Замки на полях и кубиках ---------- */

  const lockBadge = (p) => `<div class="lock-badge">🔒 ${S.products.find((x) => x.id === p).title} · открыть</div>`;
  const origCarousel = carousel;
  window.carousel = function (el, items, current, render, onPick, onTap) {
    if (items !== THEMES && items !== DICE_SKINS) return origCarousel.apply(this, arguments);
    const r = (it) => { const p = lockOf(it); return `<div class="lockable${p ? " locked" : ""}">${render(it)}${p ? lockBadge(p) : ""}</div>`; };
    const pick = (it) => { if (!lockOf(it)) onPick(it); };
    const tap = (it) => { const p = lockOf(it); if (p) openShop(p); else if (onTap) onTap(it); };
    return origCarousel.call(this, el, items, current, r, pick, tap);
  };

  /* ---------- Глубокие толкования ---------- */

  const DEEP = ["light", "shadow", "scene", "veda", "practice"];
  const origCardHtml = cardHtml;
  window.cardHtml = function (n, viaCell, pi) {
    if (has("deep") || !MEANINGS[n]) return origCardHtml(n, viaCell, pi);
    const full = MEANINGS[n], short = { ...full };
    DEEP.forEach((k) => delete short[k]);
    MEANINGS[n] = short;
    try {
      const parts = DEEP.filter((k) => full[k]).length;
      return origCardHtml(n, viaCell, pi) + (parts ? `<div class="deep-teaser">
        <h4>📖 Глубокое толкование</h4>
        <p>Свет и тень этой клетки, сцена из жизни, ведическая цитата и практика на сегодня.</p>
        <button type="button" class="roll" data-shop="deep">Открыть глубокие толкования</button></div>` : "");
    } finally { MEANINGS[n] = full; }
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-shop]");
    if (b && !b.closest("#shopDlg")) { e.preventDefault(); openShop(b.dataset.shop); }
  });

  /* ---------- Окно магазина ---------- */

  const dlg = document.createElement("dialog");
  dlg.id = "shopDlg"; dlg.className = "wide full";
  dlg.innerHTML = `<button type="button" class="x-close" aria-label="Закрыть">✕</button><form method="dialog"><div id="shopBody"></div></form>`;
  dlg.querySelector(".x-close").onclick = () => dlg.close();
  document.body.appendChild(dlg);

  const priceText = (id) => {
    const p = prices[id];
    if (!p) return "";
    if (S.platform === "tg") return `${p.stars} ⭐`;
    return `${p.rub} ₽`;
  };
  let focus = null;
  function drawShop() {
    const items = S.products.map((p) => {
      const mineNow = p.id !== "donate" && has(p.id);
      return `<div class="shop-item${p.id === focus ? " focus" : ""}${mineNow ? " owned" : ""}">
        <div class="si-icon">${p.icon}</div>
        <div class="si-text"><b>${p.title}</b><p>${p.text}</p></div>
        ${mineNow ? `<span class="si-owned">✓ Открыто</span>`
          : `<button type="button" class="roll si-buy" data-buy="${p.id}">${demo ? "Открыть (демо)" : priceText(p.id) || "Купить"}</button>`}
      </div>`;
    }).join("");
    $("shopBody").innerHTML = `<h2>✨ Лила+</h2>
      ${demo ? `<p class="hint">Демо-режим: оплата ещё не подключена, всё открывается бесплатно и только на этом устройстве.</p>` : ""}
      <div class="shop-list">${items}</div>
      ${S.platform === "tg" ? `<p class="hint">Оплата звёздами Telegram.</p>` : !demo ? `<p class="hint">Оплата картой или СБП через ЮKassa. После оплаты вернитесь в игру: покупка появится сама.</p>` : ""}
      ${demo ? "" : `<details class="shop-code"><summary>Покупки на другом устройстве или в другом мессенджере</summary>
        <p>Ваш код: <b class="code">${code || "…"}</b></p>
        <p class="hint">Введите этот код в Лиле в Telegram, MAX или на сайте, и покупки появятся там тоже.</p>
        <div class="row"><input id="shopCode" placeholder="Код с другого устройства" autocomplete="off"><button type="button" class="ghost" id="shopLink">Перенести</button></div>
      </details>`}`;
    $("shopBody").querySelectorAll("[data-buy]").forEach((b) => (b.onclick = () => buy(b.dataset.buy, b)));
    const link = $("shopLink");
    if (link) link.onclick = async () => {
      const c = $("shopCode").value.trim();
      if (!c) return;
      try { const j = await api("/api/link", { code: c }); owned = j.owned; code = j.code; keep(); drawShop(); toast("Покупки перенесены"); }
      catch (e) { toast(e.message); }
    };
  }
  function openShop(p) {
    focus = p || null;
    if ($("look").open) $("look").close();
    drawShop();
    if (!dlg.open) dlg.showModal();
    dlg.scrollTop = 0;
    refresh();
  }
  window.openShop = openShop;

  function unlocked(p) {
    const t = S.products.find((x) => x.id === p);
    toast(p === "donate" ? "Спасибо! 🙏" : `Открыто: ${t.title}`);
    if (p !== "donate") { buildBoard(); render(); }
    drawShop();
  }
  async function buy(p, btn) {
    if (demo) {
      if (p !== "donate" && !owned.includes(p)) owned.push(p);
      keep(); unlocked(p); return;
    }
    btn.disabled = true;
    try {
      const j = await api("/api/buy", { product: p });
      if (j.invoiceUrl && tg) {
        tg.openInvoice(j.invoiceUrl, async (status) => {
          if (status !== "paid") return;
          // Сервер узнаёт об оплате от Telegram за секунду-две
          for (let i = 0; i < 5 && (p === "donate" || !has(p)); i++) { await sleep(1200); await refresh(); }
          unlocked(p);
        });
      } else if (j.payUrl) openUrl(j.payUrl);
    } catch (e) { toast(e.message); }
    btn.disabled = false;
  }

  /* ---------- Кнопка и стили ---------- */

  const btn = document.createElement("button");
  btn.className = "ghost"; btn.id = "btnShop"; btn.textContent = "✨"; btn.setAttribute("aria-label", "Лила+");
  btn.onclick = () => openShop();
  $("btnNew").before(btn);

  const css = document.createElement("style");
  css.textContent = `
  .lockable { position: relative; width: 100%; display: grid; place-items: center; }
  .lockable.locked > :first-child { filter: saturate(.55) brightness(.75); }
  .lock-badge { position: absolute; left: 50%; bottom: 8%; transform: translateX(-50%); background: rgba(20,10,30,.88); color: var(--accent);
    border: 1px solid var(--accent); border-radius: 999px; padding: 8px 14px; font-size: 15px; white-space: nowrap; max-width: 92%; overflow: hidden; text-overflow: ellipsis; }
  .deep-teaser { margin-top: 18px; padding: 14px 16px; border: 1px dashed var(--accent); border-radius: 14px; background: rgba(242,184,75,.06); }
  .deep-teaser h4 { margin-top: 0; }
  .shop-list { display: grid; gap: 10px; }
  .shop-item { display: flex; flex-wrap: wrap; gap: 10px 12px; align-items: center; padding: 12px; border: 1px solid rgba(255,255,255,.14); border-radius: 14px; }
  .shop-item.focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(242,184,75,.25); }
  .shop-item.owned { opacity: .75; }
  .si-icon { font-size: 30px; flex: 0 0 auto; }
  .si-text { flex: 1 1 200px; min-width: 0; } .si-text p { margin: 4px 0 0; color: var(--muted); font-size: 14px; line-height: 1.35; }
  button.roll.si-buy { width: auto; flex: 0 0 auto; margin-left: auto; white-space: nowrap; padding: 10px 18px; font-size: 16px; }
  .si-owned { color: #5ccf7a; white-space: nowrap; margin-left: auto; }
  .shop-code { margin-top: 18px; } .shop-code summary { cursor: pointer; color: var(--accent); }
  .shop-code .code { letter-spacing: 2px; font-size: 18px; user-select: all; }
  .shop-code input { flex: 1; text-transform: uppercase; }
  `;
  document.head.appendChild(css);

  if (new URLSearchParams(location.search).has("paid")) refresh().then(() => openShop());
  else refresh();
  // После оплаты в браузере человек возвращается в мессенджер: проверяем покупки ещё раз
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
})();
