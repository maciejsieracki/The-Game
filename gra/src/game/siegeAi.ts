/**
 * siegeAi.ts
 * Pure, deterministic AI siege stance logic (C3-Q2=custom).
 *
 * Maciej 2026-06-27:
 *   bardzo silna armia  -> szturm od razu (assault)
 *   srednia armia       -> oblezenie + machiny, szturm gdy gotowe (siege_build)
 *   slaba ale bezpieczna -> tylko glodzenie (siege_starve)
 *
 * Decoupled from main.ts / ai.ts — SILNIK calls decideAISiegeStance() at the map
 * siege decision point. Strength helpers reuse siege.ts garrison/militia/wall math.
 */

import {
  type SiegeCity,
  type SiegeParams,
  type SiegeUnit,
  applyCityBonus,
  cityDefenseBonus,
  effectiveGarrison,
} from './siege';
import combatParamsRaw from '../../data/combat-params.json';

const siegeAiCfg = combatParamsRaw.siege_ai as {
  t1_assault_ratio: number;
  t2_build_min_ratio: number;
  t3_starve_min_ratio: number;
  t2_max_wait_turns: number;
  units_per_extra_machine: number;
};

// ---------------------------------------------------------------------------
// Tunable thresholds (C3-Q2; override via SiegeAiParams; defaults z Panel-C)
// ---------------------------------------------------------------------------

/** T1: army/defender ratio >= this -> immediate assault. Default 180%. */
export const SIEGE_AI_T1_ASSAULT_RATIO = siegeAiCfg.t1_assault_ratio;

/**
 * T2 lower bound: ratio >= this AND < T1 -> siege_build (machines then assault).
 * Default 140% (band between T3 and T1).
 */
export const SIEGE_AI_T2_BUILD_MIN_RATIO = siegeAiCfg.t2_build_min_ratio;

/** T3: ratio >= this AND < T2 min -> siege_starve only. Default 110%. */
export const SIEGE_AI_T3_STARVE_MIN_RATIO = siegeAiCfg.t3_starve_min_ratio;

/** T2: assault anyway after this many siege turns without machines. */
export const SIEGE_AI_T2_MAX_WAIT_TURNS = siegeAiCfg.t2_max_wait_turns;

/** C3-Q8=C: +1 extra machine slot per this many army units (engine-side build). */
export const SIEGE_AI_UNITS_PER_EXTRA_MACHINE = siegeAiCfg.units_per_extra_machine;

export interface SiegeAiParams {
  t1AssaultRatio?: number;
  t2BuildMinRatio?: number;
  t3StarveMinRatio?: number;
  t2MaxWaitTurns?: number;
  unitsPerExtraMachine?: number;
  siegeParams?: SiegeParams;
}

export const DEFAULT_SIEGE_AI_PARAMS: Readonly<Required<Omit<SiegeAiParams, 'siegeParams'>>> = {
  t1AssaultRatio: SIEGE_AI_T1_ASSAULT_RATIO,
  t2BuildMinRatio: SIEGE_AI_T2_BUILD_MIN_RATIO,
  t3StarveMinRatio: SIEGE_AI_T3_STARVE_MIN_RATIO,
  t2MaxWaitTurns: SIEGE_AI_T2_MAX_WAIT_TURNS,
  unitsPerExtraMachine: SIEGE_AI_UNITS_PER_EXTRA_MACHINE,
};

// ---------------------------------------------------------------------------
// Strength estimation (pure; no RNG)
// ---------------------------------------------------------------------------

const DEFAULT_UNIT_HP_BASE = 30;

/**
 * Combat strength of a single unit snapshot.
 * Formula: (Atak + Obrona + 0.5*Pancerz) scaled by current HP fraction.
 */
