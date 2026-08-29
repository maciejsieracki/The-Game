/**
 * diplomacy-ai-offer-balance.ts — D-DYPLO-AI-OFERTA-ZERO (Maciej 2026-07-29).
 *
 * AI na Normal/Trudny celuje w bilans PW ≈ 0 (mała tolerancja), nie w dużą nadwyżkę
 * dla gracza. Łatwy = dotychczasowe zachowanie (gratisy / plusy OK).
 */
import type { GameDifficulty } from './difficulty-cost';
import type { BasketItem } from './diplomacy-pn-engine';
import type { ProposalPayload } from './diplomacy-proposals';
import {
  diplomacyFairGivePn,
  diplomacyHandelSurowiecKrok,
  diplomacyPnPraca,
  diplomacyPnSurowiecIlosc,
  diplomacyPnZloto,
  diplomacySumPn,
} from './diplomacy-value-catalog';
import {
  buildProposalPnSumOpts,
  resolveProposalPn,
  type ResolveProposalPnOptions,
} from './diplomacy-pn-engine';
// R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1: `handelRequiredPn`/`treatyBaseFairnessGap` importowane
// z diplomacy-proposals.ts (nie reimplementowane) — JEDYNE źródło tej matematyki, żeby
// generator startowej oferty AI celował w DOKŁADNIE tę samą liczbę, której użyje
// evaluateProposal. Import zwrotny (diplomacy-proposals.ts już importuje z tego pliku —
// trimProposalForZeroBalance/aiOfferTargetsZeroBalance/aiProposalPlayerBenefitSurplus)
// tworzy cykl modułów — TEN SAM, już tolerowany wzorzec co diplomacy-pn-engine.ts ↔
// diplomacy-ai-offer-balance.ts (patrz import trimQuickDealGiveToTolerance tamże): bezpieczne
// dla czystych funkcji wołanych w runtime, nigdy skonsumowanych na poziomie inicjalizacji modułu.
import { handelRequiredPn, treatyBaseFairnessGap } from './diplomacy-proposals';

/**
 * R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1: dodatkowe składniki formuły bilansu, dotąd pomijane
 * przez generator startowej oferty AI (GOAL b) — mnożnik chęci partnera do handlu
 * (`handelWillingnessMultiplier` w diplomacy-proposals.ts, tu jako gotowa liczba: wołający,
 * który ZNA kontekst stanceForEval/getEffectiveDiplomacyParams, liczy go i przekazuje) oraz
 * baza traktatu (`treatyBaseAcceptancePn`/`treatyBaseFairnessGap`, dla umowa_handlowa/
 * umowa_szlakow). Oba pola opcjonalne i domyślnie neutralne (multiplier=1, treatyBasePn=0)
 * — bez nich zachowanie jest BIT-IDENTYCZNE ze stanem sprzed tej zmiany (patrz
 * gra/tools/diplomacy-bilans-unifikacja-test.cjs, sekcja „no-op dla realnego wywołania”).
 *
 * Dla dzisiejszego jedynego realnego wywołania (`main.ts:enqueueNegotiationFromAiCmd`,
 * proposerOwnerId=AI, responderOwnerId=gracz) OBA składniki są matematycznie no-op:
 * `handelWillingnessMultiplier` zwraca zawsze 1, gdy `responderIsPlayer` (gracz jest
 * respondentem) — a `treatyBaseFairnessGap` w evaluateProposal jest bramkowana wyłącznie
 * `if (proposerIsTreatyPlayer)` (proponent=gracz), nigdy prawda gdy proponentem jest AI.
 * Parametry istnieją dla PRZYSZŁYCH wywołań tego generatora z odwrotnej strony (np.
 * kontroferta AI na propozycję gracza, `generateCounterOffer`, gdzie oba składniki SĄ
 * realnie nietrywialne) — testowane syntetycznie w nowym pliku testu (kryterium 3).
 */
export interface AiOfferFairnessOpts {
  /** `handelWillingnessMultiplier(...)` już policzony przez wołającego — domyślnie 1 (no-op). */
  multiplier?: number;
  /** Baza traktatu (dla umowa_handlowa/umowa_szlakow) po stronie proponenta — domyślnie 0 (no-op). */
  treatyBasePn?: number;
}

