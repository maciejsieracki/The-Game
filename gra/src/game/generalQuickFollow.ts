import { generalFollowDestination, nearestLivingGeneral, type GeneralFollowCandidate } from './generals';
import type { PlannedMarchDest } from './planned-march';

export type FollowCommanderTitle = 'Wódz' | 'Generał';
export function commanderTitleGenitive(title: FollowCommanderTitle): string {
  return title === 'Wódz' ? 'wodza' : 'generała';
}
export function generalQuickFollowActionLabel(title: FollowCommanderTitle, active = false): string {
  const genitive = commanderTitleGenitive(title);
  return active ? `Marsz do ${genitive}` : `Idź do najbliższego ${genitive}`;
}

export interface GeneralQuickFollowUnit extends GeneralFollowCandidate {
  inGarnizon?: boolean;
  oblegaCityId?: string;
  followGeneral?: boolean;
}

/** Start tracked orders for opt-in units once they are separated from their commander. */
export function planEnabledGeneralFollowMarches<T extends GeneralQuickFollowUnit>(
  roster: readonly T[],
  hasMarch: (unitId: string) => boolean,
  planMarch: (unit: T, point: { q: number; r: number }, targetId: string) => boolean,
): string[] {
  const planned: string[] = [];
  for (const unit of roster) {
    if (unit.followGeneral !== true || hasMarch(unit.id) || unit.isGeneral === true
        || unit.inGarnizon === true || unit.oblegaCityId) continue;
    const commander = nearestLivingGeneral(unit, roster);
    const follow = commander ? generalFollowDestination(unit, commander) : null;
    if (!follow || hexDistance(unit.q, unit.r, follow.point.q, follow.point.r) === 0) continue;
    if (planMarch(unit, follow.point, follow.generalTargetId)) planned.push(unit.id);
  }
  return planned;
}

export interface GeneralQuickFollowEffects<T extends GeneralQuickFollowUnit = GeneralQuickFollowUnit> {
  planMarch(unit: T, point: { q: number; r: number }, targetId: string): boolean;
  movementLeft(unit: T): number;
  enqueue(unitIds: string[]): void;
  notify(message: string, durationMs: number): void;
  refresh(): void;
}

export type GeneralQuickFollowResult = 'issued' | 'unavailable' | 'unreachable' | 'ineligible';

export interface TrackedFollowUnit extends GeneralQuickFollowUnit {
  typeId?: string;
  category?: string;
  ruch?: number;
  ruchLeft?: number;
}

export interface TrackedFollowPlanner<T extends TrackedFollowUnit> {
  playerOwnerId: number;
  canOccupy(unit: T, q: number, r: number): boolean;
  movementContext(unit: T): { mover: T; occupied: Set<string>; perTurn: number };
  pathPlan(mover: T, q: number, r: number, occupied: Set<string>, perTurn: number): { reachable: boolean; fullPath: readonly unknown[] };
  clearAutoExplore(unit: T): void;
  markPlayerMoved(unitId: string): void;
  marches: Map<string, PlannedMarchDest>;
  syncAttackTarget(unitId: string, destination: PlannedMarchDest): void;
}

/** Production storage/planning path for a tracked general-follow march. */
export function planTrackedGeneralFollowMarch<T extends TrackedFollowUnit>(
  unit: T,
  point: { q: number; r: number },
  generalTargetId: string | undefined,
  planner: TrackedFollowPlanner<T>,
  markAsPlayerIssued = true,
): boolean {
  if (unit.ownerId !== planner.playerOwnerId || unit.inGarnizon === true || unit.oblegaCityId) return false;
  if (!planner.canOccupy(unit, point.q, point.r)) return false;
  const { mover, occupied, perTurn } = planner.movementContext(unit);
  const destination: PlannedMarchDest = {
    destQ: point.q,
    destR: point.r,
    ...(generalTargetId ? { generalTargetId } : {}),
  };
  const path = planner.pathPlan(mover, point.q, point.r, occupied, perTurn);
  if (!path.reachable || path.fullPath.length === 0) return false;
  planner.clearAutoExplore(unit);
  if (markAsPlayerIssued) planner.markPlayerMoved(unit.id);
  planner.marches.set(unit.id, destination);
  planner.syncAttackTarget(unit.id, destination);
  return true;
}

export interface TrackedFollowPosition {
  id: string;
  ownerId: number;
  q: number;
  r: number;
  isGeneral?: boolean;
  hp?: number;
  dead?: boolean;
  removed?: boolean;
  routed?: boolean;
}

/** Move tracked destinations with their commander, or remove them when the target is lost. */
export function syncTrackedGeneralFollowMarches<T extends TrackedFollowPosition>(
  units: readonly T[],
  marches: Map<string, PlannedMarchDest>,
  clearAttackTarget: (unitId: string) => void,
): void {
  const byId = new Map(units.map(unit => [unit.id, unit]));
  for (const [unitId, destination] of [...marches]) {
    if (!destination.generalTargetId) continue;
    const follower = byId.get(unitId);
    const commander = byId.get(destination.generalTargetId);
    if (!follower || !commander || commander.isGeneral !== true || commander.dead === true
        || commander.removed === true || commander.routed === true || (commander.hp != null && commander.hp <= 0)
        || follower.ownerId !== commander.ownerId) {
      marches.delete(unitId);
      clearAttackTarget(unitId);
      continue;
    }
    if (follower.q === commander.q && follower.r === commander.r) {
      marches.delete(unitId);
      continue;
    }
    if (destination.destQ !== commander.q || destination.destR !== commander.r) {
      marches.set(unitId, { ...destination, destQ: commander.q, destR: commander.r });
    }
  }
}

function hexDistance(aq: number, ar: number, bq: number, br: number): number {
  const dq = aq - bq;
  const dr = ar - br;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

/** Execute the selected-unit action through injected production movement effects. */
export function issueGeneralQuickFollow<T extends GeneralQuickFollowUnit>(
  unit: T,
  roster: readonly T[],
  title: FollowCommanderTitle,
  effects: GeneralQuickFollowEffects<T>,
): GeneralQuickFollowResult {
  const genitive = commanderTitleGenitive(title);
  if (unit.isGeneral === true || unit.inGarnizon === true || unit.oblegaCityId) return 'ineligible';
  const commander = nearestLivingGeneral(unit, roster);
  const follow = commander ? generalFollowDestination(unit, commander) : null;
  if (!follow || hexDistance(unit.q, unit.r, follow.point.q, follow.point.r) === 0) {
    effects.notify(`Brak dostępnego ${genitive} do dołączenia.`, 2800);
    effects.refresh();
    return 'unavailable';
  }
  if (!effects.planMarch(unit, follow.point, follow.generalTargetId)) {
    effects.notify(`Nie można wyznaczyć trasy do ${genitive}.`, 3200);
    effects.refresh();
    return 'unreachable';
  }
  effects.notify(`Rozkaz marszu do najbliższego ${genitive} wydany — cel będzie śledził jego pozycję.`, 3200);
  effects.refresh();
  if (effects.movementLeft(unit) > 0) effects.enqueue([unit.id]);
  return 'issued';
}
