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
 * Najdalszy heks trasy, na który jednostka dojdzie w tej turze. Heks docelowy
 * (ostatni element `path`) jest krokiem TYLKO gdy mieści się w budżecie i nie jest
 * zablokowany (`blockedKeys`, np. zajęty przez jednostkę / obce miasto): jak u
 * gracza wchodzi się na cel w tej samej turze. Zajęty cel zostaje poza wyborem --
 * wtedy wołający dochodzi do sąsiedniego heksu, a atak/przejęcie zostaje w
 * istniejącej logice. Zwraca null, gdy budżet <= 0 albo trasa nie ma heksu
 * wybieralnego (path.length < 2) -- wołający wtedy używa path[0] (zachowanie sprzed).
 */
export function farthestStepWithinBudget(
  path: readonly { q: number; r: number }[],
  budget: number,
  map: GameMap,
  costFn: MoveCostFn = terrainMoveCost,
  blockedKeys?: ReadonlySet<string>,
): { q: number; r: number } | null {
  if (!(budget > 0) || path.length < 2) return null;
  const cut = truncatePathWithinBudget(path, budget, map, costFn);
  let end = cut.length;
  while (end > 0 && blockedKeys !== undefined
    && blockedKeys.has(keyOf(cut[end - 1]!.q, cut[end - 1]!.r))) end--;
  return end > 0 ? cut[end - 1]! : null;
}
