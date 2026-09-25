"use client";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/cn";

/** uz | ru segmented control with a sliding thumb. The choice is remembered (cookie). */
export function LanguageSwitch({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const id = useId();

  const change = (next: Locale) => {
    if (next === locale) return;
    const search = typeof window !== "undefined" ? window.location.search : "";
    startTransition(() => {
      router.replace(`${pathname}${search}`, { locale: next, scroll: false });
    });
  };

  return (
    <div
      role="radiogroup"
      aria-label={t("language")}
      className={cn(
        "relative inline-flex h-11 items-center rounded-pill p-1",
        tone === "dark" ? "text-white" : "text-ink",
        pending && "opacity-70",
        className,
      )}
    >
      {locales.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => change(l)}
            className={cn(
              "relative z-10 h-9 min-w-11 rounded-pill px-3 text-label font-medium uppercase tracking-wide transition-colors duration-[var(--dur-hover)]",
              active ? "text-white" : tone === "dark" ? "text-white/80 hover:text-white" : "text-muted hover:text-ink",
            )}
          >
            {active && (
              <motion.span layoutId={`lang-${id}`} transition={SPRING} className="absolute inset-0 -z-10 rounded-pill bg-navy" />
            )}
            {l}
          </button>
        );
      })}
    </div>
  );
}
