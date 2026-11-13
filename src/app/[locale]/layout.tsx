import type { Metadata, Viewport } from "next";
import { Cormorant_SC, Great_Vibes, Manrope, Playfair_Display } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getCategories, getPhrases, getSettings } from "@/lib/data";
import { siteUrl } from "@/lib/site";
import { Providers } from "@/components/layout/providers";
import { Header } from "@/components/layout/header";
import { TabBar } from "@/components/layout/tab-bar";
import { Footer } from "@/components/layout/footer";
import { FlyLayer, PhraseToast } from "@/components/layout/overlays";
import { LazyOverlays } from "@/components/layout/lazy-overlays";
import { Preloader, BOOT_SCRIPT } from "@/components/layout/preloader";
import { SmoothScroll } from "@/components/layout/smooth-scroll";
import "../globals.css";

// "Jadid manuscript" type (DESIGN.md §2): Manrope body, Playfair Display headlines/quotes,
// Great Vibes script for emotional accents ("Aylanib ketay…"), Cormorant SC for small Art-Deco labels and dates.
// All cover Latin-Ext + Cyrillic. Not preloaded: the banner image (LCP) gets the bandwidth first;
// text shows at once in a metric-matched fallback and swaps; each subset loads only when used.
const manrope = Manrope({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-manrope", display: "swap", preload: false });
const playfair = Playfair_Display({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-playfair", display: "swap", preload: false });
const script = Great_Vibes({ subsets: ["latin", "latin-ext", "cyrillic"], weight: "400", variable: "--font-script-face", display: "swap", preload: false });
const cormorant = Cormorant_SC({ subsets: ["latin", "latin-ext", "cyrillic"], weight: ["500", "600"], variable: "--font-cormorant", display: "swap", preload: false });

export const revalidate = 300;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#E6D5B8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: t("title"), template: "%s · Jadeeed" },
    description: t("description"),
    applicationName: "Jadeeed",
    openGraph: { siteName: "Jadeeed", locale: locale === "ru" ? "ru_RU" : "uz_UZ", type: "website" },
    alternates: {
      canonical: locale === "uz" ? "/" : "/ru",
      languages: { uz: "/", ru: "/ru", "x-default": "/" },
    },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [settings, phrases, categories] = await Promise.all([getSettings(), getPhrases(), getCategories()]);
  const nav = await getTranslations({ locale, namespace: "nav" });
  const visibleCategories = categories.filter((c) => c.productCount > 0);

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Jadeeed",
    url: siteUrl(),
    logo: `${siteUrl()}/brand/logo-light.png`,
    sameAs: [settings.instagramUrl, settings.channelUrl],
    contactPoint: [{ "@type": "ContactPoint", contactType: "customer support", url: settings.supportUrl }],
  };

  return (
    <html lang={locale} className={`${manrope.variable} ${playfair.variable} ${script.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </head>
      <body className="grain min-h-dvh bg-paper font-sans text-ink">
        <a
          href="#main"
          className="sr-only z-[100] rounded bg-ink px-4 py-3 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          {nav("skipToContent")}
        </a>
        <NextIntlClientProvider>
          <Providers>
            <Preloader phrase={phrases.slots.WAITING} />
            <SmoothScroll />
            <Header />
            <main id="main">{children}</main>
            <Footer settings={settings} categories={visibleCategories} locale={locale} phrase={phrases.slots.HOME_QUESTION} />
            <TabBar />
            <LazyOverlays waitingPhrase={phrases.slots.WAITING} categories={visibleCategories} settings={settings} />
            <PhraseToast />
            <FlyLayer />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
