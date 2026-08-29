/**
 * city-hex-movement.ts — reguły zajmowania heksu miasta (garnizon vs obcy).
 * PURE — bez DOM / main.ts.
 */

import type { City } from './cities';
import { hexDistance, keyOf } from '../units/setup';

export type CityHexRef = Pick<City, 'q' | 'r' | 'ownerId'> & { maMur?: boolean };

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

/**
 * Zwykłe AI może wejść na obce miasto tylko z sąsiedniego heksu i tylko wtedy,
 * gdy przejęcie bez bitwy jest dozwolone. Mury są osobną blokadą: samo
 * `canCaptureCityWithoutBattle` opisuje obrońców, ale nie zastępuje bramki
 * fortyfikacji.
 */
export function canAiEnterEmptyEnemyCity(
  unitOwnerId: number,
  unitQ: number,
  unitR: number,
  city: CityHexRef,
  cityBuiltIds: readonly string[],
  hasDefenders: boolean,
): boolean {
  if (city.ownerId === unitOwnerId) return false;
  if (hexDistance(unitQ, unitR, city.q, city.r) !== 1) return false;
  if (hasDefenders) return false;
  if (city.maMur === true) return false;
  return !cityBuiltIds.some(id => id === 'palisada' || id === 'mury' || id === 'fort' || id === 'baszta');
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
