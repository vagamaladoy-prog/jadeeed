import { cn } from "@/lib/cn";

/** Top of an inner page — a dark "page" of the manuscript (full-bleed ink band with a brick grid)
 *  under the fixed header; the content below is the paper page. Appears with a CSS animation so it
 *  is visible before hydration. Lives inside .container-page; the band breaks out to the full width. */
export function PageHeader({ title, subtitle, className }: { title: string; subtitle?: string; className?: string }) {
  return (
    <header
      className={cn(
        "relative isolate mb-8 pb-10 pt-[calc(var(--topbar-h)+36px)] text-paper md:mb-12 md:pb-14 lg:pt-[calc(var(--header-h)+56px)]",
        className,
      )}
    >
      <div aria-hidden className="brick-grid absolute inset-y-0 left-[calc(50%-50vw)] -z-10 w-screen bg-ink" />
      <div className="animate-rise">
        <p aria-hidden className="mb-4 text-zafaron">
          ✦
        </p>
        <h1 className="font-display text-display tracking-tighter">{title}</h1>
        {subtitle && <p className="mt-3 max-w-xl text-body text-on-ink-muted">{subtitle}</p>}
      </div>
    </header>
  );
}
