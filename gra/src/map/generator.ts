/**
 * generator.ts
 * Deterministyczny generator mapy hex dla The Game.
 *
 * Konwencja heksów: POINTY-TOP aksjalne (q, r).
 * Algorytm: mulberry32 PRNG + 2D value-noise (fBm) → kształt zależny od
 *   TypSwiata (kontynenty/pangea/wyspy), pasma wzgórz/gór, lasy jako nakładka,
 *   trochę pustyni. Następnie: rzeki, złoża mineralne, pozycje startowe.
 *
 * Logika szumu/terenu/rzek/złóż/startów żyje w ./gen-helpers (testowalne,
 * nazwane helpery). Ten plik tylko je składa w jeden przebieg generacji.
 */

import type { GameMap } from '../types/map';
import type { Hex, HexCoords } from '../types/hex';
import { Ulepszenie, Widocznosc, TerenBazowy, Nakladka } from '../types/hex';
import {
  mulberry32,
  buildPermTable,
  fbm,
  defaultShapeParams,
  landMaskAt,
  landMaskKontynenty,
  landMaskPangea,
  landMaskWyspy,
  landMaskZiemia,
  buildContinentCenters,
  buildFiveZoneContinentCenters,
  buildSixteenGridIslandCenters,
  continentCenterCount,
  classifyTerrain,
  terrainCellBias,
  climateZoneAt,
  countLandSeaHexes,
  removeSmallInlandWaterPools,
  removeInlandWaterPools,
  findInlandSeaHexes,
  purgeInlandWaterForMultiLandTyp,
  removeInlandSeaPools,
  removeTinyLandIslands,
  countOpenOceanLandSpecks,
  finalizeLandMassAfterCoast,
  applyLandFractionByScore,
  applyLandFractionByContinent,
  assignContinentIndices,
  assignIslandGridIndices,
  reapplyLandTerrain,
  reapplyForestOverlay,
  applyReliefByNoiseRank,
  ensureReliefGridCoverage,
  applyMarginalLandZoneCaps,
  rebalanceLandFractionWithMargins,
  enforceMapBorderOcean,
  isInMapBorder,
  type ReliefDensityTier,
  type TerrainScratch,
  type TerrainClassifyThresholds,
  rebalanceLandSeaRatio,
  trimDeepOceanBays,
  trimEnclosedOceanOnly,
  applyJaggedCoastNoise,
  finalizeCoastAndInlandWater,
  enforceEarthTemplateOnHexes,
  generateRivers,
  topUpRiverGridCoverage,
  clearRiverMarks,
  placeDeposits,
  ensureDepositGridCoverage,
  ensureForestGridCoverage,
  stripDepositsFromWater,
  stripRiverMarksFromOpenSea,
  computeStartPositions,
  purgeOceanInsideEarthLandMask,
  purgeReliefValleyWater,
  purgeDesertEnclaveWater,
  thickenCoastAndSmoothInlets,
  type StartPosition,
  type TypSwiata,
} from './gen-helpers';
import { pruneOrphanRiverPaths } from './gen-helpers';
import { placeVillages } from './villages';
import { resolveWorldGenNumbers, resolveLandFraction, type WorldGenOptions } from './newGameMapDefaults';
import { mapGenRozmiarDims } from '../data/map-gen-params-loader';
import { normPlMenuLabel } from '../util/norm-pl-label';

export type { WorldGenOptions };

// ---------------------------------------------------------------------------
// Rozmiar mapy + typ wyniku
// ---------------------------------------------------------------------------

/** Mały roboczy rozmiar mapy: ~36×28 heksów (pasuje pod ~6 rywali). */
export const DEFAULT_WIDTH  = 36;
export const DEFAULT_HEIGHT = 28;

/**
 * GameMap rozszerzona o opcjonalne pozycje startowe.
 * Dodatek wstecznie zgodny — przypisywalny do GameMap, wiec main.ts i pozostali
 * konsumenci dzialaja bez zmian; pole `startPositions` jest opcjonalne.
 */
export type GameMapWithStarts = GameMap & {
  /** Deterministyczne pozycje startowe (>=5, parami oddalone >=5) na ladzie. */
  startPositions?: StartPosition[];
};

