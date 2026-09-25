// npm run selftest — quick checks of pure logic (no database needed).
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { resolvePrice, isPromoLive } from "../src/lib/pricing.ts";
import { formatPhone, formatPrice, phoneDigits, slugify } from "../src/lib/format.ts";
import { applyFilters, parseFilters, filtersToQuery } from "../src/lib/catalog-filter.ts";

process.env.TELEGRAM_BOT_TOKEN = "123456:TEST_TOKEN";
process.env.NEXT_PUBLIC_SITE_URL = "https://jadeeed.test";
const { validateInitData, orderMessage } = await import("../src/lib/telegram.ts");

let n = 0;
const test = (name: string, fn: () => void) => {
  fn();
  n++;
  console.log("✓", name);
};

test("price format uz/ru", () => {
  assert.equal(formatPrice(250000, "uz"), "250 000 so'm");
  assert.equal(formatPrice(750000, "ru"), "750 000 сум");
});

test("phone mask", () => {
  assert.equal(formatPhone("901234567"), "+998 90 123 45 67");
  assert.equal(formatPhone("+998 90 12"), "+998 90 12");
  assert.equal(phoneDigits("+998 (90) 123-45-67"), "901234567");
  assert.equal(phoneDigits("998901234567"), "901234567");
});

test("slugify uz/ru", () => {
  assert.equal(slugify('Futbolka "Ko\'z tegmasin"'), "futbolka-koz-tegmasin");
  assert.equal(slugify("Футболка Сокин"), "futbolka-sokin");
});

const product = { id: "p1", price: 250000, oldPrice: null, categoryId: "c1" };
test("promo 20% → 200 000, crossed 250 000", () => {
  const r = resolvePrice(product, [{ type: "PERCENT", value: 20, scope: "PRODUCTS", categoryId: null, productIds: ["p1"] }]);
  assert.deepEqual(r, { price: 200000, compareAt: 250000, discountPercent: 20 });
});
test("category promo by amount; best promo wins", () => {
  const r = resolvePrice(product, [
    { type: "AMOUNT", value: 30000, scope: "CATEGORY", categoryId: "c1", productIds: [] },
    { type: "PERCENT", value: 10, scope: "CATEGORY", categoryId: "c1", productIds: [] },
  ]);
  assert.equal(r.price, 220000);
});
test("manual old price", () => {
  const r = resolvePrice({ ...product, oldPrice: 300000 }, []);
  assert.deepEqual(r, { price: 250000, compareAt: 300000, discountPercent: 17 });
});
test("promo dates", () => {
  const now = new Date("2026-09-25T12:00:00Z");
  assert.equal(isPromoLive({ isActive: true, startsAt: null, endsAt: null }, now), true);
  assert.equal(isPromoLive({ isActive: true, startsAt: new Date("2026-10-01"), endsAt: null }, now), false);
  assert.equal(isPromoLive({ isActive: true, startsAt: null, endsAt: new Date("2026-09-01") }, now), false);
  assert.equal(isPromoLive({ isActive: false, startsAt: null, endsAt: null }, now), false);
});

test("catalog filters round-trip + apply", () => {
  const f = parseFilters(new URLSearchParams("category=oversayz&size=M,XL&color=qora&fit=OVERSIZE&sale=1&sort=price-asc&min=100000"));
  assert.equal(filtersToQuery(f), "?category=oversayz&size=M,XL&color=qora&fit=OVERSIZE&min=100000&sale=1&sort=price-asc");
  const card = (id: string, fit: "OVERSIZE" | "REGULAR", sale: boolean, qty: number) => ({
    id, slug: id, name: { uz: id, ru: id }, categoryId: "c1", categorySlug: "oversayz", fit,
    pricing: { price: sale ? 200000 : 250000, compareAt: sale ? 250000 : null, discountPercent: sale ? 20 : null },
    isNew: false, isBestseller: false, isFeatured: false, sortOrder: 0, createdAt: 0,
    colors: [{ id: `${id}-c`, name: { uz: "Qora", ru: "Чёрная" }, hex: "#000", images: [], stock: [{ size: "M" as const, qty }] }],
  });
  const out = applyFilters([card("a", "OVERSIZE", true, 3), card("b", "OVERSIZE", true, 0), card("c", "REGULAR", true, 3)], f, new Map([["oversayz", "c1"]]));
  assert.deepEqual(out.map((p) => p.id), ["a"]);
});

test("Telegram initData signature", () => {
  const user = JSON.stringify({ id: 42, first_name: "Aziz", username: "aziz" });
  const params = new URLSearchParams({ auth_date: String(Math.floor(Date.now() / 1000)), query_id: "AAA", user });
  const dcs = [...params.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join("\n");
  const secret = createHmac("sha256", "WebAppData").update(process.env.TELEGRAM_BOT_TOKEN!).digest();
  params.set("hash", createHmac("sha256", secret).update(dcs).digest("hex"));
  assert.equal(validateInitData(params.toString())?.username, "aziz");
  params.set("user", JSON.stringify({ id: 43, username: "evil" }));
  assert.equal(validateInitData(params.toString()), null, "tampered data must fail");
});

test("admin notification text", () => {
  const raw = orderMessage({
    number: 1042,
    createdAt: new Date("2026-09-13T16:35:00Z"),
    customerName: "Азиз",
    phone: "901234567",
    comment: "позвонить после 18:00",
    total: 750000,
    source: "TELEGRAM",
    telegramUsername: "aziz",
    telegramId: 42n,
    items: [
      { productName: 'Futbolka "Men o\'sha"', colorName: "Чёрная", size: "L", quantity: 1, price: 250000 },
      { productName: 'Futbolka "Ko\'z tegmasin"', colorName: "Белая", size: "XL", quantity: 2, price: 250000 },
    ],
  });
  const text = raw.replaceAll(String.fromCharCode(0xa0), " ");
  assert.match(text, /Yangi buyurtma #1042/);
  assert.match(text, /13\.09\.2026, 21:35/);
  assert.match(text, /Телефон: \+998 90 123 45 67/);
  assert.match(text, /• Futbolka "Men o'sha" — чёрная — L — 1 шт — 250 000 сум/);
  assert.match(text, /• Futbolka "Ko'z tegmasin" — белая — XL — 2 шт — 500 000 сум/);
  assert.match(text, /Итого: 750 000 сум/);
  assert.match(text, /Источник: Telegram, @aziz/);
  assert.match(text, /https:\/\/jadeeed\.test\/admin\/orders\/1042/);
  console.log("\n" + text + "\n");
});

console.log(`${n} checks passed`);
