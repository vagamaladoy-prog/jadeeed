"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { formatPrice } from "@/lib/format";
import type { AdminOrderRow } from "@/lib/admin/dto";
import { PhoneLink, SourceLabel, StatusBadge } from "./order-bits";
import { cn } from "@/lib/cn";

const col = createColumnHelper<AdminOrderRow>();

const itemLine = (i: AdminOrderRow["items"][number]) => `${i.name} — ${i.color} — ${i.size} — ${i.qty} шт`;

const columns = [
  col.accessor("number", {
    header: "№",
    cell: (c) => (
      <Link href={`/admin/orders/${c.getValue()}`} className="font-medium underline-offset-4 hover:underline" onClick={(e) => e.stopPropagation()}>
        #{c.getValue()}
      </Link>
    ),
  }),
  col.accessor("date", { header: "Дата", cell: (c) => <span className="whitespace-nowrap">{c.getValue()}</span> }),
  col.accessor("customerName", { header: "Имя" }),
  col.accessor("phone", { header: "Телефон", cell: (c) => <PhoneLink phone={c.getValue()} /> }),
  col.accessor("comment", {
    header: "Комментарий",
    cell: (c) => <span className="line-clamp-3 max-w-48 text-muted">{c.getValue() || "—"}</span>,
  }),
  col.accessor("items", {
    header: "Состав",
    cell: (c) => (
      <ul className="flex min-w-56 flex-col gap-0.5">
        {c.getValue().map((i, idx) => (
          <li key={idx}>{itemLine(i)}</li>
        ))}
      </ul>
    ),
  }),
  col.accessor("total", {
    header: "Сумма",
    cell: (c) => <span className="whitespace-nowrap font-medium">{formatPrice(c.getValue(), "ru")}</span>,
  }),
  col.accessor("source", {
    header: "Источник",
    cell: (c) => <SourceLabel source={c.getValue()} username={c.row.original.telegramUsername} />,
  }),
  col.accessor("status", { header: "Статус", cell: (c) => <StatusBadge status={c.getValue()} /> }),
];

export function OrdersTable({ rows }: { rows: AdminOrderRow[] }) {
  const router = useRouter();
  const open = (n: number) => router.push(`/admin/orders/${n}`);
  const table = useReactTable({ columns, data: rows, getCoreRowModel: getCoreRowModel(), getRowId: (r) => r.id });

  return (
    <>
      {/* desktop: table */}
      <div className="hidden overflow-x-auto rounded border border-line bg-white lg:block">
        <table className="w-full border-collapse text-left text-body-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-line">
                {hg.headers.map((h) => (
                  <th key={h.id} scope="col" className="label whitespace-nowrap px-3 py-3 font-medium text-muted">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => open(row.original.number)}
                className={cn(
                  "cursor-pointer border-b border-line align-top transition-colors duration-150 last:border-b-0 hover:bg-paper",
                  row.original.status === "NEW" && "bg-paper",
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* phone / tablet: cards */}
      <ul className="flex flex-col gap-3 lg:hidden">
        {rows.map((o) => (
          <li key={o.id} className="relative rounded border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={`/admin/orders/${o.number}`} className="text-body font-medium after:absolute after:inset-0">
                  Заказ #{o.number}
                </Link>
                <p className="text-body-sm text-muted">{o.date}</p>
              </div>
              <StatusBadge status={o.status} />
            </div>
            <div className="mt-3 flex flex-col gap-1 text-body-sm">
              <p className="font-medium">{o.customerName}</p>
              <p className="relative z-10 w-max">
                <PhoneLink phone={o.phone} className="inline-flex min-h-11 items-center underline underline-offset-4" />
              </p>
              {o.comment && <p className="text-muted">«{o.comment}»</p>}
              <ul className="mt-1 flex flex-col gap-0.5">
                {o.items.map((i, idx) => (
                  <li key={idx}>{itemLine(i)}</li>
                ))}
              </ul>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3 text-body-sm">
              <span className="relative z-10">
                <SourceLabel source={o.source} username={o.telegramUsername} />
              </span>
              <span className="font-medium">{formatPrice(o.total, "ru")}</span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
