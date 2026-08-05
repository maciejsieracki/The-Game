/**
 * R-PIERWSZE-MIASTO (decyzja B): gracz z 0 miast może wyłącznie założyć pierwsze
 * miasto w oświetlonym kręgu startu — bez ruchu osadnika i bez innych akcji.
 * Dotyczy tylko gracza (ownerId === 0); bez parytetu AI.
 */

export const FIRST_CITY_START_REVEAL_DENIED = 'poza oświetlonym obszarem startu';

export interface CityOwnerRef {
  ownerId: number;
}

/** Czy gracz nadal czeka na założenie pierwszego miasta (0 miast + nigdy nie miał). */
export function isAwaitingFirstPlayerCity(
  playerEverOwnedCity: boolean,
  cities: readonly CityOwnerRef[],
  playerOwnerId = 0,
): boolean {
  return !playerEverOwnedCity && !cities.some(c => c.ownerId === playerOwnerId);
}

/** Czy heks jest w oświetlonym kręgu startu (przed pierwszym miastem gracza). */
export function isHexInStartReveal(
  q: number,
  r: number,
  awaitingFirstCity: boolean,
  playerStartHex: { q: number; r: number } | null,
  startRevealRadius: number,
  hexDistance: (aq: number, ar: number, bq: number, br: number) => number,
): boolean {
  if (!awaitingFirstCity || playerStartHex === null) return true;
  return hexDistance(q, r, playerStartHex.q, playerStartHex.r) <= startRevealRadius;
}

/** Dodatkowa walidacja założenia pierwszego miasta gracza (krąg startu). */
export function validateFirstPlayerCityPlacement(
  q: number,
  r: number,
  awaitingFirstCity: boolean,
  inStartReveal: boolean,
  baseOk: boolean,
  baseReason = '',
): { ok: boolean; reason: string } {
  if (!baseOk) return { ok: false, reason: baseReason };
  if (awaitingFirstCity && !inStartReveal) {
    return { ok: false, reason: FIRST_CITY_START_REVEAL_DENIED };
  }
  return { ok: true, reason: '' };
}
