/**
 * society-inputs.ts — pomocnicze wejścia do evaluateOrderFromBreakdown (B2-Q8=2A).
 * SILNIK mapuje stan miasta → pola HappinessBreakdownInput / LawBreakdownInput.
 */
import type { City } from './cities';
import type { Difficulty } from './order';
import { dominantReligion, type ReligionParams, type ReligionState } from './culture-religion';

/** Czy dominująca religia miasta ≠ religia cywilizacji właściciela. */
export function isForeignReligionDominant(
  cityRel: ReligionState,
  ownerCivReligion: string | null,
  religionParams: ReligionParams,
): boolean {
  const dom = dominantReligion(cityRel, religionParams);
  if (dom.status !== 'dominant' || !dom.religion) return false;
  if (!ownerCivReligion) return true;
  return dom.religion !== ownerCivReligion;
}

/** Udział własnej kultury [0..1] — v1.0: z pola miasta lub fallback 1. */
export function resolveOwnCultureShare(city: { ownCultureShare?: number; kulturaOwnShare?: number }): number {
  const raw = city.ownCultureShare ?? city.kulturaOwnShare;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.max(0, Math.min(1, raw));
  }
  return 1;
}

/** Pierwsze miasto gracza (najniższe id właściciela 0). */
export function isPlayerCapitalCity(city: City, allCities: readonly City[]): boolean {
  if (city.ownerId !== 0) return false;
  let first: City | null = null;
  for (const c of allCities) {
    if (c.ownerId !== 0) continue;
    if (!first || c.id.localeCompare(first.id) < 0) first = c;
  }
  return first?.id === city.id;
}

/** D18-4 A+C: bonus stolicy easy T1–maxTur. */
export function stolicaEasyBonusActive(
  difficulty: Difficulty,
  turn: number,
  city: City,
  allCities: readonly City[],
  maxTur = 10,
): boolean {
  if (difficulty !== 'easy') return false;
  if (!Number.isFinite(turn) || turn < 1 || turn > maxTur) return false;
  return isPlayerCapitalCity(city, allCities);
}
