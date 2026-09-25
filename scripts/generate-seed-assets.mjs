// Generates placeholder product photos (SVG t-shirts, front + back) and two seed
// banners (desktop 2400×1000, mobile 1080×1350) used by prisma/seed.ts.
// The owner replaces all of them from the admin panel.
//
//   node scripts/generate-seed-assets.mjs
import sharp from "sharp";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(root, "public/seed");
mkdirSync(join(OUT, "products"), { recursive: true });
mkdirSync(join(OUT, "banners"), { recursive: true });

export const GARMENT_COLORS = {
  black: { hex: "#141416", rib: "#0c0c0d", print: "#EDEBE6" },
  white: { hex: "#F7F6F2", rib: "#E6E3DC", print: "#141416" },
  navy: { hex: "#1C2A55", rib: "#141F42", print: "#EDEBE6" },
};

const WELL = "#ECE9E2"; // --paper-2

// silhouettes on an 800×1000 canvas
const SHAPES = {
  regular: {
    body: "M338 176 L240 206 L120 330 L186 404 L246 356 L246 690 Q400 704 554 690 L554 356 L614 404 L680 330 L562 206 L462 176",
    neck: { l: 338, r: 462, y: 176, front: 258, back: 206 },
  },
  oversize: {
    body: "M334 170 L214 196 L96 382 L178 444 L226 402 L222 716 Q400 730 578 716 L574 402 L622 444 L704 382 L586 196 L466 170",
    neck: { l: 334, r: 466, y: 170, front: 246, back: 200 },
  },
  slim: {
    body: "M344 180 L256 208 L150 318 L206 380 L262 342 L266 676 Q400 688 534 676 L538 342 L594 380 L650 318 L544 208 L456 180",
    neck: { l: 344, r: 456, y: 180, front: 256, back: 208 },
  },
  longsleeve: {
    body: "M338 176 L240 206 L176 400 L148 660 L204 666 L244 440 L246 690 Q400 704 554 690 L556 440 L596 666 L652 660 L624 400 L562 206 L462 176",
    neck: { l: 338, r: 462, y: 176, front: 258, back: 206 },
  },
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function tee({ shape, color, side, print }) {
  const s = SHAPES[shape];
  const c = GARMENT_COLORS[color];
  const d = side === "front" ? s.neck.front : s.neck.back;
  const neck = `M${s.neck.l} ${s.neck.y} Q400 ${d} ${s.neck.r} ${s.neck.y}`;
  const bodyPath = `${s.body} Q400 ${d} ${s.neck.l} ${s.neck.y} Z`;
  const isWhite = color === "white";
  const fold = isWhite ? "#000" : "#fff";
  const printSvg = print
    ? side === "back"
      ? `<text x="400" y="${shape === "oversize" ? 420 : 400}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${print.length > 12 ? 40 : 50}" font-weight="300" letter-spacing="-1" fill="${c.print}">${esc(print)}</text>`
      : `<text x="${shape === "oversize" ? 505 : 490}" y="330" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" letter-spacing="1" fill="${c.print}" opacity=".85">JADEEED</text>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
<rect width="800" height="1000" fill="${WELL}"/>
<ellipse cx="400" cy="842" rx="250" ry="14" fill="#000" opacity=".06"/>
<g transform="translate(0 96)">
<path d="${bodyPath}" fill="${c.hex}" stroke="${isWhite ? "#D9D5CC" : c.rib}" stroke-width="2" stroke-linejoin="round"/>
<path d="${neck}" fill="none" stroke="${c.rib}" stroke-width="14" stroke-linecap="round"/>
<path d="M310 420 C318 520 304 610 316 680" fill="none" stroke="${fold}" stroke-width="22" opacity=".035"/>
<path d="M470 380 C480 480 490 590 482 684" fill="none" stroke="${fold}" stroke-width="30" opacity=".03"/>
<path d="M400 300 C404 440 396 580 402 690" fill="none" stroke="${fold}" stroke-width="10" opacity=".025"/>
${printSvg}
${side === "back" ? `<rect x="386" y="${shape === "oversize" ? 186 : 192}" width="28" height="14" rx="2" fill="${c.rib}" opacity=".8"/>` : ""}
</g>
</svg>`;
}

// products: [slug, shape, colours, print]
export const SEED_PRODUCTS = [
  ["siz-oshami", "oversize", ["black", "white"], "Siz o'shami?"],
  ["men-osha", "regular", ["black", "white", "navy"], "Men o'sha."],
  ["aylanib-kelay", "oversize", ["white", "navy"], "Aylanib kelay..."],
  ["koz-tegmasin", "regular", ["black", "white"], "Ko'z tegmasin."],
  ["asos", "regular", ["black", "white", "navy"], null],
  ["sokin", "slim", ["white", "navy"], null],
  ["tun", "oversize", ["black", "navy"], null],
  ["tong", "oversize", ["white"], null],
  ["ip", "longsleeve", ["black", "white"], null],
  ["atlas", "longsleeve", ["navy", "black"], null],
  ["jadeeed", "regular", ["black", "white"], "Jadeeed"],
  ["soya", "slim", ["black", "navy"], null],
];

for (const [slug, shape, colors, print] of SEED_PRODUCTS) {
  for (const color of colors) {
    for (const side of ["front", "back"]) {
      writeFileSync(join(OUT, "products", `${slug}-${color}-${side}.svg`), tee({ shape, color, side, print }));
    }
  }
}

// ─── banners: all text is part of the picture ────────────────────────────────
const atlasTile = readFileSync(join(root, "public/atlas/dense.svg"), "utf8");
const atlasData = `data:image/svg+xml;base64,${Buffer.from(atlasTile).toString("base64")}`;
const teeData = (shape, color, side, print) =>
  `data:image/svg+xml;base64,${Buffer.from(tee({ shape, color, side, print }).replace(`<rect width="800" height="1000" fill="${WELL}"/>`, "")).toString("base64")}`;

function banner1(w, h, mobile) {
  // ink field, atlas column, two tees, headline
  const atlasW = mobile ? w : Math.round(w * 0.3);
  const atlasH = mobile ? Math.round(h * 0.22) : h;
  const tiles = [];
  for (let x = 0; x < atlasW; x += 480) for (let y = 0; y < atlasH; y += 960) tiles.push(`<image href="${atlasData}" x="${x}" y="${y}" width="480" height="960"/>`);
  const text = mobile
    ? `<text x="72" y="${h - 330}" font-family="Arial, Helvetica, sans-serif" font-size="46" letter-spacing="8" fill="#A9AAB0">KUZ 2026</text>
       <text x="72" y="${h - 230}" font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="300" fill="#F5F3EE">Yangi</text>
       <text x="72" y="${h - 130}" font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="300" fill="#F5F3EE">kolleksiya</text>`
    : `<text x="${w * 0.36}" y="${h * 0.34}" font-family="Arial, Helvetica, sans-serif" font-size="40" letter-spacing="10" fill="#A9AAB0">KUZ 2026</text>
       <text x="${w * 0.36}" y="${h * 0.52}" font-family="Arial, Helvetica, sans-serif" font-size="150" font-weight="300" fill="#F5F3EE">Yangi</text>
       <text x="${w * 0.36}" y="${h * 0.69}" font-family="Arial, Helvetica, sans-serif" font-size="150" font-weight="300" fill="#F5F3EE">kolleksiya</text>`;
  const tees = mobile
    ? `<image href="${teeData("oversize", "white", "back", "Siz o'shami?")}" x="${w * 0.08}" y="${h * 0.2}" width="${w * 0.62}" height="${w * 0.775}"/>
       <image href="${teeData("regular", "navy", "front", null)}" x="${w * 0.46}" y="${h * 0.28}" width="${w * 0.5}" height="${w * 0.625}"/>`
    : `<image href="${teeData("oversize", "white", "back", "Siz o'shami?")}" x="${w * 0.6}" y="${h * 0.08}" width="${h * 0.72}" height="${h * 0.9}"/>
       <image href="${teeData("regular", "navy", "front", null)}" x="${w * 0.74}" y="${h * 0.18}" width="${h * 0.6}" height="${h * 0.75}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect width="${w}" height="${h}" fill="#0B0B0C"/>
<g>${tiles.join("")}</g>
${tees}
${text}
</svg>`;
}

function banner2(w, h, mobile) {
  // warm paper, big -20%, three tees in a row
  const tees = mobile
    ? `<image href="${teeData("regular", "black", "front", null)}" x="${w * 0.04}" y="${h * 0.36}" width="${w * 0.46}" height="${w * 0.575}"/>
       <image href="${teeData("oversize", "white", "front", null)}" x="${w * 0.28}" y="${h * 0.42}" width="${w * 0.46}" height="${w * 0.575}"/>
       <image href="${teeData("slim", "navy", "front", null)}" x="${w * 0.52}" y="${h * 0.36}" width="${w * 0.46}" height="${w * 0.575}"/>`
    : `<image href="${teeData("regular", "black", "front", null)}" x="${w * 0.5}" y="${h * 0.12}" width="${h * 0.66}" height="${h * 0.825}"/>
       <image href="${teeData("oversize", "white", "front", null)}" x="${w * 0.64}" y="${h * 0.16}" width="${h * 0.66}" height="${h * 0.825}"/>
       <image href="${teeData("slim", "navy", "front", null)}" x="${w * 0.78}" y="${h * 0.12}" width="${h * 0.66}" height="${h * 0.825}"/>`;
  const text = mobile
    ? `<text x="72" y="190" font-family="Arial, Helvetica, sans-serif" font-size="46" letter-spacing="8" fill="#5B5E66">3 TA MODEL</text>
       <text x="60" y="420" font-family="Arial, Helvetica, sans-serif" font-size="260" font-weight="300" letter-spacing="-10" fill="#16224A">−20%</text>`
    : `<text x="${w * 0.06}" y="${h * 0.3}" font-family="Arial, Helvetica, sans-serif" font-size="40" letter-spacing="10" fill="#5B5E66">3 TA MODEL · CHEGIRMA</text>
       <text x="${w * 0.055}" y="${h * 0.7}" font-family="Arial, Helvetica, sans-serif" font-size="360" font-weight="300" letter-spacing="-14" fill="#16224A">−20%</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<rect width="${w}" height="${h}" fill="#ECE9E2"/>
${text}
${tees}
</svg>`;
}

const render = async (svg, file) => {
  await sharp(Buffer.from(svg)).webp({ quality: 82 }).toFile(file);
};
await render(banner1(2400, 1000, false), join(OUT, "banners", "banner-1-desktop.webp"));
await render(banner1(1080, 1350, true), join(OUT, "banners", "banner-1-mobile.webp"));
await render(banner2(2400, 1000, false), join(OUT, "banners", "banner-2-desktop.webp"));
await render(banner2(1080, 1350, true), join(OUT, "banners", "banner-2-mobile.webp"));
console.log("seed assets written to public/seed");
