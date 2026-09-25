"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PHRASE_SLOT_LABELS, PHRASE_SLOTS, type PhraseSlotValue } from "@/lib/admin/labels";
import { phraseSchema, toInt, type PhraseValues } from "@/lib/admin/schemas";
import { deletePhrase, savePhrase } from "@/lib/admin/actions/phrases";
import { ConfirmDialog } from "./confirm-dialog";
import { Field, Panel, Switch } from "./ui";

type PhraseItem = { id: string; values: PhraseValues; updatedAt: string };

function PhraseCard({ id, defaults, onDone }: { id: string | null; defaults: PhraseValues; onDone?: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PhraseValues>({ resolver: zodResolver(phraseSchema), defaultValues: defaults });
  const text = useWatch({ control, name: "text" });
  const prefix = id ?? "new";

  const submit = handleSubmit((values) =>
    startTransition(async () => {
      try {
        const res = await savePhrase(id, values);
        if (!res.ok) return void toast.error(res.error);
        toast.success(id ? "Фраза сохранена" : "Фраза добавлена");
        reset(values);
        onDone?.();
        router.refresh();
      } catch {
        toast.error("Нет связи с сервером");
      }
    }),
  );

  const remove = async () => {
    if (!id) {
      onDone?.();
      return;
    }
    try {
      const res = await deletePhrase(id);
      if (!res.ok) {
        toast.error(res.error);
        return false;
      }
      toast.success("Фраза удалена");
      router.refresh();
    } catch {
      toast.error("Нет связи с сервером");
      return false;
    }
  };

  return (
    <Panel className="p-4 sm:p-6">
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <div className="rounded bg-ink px-4 py-6 text-center text-white">
          <p className="phrase break-words text-heading">{text || "…"}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
          <Field label="Текст фразы" htmlFor={`${prefix}-text`} error={errors.text?.message} hint="Пишется как есть, без перевода">
            <Input id={`${prefix}-text`} aria-invalid={!!errors.text} {...register("text")} />
          </Field>
          <Field label="Порядок" htmlFor={`${prefix}-sort`} error={errors.sortOrder?.message}>
            <Input id={`${prefix}-sort`} type="number" inputMode="numeric" {...register("sortOrder", { setValueAs: toInt })} />
          </Field>
        </div>

        <Controller
          control={control}
          name="slots"
          render={({ field }) => {
            const value: PhraseSlotValue[] = field.value ?? [];
            return (
              <fieldset>
                <legend className="mb-1 text-body-sm font-medium">Где показывать</legend>
                <div className="grid gap-x-6 sm:grid-cols-2">
                  {PHRASE_SLOTS.map((slot) => (
                    <label key={slot} className="flex min-h-11 cursor-pointer items-start gap-3 py-2.5 text-body-sm">
                      <input
                        type="checkbox"
                        className="mt-0.5 size-5 shrink-0 accent-ink"
                        checked={value.includes(slot)}
                        onChange={(e) => field.onChange(e.target.checked ? [...value, slot] : value.filter((s) => s !== slot))}
                      />
                      {PHRASE_SLOT_LABELS[slot]}
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          }}
        />

        <Controller
          control={control}
          name="inMarquee"
          render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} label="В бегущей строке" />}
        />

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <Button type="submit" size="sm" disabled={pending || (!!id && !isDirty)}>
            {pending && <Loader2 className="animate-spin" />}
            {id ? "Сохранить" : "Добавить"}
          </Button>
          {id ? (
            <ConfirmDialog
              title="Удалить фразу?"
              description="Слоты этой фразы займут следующие фразы по порядку или фразы по умолчанию."
              onConfirm={remove}
              trigger={
                <Button type="button" variant="ghost" size="sm">
                  <Trash2 aria-hidden />
                  Удалить
                </Button>
              }
            />
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={() => onDone?.()}>
              Отмена
            </Button>
          )}
          {id && isDirty && !pending && <span className="text-body-sm text-muted">Есть несохранённые изменения</span>}
        </div>
      </form>
    </Panel>
  );
}

export function PhrasesEditor({ phrases, nextSortOrder }: { phrases: PhraseItem[]; nextSortOrder: number }) {
  const [drafts, setDrafts] = useState<number[]>([]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-subheading font-medium">Все фразы</h2>
        <Button type="button" size="sm" onClick={() => setDrafts((d) => [...d, Date.now()])}>
          <Plus aria-hidden />
          Добавить фразу
        </Button>
      </div>
      {drafts.map((key, i) => (
        <PhraseCard
          key={key}
          id={null}
          defaults={{ text: "", slots: [], inMarquee: true, sortOrder: nextSortOrder + i }}
          onDone={() => setDrafts((d) => d.filter((k) => k !== key))}
        />
      ))}
      {phrases.map((p) => (
        <PhraseCard key={`${p.id}-${p.updatedAt}`} id={p.id} defaults={p.values} />
      ))}
      {!phrases.length && !drafts.length && (
        <p className="text-body-sm text-muted">Фраз пока нет — на сайте показываются фразы по умолчанию.</p>
      )}
    </div>
  );
}
