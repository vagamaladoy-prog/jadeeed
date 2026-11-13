import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPhrases } from "@/lib/data";
import { alternates } from "@/lib/site";
import { Marquee } from "@/components/motion/marquee";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Boteh } from "@/components/jd/ornament";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("lookbookTitle"), description: t("lookbookDescription"), alternates: alternates(locale, "/lookbook") };
}

type Shot = { src: string; alt: string; wide?: boolean };

const CHAPTERS: { shots: Shot[]; suzani: string }[] = [
  {
    suzani: "/photos/jd/suzani-bukhara.webp",
    shots: [
      { src: "/photos/jd/look-ceiling.webp", alt: "Siz o'shami? / Men o'sha — under the carved ceiling" },
      { src: "/photos/jd/hero-men-osha.webp", alt: "Men o'sha — black and ash hoodies" },
      { src: "/photos/jd/qish-black-front.webp", alt: "Men o'sha — black hoodie" },
    ],
  },
  {
    suzani: "/photos/jd/suzani-anor.webp",
    shots: [
      { src: "/photos/jd/hero-siz-oshami.webp", alt: "Siz o'shami? and the Abdulla Qodiriy back print" },
      { src: "/photos/jd/look-column.webp", alt: "Siz o'shami? and Men o'sha by a carved column" },
      { src: "/photos/jd/look-pair-back.webp", alt: "Men o'sha and the Abdulla Qodiriy back print" },
    ],
  },
  {
    suzani: "/photos/jd/suzani-nurata.webp",
    shots: [
      { src: "/photos/jd/qish-ash-front.webp", alt: "Men o'sha — ash hoodie by the teal door" },
      { src: "/photos/jd/atmos-chest.webp", alt: "A carved chest and door", wide: true },
      { src: "/photos/jd/qish-ash-brick.webp", alt: "Men o'sha — ash hoodie, brick wall at sunset" },
      { src: "/photos/jd/qish-ash-suzani.webp", alt: "Men o'sha — in front of a suzani" },
      { src: "/photos/jd/atmos-wheels.webp", alt: "Old cart wheels" },
      { src: "/photos/jd/look-tees.webp", alt: "Aylanib ketay… and Men o'sha t-shirts" },
      { src: "/photos/jd/atmos-lattice.webp", alt: "Wooden lattice and brick" },
      { src: "/photos/jd/atmos-corridor.webp", alt: "The courtyard gallery" },
    ],
  },
];

export default async function Lookbook({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("jd.lookbook");
  const phrases = await getPhrases();
  const titles = t.raw("chapters") as string[];

  return (
    <>
      <header className="brick-grid relative overflow-hidden bg-ink pb-14 pt-[calc(var(--topbar-h)+40px)] text-paper md:pb-20 lg:pt-[calc(var(--header-h)+64px)]">
        <Boteh className="absolute -right-6 top-1/2 h-56 w-56 -translate-y-1/2 rotate-12 text-zafaron/25 md:right-10" />
        <div className="container-page relative animate-rise">
          <p className="deco text-body-sm uppercase text-zafaron">Qodiriy | Qish</p>
          <h1 className="mt-3 font-display text-display-xl leading-none tracking-tighter">{t("title")}</h1>
          <p className="mt-5 max-w-xl font-display text-heading italic text-on-ink-muted">{t("sub")}</p>
          <p className="mt-4 max-w-xl text-body text-on-ink-muted">{t("pageSub")}</p>
        </div>
      </header>

      {CHAPTERS.map((c, ci) => (
        <div key={c.suzani}>
          {/* full-bleed suzani with parallax — a page turning between chapters */}
          <div className="relative isolate flex h-[38svh] min-h-56 items-center justify-center overflow-hidden">
            <div aria-hidden className="jd-drift absolute inset-0 -z-10">
              <Image src={c.suzani} alt="" fill sizes="100vw" className="object-cover" />
            </div>
            <div aria-hidden className="absolute inset-0 -z-10 bg-ink/30" />
            <Reveal>
              <h2 className="px-6 text-center font-display text-display italic text-paper [text-shadow:0_2px_30px_rgb(20_16_18/0.6)]">
                <span className="deco mb-2 block text-body not-italic uppercase text-paper/80">{String(ci + 1).padStart(2, "0")}</span>
                {titles[ci]}
              </h2>
            </Reveal>
          </div>

          <Stagger className="container-page grid grid-cols-2 gap-3 py-section md:grid-cols-3 md:gap-5">
            {c.shots.map((s, i) => (
              <StaggerItem key={s.src} className={s.wide ? "col-span-2" : i % 3 === 1 ? "md:translate-y-10" : ""}>
                <div className={`relative overflow-hidden bg-paper-2 ${s.wide ? "aspect-[3/2] rounded" : "arch aspect-[3/4]"}`}>
                  <Image src={s.src} alt={s.alt} fill sizes={s.wide ? "(min-width: 768px) 66vw, 100vw" : "(min-width: 768px) 33vw, 50vw"} className="object-cover" />
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          {ci < CHAPTERS.length - 1 && <Marquee phrases={phrases.marquee} />}
        </div>
      ))}
    </>
  );
}
