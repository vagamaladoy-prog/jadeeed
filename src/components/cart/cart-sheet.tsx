"use client";
import { AnimatePresence } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouteChange } from "@/hooks/use-route-change";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { BrandPhrase } from "@/components/brand/brand-phrase";
import { CartLine } from "./cart-line";
import { cartUi, useCart, useCartUi } from "@/lib/cart-store";
import { useDesktop } from "@/hooks/use-media";
import { formatPrice } from "@/lib/format";

/** Desktop: drawer from the right. Phone: full-height bottom sheet, swipe down to close. */
export function CartSheet({ waitingPhrase }: { waitingPhrase: string }) {
  const t = useTranslations("cart");
  const locale = useLocale();
  const items = useCart();
  const { open } = useCartUi();
  const desktop = useDesktop();
  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const blocked = items.some((i) => i.maxQty <= 0);

  useRouteChange(cartUi.close);

  return (
    <Sheet
      open={open}
      onOpenChange={cartUi.set}
      side={desktop ? "right" : "bottom"}
      full
      title={
        <>
          {t("title")} {count > 0 && <span className="text-muted">· {count}</span>}
        </>
      }
      footer={
        items.length > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <span className="text-body text-muted">{t("total")}</span>
              <span className="text-heading font-medium tabular-nums">{formatPrice(total, locale)}</span>
            </div>
            <p className="text-body-sm text-muted">{t("delivery")}</p>
            <Button asChild size="lg" className="w-full" aria-disabled={blocked}>
              <Link href="/checkout" onClick={(e) => (blocked ? e.preventDefault() : cartUi.close())}>
                {t("checkout")}
              </Link>
            </Button>
            <Link href="/cart" onClick={() => cartUi.close()} className="self-center py-2 text-body-sm text-navy underline underline-offset-4">
              {t("openPage")}
            </Link>
          </div>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-6 py-16 text-center">
          <BrandPhrase text={waitingPhrase} as="p" animate="write" className="text-display" />
          <p className="text-body text-muted">{t("empty")}</p>
          <Button variant="outline" onClick={() => cartUi.close()} asChild>
            <Link href="/catalog">{t("continue")}</Link>
          </Button>
        </div>
      ) : (
        <ul>
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <CartLine key={item.key} item={item} compact />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </Sheet>
  );
}
