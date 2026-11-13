/** AI→player cyclic barter selection. Values and acceptance always come from the live proposal engine. */
import type { ProposalPayload } from './diplomacy-proposals';
import { diplomacyHandelSurowiecKrok, diplomacyNormalizeSurowiecIlosc } from './diplomacy-value-catalog';

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
}): AiTradeBarter | null {
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
    const giveStep = diplomacyHandelSurowiecKrok(give.key);
    const aiGiveStockAvailable = Math.max(0, (give.stock - Math.max(0, give.reserve)) / turns);
    const aiGiveMax = diplomacyNormalizeSurowiecIlosc(
      give.key, Math.floor(aiGiveStockAvailable + Math.max(0, give.netRate)),
    );
    if (aiGiveMax <= 0) continue;
    for (const receive of aiDeficits) {
      if (receive.key === give.key) continue;
      const humanSurplus = input.playerResources.find(r => r.key === receive.key && r.surplus);
      if (!humanSurplus) continue;
      const receiveStep = diplomacyHandelSurowiecKrok(receive.key);
      const humanStockAvailable = Math.max(0, (humanSurplus.stock - Math.max(0, humanSurplus.reserve)) / turns);
      const receiveMax = diplomacyNormalizeSurowiecIlosc(
        receive.key, Math.floor(humanStockAvailable + Math.max(0, humanSurplus.netRate)),
      );
      const aiNeedPerTurn = Math.max(receiveStep, Math.ceil(-receive.netRate));
      const needMax = diplomacyNormalizeSurowiecIlosc(receive.key, aiNeedPerTurn);
      const feasibleReceiveMax = Math.min(receiveMax, needMax);
      if (feasibleReceiveMax <= 0) continue;

      // Search down from each real feasible maximum. Normalization occurs before valuation,
      // so the gate sees the exact quantities that the negotiation and treaty will carry.
      for (let giveQty = aiGiveMax; giveQty >= giveStep; giveQty -= giveStep) {
        for (let receiveQty = feasibleReceiveMax; receiveQty >= receiveStep; receiveQty -= receiveStep) {
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
