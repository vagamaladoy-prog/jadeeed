// Size recommendation from height, weight and shoulder width.
// 1. estimate the chest from the body; 2. add the ease of the product's fit → the garment we want
// (cm, laid flat, same as the size chart); 3. find where it falls on the chart: M, or between M and L.
import { SIZES, type FitCode, type SizeChartDTO, type SizeChartRow, type SizeCode } from "./types";

export type BodyParams = { height: number; weight: number; shoulders: number };

export const BODY_LIMITS = {
  height: { min: 140, max: 210 },
  weight: { min: 40, max: 150 },
  shoulders: { min: 34, max: 60 },
} as const;

// half of the room around the chest (flat), and garment length as a share of height
const FIT_SHAPE: Record<FitCode, { ease: number; length: number }> = {
  OVERSIZE: { ease: 11, length: 0.417 },
  REGULAR: { ease: 7, length: 0.411 },
  SLIM: { ease: 4, length: 0.4 },
};

// typical chest per size: stands in for the chart when a product has none
const STANDARD_CHEST: Record<SizeCode, number> = { XS: 84, S: 90, M: 96, L: 102, XL: 108, XXL: 114, XXXL: 120 };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const bmiOf = ({ height, weight }: Pick<BodyParams, "height" | "weight">) => weight / (height / 100) ** 2;

/** Typical shoulder width for a body: the slider follows it until the customer moves it. */
export function typicalShoulders(height: number, weight: number) {
  const { min, max } = BODY_LIMITS.shoulders;
  return clamp(Math.round(0.25 * height + 0.1 * (weight - 70)), min, max);
}

/** Chest circumference, cm. Broader or narrower shoulders than typical shift it. */
export function chestOf(body: BodyParams) {
  const shoulders = body.shoulders - typicalShoulders(body.height, body.weight);
  return Math.max(70, 96 + 0.75 * (body.weight - 70) - 0.18 * (body.height - 175) + 0.8 * shoulders);
}

export type FitRow = SizeChartRow & { size: SizeCode };

/** Measured rows for the sizes on sale; a chart that can't be used falls back to standard chests. */
export function fitRows(chart: SizeChartDTO | null, sizes: SizeCode[], fit: FitCode): FitRow[] {
  const has = (r: SizeChartRow): r is FitRow => r.width != null && sizes.includes(r.size as SizeCode);
  const rows = (chart?.rows ?? []).filter(has).sort((a, b) => SIZES.indexOf(a.size) - SIZES.indexOf(b.size));
  if (rows.length >= 2) return rows;
  return [...sizes]
    .sort((a, b) => SIZES.indexOf(a) - SIZES.indexOf(b))
    .map((size) => ({ size, width: STANDARD_CHEST[size] / 2 + FIT_SHAPE[fit].ease, length: null, sleeve: null }));
}

/** Where a value falls on a rising series: 1.5 = halfway between the 2nd and 3rd; runs past both ends. */
function positionOn(values: number[], value: number) {
  if (values.length === 1) return (value - values[0]) / 3;
  let i = 0;
  while (i < values.length - 2 && value > values[i + 1]) i++;
  return i + (value - values[i]) / (values[i + 1] - values[i] || 1);
}

export type Recommendation = {
  /** "M" or "M-L" */
  label: string;
  /** the closest size, preselected */
  primary: SizeCode;
  /** the neighbour when the body falls between two sizes */
  between: [SizeCode, SizeCode] | null;
  /** the body is beyond what the chart offers */
  outOfRange: "below" | "above" | null;
};

const SINGLE_SIZE_MARGIN = 0.25; // this close to a size (in chart steps) → just that size
const OUT_OF_RANGE_MARGIN = 0.5;

export function recommendSize(body: BodyParams, fit: FitCode, rows: FitRow[]): Recommendation {
  const shape = FIT_SHAPE[fit];
  const byWidth = positionOn(rows.map((r) => r.width!), chestOf(body) / 2 + shape.ease);
  // width decides; length only nudges: a tall person goes up, a short one barely goes down
  const lengths = rows.every((r) => r.length != null) ? rows.map((r) => r.length!) : null;
  const byLength = lengths ? positionOn(lengths, body.height * shape.length) : byWidth;
  const position = byWidth + clamp((byLength - byWidth) * 0.2, -0.4, 0.8);

  const last = rows.length - 1;
  const at = clamp(position, 0, last);
  const lower = Math.floor(at);
  const nearest = Math.round(at);
  const outOfRange = position < -OUT_OF_RANGE_MARGIN ? "below" : position > last + OUT_OF_RANGE_MARGIN ? "above" : null;
  if (Math.abs(at - nearest) <= SINGLE_SIZE_MARGIN) {
    return { label: rows[nearest].size, primary: rows[nearest].size, between: null, outOfRange };
  }
  const between: [SizeCode, SizeCode] = [rows[lower].size, rows[lower + 1].size];
  return { label: between.join("-"), primary: rows[nearest].size, between, outOfRange };
}

export type FitVerdict = "tight" | "snug" | "ideal" | "loose" | "tooLoose";

/** How one particular size would sit on this body. */
export function fitVerdict(body: BodyParams, fit: FitCode, row: FitRow): FitVerdict {
  const chest = chestOf(body);
  const delta = row.width! - (chest / 2 + FIT_SHAPE[fit].ease);
  if (row.width! * 2 < chest + 4 || delta < -5) return "tight";
  if (delta < -1.5) return "snug";
  if (delta <= 1.5) return "ideal";
  return delta <= 6 ? "loose" : "tooLoose";
}
