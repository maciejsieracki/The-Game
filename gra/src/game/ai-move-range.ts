/**
 * Zasięg ruchu AI / barbarzyńców / miast-państw (R-WEB-AI-MOVE-RANGE-Q1).
 *
 * PURE: bez DOM, bez stanu gry. Gracz porusza się po trasie skracanej do budżetu
 * ruchu (`truncatePathToBudget` w planned-march.ts, koszt terenu + MIN-MOVE). AI
 * planowało krok po kroku tylko pierwszym heksem trasy (`firstStep` = path[0]),
 * więc jednostka z budżetem N schodziła o 1 heks na turę. Ten moduł daje tę samą
 * semantykę co gracz, liniowo (jeden przebieg po trasie zamiast O(n^2)).
 */

import type { GameMap } from '../types/map';
import type { Hex } from '../types/hex';
import { keyOf, terrainMoveCost } from '../units/setup';

export type MoveCostFn = (hex: Hex) => number;

/**
 * Najdłuższy prefiks `path` (kolejność: pierwszy krok ... cel) mieszczący się w
 * `budget` punktów ruchu wg `costFn` (koszt wejścia na każdy heks). MIN-MOVE
 * (spójne z computeReachable): przy budget >= 1 pierwszy przejezdny heks zawsze
 * wchodzi, nawet gdy jego koszt > budget. Heks nieprzejezdny (Infinity) kończy
 * prefiks. Zwraca pustą tablicę, gdy budget <= 0 lub ścieżka pusta.
 */
export function truncatePathWithinBudget(
  path: readonly { q: number; r: number }[],
  budget: number,
  map: GameMap,
  costFn: MoveCostFn = terrainMoveCost,
): { q: number; r: number }[] {
  if (!(budget > 0) || path.length === 0) return [];
  const out: { q: number; r: number }[] = [];
  let spent = 0;
  for (const h of path) {
    const hex = map.hexes[keyOf(h.q, h.r)];
    if (hex === undefined) break;
    const c = costFn(hex);
    if (c === Infinity) break;
    if (spent + c > budget) break;
    spent += c;
    out.push({ q: h.q, r: h.r });
  }
  if (out.length === 0) {
    const first = path[0]!;
    const hex = map.hexes[keyOf(first.q, first.r)];
    if (budget >= 1 && hex !== undefined && costFn(hex) !== Infinity) {
      out.push({ q: first.q, r: first.r });
    }
  }
  return out;
}

/**
 * Najdalszy heks trasy, na który jednostka dojdzie w tej turze, NIE wchodząc na
 * heks docelowy trasy (ostatni element `path`). Heks docelowy zostaje poza
 * wyborem: cel-miasto/cel-jednostka rozstrzyga osobna logika (atak, przejęcie),
 * a teleport na obcy zajęty heks byłby zmianą reguł. Zwraca null, gdy budżet
 * <= 0 albo trasa nie ma heksu pośredniego -- wołający wtedy używa path[0].
 */
export function farthestStepWithinBudget(
  path: readonly { q: number; r: number }[],
  budget: number,
  map: GameMap,
  costFn: MoveCostFn = terrainMoveCost,
): { q: number; r: number } | null {
  if (!(budget > 0) || path.length < 2) return null;
  const cut = truncatePathWithinBudget(path.slice(0, -1), budget, map, costFn);
  return cut.length > 0 ? cut[cut.length - 1]! : null;
}
