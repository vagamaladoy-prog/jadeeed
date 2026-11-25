"use client";
import { motion, useReducedMotion } from "motion/react";
import { Home, LayoutGrid, MessageCircle, Search, ShoppingBag, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { cartUi, useCartUi } from "@/lib/cart-store";
import { ui, useUi } from "@/lib/ui-store";
import { CartCount } from "./cart-count";
import { DUR, EASE_OUT, SPRING } from "@/lib/motion";
import { cn } from "@/lib/cn";

type Tab = { key: "home" | "catalog" | "search" | "cart" | "contact"; icon: LucideIcon; href?: string; onPress?: () => void };

const TABS: Tab[] = [
  { key: "home", icon: Home, href: "/" },
  { key: "catalog", icon: LayoutGrid, href: "/catalog" },
  { key: "search", icon: Search, onPress: ui.openSearch },
  { key: "cart", icon: ShoppingBag, onPress: cartUi.open },
  { key: "contact", icon: MessageCircle, onPress: ui.openContact },
];

/** Phone navigation — thumb zone. Hidden on cart/checkout so nothing distracts from buying. */
export function TabBar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { dir, atTop } = useScrollDirection();
  const reduce = useReducedMotion();
  const { open: cartOpen, pulse } = useCartUi();
  const searchOpen = useUi((s) => s.search);
  const contactOpen = useUi((s) => s.contact);

  if (pathname.startsWith("/cart") || pathname.startsWith("/checkout")) return null;

  const hidden = dir === "down" && !atTop && !reduce;
  const activeKey = cartOpen
    ? "cart"
    : searchOpen
      ? "search"
      : contactOpen
        ? "contact"
        : pathname === "/"
          ? "home"
          : pathname.startsWith("/catalog") || pathname.startsWith("/product")
            ? "catalog"
            : null;

  return (
    <motion.nav
      aria-label={t("menu")}
      initial={false}
      animate={{ y: hidden ? "115%" : "0%" }}
      transition={{ duration: DUR.in * 0.7, ease: EASE_OUT }}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-(--tabbar-gap) lg:hidden"
    >
      {/* a floating glass capsule, the twin of the one at the top */}
      <ul className="glass-bar pointer-events-auto mx-auto flex h-(--tabbar-h) max-w-lg items-stretch justify-between rounded-[30px] border border-white/50 bg-bar px-1.5 shadow-[0_10px_30px_-14px_rgb(20_16_18/0.5)]">
        {TABS.map((tab) => {
          const active = activeKey === tab.key;
          const Icon = tab.icon;
          const inner = (
            <>
              {/* the active tab sits under a drop of glass that glides between tabs (iOS 26 tab bar) */}
              {active && (
                <motion.span
                  layoutId="tab-glass"
                  transition={SPRING}
                  className="glass pointer-events-none absolute inset-x-0.5 inset-y-1.5 -z-10 rounded-pill"
                  aria-hidden
                />
              )}
              <motion.span
                key={tab.key === "cart" ? pulse : undefined}
                initial={tab.key === "cart" && pulse ? { y: -8, scale: 1.15 } : false}
                animate={{ y: 0, scale: 1 }}
                transition={{ ...SPRING, stiffness: 500, damping: 14 }}
                className="relative"
              >
                <Icon className={cn("size-6", active ? "text-ink" : "text-muted")} strokeWidth={active ? 2 : 1.6} />
                {tab.key === "cart" && <CartCount className="absolute -right-2.5 -top-1.5" />}
              </motion.span>
              <span className={cn("text-micro font-medium", active ? "text-ink" : "text-muted")}>{t(tab.key)}</span>
            </>
          );
          const cls =
            "glass-press relative isolate flex h-full min-w-14 flex-1 flex-col items-center justify-center gap-1 rounded-pill -outline-offset-4";
          return (
            <li key={tab.key} className="flex flex-1">
              {tab.href ? (
                <Link href={tab.href} className={cls} aria-current={active ? "page" : undefined}>
                  {inner}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={tab.onPress}
                  className={cls}
                  aria-pressed={active}
                  data-cart-target={tab.key === "cart" ? "" : undefined}
                >
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </motion.nav>
  );
}
