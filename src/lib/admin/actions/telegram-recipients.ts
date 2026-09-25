"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { actionError, fail, type ActionResult } from "@/lib/admin/action";

/**
 * Accepts "@username", "username", "t.me/username" or a numeric Telegram ID.
 * Usernames: 5–32 chars, letters/digits/underscore (Telegram rules).
 */
function parse(input: string): { username: string } | { chatId: bigint } | null {
  const v = input.trim().replace(/^https?:\/\/(www\.)?t\.me\//i, "").replace(/^@+/, "");
  if (/^-?\d{5,20}$/.test(v)) return { chatId: BigInt(v) };
  if (/^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(v)) return { username: v.toLowerCase() };
  return null;
}

export async function addTelegramRecipient(input: string): Promise<ActionResult> {
  await requireAdmin();
  const parsed = parse(input);
  if (!parsed) return fail("Введите @username (5–32 символа) или числовой ID пользователя Telegram");
  try {
    const exists = await db.telegramRecipient.findFirst({ where: "username" in parsed ? { username: parsed.username } : { chatId: parsed.chatId } });
    if (exists) return fail("Этот получатель уже добавлен");
    await db.telegramRecipient.create({ data: parsed });
  } catch (e) {
    return actionError(e, "Не удалось добавить получателя");
  }
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function removeTelegramRecipient(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await db.telegramRecipient.delete({ where: { id } });
  } catch (e) {
    return actionError(e, "Не удалось удалить получателя");
  }
  revalidatePath("/admin/settings");
  return { ok: true };
}
