/**
 * P-AI-007=A — priorytety produkcji miasta AI z Panelu D (civ-ai.json).
 * Warstwa per-nacja na archetyp: (priorytet − 5) × 15 pkt.
 */

export interface AiProductionPriorityProfile {
  priorytetMilitarny?: number;
  priorytetEkonomia?: number;
  priorytetNauka?: number;
}

/** Delta score produkcji z kolumny Panelu D (neutralne przy wartości 5). */
export function aiPanelPriorityDelta(priorytet: number): number {
  return (priorytet - 5) * 15;
}

/** Dodatki do score wojskowego / ekonomicznego / naukowego (na archetyp). */
export function aiProductionScoreBoosts(profile?: AiProductionPriorityProfile): {
  military: number;
  economy: number;
  science: number;
} {
  return {
    military: aiPanelPriorityDelta(profile?.priorytetMilitarny ?? 5),
    economy: aiPanelPriorityDelta(profile?.priorytetEkonomia ?? 5),
    science: aiPanelPriorityDelta(profile?.priorytetNauka ?? 5),
  };
}
