"use server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { phraseSchema, type PhraseValues } from "@/lib/admin/schemas";
import { actionError, fail, revalidateStore, validationError, type ActionResult, type ActionResultWith } from "@/lib/admin/action";

export async function savePhrase(id: string | null, values: PhraseValues): Promise<ActionResultWith<{ id: string }>> {
  await requireAdmin();
  const parsed = phraseSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error);
  const data = { ...parsed.data, slots: [...new Set(parsed.data.slots)] };
  let savedId: string;
  try {
    const row = id
      ? await db.brandPhrase.update({ where: { id }, data, select: { id: true } })
      : await db.brandPhrase.create({ data, select: { id: true } });
    savedId = row.id;
  } catch (e) {
    return actionError(e);
  }
  revalidateStore();
  return { ok: true, id: savedId };
}

export async function deletePhrase(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!id) return fail("Фраза не найдена");
  try {
    await db.brandPhrase.delete({ where: { id } });
  } catch (e) {
    return actionError(e, "Не удалось удалить фразу");
  }
  revalidateStore();
  return { ok: true };
}
