"use client";
import { useEffect, useRef, useState } from "react";
import { getImageProps } from "next/image";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useTelegram } from "@/components/telegram/telegram-provider";
import { ui } from "@/lib/ui-store";
import { tr, type BannerDTO } from "@/lib/types";
import { DUR, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/cn";

const INTERVAL = 5500;

/** Art-directed <picture>: 4:5 phone image, 4:3 desktop image, AVIF/WebP via next/image. */
function BannerPicture({ banner, alt, priority }: { banner: BannerDTO; alt: string; priority: boolean }) {
  const common = { alt, fill: true, priority, fetchPriority: priority ? ("high" as const) : undefined };
  const desktop = getImageProps({ ...common, src: banner.imageDesktop, sizes: "100vw" }).props;
  const mobile = getImageProps({ ...common, src: banner.imageMobile ?? banner.imageDesktop, sizes: "100vw" }).props;
  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktop.srcSet} sizes="100vw" />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt is in props (text that is inside the picture) */}
      <img {...mobile} className="absolute inset-0 size-full object-cover object-center" />
    </picture>
  );
}

/**
 * Home banner — one solid picture, edge to edge, from the very top. The site writes nothing
 * over it except the story-style progress bars. All text lives inside the image; the
 * "text on picture" field from the admin goes to alt.
 */
export function BannerCarousel({ banners }: { banners: BannerDTO[] }) {
  const locale = useLocale();
  const reduce = useReducedMotion();
  const { isMiniApp } = useTelegram();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  // parallax: the picture moves slower than the page (off in Mini App / reduced motion)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const parallax = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const parallaxOn = !reduce && !isMiniApp;

  const count = banners.length;
  const current = banners[index];

  useEffect(() => {
    ui.setBannerTone(current?.headerTone ?? null);
  }, [current?.headerTone]);
  useEffect(
    () => () => {
      ui.setBannerTone(null);
    },
    [],
  );

  useEffect(() => {
    if (count < 2 || paused) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % count), INTERVAL);
    return () => clearTimeout(id);
  }, [index, count, paused]);

  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (!current) return null;
  const go = (d: number) => setIndex((i) => (i + d + count) % count);

  const slide = (b: BannerDTO, i: number) => {
    const alt = tr(b.alt, locale);
    const picture = <BannerPicture banner={b} alt={alt} priority={i === 0} />;
    const external = b.link && /^https?:\/\//.test(b.link);
    if (!b.link) return picture;
    return external ? (
      <a href={b.link} className="absolute inset-0 block" target="_blank" rel="noopener noreferrer" aria-label={alt}>
        {picture}
      </a>
    ) : (
      <Link href={b.link} className="absolute inset-0 block" aria-label={alt}>
        {picture}
      </Link>
    );
  };

  return (
    <section
      ref={ref}
      aria-roledescription="carousel"
      aria-label="Jadeeed"
      className="relative mt-(--topbar-h) aspect-4/5 w-full overflow-hidden bg-paper-2 md:aspect-4/3 lg:mt-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        const s = touch.current;
        touch.current = null;
        if (!s || count < 2) return;
        const dx = e.changedTouches[0].clientX - s.x;
        const dy = e.changedTouches[0].clientY - s.y;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) go(dx < 0 ? 1 : -1);
      }}
    >
      <motion.div className="banner-in absolute inset-0 will-change-transform" style={{ y: parallaxOn ? parallax : 0 }}>
        {/* first slide is always in the DOM (LCP); others crossfade over it */}
        <div className="absolute inset-0" inert={index !== 0}>
          {slide(banners[0], 0)}
        </div>
        <AnimatePresence initial={false}>
          {index !== 0 && (
            <motion.div
              key={current.id}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR.scene, ease: EASE_OUT }}
            >
              {slide(current, index)}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* soft reveal on first paint (CSS, starts before hydration) */}
      <div aria-hidden className="banner-veil pointer-events-none absolute inset-0 bg-paper" />

      {count > 1 && (
        <div className="absolute inset-x-0 top-0 z-10 flex gap-1.5 px-gutter pt-2 lg:pt-[calc(var(--header-h)+4px)]" role="tablist">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`${i + 1} / ${count}`}
              onClick={() => setIndex(i)}
              className="group flex h-6 flex-1 items-center"
            >
              <span className={cn("relative block h-0.5 w-full overflow-hidden rounded-pill", current.headerTone === "LIGHT" ? "bg-ink/20" : "bg-white/40")}>
                <span
                  key={i === index ? `${index}-${paused}` : undefined}
                  className={cn("absolute inset-0 origin-left rounded-pill", current.headerTone === "LIGHT" ? "bg-ink" : "bg-white")}
                  style={{
                    transform: i < index ? "scaleX(1)" : "scaleX(0)",
                    animation: i === index ? `story-progress ${INTERVAL}ms linear forwards` : undefined,
                    animationPlayState: paused ? "paused" : "running",
                  }}
                />
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
