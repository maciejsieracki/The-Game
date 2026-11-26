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
