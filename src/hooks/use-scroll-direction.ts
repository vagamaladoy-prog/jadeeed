"use client";
import { useEffect, useState } from "react";

/**
 * "down" after the user scrolls down past `threshold`, "up" as soon as they scroll up.
 * Used by the header, the mobile top strip and the tab bar (Instagram-style hide/show).
 */
export function useScrollDirection(threshold = 64) {
  const [state, setState] = useState<{ dir: "up" | "down"; atTop: boolean }>({ dir: "up", atTop: true });
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      const delta = y - last;
      if (Math.abs(delta) > 6) {
        setState({ dir: delta > 0 && y > threshold ? "down" : "up", atTop: y < 8 });
        last = y;
      } else if (y < 8) {
        setState((s) => (s.atTop ? s : { dir: "up", atTop: true }));
      }
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return state;
}
