import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSizeChartOptions } from "@/lib/admin/queries";
import { PageTitle } from "@/components/admin/ui";
import { CategoryForm } from "@/components/admin/category-form";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [c, sizeCharts] = await Promise.all([
    db.category.findUnique({ where: { id }, include: { _count: { select: { products: true } } } }),
    getSizeChartOptions(),
  ]);
  if (!c) notFound();

  return (
    <>
      <PageTitle
        back={
          <Link href="/admin/categories" className="mb-2 inline-flex min-h-11 items-center gap-1.5 text-body-sm text-muted hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden />
            Категории
          </Link>
        }
        title={c.nameRu}
      />
      <CategoryForm
        key={c.updatedAt.toISOString()}
        id={c.id}
        sizeCharts={sizeCharts}
        productCount={c._count.products}
        defaults={{
          slug: c.slug,
          nameUz: c.nameUz,
          nameRu: c.nameRu,
          descriptionUz: c.descriptionUz ?? "",
          descriptionRu: c.descriptionRu ?? "",
          image: c.image ?? "",
          sortOrder: c.sortOrder,
          isVisible: c.isVisible,
          sizeChartId: c.sizeChartId ?? "",
        }}
      />
    </>
  );
}
