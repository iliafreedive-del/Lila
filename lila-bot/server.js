// Сервер Лилы: бот Telegram (оплата звёздами), бот MAX, оплата на сайте через ЮKassa и учёт покупок.
// Без зависимостей, нужен только Node.js 18+. Настройки — в переменных окружения (см. .env.example).

const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Простая загрузка .env рядом с сервером
try {
  for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch (e) {}

const env = process.env;
const PORT = +env.PORT || 8080;
const PUBLIC_URL = (env.PUBLIC_URL || "").replace(/\/$/, "");
const APP_URL = env.APP_URL || "https://iliafreedive-del.github.io/Lila/lila-app/";
const ORIGIN = env.ALLOWED_ORIGIN || "https://iliafreedive-del.github.io";
const DATA_FILE = env.DATA_FILE || path.join(__dirname, "data.json");
const TG = env.BOT_TOKEN ? `https://api.telegram.org/bot${env.BOT_TOKEN}/` : null;
const MAX_API = (env.MAX_API || "https://platform-api2.max.ru").replace(/\/$/, "");

// Цены. stars — звёзды Telegram, rub — рубли на сайте и в MAX.
const PRODUCTS = {
  all: { title: "Вся Лила навсегда", stars: 300, rub: 449 },
  deep: { title: "Глубокие толкования", stars: 200, rub: 299 },
  boards: { title: "Все поля", stars: 150, rub: 199 },
  dice: { title: "Все кубики", stars: 75, rub: 99 },
  donate: { title: "Поддержать автора", stars: 50, rub: 100 },
};

/* ---------- Хранилище: один JSON-файл ---------- */

let db = { accounts: {}, ids: {}, codes: {}, payments: {} };
try { db = { ...db, ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) }; } catch (e) {}
let saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.writeFileSync(DATA_FILE + ".tmp", JSON.stringify(db));
    fs.renameSync(DATA_FILE + ".tmp", DATA_FILE);
  }, 200);
}
const newCode = () => {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c;
  do c = Array.from(crypto.randomBytes(8), (b) => abc[b % abc.length]).join(""); while (db.codes[c]);
  return c;
};
// Аккаунт для пользователя ("tg:123", "max:456", "web:<id устройства>")
function account(uid) {
  let id = db.ids[uid];
  if (!id) {
    id = crypto.randomUUID();
    const code = newCode();
    db.accounts[id] = { owned: [], code, donations: 0, created: Date.now() };
    db.codes[code] = id;
    db.ids[uid] = id;
    persist();
  }
  return db.accounts[id];
}
function grant(uid, product, payment) {
  if (db.payments[payment.id]) return false; // одна оплата засчитывается один раз
  const acc = account(uid);
  db.payments[payment.id] = { uid, product, at: Date.now(), ...payment };
  if (product === "donate") acc.donations++;
  else if (!acc.owned.includes(product)) acc.owned.push(product);
  persist();
  console.log("Оплата", uid, product, payment.id);
  return true;
}

/* ---------- Проверка, что запрос пришёл из Telegram или MAX ---------- */

