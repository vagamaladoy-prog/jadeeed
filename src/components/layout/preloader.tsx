import { ATLAS_TILE } from "@/components/atlas/tiles";

/**
 * First-visit preloader (≤ 1.2 s): an atlas strip "stitches" left→right, "Aylanib ketay..." below.
 * Rendered on the server but shown only when <html data-preload> is set by the inline boot
 * script (first visit in this session, not in the Telegram Mini App, motion allowed).
 * Pure CSS so it never blocks hydration or LCP.
 */
export function Preloader({ phrase }: { phrase: string }) {
  return (
    <div aria-hidden className="preloader fixed inset-0 z-[100] hidden flex-col items-center justify-center gap-6 bg-paper">
      <div className="h-4 w-[min(320px,70vw)] overflow-hidden">
        <div
          className="h-full w-full origin-left animate-preloader-stitch"
          style={{ backgroundImage: "url(/atlas/ikat-strip.webp)", backgroundSize: `${ATLAS_TILE.stripWidth}px ${ATLAS_TILE.stripHeight}px`, backgroundRepeat: "repeat-x" }}
        />
      </div>
      <p className="phrase text-heading text-ink">{phrase}</p>
    </div>
  );
}

/** Runs before first paint (inline in <head>). */
export const BOOT_SCRIPT = `(function(){try{var d=document.documentElement;var tg=location.hash.indexOf('tgWebAppData')>-1||sessionStorage.getItem('jd-tg')==='1';if(tg){d.dataset.tg='1';return;}if(sessionStorage.getItem('jd-seen')||matchMedia('(prefers-reduced-motion: reduce)').matches)return;sessionStorage.setItem('jd-seen','1');d.dataset.preload='1';setTimeout(function(){delete d.dataset.preload;},1200);}catch(e){}})();`;
