// npm run db:seed — fills an empty database with the Jadeeed demo catalogue (real photo shoot).
// Safe to re-run: it wipes catalogue/orders first (never run it on production data).
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Size } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! }) });

const COLORS = {
  grey: { nameUz: "Kulrang", nameRu: "Серая", hex: "#8D8B8E" },
  mocha: { nameUz: "Jigarrang", nameRu: "Коричневая", hex: "#7B5B4D" },
  purple: { nameUz: "Binafsha", nameRu: "Фиолетовая", hex: "#8A5CA6" },
  black: { nameUz: "Qora", nameRu: "Чёрная", hex: "#2A2A2C" },
} as const;
type ColorKey = keyof typeof COLORS;

const SIZES: Size[] = ["S", "M", "L", "XL", "XXL"];

const COMPOSITION = { uz: "100% paxta, yuvilgan (washed) mato", ru: "100% хлопок, варёная (washed) ткань" };
const CARE = {
  uz: "30° da teskari holda yuving. Oqartirmang. Printni dazmollamang. Yuvilgan mato har safar biroz boshqacha ko'rinadi — bu uning xususiyati.",
  ru: "Стирать при 30° наизнанку. Не отбеливать. Не гладить по принту. Варёная ткань каждый раз немного другая — это её особенность.",
};

type SeedProduct = {
  slug: string;
  nameUz: string;
  nameRu: string;
  category: "futbolkalar" | "longsliv";
  fit: "OVERSIZE" | "REGULAR" | "SLIM";
  colors: { key: ColorKey; photos: string[] }[];
  density: number;
  descUz: string;
  descRu: string;
  isNew?: boolean;
  isBestseller?: boolean;
  isFeatured?: boolean;
  sale?: boolean;
};

// photos: public/photos/<name>.webp (scripts/prepare-photos.mjs); first = front, second = back
const PRODUCTS: SeedProduct[] = [
  {
    slug: "men-osha",
    nameUz: 'Futbolka "Men o\'sha"',
    nameRu: 'Футболка "Men o\'sha"',
    category: "futbolkalar",
    fit: "OVERSIZE",
    colors: [
      { key: "mocha", photos: ["menosha-mocha-front", "menosha-mocha-back", "menosha-mocha-close", "menosha-mocha-look", "menosha-mocha-detail"] },
      { key: "black", photos: ["menosha-black-front"] },
    ],
    density: 240,
    isBestseller: true,
    isFeatured: true,
    descUz: "Old tomonda — javob: \"Men o'sha\". Orqada — Abdulla Qodiriy (1894–1938) xotirasiga naqsh. Keng yelka, erkin siluet.",
    descRu: "Спереди — ответ: \"Men o'sha\". На спине — орнамент в память об Абдулле Кадыри (1894–1938). Широкое плечо, свободный силуэт.",
  },
  {
    slug: "siz-oshami",
    nameUz: 'Futbolka "Siz o\'shami?"',
    nameRu: 'Футболка "Siz o\'shami?"',
    category: "futbolkalar",
    fit: "OVERSIZE",
    colors: [{ key: "purple", photos: ["sizoshami-purple-front", "sizoshami-purple-look"] }],
    density: 240,
    isNew: true,
    isFeatured: true,
    sale: true,
    descUz: "Savol ko'krakda. Javobni o'zingiz bilasiz. Yuvilgan binafsha paxta, oversayz bichim.",
    descRu: "Вопрос на груди. Ответ вы знаете сами. Варёный фиолетовый хлопок, крой оверсайз.",
  },
  {
    slug: "aylanib-ketay",
    nameUz: 'Futbolka "Aylanib ketay..."',
    nameRu: 'Футболка "Aylanib ketay..."',
    category: "futbolkalar",
    fit: "OVERSIZE",
    colors: [
      { key: "grey", photos: ["aylanib-grey-front", "aylanib-grey-back", "aylanib-grey-close", "aylanib-grey-back-close"] },
      { key: "mocha", photos: ["aylanib-mocha-front"] },
      { key: "purple", photos: ["aylanib-purple-front"] },
    ],
    density: 240,
    isNew: true,
    isBestseller: true,
    sale: true,
    descUz: "Old tomonda — yozma harflar bilan \"Aylanib ketay...\". Orqada — \"Ko'z tegmasin\": gullar va isiriq tutuni.",
    descRu: "Спереди — рукописное \"Aylanib ketay...\". На спине — \"Ko'z tegmasin\": цветы и дым исрыка.",
  },
  {
    slug: "aylanib-ketay-longsliv",
    nameUz: 'Longsliv "Aylanib ketay..."',
    nameRu: 'Лонгслив "Aylanib ketay..."',
    category: "longsliv",
    fit: "REGULAR",
    colors: [{ key: "grey", photos: ["longsliv-grey-front", "longsliv-grey-back", "longsliv-grey-side"] }],
    density: 220,
    isNew: true,
    sale: true,
    descUz: "Kuz uchun uzun yeng. Old tomonda — \"Aylanib ketay...\", orqada — \"Ko'z tegmasin\".",
    descRu: "Длинный рукав на осень. Спереди — \"Aylanib ketay...\", на спине — \"Ko'z tegmasin\".",
  },
];