function resolvedMultiplier(fairness?: AiOfferFairnessOpts): number {
  const m = fairness?.multiplier;
  return typeof m === 'number' && Number.isFinite(m) && m > 0 ? m : 1;
}

function resolvedTreatyBasePn(fairness?: AiOfferFairnessOpts): number {
  const b = fairness?.treatyBasePn;
  return typeof b === 'number' && Number.isFinite(b) && b > 0 ? b : 0;
}

/**
 * Maks. nadwyżka PW dla strony odbierającej ofertę AI (gracz), przy której AI
 * uznaje ofertę za „wyrównaną". Łatwy = bez limitu (gratisy OK).
 */
export const AI_OFFER_PW_BALANCE_TOLERANCE_PN: Record<GameDifficulty, number> = {
  easy: Number.POSITIVE_INFINITY,
  normal: 5,
  hard: 2,
};

/** Na Trudnym AI może celować lekko poniżej parytetu (korzyść AI, gracz dopłaca więcej). */
export const AI_OFFER_PW_UNDERSHOOT_PN: Record<GameDifficulty, number> = {
  easy: 0,
  normal: 0,
  hard: 3,
};

export function aiOfferPwSurplusTolerance(difficulty: GameDifficulty = 'normal'): number {
  return AI_OFFER_PW_BALANCE_TOLERANCE_PN[difficulty];
}

export function aiOfferPwUndershootAllowance(difficulty: GameDifficulty = 'normal'): number {
  return AI_OFFER_PW_UNDERSHOOT_PN[difficulty];
}

/** Czy AI ma celować w bilans ≈ 0 zamiast oferować duże plusy. */
export function aiOfferTargetsZeroBalance(difficulty: GameDifficulty = 'normal'): boolean {
  return difficulty !== 'easy';
}

/** Jednostronny dar złota (zaproponuj_handel bez towaru) — tylko Łatwy. */
export function aiAllowsOneSidedGoldGift(difficulty: GameDifficulty = 'normal'): boolean {
  return difficulty === 'easy';
}

/** Osłodzik przy stałej umowie handlowej — tylko Łatwy. */
export function aiAllowsTradeAgreementSweetener(difficulty: GameDifficulty = 'normal'): boolean {
  return difficulty === 'easy';
}

/**
 * Nadwyżka PW po stronie RESPONDENTA (odbiorcy propozycji AI).
 * Dodatnia = respondent oddaje więcej niż fair min względem tego co dostaje.
 *
 * R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1 (GOAL b): próg fair-min liczony TERAZ przez
 * `handelRequiredPn` (diplomacy-proposals.ts) zamiast gołego `diplomacyFairGivePn` —
 * ta sama funkcja, którą evaluateProposal/handelFairnessGate realnie stosuje (mnożnik
 * chęci + podłoga parytetu `Math.max(receivePn,...)`), więc gdy wołający przekaże
 * realny `fairness.multiplier`, cel generatora i próg bramki są DOKŁADNIE tą samą liczbą.
 * `treatyBasePn` (opcjonalny) dolicza się do strony "demand" — mirror `treatyBaseFairnessGap`
 * dla umowa_handlowa/umowa_szlakow, gdzie próg dotyczy. Oba pola domyślnie neutralne.
 */
export function responderPwSurplus(
  proposerGivePn: number,
  proposerReceivePn: number,
  relTotal: number,
  fairness?: AiOfferFairnessOpts,
): number {
  const responderDemandPn = proposerGivePn;
  const treatyBasePn = resolvedTreatyBasePn(fairness);
  if (treatyBasePn > 0) {
    // Traktat handlowy (umowa_handlowa/umowa_szlakow): evaluateProposal ocenia bazę
    // traktatu NIEZALEŻNIE od koszyka, przez `treatyBaseFairnessGap` — nie przez
    // `handelRequiredPn`/mnożnik chęci (ten dotyczy wyłącznie case'u 'handel' w silniku;
    // wzajemnie wykluczające się gałęzie, jak w evaluateProposal). Dodatni gap = proponentowi
    // brakuje do parytetu bazy → ujemny surplus respondenta (dokładnie ta sama liczba, ze
    // znakiem odwróconym, co evaluateProposal zwraca jako `pwBalance = -gap`).
    const gap = treatyBaseFairnessGap(treatyBasePn, proposerGivePn, proposerReceivePn, relTotal);
    return -gap;
  }
  const multiplier = resolvedMultiplier(fairness);
  const fairMinPn = handelRequiredPn(responderDemandPn, relTotal, multiplier);
  return proposerReceivePn - fairMinPn;
}

