import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { formatDateTime, formatPhone, groupDigits } from "./format";
import { siteUrl } from "./site";

const API = "https://api.telegram.org";

function token() {
  return process.env.TELEGRAM_BOT_TOKEN ?? "";
}

export function adminChatIds(): string[] {
  return (process.env.TELEGRAM_ADMIN_CHAT_ID ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function callTelegram<T = unknown>(method: string, body: Record<string, unknown>, timeoutMs = 6000): Promise<T> {
  if (!token()) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  const res = await fetch(`${API}/bot${token()}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as { ok: boolean; result?: T; description?: string } | null;
  if (!res.ok || !json?.ok) throw new Error(`Telegram ${method}: ${json?.description ?? res.status}`);
  return json.result as T;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Sends to every admin chat. Never throws — returns how many chats got it. */
export async function notifyAdmins(html: string): Promise<{ sent: number; errors: string[] }> {
  const ids = adminChatIds();
  const errors: string[] = [];
  let sent = 0;
  if (!token() || ids.length === 0) {
    errors.push("TELEGRAM_BOT_TOKEN / TELEGRAM_ADMIN_CHAT_ID not configured");
    return { sent, errors };
  }
  await Promise.all(
    ids.map(async (chat_id) => {
      try {
        await callTelegram("sendMessage", { chat_id, text: html, parse_mode: "HTML", link_preview_options: { is_disabled: true } });
        sent++;
      } catch (e) {
        errors.push(`${chat_id}: ${(e as Error).message}`);
      }
    }),
  );
  return { sent, errors };
}

export type OrderForMessage = {
  number: number;
  createdAt: Date;
  customerName: string;
  phone: string;
  comment: string | null;
  total: number;
  source: "WEB" | "TELEGRAM";
  telegramUsername: string | null;
  telegramId: bigint | number | null;
  items: { productName: string; colorName: string; size: string; quantity: number; price: number }[];
};

export function orderMessage(o: OrderForMessage): string {
  const lines = [
    `<b>Yangi buyurtma #${o.number}</b>`,
    formatDateTime(o.createdAt),
    "",
    `Имя: ${esc(o.customerName)}`,
    `Телефон: ${formatPhone(o.phone)}`,
  ];
  if (o.comment) lines.push(`Комментарий: ${esc(o.comment)}`);
  if (o.source === "TELEGRAM") {
    const who = o.telegramUsername ? `@${esc(o.telegramUsername)}` : o.telegramId ? `id ${o.telegramId}` : "";
    lines.push(`Источник: Telegram${who ? `, ${who}` : ""}`);
  }
  lines.push("", "Товары:");
  for (const i of o.items) {
    lines.push(
      `• ${esc(i.productName)} — ${esc(i.colorName.toLocaleLowerCase("ru"))} — ${i.size} — ${i.quantity} шт — ${groupDigits(i.price * i.quantity)} сум`,
    );
  }
  lines.push("", `<b>Итого: ${groupDigits(o.total)} сум</b>`, "", `Открыть в админке: ${siteUrl()}/admin/orders/${o.number}`);
  return lines.join("\n");
}

// ─── Mini App initData validation ────────────────────────────────────────────
export type TelegramUser = { id: number; first_name?: string; last_name?: string; username?: string; language_code?: string };

/**
 * Validates Telegram.WebApp.initData with the bot token (HMAC-SHA256, as documented
 * in core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app).
 */
export function validateInitData(initData: string, maxAgeSec = 60 * 60 * 24): TelegramUser | null {
  if (!initData || !token()) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(token()).digest();
  const expected = createHmac("sha256", secretKey).update(dataCheckString).digest();
  const given = Buffer.from(hash, "hex");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  const authDate = Number(params.get("auth_date"));
  if (!authDate || Date.now() / 1000 - authDate > maxAgeSec) return null;
  try {
    const user = JSON.parse(params.get("user") ?? "null") as TelegramUser | null;
    return user?.id ? user : null;
  } catch {
    return null;
  }
}