// Подпись initData: HMAC-SHA256 с ключом HMAC("WebAppData", токен бота). В MAX тот же алгоритм.
function checkInitData(initData, token) {
  if (!initData || !token) return null;
  const p = new URLSearchParams(initData);
  const hash = p.get("hash");
  if (!hash) return null;
  p.delete("hash");
  const check = [...p.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(token).digest();
  const sign = crypto.createHmac("sha256", secret).update(check).digest("hex");
  if (sign.length !== hash.length || !crypto.timingSafeEqual(Buffer.from(sign), Buffer.from(hash))) return null;
  if (Date.now() / 1000 - +p.get("auth_date") > 86400 * 7) return null;
  try { return JSON.parse(p.get("user")); } catch (e) { return null; }
}
function who(body) {
  if (body.platform === "tg") { const u = checkInitData(body.initData, env.BOT_TOKEN); return u && "tg:" + u.id; }
  if (body.platform === "max") { const u = checkInitData(body.initData, env.MAX_TOKEN); return u && "max:" + (u.id || u.user_id); }
  if (body.platform === "web" && /^[a-f0-9]{16,48}$/.test(body.deviceId || "")) return "web:" + body.deviceId;
  return null;
}

/* ---------- Внешние API ---------- */

async function tg(method, params = {}) {
  const r = await fetch(TG + method, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(params) });
  const j = await r.json();
  if (!j.ok) throw new Error(`Telegram ${method}: ${j.description}`);
  return j.result;
}
async function max(method, pathPart, { query, body } = {}) {
  const url = new URL(MAX_API + "/" + pathPart);
  Object.entries(query || {}).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url, { method, headers: { Authorization: env.MAX_TOKEN, "content-type": "application/json" }, body: body && JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`MAX ${pathPart}: ${r.status} ${JSON.stringify(j)}`);
  return j;
}
const ykAuth = () => "Basic " + Buffer.from(`${env.YK_SHOP_ID}:${env.YK_SECRET}`).toString("base64");
async function yookassa(method, pathPart, body) {
  const r = await fetch("https://api.yookassa.ru/v3/" + pathPart, {
    method, body: body && JSON.stringify(body),
    headers: { Authorization: ykAuth(), "content-type": "application/json", "Idempotence-Key": crypto.randomUUID() },
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`ЮKassa: ${j.description || r.status}`);
  return j;
}

/* ---------- API для игры ---------- */

const api = {
  async "/api/session"(body, uid) {
    const acc = account(uid);
    const prices = Object.fromEntries(Object.entries(PRODUCTS).map(([k, p]) => [k, { stars: p.stars, rub: p.rub }]));
    return { owned: acc.owned, code: acc.code, prices };
  },
  async "/api/buy"(body, uid) {
    const p = PRODUCTS[body.product];
    if (!p) throw new Error("Нет такого товара");
    if (uid.startsWith("tg:")) {
      // Цифровые товары внутри Telegram продаются только за звёзды (валюта XTR, provider_token пустой)
      const invoiceUrl = await tg("createInvoiceLink", {
        title: p.title, description: "Лила — игра самопознания", payload: JSON.stringify({ uid, product: body.product }),
        currency: "XTR", prices: [{ label: p.title, amount: p.stars }],
      });
      return { invoiceUrl };
    }
    if (!env.YK_SHOP_ID) throw new Error("Оплата на сайте пока не подключена");
    const ret = new URL(APP_URL);
    if (uid.startsWith("max:")) ret.searchParams.set("p", "max");
    ret.searchParams.set("paid", "1");
    const pay = {
      amount: { value: p.rub.toFixed(2), currency: "RUB" }, capture: true,
      confirmation: { type: "redirect", return_url: ret.href },
      description: p.title, metadata: { uid, product: body.product },
    };
    const r = await yookassa("POST", "payments", pay);
    return { payUrl: r.confirmation.confirmation_url };
  },
  async "/api/link"(body, uid) {
    const target = db.codes[String(body.code || "").trim().toUpperCase()];
    if (!target) throw new Error("Код не найден");
    const cur = account(uid), to = db.accounts[target];
    if (cur !== to) {
      cur.owned.forEach((p) => !to.owned.includes(p) && to.owned.push(p));
      to.donations += cur.donations;
      db.ids[uid] = target; // теперь это устройство или мессенджер смотрит в общий аккаунт
      persist();
    }
    return { owned: to.owned, code: to.code };
  },
};

/* ---------- Бот Telegram ---------- */

const tgAppButton = (text = "🪷 Играть в Лилу") => ({ inline_keyboard: [[{ text, web_app: { url: APP_URL + "?p=tg" } }]] });
async function onTelegram(u) {
  if (u.pre_checkout_query) {
    const q = u.pre_checkout_query;
    let ok = false;
    try { ok = !!PRODUCTS[JSON.parse(q.invoice_payload).product]; } catch (e) {}
    return tg("answerPreCheckoutQuery", ok ? { pre_checkout_query_id: q.id, ok } : { pre_checkout_query_id: q.id, ok, error_message: "Товар не найден" });
  }
  const m = u.message;
  if (!m) return;
  if (m.successful_payment) {
    const sp = m.successful_payment, { product } = JSON.parse(sp.invoice_payload);
    grant("tg:" + m.from.id, product, { id: "tg:" + sp.telegram_payment_charge_id, stars: sp.total_amount });
    return tg("sendMessage", { chat_id: m.chat.id, text: product === "donate" ? "Спасибо за поддержку! 🙏" : `Готово: «${PRODUCTS[product].title}» открыто. Возвращайтесь в игру.`, reply_markup: tgAppButton() });
  }
  const text = (m.text || "").trim();
  if (text === "/paysupport") return tg("sendMessage", { chat_id: m.chat.id, text: "Вопросы по оплате: напишите сюда, что купили и когда, мы ответим и при необходимости вернём звёзды." + (env.SUPPORT_CONTACT ? `\nКонтакт: ${env.SUPPORT_CONTACT}` : "") });
  if (text === "/terms") return tg("sendMessage", { chat_id: m.chat.id, text: "Лила — инструмент размышления, а не предсказание. Покупки открывают оформление и тексты в игре навсегда для вашего аккаунта. Возврат — через /paysupport." });
  // Возврат звёзд (только для владельца бота): /refund <id пользователя> <charge_id>
  const rf = text.match(/^\/refund (\d+) (\S+)$/);
  if (rf && String(m.from.id) === env.ADMIN_TG_ID) {
    await tg("refundStarPayment", { user_id: +rf[1], telegram_payment_charge_id: rf[2] });
    const pay = db.payments["tg:" + rf[2]];
    if (pay) { const acc = account(pay.uid); acc.owned = acc.owned.filter((p) => p !== pay.product); pay.refunded = Date.now(); persist(); }
    return tg("sendMessage", { chat_id: m.chat.id, text: "Возврат сделан." });
  }
  return tg("sendMessage", {
    chat_id: m.chat.id,
    text: "🪷 Лила — древняя индийская игра самопознания.\n\nСформулируйте намерение, бросьте кубик и пройдите путь из 72 клеток к Космическому сознанию. После каждого хода — толкование клетки и вопросы к себе.",
    reply_markup: tgAppButton(),
  });
}
async function setupTelegram() {
  if (!TG) return;
  await tg("setChatMenuButton", { menu_button: { type: "web_app", text: "Играть", web_app: { url: APP_URL + "?p=tg" } } });
  await tg("setMyCommands", { commands: [{ command: "start", description: "Начать" }, { command: "paysupport", description: "Помощь с оплатой" }, { command: "terms", description: "Условия" }] });
  if (PUBLIC_URL) {
    await tg("setWebhook", { url: PUBLIC_URL + "/tg/webhook", secret_token: tgSecret(), allowed_updates: ["message", "pre_checkout_query"] });
    console.log("Telegram: вебхук", PUBLIC_URL + "/tg/webhook");
  } else {
    // Без публичного адреса бот сам опрашивает Telegram — удобно для проверки на своём компьютере
    await tg("deleteWebhook");
    console.log("Telegram: опрос без вебхука");
    let offset = 0;
    for (;;) {
      try {
        for (const u of await tg("getUpdates", { offset, timeout: 30 })) { offset = u.update_id + 1; onTelegram(u).catch(console.error); }
      } catch (e) { console.error(e.message); await new Promise((r) => setTimeout(r, 3000)); }
    }
  }
}
const tgSecret = () => crypto.createHash("sha256").update("tg" + env.BOT_TOKEN).digest("hex").slice(0, 40);

/* ---------- Бот MAX ---------- */

async function onMax(u) {
  const chat = u.chat_id || (u.message && u.message.recipient && u.message.recipient.chat_id);
  if (!chat || !["bot_started", "message_created"].includes(u.update_type)) return;
  const buttons = [[env.MAX_BOT_NAME
    ? { type: "open_app", text: "🪷 Играть в Лилу", web_app: env.MAX_BOT_NAME }
    : { type: "link", text: "🪷 Играть в Лилу", url: APP_URL + "?p=max" }]];
  await max("POST", "messages", {
    query: { chat_id: chat },
    body: {
      text: "🪷 Лила — древняя индийская игра самопознания.\n\nСформулируйте намерение, бросьте кубик и пройдите путь из 72 клеток. После каждого хода — толкование клетки и вопросы к себе.",
      attachments: [{ type: "inline_keyboard", payload: { buttons } }],
    },
  });
}
const maxSecret = () => crypto.createHash("sha256").update("max" + env.MAX_TOKEN).digest("hex").slice(0, 40);
async function setupMax() {
  if (!env.MAX_TOKEN || !PUBLIC_URL) return;
  await max("POST", "subscriptions", { body: { url: PUBLIC_URL + "/max/webhook", update_types: ["bot_started", "message_created"], secret: maxSecret() } });
  console.log("MAX: вебхук", PUBLIC_URL + "/max/webhook");
}

/* ---------- ЮKassa ---------- */

async function onYookassa(body) {
  const id = body && body.object && body.object.id;
  if (!id || body.event !== "payment.succeeded") return;
  // Уведомления ЮKassa не подписаны, поэтому перепроверяем платёж запросом к ЮKassa
  const pay = await yookassa("GET", "payments/" + encodeURIComponent(id));
  if (pay.status !== "succeeded" || !pay.paid) return;
  const { uid, product } = pay.metadata || {};
  if (uid && PRODUCTS[product]) grant(uid, product, { id: "yk:" + pay.id, rub: pay.amount.value });
}

/* ---------- HTTP ---------- */

function readBody(req) {
  return new Promise((ok, fail) => {
    let s = "";
    req.on("data", (c) => { s += c; if (s.length > 65536) { fail(new Error("too big")); req.destroy(); } });
    req.on("end", () => { try { ok(s ? JSON.parse(s) : {}); } catch (e) { fail(e); } });
  });
}
const safeEq = (a, b) => typeof a === "string" && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

http.createServer(async (req, res) => {
  const send = (code, obj) => { res.writeHead(code, { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": ORIGIN, "access-control-allow-headers": "content-type" }); res.end(JSON.stringify(obj)); };
  const url = req.url.split("?")[0];
  if (req.method === "OPTIONS") return send(204, {});
  if (req.method === "GET" && url === "/health") return send(200, { ok: true });
  if (req.method !== "POST") return send(404, { error: "not found" });
  try {
    const body = await readBody(req);
    if (url === "/tg/webhook") {
      if (!TG || !safeEq(req.headers["x-telegram-bot-api-secret-token"], tgSecret())) return send(403, {});
      send(200, {}); return onTelegram(body).catch(console.error);
    }
    if (url === "/max/webhook") {
      if (!env.MAX_TOKEN || !safeEq(req.headers["x-max-bot-api-secret"], maxSecret())) return send(403, {});
      send(200, {}); return onMax(body).catch(console.error);
    }
    if (url === "/yookassa/webhook") { await onYookassa(body); return send(200, {}); }
    if (api[url]) {
      const uid = who(body);
      if (!uid) return send(401, { error: "Не удалось проверить вход. Откройте игру заново." });
      return send(200, await api[url](body, uid));
    }
    send(404, { error: "not found" });
  } catch (e) {
    console.error(url, e.message);
    // Свои сообщения (по-русски) показываем игроку, технические — нет
    send(400, { error: /[а-яё]/i.test(e.message) && !/^(Telegram|MAX|ЮKassa)/.test(e.message) ? e.message : "Не получилось, попробуйте ещё раз через минуту" });
  }
}).listen(PORT, () => {
  console.log("Лила: сервер на порту", PORT);
  setupMax().catch((e) => console.error(e.message));
  setupTelegram().catch((e) => console.error(e.message));
});
