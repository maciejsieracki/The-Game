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
import type { BuildingStockCost } from './building-stock-cost';
import { buildingEffectAtLevel } from './production';
import {
  R_STAWKI_FALA1_FALA2_MULT,
  R_STAWKI_FALA2_MULT,
} from './r-stawki-strojenie';

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
 * Bufor wzrostu (magazynZywnosci) — skalar >= 0.
 * Migracja: stary zapis mógł trzymać obiekt { aktualny, pojemnosc } zamiast liczby.
 */
export function readCityFoodBuffer(magazynZywnosci: unknown): number {
  if (typeof magazynZywnosci === 'number' && Number.isFinite(magazynZywnosci)) {
    return Math.max(0, magazynZywnosci);
  }
  if (magazynZywnosci && typeof magazynZywnosci === 'object') {
    const a = (magazynZywnosci as { aktualny?: number }).aktualny;
    if (typeof a === 'number' && Number.isFinite(a)) return Math.max(0, a);
  }
  return 0;
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
    const have = Number.isFinite(nextSurowce[key]) ? (nextSurowce[key] ?? 0) : 0;
    const addVal = add ?? 0;
    const res  = clampStore(have + addVal, capacityPerType);
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
// A2. CIV-WIDE RESOURCE STORAGE (SUROW-CIV-01, decyzja Macieja 2026-07-24)
//
// Zmiana modelu: pojemnosc magazynu surowcow PRZETWORZONYCH/logistycznych
// (drewno/kamien/glina/ruda/ruda_zelaza/cegla/ceramika/braz/zelazo/stal/
//  sol/zloto/kon -- PYTANIE-84-U20; NIE Zywnosc,
// ktora zostaje przy modelu per-miasto powyzej, Spichlerz bez zmian) jest teraz
// PULA PANSTWA (civ-wide, per ownerId), nie per-miasto:
//   cap(typ) = bazaSurowcePanstwo + bonusSurowceNaBudynek * (liczba budynkow
//   "Magazyn" ZBUDOWANYCH GDZIEKOLWIEK w imperium ownera) -- model ADDYTYWNY
//   (nie mnoznik, w odroznieniu od foodStorageCapacity/Spichlerz powyzej).
//
// OWNERID-AGNOSTIC (twarda zasada Macieja 2026-07-24): dotyczy KAZDEGO ownera
// identycznie -- gracz (ownerId=0) i kazda cywilizacja AI licza cap z TYCH SAMYCH
// parametrow, licza wlasne Magazyny, tracone nadwyzki tak samo. Zero galezi
// "tylko gracz" w tym module -- kazda funkcja ponizej przyjmuje ownerId jako
// zwykly parametr, bez domyslnego uprzywilejowania 0.
//
// Produkcja + konwertery ZOSTAJA lokalne (per-miasto, city.surowce) -- patrz
// turn-economy.ts advanceCityEconomy; ten blok tylko dostarcza (a) funkcje capu
// i (b) klamrowanie SUMY po miastach ownera RAZ na ture, PO produkcji+konwersji.
// ===========================================================================

/**
 * Parametry pojemnosci PANSTWA dla surowcow (odrebne od StorageParams/Zywnosci
 * powyzej -- addytywny model, nie mnoznikowy).
 *   - bazaSurowcePanstwo    : cap per typ surowca gdy owner ma 0 Magazynow
 *                             (globalne.magazyn_baza_surowce -- NOWA SEMANTYKA:
 *                             PANSTWO, nie per-miasto; placeholder 100).
 *   - bonusSurowceNaBudynek : dodatkowy cap za KAZDY Magazyn w imperium ownera
 *                             (globalne.magazyn_bonus_surowce_na_budynek,
 *                             placeholder 100; addytywnie, nie mnoznik).
 */
export interface OwnerStorageParams {
  bazaSurowcePanstwo:    number;
  bonusSurowceNaBudynek: number;
}

/** Placeholder do strojenia (Maciej 2026-07-24/28): 1000 baza + 100/Magazyn (baza 100→500→1000). */
export const DEFAULT_OWNER_STORAGE_PARAMS: OwnerStorageParams = {
  bazaSurowcePanstwo:    1000,
  bonusSurowceNaBudynek: 100,
};

/**
 * Surowce objęte capem magazynu państwa (SUROW-CIV-01 + PYTANIE-84-U20):
 * cap(typ) = magazyn_baza_surowce + magazyn_bonus_surowce_na_budynek × liczba Magazynów
 * (dziś 1000 + 100×Magazyn per typ). Żywność (Spichlerz) — osobny model per-miasto.
 */
export const OWNER_CAPPED_RESOURCE_KEYS = [
  'drewno', 'kamien', 'glina', 'ruda', 'ruda_zelaza',
  'cegla', 'ceramika', 'braz', 'zelazo', 'stal',
  'sol', 'zloto', 'kon',
] as const;

export type OwnerCappedResourceKey = typeof OWNER_CAPPED_RESOURCE_KEYS[number];

const OWNER_CAPPED_RESOURCE_KEY_SET = new Set<string>(OWNER_CAPPED_RESOURCE_KEYS);

/** Czy typ surowca podlega capowi magazynu państwa (1000 + 100×Magazyn). */
export function isOwnerCappedResourceKey(key: string): key is OwnerCappedResourceKey {
  return OWNER_CAPPED_RESOURCE_KEY_SET.has(key);
}

/**
 * Read OwnerStorageParams from the raw econ-params.json blob (globalne.magazyn_*).
 * Robust: brak/nieliczbowa wartosc -> fallback DEFAULT_OWNER_STORAGE_PARAMS.
 */
export function loadOwnerStorageParams(
  raw: RawEconParamsForUpkeep,
  difficulty: Difficulty = 'normal',
): OwnerStorageParams {
  const g = raw.globalne;
  return {
    bazaSurowcePanstwo:    readNum(g, 'magazyn_baza_surowce',              difficulty, DEFAULT_OWNER_STORAGE_PARAMS.bazaSurowcePanstwo),
    bonusSurowceNaBudynek: readNum(g, 'magazyn_bonus_surowce_na_budynek',  difficulty, DEFAULT_OWNER_STORAGE_PARAMS.bonusSurowceNaBudynek),
  };
}

/**
 * Civ-wide cap per resource type (SUROW-CIV-01): bazaSurowcePanstwo + bonus x
 * liczba Magazynow ownera. Addytywny, NIE mnoznikowy. `magazynCount` ujemny /
 * niefinite -> traktowany jako 0 (bez Magazynow, tylko baza panstwa).
 */
export function ownerResourceCapacityPerType(
  magazynCount: number,
  p: OwnerStorageParams = DEFAULT_OWNER_STORAGE_PARAMS,
): number {
  const cnt = Number.isFinite(magazynCount) && magazynCount > 0 ? Math.floor(magazynCount) : 0;
  return p.bazaSurowcePanstwo + p.bonusSurowceNaBudynek * cnt;
}

/** Minimalny ksztalt miasta potrzebny do rekoncyliacji puli panstwa (bez importu City/GameMap). */
export interface CityResourceHolder {
  id:       string;
  ownerId:  number;
  surowce?: Record<string, number>;
}

/**
 * Rekoncyliacja puli panstwa (SUROW-CIV-01) -- wolaj RAZ na ture, PO tym jak
 * kazde miasto juz wyprodukowalo/skonwertowalo lokalnie (turn-economy.ts nie
 * zmienia tej mechaniki). Dla kazdego ownera i kazdego typu surowca obecnego w
 * jego miastach: sumuje city.surowce[typ], porownuje z capForOwner(ownerId); gdy
 * suma > cap, usuwa nadwyzke Z MIAST O NAJWIEKSZYM ZAPASIE NAJPIERW (deterministycznie:
 * sortowanie malejaco po ilosci, remis rozstrzyga id miasta rosnaco), az suma <= cap.
 * Nadwyzka PRZEPADA (jak dotychczas przy per-miasto clampStore) -- nie jest
 * przenoszona do innych miast.
 *
 * OWNERID-AGNOSTIC: capForOwner jest zwyklym parametrem (callback) liczonym przez
 * wywolujacego IDENTYCZNIE dla kazdego ownera (patrz turn-economy.ts) -- brak tu
 * jakiejkolwiek galezi "gracz vs AI".
 *
 * Mutuje city.surowce na przekazanych obiektach (ten sam kontrakt jak clampStore/
 * applyResourceIntake -- in-place na wejsciowych referencjach City, bo advanceCityEconomy
 * i tak mutuje City w miejscu). Brak city.surowce -> pomijane (nic do zrobienia).
 */
export function reconcileOwnerResourceCaps(
  cities: ReadonlyArray<CityResourceHolder>,
  capForOwner: (ownerId: number) => number,
): void {
  const byOwner = new Map<number, CityResourceHolder[]>();
  for (const c of cities) {
    if (!c.surowce) continue;
    const list = byOwner.get(c.ownerId) ?? [];
    list.push(c);
    byOwner.set(c.ownerId, list);
  }

  for (const [ownerId, ownerCities] of byOwner) {
    const cap = capForOwner(ownerId);
    if (!Number.isFinite(cap) || cap < 0) continue;

    const keys = new Set<string>();
    for (const c of ownerCities) {
      for (const k of Object.keys(c.surowce ?? {})) {
        if (isOwnerCappedResourceKey(k)) keys.add(k);
      }
    }

    for (const key of keys) {
      let total = 0;
      for (const c of ownerCities) total += c.surowce?.[key] ?? 0;
      let excess = total - cap;
      if (excess <= 0) continue;

      const holders = ownerCities
        .filter(c => (c.surowce?.[key] ?? 0) > 0)
        .sort((a, b) => {
          const diff = (b.surowce?.[key] ?? 0) - (a.surowce?.[key] ?? 0);
          if (diff !== 0) return diff;
          return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
        });

      for (const c of holders) {
        if (excess <= 0) break;
        const have = c.surowce?.[key] ?? 0;
        const take = Math.min(have, excess);
        c.surowce![key] = have - take;
        excess -= take;
      }
    }
  }
}

// ===========================================================================
// B. MAINTENANCE  (Spec-ekonomia.md s.6)
// ===========================================================================

/**
 * Difficulty-resolved maintenance parameters (from econ-params.json).
 *   - budynekUtrzymanieFlat : DEFAULT cost used only for a building with no
 *     (finite) `utrzymanie` entry in buildings.json (econ-params
 *     budynki.utrzymanie_budynek = 1/1/2 easy/normal/hard). Every real building
 *     record carries its own utrzymanie -- see buildingUpkeep() -- so this is
 *     a safety-net default, NOT an override of per-building data (R-UTRZYMANIE-
 *     ZROZNICOWANE 2026-07-25, decyzja wlasciciela 19=A).
 *   - jednostkaUtrzymanieStd : default gold upkeep for a unit with no table /
 *     category entry (econ-params globalne.utrzymanie_jednostka_standard = 1).
 *   - zywnoscJednostkaRuch : food/turn for a unit marching or in garrison
 *     (econ-params ekonomia_miasta.zywnosc_jednostka_ruch = 1; Spec s.6.3).
 *   - zywnoscJednostkaOboz : food/turn for a camping unit
 *     (econ-params ekonomia_miasta.zywnosc_jednostka_oboz = 0.5; Spec s.6.3).
 *   - zywnoscMnoznikTerytorium : consumption multiplier on the unit's OWN
 *     territory (econ-params ekonomia_miasta.zywnosc_mnoznik_terytorium_wlasne
 *     = 1.0; C-GLOD-Q2=B, Maciej 2026-07-26).
 *   - zywnoscMnoznikPozaTerytorium : consumption multiplier OFF the unit's own
 *     territory -- simplified, no road/no-man's-land/wall/stack distinction
 *     (econ-params ekonomia_miasta.zywnosc_mnoznik_poza_terytorium = 2.0;
 *     C-GLOD-Q2=B, Maciej 2026-07-26).
 */
export interface UpkeepParams {
  budynekUtrzymanieFlat?:  number;
  jednostkaUtrzymanieStd:  number;
  zywnoscJednostkaRuch:    number;
  zywnoscJednostkaOboz:    number;
  zywnoscMnoznikTerytorium:       number;
  zywnoscMnoznikPozaTerytorium:   number;
}

/** Spec s.6 defaults (normal difficulty). */
export const DEFAULT_UPKEEP_PARAMS: UpkeepParams = {
  budynekUtrzymanieFlat: 1,
  jednostkaUtrzymanieStd: 1,
  zywnoscJednostkaRuch:   1,
  zywnoscJednostkaOboz:   0.5,
  zywnoscMnoznikTerytorium:     1,
  zywnoscMnoznikPozaTerytorium: 2,
};

/**
 * Read UpkeepParams from the raw econ-params.json blob. budynekUtrzymanieFlat
 * is the DEFAULT for a building with no per-building utrzymanie entry (see
 * buildingUpkeep()) -- it no longer overrides buildings.json data (2026-07-25).
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
    zywnoscMnoznikTerytorium:     readNum(em, 'zywnosc_mnoznik_terytorium_wlasne', difficulty, 1),
    zywnoscMnoznikPozaTerytorium: readNum(em, 'zywnosc_mnoznik_poza_terytorium',   difficulty, 2),
  };
}

/** A building instance owned by a city: definition + current level. */
export interface BuildingInstanceLike {
  record: BuildingRecord;
  level:  number;
}

/**
 * Gold upkeep for one building at a level (Spec s.6.1; R-UTRZYMANIE-ZROZNICOWANE
 * 2026-07-25, decyzja wlasciciela 19=A: "zadnej plaskiej stawki, kazdy budynek
 * musi miec wartosc swojego utrzymania").
 *
 *   building.utrzymanie is a finite number (INCLUDING 0, e.g. Stela/Pomnik --
 *   decyzja 45=B, "pomnik nie wymaga obslugi")
 *     -> floor(utrzymanie + przyrostUtrzymania * (level-1))  [per-building, liniowy]
 *   building.utrzymanie missing / not finite (no entry in buildings.json)
 *     -> flatOverride if given, else 0  [DEFAULT ONLY, never an override of real data]
 *
 * `0` is a valid, finite per-building value in JavaScript -- Number.isFinite(0)
 * is true -- so a building explicitly costing 0 (Stela) is never mistaken for
 * "no entry" and never falls back to the flat default. Level clamped to >= 1.
 */
export function buildingUpkeep(
  building: BuildingRecord,
  level: number,
  flatOverride?: number,
): number {
  const lvl = level >= 1 ? level : 1;
  let raw: number;
  if (!Number.isFinite(building.utrzymanie)) {
    // No per-building value in data -> flat value is a DEFAULT, not an override.
    raw = (typeof flatOverride === 'number' && Number.isFinite(flatOverride)) ? flatOverride : 0;
  } else {
    const base   = building.utrzymanie;
    const wzrost = Number.isFinite(building.przyrostUtrzymania) ? building.przyrostUtrzymania : 0;
    raw = Math.floor(buildingEffectAtLevel(base, wzrost, lvl));
  }
  // R-NADMIAR-POOLS FALA2: utrzymanie budynków ×2 vs JSON (włącznie flatOverride).
  return Math.floor(raw * R_STAWKI_FALA2_MULT);
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
 * Per-turn resource upkeep for one building: 1 unit per resource TYPE present in
 * koszt_surowce (build cost), regardless of build-cost amount or FALA scaling.
 * Empty / missing koszt_surowce => no resource upkeep.
 */
export function buildingResourceUpkeep(
  building: { koszt_surowce?: BuildingStockCost | null } | null | undefined,
): Record<string, number> {
  const raw = building?.koszt_surowce;
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
      out[k] = 1;
    }
  }
  return out;
}

