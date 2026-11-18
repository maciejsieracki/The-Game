/** First ten completed turns of each active war are protected from peace offers. */
export const PEACE_PROPOSAL_MIN_WAR_TURNS = 10;

export type PeaceProposalAction = 'pokoj' | 'rozejm' | 'trybut_oferta';

export function peaceProposalBlocked(actionId: string, atWar: boolean, turnsAtWar: number): boolean {
  return atWar
    && (actionId === 'pokoj' || actionId === 'rozejm' || actionId === 'trybut_oferta')
    && Math.max(0, Number.isFinite(turnsAtWar) ? turnsAtWar : 0) < PEACE_PROPOSAL_MIN_WAR_TURNS;
}

/**
 * R-WEB-DIPLO-PEACE-WINNER-PROPOSAL-FLOW-Q1: ile PEŁNYCH tur wojny brakuje do odblokowania
 * propozycji pokoju/rozejmu (0 = już wolno). Ta sama reguła co `peaceProposalBlocked`
 * (blokada: turnsAtWar < PEACE_PROPOSAL_MIN_WAR_TURNS), wyrażona w turach — do licznika w UI.
 */
export function peaceProposalTurnsLeft(turnsAtWar: number): number {
  const t = Math.floor(Number.isFinite(turnsAtWar) ? Math.max(0, turnsAtWar) : 0);
  return Math.max(0, PEACE_PROPOSAL_MIN_WAR_TURNS - t);
}
