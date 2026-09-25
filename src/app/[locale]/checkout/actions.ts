"use server";
import { revalidatePath } from "next/cache";
import { placeOrder, type OrderInput, type PlaceOrderResult } from "@/lib/orders";
import { db } from "@/lib/db";
import { getLivePromos } from "@/lib/data";
import { resolvePrice } from "@/lib/pricing";
import { SIZES, type SizeCode } from "@/lib/types";

export async function placeOrderAction(input: OrderInput): Promise<PlaceOrderResult> {
  const res = await placeOrder(input);
  if (res.ok) revalidatePath("/", "layout"); // stock changed
  return res;
}

export type FreshLine = {
  key: string;
  price: number;
  compareAt: number | null;
  maxQty: number;
  sizes: { size: SizeCode; qty: number }[];
} | { key: string; gone: true };

/** Re-reads prices and stock for the cart (prices/stock may have changed since it was filled). */
export async function refreshCart(lines: { key: string; productId: string; colorId: string; size: SizeCode }[]): Promise<FreshLine[]> {
  const safe = lines.slice(0, 50).filter((l) => (SIZES as readonly string[]).includes(l.size));
  if (!safe.length) return [];
  const [products, promos] = await Promise.all([
    db.product.findMany({
      where: { id: { in: [...new Set(safe.map((l) => l.productId))] }, isHidden: false },
      include: { colors: { include: { stock: true } } },
    }),
    getLivePromos(),
  ]);
  return safe.map((l) => {
    const p = products.find((x) => x.id === l.productId);
    const c = p?.colors.find((x) => x.id === l.colorId);
    if (!p || !c) return { key: l.key, gone: true as const };
    const pricing = resolvePrice(p, promos);
    const sizes = c.stock
      .map((s) => ({ size: s.size as SizeCode, qty: s.quantity }))
      .sort((a, b) => SIZES.indexOf(a.size) - SIZES.indexOf(b.size));
    return {
      key: l.key,
      price: pricing.price,
      compareAt: pricing.compareAt,
      maxQty: sizes.find((s) => s.size === l.size)?.qty ?? 0,
      sizes,
    };
  });
}
