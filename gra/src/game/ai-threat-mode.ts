/**
 * P-AI-008 — tryb zagrożenia AI: jednostki + rozwój (major AI), nie mury.
 * defensiveCopy (miasta-państwa) — osobna gałąź w chooseCityProduction.
 */

/** Domyślny zasięg wykrywania wroga przy mieście AI (ai-params: ekspansja_zagroz_zasieg). */
export const AI_THREAT_RANGE_DEFAULT = 7;

/** Score bazowy jednostki w trybie zagrożenia major AI. */
export const AI_THREAT_MAJOR_UNIT_SCORE_BASE = 300;

/** Dodatkowy boost score rozwoju gospodarczego przy zagrożeniu (major AI). */
export const AI_THREAT_MAJOR_DEV_BOOST = 120;

/** @deprecated P-AI-008: major AI nie buduje murów pod zagrożeniem — zostaje dla MP defensiveCopy. */
export const AI_THREAT_WALL_SCORE_BASE = 300;

/**
 * @deprecated P-AI-008 — tylko defensiveCopy / legacy testów helpera.
 * Major AI: zawsze false (nie priorytetyzuj murów).
 */
export function aiThreatPrioritizeWalls(powerRank: number | undefined): boolean {
  void powerRank;
  return false;
}

/**
 * Score Murów w trybie zagrożenia dla defensiveCopy (miasto-państwo).
 * Major AI: null — mury nie wchodzą do puli zagrożenia.
 */
export function aiThreatWallProductionScore(
  defenseScore: number,
  powerRank: number | undefined,
  defensiveCopy = false,
): number | null {
  void powerRank;
  if (!defensiveCopy) return null;
  return AI_THREAT_WALL_SCORE_BASE + defenseScore;
}

/** Score Wojownika / Łucznika przy zagrożeniu major AI. */
export function aiThreatMajorUnitScores(militaryScore: number): { wojownik: number; lucznik: number } {
  const base = AI_THREAT_MAJOR_UNIT_SCORE_BASE + militaryScore;
  return { wojownik: base, lucznik: base - 15 };
}

/** Boost score budynków rozwoju przy zagrożeniu major AI. */
export function aiThreatMajorDevScore(baseScore: number): number {
  return baseScore + AI_THREAT_MAJOR_DEV_BOOST;
}
