import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageTitle } from "@/components/admin/ui";
import { BannerForm } from "@/components/admin/banner-form";

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const b = await db.banner.findUnique({ where: { id } });
  if (!b) notFound();

  return (
    <>
      <PageTitle
        back={
          <Link href="/admin/banners" className="mb-2 inline-flex min-h-11 items-center gap-1.5 text-body-sm text-muted hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden />
            Баннеры
          </Link>
        }
        title="Баннер"
      />
      <BannerForm
        key={b.updatedAt.toISOString()}
        id={b.id}
        defaults={{
          imageDesktop: b.imageDesktop,
          imageMobile: b.imageMobile ?? "",
          altUz: b.altUz,
          altRu: b.altRu,
          link: b.link ?? "",
          headerTone: b.headerTone,
          isActive: b.isActive,
        }}
      />
    </>
  );
}
