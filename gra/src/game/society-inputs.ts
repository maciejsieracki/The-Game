/**
 * society-inputs.ts — pomocnicze wejścia do evaluateOrderFromBreakdown (B2-Q8=2A).
 * SILNIK mapuje stan miasta → pola HappinessBreakdownInput / LawBreakdownInput.
 */
import type { City } from './cities';
import type { Difficulty } from './order';
import { dominantReligion, type ReligionParams, type ReligionState } from './culture-religion';
import { cityFoundOrder } from './capital-capture';

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

/** Pierwsze miasto gracza (najniższy numer założenia wg cityFoundOrder, ownerId 0).
 *  UWAGA: porównanie numeryczne (nie localeCompare) — spójne z capital-capture.ts
 *  (patrz cityFoundOrder), żeby przy 10+ miastach globalnie "city10" nie wygrywał
 *  leksykograficznie z faktycznie starszym "city9". */
export function isPlayerCapitalCity(city: City, allCities: readonly City[]): boolean {
  if (city.ownerId !== 0) return false;
  let first: City | null = null;
  let firstOrder = Number.POSITIVE_INFINITY;
  for (const c of allCities) {
    if (c.ownerId !== 0) continue;
    const order = cityFoundOrder(c.id);
    if (!first || order < firstOrder) {
      first = c;
      firstOrder = order;
    }
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
