// Turns the brand's photo shoot into web-ready images for the seed catalogue and the site.
//   node scripts/prepare-photos.mjs <folder with 3.jpg … 17.jpg>
// Output: public/photos/*.webp (product shots 4:5, 1200×1500; wide shots ≤ 2000px).
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = process.argv[2];
if (!src) {
  console.error("usage: node scripts/prepare-photos.mjs <source folder>");
  process.exit(1);
}
const OUT = join(root, "public/photos");
mkdirSync(OUT, { recursive: true });

// name ← source file, optional crop in source pixels ({ left, top, width, height })
const PRODUCT = [
  // Longsliv "Aylanib ketay..." — grey washed
  ["longsliv-grey-front", 3],
  ["longsliv-grey-back", 4],
  ["longsliv-grey-side", 5],
  // Oversize "Men o'sha" — mocha washed (back: Abdulla Qodiriy)
  ["menosha-mocha-front", 10],
  ["menosha-mocha-back", 9],
  ["menosha-mocha-close", 6],
  ["menosha-mocha-detail", 7],
  ["menosha-mocha-look", 8],
  // Oversize "Men o'sha" — black washed (from the bench shot)
  ["menosha-black-front", 15, { left: 930, top: 110, width: 900, height: 1125 }],
  // Oversize "Aylanib ketay..." — grey washed (back: Ko'z tegmasin)
  ["aylanib-grey-front", 11],
  ["aylanib-grey-back", 12],
  ["aylanib-grey-close", 13],
  ["aylanib-grey-back-close", 14],
  // Oversize "Aylanib ketay..." — mocha and purple (door shot)
  ["aylanib-mocha-front", 17, { left: 745, top: 230, width: 608, height: 760 }],
  ["aylanib-purple-front", 17, { left: 150, top: 350, width: 520, height: 650 }],
  // Oversize "Siz o'shami?" — purple
  ["sizoshami-purple-front", 15, { left: 90, top: 160, width: 900, height: 1125 }],
  ["sizoshami-purple-look", 16, { left: 160, top: 170, width: 900, height: 1125 }],
];

// wide / editorial shots used as backgrounds and banners
const WIDE = [
  ["bench-pair", 15],
  ["bench-camera", 16],
  ["doors", 17],
];

for (const [name, n, crop] of PRODUCT) {
  let img = sharp(join(src, `${n}.jpg`)).rotate();
  if (crop) img = img.extract(crop);
  await img
    .resize(1200, 1500, { fit: "cover", position: "centre" })
    .webp({ quality: 82 })
    .toFile(join(OUT, `${name}.webp`));
}
for (const [name, n] of WIDE) {
  await sharp(join(src, `${n}.jpg`)).rotate().resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 82 }).toFile(join(OUT, `${name}.webp`));
}
console.log(`${PRODUCT.length + WIDE.length} photos → public/photos`);
