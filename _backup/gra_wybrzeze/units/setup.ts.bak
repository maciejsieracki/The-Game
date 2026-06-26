/**
 * setup.ts
 * Unit placement and movement logic for the world map.
 *
 * Exports:
 *   RuntimeUnit           - shared contract for in-game unit instances
 *   keyOf(q, r)           - canonical hex key "q,r"
 *   hexDistance(...)      - axial/cube hex distance
 *   placeStartingUnits()  - deterministic initial settler placement
 *   computeReachable()    - BFS reachable hexes within ruchLeft steps
 */

import type { GameMap } from '../types/map';
import type { GameData } from '../data/loader';
import { TerenBazowy } from '../types/hex';

// ---------------------------------------------------------------------------
// RuntimeUnit - shared contract imported by other modules
// ---------------------------------------------------------------------------

/**
 * A unit instance on the world map at runtime.
 * ownerId 0 = human player, 1..N = AI rivals.
 * typeId = "Jednostka" key from units.json (e.g. "Osadnik").
 */
export interface RuntimeUnit {
  id: string;
  ownerId: number;
  typeId: string;
  q: number;
  r: number;
  ruch: number;
  ruchLeft: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Canonical string key for a hex coordinate pair.
 * Matches the key format used in GameMap.hexes: "${q},${r}".
 */
export function keyOf(q: number, r: number): string {
  return `${q},${r}`;
}

/**
 * Axial (cube) hex distance between two hexes.
 * In cube coords: s = -q - r. Distance = max(|dq|, |dr|, |ds|).
 */
export function hexDistance(aq: number, ar: number, bq: number, br: number): number {
  const dq = Math.abs(aq - bq);
  const dr = Math.abs(ar - br);
  const ds = Math.abs((-aq - ar) - (-bq - br));
  return Math.max(dq, dr, ds);
}

// ---------------------------------------------------------------------------
// Internal: simple LCG seeded PRNG
// ---------------------------------------------------------------------------

/** Advances LCG state and returns [nextState, float in [0, 1)]. */
function lcgNext(state: number): [number, number] {
  // Numerical Recipes 32-bit LCG
  const next = ((state * 1664525 + 1013904223) >>> 0);
  return [next, next / 0x100000000];
}

// ---------------------------------------------------------------------------
// Internal: hex terrain scoring for settler placement
// ---------------------------------------------------------------------------

/**
 * Returns a preference score for settler placement:
 *   Laka=4, Rownina=4, Wybrzeze=3, Wzgorza=2, Pustynia=1,
 *   Gory=0 (avoid), Morze=-1 (illegal).
 */
function terrainScore(tb: TerenBazowy): number {
  switch (tb) {
    case TerenBazowy.Laka:     return 4;
    case TerenBazowy.Rownina:  return 4;
    case TerenBazowy.Wybrzeze: return 3;
    case TerenBazowy.Wzgorza:  return 2;
    case TerenBazowy.Pustynia: return 1;
    case TerenBazowy.Gory:     return 0;
    case TerenBazowy.Morze:    return -1;
    default:                   return 0;
  }
}

// ---------------------------------------------------------------------------
// placeStartingUnits
// ---------------------------------------------------------------------------

/**
 * Places the player settler and up to 6 AI rival settlers on the map.
 *
 * Algorithm:
 *   1. Collect all land hexes (score > 0) sorted by preference.
 *   2. Find the settler unit type in data.units by case-insensitive match:
 *      "Jednostka" field containing "osadnik", OR "Rola (linia)" containing
 *      "osadnik" or "settler". Falls back to typeId = "osadnik".
 *   3. Player (ownerId 0) is placed on the best hex nearest the map center.
 *   4. AI rivals (ownerId 1..6) placed greedily from a shuffled candidate list,
 *      each at least MIN_DIST hexes from all prior placements. MIN_DIST starts
 *      at 5 and is relaxed by 1 each iteration until at least MIN_AI fit,
 *      but never below ABS_MIN_DIST=2.
 *   5. All randomness derived from map.seed via LCG.
 *   6. Unit ids: "u0", "u1", ...
 */
export function placeStartingUnits(map: GameMap, data: GameData): RuntimeUnit[] {
  // --- Find settler unit definition ---
  let settlerTypeId = 'osadnik';
  let settlerRuch = 2;

  const found = data.units.find(u => {
    const name = (u.Jednostka ?? '').toLowerCase();
    const role = (u['Rola (linia)'] ?? '').toLowerCase();
    return name.includes('osadnik') || role.includes('osadnik') || role.includes('settler');
  });

  if (found) {
    settlerTypeId = found.Jednostka;
    settlerRuch = (typeof found.Ruch === 'number' && found.Ruch > 0) ? found.Ruch : 2;
  }

  // --- Collect candidate land hexes ---
  interface Candidate { q: number; r: number; score: number; }
  const candidates: Candidate[] = [];

  for (const key of Object.keys(map.hexes)) {
    const hex = map.hexes[key];
    if (!hex) continue;
    const score = terrainScore(hex.terenBazowy);
    if (score > 0) {
      candidates.push({ q: hex.coords.q, r: hex.coords.r, score });
    }
  }

  if (candidates.length === 0) {
    return [];
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  // --- LCG state from seed ---
  let lcgState = (map.seed >>> 0);

  // --- Player settler: best hex nearest the map center ---
  const cq = Math.round((map.szerokoscQ - 1) / 2);
  const cr = Math.round((map.wysokoscR - 1) / 2);

  const bestScore = candidates[0]!.score;
  const topTier = candidates.filter(c => c.score === bestScore);

  let playerCandidate = topTier[0]!;
  let bestCenterDist = hexDistance(playerCandidate.q, playerCandidate.r, cq, cr);

  for (let i = 1; i < topTier.length; i++) {
    const d = hexDistance(topTier[i]!.q, topTier[i]!.r, cq, cr);
    if (d < bestCenterDist) {
      bestCenterDist = d;
      playerCandidate = topTier[i]!;
    }
  }

  const units: RuntimeUnit[] = [];
  let unitCounter = 0;

  units.push({
    id: `u${unitCounter++}`,
    ownerId: 0,
    typeId: settlerTypeId,
    q: playerCandidate.q,
    r: playerCandidate.r,
    ruch: settlerRuch,
    ruchLeft: settlerRuch,
  });

  const placed: Array<{ q: number; r: number }> = [
    { q: playerCandidate.q, r: playerCandidate.r },
  ];

  // --- AI rivals ---
  const TARGET_AI    = 6;
  const MIN_AI       = 3;
  const ABS_MIN_DIST = 2;

  // Shuffle candidates via LCG Fisher-Yates
  const shuffled = [...candidates];
  for (let i = shuffled.length - 1; i > 0; i--) {
    let rnd: number;
    [lcgState, rnd] = lcgNext(lcgState);
    const j = Math.floor(rnd * (i + 1));
    const tmp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = tmp;
  }

  function attemptPlacement(minDist: number): Array<{ q: number; r: number }> {
    const result: Array<{ q: number; r: number }> = [];
    const localPlaced = [...placed];
    for (const c of shuffled) {
      if (result.length >= TARGET_AI) break;
      const tooClose = localPlaced.some(
        p => hexDistance(c.q, c.r, p.q, p.r) < minDist,
      );
      if (!tooClose) {
        localPlaced.push({ q: c.q, r: c.r });
        result.push({ q: c.q, r: c.r });
      }
    }
    return result;
  }

  let aiPositions: Array<{ q: number; r: number }> = [];
  for (let minDist = 5; minDist >= ABS_MIN_DIST; minDist--) {
    aiPositions = attemptPlacement(minDist);
    if (aiPositions.length >= MIN_AI) break;
  }

  for (const pos of aiPositions) {
    const ownerId = unitCounter; // ownerId 1..N matches insertion order
    units.push({
      id: `u${unitCounter}`,
      ownerId,
      typeId: settlerTypeId,
      q: pos.q,
      r: pos.r,
      ruch: settlerRuch,
      ruchLeft: settlerRuch,
    });
    unitCounter++;
  }

  return units;
}

// ---------------------------------------------------------------------------
// computeReachable
// ---------------------------------------------------------------------------

/**
 * Pointy-top axial hex neighbors (6 directions).
 */
const HEX_NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [+1,  0],
  [-1,  0],
  [ 0, +1],
  [ 0, -1],
  [+1, -1],
  [-1, +1],
] as const;

/**
 * BFS over passable land hexes reachable within unit.ruchLeft steps.
 *
 * Rules:
 *   - Movement cost: 1 point per hex step.
 *   - Impassable: Morze (water), hexes in occupied, hexes not in map.hexes.
 *   - Returns Set<"q,r"> of reachable hexes, EXCLUDING the unit's own hex.
 *
 * @param unit     The moving unit (q, r, ruchLeft used).
 * @param map      Game map for hex lookup.
 * @param occupied Set of "q,r" keys blocked by other units.
 */
export function computeReachable(
  unit: RuntimeUnit,
  map: GameMap,
  occupied: Set<string>,
): Set<string> {
  const reachable = new Set<string>();

  // BFS queue entries: [q, r, movementRemaining]
  const queue: Array<[number, number, number]> = [
    [unit.q, unit.r, unit.ruchLeft],
  ];

  // Track best (highest) movement remaining reached per hex to avoid re-visits
  const visited = new Map<string, number>();
  visited.set(keyOf(unit.q, unit.r), unit.ruchLeft);

  while (queue.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [cq, cr, movLeft] = queue.shift()!;

    for (const [dq, dr] of HEX_NEIGHBORS) {
      const nq = cq + dq;
      const nr = cr + dr;
      const nKey = keyOf(nq, nr);

      // Hex must exist in the map
      if (!(nKey in map.hexes)) continue;

      const hex = map.hexes[nKey]!;

      // Water is impassable
      if (hex.terenBazowy === TerenBazowy.Morze) continue;

      // Occupied hexes block entry
      if (occupied.has(nKey)) continue;

      // Cost: 1 movement point
      const newMovLeft = movLeft - 1;
      if (newMovLeft < 0) continue;

      // Skip if previously reached with equal or more movement remaining
      const prevBest = visited.get(nKey);
      if (prevBest !== undefined && prevBest >= newMovLeft) continue;

      visited.set(nKey, newMovLeft);
      reachable.add(nKey);

      if (newMovLeft > 0) {
        queue.push([nq, nr, newMovLeft]);
      }
    }
  }

  return reachable;
}

// ---------------------------------------------------------------------------
// computePath
// ---------------------------------------------------------------------------

/**
 * BFS shortest-path from unit's current hex to (destQ, destR).
 *
 * Rules (same passability as computeReachable):
 *   - Neighbors: pointy-top axial set (HEX_NEIGHBORS).
 *   - A hex is passable iff it exists in map.hexes AND is not Morze AND is not
 *     in occupied -- EXCEPT the destination hex is always allowed as the final
 *     step regardless of whether it appears in occupied (the caller guarantees
 *     it is a valid landing hex).
 *   - Uniform cost (1 hop per step), so plain BFS gives optimal hop count.
 *   - Tracks parent pointers during BFS; reconstructs path on arrival.
 *
 * Returns: ordered list of hexes AFTER the start, ending at dest.
 *          i.e. [first-step, ..., dest].  Start hex is NOT included.
 *          Returns [] if dest == start OR dest is unreachable.
 *
 * Pure function -- no DOM, no THREE, no side effects.
 */
export function computePath(
  unit: RuntimeUnit,
  map: GameMap,
  destQ: number,
  destR: number,
  occupied: Set<string>,
): { q: number; r: number }[] {
  const startKey = keyOf(unit.q, unit.r);
  const destKey  = keyOf(destQ, destR);

  // Destination must exist in the map to be reachable.
  if (!(destKey in map.hexes)) return [];

  // Trivial case: already there.
  if (startKey === destKey) return [];

  // parent map: key -> key of hex we came from.
  const parent = new Map<string, string>();
  parent.set(startKey, '');

  // BFS queue of [q, r] pairs.
  const queue: Array<[number, number]> = [[unit.q, unit.r]];

  outer: while (queue.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [cq, cr] = queue.shift()!;

    for (const [dq, dr] of HEX_NEIGHBORS) {
      const nq   = cq + dq;
      const nr   = cr + dr;
      const nKey = keyOf(nq, nr);

      // Already visited.
      if (parent.has(nKey)) continue;

      // Hex must exist in the map.
      if (!(nKey in map.hexes)) continue;

      const hex = map.hexes[nKey]!;

      if (nKey === destKey) {
        // Destination is always allowed -- record parent and stop immediately.
        parent.set(nKey, keyOf(cq, cr));
        break outer;
      }

      // Non-destination hexes: water and occupied are impassable.
      if (hex.terenBazowy === TerenBazowy.Morze) continue;
      if (occupied.has(nKey)) continue;

      parent.set(nKey, keyOf(cq, cr));
      queue.push([nq, nr]);
    }
  }

  // Destination not reached.
  if (!parent.has(destKey)) return [];

  // Reconstruct path by walking parent pointers from dest back to start.
  const path: { q: number; r: number }[] = [];
  let cur = destKey;
  while (cur !== startKey) {
    const parts = cur.split(',');
    path.push({ q: Number(parts[0]), r: Number(parts[1]) });
    cur = parent.get(cur)!;
  }
  path.reverse();

  return path;
}
