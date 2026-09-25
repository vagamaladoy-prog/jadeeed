import "server-only";
import { db } from "@/lib/db";
import { deleteImage } from "@/lib/storage";

/**
 * Best-effort removal of uploaded files that are no longer used anywhere.
 * A file still referenced by a product photo, banner, category or an order snapshot is kept
 * (orders keep showing the photo the customer saw). Never throws.
 */
export async function cleanupImages(urls: (string | null | undefined)[]) {
  const unique = [...new Set(urls.filter((u): u is string => !!u))];
  if (!unique.length) return;
  try {
    const [photos, banners, categories, orderItems] = await Promise.all([
      db.productImage.findMany({ where: { url: { in: unique } }, select: { url: true } }),
      db.banner.findMany({
        where: { OR: [{ imageDesktop: { in: unique } }, { imageMobile: { in: unique } }] },
        select: { imageDesktop: true, imageMobile: true },
      }),
      db.category.findMany({ where: { image: { in: unique } }, select: { image: true } }),
      db.orderItem.findMany({ where: { image: { in: unique } }, select: { image: true }, distinct: ["image"] }),
    ]);
    const used = new Set<string>([
      ...photos.map((p) => p.url),
      ...banners.flatMap((b) => [b.imageDesktop, b.imageMobile ?? ""]),
      ...categories.map((c) => c.image ?? ""),
      ...orderItems.map((o) => o.image ?? ""),
    ]);
    await Promise.all(unique.filter((u) => !used.has(u)).map((u) => deleteImage(u).catch(() => undefined)));
  } catch (e) {
    console.error("[admin] image cleanup failed", e);
  }
}
