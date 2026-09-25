import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import type { AdminProductRow } from "@/lib/admin/dto";
import { PageTitle } from "@/components/admin/ui";
import { ProductsTable } from "@/components/admin/products-table";
import { buttonVariants } from "@/components/ui/button";

export default async function ProductsPage() {
  await requireAdmin();
  const products = await db.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      category: { select: { nameRu: true } },
      colors: {
        orderBy: { sortOrder: "asc" },
        select: {
          images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
          stock: { select: { quantity: true } },
        },
      },
    },
  });

  const rows: AdminProductRow[] = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    nameUz: p.nameUz,
    nameRu: p.nameRu,
    image: p.colors.find((c) => c.images.length)?.images[0]?.url ?? null,
    category: p.category?.nameRu ?? null,
    price: p.price,
    oldPrice: p.oldPrice,
    stock: p.colors.reduce((s, c) => s + c.stock.reduce((a, x) => a + x.quantity, 0), 0),
    colors: p.colors.length,
    isNew: p.isNew,
    isBestseller: p.isBestseller,
    isFeatured: p.isFeatured,
    isHidden: p.isHidden,
  }));

  return (
    <>
      <PageTitle
        title="Товары"
        description={`Всего: ${rows.length}, скрыто: ${rows.filter((r) => r.isHidden).length}`}
        actions={
          <Link href="/admin/products/new" className={buttonVariants({ size: "sm" })}>
            <Plus aria-hidden />
            Добавить товар
          </Link>
        }
      />
      <ProductsTable rows={rows} />
    </>
  );
}
