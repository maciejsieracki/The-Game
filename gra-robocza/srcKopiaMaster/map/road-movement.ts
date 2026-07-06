/**
 * map/road-movement.ts (lane Grupa A / MAPA)
 * Bonus ruchu na Droga / Droga brukowana — źródło: terrain-improvements.json (bonus_ruch).
 * UNITS/setup.ts wywołuje applyRoadMovementModifier po koszcie bazowym + las.
 */
import type { Hex } from '../types/hex';
import { Ulepszenie } from '../types/hex';
import { improvementKeysForHex } from '../game/terrain-improvements';
import terrainImprovements from '../../data/terrain-improvements.json';

/** Droga zwykła: ruch 3× szybciej — koszt wejścia ÷ 3. */
export const ROAD_MOVE_SPEED_MULT = 3;

/** Minimalny koszt wejścia na hex z ulepszeniem drogowym (Dijkstra używa ułamków). */
export const ROAD_MIN_MOVE_COST = 1 / 3;

type JsonRoadRow = { bonus_ruch?: number };

const RAW = terrainImprovements as Record<string, JsonRoadRow>;

/** bonus_ruch z JSON (domyślnie 2 dla droga_brukowana). */
export function cobblestoneMoveBonus(): number {
  return RAW.droga_brukowana?.bonus_ruch ?? 2;
}

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
    const bonus = cobblestoneMoveBonus();
    return Math.max(ROAD_MIN_MOVE_COST, cost - bonus);
  }
  if (keys.includes('droga') || hex.ulepszenie === Ulepszenie.Droga) {
    return cost / ROAD_MOVE_SPEED_MULT;
  }
  return cost;
}
