/**
 * city-names-pool.ts — pule nazw miast per cywilizacja (B-city-names-pools).
 *
 * Źródło: gra/data/city-names-pools.json
 *   miasta_cywilizacji[0..99]   — miasta imperium (founding gracza/AI)
 *   miasta_cywilizacji[100..109] — istniejące miasta-państwa
 *
 * Eksport Excel (przyszłość): panele-sterowania/Nazwy-miast-cywilizacji.xlsx
 *   → generate-city-names-xlsx.py → Maciej edytuje → export-city-names.py → JSON
 */

/** Minimal civ list shape — leaf type, bez importu loader↔pool cycle. */
export interface CivsForCityNames {
  cywilizacje: ReadonlyArray<{
    ikonaId?: string;
    nazwyMiast?: readonly string[];
  }>;
}

export const CITY_NAMES_POOL_REGULAR_LEN = 100;
export const CITY_NAMES_POOL_STATE_LEN = 10;
export const CITY_NAMES_POOL_COMMON_LEN = CITY_NAMES_POOL_REGULAR_LEN + CITY_NAMES_POOL_STATE_LEN;

/** Długość końcowego suffixu miast-państw — leaf, bez importu z civ-names. */
export const NAZWY_KLASTRA_LEN = CITY_NAMES_POOL_STATE_LEN;

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

/** Wpis puli dla jednej cywilizacji (klucz = ikonaId). */
export interface CityNamesPoolEntry {
  nazwa_pl: string;
  miasta_cywilizacji: string[];
}

export type CityNamesPoolsData = Record<string, CityNamesPoolEntry>;

function poolEntry(pools: CityNamesPoolsData, ikonaId: string): CityNamesPoolEntry | undefined {
  return pools[ikonaId];
}

/** Indeks pozycji rywala przy wejściu 1-based (zachowana pomocnicza semantyka legacy). */
export function rivalPoolIndex(rivalIndex1Based: number, poolLen: number): number {
  if (poolLen <= 1) return 0;
  const rivalSlots = poolLen - 1;
  return ((Math.max(1, rivalIndex1Based) - 1) % rivalSlots) + 1;
}

/** Nazwa państwa-miasta z końcowego suffixu wspólnej listy (indeks 0-based). */
export function stateCityNameAt(
  pools: CityNamesPoolsData,
  ikonaId: string,
  index: number,
  fallback: string,
): string {
  const common = poolEntry(pools, ikonaId)?.miasta_cywilizacji;
  const idx = CITY_NAMES_POOL_REGULAR_LEN + index;
  if (common?.length && index >= 0 && idx < common.length && common[idx]) {
    return common[idx] as string;
  }
  return fallback;
}

/**
 * N-1A: stolica GRACZA = `miasta_cywilizacji[0]`.
 *
 * R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1, runda 3 (R3-2) — NAPRAWA BŁĘDU, symetryczna do
 * naprawionego w rundzie 2 `foreignCapitalFromPool`: do tej pory pierwsze miasto gracza szło
 * przez stary odczyt pozycji 0 z puli państw-miast. Dla 13 z 15 cywilizacji obie pule miały
 * na pozycji 0 to samo, więc różnicy nie było widać; dwa
 * wyjątki to dokładnie ta sama klasa pomyłki, którą właściciel zgłosił dla AI, tylko po jego
 * własnej stronie: gracz-Chińczyk startował w mieście `Qin` (nazwa państwa i dynastii, NIE
 * miasta) zamiast `Xi'an`, gracz-Słowianin w `Kiev` zamiast `Kijów`.
 * Stolica IMPERIUM należy do prefixu listy; końcowy suffix opisuje miasta-państwa
 * klastra i zostaje źródłem dla `clusterRivalFromPool`.
 *
 * BEZ DUPLIKATU NAZW: obce klastry pomijają typ gracza (`cluster-spawn.ts:332`), a rywale
 * tego samego typu biorą nazwy z końcowego suffixu (`clusterRivalCityName`), więc żadne
 * inne miasto w partii nie sięga po `miasta_cywilizacji[0]` cywilizacji gracza.
 *
 * Fallback zachowany bez zmian: brak listy miast cywilizacji → stara ścieżka
 * (dalej `'Stolica'`), żeby niekompletna pula nie dawała pustej nazwy.
 */
export function playerCapitalFromPool(pools: CityNamesPoolsData, ikonaId: string): string {
  const first = poolEntry(pools, ikonaId)?.miasta_cywilizacji?.[0];
  if (first) return first;
  return stateCityNameAt(pools, ikonaId, 0, 'Stolica');
}

/**
 * N-2A / N-3A: rywal klastra (1-based).
 * Indeksy 1..10 mapują kolejno na końcowy suffix wspólnej listy; powyżej —
 * kolejne unikalne nazwy z prefixu regularnego, z pominięciem zastrzeżonego
 * indeksu 0 (stolicy).
 */
