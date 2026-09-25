import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageTitle } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { TelegramRecipients } from "@/components/admin/telegram-recipients";
import { callTelegram } from "@/lib/telegram";

async function adminBotUsername() {
  try {
    return (await callTelegram<{ username: string }>("getMe", {}, 4000, "admin")).username;
  } catch {
    return null;
  }
}

export default async function SettingsPage() {
  await requireAdmin();
  const [s, recipients, botUsername] = await Promise.all([
    db.settings.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} }),
    db.telegramRecipient.findMany({ orderBy: { createdAt: "asc" } }),
    adminBotUsername(),
  ]);

  return (
    <>
      <PageTitle title="Настройки" description="Уведомления о заказах, контакты, соцсети и тексты страниц «О бренде» и «Доставка»." />
      <div className="mb-4">
        <TelegramRecipients
          botUsername={botUsername}
          recipients={recipients.map((r) => ({ id: r.id, username: r.username, chatId: r.chatId?.toString() ?? null, name: r.name }))}
        />
      </div>
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
