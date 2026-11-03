"use client";
import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useRouter } from "@/i18n/navigation";
import { useMedia } from "@/hooks/use-media";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/cn";

export type WardrobeItem = {
  slug: string;
  name: string;
  front: string;
  side: string;
};

// cut-out shots (scripts/process-wardrobe.mjs) are trimmed to the same height; width / height:
const FRONT_RATIO = 851 / 1000;
const SIDE_RATIO = 397 / 1000;
const HOOK = 34; // rail → hanger shoulders
const TURN_S = 0.9;

/**
 * A clothes rail with shirts hanging sideways, like in a real shop.
 * 1st tap: the shirt turns to face you (two photos — side, then front — on a rotateY "card" turn);
 * 2nd tap on the facing shirt: opens its product page. Tap elsewhere / Esc: it turns back.
 * Neighbours slide apart with transforms only (no layout animation).
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
  const frontW = Math.round(H * FRONT_RATIO);
  const sideW = Math.round(H * SIDE_RATIO);
  const gap = md ? 72 : 40;
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
                <motion.div
                  key={i}
                  className="absolute top-2"
                  style={{ left: base, zIndex: i === active ? 100 : 10 + i }}
                  initial={false}
                  animate={{ x: shift }}
                  transition={{
                    duration: reduce ? 0 : TURN_S * 0.8,
                    ease: EASE_OUT,
                  }}
                >
                  <Shirt
                    item={item}
                    index={i}
                    facing={i === active}
                    H={H}
                    frontW={frontW}
                    sideW={sideW}
                    reduce={!!reduce}
                    label={i === active ? `${item.name} — ${openLabel}` : `${item.name} — ${turnLabel}`}
                    onPress={() => (i === active ? router.push(`/product/${item.slug}`) : setActive(i))}
                  />
                </motion.div>
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
  // 0 = sideways, 1 = facing; side photo turns 0 → -90°, then the front photo comes in from 90° → 0
  const turn = useMotionValue(facing ? 1 : 0);
  useEffect(() => {
    const c = animate(turn, facing ? 1 : 0, {
      duration: reduce ? 0 : TURN_S,
      ease: [0.45, 0, 0.2, 1],
    });
    return () => c.stop();
  }, [facing, reduce, turn]);

  const sideRot = useTransform(turn, [0, 0.5], [0, -90]);
  const frontRot = useTransform(turn, [0.5, 1], [90, 0]);
  const sideOp = useTransform(turn, [0.49, 0.5], [1, 0]);
  const frontOp = useTransform(turn, [0.5, 0.51], [0, 1]);
  const hangerX = useTransform(turn, [0, 1], [0.12, 1]);
  const lift = useTransform(turn, [0, 0.5, 1], [1, 1.03, 1.05]);

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
        {/* hook */}
        <svg
          aria-hidden
          width="20"
          height={HOOK}
          viewBox={`0 0 20 ${HOOK}`}
          className="absolute left-1/2 top-0 -translate-x-1/2 text-ink/70"
        >
          <path d={`M10 ${HOOK - 6} V10 a5 5 0 1 0 -5 -5`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <motion.span style={{ scale: lift }} className="absolute inset-x-0 block origin-top">
          <span
            className="absolute left-1/2 block -translate-x-1/2 [perspective:1100px]"
            style={{ top: HOOK - 6, width: frontW, height: H }}
          >
            {/* shoulders of the hanger: seen edge-on when sideways */}
            <motion.svg
              aria-hidden
              viewBox="0 0 100 12"
              preserveAspectRatio="none"
              style={{ scaleX: hangerX, height: H * 0.09 }}
              className="absolute left-[21%] top-0 w-[58%] text-ink/70"
            >
              <path
                d="M50 0.5 L2 11 H98 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </motion.svg>
            <motion.img
              src={item.side}
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
              src={item.front}
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
