import "server-only";
import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type ActionResultWith<T> = ({ ok: true } & T) | { ok: false; error: string };

export const fail = (error: string) => ({ ok: false as const, error });

/** First validation message, prefixed with the field path when it is not self-explanatory. */
export function validationError(e: ZodError) {
  const issue = e.issues[0];
  return fail(issue?.message ? `Проверьте данные: ${issue.message}` : "Проверьте заполнение формы");
}

/** Maps Prisma / unknown errors to a Russian message. Logs the original. */
export function actionError(e: unknown, fallback = "Не удалось сохранить. Попробуйте ещё раз") {
  const code = typeof e === "object" && e !== null && "code" in e ? String((e as { code: unknown }).code) : "";
  if (code === "P2002") {
    const target = String((e as { meta?: { target?: unknown } }).meta?.target ?? "");
    return fail(target.includes("slug") ? "Такой адрес (slug) уже занят" : "Такое значение уже используется");
  }
  if (code === "P2025") return fail("Запись не найдена — возможно, её уже удалили");
  if (code === "P2003") return fail("Запись связана с другими данными и не может быть изменена");
  console.error("[admin]", e);
  return fail(fallback);
}

/** Storefront pages are ISR — refresh all of them after any admin change. */
export function revalidateStore() {
  revalidatePath("/", "layout");
}
