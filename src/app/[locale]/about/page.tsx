import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPhrases, getSettings } from "@/lib/data";
import { alternates } from "@/lib/site";
import { tr } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { RichText } from "@/components/layout/rich-text";
import { BrandPhrase } from "@/components/brand/brand-phrase";
import { AtlasPattern, AtlasStrip } from "@/components/atlas/atlas-pattern";
import { Reveal } from "@/components/motion/reveal";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("aboutTitle"), alternates: alternates(locale, "/about") };
}

export default async function About({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("meta");
  const [settings, phrases] = await Promise.all([getSettings(), getPhrases()]);
  return (
    <>
      <div className="container-page">
        <PageHeader title={t("aboutTitle")} />
      </div>
      <section className="relative isolate overflow-hidden bg-ink py-20 md:py-28">
        <AtlasPattern variant="dense" interactive />
        <div className="container-page relative flex justify-center">
          <div className="bg-ink px-6 py-8 md:px-14 md:py-12">
            <BrandPhrase text={phrases.slots.ABOUT} as="p" animate="write" className="text-display-xl tracking-tightest text-white" />
          </div>
        </div>
      </section>
      <div className="container-page grid py-section lg:grid-cols-12">
        <Reveal className="lg:col-span-7 lg:col-start-4">
          <RichText text={tr(settings.about, locale)} className="flex flex-col gap-6 text-subheading leading-relaxed" />
        </Reveal>
      </div>
      <AtlasStrip />
    </>
  );
}
