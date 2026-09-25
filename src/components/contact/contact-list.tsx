"use client";
import { ArrowUpRight, MapPin, Phone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ExternalLink } from "./external-link";
import { InstagramIcon, TelegramIcon } from "./social-icons";
import { tr, type SettingsDTO } from "@/lib/types";
import { cn } from "@/lib/cn";

/** Support first and biggest, then channel and Instagram; phone/address only if set in admin. */
export function ContactList({ settings, variant = "cards" }: { settings: SettingsDTO; variant?: "cards" | "rows" }) {
  const t = useTranslations("contacts");
  const locale = useLocale();
  const channels = [
    { href: settings.supportUrl, icon: TelegramIcon, title: t("support"), handle: `@${settings.supportUsername}`, text: t("supportText"), main: true },
    { href: settings.channelUrl, icon: TelegramIcon, title: t("channel"), handle: `@${settings.channelUsername}`, text: t("channelText") },
    { href: settings.instagramUrl, icon: InstagramIcon, title: t("instagram"), handle: `@${settings.instagramUsername}`, text: t("instagramText") },
  ];

  return (
    <div className={cn(variant === "cards" ? "grid gap-3 md:grid-cols-2" : "flex flex-col")}>
      {channels.map((c) => {
        const Icon = c.icon;
        return (
          <ExternalLink
            key={c.href}
            href={c.href}
            className={cn(
              "group relative flex min-h-11 items-start gap-4 transition-colors duration-[var(--dur-hover)]",
              variant === "cards"
                ? cn(
                    "rounded border p-6",
                    c.main ? "border-ink bg-ink text-white hover:bg-navy md:col-span-2 md:p-8" : "border-line bg-white hover:border-ink",
                  )
                : "border-b border-line py-4",
            )}
          >
            <Icon className={cn("mt-1 size-6 shrink-0", c.main && variant === "cards" ? "text-white" : "text-navy")} />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className={cn("font-display font-light tracking-tight", c.main && variant === "cards" ? "text-heading-lg" : "text-heading")}>
                {c.title}
              </span>
              <span className={cn("text-body", c.main && variant === "cards" ? "text-white" : "text-ink")}>{c.handle}</span>
              <span className={cn("text-body-sm", c.main && variant === "cards" ? "text-on-ink-muted" : "text-muted")}>{c.text}</span>
            </span>
            <ArrowUpRight className="size-5 shrink-0 transition-transform duration-[var(--dur-hover)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </ExternalLink>
        );
      })}
      {(settings.phone || settings.address) && (
        <div className={cn("flex flex-col gap-3 text-body", variant === "cards" ? "rounded border border-line p-6 md:col-span-2" : "py-4")}>
          {settings.phone && (
            <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`} className="flex min-h-11 items-center gap-3 hover:text-navy">
              <Phone className="size-5 text-navy" />
              <span>
                <span className="sr-only">{t("phone")}: </span>
                {settings.phone}
              </span>
            </a>
          )}
          {settings.address && (
            <p className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-navy" />
              <span>
                {tr(settings.address, locale)}
                {settings.workHours && <span className="block text-body-sm text-muted">{tr(settings.workHours, locale)}</span>}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
