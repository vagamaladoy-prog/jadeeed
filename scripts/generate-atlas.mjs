// Generates the Jadeeed atlas (ikat) pattern as SVG.
// Real ikat gets its blurry edge because each warp thread is dyed, then shifted
// slightly up or down when woven. We model exactly that: the motif is computed
// per vertical thread, and every thread is offset by its own random dy.
//
//   node scripts/generate-atlas.mjs
//
// Outputs public/atlas/{dense,light,strip}.svg and src/components/atlas/tiles.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const W = 480; // tile width  (seamless horizontally)
const H = 960; // tile height (seamless vertically; all periods divide 960)
const THREAD = 3; // warp thread width, px
const STEP = 4; // vertical sampling step, px

const C = {
  ink: "#0B0B0C",
  paper: "#F5F3EE",
  navy: "#16224A",
  navy2: "#2C3E7A",
};

// deterministic PRNG so the pattern is stable between builds
let seed = 20260924;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const TAU = Math.PI * 2;
const wave = (y, amp, period, phase) => amp * Math.sin((TAU * y) / period + phase);

// Band boundaries: x positions that wander with y. First/last colours match so the
// tile repeats horizontally.
const bands = [
  { x: 0, color: "ink" },
  { x: 38, amp: 12, period: 480, phase: 0.0, color: "navy" },
  { x: 92, amp: 18, period: 320, phase: 1.1, color: "paper" },
  { x: 132, amp: 22, period: 480, phase: 2.4, color: "navy" }, // eye band
  { x: 236, amp: 22, period: 480, phase: 2.4 + Math.PI, color: "ink" },
  { x: 268, amp: 10, period: 240, phase: 0.6, color: "paper" },
  { x: 300, amp: 14, period: 320, phase: 3.0, color: "navy" },
  { x: 344, amp: 26, period: 960, phase: 0.3, color: "paper" },
  { x: 372, amp: 16, period: 480, phase: 4.2, color: "navy" }, // eye band 2
  { x: 452, amp: 12, period: 480, phase: 1.7, color: "ink" },
];

function boundary(b, y) {
  return b.amp ? b.x + wave(y, b.amp, b.period, b.phase) : b.x;
}

// The classic atlas "eye": a chain of almond / diamond lenses stacked vertically
// inside a band, with a smaller lens nested inside.
function eye(x, y, cx, lensH, halfW, phase) {
  const t = (((y + phase) % lensH) + lensH) % lensH / lensH; // 0..1 within lens
  const hw = halfW * Math.sin(Math.PI * t) ** 0.85;
  const dx = Math.abs(x - cx);
  if (dx < hw * 0.38) return "ink";
  if (dx < hw * 0.62) return "paper";
  if (dx < hw) return "navy2";
  return null;
}