export function estimateUnitCombatStrength(
  unit: SiegeUnit,
  hpBase: number = DEFAULT_UNIT_HP_BASE,
): number {
  if (unit.Health <= 0) return 0;
  const hpScale = Math.max(0.1, unit.Health / Math.max(1, hpBase));
  const wd = unit.weaponDamage ?? unit.Atak;
  return (unit.Atak + unit.Obrona + unit.Pancerz * 0.5 + wd * 0.5 + unit.Uderzenie * 0.25) * hpScale;
}

/** Sum strength of an attacking army (alive units only). */
export function estimateArmyStrength(units: ReadonlyArray<SiegeUnit>): number {
  let total = 0;
  for (const u of units) {
    if (u.Health > 0) total += estimateUnitCombatStrength(u);
  }
  return total;
}

/**
 * Defender strength: garrison (or militia fallback) with wall/terrain bonuses folded in.
 */
export function estimateDefenderStrength(
  city: SiegeCity,
  params: SiegeParams = {},
): number {
  const bonus = cityDefenseBonus(city, params);
  const garrison = effectiveGarrison(city);
  let total = 0;
  for (const raw of garrison) {
    const boosted = applyCityBonus(raw, bonus);
    total += estimateUnitCombatStrength(boosted);
  }
  return total;
}

/** Army/defender ratio used for tier selection. */
export function siegeStrengthRatio(
  army: ReadonlyArray<SiegeUnit>,
  city: SiegeCity,
  params: SiegeParams = {},
): number {
  const eps = 0.001;
  return estimateArmyStrength(army) / Math.max(estimateDefenderStrength(city, params), eps);
}

// ---------------------------------------------------------------------------
// Siege AI state + decision
// ---------------------------------------------------------------------------

export type AISiegeStance = 'assault' | 'siege_build' | 'siege_starve' | 'retreat';

export type AISiegeTier = 'T1' | 'T2' | 'T3' | 'unsafe';

/** Per-siege runtime state (SILNIK persists between turns). */
export interface SiegeAiState {
  /** Turns since siege started (0 = first decision / not yet besieging). */
  siegeTurn: number;
  /** Completed siege machines ready for assault (Taran/Wieza). */
  machinesReady: number;
}

export const EMPTY_SIEGE_AI_STATE: Readonly<SiegeAiState> = {
  siegeTurn: 0,
  machinesReady: 0,
};

export interface AISiegeDecision {
  stance: AISiegeStance;
  tier: AISiegeTier;
  /** armyStrength / defenderStrength */
  ratio: number;
  armyStrength: number;
  defenderStrength: number;
  /** C3-Q8=C hint for engine: base 1 + floor(armyCount / unitsPerExtraMachine). */
  machinesPerTurn: number;
  powod: string;
}

function resolveParams(p: SiegeAiParams = {}): Required<Omit<SiegeAiParams, 'siegeParams'>> & {
  siegeParams: SiegeParams;
} {
  return {
    t1AssaultRatio: p.t1AssaultRatio ?? DEFAULT_SIEGE_AI_PARAMS.t1AssaultRatio,
    t2BuildMinRatio: p.t2BuildMinRatio ?? DEFAULT_SIEGE_AI_PARAMS.t2BuildMinRatio,
    t3StarveMinRatio: p.t3StarveMinRatio ?? DEFAULT_SIEGE_AI_PARAMS.t3StarveMinRatio,
    t2MaxWaitTurns: p.t2MaxWaitTurns ?? DEFAULT_SIEGE_AI_PARAMS.t2MaxWaitTurns,
    unitsPerExtraMachine:
      p.unitsPerExtraMachine ?? DEFAULT_SIEGE_AI_PARAMS.unitsPerExtraMachine,
    siegeParams: p.siegeParams ?? {},
  };
}

function aliveCount(units: ReadonlyArray<SiegeUnit>): number {
  let n = 0;
  for (const u of units) if (u.Health > 0) n++;
  return n;
}

function machinesPerTurnFromArmy(armyCount: number, unitsPerExtra: number): number {
  return 1 + Math.floor(Math.max(0, armyCount) / Math.max(1, unitsPerExtra));
}

