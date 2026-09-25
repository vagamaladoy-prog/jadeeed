import type { Locale } from "@/i18n/routing";

const NBSP = " ";

/** 250000 → "250 000" (non-breaking spaces between groups) */
export function groupDigits(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

/** 250000 → "250 000 so'm" / "250 000 сум" */
export function formatPrice(n: number, locale: Locale | string = "uz"): string {
  return `${groupDigits(n)}${NBSP}${locale === "ru" ? "сум" : "so'm"}`;
}

/** Keeps only the 9 national digits of an Uzbek number. */
export function phoneDigits(input: string): string {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("998")) d = d.slice(3);
  return d.slice(0, 9);
}

/** "901234567" → "+998 90 123 45 67" (partial input is formatted as far as it goes) */
export function formatPhone(input: string): string {
  const d = phoneDigits(input);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return ["+998", ...parts].join(" ");
}

export function isCompletePhone(input: string): boolean {
  return phoneDigits(input).length === 9;
}

/** 13.09.2026, 21:35 in Tashkent time */
export function formatDateTime(date: Date): string {
  const f = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return f.format(date);
}

export function slugify(input: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "y",
    к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
    х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "", э: "e", ю: "yu", я: "ya",
    ў: "o", қ: "q", ғ: "g", ҳ: "h",
  };
  return input
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[ʻʼ'`’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
