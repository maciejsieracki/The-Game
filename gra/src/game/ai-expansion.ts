/**
 * P-AI-006=C — ekspansywność AI per nacja (zakładanie miast).
 * Skala ekspansywnosc: 0–10 z civ-ai.json.
 */

/** Próg ekspansywności omijający blokadę konsolidacji klastra (planCityFounding). */
export const EKSPANSJA_KLASTR_BYPASS = 4;

/** Bazowa rezerwa Pracy w puli AI po opłaceniu kosztu founding (20 Pracy). */
const FOUNDING_WORK_RESERVE_BASE = 10;

/** Ile Pracy AI zostawia w puli po founding (0 = wystarczy sam koszt 20). */
export function aiFoundingWorkReserve(ekspansywnosc: number): number {
  return Math.max(0, FOUNDING_WORK_RESERVE_BASE - ekspansywnosc * 2);
}

/** Efektywna pula Pracy dostępna na founding (po odjęciu rezerwy). */
export function aiTreasuryPracaForFounding(treasuryPraca: number, ekspansywnosc: number): number {
  return treasuryPraca - aiFoundingWorkReserve(ekspansywnosc);
}

/** Czy AI może founding mimo fazy konsolidacji klastra. */
export function aiBypassClusterConsolidation(ekspansywnosc: number): boolean {
  return ekspansywnosc >= EKSPANSJA_KLASTR_BYPASS;
}

/** Co ile tur bonus „cel #1 Mocy" dla heurystyki heksa founding. */
export function aiPowerGoalFoundingInterval(ekspansywnosc: number): number {
  if (ekspansywnosc >= 5) return 2;
  if (ekspansywnosc >= 3) return 3;
  return 4;
}

/** Kara za heks poza klastrem (findCityFoundingHex) — maleje z ekspansywnością. */
export function aiClusterOutsidePenalty(ekspansywnosc: number): number {
  return Math.max(0, 20 - ekspansywnosc * 4);
}
