"use server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { promotionSchema, type PromotionValues } from "@/lib/admin/schemas";
import { fromLocalInput } from "@/lib/admin/datetime";
import { actionError, fail, revalidateStore, validationError, type ActionResult, type ActionResultWith } from "@/lib/admin/action";

export async function savePromotion(id: string | null, values: PromotionValues): Promise<ActionResultWith<{ id: string }>> {
  await requireAdmin();
  const parsed = promotionSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error);
  const v = parsed.data;

  const products = v.scope === "PRODUCTS" ? v.productIds.map((pid) => ({ id: pid })) : [];
  const data = {
    name: v.name,
    type: v.type,
    value: v.value,
    scope: v.scope,
    categoryId: v.scope === "CATEGORY" ? v.categoryId : null,
    startsAt: fromLocalInput(v.startsAt),
    endsAt: fromLocalInput(v.endsAt),
    isActive: v.isActive,
  };

  let savedId: string;
  try {
    const promo = id
      ? await db.promotion.update({ where: { id }, data: { ...data, products: { set: products } }, select: { id: true } })
      : await db.promotion.create({ data: { ...data, products: { connect: products } }, select: { id: true } });
    savedId = promo.id;
  } catch (e) {
    return actionError(e);
  }
  revalidateStore();
  return { ok: true, id: savedId };
}

export async function setPromotionActive(id: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();
  if (!id) return fail("Акция не найдена");
  try {
    await db.promotion.update({ where: { id }, data: { isActive: !!isActive } });
  } catch (e) {
    return actionError(e);
  }
  revalidateStore();
  return { ok: true };
}

export async function deletePromotion(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!id) return fail("Акция не найдена");
  try {
    await db.promotion.delete({ where: { id } });
  } catch (e) {
    return actionError(e, "Не удалось удалить акцию");
  }
  revalidateStore();
  return { ok: true };
}
