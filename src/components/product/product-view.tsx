"use client";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useUrlParam } from "@/hooks/use-url-param";
import { AnimatePresence, motion } from "motion/react";
import { Ruler } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ProductGallery } from "./product-gallery";
import { Price } from "./price";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "@/components/contact/external-link";
import { Magnet } from "@/components/bits/magnet";
import { useTelegram } from "@/components/telegram/telegram-provider";
import { cart, useCart } from "@/lib/cart-store";
import { flyToCart, ui } from "@/lib/ui-store";
import { formatPrice } from "@/lib/format";
import { tr, type ProductDTO, type SizeCode } from "@/lib/types";
import { DUR, EASE_OUT, SPRING, TABBAR_H } from "@/lib/motion";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { cn } from "@/lib/cn";

// bottom sheets (vaul) load on first open — not needed for the first paint
const Sheet = dynamic(() => import("@/components/ui/sheet").then((m) => m.Sheet), { ssr: false });
const SizeChartSheet = dynamic(() => import("./size-chart-sheet").then((m) => m.SizeChartSheet), { ssr: false });

export function ProductView({
  product,
  addedPhrase,
  badgePhrase,
  supportUrl,
}: {
  product: ProductDTO;
  addedPhrase: string;
  badgePhrase: string;
  supportUrl: string;
}) {
  const t = useTranslations("product");
  const locale = useLocale();
  const { haptic } = useTelegram();
  // ?color=… from a catalogue card (read on the client so the page stays static)
  const urlColor = useUrlParam("color");
  const [picked, setColorId] = useState<string | null>(null);
  const colorId = picked ?? (product.colors.some((c) => c.id === urlColor) ? urlColor! : product.colors[0].id);
  const color = product.colors.find((c) => c.id === colorId)!;
  const [size, setSize] = useState<SizeCode | null>(null);
  const [needSize, setNeedSize] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [sizeSheet, setSizeSheet] = useState(false);
  // mount a sheet the first time it opens, keep it mounted so it can animate closed
  const [sheetsUsed, setSheetsUsed] = useState({ size: false, chart: false });
  if ((sizeSheet && !sheetsUsed.size) || (chartOpen && !sheetsUsed.chart))
    setSheetsUsed({ size: sheetsUsed.size || sizeSheet, chart: sheetsUsed.chart || chartOpen });
  const items = useCart();
  const { dir, atTop } = useScrollDirection();
  const name = tr(product.name, locale);

  const stockOf = (s: SizeCode) => color.stock.find((x) => x.size === s)?.qty ?? 0;
  const inCart = useMemo(() => items.find((i) => i.productId === product.id && i.colorId === colorId && i.size === size), [items, product.id, colorId, size]);
  const soldOut = color.stock.every((s) => s.qty <= 0);

  const pickSize = (s: SizeCode) => {
    if (stockOf(s) <= 0) return;
    setSize(s);
    setNeedSize(false);
    haptic("select");
  };

  const add = () => {
    if (!size) {
      setNeedSize(true);
      haptic("light");
      if (window.matchMedia("(max-width: 1023px)").matches) setSizeSheet(true);
      return;
    }
    cart.add({
      productId: product.id,
      slug: product.slug,
      colorId: color.id,
      size,
      name: product.name,
      colorName: color.name,
      image: color.images[0] ?? null,
      price: product.pricing.price,
      compareAt: product.pricing.compareAt,
      maxQty: stockOf(size),
      sizes: color.stock,
    });
    haptic("success");
    const src = [...document.querySelectorAll<HTMLElement>("[data-fly-source]")].find((el) => el.offsetParent !== null);
    if (src && color.images[0]) flyToCart({ src: color.images[0], from: src.getBoundingClientRect() });
    ui.toast(addedPhrase);
    setSizeSheet(false);
  };

  const sizeChips = (big?: boolean) => (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("size")}>
      {color.stock.map(({ size: s, qty }) => {
        const active = s === size;
        const out = qty <= 0;
        return (
          <motion.button
            key={s}
            type="button"
            role="radio"
            aria-checked={active}
            aria-disabled={out}
            onClick={() => pickSize(s)}
            whileTap={out ? undefined : { scale: 0.9 }}
            animate={{ scale: active ? 1.06 : 1 }}
            transition={SPRING}
            className={cn(
              "relative grid min-w-13 place-items-center rounded-pill border px-3 text-body-sm font-medium transition-colors duration-[var(--dur-hover)]",
              big ? "h-13" : "h-12",
              active ? "border-navy bg-navy text-white" : "border-line bg-white text-ink hover:border-ink",
              out && "cursor-not-allowed border-line bg-transparent text-muted line-through",
            )}
          >
            {s}
            {!out && qty <= 3 && (
              <span className={cn("absolute -top-1.5 right-0 size-2 rounded-pill", active ? "bg-white ring-2 ring-navy" : "bg-navy")} aria-hidden />
            )}
          </motion.button>
        );
      })}
    </div>
  );

  const addButton = (full?: boolean) => (
    <Button
      size="lg"
      onClick={add}
      disabled={soldOut}
      className={cn(full && "w-full")}
      aria-describedby={needSize ? "need-size" : undefined}
    >
      {soldOut ? t("outOfStock") : inCart ? `${t("added")} · ${inCart.qty}` : t("addToCart")}
    </Button>
  );

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <ProductGallery images={color.images} alt={name} />
        </div>

        <div className="flex flex-col gap-7 lg:col-span-5 lg:pt-4">
          <div className="flex flex-col gap-3">
            {(product.isNew || product.isBestseller) && (
              <span className="phrase w-fit rounded-pill bg-navy px-3 py-1 text-label text-white">{badgePhrase}</span>
            )}
            <h1 className="font-display text-heading-lg font-light tracking-tighter">{name}</h1>
            <Price pricing={product.pricing} size="lg" />
          </div>

          {/* colour */}
          <div>
            <p className="mb-3 text-body-sm text-muted">
              {t("color")}: <span className="text-ink">{tr(color.name, locale)}</span>
            </p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("color")}>
              {product.colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={c.id === colorId}
                  aria-label={tr(c.name, locale)}
                  onClick={() => {
                    setColorId(c.id);
                    setSize(null);
                    haptic("select");
                  }}
                  className={cn(
                    "relative size-13 overflow-hidden rounded border bg-paper-2 transition-colors duration-[var(--dur-hover)]",
                    c.id === colorId ? "border-navy outline outline-2 outline-offset-1 outline-navy" : "border-line hover:border-ink",
                  )}
                >
                  <span className="absolute inset-2 rounded-pill border border-line" style={{ backgroundColor: c.hex }} />
                </button>
              ))}
            </div>
          </div>

          {/* size */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-body-sm text-muted">{t("size")}</p>
              <button
                type="button"
                onClick={() => setChartOpen(true)}
                className="-mr-2 flex min-h-11 items-center gap-2 px-2 text-body-sm text-navy underline underline-offset-4"
              >
                <Ruler className="size-4" /> {t("sizeChart")}
              </button>
            </div>
            {sizeChips()}
            <AnimatePresence>
              {needSize && (
                <motion.p
                  id="need-size"
                  role="alert"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 text-body-sm font-medium text-navy"
                >
                  {t("chooseSize")}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden flex-col gap-4 lg:flex">
            <Magnet padding={40} magnetStrength={6} className="block" innerClassName="w-full">
              {addButton(true)}
            </Magnet>
          </div>
          <ExternalLink href={supportUrl} className="flex min-h-11 w-fit items-center text-body-sm text-muted underline decoration-line underline-offset-4 hover:text-navy">
            {t("question")}
          </ExternalLink>

          <ProductInfo product={product} />
        </div>
      </div>

      {/* phone: sticky purchase bar above the tab bar (synced with the size picker above) */}
      <motion.div
        initial={false}
        animate={{ y: dir === "down" && !atTop ? TABBAR_H : 0 }}
        transition={{ duration: DUR.in * 0.7, ease: EASE_OUT }}
        className="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+var(--safe-bottom))] z-30 border-t border-line bg-paper px-gutter py-2 lg:hidden"
      >
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-body font-medium tabular-nums">{formatPrice(product.pricing.price, locale)}</p>
            {product.pricing.compareAt && <s className="text-label text-muted">{formatPrice(product.pricing.compareAt, locale)}</s>}
          </div>
          <button
            type="button"
            onClick={() => setSizeSheet(true)}
            className={cn(
              "h-12 min-w-13 rounded-pill border px-4 text-body-sm font-medium",
              size ? "border-navy bg-navy text-white" : needSize ? "border-navy text-navy" : "border-line bg-white",
            )}
            aria-label={t("size")}
          >
            {size ?? t("size")}
          </button>
          {addButton()}
        </div>
      </motion.div>
      <div className="h-16 lg:hidden" aria-hidden />

      {sheetsUsed.size && (
        <Sheet open={sizeSheet} onOpenChange={setSizeSheet} title={t("chooseSize")}>
          <div className="flex flex-col gap-6 pb-2">
            {sizeChips(true)}
            <button type="button" onClick={() => setChartOpen(true)} className="flex min-h-11 w-fit items-center gap-2 text-body-sm text-navy underline underline-offset-4">
              <Ruler className="size-4" /> {t("sizeChart")}
            </button>
            {addButton(true)}
          </div>
        </Sheet>
      )}
      {sheetsUsed.chart && (
        <SizeChartSheet open={chartOpen} onOpenChange={setChartOpen} chart={product.sizeChart} supportUrl={supportUrl} highlight={size} />
      )}
    </>
  );
}

function ProductInfo({ product }: { product: ProductDTO }) {
  const t = useTranslations("product");
  const f = useTranslations("fit");
  const locale = useLocale();
  const rows = [
    { k: t("description"), v: tr(product.description, locale) },
    { k: t("fit"), v: f(product.fit) },
    {
      k: t("composition"),
      v: [tr(product.composition, locale), product.density ? `${t("density")}: ${t("densityValue", { value: product.density })}` : ""]
        .filter(Boolean)
        .join(" · "),
    },
    { k: t("care"), v: tr(product.care, locale) },
  ].filter((r) => r.v);
  return (
    <dl className="mt-2 border-t border-line">
      {rows.map((r) => (
        <div key={r.k} className="grid gap-1 border-b border-line py-4 md:grid-cols-3 md:gap-4">
          <dt className="text-body-sm text-muted">{r.k}</dt>
          <dd className="whitespace-pre-line text-body md:col-span-2">{r.v}</dd>
        </div>
      ))}
    </dl>
  );
}
