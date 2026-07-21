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
 * Odległości startu (Maciej 2026-07-04, tylko spawn):
 *   miasta-państwa w klastrze gracza → min 3 hexy, skupisko wokół rdzenia (nie cały Voronoi)
 *   miasta obcych typów od stolicy gracza → min 12 hexów (poza oświetleniem startu)
 *   miasta-państwa w klastrze obcego typu → min 3 hexy, też skupisko wokół centrum typu
 *
 * Pakowanie klastra (Maciej 2026-07-07): miasta w promieniu packRadius od centrum,
 * nie po całym regionie Voronoi — duże puste przestrzenie między typami są OK.
 *
 * Krawędź klastra (Maciej 2026-07-07): stolica / founding spot na obwodzie skupiska,
 * miasta-państwa w środku (~3 hex), +1 zarezerwowany slot wzrostu w klastrze.
 *
 * Własność: Civ-MAPA rozmieszcza (computeClusters), SILNIK osadza w pętli tury,
 *           AI ekspanduje rywali wewnątrz regionu swojego typu.
 */

import { mulberry32, hexDistanceAxial } from './gen-helpers';

/** Min odległość między startowymi miastami-państwami (ten sam typ co gracz). Tylko spawn. */
export const MIN_DIST_START_CITY_STATE = 3;
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
  aktywneTypy: number;
  /** min odległość miast-państw w klastrze gracza (start). */
  minDystansMiastaPanstwa: number;
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

/** Promień skupiska miast wokół rdzenia (hexy) — ciasne paki, nie cały region Voronoi. */
export function clusterPackRadius(maxMiast: number, minDist: number): number {
  const rings = Math.max(2, Math.ceil(Math.sqrt(Math.max(1, maxMiast)) * 1.35));
  return Math.max(minDist * 2, rings * minDist);
}

/** Pola lądowe w promieniu od rdzenia, posortowane od najbliższych (do ciasnego pakowania). */
function landPoolNearCore(
  region: Array<{ q: number; r: number }>,
  centrum: { q: number; r: number },
  maxMiast: number,
  minDist: number,
): Array<{ q: number; r: number }> {
  const packR = clusterPackRadius(maxMiast, minDist);
  const near = region
    .map(c => ({ c, d: hexDistanceAxial(c.q, c.r, centrum.q, centrum.r) }))
    .filter(x => x.d <= packR)
    .sort((a, b) => a.d - b.d || a.c.q - b.c.q || a.c.r - b.c.r)
    .map(x => x.c);
  if (near.length >= maxMiast) return near;
  // Za mało pól w pierwszym pierścieniu — rozszerz promień stopniowo.
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
 * Deterministyczne dla seed; min 3 hex między miastami; rdzeń nie jest slotem rywala.
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
  const pool = landPoolNearCore(landHexes, core, rivalCount, minDist);
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
): { cities: ClusterCity[]; pendingStateSlots: Array<{ q: number; r: number }>; growthSlot: { q: number; r: number } | null } {
  const layout = buildClusterLayoutWithEdgeCapital(
    region, centrum, stateCityCount, minDist, rand, anchor, CLUSTER_GROWTH_RESERVE,
  );
  if (!layout) {
    return { cities: [], pendingStateSlots: [], growthSlot: null };
  }
  return {
    cities: layoutToClusterCities(layout),
    pendingStateSlots: layout.stateCities,
    growthSlot: layout.growthSlot,
  };
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
  const minDystKlastrow  = opts?.minDystansKlastrow ?? 12;
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
      rozmiarMapy, aktywneTypy: nTypy,
      minDystansMiastaPanstwa: minDystMiastaPanstwa,
      minDystansObcyOdGracza: minDystObcyOdGracza,
      playerTypIndex: 0, klastry: [],
    };
  }

  // Tasowanie lądowych pól (dla losowego wyboru środków)
  const shuffledLad = ladowe.slice();
  for (let i = shuffledLad.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = shuffledLad[i]!;
    shuffledLad[i] = shuffledLad[j]!;
    shuffledLad[j] = tmp;
  }

  // --- ŚRODKI TYPÓW (greedy Poisson z min_dystans_klastrow = 15) ---
  // Gracz zawsze aktywny (playerTypIndex = 0).
  const centrumy: Array<{ q: number; r: number }> = [];

  // Priorytetowo wybieramy środek gracza — pierwsze pasujące pole z tasowanej listy
  // z marginesem od brzegu (≥ minDystKlastrow/2)
  const marginBrzeg = Math.floor(minDystKlastrow / 3);

  function dalekoOdBrzegow(q: number, r: number): boolean {
    return (
      q - minQ >= marginBrzeg && maxQ - q >= marginBrzeg &&
      r - minR >= marginBrzeg && maxR - r >= marginBrzeg
    );
  }

  // Pierwszy środek = gracz
  for (const c of shuffledLad) {
    if (dalekoOdBrzegow(c.q, c.r)) {
      centrumy.push(c);
      break;
    }
  }
  if (centrumy.length === 0) centrumy.push(shuffledLad[0]!); // fallback

  // Kolejne środki (rywale) — greedy, min minDystKlastrow od istniejących
  const maxProb = shuffledLad.length;
  let attempt = 0;
  while (centrumy.length < nTypy && attempt < maxProb) {
    const c = shuffledLad[attempt]!;
    attempt++;
    const tooClose = centrumy.some(
      p => hexDistanceAxial(c.q, c.r, p.q, p.r) < minDystKlastrow,
    );
    if (!tooClose && dalekoOdBrzegow(c.q, c.r)) {
      centrumy.push(c);
    }
  }
  // Fallback jeśli za mało środków z ograniczeniem brzegu — luzujemy
  if (centrumy.length < nTypy) {
    attempt = 0;
    while (centrumy.length < nTypy && attempt < maxProb) {
      const c = shuffledLad[attempt]!;
      attempt++;
      const tooClose = centrumy.some(
        p => hexDistanceAxial(c.q, c.r, p.q, p.r) < minDystKlastrow,
      );
      if (!tooClose) centrumy.push(c);
    }
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

  // --- MIASTA: klaster gracza (min 3 hex), obce typy min 12 od stolicy, mp obcych min 3 w klastrze ---
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
  );
  klastry.push({
    typIndex: 0,
    typ: aktywneKlucze[0] ?? playerKlucz,
    centrum: playerCentrum,
    miasta: playerLayout.cities,
    pendingStateSlots: playerLayout.pendingStateSlots,
    growthSlot: playerLayout.growthSlot,
  });

  const playerCapital = playerLayout.cities.find(m => m.isCapital) ?? playerLayout.cities[0];
  const playerCapitalPos = playerCapital
    ? { q: playerCapital.q, r: playerCapital.r }
    : playerCentrum;

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

  return {
    rozmiarMapy,
    aktywneTypy: nTypy,
    minDystansMiastaPanstwa: minDystMiastaPanstwa,
    minDystansObcyOdGracza: minDystObcyOdGracza,
    playerTypIndex: 0,
    klastry,
  };
}
