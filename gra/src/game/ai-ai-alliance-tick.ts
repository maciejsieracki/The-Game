/**
 * ai-ai-alliance-tick.ts -- R-WEB-AI-AI-ALLIANCES-E3-WIRING-FLAGGED-Q1 (etap B1 pakietu „twardsza dyplomacja").
 *
 * CZYSTA logika kroku SOJUSZY AI↔AI: planowanie prób i zastosowanie wyniku na kopii skarbców.
 * Wzorzec identyczny z krokiem NAP (ai-ai-treaty-tick.ts): ten moduł nie zna DOM, main.ts, generatora losowego ani zegara.
 * Wpięcie w turę robi main.ts (tickAiAiAllianceRequests), zawarcie przez tę samą końcówkę co sojusz zawierany przez tor AI↔AI
 * (addTreaty + syncRelationFromDeals), bez zmiany reguł akceptacji — ocenę wykonuje wyłącznie E1 evaluateTreatyOffer.
 *
 * PRZEŁĄCZNIK: `torSojuszyAktywny` w gra/data/ai-ai-treaty-params.json (domyślnie false). Przy false krok NIE działa
 * i zachowanie gry jest identyczne jak przed E3. Nadpisanie wyłącznie dla testów civTest:
 * `setAiAiAllianceTickEnabledForTest` (NIE z UI).
 *
 * Reguły kroku (kolejność stała, deterministyczna: owners posortowane rosnąco):
 *  - proponent p: pomija go, gdy ma już `maxSojuszyNaCywilizacje` sojuszy AI↔AI; gdy ma dokładnie 1 — próbuje tylko
 *    w turach podzielnych przez `alliancePonowneProbyTur` (start 8); gdy 0 — próbuje co turę;
 *  - kandydaci t: t != p, bez wojny i rozejmu, bez istniejącego sojuszu tej pary, t poniżej limitu sojuszy;
 *  - wybór celu: najwyższa willingnessAlly (wg pairInfo), przy remisie wspólny wróg, potem najniższe id;
 *  - maks. 1 próba proponenta na turę (evaluateTreatyOffer na wybranym celu); odmowa = brak zmian;
 *  - przy akceptacji: sojusz bezterminowy (wygasaTura = null); dopłata D ZŁOTEM z płatnika na odbiorcę,
 *    skarbiec płatnika nigdy poniżej zera; pary zawarte w tym kroku nie są ponownie proponowane (brak duplikatów).
 *  - sojusz zawierany wariantem 'sojusz_pelny' (wspólna obrona i atak); wezwanie do wojny sojusznika obsługuje
 *    istniejąca kaskada (alliance-war-obligation.ts) — tu tylko pole wyniku callToWar.
 *
 * Założenia (brak rozstrzygnięcia w dispatchu): limit sojuszy liczy wyłącznie sojusze AI↔AI między `owners`
 * (gracz i sojusze z graczem poza limitem); wołający podaje `alliancesCount` dla owners.
 */
import aiAiTreatyParamsJson from '../../data/ai-ai-treaty-params.json';
import { evaluateTreatyOffer } from './ai-ai-treaty-evaluate';
import type {
  AiAiTreatyEvalContext,
  AiAiTreatyEvalResult,
  AiAiTreatySide,
} from './ai-ai-treaty-evaluate';
import type { AiAiNapPairInfo } from './ai-ai-treaty-tick';
import { maPremieKoalicji, type AiAiCoalitionCtx } from './ai-ai-coalition';

let torSojuszyNadpisanieTest: boolean | null = null;

/** Tylko testy (hak civTest). null = wróć do wartości z danych. */
export function setAiAiAllianceTickEnabledForTest(value: boolean | null): void {
  torSojuszyNadpisanieTest = value;
}

/** Czy tor sojuszy AI↔AI jest włączony. Domyślnie false (dane: torSojuszyAktywny). */
export function isAiAiAllianceTickEnabled(): boolean {
  if (torSojuszyNadpisanieTest !== null) return torSojuszyNadpisanieTest;
  return (aiAiTreatyParamsJson as { torSojuszyAktywny?: unknown }).torSojuszyAktywny === true;
}

/** Limit twardy sojuszy AI↔AI na cywilizację (z danych). */
export function aiAiMaxSojuszyNaCywilizacje(): number {
  return (aiAiTreatyParamsJson as { maxSojuszyNaCywilizacje: number }).maxSojuszyNaCywilizacje;
}

