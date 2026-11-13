/**
 * First-visit intro (~2.9 s): the screen is black, "Aylanib ketay…" writes itself in white script,
 * then the black cover opens like a book onto the hero. Rendered on the server but shown only when
 * <html data-preload> is set by the inline boot script (first visit in this session, not in the
 * Telegram Mini App, motion allowed). Pure CSS so it never blocks hydration or LCP.
 */
export function Preloader({ phrase }: { phrase: string }) {
  return (
    <div aria-hidden className="preloader jd-intro pointer-events-none fixed inset-0 z-[100] hidden [perspective:1600px]">
      <div className="jd-cover-l brick-grid absolute inset-y-0 left-0 w-1/2 border-r border-zafaron/40 bg-ink" />
      <div className="jd-cover-r brick-grid absolute inset-y-0 right-0 w-1/2 border-l border-zafaron/40 bg-ink" />
      <div className="absolute inset-0 grid place-items-center px-6">
        <p className="jd-intro-text script text-center text-[clamp(52px,11vw,128px)] leading-tight text-paper">{phrase}</p>
      </div>
    </div>
  );
}

/** Runs before first paint (inline in <head>). */
export const BOOT_SCRIPT = `(function(){try{var d=document.documentElement;var tg=location.hash.indexOf('tgWebAppData')>-1||sessionStorage.getItem('jd-tg')==='1';if(tg){d.dataset.tg='1';return;}if(sessionStorage.getItem('jd-seen')||matchMedia('(prefers-reduced-motion: reduce)').matches)return;sessionStorage.setItem('jd-seen','1');d.dataset.preload='1';setTimeout(function(){delete d.dataset.preload;},2950);}catch(e){}})();`;
