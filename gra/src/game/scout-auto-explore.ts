/**
 * scout-auto-explore.ts — automatyczne zwiedzanie mapy przez zwiadowców.
 * Priorytet: znana (odkryta) niewykorzystana chatka → mgła. Tylko autoExplore=true.
 */

import type { GameMap } from '../types/map';
import {
  computePath,
  computeReachable,
  keyOf,
  terrainMoveCost,
  type RuntimeUnit,
} from '../units/setup';
import { addExplored, computeVisibleAt, type UnitSightResolver } from './visibility';

const HEX_NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [+1, 0], [-1, 0], [0, +1], [0, -1], [+1, -1], [-1, +1],
];

const SCOUT_TYPE_ID = 'Zwiadowca';

export function isScoutUnit(unit: RuntimeUnit): boolean {
  return unit.category === 'zwiadowca' || unit.typeId === SCOUT_TYPE_ID;
}

/** Punkty za heksy nieodkryte w zasięgu wzroku + sąsiednie ukryte. */
export function scoreHexForExplore(
  q: number,
  r: number,
  explored: ReadonlySet<string>,
  map: GameMap,
  sight: number,
): number {
  let score = 0;
  for (const k of computeVisibleAt(q, r, map, sight)) {
    if (!explored.has(k)) score += 2;
  }
  for (const [dq, dr] of HEX_NEIGHBORS) {
    const k = keyOf(q + dq, r + dr);
    if (k in map.hexes && !explored.has(k)) score += 3;
  }
  return score;
}

function occupiedExcept(units: readonly RuntimeUnit[], unitId: string): Set<string> {
  const occ = new Set<string>();
  for (const u of units) {
    if (u.id !== unitId) occ.add(keyOf(u.q, u.r));
  }
  return occ;
}

function deductStepCost(unit: RuntimeUnit, cost: number): void {
  if (!Number.isFinite(cost) || cost <= 0) return;
  if (cost <= unit.ruchLeft) {
    unit.ruchLeft -= cost;
  } else if (unit.ruchLeft >= 1) {
    unit.ruchLeft = 0;
  }
}

/**
 * Priorytet 1: najbliższa znana (odkryta), nieprzejęta chatka.
 * Szuka w `explored` — także na krawędzi mgły / poza jednorazowym zasięgiem MP.
 */
function pickKnownVillageTarget(
  unit: RuntimeUnit,
  map: GameMap,
  explored: ReadonlySet<string>,
  occupied: ReadonlySet<string>,
): { q: number; r: number } | null {
  let bestPathLen = Infinity;
  let best: { q: number; r: number } | null = null;

  for (const key of explored) {
    const hex = map.hexes[key];
    if (!hex?.wioska?.istnieje) continue;
    if (hex.wlasciciel !== null) continue;

    const { q, r } = hex.coords;
    const path = computePath(unit, map, q, r, new Set(occupied));
    if (path.length === 0) continue;

    if (path.length < bestPathLen) {
      bestPathLen = path.length;
      best = { q, r };
    }
  }

  return best;
}

/**
 * Wybiera docelowy heks — priorytet: znana chatka, potem mgła (w zasięgu MP).
 */
export function pickScoutExploreTarget(
  unit: RuntimeUnit,
  map: GameMap,
  explored: ReadonlySet<string>,
  occupied: ReadonlySet<string>,
  sight: number,
  rng: () => number,
): { q: number; r: number } | null {
  const villageTarget = pickKnownVillageTarget(unit, map, explored, occupied);
  if (villageTarget) return villageTarget;

  const reachable = computeReachable(unit, map, new Set(occupied));
  reachable.delete(keyOf(unit.q, unit.r));
  if (reachable.size === 0) return null;

  let bestScore = -Infinity;
  const candidates: { q: number; r: number }[] = [];

  for (const key of reachable) {
    const parts = key.split(',');
    if (parts.length !== 2) continue;
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    if (!Number.isFinite(q) || !Number.isFinite(r)) continue;

    const score = scoreHexForExplore(q, r, explored, map, sight) + rng() * 1.5;
    if (score > bestScore + 0.001) {
      bestScore = score;
      candidates.length = 0;
      candidates.push({ q, r });
    } else if (Math.abs(score - bestScore) <= 0.001) {
      candidates.push({ q, r });
    }
  }

  if (candidates.length === 0) return null;
  return candidates[Math.floor(rng() * candidates.length)]!;
}

/**
 * Zużywa pozostały ruch zwiadowcy — krok po kroku w stronę chatki lub mgły.
 */
export function advanceScoutAutoExplore(
  unit: RuntimeUnit,
  map: GameMap,
  explored: ReadonlySet<string>,
  allUnits: readonly RuntimeUnit[],
  sight: number,
  rng: () => number = Math.random,
  onAfterStep?: (unit: RuntimeUnit) => void,
): { moved: boolean; steps: number } {
  if (!isScoutUnit(unit)) return { moved: false, steps: 0 };
  if (unit.ruchLeft <= 0 || unit.inGarnizon || unit.oblegaCityId) {
    return { moved: false, steps: 0 };
  }

  const workingExplored = new Set(explored);
  addExplored(workingExplored, computeVisibleAt(unit.q, unit.r, map, sight));

  let steps = 0;
  let moved = false;

  while (unit.ruchLeft > 0) {
    const occ = occupiedExcept(allUnits, unit.id);
    const target = pickScoutExploreTarget(unit, map, workingExplored, occ, sight, rng);
    if (!target) break;

    const path = computePath(unit, map, target.q, target.r, occ);
    if (path.length === 0) break;

    const step = path[0]!;
    const hex = map.hexes[keyOf(step.q, step.r)];
    if (!hex) break;
    const cost = terrainMoveCost(hex);
    if (cost === Infinity) break;
    if (cost > unit.ruchLeft && unit.ruchLeft < 1) break;

    unit.q = step.q;
    unit.r = step.r;
    deductStepCost(unit, cost);
    addExplored(workingExplored, computeVisibleAt(unit.q, unit.r, map, sight));
    steps++;
    moved = true;
    onAfterStep?.(unit);

    if (steps > 96) break;
  }

  return { moved, steps };
}

/** Zwiadowcy gracza z autoExplore=true — auto-zwiedzanie przed końcem tury. */
export function runScoutsAutoExplore(
  units: RuntimeUnit[],
  map: GameMap,
  explored: ReadonlySet<string>,
  playerOwnerId: number,
  sightResolver: UnitSightResolver,
  rng: () => number = Math.random,
  onAfterStep?: (unit: RuntimeUnit) => void,
): { movedUnitIds: string[]; totalSteps: number } {
  const movedUnitIds: string[] = [];
  let totalSteps = 0;
  for (const u of units) {
    if (u.ownerId !== playerOwnerId) continue;
    if (!isScoutUnit(u)) continue;
    if (u.autoExplore !== true) continue;
    if (u.sentry === true) continue;
    const r = advanceScoutAutoExplore(
      u,
      map,
      explored,
      units,
      sightResolver(u),
      rng,
      onAfterStep,
    );
    if (r.moved) {
      movedUnitIds.push(u.id);
      totalSteps += r.steps;
    }
  }
  return { movedUnitIds, totalSteps };
}
