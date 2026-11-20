/**
 * ai-ai-treaty-tick.ts -- R-WEB-AI-AI-TREATIES-E2-NAP-WIRING-FLAGGED-Q1 (etap E2 projektu AI-AI-TREATIES-DESIGN).
 *
 * CZYSTA logika kroku traktatów AI↔AI (NAP): planowanie prób i zastosowanie wyniku na kopii skarbców.
 * Wpięcie w turę robi main.ts (tickAiAiTreatyRequests); ten moduł nie zna DOM, main.ts ani generatora losowego czy zegara.
 *
 * PRZEŁĄCZNIK: `torAktywny` w gra/data/ai-ai-treaty-params.json (domyślnie false). Przy false krok NIE działa
 * i zachowanie gry jest identyczne jak przed E2. Nadpisanie wyłącznie dla testów civTest:
 * `setAiAiTreatyTickEnabledForTest` (NIE z UI).
 *
 * Reguły kroku (kolejność stała, deterministyczna: owners posortowane rosnąco):
 *  - proponent p: pierwszy cel t (t != p, rosnąco po id), dla którego przechodzi kwalifikacja wstępna
 *    (brak wojny i rozejmu, brak aktywnego NAP, wspólna granica); max 1 próba na proponenta na turę;
 *  - próba = evaluateTreatyOffer (E1) z danymi gry; odmowa = brak zmian;
 *  - przy akceptacji: NAP na czas z wyniku (15 tur); dopłata D przelana ZŁOTEM z płatnika na odbiorcę;
 *    skarbiec płatnika nigdy poniżej zera (E1 odmawia, gdy D > skarbiec; tu dodatkowo sprawdzane);
 *  - kara za zerwanie NAP (P-4): −30 Relacji (przeliczona na Respekt, patrz applyAiAiNapBreachRelacja)
 *    oraz −20 Zaufania (już nalicza istniejące zdarzenie 'zlamana_obietnica_ai' w breakTreatiesOnWar).
 */
import aiAiTreatyParamsJson from '../../data/ai-ai-treaty-params.json';
import { evaluateTreatyOffer } from './ai-ai-treaty-evaluate';
import { scalePenaltyForWarLevel } from './diplomacy-war-level';
import type {
  AiAiTreatyEvalContext,
  AiAiTreatyEvalResult,
  AiAiTreatySide,
  AiAiWarStatus,
} from './ai-ai-treaty-evaluate';

export type { AiAiWarStatus };

let torAktywnyNadpisanieTest: boolean | null = null;

/** Tylko testy (hak civTest). null = wróć do wartości z danych. */
export function setAiAiTreatyTickEnabledForTest(value: boolean | null): void {
  torAktywnyNadpisanieTest = value;
}

/** Czy tor traktatów AI↔AI jest włączony. Domyślnie false (dane: torAktywny). */
export function isAiAiTreatyTickEnabled(): boolean {
  if (torAktywnyNadpisanieTest !== null) return torAktywnyNadpisanieTest;
  return (aiAiTreatyParamsJson as { torAktywny?: unknown }).torAktywny === true;
}

export interface AiAiNapPairInfo {
  warStatus: AiAiWarStatus;
  hasNap: boolean;
  hasAlliance: boolean;
  sharesBorder: boolean;
  /** Relacja pary (relationScore). */
  relacja: number;
  /** Zaufanie pary. */
  zaufanie: number;
  /** aiDiplomacyStance(...).willingnessAlly celu (liczy wołający). */
  willingness: number;
}

export interface AiAiNapPlanInput {
  turn: number;
  /** Główne AI (bez gracza, barbarzyńców, miast-państw, wasali), posortowane rosnąco. */
  owners: readonly number[];
  /** Wstępna kwalifikacja pary (proponent, cel): wojna/rozejm/NAP/granica. Tania, bez stance. */
  pairPrefilter: (proposer: number, target: number) => boolean;
  /** Pełne dane pary (wołane tylko dla pary przechodzącej wstępną kwalifikację). */
  pairInfo: (proposer: number, target: number) => AiAiNapPairInfo;
  /** Strona traktatu (moc, sojusznicy, wrogowie). Pole treasuryGold jest ignorowane — bierze się z `treasury`. */
  sideOf: (ownerId: number) => AiAiTreatySide;
  /** Skarbce AI na początek kroku (ownerId -> PN). */
  treasury: ReadonlyMap<number, number>;
  /** Domyślnie evaluateTreatyOffer (E1); wstrzykiwalne tylko w testach (mutanty). */
  evaluate?: (ctx: AiAiTreatyEvalContext) => AiAiTreatyEvalResult;
}

export interface AiAiNapAccepted {
  proposer: number;
  target: number;
  /** Płatnik dopłaty D (null gdy D = 0). */
  payer: number | null;
  /** Odbiorca dopłaty D (null gdy D = 0). */
  payee: number | null;
  paymentGold: number;
  durationTurns: number;
  /** Tura wygaśnięcia NAP (turn + durationTurns). */
  wygasaTura: number;
  result: AiAiTreatyEvalResult;
}

