/** Owner-specific tactical context with compatibility fallbacks for older/synthetic battle units. */
export function battleUnitCivBonusy<T>(
  unit: { civBonusy?: readonly T[] },
  sideFallback: readonly T[],
): readonly T[] {
  return unit.civBonusy ?? sideFallback;
}

export function battleUnitDifficultyCombatMult(
  unit: { difficultyCombatMult?: number },
  sideFallback: number,
): number {
  return unit.difficultyCombatMult ?? sideFallback;
}
