"use client";
import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { ProductImage } from "./product-image";
import { useFinePointer } from "@/hooks/use-media";
import { DUR, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/cn";

/**
 * Phone/tablet: swipeable Embla gallery with a counter.
 * Desktop: thumbnails + main photo with crossfade, zoom follows the cursor.
 */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const t = useTranslations("product");
  const [index, setIndex] = useState(0);
  const [emblaRef, embla] = useEmblaCarousel({ loop: false });
  const fine = useFinePointer();
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  // images change when the colour changes → back to the first photo
  const key = images.join("|");
  const [prevKey, setPrevKey] = useState(key);
  if (prevKey !== key) {
    setPrevKey(key);
    setIndex(0);
  }
  useEffect(() => {
    embla?.scrollTo(0, true);
  }, [key, embla]);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setIndex(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla]);

  const label = (i: number) => (i === 0 ? t("front") : i === 1 ? t("back") : t("photo", { n: i + 1 }));

  return (
    <div className="lg:grid lg:grid-cols-[88px_1fr] lg:gap-4">
      {/* thumbnails (desktop) */}
      <div className="hidden flex-col gap-3 lg:flex">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={label(i)}
            aria-current={i === index}
            className={cn(
              "relative aspect-4/5 overflow-hidden rounded bg-paper-2 transition-opacity duration-[var(--dur-hover)]",
              i === index ? "opacity-100 outline outline-1 outline-ink" : "opacity-60 hover:opacity-100",
            )}
          >
            <ProductImage src={src} alt="" sizes="88px" />
          </button>
        ))}
      </div>

      {/* desktop main photo */}
      <div
        data-fly-source
        className="relative hidden aspect-4/5 cursor-zoom-in overflow-hidden rounded bg-paper-2 lg:block"
        onMouseMove={(e) => {
          if (!fine) return;
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={images[index]}
            className="absolute inset-0"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: DUR.in, ease: EASE_OUT }}
          >
            <div
              className="absolute inset-0 transition-transform duration-[var(--dur-hover)] ease-out"
              style={{
                transform: zoom ? "scale(2)" : "scale(1)",
                transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : "50% 50%",
              }}
            >
              <ProductImage src={images[index]} alt={`${alt} — ${label(index)}`} sizes="(min-width: 1024px) 50vw, 100vw" priority={index === 0} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* phone / tablet swipe */}
      <div className="relative -mx-gutter lg:hidden" data-fly-source>
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex touch-pan-y">
            {images.map((src, i) => (
              <div key={src} className="relative aspect-4/5 w-full shrink-0 bg-paper-2">
                <ProductImage src={src} alt={`${alt} — ${label(i)}`} sizes="100vw" priority={i === 0} />
              </div>
            ))}
          </div>
        </div>
        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden>
            {images.map((src, i) => (
              <span key={src} className="relative h-0.5 w-6 overflow-hidden rounded-pill bg-ink/20">
                <motion.span
                  className="absolute inset-0 origin-left bg-ink"
                  initial={false}
                  animate={{ scaleX: i === index ? 1 : 0 }}
                  transition={{ duration: DUR.in, ease: EASE_OUT }}
                />
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
