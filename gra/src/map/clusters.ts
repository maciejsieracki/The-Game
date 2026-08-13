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
 * Odległości startu (Maciej 2026-07-04 / 2026-07-22 / 2026-07-28 / 2026-07-29, tylko spawn):
 *   miasta-państwa w klastrze gracza → min 5 hex, max 5 hex od stolicy (twardy pierścień)
 *   miasta obcych typów od stolicy gracza → min 12 hexów (poza oświetleniem startu)
 *   miasta-państwa w klastrze obcego typu → min 5 hexy, też skupisko wokół centrum typu
 *
 * Pakowanie klastra (Maciej 2026-07-07): miasta w promieniu packRadius od centrum,
 * nie po całym regionie Voronoi — duże puste przestrzenie między typami są OK.
 *
 * Krawędź klastra (Maciej 2026-07-07): stolica / founding spot na obwodzie skupiska,
 * miasta-państwa w środku (~5 hex), +1 zarezerwowany slot wzrostu w klastrze.
 *
 * Własność: Civ-MAPA rozmieszcza (computeClusters), SILNIK osadza w pętli tury,
 *           AI ekspanduje rywali wewnątrz regionu swojego typu.
 */

import { mulberry32, hexDistanceAxial, HEX_DIRECTIONS, buildSeaDistanceField, hexKey } from './gen-helpers';

/**
 * Twardy promień skupiska miast-państw (Maciej 2026-07-22).
 * Min odległość między dowolnymi dwoma miastami-państwami w klastrze.
 */
export const CLUSTER_CITY_STATE_MIN_HEX = 5;
/**
 * Max odległość miasta-państwa od stolicy/rdzenia klastra (ciasne skupisko).
 * Wraz z MIN = dokładnie pierścień 5 hex wokół stolicy gracza.
 */
export const CLUSTER_CITY_STATE_MAX_HEX = 5;
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
import {
  civIdsAvailableAtGameEpoch,
  type CivEntryEpochRow,
} from '../game/civ-entry-epoch';

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

/** Pula kluczy typów dostępnych w epoce startu (kolejność rosteru zachowana). */
export function rosterKluczeForStartEpoch(
  civRoster: readonly CivEntryEpochRow[] | undefined,
  startEpochId: string | undefined,
): string[] {
  if (!civRoster || !startEpochId) return [...ROSTER_KLUCZE];
  const available = new Set(civIdsAvailableAtGameEpoch(civRoster, startEpochId));
  return ROSTER_KLUCZE.filter(k => available.has(k));
}

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

