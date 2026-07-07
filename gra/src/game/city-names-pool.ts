/**
 * city-names-pool.ts — pule nazw miast per cywilizacja (B-city-names-pools).
 *
 * Źródło: gra/data/city-names-pools.json
 *   miasta_cywilizacji[100] — kolejne miasta imperium (founding gracza/AI)
 *   miasta_panstwa[10]      — miasta-państwa w klastrze (stolice regionów)
 *
 * Eksport Excel (przyszłość): panele-sterowania/Nazwy-miast-cywilizacji.xlsx
 *   → generate-city-names-xlsx.py → Maciej edytuje → export-city-names.py → JSON
 */

import type { CivsData } from '../data/loader';
import { NAZWY_KLASTRA_LEN, nazwaKlastraAt } from './civ-names';

export const CITY_NAMES_POOL_REGULAR_LEN = 100;
export const CITY_NAMES_POOL_STATE_LEN = 10;

/** Wpis puli dla jednej cywilizacji (klucz = ikonaId). */
export interface CityNamesPoolEntry {
  nazwa_pl: string;
  miasta_cywilizacji: string[];
  miasta_panstwa: string[];
}

export type CityNamesPoolsData = Record<string, CityNamesPoolEntry>;

function poolEntry(pools: CityNamesPoolsData, ikonaId: string): CityNamesPoolEntry | undefined {
  return pools[ikonaId];
}

/** Nazwa państwa-miasta (indeks 0 = stolica gracza / obca stolica klastra). */
export function stateCityNameAt(
  pools: CityNamesPoolsData,
  ikonaId: string,
  index: number,
  fallback: string,
): string {
  const pan = poolEntry(pools, ikonaId)?.miasta_panstwa;
  if (pan && index >= 0 && index < pan.length && pan[index]) {
    return pan[index] as string;
  }
  return fallback;
}

/** N-1A: pierwsze miasto gracza = miasta_panstwa[0]. */
export function playerCapitalFromPool(pools: CityNamesPoolsData, ikonaId: string): string {
  return stateCityNameAt(pools, ikonaId, 0, 'Stolica');
}

/** N-2A / N-3A: rywal klastra (1-based) = miasta_panstwa[i]. */
export function clusterRivalFromPool(
  pools: CityNamesPoolsData,
  ikonaId: string,
  rivalIndex1Based: number,
): string {
  return stateCityNameAt(pools, ikonaId, rivalIndex1Based, `Rywal ${rivalIndex1Based}`);
}

/** Stolica obcego typu = miasta_panstwa[0]. */
export function foreignCapitalFromPool(pools: CityNamesPoolsData, ikonaId: string): string {
  return stateCityNameAt(pools, ikonaId, 0, ikonaId);
}

/**
 * Zbiera nazwy już zajęte przez miasta danego typu cywilizacji.
 * @param civTypeForOwner mapa ownerId → ikonaId (np. aiOwnerCivMap + gracz)
 */
export function collectUsedCityNames(
  cityNames: readonly string[],
  ownerIds: readonly number[],
  civTypeForOwner: (ownerId: number) => string,
  targetCivId: string,
): Set<string> {
  const used = new Set<string>();
  for (let i = 0; i < cityNames.length; i++) {
    const ownerId = ownerIds[i];
    if (ownerId !== undefined && civTypeForOwner(ownerId) === targetCivId) {
      const n = cityNames[i];
      if (n) used.add(n);
    }
  }
  return used;
}

/** Wariant z tablicy City (wygodniejszy w main.ts). */
export function collectUsedCityNamesFromCities(
  cities: ReadonlyArray<{ ownerId: number; name: string }>,
  civTypeForOwner: (ownerId: number) => string,
  targetCivId: string,
): Set<string> {
  const used = new Set<string>();
  for (const c of cities) {
    if (civTypeForOwner(c.ownerId) === targetCivId) {
      used.add(c.name);
    }
  }
  return used;
}

