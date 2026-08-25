/**
 * production.ts
 * City PRODUCTION QUEUE -- pure logic (task A2).
 *
 * A city builds buildings in the Praca queue. Units are represented in the
 * catalogue as production items for the separate, paid recruitment queue.
 * Each turn the city pours its Praca (production output, see
 * game/turn-economy.ts) into the building at the FRONT of its queue. When the
 * accumulated Praca reaches that building's cost, it is popped off the queue
 * and any leftover Praca is carried onto the next building.
 *
 * Pure logic -- no DOM, no THREE, no I/O, no global state, no mutation of the
 * inputs.  Every function returns fresh values, which makes the module directly
 * unit-testable (see tools/logic-test.cjs).
 *
 * Design (PROJEKT-GRY-master.md sec.8, sec.8e):
 *   - Building cost          : kosztBudowy + przyrostKosztu * (level-1)  (liniowy, decyzja Naster 2026-07-25)
 *   - Building availability   : kategoria belongs to current epoch (epokaWejscia
 *                               <= city epoch), its techUnlock is researched (or
 *                               empty). Max 1 szt. na typ w miescie — znika gdy
 *                               zbudowany LUB w kolejce produkcji.
 *   - Unit cost              : the unit's "Pieniadz (koszt)" field (skarb/pieniadz
 *                               in ALL epochs, incl. Kamien), falling back to a
 *                               per-role default when the field is missing.
 *   - Epoch numbering        : Kamien = 1, Braz = 2, Zelazo = 3 (buildings use a
 *                               numeric epokaWejscia; units use a string Epoka --
 *                               we normalise both through EPOCH_BY_NAME).
 *
 * This module deliberately knows nothing about WHERE the Praca comes from: the
 * caller (the per-turn tick) computes a city's Praca via the economy and feeds
 * it to advanceProduction().  Likewise, applying a completed item (placing a
 * building, spawning a unit, spending population) is the caller's job.
 *
 * Exports:
 *   ProductionKind        - 'budynek' | 'jednostka'
 *   ProductionItem        - one queued thing { kind, id, nazwa, koszt }
 *   CityProduction        - a city's queue + accumulated progress
 *   ProductionData        - the slice of GameData this module reads
 *   EPOCH_BY_NAME         - epoch-name -> epoch-number map
 *   DEFAULT_UNIT_COST     - fallback unit Praca cost
 *   epochNumber()         - normalise a unit Epoka string to a number
 *   itemCost()            - cost of a single building/unit at a given level/epoch
 *   buildingProductionItem() / unitProductionItem() - build a ProductionItem
 *   availableProduction() - what a city may queue right now
 *   advanceProduction()   - pour one turn of Praca into the queue
 *   enqueue() / dequeue() - immutable queue helpers
 *   sanitizeBuildQueue() - removes legacy unit entries from the Praca queue
 *   frontItem()           - the item currently being built (or null)
 */

import type { BuildingDef, UnitDef } from '../data/loader';
import type { City } from './cities';
import { applyBuildingCostPace, type BuildingCostPace } from './building-cost-tempo';
import { applyUnitCostPace, type KosztJednostekPace } from './unit-cost-tempo';
import {
  applyDifficultyCostMultiplier,
  type GameDifficulty,
} from './difficulty-cost';
import { buildingCostAfterCivDiscount } from './civ-bonuses';
import { unitManpowerCostForType, tryDeductUnitSpawnCosts, cityManpowerCurrent } from './manpower';
import {
  CITY_BUILDING_PREREQ,
  cityBuildingPrereqMet,
  WATER_ACCESS_BUILDING_IDS,
  buildingResourceGateMet,
} from './building-resource-gate';
import { buildingStockCost, canAffordBuildingStock } from './building-stock-cost';
import {
  isBuildingSuppressedFromProduction,
  upgradeProductionDisplayName,
} from './building-upgrades';
import miastoParams from '../../data/miasto-params.json';
import { R_STAWKI_KOSZT_MULT, R_STAWKI_FALA2_MULT } from './r-stawki-strojenie';

export {
  buildingRuntimeGateMet,
  filterRuntimeActiveBuiltIds,
  hasDepositRuntimeGate,
  DEPOSIT_RUNTIME_GATED_BUILDING_IDS,
  type SpichlerzCityBonusState,
} from './building-resource-gate';

/** What kind of thing a city can produce. */
export type ProductionKind = 'budynek' | 'jednostka';

/**
 * A single entry sitting in a city's production queue.
 *
 *   kind   : 'budynek' for a building, 'jednostka' for a unit.
 *   id     : stable identifier -- a building's `id`, or a unit's `Jednostka`
 *            name (units have no separate id field in units.json).
 *   nazwa  : human-readable display name.
 *   koszt  : total Praca required to complete it (computed via itemCost()).
 *   postep : BANKED Praca for this item WHILE IT IS NOT the front (index 0).
 *            Optional -- absent/undefined means 0 (an item that has never sat
 *            at the front yet, or an old save from before this field existed).
 *            Written/read exclusively by promoteToFront() (P-PROMOCJA-FRONT-
 *            RESET-POSTEPU-Q1=B): when an item leaves the front it parks its
 *            active `CityProduction.postep` here; when it returns to the
 *            front this value is restored into `CityProduction.postep` and
 *            cleared here (never duplicated in both places at once). The
 *            item at kolejka[0] never carries a meaningful value here -- its
 *            live progress lives in `CityProduction.postep` instead.
 *            / EN: BANKED Praca for this item WHILE IT IS NOT the front
 *            (index 0). Optional -- absent/undefined means 0 (an item that
 *            has never been at the front, or an old save predating this
 *            field). Written/read exclusively by promoteToFront(): leaving
 *            the front parks the active `CityProduction.postep` here;
 *            returning to the front restores it into `CityProduction.postep`
 *            and clears it here (never duplicated in both places at once).
 */
export type ProductionItem = {
  kind: ProductionKind;
  id: string;
  nazwa: string;
  koszt: number;
  postep?: number;
};

/**
 * A city's production state.
 *
 *   kolejka : ordered queue; index 0 is the item currently being built.
 *   postep  : Praca accumulated so far on the FRONT item only (resets to the
 *             carried remainder each time an item completes). Contract
 *             UNCHANGED by P-PROMOCJA-FRONT-RESET-POSTEPU-Q1 -- this scalar
 *             is still the sole ACTIVE counter that advanceProduction()/
 *             rushCost() etc. read; non-front items bank their own progress
 *             on `ProductionItem.postep` instead (see that field's doc),
 *             swapped in/out of this scalar only by promoteToFront().
 *             / EN: contract UNCHANGED by P-PROMOCJA-FRONT-RESET-POSTEPU-Q1
 *             -- still the sole ACTIVE counter read by advanceProduction()/
 *             rushCost() etc.; non-front items bank their own progress on
 *             `ProductionItem.postep` instead, swapped in/out of this scalar
 *             only by promoteToFront().
 */
export interface CityProduction {
  kolejka: ProductionItem[];
  postep: number;
  /**
   * Wstrzymanie (Wstrzymaj): when true, advanceProduction adds no progress and
   * the queue + postep are preserved. Optional; absent/false = running.
   */
  wstrzymana?: boolean;
  /**
   * Kolejka rekrutacji (oplacona Pieniadzem). Max 1 ukonczenie / ture / miasto (v0.1).
   * Przyszlosc (Grupa D): limit zalezny od wielkosci/typu cywilizacji.
   */
  rekrutacja?: ProductionItem[];
}

/** v0.1: ile jednostek moze zakonczyc rekrutacje w jednej turze (na miasto). */
export const RECRUIT_UNITS_PER_TURN = 1;

/**
 * The slice of GameData this module needs.  Accepting just these two arrays
 * (rather than the whole GameData) keeps the module decoupled and easy to test
 * with hand-rolled fixtures.
 */
export interface ProductionData {
  buildings: BuildingDef[];
  units: UnitDef[];
}

// ---------------------------------------------------------------------------
// Epoch handling
// ---------------------------------------------------------------------------

/**
 * Epoch name -> ordinal.  Buildings carry a numeric `epokaWejscia`; units carry
 * a string `Epoka`.  We normalise unit epochs through this map so the two data
 * sources can be compared on one axis.  ASCII keys plus their diacritic forms
 * are both registered so lookups never depend on diacritic normalisation.
 */
export const EPOCH_BY_NAME: Readonly<Record<string, number>> = {
  Kamien: 1,
  'Kamień': 1, // matches data key (U+0144)
  Braz: 2,
  'Brąz': 2,   // matches data key (U+0105)
  Zelazo: 3,
  'Żelazo': 3, // matches data key (U+017B)
};

/**
 * Resolve a unit's `Epoka` string to its ordinal.  Unknown or null epochs map
 * to 1 (the earliest era) so a malformed row never hides a unit entirely.
 */
export function epochNumber(epoka: string | null | undefined): number {
  if (epoka == null) return 1;
  const n = EPOCH_BY_NAME[epoka];
  return typeof n === 'number' ? n : 1;
}

// ---------------------------------------------------------------------------
// Building level + linear scaling
// ---------------------------------------------------------------------------

/**
 * Building level derived from a city's epoch: 1 at the building's entry epoch,
 * +1 each subsequent epoch, capped at maksPoziom (>= 1).
 *
 * Optional tech gate (`poziomTechGate`, decyzja Naster — kolizja nazwy
 * "Obserwatorium"): a building may additionally require a specific technology
 * to be researched before it can advance to (or past) a given level. E.g. the
 * Biblioteka's `poziomTechGate` is `{ "6": "Astronomia" }` — level 6
 * ("Obserwatorium") stays locked until Astronomia is unlocked, regardless of
 * how many epochs have passed. When omitted, behaviour is unchanged (pure
 * epoch-based level).
 */
export function buildingLevelForEpoch(
  epokaWejscia: number,
  cityEpoch: number,
  maksPoziom: number,
  poziomTechGate?: Record<string, string> | null,
  unlockedTechs?: ReadonlySet<string> | readonly string[] | null,
): number {
  const lvl = Math.floor(cityEpoch) - Math.floor(epokaWejscia) + 1;
  const cap = Number.isFinite(maksPoziom) && maksPoziom > 0 ? Math.floor(maksPoziom) : 1;
  let level = Math.max(1, Math.min(cap, lvl));
  if (poziomTechGate) {
    const unlocked = unlockedTechs instanceof Set ? unlockedTechs : new Set(unlockedTechs ?? []);
    for (const [levelKey, techName] of Object.entries(poziomTechGate)) {
      const gateLevel = Number(levelKey);
      if (Number.isFinite(gateLevel) && level >= gateLevel && !unlocked.has(techName)) {
        level = Math.min(level, gateLevel - 1);
      }
    }
  }
  return level;
}

/**
 * Linear value of a building base stat at `level`: baza + przyrost * (level-1).
 * Level 1 returns `baza` unchanged (no growth bonus yet).
 */
export function buildingEffectAtLevel(baza: number, przyrost: number, level: number): number {
  const n = Math.max(1, Math.floor(level));
  return baza + przyrost * (n - 1);
}

// ---------------------------------------------------------------------------
// Unit cost fallback
// ---------------------------------------------------------------------------

/** Praca cost used for a unit when its cost field is absent / non-numeric.
 *  Data-driven from data/miasto-params.json (jednostka_koszt_domyslny); fallback 10. */
export const DEFAULT_UNIT_COST = (miastoParams.jednostka_koszt_domyslny?.wartosc as number) ?? 10;

/**
 * Per-role default Praca cost, keyed by the unit's "Rola (linia)".  Used only
 * as a fallback when "Pieniadz (koszt)" is missing; mirrors the rough ordering
 * of the Stone/Bronze roster (support cheapest, melee/cavalry dearer).
 */
const DEFAULT_COST_BY_ROLE: Readonly<Record<string, number>> = {
  Wsparcie: (miastoParams.jednostka_koszt_rola_wsparcie?.wartosc as number) ?? 12,
  Dystans:  (miastoParams.jednostka_koszt_rola_dystans?.wartosc as number) ?? 8,
  'Wręcz':  (miastoParams.jednostka_koszt_rola_wrecz?.wartosc as number) ?? 10, // melee role key
  Wrecz:    (miastoParams.jednostka_koszt_rola_wrecz?.wartosc as number) ?? 10,
  Konnica:  (miastoParams.jednostka_koszt_rola_konnica?.wartosc as number) ?? 16,
};

function unitCostFromDef(def: UnitDef): number {
  const raw = def['Pieniądz (koszt)'];
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    if (raw > 0) return raw;
    // Super-jednostka (audyt #11): koszt 0 w danych = naprawdę bezpłatna wg
    // designu ("max 1, bezpłatna") -- nie spada na fallback roli jak zwykłe
    // jednostki z brakującym/zerowym kosztem (limit 1 żywej sztuki egzekwowany
    // osobno w availableProduction/availableReplacementsFor przez aliveUnitTypeNames).
    if (raw === 0 && def['Super-jednostka'] === 'TAK') return 0;
  }
  const rola = def['Rola (linia)'];
  if (rola != null) {
    const byRole = DEFAULT_COST_BY_ROLE[rola];
    if (typeof byRole === 'number') return byRole;
  }
  return DEFAULT_UNIT_COST;
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

function findBuilding(data: ProductionData, id: string): BuildingDef | undefined {
  return data.buildings.find(b => b.id === id);
}

/** Units are identified by their `Jednostka` name (no separate id column). */
function findUnit(data: ProductionData, id: string): UnitDef | undefined {
  return data.units.find(u => u.Jednostka === id);
}

// ---------------------------------------------------------------------------
// itemCost
// ---------------------------------------------------------------------------

/**
 * Total Praca cost of one item.
 *
 *   building : kosztBudowy + przyrostKosztu * (level - 1)  (liniowy, decyzja Naster 2026-07-25)
 *              `cityLevelOrEpoch` is interpreted as the level the building would
 *              be built at (1-based).  Level <= 1 yields the flat kosztBudowy.
 *   unit     : its "Pieniadz (koszt)" (or a per-role default).  `cityLevelOrEpoch`
 *              is ignored for units -- their cost does not scale with city level.
 *
 * Returns 0 when the id is unknown (a defensive default the caller can treat as
 * "not buildable" rather than crashing the turn).
 */
