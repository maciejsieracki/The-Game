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

/** Minimal civ list shape — leaf type, bez importu loader↔pool cycle. */
export interface CivsForCityNames {
  cywilizacje: ReadonlyArray<{
    ikonaId?: string;
    nazwyKlastra?: readonly string[];
  }>;
}

export const CITY_NAMES_POOL_REGULAR_LEN = 100;
export const CITY_NAMES_POOL_STATE_LEN = 10;

/** Długość nazwyKlastra / miasta_panstwa (N-3A) — leaf, bez importu z civ-names. */
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
  miasta_panstwa: string[];
}

export type CityNamesPoolsData = Record<string, CityNamesPoolEntry>;

function poolEntry(pools: CityNamesPoolsData, ikonaId: string): CityNamesPoolEntry | undefined {
  return pools[ikonaId];
}

/** Indeks w miasta_panstwa: 0 = stolica, 1..N-1 = rywale (zawijanie przy >9 rywalach). */
export function rivalPoolIndex(rivalIndex1Based: number, poolLen: number): number {
  if (poolLen <= 1) return 0;
  const rivalSlots = poolLen - 1;
  return ((Math.max(1, rivalIndex1Based) - 1) % rivalSlots) + 1;
}

/** Nazwa państwa-miasta (indeks 0 = stolica gracza / obca stolica klastra). */
export function stateCityNameAt(
  pools: CityNamesPoolsData,
  ikonaId: string,
  index: number,
  fallback: string,
): string {
  const pan = poolEntry(pools, ikonaId)?.miasta_panstwa;
  if (!pan?.length) return fallback;
  const idx = index >= 1 ? rivalPoolIndex(index, pan.length) : index;
  if (idx >= 0 && idx < pan.length && pan[idx]) {
    return pan[idx] as string;
  }
  return fallback;
}

/**
 * N-1A: stolica GRACZA = `miasta_cywilizacji[0]`.
 *
 * R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1, runda 3 (R3-2) — NAPRAWA BŁĘDU, symetryczna do
 * naprawionego w rundzie 2 `foreignCapitalFromPool`: do tej pory pierwsze miasto gracza szło
 * przez `stateCityNameAt(..., 0)`, czyli przez pulę PAŃSTW-MIAST (`miasta_panstwa`). Dla
 * 13 z 15 cywilizacji obie pule mają na pozycji 0 to samo, więc różnicy nie było widać; dwa
 * wyjątki to dokładnie ta sama klasa pomyłki, którą właściciel zgłosił dla AI, tylko po jego
 * własnej stronie: gracz-Chińczyk startował w mieście `Qin` (nazwa państwa i dynastii, NIE
 * miasta) zamiast `Xi'an`, gracz-Słowianin w `Kiev` zamiast `Kijów`.
 * Stolica IMPERIUM należy do listy miast cywilizacji; `miasta_panstwa` opisuje miasta-państwa
 * klastra i zostaje źródłem dla `clusterRivalFromPool` (indeksy 1..N-1).
 *
 * BEZ DUPLIKATU NAZW: obce klastry pomijają typ gracza (`cluster-spawn.ts:332`), a rywale
 * tego samego typu biorą nazwy z `miasta_panstwa[1..]` (`clusterRivalCityName`), więc żadne
 * inne miasto w partii nie sięga po `miasta_cywilizacji[0]` cywilizacji gracza.
 *
 * Fallback zachowany bez zmian: brak listy miast cywilizacji → stara ścieżka
 * (`miasta_panstwa[0]`, dalej `'Stolica'`), żeby niekompletna pula nie dawała pustej nazwy.
 */
export function playerCapitalFromPool(pools: CityNamesPoolsData, ikonaId: string): string {
  const first = poolEntry(pools, ikonaId)?.miasta_cywilizacji?.[0];
  if (first) return first;
  return stateCityNameAt(pools, ikonaId, 0, 'Stolica');
}

/**
 * N-2A / N-3A: rywal klastra (1-based).
 * Indeksy 1..(len-1) z miasta_panstwa; powyżej — kolejne unikalne z miasta_cywilizacji
 * (MAX_MIAST_PANSTWA=9 vs 10 nazw klastra — indeksy 1..9 z puli, bez „Rywal N").
 */
export function clusterRivalFromPool(
  pools: CityNamesPoolsData,
  ikonaId: string,
  rivalIndex1Based: number,
): string {
  const entry = poolEntry(pools, ikonaId);
  const pan = entry?.miasta_panstwa ?? [];
  const fallback = `Rywal ${rivalIndex1Based}`;

  if (!pan.length || rivalIndex1Based < 1) {
    return fallback;
  }

  const rivalSlots = pan.length - 1;

  if (rivalIndex1Based <= rivalSlots) {
    const idx = rivalPoolIndex(rivalIndex1Based, pan.length);
    const name = pan[idx];
    if (name) return name;
  }

  const regular = entry?.miasta_cywilizacji ?? [];
  const usedInCluster = new Set(pan.filter(Boolean));
  const overflowIndex = rivalIndex1Based - rivalSlots - 1;

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
 * to przez `stateCityNameAt(..., 0)`, czyli przez pulę PAŃSTW-MIAST (`miasta_panstwa`).
 * Dla 13 z 15 cywilizacji obie pule mają na pozycji 0 to samo, więc różnicy nie było widać;
 * dwa wyjątki widać w grze: Chińczycy dostawali `Qin` (nazwa państwa i dynastii, NIE miasta —
 * to dosłownie napis ze zrzutu właściciela) zamiast `Xi'an`, Słowianie `Kiev` zamiast `Kijów`.
 * Stolica IMPERIUM należy do listy miast cywilizacji; `miasta_panstwa` opisuje miasta-państwa
 * klastra i zostaje źródłem dla `playerCapitalFromPool`/`clusterRivalFromPool`.
 *
 * Fallback zachowany bez zmian: brak listy miast cywilizacji → stara ścieżka
 * (`miasta_panstwa[0]`, dalej `ikonaId`), żeby niekompletna pula nie dawała pustej nazwy.
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
  civs: CivsForCityNames,
  ikonaId: string,
  index: number,
  fallback: string,
): string {
  if (pools?.[ikonaId]) {
    return stateCityNameAt(pools, ikonaId, index, fallback);
  }
  const names = civs.cywilizacje.find(c => c.ikonaId === ikonaId)?.nazwyKlastra ?? [];
  const idx = index >= 1 ? rivalPoolIndex(index, names.length) : index;
  return nazwaKlastraAt(names, idx, fallback);
}

/** Sprawdza zgodność miasta_panstwa z nazwyKlastra (ostrzeżenie przy rozjazdach). */
export function diffPoolsVsNazwyKlastra(
  pools: CityNamesPoolsData,
  civs: CivsForCityNames,
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
