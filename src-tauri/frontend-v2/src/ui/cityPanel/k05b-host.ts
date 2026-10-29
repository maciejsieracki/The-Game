/**
 * K05B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K05B-Q1, runda 2): warstwa wejść dla jednostek K05 z DOM.
 *
 * Jednostki K05B (`k05b-podzial.ts`, `k05b-widgety.ts`, `k05b-karty.ts`, `k05b-jednostki.ts`, `k05b-chipy.ts`) są kopiami
 * linii pinu `edb8fb56` (bramka `tools/dom-harness/verify-k05b-copies.mjs`, z komentarzami). Wołają nazwy, które w pinie są
 * deklarowane w blokach K03/K04/K09 (`cfg`, `readPodzialHandlu`, `isMeCity`, `rerender`, …), nazwy z modułów `game/*`
 * (reguły gry) albo adaptery o innej sygnaturze w już zaportowanych kawałkach. Ten moduł daje te nazwy o SYGNATURACH PINU.
 *
 * Zasady (P5.13): nic tu nie liczy reguł gry. Wartości przychodzą przez `setK05bHost` (wiring z kontrolera — NIE_ZMIERZONO,
 * patrz P5-8-K05B.md §6); reguły (`K05bRules`) są delegatorami do silnika.
 *
 * Zakotwiczenia: K05B-Z1 (delegatory hosta), K05B-Z2 (stałe), K05B-Z5 (lokalne typy), K05B-Z7 (adaptery sygnatur),
 * K05B-Z8 (pomocniki pinu z `game/*` i UI poza zakresem: delegatory do `rules`, bez kopii ciał), K05B-Z9 (tabele reguł).
 */
import type { CityMoneySnap, CityView } from './k01b-t';
import { daninaLabelForCity as daninaLabelForCityK01B } from './k01b-t';
import type { PodzialHandluSplit } from './k01a-fundament';
import { appendIndywidualneToggle as appendIndywidualneToggleK02 } from './k02-units';
import { formatResourceUpkeepSummary as formatResourceUpkeepSummaryK04 } from './k04-stock';
import type { AvailabilityContext, BuildingReqChip } from './k05a-fundament';

export type { AvailabilityContext, BuildingReqChip, CityView };

/** K05B-Z5: lokalna kopia typu `City` z pinu — pola używane przez jednostki K05B. */
export interface City {
  readonly id: number;
  readonly ownerId: number;
  readonly wealthState?: { readonly poziom: number };
}

/** K05B-Z5: lokalna kopia typu `BuildingDef` (pin: data/loader.ts) — pola czytane przez jednostki K05B. */
export interface BuildingDef {
  readonly id: string;
  readonly nazwa: string;
  readonly kategoria?: string;
  readonly epokaWejscia: number;
  readonly wielokrotny?: boolean;
  readonly maksPoziom: number;
  readonly baza: Readonly<Partial<Record<string, number>>>;
  readonly przyrost: Readonly<Partial<Record<string, number>>>;
  readonly przyrostKosztu?: number;
  readonly przyrostUtrzymania?: number;
  readonly nazwyPoziomow: readonly string[];
  readonly techUnlock?: string;
  readonly upgradeFrom?: string;
  readonly lokalizacja?: 'stolica' | 'region';
  readonly wymagania?: string | null;
  readonly koszt_surowce?: Readonly<Record<string, number>> | null;
  readonly wymaganySurowiec?: string | null;
}

/** K05B-Z5: lokalna kopia typu `UnitDef` (pin: data/loader.ts) — pola czytane przez jednostki K05B. */
export interface UnitDef {
  readonly id: string;
  readonly Jednostka: string;
  readonly 'Rola (linia)'?: string;
  readonly Epoka?: string;
  readonly Kultura?: string | null;
  readonly 'Super-jednostka'?: string;
  readonly 'W zamian za'?: string | null;
  readonly Atak?: number;
  readonly Obrona?: number;
  readonly Uderzenie?: number;
  readonly Pancerz?: number;
  readonly Przebicie?: number;
  readonly 'Atak dystansowy'?: number;
  readonly Health?: number;
  readonly Ruch?: number;
  readonly 'Ruch w bitwie (heksy)'?: number;
  readonly 'Zasięg ataku (hex)'?: number;
  readonly 'Ilość pocisków'?: number;
  readonly 'Widok pola'?: number;
  readonly 'Kara obrony z flanki (%)'?: number;
  readonly 'Kara obrony z tyłu (%)'?: number;
  readonly 'Próg dezercji (% health)'?: number;
  readonly 'Pieniądz (koszt)'?: number;
  readonly 'Utrzymanie (Pieniądz/turę)'?: number;
  readonly 'żywność/turę'?: number;
  readonly Ludność?: number;
  readonly Surowiec?: string | null;
  readonly 'Surowiec (ilość)'?: number;
  readonly Tech?: string | null;
  readonly [key: string]: unknown;
}

