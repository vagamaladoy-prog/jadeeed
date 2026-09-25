"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useUi, type FlyDetail } from "@/lib/ui-store";
import { cartUi } from "@/lib/cart-store";
import { EASE_OUT, SPRING } from "@/lib/motion";

/** Short brand-phrase confirmation ("Men o'sha.") above the tab bar. */
export function PhraseToast() {
  const toast = useUi((s) => s.toast);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--tabbar-h)+var(--safe-bottom)+16px)] z-[60] flex justify-center px-gutter lg:bottom-10"
    >
      <AnimatePresence>
        {toast && (
          <motion.p
            key={toast.id}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={SPRING}
            className="phrase rounded-pill bg-ink px-6 py-3 text-heading text-white"
          >
            {toast.text}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

type Flight = FlyDetail & { id: number; to: DOMRect };

/** The t-shirt photo flies into whichever cart icon is visible, then the counter bounces. */
export function FlyLayer() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onFly = (e: Event) => {
      const detail = (e as CustomEvent<FlyDetail>).detail;
      const target = [...document.querySelectorAll<HTMLElement>("[data-cart-target]")].find((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight;
      });
      if (!target || reduce) {
        cartUi.pulse();
        return;
      }
      setFlights((f) => [...f, { ...detail, id: Date.now(), to: target.getBoundingClientRect() }]);
    };
    window.addEventListener("jd:fly", onFly);
    return () => window.removeEventListener("jd:fly", onFly);
  }, [reduce]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70]">
      {flights.map((f) => {
        const size = Math.min(f.from.width, 160);
        const x0 = f.from.left + f.from.width / 2 - size / 2;
        const y0 = f.from.top + f.from.height / 2 - (size * 1.25) / 2;
        const x1 = f.to.left + f.to.width / 2 - size / 2;
        const y1 = f.to.top + f.to.height / 2 - (size * 1.25) / 2;
        return (
          <motion.img
            key={f.id}
            src={f.src}
            alt=""
            className="absolute left-0 top-0 rounded object-cover"
            style={{ width: size, height: size * 1.25 }}
            initial={{ x: x0, y: y0, scale: 1, opacity: 1 }}
            animate={{ x: [x0, (x0 + x1) / 2, x1], y: [y0, Math.min(y0, y1) - 80, y1], scale: 0.12, opacity: [1, 1, 0.6] }}
            transition={{ duration: 0.7, ease: EASE_OUT }}
            onAnimationComplete={() => {
              cartUi.pulse();
              setFlights((all) => all.filter((x) => x.id !== f.id));
            }}
          />
        );
      })}
    </div>
  );
}
