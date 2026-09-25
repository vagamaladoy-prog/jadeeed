import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { PageTitle } from "@/components/admin/ui";
import { SizeChartForm } from "@/components/admin/size-chart-form";

export default async function NewSizeChartPage() {
  await requireAdmin();
  return (
    <>
      <PageTitle
        back={
          <Link href="/admin/size-charts" className="mb-2 inline-flex min-h-11 items-center gap-1.5 text-body-sm text-muted hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden />
            Размерные сетки
          </Link>
        }
        title="Новая сетка"
      />
      <SizeChartForm
        id={null}
        defaults={{
          name: "",
          rows: ["S", "M", "L", "XL", "XXL"].map((size) => ({ size, width: null, length: null, sleeve: null })),
          noteUz: "",
          noteRu: "",
        }}
      />
    </>
  );
}