/** K05B-Z5: pola definicji technologii czytane przez `appendTechDetailBlock` (pin: data/loader.ts `TechDef`). */
export interface TechDefK05b {
  readonly Epoka?: string;
  readonly Poziom?: number;
  readonly 'Koszt nauki'?: number | string;
  readonly 'Wymaga (prereq)'?: string | null;
  readonly 'wymagany budynek'?: string | null;
  readonly 'Dostęp do surowca.'?: string | null;
  readonly 'Odblokowuje budynek'?: string | null;
  readonly 'Odblokowuje surowiec.'?: string | null;
  readonly Uwagi?: string | null;
  readonly [key: string]: unknown;
}

/** K05B-Z5: lokalna kopia `ProductionItem` (pin: game/production.ts) — pola używane przez jednostki K05B. */
export interface ProductionItem {
  readonly id: string;
  readonly koszt: number;
  readonly kind: string;
}

/** K05B-Z5: dane gry (pin: data/loader.ts `GameData`) — katalogi budynków i jednostek. */
export interface GameData {
  readonly buildings: readonly BuildingDef[];
  readonly units: readonly UnitDef[];
  readonly econParams?: unknown;
}

/** K05B-Z1: metody `cfg` pinu używane przez jednostki K05B; wartości z DTO/silnika (wiring poza zakresem). */
export interface K05bCfg {
  getTreasury?: (ownerId: number) => number | undefined;
  getCityMoneySnap?: (cityId: number) => CityMoneySnap | undefined;
  getPodzialHandluOverride?: (cityId: number) => boolean | undefined;
  onPodzialHandluChange?: (cityId: number, split: PodzialHandluSplit) => void;
  onPodzialHandluOverrideToggle?: (cityId: number) => void;
  onLeaveGarrison?: (unitId: string) => void;
  getUnlockedTechs?: (ownerId: number) => readonly string[] | undefined;
  getBuildingCostPace?: () => string | undefined;
  getDifficulty?: () => string | undefined;
  getEpoch?: (ownerId: number) => number | undefined;
  getCivBonusy?: (ownerId: number) => readonly unknown[] | undefined;
  getManpowerSnapshot?: (cityId: number) => ManpowerSnapshotK05b | undefined;
  /** K08B-Z2 (runda 1): pin `cfg.getBuiltBuildingIds?.(city.id)` — używane przez `renderOwnedBuildingsBar` (K08B). */
  getBuiltBuildingIds?: (cityId: number) => readonly string[] | undefined;
}

/** K05B-Z5: migawka rekrutów miasta (pin: `getManpowerSnapshot`) — pola czytane przez `buildRecruitTabDetailCard`. */
export interface ManpowerSnapshotK05b {
  readonly manpowerBiezacy: number;
  readonly manpowerMax: number;
  readonly kosztJednostki: number;
  readonly epoka: number;
}

/**
 * K05B-Z8: pomocniki pinu z `game/*` (reguły gry) i UI spoza zakresu K05B — wartości przez host (silnik/kontroler).
 * Nazwy i sygnatury jak w pinie; ciał nie kopiujemy (NIE_ZMIERZONO, patrz P5-8-K05B.md §4/§6).
 */
