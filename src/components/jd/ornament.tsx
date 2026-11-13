import type { SVGProps } from "react";

/**
 * Boteh (buta) — the almond teardrop from the "Abdulla Qodiriy" back print, redrawn as a line
 * ornament: curled tail, a spiral of rings in the head, an inner contour following the outline.
 * Strokes use currentColor, so it takes any brand colour.
 */
const BOTEH_OUTER = "M88 6C78 26 66 36 58 41C74 52 70 86 41 90C15 93 6 66 16 50C27 33 52 32 88 6Z";
const BOTEH_INNER = "M75 19C66 32 58 38 50 42C64 50 62 79 41 82C22 84 15 66 22 54C30 41 46 40 75 19Z";

export function Boteh({ title, ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeLinecap="round" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} {...props}>
      {title && <title>{title}</title>}
      <BotehPaths />
    </svg>
  );
}

function BotehPaths() {
  return (
    <>
      <path d={BOTEH_OUTER} strokeWidth={2.6} />
      <path d={BOTEH_INNER} strokeWidth={1.2} />
      <circle cx={40} cy={64} r={13} strokeWidth={1.6} />
      <circle cx={40} cy={64} r={8} strokeWidth={1.4} />
      <circle cx={40} cy={64} r={3.2} strokeWidth={1.4} />
      <circle cx={57} cy={47} r={2.4} strokeWidth={1.1} />
    </>
  );
}

/**
 * The Qodiriy medallion: four botehs guarding the centre, a ring of dots — the back-print
 * ornament without its lettering. Used as the rotating progress mark of the timeline.
 */
export function QodiriyOrnament({ title, children, ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  const dots = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
    return [100 + Math.cos(a) * 34, 100 + Math.sin(a) * 34] as const;
  });
  return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeLinecap="round" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} {...props}>
      {title && <title>{title}</title>}
      {[0, 90, 180, 270].map((r) => (
        // head in a corner, tail sweeping along the side towards the next corner
        <g key={r} transform={`rotate(${r} 100 100) translate(50 50) rotate(50) scale(0.95) translate(-40 -64)`}>
          <BotehPaths />
        </g>
      ))}
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.6} fill="currentColor" stroke="none" />
      ))}
      {children}
    </svg>
  );
}
