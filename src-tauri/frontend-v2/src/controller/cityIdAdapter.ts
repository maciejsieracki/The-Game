/**
 * controller/cityIdAdapter.ts — JEDNO miejsce mapowania id miasta: port v2 (`CityId = number`, `viewmodel/types.ts:22`)
 * ↔ pin (`City.id: string`, `gra/src/game/cities.ts:835`) — P5-8 K09B, zadanie (2) dispatchu, zamknięcie K08D-Z10.
 *
 * Reguły:
 *   - port → silnik: wyłącznie nieujemna liczba całkowita bezpieczna (`Number.isSafeInteger`), zapis kanoniczny
 *     (dziesiętny, bez zer wiodących). Inne wartości = wyjątek (`RangeError`), nie cicha konwersja.
 *   - silnik → port: wyłącznie ciąg kanonicznej liczby (`/^(0|[1-9][0-9]*)$/`) mieszczącej się w bezpiecznym zakresie.
 *   - Id niebędące kanoniczną liczbą (np. `bc_…`) NIE są mapowane tym adapterem: zgłaszają wyjątek (dług K09B-D3).
 * Adapter nie liczy reguł gry (P5.13).
 */

const CANONICAL_ID = /^(0|[1-9][0-9]*)$/;

/** Port (number) → id silnika (string). Rzuca dla wartości, których nie da się odwzorować bez utraty informacji. */
export function cityIdToEngine(id: number): string {
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id < 0) {
    throw new RangeError(`cityIdAdapter: id miasta portu musi być nieujemną liczbą całkowitą, dostałem ${String(id)}`);
  }
  return String(id);
}

/** Id silnika (string) → port (number). Rzuca dla ciągów niekanonicznych lub poza zakresem. */
export function cityIdFromEngine(id: string): number {
  if (typeof id !== 'string' || !CANONICAL_ID.test(id)) {
    throw new RangeError(`cityIdAdapter: id silnika musi być kanonicznym ciągiem liczby, dostałem ${JSON.stringify(id)}`);
  }
  const n = Number(id);
  if (!Number.isSafeInteger(n)) {
    throw new RangeError(`cityIdAdapter: id silnika poza bezpiecznym zakresem: ${id}`);
  }
  return n;
}

/**
 * Akceptuje id w dowolnej z dwóch postaci (hooki K06A/K07A bywają wołane z `city.id` = number mimo typu `string` pinu)
 * i zwraca kanoniczny string silnika. Ciąg musi być kanoniczny; liczba przechodzi przez `cityIdToEngine`.
 */
export function toEngineCityId(id: string | number): string {
  if (typeof id === 'number') return cityIdToEngine(id);
  cityIdFromEngine(id);
  return id;
}

/**
 * Opakowuje hook pinu typowany `(cityId: string, …)` tak, by przyjmował id portu (number) i przekazywał silnikowi
 * kanoniczny string. `undefined` zostaje `undefined` (brak haku = gałąź pinu `?.` pominięta).
 */
export function engineIdHook<A extends unknown[], R>(
  fn: ((cityId: string, ...rest: A) => R) | undefined,
): ((cityId: string | number, ...rest: A) => R) | undefined {
  if (fn === undefined) return undefined;
  return (cityId, ...rest) => fn(toEngineCityId(cityId), ...rest);
}