/**
 * Generuje GameMap deterministycznie ze złożoności ziarna `seed`.
 *
 * @param width   Szerokość mapy w heksach (domyślnie 36)
 * @param height  Wysokość mapy w heksach (domyślnie 28)
 * @param seed    Ziarno PRNG (domyślnie 42); 0 → zostanie użyte 42
 * @param typ     Typ świata: 'kontynenty' (domyślnie) | 'pangea' | 'wyspy' | 'ziemia'
 */
export function generateMap(
  width  = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  seed   = 42,
  typ: TypSwiata = 'kontynenty',
  genOpts?: WorldGenOptions,
): GameMapWithStarts {
  // Jeśli seed=0 lub undefined, użyj domyślnego 42
  const effectiveSeed = seed || 42;
  const wgn = resolveWorldGenNumbers(genOpts);
  const landFraction = resolveLandFraction(genOpts, typ);
  const terrainTh: TerrainClassifyThresholds = {
    desert: wgn.desertThreshold,
    forest: wgn.forestThreshold,
    mountain: wgn.mountainThreshold,
    highland: wgn.highlandThreshold,
  };

  const rand = mulberry32(effectiveSeed);
  const perm = buildPermTable(rand);

  // Parametry ksztaltowania (offsety pobieraja rand() w ustalonej kolejnosci).
  const shape = defaultShapeParams(rand);
  // Skala szumu wzgledem rozmiaru — bez tego duze mapy maja „plamy” zamiast kontynentow.
  const sizeNorm = Math.max(width, height) / DEFAULT_WIDTH;
  shape.noiseScale    /= sizeNorm;
  // Góry: łagodniejsze skalowanie niż reszta — zachowaj więcej pasm na dużych mapach.
  shape.mountainScale /= Math.sqrt(sizeNorm);
  shape.forestScale   /= sizeNorm;
  shape.desertScale   /= sizeNorm;

  // Centra kontynentów (pobierane z rand() ZAWSZE — zachowuje deterministyczność
  // sekwencji rand, niezależnie od tego czy typ='kontynenty').
  const nCenters = continentCenterCount(width, height, typ);
  const radiusBoost = Math.max(0, (landFraction - 0.5) * 0.28);
  const sparseLand = landFraction <= 0.35;
  const kontynentyRadiusMin = (sparseLand ? 0.11 : 0.13) + radiusBoost;
  const kontynentyRadiusMax = (sparseLand ? 0.19 : 0.23) + radiusBoost;

  let zoneCenters;
  if (typ === 'kontynenty') {
    zoneCenters = buildFiveZoneContinentCenters(rand, width, height, kontynentyRadiusMin, kontynentyRadiusMax);
  } else if (typ === 'wyspy') {
    zoneCenters = buildSixteenGridIslandCenters(rand, width, height);
  } else {
    zoneCenters = buildContinentCenters(
      rand,
      nCenters,
      { width, height, anchorCenter: typ === 'pangea' },
    );
  }

  const nZones = typ === 'kontynenty' || typ === 'wyspy' ? zoneCenters.length : 0;
  const zoneOf = typ === 'kontynenty'
    ? assignContinentIndices(width, height, zoneCenters)
    : typ === 'wyspy'
      ? assignIslandGridIndices(width, height)
      : null;

  const hexes: Record<string, Hex> = {};
  const landScores = new Map<string, number>();
  const terrainScratch = new Map<string, TerrainScratch>();

  // ── Przebieg 1: teren bazowy + las (szum → klasyfikacja) ──────────────────
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      const coords: HexCoords = { q, r };
      const key = `${q},${r}`;

      // Maska kontynentalna zalezy od TypSwiata.
      let landMask: number;
      if (typ === 'pangea') {
        landMask = landMaskPangea(q, r, width, height, perm, shape.noiseScale, sparseLand);
      } else if (typ === 'wyspy') {
        landMask = landMaskWyspy(q, r, width, height, zoneCenters, perm, shape.noiseScale);
      } else if (typ === 'ziemia') {
        landMask = landMaskZiemia(q, r, width, height, perm, shape.noiseScale);
      } else {
        landMask = landMaskKontynenty(q, r, width, height, zoneCenters, perm, shape.noiseScale);
      }

      if (isInMapBorder(q, r, width, height)) {
        landMask = 0;
      }

      landScores.set(key, landMask);

      // Szum bazowy (elevation) + przemnozenie przez maske.
      const elevation = fbm(perm, q * shape.noiseScale, r * shape.noiseScale, 4);
      const elevContinental = elevation * landMask;

      // Szumy pomocnicze (gory/las/pustynia) z offsetami.
      const mtnNoise = fbm(perm, q * shape.mountainScale + shape.offMtnX, r * shape.mountainScale + shape.offMtnY, 3);
      const forNoise = fbm(perm, q * shape.forestScale   + shape.offForX, r * shape.forestScale   + shape.offForY, 3);
      const desNoise = fbm(perm, q * shape.desertScale   + shape.offDesX, r * shape.desertScale   + shape.offDesY, 3);

      const { terenBazowy, nakladka } =
        classifyTerrain(
          elevContinental,
          landMask,
          mtnNoise,
          forNoise,
          desNoise,
          terrainTh,
          climateZoneAt(q, r, height),
          terrainCellBias(q, r, effectiveSeed),
        );

      terrainScratch.set(key, { elevContinental, landMask, mtnNoise, forNoise, desNoise });

      hexes[key] = {
        coords,
        terenBazowy,
        nakladka,
        ulepszenie:  Ulepszenie.Brak,
        wlasciciel:  null,
        wioska:      { istnieje: false, ludnosc: 0 },
        widocznosc:  {} as Record<string, Widocznosc>,
        rzeka:       { obecna: false, krawedzie: [] },
      };
    }
  }

  // ── Przebieg 1a: usuń zamknięte morze + głębokie zatoki ─────────────────────
  const coastOpts = typ === 'pangea'
    ? { maxInlandPoolSize: 24 }
    : typ === 'kontynenty'
      ? { maxInlandPoolSize: 8 }
      : undefined;
  if (typ === 'kontynenty') {
    removeSmallInlandWaterPools(hexes, width, height, 8);
    trimEnclosedOceanOnly(hexes, width, height);
  } else if (typ !== 'pangea') {
    removeInlandWaterPools(hexes, width, height);
  } else {
    removeInlandSeaPools(hexes, width, height);
  }
  if (typ === 'pangea') {
    trimDeepOceanBays(hexes, width, height);
  }
  finalizeCoastAndInlandWater(hexes, width, height, 3, coastOpts);

  // ── Przebieg 1c: usuń drobne wysepki (szum) ─────────────────────────────────
  if (typ === 'kontynenty' || typ === 'pangea') {
    removeTinyLandIslands(hexes, typ === 'kontynenty' ? 8 : 10);
    if (typ === 'pangea') {
      trimDeepOceanBays(hexes, width, height);
    }
    finalizeCoastAndInlandWater(hexes, width, height, 3, coastOpts);
  }

  // ── Przebieg 1d: docelowy udział lądu vs morze (preset typu + suwak zaawansowany) ─
  enforceMapBorderOcean(hexes, width, height);
  if ((typ === 'kontynenty' || typ === 'wyspy') && zoneOf) {
    applyLandFractionByContinent(hexes, landScores, zoneOf, nZones, landFraction, width, height);
    applyMarginalLandZoneCaps(hexes, landScores, width, height);
    applyJaggedCoastNoise(hexes, perm, width, height, 2);
    removeTinyLandIslands(hexes, typ === 'wyspy' ? 4 : 5);
    trimEnclosedOceanOnly(hexes, width, height);
  } else if (typ === 'ziemia') {
    enforceEarthTemplateOnHexes(hexes, width, height);
    purgeOceanInsideEarthLandMask(hexes, width, height);
  } else {
    rebalanceLandFractionWithMargins(hexes, landScores, landFraction, width, height);
  }
  enforceMapBorderOcean(hexes, width, height);
  if (typ !== 'pangea') {
    purgeInlandWaterForMultiLandTyp(hexes, width, height);
  } else {
    purgeInlandWaterForMultiLandTyp(hexes, width, height);
  }
  finalizeCoastAndInlandWater(hexes, width, height, 3, coastOpts);

  // ── Przebieg 1e: przywróć ukształtowanie + gwarantowany relief (tier) ───────
  const reliefTier: ReliefDensityTier =
    genOpts?.worldDensity?.relief ?? genOpts?.worldDensity?.rivers ?? 'medium';
  const forestTier = genOpts?.worldDensity?.forest ?? 'medium';
  reapplyLandTerrain(hexes, terrainScratch, effectiveSeed, terrainTh, height);
  if (typ !== 'pangea') {
    purgeInlandWaterForMultiLandTyp(hexes, width, height);
  }
  applyReliefByNoiseRank(hexes, terrainScratch, reliefTier, width, height, typ, zoneOf, nZones);
  reapplyForestOverlay(hexes, terrainScratch, terrainTh, typ, forestTier, zoneOf, nZones, height);
  enforceMapBorderOcean(hexes, width, height);
  if (typ !== 'pangea') {
    purgeInlandWaterForMultiLandTyp(hexes, width, height);
  }
  finalizeCoastAndInlandWater(hexes, width, height, 2, coastOpts);

  purgeReliefValleyWater(hexes, width, height);

  // ── Przebieg 3: sanity woda/ląd + bufor plaży (PRZED złożami — patrz 3e) ───
  if (typ === 'pangea') {
    trimDeepOceanBays(hexes, width, height);
  }
  finalizeCoastAndInlandWater(hexes, width, height, 3, coastOpts);

  // ── Przebieg 3c: ostatnie zamknięte morze w lądzie ─────────────────────────
  purgeInlandWaterForMultiLandTyp(hexes, width, height);
  if (typ === 'kontynenty' || typ === 'wyspy') {
    trimEnclosedOceanOnly(hexes, width, height);
    purgeReliefValleyWater(hexes, width, height);
  }
  enforceMapBorderOcean(hexes, width, height);
  finalizeCoastAndInlandWater(hexes, width, height, 3, coastOpts);

  // ── Przebieg 3d: docelowy udział lądu (po wypełnieniach wody→łąka) ─────────
  if (typ === 'ziemia') {
    enforceEarthTemplateOnHexes(hexes, width, height);
    purgeOceanInsideEarthLandMask(hexes, width, height);
  } else {
    rebalanceLandFractionWithMargins(hexes, landScores, landFraction, width, height);
  }
  if (typ !== 'ziemia') {
    applyJaggedCoastNoise(hexes, perm, width, height, 1);
  }
  removeSmallInlandWaterPools(hexes, width, height, 14);
  purgeInlandWaterForMultiLandTyp(hexes, width, height);
  trimDeepOceanBays(hexes, width, height);
  finalizeCoastAndInlandWater(hexes, width, height, 2, coastOpts);
  enforceMapBorderOcean(hexes, width, height);
  if (typ === 'ziemia') {
    enforceEarthTemplateOnHexes(hexes, width, height);
    purgeOceanInsideEarthLandMask(hexes, width, height);
    finalizeCoastAndInlandWater(hexes, width, height, 2, coastOpts);
    enforceEarthTemplateOnHexes(hexes, width, height);
    purgeOceanInsideEarthLandMask(hexes, width, height);
  }
  // ── Przebieg 3e-pre: wysepki-szum po finalnym wybrzeżu (pustynia/łąka w oceanie) ─
  finalizeLandMassAfterCoast(hexes, typ, width, height, coastOpts, 2);
  // ── Przebieg 3f: złoża DOPIERO po finalnym wybrzeżu (relief siatka przed rzekami) ─
  placeDeposits(hexes, effectiveSeed, undefined, wgn.resourceMult, wgn.resourceBaseline);
  ensureDepositGridCoverage(hexes, reliefTier, typ, zoneOf, nZones, rand);
  // ── Bezpiecznik: drobne wyspy po bootstrap złóż ───────────────────────────
  finalizeLandMassAfterCoast(hexes, typ, width, height, coastOpts, 1);
  // ── Przebieg 3g: siatki fair play relief + las (po finalnym lądzie, przed rzekami) ─
  ensureReliefGridCoverage(
    hexes, terrainScratch, reliefTier, width, height, typ, zoneOf, nZones, rand,
  );
  ensureDepositGridCoverage(hexes, reliefTier, typ, zoneOf, nZones, rand);
  ensureForestGridCoverage(hexes, terrainScratch, forestTier, typ, zoneOf, nZones, rand);
  // ── Przebieg 3h-pre: ostatni purge wody→ląd PRZED rzekami (B0.1 — nie kasować ujść) ─
  purgeInlandWaterForMultiLandTyp(hexes, width, height);
  purgeDesertEnclaveWater(hexes, width, height);
  // ── Przebieg 3h-coast: grubsze (≥2 hex) + gładsze wybrzeże PRZED rzekami (Zmiana 2) ─
  thickenCoastAndSmoothInlets(hexes, width, height, 2);
  enforceMapBorderOcean(hexes, width, height);
  // ── Przebieg 3h: rzeki DOPIERO po finalnym wybrzeżu (Maciej: bufor 2 hex od morza) ─
  const riversTier = genOpts?.worldDensity?.rivers ?? 'medium';
  clearRiverMarks(hexes);
  let { paths: riverPaths, kinds: riverPathKinds } = generateRivers(hexes, width, height, rand, {
    minLen: wgn.riverTrace.minLen,
    maxLen: wgn.riverTrace.maxLen,
    margin: wgn.riverTrace.margin,
    riversTier,
    worldTyp: typ,
  });
  topUpRiverGridCoverage(
    hexes,
    width,
    height,
    riverPaths,
    riverPathKinds,
    rand,
    riversTier,
    wgn.riverTrace.minLen,
    wgn.riverTrace.maxLen,
  );
  stripRiverMarksFromOpenSea(hexes);
  stripDepositsFromWater(hexes);
  // B0.7/B0.8: „zero sierot" — usun sciezki niepolaczone z morzem (finalny stan, jak widzi test).
  ({ paths: riverPaths, kinds: riverPathKinds } = pruneOrphanRiverPaths(hexes, riverPaths, riverPathKinds, width, height));
  // B0.1: purge wody→ląd tylko PRZED generateRivers — po rzekach kasował ujścia

  const startPositions = computeStartPositions(hexes, effectiveSeed, {
    minCount: 5,
    minDist: 5,
    absMinDist: 2,
  });

  // ── Przebieg 4: wioski neutralne (goodie huts) — RAZ przy generacji, po ────
  // finalizacji lądu/wybrzeża i po pozycjach startowych (traktowane jak
  // przyszłe miasta dla wykluczenia dystansu). Obozów barbarzyńców jeszcze nie
  // ma na tym etapie (spawnują się co turę w main.ts) -> existingCamps = [].
  // Osobny strumień PRNG (seed^0x5eed) — niezależny od reszty generacji.
  const villageSites = placeVillages(hexes, startPositions, [], (effectiveSeed ^ 0x5eed) >>> 0);
  for (const site of villageSites) {
    const hex = hexes[`${site.q},${site.r}`];
    if (hex) hex.wioska = { istnieje: true, ludnosc: 1 };
  }

  return {
    szerokoscQ: width,
    wysokoscR: height,
    hexes,
    seed: effectiveSeed,
    riverPaths,
    riverPathKinds,
    startPositions,
  };
}

