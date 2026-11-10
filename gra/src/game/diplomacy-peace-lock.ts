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

// ---------------------------------------------------------------------------
// R-WEB-DIPLO-TRUCE-IMPL-Q1 (runda 3) — luki względem decyzji ABC 2026-11-09:
// (B) po wygaśnięciu rozejmu druga strona dostaje PROPOZYCJĘ pokoju stałego;
//     zgoda = pokój, odmowa/timeout = wojna (bez kary Wiarygodności);
// (C) rozejm daje 0 Zaufania (pokój stały +5 bez zmian);
// (E) AI wybiera tryb (rozejm vs pokój stały) wg pozycji i zmęczenia wojną;
// (G) kontroferta może zmienić długość rozejmu (5/10/15) — obsługa w UI/main.
// ---------------------------------------------------------------------------

/** (E) Próg zmęczenia wojną (0..1), od którego AI proponuje pokój stały zamiast rozejmu. */
export const TRUCE_AI_FATIGUE_PEACE_MIN = 0.5;

/** (E) Próg Zaufania, od którego AI proponuje pokój stały zamiast rozejmu. */
export const TRUCE_AI_TRUST_PEACE_MIN = 60;

/**
 * (E) Tryb propozycji pokoju AI. Słabsze AI (w trudnym położeniu) przy NISKIM zmęczeniu
 * wojną i NISKIM Zaufaniu proponuje ROZEJM; przy dużym zmęczeniu LUB wysokim Zaufaniu —
 * POKÓJ STAŁY. Gdy żaden sygnał nie rozstrzyga, zostaje `fallbackKind` (dotychczasowy
 * wybór po liczbie tur wojny, np. aiPeaceProposalKind).
 */
export function aiTruceOrPeaceMode(input: {
  fatigueShare: number;
  zaufanie: number;
  weaker: boolean;
  fallbackKind: 'pokoj' | 'rozejm';
}): 'pokoj' | 'rozejm' {
  if (input.fatigueShare >= TRUCE_AI_FATIGUE_PEACE_MIN) return 'pokoj';
  if (input.zaufanie >= TRUCE_AI_TRUST_PEACE_MIN) return 'pokoj';
  if (input.weaker) return 'rozejm';
  return input.fallbackKind;
}

/** (B) Próg Zaufania, od którego AI (adresat propozycji pokoju po rozejmie) zgadza się na pokój. */
export const TRUCE_END_AI_ACCEPT_TRUST_MIN = 40;

/** (B) Czy AI-adresat przyjmuje pokój stały po wygaśnięciu rozejmu. */
export function truceEndAiAccepts(zaufanie: number): boolean {
  return Number.isFinite(zaufanie) && zaufanie >= TRUCE_END_AI_ACCEPT_TRUST_MIN;
}

/**
 * (B) Adresat propozycji pokoju po wygaśnięciu rozejmu = strona, która NIE zaproponowała
 * rozejmu (`initiatorId`). Brak inicjatora (stare zapisy) → null (zachowanie: wojna).
 */
export function truceEndOfferTarget(
  initiatorId: number | null | undefined,
  a: number,
  b: number,
): number | null {
  if (initiatorId == null) return null;
  if (initiatorId === a) return b;
  if (initiatorId === b) return a;
  return null;
}

/** (B) Propozycja pokoju po rozejmie nierozstrzygnięta do kolejnej tury = timeout = wojna. */
export function truceEndOfferExpired(offerTurn: number, currentTurn: number): boolean {
  return Number.isFinite(offerTurn) && currentTurn > offerTurn;
}
