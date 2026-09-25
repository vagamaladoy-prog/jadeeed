// npm run test:order — places a real order through the same code path as the checkout form,
// checks stock decrement, pricing (promotion), cancel → stock return, and cleans up.
import "dotenv/config";
import assert from "node:assert/strict";
const { db } = await import("../src/lib/db.ts");
const { placeOrder, changeOrderStatus } = await import("../src/lib/orders.ts");

const sale = await db.product.findFirst({ where: { slug: "asos" }, include: { colors: { include: { stock: true } } } });
assert(sale, "seed product 'asos' missing — run npm run db:seed");
const color = sale.colors[0];
const stock = color.stock.find((s) => s.quantity >= 2)!;
console.log(`product ${sale.slug}, ${color.nameUz} ${stock.size}, stock ${stock.quantity}`);

const res = await placeOrder({
  name: "Test Mijoz",
  phone: "+998 90 123 45 67",
  comment: "test order — delete me",
  locale: "uz",
  items: [{ productId: sale.id, colorId: color.id, size: stock.size, qty: 2 }],
});
assert(res.ok, `order failed: ${JSON.stringify(res)}`);
console.log(`✓ order #${res.number} placed`);

const order = await db.order.findUniqueOrThrow({ where: { number: res.number }, include: { items: true } });
assert.equal(order.total, 400000, "promo −20% → 2 × 200 000");
assert.equal(order.phone, "901234567");
assert.equal(order.source, "WEB");
const after = await db.stock.findUniqueOrThrow({ where: { colorId_size: { colorId: color.id, size: stock.size } } });
assert.equal(after.quantity, stock.quantity - 2, "stock decremented");
console.log("✓ total 400 000 (promo applied), stock decremented");

const tooMany = await placeOrder({
  name: "Test", phone: "901234567", locale: "ru",
  items: [{ productId: sale.id, colorId: color.id, size: stock.size, qty: 20 }],
});
assert.equal(tooMany.ok, false);
console.log(`✓ over-stock order rejected (${!tooMany.ok && tooMany.error})`);

const bad = await placeOrder({ name: "A", phone: "123", items: [] } as never);
assert.equal(bad.ok, false);
console.log("✓ invalid input rejected");

await changeOrderStatus(order.id, "CANCELLED");
const restored = await db.stock.findUniqueOrThrow({ where: { colorId_size: { colorId: color.id, size: stock.size } } });
assert.equal(restored.quantity, stock.quantity, "stock returned on cancel");
console.log("✓ cancel returns stock");

await db.order.delete({ where: { id: order.id } });
await db.$disconnect();
console.log("all order checks passed");
