"use client";
import { bmiOf, chestOf, type BodyParams, type FitRow } from "@/lib/fit";

const FOOT = 214; // floor line; the viewBox is in centimetres, so the figure is to true scale
const ARM_SIN = 0.5; // arms held 30° away from the body
const ARM_COS = 0.87;
const RULER = [140, 160, 180, 200];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const pts = (list: [number, number][]) => list.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`);

/** Stick-figure mannequin drawn from the body sliders, wearing the chosen size from the chart. */
export function FitMannequin({ body, row, unit }: { body: BodyParams; row: FitRow | null; unit: string }) {
  const { height: h, shoulders: s } = body;
  const bmi = bmiOf(body);
  const chest = chestOf(body);

  const top = FOOT - h;
  const headR = h / 15;
  const neckY = top + headR * 2;
  const shoulderY = neckY + h * 0.035;
  const hipY = top + h * 0.53;
  const armT = clamp(7 + (bmi - 22) * 0.35, 5, 14);
  const legT = clamp(11 + (bmi - 22) * 0.55, 8, 22);
  const chestW = chest * 0.33;
  const waistW = chestW * clamp(0.82 + (bmi - 22) * 0.012, 0.74, 1.08);
  const hipW = chest * 0.34;

  const torso = [
    [-s / 2 + 2, shoulderY],
    [s / 2 - 2, shoulderY],
    [chestW / 2, shoulderY + h * 0.1],
    [waistW / 2, top + h * 0.42],
    [hipW / 2, hipY],
    [-hipW / 2, hipY],
    [-waistW / 2, top + h * 0.42],
    [-chestW / 2, shoulderY + h * 0.1],
  ] as [number, number][];

  const armX = s / 2 - armT / 2;
  const armY = shoulderY + armT / 2;
  const armLen = h * 0.42;
  const legX = hipW / 4;

  return (
    <svg viewBox="-85 0 170 222" role="img" aria-hidden className="mx-auto h-[clamp(220px,36dvh,340px)] w-full">
      {/* height scale */}
      <g className="text-muted" stroke="currentColor" strokeWidth="0.6">
        <line x1="-80" x2="-80" y1={FOOT - 210} y2={FOOT} />
        {RULER.map((cm) => (
          <g key={cm}>
            <line x1="-80" x2="-76" y1={FOOT - cm} y2={FOOT - cm} />
            <text x="-74" y={FOOT - cm + 2.5} fontSize="7" fill="currentColor" stroke="none">
              {cm}
            </text>
          </g>
        ))}
        <line x1="-56" x2="0" y1={top} y2={top} strokeDasharray="2 2" className="text-anor" />
        <line x1="-85" x2="85" y1={FOOT} y2={FOOT} />
      </g>
      <text x="-54" y={top - 1.5} fontSize="7.5" fontWeight="500" className="fill-anor tabular-nums">
        {h} {unit}
      </text>

      {/* body */}
      <g className="text-muted" stroke="currentColor" fill="none" strokeLinecap="round" opacity="0.55">
        <line x1={-legX} x2={-legX - 5} y1={hipY} y2={FOOT - legT / 2} strokeWidth={legT} />
        <line x1={legX} x2={legX + 5} y1={hipY} y2={FOOT - legT / 2} strokeWidth={legT} />
        <line x1={-armX} x2={-armX - armLen * ARM_SIN} y1={armY} y2={armY + armLen * ARM_COS} strokeWidth={armT} />
        <line x1={armX} x2={armX + armLen * ARM_SIN} y1={armY} y2={armY + armLen * ARM_COS} strokeWidth={armT} />
        <line x1="0" x2="0" y1={neckY - 2} y2={shoulderY + 2} strokeWidth={headR} />
        <path d={`M${pts(torso).join(" L")} Z`} fill="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="0" cy={top + headR} r={headR} fill="currentColor" stroke="none" />
      </g>

      {row && <Garment row={row} height={h} shoulderY={shoulderY} headR={headR} />}
    </svg>
  );
}

function Garment({ row, height, shoulderY, headR }: { row: FitRow; height: number; shoulderY: number; headR: number }) {
  const W = row.width!;
  const L = row.length ?? height * 0.41;
  const sleeve = row.sleeve ?? 24;
  const y0 = shoulderY - 2;
  const neck = headR * 0.8;
  const halfW = W / 2;
  const shoulder = y0 + 3;
  const sleeveW = W * 0.26;
  const outer: [number, number] = [halfW + sleeve * ARM_SIN, shoulder + sleeve * ARM_COS];
  const inner: [number, number] = [outer[0] - sleeveW * ARM_COS, outer[1] + sleeveW * ARM_SIN];
  const armpit: [number, number] = [halfW, y0 + 30];
  const hem = y0 + L;
  const right = pts([[neck, y0], [halfW, shoulder], outer, inner, armpit, [halfW, hem]]);
  const left = pts([[-halfW, hem], [-armpit[0], armpit[1]], [-inner[0], inner[1]], [-outer[0], outer[1]], [-halfW, shoulder], [-neck, y0]]);
  const d = `M${right.join(" L")} L${left.join(" L")} Q0 ${(y0 + neck * 1.4).toFixed(1)} ${neck.toFixed(1)} ${y0.toFixed(1)} Z`;
  return <path d={d} className="fill-anor/25 stroke-anor" strokeWidth="1.2" strokeLinejoin="round" />;
}
