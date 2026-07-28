/**
 * clusters.ts  (lane Grupa A / MAPA)
 * Rozmieszczenie klastrów typów cywilizacji na mapie.
 *
 * FORMAT (konsumowany przez AI/SILNIK):
 *   ClusterCity       — pojedyncze miasto w klastrze (pozycja + czy stolica)
 *   TypeCluster       — klaster jednego typu (środek Voronoi + lista miast)
 *   ClusterPlacement  — pełny wynik rozmieszczenia dla całej mapy
 *
 * Funkcja computeClusters() jest CZYSTA (bez THREE/DOM/efektów ubocznych).
 * Algorytm: Voronoi środki typów (greedy/Poisson min 15 pól) → per-region Poisson-disk miast (min_dist adaptacyjny do mapy).
 * Deterministyczna: mulberry32 (ten sam seed → ten sam wynik).
 *
 * Skala aktywnych typów (heurystyka wg area = W×H; nadpisywana menu / Panel-E):
 *   < 4800   → mała  → 4 typy
 *   < 12000  → średnia → 5 typów
 *   < 25200  → duża → 6 typów
 *   < 100000 → ogromna → 8 typów
 *   ≥ 100000 → super → 10 typów
 *
 * Odległości startu (Maciej 2026-07-04 / 2026-07-22 / 2026-07-28, tylko spawn):
 *   miasta-państwa w klastrze gracza → min 4 hex, max 4 hex od stolicy (twardy pierścień)
 *   miasta obcych typów od stolicy gracza → min 12 hexów (poza oświetleniem startu)
 *   miasta-państwa w klastrze obcego typu → min 4 hexy, też skupisko wokół centrum typu
 *
 * Pakowanie klastra (Maciej 2026-07-07): miasta w promieniu packRadius od centrum,
 * nie po całym regionie Voronoi — duże puste przestrzenie między typami są OK.
 *
 * Krawędź klastra (Maciej 2026-07-07): stolica / founding spot na obwodzie skupiska,
 * miasta-państwa w środku (~4 hex), +1 zarezerwowany slot wzrostu w klastrze.
 *
 * Własność: Civ-MAPA rozmieszcza (computeClusters), SILNIK osadza w pętli tury,
 *           AI ekspanduje rywali wewnątrz regionu swojego typu.
 */

import { mulberry32, hexDistanceAxial, HEX_DIRECTIONS } from './gen-helpers';

/**
 * Twardy promień skupiska miast-państw (Maciej 2026-07-22).
 * Min odległość między dowolnymi dwoma miastami-państwami w klastrze.
 */
export const CLUSTER_CITY_STATE_MIN_HEX = 4;
/**
 * Max odległość miasta-państwa od stolicy/rdzenia klastra (ciasne skupisko).
 * Wraz z MIN = dokładnie pierścień 4 hex wokół stolicy gracza.
 */
export const CLUSTER_CITY_STATE_MAX_HEX = 4;
/** Min odległość między startowymi miastami-państwami (ten sam typ co gracz). Tylko spawn. */
export const MIN_DIST_START_CITY_STATE = CLUSTER_CITY_STATE_MIN_HEX;
/**
 * Min odległość miast obcych typów od hexu stolicy gracza. Tylko spawn.
 * 12 hex > promień oświetlenia startu (8 normal) — obce nacje nie widać przy założeniu miasta.
 */
export const MIN_DIST_FOREIGN_FROM_PLAYER = 12;
/** Min odległość między miastami w klastrze obcego typu. Tylko spawn. */
export const MIN_DIST_FOREIGN_IN_CLUSTER = MIN_DIST_START_CITY_STATE;
/** Rezerwa pustego slotu na kolejne miasto w klastrze (Maciej 2026-07-07). */
export const CLUSTER_GROWTH_RESERVE = 1;
import type { GameMap } from '../types/map';
import { TerenBazowy } from '../types/hex';

// ---------------------------------------------------------------------------
// Klucze typów z civs.json (kolejność = roster, ikonaId z JSON)
// ---------------------------------------------------------------------------
const ROSTER_KLUCZE: string[] = [
  'grecy',
  'rzymianie',
  'chinczycy',
  'inkowie',
  'zulusi',
  'egipt',
  'sumer',
  'celtowie',
  'germanie',
  'harappa',
  'hetyci',
  'slowianie',
  'babilonia',
  'asyria',
  'fenicjanie',
];

