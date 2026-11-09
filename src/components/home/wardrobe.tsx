"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, useVelocity, type MotionValue } from "motion/react";
import { useRouter } from "@/i18n/navigation";
import { useMedia } from "@/hooks/use-media";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/cn";
import type { WardrobeShot } from "./wardrobe-shots";

// cut-out shots (scripts/process-wardrobe.mjs) are trimmed to the same height;
// side shots face left (chest on the left), so the turn brings the left edge towards you
export type WardrobeItem = {
  slug: string;
  name: string;
  front: WardrobeShot;
  side: WardrobeShot;
};

const HOOK = 34; // rail → hanger shoulders
const TURN_S = 0.55; // quick, but eased — the shirt never snaps
const SLIDE_S = 0.6; // neighbours making room
const MAX_BLUR = 3; // px, at full speed

/**
 * A clothes rail with shirts hanging sideways, like in a real shop.
 * 1st tap: the shirt turns to face you (two photos — side, then front — on a rotateY "card" turn);
 * 2nd tap on the facing shirt: opens its product page. Tap elsewhere / Esc: it turns back.
 * Neighbours slide apart with transforms only (no layout animation), motion-blurred while moving.
 */
export function Wardrobe({
  items,
  turnLabel,
  openLabel,
  prevLabel,
  nextLabel,
}: {
  items: WardrobeItem[];
  turnLabel: string;
  openLabel: string;
  prevLabel: string;
  nextLabel: string;
}) {
  const router = useRouter();
  const md = useMedia("(min-width: 768px)");
  const reduce = useReducedMotion();
  const [active, setActive] = useState<number | null>(null);
  const rackRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const H = md ? 300 : 200; // shirt height
  // the rail is laid out for the widest shots
  const frontW = Math.round(H * Math.max(...items.map((it) => it.front.ratio)));
  const sideW = Math.round(H * Math.max(...items.map((it) => it.side.ratio)));
  const gap = md ? 14 : 8; // packed close, like on a real rail
  const step = sideW + gap; // distance between hangers when sideways
  const extra = Math.max(0, frontW - step + gap); // extra room the facing shirt needs
  const pad = Math.round(sideW / 2) + (md ? 16 : 8); // rail end → first hanger (plus extra / 2)
  const rackW = items.length * step + extra + pad * 2;

  // more shirts than fit → the rail scrolls (swipe / trackpad; arrows on bigger screens)
  const [edges, setEdges] = useState({ prev: false, next: false });
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () =>
      setEdges({
        prev: el.scrollLeft > 4,
        next: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [rackW]);
  const page = (dir: 1 | -1) => {
    const el = scrollRef.current;
    el?.scrollBy({
      left: dir * el.clientWidth * 0.8,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  // tap outside / Esc → turn back
  useEffect(() => {
    if (active === null) return;
    const onDown = (e: PointerEvent) => {
      if (!rackRef.current?.contains(e.target as Node)) setActive(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [active]);

  // bring the facing shirt to the middle of the visible rail
  useEffect(() => {
    const el = scrollRef.current;
    const rack = rackRef.current;
    if (!el || !rack || active === null) return;
    const target = rack.offsetLeft + pad + extra / 2 + active * step + step / 2 - el.clientWidth / 2;
    el.scrollTo({
      left: Math.max(0, target),
      behavior: reduce ? "auto" : "smooth",
    });
  }, [active, pad, extra, step, reduce]);

  const arrow =
    "absolute top-1/2 z-[200] hidden size-11 -translate-y-1/2 place-items-center rounded-pill border border-line bg-paper/90 text-ink shadow-sm backdrop-blur transition-opacity duration-[var(--dur-hover)] hover:bg-white md:grid";

  return (
    <div className="relative">
      <div ref={scrollRef} className="no-scrollbar overflow-x-auto overscroll-x-contain">
        <div className="flex w-max min-w-full justify-center px-8 md:px-16">
          <div ref={rackRef} className="relative shrink-0" style={{ width: rackW, height: HOOK + H + (md ? 64 : 44) }}>
            {/* the stand: two posts, a chrome rail and feet */}
            <div aria-hidden className="absolute inset-x-2 top-0 h-full">
              <span className="wardrobe-metal-v absolute left-0 top-0 h-full w-1.5 rounded-pill" />
              <span className="wardrobe-metal-v absolute right-0 top-0 h-full w-1.5 rounded-pill" />
              <span className="wardrobe-metal absolute inset-x-0 top-1 h-1.5 rounded-pill shadow-[0_3px_6px_rgb(11_11_12/0.18)]" />
              <span className="wardrobe-metal absolute -left-5 bottom-0 h-1.5 w-12 rounded-pill" />
              <span className="wardrobe-metal absolute -right-5 bottom-0 h-1.5 w-12 rounded-pill" />
              {/* floor shadow under the shirts */}
              <span className="absolute inset-x-[8%] bottom-1 h-6 rounded-[50%] bg-ink/10 blur-xl" />
            </div>

            {items.map((item, i) => {
              const base = pad + extra / 2 + i * step + step / 2;
              const shift = active === null || i === active ? 0 : i < active ? -extra / 2 : extra / 2;
              return (
                <Slot key={i} left={base} shift={shift} zIndex={i === active ? 100 : 10 + i} reduce={!!reduce}>
                  <Shirt
                    item={item}
                    index={i}
                    facing={i === active}
                    H={H}
                    frontW={Math.round(H * item.front.ratio)}
                    sideW={Math.round(H * item.side.ratio)}
                    reduce={!!reduce}
                    label={i === active ? `${item.name} — ${openLabel}` : `${item.name} — ${turnLabel}`}
                    onPress={() => (i === active ? router.push(`/product/${item.slug}`) : setActive(i))}
                  />
                </Slot>
              );
            })}
          </div>
        </div>
      </div>

      {/* edge fades hint that the rail continues */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-[150] w-10 bg-linear-to-r from-paper to-transparent transition-opacity duration-[var(--dur-hover)] md:w-24"
        style={{ opacity: edges.prev ? 1 : 0 }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-[150] w-10 bg-linear-to-l from-paper to-transparent transition-opacity duration-[var(--dur-hover)] md:w-24"
        style={{ opacity: edges.next ? 1 : 0 }}
      />
      <button
        type="button"
        onClick={() => page(-1)}
        aria-label={prevLabel}
        tabIndex={edges.prev ? 0 : -1}
        className={cn(arrow, "left-(--gutter)", !edges.prev && "pointer-events-none opacity-0")}
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        onClick={() => page(1)}
        aria-label={nextLabel}
        tabIndex={edges.next ? 0 : -1}
        className={cn(arrow, "right-(--gutter)", !edges.next && "pointer-events-none opacity-0")}
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}

/** A hanger's place on the rail: slides to make room, motion-blurred by its own speed. */
function Slot({
  left,
  shift,
  zIndex,
  reduce,
  children,
}: {
  left: number;
  shift: number;
  zIndex: number;
  reduce: boolean;
  children: ReactNode;
}) {
  const x = useMotionValue(shift);
  useEffect(() => {
    const c = animate(x, shift, { duration: reduce ? 0 : SLIDE_S, ease: EASE_OUT });
    return () => c.stop();
  }, [shift, reduce, x]);
  const speed = useVelocity(x); // px/s
  const filter = useTransform(speed, (v) => {
    const blur = Math.min(Math.abs(v) / 300, MAX_BLUR);
    return blur < 0.2 ? "none" : `blur(${blur.toFixed(1)}px)`;
  });
  return (
    <motion.div className="absolute top-2" style={{ left, zIndex, x, filter }}>
      {children}
    </motion.div>
  );
}

/**
 * Wooden hanger, drawn front-on. Sideways it's seen edge-on (a thin strip of wood);
 * it opens up together with the front photo, so it's never wider than what the shirt shows.
 */
function Hanger({ turn, width, top }: { turn: MotionValue<number>; width: number; top: number }) {
  const id = "hg" + useId().replace(/[^\w-]/g, "");
  const thin = Math.min(1, 6 / width);
  const scaleX = useTransform(turn, (t) => (t <= 0.5 ? thin : Math.max(thin, Math.sin((t - 0.5) * Math.PI))));
  return (
    <span aria-hidden className="absolute left-1/2 block" style={{ top, width, marginLeft: -width / 2 }}>
      <motion.svg
        viewBox="0 0 200 44"
        width={width}
        height={Math.round(width * 0.22)}
        className="block overflow-visible"
        style={{ scaleX }}
      >
        <defs>
          <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a8733f" />
            <stop offset="0.55" stopColor="#7d4f2a" />
            <stop offset="1" stopColor="#5a371c" />
          </linearGradient>
          <linearGradient id={`${id}m`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#62676d" />
            <stop offset="0.5" stopColor="#d3d6da" />
            <stop offset="1" stopColor="#62676d" />
          </linearGradient>
        </defs>
        {/* shoulders */}
        <path
          d="M100 7 C70 9 30 20 6 31 Q1 34 4 38 Q8 41 13 39 C36 30 72 18 100 17 C128 18 164 30 187 39 Q192 41 196 38 Q199 34 194 31 C170 20 130 9 100 7 Z"
          fill={`url(#${id}w)`}
          stroke="#4a2c15"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
        {/* grain highlight along the top edge */}
        <path d="M12 32 C38 21 72 11 100 9.5 C128 11 162 21 188 32" fill="none" stroke="#d5a271" strokeWidth="1" opacity="0.55" />
        {/* neck block + steel ferrule where the hook goes in */}
        <path d="M93 3 h14 q2 0 2 2 v12 h-18 v-12 q0-2 2-2 Z" fill={`url(#${id}w)`} stroke="#4a2c15" strokeWidth="0.8" />
        <rect x="96" y="0" width="8" height="4" rx="1" fill={`url(#${id}m)`} />
      </motion.svg>
    </span>
  );
}

function Shirt({
  item,
  index,
  facing,
  H,
  frontW,
  sideW,
  reduce,
  label,
  onPress,
}: {
  item: WardrobeItem;
  index: number;
  facing: boolean;
  H: number;
  frontW: number;
  sideW: number;
  reduce: boolean;
  label: string;
  onPress: () => void;
}) {
  // 0 = sideways, 1 = facing; side photo turns 0 → 90°, then the front photo comes in from -90° → 0
  const turn = useMotionValue(facing ? 1 : 0);
  useEffect(() => {
    const c = animate(turn, facing ? 1 : 0, {
      duration: reduce ? 0 : TURN_S,
      ease: [0.45, 0, 0.2, 1],
    });
    return () => c.stop();
  }, [facing, reduce, turn]);

  const sideRot = useTransform(turn, [0, 0.5], [0, 90]);
  const frontRot = useTransform(turn, [0.5, 1], [-90, 0]);
  const sideOp = useTransform(turn, [0.49, 0.5], [1, 0]);
  const frontOp = useTransform(turn, [0.5, 0.51], [0, 1]);
  const lift = useTransform(turn, [0, 0.5, 1], [1, 1.03, 1.05]);
  // blurred while it spins, sharpest at rest (edge-on at 0.5, where the photos swap)
  const spinBlur = useTransform(turn, [0, 0.15, 0.5, 0.85, 1], [0, 1.2, 2.5, 1.2, 0], { clamp: true });
  const filter = useTransform(spinBlur, (b) => (b < 0.2 ? "none" : `blur(${b.toFixed(1)}px)`));

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={label}
      aria-pressed={facing}
      className="group absolute -translate-x-1/2 cursor-pointer rounded-sm outline-offset-4"
      style={{ width: facing ? frontW : sideW, height: HOOK + H }}
    >
      {/* sway on its hook; stops while facing */}
      <span
        className="wardrobe-sway absolute inset-0 block origin-top"
        style={{
          animationDelay: `${-index * 0.7}s`,
          animationPlayState: facing ? "paused" : undefined,
        }}
      >
        {/* grey steel hook; its stem runs down into the wooden neck */}
        <svg aria-hidden width="20" height={HOOK} viewBox={`0 0 20 ${HOOK}`} className="absolute left-1/2 top-0 -translate-x-1/2">
          <path d={`M10 ${HOOK - 4} V10 a5 5 0 1 0 -5 -5`} fill="none" stroke="#6f747b" strokeWidth="2.2" strokeLinecap="round" />
          <path d={`M9.4 ${HOOK - 4} V10 a4.4 4.4 0 1 0 -4.4 -4.4`} fill="none" stroke="#c9cdd2" strokeWidth="0.7" strokeLinecap="round" />
        </svg>
        <motion.span style={{ scale: lift, filter }} className="absolute inset-x-0 block origin-top">
          {/* wooden hanger behind the shirt: narrower than the garment, so it never sticks out or cuts it */}
          <Hanger turn={turn} width={Math.round(frontW * 0.7)} top={HOOK - 11} />
          <span
            className="absolute left-1/2 block -translate-x-1/2 [perspective:1100px]"
            style={{ top: HOOK - 6, width: frontW, height: H }}
          >
            <motion.img
              src={item.side.src}
              alt=""
              draggable={false}
              decoding="async"
              loading="lazy"
              style={{
                rotateY: sideRot,
                opacity: sideOp,
                width: sideW,
                height: H,
              }}
              className="absolute left-1/2 top-0 max-w-none -translate-x-1/2 drop-shadow-[0_10px_14px_rgb(11_11_12/0.18)] transition-[filter] duration-[var(--dur-hover)] can-hover:group-hover:brightness-[1.04]"
            />
            <motion.img
              src={item.front.src}
              alt=""
              draggable={false}
              decoding="async"
              loading="lazy"
              style={{
                rotateY: frontRot,
                opacity: frontOp,
                width: frontW,
                height: H,
              }}
              className="absolute left-1/2 top-0 max-w-none -translate-x-1/2 drop-shadow-[0_14px_20px_rgb(11_11_12/0.2)]"
            />
          </span>
        </motion.span>
      </span>
    </button>
  );
}