/**
 * Nadwyżka korzyści dla RESPONDENTA (gracz): dodatnia = dostaje więcej niż oddaje @ fair.
 * Dary jednostronne: cała wartość givePn proponenta.
 */
export function aiProposalPlayerBenefitSurplus(
  payload: ProposalPayload,
  relTotal: number,
  pnOpts?: ResolveProposalPnOptions,
  fairness?: AiOfferFairnessOpts,
): number {
  const { givePn, receivePn } = resolveProposalPn(payload, pnOpts);
  const isOneSidedGift =
    givePn > 0
    && receivePn <= 0
    && !(payload.receiveItems?.length);
  if (isOneSidedGift) return givePn;
  return -responderPwSurplus(givePn, receivePn, relTotal, fairness);
}

/**
 * R-DYPLOMACJA-BILANS-UNIFIKACJA-Q1-C (GOAL b): `aiProposalPlayerBenefitSurplus` liczy
 * poprawnie surowe {givePn, receivePn} z payloadu, ale zakłada STRUKTURALNIE, że
 * payload.giveItems/goldPerTurn itd. reprezentują "co daje AI" (proposer=AI, responder=gracz)
 * — bo dawniej `generateCounterOffer` był wołany WYŁĄCZNIE w tym układzie. Funkcja jest
 * generycznie "surplus dla payloadowego RESPONDENTA" (kto NIE jest właścicielem giveItems),
 * niezależnie od tego, kim ten respondent faktycznie jest — nazwa/dokumentacja mówi "gracz"
 * tylko dlatego, że dotąd żaden kod nie wołał jej z odwrotnym układem ról.
 *
 * `generateCounterOffer` (diplomacy-proposals.ts) jest wołana też z PendingNegotiation, gdzie
 * `entry.proposerOwnerId` jest stałe od rundy 1 (patrz komentarz przy `resolveNegotiationAsResponder`)
 * i bywa GRACZEM (gracz zainicjował, AI odpowiada kontrofertą) — wtedy payload.giveItems
 * reprezentuje "co daje GRACZ", nie AI, więc wywołanie `aiProposalPlayerBenefitSurplus` wprost
 * fałszywie liczyłoby "surplus AI" pod etykietą "surplus gracza" (bramka tolerancji
 * `aiOfferPwSurplusTolerance` w `generateCounterOffer` sprawdzałaby wtedy WŁASNY apetyt AI
 * zamiast korzyści gracza — odwrócona logika, nie tylko odwrócona etykieta).
 *
 * Ta funkcja jest jedynym poprawnym punktem wejścia dla `generateCounterOffer`: zawsze zwraca
 * surplus PRAWDZIWEGO gracza (ownerId 0), niezależnie od tego, czy w payloadzie strukturalnym
 * proponentem jest AI (`proposerIsPlayer=false`, deleguje bit-identycznie do
 * `aiProposalPlayerBenefitSurplus` — zero zmiany zachowania na dzisiejszej, zweryfikowanej
 * ścieżce) czy gracz (`proposerIsPlayer=true`, NOWA ścieżka: matematyka odwrócona — swap
 * givePn/receivePn przed `responderPwSurplus`, oraz osobny check jednostronnego daru OD gracza,
 * którego wartość jest kosztem [-givePn], nie korzyścią [+givePn], jak przy darze OD AI).
 */
export function playerBenefitSurplusByRole(
  payload: ProposalPayload,
  relTotal: number,
  proposerIsPlayer: boolean,
  pnOpts?: ResolveProposalPnOptions,
  fairness?: AiOfferFairnessOpts,
): number {
  if (!proposerIsPlayer) {
    return aiProposalPlayerBenefitSurplus(payload, relTotal, pnOpts, fairness);
  }
  const { givePn, receivePn } = resolveProposalPn(payload, pnOpts);
  const isOneSidedGiftFromPlayer =
    givePn > 0
    && receivePn <= 0
    && !(payload.receiveItems?.length);
  if (isOneSidedGiftFromPlayer) return -givePn;
  return -responderPwSurplus(receivePn, givePn, relTotal, fairness);
}

