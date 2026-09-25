import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCatalogProducts, getCategories, getPhrases } from "@/lib/data";
import { parseFilters } from "@/lib/catalog-filter";
import { alternates } from "@/lib/site";
import { tr } from "@/lib/types";
import { CatalogView } from "@/components/catalog/catalog-view";
import { PageHeader } from "@/components/layout/page-header";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "meta" });
  const categories = await getCategories();
  const cat = categories.find((c) => c.slug === sp.category);
  return {
    title: cat ? tr(cat.name, locale) : t("catalogTitle"),
    description: t("catalogDescription"),
    alternates: alternates(locale, "/catalog"),
  };
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("catalog");
  const [products, categories, phrases, sp] = await Promise.all([getCatalogProducts(), getCategories(), getPhrases(), searchParams]);
  const initial = parseFilters(sp);
  const cat = categories.find((c) => c.slug === initial.category);

  return (
    <div className="container-page pb-section">
      <PageHeader title={cat ? tr(cat.name, locale) : t("title")} subtitle={cat?.description ? tr(cat.description, locale) : undefined} />
      <CatalogView
        products={products}
        categories={categories.filter((c) => c.productCount > 0)}
        badgePhrase={phrases.slots.BADGE}
        initial={initial}
      />
    </div>
  );
}
