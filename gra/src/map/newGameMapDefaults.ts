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
  mapGenAktywneTypy,
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
} from '../data/e-start-params-loader';
import { normPlMenuLabel } from '../util/norm-pl-label';
import { menuLabelToDims, rozmiarFromMenuLabel, type RozmiarSwiata } from './generator';

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

/** Aktywne typy nacji na mapie (Panel-A / Panel-E JSON). */
export function aktywneTypyFromMapLabel(menuLabel: string): number {
  const fromE = eStartTypyCywilizacji(menuLabel);
  if (fromE != null && fromE > 0) return fromE;
  const lut: Record<MapSizeLabel, number> = {
    mala: mapGenAktywneTypy('mala'),
    srednia: mapGenAktywneTypy('srednia'),
    duza: mapGenAktywneTypy('duza'),
    ogromna: mapGenAktywneTypy('ogromna'),
    super: mapGenAktywneTypy('super'),
  };
  return lut[mapSizeLabelFromMenuLabel(menuLabel)] ?? mapGenAktywneTypy('duza');
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
 * Tier katalogowy (np. 25) obowiązuje jako cel; siatka akceptuje krótsze na wąskich lądach.
 */
export function riverGridTraceMinLen(catalogMinLen: number, tier: DensityTier = 'medium'): number {
  const cap = tier === 'low' ? 10 : 12;
  return Math.min(catalogMinLen, cap);
}

export function resolveRiverTraceForMap(
  mapMenuLabel: string,
  riversTier: DensityTier,
): { minLen: number; maxLen: number; margin: number } {
  const base = riverTraceLimitsForMap(mapMenuLabel);
  const minLen = riverMinPathLengthForTier(riversTier);
  return {
    minLen,
    maxLen: Math.max(base.maxLen, minLen * 3, minLen + 40),
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

/** Twardy sufit miast-państw w klastrze (Maciej 2026-07-04). */
export const MAX_MIAST_PANSTWA = 9;

/** Twardy sufit typów cywilizacji w menu (roster silnika: 15 nacji). */
export const MAX_TYPY_CYWILIZACJI_MENU = 14;

/** Menu „Miasta-państwa" — drabinka Maciej: Ogromny/Super 7·8·9, każdy mniejszy rozmiar −1. */
const MAP_MENU_TIER_ORDER: readonly RozmiarSwiata[] = [
  'malenki', 'maly', 'standardowy', 'duzy', 'ogromny', 'superogromny',
];

interface MapScaleTriple {
  min: number;
  default: number;
  max: number;
}

/** min · domyślne · max — miasta-państwa per klaster. */
const MIASTA_PANSTWA_MENU_BY_TIER: readonly MapScaleTriple[] = [
  { min: 3, default: 4, max: 5 },
  { min: 4, default: 5, max: 6 },
  { min: 5, default: 6, max: 7 },
  { min: 6, default: 7, max: 8 },
  { min: 7, default: 8, max: MAX_MIAST_PANSTWA },
  { min: 7, default: 8, max: MAX_MIAST_PANSTWA },
];

/** min · domyślne · max — typy cywilizacji (gracz + obce); osobna skala, boost Ogromny/Super. */
const TYPY_CYWILIZACJI_MENU_BY_TIER: readonly MapScaleTriple[] = [
  { min: 3, default: 4, max: 6 },
  { min: 4, default: 5, max: 8 },
  { min: 5, default: 6, max: 10 },
  { min: 6, default: 7, max: 11 },
  { min: 8, default: 10, max: 12 },
  { min: 10, default: 12, max: MAX_TYPY_CYWILIZACJI_MENU },
];

function mapMenuTierIndex(menuLabel: string): number {
  const idx = MAP_MENU_TIER_ORDER.indexOf(rozmiarFromMenuLabel(menuLabel));
  return idx >= 0 ? idx : 2;
}

function miastaPanstwaTriple(menuLabel: string): MapScaleTriple {
  return MIASTA_PANSTWA_MENU_BY_TIER[mapMenuTierIndex(menuLabel)] ?? MIASTA_PANSTWA_MENU_BY_TIER[2]!;
}

function typyCywilizacjiTriple(menuLabel: string): MapScaleTriple {
  return TYPY_CYWILIZACJI_MENU_BY_TIER[mapMenuTierIndex(menuLabel)] ?? TYPY_CYWILIZACJI_MENU_BY_TIER[2]!;
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
  if (fromE != null && fromE > 0) return Math.min(fromE, MAX_MIAST_PANSTWA);
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

/** Domyślna liczba typów cywilizacji (Panel-E → fallback drabinka tier). */
export function defaultCivTypesFromMapLabel(menuLabel: string): number {
  const fromE = eStartTypyCywilizacji(menuLabel);
  if (fromE != null && fromE > 0) return Math.min(fromE, MAX_TYPY_CYWILIZACJI_MENU);
  return typyCywilizacjiTriple(menuLabel).default;
}

export function civTypesMenuForMapLabel(menuLabel: string): CivTypesMenuBundle {
  const triple = typyCywilizacjiTriple(menuLabel);
  return menuBundleFromTriple(
    triple,
    'Zalecane dla tej mapy (obce klastry ≥5 hex od stolicy)',
    'Mniej głównych typów na mapie',
    'Więcej obcych typów cywilizacji',
  );
}

/** Pomocnicze: rozmiar menu → wymiary (re-export dla UI). */
export { menuLabelToDims, rozmiarFromMenuLabel };
