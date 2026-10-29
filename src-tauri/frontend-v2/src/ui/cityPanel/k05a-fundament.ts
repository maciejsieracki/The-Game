/**
 * K05A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K05A-Q1, runda 2): jednostki K05 bez DOM i bez importów wartości logiki gry.
 *
 * Każdy blok poprzedzony markerem `// pin edb8fb56 gra/src/<plik>:A-B` jest kopią linii A..B pinu, łącznie z komentarzami
 * dokumentacyjnymi (bramka `tools/dom-harness/verify-k05a-copies.mjs`). Jedyna zmiana bajtowa: `export ` przy deklaracjach
 * najwyższego poziomu (dopuszczone przez verify). Wyjątki udokumentowane w P5-8-K05A.md §5:
 *   K05A-Z1 — lokalne kopie typów/enum z pinu (`TerenBazowy` z types/hex.ts, `OkolicaTryb` z game/cities.ts);
 *   K05A-Z2 — w `okolicaPreviewRadius` parametr `city: City` zastąpiony typem `CityHexRef` (DTO: pola q, r).
 * Reguła P5.13: funkcje tylko formatują i liczą geometrię podglądu; żadna reguła gry nie jest liczona w UI.
 */

import { UI_PARAMS } from '../uiParams';

/** ZAŁOŻENIE K05A-Z2: pozycja miasta z DTO (jedyne pola `City` używane przez okolicaPreviewRadius). */
export type CityHexRef = { readonly q: number; readonly r: number };


// ─── K05A runda 3 (ZALOZENIA K05A-Z4, K05A-Z5; pelny opis w dyspozycje/rust-port/p5/P5-8-K05A.md) ─────────────────
// Jednostki K05A wołające reguły gry (pin: game/manpower, game/building-stock-cost, game/economy-upkeep, game/cities,
// data/loader, cfg) NIE liczą reguł w UI: wynik przychodzi przez `K05aRules` / `K05aCfg` (wartości z DTO
// `panelInputs.k05a`, P5.13). Każda taka funkcja pozostaje kopią pinu (ta sama sygnatura i te same teksty), a
// wywołanie reguły idzie przez delegator poniżej (K05A-Z4: cienki adapter, nie logika).

/** K05A-Z5: lokalna kopia typu `City` z pinu — tylko pola używane przez jednostki K05A. */
export interface City {
  readonly id: number;
  readonly ownerId: number;
  readonly q: number;
  readonly r: number;
}

/** K05A-Z5: lokalna kopia typu `UnitDef` (pin: data/loader.ts) — tylko `id`. */
export interface UnitDef {
  readonly id: string;
}

/** K05A-Z5: lokalna kopia typu `ProductionItem` (pin: game/production.ts) — pola używane przez jednostki K05A. */
export interface ProductionItem {
  readonly id: string;
  readonly koszt: number;
  readonly kind: string;
}

/** K05A-Z5: dane gry (pin: data/loader.ts `GameData`) — w K05A tylko przekazywane do adaptera reguł. */
export interface GameData {
  readonly econParams?: unknown;
  readonly buildings?: readonly BuildingDef[];
}

/** K05A-Z4: metody `cfg` pinu używane przez jednostki K05A; wartości z DTO `panelInputs.k05a`. */
export interface K05aCfg {
  getEpoch?: (ownerId: number) => number | undefined;
  getCivBonusy?: (ownerId: number) => readonly unknown[] | undefined;
  getEmpireRekruciTotal?: (ownerId: number) => number | undefined;
  getManpowerSnapshot?: (cityId: number) => { manpowerBiezacy: number } | undefined;
}

/** K05A-Z4: reguły gry liczone w silniku, nie w UI (pin: game/manpower, game/building-stock-cost, game/economy-upkeep). */
export interface K05aRules {
  civManpowerMaxMult(bonusy: unknown): number;
  unitManpowerCostForType(typeId: string, epoch: number, maxMult: number): number;
  ownerSurowcePoolFor(city: City): Readonly<Record<string, number>>;
  stockResourceLabel(key: string): string;
  unitStockCost(u: UnitDef | undefined): Record<string, number>;
  canAffordUnitRecruitStock(pool: Readonly<Record<string, number>>, u: UnitDef | undefined): boolean;
  missingStockFor(pool: Readonly<Record<string, number>>, cost: Record<string, number>): Record<string, number>;
  unitResourceUpkeep(u: UnitDef): Record<string, number>;
  isUnitRecruitStockChipMissing(pool: Readonly<Record<string, number>>, u: UnitDef, key: string): boolean;
  techPrereqChain(data: GameData, techName: string): string[];
}

let cfg: K05aCfg & K05aCfgExt & K05aCfgRecruit = {};
let rules: (K05aRules & K05aRulesExt & K05aRulesRecruit) | null = null;

/** Wejście z DTO `panelInputs.k05a` (wiring w kontrolerze poza zakresem K05A, NIE_ZMIERZONO). */
export function setK05aCfg(next: K05aCfg & K05aCfgExt & K05aCfgRecruit): void {
  cfg = next;
}

