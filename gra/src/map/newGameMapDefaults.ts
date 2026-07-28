/**
 * newGameMapDefaults.ts
 * Kontrakt menu nowej gry ↔ heurystyki MAPA (E1, Maciej 2026-06-26).
 *
 * UI (newGameFlow) importuje stąd skalę rywali i mapowanie typu świata.
 * SILNIK (main.ts) — osobny handoff; tu tylko czyste funkcje bez DOM.
 */

import type { TypSwiata } from './gen-helpers';
import { defaultLandFractionForTyp } from './gen-helpers';
import {
  mapGenDefaultRywale,
  mapGenDesertThreshold,
  mapGenForestThreshold,
  mapGenHighlandThreshold,
  mapGenMountainThreshold,
  mapGenMaxRiversBase,
  mapGenResourceBaselineRarity,
  mapGenResourceMult,
  mapGenRiverScale,
} from '../data/map-gen-params-loader';
import {
  eStartEpochId,
  eStartMiastaPanstwa,
  eStartPlayerCivId,
  eStartRenderQualityBundled,
  eStartRywaleAi,
  eStartTypyCywilizacji,
  eStartTypyCywilizacjiPerEpoka,
  type StartEpochId,
} from '../data/e-start-params-loader';
import { normPlMenuLabel } from '../util/norm-pl-label';
import { menuLabelToDims, rozmiarFromMenuLabel, type RozmiarSwiata } from './generator';
import {
  civIdsAvailableAtGameEpoch,
  type CivEntryEpochRow,
} from '../game/civ-entry-epoch';

export type MapSizeLabel = 'mala' | 'srednia' | 'duza' | 'ogromna' | 'super';

/** Etykiety typu świata w kreatorze (kolejność = ui-params). */
export const TYP_SWIATA_MENU_LABELS: readonly string[] = [
  'Kontynenty',
  'Pangea',
  'Wyspy',
  'Ziemia',
];

const TYP_SWIATA_TO_ENGINE: Record<string, TypSwiata> = {
  kontynenty: 'kontynenty',
  pangea: 'pangea',
  wyspy: 'wyspy',
  ziemia: 'ziemia',
};

function normLabel(label: string): string {
  return normPlMenuLabel(label);
}

/** Heurystyka rozmiaru mapy (zgodna z clusters.ts). */
export function mapSizeLabelFromDims(w: number, h: number): MapSizeLabel {
  const area = w * h;
  // Progi ×4 względem pre-2026-07 (mapy 2× liniowo = 4× powierzchnia).
  if (area < 4800) return 'mala';
  if (area < 12000) return 'srednia';
  if (area < 25200) return 'duza';
  if (area < 100000) return 'ogromna';
  return 'super';
}

export function mapSizeLabelFromMenuLabel(menuLabel: string): MapSizeLabel {
  const { w, h } = menuLabelToDims(menuLabel);
  return mapSizeLabelFromDims(w, h);
}

/** Aktywne typy nacji na mapie (Panel-E / legacy pojedyncza skala lub max z macierzy żelazo). */
export function aktywneTypyFromMapLabel(menuLabel: string, epochId: string = 'zelazo'): number {
  const triple = civTypesTripleForMapLabel(menuLabel, epochId);
  return triple.max;
}

/**
 * Domyślna liczba rywali AI wg rozmiaru mapy (Panel-E / Panel-A).
 */
export function defaultRywaleFromMapLabel(menuLabel: string): number {
  const fromE = eStartRywaleAi(menuLabel);
  if (fromE != null && fromE >= 0) return fromE;
  const lut: Record<MapSizeLabel, number> = {
    mala: mapGenDefaultRywale('mala'),
    srednia: mapGenDefaultRywale('srednia'),
    duza: mapGenDefaultRywale('duza'),
    ogromna: mapGenDefaultRywale('ogromna'),
    super: mapGenDefaultRywale('super'),
  };
  return lut[mapSizeLabelFromMenuLabel(menuLabel)] ?? mapGenDefaultRywale('duza');
}

