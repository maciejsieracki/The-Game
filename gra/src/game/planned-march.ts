/**
 * planned-march.ts — A3 zaplanowany marsz (pure logic).
 * Planowanie trasy, segmenty per tura, STOP przy przeszkodzie, walidacja save.
 */

import type { GameMap } from '../types/map';
import { computePath, pathCost, type RuntimeUnit } from '../units/setup';

/** Cel marszu jednostki (runtime + save). */
export interface PlannedMarchDest {
  destQ: number;
  destR: number;
}

/** Pole save A3-P0-2 (backward compat — jeden marsz). */
export interface AutoMarchSave {
  leaderId: string;
  destQ: number;
  destR: number;
}

/** Wiele marszy w save (SAVE_VERSION ≥ 2). */
export type PlannedMarchesSave = Record<string, PlannedMarchDest>;

export type MarchStopReason = 'obstacle' | 'no_path' | 'no_movement' | 'blocked_city';

export interface PathTurnStop {
  q: number;
  r: number;
  turn: number;
}

export interface PathTurnPlan {
  /** Pełna trasa od bieżącej pozycji (bez startu). */
  fullPath: { q: number; r: number }[];
  /** Hexy kończące kolejne tury ruchu (szacunek). */
  turnStops: PathTurnStop[];
  /** Pierwszy segment (w ramach movementBudget). */
  segmentPath: { q: number; r: number }[];
  segmentCost: number;
  reachable: boolean;
  stopReason?: MarchStopReason;
}

export interface ExecuteMarchResult {
  ok: boolean;
  movePath: { q: number; r: number }[];
  cost: number;
  arrived: boolean;
  stopReason?: MarchStopReason;
  stopDetail?: string;
}

/** Skróć ścieżkę do budżetu ruchu (koszt terenu). */
export function truncatePathToBudget(
  path: { q: number; r: number }[],
  budget: number,
  map: GameMap,
): { q: number; r: number }[] {
  if (budget <= 0 || path.length === 0) return [];
  const out: { q: number; r: number }[] = [];
  for (let i = 0; i < path.length; i++) {
    const sub = path.slice(0, i + 1);
    const c = pathCost(sub, map);
    if (c > budget) break;
    out.push(path[i]!);
  }
  return out;
}

/** Markery końca każdej tury wzdłuż trasy (perTurn = max ruch/turę). */
export function planPathTurns(
  unit: RuntimeUnit,
  destQ: number,
  destR: number,
  map: GameMap,
  occupied: Set<string>,
  perTurnMove: number,
  movementBudget?: number,
): PathTurnPlan {
  const empty: PathTurnPlan = {
    fullPath: [],
    turnStops: [],
    segmentPath: [],
    segmentCost: 0,
    reachable: false,
    stopReason: 'no_path',
  };

  if (unit.q === destQ && unit.r === destR) {
    return { ...empty, reachable: true, stopReason: undefined };
  }

  const path = computePath(unit, map, destQ, destR, occupied);
  if (path.length === 0) return empty;

  const perTurn = Math.max(1, perTurnMove);
  const turnStops: PathTurnStop[] = [];
  let turnAcc = 0;
  let turnNum = 1;

  for (let i = 0; i < path.length; i++) {
    const stepCost = pathCost(path.slice(0, i + 1), map)
      - (i > 0 ? pathCost(path.slice(0, i), map) : 0);
    if (turnAcc + stepCost > perTurn) {
      if (i > 0) {
        const prev = path[i - 1]!;
        if (turnStops.length === 0 || turnStops[turnStops.length - 1]!.q !== prev.q
            || turnStops[turnStops.length - 1]!.r !== prev.r) {
          turnStops.push({ q: prev.q, r: prev.r, turn: turnNum });
        }
      }
      turnNum++;
      turnAcc = stepCost;
    } else {
      turnAcc += stepCost;
    }
  }

  const last = path[path.length - 1]!;
  const lastStop = turnStops[turnStops.length - 1];
  if (!lastStop || lastStop.q !== last.q || lastStop.r !== last.r) {
    turnStops.push({ q: last.q, r: last.r, turn: turnNum });
  }

  const budget = movementBudget ?? perTurn;
  const segmentPath = truncatePathToBudget(path, budget, map);
  const segmentCost = segmentPath.length > 0 ? pathCost(segmentPath, map) : 0;

  return {
    fullPath: path,
    turnStops,
    segmentPath,
    segmentCost,
    reachable: true,
  };
}

