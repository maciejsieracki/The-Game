/**
 * gen-helpers.ts
 * Reuzywalne, deterministyczne (seedowane) helpery dla generatora mapy.
 *
 * Wydzielone z generator.ts, by:
 *   - logika szumu -> teren byla nazwana i testowalna,
 *   - zloza mineralne mialy jasne reguly per teren,
 *   - rzeki i pozycje startowe powstawaly deterministycznie z ziarna.
 *
 * Konwencja heksow: POINTY-TOP aksjalne (q, r). s = -q - r.
 * Wszystkie funkcje sa czyste (pure) — bez DOM/THREE/efektow ubocznych.
 */

import type { Hex } from '../types/hex';
import { TerenBazowy, Nakladka } from '../types/hex';
import {
  mapGenAllDepositRarities,
  mapGenMountainThreshold,
  mapGenHighlandThreshold,
  mapGenMountainRangeParams,
} from '../data/map-gen-params-loader';
import { riverGridTraceMinLen, type DensityTier } from './newGameMapDefaults';
import { earthTemplateLandAt } from './earth-land-mask';

// ===========================================================================
// 0. TYP SWIATA
// ===========================================================================

/**
 * Typ swiata okreslajacy ksztalt ladu.
 *   - 'kontynenty': kilka wiekszych, oddzielnych mas ladowych (domyslny).
 *   - 'pangea'    : jeden duzy kontynent w centrum.
 *   - 'wyspy'     : archipelag — siatka 4×4 (16 stref), wyspa w każdej komórce.
 *   - 'ziemia'    : twardy szablon kontynentów z mockupu Macieja (decyzja A 2026-07-04).
 */
export type TypSwiata = 'kontynenty' | 'pangea' | 'wyspy' | 'ziemia';

// ===========================================================================
// 1. PRNG — mulberry32 (deterministyczny, szybki, dobra dystrybucja)
// ===========================================================================

/**
 * Mulberry32: deterministyczny generator [0,1) z 32-bitowego ziarna.
 * Te same ziarno -> ta sama sekwencja liczb na kazdej platformie.
 */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ===========================================================================
// 2. Value noise 2D — permutacja + interpolacja cosinusowa + fBm
// ===========================================================================

/** Buduje 256-elementowa tablice permutacji metoda Fishera-Yatesa z `rand`. */
export function buildPermTable(rand: () => number): Uint8Array {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = p[i]!; p[i] = p[j]!; p[j] = tmp;
  }
  return p;
}

/** Interpolacja cosinusowa miedzy a i b dla t w [0,1]. */
export function cosLerp(a: number, b: number, t: number): number {
  const f = (1 - Math.cos(t * Math.PI)) * 0.5;
  return a * (1 - f) + b * f;
}

/** 2D value noise w punkcie (x,y) z tablicy permutacji p. Zwraca [0,1]. */
export function valueNoise2D(p: Uint8Array, x: number, y: number): number {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);

  // hash(xi,yi) -> pseudolosowa wartosc w [0,1]
  const hash = (ix: number, iy: number) => ((p[(p[ix & 255]! + iy) & 255]!) / 255);

  const v00 = hash(xi,     yi);
  const v10 = hash(xi + 1, yi);
  const v01 = hash(xi,     yi + 1);
  const v11 = hash(xi + 1, yi + 1);

  const top    = cosLerp(v00, v10, xf);
  const bottom = cosLerp(v01, v11, xf);
  return cosLerp(top, bottom, yf);
}

/** Fractal Brownian Motion: sumuje `octaves` oktaw value-noise. Zwraca [0,1]. */
export function fbm(p: Uint8Array, x: number, y: number, octaves = 4): number {
  let value = 0, amplitude = 0.5, frequency = 1, maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    value    += valueNoise2D(p, x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude  *= 0.5;
    frequency  *= 2.0;
  }
  return value / maxValue;
}

// ===========================================================================
// 3. Geometria heksów (pointy-top aksjalne)
// ===========================================================================

/** Szesc kierunkow sasiadow aksjalnych (pointy-top). */
export const HEX_DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [+1,  0], [+1, -1], [0, -1],
  [-1,  0], [-1, +1], [0, +1],
] as const;

/**
 * Aksjalna (szescienna) odleglosc heksowa miedzy (aq,ar) a (bq,br).
 * W cube coords: s = -q - r. Odleglosc = max(|dq|,|dr|,|ds|).
 * Samodzielna kopia — spojna z hexDistance() z units/setup.ts.
 */
export function hexDistanceAxial(aq: number, ar: number, bq: number, br: number): number {
  const dq = Math.abs(aq - bq);
  const dr = Math.abs(ar - br);
  const ds = Math.abs((-aq - ar) - (-bq - br));
  return Math.max(dq, dr, ds);
}

/** Klucz heksa "q,r" — zgodny z GameMap.hexes. */
export function hexKey(q: number, r: number): string {
  return `${q},${r}`;
}

/** Strefa klimatyczna wzdłuż osi r (Maciej A wąski, 2026-07-05). */
export type ClimateZone = 'arid' | 'tropical' | 'temperate';

/** Połowa szerokości pasa suchego — 15% wysokości mapy (±7.5% od środka). */
export const CLIMATE_ARID_HALF_FRAC = 0.075;

/** Połowa szerokości pasów tropikalnych — do ~30% od środka mapy. */
export const CLIMATE_TROPICAL_HALF_FRAC = 0.30;

/**
 * Strefa klimatyczna heksa — oś r, środek mapy = pas suchy.
 * dist = |r − midRow| / (height/2).
 */
export function climateZoneAt(_q: number, r: number, height: number): ClimateZone {
  const midRow = (height - 1) / 2;
  const dist = Math.abs(r - midRow) / (height / 2);
  if (dist < CLIMATE_ARID_HALF_FRAC) return 'arid';
  if (dist < CLIMATE_TROPICAL_HALF_FRAC) return 'tropical';
  return 'temperate';
}

function climateForestThreshold(zone: ClimateZone | undefined, baseForTh: number): number {
  if (zone === 'arid') return 1.1;
  if (zone === 'temperate') return baseForTh - 0.06;
  return baseForTh;
}

function canAssignClimateDesert(zone: ClimateZone | undefined): boolean {
  return zone === undefined || zone === 'arid';
}

// ===========================================================================
// 4. Maska kontynentalna — ORYGINALNA + warianty per TypSwiata
// ===========================================================================

/** Parametry ksztaltowania ladu/biomow (skale szumow itp.). */
export interface ShapeParams {
  noiseScale: number;
  mountainScale: number;
  forestScale: number;
  desertScale: number;
  /** Offsety, by gory/las/pustynia nie pokrywaly sie idealnie. */
  offMtnX: number; offMtnY: number;
  offForX: number; offForY: number;
  offDesX: number; offDesY: number;
}

/**
 * Domyslne parametry ksztaltowania, z deterministycznymi offsetami z `rand`.
 * Wywolaj RAZ na poczatku generacji (kolejnosc rand() ma znaczenie!).
 */
export function defaultShapeParams(rand: () => number): ShapeParams {
  return {
    noiseScale:    0.13,
    mountainScale: 0.22,
    forestScale:   0.19,
    desertScale:   0.17,
    offMtnX: rand() * 500, offMtnY: rand() * 500,
    offForX: rand() * 500, offForY: rand() * 500,
    offDesX: rand() * 500, offDesY: rand() * 500,
  };
}

/**
 * Eliptyczna maska ladowa — ORYGINALNA (domyslna dla 'kontynenty').
 * 1 w centrum, 0 przy krawedziach.
 */
export function landMaskAt(q: number, r: number, width: number, height: number): number {
  const cx = (width  - 1) / 2;
  const cy = (height - 1) / 2;
  const dx = (q - cx) / (cx + 0.5);
  const dy = (r - cy) / (cy + 0.5);
  const dist = Math.sqrt(dx * dx + dy * dy);
  return Math.max(0, 1 - Math.pow(dist / 0.85, 2.0));
}

// ---------------------------------------------------------------------------
// Parametry centrów kontynentów (generowane deterministycznie z rand).
// ---------------------------------------------------------------------------

export interface ContinentCenter {
  nq: number; // znormalizowane polozenie q w [0,1]
  nr: number; // znormalizowane polozenie r w [0,1]
  radius: number; // promien wplywu (znormalizowany)
}

export interface ContinentCenterOpts {
  radiusMin?: number;
  radiusMax?: number;
  /** Min. odległość między centrami (znormalizowana 0–1). */
  minCenterDist?: number;
  width?: number;
  height?: number;
  /** Pierwsze centrum w środku mapy + reszta na pierścieniu (kontynenty). */
  anchorCenter?: boolean;
  /** Promień pierścienia centrów (znormalizowany 0–1). */
  ringRadiusMin?: number;
  ringRadiusMax?: number;
}

/** Stała liczba stref/kontynentów w trybie «kontynenty». */
export const KONTYNENTY_ZONE_COUNT = 5;

/**
 * Liczba centrów kontynentów zależna od rozmiaru mapy i typu świata.
 * Kontynenty: zawsze 5 stref (środek + 4 ćwiartki narożne).
 */
export function continentCenterCount(width: number, height: number, typ: TypSwiata): number {
  if (typ === 'kontynenty') return KONTYNENTY_ZONE_COUNT;
  const area = width * height;
  return area < 2000 ? 2 : area < 6000 ? 3 : 4;
}

/**
 * Generuje N deterministycznych centrow kontynentow.
 * anchorCenter: środek mapy + równomierny pierścień (nie losowy klaster w rogu).
 */
export function buildContinentCenters(
  rand: () => number,
  n: number,
  opts?: ContinentCenterOpts,
): ContinentCenter[] {
  const radiusMin = opts?.radiusMin ?? 0.28;
  const radiusMax = opts?.radiusMax ?? 0.40;
  const minDist = opts?.minCenterDist ?? 0;
  const w = opts?.width ?? 120;
  const h = opts?.height ?? 80;
  const borderMargin = Math.max(
    mapBorderWidth(w, h) / Math.max(1, w - 1),
    mapBorderWidth(w, h) / Math.max(1, h - 1),
    0.12,
  );
  const clamp01 = (v: number) => Math.max(borderMargin, Math.min(1 - borderMargin, v));
  const centers: ContinentCenter[] = [];

  const pushCenter = (nq: number, nr: number, radius?: number): boolean => {
    const cnq = clamp01(nq);
    const cnr = clamp01(nr);
    if (minDist > 0) {
      for (const c of centers) {
        if (Math.hypot(cnq - c.nq, cnr - c.nr) < minDist) return false;
      }
    }
    centers.push({
      nq: cnq,
      nr: cnr,
      radius: radius ?? radiusMin + rand() * (radiusMax - radiusMin),
    });
    return true;
  };

  if (opts?.anchorCenter !== false && n >= 1) {
    pushCenter(0.5, 0.5, radiusMin + (radiusMax - radiusMin) * 0.5);
  }

  const ringRMin = opts?.ringRadiusMin ?? 0.16;
  const ringRMax = opts?.ringRadiusMax ?? 0.32;
  const ringSlots = n - centers.length;
  for (let i = 0; i < ringSlots; i++) {
    let placed = false;
    for (let attempt = 0; attempt < 40 && !placed; attempt++) {
      const angle = (2 * Math.PI * i) / Math.max(1, ringSlots) + (rand() - 0.5) * 0.45;
      const ringR = ringRMin + rand() * (ringRMax - ringRMin);
      if (pushCenter(0.5 + Math.cos(angle) * ringR, 0.5 + Math.sin(angle) * ringR)) {
        placed = true;
      }
    }
    if (!placed) {
      pushCenter(
        borderMargin + rand() * (1 - 2 * borderMargin),
        borderMargin + rand() * (1 - 2 * borderMargin),
      );
    }
  }

  return centers;
}

/**
 * Pięć stref morskich → pięć kontynentów: środek + 4 narożniki (w buforze od krawędzi).
 * Indeksy: 0=środek, 1=NW, 2=NE, 3=SE, 4=SW.
 */
export function buildFiveZoneContinentCenters(
  rand: () => number,
  width: number,
  height: number,
  radiusMin: number,
  radiusMax: number,
): ContinentCenter[] {
  const borderMargin = Math.max(
    mapBorderWidth(width, height) / Math.max(1, width - 1),
    mapBorderWidth(width, height) / Math.max(1, height - 1),
    0.14,
  );
  const clamp01 = (v: number) => Math.max(borderMargin, Math.min(1 - borderMargin, v));
  const jitter = () => (rand() - 0.5) * 0.035;
  const pickR = () => radiusMin + rand() * (radiusMax - radiusMin);
  const inset = borderMargin + 0.06;

  return [
    { nq: clamp01(0.5 + jitter()), nr: clamp01(0.5 + jitter()), radius: pickR() },
    { nq: clamp01(inset + jitter()), nr: clamp01(inset + jitter()), radius: pickR() },
    { nq: clamp01(1 - inset + jitter()), nr: clamp01(inset + jitter()), radius: pickR() },
    { nq: clamp01(1 - inset + jitter()), nr: clamp01(1 - inset + jitter()), radius: pickR() },
    { nq: clamp01(inset + jitter()), nr: clamp01(1 - inset + jitter()), radius: pickR() },
  ];
}

/** Indeks strefy Voronoi — najbliższe centrum (znormalizowane współrzędne). */
export function nearestContinentZoneIndex(
  nq: number,
  nr: number,
  centers: ContinentCenter[],
): number {
  let bestI = 0;
  let bestD = Infinity;
  for (let i = 0; i < centers.length; i++) {
    const c = centers[i]!;
    const d = Math.hypot(nq - c.nq, nr - c.nr);
    if (d < bestD) {
      bestD = d;
      bestI = i;
    }
  }
  return bestI;
}

function secondNearestContinentDist(
  nq: number,
  nr: number,
  centers: ContinentCenter[],
): number {
  const dists = centers
    .map((c) => Math.hypot(nq - c.nq, nr - c.nr))
    .sort((a, b) => a - b);
  return dists[1] ?? Infinity;
}

/**
 * Maska ladowa dla trybu 'kontynenty':
 *   5 stref Voronoi (środek + 4 narożniki) — ląd tylko w «swojej» strefie wokół centrum.
 *   Bez max() wielu centrów i bez mapCenterRadialBias (nie scala w pangeę).
 */
export function landMaskKontynenty(
  q: number, r: number,
  width: number, height: number,
  centers: ContinentCenter[],
  perm: Uint8Array,
  noiseScale: number,
): number {
  const nq = q / (width  - 1);
  const nr = r / (height - 1);

  const borderFade = landMaskBorderFade(q, r, width, height);
  const edgeRect = mapEdgeRectFade(q, r, width, height);
  if (borderFade <= 0 || edgeRect <= 0) return 0;

  const zoneIdx = nearestContinentZoneIndex(nq, nr, centers);
  const c = centers[zoneIdx]!;
  const distC = Math.hypot(nq - c.nq, nr - c.nr);
  const dist2 = secondNearestContinentDist(nq, nr, centers);

  // Cieśnina między strefami morskimi (granica Voronoi) — węższa = ostrzejsze granice stref.
  if (dist2 - distC < 0.018) return 0;

  // Niższy wykładnik niż 2.1 → mniej okrągłe masy; wieloskalowy warp → poszarpane brzegi.
  const radial = Math.max(0, 1 - Math.pow(distC / c.radius, 1.55));
  const warpCoarse = fbm(perm, q * noiseScale * 0.55 + 100, r * noiseScale * 0.55 + 100, 4) * 0.24;
  const warpFine = fbm(perm, q * noiseScale * 1.45 + 510, r * noiseScale * 1.45 + 510, 3) * 0.16;
  const angle = Math.atan2(nr - c.nr, nq - c.nq);
  const angleNoise = fbm(perm, Math.cos(angle) * 4 + zoneIdx * 11, Math.sin(angle) * 4 + 220, 2) * 0.10;
  return Math.min(1, Math.max(0, (radial + warpCoarse + warpFine + angleNoise - 0.09) * borderFade * edgeRect));
}

/**
 * Maska ladowa dla trybu 'pangea':
 *   Jeden duzy kontynent — silny centralny bias.
 *   Masy ladowej jest dużo, morze tylko przy krawędziach.
 */
export function landMaskPangea(
  q: number, r: number,
  width: number, height: number,
  perm: Uint8Array,
  noiseScale: number,
  sparseLand = false,
): number {
  const cx = (width  - 1) / 2;
  const cy = (height - 1) / 2;
  const dx = (q - cx) / (cx + 0.5);
  const dy = (r - cy) / (cy + 0.5);
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Przy małym udziale lądu (≤35%) — mniejsza, okrągła masa; nie prostokąt wypełniający mapę.
  const radialDiv = sparseLand ? 0.42 : 0.82;
  const radialPow = sparseLand ? 2.35 : 1.6;
  const radial = Math.max(0, 1 - Math.pow(dist / radialDiv, radialPow));
  const edgeRect = mapEdgeRectFade(q, r, width, height);
  const centerBias = sparseLand ? 1 : mapCenterRadialBias(q, r, width, height);

  const warp = fbm(perm, q * noiseScale * 0.6 + 200, r * noiseScale * 0.6 + 200, 3) * (sparseLand ? 0.18 : 0.30);
  const borderFade = landMaskBorderFade(q, r, width, height);
  return Math.min(1, Math.max(0, (radial + warp - (sparseLand ? 0.12 : 0.05)) * edgeRect * borderFade * centerBias));
}

/** Liczba stref wysp (siatka 4×4). */
export const ISLAND_GRID_DIVISIONS = 4;

/**
 * 16 centrów wysp — środki komórek siatki 4×4 (+ jitter seed), promień skala z rozmiarem mapy.
 */
export function buildSixteenGridIslandCenters(
  rand: () => number,
  width: number,
  height: number,
): ContinentCenter[] {
  const GRID = ISLAND_GRID_DIVISIONS;
  const borderMargin = Math.max(
    mapBorderWidth(width, height) / Math.max(1, width - 1),
    mapBorderWidth(width, height) / Math.max(1, height - 1),
    0.08,
  );
  const clamp01 = (v: number) => Math.max(borderMargin, Math.min(1 - borderMargin, v));

  const cellFrac = 1 / GRID;
  const mapScale = Math.sqrt((width * height) / 8000);
  const sizeMul = Math.min(1.14, Math.max(0.86, 0.92 + mapScale * 0.07));
  /** Mniejszy promień niż kontynent — wyspa mieści się w komórce siatki z pasem morza. */
  const baseR = cellFrac * 0.32 * sizeMul;
  const jitter = () => (rand() - 0.5) * cellFrac * 0.22;

  const centers: ContinentCenter[] = [];
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      centers.push({
        nq: clamp01((col + 0.5) * cellFrac + jitter()),
        nr: clamp01((row + 0.5) * cellFrac + jitter()),
        radius: baseR * (0.82 + rand() * 0.28),
      });
    }
  }
  return centers;
}

/** Indeks komórki siatki 4×4 dla heksa (0..15) — twardy podział mapy, nie Voronoi. */
export function islandGridCellIndex(q: number, r: number, width: number, height: number): number {
  const GRID = ISLAND_GRID_DIVISIONS;
  const col = Math.min(GRID - 1, Math.floor((q * GRID) / Math.max(1, width)));
  const row = Math.min(GRID - 1, Math.floor((r * GRID) / Math.max(1, height)));
  return row * GRID + col;
}

/** Przypisanie stref wysp — każdy heks należy do swojej komórki siatki 4×4. */
export function assignIslandGridIndices(
  width: number,
  height: number,
): Map<string, number> {
  const map = new Map<string, number>();
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      map.set(hexKey(q, r), islandGridCellIndex(q, r, width, height));
    }
  }
  return map;
}

/**
 * Maska ladowa dla trybu 'wyspy':
 *   Twarda siatka 4×4 — wyspa w komórce, morze na liniach podziału (+ szum brzegu).
 *   Bez Voronoi (inaczej wygląda jak kontynenty).
 */
export function landMaskWyspy(
  q: number, r: number,
  width: number, height: number,
  centers: ContinentCenter[],
  perm: Uint8Array,
  noiseScale: number,
): number {
  const GRID = ISLAND_GRID_DIVISIONS;
  const nq = q / Math.max(1, width - 1);
  const nr = r / Math.max(1, height - 1);

  const borderFade = landMaskBorderFade(q, r, width, height);
  const edgeRect = mapEdgeRectFade(q, r, width, height);
  if (borderFade <= 0 || edgeRect <= 0) return 0;

  const col = Math.min(GRID - 1, Math.floor((q * GRID) / Math.max(1, width)));
  const row = Math.min(GRID - 1, Math.floor((r * GRID) / Math.max(1, height)));
  const zoneIdx = row * GRID + col;
  const c = centers[zoneIdx]!;

  // Pasy morskie wzdłuż linii siatki 4×4 (wyraźny archipelag vs 5 kontynentów).
  const cellW = 1 / GRID;
  const cellLeft = col * cellW;
  const cellRight = (col + 1) * cellW;
  const cellTop = row * cellW;
  const cellBottom = (row + 1) * cellW;
  const laneHalf = 0.062;
  const distToEdge = Math.min(nq - cellLeft, cellRight - nq, nr - cellTop, cellBottom - nr);
  const cellLaneFade = Math.min(1, Math.max(0, distToEdge / laneHalf));
  if (cellLaneFade <= 0) return 0;

  const distC = Math.hypot(nq - c.nq, nr - c.nr);
  const radial = Math.max(0, 1 - Math.pow(distC / c.radius, 1.88));
  const warpCoarse = fbm(perm, q * noiseScale * 0.62 + 350, r * noiseScale * 0.62 + 350, 4) * 0.18;
  const warpFine = fbm(perm, q * noiseScale * 1.55 + 620, r * noiseScale * 1.55 + 620, 3) * 0.10;
  const angle = Math.atan2(nr - c.nr, nq - c.nq);
  const angleNoise = fbm(perm, Math.cos(angle) * 5 + zoneIdx * 7, Math.sin(angle) * 5 + 330, 2) * 0.07;
  return Math.min(1, Math.max(0,
    (radial + warpCoarse + warpFine + angleNoise - 0.12) * borderFade * edgeRect * cellLaneFade,
  ));
}

/**
 * Stałe centra mas lądowych — preset „Ziemia" (nq,nr znormalizowane 0..1).
 * Układ poziomej mapy: Ameryki (lewo), Eurazja/Afryka (środek), Australia (prawo-dół).
 */
export const ZIEMIA_LAND_CENTERS: ContinentCenter[] = [
  { nq: 0.17, nr: 0.32, radius: 0.15 },
  { nq: 0.22, nr: 0.58, radius: 0.11 },
  { nq: 0.48, nr: 0.26, radius: 0.13 },
  { nq: 0.60, nr: 0.34, radius: 0.19 },
  { nq: 0.50, nr: 0.52, radius: 0.12 },
  { nq: 0.80, nr: 0.66, radius: 0.08 },
];

/**
 * Maska ladowa dla trybu 'ziemia':
 *   Twardy szablon kontynentów z mockupu Macieja (decyzja A) + lekki szum brzegu.
 */
export function landMaskZiemia(
  q: number, r: number,
  width: number, height: number,
  perm: Uint8Array,
  noiseScale: number,
): number {
  const template = earthTemplateLandAt(q, r, width, height);
  if (template <= 0) return 0;

  const coastNoise = fbm(perm, q * noiseScale * 0.85 + 880, r * noiseScale * 0.85 + 880, 3) * 0.09;
  return Math.min(1, Math.max(0, 0.94 + coastNoise - 0.05));
}

/** Wynik klasyfikacji jednego heksa: teren bazowy + nakladka lesna. */
export interface TerrainResult {
  terenBazowy: TerenBazowy;
  nakladka: Nakladka;
}

/** Progi klasyfikacji terenu (szum → typ heksa). */
export interface TerrainClassifyThresholds {
  desert?: number;
  forest?: number;
  /** Niższy = więcej gór. */
  mountain?: number;
  /** Niższy = więcej wzgórz. */
  highland?: number;
}

/** Dane szumu z pierwszego przebiegu — do ponownej klasyfikacji po dopasowaniu lądu. */
export interface TerrainScratch {
  elevContinental: number;
  landMask: number;
  mtnNoise: number;
  forNoise: number;
  desNoise: number;
}

/**
 * Klasyfikuje teren jednego heksa na podstawie szumow i maski ladu.
 * Zachowuje DOKLADNIE logike z oryginalnego generator.ts (te same progi),
 * jedynie wydzielona do nazwanej, testowalnej funkcji.
 *
 * @param elevContinental elevation * landMask (juz po przemnozeniu)
 * @param landMask        surowa maska ladu w tym heksie
 * @param mtnNoise        szum gor [0,1]
 * @param forNoise        szum lasu [0,1]
 * @param desNoise        szum pustyni [0,1]
 */
/** Progi wysokości bazowej (elevContinental) dla gór/wzgórz — zależą od tieru relief. */
function reliefElevGates(mtnTh: number): { mountain: number; highland: number; landMaskHi: number; landMaskMtn: number } {
  if (mtnTh <= 0.55) {
    return { mountain: 0.10, highland: 0.08, landMaskHi: 0.12, landMaskMtn: 0.15 };
  }
  if (mtnTh >= 0.75) {
    return { mountain: 0.22, highland: 0.18, landMaskHi: 0.30, landMaskMtn: 0.35 };
  }
  return { mountain: 0.14, highland: 0.11, landMaskHi: 0.20, landMaskMtn: 0.22 };
}

// Maciej 2026-07-10: KOMÓRKOWE przemieszanie równina/łąka (jak przy górach/wzgórzach — patrz
// ironCoverageCellSize/copperCoverageCellSize — ale BEZ kwoty "ile ma być"). Wcześniej (2026-07-09)
// próg `elev > 0.35` był łagodzony jedynie koherentnym globalnym szumem (forNoise+desNoise) — to
// nadal gładkie, niskoczęstotliwościowe pole, skorelowane na dziesiątkach heksów → WIELKIE PLAMY.
// Teraz: mapa dzielona na komórki terenCoverageCellSize() heksów; KAŻDA komórka losuje WŁASNE
// przesunięcie progu z (cx,cy,seed) — deterministyczny hash, nie sekwencja rand() (niezależny od
// kolejności wywołań pętli q/r). Dominujący wkład = lokalny (per-komórka) → rozbija plamy na
// mozaikę wielkości komórki. Mały wkład = globalny (jak wcześniej — daje "charakter" regionu).
// Amplitudy dobrane tak, by ŚREDNI globalny udział Równina:Łąka pozostał zgodny z poprzednim
// (hash symetryczny wokół 0 → nie przesuwa progu w jedną stronę w skali całej mapy).
const TERRAIN_GLOBAL_MIX_AMP = 0.12;
const TERRAIN_CELL_JITTER_AMP = 0.65;

/**
 * Siatka komórek dla przeplotu Równina/Łąka — rząd wielkości mniejszy niż relief
 * (ironCoverageCellSize/copperCoverageCellSize = 12–35 heksów, myślą kwotą "ile ma być");
 * tu chcemy mozaikę widoczną przy przybliżeniu mapy, nie bloki wielkości regionu/kontynentu.
 */
export function terenCoverageCellSize(): number {
  return 4;
}

/**
 * Hash całkowitoliczbowy — czysta funkcja (a,b,c) → [0,1), BEZ stanu i BEZ zależności od
 * kolejności wywołań (w przeciwieństwie do mulberry32/rand()). Potrzebne, bo klasyfikacja
 * terenu biegnie w zagnieżdżonej pętli q/r — a per-komórkowe losowanie ma być identyczne
 * niezależnie od tego, w jakiej kolejności komórki zostaną odwiedzone (determinizm A=B).
 */
function hashInt3(a: number, b: number, c: number): number {
  let h = (a * 374761393) ^ (b * 668265263) ^ (c * 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
}

/**
 * Deterministyczne LOKALNE przesunięcie progu Równina/Łąka dla komórki, do której należy (q,r).
 * Ta sama komórka (i seed mapy) → to samo przesunięcie dla wszystkich heksów w niej — stąd
 * "mozaika" komórkowa zamiast gładkiego globalnego gradientu. Zakres [-1, 1).
 */
export function terrainCellBias(q: number, r: number, seed: number, cellSize = terenCoverageCellSize()): number {
  const cx = Math.floor(q / cellSize);
  const cy = Math.floor(r / cellSize);
  return (hashInt3(cx, cy, seed) - 0.5) * 2;
}

function terrainRownLakaJitter(forNoise: number, desNoise: number, cellBias: number): number {
  const global = ((forNoise + desNoise) * 0.5 - 0.5) * TERRAIN_GLOBAL_MIX_AMP;
  const local = cellBias * TERRAIN_CELL_JITTER_AMP;
  return global + local;
}

export function classifyTerrain(
  elevContinental: number,
  landMask: number,
  mtnNoise: number,
  forNoise: number,
  desNoise: number,
  thresholds?: TerrainClassifyThresholds,
  climateZone?: ClimateZone,
  /** Lokalne przesunięcie progu Równina/Łąka per komórka — patrz terrainCellBias(). */
  cellBias = 0,
): TerrainResult {
  const desTh = thresholds?.desert ?? 0.63;
  const forTh = climateForestThreshold(climateZone, thresholds?.forest ?? 0.58);
  const mtnTh = thresholds?.mountain ?? 0.75;
  const hiTh = thresholds?.highland ?? 0.60;
  const elevG = reliefElevGates(mtnTh);
  let terenBazowy: TerenBazowy;
  let nakladka: Nakladka = Nakladka.Brak;

  if (elevContinental < 0.14) {
    // Ocean tylko przy niskiej masce lądu. Dolina między górami (landMask OK) → Łąka, nie Morze.
    terenBazowy = landMask < 0.22 ? TerenBazowy.Morze : TerenBazowy.Laka;
  } else {
    const isHighlands = mtnNoise > hiTh && landMask > elevG.landMaskHi;
    const isMountain  = mtnNoise > mtnTh && landMask > elevG.landMaskMtn;

    if (isMountain && elevContinental > elevG.mountain) {
      terenBazowy = TerenBazowy.Gory;
    } else if (isHighlands && elevContinental > elevG.highland) {
      terenBazowy = TerenBazowy.Wzgorza;
    } else if (
      canAssignClimateDesert(climateZone) &&
      desNoise > desTh &&
      elevContinental > 0.18 &&
      elevContinental < 0.45
    ) {
      terenBazowy = TerenBazowy.Pustynia;
    } else if (elevContinental + terrainRownLakaJitter(forNoise, desNoise, cellBias) > 0.35) {
      terenBazowy = TerenBazowy.Rownina;
    } else {
      terenBazowy = TerenBazowy.Laka;
    }

    // Las (nie na pustyni, nie na gorach). elevContinental bywa ~0 na heksach
    // „dopisanych” przy niskim udziale lądu — wtedy wystarczy landMask.
    if (
      climateZone !== 'arid' &&
      terenBazowy !== TerenBazowy.Gory &&
      terenBazowy !== TerenBazowy.Pustynia &&
      forNoise > forTh &&
      (landMask > 0.04 || elevContinental > 0.14)
    ) {
      nakladka = Nakladka.Las;
    }
  }

  return { terenBazowy, nakladka };
}

/**
 * Klasyfikacja lądu bez gór/wzgórz — relief nadaje wyłącznie applyReliefByNoiseRank.
 */
export function classifyTerrainFlat(
  elevContinental: number,
  landMask: number,
  _mtnNoise: number,
  forNoise: number,
  desNoise: number,
  thresholds?: TerrainClassifyThresholds,
  climateZone?: ClimateZone,
  /** Lokalne przesunięcie progu Równina/Łąka per komórka — patrz terrainCellBias(). */
  cellBias = 0,
): TerrainResult {
  const desTh = thresholds?.desert ?? 0.63;
  const forTh = climateForestThreshold(climateZone, thresholds?.forest ?? 0.58);
  let terenBazowy: TerenBazowy;
  let nakladka: Nakladka = Nakladka.Brak;

  if (elevContinental < 0.14) {
    terenBazowy = TerenBazowy.Laka;
  } else if (
    canAssignClimateDesert(climateZone) &&
    desNoise > desTh &&
    elevContinental > 0.18 &&
    elevContinental < 0.45
  ) {
    terenBazowy = TerenBazowy.Pustynia;
  } else if (elevContinental + terrainRownLakaJitter(forNoise, desNoise, cellBias) > 0.35) {
    terenBazowy = TerenBazowy.Rownina;
  } else {
    terenBazowy = TerenBazowy.Laka;
  }

  if (
    climateZone !== 'arid' &&
    terenBazowy !== TerenBazowy.Pustynia &&
    forNoise > forTh &&
    (landMask > 0.04 || elevContinental > 0.14)
  ) {
    nakladka = Nakladka.Las;
  }

  return { terenBazowy, nakladka };
}

/**
 * Nakładka lasu po reliefie — **osobno na każdej wyspie / strefie kontynentu** (pangea: per masa).
 * Ranking forNoise w partycji; globalnie ~2× gęściej niż wcześniej.
 */
export function reapplyForestOverlay(
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  thresholds: TerrainClassifyThresholds | undefined,
  typ: TypSwiata,
  forestTier: DensityTier,
  continentOf: Map<string, number> | null,
  nContinents: number,
  mapHeight?: number,
): number {
  const share = FOREST_SHARE_OF_DRY_LAND[forestTier];
  const cellSize = forestCoverageCellSize(forestTier);
  const minLand = minLandHexesForFairPlayCell(cellSize);

  for (const hex of Object.values(hexes)) {
    if (hex.nakladka === Nakladka.Las) hex.nakladka = Nakladka.Brak;
  }

  let assigned = 0;
  const partitions = landPartitionKeysForDistribution(hexes, typ, continentOf, nContinents);

  for (const part of partitions) {
    const massSet = new Set(part.filter((k) => hexes[k]?.terenBazowy !== TerenBazowy.Morze));
    for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
      if (land.length < minLand) continue;

      const eligible = land
        .filter(([q, r]) => {
          const h = hexes[hexKey(q, r)];
          if (!h || !isForestEligibleTerrain(h.terenBazowy) || h.nakladka !== Nakladka.Brak) return false;
          if (mapHeight && climateZoneAt(q, r, mapHeight) === 'arid') return false;
          return true;
        })
        .map(([q, r]) => ({ k: hexKey(q, r), n: scratch.get(hexKey(q, r))?.forNoise ?? 0 }))
        .sort((a, b) => b.n - a.n);

      if (eligible.length === 0) continue;

      const mid = land[Math.floor(land.length / 2)]!;
      const cellZone = mapHeight ? climateZoneAt(mid[0], mid[1], mapHeight) : 'temperate';
      const zoneShareMul = cellZone === 'temperate' ? 1.35 : 1.0;

      const minForest = typ === 'pangea' ? 0 : 1;
      const target = Math.max(minForest, Math.round(eligible.length * share * zoneShareMul));
      const cap = Math.min(target, Math.max(2, Math.ceil(eligible.length * FOREST_OVERLAY_CAP_FRAC)));

      for (let i = 0; i < Math.min(cap, eligible.length); i++) {
        hexes[eligible[i]!.k]!.nakladka = Nakladka.Las;
        assigned++;
      }
    }
  }
  return assigned;
}