/** Precomputed caches z computeClusters — reuse w cluster-spawn (FALA 164). */
export interface ClusterSpawnCache {
  seaDist: Map<string, number>;
  landCache: MassLandCache;
  ladowe: Array<{ q: number; r: number }>;
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
  /** Cache spawnu (nie serializować). */
  spawnCache?: ClusterSpawnCache;
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

/**
 * R-KONFIGURATOR-WYBOR-CYWILIZACJI-PRZECIWNIKA runda 2 (Evaluator 2026-08-13):
 * przestawia `roster` tak, żeby `preferred` (w kolejności zaznaczenia gracza w
 * kreatorze, tylko wpisy faktycznie obecne w `roster`) trafiły na POCZĄTEK.
 * Dalsza logika (`.slice(0, nTypy-1)` w computeClusters + `shuffleInPlace` w
 * assignTypesToClusterCenters) wtedy wybiera z priorytetem dla preferowanych —
 * reszta zostaje w dotychczasowej kolejności `ROSTER_KLUCZE`/epoki (deterministyczny
 * fallback identyczny jak dziś, gdy brak preferencji). Zero dodatkowego losowania.
 * / EN: moves `preferred` (in the player's wizard selection order, entries actually
 * present in `roster` only) to the FRONT of `roster`. Downstream logic
 * (`.slice(0, nTypy-1)` in computeClusters + `shuffleInPlace` in
 * assignTypesToClusterCenters) then picks with priority for preferred — the rest
 * stays in today's `ROSTER_KLUCZE`/epoch order (same deterministic fallback as
 * without preferences). No extra randomness introduced.
 */
export function reorderRosterByPreference(
  roster: readonly string[],
  preferred: readonly string[] | undefined,
): string[] {
  if (!preferred || preferred.length === 0) return [...roster];
  const rosterSet = new Set(roster);
  const front: string[] = [];
  const seen = new Set<string>();
  for (const id of preferred) {
    if (id && rosterSet.has(id) && !seen.has(id)) {
      front.push(id);
      seen.add(id);
    }
  }
  if (front.length === 0) return [...roster];
  const rest = roster.filter((id) => !seen.has(id));
  return [...front, ...rest];
}

/** Min. pól lądu w masie, żeby rozważyć środek klastra (małe wysepki pomijamy). */
const MIN_MASS_HEXES_FOR_CENTER = 12;
/**
 * Min. rozmiar masy lądu kwalifikującej się do przydziału typów (MAP-SPAWN-Q2 B).
 * Wyjątek: jedyna masa (Pangea) — zawsze kwalifikuje się.
 */
export const MIN_MASS_HEXES_FOR_SPAWN = 60;
/**
 * Min. przestrzeń rozwoju (ląd zamieszkiwalny w zasięgu ekspansji) na jeden typ na masie.
 * MAP-SPAWN-Q2 B — środek zakresu 80–100.
 */
export const MIN_DEVELOPMENT_HEX_PER_CIV = 90;
/** Masa poniżej tego progu: max 1 typ cywilizacji (MAP-SPAWN-Q2 B). */
export const SMALL_MASS_CAP_THRESHOLD = 2 * MIN_DEVELOPMENT_HEX_PER_CIV;
/** Promień zliczania lądu rozwojowego wokół hexu startowego. */
export const DEVELOPMENT_SPACE_RADIUS = 6;
/** Wyspa kwalifikuje się do round-robin dopiero gdy ≥ tej frakcji największej masy (MAP-SPAWN-Q1 C). */
export const ISLAND_FALLBACK_MASS_FRAC = 0.25;
/**
 * Min. rozmiar masy dla obcych typów — bezwzględny (MAP-SPAWN-Q2 regresja 2026-08-01).
 * Środek zakresu 80–100 z decyzji.
 */
export const FOREIGN_MASS_MIN_ABSOLUTE = 90;
/** Min. udział największej masy — środek 8–10% (MAP-SPAWN-Q2 regresja 2026-08-01). */
export const FOREIGN_MASS_FRAC_OF_LARGEST = 0.09;
/**
 * Min. udział lądu zamieszkiwalnego w promieniu R wokół stolicy startowej (MAP-SPAWN-Q1 B, Maciej 2026-07-28).
 * Morze / wybrzeże / góry nie liczą się jako ląd — bramka blokuje start na wysepkach otoczonych wodą.
 */
export const LOCAL_LAND_DOMINANCE_FRAC = 0.70;
/** @deprecated alias — testy historyczne; metryka = lokalny ląd w promieniu, nie Voronoi. */
export const REGION_MASS_DOMINANCE_FRAC = LOCAL_LAND_DOMINANCE_FRAC;
/** Promień okolicy stolicy: ~typowy zasięg klastra miasta (min 5 hex) — lokalna ocena lądu vs morze. */
export const LOCAL_LAND_DOMINANCE_RADIUS = 3;
/** Min. rozmiar masy lądu (flood-fill) pod startem gracza przy lokalnym lądzie ≥70% (MAP-SPAWN-Q1 B). */
export const PLAYER_START_MIN_MASS_HEXES = 25;
/** Bezwzględny min. rozmiar masy dla startu gracza (16-hex wyspa odpada). */
export const PLAYER_START_MASS_MIN_ABSOLUTE = 30;

function qualifyingMassThreshold(largestMassSize: number): number {
  return Math.max(
    MIN_MASS_HEXES_FOR_CENTER,
    Math.floor(largestMassSize * ISLAND_FALLBACK_MASS_FRAC),
  );
}

/** Próg masy kwalifikującej się do spawnu obcych typów (MAP-SPAWN-Q2 regresja 2026-08-01). */
export function foreignSpawnMassThreshold(largestMassSize: number): number {
  return Math.max(
    FOREIGN_MASS_MIN_ABSOLUTE,
    Math.floor(largestMassSize * FOREIGN_MASS_FRAC_OF_LARGEST),
  );
}

/** Czy masa kwalifikuje się do przydziału obcych typów. Pangea (1 masa) — zawsze tak. */
export function massQualifiesForForeignSpawn(
  massSize: number,
  masses: Array<Array<{ q: number; r: number }>>,
): boolean {
  if (masses.length === 1) return true;
  const largest = masses[0]?.length ?? 0;
  return massSize >= foreignSpawnMassThreshold(largest);
}

/** Mapa hex → indeks masy (flood-fill). */
function buildMassHexIndex(
  masses: Array<Array<{ q: number; r: number }>>,
): Map<string, number> {
  const idx = new Map<string, number>();
  for (let mi = 0; mi < masses.length; mi++) {
    for (const h of masses[mi]!) {
      idx.set(`${h.q},${h.r}`, mi);
    }
  }
  return idx;
}

/**
 * Cache mas lądu — jednorazowy build na computeClusters (FALA 164 perf).
 * Bez tego developmentSpaceScore / passesPlayerStartMassGate przebudowują indeks
 * per hex → O(n²) na Pangea Standard (~15k² ≈ 113 s).
 */
export interface MassLandCache {
  masses: Array<Array<{ q: number; r: number }>>;
  hexIndex: Map<string, number>;
  massSets: ReadonlyArray<ReadonlySet<string>>;
}

export function createMassLandCache(
  ladowe: Array<{ q: number; r: number }>,
): MassLandCache {
  const masses = groupHabitableMasses(ladowe);
  return massLandCacheFromMasses(masses);
}

export function massLandCacheFromMasses(
  masses: Array<Array<{ q: number; r: number }>>,
): MassLandCache {
  return {
    masses,
    hexIndex: buildMassHexIndex(masses),
    massSets: masses.map(m => new Set(m.map(h => `${h.q},${h.r}`))),
  };
}

type MassesOrCache = Array<Array<{ q: number; r: number }>> | MassLandCache;

function resolveMassLandCache(massesOrCache: MassesOrCache): MassLandCache {
  return Array.isArray(massesOrCache)
    ? massLandCacheFromMasses(massesOrCache)
    : massesOrCache;
}

function massContainingHex(
  hexIndex: Map<string, number>,
  q: number,
  r: number,
): number | null {
  const mi = hexIndex.get(`${q},${r}`);
  return mi !== undefined ? mi : null;
}

/**
 * Udział pól regionu Voronoi należących do tej samej masy co środek klastra.
 * Eksport do testów MAP-SPAWN-Q1 B.
 */
export function regionMassDominance(
  region: Array<{ q: number; r: number }>,
  center: { q: number; r: number },
  masses: Array<Array<{ q: number; r: number }>>,
): { ratio: number; centerMassIndex: number | null; dominantMassIndex: number } {
  const hexIndex = buildMassHexIndex(masses);
  const centerMassIndex = massContainingHex(hexIndex, center.q, center.r);
  const perMass = new Map<number, number>();
  for (const h of region) {
    const mi = hexIndex.get(`${h.q},${h.r}`);
    if (mi === undefined) continue;
    perMass.set(mi, (perMass.get(mi) ?? 0) + 1);
  }
  let dominantMassIndex = -1;
  let dominantCount = 0;
  for (const [mi, count] of perMass) {
    if (count > dominantCount) {
      dominantCount = count;
      dominantMassIndex = mi;
    }
  }
  const centerCount = centerMassIndex !== null ? (perMass.get(centerMassIndex) ?? 0) : 0;
  const ratio = region.length > 0 ? centerCount / region.length : 0;
  return { ratio, centerMassIndex, dominantMassIndex };
}

function isSpawnHabitableTerrain(teren: TerenBazowy | string): boolean {
  return teren !== TerenBazowy.Morze && teren !== TerenBazowy.Gory &&
    teren !== TerenBazowy.Wybrzeze && teren !== 'morze' && teren !== 'gory' && teren !== 'wybrzeze';
}

/**
 * Udział lądu zamieszkiwalnego w dysku hexów wokół (q,r), promień R (domyślnie 3).
 * Iteracja tylko po heksach w dysku — O(R²), nie po całej mapie (regres MAP-SPAWN-Q1 B).
 * Eksport do testów MAP-SPAWN-Q1 B (lokalna bramka, nie Voronoi).
 */
export function localLandFraction(
  map: GameMap,
  q: number,
  r: number,
  radius: number = LOCAL_LAND_DOMINANCE_RADIUS,
): { ratio: number; landCount: number; totalCount: number } {
  let landCount = 0;
  let totalCount = 0;
  for (let dq = -radius; dq <= radius; dq++) {
    const r1 = Math.max(-radius, -dq - radius);
    const r2 = Math.min(radius, -dq + radius);
    for (let dr = r1; dr <= r2; dr++) {
      const h = map.hexes[`${q + dq},${r + dr}`];
      if (!h) continue;
      totalCount++;
      if (isSpawnHabitableTerrain(h.terenBazowy)) landCount++;
    }
  }
  const ratio = totalCount > 0 ? landCount / totalCount : 0;
  return { ratio, landCount, totalCount };
}

export function passesLocalLandGate(
  map: GameMap,
  q: number,
  r: number,
  minFrac: number = LOCAL_LAND_DOMINANCE_FRAC,
  radius: number = LOCAL_LAND_DOMINANCE_RADIUS,
): boolean {
  return localLandFraction(map, q, r, radius).ratio >= minFrac;
}

/**
 * Ląd zamieszkiwalny w promieniu ekspansji na tej samej masie co (q,r).
 * MAP-SPAWN-Q2 B — preferencja hexów z największą przestrzenią rozwoju.
 */
export function developmentSpaceScore(
  map: GameMap,
  q: number,
  r: number,
  massesOrCache: MassesOrCache,
  radius: number = DEVELOPMENT_SPACE_RADIUS,
): number {
  const cache = resolveMassLandCache(massesOrCache);
  const mi = massContainingHex(cache.hexIndex, q, r);
  if (mi === null) return 0;
  const massSet = cache.massSets[mi]!;
  let count = 0;
  for (let dq = -radius; dq <= radius; dq++) {
    const r1 = Math.max(-radius, -dq - radius);
    const r2 = Math.min(radius, -dq + radius);
    for (let dr = r1; dr <= r2; dr++) {
      const nq = q + dq;
      const nr = r + dr;
      if (!massSet.has(`${nq},${nr}`)) continue;
      const h = map.hexes[`${nq},${nr}`];
      if (h && isSpawnHabitableTerrain(h.terenBazowy)) count++;
    }
  }
  return count;
}

/** Max typów obcych na masie wg rozmiaru (MAP-SPAWN-Q2 B). */
export function massTypeCap(massSize: number): number {
  if (massSize < SMALL_MASS_CAP_THRESHOLD) return 1;
  return Math.max(1, Math.floor(massSize / MIN_DEVELOPMENT_HEX_PER_CIV));
}

/**
 * Przydział slotów obcych typów na masy lądu — largest remainder (Hamilton).
 * MAP-SPAWN-Q2 B: proporcjonalnie do rozmiaru masy + cap małych mas + redystrybucja.
 *
 * @param nForeignTypy liczba obcych typów do rozmieszczenia (bez gracza)
 * @returns tablica równoległa do masses — ile obcych środków na każdej masie
 */
export function allocateTypyToMasses(
  nForeignTypy: number,
  masses: Array<Array<{ q: number; r: number }>>,
): number[] {
  const slots = masses.map(() => 0);
  if (nForeignTypy <= 0 || masses.length === 0) return slots;

  // Pangea: wszystkie obce typy na jedynej masie.
  if (masses.length === 1) {
    slots[0] = nForeignTypy;
    return slots;
  }

  const caps = masses.map(m => massTypeCap(m.length));
  const largestSize = masses[0]?.length ?? 0;
  const qualifyingIndices: number[] = [];
  for (let i = 0; i < masses.length; i++) {
    if (massQualifiesForForeignSpawn(masses[i]!.length, masses)) {
      qualifyingIndices.push(i);
    }
  }

  // Brak mas kwalifikujących — całość na największą masę (Pangea edge / awaryjnie).
  if (qualifyingIndices.length === 0) {
    slots[0] = nForeignTypy;
    return slots;
  }

  const totalQualifying = qualifyingIndices.reduce((s, i) => s + masses[i]!.length, 0);

  // Najpierw: po 1 typie na każdą kwalifikującą masę (rozłożenie po kontynentach).
  const sortedQualifying = [...qualifyingIndices].sort((a, b) => masses[b]!.length - masses[a]!.length);
  let nRemaining = nForeignTypy;
  for (const mi of sortedQualifying) {
    if (nRemaining <= 0) break;
    if (slots[mi]! < caps[mi]!) {
      slots[mi]! += 1;
      nRemaining -= 1;
    }
  }

  type RemainderEntry = { massIdx: number; remainder: number; exact: number; massSize: number };
  const remainders: RemainderEntry[] = [];
  let assigned = 0;

  for (const mi of qualifyingIndices) {
    const massSize = masses[mi]!.length;
    const exact = nRemaining * massSize / totalQualifying;
    const floor = Math.floor(exact);
    const room = caps[mi]! - slots[mi]!;
    const add = Math.min(floor, room);
    slots[mi]! += add;
    assigned += add;
    remainders.push({ massIdx: mi, remainder: exact - floor, exact, massSize });
  }

  // Largest remainder — rozdziel pozostałe sloty; tie-break: większa masa pierwsza.
  let leftover = nRemaining - assigned;
  remainders.sort((a, b) =>
    b.remainder - a.remainder || b.massSize - a.massSize || b.exact - a.exact || a.massIdx - b.massIdx,
  );

  for (const entry of remainders) {
    if (leftover <= 0) break;
    if (slots[entry.massIdx]! < caps[entry.massIdx]!) {
      slots[entry.massIdx]! += 1;
      leftover -= 1;
    }
  }

  // Redystrybucja gdy capy zablokowały — preferuj większe masy (nigdy na wyspy poniżej progu).
  if (leftover > 0) {
    const sorted = [...qualifyingIndices].sort((a, b) => masses[b]!.length - masses[a]!.length);
    for (const mi of sorted) {
      while (leftover > 0 && slots[mi]! < caps[mi]!) {
        slots[mi]! += 1;
        leftover -= 1;
      }
    }
  }

  if (leftover > 0 && typeof console !== 'undefined') {
    console.warn(
      `[clusters] allocateTypyToMasses: ${leftover} obcych typów bez miejsca po capach` +
      ` (n=${nForeignTypy}, largest=${largestSize}, threshold=${foreignSpawnMassThreshold(largestSize)})`,
    );
  }

  return slots;
}

/** Indeksy mas kwalifikujących się do spawnu obcych typów (MAP-SPAWN-Q2). */
export function qualifyingMassIndicesForSpawn(
  masses: Array<Array<{ q: number; r: number }>>,
): number[] {
  if (masses.length === 1) return [0];
  const out: number[] = [];
  for (let i = 0; i < masses.length; i++) {
    if (massQualifiesForForeignSpawn(masses[i]!.length, masses)) out.push(i);
  }
  return out;
}

/** Rozmiar masy lądu (flood-fill) zawierającej hex — 0 gdy poza masą ≥12 hex. */
export function massSizeAtHex(
  q: number,
  r: number,
  massesOrCache: MassesOrCache,
): number {
  const cache = resolveMassLandCache(massesOrCache);
  const mi = massContainingHex(cache.hexIndex, q, r);
  return mi !== null ? cache.masses[mi]!.length : 0;
}

/**
 * Bramka startu gracza: lokalny ląd ≥70% w R **oraz** masa wystarczająco duża
 * (≥ max(30, 8% największej masy) albo ≥25 hex przy spełnionym 70% lokalnym).
 */
export function passesPlayerStartMassGate(
  map: GameMap,
  q: number,
  r: number,
  massesOrCache: MassesOrCache,
): boolean {
  if (!passesLocalLandGate(map, q, r)) return false;
  const cache = resolveMassLandCache(massesOrCache);
  const massSize = massSizeAtHex(q, r, cache);
  const largest = cache.masses[0]?.length ?? 0;
  const scaledMin = Math.max(
    PLAYER_START_MASS_MIN_ABSOLUTE,
    Math.floor(largest * 0.08),
  );
  if (massSize >= scaledMin) return true;
  return massSize >= PLAYER_START_MIN_MASS_HEXES;
}

type SpawnLandCandidate = {
  h: { q: number; r: number };
  land: ReturnType<typeof localLandFraction>;
  dev: number;
  sea: number;
};

function sortSpawnLandCandidates(
  candidates: SpawnLandCandidate[],
  mapCenter: { q: number; r: number },
  seaFirst = false,
  minSeaDist = 0,
  maxSeaDist = 0,
): void {
  candidates.sort((a, b) => {
    const da = hexDistanceAxial(a.h.q, a.h.r, mapCenter.q, mapCenter.r);
    const db = hexDistanceAxial(b.h.q, b.h.r, mapCenter.q, mapCenter.r);
    // seaFirst = drabinka ratunkowa: szukaj głębiej w lądzie gdy brak hexów przy minSeaDist.
    if (seaFirst && b.sea !== a.sea) return b.sea - a.sea;
    // FALA 200: pas min…max od morza (Standard 10–15), nie „jak najbliżej 10”.
    if (!seaFirst && (minSeaDist > 0 || maxSeaDist > 0)) {
      const pa = capitalSeaBandPenalty(a.sea, minSeaDist, maxSeaDist);
      const pb = capitalSeaBandPenalty(b.sea, minSeaDist, maxSeaDist);
      if (pa !== pb) return pa - pb;
    }
    const core = b.dev - a.dev || b.land.ratio - a.land.ratio;
    if (core !== 0) return core;
    return db - da || a.h.q - b.h.q || a.h.r - b.h.r;
  });
}

/** FALA 196: farthest-point + bias pustych ćwiartek przy top-up / relokacji stolic. */
function sortSpawnCandidatesWithSpreadBias(
  candidates: SpawnLandCandidate[],
  mapCenter: { q: number; r: number },
  priorCapitals: Array<{ q: number; r: number }>,
  landBBox: { minQ: number; maxQ: number; minR: number; maxR: number },
  spreadN: number,
  seaFirst = false,
  minSeaDist = 0,
  maxSeaDist = 0,
): void {
  const midQ = (landBBox.minQ + landBBox.maxQ) / 2;
  const midR = (landBBox.minR + landBBox.maxR) / 2;
  const quadCounts = countCentersPerQuadrant(priorCapitals, midQ, midR);
  const preferred = preferredQuadrantsForSpread(quadCounts, spreadN);

  type Enriched = SpawnLandCandidate & { quad: number; minExist: number };
  const enriched: Enriched[] = candidates.map(c => ({
    ...c,
    quad: landQuadrantIndex(c.h.q, c.h.r, midQ, midR),
    minExist: priorCapitals.length === 0
      ? 999
      : Math.min(...priorCapitals.map(p => hexDistanceAxial(c.h.q, c.h.r, p.q, p.r))),
  }));

  let pool: Enriched[] = enriched;
  if (preferred && preferred.size > 0) {
    const quadFiltered = enriched.filter(c => preferred.has(c.quad));
    if (quadFiltered.length > 0) pool = quadFiltered;
  }

  pool.sort((a, b) => {
    if (b.minExist !== a.minExist) return b.minExist - a.minExist;
    const qa = quadCounts[a.quad] ?? 0;
    const qb = quadCounts[b.quad] ?? 0;
    if (qa !== qb) return qa - qb;
    const da = hexDistanceAxial(a.h.q, a.h.r, mapCenter.q, mapCenter.r);
    const db = hexDistanceAxial(b.h.q, b.h.r, mapCenter.q, mapCenter.r);
    if (seaFirst && b.sea !== a.sea) return b.sea - a.sea;
    if (!seaFirst && (minSeaDist > 0 || maxSeaDist > 0)) {
      const pa = capitalSeaBandPenalty(a.sea, minSeaDist, maxSeaDist);
      const pb = capitalSeaBandPenalty(b.sea, minSeaDist, maxSeaDist);
      if (pa !== pb) return pa - pb;
    }
    const core = b.dev - a.dev || b.land.ratio - a.land.ratio;
    if (core !== 0) return core;
    return db - da || a.h.q - b.h.q || a.h.r - b.h.r;
  });

  candidates.length = 0;
  for (const e of pool) {
    candidates.push({ h: e.h, land: e.land, dev: e.dev, sea: e.sea });
  }
}

function pickTiedSpawnLandCandidate(
  candidates: SpawnLandCandidate[],
  rand: () => number,
): { q: number; r: number } | null {
  if (candidates.length === 0) return null;
  const top = candidates[0]!;
  if (candidates.length === 1) return top.h;
  const tie = candidates.filter(x =>
    x.dev >= top.dev - 1
    && x.land.ratio >= top.land.ratio - 0.001
    && x.sea <= top.sea + 1,
  );
  return tie[Math.floor(rand() * tie.length)]!.h;
}

function playerStartCandidatesOnMasses(
  map: GameMap,
  landCache: MassLandCache,
  seaDist: Map<string, number> | undefined,
  minSeaDist: number,
  requireSeaGate: boolean,
): SpawnLandCandidate[] {
  const massOrder = landCache.masses.length > 0
    ? [landCache.masses[0]!, ...landCache.masses.slice(1)]
    : [];
  const out: SpawnLandCandidate[] = [];
  for (const mass of massOrder) {
    for (const h of mass) {
      if (!passesPlayerStartMassGate(map, h.q, h.r, landCache)) continue;
      const sea = seaDist ? seaDistAt(seaDist, h.q, h.r) : minSeaDist;
      if (requireSeaGate && seaDist && !passesMinSeaDistGate(seaDist, h.q, h.r, minSeaDist)) continue;
      out.push({
        h,
        land: localLandFraction(map, h.q, h.r),
        dev: developmentSpaceScore(map, h.q, h.r, landCache),
        sea,
      });
    }
  }
  return out;
}

/**
 * Hex startu gracza — zawsze preferuj masses[0] (największy kontynent) gdy spełnia bramki.
 * BUG-SPAWN-ODLEGLOSC-MORZE: najpierw szukaj hexu z minSeaDist na WSZYSTKICH masach;
 * dopiero potem fallback — preferuj mniejszy seaDist (bliżej brzegu, FALA 199).
 */
export function pickPlayerClusterCenter(
  map: GameMap,
  landCacheOrMasses: MassesOrCache,
  ladowe: Array<{ q: number; r: number }>,
  mapCenter: { q: number; r: number },
  rand: () => number,
  seaDist?: Map<string, number>,
  minSeaDist = 0,
): { q: number; r: number } | null {
  const landCache = resolveMassLandCache(landCacheOrMasses);
  const strict = playerStartCandidatesOnMasses(map, landCache, seaDist, minSeaDist, true);
  if (strict.length > 0) {
    sortSpawnLandCandidates(strict, mapCenter);
    const picked = pickTiedSpawnLandCandidate(strict, rand);
    if (picked) return picked;
  }

  let fallback = ladowe
    .map(h => ({
      h,
      land: localLandFraction(map, h.q, h.r),
      dev: developmentSpaceScore(map, h.q, h.r, landCache),
      sea: seaDist ? seaDistAt(seaDist, h.q, h.r) : minSeaDist,
    }))
    .filter(x => passesPlayerStartMassGate(map, x.h.q, x.h.r, landCache))
    .filter(x => !seaDist || passesMinSeaDistGate(seaDist, x.h.q, x.h.r, minSeaDist));
  sortSpawnLandCandidates(fallback, mapCenter);
  return fallback[0]?.h ?? null;
}

/** Najlepszy hex spawnu z puli — minDist od istniejących + bramka lokalnego lądu ≥70%. */
function pickBestLocalLandSpawn(
  map: GameMap,
  pool: Array<{ q: number; r: number }>,
  existing: Array<{ q: number; r: number }>,
  minDist: number,
  landCache: MassLandCache,
  rand?: () => number,
  seaDist?: Map<string, number>,
  minSeaDist = 0,
): { q: number; r: number } | null {
  const base = pool
    .filter(h => existing.every(p => hexDistanceAxial(h.q, h.r, p.q, p.r) >= minDist))
    .map(h => ({
      h,
      land: localLandFraction(map, h.q, h.r),
      dev: developmentSpaceScore(map, h.q, h.r, landCache),
      sea: seaDist ? seaDistAt(seaDist, h.q, h.r) : minSeaDist,
    }))
    .filter(x => x.land.ratio >= LOCAL_LAND_DOMINANCE_FRAC);
  let candidates = base.filter(x => !seaDist || passesMinSeaDistGate(seaDist, x.h.q, x.h.r, minSeaDist));
  const seaFirst = candidates.length === 0 && seaDist != null && minSeaDist > 0;
  if (seaFirst) candidates = base.slice();
  candidates.sort((a, b) => {
    if (seaFirst && b.sea !== a.sea) return b.sea - a.sea;
    const core = b.dev - a.dev || b.land.ratio - a.land.ratio;
    if (core !== 0) return core;
    return a.sea - b.sea || a.h.q - b.h.q || a.h.r - b.h.r;
  });
  if (candidates.length === 0) return null;
  const top = candidates[0]!;
  if (candidates.length > 1 && rand) {
    const tieBand = candidates.filter(x =>
      x.dev >= top.dev - 1 && x.land.ratio >= top.land.ratio - 0.001 && x.sea <= top.sea + 1,
    );
    return tieBand[Math.floor(rand() * tieBand.length)]!.h;
  }
  return top.h;
}

function assignVoronoiRegions(
  ladowe: Array<{ q: number; r: number }>,
  centrumy: Array<{ q: number; r: number }>,
): Array<Array<{ q: number; r: number }>> {
  const regiony: Array<Array<{ q: number; r: number }>> = Array.from(
    { length: centrumy.length },
    () => [],
  );
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
  return regiony;
}

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

function pickCenterInMassWithLandGate(
  map: GameMap,
  mass: Array<{ q: number; r: number }>,
  existing: Array<{ q: number; r: number }>,
  minDist: number,
  landCache: MassLandCache,
  preferNear?: { q: number; r: number },
  rand?: () => number,
  seaDist?: Map<string, number>,
  minSeaDist = 0,
): { q: number; r: number } | null {
  const centroid = massCentroid(mass);
  const base = mass
    .filter(h => existing.every(p => hexDistanceAxial(h.q, h.r, p.q, p.r) >= minDist))
    .map(h => ({
      h,
      land: localLandFraction(map, h.q, h.r),
      dev: developmentSpaceScore(map, h.q, h.r, landCache),
      sea: seaDist ? seaDistAt(seaDist, h.q, h.r) : minSeaDist,
      score: hexDistanceAxial(h.q, h.r, centroid.q, centroid.r)
        + (preferNear ? hexDistanceAxial(h.q, h.r, preferNear.q, preferNear.r) * 0.05 : 0),
    }))
    .filter(x => x.land.ratio >= LOCAL_LAND_DOMINANCE_FRAC);
  let candidates = base.filter(x => !seaDist || passesMinSeaDistGate(seaDist, x.h.q, x.h.r, minSeaDist));
  const seaFirst = candidates.length === 0 && seaDist != null && minSeaDist > 0;
  if (seaFirst) candidates = base.slice();
  candidates.sort((a, b) => {
    if (seaFirst && b.sea !== a.sea) return b.sea - a.sea;
    const core = b.dev - a.dev || b.land.ratio - a.land.ratio;
    if (core !== 0) return core;
    return b.sea - a.sea || a.score - b.score;
  });
  if (candidates.length === 0) return null;
  const top = candidates[0]!;
  if (rand && candidates.length > 1) {
    const tieBand = candidates.filter(x =>
      x.dev >= top.dev - 1 && x.land.ratio >= top.land.ratio - 0.001,
    );
    return tieBand[Math.floor(rand() * tieBand.length)]!.h;
  }
  return top.h;
}

/**
 * FALA 180/185: farthest-point na masie — równomierny rozkład wzdłuż kontynentu.
 * FALA 185: bias do pustych ćwiartek bboxa lądu przy remisie minExist.
 */
function pickCenterInMassSpread(
  map: GameMap,
  mass: Array<{ q: number; r: number }>,
  existing: Array<{ q: number; r: number }>,
  minDist: number,
  landCache: MassLandCache,
  rand?: () => number,
  seaDist?: Map<string, number>,
  minSeaDist = 0,
  landBBox?: { minQ: number; maxQ: number; minR: number; maxR: number },
  spreadOpts?: ClusterSpreadOpts,
): { q: number; r: number } | null {
  const midQ = landBBox ? (landBBox.minQ + landBBox.maxQ) / 2 : 0;
  const midR = landBBox ? (landBBox.minR + landBBox.maxR) / 2 : 0;
  const quadCounts = landBBox
    ? countCentersPerQuadrant(existing, midQ, midR)
    : null;

  const base = mass
    .filter(h => existing.every(p => hexDistanceAxial(h.q, h.r, p.q, p.r) >= minDist))
    .map(h => ({
      h,
      land: localLandFraction(map, h.q, h.r),
      sea: seaDist ? seaDistAt(seaDist, h.q, h.r) : minSeaDist,
      minExist: existing.length === 0
        ? 999
        : Math.min(...existing.map(p => hexDistanceAxial(h.q, h.r, p.q, p.r))),
      quad: landBBox ? landQuadrantIndex(h.q, h.r, midQ, midR) : 0,
    }))
    .filter(x => x.land.ratio >= LOCAL_LAND_DOMINANCE_FRAC);
  let candidates = base.filter(x => !seaDist || passesMinSeaDistGate(seaDist, x.h.q, x.h.r, minSeaDist));
  if (candidates.length === 0 && seaDist != null && minSeaDist > 0) {
    candidates = base.slice();
  }
  if (candidates.length === 0) return null;

  // FALA 186: twardy filtr ćwiartek PRZED farthest-point (nie tylko tie-break).
  if (landBBox && quadCounts && spreadOpts && spreadOpts.nNeeded >= 5) {
    const preferred = preferredQuadrantsForSpread(quadCounts, spreadOpts.nNeeded);
    if (preferred && preferred.size > 0) {
      const quadFiltered = candidates.filter(c => preferred.has(c.quad));
      if (quadFiltered.length > 0) candidates = quadFiltered;
    }
  }

  candidates.sort((a, b) => {
    if (b.minExist !== a.minExist) return b.minExist - a.minExist;
    if (quadCounts) {
      const qa = quadCounts[a.quad] ?? 0;
      const qb = quadCounts[b.quad] ?? 0;
      if (qa !== qb) return qa - qb;
    }
    const aSeaScore = Math.min(a.sea, minSeaDist + 4);
    const bSeaScore = Math.min(b.sea, minSeaDist + 4);
    if (bSeaScore !== aSeaScore) return bSeaScore - aSeaScore;
    return (rand ? rand() * 2 - 1 : 0) || a.h.q - b.h.q;
  });
  const top = candidates[0]!;
  if (rand && candidates.length > 1) {
    const band = candidates.filter(x => {
      if (x.minExist < top.minExist - 1) return false;
      if (quadCounts) {
        const tq = quadCounts[top.quad] ?? 0;
        return (quadCounts[x.quad] ?? 0) <= tq + 1;
      }
      return true;
    });
    return band[Math.floor(rand() * band.length)]!.h;
  }
  return top.h;
}

/** FALA 185: farthest-point na całej puli lądu (wszystkie kwalifikujące masy). */
function pickCenterOnLandPoolSpread(
  map: GameMap,
  pool: Array<{ q: number; r: number }>,
  existing: Array<{ q: number; r: number }>,
  minDist: number,
  landCache: MassLandCache,
  rand: () => number,
  seaDist?: Map<string, number>,
  minSeaDist = 0,
  landBBox?: { minQ: number; maxQ: number; minR: number; maxR: number },
  spreadOpts?: ClusterSpreadOpts,
): { q: number; r: number } | null {
  return pickCenterInMassSpread(
    map, pool, existing, minDist, landCache, rand, seaDist, minSeaDist, landBBox, spreadOpts,
  );
}

/**
 * FALA 185: 1–2 iteracje wyrównania — przesuń najciaśniejszy środek w stronę dziury lądu.
 */
function balanceClusterSpread(
  map: GameMap,
  centers: Array<{ q: number; r: number }>,
  ladowe: Array<{ q: number; r: number }>,
  landCache: MassLandCache,
  minDist: number,
  rand: () => number,
  seaDist: Map<string, number> | undefined,
  minSeaDist: number,
  landBBox: { minQ: number; maxQ: number; minR: number; maxR: number },
  maxIterations = 2,
  spreadOpts?: ClusterSpreadOpts,
): Array<{ q: number; r: number }> {
  if (centers.length < 2 || maxIterations <= 0) return centers;
  const out = centers.map(c => ({ ...c }));

  for (let iter = 0; iter < maxIterations; iter++) {
    let farthestHole: { q: number; r: number; minCenterDist: number } | null = null;
    for (const h of ladowe) {
      if (!passesLocalLandGate(map, h.q, h.r)) continue;
      if (seaDist && minSeaDist > 0 && !passesMinSeaDistGate(seaDist, h.q, h.r, minSeaDist)) continue;
      const minCenterDist = Math.min(...out.map(c => hexDistanceAxial(h.q, h.r, c.q, c.r)));
      if (!farthestHole || minCenterDist > farthestHole.minCenterDist) {
        farthestHole = { q: h.q, r: h.r, minCenterDist };
      }
    }
    if (!farthestHole || farthestHole.minCenterDist < minDist * 0.75) break;

    let tightestIdx = 0;
    let tightestSep = Infinity;
    for (let i = 0; i < out.length; i++) {
      const others = out.filter((_, j) => j !== i);
      const sep = minCapitalSeparationDistance(out[i]!, others) ?? Infinity;
      if (sep < tightestSep) {
        tightestSep = sep;
        tightestIdx = i;
      }
    }

    const others = out.filter((_, j) => j !== tightestIdx);
    const relocated = pickCenterOnLandPoolSpread(
      map,
      ladowe,
      others,
      minDist,
      landCache,
      rand,
      seaDist,
      minSeaDist,
      landBBox,
      spreadOpts,
    );
    if (!relocated) break;

    const towardHole = hexDistanceAxial(relocated.q, relocated.r, farthestHole.q, farthestHole.r);
    const currentToward = hexDistanceAxial(out[tightestIdx]!.q, out[tightestIdx]!.r, farthestHole.q, farthestHole.r);
    const spreadBefore = clusterCenterQuadrantSpread(out, landBBox).occupiedQuadrants;
    const spreadAfter = clusterCenterQuadrantSpread(
      [...others, relocated],
      landBBox,
    ).occupiedQuadrants;
    if (
      towardHole < currentToward - 2
      || farthestHole.minCenterDist > minDist * 1.25
      || spreadAfter > spreadBefore
    ) {
      out[tightestIdx] = relocated;
    } else {
      break;
    }
  }

  return out;
}

/**
 * FALA 186: po balance — przesuń środek z przepełnionej ćwiartki do pustej (maximinin + minDist).
 */
function enforceQuarterSpreadOnCenters(
  map: GameMap,
  centers: Array<{ q: number; r: number }>,
  ladowe: Array<{ q: number; r: number }>,
  landCache: MassLandCache,
  minDist: number,
  rand: () => number,
  seaDist: Map<string, number> | undefined,
  minSeaDist: number,
  landBBox: { minQ: number; maxQ: number; minR: number; maxR: number },
  nNeeded: number,
): Array<{ q: number; r: number }> {
  if (nNeeded < 5 || centers.length < 3) return centers;
  const required = minimumSpreadQuartersRequired(nNeeded);
  const out = centers.map(c => ({ ...c }));
  const midQ = (landBBox.minQ + landBBox.maxQ) / 2;
  const midR = (landBBox.minR + landBBox.maxR) / 2;
  const spreadOpts: ClusterSpreadOpts = { nNeeded };

  for (let iter = 0; iter < 10; iter++) {
    const spread = clusterCenterQuadrantSpread(out, landBBox);
    if (spread.occupiedQuadrants >= required) break;

    const counts = countCentersPerQuadrant(out, midQ, midR);
    let relocateIdx = -1;
    let maxQuadLoad = -1;
    for (let i = 0; i < out.length; i++) {
      const q = landQuadrantIndex(out[i]!.q, out[i]!.r, midQ, midR);
      if (counts[q]! > maxQuadLoad) {
        maxQuadLoad = counts[q]!;
        relocateIdx = i;
      }
    }
    if (relocateIdx < 0 || maxQuadLoad <= 1) break;

    const others = out.filter((_, j) => j !== relocateIdx);
    const relocated = pickCenterOnLandPoolSpread(
      map, ladowe, others, minDist, landCache, rand, seaDist, minSeaDist, landBBox, spreadOpts,
    );
    if (!relocated) break;

    const newSpread = clusterCenterQuadrantSpread([...others, relocated], landBBox);
    const newQuad = landQuadrantIndex(relocated.q, relocated.r, midQ, midR);
    const movingToEmpty = counts[newQuad] === 0;
    if (newSpread.occupiedQuadrants > spread.occupiedQuadrants || movingToEmpty) {
      out[relocateIdx] = relocated;
    } else {
      break;
    }
  }

  return out;
}

/**
 * Rozmieszcza środki klastrów wg quota na masach lądu (MAP-SPAWN-Q2 B).
 * FALA 180: minDist = twarde capitalMinSep (bez luzowania do 2);
 * FALA 185: S_cluster na całej masie lądu + bias ćwiartek + wyrównanie 1–2 iter.
 */
function placeClusterCentersAcrossLandmasses(
  map: GameMap,
  ladowe: Array<{ q: number; r: number }>,
  landCache: MassLandCache,
  nNeeded: number,
  minDistBase: number,
  mapCenter: { q: number; r: number },
  rand: () => number,
  marginBrzeg: number,
  bounds: { minQ: number; maxQ: number; minR: number; maxR: number },
  seaDist?: Map<string, number>,
  minSeaDist = 0,
): Array<{ q: number; r: number }> {
  const { minQ, maxQ, minR, maxR } = bounds;
  const landBBox = {
    minQ: Math.min(...ladowe.map(h => h.q)),
    maxQ: Math.max(...ladowe.map(h => h.q)),
    minR: Math.min(...ladowe.map(h => h.r)),
    maxR: Math.max(...ladowe.map(h => h.r)),
  };
  const masses = landCache.masses;
  const hexIndex = landCache.hexIndex;
  const centers: Array<{ q: number; r: number }> = [];
  const hardMin = Math.max(1, minDistBase);

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

  function countCentersOnMass(massIdx: number): number {
    return centers.filter(c => massContainingHex(hexIndex, c.q, c.r) === massIdx).length;
  }

  function tryPlace(
    c: { q: number; r: number } | null,
    minDist: number,
    relaxMargin: boolean,
    forPlayer = false,
    softLocalLand = false,
  ): boolean {
    if (!c || hasCenter(c)) return false;
    if (!okMargins(c.q, c.r, relaxMargin)) return false;
    if (centers.some(p => hexDistanceAxial(c.q, c.r, p.q, p.r) < minDist)) return false;
    if (forPlayer) {
      if (!passesPlayerStartMassGate(map, c.q, c.r, landCache)) return false;
    } else if (!softLocalLand && !passesLocalLandGate(map, c.q, c.r)) {
      return false;
    }
    centers.push(c);
    return true;
  }

  const qualifyingIndices = qualifyingMassIndicesForSpawn(masses);
  const fullLandPool: Array<{ q: number; r: number }> = [];
  for (const mi of qualifyingIndices) {
    for (const h of masses[mi]!) fullLandPool.push(h);
  }
  const placementPool = fullLandPool.length > 0 ? fullLandPool : ladowe;
  const spreadOpts: ClusterSpreadOpts = { nNeeded };

  // Faza 0: gracz ZAWSZY na największej masie spełniającej bramki (MAP-SPAWN-Q1 B).
  const playerCenter = pickPlayerClusterCenter(map, landCache, ladowe, mapCenter, rand, seaDist, minSeaDist);
  if (playerCenter) {
    centers.push(playerCenter);
  }

  const nForeign = nNeeded - centers.length;
  const foreignAllocation = allocateTypyToMasses(nForeign, masses);
  const playerOnMass0 = playerCenter
    && massContainingHex(hexIndex, playerCenter.q, playerCenter.r) === 0;

  const qualifyingOrder = qualifyingIndices
    .sort((a, b) => masses[b]!.length - masses[a]!.length);

  // Faza 1: quota — farthest-point na całej masie lądu + bias ćwiartek (FALA 185).
  for (const mi of qualifyingOrder) {
    if (centers.length >= nNeeded) break;
    const targetForeign = foreignAllocation[mi] ?? 0;
    const playerOnMass = mi === 0 && playerOnMass0;

    while (centers.length < nNeeded) {
      const currentForeign = countCentersOnMass(mi) - (playerOnMass ? 1 : 0);
      if (currentForeign >= targetForeign) break;
      const before = centers.length;
      const candidate = masses.length === 1
        ? pickCenterOnLandPoolSpread(
          map, placementPool, centers, hardMin, landCache, rand, seaDist, minSeaDist, landBBox, spreadOpts,
        )
        : pickCenterInMassSpread(
          map, masses[mi]!, centers, hardMin, landCache, rand, seaDist, minSeaDist, landBBox, spreadOpts,
        );
      tryPlace(candidate, hardMin, false);
      if (centers.length === before) break;
    }
  }

  // Faza 2: dopełnij brakujące typy — cała masa lądu (Pangea) lub największe masy.
  if (centers.length < nNeeded && qualifyingOrder.length > 0) {
    let guard = 0;
    while (centers.length < nNeeded && guard++ < nNeeded * 6) {
      let placedAny = false;
      const candidate = masses.length === 1
        ? pickCenterOnLandPoolSpread(
          map, placementPool, centers, hardMin, landCache, rand, seaDist, minSeaDist, landBBox, spreadOpts,
        )
        : null;
      if (candidate) {
        if (tryPlace(candidate, hardMin, true)) placedAny = true;
      }
      if (!placedAny) {
        for (const mi of qualifyingOrder) {
          if (centers.length >= nNeeded) break;
          const before = centers.length;
          tryPlace(
            pickCenterInMassSpread(
              map, masses[mi]!, centers, hardMin, landCache, rand, seaDist, minSeaDist, landBBox, spreadOpts,
            ),
            hardMin,
            true,
          );
          if (centers.length > before) { placedAny = true; break; }
        }
      }
      if (!placedAny) break;
    }
  }

  // Faza 3: wyrównanie spreadu (do 6 iteracji przy większej liczbie typów).
  if (centers.length >= 2) {
    const balanceIters = Math.max(2, Math.min(6, Math.ceil(nNeeded / 2)));
    const balanced = balanceClusterSpread(
      map, centers, placementPool, landCache, hardMin, rand, seaDist, minSeaDist, landBBox, balanceIters, spreadOpts,
    );
    centers.length = 0;
    centers.push(...balanced);
  }

  // Faza 4: twardy coverage ćwiartek (Pangea N≥5).
  if (centers.length >= 3 && nNeeded >= 5) {
    const quarterFixed = enforceQuarterSpreadOnCenters(
      map, centers, placementPool, landCache, hardMin, rand, seaDist, minSeaDist, landBBox, nNeeded,
    );
    centers.length = 0;
    centers.push(...quarterFixed);
  }

  // Faza 5: dopełnij brakujące środki (Pangea N=7 — twardy minSep, pełna masa lądu).
  if (centers.length < nNeeded) {
    let guard = 0;
    while (centers.length < nNeeded && guard++ < nNeeded * 12) {
      const before = centers.length;
      tryPlace(
        pickCenterOnLandPoolSpread(
          map, placementPool, centers, hardMin, landCache, rand, seaDist, minSeaDist, landBBox, spreadOpts,
        ),
        hardMin,
        true,
      );
      if (centers.length === before) break;
    }
  }

  // Faza 5b FALA 188: soft local-land — lepiej 7 civ na brzegu niż drop przy wolnym lądzie.
  if (centers.length < nNeeded) {
    let guard = 0;
    while (centers.length < nNeeded && guard++ < nNeeded * 16) {
      const before = centers.length;
      const candidate = placementPool
        .filter(h => centers.every(p => hexDistanceAxial(h.q, h.r, p.q, p.r) >= hardMin))
        .map(h => ({
          h,
          minExist: centers.length === 0
            ? 999
            : Math.min(...centers.map(p => hexDistanceAxial(h.q, h.r, p.q, p.r))),
          sea: seaDist ? seaDistAt(seaDist, h.q, h.r) : 0,
        }))
        .sort((a, b) => b.minExist - a.minExist || b.sea - a.sea)[0]?.h ?? null;
      tryPlace(candidate, hardMin, true, false, true);
      if (centers.length === before) break;
    }
  }

  if (centers.length < nNeeded && typeof console !== 'undefined') {
    console.warn(
      `[clusters] placeClusterCenters: tylko ${centers.length}/${nNeeded} środków` +
      ` (twardy minSep=${hardMin}; bez luzowania — lepiej mniej civ niż kupa)`,
    );
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

/**
 * Maks. zasięg łańcucha hubów od stolicy klastra (hexy).
 * N MP w pierścieniach 5 hex → ostatnie MP może być ~5×N od stolicy.
 */
export function clusterHubChainReachHex(stateCityCount: number): number {
  const n = Math.max(1, stateCityCount + CLUSTER_GROWTH_RESERVE);
  return CLUSTER_CITY_STATE_MAX_HEX * n;
}

/**
 * Min. odległość stolicy od morza (seaDist BFS) — skala per rozmiar mapy.
 * Standard (duza, 168×120) = 10 hex (BUG-SPAWN-ODLEGLOSC-MORZE, Maciej 2026-08-01).
 */
export function capitalMinSeaDist(rozmiar: RozmiarKlaster): number {
  const lut: Record<RozmiarKlaster, number> = {
    mala: 4,
    srednia: 7,
    duza: 10,
    ogromna: 12,
    super: 14,
  };
  return lut[rozmiar];
}

/**
 * Maks. odległość stolicy od morza — pas min…max (Maciej 2026-08-02).
 * Standard: 10–15 hex. Szerokość pasa = +5 względem min.
 */
export function capitalMaxSeaDist(rozmiar: RozmiarKlaster): number {
  return capitalMinSeaDist(rozmiar) + 5;
}

/**
 * Clamp minSeaDist do rozmiaru mapy.
 * Harness 50×50 / short&lt;80: bez inland gate (Voronoi/MP).
 * FALA 176: NIE ścinaj tabeli przez short/12 (dawało Standard&lt;10 przy H≈100) —
 * Maciej: Standard = twarde 10 hex (jak od morza).
 */
export function capitalMinSeaDistForMap(
  rozmiar: RozmiarKlaster,
  mapW: number,
  mapH: number,
): number {
  const short = Math.min(mapW, mapH);
  if (short < 80) return 0;
  return capitalMinSeaDist(rozmiar);
}

export function capitalMaxSeaDistForMap(
  rozmiar: RozmiarKlaster,
  mapW: number,
  mapH: number,
): number {
  const short = Math.min(mapW, mapH);
  if (short < 80) return 0;
  return capitalMaxSeaDist(rozmiar);
}

/** Maks. odległość miasta od stolicy klastra — spójność kręgu (BUG-SPAWN-CLUSTER-KULTURA). */
export function clusterCohesionMaxHex(stateCityCount: number): number {
  return clusterHubChainReachHex(stateCityCount);
}

export function seaDistAt(
  seaDist: Map<string, number>,
  q: number,
  r: number,
): number {
  return seaDist.get(hexKey(q, r)) ?? 0;
}

export function passesMinSeaDistGate(
  seaDist: Map<string, number>,
  q: number,
  r: number,
  minDist: number,
): boolean {
  return seaDistAt(seaDist, q, r) >= minDist;
}

/** Pas stolicy od morza: min ≤ seaDist ≤ max (max≤0 = tylko min). */
export function passesCapitalSeaBandGate(
  seaDist: Map<string, number>,
  q: number,
  r: number,
  minDist: number,
  maxDist: number,
): boolean {
  const d = seaDistAt(seaDist, q, r);
  if (minDist > 0 && d < minDist) return false;
  if (maxDist > 0 && d > maxDist) return false;
  return true;
}

/** Kara sortowania: 0 w środku pasa, duża poza pasem. */
export function capitalSeaBandPenalty(
  sea: number,
  minDist: number,
  maxDist: number,
): number {
  if (!(minDist > 0) && !(maxDist > 0)) return 0;
  const lo = Math.max(0, minDist);
  const hi = maxDist > 0 ? maxDist : lo + 5;
  if (sea < lo) return 1000 + (lo - sea);
  if (sea > hi) return 100 + (sea - hi);
  const ideal = (lo + hi) / 2;
  return Math.abs(sea - ideal);
}

/** Min. odległość między stolicami różnych cywilizacji (Maciej 2026-08-02, FALA 182 +2 hex;
 * Standard +1 hex 2026-08-02 wieczór: 14→15 — tylko duza, bez zmiany MP w klastrze).
 * Osobno od seaDist: Mała/Średnia=12, Standard=15, Duża=16, Super=19.
 */
export function capitalMinSeparation(rozmiar: RozmiarKlaster): number {
  const lut: Record<RozmiarKlaster, number> = {
    mala: 12,
    srednia: 12,
    duza: 15,
    ogromna: 16,
    super: 19,
  };
  return lut[rozmiar];
}

/**
 * Clamp sep stolic do rozmiaru mapy.
 * short&lt;80 (harness): bez bramki. Inaczej tabela capitalMinSeparation — bez ścinania short/12.
 */
export function capitalMinSeparationForMap(
  rozmiar: RozmiarKlaster,
  mapW: number,
  mapH: number,
): number {
  const short = Math.min(mapW, mapH);
  if (short < 80) return 0;
  return capitalMinSeparation(rozmiar);
}

/**
 * FALA 185: min. odległość między dowolnymi miastami różnych civ (bryła klastra).
 * S_cluster = capitalMinSeparation (tabela 12/12/15/16/19 — bez luzowania).
 * Bufor MP = S/2 wokół obcej stolicy; egzekwowany przy pakowaniu.
 */
export function clusterBodySeparation(rozmiar: RozmiarKlaster): number {
  return capitalMinSeparation(rozmiar);
}

/**
 * Min. odległość środków klastrów przy farthest-point (+2 na pierścień MP 5 hex
 * wewnątrz bufora bryły S/2 — np. Standard: sep stolic 15, placement 17, bufor 8).
 */
export function clusterCenterPlacementSep(rozmiar: RozmiarKlaster): number {
  return capitalMinSeparation(rozmiar) + 2;
}

export function clusterBodySeparationForMap(
  rozmiar: RozmiarKlaster,
  mapW: number,
  mapH: number,
): number {
  const short = Math.min(mapW, mapH);
  if (short < 80) return 0;
  return clusterBodySeparation(rozmiar);
}

export function clusterCenterPlacementSepForMap(
  rozmiar: RozmiarKlaster,
  mapW: number,
  mapH: number,
): number {
  const short = Math.min(mapW, mapH);
  if (short < 80) return 0;
  return clusterCenterPlacementSep(rozmiar);
}

/** Promień bufora obcego klastra wokół stolicy — MP nie mogą tu wejść (FALA 185). */
export function clusterBodyBufferRadius(sCluster: number): number {
  if (!Number.isFinite(sCluster) || sCluster <= 0) return 0;
  return Math.ceil(sCluster / 2);
}

export interface ForeignClusterBuffer {
  q: number;
  r: number;
  radius: number;
}

export function passesForeignClusterBufferGate(
  h: { q: number; r: number },
  buffers: ReadonlyArray<ForeignClusterBuffer>,
): boolean {
  for (const b of buffers) {
    if (hexDistanceAxial(h.q, h.r, b.q, b.r) < b.radius) return false;
  }
  return true;
}

/** Ćwiartka bounding-boxa lądu (0..3) — bias spawnu w puste rogi (FALA 185). */
export function landQuadrantIndex(
  q: number,
  r: number,
  midQ: number,
  midR: number,
): number {
  const east = q >= midQ ? 1 : 0;
  const south = r >= midR ? 1 : 0;
  return east + south * 2;
}

function countCentersPerQuadrant(
  centers: Array<{ q: number; r: number }>,
  midQ: number,
  midR: number,
): [number, number, number, number] {
  const counts: [number, number, number, number] = [0, 0, 0, 0];
  for (const c of centers) {
    counts[landQuadrantIndex(c.q, c.r, midQ, midR)]! += 1;
  }
  return counts;
}

/** Min. liczba ćwiartek bboxa lądu z ≥1 środkiem — FALA 186+ spread. */
export function minimumSpreadQuartersRequired(nNeeded: number): number {
  if (nNeeded >= 6) return 3;
  if (nNeeded >= 5) return 3;
  if (nNeeded >= 3) return 2;
  return 1;
}

type ClusterSpreadOpts = { nNeeded: number };

/** Ćwiartki preferowane dla kolejnego środka — puste najpierw, potem round-robin najsłabszych. */
function preferredQuadrantsForSpread(
  quadCounts: [number, number, number, number],
  nNeeded: number,
): Set<number> | null {
  if (nNeeded < 5) return null;
  const required = minimumSpreadQuartersRequired(nNeeded);
  const occupied = quadCounts.filter(c => c > 0).length;
  const empty = [0, 1, 2, 3].filter(q => quadCounts[q] === 0);
  if (occupied < required && empty.length > 0) return new Set(empty);
  const minCount = Math.min(...quadCounts);
  return new Set([0, 1, 2, 3].filter(q => quadCounts[q] === minCount));
}

/** Zakres Q/R środków po ćwiartkach bboxa lądu — eksport do testów spreadu. */
export function clusterCenterQuadrantSpread(
  centers: Array<{ q: number; r: number }>,
  landBBox: { minQ: number; maxQ: number; minR: number; maxR: number },
): { occupiedQuadrants: number; qSpan: number; rSpan: number } {
  if (centers.length === 0) {
    return { occupiedQuadrants: 0, qSpan: 0, rSpan: 0 };
  }
  const midQ = (landBBox.minQ + landBBox.maxQ) / 2;
  const midR = (landBBox.minR + landBBox.maxR) / 2;
  const quads = new Set<number>();
  let minQ = Infinity;
  let maxQ = -Infinity;
  let minR = Infinity;
  let maxR = -Infinity;
  for (const c of centers) {
    quads.add(landQuadrantIndex(c.q, c.r, midQ, midR));
    if (c.q < minQ) minQ = c.q;
    if (c.q > maxQ) maxQ = c.q;
    if (c.r < minR) minR = c.r;
    if (c.r > maxR) maxR = c.r;
  }
  return {
    occupiedQuadrants: quads.size,
    qSpan: maxQ - minQ,
    rSpan: maxR - minR,
  };
}

export function passesMinCapitalSeparationGate(
  c: { q: number; r: number },
  priorCapitals: Array<{ q: number; r: number }>,
  minSep: number,
): boolean {
  if (!Number.isFinite(minSep) || minSep <= 0 || priorCapitals.length === 0) return true;
  return priorCapitals.every(
    p => hexDistanceAxial(c.q, c.r, p.q, p.r) >= minSep,
  );
}

/** Najbliższa odległość stolicy od jakiejkolwiek innej (hex); null gdy brak innych. */
export function minCapitalSeparationDistance(
  c: { q: number; r: number },
  others: Array<{ q: number; r: number }>,
): number | null {
  if (others.length === 0) return null;
  let best = Infinity;
  for (const p of others) {
    const d = hexDistanceAxial(c.q, c.r, p.q, p.r);
    if (d < best) best = d;
  }
  return best;
}

export interface PickSpawnHexWithCapitalGatesOpts {
  seaDist?: Map<string, number>;
  minSeaDist?: number;
  /** FALA 200: górny kraniec pasa (Standard 15 przy min 10). 0 = bez max. */
  maxSeaDist?: number;
  priorCapitals?: Array<{ q: number; r: number }>;
  minCapitalSep?: number;
  requirePlayerMassGate?: boolean;
  requireLocalLand?: boolean;
  preferred?: { q: number; r: number };
  /**
   * FALA 188: gdy brak hexu przy pełnym minSeaDist — schodź seaDist w dół (sep stolic
   * ZOSTAJE twarde). Bez tego nieregularna Pangea + sep 12/14 dawała max ~4 civ.
   */
  progressiveSoftSea?: boolean;
  /** FALA 196: bbox lądu — bias pustych ćwiartek przy top-up / relokacji. */
  landBBox?: { minQ: number; maxQ: number; minR: number; maxR: number };
  /** FALA 196: liczba typów (N) — minimum ćwiartek wg minimumSpreadQuartersRequired. */
  spreadN?: number;
}

/** Drabinka seaDist: najpierw pełny wymóg, potem miększe — sep stolic nietknięte. */
export function seaDistRescueLadder(minSeaDist: number): number[] {
  if (!Number.isFinite(minSeaDist) || minSeaDist <= 0) return [0];
  const steps = [
    minSeaDist,
    Math.max(2, Math.ceil(minSeaDist * 0.75)),
    Math.max(2, Math.ceil(minSeaDist * 0.55)),
    Math.max(2, Math.floor(minSeaDist * 0.4)),
    2,
    0, // absolutna ostatnia szansa — wolny ląd przy brzegu > drop civ
  ];
  return [...new Set(steps)];
}

/**
 * Szuka hexu spawnu spełniającego twardo: lokalny ląd, masa gracza (opcjonalnie),
 * seaDist i minSep od wcześniejszych stolic. Zero fail-open — brak kandydata = null.
 * Przy progressiveSoftSea: seaDist mięknie; minCapitalSep nigdy.
 * FALA 200: wśród legalnych preferuj pas min…max (np. 10–15), nie głęboki interior.
 */
export function pickSpawnHexWithCapitalGates(
  map: GameMap,
  pool: Array<{ q: number; r: number }>,
  landCache: MassLandCache,
  mapCenter: { q: number; r: number },
  rand: () => number,
  opts: PickSpawnHexWithCapitalGatesOpts = {},
): { q: number; r: number } | null {
  const {
    seaDist,
    minSeaDist = 0,
    priorCapitals = [],
    minCapitalSep = 0,
    requirePlayerMassGate = false,
    requireLocalLand = true,
    preferred,
    progressiveSoftSea = false,
    landBBox,
    spreadN,
  } = opts;
  const maxSeaDist = opts.maxSeaDist != null
    ? opts.maxSeaDist
    : (minSeaDist > 0 ? minSeaDist + 5 : 0);

  const seaSteps = progressiveSoftSea
    ? seaDistRescueLadder(minSeaDist)
    : [minSeaDist];

  for (const seaMin of seaSteps) {
    const passes = (h: { q: number; r: number }): boolean => {
      if (requireLocalLand && !passesLocalLandGate(map, h.q, h.r)) return false;
      if (requirePlayerMassGate && !passesPlayerStartMassGate(map, h.q, h.r, landCache)) return false;
      if (seaDist && seaMin > 0 && !passesMinSeaDistGate(seaDist, h.q, h.r, seaMin)) return false;
      if (!passesMinCapitalSeparationGate(h, priorCapitals, minCapitalSep)) return false;
      return true;
    };

    if (preferred && passes(preferred)) {
      if (!seaDist || maxSeaDist <= 0 || seaMin < minSeaDist
        || passesCapitalSeaBandGate(seaDist, preferred.q, preferred.r, seaMin, maxSeaDist)) {
        return preferred;
      }
    }

    let candidates: SpawnLandCandidate[] = pool
      .filter(passes)
      .map(h => ({
        h,
        land: localLandFraction(map, h.q, h.r),
        dev: developmentSpaceScore(map, h.q, h.r, landCache),
        sea: seaDist ? seaDistAt(seaDist, h.q, h.r) : seaMin,
      }));
    if (candidates.length === 0) continue;

    // Pełny wymóg min: najpierw pas min…max; soft ladder — tylko ≥ seaMin.
    const bandMax = seaMin >= minSeaDist && maxSeaDist > 0 ? maxSeaDist : 0;
    if (bandMax > 0) {
      const inBand = candidates.filter(c => c.sea <= bandMax);
      if (inBand.length > 0) candidates = inBand;
    }

    if (landBBox && spreadN && spreadN >= 5 && priorCapitals.length > 0) {
      sortSpawnCandidatesWithSpreadBias(
        candidates, mapCenter, priorCapitals, landBBox, spreadN, false, seaMin, bandMax || maxSeaDist,
      );
    } else {
      sortSpawnLandCandidates(candidates, mapCenter, false, seaMin, bandMax || maxSeaDist);
    }
    return pickTiedSpawnLandCandidate(candidates, rand) ?? candidates[0]!.h;
  }
  return null;
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

/** Heksy dokładnie `dist` kroków od (q,r) — pierścień axial (max ~6×dist). */
function hexesAtDistance(q: number, r: number, dist: number): Array<{ q: number; r: number }> {
  if (dist <= 0) return [{ q, r }];
  let frontier: Array<{ q: number; r: number }> = [{ q, r }];
  for (let d = 0; d < dist; d++) {
    const next: Array<{ q: number; r: number }> = [];
    const seen = new Set<string>();
    for (const h of frontier) {
      for (const dir of HEX_DIRECTIONS) {
        const nq = h.q + dir[0];
        const nr = h.r + dir[1];
        const k = `${nq},${nr}`;
        if (seen.has(k)) continue;
        seen.add(k);
        next.push({ q: nq, r: nr });
      }
    }
    frontier = next;
  }
  return frontier;
}

/** Oś półpłaszczyzny spawnu MP tego samego typu (SPAWN-EXPANSION-ARC-Q1 A). */
export interface SameTypeRivalHalfPlaneAxis {
  dq: number;
  dr: number;
}

/**
 * Kierunek „inland” od stolicy — strona z MP tego samego typu (przeciwna = wolna ekspansja gracza).
 * Preferencja: wektor stolica → środek mapy; fallback przy stolicy w centrum: kierunek z seed.
 */
export function computeSameTypeRivalHalfPlaneAxis(
  capital: { q: number; r: number },
  mapCenter: { q: number; r: number },
  seed: number,
): SameTypeRivalHalfPlaneAxis {
  const dq = mapCenter.q - capital.q;
  const dr = mapCenter.r - capital.r;
  const lenSq = dq * dq + dr * dr;
  if (lenSq < 0.25) {
    const dir = HEX_DIRECTIONS[seed % HEX_DIRECTIONS.length]!;
    return { dq: dir[0], dr: dir[1] };
  }
  return { dq, dr };
}

/** Czy hex leży po stronie MP (dot ≥ margin względem osi od stolicy). */
export function isInSameTypeRivalHalfPlane(
  hex: { q: number; r: number },
  capital: { q: number; r: number },
  axis: SameTypeRivalHalfPlaneAxis,
  margin = -0.01,
): boolean {
  const vq = hex.q - capital.q;
  const vr = hex.r - capital.r;
  return vq * axis.dq + vr * axis.dr >= margin;
}

/**
 * Miasta-państwa — łańcuch pierścieni 5 hex (MAP-SPAWN hub-chain, Maciej 2026-07-28 / 2026-07-29).
 * BFS od stolicy: pierwszy pierścień dokładnie `ringDist` od stolicy, potem od każdego MP
 * już postawionego, aż do `count` lub brak lądu. Min. odstęp `minSep` między wszystkimi miastami.
 */
export function packCityStatesHubChain(
  landHexes: Array<{ q: number; r: number }>,
  core: { q: number; r: number },
  count: number,
  minSep: number,
  ringDist: number,
  seed: number,
  opts?: {
    excludeHex?: { q: number; r: number };
    anchor?: { q: number; r: number; minDist: number };
    halfPlaneAxis?: SameTypeRivalHalfPlaneAxis;
    /** FALA 185: bufor obcych klastrów — MP nie mogą wejść w promień S_cluster/2. */
    foreignBuffers?: ReadonlyArray<ForeignClusterBuffer>;
  },
): Array<{ q: number; r: number }> {
  if (count <= 0) return [];
  const rand = mulberry32((seed ^ 0x9e3779b9) >>> 0);
  const placed: Array<{ q: number; r: number }> = [];
  const exclude = opts?.excludeHex ?? core;
  const anchor = opts?.anchor;
  const halfPlaneAxis = opts?.halfPlaneAxis;
  const foreignBuffers = opts?.foreignBuffers ?? [];
  const landSet = new Set(landHexes.map(h => `${h.q},${h.r}`));

  function validCandidate(h: { q: number; r: number }, hub: { q: number; r: number }): boolean {
    if (!landSet.has(`${h.q},${h.r}`)) return false;
    if (halfPlaneAxis && !isInSameTypeRivalHalfPlane(h, core, halfPlaneAxis)) return false;
    if (h.q === exclude.q && h.r === exclude.r) return false;
    if (!passesForeignClusterBufferGate(h, foreignBuffers)) return false;
    if (hexDistanceAxial(h.q, h.r, hub.q, hub.r) !== ringDist) return false;
    if (hexDistanceAxial(h.q, h.r, core.q, core.r) < minSep) return false;
    if (anchor && hexDistanceAxial(h.q, h.r, anchor.q, anchor.r) < anchor.minDist) return false;
    if (placed.some(p => p.q === h.q && p.r === h.r)) return false;
    return placed.every(p => hexDistanceAxial(h.q, h.r, p.q, p.r) >= minSep);
  }

  const hubQueue: Array<{ q: number; r: number }> = [core];
  let hubIdx = 0;

  while (placed.length < count && hubIdx < hubQueue.length) {
    const hub = hubQueue[hubIdx]!;
    hubIdx += 1;
    // Jedno MP na iterację — validCandidate musi widzieć aktualne `placed`.
    while (placed.length < count) {
      const cands = hexesAtDistance(hub.q, hub.r, ringDist)
        .filter(h => validCandidate(h, hub));
      if (cands.length === 0) break;
      shuffleInPlace(cands, rand);
      cands.sort((a, b) => a.q - b.q || a.r - b.r);
      const c = cands[0]!;
      placed.push(c);
      hubQueue.push(c);
    }
  }

  return placed;
}

/**
 * Pakuje MP wokół stolicy — rozszerzona pula lądu + retry seedów (symetria z graczem).
 * Region Voronoi bywa wąski; pełny ląd mapy ratuje hub-chain na krawędzi klastra.
 */
export function packCityStatesAroundCapital(
  allLand: Array<{ q: number; r: number }>,
  region: Array<{ q: number; r: number }>,
  capital: { q: number; r: number },
  stateCityCount: number,
  minDist: number,
  seed: number,
  opts?: {
    excludeHex?: { q: number; r: number };
    anchor?: { q: number; r: number; minDist: number };
    growthReserve?: number;
    halfPlaneAxis?: SameTypeRivalHalfPlaneAxis;
    foreignBuffers?: ReadonlyArray<ForeignClusterBuffer>;
    /** Pierścienie hub-chain (domyślnie tylko 5). Luźniej przy krawędzi mapy. */
    ringDistances?: ReadonlyArray<number>;
  },
): { stateCities: Array<{ q: number; r: number }>; growthSlot: { q: number; r: number } | null } {
  if (stateCityCount <= 0) {
    return { stateCities: [], growthSlot: null };
  }
  const growthReserve = opts?.growthReserve ?? CLUSTER_GROWTH_RESERVE;
  const totalPack = stateCityCount + growthReserve;
  const halfPlaneAxis = opts?.halfPlaneAxis;
  const packOpts = {
    excludeHex: opts?.excludeHex ?? capital,
    anchor: opts?.anchor,
    halfPlaneAxis,
    foreignBuffers: opts?.foreignBuffers,
  };
  const expandedR = clusterPackRadius(totalPack, minDist) * 2;

  const pools: Array<Array<{ q: number; r: number }>> = [];
  const nearRegion = landPoolNearCore(region, capital, totalPack, minDist);
  pools.push(nearRegion);
  const nearExpanded = landPoolNearCore(region, capital, totalPack, minDist, expandedR);
  if (nearExpanded.length > nearRegion.length) pools.push(nearExpanded);
  if (allLand.length > nearExpanded.length) pools.push(allLand);

  const seeds = [
    seed,
    (seed + 0x517cc1b7) >>> 0,
    (seed + 0x85ebca6b) >>> 0,
    (seed + 0xc2b2ae35) >>> 0,
  ];

  const minDistLevels = halfPlaneAxis
    ? [...new Set([
      minDist,
      Math.max(3, minDist - 1),
      Math.max(3, minDist - 2),
    ].filter(d => d >= 3))]
    : [minDist];

  const ringDistances = opts?.ringDistances?.length
    ? [...opts.ringDistances]
    : [CLUSTER_CITY_STATE_MAX_HEX];

  let best: Array<{ q: number; r: number }> = [];
  for (const ringDist of ringDistances) {
    for (const tryMinDist of minDistLevels) {
      const sep = Math.min(tryMinDist, ringDist);
      for (const pool of pools) {
        for (const s of seeds) {
          const packed = packCityStatesHubChain(
            pool,
            capital,
            totalPack,
            sep,
            ringDist,
            s,
            packOpts,
          );
          if (packed.length > best.length) best = packed;
          if (best.length >= stateCityCount) break;
        }
        if (best.length >= stateCityCount) break;
      }
      if (best.length >= stateCityCount) break;
    }
    if (best.length >= stateCityCount) break;
  }

  return {
    stateCities: best.slice(0, stateCityCount),
    growthSlot: best.length > stateCityCount ? best[stateCityCount] ?? null : null,
  };
}

/**
 * Miasta-państwa wokół stolicy klastra — deleguje do łańcucha hubów (pierścień 5 hex).
 */
export function packRivalCitiesAroundCore(
  landHexes: Array<{ q: number; r: number }>,
  core: { q: number; r: number },
  rivalCount: number,
  minDist: number,
  seed: number,
  mapCenter?: { q: number; r: number },
): Array<{ q: number; r: number }> {
  if (rivalCount <= 0) return [];
  const halfPlaneAxis = mapCenter
    ? computeSameTypeRivalHalfPlaneAxis(core, mapCenter, seed)
    : undefined;
  return packCityStatesAroundCapital(
    landHexes,
    landHexes,
    core,
    rivalCount,
    minDist,
    seed,
    { excludeHex: core, growthReserve: 0, halfPlaneAxis },
  ).stateCities;
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
 * Stolica klastra: twarda bramka seaDist, potem preferencja obwodu (edge-capital).
 * Bez soft-failu na brzeg — brak kandydata = null.
 */
function pickCapitalHexInRegion(
  region: Array<{ q: number; r: number }>,
  blobCenter: { q: number; r: number },
  rand: () => number,
  map?: GameMap,
  seaDist?: Map<string, number>,
  minSeaDist = 0,
  anchor?: { q: number; r: number; minDist: number },
  priorCapitals: Array<{ q: number; r: number }> = [],
  minCapitalSep = 0,
): { q: number; r: number } | null {
  let candidates = region;
  if (anchor) {
    const filtered = candidates.filter(
      c => hexDistanceAxial(c.q, c.r, anchor.q, anchor.r) >= anchor.minDist,
    );
    if (filtered.length > 0) candidates = filtered;
  }
  if (map) {
    const gated = candidates.filter(c => passesLocalLandGate(map, c.q, c.r));
    if (gated.length > 0) candidates = gated;
  }
  if (minCapitalSep > 0 && priorCapitals.length > 0) {
    const sepGated = candidates.filter(
      c => passesMinCapitalSeparationGate(c, priorCapitals, minCapitalSep),
    );
    if (sepGated.length === 0) return null;
    candidates = sepGated;
  }
  if (candidates.length === 0) return null;

  // FALA 188: seaDist mięknie w regionie (sep już przefiltrowany) — unikaj dropu civ.
  let seaPool = candidates;
  let activeMinSea = minSeaDist;
  if (seaDist && minSeaDist > 0) {
    seaPool = [];
    for (const seaMin of seaDistRescueLadder(minSeaDist)) {
      const seaGated = candidates.filter(
        c => passesMinSeaDistGate(seaDist, c.q, c.r, seaMin),
      );
      if (seaGated.length > 0) {
        seaPool = seaGated;
        activeMinSea = seaMin;
        break;
      }
    }
    if (seaPool.length === 0) return null;
  }

  const bandMax = activeMinSea >= minSeaDist && minSeaDist > 0 ? minSeaDist + 5 : 0;
  if (bandMax > 0 && seaDist) {
    const inBand = seaPool.filter(c => seaDistAt(seaDist, c.q, c.r) <= bandMax);
    if (inBand.length > 0) seaPool = inBand;
  }

  seaPool.sort((a, b) => {
    const seaA = seaDist ? seaDistAt(seaDist, a.q, a.r) : 0;
    const seaB = seaDist ? seaDistAt(seaDist, b.q, b.r) : 0;
    // FALA 200: pas min…max (np. 10–15), nie „najbliżej brzegu”.
    if (minSeaDist > 0 || bandMax > 0) {
      const pa = capitalSeaBandPenalty(seaA, activeMinSea, bandMax || minSeaDist + 5);
      const pb = capitalSeaBandPenalty(seaB, activeMinSea, bandMax || minSeaDist + 5);
      if (pa !== pb) return pa - pb;
    }
    const da = hexDistanceAxial(a.q, a.r, blobCenter.q, blobCenter.r);
    const db = hexDistanceAxial(b.q, b.r, blobCenter.q, blobCenter.r);
    const jitter = rand() * 0.01;
    return (db + jitter) - (da + jitter) || a.q - b.q || a.r - b.r;
  });
  return seaPool[0]!;
}

/**
 * Planuje klaster: najpierw stolica (seaDist + obwód), potem państwa wokół.
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
  map?: GameMap,
  seed = 42,
  seaDist?: Map<string, number>,
  minSeaDist = 0,
  priorCapitals: Array<{ q: number; r: number }> = [],
  minCapitalSep = 0,
): ClusterLayoutPlan | null {
  if (stateCityCount < 0) return null;

  const blobCenter = centroidOf(region.length > 0 ? region : [centrum]);
  const capital = pickCapitalHexInRegion(
    region, blobCenter, rand, map, seaDist, minSeaDist, anchor,
    priorCapitals, minCapitalSep,
  );
  if (!capital) return null;

  const { stateCities, growthSlot } = packCityStatesAroundCapital(
    region,
    region,
    capital,
    stateCityCount,
    minDist,
    seed,
    { excludeHex: capital, anchor, growthReserve },
  );

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
  map?: GameMap,
  seaDist?: Map<string, number>,
  minSeaDist = 0,
  priorCapitals: Array<{ q: number; r: number }> = [],
  minCapitalSep = 0,
): { cities: ClusterCity[]; pendingStateSlots: Array<{ q: number; r: number }>; growthSlot: { q: number; r: number } | null } {
  const layout = buildClusterLayoutWithEdgeCapital(
    region, centrum, stateCityCount, minDist, rand, anchor, CLUSTER_GROWTH_RESERVE, map, seed ?? 42,
    seaDist, minSeaDist, priorCapitals, minCapitalSep,
  );
  if (!layout) {
    return buildClusterCitiesSimpleFallback(
      region, centrum, stateCityCount, minDist, anchor, seed ?? 42, map, seaDist, minSeaDist,
      priorCapitals, minCapitalSep,
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
  map?: GameMap,
  seaDist?: Map<string, number>,
  minSeaDist = 0,
  priorCapitals: Array<{ q: number; r: number }> = [],
  minCapitalSep = 0,
): { cities: ClusterCity[]; pendingStateSlots: Array<{ q: number; r: number }>; growthSlot: { q: number; r: number } | null } {
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
  const capital = pickCapitalHexInRegion(
    pool, cen, () => 0, map, seaDist, minSeaDist, anchor,
    priorCapitals, minCapitalSep,
  );
  if (!capital) {
    return { cities: [], pendingStateSlots: [], growthSlot: null };
  }

  const { stateCities, growthSlot } = packCityStatesAroundCapital(
    pool,
    pool,
    capital,
    stateCityCount,
    minDist,
    seed,
    { excludeHex: capital, anchor, growthReserve: 0 },
  );
  const cities: ClusterCity[] = [{ q: capital.q, r: capital.r, isCapital: true }];
  for (const s of stateCities) {
    cities.push({ q: s.q, r: s.r, isCapital: false });
  }
  return { cities, pendingStateSlots: stateCities, growthSlot };
}

/**
 * MAP-SPAWN-Q1 B (Maciej 2026-07-28): relokacja środków / odrzucenie typów,
 * gdy stolica startowa nie ma ≥70% lądu w promieniu R (lokalnie, nie Voronoi).
 */
function assignTypesToClusterCenters(
  centrumy: Array<{ q: number; r: number }>,
  masses: Array<Array<{ q: number; r: number }>>,
  playerKlucz: string,
  rosterBezGracza: string[],
  rand: () => number,
): string[] {
  const hexIndex = buildMassHexIndex(masses);
  const nForeign = Math.max(0, centrumy.length - 1);
  const foreignAllocation = allocateTypyToMasses(nForeign, masses);

  const centersByMass = new Map<number, number[]>();
  for (let ci = 1; ci < centrumy.length; ci++) {
    const mi = massContainingHex(hexIndex, centrumy[ci]!.q, centrumy[ci]!.r);
    if (mi === null) continue;
    if (!centersByMass.has(mi)) centersByMass.set(mi, []);
    centersByMass.get(mi)!.push(ci);
  }

  const shuffledTypes = rosterBezGracza.slice();
  shuffleInPlace(shuffledTypes, rand);

  const aktywneKlucze: string[] = new Array(centrumy.length);
  aktywneKlucze[0] = playerKlucz;

  let typeIdx = 0;
  const massOrder = qualifyingMassIndicesForSpawn(masses)
    .sort((a, b) => masses[b]!.length - masses[a]!.length);

  for (const mi of massOrder) {
    const centerIndices = (centersByMass.get(mi) ?? []).slice();
    const quota = foreignAllocation[mi] ?? 0;
    for (let k = 0; k < Math.min(centerIndices.length, quota); k++) {
      const ci = centerIndices[k]!;
      aktywneKlucze[ci] = shuffledTypes[typeIdx++] ?? `typ${ci}`;
    }
  }

  for (let ci = 1; ci < centrumy.length; ci++) {
    if (!aktywneKlucze[ci]) {
      aktywneKlucze[ci] = shuffledTypes[typeIdx++] ?? `typ${ci}`;
    }
  }

  return aktywneKlucze;
}

function enforceLocalLandDominance(
  map: GameMap,
  centrumy: Array<{ q: number; r: number }>,
  regiony: Array<Array<{ q: number; r: number }>>,
  aktywneKlucze: string[],
  ladowe: Array<{ q: number; r: number }>,
  landCache: MassLandCache,
  rand: () => number,
  minDist: number,
  mapCenter: { q: number; r: number },
  seaDist?: Map<string, number>,
  minSeaDist = 0,
): {
  centrumy: Array<{ q: number; r: number }>;
  regiony: Array<Array<{ q: number; r: number }>>;
  aktywneKlucze: string[];
} {
  const masses = landCache.masses;
  let relocated = false;

  for (let ci = 0; ci < centrumy.length; ci++) {
    const center = centrumy[ci]!;
    const ok = ci === 0
      ? passesPlayerStartMassGate(map, center.q, center.r, landCache)
      : passesLocalLandGate(map, center.q, center.r);
    if (ok) continue;

    const region = regiony[ci] ?? [];
    const others = centrumy.filter((_, i) => i !== ci);
    let newCenter: { q: number; r: number } | null = null;
    if (ci === 0) {
      newCenter = pickPlayerClusterCenter(map, landCache, ladowe, mapCenter, rand, seaDist, minSeaDist);
    } else {
      newCenter = pickBestLocalLandSpawn(map, region, others, minDist, landCache, rand, seaDist, minSeaDist);
      if (!newCenter) {
        const qualifying = qualifyingMassIndicesForSpawn(masses)
          .sort((a, b) => masses[b]!.length - masses[a]!.length);
        for (const mi of qualifying) {
          newCenter = pickCenterInMassSpread(map, masses[mi]!, others, minDist, landCache, rand, seaDist, minSeaDist);
          if (newCenter) break;
        }
      }
    }

    if (newCenter) {
      centrumy[ci] = newCenter;
      relocated = true;
    }
  }

  if (relocated) {
    const newRegiony = assignVoronoiRegions(ladowe, centrumy);
    for (let i = 0; i < regiony.length; i++) {
      regiony[i] = newRegiony[i]!;
    }
  }

  const keep: boolean[] = centrumy.map((c, ci) => {
    if (ci === 0) return true;
    return passesLocalLandGate(map, c.q, c.r);
  });

  const landBBox = {
    minQ: Math.min(...ladowe.map(h => h.q)),
    maxQ: Math.max(...ladowe.map(h => h.q)),
    minR: Math.min(...ladowe.map(h => h.r)),
    maxR: Math.max(...ladowe.map(h => h.r)),
  };
  const spreadOpts: ClusterSpreadOpts = { nNeeded: centrumy.length };
  const dominanceSpreadGate = { landBBox, spreadN: centrumy.length };

  // FALA 188/193: relokacja zamiast dropu — nigdy nie ucinaj typów gdy ląd istnieje.
  // keep[] tylko diagnostyka; wszystkie środki zostają (top-up i soft sea łatają dalej).
  for (let ci = 1; ci < centrumy.length; ci++) {
    if (keep[ci]) continue;
    const others = centrumy.filter((_, i) => i !== ci && keep[i]);
    let rescued = pickSpawnHexWithCapitalGates(
      map, ladowe, landCache, mapCenter, rand,
      {
        seaDist, minSeaDist, priorCapitals: others, minCapitalSep: minDist,
        requireLocalLand: true,
        progressiveSoftSea: true,
        ...dominanceSpreadGate,
      },
    );
    if (!rescued) {
      rescued = pickSpawnHexWithCapitalGates(
        map, ladowe, landCache, mapCenter, rand,
        {
          seaDist, minSeaDist, priorCapitals: others, minCapitalSep: minDist,
          requireLocalLand: false,
          progressiveSoftSea: true,
          ...dominanceSpreadGate,
        },
      );
    }
    if (rescued) {
      centrumy[ci] = rescued;
      keep[ci] = true;
    } else {
      // Zostaw oryginał — lepiej 7 civ na słabszym hexie niż drop.
      keep[ci] = true;
    }
  }

  if (!passesLocalLandGate(map, centrumy[0]!.q, centrumy[0]!.r)
    || !passesPlayerStartMassGate(map, centrumy[0]!.q, centrumy[0]!.r, landCache)) {
    const forced = pickPlayerClusterCenter(map, landCache, ladowe, mapCenter, rand, seaDist, minSeaDist);
    if (forced) {
      centrumy[0] = forced;
      const newRegiony = assignVoronoiRegions(ladowe, centrumy);
      for (let i = 0; i < regiony.length; i++) {
        regiony[i] = newRegiony[i]!;
      }
      keep[0] = true;
    }
  }

  const newCentrumy = centrumy.filter((_, i) => keep[i]);
  const newAktywneKlucze = aktywneKlucze.filter((_, i) => keep[i]);
  const newRegiony = assignVoronoiRegions(ladowe, newCentrumy);

  const dropped = aktywneKlucze.length - newAktywneKlucze.length;
  if (dropped > 0 && typeof console !== 'undefined') {
    const droppedKeys = aktywneKlucze.filter((_, i) => !keep[i]);
    console.warn(
      `[clusters] enforceLocalLandDominance: odrzucono ${dropped} typ(ów)` +
      ` (${droppedKeys.join(', ')}) — bramka lokalnego lądu ≥${LOCAL_LAND_DOMINANCE_FRAC * 100}%`,
    );
  }

  return { centrumy: newCentrumy, regiony: newRegiony, aktywneKlucze: newAktywneKlucze };
}

function clusterCapitalPos(
  layout: { cities: ClusterCity[] },
  fallback: { q: number; r: number },
): { q: number; r: number } {
  const cap = layout.cities.find(m => m.isCapital) ?? layout.cities[0];
  return cap ? { q: cap.q, r: cap.r } : fallback;
}

function buildClusterCitiesWithLandGate(
  map: GameMap,
  region: Array<{ q: number; r: number }>,
  centrum: { q: number; r: number },
  stateCityCount: number,
  minDist: number,
  rand: () => number,
  anchor: { q: number; r: number; minDist: number } | undefined,
  seed: number,
  landCache: MassLandCache,
  existingCenters: Array<{ q: number; r: number }>,
  minClusterDist: number,
  seaDist?: Map<string, number>,
  minSeaDist = 0,
  priorCapitals: Array<{ q: number; r: number }> = [],
  minCapitalSep = 0,
): { cities: ClusterCity[]; pendingStateSlots: Array<{ q: number; r: number }>; growthSlot: { q: number; r: number } | null; centrum: { q: number; r: number } } | null {
  const masses = landCache.masses;
  let activeCentrum = centrum;
  for (let attempt = 0; attempt < 5; attempt++) {
    const layout = buildClusterCities(
      region,
      activeCentrum,
      stateCityCount,
      minDist,
      rand,
      anchor,
      seed,
      map,
      seaDist,
      minSeaDist,
      priorCapitals,
      minCapitalSep,
    );
    const cap = clusterCapitalPos(layout, activeCentrum);
    const landOk = passesLocalLandGate(map, cap.q, cap.r);
    const seaOk = !seaDist || minSeaDist <= 0 || passesMinSeaDistGate(seaDist, cap.q, cap.r, minSeaDist);
    const sepOk = passesMinCapitalSeparationGate(cap, priorCapitals, minCapitalSep);
    if (landOk && seaOk && sepOk) {
      return { ...layout, centrum: activeCentrum };
    }
    const altCenter = pickBestLocalLandSpawn(map, region, existingCenters, minClusterDist, landCache, rand, seaDist, minSeaDist);
    let nextCenter = altCenter;
    if (!nextCenter) {
      const qualifying = qualifyingMassIndicesForSpawn(masses)
        .sort((a, b) => masses[b]!.length - masses[a]!.length);
      for (const mi of qualifying) {
        nextCenter = pickCenterInMassSpread(map, masses[mi]!, existingCenters, minClusterDist, landCache, rand, seaDist, minSeaDist);
        if (nextCenter) break;
      }
    }
    if (!nextCenter) return null;
    activeCentrum = nextCenter;
  }
  return null;
}

function clusterCapitalHex(k: TypeCluster): { q: number; r: number } | null {
  const m = k.miasta.find(x => x.isCapital) ?? k.miasta[0];
  return m ? { q: m.q, r: m.r } : null;
}

/** Twarda bramka końcowa: pary stolic różnych civ ≥ minSep — relokacja w regionie lub drop typu. */
function enforceHardCapitalSeparationOnKlastry(
  klastry: TypeCluster[],
  clusterRegions: Array<Array<{ q: number; r: number }>>,
  map: GameMap,
  rand: () => number,
  seaDist: Map<string, number> | undefined,
  minSeaDist: number,
  minCapitalSep: number,
  minDystObcyOdGracza: number,
  ladowe: Array<{ q: number; r: number }>,
  landCache: MassLandCache,
  seed: number,
  stateCityCount: number,
  mapCenter: { q: number; r: number },
  minDystMiastaPanstwa: number,
  spreadGateOpts?: { landBBox: { minQ: number; maxQ: number; minR: number; maxR: number }; spreadN: number },
): void {
  if (!Number.isFinite(minCapitalSep) || minCapitalSep <= 0) return;

  const dropCluster = (ki: number): void => {
    const dropped = klastry[ki]?.typ ?? `idx${ki}`;
    klastry.splice(ki, 1);
    clusterRegions.splice(ki, 1);
    for (let i = 0; i < klastry.length; i++) klastry[i]!.typIndex = i;
    if (typeof console !== 'undefined') {
      console.warn(
        `[clusters] HARD sep: usunięto typ '${dropped}' — brak hexu stolicy ≥${minCapitalSep} hex od innych`,
      );
    }
  };

  let repaired = true;
  let guard = 0;
  while (repaired && guard++ < klastry.length * 4) {
    repaired = false;
    const caps: Array<{ q: number; r: number; ki: number }> = [];
    for (let ki = 0; ki < klastry.length; ki++) {
      const c = clusterCapitalHex(klastry[ki]!);
      if (c) caps.push({ ...c, ki });
    }

    outer:
    for (let i = 0; i < caps.length; i++) {
      for (let j = i + 1; j < caps.length; j++) {
        const d = hexDistanceAxial(caps[i]!.q, caps[i]!.r, caps[j]!.q, caps[j]!.r);
        if (d >= minCapitalSep) continue;

        const fixIdx = caps[j]!.ki > caps[i]!.ki ? j : i;
        const fixKi = caps[fixIdx]!.ki;
        const region = clusterRegions[fixKi];
        if (!region || region.length === 0) {
          dropCluster(fixKi);
          repaired = true;
          break outer;
        }

        const priorCaps = caps
          .filter((_, idx) => idx !== fixIdx)
          .map(c => ({ q: c.q, r: c.r }));

        const playerCap = caps.find(c => c.ki === 0);
        const anchor = fixKi === 0 || !playerCap ? undefined : {
          q: playerCap.q,
          r: playerCap.r,
          minDist: minDystObcyOdGracza,
        };

        const blobCenter = centroidOf(region);
        let newCap = pickCapitalHexInRegion(
          region,
          blobCenter,
          rand,
          map,
          seaDist,
          minSeaDist,
          anchor,
          priorCaps,
          minCapitalSep,
        );

        if (!newCap) {
          newCap = pickSpawnHexWithCapitalGates(
            map, ladowe, landCache, mapCenter, rand,
            {
              seaDist, minSeaDist, priorCapitals: priorCaps, minCapitalSep,
              requireLocalLand: true,
              requirePlayerMassGate: fixKi === 0,
              progressiveSoftSea: true,
              ...spreadGateOpts,
            },
          );
        }
        if (!newCap) {
          newCap = pickSpawnHexWithCapitalGates(
            map, ladowe, landCache, mapCenter, rand,
            {
              seaDist, minSeaDist, priorCapitals: priorCaps, minCapitalSep,
              requireLocalLand: false,
              requirePlayerMassGate: fixKi === 0,
              progressiveSoftSea: true,
              ...spreadGateOpts,
            },
          );
        }

        if (!newCap) {
          dropCluster(fixKi);
          repaired = true;
          break outer;
        }

        const k = klastry[fixKi]!;
        const minDist = fixKi === 0 ? minDystMiastaPanstwa : MIN_DIST_FOREIGN_IN_CLUSTER;
        const { stateCities, growthSlot } = packCityStatesAroundCapital(
          ladowe,
          region,
          newCap,
          stateCityCount,
          minDist,
          (seed + fixKi * 0x9e3779b1) >>> 0,
          { excludeHex: newCap, anchor },
        );
        const cities: ClusterCity[] = [{ q: newCap.q, r: newCap.r, isCapital: true }];
        for (const s of stateCities) {
          cities.push({ q: s.q, r: s.r, isCapital: false });
        }
        k.miasta = cities;
        k.growthSlot = growthSlot;
        if (fixKi === 0) {
          k.pendingStateSlots = packRivalCitiesAroundCore(
            ladowe,
            newCap,
            stateCityCount,
            minDystMiastaPanstwa,
            seed,
            mapCenter,
          );
        }
        caps[fixIdx] = { q: newCap.q, r: newCap.r, ki: fixKi };
        repaired = true;
        break outer;
      }
    }
  }
}

/** Wszystkie miasta klastra (stolica + MP). */
function allClusterCities(k: TypeCluster): Array<{ q: number; r: number }> {
  return k.miasta.map(m => ({ q: m.q, r: m.r }));
}

/** Bufor obcych klastrów dla pakowania MP (FALA 185). */
function foreignBuffersForCluster(
  klastry: TypeCluster[],
  excludeKi: number,
  bufferRadius: number,
): ForeignClusterBuffer[] {
  const out: ForeignClusterBuffer[] = [];
  for (let ki = 0; ki < klastry.length; ki++) {
    if (ki === excludeKi) continue;
    const cap = clusterCapitalHex(klastry[ki]!);
    if (cap) out.push({ q: cap.q, r: cap.r, radius: bufferRadius });
  }
  return out;
}

/** Anchor od gracza dla obcych MP — pomijany gdy po body-sep stolica jest za blisko (BUG-INKOWIE-MP-BRAK). */
function foreignRepackAnchor(
  ki: number,
  cap: { q: number; r: number },
  playerCap: { q: number; r: number } | null,
  minDystObcyOdGracza: number,
): { q: number; r: number; minDist: number } | undefined {
  if (ki === 0 || !playerCap) return undefined;
  const capDist = hexDistanceAxial(cap.q, cap.r, playerCap.q, playerCap.r);
  if (capDist + CLUSTER_CITY_STATE_MAX_HEX < minDystObcyOdGracza) return undefined;
  return { q: playerCap.q, r: playerCap.r, minDist: minDystObcyOdGracza };
}

/**
 * BUG-INKOWIE-MP-BRAK: po body-sep / ciasnym Voronoi dopełnia MP z rozszerzonej puli lądu.
 * enforceClusterBodySeparation często zostawia samą stolicę — tu repack z ladowe + buforami.
 */
function repackClusterStateCitiesIfSparse(
  klastry: TypeCluster[],
  clusterRegions: Array<Array<{ q: number; r: number }>>,
  ki: number,
  stateCityCount: number,
  minDystObcyOdGracza: number,
  ladowe: Array<{ q: number; r: number }>,
  seed: number,
  bufferRadius: number,
  mapCenter: { q: number; r: number },
  minDystMiastaPanstwa: number,
): void {
  const k = klastry[ki];
  if (!k) return;
  const cap = clusterCapitalHex(k);
  if (!cap) return;
  const mpNow = k.miasta.filter(m => !m.isCapital).length;
  if (mpNow >= stateCityCount) return;

  const playerCap = clusterCapitalHex(klastry[0]!);
  const anchor = foreignRepackAnchor(ki, cap, playerCap, minDystObcyOdGracza);
  const foreignBufs = foreignBuffersForCluster(klastry, ki, bufferRadius);
  const minDist = ki === 0 ? minDystMiastaPanstwa : MIN_DIST_FOREIGN_IN_CLUSTER;
  // Pełny ląd — Voronoi region często za mały po body-sep (BUG-INKOWIE-MP-BRAK).
  const { stateCities, growthSlot } = packCityStatesAroundCapital(
    ladowe,
    ladowe,
    cap,
    stateCityCount,
    minDist,
    (seed + ki * 0x9e3779b1) >>> 0,
    {
      excludeHex: cap,
      anchor,
      foreignBuffers: foreignBufs,
      growthReserve: CLUSTER_GROWTH_RESERVE,
      halfPlaneAxis: ki === 0
        ? computeSameTypeRivalHalfPlaneAxis(cap, mapCenter, seed)
        : undefined,
    },
  );

  let validMp = stateCities.filter(s =>
    passesForeignClusterBufferGate(s, foreignBufs),
  );
  let usedGrowth = growthSlot;

  // Last-resort: krawędź mapy / ciasny bufor / anchor niemożliwy (seed 17,32,85 Inkowie).
  if (validMp.length === 0) {
    const looseRadius = Math.max(0, Math.floor(bufferRadius / 2));
    const looseBufs = foreignBuffersForCluster(klastry, ki, looseRadius);
    const looseMin = Math.max(3, minDist - 2);
    const retry = packCityStatesAroundCapital(
      ladowe,
      ladowe,
      cap,
      stateCityCount,
      looseMin,
      (seed + ki * 0x85ebca6b) >>> 0,
      {
        excludeHex: cap,
        // Stolica już na mapie — nie wymuszaj 12 hex od gracza na MP (body-sep mógł przesunąć stolicę).
        anchor: undefined,
        foreignBuffers: looseBufs,
        growthReserve: 0,
        ringDistances: [CLUSTER_CITY_STATE_MAX_HEX, 4, 3, 2],
        halfPlaneAxis: ki === 0
          ? computeSameTypeRivalHalfPlaneAxis(cap, mapCenter, (seed + 17) >>> 0)
          : undefined,
      },
    );
    validMp = retry.stateCities.filter(s =>
      passesForeignClusterBufferGate(s, looseBufs),
    );
    usedGrowth = retry.growthSlot;

    // Desperate: minDist=2, bez buforów — tylko sep w klastrze.
    if (validMp.length === 0) {
      const desperate = packCityStatesAroundCapital(
        ladowe,
        ladowe,
        cap,
        stateCityCount,
        2,
        (seed + ki * 0xc2b2ae35) >>> 0,
        {
          excludeHex: cap,
          foreignBuffers: [],
          growthReserve: 0,
          ringDistances: [3, 2],
        },
      );
      validMp = desperate.stateCities;
      usedGrowth = desperate.growthSlot;
    }

    if (validMp.length === 0) {
      if (typeof console !== 'undefined' && ki > 0) {
        console.warn(
          `[clusters] repack sparse ki=${ki} typ=${k.typ}: 0 MP (packed=${stateCities.length}, loose=${retry.stateCities.length})`,
        );
      }
      return;
    }
  }

  const cities: ClusterCity[] = [{ q: cap.q, r: cap.r, isCapital: true }];
  for (const s of validMp.slice(0, stateCityCount)) {
    cities.push({ q: s.q, r: s.r, isCapital: false });
  }
  k.miasta = cities;
  k.growthSlot = usedGrowth;
  if (ki === 0) {
    k.pendingStateSlots = packRivalCitiesAroundCore(
      ladowe,
      cap,
      stateCityCount,
      minDystMiastaPanstwa,
      seed,
      mapCenter,
    );
  }
}

function repackAllSparseClusterStateCities(
  klastry: TypeCluster[],
  clusterRegions: Array<Array<{ q: number; r: number }>>,
  stateCityCount: number,
  minDystObcyOdGracza: number,
  ladowe: Array<{ q: number; r: number }>,
  seed: number,
  bufferRadius: number,
  mapCenter: { q: number; r: number },
  minDystMiastaPanstwa: number,
): void {
  for (let ki = 0; ki < klastry.length; ki++) {
    repackClusterStateCitiesIfSparse(
      klastry,
      clusterRegions,
      ki,
      stateCityCount,
      minDystObcyOdGracza,
      ladowe,
      seed,
      bufferRadius,
      mapCenter,
      minDystMiastaPanstwa,
    );
  }
}

/**
 * FALA 185: twarda bramka sep brył — stolice ≥ minCapitalSep; MP ≥ bufor S/2 od obcych stolic.
 * Relokacja stolicy + repack MP; drop typu dopiero po retry.
 */
function enforceClusterBodySeparationOnKlastry(
  klastry: TypeCluster[],
  clusterRegions: Array<Array<{ q: number; r: number }>>,
  map: GameMap,
  rand: () => number,
  seaDist: Map<string, number> | undefined,
  minSeaDist: number,
  sCluster: number,
  minCapitalSep: number,
  minDystObcyOdGracza: number,
  ladowe: Array<{ q: number; r: number }>,
  landCache: MassLandCache,
  seed: number,
  stateCityCount: number,
  mapCenter: { q: number; r: number },
  minDystMiastaPanstwa: number,
  bufferRadius: number,
  spreadGateOpts?: { landBBox: { minQ: number; maxQ: number; minR: number; maxR: number }; spreadN: number },
): void {
  if (!Number.isFinite(sCluster) || sCluster <= 0) return;

  function bodyViolation(i: number, j: number): boolean {
    const citiesA = allClusterCities(klastry[i]!);
    const citiesB = allClusterCities(klastry[j]!);
    const capA = clusterCapitalHex(klastry[i]!);
    const capB = clusterCapitalHex(klastry[j]!);
    for (const a of citiesA) {
      for (const b of citiesB) {
        const d = hexDistanceAxial(a.q, a.r, b.q, b.r);
        const aIsCap = capA && a.q === capA.q && a.r === capA.r;
        const bIsCap = capB && b.q === capB.q && b.r === capB.r;
        if (aIsCap && bIsCap) {
          if (d < minCapitalSep) return true;
        } else if (aIsCap || bIsCap) {
          if (d < bufferRadius) return true;
        } else if (d < bufferRadius) {
          return true;
        }
      }
    }
    return false;
  }

  const dropCluster = (ki: number): void => {
    const dropped = klastry[ki]?.typ ?? `idx${ki}`;
    klastry.splice(ki, 1);
    clusterRegions.splice(ki, 1);
    for (let i = 0; i < klastry.length; i++) klastry[i]!.typIndex = i;
    if (typeof console !== 'undefined') {
      console.warn(
        `[clusters] HARD body sep: usunięto typ '${dropped}' — brak legalnej bryły ≥${sCluster} hex`,
      );
    }
  };

  let repaired = true;
  let guard = 0;
  while (repaired && guard++ < klastry.length * 6) {
    repaired = false;

    outer:
    for (let i = 0; i < klastry.length; i++) {
      for (let j = i + 1; j < klastry.length; j++) {
        if (!bodyViolation(i, j)) continue;

        const fixKi = j;
        const region = clusterRegions[fixKi];
        if (!region || region.length === 0) {
          dropCluster(fixKi);
          repaired = true;
          break outer;
        }

        const priorCaps: Array<{ q: number; r: number }> = [];
        for (let ki = 0; ki < klastry.length; ki++) {
          if (ki === fixKi) continue;
          const c = clusterCapitalHex(klastry[ki]!);
          if (c) priorCaps.push(c);
        }

        const playerCap = clusterCapitalHex(klastry[0]!);
        const anchor = fixKi === 0 || !playerCap ? undefined : {
          q: playerCap.q,
          r: playerCap.r,
          minDist: minDystObcyOdGracza,
        };

        const foreignBufs = foreignBuffersForCluster(klastry, fixKi, bufferRadius);
        const blobCenter = centroidOf(region);
        let newCap = pickCapitalHexInRegion(
          region,
          blobCenter,
          rand,
          map,
          seaDist,
          minSeaDist,
          anchor,
          priorCaps,
          minCapitalSep,
        );

        if (!newCap) {
          newCap = pickSpawnHexWithCapitalGates(
            map, ladowe, landCache, mapCenter, rand,
            {
              seaDist, minSeaDist, priorCapitals: priorCaps, minCapitalSep,
              requireLocalLand: true,
              requirePlayerMassGate: fixKi === 0,
              progressiveSoftSea: true,
              ...spreadGateOpts,
            },
          );
        }
        if (!newCap) {
          newCap = pickSpawnHexWithCapitalGates(
            map, ladowe, landCache, mapCenter, rand,
            {
              seaDist, minSeaDist, priorCapitals: priorCaps, minCapitalSep,
              requireLocalLand: false,
              requirePlayerMassGate: fixKi === 0,
              progressiveSoftSea: true,
              ...spreadGateOpts,
            },
          );
        }

        if (!newCap) {
          dropCluster(fixKi);
          repaired = true;
          break outer;
        }

        const k = klastry[fixKi]!;
        const minDist = fixKi === 0 ? minDystMiastaPanstwa : MIN_DIST_FOREIGN_IN_CLUSTER;
        const { stateCities, growthSlot } = packCityStatesAroundCapital(
          ladowe,
          region,
          newCap,
          stateCityCount,
          minDist,
          (seed + fixKi * 0x9e3779b1) >>> 0,
          {
            excludeHex: newCap,
            anchor,
            foreignBuffers: foreignBufs,
            halfPlaneAxis: fixKi === 0
              ? computeSameTypeRivalHalfPlaneAxis(newCap, mapCenter, seed)
              : undefined,
          },
        );
        const cities: ClusterCity[] = [{ q: newCap.q, r: newCap.r, isCapital: true }];
        for (const s of stateCities) {
          cities.push({ q: s.q, r: s.r, isCapital: false });
        }
        k.miasta = cities;
        k.growthSlot = growthSlot;
        if (fixKi === 0) {
          k.pendingStateSlots = packRivalCitiesAroundCore(
            ladowe,
            newCap,
            stateCityCount,
            minDystMiastaPanstwa,
            seed,
            mapCenter,
          );
        }

        let stillBad = false;
        for (let ki = 0; ki < klastry.length; ki++) {
          if (ki === fixKi) continue;
          if (bodyViolation(Math.min(ki, fixKi), Math.max(ki, fixKi))) {
            stillBad = true;
            break;
          }
        }
        if (stillBad) {
          // Zostaw tylko stolicę — MP klastra naprawianego mogą łamać bufor.
          k.miasta = [{ q: newCap.q, r: newCap.r, isCapital: true }];
          k.pendingStateSlots = [];
          k.growthSlot = null;
          // FALA 188: obetnij też obce MP kolidujące z tą stolicą (zamiast dropu civ).
          for (let ki = 0; ki < klastry.length; ki++) {
            if (ki === fixKi) continue;
            const other = klastry[ki]!;
            const otherCap = clusterCapitalHex(other);
            other.miasta = other.miasta.filter((m) => {
              if (otherCap && m.q === otherCap.q && m.r === otherCap.r) return true;
              return hexDistanceAxial(m.q, m.r, newCap.q, newCap.r) >= bufferRadius;
            });
            if (ki === 0) {
              other.pendingStateSlots = (other.pendingStateSlots ?? []).filter(
                (s) => hexDistanceAxial(s.q, s.r, newCap.q, newCap.r) >= bufferRadius,
              );
            }
          }
          let stillCapConflict = false;
          for (let ki = 0; ki < klastry.length; ki++) {
            if (ki === fixKi) continue;
            if (bodyViolation(Math.min(ki, fixKi), Math.max(ki, fixKi))) {
              stillCapConflict = true;
              break;
            }
          }
          if (stillCapConflict) {
            // Ostatnia próba: globalny relocate z soft sea, bez dropu od razu.
            const lastTry = pickSpawnHexWithCapitalGates(
              map, ladowe, landCache, mapCenter, rand,
              {
                seaDist, minSeaDist, priorCapitals: priorCaps, minCapitalSep,
                requireLocalLand: false,
                requirePlayerMassGate: fixKi === 0,
                progressiveSoftSea: true,
                ...spreadGateOpts,
              },
            );
            if (lastTry) {
              k.miasta = [{ q: lastTry.q, r: lastTry.r, isCapital: true }];
              stillCapConflict = false;
              for (let ki = 0; ki < klastry.length; ki++) {
                if (ki === fixKi) continue;
                if (bodyViolation(Math.min(ki, fixKi), Math.max(ki, fixKi))) {
                  stillCapConflict = true;
                  break;
                }
              }
            }
            if (stillCapConflict) {
              dropCluster(fixKi);
            }
          }
        }
        repaired = true;
        break outer;
      }
    }
  }
}

/**
 * FALA 196: końcowe wyrównanie ćwiartek bboxa lądu na faktycznych stolicach.
 * Top-up / HARD sep mogły skupić civy — relokacja z przepełnionej ćwiartki do pustej.
 */
function enforceQuarterSpreadOnKlastry(
  klastry: TypeCluster[],
  clusterRegions: Array<Array<{ q: number; r: number }>>,
  map: GameMap,
  landCache: MassLandCache,
  ladowe: Array<{ q: number; r: number }>,
  landBBox: { minQ: number; maxQ: number; minR: number; maxR: number },
  nNeeded: number,
  rand: () => number,
  seaDist: Map<string, number> | undefined,
  minSeaDist: number,
  minCapitalSep: number,
  minDystObcyOdGracza: number,
  seed: number,
  stateCityCount: number,
  mapCenter: { q: number; r: number },
  minDystMiastaPanstwa: number,
  bodyBufferRadius: number,
): void {
  if (nNeeded < 5 || klastry.length < 3) return;
  const required = minimumSpreadQuartersRequired(nNeeded);
  const midQ = (landBBox.minQ + landBBox.maxQ) / 2;
  const midR = (landBBox.minR + landBBox.maxR) / 2;
  const spreadGate = { landBBox, spreadN: nNeeded };

  for (let iter = 0; iter < 10; iter++) {
    const caps: Array<{ q: number; r: number; ki: number }> = [];
    for (let ki = 0; ki < klastry.length; ki++) {
      const c = clusterCapitalHex(klastry[ki]!);
      if (c) caps.push({ ...c, ki });
    }
    if (caps.length < 3) break;

    const centers = caps.map(c => ({ q: c.q, r: c.r }));
    const spread = clusterCenterQuadrantSpread(centers, landBBox);
    if (spread.occupiedQuadrants >= required) break;

    const counts = countCentersPerQuadrant(centers, midQ, midR);
    let relocateKi = -1;
    let maxLoad = -1;
    for (const c of caps) {
      const q = landQuadrantIndex(c.q, c.r, midQ, midR);
      if (counts[q]! > maxLoad) {
        maxLoad = counts[q]!;
        relocateKi = c.ki;
      }
    }
    if (relocateKi < 0 || maxLoad <= 1) break;

    const priorCaps = caps.filter(c => c.ki !== relocateKi).map(c => ({ q: c.q, r: c.r }));
    const playerCap = caps.find(c => c.ki === 0);
    const anchor = relocateKi === 0 || !playerCap ? undefined : {
      q: playerCap.q,
      r: playerCap.r,
      minDist: minDystObcyOdGracza,
    };
    const region = clusterRegions[relocateKi] ?? ladowe;

    let newCap = pickSpawnHexWithCapitalGates(
      map, ladowe, landCache, mapCenter, rand,
      {
        seaDist, minSeaDist, priorCapitals: priorCaps, minCapitalSep,
        requireLocalLand: true,
        requirePlayerMassGate: relocateKi === 0,
        progressiveSoftSea: true,
        ...spreadGate,
      },
    );
    if (!newCap) {
      newCap = pickSpawnHexWithCapitalGates(
        map, ladowe, landCache, mapCenter, rand,
        {
          seaDist, minSeaDist, priorCapitals: priorCaps, minCapitalSep,
          requireLocalLand: false,
          requirePlayerMassGate: relocateKi === 0,
          progressiveSoftSea: true,
          ...spreadGate,
        },
      );
    }
    if (!newCap) break;

    const newQuad = landQuadrantIndex(newCap.q, newCap.r, midQ, midR);
    const oldQuad = landQuadrantIndex(caps.find(c => c.ki === relocateKi)!.q, caps.find(c => c.ki === relocateKi)!.r, midQ, midR);
    const newSpread = clusterCenterQuadrantSpread(
      [...priorCaps, newCap],
      landBBox,
    );
    if (newSpread.occupiedQuadrants <= spread.occupiedQuadrants && counts[newQuad] !== 0) break;
    if (newQuad === oldQuad && counts[oldQuad]! <= 1) break;

    const k = klastry[relocateKi]!;
    const minDist = relocateKi === 0 ? minDystMiastaPanstwa : MIN_DIST_FOREIGN_IN_CLUSTER;
    const foreignBufs = foreignBuffersForCluster(klastry, relocateKi, bodyBufferRadius);
    const { stateCities, growthSlot } = packCityStatesAroundCapital(
      ladowe,
      region.length > 0 ? region : ladowe,
      newCap,
      stateCityCount,
      minDist,
      (seed + relocateKi * 0x9e3779b1) >>> 0,
      { excludeHex: newCap, anchor, foreignBuffers: foreignBufs },
    );
    const cities: ClusterCity[] = [{ q: newCap.q, r: newCap.r, isCapital: true }];
    for (const s of stateCities) {
      cities.push({ q: s.q, r: s.r, isCapital: false });
    }
    k.miasta = cities;
    k.centrum = newCap;
    k.growthSlot = growthSlot;
    if (relocateKi === 0) {
      k.pendingStateSlots = packRivalCitiesAroundCore(
        ladowe, newCap, stateCityCount, minDystMiastaPanstwa, seed, mapCenter,
      );
    }
  }
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
    /** Epoka startu gry — filtr puli typów (D-CYW-EPOKA-WEJSCIA). */
    startEpochId?: string;
    /** Wiersze z civs.json — wymagane z startEpochId do filtra epoki. */
    civRoster?: readonly CivEntryEpochRow[];
    /**
     * R-KONFIGURATOR-WYBOR-CYWILIZACJI-PRZECIWNIKA runda 2: konkretne typy AI
     * wybrane przez gracza w kreatorze (multi-select), w kolejności zaznaczenia.
     * Puste/undefined = dotychczasowe zachowanie (deterministyczny ROSTER_KLUCZE).
     * / EN: specific AI civ types chosen by the player in the wizard, in selection
     * order. Empty/undefined = today's behaviour (deterministic ROSTER_KLUCZE).
     */
    preferredCivIds?: readonly string[];
  },
): ClusterPlacement {
  const seed             = opts?.seed ?? 42;
  const playerTypKlucz   = opts?.playerTyp ?? ROSTER_KLUCZE[0]!;
  const rywaleNaKlaster  = opts?.rywaleNaKlaster ?? 9;
  const minDystMiastaPanstwa = opts?.minDystans ?? MIN_DIST_START_CITY_STATE;

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
  const requestedTypy = opts?.aktywneTypy ?? aktywneTypyFromSize(rozmiarMapy);
  const epochRoster = rosterKluczeForStartEpoch(opts?.civRoster, opts?.startEpochId);
  const rosterCap = epochRoster.length > 0 ? epochRoster.length : ROSTER_KLUCZE.length;
  const nTypy = Math.min(requestedTypy, rosterCap);
  const seaDistEarly = buildSeaDistanceField(
    Object.fromEntries(allHexes.map(h => [`${h.coords.q},${h.coords.r}`, h])),
  );
  // FALA 182/188: środki klastrów — ta sama twarda sep co stolice; short<80: miękki
  // fallback (nie sztywne 12 — inaczej harness 80×60 zostawia 3/7 środków).
  const minCapitalSepEarly = capitalMinSeparationForMap(rozmiarMapy, W, H);
  const centerPlacementSep = clusterCenterPlacementSepForMap(rozmiarMapy, W, H);
  const shortSide = Math.min(W, H);
  const minDystKlastrow = opts?.minDystansKlastrow
    ?? (centerPlacementSep > 0
      ? centerPlacementSep
      : (minCapitalSepEarly > 0
        ? minCapitalSepEarly
        : Math.max(4, Math.floor(shortSide / 15))));
  const minDystObcyOdGracza = Math.max(MIN_DIST_FOREIGN_FROM_PLAYER, minDystKlastrow);

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
  const seaDist = buildSeaDistanceField(map.hexes);
  const minSeaDist = capitalMinSeaDistForMap(rozmiarMapy, W, H);
  const maxSeaDist = capitalMaxSeaDistForMap(rozmiarMapy, W, H);
  const minCapitalSep = capitalMinSeparationForMap(rozmiarMapy, W, H);
  const sCluster = clusterBodySeparationForMap(rozmiarMapy, W, H);
  const bodyBufferRadius = clusterBodyBufferRadius(sCluster);
  const landCache = createMassLandCache(ladowe);
  const masses = landCache.masses;
  const landBBox = {
    minQ: Math.min(...ladowe.map(h => h.q)),
    maxQ: Math.max(...ladowe.map(h => h.q)),
    minR: Math.min(...ladowe.map(h => h.r)),
    maxR: Math.max(...ladowe.map(h => h.r)),
  };
  const spreadGateOpts = { landBBox, spreadN: nTypy };

  // --- ŚRODKI TYPÓW: równomiernie po masach lądu (kontynenty/wyspy), nie tylko greedy shuffle ---
  const centrumy = placeClusterCentersAcrossLandmasses(
    map,
    ladowe,
    landCache,
    nTypy,
    minDystKlastrow,
    mapCenter,
    rand,
    marginBrzeg,
    { minQ, maxQ, minR, maxR },
    seaDist,
    minSeaDist,
  );

  // FALA 188: dopełnij brakujące środki — twarda sep + seaDist + lokalny ląd (bez luzowania sep).
  while (centrumy.length < nTypy) {
    const cap = pickSpawnHexWithCapitalGates(
      map,
      ladowe,
      landCache,
      mapCenter,
      rand,
      {
        seaDist,
        minSeaDist,
        priorCapitals: centrumy,
        minCapitalSep: minDystKlastrow,
        requireLocalLand: true,
        requirePlayerMassGate: centrumy.length === 0,
        ...spreadGateOpts,
      },
    );
    if (!cap) break;
    centrumy.push(cap);
  }

  if (centrumy.length < nTypy && typeof console !== 'undefined') {
    console.warn(
      `[clusters] Tylko ${centrumy.length}/${nTypy} środków klastrów — mapa za ciasna lub zbyt pofragmentowany ląd`,
    );
  }

  const rosterSource = epochRoster.length > 0 ? epochRoster : ROSTER_KLUCZE;
  const playerInEpoch = rosterSource.includes(playerTypKlucz);
  const playerKlucz = playerInEpoch ? playerTypKlucz : rosterSource[0]!;

  // --- VORONOI: każdy lądowy hex → najbliższy środek ---
  let activeCentrumy = centrumy.slice();
  let regiony = assignVoronoiRegions(ladowe, activeCentrumy);

  // MAP-SPAWN-Q1 B: lokalny ląd ≥70% w promieniu stolicy (relokacja / pominięcie typu).
  const placeholderKlucze = activeCentrumy.map((_, i) =>
    i === 0 ? playerKlucz : `typ${i}`,
  );
  const dominanceResult = enforceLocalLandDominance(
    map,
    activeCentrumy,
    regiony,
    placeholderKlucze,
    ladowe,
    landCache,
    rand,
    minDystKlastrow,
    mapCenter,
    seaDist,
    minSeaDist,
  );
  activeCentrumy = dominanceResult.centrumy;
  regiony = dominanceResult.regiony;

  // BUG-SPAWN-CLUSTER-KULTURA: typy przypisane do mas PO finalnych środkach (nie przed relokacją).
  // Runda 2 R-KONFIGURATOR-WYBOR-CYWILIZACJI-PRZECIWNIKA: preferowane typy gracza na
  // początek listy PRZED obcięciem do nTypy-1 — patrz reorderRosterByPreference wyżej.
  const rosterBezGracza = reorderRosterByPreference(
    rosterSource.filter(k => k !== playerKlucz),
    opts?.preferredCivIds,
  );
  let activeKlucze = assignTypesToClusterCenters(
    activeCentrumy,
    masses,
    playerKlucz,
    rosterBezGracza.slice(0, Math.max(0, nTypy - 1)),
    rand,
  );
  while (activeKlucze.length < activeCentrumy.length) {
    activeKlucze.push(`typ${activeKlucze.length}`);
  }

  if (activeCentrumy.length < nTypy && typeof console !== 'undefined') {
    console.warn(
      `[clusters] Po bramce lokalnego lądu 70% (R=${LOCAL_LAND_DOMINANCE_RADIUS}): ${activeCentrumy.length}/${nTypy} aktywnych klastrów`,
    );
  }

  // FALA 193: dopełnij środki po dropie dominance — 7 w menu ≠ 5 na mapie przy wolnym lądzie.
  while (activeCentrumy.length < nTypy) {
    const cap = pickSpawnHexWithCapitalGates(
      map,
      ladowe,
      landCache,
      mapCenter,
      rand,
      {
        seaDist,
        minSeaDist,
        priorCapitals: activeCentrumy,
        minCapitalSep: minDystKlastrow,
        requireLocalLand: activeCentrumy.length < nTypy - 1,
        progressiveSoftSea: true,
        ...spreadGateOpts,
      },
    );
    if (!cap) {
      const last = pickSpawnHexWithCapitalGates(
        map,
        ladowe,
        landCache,
        mapCenter,
        rand,
        {
          seaDist,
          minSeaDist,
          priorCapitals: activeCentrumy,
          minCapitalSep: minDystKlastrow,
          requireLocalLand: false,
          progressiveSoftSea: true,
          ...spreadGateOpts,
        },
      );
      if (!last) break;
      activeCentrumy.push(last);
    } else {
      activeCentrumy.push(cap);
    }
  }
  if (activeCentrumy.length > regiony.length || activeCentrumy.length > activeKlucze.length) {
    regiony = assignVoronoiRegions(ladowe, activeCentrumy);
    activeKlucze = assignTypesToClusterCenters(
      activeCentrumy,
      masses,
      playerKlucz,
      rosterBezGracza.slice(0, Math.max(0, nTypy - 1)),
      rand,
    );
    while (activeKlucze.length < activeCentrumy.length) {
      activeKlucze.push(`typ${activeKlucze.length}`);
    }
  }

  // --- MIASTA: klaster gracza (min 5 hex), obce typy min 12 od stolicy, mp obcych min 5 w klastrze ---
  const klastry: TypeCluster[] = [];
  const clusterRegions: Array<Array<{ q: number; r: number }>> = [];
  const stateCityCount = rywaleNaKlaster;
  const placedCapitals: Array<{ q: number; r: number }> = [];

  const playerCentrum = activeCentrumy[0]!;
  const playerRegion = regiony[0]!;
  const playerLayoutResult = buildClusterCitiesWithLandGate(
    map,
    playerRegion,
    playerCentrum,
    stateCityCount,
    minDystMiastaPanstwa,
    rand,
    undefined,
    seed,
    landCache,
    [],
    minDystKlastrow,
    seaDist,
    minSeaDist,
    placedCapitals,
    minCapitalSep,
  );

  let playerCentrumFinal = playerCentrum;
  let playerLayout: {
    cities: ClusterCity[];
    pendingStateSlots: Array<{ q: number; r: number }>;
    growthSlot: { q: number; r: number } | null;
  };

  if (playerLayoutResult) {
    playerLayout = playerLayoutResult;
    playerCentrumFinal = playerLayoutResult.centrum;
  } else {
    const forced = pickPlayerClusterCenter(map, landCache, ladowe, mapCenter, rand, seaDist, minSeaDist);
    if (forced) {
      playerCentrumFinal = forced;
      playerLayout = {
        cities: [{ q: forced.q, r: forced.r, isCapital: true }],
        pendingStateSlots: [],
        growthSlot: null,
      };
    } else {
      playerLayout = { cities: [], pendingStateSlots: [], growthSlot: null };
    }
  }

  let playerCapital = playerLayout.cities.find(m => m.isCapital) ?? playerLayout.cities[0];
  let playerCapitalPos = playerCapital
    ? { q: playerCapital.q, r: playerCapital.r }
    : playerCentrumFinal;

  const resolvePlayerCapitalPos = (): void => {
    const resolved = pickSpawnHexWithCapitalGates(
      map,
      ladowe,
      landCache,
      mapCenter,
      rand,
      {
        seaDist,
        minSeaDist,
        priorCapitals: placedCapitals,
        minCapitalSep,
        requirePlayerMassGate: true,
        requireLocalLand: true,
        preferred: playerCapitalPos,
        ...spreadGateOpts,
      },
    );
    if (!resolved) return;
    playerCentrumFinal = resolved;
    playerCapitalPos = resolved;
    playerLayout = {
      cities: [{ q: resolved.q, r: resolved.r, isCapital: true }],
      pendingStateSlots: [],
      growthSlot: null,
    };
  };

  if (!passesPlayerStartMassGate(map, playerCapitalPos.q, playerCapitalPos.r, landCache)) {
    resolvePlayerCapitalPos();
  }

  if (
    seaDist
    && minSeaDist > 0
    && !passesMinSeaDistGate(seaDist, playerCapitalPos.q, playerCapitalPos.r, minSeaDist)
  ) {
    const fixed = pickSpawnHexWithCapitalGates(
      map,
      ladowe,
      landCache,
      mapCenter,
      rand,
      {
        seaDist,
        minSeaDist,
        priorCapitals: placedCapitals,
        minCapitalSep,
        requirePlayerMassGate: true,
        requireLocalLand: true,
        ...spreadGateOpts,
      },
    );
    if (fixed) {
      const relocatedLayout = buildClusterCitiesWithLandGate(
        map,
        playerRegion,
        fixed,
        stateCityCount,
        minDystMiastaPanstwa,
        rand,
        undefined,
        seed,
        landCache,
        [],
        minDystKlastrow,
        seaDist,
        minSeaDist,
        placedCapitals,
        minCapitalSep,
      );
      if (
        relocatedLayout
        && passesMinSeaDistGate(seaDist, relocatedLayout.cities.find(m => m.isCapital)?.q ?? fixed.q, relocatedLayout.cities.find(m => m.isCapital)?.r ?? fixed.r, minSeaDist)
        && passesMinCapitalSeparationGate(
          clusterCapitalPos(relocatedLayout, fixed),
          placedCapitals,
          minCapitalSep,
        )
      ) {
        playerLayout = relocatedLayout;
        playerCentrumFinal = relocatedLayout.centrum;
        const cap = relocatedLayout.cities.find(m => m.isCapital) ?? relocatedLayout.cities[0];
        playerCapitalPos = cap ? { q: cap.q, r: cap.r } : fixed;
      } else if (
        passesMinSeaDistGate(seaDist, fixed.q, fixed.r, minSeaDist)
        && passesMinCapitalSeparationGate(fixed, placedCapitals, minCapitalSep)
      ) {
        playerCentrumFinal = fixed;
        playerCapitalPos = fixed;
        playerLayout = {
          cities: [{ q: fixed.q, r: fixed.r, isCapital: true }],
          pendingStateSlots: [],
          growthSlot: null,
        };
      }
    }
  }

  if (
    minCapitalSep > 0
    && !passesMinCapitalSeparationGate(playerCapitalPos, placedCapitals, minCapitalSep)
  ) {
    resolvePlayerCapitalPos();
  }

  placedCapitals.push(playerCapitalPos);

  // Pre-plan państw gracza: ciasne skupisko wokół stolicy (min/max 5 hex — Maciej 2026-07-29).
  const playerStateSlots = packRivalCitiesAroundCore(
    ladowe,
    playerCapitalPos,
    stateCityCount,
    minDystMiastaPanstwa,
    seed,
    mapCenter,
  );
  const playerRepack = packCityStatesAroundCapital(
    ladowe,
    playerRegion,
    playerCapitalPos,
    stateCityCount,
    minDystMiastaPanstwa,
    seed,
    {
      excludeHex: playerCapitalPos,
      growthReserve: CLUSTER_GROWTH_RESERVE,
      halfPlaneAxis: computeSameTypeRivalHalfPlaneAxis(playerCapitalPos, mapCenter, seed),
      foreignBuffers: [],
    },
  );
  if (playerRepack.stateCities.length > 0) {
    const playerCities: ClusterCity[] = [{
      q: playerCapitalPos.q,
      r: playerCapitalPos.r,
      isCapital: true,
    }];
    for (const s of playerRepack.stateCities) {
      playerCities.push({ q: s.q, r: s.r, isCapital: false });
    }
    playerLayout = {
      cities: playerCities,
      pendingStateSlots: playerRepack.stateCities,
      growthSlot: playerRepack.growthSlot,
    };
  }

  klastry.push({
    typIndex: 0,
    typ: activeKlucze[0] ?? playerKlucz,
    centrum: playerCentrumFinal,
    miasta: playerLayout.cities,
    pendingStateSlots: playerStateSlots,
    growthSlot: playerLayout.growthSlot,
  });
  clusterRegions.push(playerRegion);

  for (let ci = 1; ci < activeCentrumy.length; ci++) {
    const centrum = activeCentrumy[ci]!;
    const region = regiony[ci]!;
    let foreignLayoutResult = buildClusterCitiesWithLandGate(
      map,
      region,
      centrum,
      stateCityCount,
      MIN_DIST_FOREIGN_IN_CLUSTER,
      rand,
      { q: playerCapitalPos.q, r: playerCapitalPos.r, minDist: minDystObcyOdGracza },
      seed,
      landCache,
      activeCentrumy.slice(0, ci),
      minDystKlastrow,
      seaDist,
      minSeaDist,
      placedCapitals,
      minCapitalSep,
    );
    if (!foreignLayoutResult || foreignLayoutResult.cities.length === 0) {
      const retryCap = pickSpawnHexWithCapitalGates(
        map,
        ladowe,
        landCache,
        mapCenter,
        rand,
        {
          seaDist,
          minSeaDist,
          priorCapitals: placedCapitals,
          minCapitalSep,
          requireLocalLand: true,
          preferred: centrum,
          progressiveSoftSea: true,
          ...spreadGateOpts,
        },
      );
      if (retryCap) {
        foreignLayoutResult = {
          cities: [{ q: retryCap.q, r: retryCap.r, isCapital: true }],
          pendingStateSlots: [],
          growthSlot: null,
          centrum: retryCap,
        };
        activeCentrumy[ci] = retryCap;
      }
    }
    // FALA 188: ostatnia szansa — bez bramki lokalnego lądu 70% + soft seaDist
    // (sep stolic twarde). Nieregularna Pangea: minSea+sep dawało max ~4 civ.
    if (!foreignLayoutResult || foreignLayoutResult.cities.length === 0) {
      const lastCap = pickSpawnHexWithCapitalGates(
        map,
        ladowe,
        landCache,
        mapCenter,
        rand,
        {
          seaDist,
          minSeaDist,
          priorCapitals: placedCapitals,
          minCapitalSep,
          requireLocalLand: false,
          preferred: centrum,
          progressiveSoftSea: true,
          ...spreadGateOpts,
        },
      );
      if (lastCap) {
        foreignLayoutResult = {
          cities: [{ q: lastCap.q, r: lastCap.r, isCapital: true }],
          pendingStateSlots: [],
          growthSlot: null,
          centrum: lastCap,
        };
        activeCentrumy[ci] = lastCap;
      }
    }
    if (!foreignLayoutResult || foreignLayoutResult.cities.length === 0) {
      if (typeof console !== 'undefined') {
        console.warn(
          `[clusters] Pominięto typ '${activeKlucze[ci] ?? `typ${ci}`}'` +
          ` — brak hexu startowego z bramką lądu (region=${region.length} hex)`,
        );
      }
      continue;
    }

    const foreignCap = foreignLayoutResult.cities.find(m => m.isCapital)
      ?? foreignLayoutResult.cities[0]!;
    // FALA 188: nie dropuj po soft-sea rescue — sep poniżej jest twarde.
    const softSeaFloor = seaDistRescueLadder(minSeaDist).slice(-1)[0] ?? 0;
    if (
      seaDist
      && softSeaFloor > 0
      && !passesMinSeaDistGate(seaDist, foreignCap.q, foreignCap.r, softSeaFloor)
    ) {
      if (typeof console !== 'undefined') {
        console.warn(
          `[clusters] Pominięto typ '${activeKlucze[ci] ?? `typ${ci}`}'` +
          ` — stolica zbyt blisko morza (seaDist=${seaDistAt(seaDist, foreignCap.q, foreignCap.r)}, floor=${softSeaFloor})`,
        );
      }
      continue;
    }
    if (!passesMinCapitalSeparationGate(
      { q: foreignCap.q, r: foreignCap.r },
      placedCapitals,
      minCapitalSep,
    )) {
      if (typeof console !== 'undefined') {
        console.warn(
          `[clusters] Pominięto typ '${activeKlucze[ci] ?? `typ${ci}`}'` +
          ` — stolica zbyt blisko innej stolicy (minSep=${minCapitalSep})`,
        );
      }
      continue;
    }
    const foreignAnchor = {
      q: playerCapitalPos.q,
      r: playerCapitalPos.r,
      minDist: minDystObcyOdGracza,
    };
    const foreignBufs = foreignBuffersForCluster(klastry, klastry.length, bodyBufferRadius);
    const foreignRepack = packCityStatesAroundCapital(
      ladowe,
      region,
      { q: foreignCap.q, r: foreignCap.r },
      stateCityCount,
      MIN_DIST_FOREIGN_IN_CLUSTER,
      (seed + ci * 0x9e3779b1) >>> 0,
      {
        excludeHex: { q: foreignCap.q, r: foreignCap.r },
        anchor: foreignAnchor,
        foreignBuffers: foreignBufs,
      },
    );
    const foreignCities: ClusterCity[] = [{
      q: foreignCap.q,
      r: foreignCap.r,
      isCapital: true,
    }];
    for (const s of foreignRepack.stateCities) {
      foreignCities.push({ q: s.q, r: s.r, isCapital: false });
    }

    klastry.push({
      typIndex: klastry.length,
      typ: activeKlucze[ci] ?? `typ${ci}`,
      centrum: foreignLayoutResult.centrum,
      miasta: foreignCities,
      growthSlot: foreignRepack.growthSlot ?? foreignLayoutResult.growthSlot,
    });
    clusterRegions.push(region);
    placedCapitals.push({ q: foreignCap.q, r: foreignCap.r });
  }

  // FALA 193: po `continue` w pętli obcych — dopełnij brakujące typy (7→5 bug).
  {
    const usedTyps = new Set(klastry.map(k => k.typ));
    const unusedKeys = [
      ...rosterSource.filter(k => k !== playerKlucz && !usedTyps.has(k)),
      ...activeKlucze.filter(k => k !== playerKlucz && !usedTyps.has(k)),
    ].filter((k, i, a) => a.indexOf(k) === i);
    let keyIdx = 0;
    while (klastry.length < nTypy) {
      const cap = pickSpawnHexWithCapitalGates(
        map,
        ladowe,
        landCache,
        mapCenter,
        rand,
        {
          seaDist,
          minSeaDist,
          priorCapitals: placedCapitals,
          minCapitalSep,
          requireLocalLand: false,
          progressiveSoftSea: true,
          ...spreadGateOpts,
        },
      );
      if (!cap) break;
      if (hexDistanceAxial(cap.q, cap.r, playerCapitalPos.q, playerCapitalPos.r) < minDystObcyOdGracza) {
        // spróbuj inny hex — nie akceptuj zbyt blisko gracza
        const alt = pickSpawnHexWithCapitalGates(
          map,
          ladowe,
          landCache,
          mapCenter,
          rand,
          {
            seaDist,
            minSeaDist,
            priorCapitals: [...placedCapitals, playerCapitalPos],
            minCapitalSep: Math.max(minCapitalSep, minDystObcyOdGracza),
            requireLocalLand: false,
            progressiveSoftSea: true,
            ...spreadGateOpts,
          },
        );
        if (!alt) break;
        const typ = unusedKeys[keyIdx++] ?? `typ${klastry.length}`;
        klastry.push({
          typIndex: klastry.length,
          typ,
          centrum: alt,
          miasta: [{ q: alt.q, r: alt.r, isCapital: true }],
          pendingStateSlots: [],
          growthSlot: null,
        });
        clusterRegions.push(ladowe.filter(h =>
          hexDistanceAxial(h.q, h.r, alt.q, alt.r) <= Math.max(8, Math.floor(minDystKlastrow / 2)),
        ));
        placedCapitals.push(alt);
        continue;
      }
      const typ = unusedKeys[keyIdx++] ?? `typ${klastry.length}`;
      klastry.push({
        typIndex: klastry.length,
        typ,
        centrum: cap,
        miasta: [{ q: cap.q, r: cap.r, isCapital: true }],
        pendingStateSlots: [],
        growthSlot: null,
      });
      clusterRegions.push(ladowe.filter(h =>
        hexDistanceAxial(h.q, h.r, cap.q, cap.r) <= Math.max(8, Math.floor(minDystKlastrow / 2)),
      ));
      placedCapitals.push(cap);
    }
    if (klastry.length < nTypy && typeof console !== 'undefined') {
      console.warn(
        `[clusters] FALA 193 top-up: nadal ${klastry.length}/${nTypy} klastrów po dopełnieniu`,
      );
    }
  }

  // FALA 185: repack MP gracza z buforami obcych klastrów (po znanych pozycjach obcych).
  if (klastry.length > 0 && klastry[0]!.miasta.length > 0) {
    const playerCap = clusterCapitalHex(klastry[0]!) ?? playerCapitalPos;
    const playerBufs = foreignBuffersForCluster(klastry, 0, bodyBufferRadius);
    const playerRegionFinal = clusterRegions[0] ?? playerRegion;
    const playerRepackFinal = packCityStatesAroundCapital(
      ladowe,
      playerRegionFinal,
      playerCap,
      stateCityCount,
      minDystMiastaPanstwa,
      seed,
      {
        excludeHex: playerCap,
        growthReserve: CLUSTER_GROWTH_RESERVE,
        halfPlaneAxis: computeSameTypeRivalHalfPlaneAxis(playerCap, mapCenter, seed),
        foreignBuffers: playerBufs,
      },
    );
    if (playerRepackFinal.stateCities.length > 0 || playerRepackFinal.growthSlot) {
      const cities: ClusterCity[] = [{ q: playerCap.q, r: playerCap.r, isCapital: true }];
      for (const s of playerRepackFinal.stateCities) {
        cities.push({ q: s.q, r: s.r, isCapital: false });
      }
      klastry[0]!.miasta = cities;
      klastry[0]!.pendingStateSlots = playerRepackFinal.stateCities;
      klastry[0]!.growthSlot = playerRepackFinal.growthSlot;
    }
  }

  enforceHardCapitalSeparationOnKlastry(
    klastry,
    clusterRegions,
    map,
    rand,
    seaDist,
    minSeaDist,
    minCapitalSep,
    minDystObcyOdGracza,
    ladowe,
    landCache,
    seed,
    stateCityCount,
    mapCenter,
    minDystMiastaPanstwa,
    spreadGateOpts,
  );

  enforceClusterBodySeparationOnKlastry(
    klastry,
    clusterRegions,
    map,
    rand,
    seaDist,
    minSeaDist,
    sCluster,
    minCapitalSep,
    minDystObcyOdGracza,
    ladowe,
    landCache,
    seed,
    stateCityCount,
    mapCenter,
    minDystMiastaPanstwa,
    bodyBufferRadius,
    spreadGateOpts,
  );

  // FALA 193: HARD sep może dropnąć typ — dopełnij z powrotem do nTypy (sep twarde).
  if (klastry.length < nTypy) {
    const capsNow: Array<{ q: number; r: number }> = [];
    for (const k of klastry) {
      const c = clusterCapitalHex(k);
      if (c) capsNow.push(c);
    }
    const usedTyps = new Set(klastry.map(k => k.typ));
    const unusedKeys = rosterSource.filter(k => !usedTyps.has(k));
    let keyIdx = 0;
    while (klastry.length < nTypy) {
      const cap = pickSpawnHexWithCapitalGates(
        map,
        ladowe,
        landCache,
        mapCenter,
        rand,
        {
          seaDist,
          minSeaDist,
          priorCapitals: capsNow,
          minCapitalSep,
          requireLocalLand: false,
          progressiveSoftSea: true,
          ...spreadGateOpts,
        },
      );
      if (!cap) break;
      const typ = unusedKeys[keyIdx++] ?? `typ${klastry.length}`;
      klastry.push({
        typIndex: klastry.length,
        typ,
        centrum: cap,
        miasta: [{ q: cap.q, r: cap.r, isCapital: true }],
        pendingStateSlots: [],
        growthSlot: null,
      });
      clusterRegions.push([]);
      capsNow.push(cap);
    }
  }

  // FALA 196: końcowe wyrównanie ćwiartek po sep/top-up.
  enforceQuarterSpreadOnKlastry(
    klastry,
    clusterRegions,
    map,
    landCache,
    ladowe,
    landBBox,
    nTypy,
    rand,
    seaDist,
    minSeaDist,
    minCapitalSep,
    minDystObcyOdGracza,
    seed,
    stateCityCount,
    mapCenter,
    minDystMiastaPanstwa,
    bodyBufferRadius,
  );

  // BUG-INKOWIE-MP-BRAK: body-sep / ciasny region często zostawia samą stolicę obcego typu.
  repackAllSparseClusterStateCities(
    klastry,
    clusterRegions,
    stateCityCount,
    minDystObcyOdGracza,
    ladowe,
    seed,
    bodyBufferRadius,
    mapCenter,
    minDystMiastaPanstwa,
  );

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
    spawnCache: { seaDist, landCache, ladowe },
  };
}
