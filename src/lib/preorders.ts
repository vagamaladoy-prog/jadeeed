import "server-only";
import { z } from "zod";
import { db } from "./db";
import { getLivePromos } from "./data";
import { resolvePrice } from "./pricing";
import { phoneDigits } from "./format";
import { notifyAdmins, orderMessage, validateInitData } from "./telegram";
import { SIZES, type SizeCode } from "./types";

// Pre-booking of the next batch. Unlike an order it never checks or touches stock:
// any visible product, any of its colours, any size can be booked.

/** Sizes offered for pre-booking when a colour has no size rows yet. */
export const PREORDER_DEFAULT_SIZES: SizeCode[] = ["S", "M", "L", "XL", "XXL"];

export const preorderInputSchema = z.object({
  name: z.string().trim().min(2).max(60),
  phone: z.string().refine((v) => phoneDigits(v).length === 9),
  comment: z.string().trim().max(500).optional().default(""),
  locale: z.enum(["uz", "ru"]).default("uz"),
  initData: z.string().max(4096).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        colorId: z.string().min(1).max(64),
        size: z.enum(SIZES),
        qty: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(30),
});
export type PreorderInput = z.input<typeof preorderInputSchema>;

export type PlacePreorderResult = { ok: true; number: number } | { ok: false; error: "validation" | "empty" | "closed" | "gone" | "generic" };

const key = (i: { productId: string; colorId: string; size: string }) => `${i.productId}:${i.colorId}:${i.size}`;

export async function placePreorder(raw: PreorderInput): Promise<PlacePreorderResult> {
  const parsed = preorderInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.some((i) => i.path[0] === "items") ? "empty" : "validation" };
  const input = parsed.data;

  const settings = await db.settings.findUnique({ where: { id: 1 }, select: { preorderEnabled: true } });
  if (settings && !settings.preorderEnabled) return { ok: false, error: "closed" };

  const merged = new Map<string, (typeof input.items)[number]>();
  for (const i of input.items) {
    const prev = merged.get(key(i));
    merged.set(key(i), prev ? { ...prev, qty: Math.min(20, prev.qty + i.qty) } : i);
  }
  const items = [...merged.values()];

  const [products, promos] = await Promise.all([
    db.product.findMany({
      where: { id: { in: items.map((i) => i.productId) }, isHidden: false },
      include: { colors: { include: { images: { orderBy: { position: "asc" }, take: 1 } } } },
    }),
    getLivePromos(),
  ]);

  const lines = items.map((i) => {
    const product = products.find((p) => p.id === i.productId);
    const color = product?.colors.find((c) => c.id === i.colorId);
    return product && color ? { i, product, color } : null;
  });
  if (lines.some((l) => !l)) return { ok: false, error: "gone" };

  const preorderItems = lines.map((l) => ({
    productId: l!.product.id,
    productName: l!.product.nameUz,
    colorName: l!.color.nameRu,
    colorId: l!.color.id,
    size: l!.i.size as SizeCode,
    quantity: l!.i.qty,
    price: resolvePrice(l!.product, promos).price,
    image: l!.color.images[0]?.url ?? null,
  }));
  const total = preorderItems.reduce((s, x) => s + x.price * x.quantity, 0);
  const tgUser = input.initData ? validateInitData(input.initData) : null;

  let preorder;
  try {
    preorder = await db.preorder.create({
      data: {
        customerName: input.name,
        phone: phoneDigits(input.phone),
        comment: input.comment || null,
        total,
        locale: input.locale,
        source: tgUser ? "TELEGRAM" : "WEB",
        telegramId: tgUser ? BigInt(tgUser.id) : null,
        telegramUsername: tgUser?.username ?? null,
        items: { create: preorderItems },
      },
      include: { items: true },
    });
  } catch (e) {
    console.error("[preorder] failed to save", e);
    return { ok: false, error: "generic" };
  }

  // saved — Telegram problems never break the customer's flow
  try {
    const { sent, errors } = await notifyAdmins(orderMessage(preorder, "preorder"));
    if (errors.length) console.error(`[preorder #${preorder.number}] telegram:`, errors.join("; "));
    if (sent > 0) await db.preorder.update({ where: { id: preorder.id }, data: { notifiedAt: new Date() } });
  } catch (e) {
    console.error(`[preorder #${preorder.number}] telegram notify crashed`, e);
  }

  return { ok: true, number: preorder.number };
}
