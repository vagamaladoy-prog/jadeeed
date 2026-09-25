import { NextResponse, type NextRequest } from "next/server";
import { callTelegram } from "@/lib/telegram";
import { escHtml, mainKeyboard, startPayload, webhookSecretOk, type TgUpdate } from "@/lib/telegram-bot";
import { getSettings } from "@/lib/data";
import { siteUrl } from "@/lib/site";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Admin bot (@jadadminbot) webhook. It sends order notifications to the recipients listed in the
 * admin panel (Settings → Telegram). On /start it links the person to their entry — matched by
 * numeric ID or by @username — so notifications can reach them. Two buttons: open the site, support.
 */
export async function POST(req: NextRequest) {
  if (!webhookSecretOk(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const msg = ((await req.json().catch(() => null)) as TgUpdate | null)?.message;
  if (!msg || msg.chat.type !== "private" || startPayload(msg.text) === null) return NextResponse.json({ ok: true });

  try {
    const settings = await getSettings();
    const chatId = BigInt(msg.chat.id);
    const username = msg.chat.username?.toLowerCase() ?? null;
    const name = msg.chat.first_name ?? null;

    let recipient = await db.telegramRecipient.findUnique({ where: { chatId } });
    if (!recipient && username) {
      const byName = await db.telegramRecipient.findUnique({ where: { username } });
      if (byName) recipient = await db.telegramRecipient.update({ where: { id: byName.id }, data: { chatId, name } });
    } else if (recipient) {
      await db.telegramRecipient.update({ where: { id: recipient.id }, data: { name, ...(username ? { username } : {}) } });
    }

    const hi = name ? `, ${escHtml(name)}` : "";
    const text = recipient
      ? [
          `Xush kelibsiz${hi}!`,
          "",
          "<b>Men o'sha.</b> Bu chatga har bir yangi buyurtma haqida xabar keladi: ism, telefon, tarkib va summa.",
          "",
          `Buyurtmalar: ${siteUrl()}/admin/orders`,
        ].join("\n")
      : [
          `Salom${hi}!`,
          "",
          "Bu — <b>Jadeeed</b> do'konining xizmat boti: u faqat do'kon jamoasiga yangi buyurtmalar haqida xabar beradi.",
          "",
          "Futbolka tanlash yoki savol berish uchun — pastdagi tugmalar.",
        ].join("\n");

    await callTelegram(
      "sendMessage",
      { chat_id: msg.chat.id, text, parse_mode: "HTML", link_preview_options: { is_disabled: true }, reply_markup: mainKeyboard(settings.supportUrl, "Saytni ochish") },
      6000,
      "admin",
    );
  } catch (e) {
    console.error("[admin bot] /start failed", e);
  }
  return NextResponse.json({ ok: true });
}