/**
 * Ponowna klasyfikacja lądu po dopasowaniu udziału lądu/morze.
 *
 * HILLS Q1 (2026-07-20): teraz porównuje `classifyTerrain` (PEŁNA, z górami/wzgórzami) z
 * `classifyTerrainFlat`, by przywrócić naturalne skupiska reliefu z Przebiegu 1 (Przebieg 1
 * je tworzy, poprzednia wersja tej funkcji je kasowała spłaszczając teren PRZED reliefem
 * z rankingu szumu). UWAGA — zmierzone empirycznie: wprowadzenie `classifyTerrain` NA ŚLEPO
 * (całość jako baza, bez budżetu) daje relief ≈50% lądu (progi mtnNoise/hiTh są symetryczne
 * wokół 0.5 w skali CAŁEJ mapy — bez ograniczenia per-komórka, jak w applyReliefByNoiseRank/
 * ensureReliefGridCoverage/growMountainRanges, to naturalnie ~połowa lądu). To nie tylko
 * niegrywalne (ściana gór/wzgórz), ale i zabija wydajność (A* rzek błądzi po ogromnym reliefie
 * — zmierzone: „duża" 26s → 65s). Fair-play system (relief_land_fraction / ensureReliefGridCoverage
 * / growMountainRanges) był kalibrowany zakładając bazę PŁASKĄ (classifyTerrainFlat) i DOKŁADA
 * kontrolowany procent na wierzch — więc pełne classifyTerrain jako baza koliduje z tą architekturą.
 *
 * Rozwiązanie: budżet. Heksy, gdzie `classifyTerrain` chce Gór/Wzgórz (a `classifyTerrainFlat`
 * by tego nie zrobił), trafiają na listę kandydatów rankowaną po mtnNoise malejąco — przywracamy
 * TYLKO najsilniejszy budżet (REAPPLY_RELIEF_BUDGET_FRAC = suma relief_land_fraction dla tieru,
 * czyli te same liczby co reszta reliefu — „spięte z tierem" bez nowego parametru). Ponieważ fbm
 * jest przestrzennie spójny, najsilniejsze mtnNoise nadal tworzy SKUPISKA (nie rozprasza się), więc
 * cel Q1 (naturalne klastry zamiast rozproszenia przez pickSpreadReliefKeys) jest spełniony, a
 * budżet zostawia miejsce dla dalszych przebiegów (bonus %, floor, pasma) bez przebicia sanity-cap
 * ~40% z growMountainRanges. `classifyTerrain` przy niskim elevContinental+landMask może zwrócić
 * Morze (próg oceanu) — ale każdy heks tutaj JEST już lądem (skip Morze/Wybrzeze poniżej) — nie
 * cofamy tamtej decyzji: taki przypadek spłaszczamy do Łąki, jak robił classifyTerrainFlat.
 */
const REAPPLY_RELIEF_BUDGET_FRAC: Record<ReliefDensityTier, number> = {
  low: 0.10,
  medium: 0.17,
  high: 0.30,
};

export function reapplyLandTerrain(
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  seed: number,
  thresholds?: TerrainClassifyThresholds,
  mapHeight?: number,
  reliefTier: ReliefDensityTier = 'medium',
): void {
  const reliefCandidates: Array<{ key: string; n: number; want: TerenBazowy }> = [];
  let landCount = 0;

  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy === TerenBazowy.Morze || hex.terenBazowy === TerenBazowy.Wybrzeze) {
      continue;
    }
    const s = scratch.get(key);
    if (!s) continue;
    landCount++;
    const { q, r } = hex.coords;
    const climateZone = mapHeight ? climateZoneAt(q, r, mapHeight) : undefined;
    const cellBias = terrainCellBias(q, r, seed);
    const { terenBazowy: fullTb, nakladka: fullNak } = classifyTerrain(
      s.elevContinental, s.landMask, s.mtnNoise, s.forNoise, s.desNoise,
      thresholds, climateZone, cellBias,
    );
    if (fullTb === TerenBazowy.Gory || fullTb === TerenBazowy.Wzgorza) {
      // Tymczasowo płasko — przywrócimy TOP-budżet kandydatów po mtnNoise (skupiska), nie wszystkie.
      const { terenBazowy: flatTb, nakladka: flatNak } = classifyTerrainFlat(
        s.elevContinental, s.landMask, s.mtnNoise, s.forNoise, s.desNoise,
        thresholds, climateZone, cellBias,
      );
      hex.terenBazowy = flatTb;
      hex.nakladka = flatNak;
      reliefCandidates.push({ key, n: s.mtnNoise, want: fullTb });
    } else {
      // Ten heks JEST lądem (skip Morze/Wybrzeze powyżej) — classifyTerrain nie cofa tej decyzji.
      hex.terenBazowy = fullTb === TerenBazowy.Morze ? TerenBazowy.Laka : fullTb;
      hex.nakladka = fullNak;
    }
  }

  if (reliefCandidates.length === 0) return;
  reliefCandidates.sort((a, b) => b.n - a.n);
  const budgetFrac = REAPPLY_RELIEF_BUDGET_FRAC[reliefTier];
  const budget = Math.floor(landCount * budgetFrac);
  for (let i = 0; i < Math.min(budget, reliefCandidates.length); i++) {
    const c = reliefCandidates[i]!;
    const hex = hexes[c.key];
    if (!hex) continue;
    hex.terenBazowy = c.want;
    hex.nakladka = Nakladka.Brak;
  }
}

export type ReliefDensityTier = 'low' | 'medium' | 'high';

const FALLBACK_RELIEF_FRAC: Record<ReliefDensityTier, { mountain: number; highland: number }> = {
  low: { mountain: 0.03, highland: 0.07 },
  medium: { mountain: 0.06, highland: 0.11 },
  high: { mountain: 0.12, highland: 0.18 },
};

/** Docelowy udział gór/wzgórz na lądzie (gwarantowany ranking szumu). */
export function reliefLandFractions(tier: ReliefDensityTier): { mountain: number; highland: number } {
  return { ...FALLBACK_RELIEF_FRAC[tier] };
}

/** Twardy ocean przy krawędzi mapy — ląd nie bliżej niż 2 hexy od ramki (d=0,1). */
export const MAP_BORDER_OCEAN_HEXES = 2;

/** Strefa stopniowanego lądu od brzegu — d=2..10, potem normalne zasady. */
export const MAP_MARGIN_LAND_ZONE_HEXES = 10;

/** Szerokość bufora oceanu wzdłuż krawędzi mapy (w heksach) — twardy pas d=0..1. */
export function mapBorderWidth(_width: number, _height: number): number {
  return MAP_BORDER_OCEAN_HEXES;
}

/**
 * Maks. udział lądu w pierścieniu w odległości d od krawędzi mapy.
 * d=3→10%, d=4→15%, d=5→20% … d=10→45%; d<2→0%; d>10→null (bez limitu pierścienia).
 */
export function marginLandCapForBorderDistance(d: number): number | null {
  if (d < MAP_BORDER_OCEAN_HEXES) return 0;
  if (d <= MAP_MARGIN_LAND_ZONE_HEXES) return 0.05 * (d - 1);
  return null;
}

/** Deterministyczny „posiew” lądu w strefie brzegowej — unika prostych linii. */
function marginScatterScore(q: number, r: number, landScores: Map<string, number>): number {
  const base = landScores.get(hexKey(q, r)) ?? 0;
  const n = ((q * 73856093) ^ (r * 19349663)) & 0xffff;
  return base + (n / 0xffff) * 0.38;
}

function countLandNeighborsInSet(hexes: Record<string, Hex>, q: number, r: number): number {
  let n = 0;
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nh = hexes[hexKey(q + dq, r + dr)];
    if (nh && nh.terenBazowy !== TerenBazowy.Morze) n++;
  }
  return n;
}

function keysAtBorderDistance(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
  d: number,
): string[] {
  const out: string[] = [];
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      if (hexBorderDistance(q, r, width, height) !== d) continue;
      out.push(hexKey(q, r));
    }
  }
  return out;
}

/**
 * Strefa brzegowa (2–10 hex od krawędzi): limit lądu per pierścień + poszczepiony układ.
 * Po d=10 obowiązują normalne zasady (globalny landFraction).
 */
export function applyMarginalLandZoneCaps(
  hexes: Record<string, Hex>,
  landScores: Map<string, number>,
  width: number,
  height: number,
): number {
  let adjusted = 0;
  for (let d = 0; d <= MAP_MARGIN_LAND_ZONE_HEXES; d++) {
    const cap = marginLandCapForBorderDistance(d);
    if (cap == null) continue;
    const ring = keysAtBorderDistance(hexes, width, height, d);
    if (ring.length === 0) continue;

    let land = 0;
    for (const k of ring) {
      if (hexes[k]!.terenBazowy !== TerenBazowy.Morze) land++;
    }
    const targetLand = Math.round(ring.length * cap);

    if (land > targetLand) {
      const landKeys = ring.filter((k) => hexes[k]!.terenBazowy !== TerenBazowy.Morze);
      const sorted = sortLandKeysForErosion(landKeys, hexes, landScores, width, height);
      for (const k of sorted) {
        if (land <= targetLand) break;
        setHexToMorze(hexes[k]!);
        land--;
        adjusted++;
      }
    } else if (land < targetLand) {
      const morseKeys = ring.filter((k) => hexes[k]!.terenBazowy === TerenBazowy.Morze);
      morseKeys.sort((a, b) => {
        const pa = parseHexKey(a);
        const pb = parseHexKey(b);
        const sa = marginScatterScore(pa.q, pa.r, landScores);
        const sb = marginScatterScore(pb.q, pb.r, landScores);
        if (Math.abs(sb - sa) > 0.02) return sb - sa;
        const na = countLandNeighborsInSet(hexes, pa.q, pa.r);
        const nb = countLandNeighborsInSet(hexes, pb.q, pb.r);
        return na - nb;
      });
      for (const k of morseKeys) {
        if (land >= targetLand) break;
        const { q, r } = parseHexKey(k);
        if (countLandNeighborsInSet(hexes, q, r) >= 5) continue;
        setHexToLaka(hexes[k]!);
        land++;
        adjusted++;
      }
    }
  }
  return adjusted;
}

/** Heks w strefie stopniowanego brzegu (d ≤ 10) — nie globalny interior. */
export function isInMapMarginZone(q: number, r: number, width: number, height: number): boolean {
  return hexBorderDistance(q, r, width, height) <= MAP_MARGIN_LAND_ZONE_HEXES;
}

/**
 * Mnożnik maski lądu: 0 w twardym oceanie (d<2), stopniowy wzrost w strefie 2–10 hex.
 */
export function landMaskBorderFade(q: number, r: number, width: number, height: number): number {
  const d = hexBorderDistance(q, r, width, height);
  const cap = marginLandCapForBorderDistance(d);
  if (cap == null) return 1;
  if (cap <= 0) return 0;
  return Math.min(1, cap / 0.45);
}

/** Mnożnik 0–1: silniejszy ląd bliżej geometrycznego środka mapy. */
export function mapCenterRadialBias(q: number, r: number, width: number, height: number): number {
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const dx = (q - cx) / (cx + 0.5);
  const dy = (r - cy) / (cy + 0.5);
  const dist = Math.sqrt(dx * dx + dy * dy);
  return Math.max(0.12, 1 - Math.pow(dist / 0.94, 2.0));
}

/** Prostokątny fade od krawędzi mapy (zgodny z buforem w heksach). */
export function mapEdgeRectFade(q: number, r: number, width: number, height: number): number {
  const b = mapBorderWidth(width, height);
  const nq = q / Math.max(1, width - 1);
  const nr = r / Math.max(1, height - 1);
  const marginQ = b / Math.max(1, width - 1);
  const marginR = b / Math.max(1, height - 1);
  return Math.min(
    Math.min(nq, 1 - nq) / Math.max(marginQ, 0.001),
    Math.min(nr, 1 - nr) / Math.max(marginR, 0.001),
    1,
  );
}

function mapCenterDistanceNorm(q: number, r: number, width: number, height: number): number {
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const dx = (q - cx) / (cx + 0.5);
  const dy = (r - cy) / (cy + 0.5);
  return Math.sqrt(dx * dx + dy * dy);
}

export function hexBorderDistance(q: number, r: number, width: number, height: number): number {
  return Math.min(q, r, width - 1 - q, height - 1 - r);
}

export function isInMapBorder(q: number, r: number, width: number, height: number, buffer?: number): boolean {
  const b = buffer ?? mapBorderWidth(width, height);
  return hexBorderDistance(q, r, width, height) < b;
}

/** Heks nadający się na relief — nie morze, nie wybrzeże, nie bufor krawędzi. */
function isReliefCandidateHex(
  hex: Hex,
  q: number,
  r: number,
  width: number,
  height: number,
): boolean {
  if (hex.terenBazowy === TerenBazowy.Morze || hex.terenBazowy === TerenBazowy.Wybrzeze) {
    return false;
  }
  return !isInMapBorder(q, r, width, height);
}

export function countMapBorderHexes(width: number, height: number, buffer?: number): number {
  const b = buffer ?? mapBorderWidth(width, height);
  let n = 0;
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      if (isInMapBorder(q, r, width, height, b)) n++;
    }
  }
  return n;
}

/** Heksy lądu/wybrzeża w buforze brzegu (powinno być puste po enforceMapBorderOcean). */
export function findLandInMapBorder(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
): string[] {
  const b = mapBorderWidth(width, height);
  const bad: string[] = [];
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      if (hexBorderDistance(q, r, width, height) >= b) continue;
      const hex = hexes[hexKey(q, r)];
      if (!hex || hex.terenBazowy === TerenBazowy.Morze) continue;
      bad.push(hexKey(q, r));
    }
  }
  return bad;
}

/** Wymusza ocean w buforze przy krawędzi — ląd nie „rozlewa się” wzdłuż ramki. */
export function enforceMapBorderOcean(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
  buffer?: number,
): number {
  const b = buffer ?? mapBorderWidth(width, height);
  let converted = 0;
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      if (!isInMapBorder(q, r, width, height, b)) continue;
      const hex = hexes[hexKey(q, r)];
      if (!hex || hex.terenBazowy === TerenBazowy.Morze) continue;
      setHexToMorze(hex);
      converted++;
    }
  }
  return converted;
}

/**
 * Grupy spójnych mas lądu (flood-fill — każda wyspa / kontynent osobno).
 */
export function groupLandMassKeys(hexes: Record<string, Hex>): string[][] {
  const visited = new Set<string>();
  const groups: string[][] = [];
  for (const key of Object.keys(hexes)) {
    const hex = hexes[key];
    if (!hex || hex.terenBazowy === TerenBazowy.Morze) continue;
    if (visited.has(key)) continue;
    const mass: string[] = [];
    const stack = [key];
    visited.add(key);
    while (stack.length) {
      const k = stack.pop()!;
      mass.push(k);
      const { q, r } = parseHexKey(k);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        if (visited.has(nk)) continue;
        const nh = hexes[nk];
        if (!nh || nh.terenBazowy === TerenBazowy.Morze) continue;
        visited.add(nk);
        stack.push(nk);
      }
    }
    groups.push(mass);
  }
  return groups;
}

function isForestEligibleTerrain(tb: TerenBazowy): boolean {
  return tb !== TerenBazowy.Morze && tb !== TerenBazowy.Wybrzeze
    && tb !== TerenBazowy.Gory && tb !== TerenBazowy.Pustynia;
}

/**
 * Partycje lądu do równomiernego reliefu/lasu:
 *   kontynenty → strefy Voronoi; wyspy/ziemia → masy flood-fill; pangea → masy (zwykle jedna).
 */
export function landPartitionKeysForDistribution(
  hexes: Record<string, Hex>,
  typ: TypSwiata,
  continentOf: Map<string, number> | null,
  nContinents: number,
): string[][] {
  if ((typ === 'kontynenty' || typ === 'wyspy') && continentOf && nContinents > 0) {
    const zones: string[][] = Array.from({ length: nContinents }, () => []);
    for (const key of Object.keys(hexes)) {
      const hex = hexes[key];
      if (!hex || hex.terenBazowy === TerenBazowy.Morze) continue;
      const ci = Math.min(nContinents - 1, Math.max(0, continentOf.get(key) ?? 0));
      zones[ci]!.push(key);
    }
    return zones.filter((z) => z.length > 0);
  }
  return groupLandMassKeys(hexes);
}

/**
 * Udział heksów z lasem na suche ląd per partycja/komórka (przed sufitem cap i przed
 * ubytkiem z późniejszych przebiegów reliefu/wybrzeża). Skalibrowane empirycznie
 * (2026-07-26, dobór iteracyjny skryptem pomiarowym) tak, by ZMIERZONE pokrycie (Las /
 * Łąka+Równina+Wzgórza na całej mapie) wyszło Mało≈40% · Normalnie≈60% · Dużo≈80%.
 */
const FOREST_SHARE_OF_DRY_LAND: Record<DensityTier, number> = {
  low: 0.38,
  medium: 0.58,
  high: 0.95,
};

/**
 * Twardy sufit nakładki lasu w komórce (ułamek eligible) — niezależny od tieru, gwarantuje
 * polany nawet przy `high` (5 pkt proc. eligible zawsze bez lasu w każdej komórce). MUSI być
 * >= najwyższej wartości `FOREST_SHARE_OF_DRY_LAND`, inaczej dominuje nad share i tiery stają
 * się nierozróżnialne (bug sprzed 2026-07-26: cap=0.18 < wszystkie share, więc low/medium/high
 * dawały ten sam wynik ~15-19%). Dla `low`/`medium` cap nie ingeruje poza strefą umiarkowaną
 * (tam `zoneShareMul`=1.35 może i tak podbić target ponad cap — zamierzone, bo strefa
 * umiarkowana ma z założenia gęstszy las).
 */
const FOREST_OVERLAY_CAP_FRAC = 0.95;

function applyReliefToLandKeys(
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  tier: ReliefDensityTier,
  keys: string[],
  width: number,
  height: number,
): void {
  if (keys.length === 0) return;
  applyIronMountainsToLandKeys(hexes, scratch, tier, keys, width, height);
  applyCopperHighlandsToLandKeys(hexes, scratch, tier, keys, width, height);
}

function reliefBonusCapMountain(tier: ReliefDensityTier, landCount: number): number {
  const frac = tier === 'high' ? 0.14 : tier === 'low' ? 0.05 : 0.09;
  return Math.max(0, Math.ceil(landCount * frac));
}

function reliefBonusCapHighland(tier: ReliefDensityTier, landCount: number): number {
  const frac = tier === 'high' ? 0.22 : tier === 'low' ? 0.08 : 0.14;
  return Math.max(0, Math.ceil(landCount * frac));
}

/** Anty-klaster w komórce żelaza (fair play — rozkład, nie jeden stos wzgórz). */
function reliefSpreadCapMountain(tier: ReliefDensityTier, landCount: number): number {
  const frac = tier === 'high' ? 0.08 : tier === 'low' ? 0.03 : 0.04;
  return Math.max(MIN_MOUNTAINS_IRON_CELL, Math.ceil(landCount * frac));
}

function reliefSpreadCapHighland(tier: ReliefDensityTier, landCount: number): number {
  const frac = tier === 'high' ? 0.12 : tier === 'low' ? 0.05 : 0.06;
  return Math.max(MIN_HIGHLANDS_COPPER_CELL, Math.ceil(landCount * frac));
}

function applyIronMountainsToLandKeys(
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  tier: ReliefDensityTier,
  keys: string[],
  width: number,
  height: number,
): void {
  const fr = reliefLandFractions(tier);
  const cellSize = ironCoverageCellSize(tier);
  const minLand = minLandHexesForReliefCell(cellSize);
  const massSet = new Set(keys);

  for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
    if (land.length < minLand) continue;
    const candidates = land
      .filter(([q, r]) => {
        const hex = hexes[hexKey(q, r)];
        if (!hex || hex.terenBazowy === TerenBazowy.Gory) return false;
        return isReliefCandidateHex(hex, q, r, width, height);
      })
      .map(([q, r]) => ({
        k: hexKey(q, r),
        n: scratch.get(hexKey(q, r))?.mtnNoise ?? 0,
      }))
      .sort((a, b) => b.n - a.n);
    if (candidates.length === 0) continue;

    const bonus = Math.round(candidates.length * fr.mountain);
    const nMtn = Math.min(bonus, reliefBonusCapMountain(tier, candidates.length));
    if (nMtn <= 0) continue;

    for (const k of pickSpreadReliefKeys(candidates, nMtn, 4)) {
      hexes[k]!.terenBazowy = TerenBazowy.Gory;
      hexes[k]!.nakladka = Nakladka.Brak;
    }
  }
}

function applyCopperHighlandsToLandKeys(
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  tier: ReliefDensityTier,
  keys: string[],
  width: number,
  height: number,
): void {
  const fr = reliefLandFractions(tier);
  const cellSize = copperCoverageCellSize(tier);
  const minLand = minLandHexesForReliefCell(cellSize);
  const massSet = new Set(keys);

  for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
    if (land.length < minLand) continue;
    const candidates = land
      .filter(([q, r]) => {
        const hex = hexes[hexKey(q, r)];
        if (!hex || hex.terenBazowy === TerenBazowy.Wzgorza) return false;
        return isReliefCandidateHex(hex, q, r, width, height);
      })
      .map(([q, r]) => ({
        k: hexKey(q, r),
        n: scratch.get(hexKey(q, r))?.mtnNoise ?? 0,
      }))
      .sort((a, b) => b.n - a.n);
    if (candidates.length === 0) continue;

    const bonus = Math.round(candidates.length * fr.highland);
    const nHi = Math.min(bonus, reliefBonusCapHighland(tier, candidates.length));
    if (nHi <= 0) continue;

    for (const k of pickSpreadReliefKeys(candidates, nHi, 3)) {
      hexes[k]!.terenBazowy = TerenBazowy.Wzgorza;
      hexes[k]!.nakladka = Nakladka.Brak;
    }
  }
}

function pickSpreadReliefKeys(
  candidates: Array<{ k: string; n: number }>,
  count: number,
  minDist: number,
): string[] {
  if (count <= 0 || candidates.length === 0) return [];
  const picked: string[] = [];
  for (const c of candidates) {
    if (picked.length >= count) break;
    const { q, r } = parseHexKey(c.k);
    const spaced = picked.every((pk) => {
      const { q: pq, r: pr } = parseHexKey(pk);
      return hexDistanceAxial(q, r, pq, pr) >= minDist;
    });
    if (spaced) picked.push(c.k);
  }
  for (const c of candidates) {
    if (picked.length >= count) break;
    if (!picked.includes(c.k)) picked.push(c.k);
  }
  return picked;
}

/**
 * Gwarantuje góry/wzgórza wg tieru — **bonus procentowy** z ustawień reliefu (minima domyka ensure).
 */
export function applyReliefByNoiseRank(
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  tier: ReliefDensityTier,
  width: number,
  height: number,
  typ: TypSwiata = 'pangea',
  continentOf: Map<string, number> | null = null,
  nContinents = 0,
): void {
  const partitions = landPartitionKeysForDistribution(hexes, typ, continentOf, nContinents);
  for (const part of partitions) {
    const keys = part.filter((key) => {
      const hex = hexes[key];
      if (!hex) return false;
      const { q, r } = parseHexKey(key);
      return isReliefCandidateHex(hex, q, r, width, height);
    });
    applyReliefToLandKeys(hexes, scratch, tier, keys, width, height);
  }
}

// ---------------------------------------------------------------------------
// Relief — równomierna siatka gór/wzgórz (Maciej 2026-07-04: fair play rud)
// ---------------------------------------------------------------------------

/** Minima fair play (Maciej 2026-07-04 ~20:34). */
export const MIN_RIVER_SOURCES_PER_WATER_CELL = 1;
export const MIN_HIGHLANDS_COPPER_CELL = 2;
export const MIN_MOUNTAINS_IRON_CELL = 2;

/**
 * Siatka wody (rzeki): tier kreatora „Rzeki”.
 * Mało=15 · Normalnie=10 · Dużo=5 (Maciej 2026-07-04 ~21:03).
 */
export function waterCoverageCellSize(tier: DensityTier | ReliefDensityTier = 'medium'): number {
  if (tier === 'high') return 5;
  if (tier === 'low') return 15;
  return 10;
}

/**
 * Siatka gór (żelazo) — tier kreatora „Góry i wzgórza” (Maciej A 2026-07-05, lustro rzek).
 * Mało=35 · Normalnie=25 · Dużo=20.
 */
export function ironCoverageCellSize(tier: ReliefDensityTier = 'medium'): number {
  if (tier === 'high') return 20;
  if (tier === 'low') return 35;
  return 25;
}

/**
 * Siatka wzgórz (miedź) — ten sam suwak Relief, proporcja ~5∶3 względem gór.
 * Mało=21 · Normalnie=15 · Dużo=12.
 */
export function copperCoverageCellSize(tier: ReliefDensityTier | DensityTier = 'medium'): number {
  if (tier === 'high') return 12;
  if (tier === 'low') return 21;
  return 15;
}

/**
 * @deprecated używaj ironCoverageCellSize / copperCoverageCellSize
 */
export function reliefCoverageCellSize(tier: ReliefDensityTier = 'medium'): number {
  return ironCoverageCellSize(tier);
}

/** Siatka złóż fair play (glina, konie, bydło, owce + pakiet z reliefem). */
export function fairPlayResourceCellSize(tier: DensityTier | ReliefDensityTier = 'medium'): number {
  return ironCoverageCellSize(tier as ReliefDensityTier);
}

/** Siatka lasu (fair play minimum) — tier kreatora „Las” (lustro rzek). Mało=15 · Normalnie=10 · Dużo=5. */
export function forestCoverageCellSize(tier: DensityTier = 'medium'): number {
  if (tier === 'high') return 5;
  if (tier === 'low') return 15;
  return 10;
}

export function minLandHexesForFairPlayCell(cellSize: number): number {
  return minLandHexesForReliefCell(cellSize);
}

export function minLandHexesForReliefCell(cellSize: number): number {
  return Math.max(8, Math.floor(cellSize * 0.32));
}

function countMountainsInCell(
  cellLand: Array<[number, number]>,
  hexes: Record<string, Hex>,
): number {
  let n = 0;
  for (const [q, r] of cellLand) {
    if (hexes[hexKey(q, r)]?.terenBazowy === TerenBazowy.Gory) n++;
  }
  return n;
}

function countHighlandsInCell(
  cellLand: Array<[number, number]>,
  hexes: Record<string, Hex>,
): number {
  let n = 0;
  for (const [q, r] of cellLand) {
    if (hexes[hexKey(q, r)]?.terenBazowy === TerenBazowy.Wzgorza) n++;
  }
  return n;
}

function cellHasMountain(
  cellLand: Array<[number, number]>,
  hexes: Record<string, Hex>,
): boolean {
  return countMountainsInCell(cellLand, hexes) > 0;
}

function cellHasHighland(
  cellLand: Array<[number, number]>,
  hexes: Record<string, Hex>,
): boolean {
  return countHighlandsInCell(cellLand, hexes) > 0;
}

/** Komórka 25×25: min. 2× Góry (żelazo). */
export function cellHasIronPackage(
  cellLand: Array<[number, number]>,
  hexes: Record<string, Hex>,
): boolean {
  return countMountainsInCell(cellLand, hexes) >= MIN_MOUNTAINS_IRON_CELL;
}

/** Komórka 15×15: min. 2× Wzgórza (miedź / ruda brązu). */
export function cellHasCopperPackage(
  cellLand: Array<[number, number]>,
  hexes: Record<string, Hex>,
): boolean {
  return countHighlandsInCell(cellLand, hexes) >= MIN_HIGHLANDS_COPPER_CELL;
}

/** @deprecated — używaj cellHasIronPackage + cellHasCopperPackage */
export function cellHasReliefPackage(
  cellLand: Array<[number, number]>,
  hexes: Record<string, Hex>,
): boolean {
  return cellHasMountain(cellLand, hexes) && cellHasHighland(cellLand, hexes);
}

export function ironGridCoverageRatio(
  massLandKeys: string[],
  hexes: Record<string, Hex>,
  cellSize: number,
): number {
  const massSet = new Set(massLandKeys);
  const minLand = minLandHexesForReliefCell(cellSize);
  let need = 0;
  let hit = 0;
  for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
    if (land.length < minLand) continue;
    need++;
    if (cellHasIronPackage(land, hexes)) hit++;
  }
  return need > 0 ? hit / need : 1;
}

export function copperGridCoverageRatio(
  massLandKeys: string[],
  hexes: Record<string, Hex>,
  cellSize: number,
): number {
  const massSet = new Set(massLandKeys);
  const minLand = minLandHexesForReliefCell(cellSize);
  let need = 0;
  let hit = 0;
  for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
    if (land.length < minLand) continue;
    need++;
    if (cellHasCopperPackage(land, hexes)) hit++;
  }
  return need > 0 ? hit / need : 1;
}

/** @deprecated — sprawdza oba pakiety na siatce żelaza (25). */
export function reliefGridCoverageRatio(
  massLandKeys: string[],
  hexes: Record<string, Hex>,
  ironCellSize: number,
  copperCellSize?: number,
): number {
  const copperSize = copperCellSize ?? Math.round(ironCellSize * 0.6);
  const iron = ironGridCoverageRatio(massLandKeys, hexes, ironCellSize);
  const copper = copperGridCoverageRatio(massLandKeys, hexes, copperSize);
  return (iron + copper) / 2;
}

export function assertReliefGridCoverage(
  massLandKeys: string[],
  hexes: Record<string, Hex>,
  tier: ReliefDensityTier = 'medium',
): boolean {
  return reliefGridCoverageRatio(
    massLandKeys,
    hexes,
    ironCoverageCellSize(tier),
    copperCoverageCellSize(tier),
  ) >= 0.999;
}

function pickReliefForceHex(
  land: Array<[number, number]>,
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  width: number,
  height: number,
  want: 'mountain' | 'highland',
  avoid: Set<string>,
  rand: () => number,
  protectHighland = false,
  protectMountain = false,
): [number, number] | null {
  const ranked = land
    .filter(([q, r]) => {
      const k = hexKey(q, r);
      if (avoid.has(k)) return false;
      const hex = hexes[k];
      if (!hex || hex.terenBazowy === TerenBazowy.Morze) return false;
      if (hex.terenBazowy === TerenBazowy.Wybrzeze) return false;
      if (want === 'mountain' && hex.terenBazowy === TerenBazowy.Gory) return false;
      if (want === 'highland' && hex.terenBazowy === TerenBazowy.Wzgorza) return false;
      if (want === 'mountain' && protectHighland && hex.terenBazowy === TerenBazowy.Wzgorza) {
        return false;
      }
      if (want === 'highland' && protectMountain && hex.terenBazowy === TerenBazowy.Gory) {
        return false;
      }
      return true;
    })
    .map(([q, r]) => {
      const k = hexKey(q, r);
      let score = scratch.get(k)?.mtnNoise ?? 0;
      if (want === 'highland') score *= 0.9;
      score += Math.min(8, hexBorderDistance(q, r, width, height)) * 0.04;
      if (hexes[k]!.terenBazowy === TerenBazowy.Wybrzeze) score -= 0.15;
      score += rand() * 0.1;
      return { q, r, score };
    })
    .sort((a, b) => b.score - a.score);
  if (ranked.length === 0) return null;
  return [ranked[0]!.q, ranked[0]!.r];
}

function forceReliefTypeInCell(
  land: Array<[number, number]>,
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  width: number,
  height: number,
  rand: () => number,
  want: 'mountain' | 'highland',
  minCount: number,
): boolean {
  const countFn = () =>
    want === 'mountain' ? countMountainsInCell(land, hexes) : countHighlandsInCell(land, hexes);
  if (countFn() >= minCount) return false;

  let changed = false;
  const placed = new Set<string>();
  let guard = 0;
  while (countFn() < minCount && guard++ < land.length + 8) {
    const protectHighland = want === 'mountain' && countHighlandsInCell(land, hexes) <= MIN_HIGHLANDS_COPPER_CELL;
    const protectMountain = want === 'highland' && countMountainsInCell(land, hexes) <= MIN_MOUNTAINS_IRON_CELL;
    let spot = pickReliefForceHex(
      land, hexes, scratch, width, height, want, placed, rand, protectHighland, protectMountain,
    );
    if (!spot) {
      spot = pickReliefForceHex(
        land, hexes, scratch, width, height, want, placed, rand, false, false,
      );
    }
    if (!spot) {
      const ranked = land
        .filter(([q, r]) => {
          const k = hexKey(q, r);
          if (placed.has(k)) return false;
          const hex = hexes[k];
          if (!hex || hex.terenBazowy === TerenBazowy.Morze) return false;
          if (hex.terenBazowy === TerenBazowy.Wybrzeze) return false;
          if (want === 'mountain' && hex.terenBazowy === TerenBazowy.Gory) return false;
          if (want === 'highland' && hex.terenBazowy === TerenBazowy.Wzgorza) return false;
          return true;
        })
        .map(([q, r]) => ({ q, r, n: scratch.get(hexKey(q, r))?.mtnNoise ?? 0 }))
        .sort((a, b) => b.n - a.n);
      if (ranked.length === 0) break;
      spot = [ranked[0]!.q, ranked[0]!.r];
    }
    const k = hexKey(spot[0], spot[1]);
    const forcedHex = hexes[k]!;
    forcedHex.terenBazowy = want === 'mountain' ? TerenBazowy.Gory : TerenBazowy.Wzgorza;
    forcedHex.nakladka = Nakladka.Brak;
    delete (forcedHex as HexWithZloze).zloze;
    placed.add(k);
    changed = true;
  }
  return changed;
}

function forceIronMountainsInCell(
  land: Array<[number, number]>,
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  width: number,
  height: number,
  rand: () => number,
): boolean {
  return forceReliefTypeInCell(
    land, hexes, scratch, width, height, rand, 'mountain', MIN_MOUNTAINS_IRON_CELL,
  );
}

function forceCopperHighlandsInCell(
  land: Array<[number, number]>,
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  width: number,
  height: number,
  rand: () => number,
): boolean {
  return forceReliefTypeInCell(
    land, hexes, scratch, width, height, rand, 'highland', MIN_HIGHLANDS_COPPER_CELL,
  );
}

/** @deprecated */
function forceReliefInCell(
  land: Array<[number, number]>,
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  width: number,
  height: number,
  rand: () => number,
): boolean {
  const a = forceIronMountainsInCell(land, hexes, scratch, width, height, rand);
  const b = forceCopperHighlandsInCell(land, hexes, scratch, width, height, rand);
  return a || b;
}

