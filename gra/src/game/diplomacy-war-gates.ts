/**
 * diplomacy-war-gates.ts — wspólne bramki wojny (Maciej 2026-08-01).
 * - Aktywny pakt nieagresji blokuje DOW (AI/PM, nie gracz — gracz może zerwać z karą).
 * - W trakcie wojny złoto/praca tylko w kontekście ugody pokojowej.
 */

import type { BasketItem } from './diplomacy-pn-engine';

/** Akcje, w których płatność złotem/pracą jest częścią ugody pokojowej. */
export const PEACE_CURRENCY_ACTION_IDS = new Set(['pokoj', 'trybut_oferta']);

export function isPeaceCurrencyAction(actionId: string): boolean {
  return PEACE_CURRENCY_ACTION_IDS.has(actionId);
}

/** Czy aktywny pakt nieagresji uniemożliwia wypowiedzenie wojny (AI / państwo-miasto). */
export function isNapBlockingWarDeclaration(hasActiveNapTreaty: boolean): boolean {
  return hasActiveNapTreaty;
}

function basketHasCurrencyPayment(items: readonly BasketItem[] | undefined): boolean {
  if (!items?.length) return false;
  return items.some(i => i.typ === 'zloto' || i.typ === 'praca');
}

export interface CurrencyPayloadSlice {
  goldOnce?: number;
  goldPerTurn?: number;
  giveItems?: readonly BasketItem[];
  receiveItems?: readonly BasketItem[];
}

/** Czy payload zawiera płatność złotem lub pracą. */
export function payloadHasCurrencyPayment(payload: CurrencyPayloadSlice | undefined): boolean {
  if (!payload) return false;
  if ((payload.goldOnce ?? 0) > 0) return true;
  if ((payload.goldPerTurn ?? 0) > 0) return true;
  return basketHasCurrencyPayment(payload.giveItems)
    || basketHasCurrencyPayment(payload.receiveItems);
}

/**
 * W trakcie wojny zwykły handel/dar z pieniędzmi jest zabroniony.
 * Dozwolone tylko w propozycji pokoju lub ofercie trybutu za pokój.
 */
export function isCurrencyProposalForbiddenDuringWar(
  actionId: string,
  payload?: CurrencyPayloadSlice,
  atWar = true,
): boolean {
  if (!atWar) return false;
  if (!payloadHasCurrencyPayment(payload)) return false;
  return !isPeaceCurrencyAction(actionId);
}