/** Wejście reguł z DTO `panelInputs.k05a` (wiring w kontrolerze poza zakresem K05A, NIE_ZMIERZONO). */
export function setK05aRules(next: K05aRules & K05aRulesExt & K05aRulesRecruit): void {
  rules = next;
}

function regul(): K05aRules & K05aRulesExt & K05aRulesRecruit {
  if (rules === null) throw new Error('K05A: brak wejść reguł (setK05aRules)');
  return rules;
}

// Delegatory reguł (K05A-Z4): nazwy jak w pinie, ciało = wynik z DTO.
export function civManpowerMaxMult(bonusy: unknown): number {
  return regul().civManpowerMaxMult(bonusy);
}
export function unitManpowerCostForType(typeId: string, epoch: number, maxMult: number): number {
  return regul().unitManpowerCostForType(typeId, epoch, maxMult);
}
export function ownerSurowcePoolFor(city: City): Readonly<Record<string, number>> {
  return regul().ownerSurowcePoolFor(city);
}
export function stockResourceLabel(key: string): string {
  return regul().stockResourceLabel(key);
}
export function unitStockCost(u: UnitDef | undefined): Record<string, number> {
  return regul().unitStockCost(u);
}
export function unitResourceUpkeep(u: UnitDef): Record<string, number> {
  return regul().unitResourceUpkeep(u);
}
export function isUnitRecruitStockChipMissing(pool: Readonly<Record<string, number>>, u: UnitDef, key: string): boolean {
  return regul().isUnitRecruitStockChipMissing(pool, u, key);
}
export function techPrereqChain(data: GameData, techName: string): string[] {
  return regul().techPrereqChain(data, techName);
}

/** K05A-Z5: lokalna kopia typu `BuildingDef` (pin: data/loader.ts) — pola używane przez jednostki K05A. */
export interface BuildingDef {
  readonly id: string;
  readonly nazwa?: string;
  readonly techUnlock?: string;
  readonly upgradeFrom?: string;
  readonly lokalizacja?: 'stolica' | 'region';
  readonly wymagania?: unknown;
}

/** K05A-Z5: lokalna kopia typu `BuildingCatalogEntry` (pin: game/production.ts) — pola używane przez jednostki K05A. */
export interface BuildingCatalogEntry {
  readonly id: string;
  readonly status: string;
  readonly locationBlocked?: 'stolica' | 'region';
  readonly missingTech?: string;
  readonly wymagania?: string;
}

/** K05A-Z5: lokalna kopia typu `AvailabilityContext` (pin: game/production.ts) — pola wypełniane przez `productionCtxForCity`. */
export interface AvailabilityContext {
  epoch: number;
  builtBuildingIds: readonly string[];
  productionQueue: readonly ProductionItem[];
  buildingLevel: number;
  civBonusy: readonly unknown[];
  civUnitNacja: unknown;
  placedImprovements: unknown;
  hasKopalniaNaZlozuZelaza: boolean;
  aliveUnitTypeNames: readonly string[] | undefined;
  buildingCostPace: string;
  kosztJednostekPace: string;
  ownerId: number;
  difficulty: string;
  activeResourceLabels: readonly string[];
  empireActiveResourceLabels: readonly string[] | undefined;
  empireBuiltIds: readonly string[] | undefined;
  empireResourceStock: Readonly<Record<string, number>> | undefined;
  cityHasCoastOrRiver: boolean;
  isCapital: boolean;
}

/** K05A-Z5: kopia typu `BuildingReqChip` (pin: ui/cityPanel.ts, typ lokalny) — wynik adaptera `buildingRequirementChips`. */
export type BuildingReqChipKind = 'tech' | 'stock' | 'other';
export interface BuildingReqChip {
  label: string;
  met: boolean;
  iconHtml?: string;
  kind: BuildingReqChipKind;
}

/** K05A-Z5: lokalna kopia typu `RawConverterParamsJson` (pin: game/converters.ts) — tylko przekazywany do reguły. */
export type RawConverterParamsJson = object;

/** K05A-Z5: lokalna kopia typu `CivBonusLite` (pin: game/production.ts) — wpis bonusu cywilizacji, nieużywany wewnątrz jednostek K05A. */
export type CivBonusLite = unknown;

/** K05A-Z4: pozostałe metody `cfg` pinu używane przez jednostki K05A (wartości z DTO `panelInputs.k05a`). */
export interface K05aCfgExt {
  difficulty?: string;
  getDifficulty?: () => string | undefined;
  getResourceAccess?: (cityId: number) => string[] | { active?: string[] } | undefined;
  getEmpireResourceAccess?: (ownerId: number) => readonly string[] | undefined;
  getEmpireBuiltIds?: (ownerId: number) => readonly string[] | undefined;
  getBuiltBuildingIds?: (cityId: number) => readonly string[] | undefined;
  getCivKey?: (ownerId: number) => string | undefined;
  getPlacedImprovements?: () => unknown;
  getHasKopalniaNaZlozuZelaza?: () => boolean | undefined;
  getAliveUnitTypeNames?: (ownerId: number) => readonly string[] | undefined;
  getBuildingCostPace?: () => string | undefined;
  getKosztJednostekPace?: () => string | undefined;
  getEmpireStock?: (ownerId: number) => Readonly<Record<string, number>> | undefined;
  getCityHasCoastOrRiver?: (cityId: number) => boolean | undefined;
  getCapitalCityId?: (ownerId: number) => number | null | undefined;
  getProd?: (cityId: number) => { readonly kolejka: readonly ProductionItem[] } | undefined;
}

