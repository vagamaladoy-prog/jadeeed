"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/format";
import { FITS, SIZES } from "@/lib/types";
import { FIT_LABELS } from "@/lib/admin/labels";
import { newColor, productSchema, toInt, toIntOrNull, type ProductValues } from "@/lib/admin/schemas";
import { saveProduct } from "@/lib/admin/actions/products";
import type { Option } from "@/lib/admin/dto";
import { Checkbox, Field, Hint, Section, Select } from "./ui";
import { ProductImages } from "./product-images";
import { SaveBar } from "./save-bar";
import { ConfirmDialog } from "./confirm-dialog";
import { useUnsavedGuard } from "./use-unsaved";

export type CategoryOption = Option & { chart: string | null };


export function ProductForm({
  id,
  defaults,
  categories,
  sizeCharts,
}: {
  id: string | null;
  defaults: Partial<ProductValues>;
  categories: CategoryOption[];
  sizeCharts: Option[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [slugTouched, setSlugTouched] = useState(!!id);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProductValues>({ resolver: zodResolver(productSchema), defaultValues: defaults, mode: "onTouched" });
  useUnsavedGuard(isDirty && !pending);

  const colors = useFieldArray({ control, name: "colors" });
  const [nameUz, categoryId, slug] = useWatch({ control, name: ["nameUz", "categoryId", "slug"] });
  const categoryChart = categories.find((c) => c.value === categoryId)?.chart ?? null;

  // slug follows the Uzbek name until edited by hand
  useEffect(() => {
    if (!slugTouched) setValue("slug", slugify(nameUz ?? ""), { shouldDirty: true });
  }, [nameUz, slugTouched, setValue]);

  const submit = handleSubmit(
    (values) =>
      startTransition(async () => {
        try {
          const res = await saveProduct(id, values);
          if (!res.ok) return void toast.error(res.error);
          toast.success(id ? "Товар сохранён" : "Товар создан");
          if (!id) {
            reset(values);
            router.replace(`/admin/products/${res.id}`);
            return;
          }
          // new colours got ids — keep them so the next save updates instead of duplicating
          reset({ ...values, colors: values.colors.map((c, i) => ({ ...c, colorId: res.colorIds[i] })) });
          router.refresh();
        } catch {
          toast.error("Нет связи с сервером. Попробуйте ещё раз");
        }
      }),
    () => toast.error("Проверьте поля, отмеченные ошибкой"),
  );

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Section title="Основное">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Название (uz)" htmlFor="nameUz" error={errors.nameUz?.message}>
            <Input id="nameUz" aria-invalid={!!errors.nameUz} {...register("nameUz")} />
          </Field>
          <Field label="Название (ru)" htmlFor="nameRu" error={errors.nameRu?.message}>
            <Input id="nameRu" aria-invalid={!!errors.nameRu} {...register("nameRu")} />
          </Field>
        </div>
        <Field
          label="Адрес страницы (slug)"
          htmlFor="slug"
          error={errors.slug?.message}
          hint={
            <>
              jadeeed.uz/product/<b className="font-medium text-ink">{slug || "…"}</b>. Создаётся из названия (uz), можно изменить.
            </>
          }
        >
          <div className="flex gap-2">
            <Input
              id="slug"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={!!errors.slug}
              {...register("slug", { onChange: () => setSlugTouched(true) })}
            />
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => {
                setSlugTouched(false);
                setValue("slug", slugify(nameUz ?? ""), { shouldDirty: true, shouldValidate: true });
              }}
            >
              Из названия
            </Button>
          </div>
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Описание (uz)" htmlFor="descriptionUz" error={errors.descriptionUz?.message}>
            <Textarea id="descriptionUz" rows={5} {...register("descriptionUz")} />
          </Field>
          <Field label="Описание (ru)" htmlFor="descriptionRu" error={errors.descriptionRu?.message}>
            <Textarea id="descriptionRu" rows={5} {...register("descriptionRu")} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Категория" htmlFor="categoryId">
            <Select id="categoryId" {...register("categoryId")}>
              <option value="">Без категории</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Размерная сетка"
            htmlFor="sizeChartId"
            hint={categoryChart ? `Если не выбрать — сетка категории: «${categoryChart}»` : "Если не выбрать — используется сетка категории"}
          >
            <Select id="sizeChartId" {...register("sizeChartId")}>
              <option value="">Как у категории</option>
              {sizeCharts.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Посадка" htmlFor="fit">
            <Select id="fit" {...register("fit")}>
              {FITS.map((f) => (
                <option key={f} value={f}>
                  {FIT_LABELS[f]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Section>

      <Section title="Цена" description="Акции из раздела «Акции» пересчитывают цену автоматически и важнее старой цены.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Цена, сум" htmlFor="price" error={errors.price?.message}>
            <Input id="price" type="number" inputMode="numeric" min={0} step={1000} aria-invalid={!!errors.price} {...register("price", { setValueAs: toInt })} />
          </Field>
          <Field label="Старая цена, сум" htmlFor="oldPrice" error={errors.oldPrice?.message} hint="Необязательно. Показывается зачёркнутой, если больше цены.">
            <Input id="oldPrice" type="number" inputMode="numeric" min={0} step={1000} {...register("oldPrice", { setValueAs: toIntOrNull })} />
          </Field>
        </div>
      </Section>

      <Section title="Состав и уход">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Состав (uz)" htmlFor="compositionUz" error={errors.compositionUz?.message}>
            <Input id="compositionUz" placeholder="100% paxta" {...register("compositionUz")} />
          </Field>
          <Field label="Состав (ru)" htmlFor="compositionRu" error={errors.compositionRu?.message}>
            <Input id="compositionRu" placeholder="100% хлопок" {...register("compositionRu")} />
          </Field>
        </div>
        <Field label="Плотность, г/м²" htmlFor="density" error={errors.density?.message} className="sm:max-w-xs">
          <Input id="density" type="number" inputMode="numeric" min={1} {...register("density", { setValueAs: toIntOrNull })} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Уход (uz)" htmlFor="careUz" error={errors.careUz?.message}>
            <Textarea id="careUz" rows={3} {...register("careUz")} />
          </Field>
          <Field label="Уход (ru)" htmlFor="careRu" error={errors.careRu?.message}>
            <Textarea id="careRu" rows={3} {...register("careRu")} />
          </Field>
        </div>
      </Section>

      <Section title="Отображение">
        <div className="grid gap-x-6 sm:grid-cols-2">
          <Checkbox label="Новинка" description="Бейдж и раздел новинок" {...register("isNew")} />
          <Checkbox label="Бестселлер" description="Бейдж и подборка бестселлеров" {...register("isBestseller")} />
          <Checkbox label="На главной" description="Показывать в подборке на главной" {...register("isFeatured")} />
          <Checkbox label="Скрыт" description="Товар не виден на сайте и не продаётся" {...register("isHidden")} />
        </div>
        <Field label="Порядок" htmlFor="sortOrder" error={errors.sortOrder?.message} hint="Меньше — выше в каталоге" className="sm:max-w-xs">
          <Input id="sortOrder" type="number" inputMode="numeric" {...register("sortOrder", { setValueAs: toInt })} />
        </Field>
      </Section>

      <Section
        title="Цвета"
        description="У каждого цвета — свои фото и остатки по размерам."
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => colors.append(newColor())}>
            <Plus aria-hidden />
            <span className="hidden sm:inline">Добавить цвет</span>
            <span className="sm:hidden">Цвет</span>
          </Button>
        }
      >
        {(errors.colors?.message || errors.colors?.root?.message) && (
          <p role="alert" className="text-body-sm">
            {errors.colors?.message ?? errors.colors?.root?.message}
          </p>
        )}
        {colors.fields.map((field, index) => (
          <ColorEditor
            key={field.id}
            index={index}
            total={colors.fields.length}
            control={control}
            register={register}
            errors={errors}
            onRemove={() => colors.remove(index)}
            onMove={(to) => colors.move(index, to)}
          />
        ))}
        {colors.fields.length === 0 && <Hint>Нет цветов — добавьте хотя бы один.</Hint>}
      </Section>

      <SaveBar pending={pending} dirty={isDirty} label={id ? "Сохранить" : "Создать товар"}>
        <Link href="/admin/products" className="hidden text-body-sm text-muted underline-offset-4 hover:underline lg:inline">
          К списку товаров
        </Link>
      </SaveBar>
    </form>
  );
}

function ColorEditor({
  index,
  total,
  control,
  register,
  errors,
  onRemove,
  onMove,
}: {
  index: number;
  total: number;
  control: Control<ProductValues>;
  register: UseFormRegister<ProductValues>;
  errors: FieldErrors<ProductValues>;
  onRemove: () => void;
  onMove: (to: number) => void;
}) {
  const e = errors.colors?.[index];
  const p = `colors.${index}` as const;
  return (
    <fieldset className="rounded border border-line p-4">
      <legend className="sr-only">Цвет {index + 1}</legend>
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-body font-medium">Цвет {index + 1}</p>
        <div className="flex items-center">
          <Button type="button" variant="ghost" size="icon" disabled={index === 0} onClick={() => onMove(index - 1)} aria-label="Переместить цвет выше">
            <ArrowUp aria-hidden />
          </Button>
          <Button type="button" variant="ghost" size="icon" disabled={index === total - 1} onClick={() => onMove(index + 1)} aria-label="Переместить цвет ниже">
            <ArrowDown aria-hidden />
          </Button>
          <ConfirmDialog
            title="Удалить цвет?"
            description="Фото и остатки этого цвета удалятся после сохранения товара."
            onConfirm={onRemove}
            trigger={
              <Button type="button" variant="ghost" size="icon" aria-label={`Удалить цвет ${index + 1}`}>
                <Trash2 aria-hidden />
              </Button>
            }
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_1fr_auto]">
        <Field label="Название цвета (uz)" htmlFor={`${p}.nameUz`} error={e?.nameUz?.message}>
          <Input id={`${p}.nameUz`} placeholder="Qora" aria-invalid={!!e?.nameUz} {...register(`${p}.nameUz`)} />
        </Field>
        <Field label="Название цвета (ru)" htmlFor={`${p}.nameRu`} error={e?.nameRu?.message}>
          <Input id={`${p}.nameRu`} placeholder="Чёрная" aria-invalid={!!e?.nameRu} {...register(`${p}.nameRu`)} />
        </Field>
        <Controller
          control={control}
          name={`${p}.hex`}
          render={({ field, fieldState }) => (
            <Field label="Цвет" htmlFor={`${p}.hex`} error={fieldState.error?.message}>
              <div className="flex gap-2">
                <input
                  type="color"
                  aria-label="Выбрать цвет на палитре"
                  value={/^#[0-9a-fA-F]{6}$/.test(field.value) ? field.value : "#000000"}
                  onChange={(ev) => field.onChange(ev.target.value.toUpperCase())}
                  className="h-12 w-14 shrink-0 cursor-pointer rounded border border-line bg-white p-1"
                />
                <Input
                  id={`${p}.hex`}
                  value={field.value}
                  onChange={(ev) => field.onChange(ev.target.value)}
                  onBlur={field.onBlur}
                  maxLength={7}
                  spellCheck={false}
                  className="w-28 font-mono uppercase"
                  aria-invalid={!!fieldState.error}
                />
              </div>
            </Field>
          )}
        />
      </div>

      <div className="mt-5">
        <p className="mb-2 text-body-sm font-medium">Фото</p>
        <Controller
          control={control}
          name={`${p}.images`}
          render={({ field }) => <ProductImages value={field.value ?? []} onChange={field.onChange} />}
        />
      </div>

      <div className="mt-5">
        <p className="mb-2 text-body-sm font-medium">Остатки по размерам, шт</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {SIZES.map((size) => (
            <div key={size}>
              <label htmlFor={`${p}.stock.${size}`} className="mb-1 block text-center text-body-sm font-medium">
                {size}
              </label>
              <Input
                id={`${p}.stock.${size}`}
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="—"
                className="px-2 text-center"
                aria-invalid={!!e?.stock?.[size]}
                {...register(`${p}.stock.${size}`, { setValueAs: toIntOrNull })}
              />
            </div>
          ))}
        </div>
        {e?.stock && (
          <p role="alert" className="mt-2 text-body-sm">
            Остаток — целое число от 0
          </p>
        )}
        <Hint className="mt-2">Пусто — размера нет в линейке этого цвета. 0 — размер есть, но закончился.</Hint>
      </div>
    </fieldset>
  );
}
