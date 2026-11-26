/**
 * mennica-orphan.ts -- R-WEB-MINT-ORPHAN-Q1 (odp. 17, własna reguła właściciela, 2026-11-26).
 *
 * Reguła Mennicy po przeniesieniu stolicy:
 *  - Mennica poza stolicą jest NIEAKTYWNA (bez bonusu) i NIE znika sama (aktywność liczy
 *    turn-economy.ts ownersWithMennica przez resolver stolicy).
 *  - Po UKOŃCZENIU nowej Mennicy w stolicy wszystkie stare Mennice tego właściciela stojące
 *    w miastach niebędących stolicą ZNIKAJĄ (bez zwrotu) -- to jest ta funkcja.
 *  - Mennica zawsze musi stać w stolicy: poza stolicą nie wolno jej już ani zbudować, ani
 *    utrzymać jako aktywnej.
 *  - Wyburzenie (demolish) Mennicy jest możliwe w dowolnym mieście; helper `demolishBuildingIds`.
 *
 * Moduł czysty (bez DOM, bez stanu). Wołany z main.ts applyProductionCompleted.
 */

export const MENNICA_BUILDING_ID = 'mennica';

export interface MennicaCityRef {
  readonly id: string;
  readonly ownerId: number;
}

/**
 * Zwraca id miast (≠ stolica) tego właściciela, w których stoi Mennica, które należy usunąć
 * po ukończeniu nowej Mennicy w stolicy. Pusta lista, gdy stolica nie ma Mennicy (hook odpala
 * się wyłącznie po ukończeniu w stolicy, więc to zabezpieczenie) albo gdy nic nie stoi poza stolicą.
 */
export function mennicaCityIdsReplacedByCapital(
  cities: ReadonlyArray<MennicaCityRef>,
  builtByCity: ReadonlyMap<string, readonly string[]>,
  ownerId: number,
  capitalCityId: string | null,
): string[] {
  if (capitalCityId === null) return [];
  if (!(builtByCity.get(capitalCityId) ?? []).includes(MENNICA_BUILDING_ID)) return [];
  const out: string[] = [];
  for (const c of cities) {
    if (c.ownerId !== ownerId || c.id === capitalCityId) continue;
    if ((builtByCity.get(c.id) ?? []).includes(MENNICA_BUILDING_ID)) out.push(c.id);
  }
  return out;
}

/** Usuwa Mennicę z listy zbudowanych budynków miasta (bez zwrotu). Zwraca nową tablicę. */
export function builtWithoutMennica(built: readonly string[]): string[] {
  return built.filter(id => id !== MENNICA_BUILDING_ID);
}

/**
 * Wyburzenie budynku z listy zbudowanych miasta (bez zwrotu surowców). Zwraca nową tablicę,
 * albo `null`, gdy budynku nie ma (nic do wyburzenia). Czysta funkcja -- UI/silnik decyduje,
 * kiedy ją wywołać.
 */
export function demolishBuildingIds(
  built: readonly string[],
  buildingId: string,
): string[] | null {
  if (!built.includes(buildingId)) return null;
  return built.filter(id => id !== buildingId);
}

/**
 * Hook po UKOŃCZENIU budynku (wołany z main.ts applyProductionCompleted, po zapisaniu budynku
 * w `builtByCity`). Gdy ukończona Mennica stoi w stolicy właściciela, usuwa (bez zwrotu) stare
 * Mennice tego właściciela w pozostałych miastach. Mutuje `builtByCity`. Zwraca id miast, z których
 * usunięto Mennicę (pusta lista, gdy hook nic nie robi). Ta sama funkcja jest testowana przez
 * mint-orphan-test.cjs.
 */
export function applyMennicaCompletedInCapital(
  cities: ReadonlyArray<MennicaCityRef>,
  builtByCity: Map<string, string[]>,
  ownerId: number,
  completedBuildingId: string,
  completedCityId: string,
  capitalCityId: string | null,
): string[] {
  if (completedBuildingId !== MENNICA_BUILDING_ID) return [];
  if (capitalCityId === null || capitalCityId !== completedCityId) return [];
  const removed = mennicaCityIdsReplacedByCapital(cities, builtByCity, ownerId, capitalCityId);
  for (const id of removed) {
    builtByCity.set(id, builtWithoutMennica(builtByCity.get(id) ?? []));
  }
  return removed;
}