export function itemCost(
  kind: ProductionKind,
  id: string,
  data: ProductionData,
  cityLevelOrEpoch: number,
): number {
  if (kind === 'budynek') {
    const b = findBuilding(data, id);
    if (!b) return 0;
    const level = Number.isFinite(cityLevelOrEpoch) ? Math.max(1, Math.floor(cityLevelOrEpoch)) : 1;
    const przyrostKosztu = Number.isFinite(b.przyrostKosztu) ? b.przyrostKosztu : 0;
    return Math.round(b.kosztBudowy + przyrostKosztu * (level - 1));
  }
  const u = findUnit(data, id);
  if (!u) return 0;
  return unitCostFromDef(u);
}

// ---------------------------------------------------------------------------
// ProductionItem builders
// ---------------------------------------------------------------------------

/**
 * Build a ProductionItem for a building at the given level (default 1).
 * Returns null when the building id is unknown.
 */
export function buildingProductionItem(
  id: string,
  data: ProductionData,
  level = 1,
  civBonusy?: readonly CivBonusLite[],
  buildingCostPace?: BuildingCostPace,
  ownerId = 0,
  difficulty: GameDifficulty = 'normal',
): ProductionItem | null {
  const b = findBuilding(data, id);
  if (!b) return null;
  return {
    kind: 'budynek',
    id: b.id,
    nazwa: b.nazwa,
    koszt: buildingWorkCost(
      itemCost('budynek', b.id, data, level),
      civBonusy,
      buildingCostPace,
      ownerId,
      difficulty,
    ),
  };
}

/**
 * Build a ProductionItem for a unit (by its Jednostka name).
 * Returns null when the unit name is unknown.
 */
export function unitProductionItem(
  id: string,
  data: ProductionData,
  civBonusy?: readonly CivBonusLite[],
  kosztJednostekPace?: KosztJednostekPace,
  ownerId = 0,
  difficulty: GameDifficulty = 'normal',
): ProductionItem | null {
  const u = findUnit(data, id);
  if (!u) return null;
  return {
    kind: 'jednostka',
    id: u.Jednostka,
    nazwa: u.Jednostka,
    koszt: unitMoneyCost(
      itemCost('jednostka', u.Jednostka, data, 1),
      civBonusy,
      kosztJednostekPace,
      ownerId,
      difficulty,
    ),
  };
}

// ---------------------------------------------------------------------------
// availableProduction
// ---------------------------------------------------------------------------

/**
 * Optional context refining what a city may build.  All fields are optional so
 * the function degrades gracefully when the runtime cannot supply them yet.
 *
 *   epoch        : the city's current epoch ordinal (default 1 = Kamien).  Only
 *                  buildings with epokaWejscia <= epoch and units whose Epoka
 *                  ordinal <= epoch are offered.
 *   builtBuildingIds : ids wybudowanych budynkow.
 *   productionQueue  : kolejka — budynek w kolejce znika z listy do wyboru.
 *   buildingLevel : domyslny poziom ceny budynku unikalnego (default 1).
 */
export interface AvailabilityContext {
  epoch?: number;
  builtBuildingIds?: readonly string[];
  /** Kolejka produkcji miasta — do ukrywania unikalnych budynkow juz zamowionych. */
  productionQueue?: readonly ProductionItem[];
  buildingLevel?: number;
  /** RDY-01: bonusy cyw z civs.json (np. Zulusi -10% rekrutacji Impi). */
  civBonusy?: readonly CivBonusLite[];
  /** Etykieta Nacja z units.json (np. Celtowie, Grecja) — filtr jednostek per cyw. */
  civUnitNacja?: string;
  /** Ulepszenia terenu imperium — bramka Popalnia brązu (ABC-13). */
  placedImprovements?: ReadonlyMap<string, string | readonly string[]> | null;
  /**
   * Kopalnia postawiona na złożu żelaza gdziekolwiek w imperium gracza (bramka Odlewni
   * żelaza / jednostek żelaznych, decyzja właściciela 2026-07-19) — WYLICZONE przez
   * wołającego (main.ts/cityPanel.ts, tam gdzie jest dostęp do mapy), bo production.ts
   * jest pure-logic i nie zna mapy. Patrz game/zelazo-access.ts hasZelazoAccess().
   */
  hasKopalniaNaZlozuZelaza?: boolean;
  /**
   * Nazwy ("Jednostka") aktualnie żywych jednostek TEGO właściciela na mapie —
   * limit 1 żywej sztuki dla Super-jednostka=TAK (audyt #11, decyzja A3=A).
   * WYLICZONE przez wołającego (main.ts/cityPanel.ts zna roster `units`);
   * production.ts jest pure-logic i nie ma dostępu do mapy/rosteru.
   */
  aliveUnitTypeNames?: ReadonlySet<string>;
  /** Mnoznik kosztow budynkow z kreatora (Niski x1 / Normalny x2 / Wysoki x4). */
  buildingCostPace?: BuildingCostPace;
  /** Mnoznik kosztow rekrutacji jednostek z kreatora (Niski x1 / Normalny x2 / Wysoki x4). */
  kosztJednostekPace?: KosztJednostekPace;
  /** ownerId miasta — asymetria trudnosci kosztow (0 = gracz). */
  ownerId?: number;
  /** Poziom trudnosci rozgrywki — latwa/normalna/trudna. */
  difficulty?: GameDifficulty;
  /**
   * Aktywny dostep surowcow miasta (etykiety z getResourceAccessForCity) —
   * bramka budynkow wymagajacych zloza + ulepszenia w zasiegu.
   */
  activeResourceLabels?: readonly string[];
  /** Aktywny dostęp surowców imperium (union miast) — bramki surowcowe (TEMAT 8 Q2). */
  empireActiveResourceLabels?: readonly string[];
  /** Wszystkie id budynków w imperium (union) — bramka cegła/ceramika. */
  empireBuiltIds?: readonly string[];
  /** Zapas surowców puli państwa (Maciej 2026-07-24) — bramka surowcowa spełniona też ZAPASEM,
   *  nie tylko aktywnym źródłem (fix: budynek blokowany mimo posiadanego surowca w puli). */
  empireResourceStock?: Readonly<Record<string, number>>;
  /**
   * TEMAT 8 Q2 (2026-07-24): czy TO miasto ma wybrzeże morskie LUB rzekę w zasięgu — bramka
   * Portu/Portu wielkiego (`WATER_ACCESS_BUILDING_IDS`, building-resource-gate.ts). Per-miasto
   * (nie imperium — lokalizacja portu jest stała), WYLICZONE przez wołającego (main.ts zna
   * mapę, ten moduł jest pure-logic) — patrz main.ts `cityHasCoastOrRiverAccess`.
   *
   * DRUGIE ZASTOSOWANIE (R-BUDYNEK-PORTOWY-MIASTA-NADBRZEZNE, Maciej 2026-08-09): to samo pole
   * bramkuje też jednostki `Typ='Naval'` (np. Galera) w `availableProduction()` i
   * `availableReplacementsFor()`/`passesAvailabilityGates()` — miasto bez dostępu do wody nie
   * może budować/rekrutować/zastępować jednostkami morskimi. Rzeka liczy się tak samo jak morze
   * (decyzja Macieja) — jedna, wspólna flaga dla obu bramek (budynki wodne + jednostki Naval),
   * nie osobne pole.
   */
  cityHasCoastOrRiver?: boolean;
  /**
   * ADMIN-STOLICA (decyzja Macieja 2026-07-25): czy TO miasto jest stolicą TEGO
   * właściciela — bramka budynków z `BuildingDef.lokalizacja` ('stolica' = tylko
   * tu, np. Pałac I/II/III; 'region' = tylko poza stolicą, np. Dom Starszyzny/
   * Dwór Zarządcy/Pretorium). Musi być liczone jednym, spójnym źródłem prawdy —
   * `capitalCityIdForOwner(ownerId)` (main.ts) / `cfg.getCapitalCityId` (cityPanel.ts),
   * NIGDY osobną heurystyką — patrz uwaga przy turn-economy.ts `isCapital`
   * (liczone tam jako "pierwsze miasto w tablicy `cities`", które NIE uwzględnia
   * przeniesienia stolicy gracza/AI — to inne, starsze źródło, tu celowo nieużywane).
   * `undefined` = nieznane → oba kierunki bramki blokują budynek (fail-safe:
   * budynku ograniczonego lokalizacją nie pokazujemy, dopóki wołający nie poda
   * jednoznacznej odpowiedzi). WYLICZANE identycznie dla gracza i AI (ownerId
   * to zwykły parametr `capitalCityIdForOwner`, bez gałęzi po ownerId) — PARYTET AI.
   */
  isCapital?: boolean;
}

/** Czy budynek wolno postawić w tym mieście wg `BuildingDef.lokalizacja` (ADMIN-STOLICA). */
function buildingLocationAllowed(
  lokalizacja: 'stolica' | 'region' | undefined,
  isCapital: boolean | undefined,
): boolean {
  if (lokalizacja === 'stolica') return isCapital === true;
  if (lokalizacja === 'region') return isCapital === false;
  return true;
}

/**
 * Maciej 2026-07-22: globalna korekta balansu — koszt Pracy budynkow x0.5 (flat).
 * Dotyczy tylko budynkow (nie jednostek); przed asymetria trudnosci.
 */
export const GLOBAL_BUILDING_PROD_MULT = 0.5;

/** Koszt Pracy budynku: ulga cywilizacji + tempo kreatora + globalny balans + asymetria trudnosci. */
export function buildingWorkCost(
  baseCost: number,
  civBonusy?: readonly CivBonusLite[],
  pace?: BuildingCostPace,
  ownerId = 0,
  difficulty: GameDifficulty = 'normal',
): number {
  const afterCiv = buildingCostAfterCivDiscount(baseCost, civBonusy);
  const afterPace = pace ? applyBuildingCostPace(afterCiv, pace) : afterCiv;
  // GLOBAL×0.5 × FALA1×2 × FALA2×2 → efekt 2.0 vs JSON koszt Pracy budynku
  const afterGlobal = Math.max(
    1,
    Math.round(afterPace * GLOBAL_BUILDING_PROD_MULT * R_STAWKI_KOSZT_MULT * R_STAWKI_FALA2_MULT),
  );
  return applyDifficultyCostMultiplier(afterGlobal, ownerId, difficulty);
}

/** Koszt rekrutacji jednostki (Pieniadz): ulga cywilizacji + tempo + trudnosc. */
export function unitMoneyCost(
  baseCost: number,
  civBonusy?: readonly CivBonusLite[],
  pace?: KosztJednostekPace,
  ownerId = 0,
  difficulty: GameDifficulty = 'normal',
): number {
  let koszt = baseCost;
  const recDisc = civRecruitmentDiscount(civBonusy);
  if (recDisc > 0) {
    koszt = Math.max(1, Math.floor(koszt * (1 - recDisc)));
  }
  const afterPace = pace ? applyUnitCostPace(koszt, pace) : koszt;
  // R-NADMIAR-POOLS FALA2: rekrutacja jednostek (Pieniądz) ×2 vs JSON
  const afterFala2 = Math.max(1, Math.round(afterPace * R_STAWKI_FALA2_MULT));
  return applyDifficultyCostMultiplier(afterFala2, ownerId, difficulty);
}

/** Minimalny ksztalt bonusy[] — bez importu economy (unikamy cyklu z production). */
export interface CivBonusLite {
  typ: string;
  cel: string;
  /** jednostka_specjalna: string[] (od RDY tokeny-fix — 1 wpis / zamiennik nacji);
   *  string legacy (pojedyncza nazwa lub "A/B" łączone slashem) nadal wspierany. */
  wartosc: number | string | string[];
  opis?: string;
  realizuje?: string;
}

/** Ulga na koszt rekrutacji z bonusow realizuje=ekonomia (Zulusi Impi -10%). */
export function civRecruitmentDiscount(
  bonusy: readonly CivBonusLite[] | undefined,
): number {
  if (!bonusy?.length) return 0;
  for (const b of bonusy) {
    if (b.realizuje !== 'ekonomia') continue;
    const opis = (b.opis ?? '').toLowerCase();
    if (opis.includes('rekrutacji') && typeof b.wartosc === 'number' && b.wartosc > 0) {
      return b.wartosc;
    }
  }
  return 0;
}

/** DOSTEP-SUROWCE-Q1: czy imperium ma >0 szt. surowca w magazynie państwa. */
function empireStockHas(
  stock: Readonly<Record<string, number>> | undefined,
  asciiKey: string,
): boolean {
  return (stock?.[asciiKey] ?? 0) > 0;
}

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036F]/g, '').toLowerCase();
}

/** typCywilizacji / ikonaId → kolumna Nacja w units.json. */
const CIV_KEY_TO_UNIT_NACJA: Readonly<Record<string, string>> = {
  grecy: 'Grecja',
  rzymianie: 'Rzym',
  chinczycy: 'Chiny',
  zulusi: 'Zulu',
  inkowie: 'Inkowie',
  egipt: 'Egipt',
  // BUGFIX (Sumer): civs.json ikonaId + TypCywilizacji.Sumer enum both use 'sumer'
  // (ikonaId="sumer" — patrz data/civs.json), nie 'sumerowie'. Bez tego klucza
  // unitNacjaForCivKey('sumer') zwracal undefined -> jednostki Sumeru nigdy sie
  // nie pokazywaly w produkcji miasta. 'sumerowie' zostaje (nieuzywany, ale
  // nieszkodliwy legacy klucz); 'babilon' to zamierzony alias wsteczny (patrz
  // TypCywilizacji.Babilon @deprecated w types/player.ts) — Sumerowie bywali
  // dawniej nazywani "Babilon", oba klucze poprawnie wskazuja nacje Sumer.
  sumer: 'Sumer',
  sumerowie: 'Sumer',
  babilon: 'Sumer',
  celtowie: 'Celtowie',
  germanie: 'Germanie',
  harappa: 'Harappa',
  hetyci: 'Hetyci',
  slowianie: 'Słowianie',
  babilonia: 'Babilonia',
  asyria: 'Asyria',
  fenicjanie: 'Fenicjanie',
};