/** Merge `add` into accumulator `acc` (mutates acc). */
export function addResourceCosts(
  acc: Record<string, number>,
  add: Record<string, number>,
): void {
  for (const [k, v] of Object.entries(add)) {
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
      acc[k] = (acc[k] ?? 0) + v;
    }
  }
}

/** Total per-turn resource upkeep for a set of building instances. */
export function totalBuildingResourceUpkeep(
  buildings: ReadonlyArray<BuildingInstanceLike>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const b of buildings) {
    addResourceCosts(out, buildingResourceUpkeep(
      b.record as { koszt_surowce?: BuildingStockCost | null },
    ));
  }
  return out;
}

/** Total per-turn resource upkeep for built building ids in one city/empire. */
export function buildingResourceUpkeepForBuiltIds(
  builtIds: readonly string[],
  buildingCatalog: ReadonlyArray<{ id: string; koszt_surowce?: BuildingStockCost | null }>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const bid of builtIds) {
    const bdef = buildingCatalog.find(b => b.id === bid);
    if (!bdef) continue;
    addResourceCosts(out, buildingResourceUpkeep(bdef));
  }
  return out;
}

/** Live preview: total building resource upkeep for one owner (all cities). */
export function previewOwnerBuildingResourceUpkeep(
  ownerId: number,
  cities: ReadonlyArray<{ id: string; ownerId: number }>,
  buildingCatalog: ReadonlyArray<{ id: string; koszt_surowce?: BuildingStockCost | null }>,
  builtByCity: ReadonlyMap<string, readonly string[]>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const city of cities) {
    if (city.ownerId !== ownerId) continue;
    addResourceCosts(out, buildingResourceUpkeepForBuiltIds(
      builtByCity.get(city.id) ?? [],
      buildingCatalog,
    ));
  }
  return out;
}

