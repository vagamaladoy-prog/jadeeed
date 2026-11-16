"use client";
import { useEffect } from "react";

const SEL = ".glass,.glass-dark,.glass-gloss,.glass-press";
const MIN_PRESS = 160; // ms — a quick tap still gets a visible swell before it springs back
const SLOP = 28; // px — how far the finger may slide off the button before the press is cancelled

/**
 * iOS-style press for the glass controls (globals.css "liquid glass"): while the finger is down the
 * glass swells and lights up under it (data-press="on", --gx/--gy follow the finger); sliding away
 * relaxes it (data-press="out") and releasing there cancels the action, like on iPhone. The action
 * itself is the element's own click, which the browser fires on release. With a mouse, the light
 * simply follows the cursor. One set of window listeners for the whole page.
 */
export function GlassPress() {
  useEffect(() => {
    let el: HTMLElement | null = null;
    let since = 0;
    let suppress: HTMLElement | null = null;

    const light = (t: HTMLElement, e: PointerEvent) => {
      const r = t.getBoundingClientRect();
      t.style.setProperty("--gx", `${e.clientX - r.left}px`);
      t.style.setProperty("--gy", `${e.clientY - r.top}px`);
      return r;
    };

    const finish = (t: HTMLElement, wait: number) => {
      window.setTimeout(() => {
        if (el !== t) delete t.dataset.press;
      }, wait);
    };

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const t = (e.target as Element | null)?.closest<HTMLElement>(SEL);
      if (!t || t.matches(":disabled,[aria-disabled='true']")) return;
      if (el && el !== t) delete el.dataset.press;
      el = t;
      since = performance.now();
      const r = light(t, e);
      // bigger controls grow less: ~14px overall, never more than 12%
      t.style.setProperty("--press-scale", String(Math.min(1.12, 1 + 14 / Math.max(r.width, r.height, 1))));
      t.dataset.press = "on";
    };

    const move = (e: PointerEvent) => {
      if (el) {
        const r = light(el, e);
        const away = e.clientX < r.left - SLOP || e.clientX > r.right + SLOP || e.clientY < r.top - SLOP || e.clientY > r.bottom + SLOP;
        el.dataset.press = away ? "out" : "on";
        return;
      }
      if (e.pointerType !== "mouse") return;
      const t = (e.target as Element | null)?.closest<HTMLElement>(SEL);
      if (t) light(t, e);
    };

    const up = () => {
      const t = el;
      if (!t) return;
      if (t.dataset.press === "out") suppress = t;
      el = null;
      finish(t, Math.max(0, MIN_PRESS - (performance.now() - since)));
    };

    const cancel = () => {
      const t = el;
      if (!t) return;
      el = null;
      finish(t, 0);
    };

    // released after sliding away: swallow the click, as iOS does
    const click = (e: MouseEvent) => {
      if (suppress && e.target instanceof Node && suppress.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
      }
      suppress = null;
    };

    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("pointercancel", cancel, { passive: true });
    window.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("click", click, true);
    };
  }, []);

  return null;
}