/** Etykieta Nacja dla klucza cywilizacji (units.json). */
export function unitNacjaForCivKey(civKey: string | null | undefined): string | undefined {
  if (!civKey?.trim()) return undefined;
  return CIV_KEY_TO_UNIT_NACJA[civKey.trim().toLowerCase()];
}

function unitAllowedForCivNation(unitNacja: string, civUnitNacja: string | undefined): boolean {
  const n = unitNacja.trim();
  if (!n) return true;
  const c = (civUnitNacja ?? '').trim();
  if (!c) return false;
  return stripDiacritics(n) === stripDiacritics(c);
}

/** Mnoznik: kupno budynku za Pieniadz = koszt Pracy × ten wspolczynnik. */
export const BUILDING_GOLD_PURCHASE_MULT = 2;

export function buildingGoldPurchaseCost(pracaKoszt: number): number {
  return Math.max(1, Math.round(pracaKoszt * BUILDING_GOLD_PURCHASE_MULT));
}

/** Czy typ budynku jest juz zbudowany lub zamowiony w kolejce. */
export function buildingTypeCommitted(
  buildingId: string,
  builtIds: readonly string[],
  queue: readonly ProductionItem[],
): boolean {
  for (const id of builtIds) if (id === buildingId) return true;
  for (const it of queue) {
    if (it.kind === 'budynek' && it.id === buildingId) return true;
  }
  return false;
}

/** Czy budynek zostal zastapiony przez upgrade (np. kręgi → świątynia). */
export function isBuildingSupersededByUpgrade(
  buildingId: string,
  builtIds: readonly string[],
  buildings: readonly { id: string; upgradeFrom?: string }[],
): boolean {
  for (const b of buildings) {
    if (b.upgradeFrom === buildingId && builtIds.includes(b.id)) return true;
  }
  return false;
}

/**
 * Po ukonczeniu budynku: upgrade zastepuje poprzednika w builtIds (T-TECH-8, ABC-7).
 * Pure — zwraca nowa tablice; caller podmienia stan miasta.
 */
export function applyCompletedBuildingIds(
  builtIds: readonly string[],
  completedBuildingId: string,
  buildings: readonly { id: string; upgradeFrom?: string }[],
): string[] {
  const def = buildings.find(b => b.id === completedBuildingId);
  const next = [...builtIds];
  const upgradeFrom = def?.upgradeFrom?.trim();
  if (upgradeFrom) {
    const idx = next.indexOf(upgradeFrom);
    if (idx >= 0) next.splice(idx, 1);
  }
  if (!next.includes(completedBuildingId)) next.push(completedBuildingId);
  // Kamienne Mury zastępują wczesną Palisadę drewnianą (nie stack bonusów).
  if (completedBuildingId === 'mury') {
    const pi = next.indexOf('palisada');
    if (pi >= 0) next.splice(pi, 1);
  }
  return next;
}

/**
 * Decyzja 55B (Maciej 2026-07-25, "odblokowuje ozywic"): po ukonczeniu budynku
 * zwraca nazwe flagi City do ustawienia na true (np. 'maMur' dla Murow), odczytana
 * z buildings.json pola `odblokowuje` -- zamiast hardkodu `id === 'mury'`.
 * null = budynek nie odblokowuje zadnej flagi City.
 *
 * UWAGA (regresja 'fort'): przed ta zmiana ukonczenie 'fort' (Cytadela) ustawialo
 * TAKZE maMur=true obok wlasnego odblokowuje='maFort'. To bylo nadmiarowe: 'fort'
 * ma twardy prerekwyzyt 'mury' w TYM SAMYM miescie (CITY_BUILDING_PREREQ w
 * building-resource-gate.ts, sprawdzany przy KOLEJKOWANIU produkcji) -- Mury
 * musza wiec byc juz ukonczone (i maMur juz ustawione) zanim Fort w ogole moze
 * zostac ukonczony w tym miescie. Usuniecie dodatkowego `|| id==='fort'` nie
 * zmienia wiec zadnego realnego przebiegu gry, tylko usuwa martwa nadmiarowosc.
 */
export function buildingUnlockFlagFor(
  completedBuildingId: string,
  buildings: readonly { id: string; odblokowuje?: string }[],
): string | null {
  const def = buildings.find(b => b.id === completedBuildingId);
  const flag = def?.odblokowuje?.trim();
  return flag ? flag : null;
}

/** Czy typ budynku jest juz w kolejce (ulepszenie — zbudowany moze byc). */
export function buildingTypeQueued(
  buildingId: string,
  queue: readonly ProductionItem[],
): boolean {
  for (const it of queue) {
    if (it.kind === 'budynek' && it.id === buildingId) return true;
  }
  return false;
}

function isBlankReplacement(zamiast: string): boolean {
  return zamiast.length === 0 || zamiast === '-' || zamiast === '\u2014';
}

/**
 * Tokeny nazw jednostek specjalnych z bonusy[] typ=jednostka_specjalna.
 *
 * `wartosc` moze byc:
 *   - string[]  — schemat od RDY tokeny-fix (1 wpis / zamiennik nacji, civs.json).
 *   - string    — legacy: pojedyncza nazwa, lub kilka nazw łączone "/" (nadal
 *                 wspierane dla wstecznej zgodnosci / recznie edytowanych danych).
 */
export function civSpecialUnitNameTokens(
  bonusy: readonly CivBonusLite[] | undefined,
): string[] {
  if (!bonusy?.length) return [];
  const tokens: string[] = [];
  for (const b of bonusy) {
    if (b.typ !== 'jednostka_specjalna') continue;
    const rawValues: string[] = Array.isArray(b.wartosc)
      ? b.wartosc.map(v => String(v ?? ''))
      : [String(b.wartosc ?? '')];
    for (const rawValue of rawValues) {
      const raw = rawValue.trim();
      if (!raw) continue;
      for (const part of raw.split('/')) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        tokens.push(trimmed);
        const primary = trimmed.split('(')[0]?.trim();
        if (primary && primary !== trimmed) tokens.push(primary);
      }
    }
  }
  return tokens;
}

/** Czy nazwa jednostki pasuje do tokenu specjalnej z civs.json. */
export function unitMatchesSpecialName(unitName: string, tokens: readonly string[]): boolean {
  if (!tokens.length) return false;
  const un = stripDiacritics(unitName);
  for (const token of tokens) {
    const tn = stripDiacritics(token);
    if (!tn) continue;
    if (un === tn || un.startsWith(tn) || tn.startsWith(un) || un.includes(tn) || tn.includes(un)) {
      return true;
    }
  }
  return false;
}

/**
 * Everything `city` is allowed to put in its queue right now.
 *
 * Buildings: of the current epoch (epokaWejscia <= epoch), whose techUnlock is
 *   in `unlockedTechs` (an empty techUnlock means no prerequisite -- e.g. the
 *   Palac), and which the city has not already built.
 *
 * Units: "basic" units of the current epoch whose Tech prerequisite is met.  A
 *   unit is basic when its "W zamian za" (named-replacement) column is empty/"-"
 *   -- i.e. it is a standard type, not a civ-specific swap.  Units with a Tech
 *   of '-' / '' / null have no prerequisite.
 *
 * `city` is currently only used as a placeholder for future per-city gating
 *   (e.g. coastal-only buildings); it is accepted now so callers and the API do
 *   not change when that gating lands.  Marked void to satisfy strict lint.
 *
 * Returns a fresh array sorted buildings-first then by ascending cost, so the UI
 * has a stable, sensible order.
 */
export function availableProduction(
  city: City,
  data: ProductionData,
  unlockedTechs: readonly string[],
  ctx: AvailabilityContext = {},
): ProductionItem[] {
  void city; // reserved for future per-city gating; keeps the signature stable

  const epoch = Number.isFinite(ctx.epoch) ? (ctx.epoch as number) : 1;
  const level = Number.isFinite(ctx.buildingLevel) ? (ctx.buildingLevel as number) : 1;
  const builtList = ctx.builtBuildingIds ?? [];
  const queue = ctx.productionQueue ?? [];
  const techs = new Set(unlockedTechs);
  const specTokens = civSpecialUnitNameTokens(ctx.civBonusy);
  const ownerId = ctx.ownerId ?? 0;
  const difficulty = ctx.difficulty ?? 'normal';

  const items: ProductionItem[] = [];

  // --- buildings ---------------------------------------------------------
  for (const b of data.buildings) {
    if (b.epokaWejscia > epoch) continue;
    if (isBuildingSuppressedFromProduction(b)) continue;

    // Palisada drewniana: tylko gdy miasto nie ma już kamiennych Murów/Cytadeli.
    if (b.id === 'palisada' && (builtList.includes('mury') || builtList.includes('fort'))) continue;

    const upgradeFrom = (b.upgradeFrom ?? '').trim();
    if (upgradeFrom.length > 0) {
      if (!builtList.includes(upgradeFrom)) continue;
      if (buildingTypeCommitted(b.id, builtList, queue)) continue;
    } else {
      if (isBuildingSupersededByUpgrade(b.id, builtList, data.buildings)) continue;
      if (buildingTypeCommitted(b.id, builtList, queue)) continue;
    }

    const tech = (b.techUnlock ?? '').trim();
    // BUGFIX (ADMIN-STOLICA 2026-07-25): blank-tech marker w buildings.json bywa zapisany
    // jako '-' (Pałac I/II/III, Dom Starszyzny — "dostępny od startu, bez badań"), tak samo
    // jak dla jednostek (patrz uwaga niżej przy units.json Tech). BEZ tej drugiej formy
    // techUnlock='-' byłby czytany jako WYMAGANA technologia o nazwie "-", której żaden gracz
    // nigdy nie odkryje (nie istnieje w tech.json) — Pałac (i teraz Dom Starszyzny) nigdy nie
    // pojawiałby się w produkcji, niezależnie od bramki stolica/region niżej. Pre-istniejący
    // bug w tym module (jednostki już miały tę samą poprawkę, budynki — nie).
    if (tech.length > 0 && tech !== '-' && tech !== '—' && !techs.has(tech)) continue;
    if (!buildingLocationAllowed(b.lokalizacja, ctx.isCapital)) continue;
    // TEMAT 8 Q2 (2026-07-24): budynek wymaga innego budynku W TYM MIEŚCIE (np. Warsztat
    // oblężniczy → Koszary LUB Akademia wojskowa, Łaźnia publiczna → Studnia). Od
    // GRUPY-BUDYNKOW (2026-07-25) Koszary/Akademia wojskowa stoją w mieście niezależnie
    // (nie w relacji upgradeFrom) — `cityBuildingPrereqMet` akceptuje KTÓRYKOLWIEK z
    // dozwolonych id-ów (CITY_BUILDING_PREREQ może być tablicą), plus dawny fallback
    // "upgrade prerekwizytu" (`isBuildingSupersededByUpgrade`) dla par, które nadal są
    // w łańcuchu — inaczej upgrade/rozdzielenie odbierałoby miastu już zdobyte prawo budowy.
    if (!cityBuildingPrereqMet(CITY_BUILDING_PREREQ[b.id], builtList, data.buildings, isBuildingSupersededByUpgrade)) {
      continue;
    }
    // TEMAT 8 Q2: Port/Port wielki wymagają wybrzeża LUB rzeki w zasięgu TEGO miasta.
    if (WATER_ACCESS_BUILDING_IDS.has(b.id) && !ctx.cityHasCoastOrRiver) {
      continue;
    }
    if (!buildingResourceGateMet(
      b,
      ctx.empireActiveResourceLabels,
      ctx.empireBuiltIds,
      ctx.empireResourceStock,
    )) {
      continue;
    }
    items.push({
      kind: 'budynek',
      id: b.id,
      nazwa: upgradeProductionDisplayName(b, data.buildings),
      koszt: buildingWorkCost(
        itemCost('budynek', b.id, data, level),
        ctx.civBonusy,
        ctx.buildingCostPace,
        ownerId,
        difficulty,
      ),
    });
  }

  // --- units -------------------------------------------------------------
  const built = new Set(builtList);
  for (const u of data.units) {
    // R-EPOKA-KASKADA-JEDNA-Q1 (Maciej 2026-08-12, ECHO commit 1d9691b0): rekrutacja
    // pokazuje jednostki BIEZACEJ epoki ORAZ dokladnie JEDNEJ epoki nizszej -- NIE pelna
    // kaskade w dol jak wczesniej (bledne zrozumienie zasady projektu, podwazone tutaj;
    // patrz nagłówek tools/epoka-merge-recruit-test.cjs). WYJATEK: Zwiadowca -- jedyna
    // jednostka Typ='Civilian' w units.json (zweryfikowane empirycznie na pelnych danych,
    // 2026-08-12) -- dostepny we WSZYSTKICH epokach, bo to jednostka cywilna zwiadu, nie
    // wojskowa (potwierdzone explicite przez wlasciciela).
    // EN: recruitment shows the CURRENT epoch's units PLUS exactly one epoch below -- not
    // a full downward cascade as before (incorrect reading of the project rule, overturned
    // here; see header of tools/epoka-merge-recruit-test.cjs). EXCEPTION: Zwiadowca -- the
    // only Typ='Civilian' unit in units.json (verified empirically against the full dataset,
    // 2026-08-12) -- is always available regardless of epoch, being a civilian scout unit,
    // not a military one (explicitly confirmed by the owner).
    const unitEpoch = epochNumber(u.Epoka);
    const isZwiadowcaException = (u.Typ ?? '').toString().trim() === 'Civilian';
    if (!isZwiadowcaException && (unitEpoch > epoch || unitEpoch < epoch - 1)) continue;
    const nacja = (u.Nacja ?? '').toString().trim();
    if (!unitAllowedForCivNation(nacja, ctx.civUnitNacja)) continue;
    const zamiast = (u['W zamian za'] ?? '').toString().trim();
    const isReplacement = !isBlankReplacement(zamiast);
    if (isReplacement) {
      // Jednostka specjalna (zastepuje bazowa) — tylko gdy cyw ma wpis w bonusy[].
      if (!unitMatchesSpecialName(u.Jednostka, specTokens)) continue;
    } else if (specTokens.length > 0) {
      // Ukryj jednostke bazowa, gdy cyw ma specjalna wymiane tej samej roli.
      const replacedBySpec = data.units.some(su => {
        const sz = (su['W zamian za'] ?? '').toString().trim();
        if (isBlankReplacement(sz) || sz !== u.Jednostka) return false;
        return unitMatchesSpecialName(su.Jednostka, specTokens);
      });
      if (replacedBySpec) continue;
    }
    const tech = (u.Tech ?? '').toString().trim();
    // BUGFIX: blank-tech marker w units.json bywa zapisany jako '-' LUB '—'
    // (em dash) -- np. jednostki Specjalna/Super z pustym Tech (Hieros Lochos,
    // Evocati, Triari). Bez tej drugiej formy taka jednostka nigdy sie nie
    // pojawia w produkcji (szuka nieistniejacej technologii "—"). Uzgodnione
    // z isBlankReplacement(), ktora juz uznaje obie formy za puste.
    if (tech.length > 0 && tech !== '-' && tech !== '—' && !techs.has(tech)) continue;
    // Koszary gate (decyzja Maciej 2026-06-25): jednostki epoki Brazu wymagaja
    // wybudowanych Koszar (id='koszary') w miescie. Inne epoki bez zmian.
    // Ulepszenie Koszary->Akademia wojskowa usuwa 'koszary' z builtIds (fix #32) —
    // bramka akceptuje wiec tez budynek nadrzedny (ten sam wzorzec co przy
    // zelazo-access.ts dla odlewni), inaczej ulepszenie odbiera miastu Braz.
    if (epochNumber(u.Epoka) === 2 && !built.has('koszary')
      && !isBuildingSupersededByUpgrade('koszary', builtList, data.buildings)) continue;
    // R-BUDYNEK-PORTOWY-MIASTA-NADBRZEZNE (Maciej 2026-08-09): jednostki morskie (Typ='Naval',
    // np. Galera) wymagają, żeby TO miasto miało dostęp do wody (morze LUB rzeka) — ten sam
    // wzorzec co Koszary gate wyżej, ale bramkuje Typ jednostki, nie epokę. `ctx.cityHasCoastOrRiver`
    // liczone przez wołającego (main.ts `cityHasCoastOrRiverAccess`), patrz doc-komentarz w
    // AvailabilityContext.
    if ((u.Typ ?? '').toString().trim() === 'Naval' && !ctx.cityHasCoastOrRiver) continue;
    // R-JEDN-DOSTEP-BUG (fix 2026-07-24): units.json Surowiec = 'Brąz'/'Żelazo' (z diakrytykami);
    // porównania niżej są ASCII ('braz'/'zelazo'). Samo .toLowerCase() dawało 'brąz' !== 'braz'
    // -> bramka dostępu była MARTWA (jednostki brązowe/żelazne budowały się bez dostępu do surowca).
    // stripDiacritics() (NFD + lowercase) naprawia dopasowanie.
    const surowiec = stripDiacritics((u.Surowiec ?? '').toString().trim());
    // DOSTEP-SUROWCE-Q1 (2026-07-29): jednostki brązowe/żelazne — tylko zapas w magazynie państwa.
    if (surowiec === 'braz' && !empireStockHas(ctx.empireResourceStock, 'braz')) {
      continue;
    }
    if (surowiec === 'zelazo' && !empireStockHas(ctx.empireResourceStock, 'zelazo')) {
      continue;
    }
    // BUG-BRAMKA-DREWNO-BRAK (Maciej, decyzja A): jednostki drewniane — analogiczna
    // bramka do brązu/żelaza, tylko zapas w magazynie państwa. Bez progu startowego
    // (odrzucona opcja C) — świadome ryzyko blokady startu gry bez Drewna w zapasie.
    if (surowiec === 'drewno' && !empireStockHas(ctx.empireResourceStock, 'drewno')) {
      continue;
    }
    // Super-jednostka (audyt #11, decyzja A3=A): max 1 ŻYWA sztuka na cywilizację --
    // znika z listy produkcji dopóki egzemplarz danej nazwy żyje (respawn po śmierci
    // działa samoczynnie, bo aliveUnitTypeNames liczy się z bieżącego rosteru).
    if (u['Super-jednostka'] === 'TAK' && ctx.aliveUnitTypeNames?.has(u.Jednostka)) continue;
    const koszt = unitMoneyCost(
      itemCost('jednostka', u.Jednostka, data, 1),
      ctx.civBonusy,
      ctx.kosztJednostekPace,
      ownerId,
      difficulty,
    );
    items.push({
      kind: 'jednostka',
      id: u.Jednostka,
      nazwa: u.Jednostka,
      koszt,
    });
  }

  // buildings first, then cheapest first, then by name for determinism
  items.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'budynek' ? -1 : 1;
    if (a.koszt !== b.koszt) return a.koszt - b.koszt;
    return a.nazwa.localeCompare(b.nazwa);
  });

  return items;
}

