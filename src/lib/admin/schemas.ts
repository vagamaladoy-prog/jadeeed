// Zod schemas shared by admin forms (React Hook Form) and server actions.
// Input type == output type everywhere (no transforms/defaults), so `useForm<z.infer<…>>` just works.
import { z } from "zod";
import { FITS, SIZES } from "@/lib/types";
import { DISCOUNT_TYPES, HEADER_TONES, ORDER_STATUSES, PHRASE_SLOTS, PROMOTION_SCOPES } from "./labels";

const required = (msg: string, max = 200) => z.string().trim().min(1, msg).max(max, `Не длиннее ${max} символов`);
const text = (max = 10_000) => z.string().trim().max(max, `Не длиннее ${max} символов`);
const int = (msg: string, min = 0, max = 1_000_000_000) =>
  z.number({ error: msg }).int(msg).min(min, msg).max(max, msg);
const optionalInt = (msg: string, min = 0, max = 1_000_000_000) => int(msg, min, max).nullable();

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Укажите адрес (slug)")
  .max(80, "Адрес не длиннее 80 символов")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Адрес: только латиница в нижнем регистре, цифры и дефис");

const linkSchema = z
  .string()
  .trim()
  .max(500, "Ссылка слишком длинная")
  .refine((v) => v === "" || /^(https?:\/\/\S+|\/\S*)$/.test(v), "Ссылка должна начинаться с / или https://");

const urlSchema = (msg: string) =>
  z
    .string()
    .trim()
    .max(300, "Ссылка слишком длинная")
    .regex(/^https?:\/\/\S+$/, msg);

// ─── login ───────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  login: z.string().trim().min(1, "Введите логин").max(100),
  password: z.string().min(1, "Введите пароль").max(200),
});
export type LoginValues = z.infer<typeof loginSchema>;

// ─── orders ──────────────────────────────────────────────────────────────────
export const orderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(ORDER_STATUSES),
});

// ─── products ────────────────────────────────────────────────────────────────
/** Every size key is present; null = the size is not offered in this colour, 0 = sold out. */
export const stockSchema = z.record(z.enum(SIZES), optionalInt("Остаток — целое число от 0", 0, 100_000));

export const colorSchema = z.object({
  /** existing ProductColor id; absent for a new colour */
  colorId: z.string().optional(),
  nameUz: required("Название цвета (uz) обязательно", 60),
  nameRu: required("Название цвета (ru) обязательно", 60),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Цвет в формате #RRGGBB"),
  images: z.array(z.string().min(1)).max(20, "Не больше 20 фото на цвет"),
  stock: stockSchema,
});
export type ColorValues = z.infer<typeof colorSchema>;

export const productSchema = z.object({
  nameUz: required("Название (uz) обязательно", 120),
  nameRu: required("Название (ru) обязательно", 120),
  slug: slugSchema,
  descriptionUz: text(),
  descriptionRu: text(),
  categoryId: z.string(),
  sizeChartId: z.string(),
  fit: z.enum(FITS),
  price: int("Укажите цену — целое число сумов"),
  oldPrice: optionalInt("Старая цена — целое число сумов"),
  compositionUz: text(500),
  compositionRu: text(500),
  density: optionalInt("Плотность — целое число г/м²", 1, 2000),
  careUz: text(1000),
  careRu: text(1000),
  isNew: z.boolean(),
  isBestseller: z.boolean(),
  isFeatured: z.boolean(),
  isHidden: z.boolean(),
  sortOrder: int("Порядок — целое число", -100_000, 100_000),
  colors: z.array(colorSchema).min(1, "Добавьте хотя бы один цвет").max(30, "Не больше 30 цветов"),
});
export type ProductValues = z.infer<typeof productSchema>;

// ─── promotions ──────────────────────────────────────────────────────────────
export const promotionSchema = z
  .object({
    name: required("Укажите название акции", 120),
    type: z.enum(DISCOUNT_TYPES),
    value: int("Укажите размер скидки — целое число", 1),
    scope: z.enum(PROMOTION_SCOPES),
    productIds: z.array(z.string()).max(1000),
    categoryId: z.string(),
    /** datetime-local value in Tashkent time, "" = no bound */
    startsAt: z.string(),
    endsAt: z.string(),
    isActive: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.type === "PERCENT" && v.value > 90)
      ctx.addIssue({ code: "custom", path: ["value"], message: "Скидка в процентах — от 1 до 90" });
    if (v.scope === "PRODUCTS" && v.productIds.length === 0)
      ctx.addIssue({ code: "custom", path: ["productIds"], message: "Выберите хотя бы один товар" });
    if (v.scope === "CATEGORY" && !v.categoryId)
      ctx.addIssue({ code: "custom", path: ["categoryId"], message: "Выберите категорию" });
    if (v.startsAt && v.endsAt && v.endsAt <= v.startsAt)
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "Окончание должно быть позже начала" });
  });
