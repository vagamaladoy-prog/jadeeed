import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { BrandPhrase } from "@/components/brand/brand-phrase";
import { Reveal } from "@/components/motion/reveal";
import { AtlasPattern } from "@/components/atlas/atlas-pattern";

/** "O brende" on the home page — the answer "Men o'sha." + the first paragraph of the About text. */
export function AboutBlock({ phrase, title, text, more }: { phrase: string; title: string; text: string; more: string }) {
  const first = text.split(/\n\s*\n/)[0] ?? "";
  return (
    <section className="relative isolate overflow-hidden py-section">
      <AtlasPattern variant="light" flow={false} className="[mask-image:linear-gradient(to_right,black,transparent_45%)] max-lg:hidden" />
      <div className="container-page relative grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="label mb-4 text-muted">{title}</p>
          <BrandPhrase text={phrase} as="h2" animate="write" className="text-display tracking-tighter" />
        </div>
        <Reveal className="flex flex-col gap-6 lg:col-span-6 lg:col-start-7 lg:pt-10" delay={0.15}>
          <p className="text-subheading leading-relaxed text-ink">{first}</p>
          <Link href="/about" className="group flex min-h-11 w-fit items-center gap-2 text-body font-medium text-navy underline-offset-4 hover:underline">
            {more}
            <ArrowRight className="size-4 transition-transform duration-[var(--dur-hover)] group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
