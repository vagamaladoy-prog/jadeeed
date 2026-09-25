"use client";
import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { HEADER_TONE_LABELS, HEADER_TONES } from "@/lib/admin/labels";
import { bannerSchema, type BannerValues } from "@/lib/admin/schemas";
import { saveBanner } from "@/lib/admin/actions/banners";
import { Field, Hint, Section, Switch } from "./ui";
import { ImageUpload } from "./image-upload";
import { BannerPreview } from "./banner-preview";
import { SaveBar } from "./save-bar";
import { useUnsavedGuard } from "./use-unsaved";
import { cn } from "@/lib/cn";

export function BannerForm({ id, defaults }: { id: string | null; defaults: BannerValues }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<BannerValues>({ resolver: zodResolver(bannerSchema), defaultValues: defaults, mode: "onTouched" });
  useUnsavedGuard(isDirty && !pending);

  const [desktop, mobile, altRu, tone] = useWatch({ control, name: ["imageDesktop", "imageMobile", "altRu", "headerTone"] });

  const submit = handleSubmit(
    (values) =>
      startTransition(async () => {
        try {
          const res = await saveBanner(id, values);
          if (!res.ok) return void toast.error(res.error);
          toast.success(id ? "Баннер сохранён" : "Баннер добавлен");
          reset(values);
          if (!id) router.replace(`/admin/banners/${res.id}`);
          else router.refresh();
        } catch {
          toast.error("Нет связи с сервером. Попробуйте ещё раз");
        }
      }),
    () => toast.error("Проверьте поля, отмеченные ошибкой"),
  );

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-start">
      <div className="flex flex-col gap-4">
        <Section title="Картинки">
          <Controller
            control={control}
            name="imageDesktop"
            render={({ field, fieldState }) => (
              <Field label="Для ПК (обязательно)" error={fieldState.error?.message} hint="Рекомендуемый размер 2400×1800, пропорция 4:3 (ширина : высота). Верхние ~15% оставьте без текста — там лежит шапка сайта">
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  folder="banners"
                  label="картинка для ПК"
                  aspect="aspect-4/3"
                  invalid={!!fieldState.error}
                />
              </Field>
            )}
          />
          <Controller
            control={control}
            name="imageMobile"
            render={({ field }) => (
              <Field
                label="Для телефона (необязательно)"
                hint="1080×1350, пропорция 4:5; если не загрузить — на телефоне покажется ПК-версия с обрезкой по центру"
              >
                <div className="max-w-60">
                  <ImageUpload value={field.value} onChange={field.onChange} folder="banners" label="картинка для телефона" aspect="aspect-[4/5]" />
                </div>
              </Field>
            )}
          />
        </Section>

        <Section title="Текст и ссылка">
          <p className="-mt-2 text-body-sm text-muted">
            Текст на картинке (uz/ru) — для поисковиков и незрячих, на экране не показывается.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Текст на картинке (uz)" htmlFor="altUz" error={errors.altUz?.message}>
              <Input id="altUz" aria-invalid={!!errors.altUz} {...register("altUz")} />
            </Field>
            <Field label="Текст на картинке (ru)" htmlFor="altRu" error={errors.altRu?.message}>
              <Input id="altRu" aria-invalid={!!errors.altRu} {...register("altRu")} />
            </Field>
          </div>
          <Field
            label="Ссылка (необязательно)"
            htmlFor="link"
            error={errors.link?.message}
            hint="Куда ведёт нажатие: /catalog, /product/… или полный адрес https://…"
          >
            <Input id="link" inputMode="url" autoCapitalize="none" spellCheck={false} placeholder="/catalog" {...register("link")} />
          </Field>
        </Section>

        <Section title="Шапка сайта поверх баннера">
          <fieldset>
            <legend className="sr-only">Цвет шапки</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {HEADER_TONES.map((t) => (
                <label
                  key={t}
                  className={cn(
                    "flex min-h-12 cursor-pointer items-center gap-3 rounded border px-3 py-2 text-body-sm transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-navy",
                    tone === t ? "border-ink bg-paper" : "border-line hover:bg-paper",
                  )}
                >
                  <input type="radio" value={t} className="size-5 accent-ink" {...register("headerTone")} />
                  {HEADER_TONE_LABELS[t]}
                </label>
              ))}
            </div>
          </fieldset>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} label="Показывать на сайте" />}
          />
        </Section>
      </div>

      <div className="flex flex-col gap-4 xl:sticky xl:top-6">
        <Section title="Предпросмотр" description="Обновляется сразу после загрузки.">
          <BannerPreview desktop={desktop ?? ""} mobile={mobile ?? ""} alt={altRu ?? ""} tone={tone ?? "DARK"} />
          <Hint>Важное держите ближе к центру — края могут обрезаться на разных экранах.</Hint>
        </Section>
      </div>

      <div className="xl:col-span-2">
        <SaveBar pending={pending} dirty={isDirty} label={id ? "Сохранить" : "Добавить баннер"}>
          <Link href="/admin/banners" className="hidden text-body-sm text-muted underline-offset-4 hover:underline lg:inline">
            К списку баннеров
          </Link>
        </SaveBar>
      </div>
    </form>
  );
}
