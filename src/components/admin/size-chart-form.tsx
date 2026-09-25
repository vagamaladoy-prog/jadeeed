"use client";
import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SIZES } from "@/lib/types";
import { sizeChartSchema, toIntOrNull, type SizeChartValues } from "@/lib/admin/schemas";
import { saveSizeChart } from "@/lib/admin/actions/size-charts";
import { Field, Hint, Section } from "./ui";
import { SaveBar } from "./save-bar";
import { useUnsavedGuard } from "./use-unsaved";

const COLS = [
  { key: "width", label: "Ширина" },
  { key: "length", label: "Длина" },
  { key: "sleeve", label: "Рукав" },
] as const;

export function SizeChartForm({ id, defaults }: { id: string | null; defaults: SizeChartValues }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isDirty },
  } = useForm<SizeChartValues>({ resolver: zodResolver(sizeChartSchema), defaultValues: defaults, mode: "onTouched" });
  useUnsavedGuard(isDirty && !pending);
  const rows = useFieldArray({ control, name: "rows" });

  const addRow = () => {
    const used = new Set(getValues("rows").map((r) => r.size));
    const next = SIZES.find((s) => !used.has(s)) ?? "";
    rows.append({ size: next, width: null, length: null, sleeve: null });
  };

  const submit = handleSubmit(
    (values) =>
      startTransition(async () => {
        try {
          const res = await saveSizeChart(id, values);
          if (!res.ok) return void toast.error(res.error);
          toast.success(id ? "Сетка сохранена" : "Сетка создана");
          reset(values);
          if (!id) router.replace(`/admin/size-charts/${res.id}`);
          else router.refresh();
        } catch {
          toast.error("Нет связи с сервером. Попробуйте ещё раз");
        }
      }),
    () => toast.error("Проверьте поля, отмеченные ошибкой"),
  );

  const rowsError = errors.rows?.message ?? errors.rows?.root?.message;
  const cellError = Array.isArray(errors.rows) && (errors.rows as unknown[]).some(Boolean);

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Section title="Сетка">
        <Field label="Название" htmlFor="name" error={errors.name?.message} hint="Видно только в админке, например «Футболки оверсайз»">
          <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
        </Field>

        <div>
          <p className="mb-2 text-body-sm font-medium">Размеры, см</p>
          <div className="overflow-x-auto rounded border border-line">
            <table className="w-full min-w-[420px] border-collapse text-body-sm">
              <thead>
                <tr className="border-b border-line bg-paper">
                  <th scope="col" className="label px-2 py-2 text-left font-medium text-muted">
                    Размер
                  </th>
                  {COLS.map((c) => (
                    <th key={c.key} scope="col" className="label px-2 py-2 text-left font-medium text-muted">
                      {c.label}
                    </th>
                  ))}
                  <th scope="col">
                    <span className="sr-only">Удалить</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.fields.map((f, i) => (
                  <tr key={f.id} className="border-b border-line last:border-b-0">
                    <td className="p-1.5">
                      <Input
                        aria-label={`Размер, строка ${i + 1}`}
                        className="h-11 px-2 uppercase"
                        list="size-chart-sizes"
                        aria-invalid={!!errors.rows?.[i]?.size}
                        {...register(`rows.${i}.size`)}
                      />
                    </td>
                    {COLS.map((c) => (
                      <td key={c.key} className="p-1.5">
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          aria-label={`${c.label}, строка ${i + 1}`}
                          className="h-11 px-2"
                          aria-invalid={!!errors.rows?.[i]?.[c.key]}
                          {...register(`rows.${i}.${c.key}`, { setValueAs: toIntOrNull })}
                        />
                      </td>
                    ))}
                    <td className="w-12 p-1.5 text-center">
                      <Button type="button" variant="ghost" size="icon" onClick={() => rows.remove(i)} aria-label={`Удалить строку ${i + 1}`}>
                        <X aria-hidden />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <datalist id="size-chart-sizes">
            {SIZES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          {(rowsError || cellError) && (
            <p role="alert" className="mt-2 text-body-sm">
              {rowsError ?? "Размеры — целые сантиметры от 0 до 300, размер обязателен"}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={addRow}>
              <Plus aria-hidden />
              Добавить строку
            </Button>
            <Hint>Пустая ячейка — значение не показывается.</Hint>
          </div>
        </div>
      </Section>

      <Section title="Примечание" description="Показывается под таблицей на сайте. Необязательно.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Примечание (uz)" htmlFor="noteUz" error={errors.noteUz?.message}>
            <Textarea id="noteUz" rows={3} {...register("noteUz")} />
          </Field>
          <Field label="Примечание (ru)" htmlFor="noteRu" error={errors.noteRu?.message}>
            <Textarea id="noteRu" rows={3} placeholder="Замеры сделаны по изделию, лежащему ровно" {...register("noteRu")} />
          </Field>
        </div>
      </Section>

      <SaveBar pending={pending} dirty={isDirty} label={id ? "Сохранить" : "Создать сетку"}>
        <Link href="/admin/size-charts" className="hidden text-body-sm text-muted underline-offset-4 hover:underline lg:inline">
          К списку сеток
        </Link>
      </SaveBar>
    </form>
  );
}
