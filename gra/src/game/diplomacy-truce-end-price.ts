// R-WEB-DIPLO-TRUCE-END-PEACE-PRICE-Q1 — koniec rozejmu = propozycja pokoju z CENĄ (nie pokój za darmo).
//
// Decyzja właściciela 2026-11-26 (ECHO w rejestrze): różnica siły wojskowej ≤20% w którąkolwiek stronę →
// strona przegrywająca (mniejsza moc; remis → strona, która prosiła o rozejm) płaci SUROWCAMI, miasto nie
// jest wymagane; różnica >20% → słabsza strona płaci MIASTEM. Próg 20% z diplomacy-war-peace-params.json
// (przewagaMilitarna.prog) — nie do negocjacji. Dokładnie +20% to NIE przewaga (jak w przewagaMilitarna._opis).
//
// PURE: bez DOM / stanu gry. Siłę (sumArmyMForOwner) podaje main.ts przez porty truceEndPorts.

import { WAR_PEACE_PARAMS } from './diplomacy-war-peace-profile';

/** Waluta ceny pokoju po rozejmie: surowce (ogon: złoto → brąz → żelazo → rudy) albo miasto (cesja). */
export type TruceEndPayCurrency = 'surowce' | 'miasto';

export interface TruceEndPriceInput {
  /** Strona, która prosiła o rozejm (remis sił → ona płaci). */
  initiatorId: number;
  /** Dwie strony pary. Inicjator musi należeć do pary. */
  a: number;
  b: number;
  /** Moc wojskowa (suma M_pole armii) stron w chwili końca rozejmu. */
  armyA: number;
  armyB: number;
  /** Próg przewagi (ułamek). Domyślnie przewagaMilitarna.prog = 0.2. */
  prog?: number;
}

export interface TruceEndPriceRule {
  /** 'within' = różnica ≤ prog (surowce); 'outside' = różnica > prog (miasto). */
  band: 'within' | 'outside';
  /** Strona płacąca (przegrywająca / słabsza / inicjator przy remisie). */
  payerId: number;
  /** Strona otrzymująca zapłatę. */
  payeeId: number;
  currency: TruceEndPayCurrency;
}

/**
 * Reguła ceny pokoju po końcu rozejmu. Zwraca null, gdy dane są nieprawidłowe (inicjator spoza pary,
 * nie-skończona lub ujemna moc). Puste armie obu stron (0 vs 0) = remis → płaci inicjator (surowce).
 */
export function truceEndPriceRule(input: TruceEndPriceInput): TruceEndPriceRule | null {
  const { initiatorId, a, b, armyA, armyB } = input;
  if (initiatorId !== a && initiatorId !== b) return null;
  if (a === b) return null;
  if (!Number.isFinite(armyA) || !Number.isFinite(armyB) || armyA < 0 || armyB < 0) return null;
  const prog = input.prog ?? WAR_PEACE_PARAMS.przewagaMilitarna.prog;
  const eps = WAR_PEACE_PARAMS.przewagaMilitarna.epsilon;
  const hi = Math.max(armyA, armyB);
  const lo = Math.min(armyA, armyB);
  // Pasmo ±prog: silniejsza ≤ (1 + prog) × słabsza (granica włącznie — dokładnie +20% nie jest przewagą).
  // Przy słabszej = 0 i silniejszej > 0 warunek nie zachodzi → przedział 'outside'.
  const within = hi <= (1 + prog + eps) * lo;
  const other = (id: number): number => (id === a ? b : a);
  if (within) {
    if (armyA === armyB) {
      return { band: 'within', payerId: initiatorId, payeeId: other(initiatorId), currency: 'surowce' };
    }
    const weakerId = armyA < armyB ? a : b;
    return { band: 'within', payerId: weakerId, payeeId: other(weakerId), currency: 'surowce' };
  }
  const weakerId = armyA < armyB ? a : b;
  return { band: 'outside', payerId: weakerId, payeeId: other(weakerId), currency: 'miasto' };
}

/**
 * R-WEB-DIPLO-TRUCE-END-PRICE-3-Q1 (10B): cena pokoju po końcu rozejmu. Wyliczona cena > 0 → bez zmian;
 * cena 0 (brak przewagi wyceny) → symboliczna opłata (pokojPoRozejmie.minimalnaOplataSymbolicznaPn), a NIE wojna.
 * NaN / nieskończoność = brak ceny → 0 (wojna, jak dotąd). Jedno źródło prawdy dla oferty, okna i płatności.
 */
export function truceEndDuePn(
  requiredPn: number,
  symbolicPn: number = WAR_PEACE_PARAMS.pokojPoRozejmie.minimalnaOplataSymbolicznaPn,
): number {
  if (!Number.isFinite(requiredPn)) return 0;
  if (requiredPn > 0) return requiredPn;
  return Number.isFinite(symbolicPn) && symbolicPn > 0 ? symbolicPn : 0;
}

