/**
 * diplomacy-peace-lock.ts — karencja po zawarciu pokoju / rozejmu (Maciej 2026-08-01).
 * Po akceptacji pokoju para NIE może wypowiedzieć sobie wojny przez PEACE_TREATY_LOCK_TURNS tur.
 * Dotyczy: AI decideAIDiplomacy, kaskada sojuszu, losowy DOW państw-miast, gracz (UI).
 */

import type { DiploPairMeta } from './diplomacy-pn-engine';
import type { AllianceObligation } from './diplomacy-treaties';

/** Liczba tur pokoju po akceptacji traktatu pokoju / rozejmu. */
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

// ---------------------------------------------------------------------------
// R-WEB-TRUCE-Q1 — rozejm: czasowe zawieszenie broni (5 / 10 / 15 tur).
// Czysta logika cyklu życia; stan (`truceUntilTurn` per para) trzyma silnik (main.ts).
// Różnica względem pokoju: po wygaśnięciu wojna WRACA bez kary Wiarygodności i bez
// flagi agresora; wypowiedzenie wojny w trakcie rozejmu = złamanie (kara jak za pakt).
// ---------------------------------------------------------------------------

/** Dozwolone długości rozejmu w turach (stół negocjacyjny: wybór 5/10/15). */
export const TRUCE_DURATION_OPTIONS: readonly number[] = Object.freeze([5, 10, 15]);

/** Domyślna długość rozejmu, gdy payload jej nie podaje. */
export const TRUCE_DEFAULT_TURNS = 10;

/** Zwraca długość tylko z listy dozwolonych (5/10/15), w przeciwnym razie null. */
export function normalizeTruceDuration(turns: number | null | undefined): number | null {
  if (turns == null || !Number.isFinite(turns)) return null;
  return TRUCE_DURATION_OPTIONS.includes(turns) ? turns : null;
}

/** Tura, w której rozejm przestaje obowiązywać (wyłącznie). Null = nieprawidłowa długość. */
export function truceUntilTurn(startTurn: number, durationTurns: number): number | null {
  const d = normalizeTruceDuration(durationTurns);
  if (d == null || !Number.isFinite(startTurn)) return null;
  return startTurn + d;
}

/** Czy rozejm obowiązuje w danej turze (włącznie z turą zawarcia, wyłącznie od `until`). */
export function isTruceActive(until: number | null | undefined, currentTurn: number): boolean {
  if (until == null || !Number.isFinite(until)) return false;
  return currentTurn < until;
}

/**
 * Co zrobić z parą w danej turze: 'revert_to_war' = rozejm właśnie wygasł (wojna wraca
 * bez kary), 'none' = nic nie robić (brak rozejmu albo jeszcze trwa).
 * Wywoływane raz na turę przez silnik; wygaśnięcie jest dokładnie w `until`.
 */
export function truceExpiryAction(
  until: number | null | undefined,
  currentTurn: number,
): 'none' | 'revert_to_war' {
  if (until == null || !Number.isFinite(until)) return 'none';
  return currentTurn >= until ? 'revert_to_war' : 'none';
}

/** Wypowiedzenie wojny w trakcie aktywnego rozejmu = złamanie (kara jak za pakt). */
export function isTruceBreach(until: number | null | undefined, currentTurn: number): boolean {
  return isTruceActive(until, currentTurn);
}
