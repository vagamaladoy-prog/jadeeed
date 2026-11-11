"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge, Field, Hint, Select, Switch } from "./ui";
import { PREORDER_STATUSES, PREORDER_STATUS_LABELS, type PreorderStatusCode } from "@/lib/admin/labels";
import { savePreorderNote, savePreorderSettings, updatePreorderStatus } from "@/lib/admin/actions/preorders";
import type { ActionResult } from "@/lib/admin/action";

export function PreorderStatusBadge({ status }: { status: PreorderStatusCode }) {
  const tone = status === "NEW" ? "solid" : status === "ARRIVED" ? "navy" : status === "CANCELLED" || status === "COMPLETED" ? "muted" : "outline";
  return <Badge tone={tone}>{PREORDER_STATUS_LABELS[status]}</Badge>;
}

/** Runs an admin action with toasts; refreshes the page on success. */
function useAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<ActionResult>, success: string, after?: () => void) =>
    startTransition(async () => {
      try {
        const res = await fn();
        if (!res.ok) return void toast.error(res.error);
        toast.success(success);
        after?.();
        router.refresh();
      } catch {
        toast.error("Нет связи с сервером. Попробуйте ещё раз");
      }
    });
  return { pending, run };
}

export function PreorderStatusForm({ preorderId, status }: { preorderId: string; status: PreorderStatusCode }) {
  const [value, setValue] = useState<PreorderStatusCode>(status);
  const { pending, run } = useAction();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => updatePreorderStatus(preorderId, value), `Статус: ${PREORDER_STATUS_LABELS[value]}`);
      }}
      className="flex flex-col gap-3"
    >
      <label htmlFor="preorder-status" className="sr-only">
        Статус предзаказа
      </label>
      <Select id="preorder-status" value={value} onChange={(e) => setValue(e.target.value as PreorderStatusCode)} disabled={pending}>
        {PREORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {PREORDER_STATUS_LABELS[s]}
          </option>
        ))}
      </Select>
      {value === "ARRIVED" && status !== "ARRIVED" && <Hint>Не забудьте сообщить покупателю, что партия пришла.</Hint>}
      <Button type="submit" size="sm" disabled={pending || value === status}>
        {pending && <Loader2 className="animate-spin" />}
        Сохранить статус
      </Button>
    </form>
  );
}

export function PreorderNoteForm({ preorderId, note }: { preorderId: string; note: string }) {
  const [value, setValue] = useState(note);
  const { pending, run } = useAction();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => savePreorderNote(preorderId, value), "Заметка сохранена");
      }}
      className="flex flex-col gap-3"
    >
      <label htmlFor="preorder-note" className="sr-only">
        Заметка менеджера
      </label>
      <Textarea
        id="preorder-note"
        rows={3}
        maxLength={1000}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Например: позвонил, ждёт к 10 декабря"
      />
      <Button type="submit" size="sm" variant="outline" disabled={pending || value === note}>
        {pending && <Loader2 className="animate-spin" />}
        Сохранить заметку
      </Button>
    </form>
  );
}

export function PreorderSettingsForm({ enabled, noteUz, noteRu }: { enabled: boolean; noteUz: string; noteRu: string }) {
  const [on, setOn] = useState(enabled);
  const [uz, setUz] = useState(noteUz);
  const [ru, setRu] = useState(noteRu);
  const { pending, run } = useAction();
  const dirty = on !== enabled || uz !== noteUz || ru !== noteRu;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => savePreorderSettings({ enabled: on, noteUz: uz, noteRu: ru }), "Настройки предзаказа сохранены");
      }}
      className="flex flex-col gap-4"
    >
      <div>
        <Switch checked={on} onCheckedChange={setOn} label={on ? "Предзаказ открыт на сайте" : "Предзаказ закрыт"} />
        <Hint>Когда закрыт, страница предзаказа сообщает об этом и не принимает заявки.</Hint>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Когда партия — по-узбекски" htmlFor="pre-note-uz">
          <Input id="pre-note-uz" value={uz} maxLength={120} onChange={(e) => setUz(e.target.value)} placeholder="dekabr boshida" />
        </Field>
        <Field label="Когда партия — по-русски" htmlFor="pre-note-ru">
          <Input id="pre-note-ru" value={ru} maxLength={120} onChange={(e) => setRu(e.target.value)} placeholder="в начале декабря" />
        </Field>
      </div>
      <Hint>Показывается над товарами: «Следующая партия: …». Пусто — строка скрыта.</Hint>
      <Button type="submit" size="sm" className="w-fit" disabled={pending || !dirty}>
        {pending && <Loader2 className="animate-spin" />}
        Сохранить
      </Button>
    </form>
  );
}
