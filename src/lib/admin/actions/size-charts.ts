"use server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { sizeChartSchema, type SizeChartValues } from "@/lib/admin/schemas";
import type { SizeChartRow } from "@/lib/types";
import { actionError, fail, revalidateStore, validationError, type ActionResult, type ActionResultWith } from "@/lib/admin/action";

export async function saveSizeChart(id: string | null, values: SizeChartValues): Promise<ActionResultWith<{ id: string }>> {
  await requireAdmin();
  const parsed = sizeChartSchema.safeParse(values);
  if (!parsed.success) return validationError(parsed.error);
  const v = parsed.data;
  const rows: SizeChartRow[] = v.rows.map((r) => ({ size: r.size.toUpperCase(), width: r.width, length: r.length, sleeve: r.sleeve }));
  const data = { name: v.name, rows, noteUz: v.noteUz || null, noteRu: v.noteRu || null };

  let savedId: string;
  try {
    const row = id
      ? await db.sizeChart.update({ where: { id }, data, select: { id: true } })
      : await db.sizeChart.create({ data, select: { id: true } });
    savedId = row.id;
  } catch (e) {
    return actionError(e);
  }
  revalidateStore();
  return { ok: true, id: savedId };
}

/** Categories/products using the chart lose it (onDelete: SetNull). */
export async function deleteSizeChart(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!id) return fail("Сетка не найдена");
  try {
    await db.sizeChart.delete({ where: { id } });
  } catch (e) {
    return actionError(e, "Не удалось удалить сетку");
  }
  revalidateStore();
  return { ok: true };
}
