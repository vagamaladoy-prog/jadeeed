import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getPromotionFormData } from "@/lib/admin/promotion-data";
import { PageTitle } from "@/components/admin/ui";
import { PromotionForm } from "@/components/admin/promotion-form";

export default async function NewPromotionPage() {
  await requireAdmin();
  const { products, categories } = await getPromotionFormData();
  return (
    <>
      <PageTitle
        back={
          <Link href="/admin/promotions" className="mb-2 inline-flex min-h-11 items-center gap-1.5 text-body-sm text-muted hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden />
            Акции
          </Link>
        }
        title="Новая акция"
      />
      <PromotionForm
        id={null}
        products={products}
        categories={categories}
        defaults={{
          name: "",
          type: "PERCENT",
          value: 10,
          scope: "PRODUCTS",
          productIds: [],
          categoryId: "",
          startsAt: "",
          endsAt: "",
          isActive: true,
        }}
      />
    </>
  );
}
