import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { EmptyState, PageTitle } from "@/components/admin/ui";
import { BannersList } from "@/components/admin/banners-list";
import { buttonVariants } from "@/components/ui/button";

export default async function BannersPage() {
  await requireAdmin();
  const banners = await db.banner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });

  return (
    <>
      <PageTitle
        title="Баннеры"
        description="Слайды на главной сверху. Порядок — как в списке."
        actions={
          <Link href="/admin/banners/new" className={buttonVariants({ size: "sm" })}>
            <Plus aria-hidden />
            Добавить баннер
          </Link>
        }
      />
      {banners.length ? (
        <BannersList
          rows={banners.map((b) => ({
            id: b.id,
            imageDesktop: b.imageDesktop,
            imageMobile: b.imageMobile,
            altRu: b.altRu,
            link: b.link,
            headerTone: b.headerTone,
            isActive: b.isActive,
          }))}
        />
      ) : (
        <EmptyState title="Баннеров пока нет">Без баннеров главная начинается сразу с блока под баннером.</EmptyState>
      )}
    </>
  );
}