// ---------------------------------------------------------------------------
// availableReplacementsFor — mechanizm "Zastąp" (ZASTAP-JEDNOSTKI-PLAN.md)
// ---------------------------------------------------------------------------

/**
 * Lista jednostek, którymi gracz może ZASTĄPIĆ `currentUnitName` (nie "awans" —
 * nawet słabsza jednostka tego samego `Typ` jest dopuszczalna).
 *
 * Lista = SUMA:
 *   A) wszystkie odblokowane TERAZ jednostki tego samego `Typ` (epoka/tech/nacja/
 *      koszary/braz-access — te same bramki co availableProduction), WŁĄCZNIE
 *      z jednostkami słabszymi od bieżącej (w przeciwieństwie do availableProduction
 *      ten krok NIE chowa jednostki bazowej gdy istnieje lepszy zamiennik cyw.).
 *   B) jeśli `currentUnitName` ma wypełnione pole "Zastąp specjalnie" w units.json —
 *      dokładnie TA jednostka, NAWET innego `Typ` (np. Wojownik tyrreński → Evocati),
 *      porównywana po pełnej nazwie `Jednostka` (bez fuzzy matchingu), również
 *      przefiltrowana epoka/tech/nacja/koszary/braz (musi być "dostępna TERAZ").
 *
 * Bieżąca jednostka jest zawsze wykluczona z wyniku (zastępowanie sobą nie ma sensu).
 *
 * Bramka koszary/braz-access jest per-miasto w produkcji. Zasięg akcji "Zastąp" =
 * całe terytorium gracza (decyzja właściciela, 2026-07-19), nie tylko heks miasta —
 * gdy jednostka stoi w garnizonie, `ctx` niesie dane TEGO miasta (jak w produkcji);
 * gdy stoi w polu (bez miasta pod nią), wołający (main.ts computeUnitReplacements /
 * replaceAvailabilityCtxEmpireWide) musi zbudować `ctx` jako "OR po wszystkich
 * miastach gracza" (unia builtBuildingIds), bo ta funkcja sama nie zna reszty miast.
 */
export function availableReplacementsFor(
  currentUnitName: string,
  data: ProductionData,
  unlockedTechs: readonly string[],
  ctx: AvailabilityContext = {},
): ProductionItem[] {
  const current = findUnit(data, currentUnitName);
  if (!current) return [];
  const currentTyp = (current.Typ ?? '').toString().trim();

  const epoch = Number.isFinite(ctx.epoch) ? (ctx.epoch as number) : 1;
  const builtList = ctx.builtBuildingIds ?? [];
  const built = new Set(builtList);
  const techs = new Set(unlockedTechs);
  const specTokens = civSpecialUnitNameTokens(ctx.civBonusy);
  const ownerId = ctx.ownerId ?? 0;
  const difficulty = ctx.difficulty ?? 'normal';

  /** Bramki wspólne dla A) i B): epoka/nacja/tech/koszary/braz-access. Sprawdza Typ TYLKO
   *  dla bramki wody Naval (R-BUDYNEK-PORTOWY-MIASTA-NADBRZEZNE) — poza tym nie rozstrzyga
   *  po Typ (to robi wołający, np. `utyp !== currentTyp` w pętli A) niżej). */
  function passesAvailabilityGates(u: UnitDef): boolean {
    if (epochNumber(u.Epoka) > epoch) return false;
    const nacja = (u.Nacja ?? '').toString().trim();
    if (!unitAllowedForCivNation(nacja, ctx.civUnitNacja)) return false;
    const tech = (u.Tech ?? '').toString().trim();
    // Blank-tech marker bywa '-' LUB '—' (em dash) -- patrz uwaga w availableProduction.
    if (tech.length > 0 && tech !== '-' && tech !== '—' && !techs.has(tech)) return false;
    // Koszary gate (decyzja Maciej 2026-06-25): jednostki epoki Brazu wymagaja Koszar.
    // Ulepszenie do Akademii wojskowej tez sie liczy (fix #32) — patrz uwaga w availableProduction.
    if (epochNumber(u.Epoka) === 2 && !built.has('koszary')
      && !isBuildingSupersededByUpgrade('koszary', builtList, data.buildings)) return false;
    // R-BUDYNEK-PORTOWY-MIASTA-NADBRZEZNE (Maciej 2026-08-09): identyczna bramka jak w
    // availableProduction — jednostka morska (Typ='Naval') wymaga dostępu do wody w TYM mieście.
    if ((u.Typ ?? '').toString().trim() === 'Naval' && !ctx.cityHasCoastOrRiver) return false;
    // R-JEDN-DOSTEP-BUG (fix 2026-07-24): units.json Surowiec = 'Brąz'/'Żelazo' (z diakrytykami);
    // porównania niżej są ASCII ('braz'/'zelazo'). Samo .toLowerCase() dawało 'brąz' !== 'braz'
    // -> bramka dostępu była MARTWA (jednostki brązowe/żelazne budowały się bez dostępu do surowca).
    // stripDiacritics() (NFD + lowercase) naprawia dopasowanie.
    const surowiec = stripDiacritics((u.Surowiec ?? '').toString().trim());
    if (surowiec === 'braz' && !empireStockHas(ctx.empireResourceStock, 'braz')) return false;
    if (surowiec === 'zelazo' && !empireStockHas(ctx.empireResourceStock, 'zelazo')) return false;
    // BUG-BRAMKA-DREWNO-BRAK (Maciej, decyzja A): ta sama bramka drewna co w availableProduction.
    if (surowiec === 'drewno' && !empireStockHas(ctx.empireResourceStock, 'drewno')) return false;
    // Super-jednostka (audyt #11, decyzja A3=A): "Zastąp" nie może dać drugiej żywej
    // sztuki -- ta sama bramka co availableProduction (aliveUnitTypeNames).
    if (u['Super-jednostka'] === 'TAK' && ctx.aliveUnitTypeNames?.has(u.Jednostka)) return false;
    return true;
  }

  function costOf(u: UnitDef): number {
    return unitMoneyCost(
      itemCost('jednostka', u.Jednostka, data, 1),
      ctx.civBonusy,
      ctx.kosztJednostekPace,
      ownerId,
      difficulty,
    );
  }

  const items: ProductionItem[] = [];
  const seen = new Set<string>();

  // --- A) wszystkie jednostki tego samego Typ, odblokowane teraz -------------
  for (const u of data.units) {
    if (u.Jednostka === currentUnitName) continue; // nie zastępuj sobą
    const utyp = (u.Typ ?? '').toString().trim();
    if (!utyp || utyp !== currentTyp) continue;
    if (!passesAvailabilityGates(u)) continue;
    // Reużyte 1:1 z availableProduction: jednostka "Specjalna" (W zamian za wypełnione)
    // pokazuje się TYLKO gdy cyw gracza ma dopasowany token w bonusy[] (civs.json).
    // Krok "chowaj jednostke bazowa gdy istnieje lepszy zamiennik cyw." jest CELOWO
    // POMINIĘTY (Zastąp ma pokazać też warianty słabsze -- inaczej niż w rekrutacji).
    const zamiast = (u['W zamian za'] ?? '').toString().trim();
    if (!isBlankReplacement(zamiast) && !unitMatchesSpecialName(u.Jednostka, specTokens)) continue;

    items.push({ kind: 'jednostka', id: u.Jednostka, nazwa: u.Jednostka, koszt: costOf(u) });
    seen.add(u.Jednostka);
  }

  // --- B) jednostka specjalna z pola "Zastąp specjalnie" (nawet inny Typ) ----
  const specialName = (current['Zastąp specjalnie'] ?? '').toString().trim();
  if (specialName && !isBlankReplacement(specialName)) {
    for (const rawName of specialName.split('/')) {
      const name = rawName.trim();
      if (!name || name === currentUnitName || seen.has(name)) continue;
      const specialUnit = findUnit(data, name);
      if (!specialUnit) continue;
      if (!passesAvailabilityGates(specialUnit)) continue;
      items.push({
        kind: 'jednostka',
        id: specialUnit.Jednostka,
        nazwa: specialUnit.Jednostka,
        koszt: costOf(specialUnit),
      });
      seen.add(specialUnit.Jednostka);
    }
  }

  items.sort((a, b) => {
    if (a.koszt !== b.koszt) return a.koszt - b.koszt;
    return a.nazwa.localeCompare(b.nazwa);
  });

  return items;
}

// ---------------------------------------------------------------------------
// Queue helpers (all immutable)
// ---------------------------------------------------------------------------

/** The item currently being built, or null when the queue is empty. */
export function frontItem(prod: CityProduction): ProductionItem | null {
  return prod.kolejka.length > 0 ? (prod.kolejka[0] as ProductionItem) : null;
}

/**
 * Tury do ukończenia pozycji o koszcie `koszt` przy dotychczasowym postępie `postep`
 * i stałym dopływie `praca` Pracy/turę. `null` gdy brak Pracy (praca <= 0) — nie da się
 * oszacować. Przeniesione z `cityPanel.ts` (P-ARMIA-PANEL-BRAK-INFO-PRODUKCJA-JEDNOSTEK,
 * Maciej 2026-08-16) — panel imperium (main.ts) potrzebuje tego samego wzoru dla mini-tabeli
 * "jednostka w produkcji" per miasto, więc formuła żyje raz, w warstwie silnika.
 * / EN: turns-to-complete for an item costing `koszt` given progress `postep` and a steady
 * `praca` Praca/turn. `null` when there is no Praca (praca <= 0) -- cannot estimate. Moved
 * from `cityPanel.ts` so the empire panel (main.ts) can reuse the exact same formula for its
 * per-city "unit in production" mini-table instead of re-deriving it.
 */
