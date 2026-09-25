import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, groupDigits } from "@/lib/format";
import { isPromoLive } from "@/lib/pricing";
import { EmptyState, PageTitle } from "@/components/admin/ui";
import { PromotionsList, type PromotionRow } from "@/components/admin/promotions-list";
import { buttonVariants } from "@/components/ui/button";

export default async function PromotionsPage() {
  await requireAdmin();
  const promos = await db.promotion.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    include: { category: { select: { nameRu: true } }, _count: { select: { products: true } } },
  });
  const now = new Date();

  const rows: PromotionRow[] = promos.map((p) => {
    const live = isPromoLive(p, now);
    const state: PromotionRow["state"] = live
      ? "live"
      : !p.isActive
        ? "off"
        : p.startsAt && p.startsAt > now
          ? "scheduled"
          : "ended";
    return {
      id: p.id,
      name: p.name,
      discount: p.type === "PERCENT" ? `−${p.value}%` : `−${groupDigits(p.value)} сум`,
      target: p.scope === "CATEGORY" ? `Категория: ${p.category?.nameRu ?? "—"}` : `Товаров: ${p._count.products}`,
      period:
        p.startsAt || p.endsAt
          ? `${p.startsAt ? `с ${formatDateTime(p.startsAt)}` : ""}${p.startsAt && p.endsAt ? " " : ""}${p.endsAt ? `до ${formatDateTime(p.endsAt)}` : ""}`
          : "Без срока",
      isActive: p.isActive,
      state,
    };
  });

  return (
    <>
      <PageTitle
        title="Акции"
        description="Скидка применяется к цене автоматически, пока акция включена и идёт по датам. Из нескольких акций действует самая выгодная."
        actions={
          <Link href="/admin/promotions/new" className={buttonVariants({ size: "sm" })}>
            <Plus aria-hidden />
            Новая акция
          </Link>
        }
      />
      {rows.length ? <PromotionsList rows={rows} /> : <EmptyState title="Акций пока нет" />}
    </>
  );
}