export interface K05bRules {
  etaTurns(koszt: number, postep: number, praca: number): number | null;
  formatManpower(n: number): string;
  itemCost(kind: 'budynek' | 'jednostka', id: string, data: { buildings: readonly BuildingDef[]; units: readonly UnitDef[] }, cityLevelOrEpoch: number): number;
  unitManpowerCost(epoka: number, maxMult?: number): number;
  civManpowerMaxMult(bonusy: readonly unknown[] | undefined): number;
  buildingWorkCost(baseCost: number, civBonusy?: readonly unknown[], pace?: string, ownerId?: number, difficulty?: string): number;
  mnoznikRoleForBuildingId(id: string): 'pancerz' | 'parametry' | null;
  cumulativeMnoznikForBuildingId(id: string, buildings: readonly BuildingDef[] | null | undefined): number;
  buildingStructuralDefenseBonusLine(id: string): string | null;
  upgradeChainSteps(id: string, buildings: readonly BuildingDef[]): BuildingDef[];
  upgradeCompositionLines(id: string, buildings: readonly BuildingDef[]): string[];
  buildingStockCost(def: { readonly epokaWejscia?: number | null; readonly koszt_surowce?: Readonly<Record<string, number>> | null } | null | undefined): Record<string, number>;
  buildingRequiredActiveLabels(def: { readonly id: string; readonly epokaWejscia?: number; readonly wymaganySurowiec?: string | null }): readonly string[];
  empireResourceLabelSatisfied(
    label: string,
    activeLabels: readonly string[] | undefined,
    empireBuiltIds: readonly string[] | undefined,
    empireStock: Readonly<Record<string, number>> | undefined,
    buildingId?: string,
  ): boolean;
  isBuildingSupersededByUpgrade(buildingId: string, builtIds: readonly string[], buildings: readonly { readonly id: string; readonly upgradeFrom?: string }[]): boolean;
  cityBuildingPrereqMet(
    prereq: string | readonly string[] | undefined,
    builtList: readonly string[],
    buildings: readonly { readonly id: string; readonly upgradeFrom?: string }[],
    isSuperseded: (id: string, builtList: readonly string[], buildings: readonly { readonly id: string; readonly upgradeFrom?: string }[]) => boolean,
  ): boolean;
  /** K05B-Z9: tabela `CITY_BUILDING_PREREQ` (pin: game/building-resource-gate.ts:104) — wpis po id budynku. */
  cityBuildingPrereqOf(id: string): string | readonly string[] | undefined;
  /** K05B-Z9: zbiór `WATER_ACCESS_BUILDING_IDS` (pin: game/building-resource-gate.ts:143) — przynależność po id. */
  isWaterAccessBuilding(id: string): boolean;
  buildingUiDisplayLevel(def: BuildingDef, city?: City): number;
  productionCtxForCity(city: City): AvailabilityContext;
  ownerSurowcePoolFor(city: City): Readonly<Record<string, number>>;
  getTechDef(data: GameData, name: string): TechDefK05b | undefined;
  techPrereqChain(data: GameData, techName: string): string[];
  naukaCostSuffix(): string;
  unitResourceUpkeep(u: UnitDef): Record<string, number>;
  getProd(cityId: number): { readonly rekrutacja?: readonly unknown[]; readonly kolejka?: readonly unknown[] };
  appendBuildActionButtons(
    btnWrap: HTMLElement,
    city: City,
    item: ProductionItem,
    skarb: number | undefined,
    buildLabel: 'Buduj' | 'Ulepsz',
    upgrade?: boolean,
    opts?: { requirementsMet?: boolean; showPurchase?: boolean },
  ): void;
}

/** K05B-Z1: metody `cfg`/`rerender`/… pinu (wejścia hosta). */
export interface K05bHost {
  readonly cfg: K05bCfg;
  readPodzialHandlu(city: City, data: GameData | null): PodzialHandluSplit;
  isMeCity(ownerId: number): boolean;
  adjustHandelSplit(split: PodzialHandluSplit, key: keyof PodzialHandluSplit, value: number): PodzialHandluSplit;
  freshWealthState(): { readonly poziom: number };
  stockResourceLabel(key: string): string;
  rerender(): void;
  readonly rules: K05bRules;
}

let host: K05bHost | null = null;

/** Wejście K05B (wiring z kontrolera poza zakresem — NIE_ZMIERZONO, P5-8-K05B.md §6). */
export function setK05bHost(next: K05bHost): void {
  host = next;
}

function h(): K05bHost {
  if (host === null) throw new Error('K05B: brak wejść hosta (setK05bHost)');
  return host;
}

/** K05B-Z1: `cfg` pinu jako widok na `host.cfg` (odczyt przy każdym wywołaniu, jak `let cfg` w pinie). */
export const cfg: K05bCfg = new Proxy({} as K05bCfg, {
  get: (_t, k) => h().cfg[k as keyof K05bCfg],
});

/** K05B-Z1: pin `rerender` (blok K09, cięcie P5.8-Z1) — przez host. */
export function rerender(): void {
  h().rerender();
}

/** K05B-Z1: pin `readPodzialHandlu` (blok K03) — przez host. */
export function readPodzialHandlu(city: City, data: GameData | null): PodzialHandluSplit {
  return h().readPodzialHandlu(city, data);
}

