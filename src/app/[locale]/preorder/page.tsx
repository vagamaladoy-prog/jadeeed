import { getTranslations, setRequestLocale } from "next-intl/server";
import { alternates } from "@/lib/site";
import { getCatalogProducts, getSettings } from "@/lib/data";
import { PageHeader } from "@/components/layout/page-header";
import { PreorderView, type PreorderProduct } from "@/components/preorder/preorder-view";
import { SIZES, type SizeCode } from "@/lib/types";

// sizes offered when a colour has none yet (kept in sync with PREORDER_DEFAULT_SIZES in lib/preorders)
const DEFAULT_SIZES: SizeCode[] = ["S", "M", "L", "XL", "XXL"];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("preorderTitle"), description: t("preorderDescription"), alternates: alternates(locale, "/preorder") };
}

export default async function PreorderPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, products, settings] = await Promise.all([getTranslations("preorder"), getCatalogProducts(), getSettings()]);

  // every visible product and colour — sold out included; every size the colour is made in
  const list: PreorderProduct[] = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.pricing.price,
    colors: p.colors.map((c) => {
      const sizes = c.stock.length ? c.stock.map((s) => s.size) : DEFAULT_SIZES;
      return {
        id: c.id,
        name: c.name,
        hex: c.hex,
        image: c.images[0] ?? null,
        sizes: SIZES.filter((s) => sizes.includes(s)).map((s) => ({ size: s, inStock: (c.stock.find((x) => x.size === s)?.qty ?? 0) > 0 })),
      };
    }),
  }));

  const note = locale === "ru" ? settings.preorder.note.ru : settings.preorder.note.uz;
  return (
    <div className="container-page pb-section">
      <PageHeader title={t("title")} subtitle={t("lead")} />
      <PreorderView products={list} enabled={settings.preorder.enabled} note={note} channelUrl={settings.channelUrl} />
    </div>
  );
}
