"use client";
// Phone photos are often 5–15 MB, but a Vercel function accepts at most 4.5 MB per request.
// Before uploading we shrink big images in the browser: long edge ≤ 2560 px, WebP ~0.86.
// That keeps full quality for 2400×1800 banners and 4:5 product photos.

const MAX_EDGE = 2560;
const TARGET_BYTES = 4 * 1024 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

export async function prepareImage(file: File): Promise<File> {
  if (file.type === "image/svg+xml") return file;
  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return file; // the browser can't decode it (e.g. AVIF on old Safari) — send as is
  }
  const long = Math.max(img.naturalWidth, img.naturalHeight);
  if (file.size <= TARGET_BYTES && long <= MAX_EDGE) return file;

  const scale = Math.min(1, MAX_EDGE / long);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  for (const q of [0.86, 0.78, 0.7]) {
    const blob = (await toBlob(canvas, "image/webp", q)) ?? (await toBlob(canvas, "image/jpeg", q));
    if (blob && blob.size <= TARGET_BYTES) {
      const ext = blob.type === "image/webp" ? "webp" : "jpg";
      return new File([blob], file.name.replace(/\.[^.]+$/, "") + "." + ext, { type: blob.type });
    }
  }
  return file;
}
