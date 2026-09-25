"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deletePromotion, setPromotionActive } from "@/lib/admin/actions/promotions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "./confirm-dialog";
import { Badge, Panel, Switch } from "./ui";

export type PromotionRow = {
  id: string;
  name: string;
  discount: string;
  target: string;
  period: string;
  isActive: boolean;
  state: "live" | "scheduled" | "ended" | "off";
};

const STATE = {
  live: { label: "Идёт сейчас", tone: "solid" },
  scheduled: { label: "Запланирована", tone: "outline" },
  ended: { label: "Завершена", tone: "muted" },
  off: { label: "Выключена", tone: "muted" },
} as const;

function Row({ p }: { p: PromotionRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const toggle = (v: boolean) =>
    startTransition(async () => {
      try {
        const res = await setPromotionActive(p.id, v);
        if (!res.ok) return void toast.error(res.error);
        toast.success(v ? "Акция включена" : "Акция выключена");
        router.refresh();
      } catch {
        toast.error("Нет связи с сервером");
      }
    });

  const remove = async () => {
    try {
      const res = await deletePromotion(p.id);
      if (!res.ok) {
        toast.error(res.error);
        return false;
      }
      toast.success("Акция удалена");
      router.refresh();
    } catch {
      toast.error("Нет связи с сервером");
      return false;
    }
  };

  return (
    <li className="flex flex-col gap-3 border-b border-line p-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/promotions/${p.id}`} className="font-medium underline-offset-4 hover:underline">
            {p.name}
          </Link>
          <Badge tone={STATE[p.state].tone}>{STATE[p.state].label}</Badge>
        </div>
        <p className="mt-1 text-body-sm text-muted">
          <span className="font-medium text-ink">{p.discount}</span> · {p.target} · {p.period}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Switch checked={p.isActive} onCheckedChange={toggle} disabled={pending} label="Включена" />
        <div className="flex">
          <Link
            href={`/admin/promotions/${p.id}`}
            aria-label={`Редактировать «${p.name}»`}
            className="grid size-11 place-items-center rounded transition-colors duration-150 hover:bg-paper-2"
          >
            <Pencil className="size-4.5" aria-hidden />
          </Link>
          <ConfirmDialog
            title={`Удалить акцию «${p.name}»?`}
            description="Цены товаров вернутся к обычным."
            onConfirm={remove}
            trigger={
              <Button variant="ghost" size="icon" aria-label={`Удалить «${p.name}»`}>
                <Trash2 aria-hidden />
              </Button>
            }
          />
        </div>
      </div>
    </li>
  );
}

export function PromotionsList({ rows }: { rows: PromotionRow[] }) {
  return (
    <Panel>
      <ul>
        {rows.map((p) => (
          <Row key={p.id} p={p} />
        ))}
      </ul>
    </Panel>
  );
}
