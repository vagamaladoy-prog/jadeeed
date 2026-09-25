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
      animate={{ y: hidden ? "100%" : "0%" }}
      transition={{ duration: DUR.in * 0.7, ease: EASE_OUT }}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bar pb-(--safe-bottom) backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto flex h-(--tabbar-h) max-w-lg items-stretch justify-between px-1">
        {TABS.map((tab) => {
          const active = activeKey === tab.key;
          const Icon = tab.icon;
          const inner = (
            <>
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
              {active && (
                <motion.span
                  layoutId="tab-dot"
                  transition={SPRING}
                  className="absolute bottom-1 size-1 rounded-pill bg-navy"
                  aria-hidden
                />
              )}
            </>
          );
          const cls =
            "relative flex h-full min-w-14 flex-1 flex-col items-center justify-center gap-1 rounded -outline-offset-4";
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
