/**
 * Owner-agnostic concentration gate for active field armies.
 *
 * This module only chooses a real rally hex and the units that must wait for
 * the physical stack. Movement itself remains the caller's existing
 * pathfinding/executor path; no position or power is mutated here.
 */

import type { RuntimeUnit } from '../units/setup';
import { hexDistance, isCivilianUnit } from '../units/setup';

export const ARMY_CONCENTRATION_MIN_UNITS = 3;
export const ARMY_CONCENTRATION_RADIUS = 4;

export interface ArmyConcentrationPlan {
  ownerId: number;
  rallyPoint: { q: number; r: number };
  unitIds: readonly string[];
  moveUnitIds: readonly string[];
  deferredUnitIds: readonly string[];
}

export interface ArmyConcentrationOptions {
  excludedUnitIds?: ReadonlySet<string>;
}

/**
 * Front separation radius (R-AI-KONCENTRACJA-ARMII-WIELE-KLASTROW-Q1, GOAL pkt 1).
 * Reused, not new: this is the SAME distance `ARMY_CONCENTRATION_RADIUS` already
 * uses to decide "these units count as one army" on the owner's side. Applying it
 * symmetrically to enemy positions keeps the definition consistent — an enemy
 * grouping our own mechanism would treat as one army is, by the same rule, one
 * front — instead of inventing a second, unrelated threshold.
 */
export const ARMY_FRONT_SEPARATION_RADIUS = ARMY_CONCENTRATION_RADIUS;

type ConcentrationUnit = RuntimeUnit & { seaRaider?: boolean };

interface ProximityUnit {
  id: string;
  q: number;
  r: number;
}

function compareProximity(a: ProximityUnit, b: ProximityUnit): number {
  return a.q - b.q || a.r - b.r || a.id.localeCompare(b.id);
}

/**
 * Partition `items` into connected components under the "within `radius`"
 * relation (single-linkage / BFS over hex distance). Deterministic: seed order
 * and traversal are stable-sorted by (q, r, id), and each returned group is
 * sorted the same way. Owner-agnostic and side-agnostic — used both for the
 * AI's own unit clusters and for grouping enemy units into threat fronts.
 */
export function clusterUnitsByProximity<T extends ProximityUnit>(
  items: readonly T[],
  radius: number,
): T[][] {
  const sorted = [...items].sort(compareProximity);
  const n = sorted.length;
  const visited = new Array<boolean>(n).fill(false);
  const clusters: T[][] = [];
  for (let i = 0; i < n; i++) {
    if (visited[i] === true) continue;
    const group: T[] = [];
    const queue: number[] = [i];
    visited[i] = true;
    while (queue.length > 0) {
      const idx = queue.shift();
      if (idx === undefined) break;
      const current = sorted[idx];
      if (current === undefined) continue;
      group.push(current);
      for (let j = 0; j < n; j++) {
        if (visited[j] === true) continue;
        const candidate = sorted[j];
        if (candidate === undefined) continue;
        if (hexDistance(current.q, current.r, candidate.q, candidate.r) <= radius) {
          visited[j] = true;
          queue.push(j);
        }
      }
    }
    group.sort(compareProximity);
    clusters.push(group);
  }
  return clusters;
}

/** Contract predicate for an active land combat unit. */
export function isEligibleForArmyConcentration(
  unit: ConcentrationUnit,
  ownerId?: number,
): boolean {
  if (ownerId !== undefined && unit.ownerId !== ownerId) return false;
  if (unit.ruchLeft <= 0) return false;
  if (isCivilianUnit(unit)) return false;
  if (unit.inGarnizon === true) return false;
  if (unit.oblegaCityId !== undefined) return false;
  if (unit.embarked === true || unit.seaRaider === true) return false;
  // Naval units are combat units but not land units. A land unit on water is
  // already excluded above by `embarked`; category is the canonical runtime
  // discriminator for a native naval unit.
  if (unit.category === 'galera') return false;
  return true;
}

function compareUnits(a: ConcentrationUnit, b: ConcentrationUnit): number {
  return a.q - b.q || a.r - b.r || a.id.localeCompare(b.id);
}

/**
 * Select one deterministic local army and its physical rally point.
 *
 * A candidate is the current hex of one eligible unit. The winning candidate
 * maximizes the number of eligible units in radius 4, then minimizes the
 * distance sum, then uses q/r/id as stable tie-breakers. The point is always
 * an occupied real hex, so the caller can move units there with normal
 * pathfinding and obtain a real same-hex roster.
 */
export function planArmyConcentration(
  ownerId: number,
  units: readonly ConcentrationUnit[],
  options: ArmyConcentrationOptions = {},
): ArmyConcentrationPlan | null {
  const eligible = units
    .filter(u => !options.excludedUnitIds?.has(u.id))
    .filter(u => isEligibleForArmyConcentration(u, ownerId))
    .sort(compareUnits);
  if (eligible.length < ARMY_CONCENTRATION_MIN_UNITS) return null;

  let best: { anchor: ConcentrationUnit; group: ConcentrationUnit[]; sum: number } | null = null;
  for (const anchor of eligible) {
    const group = eligible.filter(u =>
      hexDistance(anchor.q, anchor.r, u.q, u.r) <= ARMY_CONCENTRATION_RADIUS,
    );
    if (group.length < ARMY_CONCENTRATION_MIN_UNITS) continue;
    const sum = group.reduce(
      (total, u) => total + hexDistance(anchor.q, anchor.r, u.q, u.r),
      0,
    );
    if (
      best === null
      || group.length > best.group.length
      || (group.length === best.group.length && sum < best.sum)
      || (group.length === best.group.length && sum === best.sum && compareUnits(anchor, best.anchor) < 0)
    ) {
      best = { anchor, group, sum };
    }
  }
  if (best === null) return null;

  const unitIds = best.group.map(u => u.id);
  const gathered = best.group.every(u => u.q === best.anchor.q && u.r === best.anchor.r);
  return {
    ownerId,
    rallyPoint: { q: best.anchor.q, r: best.anchor.r },
    unitIds,
    moveUnitIds: gathered
      ? []
      : best.group.filter(u => u.id !== best.anchor.id).map(u => u.id),
    deferredUnitIds: gathered ? [] : unitIds,
  };
}

