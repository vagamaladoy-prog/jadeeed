import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPhrases } from "@/lib/data";
import { alternates } from "@/lib/site";
import { PageHeader } from "@/components/layout/page-header";
import { CartPage } from "@/components/cart/cart-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("cartTitle"), robots: { index: false }, alternates: alternates(locale, "/cart") };
}

export default async function Cart({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("cart");
  const phrases = await getPhrases();
  return (
    <div className="container-page pb-section">
      <PageHeader title={t("title")} />
      <CartPage waitingPhrase={phrases.slots.WAITING} />
    </div>
  );
}
