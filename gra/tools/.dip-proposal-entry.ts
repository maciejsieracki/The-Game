
export {
  evaluateProposal, applyAcceptedProposal, aiCommandToPendingProposal,
  makeDealId, proposalHasResourceAccess, clampDealTurns,
} from '../src/game/diplomacy-proposals.ts';
export { addTreaty, hasTreaty, treatiesBrokenByWar, resolvePokojTrustTier } from '../src/game/diplomacy-treaties.ts';
export { getEffectiveDiplomacyParams } from '../src/game/diplomacy.ts';
