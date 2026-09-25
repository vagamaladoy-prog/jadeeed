"use client";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input, Textarea } from "@/components/ui/input";
import { slugify } from "@/lib/format";
import { categorySchema, toInt, type CategoryValues } from "@/lib/admin/schemas";
import { saveCategory } from "@/lib/admin/actions/categories";
import type { Option } from "@/lib/admin/dto";
import { Field, Section, Select, Switch } from "./ui";
import { ImageUpload } from "./image-upload";
import { SaveBar } from "./save-bar";
import { useUnsavedGuard } from "./use-unsaved";

export function CategoryForm({
  id,
  defaults,
  sizeCharts,
  productCount,
}: {
  id: string | null;
  defaults: CategoryValues;
  sizeCharts: Option[];
  productCount?: number;
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
  } = useForm<CategoryValues>({ resolver: zodResolver(categorySchema), defaultValues: defaults, mode: "onTouched" });
  useUnsavedGuard(isDirty && !pending);

  const nameUz = useWatch({ control, name: "nameUz" });
  useEffect(() => {
    if (!slugTouched) setValue("slug", slugify(nameUz ?? ""), { shouldDirty: true });
  }, [nameUz, slugTouched, setValue]);

  const submit = handleSubmit(
    (values) =>
      startTransition(async () => {
        try {
          const res = await saveCategory(id, values);
          if (!res.ok) return void toast.error(res.error);
          toast.success(id ? "Категория сохранена" : "Категория создана");
          reset(values);
          if (!id) router.replace(`/admin/categories/${res.id}`);
          else router.refresh();
        } catch {
          toast.error("Нет связи с сервером. Попробуйте ещё раз");
        }
      }),
    () => toast.error("Проверьте поля, отмеченные ошибкой"),
  );

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Section title="Основное" description={productCount !== undefined ? `Товаров в категории: ${productCount}` : undefined}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Название (uz)" htmlFor="nameUz" error={errors.nameUz?.message}>
            <Input id="nameUz" aria-invalid={!!errors.nameUz} {...register("nameUz")} />
          </Field>
          <Field label="Название (ru)" htmlFor="nameRu" error={errors.nameRu?.message}>
            <Input id="nameRu" aria-invalid={!!errors.nameRu} {...register("nameRu")} />
          </Field>
        </div>
        <Field label="Адрес (slug)" htmlFor="slug" error={errors.slug?.message} hint="Латиница, цифры и дефис. Используется в ссылке на раздел каталога.">
          <Input
            id="slug"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={!!errors.slug}
            {...register("slug", { onChange: () => setSlugTouched(true) })}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Описание (uz)" htmlFor="descriptionUz" error={errors.descriptionUz?.message}>
            <Textarea id="descriptionUz" rows={3} {...register("descriptionUz")} />
          </Field>
          <Field label="Описание (ru)" htmlFor="descriptionRu" error={errors.descriptionRu?.message}>
            <Textarea id="descriptionRu" rows={3} {...register("descriptionRu")} />
          </Field>
        </div>
      </Section>

      <Section title="Картинка" description="Необязательно. Если не загрузить — на сайте возьмётся фото первого товара категории.">
        <Controller
          control={control}
          name="image"
          render={({ field }) => (
            <div className="max-w-60">
              <ImageUpload value={field.value} onChange={field.onChange} folder="categories" label="картинка категории" aspect="aspect-[4/5]" />
            </div>
          )}
        />
      </Section>

      <Section title="Настройки">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Размерная сетка" htmlFor="sizeChartId" hint="Используется для товаров, у которых своя сетка не выбрана">
            <Select id="sizeChartId" {...register("sizeChartId")}>
              <option value="">Не задана</option>
              {sizeCharts.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Порядок" htmlFor="sortOrder" error={errors.sortOrder?.message} hint="Меньше — выше в меню и каталоге">
            <Input id="sortOrder" type="number" inputMode="numeric" {...register("sortOrder", { setValueAs: toInt })} />
          </Field>
        </div>
        <Controller
          control={control}
          name="isVisible"
          render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} label="Показывать на сайте" />}
        />
      </Section>

      <SaveBar pending={pending} dirty={isDirty} label={id ? "Сохранить" : "Создать категорию"}>
        <Link href="/admin/categories" className="hidden text-body-sm text-muted underline-offset-4 hover:underline lg:inline">
          К списку категорий
        </Link>
      </SaveBar>
    </form>
  );
}
