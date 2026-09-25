import type { SizeChartRow } from "@/lib/types";

/** Json column → typed rows (defensive: the column is free-form JSON). */
export function parseSizeChartRows(json: unknown): SizeChartRow[] {
  if (!Array.isArray(json)) return [];
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null);
  return json
    .filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null)
    .map((r) => ({ size: String(r.size ?? ""), width: num(r.width), length: num(r.length), sleeve: num(r.sleeve) }));
}