function classifyTier(
  ratio: number,
  cfg: Required<Omit<SiegeAiParams, 'siegeParams'>>,
): AISiegeTier {
  if (ratio >= cfg.t1AssaultRatio) return 'T1';
  if (ratio >= cfg.t2BuildMinRatio) return 'T2';
  if (ratio >= cfg.t3StarveMinRatio) return 'T3';
  return 'unsafe';
}

/**
 * Decide AI siege stance for an army adjacent to a walled enemy city.
 *
 * Initial contact (siegeTurn=0):
 *   T1 -> assault
 *   T2 -> siege_build (enter siege, queue machines)
 *   T3 -> siege_starve (blockade only; no preBattle)
 *   unsafe -> retreat
 *
 * Ongoing siege (siegeTurn>0):
 *   T1 -> assault
 *   T2 -> siege_build until machinesReady>=1 OR siegeTurn>=t2MaxWaitTurns, then assault
 *   T3 -> siege_starve always (never preBattle until starvation capture)
 *   unsafe -> retreat
 */
export function decideAISiegeStance(
  army: ReadonlyArray<SiegeUnit>,
  city: SiegeCity,
  state: SiegeAiState = EMPTY_SIEGE_AI_STATE,
  params: SiegeAiParams = {},
): AISiegeDecision {
  const cfg = resolveParams(params);
  const armyStr = estimateArmyStrength(army);
  const defStr = estimateDefenderStrength(city, cfg.siegeParams);
  const ratio = armyStr / Math.max(defStr, 0.001);
  const tier = classifyTier(ratio, cfg);
  const armyCount = aliveCount(army);
  const mpt = machinesPerTurnFromArmy(armyCount, cfg.unitsPerExtraMachine);

  const base = {
    ratio,
    armyStrength: armyStr,
    defenderStrength: defStr,
    machinesPerTurn: mpt,
  };

  if (tier === 'unsafe') {
    return {
      ...base,
      stance: 'retreat',
      tier,
      powod: `armia za slaba (${(ratio * 100).toFixed(0)}% < ${(cfg.t3StarveMinRatio * 100).toFixed(0)}%) — odwrot`,
    };
  }

  if (tier === 'T1') {
    return {
      ...base,
      stance: 'assault',
      tier,
      powod: `T1 przewaga ${(ratio * 100).toFixed(0)}% >= ${(cfg.t1AssaultRatio * 100).toFixed(0)}% — szturm natychmiast`,
    };
  }

  if (tier === 'T3') {
    return {
      ...base,
      stance: 'siege_starve',
      tier,
      powod: `T3 ${(ratio * 100).toFixed(0)}% — tylko glodzenie (bez szturmu)`,
    };
  }

  // T2 — medium army: build machines, assault when ready or timeout
  const ready = state.machinesReady ?? 0;
  const turn = state.siegeTurn ?? 0;
  if (ready >= 1) {
    return {
      ...base,
      stance: 'assault',
      tier,
      powod: `T2 — ${ready} maszyn gotowych — szturm`,
    };
  }
  if (turn >= cfg.t2MaxWaitTurns) {
    return {
      ...base,
      stance: 'assault',
      tier,
      powod: `T2 — timeout ${turn} tur bez maszyn — szturm`,
    };
  }
  return {
    ...base,
    stance: 'siege_build',
    tier,
    powod: `T2 ${(ratio * 100).toFixed(0)}% — oblezenie + budowa maszyn (tura ${turn}, gotowe ${ready})`,
  };
}

/** Handoff alias (C3-Q2 spec name). */
export function evaluateSiegeAiAction(
  army: ReadonlyArray<SiegeUnit>,
  city: SiegeCity,
  state: SiegeAiState = EMPTY_SIEGE_AI_STATE,
  params: SiegeAiParams = {},
): AISiegeStance {
  return decideAISiegeStance(army, city, state, params).stance;
}
