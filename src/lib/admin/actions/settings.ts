"use server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyAdmins } from "@/lib/telegram";
import { formatDateTime } from "@/lib/format";
import { siteUrl } from "@/lib/site";
import { settingsSchema, type SettingsValues } from "@/lib/admin/schemas";
import { actionError, revalidateStore, validationError, type ActionResult, type ActionResultWith } from "@/lib/admin/action";

const handle = (s: string) => s.trim().replace(/^@+/, "");
const orNull = (s: string) => (s.trim() ? s.trim() : null);

export async function saveSettings(values: SettingsValues): Promise<ActionResult> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error);
  const v = parsed.data;
  const data = {
    supportUsername: handle(v.supportUsername),
    supportUrl: v.supportUrl,
    channelUsername: handle(v.channelUsername),
    channelUrl: v.channelUrl,
    instagramUsername: handle(v.instagramUsername),
    instagramUrl: v.instagramUrl,
    phone: orNull(v.phone),
    addressUz: orNull(v.addressUz),
    addressRu: orNull(v.addressRu),
    workHoursUz: orNull(v.workHoursUz),
    workHoursRu: orNull(v.workHoursRu),
    aboutUz: v.aboutUz,
    aboutRu: v.aboutRu,
    deliveryUz: v.deliveryUz,
    deliveryRu: v.deliveryRu,
  };
  try {
    await db.settings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  } catch (e) {
    return actionError(e);
  }
  revalidateStore();
  return { ok: true };
}

/** Sends a test message to every chat in TELEGRAM_ADMIN_CHAT_ID. */
export async function sendTelegramTest(): Promise<ActionResultWith<{ sent: number; errors: string[] }>> {
  await requireAdmin();
  try {
    const { sent, errors } = await notifyAdmins(
      `✅ Тестовое сообщение Jadeeed\n${formatDateTime(new Date())}\n\nУведомления о заказах будут приходить сюда.\n${siteUrl()}/admin/orders`,
    );
    if (sent === 0) return { ok: false, error: errors.join("; ") || "Сообщение не отправлено" };
    return { ok: true, sent, errors };
  } catch (e) {
    console.error("[admin] telegram test", e);
    return { ok: false, error: e instanceof Error ? e.message : "Не удалось отправить сообщение" };
  }
}