// Ikat "flames": every thread pushes band edges sideways in short blocks, so colour
// bleeds into its neighbour as vertical tongues. Block length divides H => seamless.
const BLOCKS = [24, 32, 40, 48];
function hash(a, b) {
  let h = (a * 374761393 + b * 668265263) ^ 0x5bd1e995;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function flame(x, y) {
  const t = Math.floor(x / THREAD);
  const L = BLOCKS[Math.floor(hash(t, 1) * BLOCKS.length)];
  const block = Math.floor(y / L);
  const r = hash(t, block + 7);
  // most blocks barely move, a few leap far => irregular tongues
  return (r - 0.5) * (r > 0.86 || r < 0.1 ? 20 : 6);
}

function motif(x0, y) {
  const x = x0 + flame(x0, y);
  let band = bands[0];
  for (const b of bands) if (x >= boundary(b, y)) band = b;
  let color = band.color;

  if (band === bands[3]) {
    const l = boundary(bands[3], y);
    const r = boundary(bands[4], y);
    color = eye(x, y, (l + r) / 2, 160, (r - l) / 2 - 6, 0) ?? color;
  }
  if (band === bands[8]) {
    const l = boundary(bands[8], y);
    const r = boundary(bands[9], y);
    color = eye(x, y, (l + r) / 2, 120, (r - l) / 2 - 4, 60) ?? color;
  }
  // thin paper "comb" lines inside the wide ink band — the rhythm of the warp
  if (band === bands[4] && Math.floor(x / THREAD) % 4 === 0) color = "navy";
  return color;
}

const mod = (a, n) => ((a % n) + n) % n;

// Build runs of colour per thread, with ikat offset.
function buildThreads({ height = H, sampler = motif, dyRange = 16, skip = [] } = {}) {
  const paths = Object.fromEntries(Object.keys(C).map((k) => [k, []]));
  for (let tx = 0; tx < W; tx += THREAD) {
    // neighbouring threads shift together a little (bundles), plus own jitter
    const bundle = Math.sin(tx * 0.05) * dyRange * 0.5;
    const dy = Math.round(bundle + (rand() - 0.5) * dyRange);
    let runColor = null;
    let runStart = 0;
    for (let y = 0; y <= height; y += STEP) {
      const c = y === height ? "__end" : sampler(tx + THREAD / 2, mod(y + dy, height));
      if (c !== runColor) {
        if (runColor && !skip.includes(runColor)) {
          paths[runColor].push(`M${tx} ${runStart}h${THREAD}v${y - runStart}h-${THREAD}z`);
        }
        runColor = c;
        runStart = y;
      }
    }
  }
  return paths;
}

function svg({ width, height, paths, background, opacityMap = {} }) {
  const body = Object.entries(paths)
    .filter(([, d]) => d.length)
    .map(
      ([k, d]) =>
        `<path fill="${C[k]}"${opacityMap[k] ? ` fill-opacity="${opacityMap[k]}"` : ""} d="${d.join("")}"/>`,
    )
    .join("");
  const bg = background ? `<rect width="${width}" height="${height}" fill="${C[background]}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">${bg}${body}</svg>`;
}

// 1) dense — full colour
const densePaths = buildThreads({ skip: ["paper"] });
const dense = svg({ width: W, height: H, paths: densePaths, background: "paper" });

// 2) light — navy family only on transparent; opacity is applied in CSS (4–8%)
seed = 20260924;
const lightPaths = buildThreads({ skip: ["paper"] });
lightPaths.ink = lightPaths.ink; // ink stays ink; whole layer is faded in CSS
const light = svg({ width: W, height: H, paths: lightPaths });

// 3) strip — 12px divider: a horizontal slice of warp threads with ragged ends
const SH = 12;
const stripPaths = Object.fromEntries(Object.keys(C).map((k) => [k, []]));
seed = 7;
for (let tx = 0; tx < W; tx += THREAD) {
  // continuous warp rhythm: long navy / ink runs, rare paper threads
  const x = tx + flame(tx, 0) * 0.8;
  const v = Math.sin((TAU * x) / 160) + 0.55 * Math.sin((TAU * x) / 48 + 1);
  const c = v > 0.75 ? "ink" : v > -0.35 ? "navy" : v > -1.3 ? "navy2" : "paper";
  if (c === "paper") continue;
  const top = Math.round(rand() * 3);
  const bottom = SH - Math.round(rand() * 3);
  stripPaths[c].push(`M${tx} ${top}h${THREAD}v${bottom - top}h-${THREAD}z`);
}
const strip = svg({ width: W, height: SH, paths: stripPaths });

mkdirSync(join(root, "public/atlas"), { recursive: true });
writeFileSync(join(root, "public/atlas/dense.svg"), dense);
writeFileSync(join(root, "public/atlas/light.svg"), light);
writeFileSync(join(root, "public/atlas/strip.svg"), strip);

mkdirSync(join(root, "src/components/atlas"), { recursive: true });
writeFileSync(
  join(root, "src/components/atlas/tiles.ts"),
  `// generated by scripts/generate-atlas.mjs — do not edit\nexport const ATLAS_TILE = { width: ${W}, height: ${H}, stripHeight: ${SH} } as const;\n`,
);

const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(1) + " KB";
console.log("dense", kb(dense), "| light", kb(light), "| strip", kb(strip));
