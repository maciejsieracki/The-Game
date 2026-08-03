/**
 * triumph-city-state.ts — triumf po zjednoczeniu miast-państw tej samej cywilizacji (P-TRIUMPH-CS-Q1=B).
 *
 * Gdy gracz przejmuje ostatnie żyjące miasto rywala będącego miastem-państwem (typCityCopyOwners)
 * tego samego typu co gracz — dodatkowy, dłuższy komunikat triumfu.
 */

import type { City } from './cities';

/** Czas wyświetlania komunikatu triumfu (ms). */
export const TRIUMPH_CS_HINT_MS = 9500;

export interface TriumphCityStateInput {
  newOwner: number;
  oldOwner: number;
  playerCivKey: string;
  typCityCopyOwners: ReadonlySet<number>;
  aiOwnerCivMap: ReadonlyMap<number, string>;
  cities: ReadonlyArray<Pick<City, 'ownerId'>>;
}

/** Liczba miast danego ownera w bieżącej tablicy cities. */
export function countCitiesForOwner(
  ownerId: number,
  cities: ReadonlyArray<Pick<City, 'ownerId'>>,
): number {
  let n = 0;
  for (const c of cities) {
    if (c.ownerId === ownerId) n++;
  }
  return n;
}

/**
 * Czy po eliminacji oldOwner gracz jest jedynym władcą miast-państw swojej cywilizacji.
 * Wołane PRZED eliminateOwner — oldOwner nadal w typCityCopyOwners / aiOwnerCivMap.
 */
export function shouldShowPlayerTriumphCityStateUnification(
  input: TriumphCityStateInput,
): boolean {
  const {
    newOwner,
    oldOwner,
    playerCivKey,
    typCityCopyOwners,
    aiOwnerCivMap,
    cities,
  } = input;

  if (newOwner !== 0) return false;
  if (!typCityCopyOwners.has(oldOwner)) return false;

  const oldCiv = aiOwnerCivMap.get(oldOwner);
  if (!oldCiv || oldCiv !== playerCivKey) return false;

  for (const oid of typCityCopyOwners) {
    if (oid === oldOwner) continue;
    if (aiOwnerCivMap.get(oid) !== playerCivKey) continue;
    if (countCitiesForOwner(oid, cities) >= 1) return false;
  }

  return true;
}

/** Treść komunikatu triumfu (P-TRIUMPH-CS-Q1=B). */
export function buildTriumphCityStateUnificationMessage(
  civLabel: string,
  cityName: string,
): string {
  const civ = (civLabel ?? '').trim() || 'Twoja cywilizacja';
  const city = (cityName ?? '').trim() || 'miasto';
  return (
    `TRIUMF — ${civ} zjednoczeni! Ostatnie miasto-państwo Twojej cywilizacji (${city}) padło. Jesteś jedynym władcą.`
  );
}
