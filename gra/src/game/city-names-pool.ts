/**
 * city-names-pool.ts — pule nazw miast per cywilizacja (B-city-names-pools).
 *
 * Źródło: gra/data/city-names-pools.json
 *   miasta_cywilizacji[0..109] — jedna kolejka dla wszystkich miast tej cywilizacji
 *   (stolica, miasto-państwo, founding gracza/AI oraz klastry obce)
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

/** Bezpieczny odczyt indeksu dla kompatybilnych, niealokacyjnych callerów. */
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

function commonNames(pools: CityNamesPoolsData, ikonaId: string): readonly string[] {
  return poolEntry(pools, ikonaId)?.miasta_cywilizacji
    ?.slice(0, CITY_NAMES_POOL_COMMON_LEN) ?? [];
}

/** Indeks pozycji rywala przy wejściu 1-based (zachowana pomocnicza semantyka legacy). */
export function rivalPoolIndex(rivalIndex1Based: number, poolLen: number): number {
  if (poolLen <= 1) return 0;
  const rivalSlots = poolLen - 1;
  return ((Math.max(1, rivalIndex1Based) - 1) % rivalSlots) + 1;
}

/** Kompatybilny adapter nazwy z kolejki (indeks 0-based, bez osobnej puli roli). */
export function stateCityNameAt(
  pools: CityNamesPoolsData,
  ikonaId: string,
  index: number,
  fallback: string,
  usedNames?: ReadonlySet<string>,
): string {
  const common = commonNames(pools, ikonaId);
  if (!common?.length || index < 0) return fallback;
  // Gdy caller nie ma jeszcze migawki żywych miast, `index` zachowuje dawną
  // semantykę numeru przydziału: pierwsze `index` pozycji są już zajęte.
  const implicitUsed = usedNames ?? new Set(common.slice(0, index));
  return pickNextCityNameFromNames(common, implicitUsed, fallback);
}

/** Stolica lub kolejne miasto: pierwszy wolny wpis wspólnej kolejki cywilizacji. */
export function playerCapitalFromPool(
  pools: CityNamesPoolsData,
  ikonaId: string,
  usedNames: ReadonlySet<string> = new Set(),
): string {
  return pickNextCityName(pools, ikonaId, usedNames, 'Stolica');
}

/** Adapter rywala klastra do wspólnej kolejki (1-based tylko dla legacy fallbacku). */
export function clusterRivalFromPool(
  pools: CityNamesPoolsData,
  ikonaId: string,
  rivalIndex1Based: number,
  usedNames?: ReadonlySet<string>,
): string {
  const common = commonNames(pools, ikonaId);
  const fallback = `Rywal ${rivalIndex1Based}`;
  if (rivalIndex1Based < 1) return fallback;
  // Kompatybilność dla callerów legacy: stolica zajmuje common[0], a numer
  // rywala opisuje kolejną pozycję kolejki. Runtime przekazuje prawdziwy zbiór
  // `usedNames`, więc ta gałąź nie jest osobnym kursorem ani pulą.
  const implicitUsed = usedNames ?? new Set(common.slice(0, rivalIndex1Based));
  return pickNextCityNameFromNames(common, implicitUsed, fallback);
}

/** Stolica obcego klastra: pierwszy wolny wpis tej samej kolejki cywilizacji. */
export function foreignCapitalFromPool(
  pools: CityNamesPoolsData,
  ikonaId: string,
  usedNames: ReadonlySet<string> = new Set(),
): string {
  return pickNextCityName(pools, ikonaId, usedNames, ikonaId);
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
      if (c.name) used.add(c.name);
    }
  }
  return used;
}

/** Sufiks gdy pula wyczerpana: „Ateny II", „Ateny III"… */
export function cityNameWithSuffix(base: string, ordinal: number): string {
  if (ordinal <= 1) return base;
  const roman = ['', '', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const suffix = ordinal <= 10 ? roman[ordinal] : String(ordinal);
  return `${base} ${suffix}`;
}

/**
 * Kanoniczny first-free z jednej kolejki nazw.
 *
 * `usedNames` jest migawką nazw żywych miast tej samej cywilizacji. Funkcja
 * niczego nie zapisuje i nie mutuje zbioru — caller dodaje wynik dopiero po
 * udanym założeniu miasta. Po wykorzystaniu wszystkich pozycji kolejki
 * niesufiksowana baza nie jest już zwracana; wybieramy pierwszy wolny suffix.
 */
export function pickNextCityNameFromNames(
  names: readonly string[],
  usedNames: ReadonlySet<string>,
  fallback = 'Miasto',
): string {
  for (const name of names) {
    if (name && !usedNames.has(name)) return name;
  }

  const base = names.find(Boolean) ?? fallback;
  if (!names.some(Boolean) && !usedNames.has(base)) return base;

  let ordinal = 2;
  while (
    usedNames.has(cityNameWithSuffix(base, ordinal))
    || names.includes(cityNameWithSuffix(base, ordinal))
  ) {
    ordinal++;
  }
  return cityNameWithSuffix(base, ordinal);
}

/** Następna wolna nazwa z pełnej wspólnej puli 110 pozycji. */
export function pickNextCityName(
  pools: CityNamesPoolsData,
  ikonaId: string,
  usedNames: ReadonlySet<string>,
  fallback = 'Miasto',
): string {
  const common = commonNames(pools, ikonaId);
  return pickNextCityNameFromNames(common, usedNames, fallback);
}

/**
 * Alias nazwy historycznej — zachowany dla narzędzi i integratorów.
 * Nie ma już osobnej puli regularnej ani rezerwacji indeksu 0.
 */
export function pickNextRegularCityName(
  pools: CityNamesPoolsData,
  ikonaId: string,
  usedNames: ReadonlySet<string>,
): string {
  return pickNextCityName(pools, ikonaId, usedNames);
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
  const used = collectUsedCityNamesFromCities(cities, civTypeForOwner, ikonaId);
  // `playerOwnerId` pozostaje w sygnaturze dla kompatybilności call-site'ów;
  // kolejka jest cywilizacyjna, więc obejmuje także miasta innych ownerów tego
  // samego typu. Nie używamy już owner-local cursora.
  void playerOwnerId;
  return pickNextCityName(pools, ikonaId, used, 'Stolica');
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
  return pickNextCityName(pools, civId, used);
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
  usedNames?: ReadonlySet<string>,
): string {
  if (pools?.[ikonaId]) {
    return stateCityNameAt(pools, ikonaId, index, fallback, usedNames);
  }
  const names = civs.cywilizacje.find(c => c.ikonaId === ikonaId)?.nazwyMiast ?? [];
  if (names.length > 0 && index >= 0) {
    const implicitUsed = usedNames ?? new Set(names.slice(0, index));
    return pickNextCityNameFromNames(names, implicitUsed, fallback);
  }
  return index >= 0 ? nazwaKlastraAt(names, index, fallback) : fallback;
}
