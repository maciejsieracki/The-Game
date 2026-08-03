/**
 * R-AI-MP-WASAL-WCHLONIECIE — czysta logika AI major → miasto-państwo (trybut/wasal/wojna/wchłonięcie).
 * Skala = trudność gry (_menuDifficulty), nie odwrócona trudność MP.
 */

import type { DifficultyLevel } from './city-state-difficulty';

export type AiCsClusterAction =
  | 'trybut'
  | 'wasal'
  | 'war'
  | 'annex'
  | 'instant_annex';

export interface AiCsAbsorptionParams {
  minTurn: number;
  militaryRatioMin: number;
  trybutAccept: number;
  wasalAccept: number;
  trybutGoldPerTurn: number;
  wasalAfterTrybutTurns: number;
  vassalFailBeforeWar: number;
  clusterWarMinTurn: number;
  clusterConquestDeadline: number;
  annexAfterVassalTurns: number;
  /** Tylko hard — null na łatwy/normalny */
  instantAnnexIfRatio: number | null;
  instantAnnexMinTurn: number | null;
}

export interface DecideAiCsClusterActionInput {
  difficulty: DifficultyLevel;
  turn: number;
  militaryRatio: number;
  hasWasalDeal: boolean;
  wasalSinceTurn?: number;
  hasTrybutDeal: boolean;
  trybutSinceTurn?: number;
  failCount: number;
  alreadyAtWar: boolean;
  napBlocked: boolean;
}

export interface DecideAiCsClusterActionResult {
  action: AiCsClusterAction | null;
  reason: string;
}

export function aiCsAbsorptionParams(diff: DifficultyLevel): AiCsAbsorptionParams {
  switch (diff) {
    case 'easy':
      return {
        minTurn: 28,
        militaryRatioMin: 1.6,
        trybutAccept: 0.70,
        wasalAccept: 0.60,
        trybutGoldPerTurn: 8,
        wasalAfterTrybutTurns: 12,
        vassalFailBeforeWar: 3,
        clusterWarMinTurn: 40,
        clusterConquestDeadline: 150,
        annexAfterVassalTurns: 16,
        instantAnnexIfRatio: null,
        instantAnnexMinTurn: null,
      };
    case 'hard':
      return {
        minTurn: 8,
        militaryRatioMin: 1.1,
        trybutAccept: 0.98,
        wasalAccept: 0.95,
        trybutGoldPerTurn: 2,
        wasalAfterTrybutTurns: 3,
        vassalFailBeforeWar: 1,
        clusterWarMinTurn: 15,
        clusterConquestDeadline: 80,
        annexAfterVassalTurns: 1,
        instantAnnexIfRatio: 1.25,
        instantAnnexMinTurn: 10,
      };
    default:
      return {
        minTurn: 18,
        militaryRatioMin: 1.3,
        trybutAccept: 0.85,
        wasalAccept: 0.80,
        trybutGoldPerTurn: 5,
        wasalAfterTrybutTurns: 8,
        vassalFailBeforeWar: 2,
        clusterWarMinTurn: 30,
        clusterConquestDeadline: 120,
        annexAfterVassalTurns: 10,
        instantAnnexIfRatio: null,
        instantAnnexMinTurn: null,
      };
  }
}

/** Q1=A — zagrożenie sojuszu sióstr tylko od gracza (ownerId === 0). */
export function isSisterAllianceThreatOwner(ownerId: number): boolean {
  return ownerId === 0;
}

/** True gdy jednostka to gracz i nie jest siostrą z klastra. */
export function unitTriggersSisterAllianceThreat(
  unitOwnerId: number,
  sisterOwnerSet: ReadonlySet<number>,
): boolean {
  return isSisterAllianceThreatOwner(unitOwnerId) && !sisterOwnerSet.has(unitOwnerId);
}

export function decideAiCsClusterAction(
  input: DecideAiCsClusterActionInput,
): DecideAiCsClusterActionResult {
  const params = aiCsAbsorptionParams(input.difficulty);

  if (input.alreadyAtWar) {
    return { action: null, reason: 'wojna_juz_trwa' };
  }
  if (input.napBlocked) {
    return { action: null, reason: 'pakt_nieagresji' };
  }

  if (
    params.instantAnnexIfRatio != null
    && params.instantAnnexMinTurn != null
    && input.turn >= params.instantAnnexMinTurn
    && input.militaryRatio >= params.instantAnnexIfRatio
  ) {
    return { action: 'instant_annex', reason: 'hard_ratio_instant' };
  }

  if (
    input.hasWasalDeal
    && input.wasalSinceTurn != null
    && input.turn - input.wasalSinceTurn >= params.annexAfterVassalTurns
  ) {
    return { action: 'annex', reason: 'wasal_timer' };
  }

  if (input.turn < params.minTurn || input.militaryRatio < params.militaryRatioMin) {
    return { action: null, reason: 'za_wczesnie_lub_za_slaby' };
  }

  if (
    input.hasTrybutDeal
    && !input.hasWasalDeal
    && input.trybutSinceTurn != null
    && input.turn - input.trybutSinceTurn >= params.wasalAfterTrybutTurns
  ) {
    return { action: 'wasal', reason: 'trybut_elapsed' };
  }

  if (!input.hasTrybutDeal && !input.hasWasalDeal) {
    return { action: 'trybut', reason: 'pierwszy_krok' };
  }

  if (
    input.failCount >= params.vassalFailBeforeWar
    && input.turn >= params.clusterWarMinTurn
  ) {
    return { action: 'war', reason: 'odmowy_i_czas' };
  }

  return { action: null, reason: 'czekaj' };
}

export function rollAiCsAccept(
  action: 'trybut' | 'wasal',
  params: AiCsAbsorptionParams,
  rng: () => number = Math.random,
): boolean {
  const threshold = action === 'trybut' ? params.trybutAccept : params.wasalAccept;
  return rng() < threshold;
}