export function etaTurns(koszt: number, postep: number, praca: number): number | null {
  if (!(praca > 0)) return null;
  return Math.max(1, Math.ceil(Math.max(0, koszt - postep) / praca));
}

/**
 * Append `item` to the end of the queue.  Returns a new CityProduction; the
 * input is not mutated.  `postep` is preserved (work already done on the front
 * item is untouched).
 */
export function enqueue(prod: CityProduction, item: ProductionItem): CityProduction {
  // P-REKRUTACJA-JEDNOSTEK-TYLKO-SKARBIEC-Q1=B: jednostki mają osobną,
  // opłaconą kolejkę rekrutacji. Twarda bramka tutaj chroni także przyszłych
  // wywołujących przed przypadkowym powrotem jednostki do kolejki Pracy.
  if (item.kind !== 'budynek') {
    return {
      ...prod,
      kolejka: [...prod.kolejka],
      rekrutacja: prod.rekrutacja ? [...prod.rekrutacja] : undefined,
    };
  }
  return {
    kolejka: [...prod.kolejka, item],
    postep: prod.postep,
    wstrzymana: prod.wstrzymana,
    rekrutacja: prod.rekrutacja ? [...prod.rekrutacja] : undefined,
  };
}

export interface BuildQueueSanitizeResult {
  prod: CityProduction;
  /** Praca odzyskana z usuniętych, legacy jednostek. */
  refundedPraca: number;
}

/**
 * Migracja starych save'ów: jednostki zapisane dawniej w `kolejka` nie mogą
 * pozostać martwymi wpisami ani zostać ukończone za Pracę. Ich aktywny postęp
 * (front) i zbankowany postęp (pozycje oczekujące) wraca do puli Pracy
 * właściciela; budynki i osobna `rekrutacja` pozostają nietknięte.
 */
export function sanitizeBuildQueue(prod: CityProduction): BuildQueueSanitizeResult {
  const hasLegacyUnit = prod.kolejka.some(item => item.kind === 'jednostka');
  if (!hasLegacyUnit) {
    return {
      prod: {
        ...prod,
        kolejka: [...prod.kolejka],
        rekrutacja: prod.rekrutacja ? [...prod.rekrutacja] : undefined,
      },
      refundedPraca: 0,
    };
  }

  const refundedWaiting = prod.kolejka
    .slice(1)
    .filter(item => item.kind === 'jednostka')
    .reduce((sum, item) => sum + (Number.isFinite(item.postep) && item.postep! > 0 ? item.postep! : 0), 0);
  const frontIsLegacyUnit = prod.kolejka[0]?.kind === 'jednostka';
  const filtered = filterQueue(prod, item => item.kind === 'budynek');
  return {
    prod: {
      ...filtered.prod,
      rekrutacja: prod.rekrutacja ? [...prod.rekrutacja] : undefined,
    },
    refundedPraca: refundedWaiting + (frontIsLegacyUnit ? filtered.forfeitedPostep : 0),
  };
}

/**
 * Wspólny "core" zdejmowania frontu kolejki (index 0) -- używany przez
 * `dequeue`, `advanceProduction` i `rushProduction` (P-PROMOCJA-FRONT-RESET-
 * POSTEPU-Q1=B, RUNDA 2, naprawa B1: Evaluator znalazł że te trzy miejsca
 * zdejmowały front NIE czytając zbankowanego `ProductionItem.postep` nowego
 * frontu -- postęp bankowany przez `promoteToFront` był martwym polem,
 * bezpowrotnie nadpisywanym przy kolejnej promocji).
 *
 * Usuwa element na indeksie 0. Nowy front (dawny `kolejka[1]`, jeśli
 * istnieje) oddaje swój zbankowany `postep` (patrz `promoteToFront`) jako
 * zwracany scalar, PLUS `remainder` (nadwyżka Pracy z elementu, który właśnie
 * zszedł -- np. ukończenie za mniej Pracy niż accumulated w
 * `advanceProduction`, albo 0 gdy nie ma czego dokładać). Obie części to
 * realnie włożona Praca w RÓŻNE itemy -- sumowanie jest poprawne
 * arytmetycznie i nie przenosi postępu między itemami (ten sam niezmiennik
 * co w `promoteToFront`, patrz jego docstring).
 *
 * Niezmiennik: item na indeksie 0 zwróconej kolejki NIGDY nie ma
 * zdefiniowanego pola `postep` -- żyje wyłącznie w zwracanym scalarze (patrz
 * `promote-to-front-test.cjs`, asercja niezmiennika).
 * / EN: shared "core" of dropping the queue front (index 0) -- used by
 * `dequeue`, `advanceProduction` and `rushProduction` (round-2 fix for B1:
 * the Evaluator found these three sites dropped the front WITHOUT reading
 * the new front's banked `ProductionItem.postep` -- progress banked by
 * `promoteToFront` was a dead field, silently overwritten by the next
 * promotion).
 *
 * Removes the item at index 0. The new front (former `kolejka[1]`, if any)
 * hands back its banked `postep` (see `promoteToFront`) as the returned
 * scalar, PLUS `remainder` (leftover Praca from the item that just left --
 * e.g. finishing for less Praca than accumulated in `advanceProduction`, or
 * 0 when there is nothing to add). Both parts are genuinely-earned Praca on
 * DIFFERENT items -- summing them is arithmetically correct and never moves
 * progress between items (same invariant as `promoteToFront`, see its
 * docstring).
 *
 * Invariant: the item at index 0 of the returned queue NEVER carries a
 * defined `postep` field -- it lives solely in the returned scalar (see the
 * invariant assertion in `promote-to-front-test.cjs`).
 */
function dropFrontItem(
  kolejka: readonly ProductionItem[],
  remainder: number,
): { kolejka: ProductionItem[]; postep: number } {
  const rest = kolejka.slice(1);
  const nextFront = rest[0];
  const postep = (nextFront?.postep ?? 0) + remainder;
  if (nextFront && nextFront.postep !== undefined) {
    const { postep: _drop, ...clean } = nextFront;
    rest[0] = clean as ProductionItem;
  }
  return { kolejka: rest, postep };
}

/**
 * Remove the item at `index` (default 0, the front) from the queue.  Returns a
 * new CityProduction; the input is not mutated.
 *
 * Removing the front item (index 0) forfeits ITS OWN accumulated progress
 * (świadome anulowanie -- `remainder` przekazany do `dropFrontItem` to 0, w
 * przeciwieństwie do `advanceProduction`, gdzie front kończy się naturalnie
 * i nadwyżka Pracy jest realnie zarobiona). Nowy front NATOMIAST odzyskuje
 * SWÓJ WŁASNY zbankowany postęp (jeśli wcześniej był promowany i zdjęty z
 * powrotem przez `promoteToFront`) -- ta Praca należy do niego, nie do
 * anulowanego itemu, i jej ukrycie byłoby dokładnie tą samą klasą wycieku,
 * którą naprawia B1 (decyzja techniczna Operatora, runda 2: dequeue zostaje
 * przy kontrakcie "anulowany item traci SWÓJ postęp", ale przestaje po cichu
 * gubić postęp NASTĘPNEGO itemu). Removing any other index leaves the front
 * (and its `postep`) untouched. An out-of-range index is a no-op (returns a
 * shallow copy).
 * / EN: Removing the front item (index 0) forfeits ITS OWN accumulated
 * progress (a deliberate cancellation -- `remainder` passed to
 * `dropFrontItem` is 0, unlike `advanceProduction` where the front finishes
 * naturally and the leftover Praca is genuinely earned). The new front,
 * however, gets back ITS OWN banked progress (if it was previously promoted
 * and swapped back out by `promoteToFront`) -- that Praca belongs to it, not
 * to the cancelled item, and hiding it would be exactly the class of leak B1
 * fixes (Operator's technical call, round 2: dequeue keeps the "cancelled
 * item loses ITS OWN progress" contract, but stops silently losing the NEXT
 * item's progress). Removing any other index leaves the front (and its
 * `postep`) untouched. An out-of-range index is a no-op (returns a shallow
 * copy).
 */
export function dequeue(prod: CityProduction, index = 0): CityProduction {
  if (index < 0 || index >= prod.kolejka.length) {
    return {
      kolejka: [...prod.kolejka],
      postep: prod.postep,
      wstrzymana: prod.wstrzymana,
      rekrutacja: prod.rekrutacja ? [...prod.rekrutacja] : undefined,
    };
  }
  if (index === 0) {
    const dropped = dropFrontItem(prod.kolejka, 0);
    return {
      kolejka: dropped.kolejka,
      postep: dropped.postep,
      wstrzymana: prod.wstrzymana,
      rekrutacja: prod.rekrutacja ? [...prod.rekrutacja] : undefined,
    };
  }
  const kolejka = prod.kolejka.filter((_, i) => i !== index);
  return {
    kolejka,
    postep: prod.postep,
    wstrzymana: prod.wstrzymana,
    rekrutacja: prod.rekrutacja ? [...prod.rekrutacja] : undefined,
  };
}

/** Wynik `filterQueue()` -- patrz jego docstring. / EN: result of `filterQueue()`, see its docstring. */
export interface FilterQueueResult {
  prod: CityProduction;
  /**
   * Praca zbankowana na froncie (`prod.postep`), który sam filtr odrzucił --
   * 0 gdy front PRZETRWAŁ filtr (nic do oddania) albo nic nie miał
   * zbankowane. Wywołujący decyduje co z tym zrobić (np. dopisać do puli
   * Pracy imperium) -- ten moduł celowo nic nie wie o takiej puli.
   * / EN: Praca banked on the front (`prod.postep`) that the filter itself
   * rejected -- 0 when the front SURVIVED the filter (nothing to hand back)
   * or had nothing banked. The caller decides what to do with it (e.g. credit
   * an empire Praca pool) -- this module deliberately knows nothing about
   * such a pool.
   */
  forfeitedPostep: number;
}

/**
 * Usuń z kolejki każdy item, dla którego `keep` zwraca false (np. Cud, który
 * inna cywilizacja właśnie ukończyła -- wonderGateOk przechodzi na false).
 * Czysta/generyczna funkcja: predykat (i wszystko czego potrzebuje -- ownerId,
 * stan świata) to sprawa wywołującego; ten moduł nie wie nic o Cudach.
 *
 * Obsługa frontu (P-SANITIZE-POSTEP-TRANSFER-Q1=B, Maciej 2026-08-13): gdy
 * `keep` odrzuca AKTUALNY front (`kolejka[0]`), jego aktywny `prod.postep`
 * NIE przechodzi na to, co zostanie nowym frontem -- P-PROMOCJA-FRONT-RESET-
 * POSTEPU-Q1=B ustabilizowało niezmiennik, że postęp wraca WYŁĄCZNIE do TEGO
 * SAMEGO itemu, nigdy nie przeskakuje na inny. Zamiast tego wraca jako
 * `forfeitedPostep` scalar (ten sam wzorzec co `overflowToPool` w
 * `AdvanceProductionResult`) -- wywołujący sam bankuje go gdzie trzeba. Nowy
 * front (jeśli przetrwał `keep`) i tak odzyskuje WYŁĄCZNIE swój WŁASNY
 * zbankowany `ProductionItem.postep` -- logika dzielona z `dropFrontItem`
 * (ten sam kod co `dequeue(0)`), zero duplikacji.
 *
 * Jeśli front NIE jest usuwany (filtr odrzucił coś dalej w kolejce), postęp
 * jest całkiem nietknięty -- front kontynuuje jak wcześniej.
 * / EN: Drop every item from the queue for which `keep` returns false (e.g. a
 * Wonder another civ just finished -- wonderGateOk flips to false). Pure/
 * generic: the predicate (and everything it needs -- owner id, world state)
 * is the caller's job; this module knows nothing about Wonders.
 *
 * Front handling (P-SANITIZE-POSTEP-TRANSFER-Q1=B, Maciej 2026-08-13): when
 * `keep` rejects the CURRENT front (`kolejka[0]`), its active `prod.postep`
 * does NOT carry over to whatever becomes the new front --
 * P-PROMOCJA-FRONT-RESET-POSTEPU-Q1=B established the invariant that progress
 * only ever returns to the SAME item, never jumps to a different one. Instead
 * it comes back as the `forfeitedPostep` scalar (same pattern as
 * `overflowToPool` on `AdvanceProductionResult`) -- the caller banks it
 * wherever appropriate. The new front (if it survives `keep`) still gets back
 * ONLY its OWN banked `ProductionItem.postep` -- logic shared with
 * `dropFrontItem` (the same code `dequeue(0)` uses), zero duplication.
 *
 * If the front is NOT removed (the filter rejected something further down
 * the queue), progress is entirely untouched -- the front carries on as before.
 */
export function filterQueue(
  prod: CityProduction,
  keep: (item: ProductionItem) => boolean,
): FilterQueueResult {
  const kolejka = prod.kolejka.filter(keep);
  if (kolejka.length === prod.kolejka.length) {
    return { prod, forfeitedPostep: 0 };
  }
  const frontRemoved = prod.kolejka.length > 0 && !keep(prod.kolejka[0] as ProductionItem);
  if (!frontRemoved) {
    return {
      prod: { ...prod, kolejka },
      forfeitedPostep: 0,
    };
  }
  // `kolejka` już wyklucza stary front (odrzucony przez `keep`) plus każdy
  // inny nieważny item dalej w kolejce -- doklejenie jednorazowego elementu
  // na start pozwala `dropFrontItem` (jego `slice(1)`) ustawić resztę z
  // powrotem bez duplikowania jego logiki czyszczenia frontu.
  // EN: `kolejka` already excludes the old front (rejected by `keep`) plus
  // any other invalid item further down the queue -- padding a throwaway head
  // element lets `dropFrontItem` (its `slice(1)`) line the rest back up
  // without duplicating its front-clean logic.
  const dropped = dropFrontItem([prod.kolejka[0] as ProductionItem, ...kolejka], 0);
  const forfeitedPostep = Number.isFinite(prod.postep) && prod.postep > 0 ? prod.postep : 0;
  return {
    prod: { ...prod, kolejka: dropped.kolejka, postep: dropped.postep },
    forfeitedPostep,
  };
}