// ---------------------------------------------------------------------------
// FORMAT — interfejsy (eksport dla AI/SILNIK)
// ---------------------------------------------------------------------------

/** Pojedyncze miasto w klastrze. */
export interface ClusterCity {
  q: number;
  r: number;
  isCapital: boolean; // stolica = miasto najbliższe środka regionu
}

/** Klaster jednego typu cywilizacji. */
export interface TypeCluster {
  typIndex: number;           // 0..N-1 (indeks w tablicy aktywnych typów)
  typ: string;                // klucz z civs.json (np. 'grecy', 'rzym')
  centrum: { q: number; r: number }; // środek regionu Voronoi (ziarno klastra)
  miasta: ClusterCity[];      // do rywaleNaKlaster+1 miast (1 stolica + rywale)
  /** Pre-planowane sloty państw (gracz: spawn po founding). */
  pendingStateSlots?: Array<{ q: number; r: number }>;
  /** Zarezerwowany hex na +1 miasto w klastrze (nie spawnowany). */
  growthSlot?: { q: number; r: number } | null;
}

/** Pełny wynik rozmieszczenia klastrów dla całej mapy. */
export interface ClusterPlacement {
  rozmiarMapy: 'mala' | 'srednia' | 'duza' | 'ogromna' | 'super';
  /** Typy faktycznie rozmieszczone (≥1 miasto w klastrze). */
  aktywneTypy: number;
  /** Żądana liczba typów z kreatora (może być > aktywneTypy gdy mapa za ciasna). */
  requestedTypy?: number;
  /** min odległość miast-państw w klastrze gracza (start). */
  minDystansMiastaPanstwa: number;
  /** max promień skupiska miast-państw od rdzenia klastra (start). */
  maxDystansMiastaPanstwa: number;
  /** min odległość obcych miast od stolicy gracza (start). */
  minDystansObcyOdGracza: number;
  playerTypIndex: number;     // indeks klastra gracza (zawsze 0)
  klastry: TypeCluster[];
}

// ---------------------------------------------------------------------------
// Heurystyka rozmiaru mapy
// ---------------------------------------------------------------------------

type RozmiarKlaster = ClusterPlacement['rozmiarMapy'];

function mapSizeLabel(w: number, h: number): RozmiarKlaster {
  const area = w * h;
  if (area < 4800) return 'mala';
  if (area < 12000) return 'srednia';
  if (area < 25200) return 'duza';
  if (area < 100000) return 'ogromna';
  return 'super';
}

function aktywneTypyFromSize(label: RozmiarKlaster): number {
  const lut: Record<RozmiarKlaster, number> = {
    mala: 4, srednia: 5, duza: 6, ogromna: 8, super: 10,
  };
  return lut[label];
}

function shuffleInPlace<T>(arr: T[], rand: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
}

/** Min. pól lądu w masie, żeby rozważyć środek klastra (małe wysepki pomijamy). */
const MIN_MASS_HEXES_FOR_CENTER = 12;

/** Grupy spójnych pól lądu (flood-fill) — każdy kontynent / wyspa osobno. Eksport do testów. */
export function groupHabitableMasses(
  ladowe: Array<{ q: number; r: number }>,
): Array<Array<{ q: number; r: number }>> {
  const keySet = new Set(ladowe.map(h => `${h.q},${h.r}`));
  const visited = new Set<string>();
  const masses: Array<Array<{ q: number; r: number }>> = [];
  for (const h of ladowe) {
    const startKey = `${h.q},${h.r}`;
    if (visited.has(startKey)) continue;
    const mass: Array<{ q: number; r: number }> = [];
    const stack = [h];
    visited.add(startKey);
    while (stack.length) {
      const cur = stack.pop()!;
      mass.push(cur);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nq = cur.q + dq;
        const nr = cur.r + dr;
        const nk = `${nq},${nr}`;
        if (!keySet.has(nk) || visited.has(nk)) continue;
        visited.add(nk);
        stack.push({ q: nq, r: nr });
      }
    }
    if (mass.length >= MIN_MASS_HEXES_FOR_CENTER) masses.push(mass);
  }
  masses.sort((a, b) => b.length - a.length);
  return masses;
}

function massCentroid(mass: Array<{ q: number; r: number }>): { q: number; r: number } {
  let sq = 0;
  let sr = 0;
  for (const h of mass) { sq += h.q; sr += h.r; }
  return { q: sq / mass.length, r: sr / mass.length };
}

