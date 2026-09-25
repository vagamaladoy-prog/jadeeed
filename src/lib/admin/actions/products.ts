"use server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { SIZES } from "@/lib/types";
import { productSchema, type ProductValues } from "@/lib/admin/schemas";
import { cleanupImages } from "@/lib/admin/images";
import { actionError, fail, revalidateStore, validationError, type ActionResult, type ActionResultWith } from "@/lib/admin/action";

/**
 * Creates (id = null) or updates a product with all its colours, photos and stock in one transaction.
 * Colours keep their ids (orders reference colorId to return stock on cancel);
 * photos and stock rows of every colour are replaced.
 */
export async function saveProduct(id: string | null, values: ProductValues): Promise<ActionResultWith<{ id: string; colorIds: string[] }>> {
  await requireAdmin();
  const parsed = productSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error);
  const { colors, ...v } = parsed.data;

  const data = {
    nameUz: v.nameUz,
    nameRu: v.nameRu,
    slug: v.slug,
    descriptionUz: v.descriptionUz,
    descriptionRu: v.descriptionRu,
    categoryId: v.categoryId || null,
    sizeChartId: v.sizeChartId || null,
    fit: v.fit,
    price: v.price,
    oldPrice: v.oldPrice,
    compositionUz: v.compositionUz,
    compositionRu: v.compositionRu,
    density: v.density,
    careUz: v.careUz,
    careRu: v.careRu,
    isNew: v.isNew,
    isBestseller: v.isBestseller,
    isFeatured: v.isFeatured,
    isHidden: v.isHidden,
    sortOrder: v.sortOrder,
  };

  let productId: string;
  let colorIds: string[] = [];
  let removedUrls: string[] = [];
  try {
    const result = await db.$transaction(
      async (tx) => {
        const product = id
          ? await tx.product.update({ where: { id }, data, select: { id: true } })
          : await tx.product.create({ data, select: { id: true } });

        const existing = await tx.productColor.findMany({
          where: { productId: product.id },
          select: { id: true, images: { select: { url: true } } },
        });
        const oldUrls = existing.flatMap((c) => c.images.map((i) => i.url));
        const keepIds = new Set(colors.map((c) => c.colorId).filter((x): x is string => !!x));

        const dropped = existing.filter((c) => !keepIds.has(c.id)).map((c) => c.id);
        if (dropped.length) await tx.productColor.deleteMany({ where: { id: { in: dropped } } });

        const savedColorIds: string[] = [];
        for (const [index, c] of colors.entries()) {
          const colorData = { nameUz: c.nameUz, nameRu: c.nameRu, hex: c.hex.toUpperCase(), sortOrder: index };
          const ownId = c.colorId && existing.some((e) => e.id === c.colorId) ? c.colorId : null;
          const color = ownId
            ? await tx.productColor.update({ where: { id: ownId }, data: colorData, select: { id: true } })
            : await tx.productColor.create({ data: { ...colorData, productId: product.id }, select: { id: true } });
          savedColorIds.push(color.id);

          await tx.productImage.deleteMany({ where: { colorId: color.id } });
          if (c.images.length)
            await tx.productImage.createMany({
              data: c.images.map((url, position) => ({ colorId: color.id, url, position })),
            });

          await tx.stock.deleteMany({ where: { colorId: color.id } });
          const stock = SIZES.filter((s) => c.stock[s] !== null && c.stock[s] !== undefined).map((size) => ({
            colorId: color.id,
            size,
            quantity: c.stock[size] as number,
          }));
          if (stock.length) await tx.stock.createMany({ data: stock });
        }

        const newUrls = new Set(colors.flatMap((c) => c.images));
        return { id: product.id, colorIds: savedColorIds, removed: oldUrls.filter((u) => !newUrls.has(u)) };
      },
      { maxWait: 10_000, timeout: 30_000 },
    );
    productId = result.id;
    colorIds = result.colorIds;
    removedUrls = result.removed;
  } catch (e) {
    return actionError(e);
  }

  await cleanupImages(removedUrls);
  revalidateStore();
  return { ok: true, id: productId, colorIds };
}

export async function setProductHidden(id: string, isHidden: boolean): Promise<ActionResult> {
  await requireAdmin();
  if (!id) return fail("Товар не найден");
  try {
    await db.product.update({ where: { id }, data: { isHidden: !!isHidden } });
  } catch (e) {
    return actionError(e);
  }
  revalidateStore();
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!id) return fail("Товар не найден");
  let urls: string[] = [];
  try {
    const photos = await db.productImage.findMany({ where: { color: { productId: id } }, select: { url: true } });
    urls = photos.map((p) => p.url);
    // colours, photos and stock cascade; order items keep their snapshot (productId → null)
    await db.product.delete({ where: { id } });
  } catch (e) {
    return actionError(e, "Не удалось удалить товар");
  }
  await cleanupImages(urls);
  revalidateStore();
  return { ok: true };
}
