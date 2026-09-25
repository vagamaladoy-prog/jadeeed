"use client";
import { useRef, type CSSProperties } from "react";
import { motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/cn";
import { useFinePointer } from "@/hooks/use-media";
import { ATLAS_TILE } from "./tiles";

type Variant = "dense" | "light" | "loading";

type Props = {
  variant?: Variant;
  /** tile scale: 1 = 480×960 px */
  scale?: number;
  /** vertical "fabric" flow */
  flow?: boolean;
  /** shift ±12px with the cursor (desktop) or with scroll (touch) */
  interactive?: boolean;
  className?: string;
  style?: CSSProperties;
};

const SRC: Record<Variant, string> = {
  dense: "/atlas/dense.svg",
  light: "/atlas/light.svg",
  loading: "/atlas/light.svg",
};

/**
 * Jadeeed atlas (ikat) — see DESIGN.md §6. Absolutely fills its positioned parent.
 * Never place it under body copy that has to be read.
 */
export function AtlasPattern({ variant = "dense", scale = 1, flow = true, interactive = false, className, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "100px" });
  const reduce = useReducedMotion();
  const fine = useFinePointer();

  const w = Math.round(ATLAS_TILE.width * scale);
  const h = Math.round(ATLAS_TILE.height * scale);

  // cursor parallax (desktop)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  // scroll parallax (touch)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scrollY = useTransform(scrollYProgress, [0, 1], [-12, 12]);

  const cursorOn = interactive && fine && !reduce;
  const scrollOn = interactive && !fine && !reduce;

  const opacity = variant === "light" ? 0.06 : variant === "loading" ? 0.14 : 1;

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={style}
      onPointerMove={
        cursorOn
          ? (e) => {
              const r = e.currentTarget.getBoundingClientRect();
              mx.set(((e.clientX - r.left) / r.width - 0.5) * 24);
              my.set(((e.clientY - r.top) / r.height - 0.5) * 24);
            }
          : undefined
      }
    >
      <motion.div
        className="absolute -inset-4"
        style={{ x: cursorOn ? sx : 0, y: cursorOn ? sy : scrollOn ? scrollY : 0, opacity }}
      >
        <div
          className={cn("absolute inset-x-0 top-0 will-change-transform", flow && "animate-atlas-flow")}
          style={
            {
              height: `calc(100% + ${h}px)`,
              backgroundImage: `url(${SRC[variant]})`,
              backgroundSize: `${w}px ${h}px`,
              backgroundRepeat: "repeat",
              "--atlas-tile-h": `${h}px`,
              animationPlayState: inView ? "running" : "paused",
            } as CSSProperties
          }
        />
      </motion.div>
    </div>
  );
}

/** 12px atlas divider between large sections. `stitch` = sews itself left→right once in view. */
export function AtlasStrip({ className, stitch = true }: { className?: string; stitch?: boolean }) {
  return (
    <motion.div
      aria-hidden
      role="presentation"
      className={cn("h-3 w-full origin-left", className)}
      style={{ backgroundImage: "url(/atlas/strip.svg)", backgroundSize: `${ATLAS_TILE.width}px ${ATLAS_TILE.stripHeight}px`, backgroundRepeat: "repeat-x" }}
      initial={stitch ? { scaleX: 0 } : false}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}