/** Co ile tur proponent z 1 sojuszem ponawia próbę (z danych). */
export function aiAiAlliancePonowneProbyTur(): number {
  return (aiAiTreatyParamsJson as { alliancePonowneProbyTur: number }).alliancePonowneProbyTur;
}

export interface AiAiAllianceAccepted {
  proposer: number;
  target: number;
  /** Płatnik dopłaty D (null gdy D = 0). */
  payer: number | null;
  /** Odbiorca dopłaty D (null gdy D = 0). */
  payee: number | null;
  paymentGold: number;
  /** Sojusz bezterminowy: zawsze null (jak sojusz gracz↔AI bez terminu). */
  wygasaTura: null;
  result: AiAiTreatyEvalResult;
}

export interface AiAiAlliancePlanInput {
  turn: number;
  /** Główne AI (bez gracza, barbarzyńców, miast-państw, wasali), posortowane rosnąco. */
  owners: readonly number[];
  /** Liczba sojuszy AI↔AI każdego owner (ownerId -> n), tylko między `owners`. */
  alliancesCount: ReadonlyMap<number, number>;
  /** Wstępna kwalifikacja pary (proponent, cel): bez wojny/rozejmu/istniejącego sojuszu, tania. */
  pairPrefilter: (proposer: number, target: number) => boolean;
  /** Pełne dane pary (wołane tylko dla pary przechodzącej wstępną kwalifikację). */
  pairInfo: (proposer: number, target: number) => AiAiNapPairInfo;
  /** Strona traktatu (moc, sojusznicy, wrogowie). Pole treasuryGold jest ignorowane — bierze się z `treasury`. */
  sideOf: (ownerId: number) => AiAiTreatySide;
  /** Skarbce AI na początek kroku (ownerId -> PN). */
  treasury: ReadonlyMap<number, number>;
  /** Limit sojuszy na cywilizację; domyślnie aiAiMaxSojuszyNaCywilizacje(). */
  maxSojuszy?: number;
  /** Co ile tur ponawia proponent z 1 sojuszem; domyślnie aiAiAlliancePonowneProbyTur(). */
  ponowneProbyTur?: number;
  /** Domyślnie evaluateTreatyOffer (E1); wstrzykiwalne tylko w testach (mutanty). */
  evaluate?: (ctx: AiAiTreatyEvalContext) => AiAiTreatyEvalResult;
  /**
   * R-WEB-AI-AI-COALITION-ANTI-LEADER-Q1: kontekst lidera (tylko gdy koalicja włączona i lider potwierdzony).
   * Wpływa WYŁĄCZNIE na kolejność wyboru celu (premia), nie na progi E1 ani limity.
   */
  koalicja?: AiAiCoalitionCtx | null;
  /**
   * R-WEB-DIPLO-ZERO-TRUST-TREATY-BREAK-PROTECTOR-Q1 (C1): preferowany cel protektora (p, t) → true dla celu
   * wskazanego przez zerowe zaufanie. Wpływa WYŁĄCZNIE na kolejność wyboru celu (jak premia koalicji), nie na E1.
   * Brak / null = zachowanie sprzed tematu.
   */
  preferowanyCel?: (proposer: number, target: number) => boolean;
}

export interface AiAiAlliancePlanResult {
  accepted: AiAiAllianceAccepted[];
  /** Skarbce po wszystkich przelewach kroku (ownerId -> PN); wołający zapisuje dokładnie ten wynik. */
  treasuryPo: Map<number, number>;
  /** Liczba sojuszy po kroku (ownerId -> n), dla logów i testów. */
  alliancesCountPo: Map<number, number>;
  /** Licznik prób toru w tym kroku (wywołania evaluate, maks. 1 na proponenta). Odczyt pomiaru. */
  proby: number;
  /** Licznik odmów E1 w tym kroku (evaluate.accept = false). Odczyt pomiaru. */
  odmowy: number;
  /** Histogram powodów odmów E1 w tym kroku (klucz = powód z liczbami zastąpionymi przez „N”). Odczyt pomiaru. */
  powodyOdmow: Map<string, number>;
}

/**
 * Planuje krok sojuszy AI↔AI dla jednej tury. Czysta funkcja: nie zmienia wejścia.
 */