// ---------------------------------------------------------------------------
// API rozmiarowe: generujSwiat(seed, rozmiar, typ)
// ---------------------------------------------------------------------------

/**
 * Rozmiary predefiniowane i ich przybliżone wymiary w heksach.
 * Proporcja width:height ≈ 1.4:1 (ekran poziomy).
 *
 * | Rozmiar    | width × height | Heksów (~) |
 * |------------|----------------|------------|
 * | malenki    |   76 × 52      |  ~3952     |
 * | maly       |  108 × 74      |  ~7992     |
 * | standardowy|  168 × 120     | ~20160     |
 * | duzy       |  240 × 168     | ~40320     |
 * | ogromny    |  336 × 238     | ~79968     |
 * | superogromny | 672 × 476    | ~319872    |
 */
export type RozmiarSwiata = 'malenki' | 'maly' | 'standardowy' | 'duzy' | 'ogromny' | 'superogromny';

/** Kanoniczne wymiary siatki hex (Panel-A JSON + fallback). */
export const ROZMIAR_DIMS: Record<RozmiarSwiata, [number, number]> = mapGenRozmiarDims();

/** Etykiety menu (ui-params.json) w kolejności od najmniejszej. */
export const ROZMIAR_MENU_LABELS: readonly string[] = [
  'Malenki',
  'Mały',
  'Standardowy',
  'Duży',
  'Ogromny',
  'Super Huge',
];