export interface RywaleMenuBundle {
  opts: string[];
  descs: string[];
  /** Indeks domyślny w opts (skalowany do mapy). */
  domyslny: number;
}

/**
 * Opcje „Liczba rywali" w kreatorze — zakres zależy od mapy.
 * Górna granica: min(aktywneTypy - 1, default + 2).
 */
export function rywaleMenuForMapLabel(menuLabel: string): RywaleMenuBundle {
  const def = defaultRywaleFromMapLabel(menuLabel);
  const maxTyp = aktywneTypyFromMapLabel(menuLabel);
  const maxRyw = Math.max(1, Math.min(maxTyp - 1, def + 2));
  const minRyw = Math.max(1, def - 1);
  const opts: string[] = [];
  const descs: string[] = [];
  for (let n = minRyw; n <= maxRyw; n++) {
    opts.push(String(n));
    descs.push(n === def ? 'Zalecane dla tej mapy' : (n < def ? 'Mniej starć' : 'Gęstsza mapa'));
  }
  const domyslny = Math.max(0, opts.indexOf(String(def)));
  return { opts, descs, domyslny: domyslny >= 0 ? domyslny : 0 };
}

/** Etykieta menu → klucz silnika generateMap(). */
export function typSwiataFromMenuLabel(label: string): TypSwiata {
  const n = normLabel(label);
  return TYP_SWIATA_TO_ENGINE[n] ?? 'kontynenty';
}

/** Domyślna cywilizacja gracza (Panel-E → ikonaId z civs.json). */
export const DEFAULT_PLAYER_CIV_ID = eStartPlayerCivId();

/** Domyślna epoka startowa (Panel-E). */
export const DEFAULT_START_EPOCH_ID = eStartEpochId();

/** Niska / Średnia / Wysoka — jakość renderu GPU i szczegółowość dekoracji mapy. */
export type QualityTier = 'low' | 'medium' | 'high';

export const QUALITY_MENU_LABELS = ['Niska', 'Średnia', 'Wysoka'] as const;

export const DEFAULT_RENDER_QUALITY: QualityTier = eStartRenderQualityBundled();
export const DEFAULT_MAP_DETAIL_QUALITY: QualityTier = 'high';

function normQualityLabel(label: string): string {
  return label.toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/[ó]/g, 'o')
    .replace(/[ąà]/g, 'a')
    .replace(/[ę]/g, 'e')
    .replace(/[^a-z0-9]/g, '');
}

/** Etykieta PL z kreatora / menu → klucz silnika. */
export function qualityTierFromLabel(label: string): QualityTier {
  const n = normQualityLabel(label);
  if (n === 'niska' || n === 'low') return 'low';
  if (n === 'wysoka' || n === 'high') return 'high';
  return 'medium';
}

export function qualityTierToLabel(tier: QualityTier): string {
  if (tier === 'low') return 'Niska';
  if (tier === 'high') return 'Wysoka';
  return 'Średnia';
}

/** Pełny pakiet GPU + dekoracje z jednego suwaka „Jakość mapy” (E1-Q-BUNDLE, Maciej 2026-06-29). */
export interface BundledMapQualityPreset {
  renderQuality: QualityTier;
  mapDetailQuality: QualityTier;
}

/**
 * Jeden wybór gracza → oba tiery silnika (1:1).
 * UI nie eksponuje renderQuality osobno; SILNIK woła to przy starcie gry.
 */
export function bundledMapQualityPreset(tier: QualityTier): BundledMapQualityPreset {
  return { renderQuality: tier, mapDetailQuality: tier };
}

/** Etykieta PL z kreatora → pakiet presetów. */
export function bundledMapQualityFromLabel(label: string): BundledMapQualityPreset {
  return bundledMapQualityPreset(qualityTierFromLabel(label));
}

