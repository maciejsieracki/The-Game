/**
 * P-AI-PROD-GATE-Q1=A — trudność efektywna per owner (major vs miasto-państwo).
 * Pure helper testowany przez ai-prod-gate-difficulty-test.cjs.
 */

import type { DifficultyLevel } from './city-state-difficulty';

export function effectiveGameDifficultyForOwnerPure(
  ownerId: number,
  menuDifficulty: DifficultyLevel,
  menuCityStateDifficulty: DifficultyLevel,
  typCityCopyOwnerIds: ReadonlySet<number>,
): DifficultyLevel {
  return typCityCopyOwnerIds.has(ownerId) ? menuCityStateDifficulty : menuDifficulty;
}
