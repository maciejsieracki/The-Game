/**
 * ai-unit-replace-plan.ts
 *
 * R-WEB-AI-UNIT-REPLACE-SAME-RULES-AS-PLAYER-Q1: planowanie zamian jednostek AI (kolejność,
 * wykluczenia, limit na turę, zachowanie klasy armii). Samo wykonanie i koszt: wspólny moduł
 * `unit-replace-execute.ts` (+ `unit-replace-cost.ts`) -- te same dla gracza i AI.
 *
 * Pure (bez DOM).
 */

import { armyClassOfUnit } from './ur-army-shim';
import { shouldAIPurchaseUnit, type AiPurchaseReserveParams } from './ai-purchase-web';

/** Maksymalny odsetek armii (jednostek wojskowych właściciela) zamienianych w JEDNEJ turze AI. */
export const AI_UNIT_REPLACE_MAX_FRACTION = 0.1;

/** Wczytuje limit udziału armii zamienianej w turze; brak/niepoprawny wpis zachowuje dawną wartość. */
export function loadAiUnitReplaceMaxFraction(
  data: { aiParams?: Record<string, { wartosc?: unknown } | undefined> },
): number {
  const value = data.aiParams?.ai_zamiana_jednostek_limit_udzial?.wartosc;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : AI_UNIT_REPLACE_MAX_FRACTION;
}

/** Limit udanych zamian w turze: ≤ 10% armii, ale co najmniej 1 gdy armia niepusta. */
export function aiUnitReplaceCap(militaryCount: number, fraction = AI_UNIT_REPLACE_MAX_FRACTION): number {
  if (!(militaryCount > 0)) return 0;
  return Math.max(1, Math.floor(militaryCount * fraction));
}

export interface AiReplaceUnitInfo {
  /** Numer epoki aktualnej definicji jednostki. */
  epoch: number;
  /** Siła aktualnej definicji (Atak + Obrona + ...): mniejsza = słabsza = wcześniej. */
  power: number;
  /** Jednostka nie może być zamieniona w tej turze (bitwa, oblężenie, marsz, bezpośrednie zagrożenie, poza terytorium...). */
  blocked: boolean;
}

/** Jednostki do rozważenia, od najstarszych/najsłabszych; zablokowane odfiltrowane. */
export function planAiUnitReplaceOrder<U>(units: readonly U[], info: (unit: U) => AiReplaceUnitInfo): U[] {
  const rows = units.map((unit, index) => ({ unit, index, i: info(unit) })).filter(row => !row.i.blocked);
  rows.sort((a, b) => (a.i.epoch - b.i.epoch) || (a.i.power - b.i.power) || (a.index - b.index));
  return rows.map(row => row.unit);
}

/**
 * Zamiana zachowuje klasę armii (wręcz/dystans/konnica) -- skład armii AI (ARMY-COMPOSITION)
 * nie przesuwa się. Klasa nieznana po którejkolwiek stronie (np. Super, machina) = dozwolone.
 */
export function aiReplaceKeepsArmyClass(
  oldDef: { Typ?: string | null } | null | undefined,
  newDef: { Typ?: string | null } | null | undefined,
): boolean {
  const a = armyClassOfUnit(oldDef);
  const b = armyClassOfUnit(newDef);
  return a === null || b === null || a === b;
}

/**
 * R-WEB-AI-UNIT-REPLACE-SAME-RULES-AS-PLAYER-Q1 (r2, zarzut Evaluatora 1): zamiana AI płaci PEŁNY
 * koszt, więc musi przejść TĘ SAMĄ regułę rezerwy utrzymania co zakup AI (shouldAIPurchaseUnit,
 * R-WEB-AI-PURCHASE-MAINTENANCE-RESERVE-Q1): po zapłaceniu skarbiec pokrywa `rezerwaTur` tur PEŁNEGO
 * utrzymania, a dochód netto nie spada poniżej `minDochodNetto` (AI 10/3/0 tur, Łatwy/Normalny/Trudny).
 * Zamiana nie zwiększa liczby jednostek, więc nie zużywa Manpower (hasManpower: true = brak bramki
 * ludności, jak w promoteAiUnitForEra). Brak danych rezerwy (tura 1, brak przychodu z ticku) =
 * zachowanie dawne: wystarczy skarbiec na cenę.
 */
export interface AiReplaceReserveInput {
  treasury: number;
  /** Pełny koszt Pieniądza nowej jednostki (ten sam, co pobierany przez executeUnitReplace). */
  moneyCost: number;
  reserve?: AiPurchaseReserveParams;
  netIncomePerTurn?: number;
  upkeepPerTurn?: number;
  /** Przyrost utrzymania po zamianie (>= 0; oszczędność nie jest odejmowana = bezpieczniej). */
  unitUpkeepPerTurn?: number;
}

export function aiReplaceReserveOk(inp: AiReplaceReserveInput): boolean {
  return shouldAIPurchaseUnit({
    treasury: inp.treasury,
    goldCost: Math.max(0, inp.moneyCost),
    hasManpower: true,
    reserve: inp.reserve,
    netIncomePerTurn: inp.netIncomePerTurn,
    upkeepPerTurn: inp.upkeepPerTurn,
    unitUpkeepPerTurn: inp.unitUpkeepPerTurn,
  });
}
