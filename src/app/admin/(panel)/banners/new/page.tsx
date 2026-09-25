import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { PageTitle } from "@/components/admin/ui";
import { BannerForm } from "@/components/admin/banner-form";

export default async function NewBannerPage() {
  await requireAdmin();
  return (
    <>
      <PageTitle
        back={
          <Link href="/admin/banners" className="mb-2 inline-flex min-h-11 items-center gap-1.5 text-body-sm text-muted hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden />
            Баннеры
          </Link>
        }
        title="Новый баннер"
      />
      <BannerForm
        id={null}
        defaults={{ imageDesktop: "", imageMobile: "", altUz: "", altRu: "", link: "", headerTone: "DARK", isActive: true }}
      />
    </>
  );
}
