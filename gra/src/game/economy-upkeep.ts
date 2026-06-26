/**
 * economy-upkeep.ts
 * Storage capacity (magazyny) + maintenance (utrzymanie) for The Game.
 * Pure module -- no DOM, no THREE, no GameMap, no data loader.  Trivially
 * unit-testable; imports only the BuildingRecord *type* from economy.ts.
 *
 * Scope (EKONOMIA lane, Plan task 2; START: "new file, zero collisions"):
 *   A. STORAGE -- Spec-ekonomia.md s.7 (the genuinely new piece; nothing else
 *      implements per-city food / per-resource-type capacity or overflow):
 *        - food store capacity (Spichlerz x5),
 *        - resource store capacity per type (Magazyn x5),
 *        - overflow clamping (surplus over capacity is lost),
 *        - global (state-wide) per-type capacity,
 *        - conquest / city-loss magazine events (s.7.3).
 *   B. MAINTENANCE -- Spec-ekonomia.md s.6:
 *        - building upkeep (s.6.1), unit upkeep (s.6.2),
 *        - military food consumption 1/turn marching, 0.5/turn camping (s.6.3),
 *        - total upkeep + treasury balance / deficit flag (s.6.4 / s.8.4).
 *
 * Spec sources:
 *   - Spec-ekonomia.md  (s.6 maintenance, s.7 storage; the source of truth)
 *   - PROJEKT-GRY-master.md  s.2, s.6, s.8
 *   - gra/data/econ-params.json  (difficulty-scaled parameters, already present:
 *        globalne.magazyn_baza_zywnosc / magazyn_baza_surowce /
 *        magazyn_mnoznik_spichlerz / utrzymanie_jednostka_standard;
 *        budynki.utrzymanie_budynek;
 *        ekonomia_miasta.zywnosc_jednostka_ruch / zywnosc_jednostka_oboz)
 *   - gra/data/buildings.json  ("spichlerz" = food granary, "magazyn" = resource
 *        warehouse; every record carries utrzymanie + przyrostUtrzymania)
 *
 * Relationship to player-economy.ts (orphan, imported nowhere):
 *   player-economy.ts duplicates the per-entity gold-upkeep math (buildingUpkeep /
 *   unitUpkeep) as part of a player-level treasury aggregator.  Per the EKONOMIA
 *   START decision ("new upkeep.ts" over "extend player-economy.ts"), THIS module
 *   is the canonical home for the s.6 upkeep + s.7 storage primitives.  The
 *   function signatures here are kept compatible so player-economy.ts can later be
 *   refactored to import them (or be retired) -- a master/SILNIK call, flagged in
 *   the handoff.  We do NOT edit player-economy.ts from this lane.
 *
 * ASCII-only identifiers and string literals (Polish diacritics only in comments),
 * matching the economy.ts / player-economy.ts convention.  All raw econ-params
 * reads use safe numeric fallbacks so one odd row can never crash a turn.
 */

import type { BuildingRecord } from './economy';
import { buildingEffectAtLevel } from './production';

// ===========================================================================
// Difficulty + raw econ-params reader
// ===========================================================================

export type Difficulty = 'easy' | 'normal' | 'hard';

/** A raw econ-params row: difficulty values plus metadata (jednostka/opis). */
type RawEconRow = Record<string, number | string | undefined>;

/** The nested groups of econ-params.json that this module reads. */
export interface RawEconParamsForUpkeep {
  ekonomia_miasta?: Record<string, RawEconRow>;
  budynki?:         Record<string, RawEconRow>;
  globalne?:        Record<string, RawEconRow>;
}

