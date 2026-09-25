import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getCategoryOptions, getSizeChartOptions } from "@/lib/admin/queries";
import { PageTitle } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { newColor } from "@/lib/admin/schemas";

export default async function NewProductPage() {
  await requireAdmin();
  const [categories, sizeCharts] = await Promise.all([getCategoryOptions(), getSizeChartOptions()]);

  return (
    <>
      <PageTitle
        back={
          <Link href="/admin/products" className="mb-2 inline-flex min-h-11 items-center gap-1.5 text-body-sm text-muted hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden />
            Товары
          </Link>
        }
        title="Новый товар"
      />
      <ProductForm
        id={null}
        categories={categories}
        sizeCharts={sizeCharts}
        defaults={{
          nameUz: "",
          nameRu: "",
          slug: "",
          descriptionUz: "",
          descriptionRu: "",
          categoryId: "",
          sizeChartId: "",
          fit: "REGULAR",
          oldPrice: null,
          compositionUz: "",
          compositionRu: "",
          density: null,
          careUz: "",
          careRu: "",
          isNew: true,
          isBestseller: false,
          isFeatured: false,
          isHidden: false,
          sortOrder: 0,
          colors: [newColor()],
        }}
      />
    </>
  );
}
