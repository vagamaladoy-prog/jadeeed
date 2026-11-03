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
import { Wardrobe } from "@/components/home/wardrobe";
import { WARDROBE_SHOTS } from "@/components/home/wardrobe-shots";
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
  const tNav = await getTranslations("nav");

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
  // the rail: 2 hangers per shot pair (scripts/process-wardrobe.mjs); hoodies have no product yet → "Men o'sha"
  const hoodie = locale === "ru" ? "Худи «Men o'sha»" : 'Xudi "Men o\'sha"';
  const rail = [
    { shot: "men-osha", slug: "men-osha" },
    { shot: "aylanib-ketay", slug: "aylanib-ketay" },
    { shot: "siz-oshami", slug: "siz-oshami" },
    { shot: "men-osha-hoodie-black", slug: "men-osha", name: hoodie },
    { shot: "men-osha-hoodie-grey", slug: "men-osha", name: hoodie },
  ];
  const wardrobe = rail.flatMap(({ shot, slug, name }) => {
    const p = products.find((x) => x.slug === slug);
    const shots = WARDROBE_SHOTS[shot];
    return p && shots ? Array.from({ length: 2 }, () => ({ slug, name: name ?? tr(p.name, locale), ...shots })) : [];
  });

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

      {wardrobe.length > 0 && (
        <section className="overflow-hidden py-section">
          <div className="container-page">
            <SectionHeading title={t("wardrobe")} eyebrow={t("wardrobeHint")} />
          </div>
          <Wardrobe
            items={wardrobe}
            turnLabel={t("wardrobeTurn")}
            openLabel={t("wardrobeOpen")}
            prevLabel={tNav("prev")}
            nextLabel={tNav("next")}
          />
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
