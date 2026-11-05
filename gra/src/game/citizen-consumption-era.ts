/**
 * citizen-consumption-era.ts — R-WEB-CITIZEN-CONSUMPTION-ERA-MULT-Q1
 * (decyzja właściciela 2026-11-05, `dyspozycje/REJESTR-PROSB-I-ZADAN.md`: „wszystkie surowce
 * mnożymy o współczynnik w każdej epoce, łącznie z żywnością”).
 *
 * JEDNO źródło prawdy mnożnika epoki dla zużycia przez obywateli — używane przez OBIE ścieżki
 * (żywność: `population-growth-v85.ts` `computeCityRationCost`; surowce:
 * `citizen-resource-upkeep.ts` `citizenUpkeepRateForEra`) oraz przez UI/AI/prognozy. Zużycie
 * rośnie o 50% BAZY co epokę: m(e) = 1 + 0,5 × (e − 1) → epoka 1 ×1, 2 ×1,5, 3 ×2, 4 ×2,5, 5 ×3.
 *
 * Wzór (nie tabela) — działa dla każdej epoki ≥ 1; epoka < 1 / NaN / nie-liczba → 1.
 * „Epoka” = epoka CYWILIZACJI WŁAŚCICIELA miasta (PARYTET AI: ta sama funkcja dla gracza, AI i
 * państw-miast, bez gałęzi po ownerId). Brak nowego stanu — mnożnik wyliczany z epoki.
 * / EN: single source of truth for the per-era citizen consumption multiplier
 * m(e) = 1 + 0.5 × (e − 1); invalid / < 1 eras → 1.
 */

/** Przyrost mnożnika na epokę (50% bazy). */
export const CITIZEN_CONSUMPTION_ERA_STEP = 0.5;

/** m(e) = 1 + 0,5 × (e − 1); era < 1 / NaN / nie-liczba → 1. Epoki ułamkowe są zaokrąglane w dół. */
export function citizenConsumptionEraMultiplier(era: number | null | undefined): number {
  if (typeof era !== 'number' || !Number.isFinite(era) || era < 1) return 1;
  return 1 + CITIZEN_CONSUMPTION_ERA_STEP * (Math.floor(era) - 1);
}

/**
 * Etykieta mnożnika do UI, np. „×1,5” (przecinek dziesiętny, bez zbędnych zer: „×2”).
 * Jedyne miejsce formatowania — tooltipy nie zaszywają stawek.
 */
export function formatCitizenConsumptionMult(era: number | null | undefined): string {
  const m = citizenConsumptionEraMultiplier(era);
  return `×${String(m).replace('.', ',')}`;
}
