// Serialisable shapes passed from admin server pages to client components.
import type { OrderStatusCode } from "./labels";

export type AdminOrderRow = {
  id: string;
  number: number;
  /** preformatted in Tashkent time */
  date: string;
  customerName: string;
  phone: string;
  comment: string | null;
  total: number;
  source: "WEB" | "TELEGRAM";
  telegramUsername: string | null;
  status: OrderStatusCode;
  items: { name: string; color: string; size: string; qty: number }[];
};

export type AdminProductRow = {
  id: string;
  slug: string;
  nameUz: string;
  nameRu: string;
  image: string | null;
  category: string | null;
  price: number;
  oldPrice: number | null;
  stock: number;
  colors: number;
  isNew: boolean;
  isBestseller: boolean;
  isFeatured: boolean;
  isHidden: boolean;
};

export type Option = { value: string; label: string };
