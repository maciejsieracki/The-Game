/**
 * unit-replace-execute.ts
 *
 * R-WEB-AI-UNIT-REPLACE-SAME-RULES-AS-PLAYER-Q1: JEDNA implementacja wykonania akcji "Zastąp"
 * (gracz I AI). Wcześniej mutację robił performUnitReplace w main.ts (UI gracza), a AI miało
 * osobną kopię w promoteAiUnitForEra -- teraz oba wołają `executeUnitReplace`.
 *
 * Wspólne reguły (identyczne dla gracza i AI):
 *   - 1 zamiana na jednostkę na turę (`replaceUsedThisTurn`),
 *   - brama dostępności/limitu (limit Super-jednostki max 1, zapas surowca wymaganego do wyboru) -- `gateReason`,
 *   - PEŁNY koszt rekrutacji nowej jednostki: Pieniądz + surowce z puli państwa (D1 = C),
 *   - zachowanie id/roli wodza (`isGeneral`), wyszkolenia (weteran, bonusy) i % HP; zużycie ruchu (ruchLeft = 0),
 *   - brak zasobów = brak jakiejkolwiek mutacji (nic nie pobrano).
 *
 * Pure (bez DOM) -- bundlowane i testowane w tools/ai-unit-replace-same-rules-test.cjs.
 */

export interface UnitReplaceTarget {
  typeId: string;
  category?: string;
  hp?: number | null;
  hpMax?: number;
  ruchLeft?: number;
  replaceUsedThisTurn?: boolean;
}

export interface UnitReplaceExecuteDeps<U extends UnitReplaceTarget> {
  /** Powód blokady przed kosztem (limit Super-jednostki, brak zapasu surowca wymaganego do wyboru) albo null. */
  gateReason(unit: U, newTypeId: string): string | null;
  /** Pełny koszt rekrutacji nowej jednostki w Pieniądzu. */
  moneyCost(newTypeId: string, unit: U): number;
  /** Pełny koszt surowcowy nowej jednostki (pusty obiekt = brak). */
  stockCost(newTypeId: string, unit: U): Record<string, number>;
  /** Czy pula państwa pokrywa `cost`. */
  canPayStock(cost: Record<string, number>, unit: U): boolean;
  /** Pobranie `cost` z puli państwa (wołane dopiero po przejściu WSZYSTKICH bramek). */
  payStock(cost: Record<string, number>, unit: U): void;
  currentTreasury(): number;
  setTreasury(value: number): void;
  oldMaxHp(unit: U): number;
  newMaxHp(unit: U, newTypeId: string): number;
  category(newTypeId: string): string;
  /** true = aktualizuj też cache `hpMax` (AI); gracz historycznie go nie dotykał. */
  syncHpMax?: boolean;
}

export type UnitReplaceResult =
  | { ok: true; oldTypeId: string; money: number; stock: Record<string, number> }
  | { ok: false; reason: 'used' | 'gate' | 'stock' | 'money'; detail?: string; money: number; stock: Record<string, number> };

/** Wykonaj zamianę `unit` na `newTypeId`. Mutuje wyłącznie przy sukcesie. */
export function executeUnitReplace<U extends UnitReplaceTarget>(
  unit: U,
  newTypeId: string,
  deps: UnitReplaceExecuteDeps<U>,
): UnitReplaceResult {
  if (unit.replaceUsedThisTurn) return { ok: false, reason: 'used', money: 0, stock: {} };
  const gate = deps.gateReason(unit, newTypeId);
  if (gate) return { ok: false, reason: 'gate', detail: gate, money: 0, stock: {} };

  const rawMoney = deps.moneyCost(newTypeId, unit);
  const money = Number.isFinite(rawMoney) && rawMoney > 0 ? Math.round(rawMoney) : 0;
  const stock = deps.stockCost(newTypeId, unit);
  const hasStock = Object.values(stock).some(amount => amount > 0);
  if (hasStock && !deps.canPayStock(stock, unit)) return { ok: false, reason: 'stock', money, stock };
  const treasury = deps.currentTreasury();
  if (treasury < money) return { ok: false, reason: 'money', money, stock };

  const oldMaxHp = deps.oldMaxHp(unit);
  const newMaxHp = deps.newMaxHp(unit, newTypeId);
  const oldHp = unit.hp ?? oldMaxHp;
  const newHp = Math.max(1, Math.round(newMaxHp * (oldMaxHp > 0 ? oldHp / oldMaxHp : 1)));

  if (money > 0) deps.setTreasury(treasury - money);
  if (hasStock) deps.payStock(stock, unit);

  const oldTypeId = unit.typeId;
  unit.typeId = newTypeId;
  unit.category = deps.category(newTypeId);
  unit.hp = newHp;
  if (deps.syncHpMax) unit.hpMax = newMaxHp;
  unit.ruchLeft = 0;
  unit.replaceUsedThisTurn = true;
  return { ok: true, oldTypeId, money, stock };
}
