import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { EmptyState, PageTitle } from "@/components/admin/ui";
import { CategoriesList } from "@/components/admin/categories-list";
import { buttonVariants } from "@/components/ui/button";

export default async function CategoriesPage() {
  await requireAdmin();
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      sizeChart: { select: { name: true } },
      _count: { select: { products: true, promotions: true } },
    },
  });

  return (
    <>
      <PageTitle
        title="Категории"
        actions={
          <Link href="/admin/categories/new" className={buttonVariants({ size: "sm" })}>
            <Plus aria-hidden />
            Добавить категорию
          </Link>
        }
      />
      {categories.length ? (
        <CategoriesList
          rows={categories.map((c) => ({
            id: c.id,
            slug: c.slug,
            nameUz: c.nameUz,
            nameRu: c.nameRu,
            image: c.image,
            isVisible: c.isVisible,
            sizeChart: c.sizeChart?.name ?? null,
            products: c._count.products,
            promotions: c._count.promotions,
          }))}
        />
      ) : (
        <EmptyState title="Категорий пока нет" />
      )}
    </>
  );
}
