"use client";
import { motion } from "motion/react";
import { DUR, EASE_OUT } from "@/lib/motion";

/** Giant "Jadeeed" across the full width, rising from below when the footer is reached. */
export function FooterWordmark() {
  return (
    <div aria-hidden className="overflow-hidden">
      <motion.p
        initial={{ y: "60%", opacity: 0 }}
        whileInView={{ y: "0%", opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: DUR.scene, ease: EASE_OUT }}
        className="phrase select-none whitespace-nowrap text-center text-wordmark text-white"
      >
        Jadeeed
      </motion.p>
    </div>
  );
}
