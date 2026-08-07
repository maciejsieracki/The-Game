
export {
  evaluateProposal, createNegotiation, applyCounterOffer, canCounterNegotiation, canPlayerCounterNegotiation,
  negotiationStillValid, resolveNegotiationAsResponder, negotiationToLegacyPending,
  resolvePlayerAcceptsAiPending, generateCounterOffer, negotiationAsProposal,
  hasPendingNegotiationForPair, findOwnOutgoingNegotiation,
  NEGOTIATION_MAX_ROUNDS, NEGOTIATION_EXPIRY_TURNS, makeNegotiationId,
} from '../src/game/diplomacy-proposals.ts';
export { getEffectiveDiplomacyParams } from '../src/game/diplomacy.ts';