function pnToPaymentAmount(paymentTyp: 'zloto' | 'praca', targetPn: number): number {
  if (targetPn <= 0) return 0;
  if (paymentTyp === 'zloto') {
    const perUnit = diplomacyPnZloto(1);
    if (perUnit <= 0) return targetPn;
    return Math.max(1, Math.ceil(targetPn / perUnit));
  }
  const perUnit = diplomacyPnPraca(1);
  if (perUnit <= 0) return targetPn;
  return Math.max(1, Math.ceil(targetPn / perUnit));
}

/**
 * Docelowa zapłata (PW) przy sprzedaży surowca przez proponenta — maksymalna akceptowalna
 * przy bilansie blisko 0 (minimalna nadwyżka dla respondenta).
 */
export function targetResourceTradePaymentPn(
  resourceGivePn: number,
  relTotal: number,
  difficulty: GameDifficulty = 'normal',
): number {
  if (resourceGivePn <= 0) return 0;
  const rel = Math.min(100, Math.max(1, relTotal));
  const maxAcceptedPn = Math.floor(resourceGivePn * rel / 100);
  if (!aiOfferTargetsZeroBalance(difficulty)) return maxAcceptedPn;
  const undershoot = aiOfferPwUndershootAllowance(difficulty);
  return Math.max(0, maxAcceptedPn - undershoot);
}

/** Dopasuj zaplataPerTura (¤ lub Praca) do bilansu PW ≈ 0 @ Relacji. */
export function adjustZaplataPerTuraForZeroBalance(
  zaplataPerTura: number,
  zaplataTyp: 'zloto' | 'praca',
  resourceGivePn: number,
  relTotal: number,
  difficulty: GameDifficulty = 'normal',
): number {
  if (!aiOfferTargetsZeroBalance(difficulty) || resourceGivePn <= 0) return zaplataPerTura;
  const targetPn = targetResourceTradePaymentPn(resourceGivePn, relTotal, difficulty);
  const adjusted = pnToPaymentAmount(zaplataTyp, targetPn);
  return adjusted > 0 ? adjusted : zaplataPerTura;
}

/** Skróć nadmiar złota w koszyku giveItems do tolerancji surplusu respondenta. */
export function trimProposalGoldForZeroBalance(
  payload: ProposalPayload,
  relTotal: number,
  difficulty: GameDifficulty = 'normal',
  pnOpts?: ResolveProposalPnOptions,
  fairness?: AiOfferFairnessOpts,
): ProposalPayload {
  if (!aiOfferTargetsZeroBalance(difficulty)) return payload;
  const tolerance = aiOfferPwSurplusTolerance(difficulty);
  const surplus = aiProposalPlayerBenefitSurplus(payload, relTotal, pnOpts, fairness);
  if (surplus <= tolerance) return payload;

  const items = [...(payload.giveItems ?? [])];
  const goldIdx = items.findIndex(i => i.typ === 'zloto');
  if (goldIdx < 0) return payload;

  const goldItem = items[goldIdx]!;
  const currentGold = goldItem.ilosc ?? 0;
  if (currentGold <= 0) return payload;

  let lo = 0;
  let hi = currentGold;
  let best = -1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const trialItems = [...items];
    if (mid <= 0) {
      trialItems.splice(goldIdx, 1);
    } else {
      trialItems[goldIdx] = { ...goldItem, ilosc: mid };
    }
    const trialPayload: ProposalPayload = {
      ...payload,
      giveItems: trialItems.length ? trialItems : undefined,
      goldOnce: mid > 0 ? mid : undefined,
    };
    const trialSurplus = aiProposalPlayerBenefitSurplus(trialPayload, relTotal, pnOpts, fairness);
    if (trialSurplus <= tolerance) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  if (best < 0 || best === currentGold) return payload;
  const outItems = [...items];
  if (best <= 0) {
    outItems.splice(goldIdx, 1);
  } else {
    outItems[goldIdx] = { ...goldItem, ilosc: best };
  }
  return {
    ...payload,
    giveItems: outItems.length ? outItems : undefined,
    goldOnce: best > 0 ? best : undefined,
  };
}

