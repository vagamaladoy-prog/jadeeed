"use client";
import { motion, useReducedMotion } from "motion/react";
import type { ElementType } from "react";
import { cn } from "@/lib/cn";
import { DUR, EASE_OUT, VIEWPORT } from "@/lib/motion";

type Props = {
  /** brand phrase — rendered exactly as stored, never translated */
  text: string;
  as?: ElementType;
  /** "write": letter by letter, like handwriting (45 ms/char, ≤ 1.2 s) · "reveal": whole line rises */
  animate?: "write" | "reveal" | "none";
  delay?: number;
  className?: string;
};

/**
 * Renders a Jadeeed brand phrase in the accent face. The phrase itself is data from the
 * DB (admin → «Фразы бренда»). Letter animation is adapted from React Bits «BlurText»
 * (animateBy="letters"), limited to opacity + transform per DESIGN.md.
 */
export function BrandPhrase({ text, as: Tag = "p", animate = "reveal", delay = 0, className }: Props) {
  const reduce = useReducedMotion();
  const base = cn("phrase", className);

  if (animate === "none" || reduce) {
    return <Tag className={base}>{text}</Tag>;
  }

  if (animate === "reveal") {
    return (
      <Tag className={base}>
        <motion.span
          className="inline-block"
          initial={{ opacity: 0, y: "0.4em" }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: DUR.in, ease: EASE_OUT, delay }}
        >
          {text}
        </motion.span>
      </Tag>
    );
  }

  const chars = Array.from(text);
  const step = Math.min(0.045, (DUR.scene - DUR.in) / Math.max(chars.length, 1));
  // group letters into words so lines break only between words
  const words: { ch: string; i: number }[][] = [[]];
  chars.forEach((ch, i) => (ch === " " ? words.push([]) : words[words.length - 1].push({ ch, i })));

  return (
    <Tag className={base} aria-label={text}>
      {words.map((w, wi) => (
        <span key={wi}>
          <span aria-hidden className="inline-block whitespace-nowrap">
            {w.map(({ ch, i }) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0, y: "0.35em", rotate: -4 }}
                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: DUR.in, ease: EASE_OUT, delay: delay + i * step }}
              >
                {ch}
              </motion.span>
            ))}
          </span>
          {wi < words.length - 1 && " "}
        </span>
      ))}
    </Tag>
  );
}