/**
 * Planuje krok NAP AI↔AI dla jednej tury. Czysta funkcja: nie zmienia wejścia, zwraca listę zaakceptowanych
 * traktatów w kolejności wykonania. Skarbce są symulowane na kopii `treasury` (kolejne próby widzą przelewy).
 */
export interface AiAiNapPlanResult {
  accepted: AiAiNapAccepted[];
  /** Skarbce po wszystkich przelewach kroku (ownerId -> PN); wołający zapisuje dokładnie ten wynik. */
  treasuryPo: Map<number, number>;
}

/** Wersja pełna: zwraca także skarbce po kroku (jedyne źródło prawdy dla przelewów D w main.ts). */
export function planAiAiNapTreatyTickFull(input: AiAiNapPlanInput): AiAiNapPlanResult {
  const evaluate = input.evaluate ?? evaluateTreatyOffer;
  const treasury = new Map<number, number>(input.treasury);
  const accepted: AiAiNapAccepted[] = [];
  const owners = input.owners;
  // Pary zawarte już w tym kroku: prefilter czyta activeDeals dopiero po planowaniu, więc bez tego
  // mogłyby powstać dwa NAP tej samej pary (A→B i B→A) w jednej turze.
  const zawartePary = new Set<string>();
  const kluczPary = (a: number, b: number): string => (a < b ? `${a}_${b}` : `${b}_${a}`);

  for (const p of owners) {
    // Pierwszy kwalifikujący się cel (rosnąco po id); jedna próba na proponenta na turę.
    let target: number | null = null;
    for (const t of owners) {
      if (t === p || zawartePary.has(kluczPary(p, t))) continue;
      if (input.pairPrefilter(p, t)) {
        target = t;
        break;
      }
    }
    if (target === null) continue;

    const info = input.pairInfo(p, target);
    if (info.warStatus === 'rozejm') continue; // rozejm wyklucza NAP (obrona także tutaj, nie tylko w prefilter)
    const result = evaluate({
      actionId: 'nap',
      proposer: { ...input.sideOf(p), treasuryGold: treasury.get(p) ?? 0 },
      target: { ...input.sideOf(target), treasuryGold: treasury.get(target) ?? 0 },
      relacja: info.relacja,
      zaufanie: info.zaufanie,
      willingness: info.willingness,
      warStatus: info.warStatus,
      hasNap: info.hasNap,
      hasAlliance: info.hasAlliance,
      sharesBorder: info.sharesBorder,
    });
    if (!result.accept) continue;

    const durationTurns = result.durationTurns ?? 0;
    if (!(durationTurns > 0)) continue; // NAP bez czasu nie jest zawierany tym torem.

    let payer: number | null = null;
    let payee: number | null = null;
    const D = result.paymentGold;
    if (D > 0 && result.payer) {
      payer = result.payer === 'proposer' ? p : target;
      payee = result.payer === 'proposer' ? target : p;
      const have = treasury.get(payer) ?? 0;
      // Ostatnia linia obrony: skarbiec płatnika nigdy poniżej zera (E1 już odmawia przy D > skarbiec).
      if (D > have) continue;
      treasury.set(payer, have - D);
      treasury.set(payee, (treasury.get(payee) ?? 0) + D);
    }

    zawartePary.add(kluczPary(p, target));
    accepted.push({
      proposer: p,
      target,
      payer,
      payee,
      paymentGold: D,
      durationTurns,
      wygasaTura: input.turn + durationTurns,
      result,
    });
  }
  return { accepted, treasuryPo: treasury };
}

/** Wersja skrócona (lista zaakceptowanych traktatów); przelewy wg `planAiAiNapTreatyTickFull`. */
export function planAiAiNapTreatyTick(input: AiAiNapPlanInput): AiAiNapAccepted[] {
  return planAiAiNapTreatyTickFull(input).accepted;
}

/**
 * Kara P-4 za zerwanie NAP AI↔AI przez wojnę: przelicza Relację (relationScore = Zaufanie·mZ + Respekt·mR)
 * na Respekt: delta Respektu = relacjaDelta / mnoznikRespektu. Wynik ograniczony do 0..100 (jak Respekt w diplomacy.ts).
 */
export function applyAiAiNapBreachRelacja<T extends { respekt: number }>(
  rel: T,
  relacjaDelta: number,
  mnoznikRespektu: number,
): T {
  const dR = mnoznikRespektu > 0 ? relacjaDelta / mnoznikRespektu : 0;
  const respekt = Math.min(100, Math.max(0, rel.respekt + dR));
  return { ...rel, respekt };
}

/** Wartość kary P-4 z danych (−30 Relacji). */
export function aiAiNapBreachRelacjaDelta(): number {
  return scalePenaltyForWarLevel((aiAiTreatyParamsJson as { zerwanie_relacja: number }).zerwanie_relacja);
}
