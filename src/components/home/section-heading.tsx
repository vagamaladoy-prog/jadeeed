import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/cn";
import type { ComponentProps } from "react";

export function SectionHeading({
  title,
  eyebrow,
  link,
  className,
}: {
  title: string;
  eyebrow?: string;
  link?: { href: ComponentProps<typeof Link>["href"]; label: string };
  className?: string;
}) {
  return (
    <Reveal className={cn("mb-8 flex items-end justify-between gap-6 md:mb-12", className)}>
      <div>
        {eyebrow && <p className="label mb-3 text-muted">{eyebrow}</p>}
        <h2 className="font-display text-heading-lg font-light tracking-tighter md:text-display">{title}</h2>
      </div>
      {link && (
        <Link
          href={link.href}
          className="group flex min-h-11 shrink-0 items-center gap-2 text-body-sm font-medium text-navy underline-offset-4 hover:underline"
        >
          {link.label}
          <ArrowRight className="size-4 transition-transform duration-[var(--dur-hover)] group-hover:translate-x-1" />
        </Link>
      )}
    </Reveal>
  );
}