/**
 * Zmiana 1 „MIN NIE MAX" (Maciej 2026-07-11): fair-play min. 2 Góry + 2 Wzgórza / komórkę
 * jest DOLNĄ granicą reliefu, nie górną. Górny limit (degradacja nadmiaru — najsłabsza
 * Góra→Wzgórza, Wzgórze→Równina) BYŁ sztuczną regularnością. Mnożnik = ∞ → cap wyłączony:
 * naturalny szum daje bogatszy, nieregularny relief (gwarancja minimum zostaje — force*InCell).
 * Miękki sufit (np. 3–5 × dawny cap) tylko gdy skan pokaże za dużo (>~40% lądu górzyste).
 */
const RELIEF_OVERFLOW_CAP_MULT = Number.POSITIVE_INFINITY;

function capMountainOverflowInCell(
  land: Array<[number, number]>,
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  tier: ReliefDensityTier,
  spreadOnly = false,
): boolean {
  const baseMaxMtn = spreadOnly
    ? reliefSpreadCapMountain(tier, land.length)
    : Math.max(MIN_MOUNTAINS_IRON_CELL, reliefBonusCapMountain(tier, land.length) + MIN_MOUNTAINS_IRON_CELL);
  const maxMtn = baseMaxMtn * RELIEF_OVERFLOW_CAP_MULT;
  const mountains = land
    .filter(([q, r]) => hexes[hexKey(q, r)]?.terenBazowy === TerenBazowy.Gory)
    .map(([q, r]) => ({ q, r, n: scratch.get(hexKey(q, r))?.mtnNoise ?? 0 }))
    .sort((a, b) => a.n - b.n);
  let changed = false;
  while (mountains.length > maxMtn && mountains.length > MIN_MOUNTAINS_IRON_CELL) {
    const drop = mountains.shift()!;
    const dropHex = hexes[hexKey(drop.q, drop.r)]!;
    dropHex.terenBazowy = TerenBazowy.Wzgorza;
    dropHex.nakladka = Nakladka.Brak;
    delete (dropHex as HexWithZloze).zloze;
    changed = true;
  }
  return changed;
}

function capHighlandOverflowInCell(
  land: Array<[number, number]>,
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  tier: ReliefDensityTier,
  spreadOnly = false,
): boolean {
  // Zmiana 1 „MIN NIE MAX": górny limit Wzgórz wyłączony (RELIEF_OVERFLOW_CAP_MULT = ∞).
  const baseMaxHi = spreadOnly
    ? reliefSpreadCapHighland(tier, land.length)
    : Math.max(MIN_HIGHLANDS_COPPER_CELL, reliefBonusCapHighland(tier, land.length) + MIN_HIGHLANDS_COPPER_CELL);
  const maxHi = baseMaxHi * RELIEF_OVERFLOW_CAP_MULT;
  const highlands = land
    .filter(([q, r]) => hexes[hexKey(q, r)]?.terenBazowy === TerenBazowy.Wzgorza)
    .map(([q, r]) => ({ q, r, n: scratch.get(hexKey(q, r))?.mtnNoise ?? 0 }))
    .sort((a, b) => a.n - b.n);
  let changed = false;
  while (highlands.length > maxHi && highlands.length > MIN_HIGHLANDS_COPPER_CELL) {
    const drop = highlands.shift()!;
    const dropHex = hexes[hexKey(drop.q, drop.r)]!;
    dropHex.terenBazowy = TerenBazowy.Rownina;
    dropHex.nakladka = Nakladka.Brak;
    delete (dropHex as HexWithZloze).zloze;
    changed = true;
  }
  return changed;
}

function capIronCellReliefSpread(
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  tier: ReliefDensityTier,
  massSet: Set<string>,
): void {
  const ironSize = ironCoverageCellSize(tier);
  const minIronLand = minLandHexesForReliefCell(ironSize);
  for (const land of landHexesByCoverageCell(massSet, ironSize).values()) {
    if (land.length < minIronLand) continue;
    capMountainOverflowInCell(land, hexes, scratch, tier, true);
    capHighlandOverflowInCell(land, hexes, scratch, tier, true);
  }
}

/** @deprecated */
function capReliefOverflowInCell(
  land: Array<[number, number]>,
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  _tier: ReliefDensityTier,
): boolean {
  return capMountainOverflowInCell(land, hexes, scratch, _tier)
    || capHighlandOverflowInCell(land, hexes, scratch, _tier);
}

function ensureMassIronGridCoverage(
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  tier: ReliefDensityTier,
  width: number,
  height: number,
  massSet: Set<string>,
  rand: () => number,
  skipCap = false,
): number {
  const ironSize = ironCoverageCellSize(tier);
  const minIronLand = minLandHexesForReliefCell(ironSize);
  const eligibleCells = [...landHexesByCoverageCell(massSet, ironSize).values()]
    .filter((land) => land.length >= minIronLand);
  let fixed = 0;

  if (!skipCap) {
    for (const land of eligibleCells) {
      capMountainOverflowInCell(land, hexes, scratch, tier);
    }
  }
  for (let pass = 0; pass < 14; pass++) {
    let inner = 0;
    const cells = [...eligibleCells]
      .sort((a, b) => (cellHasIronPackage(a, hexes) ? 1 : 0) - (cellHasIronPackage(b, hexes) ? 1 : 0));
    for (const land of cells) {
      if (cellHasIronPackage(land, hexes)) continue;
      if (forceIronMountainsInCell(land, hexes, scratch, width, height, rand)) inner++;
    }
    fixed += inner;
    if (inner === 0) break;
  }
  return fixed;
}

function ensureMassCopperGridCoverage(
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  tier: ReliefDensityTier,
  width: number,
  height: number,
  massSet: Set<string>,
  rand: () => number,
  skipCap = false,
): number {
  const copperSize = copperCoverageCellSize(tier);
  const minCopperLand = minLandHexesForReliefCell(copperSize);
  const eligibleCells = [...landHexesByCoverageCell(massSet, copperSize).values()]
    .filter((land) => land.length >= minCopperLand);
  let fixed = 0;

  if (!skipCap) {
    for (const land of eligibleCells) {
      capHighlandOverflowInCell(land, hexes, scratch, tier);
    }
  }
  for (let pass = 0; pass < 14; pass++) {
    let inner = 0;
    const cells = [...eligibleCells]
      .sort((a, b) => (cellHasCopperPackage(a, hexes) ? 1 : 0) - (cellHasCopperPackage(b, hexes) ? 1 : 0));
    for (const land of cells) {
      if (cellHasCopperPackage(land, hexes)) continue;
      if (forceCopperHighlandsInCell(land, hexes, scratch, width, height, rand)) inner++;
    }
    fixed += inner;
    if (inner === 0) break;
  }
  return fixed;
}

/**
 * Domyka siatki fair play reliefu (lustro rzek — pełne masy lądu, nie strefy Voronoi):
 *   · siatka żelaza — min. 2× Góry / komórkę
 *   · siatka miedzi — min. 2× Wzgórza / komórkę
 */
export function ensureReliefGridCoverage(
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  tier: ReliefDensityTier,
  width: number,
  height: number,
  _typ: TypSwiata,
  _continentOf: Map<string, number> | null,
  _nContinents: number,
  rand: () => number,
): number {
  const masses = groupLandMassKeys(hexes)
    .filter((m) => m.length >= 8)
    .sort((a, b) => b.length - a.length);
  let fixed = 0;

  for (let outer = 0; outer < 8; outer++) {
    let passFixed = 0;
    for (const mass of masses) {
      const massSet = new Set(mass);
      passFixed += ensureMassIronGridCoverage(hexes, scratch, tier, width, height, massSet, rand);
      passFixed += ensureMassCopperGridCoverage(hexes, scratch, tier, width, height, massSet, rand);
    }
    fixed += passFixed;
    if (passFixed === 0) break;
  }

  for (const mass of masses) {
    capIronCellReliefSpread(hexes, scratch, tier, new Set(mass));
  }
  for (let restore = 0; restore < 3; restore++) {
    let passFixed = 0;
    for (const mass of masses) {
      const massSet = new Set(mass);
      passFixed += ensureMassIronGridCoverage(hexes, scratch, tier, width, height, massSet, rand, true);
      passFixed += ensureMassCopperGridCoverage(hexes, scratch, tier, width, height, massSet, rand, true);
    }
    fixed += passFixed;
    if (passFixed === 0) break;
  }
  return fixed;
}

// ---------------------------------------------------------------------------
// Pasma górskie — naturalne skupiska (HILLS Q1/Q2/Q3=A, Maciej 2026-07-20)
// ---------------------------------------------------------------------------

/**
 * Sufit udziału lądu (Morze wyłączone z „lądu") zajętego przez Góry+Wzgórza PO dołożeniu
 * pasm — komentarz przy RELIEF_OVERFLOW_CAP_MULT wspominał ~40%; sanity-cap, nie floor.
 */
const MOUNTAIN_RANGE_LAND_SHARE_CAP = 0.40;

/** Kandydaci na seed pasma w masie lądu: preferują wysoki mtnNoise + deterministyczna domieszka rand(). */
function mountainRangeSeedCandidates(
  mass: string[],
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  width: number,
  height: number,
  rand: () => number,
): Array<{ k: string; n: number }> {
  return mass
    .filter((k) => {
      const hex = hexes[k];
      if (!hex) return false;
      const { q, r } = parseHexKey(k);
      return isReliefCandidateHex(hex, q, r, width, height);
    })
    .map((k) => ({ k, n: (scratch.get(k)?.mtnNoise ?? 0) + rand() * 0.15 }))
    .sort((a, b) => b.n - a.n);
}

/**
 * Pojedynczy random-walk „grzbiet" pasma z hexKey `start` — wzorzec jak traceRiver: na każdym
 * kroku wybiera SĄSIADA z najwyższym mtnNoise + domieszka rand() (nie czysto zachłannie —
 * wężowaty, nieregularny kształt pasma, nie kwadratowy blob). Nigdy nie wchodzi na Morze/
 * Wybrzeże/bufor krawędzi (isReliefCandidateHex) i nigdy nie zawraca (visited). Zwraca klucze
 * odwiedzone PO seedzie (seed nie jest częścią wyniku — dodaje go wołający).
 */
function walkMountainRange(
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  width: number,
  height: number,
  rand: () => number,
  start: string,
  steps: number,
): string[] {
  const path: string[] = [];
  const visited = new Set<string>([start]);
  let cur = start;
  for (let i = 0; i < steps; i++) {
    const { q, r } = parseHexKey(cur);
    const candidates = HEX_DIRECTIONS
      .map(([dq, dr]) => hexKey(q + dq, r + dr))
      .filter((k) => {
        if (visited.has(k)) return false;
        const hex = hexes[k];
        if (!hex) return false;
        const { q: nq, r: nr } = parseHexKey(k);
        return isReliefCandidateHex(hex, nq, nr, width, height);
      })
      .map((k) => ({ k, n: (scratch.get(k)?.mtnNoise ?? 0) + rand() * 0.3 }))
      .sort((a, b) => b.n - a.n);
    if (candidates.length === 0) break;
    cur = candidates[0]!.k;
    visited.add(cur);
    path.push(cur);
  }
  return path;
}

/**
 * ZADANIE 1 (HILLS Q1/Q2/Q3=A, 2026-07-20): dorzuca deterministyczne PASMA górskie metodą
 * seed-and-grow — kilka seedów per masa lądu (preferują wysoki mtnNoise, patrz
 * mountainRangeSeedCandidates), rozrost random-walk (walkMountainRange) wybierający sąsiada
 * z najwyższym mtnNoise + rand(), jak traceRiver/generowanie kontynentów.
 *
 * Struktura pasma (Q3=A, DWA PROGI — te same co classifyTerrain/mapGenMountainThreshold +
 * mapGenHighlandThreshold, więc spięte z tierem suwaka Relief bez nowego suwaka UI):
 *   - rdzeń: heks na ścieżce z własnym mtnNoise > próg gór (mtnTh) → Góry.
 *   - obrzeże pasma: (a) heks na ścieżce z mtnNoise > próg wzgórz (hiTh) ale ≤ mtnTh → Wzgórza;
 *                    (b) SĄSIEDZI rdzenia/obrzeża jeszcze nie będący reliefem → Wzgórza (foothills,
 *                    to realnie tworzy „skupisko" widoczne na mapie, nie cienką nitkę 1-hex).
 *   - heks na ścieżce poniżej hiTh: pozostaje niezmieniony (naturalna „przerwa" w paśmie).
 *
 * Konwertuje TYLKO Łąka/Równina/Pustynia; NIGDY nie nadpisuje istniejących Gór/Wzgórz — floor
 * fair-play „min nie max" z ensureReliefGridCoverage (wołane PRZED tą funkcją) zostaje nietknięty.
 * Nigdy Morze/Wybrzeże/bufor krawędzi (isReliefCandidateHex, ten sam predykat co reszta reliefu).
 *
 * Sanity-cap (nie floor): jeśli globalny udział Gór+Wzgórz w lądzie przekroczy
 * MOUNTAIN_RANGE_LAND_SHARE_CAP (~40%), cofa WYŁĄCZNIE to, co DOŁOŻYŁA TA FUNKCJA (obrzeże/
 * Wzgórza najpierw, od najsłabszego mtnNoise) — floor i wcześniejszy relief (Przebieg 1e /
 * ensureReliefGridCoverage) nie są ruszane.
 *
 * Determinizm: brak Math.random/Date.now — wyłącznie przekazany `rand()`, wołany w ustalonej
 * kolejności (masy sortowane deterministycznie, potem seedy, potem kroki spaceru) — ten sam
 * seed = ta sama sekwencja wywołań rand() = identyczny wynik (A=B).
 */
export function growMountainRanges(
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  tier: ReliefDensityTier,
  width: number,
  height: number,
  rand: () => number,
): number {
  const params = mapGenMountainRangeParams(tier);
  const mtnTh = mapGenMountainThreshold(tier);
  const hiTh = mapGenHighlandThreshold(tier);

  const masses = groupLandMassKeys(hexes)
    .filter((m) => m.length >= params.minMasaHexow)
    .sort((a, b) => (b.length - a.length) || (a[0]! < b[0]! ? -1 : a[0]! > b[0]! ? 1 : 0));

  /** Klucze przekonwertowane PRZEZ TĘ funkcję — do sanity-cap na końcu (reszta reliefu nietknięta). */
  const addedByThisRun: Array<{ k: string; n: number; wasHighland: boolean; prev: TerenBazowy }> = [];

  for (const mass of masses) {
    const nRanges = Math.min(
      params.maxPasmNaMase,
      Math.max(1, Math.round(mass.length / params.hexyNaPasmo)),
    );
    const seedCandidates = mountainRangeSeedCandidates(mass, hexes, scratch, width, height, rand);
    if (seedCandidates.length === 0) continue;
    const seeds = pickSpreadReliefKeys(seedCandidates, nRanges, 5);

    for (const seedKey of seeds) {
      const len = params.dlugoscMin
        + Math.floor(rand() * (params.dlugoscMax - params.dlugoscMin + 1));
      const path = [seedKey, ...walkMountainRange(hexes, scratch, width, height, rand, seedKey, len)];

      const placedThisRange: string[] = [];
      for (const k of path) {
        const hex = hexes[k];
        if (!hex) continue;
        if (hex.terenBazowy === TerenBazowy.Gory || hex.terenBazowy === TerenBazowy.Wzgorza) {
          // Istniejący relief (floor/wcześniejszy przebieg) — nie nadpisuj, ale traktuj jako
          // część kształtu pasma (naturalne zrośnięcie z istniejącym skupiskiem).
          placedThisRange.push(k);
          continue;
        }
        if (
          hex.terenBazowy !== TerenBazowy.Laka
          && hex.terenBazowy !== TerenBazowy.Rownina
          && hex.terenBazowy !== TerenBazowy.Pustynia
        ) {
          continue;
        }
        const n = scratch.get(k)?.mtnNoise ?? 0;
        if (n > mtnTh) {
          addedByThisRun.push({ k, n, wasHighland: false, prev: hex.terenBazowy });
          hex.terenBazowy = TerenBazowy.Gory;
          hex.nakladka = Nakladka.Brak;
          delete (hex as HexWithZloze).zloze;
          placedThisRange.push(k);
        } else if (n > hiTh) {
          addedByThisRun.push({ k, n, wasHighland: true, prev: hex.terenBazowy });
          hex.terenBazowy = TerenBazowy.Wzgorza;
          hex.nakladka = Nakladka.Brak;
          delete (hex as HexWithZloze).zloze;
          placedThisRange.push(k);
        }
        // poniżej hiTh: heks zostaje niezmieniony — naturalna "przerwa" w paśmie.
      }

      // ZADANIE 3 (2026-07-20): obrzeże pasma (foothills) — sąsiedzi rdzenia/wzgórz jeszcze nie
      // będący reliefem → Wzgórza, ale TYLKO z prawdopodobieństwem params.obrzezeSzansa (< 1.0).
      // Dawniej ZAWSZE (100%) — stąd okrągłe „plamy"; niższa szansa daje węższe, wydłużone
      // łańcuchy (kordyliery), bo halo wokół grzbietu jest cieńsze/bardziej dziurawe.
      // rand() wołany deterministycznie dla KAŻDEGO kwalifikującego się kandydata (ta sama
      // kolejność co reszta pętli po masach/seedach/krokach) — A=B zostaje.
      for (const k of placedThisRange) {
        const { q, r } = parseHexKey(k);
        for (const [dq, dr] of HEX_DIRECTIONS) {
          const nq = q + dq;
          const nr = r + dr;
          const nk = hexKey(nq, nr);
          const nhex = hexes[nk];
          if (!nhex) continue;
          if (nhex.terenBazowy === TerenBazowy.Gory || nhex.terenBazowy === TerenBazowy.Wzgorza) continue;
          if (
            nhex.terenBazowy !== TerenBazowy.Laka
            && nhex.terenBazowy !== TerenBazowy.Rownina
            && nhex.terenBazowy !== TerenBazowy.Pustynia
          ) continue;
          if (!isReliefCandidateHex(nhex, nq, nr, width, height)) continue;
          if (rand() >= params.obrzezeSzansa) continue;
          const n = scratch.get(nk)?.mtnNoise ?? 0;
          addedByThisRun.push({ k: nk, n, wasHighland: true, prev: nhex.terenBazowy });
          nhex.terenBazowy = TerenBazowy.Wzgorza;
          nhex.nakladka = Nakladka.Brak;
          delete (nhex as HexWithZloze).zloze;
        }
      }
    }
  }

  // Sanity-cap ~40% górzystości lądu. Krok 1: cofamy TO, CO DOŁOŻYŁA TA FUNKCJA (obrzeże/
  // Wzgórza najpierw, od najsłabszego mtnNoise) — floor i wcześniejszy relief nietknięte.
  const { land } = countLandSeaHexes(hexes);
  const capCount = Math.floor(land * MOUNTAIN_RANGE_LAND_SHARE_CAP);
  let mountainous = 0;
  for (const hex of Object.values(hexes)) {
    if (hex.terenBazowy === TerenBazowy.Gory || hex.terenBazowy === TerenBazowy.Wzgorza) mountainous++;
  }
  if (mountainous > capCount && addedByThisRun.length > 0) {
    const revertOrder = [...addedByThisRun].sort((a, b) => {
      if (a.wasHighland !== b.wasHighland) return a.wasHighland ? -1 : 1; // Wzgórza/obrzeże najpierw
      return a.n - b.n; // najsłabszy szum najpierw
    });
    for (const item of revertOrder) {
      if (mountainous <= capCount) break;
      const hex = hexes[item.k];
      if (!hex) continue;
      if (hex.terenBazowy !== TerenBazowy.Gory && hex.terenBazowy !== TerenBazowy.Wzgorza) continue;
      hex.terenBazowy = item.prev;
      mountainous--;
    }
  }

  // Krok 2 (rzadki fallback): jeśli baza SPRZED tej funkcji (reapplyLandTerrain budget +
  // ensureReliefGridCoverage floor/bonus) już sama przebija ~40% (np. pangea + relief=high —
  // zmierzone empirycznie ≈43%), krok 1 nie ma czego cofać (addedByThisRun wyczerpane). Domykamy
  // globalnym przycięciem najsłabszego szumu (Wzgórza przed Górami), ale NIGDY poniżej floor
  // fair-play (MIN_MOUNTAINS_IRON_CELL/MIN_HIGHLANDS_COPPER_CELL na komórkę żelaza/miedzi —
  // ensureReliefGridCoverage "zostaje nietknięte").
  if (mountainous > capCount) {
    const ironSize = ironCoverageCellSize(tier);
    const copperSize = copperCoverageCellSize(tier);
    const ironCellCount = new Map<string, number>();
    const copperCellCount = new Map<string, number>();
    const cellIdOf = (q: number, r: number, size: number) =>
      `${Math.floor(q / size)},${Math.floor(r / size)}`;
    const allRelief: Array<{ k: string; q: number; r: number; n: number; isHighland: boolean }> = [];
    for (const [k, hex] of Object.entries(hexes)) {
      if (hex.terenBazowy !== TerenBazowy.Gory && hex.terenBazowy !== TerenBazowy.Wzgorza) continue;
      const { q, r } = parseHexKey(k);
      const isHighland = hex.terenBazowy === TerenBazowy.Wzgorza;
      if (isHighland) {
        const ck = cellIdOf(q, r, copperSize);
        copperCellCount.set(ck, (copperCellCount.get(ck) ?? 0) + 1);
      } else {
        const ck = cellIdOf(q, r, ironSize);
        ironCellCount.set(ck, (ironCellCount.get(ck) ?? 0) + 1);
      }
      allRelief.push({ k, q, r, n: scratch.get(k)?.mtnNoise ?? 0, isHighland });
    }
    allRelief.sort((a, b) => {
      if (a.isHighland !== b.isHighland) return a.isHighland ? -1 : 1; // Wzgórza przed Górami
      return a.n - b.n; // najsłabszy szum najpierw
    });
    for (const item of allRelief) {
      if (mountainous <= capCount) break;
      const hex = hexes[item.k];
      if (!hex) continue;
      if (item.isHighland) {
        const ck = cellIdOf(item.q, item.r, copperSize);
        const cnt = copperCellCount.get(ck) ?? 0;
        if (cnt <= MIN_HIGHLANDS_COPPER_CELL) continue; // floor — nie schodzimy niżej
        hex.terenBazowy = TerenBazowy.Rownina;
        hex.nakladka = Nakladka.Brak;
        delete (hex as HexWithZloze).zloze;
        copperCellCount.set(ck, cnt - 1);
      } else {
        const ck = cellIdOf(item.q, item.r, ironSize);
        const cnt = ironCellCount.get(ck) ?? 0;
        if (cnt <= MIN_MOUNTAINS_IRON_CELL) continue; // floor — nie schodzimy niżej
        // Rownina (nie Wzgorza) — Wzgorza nadal liczyłoby się do "mountainous" i nie
        // zmniejszyłoby udziału górzystości, którego pilnuje ten sanity-cap.
        hex.terenBazowy = TerenBazowy.Rownina;
        hex.nakladka = Nakladka.Brak;
        delete (hex as HexWithZloze).zloze;
        ironCellCount.set(ck, cnt - 1);
      }
      mountainous--;
    }
  }

  return addedByThisRun.length;
}

export function assignContinentIndices(
  width: number,
  height: number,
  centers: ContinentCenter[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      const nq = q / Math.max(1, width - 1);
      const nr = r / Math.max(1, height - 1);
      map.set(hexKey(q, r), nearestContinentZoneIndex(nq, nr, centers));
    }
  }
  return map;
}

function parseHexKey(key: string): { q: number; r: number } {
  const parts = key.split(',');
  return { q: Number(parts[0]), r: Number(parts[1]) };
}

function sortLandKeysForErosion(
  keys: string[],
  hexes: Record<string, Hex>,
  landScores: Map<string, number>,
  width: number,
  height: number,
): string[] {
  return [...keys].sort((a, b) => {
    const pa = parseHexKey(a);
    const pb = parseHexKey(b);
    const ba = hexBorderDistance(pa.q, pa.r, width, height);
    const bb = hexBorderDistance(pb.q, pb.r, width, height);
    if (ba !== bb) return ba - bb;
    const ca = mapCenterDistanceNorm(pa.q, pa.r, width, height);
    const cb = mapCenterDistanceNorm(pb.q, pb.r, width, height);
    if (Math.abs(ca - cb) > 0.015) return cb - ca;
    const na = countMorseNeighbors(hexes, pa.q, pa.r);
    const nb = countMorseNeighbors(hexes, pb.q, pb.r);
    if (na !== nb) return nb - na;
    const ra = erodeTerrainRank(hexes[a]!.terenBazowy);
    const rb = erodeTerrainRank(hexes[b]!.terenBazowy);
    if (ra !== rb) return ra - rb;
    return (landScores.get(a) ?? 0) - (landScores.get(b) ?? 0);
  });
}

/** Czy teren bazowy jest ladem nadajacym sie pod osadnika (Laka/Rownina/Wzgorza/Pustynia)? */
export function isLandTerrain(tb: TerenBazowy): boolean {
  return (
    tb === TerenBazowy.Laka ||
    tb === TerenBazowy.Rownina ||
    tb === TerenBazowy.Wzgorza ||
    tb === TerenBazowy.Pustynia
  );
}

/**
 * ZADANIE 1 (2026-07-20, Q1=A): mimo nazwy historycznej, Wybrzeże jest teraz traktowane
 * konsekwentnie jak WODA (spójne z ruchem/miastami/AI/wioskami/złożami/renderem, które już
 * dawno tak je traktowały) — TYLKO suchy ląd (Łąka/Równina/Wzgórza/Góry/Pustynia) zwraca true.
 * Nazwa zostaje (minimalny diff, funkcja eksportowana) — semantyka zmieniona świadomie.
 */
export function isLandOrCoast(tb: TerenBazowy): boolean {
  return tb !== TerenBazowy.Morze && tb !== TerenBazowy.Wybrzeze;
}

/** Domyślny udział lądu (0–1) per typ świata; nadpisywalny suwakiem zaawansowanym. Maciej 2026-07-04. */
export function defaultLandFractionForTyp(typ: TypSwiata): number {
  switch (typ) {
    case 'pangea': return 0.60;
    case 'kontynenty': return 0.30;
    case 'wyspy': return 0.50;
    case 'ziemia': return 0.21;
    default: return 0.30;
  }
}

/**
 * Liczba heksów lądu (suchy ląd) vs morza. ZADANIE 1: Wybrzeże liczy się teraz jako WODA
 * (jak Morze) — konsekwencja reklasyfikacji Q1=A.
 */
export function countLandSeaHexes(hexes: Record<string, Hex>): { land: number; sea: number; total: number } {
  let land = 0;
  let sea = 0;
  for (const h of Object.values(hexes)) {
    if (h.terenBazowy === TerenBazowy.Morze || h.terenBazowy === TerenBazowy.Wybrzeze) sea++;
    else land++;
  }
  return { land, sea, total: land + sea };
}

/** Priorytet usuwania lądu przy balansie — najpierw plaża, na końcu góry. */
const ERODE_TERRAIN_ORDER: TerenBazowy[] = [
  TerenBazowy.Wybrzeze,
  TerenBazowy.Laka,
  TerenBazowy.Pustynia,
  TerenBazowy.Rownina,
  TerenBazowy.Wzgorza,
  TerenBazowy.Gory,
];

function erodeTerrainRank(tb: TerenBazowy): number {
  const i = ERODE_TERRAIN_ORDER.indexOf(tb);
  return i >= 0 ? i : ERODE_TERRAIN_ORDER.length;
}

/** ZADANIE 1: Wybrzeże liczy się jak woda (Morze) — nie tylko Morze samo. */
function countMorseNeighbors(hexes: Record<string, Hex>, q: number, r: number): number {
  let n = 0;
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nh = hexes[hexKey(q + dq, r + dr)];
    if (nh?.terenBazowy === TerenBazowy.Morze || nh?.terenBazowy === TerenBazowy.Wybrzeze) n++;
  }
  return n;
}

/** ZADANIE 1: ląd = suchy ląd (bez Wybrzeża, które jest teraz wodą). */
function countLandNeighbors(hexes: Record<string, Hex>, q: number, r: number): number {
  let n = 0;
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nh = hexes[hexKey(q + dq, r + dr)];
    if (nh && nh.terenBazowy !== TerenBazowy.Morze && nh.terenBazowy !== TerenBazowy.Wybrzeze) n++;
  }
  return n;
}

function isCoastalLandHex(hexes: Record<string, Hex>, q: number, r: number): boolean {
  const h = hexes[hexKey(q, r)];
  if (!h || h.terenBazowy === TerenBazowy.Morze || h.terenBazowy === TerenBazowy.Wybrzeze) return false;
  return countMorseNeighbors(hexes, q, r) > 0;
}

function isCoastalMorseHex(hexes: Record<string, Hex>, q: number, r: number): boolean {
  const h = hexes[hexKey(q, r)];
  if (h?.terenBazowy !== TerenBazowy.Morze && h?.terenBazowy !== TerenBazowy.Wybrzeze) return false;
  return countLandNeighbors(hexes, q, r) > 0;
}

function setHexToMorze(hex: Hex): void {
  hex.terenBazowy = TerenBazowy.Morze;
  hex.nakladka = Nakladka.Brak;
  hex.rzeka = { obecna: false, krawedzie: [] };
  delete (hex as HexWithZloze).zloze;
}

function setHexToLaka(hex: Hex): void {
  hex.terenBazowy = TerenBazowy.Laka;
  hex.nakladka = Nakladka.Brak;
  delete (hex as HexWithZloze).zloze;
}

/**
 * Wymusza szablon Ziemi — poza maską zawsze morze (decyzja A, mockup Macieja).
 */
export function enforceEarthTemplateOnHexes(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
): number {
  let fixed = 0;
  for (const [key, hex] of Object.entries(hexes)) {
    const { q, r } = parseHexKey(key);
    if (earthTemplateLandAt(q, r, width, height) > 0) continue;
    if (hex.terenBazowy === TerenBazowy.Morze) continue;
    setHexToMorze(hex);
    fixed++;
  }
  return fixed;
}

/**
 * Dopasowuje udział lądu vs morze wg rankingu maski lądu (z generatora).
 * Morse → Laka (najwyższy score); Laka/Wybrzeże → Morse (najniższy score, najpierw plaża).
 */
export function applyLandFractionByScore(
  hexes: Record<string, Hex>,
  landScores: Map<string, number>,
  targetLandFraction: number,
  width?: number,
  height?: number,
): number {
  const clamped = Math.max(0.15, Math.min(0.85, targetLandFraction));
  const keys = Object.keys(hexes);
  const total = keys.length;
  const targetLand = Math.round(total * clamped);
  let { land } = countLandSeaHexes(hexes);
  let adjusted = 0;
  const hasBorder = width != null && height != null && width > 0 && height > 0;
  const borderOk = (k: string) => {
    if (!hasBorder) return true;
    const { q, r } = parseHexKey(k);
    return !isInMapBorder(q, r, width!, height!);
  };
  const interiorOk = (k: string) => {
    if (!hasBorder) return true;
    const { q, r } = parseHexKey(k);
    return hexBorderDistance(q, r, width!, height!) > MAP_MARGIN_LAND_ZONE_HEXES;
  };

  if (land < targetLand) {
    const morseCandidates = keys
      .filter((k) => hexes[k]!.terenBazowy === TerenBazowy.Morze && borderOk(k))
      .sort((a, b) => {
        const sa = landScores.get(a) ?? 0;
        const sb = landScores.get(b) ?? 0;
        if (Math.abs(sb - sa) > 0.04) return sb - sa;
        const pa = parseHexKey(a);
        const pb = parseHexKey(b);
        const da = hasBorder ? mapCenterDistanceNorm(pa.q, pa.r, width!, height!) : 0;
        const db = hasBorder ? mapCenterDistanceNorm(pb.q, pb.r, width!, height!) : 0;
        return da - db;
      });
    for (const k of morseCandidates) {
      if (land >= targetLand) break;
      setHexToLaka(hexes[k]!);
      land++;
      adjusted++;
    }
    if (land < targetLand && hasBorder) {
      const interiorMorse = keys
        .filter((k) => hexes[k]!.terenBazowy === TerenBazowy.Morze && interiorOk(k))
        .sort((a, b) => (landScores.get(b) ?? 0) - (landScores.get(a) ?? 0));
      for (const k of interiorMorse) {
        if (land >= targetLand) break;
        setHexToLaka(hexes[k]!);
        land++;
        adjusted++;
      }
    }
  } else if (land > targetLand) {
    const landCandidates = sortLandKeysForErosion(
      keys.filter((k) => hexes[k]!.terenBazowy !== TerenBazowy.Morze),
      hexes,
      landScores,
      width ?? 1,
      height ?? 1,
    );
    for (const k of landCandidates) {
      if (land <= targetLand) break;
      setHexToMorze(hexes[k]!);
      land--;
      adjusted++;
    }
  }
  return adjusted;
}

/** Globalny landFraction + strefa brzegowa 2–10 hex + twardy ocean przy krawędzi. */
export function rebalanceLandFractionWithMargins(
  hexes: Record<string, Hex>,
  landScores: Map<string, number>,
  targetLandFraction: number,
  width: number,
  height: number,
): void {
  applyLandFractionByScore(hexes, landScores, targetLandFraction, width, height);
  applyMarginalLandZoneCaps(hexes, landScores, width, height);
  enforceMapBorderOcean(hexes, width, height);
  applyLandFractionByScore(hexes, landScores, targetLandFraction, width, height);
  applyMarginalLandZoneCaps(hexes, landScores, width, height);
  enforceMapBorderOcean(hexes, width, height);
  applyDoubleCoastRing(hexes);
}

/**
 * Dopasowuje udział lądu per kontynent — budżet wg potencjału maski w strefie centrum.
 * Kończy globalną rekonsyliacją (zaokrąglenia).
 */
