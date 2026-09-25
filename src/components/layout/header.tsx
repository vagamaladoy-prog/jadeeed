"use client";
import { motion, useReducedMotion } from "motion/react";
import { Search, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitch } from "./language-switch";
import { CartCount } from "./cart-count";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { useDesktop } from "@/hooks/use-media";
import { cartUi } from "@/lib/cart-store";
import { ui, useUi } from "@/lib/ui-store";
import { DUR, EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/catalog", key: "catalog" },
  { href: "/about", key: "about" },
  { href: "/delivery", key: "delivery" },
  { href: "/contacts", key: "contacts" },
] as const;

const T = { duration: DUR.in * 0.7, ease: EASE_OUT };

/**
 * Desktop (≥1024): transparent over the banner; on scroll it compacts (translate + scale only)
 * and gets a blurred backing; hides while scrolling down, returns on scroll up.
 * Phone: a thin strip with logo + language only (navigation lives in the bottom tab bar);
 * hidden inside the Telegram Mini App, where Telegram draws its own header.
 */
export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { dir, atTop } = useScrollDirection();
  const reduce = useReducedMotion();
  const bannerTone = useUi((s) => s.bannerTone);

  const desktop = useDesktop();
  // only the desktop header lies over the banner; the phone strip is always solid (readable)
  const overBanner = desktop && pathname === "/" && atTop && bannerTone !== null;
  const tone: "light" | "dark" = overBanner && bannerTone === "DARK" ? "dark" : "light";
  const hidden = dir === "down" && !atTop && !reduce;
  const compact = !atTop;

  const iconBtn = cn(
    "relative grid size-11 place-items-center rounded transition-colors duration-[var(--dur-hover)]",
    tone === "dark" ? "text-white hover:bg-white/10" : "text-ink hover:bg-paper-2",
  );

  return (
    <motion.header
      initial={false}
      animate={{ y: hidden ? "-100%" : compact && desktop ? -12 : 0 }}
      transition={T}
      className="tg-hide-mobile fixed inset-x-0 top-0 z-40"
    >
      {/* backing: fades in instead of animating background-color */}
      <motion.div
        aria-hidden
        initial={false}
        animate={{ opacity: overBanner ? 0 : 1 }}
        transition={T}
        className="absolute inset-0 border-b border-line bg-header backdrop-blur-md"
      />

      {/* phone strip */}
      <div className="container-page relative flex h-(--topbar-h) items-center justify-between lg:hidden">
        <Link href="/" aria-label="Jadeeed" className="-ml-1 flex h-11 items-center px-1">
          <Logo tone={tone} height={36} />
        </Link>
        <LanguageSwitch tone={tone} />
      </div>

      {/* desktop header */}
      <motion.div
        initial={false}
        animate={{ y: compact ? 6 : 0 }}
        transition={T}
        className="container-page relative hidden h-(--header-h) grid-cols-[1fr_auto_1fr] items-center gap-10 lg:grid"
      >
        <nav aria-label={t("menu")} className="flex items-center gap-8">
          {NAV.map((n) => {
            const active = pathname === n.href || (n.href === "/catalog" && pathname.startsWith("/product"));
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative py-2 text-body-sm font-medium transition-colors duration-[var(--dur-hover)]",
                  tone === "dark" ? "text-white/85 hover:text-white" : "text-muted hover:text-ink",
                  active && (tone === "dark" ? "text-white" : "text-ink"),
                )}
              >
                {t(n.key)}
                {active && <span className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-navy" aria-hidden />}
              </Link>
            );
          })}
        </nav>
        {/* logo in the centre, as in editorial fashion stores */}
        <Link href="/" aria-label="Jadeeed" className="flex h-11 items-center justify-self-center">
          <motion.span initial={false} animate={{ scale: compact ? 0.84 : 1 }} transition={T} className="origin-center">
            <Logo tone={tone} height={48} />
          </motion.span>
        </Link>
        <div className="flex items-center justify-self-end gap-2">
          <button type="button" onClick={ui.openSearch} aria-label={t("search")} className={iconBtn}>
            <Search className="size-5" />
          </button>
          <LanguageSwitch tone={tone} />
          <button type="button" onClick={cartUi.open} data-cart-target aria-label={t("cart")} className={iconBtn}>
            <ShoppingBag className="size-5" />
            <CartCount className="absolute right-0.5 top-0.5" />
          </button>
        </div>
      </motion.div>
    </motion.header>
  );
}
