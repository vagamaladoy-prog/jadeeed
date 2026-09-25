import { cn } from "@/lib/cn";
import { LOGO_SIZE } from "./logo-size";

/**
 * The original Jadeeed mark (assets/brand/logo-source.png), cut out pixel-for-pixel —
 * never redrawn. `tone="dark"` = for dark backgrounds (portrait kept as is, white contour).
 */
export function Logo({
  tone = "light",
  height = 40,
  withWordmark = true,
  className,
  priority,
}: {
  tone?: "light" | "dark";
  height?: number;
  withWordmark?: boolean;
  className?: string;
  priority?: boolean;
}) {
  const width = Math.round((LOGO_SIZE.width / LOGO_SIZE.height) * height);
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny pre-optimised PNG, exact pixels */}
      <img
        src={tone === "dark" ? "/brand/logo-dark.png" : "/brand/logo-light.png"}
        width={width}
        height={height}
        alt={withWordmark ? "" : "Jadeeed"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className="block shrink-0"
        style={{ width, height }}
      />
      {withWordmark && (
        <span className={cn("font-display text-subheading font-light tracking-tight", tone === "dark" ? "text-white" : "text-ink")}>
          Jadeeed
        </span>
      )}
    </span>
  );
}
