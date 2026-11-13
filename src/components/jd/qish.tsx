"use client";
import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Sheet } from "@/components/ui/sheet";
import { Reveal } from "@/components/motion/reveal";
import { ProductImage } from "@/components/product/product-image";
import { Price } from "@/components/product/price";
import { QodiriyOrnament } from "./ornament";
import { tr, type ProductCardDTO } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * Collection "Qodiriy | Qish" — the hoodies from the catalogue, one "page" per hoodie colour, in arch
 * windows that scroll sideways like a book. Hover (mouse) flips the front print to the back print;
 * the colour dots show only that colour; every page opens the product. "Story behind this print"
 * opens a side panel.
 */
export function Qish({ products }: { products: ProductCardDTO[] }) {
  const t = useTranslations("jd.qish");
  const locale = useLocale();
  const [only, setOnly] = useState<string | null>(null);
  const [story, setStory] = useState(false);
  const track = useRef<HTMLDivElement>(null);

  const pages = products.flatMap((p) =>
    p.colors
      .filter((c) => c.images.length > 0)
      .map((c, i) => ({ product: p, color: c, first: i === 0, soldOut: !c.stock.some((s) => s.qty > 0) })),
  );
  // one dot per distinct colour (by swatch), in order of appearance
  const tones = [...new Map(pages.map((x) => [x.color.hex.toLowerCase(), x.color])).values()];
  const shown = only ? pages.filter((x) => x.color.hex.toLowerCase() === only) : pages;

  const page = (dir: 1 | -1) => {
    const el = track.current;
    const card = el?.querySelector<HTMLElement>("[data-page]");
    el?.scrollBy({ left: dir * ((card?.offsetWidth ?? 240) + 16), behavior: "smooth" });
  };

  if (pages.length === 0) return null;

  return (
    <section id="qodiriy-qish" className="scroll-mt-16 overflow-hidden py-section lg:scroll-mt-20">
      <div className="container-page grid items-center gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-12">
        <Reveal>
          <p className="deco text-body-sm uppercase text-firuza">{t("eyebrow")}</p>
          <h2 className="mt-3 font-display text-display leading-none tracking-tighter">
            Qodiriy <span className="font-light text-muted">|</span> <em>Qish</em>
          </h2>
          <p className="mt-5 max-w-sm text-body text-muted">{t("text")}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={{ pathname: "/catalog", query: { category: "xudilar" } }}
              className="inline-flex h-12 items-center gap-2 rounded bg-anor px-5 text-label uppercase tracking-[0.18em] text-white transition-colors duration-[var(--dur-hover)] hover:bg-ink"
            >
              {t("cta")} <span aria-hidden>›</span>
            </Link>
            <button
              type="button"
              onClick={() => setStory(true)}
              className="inline-flex h-12 items-center gap-2 px-1 text-body-sm font-medium text-anor underline-offset-4 hover:underline"
            >
              <BookOpen className="size-4" aria-hidden />
              {t("story")}
            </button>
          </div>
          {tones.length > 1 && (
            <div className="mt-6 flex items-center gap-1" role="radiogroup" aria-label={t("colors")}>
              {tones.map((c) => {
                const hex = c.hex.toLowerCase();
                const on = only === hex;
                return (
                  <button
                    key={hex}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={tr(c.name, locale)}
                    title={tr(c.name, locale)}
                    onClick={() => setOnly(on ? null : hex)}
                    className="grid size-11 place-items-center rounded-pill"
                  >
                    <span
                      className={cn("block size-5 rounded-pill border border-line transition-shadow", on && "ring-2 ring-anor ring-offset-2 ring-offset-paper")}
                      style={{ backgroundColor: c.hex }}
                    />
                  </button>
                );
              })}
              <span className="ml-2 text-body-sm text-muted">
                {only ? tr(tones.find((c) => c.hex.toLowerCase() === only)!.name, locale) : t("allColors")}
              </span>
            </div>
          )}
        </Reveal>

        <div className="relative -mx-gutter lg:mx-0">
          <div ref={track} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-gutter px-gutter pb-2 lg:scroll-px-0 lg:px-0">
            {shown.map(({ product, color, first, soldOut }, i) => {
              const name = tr(product.name, locale);
              const [front, back] = color.images;
              return (
                <Link
                  key={color.id}
                  href={{ pathname: `/product/${product.slug}`, query: first ? {} : { color: color.id } }}
                  data-page
                  className="group w-[64vw] max-w-[280px] shrink-0 snap-start sm:w-[40vw] lg:w-[calc((100%-32px)/3)] lg:max-w-none"
                >
                  <div className="arch relative aspect-[3/4] bg-paper-2">
                    <div className="absolute inset-0 transition-transform duration-[var(--dur-scene)] ease-out group-hover:scale-105">
                      <ProductImage src={front} alt={`${name} — ${tr(color.name, locale)}`} sizes="(min-width: 1024px) 26vw, 64vw" priority={false} />
                      {back && (
                        <div className="absolute inset-0 opacity-0 transition-opacity duration-500 can-hover:group-hover:opacity-100">
                          <ProductImage src={back} alt={`${name} — ${t("back")}`} sizes="(min-width: 1024px) 26vw, 64vw" />
                        </div>
                      )}
                    </div>
                    {soldOut && (
                      <span className="absolute inset-x-6 bottom-3 rounded bg-paper/95 py-1.5 text-center text-label text-muted">{t("soldOut")}</span>
                    )}
                    {i === 0 && back && (
                      <span className="absolute inset-x-0 top-[12%] hidden justify-center can-hover:flex">
                        <span className="deco rounded-pill bg-ink/70 px-3 py-1 text-micro uppercase text-paper">{t("flip")}</span>
                      </span>
                    )}
                  </div>
                  <div className="mt-3 text-center">
                    <p className="font-display text-subheading leading-snug">{name}</p>
                    <p className="deco text-body-sm uppercase text-muted">{tr(color.name, locale)}</p>
                    <Price pricing={product.pricing} size="sm" className="mt-1 justify-center" />
                  </div>
                </Link>
              );
            })}
          </div>
          {shown.length > 3 && (
            <>
              <button
                type="button"
                onClick={() => page(-1)}
                aria-label={t("prev")}
                className="absolute -left-6 top-[38%] hidden size-11 -translate-y-1/2 place-items-center rounded-pill border border-ink/40 bg-paper/80 transition-colors hover:border-anor hover:bg-anor hover:text-white xl:grid"
              >
                <ArrowLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => page(1)}
                aria-label={t("next")}
                className="absolute -right-6 top-[38%] hidden size-11 -translate-y-1/2 place-items-center rounded-pill border border-ink/40 bg-paper/80 transition-colors hover:border-anor hover:bg-anor hover:text-white xl:grid"
              >
                <ArrowRight className="size-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <Sheet open={story} onOpenChange={setStory} title={t("storyTitle")} side="right">
        <div className="flex flex-col gap-5 pb-8">
          <div className="grid place-items-center rounded bg-ink py-8 text-zafaron">
            <QodiriyOrnament className="size-40" />
          </div>
          {(t.raw("storyText") as string[]).map((p) => (
            <p key={p} className="text-body text-ink">
              {p}
            </p>
          ))}
        </div>
      </Sheet>
    </section>
  );
}
