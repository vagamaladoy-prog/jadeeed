import type { Metadata, Viewport } from "next";
import { Onest, Unbounded } from "next/font/google";
import { Toaster } from "sonner";
import "../globals.css";

// Admin is its own root layout (the storefront root layout lives in [locale]).
const onest = Onest({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-onest", display: "swap" });
// accent font — only for brand-phrase previews
const unbounded = Unbounded({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-unbounded",
  display: "swap",
  weight: ["300", "400"],
});

export const metadata: Metadata = {
  title: "Jadeeed — админка",
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${onest.variable} ${unbounded.variable}`}>
      <body className="min-h-dvh bg-paper font-sans text-ink">
        {children}
        <Toaster
          position="top-center"
          closeButton
          toastOptions={{
            unstyled: true,
            classNames: {
              toast:
                "flex w-full items-start gap-3 rounded border border-ink bg-ink px-4 py-3 text-body-sm text-white sm:w-[360px]",
              error: "border-ink bg-white text-ink",
              title: "font-medium",
              description: "text-body-sm opacity-80",
              closeButton: "border-line bg-white text-ink",
            },
          }}
        />
      </body>
    </html>
  );
}
