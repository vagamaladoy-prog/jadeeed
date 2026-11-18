import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCatalogProducts } from "@/lib/data";
import { tr } from "@/lib/types";
import { WARDROBE_SHOTS } from "@/components/home/wardrobe-shots";
import { PageHeader } from "@/components/layout/page-header";
import { TryOnView, type TryOnGarment } from "@/components/try-on/try-on-view";

// test page: the AI fitting room (Qwen-Image-2.1 on ModelScope, src/lib/try-on.ts)
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tryOn" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

// wardrobe shot → product it belongs to (as on the home page rail)
const PRODUCT: Record<string, string> = {
  "men-osha": "men-osha",
  "aylanib-ketay": "aylanib-ketay",
  "siz-oshami": "siz-oshami",
  "men-osha-hoodie-black": "men-osha-xudi",
  "men-osha-hoodie-grey": "men-osha-xudi",
};

export default async function TryOnPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tryOn");
  const products = await getCatalogProducts();
  const pool: TryOnGarment[] = Object.entries(WARDROBE_SHOTS).map(([key, shots]) => {
    const p = products.find((x) => x.slug === PRODUCT[key]);
    return { key, name: p ? tr(p.name, locale) : key, src: shots.front.src, ratio: shots.front.ratio };
  });
  return (
    <div className="container-page pb-section">
      <PageHeader title={t("title")} subtitle={t("lead")} />
      <TryOnView pool={pool} />
    </div>
  );
}
