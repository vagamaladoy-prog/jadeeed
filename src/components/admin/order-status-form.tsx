"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, Hint } from "./ui";
import { ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatusCode } from "@/lib/admin/labels";
import { updateOrderStatus } from "@/lib/admin/actions/orders";

export function OrderStatusForm({ orderId, status }: { orderId: string; status: OrderStatusCode }) {
  const router = useRouter();
  const [value, setValue] = useState<OrderStatusCode>(status);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      try {
        const res = await updateOrderStatus(orderId, value);
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success(`Статус: ${ORDER_STATUS_LABELS[value]}`);
        router.refresh();
      } catch {
        toast.error("Не удалось изменить статус. Проверьте соединение");
      }
    });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex flex-col gap-3"
    >
      <label htmlFor="order-status" className="sr-only">
        Статус заказа
      </label>
      <Select id="order-status" value={value} onChange={(e) => setValue(e.target.value as OrderStatusCode)} disabled={pending}>
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {ORDER_STATUS_LABELS[s]}
          </option>
        ))}
      </Select>
      {value === "CANCELLED" && status !== "CANCELLED" && <Hint>При отмене товары вернутся на склад.</Hint>}
      {status === "CANCELLED" && value !== "CANCELLED" && <Hint>Товары снова спишутся со склада.</Hint>}
      <Button type="submit" size="sm" disabled={pending || value === status}>
        {pending && <Loader2 className="animate-spin" />}
        Сохранить статус
      </Button>
    </form>
  );
}
