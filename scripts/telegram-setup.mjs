// npm run telegram:setup — run once after the first deploy (and whenever the site URL changes).
// Registers the webhook (/api/telegram/webhook, protected by TELEGRAM_WEBHOOK_SECRET)
// and sets the bot's menu button "Do'kon" that opens the site as a Mini App.
import "dotenv/config";

const token = process.env.TELEGRAM_BOT_TOKEN;
const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token || !site || !secret) {
  console.error("Нужны TELEGRAM_BOT_TOKEN, NEXT_PUBLIC_SITE_URL и TELEGRAM_WEBHOOK_SECRET (в .env или в окружении).");
  process.exit(1);
}
if (!site.startsWith("https://")) {
  console.error(`NEXT_PUBLIC_SITE_URL должен начинаться с https:// (сейчас: ${site}). Telegram не работает с http.`);
  process.exit(1);
}

async function call(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`${method}: ${json.description}`);
  return json.result;
}

const me = await call("getMe", {});
console.log(`Бот: @${me.username}`);

await call("setWebhook", {
  url: `${site}/api/telegram/webhook`,
  secret_token: secret,
  allowed_updates: ["message"],
  drop_pending_updates: true,
});
console.log(`✓ Webhook: ${site}/api/telegram/webhook`);

await call("setChatMenuButton", {
  menu_button: { type: "web_app", text: "Do'kon", web_app: { url: `${site}/` } },
});
console.log("✓ Кнопка меню «Do'kon» → Mini App");

await call("setMyCommands", { commands: [{ command: "start", description: "Do'konni ochish" }] });
await call("setMyDescription", { description: "Siz o'shami? Jadeeed — o'zbek brendi futbolkalari." }).catch(() => {});
console.log("✓ Команда /start");

const info = await call("getWebhookInfo", {});
if (info.last_error_message) console.warn(`! Последняя ошибка webhook: ${info.last_error_message}`);
console.log("Готово.");