export function clusterRivalFromPool(
  pools: CityNamesPoolsData,
  ikonaId: string,
  rivalIndex1Based: number,
): string {
  const entry = poolEntry(pools, ikonaId);
  const common = entry?.miasta_cywilizacji ?? [];
  const pan = common.slice(CITY_NAMES_POOL_REGULAR_LEN, CITY_NAMES_POOL_COMMON_LEN);
  const fallback = `Rywal ${rivalIndex1Based}`;

  if (!pan.length || rivalIndex1Based < 1) {
    return fallback;
  }

  if (rivalIndex1Based <= pan.length) {
    const name = pan[rivalIndex1Based - 1];
    if (name) return name;
  }

  // Indeks 0 jest zastrzeżony dla stolicy także w ścieżce overflow. Nie
  // pozwalaj, aby liczba rywali poza zwykłym limitem przywróciła tę nazwę.
  const regular = common.slice(1, CITY_NAMES_POOL_REGULAR_LEN);
  const usedInCluster = new Set(pan.filter(Boolean));
  const overflowIndex = rivalIndex1Based - pan.length - 1;

  let skipped = 0;
  for (const name of regular) {
    if (!name || usedInCluster.has(name)) continue;
    if (skipped === overflowIndex) return name;
    skipped++;
  }

  const base = regular.find(n => n && !usedInCluster.has(n));
  if (base) {
    return cityNameWithSuffix(base, overflowIndex + 2);
  }

  return fallback;
}

/**
 * Stolica obcego klastra (państwo AI) = `miasta_cywilizacji[0]`.
 *
 * R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1, runda 2 (R2-2) — NAPRAWA BŁĘDU: do tej pory szło
 * przez stary odczyt pozycji 0 z puli państw-miast. Dla 13 z 15 cywilizacji obie pule miały
 * na pozycji 0 to samo, więc różnicy nie było widać;
 * dwa wyjątki widać w grze: Chińczycy dostawali `Qin` (nazwa państwa i dynastii, NIE miasta —
 * to dosłownie napis ze zrzutu właściciela) zamiast `Xi'an`, Słowianie `Kiev` zamiast `Kijów`.
 * Stolica IMPERIUM należy do prefixu listy; końcowy suffix opisuje miasta-państwa
 * klastra i zostaje źródłem dla `clusterRivalFromPool`.
 *
 * Fallback zachowany bez zmian: brak listy miast cywilizacji → stara ścieżka
 * (dalej `ikonaId`), żeby niekompletna pula nie dawała pustej nazwy.
 */
export function foreignCapitalFromPool(pools: CityNamesPoolsData, ikonaId: string): string {
  const first = poolEntry(pools, ikonaId)?.miasta_cywilizacji?.[0];
  if (first) return first;
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
  const regular = poolEntry(pools, ikonaId)?.miasta_cywilizacji
    ?.slice(0, CITY_NAMES_POOL_REGULAR_LEN) ?? [];
  // Indeks 0 jest zawsze zarezerwowany dla stolicy, także gdy caller nie
  // przekazał jej jeszcze do zbioru zajętych nazw.
  for (const name of regular.slice(1)) {
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

/** Walidacja wspólnego JSON (dev/test/CI). */
export function validateCityNamesPools(
  pools: CityNamesPoolsData,
  civs: CivsForCityNames,
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
    const common = entry.miasta_cywilizacji ?? [];
    if (common.length !== CITY_NAMES_POOL_COMMON_LEN) {
      errs.push(`${cid}: miasta_cywilizacji ${common.length} !== ${CITY_NAMES_POOL_COMMON_LEN}`);
    }
    if (new Set(common).size !== common.length) {
      errs.push(`${cid}: duplikaty we wspólnej liście miasta_cywilizacji`);
    }
    const civ = civs.cywilizacje.find(c => c.ikonaId === cid);
    if (JSON.stringify(civ?.nazwyMiast ?? []) !== JSON.stringify(common)) {
      errs.push(`${cid}: civs.json.nazwyMiast ≠ miasta_cywilizacji`);
    }
  }
  return errs;
}

/**
 * Nazwa państwa-miasta z fallbackiem na końcowy suffix nazwyMiast z civs.json
 * (kompatybilność wsteczna gdy brak puli).
 */
export function resolveStateCityName(
  pools: CityNamesPoolsData | undefined,
  civs: CivsForCityNames,
  ikonaId: string,
  index: number,
  fallback: string,
): string {
  if (pools?.[ikonaId]) {
    return stateCityNameAt(pools, ikonaId, index, fallback);
  }
  const names = civs.cywilizacje.find(c => c.ikonaId === ikonaId)?.nazwyMiast ?? [];
  const idx = CITY_NAMES_POOL_REGULAR_LEN + index;
  return index >= 0 ? nazwaKlastraAt(names, idx, fallback) : fallback;
}