function normMenuLabel(label: string): string {
  return normPlMenuLabel(label);
}

/**
 * Mapuje etykietę z kreatora nowej gry (PL/legacy) na klucz ROZMIAR_DIMS.
 * Legacy 3-stopniowe: Mała→maly, Średnia→standardowy, Duża→duzy.
 */
export function rozmiarFromMenuLabel(label: string): RozmiarSwiata {
  const n = normMenuLabel(label);
  if (n.startsWith('malen') || n === 'malenki') return 'malenki';
  if (n.startsWith('mal') || n === 'maly' || n === 'small') return 'maly';
  if (n.startsWith('stand') || n.startsWith('sre') || n === 'standardowy' || n === 'medium') return 'standardowy';
  if (n.startsWith('duz') || n === 'large') return 'duzy';
  if (n.startsWith('super') || n === 'superhuge' || n === 'kolosalny') return 'superogromny';
  if (n.startsWith('ogr') || n === 'ogromny' || n === 'xlarge') return 'ogromny';
  return 'standardowy';
}

export function rozmiarToDims(rozmiar: RozmiarSwiata): { w: number; h: number } {
  const [w, h] = ROZMIAR_DIMS[rozmiar];
  return { w, h };
}

/** Skrót: etykieta menu → wymiary hex zgodne z generujSwiat(). */
export function menuLabelToDims(label: string): { w: number; h: number } {
  return rozmiarToDims(rozmiarFromMenuLabel(label));
}

