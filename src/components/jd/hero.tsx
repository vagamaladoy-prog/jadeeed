"use client";
import { useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { ui } from "@/lib/ui-store";

/**
 * Full-screen hero: the shoot photo breathes (very slow zoom) and speaks for itself — no text on it,
 * only the "Collection" button at the bottom (and a scroll cue on wider screens).
 */
export function Hero() {
  const t = useTranslations("jd.hero");

  // the desktop header lies transparent (white) over the photo
  useEffect(() => {
    ui.setBannerTone("DARK");
    return () => {
      ui.setBannerTone(null);
    };
  }, []);

  return (
    <section className="relative isolate flex h-[100svh] min-h-[560px] flex-col justify-end overflow-hidden bg-ink text-paper">
      <h1 className="sr-only">Jadeeed — Men o&apos;sha</h1>
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="jd-zoom absolute inset-0">
          <Image
            src="/photos/jd/hero-men-osha.webp"
            alt=""
            fill
            priority
            quality={90}
            sizes="100vw"
            className="object-cover object-[50%_28%]"
          />
        </div>
        {/* only a soft shade at the foot, so the button reads */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/70 to-transparent" />
      </div>

      <div className="container-page flex justify-center pb-[calc(var(--tabbar-h)+var(--safe-bottom)+28px)] lg:pb-14">
        <a
          href="#qodiriy-qish"
          className="inline-flex h-12 animate-rise items-center gap-2 glass-dark rounded-pill px-8 text-label uppercase tracking-[0.2em] text-paper hover:bg-anor/70"
        >
          {t("cta")} <span aria-hidden>›</span>
        </a>
      </div>

      <a
        href="#manifest"
        aria-label={t("scroll")}
        className="absolute bottom-14 right-10 hidden flex-col items-center gap-2 text-micro uppercase tracking-[0.25em] text-paper/70 hover:text-paper lg:flex"
      >
        <span className="grid h-10 w-6 place-items-start justify-center glass-dark rounded-pill pt-2">
          <span className="block h-2 w-0.5 animate-bounce rounded-pill bg-paper" />
        </span>
        {t("scroll")}
        <ChevronDown aria-hidden className="size-3" />
      </a>
    </section>
  );
}
