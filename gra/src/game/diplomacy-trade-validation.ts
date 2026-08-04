/**
 * Walidacja stron koszyka wymiany — logika czysta (testowalna bez UI).
 * R-DYPLO-WYMIANA-ONEWAY-Q1=A
 */
import type { BasketItem } from './diplomacy-pn-engine';

export type TradeBasketMode = 'trade' | 'gift' | 'treaty';

export interface TradeBasketSidesValidation {
  valid: boolean;
  reason?: string;
}

/** Minimalna walidacja niepustości stron koszyka (trade / gift). */
export function validateTradeBasketSides(
  mode: TradeBasketMode,
  giveItems: readonly BasketItem[],
  receiveItems: readonly BasketItem[],
): TradeBasketSidesValidation {
  if (mode === 'gift') {
    if (giveItems.length === 0) {
      return { valid: false, reason: 'Dodaj co najmniej jedną pozycję do daru' };
    }
    return { valid: true };
  }
  if (mode === 'trade') {
    if (giveItems.length === 0 && receiveItems.length === 0) {
      return {
        valid: false,
        reason: 'Dodaj co najmniej jedną pozycję w „Co oddaję" lub „Co dostaję"',
      };
    }
    return { valid: true };
  }
  return { valid: true };
}