export function applyLandFractionByContinent(
  hexes: Record<string, Hex>,
  landScores: Map<string, number>,
  continentOf: Map<string, number>,
  nContinents: number,
  targetLandFraction: number,
  width?: number,
  height?: number,
): number {
  const clamped = Math.max(0.15, Math.min(0.85, targetLandFraction));
  const total = Object.keys(hexes).length;
  const targetLand = Math.round(total * clamped);
  const zoneKeys: string[][] = Array.from({ length: nContinents }, () => []);
  for (const k of Object.keys(hexes)) {
    const raw = continentOf.get(k) ?? 0;
    const ci = Math.min(nContinents - 1, Math.max(0, raw));
    zoneKeys[ci]!.push(k);
  }
  const scoreSums = zoneKeys.map((keys) =>
    keys.reduce((s, k) => s + (landScores.get(k) ?? 0), 0),
  );
  const totalScore = scoreSums.reduce((a, b) => a + b, 0) || 1;

  let assigned = 0;
  let adjusted = 0;
  const hasBorder = width != null && height != null && width > 0 && height > 0;
  const borderOk = (k: string) => {
    if (!hasBorder) return true;
    const { q, r } = parseHexKey(k);
    return !isInMapBorder(q, r, width!, height!);
  };
  for (let ci = 0; ci < nContinents; ci++) {
    const keys = zoneKeys[ci]!;
    const quota = ci === nContinents - 1
      ? targetLand - assigned
      : Math.round(targetLand * (scoreSums[ci]! / totalScore));
    assigned += quota;
    let land = keys.filter((k) => hexes[k]!.terenBazowy !== TerenBazowy.Morze).length;

    if (land < quota) {
      const morseCandidates = keys
        .filter((k) => hexes[k]!.terenBazowy === TerenBazowy.Morze && borderOk(k))
        .sort((a, b) => {
          const sa = landScores.get(a) ?? 0;
          const sb = landScores.get(b) ?? 0;
          if (Math.abs(sb - sa) > 0.04) return sb - sa;
          const pa = parseHexKey(a);
          const pb = parseHexKey(b);
          const da = hasBorder ? mapCenterDistanceNorm(pa.q, pa.r, width!, height!) : 0;
          const db = hasBorder ? mapCenterDistanceNorm(pb.q, pb.r, width!, height!) : 0;
          return da - db;
        });
      for (const k of morseCandidates) {
        if (land >= quota) break;
        setHexToLaka(hexes[k]!);
        land++;
        adjusted++;
      }
    } else if (land > quota) {
      const landCandidates = sortLandKeysForErosion(
        keys.filter((k) => hexes[k]!.terenBazowy !== TerenBazowy.Morze),
        hexes,
        landScores,
        width ?? 1,
        height ?? 1,
      );
      for (const k of landCandidates) {
        if (land <= quota) break;
        setHexToMorze(hexes[k]!);
        land--;
        adjusted++;
      }
    }
  }

  const { land: finalLand } = countLandSeaHexes(hexes);
  if (finalLand !== targetLand && width != null && height != null) {
    adjusted += applyLandFractionByScore(hexes, landScores, targetLandFraction, width, height);
    adjusted += applyMarginalLandZoneCaps(hexes, landScores, width, height);
    enforceMapBorderOcean(hexes, width, height);
  }
  return adjusted;
}

/**
 * Dopasowuje udział lądu vs morze do `targetLandFraction` (0.15–0.85).
 * Preferuj {@link applyLandFractionByScore} gdy dostępny ranking maski.
 */
export function rebalanceLandSeaRatio(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
  targetLandFraction: number,
): number {
  const clamped = Math.max(0.15, Math.min(0.85, targetLandFraction));
  const total = width * height;
  const targetLand = Math.round(total * clamped);
  let adjusted = 0;
  const maxLayers = Math.ceil(Math.sqrt(total));

  for (let layer = 0; layer < maxLayers; layer++) {
    let { land } = countLandSeaHexes(hexes);
    if (land === targetLand) break;

    if (land < targetLand) {
      const toFill: string[] = [];
      for (let r = 0; r < height; r++) {
        for (let q = 0; q < width; q++) {
          if (!isCoastalMorseHex(hexes, q, r)) continue;
          toFill.push(hexKey(q, r));
        }
      }
      if (toFill.length === 0) break;
      for (const key of toFill) {
        setHexToLaka(hexes[key]!);
        adjusted++;
      }
      land += toFill.length;
      if (land >= targetLand) {
        // Cofnij nadmiar — erozja losowo brzegu (najniższy priorytet).
        while (land > targetLand) {
          let bestKey: string | null = null;
          let bestScore = Infinity;
          for (let r = 0; r < height; r++) {
            for (let q = 0; q < width; q++) {
              if (!isCoastalLandHex(hexes, q, r)) continue;
              const hex = hexes[hexKey(q, r)];
              if (!hex) continue;
              const score = erodeTerrainRank(hex.terenBazowy) * 10
                - countMorseNeighbors(hexes, q, r);
              if (score < bestScore) {
                bestScore = score;
                bestKey = hexKey(q, r);
              }
            }
          }
          if (!bestKey) break;
          setHexToMorze(hexes[bestKey]!);
          land--;
          adjusted++;
        }
        break;
      }
      continue;
    }

    // land > targetLand — jedna warstwa erozji (najpierw wybrzeże / łąki).
    const toErode: string[] = [];
    for (let r = 0; r < height; r++) {
      for (let q = 0; q < width; q++) {
        if (!isCoastalLandHex(hexes, q, r)) continue;
        const hex = hexes[hexKey(q, r)];
        if (!hex) continue;
        if (erodeTerrainRank(hex.terenBazowy) <= 1) {
          toErode.push(hexKey(q, r));
        }
      }
    }
    if (toErode.length === 0) {
      // Głębsza erozja — równiny i wzgórza brzegowe.
      for (let r = 0; r < height; r++) {
        for (let q = 0; q < width; q++) {
          if (!isCoastalLandHex(hexes, q, r)) continue;
          toErode.push(hexKey(q, r));
        }
      }
    }
    if (toErode.length === 0) break;
    for (const key of toErode) {
      if (land <= targetLand) break;
      setHexToMorze(hexes[key]!);
      land--;
      adjusted++;
    }
  }
  return adjusted;
}

/** Suchy ląd — bez morza i wybrzeża (surowce lądowe tylko tutaj; ryby = osobne ulepszenie). */
export function isDryLandTerrain(tb: TerenBazowy): boolean {
  return tb !== TerenBazowy.Morze && tb !== TerenBazowy.Wybrzeze;
}

/**
 * ZADANIE (2026-07-20, korekta regresji „ląd zjadany przez Wybrzeże"): Wybrzeże jest teraz
 * DODATKIEM od strony MORZA, nie konwersją lądu. Suchy ląd NIGDY nie jest tu ruszany — pierścień
 * bierze heksy Morza sąsiadujące z suchym lądem i zamienia JE na Wybrzeże (płytka woda przy
 * brzegu). Efekt widoczny (ląd/kontur) jest identyczny jak dawniej (Wybrzeże nadal siedzi
 * między lądem a Morzem), ale ląd się nie kurczy przy powtórnych wywołaniach w pipeline.
 * Uruchamiaj po każdej zmianie siatki ląd/morze (np. po usunięciu wysepek).
 */
export function applyCoastRing(hexes: Record<string, Hex>): number {
  const toCoast: string[] = [];
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy !== TerenBazowy.Morze) continue;
    const parts = key.split(',');
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nb = hexes[hexKey(q + dq, r + dr)];
      if (nb && isDryLandTerrain(nb.terenBazowy)) {
        toCoast.push(key);
        break;
      }
    }
  }
  for (const key of toCoast) {
    const hex = hexes[key]!;
    hex.terenBazowy = TerenBazowy.Wybrzeze;
    hex.nakladka = Nakladka.Brak;
    delete (hex as HexWithZloze).zloze;
  }
  return toCoast.length;
}

/**
 * D-COAST-2 — podwójny pierścień: ląd → wybrzeże → wybrzeże → (głębsze) morze.
 * Drugi pass: Morze graniczące z (nowym) Wybrzeżem → też Wybrzeże (2 heksy w głąb morza).
 * Ląd nie jest tu w ogóle dotykany — patrz komentarz przy {@link applyCoastRing}.
 */
export function applyDoubleCoastRing(hexes: Record<string, Hex>): number {
  let n = applyCoastRing(hexes);
  const toCoast: string[] = [];
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy !== TerenBazowy.Morze) continue;
    const parts = key.split(',');
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nb = hexes[hexKey(q + dq, r + dr)];
      if (nb?.terenBazowy === TerenBazowy.Wybrzeze) {
        toCoast.push(key);
        break;
      }
    }
  }
  for (const key of toCoast) {
    const hex = hexes[key]!;
    hex.terenBazowy = TerenBazowy.Wybrzeze;
    hex.nakladka = Nakladka.Brak;
    delete (hex as HexWithZloze).zloze;
  }
  return n + toCoast.length;
}

/** Heksy suchego lądu stykającego się z Morzem (naruszenie bufora wybrzeża). */
export function findDryLandTouchingSea(hexes: Record<string, Hex>): string[] {
  const bad: string[] = [];
  for (const [key, hex] of Object.entries(hexes)) {
    if (!isDryLandTerrain(hex.terenBazowy)) continue;
    const parts = key.split(',');
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nb = hexes[hexKey(q + dq, r + dr)];
      if (nb?.terenBazowy === TerenBazowy.Morze) {
        bad.push(key);
        break;
      }
    }
  }
  return bad;
}

/**
 * Usuwa „sieroty" Wybrzeża — heksy Wybrzeże (WODA, ZADANIE 2026-07-20) bez łańcucha
 * sąsiednich Wybrzeży prowadzącego do suchego lądu. Mogą powstać, gdy ląd zniknął w
 * kolejnym przebiegu pipeline (erozja/rebalance) po tym, jak coastify już oznaczył
 * sąsiadujące Morze jako Wybrzeże — wtedy taki znacznik zostaje „osierocony".
 * Prawidłowa plaża: ląd ↔ wybrzeże (opcjonalnie 2. pierścień) ↔ (głębsze) morze.
 * Sierotę cofamy do Morza (NIGDY do lądu — Wybrzeże to woda, nie tworzymy fałszywego lądu).
 */
export function sanitizeCoastHexes(hexes: Record<string, Hex>): number {
  const valid = new Set<string>();
  // BFS zamiast O(n²) while(propagated) — kolejka startuje od heksów Wybrzeże
  // stykających się z suchym lądem, po czym rozlewa „ważność” po sąsiednich
  // heksach Wybrzeże. Zbiór końcowy `valid` jest IDENTYCZNY z domknięciem
  // przechodnim starej pętli (heks jest ważny wtw. istnieje ścieżka sąsiadujących
  // heksów Wybrzeże do jakiegoś ziarna) — tylko liczony w czasie ~liniowym.
  const queue: string[] = [];

  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy !== TerenBazowy.Wybrzeze) continue;
    const parts = key.split(',');
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nb = hexes[hexKey(q + dq, r + dr)];
      if (nb && isDryLandTerrain(nb.terenBazowy)) {
        valid.add(key);
        queue.push(key);
        break;
      }
    }
  }

  while (queue.length > 0) {
    const key = queue.pop()!;
    const parts = key.split(',');
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (valid.has(nk)) continue;
      if (hexes[nk]?.terenBazowy === TerenBazowy.Wybrzeze) {
        valid.add(nk);
        queue.push(nk);
      }
    }
  }

  let fixed = 0;
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy !== TerenBazowy.Wybrzeze) continue;
    if (valid.has(key)) continue;
    // Sierota — brak łańcucha do lądu. Cofamy do Morza (woda), nigdy do lądu.
    setHexToMorze(hex);
    fixed++;
  }
  return fixed;
}

/** Morze połączone z krawędzią mapy (prawdziwy ocean). Eksport: kwalifikacja ujść delty (B0.7). */
export function oceanConnectedWaterKeys(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
): Set<string> {
  const connected = new Set<string>();
  const queue: string[] = [];
  const isOceanWater = (tb: TerenBazowy) =>
    tb === TerenBazowy.Morze || tb === TerenBazowy.Wybrzeze;

  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      if (q !== 0 && r !== 0 && q !== width - 1 && r !== height - 1) continue;
      const key = hexKey(q, r);
      const hex = hexes[key];
      if (!hex || !isOceanWater(hex.terenBazowy)) continue;
      connected.add(key);
      queue.push(key);
    }
  }

  while (queue.length > 0) {
    const key = queue.pop()!;
    const parts = key.split(',');
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      const nh = hexes[nk];
      if (!nh || !isOceanWater(nh.terenBazowy) || connected.has(nk)) continue;
      connected.add(nk);
      queue.push(nk);
    }
  }
  return connected;
}

function oceanConnectedMorseKeys(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
): Set<string> {
  const connected = new Set<string>();
  const queue: string[] = [];

  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      if (q !== 0 && r !== 0 && q !== width - 1 && r !== height - 1) continue;
      const key = hexKey(q, r);
      const hex = hexes[key];
      if (!hex || hex.terenBazowy !== TerenBazowy.Morze) continue;
      connected.add(key);
      queue.push(key);
    }
  }

  while (queue.length > 0) {
    const key = queue.pop()!;
    const parts = key.split(',');
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      const nh = hexes[nk];
      if (!nh || nh.terenBazowy !== TerenBazowy.Morze || connected.has(nk)) continue;
      connected.add(nk);
      queue.push(nk);
    }
  }
  return connected;
}

/**
 * ZADANIE 2 (2026-07-20, uproszczenie): dawniej istniały tu `coastTouchingSeaKeys` i
 * `riverSeaGoalKeys` — „ostrzejszy" cel ujścia (Morze ∪ tylko-Wybrzeże-stykające-Morze),
 * potrzebny WYŁĄCZNIE bo Wybrzeże było kiedyś przechodnie jak ląd w predykatach generatora.
 * Po ZADANIU 1 (Wybrzeże = woda konsekwentnie) cel ujścia to znowu zwyczajnie KAŻDA woda —
 * {@link oceanConnectedWaterKeys} — więc oba wrappery i ich zależność `oceanConnectedMorseKeys`
 * (w tym kontekście) zostały usunięte jako martwy kod. `pathReachesRealSea` (bramka regresji)
 * i `pruneRiversNotReachingRealSea` używają teraz wprost oceanConnectedWaterKeys.
 */

/** Heksy Morze otoczone lądem (artefakt szumu — nie ocean). */
export function findInlandWaterHexes(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
): string[] {
  const ocean = oceanConnectedWaterKeys(hexes, width, height);
  return Object.entries(hexes)
    .filter(([k, h]) => {
      const tb = h.terenBazowy;
      return (tb === TerenBazowy.Morze || tb === TerenBazowy.Wybrzeze) && !ocean.has(k);
    })
    .map(([k]) => k);
}

export function findInlandSeaHexes(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
): string[] {
  const ocean = oceanConnectedMorseKeys(hexes, width, height);
  return Object.entries(hexes)
    .filter(([k, h]) => h.terenBazowy === TerenBazowy.Morze && !ocean.has(k))
    .map(([k]) => k);
}

/**
 * Usuwa zamknięte zbiorniki wody w środku lądu (Morze + odcięte Wybrzeże).
 */
export function removeInlandWaterPools(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
): number {
  const inland = findInlandWaterHexes(hexes, width, height);
  for (const key of inland) {
    const hex = hexes[key]!;
    hex.terenBazowy = TerenBazowy.Laka;
    hex.nakladka = Nakladka.Brak;
    delete (hex as Hex & { zloze?: unknown }).zloze;
  }
  return inland.length;
}

/**
 * Woda zamknięta w lądzie otoczonym pustynią → pustynia (Maciej 2026-07-05).
 * Ostatni pass po finalizeCoast — łapie „oceany” w Saharze.
 */
export function purgeDesertEnclaveWater(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
): number {
  let n = 0;
  for (const key of findInlandWaterHexes(hexes, width, height)) {
    const { q, r } = parseHexKey(key);
    let pustN = 0;
    let dryN = 0;
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nh = hexes[hexKey(q + dq, r + dr)];
      if (!nh || nh.terenBazowy === TerenBazowy.Morze || nh.terenBazowy === TerenBazowy.Wybrzeze) continue;
      dryN++;
      if (nh.terenBazowy === TerenBazowy.Pustynia) pustN++;
    }
    const hex = hexes[key]!;
    const inArid = climateZoneAt(q, r, height) === 'arid';
    hex.terenBazowy = inArid && (pustN >= 2 || (dryN > 0 && pustN >= dryN * 0.4))
      ? TerenBazowy.Pustynia
      : TerenBazowy.Laka;
    hex.nakladka = Nakladka.Brak;
    hex.rzeka = { obecna: false, krawedzie: [] };
    delete (hex as HexWithZloze).zloze;
    n++;
  }
  return n;
}

/**
 * Wypełnia wodę otoczoną lądem (pierścienie wysp, dziury kontynentów).
 * Morse/Wybrzeże z ≥ minLandNeighbors suchych sąsiadów → Łąka.
 */
export function fillEnclosedWaterByLandNeighbors(
  hexes: Record<string, Hex>,
  minLandNeighbors = 5,
): number {
  let total = 0;
  for (let pass = 0; pass < 8; pass++) {
    let n = 0;
    for (const [key, hex] of Object.entries(hexes)) {
      if (hex.terenBazowy !== TerenBazowy.Morze && hex.terenBazowy !== TerenBazowy.Wybrzeze) {
        continue;
      }
      const { q, r } = parseHexKey(key);
      if (countLandNeighbors(hexes, q, r) < minLandNeighbors) continue;
      hex.terenBazowy = TerenBazowy.Laka;
      hex.nakladka = Nakladka.Brak;
      hex.rzeka = { obecna: false, krawedzie: [] };
      delete (hex as HexWithZloze).zloze;
      n++;
    }
    total += n;
    if (n === 0) break;
  }
  return total;
}

/** Agresywne czyszczenie wody w lądzie — kontynenty/wyspy (nie pangea). */
export function purgeInlandWaterForMultiLandTyp(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
): number {
  let n = fillEnclosedWaterByLandNeighbors(hexes, 5);
  n += removeInlandWaterPools(hexes, width, height);
  n += trimEnclosedOceanOnly(hexes, width, height);
  n += fillEnclosedWaterByLandNeighbors(hexes, 4);
  n += removeInlandWaterPools(hexes, width, height);
  return n;
}

/**
 * Poszarpanie brzegów — szum eroduje zatoki i wypycha cypelki na linii ląd–morze.
 * Uruchamiaj po applyLandFraction, przed finalizeCoast.
 */
export function applyJaggedCoastNoise(
  hexes: Record<string, Hex>,
  perm: Uint8Array,
  width: number,
  height: number,
  passes = 2,
): number {
  const noiseScale = 0.28;
  let changed = 0;
  for (let pass = 0; pass < passes; pass++) {
    const toErode: string[] = [];
    const toFill: string[] = [];
    for (let r = 0; r < height; r++) {
      for (let q = 0; q < width; q++) {
        if (isInMapBorder(q, r, width, height)) continue;
        const key = hexKey(q, r);
        const hex = hexes[key];
        if (!hex) continue;
        const coarse = fbm(perm, q * noiseScale + pass * 17, r * noiseScale + pass * 31, 4);
        const fine = fbm(perm, q * noiseScale * 2.1 + 200, r * noiseScale * 2.1 + 200, 3) * 0.35;
        const coast = coarse + fine;
        if (hex.terenBazowy !== TerenBazowy.Morze && isCoastalLandHex(hexes, q, r)) {
          if (coast > 0.68) toErode.push(key);
        } else if (hex.terenBazowy === TerenBazowy.Morze && isCoastalMorseHex(hexes, q, r)) {
          if (coast < 0.32) toFill.push(key);
        }
      }
    }
    for (const key of toErode) {
      setHexToMorze(hexes[key]!);
      changed++;
    }
    for (const key of toFill) {
      setHexToLaka(hexes[key]!);
      changed++;
    }
  }
  return changed;
}

/**
 * Usuwa tylko małe, zamknięte zbiorniki wody w lądzie (szum maski).
 * Duże „morze między kontynentami” zostaje — nie tworzy mostów lądowych.
 */
export function removeSmallInlandWaterPools(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
  maxPoolSize: number,
): number {
  const inlandSet = new Set(findInlandWaterHexes(hexes, width, height));
  const visited = new Set<string>();
  let converted = 0;

  for (const start of inlandSet) {
    if (visited.has(start)) continue;
    const comp: string[] = [];
    const stack = [start];
    visited.add(start);
    while (stack.length > 0) {
      const key = stack.pop()!;
      comp.push(key);
      const parts = key.split(',');
      const q = Number(parts[0]);
      const r = Number(parts[1]);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        if (!inlandSet.has(nk) || visited.has(nk)) continue;
        visited.add(nk);
        stack.push(nk);
      }
    }
    if (comp.length > maxPoolSize) continue;
    for (const key of comp) {
      const hex = hexes[key]!;
      hex.terenBazowy = TerenBazowy.Laka;
      hex.nakladka = Nakladka.Brak;
      delete (hex as Hex & { zloze?: unknown }).zloze;
      converted++;
    }
  }
  return converted;
}

/**
 * Usuwa zamknięte „jeziora-morze” w środku lądu (doliny szumu między górami).
 * Alias — deleguje do removeInlandWaterPools (Morze + Wybrzeże).
 */
export function removeInlandSeaPools(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
): number {
  return removeInlandWaterPools(hexes, width, height);
}

/** Maks. głębokość zatoki oceanu (w heksach Morse od krawędzi mapy) — musi obejmować bufor brzegu. */
export function maxOceanBayDepth(width: number, height: number): number {
  const border = mapBorderWidth(width, height);
  const scaled = Math.floor(Math.min(width, height) / 6);
  return Math.max(border + 2, Math.min(border + 14, scaled));
}

/**
 * Odległość heksa Morse od krawędzi mapy liczona tylko przez Morse (BFS).
 * Heksy nieosiągalne z brzegu mają undefined (odcięte jeziora / głębokie zatoki do wypełnienia).
 */
export function morseDepthFromMapBorder(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
): Map<string, number> {
  const dist = new Map<string, number>();
  const queue: string[] = [];

  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      const onBorder = q === 0 || r === 0 || q === width - 1 || r === height - 1;
      if (!onBorder) continue;
      const key = hexKey(q, r);
      const hex = hexes[key];
      if (hex?.terenBazowy !== TerenBazowy.Morze) continue;
      dist.set(key, 0);
      queue.push(key);
    }
  }

  let head = 0;
  while (head < queue.length) {
    const key = queue[head++]!;
    const d = dist.get(key)!;
    const parts = key.split(',');
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (dist.has(nk)) continue;
      const nh = hexes[nk];
      if (nh?.terenBazowy !== TerenBazowy.Morze) continue;
      dist.set(nk, d + 1);
      queue.push(nk);
    }
  }
  return dist;
}

/**
 * Usuwa morze odcięte od oceanu (BFS od brzegu mapy) — bez wpływu na otwarte zatoki.
 */
export function trimEnclosedOceanOnly(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
): number {
  const depth = morseDepthFromMapBorder(hexes, width, height);
  let converted = 0;
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy !== TerenBazowy.Morze) continue;
    if (depth.has(key)) continue;
    hex.terenBazowy = TerenBazowy.Laka;
    hex.nakladka = Nakladka.Brak;
    hex.rzeka = { obecna: false, krawedzie: [] };
    delete (hex as HexWithZloze).zloze;
    converted++;
  }
  return converted;
}

/**
 * Woda (Morze/Wybrzeże) wciśnięta między góry/wzgórza — zamiana na łąkę.
 * Nie dotyka otwartego oceanu (BFS od brzegu mapy).
 */
export function purgeReliefValleyWater(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
): number {
  const depth = morseDepthFromMapBorder(hexes, width, height);
  let converted = 0;
  for (const hex of Object.values(hexes)) {
    const tb = hex.terenBazowy;
    if (tb !== TerenBazowy.Morze && tb !== TerenBazowy.Wybrzeze) continue;
    const { q, r } = hex.coords;
    const key = hexKey(q, r);
    if (depth.has(key)) continue;

    let reliefNeighbors = 0;
    let dryLandNeighbors = 0;
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nh = hexes[hexKey(q + dq, r + dr)];
      if (!nh || nh.terenBazowy === TerenBazowy.Morze || nh.terenBazowy === TerenBazowy.Wybrzeze) continue;
      dryLandNeighbors++;
      if (nh.terenBazowy === TerenBazowy.Gory || nh.terenBazowy === TerenBazowy.Wzgorza) reliefNeighbors++;
    }
    if (reliefNeighbors >= 2 && dryLandNeighbors >= 3) {
      hex.terenBazowy = TerenBazowy.Laka;
      hex.nakladka = Nakladka.Brak;
      hex.rzeka = { obecna: false, krawedzie: [] };
      delete (hex as HexWithZloze).zloze;
      converted++;
    }
  }
  return converted;
}

/**
 * Kontynenty/pangea: wypełnia odcięte Morse w środku lądu (nieosiągalne z krawędzi mapy).
 * Otwarty ocean (głęboki, ale połączony z brzegiem) zostaje.
 */
export function trimDeepOceanBays(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
  _maxDepth?: number,
): number {
  const depth = morseDepthFromMapBorder(hexes, width, height);
  let converted = 0;

  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy !== TerenBazowy.Morze) continue;
    const d = depth.get(key);
    if (d !== undefined) continue;
    hex.terenBazowy = TerenBazowy.Laka;
    hex.nakladka = Nakladka.Brak;
    hex.rzeka = { obecna: false, krawedzie: [] };
    delete (hex as HexWithZloze).zloze;
    converted++;
  }
  return converted;
}

/**
 * Powtarzalny pipeline: usuń wodę w lądzie → pierścień wybrzeża → sanity plaż.
 * sanitizeCoastHexes potrafi tymczasowo tworzyć Morse — kończymy pętlą.
 */
export function finalizeCoastAndInlandWater(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
  maxPasses = 3,
  opts?: { maxInlandPoolSize?: number },
): void {
  for (let pass = 0; pass < maxPasses; pass++) {
    // Licznik zmian w przebiegu — żaden z tych helperów nie pobiera rand(),
    // więc gdy cały przebieg zmienia 0 heksów, mapa jest w punkcie stałym:
    // kolejne (identyczne) przebiegi też zmieniłyby 0 → wynik BYTE-identyczny,
    // tylko bez redundantnych powtórzeń. Stary warunek stopu zostaje bez zmian.
    let changed = 0;
    if (opts?.maxInlandPoolSize != null) {
      changed += removeSmallInlandWaterPools(hexes, width, height, opts.maxInlandPoolSize);
    } else {
      changed += removeInlandWaterPools(hexes, width, height);
    }
    changed += applyDoubleCoastRing(hexes);
    changed += sanitizeCoastHexes(hexes);
    if (opts?.maxInlandPoolSize != null) {
      changed += removeSmallInlandWaterPools(hexes, width, height, opts.maxInlandPoolSize);
    } else {
      changed += removeInlandWaterPools(hexes, width, height);
    }
    if (
      findInlandWaterHexes(hexes, width, height).length === 0
      && findDryLandTouchingSea(hexes).length === 0
    ) {
      break;
    }
    // Early-exit B2: przebieg nic nie zmienił → punkt stały, dalsze powtórzenia
    // byłyby no-opami (te helpery nie losują). Pomijamy je bez zmiany wyniku.
    if (changed === 0) break;
  }
}

/**
 * Zmiana 2 (Maciej 2026-07-11): grubsze, gładsze wybrzeże — uruchamiane PRZED rzekami,
 * jako OSTATNI krok kształtu lądu/morza (dalej nic nie zdejmuje wybrzeża).
 *
 *  (a) Wygładzenie fałszywych wcięć-ujść: Morze wcinające się w ląd (≥4 sąsiadów
 *      ląd/wybrzeże) → Łąka; iteracyjnie, plus jeden pass pojedynczych wcięć (≥3).
 *      Usuwa zatoczki między heksami morza, które kształtem udają ujście rzeki bez rzeki.
 *  (b) TRWAŁY podwójny (coastWidth) pierścień wybrzeża — min. 2 heksy dookoła lądu.
 *      Reset istniejącego wybrzeża → ląd, potem `coastWidth` pierścieni od Morza, BEZ
 *      sanitizeCoastHexes (który zdejmował 2. pierścień). Dzięki temu pasmo faktycznie
 *      ma coastWidth heksów w finalnej mapie.
 *
 * Determinizm: brak rand(). Ocean-connectivity (oceanConnectedWaterKeys) idzie przez
 * Morze+Wybrzeże, więc rzeka kończąca na wewnętrznym pierścieniu wybrzeża nadal spełnia
 * pathEndsAtSea → „0 rzek bez ujścia" zostaje.
 */
export function thickenCoastAndSmoothInlets(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
  coastWidth = 2,
): number {
  let changed = 0;

  // (a) wygładzenie wcięć — Morze wcięte w ląd (≥4 sąsiadów niebędących Morzem) → Łąka.
  // Zbieżnie (aż 0), bo wypełnienie jednego wcięcia może odsłonić kolejne; brak kaskady
  // zostawiłby świeżo utworzone 1-heksowe kieszenie morza wyglądające jak ujścia rzek.
  // (próg ≥4 — jak fillEnclosedWaterByLandNeighbors w pipeline; ≥3 zwężałoby cieśniny.)
  for (let pass = 0; pass < 12; pass++) {
    const toFill: string[] = [];
    for (const [key, hex] of Object.entries(hexes)) {
      if (hex.terenBazowy !== TerenBazowy.Morze) continue;
      const { q, r } = parseHexKey(key);
      if (isInMapBorder(q, r, width, height)) continue;
      if (countLandNeighbors(hexes, q, r) >= 4) toFill.push(key);
    }
    if (toFill.length === 0) break;
    for (const key of toFill) {
      setHexToLaka(hexes[key]!);
      changed++;
    }
  }
  // po wygładzeniu mogły powstać odcięte kałuże — zamień na ląd
  changed += removeInlandWaterPools(hexes, width, height);

  // (b) reset istniejącego Wybrzeża → Morze (Wybrzeże to WODA, nie ląd — ZADANIE 2026-07-20:
  // ląd się nie kurczy, więc reset musi wracać do wody, nigdy do lądu), potem `coastWidth`
  // pierścieni od Morza w głąb, trwałe (bez sanitizeCoastHexes, który zdejmowałby 2. pierścień).
  for (const hex of Object.values(hexes)) {
    if (hex.terenBazowy === TerenBazowy.Wybrzeze) {
      setHexToMorze(hex);
      changed++;
    }
  }
  for (let ring = 0; ring < coastWidth; ring++) {
    const toCoast: string[] = [];
    for (const [key, hex] of Object.entries(hexes)) {
      if (hex.terenBazowy !== TerenBazowy.Morze) continue;
      const { q, r } = parseHexKey(key);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nb = hexes[hexKey(q + dq, r + dr)];
        if (nb && (isDryLandTerrain(nb.terenBazowy) || nb.terenBazowy === TerenBazowy.Wybrzeze)) {
          toCoast.push(key);
          break;
        }
      }
    }
    if (toCoast.length === 0) break;
    for (const key of toCoast) {
      const hex = hexes[key]!;
      hex.terenBazowy = TerenBazowy.Wybrzeze;
      hex.nakladka = Nakladka.Brak;
      delete (hex as HexWithZloze).zloze;
      changed++;
    }
  }
  return changed;
}

/**
 * ZADANIE 2 / C2 (2026-07-20): spłaszcza POJEDYNCZE heksy Wybrzeże, których kształt (≥5 z 6
 * sąsiadów to Morze — wąski cypel/punkt wybrzeża wcinający się w morze) wygląda jak delta/ujście
 * rzeki (por. computeRiverDeltaHexKeys w mapRenderStyle.ts — prawdziwa delta ujścia to właśnie
 * mały fan Wybrzeża wcinający się w Morze), a NIE MAJĄ żadnej WŁASNEJ krawędzi rzeki
 * (`hex.rzeka.obecna === false`) — więc to przypadkowy artefakt szumu wybrzeża, nie prawdziwe
 * ujście. Musi być wołane PO finalnym oznakowaniu rzek (żeby znać PRAWDZIWE ujścia i nigdy ich
 * nie ruszać). Celowo węższy/ostrzejszy próg niż ogólne czyszczenie thickenCoastAndSmoothInlets
 * (≥4 sąsiadów, część (a) — Morze wcięte w LĄD) — TA funkcja dotyka WYŁĄCZNIE Wybrzeża bez
 * rzeki i tylko najbardziej odosobnionych "punktów" (≥5/6 Morze), żeby nie zwężać prawdziwych,
 * szerszych zatok/cypli. Pojedynczy przebieg (bez iteracji) — unika kaskadowej erozji wybrzeża.
 */
export function flattenFalseCoastalRiverNotches(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
): number {
  const toFlatten: string[] = [];
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy !== TerenBazowy.Wybrzeze) continue;
    if (hex.rzeka?.obecna) continue; // prawdziwe ujście/koryto — nigdy nie ruszamy
    const { q, r } = parseHexKey(key);
    if (isInMapBorder(q, r, width, height)) continue;
    let morzeN = 0;
    for (const [dq, dr] of HEX_DIRECTIONS) {
      if (hexes[hexKey(q + dq, r + dr)]?.terenBazowy === TerenBazowy.Morze) morzeN++;
    }
    if (morzeN >= 5) toFlatten.push(key);
  }
  for (const key of toFlatten) {
    const hex = hexes[key]!;
    hex.terenBazowy = TerenBazowy.Morze;
    hex.nakladka = Nakladka.Brak;
    hex.rzeka = { obecna: false, krawedzie: [] };
    delete (hex as HexWithZloze).zloze;
  }
  return toFlatten.length;
}

/**
 * Usuwa drobne wysepki (szum maski) — zamienia na Morze.
 * Zostawia główną masę lądową; zwraca liczbę usuniętych heksów.
 */
export function removeTinyLandIslands(hexes: Record<string, Hex>, minHexes: number): number {
  const visited = new Set<string>();
  let removed = 0;

  for (const key of Object.keys(hexes)) {
    if (visited.has(key)) continue;
    const h = hexes[key];
    if (!h || !isLandOrCoast(h.terenBazowy)) continue;

    const stack = [key];
    const comp: string[] = [];
    visited.add(key);

    while (stack.length > 0) {
      const cur = stack.pop()!;
      comp.push(cur);
      const parts = cur.split(',');
      const q = Number(parts[0]);
      const r = Number(parts[1]);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        if (visited.has(nk)) continue;
        const nh = hexes[nk];
        if (!nh || !isLandOrCoast(nh.terenBazowy)) continue;
        visited.add(nk);
        stack.push(nk);
      }
    }

    if (comp.length >= minHexes) continue;

    for (const k of comp) {
      const hx = hexes[k];
      if (!hx) continue;
      hx.terenBazowy = TerenBazowy.Morze;
      hx.nakladka = Nakladka.Brak;
      hx.rzeka = { obecna: false, krawedzie: [] };
      delete (hx as HexWithZloze).zloze;
      removed++;
    }
  }

  return removed;
}

/** Min. wielkość wyspy po finalnym wybrzeżu — typ mapy (Maciej: bez pustyni w oceanie). */
export function minTinyIslandHexesForTyp(typ: TypSwiata): number {
  switch (typ) {
    case 'pangea': return 10;
    case 'kontynenty': return 8;
    case 'wyspy': return 4;
    case 'ziemia': return 6;
    default: return 8;
  }
}

/**
 * Suchy ląd bez sąsiada-lądu (tylko morze/wybrzeże/brzeg mapy) — artefakt szumu w oceanie.
 * Po {@link removeTinyLandIslands} powinno być 0.
 */
export function countOpenOceanLandSpecks(hexes: Record<string, Hex>): number {
  let n = 0;
  for (const hex of Object.values(hexes)) {
    if (hex.terenBazowy === TerenBazowy.Morze || hex.terenBazowy === TerenBazowy.Wybrzeze) {
      continue;
    }
    const { q, r } = hex.coords;
    let dryLandNeighbors = 0;
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nh = hexes[hexKey(q + dq, r + dr)];
      if (!nh) continue;
      if (
        nh.terenBazowy !== TerenBazowy.Morze
        && nh.terenBazowy !== TerenBazowy.Wybrzeze
      ) {
        dryLandNeighbors++;
      }
    }
    if (dryLandNeighbors === 0) n++;
  }
  return n;
}

