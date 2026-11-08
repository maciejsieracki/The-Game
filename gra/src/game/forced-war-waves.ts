import type { RuntimeUnit } from '../units/setup';
import { hexDistance, isCivilianUnit } from '../units/setup';
import {
  ARMY_CONCENTRATION_MIN_UNITS,
  ARMY_CONCENTRATION_RADIUS,
  clusterUnitsByProximity,
} from './army-concentration';

export interface ForcedWarWave {
  id: string;
  targetCityId: string;
  unitIds: readonly string[];
  originHex: { q: number; r: number };
  rallyPoint: { q: number; r: number };
  approachSector: number;
  createdTurn: number;
}

export interface ForcedWarWaveHistory {
  targetCityId: string;
  originHex: { q: number; r: number };
  rallyPoint: { q: number; r: number };
  approachSector: number;
  createdTurn: number;
}

export interface ForcedWarWaveState {
  nextWaveId: number;
  waves: ForcedWarWave[];
  history: ForcedWarWaveHistory[];
}

export interface ForcedWarWavePlan {
  targetCityId: string;
  unitIds: readonly string[];
  moveUnitIds: readonly string[];
  deferredUnitIds: readonly string[];
  originHex: { q: number; r: number };
  rallyPoint: { q: number; r: number };
  approachSector: number;
  createdTurn: number;
}

export interface ForcedWarWaveCity {
  id: string;
  ownerId: number;
  q: number;
  r: number;
}

const EMPTY_WAVE_STATE: ForcedWarWaveState = { nextWaveId: 1, waves: [], history: [] };

function compareUnit(a: RuntimeUnit, b: RuntimeUnit): number {
  return a.q - b.q || a.r - b.r || a.id.localeCompare(b.id);
}

function sectorDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 6;
  return Math.min(d, 6 - d);
}

function historyFromWave(wave: ForcedWarWave): ForcedWarWaveHistory {
  return {
    targetCityId: wave.targetCityId,
    originHex: { ...wave.originHex },
    rallyPoint: { ...wave.rallyPoint },
    approachSector: wave.approachSector,
    createdTurn: wave.createdTurn,
  };
}

/** Stable six-sector direction from a target city toward a wave origin. */
export function approachSectorForHex(
  target: { q: number; r: number },
  origin: { q: number; r: number },
): number {
  if (target.q === origin.q && target.r === origin.r) return 0;
  const angle = Math.atan2(origin.r - target.r, origin.q - target.q);
  return ((Math.round((angle / (Math.PI * 2)) * 6) % 6) + 6) % 6;
}

function eligibleWaveUnit(unit: RuntimeUnit, excludedUnitIds: ReadonlySet<string>): boolean {
  return !excludedUnitIds.has(unit.id)
    && unit.ruchLeft > 0
    && !isCivilianUnit(unit)
    && unit.inGarnizon !== true
    && unit.oblegaCityId === undefined
    && unit.embarked !== true
    && unit.seaRaider !== true
    && unit.category !== 'galera';
}

function targetForAnchor(
  anchor: RuntimeUnit,
  cities: readonly ForcedWarWaveCity[],
  excludedTargetIds: ReadonlySet<string>,
  hexDistanceFn: (a: { q: number; r: number }, b: { q: number; r: number }) => number,
  priorWaves: readonly ForcedWarWaveHistory[],
): { city: ForcedWarWaveCity; sector: number; targetDifferent: number; sectorDifferent: number; sectorGap: number } | null {
  const preferred = cities.filter(c => !excludedTargetIds.has(c.id));
  const candidates = preferred.length > 0 ? preferred : cities;
  if (candidates.length === 0) return null;
  const city = [...candidates].sort((a, b) =>
    hexDistanceFn(anchor, a) - hexDistanceFn(anchor, b)
      || a.q - b.q || a.r - b.r || a.id.localeCompare(b.id),
  )[0]!;
  const sector = approachSectorForHex(city, anchor);
  const previousSectors = priorWaves.map(w => w.approachSector);
  const sectorGap = previousSectors.length === 0
    ? 0
    : Math.min(...previousSectors.map(s => sectorDistance(sector, s)));
  return {
    city,
    sector,
    targetDifferent: excludedTargetIds.has(city.id) ? 0 : 1,
    sectorDifferent: previousSectors.includes(sector) ? 0 : 1,
    sectorGap,
  };
}

