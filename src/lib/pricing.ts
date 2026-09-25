export type PromoRule = {
  type: "PERCENT" | "AMOUNT";
  value: number;
  scope: "PRODUCTS" | "CATEGORY";
  categoryId: string | null;
  productIds: string[];
};

export type PriceInfo = {
  /** what the customer pays */
  price: number;
  /** crossed-out price, if any */
  compareAt: number | null;
  /** rounded discount, % */
  discountPercent: number | null;
};

/** Is a promotion running right now? */
export function isPromoLive(p: { isActive: boolean; startsAt: Date | null; endsAt: Date | null }, now = new Date()) {
  if (!p.isActive) return false;
  if (p.startsAt && p.startsAt > now) return false;
  if (p.endsAt && p.endsAt < now) return false;
  return true;
}

/**
 * Final price for a product. The best live promotion wins; without one, a manual
 * `oldPrice` higher than `price` is shown crossed out.
 */
export function resolvePrice(
  product: { id: string; price: number; oldPrice: number | null; categoryId: string | null },
  promos: PromoRule[],
): PriceInfo {
  let best = product.price;
  for (const p of promos) {
    const applies =
      p.scope === "PRODUCTS" ? p.productIds.includes(product.id) : p.categoryId === product.categoryId;
    if (!applies) continue;
    const discounted =
      p.type === "PERCENT"
        ? Math.round((product.price * (100 - Math.min(Math.max(p.value, 0), 95))) / 100 / 1000) * 1000
        : product.price - p.value;
    best = Math.min(best, Math.max(discounted, 0));
  }
  if (best < product.price) {
    return { price: best, compareAt: product.price, discountPercent: Math.round((1 - best / product.price) * 100) };
  }
  if (product.oldPrice && product.oldPrice > product.price) {
    return {
      price: product.price,
      compareAt: product.oldPrice,
      discountPercent: Math.round((1 - product.price / product.oldPrice) * 100),
    };
  }
  return { price: product.price, compareAt: null, discountPercent: null };
}