function readNum(
  group: Record<string, RawEconRow> | undefined,
  key: string,
  difficulty: Difficulty,
  fallback: number,
): number {
  const row = group ? group[key] : undefined;
  const v   = row ? row[difficulty] : undefined;
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

// ===========================================================================
// A. STORAGE  (Spec-ekonomia.md s.7)
// ===========================================================================

/**
 * Capacity parameters for the two store kinds.
 *   - bazaZywnosc     : base food capacity without a Spichlerz (s.7.1, default 20)
 *   - bazaSurowce     : base capacity per resource type without a Magazyn
 *                       (s.7.2, default 10 per type)
 *   - mnoznikMagazynu : capacity multiplier once the relevant building exists
 *                       (Spichlerz for food, Magazyn for resources; s.7.1/7.2,
 *                       default x5)
 */
export interface StorageParams {
  bazaZywnosc:     number;
  bazaSurowce:     number;
  mnoznikMagazynu: number;
}

/** Spec s.7 defaults (normal difficulty) if econ-params is unavailable. */
export const DEFAULT_STORAGE_PARAMS: StorageParams = {
  bazaZywnosc:     20,
  bazaSurowce:     10,
  mnoznikMagazynu: 5,
};

/**
 * Read StorageParams from the raw econ-params.json blob (globalne.magazyn_*).
 * Robust: any missing / non-numeric value falls back to the Spec s.7 default.
 */
export function loadStorageParams(
  raw: RawEconParamsForUpkeep,
  difficulty: Difficulty = 'normal',
): StorageParams {
  const g = raw.globalne;
  return {
    bazaZywnosc:     readNum(g, 'magazyn_baza_zywnosc',     difficulty, DEFAULT_STORAGE_PARAMS.bazaZywnosc),
    bazaSurowce:     readNum(g, 'magazyn_baza_surowce',     difficulty, DEFAULT_STORAGE_PARAMS.bazaSurowce),
    mnoznikMagazynu: readNum(g, 'magazyn_mnoznik_spichlerz', difficulty, DEFAULT_STORAGE_PARAMS.mnoznikMagazynu),
  };
}

/**
 * Food store capacity for one city (Spec s.7.1).
 *   without Spichlerz: bazaZywnosc
 *   with Spichlerz:    bazaZywnosc * mnoznikMagazynu
 */
export function foodStorageCapacity(maSpichlerz: boolean, p: StorageParams): number {
  return maSpichlerz ? p.bazaZywnosc * p.mnoznikMagazynu : p.bazaZywnosc;
}

/**
 * Per-type resource store capacity for one city (Spec s.7.2).
 *   without Magazyn: bazaSurowce
 *   with Magazyn:    bazaSurowce * mnoznikMagazynu
 */
export function resourceStorageCapacityPerType(maMagazyn: boolean, p: StorageParams): number {
  return maMagazyn ? p.bazaSurowce * p.mnoznikMagazynu : p.bazaSurowce;
}

/** Result of clamping a stored amount to capacity: kept vs. lost overflow. */
export interface ClampResult {
  stored:   number;   // amount retained (0..capacity)
  overflow: number;   // amount lost above capacity (>= 0)
}

/**
 * Clamp a stored amount to [0, capacity].  Surplus over capacity is lost in the
 * same turn (Spec s.7.1 / s.7.2: "nadwyzka ... przepada").  Negative inputs are
 * floored to 0 (a store cannot go negative -- starvation is handled in
 * economy.ts populationGrowth, not here).
 */
export function clampStore(amount: number, capacity: number): ClampResult {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { stored: 0, overflow: 0 };
  }
  const cap = Number.isFinite(capacity) && capacity > 0 ? capacity : 0;
  if (amount > cap) {
    return { stored: cap, overflow: amount - cap };
  }
  return { stored: amount, overflow: 0 };
}

/**
 * One city's persisted stores.
 *   - zywnosc : food store (the same quantity economy.ts tracks as
 *               magazynZywnosci; THIS module supplies the capacity cap that
 *               economy.ts populationGrowth does not apply).
 *   - surowce : amount per resource id (keys are resources.json "Surowiec"
 *               values, e.g. "Drewno", "Kamien", "Glina", "Ruda", ...).
 */
export interface CityStores {
  zywnosc: number;
  surowce: Record<string, number>;
}

/** A fresh, empty store. */
export function emptyCityStores(): CityStores {
  return { zywnosc: 0, surowce: {} };
}

/**
 * Apply a net food change for one turn, then cap at the food capacity.
 * `delta` may be negative (consumption already netted by the caller).  Returns
 * the new food level and any overflow lost to the capacity cap (Spec s.7.1).
 *
 * NOTE: growth / starvation thresholds live in economy.ts populationGrowth.
 * This helper only enforces the storage ceiling, which that function omits.
 */
export function applyFood(
  current: number,
  delta: number,
  capacity: number,
): ClampResult {
  const raw = (Number.isFinite(current) ? current : 0) + (Number.isFinite(delta) ? delta : 0);
  return clampStore(raw, capacity);
}

/** Per-resource overflow report from applyResourceIntake. */
export type ResourceOverflow = Record<string, number>;

/**
 * Add this turn's resource intake to a city's stores, capping every resource
 * type at `capacityPerType` (Spec s.7.2).  Returns NEW stores (input untouched,
 * pure) plus the per-type overflow that was lost.  Production that would exceed
 * capacity is wasted -- callers may use the overflow report to pause converters
 * (Spec s.1.5: "wstrzymuje sie ... przy pelnym magazynie").
 */
