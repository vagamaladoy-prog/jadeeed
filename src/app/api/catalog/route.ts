import { NextResponse } from "next/server";
import { getCatalogProducts } from "@/lib/data";

export const revalidate = 300;

/** Lightweight product list for the instant search sheet. */
export async function GET() {
  const products = await getCatalogProducts();
  return NextResponse.json(products, {
    headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
