"use client";
import { motion } from "motion/react";
import { Minus, Plus, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ProductImage } from "@/components/product/product-image";
import { cart, cartUi, type CartItem } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { tr } from "@/lib/types";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/cn";

export function CartLine({ item, compact }: { item: CartItem; compact?: boolean }) {
  const t = useTranslations("cart");
  const locale = useLocale();
  const unavailable = item.maxQty <= 0;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={SPRING}
      className="flex gap-4 border-b border-line py-4 last:border-b-0"
    >
      <Link
        href={`/product/${item.slug}`}
        onClick={() => cartUi.close()}
        className={cn("relative shrink-0 overflow-hidden rounded bg-paper-2", compact ? "h-30 w-24" : "h-36 w-28 md:h-44 md:w-36")}
      >
        {item.image && <ProductImage src={item.image} alt={tr(item.name, locale)} sizes="144px" />}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/product/${item.slug}`} onClick={() => cartUi.close()} className="text-body font-medium leading-snug hover:underline">
            {tr(item.name, locale)}
          </Link>
          <button
            type="button"
            onClick={() => cart.remove(item.key)}
            aria-label={t("remove")}
            className="-mr-2 -mt-2 grid size-11 shrink-0 place-items-center rounded text-muted hover:bg-paper-2 hover:text-ink"
          >
            <X className="size-4.5" />
          </button>
        </div>
        <p className="text-body-sm text-muted">{tr(item.colorName, locale)}</p>

        {/* size — changeable right in the cart */}
        <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label={t("size")}>
          {item.sizes.map((s) => {
            const active = s.size === item.size;
            const disabled = s.qty <= 0;
            return (
              <button
                key={s.size}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabled && !active}
                onClick={() => cart.changeSize(item.key, s.size)}
                className={cn(
                  "h-8 min-w-10 rounded-pill border px-2 text-label font-medium transition-colors duration-[var(--dur-hover)]",
                  active ? "border-navy bg-navy text-white" : "border-line bg-white text-ink hover:border-ink",
                  disabled && !active && "cursor-not-allowed text-muted line-through opacity-50",
                )}
              >
                {s.size}
              </button>
            );
          })}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          {unavailable ? (
            <span className="text-body-sm font-medium text-ink">{t("unavailable")}</span>
          ) : (
            <div className="flex items-center rounded-pill border border-line bg-white" aria-label={t("quantity")}>
              <button
                type="button"
                onClick={() => cart.setQty(item.key, item.qty - 1)}
                aria-label={t("decrease")}
                className="grid size-11 place-items-center rounded-pill hover:bg-paper-2"
              >
                <Minus className="size-4" />
              </button>
              <span className="min-w-6 text-center text-body font-medium tabular-nums" aria-live="polite">
                {item.qty}
              </span>
              <button
                type="button"
                onClick={() => cart.setQty(item.key, item.qty + 1)}
                disabled={item.qty >= item.maxQty}
                aria-label={t("increase")}
                className="grid size-11 place-items-center rounded-pill hover:bg-paper-2 disabled:opacity-30"
              >
                <Plus className="size-4" />
              </button>
            </div>
          )}
          <div className="text-right">
            {item.compareAt && (
              <p className="text-body-sm text-muted line-through">{formatPrice(item.compareAt * item.qty, locale)}</p>
            )}
            <p className="text-body font-medium tabular-nums">{formatPrice(item.price * item.qty, locale)}</p>
          </div>
        </div>
      </div>
    </motion.li>
  );
}
