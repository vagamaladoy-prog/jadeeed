import "server-only";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const BUCKET = "products";
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"]);
const MAX_BYTES = 10 * 1024 * 1024;

function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const ext = (type: string) =>
  ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/svg+xml": "svg" })[type] ??
  "bin";

/**
 * Uploads an image to the public Supabase Storage bucket `products`.
 * Without Supabase credentials (local dev) files go to public/uploads.
 */
export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!ALLOWED.has(file.type)) throw new Error("Формат не поддерживается: нужен JPG, PNG, WebP или AVIF");
  if (file.size > MAX_BYTES) throw new Error("Файл больше 10 МБ");
  const name = `${folder}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext(file.type)}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const client = supabase();
  if (client) {
    const { error } = await client.storage.from(BUCKET).upload(name, bytes, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw new Error(`Supabase Storage: ${error.message}`);
    return client.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
  }

  if (process.env.VERCEL) throw new Error("SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY не заданы");
  const dir = join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(join(process.cwd(), "public", "uploads", name), bytes);
  return `/uploads/${name}`;
}

/** Best-effort delete of a previously uploaded file (ignored for seed/local files). */
export async function deleteImage(url: string) {
  const client = supabase();
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  if (!client || !url.includes(marker)) return;
  const path = url.split(marker)[1];
  await client.storage.from(BUCKET).remove([path]).catch(() => undefined);
}
