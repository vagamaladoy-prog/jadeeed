import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPhrases } from "@/lib/data";
import { BrandPhrase } from "@/components/brand/brand-phrase";
import { AtlasStrip } from "@/components/atlas/atlas-pattern";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  const phrases = await getPhrases().catch(() => null);
  return (
    <div className="container-page flex min-h-[80svh] flex-col items-center justify-center gap-8 pb-section pt-[calc(var(--topbar-h)+48px)] text-center">
      <p className="label text-muted">404</p>
      <BrandPhrase text={phrases?.slots.WAITING ?? "Aylanib kelay..."} as="h1" animate="write" className="text-display-xl tracking-tightest" />
      <AtlasStrip className="max-w-xs" />
      <p className="max-w-sm text-body text-muted">{t("text")}</p>
      <Button asChild size="lg">
        <Link href="/">{t("home")}</Link>
      </Button>
    </div>
  );
}
