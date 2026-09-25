"use client";
// Adapted from React Bits — Magnet (reactbits.dev, github.com/DavidHDev/react-bits).
// Changes: disabled on touch devices and under prefers-reduced-motion; timings from tokens.
import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { useFinePointer } from "@/hooks/use-media";
import { cn } from "@/lib/cn";

interface MagnetProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: number;
  magnetStrength?: number;
  innerClassName?: string;
}

export function Magnet({ children, padding = 60, magnetStrength = 4, className, innerClassName, ...props }: MagnetProps) {
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const disabled = !fine || !!reduce;

  useEffect(() => {
    if (disabled) return;
    const onMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const { left, top, width, height } = ref.current.getBoundingClientRect();
      const cx = left + width / 2;
      const cy = top + height / 2;
      if (Math.abs(cx - e.clientX) < width / 2 + padding && Math.abs(cy - e.clientY) < height / 2 + padding) {
        setActive(true);
        setPos({ x: (e.clientX - cx) / magnetStrength, y: (e.clientY - cy) / magnetStrength });
      } else {
        setActive(false);
        setPos({ x: 0, y: 0 });
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [padding, disabled, magnetStrength]);

  const p = disabled ? { x: 0, y: 0 } : pos;
  return (
    <div ref={ref} className={cn("relative inline-block", className)} {...props}>
      <div
        className={innerClassName}
        style={{
          transform: `translate3d(${p.x}px, ${p.y}px, 0)`,
          transition: active ? "transform 300ms var(--ease-out)" : "transform 500ms var(--ease-out)",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Alias used across the codebase (<Magnetic>). */
export const Magnetic = Magnet;
