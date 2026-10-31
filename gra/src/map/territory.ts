/**
 * map/territory.ts
 * Kontrakt dla SILNIK: isInTerritory(q,r,nodes) bramkuje zakładanie miast/ulepszeń.
 * Zasięg MIASTA = max(5, pop) cap 15 (okolica+terytorium, Maciej 2026-06-27).
 * Posterunek r=3, fort r=5 (stałe; decyzja właściciela 2026-10-31, R-WEB-OUTPOST-FORT-TERRITORY-Q1,
 * zastępuje 5/10 z 2026-06-25). Formuła miasta: EKONOMIA okolica.ts.
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
export type TerritoryNode = CityNode & {
  ownerId: number;
  /**
   * R-WEB-OUTPOST-FORT-TERRITORY-Q1 R3 (Q-B=B, wlasciciel 2026-10-31): znacznik kolejnosci budowy
   * fortu/posterunku — sporny heks miedzy fortami roznych cywilizacji nalezy do WCZESNIEJSZEGO
   * (mniejsze `turn`, przy remisie mniejsze `seq`). Brak = rozstrzyga odleglosc (stary mechanizm).
   * / EN: build-order stamp; the earlier fort wins a hex contested by forts of different civs.
   */
  order?: { turn: number; seq: number };
};

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

/** Promień terytorium fortu (decyzja właściciela 2026-10-31). / EN: fort territory radius. */
export const FORT_TERRITORY_RADIUS = 5;
/** Promień terytorium posterunku (decyzja właściciela 2026-10-31). / EN: outpost territory radius. */
export const OUTPOST_TERRITORY_RADIUS = 3;

// ============================================================
// PROMIEŃ TERYTORIUM WĘZŁA
// ============================================================

/**
 * Zwraca promień terytorium (w heksach) dla danego węzła:
 *   - FORT:      r = 5  (stały; R-WEB-OUTPOST-FORT-TERRITORY-Q1, było 10)
 *   - POSTERUNEK: r = 3  (stały; R-WEB-OUTPOST-FORT-TERRITORY-Q1, było 5)
 *   - MIASTO:    r = max(5, pop), cap 15
 */
export function cityTerritoryRadius(node: CityNode): number {
  if (node.isFort)    return FORT_TERRITORY_RADIUS;
  if (node.isOutpost) return OUTPOST_TERRITORY_RADIUS;
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
 * węzeł w tablicy `nodes`. Węzły miast mają pierwszeństwo przed fortami/posterunkami.
 * Spór fortów (R3, Q-B=B): gdy oba węzły fortu mają `order` — wygrywa WCZEŚNIEJ zbudowany.
 */
export function territoryOwnerAt(
  q: number,
  r: number,
  nodes: readonly TerritoryNode[],
): number | null {
  let bestCityOwner: number | null = null;
  let bestCityDist = Infinity;
  let bestFortOwner: number | null = null;
  let bestFortDist = Infinity;
  let bestFortOrder: { turn: number; seq: number } | undefined;

  for (const node of nodes) {
    const radius = cityTerritoryRadius(node);
    const dist = axialDistance(q, r, node.q, node.r);
    if (dist > radius) continue;
    if (node.isFort || node.isOutpost) {
      // Q-B=B (R3): oba wezly z `order` -> wygrywa wczesniejszy fort; inaczej najblizszy (stary mechanizm).
      const o = node.order;
      let better: boolean;
      if (bestFortOwner !== null && o && bestFortOrder) {
        better = o.turn !== bestFortOrder.turn ? o.turn < bestFortOrder.turn : o.seq < bestFortOrder.seq;
      } else {
        better = dist < bestFortDist;
      }
      if (better) { bestFortDist = dist; bestFortOwner = node.ownerId; bestFortOrder = o; }
    } else if (dist < bestCityDist) {
      bestCityDist = dist;
      bestCityOwner = node.ownerId;
    }
  }

  // ZALOZENIE (R-WEB-OUTPOST-FORT-TERRITORY-Q1 R2, zarzut 1): heks w promieniu
  // KTOREGOKOLWIEK miasta rozstrzygaja wylacznie miasta (najblizsze); fort/posterunek
  // zajmuje tylko teren wolny od miast — nie odbiera heksow sasiedniemu miastu.
  // / EN: a hex inside any city radius is decided by cities only; forts/outposts
  // claim only city-free land.
  if (bestCityOwner !== null) return bestCityOwner;
  return bestFortOwner;
}

/**
 * Heks w terytorium danego właściciela — z rozstrzygnięciem overlapu (najbliższe miasto).
 * Samo isInTerritory(playerNodes) zwraca true także na heksach faktycznie należących do AI
 * (np. las przy Sparcie w strefie dwóch zasięgów) — dlatego przy pełnych danych używamy
 * wyłącznie territoryOwnerAt (jedno źródło prawdy z isTerritoryHexOwnedBy).
 */
export function isPlayerTerritoryHex(
  q: number,
  r: number,
  playerNodes: CityNode[],
  allNodes: readonly TerritoryNode[],
  playerOwnerId = 0,
): boolean {
  if (allNodes.length > 0) {
    return territoryOwnerAt(q, r, allNodes) === playerOwnerId;
  }
  // Testy / wczesny start bez listy wszystkich państw — tylko zasięg własnych miast.
  return isInTerritory(q, r, playerNodes);
}
