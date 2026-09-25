"use client";
import type { ComponentProps } from "react";
import { useTelegram } from "@/components/telegram/telegram-provider";

/**
 * Link to Telegram / Instagram. Inside the Mini App it opens via
 * Telegram.WebApp.openTelegramLink() so the user never leaves Telegram;
 * in a browser — a normal link in a new tab.
 */
export function ExternalLink({ href, onClick, ...props }: ComponentProps<"a"> & { href: string }) {
  const { isMiniApp, openLink } = useTelegram();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        onClick?.(e);
        if (isMiniApp) {
          e.preventDefault();
          openLink(href);
        }
      }}
      {...props}
    />
  );
}
