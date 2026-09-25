// <input type="datetime-local"> ⇄ Date, always in shop time (Asia/Tashkent, UTC+5, no DST).
// Deterministic on server and client, so SSR of client forms never mismatches.

const TZ_OFFSET = "+05:00";

/** Date → "2026-09-25T14:30" (Tashkent wall time) */
export function toLocalInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** "2026-09-25T14:30" (Tashkent wall time) → Date; "" → null */
export function fromLocalInput(value: string): Date | null {
  if (!value) return null;
  const d = new Date(`${value.length === 16 ? `${value}:00` : value}${TZ_OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d;
}
