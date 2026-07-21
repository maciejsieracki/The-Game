/**
 * startScoring.ts — wybór preferowanego hexu startu gracza (lane MAPA / SILNIK).
 *
 * Maciej 2026-06-27: przy generacji świata wybieramy najlepsze miejsce na pierwsze miasto
 * (blisko rzeki, pola uprawne, góry w zasięgu). Wokół tego hexu oświetlamy START_REVEAL_RADIUS.
 */

import type { GameMap } from '../types/map';
import { TerenBazowy } from '../types/hex';
import { hexDistance, keyOf } from '../units/setup';

/** Domyślny promień (legacy / testy) — w grze używaj {@link startRevealRadiusForDifficulty}. */
export const START_REVEAL_RADIUS = 5;

/** Promień oświetlenia preferowanego startu (Maciej 2026-06-27). */
export function startRevealRadiusForDifficulty(diff: 'easy' | 'normal' | 'hard'): number {
  switch (diff) {
    case 'easy': return 10;
    case 'hard': return 5;
    default: return 8;
  }
}

const NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [+1, 0], [-1, 0], [0, +1], [0, -1], [+1, -1], [-1, +1],
] as const;

function hexAt(map: GameMap, q: number, r: number) {
  return map.hexes[keyOf(q, r)];
}

function hasRiver(map: GameMap, q: number, r: number): boolean {
  return hexAt(map, q, r)?.rzeka?.obecna === true;
}

function isArable(tb: TerenBazowy): boolean {
  return tb === TerenBazowy.Laka || tb === TerenBazowy.Rownina;
}

function canFoundOnTerrain(tb: TerenBazowy): boolean {
  return tb !== TerenBazowy.Morze
    && tb !== TerenBazowy.Wybrzeze
    && tb !== TerenBazowy.Gory;
}

/**
 * Punktacja hexu jako preferowanego startu (wyżej = lepiej).
 * Rzeka + pola uprawne w okolicy + góry w dystansie 2–4.
 */
export function scoreCityStartHex(map: GameMap, q: number, r: number): number {
  const hex = hexAt(map, q, r);
  if (!hex || !canFoundOnTerrain(hex.terenBazowy)) return -Infinity;

  let score = 0;

  switch (hex.terenBazowy) {
    case TerenBazowy.Laka:
    case TerenBazowy.Rownina:
      score += 6;
      break;
    case TerenBazowy.Wzgorza:
      score += 3;
      break;
    case TerenBazowy.Pustynia:
      score += 1;
      break;
    default:
      score += 2;
  }

  if (hasRiver(map, q, r)) score += 14;

  let adjRiver = false;
  for (const [dq, dr] of NEIGHBORS) {
    if (hasRiver(map, q + dq, r + dr)) adjRiver = true;
  }
  if (adjRiver) score += 8;

  for (let dq = -4; dq <= 4; dq++) {
    for (let dr = -4; dr <= 4; dr++) {
      const dist = hexDistance(q, r, q + dq, r + dr);
      if (dist === 0 || dist > 4) continue;
      const nb = hexAt(map, q + dq, r + dr);
      if (!nb) continue;
      if (isArable(nb.terenBazowy)) score += dist <= 2 ? 2 : 0.5;
      if (dist >= 2 && dist <= 4) {
        if (nb.terenBazowy === TerenBazowy.Gory) score += 3;
        else if (nb.terenBazowy === TerenBazowy.Wzgorza) score += 1.5;
      }
    }
  }

  return score;
}

/**
 * Najlepszy hex startu gracza — deterministyczny tie-break: bliżej centrum mapy.
 */
export function findBestPlayerStartHex(map: GameMap): { q: number; r: number } | null {
  const cq = Math.round((map.szerokoscQ - 1) / 2);
  const cr = Math.round((map.wysokoscR - 1) / 2);

  let best: { q: number; r: number } | null = null;
  let bestScore = -Infinity;
  let bestCenterDist = Infinity;

  for (const hex of Object.values(map.hexes)) {
    const { q, r } = hex.coords;
    const s = scoreCityStartHex(map, q, r);
    if (s === -Infinity) continue;
    const cd = hexDistance(q, r, cq, cr);
    if (s > bestScore || (s === bestScore && cd < bestCenterDist)) {
      bestScore = s;
      bestCenterDist = cd;
      best = { q, r };
    }
  }

  return best;
}
