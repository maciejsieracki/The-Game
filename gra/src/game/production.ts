/**
 * production.ts
 * City PRODUCTION QUEUE -- pure logic (task A2).
 *
 * A city builds units and buildings.  Each turn it pours its Praca (production
 * output, see game/turn-economy.ts) into the item at the FRONT of its queue.
 * When the accumulated Praca reaches that item's cost, the item is produced:
 * it is popped off the queue and any leftover Praca is carried onto the next
 * item.
 *
 * Pure logic -- no DOM, no THREE, no I/O, no global state, no mutation of the
 * inputs.  Every function returns fresh values, which makes the module directly
 * unit-testable (see tools/logic-test.cjs).
 *
 * Design (PROJEKT-GRY-master.md sec.8, sec.8e):
 *   - Building cost          : kosztBudowy * 1.10^(level-1)  (compound, decyzja Naster; przyrostKosztu legacy)
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
  empireHasKopalniaMiedzi,
  hasBrazAccess,
  PIEC_HUTNICZY_BUILDING_ID,
} from './braz-access';
import { hasZelazoAccess } from './zelazo-access';
import {
  buildingResourceGateMet,
  CITY_BUILDING_PREREQ,
  WATER_ACCESS_BUILDING_IDS,
} from './building-resource-gate';
import {
  isBuildingSuppressedFromProduction,
  upgradeProductionDisplayName,
} from './building-upgrades';
import miastoParams from '../../data/miasto-params.json';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** What kind of thing a city can produce. */
export type ProductionKind = 'budynek' | 'jednostka';

/**
 * A single entry sitting in a city's production queue.
 *
 *   kind  : 'budynek' for a building, 'jednostka' for a unit.
 *   id    : stable identifier -- a building's `id`, or a unit's `Jednostka`
 *           name (units have no separate id field in units.json).
 *   nazwa : human-readable display name.
 *   koszt : total Praca required to complete it (computed via itemCost()).
 */
export type ProductionItem = {
  kind: ProductionKind;
  id: string;
  nazwa: string;
  koszt: number;
};

/**
 * A city's production state.
 *
 *   kolejka : ordered queue; index 0 is the item currently being built.
 *   postep  : Praca accumulated so far on the FRONT item only (resets to the
 *             carried remainder each time an item completes).
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
// Building level + compound scaling
// ---------------------------------------------------------------------------

/**
 * Compound growth factor per building level (decyzja Naster): a building gains
 * one level per epoch and every stat -- and its build cost -- grows +10% each
 * level, compounded.  Replaces the legacy linear `przyrost` / `przyrostKosztu`.
 */
export const BUILDING_LEVEL_FACTOR = (miastoParams.budynek_mnoznik_poziomu?.wartosc as number) ?? 1.10;

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

