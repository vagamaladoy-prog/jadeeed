// npm run test:preorder — places a real pre-booking through the same code path as the /preorder page:
// sold-out sizes are accepted, stock is untouched, closed pre-booking is refused; cleans up.
import "dotenv/config";
import assert from "node:assert/strict";
const { db } = await import("../src/lib/db.ts");
const { placePreorder } = await import("../src/lib/preorders.ts");

const product = await db.product.findFirst({ where: { isHidden: false }, include: { colors: { include: { stock: true } } } });
assert(product, "no visible product — run npm run db:seed");
const color = product.colors[0];
// a sold-out size on purpose: make one, remember the old quantity
const row = color.stock[0];
assert(row, "colour has no sizes");
const before = row.quantity;
await db.stock.update({ where: { id: row.id }, data: { quantity: 0 } });

const settings = await db.settings.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
const created: number[] = [];
try {
  const res = await placePreorder({
    name: "Test Mijoz",
    phone: "+998 90 123 45 67",
    comment: "test preorder — delete me",
    locale: "ru",
    items: [
      { productId: product.id, colorId: color.id, size: row.size, qty: 2 },
      { productId: product.id, colorId: color.id, size: row.size, qty: 1 }, // merged
    ],
  });
  assert(res.ok, `preorder failed: ${JSON.stringify(res)}`);
  created.push(res.number);
  const p = await db.preorder.findUniqueOrThrow({ where: { number: res.number }, include: { items: true } });
  assert.equal(p.items.length, 1, "duplicates merged");
  assert.equal(p.items[0].quantity, 3);
  assert.equal(p.status, "NEW");
  assert.equal(p.phone, "901234567");
  assert(p.total > 0);
  const after = await db.stock.findUniqueOrThrow({ where: { id: row.id } });
  assert.equal(after.quantity, 0, "stock untouched");
  console.log(`✓ preorder #${res.number} for a sold-out size (${row.size}), 3 pcs, ≈ ${p.total} so'm, stock untouched`);

  const gone = await placePreorder({ name: "Test", phone: "901234567", items: [{ productId: product.id, colorId: "nope", size: "M", qty: 1 }] });
  assert.deepEqual(gone, { ok: false, error: "gone" });
  const empty = await placePreorder({ name: "Test", phone: "901234567", items: [] });
  assert.deepEqual(empty, { ok: false, error: "empty" });
  const badPhone = await placePreorder({ name: "Test", phone: "123", items: [{ productId: product.id, colorId: color.id, size: "M", qty: 1 }] });
  assert.deepEqual(badPhone, { ok: false, error: "validation" });
  console.log("✓ unknown colour, empty list and bad phone rejected");

  await db.settings.update({ where: { id: 1 }, data: { preorderEnabled: false } });
  const closed = await placePreorder({ name: "Test", phone: "901234567", items: [{ productId: product.id, colorId: color.id, size: row.size, qty: 1 }] });
  assert.deepEqual(closed, { ok: false, error: "closed" });
  console.log("✓ closed pre-booking refused");
} finally {
  await db.settings.update({ where: { id: 1 }, data: { preorderEnabled: settings.preorderEnabled } });
  await db.stock.update({ where: { id: row.id }, data: { quantity: before } });
  if (created.length) await db.preorder.deleteMany({ where: { number: { in: created } } });
}
console.log("✓ cleaned up");
process.exit(0);