/**
 * Wygodne API rozmiarowe: generuje GameMapWithStarts na podstawie
 * słownego rozmiaru i typu świata.
 *
 * @param seed    Ziarno PRNG. Jeśli 0 lub undefined, losuje deterministycznie
 *                z Date.now() i zapisuje wylosowany seed w polu map.seed.
 * @param rozmiar Predefiniowany rozmiar: 'malenki'|'maly'|'standardowy'|'duzy'|'ogromny'
 * @param typ     Typ świata: 'kontynenty'|'pangea'|'wyspy'|'ziemia' (domyślnie: 'kontynenty')
 * @returns       GameMapWithStarts z wypełnionym polem seed (ważne gdy seed=0)
 */
export type MapGenProgressCallback = (
  faza: string,
  pct: number,
  phaseNum?: number,
  phaseTotal?: number,
) => void;

export function generujSwiat(
  seed: number | undefined,
  rozmiar: RozmiarSwiata,
  typ: TypSwiata = 'kontynenty',
  genOpts?: WorldGenOptions,
  onProgress?: MapGenProgressCallback,
): GameMapWithStarts {
  // Losowy seed gdy 0/undefined
  const effectiveSeed = (seed && seed !== 0) ? seed : ((Date.now() ^ 0xdeadbeef) >>> 0) || 42;
  const [w, h] = ROZMIAR_DIMS[rozmiar];
  onProgress?.('Przygotowanie mapy', 5, 1, 6);
  const map = generateMap(w, h, effectiveSeed, typ, genOpts);
  onProgress?.('Pozycje startowe', 100, 6, 7);
  return map;
}

// Re-export typów z gen-helpers dla wygody konsumentów
export type { TypSwiata, RozmiarSwiata as RozmiarSwiataType, StartPosition };
export { landMaskAt };
export { findBestPlayerStartHex, scoreCityStartHex, START_REVEAL_RADIUS } from './startScoring';
