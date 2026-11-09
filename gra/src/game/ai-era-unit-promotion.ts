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
  /** Pełny koszt rekrutacji nowej jednostki w Pieniądzu (D1 = C: NIE różnica nowa - stara). */
  unitCost(unitId: string, unit: U): number;
  /** Pełny koszt surowcowy nowej jednostki (unitStockCost); brak = bez kosztu surowcowego. */
  stockCost?(target: AiEraPromotionTarget, unit: U): Record<string, number>;
  /** Czy pula państwa pokrywa `cost` (brak = zamiana pomijana, jak brak Pieniądza). */
  canPayStock?(cost: Record<string, number>, unit: U): boolean;
  /** Pobiera `cost` z puli państwa (wołane dopiero po przejściu WSZYSTKICH bramek). */
  payStock?(cost: Record<string, number>, unit: U): void;
  currentTreasury(): number;
  setTreasury(value: number): void;
  oldMaxHp(unit: U, definition: AiEraPromotionTarget): number;
  newMaxHp(target: AiEraPromotionTarget, unit: U): number;
  category(target: AiEraPromotionTarget): string;
}

/**
 * Promote one AI unit to the newest currently eligible same-role unit.
 * Availability and costs are supplied by the live-game callers. Cost = FULL recruitment cost of the
 * new unit (money + resource stock from the state pool), the same function as the player's Replace
 * action (R-WEB-UNIT-REPLACE-COST-AND-PROMOTION-IMPL-Q1, D1 = C). The unit keeps its experience
 * (only type/category/hp/move change) and consumes no manpower. Unaffordable -> skipped, no mutation. A second call in the same turn
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

  const moneyCost = Math.max(0, deps.unitCost(target.Jednostka, unit));
  const stockCost = deps.stockCost?.(target, unit) ?? {};
  const hasStockCost = Object.values(stockCost).some(amount => amount > 0);
  const treasury = deps.currentTreasury();
  if (treasury < moneyCost) return false;
  if (hasStockCost && deps.canPayStock && !deps.canPayStock(stockCost, unit)) return false;

  const oldMaxHp = deps.oldMaxHp(unit, oldDefinition);
  const newMaxHp = deps.newMaxHp(target, unit);
  const oldHp = unit.hp ?? oldMaxHp;
  unit.typeId = target.Jednostka;
  unit.category = deps.category(target);
  unit.hp = Math.max(1, Math.round(newMaxHp * (oldMaxHp > 0 ? oldHp / oldMaxHp : 1)));
  unit.hpMax = newMaxHp;
  unit.ruchLeft = 0;
  unit.replaceUsedThisTurn = true;
  if (moneyCost > 0) deps.setTreasury(treasury - moneyCost);
  if (hasStockCost) deps.payStock?.(stockCost, unit);
  return true;
}