/** Usuwa suchy ląd otoczony wyłącznie morzem/wybrzeżem (pustynia zalana — rdzeń za pierścieniem plaży). */
export function purgeOpenOceanLandSpecks(hexes: Record<string, Hex>): number {
  let removed = 0;
  for (const hex of Object.values(hexes)) {
    if (hex.terenBazowy === TerenBazowy.Morze || hex.terenBazowy === TerenBazowy.Wybrzeze) {
      continue;
    }
    const { q, r } = hex.coords;
    let dryLandNeighbors = 0;
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nh = hexes[hexKey(q + dq, r + dr)];
      if (!nh) continue;
      if (
        nh.terenBazowy !== TerenBazowy.Morze
        && nh.terenBazowy !== TerenBazowy.Wybrzeze
      ) {
        dryLandNeighbors++;
      }
    }
    if (dryLandNeighbors > 0) continue;
    setHexToMorze(hex);
    removed++;
  }
  return removed;
}

/** removeTiny + purgeOpenOcean (w pętli) + finalize wybrzeża. */
export function finalizeLandMassAfterCoast(
  hexes: Record<string, Hex>,
  typ: TypSwiata,
  width: number,
  height: number,
  coastOpts?: { maxInlandPoolSize?: number },
  coastPasses = 2,
): number {
  const minHexes = minTinyIslandHexesForTyp(typ);
  let total = 0;
  for (let pass = 0; pass < 3; pass++) {
    total += removeTinyLandIslands(hexes, minHexes);
    const purged = purgeOpenOceanLandSpecks(hexes);
    total += purged;
    if (purged === 0 && pass > 0) break;
  }
  finalizeCoastAndInlandWater(hexes, width, height, coastPasses, coastOpts);
  enforceMapBorderOcean(hexes, width, height);
  return total;
}

/**
 * Audyt danych mapy: 1 współrzędna = 1 heks = 1 terenBazowy (brak „morza pod lądem” w modelu).
 * Morze otoczone lądem = jezioro/zatoka (OK); openOceanLandSpecks = błąd generatora.
 */
export function auditMapTerrainData(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
): {
  totalHexes: number;
  byTeren: Record<string, number>;
  openOceanLandSpecks: number;
  enclosedInlandMorzeHexes: number;
  enclosedInlandMorzeComponents: number;
} {
  const byTeren: Record<string, number> = {};
  for (const hex of Object.values(hexes)) {
    const k = hex.terenBazowy;
    byTeren[k] = (byTeren[k] ?? 0) + 1;
  }

  const inlandMorse = findInlandSeaHexes(hexes, width, height);
  const inlandSet = new Set(inlandMorse);
  const visited = new Set<string>();
  let enclosedInlandMorzeComponents = 0;
  for (const start of inlandMorse) {
    if (visited.has(start)) continue;
    enclosedInlandMorzeComponents++;
    const stack = [start];
    visited.add(start);
    while (stack.length > 0) {
      const cur = stack.pop()!;
      const parts = cur.split(',');
      const q = Number(parts[0]);
      const r = Number(parts[1]);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        if (visited.has(nk) || !inlandSet.has(nk)) continue;
        visited.add(nk);
        stack.push(nk);
      }
    }
  }

  return {
    totalHexes: Object.keys(hexes).length,
    byTeren,
    openOceanLandSpecks: countOpenOceanLandSpecks(hexes),
    enclosedInlandMorzeHexes: inlandMorse.length,
    enclosedInlandMorzeComponents,
  };
}

// ===========================================================================
// 5. Rzeki — źródła z gór/wzgórz, najkrótsza droga do morza (pole odległości)
// ===========================================================================

/** Ranking wysokosci terenu (nizszy = nizej nad poziomem morza). */
export const ELEVATION_RANK: Record<TerenBazowy, number> = {
  [TerenBazowy.Morze]:    0,
  [TerenBazowy.Wybrzeze]: 1,
  [TerenBazowy.Laka]:     2,
  [TerenBazowy.Pustynia]: 3,
  [TerenBazowy.Rownina]:  4,
  [TerenBazowy.Wzgorza]:  5,
  [TerenBazowy.Gory]:     6,
};

/** Ile rzek na masę lądu — legacy helper (nieużywany przez generateRivers; siatka N×N decyduje). */
export function riversQuotaForLandMass(landHexCount: number, tier: DensityTier = 'medium'): number {
  if (landHexCount < 8) return 0;
  if (landHexCount < 14) return 3;
  const hexPerRiver = tier === 'high' ? 1 : tier === 'low' ? 5 : 2;
  return Math.max(3, Math.round(landHexCount / hexPerRiver));
}

function hexAxialDistance(q1: number, r1: number, q2: number, r2: number): number {
  const dq = q1 - q2;
  const dr = r1 - r2;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

/**
 * W masce lądu Ziemi nie ma oceanu — morze/wybrzeże w środku kontynentu → łąka/pustynia.
 * (applyJaggedCoastNoise i rebalance potrafią zostawić „dziury”; Maciej 2026-07-04)
 */
export function purgeOceanInsideEarthLandMask(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
): number {
  let n = 0;
  for (const [key, hex] of Object.entries(hexes)) {
    const { q, r } = parseHexKey(key);
    if (earthTemplateLandAt(q, r, width, height) <= 0) continue;
    if (hex.terenBazowy !== TerenBazowy.Morze && hex.terenBazowy !== TerenBazowy.Wybrzeze) continue;
    let pustN = 0;
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nh = hexes[hexKey(q + dq, r + dr)];
      if (!nh || nh.terenBazowy === TerenBazowy.Morze || nh.terenBazowy === TerenBazowy.Wybrzeze) continue;
      if (nh.terenBazowy === TerenBazowy.Pustynia) pustN++;
    }
    hex.terenBazowy = climateZoneAt(q, r, height) === 'arid' && pustN >= 2
      ? TerenBazowy.Pustynia
      : TerenBazowy.Laka;
    hex.nakladka = Nakladka.Brak;
    hex.rzeka = { obecna: false, krawedzie: [] };
    delete (hex as HexWithZloze).zloze;
    n++;
  }
  return n;
}

/**
 * ZADANIE (2026-07-20, domknięcie regresji Ziemi po Zmianie 1): odwrotność
 * {@link purgeOceanInsideEarthLandMask} — suchy ląd POZA maską Ziemi. Powstaje jako efekt
 * uboczny heurystyk „domykania zatok" (fillEnclosedWaterByLandNeighbors, trimEnclosedOceanOnly,
 * thickenCoastAndSmoothInlets część (a)) — te funkcje nie znają konturu Ziemi i przy dużej ilości
 * zachowanego lądu (Zmiana 1: ląd się już nie kurczy) potrafią błędnie zalać lądem prawdziwą,
 * wąską zatokę/cieśninę tuż za konturem. Cofamy TYLKO suchy ląd (nigdy nie ruszamy Wybrzeża —
 * pas wybrzeża CELOWO rośnie w głąb morza poza konturem, p. {@link applyCoastRing}). Wołać RAZ,
 * na samym końcu kształtowania lądu/morza (po thickenCoastAndSmoothInlets, przed rzekami) —
 * po tym trzeba odtworzyć POJEDYNCZY pierścień wybrzeża wokół świeżo powstałego Morza
 * ({@link applyCoastRing}, NIE double — reszta wybrzeża ma już pełne coastWidth z
 * thickenCoastAndSmoothInlets, podwójny pierścień pogrubiłby całą linię brzegową o 1 dodatkowy).
 */
export function purgeStrayLandOutsideEarthMask(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
): number {
  let n = 0;
  for (const [key, hex] of Object.entries(hexes)) {
    const { q, r } = parseHexKey(key);
    if (earthTemplateLandAt(q, r, width, height) > 0) continue;
    if (!isDryLandTerrain(hex.terenBazowy)) continue;
    setHexToMorze(hex);
    n++;
  }
  return n;
}

/** Trasa rzeki do renderu lądu — bez morza; naprawa sąsiedztwa hex. */
export function landRiverRenderPath(
  hexes: Record<string, Hex>,
  path: Array<{ q: number; r: number }>,
): Array<{ q: number; r: number }> {
  const land: RiverCoord[] = [];
  for (const p of path) {
    const h = hexes[hexKey(p.q, p.r)];
    if (!h || h.terenBazowy === TerenBazowy.Morze || h.terenBazowy === TerenBazowy.Wybrzeze) break;
    land.push({ q: p.q, r: p.r });
  }
  if (land.length < 2) return land;
  const src = hexKey(land[0]!.q, land[0]!.r);
  const clean = sanitizeRiverPath(land);
  if (assertRiverPathAdjacent(clean)) return clean;
  return repairRiverPathAdjacency(clean, hexes, src);
}

/** Odcinek ujścia: wybrzeże → morze (max kilka hexów), bez skrótu przez mapę. */
export function coastalRiverRenderPath(
  hexes: Record<string, Hex>,
  path: Array<{ q: number; r: number }>,
): Array<{ q: number; r: number }> {
  if (path.length < 2) return [];
  let start = path.length - 1;
  for (let i = path.length - 1; i >= 0; i--) {
    const h = hexes[hexKey(path[i]!.q, path[i]!.r)];
    if (!h) continue;
    if (h.terenBazowy === TerenBazowy.Wybrzeze) {
      start = i;
      break;
    }
    if (h.terenBazowy !== TerenBazowy.Morze && hasLandNeighborTouchingSea(hexes, path[i]!.q, path[i]!.r)) {
      start = i;
      break;
    }
  }
  const out: RiverCoord[] = [];
  for (let i = start; i < path.length; i++) {
    const p = path[i]!;
    const h = hexes[hexKey(p.q, p.r)];
    if (!h || h.terenBazowy === TerenBazowy.Morze) continue;
    out.push({ q: p.q, r: p.r });
  }
  // FIX 2026-07-09 (rzeki dochodzą do morza): generator kończy trasę na heksie SĄSIADUJĄCYM z
  // oceanem (isRiverDrainageGoal), więc ostatni heks bywa LĄDEM stykającym się z morzem, bez
  // Wybrzeża w ścieżce → wtedy out<2 i ujście się nie renderuje (rzeka urywa się przed wodą).
  // ZADANIE 2 / A1 (2026-07-20): pas Wybrzeża ma teraz `coastWidth` (2) heksy — jeden "dopnij"
  // hex by nie zawsze wystarczał (mogła trafić na ZEWNĘTRZNY pierścień, nadal bez styku z
  // Morzem). Dociągamy wstęgę PRZEZ pas (max kilka kroków — pętla ograniczona), aż trafi na
  // Wybrzeże faktycznie stykające się z Morzem (albo skończą się kandydaci). Render-only (bez
  // hasha) — nie zmienia terenu/rzeki, tylko wizualną ścieżkę ujścia.
  if (out.length >= 1) {
    let lp = out[out.length - 1]!;
    let lh = hexes[hexKey(lp.q, lp.r)];
    for (let guard = 0; guard < 4; guard++) {
      if (lh?.terenBazowy === TerenBazowy.Wybrzeze && hasMorzeNeighborForRiverRender(hexes, lp.q, lp.r)) {
        break; // już styka z Morzem — koniec dociągania
      }
      let nextKey: string | null = null;
      let bestScore = -1;
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nq = lp.q + dq;
        const nr = lp.r + dr;
        const nk = hexKey(nq, nr);
        if (out.some((o) => o.q === nq && o.r === nr)) continue;
        const nh = hexes[nk];
        if (nh?.terenBazowy !== TerenBazowy.Wybrzeze) continue;
        const score = hasMorzeNeighborForRiverRender(hexes, nq, nr) ? 1 : 0;
        if (score > bestScore) { bestScore = score; nextKey = nk; }
      }
      if (!nextKey) break;
      const { q: nq, r: nr } = parseHexKey(nextKey);
      out.push({ q: nq, r: nr });
      lp = { q: nq, r: nr };
      lh = hexes[nextKey];
    }
  }
  if (out.length < 2) return out;
  if (start > 0) {
    const prev = path[start - 1]!;
    const ph = hexes[hexKey(prev.q, prev.r)];
    if (ph && ph.terenBazowy !== TerenBazowy.Morze && ph.terenBazowy !== TerenBazowy.Wybrzeze) {
      out.unshift({ q: prev.q, r: prev.r });
    }
  }
  const src = hexKey(out[0]!.q, out[0]!.r);
  return repairRiverPathAdjacency(out, hexes, src);
}

function hasLandNeighborTouchingSea(hexes: Record<string, Hex>, q: number, r: number): boolean {
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nh = hexes[hexKey(q + dq, r + dr)];
    if (nh?.terenBazowy === TerenBazowy.Wybrzeze || nh?.terenBazowy === TerenBazowy.Morze) return true;
  }
  return false;
}

/** Czy (q,r) ma bezpośredniego sąsiada Morze — używane przy dociąganiu wstęgi ujścia (render). */
function hasMorzeNeighborForRiverRender(hexes: Record<string, Hex>, q: number, r: number): boolean {
  for (const [dq, dr] of HEX_DIRECTIONS) {
    if (hexes[hexKey(q + dq, r + dr)]?.terenBazowy === TerenBazowy.Morze) return true;
  }
  return false;
}

/** Każdy krok trasy musi być sąsiedni — inaczej renderer ciąłby linią przez mapę. */
export function assertRiverPathAdjacent(
  path: Array<{ q: number; r: number }>,
): boolean {
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]!;
    const b = path[i]!;
    const dq = a.q - b.q;
    const dr = a.r - b.r;
    const dist = (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
    if (dist !== 1) return false;
  }
  return true;
}

/** Dzieli trasę na ciągłe odcinki sąsiednich hexów (bez skrótów). */
export function splitAdjacentRiverChains(
  path: Array<{ q: number; r: number }>,
): Array<Array<{ q: number; r: number }>> {
  if (path.length < 2) return [];
  const chains: Array<Array<{ q: number; r: number }>> = [];
  let chain: Array<{ q: number; r: number }> = [{ ...path[0]! }];

  for (let i = 1; i < path.length; i++) {
    const prev = chain[chain.length - 1]!;
    const cur = path[i]!;
    const dq = prev.q - cur.q;
    const dr = prev.r - cur.r;
    const dist = (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
    if (dist === 1) {
      chain.push({ ...cur });
    } else {
      if (chain.length >= 2) chains.push(chain);
      chain = [{ ...cur }];
    }
  }
  if (chain.length >= 2) chains.push(chain);
  return chains;
}

/** Usuwa pętle (revisit hex) i kroki niesąsiednie — renderer nie może ciąć przez pole. */
export function sanitizeRiverPath(path: RiverCoord[]): RiverCoord[] {
  if (path.length < 2) return path;
  const out: RiverCoord[] = [{ ...path[0]! }];
  const seen = new Set<string>([hexKey(path[0]!.q, path[0]!.r)]);
  for (let i = 1; i < path.length; i++) {
    const p = path[i]!;
    const k = hexKey(p.q, p.r);
    if (seen.has(k)) continue;
    const prev = out[out.length - 1]!;
    if (hexAxialDistance(prev.q, prev.r, p.q, p.r) !== 1) continue;
    out.push({ ...p });
    seen.add(k);
  }
  return out;
}

/** Uzupełnia luki w trasie rzeki (meandry A* potrafią dać skok >1 hex). */
export function repairRiverPathAdjacency(
  path: RiverCoord[],
  hexes: Record<string, Hex>,
  sourceKey: string,
): RiverCoord[] {
  if (path.length < 2) return path;
  const out: RiverCoord[] = [{ ...path[0]! }];
  const visited = new Set<string>([hexKey(out[0]!.q, out[0]!.r)]);
  for (let i = 1; i < path.length; i++) {
    const target = path[i]!;
    const targetK = hexKey(target.q, target.r);
    let guard = 0;
    while (guard++ < 64) {
      const cur = out[out.length - 1]!;
      const d = hexAxialDistance(cur.q, cur.r, target.q, target.r);
      if (d === 0) break;
      if (d === 1) {
        out.push({ ...target });
        visited.add(targetK);
        break;
      }
      let best: RiverCoord | null = null;
      let bestDist = Infinity;
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nq = cur.q + dq;
        const nr = cur.r + dr;
        const nk = hexKey(nq, nr);
        if (visited.has(nk) && nk !== targetK) continue;
        if (!canRiverFlowThrough(hexes[nk], nk, sourceKey)) continue;
        const nd = hexAxialDistance(nq, nr, target.q, target.r);
        if (nd < bestDist) {
          bestDist = nd;
          best = { q: nq, r: nr };
        }
      }
      if (!best || bestDist >= d) break;
      out.push(best);
      visited.add(hexKey(best.q, best.r));
    }
  }
  return sanitizeRiverPath(out);
}

/** Min. odległość ciała rzeki od morza (Maciej 2026-07-04). Ujście = ostatnie N hex. */
export const RIVER_MIN_INLAND_FROM_SEA = 2;

/** Maciej 2026-07-09 (REGUŁA B): realną długość głównego nurtu wymusza teraz twardy meander
 *  fazy 1 (zob. RIVER_HARD_MEANDER_LEN / growRiverInlandBeforeDrainage), nie ten filtr.
 *  Filtr trzyma tylko próg degeneracji (odrzuca 1-2 hex) — na małej wyspie/ciasnym lądzie
 *  meander może przerwać się wcześniej (brak miejsca) i rzeka MA prawo być krótsza niż dawne 8. */
export const RIVER_MIN_MAIN_LEN = 3;

/** REGUŁA B (Maciej 2026-07-09): przez pierwsze tyle kroków fazy 1 meander jest TWARDY —
 *  kandydat zbliżający się do morza (od < curOd) jest odrzucany, dopóki path.length < ten próg.
 *  Cel: „najpierw meander w głąb, potem do morza" zamiast ciągnięcia do oceanu od 1. kroku. */
export const RIVER_HARD_MEANDER_LEN = 8;

/** Ostatnie N hex trasy — szybkie połączenie z morzem (Maciej 2026-07-05: 5). */
export const RIVER_MOUTH_TAIL_LEN = 5;

/** Ciało trasy (bez ujścia) musi trzymać bufor od morza — ujście w ostatnich RIVER_MOUTH_TAIL_LEN hex. */
export function riverPathRespectsSeaBuffer(
  hexes: Record<string, Hex>,
  path: RiverCoord[],
  seaDist: Map<string, number>,
  minInland = RIVER_MIN_INLAND_FROM_SEA,
  mouthTail = RIVER_MOUTH_TAIL_LEN,
): boolean {
  if (path.length === 0) return false;
  const bodyEnd = Math.max(0, path.length - mouthTail);
  for (let i = 0; i < bodyEnd; i++) {
    const p = path[i]!;
    const h = hexes[hexKey(p.q, p.r)];
    if (!h || h.terenBazowy === TerenBazowy.Morze) return false;
    if ((seaDist.get(hexKey(p.q, p.r)) ?? 0) < minInland) return false;
  }
  return true;
}

/** Czy krok drenażu dozwolony po fazie lądowej (bufor 2 hex; w korytarzu ujścia od ≤5 do oceanu). */
function canRiverDrainStep(
  nk: string,
  nd: number,
  openOceanDist: Map<string, number>,
  oceanConnected: Set<string>,
  postInlandPhase: boolean,
): boolean {
  if (oceanConnected.has(nk)) return true;
  const od = openOceanDist.get(nk);
  if (od == null) return false;
  if (!postInlandPhase) return nd >= RIVER_MIN_INLAND_FROM_SEA;
  if (nd >= RIVER_MIN_INLAND_FROM_SEA) return true;
  return od <= RIVER_MOUTH_TAIL_LEN;
}

function isRiverDrainageGoal(
  q: number,
  r: number,
  _seaDist: Map<string, number>,
  hexes: Record<string, Hex>,
  sourceKey: string,
  oceanConnected: Set<string>,
): boolean {
  const k = hexKey(q, r);
  if (oceanConnected.has(k)) return true;
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nk = hexKey(q + dq, r + dr);
    if (!oceanConnected.has(nk)) continue;
    if (canRiverFlowThrough(hexes[nk], nk, sourceKey)) return true;
  }
  return false;
}

/** Odległość (w heksach) do najbliższego Morza / Wybrzeża — BFS od brzegu. */
export function buildSeaDistanceField(hexes: Record<string, Hex>): Map<string, number> {
  const dist = new Map<string, number>();
  const queue: string[] = [];
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy === TerenBazowy.Morze || hex.terenBazowy === TerenBazowy.Wybrzeze) {
      dist.set(key, 0);
      queue.push(key);
    }
  }
  let qi = 0;
  while (qi < queue.length) {
    const key = queue[qi++]!;
    const d = dist.get(key)!;
    const { q, r } = parseHexKey(key);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (dist.has(nk)) continue;
      if (!hexes[nk]) continue;
      dist.set(nk, d + 1);
      queue.push(nk);
    }
  }
  return dist;
}

/** Odległość do oceanu połączonego z krawędzią mapy (nie jeziora w lądzie). */
export function buildOpenOceanDistanceField(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
  oceanConnected?: Set<string>,
): Map<string, number> {
  const ocean = oceanConnected ?? oceanConnectedWaterKeys(hexes, width, height);
  const dist = new Map<string, number>();
  const queue: string[] = [];
  for (const key of ocean) {
    dist.set(key, 0);
    queue.push(key);
  }
  let qi = 0;
  while (qi < queue.length) {
    const key = queue[qi++]!;
    const d = dist.get(key)!;
    const { q, r } = parseHexKey(key);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (dist.has(nk)) continue;
      if (!hexes[nk]) continue;
      dist.set(nk, d + 1);
      queue.push(nk);
    }
  }
  return dist;
}

function inferMapDimsFromHexes(hexes: Record<string, Hex>): { width: number; height: number } {
  let maxQ = 0;
  let maxR = 0;
  for (const key of Object.keys(hexes)) {
    const { q, r } = parseHexKey(key);
    if (q > maxQ) maxQ = q;
    if (r > maxR) maxR = r;
  }
  return { width: maxQ + 1, height: maxR + 1 };
}

function isReliefRiverSource(t: TerenBazowy): boolean {
  return t === TerenBazowy.Gory || t === TerenBazowy.Wzgorza;
}

/** Czy trasa kończy przy otwartym oceanie (nie w zamkniętym jeziorze). */
export function pathEndsAtSea(
  hexes: Record<string, Hex>,
  path: Array<{ q: number; r: number }>,
  width?: number,
  height?: number,
  oceanConnected?: Set<string>,
): boolean {
  if (path.length === 0) return false;
  const dims = width != null && height != null
    ? { width, height }
    : inferMapDimsFromHexes(hexes);
  const ocean = oceanConnected ?? oceanConnectedWaterKeys(hexes, dims.width, dims.height);
  const last = path[path.length - 1]!;
  const lk = hexKey(last.q, last.r);
  if (ocean.has(lk)) return true;
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nk = hexKey(last.q + dq, last.r + dr);
    if (ocean.has(nk)) return true;
  }
  return false;
}

export interface TraceRiverOpts {
  seaDist?: Map<string, number>;
  openOceanDist?: Map<string, number>;
  oceanConnected?: Set<string>;
  mapWidth?: number;
  mapHeight?: number;
  rand?: () => number;
  minLen?: number;
}

type RiverCoord = { q: number; r: number };

/** Rzeka może startować na górze/wzgórzu, ale dalej płynie tylko niziną (opływa relief). */
function isReliefTerrain(t: TerenBazowy): boolean {
  return t === TerenBazowy.Gory || t === TerenBazowy.Wzgorza;
}

/**
 * Konfluencje zamiast krzyżowań (Właściciel 2026-07-10): gdy trasowanie szuka WŁASNEJ drogi
 * (do morza / meander / dopływ-do-celu), nie wolno jej PRZEJŚĆ przez heks NALEŻĄCY DO INNEJ,
 * już ułożonej rzeki — inaczej dwie niezależne rzeki renderują się jako dwie krzyżujące się
 * wstęgi na tym samym heksie (każda po swoich własnych kątach wejścia/wyjścia) zamiast się
 * złączyć w jednym punkcie. `blockExisting=true` włącza tę regułę; `allowKey` to wyjątek —
 * zamierzony hex-cel dopływu/feedera (konkretny węzeł sieci, do którego CELOWO dołączamy —
 * on już ma rzeka.obecna=true, to nie przypadkowe skrzyżowanie, tylko planowana konfluencja).
 * Domyślnie (blockExisting=false) zachowanie identyczne jak wcześniej — wszystkie inne wywołania
 * (repair/gap-fill, test sąsiedztwa celu) nie są dotknięte.
 */
function canRiverFlowThrough(
  hex: Hex | undefined,
  cellKey: string,
  sourceKey: string,
  blockExisting = false,
  allowKey?: string,
): boolean {
  if (!hex || hex.terenBazowy === TerenBazowy.Morze) return false;
  if (isReliefTerrain(hex.terenBazowy)) return cellKey === sourceKey;
  if (blockExisting && hex.rzeka?.obecna && cellKey !== allowKey) return false;
  return true;
}

function riverStepDir(from: RiverCoord, to: RiverCoord): [number, number] {
  return [to.q - from.q, to.r - from.r];
}

function sameRiverDir(a: [number, number], b: [number, number]): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

function reconstructRiverPath(
  cameFrom: Map<string, string>,
  endK: string,
): RiverCoord[] {
  const path: RiverCoord[] = [];
  let cur: string | undefined = endK;
  while (cur) {
    const { q, r } = parseHexKey(cur);
    path.push({ q, r });
    cur = cameFrom.get(cur);
  }
  path.reverse();
  return path;
}

/** Faza 1 (Maciej): min. N hex, bufor 2 od morza, ale kierunek w stronę oceanu. */
function growRiverInlandBeforeDrainage(
  hexes: Record<string, Hex>,
  sq: number,
  sr: number,
  seaDist: Map<string, number>,
  openOceanDist: Map<string, number>,
  rand: () => number,
  inlandTargetLen: number,
  stepCap: number,
): RiverCoord[] {
  const srcKey = hexKey(sq, sr);
  const path: RiverCoord[] = [{ q: sq, r: sr }];
  const visited = new Set<string>([srcKey]);

  while (path.length < inlandTargetLen && path.length < stepCap) {
    const cur = path[path.length - 1]!;
    const curKey = hexKey(cur.q, cur.r);
    const curD = seaDist.get(curKey) ?? 0;
    const curOd = openOceanDist.get(curKey) ?? Infinity;
    // REGUŁA B (Maciej 2026-07-09): przez pierwsze RIVER_HARD_MEANDER_LEN kroków meander jest
    // twardy — kandydat zbliżający się do morza (od < curOd) jest odrzucony NIŻEJ, przed rand(),
    // więc nie zużywa losowania (ta sama liczba wywołań rand() na przepuszczonego kandydata: 1).
    const hardMeander = path.length < RIVER_HARD_MEANDER_LEN;
    const candidates: Array<{ q: number; r: number; score: number }> = [];

    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nq = cur.q + dq;
      const nr = cur.r + dr;
      const nk = hexKey(nq, nr);
      if (visited.has(nk)) continue; // brak samoprzecięcia
      // blockExisting: nie wchodź na heks innej, już ułożonej rzeki (konfluencje, nie krzyżowania).
      if (!canRiverFlowThrough(hexes[nk], nk, srcKey, true)) continue; // brak morza/poza mapą (poza źródłem-reliefem)
      const nd = seaDist.get(nk) ?? 0;
      if (nd < RIVER_MIN_INLAND_FROM_SEA) continue;
      const od = openOceanDist.get(nk) ?? Infinity;
      if (hardMeander && od < curOd) continue; // twardy meander: nie zbliżaj się do morza
      let score = 1200 - od * 30;
      if (od > curOd + 0.5) score -= 18;
      if (nd > curD + 1) score -= 10;
      if (nd === RIVER_MIN_INLAND_FROM_SEA && od < curOd) score += 8;
      score += rand() * 0.35;
      candidates.push({ q: nq, r: nr, score });
    }

    // Mała wyspa / brak miejsca: twardy meander nie ma dokąd iść — przerwij (NIE luzuj filtra),
    // faza 2 (aStarRiverToSea w traceRiver) dokończy do morza; rzeka będzie krótsza niż 8 — OK.
    if (candidates.length === 0) break;
    candidates.sort((a, b) => b.score - a.score);
    const pickIdx = Math.min(candidates.length - 1, Math.floor(rand() * Math.min(3, candidates.length)));
    const pick = candidates[pickIdx] ?? candidates[0]!;
    path.push({ q: pick.q, r: pick.r });
    visited.add(hexKey(pick.q, pick.r));
  }
  return path;
}

/** Faza 2 (szybka): zjazd w dół openOceanDist — fallback gdy A* nie znajdzie trasy. */
function greedyRiverDrainToSea(
  hexes: Record<string, Hex>,
  sq: number,
  sr: number,
  seaDist: Map<string, number>,
  openOceanDist: Map<string, number>,
  oceanConnected: Set<string>,
  maxLen: number,
  rand: () => number,
  sourceKey: string,
): RiverCoord[] {
  const startK = hexKey(sq, sr);
  const path: RiverCoord[] = [{ q: sq, r: sr }];
  const visited = new Set<string>([startK]);

  for (let step = 0; step < maxLen; step++) {
    const cur = path[path.length - 1]!;
    const curKey = hexKey(cur.q, cur.r);
    if (isRiverDrainageGoal(cur.q, cur.r, seaDist, hexes, sourceKey, oceanConnected)) {
      return path;
    }
    const curOd = openOceanDist.get(curKey);
    if (curOd == null) break;

    let inDir: [number, number] | null = null;
    if (path.length >= 2) {
      const prev = path[path.length - 2]!;
      inDir = riverStepDir(prev, cur);
    }

    const candidates: Array<{ q: number; r: number; score: number }> = [];
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nq = cur.q + dq;
      const nr = cur.r + dr;
      const nk = hexKey(nq, nr);
      if (visited.has(nk)) continue;
      // blockExisting: nie wchodź na heks innej, już ułożonej rzeki (konfluencje, nie krzyżowania).
      if (!canRiverFlowThrough(hexes[nk], nk, sourceKey, true)) continue;
      const nd = seaDist.get(nk) ?? Infinity;
      if (!canRiverDrainStep(nk, nd, openOceanDist, oceanConnected, true)) continue;
      const od = openOceanDist.get(nk) ?? Infinity;
      if (od > curOd + 0.5) continue;
      let score = od * 12 + rand() * 0.35;
      if (inDir && sameRiverDir(inDir, [dq, dr])) score -= 1.8;
      candidates.push({ q: nq, r: nr, score });
    }
    if (candidates.length === 0) break;
    candidates.sort((a, b) => a.score - b.score);
    const pick = candidates[0]!;
    path.push({ q: pick.q, r: pick.r });
    visited.add(hexKey(pick.q, pick.r));
  }
  return path.length > 1 && isRiverDrainageGoal(
    path[path.length - 1]!.q,
    path[path.length - 1]!.r,
    seaDist,
    hexes,
    sourceKey,
    oceanConnected,
  ) ? path : [];
}

/** Faza 2: najkrótsza droga do oceanu (A*) — po min. N hex fazy lądowej. */
function aStarRiverToSea(
  hexes: Record<string, Hex>,
  sq: number,
  sr: number,
  seaDist: Map<string, number>,
  openOceanDist: Map<string, number>,
  oceanConnected: Set<string>,
  maxLen: number,
  rand: () => number = () => 0,
): RiverCoord[] {
  const startK = hexKey(sq, sr);
  const h0 = openOceanDist.get(startK) ?? seaDist.get(startK);
  if (h0 == null) return [];
  if (oceanConnected.has(startK)) return [{ q: sq, r: sr }];

  const gScore = new Map<string, number>([[startK, 0]]);
  const cameFrom = new Map<string, string>();
  const stepDir = new Map<string, [number, number]>();
  const open = new Set<string>([startK]);
  const fScore = new Map<string, number>([[startK, h0]]);

  let bestK = startK;
  let bestH = h0;

  while (open.size > 0) {
    let current = '';
    let bestF = Infinity;
    for (const k of open) {
      const f = fScore.get(k) ?? Infinity;
      if (f < bestF) {
        bestF = f;
        current = k;
      }
    }
    if (!current) break;

    const curG = gScore.get(current)!;
    const curH = openOceanDist.get(current) ?? Infinity;
    const { q, r } = parseHexKey(current);
    if (curH < bestH) {
      bestH = curH;
      bestK = current;
    }
    if (isRiverDrainageGoal(q, r, seaDist, hexes, startK, oceanConnected)) {
      return reconstructRiverPath(cameFrom, current);
    }

    open.delete(current);
    if (curG >= maxLen) continue;

    const prev = cameFrom.get(current);
    let inDir: [number, number] | null = null;
    if (prev) {
      const pp = parseHexKey(prev);
      inDir = riverStepDir({ q: pp.q, r: pp.r }, { q, r });
    }

    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      // blockExisting: nie wchodź na heks innej, już ułożonej rzeki (konfluencje, nie krzyżowania).
      if (!canRiverFlowThrough(hexes[nk], nk, startK, true)) continue;
      const nd = seaDist.get(nk) ?? Infinity;
      if (!canRiverDrainStep(nk, nd, openOceanDist, oceanConnected, true)) continue;
      let stepCost = 1;
      if (inDir && sameRiverDir(inDir, [dq, dr])) stepCost += 0.18 + rand() * 0.12;
      const tg = curG + stepCost;
      if (tg > maxLen + 2) continue;
      if (tg >= (gScore.get(nk) ?? Infinity)) continue;
      cameFrom.set(nk, current);
      stepDir.set(nk, [dq, dr]);
      gScore.set(nk, tg);
      fScore.set(nk, tg + (openOceanDist.get(nk) ?? Infinity));
      open.add(nk);
    }
  }

  if (bestK !== startK) {
    const { q, r } = parseHexKey(bestK);
    if (isRiverDrainageGoal(q, r, seaDist, hexes, startK, oceanConnected)) {
      return reconstructRiverPath(cameFrom, bestK);
    }
  }
  return [{ q: sq, r: sr }];
}

