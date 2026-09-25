"use client";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DISCOUNT_TYPE_LABELS, DISCOUNT_TYPES, PROMOTION_SCOPE_LABELS, PROMOTION_SCOPES } from "@/lib/admin/labels";
import { promotionSchema, toInt, type PromotionValues } from "@/lib/admin/schemas";
import { savePromotion } from "@/lib/admin/actions/promotions";
import type { Option } from "@/lib/admin/dto";
import { Field, Hint, Section, Select, Switch } from "./ui";
import { SaveBar } from "./save-bar";
import { useUnsavedGuard } from "./use-unsaved";
import { cn } from "@/lib/cn";

export type ProductPick = Option & { category: string | null };

function ProductChecklist({
  products,
  value,
  onChange,
  invalid,
}: {
  products: ProductPick[];
  value: string[];
  onChange: (ids: string[]) => void;
  invalid?: boolean;
}) {
  const [q, setQ] = useState("");
  const [onlySelected, setOnlySelected] = useState(false);
  const selected = useMemo(() => new Set(value), [value]);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products.filter(
      (p) => (!onlySelected || selected.has(p.value)) && (!s || `${p.label} ${p.category ?? ""}`.toLowerCase().includes(s)),
    );
  }, [products, q, onlySelected, selected]);

  const toggle = (id: string) => onChange(selected.has(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <div className={cn("rounded border bg-white", invalid ? "border-ink" : "border-line")}>
      <div className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Найти товар"
            aria-label="Найти товар"
            className="h-11 pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange([...new Set([...value, ...shown.map((p) => p.value)])])}>
            Выбрать найденные
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])} disabled={!value.length}>
            Снять все
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-1">
        <span className="text-body-sm text-muted" aria-live="polite">
          Выбрано: {value.length}
        </span>
        <Switch checked={onlySelected} onCheckedChange={setOnlySelected} label="Только выбранные" />
      </div>
      <ul className="max-h-80 overflow-y-auto overscroll-contain p-1" role="group" aria-label="Товары акции">
        {shown.map((p) => (
          <li key={p.value}>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded px-2 transition-colors duration-150 hover:bg-paper">
              <input type="checkbox" className="size-5 shrink-0 accent-ink" checked={selected.has(p.value)} onChange={() => toggle(p.value)} />
              <span className="min-w-0 flex-1 text-body-sm">
                {p.label}
                {p.category && <span className="text-muted"> · {p.category}</span>}
              </span>
            </label>
          </li>
        ))}
        {!shown.length && <li className="px-2 py-4 text-body-sm text-muted">Ничего не найдено</li>}
      </ul>
    </div>
  );
}

export function PromotionForm({
  id,
  defaults,
  products,
  categories,
}: {
  id: string | null;
  defaults: PromotionValues;
  products: ProductPick[];
  categories: Option[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PromotionValues>({ resolver: zodResolver(promotionSchema), defaultValues: defaults, mode: "onTouched" });
  useUnsavedGuard(isDirty && !pending);
  const [type, scope] = useWatch({ control, name: ["type", "scope"] });

  const submit = handleSubmit(
    (values) =>
      startTransition(async () => {
        try {
          const res = await savePromotion(id, values);
          if (!res.ok) return void toast.error(res.error);
          toast.success(id ? "Акция сохранена" : "Акция создана");
          reset(values);
          if (!id) router.replace(`/admin/promotions/${res.id}`);
          else router.refresh();
        } catch {
          toast.error("Нет связи с сервером. Попробуйте ещё раз");
        }
      }),
    () => toast.error("Проверьте поля, отмеченные ошибкой"),
  );

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Section title="Скидка">
        <Field label="Название" htmlFor="name" error={errors.name?.message} hint="Видно только в админке">
          <Input id="name" placeholder="Например: Осенняя распродажа" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Тип скидки" htmlFor="type">
            <Select id="type" {...register("type")}>
              {DISCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "PERCENT" ? "Процент, %" : "Сумма, сум"}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label={`Размер скидки, ${DISCOUNT_TYPE_LABELS[type ?? "PERCENT"]}`}
            htmlFor="value"
            error={errors.value?.message}
            hint={type === "PERCENT" ? "От 1 до 90. Цена округляется до 1 000 сум." : "Вычитается из цены товара"}
          >
            <Input id="value" type="number" inputMode="numeric" min={1} aria-invalid={!!errors.value} {...register("value", { setValueAs: toInt })} />
          </Field>
        </div>
      </Section>

      <Section title="На что действует">
        <Field label="Область" htmlFor="scope">
          <Select id="scope" {...register("scope")}>
            {PROMOTION_SCOPES.map((s) => (
              <option key={s} value={s}>
                {PROMOTION_SCOPE_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        {scope === "CATEGORY" ? (
          <Field label="Категория" htmlFor="categoryId" error={errors.categoryId?.message}>
            <Select id="categoryId" aria-invalid={!!errors.categoryId} {...register("categoryId")}>
              <option value="">Выберите категорию</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <div>
            <p className="mb-2 text-body-sm font-medium">Товары</p>
            <Controller
              control={control}
              name="productIds"
              render={({ field, fieldState }) => (
                <>
                  <ProductChecklist products={products} value={field.value ?? []} onChange={field.onChange} invalid={!!fieldState.error} />
                  {fieldState.error && (
                    <p role="alert" className="mt-2 text-body-sm">
                      {fieldState.error.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>
        )}
      </Section>

      <Section title="Срок и статус" description="Время — ташкентское. Пустое поле — без ограничения.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Начало" htmlFor="startsAt" error={errors.startsAt?.message}>
            <Input id="startsAt" type="datetime-local" {...register("startsAt")} />
          </Field>
          <Field label="Окончание" htmlFor="endsAt" error={errors.endsAt?.message}>
            <Input id="endsAt" type="datetime-local" aria-invalid={!!errors.endsAt} {...register("endsAt")} />
          </Field>
        </div>
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} label="Акция включена" />}
        />
        <Hint>Выключенная акция не действует, даже если даты подходят.</Hint>
      </Section>

      <SaveBar pending={pending} dirty={isDirty} label={id ? "Сохранить" : "Создать акцию"}>
        <Link href="/admin/promotions" className="hidden text-body-sm text-muted underline-offset-4 hover:underline lg:inline">
          К списку акций
        </Link>
      </SaveBar>
    </form>
  );
}
