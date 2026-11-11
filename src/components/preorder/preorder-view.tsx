"use client";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "motion/react";
import { CalendarClock, Minus, Plus, Send, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { ProductImage } from "@/components/product/product-image";
import { ExternalLink } from "@/components/contact/external-link";
import { useTelegram } from "@/components/telegram/telegram-provider";
import { useUrlParam } from "@/hooks/use-url-param";
import { formatPhone, formatPrice, phoneDigits } from "@/lib/format";
import { tr, type L10n, type SizeCode } from "@/lib/types";
import { cn } from "@/lib/cn";
import { placePreorderAction } from "@/app/[locale]/preorder/actions";

export type PreorderProduct = {
  id: string;
  slug: string;
  name: L10n;
  price: number;
  colors: { id: string; name: L10n; hex: string; image: string | null; sizes: { size: SizeCode; inStock: boolean }[] }[];
};

type Line = { productId: string; colorId: string; size: SizeCode; qty: number };
const lineKey = (l: Pick<Line, "productId" | "colorId" | "size">) => `${l.productId}:${l.colorId}:${l.size}`;
const STORAGE = "jadeeed:preorder";
const MAX_QTY = 20;

// the picked list lives in this browser (survives a reload), outside React
const EMPTY: Line[] = [];
const listeners = new Set<() => void>();
let cached: Line[] | null = null;
const readList = (): Line[] => {
  if (cached) return cached;
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE) ?? "[]");
    cached = Array.isArray(raw) ? (raw as Line[]) : EMPTY;
  } catch {
    cached = EMPTY;
  }
  return cached;
};
const writeList = (next: Line[]) => {
  cached = next;
  try {
    if (next.length) localStorage.setItem(STORAGE, JSON.stringify(next));
    else localStorage.removeItem(STORAGE);
  } catch {}
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const useList = () => useSyncExternalStore(subscribe, readList, () => EMPTY);
const updateList = (fn: (prev: Line[]) => Line[]) => writeList(fn(readList()));

const schema = z.object({
  name: z.string().trim().min(2).max(60),
  phone: z.string().refine((v) => phoneDigits(v).length === 9),
  comment: z.string().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

/**
 * Pre-booking of the next batch: pick any product / colour / size (sold out included),
 * collect them in a list (kept in this browser), leave a name and phone. Nothing is reserved from stock.
 */
export function PreorderView({
  products,
  enabled,
  note,
  channelUrl,
}: {
  products: PreorderProduct[];
  enabled: boolean;
  note: string;
  channelUrl: string;
}) {
  const t = useTranslations("preorder");
  const tc = useTranslations("checkout");
  const locale = useLocale();
  const router = useRouter();
  const { webApp, haptic } = useTelegram();
  const stored = useList();
  const [openId, setOpenId] = useState<string | null>(null);
  const [sheetUsed, setSheetUsed] = useState(false);
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  // the sheet keeps its last product while it animates closed
  const [sheetId, setSheetId] = useState<string | null>(null);
  if (openId && !sheetUsed) setSheetUsed(true);
  if (openId && openId !== sheetId) setSheetId(openId);

  // ?product=slug (from a product page) opens that product straight away
  const urlProduct = useUrlParam("product");
  const urlColor = useUrlParam("color");
  const [autoOpened, setAutoOpened] = useState(false);
  if (!autoOpened && urlProduct && enabled) {
    const p = products.find((x) => x.slug === urlProduct);
    setAutoOpened(true);
    if (p) setOpenId(p.id);
  }

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: "", phone: "", comment: "" } });
  useEffect(() => {
    const u = webApp?.initDataUnsafe.user;
    if (u && !getValues("name")) setValue("name", [u.first_name, u.last_name].filter(Boolean).join(" "));
  }, [webApp, getValues, setValue]);

  // drop anything that no longer exists (product hidden, colour or size removed)
  const resolved = stored
    .map((l) => {
      const p = products.find((x) => x.id === l.productId);
      const c = p?.colors.find((x) => x.id === l.colorId);
      return p && c ? { ...l, p, c } : null;
    })
    .filter((x) => x !== null)
    .filter((x) => x.c.sizes.some((s) => s.size === x.size));
  const lines: Line[] = resolved.map(({ productId, colorId, size, qty }) => ({ productId, colorId, size, qty }));
  const count = resolved.reduce((s, l) => s + l.qty, 0);
  const total = resolved.reduce((s, l) => s + l.qty * l.p.price, 0);

  const addLine = (l: Line) => {
    updateList((prev) => {
      const i = prev.findIndex((x) => lineKey(x) === lineKey(l));
      if (i < 0) return [...prev, l];
      const next = [...prev];
      next[i] = { ...next[i], qty: Math.min(MAX_QTY, next[i].qty + l.qty) };
      return next;
    });
    setServerError(null);
    haptic("success");
  };
  const setQty = (key: string, qty: number) =>
    updateList((prev) => (qty <= 0 ? prev.filter((x) => lineKey(x) !== key) : prev.map((x) => (lineKey(x) === key ? { ...x, qty: Math.min(MAX_QTY, qty) } : x))));

  const submit = handleSubmit((values) => {
    if (!lines.length) {
      setServerError(t("errors.empty"));
      return;
    }
    setServerError(null);
    startTransition(async () => {
      try {
        const res = await placePreorderAction({
          name: values.name,
          phone: values.phone,
          comment: values.comment ?? "",
          locale: locale as "uz" | "ru",
          initData: webApp?.initData || undefined,
          items: lines,
        });
        if (res.ok) {
          haptic("success");
          writeList(EMPTY);
          router.replace(`/thanks?preorder=${res.number}`);
          return;
        }
        haptic("light");
        setServerError(t(`errors.${res.error === "validation" ? "generic" : res.error}`));
      } catch {
        setServerError(t("errors.generic"));
      }
    });
  });

  if (!enabled) {
    return (
      <div className="max-w-xl rounded border border-line bg-white p-6">
        <p className="text-body">{t("closed")}</p>
        <Button asChild size="md" className="mt-5">
          <ExternalLink href={channelUrl}>
            <Send /> {t("channel")}
          </ExternalLink>
        </Button>
      </div>
    );
  }

  const active = products.find((p) => p.id === sheetId) ?? null;

  return (
    <>
      {note && (
        <p className="mb-8 flex w-fit items-center gap-2 rounded-pill bg-navy px-4 py-2 text-body-sm text-white">
          <CalendarClock className="size-4 shrink-0" aria-hidden /> <span className="label">{t("eyebrow")}:</span> {note}
        </p>
      )}

      <div className="grid gap-10 lg:grid-cols-12">
        <section aria-labelledby="pre-step1" className="lg:col-span-7 xl:col-span-8">
          <h2 id="pre-step1" className="mb-5 font-display text-heading font-light tracking-tight">
            1. {t("step1")}
          </h2>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3">
            {products.map((p) => {
              const c = p.colors[0];
              const soldOut = p.colors.every((x) => x.sizes.every((s) => !s.inStock));
              const picked = lines.filter((l) => l.productId === p.id).reduce((s, l) => s + l.qty, 0);
              return (
                <li key={p.id}>
                  <button type="button" onClick={() => setOpenId(p.id)} className="group block w-full text-left" aria-haspopup="dialog">
                    <span className="relative block aspect-[4/5] overflow-hidden rounded bg-paper-2">
                      {c?.image && (
                        <ProductImage
                          src={c.image}
                          alt=""
                          sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw"
                          className={cn("transition-transform duration-500 can-hover:group-hover:scale-[1.03]", soldOut && "opacity-80")}
                        />
                      )}
                      {soldOut && (
                        <span className="absolute left-2 top-2 rounded-pill bg-paper/90 px-2.5 py-1 text-label text-ink backdrop-blur">{t("soldOut")}</span>
                      )}
                      {picked > 0 && (
                        <span className="absolute right-2 top-2 grid h-7 min-w-7 place-items-center rounded-pill bg-navy px-2 text-label font-medium text-white tabular-nums">
                          {picked}
                        </span>
                      )}
                    </span>
                    <span className="mt-3 block truncate text-body font-medium">{tr(p.name, locale)}</span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="text-body-sm tabular-nums text-muted">{formatPrice(p.price, locale)}</span>
                      <span className="flex gap-1" aria-hidden>
                        {p.colors.slice(0, 5).map((x) => (
                          <span key={x.id} className="size-3 rounded-pill border border-line" style={{ backgroundColor: x.hex }} />
                        ))}
                      </span>
                    </span>
                    <span className="mt-2 flex min-h-11 w-full items-center justify-center rounded-pill border border-ink text-body-sm font-medium transition-colors duration-[var(--dur-hover)] group-hover:bg-ink group-hover:text-white">
                      {t("pick")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section ref={formRef} id="preorder-form" aria-labelledby="pre-step2" className="scroll-mt-28 lg:col-span-5 xl:col-span-4">
          <div className="rounded border border-line bg-white p-5 lg:sticky lg:top-28">
            <h2 id="pre-step2" className="mb-4 font-display text-heading font-light tracking-tight">
              2. {t("step2")}
            </h2>

            {resolved.length === 0 ? (
              <p className="rounded bg-paper-2 p-4 text-body-sm text-muted">{t("empty")}</p>
            ) : (
              <ul className="flex flex-col gap-4">
                <AnimatePresence initial={false}>
                  {resolved.map((l) => {
                    const k = lineKey(l);
                    return (
                      <motion.li
                        key={k}
                        layout
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-3"
                      >
                        <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded bg-paper-2">
                          {l.c.image && <ProductImage src={l.c.image} alt="" sizes="64px" />}
                        </div>
                        <div className="min-w-0 flex-1 text-body-sm">
                          <p className="truncate font-medium">{tr(l.p.name, locale)}</p>
                          <p className="text-muted">
                            {tr(l.c.name, locale)} · {l.size}
                          </p>
                          <Stepper
                            value={l.qty}
                            onChange={(q) => setQty(k, q)}
                            lessLabel={t("less")}
                            moreLabel={t("more")}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <p className="text-body-sm font-medium tabular-nums">{formatPrice(l.p.price * l.qty, locale)}</p>
                          <button
                            type="button"
                            onClick={() => setQty(k, 0)}
                            aria-label={`${t("remove")}: ${tr(l.p.name, locale)} ${l.size}`}
                            className="-mr-2 grid size-11 place-items-center rounded text-muted hover:text-ink"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}

            {resolved.length > 0 && (
              <div className="mt-5 border-t border-line pt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-body text-muted">
                    {t("estimate")} · {t("count", { count })}
                  </span>
                  <span className="text-heading font-medium tabular-nums">{formatPrice(total, locale)}</span>
                </div>
                <p className="mt-2 text-label text-muted">{t("priceNote")}</p>
              </div>
            )}

            <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-5">
              <div>
                <Label htmlFor="pre-name">{tc("name")}</Label>
                <Input id="pre-name" autoComplete="name" placeholder={tc("namePlaceholder")} aria-invalid={!!errors.name} {...register("name")} />
                {errors.name && <FieldError>{tc("errors.name")}</FieldError>}
              </div>
              <div>
                <Label htmlFor="pre-phone">{tc("phone")}</Label>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field }) => {
                    const digits = phoneDigits(field.value);
                    return (
                      <Input
                        id="pre-phone"
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
                {errors.phone && <FieldError>{tc("errors.phone")}</FieldError>}
              </div>
              <div>
                <Label htmlFor="pre-comment">
                  {tc("comment")} <span className="font-normal text-muted">({tc("optional")})</span>
                </Label>
                <Textarea id="pre-comment" rows={2} placeholder={tc("commentPlaceholder")} {...register("comment")} />
              </div>
              {serverError && (
                <p role="alert" className="rounded border border-ink bg-white p-3 text-body-sm">
                  {serverError}
                </p>
              )}
              <Button type="submit" size="lg" disabled={pending} className="w-full">
                {pending ? t("sending") : t("submit")}
              </Button>
            </form>
          </div>
        </section>
      </div>

      {/* phone: jump to the form once something is picked */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+var(--safe-bottom))] z-30 border-t border-line bg-paper px-gutter py-2 lg:hidden"
          >
            <Button size="lg" className="w-full" onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
              {t("toForm")} · {t("count", { count })} · {formatPrice(total, locale)}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="h-16 lg:hidden" aria-hidden />

      {sheetUsed && (
        <PickSheet
          key={active?.id ?? "none"}
          product={active}
          open={!!openId}
          initialColor={active && urlColor && active.colors.some((c) => c.id === urlColor) ? urlColor : null}
          onClose={() => setOpenId(null)}
          onAdd={(l) => {
            addLine(l);
            setOpenId(null);
          }}
        />
      )}
    </>
  );
}

function PickSheet({
  product,
  open,
  initialColor,
  onClose,
  onAdd,
}: {
  product: PreorderProduct | null;
  open: boolean;
  initialColor: string | null;
  onClose: () => void;
  onAdd: (l: Line) => void;
}) {
  const t = useTranslations("preorder");
  const tp = useTranslations("product");
  const locale = useLocale();
  const { haptic } = useTelegram();
  const [colorId, setColorId] = useState(initialColor ?? product?.colors[0]?.id ?? "");
  const [size, setSize] = useState<SizeCode | null>(null);
  const [qty, setQty] = useState(1);
  const [needSize, setNeedSize] = useState(false);
  const color = product?.colors.find((c) => c.id === colorId) ?? product?.colors[0];

  const add = () => {
    if (!product || !color) return;
    if (!size) {
      setNeedSize(true);
      haptic("light");
      return;
    }
    onAdd({ productId: product.id, colorId: color.id, size, qty });
  };

  return (
    <Sheet
      open={open && !!product}
      onOpenChange={(o) => !o && onClose()}
      title={product ? tr(product.name, locale) : ""}
      footer={
        <Button size="lg" className="w-full" onClick={add}>
          {t("add")}
          {product && ` · ${formatPrice(product.price * qty, locale)}`}
        </Button>
      }
    >
      {product && color && (
        <div className="flex flex-col gap-6 pb-2">
          <div className="flex gap-4">
            <div className="relative aspect-[4/5] w-28 shrink-0 overflow-hidden rounded bg-paper-2">
              {color.image && <ProductImage src={color.image} alt="" sizes="112px" />}
            </div>
            <div className="text-body-sm text-muted">
              <p className="text-body font-medium tabular-nums text-ink">{formatPrice(product.price, locale)}</p>
              <p className="mt-2">{t("priceNote")}</p>
            </div>
          </div>

          <div>
            <p className="mb-3 text-body-sm text-muted">
              {t("color")}: <span className="text-ink">{tr(color.name, locale)}</span>
            </p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("color")}>
              {product.colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={c.id === color.id}
                  aria-label={tr(c.name, locale)}
                  onClick={() => {
                    setColorId(c.id);
                    if (size && !c.sizes.some((s) => s.size === size)) setSize(null);
                    haptic("select");
                  }}
                  className={cn(
                    "relative size-13 overflow-hidden rounded border bg-paper-2 transition-colors duration-[var(--dur-hover)]",
                    c.id === color.id ? "border-navy outline outline-2 outline-offset-1 outline-navy" : "border-line hover:border-ink",
                  )}
                >
                  <span className="absolute inset-2 rounded-pill border border-line" style={{ backgroundColor: c.hex }} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-body-sm text-muted">{t("size")}</p>
            {/* every size can be booked — "now in stock" is only a hint */}
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("size")}>
              {color.sizes.map(({ size: s, inStock }) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={s === size}
                  onClick={() => {
                    setSize(s);
                    setNeedSize(false);
                    haptic("select");
                  }}
                  className={cn(
                    "relative grid h-12 min-w-13 place-items-center rounded-pill border px-3 text-body-sm font-medium transition-colors duration-[var(--dur-hover)]",
                    s === size ? "border-navy bg-navy text-white" : "border-line bg-white text-ink hover:border-ink",
                  )}
                >
                  {s}
                  <span className="sr-only">, {inStock ? t("inStock") : t("soldOut")}</span>
                </button>
              ))}
            </div>
            {needSize && (
              <p role="alert" className="mt-3 text-body-sm font-medium text-navy">
                {tp("chooseSize")}
              </p>
            )}
          </div>

          <div>
            <p className="mb-3 text-body-sm text-muted">{t("qty")}</p>
            <Stepper value={qty} onChange={(q) => setQty(Math.max(1, q))} lessLabel={t("less")} moreLabel={t("more")} big />
          </div>
        </div>
      )}
    </Sheet>
  );
}

function Stepper({
  value,
  onChange,
  lessLabel,
  moreLabel,
  big,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  lessLabel: string;
  moreLabel: string;
  big?: boolean;
  className?: string;
}) {
  const btn = cn("grid place-items-center rounded-pill text-ink transition-colors hover:bg-paper-2 disabled:opacity-40", big ? "size-12" : "size-11");
  return (
    <div className={cn("flex w-fit items-center rounded-pill border border-line bg-white", className)}>
      <button type="button" className={btn} onClick={() => onChange(value - 1)} aria-label={lessLabel}>
        <Minus className="size-4" />
      </button>
      <span className={cn("min-w-8 text-center font-medium tabular-nums", big ? "text-body" : "text-body-sm")} aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= MAX_QTY} aria-label={moreLabel}>
        <Plus className="size-4" />
      </button>
    </div>
  );
}
