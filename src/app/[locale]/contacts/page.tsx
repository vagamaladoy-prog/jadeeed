import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSettings } from "@/lib/data";
import { alternates } from "@/lib/site";
import { PageHeader } from "@/components/layout/page-header";
import { ContactList } from "@/components/contact/contact-list";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("contactsTitle"), alternates: alternates(locale, "/contacts") };
}

export default async function Contacts({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("meta");
  const settings = await getSettings();
  return (
    <div className="container-page pb-section">
      <PageHeader title={t("contactsTitle")} />
      <div className="max-w-4xl">
        <ContactList settings={settings} />
      </div>
    </div>
  );
}
