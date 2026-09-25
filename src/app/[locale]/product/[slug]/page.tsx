import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCatalogProducts, getPhrases, getProductBySlug, getProductSlugs, getSettings } from "@/lib/data";
import { alternates, localeUrl, siteUrl } from "@/lib/site";
import { tr } from "@/lib/types";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { ProductView } from "@/components/product/product-view";
import { ProductRail } from "@/components/home/product-rail";
import { SectionHeading } from "@/components/home/section-heading";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  try {
    const slugs = await getProductSlugs();
    return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
  } catch {
    return []; // no database at build time → render on demand
  }
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const name = tr(product.name, locale);
  const image = product.colors[0]?.images[0];
  return {
    title: name,
    description: tr(product.description, locale) || name,
    alternates: alternates(locale, `/product/${slug}`),
    openGraph: { title: name, images: image && !image.endsWith(".svg") ? [image] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [product, phrases, settings, all] = await Promise.all([getProductBySlug(slug), getPhrases(), getSettings(), getCatalogProducts()]);
  if (!product) notFound();
  const t = await getTranslations("product");
  const nav = await getTranslations("nav");

  const similar = all
    .filter((p) => p.id !== product.id)
    .sort((a, b) => Number(b.categoryId === product.categoryId) - Number(a.categoryId === product.categoryId) || Number(b.fit === product.fit) - Number(a.fit === product.fit))
    .slice(0, 8);

  const inStock = product.colors.some((c) => c.stock.some((s) => s.qty > 0));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: tr(product.name, locale),
    description: tr(product.description, locale),
    image: product.colors.flatMap((c) => c.images).map((i) => (i.startsWith("http") ? i : `${siteUrl()}${i}`)),
    brand: { "@type": "Brand", name: "Jadeeed" },
    offers: {
      "@type": "Offer",
      url: localeUrl(locale, `/product/${product.slug}`),
      priceCurrency: "UZS",
      price: product.pricing.price,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container-page pb-section pt-(--topbar-h) lg:pt-[calc(var(--header-h)+24px)]">
        <nav aria-label="breadcrumb" className="hidden py-4 text-body-sm text-muted lg:block">
          <Link href="/catalog" className="hover:text-ink">
            {nav("catalog")}
          </Link>
          {product.categoryName && product.categorySlug && (
            <>
              <span className="mx-2" aria-hidden>
                /
              </span>
              <Link href={{ pathname: "/catalog", query: { category: product.categorySlug } }} className="hover:text-ink">
                {tr(product.categoryName, locale)}
              </Link>
            </>
          )}
        </nav>
        <ProductView
          product={product}
          addedPhrase={phrases.slots.ADD_TO_CART}
          badgePhrase={phrases.slots.BADGE}
          supportUrl={settings.supportUrl}
        />
      </div>

      {similar.length > 0 && (
        <section className="border-t border-line py-section">
          <div className="container-page">
            <SectionHeading title={t("similar")} />
          </div>
          <div className="lg:container-page">
            <ProductRail products={similar} badgePhrase={phrases.slots.BADGE} />
          </div>
        </section>
      )}
    </>
  );
}
