import Link from "next/link";
import { Search } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { ORDER_FILTERS, ORDER_STATUSES, type OrderStatusCode } from "@/lib/admin/labels";
import type { AdminOrderRow } from "@/lib/admin/dto";
import type { Prisma } from "@/generated/prisma/client";
import { OrdersTable } from "@/components/admin/orders-table";
import { EmptyState, PageTitle } from "@/components/admin/ui";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 50;

type SearchParams = Promise<{ status?: string; q?: string; page?: string }>;

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = (ORDER_STATUSES as readonly string[]).includes(sp.status ?? "") ? (sp.status as OrderStatusCode) : null;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Math.floor(Number(sp.page) || 1));

  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status;
  if (q) {
    let digits = q.replace(/\D/g, "");
    if (digits.startsWith("998") && digits.length > 9) digits = digits.slice(3);
    const or: Prisma.OrderWhereInput[] = [{ customerName: { contains: q, mode: "insensitive" } }];
    if (digits.length >= 3) or.push({ phone: { contains: digits } });
    if (/^#?\d{1,9}$/.test(q)) or.push({ number: Number(q.replace("#", "")) });
    if (q.startsWith("@")) or.push({ telegramUsername: { contains: q.slice(1), mode: "insensitive" } });
    where.OR = or;
  }

  const [orders, total, grouped] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { items: { select: { productName: true, colorName: true, size: true, quantity: true } } },
    }),
    db.order.count({ where }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all])) as Partial<Record<OrderStatusCode, number>>;
  const allCount = grouped.reduce((s, g) => s + g._count._all, 0);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const rows: AdminOrderRow[] = orders.map((o) => ({
    id: o.id,
    number: o.number,
    date: formatDateTime(o.createdAt),
    customerName: o.customerName,
    phone: o.phone,
    comment: o.comment,
    total: o.total,
    source: o.source,
    telegramUsername: o.telegramUsername,
    status: o.status,
    items: o.items.map((i) => ({ name: i.productName, color: i.colorName, size: i.size, qty: i.quantity })),
  }));

  const href = (params: { status?: string | null; q?: string; page?: number }) => {
    const s = new URLSearchParams();
    const st = params.status === undefined ? status : params.status;
    if (st) s.set("status", st);
    const qq = params.q ?? q;
    if (qq) s.set("q", qq);
    if (params.page && params.page > 1) s.set("page", String(params.page));
    const str = s.toString();
    return `/admin/orders${str ? `?${str}` : ""}`;
  };

  return (
    <>
      <PageTitle
        title="Заказы"
        description={counts.NEW ? `Новых заказов: ${counts.NEW}` : "Новых заказов нет"}
      />

      <nav aria-label="Фильтр по статусу" className="no-scrollbar -mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-1 rounded border border-line bg-white p-1">
          {ORDER_FILTERS.map((f) => {
            const value = f.value === "ALL" ? null : f.value;
            const active = value === status;
            const count = f.value === "ALL" ? allCount : (counts[f.value] ?? 0);
            return (
              <li key={f.value}>
                <Link
                  href={href({ status: value, page: 1 })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-2 whitespace-nowrap rounded px-3 text-body-sm transition-colors duration-150",
                    active ? "bg-ink text-white" : "text-ink hover:bg-paper-2",
                  )}
                >
                  {f.label}
                  <span className={cn("text-micro", active ? "text-white" : "text-muted")}>{count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <form action="/admin/orders" method="get" role="search" className="mb-5 flex gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <label htmlFor="orders-q" className="sr-only">
          Поиск по заказам
        </label>
        <div className="relative flex-1">
          <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted" />
          <Input id="orders-q" name="q" type="search" defaultValue={q} placeholder="№, имя, телефон или @username" className="pl-10" />
        </div>
        <button type="submit" className={buttonVariants({ variant: "outline", size: "md" })}>
          Найти
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState title={q ? "Ничего не найдено" : "Заказов пока нет"}>
          {q && (
            <Link href={href({ q: "", page: 1 })} className="underline underline-offset-4">
              Сбросить поиск
            </Link>
          )}
        </EmptyState>
      ) : (
        <OrdersTable rows={rows} />
      )}

      {pages > 1 && (
        <nav aria-label="Страницы" className="mt-6 flex items-center justify-between gap-4">
          {page > 1 ? (
            <Link href={href({ page: page - 1 })} className={buttonVariants({ variant: "outline", size: "sm" })}>
              ← Назад
            </Link>
          ) : (
            <span />
          )}
          <span className="text-body-sm text-muted">
            Страница {page} из {pages}
          </span>
          {page < pages ? (
            <Link href={href({ page: page + 1 })} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Далее →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
