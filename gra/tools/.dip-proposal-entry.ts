
export {
  evaluateProposal, applyAcceptedProposal, aiCommandToPendingProposal,
  makeDealId, proposalHasResourceAccess, clampDealTurns,
  resolvePlayerAcceptsAiPending, AI_TRADE_GOLD_ONCE, AI_TRADE_GOLD_MAX,
  enrichAiCommandWithTreasury, formatAiDiplomacyPlayerMessage,
} from '../src/game/diplomacy-proposals.ts';
export { capAiGoldOffer, AI_TRADE_GOLD_MAX as ECO_GOLD_MAX } from '../src/game/diplomacy-economy.ts';
export { addTreaty, hasTreaty, treatiesBrokenByWar, resolvePokojTrustTier } from '../src/game/diplomacy-treaties.ts';
export { getEffectiveDiplomacyParams } from '../src/game/diplomacy.ts';