/**
 * Zamień pozycję kolejki oczekujących (`index` >= 1) miejscami z aktualnie
 * budowanym elementem (`index` 0) -- "podnieś na samą górę". Rozwiązuje
 * P-PRODUKCJA-BRAK-PROMOCJI-NA-GORE-KOLEJKI: strzałki ↑↓ przesuwają pozycje
 * WYŁĄCZNIE wewnątrz kolejki oczekujących (index >= 1, patrz moveQueueItem w
 * ui/cityPanel.ts), nigdy nie zamieniają z frontem.
 *
 * PRZENOSZENIE POSTĘPU PER-ITEM (P-PROMOCJA-FRONT-RESET-POSTEPU-Q1=B, decyzja
 * Macieja 2026-08-13 -- ODWRACA poprzednie zachowanie "reset do 0" opisane
 * niżej w historii tej funkcji): postęp już nie GINIE przy zamianie, tylko
 * jest BANKOWANY NA ITEMIE, który schodzi z frontu (`ProductionItem.postep`),
 * i PRZYWRACANY z itemu, który wchodzi na front (0, jeśli nigdy tam nie był).
 * Krok po kroku: (1) item schodzący z frontu (dawny `kolejka[0]`) dostaje
 * `postep: prod.postep` -- jego aktywny licznik jest teraz zbankowany na nim
 * samym; (2) item wchodzący na front (dawny `kolejka[index]`) oddaje swój
 * zbankowany `postep` (jeśli miał) jako nowy `prod.postep` i sam traci pole
 * `postep` (żyje teraz wyłącznie w `prod.postep`, nie dubluje się w obu
 * miejscach na raz).
 *
 * Exploit z ORYGINALNEGO uzasadnienia resetu ("zbierz Pracę na drogim
 * froncie [Cud, koszt 1000], dokończ tani element [koszt 10] za darmo")
 * NADAL jest zablokowany: postęp nigdy nie przeskakuje między RÓŻNYMI
 * itemami -- tani element, który nigdy wcześniej nie był na froncie, zawsze
 * startuje z zbankowanym 0, niezależnie ile Pracy zebrał Cud. Postęp wraca
 * WYŁĄCZNIE do TEGO SAMEGO itemu, gdy ten ponownie staje się frontem (patrz
 * testy 8-10 w tools/promote-to-front-test.cjs).
 *
 * Out-of-range `index` (< 1 lub >= kolejka.length) to no-op (shallow copy).
 * Nie-całkowity `index` (NaN, undefined, wartość ułamkowa) to TEŻ no-op --
 * bez `Number.isInteger` oba porównania `< 1` i `>= length` są `false` dla
 * NaN/undefined, guard przepuszcza, a `kolejka[NaN]` wstawia `undefined` na
 * front kolejki. Wzorzec spójny z `bindBuildQueueDragReorder` w
 * ui/cityPanel.ts (tam `Number.isFinite`).
 * / EN: Swap a waiting-queue position (`index` >= 1) with the currently
 * building front item (`index` 0) -- "promote to the very top". Fixes
 * P-PRODUKCJA-BRAK-PROMOCJI-NA-GORE-KOLEJKI: the ↑↓ arrows only reorder
 * WITHIN the waiting queue (index >= 1, see moveQueueItem in
 * ui/cityPanel.ts) and never swap with the front slot.
 *
 * PER-ITEM PROGRESS TRANSFER (P-PROMOCJA-FRONT-RESET-POSTEPU-Q1=B, Maciej's
 * decision 2026-08-13 -- REVERSES this function's previous "reset to 0"
 * behaviour, see its history): progress no longer VANISHES on swap, it is
 * BANKED on the item leaving the front (`ProductionItem.postep`) and
 * RESTORED from the item entering the front (0 if it was never there
 * before). Step by step: (1) the outgoing front item (old `kolejka[0]`)
 * gets `postep: prod.postep` -- its active counter is now banked on itself;
 * (2) the incoming front item (old `kolejka[index]`) hands back its own
 * banked `postep` (if any) as the new `prod.postep` and loses its own
 * `postep` field (it now lives solely in `prod.postep`, never duplicated in
 * both places).
 *
 * The exploit from the ORIGINAL reset's rationale ("farm Praca on an
 * expensive front item [a Wonder, cost 1000], finish a cheap item [cost 10]
 * for free") is STILL blocked: progress never jumps between DIFFERENT items
 * -- a cheap item that was never on the front before always starts banked at
 * 0, no matter how much Praca the Wonder accumulated. Progress only ever
 * returns to the SAME item once it becomes the front again (see tests 8-10
 * in tools/promote-to-front-test.cjs).
 *
 * An out-of-range `index` (< 1 or >= kolejka.length) is a no-op (shallow copy).
 * A non-integer `index` (NaN, undefined, fractional) is ALSO a no-op --
 * without `Number.isInteger`, both `< 1` and `>= length` are `false` for
 * NaN/undefined, so the guard would let it through and `kolejka[NaN]` would
 * splice `undefined` into the front slot. Pattern kept consistent with
 * `bindBuildQueueDragReorder` in ui/cityPanel.ts (which uses
 * `Number.isFinite`).
 */
export function promoteToFront(prod: CityProduction, index: number): CityProduction {
  if (!Number.isInteger(index) || index < 1 || index >= prod.kolejka.length) {
    return {
      kolejka: [...prod.kolejka],
      postep: prod.postep,
      wstrzymana: prod.wstrzymana,
      rekrutacja: prod.rekrutacja ? [...prod.rekrutacja] : undefined,
    };
  }
  const kolejka = [...prod.kolejka];
  const outgoing = kolejka[0] as ProductionItem; // schodzi z frontu / leaving the front
  const incoming = kolejka[index] as ProductionItem; // wchodzi na front / entering the front
  // Bankuj aktywny postęp NA itemie schodzącym z frontu (nie ginie, ale zostaje
  // PRZY NIM -- nie przeskakuje na inny item, patrz docstring wyżej). Kopia
  // przez spread (RUNDA 2, nota 1) zamiast ręcznego wymieniania pól -- nie
  // gubi cicho przyszłych pól ProductionItem.
  // EN: bank the active progress ON the outgoing item (not lost, but stays
  // WITH it -- never jumps to a different item, see docstring above). Spread
  // copy (round 2, note 1) instead of manually listing fields -- doesn't
  // silently drop future ProductionItem fields.
  kolejka[index] = { ...outgoing, postep: prod.postep };
  // Przywróć zbankowany postęp itemu wchodzącego na front i wyczyść jego pole
  // -- żyje teraz wyłącznie w zwracanym `postep` (scalar), bez duplikacji.
  // Destrukturyzacja odrzuca `postep`, reszta pól kopiowana przez spread.
  // EN: restore the incoming item's banked progress and clear its own field
  // -- it now lives solely in the returned `postep` scalar, no duplication.
  // Destructuring drops `postep`, the rest of the fields copy via spread.
  const { postep: _incomingPostep, ...incomingClean } = incoming;
  kolejka[0] = incomingClean;
  return {
    kolejka,
    postep: incoming.postep ?? 0,
    wstrzymana: prod.wstrzymana,
    rekrutacja: prod.rekrutacja ? [...prod.rekrutacja] : undefined,
  };
}

/**
 * Wstaw `item` na sam front kolejki, bankując NAJPIERW aktualny scalar
 * `prod.postep` na itemie, który przez to traci status frontu (dawny
 * `kolejka[0]`) -- ten sam wzorzec bankowania co `promoteToFront`/
 * `dropFrontItem`, tylko dla trzeciego call-site'u, który ręcznie manipuluje
 * frontem kolejki: `applyProductionCompleted` w main.ts (gałąź "brak
 * Manpower" -- P-PROMOCJA-FRONT-RESET-POSTEPU-Q1=B, RUNDA 3, naprawa B2).
 * Bez tego bankowania scalar `prod.postep` (należący do dawnego frontu, np.
 * Cudu, którego postęp `advanceProduction`/`dropFrontItem` właśnie
 * przywróciło) ginie bezpowrotnie, nadpisany przez `activePostep` (koszt
 * itemu wracającego na front, np. w pełni opłaconej jednostki czekającej na
 * wolny Manpower).
 *
 * Bankuje TYLKO gdy `prod.postep` jest skończoną liczbą > 0 -- inaczej nie
 * dopisuje pustego/zerowego pola `postep` na itemie (spójne z tym, że brak
 * pola = 0, patrz doc `ProductionItem.postep`). Pusta kolejka (nie ma komu
 * zbankować) to no-op na tym kroku -- `item` po prostu staje się jedynym
 * elementem.
 *
 * Niezmiennik zachowany: item na indeksie 0 zwróconej kolejki (`item`)
 * NIGDY nie ma zdefiniowanego pola `postep` -- żyje wyłącznie w zwracanym
 * scalarze `activePostep`.
 * / EN: Insert `item` at the very front of the queue, FIRST banking the
 * current `prod.postep` scalar on the item that thereby loses front status
 * (the former `kolejka[0]`) -- the same banking pattern as
 * `promoteToFront`/`dropFrontItem`, for the third call site that manually
 * manipulates the queue front: `applyProductionCompleted` in main.ts (the
 * "no Manpower" branch -- P-PROMOCJA-FRONT-RESET-POSTEPU-Q1=B, round 3, fix
 * for B2). Without this banking step, the `prod.postep` scalar (belonging to
 * the former front, e.g. a Wonder whose progress `advanceProduction`/
 * `dropFrontItem` just restored) is lost, silently overwritten by
 * `activePostep` (the cost of the item returning to the front, e.g. a
 * fully-paid unit waiting on free Manpower).
 *
 * Only banks when `prod.postep` is a finite number > 0 -- otherwise it does
 * not attach an empty/zero `postep` field to the item (consistent with
 * "field absent means 0", see the `ProductionItem.postep` doc). An empty
 * queue (nothing to bank onto) is a no-op at this step -- `item` simply
 * becomes the sole element.
 *
 * Invariant preserved: the item at index 0 of the returned queue (`item`)
 * NEVER carries a defined `postep` field -- it lives solely in the returned
 * `activePostep` scalar.
 */
export function insertAtFront(
  prod: CityProduction,
  item: ProductionItem,
  activePostep: number,
): CityProduction {
  // P-REKRUTACJA-JEDNOSTEK-TYLKO-SKARBIEC-Q1=B: nawet ścieżka
  // „odłóż z powodu braku Manpower” nie może odtworzyć jednostki w kolejce
  // finansowanej Pracą. Opłacona rekrutacja ma własny rekrutacja[].
  if (item.kind !== 'budynek') {
    return {
      ...prod,
      kolejka: [...prod.kolejka],
      rekrutacja: prod.rekrutacja ? [...prod.rekrutacja] : undefined,
    };
  }
  const kolejka = [...prod.kolejka];
  if (kolejka.length > 0 && Number.isFinite(prod.postep) && prod.postep > 0) {
    kolejka[0] = { ...(kolejka[0] as ProductionItem), postep: prod.postep };
  }
  // Egzekwuj niezmiennik z docstringa wyżej (RUNDA 5, N2): item wchodzący na
  // front NIGDY nie ma zdefiniowanego pola `postep`, nawet gdyby wywołujący
  // przekazał je przez pomyłkę -- destrukturyzacja jak w `promoteToFront`,
  // zamiast po prostu ufać wywołującemu. Dziś obie żywe ścieżki (main.ts)
  // wołają z itemem bez tego pola, więc to twarda gwarancja na przyszłość,
  // nie naprawa istniejącej regresji. / EN: enforce the invariant documented
  // above (round 5, N2): the item entering the front NEVER carries a defined
  // `postep`, even if a caller passed one by mistake -- destructuring, same
  // as `promoteToFront`, instead of just trusting the caller. Today both live
  // call sites (main.ts) pass an item without this field, so this is a
  // forward-looking guarantee, not a fix for an existing regression.
  const { postep: _incomingItemPostep, ...itemClean } = item;
  return {
    kolejka: [itemClean, ...kolejka],
    postep: activePostep,
    wstrzymana: prod.wstrzymana,
    rekrutacja: prod.rekrutacja ? [...prod.rekrutacja] : undefined,
  };
}

// ---------------------------------------------------------------------------
// advanceProduction
// ---------------------------------------------------------------------------

/** Result of one production tick. */
export interface AdvanceProductionResult {
  /** The new production state after applying this turn's Praca. */
  prod: CityProduction;
  /** The item finished this turn, or null when nothing completed. */
  completed: ProductionItem | null;
  /** Nadwyżka Pracy → pula ulepszeń cywilizacji (pusta kolejka lub reszta po ukończeniu). */
  overflowToPool?: number;
}

/**
 * Pour one turn of Praca into the city's queue.
 *
 * Adds `pracaPerTurn` to `postep`.  If the accumulated progress reaches the
 * front item's `koszt`, that item is completed: it is removed from the queue and
 * the leftover Praca (postep - koszt) is carried as the starting progress of the
 * next item.  At most ONE item completes per turn (a single turn's Praca is not
 * allowed to cascade through several queued items); any remainder beyond the
 * just-finished item is parked on the new front item's `postep` for next turn.
 *
 * Edge cases:
 *   - Empty queue            -> postep stays 0, completed = null; cała Praca tej tury
 *     idzie do overflowToPool (niewykorzystana część budynkowa → ulepszenia mapy).
 *   - Non-positive / NaN Praca -> treated as 0 (no progress, no completion).
 *   - Front item with koszt <= 0 -> completes immediately, carrying all postep.
 *   - Queue becomes empty after completion -> remainder is discarded (no item to
 *     hold it) and postep resets to 0.
 *
 * Pure: returns a fresh CityProduction; the input is never mutated.
 */
