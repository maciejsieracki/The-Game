/**
 * R-WEB-DETERMINISM-DIGEST-NORMALIZE-STACKGROUP-Q1 — normalizacja digestu stanu testowego (`__detHarness.digest`).
 *
 * `stackGroupId` powstaje z `Date.now()` (armyMerge.freshStackGroupId), więc dwa przebiegi tego samego ziarna
 * różnią się WYŁĄCZNIE wartością identyfikatora, nie strukturą grup. Ta funkcja zastępuje każdy identyfikator
 * kanonicznym indeksem `g0, g1, …` w kolejności pierwszego wystąpienia w stabilnie posortowanej liście jednostek
 * (potem miast). Zachowana jest relacja równości: te same grupy → ten sam indeks; różne grupy → różne indeksy.
 *
 * Czysta funkcja: nie zmienia wejścia, nie dotyka logiki gry, armyMerge ani formatu zapisu.
 * Używana WYŁĄCZNIE przez hak testowy pod ?civTest=1 (main.ts, blok __detHarness).
 */

export interface DetDigestUnitLike {
  id?: unknown;
  stackGroupId?: string;
}

export interface DetDigestCityLike {
  siegeArmyGroupId?: string;
}

export interface DetDigestNormalized<U, C> {
  units: U[];
  cities: C[];
}

/** Stabilne sortowanie jednostek po id (liczbowo, gdy oba są liczbami; inaczej tekstowo); remis → kolejność tablicy. */
function sortUnitsStable<U extends DetDigestUnitLike>(units: readonly U[]): U[] {
  return units
    .map((u, i) => ({ u, i }))
    .sort((a, b) => {
      const ia = a.u.id;
      const ib = b.u.id;
      if (typeof ia === 'number' && typeof ib === 'number' && ia !== ib) return ia - ib;
      const sa = String(ia ?? '');
      const sb = String(ib ?? '');
      if (sa !== sb) return sa < sb ? -1 : 1;
      return a.i - b.i;
    })
    .map(x => x.u);
}

/**
 * Zwraca kopie jednostek i miast, w których każdy `stackGroupId` / `siegeArmyGroupId` zastąpiono
 * kanonicznym indeksem. Pola nieobecne (undefined) pozostają nieobecne, kolejność kluczy zachowana.
 */
export function normalizeDetDigestStackGroups<U extends DetDigestUnitLike, C extends DetDigestCityLike>(
  units: readonly U[],
  cities: readonly C[],
): DetDigestNormalized<U, C> {
  const canon = new Map<string, string>();
  const canonOf = (raw: string): string => {
    let c = canon.get(raw);
    if (c === undefined) {
      c = 'g' + canon.size;
      canon.set(raw, c);
    }
    return c;
  };
  // Numeracja: pierwsze wystąpienie w stabilnie posortowanej liście jednostek, potem w miastach.
  for (const u of sortUnitsStable(units)) {
    if (typeof u.stackGroupId === 'string') canonOf(u.stackGroupId);
  }
  for (const c of cities) {
    if (typeof c.siegeArmyGroupId === 'string') canonOf(c.siegeArmyGroupId);
  }
  // Wyjście: kolejność tablicy zachowana (rozjazd kolejności też widoczny w digeście).
  const outUnits = units.map(u => (typeof u.stackGroupId === 'string'
    ? { ...u, stackGroupId: canonOf(u.stackGroupId) }
    : { ...u }));
  const outCities = cities.map(c => (typeof c.siegeArmyGroupId === 'string'
    ? { ...c, siegeArmyGroupId: canonOf(c.siegeArmyGroupId) }
    : { ...c }));
  return { units: outUnits, cities: outCities };
}
