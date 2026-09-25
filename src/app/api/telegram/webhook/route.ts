import { NextResponse, type NextRequest } from "next/server";
import { callTelegram } from "@/lib/telegram";
import { escHtml, mainKeyboard, startPayload, webhookSecretOk, type TgUpdate } from "@/lib/telegram-bot";
import { getPhrases, getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * Client bot (@jadeeedrobot) webhook. Answers ONLY /start: a greeting with the brand question and two
 * buttons — open the shop (Mini App) and support. Every other message is ignored.
 */
export async function POST(req: NextRequest) {
  if (!webhookSecretOk(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const msg = ((await req.json().catch(() => null)) as TgUpdate | null)?.message;
  if (!msg || msg.chat.type !== "private" || startPayload(msg.text) === null) return NextResponse.json({ ok: true });

  try {
    const [phrases, settings] = await Promise.all([getPhrases(), getSettings()]);
    const name = msg.from?.first_name ? `, ${escHtml(msg.from.first_name)}` : "";
    const text = [
      `Assalomu alaykum${name}!`,
      "",
      `<b>${escHtml(phrases.slots.HOME_QUESTION)}</b>`,
      "",
      "Jadeeed — o'zimizning so'zlar yozilgan futbolkalar: sokin rang, yuvilgan paxta, oversayz bichim.",
      "Katalog, o'lchamlar va buyurtma — hammasi shu yerda, Telegram'dan chiqmasdan.",
      "",
      "Savol bo'lsa — qo'llab-quvvatlash xizmatiga yozing, tez javob beramiz.",
    ].join("\n");
    await callTelegram("sendMessage", {
      chat_id: msg.chat.id,
      text,
      parse_mode: "HTML",
      reply_markup: mainKeyboard(settings.supportUrl, "Do'konni ochish"),
    });
  } catch (e) {
    console.error("[client bot] /start reply failed", e);
  }
  // always 200 so Telegram doesn't retry
  return NextResponse.json({ ok: true });
}
