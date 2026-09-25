"use client";
import { AnimatePresence, motion } from "motion/react";
import { useCartCount, useCartUi } from "@/lib/cart-store";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/cn";

/** Navy counter badge that jumps whenever something is added. */
export function CartCount({ className }: { className?: string }) {
  const count = useCartCount();
  const { pulse } = useCartUi();
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          key={pulse}
          initial={{ scale: pulse ? 0.4 : 1, y: pulse ? -6 : 0 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ ...SPRING, stiffness: 500, damping: 18 }}
          className={cn(
            "pointer-events-none grid h-4.5 min-w-4.5 place-items-center rounded-pill bg-navy px-1 text-micro font-semibold text-white",
            className,
          )}
          aria-hidden
        >
          {count > 99 ? "99+" : count}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
