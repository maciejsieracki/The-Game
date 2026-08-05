/**
 * P-AI-MAJOR-ABSORB Faza 1 — czysta logika wchłaniania major AI → major AI (same-civ, hard).
 */

import type { DifficultyLevel } from './city-state-difficulty';

/** Minimalny stosunek Mocy agresor/ofiara (jak instantAnnexIfRatio hard MP). */
export const AI_MAJOR_ABSORB_POWER_RATIO_MIN = 1.25;

/** Minimalna tura gry zanim major może wchłonąć innego majora (jak MP hard). */
export const AI_MAJOR_ABSORB_MIN_TURN = 10;

export type AiMajorAbsorbAction = 'instant_annex';

export interface DecideAiMajorAbsorbInput {
  difficulty: DifficultyLevel;
  turn: number;
  aggressorId: number;
  victimId: number;
  sameCiv: boolean;
  /** Moc agresora / moc ofiary (≥ 1 gdy agresor silniejszy lub równy). */
  powerRatio: number;
  aggressorIsMajor: boolean;
  victimIsMajor: boolean;
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
  if (input.sameOwner) {
    return { action: null, reason: 'same_owner' };
  }
  if (input.victimEliminated) {
    return { action: null, reason: 'victim_eliminated' };
  }
  if (!input.aggressorIsMajor || !input.victimIsMajor) {
    return { action: null, reason: 'not_both_major' };
  }
  if (!input.sameCiv) {
    return { action: null, reason: 'different_civ' };
  }
  if (input.turn < AI_MAJOR_ABSORB_MIN_TURN) {
    return { action: null, reason: 'too_early' };
  }
  if (input.powerRatio < AI_MAJOR_ABSORB_POWER_RATIO_MIN) {
    return { action: null, reason: 'insufficient_power' };
  }
  return { action: 'instant_annex', reason: 'hard_same_civ_ratio' };
}
