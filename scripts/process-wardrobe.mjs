// Cuts the wardrobe t-shirt shots (front + side) out of their grey studio background and
// normalises them to the same height so the "turn" animation swaps them without a jump.
//   node scripts/process-wardrobe.mjs
// in:  assets/wardrobe/<name>-front.png, <name>-side.png
// out: public/wardrobe/<name>-front.webp, <name>-side.webp (transparent, trimmed, 2× for retina)
import sharp from "sharp";
import { mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "assets/wardrobe");
const OUT = join(root, "public/wardrobe");
const HEIGHT = 1000; // output shirt height in px (displayed ≤ 500 CSS px)
mkdirSync(OUT, { recursive: true });

async function cutOut(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const lum = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) lum[i] = 0.2126 * data[i * 3] + 0.7152 * data[i * 3 + 1] + 0.0722 * data[i * 3 + 2];

  // background luminance per row = median of the 6 outermost pixels on each side (vertical gradient)
  const bgRow = new Float32Array(H);
  for (let y = 0; y < H; y++) {
    const s = [];
    for (let x = 0; x < 6; x++) s.push(lum[y * W + x], lum[y * W + W - 1 - x]);
    s.sort((a, b) => a - b);
    bgRow[y] = s[s.length >> 1];
  }
  const isBgLike = (i) => lum[i] <= bgRow[(i / W) | 0] + 16;

  // flood fill from the borders through background-like pixels
  const bg = new Uint8Array(W * H);
  const stack = [];
  const push = (i) => {
    if (!bg[i] && isBgLike(i)) {
      bg[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < W; x++) push(x), push((H - 1) * W + x);
  for (let y = 0; y < H; y++) push(y * W), push(y * W + W - 1);
  while (stack.length) {
    const i = stack.pop();
    const x = i % W, y = (i / W) | 0;
    if (x > 0) push(i - 1);
    if (x < W - 1) push(i + 1);
    if (y > 0) push(i - W);
    if (y < H - 1) push(i + W);
  }

  // alpha: shirt = 255, background = 0; soft 1px edge from luminance contrast
  const rgba = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    let a = bg[i] ? 0 : 255;
    if (bg[i]) {
      // background pixel touching the shirt: partial alpha by how much brighter than the bg it is
      const x = i % W, y = (i / W) | 0;
      const nearShirt = (x > 0 && !bg[i - 1]) || (x < W - 1 && !bg[i + 1]) || (y > 0 && !bg[i - W]) || (y < H - 1 && !bg[i + W]);
      if (nearShirt) a = Math.max(0, Math.min(255, ((lum[i] - bgRow[y]) / 16) * 255));
    }
    rgba[i * 4] = data[i * 3];
    rgba[i * 4 + 1] = data[i * 3 + 1];
    rgba[i * 4 + 2] = data[i * 3 + 2];
    rgba[i * 4 + 3] = a;
  }
  return sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
}

const names = [...new Set(readdirSync(SRC).map((f) => f.replace(/-(front|side)\.(png|jpe?g|webp)$/i, "")))];
for (const name of names) {
  for (const view of ["front", "side"]) {
    const file = readdirSync(SRC).find((f) => f.startsWith(`${name}-${view}.`));
    if (!file) continue;
    const cut = await cutOut(join(SRC, file));
    const trimmed = await sharp(cut).trim({ threshold: 1 }).toBuffer();
    const out = await sharp(trimmed)
      .resize({ height: HEIGHT, kernel: "lanczos3" })
      .webp({ quality: 88, alphaQuality: 90 })
      .toBuffer({ resolveWithObject: true });
    await sharp(out.data).toFile(join(OUT, `${name}-${view}.webp`));
    console.log(`${name}-${view}: ${out.info.width}×${out.info.height}, ${(out.data.length / 1024).toFixed(0)} KB`);
  }
}
