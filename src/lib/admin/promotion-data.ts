import "server-only";
import { db } from "@/lib/db";
import type { Option } from "./dto";

/** Options for the promotion form. */
export async function getPromotionFormData() {
  const [products, categories] = await Promise.all([
    db.product.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: { id: true, nameUz: true, nameRu: true, isHidden: true, category: { select: { nameRu: true } } },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, nameRu: true } }),
  ]);
  return {
    products: products.map((p) => ({
      value: p.id,
      label: `${p.nameRu || p.nameUz}${p.isHidden ? " (скрыт)" : ""}`,
      category: p.category?.nameRu ?? null,
    })),
    categories: categories.map((c): Option => ({ value: c.id, label: c.nameRu })),
  };
}
