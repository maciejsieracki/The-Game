/**
 * alliance-war-obligation.ts — czysta heurystyka N4: czy sojusznik honoruje obowiązek wojny.
 * C-WIAR-N4-AI=B — AI odmawia rzadko przy osłabieniu (wojna gdzie indziej / słaba armia).
 * Bez DOM; wołane z aiHonorsAllianceWarObligation (ai.ts).
 */

export interface AllianceWarObligationInput {
  allyId: number;
  mustDeclareWarOn: number;
  attackerId: number;
  victimId: number;
  /** Siła sojusznika / siła celu (>1 = sojusznik silniejszy; semantyka computeMilitaryRatioFromArmyM). */
  militaryRatio: number;
  /** Ile odrębnych wojen sojusznik już prowadzi (bez przyszłego celu obowiązku). */
  activeWarCount: number;
  /** Archetyp pokojowy — wyższy próg siły wojskowej. */
  peacefulArchetype: boolean;
  /** Min. ratio dla zwykłego archetypu (domyślnie 0,55). */
  minRatioHonor?: number;
  /** Min. ratio dla archetypu pokojowego (domyślnie 0,75). */
  minRatioHonorPeaceful?: number;
  /** Odmów gdy activeWarCount >= ten próg (domyślnie 1 = już w jednej wojnie). */
  maxWarsBeforeRefuse?: number;
  /** Zaufanie sojusznika do proszącego sojusznika (pkt). Gdy brak — pomijamy warunek. */
  trustToRequestingAlly?: number;
  /** Min. Zaufanie do proszącego sojusznika (domyślnie 20 pkt). */
  minTrustHonor?: number;
}

const DEFAULT_MIN_RATIO_HONOR = 0.55;
const DEFAULT_MIN_RATIO_HONOR_PEACEFUL = 0.75;
const DEFAULT_MAX_WARS_BEFORE_REFUSE = 1;
const DEFAULT_MIN_TRUST_HONOR = 20;

/**
 * Czy sojusznik honoruje obowiązek wojny sojuszniczej (dołącza zamiast odmowy N4).
 * Gracz (allyId === 0) zawsze honoruje w silniku — decyzja UI osobno.
 */
export function shouldHonorAllianceWarObligation(inp: AllianceWarObligationInput): boolean {
  if (inp.allyId === 0) return true;

  const maxWars = inp.maxWarsBeforeRefuse ?? DEFAULT_MAX_WARS_BEFORE_REFUSE;
  if (inp.activeWarCount >= maxWars) return false;

  const minPeaceful = inp.minRatioHonorPeaceful ?? DEFAULT_MIN_RATIO_HONOR_PEACEFUL;
  if (inp.peacefulArchetype && inp.militaryRatio < minPeaceful) return false;

  const minRatio = inp.minRatioHonor ?? DEFAULT_MIN_RATIO_HONOR;
  if (inp.militaryRatio < minRatio) return false;

  if (inp.trustToRequestingAlly !== undefined) {
    const minTrust = inp.minTrustHonor ?? DEFAULT_MIN_TRUST_HONOR;
    if (inp.trustToRequestingAlly < minTrust) return false;
  }

  return true;
}
