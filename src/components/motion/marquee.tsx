"use client";
import { Fragment } from "react";
import { ScrollVelocity } from "@/components/bits/scroll-velocity";

/** Running line of brand phrases on ink, separated by ✦ (the only glyph-ornament allowed). */
export function Marquee({ phrases }: { phrases: string[] }) {
  return (
    <section aria-label="Jadeeed" className="bg-ink py-5 text-white md:py-7">
      <p className="sr-only">{phrases.join(" · ")}</p>
      <ScrollVelocity baseVelocity={48} itemClassName="phrase text-heading-lg md:text-display">
        {phrases.map((p, i) => (
          <Fragment key={i}>
            <span className="px-6 md:px-10">{p}</span>
            <span className="text-on-ink-muted text-heading" aria-hidden>
              ✦
            </span>
          </Fragment>
        ))}
      </ScrollVelocity>
    </section>
  );
}
