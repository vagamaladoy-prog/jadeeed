import { Fragment } from "react";

/**
 * Running line of brand phrases on ink, separated by ✦ (the only glyph-ornament allowed).
 * Pure CSS transform loop — runs on the compositor, costs no JS per frame; pauses on hover.
 */
export function Marquee({ phrases }: { phrases: string[] }) {
  // enough items that one row is always wider than the screen (seamless loop even with 1 phrase)
  const items = Array.from({ length: Math.ceil(8 / Math.max(phrases.length, 1)) }, () => phrases).flat();
  const row = (
    <div aria-hidden className="flex shrink-0 items-center">
      {items.map((p, i) => (
        <Fragment key={i}>
          <span className="phrase px-6 text-heading-lg md:px-10 md:text-display">{p}</span>
          <span className="text-heading text-on-ink-muted">✦</span>
        </Fragment>
      ))}
    </div>
  );
  return (
    <section className="group overflow-hidden bg-ink py-5 text-white md:py-7">
      <p className="sr-only">{phrases.join(" · ")}</p>
      <div className="flex w-max animate-marquee whitespace-nowrap will-change-transform group-hover:[animation-play-state:paused]">
        {row}
        {row}
      </div>
    </section>
  );
}
