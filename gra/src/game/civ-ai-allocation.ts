/**
 * Per-civilization AI allocation profiles.
 *
 * The first profile is deliberately narrow: Greece is the pilot civilization.
 * The runtime applies the profile rows only to major AI owners; the owner-role
 * resolver separately supplies the shared automation envelope for AI roles.
 */

export type CivAllocationDifficulty = 'easy' | 'normal' | 'hard';

export interface CivAiAllocationProfile {
  /** Share of city Work kept by the city production queue. */
  workBuildingsPercent: number;
  /** Complement of workBuildingsPercent: Work sent to the empire pool. */
  workEmpirePoolPercent: number;
  /** Share of net trade assigned to Science. */
  sciencePercent: number;
  /** Share of net trade assigned to Money. */
  moneyPercent: number;
  /** Share of net trade assigned to Wealth. */
  wealthPercent: number;
  /** Share of the assigned empire-pool Work available to auto-improvements. */
  improvementAutomationPercent: number;
}

export type CivAiOwnerKind = 'major-ai' | 'city-state' | 'defensive-copy' | 'player' | 'hotseat';

/** Human owners retain the existing player-controlled automation envelope. */
export const HUMAN_IMPROVEMENT_AUTOMATION_PERCENT = 33;

/** AI owners may spend their complete cumulative improvement pool. */
export const AI_IMPROVEMENT_AUTOMATION_PERCENT = 100;

const GREECE_ALLOCATION: CivAiAllocationProfile = Object.freeze({
  workBuildingsPercent: 50,
  workEmpirePoolPercent: 50,
  sciencePercent: 60,
  moneyPercent: 20,
  wealthPercent: 20,
  improvementAutomationPercent: 100,
});

/**
 * Explicit Easy/Normal/Hard rows are intentional even though the pilot's
 * allocation is difficulty-neutral. Difficulty is part of the profile
 * contract and can be tuned without changing the consumer API.
 */
export const CIV_AI_ALLOCATION_PROFILES: Readonly<Record<string, Readonly<Record<CivAllocationDifficulty, CivAiAllocationProfile>>>> =
  Object.freeze({
    grecy: Object.freeze({
      easy: GREECE_ALLOCATION,
      normal: GREECE_ALLOCATION,
      hard: GREECE_ALLOCATION,
    }),
  });

function normalizeCivKey(civType: string): string {
  return civType.trim().toLowerCase();
}

/** Resolve a pilot profile; non-pilot civilizations retain their policies. */
export function civAiAllocationFor(
  civType: string | undefined,
  difficulty: CivAllocationDifficulty = 'normal',
): CivAiAllocationProfile | undefined {
  if (!civType) return undefined;
  return CIV_AI_ALLOCATION_PROFILES[normalizeCivKey(civType)]?.[difficulty];
}

/**
 * Resolve the automation envelope by owner role, without changing unrelated
 * allocation rows. The pilot profile can override major-AI trade/work rows;
 * city-state and defensive-copy owners only receive the AI-wide 100% envelope.
 */
export function civAiImprovementAutomationPercentForOwner(
  ownerKind: CivAiOwnerKind,
  civType: string | undefined,
  difficulty: CivAllocationDifficulty = 'normal',
): number {
  if (ownerKind === 'player' || ownerKind === 'hotseat') {
    return HUMAN_IMPROVEMENT_AUTOMATION_PERCENT;
  }
  if (ownerKind === 'city-state' || ownerKind === 'defensive-copy') {
    return AI_IMPROVEMENT_AUTOMATION_PERCENT;
  }
  return civAiAllocationFor(civType, difficulty)?.improvementAutomationPercent
    ?? AI_IMPROVEMENT_AUTOMATION_PERCENT;
}

/** Compute an automation cap from the cumulative owner pool, with safe clamps. */
export function improvementBudgetFromCumulativePool(
  cumulativePool: number,
  automationPercent: number,
): number {
  const pool = Number.isFinite(cumulativePool) ? Math.max(0, cumulativePool) : 0;
  const percent = Number.isFinite(automationPercent)
    ? Math.max(0, Math.min(100, automationPercent))
    : 0;
  return Math.floor(pool * percent / 100);
}

/** Validate the profile's percentage invariants for tests and diagnostics. */
export function isValidCivAiAllocationProfile(profile: CivAiAllocationProfile): boolean {
  return profile.workBuildingsPercent + profile.workEmpirePoolPercent === 100
    && profile.sciencePercent + profile.moneyPercent + profile.wealthPercent === 100
    && profile.workBuildingsPercent >= 0
    && profile.workEmpirePoolPercent >= 0
    && profile.sciencePercent >= 0
    && profile.moneyPercent >= 0
    && profile.wealthPercent >= 0
    && profile.improvementAutomationPercent >= 0
    && profile.improvementAutomationPercent <= 100;
}
