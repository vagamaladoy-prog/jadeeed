// Plain, serialisable shapes passed from server to client components.
import type { PriceInfo } from "./pricing";

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
export type SizeCode = (typeof SIZES)[number];
export const FITS = ["OVERSIZE", "REGULAR", "SLIM"] as const;
export type FitCode = (typeof FITS)[number];

export type L10n = { uz: string; ru: string };

export type ColorDTO = {
  id: string;
  name: L10n;
  hex: string;
  images: string[];
  /** only sizes that exist for this colour, in size order */
  stock: { size: SizeCode; qty: number }[];
};

export type ProductCardDTO = {
  id: string;
  slug: string;
  name: L10n;
  categoryId: string | null;
  categorySlug: string | null;
  fit: FitCode;
  pricing: PriceInfo;
  isNew: boolean;
  isBestseller: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: number;
  colors: ColorDTO[];
};

export type ProductDTO = ProductCardDTO & {
  description: L10n;
  composition: L10n;
  care: L10n;
  density: number | null;
  categoryName: L10n | null;
  sizeChart: SizeChartDTO | null;
};

export type SizeChartRow = { size: string; width: number | null; length: number | null; sleeve: number | null };
export type SizeChartDTO = { rows: SizeChartRow[]; note: L10n | null };

export type CategoryDTO = {
  id: string;
  slug: string;
  name: L10n;
  description: L10n | null;
  image: string | null;
  productCount: number;
};

export type BannerDTO = {
  id: string;
  imageDesktop: string;
  imageMobile: string | null;
  alt: L10n;
  link: string | null;
  headerTone: "LIGHT" | "DARK";
};

export type SettingsDTO = {
  supportUsername: string;
  supportUrl: string;
  channelUsername: string;
  channelUrl: string;
  instagramUsername: string;
  instagramUrl: string;
  phone: string | null;
  address: L10n | null;
  workHours: L10n | null;
  about: L10n;
  delivery: L10n;
};

export type PhraseSlotCode =
  | "HOME_QUESTION"
  | "ADD_TO_CART"
  | "ABOUT"
  | "WAITING"
  | "THANKS"
  | "BADGE"
  | "ATLAS_BLOCK";

export type PhrasesDTO = {
  slots: Record<PhraseSlotCode, string>;
  marquee: string[];
};

export function tr(value: L10n | null | undefined, locale: string): string {
  if (!value) return "";
  return (locale === "ru" ? value.ru : value.uz) || value.uz || value.ru;
}