/** K05B-Z1: pin `isMeCity` (blok K03) — przez host. */
export function isMeCity(ownerId: number): boolean {
  return h().isMeCity(ownerId);
}

/** K05B-Z1: pin `adjustHandelSplit` (game/cities) — reguła silnika, przez host. */
export function adjustHandelSplit(split: PodzialHandluSplit, key: keyof PodzialHandluSplit, value: number): PodzialHandluSplit {
  return h().adjustHandelSplit(split, key, value);
}

/** K05B-Z1: pin `freshWealthState` (game/wealth) — przez host. */
export function freshWealthState(): { readonly poziom: number } {
  return h().freshWealthState();
}

/** K05B-Z1: pin `stockResourceLabel` (K05A-Z4 wiring) — etykieta surowca z hosta. */
export function stockResourceLabel(key: string): string {
  return h().stockResourceLabel(key);
}

/**
 * K05B-Z2: pin `daninaLabelGenitive` (game/danina-nazwa.ts:17, `export function daninaLabelGenitive`) — stała etykieta,
 * zawsze `podatku` (decyzja 2026-07-27); nie jest regułą gry. Bramka: `verify-k05b-copies` (CONST, blok pinu).
 */
export function daninaLabelGenitive(_label?: string): 'podatku' {
  return 'podatku';
}

/** K05B-Z7: adapter sygnatury pinu `daninaLabelForCity(city)`; etykieta stała (K01B: `daninaLabelForCity`). */
export function daninaLabelForCity(city: City): string {
  void city;
  return daninaLabelForCityK01B({});
}

/** K05B-Z7: adapter sygnatury pinu `formatResourceUpkeepSummary(resources)`; etykiety z hosta (`stockResourceLabel`). */
export function formatResourceUpkeepSummary(resources: Readonly<Record<string, number>>): string {
  const labels = new Proxy({} as Record<string, string>, {
    get: (_t, k) => (typeof k === 'string' ? h().stockResourceLabel(k) : undefined),
  });
  return formatResourceUpkeepSummaryK04(resources, labels);
}

/** K05B-Z7: adapter sygnatury pinu `appendIndywidualneToggle(mount, on, onToggle, rowCls)`; odświeżenie z hosta. */
export function appendIndywidualneToggle(
  mount: HTMLElement,
  overrideOn: boolean,
  onToggle: () => void,
  rowCls: string,
): void {
  appendIndywidualneToggleK02(mount, overrideOn, onToggle, rowCls, rerender);
}

/** K05B-Z2: stała pinu `game/cities.ts:578` (`export const HANDEL_PCT_STEP = 10;`), bramka verify-k05b-copies. */
export const HANDEL_PCT_STEP = 10;
/** K05B-Z2: stała pinu `game/cities.ts:581` (`export const MAX_PROCENT_NAUKA = 60;`), bramka verify-k05b-copies. */
export const MAX_PROCENT_NAUKA = 60;

// ─── K05B-Z8: delegatory reguł i pomocników pinu (nazwy i sygnatury jak w pinie) ──────────────────────────────────────

