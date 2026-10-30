// Лила как мини-приложение (Telegram, MAX) и платная версия сайта.
// Сама игра не копируется: загрузчик берёт страницу и скрипты из ../lila/,
// поэтому все улучшения основной игры сразу появляются и здесь.
// Поверх игры подключается магазин (shop.js).

(function () {
  const here = location.href;
  const q = new URLSearchParams(location.search);
  const platform = q.get("p") === "max" ? "max"
    : q.get("p") === "tg" || /tgWebAppData/.test(location.hash) ? "tg" : "web";
  const SDK = {
    tg: "https://telegram.org/js/telegram-web-app.js",
    max: "https://st.max.ru/js/max-web-app.js",
  };

  // Что входит в каждый набор. Цены приходят с сервера покупок.
  window.LILA_SHOP = {
    platform,
    api: (window.LILA_API || "").replace(/\/$/, ""),
    freeThemes: ["full1", "chakra", "cosmos", "shiva", "krishna"],
    freeDice: ["classic", "ivory", "ruby", "wood"],
    products: [
      { id: "all", icon: "🪷", title: "Вся Лила навсегда", text: "Все поля, все кубики и глубокие толкования. Всё, что появится потом, тоже." },
      { id: "deep", icon: "📖", title: "Глубокие толкования", text: "В каждой карточке: свет и тень клетки, сцена из жизни, ведическая цитата и практика." },
      { id: "boards", icon: "🎨", title: "Все поля", text: "Картины «Космическая Лила», «Шива на Кайласе», «Лакшми» и ещё полтора десятка полей." },
      { id: "dice", icon: "🎲", title: "Все кубики", text: "Золото, оникс, лава, лёд, космос и другие кубики." },
      { id: "donate", icon: "🙏", title: "Поддержать автора", text: "Добровольная благодарность. Можно повторять сколько угодно." },
    ],
  };

  // Свои ключи хранилища: настройки и покупки приложения не смешиваются с бесплатной версией сайта
  const P = "app:", st = Storage.prototype, get = st.getItem, set = st.setItem, del = st.removeItem;
  const mine = (s) => s === window.localStorage;
  try {
    if (!get.call(localStorage, P + "migrated")) {
      ["lila-save-v1", "lila-games-v1"].forEach((k) => { const v = get.call(localStorage, k); if (v) set.call(localStorage, P + k, v); });
      set.call(localStorage, P + "migrated", "1");
    }
  } catch (e) {}
  st.getItem = function (k) { return get.call(this, mine(this) ? P + k : k); };
  st.setItem = function (k, v) { return set.call(this, mine(this) ? P + k : k, v); };
  st.removeItem = function (k) { return del.call(this, mine(this) ? P + k : k); };

  // Если сохранённое поле или кубик не куплены (например, закончилась подписка), возвращаем бесплатные
  function fixPrefs() {
    let owned = [], prefs = {};
    try { owned = JSON.parse(localStorage.getItem("lila-owned")) || []; } catch (e) {}
    try { prefs = JSON.parse(localStorage.getItem("lila-prefs-v1")) || {}; } catch (e) {}
    const S = window.LILA_SHOP, has = (p) => owned.includes(p) || owned.includes("all");
    let changed = false;
    if (prefs.theme && !S.freeThemes.includes(prefs.theme) && !has("boards")) { prefs.theme = S.freeThemes[0]; changed = true; }
    if (prefs.dice && !S.freeDice.includes(prefs.dice) && !has("dice")) { prefs.dice = S.freeDice[0]; changed = true; }
    if (changed) localStorage.setItem("lila-prefs-v1", JSON.stringify(prefs));
  }

  const load = (src) => new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.setAttribute("src", src);
    s.async = false;
    s.onload = ok; s.onerror = () => fail(new Error(src));
    document.body.appendChild(s);
  });

  async function boot() {
    const gameUrl = new URL("../lila/", here).href;
    const html = await (await fetch(gameUrl + "index.html", { cache: "no-cache" })).text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const base = document.createElement("base");
    base.href = gameUrl;
    document.head.prepend(base);
    doc.head.querySelectorAll("link[rel=stylesheet], meta[name=description]").forEach((n) => document.head.appendChild(n));
    const scripts = [...doc.body.querySelectorAll("script[src]")].map((s) => s.getAttribute("src"));
    doc.body.querySelectorAll("script").forEach((s) => s.remove());
    document.body.innerHTML = doc.body.innerHTML;
    document.body.dataset.platform = platform;

    if (SDK[platform]) await load(SDK[platform]).catch(() => {});
    for (const src of scripts) {
      if (src.startsWith("game.js")) fixPrefs();
      await load(src);
    }
    await load(new URL("shop.js?v=1", here).href);
  }

  boot().catch((e) => {
    document.body.innerHTML = `<div id="boot">Не удалось загрузить игру. Проверьте интернет и откройте ещё раз.<br><small>${e.message}</small></div>`;
  });
})();
