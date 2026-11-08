/**
 * civ-names.ts — wspólna sekwencja nazw (civs.json + city-names-pools.json).
 * D-START N-1A…N-5B · B-city-names-pools 2026-07-07.
 * Lane CYWILIZACJE · pure functions · bez DOM.
 */

import type { CivDef, CivsData } from '../data/loader';
import type { CityNamesPoolsData } from './city-names-pool';
import {
  clusterRivalFromPool,
  foreignCapitalFromPool,
  pickNextCityName,
  pickNextCityNameFromNames,
  pickAiFoundCityName,
  pickNextRegularCityName,
  playerCapitalFromPool,
  resolveStateCityName,
  suggestPlayerFoundCityName,
  validateCityNamesPools as validatePoolsCore,
  NAZWY_KLASTRA_LEN,
  CITY_NAMES_POOL_COMMON_LEN,
  CITY_NAMES_POOL_REGULAR_LEN,
  nazwaKlastraAt,
} from './city-names-pool';

export {
  NAZWY_KLASTRA_LEN,
  CITY_NAMES_POOL_COMMON_LEN,
  CITY_NAMES_POOL_REGULAR_LEN,
  nazwaKlastraAt,
};
export const MIASTA_CYWILIZACJI_LEN = 100;

/** Alias kompatybilności wstecznej (loader, testy). */
export type CityNamesPoolEntry = import('./city-names-pool').CityNamesPoolEntry;
export type CityNamesPools = CityNamesPoolsData;

export {
  pickNextCityName,
  pickNextCityNameFromNames,
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

/** Kompatybilny widok końcowych 10 wpisów; nie jest alokatorem nazw. */
export function getNazwyKlastra(civs: CivsData, ikonaId: string): readonly string[] {
  const def = findCivByIkonaId(civs, ikonaId);
  return def?.nazwyMiast
    ? def.nazwyMiast.slice(CITY_NAMES_POOL_REGULAR_LEN, CITY_NAMES_POOL_COMMON_LEN)
    : def?.nazwyKlastra ?? [];
}

/** Lista nazw miast cywilizacji dla typu; pusta tablica gdy brak eksportu. */
function getNazwyMiast(civs: CivsData, ikonaId: string): readonly string[] {
  const def = findCivByIkonaId(civs, ikonaId);
  return def?.nazwyMiast ?? [];
}

/** Stolica i kolejne miasta gracza: first-free ze wspólnej kolejki cywilizacji. */
export function playerStartCityName(
  civs: CivsData,
  playerCivId: string,
  pools?: CityNamesPools,
  usedNames?: ReadonlySet<string>,
): string {
  if (pools?.[playerCivId]) {
    return playerCapitalFromPool(pools, playerCivId, usedNames);
  }
  const cityNames = getNazwyMiast(civs, playerCivId);
  if (cityNames.length > 0) {
    return pickNextCityNameFromNames(cityNames, usedNames ?? new Set(), 'Stolica');
  }
  const names = getNazwyKlastra(civs, playerCivId);
  return nazwaKlastraAt(names, 0, 'Stolica');
}

/** Rywal klastra: first-free ze wspólnej kolejki cywilizacji. */
export function clusterRivalCityName(
  civs: CivsData,
  playerCivId: string,
  rivalIndex1Based: number,
  pools?: CityNamesPools,
  usedNames?: ReadonlySet<string>,
): string {
  if (pools?.[playerCivId]) {
    return clusterRivalFromPool(pools, playerCivId, rivalIndex1Based, usedNames);
  }
  const cityNames = getNazwyMiast(civs, playerCivId);
  if (cityNames.length > 0 && rivalIndex1Based >= 1) {
    const implicitUsed = usedNames ?? new Set(cityNames.slice(0, rivalIndex1Based));
    return pickNextCityNameFromNames(cityNames, implicitUsed, `Rywal ${rivalIndex1Based}`);
  }
  const names = getNazwyKlastra(civs, playerCivId);
  if (!names.length) return `Rywal ${rivalIndex1Based}`;
  const idx = rivalIndex1Based >= 1 ? rivalIndex1Based - 1 : rivalIndex1Based;
  return nazwaKlastraAt(names, idx, `Rywal ${rivalIndex1Based}`);
}

/** Stolica obcego klastra: first-free ze wspólnej kolejki cywilizacji. */
export function foreignCapitalCityName(
  civs: CivsData,
  typIkonaId: string,
  pools?: CityNamesPools,
  usedNames?: ReadonlySet<string>,
): string {
  if (pools?.[typIkonaId]) {
    return foreignCapitalFromPool(pools, typIkonaId, usedNames);
  }
  const cityNames = getNazwyMiast(civs, typIkonaId);
  if (cityNames.length > 0) {
    return pickNextCityNameFromNames(cityNames, usedNames ?? new Set(), typIkonaId);
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
  usedNames?: ReadonlySet<string>,
): string {
  return resolveStateCityName(pools, civs, ikonaId, index, fallback, usedNames);
}

/** Etykieta pełnej dyplomacji — nazwa nacji z JSON. */
export function civDisplayName(civs: CivsData, ikonaId: string): string {
  const def = findCivByIkonaId(civs, ikonaId);
  return def?.Cywilizacja ?? ikonaId;
}

/** Walidacja danych (dev/test): każdy typ ma wspólną listę 100+10 nazw. */
export function validateNazwyKlastra(civs: CivsData): string[] {
  const errs: string[] = [];
  for (const c of civs.cywilizacje) {
    const id = c.ikonaId ?? c.Cywilizacja;
    const names = c.nazwyMiast ?? [];
    if (names.length !== CITY_NAMES_POOL_COMMON_LEN) {
      errs.push(`${id}: oczekiwano ${CITY_NAMES_POOL_COMMON_LEN} nazw, jest ${names.length}`);
    }
    if (new Set(names).size !== names.length) {
      errs.push(`${id}: duplikaty we wspólnej liście nazwMiast`);
    }
  }
  return errs;
}

/** Kompatybilny widok pierwszych 100 wpisów; nie jest alokatorem nazw. */
export function getMiastaCywilizacji(
  pools: CityNamesPools,
  ikonaId: string,
): readonly string[] {
  return pools[ikonaId]?.miasta_cywilizacji?.slice(0, MIASTA_CYWILIZACJI_LEN) ?? [];
}

/** Kompatybilny widok końcowych 10 wpisów; nie jest alokatorem nazw. */
export function getMiastaPanstwa(
  pools: CityNamesPools,
  ikonaId: string,
): readonly string[] {
  return pools[ikonaId]?.miasta_cywilizacji?.slice(MIASTA_CYWILIZACJI_LEN, CITY_NAMES_POOL_COMMON_LEN) ?? [];
}

/**
 * N-4A: AI zakłada miasto osadnikiem — pierwsza wolna nazwa z puli cywilizacji.
 * @deprecated Użyj pickAiFoundCityName z migawką nazw żywych miast.
 */
export function pickAiFoundedCityName(
  pools: CityNamesPools,
  ikonaId: string,
  usedNames: ReadonlySet<string>,
  _ownerCityCount: number,
): string {
  return pickNextCityName(pools, ikonaId, usedNames);
}

/** Walidacja wspólnej puli + lustra `civs.json.nazwyMiast`. */
export function validateCityNamesPools(
  pools: CityNamesPools,
  civs: CivsData,
): string[] {
  return validatePoolsCore(pools, civs);
}

