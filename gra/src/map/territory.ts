/**
 * map/territory.ts
 * Kontrakt dla SILNIK: isInTerritory(q,r,nodes) bramkuje zakładanie miast/ulepszeń.
 * Zasięg MIASTA = max(5, pop) cap 15 (okolica+terytorium, Maciej 2026-06-27).
 * Posterunek +5, fort +10 (stałe). Formuła: EKONOMIA okolica.ts.
 * EKONOMIA owns formułę/cap; MAPA egzekwuje + rysuje linię.
 *
 * Ten moduł NIE ma żadnych zależności od Three.js ani warstwy renderowania.
 * SILNIK importuje bezpośrednio: import { isInTerritory, CityNode } from './map/territory'.
 */

import { cityRangeForPopulation } from '../game/okolica';

// ============================================================
// INTERFEJS WĘZŁA MIASTA / POSTERUNKU / FORTU
// ============================================================

/**
 * Minimalny opis węzła terytorium.
 * Pole `civ` to opcjonalny string (klucz cywilizacji, np. 'grecja').
 * Pole `isOutpost?: boolean` domyślnie false (brak = miasto).
 */
export interface CityNode {
  q: number;
  r: number;
  isOutpost?: boolean;
  isFort?: boolean;
  /** Populacja — wyznacza zasięg terytorium (radius = pop, cap 15) */
  pop: number;
  /** Poziom budowy — pozostaje w interfejsie dla kompatybilności; nie używany w radiusie */
  level: number;
  /** Opcjonalny klucz cywilizacji (string, np. 'grecja', 'rzym') */
  civ?: string;
}

/** Węzeł terytorium z właścicielem — do skanów dyplomacji (P5 przemarsz). */
export type TerritoryNode = CityNode & { ownerId: number };

// ============================================================
// ODLEGŁOŚĆ AKSJALNA (kostka)
// ============================================================

/**
 * Dystans aksjalno-kubiczny między dwoma heksami.
 * Wzór: (|aq-bq| + |ar-br| + |as-bs|) / 2, gdzie s = -q-r.
 */
export function axialDistance(aq: number, ar: number, bq: number, br: number): number {
  const as_ = -aq - ar;
  const bs  = -bq - br;
  return (Math.abs(aq - bq) + Math.abs(ar - br) + Math.abs(as_ - bs)) / 2;
}

// ============================================================
// FORMUŁA ZASIĘGU MIASTA (EKONOMIA owns, MAPA egzekwuje)
// ============================================================

export {
  cityRangeForPopulation,
  citySightRadius,
  CITY_RANGE_CAP,
  CITY_RANGE_MIN,
} from '../game/okolica';

// ============================================================
// PROMIEŃ TERYTORIUM WĘZŁA
// ============================================================

/**
 * Zwraca promień terytorium (w heksach) dla danego węzła:
 *   - FORT:      r = 10  (stały)
 *   - POSTERUNEK: r = 5  (stały)
 *   - MIASTO:    r = max(5, pop), cap 15
 */
export function cityTerritoryRadius(node: CityNode): number {
  if (node.isFort)    return 10;
  if (node.isOutpost) return 5;
  return cityRangeForPopulation(node.pop);
}

// ============================================================
// TEST TERYTORIUM
// ============================================================

/**
 * Zwraca true, jeśli heks (q,r) leży w terytorium KTÓREGOKOLWIEK
 * węzła z listy `nodes` (miasto/posterunek/fort).
 *
 * Użycie przez SILNIK:
 *   import { isInTerritory } from './map/territory';
 *   const ok = isInTerritory(q, r, playerState.cityNodes);
 */
export function isInTerritory(q: number, r: number, nodes: CityNode[]): boolean {
  for (const node of nodes) {
    if (axialDistance(q, r, node.q, node.r) <= cityTerritoryRadius(node)) return true;
  }
  return false;
}

/**
 * Właściciel terytorium w heksie (q,r), lub null gdy poza wszystkimi zasięgami.
 *
 * Gdy kilka węzłów obejmuje ten sam heks — wygrywa **najbliższy** w promieniu
 * (mniejszy axialDistance do centrum węzła). Przy remisie odległości — **pierwszy**
 * węzeł w tablicy `nodes`.
 */
export function territoryOwnerAt(
  q: number,
  r: number,
  nodes: readonly TerritoryNode[],
): number | null {
  let bestOwner: number | null = null;
  let bestDist = Infinity;

  for (const node of nodes) {
    const radius = cityTerritoryRadius(node);
    const dist = axialDistance(q, r, node.q, node.r);
    if (dist > radius) continue;
    if (dist < bestDist) {
      bestDist = dist;
      bestOwner = node.ownerId;
    }
  }

  return bestOwner;
}

/**
 * Heks w terytorium danego właściciela — z rozstrzygnięciem overlapu (najbliższe miasto).
 * Samo isInTerritory(playerNodes) zwraca true także na heksach faktycznie należących do AI
 * (np. las przy Sparcie w strefie dwóch zasięgów).
 */
export function isPlayerTerritoryHex(
  q: number,
  r: number,
  playerNodes: CityNode[],
  allNodes: readonly TerritoryNode[],
  playerOwnerId = 0,
): boolean {
  if (!isInTerritory(q, r, playerNodes)) return false;
  if (!allNodes.length) return true;
  return territoryOwnerAt(q, r, allNodes) === playerOwnerId;
}
