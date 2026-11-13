import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";

export const LOOKS = [
  { src: "/photos/jd/look-ceiling.webp", alt: "Jadeeed — Siz o'shami? / Men o'sha" },
  { src: "/photos/jd/hero-siz-oshami.webp", alt: "Jadeeed — Siz o'shami? · Abdulla Qodiriy" },
  { src: "/photos/jd/qish-ash-brick.webp", alt: "Jadeeed — Men o'sha" },
  { src: "/photos/jd/look-pair-back.webp", alt: "Jadeeed — Men o'sha · Abdulla Qodiriy" },
] as const;

/** Lookbook teaser: four shoot photos cropped as the arched windows of the shoot. */
export async function LookbookTeaser() {
  const t = await getTranslations("jd.lookbook");
  return (
    <section className="py-section">
      <div className="container-page grid items-end gap-10 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-12">
        <Reveal>
          <h2 className="font-display text-display leading-none tracking-tighter">{t("title")}</h2>
          <p className="mt-4 max-w-xs font-display text-heading italic text-muted">{t("sub")}</p>
          <Link
            href="/lookbook"
            className="mt-7 inline-flex h-12 items-center gap-2 rounded border border-ink px-5 text-label uppercase tracking-[0.18em] transition-colors duration-[var(--dur-hover)] hover:border-anor hover:bg-anor hover:text-white"
          >
            {t("cta")} <span aria-hidden>›</span>
          </Link>
        </Reveal>
        <Stagger className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {LOOKS.map((l, i) => (
            <StaggerItem key={l.src} className={i % 2 ? "md:translate-y-8" : ""}>
              <Link href="/lookbook" className="group block" aria-label={`${t("title")} ${i + 1}`}>
                <div className="arch relative aspect-[3/4] bg-paper-2">
                  <Image
                    src={l.src}
                    alt={l.alt}
                    fill
                    sizes="(min-width: 768px) 20vw, 50vw"
                    className="object-cover transition-transform duration-[var(--dur-scene)] ease-out group-hover:scale-105"
                  />
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/** Decorative embroidered suzani border (cut from the suzani wall of the shoot) — above the footer. */
export function SuzaniBorder({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`h-12 bg-paper-2 md:h-16 ${className}`}
      style={{ backgroundImage: "url(/photos/jd/suzani-border.webp)", backgroundSize: "auto 100%", backgroundRepeat: "repeat-x" }}
    />
  );
}