/** Duży / Ogromny — podpowiedź FPS w kreatorze. */
export function isLargeMapMenuLabel(menuLabel: string): boolean {
  const n = normQualityLabel(menuLabel);
  return n === 'duzy' || n === 'ogromny';
}

/** Mało / Normalnie / Dużo — gęstość elementów generatora (E2). */
export type DensityTier = 'low' | 'medium' | 'high';

export const DENSITY_MENU_LABELS = ['Mało', 'Normalnie', 'Dużo'] as const;

export function densityTierFromLabel(label: string): DensityTier {
  const n = normQualityLabel(label);
  if (n === 'malo' || n === 'low') return 'low';
  if (n === 'duzo' || n === 'high') return 'high';
  return 'medium';
}

export function densityTierToLabel(tier: DensityTier): string {
  if (tier === 'low') return 'Mało';
  if (tier === 'high') return 'Dużo';
  return 'Normalnie';
}

/** Pakiet gęstości świata z kreatora (zaawansowane — E2). */
export interface WorldGenerationPreset {
  resources: DensityTier;
  rivers: DensityTier;
  desert: DensityTier;
  forest: DensityTier;
  relief: DensityTier;
}

export const DEFAULT_WORLD_DENSITY: WorldGenerationPreset = {
  resources: 'medium',
  rivers: 'medium',
  desert: 'medium',
  forest: 'medium',
  relief: 'medium',
};

export function worldGenerationPresetFromLabels(labels: {
  resources: string;
  rivers: string;
  desert: string;
  forest: string;
  relief?: string;
}): WorldGenerationPreset {
  const riversTier = densityTierFromLabel(labels.rivers);
  return {
    resources: densityTierFromLabel(labels.resources),
    rivers: riversTier,
    desert: densityTierFromLabel(labels.desert),
    forest: densityTierFromLabel(labels.forest),
    relief: densityTierFromLabel(labels.relief || labels.rivers || 'Normalnie'),
  };
}

/** Mnożniki gęstości z Panel-A JSON. */
export function densityMultiplier(tier: DensityTier): number {
  return mapGenResourceMult(tier);
}

/** maxRivers z presetu rzek (Panel-A). */
export function maxRiversFromDensity(tier: DensityTier): number {
  return mapGenMaxRiversBase(tier);
}

/** Skala liczby rzek względem rozmiaru mapy (Panel-A). */
const RIVER_SCALE_BY_SIZE: Record<MapSizeLabel, number> = {
  mala: mapGenRiverScale('mala'),
  srednia: mapGenRiverScale('srednia'),
  duza: mapGenRiverScale('duza'),
  ogromna: mapGenRiverScale('ogromna'),
  super: mapGenRiverScale('super'),
};

/** @deprecated Nieużywane przez generator (2026-07-04) — gęstość rzek = siatka N×N + min. długość. */
export function maxRiversForMapAndDensity(mapMenuLabel: string, tier: DensityTier): number {
  const base = maxRiversFromDensity(tier);
  const sizeLabel = mapSizeLabelFromMenuLabel(mapMenuLabel);
  const scale = RIVER_SCALE_BY_SIZE[sizeLabel] ?? 1;
  const { w, h } = menuLabelToDims(mapMenuLabel);
  const areaBoost = Math.max(1, Math.sqrt((w * h) / 5000));
  return Math.max(2, Math.round(base * scale * areaBoost));
}

/** Min. długość głównego nurtu (heksy na ścieżce) — tier kreatora „Rzeki” (Maciej 2026-07-04). */
export function riverMinPathLengthForTier(tier: DensityTier): number {
  if (tier === 'high') return 35;
  if (tier === 'low') return 15;
  return 25;
}

/** Siatka rzek (bok komórki N×N) — tier kreatora „Rzeki”. */
export function riverGridCellSizeForTier(tier: DensityTier): number {
  if (tier === 'high') return 5;
  if (tier === 'low') return 15;
  return 10;
}

