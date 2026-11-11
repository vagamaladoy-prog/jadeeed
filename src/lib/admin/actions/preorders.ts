"use server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { preorderNoteSchema, preorderSettingsSchema, preorderStatusSchema, type PreorderSettingsValues } from "@/lib/admin/schemas";
import { actionError, fail, revalidateStore, validationError, type ActionResult } from "@/lib/admin/action";
import type { PreorderStatusCode } from "@/lib/admin/labels";

// Pre-bookings never touch stock, so status changes don't refresh the storefront.

export async function updatePreorderStatus(preorderId: string, status: PreorderStatusCode): Promise<ActionResult> {
  await requireAdmin();
  const parsed = preorderStatusSchema.safeParse({ preorderId, status });
  if (!parsed.success) return fail("Неизвестный статус");
  try {
    await db.preorder.update({ where: { id: parsed.data.preorderId }, data: { status: parsed.data.status } });
  } catch (e) {
    return actionError(e, "Не удалось изменить статус");
  }
  return { ok: true };
}

export async function savePreorderNote(preorderId: string, note: string): Promise<ActionResult> {
  await requireAdmin();
  const parsed = preorderNoteSchema.safeParse({ preorderId, note });
  if (!parsed.success) return validationError(parsed.error);
  try {
    await db.preorder.update({ where: { id: parsed.data.preorderId }, data: { adminNote: parsed.data.note || null } });
  } catch (e) {
    return actionError(e);
  }
  return { ok: true };
}

/** Opens / closes pre-booking on the site and sets the "next batch" line shown there. */
export async function savePreorderSettings(values: PreorderSettingsValues): Promise<ActionResult> {
  await requireAdmin();
  const parsed = preorderSettingsSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error);
  const data = { preorderEnabled: parsed.data.enabled, preorderNoteUz: parsed.data.noteUz, preorderNoteRu: parsed.data.noteRu };
  try {
    await db.settings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  } catch (e) {
    return actionError(e);
  }
  revalidateStore();
  return { ok: true };
}
