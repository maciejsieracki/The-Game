/**
 * P-AI-008=C — tryb zagrożenia AI (próg hex + cel #1 Mocy).
 */

/** Domyślny zasięg wykrywania wroga przy mieście AI (ai-params: ekspansja_zagroz_zasieg). */
export const AI_THREAT_RANGE_DEFAULT = 7;

/** Score bazowy Murów w trybie zagrożenia (przed defenseScore archetypu). */
export const AI_THREAT_WALL_SCORE_BASE = 300;

/** Czy w trybie zagrożenia AI stawia Mury przed rozwojem (tylko lider Mocy). */
export function aiThreatPrioritizeWalls(powerRank: number | undefined): boolean {
  return (powerRank ?? 1) <= 1;
}

/** Score Murów w trybie zagrożenia — null gdy doganianie Mocy (nie #1). */
export function aiThreatWallProductionScore(
  defenseScore: number,
  powerRank: number | undefined,
): number | null {
  if (!aiThreatPrioritizeWalls(powerRank)) return null;
  return AI_THREAT_WALL_SCORE_BASE + defenseScore;
}