/**
 * Min. długość trasy przy stawianiu siatki fair play (Maciej A 2026-07-05).
 * Tier katalogowy (np. 25) obowiązuje jako CEL; siatka akceptuje krótsze na wąskich lądach.
 *
 * Zmiana 3 „reguła długości 25 → miękka" (Maciej 2026-07-11): próg akceptacji obniżony
 * (12→6 med), aby rzeka, której NIE da się doprowadzić do 25 heksów, i tak powstała
 * jako krótka, ale KOMPLETNA (z ujściem do morza) zamiast zostać odrzucona. Cel 25 nadal
 * steruje traceRiver (inlandTarget) — długie rzeki powstają tam, gdzie geografia pozwala;
 * dolny próg tylko decyduje, czy zachować krótki, kompletny bieg. Ujście gwarantowane przez
 * pathEndsAtSea (tryPlaceGridRiver) — „0 rzek bez ujścia" zostaje.
 */
export function riverGridTraceMinLen(catalogMinLen: number, tier: DensityTier = 'medium'): number {
  const cap = tier === 'low' ? 5 : tier === 'high' ? 8 : 6;
  return Math.min(catalogMinLen, cap);
}

/** Referencyjna mapa Standard 168×120 — skala rzek (Maciej 2026-07-28). */
export const RIVER_REF_AREA = 168 * 120;

export function riverMapAreaScale(w: number, h: number): number {
  return Math.sqrt((w * h) / RIVER_REF_AREA);
}

