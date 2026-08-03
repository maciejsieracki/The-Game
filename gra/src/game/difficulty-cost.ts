/**
 * difficulty-cost.ts
 * Asymetria kosztow (budynki, jednostki, badania) i progu wzrostu ludnosci
 * wg poziomu trudnosci.
 *
 * Dziala ON TOP OF tempa z kreatora (niski/normalny/wysoki budynki/jednostki,
 * szybka/standardowa/dluga badania, wysoki/normalny/wolny wzrost ludnosci).
 * Baza = wybor gracza w kreatorze mapy.
 *
 * Koszty (budynki/jednostki/badania):
 *   Normalna: gracz i AI + panstwa miast — x1.
 *   Latwa:    gracz x1, AI + panstwa miast x2 wzgledem gracza.
 *   Trudna:   gracz x2, AI + panstwa miast x1 (standard).
 *
 * Prog zywnosci do +1 populacji (wiecej = wolniejszy wzrost):
 *   Normalna: symetria x1.
 *   Latwa:    gracz x1, AI x2 (wiecej zywnosci niz gracz).
 *   Trudna:   gracz x2, AI x0.5 (polowa progu — „tanszy” wzrost).
 *
 * ownerId 0 = gracz; ownerId > 0 = AI rywale i panstwa miast.
 */

import { applyTempoKoszt, type TempoGry } from './tech-tempo';
import {
  WZROST_LUDNOSCI_PACE,
  type WzrostLudnosciPace,
} from './population-growth-tempo';
import { R_STAWKI_KOSZT_MULT } from './r-stawki-strojenie';

export type GameDifficulty = 'easy' | 'normal' | 'hard';

/**
 * Maciej 2026-07-24 (B-RESEARCH-COST-MODEL): dawniej x2 w kodzie — teraz wchloniete do tech.json.
 * R-STAWKI-STROJENIE 2026-08-03: ×2 kosztów badań (playtest; cofnij → R_STAWKI_KOSZT_MULT=1).
 * Efektywny koszt = JSON × tempo kreatora × GLOBAL × asymetria trudnosci.
 */
export const GLOBAL_RESEARCH_COST_MULT = R_STAWKI_KOSZT_MULT;

/** Gracz ludzki — ownerId 0. Wszystko inne (AI, miasta-panstwa) = strona AI. */
export function isPlayerOwner(ownerId: number): boolean {
  return ownerId === 0;
}

/**
 * Mnoznik trudnosci dla wlasciciela (po tempie kreatora, przed zaokragleniem).
 * Normal: 1 dla wszystkich. Easy: gracz 1, AI 2. Hard: gracz 2, AI 1.
 */
export function getCostMultiplierForOwner(
  ownerId: number,
  difficulty: GameDifficulty,
): number {
  if (difficulty === 'normal') return 1;
  if (difficulty === 'easy') return isPlayerOwner(ownerId) ? 1 : 2;
  return isPlayerOwner(ownerId) ? 2 : 1;
}

/** Koszt po tempie + mnoznik trudnosci (minimum 1). */
export function applyDifficultyCostMultiplier(
  costAfterPace: number,
  ownerId: number,
  difficulty: GameDifficulty,
): number {
  const mult = getCostMultiplierForOwner(ownerId, difficulty);
  return Math.max(1, Math.round(costAfterPace * mult));
}

/** Koszt badania: tempo gry + globalny balans + asymetria trudnosci. */
export function scaledResearchCost(
  baseCost: number,
  tempo: TempoGry,
  ownerId: number,
  difficulty: GameDifficulty,
): number {
  const afterTempo = applyTempoKoszt(baseCost, tempo);
  const afterGlobal = Math.max(1, Math.round(afterTempo * GLOBAL_RESEARCH_COST_MULT));
  return applyDifficultyCostMultiplier(afterGlobal, ownerId, difficulty);
}

/**
 * Mnoznik trudnosci dla progu zywnosci do wzrostu (+1 pop).
 * Hard AI: x0.5 (dwa razy mniej zywnosci niz baza po tempie).
 */
export function getPopulationGrowthDifficultyMultiplier(
  ownerId: number,
  difficulty: GameDifficulty,
): number {
  if (difficulty === 'normal') return 1;
  if (difficulty === 'easy') return isPlayerOwner(ownerId) ? 1 : 2;
  return isPlayerOwner(ownerId) ? 2 : 0.5;
}

/** Tempo kreatora x trudnosc — laczny mnoznik progu wzrostu. */
export function getPopulationGrowthThresholdMultiplier(
  ownerId: number,
  pace: WzrostLudnosciPace | number,
  difficulty: GameDifficulty,
): number {
  const paceMult = typeof pace === 'number' ? pace : WZROST_LUDNOSCI_PACE[pace];
  return paceMult * getPopulationGrowthDifficultyMultiplier(ownerId, difficulty);
}

/** Próg 20 + N x wsp. po tempie kreatora i trudnosci (minimum 1). */
export function applyPopulationGrowthThreshold(
  baseThreshold: number,
  ownerId: number,
  pace: WzrostLudnosciPace | number,
  difficulty: GameDifficulty,
): number {
  const mult = getPopulationGrowthThresholdMultiplier(ownerId, pace, difficulty);
  return Math.max(1, Math.round(baseThreshold * mult));
}