/** Lateralny krok — odchylenie od prostej, nadal w stronę morza (±1 hex odległości). */
function findRiverMeanderStep(
  hexes: Record<string, Hex>,
  cur: RiverCoord,
  target: RiverCoord,
  seaDist: Map<string, number>,
  used: Set<string>,
  rand: () => number,
): RiverCoord | null {
  const curK = hexKey(cur.q, cur.r);
  const curD = seaDist.get(curK) ?? 999;
  const tgtK = hexKey(target.q, target.r);
  const toTarget = riverStepDir(cur, target);
  const opts: RiverCoord[] = [];

  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nq = cur.q + dq;
    const nr = cur.r + dr;
    const nk = hexKey(nq, nr);
    if (nk === tgtK || used.has(nk)) continue;
    if (sameRiverDir([dq, dr], toTarget)) continue;
    const nh = hexes[nk];
    // blockExisting: meander nie ma wpadać na heks innej, już ułożonej rzeki.
    if (!canRiverFlowThrough(nh, nk, '', true)) continue;
    const nd = seaDist.get(nk);
    if (nd == null || nd > curD) continue;
    if (nd < RIVER_MIN_INLAND_FROM_SEA) continue;
    const touchesTarget = HEX_DIRECTIONS.some(
      ([eq, er]) => nq + eq === target.q && nr + er === target.r,
    );
    if (!touchesTarget) continue;
    opts.push({ q: nq, r: nr });
  }

  if (opts.length === 0) return null;
  return opts[Math.floor(rand() * opts.length)]!;
}

/**
 * Łagodne S na długich prostych — max kilka odchyleń, zawsze w stronę morza (seaDist maleje).
 * Bez gęstych pętelek (Maciej 2026-07-04).
 */
function injectRiverMeanders(
  path: RiverCoord[],
  hexes: Record<string, Hex>,
  seaDist: Map<string, number>,
  rand: () => number,
  maxExtraSteps: number,
): RiverCoord[] {
  if (path.length < 5 || maxExtraSteps <= 0) return path;
  const result: RiverCoord[] = path.map((p) => ({ ...p }));
  let extra = 0;
  let straightRun = 0;
  let lastDir: [number, number] | null = null;

  for (let i = 0; i < result.length - 2 && extra < maxExtraSteps; i++) {
    const d = riverStepDir(result[i]!, result[i + 1]!);
    if (lastDir && sameRiverDir(lastDir, d)) straightRun++;
    else {
      straightRun = 1;
      lastDir = d;
    }
    if (straightRun < 4) continue;
    if (rand() >= 0.34) continue;

    const used = new Set(result.map((p) => hexKey(p.q, p.r)));
    const bend = findRiverMeanderStep(
      hexes,
      result[i + 1]!,
      result[i + 2]!,
      seaDist,
      used,
      rand,
    );
    if (!bend) continue;
    result.splice(i + 2, 0, bend);
    extra++;
    straightRun = 0;
    i += 2;
  }

  return repairRiverPathAdjacency(sanitizeRiverPath(result), hexes, hexKey(path[0]!.q, path[0]!.r));
}

/** Wydłuża trasę meandrami do min. długości (Maciej: min. N boków hex — nie sama linia A*). */
function extendRiverToMinimumLength(
  path: RiverCoord[],
  hexes: Record<string, Hex>,
  seaDist: Map<string, number>,
  rand: () => number,
  minLen: number,
  stepCap: number,
): RiverCoord[] {
  if (path.length >= minLen || path.length < 3) return path;
  const srcKey = hexKey(path[0]!.q, path[0]!.r);
  let out = path;
  for (let pass = 0; pass < 12 && out.length < minLen && out.length < stepCap; pass++) {
    const need = Math.min(minLen - out.length, stepCap - out.length, 6);
    const meandered = injectRiverMeanders(out, hexes, seaDist, rand, need);
    if (meandered.length > out.length) {
      out = meandered;
      continue;
    }
    const mid = Math.max(1, Math.floor(out.length * 0.45));
    const used = new Set(out.map((p) => hexKey(p.q, p.r)));
    const a = out[mid]!;
    const b = out[Math.min(out.length - 1, mid + 1)]!;
    const bend = findRiverMeanderStep(hexes, a, b, seaDist, used, rand);
    if (bend) {
      out = [...out.slice(0, mid + 1), bend, ...out.slice(mid + 1)];
      out = repairRiverPathAdjacency(sanitizeRiverPath(out), hexes, srcKey);
    } else {
      break;
    }
  }
  return out;
}

function extendRiverToWybrzeze(
  hexes: Record<string, Hex>,
  path: RiverCoord[],
  seaDist: Map<string, number>,
): RiverCoord[] {
  if (path.length === 0) return path;
  const visited = new Set(path.map((p) => hexKey(p.q, p.r)));
  let cq = path[path.length - 1]!.q;
  let cr = path[path.length - 1]!.r;

  // ZADANIE 2 (uproszczenie): Wybrzeże samo jest wodą (ZADANIE 1) — rzeka kończy na
  // PIERWSZYM kontakcie z wodą (Wybrzeże LUB Morze), bez tunelowania w głąb 2-hex pasa
  // aż do realnego Morza (dawne zachowanie wymagało `touchesMorse` — usunięte jako zbędne).
  for (let extra = 0; extra < RIVER_MOUTH_TAIL_LEN; extra++) {
    const endHex = hexes[hexKey(cq, cr)];
    if (!endHex) break;
    if (endHex.terenBazowy === TerenBazowy.Wybrzeze || endHex.terenBazowy === TerenBazowy.Morze) break;

    let best: [number, number] | null = null;
    let bestScore = Infinity;
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nq = cq + dq;
      const nr = cr + dr;
      const nk = hexKey(nq, nr);
      if (visited.has(nk)) continue;
      const nh = hexes[nk];
      if (!nh || nh.terenBazowy === TerenBazowy.Morze || isReliefTerrain(nh.terenBazowy)) continue;
      let score = seaDist.get(nk) ?? 999;
      if (nh.terenBazowy === TerenBazowy.Wybrzeze) score -= 8;
      if (score < bestScore) {
        bestScore = score;
        best = [nq, nr];
      }
    }
    if (!best) break;
    path.push({ q: best[0], r: best[1] });
    visited.add(hexKey(best[0], best[1]));
    cq = best[0];
    cr = best[1];
  }

  return path;
}

/** Domyka ujście na pierwszym heksie wody (Wybrzeże lub Morze) — wymóg renderu wstęgi. */
function finishRiverMouthAtSea(
  hexes: Record<string, Hex>,
  path: RiverCoord[],
  seaDist: Map<string, number>,
  openOceanDist: Map<string, number>,
  oceanConnected: Set<string>,
  sourceKey: string,
): RiverCoord[] {
  if (path.length === 0) return path;

  // ZADANIE 2 (uproszczenie): Wybrzeże = woda (ZADANIE 1) — gotowe ujście to PIERWSZY kontakt
  // z Wybrzeżem, bez wymogu, by ten konkretny hex dotykał jeszcze realnego Morza (dawny
  // specjalny przypadek usunięty — isRiverDrainageGoal(oceanConnected) już to pokrywa, bo
  // oceanConnected = oceanConnectedWaterKeys = Morze ∪ Wybrzeże).
  const mouthReady = (q: number, r: number): boolean =>
    isRiverDrainageGoal(q, r, seaDist, hexes, sourceKey, oceanConnected);

  if (mouthReady(path[path.length - 1]!.q, path[path.length - 1]!.r)) return path;

  const visited = new Set(path.map((p) => hexKey(p.q, p.r)));
  let cur = path[path.length - 1]!;

  for (let step = 0; step < RIVER_MOUTH_TAIL_LEN + 2; step++) {
    if (mouthReady(cur.q, cur.r)) return path;

    let best: RiverCoord | null = null;
    let bestScore = Infinity;
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nq = cur.q + dq;
      const nr = cur.r + dr;
      const nk = hexKey(nq, nr);
      if (visited.has(nk)) continue;
      const nh = hexes[nk];
      if (!nh || nh.terenBazowy === TerenBazowy.Morze || isReliefTerrain(nh.terenBazowy)) continue;
      const nd = seaDist.get(nk) ?? Infinity;
      if (nh.terenBazowy !== TerenBazowy.Wybrzeze
        && !canRiverDrainStep(nk, nd, openOceanDist, oceanConnected, true)) continue;
      if (!canRiverFlowThrough(nh, nk, sourceKey) && nh.terenBazowy !== TerenBazowy.Wybrzeze) continue;
      let score = openOceanDist.get(nk) ?? nd;
      // Preferuj Wybrzeże (pierwszy kontakt z wodą kończy trasę w następnej iteracji —
      // patrz mouthReady) — bez dodatkowego tunelowania do heksu stykającego realne Morze.
      if (nh.terenBazowy === TerenBazowy.Wybrzeze) score -= 15;
      if (score < bestScore) {
        bestScore = score;
        best = { q: nq, r: nr };
      }
    }
    if (!best) break;
    path.push(best);
    visited.add(hexKey(best.q, best.r));
    cur = best;
  }
  return path;
}

/**
 * Rzeka od (sq,sr):
 *   1) min. N hex (bufor 2 od morza, kierunek w stronę oceanu),
 *   2) najkrótsza droga do morza (A*; ostatnie 5 hex = korytarz ujścia).
 */
export function traceRiver(
  hexes: Record<string, Hex>,
  sq: number,
  sr: number,
  maxLen = 40,
  traceOpts: TraceRiverOpts = {},
): Array<{ q: number; r: number }> {
  const seaDist = traceOpts.seaDist ?? buildSeaDistanceField(hexes);
  const dims = traceOpts.mapWidth != null && traceOpts.mapHeight != null
    ? { width: traceOpts.mapWidth, height: traceOpts.mapHeight }
    : inferMapDimsFromHexes(hexes);
  const openOceanDist = traceOpts.openOceanDist
    ?? buildOpenOceanDistanceField(hexes, dims.width, dims.height, traceOpts.oceanConnected);
  // ZADANIE 2: domyślnie KAŻDA woda (Morze ∪ Wybrzeże). Realni wołający (generateRivers/
  // topUpRiverGridCoverage) i tak zawsze przekazują własny, jednolity zestaw; ten fallback
  // dotyczy tylko wywołań traceRiver() bez traceOpts.oceanConnected (np. debug/testy bezpośrednie).
  const oceanConnected = traceOpts.oceanConnected
    ?? oceanConnectedWaterKeys(hexes, dims.width, dims.height);
  const rand = traceOpts.rand ?? (() => 0);
  const srcKey = hexKey(sq, sr);
  const startDist = seaDist.get(srcKey);
  if (startDist == null || !Number.isFinite(startDist)) return [];

  const inlandTarget = traceOpts.minLen ?? 4;
  const stepCap = Math.max(
    inlandTarget + RIVER_MOUTH_TAIL_LEN + 12,
    Math.min(maxLen, Math.ceil(startDist * 2.5) + inlandTarget + 10),
  );

  let path = growRiverInlandBeforeDrainage(
    hexes, sq, sr, seaDist, openOceanDist, rand, inlandTarget, stepCap,
  );

  const tailFrom = path[path.length - 1]!;
  const drainBudget = Math.max(RIVER_MOUTH_TAIL_LEN + 4, stepCap - path.length + 1);
  let drainPath = aStarRiverToSea(
    hexes,
    tailFrom.q,
    tailFrom.r,
    seaDist,
    openOceanDist,
    oceanConnected,
    drainBudget,
    rand,
  );
  if (drainPath.length <= 1) {
    drainPath = greedyRiverDrainToSea(
      hexes,
      tailFrom.q,
      tailFrom.r,
      seaDist,
      openOceanDist,
      oceanConnected,
      drainBudget,
      rand,
      srcKey,
    );
  }
  if (drainPath.length > 1) {
    path = [...path, ...drainPath.slice(1)];
  } else if (path.length <= 1) {
    path = aStarRiverToSea(
      hexes, sq, sr, seaDist, openOceanDist, oceanConnected, stepCap, rand,
    );
    if (path.length <= 1) {
      path = greedyRiverDrainToSea(
        hexes, sq, sr, seaDist, openOceanDist, oceanConnected, stepCap, rand, srcKey,
      );
    }
  }

  if (path.length > stepCap) path = path.slice(0, stepCap);
  path = extendRiverToWybrzeze(hexes, path, seaDist);
  path = finishRiverMouthAtSea(hexes, path, seaDist, openOceanDist, oceanConnected, srcKey);
  path = repairRiverPathAdjacency(path, hexes, srcKey);

  if (!riverPathRespectsSeaBuffer(hexes, path, seaDist)
    || !pathEndsAtSea(hexes, path, dims.width, dims.height, oceanConnected)) {
    return [];
  }

  return path;
}

/** Ląd nadający się na źródło / bieg rzeki (bez morza i wybrzeża). */
function isRiverLandTerrain(t: TerenBazowy): boolean {
  return (
    t === TerenBazowy.Laka ||
    t === TerenBazowy.Rownina ||
    t === TerenBazowy.Wzgorza ||
    t === TerenBazowy.Gory ||
    t === TerenBazowy.Pustynia
  );
}

/** Źródła u podnóża — nizina sąsiadująca z górą/wzgórzem (więcej rzek na mapie). */
function collectFoothillRiverSources(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
  margin: number,
  seaDist: Map<string, number>,
): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let r = margin; r < height - margin; r++) {
    for (let q = margin; q < width - margin; q++) {
      const hex = hexes[hexKey(q, r)];
      if (!hex || !isRiverLandTerrain(hex.terenBazowy)) continue;
      if (isReliefRiverSource(hex.terenBazowy)) continue;
      const d = seaDist.get(hexKey(q, r)) ?? 0;
      if (d < 2 || d > 120) continue;
      let reliefAdj = false;
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nh = hexes[hexKey(q + dq, r + dr)];
        if (nh && isReliefRiverSource(nh.terenBazowy)) {
          reliefAdj = true;
          break;
        }
      }
      if (reliefAdj) out.push([q, r]);
    }
  }
  return out;
}

/**
 * Źródła na nizinach (źródliska) — uzupełnienie gdy samo relief nie wypełni limitu 10×.
 * Deterministyczny sampling per hex (rand z generatora).
 */
function collectPlainSpringSources(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
  margin: number,
  seaDist: Map<string, number>,
  rand: () => number,
  tier: DensityTier,
): Array<[number, number]> {
  const sampleRate = tier === 'high' ? 0.11 : tier === 'low' ? 0.035 : 0.065;
  const out: Array<[number, number]> = [];
  for (let r = margin; r < height - margin; r++) {
    for (let q = margin; q < width - margin; q++) {
      const hex = hexes[hexKey(q, r)];
      if (!hex || !isRiverLandTerrain(hex.terenBazowy)) continue;
      if (isReliefRiverSource(hex.terenBazowy)) continue;
      const d = seaDist.get(hexKey(q, r)) ?? 0;
      if (d < 3 || d > 65) continue;
      if (rand() > sampleRate) continue;
      out.push([q, r]);
    }
  }
  return out;
}

/** Zbiera kandydatów na źródła: wyłącznie góry i wzgórza. */
function collectRiverSources(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
  margin: number,
): Array<[number, number]> {
  const sources: Array<[number, number]> = [];
  for (let r = margin; r < height - margin; r++) {
    for (let q = margin; q < width - margin; q++) {
      const hex = hexes[hexKey(q, r)];
      if (!hex) continue;
      if (isReliefRiverSource(hex.terenBazowy)) sources.push([q, r]);
    }
  }
  return sources;
}

function capRiverQuotas(quotas: number[], maxTotal: number): number[] {
  const q = quotas.map((n) => Math.max(0, n));
  let sum = q.reduce((a, b) => a + b, 0);
  if (sum <= maxTotal) return q;
  while (sum > maxTotal) {
    let idx = 0;
    for (let i = 1; i < q.length; i++) {
      if ((q[i] ?? 0) > (q[idx] ?? 0)) idx = i;
    }
    if ((q[idx] ?? 0) <= 1) break;
    q[idx]!--;
    sum--;
  }
  return q;
}

/** Rozmieszcza źródła na masie lądu — preferuje góry daleko od morza, min. odstęp. */
function pickSpreadRiverSources(
  sources: Array<[number, number]>,
  count: number,
  minSep: number,
  seaDist: Map<string, number>,
  usedSources: Set<string>,
  rand: () => number,
): Array<[number, number]> {
  const ranked = sources
    .filter(([q, r]) => !usedSources.has(hexKey(q, r)))
    .map(([q, r]) => ({
      q,
      r,
      dist: seaDist.get(hexKey(q, r)) ?? 0,
      tie: rand(),
    }))
    .sort((a, b) => b.dist - a.dist || a.tie - b.tie);

  const picked: Array<[number, number]> = [];
  for (const s of ranked) {
    if (picked.length >= count) break;
    const tooClose = picked.some(([pq, pr]) => hexAxialDistance(pq, pr, s.q, s.r) < minSep);
    if (tooClose) continue;
    picked.push([s.q, s.r]);
  }
  return picked;
}

/** Indeks krawędzi (0–5) między heksami pointy-top. */
function neighborDirIndex(q: number, r: number, nq: number, nr: number): number {
  const dq = nq - q;
  const dr = nr - r;
  for (let i = 0; i < HEX_DIRECTIONS.length; i++) {
    const d = HEX_DIRECTIONS[i]!;
    if (d[0] === dq && d[1] === dr) return i;
  }
  return -1;
}

function markRiverEdge(hexes: Record<string, Hex>, q: number, r: number, edgeIdx: number): void {
  if (edgeIdx < 0) return;
  const hex = hexes[hexKey(q, r)];
  if (!hex || hex.terenBazowy === TerenBazowy.Morze) return;
  if (!isRiverLandTerrain(hex.terenBazowy) && hex.terenBazowy !== TerenBazowy.Wybrzeze) return;
  const edges = hex.rzeka?.krawedzie ?? [];
  if (!edges.includes(edgeIdx)) edges.push(edgeIdx);
  hex.rzeka = { obecna: edges.length > 0, krawedzie: edges };
}

/** Rzeka biegnie WYŁĄCZNIE po krawędziach — nie przez środek heksa (Roblox). */
function markRiverPath(hexes: Record<string, Hex>, path: Array<{ q: number; r: number }>): void {
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]!;
    const b = path[i + 1]!;
    const ha = hexes[hexKey(a.q, a.r)];
    const hb = hexes[hexKey(b.q, b.r)];
    if (!ha || !hb) continue;
    if (ha.terenBazowy === TerenBazowy.Morze && hb.terenBazowy === TerenBazowy.Morze) continue;
    if (ha.terenBazowy === TerenBazowy.Morze || hb.terenBazowy === TerenBazowy.Morze) {
      const coastal =
        ha.terenBazowy === TerenBazowy.Wybrzeze || hb.terenBazowy === TerenBazowy.Wybrzeze;
      if (!coastal) continue;
    }
    const eA = neighborDirIndex(a.q, a.r, b.q, b.r);
    const eB = neighborDirIndex(b.q, b.r, a.q, a.r);
    markRiverEdge(hexes, a.q, a.r, eA);
    markRiverEdge(hexes, b.q, b.r, eB);
  }
}

/**
 * Czy segment a→b oznakuje krawędź (te same reguły co markRiverPath) — i na których heksach.
 * Zwraca listę (klucz heksa, edgeIdx) krawędzi, które markRiverPath BY POŁOŻYŁ dla tej pary.
 */
function riverSegmentEdgeMarks(
  hexes: Record<string, Hex>,
  a: RiverCoord,
  b: RiverCoord,
): Array<{ key: string; edge: number }> {
  const ha = hexes[hexKey(a.q, a.r)];
  const hb = hexes[hexKey(b.q, b.r)];
  if (!ha || !hb) return [];
  if (ha.terenBazowy === TerenBazowy.Morze && hb.terenBazowy === TerenBazowy.Morze) return [];
  if (ha.terenBazowy === TerenBazowy.Morze || hb.terenBazowy === TerenBazowy.Morze) {
    const coastal =
      ha.terenBazowy === TerenBazowy.Wybrzeze || hb.terenBazowy === TerenBazowy.Wybrzeze;
    if (!coastal) return [];
  }
  const out: Array<{ key: string; edge: number }> = [];
  const eA = neighborDirIndex(a.q, a.r, b.q, b.r);
  const eB = neighborDirIndex(b.q, b.r, a.q, a.r);
  // markRiverEdge pomija Morze i teren nie-rzeczny (nie-Wybrzeże) — odwzoruj to.
  const eligible = (h: Hex): boolean =>
    h.terenBazowy !== TerenBazowy.Morze &&
    (isRiverLandTerrain(h.terenBazowy) || h.terenBazowy === TerenBazowy.Wybrzeze);
  if (eA >= 0 && eligible(ha)) out.push({ key: hexKey(a.q, a.r), edge: eA });
  if (eB >= 0 && eligible(hb)) out.push({ key: hexKey(b.q, b.r), edge: eB });
  return out;
}

/**
 * B0.10 (Z3): ZAKAZ PIERŚCIENI. Utnij bieg PRZED krokiem, który położyłby zakazaną krawędź:
 *  - 4. krawędź na heksie, który NIE jest jeszcze junctionem (0 wcześniej oznakowanych krawędzi
 *    z innych ścieżek) → czysty pierścień/zawinięcie wokół heksa — ZABRONIONE,
 *  - 5. krawędź na jakimkolwiek heksie (nawet junction: max 4, nigdy 5-6) → ZABRONIONE.
 * Deterministyczne (bez rand) → nie rusza kolejności rand(). Liczy krawędzie z JUŻ oznakowanych
 * (poprzednie ścieżki) + kładzione przez ten bieg. Zwraca skróconą ścieżkę (≥2 hexy) lub oryginał.
 */
function trimRiverPathRings(hexes: Record<string, Hex>, path: RiverCoord[]): RiverCoord[] {
  if (path.length < 3) return path;
  // Bazowa liczba krawędzi na heksie z poprzednich ścieżek (przed tym biegiem).
  const priorCount = new Map<string, number>();
  const laid = new Map<string, Set<number>>(); // krawędzie kładzione przez ten bieg
  const totalOnHex = (key: string): number =>
    (priorCount.get(key) ?? (() => {
      const h = hexes[key];
      const c = h?.rzeka?.krawedzie?.length ?? 0;
      priorCount.set(key, c);
      return c;
    })()) + (laid.get(key)?.size ?? 0);
  const hadPrior = (key: string): boolean => {
    if (!priorCount.has(key)) totalOnHex(key);
    return (priorCount.get(key) ?? 0) > 0;
  };

  for (let i = 0; i < path.length - 1; i++) {
    const marks = riverSegmentEdgeMarks(hexes, path[i]!, path[i + 1]!);
    // Sprawdź, czy KTÓRYKOLWIEK z tych znaczników przekroczy limit.
    for (const m of marks) {
      const already = laid.get(m.key)?.has(m.edge) ?? false;
      if (already) continue; // ta krawędź już policzona (idempotencja jak markRiverEdge)
      const cur = totalOnHex(m.key);
      const limit = hadPrior(m.key) ? 4 : 3; // junction: do 4 (blok przy 5. = >4→>=5); reszta: do 3 (blok 4.)
      if (cur >= limit) {
        // ten krok położyłby zakazaną krawędź → utnij bieg PRZED nim
        return path.slice(0, i + 1);
      }
    }
    // krok dozwolony — zapisz kładzione krawędzie
    for (const m of marks) {
      const s = laid.get(m.key) ?? new Set<number>();
      s.add(m.edge);
      laid.set(m.key, s);
    }
  }
  return path;
}

/**
 * B0.8 I2: domyka junction dopływu — dokleja JEDEN hex należący do sieci docelowej za
 * heksem-junction, tak by ostatnia krawędź dopływu pokrywała się z krawędzią rzeki docelowej
 * (wspólny wierzchołek wstęg w renderze, nie „1 hex obok"). `down` = hex nurtu poniżej junction.
 * Zwraca ścieżkę wydłużoną gdy `down` sąsiaduje z junction i nie jest już przedostatnim hexem.
 */
function appendJunctionDownstreamHex(
  path: RiverCoord[],
  down: RiverCoord | undefined,
): RiverCoord[] {
  if (!down || path.length < 2) return path;
  const last = path[path.length - 1]!;
  const prev = path[path.length - 2]!;
  // down musi być sąsiadem junction (last) i różny od przedostatniego (bez cofki/pętli)
  if (hexAxialDistance(last.q, last.r, down.q, down.r) !== 1) return path;
  if (down.q === prev.q && down.r === prev.r) return path;
  if (path.some((p) => p.q === down.q && p.r === down.r)) return path;
  return [...path, { q: down.q, r: down.r }];
}

/**
 * Sąsiad heksa-junction leżący w sieci rzecznej (po oznakowanej krawędzi), różny od hexa
 * dojścia dopływu. Używany do domknięcia junction w fazie 2 (feeder), gdzie nie znamy main path.
 */
function networkDownstreamNeighbor(
  hexes: Record<string, Hex>,
  junction: RiverCoord,
  approach: RiverCoord | undefined,
): RiverCoord | undefined {
  const jh = hexes[hexKey(junction.q, junction.r)];
  const edges = jh?.rzeka?.krawedzie;
  if (!edges || edges.length === 0) return undefined;
  for (const edgeIdx of edges) {
    const dir = HEX_DIRECTIONS[edgeIdx];
    if (!dir) continue;
    const nq = junction.q + dir[0];
    const nr = junction.r + dir[1];
    if (approach && nq === approach.q && nr === approach.r) continue;
    const nh = hexes[hexKey(nq, nr)];
    if (nh?.rzeka?.obecna && nh.terenBazowy !== TerenBazowy.Morze) return { q: nq, r: nr };
  }
  return undefined;
}

/** Usuwa oznaczenia rzeki z otwartego oceanu (bezpiecznik po generacji). */
export function stripRiverMarksFromOpenSea(hexes: Record<string, Hex>): number {
  let n = 0;
  for (const hex of Object.values(hexes)) {
    if (hex.terenBazowy !== TerenBazowy.Morze || !hex.rzeka?.obecna) continue;
    hex.rzeka = { obecna: false, krawedzie: [] };
    n++;
  }
  return n;
}

/** Czyści wszystkie krawędzie rzeki przed finalnym generowaniem (po zmianie wybrzeża). */
export function clearRiverMarks(hexes: Record<string, Hex>): void {
  for (const hex of Object.values(hexes)) {
    if (hex.rzeka?.obecna) hex.rzeka = { obecna: false, krawedzie: [] };
  }
}

/**
 * Dopływy dekoracyjne na długich rzekach — cieńsze, wpływają do głównego nurtu (nigdy ujścia).
 * B0.8b (Z2): ~2× więcej dopływów niż wcześniej (było 0/1/max2). Zero wpływu na liczbę ujść.
 */
function tributaryCountForLength(pathLen: number): number {
  // Maciej 2026-07-09: dopływy DOZWOLONE (delta = widelec-DOPŁYW). Zakazany tylko dystrybutariusz
  // (rozwidlenie ODPŁYWU do morza) — a tego generator nie tworzy (trasa źródło→morze jest jedna).
  if (pathLen < 12) return 0;
  if (pathLen < 22) return 2;
  return Math.min(4, Math.floor(pathLen / 8));
}

/** A* do konkretnego heksa (dopływ → główna rzeka). */
function aStarRiverToTarget(
  hexes: Record<string, Hex>,
  sq: number,
  sr: number,
  tq: number,
  tr: number,
  maxLen: number,
  sourceKey: string,
): RiverCoord[] {
  const startK = hexKey(sq, sr);
  const targetK = hexKey(tq, tr);
  if (startK === targetK) return [{ q: sq, r: sr }];

  const h0 = hexAxialDistance(sq, sr, tq, tr);
  const gScore = new Map<string, number>([[startK, 0]]);
  const cameFrom = new Map<string, string>();
  const open = new Set<string>([startK]);
  const fScore = new Map<string, number>([[startK, h0]]);

  while (open.size > 0) {
    let current = '';
    let bestF = Infinity;
    for (const k of open) {
      const f = fScore.get(k) ?? Infinity;
      if (f < bestF) {
        bestF = f;
        current = k;
      }
    }
    if (!current) break;
    if (current === targetK) return reconstructRiverPath(cameFrom, current);

    open.delete(current);
    const curG = gScore.get(current)!;
    if (curG >= maxLen) continue;

    const { q, r } = parseHexKey(current);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      // blockExisting: nie przecinaj ŻADNEJ innej, już ułożonej rzeki po drodze — jedyny
      // dozwolony (już-oznakowany) heks to sam cel `targetK` (zamierzona konfluencja).
      if (!canRiverFlowThrough(hexes[nk], nk, sourceKey, true, targetK)) continue;
      const tg = curG + 1;
      if (tg > maxLen) continue;
      if (tg >= (gScore.get(nk) ?? Infinity)) continue;
      cameFrom.set(nk, current);
      gScore.set(nk, tg);
      const { q: tq2, r: tr2 } = parseHexKey(nk);
      fScore.set(nk, tg + hexAxialDistance(tq2, tr2, tq, tr));
      open.add(nk);
    }
  }
  return [];
}