export interface RiverMapParams {
  areaScale: number;
  minDim: number;
  mainCell: number;
  tributaryCell: number;
  mainGridStride: number;
  minLen: number;
  maxLen: number;
  gridTraceMinLen: number;
  feederMinLen: number;
  hardMeanderLen: number;
  mouthTailLen: number;
  minInlandFromSea: number;
  reliefSearchMin: number;
  reliefSearchMax: number;
  reliefSourceBonus: number;
  feederPasses: number;
  topUpPasses: number;
  feederSourceSepMult: number;
  expandSourceRadius: number;
  minInlandCell: number;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Parametry rzek skalowane z rozmiarem mapy (w×h) i tierem „Rzeki”. */
export function resolveRiverMapParams(tier: DensityTier, w: number, h: number): RiverMapParams {
  const areaScale = riverMapAreaScale(w, h);
  const minDim = Math.min(w, h);
  const mainBase = tier === 'high' ? 4 : tier === 'low' ? 11 : 7;
  const tribBase = tier === 'high' ? 2 : tier === 'low' ? 6 : 4;
  const tierMinLen = riverMinPathLengthForTier(tier);
  const tierCap = tier === 'low' ? 5 : tier === 'high' ? 8 : 6;

  const mainCell = clamp(Math.round(mainBase * areaScale), 4, 32);
  const tributaryCell = clamp(Math.round(tribBase * areaScale), 2, 18);
  const mainGridStride = areaScale < 0.55 ? 2 : 3;

  const minLen = Math.min(
    clamp(Math.round(tierMinLen * areaScale), 6, tierMinLen),
    Math.floor(minDim * 0.35),
  );
  const maxLen = Math.min(
    Math.max(minLen * 2, Math.floor(minDim * 0.22), Math.round(minLen * 3)),
    Math.floor(minDim * 0.75),
  );
  const gridTraceMinLen = clamp(
    Math.min(minLen, tierCap),
    3,
    Math.max(3, Math.floor(minDim * 0.12)),
  );
  const feederMinLen = clamp(Math.max(3, gridTraceMinLen - 1), 3, Math.max(3, Math.floor(minDim * 0.08)));
  const hardMeanderLen = clamp(Math.round(8 * areaScale), 3, 8);
  const mouthTailLen = clamp(Math.round(5 * areaScale), 3, 5);
  const minInlandFromSea = minDim >= 40 ? 2 : 1;
  const reliefSearchMax = clamp(Math.round(14 * areaScale), 6, 28);
  const feederPasses = clamp(3 + Math.floor(areaScale), 3, 8);
  const topUpPasses = clamp(4 + Math.floor(areaScale * 1.5), 4, 12);
  const minInlandCell = Math.max(4, Math.floor(minLen * 0.35));

  return {
    areaScale, minDim, mainCell, tributaryCell, mainGridStride,
    minLen, maxLen, gridTraceMinLen, feederMinLen,
    hardMeanderLen, mouthTailLen, minInlandFromSea,
    reliefSearchMin: 2,
    reliefSearchMax,
    reliefSourceBonus: 80,
    feederPasses, topUpPasses,
    feederSourceSepMult: 0.35,
    expandSourceRadius: clamp(Math.round(2 * areaScale), 1, 5),
    minInlandCell,
  };
}

export function resolveRiverTraceForMap(
  mapMenuLabel: string,
  riversTier: DensityTier,
): { minLen: number; maxLen: number; margin: number } {
  const { w, h } = menuLabelToDims(mapMenuLabel);
  const params = resolveRiverMapParams(riversTier, w, h);
  const base = riverTraceLimitsForMap(mapMenuLabel);
  return {
    minLen: params.minLen,
    maxLen: params.maxLen,
    margin: base.margin,
  };
}

/** Długość ścieżki rzeki — skala z rozmiarem mapy (legacy; minLen z tieru przez resolveRiverTraceForMap). */
export function riverTraceLimitsForMap(mapMenuLabel: string): { minLen: number; maxLen: number; margin: number } {
  const { w, h } = menuLabelToDims(mapMenuLabel);
  const minDim = Math.min(w, h);
  const area = w * h;
  return {
    minLen: area > 20000 ? 5 : 4,
    maxLen: Math.max(40, Math.floor(minDim * 0.22)),
    margin: Math.max(2, Math.floor(minDim * 0.025)),
  };
}

/** Bazowy boost rarity — Panel-A JSON. */
export const RESOURCE_BASELINE_RARITY_MULT = mapGenResourceBaselineRarity();

/** Progi pustyni (Panel-A JSON). */
export function desertNoiseThresholdFromTier(tier: DensityTier): number {
  return mapGenDesertThreshold(tier);
}

/** Progi lasu logicznego (Panel-A JSON) — globalnie ~2× więcej drzew niż bazowy próg. */
export function forestNoiseThresholdFromTier(tier: DensityTier): number {
  return Math.max(0.32, mapGenForestThreshold(tier) - 0.12);
}

/** Progi gór (Panel-A JSON) — niższy próg = więcej gór. */
export function mountainNoiseThresholdFromTier(tier: DensityTier): number {
  return mapGenMountainThreshold(tier);
}

/** Progi wzgórz (Panel-A JSON). */
export function highlandNoiseThresholdFromTier(tier: DensityTier): number {
  return mapGenHighlandThreshold(tier);
}

/** Opcje generatora przekazywane z kreatora (E2). */
export interface WorldGenOptions {
  worldDensity?: WorldGenerationPreset;
  /** Etykieta rozmiaru mapy z menu — skala rzek. */
  mapSizeMenuLabel?: string;
  /** Udział lądu 0–1 (reszta morze). Nadpisuje domyślny preset typu świata. */
  landFraction?: number;
  /** Trudność gry — skala chat ze skarbami (HART=1 · NORMAL=2 · EZ=3 na miasto). */
  difficulty?: 'easy' | 'normal' | 'hard';
  /** Liczba typów cywilizacji na mapie (kreator). */
  civTypesCount?: number;
  /** Liczba miast-państw w klastrze (kreator). */
  cityStatesCount?: number;
}

/** Suwak zaawansowany — procent lądu (reszta morze). */
export const LAND_FRACTION_PERCENT_OPTS = [80, 70, 60, 50, 40, 30, 20] as const;

export type LandFractionPercent = (typeof LAND_FRACTION_PERCENT_OPTS)[number];

export function defaultLandFractionPercentForTyp(typ: TypSwiata): LandFractionPercent {
  const pct = Math.round(defaultLandFractionForTyp(typ) * 100);
  const opts = LAND_FRACTION_PERCENT_OPTS as readonly number[];
  if (opts.includes(pct)) return pct as LandFractionPercent;
  return opts.reduce((best, v) =>
    Math.abs(v - pct) < Math.abs(best - pct) ? v : best, opts[0]!) as LandFractionPercent;
}

export function resolveLandFraction(opts: WorldGenOptions | undefined, typ: TypSwiata): number {
  if (opts?.landFraction != null && Number.isFinite(opts.landFraction)) {
    return Math.max(0.15, Math.min(0.85, opts.landFraction));
  }
  return defaultLandFractionForTyp(typ);
}

export function scaleMaxRiversForLand(
  configuredMax: number,
  landHexes: number,
  riversTier: DensityTier,
): number {
  /** @deprecated Nieużywane — sufit rzek usunięty 2026-07-04. */
  void landHexes;
  void riversTier;
  return configuredMax;
}

export function resolveWorldGenNumbers(opts?: WorldGenOptions): {
  resourceMult: number;
  resourceBaseline: number;
  /** Legacy Panel-A — generator nie używa; zostaje dla testów/diag. */
  maxRivers: number;
  desertThreshold: number;
  forestThreshold: number;
  mountainThreshold: number;
  highlandThreshold: number;
  riverTrace: { minLen: number; maxLen: number; margin: number };
} {
  const wd = opts?.worldDensity ?? DEFAULT_WORLD_DENSITY;
  const reliefTier: DensityTier = wd.relief ?? wd.rivers ?? 'medium';
  const mapLabel = opts?.mapSizeMenuLabel ?? 'Standardowy';
  /** Baseline boost tylko gdy kreator przekazał preset (E2 — Normalnie bogatsze niż stary domyślny gen). */
  const resourceBaseline = opts?.worldDensity
    ? RESOURCE_BASELINE_RARITY_MULT
    : 1;
  return {
    resourceMult: densityMultiplier(wd.resources),
    resourceBaseline,
    maxRivers: maxRiversForMapAndDensity(mapLabel, wd.rivers),
    desertThreshold: desertNoiseThresholdFromTier(wd.desert),
    forestThreshold: forestNoiseThresholdFromTier(wd.forest),
    mountainThreshold: mountainNoiseThresholdFromTier(reliefTier),
    highlandThreshold: highlandNoiseThresholdFromTier(reliefTier),
    riverTrace: resolveRiverTraceForMap(mapLabel, wd.rivers),
  };
}

/** Twardy sufit miast-państw w klastrze (Maciej 2026-07-04: max 9 + stolica gracza = 10). */
export const MAX_MIAST_PANSTWA = 9;

/** Ogranicza liczbę miast-państw do [1, MAX_MIAST_PANSTWA]. */
export function clampMiastaPanstwaCount(raw: number): number {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, MAX_MIAST_PANSTWA);
}

