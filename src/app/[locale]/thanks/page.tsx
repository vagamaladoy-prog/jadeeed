import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPhrases, getSettings } from "@/lib/data";
import { ThanksView } from "@/components/checkout/thanks-view";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("thanksTitle"), robots: { index: false } };
}

export default async function Thanks({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [{ order }, phrases, settings] = await Promise.all([searchParams, getPhrases(), getSettings()]);
  const number = order && /^\d{1,9}$/.test(order) ? Number(order) : null;
  return <ThanksView phrase={phrases.slots.THANKS} number={number} channelUrl={settings.channelUrl} supportUrl={settings.supportUrl} />;
}
