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
  climateBandAt,
  applyClimateBandsToHexes,
  enforceLatitudinalOceanBuffer,
  isInLatitudinalOceanBuffer,
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
  capReliefClusterSizeSafetyNet,
  growMountainRanges,
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
  purgeStrayLandOutsideEarthMask,
  purgeReliefValleyWater,
  purgeDesertEnclaveWater,
  thickenCoastAndSmoothInlets,
  applyCoastRing,
  type StartPosition,
  type TypSwiata,
} from './gen-helpers';
import { pruneOrphanRiverPaths, pruneRiversNotReachingRealSea, flattenFalseCoastalRiverNotches, ensureRiverOutlets } from './gen-helpers';
import { placeVillages, targetVillageHutCount, expectedStartCityCount } from './villages';
import {
  resolveWorldGenNumbers,
  resolveRiverMapParams,
  resolveLandFraction,
  defaultCivTypesFromMapLabel,
  defaultMiastaPanstwaFromMapLabel,
  clampMiastaPanstwaCount,
  type WorldGenOptions,
} from './newGameMapDefaults';
import { mapGenRozmiarDims } from '../data/map-gen-params-loader';
import { normPlMenuLabel } from '../util/norm-pl-label';
import {
  MAP_GEN_PHASE_LABELS,
  MAP_GEN_PHASE_TOTAL,
  reportMapGenPhase,
  type MapGenProgressCallback,
} from './mapGenProgress';