/**
 * Select a fresh wave from free units. With active waves, target and approach
 * sector are ranked ahead of group size so a later wave cannot simply repeat
 * the prior route. With no active wave, the deterministic first-wave behavior
 * is the same largest-local-cluster policy used by army concentration.
 */
export function planForcedWarWave(
  units: readonly RuntimeUnit[],
  targetCities: readonly ForcedWarWaveCity[],
  activeWaves: readonly ForcedWarWave[],
  excludedUnitIds: ReadonlySet<string> = new Set<string>(),
  hexDistanceFn: (a: { q: number; r: number }, b: { q: number; r: number }) => number = (a, b) => hexDistance(a.q, a.r, b.q, b.r),
  createdTurn = 0,
  waveHistory: readonly ForcedWarWaveHistory[] = [],
): ForcedWarWavePlan | null {
  const eligible = units.filter(u => eligibleWaveUnit(u, excludedUnitIds)).sort(compareUnit);
  if (eligible.length < ARMY_CONCENTRATION_MIN_UNITS) return null;
  // Keep every historical target less preferred, while the fallback below still
  // permits a single-city war to continue after that city was already targeted.
  const excludedTargetIds = new Set([
    ...activeWaves.map(w => w.targetCityId),
    ...waveHistory.map(w => w.targetCityId),
  ]);
  const candidates: Array<{
    anchor: RuntimeUnit;
    group: RuntimeUnit[];
    sum: number;
    target: ForcedWarWaveCity;
    sector: number;
    targetDifferent: number;
    sectorDifferent: number;
    sectorGap: number;
  }> = [];
  for (const anchor of eligible) {
    const group = eligible.filter(u => hexDistance(u.q, u.r, anchor.q, anchor.r) <= ARMY_CONCENTRATION_RADIUS);
    if (group.length < ARMY_CONCENTRATION_MIN_UNITS) continue;
    const chosen = targetForAnchor(anchor, targetCities, excludedTargetIds, hexDistanceFn, [
      ...activeWaves,
      ...waveHistory,
    ]);
    if (chosen === null) continue;
    candidates.push({
      anchor,
      group,
      sum: group.reduce((n, u) => n + hexDistance(u.q, u.r, anchor.q, anchor.r), 0),
      target: chosen.city,
      sector: chosen.sector,
      targetDifferent: chosen.targetDifferent,
      sectorDifferent: chosen.sectorDifferent,
      sectorGap: chosen.sectorGap,
    });
  }
  if (candidates.length === 0) return null;
  const best = [...candidates].sort((a, b) => {
    if (activeWaves.length > 0 || waveHistory.length > 0) {
      return b.targetDifferent - a.targetDifferent
        || b.sectorDifferent - a.sectorDifferent
        || b.sectorGap - a.sectorGap
        || b.group.length - a.group.length
        || a.sum - b.sum
        || a.anchor.q - b.anchor.q || a.anchor.r - b.anchor.r || a.anchor.id.localeCompare(b.anchor.id);
    }
    return b.group.length - a.group.length
      || a.sum - b.sum
      || a.anchor.q - b.anchor.q || a.anchor.r - b.anchor.r || a.anchor.id.localeCompare(b.anchor.id);
  })[0]!;
  const unitIds = best.group.map(u => u.id);
  return {
    targetCityId: best.target.id,
    unitIds,
    moveUnitIds: best.group.filter(u => u.id !== best.anchor.id).map(u => u.id),
    deferredUnitIds: unitIds,
    originHex: { q: best.anchor.q, r: best.anchor.r },
    rallyPoint: { q: best.anchor.q, r: best.anchor.r },
    approachSector: best.sector,
    createdTurn,
  };
}

