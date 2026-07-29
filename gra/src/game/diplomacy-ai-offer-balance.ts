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
  diplomacyPnPraca,
  diplomacyPnSurowiecIlosc,
  diplomacyPnZloto,
} from './diplomacy-value-catalog';
import { resolveProposalPn, type ResolveProposalPnOptions } from './diplomacy-pn-engine';

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
 */
export function responderPwSurplus(
  proposerGivePn: number,
  proposerReceivePn: number,
  relTotal: number,
): number {
  const rel = Math.min(100, Math.max(1, relTotal));
  const responderOfferPn = proposerReceivePn;
  const responderDemandPn = proposerGivePn;
  const fairMinPn = diplomacyFairGivePn(responderDemandPn, rel);
  return responderOfferPn - fairMinPn;
}

/**
 * Nadwyżka korzyści dla RESPONDENTA (gracz): dodatnia = dostaje więcej niż oddaje @ fair.
 * Dary jednostronne: cała wartość givePn proponenta.
 */
export function aiProposalPlayerBenefitSurplus(
  payload: ProposalPayload,
  relTotal: number,
  pnOpts?: ResolveProposalPnOptions,
): number {
  const { givePn, receivePn } = resolveProposalPn(payload, pnOpts);
  const isOneSidedGift =
    givePn > 0
    && receivePn <= 0
    && !(payload.receiveItems?.length);
  if (isOneSidedGift) return givePn;
  return -responderPwSurplus(givePn, receivePn, relTotal);
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
): ProposalPayload {
  if (!aiOfferTargetsZeroBalance(difficulty)) return payload;
  const tolerance = aiOfferPwSurplusTolerance(difficulty);
  const surplus = aiProposalPlayerBenefitSurplus(payload, relTotal, pnOpts);
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
    const trialSurplus = aiProposalPlayerBenefitSurplus(trialPayload, relTotal, pnOpts);
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
 * zmniejsza pakiety surowca, aż |nadwyżka gracza| ≤ tolerancji.
 */
export function trimResourcePaymentTradeForZeroBalance(
  payload: ProposalPayload,
  relTotal: number,
  difficulty: GameDifficulty = 'normal',
  pnOpts?: ResolveProposalPnOptions,
): ProposalPayload {
  if (!aiOfferTargetsZeroBalance(difficulty) || !hasResourcePaymentTrade(payload)) {
    return payload;
  }
  const tolerance = aiOfferPwSurplusTolerance(difficulty);
  if (aiProposalPlayerBenefitSurplus(payload, relTotal, pnOpts) <= tolerance) {
    return payload;
  }

  let giveItems = [...(payload.giveItems ?? [])];
  let receiveItems = [...(payload.receiveItems ?? [])];

  const resGiveIdx = giveItems.findIndex(i => i.typ === 'surowiec_ilosc');
  const resRecvIdx = receiveItems.findIndex(i => i.typ === 'surowiec_ilosc');
  const resSide: 'give' | 'receive' | null =
    resGiveIdx >= 0 ? 'give' : resRecvIdx >= 0 ? 'receive' : null;
  if (!resSide) return payload;

  const resIdx = resSide === 'give' ? resGiveIdx : resRecvIdx;
  const resArr = resSide === 'give' ? giveItems : receiveItems;
  const resItem = resArr[resIdx]!;
  const currentPkts = resItem.ilosc ?? 1;

  let lo = 1;
  let hi = currentPkts;
  let best = -1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const trialResArr = [...resArr];
    trialResArr[resIdx] = { ...resItem, ilosc: mid };
    const trialPayload: ProposalPayload = {
      ...payload,
      giveItems: resSide === 'give' ? trialResArr : giveItems,
      receiveItems: resSide === 'receive' ? trialResArr : receiveItems,
    };
    const trialSurplus = aiProposalPlayerBenefitSurplus(trialPayload, relTotal, pnOpts);
    if (trialSurplus <= tolerance) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
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
): ProposalPayload {
  if (!aiOfferTargetsZeroBalance(difficulty)) return payload;
  let p = trimProposalGoldForZeroBalance(payload, relTotal, difficulty, pnOpts);
  p = trimResourcePaymentTradeForZeroBalance(p, relTotal, difficulty, pnOpts);
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
