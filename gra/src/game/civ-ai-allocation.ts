/**
 * Per-civilization AI allocation profiles.
 *
 * The first profile is deliberately narrow: Greece is the pilot civilization.
 * Player and city-state policies are not resolved here; the runtime applies
 * this profile only to major AI owners.
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
