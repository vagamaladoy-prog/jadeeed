import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/cn";

/** Top of an inner page. Leaves room for the fixed header (phone strip / desktop header). */
export function PageHeader({ title, subtitle, className }: { title: string; subtitle?: string; className?: string }) {
  return (
    <header className={cn("pb-8 pt-[calc(var(--topbar-h)+32px)] md:pb-12 lg:pt-[calc(var(--header-h)+56px)]", className)}>
      <Reveal>
        <h1 className="font-display text-display font-light tracking-tighter">{title}</h1>
        {subtitle && <p className="mt-3 max-w-xl text-body text-muted">{subtitle}</p>}
      </Reveal>
    </header>
  );
}