/** Najlepszy hex w masie lądu: wnętrze masy, minDist od istniejących środków. */
function pickCenterInMass(
  mass: Array<{ q: number; r: number }>,
  existing: Array<{ q: number; r: number }>,
  minDist: number,
  preferNear?: { q: number; r: number },
  rand?: () => number,
): { q: number; r: number } | null {
  const centroid = massCentroid(mass);
  const candidates = mass
    .filter(h => existing.every(p => hexDistanceAxial(h.q, h.r, p.q, p.r) >= minDist))
    .map(h => ({
      h,
      score: hexDistanceAxial(h.q, h.r, centroid.q, centroid.r)
        + (preferNear ? hexDistanceAxial(h.q, h.r, preferNear.q, preferNear.r) * 0.05 : 0)
        + (rand ? rand() * 0.01 : 0),
    }))
    .sort((a, b) => a.score - b.score);
  return candidates[0]?.h ?? null;
}

/**
 * Rozmieszcza środki klastrów równomiernie po masach lądu (kontynenty/wyspy),
 * z progresywnym luzowaniem min odległości gdy żądana liczba nie mieści się na mapie.
 */
function placeClusterCentersAcrossLandmasses(
  ladowe: Array<{ q: number; r: number }>,
  nNeeded: number,
  minDistBase: number,
  mapCenter: { q: number; r: number },
  rand: () => number,
  marginBrzeg: number,
  bounds: { minQ: number; maxQ: number; minR: number; maxR: number },
): Array<{ q: number; r: number }> {
  const { minQ, maxQ, minR, maxR } = bounds;
  const masses = groupHabitableMasses(ladowe);
  const centers: Array<{ q: number; r: number }> = [];

  function okMargins(q: number, r: number, relax: boolean): boolean {
    if (relax) return true;
    return (
      q - minQ >= marginBrzeg && maxQ - q >= marginBrzeg &&
      r - minR >= marginBrzeg && maxR - r >= marginBrzeg
    );
  }

  function hasCenter(c: { q: number; r: number }): boolean {
    return centers.some(p => p.q === c.q && p.r === c.r);
  }

  function tryPlace(c: { q: number; r: number } | null, minDist: number, relaxMargin: boolean): boolean {
    if (!c || hasCenter(c)) return false;
    if (!okMargins(c.q, c.r, relaxMargin)) return false;
    if (centers.some(p => hexDistanceAxial(c.q, c.r, p.q, p.r) < minDist)) return false;
    centers.push(c);
    return true;
  }

  // Progresywne luzowanie: 12 → 10 → 8 → 6 hex między środkami.
  for (let minDist = minDistBase; minDist >= 6 && centers.length < nNeeded; minDist -= 2) {
    const relaxMargin = minDist < minDistBase;

    // Faza 1: gracz na największej masie lądu (blisko geometrycznego środka mapy).
    if (centers.length === 0) {
      if (masses.length > 0) {
        tryPlace(pickCenterInMass(masses[0]!, [], minDist, mapCenter, rand), minDist, relaxMargin);
      }
      if (centers.length === 0 && ladowe.length > 0) {
        tryPlace(ladowe[0]!, minDist, true);
      }
    }

    // Faza 2: po jednym środku na każdej masie lądu (puste kontynenty dostają własny klaster).
    for (let mi = 1; mi < masses.length && centers.length < nNeeded; mi++) {
      tryPlace(pickCenterInMass(masses[mi]!, centers, minDist, undefined, rand), minDist, relaxMargin);
    }

    // Faza 3: round-robin — kolejne środki proporcjonalnie na największe masy.
    let stagnant = 0;
    while (centers.length < nNeeded && stagnant < masses.length + 2) {
      let placed = false;
      for (const mass of masses) {
        if (centers.length >= nNeeded) break;
        if (tryPlace(pickCenterInMass(mass, centers, minDist, undefined, rand), minDist, relaxMargin)) {
          placed = true;
        }
      }
      stagnant = placed ? 0 : stagnant + 1;
    }
  }

  // Ostateczny fallback: dowolne pola lądu (min 4 hex między środkami).
  if (centers.length < nNeeded) {
    const shuffled = ladowe.slice();
    shuffleInPlace(shuffled, rand);
    for (const c of shuffled) {
      if (centers.length >= nNeeded) break;
      tryPlace(c, 4, true);
    }
  }

  return centers.slice(0, nNeeded);
}

