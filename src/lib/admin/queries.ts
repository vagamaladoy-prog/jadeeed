import "server-only";
import { db } from "@/lib/db";
import type { Option } from "./dto";

export async function getCategoryOptions(): Promise<(Option & { chart: string | null })[]> {
  const rows = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, nameRu: true, nameUz: true, isVisible: true, sizeChart: { select: { name: true } } },
  });
  return rows.map((c) => ({
    value: c.id,
    label: `${c.nameRu}${c.isVisible ? "" : " (скрыта)"}`,
    chart: c.sizeChart?.name ?? null,
  }));
}

export async function getSizeChartOptions(): Promise<Option[]> {
  const rows = await db.sizeChart.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return rows.map((c) => ({ value: c.id, label: c.name }));
}
