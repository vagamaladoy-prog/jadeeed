"use server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { bannerSchema, type BannerValues } from "@/lib/admin/schemas";
import { cleanupImages } from "@/lib/admin/images";
import { actionError, fail, revalidateStore, validationError, type ActionResult, type ActionResultWith } from "@/lib/admin/action";

export async function saveBanner(id: string | null, values: BannerValues): Promise<ActionResultWith<{ id: string }>> {
  await requireAdmin();
  const parsed = bannerSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error);
  const v = parsed.data;
  const data = {
    imageDesktop: v.imageDesktop,
    imageMobile: v.imageMobile || null,
    altUz: v.altUz,
    altRu: v.altRu,
    link: v.link || null,
    headerTone: v.headerTone,
    isActive: v.isActive,
  };

  let savedId: string;
  let removed: (string | null)[] = [];
  try {
    if (id) {
      const before = await db.banner.findUniqueOrThrow({ where: { id }, select: { imageDesktop: true, imageMobile: true } });
      await db.banner.update({ where: { id }, data });
      removed = [before.imageDesktop, before.imageMobile].filter((u) => u && u !== data.imageDesktop && u !== data.imageMobile);
      savedId = id;
    } else {
      const last = await db.banner.aggregate({ _max: { sortOrder: true } });
      const created = await db.banner.create({ data: { ...data, sortOrder: (last._max.sortOrder ?? -1) + 1 }, select: { id: true } });
      savedId = created.id;
    }
  } catch (e) {
    return actionError(e);
  }
  await cleanupImages(removed);
  revalidateStore();
  return { ok: true, id: savedId };
}

export async function setBannerActive(id: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();
  if (!id) return fail("Баннер не найден");
  try {
    await db.banner.update({ where: { id }, data: { isActive: !!isActive } });
  } catch (e) {
    return actionError(e);
  }
  revalidateStore();
  return { ok: true };
}

/** Saves a new order of banners (ids in display order). */
export async function reorderBanners(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  if (!Array.isArray(ids) || ids.some((x) => typeof x !== "string") || ids.length > 200) return fail("Неверный порядок");
  try {
    await db.$transaction(ids.map((id, sortOrder) => db.banner.update({ where: { id }, data: { sortOrder } })));
  } catch (e) {
    return actionError(e, "Не удалось сохранить порядок");
  }
  revalidateStore();
  return { ok: true };
}

export async function deleteBanner(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!id) return fail("Баннер не найден");
  let urls: (string | null)[] = [];
  try {
    const b = await db.banner.delete({ where: { id } });
    urls = [b.imageDesktop, b.imageMobile];
  } catch (e) {
    return actionError(e, "Не удалось удалить баннер");
  }
  await cleanupImages(urls);
  revalidateStore();
  return { ok: true };
}
