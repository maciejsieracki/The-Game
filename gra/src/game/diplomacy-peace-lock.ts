/**
 * diplomacy-peace-lock.ts — karencja po zawarciu pokoju / rozejmu (Maciej 2026-08-01).
 * Po akceptacji pokoju para NIE może wypowiedzieć sobie wojny przez PEACE_TREATY_LOCK_TURNS tur.
 * Dotyczy: AI decideAIDiplomacy, kaskada sojuszu, losowy DOW państw-miast, gracz (UI).
 */

import type { DiploPairMeta } from './diplomacy-pn-engine';
import type { AllianceObligation } from './diplomacy-treaties';
import { WAR_PEACE_PARAMS } from './diplomacy-war-peace-profile';

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

/**
 * (E) Próg ułamka zmęczenia wojną (0..1 = turnsAtWar / T, `warWearinessFraction`), od którego
 * AI proponuje pokój stały zamiast rozejmu. 1 = PEŁNE zmęczenie (t >= T, T ≤ 20 tur wg
 * zmeczenieT). Próg 1 zachowuje dotychczasowe N4 (wojna < ~20 tur → rozejm, dalej → pokój) jako
 * sygnał, a nie zmienia go na „od połowy wojny". Wartość ZAŁOŻENIE orkiestratora (do ABC).
 */
export const TRUCE_AI_FATIGUE_PEACE_MIN = 1;

/**
 * (E) Próg `willingnessPeace` (0..1, diplomacy.ts: zmęczenie + presja militarna + dobra wola),
 * od którego AI proponuje pokój stały. Wysoki próg: sama presja militarna słabszego AI nie
 * powinna wyłączać rozejmu. ZAŁOŻENIE orkiestratora (do potwierdzenia — pytanie ABC).
 */
export const TRUCE_AI_WILLINGNESS_PEACE_MIN = 0.7;

/** (E) Próg Zaufania, od którego AI proponuje pokój stały zamiast rozejmu. ZAŁOŻENIE (do ABC). */
export const TRUCE_AI_TRUST_PEACE_MIN = 60;

/**
 * (E) Tryb propozycji pokoju AI. Kolejność sygnałów pokoju stałego: duże zmęczenie wojną
 * (ułamek >= progu), wysoka gotowość do pokoju (willingnessPeace >= progu), wysokie Zaufanie.
 * Gdy żaden nie zachodzi: słabsze AI (`weaker`, rw <= próg słabości) proponuje ROZEJM;
 * w pozostałych przypadkach — `fallbackKind` (dotychczasowy wybór po turach wojny).
 */
export function aiTruceOrPeaceMode(input: {
  /** Ułamek zmęczenia wojną 0..1 = `warWearinessFraction(turnsAtWar, T)`. */
  fatigueFraction: number;
  /** `stance.willingnessPeace` 0..1 (diplomacy.ts). */
  willingnessPeace: number;
  zaufanie: number;
  weaker: boolean;
  fallbackKind: 'pokoj' | 'rozejm';
}): 'pokoj' | 'rozejm' {
  if (input.fatigueFraction >= TRUCE_AI_FATIGUE_PEACE_MIN) return 'pokoj';
  if (input.willingnessPeace >= TRUCE_AI_WILLINGNESS_PEACE_MIN) return 'pokoj';
  if (input.zaufanie >= TRUCE_AI_TRUST_PEACE_MIN) return 'pokoj';
  if (input.weaker) return 'rozejm';
  return input.fallbackKind;
}

/**
 * (B, R-WEB-DIPLO-TRUCE-IMPL-Q1 runda 5, decyzja właściciela 2026-11-10) Czy AI-adresat przyjmuje
 * pokój stały po wygaśnięciu rozejmu: decyduje SIŁA, nie Zaufanie (po wojnie Zaufanie byłoby zerowe).
 * Przyjmuje, gdy MOC WOJSKOWA proponującego jest mniejsza o co najmniej `prog` (20%, z
 * diplomacy-war-peace-params.json → przewagaMilitarna.prog) od mocy wojskowej adresata, tzn.
 * proponujący ≤ (1 − prog) × adresat. Moc wojskowa = suma M_pole armii (main.ts sumArmyMForOwner),
 * nie ogólna objectivePower. Zaufanie nie wchodzi do decyzji. Zero armii u obu = 0 ≤ 0 → zgoda.
 * ZAŁOŻENIE orkiestratora (do potwierdzenia): „mniejsza o 20%" = proponujący ≤ 80% adresata.
 */