/** Compound-scaled value of a building base stat at `level`: baza * 1.10^(level-1). */
export function buildingEffectAtLevel(baza: number, level: number): number {
  const n = Math.max(1, Math.floor(level));
  return baza * Math.pow(BUILDING_LEVEL_FACTOR, n - 1);
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
 *   building : kosztBudowy * 1.10^(level - 1)  (compound; przyrostKosztu legacy)
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
    return Math.round(b.kosztBudowy * Math.pow(BUILDING_LEVEL_FACTOR, level - 1));
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
   */
  cityHasCoastOrRiver?: boolean;
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
  const afterGlobal = Math.max(1, Math.round(afterPace * GLOBAL_BUILDING_PROD_MULT));
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
  return applyDifficultyCostMultiplier(afterPace, ownerId, difficulty);
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
  return next;
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

    const upgradeFrom = (b.upgradeFrom ?? '').trim();
    if (upgradeFrom.length > 0) {
      if (!builtList.includes(upgradeFrom)) continue;
      if (buildingTypeCommitted(b.id, builtList, queue)) continue;
    } else {
      if (isBuildingSupersededByUpgrade(b.id, builtList, data.buildings)) continue;
      if (buildingTypeCommitted(b.id, builtList, queue)) continue;
    }

    const tech = (b.techUnlock ?? '').trim();
    if (tech.length > 0 && !techs.has(tech)) continue;
    if (b.id === PIEC_HUTNICZY_BUILDING_ID
      && !empireHasKopalniaMiedzi(ctx.placedImprovements)) {
      continue;
    }
    const gateLabels = ctx.empireActiveResourceLabels?.length
      ? ctx.empireActiveResourceLabels
      : ctx.activeResourceLabels;
    if (!buildingResourceGateMet(b, gateLabels, ctx.empireBuiltIds, ctx.empireResourceStock)) {
      continue;
    }
    // TEMAT 8 Q2 (2026-07-24): budynek wymaga innego budynku W TYM MIEŚCIE (np. Warsztat
    // oblężniczy → Koszary, Łaźnia publiczna → Studnia). Akceptuje też upgrade prerekwizytu
    // (np. Koszary→Akademia wojskowa), ten sam wzorzec co bramka Koszar dla jednostek epoki
    // Brązu niżej — inaczej upgrade odbierałby miastu już zdobyte prawo budowy.
    const cityPrereq = CITY_BUILDING_PREREQ[b.id];
    if (cityPrereq && !builtList.includes(cityPrereq)
      && !isBuildingSupersededByUpgrade(cityPrereq, builtList, data.buildings)) {
      continue;
    }
    // TEMAT 8 Q2: Port/Port wielki wymagają wybrzeża LUB rzeki w zasięgu TEGO miasta.
    if (WATER_ACCESS_BUILDING_IDS.has(b.id) && !ctx.cityHasCoastOrRiver) {
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
    if (epochNumber(u.Epoka) > epoch) continue;
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
    // R-JEDN-DOSTEP-BUG (fix 2026-07-24): units.json Surowiec = 'Brąz'/'Żelazo' (z diakrytykami);
    // porównania niżej są ASCII ('braz'/'zelazo'). Samo .toLowerCase() dawało 'brąz' !== 'braz'
    // -> bramka dostępu była MARTWA (jednostki brązowe/żelazne budowały się bez dostępu do surowca).
    // stripDiacritics() (NFD + lowercase) naprawia dopasowanie.
    const surowiec = stripDiacritics((u.Surowiec ?? '').toString().trim());
    if (surowiec === 'braz'
      && !hasBrazAccess(ctx.placedImprovements, builtList)) {
      continue;
    }
    if (surowiec === 'zelazo'
      && !hasZelazoAccess(ctx.hasKopalniaNaZlozuZelaza, builtList)) {
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

  /** Bramki wspólne dla A) i B): epoka/nacja/tech/koszary/braz-access. Nie sprawdza Typ. */
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
    // R-JEDN-DOSTEP-BUG (fix 2026-07-24): units.json Surowiec = 'Brąz'/'Żelazo' (z diakrytykami);
    // porównania niżej są ASCII ('braz'/'zelazo'). Samo .toLowerCase() dawało 'brąz' !== 'braz'
    // -> bramka dostępu była MARTWA (jednostki brązowe/żelazne budowały się bez dostępu do surowca).
    // stripDiacritics() (NFD + lowercase) naprawia dopasowanie.
    const surowiec = stripDiacritics((u.Surowiec ?? '').toString().trim());
    if (surowiec === 'braz' && !hasBrazAccess(ctx.placedImprovements, builtList)) return false;
    if (surowiec === 'zelazo'
      && !hasZelazoAccess(ctx.hasKopalniaNaZlozuZelaza, builtList)) return false;
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
 * Append `item` to the end of the queue.  Returns a new CityProduction; the
 * input is not mutated.  `postep` is preserved (work already done on the front
 * item is untouched).
 */
export function enqueue(prod: CityProduction, item: ProductionItem): CityProduction {
  return {
    kolejka: [...prod.kolejka, item],
    postep: prod.postep,
    wstrzymana: prod.wstrzymana,
    rekrutacja: prod.rekrutacja ? [...prod.rekrutacja] : undefined,
  };
}

/**
 * Remove the item at `index` (default 0, the front) from the queue.  Returns a
 * new CityProduction; the input is not mutated.  Removing the front item resets
 * `postep` to 0 (accumulated work belonged to that item); removing any other
 * index leaves `postep` unchanged.  An out-of-range index is a no-op (returns a
 * shallow copy).
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
  const kolejka = prod.kolejka.filter((_, i) => i !== index);
  return {
    kolejka,
    postep: index === 0 ? 0 : prod.postep,
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
  const rest = prod.kolejka.slice(1);
  if (rest.length > 0) {
    return {
      prod: { kolejka: rest, postep: remainder, wstrzymana: prod.wstrzymana, rekrutacja: rqCopy },
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
 * Same result shape as advanceProduction: new state (front removed, postep reset
 * to 0, pause flag preserved) + the completed item (null when queue was empty).
 * The caller spends rushCost() Pieniadz and applies the completed item.
 */
export function rushProduction(prod: CityProduction): AdvanceProductionResult {
  const front = frontItem(prod);
  if (front === null) {
    return { prod: { ...prod, kolejka: [...prod.kolejka], postep: 0 }, completed: null };
  }
  return {
    prod: { ...prod, kolejka: prod.kolejka.slice(1), postep: 0 },
    completed: front,
  };
}


// ---------------------------------------------------------------------------
// Q4 split Pracy + Q1 tryb kosztu jednostek (zawsze pieniadz) -- ADDYTYWNE
// ---------------------------------------------------------------------------

/**
 * Q4: podzial Pracy miasta na kolejke budynkow vs ulepszenia terenu (pula imperium).
 * udzialBudynki w [0,1].
 *
 * BUGFIX 2026-07-10 (Praca ginie przy zaokragleniu): Praca miasta jest calkowita
 * (np. 6), ale `cityPraca * udzialBudynki` daje z reguly ulamek (np. 6*0.7=4.2).
 * Zaokraglanie OBU stron NIEZALEZNIE (floor/round kazdej z osobna) potrafi zgubic
 * lub zdublowac 1 jednostke Pracy (np. floor(4.2)=4 + floor(1.8)=1 => suma 5 != 6;
 * przy remisie .5/.5 round+round moze dac sume+1). Naprawa: zaokraglamy TYLKO
 * jedna strone (doBudynkow), druga to `total - doBudynkow` -- z definicji suma
 * zawsze rowna sie calkowitej Pracy miasta. Ten sam wynik zasila silnik
 * (turn-economy.ts, real stan gry) i UI (cityPanel.ts, empireDetailPanel.ts,
 * gorny pasek) -- jedno zrodlo prawdy, zero gubionych jednostek.
 */
/** Jedno zaokrąglenie Pracy miasta (po mnożnikach Porządku itd.) — silnik + UI. */
export function cityPracaInteger(raw: number): number {
  return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : 0;
}

export function splitPraca(cityPraca: number, udzialBudynki: number): { doBudynkow: number; doPuli: number } {
  const total = cityPracaInteger(cityPraca);
  const u = Math.min(1, Math.max(0, Number.isFinite(udzialBudynki) ? udzialBudynki : 1));
  const doBudynkow = Math.round(total * u);
  return { doBudynkow, doPuli: total - doBudynkow };
}

/**
 * Ile Pracy miasta trafia do puli imperium w tej turze.
 * Kolejka pusta → całość (doPuli + niewykorzystane doBudynkow); inaczej tylko doPuli.
 */
export function pracaImperialPoolGain(
  split: { doBudynkow: number; doPuli: number },
  queueEmpty: boolean,
): number {
  return queueEmpty ? split.doPuli + split.doBudynkow : split.doPuli;
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

    const koszt = buildingWorkCost(
      itemCost('budynek', b.id, data, level),
      ctx.civBonusy,
      ctx.buildingCostPace,
      ownerId,
      difficulty,
    );
    const tech = (b.techUnlock ?? '').trim();
    const techOk = tech.length === 0 || techs.has(tech);

    let status: BuildingCatalogStatus = 'ready';
    if (buildingTypeQueued(b.id, queue)) {
      status = 'queued';
    } else if (!b.wielokrotny && builtList.includes(b.id)) {
      status = 'built';
    } else if (!techOk) {
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
