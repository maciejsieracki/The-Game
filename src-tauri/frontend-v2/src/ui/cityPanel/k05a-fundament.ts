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
export type GameData = object;

/** K05A-Z4: metody `cfg` pinu używane przez jednostki K05A; wartości z DTO `panelInputs.k05a`. */
export interface K05aCfg {
  getEpoch?: (ownerId: number) => number | undefined;
  getCivBonusy?: (ownerId: number) => unknown;
  getEmpireRekruciTotal?: (ownerId: number) => number | undefined;
  getManpowerSnapshot?: (cityId: number) => { manpowerBiezacy: number } | undefined;
}

/** K05A-Z4: reguły gry liczone w silniku, nie w UI (pin: game/manpower, game/building-stock-cost, game/economy-upkeep). */
export interface K05aRules {
  civManpowerMaxMult(bonusy: unknown): number;
  unitManpowerCostForType(typeId: string, epoch: number, maxMult: number): number;
  ownerSurowcePoolFor(city: City): Readonly<Record<string, number>>;
  stockResourceLabel(key: string): string;
  unitStockCost(u: UnitDef): Record<string, number>;
  unitResourceUpkeep(u: UnitDef): Record<string, number>;
  isUnitRecruitStockChipMissing(pool: Readonly<Record<string, number>>, u: UnitDef, key: string): boolean;
  techPrereqChain(data: GameData, techName: string): string[];
}

let cfg: K05aCfg = {};
let rules: K05aRules | null = null;

/** Wejście z DTO `panelInputs.k05a` (wiring w kontrolerze poza zakresem K05A, NIE_ZMIERZONO). */
export function setK05aCfg(next: K05aCfg): void {
  cfg = next;
}

/** Wejście reguł z DTO `panelInputs.k05a` (wiring w kontrolerze poza zakresem K05A, NIE_ZMIERZONO). */
export function setK05aRules(next: K05aRules): void {
  rules = next;
}

function regul(): K05aRules {
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
export function unitStockCost(u: UnitDef): Record<string, number> {
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