/** K05A-Z4: reguły gry dla jednostek budynków (pin: game/converters, game/production, ui/cityPanel helpery). */
export interface K05aRulesExt {
  converterProductionDisplayForBuilding(
    id: string,
    raw: RawConverterParamsJson,
    difficulty: string,
    era: number,
  ): { consumed: Record<string, number>; produced: Record<string, number> } | null;
  findBuildingDef(data: GameData, id: string): BuildingDef | undefined;
  buildingRequirementChips(
    def: BuildingDef,
    city: City | undefined,
    data: GameData,
    ctx: AvailabilityContext,
    unlockedTechs: readonly string[],
  ): BuildingReqChip[];
  techIconHintSpan(tech: string, size?: number, opts?: { inheritColor?: boolean }): string;
  getTechDef(data: GameData, name: string): Record<string, unknown> | undefined;
  isEmptyDataVal(v: unknown): boolean;
  naukaCostSuffix(): string;
  eraBuildingCatalog(
    data: GameData,
    techs: readonly string[],
    prodCtx: {
      epoch?: number;
      builtBuildingIds?: readonly string[];
      productionQueue?: readonly ProductionItem[];
      buildingLevel?: number;
      civBonusy?: readonly unknown[];
    },
  ): BuildingCatalogEntry[];
  unitNacjaForCivKey(key: string | undefined): unknown;
}

function regulExt(): K05aRulesExt {
  return regul() as K05aRules & K05aRulesExt;
}

// Delegatory (K05A-Z4): helpery pinu z bloków 1-3 i reguły z silnika; nazwy i sygnatury jak w pinie.
export function converterProductionDisplayForBuilding(
  id: string,
  raw: RawConverterParamsJson,
  difficulty: string,
  era: number,
): { consumed: Record<string, number>; produced: Record<string, number> } | null {
  return regulExt().converterProductionDisplayForBuilding(id, raw, difficulty, era);
}
export function findBuildingDef(data: GameData, id: string): BuildingDef | undefined {
  return regulExt().findBuildingDef(data, id);
}
export function techIconHintSpan(tech: string, size?: number, opts?: { inheritColor?: boolean }): string {
  return regulExt().techIconHintSpan(tech, size, opts);
}
export function getTechDef(data: GameData, name: string): Record<string, unknown> | undefined {
  return regulExt().getTechDef(data, name);
}
export function isEmptyDataVal(v: unknown): boolean {
  return regulExt().isEmptyDataVal(v);
}
export function naukaCostSuffix(): string {
  return regulExt().naukaCostSuffix();
}
export function eraBuildingCatalog(
  data: GameData,
  techs: readonly string[],
  prodCtx: {
    epoch?: number;
    builtBuildingIds?: readonly string[];
    productionQueue?: readonly ProductionItem[];
    buildingLevel?: number;
    civBonusy?: readonly unknown[];
  },
): BuildingCatalogEntry[] {
  return regulExt().eraBuildingCatalog(data, techs, prodCtx);
}
export function unitNacjaForCivKey(key: string | undefined): unknown {
  return regulExt().unitNacjaForCivKey(key);
}
/** Stan produkcji miasta (pin: `getProd`, ui/cityPanel.ts) — wartość z DTO; brak = pusta kolejka. */
export function getProd(cityId: number): { readonly kolejka: readonly ProductionItem[] } {
  return cfg.getProd?.(cityId) ?? { kolejka: [] };
}

/** K05A-Z5: lokalna kopia typu hexa mapy (pin: types/hex.ts) — w K05A tylko przekazywany do reguły ulepszeń. */
export type HexLike = object;

/** K05A-Z5: lokalna kopia typu `GameMap` (pin: types/map.ts) — pole `hexes` po kluczu "q,r". */
export interface GameMap {
  readonly hexes: Readonly<Record<string, HexLike>>;
}

/** K05A-Z4: rozszerzenie `K05aCfg` dla recruitUnit i improvementsInCityRange (wartości z DTO `panelInputs.k05a`). */
export interface K05aCfgRecruit {
  getTreasury?: (ownerId: number) => number | undefined;
  onPurchaseUnit?: (cityId: number, typeId: string, koszt: number, quantity: number) => boolean | void;
  rerender?: () => void;
  getGameData?: () => GameData | undefined;
}

/** K05A-Z4: reguły dla recruitUnit i improvementsInCityRange (pin: data/loader, game/economy-upkeep, game/terrain-improvements). */
export interface K05aRulesRecruit {
  findUnitDef(data: GameData, id: string): UnitDef | undefined;
  improvementKeysForHex(hex: HexLike): readonly string[];
}

