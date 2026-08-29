/**
 * triumph-city-state.ts — triumf po zjednoczeniu miast-państw tej samej kultury (P-PODBOJ-MIAST-PANSTW-TRIUMF-POPUP-Q1=A).
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
 * Czy po przejęciu city gracz jest jedynym władcą aktywnych miast-państw swojej kultury.
 * `cities` jest tablicą po przejęciu, ale przed `eliminateOwner` — oldOwner nadal
 * pozostaje w typCityCopyOwners / aiOwnerCivMap.
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
  // Popup dotyczy wyłącznie ostatniego aktywnego miasta oldOwner. W momencie
  // wywołania tablica cities jest już po przejęciu, więc oldOwner nie może mieć
  // żadnego pozostałego miasta.
  if (countCitiesForOwner(oldOwner, cities) !== 0) return false;

  const oldCiv = aiOwnerCivMap.get(oldOwner);
  if (!oldCiv || oldCiv !== playerCivKey) return false;

  for (const oid of typCityCopyOwners) {
    if (oid === oldOwner) continue;
    if (aiOwnerCivMap.get(oid) !== playerCivKey) continue;
    if (countCitiesForOwner(oid, cities) >= 1) return false;
  }

  return true;
}

/** Treść ceremonialnego komunikatu triumfu (P-PODBOJ-MIAST-PANSTW-TRIUMF-POPUP-Q1=A). */
export function buildTriumphCityStateUnificationMessage(
  civLabel: string,
  cityName: string,
): string {
  const civ = (civLabel ?? '').trim() || 'Twoja cywilizacja';
  const city = (cityName ?? '').trim() || 'miasto';
  return (
    `TRIUMF! Zjednoczyłeś całą kulturę ${civ}. Ostatnie miasto-państwo — ${city} — znalazło się pod Twoją władzą.`
  );
}
