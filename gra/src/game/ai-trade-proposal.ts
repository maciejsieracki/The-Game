/** AI→player cyclic barter selection. Values and acceptance always come from the live proposal engine. */
import type { ProposalPayload } from './diplomacy-proposals';
import { diplomacyHandelSurowiecKrok, diplomacyNormalizeSurowiecIlosc } from './diplomacy-value-catalog';
import aiParamsRaw from '../../data/ai-params.json';

/**
 * R-WEB-AI-TRADE-OFFER-QTY-CAP-3X-NEED-Q1: ilość odbioru AI <= mnożnik x potrzeba AI na turę
 * (ai-params.json, decyzja właściciela 2026-11-15). Fallback 3 gdy klucz brakuje.
 */
export const AI_TRADE_RECEIVE_NEED_MULTIPLIER = Math.max(1, Number(
  aiParamsRaw.propozycja_wymiany_surowcow_ilosc_mnoznik_potrzeby?.wartosc ?? 3,
));
/**
 * Stały sufit kandydatów na każdą oś pętli wyszukiwania ilości (ai-params.json). Koszt pętli
 * jest ograniczony tą stałą, nie zapasem gracza (pomiar FALI 730: 763 ms przy 20000, 2681 ms przy 100000).
 */
export const AI_TRADE_QTY_SEARCH_MAX_CANDIDATES = Math.max(1, Math.floor(Number(
  aiParamsRaw.propozycja_wymiany_surowcow_sufit_iteracji?.wartosc ?? 64,
)));

/**
 * Malejąca lista kandydatów ilości (wielokrotności `krok`) od `max` w dół do `krok`, co najwyżej
 * `maxCandidates` pozycji. Gdy zakres jest większy niż sufit, połowa sufitu to próbki z góry
 * zakresu (co stały skok, pierwszy zawsze `max`), a druga połowa to drobne kroki od dołu
 * (krok, 2·krok, …), żeby małe uczciwe oferty nadal były znajdowane przy stałym koszcie.
 */
export function boundedQtyCandidates(max: number, krok: number, maxCandidates: number): number[] {
  if (!(max >= krok) || !(krok > 0)) return [];
  const count = Math.floor(max / krok);
  const cap = Math.max(1, Math.floor(maxCandidates));
  if (count <= cap) {
    const full: number[] = [];
    for (let k = count; k >= 1; k -= 1) full.push(k * krok);
    return full;
  }
  const half = Math.max(1, Math.ceil(cap / 2));
  const stride = Math.ceil(count / half);
  const top: number[] = [];
  for (let k = count; k >= 1; k -= stride) top.push(k);
  const lowestTop = top[top.length - 1] ?? 1;
  const bottomLimit = cap - top.length;
  const bottom: number[] = [];
  for (let k = Math.min(bottomLimit, lowestTop - 1); k >= 1; k -= 1) bottom.push(k);
  return [...top, ...bottom].map(k => k * krok);
}

export interface BarterResourceState {
  key: string;
  stock: number;
  netRate: number;
  /** Existing need classifier marked this resource as a deficit. */
  deficit: boolean;
  /** Existing surplus classifier marked this resource safe to release. */
  surplus: boolean;
  /** Existing upkeep/build reserve the owner must retain. */
  reserve: number;
}

export interface AiTradeBarter {
  giveKey: string;
  giveQty: number;
  receiveKey: string;
  receiveQty: number;
  payload: ProposalPayload;
  givePn: number;
  receivePn: number;
}

/**
 * Select a fair cyclic exchange from actual available stocks and rates. The search has no
 * arbitrary unit cap: per-turn quantities are bounded by the existing stock reserve and
 * projected net production over the normal cyclic duration, then floored to the catalog step.
 * Every quantized pair goes through the existing trade fairness gate and exact payload evaluator.
 */
