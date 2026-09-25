// Edge-safe (used by proxy.ts and server code): signed JWT in an httpOnly cookie.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "jadeeed_admin";
export const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
  return new TextEncoder().encode(s);
}

export async function signSession(payload: { sub: string }) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL}s`)
    .sign(secret());
}

export async function verifySession(token: string): Promise<{ sub: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    // a changed ADMIN_LOGIN invalidates old sessions
    if (!payload.sub || payload.sub !== process.env.ADMIN_LOGIN) return null;
    return { sub: payload.sub };
  } catch {
    return null;
  }
}
