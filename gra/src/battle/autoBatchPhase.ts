/**
 * Deterministic planning/arbitration primitives for one automatic battle phase.
 *
 * BattleScene owns cloning, animation, combat damage, and routs. This module
 * freezes phase-start occupancy and target IDs so a concurrent animation wave
 * cannot make a later unit depend on an earlier live mutation.
 */

export type AutoBatchPhase = 'atk' | 'def';
export type AutoBatchIntentKind = 'hold' | 'move' | 'attack';

export interface AutoBatchStep {
  col: number;
  row: number;
}

export interface AutoBatchUnitSnapshot {
  id: string;
  side: AutoBatchPhase;
  q: number;
  r: number;
  dead?: boolean;
  fadingOut?: boolean;
  routed?: boolean;
  removed?: boolean;
  acted?: boolean;
  /** Invalid/empty HP is outside the live phase roster even if flags lag. */
  hp?: number;
  /** False only for a unit already outside occupancy bookkeeping. */
  occupies?: boolean;
}

export interface AutoBatchIntent {
  unitId: string;
  side: AutoBatchPhase;
  kind: AutoBatchIntentKind;
  steps: AutoBatchStep[];
  targetId?: string;
}

export interface AutoBatchResolution extends AutoBatchIntent {
  /** At least one requested step or the requested target was rejected. */
  blocked: boolean;
}

function cellKey(col: number, row: number): string {
  return col + ',' + row;
}

function copySteps(steps: readonly AutoBatchStep[]): AutoBatchStep[] {
  return steps.map(step => ({ col: step.col, row: step.row }));
}

/**
 * Resolve one side's deterministic AUTO phase.
 *
 * Every intent is evaluated against the same phase-start occupancy map. A tile
 * occupied at phase start remains a hard barrier even when its occupant also
 * intends to move; this prevents path crossing and makes conflicts independent
 * of animation timing. Multiple intents for a newly free tile are resolved in
 * stable roster order. Attack targets are IDs from the same snapshot, never a
 * live lookup performed after another unit in the wave has mutated state.
 */
export function resolveAutoBatchPhase(
  phase: AutoBatchPhase,
  units: readonly AutoBatchUnitSnapshot[],
  intents: readonly AutoBatchIntent[],
): AutoBatchResolution[] {
  const live = new Map<string, AutoBatchUnitSnapshot>();
  const reserved = new Map<string, string>();

  for (const unit of units) {
    if (unit.dead || unit.fadingOut || unit.removed || unit.routed
      || (unit.hp !== undefined && (!Number.isFinite(unit.hp) || unit.hp <= 0))) continue;
    live.set(unit.id, unit);
    if (unit.occupies !== false) reserved.set(cellKey(unit.q, unit.r), unit.id);
  }

  const intentById = new Map<string, AutoBatchIntent>();
  for (const intent of intents) {
    if (intent.side === phase) intentById.set(intent.unitId, intent);
  }

  const acceptSteps = (
    unit: AutoBatchUnitSnapshot,
    steps: readonly AutoBatchStep[],
  ): { steps: AutoBatchStep[]; blocked: boolean } => {
    let col = unit.q;
    let row = unit.r;
    const accepted: AutoBatchStep[] = [];

    for (const step of steps) {
      // Planners should only produce orthogonal steps. Treat malformed external
      // input as blocked instead of allowing a teleport through the barrier.
      if (Math.abs(step.col - col) + Math.abs(step.row - row) !== 1) {
        return { steps: accepted, blocked: true };
      }
      const nextKey = cellKey(step.col, step.row);
      const occupant = reserved.get(nextKey);
      if (occupant !== undefined && occupant !== unit.id) {
        return { steps: accepted, blocked: true };
      }
      // Keep every accepted destination reserved until the whole phase ends.
      // The animation wave starts together, so another path cannot claim a tile
      // that this path has already traversed.
      reserved.set(nextKey, unit.id);
      col = step.col;
      row = step.row;
      accepted.push({ col, row });
    }
    return { steps: accepted, blocked: false };
  };

  const resolutions: AutoBatchResolution[] = [];
  for (const unit of units) {
    if (
      unit.side !== phase
      || unit.acted
      || unit.dead
      || unit.fadingOut
      || unit.routed
      || unit.removed
      || (unit.hp !== undefined && (!Number.isFinite(unit.hp) || unit.hp <= 0))
      || !live.has(unit.id)
    ) continue;

    const fallback: AutoBatchIntent = {
      unitId: unit.id,
      side: phase,
      kind: 'hold',
      steps: [],
    };
    const intent = intentById.get(unit.id) ?? fallback;

    if (intent.kind === 'attack') {
      const target = intent.targetId ? live.get(intent.targetId) : undefined;
      const targetAvailable = Boolean(
        target
        && target.side !== phase
        && !target.routed,
      );
      if (!targetAvailable) {
        resolutions.push({
          ...intent,
          targetId: undefined,
          kind: 'hold',
          steps: [],
          blocked: true,
        });
        continue;
      }

      const path = acceptSteps(unit, intent.steps);
      if (path.blocked) {
        resolutions.push({
          ...intent,
          targetId: undefined,
          kind: path.steps.length > 0 ? 'move' : 'hold',
          steps: path.steps,
          blocked: true,
        });
        continue;
      }
      resolutions.push({
        ...intent,
        steps: path.steps,
        blocked: false,
      });
      continue;
    }

    if (intent.kind !== 'move' || intent.steps.length === 0) {
      resolutions.push({
        ...intent,
        steps: copySteps(intent.steps),
        blocked: false,
      });
      continue;
    }

    const path = acceptSteps(unit, intent.steps);
    resolutions.push({
      ...intent,
      steps: path.steps,
      blocked: path.blocked,
    });
  }

  return resolutions;
}
