/**
 * Maska szablonu Ziemi (mockup Macieja, decyzja A 2026-07-04).
 * Korekta A-MAP-ZIEMIA-1 (Maciej B, 2026-07-24): symetryczne bufory oceanu
 * arktycznego na północy i południu (~30 hex na mapie standardowej, skalowane).
 * C-MAP-Q3c: Antarktyda usunięta z maski; ląd redystrybuowany przy build-earth-mask.
 *
 * ZAKRES: wyłącznie typ świata **Ziemia** (`typ === 'ziemia'` w silniku, menu kreatora
 * „Typ świata → Ziemia”). NIE dotyczy proceduralnych **Kontynentów**, Pangei ani Wysp.
 * Regeneracja PNG: node tools/build-earth-mask.cjs
 */
import {
  EARTH_MASK_W,
  EARTH_MASK_H,
  EARTH_MASK_ROWS,
  EARTH_MASK_BBOX,
} from './earth-land-mask.generated';

/** Bufor oceanu przy krawędzi — zgodny z MAP_BORDER_OCEAN_HEXES w gen-helpers. */
const EARTH_PLAYABLE_BORDER = 2;

/**
 * Na mapie standardowej (168×120, innerH≈115) ≈30 rzędów wolnego oceanu u góry i u dołu.
 * Skaluje się proporcjonalnie do wysokości playable area.
 */
export const EARTH_POLAR_OCEAN_REF_ROWS = 30;
export const EARTH_POLAR_OCEAN_REF_INNER_H = 115;

/** Wiersze playable area z wymuszonym oceanem u góry (bufor arktyczny). */
export function earthNorthOceanRows(height: number): number {
  return earthPolarOceanRows(height);
}

/** Wiersze playable area z wymuszonym oceanem u dołu (bufor południowy przed Antarktydą). */
export function earthSouthOceanRows(height: number): number {
  return earthPolarOceanRows(height);
}

function earthPolarOceanRows(height: number): number {
  const innerH = earthPlayableInnerHeight(height);
  // Skala vs standard (~30 @ innerH 115), ale z CAP — inaczej Super Huge
  // pożera ~52% wysokości samym oceanem biegunowym i Ziemia wygląda „tak samo
  // mała, tylko więcej wody” (Maciej 2026-08-02).
  const scaled = Math.round(EARTH_POLAR_OCEAN_REF_ROWS * innerH / EARTH_POLAR_OCEAN_REF_INNER_H);
  const cap = Math.max(
    EARTH_POLAR_OCEAN_REF_ROWS,
    Math.round(innerH * 0.12), // max ~12% wysokości na biegun
  );
  return Math.max(2, Math.min(scaled, cap));
}

/** Eksport dla gen-helpers (bufor oceanu Ziemi ~30 hex na mapie standardowej). */
export { earthPolarOceanRows };

function earthPlayableInnerHeight(height: number): number {
  const b = EARTH_PLAYABLE_BORDER;
  return Math.max(1, height - 1 - 2 * b);
}

function earthPlayableInnerWidth(width: number): number {
  const b = EARTH_PLAYABLE_BORDER;
  return Math.max(1, width - 1 - 2 * b);
}

/** Rzędy playable area, na które mapowany jest pełny szablon lądu (między buforami). */
function earthLandMapRows(height: number): number {
  const innerH = earthPlayableInnerHeight(height);
  const polar = earthPolarOceanRows(height);
  return Math.max(1, innerH - polar * 2);
}

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

/** Heks mapy → współrzędne szablonu (bufory oceanu N/S, pełny ląd łącznie z Antarktydą). */
export function earthHexToTemplateNorm(
  q: number,
  r: number,
  width: number,
  height: number,
): { nq: number; nr: number } | null {
  const b = EARTH_PLAYABLE_BORDER;
  if (q < b || r < b || q >= width - b || r >= height - b) return null;

  const innerW = earthPlayableInnerWidth(width);
  const innerH = earthPlayableInnerHeight(height);
  const north = earthNorthOceanRows(height);
  const south = earthSouthOceanRows(height);
  const relR = r - b;

  if (relR < north) return null;
  if (relR >= innerH - south) return null;

  const landRows = earthLandMapRows(height);
  const pr = (relR - north) / Math.max(1, landRows - 1);
  const pq = (q - b) / innerW;

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

  const innerW = earthPlayableInnerWidth(width);
  const { minX, minY, maxX, maxY } = EARTH_MASK_BBOX;
  const cellW = (maxX - minX) / innerW;
  const cellH = (maxY - minY) / Math.max(1, earthLandMapRows(height));

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
