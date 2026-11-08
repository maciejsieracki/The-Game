/** Owner-level commander title and battle morale/rout rules. */
export type ArmyLeaderTitle = 'Wódz' | 'Generał';

export interface ArmyLeaderCombatant {
  isArmyCommander?: boolean;
  morale: number;
  moraleMax: number;
  dead?: boolean;
  fadingOut?: boolean;
  routed?: boolean;
}

export function hasMilitaryAcademy(builtBuildingIds: Iterable<string>): boolean {
  for (const id of builtBuildingIds) if (id === 'akademia_wojskowa') return true;
  return false;
}

export function armyLeaderTitle(builtBuildingIds: Iterable<string>): ArmyLeaderTitle {
  return hasMilitaryAcademy(builtBuildingIds) ? 'Generał' : 'Wódz';
}

/** Morale bonus for every unit in an army with its world-map commander assigned. */
export function armyLeaderMoraleBonusFrac(
  commanderPresent: boolean,
  builtBuildingIds: Iterable<string>,
): number {
  if (!commanderPresent) return 0;
  return hasMilitaryAcademy(builtBuildingIds) ? 0.20 : 0.10;
}

/** Starting morale after the assigned leader's army-wide bonus. */
export function moraleWithArmyLeaderBonus(base: number, bonusFrac: number): number {
  if (!Number.isFinite(base) || base <= 0) return 0;
  const bonus = Number.isFinite(bonusFrac) ? Math.max(0, bonusFrac) : 0;
  return Math.ceil(base * (1 + bonus));
}

/** Army morale excludes its commander; if it has no non-commander unit, it has broken. */
export function armyMoraleRatioWithoutCommander(units: readonly ArmyLeaderCombatant[]): number {
  let current = 0;
  let starting = 0;
  let hasCommander = false;
  for (const unit of units) {
    if (unit.isArmyCommander) {
      hasCommander = true;
      continue;
    }
    starting += Math.max(0, unit.moraleMax);
    if (unit.dead || unit.fadingOut || unit.routed) continue;
    current += Math.max(0, unit.morale);
  }
  if (starting <= 0) return hasCommander ? 0 : 1;
  return current / starting;
}

/** Commanders withdraw when their non-commander army has reached the rout threshold. */
export function commandersToWithdrawAfterArmyBreak<T extends ArmyLeaderCombatant>(
  units: readonly T[],
  threshold: number,
): T[] {
  if (armyMoraleRatioWithoutCommander(units) >= threshold) return [];
  return units.filter(unit => unit.isArmyCommander && !unit.dead && !unit.fadingOut && !unit.routed);
}
