// npm run db:seed — fills an empty database with demo content.
// Safe to re-run: it wipes catalogue/orders first (never run it on production data).
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Size } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! }) });

const COLORS = {
  black: { nameUz: "Qora", nameRu: "Чёрная", hex: "#141416" },
  white: { nameUz: "Oq", nameRu: "Белая", hex: "#F7F6F2" },
  navy: { nameUz: "To'q ko'k", nameRu: "Тёмно-синяя", hex: "#1C2A55" },
} as const;
type ColorKey = keyof typeof COLORS;

const SIZES: Size[] = ["S", "M", "L", "XL", "XXL"];

const COMPOSITION = { uz: "100% paxta, penye", ru: "100% хлопок, пенье" };
const CARE = {
  uz: "30° da teskari holda yuving. Oqartirmang. Printni dazmollamang.",
  ru: "Стирать при 30° наизнанку. Не отбеливать. Не гладить по принту.",
};

type SeedProduct = {
  slug: string;
  nameUz: string;
  nameRu: string;
  category: "futbolkalar" | "oversayz" | "longsliv";
  fit: "OVERSIZE" | "REGULAR" | "SLIM";
  colors: ColorKey[];
  density: number;
  descUz: string;
  descRu: string;
  isNew?: boolean;
  isBestseller?: boolean;
  isFeatured?: boolean;
  sale?: boolean;
};

const PRODUCTS: SeedProduct[] = [
  {
    slug: "siz-oshami", nameUz: 'Futbolka "Siz o\'shami?"', nameRu: 'Футболка "Siz o\'shami?"', category: "oversayz", fit: "OVERSIZE",
    colors: ["black", "white"], density: 220, isNew: true, isFeatured: true,
    descUz: "Orqasida savol. Javobni o'zingiz bilasiz.", descRu: "На спине — вопрос. Ответ вы знаете сами.",
  },
  {
    slug: "men-osha", nameUz: 'Futbolka "Men o\'sha"', nameRu: 'Футболка "Men o\'sha"', category: "futbolkalar", fit: "REGULAR",
    colors: ["black", "white", "navy"], density: 200, isBestseller: true, isFeatured: true,
    descUz: "Klassik bichim, zich paxta. Orqada — javob.", descRu: "Классический крой, плотный хлопок. На спине — ответ.",
  },
  {
    slug: "aylanib-kelay", nameUz: 'Futbolka "Aylanib kelay"', nameRu: 'Футболка "Aylanib kelay"', category: "oversayz", fit: "OVERSIZE",
    colors: ["white", "navy"], density: 220, isNew: true,
    descUz: "Keng yelka, erkin siluet. Shoshilmaydiganlar uchun.", descRu: "Широкое плечо, свободный силуэт. Для тех, кто не спешит.",
  },
  {
    slug: "koz-tegmasin", nameUz: 'Futbolka "Ko\'z tegmasin"', nameRu: 'Футболка "Ko\'z tegmasin"', category: "futbolkalar", fit: "REGULAR",
    colors: ["black", "white"], density: 200, isBestseller: true, isFeatured: true,
    descUz: "Eng ko'p so'ralgan. Sokin va ishonchli.", descRu: "Самая спрашиваемая. Спокойная и уверенная.",
  },
  {
    slug: "asos", nameUz: "Asos futbolka", nameRu: "Базовая футболка", category: "futbolkalar", fit: "REGULAR",
    colors: ["black", "white", "navy"], density: 180, sale: true,
    descUz: "Har kungi asos. Printsiz, ortiqcha narsasiz.", descRu: "База на каждый день. Без принта, без лишнего.",
  },
  {
    slug: "sokin", nameUz: "Sokin futbolka", nameRu: "Футболка «Сокин»", category: "futbolkalar", fit: "SLIM",
    colors: ["white", "navy"], density: 180,
    descUz: "Tanaga yaqin bichim. Yengil va toza.", descRu: "Приталенный крой. Лёгкая и чистая.",
  },
  {
    slug: "tun", nameUz: 'Oversayz "Tun"', nameRu: 'Оверсайз "Tun"', category: "oversayz", fit: "OVERSIZE",
    colors: ["black", "navy"], density: 240, isNew: true,
    descUz: "Tun rangi. Og'ir, zich mato.", descRu: "Цвет ночи. Тяжёлая плотная ткань.",
  },
  {
    slug: "tong", nameUz: 'Oversayz "Tong"', nameRu: 'Оверсайз "Tong"', category: "oversayz", fit: "OVERSIZE",
    colors: ["white"], density: 240, sale: true,
    descUz: "Tong kabi oq. Keng va yumshoq.", descRu: "Белая, как рассвет. Свободная и мягкая.",
  },
  {
    slug: "ip", nameUz: 'Longsliv "Ip"', nameRu: 'Лонгслив "Ip"', category: "longsliv", fit: "REGULAR",
    colors: ["black", "white"], density: 210,
    descUz: "Uzun yeng, kuz uchun.", descRu: "Длинный рукав — для осени.",
  },
  {
    slug: "atlas", nameUz: 'Longsliv "Atlas"', nameRu: 'Лонгслив "Atlas"', category: "longsliv", fit: "REGULAR",
    colors: ["navy", "black"], density: 210, isNew: true,
    descUz: "Atlas ritmidagi sokin rang.", descRu: "Спокойный цвет в ритме атласа.",
  },
  {
    slug: "jadeeed", nameUz: 'Futbolka "Jadeeed"', nameRu: 'Футболка "Jadeeed"', category: "futbolkalar", fit: "REGULAR",
    colors: ["black", "white"], density: 200, isBestseller: true,
    descUz: "Brend nomi orqada. Oddiy va aniq.", descRu: "Имя бренда на спине. Просто и точно.",
  },
  {
    slug: "soya", nameUz: 'Slim "Soya"', nameRu: 'Слим "Soya"', category: "futbolkalar", fit: "SLIM",
    colors: ["black", "navy"], density: 180, sale: true,
    descUz: "Soya kabi yengil. Tanaga mos.", descRu: "Лёгкая, как тень. По фигуре.",
  },
];