/** Promień skupiska miast wokół rdzenia (hexy) — heurystyka dla AI/ekspansji (legacy). */
export function clusterPackRadius(maxMiast: number, minDist: number): number {
  const rings = Math.max(2, Math.ceil(Math.sqrt(Math.max(1, maxMiast)) * 1.35));
  return Math.max(minDist * 2, rings * minDist);
}

/** Twardy promień klastra miast-państw — spawn + AI resupply (Maciej 2026-07-22). */
export function clusterCityStateRadius(): number {
  return CLUSTER_CITY_STATE_MAX_HEX;
}

/** Pola lądowe w promieniu od rdzenia, posortowane od najbliższych (do ciasnego pakowania). */
function landPoolNearCore(
  region: Array<{ q: number; r: number }>,
  centrum: { q: number; r: number },
  maxMiast: number,
  minDist: number,
  maxRadius?: number,
): Array<{ q: number; r: number }> {
  const packR = maxRadius != null
    ? maxRadius
    : clusterPackRadius(maxMiast, minDist);
  const near = region
    .map(c => ({ c, d: hexDistanceAxial(c.q, c.r, centrum.q, centrum.r) }))
    .filter(x => x.d <= packR)
    .sort((a, b) => a.d - b.d || a.c.q - b.c.q || a.c.r - b.c.r)
    .map(x => x.c);
  if (near.length >= maxMiast) return near;
  // Twardy limit klastra miast-państw — bez rozszerzania poza maxRadius.
  if (maxRadius != null) return near.length > 0 ? near : region;
  // Za mało pól w pierwszym pierścieniu — rozszerz promień stopniowo (legacy / obce typy).
  let expanded = packR + minDist;
  while (near.length < maxMiast && expanded <= packR + minDist * 6) {
    for (const c of region) {
      if (near.some(p => p.q === c.q && p.r === c.r)) continue;
      if (hexDistanceAxial(c.q, c.r, centrum.q, centrum.r) <= expanded) near.push(c);
      if (near.length >= maxMiast * 3) break;
    }
    expanded += minDist;
  }
  return near.length > 0 ? near : region;
}

function poissonPickCities(
  region: Array<{ q: number; r: number }>,
  maxMiast: number,
  minDist: number,
  rand: () => number,
  opts?: {
    minDistFrom?: { q: number; r: number };
    minDistFromValue?: number;
    /** Wyklucz dokładnie ten hex (np. stolica gracza). */
    excludeHex?: { q: number; r: number };
  },
): Array<{ q: number; r: number }> {
  const shuffledRegion = region.slice();
  shuffleInPlace(shuffledRegion, rand);

  const picked: Array<{ q: number; r: number }> = [];
  const anchor = opts?.minDistFrom;
  const anchorMin = opts?.minDistFromValue ?? 0;
  const exclude = opts?.excludeHex;

  function tooClose(c: { q: number; r: number }, limit: number): boolean {
    if (exclude != null && c.q === exclude.q && c.r === exclude.r) return true;
    if (anchor != null && hexDistanceAxial(c.q, c.r, anchor.q, anchor.r) < anchorMin) {
      return true;
    }
    return picked.some(p => hexDistanceAxial(c.q, c.r, p.q, p.r) < limit);
  }

  for (const c of shuffledRegion) {
    if (picked.length >= maxMiast) break;
    if (!tooClose(c, minDist)) picked.push(c);
  }

  if (picked.length < 2 && minDist > MIN_DIST_START_CITY_STATE) {
    const luzMin = Math.max(MIN_DIST_START_CITY_STATE, minDist - 2);
    for (const c of shuffledRegion) {
      if (picked.length >= maxMiast) break;
      if (picked.some(p => p.q === c.q && p.r === c.r)) continue;
      if (!tooClose(c, luzMin)) picked.push(c);
    }
  }

  return picked;
}

/**
 * Miasta-państwa wokół wybranego rdzenia (po założeniu stolicy gracza).
 * Deterministyczne dla seed; min 4 hex między miastami; rdzeń nie jest slotem rywala.
 */
