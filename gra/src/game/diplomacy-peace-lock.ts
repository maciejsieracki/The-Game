/**
 * diplomacy-peace-lock.ts — karencja po zawarciu pokoju / rozejmu (Maciej 2026-08-01).
 * Po akceptacji pokoju para NIE może wypowiedzieć sobie wojny przez PEACE_TREATY_LOCK_TURNS tur.
 * Dotyczy: AI decideAIDiplomacy, kaskada sojuszu, losowy DOW państw-miast, gracz (UI).
 */

import type { DiploPairMeta } from './diplomacy-pn-engine';
import type { AllianceObligation } from './diplomacy-treaties';

/** Minimalna liczba tur pokoju po akceptacji traktatu pokoju / rozejmu. */
export const PEACE_TREATY_LOCK_TURNS = 10;

/** Czy aktywna jest blokada wypowiedzenia wojny (włącznie z turą zawarcia, do końca okna). */
export function isPeaceTreatyLocked(
  meta: DiploPairMeta | undefined,
  currentTurn: number,
): boolean {
  const until = meta?.peaceUntilTurn;
  if (until == null || !Number.isFinite(until)) return false;
  return currentTurn < until;
}

/**
 * Ustawia blokadę DOW po zawarciu pokoju. Uzupełnia też n3Window (wiarygodność N3).
 * Woła silnik po applyDiplomaticEvent('pokoj').
 */
export function startPeaceTreatyLock(
  meta: DiploPairMeta,
  currentTurn: number,
  lockTurns: number = PEACE_TREATY_LOCK_TURNS,
): DiploPairMeta {
  const turns = Math.max(1, Math.floor(lockTurns));
  return {
    ...meta,
    peaceUntilTurn: currentTurn + turns,
    n3Window: { turn: currentTurn, typ: 'pokoj', charged: false },
  };
}

/**
 * Sojusz nie może wymusić DOW na partnera pokoju w oknie karencji.
 * Sojusznicy z aktywną blokadą wobec celu są pomijani; puste obowiązki odpadają.
 */
export function filterAllianceObligationsRespectingPeaceLock(
  obligations: readonly AllianceObligation[],
  isPeaceLocked: (allyId: number, mustDeclareWarOn: number) => boolean,
): AllianceObligation[] {
  const out: AllianceObligation[] = [];
  for (const ob of obligations) {
    const obligatedAllies = ob.obligatedAllies.filter(
      allyId => !isPeaceLocked(allyId, ob.mustDeclareWarOn),
    );
    if (obligatedAllies.length === 0) continue;
    out.push({ ...ob, obligatedAllies });
  }
  return out;
}
