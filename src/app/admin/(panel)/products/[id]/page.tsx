import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { SIZES } from "@/lib/types";
import { getCategoryOptions, getSizeChartOptions } from "@/lib/admin/queries";
import type { ColorValues } from "@/lib/admin/schemas";
import { Badge, PageTitle } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { buttonVariants } from "@/components/ui/button";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [product, categories, sizeCharts] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: {
        colors: {
          orderBy: { sortOrder: "asc" },
          include: { images: { orderBy: { position: "asc" } }, stock: true },
        },
      },
    }),
    getCategoryOptions(),
    getSizeChartOptions(),
  ]);
  if (!product) notFound();

  const colors: ColorValues[] = product.colors.map((c) => ({
    colorId: c.id,
    nameUz: c.nameUz,
    nameRu: c.nameRu,
    hex: c.hex,
    images: c.images.map((i) => i.url),
    stock: Object.fromEntries(
      SIZES.map((s) => [s, c.stock.find((x) => x.size === s)?.quantity ?? null]),
    ) as ColorValues["stock"],
  }));

  return (
    <>
      <PageTitle
        back={
          <Link href="/admin/products" className="mb-2 inline-flex min-h-11 items-center gap-1.5 text-body-sm text-muted hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden />
            Товары
          </Link>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            {product.nameUz}
            {product.isHidden && <Badge tone="muted">Скрыт</Badge>}
          </span>
        }
        actions={
          !product.isHidden && (
            <a
              href={`/product/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ExternalLink aria-hidden />
              На сайте
            </a>
          )
        }
      />
      <ProductForm
        key={product.updatedAt.toISOString()}
        id={product.id}
        categories={categories}
        sizeCharts={sizeCharts}
        defaults={{
          nameUz: product.nameUz,
          nameRu: product.nameRu,
          slug: product.slug,
          descriptionUz: product.descriptionUz,
          descriptionRu: product.descriptionRu,
          categoryId: product.categoryId ?? "",
          sizeChartId: product.sizeChartId ?? "",
          fit: product.fit,
          price: product.price,
          oldPrice: product.oldPrice,
          compositionUz: product.compositionUz,
          compositionRu: product.compositionRu,
          density: product.density,
          careUz: product.careUz,
          careRu: product.careRu,
          isNew: product.isNew,
          isBestseller: product.isBestseller,
          isFeatured: product.isFeatured,
          isHidden: product.isHidden,
          sortOrder: product.sortOrder,
          colors,
        }}
      />
    </>
  );
}
