"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Sheet } from "@/components/ui/sheet";
import { Reveal } from "@/components/motion/reveal";
import { QodiriyOrnament } from "./ornament";
import { cn } from "@/lib/cn";

type Tone = "black" | "ash";
const TONES: { id: Tone; hex: string }[] = [
  { id: "black", hex: "#141012" },
  { id: "ash", hex: "#C9C7C2" },
];

/** Each page of the "book": a photo per colour; `back` = hover flips front print → back print. */
const PAGES: { key: string; label: string; img: Record<Tone, string>; back?: Record<Tone, string> }[] = [
  {
    key: "front",
    label: "“Men o'sha”",
    img: { black: "/photos/jd/qish-black-front.webp", ash: "/photos/jd/qish-ash-front.webp" },
    back: { black: "/photos/jd/qish-black-back.webp", ash: "/photos/jd/qish-ash-back.webp" },
  },
  {
    key: "back",
    label: "Abdulla Qodiriy",
    img: { black: "/photos/jd/qish-black-back.webp", ash: "/photos/jd/qish-ash-back.webp" },
    back: { black: "/photos/jd/qish-black-front.webp", ash: "/photos/jd/qish-ash-front.webp" },
  },
  { key: "look", label: "Qish", img: { black: "/photos/jd/hero-men-osha.webp", ash: "/photos/jd/qish-ash-brick.webp" } },
  { key: "look2", label: "Jadeeed", img: { black: "/photos/jd/look-column.webp", ash: "/photos/jd/qish-ash-suzani.webp" } },
  { key: "look3", label: "Siz o'shami?", img: { black: "/photos/jd/look-pair-back.webp", ash: "/photos/jd/look-ceiling.webp" } },
];

/**
 * Collection "Qodiriy | Qish": hoodies shown as pages of a book in arch windows that scroll
 * sideways. Colour dots switch every photo to that colour; hover (mouse) flips the front print
 * to the back print; "story behind this print" opens a side panel.
 */
export function Qish() {
  const t = useTranslations("jd.qish");
  const [tone, setTone] = useState<Tone>("black");
  const [story, setStory] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const page = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-page]");
    el.scrollBy({ left: dir * ((card?.offsetWidth ?? 240) + 16), behavior: "smooth" });
  };

  return (
    <section id="qodiriy-qish" className="scroll-mt-16 overflow-hidden py-section lg:scroll-mt-20">
      <div className="container-page grid items-center gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-12">
        <Reveal>
          <p className="deco text-body-sm uppercase text-firuza">{t("eyebrow")}</p>
          <h2 className="mt-3 font-display text-display leading-none tracking-tighter">
            Qodiriy <span className="font-light text-muted">|</span> <em>Qish</em>
          </h2>
          <p className="mt-5 max-w-sm text-body text-muted">{t("text")}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/preorder"
              className="inline-flex h-12 items-center gap-2 rounded border border-ink px-5 text-label uppercase tracking-[0.18em] transition-colors duration-[var(--dur-hover)] hover:border-anor hover:bg-anor hover:text-white"
            >
              {t("cta")} <span aria-hidden>›</span>
            </Link>
            <button
              type="button"
              onClick={() => setStory(true)}
              className="inline-flex h-12 items-center gap-2 px-1 text-body-sm font-medium text-anor underline-offset-4 hover:underline"
            >
              <BookOpen className="size-4" aria-hidden />
              {t("story")}
            </button>
          </div>
          <div className="mt-6 flex items-center gap-1" role="radiogroup" aria-label={t("black") + " / " + t("ash")}>
            {TONES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={tone === c.id}
                aria-label={t(c.id)}
                title={t(c.id)}
                onClick={() => setTone(c.id)}
                className="grid size-11 place-items-center rounded-pill"
              >
                <span
                  className={cn(
                    "block size-5 rounded-pill border border-line transition-shadow",
                    tone === c.id && "ring-2 ring-anor ring-offset-2 ring-offset-paper",
                  )}
                  style={{ backgroundColor: c.hex }}
                />
              </button>
            ))}
            <span className="ml-2 text-body-sm text-muted">{t(tone)}</span>
          </div>
        </Reveal>

        <div className="relative -mx-gutter lg:mx-0">
          <div
            ref={track}
            className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-gutter px-gutter pb-2 lg:scroll-px-0 lg:px-0"
          >
            {PAGES.map((p, i) => (
              <Link
                key={p.key}
                href="/preorder"
                data-page
                className="group w-[62vw] max-w-[260px] shrink-0 snap-start sm:w-[42vw] lg:w-[calc((100%-48px)/4)] lg:max-w-none"
                aria-label={`${p.label} — ${t(tone)}`}
              >
                <div className="arch relative aspect-[3/4] bg-paper-2 [transform-style:preserve-3d]">
                  {TONES.map((c) => (
                    <div
                      key={c.id}
                      className={cn("absolute inset-0 transition-opacity duration-500", tone === c.id ? "opacity-100" : "opacity-0")}
                    >
                      <Image
                        src={p.img[c.id]}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 22vw, 62vw"
                        priority={false}
                        loading={i < 4 && c.id === "black" ? "eager" : "lazy"}
                        className="object-cover transition-transform duration-[var(--dur-scene)] ease-out group-hover:scale-105"
                      />
                      {p.back && (
                        <Image
                          src={p.back[c.id]}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 22vw, 62vw"
                          className="object-cover opacity-0 transition-opacity duration-500 can-hover:group-hover:opacity-100"
                        />
                      )}
                    </div>
                  ))}
                  <span className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-ink/10" aria-hidden />
                </div>
                <p className="deco mt-3 text-center text-body-sm uppercase text-ink">
                  {p.label}
                  {p.back && <span className="sr-only"> — {t("flip")}</span>}
                </p>
              </Link>
            ))}
          </div>
          <button
            type="button"
            onClick={() => page(-1)}
            aria-label={t("prev")}
            className="absolute -left-6 top-[42%] hidden size-11 -translate-y-1/2 place-items-center rounded-pill border border-ink/40 bg-paper/80 transition-colors hover:border-anor hover:bg-anor hover:text-white xl:grid"
          >
            <ArrowLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => page(1)}
            aria-label={t("next")}
            className="absolute -right-6 top-[42%] hidden size-11 -translate-y-1/2 place-items-center rounded-pill border border-ink/40 bg-paper/80 transition-colors hover:border-anor hover:bg-anor hover:text-white xl:grid"
          >
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>

      <Sheet open={story} onOpenChange={setStory} title={t("storyTitle")} side="right">
        <div className="flex flex-col gap-5 pb-8">
          <div className="grid place-items-center rounded bg-ink py-8 text-zafaron">
            <QodiriyOrnament className="size-40" />
          </div>
          {(t.raw("storyText") as string[]).map((p) => (
            <p key={p} className="text-body text-ink">
              {p}
            </p>
          ))}
        </div>
      </Sheet>
    </section>
  );
}
