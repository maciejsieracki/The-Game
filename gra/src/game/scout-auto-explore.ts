/**
 * scout-auto-explore.ts — automatyczne zwiedzanie mapy przez zwiadowców.
 * Priorytet: chatka w widoku lub w zasięgu MP tej tury → nowe czarne heksy (R-SCOUT-BLACK-MAX).
 * Tylko autoExplore=true.
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

/** Wyłącza auto-zwiedzanie zwiadowcy (np. klik / rozkaz marszu). Zwraca true jeśli było włączone. */
export function clearScoutAutoExplore(unit: RuntimeUnit): boolean {
  if (!isScoutUnit(unit)) return false;
  if (unit.autoExplore !== true) return false;
  unit.autoExplore = false;
  return true;
}

/** Liczba nowych czarnych heksów ujawnionych po kroku (marginal vs pozycja from). */
export function scoreMarginalReveal(
  fromQ: number,
  fromR: number,
  toQ: number,
  toR: number,
  explored: ReadonlySet<string>,
  map: GameMap,
  sight: number,
): number {
  const fromVisible = computeVisibleAt(fromQ, fromR, map, sight);
  const toVisible = computeVisibleAt(toQ, toR, map, sight);
  let count = 0;
  for (const k of toVisible) {
    if (!explored.has(k) && !fromVisible.has(k)) count++;
  }
  return count;
}

/** Punkty za heksy nieodkryte w zasięgu wzroku + sąsiednie ukryte (legacy scoring). */
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
 * Priorytet 1: najbliższa nieprzejęta chatka w bieżącym widoku lub w zasięgu MP tej tury.
 */
function pickKnownVillageTarget(
  unit: RuntimeUnit,
  map: GameMap,
  explored: ReadonlySet<string>,
  occupied: ReadonlySet<string>,
  sight: number,
): { q: number; r: number } | null {
  const visible = computeVisibleAt(unit.q, unit.r, map, sight);
  const reachable = computeReachable(unit, map, new Set(occupied));

  let bestPathLen = Infinity;
  let best: { q: number; r: number } | null = null;

  for (const key of explored) {
    const hex = map.hexes[key];
    if (!hex?.wioska?.istnieje) continue;
    if (hex.wlasciciel !== null) continue;

    const { q, r } = hex.coords;
    const hutKey = keyOf(q, r);
    if (!visible.has(hutKey) && !reachable.has(hutKey)) continue;

    const path = computePath(unit, map, q, r, new Set(occupied));
    if (path.length === 0) continue;

    if (path.length < bestPathLen) {
      bestPathLen = path.length;
      best = { q, r };
    }
  }

  return best;
}

/** Najlepszy jednokrokowy ruch — max marginalnych nowych czarnych heksów. */
function pickBestExploreStep(
  unit: RuntimeUnit,
  map: GameMap,
  explored: ReadonlySet<string>,
  occupied: ReadonlySet<string>,
  sight: number,
  rng: () => number,
): { q: number; r: number } | null {
  const reachable = computeReachable(unit, map, new Set(occupied));
  reachable.delete(keyOf(unit.q, unit.r));
  if (reachable.size === 0) return null;

  const positive: { q: number; r: number; gain: number }[] = [];
  const zero: { q: number; r: number }[] = [];

  for (const key of reachable) {
    const parts = key.split(',');
    if (parts.length !== 2) continue;
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    if (!Number.isFinite(q) || !Number.isFinite(r)) continue;

    const path = computePath(unit, map, q, r, new Set(occupied));
    if (path.length !== 1) continue;

    const gain = scoreMarginalReveal(unit.q, unit.r, q, r, explored, map, sight);
    if (gain > 0) positive.push({ q, r, gain });
    else if (gain === 0) zero.push({ q, r });
  }

  const pool: { q: number; r: number; gain: number }[] =
    positive.length > 0 ? positive : zero.map((c) => ({ ...c, gain: 0 }));
  if (pool.length === 0) return null;

  let bestGain = -Infinity;
  const candidates: { q: number; r: number }[] = [];
  for (const c of pool) {
    const score = c.gain + rng() * 0.001;
    if (score > bestGain + 0.0005) {
      bestGain = score;
      candidates.length = 0;
      candidates.push({ q: c.q, r: c.r });
    } else if (Math.abs(score - bestGain) <= 0.0005) {
      candidates.push({ q: c.q, r: c.r });
    }
  }

  if (candidates.length === 0) return null;
  return candidates[Math.floor(rng() * candidates.length)]!;
}

/**
 * Wybiera docelowy heks — priorytet: chatka w widoku/zasięgu MP, potem max nowych czarnych.
 */
export function pickScoutExploreTarget(
  unit: RuntimeUnit,
  map: GameMap,
  explored: ReadonlySet<string>,
  occupied: ReadonlySet<string>,
  sight: number,
  rng: () => number,
): { q: number; r: number } | null {
  const villageTarget = pickKnownVillageTarget(unit, map, explored, occupied, sight);
  if (villageTarget) return villageTarget;

  return pickBestExploreStep(unit, map, explored, occupied, sight, rng);
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
