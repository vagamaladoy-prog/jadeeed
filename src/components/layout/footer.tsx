import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AtlasPattern } from "@/components/atlas/atlas-pattern";
import { ExternalLink } from "@/components/contact/external-link";
import { InstagramIcon, TelegramIcon } from "@/components/contact/social-icons";
import { FooterWordmark } from "./footer-wordmark";
import { tr, type CategoryDTO, type SettingsDTO } from "@/lib/types";

export async function Footer({
  settings,
  categories,
  locale,
  phrase,
}: {
  settings: SettingsDTO;
  categories: CategoryDTO[];
  locale: string;
  /** brand phrase (from DB) shown in the bottom line */
  phrase: string;
}) {
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");
  const c = await getTranslations("contacts");

  const socials = [
    { href: settings.supportUrl, icon: TelegramIcon, label: c("support"), handle: `@${settings.supportUsername}` },
    { href: settings.channelUrl, icon: TelegramIcon, label: c("channel"), handle: `@${settings.channelUsername}` },
    { href: settings.instagramUrl, icon: InstagramIcon, label: c("instagram"), handle: `@${settings.instagramUsername}` },
  ];

  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      {/* dense atlas band — decorative, no text on it */}
      <div className="relative h-24 md:h-32">
        <AtlasPattern variant="dense" scale={0.6} interactive />
      </div>

      <div className="container-page grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-5">
          <p className="label text-on-ink-muted">{c("support")}</p>
          <ul className="mt-5 flex flex-col gap-1">
            {socials.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.href}>
                  <ExternalLink
                    href={s.href}
                    className="group flex min-h-11 items-center gap-4 py-1 transition-colors duration-[var(--dur-hover)] hover:text-white"
                  >
                    <Icon className="size-5 text-on-ink-muted transition-colors duration-[var(--dur-hover)] group-hover:text-white" />
                    <span className="text-body">{s.label}</span>
                    <span className="text-body-sm text-on-ink-muted">{s.handle}</span>
                  </ExternalLink>
                </li>
              );
            })}
          </ul>
        </div>

        <nav aria-label={t("shop")} className="md:col-span-3">
          <p className="label text-on-ink-muted">{t("shop")}</p>
          <ul className="mt-5 flex flex-col gap-1">
            <li>
              <Link href="/catalog" className="flex min-h-11 items-center text-body hover:underline hover:underline-offset-4">
                {nav("catalog")}
              </Link>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={{ pathname: "/catalog", query: { category: cat.slug } }}
                  className="flex min-h-11 items-center text-body text-on-ink-muted hover:text-white"
                >
                  {tr(cat.name, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t("info")} className="md:col-span-4">
          <p className="label text-on-ink-muted">{t("info")}</p>
          <ul className="mt-5 flex flex-col gap-1">
            {(["about", "delivery", "contacts"] as const).map((k) => (
              <li key={k}>
                <Link href={`/${k}`} className="flex min-h-11 items-center text-body hover:underline hover:underline-offset-4">
                  {nav(k)}
                </Link>
              </li>
            ))}
          </ul>
          {settings.phone && (
            <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`} className="mt-4 flex min-h-11 items-center text-body text-on-ink-muted hover:text-white">
              {settings.phone}
            </a>
          )}
        </nav>
      </div>

      <FooterWordmark />

      <div className="container-page flex items-center justify-between border-t border-line-on-ink py-6 pb-[calc(var(--tabbar-h)+var(--safe-bottom)+24px)] text-body-sm text-on-ink-muted lg:pb-6">
        <span>{t("rights", { year: new Date().getFullYear() })}</span>
        <span className="phrase">{phrase}</span>
      </div>
    </footer>
  );
}
