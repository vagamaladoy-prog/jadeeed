import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { callTelegram } from "@/lib/telegram";
import { getPhrases, getSettings } from "@/lib/data";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

function secretOk(req: NextRequest) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
  const got = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!expected || got.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

type Update = { message?: { chat: { id: number; type: string }; text?: string } };

/**
 * Bot webhook. The bot answers ONLY /start (greeting + "Do'konni ochish" Mini App button +
 * support/channel buttons). Everything else is ignored. Order notifications go only to admins.
 */
export async function POST(req: NextRequest) {
  if (!secretOk(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const update = (await req.json().catch(() => null)) as Update | null;
  const msg = update?.message;
  if (!msg?.text || msg.chat.type !== "private" || !/^\/start(\s|@|$)/.test(msg.text)) {
    return NextResponse.json({ ok: true });
  }

  try {
    const [phrases, settings] = await Promise.all([getPhrases(), getSettings()]);
    const text = `${phrases.slots.HOME_QUESTION}\n\nJadeeed — o'zbek brendi futbolkalari. Do'konni shu yerda, Telegram ichida oching.`;
    await callTelegram("sendMessage", {
      chat_id: msg.chat.id,
      text,
      reply_markup: {
        inline_keyboard: [
          [{ text: "Do'konni ochish", web_app: { url: `${siteUrl()}/` } }],
          [
            { text: "Qo'llab-quvvatlash", url: settings.supportUrl },
            { text: "Kanal", url: settings.channelUrl },
          ],
        ],
      },
    });
  } catch (e) {
    console.error("[bot] /start reply failed", e);
  }
  // always 200 so Telegram doesn't retry
  return NextResponse.json({ ok: true });
}
