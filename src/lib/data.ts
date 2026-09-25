import "server-only";
import { cache } from "react";
import { db } from "./db";
import { isPromoLive, resolvePrice, type PromoRule } from "./pricing";
import {
  SIZES,
  type BannerDTO,
  type CategoryDTO,
  type ColorDTO,
  type PhrasesDTO,
  type PhraseSlotCode,
  type ProductCardDTO,
  type ProductDTO,
  type SettingsDTO,
  type SizeChartDTO,
  type SizeChartRow,
  type SizeCode,
} from "./types";
import type { Prisma } from "@/generated/prisma/client";

export const DEFAULT_PHRASES: Record<PhraseSlotCode, string> = {
  HOME_QUESTION: "Siz o'shami?",
  ADD_TO_CART: "Men o'sha.",
  ABOUT: "Men o'sha.",
  WAITING: "Aylanib kelay...",
  THANKS: "Ko'z tegmasin.",
  BADGE: "Ko'z tegmasin.",
  ATLAS_BLOCK: "Ko'z tegmasin.",
};

// ─── promotions ──────────────────────────────────────────────────────────────
export const getLivePromos = cache(async (): Promise<PromoRule[]> => {
  const promos = await db.promotion.findMany({
    where: { isActive: true },
    include: { products: { select: { id: true } } },
  });
  return promos
    .filter((p) => isPromoLive(p))
    .map((p) => ({
      type: p.type,
      value: p.value,
      scope: p.scope,
      categoryId: p.categoryId,
      productIds: p.products.map((x) => x.id),
    }));
});

// ─── products ────────────────────────────────────────────────────────────────
const productInclude = {
  category: { select: { slug: true, nameUz: true, nameRu: true, isVisible: true } },
  colors: {
    orderBy: { sortOrder: "asc" },
    include: {
      images: { orderBy: { position: "asc" } },
      stock: true,
    },
  },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

const sizeIndex = (s: string) => SIZES.indexOf(s as SizeCode);

function toColor(c: ProductRow["colors"][number]): ColorDTO {
  return {
    id: c.id,
    name: { uz: c.nameUz, ru: c.nameRu },
    hex: c.hex,
    images: c.images.map((i) => i.url),
    stock: c.stock
      .map((s) => ({ size: s.size as SizeCode, qty: s.quantity }))
      .sort((a, b) => sizeIndex(a.size) - sizeIndex(b.size)),
  };
}

function toCard(p: ProductRow, promos: PromoRule[]): ProductCardDTO {
  return {
    id: p.id,
    slug: p.slug,
    name: { uz: p.nameUz, ru: p.nameRu },
    categoryId: p.categoryId,
    categorySlug: p.category?.slug ?? null,
    fit: p.fit,
    pricing: resolvePrice(p, promos),
    isNew: p.isNew,
    isBestseller: p.isBestseller,
    isFeatured: p.isFeatured,
    sortOrder: p.sortOrder,
    createdAt: p.createdAt.getTime(),
    colors: p.colors.map(toColor),
  };
}

export const getCatalogProducts = cache(async (): Promise<ProductCardDTO[]> => {
  const [rows, promos] = await Promise.all([
    db.product.findMany({
      where: { isHidden: false },
      include: productInclude,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    getLivePromos(),
  ]);
  return rows.filter((p) => p.colors.length > 0).map((p) => toCard(p, promos));
});

function toSizeChart(chart: { rows: Prisma.JsonValue; noteUz: string | null; noteRu: string | null } | null): SizeChartDTO | null {
  if (!chart) return null;
  const rows = (Array.isArray(chart.rows) ? chart.rows : []) as unknown as SizeChartRow[];
  return {
    rows,
    note: chart.noteUz || chart.noteRu ? { uz: chart.noteUz ?? "", ru: chart.noteRu ?? "" } : null,
  };
}

export const getProductBySlug = cache(async (slug: string): Promise<ProductDTO | null> => {
  const [p, promos] = await Promise.all([
    db.product.findUnique({
      where: { slug },
      include: {
        ...productInclude,
        sizeChart: true,
        category: {
          select: { slug: true, nameUz: true, nameRu: true, isVisible: true, sizeChart: true },
        },
      },
    }),
    getLivePromos(),
  ]);
  if (!p || p.isHidden || p.colors.length === 0) return null;
  return {
    ...toCard(p, promos),
    description: { uz: p.descriptionUz, ru: p.descriptionRu },
    composition: { uz: p.compositionUz, ru: p.compositionRu },
    care: { uz: p.careUz, ru: p.careRu },
    density: p.density,
    categoryName: p.category ? { uz: p.category.nameUz, ru: p.category.nameRu } : null,
    sizeChart: toSizeChart(p.sizeChart ?? p.category?.sizeChart ?? null),
  };
});

export const getProductSlugs = async () =>
  (await db.product.findMany({ where: { isHidden: false }, select: { slug: true } })).map((p) => p.slug);

// ─── categories ──────────────────────────────────────────────────────────────
export const getCategories = cache(async (): Promise<CategoryDTO[]> => {
  const rows = await db.category.findMany({
    where: { isVisible: true },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: { where: { isHidden: false } } } },
      products: {
        where: { isHidden: false },
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { colors: { take: 1, orderBy: { sortOrder: "asc" }, select: { images: { take: 1, orderBy: { position: "asc" } } } } },
      },
    },
  });
  return rows.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: { uz: c.nameUz, ru: c.nameRu },
    description: c.descriptionUz || c.descriptionRu ? { uz: c.descriptionUz ?? "", ru: c.descriptionRu ?? "" } : null,
    image: c.image ?? c.products[0]?.colors[0]?.images[0]?.url ?? null,
    productCount: c._count.products,
  }));
});

