import { getTranslations, setRequestLocale } from "next-intl/server";
import { getBanners, getCatalogProducts, getCategories, getPhrases, getSettings } from "@/lib/data";
import { alternates } from "@/lib/site";
import { tr } from "@/lib/types";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { HomeQuestion } from "@/components/home/home-question";
import { Marquee } from "@/components/motion/marquee";
import { SectionHeading } from "@/components/home/section-heading";
import { ProductRail } from "@/components/home/product-rail";
import { Collections } from "@/components/home/collections";
import { AtlasPhraseBlock } from "@/components/home/atlas-phrase-block";
import { AboutBlock } from "@/components/home/about-block";
import { AtlasStrip } from "@/components/atlas/atlas-pattern";
import { ProductGrid } from "@/components/catalog/product-grid";
import { ContactList } from "@/components/contact/contact-list";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { alternates: alternates(locale, "/") };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const [banners, products, categories, phrases, settings] = await Promise.all([
    getBanners(),
    getCatalogProducts(),
    getCategories(),
    getPhrases(),
    getSettings(),
  ]);

  const fresh = [...products.filter((p) => p.isNew), ...products.filter((p) => !p.isNew && p.isFeatured)].slice(0, 10);
  const best = products.filter((p) => p.isBestseller).slice(0, 8);
  const cats = categories.filter((c) => c.productCount > 0);
  const aboutText = tr(settings.about, locale);

  return (
    <>
      {banners.length > 0 ? (
        <BannerCarousel banners={banners} />
      ) : (
        <div className="h-(--topbar-h) lg:h-(--header-h)" aria-hidden />
      )}

      <HomeQuestion phrase={phrases.slots.HOME_QUESTION} />
      <Marquee phrases={phrases.marquee} />

      {fresh.length > 0 && (
        <section className="py-section">
          <div className="container-page">
            <SectionHeading title={t("new")} link={{ href: { pathname: "/catalog", query: { sort: "new" } }, label: t("newAll") }} />
          </div>
          <div className="lg:container-page">
            <ProductRail products={fresh} badgePhrase={phrases.slots.BADGE} />
          </div>
        </section>
      )}

      <AtlasStrip />

      {cats.length > 0 && (
        <section className="container-page py-section">
          <SectionHeading title={t("collections")} link={{ href: "/catalog", label: t("toCatalog") }} />
          <Collections categories={cats} />
        </section>
      )}

      <AtlasPhraseBlock phrase={phrases.slots.ATLAS_BLOCK} />

      {best.length > 0 && (
        <section className="container-page py-section">
          <SectionHeading title={t("bestsellers")} />
          <ProductGrid products={best} badgePhrase={phrases.slots.BADGE} />
        </section>
      )}

      <AtlasStrip />

      {aboutText && <AboutBlock phrase={phrases.slots.ABOUT} title={t("about")} text={aboutText} more={t("aboutMore")} />}

      <section className="container-page pb-section">
        <SectionHeading title={t("contacts")} />
        <ContactList settings={settings} />
      </section>
    </>
  );
}