export function packRivalCitiesAroundCore(
  landHexes: Array<{ q: number; r: number }>,
  core: { q: number; r: number },
  rivalCount: number,
  minDist: number,
  seed: number,
): Array<{ q: number; r: number }> {
  if (rivalCount <= 0) return [];
  const rand = mulberry32((seed ^ 0x9e3779b9) >>> 0);
  // Pierścień [minDist .. maxDist] wokół stolicy — ciasne skupisko (Maciej 2026-07-22).
  const pool = landHexes
    .map(h => ({ h, d: hexDistanceAxial(h.q, h.r, core.q, core.r) }))
    .filter(x => x.d >= minDist && x.d <= CLUSTER_CITY_STATE_MAX_HEX)
    .sort((a, b) => b.d - a.d || a.h.q - b.h.q || a.h.r - b.h.r)
    .map(x => x.h);
  return poissonPickCities(pool, rivalCount, minDist, rand, { excludeHex: core });
}

/** Wynik planowania klastra: stolica na krawędzi, państwa w środku. */
export interface ClusterLayoutPlan {
  capital: { q: number; r: number };
  stateCities: Array<{ q: number; r: number }>;
  growthSlot: { q: number; r: number } | null;
}


function centroidOf(hexes: Array<{ q: number; r: number }>): { q: number; r: number } {
  if (hexes.length === 0) return { q: 0, r: 0 };
  let sq = 0;
  let sr = 0;
  for (const h of hexes) { sq += h.q; sr += h.r; }
  return { q: sq / hexes.length, r: sr / hexes.length };
}

function isFarEnough(
  c: { q: number; r: number },
  others: Array<{ q: number; r: number }>,
  minDist: number,
): boolean {
  return others.every(o => hexDistanceAxial(c.q, c.r, o.q, o.r) >= minDist);
}

/**
 * Planuje klaster: państwa w środku (~minDist), stolica na obwodzie, +1 slot wzrostu.
 * Deterministyczne dla rand().
 */
export function buildClusterLayoutWithEdgeCapital(
  region: Array<{ q: number; r: number }>,
  centrum: { q: number; r: number },
  stateCityCount: number,
  minDist: number,
  rand: () => number,
  anchor?: { q: number; r: number; minDist: number },
  growthReserve = CLUSTER_GROWTH_RESERVE,
): ClusterLayoutPlan | null {
  if (stateCityCount < 0) return null;
  const interiorNeed = stateCityCount + growthReserve;
  const packR = clusterPackRadius(Math.max(1, stateCityCount + 1), minDist);
  const localPool = landPoolNearCore(region, centrum, interiorNeed + 2, minDist);

  const interiorPicked = poissonPickCities(
    localPool,
    interiorNeed,
    minDist,
    rand,
    anchor ? { minDistFrom: anchor, minDistFromValue: anchor.minDist } : undefined,
  );

  const stateCities = interiorPicked.slice(0, stateCityCount);
  const growthSlot = interiorPicked.length > stateCityCount
    ? interiorPicked[stateCityCount] ?? null
    : null;

  const occupied = [...stateCities];
  if (growthSlot) occupied.push(growthSlot);
  const blobCenter = stateCities.length > 0 ? centroidOf(stateCities) : centrum;

  const capitalCandidates = region.filter(c => {
    if (occupied.some(o => o.q === c.q && o.r === c.r)) return false;
    if (!isFarEnough(c, occupied, minDist)) return false;
    if (anchor && hexDistanceAxial(c.q, c.r, anchor.q, anchor.r) < anchor.minDist) return false;
    if (stateCities.length === 0) return true;
    const nearestState = Math.min(
      ...stateCities.map(s => hexDistanceAxial(c.q, c.r, s.q, s.r)),
    );
    return nearestState <= packR && nearestState >= minDist;
  });

  let capital: { q: number; r: number } | null = null;
  let bestEdgeScore = -Infinity;
  for (const c of capitalCandidates) {
    const edgeDist = hexDistanceAxial(c.q, c.r, blobCenter.q, blobCenter.r);
    const jitter = rand() * 0.01;
    if (edgeDist + jitter > bestEdgeScore) {
      bestEdgeScore = edgeDist + jitter;
      capital = c;
    }
  }

  if (!capital) {
    const fallbackPool = region.filter(c => {
      if (occupied.some(o => o.q === c.q && o.r === c.r)) return false;
      if (anchor && hexDistanceAxial(c.q, c.r, anchor.q, anchor.r) < anchor.minDist) return false;
      return isFarEnough(c, occupied, minDist);
    });
    if (fallbackPool.length === 0) return null;
    fallbackPool.sort((a, b) => {
      const da = hexDistanceAxial(a.q, a.r, blobCenter.q, blobCenter.r);
      const db = hexDistanceAxial(b.q, b.r, blobCenter.q, blobCenter.r);
      return db - da || a.q - b.q || a.r - b.r;
    });
    capital = fallbackPool[0]!;
  }

  return { capital, stateCities, growthSlot };
}

