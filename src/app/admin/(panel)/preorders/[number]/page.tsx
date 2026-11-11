import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Send } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime, formatPhone, formatPrice } from "@/lib/format";
import { Panel, PageTitle, Thumb } from "@/components/admin/ui";
import { SourceLabel } from "@/components/admin/order-bits";
import { PreorderNoteForm, PreorderStatusBadge, PreorderStatusForm } from "@/components/admin/preorder-bits";
import { buttonVariants } from "@/components/ui/button";

export default async function PreorderPage({ params }: { params: Promise<{ number: string }> }) {
  await requireAdmin();
  const { number } = await params;
  const n = Number(number);
  if (!Number.isInteger(n) || n <= 0 || n > 2_147_483_647) notFound();

  const preorder = await db.preorder.findUnique({ where: { number: n }, include: { items: true } });
  if (!preorder) notFound();

  const tel = formatPhone(preorder.phone).replace(/\s/g, "");
  const itemsCount = preorder.items.reduce((s, i) => s + i.quantity, 0);

  const rows: [string, React.ReactNode][] = [
    ["Дата", formatDateTime(preorder.createdAt)],
    ["Имя", preorder.customerName],
    [
      "Телефон",
      <a key="tel" href={`tel:${tel}`} className="underline underline-offset-4">
        {formatPhone(preorder.phone)}
      </a>,
    ],
    ["Комментарий", preorder.comment || "—"],
    ["Источник", <SourceLabel key="src" source={preorder.source} username={preorder.telegramUsername} />],
    ["Язык сайта", preorder.locale === "ru" ? "Русский" : "Узбекский"],
    ["Telegram-уведомление", preorder.notifiedAt ? `доставлено ${formatDateTime(preorder.notifiedAt)}` : "не доставлено"],
  ];
  if (preorder.source === "TELEGRAM" && !preorder.telegramUsername && preorder.telegramId)
    rows.splice(5, 0, ["Telegram ID", preorder.telegramId.toString()]);

  return (
    <>
      <PageTitle
        back={
          <Link
            href="/admin/preorders"
            className="mb-2 inline-flex min-h-11 items-center gap-1.5 text-body-sm text-muted transition-colors duration-150 hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Все предзаказы
          </Link>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            Предзаказ #{preorder.number} <PreorderStatusBadge status={preorder.status} />
          </span>
        }
        description="Бронь следующей партии — склад не списывался."
        actions={
          <>
            <a href={`tel:${tel}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Phone aria-hidden />
              Позвонить
            </a>
            {preorder.telegramUsername && (
              <a
                href={`https://t.me/${preorder.telegramUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "primary", size: "sm" })}
              >
                <Send aria-hidden />
                Написать в Telegram
              </a>
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Panel>
            <h2 className="border-b border-line px-4 py-3 text-subheading font-medium sm:px-6">
              Что забронировано <span className="text-body-sm font-normal text-muted">· {itemsCount} шт</span>
            </h2>
            <ul>
              {preorder.items.map((i) => (
                <li key={i.id} className="flex gap-4 border-b border-line px-4 py-4 last:border-b-0 sm:px-6">
                  <Thumb src={i.image} alt="" className="aspect-[4/5] w-16 shrink-0 rounded" />
                  <div className="min-w-0 flex-1">
                    {i.productId ? (
                      <Link href={`/admin/products/${i.productId}`} className="font-medium underline-offset-4 hover:underline">
                        {i.productName}
                      </Link>
                    ) : (
                      <p className="font-medium">
                        {i.productName} <span className="text-body-sm font-normal text-muted">(товар удалён)</span>
                      </p>
                    )}
                    <p className="mt-0.5 text-body-sm text-muted">
                      {i.colorName} · {i.size} · {i.quantity} шт × {formatPrice(i.price, "ru")}
                    </p>
                  </div>
                  <p className="shrink-0 whitespace-nowrap text-body-sm font-medium">{formatPrice(i.price * i.quantity, "ru")}</p>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-line px-4 py-4 sm:px-6">
              <span className="text-body font-medium">Примерно</span>
              <span className="text-subheading font-medium">{formatPrice(preorder.total, "ru")}</span>
            </div>
            <p className="border-t border-line px-4 py-3 text-body-sm text-muted sm:px-6">
              Цены — на момент брони. Окончательную сумму подтвердите покупателю, когда придёт партия.
            </p>
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel className="p-4 sm:p-6">
            <h2 className="mb-4 text-subheading font-medium">Статус</h2>
            <PreorderStatusForm key={preorder.status} preorderId={preorder.id} status={preorder.status} />
          </Panel>

          <Panel className="p-4 sm:p-6">
            <h2 className="mb-4 text-subheading font-medium">Заметка менеджера</h2>
            <PreorderNoteForm key={preorder.updatedAt.toISOString()} preorderId={preorder.id} note={preorder.adminNote ?? ""} />
          </Panel>

          <Panel className="p-4 sm:p-6">
            <h2 className="mb-4 text-subheading font-medium">Покупатель</h2>
            <dl className="flex flex-col gap-3 text-body-sm">
              {rows.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-muted">{k}</dt>
                  <dd className="mt-0.5 break-words">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}
