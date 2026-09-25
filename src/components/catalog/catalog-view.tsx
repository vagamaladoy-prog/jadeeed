"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpDown, Check, SlidersHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { ProductCard } from "@/components/product/product-card";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import {
  applyFilters,
  colorKey,
  countActive,
  EMPTY_FILTERS,
  facets as getFacets,
  filtersToQuery,
  parseFilters,
  SORTS,
  type Filters,
  type SortKey,
} from "@/lib/catalog-filter";
import { tr, type CategoryDTO, type FitCode, type ProductCardDTO, type SizeCode } from "@/lib/types";
import { groupDigits } from "@/lib/format";
import { APPEAR, DUR, EASE_OUT, SPRING, TABBAR_H } from "@/lib/motion";
import { cn } from "@/lib/cn";

const PAGE = 12;

const SORT_LABEL: Record<SortKey, string> = {
  popular: "sortPopular",
  new: "sortNew",
  "price-asc": "sortPriceAsc",
  "price-desc": "sortPriceDesc",
};

export function CatalogView({
  products,
  categories,
  badgePhrase,
  initial,
}: {
  products: ProductCardDTO[];
  categories: CategoryDTO[];
  badgePhrase: string;
  initial: Filters;
}) {
  const t = useTranslations("catalog");
  const locale = useLocale();
  const pathname = usePathname();
  const [filters, setFilters] = useState<Filters>(initial);
  const [limit, setLimit] = useState(PAGE);
  const [sheet, setSheet] = useState<"filters" | "sort" | null>(null);
  const { dir, atTop } = useScrollDirection();

  const bySlug = useMemo(() => new Map(categories.map((c) => [c.slug, c.id])), [categories]);
  const facets = useMemo(() => getFacets(products), [products]);
  const result = useMemo(() => applyFilters(products, filters, bySlug), [products, filters, bySlug]);
  const shown = result.slice(0, limit);
  const active = countActive(filters);

  // keep the URL shareable without a navigation/re-render of the server page
  useEffect(() => {
    const prefix = locale === "uz" ? "" : `/${locale}`;
    const url = `${prefix}${pathname}${filtersToQuery(filters)}`;
    if (url !== window.location.pathname + window.location.search) window.history.replaceState(window.history.state, "", url);
  }, [filters, locale, pathname]);

  // back/forward, and links like "/catalog?category=…" from the header while already here
  useEffect(() => {
    const onPop = () => setFilters(parseFilters(new URLSearchParams(window.location.search)));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  // new server props (e.g. header link to another category while already here)
  const [prevInitial, setPrevInitial] = useState(initial);
  if (prevInitial !== initial) {
    setPrevInitial(initial);
    setFilters(initial);
  }

  const update = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setLimit(PAGE);
  };
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const chip = (on: boolean) =>
    cn(
      "flex h-11 min-w-11 items-center justify-center gap-2 rounded-pill border px-4 text-body-sm font-medium transition-colors duration-[var(--dur-hover)]",
      on ? "border-navy bg-navy text-white" : "border-line bg-white text-ink hover:border-ink",
    );

  const panel = (
    <div className="flex flex-col gap-8">
      <fieldset>
        <legend className="label mb-3 text-muted">{t("category")}</legend>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip(!filters.category)} aria-pressed={!filters.category} onClick={() => update({ category: null })}>
            {t("all")}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={chip(filters.category === c.slug)}
              aria-pressed={filters.category === c.slug}
              onClick={() => update({ category: filters.category === c.slug ? null : c.slug })}
            >
              {tr(c.name, locale)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label mb-3 text-muted">{t("size")}</legend>
        <div className="flex flex-wrap gap-2">
          {facets.sizes.map((s) => (
            <motion.button
              key={s}
              type="button"
              whileTap={{ scale: 0.92 }}
              transition={SPRING}
              className={chip(filters.sizes.includes(s))}
              aria-pressed={filters.sizes.includes(s)}
              onClick={() => update({ sizes: toggle<SizeCode>(filters.sizes, s) })}
            >
              {s}
            </motion.button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label mb-3 text-muted">{t("color")}</legend>
        <div className="flex flex-wrap gap-2">
          {facets.colors.map((c) => {
            const on = filters.colors.includes(c.key);
            return (
              <button
                key={c.key}
                type="button"
                aria-pressed={on}
                onClick={() => update({ colors: toggle(filters.colors, c.key) })}
                className={chip(on)}
              >
                <span className="size-4 rounded-pill border border-line" style={{ backgroundColor: c.hex }} aria-hidden />
                {tr(c.name, locale)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label mb-3 text-muted">{t("fit")}</legend>
        <div className="flex flex-wrap gap-2">
          {facets.fits.map((f) => (
            <FitChip key={f} fit={f} on={filters.fits.includes(f)} className={chip(filters.fits.includes(f))} onClick={() => update({ fits: toggle<FitCode>(filters.fits, f) })} />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label mb-3 text-muted">{t("price")}</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["min", "max"] as const).map((k) => (
            <label key={k} className="relative">
              <span className="sr-only">{k === "min" ? t("priceFrom") : t("priceTo")}</span>
              <input
                inputMode="numeric"
                placeholder={`${k === "min" ? t("priceFrom") : t("priceTo")} ${groupDigits(k === "min" ? facets.min : facets.max)}`}
                value={filters[k] != null ? groupDigits(filters[k]!) : ""}
                onChange={(e) => {
                  const d = e.target.value.replace(/\D/g, "");
                  update({ [k]: d ? Number(d) : null } as Partial<Filters>);
                }}
                className="h-11 w-full rounded border border-line bg-white px-3 text-body-sm outline-none focus-visible:border-navy focus-visible:outline-2 focus-visible:outline-navy"
              />
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
        <span className="text-body font-medium">{t("onSale")}</span>
        <button
          type="button"
          role="switch"
          aria-checked={filters.sale}
          onClick={() => update({ sale: !filters.sale })}
          className={cn("relative h-7 w-12 rounded-pill transition-colors duration-[var(--dur-hover)]", filters.sale ? "bg-navy" : "bg-line")}
        >
          <motion.span
            layout
            transition={SPRING}
            className={cn("absolute top-1 size-5 rounded-pill bg-white", filters.sale ? "right-1" : "left-1")}
          />
        </button>
      </label>
    </div>
  );

  const sortList = (
    <ul className="flex flex-col" role="radiogroup" aria-label={t("sort")}>
      {SORTS.map((s) => (
        <li key={s}>
          <button
            type="button"
            role="radio"
            aria-checked={filters.sort === s}
            onClick={() => {
              update({ sort: s });
              setSheet(null);
            }}
            className="flex min-h-12 w-full items-center justify-between border-b border-line text-left text-body"
          >
            {t(SORT_LABEL[s])}
            {filters.sort === s && <Check className="size-5 text-navy" />}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-10">
      {/* desktop sidebar */}
      <aside className="hidden lg:col-span-3 lg:block">
        <div className="sticky top-24">{panel}</div>
        {active > 0 && (
          <button type="button" onClick={() => update({ ...EMPTY_FILTERS, sort: filters.sort })} className="mt-6 min-h-11 text-body-sm text-navy underline underline-offset-4">
            {t("reset")}
          </button>
        )}
      </aside>

      <div className="lg:col-span-9">
        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="text-body-sm text-muted" aria-live="polite">
            {t("results", { count: result.length })}
          </p>
          <label className="hidden items-center gap-3 lg:flex">
            <span className="text-body-sm text-muted">{t("sort")}</span>
            <select
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value as SortKey })}
              className="h-11 rounded border border-line bg-white px-3 text-body-sm outline-none focus-visible:outline-2 focus-visible:outline-navy"
            >
              {SORTS.map((s) => (
                <option key={s} value={s}>
                  {t(SORT_LABEL[s])}
                </option>
              ))}
            </select>
          </label>
        </div>

        {result.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={APPEAR} className="flex flex-col items-center gap-4 py-24 text-center">
            <p className="font-display text-heading font-light">{t("empty")}</p>
            <p className="text-body text-muted">{t("emptyHint")}</p>
            <Button variant="outline" onClick={() => update({ ...EMPTY_FILTERS })}>
              {t("reset")}
            </Button>
          </motion.div>
        ) : (
          <motion.ul layout className="grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 md:gap-x-5">
            <AnimatePresence mode="popLayout" initial={false}>
              {shown.map((p, i) => (
                <motion.li
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: DUR.in, ease: EASE_OUT, delay: Math.min(i % PAGE, 8) * 0.03, layout: SPRING }}
                >
                  <ProductCard
                    product={p}
                    badgePhrase={badgePhrase}
                    priority={i < 4}
                    colorId={filters.colors.length ? p.colors.find((c) => filters.colors.includes(colorKey(c.name.uz)))?.id : undefined}
                    sizes="(min-width: 1024px) 24vw, (min-width: 768px) 33vw, 50vw"
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}

        {result.length > limit && (
          <div className="mt-12 flex justify-center">
            <Button variant="outline" size="lg" onClick={() => setLimit((l) => l + PAGE)}>
              {t("showMore")}
            </Button>
          </div>
        )}
      </div>

      {/* phone: Filters / Sort pinned above the tab bar */}
      <motion.div
        initial={false}
        animate={{ y: dir === "down" && !atTop ? TABBAR_H : 0 }}
        transition={{ duration: DUR.in * 0.7, ease: EASE_OUT }}
        className="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+var(--safe-bottom))] z-30 flex gap-2 border-t border-line bg-paper px-gutter py-2 lg:hidden"
      >
        <Button variant="primary" className="flex-1" onClick={() => setSheet("filters")}>
          <SlidersHorizontal /> {t("filters")}
          {active > 0 && <span className="rounded-pill bg-white px-2 text-label text-ink">{active}</span>}
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => setSheet("sort")}>
          <ArrowUpDown /> {t("sort")}
        </Button>
      </motion.div>
      <div className="h-16 lg:hidden" aria-hidden />

      <Sheet
        open={sheet === "filters"}
        onOpenChange={(o) => setSheet(o ? "filters" : null)}
        title={t("filters")}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => update({ ...EMPTY_FILTERS, sort: filters.sort })}>
              {t("reset")}
            </Button>
            <Button className="flex-[2]" onClick={() => setSheet(null)}>
              {t("apply")} · {result.length}
            </Button>
          </div>
        }
      >
        {panel}
      </Sheet>
      <Sheet open={sheet === "sort"} onOpenChange={(o) => setSheet(o ? "sort" : null)} title={t("sort")}>
        {sortList}
      </Sheet>
    </div>
  );
}

function FitChip({ fit, on, className, onClick }: { fit: FitCode; on: boolean; className: string; onClick: () => void }) {
  const t = useTranslations("fit");
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={className}>
      {t(fit)}
    </button>
  );
}
