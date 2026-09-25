"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { Phone } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { ProductImage } from "@/components/product/product-image";
import { useCartRefresh } from "@/components/cart/use-cart-refresh";
import { useMainButton, useTelegram } from "@/components/telegram/telegram-provider";
import { useKeyboardInset } from "@/hooks/use-keyboard-inset";
import { cart, useCart } from "@/lib/cart-store";
import { formatPhone, formatPrice, phoneDigits } from "@/lib/format";
import { tr } from "@/lib/types";
import { placeOrderAction } from "@/app/[locale]/checkout/actions";

const schema = z.object({
  name: z.string().trim().min(2, "name").max(60, "name"),
  phone: z.string().refine((v) => phoneDigits(v).length === 9, "phone"),
  comment: z.string().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

export function CheckoutForm() {
  const t = useTranslations("checkout");
  const tc = useTranslations("cart");
  const locale = useLocale();
  const router = useRouter();
  const items = useCart();
  useCartRefresh();
  const { webApp, isMiniApp, haptic } = useTelegram();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const keyboard = useKeyboardInset();
  const formRef = useRef<HTMLFormElement>(null);
  const [placed, setPlaced] = useState(false);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: "", phone: "", comment: "" } });

  // Mini App: prefill the name from the Telegram profile (editable)
  useEffect(() => {
    const u = webApp?.initDataUnsafe.user;
    if (u && !getValues("name")) setValue("name", [u.first_name, u.last_name].filter(Boolean).join(" "));
  }, [webApp, getValues, setValue]);

  // empty cart (and not just ordered) → back to the cart page.
  // Reads the store directly: during hydration useCart() still returns the empty server snapshot.
  useEffect(() => {
    if (cart.get().length === 0 && !placed) router.replace("/cart");
  }, [items.length, placed, router]);

  const submit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const res = await placeOrderAction({
        name: values.name,
        phone: values.phone,
        comment: values.comment ?? "",
        locale: locale as "uz" | "ru",
        initData: webApp?.initData || undefined,
        items: items.map((i) => ({ productId: i.productId, colorId: i.colorId, size: i.size, qty: i.qty })),
      });
      if (res.ok) {
        setPlaced(true);
        haptic("success");
        cart.clear();
        router.replace(`/thanks?order=${res.number}`);
        return;
      }
      haptic("light");
      if (res.error === "stock") {
        cart.sync(new Map((res.unavailable ?? []).map((k) => [k, { maxQty: 0 }])));
        setServerError(t("errors.stock"));
      } else if (res.error === "empty") setServerError(t("errors.empty"));
      else setServerError(t("errors.generic"));
    });
  });

  const tgMain = useMainButton({ text: t("submit"), onClick: () => formRef.current?.requestSubmit(), loading: pending, visible: items.length > 0 });

  const shareContact = () => {
    webApp?.requestContact?.((ok, res) => {
      const phone = res?.responseUnsafe?.contact?.phone_number;
      if (ok && phone) setValue("phone", formatPhone(phone), { shouldValidate: true });
    });
  };

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-6 lg:col-span-7">
        <div>
          <Label htmlFor="name">{t("name")}</Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder={t("namePlaceholder")}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          {errors.name && <FieldError>{t("errors.name")}</FieldError>}
        </div>

        <div>
          <Label htmlFor="phone">{t("phone")}</Label>
          <Controller
            control={control}
            name="phone"
            render={({ field }) => {
              const digits = phoneDigits(field.value);
              return (
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+998 __ ___ __ __"
                  aria-invalid={!!errors.phone}
                  value={digits ? formatPhone(digits) : phoneFocused ? "+998 " : ""}
                  onFocus={() => setPhoneFocused(true)}
                  onBlur={() => {
                    setPhoneFocused(false);
                    field.onBlur();
                  }}
                  onChange={(e) => field.onChange(phoneDigits(e.target.value))}
                  ref={field.ref}
                  className="tabular-nums"
                />
              );
            }}
          />
          {errors.phone && <FieldError>{t("errors.phone")}</FieldError>}
          {isMiniApp && webApp?.requestContact && (
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={shareContact}>
              <Phone /> {t("shareContact")}
            </Button>
          )}
        </div>

        <div>
          <Label htmlFor="comment">
            {t("comment")} <span className="font-normal text-muted">({t("optional")})</span>
          </Label>
          <Textarea id="comment" rows={3} placeholder={t("commentPlaceholder")} {...register("comment")} />
        </div>

        {serverError && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert" className="rounded border border-ink bg-white p-4 text-body-sm">
            {serverError}{" "}
            <Link href="/cart" className="text-navy underline underline-offset-4">
              {tc("title")}
            </Link>
          </motion.div>
        )}

        <p className="text-body-sm text-muted">{t("note")}</p>

        {/* desktop submit */}
        <Button type="submit" size="lg" disabled={pending} className="hidden w-fit lg:inline-flex">
          {pending ? t("sending") : `${t("submit")} · ${formatPrice(total, locale)}`}
        </Button>

        {/* phone submit: pinned right above the keyboard (Telegram MainButton replaces it in the Mini App) */}
        {!tgMain && (
          <div
            className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper px-gutter pb-[calc(var(--safe-bottom)+8px)] pt-2 lg:hidden"
            style={{ transform: keyboard ? `translateY(-${keyboard}px)` : undefined }}
          >
            <Button type="submit" size="lg" disabled={pending} className="w-full">
              {pending ? t("sending") : `${t("submit")} · ${formatPrice(total, locale)}`}
            </Button>
          </div>
        )}
        <div className="h-20 lg:hidden" aria-hidden />
      </form>

      <aside className="order-first lg:order-none lg:col-span-5">
        <div className="rounded border border-line bg-white p-5 lg:sticky lg:top-28">
          <p className="label mb-4 text-muted">{t("summary")}</p>
          <ul className="flex flex-col gap-4">
            {items.map((i) => (
              <li key={i.key} className="flex gap-3">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded bg-paper-2">
                  {i.image && <ProductImage src={i.image} alt="" sizes="64px" />}
                </div>
                <div className="min-w-0 flex-1 text-body-sm">
                  <p className="truncate font-medium">{tr(i.name, locale)}</p>
                  <p className="text-muted">
                    {tr(i.colorName, locale)} · {i.size} · {i.qty}×
                  </p>
                  {i.maxQty <= 0 && <p className="font-medium text-ink">{tc("unavailable")}</p>}
                </div>
                <p className="text-body-sm font-medium tabular-nums">{formatPrice(i.price * i.qty, locale)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-body text-muted">{tc("total")}</span>
            <span className="text-heading font-medium tabular-nums">{formatPrice(total, locale)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
