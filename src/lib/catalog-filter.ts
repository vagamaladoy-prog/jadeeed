import { FITS, SIZES, type FitCode, type ProductCardDTO, type SizeCode } from "./types";

export type SortKey = "popular" | "new" | "price-asc" | "price-desc";
export const SORTS: SortKey[] = ["popular", "new", "price-asc", "price-desc"];

export type Filters = {
  category: string | null;
  sizes: SizeCode[];
  colors: string[]; // colour keys (normalised uz name)
  fits: FitCode[];
  min: number | null;
  max: number | null;
  sale: boolean;
  sort: SortKey;
};

export const EMPTY_FILTERS: Filters = { category: null, sizes: [], colors: [], fits: [], min: null, max: null, sale: false, sort: "popular" };

export const colorKey = (uzName: string) => uzName.toLowerCase().replace(/[ʻʼ'`’]/g, "").trim();

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);
const num = (v: string | null) => (v && /^\d+$/.test(v) ? Number(v) : null);

export function parseFilters(sp: URLSearchParams | Record<string, string | string[] | undefined>): Filters {
  const get = (k: string) => {
    if (sp instanceof URLSearchParams) return sp.get(k);
    const v = sp[k];
    return Array.isArray(v) ? v[0] ?? null : v ?? null;
  };
  const sort = get("sort") as SortKey;
  return {
    category: get("category"),
    sizes: list(get("size")).filter((s): s is SizeCode => (SIZES as readonly string[]).includes(s)),
    colors: list(get("color")),
    fits: list(get("fit")).filter((f): f is FitCode => (FITS as readonly string[]).includes(f)),
    min: num(get("min")),
    max: num(get("max")),
    sale: get("sale") === "1",
    sort: SORTS.includes(sort) ? sort : "popular",
  };
}

export function filtersToQuery(f: Filters): string {
  const p = new URLSearchParams();
  if (f.category) p.set("category", f.category);
  if (f.sizes.length) p.set("size", f.sizes.join(","));
  if (f.colors.length) p.set("color", f.colors.join(","));
  if (f.fits.length) p.set("fit", f.fits.join(","));
  if (f.min != null) p.set("min", String(f.min));
  if (f.max != null) p.set("max", String(f.max));
  if (f.sale) p.set("sale", "1");
  if (f.sort !== "popular") p.set("sort", f.sort);
  const s = p.toString().replace(/%2C/gi, ","); // readable lists: size=M,XL
  return s ? `?${s}` : "";
}

export function countActive(f: Filters) {
  return (f.category ? 1 : 0) + f.sizes.length + f.colors.length + f.fits.length + (f.min != null || f.max != null ? 1 : 0) + (f.sale ? 1 : 0);
}

export function applyFilters(products: ProductCardDTO[], f: Filters, categoryIdBySlug: Map<string, string>) {
  const catId = f.category ? categoryIdBySlug.get(f.category) : null;
  const out = products.filter((p) => {
    if (f.category && p.categoryId !== catId) return false;
    if (f.fits.length && !f.fits.includes(p.fit)) return false;
    if (f.sale && !p.pricing.compareAt) return false;
    if (f.min != null && p.pricing.price < f.min) return false;
    if (f.max != null && p.pricing.price > f.max) return false;
    const colors = f.colors.length ? p.colors.filter((c) => f.colors.includes(colorKey(c.name.uz))) : p.colors;
    if (!colors.length) return false;
    if (f.sizes.length && !colors.some((c) => c.stock.some((s) => s.qty > 0 && f.sizes.includes(s.size)))) return false;
    return true;
  });
  const sorted = [...out];
  switch (f.sort) {
    case "new":
      sorted.sort((a, b) => Number(b.isNew) - Number(a.isNew) || b.createdAt - a.createdAt);
      break;
    case "price-asc":
      sorted.sort((a, b) => a.pricing.price - b.pricing.price);
      break;
    case "price-desc":
      sorted.sort((a, b) => b.pricing.price - a.pricing.price);
      break;
    default:
      sorted.sort((a, b) => Number(b.isBestseller) - Number(a.isBestseller) || Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder);
  }
  return sorted;
}

/** Facets present in the catalogue (so we never offer a filter with zero results). */
export function facets(products: ProductCardDTO[]) {
  const colors = new Map<string, { key: string; name: { uz: string; ru: string }; hex: string }>();
  const sizes = new Set<SizeCode>();
  const fits = new Set<FitCode>();
  let min = Infinity;
  let max = 0;
  for (const p of products) {
    fits.add(p.fit);
    min = Math.min(min, p.pricing.price);
    max = Math.max(max, p.pricing.price);
    for (const c of p.colors) {
      const key = colorKey(c.name.uz);
      if (!colors.has(key)) colors.set(key, { key, name: c.name, hex: c.hex });
      c.stock.forEach((s) => sizes.add(s.size));
    }
  }
  return {
    colors: [...colors.values()],
    sizes: SIZES.filter((s) => sizes.has(s)),
    fits: FITS.filter((f) => fits.has(f)),
    min: Number.isFinite(min) ? min : 0,
    max,
  };
}
