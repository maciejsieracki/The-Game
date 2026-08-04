/**
 * city-founding.ts — koszt założenia miasta z mapy (B1 Maciej 2026-06-29).
 * Historyczny Osadnik: 20 Pracy + 1 ludność.
 * B1-FOUND-Q1=A+B: ludność z największego miasta z pop ≥ 2 (min. 1 zostaje).
 * B1-FOUND-Q2=A: pierwsze miasto gracza FREE.
 */
import miastoParams from '../../data/miasto-params.json';

type ParamRow = { wartosc?: number };

export interface FoundCitySourceCity {
  id: string;
  ownerId: number;
  population: number;
}

function readParam(row: ParamRow | undefined, fallback: number): number {
  const v = row?.wartosc;
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

/** Koszt Pracy (skarbiec/pula — jak applyBuildRequest). */
export function foundCityWorkCost(): number {
  return readParam(
    (miastoParams as { zaloz_miasto_koszt_praca?: ParamRow }).zaloz_miasto_koszt_praca,
    20,
  );
}

/** Ludność pobierana z miasta-źródła. */
export function foundCityPopulationCost(): number {
  return readParam(
    (miastoParams as { zaloz_miasto_koszt_ludnosci?: ParamRow }).zaloz_miasto_koszt_ludnosci,
    1,
  );
}

export interface FoundCityAffordance {
  ok: boolean;
  reason?: string;
  kosztPraca: number;
  kosztLudnosc: number;
  /** Miasto, z którego SILNIK odejmie ludność (FOUND-Q1 A+B). */
  sourceCityId?: string;
}

/** Czy gracz ma już co najmniej jedno miasto (FOUND-Q2=A → kolejne płatne). */
export function isSubsequentFoundCity(playerCities: ReadonlyArray<{ ownerId: number }>, ownerId: number): boolean {
  return playerCities.filter(c => c.ownerId === ownerId).length > 0;
}

/** AI-FOUND-Q1=A: AI major wymaga pop ≥ 2 w mieście-źródle (jak gracz: koszt+1). */
export const AI_FOUNDING_SOURCE_MIN_POP = 2;

/**
 * B1-FOUND-Q1=A+B: największe miasto cywilizacji z populacją ≥ koszt+1 (min. 1 zostaje).
 * AI-FOUND-Q1=A: AI major (ownerId > 0) wymaga pop ≥ 2 — po founding źródło 2→1.
 * Przy remisie wielkości — losowe miasto spośród największych.
 */
export function pickSourceCityForFounding(
  cities: ReadonlyArray<FoundCitySourceCity>,
  ownerId: number,
  rand: () => number = Math.random,
): FoundCitySourceCity | null {
  const popCost = foundCityPopulationCost();
  const minPop = ownerId > 0
    ? Math.max(popCost + 1, AI_FOUNDING_SOURCE_MIN_POP)
    : popCost + 1;
  const eligible = cities.filter(c => c.ownerId === ownerId && c.population >= minPop);
  if (eligible.length === 0) return null;
  const maxPop = Math.max(...eligible.map(c => c.population));
  const tied = eligible.filter(c => c.population === maxPop);
  if (tied.length === 1) return tied[0]!;
  const idx = Math.min(tied.length - 1, Math.floor(rand() * tied.length));
  return tied[idx]!;
}

export interface EvaluateFoundCityAffordanceOpts {
  /** Losowanie remisu wielkości miast-źródeł (domyślnie Math.random). */
  rand?: () => number;
}

/** Pełna ocena kosztu założenia miasta (SILNIK wywołuje przed foundCityAt). */
export function evaluateFoundCityAffordance(
  treasuryPraca: number,
  cities: ReadonlyArray<FoundCitySourceCity>,
  ownerId: number,
  opts?: EvaluateFoundCityAffordanceOpts,
): FoundCityAffordance {
  const rand = opts?.rand ?? Math.random;
  const firstFree = !isSubsequentFoundCity(cities, ownerId);
  const kosztPraca = firstFree ? 0 : foundCityWorkCost();
  const kosztLudnosc = firstFree ? 0 : foundCityPopulationCost();

  if (treasuryPraca < kosztPraca) {
    return {
      ok: false,
      reason: 'Za mało Pracy (potrzeba ' + kosztPraca + ')',
      kosztPraca,
      kosztLudnosc,
    };
  }

  if (firstFree) {
    return { ok: true, kosztPraca, kosztLudnosc };
  }

  const source = pickSourceCityForFounding(cities, ownerId, rand);
  if (!source) {
    const minNeeded = ownerId > 0
      ? Math.max(kosztLudnosc + 1, AI_FOUNDING_SOURCE_MIN_POP)
      : kosztLudnosc + 1;
    return {
      ok: false,
      reason: 'Potrzebne miasto z co najmniej ' + minNeeded + ' ludności',
      kosztPraca,
      kosztLudnosc,
    };
  }

  return {
    ok: true,
    kosztPraca,
    kosztLudnosc,
    sourceCityId: source.id,
  };
}

/** @deprecated Użyj evaluateFoundCityAffordance — zostaje dla testów prostych. */
export function canAffordFoundCity(
  treasuryPraca: number,
  sourceCityPopulation: number,
  opts?: { firstCityFree?: boolean },
): FoundCityAffordance {
  const kosztPraca = opts?.firstCityFree ? 0 : foundCityWorkCost();
  const kosztLudnosc = opts?.firstCityFree ? 0 : foundCityPopulationCost();

  if (treasuryPraca < kosztPraca) {
    return {
      ok: false,
      reason: 'Za mało Pracy (potrzeba ' + kosztPraca + ')',
      kosztPraca,
      kosztLudnosc,
    };
  }
  if (!opts?.firstCityFree && sourceCityPopulation - kosztLudnosc < 1) {
    return {
      ok: false,
      reason: 'Za mało ludności (potrzeba ' + kosztLudnosc + ')',
      kosztPraca,
      kosztLudnosc,
    };
  }
  return { ok: true, kosztPraca, kosztLudnosc };
}

/** Etykieta kosztu do panelu Budowa. */
export function foundCityCostLabel(firstCityFree = false): string {
  if (firstCityFree) return 'FREE (pierwsze miasto)';
  const p = foundCityWorkCost();
  const pop = foundCityPopulationCost();
  return p + ' P · ' + pop + ' 👤';
}