function layoutToClusterCities(layout: ClusterLayoutPlan): ClusterCity[] {
  const cities: ClusterCity[] = [{
    q: layout.capital.q,
    r: layout.capital.r,
    isCapital: true,
  }];
  for (const s of layout.stateCities) {
    cities.push({ q: s.q, r: s.r, isCapital: false });
  }
  return cities;
}

function buildClusterCities(
  region: Array<{ q: number; r: number }>,
  centrum: { q: number; r: number },
  stateCityCount: number,
  minDist: number,
  rand: () => number,
  anchor?: { q: number; r: number; minDist: number },
  seed?: number,
): { cities: ClusterCity[]; pendingStateSlots: Array<{ q: number; r: number }>; growthSlot: { q: number; r: number } | null } {
  const layout = buildClusterLayoutWithEdgeCapital(
    region, centrum, stateCityCount, minDist, rand, anchor, CLUSTER_GROWTH_RESERVE,
  );
  if (!layout) {
    return buildClusterCitiesSimpleFallback(
      region, centrum, stateCityCount, minDist, anchor, seed ?? 42,
    );
  }
  return {
    cities: layoutToClusterCities(layout),
    pendingStateSlots: layout.stateCities,
    growthSlot: layout.growthSlot,
  };
}

/**
 * Uproszczony fallback gdy edge-capital layout nie mieści się w regionie
 * (mały kontynent, fragmentacja lądu, restrykcja 12 hex od gracza).
 */
function buildClusterCitiesSimpleFallback(
  region: Array<{ q: number; r: number }>,
  centrum: { q: number; r: number },
  stateCityCount: number,
  minDist: number,
  anchor: { q: number; r: number; minDist: number } | undefined,
  seed: number,
): { cities: ClusterCity[]; pendingStateSlots: Array<{ q: number; r: number }>; growthSlot: null } {
  let pool = region;
  if (anchor) {
    const filtered = region.filter(
      h => hexDistanceAxial(h.q, h.r, anchor.q, anchor.r) >= anchor.minDist,
    );
    if (filtered.length > 0) pool = filtered;
  }
  if (pool.length === 0) {
    return { cities: [], pendingStateSlots: [], growthSlot: null };
  }

  const cen = centroidOf(pool);
  const capSorted = pool.slice().sort((a, b) => {
    const da = hexDistanceAxial(a.q, a.r, cen.q, cen.r);
    const db = hexDistanceAxial(b.q, b.r, cen.q, cen.r);
    return db - da || a.q - b.q || a.r - b.r;
  });
  const capital = capSorted[0] ?? centrum;

  const stateCities = packRivalCitiesAroundCore(pool, capital, stateCityCount, minDist, seed);
  const cities: ClusterCity[] = [{ q: capital.q, r: capital.r, isCapital: true }];
  for (const s of stateCities) {
    cities.push({ q: s.q, r: s.r, isCapital: false });
  }
  return { cities, pendingStateSlots: stateCities, growthSlot: null };
}

// ---------------------------------------------------------------------------
// COMPUTECLUSTERS — główna funkcja (czysta)
// ---------------------------------------------------------------------------

/**
 * Wyznacza rozmieszczenie klastrów typów na mapie.
 *
 * @param map       Mapa hex z generatora (GameMap).
 * @param opts.seed               Ziarno (domyślnie 42).
 * @param opts.aktywneTypy        Nadpisuje heurystykę wg rozmiaru (3/5/7/9).
 * @param opts.playerTyp          Klucz typu gracza z civs.json (domyślnie 'grecy').
 * @param opts.minDystans         (legacy) nadpisuje min dystans miast-państw gracza.
 * @param opts.rywaleNaKlaster    Liczba miast AI w klastrze (domyślnie 9; razem z kapitałem = 10).
 * @param opts.minDystansKlastrow Min odległość między środkami różnych klastrów (domyślnie 12).
 */
