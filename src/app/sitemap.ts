import type { MetadataRoute } from "next";
import { getCategories, getProductSlugs } from "@/lib/data";
import { localeUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, categories] = await Promise.all([getProductSlugs().catch(() => []), getCategories().catch(() => [])]);
  const paths = [
    "/",
    "/catalog",
    "/about",
    "/delivery",
    "/contacts",
    ...categories.map((c) => `/catalog?category=${c.slug}`),
    ...slugs.map((s) => `/product/${s}`),
  ];
  return paths.map((p) => ({
    url: localeUrl("uz", p),
    changeFrequency: p.startsWith("/product") ? "weekly" : "daily",
    priority: p === "/" ? 1 : p.startsWith("/product") ? 0.8 : 0.6,
    alternates: { languages: { uz: localeUrl("uz", p), ru: localeUrl("ru", p) } },
  }));
}
