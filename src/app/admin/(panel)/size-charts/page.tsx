import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseSizeChartRows } from "@/lib/admin/size-chart-rows";
import { EmptyState, PageTitle } from "@/components/admin/ui";
import { SizeChartsList } from "@/components/admin/size-charts-list";
import { buttonVariants } from "@/components/ui/button";

export default async function SizeChartsPage() {
  await requireAdmin();
  const charts = await db.sizeChart.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { categories: true, products: true } } },
  });

  return (
    <>
      <PageTitle
        title="Размерные сетки"
        description="Сетка задаётся категории; товару можно выбрать свою."
        actions={
          <Link href="/admin/size-charts/new" className={buttonVariants({ size: "sm" })}>
            <Plus aria-hidden />
            Добавить сетку
          </Link>
        }
      />
      {charts.length ? (
        <SizeChartsList
          rows={charts.map((c) => ({
            id: c.id,
            name: c.name,
            sizes: parseSizeChartRows(c.rows)
              .map((r) => r.size)
              .join(", "),
            categories: c._count.categories,
            products: c._count.products,
          }))}
        />
      ) : (
        <EmptyState title="Сеток пока нет" />
      )}
    </>
  );
}
