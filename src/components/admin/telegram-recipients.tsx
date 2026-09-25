"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Send, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addTelegramRecipient, removeTelegramRecipient } from "@/lib/admin/actions/telegram-recipients";
import { sendTelegramTest } from "@/lib/admin/actions/settings";
import { Badge, Hint, Section } from "./ui";

export type RecipientRow = { id: string; username: string | null; chatId: string | null; name: string | null };

/** Settings → who gets order notifications from the admin bot (by @username or Telegram ID). */
export function TelegramRecipients({ recipients, botUsername }: { recipients: RecipientRow[]; botUsername: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const botLink = botUsername ? `https://t.me/${botUsername}` : null;

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await addTelegramRecipient(value);
      if (!res.ok) return void toast.error(res.error);
      toast.success("Получатель добавлен", { description: "Пусть он нажмёт Start в админ-боте — после этого начнут приходить заказы." });
      setValue("");
      router.refresh();
    });
  };

  const remove = (id: string) => {
    setBusyId(id);
    startTransition(async () => {
      const res = await removeTelegramRecipient(id);
      setBusyId(null);
      if (!res.ok) return void toast.error(res.error);
      toast.success("Получатель удалён");
      router.refresh();
    });
  };

  const test = () =>
    startTransition(async () => {
      try {
        const res = await sendTelegramTest();
        if (!res.ok) return void toast.error("Сообщение не отправлено", { description: res.error });
        toast.success(`Отправлено получателям: ${res.sent}`, { description: res.errors.length ? `Ошибки: ${res.errors.join("; ")}` : undefined });
      } catch {
        toast.error("Нет связи с сервером");
      }
    });

  return (
    <Section
      title="Уведомления о заказах в Telegram"
      description={
        <>
          О каждом новом заказе админ-бот
          {botLink && (
            <>
              {" "}
              <a href={botLink} target="_blank" rel="noopener noreferrer" className="text-navy underline underline-offset-4">
                @{botUsername}
              </a>
            </>
          )}{" "}
          пишет получателям из этого списка.
        </>
      }
    >
      <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="tg-recipient" className="sr-only">
          @username или ID в Telegram
        </label>
        <Input
          id="tg-recipient"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="@username или 123456789"
          autoComplete="off"
          className="sm:max-w-sm"
        />
        <Button type="submit" disabled={pending || !value.trim()}>
          {pending && !busyId ? <Loader2 className="animate-spin" /> : <Plus aria-hidden />}
          Добавить
        </Button>
      </form>
      <Hint>
        Telegram не даёт боту писать первым: после добавления получатель должен один раз открыть
        {botLink ? (
          <>
            {" "}
            <a href={botLink} target="_blank" rel="noopener noreferrer" className="text-navy underline underline-offset-4">
              админ-бота
            </a>
          </>
        ) : (
          " админ-бота"
        )}{" "}
        и нажать «Start». ID можно узнать у @userinfobot.
      </Hint>

      {recipients.length > 0 ? (
        <ul className="divide-y divide-line rounded border border-line">
          {recipients.map((r) => (
            <li key={r.id} className="flex min-h-14 items-center justify-between gap-3 px-4 py-2">
              <div className="min-w-0">
                <p className="truncate text-body font-medium">
                  {r.username ? `@${r.username}` : `ID ${r.chatId}`}
                  {r.name && <span className="ml-2 font-normal text-muted">{r.name}</span>}
                </p>
                {r.username && r.chatId && <p className="text-body-sm text-muted">ID {r.chatId}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {r.chatId ? <Badge tone="solid">подключён</Badge> : <Badge tone="muted">ждёт «Start»</Badge>}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Удалить ${r.username ? `@${r.username}` : r.chatId}`}
                  onClick={() => remove(r.id)}
                  disabled={pending}
                >
                  {busyId === r.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded border border-dashed border-line px-4 py-6 text-center text-body-sm text-muted">
          Пока никого нет — уведомления о заказах никуда не уходят.
        </p>
      )}

      <div>
        <Button type="button" variant="outline" size="sm" onClick={test} disabled={pending}>
          {pending && !busyId && !value ? <Loader2 className="animate-spin" /> : <Send aria-hidden />}
          Отправить тестовое сообщение
        </Button>
      </div>
    </Section>
  );
}
