import { NextResponse } from "next/server";
import { startTryOn, TRY_ON_GARMENTS } from "@/lib/try-on";

export const dynamic = "force-dynamic";

const MAX_PHOTO = 3_000_000; // data: URL chars (~2.2 MB of JPEG); the browser shrinks photos to ~1.5 MP first

// best-effort guard of the shared ModelScope quota: a few try-ons per visitor per 10 minutes
// (per serverless instance — enough to stop a stuck loop or a casual script)
const WINDOW_MS = 10 * 60_000;
const PER_WINDOW = 6;
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= PER_WINDOW) return true;
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return false;
}

/** Starts an AI try-on: { garment: wardrobe slug, photo: data:image/jpeg;base64,…, width, height } → { id } */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { garment?: unknown; photo?: unknown; width?: unknown; height?: unknown } | null;
  const garment = typeof body?.garment === "string" ? body.garment : "";
  const photo = typeof body?.photo === "string" ? body.photo : "";
  if (!TRY_ON_GARMENTS.includes(garment)) return NextResponse.json({ error: "garment" }, { status: 400 });
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photo) || photo.length > MAX_PHOTO) {
    return NextResponse.json({ error: "photo" }, { status: 400 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return NextResponse.json({ error: "limit" }, { status: 429 });
  // the result keeps the photo's own framing (the model otherwise picks its own aspect ratio)
  const side = (v: unknown) => (typeof v === "number" && v >= 256 && v <= 2048 ? Math.round(v / 16) * 16 : null);
  const w = side(body?.width);
  const h = side(body?.height);
  const size = w && h ? `${w}x${h}` : undefined;
  try {
    // the garment comes from our own public files, never from the client; sent inline, because
    // ModelScope's servers can't reliably download from our host
    const res = await fetch(new URL(`/try-on/${garment}.jpg`, req.url));
    if (!res.ok) throw new Error(`garment ${res.status}`);
    const garmentData = `data:image/jpeg;base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
    const id = await startTryOn(photo, garmentData, size);
    return NextResponse.json({ id });
  } catch (e) {
    console.error("[try-on] start failed", e);
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}
