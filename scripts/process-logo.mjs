// Cuts the original logo (assets/brand/logo-source.png) out of its light background
// pixel-for-pixel — nothing is redrawn — and packs it into SVG for light and dark
// backgrounds, plus favicons.
//
//   node scripts/process-logo.mjs
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "assets/brand/logo-source.png");
const OUT = join(root, "public/brand");
const BG = 245; // background luminance of the source (#F5F5F5)
const DARK = 128;
const PAD = 2;

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: CH } = info;
const lum = (x, y) => {
  const i = (y * W + x) * CH;
  return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
};

// bounding box of the mark
let minX = W, minY = H, maxX = 0, maxY = 0;
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++)
    if (lum(x, y) < 200) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }

// The portrait sits inside the J's stem, and its highlights touch the stem's straight
// right edge. So the silhouette = dark pixels ∪ the stem rectangle (where the face lives).
const rightEdgeRows = [];
for (let y = minY; y <= maxY; y++) {
  let r = -1;
  for (let x = maxX; x >= minX; x--) if (lum(x, y) < DARK) { r = x; break; }
  if (r >= maxX - 2) rightEdgeRows.push(y);
}
const stemTop = rightEdgeRows[0];
const stemBottom = rightEdgeRows[rightEdgeRows.length - 1];
// stem's left edge is a straight vertical line: the column with the most
// "light → dark" transitions (the wordmark and the portrait produce scattered ones).
const midX = Math.round(minX + (maxX - minX) * 0.5);
let stemLeft = midX, best = 0;
for (let x = midX; x < maxX - 10; x++) {
  let score = 0;
  for (let y = stemTop + 50; y < stemBottom - 20; y++)
    if (lum(x, y) < DARK && lum(x - 2, y) > 200) score++;
  if (score > best) { best = score; stemLeft = x; }
}
const inStem = (x, y) => x >= stemLeft && x <= maxX && y >= stemTop && y <= stemBottom;
console.log({ bbox: [minX, minY, maxX, maxY], stemLeft, stemTop, stemBottom });

const x0 = minX - PAD, y0 = minY - PAD;
const w = maxX - minX + 1 + PAD * 2, h = maxY - minY + 1 + PAD * 2;

const silhouette = new Uint8Array(w * h);
for (let y = 0; y < h; y++)
  for (let x = 0; x < w; x++) {
    const sx = x + x0, sy = y + y0;
    silhouette[y * w + x] = lum(sx, sy) < DARK || inStem(sx, sy) ? 1 : 0;
  }

// Split the J (largest connected component) from the separate wordmark strokes.
const label = new Int32Array(w * h).fill(-1);
const sizes = [];
for (let i = 0; i < w * h; i++) {
  if (!silhouette[i] || label[i] >= 0) continue;
  const id = sizes.length; let n = 0; const stack = [i]; label[i] = id;
  while (stack.length) {
    const p = stack.pop(); n++;
    const px = p % w, py = (p - px) / w;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const qx = px + dx, qy = py + dy; if (qx < 0 || qy < 0 || qx >= w || qy >= h) continue;
      const q = qy * w + qx; if (silhouette[q] && label[q] < 0) { label[q] = id; stack.push(q); }
    }
  }
  sizes.push(n);
}
const J = sizes.indexOf(Math.max(...sizes));
const isRawJ = (x, y) => x >= 0 && y >= 0 && x < w && y < h && label[y * w + x] === J;

// Softly rounded outer corners (owner's wish, 2026-11): a disc of radius R rolled inside the J reaches
// everything except the tips of its corners; pixels are kept by their distance to the disc centres.
const R = 12;
const centre = new Uint8Array(w * h);
for (let y = 0; y < h; y++)
  for (let x = 0; x < w; x++) {
    let ok = isRawJ(x, y);
    for (let dy = -R; ok && dy <= R; dy++)
      for (let dx = -R; ok && dx <= R; dx++) if (dx * dx + dy * dy < R * R && !isRawJ(x + dx, y + dy)) ok = false;
    centre[y * w + x] = ok ? 1 : 0;
  }
