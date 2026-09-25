"use server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { categorySchema, type CategoryValues } from "@/lib/admin/schemas";
import { cleanupImages } from "@/lib/admin/images";
import { actionError, fail, revalidateStore, validationError, type ActionResult, type ActionResultWith } from "@/lib/admin/action";

export async function saveCategory(id: string | null, values: CategoryValues): Promise<ActionResultWith<{ id: string }>> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error);
  const v = parsed.data;
  const data = {
    slug: v.slug,
    nameUz: v.nameUz,
    nameRu: v.nameRu,
    descriptionUz: v.descriptionUz || null,
    descriptionRu: v.descriptionRu || null,
    image: v.image || null,
    sortOrder: v.sortOrder,
    isVisible: v.isVisible,
    sizeChartId: v.sizeChartId || null,
  };

  let savedId: string;
  let removed: (string | null)[] = [];
  try {
    if (id) {
      const before = await db.category.findUniqueOrThrow({ where: { id }, select: { image: true } });
      await db.category.update({ where: { id }, data });
      if (before.image && before.image !== data.image) removed = [before.image];
      savedId = id;
    } else {
      savedId = (await db.category.create({ data, select: { id: true } })).id;
    }
  } catch (e) {
    return actionError(e);
  }
  await cleanupImages(removed);
  revalidateStore();
  return { ok: true, id: savedId };
}

/** Products of a deleted category stay, without a category (onDelete: SetNull). Its promotions are deleted (Cascade). */
export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!id) return fail("Категория не найдена");
  let image: string | null = null;
  try {
    image = (await db.category.delete({ where: { id } })).image;
  } catch (e) {
    return actionError(e, "Не удалось удалить категорию");
  }
  await cleanupImages([image]);
  revalidateStore();
  return { ok: true };
}
