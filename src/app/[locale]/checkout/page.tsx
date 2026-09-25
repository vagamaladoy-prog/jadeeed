import { getTranslations, setRequestLocale } from "next-intl/server";
import { alternates } from "@/lib/site";
import { PageHeader } from "@/components/layout/page-header";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("checkoutTitle"), robots: { index: false }, alternates: alternates(locale, "/checkout") };
}

export default async function Checkout({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");
  return (
    <div className="container-page pb-section">
      <PageHeader title={t("title")} />
      <CheckoutForm />
    </div>
  );
}
