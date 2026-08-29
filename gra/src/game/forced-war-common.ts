/**
 * Wspólny, czysty mechanizm wojen wymuszonych.
 *
 * Epoka Kamienia i Brązu mają osobne rejestry stanu w main.ts, ale identyczne
 * reguły wyboru celu, progu automatycznego pokoju, odpoczynku oraz serializacji.
 * Ten moduł utrzymuje te reguły w jednym miejscu bez zależności od silnika/DOM.
 */

export interface ForcedWarPairState {
  attackerId: number;
  targetId: number;
  capturedByAttacker: number;
  capturedByDefender: number;
}

export interface ForcedWarNeighborCandidate {
  ownerId: number;
  q: number;
  r: number;
}

export interface ForcedWarSaveState {
  pendingOwners: number[];
  cycleOwners: number[];
  restUntilByOwner: Array<[number, number]>;
  activeByPairKey: Array<[string, ForcedWarPairState]>;
}

export function pickForcedWarTargetId(
  candidates: ReadonlyArray<ForcedWarNeighborCandidate>,
  referenceHex: { q: number; r: number } | undefined,
  hexDistanceFn: (aq: number, ar: number, bq: number, br: number) => number,
  blockedOwnerIds: ReadonlySet<number> = new Set<number>(),
): number | null {
  const eligible = candidates.filter(c => !blockedOwnerIds.has(c.ownerId));
  if (eligible.length === 0) return null;
  if (!referenceHex) {
    return eligible.reduce((a, b) => (b.ownerId < a.ownerId ? b : a)).ownerId;
  }

  let best = eligible[0]!;
  let bestDist = hexDistanceFn(best.q, best.r, referenceHex.q, referenceHex.r);
  for (let i = 1; i < eligible.length; i++) {
    const candidate = eligible[i]!;
    const distance = hexDistanceFn(candidate.q, candidate.r, referenceHex.q, referenceHex.r);
    if (distance < bestDist || (distance === bestDist && candidate.ownerId < best.ownerId)) {
      best = candidate;
      bestDist = distance;
    }
  }
  return best.ownerId;
}

export function shouldEndForcedWarByCityCount(
  citiesCapturedByAttacker: number,
  citiesCapturedByDefender: number,
  threshold: number,
): boolean {
  return citiesCapturedByAttacker >= threshold || citiesCapturedByDefender >= threshold;
}

export function isRestingFromForcedWar(
  currentTurn: number,
  restUntilTurn: number | undefined,
): boolean {
  return restUntilTurn != null && currentTurn < restUntilTurn;
}

export function serializeForcedWarState(
  pendingOwners: ReadonlySet<number>,
  cycleOwners: ReadonlySet<number>,
  restUntilByOwner: ReadonlyMap<number, number>,
  activeByPairKey: ReadonlyMap<string, ForcedWarPairState>,
): ForcedWarSaveState {
  return {
    pendingOwners: Array.from(pendingOwners),
    cycleOwners: Array.from(cycleOwners),
    restUntilByOwner: Array.from(restUntilByOwner.entries()),
    activeByPairKey: Array.from(activeByPairKey.entries()),
  };
}

export function restoreForcedWarState(
  saved: Partial<ForcedWarSaveState> | undefined,
): {
  pendingOwners: Set<number>;
  cycleOwners: Set<number>;
  restUntilByOwner: Map<number, number>;
  activeByPairKey: Map<string, ForcedWarPairState>;
} {
  return {
    pendingOwners: new Set(saved?.pendingOwners ?? []),
    cycleOwners: new Set(saved?.cycleOwners ?? []),
    restUntilByOwner: new Map(saved?.restUntilByOwner ?? []),
    activeByPairKey: new Map(saved?.activeByPairKey ?? []),
  };
}
