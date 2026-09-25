"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteSizeChart } from "@/lib/admin/actions/size-charts";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "./confirm-dialog";
import { Panel } from "./ui";

export type SizeChartRowItem = { id: string; name: string; sizes: string; categories: number; products: number };

export function SizeChartsList({ rows }: { rows: SizeChartRowItem[] }) {
  const router = useRouter();

  const remove = async (id: string) => {
    try {
      const res = await deleteSizeChart(id);
      if (!res.ok) {
        toast.error(res.error);
        return false;
      }
      toast.success("Сетка удалена");
      router.refresh();
    } catch {
      toast.error("Нет связи с сервером");
      return false;
    }
  };

  return (
    <Panel>
      <ul>
        {rows.map((c) => (
          <li key={c.id} className="flex items-center gap-3 border-b border-line p-4 last:border-b-0 sm:px-6">
            <div className="min-w-0 flex-1">
              <Link href={`/admin/size-charts/${c.id}`} className="font-medium underline-offset-4 hover:underline">
                {c.name}
              </Link>
              <p className="mt-0.5 text-body-sm text-muted">{c.sizes || "нет строк"}</p>
              <p className="mt-0.5 text-body-sm text-muted">
                Категорий: {c.categories} · Товаров со своей сеткой: {c.products}
              </p>
            </div>
            <div className="flex shrink-0">
              <Link
                href={`/admin/size-charts/${c.id}`}
                aria-label={`Редактировать «${c.name}»`}
                className="grid size-11 place-items-center rounded transition-colors duration-150 hover:bg-paper-2"
              >
                <Pencil className="size-4.5" aria-hidden />
              </Link>
              <ConfirmDialog
                title={`Удалить сетку «${c.name}»?`}
                description={
                  c.categories || c.products
                    ? `Сетка используется (категорий: ${c.categories}, товаров: ${c.products}) — у них таблица размеров пропадёт.`
                    : "Сетка нигде не используется."
                }
                onConfirm={() => remove(c.id)}
                trigger={
                  <Button variant="ghost" size="icon" aria-label={`Удалить «${c.name}»`}>
                    <Trash2 aria-hidden />
                  </Button>
                }
              />
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