/** Dane gry (pin: `gameData()`, ui/cityPanel.ts) — wartość z DTO; brak = undefined. */
export function gameData(): GameData | undefined {
  return cfg.getGameData?.();
}
export function findUnitDef(data: GameData, id: string): UnitDef | undefined {
  return regul().findUnitDef(data, id);
}
export function canAffordUnitRecruitStock(pool: Readonly<Record<string, number>>, u: UnitDef | undefined): boolean {
  return regul().canAffordUnitRecruitStock(pool, u);
}
export function missingStockFor(pool: Readonly<Record<string, number>>, cost: Record<string, number>): Record<string, number> {
  return regul().missingStockFor(pool, cost);
}
export function improvementKeysForHex(hex: HexLike): readonly string[] {
  return regul().improvementKeysForHex(hex);
}
/** Odświeżenie panelu (pin: `rerender`, ui/cityPanel.ts) — wiring w kontrolerze poza zakresem K05A (NIE_ZMIERZONO). */
export function rerender(): void {
  cfg.rerender?.();
}

// pin edb8fb56 gra/src/types/hex.ts:12-24
export enum TerenBazowy {
  Laka     = 'laka',
  Rownina  = 'rownina',
  Wzgorza  = 'wzgorza',
  Gory     = 'gory',
  /** Płytkie morze — teren WODNY (patrz isWaterTerrain w units/setup.ts); nazwa "wybrzeże"
   *  myliła (P-MAPGEN-PANGEA-OBRYS P4, 2026-09-03) — zmieniona na PlytkieMorze/'plytkie_morze'. */
  PlytkieMorze = 'plytkie_morze',
  Morze    = 'morze',
  Pustynia = 'pustynia',
  /** Strefa polarna (śnieg) — niezamieszkana, C-MAP-Q3b. */
  Polarny  = 'polarny',
}

// pin edb8fb56 gra/src/game/cities.ts:48-48
export type OkolicaTryb = 'auto' | 'reczny';

// pin edb8fb56 gra/src/ui/cityPanel.ts:7465-7465
export const ENTITY_CARD_BUILDING_STYLE_ID = 'civ-city-panel-entity-card-css-v1';

// pin edb8fb56 gra/src/ui/cityPanel.ts:9495-9500
export const TEREN_COL: Record<TerenBazowy, string> = {
  [TerenBazowy.Morze]: '#0d2236', [TerenBazowy.PlytkieMorze]: '#14506a',
  [TerenBazowy.Laka]: '#243a24', [TerenBazowy.Rownina]: '#3f3815',
  [TerenBazowy.Pustynia]: '#4a3a18', [TerenBazowy.Wzgorza]: '#3a2f18', [TerenBazowy.Gory]: '#2e2e2e',
  [TerenBazowy.Polarny]: '#d8e4f0',
};

// pin edb8fb56 gra/src/ui/cityPanel.ts:9501-9506
export const TEREN_LETTER: Record<TerenBazowy, string> = {
  [TerenBazowy.Morze]: '~', [TerenBazowy.PlytkieMorze]: '~',
  [TerenBazowy.Laka]: 'Ł', [TerenBazowy.Rownina]: 'R',
  [TerenBazowy.Pustynia]: 'P', [TerenBazowy.Wzgorza]: 'W', [TerenBazowy.Gory]: 'G',
  [TerenBazowy.Polarny]: '❄',
};