function findTributarySource(
  hexes: Record<string, Hex>,
  junction: RiverCoord,
  mainPathKeys: Set<string>,
  usedSources: Set<string>,
  rand: () => number,
): [number, number] | null {
  const candidates: Array<{ q: number; r: number; score: number }> = [];
  for (let dq = -8; dq <= 8; dq++) {
    for (let dr = -8; dr <= 8; dr++) {
      const dist = hexAxialDistance(junction.q, junction.r, junction.q + dq, junction.r + dr);
      if (dist < 3 || dist > 8) continue;
      const q = junction.q + dq;
      const r = junction.r + dr;
      const k = hexKey(q, r);
      if (mainPathKeys.has(k) || usedSources.has(k)) continue;
      const hex = hexes[k];
      if (!hex || !isReliefRiverSource(hex.terenBazowy)) continue;
      candidates.push({ q, r, score: dist * 0.4 + rand() * 2 });
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.score - b.score);
  return [candidates[0]!.q, candidates[0]!.r];
}

function traceTributary(
  hexes: Record<string, Hex>,
  sq: number,
  sr: number,
  tq: number,
  tr: number,
  maxLen: number,
  seaDist: Map<string, number>,
  rand: () => number,
): RiverCoord[] {
  const srcKey = hexKey(sq, sr);
  let path = aStarRiverToTarget(hexes, sq, sr, tq, tr, maxLen, srcKey);
  if (path.length < 3) return [];
  const maxMeander = Math.min(2, Math.floor(path.length * 0.08));
  path = injectRiverMeanders(path, hexes, seaDist, rand, maxMeander);
  path = repairRiverPathAdjacency(path, hexes, srcKey);
  return path;
}

function addTributariesForMainRiver(
  hexes: Record<string, Hex>,
  mainPath: RiverCoord[],
  seaDist: Map<string, number>,
  rand: () => number,
  maxLen: number,
  riverPaths: RiverCoord[][],
  riverKinds: RiverPathKind[],
  usedSources: Set<string>,
  minSourceSep: number,
): void {
  const n = tributaryCountForLength(mainPath.length);
  if (n <= 0) return;

  const mainKeys = new Set(mainPath.map((p) => hexKey(p.q, p.r)));
  const jStart = Math.max(1, Math.floor(mainPath.length * 0.18));
  const jEnd = Math.min(mainPath.length - 2, Math.floor(mainPath.length * 0.82));
  const span = jEnd - jStart;
  if (span < 2) return;

  for (let ti = 0; ti < n; ti++) {
    const jIdx = jStart + Math.floor(((ti + 0.5) / n) * span);
    const junction = mainPath[jIdx];
    if (!junction) continue;

    const src = findTributarySource(hexes, junction, mainKeys, usedSources, rand);
    if (!src) continue;
    if (isTooCloseToRiverSource(src[0], src[1], usedSources, Math.max(2, Math.floor(minSourceSep * 0.5)))) {
      continue;
    }

    const srcKey = hexKey(src[0], src[1]);
    const tribLen = Math.min(maxLen, Math.max(5, Math.floor(mainPath.length * 0.4)));
    let path = traceTributary(hexes, src[0], src[1], junction.q, junction.r, tribLen, seaDist, rand);
    if (path.length < 3) continue;

    // B0.10 (Z3) NAJPIERW: utnij bieg zanim położy 4. krawędź na heksie (pierścień).
    path = trimRiverPathRings(hexes, path);
    // B0.8 I2 PO przycięciu: domknij junction na realnym końcu biegu — dołóż 1 hex sieci
    // za końcem (krawędź już oznakowana przez główny nurt → 0 nowych krawędzi, hash bez zmian).
    // networkDownstreamNeighbor działa też gdy trim przesunął koniec z pierwotnego junction.
    if (path.length >= 2) {
      const end = path[path.length - 1]!;
      const approach = path[path.length - 2]!;
      const down = networkDownstreamNeighbor(hexes, end, approach);
      path = appendJunctionDownstreamHex(path, down);
    }
    riverPaths.push(path);
    riverKinds.push('tributary');
    usedSources.add(srcKey);
    markRiverPath(hexes, path);
  }
}

// ---------------------------------------------------------------------------
// Rzeki — równomierna siatka (Maciej 2026-07-04: fair play, źródło→morze co N hex)
// ---------------------------------------------------------------------------

/**
 * Bok kwadratu lądu (hex q×r): w każdej komórce min. 1 źródło wody (główny nurt → morze).
 * Tier „Rzeki”: Mało=15 · Normalnie=10 · Dużo=5.
 */
export function riverCoverageCellSize(tier: DensityTier = 'medium'): number {
  return waterCoverageCellSize(tier);
}

/**
 * B0.8b (Z2): GĘSTOŚĆ DOPŁYWÓW — osobna, GĘSTSZA siatka używana WYŁĄCZNIE w
 * topUpRiverGridCoverage (faza po głównych nurtach). Mniejsza komórka = ~(old/new)² więcej
 * feederów, a te w tej fazie wpadają do istniejących sieci jako DOPŁYWY (nie nowe ujścia —
 * ujścia zależą od głównej siatki riverCoverageCellSize, tu bez zmian). Mało=11 · Normalnie=7 · Dużo=4.
 * (10→7 dla „Normalnie” to ~2.0× komórek = ~2× biegów, cel z dyspozycji.)
 */
export function riverTributaryCellSize(tier: DensityTier = 'medium'): number {
  if (tier === 'high') return 4;
  if (tier === 'low') return 11;
  return 7;
}

export function landHexesByCoverageCell(
  massSet: Set<string>,
  cellSize: number,
): Map<string, Array<[number, number]>> {
  const cells = new Map<string, Array<[number, number]>>();
  for (const key of massSet) {
    const { q, r } = parseHexKey(key);
    const ck = `${Math.floor(q / cellSize)},${Math.floor(r / cellSize)}`;
    const arr = cells.get(ck) ?? [];
    arr.push([q, r]);
    cells.set(ck, arr);
  }
  return cells;
}

export type RiverPathKind = 'main' | 'tributary';

export interface GenerateRiversResult {
  paths: RiverCoord[][];
  kinds: RiverPathKind[];
}

/** BATCH 4: 1 główny nurt na blok stride×stride komórek siatki (~9 komórek przy stride=3). */
export const MAIN_RIVER_GRID_STRIDE = 3;

/** Fair play BATCH 4: komórka ma dowolny heks z rzeką (krawędzie), nie tylko źródło main. */
export function cellHasRiverHex(
  cellLand: Array<[number, number]>,
  hexes: Record<string, Hex>,
): boolean {
  for (const [q, r] of cellLand) {
    const h = hexes[hexKey(q, r)];
    if (h?.rzeka?.obecna) return true;
  }
  return false;
}

function coverageCellIndex(q: number, r: number, cellSize: number): [number, number] {
  return [Math.floor(q / cellSize), Math.floor(r / cellSize)];
}

function isSparseMainCoverageCell(land: Array<[number, number]>, cellSize: number): boolean {
  if (land.length === 0) return false;
  const [cq, cr] = coverageCellIndex(land[0]![0], land[0]![1], cellSize);
  return cq % MAIN_RIVER_GRID_STRIDE === 0 && cr % MAIN_RIVER_GRID_STRIDE === 0;
}

function collectRiverHexKeys(hexes: Record<string, Hex>): Set<string> {
  const keys = new Set<string>();
  for (const [k, h] of Object.entries(hexes)) {
    if (h.rzeka?.obecna) keys.add(k);
  }
  return keys;
}

/** BFS po krawędziach rzek od ujść main do morza — heksy sieci spływającej do oceanu. */
export function buildOceanReachableRiverHexKeys(
  hexes: Record<string, Hex>,
  paths: RiverCoord[][],
  kinds: RiverPathKind[],
  width: number,
  height: number,
  oceanConnected?: Set<string>,
): Set<string> {
  const ocean = oceanConnected ?? oceanConnectedWaterKeys(hexes, width, height);
  const riverHexes = collectRiverHexKeys(hexes);
  const reached = new Set<string>();
  const queue: string[] = [];

  const seed = (k: string) => {
    if (!riverHexes.has(k) || reached.has(k)) return;
    reached.add(k);
    queue.push(k);
  };

  for (let i = 0; i < paths.length; i++) {
    if (kinds[i] !== 'main') continue;
    const path = paths[i];
    if (!path?.length || !pathEndsAtSea(hexes, path, width, height, ocean)) continue;
    for (const p of path) seed(hexKey(p.q, p.r));
  }

  while (queue.length > 0) {
    const k = queue.shift()!;
    const { q, r } = parseHexKey(k);
    const h = hexes[k];
    if (!h?.rzeka?.krawedzie?.length) continue;
    for (const edgeIdx of h.rzeka.krawedzie) {
      const dir = HEX_DIRECTIONS[edgeIdx];
      if (!dir) continue;
      const nk = hexKey(q + dir[0], r + dir[1]);
      if (riverHexes.has(nk) && !reached.has(nk)) {
        reached.add(nk);
        queue.push(nk);
      }
    }
  }
  return reached;
}

/** BATCH 4 bramka: 100% heksów rzecznych w sieci z ujściem do morza. */
export function verifyRiverNetworkConnectivity(
  hexes: Record<string, Hex>,
  paths: RiverCoord[][],
  kinds: RiverPathKind[],
  width: number,
  height: number,
): { connected: boolean; orphanCount: number; riverHexCount: number } {
  const riverHexes = collectRiverHexKeys(hexes);
  const reached = buildOceanReachableRiverHexKeys(hexes, paths, kinds, width, height);
  const orphanCount = [...riverHexes].filter((k) => !reached.has(k)).length;
  return {
    connected: orphanCount === 0,
    orphanCount,
    riverHexCount: riverHexes.size,
  };
}

/** B0.7/B0.8: usuwa osierocone sciezki (niepolaczone z morzem) i przemapowuje krawedzie
 *  wylacznie dla zachowanych sciezek. Gwarantuje verifyRiverNetworkConnectivity.orphanCount===0.
 *  Teren nietkniety -> hash bez zmian. Deterministyczne (bez rand()). */
export function pruneOrphanRiverPaths(
  hexes: Record<string, Hex>,
  paths: RiverCoord[][],
  kinds: RiverPathKind[],
  width: number,
  height: number,
): { paths: RiverCoord[][]; kinds: RiverPathKind[] } {
  let curPaths = paths.slice();
  let curKinds = kinds.slice();
  for (let iter = 0; iter < 10; iter++) {
    const reached = buildOceanReachableRiverHexKeys(hexes, curPaths, curKinds, width, height);
    const ocean = oceanConnectedWaterKeys(hexes, width, height);
    const hexToPaths = new Map<string, Set<number>>();
    for (let pi = 0; pi < curPaths.length; pi++) {
      for (const c of curPaths[pi] ?? []) {
        const k = hexKey(c.q, c.r);
        let s = hexToPaths.get(k);
        if (!s) { s = new Set<number>(); hexToPaths.set(k, s); }
        s.add(pi);
      }
    }
    const keptPaths: RiverCoord[][] = [];
    const keptKinds: RiverPathKind[] = [];
    let dropped = false;
    for (let i = 0; i < curPaths.length; i++) {
      const p = curPaths[i] ?? [];
      if (p.length === 0) { dropped = true; continue; }
      const connected = p.every((c) => {
        const h = hexes[hexKey(c.q, c.r)];
        if (h?.terenBazowy === TerenBazowy.Morze) return true;
        return reached.has(hexKey(c.q, c.r));
      });
      if (!connected) { dropped = true; continue; }
      if (curKinds[i] === 'tributary' && !pathEndsAtSea(hexes, p, width, height, ocean)) {
        const end = p[p.length - 1]!;
        const eh = hexes[hexKey(end.q, end.r)];
        let closed = false;
        for (const ei of eh?.rzeka?.krawedzie ?? []) {
          const dir = HEX_DIRECTIONS[ei];
          if (!dir) continue;
          const owners = hexToPaths.get(hexKey(end.q + dir[0], end.r + dir[1]));
          if (owners && [...owners].some((x) => x !== i)) { closed = true; break; }
        }
        if (!closed) { dropped = true; continue; }
      }
      keptPaths.push(p);
      keptKinds.push(curKinds[i] ?? 'main');
    }
    clearRiverMarks(hexes);
    for (const p of keptPaths) markRiverPath(hexes, p);
    curPaths = keptPaths;
    curKinds = keptKinds;
    if (!dropped) break;
  }
  return { paths: curPaths, kinds: curKinds };
}

/**
 * ZADANIE 2 (2026-07-20, uproszczenie): ujście = ostatni hex trasy dotyka wody (Morze ∪
 * Wybrzeże — {@link oceanConnectedWaterKeys}). Wybrzeże jest teraz wodą konsekwentnie
 * (ZADANIE 1), więc to kryterium jest już zawsze wystarczające — dawny „ostrzejszy" wariant
 * (riverSeaGoalKeys: tylko Wybrzeże stykające bezpośrednio z Morzem) nie jest już potrzebny
 * i został usunięty. Funkcja zostaje (dziś funkcjonalnie tożsama z pathEndsAtSea) —
 * eksportowana do bramki regresji (tools/map-gen-regression-test.cjs), sprawdzenie ciągłości.
 */
export function pathReachesRealSea(
  hexes: Record<string, Hex>,
  path: Array<{ q: number; r: number }>,
  width?: number,
  height?: number,
  goalKeys?: Set<string>,
): boolean {
  const dims = width != null && height != null ? { width, height } : inferMapDimsFromHexes(hexes);
  const goal = goalKeys ?? oceanConnectedWaterKeys(hexes, dims.width, dims.height);
  return pathEndsAtSea(hexes, path, dims.width, dims.height, goal);
}

/**
 * Bezpiecznik końcowy (generator.ts, PO pruneOrphanRiverPaths) — usuwa główne ('main') trasy,
 * które mimo generateRivers/topUpRiverGridCoverage nie dotykają wody (np. gdyby jakiś późniejszy
 * krok terenu przesunął wybrzeże). W normalnym biegu to no-op (0 usuniętych) — to tylko ostatnia
 * bramka gwarancji. Kaskadowo domyka ewentualne osierocone dopływy przez ponowne wywołanie
 * {@link pruneOrphanRiverPaths} (ta funkcja NIE dotyka logiki dopływ-vs-własne-ujście —
 * B1 zostaje bez zmian). Deterministyczne, bez rand().
 */
export function pruneRiversNotReachingRealSea(
  hexes: Record<string, Hex>,
  paths: RiverCoord[][],
  kinds: RiverPathKind[],
  width: number,
  height: number,
): { paths: RiverCoord[][]; kinds: RiverPathKind[] } {
  const goal = oceanConnectedWaterKeys(hexes, width, height);
  const drop = new Set<number>();
  for (let i = 0; i < paths.length; i++) {
    if (kinds[i] !== 'main') continue;
    if (!pathReachesRealSea(hexes, paths[i] ?? [], width, height, goal)) drop.add(i);
  }
  if (drop.size === 0) return { paths, kinds };
  const keptPaths = paths.filter((_, i) => !drop.has(i));
  const keptKinds = kinds.filter((_, i) => !drop.has(i));
  clearRiverMarks(hexes);
  for (const p of keptPaths) markRiverPath(hexes, p);
  return pruneOrphanRiverPaths(hexes, keptPaths, keptKinds, width, height);
}

/** Czy między lądowymi heksami a→b krawędź rzeki jest oznakowana po OBU stronach (I1). */
function riverEdgeMarkedBoth(hexes: Record<string, Hex>, a: RiverCoord, b: RiverCoord): boolean {
  const eA = neighborDirIndex(a.q, a.r, b.q, b.r);
  const eB = neighborDirIndex(b.q, b.r, a.q, a.r);
  if (eA < 0 || eB < 0) return false;
  const ha = hexes[hexKey(a.q, a.r)];
  const hb = hexes[hexKey(b.q, b.r)];
  return !!ha?.rzeka?.krawedzie?.includes(eA) && !!hb?.rzeka?.krawedzie?.includes(eB);
}

/**
 * B0.8 I1 — ciągłość biegu (poziom danych, kontroluje to, co renderuje wstęga lądowa):
 * każda para kolejnych heksów LĄDOWYCH (nie Morze) ścieżki jest sąsiadami hex ORAZ ich
 * wspólna krawędź jest oznakowana po obu stronach. Pary dotykające Morza (samo ujście do
 * tafli) pomijamy — to inwariant I3 (render), nie krawędziowy. FAIL z lokalizacją pierwszego
 * naruszenia (seed+ścieżka+indeks).
 */
export function checkRiverEdgeContinuity(
  paths: RiverCoord[][],
  hexes: Record<string, Hex>,
): { ok: boolean; violations: number; firstFail: string | null } {
  let violations = 0;
  let firstFail: string | null = null;
  for (let pi = 0; pi < paths.length; pi++) {
    const path = paths[pi];
    if (!path || path.length < 2) continue;
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1]!;
      const b = path[i]!;
      const ha = hexes[hexKey(a.q, a.r)];
      const hb = hexes[hexKey(b.q, b.r)];
      // pary dotykające Morza pomijamy (ujście = I3, nie krawędziowe)
      if (ha?.terenBazowy === TerenBazowy.Morze || hb?.terenBazowy === TerenBazowy.Morze) continue;
      const adj = hexAxialDistance(a.q, a.r, b.q, b.r) === 1;
      if (!adj || !riverEdgeMarkedBoth(hexes, a, b)) {
        violations++;
        if (!firstFail) {
          firstFail = `path#${pi} idx=${i} ${a.q},${a.r} -> ${b.q},${b.r} (adj=${adj})`;
        }
      }
    }
  }
  return { ok: violations === 0, violations, firstFail };
}

/**
 * B0.8 I2 — domknięty junction: każdy dopływ kończy na heksie, który dzieli oznakowaną
 * krawędź rzeki z heksem NALEŻĄCYM DO INNEJ ścieżki (jego sieci). Dopływy sięgające morza
 * (ujście własne) są zwolnione. FAIL przy pierwszym dopływie bez domkniętego junction.
 */
export function checkTributaryJunctions(
  paths: RiverCoord[][],
  kinds: RiverPathKind[],
  hexes: Record<string, Hex>,
  width?: number,
  height?: number,
): { ok: boolean; violations: number; firstFail: string | null } {
  const dims = width != null && height != null ? { width, height } : inferMapDimsFromHexes(hexes);
  const ocean = oceanConnectedWaterKeys(hexes, dims.width, dims.height);
  // mapa hex -> zbiór indeksów ścieżek, do których należy
  const hexToPaths = new Map<string, Set<number>>();
  for (let pi = 0; pi < paths.length; pi++) {
    for (const p of paths[pi] ?? []) {
      const k = hexKey(p.q, p.r);
      const s = hexToPaths.get(k) ?? new Set<number>();
      s.add(pi);
      hexToPaths.set(k, s);
    }
  }
  let violations = 0;
  let firstFail: string | null = null;
  for (let pi = 0; pi < paths.length; pi++) {
    if (kinds[pi] !== 'tributary') continue;
    const path = paths[pi];
    if (!path || path.length < 2) continue;
    // dopływ z własnym ujściem do morza — nie wymaga junction
    if (pathEndsAtSea(hexes, path, dims.width, dims.height, ocean)) continue;
    const end = path[path.length - 1]!;
    const eh = hexes[hexKey(end.q, end.r)];
    let closed = false;
    for (const edgeIdx of eh?.rzeka?.krawedzie ?? []) {
      const dir = HEX_DIRECTIONS[edgeIdx];
      if (!dir) continue;
      const nk = hexKey(end.q + dir[0], end.r + dir[1]);
      const owners = hexToPaths.get(nk);
      if (!owners) continue;
      // sąsiad przez oznakowaną krawędź należy do INNEJ ścieżki → junction domknięty
      if ([...owners].some((idx) => idx !== pi)) { closed = true; break; }
    }
    if (!closed) {
      violations++;
      if (!firstFail) firstFail = `tributary#${pi} end=${end.q},${end.r} (brak wspólnej krawędzi z inną ścieżką)`;
    }
  }
  return { ok: violations === 0, violations, firstFail };
}

/**
 * B0.10 (Z3) — ZAKAZ PIERŚCIENI RZECZNYCH. Żaden heks nie może mieć ≥4 oznakowanych krawędzi
 * rzeki (rzeka zawija się wokół heksa = pierścień), CHYBA że jest junctionem ≥2 ścieżek — wtedy
 * dozwolone dokładnie 4, nigdy 5-6. FAIL przy pierwszym naruszeniu (heks + liczba krawędzi + czy junction).
 */
export function checkNoRiverRings(
  hexes: Record<string, Hex>,
  paths: RiverCoord[][],
): { ok: boolean; violations: number; firstFail: string | null } {
  // Ile RÓŻNYCH ścieżek przechodzi przez dany heks (junction = ≥2).
  const pathsOnHex = new Map<string, number>();
  for (const path of paths) {
    const seen = new Set<string>();
    for (const p of path ?? []) {
      const k = hexKey(p.q, p.r);
      if (seen.has(k)) continue;
      seen.add(k);
      pathsOnHex.set(k, (pathsOnHex.get(k) ?? 0) + 1);
    }
  }
  let violations = 0;
  let firstFail: string | null = null;
  for (const [key, hex] of Object.entries(hexes)) {
    const edges = hex.rzeka?.krawedzie?.length ?? 0;
    if (edges < 4) continue;
    const isJunction = (pathsOnHex.get(key) ?? 0) >= 2;
    // ≥5 zawsze zakazane; dokładnie 4 dozwolone tylko na junctionie.
    if (edges >= 5 || !isJunction) {
      violations++;
      if (!firstFail) {
        firstFail = `hex ${key}: ${edges} krawędzi rzeki (junction=${isJunction})`;
      }
    }
  }
  return { ok: violations === 0, violations, firstFail };
}

export function countRiverOutletsToSea(
  hexes: Record<string, Hex>,
  paths: RiverCoord[][],
  kinds: RiverPathKind[],
  width: number,
  height: number,
): number {
  const ocean = oceanConnectedWaterKeys(hexes, width, height);
  let n = 0;
  for (let i = 0; i < paths.length; i++) {
    if (kinds[i] !== 'main') continue;
    if (pathEndsAtSea(hexes, paths[i] ?? [], width, height, ocean)) n++;
  }
  return n;
}

export function medianRiverPathLength(
  paths: RiverCoord[][],
  kinds?: RiverPathKind[],
  mainsOnly = false,
): number {
  const lens: number[] = [];
  for (let i = 0; i < paths.length; i++) {
    if (mainsOnly && kinds?.[i] !== 'main') continue;
    const len = paths[i]?.length ?? 0;
    if (len >= 3) lens.push(len);
  }
  lens.sort((a, b) => a - b);
  if (lens.length === 0) return 0;
  const mid = Math.floor(lens.length / 2);
  return lens.length % 2 === 1 ? lens[mid]! : (lens[mid - 1]! + lens[mid]!) / 2;
}

function collectRiverPathHexKeys(paths: RiverCoord[][]): Set<string> {
  const keys = new Set<string>();
  for (const path of paths) {
    for (const p of path ?? []) keys.add(hexKey(p.q, p.r));
  }
  return keys;
}

function rankNetworkJunctionCandidates(
  sq: number,
  sr: number,
  junctionKeys: Set<string>,
  seaDist: Map<string, number>,
  maxLen: number,
  rand: () => number,
): Array<{ q: number; r: number; dist: number; score: number }> {
  const out: Array<{ q: number; r: number; dist: number; score: number }> = [];
  const maxD = maxLen + 6;
  for (let dist = 3; dist <= maxD && out.length < 16; dist++) {
    for (let dq = -dist; dq <= dist; dq++) {
      for (let dr = -dist; dr <= dist; dr++) {
        if (hexAxialDistance(0, 0, dq, dr) !== dist) continue;
        const q = sq + dq;
        const r = sr + dr;
        const k = hexKey(q, r);
        if (!junctionKeys.has(k)) continue;
        const sd = seaDist.get(k) ?? 0;
        if (sd < RIVER_MIN_INLAND_FROM_SEA) continue;
        out.push({ q, r, dist, score: dist + rand() * 2 - (sd > 12 ? 4 : 0) });
      }
    }
  }
  out.sort((a, b) => a.score - b.score);
  return out.slice(0, 8);
}

/** Czy masa lądu ma choć jeden główny nurt (dowolny hex trasy). */
export function landMassHasMainRiver(
  massLandKeys: string[],
  paths: RiverCoord[][],
  kinds: RiverPathKind[],
): boolean {
  const massSet = new Set(massLandKeys);
  for (let i = 0; i < paths.length; i++) {
    if (kinds[i] !== 'main') continue;
    for (const p of paths[i] ?? []) {
      if (massSet.has(hexKey(p.q, p.r))) return true;
    }
  }
  return false;
}

/** Fair play: komórka obsłużona gdy źródło głównego nurtu (path[0]) leży w komórce — nie przelot. */
export function cellHasMainRiverSource(
  cellLand: Array<[number, number]>,
  paths: RiverCoord[][],
  kinds: RiverPathKind[],
): boolean {
  const cellSet = new Set(cellLand.map(([q, r]) => hexKey(q, r)));
  for (let i = 0; i < paths.length; i++) {
    if (kinds[i] !== 'main') continue;
    const p0 = paths[i]?.[0];
    if (p0 && cellSet.has(hexKey(p0.q, p0.r))) return true;
  }
  return false;
}

/** @deprecated — przelot przez komórkę; tylko testy legacy. */
function cellHasMainRiver(
  cellLand: Array<[number, number]>,
  paths: RiverCoord[][],
  kinds: RiverPathKind[],
): boolean {
  return cellHasMainRiverSource(cellLand, paths, kinds);
}

/** @deprecated alias */
function cellHasRiverSource(
  cellLand: Array<[number, number]>,
  riverPaths: RiverCoord[][],
): boolean {
  const kinds = riverPaths.map(() => 'main' as RiverPathKind);
  return cellHasMainRiverSource(cellLand, riverPaths, kinds);
}

function isTooCloseToRiverSource(
  sq: number,
  sr: number,
  usedSources: Set<string>,
  minSep: number,
): boolean {
  for (const sk of usedSources) {
    const { q, r } = parseHexKey(sk);
    if (hexAxialDistance(q, r, sq, sr) < minSep) return true;
  }
  return false;
}

export function minLandHexesForRiverCell(cellSize: number): number {
  return Math.max(4, Math.floor(cellSize * 0.35));
}

/** Test / bramka: każda komórka siatki z wystarczającym lądem ma heks z rzeką (BATCH 4). */
export function assertRiverGridCoverage(
  massLandKeys: string[],
  riverPaths: RiverCoord[][],
  cellSize: number,
  seaDist?: Map<string, number>,
  maxRiverLen = 80,
  kinds?: RiverPathKind[],
  hexes?: Record<string, Hex>,
): boolean {
  const pathKinds = kinds ?? riverPaths.map(() => 'main' as RiverPathKind);
  const massSet = new Set(massLandKeys);
  const minLand = minLandHexesForRiverCell(cellSize);
  const cells = landHexesByCoverageCell(massSet, cellSize);
  for (const land of cells.values()) {
    if (land.length < minLand) continue;
    if (seaDist) {
      const reachable = land.some(([q, r]) => {
        const d = seaDist.get(hexKey(q, r)) ?? 999;
        return d >= 2 && d <= maxRiverLen + 8;
      });
      if (!reachable) continue;
    }
    if (hexes) {
      if (!cellHasRiverHex(land, hexes)) return false;
    } else if (!cellHasMainRiverSource(land, riverPaths, pathKinds)) {
      return false;
    }
  }
  return true;
}

/** Ułamek komórek siatki z heksem rzeki (0–1). */
export function riverGridCoverageRatio(
  massLandKeys: string[],
  riverPaths: RiverCoord[][],
  cellSize: number,
  seaDist?: Map<string, number>,
  maxRiverLen = 80,
  kinds?: RiverPathKind[],
  minRiverLen = 4,
  hexes?: Record<string, Hex>,
): number {
  const pathKinds = kinds ?? riverPaths.map(() => 'main' as RiverPathKind);
  const massSet = new Set(massLandKeys);
  const minLand = minLandHexesForRiverCell(cellSize);
  const minInland = Math.max(8, Math.floor(minRiverLen * 0.45));
  let need = 0;
  let hit = 0;
  for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
    if (land.length < minLand) continue;
    if (seaDist) {
      const inland = land.some(([q, r]) => (seaDist.get(hexKey(q, r)) ?? 0) >= minInland);
      if (!inland) continue;
    }
    need++;
    if (hexes && cellHasRiverHex(land, hexes)) hit++;
    else if (cellHasMainRiverSource(land, riverPaths, pathKinds)) hit++;
  }
  return need > 0 ? hit / need : 1;
}

function countRiverGridCellsNeeded(massSet: Set<string>, cellSize: number): number {
  const minLand = minLandHexesForRiverCell(cellSize);
  let n = 0;
  for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
    if (land.length >= minLand) n++;
  }
  return n;
}

function expandRiverSourceCandidates(
  land: Array<[number, number]>,
  massSet: Set<string>,
  radius = 2,
): Array<[number, number]> {
  const out = new Map<string, [number, number]>();
  for (const [q, r] of land) {
    out.set(hexKey(q, r), [q, r]);
    for (let step = 1; step <= radius; step++) {
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nq = q + dq * step;
        const nr = r + dr * step;
        const k = hexKey(nq, nr);
        if (!massSet.has(k)) continue;
        out.set(k, [nq, nr]);
      }
    }
  }
  return [...out.values()];
}

function ensureMassRiverGridCoverage(
  hexes: Record<string, Hex>,
  massSet: Set<string>,
  cellSize: number,
  seaDist: Map<string, number>,
  riverPaths: RiverCoord[][],
  riverKinds: RiverPathKind[],
  usedSources: Set<string>,
  tryPlace: (sq: number, sr: number) => boolean,
  rand: () => number,
  maxLen: number,
  opts: { sparseMainOnly?: boolean; requireRiverHex?: boolean } = {},
): number {
  const minLand = minLandHexesForRiverCell(cellSize);
  let placed = 0;

  const cellList = [...landHexesByCoverageCell(massSet, cellSize).values()]
    .filter((land) => land.length >= minLand)
    .filter((land) => !opts.sparseMainOnly || isSparseMainCoverageCell(land, cellSize))
    .filter((land) =>
      land.some(([q, r]) => {
        const d = seaDist.get(hexKey(q, r)) ?? 999;
        return d >= 2 && d <= maxLen + 8;
      }),
    )
    .sort((a, b) => {
      const avg = (cells: Array<[number, number]>) => {
        let s = 0;
        for (const [q, r] of cells) s += seaDist.get(hexKey(q, r)) ?? 0;
        return s / cells.length;
      };
      return avg(b) - avg(a);
    });

  const cellSatisfied = (land: Array<[number, number]>): boolean => {
    if (opts.requireRiverHex) return cellHasRiverHex(land, hexes);
    return cellHasMainRiverSource(land, riverPaths, riverKinds);
  };

  for (const land of cellList) {
    if (cellSatisfied(land)) continue;

    const ranked = land
      .filter(([q, r]) => !usedSources.has(hexKey(q, r)))
      .map(([q, r]) => {
        const h = hexes[hexKey(q, r)];
        const d = seaDist.get(hexKey(q, r)) ?? 0;
        let score = d + rand() * 4;
        if (h && isReliefRiverSource(h.terenBazowy)) score += 55;
        else if (h && isRiverLandTerrain(h.terenBazowy)) score += 12;
        return { q, r, d, score };
      })
      .filter((c) => c.d >= RIVER_MIN_INLAND_FROM_SEA)
      .sort((a, b) => b.score - a.score);

    let ok = false;
    for (const c of ranked) {
      if (tryPlace(c.q, c.r)) {
        placed++;
        ok = true;
        break;
      }
    }
    if (ok || cellSatisfied(land)) continue;

    const expanded = expandRiverSourceCandidates(land, massSet, 2);
    for (const [q, r] of expanded) {
      if (tryPlace(q, r)) {
        placed++;
        break;
      }
    }
    if (cellSatisfied(land)) continue;

    const fallbackRanked = land
      .filter(([q, r]) => !usedSources.has(hexKey(q, r)))
      .filter(([q, r]) => (seaDist.get(hexKey(q, r)) ?? 0) >= RIVER_MIN_INLAND_FROM_SEA)
      .slice(0, 6);
    for (const [q, r] of fallbackRanked.length > 0 ? fallbackRanked : land.slice(0, 4)) {
      if (tryPlace(q, r)) {
        placed++;
        break;
      }
    }
  }
  return placed;
}

/**
 * Generuje rzeki: rzadkie główne ujścia (BATCH 4) + dopływy siatkowe do sieci/morza + dekoracyjne dopływy.
 */
export function generateRivers(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
  rand: () => number,
  opts: {
    minLen?: number;
    maxLen?: number;
    margin?: number;
    riversTier?: DensityTier;
    worldTyp?: TypSwiata;
  } = {},
): GenerateRiversResult {
  const minLen = opts.minLen ?? 4;
  const maxLen = opts.maxLen ?? 40;
  const riversTier = opts.riversTier ?? 'medium';

  const seaDist = buildSeaDistanceField(hexes);
  // ZADANIE 2 (2026-07-20, uproszczenie): „u źródła" — jeden zbiór ocean-goal na CAŁY potok
  // rzek tej funkcji (isRiverDrainageGoal/canRiverDrainStep/pathEndsAtSea/pushMain wszystkie
  // dzielą TĘ SAMĄ zmienną `oceanConnected`), więc kryterium ujścia jest jednolite wszędzie.
  // Wybrzeże jest teraz WODĄ (ZADANIE 1) — cel ujścia to zwyczajnie KAŻDA woda (Morze ∪
  // Wybrzeże) połączona z krawędzią mapy; nie trzeba już „ostrzejszego" podzbioru
  // (dawne riverSeaGoalKeys/coastTouchingSeaKeys — usunięte, patrz historia zmian).
  const oceanConnected = oceanConnectedWaterKeys(hexes, width, height);
  const openOceanDist = buildOpenOceanDistanceField(hexes, width, height, oceanConnected);
  const riverPaths: RiverCoord[][] = [];
  const riverKinds: RiverPathKind[] = [];
  const usedSources = new Set<string>();

  const masses = groupLandMassKeys(hexes)
    .filter((m) => m.length >= 8)
    .sort((a, b) => b.length - a.length);

  const cellSize = riverCoverageCellSize(riversTier);
  const gridTraceMinLen = riverGridTraceMinLen(minLen, riversTier);
  const feederMinLen = Math.max(4, Math.min(gridTraceMinLen, 10));
  const minSourceSep = Math.max(2, Math.floor(cellSize * 0.75));

  const pushMain = (path: RiverCoord[], sq: number, sr: number): boolean => {
    // B0.8 I1: przechowuj DOKŁADNIE tę ścieżkę, której krawędzie oznaczamy. trimRiverPathRings
    // może skrócić bieg (Z3) — gdyby riverPaths dostało pełną ścieżkę, a mark tylko przyciętą,
    // przycięty ogon zostałby zapisany BEZ krawędzi → naruszenie ciągłości (I1).
    const trimmed = trimRiverPathRings(hexes, path);
    // B0.7: Z3 (trimRiverPathRings) mogl uciac ogon do morza -> nie zapisuj main bez ujscia (bezUjscia/sieroc).
    if (!pathEndsAtSea(hexes, trimmed, width, height, oceanConnected)) return false;
    // Maciej 2026-07-09: rzeka do MORZA min. RIVER_MIN_MAIN_LEN (dopływy do rzeki zwolnione — pushTributary).
    if (trimmed.length < RIVER_MIN_MAIN_LEN) return false;
    riverPaths.push(trimmed);
    riverKinds.push('main');
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, trimmed);
    return true;
  };

  const pushTributary = (path: RiverCoord[], sq: number, sr: number): boolean => {
    // B0.10 (Z3) NAJPIERW: utnij bieg zanim położy 4. krawędź na heksie (pierścień).
    let out = trimRiverPathRings(hexes, path);
    // B0.8 I2 PO przycięciu: domknij junction — dołóż 1 hex nurtu poniżej realnego końca
    // (krawędź junction→down jest już oznakowana przez główny nurt → 0 nowych krawędzi,
    // 0 pierścienia, hash terenu bez zmian). Kolejność append-po-trim chroni domknięcie
    // przed usunięciem przez przycinanie pierścieni (regres I2).
    if (out.length >= 2) {
      const junction = out[out.length - 1]!;
      const approach = out[out.length - 2]!;
      const down = networkDownstreamNeighbor(hexes, junction, approach);
      out = appendJunctionDownstreamHex(out, down);
    }
    riverPaths.push(out);
    riverKinds.push('tributary');
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, out);
    return true;
  };

  const tryPlaceGridRiver = (sq: number, sr: number): boolean => {
    const srcKey = hexKey(sq, sr);
    if (usedSources.has(srcKey)) return false;
    if (isTooCloseToRiverSource(sq, sr, usedSources, minSourceSep)) return false;
    if (openOceanDist.get(srcKey) == null) return false;

    const startDist = seaDist.get(srcKey) ?? 999;
    const traceMax = Math.max(maxLen, minLen + 24, Math.ceil(startDist * 2.8) + minLen);
    const path = traceRiver(hexes, sq, sr, traceMax, {
      seaDist,
      openOceanDist,
      oceanConnected,
      mapWidth: width,
      mapHeight: height,
      rand,
      minLen,
    });
    if (path.length < gridTraceMinLen) return false;
    if (!pathEndsAtSea(hexes, path, width, height, oceanConnected)) return false;
    if (!riverPathRespectsSeaBuffer(hexes, path, seaDist)) return false;
    return pushMain(path, sq, sr);
  };

  const tryPlaceFeederRiver = (sq: number, sr: number, junctionKeysOverride?: Set<string>): boolean => {
    const srcKey = hexKey(sq, sr);
    if (usedSources.has(srcKey)) return false;
    if (isTooCloseToRiverSource(sq, sr, usedSources, Math.max(2, Math.floor(minSourceSep * 0.55)))) {
      return false;
    }
    if (openOceanDist.get(srcKey) == null) return false;

    const startDist = seaDist.get(srcKey) ?? 999;
    const traceMax = Math.max(maxLen, minLen + 20, Math.ceil(startDist * 2.6) + minLen);
    const junctionKeys = junctionKeysOverride ?? (() => {
      const reach = buildOceanReachableRiverHexKeys(
        hexes, riverPaths, riverKinds, width, height, oceanConnected,
      );
      const pool = new Set<string>();
      for (const k of collectRiverPathHexKeys(riverPaths)) {
        if (reach.has(k)) pool.add(k);
      }
      return pool;
    })();

    if (junctionKeys.size === 0) {
      const seaPath = traceRiver(hexes, sq, sr, traceMax, {
        seaDist, openOceanDist, oceanConnected, mapWidth: width, mapHeight: height, rand, minLen,
      });
      if (seaPath.length >= feederMinLen
        && pathEndsAtSea(hexes, seaPath, width, height, oceanConnected)
        && riverPathRespectsSeaBuffer(hexes, seaPath, seaDist)) {
        return pushMain(seaPath, sq, sr);
      }
      return false;
    }

    let bestNetPath: RiverCoord[] = [];
    let bestNetLen = Infinity;
    for (const j of rankNetworkJunctionCandidates(sq, sr, junctionKeys, seaDist, traceMax, rand)) {
      const p = traceTributary(hexes, sq, sr, j.q, j.r, traceMax, seaDist, rand);
      if (p.length < 3 || p.length < feederMinLen - 2) continue;
      if (p.length < bestNetLen) {
        bestNetLen = p.length;
        bestNetPath = p;
      }
    }

    if (bestNetPath.length >= 3) {
      const needSeaCompare = bestNetLen > Math.min(traceMax * 0.5, startDist + 6);
      if (needSeaCompare) {
        const seaPath = traceRiver(hexes, sq, sr, traceMax, {
          seaDist, openOceanDist, oceanConnected, mapWidth: width, mapHeight: height, rand, minLen,
        });
        const seaOk = seaPath.length >= feederMinLen
          && pathEndsAtSea(hexes, seaPath, width, height, oceanConnected)
          && riverPathRespectsSeaBuffer(hexes, seaPath, seaDist);
        if (seaOk && seaPath.length < bestNetLen) {
          return pushMain(seaPath, sq, sr);
        }
      }
      return pushTributary(bestNetPath, sq, sr);
    }

    const seaPath = traceRiver(hexes, sq, sr, traceMax, {
      seaDist, openOceanDist, oceanConnected, mapWidth: width, mapHeight: height, rand, minLen,
    });
    if (seaPath.length >= feederMinLen
      && pathEndsAtSea(hexes, seaPath, width, height, oceanConnected)
      && riverPathRespectsSeaBuffer(hexes, seaPath, seaDist)) {
      return pushMain(seaPath, sq, sr);
    }
    return false;
  };

  // 1) Rzadkie główne ujścia — co stride×stride komórek siatki
  for (let pass = 0; pass < 6; pass++) {
    let passPlaced = 0;
    for (const mass of masses) {
      passPlaced += ensureMassRiverGridCoverage(
        hexes,
        new Set(mass),
        cellSize,
        seaDist,
        riverPaths,
        riverKinds,
        usedSources,
        tryPlaceGridRiver,
        rand,
        maxLen,
        { sparseMainOnly: true },
      );
    }
    if (passPlaced === 0) break;
  }

  // 2) Dopływy siatkowe — morze ALBO istniejąca sieć (mniej ujść)
  for (let pass = 0; pass < 3; pass++) {
    let passPlaced = 0;
    const reach = buildOceanReachableRiverHexKeys(
      hexes, riverPaths, riverKinds, width, height, oceanConnected,
    );
    const junctionKeys = new Set<string>();
    for (const k of collectRiverPathHexKeys(riverPaths)) {
      if (reach.has(k)) junctionKeys.add(k);
    }
    const tryFeeder = (sq: number, sr: number) => tryPlaceFeederRiver(sq, sr, junctionKeys);
    for (const mass of masses) {
      passPlaced += ensureMassRiverGridCoverage(
        hexes,
        new Set(mass),
        cellSize,
        seaDist,
        riverPaths,
        riverKinds,
        usedSources,
        tryFeeder,
        rand,
        maxLen,
        { requireRiverHex: true },
      );
    }
    if (passPlaced === 0) break;
  }

  // 3) Domknięcie resztek
  for (const mass of masses) {
    const massSet = new Set(mass);
    const minLand = minLandHexesForRiverCell(cellSize);
    for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
      if (land.length < minLand) continue;
      if (cellHasRiverHex(land, hexes)) continue;
      const reachable = land.some(([q, r]) => {
        const d = seaDist.get(hexKey(q, r)) ?? 999;
        return d >= 2 && d <= maxLen + 40;
      });
      if (!reachable) continue;
      for (const [q, r] of land) {
        if (openOceanDist.get(hexKey(q, r)) == null) continue;
        if (tryPlaceFeederRiver(q, r)) break;
      }
    }
  }

  // 4) Dopływy dekoracyjne wzdłuż długich głównych nurtów
  const pathCountBeforeDecor = riverPaths.length;
  for (let i = 0; i < pathCountBeforeDecor; i++) {
    if (riverKinds[i] !== 'main') continue;
    const path = riverPaths[i];
    if (!path || path.length < 10) continue;
    addTributariesForMainRiver(
      hexes, path, seaDist, rand, maxLen, riverPaths, riverKinds, usedSources, minSourceSep,
    );
  }

  return { paths: riverPaths, kinds: riverKinds };
}