export function applyResourceIntake(
  stores: CityStores,
  intake: Record<string, number>,
  capacityPerType: number,
): { stores: CityStores; overflow: ResourceOverflow } {
  const nextSurowce: Record<string, number> = { ...stores.surowce };
  const overflow: ResourceOverflow = {};

  for (const key of Object.keys(intake)) {
    const add = intake[key];
    if (!Number.isFinite(add) || add === 0) continue;
    const have = Number.isFinite(nextSurowce[key]) ? nextSurowce[key] : 0;
    const res  = clampStore(have + add, capacityPerType);
    nextSurowce[key] = res.stored;
    if (res.overflow > 0) overflow[key] = res.overflow;
  }

  return {
    stores: { zywnosc: stores.zywnosc, surowce: nextSurowce },
    overflow,
  };
}

/**
 * State-wide capacity for ONE resource type (Spec s.7.3): sum of each city's
 * per-type capacity, where a city has the larger capacity iff it owns a Magazyn.
 *
 * @param cityHasMagazyn one flag per city (true = Magazyn built there)
 */
export function globalResourceCapacityPerType(
  cityHasMagazyn: ReadonlyArray<boolean>,
  p: StorageParams,
): number {
  let total = 0;
  for (const has of cityHasMagazyn) {
    total += resourceStorageCapacityPerType(has, p);
  }
  return total;
}

/**
 * City lost (razed / captured by someone else) -- its stores vanish (Spec s.7.3:
 * "Utrata miasta -> surowce w jego magazynie przepadaja").  Pure: returns a fresh
 * empty store.
 */
export function onCityLost(): CityStores {
  return emptyCityStores();
}

/**
 * City conquered -- the winner absorbs the loser's magazine, each resource type
 * (and food) clamped to the winner city's capacity (Spec s.7.3: "Podboj miasta ->
 * zwyciezca przejmuje magazyn i jego zawartosc").  Pure: returns NEW winner
 * stores; overflow beyond the winner's capacity is lost.
 *
 * @param winner            winner city's current stores
 * @param loser             conquered city's stores (added in)
 * @param foodCapacity      winner city's food capacity
 * @param resourceCapacity  winner city's per-type resource capacity
 */
export function onCityConquered(
  winner: CityStores,
  loser: CityStores,
  foodCapacity: number,
  resourceCapacity: number,
): { stores: CityStores; overflow: ResourceOverflow & { zywnosc?: number } } {
  const food = clampStore((winner.zywnosc || 0) + (loser.zywnosc || 0), foodCapacity);

  const merged = applyResourceIntake(
    { zywnosc: food.stored, surowce: { ...winner.surowce } },
    loser.surowce,
    resourceCapacity,
  );

  const overflow: ResourceOverflow & { zywnosc?: number } = { ...merged.overflow };
  if (food.overflow > 0) overflow.zywnosc = food.overflow;

  return { stores: merged.stores, overflow };
}

// ===========================================================================
// B. MAINTENANCE  (Spec-ekonomia.md s.6)
// ===========================================================================

/**
 * Difficulty-resolved maintenance parameters (from econ-params.json).
 *   - budynekUtrzymanieFlat : if set, every building costs this flat amount
 *     (econ-params budynki.utrzymanie_budynek = 1, "niezroznicowany w v0.1").
 *     Set to `undefined` to use each building's own utrzymanie /
 *     przyrostUtrzymania from buildings.json (post-v0.1 differentiated balance).
 *   - jednostkaUtrzymanieStd : default gold upkeep for a unit with no table /
 *     category entry (econ-params globalne.utrzymanie_jednostka_standard = 1).
 *   - zywnoscJednostkaRuch : food/turn for a unit marching or in garrison
 *     (econ-params ekonomia_miasta.zywnosc_jednostka_ruch = 1; Spec s.6.3).
 *   - zywnoscJednostkaOboz : food/turn for a camping unit
 *     (econ-params ekonomia_miasta.zywnosc_jednostka_oboz = 0.5; Spec s.6.3).
 */
export interface UpkeepParams {
  budynekUtrzymanieFlat?:  number;
  jednostkaUtrzymanieStd:  number;
  zywnoscJednostkaRuch:    number;
  zywnoscJednostkaOboz:    number;
}

/** Spec s.6 defaults (normal difficulty). */
export const DEFAULT_UPKEEP_PARAMS: UpkeepParams = {
  budynekUtrzymanieFlat: 1,
  jednostkaUtrzymanieStd: 1,
  zywnoscJednostkaRuch:   1,
  zywnoscJednostkaOboz:   0.5,
};

