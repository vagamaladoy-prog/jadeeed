import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageTitle } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function SettingsPage() {
  await requireAdmin();
  const s = await db.settings.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });

  return (
    <>
      <PageTitle title="Настройки" description="Контакты, соцсети и тексты страниц «О бренде» и «Доставка»." />
      <SettingsForm
        key={s.updatedAt.toISOString()}
        defaults={{
          supportUsername: s.supportUsername,
          supportUrl: s.supportUrl,
          channelUsername: s.channelUsername,
          channelUrl: s.channelUrl,
          instagramUsername: s.instagramUsername,
          instagramUrl: s.instagramUrl,
          phone: s.phone ?? "",
          addressUz: s.addressUz ?? "",
          addressRu: s.addressRu ?? "",
          workHoursUz: s.workHoursUz ?? "",
          workHoursRu: s.workHoursRu ?? "",
          aboutUz: s.aboutUz,
          aboutRu: s.aboutRu,
          deliveryUz: s.deliveryUz,
          deliveryRu: s.deliveryRu,
        }}
      />
    </>
  );
}
