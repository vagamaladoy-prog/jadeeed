import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseSizeChartRows } from "@/lib/admin/size-chart-rows";
import { PageTitle } from "@/components/admin/ui";
import { SizeChartForm } from "@/components/admin/size-chart-form";

export default async function EditSizeChartPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const chart = await db.sizeChart.findUnique({ where: { id } });
  if (!chart) notFound();

  return (
    <>
      <PageTitle
        back={
          <Link href="/admin/size-charts" className="mb-2 inline-flex min-h-11 items-center gap-1.5 text-body-sm text-muted hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden />
            Размерные сетки
          </Link>
        }
        title={chart.name}
      />
      <SizeChartForm
        key={chart.updatedAt.toISOString()}
        id={chart.id}
        defaults={{
          name: chart.name,
          rows: parseSizeChartRows(chart.rows),
          noteUz: chart.noteUz ?? "",
          noteRu: chart.noteRu ?? "",
        }}
      />
    </>
  );
}