/**
 * Read UpkeepParams from the raw econ-params.json blob.  In v0.1 the building
 * cost is the flat panel value (budynki.utrzymanie_budynek); pass the result
 * through with budynekUtrzymanieFlat cleared if you want per-building costs.
 */
export function loadUpkeepParams(
  raw: RawEconParamsForUpkeep,
  difficulty: Difficulty = 'normal',
): UpkeepParams {
  const em = raw.ekonomia_miasta;
  const bu = raw.budynki;
  const g  = raw.globalne;
  return {
    budynekUtrzymanieFlat: readNum(bu, 'utrzymanie_budynek',            difficulty, 1),
    jednostkaUtrzymanieStd: readNum(g, 'utrzymanie_jednostka_standard', difficulty, 1),
    zywnoscJednostkaRuch:   readNum(em, 'zywnosc_jednostka_ruch',       difficulty, 1),
    zywnoscJednostkaOboz:   readNum(em, 'zywnosc_jednostka_oboz',       difficulty, 0.5),
  };
}

/** A building instance owned by a city: definition + current level. */
export interface BuildingInstanceLike {
  record: BuildingRecord;
  level:  number;
}

/**
 * Gold upkeep for one building at a level (Spec s.6.1 + decyzja Naster compound +10%).
 *   flat override set  -> flatOverride (v0.1 "niezroznicowany")
 *   otherwise          -> floor(utrzymanie * 1.10^(level-1))  [compound, mirrors buildingValue]
 * Level clamped to >= 1.  The legacy `przyrostUtrzymania` field is no longer
 * used for upkeep scaling -- compound replaces it.
 */
export function buildingUpkeep(
  building: BuildingRecord,
  level: number,
  flatOverride?: number,
): number {
  if (typeof flatOverride === 'number' && Number.isFinite(flatOverride)) {
    return flatOverride;
  }
  const lvl  = level >= 1 ? level : 1;
  const base = Number.isFinite(building.utrzymanie) ? building.utrzymanie : 0;
  return Math.floor(buildingEffectAtLevel(base, lvl));
}

/** Total gold building upkeep for a set of building instances (Spec s.6.1). */
export function totalBuildingUpkeep(
  buildings: ReadonlyArray<BuildingInstanceLike>,
  flatOverride?: number,
): number {
  let sum = 0;
  for (const b of buildings) {
    sum += buildingUpkeep(b.record, b.level, flatOverride);
  }
  return sum;
}

/**
 * Per-category unit upkeep fallback (Pieniadz/ture), used when a unit's typeId is
 * not in the table.  Mirrors player-economy.ts DEFAULT_UNIT_UPKEEP_BY_CATEGORY so
 * the two agree during the consolidation window: support/ranged ~1, melee ~2,
 * mounted & naval ~3, super-units 0 (free upkeep in units.json).
 */
export const DEFAULT_UNIT_UPKEEP_BY_CATEGORY: Readonly<Record<string, number>> = {
  osadnik:    1,
  robotnik:   1,
  zwiadowca:  1,
  procarz:    1,
  oszczepnik: 1,
  lucznik:    1,
  wlocznik:   2,
  miecznik:   2,
  falanga:    2,
  legionista: 2,
  maczuga:    2,
  topor:      2,
  konnica:    3,
  rydwan:     3,
  galera:     3,
  super:      0,
  domyslny:   1,
};

/** typeId -> gold-upkeep table (build once from units.json via the loader). */
export type UnitUpkeepTable = Readonly<Record<string, number>>;

/** A unit for gold-upkeep purposes. */
export interface UnitUpkeepLike {
  typeId:   string;
  category: string;
}

/**
 * Gold upkeep for one unit (Spec s.6.2).  Resolution order:
 *   1. exact typeId match in `table` (units.json "Utrzymanie (Pieniadz/ture)"),
 *   2. per-category default (DEFAULT_UNIT_UPKEEP_BY_CATEGORY),
 *   3. global standard `standardUpkeep`.
 */
export function unitUpkeep(
  unit: UnitUpkeepLike,
  table: UnitUpkeepTable,
  standardUpkeep: number,
): number {
  const byType = table[unit.typeId];
  if (typeof byType === 'number' && Number.isFinite(byType)) return byType;
  const byCat = DEFAULT_UNIT_UPKEEP_BY_CATEGORY[unit.category];
  if (typeof byCat === 'number' && Number.isFinite(byCat)) return byCat;
  return Number.isFinite(standardUpkeep) ? standardUpkeep : 0;
}

/** Total gold unit upkeep for a set of units (Spec s.6.2). */
export function totalUnitUpkeep(
  units: ReadonlyArray<UnitUpkeepLike>,
  table: UnitUpkeepTable,
  standardUpkeep: number,
): number {
  let sum = 0;
  for (const u of units) {
    sum += unitUpkeep(u, table, standardUpkeep);
  }
  return sum;
}

