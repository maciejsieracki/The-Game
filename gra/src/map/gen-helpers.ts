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
  mapGenReliefOverflowCapFrac,
} from '../data/map-gen-params-loader';
import {
  resolveRiverMapParams,
  riverGridCellSizeForTier,
  riverMapAreaScale,
  mapSizeLabelFromDims,
  type DensityTier,
  type RiverMapParams,
} from './newGameMapDefaults';
import { isRiverGenFull, isRiverGenMainOnly } from './riverGenSwitch';

export type { RiverMapParams };
import { earthPolarOceanRows, earthTemplateLandAt } from './earth-land-mask';

// ===========================================================================
// 0. TYP SWIATA
// ===========================================================================

/**
 * Typ swiata okreslajacy ksztalt ladu.
 *   - 'kontynenty': kilka wiekszych, oddzielnych mas ladowych (domyslny).
 *   - 'pangea'    : jedna nieregularna masa z ~5 blobów w centrum (FALA 187).
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

/**
 * True dla terenu wodnego (Morze / PlytkieMorze). Samodzielna kopia — spójna z
 * isWaterTerrain() z units/setup.ts, ale nie importowana stamtąd: gen-helpers.ts
 * jest częścią bundla generatora mapy uruchamianego w Web Workerze (genWorker.ts),
 * który celowo NIE ciągnie za sobą units/setup.ts (patrz komentarz przy
 * hexDistanceAxial wyżej — ten sam wzorzec, ten sam powód).
 * P-MAPGEN-PANGEA-OBRYS-P4-WYBRZEZE-Q1 (2026-09-03): wprowadzona, by przepiąć na nią
 * ręczne porównania `=== TerenBazowy.Morze`, które pomijały PlytkieMorze jako wodę —
 * dokładnie ten błąd ujawniła metryka kształtu Pangei (groupLandMassKeys niżej).
 */
function isWaterTerrainLocal(tb: TerenBazowy): boolean {
  return tb === TerenBazowy.Morze || tb === TerenBazowy.PlytkieMorze;
}

/** Klucz heksa "q,r" — zgodny z GameMap.hexes. */
export function hexKey(q: number, r: number): string {
  return `${q},${r}`;
}

/** @deprecated Używaj {@link ClimateBand} — zachowane dla kompatybilności renderu las-dżungla. */
export type ClimateZone = 'arid' | 'tropical' | 'temperate';

/**
 * Pas klimatyczny wzdłuż osi r (C-MAP-Q3, 2026-07-27).
 * Procenty wysokości mapy od północy (r=0) do południa (r=height−1).
 */
export type ClimateBand =
  | 'polar_north'
  | 'temperate_north'
  | 'plains_north'
  | 'desert'
  | 'plains_south'
  | 'temperate_south'
  | 'polar_south';

/** Polar 5% góra + 5% dół. */
export const CLIMATE_POLAR_FRAC = 0.05;
/** Pustynia środkowa — połowa szerokości w wierszach heksów (~7 hex łącznie, Maciej 2026-07-31). */
export const CLIMATE_DESERT_HALF_ROWS = 3.5;
/** Przybliżenie dla mapy standardowej (innerH≈108); runtime używa CLIMATE_DESERT_HALF_ROWS/innerH. */
export const CLIMATE_DESERT_HALF_FRAC = CLIMATE_DESERT_HALF_ROWS / 108;
/** Równiny po obu stronach pustyni — po 15% wysokości (±7.5% od środka). */
export const CLIMATE_PLAINS_HALF_FRAC = 0.075;

/** Bufor oceanu u góry/dołu mapy proceduralnej — 5% wysokości (C-MAP-Q3c). */
export const CLIMATE_PROCEDURAL_LAT_BUFFER_FRAC = 0.05;

/**
 * Pas klimatyczny heksa — ułamek wiersza r w **obszarze grywalnym** (po buforze oceanu N/S).
 * Kolejność od północy: polar 5% · umiarkowany · równiny 15% · pustynia ~7 hex · równiny 15% · umiarkowany · polar 5%.
 */
export function climateBandAt(_q: number, r: number, height: number, isEarth = false): ClimateBand {
  const buf = latitudinalOceanBufferRows(height, isEarth);
  const innerH = Math.max(1, height - 2 * buf);
  const relR = (r - buf) / Math.max(1, innerH - 1);
  if (relR < 0 || relR > 1) {
    return r < height / 2 ? 'polar_north' : 'polar_south';
  }
  const desertHalfFrac = CLIMATE_DESERT_HALF_ROWS / innerH;
  const center = 0.5;
  const desertLo = center - desertHalfFrac;
  const desertHi = center + desertHalfFrac;
  const plainsNorthLo = desertLo - CLIMATE_PLAINS_HALF_FRAC;
  const plainsSouthHi = desertHi + CLIMATE_PLAINS_HALF_FRAC;
  if (relR < CLIMATE_POLAR_FRAC) return 'polar_north';
  if (relR < plainsNorthLo) return 'temperate_north';
  if (relR < desertLo) return 'plains_north';
  if (relR < desertHi) return 'desert';
  if (relR < plainsSouthHi) return 'plains_south';
  if (relR < 1 - CLIMATE_POLAR_FRAC) return 'temperate_south';
  return 'polar_south';
}

/** Kompatybilność wsteczna (render dżungli itd.). */
export function climateZoneAt(q: number, r: number, height: number, isEarth = false): ClimateZone {
  const band = climateBandAt(q, r, height, isEarth);
  if (band === 'desert') return 'arid';
  if (band === 'plains_south' || band === 'plains_north') return 'tropical';
  return 'temperate';
}

export function isPolarClimateBand(band: ClimateBand): boolean {
  return band === 'polar_north' || band === 'polar_south';
}

/** Wiersze oceanu wymuszone u góry i dołu mapy. */
export function latitudinalOceanBufferRows(height: number, isEarth: boolean): number {
  if (isEarth) return earthPolarOceanRows(height);
  return Math.max(2, Math.round(height * CLIMATE_PROCEDURAL_LAT_BUFFER_FRAC));
}

export function isInLatitudinalOceanBuffer(r: number, height: number, isEarth: boolean): boolean {
  const buf = latitudinalOceanBufferRows(height, isEarth);
  return r < buf || r >= height - buf;
}

function climateForestThreshold(band: ClimateBand | undefined, baseForTh: number): number {
  if (!band || band === 'desert' || isPolarClimateBand(band)) return 1.1;
  if (band === 'temperate_north' || band === 'temperate_south') return baseForTh - 0.06;
  return baseForTh;
}

function canAssignClimateDesert(band: ClimateBand | undefined): boolean {
  return band === undefined || band === 'desert';
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
 * Centra blobów Pangea — ~5 seedów w ciasnej chmurze wokół środka mapy (FALA 187).
 * Mniejszy spread niż tryb kontynenty (narożniki); większe promienie → bloby zlewają się w jedną masę.
 */
/**
 * Współrzędne izotropowe względem środka mapy (jednostka = max(W,H)).
 * Bez tego okrąg w nq/nr na mapie 168×120 staje się kapsułą (Maciej screen FALA 188).
 */
export function mapIsotropicFromCenter(
  q: number,
  r: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const maxDim = Math.max(1, width - 1, height - 1);
  return {
    x: (q - (width - 1) / 2) / maxDim,
    y: (r - (height - 1) / 2) / maxDim,
  };
}

/** Norm 0–1 → izotropowo względem środka (dla centrów blobów). */
function normToIsotropic(
  nq: number,
  nr: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const maxDim = Math.max(1, width - 1, height - 1);
  return {
    x: (nq - 0.5) * (width - 1) / maxDim,
    y: (nr - 0.5) * (height - 1) / maxDim,
  };
}

/** Parametry układu blobów Pangea — skalowane z landFraction i rozmiarem mapy (FALA 191). */
export interface PangeaLandLayoutParams {
  nBlobs: number;
  blobRadiusMin: number;
  blobRadiusMax: number;
  ringRMin: number;
  ringRMax: number;
  clusterRadius: number;
  threshold: number;
  mergeSum: number;
  mergeMax: number;
  globalWarp: number;
  valley: number;
  fillMinScore: number;
}

/** Interpolacja 0–1 po landFraction (clamp 0.15–0.85). */
function pangeaLandT(landFraction: number): number {
  return Math.max(0, Math.min(1, (landFraction - 0.15) / 0.70));
}

/**
 * Układ blobów Pangea zależny od % lądu i rozmiaru mapy.
 * Cel: ZAWSZE jedna zwarta masa — bez pierścienia lądu wokół rdzenia (obwarzanek).
 * Niski % → mała chmura blobów w centrum (NIE daleki pierścień + głęboka dolina).
 * Wysoki % → większe bloby, nadal ciasny overlap z rdzeniem.
 */
export function pangeaLandLayoutParams(
  landFraction: number,
  width: number,
  height: number,
): PangeaLandLayoutParams {
  const t = pangeaLandT(landFraction);
  const mapScale = Math.sqrt((width * height) / 20160);
  const sizeBoost = Math.min(0.06, Math.max(0, (mapScale - 1) * 0.04));
  // Anti-obwarzanek: ściągnij pierścień ZAWSZE (nie tylko przy wysokim %), mocniej przy dużych mapach.
  const highLand = Math.max(0, (t - 0.55) / 0.45);
  const lowLand = Math.max(0, 1 - t / 0.45); // 1 przy ~15–30% lądu
  const ringPull = 0.02 + sizeBoost * 0.55 + highLand * 0.04 + lowLand * 0.03;

  return {
    // Przy niskim % lądu: mniej blobów, wszystkie w centrum — daleki pierścień = donut.
    nBlobs: t < 0.28 ? 2 : t < 0.55 ? 4 : 6,
    blobRadiusMin: 0.10 + t * 0.11 + sizeBoost * 0.45,
    blobRadiusMax: 0.16 + t * 0.18 + sizeBoost * 0.9,
    ringRMin: Math.max(0.005, 0.012 + t * 0.02 + sizeBoost * 0.06 - ringPull),
    ringRMax: Math.max(0.02, 0.035 + t * 0.07 + sizeBoost * 0.16 - ringPull * 1.2),
    clusterRadius: 0.18 + t * 0.36 + sizeBoost,
    threshold: 0.17 - t * 0.10,
    mergeSum: 0.36 + t * 0.16 + sizeBoost * 0.12 + highLand * 0.08,
    mergeMax: 0.22 + t * 0.18 + sizeBoost * 0.06 + highLand * 0.06,
    globalWarp: 0.04 + t * 0.22,
    // FALA 195: valley NIE może być najwyższe przy niskim % — to rzeźbiło moat rdzeń↔obręcz.
    valley: Math.max(0.015, 0.045 + t * 0.025 - lowLand * 0.02),
    fillMinScore: 0.03 + t * 0.08,
  };
}

export function buildPangeaBlobCenters(
  rand: () => number,
  width: number,
  height: number,
  landFraction: number,
): ContinentCenter[] {
  const layout = pangeaLandLayoutParams(landFraction, width, height);
  const borderMargin = Math.max(
    mapBorderWidth(width, height) / Math.max(1, width - 1),
    mapBorderWidth(width, height) / Math.max(1, height - 1),
    0.12,
  );
  const clamp01 = (v: number) => Math.max(borderMargin, Math.min(1 - borderMargin, v));
  const jitter = () => (rand() - 0.5) * 0.028;
  const pickR = () => layout.blobRadiusMin + rand() * (layout.blobRadiusMax - layout.blobRadiusMin);
  const maxDim = Math.max(1, width - 1, height - 1);

  const nBlobs = layout.nBlobs;
  const centers: ContinentCenter[] = [];
  centers.push({
    nq: clamp01(0.5 + jitter()),
    nr: clamp01(0.5 + jitter()),
    radius: pickR(),
  });

  const ringSlots = nBlobs - 1;
  const pickRRing = () => {
    const span = layout.blobRadiusMax - layout.blobRadiusMin;
    return layout.blobRadiusMin * 1.06 + rand() * span * 1.12;
  };
  // Pierścień w przestrzeni izotropowej → koło na heksach, nie kapsuła.
  for (let i = 0; i < ringSlots; i++) {
    const angle = (2 * Math.PI * i) / ringSlots + (rand() - 0.5) * 0.45;
    const ringR = layout.ringRMin + rand() * (layout.ringRMax - layout.ringRMin);
    const ix = Math.cos(angle) * ringR;
    const iy = Math.sin(angle) * ringR;
    centers.push({
      nq: clamp01(0.5 + ix * maxDim / (width - 1) + jitter()),
      nr: clamp01(0.5 + iy * maxDim / (height - 1) + jitter()),
      radius: pickRRing(),
    });
  }
  return centers;
}

/** Wewnętrzny score jednego blobu kontynentalnego (jak kontynenty, bez Voronoi). */
function pangeaBlobScore(
  q: number,
  r: number,
  width: number,
  height: number,
  c: ContinentCenter,
  zoneIdx: number,
  perm: Uint8Array,
  noiseScale: number,
): number {
  const p = mapIsotropicFromCenter(q, r, width, height);
  const cIso = normToIsotropic(c.nq, c.nr, width, height);
  const distC = Math.hypot(p.x - cIso.x, p.y - cIso.y);
  const radial = Math.max(0, 1 - Math.pow(distC / c.radius, 1.55));
  const warpCoarse = fbm(perm, q * noiseScale * 0.55 + 100 + zoneIdx * 37, r * noiseScale * 0.55 + 100, 4) * 0.24;
  const warpFine = fbm(perm, q * noiseScale * 1.45 + 510 + zoneIdx * 17, r * noiseScale * 1.45 + 510, 3) * 0.16;
  const angle = Math.atan2(p.y - cIso.y, p.x - cIso.x);
  const angleNoise = fbm(perm, Math.cos(angle) * 4 + zoneIdx * 11, Math.sin(angle) * 4 + 220, 2) * 0.10;
  return radial + warpCoarse + warpFine + angleNoise - 0.09;
}

/**
 * Maska ladowa dla trybu 'pangea' (FALA 187/189):
 *   ~5 blobów w ciasnej chmurze — max() zamiast Voronoi → jedna nieregularna masa.
 *   Dystanse izotropowe (FALA 189) — bez kapsuły na szerokich mapach.
 */
export function landMaskPangea(
  q: number, r: number,
  width: number, height: number,
  centers: ContinentCenter[],
  perm: Uint8Array,
  noiseScale: number,
  landFraction: number,
): number {
  const layout = pangeaLandLayoutParams(landFraction, width, height);
  const borderFade = landMaskBorderFade(q, r, width, height);
  if (borderFade <= 0) return 0;

  let blobMax = 0;
  let blobSum = 0;
  for (let zoneIdx = 0; zoneIdx < centers.length; zoneIdx++) {
    const c = centers[zoneIdx]!;
    const s = pangeaBlobScore(q, r, width, height, c, zoneIdx, perm, noiseScale);
    blobMax = Math.max(blobMax, s);
    blobSum += Math.max(0, s);
  }
  const merged = Math.min(1, blobSum * layout.mergeSum + blobMax * layout.mergeMax);

  const iso = mapIsotropicFromCenter(q, r, width, height);
  const clusterDist = Math.hypot(iso.x, iso.y);
  const clusterFade = Math.max(0, 1 - Math.pow(clusterDist / layout.clusterRadius, 2.2));
  const valley = fbm(perm, q * noiseScale * 0.38 + 900, r * noiseScale * 0.38 + 900, 4) * layout.valley;
  const globalWarp = fbm(perm, q * noiseScale * 0.45 + 200, r * noiseScale * 0.45 + 200, 3)
    * layout.globalWarp;
  return Math.min(1, Math.max(0, (merged + globalWarp - valley - layout.threshold) * clusterFade * borderFade));
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

/** Progi klasyfikacji terenu (szum → typ heksa). Las: wyłącznie {@link reapplyForestOverlay}. */
export interface TerrainClassifyThresholds {
  desert?: number;
  /** @deprecated Nieużywane w classifyTerrain — las w reapplyForestOverlay (R-MAPGEN-KOLEJNOSC-Q1=B). */
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
 * Klasyfikuje teren bazowy jednego heksa (bez nakładki lasu — patrz reapplyForestOverlay).
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
  climateBand?: ClimateBand,
  /** Lokalne przesunięcie progu Równina/Łąka per komórka — patrz terrainCellBias(). */
  cellBias = 0,
): TerrainResult {
  const desTh = thresholds?.desert ?? 0.63;
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
      canAssignClimateDesert(climateBand) &&
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
  }

  return { terenBazowy, nakladka };
}

/**
 * Klasyfikacja lądu bez gór/wzgórz — relief nadaje wyłącznie applyReliefByNoiseRank.
 * Bez nakładki lasu (R-MAPGEN-KOLEJNOSC-Q1=B).
 */
export function classifyTerrainFlat(
  elevContinental: number,
  landMask: number,
  _mtnNoise: number,
  forNoise: number,
  desNoise: number,
  thresholds?: TerrainClassifyThresholds,
  climateBand?: ClimateBand,
  /** Lokalne przesunięcie progu Równina/Łąka per komórka — patrz terrainCellBias(). */
  cellBias = 0,
): TerrainResult {
  const desTh = thresholds?.desert ?? 0.63;
  let terenBazowy: TerenBazowy;
  const nakladka: Nakladka = Nakladka.Brak;

  if (elevContinental < 0.14) {
    terenBazowy = TerenBazowy.Laka;
  } else if (
    canAssignClimateDesert(climateBand) &&
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

  return { terenBazowy, nakladka };
}

/**
 * **Jedyny** etap nakładania lasu w pipeline generatora (R-MAPGEN-KOLEJNOSC-Q1=B).
 * Wołany po finalnym reliefie i rzekach, przed złożami.
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
  const seaDist = buildSeaDistanceField(hexes);

  for (const hex of Object.values(hexes)) {
    if (hex.nakladka === Nakladka.Las) hex.nakladka = Nakladka.Brak;
  }

  let assigned = 0;
  const partitions = landPartitionKeysForDistribution(hexes, typ, continentOf, nContinents);

  for (const part of partitions) {
    const massSet = new Set(part.filter((k) => { const hx = hexes[k]; return !hx || !isWaterTerrainLocal(hx.terenBazowy); }));
    let maxSeaInPart = 1;
    for (const k of massSet) {
      const d = seaDist.get(k) ?? 0;
      if (d > maxSeaInPart) maxSeaInPart = d;
    }
    for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
      if (land.length < minLand) continue;

      const eligible = land
        .filter(([q, r]) => {
          const h = hexes[hexKey(q, r)];
          if (!h || !isForestEligibleTerrain(h.terenBazowy) || h.nakladka !== Nakladka.Brak) return false;
          if (mapHeight && climateBandAt(q, r, mapHeight) === 'desert') return false;
          return true;
        })
        .map(([q, r]) => {
          const sd = seaDist.get(hexKey(q, r)) ?? 0;
          const inlandBoost = maxSeaInPart > 1 ? (sd / maxSeaInPart) * 0.14 : 0;
          return { k: hexKey(q, r), n: (scratch.get(hexKey(q, r))?.forNoise ?? 0) + inlandBoost };
        })
        .sort((a, b) => b.n - a.n);

      if (eligible.length === 0) continue;

      const mid = land[Math.floor(land.length / 2)]!;
      const cellBand = mapHeight ? climateBandAt(mid[0], mid[1], mapHeight) : 'temperate_north';
      const zoneShareMul = (cellBand === 'temperate_north' || cellBand === 'temperate_south') ? 1.35 : 1.0;

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
  low: 0.186,
  medium: 0.25,
  high: 0.564,
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
    if (isWaterTerrainLocal(hex.terenBazowy)) {
      continue;
    }
    const s = scratch.get(key);
    if (!s) continue;
    landCount++;
    const { q, r } = hex.coords;
    const climateBand = mapHeight ? climateBandAt(q, r, mapHeight) : undefined;
    const cellBias = terrainCellBias(q, r, seed);
    const { terenBazowy: fullTb, nakladka: fullNak } = classifyTerrain(
      s.elevContinental, s.landMask, s.mtnNoise, s.forNoise, s.desNoise,
      thresholds, climateBand, cellBias,
    );
    if (fullTb === TerenBazowy.Gory || fullTb === TerenBazowy.Wzgorza) {
      // Tymczasowo płasko — przywrócimy TOP-budżet kandydatów po mtnNoise (skupiska), nie wszystkie.
      const { terenBazowy: flatTb, nakladka: flatNak } = classifyTerrainFlat(
        s.elevContinental, s.landMask, s.mtnNoise, s.forNoise, s.desNoise,
        thresholds, climateBand, cellBias,
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
  low: { mountain: 0.06, highland: 0.126 },
  medium: { mountain: 0.10, highland: 0.15 },
  high: { mountain: 0.24, highland: 0.324 },
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
    if (nh && !isWaterTerrainLocal(nh.terenBazowy)) n++;
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
      if (!isWaterTerrainLocal(hexes[k]!.terenBazowy)) land++;
    }
    const targetLand = Math.round(ring.length * cap);

    if (land > targetLand) {
      const landKeys = ring.filter((k) => !isWaterTerrainLocal(hexes[k]!.terenBazowy));
      const sorted = sortLandKeysForErosion(landKeys, hexes, landScores, width, height);
      for (const k of sorted) {
        if (land <= targetLand) break;
        setHexToMorze(hexes[k]!);
        land--;
        adjusted++;
      }
    } else if (land < targetLand) {
      const morseKeys = ring.filter((k) => isWaterTerrainLocal(hexes[k]!.terenBazowy));
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
  if (isWaterTerrainLocal(hex.terenBazowy)) {
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
    if (!hex || isWaterTerrainLocal(hex.terenBazowy)) continue;
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
        if (!nh || isWaterTerrainLocal(nh.terenBazowy)) continue;
        visited.add(nk);
        stack.push(nk);
      }
    }
    groups.push(mass);
  }
  return groups;
}

/** Centroid (środek masy) lądu w masie — kierunek głównych rzek (FALA 173). */
export function computeLandMassCentroid(
  hexes: Record<string, Hex>,
  massKeys: Iterable<string>,
): { q: number; r: number } | null {
  let sumQ = 0;
  let sumR = 0;
  let count = 0;
  for (const k of massKeys) {
    const h = hexes[k];
    if (!h || !isRiverLandTerrain(h.terenBazowy)) continue;
    const { q, r } = parseHexKey(k);
    sumQ += q;
    sumR += r;
    count++;
  }
  if (count === 0) return null;
  return { q: sumQ / count, r: sumR / count };
}

/** FALA 186: bok kwadratu centrum kontynentu (cel kierunku rzek). Maciej 2026-08-02: 5×5. */
export const CONTINENT_CENTER_SQUARE_SIZE = 5;

export type ContinentCenterSquare = {
  keys: Set<string>;
  bbox: { qMin: number; qMax: number; rMin: number; rMax: number };
  centroid: { q: number; r: number };
};

/**
 * Kwadrat ~size×size hex wokół centroidu masy lądowej (FALA 186).
 * Jeśli masa mieści się w mniejszym bbox — cały inland core masy.
 */
export function continentCenterSquare(
  hexes: Record<string, Hex>,
  massKeys: Iterable<string>,
  size: number = CONTINENT_CENTER_SQUARE_SIZE,
): ContinentCenterSquare | null {
  const landKeys: string[] = [];
  for (const k of massKeys) {
    const h = hexes[k];
    if (!h || !isRiverLandTerrain(h.terenBazowy)) continue;
    landKeys.push(k);
  }
  if (landKeys.length === 0) return null;

  const centroid = computeLandMassCentroid(hexes, landKeys);
  if (!centroid) return null;

  let qMin = Infinity;
  let qMax = -Infinity;
  let rMin = Infinity;
  let rMax = -Infinity;
  for (const k of landKeys) {
    const { q, r } = parseHexKey(k);
    qMin = Math.min(qMin, q);
    qMax = Math.max(qMax, q);
    rMin = Math.min(rMin, r);
    rMax = Math.max(rMax, r);
  }
  const spanQ = qMax - qMin + 1;
  const spanR = rMax - rMin + 1;

  let bboxQMin: number;
  let bboxQMax: number;
  let bboxRMin: number;
  let bboxRMax: number;
  if (spanQ <= size && spanR <= size) {
    bboxQMin = qMin;
    bboxQMax = qMax;
    bboxRMin = rMin;
    bboxRMax = rMax;
  } else {
    const cq = Math.round(centroid.q);
    const cr = Math.round(centroid.r);
    const half = Math.floor(size / 2);
    bboxQMin = cq - half;
    bboxQMax = cq + half;
    bboxRMin = cr - half;
    bboxRMax = cr + half;
  }

  const keys = new Set<string>();
  for (const k of landKeys) {
    const { q, r } = parseHexKey(k);
    if (q >= bboxQMin && q <= bboxQMax && r >= bboxRMin && r <= bboxRMax) {
      keys.add(k);
    }
  }
  if (keys.size === 0) {
    for (const k of landKeys) keys.add(k);
  }

  return {
    keys,
    bbox: { qMin: bboxQMin, qMax: bboxQMax, rMin: bboxRMin, rMax: bboxRMax },
    centroid,
  };
}

/** Odległość heksa do najbliższego heksa kwadratu centrum (0 = wewnątrz). */
export function hexDistanceToCenterSquare(
  q: number,
  r: number,
  square: ContinentCenterSquare | null,
): number {
  if (!square || square.keys.size === 0) return 0;
  if (square.keys.has(hexKey(q, r))) return 0;
  let minD = Infinity;
  for (const hk of square.keys) {
    const { q: cq, r: cr } = parseHexKey(hk);
    minD = Math.min(minD, hexAxialDistance(q, r, cq, cr));
  }
  return minD;
}

function isForestEligibleTerrain(tb: TerenBazowy): boolean {
  return !isWaterTerrainLocal(tb)
    && tb !== TerenBazowy.Gory && tb !== TerenBazowy.Pustynia
    && tb !== TerenBazowy.Polarny;
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
      if (!hex || isWaterTerrainLocal(hex.terenBazowy)) continue;
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
  const frac = tier === 'high' ? 0.187 : tier === 'low' ? 0.067 : 0.10;
  return Math.max(0, Math.ceil(landCount * frac));
}

function reliefBonusCapHighland(tier: ReliefDensityTier, landCount: number): number {
  const frac = tier === 'high' ? 0.275 : tier === 'low' ? 0.10 : 0.15;
  return Math.max(0, Math.ceil(landCount * frac));
}

/**
 * Anty-klaster w komórce żelaza (fair play — rozkład, nie jeden stos wzgórz).
 * Frakcja czytana z Panel-A (`gestosc.relief_overflow_cap_frac`, C-MAPA-Q2=B) — patrz
 * mapGenReliefOverflowCapFrac. To TEN SAM sufit, który (po włączeniu przez
 * RELIEF_OVERFLOW_CAP_MULT) egzekwuje docelową górzystość ~15% dla tieru medium (R-MAPGEN-KOLEJNOSC-Q2=C).
 */
function reliefSpreadCapMountain(tier: ReliefDensityTier, landCount: number): number {
  const frac = mapGenReliefOverflowCapFrac(tier).mountain;
  return Math.max(minMountainsIronCell(tier), Math.ceil(landCount * frac));
}

function reliefSpreadCapHighland(tier: ReliefDensityTier, landCount: number): number {
  const frac = mapGenReliefOverflowCapFrac(tier).highland;
  return Math.max(minHighlandsCopperCell(tier), Math.ceil(landCount * frac));
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

/** Minima fair play per tier suwaka Relief (Maciej 2026-07-29: medium=4, Mało/Dużo skalowane). */
export const MIN_RIVER_SOURCES_PER_WATER_CELL = 1;

const RELIEF_MIN_MOUNTAINS: Record<ReliefDensityTier, number> = { low: 2, medium: 4, high: 5 };
const RELIEF_MIN_HIGHLANDS: Record<ReliefDensityTier, number> = { low: 2, medium: 4, high: 5 };

export function minMountainsIronCell(tier: ReliefDensityTier = 'medium'): number {
  return RELIEF_MIN_MOUNTAINS[tier];
}

export function minHighlandsCopperCell(tier: ReliefDensityTier = 'medium'): number {
  return RELIEF_MIN_HIGHLANDS[tier];
}

/** @deprecated używaj minMountainsIronCell('medium') */
export const MIN_MOUNTAINS_IRON_CELL = RELIEF_MIN_MOUNTAINS.medium;
/** @deprecated używaj minHighlandsCopperCell('medium') */
export const MIN_HIGHLANDS_COPPER_CELL = RELIEF_MIN_HIGHLANDS.medium;

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
 * Siatka gór (żelazo) — tier kreatora „Góry i wzgórza” (Maciej 2026-07-29: medium 15×15).
 * Mało=21 · Normalnie=15 · Dużo=12.
 */
export function ironCoverageCellSize(tier: ReliefDensityTier = 'medium'): number {
  if (tier === 'high') return 12;
  if (tier === 'low') return 21;
  return 15;
}

/**
 * Siatka wzgórz (miedź) — ten sam suwak Relief, ta sama siatka co góry (Maciej 2026-07-29).
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

/** Komórka żelaza: min. N× Góry (tier Relief). */
export function cellHasIronPackage(
  cellLand: Array<[number, number]>,
  hexes: Record<string, Hex>,
  tier: ReliefDensityTier = 'medium',
): boolean {
  return countMountainsInCell(cellLand, hexes) >= minMountainsIronCell(tier);
}

/** Komórka miedzi: min. N× Wzgórza (tier Relief). */
export function cellHasCopperPackage(
  cellLand: Array<[number, number]>,
  hexes: Record<string, Hex>,
  tier: ReliefDensityTier = 'medium',
): boolean {
  return countHighlandsInCell(cellLand, hexes) >= minHighlandsCopperCell(tier);
}

/** @deprecated — używaj cellHasIronPackage + cellHasCopperPackage */
export function cellHasReliefPackage(
  cellLand: Array<[number, number]>,
  hexes: Record<string, Hex>,
): boolean {
  return cellHasMountain(cellLand, hexes) && cellHasHighland(cellLand, hexes);
}

/**
 * Liczba heksów w komórce, które w OGÓLE mogą stać się reliefem (nie Morze/Wybrzeże — ta sama
 * reguła co isReliefCandidateHex, bez bufora brzegu mapy, bo tu nie mamy width/height). Komórka
 * czysto przybrzeżna (wąski półwysep — same Wybrzeże) fizycznie NIE MA gdzie postawić 2 Gór/
 * Wzgórz; liczenie jej do "potrzebuje floor" byłoby wymaganiem niespełnialnym z definicji.
 */
function eligibleReliefLandCount(land: Array<[number, number]>, hexes: Record<string, Hex>): number {
  let n = 0;
  for (const [q, r] of land) {
    const tb = hexes[hexKey(q, r)]?.terenBazowy;
    if (tb !== undefined && !isWaterTerrainLocal(tb)) n++;
  }
  return n;
}

/** Suchy ląd w komórce złóż fair-play (nie Morze/Wybrzeże) — lustro eligibleReliefLandCount. */
function eligibleDepositLandCount(
  land: Array<[number, number]>,
  hexes: Record<string, Hex>,
): number {
  return eligibleReliefLandCount(land, hexes);
}

/** Pakiet żelazo+miedź+glina: min. suchy ląd + co najmniej jeden heks z rzeką (glina, TEMAT 12). */
function cellCanHostDepositPackage(
  land: Array<[number, number]>,
  hexes: Record<string, Hex>,
  minLand: number,
): boolean {
  if (eligibleDepositLandCount(land, hexes) < minLand) return false;
  for (const [q, r] of land) {
    if (hexes[hexKey(q, r)]?.rzeka?.obecna) return true;
  }
  return false;
}

function eligibleForestLandCount(
  land: Array<[number, number]>,
  hexes: Record<string, Hex>,
): number {
  let n = 0;
  for (const [q, r] of land) {
    const hex = hexes[hexKey(q, r)];
    if (hex && isForestEligibleTerrain(hex.terenBazowy)) n++;
  }
  return n;
}

export function ironGridCoverageRatio(
  massLandKeys: string[],
  hexes: Record<string, Hex>,
  cellSize: number,
  tier: ReliefDensityTier = 'medium',
): number {
  const massSet = new Set(massLandKeys);
  const minLand = minLandHexesForReliefCell(cellSize);
  let need = 0;
  let hit = 0;
  for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
    if (eligibleReliefLandCount(land, hexes) < minLand) continue;
    need++;
    if (cellHasIronPackage(land, hexes, tier)) hit++;
  }
  return need > 0 ? hit / need : 1;
}

export function copperGridCoverageRatio(
  massLandKeys: string[],
  hexes: Record<string, Hex>,
  cellSize: number,
  tier: ReliefDensityTier = 'medium',
): number {
  const massSet = new Set(massLandKeys);
  const minLand = minLandHexesForReliefCell(cellSize);
  let need = 0;
  let hit = 0;
  for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
    if (eligibleReliefLandCount(land, hexes) < minLand) continue;
    need++;
    if (cellHasCopperPackage(land, hexes, tier)) hit++;
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
      if (!hex || isWaterTerrainLocal(hex.terenBazowy)) return false;
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
      if (hexes[k]!.terenBazowy === TerenBazowy.PlytkieMorze) score -= 0.15;
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
  tier: ReliefDensityTier,
): boolean {
  const countFn = () =>
    want === 'mountain' ? countMountainsInCell(land, hexes) : countHighlandsInCell(land, hexes);
  if (countFn() >= minCount) return false;

  let changed = false;
  const placed = new Set<string>();
  let guard = 0;
  while (countFn() < minCount && guard++ < land.length + 8) {
    const protectHighland = want === 'mountain' && countHighlandsInCell(land, hexes) <= minHighlandsCopperCell(tier);
    const protectMountain = want === 'highland' && countMountainsInCell(land, hexes) <= minMountainsIronCell(tier);
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
          if (!hex || isWaterTerrainLocal(hex.terenBazowy)) return false;
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
  tier: ReliefDensityTier,
): boolean {
  return forceReliefTypeInCell(
    land, hexes, scratch, width, height, rand, 'mountain', minMountainsIronCell(tier), tier,
  );
}

function forceCopperHighlandsInCell(
  land: Array<[number, number]>,
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  width: number,
  height: number,
  rand: () => number,
  tier: ReliefDensityTier,
): boolean {
  return forceReliefTypeInCell(
    land, hexes, scratch, width, height, rand, 'highland', minHighlandsCopperCell(tier), tier,
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
  const a = forceIronMountainsInCell(land, hexes, scratch, width, height, rand, 'medium');
  const b = forceCopperHighlandsInCell(land, hexes, scratch, width, height, rand, 'medium');
  return a || b;
}

/**
 * Zmiana 1 „MIN NIE MAX" (Maciej 2026-07-11): fair-play min. 2 Góry + 2 Wzgórza / komórkę
 * jest DOLNĄ granicą reliefu, nie górną — górny limit (degradacja nadmiaru — najsłabsza
 * Góra→Wzgórza, Wzgórze→Równina) był wtedy uznany za sztuczną regularność, więc mnożnik = ∞
 * wyłączał cap (gwarancja minimum zostawała — force*InCell).
 *
 * PONOWNIE WŁĄCZONE — Maciej 2026-07-26, C-MAPA-Q2=B; skorygowane R-MAPGEN-KOLEJNOSC-Q2=C (2026-07-27):
 * sufit `reliefSpreadCapMountain`/`reliefSpreadCapHighland` (frakcje z `gestosc.relief_overflow_cap_frac`,
 * ~0,05 Gór / ~0,085 Wzgórz na komórkę dla tieru medium — suma ≈15% górzystości lądu) egzekwowany
 * mnożnikiem 1 (bez marginesu) PRZY ZASIEWANIU (ensureReliefGridCoverage wołane w generator.ts
 * PRZED growMountainRanges) i PO ROZROŚCIE pasm (to samo wywołanie ponownie na finalnej
 * geografii, PO growMountainRanges — patrz generator.ts). Docelowa górzystość lądu tier medium
 * ≈15% (R-MAPGEN-KOLEJNOSC-Q2=C). Limit skupiska (decyzja 63,
 * MAX_MOUNTAIN_RANGE_CLUSTER_SIZE=10) i floor 2/2 na komórkę (MIN_MOUNTAINS_IRON_CELL/
 * MIN_HIGHLANDS_COPPER_CELL) zostają nienaruszone — te capy nigdy nie schodzą poniżej floora
 * (patrz `Math.max(MIN_..._CELL, ...)` w capMountainOverflowInCell/capHighlandOverflowInCell).
 */
const RELIEF_OVERFLOW_CAP_MULT = 1;

/**
 * Heks ze złożem (zelazo/miedz/glina/... — cokolwiek forceDepositInCell/placeDeposits już
 * postawiło) NIGDY nie jest kandydatem do przycięcia sufitem gęstości — inaczej trzeci,
 * spóźniony przebieg domykania floora reliefu dla typu 'ziemia' (generator.ts, PO
 * placeDeposits/ensureDepositGridCoverage, patrz „Ziemia — ostatnia szansa") kasowałby
 * właśnie co dopiero wymuszone złoża fair-play, gdy trafiły na najsłabszy szumem heks w
 * przepełnionej komórce. Zmierzone: bez tej ochrony aktywacja RELIEF_OVERFLOW_CAP_MULT=1
 * zbijała pokrycie złóż „Standard Ziemia" z 50% do 25% (fair-play-grid-test.cjs).
 */
function isDepositProtectedFromOverflowCap(hex: Hex | undefined): boolean {
  return !!hex && !!(hex as HexWithZloze).zloze;
}

function capMountainOverflowInCell(
  land: Array<[number, number]>,
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  tier: ReliefDensityTier,
  spreadOnly = false,
): boolean {
  const minMtn = minMountainsIronCell(tier);
  const baseMaxMtn = spreadOnly
    ? reliefSpreadCapMountain(tier, land.length)
    : Math.max(minMtn, reliefBonusCapMountain(tier, land.length) + minMtn);
  const maxMtn = baseMaxMtn * RELIEF_OVERFLOW_CAP_MULT;
  const mountains = land
    .filter(([q, r]) => hexes[hexKey(q, r)]?.terenBazowy === TerenBazowy.Gory)
    .map(([q, r]) => ({
      q, r,
      n: scratch.get(hexKey(q, r))?.mtnNoise ?? 0,
      protected: isDepositProtectedFromOverflowCap(hexes[hexKey(q, r)]),
    }))
    .sort((a, b) => a.n - b.n);
  let changed = false;
  let total = mountains.length;
  let i = 0;
  while (total > maxMtn && total > minMtn && i < mountains.length) {
    const cand = mountains[i]!;
    if (cand.protected) { i++; continue; }
    const dropHex = hexes[hexKey(cand.q, cand.r)]!;
    dropHex.terenBazowy = TerenBazowy.Wzgorza;
    dropHex.nakladka = Nakladka.Brak;
    delete (dropHex as HexWithZloze).zloze;
    changed = true;
    total--;
    mountains.splice(i, 1);
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
  const minHi = minHighlandsCopperCell(tier);
  const baseMaxHi = spreadOnly
    ? reliefSpreadCapHighland(tier, land.length)
    : Math.max(minHi, reliefBonusCapHighland(tier, land.length) + minHi);
  const maxHi = baseMaxHi * RELIEF_OVERFLOW_CAP_MULT;
  const highlands = land
    .filter(([q, r]) => hexes[hexKey(q, r)]?.terenBazowy === TerenBazowy.Wzgorza)
    .map(([q, r]) => ({
      q, r,
      n: scratch.get(hexKey(q, r))?.mtnNoise ?? 0,
      protected: isDepositProtectedFromOverflowCap(hexes[hexKey(q, r)]),
    }))
    .sort((a, b) => a.n - b.n);
  let changed = false;
  let total = highlands.length;
  let i = 0;
  while (total > maxHi && total > minHi && i < highlands.length) {
    const cand = highlands[i]!;
    if (cand.protected) { i++; continue; }
    const dropHex = hexes[hexKey(cand.q, cand.r)]!;
    dropHex.terenBazowy = TerenBazowy.Rownina;
    dropHex.nakladka = Nakladka.Brak;
    delete (dropHex as HexWithZloze).zloze;
    changed = true;
    total--;
    highlands.splice(i, 1);
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
    .filter((land) => eligibleReliefLandCount(land, hexes) >= minIronLand);
  let fixed = 0;

  if (!skipCap) {
    for (const land of eligibleCells) {
      capMountainOverflowInCell(land, hexes, scratch, tier);
    }
  }
  for (let pass = 0; pass < 14; pass++) {
    let inner = 0;
    const cells = [...eligibleCells]
      .sort((a, b) => (cellHasIronPackage(a, hexes, tier) ? 1 : 0) - (cellHasIronPackage(b, hexes, tier) ? 1 : 0));
    for (const land of cells) {
      if (cellHasIronPackage(land, hexes, tier)) continue;
      if (forceIronMountainsInCell(land, hexes, scratch, width, height, rand, tier)) inner++;
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
    .filter((land) => eligibleReliefLandCount(land, hexes) >= minCopperLand);
  let fixed = 0;

  if (!skipCap) {
    for (const land of eligibleCells) {
      capHighlandOverflowInCell(land, hexes, scratch, tier);
    }
  }
  for (let pass = 0; pass < 14; pass++) {
    let inner = 0;
    const cells = [...eligibleCells]
      .sort((a, b) => (cellHasCopperPackage(a, hexes, tier) ? 1 : 0) - (cellHasCopperPackage(b, hexes, tier) ? 1 : 0));
    for (const land of cells) {
      if (cellHasCopperPackage(land, hexes, tier)) continue;
      if (forceCopperHighlandsInCell(land, hexes, scratch, width, height, rand, tier)) inner++;
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
  for (let restore = 0; restore < 8; restore++) {
    let passFixed = 0;
    for (const mass of masses) {
      const massSet = new Set(mass);
      passFixed += ensureMassIronGridCoverage(hexes, scratch, tier, width, height, massSet, rand, true);
      passFixed += ensureMassCopperGridCoverage(hexes, scratch, tier, width, height, massSet, rand, true);
    }
    fixed += passFixed;
    if (passFixed === 0) break;
  }
  // Mop-up po spread-cap: duże mapy (Ogromny) — komórki bez pakietu żelaza/miedzi.
  const ironSize = ironCoverageCellSize(tier);
  const copperSize = copperCoverageCellSize(tier);
  const minIron = minLandHexesForReliefCell(ironSize);
  const minCopper = minLandHexesForReliefCell(copperSize);
  for (let mop = 0; mop < 16; mop++) {
    let passFixed = 0;
    for (const mass of masses) {
      if (mass.length < 150) continue;
      const massSet = new Set(mass);
      for (const land of landHexesByCoverageCell(massSet, ironSize).values()) {
        if (eligibleReliefLandCount(land, hexes) < minIron) continue;
        if (cellHasIronPackage(land, hexes, tier)) continue;
        if (forceIronMountainsInCell(land, hexes, scratch, width, height, rand, tier)) passFixed++;
      }
      for (const land of landHexesByCoverageCell(massSet, copperSize).values()) {
        if (eligibleReliefLandCount(land, hexes) < minCopper) continue;
        if (cellHasCopperPackage(land, hexes, tier)) continue;
        if (forceCopperHighlandsInCell(land, hexes, scratch, width, height, rand, tier)) passFixed++;
      }
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

/**
 * Twardy limit rozmiaru SPÓJNEGO skupiska Gór (i osobno Wzgórz) — Maciej 2026-07-25,
 * PYTANIE 63 (`dyspozycje/PYTANIE-OTWARTE.md`): wielkie pasma odcinały całym cywilizacjom
 * dostęp do złóż (miedź/żelazo/złoto), bo złoto jest tylko w Górach/Wzgórzach i celowo NIE
 * jest na liście FAIR_PLAY_DEPOSIT_IDS. Limit dotyczy skupiska (flood fill po sąsiedztwie
 * heksowym, TEN SAM typ terenu), NIE komórki siatki fair-play (to inna metryka, patrz
 * fair-play-grid-test.cjs — limit skupiska nie gwarantuje przejścia tego testu, bo kilka
 * osobnych skupisk może wpaść do jednej komórki).
 */
const MAX_MOUNTAIN_RANGE_CLUSTER_SIZE = 10;

/**
 * Odstęp (heksy, BFS w bfsExpandExclusion) NOWEGO mini-skupiska (regrowLostMountainClusters) od
 * KAŻDEGO już istniejącego heksu Gór/Wzgórz — Maciej 2026-07-25, PYTANIE 80. bfsExpandExclusion
 * wyklucza WSZYSTKO w promieniu ≤ tej wartości, więc nowy heks trafia na dystans ŚCIŚLE większy
 * — przy 1 to dystans ≥2 od istniejącego reliefu, co WYSTARCZA, żeby flood-fill (który łączy
 * TYLKO bezpośrednio sąsiadujące heksy, dystans=1) nigdy nie zrósł nowego mini-skupiska ze
 * starym. Teren jest już gęsto usiany reliefem (~14% lądu to Gory/Wzgorza rozsiane wszędzie) —
 * większy odstęp (próbowano 3) wykluczał niemal całą wolną przestrzeń i regrow odzyskiwał
 * ułamek deficytu (zmierzone: deficyt ~400-550 heksów/mapę, odzysk raptem 12-40). 1 to
 * matematyczne minimum bezpieczeństwa (patrz wyżej) — maksymalizuje dostępną przestrzeń.
 */
const MOUNTAIN_RANGE_REGROW_MIN_GAP = 1;

/**
 * Mnożnik celu regrowLostMountainClusters — Maciej 2026-07-25, PYTANIE 80. Pierwsza wersja (jedna
 * wspólna strefa zakazana Gór+Wzgórz, patrz isExcludedForRegrow) odzyskiwała tylko ~66-93%
 * zadanego deficytu (średnio ~83%), więc próbowano mnożnik >1 żeby to skompensować. Po podziale
 * strefy zakazanej PER TYP (Gory i Wzgorza osobno) odzysk jest już bliski 100% zadanego celu —
 * mnożnik >1 PRZESTRZELIWAŁ (zmierzone: 1.25 dawało udział ~20.2% zamiast ~19%). 1.0 = odzyskaj
 * dokładnie tyle, ile przycięło capMountainRangeClusterSize, ani heksa więcej.
 */
const MOUNTAIN_RANGE_REGROW_TARGET_MULT = 1.0;

/** Długość spaceru mini-skupiska odzyskującego ląd (regrowLostMountainClusters) — krótsza niż
 * zwykłe pasmo (dlugoscMin/Max ~11-14), bo to osobne, mniejsze ognisko, nie pasmo główne. */
const MOUNTAIN_RANGE_REGROW_LEN_MIN = 4;
const MOUNTAIN_RANGE_REGROW_LEN_MAX = 8;

/**
 * Flood fill spójnego skupiska JEDNEGO typu terenu (Gory ALBO Wzgorza, nie razem) po całej
 * mapie — używane przez capMountainRangeClusterSize. Deterministyczna kolejność (klucze
 * posortowane) — nie zależy od kolejności iteracji Object.keys(hexes).
 */
function findSameTerrainClusters(hexes: Record<string, Hex>, terrain: TerenBazowy): string[][] {
  const visited = new Set<string>();
  const clusters: string[][] = [];
  const keys = Object.keys(hexes).sort();
  for (const key of keys) {
    if (visited.has(key)) continue;
    const hex = hexes[key];
    if (!hex || hex.terenBazowy !== terrain) continue;
    const cluster: string[] = [];
    const stack = [key];
    visited.add(key);
    while (stack.length) {
      const k = stack.pop()!;
      cluster.push(k);
      const { q, r } = parseHexKey(k);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        if (visited.has(nk)) continue;
        const nh = hexes[nk];
        if (!nh || nh.terenBazowy !== terrain) continue;
        visited.add(nk);
        stack.push(nk);
      }
    }
    clusters.push(cluster);
  }
  return clusters;
}

/** Składowe spójne WEWNĄTRZ zbioru `remaining` (podzbiór jednego skupiska w trakcie przycinania). */
function connectedComponentsWithin(remaining: Set<string>): string[][] {
  const visited = new Set<string>();
  const comps: string[][] = [];
  const keys = [...remaining].sort();
  for (const key of keys) {
    if (visited.has(key)) continue;
    const comp: string[] = [];
    const stack = [key];
    visited.add(key);
    while (stack.length) {
      const k = stack.pop()!;
      comp.push(k);
      const { q, r } = parseHexKey(k);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        if (visited.has(nk) || !remaining.has(nk)) continue;
        visited.add(nk);
        stack.push(nk);
      }
    }
    comps.push(comp);
  }
  return comps;
}

/**
 * Egzekwuje twardy limit `maxSize` na rozmiar spójnego skupiska terenu `terrain` — dla każdego
 * skupiska większego niż limit, deterministycznie zdejmuje heksy (najsłabszy mtnNoise pierwszy,
 * remis rozstrzyga klucz heksu) aż WSZYSTKIE pozostałe składowe (po ewentualnym rozpadzie
 * skupiska) mieszczą się w limicie. Zdjęty heks wraca do `fallbackTerrain` (Równina) i traci
 * nakładkę/złoże — tak samo jak istniejący sanity-cap ~40% wyżej w tym pliku.
 *
 * Działa na FINALNYM stanie `hexes` (wołane na końcu growMountainRanges, PO sanity-capie
 * ~40%) — łapie więc też duże skupiska powstałe ze zrośnięcia się z floor-reliefem
 * ensureReliefGridCoverage (ta funkcja jest wołana PRZED growMountainRanges w generator.ts),
 * nie tylko z tego, co dołożyła sama growMountainRanges.
 *
 * Determinizm: zero Math.random/Date.now — wyłącznie scratch.mtnNoise (policzony wcześniej
 * z zasianego szumu) i porównania kluczy stringowych.
 */
function capMountainRangeClusterSize(
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  terrain: TerenBazowy,
  fallbackTerrain: TerenBazowy,
  maxSize: number,
): number {
  let reverted = 0;
  const clusters = findSameTerrainClusters(hexes, terrain);
  for (const cluster of clusters) {
    if (cluster.length <= maxSize) continue;
    const remaining = new Set(cluster);
    for (;;) {
      const comps = connectedComponentsWithin(remaining).sort((a, b) => b.length - a.length);
      const biggest = comps[0];
      if (!biggest || biggest.length <= maxSize) break;
      const sorted = [...biggest].sort((a, b) => {
        const na = scratch.get(a)?.mtnNoise ?? 0;
        const nb = scratch.get(b)?.mtnNoise ?? 0;
        if (na !== nb) return na - nb; // najsłabszy szum najpierw
        return a < b ? -1 : a > b ? 1 : 0; // remis: deterministyczny klucz
      });
      // Pomijamy heksy ze złożem (isDepositProtectedFromOverflowCap) — ten sam powód co przy
      // sufitcie gęstości (patrz komentarz tam): to wywołanie (capReliefClusterSizeSafetyNet)
      // leci też PO placeDeposits/ensureDepositGridCoverage („Ziemia — ostatnia szansa",
      // generator.ts), więc bez ochrony kasowałoby dopiero co wymuszone złoża fair-play, jeśli
      // trafiły na najsłabszy szumem heks przepełnionego skupiska.
      const victim = sorted.find((k) => !isDepositProtectedFromOverflowCap(hexes[k]));
      if (!victim) break; // wszystkie kandydatki mają złoże — zostawiamy nadmiar (rzadkie)
      remaining.delete(victim);
      const hex = hexes[victim];
      if (hex) {
        hex.terenBazowy = fallbackTerrain;
        hex.nakladka = Nakladka.Brak;
        delete (hex as HexWithZloze).zloze;
      }
      reverted++;
    }
  }
  return reverted;
}

/**
 * Siatka bezpieczeństwa PO ponownym wywołaniu ensureReliefGridCoverage na finalnej geografii
 * (Maciej 2026-07-26, C-MAPA-Q1=B) — patrz generator.ts, wołane tuż przed lasem, PO finalnych
 * rzekach/wybrzeżu. Force*InCell (floor 2 Gór/2 Wzgórz na komórkę) dokłada pojedyncze heksy do
 * deficytowych komórek bez sprawdzania sąsiedztwa — w rzadkim przypadku mógłby doklejić się do
 * istniejącego pasma i przebić limit skupiska (Maciej 2026-07-25, PYTANIE 63: max 10 heksów Gór
 * i osobno 10 Wzgórz w spójnym skupisku, NIENARUSZALNY). Osobna funkcja (nie wewnątrz
 * ensureReliefGridCoverage) — TO wywołanie musi zostać OPCJONALNE i wołane tylko RAZ (na końcu
 * pipeline'u), żeby nie zaburzać wczesnego wywołania ensureReliefGridCoverage (Przebieg 3g,
 * PRZED growMountainRanges) — capping relief TAM, zanim pasma w ogóle wyrosły, zmieniałby
 * kandydatów na seed pasm (mountainRangeSeedCandidates) i przesuwał zużycie rand() w
 * growMountainRanges, co kaskadowo zmieniałoby geografię (wybrzeże/rzeki) dalej w pipeline —
 * zmierzone empirycznie: dodanie cappingu do OBU wywołań zmieniało fragmentację mas lądu.
 */
export function capReliefClusterSizeSafetyNet(
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
): void {
  capMountainRangeClusterSize(
    hexes, scratch, TerenBazowy.Gory, TerenBazowy.Rownina, MAX_MOUNTAIN_RANGE_CLUSTER_SIZE,
  );
  capMountainRangeClusterSize(
    hexes, scratch, TerenBazowy.Wzgorza, TerenBazowy.Rownina, MAX_MOUNTAIN_RANGE_CLUSTER_SIZE,
  );
}

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
 * Rozszerza `excluded` o wszystkie heksy w promieniu `minDist` (BFS po sąsiedztwie heksowym) od
 * heksów `sources` — używane przez regrowLostMountainClusters do wyznaczenia "strefy zakazanej"
 * wokół istniejącego reliefu JEDNEGO typu (Gory ALBO Wzgorza — wołane osobno dla każdego, patrz
 * niżej), żeby nowe mini-skupiska tego typu nigdy się z nim nie stykały. Mutuje `excluded` w
 * miejscu. Deterministyczne (BFS, zero losowości) — kolejność `sources` nie wpływa na wynikowy
 * zbiór (tylko na kolejność odwiedzania), więc A=B zostaje niezależnie od tego, w jakiej
 * kolejności wołający poda źródła.
 */
function bfsExpandExclusion(
  hexes: Record<string, Hex>,
  excluded: Set<string>,
  sources: string[],
  minDist: number,
): void {
  const queue: Array<{ k: string; d: number }> = [];
  for (const k of sources) {
    if (!excluded.has(k)) excluded.add(k);
    queue.push({ k, d: 0 });
  }
  let head = 0;
  while (head < queue.length) {
    const { k, d } = queue[head++]!;
    if (d >= minDist) continue;
    const { q, r } = parseHexKey(k);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (excluded.has(nk)) continue;
      if (!hexes[nk]) continue;
      excluded.add(nk);
      queue.push({ k: nk, d: d + 1 });
    }
  }
}

/**
 * Czy heks `k` (z jego WŁASNYM mtnNoise `n`) jest wykluczony jako miejsce nowego mini-skupiska —
 * Maciej 2026-07-25, PYTANIE 80. Wyklucza WEDŁUG PROSPEKTYWNEGO typu terenu (ten sam próg
 * mtnTh/hiTh co reszta reliefu decyduje, czy `k` zostanie Górami czy Wzgórzami, GDYBY go
 * umieścić) — heks, który skończy jako Góry, sprawdza TYLKO strefę zakazaną wokół istniejących
 * Gór (excludedGory); heks kończący jako Wzgórza sprawdza TYLKO strefę wokół istniejących Wzgórz
 * (excludedWzgorza). To ważne, bo flood-fill (capMountainRangeClusterSize) liczy skupiska Gór i
 * Wzgórz OSOBNO — nowe Góry mogą bezpiecznie stanąć tuż obok istniejących Wzgórz (różne typy,
 * nigdy się nie zleją), więc dzielenie stref zakazanych wg typu prawie DWUKROTNIE zwiększa
 * dostępną przestrzeń względem jednej wspólnej strefy dla obu typów naraz (zmierzone empirycznie
 * — patrz komentarz przy regrowLostMountainClusters). Heks poniżej obu progów ("przerwa" w
 * paśmie, nie zostanie reliefem) nigdy nie jest wykluczony — i tak nie wpływa na żadne skupisko.
 */
function isExcludedForRegrow(
  k: string,
  n: number,
  mtnTh: number,
  hiTh: number,
  excludedGory: Set<string>,
  excludedWzgorza: Set<string>,
): boolean {
  if (n > mtnTh) return excludedGory.has(k);
  if (n > hiTh) return excludedWzgorza.has(k);
  return false;
}

/**
 * Wariant walkMountainRange, który dodatkowo NIGDY nie wchodzi na heks wykluczony przez
 * isExcludedForRegrow (strefa zakazana wokół istniejącego reliefu, PER TYP — patrz
 * regrowLostMountainClusters) — poza tym identyczna logika (najwyższy mtnNoise + domieszka
 * rand(), nigdy nie zawraca).
 */
function walkMountainRangeAvoiding(
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  width: number,
  height: number,
  rand: () => number,
  start: string,
  steps: number,
  mtnTh: number,
  hiTh: number,
  excludedGory: Set<string>,
  excludedWzgorza: Set<string>,
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
        if (!isReliefCandidateHex(hex, nq, nr, width, height)) return false;
        const n = scratch.get(k)?.mtnNoise ?? 0;
        return !isExcludedForRegrow(k, n, mtnTh, hiTh, excludedGory, excludedWzgorza);
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
 * Odzyskuje ląd utracony przy przycinaniu przerośniętych skupisk (capMountainRangeClusterSize)
 * — Maciej 2026-07-25, PYTANIE 80 (po PYTANIU 63 — limit 10 heksów/skupisko ZOSTAJE, nienaruszalny).
 * Cel: przywrócić udział Gór+Wzgórz w lądzie sprzed limitu (~19%) generując WIĘCEJ mniejszych,
 * osobnych ognisk zamiast tracić teren przy przycinaniu wielkich, zrośniętych pasm.
 *
 * Zamiast po prostu skasować nadmiarowe heksy (jak robił dotąd capMountainRangeClusterSize),
 * ten krok dosiewa TYLE SAMO heksów jako NOWE mini-skupiska — krótszy spacer
 * (MOUNTAIN_RANGE_REGROW_LEN_MIN/MAX, 4-8 zamiast 11-14) wymuszony z dala
 * (MOUNTAIN_RANGE_REGROW_MIN_GAP heksów, BFS przez bfsExpandExclusion, OSOBNO dla Gór i Wzgórz —
 * patrz isExcludedForRegrow) od heksów TEGO SAMEGO typu — więc z definicji nie stykają się z
 * niczym i capMountainRangeClusterSize (wołany ponownie po tej funkcji, patrz growMountainRanges)
 * ich nie przytnie.
 *
 * Dlaczego nie wystarczyło po prostu podkręcić liczbę zwykłych pasm (większe maxPasmNaMase /
 * mniejsze hexyNaPasmo w mapGenMountainRangeParams) — zmierzone empirycznie PRZED wdrożeniem tej
 * funkcji: kandydaci na seed pasma (mountainRangeSeedCandidates) sortują po najwyższym mtnNoise,
 * który jest skoncentrowany wokół TEGO SAMEGO grzbietu co istniejące pasmo/podłoga
 * ensureReliefGridCoverage — dodatkowe pasma po prostu dorastały do tego samego zrośniętego
 * bloku, a capMountainRangeClusterSize przycinał go z powrotem do 10 (efekt sieciowy zerowy:
 * udział został ~13.8%, liczba skupisk Gór bez zmian — 181 vs 181). Wymuszony odstęp od
 * istniejącego reliefu w TEJ funkcji omija ten mechanizm — nowe ognisko fizycznie NIE MOŻE
 * dorosnąć do istniejącego bloku. Pierwsza wersja (jedna wspólna strefa zakazana dla Gór+Wzgórz)
 * odzyskiwała tylko ułamek deficytu, bo ląd jest już gęsto usiany reliefem (~14%) — dzielenie
 * strefy PER TYP (isExcludedForRegrow) prawie podwoiło odzysk.
 *
 * Determinizm: zero Math.random/Date.now — wyłącznie przekazany rand(), wołany w ustalonej
 * kolejności (masy w TEJ SAMEJ kolejności co główna pętla growMountainRanges, potem próby po
 * kolei, round-robin po masach) — ten sam seed = ta sama sekwencja wywołań rand() = identyczny
 * wynik (A=B).
 *
 * Zwraca liczbę faktycznie odzyskanych heksów (może być < `deficit`, jeśli zabraknie miejsca
 * z dala od istniejącego reliefu — pętla ma twardy limit prób bez postępu, nie jest nieskończona).
 */
function regrowLostMountainClusters(
  hexes: Record<string, Hex>,
  scratch: Map<string, TerrainScratch>,
  width: number,
  height: number,
  rand: () => number,
  masses: string[][],
  mtnTh: number,
  hiTh: number,
  deficit: number,
): number {
  if (deficit <= 0 || masses.length === 0) return 0;

  const excludedGory = new Set<string>();
  const excludedWzgorza = new Set<string>();
  const initialGory: string[] = [];
  const initialWzgorza: string[] = [];
  for (const key of Object.keys(hexes).sort()) {
    const hex = hexes[key]!;
    if (hex.terenBazowy === TerenBazowy.Gory) initialGory.push(key);
    else if (hex.terenBazowy === TerenBazowy.Wzgorza) initialWzgorza.push(key);
  }
  bfsExpandExclusion(hexes, excludedGory, initialGory, MOUNTAIN_RANGE_REGROW_MIN_GAP);
  bfsExpandExclusion(hexes, excludedWzgorza, initialWzgorza, MOUNTAIN_RANGE_REGROW_MIN_GAP);

  let recovered = 0;
  let massIdx = 0;
  let attemptsSinceProgress = 0;
  const maxAttemptsSinceProgress = masses.length * 40 + 200;

  while (recovered < deficit && attemptsSinceProgress < maxAttemptsSinceProgress) {
    const mass = masses[massIdx % masses.length]!;
    massIdx++;

    const seedCandidates = mass
      .filter((k) => {
        const hex = hexes[k];
        if (!hex) return false;
        if (
          hex.terenBazowy !== TerenBazowy.Laka
          && hex.terenBazowy !== TerenBazowy.Rownina
          && hex.terenBazowy !== TerenBazowy.Pustynia
        ) return false;
        const { q, r } = parseHexKey(k);
        if (!isReliefCandidateHex(hex, q, r, width, height)) return false;
        const n = scratch.get(k)?.mtnNoise ?? 0;
        return !isExcludedForRegrow(k, n, mtnTh, hiTh, excludedGory, excludedWzgorza);
      })
      .map((k) => ({ k, n: (scratch.get(k)?.mtnNoise ?? 0) + rand() * 0.15 }))
      .sort((a, b) => b.n - a.n);

    if (seedCandidates.length === 0) {
      attemptsSinceProgress++;
      continue;
    }

    const seedKey = seedCandidates[0]!.k;
    const len = MOUNTAIN_RANGE_REGROW_LEN_MIN
      + Math.floor(rand() * (MOUNTAIN_RANGE_REGROW_LEN_MAX - MOUNTAIN_RANGE_REGROW_LEN_MIN + 1));
    const path = [seedKey, ...walkMountainRangeAvoiding(
      hexes, scratch, width, height, rand, seedKey, len, mtnTh, hiTh, excludedGory, excludedWzgorza,
    )];

    const placedGory: string[] = [];
    const placedWzgorza: string[] = [];
    for (const k of path) {
      const hex = hexes[k];
      if (!hex) continue;
      if (
        hex.terenBazowy !== TerenBazowy.Laka
        && hex.terenBazowy !== TerenBazowy.Rownina
        && hex.terenBazowy !== TerenBazowy.Pustynia
      ) continue;
      const n = scratch.get(k)?.mtnNoise ?? 0;
      if (isExcludedForRegrow(k, n, mtnTh, hiTh, excludedGory, excludedWzgorza)) continue;
      if (n > mtnTh) {
        hex.terenBazowy = TerenBazowy.Gory;
        hex.nakladka = Nakladka.Brak;
        delete (hex as HexWithZloze).zloze;
        placedGory.push(k);
        recovered++;
      } else if (n > hiTh) {
        hex.terenBazowy = TerenBazowy.Wzgorza;
        hex.nakladka = Nakladka.Brak;
        delete (hex as HexWithZloze).zloze;
        placedWzgorza.push(k);
        recovered++;
      }
    }

    if (placedGory.length === 0 && placedWzgorza.length === 0) {
      attemptsSinceProgress++;
      continue;
    }
    attemptsSinceProgress = 0;
    if (placedGory.length > 0) {
      bfsExpandExclusion(hexes, excludedGory, placedGory, MOUNTAIN_RANGE_REGROW_MIN_GAP);
    }
    if (placedWzgorza.length > 0) {
      bfsExpandExclusion(hexes, excludedWzgorza, placedWzgorza, MOUNTAIN_RANGE_REGROW_MIN_GAP);
    }

    if (recovered >= deficit) break;
  }

  return recovered;
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
        if (cnt <= minHighlandsCopperCell(tier)) continue; // floor — nie schodzimy niżej
        hex.terenBazowy = TerenBazowy.Rownina;
        hex.nakladka = Nakladka.Brak;
        delete (hex as HexWithZloze).zloze;
        copperCellCount.set(ck, cnt - 1);
      } else {
        const ck = cellIdOf(item.q, item.r, ironSize);
        const cnt = ironCellCount.get(ck) ?? 0;
        if (cnt <= minMountainsIronCell(tier)) continue; // floor — nie schodzimy niżej
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

  // Twardy limit rozmiaru spójnego skupiska (Maciej 2026-07-25, PYTANIE 63): max
  // MAX_MOUNTAIN_RANGE_CLUSTER_SIZE (10) heksów Gór i osobno 10 heksów Wzgórz w jednym
  // skupisku sąsiadujących heksów TEGO SAMEGO typu terenu — żeby komputer rozkładał pasma
  // równomiernie i wszystkie cywilizacje miały dostęp do gór (złoża miedzi/żelaza/złota).
  // Na samym końcu, na finalnym stanie reliefu (po sanity-capie ~40% wyżej) — to ostatnie
  // miejsce w pipeline, w którym Gory/Wzgorza jeszcze się zmieniają (patrz generator.ts:
  // "relief... jest już finalny" zaraz po tym wywołaniu), więc łapie też duże skupiska
  // powstałe ze zrośnięcia z floor-reliefem ensureReliefGridCoverage (wołane PRZED tą
  // funkcją), nie tylko z tego, co dołożyła sama growMountainRanges.
  const mtnReverted = capMountainRangeClusterSize(
    hexes, scratch, TerenBazowy.Gory, TerenBazowy.Rownina, MAX_MOUNTAIN_RANGE_CLUSTER_SIZE,
  );
  const hiReverted = capMountainRangeClusterSize(
    hexes, scratch, TerenBazowy.Wzgorza, TerenBazowy.Rownina, MAX_MOUNTAIN_RANGE_CLUSTER_SIZE,
  );

  // Odzyskaj ląd utracony w przycinaniu wyżej (Maciej 2026-07-25, PYTANIE 80: "przywrócić
  // ilość terenu górskiego, generując WIĘCEJ mniejszych skupisk" — limit 10 heksów/skupisko
  // z PYTANIA 63 zostaje, ale udział Gór+Wzgórz w lądzie ma wrócić do ~19% sprzed limitu).
  // Patrz regrowLostMountainClusters: nowe mini-skupiska rosną z dala od istniejącego reliefu,
  // więc nie zostaną zjedzone przez capMountainRangeClusterSize poniżej.
  regrowLostMountainClusters(
    hexes, scratch, width, height, rand, masses, mtnTh, hiTh,
    Math.round((mtnReverted + hiReverted) * MOUNTAIN_RANGE_REGROW_TARGET_MULT),
  );

  // Siatka bezpieczeństwa: regrowLostMountainClusters z definicji trzyma nowe mini-skupiska z
  // dala od istniejącego reliefu (MOUNTAIN_RANGE_REGROW_MIN_GAP), więc w normalnych warunkach
  // nic tu nie przytnie — ale wołamy ponownie, żeby limit 10 heksów pozostał TWARDĄ, bezwyjątkową
  // gwarancją niezależnie od brzegowych przypadków (np. dwa mini-skupiska z RÓŻNYCH wywołań tej
  // funkcji w tej samej masie stykające się stycznie przez naprzemienne BFS-y).
  capMountainRangeClusterSize(
    hexes, scratch, TerenBazowy.Gory, TerenBazowy.Rownina, MAX_MOUNTAIN_RANGE_CLUSTER_SIZE,
  );
  capMountainRangeClusterSize(
    hexes, scratch, TerenBazowy.Wzgorza, TerenBazowy.Rownina, MAX_MOUNTAIN_RANGE_CLUSTER_SIZE,
  );

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
  return !isWaterTerrainLocal(tb);
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
    if (isWaterTerrainLocal(h.terenBazowy)) sea++;
    else land++;
  }
  return { land, sea, total: land + sea };
}

/** Priorytet usuwania lądu przy balansie — najpierw plaża, na końcu góry. */
const ERODE_TERRAIN_ORDER: TerenBazowy[] = [
  TerenBazowy.PlytkieMorze,
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
    if (nh && isWaterTerrainLocal(nh.terenBazowy)) n++;
  }
  return n;
}

/** ZADANIE 1: ląd = suchy ląd (bez Wybrzeża, które jest teraz wodą). */
function countLandNeighbors(hexes: Record<string, Hex>, q: number, r: number): number {
  let n = 0;
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nh = hexes[hexKey(q + dq, r + dr)];
    if (nh && !isWaterTerrainLocal(nh.terenBazowy)) n++;
  }
  return n;
}

function isCoastalLandHex(hexes: Record<string, Hex>, q: number, r: number): boolean {
  const h = hexes[hexKey(q, r)];
  if (!h || isWaterTerrainLocal(h.terenBazowy)) return false;
  return countMorseNeighbors(hexes, q, r) > 0;
}

function isCoastalMorseHex(hexes: Record<string, Hex>, q: number, r: number): boolean {
  const h = hexes[hexKey(q, r)];
  if (!h || !isWaterTerrainLocal(h.terenBazowy)) return false;
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

/** Wymusza morze w buforze 5% wysokości (proceduralne) lub ~30 hex (Ziemia, C-MAP-Q3c). */
export function enforceLatitudinalOceanBuffer(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
  isEarth: boolean,
): number {
  const buf = latitudinalOceanBufferRows(height, isEarth);
  let converted = 0;
  for (let r = 0; r < height; r++) {
    if (r >= buf && r < height - buf) continue;
    for (let q = 0; q < width; q++) {
      const hex = hexes[hexKey(q, r)];
      if (!hex || hex.terenBazowy === TerenBazowy.Morze) continue;
      setHexToMorze(hex);
      converted++;
    }
  }
  return converted;
}

/** Losowy wybór terenu bazowego wg pasu klimatu (góry/wzgórza nie dotykane). */
function climateBandBaseTerrain(band: ClimateBand, q: number, r: number, seed: number): TerenBazowy {
  if (isPolarClimateBand(band)) return TerenBazowy.Polarny;
  const h = hashInt3(q, r, seed);
  switch (band) {
    case 'desert':
      return h < 0.5 ? TerenBazowy.Pustynia : TerenBazowy.Rownina;
    case 'plains_north':
    case 'plains_south':
      return h < 0.7 ? TerenBazowy.Rownina : TerenBazowy.Laka;
    case 'temperate_north':
    case 'temperate_south':
    default:
      return h < 0.85 ? TerenBazowy.Laka : TerenBazowy.Rownina;
  }
}

/**
 * Nakłada pasy klimatyczne na ląd po reliefie (C-MAP-Q3).
 * Góry/wzgórza/morze/wybrzeże pozostają bez zmian.
 */
export function applyClimateBandsToHexes(
  hexes: Record<string, Hex>,
  height: number,
  seed: number,
  isEarth = false,
): number {
  let n = 0;
  for (const [key, hex] of Object.entries(hexes)) {
    const { q, r } = parseHexKey(key);
    const tb = hex.terenBazowy;
    if (
      isWaterTerrainLocal(tb)
      || tb === TerenBazowy.Gory
      || tb === TerenBazowy.Wzgorza
    ) {
      continue;
    }
    const band = climateBandAt(q, r, height, isEarth);
    const want = climateBandBaseTerrain(band, q, r, seed);
    if (tb !== want) {
      hex.terenBazowy = want;
      if (want === TerenBazowy.Polarny || want === TerenBazowy.Pustynia) {
        hex.nakladka = Nakladka.Brak;
        delete (hex as HexWithZloze).zloze;
      }
      n++;
    } else if (want === TerenBazowy.Polarny && hex.nakladka !== Nakladka.Brak) {
      hex.nakladka = Nakladka.Brak;
      delete (hex as HexWithZloze).zloze;
      n++;
    }
  }
  return n;
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

/** Jak sortować morze→ląd przy rebalance: center = wypełnij od środka (kontynenty); mask = tylko ranking maski (Pangea). */
export type LandFractionFillBias = 'center' | 'mask';

/** Min. score maski aby morze→ląd przy rebalance Pangea (zachowuje zatoki/wnęki). */
const PANGEA_LAND_FILL_MIN_SCORE = 0.11;

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
  fillBias: LandFractionFillBias = 'center',
  minMaskFillScore = PANGEA_LAND_FILL_MIN_SCORE,
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
    // Wzrost lądu bierze WYŁĄCZNIE z czystego Morza, nigdy z istniejącego pierścienia
    // PlytkieMorze (P-MAPGEN-PANGEA-OBRYS-P4-WYBRZEZE-Q1, świadomie zostawione bez
    // isWaterTerrain) — inaczej rebalance zjadałby wybrzeże zamiast otwartego morza.
    const morseCandidates = keys
      .filter((k) => {
        if (hexes[k]!.terenBazowy !== TerenBazowy.Morze || !borderOk(k)) return false;
        if (fillBias === 'mask' && (landScores.get(k) ?? 0) < minMaskFillScore) return false;
        return true;
      })
      .sort((a, b) => {
        const sa = landScores.get(a) ?? 0;
        const sb = landScores.get(b) ?? 0;
        if (Math.abs(sb - sa) > 0.04) return sb - sa;
        if (fillBias === 'mask') return a.localeCompare(b);
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
        .filter((k) => {
          if (hexes[k]!.terenBazowy !== TerenBazowy.Morze || !interiorOk(k)) return false;
          if (fillBias === 'mask' && (landScores.get(k) ?? 0) < minMaskFillScore) return false;
          return true;
        })
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
      keys.filter((k) => isDryLandTerrain(hexes[k]!.terenBazowy)),
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
 * Pangea: eroduj niski-score ląd na obwodzie bbox — obniża bboxFill bez prostokątnego fill.
 */
function erodePangeaBboxLowScoreRim(
  hexes: Record<string, Hex>,
  landScores: Map<string, number>,
  targetBboxFill = 0.74,
  maxErode = 1200,
): number {
  const landKeys = Object.keys(hexes).filter((k) => isDryLandTerrain(hexes[k]!.terenBazowy));
  if (landKeys.length === 0) return 0;

  let qMin = Infinity, qMax = -Infinity, rMin = Infinity, rMax = -Infinity;
  for (const k of landKeys) {
    const { q, r } = parseHexKey(k);
    qMin = Math.min(qMin, q);
    qMax = Math.max(qMax, q);
    rMin = Math.min(rMin, r);
    rMax = Math.max(rMax, r);
  }
  const bboxArea = Math.max(1, (qMax - qMin + 1) * (rMax - rMin + 1));
  let landCount = landKeys.length;
  let bboxFill = landCount / bboxArea;
  if (bboxFill <= targetBboxFill) return 0;

  const midQ = (qMin + qMax) / 2;
  const midR = (rMin + rMax) / 2;
  const rim = landKeys
    .filter((k) => {
      const { q, r } = parseHexKey(k);
      return q <= qMin + 2 || q >= qMax - 2 || r <= rMin + 2 || r >= rMax - 2;
    })
    .sort((a, b) => {
      const sa = landScores.get(a) ?? 0;
      const sb = landScores.get(b) ?? 0;
      if (Math.abs(sa - sb) > 0.02) return sa - sb;
      const pa = parseHexKey(a);
      const pb = parseHexKey(b);
      const da = Math.hypot(pa.q - midQ, pa.r - midR);
      const db = Math.hypot(pb.q - midQ, pb.r - midR);
      return db - da;
    });

  let eroded = 0;
  for (const k of rim) {
    if (bboxFill <= targetBboxFill || eroded >= maxErode) break;
    setHexToMorze(hexes[k]!);
    landCount--;
    bboxFill = landCount / bboxArea;
    eroded++;
  }
  return eroded;
}

/**
 * FALA 189: gdy bbox lądu jest zbyt wydłużony (kapsuła), wytnij zatoki na długich bokach.
 * Cel: aspect ≤ ~1.85 i miejsce na 7 stolic (sep 12+).
 */
function carvePangeaLongSideGulfs(
  hexes: Record<string, Hex>,
  landScores: Map<string, number>,
  perm: Uint8Array,
  maxAspect = 1.85,
  maxCarve = 900,
): number {
  const landKeys = Object.keys(hexes).filter((k) => isDryLandTerrain(hexes[k]!.terenBazowy));
  if (landKeys.length < 80) return 0;

  let qMin = Infinity, qMax = -Infinity, rMin = Infinity, rMax = -Infinity;
  for (const k of landKeys) {
    const { q, r } = parseHexKey(k);
    qMin = Math.min(qMin, q);
    qMax = Math.max(qMax, q);
    rMin = Math.min(rMin, r);
    rMax = Math.max(rMax, r);
  }
  const spanQ = qMax - qMin + 1;
  const spanR = rMax - rMin + 1;
  const aspect = Math.max(spanQ, spanR) / Math.max(1, Math.min(spanQ, spanR));
  if (aspect <= maxAspect) return 0;

  const longIsQ = spanQ >= spanR;
  const midLong = longIsQ ? (qMin + qMax) / 2 : (rMin + rMax) / 2;
  const shortMin = longIsQ ? rMin : qMin;
  const shortMax = longIsQ ? rMax : qMax;
  const shortSpan = shortMax - shortMin + 1;
  const carveDepth = Math.max(3, Math.floor(shortSpan * 0.28));

  const scored = landKeys
    .map((k) => {
      const { q, r } = parseHexKey(k);
      const along = longIsQ ? q : r;
      const across = longIsQ ? r : q;
      const onLongSide = across <= shortMin + carveDepth || across >= shortMax - carveDepth;
      const nearMid = Math.abs(along - midLong) < Math.max(spanQ, spanR) * 0.42;
      const noise = fbm(perm, q * 0.08 + 40, r * 0.08 + 40, 3);
      return { k, score: (landScores.get(k) ?? 0) + noise * 0.15, onLongSide, nearMid, across };
    })
    .filter((x) => x.onLongSide && x.nearMid)
    .sort((a, b) => a.score - b.score);

  let carved = 0;
  for (const x of scored) {
    if (carved >= maxCarve) break;
    // Preferuj zewnętrzną krawędź krótkiego boku.
    const distEdge = Math.min(x.across - shortMin, shortMax - x.across);
    if (distEdge > carveDepth) continue;
    setHexToMorze(hexes[x.k]!);
    carved++;
  }

  // Po wycięciu — ponów pomiar; jeśli nadal za długie, jeszcze raz płyciej.
  return carved;
}

/**
 * Pangea (FALA 188/189): rebalance wg maski blobów — izotropowe bloby + zatoki
 * na długich bokach (bez center-fill / marginal caps).
 */
export function rebalanceLandFractionPangea(
  hexes: Record<string, Hex>,
  landScores: Map<string, number>,
  targetLandFraction: number,
  width: number,
  height: number,
  perm: Uint8Array,
): void {
  const fillMin = pangeaLandLayoutParams(targetLandFraction, width, height).fillMinScore;
  fillPangeaAnnularSeaCorridors(hexes, width, height);
  applyLandFractionByScore(hexes, landScores, targetLandFraction, width, height, 'mask', fillMin);
  enforceMapBorderOcean(hexes, width, height);
  erodePangeaBboxLowScoreRim(hexes, landScores);
  carvePangeaLongSideGulfs(hexes, landScores, perm);
  fillPangeaAnnularSeaCorridors(hexes, width, height);
  applyLandFractionByScore(hexes, landScores, targetLandFraction, width, height, 'mask', fillMin);
  enforceMapBorderOcean(hexes, width, height);
  erodePangeaBboxLowScoreRim(hexes, landScores);
  carvePangeaLongSideGulfs(hexes, landScores, perm);
  fillPangeaAnnularSeaCorridors(hexes, width, height);
  ensurePangeaSingleContinent(hexes, width, height);
  applyLandFractionByScore(hexes, landScores, targetLandFraction, width, height, 'mask', fillMin);
  enforceMapBorderOcean(hexes, width, height);
  applyJaggedCoastNoise(hexes, perm, width, height, 5);
  // Po ostatnim rebalance (może znów wyciąć mosty) — twardo jedna masa.
  fillPangeaAnnularSeaCorridors(hexes, width, height);
  ensurePangeaSingleContinent(hexes, width, height);
  enforceMapBorderOcean(hexes, width, height);
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
    let land = keys.filter((k) => isDryLandTerrain(hexes[k]!.terenBazowy)).length;

    if (land < quota) {
      // Jak w applyLandFractionByScore — wzrost tylko z czystego Morza, nigdy z pierścienia
      // PlytkieMorze (P-MAPGEN-PANGEA-OBRYS-P4-WYBRZEZE-Q1, świadomie bez isWaterTerrain).
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
        keys.filter((k) => isDryLandTerrain(hexes[k]!.terenBazowy)),
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
  return !isWaterTerrainLocal(tb);
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
    hex.terenBazowy = TerenBazowy.PlytkieMorze;
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
      if (nb?.terenBazowy === TerenBazowy.PlytkieMorze) {
        toCoast.push(key);
        break;
      }
    }
  }
  for (const key of toCoast) {
    const hex = hexes[key]!;
    hex.terenBazowy = TerenBazowy.PlytkieMorze;
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
    if (hex.terenBazowy !== TerenBazowy.PlytkieMorze) continue;
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
      if (hexes[nk]?.terenBazowy === TerenBazowy.PlytkieMorze) {
        valid.add(nk);
        queue.push(nk);
      }
    }
  }

  let fixed = 0;
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy !== TerenBazowy.PlytkieMorze) continue;
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
    isWaterTerrainLocal(tb);

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
      return isWaterTerrainLocal(tb) && !ocean.has(k);
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
      if (!nh || isWaterTerrainLocal(nh.terenBazowy)) continue;
      dryN++;
      if (nh.terenBazowy === TerenBazowy.Pustynia) pustN++;
    }
    const hex = hexes[key]!;
    const inDesert = climateBandAt(q, r, height) === 'desert';
    hex.terenBazowy = inDesert && (pustN >= 2 || (dryN > 0 && pustN >= dryN * 0.4))
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
      if (!isWaterTerrainLocal(hex.terenBazowy)) {
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

/** Maks. szerokość korytarza obwarzanka do wypełnienia — skala z rozmiarem mapy. */
function pangeaAnnularMaxCorridorWidth(width: number, height: number): number {
  const mapScale = Math.sqrt((width * height) / 20160);
  // FALA 195: szerszy fill — przy 20% lądu moat bywał > poprzedniego limitu i zostawał.
  return Math.max(6, Math.min(22, Math.round(6 + mapScale * 2.6)));
}

/**
 * Masy tylko suchego lądu (bez Wybrzeża) — do anti-obwarzanka / mostów Pangea.
 */
function groupDryLandMassKeys(hexes: Record<string, Hex>): string[][] {
  const visited = new Set<string>();
  const groups: string[][] = [];
  for (const key of Object.keys(hexes)) {
    const hex = hexes[key];
    if (!hex || !isDryLandTerrain(hex.terenBazowy)) continue;
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
        if (!nh || !isDryLandTerrain(nh.terenBazowy)) continue;
        visited.add(nk);
        stack.push(nk);
      }
    }
    groups.push(mass);
  }
  return groups;
}

/**
 * FALA 195/199: Pangea = jedna masa. Most przez Morze **i Wybrzeże**
 * (audyt 2026-08-02: obwarzanek to często 2 heksy Wybrzeża, nie Morza —
 * stare BFS tylko po Morzu było ślepe).
 */
function isPangeaBridgeWater(tb: TerenBazowy): boolean {
  return isWaterTerrainLocal(tb);
}

export function ensurePangeaSingleContinent(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
): number {
  const mapScale = Math.sqrt((width * height) / 20160);
  // FALA 198: szerszy most — opaska/moat po wybrzeżu bywa >12–20 hex.
  const maxBridge = Math.max(18, Math.min(48, Math.round(16 + mapScale * 6)));
  let converted = 0;

  for (let iter = 0; iter < 12; iter++) {
    const masses = groupDryLandMassKeys(hexes).sort((a, b) => b.length - a.length);
    if (masses.length <= 1) break;
    const main = masses[0]!;
    const mainSet = new Set(main);

    // Multi-source BFS od brzegu głównej masy w wodę mostową — szukaj obcej masy.
    const dist = new Map<string, number>();
    const parent = new Map<string, string>();
    const queue: string[] = [];
    for (const k of main) {
      const { q, r } = parseHexKey(k);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        const nh = hexes[nk];
        if (!nh || !isPangeaBridgeWater(nh.terenBazowy)) continue;
        if (dist.has(nk)) continue;
        dist.set(nk, 1);
        parent.set(nk, k);
        queue.push(nk);
      }
    }

    let hitSea: string | null = null;
    let qi = 0;
    while (qi < queue.length) {
      const cur = queue[qi++]!;
      const d = dist.get(cur)!;
      if (d > maxBridge) continue;
      const { q, r } = parseHexKey(cur);
      let foundForeign = false;
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        const nh = hexes[nk];
        if (!nh) continue;
        if (isDryLandTerrain(nh.terenBazowy)) {
          if (!mainSet.has(nk)) {
            hitSea = cur;
            foundForeign = true;
            break;
          }
          continue;
        }
        if (!isPangeaBridgeWater(nh.terenBazowy)) continue;
        if (dist.has(nk)) continue;
        dist.set(nk, d + 1);
        parent.set(nk, cur);
        queue.push(nk);
      }
      if (foundForeign) break;
    }

    if (!hitSea) {
      // Obce masy poza maxBridge — usuń obręcz/opaskę (do 25% głównej masy).
      for (let mi = 1; mi < masses.length; mi++) {
        const other = masses[mi]!;
        if (other.length > Math.max(60, Math.floor(main.length * 0.25))) continue;
        for (const k of other) {
          const h = hexes[k];
          if (h && isDryLandTerrain(h.terenBazowy)) {
            setHexToMorze(h);
            converted++;
          }
        }
      }
      break;
    }

    // Wypełnij ścieżkę wody (Morze/Wybrzeże) od hitSea wstecz do lądu głównego.
    let cur: string | undefined = hitSea;
    let pathLen = 0;
    while (cur && pathLen <= maxBridge + 2) {
      const h = hexes[cur];
      if (!h) break;
      if (isPangeaBridgeWater(h.terenBazowy)) {
        setHexToLaka(h);
        converted++;
      }
      if (mainSet.has(cur)) break;
      cur = parent.get(cur);
      pathLen++;
    }
  }

  converted += fillPangeaAnnularSeaCorridors(hexes, width, height);
  return converted;
}

function pangeaLandCentroid(hexes: Record<string, Hex>): { cQ: number; cR: number } | null {
  const landKeys = Object.keys(hexes).filter((k) => isDryLandTerrain(hexes[k]!.terenBazowy));
  if (landKeys.length < 40) return null;
  let sumQ = 0;
  let sumR = 0;
  for (const k of landKeys) {
    const { q, r } = parseHexKey(k);
    sumQ += q;
    sumR += r;
  }
  return { cQ: sumQ / landKeys.length, cR: sumR / landKeys.length };
}

/** Kroki wzdłuż promienia do najbliższego suchego lądu (przez Morze lub Wybrzeże). */
function pangeaRadialDryLandSteps(
  hexes: Record<string, Hex>,
  q: number,
  r: number,
  cQ: number,
  cR: number,
  towardCenter: boolean,
  maxSteps: number,
): number | null {
  const distSelf = Math.hypot(q - cQ, r - cR);
  if (distSelf < 0.01) return null;
  const uq = (q - cQ) / distSelf;
  const ur = (r - cR) / distSelf;
  const sign = towardCenter ? -1 : 1;
  for (let step = 1; step <= maxSteps; step++) {
    const nq = Math.round(q + sign * uq * step);
    const nr = Math.round(r + sign * ur * step);
    const nh = hexes[hexKey(nq, nr)];
    if (!nh) return null;
    if (isDryLandTerrain(nh.terenBazowy)) return step;
    if (!isPangeaBridgeWater(nh.terenBazowy)) return null;
  }
  return null;
}

function pangeaSeaHexIsAnnularCorridor(
  hexes: Record<string, Hex>,
  q: number,
  r: number,
  cQ: number,
  cR: number,
  maxCorridorWidth: number,
): boolean {
  const inward = pangeaRadialDryLandSteps(hexes, q, r, cQ, cR, true, maxCorridorWidth);
  const outward = pangeaRadialDryLandSteps(hexes, q, r, cQ, cR, false, maxCorridorWidth);
  if (inward == null || outward == null) return false;
  return inward <= maxCorridorWidth && outward <= maxCorridorWidth;
}

/**
 * Liczba heksów wody (Morze/Wybrzeże) w cienkim pierścieniu rdzeń↔obręcz.
 * FALA 199: liczy też Wybrzeże — to był „niewidzialny” moat w audycie.
 */
export function measurePangeaAnnularCorridorHexes(
  hexes: Record<string, Hex>,
  width = 0,
  height = 0,
): number {
  const centroid = pangeaLandCentroid(hexes);
  if (!centroid) return 0;
  const { cQ, cR } = centroid;
  const maxW = width > 0 && height > 0
    ? pangeaAnnularMaxCorridorWidth(width, height)
    : 6;

  let annular = 0;
  for (const hex of Object.values(hexes)) {
    if (!isPangeaBridgeWater(hex.terenBazowy)) continue;
    const { q, r } = hex.coords;
    if (pangeaSeaHexIsAnnularCorridor(hexes, q, r, cQ, cR, maxW)) annular++;
  }
  return annular;
}

/** Audyt obwarzanka — snapshoty po etapach (tylko gdy startPangeaBagelAudit()). */
export type PangeaBagelAuditSnap = {
  stage: string;
  annular: number;
  dryMasses: number;
  dryLand: number;
  inlandMorze: number;
};

export let pangeaBagelAuditSnaps: PangeaBagelAuditSnap[] | null = null;

export function startPangeaBagelAudit(): void {
  pangeaBagelAuditSnaps = [];
}

export function takePangeaBagelAuditSnaps(): PangeaBagelAuditSnap[] {
  const out = pangeaBagelAuditSnaps ?? [];
  pangeaBagelAuditSnaps = null;
  return out;
}

export function snapPangeaBagelAudit(
  stage: string,
  hexes: Record<string, Hex>,
  width: number,
  height: number,
): void {
  if (!pangeaBagelAuditSnaps) return;
  const masses = groupDryLandMassKeys(hexes);
  let dryLand = 0;
  for (const m of masses) dryLand += m.length;
  pangeaBagelAuditSnaps.push({
    stage,
    annular: measurePangeaAnnularCorridorHexes(hexes, width, height),
    dryMasses: masses.length,
    dryLand,
    inlandMorze: findInlandSeaHexes(hexes, width, height).length,
  });
}

/**
 * Wypełnia cienkie korytarze wody (Morze/Wybrzeże) między rdzeniem a obręczą Pangea.
 * FALA 199: wcześniej tylko Morze — pierścień Wybrzeża zostawał jako „niewidzialny” moat.
 */
export function fillPangeaAnnularSeaCorridors(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
  maxCorridorWidth?: number,
): number {
  const maxW = maxCorridorWidth ?? pangeaAnnularMaxCorridorWidth(width, height);
  const borderDepth = morseDepthFromMapBorder(hexes, width, height);
  let converted = 0;

  for (let pass = 0; pass < maxW + 2; pass++) {
    const centroid = pangeaLandCentroid(hexes);
    if (!centroid) break;
    const { cQ, cR } = centroid;
    let passConverted = 0;

    for (const [key, hex] of Object.entries(hexes)) {
      if (!isPangeaBridgeWater(hex.terenBazowy)) continue;
      const { q, r } = hex.coords;
      if (!pangeaSeaHexIsAnnularCorridor(hexes, q, r, cQ, cR, maxW)) continue;

      // Nie wypełniaj szerokich zatok otwartych do oceanu — tylko cienki pierścień.
      if (borderDepth.has(key)) {
        const distSelf = Math.hypot(q - cQ, r - cR);
        const uq = (q - cQ) / Math.max(0.01, distSelf);
        const ur = (r - cR) / Math.max(0.01, distSelf);
        let seaBand = 1;
        for (let step = 1; step <= maxW + 2; step++) {
          const oq = Math.round(q + uq * step);
          const or = Math.round(r + ur * step);
          const oh = hexes[hexKey(oq, or)];
          if (!oh || !isPangeaBridgeWater(oh.terenBazowy)) break;
          seaBand++;
        }
        for (let step = 1; step <= maxW + 2; step++) {
          const iq = Math.round(q - uq * step);
          const ir = Math.round(r - ur * step);
          const ih = hexes[hexKey(iq, ir)];
          if (!ih || !isPangeaBridgeWater(ih.terenBazowy)) break;
          seaBand++;
        }
        if (seaBand > maxW + 1) continue;
      }

      setHexToLaka(hex);
      passConverted++;
    }
    converted += passConverted;
    if (passConverted === 0) break;
  }
  return converted;
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
    if (!isWaterTerrainLocal(tb)) continue;
    const { q, r } = hex.coords;
    const key = hexKey(q, r);
    if (depth.has(key)) continue;

    let reliefNeighbors = 0;
    let dryLandNeighbors = 0;
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nh = hexes[hexKey(q + dq, r + dr)];
      if (!nh || isWaterTerrainLocal(nh.terenBazowy)) continue;
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
    if (hex.terenBazowy === TerenBazowy.PlytkieMorze) {
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
        if (nb && (isDryLandTerrain(nb.terenBazowy) || nb.terenBazowy === TerenBazowy.PlytkieMorze)) {
          toCoast.push(key);
          break;
        }
      }
    }
    if (toCoast.length === 0) break;
    for (const key of toCoast) {
      const hex = hexes[key]!;
      hex.terenBazowy = TerenBazowy.PlytkieMorze;
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
    if (hex.terenBazowy !== TerenBazowy.PlytkieMorze) continue;
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
    if (isWaterTerrainLocal(hex.terenBazowy)) {
      continue;
    }
    const { q, r } = hex.coords;
    let dryLandNeighbors = 0;
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nh = hexes[hexKey(q + dq, r + dr)];
      if (!nh) continue;
      if (!isWaterTerrainLocal(nh.terenBazowy)) {
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
    if (isWaterTerrainLocal(hex.terenBazowy)) {
      continue;
    }
    const { q, r } = hex.coords;
    let dryLandNeighbors = 0;
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nh = hexes[hexKey(q + dq, r + dr)];
      if (!nh) continue;
      if (!isWaterTerrainLocal(nh.terenBazowy)) {
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

/** Domyślna tolerancja wymuszenia suchego lądu: ±3 pkt % mapy. */
const DRY_LAND_FRACTION_TOLERANCE_PP = 3;

/**
 * Ostatni pass przed rzekami: wymusza docelowy udział **suchego lądu** (Wybrzeże = woda,
 * jak {@link countLandSeaHexes}) po wszystkich krokach kształtowania wybrzeża.
 * Lekki coast pass + ewentualna korekta jeśli pierścień przesunął licznik.
 */
export function enforceTargetDryLandFraction(
  hexes: Record<string, Hex>,
  landScores: Map<string, number>,
  targetLandFraction: number,
  width: number,
  height: number,
  coastOpts?: { maxInlandPoolSize?: number },
  tolerancePctPoints = DRY_LAND_FRACTION_TOLERANCE_PP,
  fillBias: LandFractionFillBias = 'center',
  minMaskFillScore = PANGEA_LAND_FILL_MIN_SCORE,
): number {
  const clamped = Math.max(0.15, Math.min(0.85, targetLandFraction));
  const total = Object.keys(hexes).length;
  const targetLand = Math.round(total * clamped);
  const toleranceHexes = Math.max(1, Math.round(total * tolerancePctPoints / 100));
  let adjusted = 0;

  adjusted += applyLandFractionByScore(hexes, landScores, clamped, width, height, fillBias, minMaskFillScore);
  enforceMapBorderOcean(hexes, width, height);

  finalizeCoastAndInlandWater(hexes, width, height, 1, coastOpts);
  enforceMapBorderOcean(hexes, width, height);

  let { land } = countLandSeaHexes(hexes);
  if (Math.abs(land - targetLand) > toleranceHexes) {
    adjusted += applyLandFractionByScore(hexes, landScores, clamped, width, height, fillBias, minMaskFillScore);
    enforceMapBorderOcean(hexes, width, height);
    applyCoastRing(hexes);
    land = countLandSeaHexes(hexes).land;
    if (Math.abs(land - targetLand) > toleranceHexes) {
      adjusted += applyLandFractionByScore(hexes, landScores, clamped, width, height, fillBias, minMaskFillScore);
      enforceMapBorderOcean(hexes, width, height);
    }
  }

  return adjusted;
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
  [TerenBazowy.PlytkieMorze]: 1,
  [TerenBazowy.Laka]:     2,
  [TerenBazowy.Pustynia]: 3,
  [TerenBazowy.Rownina]:  4,
  [TerenBazowy.Wzgorza]:  5,
  [TerenBazowy.Gory]:     6,
  [TerenBazowy.Polarny]:  2,
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
    if (!isWaterTerrainLocal(hex.terenBazowy)) continue;
    let pustN = 0;
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nh = hexes[hexKey(q + dq, r + dr)];
      if (!nh || isWaterTerrainLocal(nh.terenBazowy)) continue;
      if (nh.terenBazowy === TerenBazowy.Pustynia) pustN++;
    }
    hex.terenBazowy = climateBandAt(q, r, height) === 'desert' && pustN >= 2
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
    if (!h || isWaterTerrainLocal(h.terenBazowy)) break;
    land.push({ q: p.q, r: p.r });
  }
  if (land.length < 2) return land;
  const src = hexKey(land[0]!.q, land[0]!.r);
  const clean = sanitizeRiverPath(land);
  if (assertRiverPathAdjacent(clean)) return clean;
  return repairRiverPathAdjacency(clean, hexes, src);
}

/** Ile hexów ścieżki medium leży na suchym lądzie (bez morza/wybrzeża) — widoczność wstęgi. */
export function countMediumInlandLandHexes(
  hexes: Record<string, Hex>,
  path: Array<{ q: number; r: number }>,
): number {
  let n = 0;
  for (const p of path) {
    const h = hexes[hexKey(p.q, p.r)];
    if (h && isRiverLandTerrain(h.terenBazowy)) n++;
  }
  return n;
}

/**
 * Render średniego dopływu — tylko suchy ląd (pomija Wybrzeże/Morze w środku trasy).
 * landRiverRenderPath urywa na pierwszym Wybrzeżu → niewidoczne „wybrzeżniki" (FALA 187 fix).
 */
export function mediumRiverRenderPath(
  hexes: Record<string, Hex>,
  path: Array<{ q: number; r: number }>,
): Array<{ q: number; r: number }> {
  const land: RiverCoord[] = [];
  for (const p of path) {
    const h = hexes[hexKey(p.q, p.r)];
    if (h && isRiverLandTerrain(h.terenBazowy)) land.push({ q: p.q, r: p.r });
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
    if (h.terenBazowy === TerenBazowy.PlytkieMorze) {
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
      if (lh?.terenBazowy === TerenBazowy.PlytkieMorze && hasMorzeNeighborForRiverRender(hexes, lp.q, lp.r)) {
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
        if (nh?.terenBazowy !== TerenBazowy.PlytkieMorze) continue;
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
    if (ph && !isWaterTerrainLocal(ph.terenBazowy)) {
      out.unshift({ q: prev.q, r: prev.r });
    }
  }
  const src = hexKey(out[0]!.q, out[0]!.r);
  return repairRiverPathAdjacency(out, hexes, src);
}

function hasLandNeighborTouchingSea(hexes: Record<string, Hex>, q: number, r: number): boolean {
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nh = hexes[hexKey(q + dq, r + dr)];
    if (nh && isWaterTerrainLocal(nh.terenBazowy)) return true;
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

/** Czy ścieżka odwiedza ten sam heks więcej niż raz (pętla w path). */
export function riverPathHasRevisitedHex(path: RiverCoord[]): boolean {
  const seen = new Set<string>();
  for (const p of path) {
    const k = hexKey(p.q, p.r);
    if (seen.has(k)) return true;
    seen.add(k);
  }
  return false;
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

/** Min. odległość (hex) między głównymi nurtami — od ścieżki, nie tylko źródeł (Maciej 2026-08-01). */
export const MAIN_RIVER_MIN_PATH_SEP = 3;

/** FALA 181: odstęp wzdłuż main (w hexach / bokach) między spawnami średnich dopływów. */
export const MEDIUM_TRIBUTARY_SPACING_HEX = 4;

/** Odstęp spawnów średnich dopływów — stały 4 hex (bez cięcia perf na Super Huge). */
export function mediumTributarySpacingHex(_width: number, _height: number, _largeMapPerf = false): number {
  return MEDIUM_TRIBUTARY_SPACING_HEX;
}

/** FALA 181/183: min. liczba hex poza głównym nurtem na standardowych mapach. */
export const MEDIUM_TRIBUTARY_MIN_NET_LEN = 7;

/** Skalowana min. długość dopływu (hex netto poza main) — mniejsze mapy dostają niższy próg. */
export function mediumTributaryMinNetLen(width: number, height: number): number {
  const minDim = Math.min(width, height);
  if (minDim < 80) return 4;
  if (minDim < 120) return 5;
  return MEDIUM_TRIBUTARY_MIN_NET_LEN;
}

/** Max odstęp wzdłuż wybrzeża między ujściami głównych rzek (Maciej 2026-08-02, FALA 170). */
export const MAIN_RIVER_COAST_MOUTH_MAX_GAP = 7;

/** Skala max gap per rozmiar mapy — Mała/Maleńki 5, Standard/Duża+ 7. */
export function mainRiverCoastMouthMaxGapForDims(w: number, h: number): number {
  const label = mapSizeLabelFromDims(w, h);
  if (label === 'mala') return 5;
  return MAIN_RIVER_COAST_MOUTH_MAX_GAP;
}

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
    if (!h || isWaterTerrainLocal(h.terenBazowy)) return false;
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
    if (isWaterTerrainLocal(hex.terenBazowy)) {
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

// ── Profil czasowy rzek (CIV_RIVER_PROFILE=1) ───────────────────────────────
const RIVER_PROFILE_ON =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ?.CIV_RIVER_PROFILE === '1';

function rpNow(): number {
  if (typeof performance !== 'undefined') return performance.now();
  return Date.now();
}

export interface RiverProfileStats {
  fieldCacheMs: number;
  fieldCacheCalls: number;
  generateRiversMs: number;
  genStage1Ms: number;
  genStage2Ms: number;
  genStage3Ms: number;
  genDecorMs: number;
  genDryPatchMs: number;
  genStage2Rounds: number;
  topUpMs: number;
  topUpPassMs: number[];
  topUpHardStartsMs: number;
  topUpDryPatchMs: number;
  topUpGridProxMs: number;
  traceRiverCalls: number;
  traceRiverMs: number;
  aStarCalls: number;
  aStarMs: number;
  forceFillCalls: number;
}

let _riverProfile: RiverProfileStats | null = null;

function rpEnsure(): RiverProfileStats {
  if (!_riverProfile) {
    _riverProfile = {
      fieldCacheMs: 0, fieldCacheCalls: 0,
      generateRiversMs: 0, genStage1Ms: 0, genStage2Ms: 0, genStage3Ms: 0,
      genDecorMs: 0, genDryPatchMs: 0, genStage2Rounds: 0,
      topUpMs: 0, topUpPassMs: [],
      topUpHardStartsMs: 0, topUpDryPatchMs: 0, topUpGridProxMs: 0,
      traceRiverCalls: 0, traceRiverMs: 0,
      aStarCalls: 0, aStarMs: 0,
      forceFillCalls: 0,
    };
  }
  return _riverProfile;
}

export function resetRiverProfileStats(): void {
  _riverProfile = null;
}

export function getRiverProfileStats(): RiverProfileStats | null {
  return _riverProfile ? { ..._riverProfile, topUpPassMs: [..._riverProfile.topUpPassMs] } : null;
}

export function formatRiverProfileReport(totalMs?: number): string {
  const s = getRiverProfileStats();
  if (!s) return '(profiler off — set CIV_RIVER_PROFILE=1)';
  const riverMs = s.generateRiversMs + s.topUpMs;
  const denom = totalMs ?? riverMs;
  const pct = (ms: number) => (denom > 0 ? ((ms / denom) * 100).toFixed(1) : '0.0');
  return [
    '=== RIVER PROFILE (CIV_RIVER_PROFILE=1) ===',
    `fieldCache:        ${s.fieldCacheMs.toFixed(0)}ms (${pct(s.fieldCacheMs)}%) ×${s.fieldCacheCalls}`,
    `generateRivers:    ${s.generateRiversMs.toFixed(0)}ms (${pct(s.generateRiversMs)}%)`,
    `  stage1 (main):   ${s.genStage1Ms.toFixed(0)}ms (${pct(s.genStage1Ms)}%)`,
    `  stage2 (medium): ${s.genStage2Ms.toFixed(0)}ms (${pct(s.genStage2Ms)}%) rounds=${s.genStage2Rounds}`,
    `  stage3 (short):  ${s.genStage3Ms.toFixed(0)}ms (${pct(s.genStage3Ms)}%)`,
    `  decor tributary: ${s.genDecorMs.toFixed(0)}ms (${pct(s.genDecorMs)}%)`,
    `  gen dry-patch:   ${s.genDryPatchMs.toFixed(0)}ms (${pct(s.genDryPatchMs)}%)`,
    `topUp total:       ${s.topUpMs.toFixed(0)}ms (${pct(s.topUpMs)}%)`,
    ...s.topUpPassMs.map((ms, i) => `  pass ${i + 1}:        ${ms.toFixed(0)}ms (${pct(ms)}%)`),
    `  hardStarts:      ${s.topUpHardStartsMs.toFixed(0)}ms (${pct(s.topUpHardStartsMs)}%)`,
    `  dryPatch:        ${s.topUpDryPatchMs.toFixed(0)}ms (${pct(s.topUpDryPatchMs)}%)`,
    `  grid+proximity:  ${s.topUpGridProxMs.toFixed(0)}ms (${pct(s.topUpGridProxMs)}%)`,
    `traceRiver:        ${s.traceRiverMs.toFixed(0)}ms (${pct(s.traceRiverMs)}%) ×${s.traceRiverCalls}`,
    `aStarRiverToSea:   ${s.aStarMs.toFixed(0)}ms (${pct(s.aStarMs)}%) ×${s.aStarCalls}`,
    `forceFill:         ×${s.forceFillCalls}`,
    `rivers subtotal:   ${riverMs.toFixed(0)}ms`,
  ].join('\n');
}

/** Cache pól morza — buduj raz na blok rzek (generateRivers / topUp). */
export interface RiverFieldCache {
  seaDist: Map<string, number>;
  oceanConnected: Set<string>;
  openOceanDist: Map<string, number>;
}

export function buildRiverFieldCache(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
): RiverFieldCache {
  const t0 = RIVER_PROFILE_ON ? rpNow() : 0;
  const oceanConnected = oceanConnectedWaterKeys(hexes, width, height);
  const out = {
    seaDist: buildSeaDistanceField(hexes),
    oceanConnected,
    openOceanDist: buildOpenOceanDistanceField(hexes, width, height, oceanConnected),
  };
  if (RIVER_PROFILE_ON) {
    const s = rpEnsure();
    s.fieldCacheMs += rpNow() - t0;
    s.fieldCacheCalls++;
  }
  return out;
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
  hardMeanderLen?: number;
  mouthTailLen?: number;
  /** Tylko fill/force: trasa może przechodzić przez wzgórza/góry (nie tylko źródło). */
  allowReliefTraversal?: boolean;
  /** Tylko fill/force: pomiń bufor 2 hex od morza (ujście nadal wymagane). */
  relaxSeaBuffer?: boolean;
  /** Istniejące heksy rzek — soft sep: blok tylko kroku na hex < minPathSep (FALA 173). */
  blockRiverKeys?: Set<string>;
  /** Indeks sep — perf Super Huge (PERF-SUPER-HUGE-PANGEA-80). */
  riverSepIndex?: RiverHexSpatialIndex | null;
  minPathSep?: number;
  /** Centroid masy lądowej — fallback kierunku wzrostu (FALA 173). */
  landCentroid?: { q: number; r: number } | null;
  /** Kwadrat centrum kontynentu — cel kierunku rzek (FALA 186, 5×5). */
  landCenterSquare?: ContinentCenterSquare | null;
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
  allowReliefTraversal = false,
): boolean {
  // Świadomie Morze-only, nie isWaterTerrain (P-MAPGEN-PANGEA-OBRYS-P4-WYBRZEZE-Q1): rzeka
  // MUSI móc wejść na PlytkieMorze (tam kończy się jej ujście — patrz extendRiverToWybrzeze/
  // finishRiverMouthAtSea niżej), ale nigdy dalej w głąb Morza.
  if (!hex || hex.terenBazowy === TerenBazowy.Morze) return false;
  if (isReliefTerrain(hex.terenBazowy) && !allowReliefTraversal) return cellKey === sourceKey;
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
  hardMeanderLen: number = RIVER_HARD_MEANDER_LEN,
  allowReliefTraversal = false,
  relaxSeaBuffer = false,
  inlandGrowthMax?: number,
  blockRiverKeys?: Set<string>,
  minPathSep = 0,
  landCentroid: { q: number; r: number } | null = null,
  landCenterSquare: ContinentCenterSquare | null = null,
): RiverCoord[] {
  const srcKey = hexKey(sq, sr);
  const path: RiverCoord[] = [{ q: sq, r: sr }];
  const visited = new Set<string>([srcKey]);
  const centroid = landCentroid
    ?? landCenterSquare?.centroid
    ?? estimateLandCentroidFromSeed(hexes, sq, sr, allowReliefTraversal);
  const growthTarget = Math.min(
    stepCap,
    inlandGrowthMax != null
      ? Math.max(inlandTargetLen, inlandGrowthMax)
      : inlandTargetLen,
  );

  while (path.length < growthTarget && path.length < stepCap) {
    const cur = path[path.length - 1]!;
    const hardMeander = path.length < hardMeanderLen;
    const growBase: InlandDrainGrowOpts = {
      hexes, path, cur, srcKey, seaDist, openOceanDist,
      landCentroid: centroid, landCenterSquare, rand, blockRiverKeys, minPathSep,
      allowReliefTraversal, hardMeander, relaxHardMeander: false, relaxSeaBuffer,
    };

    let candidates = collectInlandDrainGrowCandidates(growBase)
      .filter((c) => !visited.has(hexKey(c.q, c.r)));

    if (candidates.length === 0) {
      candidates = collectInlandDrainGrowCandidates({ ...growBase, relaxHardMeander: true })
        .filter((c) => !visited.has(hexKey(c.q, c.r)));
    }

    if (candidates.length === 0) {
      if (hardMeander && path.length < hardMeanderLen) {
        const softCandidates = collectInlandDrainGrowCandidates({
          ...growBase, relaxHardMeander: true, relaxSeaBuffer,
        }).filter((c) => !visited.has(hexKey(c.q, c.r)));
        if (softCandidates.length === 0) break;
        softCandidates.sort((a, b) => b.score - a.score);
        const pick = softCandidates[0]!;
        path.push({ q: pick.q, r: pick.r });
        visited.add(hexKey(pick.q, pick.r));
        continue;
      }
      break;
    }
    candidates.sort((a, b) => b.score - a.score);
    const pickIdx = Math.min(candidates.length - 1, Math.floor(rand() * Math.min(3, candidates.length)));
    const pick = candidates[pickIdx] ?? candidates[0]!;
    path.push({ q: pick.q, r: pick.r });
    visited.add(hexKey(pick.q, pick.r));
  }
  return path;
}

/** Delta kierunku na siatce hex (0–5); 0=prosto, 1/5=±60°, 2/4=±120°, 3=U-turn 180°. */
function riverHexDirDelta(lastDir: number, newDir: number): number {
  return ((newDir - lastDir) % 6 + 6) % 6;
}

/** FALA 173: okno skrętu — patrz signedRiverDirDelta / isRiverWindowTurnAllowed (po neighborDirIndex). */

/** Środek masy lądu osiągalnego od punktu startowego — preferencja meandru w głąb (FALA 173). */
function estimateLandCentroidFromSeed(
  hexes: Record<string, Hex>,
  mq: number,
  mr: number,
  allowReliefTraversal: boolean,
  visitCap = 6000,
): { q: number; r: number } | null {
  const mouthKey = hexKey(mq, mr);
  let sumQ = 0;
  let sumR = 0;
  let count = 0;
  const queue: string[] = [mouthKey];
  const seen = new Set<string>([mouthKey]);
  while (queue.length > 0 && seen.size < visitCap) {
    const k = queue.shift()!;
    const { q, r } = parseHexKey(k);
    const h = hexes[k];
    if (h && isRiverLandTerrain(h.terenBazowy)) {
      sumQ += q;
      sumR += r;
      count++;
    }
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (seen.has(nk)) continue;
      if (!canRiverFlowThrough(hexes[nk], nk, mouthKey, false, undefined, allowReliefTraversal)) continue;
      seen.add(nk);
      queue.push(nk);
    }
  }
  if (count === 0) return null;
  return { q: sumQ / count, r: sumR / count };
}

function estimateLandCentroidFromMouth(
  hexes: Record<string, Hex>,
  mq: number,
  mr: number,
  allowReliefTraversal: boolean,
  visitCap = 6000,
): { q: number; r: number } | null {
  return estimateLandCentroidFromSeed(hexes, mq, mr, allowReliefTraversal, visitCap);
}

function scoreRiverStepTowardCentroid(
  q: number,
  r: number,
  nq: number,
  nr: number,
  centroid: { q: number; r: number } | null,
): number {
  if (!centroid) return 0;
  const curD = hexAxialDistance(q, r, centroid.q, centroid.r);
  const nextD = hexAxialDistance(nq, nr, centroid.q, centroid.r);
  if (nextD < curD) return 22;
  if (nextD > curD) return -12;
  return 3;
}

function scoreRiverStepTowardCenterSquare(
  q: number,
  r: number,
  nq: number,
  nr: number,
  square: ContinentCenterSquare | null,
): number {
  if (!square) return 0;
  const curD = hexDistanceToCenterSquare(q, r, square);
  const nextD = hexDistanceToCenterSquare(nq, nr, square);
  if (square.keys.has(hexKey(nq, nr))) return 40;
  if (nextD < curD) return 32;
  if (nextD > curD) return -22;
  return 4;
}

function scoreRiverStepTowardLandCenter(
  q: number,
  r: number,
  nq: number,
  nr: number,
  square: ContinentCenterSquare | null,
  centroid: { q: number; r: number } | null,
): number {
  if (square) return scoreRiverStepTowardCenterSquare(q, r, nq, nr, square);
  return scoreRiverStepTowardCentroid(q, r, nq, nr, centroid);
}

/** FALA 173 soft sep: pozycja przy sep≈3 OK — odrzuć tylko krok NA hex bliżej niż minSep. */
export function riverGrowStepPassesSep(
  nq: number,
  nr: number,
  blockRiverKeys: Set<string> | undefined,
  minPathSep: number,
  spatialIndex?: RiverHexSpatialIndex | null,
): boolean {
  if (!blockRiverKeys || blockRiverKeys.size === 0 || minPathSep <= 0) return true;
  return nearestRiverHexDistance(nq, nr, blockRiverKeys, spatialIndex) >= minPathSep;
}

type CoastInlandGrowOpts = {
  hexes: Record<string, Hex>;
  path: RiverCoord[];
  cur: RiverCoord;
  mouthKey: string;
  seaDist: Map<string, number>;
  landCentroid: { q: number; r: number } | null;
  landCenterSquare: ContinentCenterSquare | null;
  rand: () => number;
  blockRiverKeys?: Set<string>;
  sepIndex?: RiverHexSpatialIndex | null;
  minPathSep: number;
  allowReliefTraversal: boolean;
  hardMeander: boolean;
  relaxHardMeander: boolean;
};

function collectCoastInlandGrowCandidates(o: CoastInlandGrowOpts): Array<{ q: number; r: number; score: number }> {
  const curKey = hexKey(o.cur.q, o.cur.r);
  const curD = o.seaDist.get(curKey) ?? 0;
  const out: Array<{ q: number; r: number; score: number }> = [];
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nq = o.cur.q + dq;
    const nr = o.cur.r + dr;
    const nk = hexKey(nq, nr);
    if (!isRiverWindowTurnAllowed(o.path, nq, nr)) continue;
    if (!canRiverFlowThrough(o.hexes[nk], nk, o.mouthKey, true, undefined, o.allowReliefTraversal)) continue;
    if (!riverGrowStepPassesSep(nq, nr, o.blockRiverKeys, o.minPathSep, o.sepIndex)) continue;
    const nd = o.seaDist.get(nk) ?? 0;
    if (o.path.length >= 1 && nd < RIVER_MIN_INLAND_FROM_SEA) continue;
    if (o.hardMeander && !o.relaxHardMeander && nd < curD) continue;
    const centerStep = scoreRiverStepTowardLandCenter(
      o.cur.q, o.cur.r, nq, nr, o.landCenterSquare, o.landCentroid,
    );
    let score = nd * 28;
    if (nd > curD) score += 18;
    else if (nd === curD) {
      score += centerStep > 8 ? 22 : centerStep < 0 ? -36 : 2;
    }
    // FALA 188: silniejszy bias ku centrum 5×5 — unikaj rzek równoległych do boków.
    score += centerStep * 6.5;
    if (centerStep < 0) score -= 18;
    score += o.rand() * 0.35;
    out.push({ q: nq, r: nr, score });
  }
  return out;
}

type InlandDrainGrowOpts = {
  hexes: Record<string, Hex>;
  path: RiverCoord[];
  cur: RiverCoord;
  srcKey: string;
  seaDist: Map<string, number>;
  openOceanDist: Map<string, number>;
  landCentroid: { q: number; r: number } | null;
  landCenterSquare: ContinentCenterSquare | null;
  rand: () => number;
  blockRiverKeys?: Set<string>;
  sepIndex?: RiverHexSpatialIndex | null;
  minPathSep: number;
  allowReliefTraversal: boolean;
  hardMeander: boolean;
  relaxHardMeander: boolean;
  relaxSeaBuffer: boolean;
};

function collectInlandDrainGrowCandidates(o: InlandDrainGrowOpts): Array<{ q: number; r: number; score: number }> {
  const curKey = hexKey(o.cur.q, o.cur.r);
  const curD = o.seaDist.get(curKey) ?? 0;
  const curOd = o.openOceanDist.get(curKey) ?? Infinity;
  const out: Array<{ q: number; r: number; score: number }> = [];
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nq = o.cur.q + dq;
    const nr = o.cur.r + dr;
    const nk = hexKey(nq, nr);
    if (!isRiverWindowTurnAllowed(o.path, nq, nr)) continue;
    if (!canRiverFlowThrough(o.hexes[nk], nk, o.srcKey, true, undefined, o.allowReliefTraversal)) continue;
    if (!riverGrowStepPassesSep(nq, nr, o.blockRiverKeys, o.minPathSep, o.sepIndex)) continue;
    const nd = o.seaDist.get(nk) ?? 0;
    if (!o.relaxSeaBuffer && nd < RIVER_MIN_INLAND_FROM_SEA) continue;
    const od = o.openOceanDist.get(nk) ?? Infinity;
    if (o.hardMeander && !o.relaxHardMeander && od < curOd) continue;
    let score = 1200 - od * 30;
    if (od > curOd + 0.5) score -= 18;
    if (nd > curD + 1) score -= 10;
    if (nd === RIVER_MIN_INLAND_FROM_SEA && od < curOd) score += 8;
    score += scoreRiverStepTowardLandCenter(
      o.cur.q, o.cur.r, nq, nr, o.landCenterSquare, o.landCentroid,
    );
    score += o.rand() * 0.35;
    out.push({ q: nq, r: nr, score });
  }
  return out;
}

/**
 * Od ujścia (brzeg) w głąb lądu — odwrotność growRiverInlandBeforeDrainage (Maciej 2026-08-01).
 * FALA 173: okno 6 hex, centroid masy, soft sep (stop tylko bez legalnego kroku).
 */
function growRiverFromCoastInland(
  hexes: Record<string, Hex>,
  mq: number,
  mr: number,
  seaDist: Map<string, number>,
  openOceanDist: Map<string, number>,
  rand: () => number,
  stepCap: number,
  hardMeanderLen: number = RIVER_HARD_MEANDER_LEN,
  allowReliefTraversal = false,
  blockRiverKeys?: Set<string>,
  minPathSep = MAIN_RIVER_MIN_PATH_SEP,
  landCentroid: { q: number; r: number } | null = null,
  landCenterSquare: ContinentCenterSquare | null = null,
  sepIndex?: RiverHexSpatialIndex | null,
): RiverCoord[] {
  const mouthKey = hexKey(mq, mr);
  const path: RiverCoord[] = [{ q: mq, r: mr }];
  const visited = new Set<string>([mouthKey]);
  const centroid = landCentroid
    ?? landCenterSquare?.centroid
    ?? estimateLandCentroidFromMouth(hexes, mq, mr, allowReliefTraversal);

  while (path.length < stepCap) {
    const cur = path[path.length - 1]!;
    const hardMeander = path.length < hardMeanderLen;
    const growBase: CoastInlandGrowOpts = {
      hexes, path, cur, mouthKey, seaDist, landCentroid: centroid, landCenterSquare, rand,
      blockRiverKeys, sepIndex, minPathSep, allowReliefTraversal, hardMeander,
      relaxHardMeander: false,
    };

    let candidates = collectCoastInlandGrowCandidates(growBase)
      .filter((c) => !visited.has(hexKey(c.q, c.r)));
    if (candidates.length === 0) {
      candidates = collectCoastInlandGrowCandidates({ ...growBase, relaxHardMeander: true })
        .filter((c) => !visited.has(hexKey(c.q, c.r)));
    }
    if (candidates.length === 0) break;

    candidates.sort((a, b) => b.score - a.score);
    const pickIdx = Math.min(candidates.length - 1, Math.floor(rand() * Math.min(3, candidates.length)));
    const pick = candidates[pickIdx] ?? candidates[0]!;
    path.push({ q: pick.q, r: pick.r });
    visited.add(hexKey(pick.q, pick.r));
  }
  return path;
}

/**
 * Rzeka od ujścia przy brzegu w głąb lądu; zwraca path[0]=źródło inland, path[last]=ujście (Maciej 2026-08-01).
 */
function traceRiverFromCoast(
  hexes: Record<string, Hex>,
  mq: number,
  mr: number,
  maxLen: number,
  traceOpts: TraceRiverOpts = {},
): RiverCoord[] {
  const seaDist = traceOpts.seaDist ?? buildSeaDistanceField(hexes);
  const dims = traceOpts.mapWidth != null && traceOpts.mapHeight != null
    ? { width: traceOpts.mapWidth, height: traceOpts.mapHeight }
    : inferMapDimsFromHexes(hexes);
  const openOceanDist = traceOpts.openOceanDist
    ?? buildOpenOceanDistanceField(hexes, dims.width, dims.height, traceOpts.oceanConnected);
  const oceanConnected = traceOpts.oceanConnected
    ?? oceanConnectedWaterKeys(hexes, dims.width, dims.height);
  const rand = traceOpts.rand ?? (() => 0);
  const mouthKey = hexKey(mq, mr);
  const startD = seaDist.get(mouthKey);
  if (startD == null || startD > 2) return [];

  const hardMeanderLen = traceOpts.hardMeanderLen ?? RIVER_HARD_MEANDER_LEN;
  const allowReliefTraversal = traceOpts.allowReliefTraversal ?? false;
  // minLen = próg akceptacji u wołającego; wzrost do maxLen (bufor A*) lub braku lądu / sep 3.
  const growthCap = maxLen;
  const blockRiverKeys = traceOpts.blockRiverKeys;
  const minPathSep = traceOpts.minPathSep ?? MAIN_RIVER_MIN_PATH_SEP;

  const mouthToInland = growRiverFromCoastInland(
    hexes, mq, mr, seaDist, openOceanDist, rand,
    growthCap, hardMeanderLen, allowReliefTraversal,
    blockRiverKeys, minPathSep,
    traceOpts.landCentroid ?? null,
    traceOpts.landCenterSquare ?? null,
    traceOpts.riverSepIndex,
  );
  if (mouthToInland.length < 2) return [];

  const reversed = [...mouthToInland].reverse();
  if (!pathEndsAtSea(hexes, reversed, dims.width, dims.height, oceanConnected)) return [];
  return reversed;
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
  allowReliefTraversal = false,
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
      if (!isRiverWindowTurnAllowed(path, nq, nr)) continue;
      // blockExisting: nie wchodź na heks innej, już ułożonej rzeki (konfluencje, nie krzyżowania).
      if (!canRiverFlowThrough(hexes[nk], nk, sourceKey, true, undefined, allowReliefTraversal)) continue;
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

/** Min-heap [fScore, seq, key] — ten sam tie-break co liniowy skan Set. */
class RiverAStarOpenHeap {
  private data: Array<[number, number, string]> = [];

  push(f: number, seq: number, key: string): void {
    const d = this.data;
    d.push([f, seq, key]);
    let i = d.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.less(d[i]!, d[p]!)) {
        [d[i], d[p]] = [d[p]!, d[i]!];
        i = p;
      } else break;
    }
  }

  pop(): [number, number, string] | undefined {
    const d = this.data;
    if (d.length === 0) return undefined;
    const top = d[0]!;
    const last = d.pop()!;
    if (d.length > 0) {
      d[0] = last;
      let i = 0;
      for (;;) {
        let best = i;
        const l = 2 * i + 1;
        const r = l + 1;
        if (l < d.length && this.less(d[l]!, d[best]!)) best = l;
        if (r < d.length && this.less(d[r]!, d[best]!)) best = r;
        if (best === i) break;
        [d[i], d[best]] = [d[best]!, d[i]!];
        i = best;
      }
    }
    return top;
  }

  get size(): number { return this.data.length; }

  private less(a: [number, number, string], b: [number, number, string]): boolean {
    return a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
  }
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
  allowReliefTraversal = false,
): RiverCoord[] {
  const _rpT0 = RIVER_PROFILE_ON ? rpNow() : 0;
  if (RIVER_PROFILE_ON) rpEnsure().aStarCalls++;
  const _rpDone = (result: RiverCoord[]): RiverCoord[] => {
    if (RIVER_PROFILE_ON) rpEnsure().aStarMs += rpNow() - _rpT0;
    return result;
  };
  const startK = hexKey(sq, sr);
  const h0 = openOceanDist.get(startK) ?? seaDist.get(startK);
  if (h0 == null) return _rpDone([]);
  if (oceanConnected.has(startK)) return _rpDone([{ q: sq, r: sr }]);

  const gScore = new Map<string, number>([[startK, 0]]);
  const cameFrom = new Map<string, string>();
  const stepDir = new Map<string, [number, number]>();
  const open = new Set<string>([startK]);
  const fScore = new Map<string, number>([[startK, h0]]);
  const openHeap = new RiverAStarOpenHeap();
  let heapSeq = 0;
  openHeap.push(h0, heapSeq++, startK);

  let bestK = startK;
  let bestH = h0;

  while (open.size > 0) {
    let current = '';
    while (openHeap.size > 0) {
      const entry = openHeap.pop()!;
      const k = entry[2];
      if (!open.has(k)) continue;
      const f = fScore.get(k) ?? Infinity;
      if (f !== entry[0]) continue;
      current = k;
      break;
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
      return _rpDone(reconstructRiverPath(cameFrom, current));
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
      if (!canRiverFlowThrough(hexes[nk], nk, startK, true, undefined, allowReliefTraversal)) continue;
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
      const nf = tg + (openOceanDist.get(nk) ?? Infinity);
      fScore.set(nk, nf);
      open.add(nk);
      openHeap.push(nf, heapSeq++, nk);
    }
  }

  if (bestK !== startK) {
    const { q, r } = parseHexKey(bestK);
    if (isRiverDrainageGoal(q, r, seaDist, hexes, startK, oceanConnected)) {
      return _rpDone(reconstructRiverPath(cameFrom, bestK));
    }
  }
  return _rpDone([{ q: sq, r: sr }]);
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
    if (isWaterTerrainLocal(endHex.terenBazowy)) break;

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
      if (nh.terenBazowy === TerenBazowy.PlytkieMorze) score -= 8;
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
      if (nh.terenBazowy !== TerenBazowy.PlytkieMorze
        && !canRiverDrainStep(nk, nd, openOceanDist, oceanConnected, true)) continue;
      if (!canRiverFlowThrough(nh, nk, sourceKey) && nh.terenBazowy !== TerenBazowy.PlytkieMorze) continue;
      let score = openOceanDist.get(nk) ?? nd;
      // Preferuj Wybrzeże (pierwszy kontakt z wodą kończy trasę w następnej iteracji —
      // patrz mouthReady) — bez dodatkowego tunelowania do heksu stykającego realne Morze.
      if (nh.terenBazowy === TerenBazowy.PlytkieMorze) score -= 15;
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
  const _rpT0 = RIVER_PROFILE_ON ? rpNow() : 0;
  if (RIVER_PROFILE_ON) rpEnsure().traceRiverCalls++;
  const _rpDone = (result: Array<{ q: number; r: number }>) => {
    if (RIVER_PROFILE_ON) rpEnsure().traceRiverMs += rpNow() - _rpT0;
    return result;
  };
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
  if (startDist == null || !Number.isFinite(startDist)) return _rpDone([]);

  const inlandTarget = traceOpts.minLen ?? 4;
  const mouthTailLen = traceOpts.mouthTailLen ?? RIVER_MOUTH_TAIL_LEN;
  const hardMeanderLen = traceOpts.hardMeanderLen ?? RIVER_HARD_MEANDER_LEN;
  const allowReliefTraversal = traceOpts.allowReliefTraversal ?? false;
  const relaxSeaBuffer = traceOpts.relaxSeaBuffer ?? false;
  const stepCap = Math.max(
    inlandTarget + mouthTailLen + 12,
    Math.min(maxLen, Math.ceil(startDist * 2.5) + inlandTarget + 10),
  );

  const inlandGrowthMax = Math.min(
    stepCap - mouthTailLen - 4,
    maxLen,
  );

  let path = growRiverInlandBeforeDrainage(
    hexes, sq, sr, seaDist, openOceanDist, rand, inlandTarget, stepCap, hardMeanderLen,
    allowReliefTraversal, relaxSeaBuffer,
    inlandGrowthMax,
    traceOpts.blockRiverKeys,
    traceOpts.minPathSep ?? 0,
    traceOpts.landCentroid ?? null,
    traceOpts.landCenterSquare ?? null,
  );

  const tailFrom = path[path.length - 1]!;
  const drainBudget = Math.max(mouthTailLen + 4, stepCap - path.length + 1);
  let drainPath = aStarRiverToSea(
    hexes,
    tailFrom.q,
    tailFrom.r,
    seaDist,
    openOceanDist,
    oceanConnected,
    drainBudget,
    rand,
    allowReliefTraversal,
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
      allowReliefTraversal,
    );
  }
  if (drainPath.length > 1) {
    path = [...path, ...drainPath.slice(1)];
  } else if (path.length <= 1) {
    path = aStarRiverToSea(
      hexes, sq, sr, seaDist, openOceanDist, oceanConnected, stepCap, rand, allowReliefTraversal,
    );
    if (path.length <= 1) {
      path = greedyRiverDrainToSea(
        hexes, sq, sr, seaDist, openOceanDist, oceanConnected, stepCap, rand, srcKey,
        allowReliefTraversal,
      );
    }
  }

  if (path.length > stepCap) path = path.slice(0, stepCap);
  path = extendRiverToWybrzeze(hexes, path, seaDist);
  path = finishRiverMouthAtSea(hexes, path, seaDist, openOceanDist, oceanConnected, srcKey);
  path = repairRiverPathAdjacency(path, hexes, srcKey);
  path = sanitizeRiverTurnWindow(path, hexes, srcKey);

  if (!relaxSeaBuffer) {
    if (!riverPathRespectsSeaBuffer(hexes, path, seaDist)
      || !pathEndsAtSea(hexes, path, dims.width, dims.height, oceanConnected)) {
      return _rpDone([]);
    }
  } else if (!pathEndsAtSea(hexes, path, dims.width, dims.height, oceanConnected)) {
    return _rpDone([]);
  }

  return _rpDone(path);
}

/** Trasowanie siatki: cel = tier minLen (długa rzeka), akceptacja od acceptLen w górę. */
function traceRiverForGridFill(
  hexes: Record<string, Hex>,
  sq: number,
  sr: number,
  maxLen: number,
  catalogMinLen: number,
  acceptLen: number,
  traceOpts: TraceRiverOpts,
  relaxSeaBuffer = false,
  fastMode = false,
): RiverCoord[] {
  const tries = fastMode
    ? [acceptLen, Math.max(3, Math.floor(acceptLen * 0.75))]
    : [catalogMinLen, Math.max(acceptLen, Math.floor(catalogMinLen * 0.6)), acceptLen, 3];
  const seen = new Set<string>();
  for (const tryMin of tries) {
    if (seen.has(String(tryMin))) continue;
    seen.add(String(tryMin));
    const path = traceRiver(hexes, sq, sr, maxLen, { ...traceOpts, minLen: tryMin });
    if (path.length < acceptLen) continue;
    if (!relaxSeaBuffer) return path;
    const seaDist = traceOpts.seaDist ?? buildSeaDistanceField(hexes);
    const dims = traceOpts.mapWidth != null && traceOpts.mapHeight != null
      ? { width: traceOpts.mapWidth, height: traceOpts.mapHeight }
      : inferMapDimsFromHexes(hexes);
    const ocean = traceOpts.oceanConnected
      ?? oceanConnectedWaterKeys(hexes, dims.width, dims.height);
    if (pathEndsAtSea(hexes, path, dims.width, dims.height, ocean)) return path;
  }
  return [];
}

/** Ląd nadający się na źródło / bieg rzeki (bez morza i wybrzeża). */
function isRiverLandTerrain(t: TerenBazowy): boolean {
  return (
    t === TerenBazowy.Laka ||
    t === TerenBazowy.Rownina ||
    t === TerenBazowy.Wzgorza ||
    t === TerenBazowy.Gory ||
    t === TerenBazowy.Pustynia ||
    t === TerenBazowy.Polarny
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

/** FALA 173: okno 6 hex — |Σ signed dirDelta| ≤ 1 (netto ≤60°), bez spirali. */
export const RIVER_TURN_WINDOW_HEX = 6;
export const RIVER_TURN_WINDOW_MAX_SUM = 1;

/** Signed turn at vertex: -3..+3 (hex dirs); ±1 = ±60°. */
function signedRiverDirDelta(lastDir: number, newDir: number): number {
  const raw = riverHexDirDelta(lastDir, newDir);
  return raw <= 3 ? raw : raw - 6;
}

function pathSegmentDirs(path: RiverCoord[]): number[] {
  const dirs: number[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const d = neighborDirIndex(path[i]!.q, path[i]!.r, path[i + 1]!.q, path[i + 1]!.r);
    if (d >= 0) dirs.push(d);
  }
  return dirs;
}

function pathSignedTurnDeltas(segmentDirs: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < segmentDirs.length; i++) {
    out.push(signedRiverDirDelta(segmentDirs[i - 1]!, segmentDirs[i]!));
  }
  return out;
}

/** Czy krok nq,nr łamie okno skrętu (per-step max ±60°, okno 6: |Σ|≤1). */
function isRiverWindowTurnAllowed(
  path: RiverCoord[],
  nq: number,
  nr: number,
  windowHex = RIVER_TURN_WINDOW_HEX,
  maxSum = RIVER_TURN_WINDOW_MAX_SUM,
): boolean {
  const cur = path[path.length - 1]!;
  const stepDir = neighborDirIndex(cur.q, cur.r, nq, nr);
  if (stepDir < 0) return false;

  const dirs = pathSegmentDirs(path);
  if (dirs.length === 0) return true;

  const stepSigned = signedRiverDirDelta(dirs[dirs.length - 1]!, stepDir);
  if (Math.abs(stepSigned) > 1) return false;

  dirs.push(stepDir);
  const deltas = pathSignedTurnDeltas(dirs);
  const window = deltas.slice(-windowHex);
  const sum = window.reduce((a, b) => a + b, 0);
  return Math.abs(sum) <= maxSum;
}

/** World-space unit vector segment a→b (pointy-top axial). */
export function riverSegmentUnitVector(a: RiverCoord, b: RiverCoord): { x: number; y: number } {
  const x1 = Math.sqrt(3) * (a.q + a.r / 2);
  const y1 = 1.5 * a.r;
  const x2 = Math.sqrt(3) * (b.q + b.r / 2);
  const y2 = 1.5 * b.r;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) return { x: 0, y: 0 };
  return { x: dx / len, y: dy / len };
}

/** Czy trójka kolejnych segmentów ma zawrót 180° (dot < 0). */
export function riverPathHasSharpUTurn(path: RiverCoord[]): boolean {
  if (path.length < 3) return false;
  for (let i = 0; i < path.length - 2; i++) {
    const v1 = riverSegmentUnitVector(path[i]!, path[i + 1]!);
    const v2 = riverSegmentUnitVector(path[i + 1]!, path[i + 2]!);
    if (v1.x * v2.x + v1.y * v2.y < -0.01) return true;
  }
  return false;
}

/** Bramka regresji: okno skrętu + zakaz 120°/180° per-step. */
export function riverPathViolatesTurnWindow(
  path: RiverCoord[],
  windowHex = RIVER_TURN_WINDOW_HEX,
  maxSum = RIVER_TURN_WINDOW_MAX_SUM,
): boolean {
  if (path.length < 3) return false;
  if (riverPathHasSharpUTurn(path)) return true;
  const deltas = pathSignedTurnDeltas(pathSegmentDirs(path));
  for (let i = 0; i < deltas.length; i++) {
    if (Math.abs(deltas[i]!) > 1) return true;
    if (i + 1 < windowHex) continue;
    const window = deltas.slice(i + 1 - windowHex, i + 1);
    const sum = window.reduce((a, b) => a + b, 0);
    if (Math.abs(sum) > maxSum) return true;
  }
  return false;
}

/** Usuwa wierzchołki łamiące okno skrętu (deterministycznie, bez rand). */
function sanitizeRiverTurnWindow(
  path: RiverCoord[],
  hexes: Record<string, Hex>,
  sourceKey: string,
): RiverCoord[] {
  let out = sanitizeRiverPath(path);
  for (let guard = 0; guard < 48 && out.length >= 3; guard++) {
    if (!riverPathViolatesTurnWindow(out)) return out;
    const deltas = pathSignedTurnDeltas(pathSegmentDirs(out));
    let cutAt = -1;
    for (let i = 0; i < deltas.length; i++) {
      if (Math.abs(deltas[i]!) > 1) { cutAt = i + 1; break; }
      if (i + 1 >= RIVER_TURN_WINDOW_HEX) {
        const w = deltas.slice(i + 1 - RIVER_TURN_WINDOW_HEX, i + 1);
        if (Math.abs(w.reduce((a, b) => a + b, 0)) > RIVER_TURN_WINDOW_MAX_SUM) {
          cutAt = i + 1;
          break;
        }
      }
    }
    if (cutAt <= 0 || cutAt >= out.length - 1) break;
    out = sanitizeRiverPath([...out.slice(0, cutAt), ...out.slice(cutAt + 1)]);
    out = repairRiverPathAdjacency(out, hexes, sourceKey);
  }
  return out;
}

/** Czy heks może dostać oznaczenie rzeki (bonus plonów / rzeka.obecna). */
function canReceiveRiverYieldMark(hex: Hex | undefined): boolean {
  if (!hex || hex.terenBazowy === TerenBazowy.Morze) return false;
  return isDryLandTerrain(hex.terenBazowy) || hex.terenBazowy === TerenBazowy.PlytkieMorze;
}

function markRiverEdge(hexes: Record<string, Hex>, q: number, r: number, edgeIdx: number): void {
  if (edgeIdx < 0) return;
  const hex = hexes[hexKey(q, r)];
  if (!canReceiveRiverYieldMark(hex)) return;
  const edges = hex!.rzeka?.krawedzie ?? [];
  if (!edges.includes(edgeIdx)) edges.push(edgeIdx);
  hex!.rzeka = { obecna: edges.length > 0, krawedzie: edges };
}

/** Oznacz krawędź rzeki na obu heksach lądowych dzielących tę krawędź (bonus plonów I1). */
function markRiverEdgePair(hexes: Record<string, Hex>, q: number, r: number, edgeIdx: number): void {
  if (edgeIdx < 0) return;
  markRiverEdge(hexes, q, r, edgeIdx);
  const dir = HEX_DIRECTIONS[edgeIdx];
  if (!dir) return;
  markRiverEdge(hexes, q + dir[0], r + dir[1], (edgeIdx + 3) % 6);
}

/** Następny róg obwodu heksa (pointy-top; zgodnie z render/scene.ts). */
function riverHexCornerStep(from: number, cw: boolean): number {
  return cw ? (from + 1) % 6 : (from + 5) % 6;
}

function walkRiverHexPerimeter(fromCorner: number, toCorner: number, cw: boolean): number[] {
  if (fromCorner === toCorner) return [fromCorner];
  const out: number[] = [];
  let c = fromCorner;
  for (let guard = 0; guard < 7; guard++) {
    out.push(c);
    if (c === toCorner) break;
    c = riverHexCornerStep(c, cw);
  }
  return out;
}

/**
 * Rogi obwodu między krawędzią wejścia (dirIn) a wyjścia (dirOut) — ten sam łuk co render
 * (scene.ts riverCornersAlongHexEdges). Używane do oznaczenia krawędzi tranzytowych rzeki.
 */
function riverCornersAlongHexEdges(dirIn: number, dirOut: number, hexParity: number): number[] {
  const a = ((dirIn % 6) + 6) % 6;
  const b = ((dirOut % 6) + 6) % 6;
  if (a === b) return [];
  const entryOpts = [(a + 1) % 6, (a + 2) % 6];
  const exitOpts = [(b + 1) % 6, (b + 2) % 6];
  const MIN_BOKI = 1;
  let best: number[] = [];
  let bestScore = Infinity;
  let fallback: number[] = [];
  let fallbackScore = Infinity;
  for (const entry of entryOpts) {
    for (const exit of exitOpts) {
      for (const cw of [true, false]) {
        const walked = walkRiverHexPerimeter(entry, exit, cw);
        if (walked.length === 0) continue;
        let score = walked.length;
        if (score === bestScore && hexParity % 2 === 0) score += cw ? 0 : 0.01;
        else if (score === bestScore) score += cw ? 0.01 : 0;
        if (score < fallbackScore) { fallbackScore = score; fallback = walked; }
        if (walked.length - 1 < MIN_BOKI) continue;
        if (score < bestScore) { bestScore = score; best = walked; }
      }
    }
  }
  return best.length ? best : fallback;
}

/** Krawędź pointy-top między dwoma sąsiednimi rogami obwodu (edge dir = rogi dir+1, dir+2). */
function riverEdgeBetweenCorners(c1: number, c2: number): number {
  if (c2 === (c1 + 1) % 6) return (c1 + 5) % 6;
  if (c2 === (c1 + 5) % 6) return (c2 + 5) % 6;
  return -1;
}

/** Indeksy krawędzi (0–5) wzdłuż łuku rzeki na heksie — zgodnie z geometrią renderu. */
function riverTransitEdgeIndices(dirIn: number, dirOut: number, hexParity: number): number[] {
  const corners = riverCornersAlongHexEdges(dirIn, dirOut, hexParity);
  if (corners.length < 2) return [];
  const edges: number[] = [];
  for (let i = 0; i < corners.length - 1; i++) {
    const ei = riverEdgeBetweenCorners(corners[i]!, corners[i + 1]!);
    if (ei >= 0 && !edges.includes(ei)) edges.push(ei);
  }
  return edges;
}

/** Regularyzacja ścieżki rzeki pod oznaczanie krawędzi (ten sam algorytm co render/scene.ts). */
function simplifyRiverRenderPath(path: RiverCoord[]): RiverCoord[] {
  const p = path.map((h) => ({ q: h.q, r: h.r }));
  if (p.length < 3) return p;
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 4000) {
    changed = false;
    for (let i = 1; i < p.length - 1; i++) {
      const a = p[i - 1]!;
      const c = p[i + 1]!;
      if (a.q === c.q && a.r === c.r) { p.splice(i, 2); changed = true; break; }
      if (neighborDirIndex(a.q, a.r, c.q, c.r) >= 0) { p.splice(i, 1); changed = true; break; }
    }
  }
  return p;
}

/** Oznacza krawędzie tranzytowe (obwód heksa) — brzeg rzeki widoczny z obu stron koryta. */
function markRiverTransitEdgesOnPath(hexes: Record<string, Hex>, path: Array<{ q: number; r: number }>): void {
  const rp = simplifyRiverRenderPath(path);
  if (rp.length < 2) return;
  for (let i = 0; i < rp.length; i++) {
    const cur = rp[i]!;
    const dirIn = i > 0
      ? neighborDirIndex(cur.q, cur.r, rp[i - 1]!.q, rp[i - 1]!.r)
      : -1;
    const dirOut = i < rp.length - 1
      ? neighborDirIndex(cur.q, cur.r, rp[i + 1]!.q, rp[i + 1]!.r)
      : -1;
    if (dirIn < 0 || dirOut < 0) continue;
    for (const ei of riverTransitEdgeIndices(dirIn, dirOut, cur.q + cur.r)) {
      markRiverEdgePair(hexes, cur.q, cur.r, ei);
    }
  }
}

/**
 * Finalny sync bonusu rzeki (Maciej: każdy heks stykający się z rzeką jednym bokiem → obecna).
 * Dla każdej oznakowanej krawędzi woła markRiverEdgePair; powtarza do stabilizacji (max 2 przebiegi).
 */
export function syncRiverEdgeBonusHexes(hexes: Record<string, Hex>, maxPasses = 2): void {
  for (let pass = 0; pass < maxPasses; pass++) {
    const work: Array<{ q: number; r: number; ei: number }> = [];
    for (const [k, h] of Object.entries(hexes)) {
      if (!h.rzeka?.krawedzie?.length) continue;
      const { q, r } = parseHexKey(k);
      for (const ei of h.rzeka.krawedzie) work.push({ q, r, ei });
    }
    if (work.length === 0) return;
    for (const { q, r, ei } of work) markRiverEdgePair(hexes, q, r, ei);
  }
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
        ha.terenBazowy === TerenBazowy.PlytkieMorze || hb.terenBazowy === TerenBazowy.PlytkieMorze;
      if (!coastal) continue;
    }
    const eA = neighborDirIndex(a.q, a.r, b.q, b.r);
    markRiverEdgePair(hexes, a.q, a.r, eA);
  }
  markRiverTransitEdgesOnPath(hexes, path);
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
      ha.terenBazowy === TerenBazowy.PlytkieMorze || hb.terenBazowy === TerenBazowy.PlytkieMorze;
    if (!coastal) return [];
  }
  const out: Array<{ key: string; edge: number }> = [];
  const eA = neighborDirIndex(a.q, a.r, b.q, b.r);
  const eB = neighborDirIndex(b.q, b.r, a.q, a.r);
  // eligible — odwzoruj canReceiveRiverYieldMark (nie Morze; suchy ląd lub Wybrzeże).
  const eligible = (h: Hex): boolean => canReceiveRiverYieldMark(h);
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

/** Finalizacja głównego nurtu: sanitize pętli, trim pierścieni krawędzi, weryfikacja ujścia. */
function finalizeMainRiverPath(
  hexes: Record<string, Hex>,
  path: RiverCoord[],
  width: number,
  height: number,
  oceanConnected: Set<string>,
): RiverCoord[] | null {
  if (path.length < 2) return null;
  const cleaned = sanitizeRiverPath(path);
  if (cleaned.length < RIVER_MIN_MAIN_LEN) return null;
  const turnSafe = riverPathViolatesTurnWindow(cleaned)
    ? sanitizeRiverTurnWindow(cleaned, hexes, hexKey(path[0]!.q, path[0]!.r))
    : cleaned;
  if (turnSafe.length < RIVER_MIN_MAIN_LEN) return null;
  const trimmed = trimRiverPathRings(hexes, turnSafe);
  if (trimmed.length < RIVER_MIN_MAIN_LEN) return null;
  if (!pathEndsAtSea(hexes, trimmed, width, height, oceanConnected)) return null;
  return trimmed;
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
/** Czy dopływ (przed markiem) łączy się z siecią spływającą do morza lub ma własne ujście. */
function tributaryTouchesOceanReachable(
  path: RiverCoord[],
  reached: Set<string>,
): boolean {
  for (const p of path) {
    if (reached.has(hexKey(p.q, p.r))) return true;
  }
  const end = path[path.length - 1];
  if (!end) return false;
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nk = hexKey(end.q + dq, end.r + dr);
    if (reached.has(nk)) return true;
  }
  return false;
}

/**
 * Przycina pierścienie (Z3), domyka junction (I2) i odrzuca dopływ bez ujścia do sieci lub morza.
 * Zwraca gotową ścieżkę lub null (nie oznakowuj, nie dopisuj do riverPaths).
 */
function finalizeTributaryPath(
  hexes: Record<string, Hex>,
  path: RiverCoord[],
  riverPaths: RiverCoord[][],
  riverKinds: RiverPathKind[],
  width: number,
  height: number,
  oceanConnected: Set<string>,
): RiverCoord[] | null {
  let out = trimRiverPathRings(hexes, path);
  if (out.length < 3) return null;
  if (out.length >= 2) {
    const junction = out[out.length - 1]!;
    const approach = out[out.length - 2]!;
    const down = networkDownstreamNeighbor(hexes, junction, approach, riverPaths);
    out = appendJunctionDownstreamHex(out, down);
  }
  if (pathEndsAtSea(hexes, out, width, height, oceanConnected)) return out;
  const reached = buildOceanReachableRiverHexKeys(
    hexes, riverPaths, riverKinds, width, height, oceanConnected,
  );
  if (!tributaryTouchesOceanReachable(out, reached)) return null;
  return out;
}

/** Czy ścieżka dotyka heksa głównego nurtu (włącznie z sąsiedztwem końca). */
function pathTouchesMainNetwork(path: RiverCoord[], mainKeys: Set<string>): boolean {
  if (mainKeys.size === 0) return false;
  for (const p of path) {
    if (mainKeys.has(hexKey(p.q, p.r))) return true;
  }
  const end = path[path.length - 1];
  if (!end) return false;
  for (const [dq, dr] of HEX_DIRECTIONS) {
    if (mainKeys.has(hexKey(end.q + dq, end.r + dr))) return true;
  }
  return false;
}

/**
 * Usuwa ogon średniej biegnący wzdłuż głównego nurtu po junction (FALA 175).
 * Koniec zostaje na pierwszym heksie styku z main — bez przejścia na drugą stronę.
 */
function trimMediumTailAlongMain(path: RiverCoord[], mainKeys: Set<string>): RiverCoord[] {
  if (path.length < 3 || mainKeys.size === 0) return path;
  const out = [...path];
  while (out.length >= 3) {
    const last = out[out.length - 1]!;
    const prev = out[out.length - 2]!;
    if (mainKeys.has(hexKey(last.q, last.r)) && mainKeys.has(hexKey(prev.q, prev.r))) {
      out.pop();
    } else break;
  }
  return out;
}

/**
 * FALA 187: czy heks jest celem joinu dopływu (na sieci lub bezpośrednio przy niej).
 */
function isMediumJoinTargetHex(
  q: number,
  r: number,
  mainKeys: Set<string>,
  networkKeys: Set<string>,
): boolean {
  const k = hexKey(q, r);
  if (mainKeys.has(k) || networkKeys.has(k)) return true;
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nk = hexKey(q + dq, r + dr);
    if (mainKeys.has(nk) || networkKeys.has(nk)) return true;
  }
  return false;
}

/** a→b→c owija jeden heks: skręt 120° (±2) i a sąsiaduje z c (zbędny wierzchołek b). */
function isHexWrapTriplet(a: RiverCoord, b: RiverCoord, c: RiverCoord): boolean {
  const dAB = neighborDirIndex(a.q, a.r, b.q, b.r);
  const dBC = neighborDirIndex(b.q, b.r, c.q, c.r);
  if (dAB < 0 || dBC < 0) return false;
  // Na siatce heksów dwa kolejne boki tego samego heksu = Δdir ±2 (120°), chord a–c = 1.
  if (Math.abs(signedRiverDirDelta(dAB, dBC)) !== 2) return false;
  return hexAxialDistance(a.q, a.r, c.q, c.r) === 1;
}

/**
 * Zawijanie przy ujściu (ogon): a→b→c tuż przed joinem do main/sieci.
 */
export function riverPathHasJoinHexWrap(
  path: RiverCoord[],
  mainKeys: Set<string>,
  networkKeys: Set<string>,
): boolean {
  if (path.length < 3) return false;
  const a = path[path.length - 3]!;
  const b = path[path.length - 2]!;
  const c = path[path.length - 1]!;
  if (mainKeys.has(hexKey(b.q, b.r))) return false;
  if (!isMediumJoinTargetHex(c.q, c.r, mainKeys, networkKeys)) return false;
  return isHexWrapTriplet(a, b, c);
}

/**
 * Zawijanie przy odgałęzieniu od main: start na main, a→b→c owija heks zamiast a→c.
 */
export function riverPathHasBranchHexWrap(
  path: RiverCoord[],
  mainKeys: Set<string>,
): boolean {
  if (path.length < 3) return false;
  const a = path[0]!;
  const b = path[1]!;
  const c = path[2]!;
  if (!mainKeys.has(hexKey(a.q, a.r))) return false;
  if (mainKeys.has(hexKey(b.q, b.r))) return false;
  return isHexWrapTriplet(a, b, c);
}

/**
 * Usuwa 1-hex oxbow przy ujściu dopływu do main/sieci — preferuje najkrótsze połączenie.
 */
export function trimMediumJoinHexWrap(
  path: RiverCoord[],
  mainKeys: Set<string>,
  networkKeys: Set<string>,
): RiverCoord[] {
  let out = [...path];
  for (let guard = 0; guard < 8 && out.length >= 3; guard++) {
    const a = out[out.length - 3]!;
    const b = out[out.length - 2]!;
    const c = out[out.length - 1]!;
    if (mainKeys.has(hexKey(b.q, b.r))) break;
    if (!isMediumJoinTargetHex(c.q, c.r, mainKeys, networkKeys)) break;
    if (!isHexWrapTriplet(a, b, c)) break;
    out.splice(out.length - 2, 1);
  }
  return out;
}

/**
 * Usuwa 1-hex oxbow tuż po zejściu z main — najbliższe połączenie a→c zamiast a→b→c.
 */
export function trimMediumBranchHexWrap(
  path: RiverCoord[],
  mainKeys: Set<string>,
): RiverCoord[] {
  let out = [...path];
  for (let guard = 0; guard < 8 && out.length >= 3; guard++) {
    const a = out[0]!;
    const b = out[1]!;
    const c = out[2]!;
    if (!mainKeys.has(hexKey(a.q, a.r))) break;
    if (mainKeys.has(hexKey(b.q, b.r))) break;
    if (!isHexWrapTriplet(a, b, c)) break;
    out.splice(1, 1);
  }
  return out;
}

/** Wybór boku L/R: ku centrum masy gdy różnica wyraźna, inaczej naprzemiennie. */
function pickPerpDirTowardLandCenter(
  perpDirs: Array<readonly [number, number]>,
  spawnQ: number,
  spawnR: number,
  square: ContinentCenterSquare | null,
  centroid: { q: number; r: number } | null,
  sideToggle: number,
): readonly [number, number] {
  if (perpDirs.length === 0) return [0, 0];
  if (perpDirs.length === 1) return perpDirs[0]!;
  const scored = perpDirs.map((d) => ({
    d,
    s: scoreRiverStepTowardLandCenter(
      spawnQ, spawnR, spawnQ + d[0], spawnR + d[1], square, centroid,
    ),
  }));
  scored.sort((a, b) => b.s - a.s);
  if (scored[0]!.s >= scored[1]!.s + 10) return scored[0]!.d;
  return perpDirs[sideToggle % perpDirs.length]!;
}

/** Indeks kierunku przepływu main w HEX_DIRECTIONS (-1 gdy nieznany). */
function mainFlowDirIndex(flowDir: readonly [number, number]): number {
  for (let i = 0; i < HEX_DIRECTIONS.length; i++) {
    const d = HEX_DIRECTIONS[i]!;
    if (d[0] === flowDir[0] && d[1] === flowDir[1]) return i;
  }
  return -1;
}

/** Dwa kierunki prostopadłe do nurtu main na siatce heksów (±2 indeksy w HEX_DIRECTIONS). */
export function perpendicularHexDirections(
  flowDir: readonly [number, number],
): Array<readonly [number, number]> {
  const idx = mainFlowDirIndex(flowDir);
  if (idx < 0) return [];
  return [HEX_DIRECTIONS[(idx + 2) % 6]!, HEX_DIRECTIONS[(idx + 4) % 6]!];
}

/** Lokalny kierunek nurtu main w punkcie ścieżki (średnia sąsiednich segmentów). */
function localMainFlowDirAt(path: RiverCoord[], index: number): [number, number] | null {
  if (path.length < 2) return null;
  if (index > 0 && index < path.length) {
    return riverStepDir(path[index - 1]!, path[index]!);
  }
  if (index === 0) return riverStepDir(path[0]!, path[1]!);
  return riverStepDir(path[path.length - 2]!, path[path.length - 1]!);
}

/** Czy heks ścieżki medium ma wspólną krawędź rzeki z inną ścieżką (junction). */
function mediumPathEndHasRiverJunction(
  end: RiverCoord,
  pathIndex: number,
  hexToPaths: Map<string, Set<number>>,
  hexes: Record<string, Hex>,
): boolean {
  const eh = hexes[hexKey(end.q, end.r)];
  for (const edgeIdx of eh?.rzeka?.krawedzie ?? []) {
    const dir = HEX_DIRECTIONS[edgeIdx];
    if (!dir) continue;
    const owners = hexToPaths.get(hexKey(end.q + dir[0], end.r + dir[1]));
    if (owners && [...owners].some((x) => x !== pathIndex)) return true;
  }
  return false;
}

/** Koniec dopływu na płaskim lądzie bez junction z inną rzeką (FALA 181 — „w powietrzu”). */
function mediumEndsOrphanOnFlatLand(
  hexes: Record<string, Hex>,
  end: RiverCoord,
  pathIndex: number,
  hexToPaths: Map<string, Set<number>>,
  otherRiverKeys: Set<string>,
  minPathSep: number,
): boolean {
  const endKey = hexKey(end.q, end.r);
  const h = hexes[endKey];
  if (!h || !isRiverLandTerrain(h.terenBazowy)) return true;
  if (isReliefTerrain(h.terenBazowy)) return false;
  if (otherRiverKeys.has(endKey)) return false;
  if (mediumPathEndHasRiverJunction(end, pathIndex, hexToPaths, hexes)) return false;
  const dist = nearestRiverHexDistance(end.q, end.r, otherRiverKeys);
  // FALA 173 soft sep: stop na płaskim przy ~minPathSep od sieci jest OK.
  if (dist >= minPathSep && dist <= minPathSep + 1) return false;
  return true;
}

type MediumTributaryGrowOpts = {
  hexes: Record<string, Hex>;
  path: RiverCoord[];
  cur: RiverCoord;
  startKey: string;
  preferredDir: readonly [number, number];
  blockRiverKeys: Set<string>;
  /** FALA 190: sep bez heksów rodzica main — inaczej grow urywa przy wijącym się nurcie. */
  sepBlockKeys: Set<string>;
  /** Indeks sep — unika O(n) nearestRiverHexDistance per krok grow (Super Huge). */
  sepIndex?: RiverHexSpatialIndex;
  minPathSep: number;
  mainKeys: Set<string>;
  minNetLen: number;
  landCentroid: { q: number; r: number } | null;
  landCenterSquare: ContinentCenterSquare | null;
  rand: () => number;
};

function collectMediumTributaryGrowCandidates(
  o: MediumTributaryGrowOpts,
): Array<{ q: number; r: number; score: number; junction: boolean }> {
  const out: Array<{ q: number; r: number; score: number; junction: boolean }> = [];
  let inDir: [number, number] | null = null;
  if (o.path.length >= 2) inDir = riverStepDir(o.path[o.path.length - 2]!, o.cur);

  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nq = o.cur.q + dq;
    const nr = o.cur.r + dr;
    const nk = hexKey(nq, nr);
    if (!isRiverWindowTurnAllowed(o.path, nq, nr)) continue;

    const onRiver = o.blockRiverKeys.has(nk);
    const isJunction = onRiver && nk !== o.startKey && o.path.length >= 2;
    if (onRiver && !isJunction) continue;

    const netSoFar = mediumTributaryNetHexCount(o.path, o.mainKeys);
    // FALA 183: junction dopiero po sensownym odcinku w głąb — inaczej oxbow 1–3 hex.
    if (isJunction && netSoFar < o.minNetLen) continue;

    const nh = o.hexes[nk];
    if (!isJunction
      && !canRiverFlowThrough(nh, nk, o.startKey, true, undefined, false)) continue;
    // FALA 192: pierwszy krok od main może być Wybrzeże; dalej — tylko suchy ląd.
    if (!isJunction
      && netSoFar < o.minNetLen
      && nh?.terenBazowy === TerenBazowy.PlytkieMorze
      && o.path.length > 1) continue;
    if (!isJunction) {
      // FALA 192: luźniejszy sep przy starcie — effectiveSep=1, nie 2.
      const effectiveSep = netSoFar < o.minNetLen ? 1 : o.minPathSep;
      const sepKeys = netSoFar < o.minNetLen ? o.sepBlockKeys : o.blockRiverKeys;
      if (o.path.length > 1 && !riverGrowStepPassesSep(nq, nr, sepKeys, effectiveSep, o.sepIndex)) continue;
      if (o.path.length <= 1 && o.blockRiverKeys.has(nk) && nk !== o.startKey) continue;
    }

    const inlandSteps = netSoFar;
    let score = 0;
    if (inDir && sameRiverDir(inDir, [dq, dr])) score += inlandSteps <= 2 ? 30 : 16;
    // Preferred (bok L/R): silny na 1. kroku; potem centrum prowadzi.
    if (dq === o.preferredDir[0] && dr === o.preferredDir[1]) {
      score += inlandSteps <= 0 ? 48 : inlandSteps <= 1 ? 16 : 3;
    }
    const centerBias = scoreRiverStepTowardLandCenter(
      o.cur.q, o.cur.r, nq, nr, o.landCenterSquare, o.landCentroid,
    );
    score += inlandSteps <= 1 ? centerBias * 3.2 : centerBias * 5.0;
    if (centerBias < 0 && inlandSteps > 1) score -= 28;
    if (nh?.terenBazowy === TerenBazowy.PlytkieMorze && inlandSteps > 0) score -= 90;
    score += o.rand() * (inlandSteps <= 1 ? 0.25 : 0.12);
    if (isJunction) {
      score += 55;
      if (o.mainKeys.has(nk)) score += 45;
      if (o.path.length >= 2) {
        const prev = o.path[o.path.length - 2]!;
        // Zawijanie prev→cur→junction gdy prev sąsiaduje z junction = odrzuć.
        if (isHexWrapTriplet(prev, o.cur, { q: nq, r: nr })) {
          score -= 120;
        } else if (hexAxialDistance(prev.q, prev.r, nq, nr) === 1) {
          score += 30;
        }
      }
    }
    out.push({ q: nq, r: nr, score, junction: isJunction });
  }
  return out;
}

/**
 * FALA 181: dopływ średni od heksa main — prostopadle do nurtu, max dystans aż przeszkoda/sep/junction.
 */
export function growMediumTributaryFromMain(
  hexes: Record<string, Hex>,
  spawnQ: number,
  spawnR: number,
  perpDir: readonly [number, number],
  maxLen: number,
  blockRiverKeys: Set<string>,
  minPathSep: number,
  rand: () => number,
  mainKeys: Set<string>,
  seaDist?: Map<string, number>,
  minNetLen = MEDIUM_TRIBUTARY_MIN_NET_LEN,
  landCenterSquare: ContinentCenterSquare | null = null,
  parentMainKeys?: Set<string>,
  sepIndex?: RiverHexSpatialIndex | null,
): RiverCoord[] {
  const startKey = hexKey(spawnQ, spawnR);
  const path: RiverCoord[] = [{ q: spawnQ, r: spawnR }];
  const visited = new Set<string>([startKey]);
  const landCentroid = landCenterSquare?.centroid
    ?? estimateLandCentroidFromSeed(hexes, spawnQ, spawnR, false, 4000);
  const sepBlockKeys = new Set<string>();
  const parent = parentMainKeys ?? mainKeys;
  for (const k of blockRiverKeys) {
    if (!parent.has(k)) sepBlockKeys.add(k);
  }

  while (path.length < maxLen) {
    const cur = path[path.length - 1]!;
    const growBase: MediumTributaryGrowOpts = {
      hexes, path, cur, startKey, preferredDir: perpDir,
      blockRiverKeys, sepBlockKeys, sepIndex: sepIndex ?? undefined, minPathSep, mainKeys, minNetLen, landCentroid, landCenterSquare, rand,
    };
    const candidates = collectMediumTributaryGrowCandidates(growBase)
      .filter((c) => !visited.has(hexKey(c.q, c.r)));
    if (candidates.length === 0) break;

    const netNow = mediumTributaryNetHexCount(path, mainKeys);
    const junctionReady = candidates.filter((c) => c.junction && netNow >= minNetLen);
    const pool = junctionReady.length > 0 ? junctionReady : candidates;
    pool.sort((a, b) => b.score - a.score);
    const pick = pool[0]!;
    path.push({ q: pick.q, r: pick.r });
    visited.add(hexKey(pick.q, pick.r));
    if (pick.junction && netNow >= minNetLen) break;
  }

  let out = trimMediumBranchHexWrap(path, mainKeys);
  out = trimMediumJoinHexWrap(out, mainKeys, blockRiverKeys);

  if (seaDist && out.length >= 3
    && mediumTributaryNetHexCount(out, mainKeys) < minNetLen) {
    const targetLen = Math.min(maxLen, out.length + minNetLen);
    let extended = extendRiverToMinimumLength(out, hexes, seaDist, rand, targetLen, maxLen);
    extended = repairRiverPathAdjacency(extended, hexes, startKey);
    if (!riverPathViolatesTurnWindow(extended)) {
      out = extended;
    }
  }
  out = trimMediumBranchHexWrap(out, mainKeys);
  out = trimMediumJoinHexWrap(out, mainKeys, blockRiverKeys);
  return out;
}

/** Czy średnia startuje na heksie głównego nurtu. */
export function mediumPathStartsOnMain(path: RiverCoord[], mainKeys: Set<string>): boolean {
  const p0 = path[0];
  if (!p0) return false;
  return mainKeys.has(hexKey(p0.q, p0.r));
}

/** Liczba hex ścieżki medium poza głównym nurtem (netto „w głąb lądu"). */
export function mediumTributaryNetHexCount(path: RiverCoord[], mainKeys: Set<string>): number {
  let n = 0;
  for (const p of path) {
    if (!mainKeys.has(hexKey(p.q, p.r))) n++;
  }
  return n;
}

/**
 * FALA 181 — etap 2: spawn średnich dopływów co {@link MEDIUM_TRIBUTARY_SPACING_HEX} hex wzdłuż main.
 */
function generateMediumTributariesFromMainRivers(
  ctx: GridSourcePlaceCtx,
  massSet: Set<string>,
  maxLen: number,
  minPathSep = MAIN_RIVER_MIN_PATH_SEP,
): number {
  const mainKeys = ctx.mainKeysCache
    ?? collectPathHexKeysForKinds(ctx.riverPaths, ctx.riverKinds, ['main']);
  const blockRiverKeys = collectRiverPathHexKeys(ctx.riverPaths);
  const riverSepIndex = ctx.riverSepIndex ?? RiverHexSpatialIndex.fromKeys(blockRiverKeys);
  ctx.riverSepIndex = riverSepIndex;
  const usedSpawn = ctx.usedMediumSpawnKeys ?? new Set<string>();
  ctx.usedMediumSpawnKeys = usedSpawn;
  let placed = 0;
  let sideToggle = 0;
  const minNetLen = mediumTributaryMinNetLen(ctx.width, ctx.height);
  const spawnSpacing = mediumTributarySpacingHex(ctx.width, ctx.height, !!ctx.largeMapPerf);

  for (let pi = 0; pi < ctx.riverPaths.length; pi++) {
    if (ctx.riverKinds[pi] !== 'main') continue;
    const mainPath = ctx.riverPaths[pi] ?? [];
    if (mainPath.length < 3) continue;

    const parentMainKeys = new Set(mainPath.map((mp) => hexKey(mp.q, mp.r)));
    let sinceSpawn = 0;
    for (let i = 0; i < mainPath.length; i++) {
      const p = mainPath[i]!;
      const pk = hexKey(p.q, p.r);
      if (!massSet.has(pk)) continue;

      sinceSpawn++;
      if (sinceSpawn < spawnSpacing) continue;
      sinceSpawn = 0;

      if (usedSpawn.has(pk)) continue;

      const flowDir = localMainFlowDirAt(mainPath, i);
      if (!flowDir) continue;
      const perpDirs = perpendicularHexDirections(flowDir);
      if (perpDirs.length === 0) continue;
      const landSquare = ctx.massCenterSquare ?? null;
      const landCentroid = landSquare?.centroid
        ?? estimateLandCentroidFromSeed(ctx.hexes, p.q, p.r, false, 4000);
      const perpDir = pickPerpDirTowardLandCenter(
        perpDirs, p.q, p.r, landSquare, landCentroid, sideToggle,
      );
      sideToggle++;

      const tryGrow = (dir: readonly [number, number]) => growMediumTributaryFromMain(
        ctx.hexes, p.q, p.r, dir, maxLen, blockRiverKeys, minPathSep, ctx.rand,
        mainKeys, ctx.seaDist, minNetLen, landSquare, parentMainKeys, riverSepIndex,
      );

      let tribPath = tryGrow(perpDir);
      if (mediumTributaryNetHexCount(tribPath, mainKeys) < minNetLen && perpDirs.length > 1) {
        const altDir = perpDirs[(sideToggle - 1 + 1) % perpDirs.length]!;
        const altPath = tryGrow(altDir);
        if (mediumTributaryNetHexCount(altPath, mainKeys) > mediumTributaryNetHexCount(tribPath, mainKeys)) {
          tribPath = altPath;
        }
      }
      if (mediumTributaryNetHexCount(tribPath, mainKeys) < minNetLen) continue;
      if (!ctx.pushMedium?.(tribPath, p.q, p.r)) continue;
      placed++;
      usedSpawn.add(pk);
      for (const tp of tribPath) {
        const tk = hexKey(tp.q, tp.r);
        blockRiverKeys.add(tk);
        riverSepIndex.add(tk);
      }
    }
  }
  return placed;
}

/** Heksy main + medium już w sieci spływającej do morza (cel routingu etapu 2). */
function buildMediumRouteTargetKeys(
  hexes: Record<string, Hex>,
  paths: RiverCoord[][],
  kinds: RiverPathKind[],
  width: number,
  height: number,
  oceanConnected: Set<string>,
): Set<string> {
  const mainKeys = collectPathHexKeysForKinds(paths, kinds, ['main']);
  const reached = buildOceanReachableRiverHexKeys(
    hexes, paths, kinds, width, height, oceanConnected,
  );
  const targets = new Set(mainKeys);
  for (const k of collectPathHexKeysForKinds(paths, kinds, ['medium'])) {
    if (reached.has(k)) targets.add(k);
  }
  return targets;
}

/** A* do sieci (main / ocean-reachable medium) — bez meandrów, z oknem skrętu FALA 173. */
function traceMediumRiver(
  hexes: Record<string, Hex>,
  sq: number,
  sr: number,
  tq: number,
  tr: number,
  maxLen: number,
  seaDist: Map<string, number>,
  rand: () => number,
  minLen = 3,
): RiverCoord[] {
  const srcKey = hexKey(sq, sr);
  let path = aStarRiverToTarget(hexes, sq, sr, tq, tr, maxLen, srcKey);
  if (path.length < 3) return [];
  path = extendRiverToMinimumLength(path, hexes, seaDist, rand, minLen, maxLen);
  path = repairRiverPathAdjacency(path, hexes, srcKey);
  if (path.length > maxLen) path = path.slice(0, maxLen);
  if (riverPathViolatesTurnWindow(path)) {
    path = sanitizeRiverTurnWindow(path, hexes, srcKey);
  }
  return path.length >= 3 ? path : [];
}

/**
 * Finalizacja średniej rzeki (FALA 175/181): okno skrętu jak main, junction bez ogona przez main,
 * wymóg połączenia z main/siecią; brak końcówki „w powietrzu" na płaskim lądzie.
 */
function finalizeMediumPath(
  hexes: Record<string, Hex>,
  path: RiverCoord[],
  riverPaths: RiverCoord[][],
  riverKinds: RiverPathKind[],
  width: number,
  height: number,
  oceanConnected: Set<string>,
): RiverCoord[] | null {
  if (path.length < 2) return null;
  const mainKeysEarly = collectPathHexKeysForKinds(riverPaths, riverKinds, ['main']);
  if (path.length < 3 && !mediumPathStartsOnMain(path, mainKeysEarly)) return null;
  const srcKey = hexKey(path[0]!.q, path[0]!.r);
  let out = sanitizeRiverPath(path);
  if (riverPathViolatesTurnWindow(out)) {
    out = sanitizeRiverTurnWindow(out, hexes, srcKey);
  }
  if (out.length < 2) return null;
  const mainKeys = collectPathHexKeysForKinds(riverPaths, riverKinds, ['main']);
  if (out.length < 3 && !mediumPathStartsOnMain(out, mainKeys)) return null;
  out = trimRiverPathRings(hexes, out);

  const networkKeys = collectRiverPathHexKeys(riverPaths);
  out = trimMediumBranchHexWrap(out, mainKeys);
  out = trimMediumJoinHexWrap(out, mainKeys, networkKeys);
  out = trimMediumTailAlongMain(out, mainKeys);
  if (out.length < 2) return null;
  if (out.length < 3 && !mediumPathStartsOnMain(out, mainKeys)) return null;

  // FALA 181: średnia musi startować na heksie głównego nurtu.
  if (!mediumPathStartsOnMain(out, mainKeys)) return null;
  if (mediumTributaryNetHexCount(out, mainKeys) < mediumTributaryMinNetLen(width, height)) return null;
  // FALA 187: odrzuć wybrzeżniki — musi być ≥3 hex suchego lądu do renderu wstęgi.
  if (countMediumInlandLandHexes(hexes, out) < 3) return null;

  const reached = buildOceanReachableRiverHexKeys(
    hexes, riverPaths, riverKinds, width, height, oceanConnected,
  );
  const touchesMain = pathTouchesMainNetwork(out, mainKeys);
  const onNetwork = tributaryTouchesOceanReachable(out, reached);
  const endsSea = pathEndsAtSea(hexes, out, width, height, oceanConnected);

  if (!onNetwork && !endsSea) return null;
  if (!touchesMain && !onNetwork) {
    if (!endsSea) return null;
  }
  if (!touchesMain && onNetwork && !endsSea) {
    // połączenie wyłącznie przez medium w sieci — OK (legacy top-up)
  }

  const hexToPaths = new Map<string, Set<number>>();
  for (let pi = 0; pi < riverPaths.length; pi++) {
    for (const p of riverPaths[pi] ?? []) {
      const k = hexKey(p.q, p.r);
      const s = hexToPaths.get(k) ?? new Set<number>();
      s.add(pi);
      hexToPaths.set(k, s);
    }
  }
  const pathIndex = riverPaths.length;
  const end = out[out.length - 1]!;
  const otherRiverKeys = collectRiverPathHexKeys(riverPaths);
  // FALA 181: start na main = już w sieci — koniec na płaskim bez junction jest OK.
  if (!endsSea && !mediumPathStartsOnMain(out, mainKeys) && mediumEndsOrphanOnFlatLand(
    hexes, end, pathIndex, hexToPaths, otherRiverKeys, MAIN_RIVER_MIN_PATH_SEP,
  )) return null;

  return out;
}

/** Render: utnij ogon średniej wzdłuż main (junction snap, bez przejścia przez nurt). */
export function trimMediumRenderPathAtMain(
  path: RiverCoord[],
  mainPaths: RiverCoord[][],
): RiverCoord[] {
  const mainKeys = new Set<string>();
  for (const mp of mainPaths) {
    for (const p of mp ?? []) mainKeys.add(hexKey(p.q, p.r));
  }
  return trimMediumTailAlongMain(path, mainKeys);
}

/**
 * Etap 3: krótki dopływ — tylko do średniej rzeki (etap 2), bez bezpośredniego ujścia do oceanu.
 */
function finalizeShortPath(
  hexes: Record<string, Hex>,
  path: RiverCoord[],
  riverPaths: RiverCoord[][],
  riverKinds: RiverPathKind[],
  width: number,
  height: number,
  oceanConnected: Set<string>,
): RiverCoord[] | null {
  let out = trimRiverPathRings(hexes, path);
  if (out.length < 3) return null;
  if (out.length >= 2) {
    const junction = out[out.length - 1]!;
    const approach = out[out.length - 2]!;
    const down = networkDownstreamNeighbor(hexes, junction, approach, riverPaths);
    out = appendJunctionDownstreamHex(out, down);
  }
  const ocean = oceanConnected;
  if (pathEndsAtSea(hexes, out, width, height, ocean)) return null;

  const mediumKeys = collectPathHexKeysForKinds(riverPaths, riverKinds, ['medium']);
  if (mediumKeys.size === 0) return null;

  const end = out[out.length - 1]!;
  const endKey = hexKey(end.q, end.r);
  let onMedium = mediumKeys.has(endKey);
  if (!onMedium) {
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(end.q + dq, end.r + dr);
      if (mediumKeys.has(nk)) { onMedium = true; break; }
    }
  }
  if (!onMedium) return null;

  const reached = buildOceanReachableRiverHexKeys(
    hexes, riverPaths, riverKinds, width, height, ocean,
  );
  if (!tributaryTouchesOceanReachable(out, reached)) return null;
  return out;
}

function networkDownstreamNeighbor(
  hexes: Record<string, Hex>,
  junction: RiverCoord,
  approach: RiverCoord | undefined,
  riverPaths?: RiverCoord[][],
): RiverCoord | undefined {
  const jh = hexes[hexKey(junction.q, junction.r)];
  const edges = jh?.rzeka?.krawedzie;
  if (!edges || edges.length === 0) return undefined;
  const candidates: RiverCoord[] = [];
  for (const edgeIdx of edges) {
    const dir = HEX_DIRECTIONS[edgeIdx];
    if (!dir) continue;
    const nq = junction.q + dir[0];
    const nr = junction.r + dir[1];
    if (approach && nq === approach.q && nr === approach.r) continue;
    const nh = hexes[hexKey(nq, nr)];
    if (nh?.rzeka?.obecna && nh.terenBazowy !== TerenBazowy.Morze) {
      candidates.push({ q: nq, r: nr });
    }
  }
  if (candidates.length === 0) return undefined;

  // Preferuj sąsiada leżący na JUŻ oznakowanej ścieżce sieci (kontynuacja nurtu głównego).
  if (riverPaths && riverPaths.length > 0) {
    const junctionKey = hexKey(junction.q, junction.r);
    for (const path of riverPaths) {
      for (let i = 0; i < path.length - 1; i++) {
        const a = path[i]!;
        const b = path[i + 1]!;
        const ak = hexKey(a.q, a.r);
        const bk = hexKey(b.q, b.r);
        if (ak === junctionKey) {
          const hit = candidates.find((c) => c.q === b.q && c.r === b.r);
          if (hit) return hit;
        }
        if (bk === junctionKey) {
          const hit = candidates.find((c) => c.q === a.q && c.r === a.r);
          if (hit) return hit;
        }
      }
    }
  }
  return candidates[0];
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
function tributaryCountForLength(pathLen: number, areaScale = 1): number {
  if (pathLen < 8) return 0;
  if (pathLen < 22) return Math.max(2, Math.round(6 * areaScale));
  return Math.min(12, Math.floor((pathLen / 8) * 3 * areaScale));
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
  allowReliefTraversal = false,
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
      if (!canRiverFlowThrough(hexes[nk], nk, sourceKey, true, targetK, allowReliefTraversal)) continue;
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
  searchMin = 3,
  searchMax = 8,
): [number, number] | null {
  const candidates: Array<{ q: number; r: number; score: number }> = [];
  for (let dq = -searchMax; dq <= searchMax; dq++) {
    for (let dr = -searchMax; dr <= searchMax; dr++) {
      const dist = hexAxialDistance(junction.q, junction.r, junction.q + dq, junction.r + dr);
      if (dist < searchMin || dist > searchMax) continue;
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
  minLen = 3,
): RiverCoord[] {
  const srcKey = hexKey(sq, sr);
  let path = aStarRiverToTarget(hexes, sq, sr, tq, tr, maxLen, srcKey);
  if (path.length < 3) return [];
  path = extendRiverToMinimumLength(path, hexes, seaDist, rand, minLen, maxLen);
  const maxMeander = Math.min(10, Math.max(2, maxLen - path.length));
  path = injectRiverMeanders(path, hexes, seaDist, rand, maxMeander);
  path = repairRiverPathAdjacency(path, hexes, srcKey);
  if (path.length > maxLen) path = path.slice(0, maxLen);
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
  width: number,
  height: number,
  oceanConnected: Set<string>,
  areaScale = 1,
  reliefSearchMin = 3,
  reliefSearchMax = 8,
): void {
  const n = tributaryCountForLength(mainPath.length, areaScale);
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

    const src = findTributarySource(
      hexes, junction, mainKeys, usedSources, rand, reliefSearchMin, reliefSearchMax,
    );
    if (!src) continue;
    if (isTooCloseToRiverSource(src[0], src[1], usedSources, Math.max(2, Math.floor(minSourceSep * 0.5)))) {
      continue;
    }

    const srcKey = hexKey(src[0], src[1]);
    const tribLen = Math.min(maxLen, Math.max(5, Math.floor(mainPath.length * 0.4)));
    let path = traceTributary(hexes, src[0], src[1], junction.q, junction.r, tribLen, seaDist, rand);
    if (path.length < 3) continue;

    const finalized = finalizeTributaryPath(
      hexes, path, riverPaths, riverKinds, width, height, oceanConnected,
    );
    if (!finalized) continue;
    riverPaths.push(finalized);
    riverKinds.push('tributary');
    usedSources.add(srcKey);
    markRiverPath(hexes, finalized);
  }
}

// ---------------------------------------------------------------------------
// Rzeki — równomierna siatka (Maciej 2026-07-04: fair play, źródło→morze co N hex)
// ---------------------------------------------------------------------------

/**
 * Bok kwadratu lądu (hex q×r): w każdej komórce min. 1 źródło wody (główny nurt → morze).
 * Bez w,h: bazy przy areaScale=1 (Mało=11 · Normalnie=7 · Dużo=4).
 */
export function riverCoverageCellSize(tier: DensityTier = 'medium', w?: number, h?: number): number {
  if (w != null && h != null) return resolveRiverMapParams(tier, w, h).mainCell;
  if (tier === 'high') return 5;
  if (tier === 'low') return 15;
  return 10;
}

/**
 * B0.8b (Z2): GĘSTOŚĆ DOPŁYWÓW — osobna siatka dla feederów i top-upu.
 * Bez w,h: bazy przy areaScale=1 (Mało=6 · Normalnie=4 · Dużo=2).
 */
export function riverTributaryCellSize(tier: DensityTier = 'medium', w?: number, h?: number): number {
  if (w != null && h != null) return resolveRiverMapParams(tier, w, h).tributaryCell;
  if (tier === 'high') return 2;
  if (tier === 'low') return 6;
  return 4;
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

/** Etap 1=główne→ocean · 2=średnie→sieć|ocean · 3=krótkie→średnie · tributary=dekoracyjne. */
export type RiverPathKind = 'main' | 'medium' | 'short' | 'tributary';

/** Etap 3: max odległość źródła od ścieżki średniej rzeki (hex). */
export const SHORT_RIVER_MAX_DIST_FROM_MEDIUM = 5;

export interface GenerateRiversResult {
  paths: RiverCoord[][];
  kinds: RiverPathKind[];
}

/** BATCH 4: główny nurt w każdej komórce siatki (stride=1). */
export const MAIN_RIVER_GRID_STRIDE = 1;

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

function isSparseMainCoverageCell(
  land: Array<[number, number]>,
  cellSize: number,
  stride: number = MAIN_RIVER_GRID_STRIDE,
): boolean {
  if (land.length === 0) return false;
  const [cq, cr] = coverageCellIndex(land[0]![0], land[0]![1], cellSize);
  return cq % stride === 0 && cr % stride === 0;
}

function collectRiverHexKeys(hexes: Record<string, Hex>): Set<string> {
  const keys = new Set<string>();
  for (const [k, h] of Object.entries(hexes)) {
    if (h.rzeka?.obecna) keys.add(k);
  }
  return keys;
}

/** Heksy należące do ścieżek wybranych typów (etap 2/3 hierarchia). */
export function collectPathHexKeysForKinds(
  paths: RiverCoord[][],
  kinds: RiverPathKind[],
  allowed: ReadonlySet<RiverPathKind> | RiverPathKind[],
): Set<string> {
  const allow = allowed instanceof Set ? allowed : new Set(allowed);
  const keys = new Set<string>();
  for (let i = 0; i < paths.length; i++) {
    if (!allow.has(kinds[i] ?? 'main')) continue;
    for (const p of paths[i] ?? []) keys.add(hexKey(p.q, p.r));
  }
  return keys;
}

function isNonMainRiverKind(kind: RiverPathKind | undefined): boolean {
  return kind === 'medium' || kind === 'short' || kind === 'tributary';
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
      if (isNonMainRiverKind(curKinds[i]) && !pathEndsAtSea(hexes, p, width, height, ocean)) {
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

/**
 * Bramka końcowa (generator.ts, PO wszystkich przebiegach terenu): usuwa wiszące dopływy i
 * główne trasy bez ujścia. Wołana ponownie po reliefie/złożach na Ziemi, bo późniejsze
 * kroki mogą rozłączyć sieć bez aktualizacji riverPaths (regres BUG-RZEKI-DOPLYWY).
 */
export function ensureRiverOutlets(
  hexes: Record<string, Hex>,
  paths: RiverCoord[][],
  kinds: RiverPathKind[],
  width: number,
  height: number,
): { paths: RiverCoord[][]; kinds: RiverPathKind[] } {
  let result = pruneOrphanRiverPaths(hexes, paths, kinds, width, height);
  result = pruneRiversNotReachingRealSea(hexes, result.paths, result.kinds, width, height);
  const ocean = oceanConnectedWaterKeys(hexes, width, height);
  result = pruneInvalidShortRiverPaths(hexes, result.paths, result.kinds, width, height, ocean);
  scrubStrayRiverHexMarks(hexes, result.paths);
  syncRiverEdgeBonusHexes(hexes);
  return result;
}

/** Przebudowuje oznaczenia rzeki wyłącznie z zachowanych tras + sync bonusu na obu heksach krawędzi. */
function scrubStrayRiverHexMarks(hexes: Record<string, Hex>, paths: RiverCoord[][]): void {
  clearRiverMarks(hexes);
  for (const path of paths) {
    if (path?.length) markRiverPath(hexes, path);
  }
  syncRiverEdgeBonusHexes(hexes);
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
    if (isNonMainRiverKind(kinds[pi])) continue;
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

/** Etap 3: usuwa krótkie trasy bez połączenia ze średnią rzeką lub ze źródłem >5 hex od średniej. */
function pruneInvalidShortRiverPaths(
  hexes: Record<string, Hex>,
  paths: RiverCoord[][],
  kinds: RiverPathKind[],
  width: number,
  height: number,
  oceanConnected: Set<string>,
): { paths: RiverCoord[][]; kinds: RiverPathKind[] } {
  const mediumKeys = collectPathHexKeysForKinds(paths, kinds, ['medium']);
  if (mediumKeys.size === 0) return { paths, kinds };

  const drop = new Set<number>();
  for (let i = 0; i < paths.length; i++) {
    if (kinds[i] !== 'short') continue;
    const p = paths[i] ?? [];
    const p0 = p[0];
    if (!p0) { drop.add(i); continue; }
    if (nearestRiverHexDistance(p0.q, p0.r, mediumKeys) > SHORT_RIVER_MAX_DIST_FROM_MEDIUM) {
      drop.add(i);
      continue;
    }
    if (pathEndsAtSea(hexes, p, width, height, oceanConnected)) {
      drop.add(i);
      continue;
    }
    const end = p[p.length - 1]!;
    let onMedium = mediumKeys.has(hexKey(end.q, end.r));
    if (!onMedium) {
      for (const [dq, dr] of HEX_DIRECTIONS) {
        if (mediumKeys.has(hexKey(end.q + dq, end.r + dr))) { onMedium = true; break; }
      }
    }
    if (!onMedium) drop.add(i);
  }
  if (drop.size === 0) return { paths, kinds };
  const keptPaths = paths.filter((_, i) => !drop.has(i));
  const keptKinds = kinds.filter((_, i) => !drop.has(i));
  clearRiverMarks(hexes);
  for (const p of keptPaths) markRiverPath(hexes, p);
  return { paths: keptPaths, kinds: keptKinds };
}

/** FALA 175: usuwa średnie bez styku z main/siecią, z łamanym oknem skrętu lub dead-end na lądzie. */
export function pruneInvalidMediumRiverPaths(
  hexes: Record<string, Hex>,
  paths: RiverCoord[][],
  kinds: RiverPathKind[],
  width: number,
  height: number,
  oceanConnected?: Set<string>,
): { paths: RiverCoord[][]; kinds: RiverPathKind[] } {
  const ocean = oceanConnected ?? oceanConnectedWaterKeys(hexes, width, height);
  const mainKeys = collectPathHexKeysForKinds(paths, kinds, ['main']);
  const networkKeys = collectRiverPathHexKeys(paths);
  let joinRepaired = false;
  for (let i = 0; i < paths.length; i++) {
    if (kinds[i] !== 'medium') continue;
    let trimmed = trimMediumBranchHexWrap(paths[i] ?? [], mainKeys);
    trimmed = trimMediumJoinHexWrap(trimmed, mainKeys, networkKeys);
    if (trimmed.length !== (paths[i]?.length ?? 0)) {
      paths[i] = trimmed;
      joinRepaired = true;
    }
  }
  if (joinRepaired) {
    clearRiverMarks(hexes);
    for (const p of paths) markRiverPath(hexes, p);
  }

  const reached = buildOceanReachableRiverHexKeys(hexes, paths, kinds, width, height, ocean);

  const hexToPaths = new Map<string, Set<number>>();
  for (let pi = 0; pi < paths.length; pi++) {
    for (const p of paths[pi] ?? []) {
      const k = hexKey(p.q, p.r);
      const s = hexToPaths.get(k) ?? new Set<number>();
      s.add(pi);
      hexToPaths.set(k, s);
    }
  }

  const drop = new Set<number>();
  for (let i = 0; i < paths.length; i++) {
    if (kinds[i] !== 'medium') continue;
    const p = paths[i] ?? [];
    if (p.length < 2) { drop.add(i); continue; }
    if (p.length < 3 && !mediumPathStartsOnMain(p, mainKeys)) { drop.add(i); continue; }
    if (mediumTributaryNetHexCount(p, mainKeys) < mediumTributaryMinNetLen(width, height)) { drop.add(i); continue; }
    if (riverPathViolatesTurnWindow(p)) { drop.add(i); continue; }
    if (countMediumInlandLandHexes(hexes, p) < 3) { drop.add(i); continue; }

    const endsSea = pathEndsAtSea(hexes, p, width, height, ocean);
    const onNetwork = tributaryTouchesOceanReachable(p, reached);
    const touchesMain = pathTouchesMainNetwork(p, mainKeys);

    if (!onNetwork && !endsSea) { drop.add(i); continue; }
    if (!touchesMain && !onNetwork && endsSea) {
      // samotna średnia do oceanu bez styku z main — odrzuć (ocean tylko w gen, nie orphan)
      drop.add(i);
      continue;
    }

    const startsOnMain = mediumPathStartsOnMain(p, mainKeys);
    if (!endsSea && !startsOnMain) {
      const end = p[p.length - 1]!;
      const eh = hexes[hexKey(end.q, end.r)];
      let closed = false;
      for (const edgeIdx of eh?.rzeka?.krawedzie ?? []) {
        const dir = HEX_DIRECTIONS[edgeIdx];
        if (!dir) continue;
        const owners = hexToPaths.get(hexKey(end.q + dir[0], end.r + dir[1]));
        if (owners && [...owners].some((x) => x !== i)) { closed = true; break; }
      }
      if (!closed) drop.add(i);
    }
  }

  if (drop.size === 0) return { paths, kinds };
  const keptPaths = paths.filter((_, i) => !drop.has(i));
  const keptKinds = kinds.filter((_, i) => !drop.has(i));
  clearRiverMarks(hexes);
  for (const p of keptPaths) markRiverPath(hexes, p);
  return { paths: keptPaths, kinds: keptKinds };
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

export function collectRiverPathHexKeys(paths: RiverCoord[][]): Set<string> {
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
  junctionCap = 16,
): Array<{ q: number; r: number; dist: number; score: number }> {
  const out: Array<{ q: number; r: number; dist: number; score: number }> = [];
  const maxD = maxLen + 6;
  for (let dist = 3; dist <= maxD && out.length < junctionCap; dist++) {
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
  return out.slice(0, junctionCap);
}

/** Odległość od (sq,sr) do najbliższego heksa istniejącej rzeki. */
const RIVER_SPATIAL_CELL = 6;

/**
 * Indeks przestrzenny heksów rzeki — O(1) średnio zamiast O(|keys|) na zapytanie sep.
 * Używany na Duży/Super Huge Pangea (PERF-SUPER-HUGE-PANGEA-80).
 */
export class RiverHexSpatialIndex {
  private readonly buckets = new Map<string, string[]>();
  private count = 0;

  static fromKeys(keys: Iterable<string>): RiverHexSpatialIndex {
    const idx = new RiverHexSpatialIndex();
    for (const k of keys) idx.add(k);
    return idx;
  }

  get size(): number { return this.count; }

  add(key: string): void {
    const { q, r } = parseHexKey(key);
    const cell = RiverHexSpatialIndex.cellId(q, r);
    const bucket = this.buckets.get(cell);
    if (bucket) {
      if (bucket.includes(key)) return;
      bucket.push(key);
    } else {
      this.buckets.set(cell, [key]);
    }
    this.count++;
  }

  addPath(path: RiverCoord[]): void {
    for (const p of path) this.add(hexKey(p.q, p.r));
  }

  private static cellId(q: number, r: number): string {
    return `${Math.floor(q / RIVER_SPATIAL_CELL)},${Math.floor(r / RIVER_SPATIAL_CELL)}`;
  }

  nearestDistance(sq: number, sr: number, earlyExitBelow = 0): number {
    if (this.count === 0) return Infinity;
    const cq0 = Math.floor(sq / RIVER_SPATIAL_CELL);
    const cr0 = Math.floor(sr / RIVER_SPATIAL_CELL);
    let ring = 0;
    let best = Infinity;
    const maxRing = 24;
    while (ring <= maxRing) {
      for (let dq = -ring; dq <= ring; dq++) {
        for (let dr = -ring; dr <= ring; dr++) {
          if (ring > 0 && Math.abs(dq) !== ring && Math.abs(dr) !== ring) continue;
          const bucket = this.buckets.get(`${cq0 + dq},${cr0 + dr}`);
          if (!bucket) continue;
          for (const k of bucket) {
            const { q, r } = parseHexKey(k);
            const d = hexAxialDistance(sq, sr, q, r);
            if (d < best) {
              best = d;
              if (earlyExitBelow > 0 && d < earlyExitBelow) return d;
            }
          }
        }
      }
      if (best !== Infinity && best <= ring * RIVER_SPATIAL_CELL) break;
      ring++;
    }
    return best;
  }
}

export function nearestRiverHexDistance(
  sq: number,
  sr: number,
  riverKeys: Set<string>,
  spatialIndex?: RiverHexSpatialIndex | null,
): number {
  if (spatialIndex && spatialIndex.size > 0) {
    return spatialIndex.nearestDistance(sq, sr);
  }
  let best = Infinity;
  for (const k of riverKeys) {
    const { q, r } = parseHexKey(k);
    best = Math.min(best, hexAxialDistance(sq, sr, q, r));
  }
  return best;
}

/** Czy jakikolwiek heks trasy jest bliżej niż minSep od istniejących heksów rzeki. */
function isPathTooCloseToRiverHexes(
  path: RiverCoord[],
  riverKeys: Set<string>,
  minSep: number,
  spatialIndex?: RiverHexSpatialIndex | null,
): boolean {
  if (riverKeys.size === 0 || minSep <= 0) return false;
  if (spatialIndex && spatialIndex.size > 0) {
    for (const p of path) {
      if (spatialIndex.nearestDistance(p.q, p.r, minSep) < minSep) return true;
    }
    return false;
  }
  for (const p of path) {
    for (const k of riverKeys) {
      const { q, r } = parseHexKey(k);
      if (hexAxialDistance(p.q, p.r, q, r) < minSep) return true;
    }
  }
  return false;
}

/** Kanon 2026-07-31: komórka ma START (path[0]) dowolnej rzeki w komórce. */
export function cellHasRiverSourceInCell(
  cellLand: Array<[number, number]>,
  paths: RiverCoord[][],
): boolean {
  const cellSet = new Set(cellLand.map(([q, r]) => hexKey(q, r)));
  for (const path of paths) {
    const p0 = path?.[0];
    if (p0 && cellSet.has(hexKey(p0.q, p0.r))) return true;
  }
  return false;
}

type GridRouteCandidate = { path: RiverCoord[]; kind: 'main' | 'tributary'; len: number };

type GridPlaceMode = 'auto' | 'main-only' | 'medium' | 'short';

/** Czy trasa ma ujście do morza lub do sieci rzeki (bez sierot). */
export function pathHasValidRiverOutlet(
  hexes: Record<string, Hex>,
  path: RiverCoord[],
  paths: RiverCoord[][],
  kinds: RiverPathKind[],
  width: number,
  height: number,
): boolean {
  if (!path?.length) return false;
  const ocean = oceanConnectedWaterKeys(hexes, width, height);
  if (pathEndsAtSea(hexes, path, width, height, ocean)) return true;
  const reached = buildOceanReachableRiverHexKeys(hexes, paths, kinds, width, height, ocean);
  return tributaryTouchesOceanReachable(path, reached);
}

interface GridSourcePlaceCtx {
  hexes: Record<string, Hex>;
  width: number;
  height: number;
  riverPaths: RiverCoord[][];
  riverKinds: RiverPathKind[];
  usedSources: Set<string>;
  seaDist: Map<string, number>;
  openOceanDist: Map<string, number>;
  oceanConnected: Set<string>;
  rand: () => number;
  minLen: number;
  maxLen: number;
  acceptLen: number;
  sourceSep: number;
  traceMinLen: number;
  traceOptsBase: { hardMeanderLen: number; mouthTailLen: number };
  seaBufferOpts: { minInland: number; mouthTail: number };
  pushMain: (path: RiverCoord[], sq: number, sr: number) => boolean;
  pushTributary: (path: RiverCoord[], sq: number, sr: number) => boolean;
  pushMedium?: (path: RiverCoord[], sq: number, sr: number) => boolean;
  pushShort?: (path: RiverCoord[], sq: number, sr: number) => boolean;
  relaxSeaBuffer?: boolean;
  allowReliefTraversal?: boolean;
  placeMode?: GridPlaceMode;
  targetRiverKinds?: RiverPathKind[];
  /** FALA 181: już obsłużone punkty spawnu średnich na main. */
  usedMediumSpawnKeys?: Set<string>;
  /** Pangea lub duża mapa — agresywniejsze limity perf (ujścia, topUp). */
  pangeaSingleMass?: boolean;
  largeMapPerf?: boolean;
  /** Cache heksów main — unika O(n) rebuild per pushMain (FALA 166 perf). */
  mainKeysCache?: Set<string>;
  /** Indeks sep heksów rzeki — Super Huge / Duży (PERF-SUPER-HUGE-PANGEA-80). */
  riverSepIndex?: RiverHexSpatialIndex;
  /** Centroid masy lądowej — fallback kierunku głównych rzek (FALA 173). */
  massCentroid?: { q: number; r: number } | null;
  /** Kwadrat centrum kontynentu 5×5 — cel kierunku rzek (FALA 186). */
  massCenterSquare?: ContinentCenterSquare | null;
}

function buildGridRouteCandidates(
  ctx: GridSourcePlaceCtx,
  sq: number,
  sr: number,
  massSet?: Set<string>,
): GridRouteCandidate[] {
  const {
    hexes, width, height, riverPaths, seaDist, openOceanDist, oceanConnected,
    rand, minLen, maxLen, acceptLen, traceMinLen, traceOptsBase, seaBufferOpts,
  } = ctx;
  const srcKey = hexKey(sq, sr);
  const startSeaDist = seaDist.get(srcKey) ?? 999;
  const traceMax = riverTraceBudgetForSeaDist(startSeaDist, minLen, maxLen, ctx.largeMapPerf);
  const out: GridRouteCandidate[] = [];
  const mode = ctx.placeMode ?? 'auto';
  const junctionCap = ctx.largeMapPerf ? 6 : 16;

  if (mode !== 'short') {
    const fastTrace = !!(ctx.pangeaSingleMass || ctx.largeMapPerf);
    const seaPath = traceRiverForGridFill(
      hexes, sq, sr, traceMax, minLen, acceptLen,
      {
        seaDist, openOceanDist, oceanConnected, mapWidth: width, mapHeight: height, rand,
        ...traceOptsBase,
        allowReliefTraversal: ctx.allowReliefTraversal,
        relaxSeaBuffer: ctx.relaxSeaBuffer,
      },
      ctx.relaxSeaBuffer,
      fastTrace,
    );
    if (seaPath.length >= acceptLen
      && pathEndsAtSea(hexes, seaPath, width, height, oceanConnected)
      && (ctx.relaxSeaBuffer || riverPathRespectsSeaBuffer(
        hexes, seaPath, seaDist, seaBufferOpts.minInland, seaBufferOpts.mouthTail,
      ))) {
      out.push({ path: seaPath, kind: 'main', len: seaPath.length });
    }
  }

  if (mode === 'main-only') return out;

  const riverKeys = new Set(
    [...collectRiverPathHexKeys(riverPaths)].filter((k) => !massSet || massSet.has(k)),
  );
  const tribTargetKinds = ctx.targetRiverKinds
    ?? (mode === 'short' ? ['medium'] as RiverPathKind[] : undefined);
  let tribKeysForTrace: Set<string>;
  if (mode === 'medium') {
    tribKeysForTrace = buildMediumRouteTargetKeys(
      hexes, riverPaths, ctx.riverKinds, width, height, oceanConnected,
    );
  } else {
    const tribRiverKeys = tribTargetKinds
      ? collectPathHexKeysForKinds(riverPaths, ctx.riverKinds, tribTargetKinds)
      : riverKeys;
    tribKeysForTrace = tribRiverKeys.size > 0 ? tribRiverKeys : riverKeys;
  }

  if (tribKeysForTrace.size > 0) {
    let bestTrib: RiverCoord[] = [];
    let bestTribLen = Infinity;
    const traceFn = mode === 'medium' ? traceMediumRiver : traceTributary;
    for (const j of rankNetworkJunctionCandidates(sq, sr, tribKeysForTrace, seaDist, traceMax, rand, junctionCap)) {
      const p = traceFn(hexes, sq, sr, j.q, j.r, traceMax, seaDist, rand, minLen);
      if (p.length >= acceptLen && p.length < bestTribLen) {
        bestTrib = p;
        bestTribLen = p.length;
      }
    }
    if (bestTrib.length >= acceptLen) {
      out.push({ path: bestTrib, kind: 'tributary', len: bestTrib.length });
    }
  }

  return out;
}

/** Etap 2: priorytet dopływu do main/sieci (najkrótsza trasa A*), ocean tylko jako fallback. */
function pickPhase2Route(candidates: GridRouteCandidate[]): GridRouteCandidate | null {
  const tribs = candidates.filter((c) => c.kind === 'tributary');
  if (tribs.length > 0) {
    return tribs.reduce((a, b) => (a.len <= b.len ? a : b));
  }
  const seas = candidates.filter((c) => c.kind === 'main');
  if (seas.length === 0) return null;
  return seas.reduce((a, b) => (a.len <= b.len ? a : b));
}

/** Morze vs rzeka geograficznie; w ramach wyboru — najdłuższa poprawna trasa. */
function pickGeographicLongestRoute(
  candidates: GridRouteCandidate[],
  startSeaDist: number,
  nearestRiverDist: number,
): GridRouteCandidate | null {
  if (candidates.length === 0) return null;
  const tribs = candidates.filter((c) => c.kind === 'tributary');
  const seas = candidates.filter((c) => c.kind === 'main');
  let pool: GridRouteCandidate[];
  if (tribs.length === 0) pool = seas;
  else if (seas.length === 0) pool = tribs;
  else if (nearestRiverDist < startSeaDist) pool = tribs;
  else if (nearestRiverDist > startSeaDist) pool = seas;
  else pool = candidates;
  return pool.reduce((a, b) => (a.len >= b.len ? a : b));
}

/** Ląd przybrzeżny w masie (sąsiad morza/wybrzeża). */
function collectMassCoastalLandKeys(
  massSet: Set<string>,
  hexes: Record<string, Hex>,
): Set<string> {
  const coastal = new Set<string>();
  for (const k of massSet) {
    const { q, r } = parseHexKey(k);
    if (isCoastalLandHex(hexes, q, r)) coastal.add(k);
  }
  return coastal;
}

/** Ląd przybrzeżny stykający z oceanem (Morze/Wybrzeże połączone z oceanem — nie jeziora). */
function collectMassOceanCoastalLandKeys(
  massSet: Set<string>,
  hexes: Record<string, Hex>,
  oceanConnected: Set<string>,
): Set<string> {
  const coastal = new Set<string>();
  for (const k of massSet) {
    const { q, r } = parseHexKey(k);
    if (!isCoastalLandHex(hexes, q, r)) continue;
    let touchesOcean = false;
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (oceanConnected.has(nk)) {
        touchesOcean = true;
        break;
      }
    }
    if (touchesOcean) coastal.add(k);
  }
  return coastal;
}

/** Sąsiedztwo wzdłuż pierścienia wybrzeża (tylko heksy coastal w masie). */
function buildCoastalAdjacency(coastalKeys: Set<string>): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const k of coastalKeys) {
    const { q, r } = parseHexKey(k);
    const nbs: string[] = [];
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (coastalKeys.has(nk)) nbs.push(nk);
    }
    adj.set(k, nbs);
  }
  return adj;
}

/** Największy spójny fragment wybrzeża (ocean-facing ring, bez wewnętrznych jezior). */
function largestCoastalComponent(coastalKeys: Set<string>): Set<string> {
  if (coastalKeys.size === 0) return coastalKeys;
  const adj = buildCoastalAdjacency(coastalKeys);
  const visited = new Set<string>();
  let best: string[] = [];
  for (const start of coastalKeys) {
    if (visited.has(start)) continue;
    const comp: string[] = [];
    const queue = [start];
    visited.add(start);
    let qi = 0;
    while (qi < queue.length) {
      const k = queue[qi++]!;
      comp.push(k);
      for (const nb of adj.get(k) ?? []) {
        if (visited.has(nb)) continue;
        visited.add(nb);
        queue.push(nb);
      }
    }
    if (comp.length > best.length) best = comp;
  }
  return new Set(best);
}

/** Heksy wybrzeża pokryte ogonem głównego nurtu (≤1 hex od tail path). */
function coveredCoastalKeysFromMainRivers(
  coastalKeys: Set<string>,
  paths: RiverCoord[][],
  kinds: RiverPathKind[],
  massSet: Set<string>,
  seaDist: Map<string, number>,
): Set<string> {
  const covered = new Set<string>();
  for (let i = 0; i < paths.length; i++) {
    if (kinds[i] !== 'main') continue;
    const path = paths[i] ?? [];
    const tailStart = Math.max(0, path.length - RIVER_MOUTH_TAIL_LEN);
    for (let pi = tailStart; pi < path.length; pi++) {
      const p = path[pi]!;
      const pk = hexKey(p.q, p.r);
      const pd = seaDist.get(pk) ?? 999;
      if (!massSet.has(pk) && pd > 2) continue;
      if (pd > 3) continue;
      for (const ck of coastalKeys) {
        const { q, r } = parseHexKey(ck);
        if (hexDistanceAxial(p.q, p.r, q, r) <= 1) covered.add(ck);
      }
    }
  }
  return covered;
}

/** BFS wzdłuż wybrzeża: odległość (coastal krok) do najbliższego pokrytego ujścia. */
function coastalMouthDistances(
  coastalKeys: Set<string>,
  coveredCoastal: Set<string>,
): Map<string, number> {
  const dist = new Map<string, number>();
  const queue: string[] = [];
  for (const k of coveredCoastal) {
    if (!coastalKeys.has(k)) continue;
    dist.set(k, 0);
    queue.push(k);
  }
  let qi = 0;
  while (qi < queue.length) {
    const k = queue[qi++]!;
    const d = dist.get(k)!;
    const { q, r } = parseHexKey(k);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (!coastalKeys.has(nk) || dist.has(nk)) continue;
      dist.set(nk, d + 1);
      queue.push(nk);
    }
  }
  return dist;
}

function worstCoastalMouthGap(
  coastalKeys: Set<string>,
  mouthDist: Map<string, number>,
): number {
  let worst = 0;
  for (const k of coastalKeys) {
    const d = mouthDist.get(k);
    if (d == null) {
      if (coastalKeys.size > worst) worst = coastalKeys.size;
      continue;
    }
    if (d > worst) worst = d;
  }
  return worst;
}

/** Kandydaci uzupełnienia: najdalsze od istniejących ujść wzdłuż wybrzeża. */
function farthestUncoveredCoastalHexes(
  coastalKeys: Set<string>,
  mouthDist: Map<string, number>,
  limit = 8,
): string[] {
  const ranked = [...coastalKeys]
    .map((k) => ({ k, d: mouthDist.get(k) ?? coastalKeys.size }))
    .sort((a, b) => b.d - a.d || parseHexKey(a.k).q - parseHexKey(b.k).q);
  return ranked.slice(0, limit).map((x) => x.k);
}

/** Bramka regresji: max luka wzdłuż wybrzeża (BFS coastal) między ujściami main na masie. */
export function worstMainRiverCoastMouthGapOnMass(
  massSet: Set<string>,
  hexes: Record<string, Hex>,
  paths: RiverCoord[][],
  kinds: RiverPathKind[],
  _width: number,
  _height: number,
  oceanConnected: Set<string>,
  maxAllowedGap: number,
  seaDist?: Map<string, number>,
): { ok: boolean; worstGap: number } {
  const coastal = largestCoastalComponent(
    collectMassOceanCoastalLandKeys(massSet, hexes, oceanConnected),
  );
  if (coastal.size < 2) return { ok: true, worstGap: 0 };

  const dist = seaDist ?? buildSeaDistanceField(hexes);
  const coveredCoastal = coveredCoastalKeysFromMainRivers(coastal, paths, kinds, massSet, dist);
  const mouthDist = coastalMouthDistances(coastal, coveredCoastal);
  const worst = worstCoastalMouthGap(coastal, mouthDist);
  return { ok: worst <= maxAllowedGap, worstGap: worst };
}

/** Jedna runda top-up: zwraca liczbę nowych main od wybrzeża. */
function topUpMainRiverCoastMouthGapsOnce(
  massSet: Set<string>,
  seaDist: Map<string, number>,
  gridCtx: GridSourcePlaceCtx,
  maxGap: number,
  softAcceptLen?: number,
): number {
  const gapCtx: GridSourcePlaceCtx = { ...gridCtx, allowReliefTraversal: true };
  const coastal = largestCoastalComponent(
    collectMassOceanCoastalLandKeys(massSet, gapCtx.hexes, gapCtx.oceanConnected),
  );
  if (coastal.size < 2) return 0;

  let mainKeys = gapCtx.mainKeysCache
    ?? collectPathHexKeysForKinds(gapCtx.riverPaths, gapCtx.riverKinds, ['main']);

  const gapPathSep = 2;
  const gapPushMain = (path: RiverCoord[], sq: number, sr: number): boolean => {
    if (isPathTooCloseToRiverHexes(path, mainKeys, gapPathSep)) return false;
    const finalized = finalizeMainRiverPath(
      gapCtx.hexes, path, gapCtx.width, gapCtx.height, gapCtx.oceanConnected,
    );
    if (!finalized) return false;
    gapCtx.riverPaths.push(finalized);
    gapCtx.riverKinds.push('main');
    gapCtx.usedSources.add(hexKey(sq, sr));
    markRiverPath(gapCtx.hexes, finalized);
    addPathKeysToSet(finalized, mainKeys);
    if (gapCtx.mainKeysCache && gapCtx.mainKeysCache !== mainKeys) {
      addPathKeysToSet(finalized, gapCtx.mainKeysCache);
    }
    return true;
  };
  gapCtx.pushMain = gapPushMain;

  const tryAtKey = (k: string): boolean => {
    const { q, r } = parseHexKey(k);
    const tryCoords: Array<[number, number]> = [[q, r]];
    for (const [dq, dr] of HEX_DIRECTIONS) tryCoords.push([q + dq, r + dr]);
    for (const [nq, nr] of tryCoords) {
      const d = seaDist.get(hexKey(nq, nr)) ?? 999;
      if (d < 1 || d > 2) continue;
      if (tryPlaceMainRiverAtMouth(gapCtx, nq, nr, mainKeys, softAcceptLen, gapPathSep)) {
        mainKeys = gapCtx.mainKeysCache
          ?? collectPathHexKeysForKinds(gapCtx.riverPaths, gapCtx.riverKinds, ['main']);
        return true;
      }
    }
    return false;
  };

  let placed = 0;
  for (let attempt = 0; attempt < 80; attempt++) {
    const coveredCoastalNow = coveredCoastalKeysFromMainRivers(
      coastal, gapCtx.riverPaths, gapCtx.riverKinds, massSet, seaDist,
    );
    const mouthDistNow = coastalMouthDistances(coastal, coveredCoastalNow);
    if (worstCoastalMouthGap(coastal, mouthDistNow) <= maxGap) break;
    const picks = farthestUncoveredCoastalHexes(coastal, mouthDistNow, 16);
    let okPlace = false;
    for (const pick of picks) {
      if (tryAtKey(pick)) { okPlace = true; break; }
    }
    if (!okPlace) {
      const allFar = [...coastal]
        .map((k) => ({ k, d: mouthDistNow.get(k) ?? coastal.size }))
        .filter((x) => x.d > maxGap)
        .sort((a, b) => b.d - a.d || parseHexKey(a.k).q - parseHexKey(b.k).q);
      for (const { k } of allFar) {
        if (tryAtKey(k)) { okPlace = true; break; }
      }
    }
    if (!okPlace) break;
    placed++;
  }
  return placed;
}

/** Etap 1 — domknięcie luk wzdłuż wybrzeża: max gap między ujściami main (FALA 170). */
function topUpMainRiverCoastMouthGaps(
  massSet: Set<string>,
  seaDist: Map<string, number>,
  gridCtx: GridSourcePlaceCtx,
  maxGap: number,
  softAcceptLen?: number,
): number {
  let placed = 0;
  const gapAcceptLen = Math.max(2, softAcceptLen ?? 3);
  for (let round = 0; round < 48; round++) {
    const roundPlaced = topUpMainRiverCoastMouthGapsOnce(
      massSet, seaDist, gridCtx, maxGap, gapAcceptLen,
    );
    placed += roundPlaced;
    if (roundPlaced === 0) break;
    const check = worstMainRiverCoastMouthGapOnMass(
      massSet,
      gridCtx.hexes,
      gridCtx.riverPaths,
      gridCtx.riverKinds,
      gridCtx.width,
      gridCtx.height,
      gridCtx.oceanConnected,
      maxGap,
      seaDist,
    );
    if (check.ok) break;
  }
  return placed;
}

/**
 * Domknięcie luk ujść main po flattenFalseCoastalRiverNotches (FALA 171).
 * flatten może rozluźnić pierścień wybrzeża — top-up w generateRivers jest za wcześnie.
 */
export function refillMainRiverCoastMouthGapsOnMap(
  hexes: Record<string, Hex>,
  width: number,
  height: number,
  riverPaths: RiverCoord[][],
  riverKinds: RiverPathKind[],
  rand: () => number,
  riverParams: RiverMapParams,
  minLen?: number,
): number {
  const { seaDist, oceanConnected, openOceanDist } = buildRiverFieldCache(hexes, width, height);
  const masses = groupLandMassKeys(hexes)
    .filter((m) => m.length >= 5)
    .sort((a, b) => b.length - a.length);
  const riverPerf = buildRiverPerfCtx(masses, riverParams.areaScale);
  const catalogMinLen = minLen ?? riverParams.minLen;
  const maxLen = riverParams.maxLen;
  const usedSources = new Set<string>();
  const mainKeysCache = collectPathHexKeysForKinds(riverPaths, riverKinds, ['main']);

  const pushMain = (path: RiverCoord[], sq: number, sr: number): boolean => {
    if (isPathTooCloseToRiverHexes(path, mainKeysCache, MAIN_RIVER_MIN_PATH_SEP)) return false;
    const finalized = finalizeMainRiverPath(hexes, path, width, height, oceanConnected);
    if (!finalized) return false;
    riverPaths.push(finalized);
    riverKinds.push('main');
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, finalized);
    addPathKeysToSet(finalized, mainKeysCache);
    return true;
  };

  const gridCtx: GridSourcePlaceCtx = {
    hexes,
    width,
    height,
    riverPaths,
    riverKinds,
    usedSources,
    seaDist,
    openOceanDist,
    oceanConnected,
    rand,
    minLen: catalogMinLen,
    maxLen,
    acceptLen: riverParams.gridTraceMinLen,
    sourceSep: Math.max(2, Math.floor(riverParams.mainCell * 0.25)),
    traceMinLen: riverParams.gridTraceMinLen,
    traceOptsBase: {
      hardMeanderLen: riverParams.hardMeanderLen,
      mouthTailLen: riverParams.mouthTailLen,
    },
    seaBufferOpts: {
      minInland: riverParams.minInlandFromSea,
      mouthTail: riverParams.mouthTailLen,
    },
    pushMain,
    pushTributary: () => false,
    pangeaSingleMass: riverPerf.pangeaSingleMass,
    largeMapPerf: riverPerf.largeMapPerf,
    mainKeysCache,
    allowReliefTraversal: true,
    placeMode: 'main-only',
  };

  const maxGap = mainRiverCoastMouthMaxGapForDims(width, height);
  let placed = 0;
  for (const mass of masses) {
    const massSet = new Set(mass);
    setMassRiverTargets(hexes, massSet, gridCtx);
    placed += topUpMainRiverCoastMouthGaps(
      massSet,
      seaDist,
      gridCtx,
      maxGap,
      2,
    );
  }
  return placed;
}

function setMassRiverTargets(
  hexes: Record<string, Hex>,
  massSet: Set<string>,
  ctx: GridSourcePlaceCtx,
): void {
  ctx.massCentroid = computeLandMassCentroid(hexes, massSet);
  ctx.massCenterSquare = continentCenterSquare(hexes, massSet);
}

/** Kandydaci ujść na brzegu komórki (seaDist 1–2, ląd rzeczny). */
function collectCoastMouthCandidates(
  cells: Array<[number, number]>,
  hexes: Record<string, Hex>,
  seaDist: Map<string, number>,
  maxSeaDist = 2,
): Array<{ q: number; r: number; d: number }> {
  const out: Array<{ q: number; r: number; d: number }> = [];
  for (const [q, r] of cells) {
    const h = hexes[hexKey(q, r)];
    if (!h || !isRiverLandTerrain(h.terenBazowy)) continue;
    const d = seaDist.get(hexKey(q, r)) ?? 999;
    if (d < 1 || d > maxSeaDist) continue;
    out.push({ q, r, d });
  }
  return out;
}

/** Etap 1: główny nurt od konkretnego ujścia przy brzegu w głąb lądu. */
function tryPlaceMainRiverAtMouth(
  ctx: GridSourcePlaceCtx,
  mq: number,
  mr: number,
  mainKeys: Set<string>,
  softAcceptLen?: number,
  pathSep = MAIN_RIVER_MIN_PATH_SEP,
): boolean {
  const targetLen = ctx.minLen;
  const acceptThreshold = softAcceptLen != null && softAcceptLen < targetLen
    ? softAcceptLen
    : targetLen;
  const mouthKey = hexKey(mq, mr);
  const startD = ctx.seaDist.get(mouthKey);
  if (startD == null || startD < 1 || startD > 2) return false;

  const traceMax = riverTraceBudgetForSeaDist(startD, targetLen, ctx.maxLen, ctx.largeMapPerf);
  const path = traceRiverFromCoast(
    ctx.hexes, mq, mr, Math.max(traceMax, ctx.maxLen),
    {
      seaDist: ctx.seaDist,
      openOceanDist: ctx.openOceanDist,
      oceanConnected: ctx.oceanConnected,
      mapWidth: ctx.width,
      mapHeight: ctx.height,
      rand: ctx.rand,
      minLen: targetLen,
      blockRiverKeys: mainKeys,
      minPathSep: pathSep,
      landCentroid: ctx.massCentroid ?? null,
      landCenterSquare: ctx.massCenterSquare ?? null,
      ...ctx.traceOptsBase,
      allowReliefTraversal: ctx.allowReliefTraversal,
    },
  );
  if (path.length < acceptThreshold) return false;
  if (isPathTooCloseToRiverHexes(path, mainKeys, pathSep)) return false;
  const sq = path[0]!.q;
  const sr = path[0]!.r;
  if (ctx.pushMain(path, sq, sr)) {
    addPathKeysToSet(path, mainKeys);
    if (ctx.mainKeysCache && ctx.mainKeysCache !== mainKeys) {
      addPathKeysToSet(path, ctx.mainKeysCache);
    }
    return true;
  }
  return false;
}

/** Etap 1: główny nurt od ujścia przy brzegu w głąb lądu (Maciej 2026-08-01). */
function tryPlaceMainRiverFromCoast(
  ctx: GridSourcePlaceCtx,
  land: Array<[number, number]>,
  massSet: Set<string>,
  mainKeysCache?: Set<string>,
  softAcceptLen?: number,
): boolean {
  const mainKeys = mainKeysCache ?? ctx.mainKeysCache
    ?? collectPathHexKeysForKinds(ctx.riverPaths, ctx.riverKinds, ['main']);
  const mouths = collectCoastMouthCandidates(land, ctx.hexes, ctx.seaDist, 2);
  if (!ctx.pangeaSingleMass) {
    for (const [q, r] of expandRiverSourceCandidates(land, massSet, 2)) {
      const h = ctx.hexes[hexKey(q, r)];
      if (!h || !isRiverLandTerrain(h.terenBazowy)) continue;
      const d = ctx.seaDist.get(hexKey(q, r)) ?? 999;
      if (d >= 1 && d <= 2) mouths.push({ q, r, d });
    }
  }
  mouths.sort((a, b) => a.d - b.d || ctx.rand() * 2 - 1);

  const seen = new Set<string>();
  const mouthLimit = ctx.pangeaSingleMass
    ? (ctx.largeMapPerf ? 24 : 12)
    : ctx.largeMapPerf ? 8 : mouths.length;
  for (const mouth of mouths.slice(0, mouthLimit)) {
    const mk = hexKey(mouth.q, mouth.r);
    if (seen.has(mk)) continue;
    seen.add(mk);
    if (tryPlaceMainRiverAtMouth(ctx, mouth.q, mouth.r, mainKeys, softAcceptLen)) {
      return true;
    }
  }
  return false;
}

function tryPlaceGridSource(ctx: GridSourcePlaceCtx, sq: number, sr: number, massSet?: Set<string>): boolean {
  const srcKey = hexKey(sq, sr);
  if (ctx.usedSources.has(srcKey)) return false;
  if (isTooCloseToRiverSource(sq, sr, ctx.usedSources, ctx.sourceSep)) return false;

  const h = ctx.hexes[srcKey];
  if (!h || !isRiverLandTerrain(h.terenBazowy)) return false;

  const mode = ctx.placeMode ?? 'auto';
  if (mode === 'short') {
    const mediumKeys = collectPathHexKeysForKinds(ctx.riverPaths, ctx.riverKinds, ['medium']);
    if (mediumKeys.size === 0) return false;
    const dist = nearestRiverHexDistance(sq, sr, mediumKeys);
    if (dist > SHORT_RIVER_MAX_DIST_FROM_MEDIUM) return false;
  }

  const startSeaDist = ctx.seaDist.get(srcKey) ?? 999;
  const riverKeys = new Set(
    [...collectRiverPathHexKeys(ctx.riverPaths)].filter((k) => !massSet || massSet.has(k)),
  );
  const nearestRiverDist = nearestRiverHexDistance(sq, sr, riverKeys);
  const candidates = buildGridRouteCandidates(ctx, sq, sr, massSet);

  let chosen: GridRouteCandidate | null = null;
  if (mode === 'main-only') {
    chosen = candidates.filter((c) => c.kind === 'main').reduce(
      (a, b) => (a && a.len >= b.len ? a : b), null as GridRouteCandidate | null,
    );
  } else if (mode === 'medium') {
    chosen = pickPhase2Route(candidates);
  } else if (mode === 'short') {
    chosen = candidates.filter((c) => c.kind === 'tributary').reduce(
      (a, b) => (a && a.len >= b.len ? a : b), null as GridRouteCandidate | null,
    );
  } else {
    chosen = pickGeographicLongestRoute(candidates, startSeaDist, nearestRiverDist);
  }
  if (!chosen) return false;

  if (chosen.kind === 'main') return ctx.pushMain(chosen.path, sq, sr);
  if (mode === 'medium' && ctx.pushMedium) return ctx.pushMedium(chosen.path, sq, sr);
  if (mode === 'short' && ctx.pushShort) return ctx.pushShort(chosen.path, sq, sr);
  return ctx.pushTributary(chosen.path, sq, sr);
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
  if (minSep <= 0) return false;
  for (const sk of usedSources) {
    const { q, r } = parseHexKey(sk);
    if (hexAxialDistance(q, r, sq, sr) < minSep) return true;
  }
  return false;
}

export function minLandHexesForRiverCell(cellSize: number): number {
  return Math.max(3, Math.floor(cellSize * 0.2));
}

/** Max odległość (hex BFS) ląd→rzeka — gwarancja pokrycia (Maciej 2026-08-01). */
export const RIVER_PROXIMITY_MAX_DIST = 5;

export function riverProximityMaxDist(cellSize: number): number {
  return Math.max(RIVER_PROXIMITY_MAX_DIST, Math.ceil(cellSize / 2));
}

/** Cel domykania proximity w topUp — zgodny z progiem testu river-grid-coverage. */
function riverProximityEnforceTarget(cellSize: number): number {
  const proxLimit = riverProximityMaxDist(cellSize);
  return Math.min(proxLimit + 5, Math.max(proxLimit, Math.ceil(cellSize * 2)));
}

/** Budżet trasowania A* skalowany z odległością od morza (duże kontynenty). */
function riverTraceBudgetForSeaDist(
  startSeaDist: number,
  minLen: number,
  maxLen: number,
  largeMapPerf = false,
): number {
  const raw = Math.max(maxLen, minLen + 24, Math.ceil(startSeaDist * 3) + minLen);
  const inlandBonus = Math.min(16, Math.floor(startSeaDist / 3));
  if (!largeMapPerf) return raw + inlandBonus;
  // FALA 171/172: nie ścinaj poniżej maxLen — inland growth do sep/maxLen; +bonus na dużych masach.
  return Math.max(maxLen, Math.min(raw, maxLen + Math.ceil(startSeaDist * 2) + 24)) + inlandBonus;
}

/** Pangea = dokładnie jedna masa lądu — bloker czasu (Maciej 2026-08-01). */
function isPangeaSingleMass(masses: string[][]): boolean {
  return masses.length === 1;
}

type RiverRoundProfile = 'normal' | 'large-map' | 'huge-mass' | 'pangea';

/** Kontekst perf rzek — profil po rozmiarze mapy i lądu, nie tylko Pangea (Maciej 2026-08-01). */
interface RiverPerfCtx {
  pangeaSingleMass: boolean;
  largeMapPerf: boolean;
  totalLandHexes: number;
  maxMassSize: number;
}

function buildRiverPerfCtx(masses: string[][], areaScale: number): RiverPerfCtx {
  let totalLandHexes = 0;
  let maxMassSize = 0;
  for (const m of masses) {
    totalLandHexes += m.length;
    if (m.length > maxMassSize) maxMassSize = m.length;
  }
  return {
    pangeaSingleMass: isPangeaSingleMass(masses),
    largeMapPerf: areaScale >= 1.35,
    totalLandHexes,
    maxMassSize,
  };
}

/** Duży kontynent na mapie Duży — jedna masa ≥ tego progu (hex lądu). */
const HUGE_LAND_MASS_HEXES = 4800;
/** Próg łącznego lądu na mapie Duży — profil huge-mass nawet przy wielu masach. */
const LARGE_MAP_TOTAL_LAND_HEXES = 5000;
/** Próg masy na mapie Duży — profil large-map dla mniejszych wysp/kontynentów. */
const LARGE_MAP_MASS_HEXES = 800;

function riverRoundProfile(massSize: number, perf: RiverPerfCtx): RiverRoundProfile {
  if (perf.pangeaSingleMass) return 'pangea';
  if (massSize >= HUGE_LAND_MASS_HEXES) return 'huge-mass';
  if (perf.largeMapPerf) {
    if (massSize >= 2000 || perf.totalLandHexes >= LARGE_MAP_TOTAL_LAND_HEXES) return 'huge-mass';
    if (massSize >= LARGE_MAP_MASS_HEXES) return 'large-map';
    return 'large-map';
  }
  return 'normal';
}

function idleBreakLimit(profile: RiverRoundProfile, massSize: number): number {
  if (profile === 'pangea') return 1;
  if (profile === 'huge-mass') return 2;
  if (profile === 'large-map') return 2;
  return massSize >= HUGE_LAND_MASS_HEXES ? 3 : 999;
}

/** Ile rund domykania siatki na masę lądu (więcej na dużych kontynentach). */
function massRiverCoveragePasses(massSize: number, profile: RiverRoundProfile = 'normal'): number {
  const base = Math.max(6, Math.min(24, 6 + Math.floor(Math.sqrt(massSize / 300))));
  if (profile === 'normal') return base;
  if (profile === 'large-map') {
    return Math.max(3, Math.min(8, 3 + Math.floor(Math.sqrt(massSize / 700))));
  }
  if (profile === 'huge-mass') {
    return Math.max(2, Math.min(5, 2 + Math.floor(Math.sqrt(massSize / 1200))));
  }
  // Pangea: więcej rund domykania siatki — bez cięcia do 1× (Super Huge pokrycie).
  if (profile === 'pangea') {
    return Math.max(3, Math.min(8, 3 + Math.floor(Math.sqrt(massSize / 6000))));
  }
  return Math.max(2, Math.min(4, 2 + Math.floor(Math.sqrt(massSize / 2500))));
}

function riverProximityMaxRounds(massSize: number, profile: RiverRoundProfile = 'normal'): number {
  const base = Math.max(16, Math.min(48, 12 + Math.floor(massSize / 350)));
  if (profile === 'normal') return Math.min(52, base + 6);
  if (profile === 'large-map') {
    return Math.max(6, Math.min(14, 6 + Math.floor(massSize / 1200)));
  }
  if (profile === 'huge-mass') {
    return Math.max(6, Math.min(12, 6 + Math.floor(massSize / 2000)));
  }
  return Math.max(3, Math.min(6, 3 + Math.floor(massSize / 4000)));
}

function effectiveTopUpPasses(
  basePasses: number,
  perf: RiverPerfCtx,
): number {
  if (perf.pangeaSingleMass) return Math.max(3, Math.min(basePasses, 8));
  if (perf.largeMapPerf) return Math.max(2, Math.min(basePasses, 6));
  return basePasses;
}

function effectiveFeederPasses(
  basePasses: number,
  perf: RiverPerfCtx,
): number {
  if (perf.pangeaSingleMass) return Math.min(2, basePasses);
  if (perf.largeMapPerf) return Math.min(3, basePasses);
  return basePasses;
}

/** Pangea / Duży — agresywne cięcia perf (Maciej 2026-08-01). */
function riverAggressivePerf(perf: RiverPerfCtx): boolean {
  return perf.pangeaSingleMass || perf.largeMapPerf;
}

/** Pangea etap 1: bootstrap ujść — bez twardego limitu liczby (Maciej 2026-08-02). */
function pangeaBootstrapRiverTarget(areaScale: number, landHexCount = 0): number {
  const fromArea = Math.round(18 + areaScale * 18);
  const landDivisor = Math.max(450, Math.round(650 - areaScale * 40));
  const fromLand = landHexCount > 0 ? Math.round(landHexCount / landDivisor) : 0;
  // Soft hint tylko dla kolejności bootstrapu — wołający może siewić dalej bez cap.
  return Math.max(22, Math.max(fromArea, fromLand));
}

/** Ile komórek siatki sparse przetworzyć na Pangea — bez limitu (Maciej: siej aż się da). */
function pangeaMaxGridCellsToProcess(
  _massSet: Set<string>,
  _cellSize: number,
  _gridStride: number,
  _areaScale: number,
): number {
  return Number.POSITIVE_INFINITY;
}

/** Max kolejnych porażek bootstrap — skala z mapą (nie stałe 10 na SH). */
function pangeaBootstrapMaxConsecutiveFails(areaScale: number): number {
  return Math.max(10, Math.min(40, Math.round(10 + areaScale * 6)));
}

/** Min. odstęp ujść bootstrap — luźniejszy na dużych mapach (więcej startów przy brzegu). */
function pangeaBootstrapMouthMinSep(width: number, height: number): number {
  const areaScale = riverMapAreaScale(width, height);
  if (areaScale >= 3.5) return 5;
  if (areaScale >= 2) return 6;
  return 8;
}

/** FALA 199: dłuższy wzrost rzek od brzegu na Pangea (maxLen sam w sobie za krótki na interior). */
function pangeaCoastRiverGrowthCap(baseMaxLen: number, minDim: number): number {
  return Math.min(
    Math.floor(minDim * 0.62),
    Math.max(baseMaxLen, Math.round(baseMaxLen * 1.85)),
  );
}

/** Średni seaDist komórki siatki rzek. */
function riverGridCellAvgSeaDist(
  cells: Array<[number, number]>,
  seaDist: Map<string, number>,
): number {
  if (cells.length === 0) return 0;
  let s = 0;
  for (const [q, r] of cells) s += seaDist.get(hexKey(q, r)) ?? 0;
  return s / cells.length;
}

/**
 * FALA 199: głęboki interior Pangei — źródła inland→morze (traceRiver), bo coast→inland
 * nie dochodzi do środka przy dużych masach.
 */
function ensurePangeaInteriorMainRivers(
  hexes: Record<string, Hex>,
  massSet: Set<string>,
  seaDist: Map<string, number>,
  gridCtx: GridSourcePlaceCtx,
  riverParams: RiverMapParams,
  baseMaxLen: number,
  onAttempt?: () => void,
): number {
  const interiorMinSea = Math.max(18, Math.round(riverParams.minDim * 0.14));
  const cellSize = riverParams.mainCell;
  const minLand = minLandHexesForRiverCell(cellSize);
  const growthCap = pangeaCoastRiverGrowthCap(baseMaxLen, riverParams.minDim);

  const cellList = [...landHexesByCoverageCell(massSet, cellSize).values()]
    .filter((land) => land.length >= minLand)
    .filter((land) => !cellHasRiverHex(land, hexes))
    .filter((land) => riverGridCellAvgSeaDist(land, seaDist) >= interiorMinSea)
    .sort((a, b) => riverGridCellAvgSeaDist(b, seaDist) - riverGridCellAvgSeaDist(a, seaDist));

  const maxCells = Math.max(28, Math.min(160, Math.round(cellList.length * 0.42)));
  let placed = 0;

  for (const land of cellList.slice(0, maxCells)) {
    onAttempt?.();
    const ranked = land
      .filter(([q, r]) => !gridCtx.usedSources.has(hexKey(q, r)))
      .map(([q, r]) => {
        const h = hexes[hexKey(q, r)];
        const d = seaDist.get(hexKey(q, r)) ?? 0;
        let score = d + gridCtx.rand() * 3;
        if (h && isReliefRiverSource(h.terenBazowy)) score += 24;
        else if (h && isRiverLandTerrain(h.terenBazowy)) score += 8;
        return { q, r, d, score };
      })
      .filter((c) => c.d >= interiorMinSea && isRiverLandTerrain(hexes[hexKey(c.q, c.r)]?.terenBazowy ?? TerenBazowy.Morze))
      .sort((a, b) => b.score - a.score);

    for (const c of ranked.slice(0, 10)) {
      const traceMax = Math.min(
        growthCap + Math.ceil(c.d * 0.35),
        Math.floor(riverParams.minDim * 0.72),
      );
      const path = traceRiver(hexes, c.q, c.r, traceMax, {
        seaDist: gridCtx.seaDist,
        openOceanDist: gridCtx.openOceanDist,
        oceanConnected: gridCtx.oceanConnected,
        mapWidth: gridCtx.width,
        mapHeight: gridCtx.height,
        rand: gridCtx.rand,
        minLen: Math.max(3, gridCtx.traceMinLen - 1),
        blockRiverKeys: gridCtx.mainKeysCache,
        minPathSep: MAIN_RIVER_MIN_PATH_SEP,
        riverSepIndex: gridCtx.riverSepIndex,
        landCentroid: gridCtx.massCentroid ?? null,
        landCenterSquare: gridCtx.massCenterSquare ?? null,
        allowReliefTraversal: true,
        ...gridCtx.traceOptsBase,
      });
      if (path.length < gridCtx.traceMinLen) continue;
      if (gridCtx.pushMain(path, c.q, c.r)) {
        placed++;
        if (gridCtx.mainKeysCache) addPathKeysToSet(path, gridCtx.mainKeysCache);
        break;
      }
    }
  }
  return placed;
}

function addPathKeysToSet(path: RiverCoord[], keys: Set<string>): void {
  for (const p of path) keys.add(hexKey(p.q, p.r));
}

function dryPatchEnforceMaxRounds(profile: RiverRoundProfile): number {
  if (profile === 'pangea') return 4;
  if (profile === 'huge-mass') return 6;
  if (profile === 'large-map') return 8;
  return 28;
}

function proximityMopRounds(profile: RiverRoundProfile): number {
  if (profile === 'pangea') return 1;
  if (profile === 'huge-mass') return 1;
  if (profile === 'large-map') return 3;
  return 8;
}

/** Komórka siatki kwalifikuje się do rzeki — bez górnego limitu seaDist (głęboki inland OK). */
function cellEligibleForRiverPlacement(
  land: Array<[number, number]>,
  seaDist: Map<string, number>,
  minInland = 2,
): boolean {
  return land.some(([q, r]) => (seaDist.get(hexKey(q, r)) ?? 0) >= minInland);
}

/** Ląd liczony w metryce bliskości rzeki (niziny + wybrzeże w masie lądu). */
function isRiverProximityWalkTerrain(t: TerenBazowy): boolean {
  return isRiverLandTerrain(t) || t === TerenBazowy.PlytkieMorze;
}

/** Multi-source BFS od sieci rzek — O(land) zamiast O(land²) na Pangei. */
function computeRiverProximityStats(
  massSet: Set<string>,
  hexes: Record<string, Hex>,
  allowReliefTraversal = true,
): { maxDist: number; farthest: { q: number; r: number; dist: number } | null } {
  const riverKeys = new Set<string>();
  for (const k of massSet) {
    if (hexes[k]?.rzeka?.obecna) riverKeys.add(k);
  }
  if (riverKeys.size === 0) return { maxDist: 999, farthest: null };

  const distToRiver = new Map<string, number>();
  const queue: string[] = [];
  for (const k of riverKeys) {
    distToRiver.set(k, 0);
    queue.push(k);
  }

  let qi = 0;
  while (qi < queue.length) {
    const k = queue[qi++]!;
    const d = distToRiver.get(k)!;
    const { q, r } = parseHexKey(k);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (distToRiver.has(nk)) continue;
      if (!massSet.has(nk)) continue;
      const nh = hexes[nk];
      if (!nh || !isRiverProximityWalkTerrain(nh.terenBazowy)) continue;
      if (!allowReliefTraversal && isReliefTerrain(nh.terenBazowy)) continue;
      distToRiver.set(nk, d + 1);
      queue.push(nk);
    }
  }

  let maxD = 0;
  let farthest: { q: number; r: number; dist: number } | null = null;
  for (const k of massSet) {
    const h = hexes[k];
    if (!h || !isRiverProximityWalkTerrain(h.terenBazowy)) continue;
    if (isReliefTerrain(h.terenBazowy)) continue;
    const dist = distToRiver.get(k);
    if (dist == null) continue;
    const { q, r } = parseHexKey(k);
    const effective = dist === 0 && riverKeys.has(k) ? 1 : dist;
    if (effective > maxD) {
      maxD = effective;
      farthest = { q, r, dist: effective };
    }
  }
  return { maxDist: maxD, farthest };
}

/** Najdalszy heks lądu od najbliższej rzeki (BFS po suchym lądzie + wybrzeżu w masie). */
export function maxLandHexDistanceToRiver(
  massLandKeys: Iterable<string>,
  hexes: Record<string, Hex>,
  allowReliefTraversal = true,
): number {
  const massSet = massLandKeys instanceof Set ? massLandKeys : new Set(massLandKeys);
  return computeRiverProximityStats(massSet, hexes, allowReliefTraversal).maxDist;
}

/** Heks lądu najdalej od sieci rzek (do force-fill interioru dużych kontynentów). */
function findFarthestLandFromRiver(
  massSet: Set<string>,
  hexes: Record<string, Hex>,
): { q: number; r: number; dist: number } | null {
  return computeRiverProximityStats(massSet, hexes, true).farthest;
}

/** Próbuje rozbić duży suchy płat kilkoma krótkimi dopływami. */
function trySubdivideDryPatch(
  ctx: GridSourcePlaceCtx,
  component: Array<[number, number]>,
  massSet: Set<string>,
): boolean {
  if (RIVER_PROFILE_ON) rpEnsure().forceFillCalls++;
  const step = Math.max(3, Math.floor(Math.sqrt(component.length) / 2));
  const ranked = component
    .map(([q, r]) => ({ q, r, d: ctx.seaDist.get(hexKey(q, r)) ?? 0 }))
    .sort((a, b) => b.d - a.d);
  for (let i = 0; i < ranked.length; i += step) {
    const c = ranked[i]!;
    if (tryForceCellRiverConnection(ctx, [[c.q, c.r]], massSet)) return true;
    if (tryPlaceGridSource(ctx, c.q, c.r, massSet)) return true;
  }
  return false;
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
      const reachable = land.some(([q, r]) => (seaDist.get(hexKey(q, r)) ?? 0) >= 2);
      if (!reachable) continue;
    }
    if (hexes) {
      if (!cellHasRiverHex(land, hexes)) return false;
    } else if (!cellHasRiverSourceInCell(land, riverPaths)) {
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
  minInlandCell?: number,
): number {
  const pathKinds = kinds ?? riverPaths.map(() => 'main' as RiverPathKind);
  const massSet = new Set(massLandKeys);
  const minLand = minLandHexesForRiverCell(cellSize);
  const minInland = minInlandCell ?? Math.max(8, Math.floor(minRiverLen * 0.45));
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
    else if (cellHasRiverSourceInCell(land, riverPaths)) hit++;
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

/** BFS po suchym lądzie — najbliższy heks istniejącej rzeki w masie lądu. */
function bfsNearestRiverHexOnLowland(
  hexes: Record<string, Hex>,
  sq: number,
  sr: number,
  riverKeys: Set<string>,
  massSet: Set<string>,
  maxDist: number,
  allowReliefTraversal = false,
): { q: number; r: number; dist: number } | null {
  const startK = hexKey(sq, sr);
  const queue: Array<[number, number, number]> = [[sq, sr, 0]];
  const visited = new Set<string>([startK]);
  while (queue.length > 0) {
    const [q, r, d] = queue.shift()!;
    const k = hexKey(q, r);
    if (riverKeys.has(k) && d > 0) return { q, r, dist: d };
    if (d >= maxDist) continue;
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nq = q + dq;
      const nr = r + dr;
      const nk = hexKey(nq, nr);
      if (visited.has(nk) || !massSet.has(nk)) continue;
      const nh = hexes[nk];
      if (!nh) continue;
      const walkable = isRiverLandTerrain(nh.terenBazowy)
        || (allowReliefTraversal && nh.terenBazowy === TerenBazowy.PlytkieMorze);
      if (!walkable) continue;
      if (!allowReliefTraversal && isReliefTerrain(nh.terenBazowy)) continue;
      visited.add(nk);
      queue.push([nq, nr, d + 1]);
    }
  }
  return null;
}

/** Prosta ścieżka BFS po suchym lądzie (gdy A* nie przebija się przez relief). */
function bfsLowlandRiverPath(
  hexes: Record<string, Hex>,
  sq: number,
  sr: number,
  tq: number,
  tr: number,
  massSet: Set<string>,
  maxLen: number,
  allowReliefTraversal = false,
): RiverCoord[] {
  const startK = hexKey(sq, sr);
  const targetK = hexKey(tq, tr);
  if (startK === targetK) return [{ q: sq, r: sr }];
  const cameFrom = new Map<string, string>();
  const queue: string[] = [startK];
  const visited = new Set<string>([startK]);
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === targetK) {
      const path: RiverCoord[] = [];
      let cur: string | undefined = current;
      while (cur) {
        const { q, r } = parseHexKey(cur);
        path.push({ q, r });
        cur = cameFrom.get(cur);
      }
      path.reverse();
      return path.length <= maxLen ? path : path.slice(0, maxLen);
    }
    if (visited.size > maxLen + 4) break;
    const { q, r } = parseHexKey(current);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (visited.has(nk) || !massSet.has(nk)) continue;
      const nh = hexes[nk];
      if (!nh || !isRiverLandTerrain(nh.terenBazowy)) continue;
      if (!allowReliefTraversal && isReliefTerrain(nh.terenBazowy) && nk !== targetK) continue;
      visited.add(nk);
      cameFrom.set(nk, current);
      queue.push(nk);
    }
  }
  return [];
}

/**
 * Ostatnia deska ratunku: komórka bez startu → dopływ BFS/A* do najbliższej rzeki w sieci.
 */
function tryForceCellRiverConnection(
  ctx: GridSourcePlaceCtx,
  land: Array<[number, number]>,
  massSet: Set<string>,
): boolean {
  if (RIVER_PROFILE_ON) rpEnsure().forceFillCalls++;
  const riverKeys = new Set(
    [...collectRiverPathHexKeys(ctx.riverPaths)].filter((k) => massSet.has(k)),
  );
  if (riverKeys.size === 0) return false;

  const lowland = land
    .filter(([q, r]) => {
      const k = hexKey(q, r);
      if (ctx.usedSources.has(k)) return false;
      const h = ctx.hexes[k];
      return h && isDryLandWithoutRiver(h);
    })
    .map(([q, r]) => ({
      q,
      r,
      d: ctx.seaDist.get(hexKey(q, r)) ?? 0,
      tie: ctx.rand(),
    }))
    .sort((a, b) => b.d - a.d || a.tie - b.tie);

  let bestSrc: [number, number] | null = null;
  let bestTarget: [number, number] | null = null;
  let bestDist = Infinity;
  const allowRelief = ctx.allowReliefTraversal ?? true;

  for (const c of lowland.slice(0, 16)) {
    const near = bfsNearestRiverHexOnLowland(
      ctx.hexes, c.q, c.r, riverKeys, massSet, Math.max(80, ctx.maxLen + 24), allowRelief,
    );
    if (!near || near.dist >= bestDist) continue;
    bestDist = near.dist;
    bestSrc = [c.q, c.r];
    bestTarget = [near.q, near.r];
  }

  const maxBfsDist = Math.max(100, Math.ceil(Math.sqrt(land.length) * 4) + 16);
  if (!bestSrc || !bestTarget || bestDist > maxBfsDist) return false;

  const [sq, sr] = bestSrc;
  const [tq, tr] = bestTarget;
  const srcKey = hexKey(sq, sr);
  const traceBudget = Math.max(ctx.maxLen, Math.ceil(bestDist * 1.5) + 12);

  let path = aStarRiverToTarget(ctx.hexes, sq, sr, tq, tr, traceBudget, srcKey, allowRelief);
  if (path.length < 3) {
    path = bfsLowlandRiverPath(ctx.hexes, sq, sr, tq, tr, massSet, traceBudget, allowRelief);
  }
  if (path.length < 3) return false;

  const forceCtx: GridSourcePlaceCtx = { ...ctx, acceptLen: 3, sourceSep: 0, allowReliefTraversal: allowRelief };
  const reached = buildOceanReachableRiverHexKeys(
    ctx.hexes, ctx.riverPaths, ctx.riverKinds, ctx.width, ctx.height, ctx.oceanConnected,
  );
  if (tributaryTouchesOceanReachable(path, reached) && forceCtx.pushMedium?.(path, sq, sr)) return true;
  if (forceCtx.pushShort?.(path, sq, sr)) return true;
  if (forceCtx.pushTributary(path, sq, sr)) return true;

  const startSeaDist = ctx.seaDist.get(srcKey) ?? 0;
  const traceMax = riverTraceBudgetForSeaDist(startSeaDist, ctx.minLen, ctx.maxLen, ctx.largeMapPerf);
  const seaPath = traceRiverForGridFill(
    ctx.hexes, sq, sr, traceMax, ctx.minLen, 3,
    {
      seaDist: ctx.seaDist,
      openOceanDist: ctx.openOceanDist,
      oceanConnected: ctx.oceanConnected,
      mapWidth: ctx.width,
      mapHeight: ctx.height,
      rand: ctx.rand,
      ...ctx.traceOptsBase,
      allowReliefTraversal: allowRelief,
      relaxSeaBuffer: true,
    },
    true,
  );
  if (seaPath.length >= 3 && forceCtx.pushMain?.(seaPath, sq, sr)) return true;
  if (
    seaPath.length >= 3
    && pathHasValidRiverOutlet(ctx.hexes, seaPath, ctx.riverPaths, ctx.riverKinds, ctx.width, ctx.height)
    && forceCtx.pushMedium?.(seaPath, sq, sr)
  ) return true;
  return false;
}

/** Maciej 2026-08-01: max spójny płat suchego lądu bez rzeki = 5×5 hexów (siatka tier medium). */
export const MAX_DRY_LOWLAND_PATCH_HEXES = 25;

/** Suchy ląd bez rzeki — relief (wzgórza/góry) NIE rozdziela płata w fill, ale nie liczy się do metryki nizin. */
function isDryLandWithoutRiver(hex: Hex | undefined): boolean {
  return !!hex && isRiverLandTerrain(hex.terenBazowy) && hex.rzeka?.obecna !== true;
}

/** Suchy płat nizinny bez rzeki (metryka fair play — bez gór/wzgórz). */
function isDryLowlandPatchHex(hex: Hex | undefined): boolean {
  return !!hex && isRiverLandTerrain(hex.terenBazowy)
    && !isReliefTerrain(hex.terenBazowy)
    && hex.rzeka?.obecna !== true;
}

/** Największy spójny płat suchego lądu bez rzeki (BFS) — audyt gęstości sieci. */
export function maxDryLowlandPatchSize(
  massLandKeys: Iterable<string>,
  hexes: Record<string, Hex>,
): number {
  const massSet = massLandKeys instanceof Set ? massLandKeys : new Set(massLandKeys);
  const visited = new Set<string>();
  let maxSize = 0;
  for (const k of massSet) {
    if (visited.has(k) || !isDryLowlandPatchHex(hexes[k])) continue;
    const queue = [k];
    visited.add(k);
    let size = 0;
    while (queue.length > 0) {
      const cur = queue.shift()!;
      size++;
      const { q, r } = parseHexKey(cur);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        if (!massSet.has(nk) || visited.has(nk) || !isDryLowlandPatchHex(hexes[nk])) continue;
        visited.add(nk);
        queue.push(nk);
      }
    }
    if (size > maxSize) maxSize = size;
  }
  return maxSize;
}

/** Domyka duże suche baseny nizinne — dopływ do istniejącej sieci. */
function tryDrainDryPatchFromRelief(
  ctx: GridSourcePlaceCtx,
  component: Array<[number, number]>,
  massSet: Set<string>,
): boolean {
  const compSet = new Set(component.map(([q, r]) => hexKey(q, r)));
  const reliefCandidates: Array<{ q: number; r: number; score: number }> = [];
  for (const [q, r] of component) {
    const k = hexKey(q, r);
    const h = ctx.hexes[k];
    if (h && isReliefRiverSource(h.terenBazowy) && !ctx.usedSources.has(k)) {
      const d = ctx.seaDist.get(k) ?? 0;
      reliefCandidates.push({ q, r, score: d + ctx.rand() * 2 });
    }
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nq = q + dq;
      const nr = r + dr;
      const nk = hexKey(nq, nr);
      if (!massSet.has(nk) || compSet.has(nk)) continue;
      const nh = ctx.hexes[nk];
      if (!nh || !isReliefRiverSource(nh.terenBazowy) || ctx.usedSources.has(nk)) continue;
      const d = ctx.seaDist.get(nk) ?? 0;
      reliefCandidates.push({ q: nq, r: nr, score: d + ctx.rand() * 2 });
    }
  }
  reliefCandidates.sort((a, b) => b.score - a.score);
  const traceOpts = {
    seaDist: ctx.seaDist,
    openOceanDist: ctx.openOceanDist,
    oceanConnected: ctx.oceanConnected,
    mapWidth: ctx.width,
    mapHeight: ctx.height,
    rand: ctx.rand,
    ...ctx.traceOptsBase,
    allowReliefTraversal: true,
    relaxSeaBuffer: true,
  };

  for (const c of reliefCandidates.slice(0, 10)) {
    const startSeaDist = ctx.seaDist.get(hexKey(c.q, c.r)) ?? 0;
    const traceMax = riverTraceBudgetForSeaDist(startSeaDist, ctx.minLen, ctx.maxLen, ctx.largeMapPerf);
    const seaPath = traceRiverForGridFill(
      ctx.hexes, c.q, c.r, traceMax, ctx.minLen, 3, traceOpts, true,
    );
    if (seaPath.length >= 3 && ctx.pushMain(seaPath, c.q, c.r)) return true;
    if (seaPath.length >= 3 && ctx.pushMedium?.(seaPath, c.q, c.r)) return true;
  }

  const riverKeys = new Set(
    [...collectRiverPathHexKeys(ctx.riverPaths)].filter((k) => massSet.has(k)),
  );
  if (riverKeys.size === 0) return false;

  for (const c of reliefCandidates.slice(0, 8)) {
    let bestJ: { q: number; r: number } | null = null;
    let bestD = Infinity;
    for (const jk of riverKeys) {
      const { q: jq, r: jr } = parseHexKey(jk);
      const d = hexAxialDistance(c.q, c.r, jq, jr);
      if (d < bestD) { bestD = d; bestJ = { q: jq, r: jr }; }
    }
    if (!bestJ || bestD > ctx.maxLen) continue;
    const tribPath = traceTributary(
      ctx.hexes, c.q, c.r, bestJ.q, bestJ.r, ctx.maxLen, ctx.seaDist, ctx.rand, 3,
    );
    if (tribPath.length >= 3 && ctx.pushMedium?.(tribPath, c.q, c.r)) return true;
  }
  return false;
}

/** Wymusza rzekę z wnętrza suchego płata (trace do morza / siatka). */
function tryForceRiverThroughDryPatch(
  ctx: GridSourcePlaceCtx,
  component: Array<[number, number]>,
  massSet: Set<string>,
): boolean {
  if (RIVER_PROFILE_ON) rpEnsure().forceFillCalls++;
  const forceCtx: GridSourcePlaceCtx = {
    ...ctx, acceptLen: 3, sourceSep: 0, relaxSeaBuffer: true, allowReliefTraversal: true,
  };
  const candidates = component
    .filter(([q, r]) => !ctx.usedSources.has(hexKey(q, r)))
    .map(([q, r]) => ({
      q,
      r,
      d: ctx.seaDist.get(hexKey(q, r)) ?? 0,
      tie: ctx.rand(),
    }))
    .sort((a, b) => b.d - a.d || a.tie - b.tie);

  for (const c of candidates.slice(0, ctx.largeMapPerf ? 12 : 40)) {
    if (tryPlaceGridSource(forceCtx, c.q, c.r, massSet)) return true;
    const startSeaDist = ctx.seaDist.get(hexKey(c.q, c.r)) ?? 0;
    const traceMax = riverTraceBudgetForSeaDist(
      startSeaDist, ctx.minLen, ctx.maxLen, ctx.largeMapPerf,
    );
    const seaPath = traceRiverForGridFill(
      ctx.hexes, c.q, c.r, traceMax, ctx.minLen, 3,
      {
        seaDist: ctx.seaDist,
        openOceanDist: ctx.openOceanDist,
        oceanConnected: ctx.oceanConnected,
        mapWidth: ctx.width,
        mapHeight: ctx.height,
        rand: ctx.rand,
        ...ctx.traceOptsBase,
        allowReliefTraversal: true,
        relaxSeaBuffer: true,
      },
      true,
    );
    if (seaPath.length >= 3 && ctx.pushMedium?.(seaPath, c.q, c.r)) return true;
    if (seaPath.length >= 3 && ctx.pushShort?.(seaPath, c.q, c.r)) return true;
    if (seaPath.length >= 3 && ctx.pushTributary(seaPath, c.q, c.r)) return true;
  }
  return false;
}

function fillDryLowlandPatches(
  massSet: Set<string>,
  gridCtx: GridSourcePlaceCtx,
  minPatchSize: number,
  maxPasses: number,
  processAllOversized = false,
): number {
  let placed = 0;
  for (let pass = 0; pass < maxPasses; pass++) {
    let passPlaced = 0;
    const patches: Array<{ land: Array<[number, number]>; size: number }> = [];
    const visited = new Set<string>();
    for (const k of massSet) {
      if (visited.has(k) || !isDryLandWithoutRiver(gridCtx.hexes[k])) continue;
      const component: Array<[number, number]> = [];
      const queue = [k];
      visited.add(k);
      while (queue.length > 0) {
        const cur = queue.shift()!;
        const { q, r } = parseHexKey(cur);
        component.push([q, r]);
        for (const [dq, dr] of HEX_DIRECTIONS) {
          const nk = hexKey(q + dq, r + dr);
          if (!massSet.has(nk) || visited.has(nk) || !isDryLandWithoutRiver(gridCtx.hexes[nk])) continue;
          visited.add(nk);
          queue.push(nk);
        }
      }
      if (component.length >= minPatchSize) patches.push({ land: component, size: component.length });
    }
    patches.sort((a, b) => b.size - a.size);
    const batchLimit = processAllOversized
      ? patches.length
      : Math.max(12, patches.filter((p) => p.size > MAX_DRY_LOWLAND_PATCH_HEXES).length);
    for (const { land, size } of patches.slice(0, batchLimit)) {
      if (cellHasRiverHex(land, gridCtx.hexes)) continue;
      const forceCtx: GridSourcePlaceCtx = {
        ...gridCtx, acceptLen: 3, sourceSep: 0, relaxSeaBuffer: true, allowReliefTraversal: true,
      };
      if (tryDrainDryPatchFromRelief(forceCtx, land, massSet)) {
        passPlaced++;
        placed++;
        continue;
      }
      if (tryForceCellRiverConnection(forceCtx, land, massSet)) {
        passPlaced++;
        placed++;
        continue;
      }
      if (size > MAX_DRY_LOWLAND_PATCH_HEXES && tryForceRiverThroughDryPatch(forceCtx, land, massSet)) {
        passPlaced++;
        placed++;
      }
    }
    if (passPlaced === 0) break;
  }
  return placed;
}

/** Domyka suche płaty lądu do limitu {@link MAX_DRY_LOWLAND_PATCH_HEXES}. */
function enforceMaxDryLowlandPatches(
  massSet: Set<string>,
  gridCtx: GridSourcePlaceCtx,
  roundProfile: RiverRoundProfile = 'normal',
): void {
  const maxHex = MAX_DRY_LOWLAND_PATCH_HEXES;
  fillDryLowlandPatches(massSet, gridCtx, 4, 10);
  if (maxDryLowlandPatchSize(massSet, gridCtx.hexes) <= maxHex) return;
  const maxRounds = dryPatchEnforceMaxRounds(roundProfile);
  for (let round = 0; round < maxRounds; round++) {
    if (maxDryLowlandPatchSize(massSet, gridCtx.hexes) <= maxHex) return;
    const n = fillDryLowlandPatches(massSet, gridCtx, maxHex + 1, 6, true);
    if (n > 0) continue;
    const oversized = findAllOversizedDryLandPatches(massSet, gridCtx.hexes, maxHex);
    if (oversized.length === 0) break;
    let anySuccess = false;
    for (const patch of oversized) {
      const forceCtx: GridSourcePlaceCtx = {
        ...gridCtx, acceptLen: 3, sourceSep: 0, relaxSeaBuffer: true, allowReliefTraversal: true,
      };
      if (tryForceCellRiverConnection(forceCtx, patch, massSet)) anySuccess = true;
      else if (tryForceRiverThroughDryPatch(forceCtx, patch, massSet)) anySuccess = true;
      else if (trySubdivideDryPatch(forceCtx, patch, massSet)) anySuccess = true;
    }
    if (!anySuccess) break;
  }
}

function findAllOversizedDryLandPatches(
  massSet: Set<string>,
  hexes: Record<string, Hex>,
  maxHex: number,
): Array<Array<[number, number]>> {
  const visited = new Set<string>();
  const out: Array<Array<[number, number]>> = [];
  for (const k of massSet) {
    if (visited.has(k) || !isDryLowlandPatchHex(hexes[k])) continue;
    const component: Array<[number, number]> = [];
    const queue = [k];
    visited.add(k);
    while (queue.length > 0) {
      const cur = queue.shift()!;
      const { q, r } = parseHexKey(cur);
      component.push([q, r]);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        if (!massSet.has(nk) || visited.has(nk) || !isDryLowlandPatchHex(hexes[nk])) continue;
        visited.add(nk);
        queue.push(nk);
      }
    }
    if (component.length > maxHex) out.push(component);
  }
  out.sort((a, b) => b.length - a.length);
  return out;
}

function findLargestDryLowlandPatch(
  massSet: Set<string>,
  hexes: Record<string, Hex>,
): Array<[number, number]> | null {
  const visited = new Set<string>();
  let best: Array<[number, number]> | null = null;
  for (const k of massSet) {
    if (visited.has(k) || !isDryLowlandPatchHex(hexes[k])) continue;
    const component: Array<[number, number]> = [];
    const queue = [k];
    visited.add(k);
    while (queue.length > 0) {
      const cur = queue.shift()!;
      const { q, r } = parseHexKey(cur);
      component.push([q, r]);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        if (!massSet.has(nk) || visited.has(nk) || !isDryLowlandPatchHex(hexes[nk])) continue;
        visited.add(nk);
        queue.push(nk);
      }
    }
    if (!best || component.length > best.length) best = component;
  }
  return best;
}

function enforceHardRiverGridStarts(
  hexes: Record<string, Hex>,
  massSet: Set<string>,
  cellSize: number,
  seaDist: Map<string, number>,
  riverPaths: RiverCoord[][],
  gridCtx: GridSourcePlaceCtx,
  maxLen: number,
  reliefSourceBonus: number,
  expandSourceRadius: number,
  minInlandFromSea: number,
  baseSourceSep: number,
  acceptLen: number,
): number {
  const minLand = minLandHexesForRiverCell(cellSize);
  let placed = 0;

  const cellAvgSeaDist = (cells: Array<[number, number]>) => {
    let s = 0;
    for (const [q, r] of cells) s += seaDist.get(hexKey(q, r)) ?? 0;
    return cells.length > 0 ? s / cells.length : 0;
  };

  const listEligibleCells = (preferInland: boolean): Array<[number, number]>[] =>
    [...landHexesByCoverageCell(massSet, cellSize).values()]
      .filter((land) => land.length >= minLand)
      .filter((land) => cellEligibleForRiverPlacement(land, seaDist, 2))
      .filter((land) => !cellHasRiverHex(land, hexes))
      .sort((a, b) => {
        const da = cellAvgSeaDist(a);
        const db = cellAvgSeaDist(b);
        return preferInland ? db - da : da - db;
      });

  const retryPasses: Array<{ acceptLen: number; sourceSep: number; expand: number; minInland: number }> =
    gridCtx.largeMapPerf
      ? [
        { acceptLen, sourceSep: baseSourceSep, expand: expandSourceRadius, minInland: minInlandFromSea },
        { acceptLen: 3, sourceSep: Math.max(1, baseSourceSep - 2), expand: expandSourceRadius + 2, minInland: 1 },
      ]
      : [
        { acceptLen, sourceSep: baseSourceSep, expand: expandSourceRadius, minInland: minInlandFromSea },
        { acceptLen: Math.max(3, acceptLen - 1), sourceSep: Math.max(2, baseSourceSep - 2), expand: expandSourceRadius + 1, minInland: Math.max(1, minInlandFromSea - 1) },
        { acceptLen: 3, sourceSep: 2, expand: expandSourceRadius + 2, minInland: 1 },
        { acceptLen: 3, sourceSep: 1, expand: expandSourceRadius + 3, minInland: 1 },
        { acceptLen: 3, sourceSep: 0, expand: expandSourceRadius + 4, minInland: 1 },
      ];

  // Bootstrap: pierwsza rzeka NA TEJ masie → morze (sieć dla dopływów).
  const massHasRiver = (): boolean => {
    for (const path of riverPaths) {
      for (const p of path ?? []) {
        if (massSet.has(hexKey(p.q, p.r))) return true;
      }
    }
    return false;
  };

  if (!massHasRiver()) {
    const bootstrapLand = listEligibleCells(false)[0];
    if (bootstrapLand) {
      if (tryPlaceMainRiverFromCoast(gridCtx, bootstrapLand, massSet, undefined, 3)) {
        placed++;
      } else {
        const ranked = bootstrapLand
          .map(([q, r]) => ({ q, r, d: seaDist.get(hexKey(q, r)) ?? 0 }))
          .filter((c) => c.d >= 1)
          .sort((a, b) => a.d - b.d);
        for (const c of ranked.slice(0, 24)) {
          const localCtx: GridSourcePlaceCtx = { ...gridCtx, acceptLen: 3, sourceSep: 0 };
          if (gridCtx.placeMode === 'medium' || gridCtx.placeMode === 'short') {
            if (tryPlaceGridSource(localCtx, c.q, c.r, massSet)) { placed++; break; }
            continue;
          }
          const traceMax = riverTraceBudgetForSeaDist(c.d, gridCtx.minLen, gridCtx.maxLen, gridCtx.largeMapPerf);
          const seaPath = traceRiverFromCoast(
            gridCtx.hexes, c.q, c.r, traceMax,
            {
              seaDist: gridCtx.seaDist,
              openOceanDist: gridCtx.openOceanDist,
              oceanConnected: gridCtx.oceanConnected,
              mapWidth: gridCtx.width,
              mapHeight: gridCtx.height,
              rand: gridCtx.rand,
              minLen: gridCtx.minLen,
              landCentroid: gridCtx.massCentroid ?? null,
              landCenterSquare: gridCtx.massCenterSquare ?? null,
              ...gridCtx.traceOptsBase,
            },
          );
          if (seaPath.length >= gridCtx.traceMinLen && gridCtx.pushMain(seaPath, seaPath[0]!.q, seaPath[0]!.r)) {
            placed++;
            break;
          }
        }
      }
    }
  }

  for (const pass of retryPasses) {
    const unfilled = listEligibleCells(true);
    if (unfilled.length === 0) break;

    for (const land of unfilled) {
      if (cellHasRiverHex(land, hexes)) continue;

      const rankCandidates = (cells: Array<[number, number]>) =>
        cells
          .filter(([q, r]) => !gridCtx.usedSources.has(hexKey(q, r)))
          .map(([q, r]) => {
            const h = hexes[hexKey(q, r)];
            const d = seaDist.get(hexKey(q, r)) ?? 0;
            let score = d + gridCtx.rand() * 4;
            if (reliefSourceBonus > 0 && h && isReliefRiverSource(h.terenBazowy)) score += reliefSourceBonus;
            else if (h && isRiverLandTerrain(h.terenBazowy)) score += 12;
            return { q, r, d, score };
          })
          .filter((c) => c.d >= pass.minInland && isRiverLandTerrain(hexes[hexKey(c.q, c.r)]?.terenBazowy ?? TerenBazowy.Morze))
          .sort((a, b) => b.score - a.score);

      const tryAt = (q: number, r: number): boolean => {
        const localCtx: GridSourcePlaceCtx = {
          ...gridCtx,
          acceptLen: pass.acceptLen,
          sourceSep: pass.sourceSep,
          relaxSeaBuffer: pass.acceptLen <= 3,
        };
        return tryPlaceGridSource(localCtx, q, r, massSet);
      };

      let ok = false;
      for (const c of rankCandidates(land)) {
        if (tryAt(c.q, c.r)) { placed++; ok = true; break; }
      }
      if (ok || cellHasRiverHex(land, hexes)) continue;

      for (const [q, r] of expandRiverSourceCandidates(land, massSet, pass.expand)) {
        if (tryAt(q, r)) { placed++; break; }
      }
      if (cellHasRiverHex(land, hexes)) continue;

      for (const [q, r] of land) {
        if (tryAt(q, r)) { placed++; break; }
      }
    }
  }

  for (const land of listEligibleCells(true)) {
    if (cellHasRiverHex(land, hexes)) continue;
    for (const [q, r] of land) {
      const forceCtx: GridSourcePlaceCtx = {
        ...gridCtx, acceptLen: 3, sourceSep: 0, relaxSeaBuffer: true,
      };
      if (tryPlaceGridSource(forceCtx, q, r, massSet)) { placed++; break; }
    }
  }

  // BFS fallback: suchy płat za górami — dopływ do najbliższej rzeki po nizinach.
  for (const land of listEligibleCells(true)) {
    if (cellHasRiverHex(land, hexes)) continue;
    if (tryForceCellRiverConnection(gridCtx, land, massSet)) placed++;
  }

  return placed;
}

/** Komórki siatki bez heksa rzeki — posortowane od najbardziej w głąb lądu. */
function listUnfilledRiverGridCells(
  massSet: Set<string>,
  hexes: Record<string, Hex>,
  cellSize: number,
  seaDist: Map<string, number>,
  minInland = 2,
): Array<Array<[number, number]>> {
  const minLand = minLandHexesForRiverCell(cellSize);
  const cellAvgSeaDist = (cells: Array<[number, number]>) => {
    let s = 0;
    for (const [q, r] of cells) s += seaDist.get(hexKey(q, r)) ?? 0;
    return cells.length > 0 ? s / cells.length : 0;
  };
  return [...landHexesByCoverageCell(massSet, cellSize).values()]
    .filter((land) => land.length >= minLand)
    .filter((land) => cellEligibleForRiverPlacement(land, seaDist, minInland))
    .filter((land) => !cellHasRiverHex(land, hexes))
    .sort((a, b) => cellAvgSeaDist(b) - cellAvgSeaDist(a));
}

/**
 * Twardy pass końcowy: każda komórka N×N ma heks rzeki ORAZ max dystans ląd→rzeka ≤ proximity.
 * Więcej rund na dużych masach; force-fill z najluźniejszymi kryteriami.
 */
function ensureRiverGridAndProximity(
  hexes: Record<string, Hex>,
  massSet: Set<string>,
  cellSize: number,
  seaDist: Map<string, number>,
  gridCtx: GridSourcePlaceCtx,
  maxProximityDist = RIVER_PROXIMITY_MAX_DIST,
  roundProfile: RiverRoundProfile = 'normal',
): number {
  const maxRounds = riverProximityMaxRounds(massSet.size, roundProfile);
  const forceCtx: GridSourcePlaceCtx = {
    ...gridCtx,
    acceptLen: 3,
    sourceSep: 0,
    relaxSeaBuffer: true,
    allowReliefTraversal: true,
    placeMode: gridCtx.placeMode ?? 'medium',
  };
  let placed = 0;

  for (let round = 0; round < maxRounds; round++) {
    const proxStats = computeRiverProximityStats(massSet, hexes, true);
    const proxGap = proxStats.maxDist;
    const dryGapEarly = maxDryLowlandPatchSize(massSet, hexes);
    const unfilledEarly = listUnfilledRiverGridCells(massSet, hexes, cellSize, seaDist);
    if (
      proxGap <= maxProximityDist
      && dryGapEarly <= MAX_DRY_LOWLAND_PATCH_HEXES + 5
      && unfilledEarly.length === 0
    ) break;

    let roundPlaced = 0;
    const unfilled = unfilledEarly;

    for (const land of unfilled) {
      if (cellHasRiverHex(land, hexes)) continue;
      if (tryForceCellRiverConnection(forceCtx, land, massSet)) {
        roundPlaced++;
        continue;
      }
      if (tryForceRiverThroughDryPatch(forceCtx, land, massSet)) {
        roundPlaced++;
        continue;
      }
      for (const [q, r] of land.slice(0, 10)) {
        if (tryPlaceGridSource(forceCtx, q, r, massSet)) {
          roundPlaced++;
          break;
        }
      }
    }

    if (roundPlaced === 0 && proxGap > maxProximityDist) {
      const far = proxStats.farthest;
      if (far && far.dist > maxProximityDist) {
        if (tryForceCellRiverConnection(forceCtx, [[far.q, far.r]], massSet)) roundPlaced++;
        else if (tryPlaceGridSource(forceCtx, far.q, far.r, massSet)) roundPlaced++;
      }
      const dry = findLargestDryLowlandPatch(massSet, hexes);
      if (roundPlaced === 0 && dry && dry.length >= 4) {
        if (tryForceCellRiverConnection(forceCtx, dry, massSet)) roundPlaced++;
        else if (tryForceRiverThroughDryPatch(forceCtx, dry, massSet)) roundPlaced++;
        else if (dry.length > MAX_DRY_LOWLAND_PATCH_HEXES && trySubdivideDryPatch(forceCtx, dry, massSet)) {
          roundPlaced++;
        }
      }
    }

    if (maxDryLowlandPatchSize(massSet, hexes) > MAX_DRY_LOWLAND_PATCH_HEXES) {
      enforceMaxDryLowlandPatches(massSet, forceCtx, roundProfile);
    }

    placed += roundPlaced;
    const dryGap = maxDryLowlandPatchSize(massSet, hexes);
    if (
      roundPlaced === 0
      && unfilled.length === 0
      && proxGap <= maxProximityDist
      && dryGap <= MAX_DRY_LOWLAND_PATCH_HEXES + 5
    ) break;
  }

  const mopRounds = proximityMopRounds(roundProfile);
  for (let mop = 0; mop < mopRounds; mop++) {
    const finalProx = computeRiverProximityStats(massSet, hexes, true);
    if (finalProx.maxDist <= maxProximityDist) break;
    if (!finalProx.farthest) break;
    const far = finalProx.farthest;
    let fixed = false;
    if (tryForceCellRiverConnection(forceCtx, [[far.q, far.r]], massSet)) fixed = true;
    else if (tryPlaceGridSource(forceCtx, far.q, far.r, massSet)) fixed = true;
    else if (tryForceRiverThroughDryPatch(forceCtx, [[far.q, far.r]], massSet)) fixed = true;
    if (fixed) placed++;
    else break;
  }
  return placed;
}

/** Etap 1 Pangea: bootstrap od oceanu — tańsze próby, cache separacji (Maciej 2026-08-01). */
function bootstrapMainRiversFromCoast(
  massSet: Set<string>,
  seaDist: Map<string, number>,
  gridCtx: GridSourcePlaceCtx,
  maxRivers: number,
  onAttempt?: () => void,
  softAcceptLen?: number,
): number {
  let placed = 0;
  const targetLen = gridCtx.minLen;
  const acceptThreshold = softAcceptLen != null && softAcceptLen < targetLen
    ? softAcceptLen
    : targetLen;
  const land: Array<[number, number]> = [];
  for (const k of massSet) {
    const { q, r } = parseHexKey(k);
    land.push([q, r]);
  }
  const mouths = collectCoastMouthCandidates(land, gridCtx.hexes, seaDist, 2);
  mouths.sort((a, b) => a.d - b.d || gridCtx.rand() * 2 - 1);

  const minSep = pangeaBootstrapMouthMinSep(gridCtx.width, gridCtx.height);
  const unlimited = !Number.isFinite(maxRivers);
  const mouthPoolCap = unlimited ? mouths.length : maxRivers + 12;
  const picked: Array<{ q: number; r: number; d: number }> = [];
  for (const m of mouths) {
    if (picked.length >= mouthPoolCap) break;
    if (picked.every((p) => hexDistanceAxial(p.q, p.r, m.q, m.r) >= minSep)) picked.push(m);
  }
  const candidates = picked.length > 0 ? picked : mouths.slice(0, Math.max(1, mouthPoolCap));

  let mainKeys = gridCtx.mainKeysCache
    ?? collectPathHexKeysForKinds(gridCtx.riverPaths, gridCtx.riverKinds, ['main']);
  let consecutiveFails = 0;
  const maxConsecutiveFails = unlimited
    ? Math.max(candidates.length, 1)
    : pangeaBootstrapMaxConsecutiveFails(
      riverMapAreaScale(gridCtx.width, gridCtx.height),
    );
  const pangeaGrowthCap = pangeaCoastRiverGrowthCap(
    gridCtx.maxLen,
    Math.min(gridCtx.width, gridCtx.height),
  );

  for (const mouth of candidates) {
    if (placed >= maxRivers) break;
    if (consecutiveFails >= maxConsecutiveFails) break;
    onAttempt?.();
    const traceMax = riverTraceBudgetForSeaDist(
      mouth.d, targetLen, pangeaGrowthCap, gridCtx.largeMapPerf,
    );
    const path = traceRiverFromCoast(
      gridCtx.hexes, mouth.q, mouth.r, traceMax,
      {
        seaDist: gridCtx.seaDist,
        openOceanDist: gridCtx.openOceanDist,
        oceanConnected: gridCtx.oceanConnected,
        mapWidth: gridCtx.width,
        mapHeight: gridCtx.height,
        rand: gridCtx.rand,
        minLen: targetLen,
        blockRiverKeys: mainKeys,
        minPathSep: MAIN_RIVER_MIN_PATH_SEP,
        riverSepIndex: gridCtx.riverSepIndex,
        landCentroid: gridCtx.massCentroid ?? null,
        landCenterSquare: gridCtx.massCenterSquare ?? null,
        ...gridCtx.traceOptsBase,
        allowReliefTraversal: gridCtx.allowReliefTraversal,
      },
    );
    if (path.length < acceptThreshold) { consecutiveFails++; continue; }
    if (isPathTooCloseToRiverHexes(path, mainKeys, MAIN_RIVER_MIN_PATH_SEP, gridCtx.riverSepIndex)) { consecutiveFails++; continue; }
    const sq = path[0]!.q;
    const sr = path[0]!.r;
    if (gridCtx.pushMain(path, sq, sr)) {
      placed++;
      consecutiveFails = 0;
      addPathKeysToSet(path, mainKeys);
    } else {
      consecutiveFails++;
    }
  }

  if (!landMassHasMainRiver([...massSet], gridCtx.riverPaths, gridCtx.riverKinds) && land.length > 0) {
    onAttempt?.();
    if (tryPlaceMainRiverFromCoast(gridCtx, land, massSet, mainKeys, softAcceptLen)) placed++;
  }
  return placed;
}

/** Etap 1: główne rzeki — sparse siatka, ocean → inland (Maciej 2026-08-01). */
function generatePhase1MainRivers(
  hexes: Record<string, Hex>,
  massSet: Set<string>,
  seaDist: Map<string, number>,
  riverPaths: RiverCoord[][],
  riverKinds: RiverPathKind[],
  usedSources: Set<string>,
  gridCtx: GridSourcePlaceCtx,
  maxLen: number,
  riverParams: RiverMapParams,
  riverPerf: RiverPerfCtx,
  onAttempt?: () => void,
): number {
  const ctx: GridSourcePlaceCtx = { ...gridCtx, placeMode: 'main-only' };

  // Pangea: bootstrap od oceanu + lekki grid seed (stride 3, limit komórek).
  // FALA 178: bez fallbacku inland→A*→morze (tryPlaceGridSource) — tylko coast→inland.
  if (riverPerf.pangeaSingleMass) {
    const landHexCount = massSet.size;
    const gridStride = riverParams.areaScale >= 3 ? 2 : 3;
    // Maciej 2026-08-02: bez limitu liczby — siej aż reguły nie dadzą kolejnej.
    const maxRivers = Number.POSITIVE_INFINITY;
    let placed = bootstrapMainRiversFromCoast(massSet, seaDist, ctx, maxRivers, onAttempt);
    const tryCoastNoop = (_sq: number, _sr: number) => false;
    placed += ensureMassRiverGridCoverage(
      hexes,
      massSet,
      riverParams.mainCell,
      seaDist,
      riverPaths,
      riverKinds,
      usedSources,
      tryCoastNoop,
      gridCtx.rand,
      maxLen,
      {
        sparseMainOnly: true,
        gridStride,
        reliefSourceBonus: 0,
        expandSourceRadius: 1,
        minInlandFromSea: 1,
        gridCtx: ctx,
        acceptLen: gridCtx.minLen,
        maxCellsToProcess: Number.POSITIVE_INFINITY,
        skipHeavyFallback: false,
        coastOnlyMain: false,
      },
    );
    placed += topUpMainRiverCoastMouthGaps(
      massSet,
      seaDist,
      ctx,
      mainRiverCoastMouthMaxGapForDims(gridCtx.width, gridCtx.height),
      2,
    );
    placed += ensurePangeaInteriorMainRivers(
      hexes, massSet, seaDist, ctx, riverParams, maxLen, onAttempt,
    );
    return placed;
  }

  const gridStride = riverPerf.largeMapPerf
    ? Math.max(2, riverParams.mainGridStride)
    : riverParams.mainGridStride;

  const cellList = [...landHexesByCoverageCell(massSet, riverParams.mainCell).values()]
    .filter((land) => land.length >= minLandHexesForRiverCell(riverParams.mainCell))
    .filter((land) => isSparseMainCoverageCell(land, riverParams.mainCell, gridStride))
    .filter((land) => cellEligibleForRiverPlacement(land, seaDist, 1));

  let placed = 0;
  let cellIdx = 0;
  const softLen = Math.max(3, gridCtx.traceMinLen);
  for (const land of cellList) {
    cellIdx++;
    onAttempt?.();
    // FALA 178: wyłącznie od ujścia przy brzegu → inland (bez tryMain/A*).
    if (
      tryPlaceMainRiverFromCoast(ctx, land, massSet)
      || tryPlaceMainRiverFromCoast(ctx, land, massSet, undefined, softLen)
    ) {
      placed++;
    }
    if (cellIdx % 4 === 0) onAttempt?.();
  }

  // Standard: pełna siatka tylko gdy nie largeMapPerf — też tylko coast→inland.
  if (!riverPerf.largeMapPerf) {
    placed += ensureMassRiverGridCoverage(
      hexes,
      massSet,
      riverParams.mainCell,
      seaDist,
      riverPaths,
      riverKinds,
      usedSources,
      () => false,
      gridCtx.rand,
      maxLen,
      {
        sparseMainOnly: true,
        gridStride,
        reliefSourceBonus: 0,
        expandSourceRadius: riverParams.expandSourceRadius,
        minInlandFromSea: 1,
        gridCtx: ctx,
        acceptLen: gridCtx.minLen,
        coastOnlyMain: true,
      },
    );
  }

  if (!landMassHasMainRiver([...massSet], riverPaths, riverKinds)) {
    const minLand = minLandHexesForRiverCell(riverParams.mainCell);
    for (const land of landHexesByCoverageCell(massSet, riverParams.mainCell).values()) {
      if (land.length < minLand) continue;
      onAttempt?.();
      if (tryPlaceMainRiverFromCoast(ctx, land, massSet, undefined, softLen)) {
        placed++;
        break;
      }
      if (landMassHasMainRiver([...massSet], riverPaths, riverKinds)) break;
    }
  }

  placed += topUpMainRiverCoastMouthGaps(
    massSet,
    seaDist,
    ctx,
    mainRiverCoastMouthMaxGapForDims(gridCtx.width, gridCtx.height),
    2,
  );
  return placed;
}

/** Etap 3: krótkie dopływy — max 5 hex od średnich, ujście tylko do średnich. */
function generatePhase3ShortRivers(
  massSet: Set<string>,
  tributaryCell: number,
  seaDist: Map<string, number>,
  gridCtx: GridSourcePlaceCtx,
  feederMinLen: number,
  feederSourceSep: number,
  feederPasses: number,
): number {
  const mediumKeys = collectPathHexKeysForKinds(gridCtx.riverPaths, gridCtx.riverKinds, ['medium']);
  if (mediumKeys.size === 0) return 0;

  let placed = 0;
  const ctx: GridSourcePlaceCtx = {
    ...gridCtx,
    placeMode: 'short',
    targetRiverKinds: ['medium'],
    acceptLen: feederMinLen,
    sourceSep: feederSourceSep,
  };

  for (let pass = 0; pass < feederPasses; pass++) {
    let passPlaced = 0;
    const minLand = minLandHexesForRiverCell(tributaryCell);
    for (const land of landHexesByCoverageCell(massSet, tributaryCell).values()) {
      if (land.length < minLand) continue;
      const ranked = land
        .filter(([q, r]) => !gridCtx.usedSources.has(hexKey(q, r)))
        .map(([q, r]) => ({
          q,
          r,
          riverD: nearestRiverHexDistance(q, r, mediumKeys),
          inland: seaDist.get(hexKey(q, r)) ?? 0,
        }))
        .filter((c) => c.riverD > 0 && c.riverD <= SHORT_RIVER_MAX_DIST_FROM_MEDIUM)
        .sort((a, b) => a.riverD - b.riverD || b.inland - a.inland);
      for (const c of ranked.slice(0, 6)) {
        if (tryPlaceGridSource(ctx, c.q, c.r, massSet)) {
          passPlaced++;
          placed++;
          break;
        }
      }
    }
    if (passPlaced === 0) break;
  }
  return placed;
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
  opts: {
    sparseMainOnly?: boolean;
    requireRiverHex?: boolean;
    gridStride?: number;
    reliefSourceBonus?: number;
    expandSourceRadius?: number;
    minInlandFromSea?: number;
    gridCtx?: GridSourcePlaceCtx;
    acceptLen?: number;
    maxCellsToProcess?: number;
    skipHeavyFallback?: boolean;
    /** FALA 178: main tylko coast→inland — bez tryPlace inland→A*→morze. */
    coastOnlyMain?: boolean;
  } = {},
): number {
  const minLand = minLandHexesForRiverCell(cellSize);
  const gridStride = opts.gridStride ?? MAIN_RIVER_GRID_STRIDE;
  const reliefBonus = opts.reliefSourceBonus ?? 0;
  const expandRadius = opts.expandSourceRadius ?? 2;
  const minInlandFromSea = opts.minInlandFromSea ?? RIVER_MIN_INLAND_FROM_SEA;
  const maxCells = opts.maxCellsToProcess ?? Infinity;
  const skipHeavy = opts.skipHeavyFallback ?? false;
  const coastOnlyMain = opts.coastOnlyMain === true;
  let placed = 0;

  const cellList = [...landHexesByCoverageCell(massSet, cellSize).values()]
    .filter((land) => land.length >= minLand)
    .filter((land) => !opts.sparseMainOnly || isSparseMainCoverageCell(land, cellSize, gridStride))
    .filter((land) => cellEligibleForRiverPlacement(land, seaDist, minInlandFromSea))
    .sort((a, b) => {
      const avg = (cells: Array<[number, number]>) => {
        let s = 0;
        for (const [q, r] of cells) s += seaDist.get(hexKey(q, r)) ?? 0;
        return s / cells.length;
      };
      return avg(a) - avg(b);
    });

  const cellSatisfied = (land: Array<[number, number]>): boolean => {
    if (opts.requireRiverHex) return cellHasRiverHex(land, hexes);
    return cellHasMainRiverSource(land, riverPaths, riverKinds);
  };

  let mainKeysCache = opts.gridCtx
    ? collectPathHexKeysForKinds(riverPaths, riverKinds, ['main'])
    : undefined;

  let cellsProcessed = 0;
  for (const land of cellList) {
    if (cellsProcessed >= maxCells) break;
    cellsProcessed++;
    if (cellSatisfied(land)) continue;

    if (opts.sparseMainOnly && opts.gridCtx) {
      const acceptLen = opts.acceptLen ?? opts.gridCtx.minLen;
      if (tryPlaceMainRiverFromCoast(opts.gridCtx, land, massSet, mainKeysCache, acceptLen < opts.gridCtx.minLen ? acceptLen : undefined)) {
        placed++;
        continue;
      }
      // FALA 178: soft coast zamiast inland→A*; potem koniec komórki (bez tryPlace).
      if (coastOnlyMain) {
        const soft = Math.max(3, typeof acceptLen === 'number' ? acceptLen : 3);
        if (tryPlaceMainRiverFromCoast(opts.gridCtx, land, massSet, mainKeysCache, soft)) {
          placed++;
        }
        continue;
      }
    }

    if (coastOnlyMain) continue;

    const ranked = land
      .filter(([q, r]) => !usedSources.has(hexKey(q, r)))
      .map(([q, r]) => {
        const h = hexes[hexKey(q, r)];
        const d = seaDist.get(hexKey(q, r)) ?? 0;
        let score = d + rand() * 4;
        if (reliefBonus > 0 && h && isReliefRiverSource(h.terenBazowy)) score += reliefBonus;
        else if (h && isRiverLandTerrain(h.terenBazowy)) score += 12;
        return { q, r, d, score };
      })
      .filter((c) => c.d >= minInlandFromSea)
      .sort((a, b) => b.score - a.score);

    const rankedLimit = skipHeavy ? 3 : ranked.length;
    let ok = false;
    for (const c of ranked.slice(0, rankedLimit)) {
      if (tryPlace(c.q, c.r)) {
        placed++;
        ok = true;
        break;
      }
    }
    if (ok || cellSatisfied(land)) continue;

    if (skipHeavy) continue;

    const expanded = expandRiverSourceCandidates(land, massSet, expandRadius);
    for (const [q, r] of expanded) {
      if (tryPlace(q, r)) {
        placed++;
        break;
      }
    }
    if (cellSatisfied(land)) continue;

    const fallbackRanked = land
      .filter(([q, r]) => !usedSources.has(hexKey(q, r)))
      .filter(([q, r]) => (seaDist.get(hexKey(q, r)) ?? 0) >= minInlandFromSea)
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
 * Generuje rzeki w 3 etapach (Maciej 2026-07-31 / korekta FALA 178):
 * 1) główne ocean→inland (coast grow; bez starego inland→A*→morze) · 2) średnie→sieć|ocean · 3) krótkie→średnie.
 * Ujście do morza wizualnie: render `renderCoastalRiverExtension` (stage≥1).
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
    riverParams?: RiverMapParams;
    /** 0–100 w obrębie etapu głównych rzek (faza 6). */
    onProgress?: (localPct: number) => void;
  } = {},
): GenerateRiversResult {
  const _genT0 = RIVER_PROFILE_ON ? rpNow() : 0;
  const mainOnly = isRiverGenMainOnly();
  const riversTier = opts.riversTier ?? 'medium';
  const riverParams = opts.riverParams ?? resolveRiverMapParams(riversTier, width, height);
  const minLen = opts.minLen ?? riverParams.minLen;
  const maxLen = opts.maxLen ?? riverParams.maxLen;

  const { seaDist, oceanConnected, openOceanDist } = buildRiverFieldCache(hexes, width, height);
  const riverPaths: RiverCoord[][] = [];
  const riverKinds: RiverPathKind[] = [];
  const usedSources = new Set<string>();

  const masses = groupLandMassKeys(hexes)
    .filter((m) => m.length >= 5)
    .sort((a, b) => b.length - a.length);
  const riverPerf = buildRiverPerfCtx(masses, riverParams.areaScale);
  const { pangeaSingleMass, largeMapPerf } = riverPerf;

  const cellSize = riverParams.mainCell;
  const tributaryCell = riverParams.tributaryCell;
  const gridTraceMinLen = riverParams.gridTraceMinLen;
  const feederMinLen = riverParams.feederMinLen;
  const minSourceSep = Math.max(2, Math.floor(cellSize * 0.25));
  const feederMinSourceSep = Math.max(2, Math.floor(tributaryCell * 0.35));
  const traceOptsBase = {
    hardMeanderLen: riverParams.hardMeanderLen,
    mouthTailLen: riverParams.mouthTailLen,
  };
  const seaBufferOpts = {
    minInland: riverParams.minInlandFromSea,
    mouthTail: riverParams.mouthTailLen,
  };

  const mainKeysCache = new Set<string>();
  const mainSepIndex = new RiverHexSpatialIndex();

  const pushMain = (path: RiverCoord[], sq: number, sr: number): boolean => {
    if (isPathTooCloseToRiverHexes(path, mainKeysCache, MAIN_RIVER_MIN_PATH_SEP, mainSepIndex)) return false;
    const finalized = finalizeMainRiverPath(hexes, path, width, height, oceanConnected);
    if (!finalized) return false;
    riverPaths.push(finalized);
    riverKinds.push('main');
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, finalized);
    addPathKeysToSet(finalized, mainKeysCache);
    mainSepIndex.addPath(finalized);
    return true;
  };

  const pushTributary = (path: RiverCoord[], sq: number, sr: number): boolean => {
    const out = finalizeTributaryPath(
      hexes, path, riverPaths, riverKinds, width, height, oceanConnected,
    );
    if (!out) return false;
    riverPaths.push(out);
    riverKinds.push('tributary');
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, out);
    return true;
  };

  const pushMedium = (path: RiverCoord[], sq: number, sr: number): boolean => {
    const out = finalizeMediumPath(
      hexes, path, riverPaths, riverKinds, width, height, oceanConnected,
    );
    if (!out) return false;
    riverPaths.push(out);
    riverKinds.push('medium');
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, out);
    return true;
  };

  const pushShort = (path: RiverCoord[], sq: number, sr: number): boolean => {
    const mediumKeys = collectPathHexKeysForKinds(riverPaths, riverKinds, ['medium']);
    if (mediumKeys.size === 0) return false;
    if (nearestRiverHexDistance(sq, sr, mediumKeys) > SHORT_RIVER_MAX_DIST_FROM_MEDIUM) return false;
    const out = finalizeShortPath(
      hexes, path, riverPaths, riverKinds, width, height, oceanConnected,
    );
    if (!out) return false;
    riverPaths.push(out);
    riverKinds.push('short');
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, out);
    return true;
  };

  const usedMediumSpawnKeys = new Set<string>();

  const gridCtx: GridSourcePlaceCtx = {
    hexes, width, height, riverPaths, riverKinds, usedSources,
    seaDist, openOceanDist, oceanConnected, rand,
    minLen, maxLen, acceptLen: gridTraceMinLen, traceMinLen: gridTraceMinLen,
    sourceSep: minSourceSep,
    traceOptsBase, seaBufferOpts, pushMain, pushTributary, pushMedium, pushShort,
    pangeaSingleMass, largeMapPerf, mainKeysCache, riverSepIndex: mainSepIndex,
    usedMediumSpawnKeys,
  };

  const report = (localPct: number) => {
    opts.onProgress?.(Math.max(0, Math.min(100, localPct)));
  };
  const nMasses = masses.length || 1;
  let stage2Steps = 0;
  let stage2Total = 0;
  for (const mass of masses) {
    stage2Total += massRiverCoveragePasses(mass.length, riverRoundProfile(mass.length, riverPerf));
  }
  stage2Total = Math.max(1, stage2Total);

  // ETAP 1 — główne rzeki: sparse siatka, ocean → inland (Maciej 2026-08-01).
  const _s1T0 = RIVER_PROFILE_ON ? rpNow() : 0;
  let stage1Attempts = 0;
  const stage1Budget = riverAggressivePerf(riverPerf)
    ? Math.max(24, Math.min(120, Math.floor((masses[0]?.length ?? 100) / 400)))
    : nMasses;
  for (let mi = 0; mi < masses.length; mi++) {
    const mass = masses[mi];
    const massSet = new Set(mass);
    setMassRiverTargets(hexes, massSet, gridCtx);
    generatePhase1MainRivers(
      hexes, massSet, seaDist, riverPaths, riverKinds, usedSources,
      gridCtx, maxLen, riverParams, riverPerf,
      () => {
        stage1Attempts++;
        if (riverAggressivePerf(riverPerf)) {
          report((stage1Attempts / stage1Budget) * 28);
        }
      },
    );
    if (!riverAggressivePerf(riverPerf)) report(((mi + 1) / nMasses) * 28);
  }
  if (riverAggressivePerf(riverPerf)) report(28);
  if (RIVER_PROFILE_ON) rpEnsure().genStage1Ms += rpNow() - _s1T0;

  if (mainOnly) {
    report(100);
    if (RIVER_PROFILE_ON) rpEnsure().generateRiversMs += rpNow() - _genT0;
    return { paths: riverPaths, kinds: riverKinds };
  }

  // ETAP 2 — średnie dopływy od głównych rzek (FALA 181: co 4 hex prostopadle od main).
  const _s2T0 = RIVER_PROFILE_ON ? rpNow() : 0;
  const mediumCtx: GridSourcePlaceCtx = { ...gridCtx, placeMode: 'medium' };
  for (let mi = 0; mi < masses.length; mi++) {
    const mass = masses[mi];
    const massSet = new Set(mass);
    setMassRiverTargets(hexes, massSet, mediumCtx);
    generateMediumTributariesFromMainRivers(mediumCtx, massSet, maxLen);
    stage2Steps++;
    if (RIVER_PROFILE_ON) rpEnsure().genStage2Rounds++;
    report(28 + (stage2Steps / stage2Total) * 42);
  }
  if (RIVER_PROFILE_ON) rpEnsure().genStage2Ms += rpNow() - _s2T0;

  // FALA 175: hard prune średnich bez styku main/sieci, dead-end, złamane okno skrętu.
  {
    const pruned = pruneInvalidMediumRiverPaths(
      hexes, riverPaths, riverKinds, width, height, oceanConnected,
    );
    riverPaths.splice(0, riverPaths.length, ...pruned.paths);
    riverKinds.splice(0, riverKinds.length, ...pruned.kinds);
  }

  if (!isRiverGenFull()) {
    report(100);
    if (RIVER_PROFILE_ON) rpEnsure().generateRiversMs += rpNow() - _genT0;
    return { paths: riverPaths, kinds: riverKinds };
  }

  // ETAP 3 — krótkie dopływy: bufor 5 hex od średnich, ujście tylko do średnich.
  const _s3T0 = RIVER_PROFILE_ON ? rpNow() : 0;
  const feederPasses = effectiveFeederPasses(riverParams.feederPasses, riverPerf);
  if (feederPasses > 0) {
    for (let mi = 0; mi < masses.length; mi++) {
      const mass = masses[mi];
      generatePhase3ShortRivers(
        new Set(mass),
        tributaryCell,
        seaDist,
        gridCtx,
        feederMinLen,
        feederMinSourceSep,
        feederPasses,
      );
      report(70 + ((mi + 1) / nMasses) * 18);
    }
  } else {
    report(88);
  }
  if (RIVER_PROFILE_ON) rpEnsure().genStage3Ms += rpNow() - _s3T0;

  // Dekoracyjne dopływy — pomijane na Pangei i dużych mapach (perf).
  const _decorT0 = RIVER_PROFILE_ON ? rpNow() : 0;
  if (!pangeaSingleMass && !largeMapPerf) {
    const pathCountBeforeDecor = riverPaths.length;
    for (let i = 0; i < pathCountBeforeDecor; i++) {
      if (riverKinds[i] !== 'main') continue;
      const path = riverPaths[i];
      if (!path || path.length < 10) continue;
      addTributariesForMainRiver(
        hexes, path, seaDist, rand, maxLen, riverPaths, riverKinds, usedSources, minSourceSep,
        width, height, oceanConnected,
        riverParams.areaScale,
        riverParams.reliefSearchMin,
        riverParams.reliefSearchMax,
      );
      if (i % 3 === 0) report(88 + (i / Math.max(1, pathCountBeforeDecor)) * 8);
    }
  } else {
    report(96);
  }
  if (RIVER_PROFILE_ON) rpEnsure().genDecorMs += rpNow() - _decorT0;

  // Lekkie domknięcie suchych płatów — także Pangea / duże mapy (jakość > perf cut).
  const _genDryT0 = RIVER_PROFILE_ON ? rpNow() : 0;
  for (let mi = 0; mi < masses.length; mi++) {
    const mass = masses[mi];
    if (!mass) continue;
    const massSet = new Set(mass);
    const massProfile = riverRoundProfile(mass.length, riverPerf);
    enforceMaxDryLowlandPatches(massSet, gridCtx, massProfile);
    report(96 + ((mi + 1) / nMasses) * 4);
  }
  if (RIVER_PROFILE_ON) rpEnsure().genDryPatchMs += rpNow() - _genDryT0;

  report(100);
  syncRiverEdgeBonusHexes(hexes);
  if (RIVER_PROFILE_ON) rpEnsure().generateRiversMs += rpNow() - _genT0;
  return { paths: riverPaths, kinds: riverKinds };
}

/**
 * Domyka twardy fill startów siatki po finalnym terenie (Maciej 2026-07-31).
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
  riverParams?: RiverMapParams,
  onProgress?: (localPct: number) => void,
): number {
  const _topT0 = RIVER_PROFILE_ON ? rpNow() : 0;
  const params = riverParams ?? resolveRiverMapParams(riversTier, width, height);

  const masses = groupLandMassKeys(hexes)
    .filter((m) => m.length >= 5)
    .sort((a, b) => b.length - a.length);
  const riverPerf = buildRiverPerfCtx(masses, params.areaScale);
  const topUpPasses = effectiveTopUpPasses(params.topUpPasses, riverPerf);
  if (topUpPasses === 0) {
    onProgress?.(100);
    if (RIVER_PROFILE_ON) rpEnsure().topUpMs += rpNow() - _topT0;
    return 0;
  }

  const { seaDist, oceanConnected, openOceanDist } = buildRiverFieldCache(hexes, width, height);
  const usedSources = new Set<string>();
  for (let i = 0; i < riverPaths.length; i++) {
    const p0 = riverPaths[i]?.[0];
    if (p0) usedSources.add(hexKey(p0.q, p0.r));
  }

  const { pangeaSingleMass, largeMapPerf } = riverPerf;
  const cellSize = params.mainCell;
  const minSourceSep = Math.max(2, Math.floor(cellSize * 0.25));
  const traceOptsBase = {
    hardMeanderLen: params.hardMeanderLen,
    mouthTailLen: params.mouthTailLen,
  };
  const seaBufferOpts = {
    minInland: params.minInlandFromSea,
    mouthTail: params.mouthTailLen,
  };

  const mainKeysCache = new Set<string>();
  for (let i = 0; i < riverPaths.length; i++) {
    if (riverKinds[i] !== 'main') continue;
    addPathKeysToSet(riverPaths[i] ?? [], mainKeysCache);
  }
  const topUpSepIndex = RiverHexSpatialIndex.fromKeys(mainKeysCache);
  const usedMediumSpawnKeys = new Set<string>();
  for (let i = 0; i < riverPaths.length; i++) {
    if (riverKinds[i] !== 'medium') continue;
    const p0 = riverPaths[i]?.[0];
    if (p0 && mainKeysCache.has(hexKey(p0.q, p0.r))) {
      usedMediumSpawnKeys.add(hexKey(p0.q, p0.r));
    }
  }

  const pushMain = (path: RiverCoord[], sq: number, sr: number): boolean => {
    const mainKeys = collectPathHexKeysForKinds(riverPaths, riverKinds, ['main']);
    if (isPathTooCloseToRiverHexes(path, mainKeys, MAIN_RIVER_MIN_PATH_SEP, topUpSepIndex)) return false;
    const finalized = finalizeMainRiverPath(hexes, path, width, height, oceanConnected);
    if (!finalized) return false;
    riverPaths.push(finalized);
    riverKinds.push('main');
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, finalized);
    addPathKeysToSet(finalized, mainKeysCache);
    topUpSepIndex.addPath(finalized);
    return true;
  };

  const pushTributary = (path: RiverCoord[], sq: number, sr: number): boolean => {
    const out = finalizeTributaryPath(
      hexes, path, riverPaths, riverKinds, width, height, oceanConnected,
    );
    if (!out) return false;
    riverPaths.push(out);
    riverKinds.push('tributary');
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, out);
    return true;
  };

  const pushMedium = (path: RiverCoord[], sq: number, sr: number): boolean => {
    const out = finalizeMediumPath(
      hexes, path, riverPaths, riverKinds, width, height, oceanConnected,
    );
    if (!out) return false;
    riverPaths.push(out);
    riverKinds.push('medium');
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, out);
    return true;
  };

  const gridCtx: GridSourcePlaceCtx = {
    hexes, width, height, riverPaths, riverKinds, usedSources,
    seaDist, openOceanDist, oceanConnected, rand,
    minLen: params.minLen, maxLen, acceptLen: params.gridTraceMinLen,
    traceMinLen: params.gridTraceMinLen, sourceSep: minSourceSep,
    traceOptsBase, seaBufferOpts, pushMain, pushTributary, pushMedium,
    placeMode: 'medium',
    pangeaSingleMass, largeMapPerf, mainKeysCache,
    usedMediumSpawnKeys,
  };

  let placed = 0;
  const totalSteps = Math.max(1, topUpPasses * masses.length);
  let step = 0;
  for (let pass = 0; pass < topUpPasses; pass++) {
    const _passT0 = RIVER_PROFILE_ON ? rpNow() : 0;
    let passPlaced = 0;
    const isLastPass = pass === topUpPasses - 1;
    for (const mass of masses) {
      const massSet = new Set(mass);
      setMassRiverTargets(hexes, massSet, gridCtx);
      const massProfile = riverRoundProfile(mass.length, riverPerf);
      if (massProfile === 'normal' || pass === 0 || isLastPass) {
        const _hsT0 = RIVER_PROFILE_ON ? rpNow() : 0;
        passPlaced += generateMediumTributariesFromMainRivers(gridCtx, massSet, maxLen);
        if (RIVER_PROFILE_ON) rpEnsure().topUpHardStartsMs += rpNow() - _hsT0;
      }
      if (massProfile === 'normal' || isLastPass) {
        const _dpT0 = RIVER_PROFILE_ON ? rpNow() : 0;
        enforceMaxDryLowlandPatches(massSet, gridCtx, massProfile);
        if (RIVER_PROFILE_ON) rpEnsure().topUpDryPatchMs += rpNow() - _dpT0;
        const _gpT0 = RIVER_PROFILE_ON ? rpNow() : 0;
        passPlaced += ensureRiverGridAndProximity(
          hexes, massSet, cellSize, seaDist, gridCtx, riverProximityEnforceTarget(cellSize), massProfile,
        );
        if (RIVER_PROFILE_ON) rpEnsure().topUpGridProxMs += rpNow() - _gpT0;
      }
      step++;
      onProgress?.(Math.min(100, (step / totalSteps) * 100));
    }
    if (RIVER_PROFILE_ON) rpEnsure().topUpPassMs.push(rpNow() - _passT0);
    placed += passPlaced;
    if (passPlaced === 0) break;
  }
  onProgress?.(100);
  if (RIVER_PROFILE_ON) rpEnsure().topUpMs += rpNow() - _topT0;
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
 * - zloto -> hex.zloze='zloto' na Wzgórza/Góry (złoto żyłowe, jak historyczne złoża
 *   Nubii/Anatolii/Iberii — Maciej 2026-07-25: „mennica potrzebuje złota w terenie”).
 *   CELOWO NIE w FAIR_PLAY_DEPOSIT_IDS — złoto ma być RZADKIE, o które się rywalizuje,
 *   nie gwarantowany zasób każdego imperium (patrz rarity niżej — niższa niż miedź/żelazo).
 * Bydło / owce — złoże na mapie = implicit ulepszenie hodowli (render + plony).
 * Morze/wybrzeże: brak złóż; ryby = przyszłe ulepszenie „łodzie rybackie”, nie nakładka.
 */
export interface DepositRule {
  id: 'miedz' | 'zelazo' | 'glina' | 'konie' | 'wegiel' | 'owce' | 'bydlo' | 'sol' | 'zloto' | 'cyna';
  /** Wartosc Nakladka do ustawienia (lub null gdy uzywamy pola `zloze`). */
  nakladka: Nakladka | null;
  /** Predykat: czy ten heks moze przyjac to zloze. */
  allowedOn: (hex: Hex) => boolean;
  /**
   * Gdy true — dodatkowo wymaga, by heks byl LADEM najblizszym wybrzeza
   * (suchy lad graniczacy z PlytkieMorze/Morze — isCoastalLandHex).
   * C-MAP-SOL-ZIEMIA=B (Maciej 2026-07-25): tak zdefiniowane wybrzeze dziala
   * takze na mapie Ziemia (brak kafli PlytkieMorze, ale jest lad przy Morzu).
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
    rarity: 0.30,
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
  {
    // Maciej 2026-07-25: złoto jako surowiec DOSTĘPOWY dla Mennicy — „wystarczy tylko
    // dostęp, nie trzeba budować wielu kopalni". Reguła terenowa: żyłowe w Górach/Wzgórzach
    // (Nubia, Anatolia, Iberia) — forma okruchowa (rzeki) świadomie pominięta (uproszczenie,
    // patrz RAPORT KOŃCOWY zloto-test.cjs). Rzadkość dużo niższa niż miedź (0.10) / żelazo
    // (0.08) — dobrana empirycznie w map-gen-params.json tak, by przy tym samym typie/rozmiarze
    // mapy złoto liczebnie wypadało rzadsze niż miedź (patrz zloto-test.cjs).
    id: 'zloto',
    nakladka: null,
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy)
      && (h.terenBazowy === TerenBazowy.Wzgorza || h.terenBazowy === TerenBazowy.Gory),
    rarity: 0.03,
  },
  {
    // Ruda cyny (2026-08-13, spec Maciej): jak złoto — jeden wzorzec Wzgórza/Góry (oba typy
    // terenu), ale GWARANTOWANY każdej cywilizacji (patrz FAIR_PLAY_DEPOSIT_IDS niżej) —
    // w przeciwieństwie do złota, celowo wykluczonego z tej listy. Rzadkość = miedź (0.10) / 5.
    id: 'cyna',
    nakladka: null,
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy)
      && (h.terenBazowy === TerenBazowy.Wzgorza || h.terenBazowy === TerenBazowy.Gory),
    rarity: 0.02,
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
 *   - las (Nakladka.Las) NIE blokuje spawnu — zloze w polu hex.zloze, las zostaje (widoczne razem);
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
    owce: 0, bydlo: 0, sol: 0, zloto: 0, cyna: 0,
  };

  for (const key of keys) {
    const hex = hexes[key] as HexWithZloze | undefined;
    if (!hex) continue;
    // Las nie blokuje złoża (Maciej 2026-07-29) — surowiec pod pokrywą lasu; inne nakładki tak.
    if (hex.zloze) continue;
    if (nakladkaBlocksDepositSpawn(hex.nakladka)) continue;
    // Woda nigdy nie dostaje złoża. C-MAP-SOL-ZIEMIA=B: sól nie jest już na kaflu Wybrzeże,
    // tylko na LĄDZIE przy wybrzeżu (requiresCoastalLand niżej) — więc Wybrzeże, jak Morze,
    // jest wykluczone dla wszystkich złóż.
    if (isWaterTerrainLocal(hex.terenBazowy)) continue;

    const [depQ, depR] = key.split(',').map(Number) as [number, number];
    for (const rule of rules) {
      if (!rule.allowedOn(hex)) continue;
      // C-MAP-SOL-ZIEMIA=B: reguła „ląd przy wybrzeżu" (sól) — suchy ląd graniczący z wodą.
      if (rule.requiresCoastalLand && !isCoastalLandHex(hexes, depQ, depR)) continue;
      // Rzut PRNG dla kazdej pasujacej reguly — deterministyczny przy danym seed.
      if (rand() < Math.min(1, rule.rarity * baselineMult * resourceMult)) {
        applyDepositToHex(hex, rule);
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

/** Pakiet surowców wymagany w każdej komórce siatki fair play (Maciej 2026-07-04). Konie wyłączone — mają być rzadkie.
 *  Cyna dopisana 2026-08-13 (spec Maciej): mimo 5× rzadszego złoża niż miedzi, KAŻDA cywilizacja
 *  ma mieć gwarantowany dostęp do co najmniej jednego złoża — jak żelazo/miedź/glina, NIE jak złoto
 *  (świadomie wykluczone, patrz komentarz przy regule 'zloto' wyżej). */
export const FAIR_PLAY_DEPOSIT_IDS: ReadonlyArray<DepositRule['id']> = [
  'zelazo', 'miedz', 'glina', 'cyna', // Model B: bydlo/owce usunięte (hodowla = ulepszenie, nie złoże)
];

function depositRuleById(id: DepositRule['id']): DepositRule {
  const rule = DEPOSIT_RULES.find((r) => r.id === id);
  if (!rule) throw new Error(`Brak reguły złoża: ${id}`);
  return rule;
}

function hexCarriesDepositType(hex: HexWithZloze, id: DepositRule['id']): boolean {
  if (hex.zloze === id) return true;
  const rule = depositRuleById(id);
  if (rule.nakladka !== null) return hex.nakladka === rule.nakladka;
  return false;
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

/** Las nie blokuje spawnu złoża — inne nakładki (ruda, glina itd.) tak. */
function nakladkaBlocksDepositSpawn(nakladka: Nakladka): boolean {
  return nakladka !== Nakladka.Brak && nakladka !== Nakladka.Las;
}

function hexCanAcceptDeposit(hex: HexWithZloze, rule: DepositRule): boolean {
  // C-MAP-SOL-ZIEMIA=B: żadne złoże nie ląduje na wodzie (sól jest teraz na LĄDZIE przy
  // wybrzeżu, nie na kaflu PlytkieMorze) — PlytkieMorze, jak Morze, wykluczone dla wszystkich złóż.
  if (isWaterTerrainLocal(hex.terenBazowy)) return false;
  if (hex.zloze) return false;
  if (nakladkaBlocksDepositSpawn(hex.nakladka)) return false;
  return rule.allowedOn(hex);
}

function applyDepositToHex(hex: HexWithZloze, rule: DepositRule): void {
  if (hex.nakladka === Nakladka.Las) {
    hex.zloze = rule.id;
  } else if (rule.nakladka !== null) {
    hex.nakladka = rule.nakladka;
  } else {
    hex.zloze = rule.id;
  }
  if (rule.id === 'miedz' && hex.zlozeMinEra == null) hex.zlozeMinEra = 2;
  if (rule.id === 'zelazo' && hex.zlozeMinEra == null) hex.zlozeMinEra = 3;
}

function forceDepositOnHex(hex: HexWithZloze, rule: DepositRule): void {
  applyDepositToHex(hex, rule);
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
    case 'cyna':
      // Cyna: allowedOn dopuszcza Wzgórza LUB Góry (jak złoto) — bootstrap wymusza JEDNO
      // z nich (Wzgórza, jak miedź) dla determinizmu, analogicznie do miedzi/owiec wyżej.
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
      if (!hex || isWaterTerrainLocal(hex.terenBazowy)) {
        return false;
      }
      // 'glina' nie wymusza już terenu (TEMAT 12, patrz prepareTerrainForDeposit) — jej regula
      // wymaga prawdziwej h.rzeka.obecna, ktorej bootstrap nie moze wytworzyc (geometria rzek
      // jest juz finalna na tym etapie; TEMAT 12 usunelo fabrykowanie falszywej rzeka.obecna).
      // Bootstrap MUSI wiec nadal respektowac rule.allowedOn dla gliny — w przeciwnym razie
      // zloze ladowaloby na hexie bez rzeki i lamalo DEPOSIT_RULES (logic-test: "deposits obey
      // terrain rules"). Dla pozostalych id w tej funkcji (zelazo/miedz/wegiel/konie/bydlo)
      // prepareTerrainForDeposit ponizej wymusza wlasciwy teren, wiec rule.allowedOn zawsze
      // bedzie spelnione PO forsowaniu — nie trzeba filtrowac ich tutaj z gory.
      if (rule.id === 'glina' && !rule.allowedOn(hex)) return false;
      return true;
    })
    .map(([q, r]) => ({ q, r, score: rand() }))
    .sort((a, b) => b.score - a.score);
  if (ranked.length === 0) return null;
  const spot = ranked[0]!;
  prepareTerrainForDeposit(hexes[hexKey(spot.q, spot.r)]!, rule);
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
  const ranked = land
    .filter(([q, r]) => {
      const hex = hexes[hexKey(q, r)] as HexWithZloze | undefined;
      return hex != null && hexCanAcceptDeposit(hex, rule);
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
    if (!cellCanHostDepositPackage(land, hexes, minLand)) continue;
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
  _typ: TypSwiata,
  _continentOf: Map<string, number> | null,
  _nContinents: number,
  rand: () => number,
): number {
  const cellSize = fairPlayResourceCellSize(tier);
  const minLand = minLandHexesForFairPlayCell(cellSize);
  // fair-play-grid-test.cjs mierzy pokrycie per SPÓJNA masa lądu (groupLandMassKeys), nie strefa
  // Voronoi — ensureReliefGridCoverage / ensureForestGridCoverage robią tak samo (C-MAPA-Q1=B).
  const partitions = groupLandMassKeys(hexes).filter((m) => m.length >= 8);
  let fixed = 0;

  for (const part of partitions) {
    const massSet = new Set(part);
    for (let pass = 0; pass < 10; pass++) {
      let passFixed = 0;
      for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
        if (!cellCanHostDepositPackage(land, hexes, minLand)) continue;
        for (const id of FAIR_PLAY_DEPOSIT_IDS) {
          if (forceDepositInCell(land, hexes, id, rand)) passFixed++;
        }
      }
      fixed += passFixed;
      if (passFixed === 0) break;
    }
    // Domknięcie fair-play: komórki bez pełnego pakietu (żelazo+miedź+glina)
    for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
      if (!cellCanHostDepositPackage(land, hexes, minLand)) continue;
      for (const id of FAIR_PLAY_DEPOSIT_IDS) {
        if (!cellCarriesDepositType(land, hexes, id)) {
          forceDepositInCell(land, hexes, id, rand);
        }
      }
    }
  }

  // Bezpiecznik dla twardego limitu skupiska (Maciej 2026-07-25, PYTANIE 63): bootstrap
  // powyżej (pickDepositBootstrapHex → prepareTerrainForDeposit) w RZADKICH przypadkach
  // (komórka bez ŻADNEGO istniejącego heksu Gór/Wzgórz na 'zelazo'/'miedz') wymusza NOWY
  // heks Gór/Wzgórz PO tym, jak growMountainRanges już przyciął skupiska do
  // MAX_MOUNTAIN_RANGE_CLUSTER_SIZE — może więc doszyć jeden heks do już przyciętego
  // skupiska i przebić limit o 1. To JEDYNE miejsce w pipeline (poza growMountainRanges),
  // gdzie teren bywa wymuszany na Gory/Wzgorza (patrz prepareTerrainForDeposit), więc
  // powtórzenie cappingu tutaj domyka regułę właściciela na całej mapie. Brak `scratch` w
  // sygnaturze tej funkcji (nie zmieniamy generator.ts) — pusta mapa oznacza remis rozstrzyga
  // wyłącznie klucz heksu (nadal w pełni deterministyczne, zero Math.random).
  capMountainRangeClusterSize(
    hexes, new Map(), TerenBazowy.Gory, TerenBazowy.Rownina, MAX_MOUNTAIN_RANGE_CLUSTER_SIZE,
  );
  capMountainRangeClusterSize(
    hexes, new Map(), TerenBazowy.Wzgorza, TerenBazowy.Rownina, MAX_MOUNTAIN_RANGE_CLUSTER_SIZE,
  );

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
    if (eligibleForestLandCount(land, hexes) < minLand) continue;
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

  for (let outer = 0; outer < 6; outer++) {
    let passFixed = 0;
    for (const mass of masses) {
      const massSet = new Set(mass);
      for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
        if (eligibleForestLandCount(land, hexes) < minLand || cellHasForest(land, hexes)) continue;
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
    if (!isWaterTerrainLocal(hex.terenBazowy)) continue;
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
    if (!isWaterTerrainLocal(hex.terenBazowy)) continue;
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
