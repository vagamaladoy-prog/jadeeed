// node scripts/process-brand-photos.mjs — builds the "Jadid manuscript" imagery from the brand shoot
// (assets/photos/2026-11, the owner's own photos), the public-domain Qodiriy portrait and museum suzani
// (assets/met, The Met Open Access CC0: 445244, 447384, 447385, 448922, 444991) into public/photos/jd/*.webp.
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

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** gradient map dark → light over a grayscale image (archival duotone) */
const duotone = async (file, out, { extract, width = 1200, dark = INK, light = SAFFRON, blur, q = 80 } = {}) => {
  let img = sharp(file).rotate();
  if (extract) img = sharp(await img.extract(extract).toBuffer());
  img = img.resize({ width, height: width * 2, fit: "inside", withoutEnlargement: true }).grayscale();
  if (blur) img = img.blur(blur);
  const g = await img.normalise().toColourspace("srgb").toBuffer();
  const a = dark.map((c, i) => (light[i] - c) / 255);
  return sharp(g).linear(a, dark).webp({ quality: q }).toFile(OUT + out);
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
  // "Siz o'shami?" hoodie — the girl, cropped out of the pair shots
  photo("4.jpg", "siz-oshami-front.webp", { extract: { left: 0, top: 560, width: 960, height: 1200 } }),
  photo("6.jpg", "siz-oshami-column.webp", { extract: { left: 40, top: 640, width: 800, height: 1000 } }),
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
  // wardrobe backdrop: carved door, chest and brick of the shoot in warm sepia close to the paper
  duotone(SRC + "21.jpg", "wardrobe-backdrop.webp", { width: 1800, dark: hex("#4a3322"), light: hex("#efe0c4"), blur: 1.2, q: 74 }),
  // archival duotones for the Qodiriy story
  // portrait: public-domain archival photo (Wikimedia Commons "Абдулла Кадирі.jpg", 1938)
  duotone("assets/qodiriy-portrait.jpg", "qodiriy-portrait.webp", { extract: { left: 0, top: 30, width: 642, height: 857 }, width: 642, blur: 0.7, q: 84 }),
  duotone(SRC + "15.jpg", "qodiriy-corridor.webp", { width: 900 }),
  // manifesto: 18th–19th c. Uzbek suzani from The Met (Open Access, CC0), tinted pomegranate / teal / saffron
  duotone("assets/met/445244.jpg", "suzani-anor.webp", { extract: { left: 500, top: 600, width: 2300, height: 2800 }, width: 1200, dark: hex("#220609"), light: hex("#b04354"), q: 72 }),
  duotone("assets/met/447385.jpg", "suzani-firuza.webp", { extract: { left: 300, top: 300, width: 1585, height: 2000 }, width: 1200, dark: hex("#061f20"), light: hex("#3a9493"), q: 72 }),
  duotone("assets/met/448922.jpg", "suzani-zafaron.webp", { extract: { left: 150, top: 300, width: 1477, height: 2300 }, width: 1200, dark: hex("#2e1a06"), light: hex("#d49a3c"), q: 72 }),
  // full-colour museum suzani for the lookbook chapters
  photo("../../met/447384.jpg", "suzani-bukhara.webp", { q: 72, width: 1600, height: 1600 }),
  photo("../../met/444991.jpg", "suzani-nurata.webp", { q: 72, width: 1600, height: 1600 }),
  // embroidered border (left edge of the Bukhara cover), turned horizontal → footer band
  sharp(await sharp("assets/met/447384.jpg").extract({ left: 150, top: 200, width: 200, height: 3100 }).toBuffer())
    .rotate(-90)
    .resize({ height: 160 })
    .webp({ quality: 80 })
    .toFile(OUT + "suzani-border.webp"),
];

for (const r of await Promise.all(jobs)) console.log(`${r.width}×${r.height} ${(r.size / 1024) | 0}KB`);