export function etaTurns(koszt: number, postep: number, praca: number): number | null {
  return h().rules.etaTurns(koszt, postep, praca);
}
export function formatManpower(n: number): string {
  return h().rules.formatManpower(n);
}
export function itemCost(
  kind: 'budynek' | 'jednostka',
  id: string,
  data: { buildings: readonly BuildingDef[]; units: readonly UnitDef[] },
  cityLevelOrEpoch: number,
): number {
  return h().rules.itemCost(kind, id, data, cityLevelOrEpoch);
}
export function unitManpowerCost(epoka: number, maxMult = 1): number {
  return h().rules.unitManpowerCost(epoka, maxMult);
}
export function civManpowerMaxMult(bonusy: readonly unknown[] | undefined): number {
  return h().rules.civManpowerMaxMult(bonusy);
}
export function buildingWorkCost(
  baseCost: number,
  civBonusy?: readonly unknown[],
  pace?: string,
  ownerId = 0,
  difficulty = 'normal',
): number {
  return h().rules.buildingWorkCost(baseCost, civBonusy, pace, ownerId, difficulty);
}
export function mnoznikRoleForBuildingId(id: string): 'pancerz' | 'parametry' | null {
  return h().rules.mnoznikRoleForBuildingId(id);
}
export function cumulativeMnoznikForBuildingId(id: string, buildings: readonly BuildingDef[] | null | undefined): number {
  return h().rules.cumulativeMnoznikForBuildingId(id, buildings);
}
export function buildingStructuralDefenseBonusLine(id: string): string | null {
  return h().rules.buildingStructuralDefenseBonusLine(id);
}
export function upgradeChainSteps(id: string, buildings: readonly BuildingDef[]): BuildingDef[] {
  return h().rules.upgradeChainSteps(id, buildings);
}
export function upgradeCompositionLines(id: string, buildings: readonly BuildingDef[]): string[] {
  return h().rules.upgradeCompositionLines(id, buildings);
}
export function buildingStockCost(
  def: { readonly epokaWejscia?: number | null; readonly koszt_surowce?: Readonly<Record<string, number>> | null } | null | undefined,
): Record<string, number> {
  return h().rules.buildingStockCost(def);
}
export function buildingRequiredActiveLabels(def: { readonly id: string; readonly epokaWejscia?: number; readonly wymaganySurowiec?: string | null }): readonly string[] {
  return h().rules.buildingRequiredActiveLabels(def);
}
export function empireResourceLabelSatisfied(
  label: string,
  activeLabels: readonly string[] | undefined,
  empireBuiltIds?: readonly string[],
  empireStock?: Readonly<Record<string, number>>,
  buildingId?: string,
): boolean {
  return h().rules.empireResourceLabelSatisfied(label, activeLabels, empireBuiltIds, empireStock, buildingId);
}
export function isBuildingSupersededByUpgrade(
  buildingId: string,
  builtIds: readonly string[],
  buildings: readonly { readonly id: string; readonly upgradeFrom?: string }[],
): boolean {
  return h().rules.isBuildingSupersededByUpgrade(buildingId, builtIds, buildings);
}
export function cityBuildingPrereqMet(
  prereq: string | readonly string[] | undefined,
  builtList: readonly string[],
  buildings: readonly { readonly id: string; readonly upgradeFrom?: string }[],
  isSuperseded: (id: string, builtList: readonly string[], buildings: readonly { readonly id: string; readonly upgradeFrom?: string }[]) => boolean,
): boolean {
  return h().rules.cityBuildingPrereqMet(prereq, builtList, buildings, isSuperseded);
}
/** K05B-Z9: pin `CITY_BUILDING_PREREQ` (game/building-resource-gate.ts:104) — widok na tabelę silnika (`rules.cityBuildingPrereqOf`). */
export const CITY_BUILDING_PREREQ: Readonly<Record<string, string | readonly string[] | undefined>> = new Proxy(
  {} as Record<string, string | readonly string[] | undefined>,
  { get: (_t, k) => (typeof k === 'string' ? h().rules.cityBuildingPrereqOf(k) : undefined) },
);
/** K05B-Z9: pin `WATER_ACCESS_BUILDING_IDS` (game/building-resource-gate.ts:143) — zbiór za widokiem `rules.isWaterAccessBuilding`. */
export const WATER_ACCESS_BUILDING_IDS: ReadonlySet<string> = {
  has: (id: string) => h().rules.isWaterAccessBuilding(id),
} as unknown as ReadonlySet<string>;
export function buildingUiDisplayLevel(def: BuildingDef, city?: City): number {
  return h().rules.buildingUiDisplayLevel(def, city);
}
export function productionCtxForCity(city: City): AvailabilityContext {
  return h().rules.productionCtxForCity(city);
}
export function ownerSurowcePoolFor(city: City): Readonly<Record<string, number>> {
  return h().rules.ownerSurowcePoolFor(city);
}
export function getTechDef(data: GameData, name: string): TechDefK05b | undefined {
  return h().rules.getTechDef(data, name);
}
export function techPrereqChain(data: GameData, techName: string): string[] {
  return h().rules.techPrereqChain(data, techName);
}
export function naukaCostSuffix(): string {
  return h().rules.naukaCostSuffix();
}
export function unitResourceUpkeep(u: UnitDef): Record<string, number> {
  return h().rules.unitResourceUpkeep(u);
}
export function getProd(cityId: number): { readonly rekrutacja?: readonly unknown[]; readonly kolejka?: readonly unknown[] } {
  return h().rules.getProd(cityId);
}
export function appendBuildActionButtons(
  btnWrap: HTMLElement,
  city: City,
  item: ProductionItem,
  skarb: number | undefined,
  buildLabel: 'Buduj' | 'Ulepsz',
  upgrade?: boolean,
  opts?: { requirementsMet?: boolean; showPurchase?: boolean },
): void {
  h().rules.appendBuildActionButtons(btnWrap, city, item, skarb, buildLabel, upgrade, opts);
}