/** Twardy sufit typów cywilizacji w menu (roster silnika: 15 nacji). */
export const MAX_TYPY_CYWILIZACJI_MENU = 15;

/** Liczba nacji dostępnych przy starcie w danej epoce (kaskada D-CYW-EPOKA-WEJSCIA). */
export function maxCivTypesForStartEpoch(
  epochId: string,
  civRoster: readonly CivEntryEpochRow[],
): number {
  return civIdsAvailableAtGameEpoch(civRoster, epochId).length;
}

function clampTypyTripleToEpoch(
  triple: MapScaleTriple,
  epochId: string | undefined,
  civRoster: readonly CivEntryEpochRow[] | undefined,
): MapScaleTriple {
  if (!epochId || !civRoster || civRoster.length === 0) return triple;
  const epochMax = maxCivTypesForStartEpoch(epochId, civRoster);
  if (epochMax <= 0) return triple;
  const max = Math.min(triple.max, epochMax);
  let def = Math.min(triple.default, max);
  let min = Math.min(triple.min, max);
  if (min > max) min = Math.max(1, max - 1);
  if (def < min) def = max;
  if (def > max) def = max;
  return { min, default: def, max };
}

/** Menu „Miasta-państwa" — drabinka Maciej: max 9 (Super Huge), mniejsze mapy proporcjonalnie mniej. */
const MAP_MENU_TIER_ORDER: readonly RozmiarSwiata[] = [
  'malenki', 'maly', 'standardowy', 'duzy', 'ogromny', 'superogromny',
];

