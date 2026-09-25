import { useLocale, useTranslations } from "next-intl";
import { formatPrice } from "@/lib/format";
import type { PriceInfo } from "@/lib/pricing";
import { cn } from "@/lib/cn";

export function Price({ pricing, size = "md", className }: { pricing: PriceInfo; size?: "sm" | "md" | "lg"; className?: string }) {
  const locale = useLocale();
  const t = useTranslations("price");
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span
        className={cn(
          "font-medium tabular-nums text-ink",
          size === "sm" && "text-body-sm md:text-body",
          size === "md" && "text-subheading",
          size === "lg" && "text-heading",
        )}
      >
        {formatPrice(pricing.price, locale)}
      </span>
      {pricing.compareAt && (
        <>
          <span className="sr-only">{t("discount")}:</span>
          <s className={cn("tabular-nums text-muted", size === "lg" ? "text-body" : "text-body-sm")}>{formatPrice(pricing.compareAt, locale)}</s>
          {size !== "sm" && pricing.discountPercent ? (
            <span className="rounded-pill bg-ink px-2 py-0.5 text-label font-medium text-white">−{pricing.discountPercent}%</span>
          ) : null}
        </>
      )}
    </p>
  );
}
