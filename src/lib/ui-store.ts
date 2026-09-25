"use client";
import { useSyncExternalStore } from "react";

type UiState = {
  search: boolean;
  contact: boolean;
  /** tone of the banner under the transparent header ("DARK" banner → light header content) */
  bannerTone: "LIGHT" | "DARK" | null;
  /** short brand-phrase toast ("Men o'sha.") */
  toast: { id: number; text: string } | null;
};

let state: UiState = { search: false, contact: false, bannerTone: null, toast: null };
const listeners = new Set<() => void>();
const SERVER: UiState = state;

function set(patch: Partial<UiState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const ui = {
  openSearch: () => set({ search: true }),
  setSearch: (v: boolean) => set({ search: v }),
  openContact: () => set({ contact: true }),
  setContact: (v: boolean) => set({ contact: v }),
  setBannerTone: (t: UiState["bannerTone"]) => state.bannerTone !== t && set({ bannerTone: t }),
  toast(text: string, ms = 1800) {
    clearTimeout(toastTimer);
    set({ toast: { id: Date.now(), text } });
    toastTimer = setTimeout(() => set({ toast: null }), ms);
  },
};

export function useUi<T>(select: (s: UiState) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => select(state),
    () => select(SERVER),
  );
}

// ─── fly-to-cart ─────────────────────────────────────────────────────────────
export type FlyDetail = { src: string; from: DOMRect };
export function flyToCart(detail: FlyDetail) {
  window.dispatchEvent(new CustomEvent<FlyDetail>("jd:fly", { detail }));
}
