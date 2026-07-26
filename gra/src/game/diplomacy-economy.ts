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

/** Maks. kwota złota w propozycji AI (faktyczna = min(skarbiec, max)). */
export const AI_TRADE_GOLD_MAX = 20;
export const AI_TRIBUTE_PEACE_MAX = 50;

/**
 * Cooldown jednorazowego daru ¤ (propozycja zaproponuj_handel) per para AI→gracz.
 * Maciej 2026-07-22: miasta-państwa spamowały co turę — jeden dar, potem cisza.
 */
export const AI_ONESHOT_GIFT_COOLDOWN_TURNS: Record<'easy' | 'normal' | 'hard', number> = {
  easy: 15,
  normal: 25,
  hard: 35,
};

/** Mnożnik kwoty jednorazowego daru wg trudności (łatwy = więcej, trudny = mniej). */
export const AI_ONESHOT_GIFT_GOLD_MULT: Record<'easy' | 'normal' | 'hard', number> = {
  easy: 1.25,
  normal: 1.0,
  hard: 0.75,
};

export function aiOneShotGiftCooldownTurns(difficulty: 'easy' | 'normal' | 'hard'): number {
  return AI_ONESHOT_GIFT_COOLDOWN_TURNS[difficulty];
}

export function aiOneShotGiftGoldMultiplier(difficulty: 'easy' | 'normal' | 'hard'): number {
  return AI_ONESHOT_GIFT_GOLD_MULT[difficulty];
}

/** Czy AI może zaproponować kolejny jednorazowy dar ¤ (bez umowy handlowej/trybutu). */
export function canAiProposeOneShotGoldGift(
  currentTurn: number,
  lastGiftTurn: number | undefined,
  difficulty: 'easy' | 'normal' | 'hard',
): boolean {
  if (lastGiftTurn == null || lastGiftTurn <= 0) return true;
  return currentTurn >= lastGiftTurn + aiOneShotGiftCooldownTurns(difficulty);
}

/** Oferta AI = tyle, ile ma w skarbcu (cap opcjonalny). 0 gdy pusty skarbiec. */
export function capAiGoldOffer(balance: number, maxOffer: number): number {
  if (!Number.isFinite(balance) || balance <= 0) return 0;
  return Math.min(Math.floor(balance), maxOffer);
}

// ---------------------------------------------------------------------------
// E6 (2026-07-23): AI proaktywnie proponuje STAŁĄ Umowę Handlową (RodzajTraktatu.
// UmowaHandlowa) — gracz↔AI, przez istniejący mechanizm propozycji przychodzących
// (pendingDiplomacyInbox). Wartości poniżej to PLACEHOLDERY do strojenia przez
// właściciela po playteście — nie balansowane na żywej rozgrywce.
// ---------------------------------------------------------------------------

/**
 * Cooldown proaktywnej propozycji Umowy Handlowej — co N tur, deterministycznie
 * per para (bez Math.random(), analogicznie do AI_ONESHOT_GIFT_COOLDOWN_TURNS).
 * PLACEHOLDER (Maciej, do strojenia): N=5.
 */
export const AI_TRADE_AGREEMENT_PROPOSAL_COOLDOWN_TURNS = 5;

/**
 * Margines Relacji poniżej którego oferta dokłada drobny jednorazowy "osłodzik"
 * w złocie (Relacja blisko progu = AI chce przekonać, nie tylko zaproponować).
 * PLACEHOLDER (Maciej, do strojenia): próg + 15.
 */
export const AI_TRADE_AGREEMENT_SWEETENER_MARGIN = 15;

/** Maks. kwota osłodzika (¤) — jak AI_TRADE_GOLD_MAX, ale osobna stała do strojenia. */
export const AI_TRADE_AGREEMENT_SWEETENER_MAX = 15;

/** Czy AI może zaproponować kolejną STAŁĄ Umowę Handlową tej samej parze. */
export function canAiProposeTradeAgreement(
  currentTurn: number,
  lastProposalTurn: number | undefined,
  cooldownTurns: number = AI_TRADE_AGREEMENT_PROPOSAL_COOLDOWN_TURNS,
): boolean {
  if (lastProposalTurn == null || lastProposalTurn <= 0) return true;
  return currentTurn >= lastProposalTurn + cooldownTurns;
}

// ---------------------------------------------------------------------------
// HANDEL-SUROWCE-CYKL (2026-07-24) — AI proponuje CYKLICZNY handel surowcem
// (nadwyżka → partner) analogicznie do AI_TRADE_AGREEMENT_* powyżej. Reguły
// ownerId-agnostyczne — main.ts oblicza nadwyżkę/brak dla DOWOLNEJ pary
// (gracz↔AI lub AI↔AI) tym samym kodem (pickResourceSurplusForOwnerPair).
// ---------------------------------------------------------------------------

/** Cooldown proaktywnej propozycji handlu surowcem — co N tur, per para. PLACEHOLDER: N=8. */
export const AI_RESOURCE_TRADE_PROPOSAL_COOLDOWN_TURNS = 8;

/** Cooldown krótszy przy deficycie (pilność zakupu). */
export const AI_RESOURCE_TRADE_DEFICIT_COOLDOWN_TURNS = 4;

/** Cooldown dla miast-państw przy krytycznym deficycie. */
export const AI_RESOURCE_TRADE_CITYSTATE_URGENT_COOLDOWN_TURNS = 3;

/** Cooldown prośby AI o audiencję (inicjatywa handlowa bez kontaktu gracza). */
export const AI_AUDIENCE_REQUEST_COOLDOWN_TURNS = 10;

export function canAiRequestAudience(
  currentTurn: number,
  lastRequestTurn: number | undefined,
  cooldownTurns: number = AI_AUDIENCE_REQUEST_COOLDOWN_TURNS,
): boolean {
  if (lastRequestTurn == null || lastRequestTurn <= 0) return true;
  return currentTurn >= lastRequestTurn + cooldownTurns;
}

/** Domyślny czas trwania cyklicznej umowy surowcowej proponowanej przez AI (tur). PLACEHOLDER: 10. */
export const AI_RESOURCE_TRADE_DEFAULT_TURNS = 10;

/** Ile pakietów/turę AI oferuje na raz z nadwyżki (nie wyprzedaje całego zapasu jednorazowo). PLACEHOLDER: 3. */
export const AI_RESOURCE_TRADE_MAX_PAKIETY_PER_TURA = 3;

/** Czy AI może zaproponować kolejną cykliczną umowę surowcową tej samej parze. */
export function canAiProposeResourceTrade(
  currentTurn: number,
  lastProposalTurn: number | undefined,
  cooldownTurns: number = AI_RESOURCE_TRADE_PROPOSAL_COOLDOWN_TURNS,
): boolean {
  if (lastProposalTurn == null || lastProposalTurn <= 0) return true;
  return currentTurn >= lastProposalTurn + cooldownTurns;
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
 * @deprecated Użyj applyOneShotGoldTransfer — strict: transfer tylko przy pełnej kwocie w skarbcu.
 */
export function applyDiplomaticGoldGrant(
  fromOwnerId: number,
  toOwnerId: number,
  amount: number,
  treasury: TreasuryAdapter,
): { ok: boolean; granted: number; reason?: string } {
  const result = applyOneShotGoldTransfer(fromOwnerId, toOwnerId, amount, treasury);
  if (!result.ok) return { ok: false, granted: 0, reason: result.reason };
  return { ok: true, granted: amount };
}
