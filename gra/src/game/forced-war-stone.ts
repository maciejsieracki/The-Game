import {
  isRestingFromForcedWar,
  pickForcedWarTargetId,
  restoreForcedWarState,
  serializeForcedWarState,
  shouldEndForcedWarByCityCount,
  type ForcedWarNeighborCandidate,
  type ForcedWarPairState,
  type ForcedWarSaveState,
} from './forced-war-common';

/** R-EPOKA-KAMIEN-WYMUSZONA-WOJNA: ochrona startowa mierzona turą gry. */
export const WOJNA_KAMIEN_WYMUSZONA_START_TURY = 20;
export const WOJNA_KAMIEN_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE = 2;
export const WOJNA_KAMIEN_WYMUSZONA_ODPOCZYNEK_TUR = 20;
export const WOJNA_KAMIEN_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR = 20;

export interface StoneForcedWarEligibilityInput {
  /** Wyłącznie główna cywilizacja AI; nie gracz, miasto-państwo ani barbarzyńca. */
  isMainAiCiv: boolean;
  /** Wojna w dowolnej roli blokuje wymuszoną wojnę. */
  isAlreadyAtWarAnyRole: boolean;
  /** Bieżąca tura gry. */
  currentTurn: number;
  /** Wojna Kamienia dotyczy wyłącznie ownera pozostającego w Kamieniu. */
  isStoneEra: boolean;
}

export function isEligibleForStoneForcedWar(inp: StoneForcedWarEligibilityInput): boolean {
  return (
    inp.isMainAiCiv
    && inp.isStoneEra
    && inp.currentTurn >= WOJNA_KAMIEN_WYMUSZONA_START_TURY
    && !inp.isAlreadyAtWarAnyRole
  );
}

export interface PickStoneForcedWarTargetOpts {
  blockedOwnerIds?: ReadonlySet<number>;
}

export type StoneForcedWarNeighborCandidate = ForcedWarNeighborCandidate;
export type StoneForcedWarPairState = ForcedWarPairState;
export type StoneForcedWarSaveState = ForcedWarSaveState;

export function pickStoneForcedWarTargetId(
  candidates: ReadonlyArray<StoneForcedWarNeighborCandidate>,
  referenceHex: { q: number; r: number } | undefined,
  hexDistanceFn: (aq: number, ar: number, bq: number, br: number) => number,
  opts?: PickStoneForcedWarTargetOpts,
): number | null {
  return pickForcedWarTargetId(
    candidates,
    referenceHex,
    hexDistanceFn,
    opts?.blockedOwnerIds ?? new Set<number>(),
  );
}

export function shouldEndStoneForcedWarByCityCount(
  citiesCapturedByAttacker: number,
  citiesCapturedByDefender: number,
  threshold: number = WOJNA_KAMIEN_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE,
): boolean {
  return shouldEndForcedWarByCityCount(
    citiesCapturedByAttacker,
    citiesCapturedByDefender,
    threshold,
  );
}

export function isRestingFromStoneForcedWar(
  currentTurn: number,
  restUntilTurn: number | undefined,
): boolean {
  return isRestingFromForcedWar(currentTurn, restUntilTurn);
}

export function serializeStoneForcedWarState(
  pendingOwners: ReadonlySet<number>,
  cycleOwners: ReadonlySet<number>,
  restUntilByOwner: ReadonlyMap<number, number>,
  activeByPairKey: ReadonlyMap<string, StoneForcedWarPairState>,
): StoneForcedWarSaveState {
  return serializeForcedWarState(
    pendingOwners,
    cycleOwners,
    restUntilByOwner,
    activeByPairKey,
  );
}

export function restoreStoneForcedWarState(
  saved: Partial<StoneForcedWarSaveState> | undefined,
): {
  pendingOwners: Set<number>;
  cycleOwners: Set<number>;
  restUntilByOwner: Map<number, number>;
  activeByPairKey: Map<string, StoneForcedWarPairState>;
} {
  return restoreForcedWarState(saved);
}
