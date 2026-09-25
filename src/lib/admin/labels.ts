// Admin UI vocabulary (Russian). Plain constants — safe in server and client components.

export const ORDER_STATUSES = ["NEW", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"] as const;
export type OrderStatusCode = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatusCode, string> = {
  NEW: "Новый",
  PROCESSING: "В обработке",
  SHIPPED: "Отправлен",
  COMPLETED: "Выполнен",
  CANCELLED: "Отменён",
};

/** Filter tabs on the orders page. */
export const ORDER_FILTERS: { value: OrderStatusCode | "ALL"; label: string }[] = [
  { value: "ALL", label: "Все" },
  { value: "NEW", label: "Новые" },
  { value: "PROCESSING", label: "В обработке" },
  { value: "SHIPPED", label: "Отправлен" },
  { value: "COMPLETED", label: "Выполнен" },
  { value: "CANCELLED", label: "Отменён" },
];

export const FIT_LABELS = {
  OVERSIZE: "Оверсайз",
  REGULAR: "Классический",
  SLIM: "Слим",
} as const;

export const DISCOUNT_TYPES = ["PERCENT", "AMOUNT"] as const;
export const DISCOUNT_TYPE_LABELS = { PERCENT: "%", AMOUNT: "сум" } as const;

export const PROMOTION_SCOPES = ["PRODUCTS", "CATEGORY"] as const;
export const PROMOTION_SCOPE_LABELS = { PRODUCTS: "Выбранные товары", CATEGORY: "Вся категория" } as const;

export const HEADER_TONES = ["LIGHT", "DARK"] as const;
export const HEADER_TONE_LABELS = {
  LIGHT: "Картинка светлая — шапка тёмная",
  DARK: "Картинка тёмная — шапка светлая",
} as const;

export const PHRASE_SLOTS = ["HOME_QUESTION", "ADD_TO_CART", "ABOUT", "WAITING", "THANKS", "BADGE", "ATLAS_BLOCK"] as const;
export type PhraseSlotValue = (typeof PHRASE_SLOTS)[number];
export const PHRASE_SLOT_LABELS: Record<PhraseSlotValue, string> = {
  HOME_QUESTION: "Блок под баннером на главной",
  ADD_TO_CART: "Сообщение после «В корзину»",
  ABOUT: "Блок «О бренде»",
  WAITING: "Пустая корзина, прелоадер, 404, «продолжить покупки»",
  THANKS: "Страница «Спасибо»",
  BADGE: "Бейдж на новинках/бестселлерах",
  ATLAS_BLOCK: "Крупный блок на атласе на главной",
};

export const UPLOAD_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
export const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
/** before in-browser shrinking (see prepare-image.ts) */
export const UPLOAD_MAX_BYTES = 30 * 1024 * 1024;

/** Client-side pre-check before sending a file to the upload action. */
export function checkUploadFile(file: File): string | null {
  if (!UPLOAD_TYPES.includes(file.type)) return `«${file.name}»: нужен JPG, PNG, WebP или AVIF`;
  if (file.size > UPLOAD_MAX_BYTES) return `«${file.name}»: файл больше 30 МБ`;
  return null;
}
