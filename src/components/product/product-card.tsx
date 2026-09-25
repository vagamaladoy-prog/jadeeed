"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProductImage } from "./product-image";
import { Price } from "./price";
import { SIZES, tr, type ProductCardDTO } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * Catalogue card. Hover (mouse only): front → back photo, gentle zoom, available sizes slide up.
 * No border, no shadow — the photo is the card.
 */
export function ProductCard({
  product,
  badgePhrase,
  priority,
  sizes = "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw",
  colorId,
}: {
  product: ProductCardDTO;
  badgePhrase: string;
  priority?: boolean;
  sizes?: string;
  /** preselect a colour (e.g. catalogue filtered by colour) */
  colorId?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("product");
  const [activeColor, setActiveColor] = useState(colorId ?? product.colors[0]?.id);
  const color = product.colors.find((c) => c.id === activeColor) ?? product.colors[0];
  const [front, back] = color?.images ?? [];
  const available = SIZES.filter((s) => color?.stock.some((x) => x.size === s && x.qty > 0));
  const soldOut = available.length === 0;
  const name = tr(product.name, locale);
  const href = { pathname: `/product/${product.slug}`, query: color && color.id !== product.colors[0]?.id ? { color: color.id } : {} };

  return (
    <article className="group relative">
      <Link href={href} className="block" aria-label={name}>
        <div className="relative aspect-4/5 overflow-hidden rounded bg-paper-2">
          <div className="absolute inset-0 transition-transform duration-[var(--dur-scene)] ease-out group-hover:scale-104">
            {front && <ProductImage src={front} alt={`${name} — ${t("front")}`} sizes={sizes} priority={priority} />}
            {back && (
              <div className="absolute inset-0 opacity-0 transition-opacity duration-[var(--dur-in)] ease-out can-hover:group-hover:opacity-100">
                <ProductImage src={back} alt={`${name} — ${t("back")}`} sizes={sizes} />
              </div>
            )}
          </div>

          {/* badges */}
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5 md:left-3 md:top-3">
            {(product.isNew || product.isBestseller) && (
              <span className="phrase rounded-pill bg-navy px-2.5 py-1 text-micro text-white">{badgePhrase}</span>
            )}
            {product.pricing.discountPercent ? (
              <span className="rounded-pill bg-ink px-2.5 py-1 text-micro font-medium text-white">−{product.pricing.discountPercent}%</span>
            ) : null}
          </div>

          {/* sizes slide up on hover (mouse devices only) */}
          {!soldOut && (
            <div className="absolute inset-x-2 bottom-2 hidden translate-y-[calc(100%+8px)] opacity-0 transition-[transform,opacity] duration-[var(--dur-in)] ease-out can-hover:flex can-hover:group-hover:translate-y-0 can-hover:group-hover:opacity-100">
              <div className="flex w-full flex-wrap justify-center gap-1 rounded bg-paper/95 p-2">
                {SIZES.filter((s) => color?.stock.some((x) => x.size === s)).map((s) => (
                  <span
                    key={s}
                    className={cn(
                      "min-w-9 rounded-pill px-2 py-1 text-center text-label font-medium",
                      available.includes(s) ? "text-ink" : "text-muted line-through opacity-60",
                    )}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {soldOut && (
            <span className="absolute inset-x-2 bottom-2 rounded bg-paper/95 py-2 text-center text-label text-muted">
              {t("outOfStock")}
            </span>
          )}
        </div>
      </Link>

      <div className="mt-3 flex flex-col gap-1">
        <Link href={href} className="text-body-sm leading-snug text-ink hover:underline hover:underline-offset-4 md:text-body">
          {name}
        </Link>
        <Price pricing={product.pricing} size="sm" />
        {product.colors.length > 1 && (
          <div className="-ml-3.5 flex gap-2" role="radiogroup" aria-label={t("color")}>
            {product.colors.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={c.id === color?.id}
                aria-label={tr(c.name, locale)}
                title={tr(c.name, locale)}
                onClick={() => setActiveColor(c.id)}
                className="grid size-11 place-items-center rounded-pill"
              >
                <motion.span
                  className={cn(
                    "block size-4 rounded-pill border",
                    c.id === color?.id ? "border-navy ring-2 ring-navy ring-offset-2 ring-offset-paper" : "border-line",
                  )}
                  style={{ backgroundColor: c.hex }}
                  whileTap={{ scale: 0.85 }}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
