/**
 * map/territory.ts
 * Kontrakt dla SILNIK: isInTerritory(q,r,nodes) bramkuje zakładanie miast/ulepszeń.
 * Zasięg MIASTA = populacja (1:1), cap 15 (jeden wspólny zasięg okolicy+terytorium,
 * decyzja Macieja 25.06). Posterunek +5, fort +10 (stałe).
 * EKONOMIA owns formułę/cap; MAPA egzekwuje + rysuje linię.
 *
 * Ten moduł NIE ma żadnych zależności od Three.js ani warstwy renderowania.
 * SILNIK importuje bezpośrednio: import { isInTerritory, CityNode } from './map/territory'.
 */

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

/** Maksymalny zasięg okolicy/terytorium miasta (własność EKONOMIA). */
export const CITY_RANGE_CAP = 15; // = zasieg_okolicy_max (EKONOMIA owns)

/**
 * Przelicza populację na promień terytorium/okolicy miasta.
 * Radius = populacja, min 1, cap CITY_RANGE_CAP (15).
 */
export function cityRangeForPopulation(pop: number): number {
  return Math.max(1, Math.min(Math.floor(pop), CITY_RANGE_CAP));
}

// ============================================================
// PROMIEŃ TERYTORIUM WĘZŁA
// ============================================================

/**
 * Zwraca promień terytorium (w heksach) dla danego węzła:
 *   - FORT:      r = 10  (stały)
 *   - POSTERUNEK: r = 5  (stały)
 *   - MIASTO:    r = populacja (1:1), min 1, cap 15
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
