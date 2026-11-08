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

/**
 * Klucz cooldownu oferty miasta za pokój (`oferuj_miasto_za_pokoj` / `zada_miasto_za_pokoj`).
 * Te komendy mają actionId 'pokoj' (ten sam stół co zwykły pokój), więc bez osobnego klucza
 * odrzucenie oferty miasta blokowało też zwykłą propozycję pokoju od tej samej AI.
 * Decyzja właściciela (2026-11-08, ABC): osobny klucz, długość cooldownu bez zmian.
 */
export const CITY_FOR_PEACE_COOLDOWN_KEY = 'miasto_za_pokoj' as const;

/** Klucz cooldownu: typ akcji stołu albo osobny klucz oferty miasta za pokój. */
export type RejectCooldownKey = ProposalActionId | typeof CITY_FOR_PEACE_COOLDOWN_KEY;

/**
 * Wyznacza klucz cooldownu dla komendy AI (typ komendy + actionId z konwertera).
 * Komendy miasta za pokój dostają osobny klucz; wszystkie pozostałe — actionId jak dotąd.
 */
export function rejectCooldownKeyFor(cmdType: string, actionId: ProposalActionId): RejectCooldownKey {
  if (cmdType === 'oferuj_miasto_za_pokoj' || cmdType === 'zada_miasto_za_pokoj') {
    return CITY_FOR_PEACE_COOLDOWN_KEY;
  }
  return actionId;
}

export interface RejectedOfferCooldown {
  /** Id właściciela AI (partner gracza, ownerId ≠ 0). */
  partnerOwnerId: number;
  /** Typ umowy/akcji (np. nap, sojusz_defensywny, handel) lub klucz oferty miasta. */
  actionId: RejectCooldownKey;
  /** Tura, w której gracz kliknął Odrzuć. */
  rejectedAtTurn: number;
  /** Pierwsza tura, w której AI MOŻE ponownie zaproponować tę akcję (wyłącznie). */
  expiresAtTurn: number;
}

export function makeRejectedOfferCooldown(
  partnerOwnerId: number,
  actionId: RejectCooldownKey,
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
  actionId: RejectCooldownKey,
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
  actionId: RejectCooldownKey,
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
