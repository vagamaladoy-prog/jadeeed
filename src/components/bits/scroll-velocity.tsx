"use client";
// Adapted from React Bits — ScrollVelocity (reactbits.dev, github.com/DavidHDev/react-bits).
// Changes: single row, hoisted inner component, Jadeeed tokens instead of default styles,
// pauses off-screen, static under prefers-reduced-motion.
import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { cn } from "@/lib/cn";

function useElementWidth<T extends HTMLElement>(ref: RefObject<T | null>): number {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const update = () => ref.current && setWidth(ref.current.offsetWidth);
    update();
    const ro = new ResizeObserver(update);
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

function wrap(min: number, max: number, v: number) {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
}

type Props = {
  children: ReactNode;
  /** px per second; negative = moves right */
  baseVelocity?: number;
  numCopies?: number;
  className?: string;
  itemClassName?: string;
};

export function ScrollVelocity({ children, baseVelocity = 40, numCopies = 4, className, itemClassName }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root);
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 3], { clamp: false });

  const copyRef = useRef<HTMLSpanElement>(null);
  const copyWidth = useElementWidth(copyRef);
  const x = useTransform(baseX, (v) => (copyWidth === 0 ? "0px" : `${wrap(-copyWidth, 0, v)}px`));

  const direction = useRef(1);
  useAnimationFrame((_, delta) => {
    if (!inView || reduce) return;
    let moveBy = direction.current * -baseVelocity * (delta / 1000);
    const f = velocityFactor.get();
    if (f < 0) direction.current = -1;
    else if (f > 0) direction.current = 1;
    moveBy += direction.current * moveBy * f;
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div ref={root} className={cn("relative overflow-hidden", className)}>
      <motion.div className="flex whitespace-nowrap will-change-transform" style={{ x }}>
        {Array.from({ length: numCopies }, (_, i) => (
          <span key={i} ref={i === 0 ? copyRef : null} aria-hidden={i > 0} className={cn("flex shrink-0 items-center", itemClassName)}>
            {children}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
