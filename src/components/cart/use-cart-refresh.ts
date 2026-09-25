"use client";
import { useEffect, useRef } from "react";
import { cart, useCart } from "@/lib/cart-store";
import { refreshCart } from "@/app/[locale]/checkout/actions";

/** On cart/checkout pages: pull fresh prices + stock once, and mark lines that are gone. */
export function useCartRefresh() {
  const items = useCart();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || items.length === 0) return;
    done.current = true;
    refreshCart(items.map((i) => ({ key: i.key, productId: i.productId, colorId: i.colorId, size: i.size })))
      .then((fresh) => {
        const map = new Map<string, Parameters<typeof cart.sync>[0] extends Map<string, infer V> ? V : never>();
        for (const f of fresh) map.set(f.key, "gone" in f ? null : { price: f.price, compareAt: f.compareAt, maxQty: f.maxQty, sizes: f.sizes });
        cart.sync(map);
      })
      .catch(() => undefined);
  }, [items]);
}
