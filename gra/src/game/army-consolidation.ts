/**
 * R-WEB-ARMY-CONSOLIDATION-Q1 -- scalanie wojsk polowych AI w duze armie.
 *
 * Flaga `ARMY_CONSOLIDATION_ENABLED` (wydanie robocze nr 6: DEFAULT=true; OFF = zachowanie jak baza). Gdy OFF, zadna
 * sciezka w ai.ts nie korzysta z tego modulu, wiec wynik gry jest identyczny z baza.
 *
 * Modul jest CZYSTY i deterministyczny: zero RNG, zero dostepu do stanu gry. Wszystkie
 * wartosci balansowe sa w `gra/data/army-consolidation-params.json`.
 *
 * Reguly (dispatch R-WEB-ARMY-CONSOLIDATION-Q1):
 *  - POKOJ (R-B, R-D): jednostki polowe (nie garnizon, nie w misji) maszeruja do stolicy
 *    (`pickRallyCity`) i scalaja sie tam do limitu `maxPerHex`; gdy stolica pelna lub poza
 *    zasiegiem, do najblizszego miasta z puli (`buildRallyCandidates`).
 *  - OBRONA DOMU: zagrozenie dostaje kworum `groupSize` jednostek (`assignHomeDefenders`
 *    z parametrem grupy w ai.ts), zamiast jednej jednostki.
 *  - WOJNA (R-C): liczba armii = liczba wojen, min 1 (`warArmyCount`); jednostki dzielone
 *    na armie zrownowazone (`splitIntoWarArmies`), kazda armia dostaje cele jednej wojny.
 */

import consolidationParamsRaw from '../../data/army-consolidation-params.json';
import { hexDistance, keyOf } from '../units/setup';

/** GLOWNA FLAGA (tymczasowa zasada -- latwa do wylaczenia jedna zmiana). */
export const ARMY_CONSOLIDATION_ENABLED = true;

let flagOverride: boolean | null = null;

/** Test/diagnostyka: nadpisanie flagi (null = wartosc domyslna). */
export function setArmyConsolidationOverride(value: boolean | null): void {
  flagOverride = value;
}

export function isArmyConsolidationEnabled(): boolean {
  return flagOverride ?? ARMY_CONSOLIDATION_ENABLED;
}

/** Parametry z JSON (kazdy klucz ma pole `wartosc`). */
export const ARMY_CONSOLIDATION_MAX_PER_HEX: number = consolidationParamsRaw.rally_hex_max_units.wartosc;
export const ARMY_CONSOLIDATION_HOME_GROUP_SIZE: number = consolidationParamsRaw.home_defense_group_size.wartosc;
export const ARMY_CONSOLIDATION_RALLY_SEARCH_HEX: number = consolidationParamsRaw.rally_search_hex.wartosc;

export interface ConsolidationUnit {
  id: string;
  q: number;
  r: number;
  ruchLeft: number;
}

export interface RallyCityRef {
  id: string;
  q: number;
  r: number;
}

export interface RallyHexRef {
  q: number;
  r: number;
}

export interface RallyAssignment {
  unitId: string;
  /** Heks, do ktorego jednostka ma dojsc (stolica albo miasto zapasowe). */
  targetQ: number;
  targetR: number;
  /** Jednostka juz stoi na swoim heksie zbiorki -- nic nie robi (scala sie na miejscu). */
  atRally: boolean;
}

/**
 * Stolica = `capitalCityId`, jesli takie miasto nalezy do listy. Po utracie stolicy (brak
 * miasta o tym id) wolajacy podaje nowa stolice (`capitalCityIdForOwner` ma fallback na
 * pierwsze miasto); tu ostatecznie bierzemy pierwsze miasto listy.
 */
export function pickRallyCity<T extends RallyCityRef>(
  cities: readonly T[],
  capitalCityId: string | null | undefined,
): T | undefined {
  if (capitalCityId) {
    const capital = cities.find(c => c.id === capitalCityId);
    if (capital !== undefined) return capital;
  }
  return cities[0];
}

