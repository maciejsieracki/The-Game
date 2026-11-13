/** First ten completed turns of each active war are protected from peace offers. */
export const PEACE_PROPOSAL_MIN_WAR_TURNS = 10;

export type PeaceProposalAction = 'pokoj' | 'rozejm' | 'trybut_oferta';

export function peaceProposalBlocked(actionId: string, atWar: boolean, turnsAtWar: number): boolean {
  return atWar
    && (actionId === 'pokoj' || actionId === 'rozejm' || actionId === 'trybut_oferta')
    && Math.max(0, Number.isFinite(turnsAtWar) ? turnsAtWar : 0) < PEACE_PROPOSAL_MIN_WAR_TURNS;
}