export function advanceProduction(
  prod: CityProduction,
  pracaPerTurn: number,
): AdvanceProductionResult {
  const front = frontItem(prod);

  // Paused (Wstrzymaj): keep queue + progress, add nothing this turn.
  if (prod.wstrzymana) {
    return { prod: { ...prod, kolejka: [...prod.kolejka] }, completed: null };
  }

  const praca = Number.isFinite(pracaPerTurn) && pracaPerTurn > 0 ? pracaPerTurn : 0;

  // Pusta kolejka: doBudynkow nie ma na co iść → całość na pulę ulepszeń (Maciej 2026-07-22).
  if (front === null) {
    return {
      prod: {
        kolejka: [],
        postep: 0,
        wstrzymana: prod.wstrzymana,
        rekrutacja: prod.rekrutacja ? [...prod.rekrutacja] : undefined,
      },
      completed: null,
      overflowToPool: praca > 0 ? praca : undefined,
    };
  }
  const accumulated = prod.postep + praca;
  const rqCopy = prod.rekrutacja ? [...prod.rekrutacja] : undefined;

  // Front item not finished yet -> just bank the progress.
  if (accumulated < front.koszt) {
    return {
      prod: { kolejka: [...prod.kolejka], postep: accumulated, wstrzymana: prod.wstrzymana, rekrutacja: rqCopy },
      completed: null,
    };
  }

  // Front item completes this turn.
  const remainder = accumulated - front.koszt;
  // RUNDA 2 (naprawa B1): dropFrontItem czyta zbankowany postep nowego frontu
  // (jeśli był wcześniej promowany i zdjęty) i dodaje remainder -- dawniej tu
  // był goły `rest.slice(1)` + `postep: remainder`, co po cichu gubiło
  // zbankowaną wartość nowego frontu (dominująca ścieżka powrotu na front:
  // naturalne dokończenie poprzedniego itemu).
  // EN: round-2 fix for B1: dropFrontItem reads the new front's banked
  // postep (if it was previously promoted and swapped out) and adds the
  // remainder -- this used to be a bare `rest.slice(1)` + `postep:
  // remainder`, silently losing the new front's banked value (the dominant
  // path back to the front: naturally finishing the previous item).
  const dropped = dropFrontItem(prod.kolejka, remainder);
  const rest = dropped.kolejka;
  if (rest.length > 0) {
    return {
      prod: { kolejka: rest, postep: dropped.postep, wstrzymana: prod.wstrzymana, rekrutacja: rqCopy },
      completed: front,
    };
  }

  return {
    prod: { kolejka: [], postep: 0, wstrzymana: prod.wstrzymana, rekrutacja: rqCopy },
    completed: front,
    overflowToPool: remainder > 0 ? remainder : undefined,
  };
}

// ---------------------------------------------------------------------------
// Wykup / Wstrzymaj / rekrutacja (UX helpers, pure)
// ---------------------------------------------------------------------------

/**
 * Population a completed item costs the city: a unit costs 1 citizen, a building
 * costs 0 (Schemat sec.8.1). The caller subtracts it from the city population
 * (clamped to a minimum of 1 -- this module does not see population).
 */
export const UNIT_POPULATION_COST = (miastoParams.jednostka_koszt_ludnosci?.wartosc as number) ?? 1;

/** Population cost of completing `item` (1 for a unit, 0 for a building). */
export function populationCostOf(item: ProductionItem): number {
  return item.kind === 'jednostka' ? UNIT_POPULATION_COST : 0;
}

/** Manpower cost of completing a unit at empire epoch (Zwiadowca = 0). */
export function manpowerCostOf(item: ProductionItem, epoka: number, maxMult = 1): number {
  return item.kind === 'jednostka' ? unitManpowerCostForType(item.id, epoka, maxMult) : 0;
}

/** Set/clear the Wstrzymaj (pause) flag. Returns a fresh CityProduction. */
export function setPaused(prod: CityProduction, paused: boolean): CityProduction {
  return {
    ...prod,
    kolejka: [...prod.kolejka],
    rekrutacja: prod.rekrutacja ? [...prod.rekrutacja] : undefined,
    wstrzymana: paused,
  };
}

// ---------------------------------------------------------------------------
// Rekrutacja (kolejka jednostek za Pieniadz)
// ---------------------------------------------------------------------------

/** Dodaj oplacona jednostke na koniec kolejki rekrutacji. */
export function enqueueRecruitment(prod: CityProduction, item: ProductionItem): CityProduction {
  if (item.kind !== 'jednostka') return prod;
  const rq = prod.rekrutacja ? [...prod.rekrutacja, item] : [item];
  return {
    kolejka: [...prod.kolejka],
    postep: prod.postep,
    wstrzymana: prod.wstrzymana,
    rekrutacja: rq,
  };
}

/** Usun pozycje z kolejki rekrutacji (bez zwrotu zlota — silnik/UI decyduje). */
export function dequeueRecruitment(prod: CityProduction, index: number): CityProduction {
  const rq = prod.rekrutacja ?? [];
  if (index < 0 || index >= rq.length) {
    return {
      kolejka: [...prod.kolejka],
      postep: prod.postep,
      wstrzymana: prod.wstrzymana,
      rekrutacja: rq.length ? [...rq] : undefined,
    };
  }
  const next = rq.filter((_, i) => i !== index);
  return {
    kolejka: [...prod.kolejka],
    postep: prod.postep,
    wstrzymana: prod.wstrzymana,
    rekrutacja: next.length ? next : undefined,
  };
}

export interface AdvanceRecruitmentResult {
  prod: CityProduction;
  /** Jednostki ukonczone w tej turze (max RECRUIT_UNITS_PER_TURN). */
  completed: ProductionItem[];
}

export interface AdvanceRecruitmentGatedResult extends AdvanceRecruitmentResult {
  population: number;
  manpower: number;
}

/**
 * Jak advanceRecruitment, ale nie zdejmuje z kolejki gdy brak Manpower (−kosztJednostki[epoka]).
 */
export function advanceRecruitmentGated(
  prod: CityProduction,
  city: Pick<import('./cities').City, 'population' | 'manpower'>,
  epoka: number,
  maxPerTurn = RECRUIT_UNITS_PER_TURN,
  /** true gdy koszt Manpower pobrano przy opłaceniu złotem (kolejka rekrutacji). */
  costAlreadyPaid = false,
): AdvanceRecruitmentGatedResult {
  let pop = city.population;
  let mp = cityManpowerCurrent(city, epoka);
  const rq = [...(prod.rekrutacja ?? [])];
  const completed: ProductionItem[] = [];
  let n = 0;
  while (n < maxPerTurn && rq.length > 0) {
    if (costAlreadyPaid) {
      completed.push(rq.shift()!);
      n++;
      continue;
    }
    const front = rq[0]!;
    const d = tryDeductUnitSpawnCosts(
      { population: pop, manpower: mp },
      epoka,
      UNIT_POPULATION_COST,
      1,
      front.id,
    );
    if (!d.ok) break;
    completed.push(rq.shift()!);
    pop = d.population;
    mp = d.manpower;
    n++;
  }
  return {
    prod: {
      kolejka: [...prod.kolejka],
      postep: prod.postep,
      wstrzymana: prod.wstrzymana,
      rekrutacja: rq.length ? rq : undefined,
    },
    completed,
    population: pop,
    manpower: mp,
  };
}

/**
 * Zdejmij z frontu kolejki rekrutacji max `maxPerTurn` jednostek (domyslnie 1).
 * Pure — bez spawnu na mapie (to robi silnik).
 */
export function advanceRecruitment(
  prod: CityProduction,
  maxPerTurn = RECRUIT_UNITS_PER_TURN,
): AdvanceRecruitmentResult {
  const rq = prod.rekrutacja ?? [];
  if (rq.length === 0 || maxPerTurn <= 0) {
    return {
      prod: {
        kolejka: [...prod.kolejka],
        postep: prod.postep,
        wstrzymana: prod.wstrzymana,
        rekrutacja: rq.length ? [...rq] : undefined,
      },
      completed: [],
    };
  }
  const n = Math.min(maxPerTurn, rq.length);
  const completed = rq.slice(0, n);
  const rest = rq.slice(n);
  return {
    prod: {
      kolejka: [...prod.kolejka],
      postep: prod.postep,
      wstrzymana: prod.wstrzymana,
      rekrutacja: rest.length ? rest : undefined,
    },
    completed,
  };
}

/**
 * Wykup cost: Pieniadz needed to finish the FRONT item instantly, at the
 * 1 Praca = 1 Pieniadz rate (Schemat sec.3.2): ceil(koszt - postep), never < 0.
 * Returns 0 when the queue is empty.
 */
export function rushCost(prod: CityProduction): number {
  const front = frontItem(prod);
  if (front === null) return 0;
  return Math.max(0, Math.ceil(front.koszt - prod.postep));
}

/**
 * Wykup: complete the FRONT item immediately regardless of accumulated Praca.
 * Same result shape as advanceProduction: new state (front removed; postep to
 * 0 gdy kolejka pusta, w przeciwnym razie zbankowany postęp nowego frontu --
 * RUNDA 2, naprawa B1, patrz `dropFrontItem`; pause flag preserved) + the
 * completed item (null when queue was empty). The caller spends rushCost()
 * Pieniadz and applies the completed item.
 * / EN: new state (front removed; postep 0 when the queue is empty,
 * otherwise the new front's banked progress -- round-2 fix for B1, see
 * `dropFrontItem`; pause flag preserved) + the completed item (null when the
 * queue was empty).
 */
export function rushProduction(prod: CityProduction): AdvanceProductionResult {
  const front = frontItem(prod);
  if (front === null) {
    return { prod: { ...prod, kolejka: [...prod.kolejka], postep: 0 }, completed: null };
  }
  const dropped = dropFrontItem(prod.kolejka, 0);
  return {
    prod: { ...prod, kolejka: dropped.kolejka, postep: dropped.postep },
    completed: front,
  };
}


// ---------------------------------------------------------------------------
// Q4 split Pracy + Q1 tryb kosztu jednostek (zawsze pieniadz) -- ADDYTYWNE
// ---------------------------------------------------------------------------

/**
 * R-PRACA-JEDEN-PODZIAL-Q1 — JEDEN podzial Pracy, stosowany DOKLADNIE RAZ.
 *
 * Praca miasta dzieli sie na DWA strumienie, ktore ZAWSZE sumuja sie do 100%:
 *   - `doBudynkow`     — kolejka produkcji TEGO miasta (procentBudynki, 50–100%);
 *   - `doPuli` — pula Pracy imperium (100 − procentBudynki, 0–50%).
 *
 * Cap: pula (czyli budzet ulepszen terenu) dostaje NAJWYZEJ 50%, budynki NIGDY
 * mniej niz 50% — wymusza to `clampPodzialPracyBudynkiPercent` w `cities.ts`
 * (MIN_PODZIAL_PRACY_BUDYNKI_PERCENT = 50). Nigdy odwrotnie.
 *
 * DLACZEGO `doPuli`, a nie `doUlepszen`: pula imperium jest wspolnym
 * bankiem prac cywilizacyjnych. Ulepszenia terenu sa jej glownym odbiorca, ale
 * z tej samej puli finansowane sa takze cuda na mapie (`wonder-map-build.ts`),
 * zakladanie miast, wycinka lasu, utrzymanie ulepszen surowcowych oraz baza
 * konwersji Targowiska (`economy.ts`). Nazwa `doUlepszen` dla tej liczby byla
 * ZRODLEM osmiu nawrotow tego tematu (patrz `cityPanel.ts` przed tym tematem)
 * — nie wolno jej przywracac.
 *
 * ZAOKRAGLENIE (regula jawna, bramka `praca-jeden-podzial-kontrakt-test.cjs`):
 * zaokraglamy TYLKO jedna strone (`doBudynkow = Math.round(total * u)`), druga
 * jest reszta `total - doBudynkow`. Dzieki temu suma jest z definicji rowna
 * calkowitej Pracy miasta — zero gubionych i zero zdublowanych jednostek
 * (niezalezne zaokraglanie obu stron dawalo floor(4.2)+floor(1.8)=5 != 6).
 * Konsekwencja: pojedyncza jednostka Pracy trafia do puli dopiero, gdy
 * `total * (100−procentBudynki)/100 >= 0.5`.
 *
 * USUNIETY DUPLIKAT: do 2026-08-25 ta sama Praca byla dzielona DRUGI RAZ przez
 * `splitEmpirePracaBudget()` (pula → ulepszenia vs „budzet budynkow imperium"),
 * a wynik drugiego podzialu wracal do kolejek budynkow przez
 * `allocateEmpirePracaToBuildings()`/`applyEmpireBuildingBudget()`. Zmierzony
 * skutek: przy domyslnych ustawieniach (70% budynki / 33% ulepszen) do ulepszen
 * trafialo DOKLADNIE 0 Pracy (floor(3 × 0,33) = 0), a przy maksymalnych suwakach
 * 20%, nie 50%. Obie funkcje zostaly USUNIETE — jest jeden podzial i jedno
 * miejsce jego zastosowania.
 */
/** Jedno zaokrąglenie Pracy miasta (po mnożnikach Porządku itd.) — silnik + UI. */
export function cityPracaInteger(raw: number): number {
  return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : 0;
}

export interface PodzialPracyMiasta {
  /** Praca miasta po zaokrągleniu = doBudynkow + doPuli (zawsze). */
  total: number;
  /** Kolejka produkcji TEGO miasta. */
  doBudynkow: number;
  /** Pula Pracy imperium — budżet ulepszeń terenu i pozostałych prac cywilizacji. */
  doPuli: number;
}

/**
 * JEDYNY podział Pracy miasta. `udzialBudynki` w [0,1] (= procentBudynki/100).
 * Nie wolno dodawać drugiego dzielenia tej samej Pracy w żadnej warstwie.
 */
export function splitPraca(cityPraca: number, udzialBudynki: number): PodzialPracyMiasta {
  const total = cityPracaInteger(cityPraca);
  const u = Math.min(1, Math.max(0, Number.isFinite(udzialBudynki) ? udzialBudynki : 1));
  const doBudynkow = Math.round(total * u);
  return { total, doBudynkow, doPuli: total - doBudynkow };
}

