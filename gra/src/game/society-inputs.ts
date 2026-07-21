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

/**
 * Czy `city` jest stolicą gracza (ownerId 0).
 *
 * Follow-up „przenieś stolicę" (2026-07-21): stolica gracza jest teraz WYZNACZONYM
 * miastem (`capitalCityIdByOwner` w main.ts), nie zawsze najstarszym. `designatedCapitalId`
 * — id aktualnej wyznaczonej stolicy gracza, czytane przez main.ts z tamtej mapy
 * (main.ts sam robi fallback na najstarsze, jeśli brak wpisu). Gdy `undefined`/`null`
 * (caller nie podał — np. stary kod, testy) -> fallback lokalny: najstarsze miasto
 * gracza wg cityFoundOrder (porównanie NUMERYCZNE, nie localeCompare — spójne z
 * capital-capture.ts, żeby przy 10+ miastach globalnie "city10" nie wygrywał
 * leksykograficznie z faktycznie starszym "city9").
 */
export function isPlayerCapitalCity(
  city: City,
  allCities: readonly City[],
  designatedCapitalId?: string | null,
): boolean {
  if (city.ownerId !== 0) return false;
  if (designatedCapitalId != null) return designatedCapitalId === city.id;
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
  designatedCapitalId?: string | null,
): boolean {
  if (difficulty !== 'easy') return false;
  if (!Number.isFinite(turn) || turn < 1 || turn > maxTur) return false;
  return isPlayerCapitalCity(city, allCities, designatedCapitalId);
}
