/**
 * Maska szablonu Ziemi (mockup Macieja, decyzja A 2026-07-04).
 * Regeneracja: node tools/build-earth-mask.cjs
 */
import {
  EARTH_MASK_W,
  EARTH_MASK_H,
  EARTH_MASK_ROWS,
  EARTH_MASK_BBOX,
} from './earth-land-mask.generated';

/** Bufor oceanu przy krawędzi — zgodny z MAP_BORDER_OCEAN_HEXES w gen-helpers. */
const EARTH_PLAYABLE_BORDER = 2;

function bitAt(x: number, y: number): number {
  const xi = Math.min(EARTH_MASK_W - 1, Math.max(0, x));
  const yi = Math.min(EARTH_MASK_H - 1, Math.max(0, y));
  const row = EARTH_MASK_ROWS[yi];
  if (!row || row.length <= xi) return 0;
  return row[xi] === '1' ? 1 : 0;
}

/** Bilinear 0..1 — wygładza schodki maski na heksach. */
export function sampleEarthTemplateLand(nq: number, nr: number): number {
  if (nq < 0 || nq > 1 || nr < 0 || nr > 1) return 0;
  const fx = nq * (EARTH_MASK_W - 1);
  const fy = nr * (EARTH_MASK_H - 1);
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(EARTH_MASK_W - 1, x0 + 1);
  const y1 = Math.min(EARTH_MASK_H - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const v =
    (1 - tx) * (1 - ty) * bitAt(x0, y0)
    + tx * (1 - ty) * bitAt(x1, y0)
    + (1 - tx) * ty * bitAt(x0, y1)
    + tx * ty * bitAt(x1, y1);
  return v >= 0.45 ? 1 : 0;
}

/** Heks mapy → współrzędne szablonu (wypełnia playable area, nie zostawia pustego dołu). */
export function earthHexToTemplateNorm(
  q: number,
  r: number,
  width: number,
  height: number,
): { nq: number; nr: number } | null {
  const b = EARTH_PLAYABLE_BORDER;
  if (q < b || r < b || q >= width - b || r >= height - b) return null;
  const innerW = Math.max(1, width - 1 - 2 * b);
  const innerH = Math.max(1, height - 1 - 2 * b);
  const pq = (q - b) / innerW;
  const pr = (r - b) / innerH;
  const { minX, minY, maxX, maxY } = EARTH_MASK_BBOX;
  return {
    nq: minX + pq * (maxX - minX),
    nr: minY + pr * (maxY - minY),
  };
}

/** Im mniejsza mapa, tym więcej próbek w komórce heksa (zachowuje sylwetkę kontynentów). */
function earthSubsampleGrid(width: number, height: number): number {
  const inner = Math.min(width, height) - 2 * EARTH_PLAYABLE_BORDER;
  if (inner >= 420) return 1;
  if (inner >= 220) return 3;
  if (inner >= 110) return 5;
  return 7;
}

/** Próg lądu w komórce — na małych mapach nieco niższy (cienkie cieśniny / wyspy). */
function earthLandFractionThreshold(width: number, height: number): number {
  const inner = Math.min(width, height) - 2 * EARTH_PLAYABLE_BORDER;
  if (inner >= 320) return 0.45;
  if (inner >= 160) return 0.38;
  if (inner >= 80) return 0.32;
  return 0.26;
}

/** Próbka maski dla heksa mapy (q,r) — adaptacyjna gęstość vs rozmiar mapy. */
export function earthTemplateLandAt(q: number, r: number, width: number, height: number): number {
  const t = earthHexToTemplateNorm(q, r, width, height);
  if (!t) return 0;

  const b = EARTH_PLAYABLE_BORDER;
  const innerW = Math.max(1, width - 1 - 2 * b);
  const innerH = Math.max(1, height - 1 - 2 * b);
  const { minX, minY, maxX, maxY } = EARTH_MASK_BBOX;
  const cellW = (maxX - minX) / innerW;
  const cellH = (maxY - minY) / innerH;

  const steps = earthSubsampleGrid(width, height);
  if (steps <= 1) return sampleEarthTemplateLand(t.nq, t.nr);

  let landHits = 0;
  const total = steps * steps;
  for (let sy = 0; sy < steps; sy++) {
    for (let sx = 0; sx < steps; sx++) {
      const nq = t.nq - cellW * 0.5 + ((sx + 0.5) / steps) * cellW;
      const nr = t.nr - cellH * 0.5 + ((sy + 0.5) / steps) * cellH;
      if (sampleEarthTemplateLand(nq, nr)) landHits++;
    }
  }
  return landHits / total >= earthLandFractionThreshold(width, height) ? 1 : 0;
}
