import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DEFAULT_PHRASES, getPhrases } from "@/lib/data";
import { BrandPhrase } from "@/components/brand/brand-phrase";
import { Boteh } from "@/components/jd/ornament";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  const phrases = await getPhrases().catch(() => null);
  return (
    <div className="container-page flex min-h-[80svh] flex-col items-center justify-center gap-8 pb-section pt-[calc(var(--topbar-h)+48px)] text-center">
      <p className="label text-muted">404</p>
      <BrandPhrase text={phrases?.slots.WAITING ?? DEFAULT_PHRASES.WAITING} as="h1" animate="write" className="text-display-xl tracking-tightest" />
      <Boteh className="size-16 text-anor" />
      <p className="max-w-sm text-body text-muted">{t("text")}</p>
      <Button asChild size="lg">
        <Link href="/">{t("home")}</Link>
      </Button>
    </div>
  );
}
