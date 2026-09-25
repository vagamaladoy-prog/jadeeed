import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSizeChartOptions } from "@/lib/admin/queries";
import { PageTitle } from "@/components/admin/ui";
import { CategoryForm } from "@/components/admin/category-form";

export default async function NewCategoryPage() {
  await requireAdmin();
  const [sizeCharts, last] = await Promise.all([getSizeChartOptions(), db.category.aggregate({ _max: { sortOrder: true } })]);
  return (
    <>
      <PageTitle
        back={
          <Link href="/admin/categories" className="mb-2 inline-flex min-h-11 items-center gap-1.5 text-body-sm text-muted hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden />
            Категории
          </Link>
        }
        title="Новая категория"
      />
      <CategoryForm
        id={null}
        sizeCharts={sizeCharts}
        defaults={{
          slug: "",
          nameUz: "",
          nameRu: "",
          descriptionUz: "",
          descriptionRu: "",
          image: "",
          sortOrder: (last._max.sortOrder ?? -1) + 1,
          isVisible: true,
          sizeChartId: "",
        }}
      />
    </>
  );
}