/**
 * Lista heksow zbiorki w kolejnosci preferencji: stolica, potem pozostale miasta wlasne
 * w promieniu `searchRadius` od stolicy (wg odleglosci, potem id -- deterministycznie).
 */
export function buildRallyCandidates<T extends RallyCityRef>(
  cities: readonly T[],
  rally: RallyCityRef,
  searchRadius: number = ARMY_CONSOLIDATION_RALLY_SEARCH_HEX,
): RallyHexRef[] {
  const others = cities
    .filter(c => c.id !== rally.id)
    .map(c => ({ c, d: hexDistance(rally.q, rally.r, c.q, c.r) }))
    .filter(x => x.d <= searchRadius)
    .sort((a, b) => a.d - b.d || (a.c.id < b.c.id ? -1 : a.c.id > b.c.id ? 1 : 0))
    .map(x => ({ q: x.c.q, r: x.c.r }));
  return [{ q: rally.q, r: rally.r }, ...others];
}

/**
 * Przydziela kazdej jednostce heks zbiorki. Jednostki blizej stolicy wybieraja pierwsi
 * (deterministycznie: odleglosc, potem id). Heks z `occupancy >= maxPerHex` pomijany; gdy
 * wszystkie pelne, jednostka dostaje heks najbardziej preferowany (zostaje w poblizu).
 *
 * `occupancy` = liczba wlasnych jednostek juz stojacych na heksie (klucz `keyOf(q,r)`).
 * Funkcja NIE mutuje wejsciowej mapy.
 */
export function assignRallyTargets<T extends ConsolidationUnit>(
  units: readonly T[],
  candidates: readonly RallyHexRef[],
  maxPerHex: number,
  occupancy: ReadonlyMap<string, number>,
): RallyAssignment[] {
  if (candidates.length === 0 || units.length === 0) return [];
  const anchor = candidates[0]!;
  const counts = new Map<string, number>(occupancy);
  const ordered = [...units].sort((a, b) => {
    const da = hexDistance(a.q, a.r, anchor.q, anchor.r);
    const db = hexDistance(b.q, b.r, anchor.q, anchor.r);
    return da - db || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  });
  const out: RallyAssignment[] = [];
  for (const u of ordered) {
    let target: RallyHexRef = candidates[0]!;
    for (const cand of candidates) {
      if ((counts.get(keyOf(cand.q, cand.r)) ?? 0) < maxPerHex) {
        target = cand;
        break;
      }
    }
    const tk = keyOf(target.q, target.r);
    counts.set(tk, (counts.get(tk) ?? 0) + 1);
    out.push({
      unitId: u.id,
      targetQ: target.q,
      targetR: target.r,
      atRally: u.q === target.q && u.r === target.r,
    });
  }
  return out;
}

/** Liczba armii wojennych = liczba roznych wrogich cywilizacji (min 1). */
export function warArmyCount(enemyOwnerIds: readonly number[]): number {
  return Math.max(1, new Set(enemyOwnerIds).size);
}

/**
 * Dzieli jednostki na `armyCount` armii, zrownowazajac sume sily (LPT: od najsilniejszej,
 * do armii o najmniejszej sumie; remisy -> nizszy indeks). Zwraca niepuste armie; gdy
 * jednostek jest mniej niz armii, powstaje tyle armii, ile jednostek.
 */
export function splitIntoWarArmies<T extends { id: string }>(
  units: readonly T[],
  armyCount: number,
  strengthOf: (u: T) => number,
): T[][] {
  if (units.length === 0) return [];
  const k = Math.min(Math.max(1, Math.floor(armyCount)), units.length);
  const groups: { units: T[]; total: number }[] = Array.from({ length: k }, () => ({ units: [], total: 0 }));
  const ordered = [...units].sort((a, b) => {
    const d = strengthOf(b) - strengthOf(a);
    return d !== 0 ? d : (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  });
  for (const u of ordered) {
    let best = 0;
    for (let i = 1; i < groups.length; i++) {
      if (groups[i]!.total < groups[best]!.total) best = i;
    }
    groups[best]!.units.push(u);
    groups[best]!.total += strengthOf(u);
  }
  return groups.map(g => g.units).filter(g => g.length > 0);
}
