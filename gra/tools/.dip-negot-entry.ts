
export {
  evaluateProposal, createNegotiation, applyCounterOffer, canCounterNegotiation,
  negotiationStillValid, resolveNegotiationAsResponder, negotiationToLegacyPending,
  resolvePlayerAcceptsAiPending, generateCounterOffer, negotiationAsProposal,
  NEGOTIATION_MAX_ROUNDS, NEGOTIATION_EXPIRY_TURNS, makeNegotiationId,
} from '../src/game/diplomacy-proposals.ts';
export { getEffectiveDiplomacyParams } from '../src/game/diplomacy.ts';
