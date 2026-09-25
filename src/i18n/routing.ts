import { defineRouting } from "next-intl/routing";

export const locales = ["uz", "ru"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "uz",
  // uz lives at "/", ru at "/ru"
  localePrefix: "as-needed",
  // the site always opens in Uzbek; the visitor's own choice is remembered in a cookie
  localeDetection: false,
  localeCookie: { name: "JADEEED_LOCALE", maxAge: 60 * 60 * 24 * 365 },
});
