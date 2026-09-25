"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Input, Textarea } from "@/components/ui/input";
import { settingsSchema, type SettingsValues } from "@/lib/admin/schemas";
import { saveSettings } from "@/lib/admin/actions/settings";
import { Field, Section } from "./ui";
import { SaveBar } from "./save-bar";
import { useUnsavedGuard } from "./use-unsaved";

export function SettingsForm({ defaults }: { defaults: SettingsValues }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsValues>({ resolver: zodResolver(settingsSchema), defaultValues: defaults, mode: "onTouched" });
  useUnsavedGuard(isDirty && !pending);

  const submit = handleSubmit(
    (values) =>
      startTransition(async () => {
        try {
          const res = await saveSettings(values);
          if (!res.ok) return void toast.error(res.error);
          toast.success("Настройки сохранены");
          reset(values);
          router.refresh();
        } catch {
          toast.error("Нет связи с сервером. Попробуйте ещё раз");
        }
      }),
    () => toast.error("Проверьте поля, отмеченные ошибкой"),
  );

  const text = (name: FieldPath<SettingsValues>, label: string, props: React.ComponentProps<"input"> = {}) => (
    <Field label={label} htmlFor={name} error={errors[name]?.message}>
      <Input id={name} aria-invalid={!!errors[name]} {...props} {...register(name)} />
    </Field>
  );
  const area = (name: FieldPath<SettingsValues>, label: string, rows = 8) => (
    <Field label={label} htmlFor={name} error={errors[name]?.message}>
      <Textarea id={name} rows={rows} {...register(name)} />
    </Field>
  );
  const handle = { autoCapitalize: "none", spellCheck: false, placeholder: "без @" } as const;
  const url = { inputMode: "url", autoCapitalize: "none", spellCheck: false, placeholder: "https://" } as const;

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Section title="Соцсети и поддержка">
          <div className="grid gap-5 sm:grid-cols-2">
            {text("supportUsername", "Поддержка — username в Telegram", handle)}
            {text("supportUrl", "Поддержка — ссылка", url)}
            {text("channelUsername", "Канал — username", handle)}
            {text("channelUrl", "Канал — ссылка", url)}
            {text("instagramUsername", "Instagram — username", handle)}
            {text("instagramUrl", "Instagram — ссылка", url)}
          </div>
        </Section>

        <Section title="Контакты" description="Пустые поля на сайте не показываются.">
          {text("phone", "Телефон", { type: "tel", inputMode: "tel", placeholder: "+998 90 123 45 67" })}
          <div className="grid gap-5 sm:grid-cols-2">
            {text("addressUz", "Адрес (uz)")}
            {text("addressRu", "Адрес (ru)")}
            {text("workHoursUz", "Часы работы (uz)", { placeholder: "Har kuni 10:00–20:00" })}
            {text("workHoursRu", "Часы работы (ru)", { placeholder: "Ежедневно 10:00–20:00" })}
          </div>
        </Section>

        <Section title="Страница «О бренде»" description="Пустая строка — новый абзац.">
          <div className="grid gap-5 lg:grid-cols-2">
            {area("aboutUz", "Текст (uz)", 10)}
            {area("aboutRu", "Текст (ru)", 10)}
          </div>
        </Section>

        <Section title="Страница «Доставка и оплата»" description="Пустая строка — новый абзац.">
          <div className="grid gap-5 lg:grid-cols-2">
            {area("deliveryUz", "Текст (uz)", 10)}
            {area("deliveryRu", "Текст (ru)", 10)}
          </div>
        </Section>

        <SaveBar pending={pending} dirty={isDirty} />
      </form>
    </div>
  );
}
