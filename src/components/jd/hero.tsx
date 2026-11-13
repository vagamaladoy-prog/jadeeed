"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { ui } from "@/lib/ui-store";
import { Boteh } from "./ornament";
import { cn } from "@/lib/cn";

const MEN = "Men o'sha";
const SIZ = "Siz o'shami?";

/**
 * Full-screen hero: the shoot photo breathes (very slow zoom), a giant serif "Men o'sha —Jadeeed"
 * sits on it exactly like the print. Hover (mouse) or tap turns it into its answer — "Siz o'shami?" —
 * and the photo changes to the girl wearing that print. The brand's signature interaction.
 */
export function Hero() {
  const t = useTranslations("jd.hero");
  const [asked, setAsked] = useState(false);

  // the desktop header lies transparent (white) over the photo
  useEffect(() => {
    ui.setBannerTone("DARK");
    return () => {
      ui.setBannerTone(null);
    };
  }, []);

  return (
    <section className="relative isolate flex h-[100svh] min-h-[600px] items-center justify-center overflow-hidden bg-ink text-paper">
      {/* photos */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="jd-zoom absolute inset-0">
          <Image
            src="/photos/jd/hero-men-osha.webp"
            alt=""
            fill
            priority
            quality={90}
            sizes="100vw"
            className={cn("object-cover object-[50%_28%] transition-opacity duration-[900ms] ease-out", asked && "opacity-0")}
          />
          <Image
            src="/photos/jd/hero-siz-oshami.webp"
            alt=""
            fill
            quality={90}
            sizes="100vw"
            className={cn("object-cover object-[30%_30%] opacity-0 transition-opacity duration-[900ms] ease-out", asked && "opacity-100")}
          />
        </div>
        {/* legibility: ink veil, deeper at the bottom (the page turns into the manifesto) */}
        <div className="absolute inset-0 bg-ink/35" />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/80 to-transparent" />
      </div>

      <Boteh className="absolute bottom-10 left-10 hidden h-28 w-28 -rotate-12 text-zafaron/80 lg:block" />

      <div className="container-page flex flex-col items-center pt-(--topbar-h) text-center lg:pt-(--header-h)">
        <h1 className="sr-only">Jadeeed — {MEN}</h1>
        <button
          type="button"
          aria-pressed={asked}
          aria-label={`${MEN} / ${SIZ}`}
          onClick={() => setAsked((v) => !v)}
          onPointerEnter={(e) => e.pointerType === "mouse" && setAsked(true)}
          onPointerLeave={(e) => e.pointerType === "mouse" && setAsked(false)}
          className="group relative grid animate-rise cursor-pointer select-none place-items-center outline-offset-8"
        >
          {[MEN, SIZ].map((p, i) => {
            const shown = (i === 1) === asked;
            return (
              <span
                key={p}
                aria-hidden
                className={cn(
                  "col-start-1 row-start-1 flex flex-col items-end transition-[opacity,transform,filter] duration-700 ease-out",
                  shown ? "opacity-100 blur-0" : "pointer-events-none translate-y-3 opacity-0 blur-sm",
                )}
              >
                <span className="font-display text-[clamp(64px,15vw,210px)] leading-[0.92] tracking-tighter [text-shadow:0_2px_40px_rgb(20_16_18/0.35)]">
                  “{p}”
                </span>
                <span className="mr-[0.6em] mt-1 font-sans text-[clamp(22px,3.4vw,48px)] font-light leading-none tracking-tight">—Jadeeed</span>
              </span>
            );
          })}
        </button>

        <p className="deco mt-8 animate-rise text-body-sm uppercase tracking-[0.35em] text-paper/90 [animation-delay:200ms] md:text-body">
          {t("tagline")}
        </p>
        <a
          href="#qodiriy-qish"
          className="mt-8 inline-flex h-12 animate-rise items-center gap-2 rounded border border-paper/70 px-6 text-label uppercase tracking-[0.2em] text-paper transition-colors duration-[var(--dur-hover)] [animation-delay:300ms] hover:border-anor hover:bg-anor"
        >
          {t("cta")} <span aria-hidden>›</span>
        </a>
        <p className="mt-4 text-micro uppercase tracking-[0.25em] text-paper/60 can-hover:hidden">{t("tap")} ↑</p>
      </div>

      <a
        href="#manifest"
        aria-label={t("scroll")}
        className="absolute bottom-[calc(var(--tabbar-h)+var(--safe-bottom)+16px)] right-4 hidden flex-col items-center gap-2 text-micro uppercase tracking-[0.25em] text-paper/70 hover:text-paper md:flex lg:bottom-8 lg:right-10"
      >
        <span className="grid h-10 w-6 place-items-start justify-center rounded-pill border border-paper/60 pt-2">
          <span className="block h-2 w-0.5 animate-bounce rounded-pill bg-paper" />
        </span>
        {t("scroll")}
        <ChevronDown aria-hidden className="size-3" />
      </a>
    </section>
  );
}
