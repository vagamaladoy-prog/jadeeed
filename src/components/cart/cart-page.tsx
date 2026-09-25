"use client";
import { AnimatePresence } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { BrandPhrase } from "@/components/brand/brand-phrase";
import { CartLine } from "./cart-line";
import { useCartRefresh } from "./use-cart-refresh";
import { useMainButton } from "@/components/telegram/telegram-provider";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";

export function CartPage({ waitingPhrase }: { waitingPhrase: string }) {
  const t = useTranslations("cart");
  const locale = useLocale();
  const router = useRouter();
  const items = useCart();
  useCartRefresh();
  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const blocked = items.some((i) => i.maxQty <= 0);

  const tgMain = useMainButton({
    text: `${t("checkout")} · ${formatPrice(total, locale)}`,
    onClick: () => router.push("/checkout"),
    enabled: !blocked,
    visible: items.length > 0,
  });

  const continueLink = (
    <Link href="/catalog" className="group inline-flex min-h-11 flex-col items-start gap-0.5">
      <span className="phrase text-heading text-ink transition-colors duration-[var(--dur-hover)] group-hover:text-navy">{waitingPhrase}</span>
      <span className="text-body-sm text-muted underline underline-offset-4">{t("continue")}</span>
    </Link>
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-20 text-center">
        <BrandPhrase text={waitingPhrase} as="p" animate="write" className="text-display-xl tracking-tightest" />
        <p className="text-body text-muted">{t("empty")}</p>
        <Button asChild variant="outline" size="lg">
          <Link href="/catalog">{t("continue")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <p className="mb-2 text-body-sm text-muted">{t("items", { count })}</p>
        <ul className="border-t border-line">
          <AnimatePresence initial={false}>
            {items.map((i) => (
              <CartLine key={i.key} item={i} />
            ))}
          </AnimatePresence>
        </ul>
        <div className="mt-8">{continueLink}</div>
      </div>

      <aside className="hidden lg:col-span-4 lg:block">
        <div className="sticky top-28 flex flex-col gap-4 rounded border border-line bg-white p-6">
          <div className="flex items-baseline justify-between">
            <span className="text-body text-muted">{t("total")}</span>
            <span className="text-heading font-medium tabular-nums">{formatPrice(total, locale)}</span>
          </div>
          <p className="text-body-sm text-muted">{t("delivery")}</p>
          <Button asChild size="lg" aria-disabled={blocked}>
            <Link href="/checkout" onClick={(e) => blocked && e.preventDefault()}>
              {t("checkout")}
            </Link>
          </Button>
        </div>
      </aside>

      {/* phone: total + checkout pinned to the bottom (Telegram MainButton replaces it in the Mini App) */}
      {!tgMain && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper px-gutter pb-[calc(var(--safe-bottom)+8px)] pt-3 lg:hidden">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-body-sm text-muted">{t("total")}</span>
            <span className="text-subheading font-medium tabular-nums">{formatPrice(total, locale)}</span>
          </div>
          <Button asChild size="lg" className="w-full" aria-disabled={blocked}>
            <Link href="/checkout" onClick={(e) => blocked && e.preventDefault()}>
              {t("checkout")}
            </Link>
          </Button>
        </div>
      )}
      <div className="h-28 lg:hidden" aria-hidden />
    </div>
  );
}