interface MapScaleTriple {
  min: number;
  default: number;
  max: number;
}

/** min · domyślne · max — miasta-państwa per klaster (sufit 9, skala z mapą). */
const MIASTA_PANSTWA_MENU_BY_TIER: readonly MapScaleTriple[] = [
  { min: 2, default: 3, max: 4 },
  { min: 3, default: 4, max: 5 },
  { min: 4, default: 6, max: 7 },
  { min: 5, default: 7, max: 8 },
  { min: 6, default: 8, max: MAX_MIAST_PANSTWA },
  { min: 7, default: 8, max: MAX_MIAST_PANSTWA },
];

/** Pula typów cywilizacji wg epoki startu (CIV-MAP-EPOCH-Q1 / CIV-EPOCH-SPAWN-Q1). */
export const EPOCH_CIV_TYPE_POOL: Readonly<Record<StartEpochId, number>> = {
  kamien: 8,
  braz: 14,
  zelazo: 15,
};

function normStartEpochId(epochId: string | undefined): StartEpochId {
  const n = (epochId ?? 'kamien').toLowerCase().replace(/ł/g, 'l').trim();
  if (n === 'braz' || n === 'bronz') return 'braz';
  if (n === 'zelazo' || n === 'iron') return 'zelazo';
  return 'kamien';
}

function tripleFromDefault(def: number, pool: number): MapScaleTriple {
  const max = Math.min(def + 1, pool);
  let min = Math.max(1, def - 1);
  let adjustedDef = Math.min(Math.max(def, 1), pool);
  if (min >= max) min = Math.max(1, max - 1);
  if (adjustedDef <= min) adjustedDef = Math.min(min + 1, max);
  if (adjustedDef >= max) adjustedDef = Math.max(min + 1, max - 1);
  return { min, default: adjustedDef, max };
}

/**
 * Fallback macierzy mapa × epoka (CIV-MAP-EPOCH-Q1 = A) — gdy brak wpisu w JSON.
 * Indeks tier: malenki … superogromny.
 */
const TYPY_CYWILIZACJI_DEFAULT_BY_TIER: Readonly<
  Record<StartEpochId, readonly number[]>
> = {
  kamien: [3, 4, 5, 6, 7, 7],
  braz: [4, 5, 6, 9, 11, 13],
  zelazo: [4, 5, 6, 10, 12, 14],
};

function fallbackTypyTriple(menuLabel: string, epochId: StartEpochId): MapScaleTriple {
  const tierIdx = mapMenuTierIndex(menuLabel);
  const pool = EPOCH_CIV_TYPE_POOL[epochId];
  const def = TYPY_CYWILIZACJI_DEFAULT_BY_TIER[epochId][tierIdx]
    ?? TYPY_CYWILIZACJI_DEFAULT_BY_TIER[epochId][2]!;
  return tripleFromDefault(def, pool);
}

