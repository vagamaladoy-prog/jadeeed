import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";

const PANELS = [
  { src: "/photos/jd/suzani-anor.webp", tone: "bg-anor" },
  { src: "/photos/jd/suzani-firuza.webp", tone: "bg-firuza" },
  { src: "/photos/jd/suzani-zafaron.webp", tone: "bg-gisht" },
] as const;

/**
 * Manifesto: three huge words, each over its own suzani (pomegranate, teal, saffron). The cloth
 * drifts and settles as it scrolls through the screen ("comes alive"). On phones every word gets
 * its own screen; on desktop they stand side by side like a triptych.
 * Then a dark page with the line about the Jadids and why the brand exists.
 */
export async function Manifesto() {
  const t = await getTranslations("jd.manifesto");
  const words = t.raw("words") as { w: string; s: string }[];
  return (
    <section id="manifest" aria-label={words.map((w) => w.w).join(" · ")} className="scroll-mt-0">
      <div className="grid md:grid-cols-3">
        {words.map((w, i) => (
          <div key={w.w} className={`relative isolate flex h-[72svh] items-center justify-center overflow-hidden md:h-[min(62vh,620px)] ${PANELS[i].tone}`}>
            <div aria-hidden className="jd-drift absolute inset-0 -z-10">
              <Image src={PANELS[i].src} alt="" fill sizes="(min-width: 768px) 34vw, 100vw" className="object-cover" />
            </div>
            <div aria-hidden className="absolute inset-0 -z-10 bg-ink/25" />
            <Reveal className="px-6 text-center">
              <p className="font-display text-[clamp(56px,13vw,88px)] leading-none tracking-tighter text-paper [text-shadow:0_2px_30px_rgb(20_16_18/0.55)] md:text-[clamp(44px,5.4vw,92px)]">
                {w.w}
              </p>
              <p className="deco mt-4 text-body uppercase text-paper/90 [text-shadow:0_1px_12px_rgb(20_16_18/0.7)]">{w.s}</p>
            </Reveal>
          </div>
        ))}
      </div>

      <div className="brick-grid bg-ink text-paper">
        <div className="container-page py-section">
          <Reveal className="flex items-center gap-6">
            <span aria-hidden className="hidden h-px flex-1 bg-line-on-ink md:block" />
            <p className="max-w-4xl text-center font-display text-heading italic leading-snug md:text-heading-lg">{t("quote")}</p>
            <span aria-hidden className="hidden h-px flex-1 bg-line-on-ink md:block" />
          </Reveal>
          <Reveal className="mx-auto mt-8 max-w-2xl text-center text-body text-on-ink-muted md:text-subheading">
            <p>{t("text")}</p>
            <p aria-hidden className="mt-6 text-zafaron">✦ ✦ ✦</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
