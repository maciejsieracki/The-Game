/**
 * map/road-movement.ts (lane Grupa A / MAPA)
 * Mnożniki szybkości ruchu na Droga / Droga brukowana — STAŁE (nie z JSON),
 * R-DROGI-RUCH-HANDEL-Q1 (Maciej 2026-08-14): droga ÷3, droga brukowana ÷5.
 * UNITS/setup.ts wywołuje applyRoadMovementModifier po koszcie bazowym + las.
 * / EN: fixed (non-JSON-driven) speed multipliers for road / cobblestone road
 * movement cost — plain road ÷3, cobblestone road ÷5.
 */
import type { Hex } from '../types/hex';
import { Ulepszenie } from '../types/hex';
import { improvementKeysForHex } from '../game/terrain-improvements';

/** Droga zwykła: ruch 3× szybciej — koszt wejścia ÷ 3. */
export const ROAD_MOVE_SPEED_MULT = 3;

/**
 * Droga brukowana: ruch 5× szybciej — koszt wejścia ÷ 5 (R-DROGI-RUCH-HANDEL-Q1,
 * Maciej 2026-08-14, cytat: „po drodze brukowanej pięć razy szybszy [ruch]”).
 * Wcześniej mechanika ODEJMOWANIA stałej `bonus_ruch` z JSON (domyślnie 2) —
 * zastąpiona DZIELENIEM, analogicznie do zwykłej drogi, dla spójności obu ulepszeń.
 * Pole `bonus_ruch` w terrain-improvements.json (droga_brukowana) jest od tej
 * zmiany MARTWE/nieczytane — historyczne, zostawione jako opisowa migawka starej
 * mechaniki, nie usunięte z danych żeby nie tracić kontekstu w JSON.
 * / EN: previously a JSON-driven subtraction (`bonus_ruch`, default 2) — replaced
 * with division, mirroring the plain road mechanic, for consistency between the
 * two improvements. The `bonus_ruch` field in the JSON is now dead/unread data,
 * kept only as a descriptive trace of the old mechanic.
 */
export const ROAD_BRUK_MOVE_SPEED_MULT = 5;

/** Minimalny koszt wejścia na hex z ulepszeniem drogowym (Dijkstra używa ułamków). */
export const ROAD_MIN_MOVE_COST = 1 / 3;

export function isRoadImprovementKey(key: string): boolean {
  return key === 'droga' || key === 'droga_brukowana';
}

/** Czy heks należy do sieci dróg (droga lub bruk). */
export function hexHasRoad(hex: Pick<Hex, 'ulepszenie'> & { ulepszenia?: readonly string[] | null }): boolean {
  const keys = improvementKeysForHex(hex);
  return keys.some(isRoadImprovementKey);
}

/**
 * Modyfikuje koszt wejścia na hex po uwzględnieniu terenu i lasu.
 * Priorytet: bruk (upgrade) > zwykła droga.
 */
export function applyRoadMovementModifier(cost: number, hex: Hex): number {
  if (cost === Infinity) return Infinity;
  const keys = improvementKeysForHex(hex);
  if (keys.includes('droga_brukowana')
    || hex.ulepszenie === Ulepszenie.DrogaBrukowana) {
    return Math.max(ROAD_MIN_MOVE_COST, cost / ROAD_BRUK_MOVE_SPEED_MULT);
  }
  if (keys.includes('droga') || hex.ulepszenie === Ulepszenie.Droga) {
    return cost / ROAD_MOVE_SPEED_MULT;
  }
  return cost;
}