/**
 * Per-category unit upkeep fallback (Pieniadz/ture), used when a unit's typeId is
 * not in the table.  Mirrors player-economy.ts DEFAULT_UNIT_UPKEEP_BY_CATEGORY so
 * the two agree during the consolidation window: support/ranged ~1, melee ~2,
 * mounted & naval ~3, super-units 0 (free upkeep in units.json).
 */
export const DEFAULT_UNIT_UPKEEP_BY_CATEGORY: Readonly<Record<string, number>> = {
  osadnik:    0,
  robotnik:   0,
  zwiadowca:  0,
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
  const byCat = DEFAULT_UNIT_UPKEEP_BY_CATEGORY[unit.category];
  if (typeof byCat === 'number' && byCat === 0) return 0;
  let base: number;
  const byType = table[unit.typeId];
  if (typeof byType === 'number' && Number.isFinite(byType)) base = byType;
  else if (typeof byCat === 'number' && Number.isFinite(byCat)) base = byCat;
  else base = Number.isFinite(standardUpkeep) ? standardUpkeep : 0;
  if (base <= 0) return 0;
  // R-STAWKI FALA1×FALA2: ×4 utrzymanie jednostek (Pieniądz/turę)
  return Math.round(base * R_STAWKI_FALA1_FALA2_MULT);
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

/** typeId -> żywność/turę (units.json „żywność/turę"). Brak wpisu = domyślna stawka ruchu. */
export type UnitFoodTable = Readonly<Record<string, number>>;

/** A unit for food-consumption purposes: marching/garrison vs. camping. */
export interface UnitFoodLike {
  typeId?: string;
  /** true = the unit is camping (obozuje) this turn -> half food. */
  camping: boolean;
  /** C-GLOD-Q2=B (Maciej 2026-07-26): true = unit stands on its OWNER's own
   *  territory (mult zywnoscMnoznikTerytorium, default x1.0); false = anywhere
   *  else (mult zywnoscMnoznikPozaTerytorium, default x2.0) -- simplified, no
   *  road/no-man's-land/wall/stack-size distinction (owner's explicit choice).
   *  Omitted (old call sites / tests) => defaults to own-territory (x1.0), so
   *  behaviour is unchanged unless the caller explicitly opts in. */
  onOwnTerritory?: boolean;
}

/**
 * Koszt żywności jednej jednostki (Spec s.6.3 + units.json „żywność/turę").
 * Zwiadowca i inne wyjątki = 0 w tabeli; brak wpisu → zywnoscJednostkaRuch/oboz.
 * C-GLOD-Q2=B: wynik dodatkowo mnożony przez stawkę terytorialną (x1,0 własne /
 * x2,0 poza własnym).
 */
export function unitFoodPerTurn(
  unit: UnitFoodLike,
  p: UpkeepParams,
  foodTable: UnitFoodTable = {},
): number {
  let base = p.zywnoscJednostkaRuch;
  if (unit.typeId && typeof foodTable[unit.typeId] === 'number') {
    base = foodTable[unit.typeId]!;
  }
  if (base <= 0) return 0;
  if (unit.camping) {
    const ratio = p.zywnoscJednostkaOboz / (p.zywnoscJednostkaRuch || 1);
    base = base * ratio;
  }
  const onOwnTerritory = unit.onOwnTerritory ?? true;
  const mnoznikTerytorium = onOwnTerritory
    ? (p.zywnoscMnoznikTerytorium ?? 1)
    : (p.zywnoscMnoznikPozaTerytorium ?? 2);
  const food = base * mnoznikTerytorium;
  if (food <= 0) return 0;
  // R-STAWKI FALA1×FALA2: ×4 żywność wojska
  return food * R_STAWKI_FALA1_FALA2_MULT;
}

/** Build typeId -> food/turn from units.json rows. */
export function buildUnitFoodTable(
  rows: ReadonlyArray<Record<string, unknown>>,
): UnitFoodTable {
  const out: Record<string, number> = {};
  for (const row of rows) {
    const name = row['Jednostka'];
    if (typeof name !== 'string' || name.length === 0) continue;
    const direct = row['żywność/turę'] ?? row['zywnosc/ture'];
    if (typeof direct === 'number' && Number.isFinite(direct)) {
      out[name] = Math.max(0, direct);
    }
  }
  return out;
}

/**
 * Total military food consumption for a group of units this turn (Spec s.6.3):
 *   marching / garrison: zywnoscJednostkaRuch each (default 1),
 *   camping:             zywnoscJednostkaOboz each (default 0.5).
 * Per-type override: units.json „żywność/turę" (np. Zwiadowca = 0).
 */
export function militaryFoodConsumption(
  units: ReadonlyArray<UnitFoodLike>,
  p: UpkeepParams,
  foodTable: UnitFoodTable = {},
): number {
  let sum = 0;
  for (const u of units) {
    sum += unitFoodPerTurn(u, p, foodTable);
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

/**
 * Suma utrzymania budynków jednego miasta (Spec s.6.1 — per-building z buildings.json).
 */
export function buildingUpkeepForBuiltIds(
  builtIds: readonly string[],
  buildingCatalog: readonly BuildingRecord[],
  levelFor: (bdef: BuildingRecord) => number,
  flatOverride?: number,
): number {
  const instances: BuildingInstanceLike[] = [];
  for (const bid of builtIds) {
    const bdef = buildingCatalog.find(b => b.id === bid);
    if (!bdef) continue;
    instances.push({ record: bdef, level: levelFor(bdef) });
  }
  return totalBuildingUpkeep(instances, flatOverride);
}