// deterministic pseudo-random stock (some sizes sold out on purpose)
let s = 42;
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const qty = () => (rnd() < 0.12 ? 0 : 2 + Math.floor(rnd() * 14));
const photo = (name: string) => `/photos/${name}.webp`;

async function main() {
  console.log("seeding…");
  await db.$transaction([
    db.orderItem.deleteMany(),
    db.order.deleteMany(),
    db.promotion.deleteMany(),
    db.stock.deleteMany(),
    db.productImage.deleteMany(),
    db.productColor.deleteMany(),
    db.product.deleteMany(),
    db.category.deleteMany(),
    db.sizeChart.deleteMany(),
    db.banner.deleteMany(),
    db.brandPhrase.deleteMany(),
    db.settings.deleteMany(),
  ]);

  // size charts (cm)
  const oversizeChart = await db.sizeChart.create({
    data: {
      name: "Futbolka — oversayz",
      rows: [
        { size: "S", width: 56, length: 71, sleeve: 23 },
        { size: "M", width: 59, length: 73, sleeve: 24 },
        { size: "L", width: 62, length: 75, sleeve: 25 },
        { size: "XL", width: 65, length: 77, sleeve: 26 },
        { size: "XXL", width: 68, length: 79, sleeve: 27 },
      ],
      noteUz: "Oversayz: odatiy o'lchamingizni tanlang — keng o'tiradi. O'lchamlar tekis yotqizilgan mahsulotda, ±1 sm.",
      noteRu: "Оверсайз: берите свой обычный размер — сядет свободно. Замеры по изделию в разложенном виде, ±1 см.",
    },
  });
  const longChart = await db.sizeChart.create({
    data: {
      name: "Longsliv",
      rows: [
        { size: "S", width: 52, length: 70, sleeve: 62 },
        { size: "M", width: 55, length: 72, sleeve: 63 },
        { size: "L", width: 58, length: 74, sleeve: 64 },
        { size: "XL", width: 61, length: 76, sleeve: 65 },
        { size: "XXL", width: 64, length: 78, sleeve: 66 },
      ],
      noteUz: "O'lchamlar tekis yotqizilgan mahsulotda olingan, ±1 sm.",
      noteRu: "Замеры по изделию в разложенном виде, ±1 см.",
    },
  });

  const categories = {
    futbolkalar: await db.category.create({
      data: {
        slug: "futbolkalar", nameUz: "Futbolkalar", nameRu: "Футболки", sortOrder: 0, sizeChartId: oversizeChart.id,
        image: photo("menosha-mocha-front"),
        descriptionUz: "Yuvilgan paxta, oversayz bichim", descriptionRu: "Варёный хлопок, крой оверсайз",
      },
    }),
    longsliv: await db.category.create({
      data: {
        slug: "longsliv", nameUz: "Longslivlar", nameRu: "Лонгсливы", sortOrder: 1, sizeChartId: longChart.id,
        image: photo("longsliv-grey-side"),
        descriptionUz: "Uzun yeng — kuz uchun", descriptionRu: "Длинный рукав — на осень",
      },
    }),
  };

  const saleIds: string[] = [];
  for (const [i, p] of PRODUCTS.entries()) {
    const product = await db.product.create({
      data: {
        slug: p.slug,
        nameUz: p.nameUz,
        nameRu: p.nameRu,
        descriptionUz: p.descUz,
        descriptionRu: p.descRu,
        categoryId: categories[p.category].id,
        fit: p.fit,
        price: 250_000,
        compositionUz: COMPOSITION.uz,
        compositionRu: COMPOSITION.ru,
        density: p.density,
        careUz: CARE.uz,
        careRu: CARE.ru,
        isNew: !!p.isNew,
        isBestseller: !!p.isBestseller,
        isFeatured: !!p.isFeatured,
        sortOrder: i,
        createdAt: new Date(Date.now() - (PRODUCTS.length - i) * 86_400_000),
        colors: {
          create: p.colors.map((c, ci) => ({
            ...COLORS[c.key],
            sortOrder: ci,
            images: { create: c.photos.map((name, position) => ({ url: photo(name), position, width: 1200, height: 1500 })) },
            stock: { create: SIZES.map((size) => ({ size, quantity: qty() })) },
          })),
        },
      },
    });
    if (p.sale) saleIds.push(product.id);
  }

  await db.promotion.create({
    data: {
      name: "Kuz chegirmasi −20%",
      type: "PERCENT",
      value: 20,
      scope: "PRODUCTS",
      isActive: true,
      startsAt: new Date(Date.now() - 86_400_000),
      endsAt: new Date(Date.now() + 60 * 86_400_000),
      products: { connect: saleIds.map((id) => ({ id })) },
    },
  });

  await db.banner.createMany({
    data: [
      {
        imageDesktop: "/seed/banners/jadeeed-26-1-desktop.webp",
        imageMobile: "/seed/banners/jadeeed-26m-1-mobile.webp",
        altUz: "Jadeeed, kuz 2026. Yangi kolleksiya. Katalogni ko'rish",
        altRu: "Jadeeed, осень 2026. Новая коллекция. Смотреть каталог",
        link: "/catalog?sort=new",
        headerTone: "DARK",
        sortOrder: 0,
      },
      {
        imageDesktop: "/seed/banners/jadeeed-26-2-desktop.webp",
        imageMobile: "/seed/banners/jadeeed-26m-2-mobile.webp",
        altUz: "3 ta model −20% chegirma bilan",
        altRu: "3 модели со скидкой −20%",
        link: "/catalog?sale=1",
        headerTone: "LIGHT",
        sortOrder: 1,
      },
    ],
  });

  await db.brandPhrase.createMany({
    data: [
      { text: "Siz o'shami?", slots: ["HOME_QUESTION"], sortOrder: 0 },
      { text: "Men o'sha.", slots: ["ADD_TO_CART", "ABOUT"], sortOrder: 1 },
      { text: "Aylanib kelay...", slots: ["WAITING"], sortOrder: 2 },
      { text: "Ko'z tegmasin.", slots: ["THANKS", "BADGE", "ATLAS_BLOCK"], sortOrder: 3 },
    ],
  });

  await db.settings.create({
    data: {
      id: 1,
      aboutUz:
        "Jadeeed — o'zbek brendi. Biz baland ovozda gapirmaymiz: sokin rang, toza bichim, yuvilgan paxta.\n\nFutbolkalarimiz — savol va javob. Siz o'shami? Men o'sha.\n\nHar bir printning ortida — biz o'sgan so'zlar: \"Ko'z tegmasin\", \"Aylanib ketay\", Abdulla Qodiriy xotirasi.",
      aboutRu:
        "Jadeeed — узбекский бренд. Мы не говорим громко: спокойный цвет, чистый крой, варёный хлопок.\n\nНаши футболки — вопрос и ответ. Siz o'shami? Men o'sha.\n\nЗа каждым принтом — слова, с которыми мы выросли: \"Ko'z tegmasin\", \"Aylanib ketay\", память об Абдулле Кадыри.",
      deliveryUz:
        "Toshkent bo'ylab — 1–2 kun, kuryer orqali.\nViloyatlarga — 2–5 kun, pochta yoki BTS orqali.\n\nTo'lov — qabul qilganda naqd yoki kartaga o'tkazma (Click, Payme).\n\nBuyurtmadan so'ng menejer qo'ng'iroq qilib, manzil va vaqtni aniqlaydi.",
      deliveryRu:
        "По Ташкенту — 1–2 дня, курьером.\nВ регионы — 2–5 дней, почтой или BTS.\n\nОплата — наличными при получении или переводом на карту (Click, Payme).\n\nПосле заказа менеджер позвонит и уточнит адрес и время.",
    },
  });

  // three demo orders in different statuses
  const all = await db.product.findMany({
    include: { colors: { orderBy: { sortOrder: "asc" }, include: { images: { orderBy: { position: "asc" }, take: 1 } } } },
    orderBy: { sortOrder: "asc" },
  });
  const item = (p: (typeof all)[number], size: Size, quantity: number) => ({
    productId: p.id,
    productName: p.nameUz,
    colorName: p.colors[0].nameRu,
    colorId: p.colors[0].id,
    size,
    quantity,
    price: 250_000,
    image: p.colors[0].images[0]?.url ?? null,
  });
  // order numbers start at 1001
  await db.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Order"', 'number'), 1000, true)`);
  const demo = [
    { customerName: "Aziz", phone: "901234567", comment: "18:00 dan keyin qo'ng'iroq qiling", status: "NEW" as const, items: [item(all[0], "L", 1), item(all[2], "XL", 2)] },
    { customerName: "Мадина", phone: "935550011", comment: null, status: "PROCESSING" as const, items: [item(all[1], "M", 1)], source: "TELEGRAM" as const, telegramUsername: "madina_demo", telegramId: BigInt(100000001) },
    { customerName: "Bekzod", phone: "977771234", comment: "Chilonzor, 9-kvartal", status: "COMPLETED" as const, items: [item(all[3], "L", 1), item(all[0], "M", 1)] },
  ];
  for (const [i, o] of demo.entries()) {
    const { items, ...rest } = o;
    await db.order.create({
      data: {
        ...rest,
        total: items.reduce((sum, it) => sum + it.price * it.quantity, 0),
        createdAt: new Date(Date.now() - (3 - i) * 3_600_000 * 7),
        items: { create: items },
      },
    });
  }

  console.log(`done: ${PRODUCTS.length} products, 2 banners, 3 orders`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
