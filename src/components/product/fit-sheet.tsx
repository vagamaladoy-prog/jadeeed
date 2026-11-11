"use client";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FitMannequin } from "./fit-mannequin";
import { useDesktop } from "@/hooks/use-media";
import { BODY_LIMITS, fitRows, fitVerdict, recommendSize, typicalShoulders } from "@/lib/fit";
import type { FitCode, SizeChartDTO, SizeCode } from "@/lib/types";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "jadeeed:fit-body";
type Saved = { height: number; weight: number; shoulders: number | null };
const DEFAULTS: Saved = { height: 175, weight: 70, shoulders: null };

const inRange = (v: unknown, { min, max }: { min: number; max: number }) => typeof v === "number" && v >= min && v <= max;

// remembered per visitor, so the next product opens with the same body
function readSaved(): Saved {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (inRange(s?.height, BODY_LIMITS.height) && inRange(s?.weight, BODY_LIMITS.weight))
      return { height: s.height, weight: s.weight, shoulders: inRange(s.shoulders, BODY_LIMITS.shoulders) ? s.shoulders : null };
  } catch {}
  return DEFAULTS;
}

export function FitSheet({
  open,
  onOpenChange,
  fit,
  chart,
  stock,
  onPick,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  fit: FitCode;
  chart: SizeChartDTO | null;
  stock: { size: SizeCode; qty: number }[];
  onPick: (size: SizeCode) => void;
}) {
  const t = useTranslations("fitting");
  const desktop = useDesktop();
  const [saved, setSaved] = useState(readSaved);
  const [chosen, setChosen] = useState<SizeCode | null>(null); // a size tapped by hand; null = follow the recommendation

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {}
  }, [saved]);

  // shoulders follow the body until the customer moves that slider
  const body = { height: saved.height, weight: saved.weight, shoulders: saved.shoulders ?? typicalShoulders(saved.height, saved.weight) };
  const update = (patch: Partial<Saved>) => {
    setSaved((s) => ({ ...s, ...patch }));
    setChosen(null);
  };

  const sizes = useMemo(() => stock.map((s) => s.size), [stock]);
  const rows = useMemo(() => fitRows(chart, sizes, fit), [chart, sizes, fit]);
  const rec = recommendSize(body, fit, rows);
  const size = chosen && rows.some((r) => r.size === chosen) ? chosen : rec.primary;
  const row = rows.find((r) => r.size === size) ?? null;
  const verdict = row && fitVerdict(body, fit, row);
  const qtyOf = (s: SizeCode) => stock.find((x) => x.size === s)?.qty ?? 0;
  const available = qtyOf(size) > 0;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("title")}
      side={desktop ? "right" : "bottom"}
      full={!desktop}
      footer={
        <Button size="lg" className="w-full" disabled={!available} onClick={() => onPick(size)}>
          {available ? t("pick", { size }) : t("soldOut", { size })}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <FitMannequin body={body} row={row} unit={t("cm")} />

        {/* result */}
        <div aria-live="polite" className="flex items-center gap-4 rounded border border-line bg-white p-4">
          <div className="min-w-0 flex-1">
            <p className="text-body-sm text-muted">{t("result")}</p>
            {rec.outOfRange ? (
              <p className="mt-1 text-body-sm">{t(rec.outOfRange)}</p>
            ) : (
              rec.between && <p className="mt-1 text-body-sm">{t("between", { small: rec.between[0], large: rec.between[1] })}</p>
            )}
          </div>
          <p className="shrink-0 font-display text-heading-lg font-light tracking-tighter tabular-nums">{rec.label}</p>
        </div>

        {/* a precise size, tried on the mannequin */}
        <div>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <p className="text-body-sm text-muted">{t("tryOn")}</p>
            {verdict && <p className="text-body-sm font-medium text-anor">{t(`verdict.${verdict}`)}</p>}
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("tryOn")}>
            {rows.map((r) => {
              const out = qtyOf(r.size) <= 0;
              return (
                <button
                  key={r.size}
                  type="button"
                  role="radio"
                  aria-checked={r.size === size}
                  onClick={() => setChosen(r.size)}
                  className={cn(
                    "h-11 min-w-12 rounded-pill border px-3 text-body-sm font-medium transition-colors duration-[var(--dur-hover)]",
                    r.size === size ? "border-anor bg-anor text-white" : "border-line bg-white hover:border-ink",
                    out && "line-through",
                  )}
                >
                  {r.size}
                </button>
              );
            })}
          </div>
        </div>

        {/* scales */}
        <div className="flex flex-col gap-3" data-vaul-no-drag>
          <Scale label={t("height")} unit={t("cm")} value={body.height} limits={BODY_LIMITS.height} onChange={(height) => update({ height })} />
          <Scale label={t("weight")} unit={t("kg")} value={body.weight} limits={BODY_LIMITS.weight} onChange={(weight) => update({ weight })} />
          <Scale
            label={t("shoulders")}
            hint={t("shouldersHint")}
            unit={t("cm")}
            value={body.shoulders}
            limits={BODY_LIMITS.shoulders}
            onChange={(shoulders) => update({ shoulders })}
          />
        </div>

        <p className="text-label text-muted">{t("disclaimer")}</p>
      </div>
    </Sheet>
  );
}

function Scale({
  label,
  hint,
  unit,
  value,
  limits,
  onChange,
}: {
  label: string;
  hint?: string;
  unit: string;
  value: number;
  limits: { min: number; max: number };
  onChange: (v: number) => void;
}) {
  const step = (d: number) => onChange(Math.min(limits.max, Math.max(limits.min, value + d)));
  const stepBtn = "grid size-11 shrink-0 place-items-center rounded-pill border border-line bg-white text-ink hover:border-ink disabled:opacity-40";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-body-sm">
          {label}
          {hint && <span className="ml-2 text-label text-muted">{hint}</span>}
        </p>
        <p className="shrink-0 text-body font-medium tabular-nums">
          {value} {unit}
        </p>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <button type="button" onClick={() => step(-1)} disabled={value <= limits.min} aria-label={`${label} −1`} className={stepBtn}>
          <Minus className="size-4" />
        </button>
        <input
          type="range"
          min={limits.min}
          max={limits.max}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
          className="h-11 min-w-0 flex-1 cursor-pointer accent-anor"
        />
        <button type="button" onClick={() => step(1)} disabled={value >= limits.max} aria-label={`${label} +1`} className={stepBtn}>
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}
