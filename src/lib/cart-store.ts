"use client";
// Tiny cart store (localStorage + useSyncExternalStore). No accounts — the cart lives on the device.
import { useSyncExternalStore } from "react";
import type { L10n, SizeCode } from "./types";

export type CartItem = {
  key: string; // productId:colorId:size
  productId: string;
  slug: string;
  colorId: string;
  size: SizeCode;
  qty: number;
  name: L10n;
  colorName: L10n;
  image: string | null;
  price: number;
  compareAt: number | null;
  /** stock for this size when added — caps the quantity stepper */
  maxQty: number;
  /** other sizes of the same colour with their stock, for changing size in the cart */
  sizes: { size: SizeCode; qty: number }[];
};

const KEY = "jadeeed-cart-v1";
let items: CartItem[] = [];
let loaded = false;
const listeners = new Set<() => void>();
const EMPTY: CartItem[] = [];

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    items = raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    items = [];
  }
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    try {
      items = e.newValue ? JSON.parse(e.newValue) : [];
    } catch {
      items = [];
    }
    emit();
  });
}

function emit() {
  listeners.forEach((l) => l());
}

function commit(next: CartItem[]) {
  items = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* private mode — cart still works for this tab */
  }
  emit();
}

export const cartKey = (productId: string, colorId: string, size: string) => `${productId}:${colorId}:${size}`;

export const cart = {
  get: () => {
    load();
    return items;
  },
  subscribe(l: () => void) {
    load();
    listeners.add(l);
    return () => listeners.delete(l);
  },
  add(item: Omit<CartItem, "key" | "qty">, qty = 1) {
    const key = cartKey(item.productId, item.colorId, item.size);
    const existing = items.find((i) => i.key === key);
    if (existing) {
      commit(items.map((i) => (i.key === key ? { ...i, ...item, qty: Math.min(i.qty + qty, item.maxQty) } : i)));
    } else {
      commit([...items, { ...item, key, qty: Math.min(qty, item.maxQty) }]);
    }
  },
  setQty(key: string, qty: number) {
    commit(items.flatMap((i) => (i.key !== key ? [i] : qty <= 0 ? [] : [{ ...i, qty: Math.min(qty, i.maxQty) }])));
  },
  changeSize(key: string, size: SizeCode) {
    const item = items.find((i) => i.key === key);
    if (!item) return;
    const newKey = cartKey(item.productId, item.colorId, size);
    const maxQty = item.sizes.find((s) => s.size === size)?.qty ?? 0;
    if (maxQty <= 0) return;
    const other = items.find((i) => i.key === newKey);
    const merged = { ...item, key: newKey, size, maxQty, qty: Math.min(item.qty + (other?.qty ?? 0), maxQty) };
    commit(items.filter((i) => i.key !== newKey).map((i) => (i.key === key ? merged : i)));
  },
  remove(key: string) {
    commit(items.filter((i) => i.key !== key));
  },
  /** replace server-validated fields (price / stock) after a refresh */
  sync(fresh: Map<string, Partial<CartItem> | null>) {
    commit(
      items.flatMap((i) => {
        if (!fresh.has(i.key)) return [i];
        const f = fresh.get(i.key);
        if (f === null) return [{ ...i, maxQty: 0 }];
        const next = { ...i, ...f } as CartItem;
        return [{ ...next, qty: Math.max(1, Math.min(next.qty, next.maxQty || next.qty)) }];
      }),
    );
  },
  clear() {
    commit([]);
  },
};

export function useCart() {
  return useSyncExternalStore(cart.subscribe, cart.get, () => EMPTY);
}

export function useCartCount() {
  const list = useCart();
  return list.reduce((s, i) => s + i.qty, 0);
}

// ─── UI state: drawer + "added" pulse ───────────────────────────────────────
type UiState = { open: boolean; pulse: number };
let ui: UiState = { open: false, pulse: 0 };
const uiListeners = new Set<() => void>();
const setUi = (patch: Partial<UiState>) => {
  ui = { ...ui, ...patch };
  uiListeners.forEach((l) => l());
};
export const cartUi = {
  open: () => setUi({ open: true }),
  close: () => setUi({ open: false }),
  set: (open: boolean) => setUi({ open }),
  pulse: () => setUi({ pulse: ui.pulse + 1 }),
};
const SERVER_UI: UiState = { open: false, pulse: 0 };
export function useCartUi() {
  return useSyncExternalStore(
    (l) => {
      uiListeners.add(l);
      return () => uiListeners.delete(l);
    },
    () => ui,
    () => SERVER_UI,
  );
}