export type { WorldGenOptions };
export type { MapGenProgressCallback };

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
  onProgress?: MapGenProgressCallback,
): GameMapWithStarts {
  // Jeśli seed=0 lub undefined, użyj domyślnego 42
  const effectiveSeed = seed || 42;
  const wgn = resolveWorldGenNumbers(genOpts);
  const landFraction = resolveLandFraction(genOpts, typ);
  const terrainTh: TerrainClassifyThresholds = {
    desert: wgn.desertThreshold,
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

  reportMapGenPhase(onProgress, 1, MAP_GEN_PHASE_LABELS.prep, 100);

  // ── Przebieg 1: teren bazowy (szum → klasyfikacja; las dopiero w przebiegu 3h) ─
  const terrainRowStep = Math.max(1, Math.floor(height / 24));
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
      if (isInLatitudinalOceanBuffer(r, height, typ === 'ziemia')) {
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
          climateBandAt(q, r, height, typ === 'ziemia'),
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
    if (onProgress && (r % terrainRowStep === 0 || r === height - 1)) {
      reportMapGenPhase(onProgress, 2, MAP_GEN_PHASE_LABELS.terrain, ((r + 1) / height) * 100);
    }
  }

  reportMapGenPhase(onProgress, 2, MAP_GEN_PHASE_LABELS.terrain, 100);

  // ── Przebieg 1a: usuń zamknięte morze + głębokie zatoki ─────────────────────
  reportMapGenPhase(onProgress, 3, MAP_GEN_PHASE_LABELS.landSea, 5);
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
  enforceLatitudinalOceanBuffer(hexes, width, height, typ === 'ziemia');
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
  enforceLatitudinalOceanBuffer(hexes, width, height, typ === 'ziemia');
  if (typ !== 'pangea') {
    purgeInlandWaterForMultiLandTyp(hexes, width, height);
  }
  finalizeCoastAndInlandWater(hexes, width, height, 3, coastOpts);
  reportMapGenPhase(onProgress, 3, MAP_GEN_PHASE_LABELS.landSea, 55);

  // ── Przebieg 1e: przywróć ukształtowanie + gwarantowany relief (tier) ───────
  const reliefTier: ReliefDensityTier =
    genOpts?.worldDensity?.relief ?? genOpts?.worldDensity?.rivers ?? 'medium';
  const forestTier = genOpts?.worldDensity?.forest ?? 'medium';
  reapplyLandTerrain(hexes, terrainScratch, effectiveSeed, terrainTh, height, reliefTier);
  if (typ !== 'pangea') {
    purgeInlandWaterForMultiLandTyp(hexes, width, height);
  }
  applyReliefByNoiseRank(hexes, terrainScratch, reliefTier, width, height, typ, zoneOf, nZones);
  enforceMapBorderOcean(hexes, width, height);
  enforceLatitudinalOceanBuffer(hexes, width, height, typ === 'ziemia');
  if (typ !== 'pangea') {
    purgeInlandWaterForMultiLandTyp(hexes, width, height);
  }
  finalizeCoastAndInlandWater(hexes, width, height, 2, coastOpts);

  purgeReliefValleyWater(hexes, width, height);
  reportMapGenPhase(onProgress, 3, MAP_GEN_PHASE_LABELS.landSea, 100);

  // ── Przebieg 3: sanity woda/ląd + bufor plaży (PRZED złożami — patrz 3e) ───
  reportMapGenPhase(onProgress, 4, MAP_GEN_PHASE_LABELS.relief, 10);
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
  enforceLatitudinalOceanBuffer(hexes, width, height, typ === 'ziemia');
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
  enforceLatitudinalOceanBuffer(hexes, width, height, typ === 'ziemia');
  if (typ === 'ziemia') {
    enforceEarthTemplateOnHexes(hexes, width, height);
    purgeOceanInsideEarthLandMask(hexes, width, height);
    finalizeCoastAndInlandWater(hexes, width, height, 2, coastOpts);
    enforceEarthTemplateOnHexes(hexes, width, height);
    purgeOceanInsideEarthLandMask(hexes, width, height);
  }
  // ── Przebieg 3e-pre: wysepki-szum po finalnym wybrzeżu (pustynia/łąka w oceanie) ─
  finalizeLandMassAfterCoast(hexes, typ, width, height, coastOpts, 2);
  // ── Przebieg 3g: siatki fair play relief + las (po finalnym lądzie, przed rzekami) ─
  // R-MAPGEN-KOLEJNOSC-Q3=A: wieloetapowy floor (2× standard / 3× Ziemia) — celowo bez
  // skracania pipeline; priorytetem jest poprawne pokrycie reliefu wg wytycznych, nie czas.
  ensureReliefGridCoverage(
    hexes, terrainScratch, reliefTier, width, height, typ, zoneOf, nZones, rand,
  );
  // ── Przebieg 3g-bis: pasma górskie — naturalne skupiska (HILLS Q1, po floor reliefu,
  // przed rzekami żeby rzeki opływały nowy relief). TEMAT 12 (2026-07-24): złoża NIE są już
  // stawiane tutaj — patrz Przebieg 3i niżej, po finalnych rzekach (glina wymaga prawdziwej
  // rzeka.obecna, więc jeden konsolidowany przebieg złóż po rzekach zastępuje dawne dwa
  // przebiegi placeDeposits/ensureDepositGridCoverage rozsiane wokół reliefu). ─────────────
  growMountainRanges(hexes, terrainScratch, reliefTier, width, height, rand);
  reportMapGenPhase(onProgress, 4, MAP_GEN_PHASE_LABELS.relief, 75);
  applyClimateBandsToHexes(hexes, height, effectiveSeed, typ === 'ziemia');
  enforceLatitudinalOceanBuffer(hexes, width, height, typ === 'ziemia');
  // ── Przebieg 3h-pre: ostatni purge wody→ląd PRZED rzekami (B0.1 — nie kasować ujść) ─
  purgeInlandWaterForMultiLandTyp(hexes, width, height);
  purgeDesertEnclaveWater(hexes, width, height);
  reportMapGenPhase(onProgress, 4, MAP_GEN_PHASE_LABELS.relief, 100);
  // ── Przebieg 3h-coast: grubsze (≥2 hex) + gładsze wybrzeże PRZED rzekami (Zmiana 2) ─
  reportMapGenPhase(onProgress, 5, MAP_GEN_PHASE_LABELS.coast, 20);
  thickenCoastAndSmoothInlets(hexes, width, height, 2);
  // ── Przebieg 3h-post (Ziemia, Zmiana 1): heurystyki „domykania zatok" powyżej nie znają
  // konturu Ziemi i przy zachowanym (nie-zjadanym) lądzie potrafią zalać lądem prawdziwą wąską
  // zatokę/cieśninę tuż za maską — cofnij taki suchy ląd do Morza i odtwórz pierścień wybrzeża.
  if (typ === 'ziemia') {
    purgeStrayLandOutsideEarthMask(hexes, width, height);
    // Pojedynczy pierścień (nie double) — reszta wybrzeża ma już pełne coastWidth=2 z
    // thickenCoastAndSmoothInlets powyżej; podwójny pierścień tutaj nadmiarowo pogrubiłby
    // CAŁĄ linię brzegową o kolejny pierścień (Morze przy już-Wybrzeżu też by się złapało).
    applyCoastRing(hexes);
  }
  enforceMapBorderOcean(hexes, width, height);
  enforceLatitudinalOceanBuffer(hexes, width, height, typ === 'ziemia');
  reportMapGenPhase(onProgress, 5, MAP_GEN_PHASE_LABELS.coast, 100);
  // ── Przebieg 3h: rzeki DOPIERO po finalnym wybrzeżu (Maciej: bufor 2 hex od morza) ─
  reportMapGenPhase(onProgress, 6, MAP_GEN_PHASE_LABELS.riversMain, 0);
  const riversTier = genOpts?.worldDensity?.rivers ?? 'medium';
  const riverParams = resolveRiverMapParams(riversTier, width, height);
  clearRiverMarks(hexes);
  let { paths: riverPaths, kinds: riverPathKinds } = generateRivers(hexes, width, height, rand, {
    minLen: riverParams.minLen,
    maxLen: riverParams.maxLen,
    margin: wgn.riverTrace.margin,
    riversTier,
    worldTyp: typ,
    riverParams,
    onProgress: (localPct) => {
      reportMapGenPhase(onProgress, 6, MAP_GEN_PHASE_LABELS.riversMain, localPct);
    },
  });
  reportMapGenPhase(onProgress, 6, MAP_GEN_PHASE_LABELS.riversMain, 100);
  reportMapGenPhase(onProgress, 7, MAP_GEN_PHASE_LABELS.riversFill, 0);
  stripRiverMarksFromOpenSea(hexes);
  // B0.7/B0.8: „zero sierot" — usun sciezki niepolaczone z morzem (finalny stan, jak widzi test).
  ({ paths: riverPaths, kinds: riverPathKinds } = pruneOrphanRiverPaths(hexes, riverPaths, riverPathKinds, width, height));
  // ZADANIE 2 — bezpiecznik końcowy: generateRivers/topUpRiverGridCoverage już trasują do
  // oceanConnectedWaterKeys (Morze ∪ Wybrzeże), więc to zwykle no-op; ostateczna gwarancja
  // "0 rzek bez ujścia do wody" niezależnie od ewentualnych późniejszych przesunięć wybrzeża.
  ({ paths: riverPaths, kinds: riverPathKinds } =
    pruneRiversNotReachingRealSea(hexes, riverPaths, riverPathKinds, width, height));
  ({ paths: riverPaths, kinds: riverPathKinds } =
    pruneOrphanRiverPaths(hexes, riverPaths, riverPathKinds, width, height));
  ({ paths: riverPaths, kinds: riverPathKinds } =
    pruneRiversNotReachingRealSea(hexes, riverPaths, riverPathKinds, width, height));
  // Jeden topUp PO obu przebiegach prune (perf FALA 133b): wcześniejszy podwójny topUp
  // mielił 2× koszt fill — pierwszy pass i tak kasowany przez prune sierot.
  topUpRiverGridCoverage(
    hexes,
    width,
    height,
    riverPaths,
    riverPathKinds,
    rand,
    riversTier,
    riverParams.minLen,
    riverParams.maxLen,
    riverParams,
    (localPct) => {
      reportMapGenPhase(onProgress, 7, MAP_GEN_PHASE_LABELS.riversFill, 5 + localPct * 0.75);
    },
  );
  reportMapGenPhase(onProgress, 7, MAP_GEN_PHASE_LABELS.riversFill, 85);
  // B0.1: purge wody→ląd tylko PRZED generateRivers — po rzekach kasował ujścia
  // ZADANIE 2 / C2: spłaszcz fałszywe "wcięcia/ujścia" (Wybrzeże bez własnej rzeki, kształtem
  // udające deltę) — OSTATNI krok geografii, po finalnym oznakowaniu rzek, żeby znać PRAWDZIWE
  // ujścia i nigdy ich nie ruszać.
  flattenFalseCoastalRiverNotches(hexes, width, height);

  // ── Przebieg 3h-relief-final: domknij siatkę fair play reliefu (floor: min 2 Gór/2 Wzgórz na
  // komórkę) PONOWNIE, na PRAWDZIWIE finalnej geografii (po wybrzeżu, po rzekach) — Maciej
  // 2026-07-26 (audyt C-MAPA-Q1=B). Pierwsze wywołanie (Przebieg 3g, wyżej) liczy floor na
  // masach lądu SPRZED thickenCoastAndSmoothInlets/purgeStrayLandOutsideEarthMask/enforceMap-
  // BorderOcean — te przebiegi wybrzeża potrafią rozdrobnić jedną dużą masę na kilka mniejszych,
  // a fragment po podziale może wypaść bez własnego minimum 2 Gór / 2 Wzgórz w komórce
  // (dokładnie to mierzy relief-grid-coverage-test.cjs — per-masa, na finalnym stanie). Wołanie
  // ponownie tutaj, gdy ląd/morze jest już całkowicie zamknięte, domyka te przypadki.
  // Kolejność: NAJPIERW cap skupisk (na wypadek gdyby rozdrobnienie mas lądu powyżej scaliło
  // coś w skupisko >10 — patrz capReliefClusterSizeSafetyNet), DOPIERO POTEM floor — odwrotna
  // kolejność (floor, potem cap) potrafiłaby cofnąć WŁASNY dopiero co dołożony heks floor-a,
  // jeśli wypadł jako najsłabszy szum w sąsiedztwie istniejącego skupiska (zmierzone empirycznie:
  // cap-po-floor kasował dokładnie te heksy, które floor przed chwilą dołożył).
  //
  // UWAGA (C-MAPA-Q1=B, audyt drugiej połowy zlecenia, 2026-07-26 popołudnie): próbowano
  // DODATKOWO domknąć limit fair-play-grid-test.cjs per komórka (max Gór/Wzgórz na komórkę
  // 25×25, patrz fair-play-grid-test.cjs) przez cap+regrow analogiczny do powyższego. WTEDY
  // cofnięte — matematycznie sprzeczne z ówczesnym twardym wymogiem górzystości lądu ~19,3%
  // (decyzja 80A, zakres 19,0-20,2%): limit fair-play (max(3,ceil(land*0.04)) Gór +
  // max(3,ceil(land*0.06)) Wzgórz na komórkę 25×25) daje SUFIT ~10% gęstości reliefu na KAŻDEJ
  // komórce — a skoro większość lądu dużego kontynentu to komórki blisko pełne (~625 heksów),
  // globalna górzystość NIE MOŻE przekroczyć tego sufitu (zmierzone: wymuszenie limitu zbiło
  // górzystość z ~19,3% do ~9,4-9,8% na 5 seedach).
  //
  // PONOWNIE WŁĄCZONE — Maciej 2026-07-26 (wieczór), C-MAPA-Q2=B; skorygowane R-MAPGEN-KOLEJNOSC-Q2=C
  // (2026-07-27): docelowa górzystość lądu tier Średni relief ≈15% (kompromis między ~10% a ~19%).
  // Sufit żyje
  // teraz jako RELIEF_OVERFLOW_CAP_MULT=1 w gen-helpers.ts (frakcje z Panel-A
  // `gestosc.relief_overflow_cap_frac`). Heksy ze złożem są chronione przed przycięciem
  // (isDepositProtectedFromOverflowCap) — inaczej TEN sam sufit, wywołany ponownie niżej
  // (linia „Ziemia — ostatnia szansa") PO placeDeposits/ensureDepositGridCoverage, kasowałby
  // dopiero co wymuszone złoża fair-play na najsłabszym szumem heksie przepełnionej komórki.
  capReliefClusterSizeSafetyNet(hexes, terrainScratch);
  ensureReliefGridCoverage(
    hexes, terrainScratch, reliefTier, width, height, typ, zoneOf, nZones, rand,
  );
  reportMapGenPhase(onProgress, 7, MAP_GEN_PHASE_LABELS.riversFill, 100);

  // ── Przebieg 3h-las: las DOPIERO po finalnym terenie (relief/pasma) i finalnych rzekach
  reportMapGenPhase(onProgress, 8, MAP_GEN_PHASE_LABELS.forest, 10);
  // (Maciej 2026-07-26: "najpierw teren [wzgórza, góry, pustynie...], dopiero później rzeki,
  // a na samym końcu lasy i surowce") — teren bazowy i relief (growMountainRanges) są już
  // finalne, rzeki też, więc las nie konsumuje już rand() PRZED górami/rzekami: zmiana suwaka
  // Las przestaje przesuwać PRNG dla kroków wcześniejszych (dawny bug: zmiana tieru lasu
  // przesuwała stan generatora dla wszystkiego co szło PO nim, w tym pasma górskie i rzeki —
  // teraz obie te rzeczy są już policzone ZANIM las w ogóle zawoła rand()). Dodatkowa korzyść:
  // las nie jest już masowo kasowany przez późniejszy rozrost pasm górskich (growMountainRanges
  // konwertuje Łąka/Równina/Pustynia na Góry/Wzgórza i zeruje nakładkę) — dawniej część lasu
  // z reapplyForestOverlay (wołanego PRZED growMountainRanges) była zaraz potem nadpisywana.
  reapplyForestOverlay(hexes, terrainScratch, terrainTh, typ, forestTier, zoneOf, nZones, height);
  ensureForestGridCoverage(hexes, terrainScratch, forestTier, typ, zoneOf, nZones, rand);
  reportMapGenPhase(onProgress, 8, MAP_GEN_PHASE_LABELS.forest, 100);

  // ── Przebieg 3i: złoża DOPIERO po finalnych rzekach, finalnym wybrzeżu i finalnym lesie
  reportMapGenPhase(onProgress, 9, MAP_GEN_PHASE_LABELS.deposits, 15);
  // (TEMAT 12, 2026-07-24, Maciej; kolejność las→złoża potwierdzona 2026-07-26) — glina wymaga
  // prawdziwej h.rzeka.obecna (rzeki wcześniej nie
  // istniały — placeDeposits() był wołany PRZED generateRivers, więc gałąź rzeki w regule
  // gliny była martwym kodem), sól wymaga finalnego (już domkniętego) Wybrzeża. Jeden
  // konsolidowany przebieg wystarcza — relief (w tym pasma górskie z growMountainRanges) jest
  // już finalny, więc nie trzeba dawnej dwuprzebiegowej gimnastyki placeDeposits/
  // ensureDepositGridCoverage sprzed/po growMountainRanges.
  placeDeposits(hexes, effectiveSeed, undefined, wgn.resourceMult, wgn.resourceBaseline);
  ensureDepositGridCoverage(hexes, reliefTier, typ, zoneOf, nZones, rand);
  stripDepositsFromWater(hexes);
  reportMapGenPhase(onProgress, 9, MAP_GEN_PHASE_LABELS.deposits, 100);

  reportMapGenPhase(onProgress, 10, MAP_GEN_PHASE_LABELS.starts, 10);
  const startPositions = computeStartPositions(hexes, effectiveSeed, {
    minCount: 5,
    minDist: 5,
    absMinDist: 2,
  });

  // ── Przebieg 4: wioski neutralne (goodie huts) — RAZ przy generacji, po ────
  // finalizacji lądu/wybrzeża i po pozycjach startowych (traktowane jak
  // przyszłe miasta dla wykluczenia dystansu). Obozów barbarzyńców jeszcze nie
  // ma na tym etapie (spawnują się co turę w main.ts) -> existingCamps = [].
  // Liczba chat: miasta startowe (typy × (1+państwa)) × mnożnik trudności.
  // Osobny strumień PRNG (seed^0x5eed) — niezależny od reszty generacji.
  const mapMenuLabel = genOpts?.mapSizeMenuLabel ?? 'Standardowy';
  const startCityCount = expectedStartCityCount(
    genOpts?.civTypesCount ?? defaultCivTypesFromMapLabel(mapMenuLabel),
    clampMiastaPanstwaCount(
      genOpts?.cityStatesCount ?? defaultMiastaPanstwaFromMapLabel(mapMenuLabel),
    ),
  );
  const targetHuts = targetVillageHutCount(startCityCount, genOpts?.difficulty ?? 'normal');
  const villageSites = placeVillages(hexes, startPositions, [], (effectiveSeed ^ 0x5eed) >>> 0, {
    targetCount: targetHuts,
  });
  for (const site of villageSites) {
    const hex = hexes[`${site.q},${site.r}`];
    if (hex) hex.wioska = { istnieje: true, ludnosc: 1 };
  }
  reportMapGenPhase(onProgress, 10, MAP_GEN_PHASE_LABELS.starts, 70);

  // Ziemia (A-MAP-ZIEMIA-1): ostatnia szansa — bufor arktyczny / bez Antarktydy musi
  // wygrać nad wybrzeżem i heurystykami po rzekach (test: 0 lądu poza szablonem).
  if (typ === 'ziemia') {
    enforceEarthTemplateOnHexes(hexes, width, height);
    purgeOceanInsideEarthLandMask(hexes, width, height);
    // Ten krok potrafi jeszcze raz rozdrobnić masy lądu (Maciej 2026-07-26, audyt C-MAPA-Q1=B) —
    // dopiero TU geografia (ląd/morze) jest naprawdę ostateczna dla typu 'ziemia'. Domykamy
    // siatkę fair play reliefu (floor) RAZ JESZCZE na tym stanie, żeby fragment odcięty przez
    // szablon Ziemi nie wypadł bez własnego minimum 2 Gór / 2 Wzgórz w komórce (relief-grid-
    // coverage-test.cjs liczy to per-masa, na finalnym stanie). Kolejność cap→floor jak wyżej.
    capReliefClusterSizeSafetyNet(hexes, terrainScratch);
    ensureReliefGridCoverage(
      hexes, terrainScratch, reliefTier, width, height, typ, zoneOf, nZones, rand,
    );
    // C-MAPA-Q2=B (Maciej 2026-07-26, dociągnięcie): TEN SAM powód co floor reliefu wyżej —
    // fragment lądu odcięty przez szablon Ziemi PO ensureDepositGridCoverage (linia ~464) może
    // wypaść bez własnego pakietu żelazo/miedź/glina (fair-play-grid-test.cjs mierzy to na
    // FINALNYCH masach, a maski/rozdrobnienie lądu dla 'ziemia' zamykają się dopiero tutaj).
    // Powtórka jest tania i bezpieczna: forceDepositInCell pomija komórki, które już mają
    // komplet (cellCarriesDepositType), więc nie zużywa rand() tam, gdzie nic się nie zmienia.
    ensureDepositGridCoverage(hexes, reliefTier, typ, zoneOf, nZones, rand);
    stripDepositsFromWater(hexes);
  }

  // BUG-RZEKI-DOPLYWY: ostatnia bramka po reliefie/złożach (Ziemia) — usuwa wiszące dopływy.
  ({ paths: riverPaths, kinds: riverPathKinds } =
    ensureRiverOutlets(hexes, riverPaths, riverPathKinds, width, height));

  // Ostatni pierścień wybrzeża — relief/złoża/szablon Ziemi mogły odsłonić ląd przy Morzu.
  finalizeCoastAndInlandWater(hexes, width, height, 2, coastOpts);
  reportMapGenPhase(onProgress, 10, MAP_GEN_PHASE_LABELS.starts, 100);

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
  reportMapGenPhase(onProgress, 1, MAP_GEN_PHASE_LABELS.prep, 0);
  const map = generateMap(w, h, effectiveSeed, typ, genOpts, onProgress);
  onProgress?.('Gotowe', 100, MAP_GEN_PHASE_TOTAL, MAP_GEN_PHASE_TOTAL);
  return map;
}

// Re-export typów z gen-helpers dla wygody konsumentów
export type { TypSwiata, RozmiarSwiata as RozmiarSwiataType, StartPosition };
export { landMaskAt };
export { findBestPlayerStartHex, scoreCityStartHex, START_REVEAL_RADIUS } from './startScoring';