// deterministic pseudo-random stock (some sizes sold out on purpose)
let s = 42;
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const qty = () => (rnd() < 0.12 ? 0 : 2 + Math.floor(rnd() * 14));

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
  const regularChart = await db.sizeChart.create({
    data: {
      name: "Futbolka — klassik",
      rows: [
        { size: "S", width: 50, length: 70, sleeve: 20 },
        { size: "M", width: 53, length: 72, sleeve: 21 },
        { size: "L", width: 56, length: 74, sleeve: 22 },
        { size: "XL", width: 59, length: 76, sleeve: 23 },
        { size: "XXL", width: 62, length: 78, sleeve: 24 },
      ],
      noteUz: "O'lchamlar tekis yotqizilgan mahsulotda olingan, ±1 sm.",
      noteRu: "Замеры по изделию в разложенном виде, ±1 см.",
    },
  });
  const oversizeChart = await db.sizeChart.create({
    data: {
      name: "Oversayz",
      rows: [
        { size: "S", width: 56, length: 71, sleeve: 23 },
        { size: "M", width: 59, length: 73, sleeve: 24 },
        { size: "L", width: 62, length: 75, sleeve: 25 },
        { size: "XL", width: 65, length: 77, sleeve: 26 },
        { size: "XXL", width: 68, length: 79, sleeve: 27 },
      ],
      noteUz: "Oversayz: odatiy o'lchamingizni tanlang — keng o'tiradi.",
      noteRu: "Оверсайз: берите свой обычный размер — сядет свободно.",
    },
  });
  const longChart = await db.sizeChart.create({
    data: {
      name: "Longsliv",
      rows: [
        { size: "S", width: 50, length: 70, sleeve: 62 },
        { size: "M", width: 53, length: 72, sleeve: 63 },
        { size: "L", width: 56, length: 74, sleeve: 64 },
        { size: "XL", width: 59, length: 76, sleeve: 65 },
        { size: "XXL", width: 62, length: 78, sleeve: 66 },
      ],
    },
  });

  const categories = {
    futbolkalar: await db.category.create({
      data: { slug: "futbolkalar", nameUz: "Futbolkalar", nameRu: "Футболки", sortOrder: 0, sizeChartId: regularChart.id,
        descriptionUz: "Klassik va slim bichim", descriptionRu: "Классический и слим крой" },
    }),
    oversayz: await db.category.create({
      data: { slug: "oversayz", nameUz: "Oversayz", nameRu: "Оверсайз", sortOrder: 1, sizeChartId: oversizeChart.id,
        descriptionUz: "Keng yelka, erkin siluet", descriptionRu: "Широкое плечо, свободный силуэт" },
    }),
    longsliv: await db.category.create({
      data: { slug: "longsliv", nameUz: "Longslivlar", nameRu: "Лонгсливы", sortOrder: 2, sizeChartId: longChart.id,
        descriptionUz: "Uzun yeng", descriptionRu: "Длинный рукав" },
    }),
  };
  await db.category.create({ data: { slug: "xudi", nameUz: "Xudilar", nameRu: "Худи", sortOrder: 3 } });

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
        createdAt: new Date(Date.now() - (PRODUCTS.length - i) * 86_400_000 * (p.isNew ? 1 : 6)),
        colors: {
          create: p.colors.map((c, ci) => ({
            ...COLORS[c],
            sortOrder: ci,
            images: {
              create: [
                { url: `/seed/products/${p.slug}-${c}-front.svg`, position: 0, width: 800, height: 1000 },
                { url: `/seed/products/${p.slug}-${c}-back.svg`, position: 1, width: 800, height: 1000 },
              ],
            },
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
        imageDesktop: "/seed/banners/banner-1-desktop.webp",
        imageMobile: "/seed/banners/banner-1-mobile.webp",
        altUz: "Kuz 2026. Yangi kolleksiya",
        altRu: "Осень 2026. Новая коллекция",
        link: "/catalog?sort=new",
        headerTone: "DARK",
        sortOrder: 0,
      },
      {
        imageDesktop: "/seed/banners/banner-2-desktop.webp",
        imageMobile: "/seed/banners/banner-2-mobile.webp",
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
        "Jadeeed — o'zbek brendi. Biz baland ovozda gapirmaymiz: sokin rang, toza bichim, zich paxta.\n\nAtlas — bizning tilimiz. Uning to'lqinli iplari har bir kolleksiyada bor, lekin har joyda emas.\n\nFutbolkalarimiz — savol va javob. Siz o'shami? Men o'sha.",
      aboutRu:
        "Jadeeed — узбекский бренд. Мы не говорим громко: спокойный цвет, чистый крой, плотный хлопок.\n\nАтлас — наш язык. Его волнистые нити есть в каждой коллекции, но не везде.\n\nНаши футболки — вопрос и ответ. Siz o'shami? Men o'sha.",
      deliveryUz:
        "Toshkent bo'ylab — 1–2 kun, kuryer orqali.\nViloyatlarga — 2–5 kun, pochta yoki BTS orqali.\n\nTo'lov — qabul qilganda naqd yoki kartaga o'tkazma (Click, Payme).\n\nBuyurtmadan so'ng menejer qo'ng'iroq qilib, manzil va vaqtni aniqlaydi.",
      deliveryRu:
        "По Ташкенту — 1–2 дня, курьером.\nВ регионы — 2–5 дней, почтой или BTS.\n\nОплата — наличными при получении или переводом на карту (Click, Payme).\n\nПосле заказа менеджер позвонит и уточнит адрес и время.",
    },
  });

  // three demo orders in different statuses
  const all = await db.product.findMany({ include: { colors: true }, take: 4, orderBy: { sortOrder: "asc" } });
  const item = (p: (typeof all)[number], size: Size, quantity: number) => ({
    productId: p.id,
    productName: p.nameUz,
    colorName: p.colors[0].nameRu,
    colorId: p.colors[0].id,
    size,
    quantity,
    price: 250_000,
    image: `/seed/products/${p.slug}-${Object.entries(COLORS).find(([, v]) => v.nameRu === p.colors[0].nameRu)?.[0]}-front.svg`,
  });
  // order numbers start at 1001
  await db.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Order"', 'number'), 1000, true)`);
  const demo = [
    { customerName: "Aziz", phone: "901234567", comment: "18:00 dan keyin qo'ng'iroq qiling", status: "NEW" as const, items: [item(all[1], "L", 1), item(all[3], "XL", 2)] },
    { customerName: "Мадина", phone: "935550011", comment: null, status: "PROCESSING" as const, items: [item(all[0], "M", 1)], source: "TELEGRAM" as const, telegramUsername: "madina_demo", telegramId: BigInt(100000001) },
    { customerName: "Bekzod", phone: "977771234", comment: "Chilonzor, 9-kvartal", status: "COMPLETED" as const, items: [item(all[2], "L", 1), item(all[1], "M", 1)] },
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
