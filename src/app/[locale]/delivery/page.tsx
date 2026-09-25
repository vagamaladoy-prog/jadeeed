import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSettings } from "@/lib/data";
import { alternates } from "@/lib/site";
import { tr } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { RichText } from "@/components/layout/rich-text";
import { Reveal } from "@/components/motion/reveal";
import { ContactList } from "@/components/contact/contact-list";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("deliveryTitle"), alternates: alternates(locale, "/delivery") };
}

export default async function Delivery({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("meta");
  const settings = await getSettings();
  return (
    <div className="container-page pb-section">
      <PageHeader title={t("deliveryTitle")} />
      <div className="grid gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <RichText text={tr(settings.delivery, locale)} className="flex flex-col gap-6 text-subheading leading-relaxed" />
        </Reveal>
        <div className="lg:col-span-4 lg:col-start-9">
          <ContactList settings={settings} variant="rows" />
        </div>
      </div>
    </div>
  );
}