export function planAiAiAllianceTickFull(input: AiAiAlliancePlanInput): AiAiAlliancePlanResult {
  const evaluate = input.evaluate ?? evaluateTreatyOffer;
  const maxSojuszy = input.maxSojuszy ?? aiAiMaxSojuszyNaCywilizacje();
  const ponowne = input.ponowneProbyTur ?? aiAiAlliancePonowneProbyTur();
  const treasury = new Map<number, number>(input.treasury);
  const counts = new Map<number, number>(input.alliancesCount);
  const owners = input.owners;
  const accepted: AiAiAllianceAccepted[] = [];
  let proby = 0;
  let odmowy = 0;
  const powodyOdmow = new Map<string, number>();
  // Pary zawarte w tym kroku: prefilter czyta activeDeals dopiero po planowaniu, więc bez tego mogłyby
  // powstać dwa sojusze tej samej pary w jednej turze.
  const zawartePary = new Set<string>();
  const kluczPary = (a: number, b: number): string => (a < b ? `${a}_${b}` : `${b}_${a}`);
  const liczba = (oid: number): number => counts.get(oid) ?? 0;

  for (const p of owners) {
    const ileP = liczba(p);
    if (ileP >= maxSojuszy) continue;
    // 0 sojuszy: próba co turę; 1 sojusz: próba tylko co `ponowne` tur (rzadziej, bez dodatkowego stanu).
    if (ileP >= 1 && (ponowne <= 0 || input.turn % ponowne !== 0)) continue;

    // Kandydaci: wstępna kwalifikacja + pełne dane pary (wyłącznie sojusz, bez wojny i rozejmu).
    let best: { t: number; premia: boolean; willingness: number; sharesEnemy: boolean; info: AiAiNapPairInfo } | null = null;
    const sideP = input.sideOf(p);
    for (const t of owners) {
      if (t === p || zawartePary.has(kluczPary(p, t))) continue;
      if (liczba(t) >= maxSojuszy) continue;
      if (!input.pairPrefilter(p, t)) continue;
      const info = input.pairInfo(p, t);
      if (info.warStatus === 'wojna' || info.warStatus === 'rozejm') continue;
      if (info.hasAlliance) continue;
      const sideT = input.sideOf(t);
      const sharesEnemy = sideP.enemies.some(x => sideT.enemies.includes(x));
      // R-WEB-AI-AI-COALITION-ANTI-LEADER-Q1: premia koalicji wyprzedza willingness (tylko kolejność celu).
      const premia = maPremieKoalicji(p, t, input.koalicja) || (input.preferowanyCel?.(p, t) ?? false);
      const kandydat = { t, premia, willingness: info.willingness, sharesEnemy, info };
      if (
        best === null
        || (kandydat.premia && !best.premia)
        || (kandydat.premia === best.premia && kandydat.willingness > best.willingness)
        || (kandydat.premia === best.premia && kandydat.willingness === best.willingness && kandydat.sharesEnemy && !best.sharesEnemy)
        // remis bez różnicy w wspólnym wrogu: owners są rosnąco, więc pierwszy (najniższe id) zostaje
      ) {
        best = kandydat;
      }
    }
    if (best === null) continue;

    const target = best.t;
    const info = best.info;
    const sideT = input.sideOf(target);
    proby++;
    const result = evaluate({
      actionId: 'sojusz_pelny',
      proposer: { ...sideP, treasuryGold: treasury.get(p) ?? 0 },
      target: { ...sideT, treasuryGold: treasury.get(target) ?? 0 },
      relacja: info.relacja,
      zaufanie: info.zaufanie,
      willingness: info.willingness,
      warStatus: info.warStatus,
      hasNap: info.hasNap,
      hasAlliance: info.hasAlliance,
      sharesBorder: info.sharesBorder,
    });
    if (!result.accept) {
      odmowy++;
      const klucz = String(result.reason).replace(/[-+]?\d[\d.,]*/g, 'N');
      powodyOdmow.set(klucz, (powodyOdmow.get(klucz) ?? 0) + 1);
      continue;
    }

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
    counts.set(p, liczba(p) + 1);
    counts.set(target, liczba(target) + 1);
    accepted.push({
      proposer: p,
      target,
      payer,
      payee,
      paymentGold: D,
      wygasaTura: null,
      result,
    });
  }
  return { accepted, treasuryPo: treasury, alliancesCountPo: counts, proby, odmowy, powodyOdmow };
}

/** Wersja skrócona (lista zaakceptowanych sojuszy); przelewy wg `planAiAiAllianceTickFull`. */
export function planAiAiAllianceTick(input: AiAiAlliancePlanInput): AiAiAllianceAccepted[] {
  return planAiAiAllianceTickFull(input).accepted;
}
