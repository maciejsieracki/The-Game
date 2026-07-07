/**
 * civ-names.ts — nazwy klastra (civs.json) + pule founding (city-names-pools.json).
 * D-START N-1A…N-5B · B-city-names-pools 2026-07-07.
 * Lane CYWILIZACJE · pure functions · bez DOM.
 */

import type { CivDef, CivsData } from '../data/loader';
import type { CityNamesPoolsData } from './city-names-pool';
import {
  clusterRivalFromPool,
  foreignCapitalFromPool,
  pickAiFoundCityName,
  pickNextRegularCityName,
  playerCapitalFromPool,
  resolveStateCityName,
  suggestPlayerFoundCityName,
  validateCityNamesPools as validatePoolsCore,
} from './city-names-pool';

export const NAZWY_KLASTRA_LEN = 10;
export const MIASTA_CYWILIZACJI_LEN = 100;

/** Alias kompatybilności wstecznej (loader, testy). */
export type CityNamesPoolEntry = import('./city-names-pool').CityNamesPoolEntry;
export type CityNamesPools = CityNamesPoolsData;

export {
  pickNextRegularCityName,
  suggestPlayerFoundCityName,
  pickAiFoundCityName,
  collectUsedCityNamesFromCities,
  cityNameWithSuffix,
} from './city-names-pool';

/** Zwraca cywilizację po ikonaId (np. 'grecy'). */
export function findCivByIkonaId(civs: CivsData, ikonaId: string): CivDef | undefined {
  return civs.cywilizacje.find(c => c.ikonaId === ikonaId);
}

/** Lista nazwyKlastra dla typu; pusta tablica gdy brak wpisu. */
export function getNazwyKlastra(civs: CivsData, ikonaId: string): readonly string[] {
  const def = findCivByIkonaId(civs, ikonaId);
  return def?.nazwyKlastra ?? [];
}

/** Bezpieczny odczyt indeksu (N-3A: stała kolejność z JSON). */
export function nazwaKlastraAt(
  names: readonly string[],
  index: number,
  fallback: string,
): string {
  if (index >= 0 && index < names.length && names[index]) {
    return names[index] as string;
  }
  return fallback;
}

/** N-1A: pierwsze miasto gracza = miasta_panstwa[0] (pula) lub nazwyKlastra[0]. */
export function playerStartCityName(
  civs: CivsData,
  playerCivId: string,
  pools?: CityNamesPools,
): string {
  if (pools?.[playerCivId]) {
    return playerCapitalFromPool(pools, playerCivId);
  }
  const names = getNazwyKlastra(civs, playerCivId);
  return nazwaKlastraAt(names, 0, 'Stolica');
}

/** N-2A / N-3A: i-ty rywal klastra (1-based) = miasta_panstwa[i] lub nazwyKlastra[i]. */
export function clusterRivalCityName(
  civs: CivsData,
  playerCivId: string,
  rivalIndex1Based: number,
  pools?: CityNamesPools,
): string {
  if (pools?.[playerCivId]) {
    return clusterRivalFromPool(pools, playerCivId, rivalIndex1Based);
  }
  const names = getNazwyKlastra(civs, playerCivId);
  return nazwaKlastraAt(names, rivalIndex1Based, `Rywal ${rivalIndex1Based}`);
}

/** Stolica obcego typu = miasta_panstwa[0] lub nazwyKlastra[0]. */
export function foreignCapitalCityName(
  civs: CivsData,
  typIkonaId: string,
  pools?: CityNamesPools,
): string {
  if (pools?.[typIkonaId]) {
    return foreignCapitalFromPool(pools, typIkonaId);
  }
  const names = getNazwyKlastra(civs, typIkonaId);
  return nazwaKlastraAt(names, 0, typIkonaId);
}

/** Ujednolicony odczyt nazwy państwa-miasta (indeks 0-based). */
export function stateCityName(
  civs: CivsData,
  ikonaId: string,
  index: number,
  fallback: string,
  pools?: CityNamesPools,
): string {
  return resolveStateCityName(pools, civs, ikonaId, index, fallback);
}

/** Etykieta pełnej dyplomacji — nazwa nacji z JSON. */
export function civDisplayName(civs: CivsData, ikonaId: string): string {
  const def = findCivByIkonaId(civs, ikonaId);
  return def?.Cywilizacja ?? ikonaId;
}

/** Walidacja danych (dev/test): każdy typ ma 10 nazw w civs.json. */
export function validateNazwyKlastra(civs: CivsData): string[] {
  const errs: string[] = [];
  for (const c of civs.cywilizacje) {
    const id = c.ikonaId ?? c.Cywilizacja;
    const n = c.nazwyKlastra?.length ?? 0;
    if (n !== NAZWY_KLASTRA_LEN) {
      errs.push(`${id}: oczekiwano ${NAZWY_KLASTRA_LEN} nazw, jest ${n}`);
    }
  }
  return errs;
}

/** 100 nazw founding AI/gracza (kolejne miasta imperium). */
export function getMiastaCywilizacji(
  pools: CityNamesPools,
  ikonaId: string,
): readonly string[] {
  return pools[ikonaId]?.miasta_cywilizacji ?? [];
}

/** 10 nazw miast-państw (klastr). */
export function getMiastaPanstwa(
  pools: CityNamesPools,
  ikonaId: string,
): readonly string[] {
  return pools[ikonaId]?.miasta_panstwa ?? [];
}

/**
 * N-4A: AI zakłada miasto osadnikiem — pierwsza wolna nazwa z puli cywilizacji.
 * @deprecated Użyj pickAiFoundCityName (suffix po wyczerpaniu puli).
 */
export function pickAiFoundedCityName(
  pools: CityNamesPools,
  ikonaId: string,
  usedNames: ReadonlySet<string>,
  _ownerCityCount: number,
): string {
  return pickNextRegularCityName(pools, ikonaId, usedNames);
}

/** Walidacja pul + synchronizacja nazwyKlastra ↔ miasta_panstwa. */
export function validateCityNamesPools(
  pools: CityNamesPools,
  civs: CivsData,
): string[] {
  const errs = validatePoolsCore(pools, civs);
  for (const c of civs.cywilizacje) {
    const id = c.ikonaId;
    if (!id || !pools[id]) continue;
    const pan = pools[id].miasta_panstwa ?? [];
    const klastra = c.nazwyKlastra ?? [];
    if (JSON.stringify(klastra) !== JSON.stringify(pan)) {
      errs.push(`${id}: nazwyKlastra ≠ miasta_panstwa`);
    }
  }
  return errs;
}
