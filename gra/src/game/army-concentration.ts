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

type ConcentrationUnit = RuntimeUnit & { seaRaider?: boolean };

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