type PaymentTyp = 'zloto' | 'praca';

function isPaymentBasketItem(item: BasketItem): item is BasketItem & { typ: PaymentTyp } {
  return item.typ === 'zloto' || item.typ === 'praca';
}

/** Surowiec ↔ zapłata (¤/Praca) — handel cykliczny lub jednorazowy. */
function hasResourcePaymentTrade(payload: ProposalPayload): boolean {
  const giveRes = payload.giveItems?.some(i => i.typ === 'surowiec_ilosc') ?? false;
  const recvRes = payload.receiveItems?.some(i => i.typ === 'surowiec_ilosc') ?? false;
  const givePay = payload.giveItems?.some(isPaymentBasketItem) ?? false;
  const recvPay = payload.receiveItems?.some(isPaymentBasketItem) ?? false;
  return (giveRes && recvPay) || (givePay && recvRes);
}

/**
 * Wyrównaj surowiec ↔ zapłata po ewentualnym clampBasket (zapłata gracza mogła spaść
 * do 1 ¤ przy pełnej cenie drewna). Podnosi zapłatę do targetu, gdy się mieści; inaczej
 * zmniejsza sztuki surowca, aż |nadwyżka gracza| ≤ tolerancji.
 */
export function trimResourcePaymentTradeForZeroBalance(
  payload: ProposalPayload,
  relTotal: number,
  difficulty: GameDifficulty = 'normal',
  pnOpts?: ResolveProposalPnOptions,
  fairness?: AiOfferFairnessOpts,
): ProposalPayload {
  if (!aiOfferTargetsZeroBalance(difficulty) || !hasResourcePaymentTrade(payload)) {
    return payload;
  }

  // R-DYPLO-CENNIK-SKALA-5X-Q1 (2026-08-13): normalizuj ilosc surowiec_ilosc do wielokrotności
  // kroku handlu PRZED jakąkolwiek oceną nadwyżki — inaczej ilość poniżej kroku (np. 1 szt.
  // zelaza, krok=5) wycenia się jako 0 PN (diplomacyPnSurowiecIlosc floruje wewnętrznie), co
  // fałszywie zaniża "żądanie" strony oddającej surowiec i wczesny early-return niżej uznawał
  // taką (nieprawidłową) ofertę za już wyrównaną zamiast ją wycofać.
  let giveItems = [...(payload.giveItems ?? [])];
  let receiveItems = [...(payload.receiveItems ?? [])];
  const resGiveIdx0 = giveItems.findIndex(i => i.typ === 'surowiec_ilosc');
  const resRecvIdx0 = receiveItems.findIndex(i => i.typ === 'surowiec_ilosc');
  const resSide0: 'give' | 'receive' | null =
    resGiveIdx0 >= 0 ? 'give' : resRecvIdx0 >= 0 ? 'receive' : null;
  if (resSide0) {
    const idx0 = resSide0 === 'give' ? resGiveIdx0 : resRecvIdx0;
    const arr0 = resSide0 === 'give' ? giveItems : receiveItems;
    const item0 = arr0[idx0]!;
    const krok0 = diplomacyHandelSurowiecKrok(item0.id);
    const floored0 = Math.floor((item0.ilosc ?? 0) / krok0) * krok0;
    if (floored0 < krok0) {
      // Nawet 1 blok (krok) się nie mieści w podanej ilości — nie ma czego wyrównywać,
      // wycofaj cały handel surowcem (spójne z ostatecznym `best < 1` niżej).
      return { ...payload, giveItems: undefined, receiveItems: undefined };
    }
    if (floored0 !== item0.ilosc) {
      const arrN = [...arr0];
      arrN[idx0] = { ...item0, ilosc: floored0 };
      if (resSide0 === 'give') giveItems = arrN; else receiveItems = arrN;
    }
  }
  const normalizedPayload: ProposalPayload = { ...payload, giveItems, receiveItems };

  const tolerance = aiOfferPwSurplusTolerance(difficulty);
  if (aiProposalPlayerBenefitSurplus(normalizedPayload, relTotal, pnOpts, fairness) <= tolerance) {
    return normalizedPayload;
  }

  const resGiveIdx = giveItems.findIndex(i => i.typ === 'surowiec_ilosc');
  const resRecvIdx = receiveItems.findIndex(i => i.typ === 'surowiec_ilosc');
  const resSide: 'give' | 'receive' | null =
    resGiveIdx >= 0 ? 'give' : resRecvIdx >= 0 ? 'receive' : null;
  if (!resSide) return normalizedPayload;

  const resIdx = resSide === 'give' ? resGiveIdx : resRecvIdx;
  const resArr = resSide === 'give' ? giveItems : receiveItems;
  const resItem = resArr[resIdx]!;
  const currentPkts = resItem.ilosc ?? 1;

  // R-DYPLO-CENNIK-SKALA-5X-Q1 (2026-08-13): binary search TYLKO nad wielokrotnościami
  // kroku handlu (`krok`, np. 5 szt. dla zelazo) — szukanie w jednostkach 1 szt. mogłoby
  // wylądować na ilości poniżej kroku (np. 1 szt. zelaza), która przy realnej wycenie
  // (diplomacyPnSurowiecIlosc) floruje do 0 PN. To dawało FAŁSZYWIE niski `trialSurplus`
  // (surowiec "za darmo" bo niewycenialny) i binary search "znajdywał" ilość, która przy
  // faktycznym transferze i tak floruje do zera — pozycja zostawała w koszyku z pozorną
  // (nie realną) ilością zamiast zostać wycofana. Szukanie w krokach eliminuje tę lukę
  // u źródła: każdy `mid` jest już z definicji wielokrotnością kroku.
  const krok = diplomacyHandelSurowiecKrok(resItem.id);
  const hiSteps = Math.floor(currentPkts / krok);

  let lo = 1;
  let hi = hiSteps;
  let best = -1;
  while (lo <= hi) {
    const midSteps = Math.floor((lo + hi) / 2);
    const mid = midSteps * krok;
    const trialResArr = [...resArr];
    trialResArr[resIdx] = { ...resItem, ilosc: mid };
    const trialPayload: ProposalPayload = {
      ...payload,
      giveItems: resSide === 'give' ? trialResArr : giveItems,
      receiveItems: resSide === 'receive' ? trialResArr : receiveItems,
    };
    const trialSurplus = aiProposalPlayerBenefitSurplus(trialPayload, relTotal, pnOpts, fairness);
    if (trialSurplus <= tolerance) {
      best = mid;
      lo = midSteps + 1;
    } else {
      hi = midSteps - 1;
    }
  }

  if (best < 1) {
    return {
      ...payload,
      giveItems: undefined,
      receiveItems: undefined,
    };
  }
  if (best === currentPkts) return payload;

  const outResArr = [...resArr];
  outResArr[resIdx] = { ...resItem, ilosc: best };
  return {
    ...payload,
    giveItems: resSide === 'give'
      ? (outResArr.length ? outResArr : undefined)
      : (giveItems.length ? giveItems : undefined),
    receiveItems: resSide === 'receive'
      ? (outResArr.length ? outResArr : undefined)
      : (receiveItems.length ? receiveItems : undefined),
  };
}

