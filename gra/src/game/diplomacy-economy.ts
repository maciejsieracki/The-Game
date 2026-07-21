/**
 * diplomacy-economy.ts — rozliczenia trybutu / handlu v1.1 (lane EKO).
 * SILNIK woła tick na endTurn; jednorazowy handel T3A osobno po akceptacji propozycji.
 */
import type { ActiveDeal } from './diplomacy-treaties';

export interface TreasuryAdapter {
  getPieniadze(ownerId: number): number;
  add(ownerId: number, delta: number): void;
}

export interface TributeDeal {
  id: string;
  kind: 'tribute';
  payerOwnerId: number;
  receiverOwnerId: number;
  pieniadzePerTura: number;
  doTury: number | null;
}

export interface TradeDeal {
  id: string;
  kind: 'trade';
  fromOwnerId: number;
  toOwnerId: number;
  tradeKind: 'once' | 'per_turn';
  payload: { pieniadze?: number; surowiec?: string; ilosc?: number };
  doTury?: number | null;
  perTurnGold?: number;
}

export type DiplomacyPaymentDeal = TributeDeal | TradeDeal;

export interface TickPaymentsResult {
  paid: string[];
  broken: string[];
  messages: string[];
}

/** Para ownerId do casus belli po zerwaniu trybutu T1A (płatnik → odbiorca). */
export interface TributeBreakPair {
  dealId: string;
  payerOwnerId: number;
  receiverOwnerId: number;
}

function isExpired(deal: { doTury?: number | null }, turn: number): boolean {
  return deal.doTury != null && turn > deal.doTury;
}

/** Mapuje aktywne traktaty CYW na ticki EKO (trybut/wasal per-tura). */
export function activeDealsToPaymentDeals(
  deals: readonly ActiveDeal[],
  turn: number,
): TributeDeal[] {
  const out: TributeDeal[] = [];
  for (const d of deals) {
    if (d.handelJednorazowy) continue;
    const perTurn = d.ekonomia?.pieniadzePerTura;
    if (perTurn == null || perTurn <= 0) continue;
    if (isExpired({ doTury: d.wygasaTura }, turn)) continue;
    out.push({
      id: d.id,
      kind: 'tribute',
      payerOwnerId: d.ekonomia!.payerOwnerId,
      receiverOwnerId: d.ekonomia!.receiverOwnerId,
      pieniadzePerTura: perTurn,
      doTury: d.wygasaTura,
    });
  }
  return out;
}

/**
 * T1A: co turę odejmij ze skarbca płatnika, dodaj odbiorcy.
 * Brak środków → id dealu w `broken` (SILNIK zerwie traktat + casus belli).
 */
export function tickDiplomacyPayments(
  deals: readonly DiplomacyPaymentDeal[],
  treasury: TreasuryAdapter,
  turn: number,
): TickPaymentsResult {
  const paid: string[] = [];
  const broken: string[] = [];
  const messages: string[] = [];

  for (const deal of deals) {
    if (isExpired(deal, turn)) continue;

    if (deal.kind === 'trade' && deal.tradeKind === 'once') continue;

    let amount = 0;
    let payer = 0;
    let receiver = 0;

    if (deal.kind === 'tribute') {
      amount = deal.pieniadzePerTura;
      payer = deal.payerOwnerId;
      receiver = deal.receiverOwnerId;
    } else {
      amount = deal.perTurnGold ?? deal.payload.pieniadze ?? 0;
      payer = deal.fromOwnerId;
      receiver = deal.toOwnerId;
    }

    if (amount <= 0) continue;

    const balance = treasury.getPieniadze(payer);
    if (balance < amount) {
      broken.push(deal.id);
      messages.push(`Trybut zerwany (${deal.id}): brak ${amount} ¤ u gracza ${payer}`);
      continue;
    }

    treasury.add(payer, -amount);
    treasury.add(receiver, amount);
    paid.push(deal.id);
    messages.push(`Trybut ${amount} ¤: ${payer} → ${receiver}`);
  }

  return { paid, broken, messages };
}

/** Mapuje zerwane id trybutu → pary do zastosowania casus belli w SILNIKU. */
export function tributeBreakPairsFromDeals(
  deals: readonly ActiveDeal[],
  brokenIds: readonly string[],
): TributeBreakPair[] {
  if (!brokenIds.length) return [];
  const drop = new Set(brokenIds);
  const out: TributeBreakPair[] = [];
  for (const d of deals) {
    if (!drop.has(d.id)) continue;
    const eco = d.ekonomia;
    if (!eco?.pieniadzePerTura || eco.pieniadzePerTura <= 0) continue;
    out.push({
      dealId: d.id,
      payerOwnerId: eco.payerOwnerId,
      receiverOwnerId: eco.receiverOwnerId,
    });
  }
  return out;
}

/** T3A: jednorazowy transfer złota po akceptacji handlu / trybutu oferta. */
export function applyOneShotGoldTransfer(
  fromOwnerId: number,
  toOwnerId: number,
  amount: number,
  treasury: TreasuryAdapter,
): { ok: boolean; reason?: string } {
  if (amount <= 0) return { ok: false, reason: 'Kwota musi być > 0' };
  const balance = treasury.getPieniadze(fromOwnerId);
  if (balance < amount) {
    return { ok: false, reason: `Brak środków (${balance} < ${amount} ¤)` };
  }
  treasury.add(fromOwnerId, -amount);
  treasury.add(toOwnerId, amount);
  return { ok: true };
}

/**
 * Propozycja AI → gracz (zaproponuj_handel / oferuj_trybut_za_pokoj):
 * gracz dostaje pełną kwotę; AI płaci tyle, ile ma w skarbcu (reszta = grant dyplomatyczny).
 */
export function applyDiplomaticGoldGrant(
  fromOwnerId: number,
  toOwnerId: number,
  amount: number,
  treasury: TreasuryAdapter,
): { ok: boolean; granted: number; reason?: string } {
  if (amount <= 0) return { ok: false, granted: 0, reason: 'Kwota musi być > 0' };
  const fromBalance = treasury.getPieniadze(fromOwnerId);
  const deduct = Math.min(fromBalance, amount);
  if (deduct > 0) treasury.add(fromOwnerId, -deduct);
  treasury.add(toOwnerId, amount);
  return { ok: true, granted: amount };
}
