/** Runtime mutation shared by the AI era-upgrade path and focused integration tests. */
export interface AiEraPromotableUnit {
  typeId: string;
  category?: string;
  hp?: number | null;
  hpMax?: number;
  ruchLeft?: number;
  replaceUsedThisTurn?: boolean;
}

export interface AiEraPromotionTarget {
  Jednostka: string;
  Epoka: unknown;
  Typ?: unknown;
  'Rola (linia)'?: unknown;
  'Super-jednostka'?: unknown;
}

export interface AiEraPromotionDeps<U extends AiEraPromotableUnit> {
  oldDefinition(unit: U): AiEraPromotionTarget | null | undefined;
  candidates(unit: U): readonly AiEraPromotionTarget[];
  newestSameRole(unit: U, candidates: readonly AiEraPromotionTarget[]): AiEraPromotionTarget | null | undefined;
  epochNumber(epoch: unknown): number;
  unitCost(unitId: string, unit: U): number;
  currentTreasury(): number;
  setTreasury(value: number): void;
  oldMaxHp(unit: U, definition: AiEraPromotionTarget): number;
  newMaxHp(target: AiEraPromotionTarget, unit: U): number;
  category(target: AiEraPromotionTarget): string;
}

/**
 * Promote one AI unit to the newest currently eligible same-role unit.
 * Availability and costs are supplied by the live-game callers; charging preserves the
 * existing Replace rule (positive money difference only). A second call in the same turn
 * is idempotent because successful promotion sets replaceUsedThisTurn.
 */
export function promoteAiUnitForEra<U extends AiEraPromotableUnit>(
  unit: U,
  deps: AiEraPromotionDeps<U>,
): boolean {
  if (unit.replaceUsedThisTurn) return false;
  const oldDefinition = deps.oldDefinition(unit);
  if (!oldDefinition || !String(oldDefinition.Typ ?? '').trim()) return false;
  const target = deps.newestSameRole(unit, deps.candidates(unit));
  if (!target || deps.epochNumber(target.Epoka) <= deps.epochNumber(oldDefinition.Epoka)) return false;

  const surcharge = Math.max(0, deps.unitCost(target.Jednostka, unit) - deps.unitCost(unit.typeId, unit));
  const treasury = deps.currentTreasury();
  if (treasury < surcharge) return false;

  const oldMaxHp = deps.oldMaxHp(unit, oldDefinition);
  const newMaxHp = deps.newMaxHp(target, unit);
  const oldHp = unit.hp ?? oldMaxHp;
  unit.typeId = target.Jednostka;
  unit.category = deps.category(target);
  unit.hp = Math.max(1, Math.round(newMaxHp * (oldMaxHp > 0 ? oldHp / oldMaxHp : 1)));
  unit.hpMax = newMaxHp;
  unit.ruchLeft = 0;
  unit.replaceUsedThisTurn = true;
  if (surcharge > 0) deps.setTreasury(treasury - surcharge);
  return true;
}