export function computeClusters(
  map: GameMap,
  opts?: {
    seed?: number;
    aktywneTypy?: number;
    playerTyp?: string;
    minDystans?: number;
    rywaleNaKlaster?: number;
    minDystansKlastrow?: number;
  },
): ClusterPlacement {
  const seed             = opts?.seed ?? 42;
  const playerTypKlucz   = opts?.playerTyp ?? ROSTER_KLUCZE[0]!;
  const rywaleNaKlaster  = opts?.rywaleNaKlaster ?? 9;
  const minDystKlastrowBase = opts?.minDystansKlastrow ?? 12;
  const minDystMiastaPanstwa = opts?.minDystans ?? MIN_DIST_START_CITY_STATE;
  const minDystObcyOdGracza = MIN_DIST_FOREIGN_FROM_PLAYER;

  const rand = mulberry32(seed);

  // --- Wymiary mapy ---
  const allHexes = Object.values(map.hexes);
  let minQ = Infinity, maxQ = -Infinity, minR = Infinity, maxR = -Infinity;
  for (const h of allHexes) {
    if (h.coords.q < minQ) minQ = h.coords.q;
    if (h.coords.q > maxQ) maxQ = h.coords.q;
    if (h.coords.r < minR) minR = h.coords.r;
    if (h.coords.r > maxR) maxR = h.coords.r;
  }
  const W = maxQ - minQ + 1;
  const H = maxR - minR + 1;

  const rozmiarMapy = mapSizeLabel(W, H);
  const aktywneTypy = opts?.aktywneTypy ?? aktywneTypyFromSize(rozmiarMapy);
  const nTypy = Math.min(aktywneTypy, ROSTER_KLUCZE.length);
  const area = W * H;
  /** Skaluje min odległość środków — więcej typów na dużej mapie = ciaśniejszy szyk. */
  const minDystKlastrow = Math.max(
    6,
    Math.min(minDystKlastrowBase, Math.floor(Math.sqrt(area / Math.max(nTypy, 1)) * 0.9)),
  );

  // --- Pola lądowe (zamieszkiwalne — bez Morza, Gór i Wybrzeża) ---
  // Wybrzeze wykluczone, bo canFoundCity je odrzuca (cities.ts) — trzymanie go w
  // puli kandydatów dawało "ciche" odrzucenia przy faktycznym zakładaniu miast.
  const ladowe: Array<{ q: number; r: number }> = [];
  for (const h of allHexes) {
    if (h.terenBazowy !== TerenBazowy.Morze && h.terenBazowy !== TerenBazowy.Gory &&
        h.terenBazowy !== TerenBazowy.Wybrzeze) {
      ladowe.push({ q: h.coords.q, r: h.coords.r });
    }
  }

  if (ladowe.length === 0) {
    // Fallback: brak lądu — zwróć pustą strukturę
    return {
      rozmiarMapy, aktywneTypy: 0, requestedTypy: nTypy,
      minDystansMiastaPanstwa: minDystMiastaPanstwa,
      maxDystansMiastaPanstwa: CLUSTER_CITY_STATE_MAX_HEX,
      minDystansObcyOdGracza: minDystObcyOdGracza,
      playerTypIndex: 0, klastry: [],
    };
  }

  // Tasowanie lądowych pól (dla fallbacku)
  const shuffledLad = ladowe.slice();
  shuffleInPlace(shuffledLad, rand);

  const mapCenter = { q: (minQ + maxQ) / 2, r: (minR + maxR) / 2 };
  const marginBrzeg = Math.max(2, Math.floor(minDystKlastrow / 3));

  // --- ŚRODKI TYPÓW: równomiernie po masach lądu (kontynenty/wyspy), nie tylko greedy shuffle ---
  const centrumy = placeClusterCentersAcrossLandmasses(
    ladowe,
    nTypy,
    minDystKlastrow,
    mapCenter,
    rand,
    marginBrzeg,
    { minQ, maxQ, minR, maxR },
  );

  if (centrumy.length < nTypy && typeof console !== 'undefined') {
    console.warn(
      `[clusters] Tylko ${centrumy.length}/${nTypy} środków klastrów — mapa za ciasna lub zbyt pofragmentowany ląd`,
    );
  }

  // --- Roster typów — gracz na pozycji 0, reszta bez powtórzeń ---
  const playerIdx = ROSTER_KLUCZE.indexOf(playerTypKlucz);
  const playerKlucz = playerIdx >= 0 ? playerTypKlucz : ROSTER_KLUCZE[0]!;

  // Buduj listę aktywnych kluczy typów (gracz pierwszy)
  const rosterBezGracza = ROSTER_KLUCZE.filter(k => k !== playerKlucz);
  // Tasuj resztę losowo (używamy dalszych rand())
  for (let i = rosterBezGracza.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = rosterBezGracza[i]!;
    rosterBezGracza[i] = rosterBezGracza[j]!;
    rosterBezGracza[j] = tmp;
  }
  const aktywneKlucze: string[] = [playerKlucz, ...rosterBezGracza.slice(0, nTypy - 1)];

  // --- VORONOI: każdy lądowy hex → najbliższy środek ---
  // Mapa: centrum_index → lista hex w regionie
  const regiony: Array<Array<{ q: number; r: number }>> = Array.from({ length: centrumy.length }, () => []);

  for (const h of ladowe) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let ci = 0; ci < centrumy.length; ci++) {
      const d = hexDistanceAxial(h.q, h.r, centrumy[ci]!.q, centrumy[ci]!.r);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = ci;
      }
    }
    regiony[bestIdx]!.push(h);
  }

  // --- MIASTA: klaster gracza (min 4 hex), obce typy min 12 od stolicy, mp obcych min 4 w klastrze ---
  const klastry: TypeCluster[] = [];
  const stateCityCount = rywaleNaKlaster;

  const playerCentrum = centrumy[0]!;
  const playerRegion = regiony[0]!;
  const playerLayout = buildClusterCities(
    playerRegion,
    playerCentrum,
    stateCityCount,
    minDystMiastaPanstwa,
    rand,
    undefined,
    seed,
  );

  const playerCapital = playerLayout.cities.find(m => m.isCapital) ?? playerLayout.cities[0];
  const playerCapitalPos = playerCapital
    ? { q: playerCapital.q, r: playerCapital.r }
    : playerCentrum;

  // Pre-plan państw gracza: ciasne skupisko wokół stolicy (min/max 4 hex — Maciej 2026-07-28).
  const playerStateSlots = packRivalCitiesAroundCore(
    ladowe,
    playerCapitalPos,
    stateCityCount,
    minDystMiastaPanstwa,
    seed,
  );

  klastry.push({
    typIndex: 0,
    typ: aktywneKlucze[0] ?? playerKlucz,
    centrum: playerCentrum,
    miasta: playerLayout.cities,
    pendingStateSlots: playerStateSlots,
    growthSlot: playerLayout.growthSlot,
  });

  for (let ci = 1; ci < centrumy.length; ci++) {
    const centrum = centrumy[ci]!;
    const region = regiony[ci]!;
    const foreignLayout = buildClusterCities(
      region,
      centrum,
      stateCityCount,
      MIN_DIST_FOREIGN_IN_CLUSTER,
      rand,
      { q: playerCapitalPos.q, r: playerCapitalPos.r, minDist: minDystObcyOdGracza },
      seed,
    );

    klastry.push({
      typIndex: ci,
      typ: aktywneKlucze[ci] ?? `typ${ci}`,
      centrum,
      miasta: foreignLayout.cities,
      growthSlot: foreignLayout.growthSlot,
    });
  }

  // Logowanie diagnostyczne (tylko w dev — nie blokuje funkcji)
  if (typeof console !== 'undefined') {
    for (let ci = 0; ci < klastry.length; ci++) {
      const k = klastry[ci]!;
      if (k.miasta.length < stateCityCount + 1) {
        console.warn(
          `[clusters] Klaster '${k.typ}' (region ${ci}): tylko ${k.miasta.length}/${stateCityCount + 1} miast` +
          ` (region za mały: ${regiony[ci]!.length} pol ladowych)`,
        );
      }
    }
  }

  const placedTypy = klastry.filter(k => k.miasta.length > 0).length;

  return {
    rozmiarMapy,
    aktywneTypy: placedTypy,
    requestedTypy: nTypy,
    minDystansMiastaPanstwa: minDystMiastaPanstwa,
    maxDystansMiastaPanstwa: CLUSTER_CITY_STATE_MAX_HEX,
    minDystansObcyOdGracza: minDystObcyOdGracza,
    playerTypIndex: 0,
    klastry,
  };
}
