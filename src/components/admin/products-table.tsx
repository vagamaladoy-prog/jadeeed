"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Eye, EyeOff, Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";
import type { AdminProductRow } from "@/lib/admin/dto";
import { deleteProduct, setProductHidden } from "@/lib/admin/actions/products";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "./confirm-dialog";
import { Badge, EmptyState, Thumb } from "./ui";
import { cn } from "@/lib/cn";

const col = createColumnHelper<AdminProductRow>();

const matches = (p: AdminProductRow, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [p.nameUz, p.nameRu, p.slug, p.category ?? ""].some((s) => s.toLowerCase().includes(q));
};

function Flags({ p }: { p: AdminProductRow }) {
  return (
    <div className="flex flex-wrap gap-1">
      {p.isNew && <Badge>Новинка</Badge>}
      {p.isBestseller && <Badge>Бестселлер</Badge>}
      {p.isFeatured && <Badge>На главной</Badge>}
      {p.isHidden && <Badge tone="muted">Скрыт</Badge>}
    </div>
  );
}

function Price({ p }: { p: AdminProductRow }) {
  return (
    <span className="whitespace-nowrap">
      <span className="font-medium">{formatPrice(p.price, "ru")}</span>
      {p.oldPrice ? <span className="ml-2 text-muted line-through">{formatPrice(p.oldPrice, "ru")}</span> : null}
    </span>
  );
}

function RowActions({ p }: { p: AdminProductRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      try {
        const res = await setProductHidden(p.id, !p.isHidden);
        if (!res.ok) return void toast.error(res.error);
        toast.success(p.isHidden ? "Товар снова на сайте" : "Товар скрыт с сайта");
        router.refresh();
      } catch {
        toast.error("Нет связи с сервером");
      }
    });

  const remove = async () => {
    try {
      const res = await deleteProduct(p.id);
      if (!res.ok) {
        toast.error(res.error);
        return false;
      }
      toast.success("Товар удалён");
      router.refresh();
    } catch {
      toast.error("Нет связи с сервером");
      return false;
    }
  };

  return (
    <div className="relative z-10 flex items-center justify-end gap-1">
      <Link
        href={`/admin/products/${p.id}`}
        aria-label={`Редактировать «${p.nameRu}»`}
        className="grid size-11 place-items-center rounded transition-colors duration-150 hover:bg-paper-2"
      >
        <Pencil className="size-4.5" aria-hidden />
      </Link>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        disabled={pending}
        aria-label={p.isHidden ? `Показать «${p.nameRu}» на сайте` : `Скрыть «${p.nameRu}» с сайта`}
        title={p.isHidden ? "Показать на сайте" : "Скрыть с сайта"}
      >
        {p.isHidden ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
      </Button>
      <ConfirmDialog
        title={`Удалить «${p.nameRu}»?`}
        description="Товар, его цвета, фото и остатки будут удалены без возможности восстановления. В старых заказах он останется. Если нужно просто убрать товар с сайта — скройте его."
        onConfirm={remove}
        trigger={
          <Button variant="ghost" size="icon" aria-label={`Удалить «${p.nameRu}»`} title="Удалить">
            <Trash2 aria-hidden />
          </Button>
        }
      />
    </div>
  );
}

const columns = [
  col.accessor("image", {
    header: () => <span className="sr-only">Фото</span>,
    cell: (c) => <Thumb src={c.getValue()} className="aspect-[4/5] w-12 rounded" />,
  }),
  col.accessor("nameUz", {
    header: "Название",
    cell: (c) => (
      <Link href={`/admin/products/${c.row.original.id}`} className="font-medium underline-offset-4 hover:underline">
        {c.getValue()}
        <span className="block text-body-sm font-normal text-muted">{c.row.original.nameRu}</span>
      </Link>
    ),
  }),
  col.accessor("category", { header: "Категория", cell: (c) => c.getValue() ?? <span className="text-muted">—</span> }),
  col.accessor("price", { header: "Цена", cell: (c) => <Price p={c.row.original} /> }),
  col.accessor("stock", {
    header: "Остаток",
    cell: (c) => (
      <span className={cn("whitespace-nowrap", c.getValue() === 0 && "text-muted")}>
        {c.getValue()} шт
        <span className="block text-micro text-muted">цветов: {c.row.original.colors}</span>
      </span>
    ),
  }),
  col.display({ id: "flags", header: "Метки", cell: (c) => <Flags p={c.row.original} /> }),
  col.display({ id: "actions", header: () => <span className="sr-only">Действия</span>, cell: (c) => <RowActions p={c.row.original} /> }),
];

export function ProductsTable({ rows }: { rows: AdminProductRow[] }) {
  const [query, setQuery] = useState("");
  const data = useMemo(() => rows.filter((p) => matches(p, query)), [rows, query]);
  const table = useReactTable({ columns, data, getCoreRowModel: getCoreRowModel(), getRowId: (r) => r.id });
  const visible = table.getRowModel().rows;

  return (
    <>
      <div className="relative mb-5">
        <label htmlFor="products-q" className="sr-only">
          Поиск товаров
        </label>
        <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted" />
        <Input
          id="products-q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Название, адрес или категория"
          className="pl-10"
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState title={rows.length ? "Ничего не найдено" : "Товаров пока нет"}>
          {!rows.length && (
            <Link href="/admin/products/new" className="underline underline-offset-4">
              Добавить первый товар
            </Link>
          )}
        </EmptyState>
      ) : (
        <>
          {/* desktop */}
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
                {visible.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-line align-middle transition-colors duration-150 last:border-b-0 hover:bg-paper",
                      row.original.isHidden && "text-muted",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* phone / tablet */}
          <ul className="flex flex-col gap-3 lg:hidden">
            {visible.map(({ original: p }) => (
              <li key={p.id} className="flex gap-3 rounded border border-line bg-white p-3">
                <Thumb src={p.image} className="aspect-[4/5] w-20 shrink-0 rounded" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <Link href={`/admin/products/${p.id}`} className="font-medium">
                    {p.nameUz}
                  </Link>
                  <p className="text-body-sm text-muted">
                    {p.category ?? "Без категории"} · {p.stock} шт
                  </p>
                  <p className="text-body-sm">
                    <Price p={p} />
                  </p>
                  <Flags p={p} />
                  <div className="-mb-1 -mr-1 mt-auto">
                    <RowActions p={p} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