/** Remove captured, dead, and fully engaged waves before the next AI turn. */
export function pruneForcedWarWaves(
  state: ForcedWarWaveState | undefined,
  attackerId: number,
  targetOwnerId: number,
  units: readonly RuntimeUnit[],
  cities: readonly ForcedWarWaveCity[],
): ForcedWarWaveState | undefined {
  if (state === undefined) return undefined;
  const kept: ForcedWarWave[] = [];
  const history = [...(state.history ?? [])];
  for (const wave of state.waves) {
    const city = cities.find(c => c.id === wave.targetCityId);
    if (city === undefined || city.ownerId !== targetOwnerId) {
      history.push(historyFromWave(wave));
      continue;
    }
    const live = wave.unitIds
      .map(id => units.find(u => u.id === id && u.ownerId === attackerId))
      .filter((u): u is RuntimeUnit => u !== undefined);
    if (live.length === 0) {
      history.push(historyFromWave(wave));
      continue;
    }
    const fullyEngaged = live.every(u => u.oblegaCityId === wave.targetCityId
      || hexDistance(u.q, u.r, city.q, city.r) <= 1);
    if (fullyEngaged) {
      history.push(historyFromWave(wave));
      continue;
    }
    kept.push({ ...wave, unitIds: live.map(u => u.id) });
  }
  return kept.length === 0 && history.length === 0
    ? undefined
    : { nextWaveId: Math.max(1, state.nextWaveId), waves: kept, history };
}

export function serializeForcedWarWaves(
  states: ReadonlyMap<string, ForcedWarWaveState>,
): Array<[string, ForcedWarWaveState]> {
  return Array.from(states.entries(), ([key, state]) => [key, {
    nextWaveId: state.nextWaveId,
    waves: state.waves.map(w => ({ ...w, unitIds: [...w.unitIds], originHex: { ...w.originHex }, rallyPoint: { ...w.rallyPoint } })),
    history: (state.history ?? []).map(w => ({ ...w, originHex: { ...w.originHex }, rallyPoint: { ...w.rallyPoint } })),
  }] as [string, ForcedWarWaveState]);
}

export function restoreForcedWarWaves(
  saved: unknown,
): Map<string, ForcedWarWaveState> {
  const out = new Map<string, ForcedWarWaveState>();
  if (!Array.isArray(saved)) return out;
  for (const row of saved) {
    if (!Array.isArray(row) || typeof row[0] !== 'string' || !row[1] || typeof row[1] !== 'object') continue;
    const raw = row[1] as Partial<ForcedWarWaveState>;
    if (!Array.isArray(raw.waves)) continue;
    const waves = raw.waves.filter(w => w && typeof w === 'object' && typeof w.id === 'string'
      && typeof w.targetCityId === 'string' && Array.isArray(w.unitIds)
      && w.originHex && w.rallyPoint && Number.isFinite(w.approachSector))
      .map(w => ({
        ...(w as ForcedWarWave),
        unitIds: [...w.unitIds],
        originHex: { ...w.originHex },
        rallyPoint: { ...w.rallyPoint },
      }));
    const history = Array.isArray(raw.history)
      ? raw.history.filter(w => w && typeof w === 'object'
        && typeof w.targetCityId === 'string'
        && w.originHex && w.rallyPoint
        && Number.isFinite(w.approachSector))
        .map(w => ({
          targetCityId: w.targetCityId!,
          originHex: { ...w.originHex! },
          rallyPoint: { ...w.rallyPoint! },
          approachSector: w.approachSector!,
          createdTurn: Number.isFinite(w.createdTurn) ? w.createdTurn! : 0,
        }))
      : [];
    out.set(row[0], {
      nextWaveId: Number.isFinite(raw.nextWaveId) ? Math.max(1, raw.nextWaveId!) : waves.length + 1,
      waves,
      history,
    });
  }
  return out;
}

export function emptyForcedWarWaveState(): ForcedWarWaveState {
  return { nextWaveId: EMPTY_WAVE_STATE.nextWaveId, waves: [], history: [] };
}

export function hexDistanceForForcedWar(a: { q: number; r: number }, b: { q: number; r: number }): number {
  return hexDistance(a.q, a.r, b.q, b.r);
}
