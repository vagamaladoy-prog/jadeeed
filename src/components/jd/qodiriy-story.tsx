"use client";
import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Sheet } from "@/components/ui/sheet";
import { Reveal } from "@/components/motion/reveal";
import { QodiriyOrnament } from "./ornament";

type Event = { d: string; t: string };

function Timeline({ events, dense }: { events: Event[]; dense?: boolean }) {
  return (
    <ol className="relative flex flex-col">
      {/* the thread: a hairline, filled with saffron as the section scrolls by */}
      <span aria-hidden className="absolute bottom-3 left-[5px] top-3 w-px bg-line-on-ink" />
      <span aria-hidden className="jd-fill absolute bottom-3 left-[5px] top-3 w-px bg-zafaron" />
      {events.map((e, i) => (
        <li key={e.d} className={`relative flex gap-5 ${dense ? "py-3" : "py-4"}`}>
          <span
            aria-hidden
            className={`relative z-10 mt-1.5 size-[11px] shrink-0 rounded-pill border border-zafaron ${i % 2 ? "bg-ink" : "bg-zafaron"}`}
          />
          <div>
            <p className="deco text-subheading text-paper">{e.d}</p>
            <p className="mt-0.5 text-body-sm text-on-ink-muted">{e.t}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * Abdulla Qodiriy (1894–1938): a dark "page" with a faint brick grid. The back-print medallion in a
 * saffron arch, archival duotone (ink + saffron) of the courtyard, and a scroll-driven timeline whose
 * progress mark is the print's ornament, turning as you read. "Hayot yo'li" opens the whole life.
 */
export function QodiriyStory() {
  const t = useTranslations("jd.story");
  const [open, setOpen] = useState(false);
  const events = t.raw("events") as Event[];
  const key = (t.raw("key") as number[]).map((i) => events[i]);

  return (
    <section aria-labelledby="qodiriy-title" className="jd-story brick-grid relative isolate overflow-hidden bg-ink text-paper">
      {/* archival courtyard, duotone, fading into the page */}
      <div aria-hidden className="absolute inset-y-0 right-0 -z-10 hidden w-1/2 lg:block">
        <Image src="/photos/jd/qodiriy-corridor.webp" alt="" fill sizes="50vw" className="object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-ink/20" />
      </div>

      <div className="container-page grid items-center gap-10 py-section md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_minmax(0,0.8fr)] lg:gap-12">
        <Reveal className="relative mx-auto w-full max-w-[340px]">
          <div aria-hidden className="arch absolute -inset-x-5 -bottom-4 top-10 bg-zafaron/85" />
          <div className="arch relative aspect-[3/4] bg-ink-2">
            <Image src="/photos/jd/qodiriy-print.webp" alt={t("printAlt")} fill sizes="(min-width: 1024px) 26vw, 80vw" className="object-cover" />
          </div>
        </Reveal>

        <Reveal>
          <p className="deco text-body-sm uppercase text-zafaron">{t("eyebrow")}</p>
          <h2 id="qodiriy-title" className="mt-3 font-display text-display italic leading-none tracking-tighter">
            Abdulla Qodiriy
          </h2>
          <p className="mt-2 font-display text-heading italic text-on-ink-muted">({t("years")})</p>
          <p className="mt-6 max-w-md text-body text-paper/85 md:text-subheading">{t("text")}</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-8 inline-flex h-12 items-center gap-2 rounded border border-zafaron px-5 text-label uppercase tracking-[0.18em] text-zafaron transition-colors duration-[var(--dur-hover)] hover:bg-zafaron hover:text-ink"
          >
            {t("cta")} <span aria-hidden>›</span>
          </button>
        </Reveal>

        <div className="relative md:col-span-2 lg:col-span-1">
          <QodiriyOrnament aria-hidden className="jd-spin absolute -right-6 -top-14 size-28 text-zafaron/70 lg:-right-2" />
          <Timeline events={key} />
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen} title={`Abdulla Qodiriy · ${t("years")}`} side="right">
        <div className="brick-grid mb-6 rounded bg-ink px-5 py-3 text-paper">
          <Timeline events={events} dense />
        </div>
      </Sheet>
    </section>
  );
}