/** Czy po segmencie należy się zatrzymać (przeszkoda / brak drogi). */
export function shouldStopAtObstacle(
  unit: RuntimeUnit,
  dest: PlannedMarchDest,
  map: GameMap,
  occupied: Set<string>,
  segmentPath: { q: number; r: number }[],
  movementBudget: number,
): { stop: boolean; reason?: MarchStopReason; detail?: string } {
  if (movementBudget <= 0) {
    return { stop: true, reason: 'no_movement', detail: 'brak punktów ruchu' };
  }

  const path = computePath(unit, map, dest.destQ, dest.destR, occupied);
  if (path.length === 0) {
    return { stop: true, reason: 'no_path', detail: 'brak trasy do celu' };
  }

  const arrived = segmentPath.length > 0
    && segmentPath[segmentPath.length - 1]!.q === dest.destQ
    && segmentPath[segmentPath.length - 1]!.r === dest.destR;
  if (arrived) return { stop: false };

  const truncated = truncatePathToBudget(path, movementBudget, map);
  if (truncated.length === 0) {
    return { stop: true, reason: 'no_movement', detail: 'brak punktów ruchu' };
  }

  const segEnd = truncated[truncated.length - 1]!;
  const segEndIdx = path.findIndex(h => h.q === segEnd.q && h.r === segEnd.r);
  if (segEndIdx >= 0 && segEndIdx < path.length - 1) {
    const next = path[segEndIdx + 1]!;
    const nextKey = `${next.q},${next.r}`;
    if (occupied.has(nextKey)) {
      return { stop: true, reason: 'obstacle', detail: 'zablokowany heks na trasie' };
    }
  }

  const fullCost = pathCost(path, map);
  const segCost = pathCost(truncated, map);
  if (segCost < movementBudget && segEnd.q !== dest.destQ && segEnd.r !== dest.destR
      && truncated.length === path.length && fullCost <= movementBudget) {
    return { stop: false };
  }

  if (truncated.length < path.length && segCost >= movementBudget) {
    return { stop: false };
  }

  if (truncated.length < path.length) {
    const nextIdx = truncated.length;
    if (nextIdx < path.length) {
      const next = path[nextIdx]!;
      if (occupied.has(`${next.q},${next.r}`)) {
        return { stop: true, reason: 'obstacle', detail: 'zablokowany heks na trasie' };
      }
    }
  }

  return { stop: false };
}

/** Jeden segment marszu (bez animacji — tylko wynik geometryczny). */
export function executeMarchStep(
  unit: RuntimeUnit,
  dest: PlannedMarchDest,
  map: GameMap,
  occupied: Set<string>,
  movementBudget: number,
  canOccupyHex: (q: number, r: number) => boolean,
  perTurnMove: number,
): ExecuteMarchResult {
  const plan = planPathTurns(unit, dest.destQ, dest.destR, map, occupied, perTurnMove, movementBudget);
  if (!plan.reachable || plan.fullPath.length === 0) {
    return {
      ok: false,
      movePath: [],
      cost: 0,
      arrived: false,
      stopReason: 'no_path',
      stopDetail: 'brak trasy do celu',
    };
  }

  if (movementBudget <= 0) {
    return {
      ok: false,
      movePath: [],
      cost: 0,
      arrived: false,
      stopReason: 'no_movement',
      stopDetail: 'brak punktów ruchu',
    };
  }

  const movePath = plan.segmentPath;
  if (movePath.length === 0) {
    return {
      ok: false,
      movePath: [],
      cost: 0,
      arrived: false,
      stopReason: 'no_movement',
      stopDetail: 'brak punktów ruchu',
    };
  }

  const last = movePath[movePath.length - 1]!;
  if (!canOccupyHex(last.q, last.r)) {
    return {
      ok: false,
      movePath: [],
      cost: 0,
      arrived: false,
      stopReason: 'blocked_city',
      stopDetail: 'obce miasto na trasie',
    };
  }

  const arrived = last.q === dest.destQ && last.r === dest.destR;
  const obstacle = shouldStopAtObstacle(unit, dest, map, occupied, movePath, movementBudget);

  return {
    ok: true,
    movePath,
    cost: plan.segmentCost,
    arrived,
    stopReason: obstacle.stop && !arrived ? obstacle.reason : undefined,
    stopDetail: obstacle.detail,
  };
}

/** Walidacja pojedynczego marszu z save. */
export function validateAutoMarchFromSave(
  saved: AutoMarchSave | undefined | null,
  units: RuntimeUnit[],
  playerOwnerId = 0,
): AutoMarchSave | null {
  if (!saved || typeof saved.leaderId !== 'string') return null;
  const u = units.find(x => x.id === saved.leaderId);
  if (!u || u.ownerId !== playerOwnerId) return null;
  if (u.q === saved.destQ && u.r === saved.destR) return null;
  if (!Number.isFinite(saved.destQ) || !Number.isFinite(saved.destR)) return null;
  return saved;
}

/** Mapa marszy z save (plannedMarches lub legacy autoMarch). */
export function plannedMarchesFromSave(
  saved: AutoMarchSave | undefined | null,
  plannedMarches: PlannedMarchesSave | undefined | null,
  units: RuntimeUnit[],
  playerOwnerId = 0,
): Map<string, PlannedMarchDest> {
  const out = new Map<string, PlannedMarchDest>();
  if (plannedMarches && typeof plannedMarches === 'object') {
    for (const [uid, dest] of Object.entries(plannedMarches)) {
      if (!dest || !Number.isFinite(dest.destQ) || !Number.isFinite(dest.destR)) continue;
      const u = units.find(x => x.id === uid);
      if (!u || u.ownerId !== playerOwnerId) continue;
      if (u.q === dest.destQ && u.r === dest.destR) continue;
      out.set(uid, { destQ: dest.destQ, destR: dest.destR });
    }
  }
  const legacy = validateAutoMarchFromSave(saved, units, playerOwnerId);
  if (legacy && !out.has(legacy.leaderId)) {
    out.set(legacy.leaderId, { destQ: legacy.destQ, destR: legacy.destR });
  }
  return out;
}

/** Serializacja mapy marszy do save. */
export function plannedMarchesToSave(
  marches: Map<string, PlannedMarchDest>,
): { autoMarch?: AutoMarchSave; plannedMarches?: PlannedMarchesSave } {
  if (marches.size === 0) return {};
  const plannedMarches: PlannedMarchesSave = {};
  let first: AutoMarchSave | undefined;
  for (const [unitId, dest] of marches) {
    plannedMarches[unitId] = { destQ: dest.destQ, destR: dest.destR };
    if (!first) first = { leaderId: unitId, destQ: dest.destQ, destR: dest.destR };
  }
  return { autoMarch: first, plannedMarches };
}
