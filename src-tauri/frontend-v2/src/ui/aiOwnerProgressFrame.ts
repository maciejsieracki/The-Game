/**
 * Bound forced map/UI paints during the per-owner AI progress loop.
 * `setTurnTransition` still updates for every owner; only the RAF yield is
 * coalesced, so the next rendered frame shows the latest progress state.
 */
export function shouldYieldAiOwnerProgressFrame(
  ownerIndex: number,
  ownerCount: number,
  startIndex: number,
): boolean {
  if (ownerCount <= 0 || startIndex < 0 || startIndex >= ownerCount) return false;
  if (ownerIndex < startIndex || ownerIndex >= ownerCount) return false;
  return ownerIndex === startIndex
    || ownerIndex === ownerCount - 1
    || (ownerIndex - startIndex) % 3 === 0;
}