/**
 * Ile Pracy miasta trafia do puli imperium w tej turze, GDY kolejka nie jest
 * wstrzymana (wolajacy w main.ts pomija to wywolanie calkowicie pod warunkiem
 * `!prodPaused` — wstrzymana kolejka nie dostaje Pracy ANI do budynkow, ANI do
 * puli w tej turze, `pracaImperialPoolGain` nie jest wtedy w ogole wolane).
 *
 * Kolejka pusta (i NIE wstrzymana) → CALOSC Pracy miasta, bo udzial budynkowy
 * nie ma czego finansowac; inaczej dokladnie `doPuli` z jedynego podzialu.
 * To NIE jest drugi podzial — to jawny, nazwany wyjatek „brak legalnej kolejki".
 */
export function pracaImperialPoolGain(
  split: { doBudynkow: number; doPuli: number },
  queueEmpty: boolean,
): number {
  return queueEmpty ? split.doPuli + split.doBudynkow : split.doPuli;
}

/** Tick Pracy miasta do podglądu HUD (doBudynkow/doPuli z previewCityEconomy). */
export interface PracaSplitTick {
  doBudynkow: number;
  doPuli: number;
}

/**
 * Suma brutto Pracy trafiającej do puli imperium w tej turze (podgląd HUD).
 * Parytet z main.ts: pracaImperialPoolGain per miasto + pusta kolejka z cityProd.
 */
export function previewPracaPoolBrutto(
  ticks: ReadonlyArray<PracaSplitTick>,
  options: {
    queueEmpty: ReadonlyArray<boolean>;
    paused?: ReadonlyArray<boolean>;
  },
): number {
  let sum = 0;
  for (let i = 0; i < ticks.length; i++) {
    if (options.paused?.[i]) continue;
    const tk = ticks[i];
    if (!tk) continue;
    sum += pracaImperialPoolGain(
      { doBudynkow: tk.doBudynkow, doPuli: tk.doPuli },
      options.queueEmpty[i] ?? true,
    );
  }
  return sum;
}

/** Q1: tryb kosztu jednostki -- zawsze 'pieniadz' (zakup ze skarbca) we WSZYSTKICH epokach.
 *  Decyzja Maciej 2026-06-25: jeden surowiec przez cala gre; wyjątek epoki Kamien usunieto. */
export function unitCostMode(_def: UnitDef): 'praca' | 'pieniadz' {
  return 'pieniadz';
}

/** Koszt zakupu jednostki w Pieniadzu (skarb). Obejmuje wszystkie epoki lacznie z Kamieniem. */
export function unitPurchaseCost(
  def: UnitDef,
  civBonusy?: readonly CivBonusLite[],
  kosztJednostekPace?: KosztJednostekPace,
  ownerId = 0,
  difficulty: GameDifficulty = 'normal',
): number {
  return unitMoneyCost(unitCostFromDef(def), civBonusy, kosztJednostekPace, ownerId, difficulty);
}

/** Co miasto moze WYBUDOWAC w kolejce za Prace: TYLKO budynki.
 *  Wszystkie jednostki sa kupowane za Pieniadz (zakup) -- zadna nie trafia do kolejki Pracy.
 *  Decyzja Maciej 2026-06-25: usunieto wyjątek Kamien = za Prace. */
export function buildableProduction(city: City, data: ProductionData, unlockedTechs: readonly string[], ctx: AvailabilityContext = {}): ProductionItem[] {
  return availableProduction(city, data, unlockedTechs, ctx).filter(it => it.kind === 'budynek');
}

/** Jednostki do KUPIENIA za Pieniadz (skarb) -- WSZYSTKIE epoki, lacznie z Kamieniem.
 *  Decyzja Maciej 2026-06-25: koszt zawsze w Pieniadzu; brak wyjatku epoki Kamien. */
export function purchasableUnits(city: City, data: ProductionData, unlockedTechs: readonly string[], ctx: AvailabilityContext = {}): ProductionItem[] {
  return availableProduction(city, data, unlockedTechs, ctx).filter(it => it.kind === 'jednostka');
}

/** Etykieta epoki po numerze (buildings epokaWejscia). */
export const EPOCH_NUMBER_TO_NAME: Readonly<Record<number, string>> = {
  1: 'Kamień',
  2: 'Brąz',
  3: 'Żelazo',
};

export type BuildingCatalogStatus = 'ready' | 'locked' | 'built' | 'queued';

/** Wpis katalogu budynków bieżącej epoki (UI — pełna lista z blokadami). */
export interface BuildingCatalogEntry {
  id: string;
  nazwa: string;
  kategoria: string;
  koszt: number;
  status: BuildingCatalogStatus;
  /** Wymagana tech, której gracz jeszcze nie ma (pusta = brak wymogu tech). */
  missingTech: string;
  wymagania: string;
  /**
   * ADMIN-STOLICA: powód blokady z lokalizacji miasta (niezależny od tech) —
   * 'stolica' gdy budynek wymaga stolicy a miasto jest regionalne, 'region' gdy
   * odwrotnie. `undefined` = lokalizacja nie jest powodem blokady.
   */
  locationBlocked?: 'stolica' | 'region';
}

/**
 * Wszystkie budynki epoki `ctx.epoch` — także zablokowane (tech) i już wybudowane.
 * Kolejność: dostępne → zablokowane → w kolejce → wybudowane, alfabetycznie w grupie.
 */
export function eraBuildingCatalog(
  data: ProductionData,
  unlockedTechs: readonly string[],
  ctx: AvailabilityContext = {},
): BuildingCatalogEntry[] {
  const epoch = Number.isFinite(ctx.epoch) ? (ctx.epoch as number) : 1;
  const level = Number.isFinite(ctx.buildingLevel) ? (ctx.buildingLevel as number) : 1;
  const builtList = ctx.builtBuildingIds ?? [];
  const queue = ctx.productionQueue ?? [];
  const techs = new Set(unlockedTechs);
  const ownerId = ctx.ownerId ?? 0;
  const difficulty = ctx.difficulty ?? 'normal';
  const entries: BuildingCatalogEntry[] = [];

  for (const b of data.buildings) {
    if (b.epokaWejscia !== epoch) continue;
    if (isBuildingSuppressedFromProduction(b)) continue;
    // Palisada drewniana: tylko gdy miasto nie ma już kamiennych Murów/Cytadeli.
    if (b.id === 'palisada' && (builtList.includes('mury') || builtList.includes('fort'))) continue;

    const koszt = buildingWorkCost(
      itemCost('budynek', b.id, data, level),
      ctx.civBonusy,
      ctx.buildingCostPace,
      ownerId,
      difficulty,
    );
    const tech = (b.techUnlock ?? '').trim();
    // BUGFIX (ADMIN-STOLICA 2026-07-25): patrz uwaga w availableProduction — '-'/'—' są
    // blank-tech markery (Pałac I/II/III, Dom Starszyzny), nie nazwy realnej technologii.
    const techOk = tech.length === 0 || tech === '-' || tech === '—' || techs.has(tech);

    const locationOk = buildingLocationAllowed(b.lokalizacja, ctx.isCapital);
    // REGRESJA-KOLEJNOSC (2026-07-25 wieczor): eraBuildingCatalog liczy status wylacznie z
    // tech/lokalizacji -- budynek zablokowany WYLACZNIE brakujacym prerekwizytem miejskim
    // (CITY_BUILDING_PREREQ, np. Akademia bez Biblioteki) zostawal 'ready' mimo ze
    // availableProduction (buildableProduction) i tak go odrzuca -- znikal z panelu bez
    // zadnego komunikatu (ani na liscie "Dostepne", ani w "Jeszcze zablokowane", bo ta druga
    // sekcja pokazuje tylko status==='locked'). Ta sama luka istniala juz wczesniej dla
    // warsztat_oblezniczy/laznia_publiczna -- naprawiona tu raz dla wszystkich wpisow mapy.
    const prereqOk = cityBuildingPrereqMet(
      CITY_BUILDING_PREREQ[b.id], builtList, data.buildings, isBuildingSupersededByUpgrade,
    );
    // Koszt surowcowy = magazyn państwa (koszt_surowce) + bramka etykiety (DEPOSIT_LINKED = stock).
    const stockCost = buildingStockCost(b);
    const resourceOk = canAffordBuildingStock(ctx.empireResourceStock, stockCost)
      && buildingResourceGateMet(
        b,
        ctx.empireActiveResourceLabels,
        ctx.empireBuiltIds,
        ctx.empireResourceStock,
      );

    let status: BuildingCatalogStatus = 'ready';
    let locationBlocked: 'stolica' | 'region' | undefined;
    if (buildingTypeQueued(b.id, queue)) {
      status = 'queued';
    } else if (!b.wielokrotny && builtList.includes(b.id)) {
      status = 'built';
    } else if (!techOk) {
      status = 'locked';
    } else if (!locationOk) {
      status = 'locked';
      locationBlocked = b.lokalizacja;
    } else if (!prereqOk) {
      status = 'locked';
    } else if (!resourceOk) {
      status = 'locked';
    }

    entries.push({
      id: b.id,
      nazwa: b.nazwa,
      kategoria: b.kategoria,
      koszt,
      status,
      missingTech: !techOk ? tech : '',
      wymagania: (b.wymagania ?? '').trim(),
      locationBlocked,
    });
  }

  const rank: Record<BuildingCatalogStatus, number> = { ready: 0, locked: 1, queued: 2, built: 3 };
  entries.sort((a, b) => {
    if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
    return a.nazwa.localeCompare(b.nazwa, 'pl');
  });

  return entries;
}


// ---------------------------------------------------------------------------
// splitOutput -- per-city output split into 4 streams (ADDYTYWNE)
// ---------------------------------------------------------------------------

/**
 * Udzialy 4 strumieni outputu miasta. Kazdy udzial >= 0; nie musza sumowac sie
 * do 1 -- splitOutput normalizuje je wewnetrznie.
 */
export interface OutputShares {
  produkcja: number;
  pieniadz: number;
  nauka: number;
  rozwoj: number;
}

/**
 * Wynik podzialow outputu na 4 strumienie. Sumuje sie do `total` (ostatni
 * strumien bierze reszte z zaokraglenia zeby suma == total).
 */
export type OutputSplit = {
  produkcja: number;
  pieniadz: number;
  nauka: number;
  rozwoj: number;
};

/**
 * Domyslne udzialy z data/miasto-params.json.
 *   produkcja = 0.4, pieniadz = 0.3, nauka = 0.2, rozwoj = 0.1
 */
export const DEFAULT_OUTPUT_SHARES: Readonly<OutputShares> = Object.freeze({
  produkcja: (miastoParams.udzial_output_produkcja?.wartosc as number) ?? 0.4,
  pieniadz:  (miastoParams.udzial_output_pieniadz?.wartosc  as number) ?? 0.3,
  nauka:     (miastoParams.udzial_output_nauka?.wartosc     as number) ?? 0.2,
  rozwoj:    (miastoParams.udzial_output_rozwoj?.wartosc    as number) ?? 0.1,
});

/**
 * Podziel `total` outputu miasta na 4 strumienie wg udzialu.
 *
 * Algorytm:
 *   1. `total` ujemne / NaN / Infinity -> 0 (defensywnie).
 *   2. Udzialy sa normalizowane (przeskalowane do sumy 1). Jesli suma udzialow
 *      <= 0 lub NaN, calosc idzie do strumienia `produkcja` (fallback).
 *   3. Pierwsze 3 strumienie = Math.floor(total * share_i / sum).
 *      Ostatni strumien (rozwoj) bierze reszte: total - (produkcja + pieniadz + nauka).
 *      Dzieki temu suma zawsze == total (brak bledow zaokraglenia).
 *
 * PURE: wejscia nie sa mutowane, wynik zawsze nowy obiekt.
 *
 * @param total  - laczny output miasta (nieujemny; NaN/ujemne -> 0)
 * @param shares - opcjonalne udzialy; domyslnie DEFAULT_OUTPUT_SHARES
 * @returns OutputSplit sumujace sie do total
 */
export function splitOutput(total: number, shares?: OutputShares): OutputSplit {
  // Sanitize total
  const t = Number.isFinite(total) && total > 0 ? total : 0;

  if (t === 0) {
    return { produkcja: 0, pieniadz: 0, nauka: 0, rozwoj: 0 };
  }

  const s = shares ?? DEFAULT_OUTPUT_SHARES;

  const rP  = Number.isFinite(s.produkcja) && s.produkcja >= 0 ? s.produkcja : 0;
  const rPi = Number.isFinite(s.pieniadz)  && s.pieniadz  >= 0 ? s.pieniadz  : 0;
  const rN  = Number.isFinite(s.nauka)     && s.nauka     >= 0 ? s.nauka     : 0;
  const rR  = Number.isFinite(s.rozwoj)    && s.rozwoj    >= 0 ? s.rozwoj    : 0;

  const sum = rP + rPi + rN + rR;

  // Fallback: wszystkie 0 -> calosc do produkcja
  if (sum <= 0) {
    return { produkcja: t, pieniadz: 0, nauka: 0, rozwoj: 0 };
  }

  // Normalizuj i oblicz (floor dla pierwszych 3, reszta dla ostatniego)
  const produkcja = Math.floor(t * rP  / sum);
  const pieniadz  = Math.floor(t * rPi / sum);
  const nauka     = Math.floor(t * rN  / sum);
  const rozwoj    = t - produkcja - pieniadz - nauka; // bierze reszte

  return { produkcja, pieniadz, nauka, rozwoj };
}

/**
 * Czesc outputu miasta trafajaca do strumienia NAUKA.
 * Helper dla agregacji EKONOMIA (per-miasto -> globalna suma).
 */
export function cityScienceOutput(total: number, shares?: OutputShares): number {
  return splitOutput(total, shares).nauka;
}

/**
 * Czesc outputu miasta trafajaca do strumienia PIENIADZ.
 * Helper dla agregacji EKONOMIA (per-miasto -> globalna suma).
 */
export function cityMoneyOutput(total: number, shares?: OutputShares): number {
  return splitOutput(total, shares).pieniadz;
}
