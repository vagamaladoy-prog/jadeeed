"use server";
import { requireAdmin } from "@/lib/auth";
import { uploadImage } from "@/lib/storage";
import type { ActionResultWith } from "@/lib/admin/action";

const FOLDERS = ["products", "banners", "categories"] as const;
type Folder = (typeof FOLDERS)[number];

async function upload(formData: FormData, folder: Folder): Promise<ActionResultWith<{ url: string }>> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Файл не выбран" };
  try {
    const url = await uploadImage(file, folder);
    return { ok: true, url };
  } catch (e) {
    console.error("[admin] upload failed", e);
    return { ok: false, error: e instanceof Error ? e.message : "Не удалось загрузить файл" };
  }
}

/** Product photo → Supabase Storage (bucket `products`, folder `products`). */
export async function uploadProductImage(formData: FormData) {
  return upload(formData, "products");
}

/** Banner / category image. `folder` comes from the form data and is whitelisted. */
export async function uploadAdminImage(formData: FormData) {
  const raw = String(formData.get("folder") ?? "");
  const folder: Folder = (FOLDERS as readonly string[]).includes(raw) ? (raw as Folder) : "products";
  return upload(formData, folder);
}
