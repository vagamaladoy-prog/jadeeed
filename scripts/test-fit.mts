// Sanity table for the size recommendation: npx tsx scripts/test-fit.mts
import assert from "node:assert/strict";
import { fitRows, fitVerdict, recommendSize, typicalShoulders, type BodyParams } from "../src/lib/fit";
import type { FitCode, SizeChartDTO, SizeCode } from "../src/lib/types";

const SIZES: SizeCode[] = ["S", "M", "L", "XL", "XXL"];
const oversize: SizeChartDTO = {
  note: null,
  rows: [
    { size: "S", width: 56, length: 71, sleeve: 23 },
    { size: "M", width: 59, length: 73, sleeve: 24 },
    { size: "L", width: 62, length: 75, sleeve: 25 },
    { size: "XL", width: 65, length: 77, sleeve: 26 },
    { size: "XXL", width: 68, length: 79, sleeve: 27 },
  ],
};

const body = (height: number, weight: number, shoulders?: number): BodyParams => ({
  height,
  weight,
  shoulders: shoulders ?? typicalShoulders(height, weight),
});
const label = (b: BodyParams, fit: FitCode = "OVERSIZE", chart: SizeChartDTO | null = oversize) =>
  recommendSize(b, fit, fitRows(chart, SIZES, fit));

for (const [h, w] of [[160, 50], [165, 58], [170, 62], [175, 70], [180, 80], [185, 90], [190, 105], [175, 120], [160, 90], [195, 70], [150, 40], [205, 150]]) {
  const r = label(body(h, w));
  console.log(`${h} cm ${w} kg → ${r.label}${r.outOfRange ? ` (${r.outOfRange})` : ""}`);
}

// the size rises with weight, never falls
let prev = -1;
for (let w = 45; w <= 140; w += 5) {
  const at = SIZES.indexOf(label(body(175, w)).primary);
  assert.ok(at >= prev, `size fell at ${w} kg`);
  prev = at;
}
// broad shoulders never give a smaller size
assert.ok(SIZES.indexOf(label(body(175, 70, 54)).primary) >= SIZES.indexOf(label(body(175, 70)).primary));
// extremes are flagged
assert.equal(label(body(205, 150)).outOfRange, "above");
assert.equal(label(body(150, 40)).outOfRange, "below");
// the recommended size always reads as a good fit
const b = body(175, 70);
const rows = fitRows(oversize, SIZES, "OVERSIZE");
assert.ok(["ideal", "snug", "loose"].includes(fitVerdict(b, "OVERSIZE", rows.find((r) => r.size === label(b).primary)!)));
assert.equal(fitVerdict(b, "OVERSIZE", { size: "XS", width: 44, length: null, sleeve: null }), "tight");
// no chart → standard table still answers
assert.ok(SIZES.includes(label(body(175, 70), "REGULAR", null).primary));
console.log("ok");
