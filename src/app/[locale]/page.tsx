import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCatalogProducts, getPhrases } from "@/lib/data";
import { alternates } from "@/lib/site";
import { tr } from "@/lib/types";
import { Marquee } from "@/components/motion/marquee";
import { SectionHeading } from "@/components/home/section-heading";
import { ProductRail } from "@/components/home/product-rail";
import { Wardrobe } from "@/components/home/wardrobe";
import { WARDROBE_SHOTS } from "@/components/home/wardrobe-shots";
import { Hero } from "@/components/jd/hero";
import { Manifesto } from "@/components/jd/manifesto";
import { Qish } from "@/components/jd/qish";
import { QodiriyStory } from "@/components/jd/qodiriy-story";
import { LookbookTeaser } from "@/components/jd/lookbook";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return { alternates: alternates(locale, "/") };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tNav = await getTranslations("nav");

  const [products, phrases] = await Promise.all([getCatalogProducts(), getPhrases()]);

  const fresh = [...products.filter((p) => p.isNew), ...products.filter((p) => !p.isNew && p.isFeatured)].slice(0, 10);
  const hoodies = products.filter((p) => p.categorySlug === "xudilar");
  // the rail: 2 hangers per shot pair (scripts/process-wardrobe.mjs); each hanger opens its own product
  const rail = [
    { shot: "men-osha", slug: "men-osha" },
    { shot: "aylanib-ketay", slug: "aylanib-ketay" },
    { shot: "siz-oshami", slug: "siz-oshami" },
    { shot: "men-osha-hoodie-black", slug: "men-osha-xudi" },
    { shot: "men-osha-hoodie-grey", slug: "men-osha-xudi" },
  ];
  const wardrobe = rail.flatMap(({ shot, slug }) => {
    const p = products.find((x) => x.slug === slug);
    const shots = WARDROBE_SHOTS[shot];
    return p && shots ? Array.from({ length: 2 }, () => ({ slug, name: tr(p.name, locale), ...shots })) : [];
  });

  // "turning pages": photo → suzani + ink → paper → ink → paper → ink → paper → suzani border → ink footer
  return (
    <>
      <Hero />
      <Manifesto />
      <Qish products={hoodies} />

      {wardrobe.length > 0 && (
        <section className="relative isolate overflow-hidden py-section">
          {/* backdrop: carved door, chest and brick of the shoot, warm sepia — a Jadid house behind the rail */}
          <div aria-hidden className="absolute inset-0 -z-10">
            <Image src="/photos/jd/wardrobe-backdrop.webp" alt="" fill sizes="100vw" className="object-cover object-center" />
            <div className="absolute inset-0 bg-paper/45" />
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-paper to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-paper to-transparent" />
          </div>
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

      <QodiriyStory />

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

      <Marquee phrases={phrases.marquee} />
      <LookbookTeaser />
    </>
  );
}
