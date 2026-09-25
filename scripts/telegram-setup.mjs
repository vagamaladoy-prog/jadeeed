// npm run telegram:setup — run after the first deploy (and whenever the site URL changes).
// Client bot (TELEGRAM_BOT_TOKEN): webhook /api/telegram/webhook, menu button "Do'kon" → Mini App.
// Admin bot (TELEGRAM_ADMIN_BOT_TOKEN): webhook /api/telegram/admin-webhook, menu button → site.
// Order recipients are managed in the admin panel (Settings), each presses Start in the admin bot once.
import "dotenv/config";

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const clientToken = process.env.TELEGRAM_BOT_TOKEN;
const adminToken = process.env.TELEGRAM_ADMIN_BOT_TOKEN;

if (!clientToken || !site || !secret) {
  console.error("Нужны TELEGRAM_BOT_TOKEN, NEXT_PUBLIC_SITE_URL и TELEGRAM_WEBHOOK_SECRET (в .env или в окружении).");
  process.exit(1);
}
if (!site.startsWith("https://")) {
  console.error(`NEXT_PUBLIC_SITE_URL должен начинаться с https:// (сейчас: ${site}). Telegram не работает с http.`);
  process.exit(1);
}

const api = (token) => async (method, body = {}) => {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`${method}: ${json.description}`);
  return json.result;
};

async function setupBot({ token, path, menuText, commands, description, shortDescription }) {
  const call = api(token);
  const me = await call("getMe");
  await call("setWebhook", { url: `${site}${path}`, secret_token: secret, allowed_updates: ["message"], drop_pending_updates: true });
  await call("setChatMenuButton", { menu_button: { type: "web_app", text: menuText, web_app: { url: `${site}/` } } });
  await call("setMyCommands", { commands });
  await call("setMyDescription", { description }).catch(() => {});
  await call("setMyShortDescription", { short_description: shortDescription }).catch(() => {});
  const info = await call("getWebhookInfo");
  console.log(`✓ @${me.username}: webhook ${site}${path}, меню «${menuText}»`);
  if (info.last_error_message) console.warn(`  ! последняя ошибка webhook: ${info.last_error_message}`);
  return me;
}

await setupBot({
  token: clientToken,
  path: "/api/telegram/webhook",
  menuText: "Do'kon",
  commands: [{ command: "start", description: "Do'konni ochish" }],
  description: "Siz o'shami? Jadeeed — o'zbekcha so'zlar yozilgan futbolkalar. Katalog va buyurtma — Telegram ichida.",
  shortDescription: "Jadeeed futbolkalari — do'kon Telegram ichida",
});

if (adminToken) {
  const me = await setupBot({
    token: adminToken,
    path: "/api/telegram/admin-webhook",
    menuText: "Sayt",
    commands: [{ command: "start", description: "Boshlash" }],
    description: "Jadeeed do'konining xizmat boti: yangi buyurtmalar haqida xabar beradi.",
    shortDescription: "Jadeeed — buyurtmalar haqida xabarlar",
  });
  console.log(`  Получатели заказов: админка → Настройки → «Уведомления о заказах»; каждый нажимает Start в https://t.me/${me.username}`);
} else {
  console.log("TELEGRAM_ADMIN_BOT_TOKEN не задан — уведомления будет слать клиентский бот.");
}
console.log("Готово.");