function centroidOf(group: readonly ConcentrationUnit[]): { q: number; r: number } {
  const q = group.reduce((sum, u) => sum + u.q, 0) / group.length;
  const r = group.reduce((sum, u) => sum + u.r, 0) / group.length;
  return { q: Math.round(q), r: Math.round(r) };
}

/** A stable, already-known concentration hub the caller wants merges to prefer —
 *  e.g. the roster `planArmyConcentration` already selected this same turn.
 *  It has weight (size) and a position, but no movable unit list of its own. */
export interface ArmyFrontAnchorHint {
  q: number;
  r: number;
  weight: number;
}

export interface ArmyFrontMergeOptions {
  /** Units to leave out entirely — home defenders, units already claimed by
   *  `planArmyConcentration` this turn, units already committed to combat. */
  excludedUnitIds?: ReadonlySet<string>;
  /** Docelowa liczba klastrów własnych jednostek (GOAL pkt 1 — liczba
   *  rozpoznanych frontów zagrożenia, co najmniej 1). */
  targetClusterCount: number;
  /** Already-known stable hubs (e.g. this turn's `planArmyConcentration` pick)
   *  that should count as candidate merge targets even though their units are
   *  not part of `units` passed here. */
  preferredAnchors?: readonly ArmyFrontAnchorHint[];
}

export interface ArmyFrontMergeOrder {
  unitId: string;
  towardQ: number;
  towardR: number;
}

export interface ArmyFrontMergePlan {
  ownerId: number;
  moveOrders: readonly ArmyFrontMergeOrder[];
  deferredUnitIds: readonly string[];
}

interface FrontMergeEntry {
  q: number;
  r: number;
  weight: number;
  unitIds: readonly string[];
}

/**
 * When the AI has more separate unit clusters than the recognized number of
 * threat fronts warrants, march the smaller/excess clusters toward the
 * nearest bigger (or already-known preferred) cluster — the GOAL-pkt-2
 * counterpart to `planArmyConcentration`'s local, single-cluster gather.
 *
 * Clusters are the same connected-components grouping used for threat fronts
 * (`clusterUnitsByProximity`, radius `ARMY_CONCENTRATION_RADIUS`). The
 * `targetClusterCount` biggest clusters/anchors are kept as-is; every other
 * cluster's eligible units get one march order toward the nearest kept
 * anchor's position. Returns null when there is nothing to merge (already at
 * or below the target, or no eligible units at all).
 */
export function planArmyFrontMerge(
  ownerId: number,
  units: readonly ConcentrationUnit[],
  options: ArmyFrontMergeOptions,
): ArmyFrontMergePlan | null {
  const eligible = units
    .filter(u => !options.excludedUnitIds?.has(u.id))
    .filter(u => isEligibleForArmyConcentration(u, ownerId))
    .sort(compareUnits);

  const movableClusters = eligible.length > 0
    ? clusterUnitsByProximity(eligible, ARMY_CONCENTRATION_RADIUS)
    : [];

  const entries: FrontMergeEntry[] = movableClusters.map(group => {
    const c = centroidOf(group);
    return { q: c.q, r: c.r, weight: group.length, unitIds: group.map(u => u.id) };
  });
  for (const anchor of options.preferredAnchors ?? []) {
    entries.push({ q: anchor.q, r: anchor.r, weight: anchor.weight, unitIds: [] });
  }

  const target = Math.max(1, options.targetClusterCount);
  if (entries.length <= target) return null;

  const ranked = [...entries].sort((a, b) => b.weight - a.weight || a.q - b.q || a.r - b.r);
  const anchors = ranked.slice(0, target);
  const excess = ranked.slice(target).filter(e => e.unitIds.length > 0);
  if (excess.length === 0) return null;

  const firstAnchor = anchors[0];
  if (firstAnchor === undefined) return null; // unreachable: target >= 1 and anchors.length === target here

  const moveOrders: ArmyFrontMergeOrder[] = [];
  const deferredUnitIds: string[] = [];
  for (const ex of excess) {
    let bestAnchor = firstAnchor;
    let bestDist = hexDistance(ex.q, ex.r, firstAnchor.q, firstAnchor.r);
    for (const anchor of anchors) {
      const d = hexDistance(ex.q, ex.r, anchor.q, anchor.r);
      const better = d < bestDist
        || (d === bestDist && (anchor.q < bestAnchor.q
          || (anchor.q === bestAnchor.q && anchor.r < bestAnchor.r)));
      if (better) {
        bestDist = d;
        bestAnchor = anchor;
      }
    }
    for (const unitId of ex.unitIds) {
      moveOrders.push({ unitId, towardQ: bestAnchor.q, towardR: bestAnchor.r });
      deferredUnitIds.push(unitId);
    }
  }
  return { ownerId, moveOrders, deferredUnitIds };
}
