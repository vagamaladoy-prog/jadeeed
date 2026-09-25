"use server";
import { redirect } from "next/navigation";
import { login, logout } from "@/lib/auth";
import { loginSchema, type LoginValues } from "@/lib/admin/schemas";
import type { ActionResult } from "@/lib/admin/action";

const MESSAGES = {
  invalid: "Неверный логин или пароль",
  locked: "Слишком много попыток. Попробуйте через 15 минут",
  config: "ADMIN_LOGIN / ADMIN_PASSWORD / SESSION_SECRET не заданы",
} as const;

export async function loginAction(values: LoginValues): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: MESSAGES.invalid };

  let res;
  try {
    res = await login(parsed.data.login, parsed.data.password);
  } catch (e) {
    console.error("[admin] login failed", e);
    const msg = e instanceof Error && e.message.includes("SESSION_SECRET") ? e.message : "Не удалось войти: ошибка сервера или базы данных";
    return { ok: false, error: msg };
  }
  if (!res.ok) return { ok: false, error: MESSAGES[res.error] };
  redirect("/admin/orders");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}
