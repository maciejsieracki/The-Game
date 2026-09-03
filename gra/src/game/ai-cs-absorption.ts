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
  /** MP-DIPLO-Q1: same-civ cluster MPs — łatwiejsza absorpcja (nie gracz). */
  sameCivCluster?: boolean;
}

export interface DecideAiCsClusterActionResult {
  action: AiCsClusterAction | null;
  reason: string;
}

const CS_ABS_EASY: AiCsAbsorptionParams = {
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

const CS_ABS_HARD: AiCsAbsorptionParams = {
  minTurn: 8,
  militaryRatioMin: 1.1,
  trybutAccept: 0.99,
  wasalAccept: 0.99,
  trybutGoldPerTurn: 2,
  wasalAfterTrybutTurns: 3,
  vassalFailBeforeWar: 1,
  clusterWarMinTurn: 15,
  clusterConquestDeadline: 80,
  annexAfterVassalTurns: 1,
  instantAnnexIfRatio: 1.25,
  instantAnnexMinTurn: 10,
};

function midInt(a: number, b: number): number {
  return Math.round((a + b) / 2);
}

function midRate(a: number, b: number): number {
  return Math.round(((a + b) / 2) * 100) / 100;
}

function interpolateCsAbsorption(easy: AiCsAbsorptionParams, hard: AiCsAbsorptionParams): AiCsAbsorptionParams {
  return {
    minTurn: midInt(easy.minTurn, hard.minTurn),
    militaryRatioMin: midRate(easy.militaryRatioMin, hard.militaryRatioMin),
    trybutAccept: midRate(easy.trybutAccept, hard.trybutAccept),
    wasalAccept: midRate(easy.wasalAccept, hard.wasalAccept),
    trybutGoldPerTurn: midInt(easy.trybutGoldPerTurn, hard.trybutGoldPerTurn),
    wasalAfterTrybutTurns: midInt(easy.wasalAfterTrybutTurns, hard.wasalAfterTrybutTurns),
    vassalFailBeforeWar: midInt(easy.vassalFailBeforeWar, hard.vassalFailBeforeWar),
    clusterWarMinTurn: midInt(easy.clusterWarMinTurn, hard.clusterWarMinTurn),
    clusterConquestDeadline: midInt(easy.clusterConquestDeadline, hard.clusterConquestDeadline),
    annexAfterVassalTurns: midInt(easy.annexAfterVassalTurns, hard.annexAfterVassalTurns),
    instantAnnexIfRatio: null,
    instantAnnexMinTurn: null,
  };
}

export function aiCsAbsorptionParams(diff: DifficultyLevel): AiCsAbsorptionParams {
  switch (diff) {
    case 'easy':
      return CS_ABS_EASY;
    case 'hard':
      return CS_ABS_HARD;
    default:
      return interpolateCsAbsorption(CS_ABS_EASY, CS_ABS_HARD);
  }
}

function clampRate(n: number, lo = 0, hi = 0.99): number {
  return Math.max(lo, Math.min(hi, Math.round(n * 100) / 100));
}

/**
 * MP-DIPLO-Q1=A — same-civ MP w klastrze major AI: łatwiejsza ścieżka trybut/wasal/annex.
 * Easy: lekki boost; Normal: połowa; Hard: prawie zawsze accept.
 */
export function applySameCivClusterAbsorptionBoost(
  params: AiCsAbsorptionParams,
  diff: DifficultyLevel,
): AiCsAbsorptionParams {
  switch (diff) {
    case 'easy':
      return {
        ...params,
        minTurn: Math.max(1, params.minTurn - 4),
        militaryRatioMin: clampRate(params.militaryRatioMin * 0.92, 0.5),
        trybutAccept: clampRate(params.trybutAccept + 0.08),
        wasalAccept: clampRate(params.wasalAccept + 0.08),
        wasalAfterTrybutTurns: Math.max(1, params.wasalAfterTrybutTurns - 2),
        annexAfterVassalTurns: Math.max(1, params.annexAfterVassalTurns - 2),
      };
    case 'hard':
      return {
        ...params,
        minTurn: Math.max(1, params.minTurn - 3),
        militaryRatioMin: Math.min(params.militaryRatioMin, 1.0),
        trybutAccept: 0.99,
        wasalAccept: 0.99,
        wasalAfterTrybutTurns: Math.min(params.wasalAfterTrybutTurns, 2),
        vassalFailBeforeWar: 1,
        clusterWarMinTurn: Math.min(params.clusterWarMinTurn, 10),
        annexAfterVassalTurns: Math.min(params.annexAfterVassalTurns, 1),
        instantAnnexIfRatio: params.instantAnnexIfRatio ?? 1.15,
        instantAnnexMinTurn: params.instantAnnexMinTurn ?? Math.max(1, params.minTurn - 2),
      };
    default:
      return {
        ...params,
        minTurn: Math.max(1, params.minTurn - 6),
        militaryRatioMin: clampRate(params.militaryRatioMin * 0.95, 0.5),
        trybutAccept: clampRate(params.trybutAccept + 0.12),
        wasalAccept: clampRate(params.wasalAccept + 0.12),
        wasalAfterTrybutTurns: Math.max(1, params.wasalAfterTrybutTurns - 3),
        annexAfterVassalTurns: Math.max(1, params.annexAfterVassalTurns - 4),
      };
  }
}

/**
 * R-MIASTA-PANSTWA-SOJUSZ-SIOSTRZANY-ATAK-Q1 GOAL 2 — "prawdziwy najeźdźca" wobec sojuszu
 * sióstr: gracz (aggressorOwnerId === 0) ZAWSZE kwalifikuje się. AI kwalifikuje się TYLKO
 * gdy jej typ cywilizacji różni się od typu klastra sióstr (aggressorCivType !==
 * clusterCivType) — AI TEGO SAMEGO typu jest CELOWO wykluczone: dla tej relacji istnieje
 * osobny, zamierzony tor integracji (trybut→wasal→wchłonięcie,
 * `docs/decyzje/R-AI-MP-WASAL-WCHLONIECIE.md`, Q1=A 2026-08-03) — sojusz siostrzany NIE MA
 * go blokować.
 *
 * ZASTĘPUJE dawne `isSisterAllianceThreatOwner`/`unitTriggersSisterAllianceThreat` (Q1=A z
 * poprzedniej rundy: zagrożenie = TYLKO gracz w promieniu jednostki). Operator decyduje:
 * ZASTĄP, nie zachowuj starą sygnaturę — semantyka zmieniła się fundamentalnie (promień
 * bliskości jednostki → status wojny z dowolnym kwalifikującym się właścicielem, plus nowa
 * kwalifikacja AI-innego-typu), więc zachowanie starych nazw byłoby mylące.
 */
export function isSisterAllianceAggressorOwner(
  aggressorOwnerId: number,
  clusterCivType: string,
  aggressorCivType: string | undefined,
): boolean {
  if (aggressorOwnerId === 0) return true;
  return aggressorCivType !== undefined && aggressorCivType !== clusterCivType;
}

/**
 * R-MIASTA-PANSTWA-SOJUSZ-SIOSTRZANY-ATAK-Q1 GOAL 1 — wyzwalacz sojuszu sióstr: dany
 * właściciel (siostra LUB dowolne miasto-państwo sprawdzane pod kątem GOAL 3) jest
 * "zagrożony" gdy jest W STANIE WOJNY z KTÓRYMKOLWIEK kwalifikującym się napastnikiem
 * (GOAL 2) — NIE gdy wroga jednostka jest po prostu blisko (stary `threatRadius`/
 * `hexDistance` warunek USUNIĘTY, patrz main.ts `formSisterAlliancesIfThreatened`).
 *
 * Czysta logika (main.ts dostarcza gotowe callbacki `civTypeOf`/`isAtWar` — silnikowy stan
 * `aiOwnerCivMap`/`getDiploRelation` — więc funkcja jest testowalna bez bootstrapowania
 * całego main.ts, wzorem reszty tego pliku).
 */
export function isSisterOwnerThreatenedByWar(
  ownerId: number,
  clusterCivType: string,
  candidateAggressorIds: readonly number[],
  civTypeOf: (aggressorOwnerId: number) => string | undefined,
  isAtWar: (a: number, b: number) => boolean,
): boolean {
  return candidateAggressorIds.some(aggressorId =>
    aggressorId !== ownerId
    && isSisterAllianceAggressorOwner(aggressorId, clusterCivType, civTypeOf(aggressorId))
    && isAtWar(ownerId, aggressorId),
  );
}

export function decideAiCsClusterAction(
  input: DecideAiCsClusterActionInput,
): DecideAiCsClusterActionResult {
  const base = aiCsAbsorptionParams(input.difficulty);
  const params = input.sameCivCluster
    ? applySameCivClusterAbsorptionBoost(base, input.difficulty)
    : base;

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

  // Po wasalu czekamy wyłącznie na timer wchłonięcia — bez wojny w międzyczasie.
  if (input.hasWasalDeal) {
    return { action: null, reason: 'czekaj_na_annex' };
  }

  const canForceWar =
    input.failCount >= params.vassalFailBeforeWar
    && input.turn >= params.clusterWarMinTurn;

  if (
    input.hasTrybutDeal
    && input.trybutSinceTurn != null
    && input.turn - input.trybutSinceTurn >= params.wasalAfterTrybutTurns
  ) {
    if (canForceWar) {
      return { action: 'war', reason: 'odmowy_wasal_i_czas' };
    }
    return { action: 'wasal', reason: 'trybut_elapsed' };
  }

  if (!input.hasTrybutDeal) {
    if (canForceWar) {
      return { action: 'war', reason: 'odmowy_i_czas' };
    }
    return { action: 'trybut', reason: 'pierwszy_krok' };
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
