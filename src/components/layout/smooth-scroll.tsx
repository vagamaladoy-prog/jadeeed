"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import { useReducedMotion } from "motion/react";
import { useTelegram } from "@/components/telegram/telegram-provider";

/** Lenis smooth scroll — storefront only; off in the Mini App and under reduced motion. */
export function SmoothScroll() {
  const reduce = useReducedMotion();
  const { isMiniApp } = useTelegram();

  useEffect(() => {
    if (reduce || isMiniApp || document.documentElement.dataset.tg) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.12, anchors: true });
    return () => lenis.destroy();
  }, [reduce, isMiniApp]);

  return null;
}
