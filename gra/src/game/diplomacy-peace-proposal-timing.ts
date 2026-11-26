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

/**
 * Odmiana słowa „tura" przy liczbie N (pol.): 1 → „turę", 2–4 → „tury" (z wyjątkiem 12–14), reszta → „tur".
 * Używane w notce blokady „dostępne za N …" (np. 5 → „5 tur", 10 → „10 tur", 1 → „1 turę", 3 → „3 tury").
 */
export function turyWojnyLabel(n: number): string {
  const k = Math.abs(Math.trunc(Number.isFinite(n) ? n : 0));
  if (k === 1) return 'turę';
  const mod10 = k % 10;
  const mod100 = k % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'tury';
  return 'tur';
}

/**
 * R-WEB-DIPLO-PEACE-WINNER-PROPOSAL-FLOW-Q1 (r3, zarzut 1 Evaluatora): dopisek powodu odmowy do
 * komunikatu „X odrzuca propozycję: …" przy rozstrzygnięciu AI na stole. Dotyczy WYŁĄCZNIE
 * pokoju/zawieszenia broni (akcje `pokoj`, `rozejm`) — tam `evaluateProposal` zwraca konkretny
 * powód z liczbami (r5Gate / bilans PW / bramka relacji / zmęczenie). Dla pozostałych akcji
 * zwraca pusty ciąg (zachowanie sprzed zmiany).
 */
export function peaceRejectReasonSuffix(actionId: string, reason: string | undefined): string {
  if (actionId !== 'pokoj' && actionId !== 'rozejm') return '';
  const r = (reason ?? '').trim();
  return r.length > 0 ? ' — powód: ' + r : '';
}

/**
 * R-WEB-DIPLO-HOTSEAT-PEACE-COUNTER-UI-Q1 (HOTSEATHUD): etykieta licznika „Dostępne za N tur” przy
 * akcji pokoju między dwoma fotelami ludzkimi. Zwraca tekst tylko gdy para jest w wojnie i blokada
 * czasu trwa (`peaceProposalBlocked('pokoj', true, turnsAtWar)`); w pozostałych przypadkach null.
 * Ta sama reguła co bramka `humanPeaceRejectReason` w main.ts (brak własnej liczby).
 */
export function peaceCounterLabel(turnsAtWar: number | null | undefined): string | null {
  if (turnsAtWar === null || turnsAtWar === undefined) return null;
  if (!peaceProposalBlocked('pokoj', true, turnsAtWar)) return null;
  const left = peaceProposalTurnsLeft(turnsAtWar);
  return `Dostępne za ${left} ${turyWojnyLabel(left)}`;
}