export function truceEndAiAccepts(
  proposerArmyM: number,
  addresseeArmyM: number,
  prog: number = WAR_PEACE_PARAMS.przewagaMilitarna.prog,
): boolean {
  if (!Number.isFinite(proposerArmyM) || !Number.isFinite(addresseeArmyM)) return false;
  if (proposerArmyM < 0 || addresseeArmyM < 0) return false;
  const eps = WAR_PEACE_PARAMS.przewagaMilitarna.epsilon;
  return proposerArmyM <= (1 - prog + eps) * addresseeArmyM;
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

/**
 * Okno, w którym wypowiedzenie wojny jest złamaniem rozejmu (karane jak pakt NAP):
 * aktywny rozejm LUB oferta pokoju po jego wygaśnięciu (zawieszenie broni trwa do odpowiedzi).
 */
export function isTruceWindowBreach(
  meta: Pick<DiploPairMeta, 'truceUntilTurn' | 'truceEndOffer'> | undefined,
  currentTurn: number,
): boolean {
  if (meta == null) return false;
  return isTruceBreach(meta.truceUntilTurn, currentTurn) || meta.truceEndOffer != null;
}

/**
 * (C) Zdarzenie Zaufania przy finalizacji pokoju: rozejm (dodatnia, dozwolona długość) → null
 * (bez zdarzenia 'pokoj', czyli 0 Zaufania); pokój stały (brak/0/nieprawidłowa długość) → 'pokoj' (+5).
 */
export function peaceFinalizeTrustEvent(truceTurns: number | null | undefined): 'pokoj' | null {
  return normalizeTruceDuration(truceTurns) != null ? null : 'pokoj';
}

// ---------------------------------------------------------------------------
// (B) Cykl życia propozycji pokoju po rozejmie — czysta logika z portami (wstrzykiwane
// odczyty/zapisy stanu). main.ts podaje porty na żywy stan; testy podają atrapy, więc
// ścieżki wygaśnięcia, timeoutu, zgody i odmowy wykonują TEN SAM kod.
// ---------------------------------------------------------------------------

export interface TruceEndPorts {
  getMeta(a: number, b: number): DiploPairMeta;
  setMeta(a: number, b: number, meta: DiploPairMeta): void;
  getStatus(a: number, b: number): string;
  /** Moc wojskowa (suma M_pole armii) właściciela — próg akceptacji pokoju przez AI (truceEndAiAccepts). */
  getArmyM(ownerId: number): number;
  isHuman(ownerId: number): boolean;
  /** Wojna wypowiedziana po rozejmie (status 'pokoj' → wojna, bez kary Wiarygodności). */
  declareWarAfterTruce(a: number, b: number): void;
  /** Wpis oferty w skrzynce gracza (bez deduplikacji); zwraca id wpisu. */
  enqueueOffer(ownerId: number, reason: string): string;
  removeOffer(inboxId: string): void;
  /** Zgoda = pokój stały (finalizePeaceTreatyBetween bez truceTurns). */
  finalizePeace(proposerId: number, responderId: number): void;
}

/** Usuwa ofertę pokoju po rozejmie (meta + własny wpis w skrzynce). */
export function clearTruceEndOfferCore(ports: TruceEndPorts, a: number, b: number): void {
  const meta = ports.getMeta(a, b);
  const offer = meta.truceEndOffer;
  if (offer == null) return;
  if (offer.inboxId) ports.removeOffer(offer.inboxId);
  ports.setMeta(a, b, { ...ports.getMeta(a, b), truceEndOffer: undefined });
}

/** Odmowa lub timeout pokoju po rozejmie = wojna (bez kary). */
export function truceEndToWarCore(ports: TruceEndPorts, a: number, b: number): void {
  if (ports.getStatus(a, b) === 'pokoj') ports.declareWarAfterTruce(a, b);
  clearTruceEndOfferCore(ports, a, b);
}

/**
 * Jeden tick dla pary (raz na turę). Wygasły rozejm: adresat = strona niebędąca inicjatorem;
 * gracz → oferta w skrzynce (`truceEndOffer`, timeout w kolejnej turze); AI → od razu wg
 * Zaufania (zgoda = pokój stały, brak zgody = wojna). Bez inicjatora → wojna (stare zapisy).
 */
export function truceEndTickPair(ports: TruceEndPorts, a: number, b: number, turn: number): void {
  const meta = ports.getMeta(a, b);
  if (meta.truceEndOffer != null) {
    if (truceEndOfferExpired(meta.truceEndOffer.turn, turn)) truceEndToWarCore(ports, a, b);
    return;
  }
  if (meta.truceUntilTurn == null) return;
  if (truceExpiryAction(meta.truceUntilTurn, turn) !== 'revert_to_war') return;
  const initiator = meta.truceInitiatorId;
  const target = truceEndOfferTarget(initiator, a, b);
  ports.setMeta(a, b, { ...meta, truceUntilTurn: undefined });
  if (ports.getStatus(a, b) !== 'pokoj') return;
  if (initiator == null || target == null) {
    truceEndToWarCore(ports, a, b);
    return;
  }
  if (ports.isHuman(target)) {
    const inboxId = ports.enqueueOffer(initiator, 'Rozejm wygasł — propozycja pokoju stałego (odmowa = wojna)');
    ports.setMeta(a, b, {
      ...ports.getMeta(a, b),
      truceEndOffer: { turn, fromOwnerId: initiator, toOwnerId: target, inboxId },
    });
    return;
  }
  if (truceEndAiAccepts(ports.getArmyM(initiator), ports.getArmyM(target))) {
    ports.finalizePeace(initiator, target);
  } else {
    truceEndToWarCore(ports, a, b);
  }
}