/**
 * Domyka siatkę wody po finalnym terenie — dopływy do sieci (BATCH 4), nie nowe ujścia per komórkę.
 */
export function topUpRiverGridCoverage(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
  riverPaths: RiverCoord[][],
  riverKinds: RiverPathKind[],
  rand: () => number,
  riversTier: DensityTier = 'medium',
  minLen = 4,
  maxLen = 40,
): number {
  const seaDist = buildSeaDistanceField(hexes);
  // ZADANIE 2: ten sam zbiór co generateRivers — spójne kryterium ujścia (Morze ∪ Wybrzeże).
  const oceanConnected = oceanConnectedWaterKeys(hexes, width, height);
  const openOceanDist = buildOpenOceanDistanceField(hexes, width, height, oceanConnected);
  const usedSources = new Set<string>();
  for (let i = 0; i < riverPaths.length; i++) {
    const p0 = riverPaths[i]?.[0];
    if (p0) usedSources.add(hexKey(p0.q, p0.r));
  }

  const masses = groupLandMassKeys(hexes)
    .filter((m) => m.length >= 8)
    .sort((a, b) => b.length - a.length);
  // Z2: GĘSTSZA siatka dla top-upu → ~2× dopływów; ujścia bez zmian (główna siatka niżej niezmieniona).
  const cellSize = riverTributaryCellSize(riversTier);
  const gridTraceMinLen = riverGridTraceMinLen(minLen, riversTier);
  const feederMinLen = Math.max(4, Math.min(gridTraceMinLen, 10));
  const minSourceSep = Math.max(2, Math.floor(cellSize * 0.75));

  const pushMain = (path: RiverCoord[], sq: number, sr: number): boolean => {
    // B0.8 I1: przechowuj DOKŁADNIE tę ścieżkę, której krawędzie oznaczamy. trimRiverPathRings
    // może skrócić bieg (Z3) — gdyby riverPaths dostało pełną ścieżkę, a mark tylko przyciętą,
    // przycięty ogon zostałby zapisany BEZ krawędzi → naruszenie ciągłości (I1).
    const trimmed = trimRiverPathRings(hexes, path);
    // B0.7: Z3 (trimRiverPathRings) mogl uciac ogon do morza -> nie zapisuj main bez ujscia (bezUjscia/sieroc).
    if (!pathEndsAtSea(hexes, trimmed, width, height, oceanConnected)) return false;
    // Maciej 2026-07-09: rzeka do MORZA min. RIVER_MIN_MAIN_LEN (dopływy do rzeki zwolnione — pushTributary).
    if (trimmed.length < RIVER_MIN_MAIN_LEN) return false;
    riverPaths.push(trimmed);
    riverKinds.push('main');
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, trimmed);
    return true;
  };

  const pushTributary = (path: RiverCoord[], sq: number, sr: number): boolean => {
    // B0.10 (Z3) NAJPIERW: utnij bieg zanim położy 4. krawędź na heksie (pierścień).
    let out = trimRiverPathRings(hexes, path);
    // B0.8 I2 PO przycięciu: domknij junction — dołóż 1 hex nurtu poniżej realnego końca
    // (krawędź junction→down jest już oznakowana przez główny nurt → 0 nowych krawędzi,
    // 0 pierścienia, hash terenu bez zmian). Kolejność append-po-trim chroni domknięcie
    // przed usunięciem przez przycinanie pierścieni (regres I2).
    if (out.length >= 2) {
      const junction = out[out.length - 1]!;
      const approach = out[out.length - 2]!;
      const down = networkDownstreamNeighbor(hexes, junction, approach);
      out = appendJunctionDownstreamHex(out, down);
    }
    riverPaths.push(out);
    riverKinds.push('tributary');
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, out);
    return true;
  };

  const tryPlaceFeederRiver = (sq: number, sr: number, junctionKeysOverride?: Set<string>): boolean => {
    const srcKey = hexKey(sq, sr);
    if (usedSources.has(srcKey)) return false;
    if (isTooCloseToRiverSource(sq, sr, usedSources, Math.max(2, Math.floor(minSourceSep * 0.55)))) {
      return false;
    }
    if (openOceanDist.get(srcKey) == null) return false;

    const startDist = seaDist.get(srcKey) ?? 999;
    const traceMax = Math.max(maxLen, minLen + 20, Math.ceil(startDist * 2.6) + minLen);
    const junctionKeys = junctionKeysOverride ?? (() => {
      const reach = buildOceanReachableRiverHexKeys(
        hexes, riverPaths, riverKinds, width, height, oceanConnected,
      );
      const pool = new Set<string>();
      for (const k of collectRiverPathHexKeys(riverPaths)) {
        if (reach.has(k)) pool.add(k);
      }
      return pool;
    })();

    if (junctionKeys.size === 0) {
      const seaPath = traceRiver(hexes, sq, sr, traceMax, {
        seaDist, openOceanDist, oceanConnected, mapWidth: width, mapHeight: height, rand, minLen,
      });
      if (seaPath.length >= feederMinLen
        && pathEndsAtSea(hexes, seaPath, width, height, oceanConnected)
        && riverPathRespectsSeaBuffer(hexes, seaPath, seaDist)) {
        return pushMain(seaPath, sq, sr);
      }
      return false;
    }

    let bestNetPath: RiverCoord[] = [];
    let bestNetLen = Infinity;
    for (const j of rankNetworkJunctionCandidates(sq, sr, junctionKeys, seaDist, traceMax, rand)) {
      const p = traceTributary(hexes, sq, sr, j.q, j.r, traceMax, seaDist, rand);
      if (p.length < 3 || p.length < feederMinLen - 2) continue;
      if (p.length < bestNetLen) {
        bestNetLen = p.length;
        bestNetPath = p;
      }
    }

    if (bestNetPath.length >= 3) {
      const needSeaCompare = bestNetLen > Math.min(traceMax * 0.5, startDist + 6);
      if (needSeaCompare) {
        const seaPath = traceRiver(hexes, sq, sr, traceMax, {
          seaDist, openOceanDist, oceanConnected, mapWidth: width, mapHeight: height, rand, minLen,
        });
        const seaOk = seaPath.length >= feederMinLen
          && pathEndsAtSea(hexes, seaPath, width, height, oceanConnected)
          && riverPathRespectsSeaBuffer(hexes, seaPath, seaDist);
        if (seaOk && seaPath.length < bestNetLen) return pushMain(seaPath, sq, sr);
      }
      return pushTributary(bestNetPath, sq, sr);
    }

    const seaPath = traceRiver(hexes, sq, sr, traceMax, {
      seaDist, openOceanDist, oceanConnected, mapWidth: width, mapHeight: height, rand, minLen,
    });
    if (seaPath.length >= feederMinLen
      && pathEndsAtSea(hexes, seaPath, width, height, oceanConnected)
      && riverPathRespectsSeaBuffer(hexes, seaPath, seaDist)) {
      return pushMain(seaPath, sq, sr);
    }
    return false;
  };

  let placed = 0;
  for (let pass = 0; pass < 5; pass++) {
    let passPlaced = 0;
    const reach = buildOceanReachableRiverHexKeys(
      hexes, riverPaths, riverKinds, width, height, oceanConnected,
    );
    const junctionKeys = new Set<string>();
    for (const k of collectRiverPathHexKeys(riverPaths)) {
      if (reach.has(k)) junctionKeys.add(k);
    }
    const tryFeeder = (sq: number, sr: number) => tryPlaceFeederRiver(sq, sr, junctionKeys);
    for (const mass of masses) {
      passPlaced += ensureMassRiverGridCoverage(
        hexes,
        new Set(mass),
        cellSize,
        seaDist,
        riverPaths,
        riverKinds,
        usedSources,
        tryFeeder,
        rand,
        maxLen,
        { requireRiverHex: true },
      );
    }
    placed += passPlaced;
    if (passPlaced === 0) break;
  }
  return placed;
}

// ===========================================================================
// 6. Zloza mineralne — reguly per teren
// ===========================================================================

/**
 * Hex z opcjonalnym polem `zloze` na potrzeby zloz nie majacych reprezentacji
 * w enumie Nakladka (np. wegiel). Pole jest OPCJONALNE i wstecznie zgodne —
 * nie wymaga zmiany typu Hex w src/types/hex.ts. Kod nie znajacy `zloze`
 * dziala bez zmian.
 */
export type HexWithZloze = Hex & { zloze?: string; zlozeMinEra?: number };

/**
 * Regula zloza: jaka Nakladke (lub znacznik `zloze`) i na jakim terenie.
 * - miedz / zelazo -> hex.zloze na Gory (widocznosc per epoka — deposit-era.ts)
 * - glina -> Nakladka.ZlozeGliny na Laka lub ląd z rzeką (NIE woda/wybrzeże)
 * - konie -> Nakladka.ZlozeKonia na Rownina
 * - owce -> Nakladka.ZlozeOwiec na Wzgórza (złoże = ulepszenie owce)
 * - bydlo -> Nakladka.ZlozeBydla na Łąka/Równina (złoże = ulepszenie bydło)
 * - wegiel-> hex.zloze='wegiel' na Gory
 * - sol   -> hex.zloze='sol' na Pustynia/Rownina (NIE wybrzeże — woda bez surowców)
 * Bydło / owce — złoże na mapie = implicit ulepszenie hodowli (render + plony).
 * Morze/wybrzeże: brak złóż; ryby = przyszłe ulepszenie „łodzie rybackie”, nie nakładka.
 */
export interface DepositRule {
  id: 'miedz' | 'zelazo' | 'glina' | 'konie' | 'wegiel' | 'owce' | 'bydlo' | 'sol';
  /** Wartosc Nakladka do ustawienia (lub null gdy uzywamy pola `zloze`). */
  nakladka: Nakladka | null;
  /** Predykat: czy ten heks moze przyjac to zloze. */
  allowedOn: (hex: Hex) => boolean;
  /**
   * Gdy true — dodatkowo wymaga, by heks byl LADEM najblizszym wybrzeza
   * (suchy lad graniczacy z plytkim morzem/Wybrzezem — isCoastalLandHex).
   * C-MAP-SOL-ZIEMIA=B (Maciej 2026-07-25): tak zdefiniowane wybrzeze dziala
   * takze na mapie Ziemia (brak kafli Wybrzeze, ale jest lad przy Morzu).
   */
  requiresCoastalLand?: boolean;
  /** Rzadkosc: ulamek pasujacych heksow, ktore dostana zloze (0..1). */
  rarity: number;
}

/** Predykaty terenu dla zloz (eksport — uzywane w testach). */
const BASE_DEPOSIT_RULES: DepositRule[] = [
  {
    id: 'miedz',
    nakladka: null,
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy) && h.terenBazowy === TerenBazowy.Wzgorza,
    rarity: 0.10,
  },
  {
    id: 'zelazo',
    nakladka: null,
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy) && h.terenBazowy === TerenBazowy.Gory,
    rarity: 0.08,
  },
  {
    id: 'glina',
    nakladka: Nakladka.ZlozeGliny,
    // TEMAT 12 (2026-07-24, Maciej): glina TYLKO przy rzece — gałąź "Łąka bez rzeki" usunięta.
    // placeDeposits() jest teraz wołane PO generateRivers (generator.ts), więc h.rzeka.obecna
    // odzwierciedla finalny stan rzek, nie "zawsze false" jak dawniej.
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy) && h.rzeka?.obecna === true,
    rarity: 0.10,
  },
  {
    id: 'konie',
    nakladka: Nakladka.ZlozeKonia,
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy) && h.terenBazowy === TerenBazowy.Rownina,
    rarity: 0.10,
  },
  {
    id: 'wegiel',
    nakladka: null, // brak w enumie Nakladka -> znacznik hex.zloze
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy) && h.terenBazowy === TerenBazowy.Gory,
    rarity: 0.10,
  },
  // Model B (Maciej 2026-07-09): USUNIĘTE złoża owiec/bydła (ZlozeOwiec/ZlozeBydla) — hodowla to
  // teraz CZYSTE ulepszenie (Owczarnia/Pastwisko), budowane jak farma, nie surowiec na mapie.
  // Koń (wyżej) zostaje surowcem. Zmienia hash mapy (zamierzone).
  {
    id: 'sol',
    nakladka: null,
    // C-MAP-SOL-ZIEMIA=B (Maciej 2026-07-25): sól na LĄDZIE najbliższym wybrzeża
    // (suchy ląd graniczący z płytkim morzem/Wybrzeżem), NIE na osobnym kaflu Wybrzeże.
    // Ta definicja działa też na mapie Ziemia (brak kafli Wybrzeże, ale jest ląd przy Morzu).
    // Koniunkcja: allowedOn (suchy ląd) + requiresCoastalLand (isCoastalLandHex w placeDeposits).
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy),
    requiresCoastalLand: true,
    rarity: 0.12,
  },
];

const _depositRarities = mapGenAllDepositRarities();
export const DEPOSIT_RULES: DepositRule[] = BASE_DEPOSIT_RULES.map((rule) => {
  const rarity = _depositRarities[rule.id];
  return typeof rarity === 'number' ? { ...rule, rarity } : rule;
});

/**
 * Rozmieszcza zloza mineralne deterministycznie i rzadko.
 *
 * Zasady (par. reguly powyzej):
 *   - kazdy heks moze miec NAJWYZEJ jedno zloze;
 *   - las (Nakladka.Las) nie jest nadpisywany (zloze tylko na "Brak");
 *   - dla danego ziarna wynik jest identyczny (sortowanie po kluczu + PRNG).
 *
 * Mutuje hexes: ustawia hex.nakladka (ruda/glina/konie) albo hex.zloze (wegiel).
 * Zwraca licznik rozmieszczonych zloz per typ.
 *
 * @param hexes mapa heksow do zmodyfikowania
 * @param seed  ziarno deterministyczne (oddzielny strumien od reszty generacji)
 * @param rules reguly zloz (domyslnie DEPOSIT_RULES)
 */
export function placeDeposits(
  hexes: Record<string, Hex>,
  seed: number,
  rules: DepositRule[] = DEPOSIT_RULES,
  resourceMult = 1,
  baselineMult = 1,
): Record<string, number> {
  // Wlasny, oddzielny strumien losowy — niezalezny od kolejnosci innych rand().
  const rand = mulberry32((seed ^ 0x9e3779b9) >>> 0);

  // Deterministyczna kolejnosc iteracji: sortuj klucze "q,r" numerycznie.
  const keys = Object.keys(hexes).sort((a, b) => {
    const [aq, ar] = a.split(',').map(Number);
    const [bq, br] = b.split(',').map(Number);
    return aq !== bq ? (aq! - bq!) : (ar! - br!);
  });

  const counts: Record<string, number> = {
    miedz: 0, zelazo: 0, glina: 0, konie: 0, wegiel: 0,
    owce: 0, bydlo: 0, sol: 0,
  };

  for (const key of keys) {
    const hex = hexes[key] as HexWithZloze | undefined;
    if (!hex) continue;
    // Nie nadpisuj lasu ani istniejacych nakladek; jedno zloze na heks.
    if (hex.nakladka !== Nakladka.Brak) continue;
    if (hex.zloze) continue;
    // Woda nigdy nie dostaje złoża. C-MAP-SOL-ZIEMIA=B: sól nie jest już na kaflu Wybrzeże,
    // tylko na LĄDZIE przy wybrzeżu (requiresCoastalLand niżej) — więc Wybrzeże, jak Morze,
    // jest wykluczone dla wszystkich złóż.
    if (hex.terenBazowy === TerenBazowy.Morze || hex.terenBazowy === TerenBazowy.Wybrzeze) continue;

    const [depQ, depR] = key.split(',').map(Number) as [number, number];
    for (const rule of rules) {
      if (!rule.allowedOn(hex)) continue;
      // C-MAP-SOL-ZIEMIA=B: reguła „ląd przy wybrzeżu" (sól) — suchy ląd graniczący z wodą.
      if (rule.requiresCoastalLand && !isCoastalLandHex(hexes, depQ, depR)) continue;
      // Rzut PRNG dla kazdej pasujacej reguly — deterministyczny przy danym seed.
      if (rand() < Math.min(1, rule.rarity * baselineMult * resourceMult)) {
        if (rule.nakladka !== null) {
          hex.nakladka = rule.nakladka;
        } else {
          hex.zloze = rule.id;
        }
        counts[rule.id] = (counts[rule.id] ?? 0) + 1;
        break; // jedno zloze na heks
      }
    }
  }

  // Metadane epoki dla metali (E-P0-04/05)
  for (const hex of Object.values(hexes) as HexWithZloze[]) {
    if (!hex.zloze) continue;
    const z = hex.zloze.trim().toLowerCase();
    if (z === 'miedz' && hex.zlozeMinEra == null) hex.zlozeMinEra = 2;
    if (z === 'zelazo' && hex.zlozeMinEra == null) hex.zlozeMinEra = 3;
  }

  return counts;
}

/** Pakiet surowców wymagany w każdej komórce siatki fair play (Maciej 2026-07-04). Konie wyłączone — mają być rzadkie. */
export const FAIR_PLAY_DEPOSIT_IDS: ReadonlyArray<DepositRule['id']> = [
  'zelazo', 'miedz', 'glina', // Model B: bydlo/owce usunięte (hodowla = ulepszenie, nie złoże)
];

function depositRuleById(id: DepositRule['id']): DepositRule {
  const rule = DEPOSIT_RULES.find((r) => r.id === id);
  if (!rule) throw new Error(`Brak reguły złoża: ${id}`);
  return rule;
}

function hexCarriesDepositType(hex: HexWithZloze, id: DepositRule['id']): boolean {
  const rule = depositRuleById(id);
  if (rule.nakladka !== null) return hex.nakladka === rule.nakladka;
  return hex.zloze === id;
}

function cellCarriesDepositType(
  cellLand: Array<[number, number]>,
  hexes: Record<string, Hex>,
  id: DepositRule['id'],
): boolean {
  for (const [q, r] of cellLand) {
    const hex = hexes[hexKey(q, r)] as HexWithZloze | undefined;
    if (hex && hexCarriesDepositType(hex, id)) return true;
  }
  return false;
}

function hexCanAcceptDeposit(
  hex: HexWithZloze,
  rule: DepositRule,
  allowForestClear: boolean,
): boolean {
  if (hex.terenBazowy === TerenBazowy.Morze) return false;
  // C-MAP-SOL-ZIEMIA=B: żadne złoże nie ląduje na wodzie (sól jest teraz na LĄDZIE przy
  // wybrzeżu, nie na kaflu Wybrzeże) — Wybrzeże, jak Morze, wykluczone dla wszystkich złóż.
  if (hex.terenBazowy === TerenBazowy.Wybrzeze) return false;
  if (hex.zloze) return false;
  if (hex.nakladka !== Nakladka.Brak) {
    if (!allowForestClear || hex.nakladka !== Nakladka.Las) return false;
  }
  return rule.allowedOn(hex);
}

function forceDepositOnHex(hex: HexWithZloze, rule: DepositRule): void {
  if (hex.nakladka === Nakladka.Las) hex.nakladka = Nakladka.Brak;
  if (rule.nakladka !== null) {
    hex.nakladka = rule.nakladka;
  } else {
    hex.zloze = rule.id;
  }
  if (rule.id === 'miedz' && hex.zlozeMinEra == null) hex.zlozeMinEra = 2;
  if (rule.id === 'zelazo' && hex.zlozeMinEra == null) hex.zlozeMinEra = 3;
}

function prepareTerrainForDeposit(hex: Hex, rule: DepositRule): void {
  hex.nakladka = Nakladka.Brak;
  delete (hex as HexWithZloze).zloze;
  switch (rule.id) {
    case 'zelazo':
    case 'wegiel':
      hex.terenBazowy = TerenBazowy.Gory;
      break;
    case 'miedz':
    case 'owce':
      hex.terenBazowy = TerenBazowy.Wzgorza;
      break;
    // TEMAT 12: 'glina' NIE wymusza już terenu — reguła glina.allowedOn nie zależy od typu
    // terenu (tylko od isDryLandTerrain + rzeka.obecna), więc wymuszanie Łąki tutaj było
    // bez sensu (i tak nie gwarantowało rzeki). Bootstrap (pickDepositBootstrapHex) po prostu
    // zostawia teren hexa bez zmian.
    case 'konie':
      hex.terenBazowy = TerenBazowy.Rownina;
      break;
    case 'bydlo':
      hex.terenBazowy = TerenBazowy.Laka;
      break;
    // C-MAP-SOL-ZIEMIA=B: 'sol' nie wymusza terenu — jest na istniejącym LĄDZIE przy wybrzeżu
    // (i tak nie jest w FAIR_PLAY_DEPOSIT_IDS, więc ta ścieżka forsowania soli nie dotyczy).
    default:
      break;
  }
}

function pickDepositBootstrapHex(
  land: Array<[number, number]>,
  hexes: Record<string, Hex>,
  rule: DepositRule,
  rand: () => number,
): [number, number] | null {
  const ranked = land
    .filter(([q, r]) => {
      const hex = hexes[hexKey(q, r)];
      return hex && hex.terenBazowy !== TerenBazowy.Morze && hex.terenBazowy !== TerenBazowy.Wybrzeze;
    })
    .map(([q, r]) => ({ q, r, score: rand() }))
    .sort((a, b) => b.score - a.score);
  if (ranked.length === 0) return null;
  const spot = ranked[0]!;
  prepareTerrainForDeposit(hexes[hexKey(spot.q, spot.r)]!, rule);
  // TEMAT 12 (2026-07-24): USUNIĘTA fabrykacja fałszywej rzeka.obecna=true na hexie bez
  // prawdziwej geometrii rzeki (brak krawedzie) — psuło render/logikę (hex „z rzeką" bez
  // koryta). Bootstrap gliny może więc wylądować na hexie bez rzeki (rzadki fallback fair-play,
  // gdy cała komórka nie ma ani jednego hexa z prawdziwą rzeką) — akceptowalny wyjątek.
  return [spot.q, spot.r];
}

function forceDepositInCell(
  land: Array<[number, number]>,
  hexes: Record<string, Hex>,
  id: DepositRule['id'],
  rand: () => number,
): boolean {
  if (cellCarriesDepositType(land, hexes, id)) return false;
  const rule = depositRuleById(id);
  let spot = pickDepositForceHex(land, hexes, rule, rand);
  if (!spot) spot = pickDepositBootstrapHex(land, hexes, rule, rand);
  if (!spot) return false;
  forceDepositOnHex(hexes[hexKey(spot[0], spot[1])]! as HexWithZloze, rule);
  return true;
}

function pickDepositForceHex(
  land: Array<[number, number]>,
  hexes: Record<string, Hex>,
  rule: DepositRule,
  rand: () => number,
): [number, number] | null {
  const tryPick = (allowForestClear: boolean): [number, number] | null => {
    const ranked = land
      .filter(([q, r]) => {
        const hex = hexes[hexKey(q, r)] as HexWithZloze | undefined;
        return hex != null && hexCanAcceptDeposit(hex, rule, allowForestClear);
      })
      .map(([q, r]) => {
        let score = 0;
        const hex = hexes[hexKey(q, r)]!;
        if (rule.id === 'glina' && hex.rzeka?.obecna) score += 2;
        if (rule.id === 'glina' && hex.terenBazowy === TerenBazowy.Laka) score += 1;
        score += rand() * 0.2;
        return { q, r, score };
      })
      .sort((a, b) => b.score - a.score);
    if (ranked.length === 0) return null;
    return [ranked[0]!.q, ranked[0]!.r];
  };
  return tryPick(false) ?? tryPick(true);
}

function cellHasForest(
  cellLand: Array<[number, number]>,
  hexes: Record<string, Hex>,
): boolean {
  for (const [q, r] of cellLand) {
    if (hexes[hexKey(q, r)]?.nakladka === Nakladka.Las) return true;
  }
  return false;
}

export function depositGridCoverageRatio(
  massLandKeys: string[],
  hexes: Record<string, Hex>,
  cellSize: number,
  required: ReadonlyArray<DepositRule['id']> = FAIR_PLAY_DEPOSIT_IDS,
): number {
  const massSet = new Set(massLandKeys);
  const minLand = minLandHexesForFairPlayCell(cellSize);
  let need = 0;
  let hit = 0;
  for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
    if (land.length < minLand) continue;
    need++;
    const ok = required.every((id) => cellCarriesDepositType(land, hexes, id));
    if (ok) hit++;
  }
  return need > 0 ? hit / need : 1;
}

/**
 * Po placeDeposits: w każdej komórce N×N min. pakiet surowców (żelazo, miedź, glina, bydło, owce).
 */
export function ensureDepositGridCoverage(
  hexes: Record<string, Hex>,
  tier: DensityTier | ReliefDensityTier,
  typ: TypSwiata,
  continentOf: Map<string, number> | null,
  nContinents: number,
  rand: () => number,
): number {
  const cellSize = fairPlayResourceCellSize(tier);
  const minLand = minLandHexesForFairPlayCell(cellSize);
  const partitions = landPartitionKeysForDistribution(hexes, typ, continentOf, nContinents);
  let fixed = 0;

  for (const part of partitions) {
    const massSet = new Set(part.filter((k) => hexes[k]?.terenBazowy !== TerenBazowy.Morze));
    for (let pass = 0; pass < 6; pass++) {
      let passFixed = 0;
      for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
        if (land.length < minLand) continue;
        for (const id of FAIR_PLAY_DEPOSIT_IDS) {
          if (forceDepositInCell(land, hexes, id, rand)) passFixed++;
        }
      }
      fixed += passFixed;
      if (passFixed === 0) break;
    }
  }
  return fixed;
}

export function forestGridCoverageRatio(
  massLandKeys: string[],
  hexes: Record<string, Hex>,
  cellSize: number = forestCoverageCellSize('medium'),
): number {
  const massSet = new Set(massLandKeys);
  const minLand = minLandHexesForFairPlayCell(cellSize);
  let need = 0;
  let hit = 0;
  for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
    if (land.length < minLand) continue;
    need++;
    if (cellHasForest(land, hexes)) hit++;
  }
  return need > 0 ? hit / need : 1;
}

/**
 * Po złożach: min. 1 las w komórce 10×10 (jeśli jest heks kwalifikujący się na las).
 */
export function ensureForestGridCoverage(
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  forestTier: DensityTier,
  _typ: TypSwiata,
  _continentOf: Map<string, number> | null,
  _nContinents: number,
  rand: () => number,
): number {
  const cellSize = forestCoverageCellSize(forestTier);
  const minLand = minLandHexesForFairPlayCell(cellSize);
  const masses = groupLandMassKeys(hexes)
    .filter((m) => m.length >= 8)
    .sort((a, b) => b.length - a.length);
  let fixed = 0;

  for (let outer = 0; outer < 4; outer++) {
    let passFixed = 0;
    for (const mass of masses) {
      const massSet = new Set(mass);
      for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
        if (land.length < minLand || cellHasForest(land, hexes)) continue;
        const eligible = land
          .filter(([q, r]) => {
            const h = hexes[hexKey(q, r)];
            return h && isForestEligibleTerrain(h.terenBazowy) && h.nakladka === Nakladka.Brak;
          })
          .map(([q, r]) => ({
            q,
            r,
            score: (scratch.get(hexKey(q, r))?.forNoise ?? 0) + rand() * 0.15,
          }))
          .sort((a, b) => b.score - a.score);
        if (eligible.length === 0) continue;
        const spot = eligible[0]!;
        hexes[hexKey(spot.q, spot.r)]!.nakladka = Nakladka.Las;
        passFixed++;
      }
    }
    fixed += passFixed;
    if (passFixed === 0) break;
  }
  return fixed;
}

/**
 * Usuwa nakładki/złoża z morza i wybrzeża (bezpiecznik po generacji).
 * C-MAP-SOL-ZIEMIA=B (2026-07-25): sól jest teraz na LĄDZIE przy wybrzeżu, nie na kaflu
 * Wybrzeże — więc woda (Morze i Wybrzeże) jest zawsze czyszczona ze wszystkich złóż, bez wyjątków.
 */
export function stripDepositsFromWater(hexes: Record<string, Hex>): number {
  let n = 0;
  for (const hex of Object.values(hexes) as HexWithZloze[]) {
    if (hex.terenBazowy !== TerenBazowy.Morze && hex.terenBazowy !== TerenBazowy.Wybrzeze) continue;
    const had = hex.nakladka !== Nakladka.Brak || !!hex.zloze;
    hex.nakladka = Nakladka.Brak;
    delete hex.zloze;
    if (had) n++;
  }
  return n;
}

/** Liczy złoża/nakładki surowcowe na morzu lub wybrzeżu (0 = OK). C-MAP-SOL-ZIEMIA=B: bez wyjątków. */
export function countDepositsOnWater(hexes: Record<string, Hex>): number {
  let n = 0;
  for (const hex of Object.values(hexes) as HexWithZloze[]) {
    if (hex.terenBazowy !== TerenBazowy.Morze && hex.terenBazowy !== TerenBazowy.Wybrzeze) continue;
    if (hex.nakladka !== Nakladka.Brak || hex.zloze) n++;
  }
  return n;
}

// ===========================================================================
// 7. Pozycje startowe — Poisson-disk-like, deterministyczne, zbalansowane
// ===========================================================================

/** Pojedyncza pozycja startowa na ladzie. */
export interface StartPosition {
  q: number;
  r: number;
}

/**
 * Zwraca >= minCount pozycji startowych na ladzie, parami oddalonych
 * o co najmniej minDist (heks-distance). Deterministyczne dla danego seed.
 *
 * Algorytm (Poisson-disk-like, zachlanny):
 *   1. Zbierz wszystkie ladowe heksy (isLandTerrain), posortuj deterministycznie.
 *   2. Przetasuj Fishera-Yatesa seedowanym PRNG (rownomierny rozrzut, nie tylko
 *      lewy-gorny rog).
 *   3. Zachlannie dodawaj kandydatow oddalonych >= minDist od juz wybranych.
 *   4. Jesli nie uzbierano minCount, stopniowo luzuj minDist (>= absMinDist),
 *      by zawsze zwrocic minCount pozycji (o ile na mapie jest tyle ladu).
 *
 * @returns posortowana wg q,r lista pozycji (stabilna kolejnosc wyjscia).
 */
export function computeStartPositions(
  hexes: Record<string, Hex>,
  seed: number,
  opts: { minCount?: number; minDist?: number; absMinDist?: number } = {},
): StartPosition[] {
  const minCount   = opts.minCount ?? 5;
  const minDist    = opts.minDist ?? 5;
  const absMinDist = opts.absMinDist ?? 2;

  // 1. Ladowe heksy w deterministycznej kolejnosci.
  const land: StartPosition[] = [];
  const keys = Object.keys(hexes).sort((a, b) => {
    const [aq, ar] = a.split(',').map(Number);
    const [bq, br] = b.split(',').map(Number);
    return aq !== bq ? (aq! - bq!) : (ar! - br!);
  });
  for (const key of keys) {
    const hex = hexes[key];
    if (hex && isLandTerrain(hex.terenBazowy)) {
      land.push({ q: hex.coords.q, r: hex.coords.r });
    }
  }
  if (land.length === 0) return [];

  // 2. Seedowane tasowanie (oddzielny strumien losowy).
  const rand = mulberry32((seed ^ 0x85ebca6b) >>> 0);
  const shuffled = land.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = shuffled[i]!; shuffled[i] = shuffled[j]!; shuffled[j] = tmp;
  }

  // 3/4. Zachlanny dobor z luzowaniem minDist az do minCount.
  function greedyPick(dist: number): StartPosition[] {
    const picked: StartPosition[] = [];
    for (const c of shuffled) {
      const tooClose = picked.some(p => hexDistanceAxial(c.q, c.r, p.q, p.r) < dist);
      if (!tooClose) picked.push(c);
    }
    return picked;
  }

  let result: StartPosition[] = [];
  for (let d = minDist; d >= absMinDist; d--) {
    result = greedyPick(d);
    if (result.length >= minCount) {
      // Przytnij do "ladnej" liczby, ale zachowaj te z najwyzszym dystansem:
      // greedyPick juz daje pozycje >= d; zostawiamy wszystkie >= minCount.
      break;
    }
  }

  // Jesli nawet przy absMinDist nie ma minCount (bardzo malo ladu),
  // dolacz pozostale ladowe heksy zachowujac maksymalny mozliwy rozrzut.
  if (result.length < minCount) {
    const have = new Set(result.map(p => hexKey(p.q, p.r)));
    for (const c of shuffled) {
      if (result.length >= minCount) break;
      const k = hexKey(c.q, c.r);
      if (!have.has(k)) { result.push(c); have.add(k); }
    }
  }

  // Stabilna kolejnosc wyjscia: sortuj wg q,r.
  result.sort((a, b) => (a.q !== b.q ? a.q - b.q : a.r - b.r));
  return result;
}
