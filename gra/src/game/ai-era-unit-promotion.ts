import { executeUnitReplace } from './unit-replace-execute';

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
  /** Pełny koszt surowcowy nowej jednostki (unitStockCost); pusty obiekt = bez kosztu surowcowego.
   *  Hooki surowcowe są WYMAGANE: opcjonalne pozwoliłyby po cichu pominąć koszt surowca. */
  stockCost(target: AiEraPromotionTarget, unit: U): Record<string, number>;
  /** Czy pula państwa pokrywa `cost` (brak = zamiana pomijana, jak brak Pieniądza). */
  canPayStock(cost: Record<string, number>, unit: U): boolean;
  /** Pobiera `cost` z puli państwa (wołane dopiero po przejściu WSZYSTKICH bramek). */
  payStock(cost: Record<string, number>, unit: U): void;
  /** Opcjonalna brama przed kosztem (limit Super-jednostki itp.) -- ta sama co u gracza. */
  gateReason?(unit: U, newTypeId: string): string | null;
  currentTreasury(): number;
  setTreasury(value: number): void;
  oldMaxHp(unit: U, definition: AiEraPromotionTarget): number;
  newMaxHp(target: AiEraPromotionTarget, unit: U): number;
  category(target: AiEraPromotionTarget): string;
}

/** Narodowi łucznicy Brązu -> Procarz (Brąz Standardowa): jedyne przejścia Zastąp bez wzrostu epoki. */
export const SAME_EPOCH_ARCHER_DOWNGRADE_SOURCES: ReadonlySet<string> = new Set([
  'Łucznik nubijski',
  'Łucznik akadyjski',
  'Łucznik asyryjski',
]);

export function isSameEpochArcherDowngrade(sourceName: string, targetName: string): boolean {
  return SAME_EPOCH_ARCHER_DOWNGRADE_SOURCES.has(sourceName) && targetName === 'Procarz';
}

/** Oszczepnik (generyczny) i Oszczepnik Zulu -> Łucznik (decyzja właściciela 2026-11-17): ta sama
 *  epoka Kamień; dla Zulu także niższa klasa (Specjalna -> Standardowa). Jedyne wejścia poza awansem. */
export const JAVELIN_TO_ARCHER_SOURCES: ReadonlySet<string> = new Set([
  'Oszczepnik',
  'Oszczepnik Zulu (Izijula)',
]);

export function isJavelinToArcher(sourceName: string, targetName: string): boolean {
  return JAVELIN_TO_ARCHER_SOURCES.has(sourceName) && targetName === 'Łucznik';
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
  if (!target) return false;
  const higherEpoch = deps.epochNumber(target.Epoka) > deps.epochNumber(oldDefinition.Epoka);
  // R-WEB-UNIT-REPLACE-INCA-AND-NATIONAL-ARCHERS-TO-SLINGER-Q1 r3: jedyny wyjątek bez wzrostu epoki
  // (narodowy łucznik Brązu -> Procarz, ta sama epoka, niższa klasa), zgodnie z tabelą w units.json.
  const sameEpochArcherOk = isSameEpochArcherDowngrade(
    String(oldDefinition.Jednostka).trim(),
    String(target.Jednostka).trim(),
  );
  const javelinToArcherOk = isJavelinToArcher(
    String(oldDefinition.Jednostka).trim(),
    String(target.Jednostka).trim(),
  );
  if (!higherEpoch && !sameEpochArcherOk && !javelinToArcherOk) return false;

  const result = executeUnitReplace(unit, target.Jednostka, {
    gateReason: (u, newTypeId) => deps.gateReason?.(u, newTypeId) ?? null,
    moneyCost: (newTypeId, u) => Math.max(0, deps.unitCost(newTypeId, u)),
    stockCost: (_newTypeId, u) => deps.stockCost(target, u),
    canPayStock: (cost, u) => deps.canPayStock(cost, u),
    payStock: (cost, u) => deps.payStock(cost, u),
    currentTreasury: deps.currentTreasury,
    setTreasury: deps.setTreasury,
    oldMaxHp: u => deps.oldMaxHp(u, oldDefinition),
    newMaxHp: u => deps.newMaxHp(target, u),
    category: () => deps.category(target),
    syncHpMax: true,
  });
  return result.ok;
}
