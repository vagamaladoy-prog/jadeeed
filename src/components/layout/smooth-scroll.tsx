"use client";
import { useEffect } from "react";
import { useReducedMotion } from "motion/react";
import { useTelegram } from "@/components/telegram/telegram-provider";

/**
 * Lenis smooth scroll — storefront only; off in the Mini App and under reduced motion.
 * Created on the first mouse-wheel event: touch devices never need it (native scroll),
 * and page load stays free of its per-frame loop.
 */
export function SmoothScroll() {
  const reduce = useReducedMotion();
  const { isMiniApp } = useTelegram();

  useEffect(() => {
    if (reduce || isMiniApp || document.documentElement.dataset.tg) return;
    let lenis: { destroy(): void } | null = null;
    let cancelled = false;
    const start = async () => {
      const { default: Lenis } = await import("lenis");
      if (cancelled) return;
      lenis = new Lenis({ autoRaf: true, lerp: 0.12, anchors: true });
    };
    window.addEventListener("wheel", start, { once: true, passive: true });
    return () => {
      cancelled = true;
      window.removeEventListener("wheel", start);
      lenis?.destroy();
    };
  }, [reduce, isMiniApp]);

  return null;
}
