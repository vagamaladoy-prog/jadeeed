import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { createHash, timingSafeEqual } from "node:crypto";
import { db } from "./db";
import { signSession, verifySession, SESSION_COOKIE, SESSION_TTL } from "./session";

const MAX_FAILS = 5;
const WINDOW_MIN = 15;

/**
 * ADMIN_PASSWORD may be a bcrypt hash (recommended: `npm run admin:hash -- "password"`)
 * or plain text. Plain text is hashed once in memory and never compared directly.
 */
let cachedHash: string | null = null;
async function passwordHash(): Promise<string | null> {
  const raw = process.env.ADMIN_PASSWORD;
  if (!raw) return null;
  if (/^\$2[aby]\$\d{2}\$/.test(raw)) return raw;
  cachedHash ??= await bcrypt.hash(raw, 10);
  return cachedHash;
}

function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function isRateLimited(ip: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MIN * 60_000);
  const fails = await db.loginAttempt.count({ where: { ip, success: false, createdAt: { gte: since } } });
  return fails >= MAX_FAILS;
}

export type LoginResult = { ok: true } | { ok: false; error: "invalid" | "locked" | "config" };

export async function login(loginName: string, password: string): Promise<LoginResult> {
  const expectedLogin = process.env.ADMIN_LOGIN;
  const hash = await passwordHash();
  if (!expectedLogin || !hash || !process.env.SESSION_SECRET) return { ok: false, error: "config" };

  const ip = await clientIp();
  if (await isRateLimited(ip)) return { ok: false, error: "locked" };

  const loginOk = safeEqual(loginName.trim(), expectedLogin);
  const passOk = await bcrypt.compare(password, hash);
  await db.loginAttempt.create({ data: { ip, success: loginOk && passOk } });
  // housekeeping: drop attempts older than a day
  await db.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 86_400_000) } } });

  if (!loginOk || !passOk) return { ok: false, error: "invalid" };

  const token = await signSession({ sub: expectedLogin });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
  return { ok: true };
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Use at the top of every admin page / server action. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
