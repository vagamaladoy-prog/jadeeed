"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCategory } from "@/lib/admin/actions/categories";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "./confirm-dialog";
import { Badge, Panel, Thumb } from "./ui";

export type CategoryRow = {
  id: string;
  slug: string;
  nameUz: string;
  nameRu: string;
  image: string | null;
  isVisible: boolean;
  sizeChart: string | null;
  products: number;
  promotions: number;
};

function deleteWarning(c: CategoryRow) {
  const parts: string[] = [];
  if (c.products > 0)
    parts.push(`В категории ${c.products} товар(ов) — они останутся, но будут без категории и пропадут из её раздела на сайте.`);
  if (c.promotions > 0) parts.push(`Акции этой категории (${c.promotions}) будут удалены.`);
  parts.push("Действие нельзя отменить.");
  return parts.join(" ");
}

export function CategoriesList({ rows }: { rows: CategoryRow[] }) {
  const router = useRouter();

  const remove = async (c: CategoryRow) => {
    try {
      const res = await deleteCategory(c.id);
      if (!res.ok) {
        toast.error(res.error);
        return false;
      }
      toast.success("Категория удалена");
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
          <li key={c.id} className="flex items-center gap-3 border-b border-line p-4 last:border-b-0 sm:gap-4 sm:px-6">
            <Thumb src={c.image} alt="" className="aspect-square w-14 shrink-0 rounded" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/categories/${c.id}`} className="font-medium underline-offset-4 hover:underline">
                  {c.nameRu}
                </Link>
                {!c.isVisible && <Badge tone="muted">Скрыта</Badge>}
              </div>
              <p className="mt-0.5 text-body-sm text-muted">
                {c.nameUz} · /{c.slug}
              </p>
              <p className="mt-0.5 text-body-sm text-muted">
                Товаров: {c.products} · Сетка: {c.sizeChart ?? "не задана"}
              </p>
            </div>
            <div className="flex shrink-0">
              <Link
                href={`/admin/categories/${c.id}`}
                aria-label={`Редактировать «${c.nameRu}»`}
                className="grid size-11 place-items-center rounded transition-colors duration-150 hover:bg-paper-2"
              >
                <Pencil className="size-4.5" aria-hidden />
              </Link>
              <ConfirmDialog
                title={`Удалить категорию «${c.nameRu}»?`}
                description={deleteWarning(c)}
                onConfirm={() => remove(c)}
                trigger={
                  <Button variant="ghost" size="icon" aria-label={`Удалить «${c.nameRu}»`}>
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
