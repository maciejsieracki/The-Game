/**
 * rally-point.ts — owner-wide rally point state.
 *
 * A rally point is a saved destination, not an implicit movement order. The
 * caller explicitly launches currently existing stacks; units created later
 * are deliberately excluded until a later launch.
 */

import type { RuntimeUnit } from '../units/setup';
import { stackGroupIdOf } from './armyMerge';

export interface RallyPoint {
  q: number;
  r: number;
}

export type RallyPointsSave = Record<string, RallyPoint>;

/** Store one point per empire without sharing object references with callers. */
export function setRallyPoint(
  points: Map<number, RallyPoint>,
  ownerId: number,
  point: RallyPoint,
): void {
  if (!Number.isInteger(ownerId) || !Number.isFinite(point.q) || !Number.isFinite(point.r)) return;
  points.set(ownerId, { q: Math.trunc(point.q), r: Math.trunc(point.r) });
}

/** Remove an empire's point (used by the explicit UI clear action). */
export function clearRallyPoint(points: Map<number, RallyPoint>, ownerId: number): void {
  points.delete(ownerId);
}

/**
 * Return one representative per currently existing stack for an explicit
 * launch. A stack receives one planned march; the normal movement engine moves
 * the complete stack together. Garrisoned units are not world-map movers.
 */
export function rallyLaunchLeaderIds(
  units: readonly RuntimeUnit[],
  ownerId: number,
): string[] {
  const occupiedStacks = new Set<string>();
  const result: string[] = [];
  for (const unit of units) {
    if (unit.ownerId !== ownerId || unit.inGarnizon === true) continue;
    const stackKey = stackGroupIdOf(unit);
    if (occupiedStacks.has(stackKey)) continue;
    occupiedStacks.add(stackKey);
    result.push(unit.id);
  }
  return result;
}

/** JSON-safe serialization; empty state stays absent from the snapshot. */
export function rallyPointsToSave(
  points: ReadonlyMap<number, RallyPoint>,
): RallyPointsSave | undefined {
  if (points.size === 0) return undefined;
  const out: RallyPointsSave = {};
  for (const [ownerId, point] of points) {
    if (!Number.isInteger(ownerId) || !Number.isFinite(point.q) || !Number.isFinite(point.r)) continue;
    out[String(ownerId)] = { q: Math.trunc(point.q), r: Math.trunc(point.r) };
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Load only finite, integer-normalized points; malformed entries are ignored. */
export function rallyPointsFromSave(
  saved: RallyPointsSave | null | undefined,
): Map<number, RallyPoint> {
  const out = new Map<number, RallyPoint>();
  if (!saved || typeof saved !== 'object') return out;
  for (const [rawOwnerId, rawPoint] of Object.entries(saved)) {
    const ownerId = Number(rawOwnerId);
    if (!Number.isInteger(ownerId) || !rawPoint || typeof rawPoint !== 'object') continue;
    const point = rawPoint as Partial<RallyPoint>;
    const q = point.q;
    const r = point.r;
    if (typeof q !== 'number' || !Number.isFinite(q)
      || typeof r !== 'number' || !Number.isFinite(r)) continue;
    out.set(ownerId, { q: Math.trunc(q), r: Math.trunc(r) });
  }
  return out;
}
