"use server";
import { requireAdmin } from "@/lib/auth";
import { changeOrderStatus } from "@/lib/orders";
import { orderStatusSchema } from "@/lib/admin/schemas";
import { actionError, fail, revalidateStore, type ActionResult } from "@/lib/admin/action";
import type { OrderStatusCode } from "@/lib/admin/labels";

export async function updateOrderStatus(orderId: string, status: OrderStatusCode): Promise<ActionResult> {
  await requireAdmin();
  const parsed = orderStatusSchema.safeParse({ orderId, status });
  if (!parsed.success) return fail("Неизвестный статус");
  try {
    await changeOrderStatus(parsed.data.orderId, parsed.data.status);
  } catch (e) {
    return actionError(e, "Не удалось изменить статус");
  }
  // cancelling returns stock → storefront availability changes
  revalidateStore();
  return { ok: true };
}