/**
 * R-WEB-DIPLO-TRUCE-END-PRICE-3-Q1 (11A): wariant zastępczy surowcami w oknie propozycji gracza. Przy walucie
 * miejskiej (pasmo >20%) bez cedowalnego miasta pakiet surowców o wartości ≥ ceny pokrywa pokój (to samo co
 * pickTruceEndSettlementPlan: plan miastem niepełny → plan surowcami).
 */
export function truceEndSurowceSubstituteCovers(requiredPn: number, offeredSurowcePn: number, cityAvailable: boolean): boolean {
  if (!Number.isFinite(requiredPn) || requiredPn <= 0) return false;
  return !cityAvailable && Number.isFinite(offeredSurowcePn) && offeredSurowcePn >= requiredPn;
}

/** Minimalny kształt planu płatności (zgodny z peacePlanWithTail w main.ts). */
export interface TruceEndPlanLike {
  readonly full: boolean;
  readonly coveredPn: number;
  readonly items: ReadonlyArray<unknown>;
}

export interface TruceEndPlanInput<P extends TruceEndPlanLike> {
  /** Wymagana cena w jednostkach wyceny (z aiAiPeacePriceFor). */
  requiredPn: number;
  /** Waluta z reguły ceny (truceEndPriceRule). */
  currency: TruceEndPayCurrency;
  /** Plan płatności miastem (tylko miasta płatnika). */
  planCity: () => P;
  /** Plan płatności surowcami (ogon złoto → brąz → żelazo → rudy, bez miast). */
  planTail: () => P;
  /** Dodatkowy warunek (np. bilans PW dla pary AI↔AI). */
  balanceOk: (plan: P) => boolean;
}

/**
 * R-WEB-DIPLO-TRUCE-END-PEACE-PRICE-Q1: wybór planu płatności po końcu rozejmu. Czysta funkcja (testowalna).
 * - cena ≤ 0 (lub nieskończona) → null: pokój po rozejmie nie może być za darmo;
 * - waluta 'miasto': najpierw plan miastem; gdy niepełny (brak cedowalnego miasta, np. stolica/ostatnie miasto)
 *   → wariant zastępczy: plan surowcami z tego samego koszyka (założenie Operatora wg dispatchu, pkt 4);
 * - plan musi pokrywać cenę w całości (full), mieć pozycje i przejść balanceOk; inaczej null (brak pokoju, wojna).
 */
export function pickTruceEndSettlementPlan<P extends TruceEndPlanLike>(
  input: TruceEndPlanInput<P>,
): { plan: P; currency: TruceEndPayCurrency } | null {
  if (!Number.isFinite(input.requiredPn) || input.requiredPn <= 0) return null;
  if (input.currency === 'miasto') {
    const cityPlan = input.planCity();
    if (cityPlan.full && cityPlan.items.length > 0 && input.balanceOk(cityPlan)) {
      return { plan: cityPlan, currency: 'miasto' };
    }
  }
  const tailPlan = input.planTail();
  if (tailPlan.full && tailPlan.items.length > 0 && input.balanceOk(tailPlan)) {
    return { plan: tailPlan, currency: 'surowce' };
  }
  return null;
}

/**
 * Treść oferty pokoju po rozejmie w skrzynce gracza: kierunek, waluta i wartość ceny (bez nazw technicznych).
 * payerIsHuman: true → płaci gracz; false → płaci AI.
 */
export function truceEndOfferReason(rule: TruceEndPriceRule, payerIsHuman: boolean, requiredPn: number): string {
  const kto = payerIsHuman ? 'Ty płacisz' : 'AI płaci';
  const czym = rule.currency === 'miasto' ? 'miastem' : 'surowcami (złoto, brąz, żelazo, rudy)';
  const wartosc = Number.isFinite(requiredPn) ? Math.max(0, Math.round(requiredPn)) : 0;
  return `Rozejm wygasł — pokój stały za cenę: ${kto} ${czym}, wartość ok. ${wartosc} (odmowa = wojna)`;
}

/**
 * R-WEB-DIPLO-TRUCE-END-PEACE-PRICE-2-Q1 (pkt 2): wykonanie płatności ceny pokoju po rozejmie.
 * Wybór planu = pickTruceEndSettlementPlan; gdy plan ma pozycje, `transfer` (port żywego stanu: przelew
 * surowców i cesja miasta, np. transferBasketItems w main.ts) wołany DOKŁADNIE RAZ z płatnikiem i odbiorcą.
 * Zwraca wybrany plan (płatność pokrywa cenę) albo null (brak pokoju, bez żadnego przelewu).
 */
export function executeTruceEndSettlement<P extends TruceEndPlanLike>(
  input: TruceEndPlanInput<P>,
  payerId: number,
  payeeId: number,
  transfer: (plan: P, payerId: number, payeeId: number) => void,
): { plan: P; currency: TruceEndPayCurrency } | null {
  const pick = pickTruceEndSettlementPlan(input);
  if (pick == null) return null;
  if (pick.plan.items.length > 0) transfer(pick.plan, payerId, payeeId);
  return pick;
}
