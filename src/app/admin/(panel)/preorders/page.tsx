import Link from "next/link";
import { Search } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, formatPhone, formatPrice } from "@/lib/format";
import { PREORDER_OPEN, PREORDER_STATUSES, PREORDER_STATUS_LABELS, type PreorderStatusCode } from "@/lib/admin/labels";
import { SIZES } from "@/lib/types";
import type { Prisma } from "@/generated/prisma/client";
import { EmptyState, PageTitle, Panel, Section } from "@/components/admin/ui";
import { PreorderSettingsForm, PreorderStatusBadge } from "@/components/admin/preorder-bits";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 50;

type SearchParams = Promise<{ status?: string; q?: string; page?: string }>;

export default async function PreordersPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = (PREORDER_STATUSES as readonly string[]).includes(sp.status ?? "") ? (sp.status as PreorderStatusCode) : null;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Math.floor(Number(sp.page) || 1));

  const where: Prisma.PreorderWhereInput = {};
  if (status) where.status = status;
  if (q) {
    let digits = q.replace(/\D/g, "");
    if (digits.startsWith("998") && digits.length > 9) digits = digits.slice(3);
    const or: Prisma.PreorderWhereInput[] = [
      { customerName: { contains: q, mode: "insensitive" } },
      { items: { some: { productName: { contains: q, mode: "insensitive" } } } },
    ];
    if (digits.length >= 3) or.push({ phone: { contains: digits } });
    if (/^#?\d{1,9}$/.test(q)) or.push({ number: Number(q.replace("#", "")) });
    if (q.startsWith("@")) or.push({ telegramUsername: { contains: q.slice(1), mode: "insensitive" } });
    where.OR = or;
  }

  const [preorders, total, grouped, demand, settings] = await Promise.all([
    db.preorder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { items: { select: { productName: true, colorName: true, size: true, quantity: true } } },
    }),
    db.preorder.count({ where }),
    db.preorder.groupBy({ by: ["status"], _count: { _all: true } }),
    // what the open pre-bookings ask for — the shopping list for the next batch
    db.preorderItem.groupBy({
      by: ["productName", "colorName", "size"],
      where: { preorder: { status: { in: PREORDER_OPEN } } },
      _sum: { quantity: true },
    }),
    db.settings.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} }),
  ]);

  const counts = Object.fromEntries(grouped.map((g) => [g.status, g._count._all])) as Partial<Record<PreorderStatusCode, number>>;
  const allCount = grouped.reduce((s, g) => s + g._count._all, 0);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // batch summary: one row per product + colour, a column per size
  const summary = new Map<string, { product: string; color: string; sizes: Partial<Record<string, number>>; total: number }>();
  for (const d of demand) {
    const k = `${d.productName}|${d.colorName}`;
    const row = summary.get(k) ?? { product: d.productName, color: d.colorName, sizes: {}, total: 0 };
    const n = d._sum.quantity ?? 0;
    row.sizes[d.size] = (row.sizes[d.size] ?? 0) + n;
    row.total += n;
    summary.set(k, row);
  }
  const summaryRows = [...summary.values()].sort((a, b) => b.total - a.total);
  const usedSizes = SIZES.filter((s) => summaryRows.some((r) => r.sizes[s]));
  const summaryTotal = summaryRows.reduce((s, r) => s + r.total, 0);

  const href = (params: { status?: string | null; q?: string; page?: number }) => {
    const s = new URLSearchParams();
    const st = params.status === undefined ? status : params.status;
    if (st) s.set("status", st);
    const qq = params.q ?? q;
    if (qq) s.set("q", qq);
    if (params.page && params.page > 1) s.set("page", String(params.page));
    const str = s.toString();
    return `/admin/preorders${str ? `?${str}` : ""}`;
  };

  const filters: { value: PreorderStatusCode | null; label: string; count: number }[] = [
    { value: null, label: "Все", count: allCount },
    ...PREORDER_STATUSES.map((s) => ({ value: s, label: PREORDER_STATUS_LABELS[s], count: counts[s] ?? 0 })),
  ];

  return (
    <>
      <PageTitle
        title="Предзаказы"
        description={
          <>
            Бронь следующей партии — склад не списывается. {counts.NEW ? `Новых: ${counts.NEW}.` : "Новых нет."}{" "}
            <a href="/preorder" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
              Страница на сайте ↗
            </a>
          </>
        }
      />

      <div className="mb-4 grid gap-4 xl:grid-cols-5">
        <Section
          className="xl:col-span-3"
          title="Сводка для следующей партии"
          description={`Сколько заказать: новые и подтверждённые предзаказы${summaryTotal ? ` · всего ${summaryTotal} шт` : ""}`}
        >
          {summaryRows.length === 0 ? (
            <p className="text-body-sm text-muted">Пока ничего не забронировано.</p>
          ) : (
            <div className="-mx-4 overflow-x-auto sm:-mx-6">
              <table className="w-full border-collapse text-left text-body-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="label px-4 py-2 font-medium text-muted sm:pl-6">
                      Товар
                    </th>
                    {usedSizes.map((s) => (
                      <th key={s} scope="col" className="label px-2 py-2 text-center font-medium text-muted">
                        {s}
                      </th>
                    ))}
                    <th scope="col" className="label px-4 py-2 text-right font-medium text-muted sm:pr-6">
                      Всего
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summaryRows.map((r) => (
                    <tr key={`${r.product}-${r.color}`} className="border-b border-line last:border-b-0">
                      <td className="px-4 py-2.5 sm:pl-6">
                        <span className="font-medium">{r.product}</span> <span className="text-muted">· {r.color.toLocaleLowerCase("ru")}</span>
                      </td>
                      {usedSizes.map((s) => (
                        <td key={s} className={cn("px-2 py-2.5 text-center tabular-nums", !r.sizes[s] && "text-muted")}>
                          {r.sizes[s] ?? "·"}
                        </td>
                      ))}
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums sm:pr-6">{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
        <Section className="xl:col-span-2" title="Настройки предзаказа">
          <PreorderSettingsForm
            key={settings.updatedAt.toISOString()}
            enabled={settings.preorderEnabled}
            noteUz={settings.preorderNoteUz}
            noteRu={settings.preorderNoteRu}
          />
        </Section>
      </div>

      <nav aria-label="Фильтр по статусу" className="no-scrollbar -mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-1 rounded border border-line bg-white p-1">
          {filters.map((f) => {
            const active = f.value === status;
            return (
              <li key={f.value ?? "ALL"}>
                <Link
                  href={href({ status: f.value, page: 1 })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-2 whitespace-nowrap rounded px-3 text-body-sm transition-colors duration-150",
                    active ? "bg-ink text-white" : "text-ink hover:bg-paper-2",
                  )}
                >
                  {f.label}
                  <span className={cn("text-micro", active ? "text-white" : "text-muted")}>{f.count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <form action="/admin/preorders" method="get" role="search" className="mb-5 flex gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <label htmlFor="preorders-q" className="sr-only">
          Поиск по предзаказам
        </label>
        <div className="relative flex-1">
          <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted" />
          <Input id="preorders-q" name="q" type="search" defaultValue={q} placeholder="№, имя, телефон, товар или @username" className="pl-10" />
        </div>
        <button type="submit" className={buttonVariants({ variant: "outline", size: "md" })}>
          Найти
        </button>
      </form>

      {preorders.length === 0 ? (
        <EmptyState title={q ? "Ничего не найдено" : "Предзаказов пока нет"}>
          {q && (
            <Link href={href({ q: "", page: 1 })} className="underline underline-offset-4">
              Сбросить поиск
            </Link>
          )}
        </EmptyState>
      ) : (
        <Panel>
          <ul>
            {preorders.map((p) => (
              <li
                key={p.id}
                className={cn(
                  "relative grid gap-2 border-b border-line px-4 py-4 transition-colors duration-150 last:border-b-0 hover:bg-paper sm:px-6 lg:grid-cols-[9rem_1fr_auto] lg:items-start lg:gap-6",
                  p.status === "NEW" && "bg-paper",
                )}
              >
                <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-start">
                  <Link href={`/admin/preorders/${p.number}`} className="font-medium after:absolute after:inset-0">
                    Предзаказ #{p.number}
                  </Link>
                  <PreorderStatusBadge status={p.status} />
                </div>
                <div className="min-w-0 text-body-sm">
                  <p>
                    <span className="font-medium">{p.customerName}</span> <span className="text-muted">· {formatPhone(p.phone)}</span>
                    {p.telegramUsername && <span className="text-muted"> · @{p.telegramUsername}</span>}
                  </p>
                  <ul className="mt-1 flex flex-col gap-0.5 text-muted">
                    {p.items.map((i, idx) => (
                      <li key={idx}>
                        {i.productName} — {i.colorName.toLocaleLowerCase("ru")} — {i.size} — {i.quantity} шт
                      </li>
                    ))}
                  </ul>
                  {p.comment && <p className="mt-1 text-muted">«{p.comment}»</p>}
                </div>
                <div className="flex items-baseline justify-between gap-4 text-body-sm lg:flex-col lg:items-end">
                  <span className="whitespace-nowrap text-muted">{formatDateTime(p.createdAt)}</span>
                  <span className="whitespace-nowrap font-medium">≈ {formatPrice(p.total, "ru")}</span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
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