export type PromotionValues = z.infer<typeof promotionSchema>;

// ─── banners ─────────────────────────────────────────────────────────────────
export const bannerSchema = z.object({
  imageDesktop: z.string().min(1, "Загрузите картинку для ПК"),
  imageMobile: z.string(),
  altUz: required("Текст на картинке (uz) обязателен", 300),
  altRu: required("Текст на картинке (ru) обязателен", 300),
  link: linkSchema,
  headerTone: z.enum(HEADER_TONES),
  isActive: z.boolean(),
});
export type BannerValues = z.infer<typeof bannerSchema>;

// ─── brand phrases ───────────────────────────────────────────────────────────
export const phraseSchema = z.object({
  text: required("Введите фразу", 120),
  slots: z.array(z.enum(PHRASE_SLOTS)),
  inMarquee: z.boolean(),
  sortOrder: int("Порядок — целое число", -100_000, 100_000),
});
export type PhraseValues = z.infer<typeof phraseSchema>;

// ─── categories ──────────────────────────────────────────────────────────────
export const categorySchema = z.object({
  slug: slugSchema,
  nameUz: required("Название (uz) обязательно", 80),
  nameRu: required("Название (ru) обязательно", 80),
  descriptionUz: text(2000),
  descriptionRu: text(2000),
  image: z.string(),
  sortOrder: int("Порядок — целое число", -100_000, 100_000),
  isVisible: z.boolean(),
  sizeChartId: z.string(),
});
export type CategoryValues = z.infer<typeof categorySchema>;

// ─── size charts ─────────────────────────────────────────────────────────────
const cm = optionalInt("Размеры — целые сантиметры от 0 до 300", 0, 300);
export const sizeChartSchema = z.object({
  name: required("Укажите название сетки", 80),
  rows: z
    .array(
      z.object({
        size: required("Укажите размер", 10),
        width: cm,
        length: cm,
        sleeve: cm,
      }),
    )
    .min(1, "Добавьте хотя бы одну строку")
    .max(20),
  noteUz: text(1000),
  noteRu: text(1000),
});
export type SizeChartValues = z.infer<typeof sizeChartSchema>;

// ─── settings ────────────────────────────────────────────────────────────────
const username = z
  .string()
  .trim()
  .max(64, "Не длиннее 64 символов")
  .regex(/^@?[A-Za-z0-9_.]*$/, "Имя пользователя: латиница, цифры, _ и точка");

export const settingsSchema = z.object({
  supportUsername: username,
  supportUrl: urlSchema("Ссылка на поддержку должна начинаться с https://"),
  channelUsername: username,
  channelUrl: urlSchema("Ссылка на канал должна начинаться с https://"),
  instagramUsername: username,
  instagramUrl: urlSchema("Ссылка на Instagram должна начинаться с https://"),
  phone: text(30),
  addressUz: text(300),
  addressRu: text(300),
  workHoursUz: text(200),
  workHoursRu: text(200),
  aboutUz: text(),
  aboutRu: text(),
  deliveryUz: text(),
  deliveryRu: text(),
});
export type SettingsValues = z.infer<typeof settingsSchema>;

// ─── helpers for number inputs (React Hook Form `setValueAs`) ────────────────
/** "" → null, "12" → 12 */
export const toIntOrNull = (v: unknown): number | null => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
/** "" → NaN (so the required-number rule fires), "12" → 12 */
export const toInt = (v: unknown): number => (v === "" || v === null || v === undefined ? Number.NaN : Number(v));

/** Blank colour for the product form: no sizes offered yet. */
export const newColor = (): ColorValues => ({
  nameUz: "",
  nameRu: "",
  hex: "#141416",
  images: [],
  stock: Object.fromEntries(SIZES.map((s) => [s, null])) as ColorValues["stock"],
});