/**
 * Jedna bramka bilansu PW dla propozycji AI — dar ¤, handel surowcem (cykliczny i jednorazowy).
 * Wywoływać po clampBasketItemsToAffordable (main.ts: enqueueNegotiationFromAiCmd).
 */
export function trimProposalForZeroBalance(
  payload: ProposalPayload,
  relTotal: number,
  difficulty: GameDifficulty = 'normal',
  pnOpts?: ResolveProposalPnOptions,
  fairness?: AiOfferFairnessOpts,
): ProposalPayload {
  if (!aiOfferTargetsZeroBalance(difficulty)) return payload;
  let p = trimProposalGoldForZeroBalance(payload, relTotal, difficulty, pnOpts, fairness);
  p = trimResourcePaymentTradeForZeroBalance(p, relTotal, difficulty, pnOpts, fairness);
  return p;
}

/** Wybierz najmniejszą kwotę złota (słodzik), która przechodzi bramkę akceptacji. */
export function pickMinimalSweetenerGold(
  basePayload: ProposalPayload,
  relTotal: number,
  _difficulty: GameDifficulty,
  stepGold: number,
  maxSteps: number,
  isAccepted: (payload: ProposalPayload) => boolean,
  _pnOpts?: ResolveProposalPnOptions,
): number | null {
  let bestGold: number | null = null;

  for (let step = 1; step <= maxSteps; step++) {
    const extra = step * stepGold;
    const items: BasketItem[] = [...(basePayload.giveItems ?? [])];
    const idx = items.findIndex(i => i.typ === 'zloto');
    if (idx >= 0) {
      items[idx] = { ...items[idx]!, ilosc: (items[idx]!.ilosc ?? 0) + extra };
    } else {
      items.push({ typ: 'zloto', id: 'zloto', ilosc: extra });
    }
    const candidate: ProposalPayload = { ...basePayload, giveItems: items };
    if (!isAccepted(candidate)) continue;
    if (bestGold == null || extra < bestGold) bestGold = extra;
  }

  return bestGold;
}

