// node scripts/process-brand-photos.mjs — builds the "Jadid manuscript" imagery from the brand shoot
// (assets/photos/2026-11, the owner's own photos) into public/photos/jd/*.webp.
// Sources stay big; next/image resizes per device. Re-run after replacing a source photo.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SRC = "assets/photos/2026-11/";
const OUT = "public/photos/jd/";
mkdirSync(OUT, { recursive: true });

const INK = [0x14, 0x10, 0x12];
const SAFFRON = [0xe2, 0xa2, 0x3b];

/** plain resize to max 2000 on the long side */
const photo = (src, out, opts = {}) => {
  const img = sharp(SRC + src).rotate();
  if (opts.extract) img.extract(opts.extract);
  return img
    .resize({ width: opts.width ?? 2000, height: opts.height ?? 2000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: opts.q ?? 82 })
    .toFile(OUT + out);
};

/** ink → saffron gradient map (archival duotone) */
const duotone = async (src, out, extract, width = 1200) => {
  const g = await sharp(SRC + src).extract(extract).resize({ width, withoutEnlargement: true }).grayscale().normalise().toColourspace("srgb").toBuffer();
  const a = INK.map((c, i) => (SAFFRON[i] - c) / 255);
  return sharp(g).linear(a, INK).webp({ quality: 80 }).toFile(OUT + out);
};

const jobs = [
  // hero: "Men o'sha" (two hoodies under the carved ceiling) and its answer "Siz o'shami?"
  photo("1.jpg", "hero-men-osha.webp"),
  photo("4.jpg", "hero-siz-oshami.webp"),
  // Qodiriy | Qish — hoodies, front + back print
  photo("2.jpg", "qish-black-front.webp"),
  photo("4.jpg", "qish-black-back.webp", { extract: { left: 806, top: 760, width: 800, height: 1000 } }),
  photo("8.jpg", "qish-ash-front.webp"),
  photo("5.jpg", "qish-ash-back.webp", { extract: { left: 860, top: 900, width: 863, height: 1079 } }),
  photo("3.jpg", "qish-ash-brick.webp"),
  photo("7.jpg", "qish-ash-suzani.webp"),
  // lookbook
  photo("10.jpg", "look-ceiling.webp"),
  photo("6.jpg", "look-column.webp"),
  photo("5.jpg", "look-pair-back.webp"),
  photo("9.jpg", "look-tees.webp"),
  // atmosphere
  photo("15.jpg", "atmos-corridor.webp"),
  photo("16.jpg", "atmos-wheels.webp"),
  photo("17.jpg", "atmos-lattice.webp"),
  photo("21.jpg", "atmos-chest.webp"),
  // manifesto textures (owner-supplied suzani panels)
  photo("19.jpg", "suzani-anor.webp", { q: 78 }),
  photo("20.jpg", "suzani-firuza.webp", { q: 78 }),
  photo("18.jpg", "suzani-zafaron.webp", { q: 78 }),
  // archival duotones for the Qodiriy story
  duotone("4.jpg", "qodiriy-print.webp", { left: 1150, top: 1080, width: 456, height: 640 }),
  duotone("15.jpg", "qodiriy-corridor.webp", { left: 0, top: 0, width: 853, height: 1280 }, 900),
  // embroidered suzani border (from the suzani wall behind photo 7), turned horizontal → footer band
  sharp(await sharp(SRC + "7.jpg").extract({ left: 0, top: 0, width: 175, height: 2000 }).toBuffer())
    .rotate(-90)
    .resize({ height: 120 })
    .webp({ quality: 80 })
    .toFile(OUT + "suzani-border.webp"),
];

for (const r of await Promise.all(jobs)) console.log(`${r.width}×${r.height} ${(r.size / 1024) | 0}KB`);
