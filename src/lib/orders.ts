import "server-only";
import { z } from "zod";
import { db } from "./db";
import { getLivePromos } from "./data";
import { resolvePrice } from "./pricing";
import { phoneDigits } from "./format";
import { notifyAdmins, orderMessage, validateInitData } from "./telegram";
import { SIZES, type SizeCode } from "./types";
import type { OrderStatus } from "@/generated/prisma/client";

export const orderInputSchema = z.object({
  name: z.string().trim().min(2).max(60),
  phone: z.string().refine((v) => phoneDigits(v).length === 9),
  comment: z.string().trim().max(500).optional().default(""),
  locale: z.enum(["uz", "ru"]).default("uz"),
  initData: z.string().max(4096).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        colorId: z.string().min(1),
        size: z.enum(SIZES),
        qty: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(50),
});
export type OrderInput = z.input<typeof orderInputSchema>;

export type PlaceOrderResult =
  | { ok: true; number: number }
  | { ok: false; error: "validation" | "empty" | "stock" | "generic"; unavailable?: string[] };

const key = (i: { productId: string; colorId: string; size: string }) => `${i.productId}:${i.colorId}:${i.size}`;

export async function placeOrder(raw: OrderInput): Promise<PlaceOrderResult> {
  const parsed = orderInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.some((i) => i.path[0] === "items") ? "empty" : "validation" };
  const input = parsed.data;

  // merge duplicates (same product/colour/size)
  const merged = new Map<string, (typeof input.items)[number]>();
  for (const i of input.items) {
    const prev = merged.get(key(i));
    merged.set(key(i), prev ? { ...prev, qty: prev.qty + i.qty } : i);
  }
  const items = [...merged.values()];

  const tgUser = input.initData ? validateInitData(input.initData) : null;

  const [products, promos] = await Promise.all([
    db.product.findMany({
      where: { id: { in: items.map((i) => i.productId) }, isHidden: false },
      include: {
        colors: { include: { stock: true, images: { orderBy: { position: "asc" }, take: 1 } } },
      },
    }),
    getLivePromos(),
  ]);

  const unavailable: string[] = [];
  const lines = items.map((i) => {
    const product = products.find((p) => p.id === i.productId);
    const color = product?.colors.find((c) => c.id === i.colorId);
    const stock = color?.stock.find((s) => s.size === i.size);
    if (!product || !color || !stock || stock.quantity < i.qty) unavailable.push(key(i));
    return { i, product, color };
  });
  if (unavailable.length) return { ok: false, error: "stock", unavailable };

  const orderItems = lines.map(({ i, product, color }) => ({
    productId: product!.id,
    productName: product!.nameUz,
    colorName: color!.nameRu,
    colorId: color!.id,
    size: i.size as SizeCode,
    quantity: i.qty,
    price: resolvePrice(product!, promos).price,
    image: color!.images[0]?.url ?? null,
  }));
  const total = orderItems.reduce((s, x) => s + x.price * x.quantity, 0);

  let order;
  try {
    order = await db.$transaction(async (tx) => {
      for (const it of orderItems) {
        const res = await tx.stock.updateMany({
          where: { colorId: it.colorId, size: it.size, quantity: { gte: it.quantity } },
          data: { quantity: { decrement: it.quantity } },
        });
        if (res.count !== 1) throw new StockError(`${it.productId}:${it.colorId}:${it.size}`);
      }
      return tx.order.create({
        data: {
          customerName: input.name,
          phone: phoneDigits(input.phone),
          comment: input.comment || null,
          total,
          locale: input.locale,
          source: tgUser ? "TELEGRAM" : "WEB",
          telegramId: tgUser ? BigInt(tgUser.id) : null,
          telegramUsername: tgUser?.username ?? null,
          items: { create: orderItems },
        },
        include: { items: true },
      });
    });
  } catch (e) {
    if (e instanceof StockError) return { ok: false, error: "stock", unavailable: [e.message] };
    console.error("[order] failed to save", e);
    return { ok: false, error: "generic" };
  }

  // The order is saved. Telegram problems must never break the customer's flow.
  try {
    const { sent, errors } = await notifyAdmins(orderMessage(order));
    if (errors.length) console.error(`[order #${order.number}] telegram:`, errors.join("; "));
    if (sent > 0) await db.order.update({ where: { id: order.id }, data: { notifiedAt: new Date() } });
  } catch (e) {
    console.error(`[order #${order.number}] telegram notify crashed`, e);
  }

  return { ok: true, number: order.number };
}

class StockError extends Error {}

/** Moving an order in/out of CANCELLED returns/takes stock. */
export async function changeOrderStatus(orderId: string, status: OrderStatus) {
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
    if (order.status === status) return;
    const wasCancelled = order.status === "CANCELLED";
    const nowCancelled = status === "CANCELLED";
    if (wasCancelled !== nowCancelled) {
      for (const it of order.items) {
        if (!it.colorId) continue;
        await tx.stock.updateMany({
          where: { colorId: it.colorId, size: it.size },
          data: { quantity: nowCancelled ? { increment: it.quantity } : { decrement: it.quantity } },
        });
      }
    }
    await tx.order.update({ where: { id: orderId }, data: { status } });
  });
}
