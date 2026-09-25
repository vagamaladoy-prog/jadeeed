import { AtlasPattern } from "@/components/atlas/atlas-pattern";
import { BrandPhrase } from "@/components/brand/brand-phrase";

/**
 * The first thing a visitor reads: "Siz o'shami?" written letter by letter on a warm plate,
 * over dense atlas that slowly flows down and shifts with the cursor (scroll on phones).
 */
export function HomeQuestion({ phrase }: { phrase: string }) {
  return (
    <section className="relative isolate overflow-hidden bg-ink py-20 md:py-28 lg:py-36">
      <AtlasPattern variant="dense" interactive />
      <div className="container-page relative flex justify-center">
        <div className="bg-paper px-6 py-10 text-center md:px-16 md:py-16">
          <BrandPhrase text={phrase} as="h1" animate="write" trigger="load" className="text-display-xl tracking-tightest text-ink" />
        </div>
      </div>
    </section>
  );
}
