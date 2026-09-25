"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteBanner, reorderBanners, setBannerActive } from "@/lib/admin/actions/banners";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "./confirm-dialog";
import { Badge, Panel, Switch, Thumb } from "./ui";

export type BannerRow = {
  id: string;
  imageDesktop: string;
  imageMobile: string | null;
  altRu: string;
  link: string | null;
  headerTone: "LIGHT" | "DARK";
  isActive: boolean;
};

export function BannersList({ rows }: { rows: BannerRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState(rows);
  const [pending, startTransition] = useTransition();
  // fresh server data (after refresh) replaces the optimistic order
  const [prevRows, setPrevRows] = useState(rows);
  if (rows !== prevRows) {
    setPrevRows(rows);
    setItems(rows);
  }

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, success: string, rollback?: () => void) =>
    startTransition(async () => {
      try {
        const res = await fn();
        if (!res.ok) {
          rollback?.();
          return void toast.error(res.error);
        }
        toast.success(success);
        router.refresh();
      } catch {
        rollback?.();
        toast.error("Нет связи с сервером");
      }
    });

  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= items.length) return;
    const prev = items;
    const next = [...items];
    [next[index], next[to]] = [next[to], next[index]];
    setItems(next);
    run(() => reorderBanners(next.map((b) => b.id)), "Порядок сохранён", () => setItems(prev));
  };

  return (
    <Panel>
      <ol>
        {items.map((b, i) => (
          <li key={b.id} className="flex flex-col gap-3 border-b border-line p-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="w-6 text-center text-body-sm text-muted">{i + 1}</span>
              <Thumb src={b.imageDesktop} alt="" className="aspect-video w-36 shrink-0 rounded border border-line" />
              <Thumb src={b.imageMobile ?? b.imageDesktop} alt="" className="aspect-[4/5] w-12 shrink-0 rounded border border-line" />
            </div>
            <div className="min-w-0 flex-1">
              <Link href={`/admin/banners/${b.id}`} className="line-clamp-2 font-medium underline-offset-4 hover:underline">
                {b.altRu}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-body-sm text-muted">
                {!b.isActive && <Badge tone="muted">Скрыт</Badge>}
                {!b.imageMobile && <span>без мобильной версии</span>}
                {b.link && <span className="truncate">→ {b.link}</span>}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <Switch
                checked={b.isActive}
                disabled={pending}
                label="На сайте"
                onCheckedChange={(v) => run(() => setBannerActive(b.id, v), v ? "Баннер показан" : "Баннер скрыт")}
              />
              <div className="flex">
                <Button variant="ghost" size="icon" disabled={pending || i === 0} onClick={() => move(i, -1)} aria-label="Выше">
                  <ArrowUp aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={pending || i === items.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label="Ниже"
                >
                  <ArrowDown aria-hidden />
                </Button>
                <Link
                  href={`/admin/banners/${b.id}`}
                  aria-label="Редактировать"
                  className="grid size-11 place-items-center rounded transition-colors duration-150 hover:bg-paper-2"
                >
                  <Pencil className="size-4.5" aria-hidden />
                </Link>
                <ConfirmDialog
                  title="Удалить баннер?"
                  description="Картинки баннера будут удалены. Чтобы убрать баннер временно — просто выключите его."
                  onConfirm={async () => {
                    try {
                      const res = await deleteBanner(b.id);
                      if (!res.ok) {
                        toast.error(res.error);
                        return false;
                      }
                      toast.success("Баннер удалён");
                      router.refresh();
                    } catch {
                      toast.error("Нет связи с сервером");
                      return false;
                    }
                  }}
                  trigger={
                    <Button variant="ghost" size="icon" aria-label="Удалить баннер">
                      <Trash2 aria-hidden />
                    </Button>
                  }
                />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
