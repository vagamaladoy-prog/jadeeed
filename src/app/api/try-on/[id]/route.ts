import { NextResponse } from "next/server";
import { getTryOn } from "@/lib/try-on";

export const dynamic = "force-dynamic";

/** Polls an AI try-on task → { status: "running" | "done" | "failed", url? } */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) return NextResponse.json({ status: "failed" }, { status: 400 });
  try {
    return NextResponse.json(await getTryOn(id), { headers: { "cache-control": "no-store" } });
  } catch (e) {
    console.error("[try-on] poll failed", e);
    return NextResponse.json({ status: "failed" }, { status: 502 });
  }
}
