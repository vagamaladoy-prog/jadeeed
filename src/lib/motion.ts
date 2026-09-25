// Motion tokens — mirror of DESIGN.md §7. Import these instead of inventing values.
import type { Transition } from "motion/react";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const DUR = {
  hover: 0.18,
  in: 0.5,
  scene: 1.1,
} as const;

export const STAGGER = 0.06;

export const SPRING: Transition = { type: "spring", stiffness: 300, damping: 30 };

export const APPEAR: Transition = { duration: DUR.in, ease: EASE_OUT };

export const VIEWPORT = { once: true, amount: 0.2 } as const;

/** mirrors --tabbar-h in tokens.css (for transform math) */
export const TABBAR_H = 60;
