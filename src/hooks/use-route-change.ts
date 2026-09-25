"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";

/** Calls `cb` when the route changes — not on mount (sheets mount already open). */
export function useRouteChange(cb: () => void) {
  const pathname = usePathname();
  const first = useRef(pathname);
  const fn = useRef(cb);
  useEffect(() => {
    fn.current = cb;
  });
  useEffect(() => {
    if (first.current === pathname) return;
    first.current = pathname;
    fn.current();
  }, [pathname]);
}
