"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BadgePercent,
  Image as ImageIcon,
  LogOut,
  MessageSquareQuote,
  MoreHorizontal,
  Package,
  Ruler,
  Settings,
  Shirt,
  Tags,
  type LucideIcon,
} from "lucide-react";
import { logoutAction } from "@/lib/admin/actions/auth";
import { AdminSheet } from "./admin-sheet";
import { cn } from "@/lib/cn";

type Item = { href: string; label: string; icon: LucideIcon };

const ITEMS: Item[] = [
  { href: "/admin/orders", label: "Заказы", icon: Package },
  { href: "/admin/products", label: "Товары", icon: Shirt },
  { href: "/admin/promotions", label: "Акции", icon: BadgePercent },
  { href: "/admin/banners", label: "Баннеры", icon: ImageIcon },
  { href: "/admin/phrases", label: "Фразы бренда", icon: MessageSquareQuote },
  { href: "/admin/categories", label: "Категории", icon: Tags },
  { href: "/admin/size-charts", label: "Размерные сетки", icon: Ruler },
  { href: "/admin/settings", label: "Настройки", icon: Settings },
];

const TAB_HREFS = ["/admin/orders", "/admin/products", "/admin/banners"];

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

function Counter({ value, className }: { value: number; className?: string }) {
  if (value <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-pill bg-ink px-1.5 text-micro font-medium text-white",
        className,
      )}
    >
      {value > 99 ? "99+" : value}
      <span className="sr-only"> новых</span>
    </span>
  );
}

function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={cn(
          "flex min-h-11 w-full items-center gap-3 rounded px-3 text-body-sm text-muted transition-colors duration-150 hover:bg-paper-2 hover:text-ink",
          className,
        )}
      >
        <LogOut className="size-4.5" aria-hidden />
        Выйти
      </button>
    </form>
  );
}

/** Desktop (≥1024px): fixed left sidebar. */
export function AdminSidebar({ newOrders }: { newOrders: number }) {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-white lg:flex">
      <Link href="/admin/orders" className="flex h-16 items-center gap-2 border-b border-line px-5">
        <span className="text-subheading font-semibold tracking-tight">Jadeeed</span>
        <span className="text-body-sm text-muted">админка</span>
      </Link>
      <nav aria-label="Разделы" className="flex-1 overflow-y-auto p-3">
        <ul className="flex flex-col gap-0.5">
          {ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded px-3 text-body-sm transition-colors duration-150",
                    active ? "bg-ink text-white" : "text-ink hover:bg-paper-2",
                  )}
                >
                  <Icon className="size-4.5 shrink-0" aria-hidden />
                  <span className="flex-1">{item.label}</span>
                  {item.href === "/admin/orders" && (
                    <Counter value={newOrders} className={active ? "bg-white text-ink" : undefined} />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-line p-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-1 flex min-h-11 items-center rounded px-3 text-body-sm text-muted transition-colors duration-150 hover:bg-paper-2 hover:text-ink"
        >
          Открыть сайт ↗
        </a>
        <LogoutButton />
      </div>
    </aside>
  );
}

/** Phone / tablet (<1024px): bottom tab bar + "Ещё" sheet. */
export function AdminTabBar({ newOrders }: { newOrders: number }) {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const tabs = ITEMS.filter((i) => TAB_HREFS.includes(i.href));
  const rest = ITEMS.filter((i) => !TAB_HREFS.includes(i.href));
  const moreActive = rest.some((i) => isActive(pathname, i.href));

  const tabClass = (active: boolean) =>
    cn(
      "relative flex h-full flex-1 flex-col items-center justify-center gap-1 text-micro font-medium transition-colors duration-150",
      active ? "text-ink" : "text-muted",
    );

  return (
    <>
      <nav
        aria-label="Разделы"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white pb-(--safe-bottom) lg:hidden"
      >
        <ul className="mx-auto flex h-(--tabbar-h) max-w-lg items-stretch">
          {tabs.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex flex-1">
                <Link href={item.href} aria-current={active ? "page" : undefined} className={tabClass(active)}>
                  <span className="relative">
                    <Icon className="size-6" strokeWidth={active ? 2 : 1.6} aria-hidden />
                    {item.href === "/admin/orders" && <Counter value={newOrders} className="absolute -right-3 -top-1.5" />}
                  </span>
                  {item.label}
                  {active && <span aria-hidden className="absolute bottom-1 size-1 rounded-pill bg-navy" />}
                </Link>
              </li>
            );
          })}
          <li className="flex flex-1">
            <button type="button" onClick={() => setMore(true)} aria-haspopup="dialog" className={tabClass(moreActive)}>
              <MoreHorizontal className="size-6" strokeWidth={moreActive ? 2 : 1.6} aria-hidden />
              Ещё
              {moreActive && <span aria-hidden className="absolute bottom-1 size-1 rounded-pill bg-navy" />}
            </button>
          </li>
        </ul>
      </nav>

      <AdminSheet open={more} onOpenChange={setMore} title="Разделы">
        <ul className="flex flex-col gap-0.5">
          {rest.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMore(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 items-center gap-3 rounded px-3 text-body transition-colors duration-150",
                    active ? "bg-ink text-white" : "text-ink hover:bg-paper-2",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li className="mt-2 border-t border-line pt-2">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center rounded px-3 text-body text-muted hover:bg-paper-2"
            >
              Открыть сайт ↗
            </a>
          </li>
          <li>
            <LogoutButton className="min-h-12 text-body" />
          </li>
        </ul>
      </AdminSheet>
    </>
  );
}
