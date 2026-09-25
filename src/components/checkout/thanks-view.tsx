"use client";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { AtlasPattern } from "@/components/atlas/atlas-pattern";
import { BrandPhrase } from "@/components/brand/brand-phrase";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "@/components/contact/external-link";
import { DUR, EASE_OUT } from "@/lib/motion";

/** Atlas rises from the bottom, then "Ko'z tegmasin." and the order number. No confetti. */
export function ThanksView({ phrase, number, channelUrl, supportUrl }: { phrase: string; number: number | null; channelUrl: string; supportUrl: string }) {
  const t = useTranslations("thanks");
  const reduce = useReducedMotion();
  const after = reduce ? 0 : DUR.scene * 0.8;

  return (
    <section className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-ink px-gutter py-28">
      <motion.div
        aria-hidden
        className="absolute inset-0"
        initial={{ y: "100%" }}
        animate={{ y: "0%" }}
        transition={{ duration: DUR.scene, ease: EASE_OUT }}
      >
        <AtlasPattern variant="dense" scale={0.8} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DUR.in, ease: EASE_OUT, delay: after }}
        className="relative w-full max-w-xl bg-paper px-6 py-10 text-center md:px-12 md:py-14"
      >
        <BrandPhrase text={phrase} as="h1" animate="write" delay={after} className="text-display tracking-tighter" />
        {number && (
          <p className="mt-6 font-display text-heading font-light tabular-nums text-navy">{t("order", { number })}</p>
        )}
        <p className="mx-auto mt-4 max-w-sm text-body text-muted">{t("text")}</p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <ExternalLink href={channelUrl}>
              <Send /> {t("subscribe")}
            </ExternalLink>
          </Button>
          <ExternalLink href={supportUrl} className="flex min-h-11 items-center text-body-sm text-navy underline underline-offset-4">
            {t("support")}
          </ExternalLink>
          <Link href="/" className="flex min-h-11 items-center text-body-sm text-muted hover:text-ink">
            {t("home")}
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