/**
 * Build a typeId -> gold-upkeep table from raw units.json rows.  Diacritic-
 * tolerant: reads "Utrzymanie (Pieniadz/ture)" or the first "Utrzymanie..." key
 * with a numeric value; rows missing a name or upkeep degrade to category
 * defaults rather than throwing.  Pure (takes the parsed array).
 */
export function buildUnitUpkeepTable(
  rows: ReadonlyArray<Record<string, unknown>>,
): UnitUpkeepTable {
  const out: Record<string, number> = {};
  for (const row of rows) {
    const name = row['Jednostka'];
    if (typeof name !== 'string' || name.length === 0) continue;

    let upkeep: number | undefined;
    const direct = row['Utrzymanie (Pieniadz/ture)'];
    if (typeof direct === 'number' && Number.isFinite(direct)) {
      upkeep = direct;
    } else {
      for (const key of Object.keys(row)) {
        if (key.indexOf('Utrzymanie') === 0) {
          const v = row[key];
          if (typeof v === 'number' && Number.isFinite(v)) { upkeep = v; break; }
        }
      }
    }
    if (upkeep !== undefined) out[name] = upkeep;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Military food consumption (Spec s.6.3)
// ---------------------------------------------------------------------------

/** A unit for food-consumption purposes: marching/garrison vs. camping. */
export interface UnitFoodLike {
  /** true = the unit is camping (obozuje) this turn -> half food. */
  camping: boolean;
}

/**
 * Total military food consumption for a group of units this turn (Spec s.6.3):
 *   marching / garrison: zywnoscJednostkaRuch each (default 1),
 *   camping:             zywnoscJednostkaOboz each (default 0.5).
 *
 * Feed the result into economy.ts cityYieldPerTurn via
 * CityYieldContext.wojskoZuzycieZywnosci (turn-economy.ts passes 0 today, so
 * SILNIK wires this in when garrison-food accounting is enabled).
 */
export function militaryFoodConsumption(
  units: ReadonlyArray<UnitFoodLike>,
  p: UpkeepParams,
): number {
  let sum = 0;
  for (const u of units) {
    sum += u.camping ? p.zywnoscJednostkaOboz : p.zywnoscJednostkaRuch;
  }
  return sum;
}

// ---------------------------------------------------------------------------
// Treasury balance (Spec s.6.4 / s.8.4)
// ---------------------------------------------------------------------------

/** Per-turn maintenance balance for one player (Spec s.6.4). */
export interface UpkeepBalance {
  utrzymanieBudynki:   number;   // gold spent on buildings this turn
  utrzymanieJednostki: number;   // gold spent on units this turn
  utrzymanieRazem:     number;   // total gold upkeep (s.6.4 "Utrzymanie_laczne")
  saldo:               number;   // income - total upkeep (s.6.4 "Saldo_Pieniadza")
  deficyt:             boolean;  // saldo < 0 -> deficit warning (s.6.4)
}

/**
 * Compute one player's maintenance balance for a turn (Spec s.6.4 / s.8.4).
 * `income` is the gold the player banks this turn BEFORE upkeep (sum of city
 * Pieniadz, e.g. the totalPieniadz from turn-economy.ts EconomyTickResult, plus
 * any specialist/tax income the caller already aggregated).
 *
 *   Saldo = income - (building upkeep + unit upkeep)
 *
 * The balance is allowed to go negative -- a deficit is a real game state the
 * caller resolves (disband units / sell buildings / bankruptcy penalty); we only
 * flag it via `deficyt`.  Pure.
 */
export function upkeepBalance(
  income: number,
  buildings: ReadonlyArray<BuildingInstanceLike>,
  units: ReadonlyArray<UnitUpkeepLike>,
  unitUpkeepTbl: UnitUpkeepTable,
  p: UpkeepParams,
): UpkeepBalance {
  const utrzymanieBudynki   = totalBuildingUpkeep(buildings, p.budynekUtrzymanieFlat);
  const utrzymanieJednostki = totalUnitUpkeep(units, unitUpkeepTbl, p.jednostkaUtrzymanieStd);
  const utrzymanieRazem     = utrzymanieBudynki + utrzymanieJednostki;
  const inc                 = Number.isFinite(income) ? income : 0;
  const saldo               = inc - utrzymanieRazem;
  return {
    utrzymanieBudynki,
    utrzymanieJednostki,
    utrzymanieRazem,
    saldo,
    deficyt: saldo < 0,
  };
}
