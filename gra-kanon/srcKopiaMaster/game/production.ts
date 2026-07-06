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
import { buildingCostAfterCivDiscount } from './civ-bonuses';
import { unitManpowerCost, tryDeductUnitSpawnCosts, cityManpowerCurrent } from './manpower';
import {
  empireHasPopalniaBrazu,
  hasBrazAccess,
  PIEC_HUTNICZY_BUILDING_ID,
} from './braz-access';
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
 */
export function buildingLevelForEpoch(
  epokaWejscia: number,
  cityEpoch: number,
  maksPoziom: number,
): number {
  const lvl = Math.floor(cityEpoch) - Math.floor(epokaWejscia) + 1;
  const cap = Number.isFinite(maksPoziom) && maksPoziom > 0 ? Math.floor(maksPoziom) : 1;
  return Math.max(1, Math.min(cap, lvl));
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
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return raw;
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
): ProductionItem | null {
  const b = findBuilding(data, id);
  if (!b) return null;
  return {
    kind: 'budynek',
    id: b.id,
    nazwa: b.nazwa,
    koszt: buildingCostAfterCivDiscount(
      itemCost('budynek', b.id, data, level),
      civBonusy,
    ),
  };
}

/**
 * Build a ProductionItem for a unit (by its Jednostka name).
 * Returns null when the unit name is unknown.
 */
export function unitProductionItem(id: string, data: ProductionData): ProductionItem | null {
  const u = findUnit(data, id);
  if (!u) return null;
  return {
    kind: 'jednostka',
    id: u.Jednostka,
    nazwa: u.Jednostka,
    koszt: itemCost('jednostka', u.Jednostka, data, 1),
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
}

/** Minimalny ksztalt bonusy[] — bez importu economy (unikamy cyklu z production). */
export interface CivBonusLite {
  typ: string;
  cel: string;
  wartosc: number | string;
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

/** Tokeny nazw jednostek specjalnych z bonusy[] typ=jednostka_specjalna. */
export function civSpecialUnitNameTokens(
  bonusy: readonly CivBonusLite[] | undefined,
): string[] {
  if (!bonusy?.length) return [];
  const tokens: string[] = [];
  for (const b of bonusy) {
    if (b.typ !== 'jednostka_specjalna') continue;
    const raw = String(b.wartosc ?? '').trim();
    if (!raw) continue;
    for (const part of raw.split('/')) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      tokens.push(trimmed);
      const primary = trimmed.split('(')[0]?.trim();
      if (primary && primary !== trimmed) tokens.push(primary);
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
      && !empireHasPopalniaBrazu(ctx.placedImprovements)) {
      continue;
    }
    items.push({
      kind: 'budynek',
      id: b.id,
      nazwa: upgradeProductionDisplayName(b, data.buildings),
      koszt: buildingCostAfterCivDiscount(
        itemCost('budynek', b.id, data, level),
        ctx.civBonusy,
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
    if (tech.length > 0 && tech !== '-' && !techs.has(tech)) continue;
    // Koszary gate (decyzja Maciej 2026-06-25): jednostki epoki Brazu wymagaja
    // wybudowanych Koszar (id='koszary') w miescie. Inne epoki bez zmian.
    if (epochNumber(u.Epoka) === 2 && !built.has('koszary')) continue;
    const surowiec = (u.Surowiec ?? '').toString().trim().toLowerCase();
    if (surowiec === 'braz'
      && !hasBrazAccess(ctx.placedImprovements, builtList)) {
      continue;
    }
    let koszt = itemCost('jednostka', u.Jednostka, data, 1);
    const recDisc = civRecruitmentDiscount(ctx.civBonusy);
    if (recDisc > 0) {
      koszt = Math.max(1, Math.floor(koszt * (1 - recDisc)));
    }
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
 *   - Empty queue            -> postep stays 0, completed = null.
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

  // Nothing to build -> no progress.
  if (front === null) {
    return {
      prod: {
        kolejka: [],
        postep: 0,
        wstrzymana: prod.wstrzymana,
        rekrutacja: prod.rekrutacja ? [...prod.rekrutacja] : undefined,
      },
      completed: null,
    };
  }

  const praca = Number.isFinite(pracaPerTurn) && pracaPerTurn > 0 ? pracaPerTurn : 0;
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
  const carry = rest.length > 0 ? remainder : 0;

  return {
    prod: { kolejka: rest, postep: carry, wstrzymana: prod.wstrzymana, rekrutacja: rqCopy },
    completed: front,
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

/** Manpower cost of completing a unit at empire epoch (10% slotu manpower w epoce). */
export function manpowerCostOf(item: ProductionItem, epoka: number): number {
  return item.kind === 'jednostka' ? unitManpowerCost(epoka) : 0;
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
): AdvanceRecruitmentGatedResult {
  let pop = city.population;
  let mp = cityManpowerCurrent(city, epoka);
  const rq = [...(prod.rekrutacja ?? [])];
  const completed: ProductionItem[] = [];
  let n = 0;
  while (n < maxPerTurn && rq.length > 0) {
    const d = tryDeductUnitSpawnCosts({ population: pop, manpower: mp }, epoka, UNIT_POPULATION_COST);
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

/** Q4: podzial Pracy miasta na kolejke budynkow vs ulepszenia terenu. udzialBudynki w [0,1]. */
export function splitPraca(cityPraca: number, udzialBudynki: number): { doBudynkow: number; doPuli: number } {
  const praca = Number.isFinite(cityPraca) && cityPraca > 0 ? cityPraca : 0;
  const u = Math.min(1, Math.max(0, Number.isFinite(udzialBudynki) ? udzialBudynki : 1));
  const doBudynkow = praca * u;
  return { doBudynkow, doPuli: praca - doBudynkow };
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
): number {
  let koszt = unitCostFromDef(def);
  const recDisc = civRecruitmentDiscount(civBonusy);
  if (recDisc > 0) {
    koszt = Math.max(1, Math.floor(koszt * (1 - recDisc)));
  }
  return koszt;
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
  const entries: BuildingCatalogEntry[] = [];

  for (const b of data.buildings) {
    if (b.epokaWejscia !== epoch) continue;

    const koszt = buildingCostAfterCivDiscount(
      itemCost('budynek', b.id, data, level),
      ctx.civBonusy,
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