// pin edb8fb56 gra/src/ui/cityPanel.ts:9507-9510
export function hexDist(q1: number, r1: number, q2: number, r2: number): number {
  const dq = q2 - q1, dr = r2 - r1;
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:9512-9539
/** Kompaktowy podgląd (ui-params) rozszerzany o heksy z faktycznym 👤 / auto-przydziałem. */
export function okolicaPreviewRadius(
  city: CityHexRef,
  Rwork: number | undefined,
  worked: { q: number; r: number }[] | undefined,
  reczne: Record<string, number> | undefined,
  tryb: OkolicaTryb,
): number {
  const fallback = Math.max(UI_PARAMS.panel_miasta.okolica_promien, 3);
  const cap = Rwork ?? fallback;
  let displayR = Math.min(fallback, cap);
  const bump = (q: number, r: number) => {
    const d = hexDist(city.q, city.r, q, r);
    if (d <= cap && d > displayR) displayR = d;
  };
  if (tryb === 'reczny') {
    for (const [key, count] of Object.entries(reczne ?? {})) {
      if (!count || count <= 0) continue;
      const parts = key.split(',');
      const q = Number(parts[0]);
      const r = Number(parts[1]);
      if (Number.isFinite(q) && Number.isFinite(r)) bump(q, r);
    }
  } else {
    for (const t of worked ?? []) bump(t.q, t.r);
  }
  return displayR;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:9541-9545
export function rangeName(R: number): string {
  if (R <= 5) return 'małe miasto';
  if (R <= 10) return 'średnie miasto';
  return 'duże miasto';
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:9546-9551
/** Liczba heksów dodanych przez `rings` pierścieni kultury poza promieniem R. */
export function ringsTiles(R: number, rings: number): number {
  let n = 0;
  for (let k = 1; k <= rings; k++) n += 6 * (R + k);
  return n;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:9552-9554
export function okStat(key: string, val: string, sub: string): string {
  return `<div class="okstat"><span class="ks">${key}</span><b>${val}</b> <span class="muted">${sub}</span></div>`;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6821-6828
export function buildingLocationRequirementMet(
  lokalizacja: 'stolica' | 'region' | undefined,
  isCapital: boolean | undefined,
): boolean {
  if (lokalizacja === 'stolica') return isCapital === true;
  if (lokalizacja === 'region') return isCapital === false;
  return true;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:8050-8054
export function recruitManpowerCost(city: City, typeId: string): number {
  const ep = cfg.getEpoch?.(city.ownerId) ?? 1;
  const maxMult = civManpowerMaxMult(cfg.getCivBonusy?.(city.ownerId));
  return unitManpowerCostForType(typeId, ep, maxMult);
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:8056-8061
/** Bieżąca pula rekrutów używana przez bramkę zakupu (fallback: pula miasta). */
export function empireRekruciTotal(city: City): number | undefined {
  const empireTotal = cfg.getEmpireRekruciTotal?.(city.ownerId);
  if (empireTotal != null) return empireTotal;
  return cfg.getManpowerSnapshot?.(city.id)?.manpowerBiezacy;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:8063-8071
/** Czy imperium ma wystarczającą pulę rekrutów na werb (fallback: pula miasta). */
export function empireRekruciAffordable(
  city: City,
  mpCost: number,
  available = empireRekruciTotal(city),
): boolean {
  if (mpCost <= 0) return true;
  return available == null || available >= mpCost;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:8073-8100
/**
 * Sufit licznika na karcie z bieżącego snapshotu zasobów.
 * To tylko informacyjny max dla draftu UI — nie rezerwuje i nie zmienia kolejki.
 * Brak wiarygodnego snapshotu oznacza brak bezpiecznego maxa.
 */
export function maxAffordableRecruitQuantity(
  city: City,
  item: ProductionItem,
  mpCost: number,
  skarb: number | undefined,
  stockCost: Readonly<Record<string, number>>,
): number | undefined {
  let max = Number.POSITIVE_INFINITY;
  let constrained = false;
  const applyLimit = (available: number | undefined, cost: number): void => {
    if (available == null || !Number.isFinite(available) || cost <= 0) return;
    constrained = true;
    max = Math.min(max, Math.max(0, Math.floor(available / cost)));
  };

  applyLimit(skarb, item.koszt);
  applyLimit(empireRekruciTotal(city), mpCost);
  const pool = ownerSurowcePoolFor(city);
  for (const [key, cost] of Object.entries(stockCost)) {
    applyLimit(pool[key] ?? 0, cost);
  }
  return constrained ? Math.max(1, max) : undefined;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:8102-8124
/**
 * JEDNOSTKI-SUROWIEC-01 (Maciej 2026-07-24): chip(y) kosztu surowcowego jednostki
 * (units.json Surowiec/Surowiec (ilość)) na karcie rekrutacji — czerwony gdy pula
 * PAŃSTWA ownera (suma City.surowce po wszystkich miastach) nie starcza na SAM
 * jednorazowy koszt zakupu (unitStockCost). R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1
 * (2026-08-26): brak zapasu na utrzymanie NIE czerwieni chipa i nie blokuje przycisku
 * — utrzymanie jest pobierane dopiero w następnej turze.
 * Pusty string gdy jednostka nie ma kosztu surowcowego.
 * Wzorzec: buildingStockCostChipsHtml; bramka: isUnitRecruitStockChipMissing.
 */
export function unitStockCostChipsHtml(u: UnitDef, city: City): string {
  const cost = unitStockCost(u);
  const keys = Object.keys(cost);
  if (keys.length === 0) return '';
  const pool = ownerSurowcePoolFor(city);
  const chips = keys.map(k => {
    const need = cost[k]!;
    const missing = isUnitRecruitStockChipMissing(pool, u, k);
    const cls = missing ? 'bld-infocard-chip stock-missing' : 'bld-infocard-chip';
    return `<span class="${cls}">${need} ${stockResourceLabel(k)}</span>`;
  });
  return chips.join('');
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:8126-8134
/** Chip(y) utrzymania surowcowego jednostki (units.json Utrzymanie surowiec). */
export function unitResourceUpkeepChipsHtml(u: UnitDef): string {
  const upkeep = unitResourceUpkeep(u);
  const keys = Object.keys(upkeep);
  if (keys.length === 0) return '';
  return keys
    .map(k => `<span class="bld-infocard-chip">−${upkeep[k]} ${stockResourceLabel(k)}/t</span>`)
    .join('');
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:8537-8540
export function missingTechSteps(data: GameData, techName: string, unlocked: ReadonlySet<string>): string[] {
  const chain = techPrereqChain(data, techName);
  return chain.filter(t => !unlocked.has(t));
}
// pin-adapter edb8fb56 gra/src/ui/cityPanel.ts:6830-6929
/** K05A-Z4 (adapter): warunki budowy z oceną spełnienia — wynik silnika z DTO (`panelInputs.k05a`), nie logika UI.
 *  Pin (ui/cityPanel.ts) składał chipy z reguł gry; ta sama sygnatura i te same etykiety/klasy po stronie silnika. */
export function buildingRequirementChips(
  def: BuildingDef,
  city: City | undefined,
  data: GameData,
  ctx: AvailabilityContext,
  unlockedTechs: readonly string[],
): BuildingReqChip[] {
  return regulExt().buildingRequirementChips(def, city, data, ctx, unlockedTechs);
}
// pin edb8fb56 gra/src/ui/cityPanel.ts:6931-6941
/** Czy gracz może TERAZ kliknąć Buduj — wszystkie chipy wymagań spełnione (tech, magazyn…). */
export function buildingCanBuildNow(
  def: BuildingDef,
  city: City,
  data: GameData,
  ctx: AvailabilityContext,
  techs: readonly string[],
): boolean {
  const chips = buildingRequirementChips(def, city, data, ctx, techs);
  return chips.length === 0 || chips.every(c => c.met);
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6943-6963
/**
 * Sortuje pulę budynków: najpierw te, które można wybudować teraz, potem zablokowane
 * (np. brak surowców w magazynie). W obrębie tieru zachowuje kolejność wejściową
 * (koszt → nazwa z buildableProduction).
 */
export function sortProductionItemsByBuildability(
  items: readonly ProductionItem[],
  city: City,
  data: GameData,
  ctx: AvailabilityContext,
  techs: readonly string[],
): ProductionItem[] {
  const buildable: ProductionItem[] = [];
  const blocked: ProductionItem[] = [];
  for (const item of items) {
    const def = findBuildingDef(data, item.id);
    if (def && buildingCanBuildNow(def, city, data, ctx, techs)) buildable.push(item);
    else blocked.push(item);
  }
  return [...buildable, ...blocked];
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:6726-6766
/**
 * P-CITYPANEL-BUDYNKI-BRAK-PRODUKCJI-W-LISCIE (Maciej 2026-08-14, runda 2 po
 * werdykcie FAIL Evaluatora — N1/N3): strona PRODUKCYJNA budynku-konwertera
 * (np. Garncarnia glina+drewno→ceramika) — ODRĘBNA od `buildingUpkeepDisplay`
 * (koszt utrzymania, koszt_surowce). Cienka otoczka wołająca WPROST czystą
 * funkcję domenową `converterProductionDisplayForBuilding` z `../game/converters`
 * (era/trudność właściciela z `cfg`) — cała logika (receptury, throughput,
 * skalowanie epoką) żyje TYLKO w converters.ts, testowalna bez UI/DOM (N1).
 * Liczba jest CELOWO BRUTTO (nominalna przepustowość, NIE pomniejszona o brak
 * wejścia tej konkretnej tury).
 * SPROSTOWANIE (Evaluator N3, runda 1; naprawione commitem `9482117f`,
 * `P-HUD-KONWERTER-DOPASOWANIE-BUDYNKI-NIESPOJNE`): dopasowanie budynek↔receptura
 * tutaj (`converterBuildingIdForRecipe`, jak `turn-economy.ts`) jest DZIŚ TAKIE
 * SAMO jak w HUD-zie imperium (`empireConverterResourceRatesForOwner` w main.ts,
 * `gra/src/main.ts:2789`) — obie strony spójne z SILNIKIEM
 * (`runConverter`/`converterBuildingIdForRecipe`). Wcześniej (przed `9482117f`)
 * HUD gubił część receptur (Odlewnia żelaza, Wielka odlewnia); to już naprawione.
 * / EN: converter PRODUCTION side of a building (e.g. Pottery clay+wood→pottery)
 * — SEPARATE from `buildingUpkeepDisplay` (upkeep). Thin wrapper calling the
 * pure domain function `converterProductionDisplayForBuilding` from
 * `../game/converters` directly — all logic (recipes, throughput, era scaling)
 * lives ONLY in converters.ts, testable without UI/DOM (N1). The number is
 * DELIBERATELY BRUTTO (nominal throughput, not reduced for this turn's actual
 * input availability).
 * CORRECTION (Evaluator N3, round 1; fixed by `9482117f`,
 * `P-HUD-KONWERTER-DOPASOWANIE-BUDYNKI-NIESPOJNE`): the building↔recipe matching
 * here now MATCHES the empire HUD counter's (`empireConverterResourceRatesForOwner`
 * in main.ts) — both consistent with the ENGINE (`runConverter`/
 * `converterBuildingIdForRecipe`). Before `9482117f` the HUD dropped some
 * recipes (Iron/Great Foundry); that is now fixed.
 */
export function buildingConverterProductionDisplay(
  def: BuildingDef,
  city: City,
  data: GameData,
): { consumed: Record<string, number>; produced: Record<string, number> } | null {
  const era = cfg.getEpoch?.(city.ownerId) ?? 1;
  const difficulty = cfg.difficulty ?? 'normal';
  const rawParams = data.econParams as unknown as RawConverterParamsJson;
  return converterProductionDisplayForBuilding(def.id, rawParams, difficulty, era);
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:8611-8643
export function productionCtxForCity(city: City): AvailabilityContext {
  const raw = cfg.getResourceAccess?.(city.id);
  const activeResourceLabels = Array.isArray(raw)
    ? raw
    : (raw?.active ?? []);
  const empireActiveResourceLabels = cfg.getEmpireResourceAccess?.(city.ownerId);
  const empireBuiltIds = cfg.getEmpireBuiltIds?.(city.ownerId);
  return {
    epoch: cfg.getEpoch?.(city.ownerId) ?? 1,
    builtBuildingIds: cfg.getBuiltBuildingIds?.(city.id) ?? [],
    productionQueue: getProd(city.id).kolejka,
    buildingLevel: 1,
    civBonusy: cfg.getCivBonusy?.(city.ownerId) ?? [],
    civUnitNacja: unitNacjaForCivKey(cfg.getCivKey?.(city.ownerId)),
    placedImprovements: cfg.getPlacedImprovements?.() ?? null,
    hasKopalniaNaZlozuZelaza: cfg.getHasKopalniaNaZlozuZelaza?.() ?? false,
    aliveUnitTypeNames: cfg.getAliveUnitTypeNames?.(city.ownerId),
    buildingCostPace: cfg.getBuildingCostPace?.() ?? 'niski',
    kosztJednostekPace: cfg.getKosztJednostekPace?.() ?? 'niski',
    ownerId: city.ownerId,
    difficulty: cfg.getDifficulty?.() ?? 'normal',
    activeResourceLabels,
    empireActiveResourceLabels,
    empireBuiltIds,
    empireResourceStock: cfg.getEmpireStock?.(city.ownerId),
    cityHasCoastOrRiver: cfg.getCityHasCoastOrRiver?.(city.id) ?? false,
    // ADMIN-STOLICA (2026-07-25): jedno źródło prawdy o stolicy — capitalCityIdForOwner
    // (main.ts), tu przez cfg.getCapitalCityId (patrz getCapitalCityId doc powyżej —
    // wyznaczona stolica z fallbackiem na najstarsze miasto, NIE heurystyka
    // turn-economy.ts "pierwsze miasto w tablicy"). Ownerid-agnostyczne (parytet AI).
    isCapital: (cfg.getCapitalCityId?.(city.ownerId) ?? null) === city.id,
  };
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:8542-8576
export function formatBuildingCatalogLockHint(
  entry: BuildingCatalogEntry,
  data: GameData,
  unlockedTechs: readonly string[],
): string {
  if (entry.status === 'built') return 'Już wybudowany w tym mieście';
  if (entry.status === 'queued') return '⏳ W kolejce produkcji';
  if (entry.status === 'ready') return '';
  if (entry.locationBlocked === 'stolica') return '🔒 Tylko w stolicy';
  if (entry.locationBlocked === 'region') return '🔒 Tylko poza stolicą';

  const parts: string[] = [];
  let techIc = '';
  if (entry.missingTech) {
    techIc = techIconHintSpan(entry.missingTech);
    const unlocked = new Set(unlockedTechs);
    const steps = missingTechSteps(data, entry.missingTech, unlocked);
    if (steps.length > 0) {
      parts.push(`Zbadaj: ${steps.join(' → ')}`);
    } else {
      parts.push(`Zbadaj: ${entry.missingTech}`);
    }
    const tdef = getTechDef(data, entry.missingTech);
    if (tdef?.['wymagany budynek'] && !isEmptyDataVal(tdef['wymagany budynek'])) {
      parts.push(`wymaga budynku: ${tdef['wymagany budynek']}`);
    }
    if (tdef?.['Koszt nauki'] != null) {
      parts.push(`koszt badania ${tdef['Koszt nauki']}${naukaCostSuffix()}`);
    }
  }
  if (entry.wymagania && !isEmptyDataVal(entry.wymagania)) {
    parts.push(entry.wymagania);
  }
  return parts.length > 0 ? `🔒 ${techIc}${parts.join(' · ')}` : '🔒 Niedostępny';
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:8578-8609
/** Podpowiedź badań do podglądu epoki (toggle B) — łańcuch tech nawet gdy gracz już ma odblokowane. */
export function formatBuildingPreviewHint(
  def: BuildingDef,
  data: GameData,
  unlockedTechs: readonly string[],
): string {
  const parts: string[] = [];
  const tech = (def.techUnlock ?? '').trim();
  const unlocked = new Set(unlockedTechs);
  if (tech) {
    const steps = missingTechSteps(data, tech, unlocked);
    if (steps.length > 0) {
      parts.push(`🔒 ${techIconHintSpan(tech)}Zbadaj: ${steps.join(' → ')}`);
    } else {
      parts.push('Badania OK — można budować (lista powyżej)');
    }
    const tdef = getTechDef(data, tech);
    if (tdef?.['wymagany budynek'] && !isEmptyDataVal(tdef['wymagany budynek'])) {
      parts.push(`wymaga budynku: ${tdef['wymagany budynek']}`);
    }
    if (tdef?.['Koszt nauki'] != null) {
      parts.push(`koszt badania ${tdef['Koszt nauki']}${naukaCostSuffix()}`);
    }
  } else {
    parts.push('Brak wymogu badań');
  }
  const wym = (def as unknown as Record<string, unknown>).wymagania;
  if (typeof wym === 'string' && !isEmptyDataVal(wym)) {
    parts.push(wym);
  }
  return parts.join(' · ');
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:8645-8679
export function collectEraPreviewEntries(
  data: GameData,
  techs: readonly string[],
  prodCtx: {
    epoch?: number;
    builtBuildingIds?: readonly string[];
    productionQueue?: readonly ProductionItem[];
    buildingLevel?: number;
    civBonusy?: readonly CivBonusLite[];
  },
  fullEraPreview: boolean,
): BuildingCatalogEntry[] {
  const catalog = eraBuildingCatalog(data, techs, prodCtx);
  const built = new Set(prodCtx.builtBuildingIds ?? []);
  const queued = new Set(
    (prodCtx.productionQueue ?? [])
      .filter(it => it.kind === 'budynek')
      .map(it => it.id),
  );
  return catalog.filter(e => {
    if (built.has(e.id) || queued.has(e.id)) return false;
    // ADMIN-STOLICA (Maciej 2026-07-26 playtest): budynek z `lokalizacja: 'stolica'|'region'`
    // odrzucony WYŁĄCZNIE przez bramkę lokalizacji (locationBlocked) nigdy nie stanie się
    // budowalny w TYM mieście — to ograniczenie jest trwałe (nie "jeszcze niedostępne", jak
    // brak tech/surowca/budynku-warunku), więc karta w ogóle nie trafia na listę (ani do
    // "Jeszcze zablokowane", ani do "Podgląd epoki"/"Podgląd badań" — tam też byłaby myląca,
    // bo formatBuildingPreviewHint nie zna bramki lokalizacji i pokazałby "Badania OK").
    // eraBuildingCatalog (production.ts) CELOWO nadal zwraca ten wpis jako status='locked' +
    // locationBlocked — to surowe źródło prawdy silnika (testowane wprost w
    // administracja-stolica-test.cjs); filtrowanie dla UI robimy tutaj, jednym miejscem.
    if (e.locationBlocked) return false;
    if (fullEraPreview) return true;
    return e.status === 'locked';
  });
}
// pin edb8fb56 gra/src/ui/cityPanel.ts:8183-8208
export function recruitUnit(city: City, item: ProductionItem, quantity = 1): boolean {
  const requestedQuantity = Number.isFinite(quantity)
    ? Math.max(1, Math.floor(quantity))
    : 1;
  const skarb = cfg.getTreasury?.(city.ownerId);
  if (skarb !== undefined && skarb < item.koszt * requestedQuantity) return false;
  const mpCost = recruitManpowerCost(city, item.id);
  if (!empireRekruciAffordable(city, mpCost * requestedQuantity)) return false;
  const data = gameData();
  const udef = data ? findUnitDef(data, item.id) : undefined;
  const pool = ownerSurowcePoolFor(city);
  if (requestedQuantity === 1) {
    if (!canAffordUnitRecruitStock(pool, udef)) return false;
  } else {
    const batchStockCost = Object.fromEntries(
      Object.entries(unitStockCost(udef)).map(([key, cost]) => [key, cost * requestedQuantity]),
    );
    if (Object.keys(missingStockFor(pool, batchStockCost)).length > 0) return false;
  }
  if (cfg.onPurchaseUnit) {
    const accepted = cfg.onPurchaseUnit(city.id, item.id, item.koszt, requestedQuantity);
    if (accepted === false) return false;
  }
  rerender();
  return true;
}

// pin edb8fb56 gra/src/ui/cityPanel.ts:9571-9599
/**
 * Zbiera unikalne typy ulepszeń terenu (i liczbę heksów każdego typu) w zasięgu
 * roboczym miasta (`Rwork`) — T7b, call-site 3/3. Recon (T7a) potwierdził: dziś w
 * `cityPanel.ts` nie istnieje żadna lista ulepszeń terenu z nazwami w zakładce
 * „Okolica" (tylko zagregowane plony per-hex) — to jest pierwsza taka lista.
 * Czyta WSZYSTKIE warstwy ulepszeń przez `improvementKeysForHex` (nie legacy
 * `hex.ulepszenie`), tak jak `tileYieldLabel`/`appendOkolicaYieldLabel` niżej w pliku.
 */
export function improvementsInCityRange(
  city: City,
  map: GameMap | undefined,
  Rwork: number | undefined,
): Map<string, number> {
  const counts = new Map<string, number>();
  if (!map || Rwork === undefined) return counts;
  for (let dq = -Rwork; dq <= Rwork; dq++) {
    for (let dr = -Rwork; dr <= Rwork; dr++) {
      const q = city.q + dq;
      const r = city.r + dr;
      if (hexDist(city.q, city.r, q, r) > Rwork) continue;
      const hex = map.hexes[`${q},${r}`];
      if (!hex) continue;
      for (const key of improvementKeysForHex(hex)) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }
  return counts;
}