/** Sufiks gdy pula wyczerpana: „Ateny II", „Ateny III"… */
export function cityNameWithSuffix(base: string, ordinal: number): string {
  if (ordinal <= 1) return base;
  const roman = ['', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const suffix = ordinal <= 10 ? roman[ordinal] : String(ordinal);
  return `${base} ${suffix}`;
}

/**
 * Następna wolna nazwa z puli regularnej (miasta_cywilizacji).
 * Pomija nazwy już użyte; po wyczerpaniu — sufiks od pierwszej wolnej bazy.
 */
export function pickNextRegularCityName(
  pools: CityNamesPoolsData,
  ikonaId: string,
  usedNames: ReadonlySet<string>,
): string {
  const regular = poolEntry(pools, ikonaId)?.miasta_cywilizacji ?? [];
  for (const name of regular) {
    if (!usedNames.has(name)) return name;
  }
  // Pula wyczerpana — sufiks na bazie pierwszej nazwy puli lub generyczny fallback
  const base = regular[0] ?? 'Miasto';
  let ord = 2;
  while (usedNames.has(cityNameWithSuffix(base, ord))) ord++;
  return cityNameWithSuffix(base, ord);
}

/**
 * Podpowiedź dla UI przy zakładaniu miasta (bez promptu — auto-suggest).
 * Kolejne miasto gracza: pierwsza wolna z puli regularnej.
 */
export function suggestPlayerFoundCityName(
  pools: CityNamesPoolsData,
  ikonaId: string,
  cities: ReadonlyArray<{ ownerId: number; name: string }>,
  civTypeForOwner: (ownerId: number) => string,
  playerOwnerId = 0,
): string {
  const playerCityCount = cities.filter(c => c.ownerId === playerOwnerId).length;
  if (playerCityCount === 0) {
    return playerCapitalFromPool(pools, ikonaId);
  }
  const used = collectUsedCityNamesFromCities(cities, civTypeForOwner, ikonaId);
  return pickNextRegularCityName(pools, ikonaId, used);
}

/** Nazwa dla AI founding (osadnik / ekspansja). */
export function pickAiFoundCityName(
  pools: CityNamesPoolsData,
  ikonaId: string,
  cities: ReadonlyArray<{ ownerId: number; name: string }>,
  civTypeForOwner: (ownerId: number) => string,
  ownerId: number,
): string {
  const civId = civTypeForOwner(ownerId);
  const used = collectUsedCityNamesFromCities(cities, civTypeForOwner, civId);
  return pickNextRegularCityName(pools, civId, used);
}

/** Walidacja JSON (dev/test/CI). */
export function validateCityNamesPools(
  pools: CityNamesPoolsData,
  civs: CivsData,
): string[] {
  const errs: string[] = [];
  const civIds = civs.cywilizacje
    .map(c => c.ikonaId)
    .filter((id): id is string => Boolean(id));

  for (const cid of civIds) {
    const entry = pools[cid];
    if (!entry) {
      errs.push(`${cid}: brak wpisu w city-names-pools.json`);
      continue;
    }
    const cyw = entry.miasta_cywilizacji ?? [];
    const pan = entry.miasta_panstwa ?? [];
    if (cyw.length < CITY_NAMES_POOL_REGULAR_LEN) {
      errs.push(`${cid}: miasta_cywilizacji ${cyw.length} < ${CITY_NAMES_POOL_REGULAR_LEN}`);
    }
    if (pan.length !== CITY_NAMES_POOL_STATE_LEN) {
      errs.push(`${cid}: miasta_panstwa ${pan.length} !== ${CITY_NAMES_POOL_STATE_LEN}`);
    }
    if (new Set(cyw).size !== cyw.length) {
      errs.push(`${cid}: duplikaty w miasta_cywilizacji`);
    }
    if (new Set(pan).size !== pan.length) {
      errs.push(`${cid}: duplikaty w miasta_panstwa`);
    }
  }
  return errs;
}

/**
 * Nazwa państwa-miasta z fallbackiem na nazwyKlastra z civs.json
 * (kompatybilność wsteczna gdy brak puli).
 */
export function resolveStateCityName(
  pools: CityNamesPoolsData | undefined,
  civs: CivsData,
  ikonaId: string,
  index: number,
  fallback: string,
): string {
  if (pools?.[ikonaId]) {
    return stateCityNameAt(pools, ikonaId, index, fallback);
  }
  const names = civs.cywilizacje.find(c => c.ikonaId === ikonaId)?.nazwyKlastra ?? [];
  return nazwaKlastraAt(names, index, fallback);
}

/** Sprawdza zgodność miasta_panstwa z nazwyKlastra (ostrzeżenie przy rozjazdach). */
export function diffPoolsVsNazwyKlastra(
  pools: CityNamesPoolsData,
  civs: CivsData,
): string[] {
  const warns: string[] = [];
  for (const c of civs.cywilizacje) {
    const id = c.ikonaId;
    if (!id) continue;
    const pan = pools[id]?.miasta_panstwa ?? [];
    const legacy = c.nazwyKlastra ?? [];
    if (legacy.length !== NAZWY_KLASTRA_LEN) continue;
    for (let i = 0; i < NAZWY_KLASTRA_LEN; i++) {
      if (pan[i] && legacy[i] && pan[i] !== legacy[i]) {
        warns.push(`${id}[${i}]: pula="${pan[i]}" vs civs="${legacy[i]}"`);
      }
    }
  }
  return warns;
}
