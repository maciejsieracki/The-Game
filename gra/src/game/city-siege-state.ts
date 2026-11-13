/**
 * R-WEB-SIEGE-BLOCKADE-NO-RECRUIT-REINFORCE-Q1 -- JEDEN wspólny predykat „miasto pod oblężeniem".
 *
 * Reguła właściciela (2026-11-04): w obleganym mieście nie wolno rekrutować, nie ma posiłków,
 * a jednostki spoza miasta nie mogą do niego wejść. Dotyczy gracza, AI i barbarzyńców jednakowo.
 *
 * Źródło prawdy o oblężeniu: flaga `City.oblegane` (ustawiana przez startMapSiege / endMapSiege).
 * Czysty moduł -- bez DOM/THREE/stanu globalnego (poza rejestrem blokady wejścia w units/setup).
 */

/** Minimalny kształt miasta potrzebny do predykatów. */
export interface SiegeStateCity {
  id: string;
  q: number;
  r: number;
  ownerId: number;
  oblegane?: boolean;
  oblegajacyOwnerId?: number;
}

/** Powód widoczny w UI (PL). */
export const CITY_SIEGE_BLOCK_REASON_PL = 'Miasto jest oblężone';
export const CITY_SIEGE_RECRUIT_BLOCK_PL = 'Miasto jest oblężone — rekrutacja zablokowana';
export const CITY_SIEGE_ENTRY_BLOCK_PL = 'Miasto jest oblężone — wejście zablokowane';

/**
 * Czy miasto jest oblegane. Argument: obiekt miasta, id miasta albo heks {q,r}.
 * Brak miasta (nieznane id / pusty heks) => false.
 */
export function isCityUnderSiege(
  cities: ReadonlyArray<SiegeStateCity>,
  target: string | { q: number; r: number } | SiegeStateCity,
): boolean {
  if (typeof target === 'string') {
    return cities.find(c => c.id === target)?.oblegane === true;
  }
  if ('id' in target && 'ownerId' in target) {
    // Obiekt miasta: bierzemy żywy stan z listy (gdy jest), inaczej z samego obiektu.
    const live = cities.find(c => c.id === target.id);
    return (live ?? target).oblegane === true;
  }
  return cities.some(c => c.q === target.q && c.r === target.r && c.oblegane === true);
}

/** Miasto oblegane stojące na heksie (q,r) albo null. */
export function besiegedCityAtHex(
  cities: ReadonlyArray<SiegeStateCity>,
  q: number,
  r: number,
): SiegeStateCity | null {
  return cities.find(c => c.q === q && c.r === r && c.oblegane === true) ?? null;
}

/** Klucze heksów (`q,r`) wszystkich obleganych miast. */
export function besiegedCityHexKeys(cities: ReadonlyArray<SiegeStateCity>): Set<string> {
  const out = new Set<string>();
  for (const c of cities) if (c.oblegane === true) out.add(`${c.q},${c.r}`);
  return out;
}

/**
 * Czy `unit` NIE MOŻE wejść na heks (q,r) z powodu oblężenia.
 * Blokada: heks obleganego miasta, jednostka stoi gdzie indziej (już-wewnątrz wolno wyjść i wrócić
 * w obrębie własnego heksu), a jednostka NIE jest wrogiem właściciela miasta (własna/sojusznicza/
 * neutralna). Wróg właściciela (oblegający / szturmujący) wchodzi -- to atak, nie posiłki.
 * `areEnemyOwners` -- ta sama relacja wojny co w startMapSiege.
 */
export function isSiegeEntryBlocked(
  cities: ReadonlyArray<SiegeStateCity>,
  unit: { ownerId: number; q: number; r: number },
  q: number,
  r: number,
  areEnemyOwners: (a: number, b: number) => boolean,
): boolean {
  if (unit.q === q && unit.r === r) return false;
  const city = besiegedCityAtHex(cities, q, r);
  if (!city) return false;
  if (unit.ownerId !== city.ownerId && areEnemyOwners(unit.ownerId, city.ownerId)) return false;
  return true;
}
