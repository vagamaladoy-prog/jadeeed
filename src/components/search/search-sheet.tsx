"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouteChange } from "@/hooks/use-route-change";
import { Sheet } from "@/components/ui/sheet";
import { ProductImage } from "@/components/product/product-image";
import { useDesktop } from "@/hooks/use-media";
import { ui, useUi } from "@/lib/ui-store";
import { formatPrice } from "@/lib/format";
import { tr, type CategoryDTO, type ProductCardDTO } from "@/lib/types";

let cache: Promise<ProductCardDTO[]> | null = null;
const loadCatalog = () =>
  (cache ??= fetch("/api/catalog")
    .then((r) => r.json() as Promise<ProductCardDTO[]>)
    .catch(() => {
      cache = null;
      return [];
    }));

const norm = (s: string) => s.toLowerCase().replace(/[ʻʼ'`’"«»]/g, "").trim();

/** Full-screen search. On phones the field sits at the bottom, right above the keyboard. */
export function SearchSheet({ categories }: { categories: CategoryDTO[] }) {
  const t = useTranslations("search");
  const locale = useLocale();
  const open = useUi((s) => s.search);
  const desktop = useDesktop();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<ProductCardDTO[] | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    loadCatalog().then(setItems);
    const id = setTimeout(() => input.current?.focus(), 250);
    return () => clearTimeout(id);
  }, [open]);

  useRouteChange(() => ui.setSearch(false));

  const results = useMemo(() => {
    const query = norm(q);
    if (!items || query.length < 2) return [];
    return items
      .filter((p) => {
        const hay = norm(
          [p.name.uz, p.name.ru, ...p.colors.flatMap((c) => [c.name.uz, c.name.ru]), p.fit].join(" "),
        );
        return query.split(/\s+/).every((w) => hay.includes(w));
      })
      .slice(0, 12);
  }, [items, q]);

  const field = (
    <form role="search" onSubmit={(e) => e.preventDefault()} className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
      <input
        ref={input}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("placeholder")}
        aria-label={t("hint")}
        enterKeyHint="search"
        className="h-13 w-full rounded border border-line bg-white pl-12 pr-4 text-body outline-none focus-visible:border-navy focus-visible:outline-2 focus-visible:outline-navy"
      />
    </form>
  );

  return (
    <Sheet
      open={open}
      onOpenChange={ui.setSearch}
      side={desktop ? "right" : "bottom"}
      full
      title={t("hint")}
      footer={desktop ? undefined : field}
    >
      {desktop && <div className="mb-4">{field}</div>}
      {q.trim().length < 2 ? (
        <div className="flex flex-col gap-3 py-4">
          <p className="label text-muted">{t("popular")}</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={{ pathname: "/catalog", query: { category: c.slug } }}
                className="flex h-11 items-center rounded-pill border border-line bg-white px-5 text-body-sm hover:border-ink"
              >
                {tr(c.name, locale)}
              </Link>
            ))}
          </div>
        </div>
      ) : results.length === 0 ? (
        <p className="py-10 text-center text-body text-muted">{items ? t("empty") : "…"}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-6 py-2">
          {results.map((p) => {
            const c = p.colors[0];
            return (
              <li key={p.id}>
                <Link href={`/product/${p.slug}`} className="group block">
                  <span className="relative block aspect-4/5 overflow-hidden rounded bg-paper-2">
                    {c?.images[0] && <ProductImage src={c.images[0]} alt={tr(p.name, locale)} sizes="200px" />}
                  </span>
                  <span className="mt-2 block text-body-sm group-hover:underline">{tr(p.name, locale)}</span>
                  <span className="block text-body-sm font-medium">{formatPrice(p.pricing.price, locale)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}
