/**
 * unit-replace-cost.ts
 *
 * R-WEB-UNIT-REPLACE-COST-AND-PROMOTION-IMPL-Q1 (decyzja właściciela 2026-11-09, D1 = wariant C):
 * "Zastąp" (gracz I AI -- JEDNA funkcja kosztu) kosztuje PEŁNY koszt rekrutacji nowej jednostki,
 * jak rekrutacja od zera:
 *   - Pieniądz: pełny koszt nowej jednostki (NIE różnica nowa - stara),
 *   - surowiec: pełne `Surowiec` / `Surowiec (ilość)` z units.json (unitStockCost, w tym +Konie
 *     dla Typ=Mount), pobierane z puli PAŃSTWA tym samym mechanizmem co rekrutacja
 *     (deductBuildingStockCostAcrossCities).
 * Różnica względem rekrutacji: jednostka już istnieje -- zachowuje wyszkolenie (battlesSurvived/
 * weteran, pancerzBonusProc, parametryBonusProc, wódz/armia, HP%) i NIE zużywa Manpower/Ludności.
 *
 * Pure (bez DOM) -- bundlowane i testowane wprost w tools/unit-replace-full-cost-test.cjs.
 */

import {
  missingStockFor,
  stockResourceLabel,
  unitStockCost,
  type UnitStockCostSource,
} from './building-stock-cost';

export interface UnitReplaceCost {
  /** Pełny koszt rekrutacji nowej jednostki w Pieniądzu (po bonusach cywilizacji/trudności). */
  money: number;
  /** Pełny koszt surowcowy (klucze ASCII jak City.surowce, np. { braz: 25 }). */
  stock: Record<string, number>;
}

/** Pełny koszt "Zastąp" = pełny koszt rekrutacji nowej jednostki (D1 = C). */
export function unitReplaceFullCost(
  newDef: UnitStockCostSource | null | undefined,
  moneyCost: number,
): UnitReplaceCost {
  return {
    money: Number.isFinite(moneyCost) && moneyCost > 0 ? Math.round(moneyCost) : 0,
    stock: unitStockCost(newDef),
  };
}

/** Brakujące surowce (puste = pula pokrywa cały koszt). */
export function unitReplaceStockMissing(
  cost: UnitReplaceCost,
  pool: Readonly<Record<string, number>> | undefined,
): Record<string, number> {
  return missingStockFor(pool ? { ...pool } : undefined, cost.stock);
}

/** Czy skarbiec i pula państwa pokrywają PEŁNY koszt zamiany. */
export function canAffordUnitReplace(
  cost: UnitReplaceCost,
  treasury: number,
  pool: Readonly<Record<string, number>> | undefined,
): boolean {
  if (treasury < cost.money) return false;
  return Object.keys(unitReplaceStockMissing(cost, pool)).length === 0;
}

/** Polski opis brakującego surowca ("Brakuje w magazynie państwa: 25 Brąz") albo null. */
export function unitReplaceStockMissingLabel(
  cost: UnitReplaceCost,
  pool: Readonly<Record<string, number>> | undefined,
): string | null {
  const missing = unitReplaceStockMissing(cost, pool);
  const parts = Object.entries(missing).map(([key, amount]) => `${amount} ${stockResourceLabel(key)}`);
  return parts.length > 0 ? `Brakuje w magazynie państwa: ${parts.join(', ')}` : null;
}

/** Krótki opis kosztu surowcowego do UI ("25 Brąz, 25 Koń") albo '' gdy brak. */
export function unitReplaceStockText(cost: UnitReplaceCost): string {
  return Object.entries(cost.stock)
    .filter(([, amount]) => amount > 0)
    .map(([key, amount]) => `${amount} ${stockResourceLabel(key)}`)
    .join(', ');
}

/**
 * Ślad zużytych surowców po zamianie (stockPaid -- zwrot przy rozwiązaniu jednostki,
 * R-WEB-DISBAND-REFUND-RESOURCES-Q1). Zamiana zużyła surowce nowej jednostki, więc doliczamy je
 * do dotychczasowego śladu: "100% tego, co zużyto" pozostaje prawdą (suma stara + nowa).
 */
export function mergeStockPaid(
  previous: Readonly<Record<string, number>> | undefined,
  added: Readonly<Record<string, number>>,
): Record<string, number> {
  const out: Record<string, number> = { ...(previous ?? {}) };
  for (const [key, amount] of Object.entries(added)) {
    if (typeof amount === 'number' && Number.isFinite(amount) && amount > 0) {
      out[key] = (out[key] ?? 0) + amount;
    }
  }
  return out;
}