/** min · domyślne · max — typy cywilizacji per mapa i epoka startu. */
export function civTypesTripleForMapLabel(
  menuLabel: string,
  epochId: string = 'kamien',
): MapScaleTriple {
  const ep = normStartEpochId(epochId);
  const fromE = eStartTypyCywilizacjiPerEpoka(menuLabel, ep);
  if (fromE) {
    return {
      min: fromE.min,
      default: fromE.default,
      max: fromE.max,
    };
  }
  const legacy = eStartTypyCywilizacji(menuLabel);
  if (legacy != null && legacy > 0) {
    return tripleFromDefault(legacy, EPOCH_CIV_TYPE_POOL[ep]);
  }
  return fallbackTypyTriple(menuLabel, ep);
}

function mapMenuTierIndex(menuLabel: string): number {
  const idx = MAP_MENU_TIER_ORDER.indexOf(rozmiarFromMenuLabel(menuLabel));
  return idx >= 0 ? idx : 2;
}

function miastaPanstwaTriple(menuLabel: string): MapScaleTriple {
  return MIASTA_PANSTWA_MENU_BY_TIER[mapMenuTierIndex(menuLabel)] ?? MIASTA_PANSTWA_MENU_BY_TIER[2]!;
}

function typyCywilizacjiTriple(menuLabel: string, epochId: string = 'kamien'): MapScaleTriple {
  return civTypesTripleForMapLabel(menuLabel, epochId);
}

function menuBundleFromTriple(
  triple: MapScaleTriple,
  defaultHint: string,
  lowHint: string,
  highHint: string,
): RywaleMenuBundle {
  const opts = [String(triple.min), String(triple.default), String(triple.max)];
  const descs = opts.map((n) =>
    n === String(triple.default) ? defaultHint : parseInt(n, 10) < triple.default ? lowHint : highHint,
  );
  const domyslny = Math.max(0, opts.indexOf(String(triple.default)));
  return { opts, descs, domyslny: domyslny >= 0 ? domyslny : 1 };
}

/** Domyślna liczba miast-państw w klastrze (Panel-E → fallback drabinka tier). */
export function defaultMiastaPanstwaFromMapLabel(menuLabel: string): number {
  const fromE = eStartMiastaPanstwa(menuLabel);
  if (fromE != null && fromE > 0) return clampMiastaPanstwaCount(fromE);
  return miastaPanstwaTriple(menuLabel).default;
}

export function miastaPanstwaMenuForMapLabel(menuLabel: string): RywaleMenuBundle {
  const triple = miastaPanstwaTriple(menuLabel);
  return menuBundleFromTriple(
    triple,
    'Zalecane dla tej mapy (np. Sparta, Kapua) — min 3 hex',
    'Mniej miast w klastrze',
    'Więcej miast w klastrze',
  );
}

export interface CivTypesMenuBundle {
  opts: string[];
  descs: string[];
  domyslny: number;
}

/** Domyślna liczba typów cywilizacji (macierz mapa × epoka; clamp puli epoki). */
export function defaultCivTypesFromMapLabel(
  menuLabel: string,
  epochId: string = 'kamien',
  civRoster?: readonly CivEntryEpochRow[],
): number {
  let def = typyCywilizacjiTriple(menuLabel, epochId).default;
  if (civRoster && civRoster.length > 0) {
    def = Math.min(def, maxCivTypesForStartEpoch(epochId, civRoster));
  }
  return Math.max(1, def);
}

export function civTypesMenuForMapLabel(
  menuLabel: string,
  epochId: string = 'kamien',
  civRoster?: readonly CivEntryEpochRow[],
): CivTypesMenuBundle {
  const triple = clampTypyTripleToEpoch(
    typyCywilizacjiTriple(menuLabel, epochId),
    epochId,
    civRoster,
  );
  return menuBundleFromTriple(
    triple,
    'Zalecane dla tej mapy (obce klastry ≥5 hex od stolicy)',
    'Mniej frakcji na mapie',
    'Więcej frakcji na mapie',
  );
}

/** Pomocnicze: rozmiar menu → wymiary (re-export dla UI). */
export { menuLabelToDims, rozmiarFromMenuLabel };
