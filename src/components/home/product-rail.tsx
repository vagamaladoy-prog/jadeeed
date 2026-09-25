"use client";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/product/product-card";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import type { ProductCardDTO } from "@/lib/types";
import { cn } from "@/lib/cn";

/** Horizontal, swipeable ribbon of products (Embla). Arrows on desktop only. */
export function ProductRail({ products, badgePhrase }: { products: ProductCardDTO[]; badgePhrase: string }) {
  const t = useTranslations("nav");
  const [ref, api] = useEmblaCarousel({ align: "start", dragFree: true, containScroll: "trimSnaps" });
  const [edges, setEdges] = useState({ prev: false, next: true });

  const update = useCallback(() => {
    if (!api) return;
    setEdges({ prev: api.canScrollPrev(), next: api.canScrollNext() });
  }, [api]);
  useEffect(() => {
    if (!api) return;
    const raf = requestAnimationFrame(update);
    api.on("select", update).on("reInit", update).on("scroll", update);
    return () => {
      cancelAnimationFrame(raf);
      api.off("select", update).off("reInit", update).off("scroll", update);
    };
  }, [api, update]);

  return (
    <div className="relative">
      <div ref={ref} className="overflow-hidden px-gutter lg:px-0" data-lenis-prevent-touch>
        <Stagger className="flex touch-pan-y gap-3 md:gap-5">
          {products.map((p, i) => (
            <StaggerItem key={p.id} className="w-[64%] shrink-0 sm:w-[42%] md:w-[31%] lg:w-[23.5%]">
              <ProductCard product={p} badgePhrase={badgePhrase} priority={i < 2} sizes="(min-width: 1024px) 24vw, (min-width: 768px) 31vw, 64vw" />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
      <div className="mt-6 hidden justify-end gap-2 lg:flex">
        {(["prev", "next"] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => (d === "prev" ? api?.scrollPrev() : api?.scrollNext())}
            disabled={!edges[d]}
            aria-label={t(d)}
            className={cn(
              "grid size-12 place-items-center rounded-pill border border-ink transition-colors duration-[var(--dur-hover)] hover:bg-ink hover:text-white disabled:border-line disabled:text-muted disabled:hover:bg-transparent",
            )}
          >
            {d === "prev" ? <ArrowLeft className="size-5" /> : <ArrowRight className="size-5" />}
          </button>
        ))}
      </div>
    </div>
  );
}
