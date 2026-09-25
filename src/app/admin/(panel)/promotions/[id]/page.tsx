import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPromotionFormData } from "@/lib/admin/promotion-data";
import { toLocalInput } from "@/lib/admin/datetime";
import { PageTitle } from "@/components/admin/ui";
import { PromotionForm } from "@/components/admin/promotion-form";

export default async function EditPromotionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [promo, { products, categories }] = await Promise.all([
    db.promotion.findUnique({ where: { id }, include: { products: { select: { id: true } } } }),
    getPromotionFormData(),
  ]);
  if (!promo) notFound();

  return (
    <>
      <PageTitle
        back={
          <Link href="/admin/promotions" className="mb-2 inline-flex min-h-11 items-center gap-1.5 text-body-sm text-muted hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden />
            Акции
          </Link>
        }
        title={promo.name}
      />
      <PromotionForm
        key={promo.updatedAt.toISOString()}
        id={promo.id}
        products={products}
        categories={categories}
        defaults={{
          name: promo.name,
          type: promo.type,
          value: promo.value,
          scope: promo.scope,
          productIds: promo.products.map((p) => p.id),
          categoryId: promo.categoryId ?? "",
          startsAt: toLocalInput(promo.startsAt),
          endsAt: toLocalInput(promo.endsAt),
          isActive: promo.isActive,
        }}
      />
    </>
  );
}