// ─── banners ─────────────────────────────────────────────────────────────────
export const getBanners = cache(async (): Promise<BannerDTO[]> => {
  const rows = await db.banner.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  return rows.map((b) => ({
    id: b.id,
    imageDesktop: b.imageDesktop,
    imageMobile: b.imageMobile,
    alt: { uz: b.altUz, ru: b.altRu },
    link: b.link,
    headerTone: b.headerTone,
  }));
});

// ─── phrases ─────────────────────────────────────────────────────────────────
export const getPhrases = cache(async (): Promise<PhrasesDTO> => {
  const rows = await db.brandPhrase.findMany({ orderBy: { sortOrder: "asc" } });
  const slots = { ...DEFAULT_PHRASES };
  const seen = new Set<string>();
  for (const r of rows)
    for (const s of r.slots)
      if (!seen.has(s)) {
        slots[s as PhraseSlotCode] = r.text;
        seen.add(s);
      }
  const marquee = rows.filter((r) => r.inMarquee).map((r) => r.text);
  return { slots, marquee: marquee.length ? marquee : Object.values(DEFAULT_PHRASES).filter((v, i, a) => a.indexOf(v) === i) };
});

// ─── settings ────────────────────────────────────────────────────────────────
export const getSettings = cache(async (): Promise<SettingsDTO> => {
  const s =
    (await db.settings.findUnique({ where: { id: 1 } })) ??
    (await db.settings.create({ data: { id: 1 } }));
  const pair = (uz: string | null, ru: string | null) => (uz || ru ? { uz: uz ?? "", ru: ru ?? "" } : null);
  return {
    supportUsername: s.supportUsername,
    supportUrl: s.supportUrl,
    channelUsername: s.channelUsername,
    channelUrl: s.channelUrl,
    instagramUsername: s.instagramUsername,
    instagramUrl: s.instagramUrl,
    phone: s.phone,
    address: pair(s.addressUz, s.addressRu),
    workHours: pair(s.workHoursUz, s.workHoursRu),
    about: { uz: s.aboutUz, ru: s.aboutRu },
    delivery: { uz: s.deliveryUz, ru: s.deliveryRu },
  };
});
