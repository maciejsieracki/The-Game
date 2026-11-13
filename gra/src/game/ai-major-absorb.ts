/**
 * P-AI-MAJOR-ABSORB — czysta logika wchłaniania major AI → major AI.
 * Właścicielska reguła: tylko hard, od 25. tury i przy mocy agresora >= 10x
 * mocy ofiary. Własne państwa-miasta mają osobną ścieżkę w main.ts.
 */

import type { DifficultyLevel } from './city-state-difficulty';

/** Minimalny stosunek Mocy agresor/ofiara dla major→major na hard. */
export const AI_MAJOR_ABSORB_POWER_RATIO_MIN = 10;

/** Minimalna tura gry zanim major może wchłonąć innego majora. */
export const AI_MAJOR_ABSORB_MIN_TURN = 25;

export type AiMajorAbsorbAction = 'instant_annex';

export interface DecideAiMajorAbsorbInput {
  difficulty: DifficultyLevel;
  turn: number;
  aggressorId: number;
  victimId: number;
  sameCiv: boolean;
  /** Compatibility guard for the former same-civ proposal. */
  requireSameCiv?: boolean;
  /** Moc agresora / moc ofiary (≥ 1 gdy agresor silniejszy lub równy). */
  powerRatio: number;
  aggressorIsMajor: boolean;
  victimIsMajor: boolean;
  /** Barbarians are never diplomatic major-absorb targets. */
  aggressorIsBarbarian?: boolean;
  victimIsBarbarian?: boolean;
  /** City-states belong to the separate own-cluster absorption path. */
  victimIsCityState?: boolean;
  victimEliminated: boolean;
  sameOwner: boolean;
}

export interface DecideAiMajorAbsorbResult {
  action: AiMajorAbsorbAction | null;
  reason: string;
}

export function decideAiMajorAbsorb(
  input: DecideAiMajorAbsorbInput,
): DecideAiMajorAbsorbResult {
  if (input.difficulty !== 'hard') {
    return { action: null, reason: 'not_hard' };
  }
  if (input.aggressorId === 0 || input.victimId === 0) {
    return { action: null, reason: 'player_involved' };
  }
  if (input.aggressorIsBarbarian || input.victimIsBarbarian) {
    return { action: null, reason: 'barbarian_involved' };
  }
  if (input.victimIsCityState) {
    return { action: null, reason: 'city_state_target' };
  }
  if (input.sameOwner) {
    return { action: null, reason: 'same_owner' };
  }
  if (input.victimEliminated) {
    return { action: null, reason: 'victim_eliminated' };
  }
  if (!input.aggressorIsMajor || !input.victimIsMajor) {
    return { action: null, reason: 'not_both_major' };
  }
  if (input.requireSameCiv === true && !input.sameCiv) {
    return { action: null, reason: 'different_civ' };
  }
  if (input.turn < AI_MAJOR_ABSORB_MIN_TURN) {
    return { action: null, reason: 'too_early' };
  }
  if (input.powerRatio < AI_MAJOR_ABSORB_POWER_RATIO_MIN) {
    return { action: null, reason: 'insufficient_power' };
  }
  const reason = input.requireSameCiv === true
    ? 'hard_same_civ_ratio'
    : 'hard_any_civ_ratio';
  return { action: 'instant_annex', reason };
}
