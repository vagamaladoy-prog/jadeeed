import { AtlasPattern } from "@/components/atlas/atlas-pattern";
import { BrandPhrase } from "@/components/brand/brand-phrase";

/** Large brand phrase on atlas: the pattern fills the block, the phrase sits on a solid ink plate. */
export function AtlasPhraseBlock({ phrase }: { phrase: string }) {
  return (
    <section className="relative isolate overflow-hidden bg-ink">
      <div className="grid min-h-[70svh] lg:grid-cols-[5fr_7fr]">
        <div className="relative min-h-72 lg:min-h-0">
          <AtlasPattern variant="dense" interactive />
        </div>
        <div className="relative flex items-center bg-ink px-gutter py-20 lg:px-16">
          <BrandPhrase text={phrase} as="p" animate="write" className="text-display tracking-tighter text-white xl:text-display-xl xl:tracking-tightest" />
        </div>
      </div>
    </section>
  );
}
