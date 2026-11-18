import "server-only";
import { WARDROBE_SHOTS } from "@/components/home/wardrobe-shots";

// AI fitting room (/test/test): Qwen-Image-2.1 on ModelScope API-Inference, async task + polling.
const BASE = "https://api-inference.modelscope.ai/v1";
export const TRY_ON_MODEL = "Qwen/Qwen-Image-2.1";

/** Garments offered in the fitting room: the front shots of the wardrobe rail (shirt on its hanger). */
export const TRY_ON_GARMENTS = Object.keys(WARDROBE_SHOTS);

// Short, strict and in the model's own terms: picture 1 = the client, picture 2 = the garment.
// Everything that is not the top garment is listed explicitly as "unchanged" — the model tends to
// "improve" faces, hair and skin otherwise.
export const TRY_ON_PROMPT = [
  "Virtual try-on. Picture 1 is a photo of a real person. Picture 2 is a garment on a hanger.",
  "Edit Picture 1: replace only the upper-body garment the person is wearing with the garment from Picture 2.",
  "Copy the garment exactly: same color, fabric, cut, sleeve length, collar, and the same printed text and graphics in the same place and size. Remove the hanger.",
  "The garment fits naturally on this person's body and pose, with realistic folds, shadows and lighting matching Picture 1.",
  "Keep everything else in Picture 1 identical: the same face, identity, expression, hairstyle, hair length, hair color, skin tone, body shape, pose, hands, trousers, accessories, background, lighting, framing and image size.",
  "Do not retouch, beautify, slim, recolor or restyle the person. Photorealistic.",
].join(" ");

export const TRY_ON_NEGATIVE =
  "different face, changed identity, changed hairstyle, different hair color, different skin tone, lighter skin, darker skin, makeup, retouched skin, changed body shape, changed pose, changed background, hanger, extra text, misspelled print, distorted print, extra limbs, blurry, cartoon";

function key() {
  const k = process.env.MODELSCOPE_API_KEY;
  if (!k) throw new Error("MODELSCOPE_API_KEY is not set");
  return k;
}

/** Starts a try-on; both images are data: URLs, size = "WxH" of the person photo. Returns the ModelScope task id. */
export async function startTryOn(person: string, garment: string, size?: string): Promise<string> {
  const res = await fetch(`${BASE}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/json",
      "X-ModelScope-Async-Mode": "true",
    },
    body: JSON.stringify({
      model: TRY_ON_MODEL,
      prompt: TRY_ON_PROMPT,
      negative_prompt: TRY_ON_NEGATIVE,
      image_url: [person, garment],
      ...(size ? { size } : {}),
    }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => null)) as { task_id?: string; errors?: { message?: string } } | null;
  if (!res.ok || !data?.task_id) throw new Error(data?.errors?.message ?? `ModelScope ${res.status}`);
  return data.task_id;
}

export type TryOnStatus = { status: "running" } | { status: "done"; url: string } | { status: "failed" };

export async function getTryOn(id: string): Promise<TryOnStatus> {
  const res = await fetch(`${BASE}/tasks/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${key()}`, "X-ModelScope-Task-Type": "image_generation" },
    cache: "no-store",
  });
  if (!res.ok) return { status: "failed" };
  const data = (await res.json()) as { task_status?: string; output_images?: string[] };
  if (data.task_status === "SUCCEED") {
    const url = data.output_images?.[0];
    return url ? { status: "done", url } : { status: "failed" };
  }
  if (data.task_status === "FAILED") return { status: "failed" };
  return { status: "running" };
}
