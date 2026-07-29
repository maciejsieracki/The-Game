/**
 * diplomacy-rejection-cooldown.ts — D-DYPLO-AI-NO-NAG (Maciej 2026-07-29).
 *
 * Po odrzuceniu propozycji AI przez gracza (Odrzuć na stole negocjacyjnym) AI nie
 * powtarza TEJ SAMEJ akcji (partner + typ umowy) przez AI_REJECTED_OFFER_COOLDOWN_TURNS
 * pełnych tur. Inne typy (np. NAP vs handel) są dozwolone.
 */

import type { ProposalActionId } from './diplomacy-proposals';

/** Ile pełnych tur AI nie powtarza tej samej akcji po odrzuceniu przez gracza. */
export const AI_REJECTED_OFFER_COOLDOWN_TURNS = 3;

export interface RejectedOfferCooldown {
  /** Id właściciela AI (partner gracza, ownerId ≠ 0). */
  partnerOwnerId: number;
  /** Typ umowy/akcji (np. nap, sojusz_defensywny, handel). */
  actionId: ProposalActionId;
  /** Tura, w której gracz kliknął Odrzuć. */
  rejectedAtTurn: number;
  /** Pierwsza tura, w której AI MOŻE ponownie zaproponować tę akcję (wyłącznie). */
  expiresAtTurn: number;
}

export function makeRejectedOfferCooldown(
  partnerOwnerId: number,
  actionId: ProposalActionId,
  rejectedAtTurn: number,
  cooldownTurns: number = AI_REJECTED_OFFER_COOLDOWN_TURNS,
): RejectedOfferCooldown {
  return {
    partnerOwnerId,
    actionId,
    rejectedAtTurn,
    expiresAtTurn: rejectedAtTurn + cooldownTurns,
  };
}

/** Partner AI z wpisu stołu (gracz = ownerId 0). */
export function negotiationPartnerOwnerId(
  proposerOwnerId: number,
  responderOwnerId: number,
): number {
  return proposerOwnerId === 0 ? responderOwnerId : proposerOwnerId;
}

/** Czy para gracz↔partner ma aktywny cooldown na dany typ akcji. */
export function isOfferRejectedOnCooldown(
  cooldowns: readonly RejectedOfferCooldown[],
  partnerOwnerId: number,
  actionId: ProposalActionId,
  currentTurn: number,
): boolean {
  return cooldowns.some(
    c =>
      c.partnerOwnerId === partnerOwnerId
      && c.actionId === actionId
      && currentTurn < c.expiresAtTurn,
  );
}

/** Zapisuje odrzucenie — nadpisuje starszy wpis tej samej pary + akcji. */
export function recordRejectedOffer(
  cooldowns: readonly RejectedOfferCooldown[],
  partnerOwnerId: number,
  actionId: ProposalActionId,
  rejectedAtTurn: number,
  cooldownTurns: number = AI_REJECTED_OFFER_COOLDOWN_TURNS,
): RejectedOfferCooldown[] {
  const entry = makeRejectedOfferCooldown(partnerOwnerId, actionId, rejectedAtTurn, cooldownTurns);
  const filtered = cooldowns.filter(
    c => !(c.partnerOwnerId === partnerOwnerId && c.actionId === actionId),
  );
  return [...filtered, entry];
}

/** Usuwa wygasłe wpisy (sprzątanie przy zapisie / wczytaniu). */
export function pruneExpiredRejectedOffers(
  cooldowns: readonly RejectedOfferCooldown[],
  currentTurn: number,
): RejectedOfferCooldown[] {
  return cooldowns.filter(c => currentTurn < c.expiresAtTurn);
}