export function selectAiTradeBarter(input: {
  aiResources: readonly BarterResourceState[];
  playerResources: readonly BarterResourceState[];
  turns: number;
  fairnessGate: (givePn: number, receivePn: number) => boolean;
  resolvePayloadPn: (payload: ProposalPayload) => { givePn: number; receivePn: number };
  evaluateExactPayload: (payload: ProposalPayload) => boolean;
  /** Override for tests; defaults to ai-params.json. */
  receiveNeedMultiplier?: number;
  /** Override for tests; defaults to ai-params.json. */
  maxSearchCandidates?: number;
  /** R-WEB-DIPLO-TRADE-PRICE-ERA-MULT-Q1 r2: epoka umowy (wyższa z dwóch stron) dla kroku/normalizacji ilości; brak = epoka globalna. */
  tradeEra?: number;
}): AiTradeBarter | null {
  const needMultiplier = input.receiveNeedMultiplier ?? AI_TRADE_RECEIVE_NEED_MULTIPLIER;
  const maxCandidates = input.maxSearchCandidates ?? AI_TRADE_QTY_SEARCH_MAX_CANDIDATES;
  const turns = Math.max(1, Math.floor(input.turns));
  const aiSurpluses = [...input.aiResources]
    .filter(r => r.surplus && Number.isFinite(r.stock) && Number.isFinite(r.netRate))
    .sort((a, b) => a.key.localeCompare(b.key));
  // First choose the resource the human most lacks; the AI must have a real surplus of it.
  const playerDeficits = [...input.playerResources]
    .filter(r => r.deficit && Number.isFinite(r.stock) && Number.isFinite(r.netRate))
    .sort((a, b) => a.stock / Math.max(1, -a.netRate) - b.stock / Math.max(1, -b.netRate)
      || a.key.localeCompare(b.key));
  const aiDeficits = [...input.aiResources]
    .filter(r => r.deficit && Number.isFinite(r.stock) && Number.isFinite(r.netRate))
    .sort((a, b) => a.stock / Math.max(1, -a.netRate) - b.stock / Math.max(1, -b.netRate)
      || a.key.localeCompare(b.key));

  for (const humanNeed of playerDeficits) {
    const give = aiSurpluses.find(r => r.key === humanNeed.key);
    if (!give) continue;
    const giveStep = diplomacyHandelSurowiecKrok(give.key, input.tradeEra);
    const aiGiveStockAvailable = Math.max(0, (give.stock - Math.max(0, give.reserve)) / turns);
    const aiGiveMax = diplomacyNormalizeSurowiecIlosc(
      give.key, Math.floor(aiGiveStockAvailable + Math.max(0, give.netRate)), undefined, input.tradeEra,
    );
    if (aiGiveMax <= 0) continue;
    const giveQtys = boundedQtyCandidates(aiGiveMax, giveStep, maxCandidates);
    for (const receive of aiDeficits) {
      if (receive.key === give.key) continue;
      const humanSurplus = input.playerResources.find(r => r.key === receive.key && r.surplus);
      if (!humanSurplus) continue;
      const receiveStep = diplomacyHandelSurowiecKrok(receive.key, input.tradeEra);
      const humanStockAvailable = Math.max(0, (humanSurplus.stock - Math.max(0, humanSurplus.reserve)) / turns);
      const receiveMax = diplomacyNormalizeSurowiecIlosc(
        receive.key, Math.floor(humanStockAvailable + Math.max(0, humanSurplus.netRate)), undefined, input.tradeEra,
      );
      // Potrzeba AI na turę (ta sama miara co dotąd: deficyt netto). Odbiór AI = min(nadwyżka
      // gracza, mnożnik x potrzeba), a nie sama potrzeba.
      // Najmniejsza oferta AI = jeden blok epoki umowy (decyzja ABC 2026-11-15, wariant B): limit
      // mnożnika działa powyżej jednego bloku, nigdy poniżej. Podłoga liczona z SUROWEJ potrzeby,
      // nie z potrzeby już podniesionej do bloku (inaczej 3 × blok = 3 bloki przy małej potrzebie).
      const rawAiNeedPerTurn = Math.max(0, Math.ceil(-receive.netRate));
      const needCapMax = Math.max(
        receiveStep,
        diplomacyNormalizeSurowiecIlosc(receive.key, needMultiplier * rawAiNeedPerTurn, undefined, input.tradeEra),
      );
      const feasibleReceiveMax = Math.min(receiveMax, needCapMax);
      if (feasibleReceiveMax <= 0) continue;
      const receiveQtys = boundedQtyCandidates(feasibleReceiveMax, receiveStep, maxCandidates);

      // Search down from each real feasible maximum. Normalization occurs before valuation,
      // so the gate sees the exact quantities that the negotiation and treaty will carry.
      // Stala lista kandydatow ilosci oddania (giveQtys) moze ominac wabna uczciwa wartosc
      // w gestym zakresie. Dla kazdej ilosci odbioru dokladamy kilka kandydatow oddania
      // wyliczonych z ceny PW (krok 3 kroki wokol estymaty): koszt na ilosc odbioru jest staly.
      const probe = (gq: number, rq: number) => input.resolvePayloadPn({
        giveItems: [{ typ: 'surowiec_ilosc', id: give.key, ilosc: gq }],
        receiveItems: [{ typ: 'surowiec_ilosc', id: receive.key, ilosc: rq }],
        resourceTradeMode: 'per_turn',
        turns,
        exchangeDurationTurns: turns,
      });
      const pnPerGiveStep = probe(giveStep, receiveStep).givePn / giveStep;
      for (const receiveQty of receiveQtys) {
        const estGiveSteps = pnPerGiveStep > 0
          ? Math.round(probe(giveStep, receiveQty).receivePn / pnPerGiveStep / giveStep) : 0;
        const giveSet = new Set(giveQtys);
        for (let k = estGiveSteps - 3; k <= estGiveSteps + 3; k += 1) {
          if (k >= 1 && k * giveStep <= aiGiveMax) giveSet.add(k * giveStep);
        }
        const giveList = [...giveSet].sort((a, b) => b - a);
        for (const giveQty of giveList) {
          const payload: ProposalPayload = {
            giveItems: [{ typ: 'surowiec_ilosc', id: give.key, ilosc: giveQty }],
            receiveItems: [{ typ: 'surowiec_ilosc', id: receive.key, ilosc: receiveQty }],
            resourceTradeMode: 'per_turn',
            turns,
            exchangeDurationTurns: turns,
          };
          const { givePn, receivePn } = input.resolvePayloadPn(payload);
          if (givePn <= 0 || receivePn <= 0) continue;
          if (!input.fairnessGate(givePn, receivePn)) continue;
          if (!input.evaluateExactPayload(payload)) continue;
          return { giveKey: give.key, giveQty, receiveKey: receive.key, receiveQty, payload, givePn, receivePn };
        }
      }
    }
  }
  return null;
}