/** Po zbudowaniu quick-deal — usuń nadmiar PN z giveItems powyżej fair min + tolerancja. */
export function trimQuickDealGiveToTolerance(
  giveItems: BasketItem[],
  receivePn: number,
  relTotal: number,
  difficulty: GameDifficulty = 'normal',
): BasketItem[] {
  if (!aiOfferTargetsZeroBalance(difficulty) || receivePn <= 0 || !giveItems.length) {
    return giveItems;
  }
  const fairMin = diplomacyFairGivePn(receivePn, relTotal);
  const tolerance = aiOfferPwSurplusTolerance(difficulty);
  const capPn = fairMin + tolerance;

  let giveSum = 0;
  for (const item of giveItems) {
    if (item.typ === 'zloto') giveSum += diplomacyPnZloto(item.ilosc ?? 0);
    else if (item.typ === 'praca') giveSum += diplomacyPnPraca(item.ilosc ?? 0);
    else if (item.typ === 'surowiec_ilosc') {
      giveSum += diplomacyPnSurowiecIlosc(item.id, item.ilosc ?? 1) ?? 0;
    }
  }
  if (giveSum <= capPn) return giveItems;

  const payload = trimProposalGoldForZeroBalance(
    { giveItems, receiveItems: [] },
    relTotal,
    difficulty,
  );
  return [...(payload.giveItems ?? [])];
}

/**
 * Dopina brakujące PW po stronie oddającej (złoto) do fair min @ Relacji — bilans ≈ 0.
 * Używane przez przycisk „Wyrównaj" w koszyku handlu.
 */
export function balanceGiveItemsToFairMin(
  giveItems: readonly BasketItem[],
  receivePn: number,
  relTotal: number,
  maxGold: number,
  pnOpts?: ResolveProposalPnOptions,
): BasketItem[] {
  if (receivePn <= 0) return [...giveItems];
  const rel = Math.min(100, Math.max(1, relTotal));
  const fairMin = diplomacyFairGivePn(receivePn, rel);
  const sumBase = { ...buildProposalPnSumOpts(pnOpts), side: 'give' as const };
  let givePn = 0;
  if (giveItems.length > 0) {
    const sum = diplomacySumPn([...giveItems], sumBase);
    if (sum != null) givePn = sum;
  }
  const deficit = fairMin - givePn;
  if (deficit <= 0) return [...giveItems];
  const result: BasketItem[] = giveItems.map(i => ({ ...i }));
  const goldPnPer = diplomacyPnZloto(1);
  if (goldPnPer <= 0) return result;
  const goldNeeded = Math.ceil(deficit / goldPnPer);
  const goldIdx = result.findIndex(i => i.typ === 'zloto');
  const currentGold = goldIdx >= 0 ? (result[goldIdx]!.ilosc ?? 0) : 0;
  const addGold = Math.min(goldNeeded, Math.max(0, maxGold - currentGold));
  if (addGold <= 0) return result;
  if (goldIdx >= 0) {
    result[goldIdx] = { ...result[goldIdx]!, ilosc: currentGold + addGold };
  } else {
    result.push({ typ: 'zloto', id: 'zloto', ilosc: addGold });
  }
  return result;
}
