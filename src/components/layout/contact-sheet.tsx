"use client";
import { useTranslations } from "next-intl";
import { useRouteChange } from "@/hooks/use-route-change";
import { Sheet } from "@/components/ui/sheet";
import { ContactList } from "@/components/contact/contact-list";
import { ui, useUi } from "@/lib/ui-store";
import type { SettingsDTO } from "@/lib/types";

/** Phone "Aloqa" tab: support, channel, Instagram in a bottom sheet. */
export function ContactSheet({ settings }: { settings: SettingsDTO }) {
  const t = useTranslations("nav");
  const open = useUi((s) => s.contact);
  useRouteChange(() => ui.setContact(false));
  return (
    <Sheet open={open} onOpenChange={ui.setContact} title={t("contact")}>
      <ContactList settings={settings} variant="rows" />
    </Sheet>
  );
}
