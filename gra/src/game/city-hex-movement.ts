/**
 * city-hex-movement.ts — reguły zajmowania heksu miasta (garnizon vs obcy).
 * PURE — bez DOM / main.ts.
 */

import type { City } from './cities';
import { keyOf } from '../units/setup';

export type CityHexRef = Pick<City, 'q' | 'r' | 'ownerId'>;

export function cityAtHex(
  q: number,
  r: number,
  cities: readonly CityHexRef[],
): CityHexRef | undefined {
  return cities.find(c => c.q === q && c.r === r);
}

/**
 * Czy jednostka może zakończyć ruch na (q,r).
 * Heks miasta obcego właściciela = zablokowany (tylko zdobycie z sąsiedztwa).
 */
export function canUnitOccupyCityHex(
  unitOwnerId: number,
  q: number,
  r: number,
  cities: readonly CityHexRef[],
): boolean {
  const city = cityAtHex(q, r, cities);
  if (!city) return true;
  return city.ownerId === unitOwnerId;
}

/** Heksy miast, których właścicielem NIE jest dana frakcja — do blokady pathfindingu. */
export function foreignCityHexKeys(
  unitOwnerId: number,
  cities: readonly CityHexRef[],
): Set<string> {
  const s = new Set<string>();
  for (const c of cities) {
    if (c.ownerId !== unitOwnerId) s.add(keyOf(c.q, c.r));
  }
  return s;
}

export function addForeignCityBlocks(
  occupied: Set<string>,
  unitOwnerId: number,
  cities: readonly CityHexRef[],
): Set<string> {
  const out = new Set(occupied);
  for (const k of foreignCityHexKeys(unitOwnerId, cities)) out.add(k);
  return out;
}
