import "server-only";
import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { siteUrl } from "./site";

export type TgUpdate = {
  message?: {
    chat: { id: number; type: string; username?: string; first_name?: string; last_name?: string };
    from?: { first_name?: string; username?: string };
    text?: string;
  };
};

const safeEq = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Telegram sends X-Telegram-Bot-Api-Secret-Token with every webhook call (set by telegram:setup). */
export function webhookSecretOk(req: NextRequest) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
  const got = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
  return !!expected && safeEq(got, expected);
}

/** "/start" or "/start payload" (also "/start@botname"); returns the payload or null when it isn't /start. */
export function startPayload(text?: string): string | null {
  const m = text?.match(/^\/start(?:@\S+)?(?:\s+(\S+))?\s*$/);
  if (!m) return null;
  return m[1] ?? "";
}

/** The two buttons both bots show: support + open the shop (as a Mini App inside Telegram). */
export function mainKeyboard(supportUrl: string, openLabel: string) {
  return {
    inline_keyboard: [
      [{ text: openLabel, web_app: { url: `${siteUrl()}/` } }],
      [{ text: "Qo'llab-quvvatlash", url: supportUrl }],
    ],
  };
}

export const escHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
