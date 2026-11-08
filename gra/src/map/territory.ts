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

// ============================================================
// R-WEB-PERF-LATE-GAME-LAG-HUD-Q2 (R6): indeks właściciela heksu
// ============================================================

interface HexOwnerCell { co: number | null; cd: number; fo: number | null; fd: number; fOrd: { turn: number; seq: number } | undefined; }
interface NodesEntry {
  id: number; n: number;
  q: Float64Array; r: Float64Array; rad: Float64Array; kind: Uint8Array; owner: Float64Array; ot: Float64Array; os: Float64Array;
  idx: Map<number, number | null> | null;
}
const NODES_ENTRY_MAX = 6;
const nodesEntries: NodesEntry[] = []; // najnowszy użyty na początku
let nodesEntrySeq = 0;
const NO_ORDER = -1e12;

function ownerIndexPack(q: number, r: number): number { return (q + 8192) * 16384 + (r + 8192); }

type NodeLike = CityNode & { ownerId?: number; order?: { turn: number; seq: number } };
function nodeKind(nd: NodeLike): number { return nd.isFort ? 1 : nd.isOutpost ? 2 : 0; }

/** Wpis rejestru dla ZAWARTOŚCI węzłów (q, r, promień, rodzaj, właściciel, order); porównanie liczbowe, bez alokacji przy trafieniu. */
function nodesEntryFor(nodes: readonly NodeLike[]): NodesEntry | null {
  const n = nodes.length;
  for (let e = 0; e < nodesEntries.length; e++) {
    const c = nodesEntries[e]!;
    if (c.n !== n) continue;
    let same = true;
    for (let i = 0; i < n; i++) {
      const nd = nodes[i]!;
      const o = nd.order;
      if (c.q[i] !== nd.q || c.r[i] !== nd.r || c.rad[i] !== cityTerritoryRadius(nd) || c.kind[i] !== nodeKind(nd)
        || c.owner[i] !== (nd.ownerId ?? -1) || c.ot[i] !== (o ? o.turn : NO_ORDER) || c.os[i] !== (o ? o.seq : NO_ORDER)) { same = false; break; }
    }
    if (same) {
      if (e > 0) { nodesEntries.splice(e, 1); nodesEntries.unshift(c); }
      return c;
    }
  }
  for (let i = 0; i < n; i++) {
    const nd = nodes[i]!;
    if (!(nd.q > -8000 && nd.q < 8000 && nd.r > -8000 && nd.r < 8000)) return null;
  }
  const c: NodesEntry = {
    id: ++nodesEntrySeq, n, q: new Float64Array(n), r: new Float64Array(n), rad: new Float64Array(n), kind: new Uint8Array(n),
    owner: new Float64Array(n), ot: new Float64Array(n), os: new Float64Array(n), idx: null,
  };
  for (let i = 0; i < n; i++) {
    const nd = nodes[i]!;
    const o = nd.order;
    c.q[i] = nd.q; c.r[i] = nd.r; c.rad[i] = cityTerritoryRadius(nd); c.kind[i] = nodeKind(nd);
    c.owner[i] = nd.ownerId ?? -1; c.ot[i] = o ? o.turn : NO_ORDER; c.os[i] = o ? o.seq : NO_ORDER;
  }
  nodesEntries.unshift(c);
  if (nodesEntries.length > NODES_ENTRY_MAX) nodesEntries.pop();
  return c;
}

/**
 * Identyfikator ZAWARTOŚCI zestawu węzłów (równe id <=> te same węzły w tej samej kolejności i z tym samym promieniem/
 * rodzajem/właścicielem/order). -1 gdy zestaw nie jest obsługiwany. Do kluczy pamięci podręcznych zakresowych.
 */
export function territoryNodesContentId(nodes: readonly NodeLike[]): number {
  const e = nodesEntryFor(nodes);
  return e ? e.id : -1;
}

/**
 * Indeks `heks -> właściciel` dla zestawu węzłów, zbudowany TĄ SAMĄ regułą co `territoryOwnerAt`
 * (węzły przetwarzane w kolejności tablicy; miasto: ściśle bliższe wygrywa, remis = pierwszy;
 * fort/posterunek: reguła `order`/dystans jak wyżej; miasta mają pierwszeństwo przed fortami),
 * tylko odwróconą pętlą (po węźle -> jego dysk) zamiast (po heksie -> wszystkie węzły).
 * Heks poza wszystkimi dyskami nie ma wpisu (= null). Indeks jest związany z wpisem rejestru zawartości
 * węzłów, więc zmiana populacji/pozycji/właściciela daje nowy wpis i nowy indeks - nigdy nieaktualny wynik.
 */
function territoryOwnerIndex(nodes: readonly TerritoryNode[]): Map<number, number | null> | null {
  const entry = nodesEntryFor(nodes);
  if (!entry) return null;
  if (entry.idx) return entry.idx;
  const cells = new Map<number, HexOwnerCell>();
  for (const node of nodes) {
    const radius = cityTerritoryRadius(node);
    const isFortLike = !!(node.isFort || node.isOutpost);
    const o = node.order;
    for (let dq = -radius; dq <= radius; dq++) {
      const lo = Math.max(-radius, -dq - radius), hi = Math.min(radius, -dq + radius);
      for (let dr = lo; dr <= hi; dr++) {
        const q = node.q + dq, r = node.r + dr;
        const dist = axialDistance(q, r, node.q, node.r);
        if (dist > radius) continue;
        const k = ownerIndexPack(q, r);
        let c = cells.get(k);
        if (!c) { c = { co: null, cd: Infinity, fo: null, fd: Infinity, fOrd: undefined }; cells.set(k, c); }
        if (isFortLike) {
          let better: boolean;
          if (c.fo !== null && o && c.fOrd) {
            better = o.turn !== c.fOrd.turn ? o.turn < c.fOrd.turn : o.seq < c.fOrd.seq;
          } else {
            better = dist < c.fd;
          }
          if (better) { c.fd = dist; c.fo = node.ownerId; c.fOrd = o; }
        } else if (dist < c.cd) {
          c.cd = dist;
          c.co = node.ownerId;
        }
      }
    }
  }
  const idx = new Map<number, number | null>();
  for (const [k, c] of cells) idx.set(k, c.co !== null ? c.co : c.fo);
  entry.idx = idx;
  return idx;
}

/**
 * Szybki odpowiednik `(q, r) => territoryOwnerAt(q, r, nodes)` do wielokrotnych zapytań na tym samym zestawie
 * węzłów (np. filtr pracy okolicy). Dla małych zestawów i współrzędnych poza zakresem deleguje do oryginału.
 * Wynik jest identyczny z `territoryOwnerAt` (patrz test perf-hud-frame-memo-test / territory-owner-index).
 */
export function territoryOwnerLookup(nodes: readonly TerritoryNode[]): (q: number, r: number) => number | null {
  if (nodes.length < 12) return (q, r) => territoryOwnerAt(q, r, nodes);
  const idx = territoryOwnerIndex(nodes);
  if (!idx) return (q, r) => territoryOwnerAt(q, r, nodes);
  return (q, r) => {
    if (!(q > -8000 && q < 8000 && r > -8000 && r < 8000)) return territoryOwnerAt(q, r, nodes);
    const v = idx.get(ownerIndexPack(q, r));
    return v === undefined ? null : v;
  };
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