/** 1 inside the rounded J (its anti-aliased rim included), 0 in the trimmed corner tips */
function keep(x, y) {
  let d = Infinity;
  for (let dy = -R - 3; dy <= R + 3; dy++)
    for (let dx = -R - 3; dx <= R + 3; dx++) {
      const qx = x + dx, qy = y + dy;
      if (qx >= 0 && qy >= 0 && qx < w && qy < h && centre[qy * w + qx]) d = Math.min(d, Math.hypot(dx, dy));
    }
  return Math.max(0, Math.min(1, R + 0.6 - d));
}
const keepMap = new Float32Array(w * h).fill(1);
for (let y = 0; y < h; y++)
  for (let x = 0; x < w; x++) {
    if (label[y * w + x] !== J) {
      if (label[y * w + x] >= 0) continue; // wordmark strokes
      let near = false;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (isRawJ(x + dx, y + dy)) near = true;
      if (!near) continue;
      keepMap[y * w + x] = Math.min(1, keep(x, y) + (keep(x, y) > 0 ? 1 : 0));
      continue;
    }
    keepMap[y * w + x] = keep(x, y);
  }
// an anti-aliased rim pixel stays only next to a kept J pixel
for (let y = 0; y < h; y++)
  for (let x = 0; x < w; x++) {
    if (label[y * w + x] >= 0 || keepMap[y * w + x] === 1) continue;
    let best = 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) if (isRawJ(x + dx, y + dy)) best = Math.max(best, keepMap[(y + dy) * w + x + dx]);
    keepMap[y * w + x] = best;
  }
const isJ = (x, y) => isRawJ(x, y) && keepMap[y * w + x] >= 0.5;
// soft outline around the J for dark backgrounds: alpha by distance to the letter
const OUTLINE = 1.6;
function outlineAlpha(x, y) {
  let d = Infinity;
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (isJ(x + dx, y + dy)) d = Math.min(d, Math.hypot(dx, dy));
  return Math.max(0, Math.min(1, OUTLINE + 0.5 - d));
}

function render(variant) {
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const sx = x + x0, sy = y + y0;
      const si = (sy * W + sx) * CH;
      const o = (y * w + x) * 4;
      const inside = silhouette[y * w + x];
      const a = Math.max(0, Math.min(255, Math.round(((BG - lum(sx, sy)) / BG) * 255)));
      if (variant === "light") {
        // original pixels inside the J, anti-aliased black outside (wordmark, edges)
        if (inside) { out[o] = data[si]; out[o + 1] = data[si + 1]; out[o + 2] = data[si + 2]; out[o + 3] = Math.round(255 * keepMap[y * w + x]); }
        else { out[o] = 11; out[o + 1] = 11; out[o + 2] = 12; out[o + 3] = Math.round(a * keepMap[y * w + x]); }
      } else {
        // dark background: the J and portrait keep their ORIGINAL pixels (no negative face);
        // a thin white contour draws the letter, the wordmark turns white.
        if (isJ(x, y)) { out[o] = data[si]; out[o + 1] = data[si + 1]; out[o + 2] = data[si + 2]; out[o + 3] = 255; }
        else {
          const ol = outlineAlpha(x, y);
          const alpha = inside ? 1 : (a / 255) * keepMap[y * w + x];
          out[o] = 255; out[o + 1] = 255; out[o + 2] = 255;
          out[o + 3] = Math.round(Math.max(ol, label[y * w + x] !== J ? alpha : 0) * 255);
        }
      }
    }
  return sharp(out, { raw: { width: w, height: h, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer();
}

mkdirSync(OUT, { recursive: true });
for (const variant of ["light", "dark"]) {
  const png = await render(variant);
  writeFileSync(join(OUT, `logo-${variant}.png`), png);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<title>Jadeeed</title>` +
    `<image width="${w}" height="${h}" href="data:image/png;base64,${png.toString("base64")}"/></svg>`;
  writeFileSync(join(OUT, `logo-${variant}.svg`), svg);
  console.log(`logo-${variant}: ${w}x${h}, ${(png.length / 1024).toFixed(1)} KB`);
}

// favicons: the mark centred on the warm paper
const light = await render("light");
const icon = async (size, file, rounded, padRatio = 0.14) => {
  const inner = Math.round(size * (1 - padRatio * 2));
  const mark = await sharp(light).resize({ height: inner, fit: "inside", kernel: "lanczos3" }).toBuffer();
  const plate = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${rounded ? size * 0.22 : 0}" fill="#F5F3EE"/></svg>`);
  await sharp(plate)
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toFile(file);
};
await icon(512, join(root, "src/app/icon.png"), true);
await icon(180, join(root, "src/app/apple-icon.png"), false); // iOS rounds it itself
writeFileSync(join(root, "src/components/brand/logo-size.ts"), `// generated by scripts/process-logo.mjs\nexport const LOGO_SIZE = { width: ${w}, height: ${h} } as const;\n`);
console.log("icons written");
