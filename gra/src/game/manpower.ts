/**
 * manpower.ts — ludność absolutna i pula Manpower per miasto (EKONOMIA).
 *
 * Model (Maciej 2026):
 *   - city.population = liczba „ludków” (1–10), bez zmian semantyki wzrostu.
 *   - epoka imperium (1–10) → mnożniki z epoka-ludnosc-manpower.json.
 *   - ludnoscAbs = ludki × ludekNaLudka[epoka]
 *   - manpowerMax = ludki × manpowerNaLudka[epoka]  (= 10% ludnoscAbs)
 *   - koszt 1 jednostki = manpowerNaJednostke[epoka] (= 10% jednego slotu manpower)
 *
 * Faza 2: odejmowanie przy rekrutacji (tryDeductUnitSpawnCosts).
 * Faza 2b: odnowa co turę (tickManpowerRegen) — parametry w miasto-params.json.
 * Faza 3: uzupełnianie wojska z puli — osobny batch.
 */

import type { City } from './cities';
import epokaTable from '../../data/epoka-ludnosc-manpower.json';
import miastoParams from '../../data/miasto-params.json';

export interface EpokaManpowerRow {
  epoka: number;
  ludekNaLudka: number;
  manpowerNaLudka: number;
  manpowerNaJednostke: number;
}

export interface CityManpowerSnapshot {
  epoka: number;
  ludki: number;
  ludnoscAbsolutna: number;
  manpowerMax: number;
  manpowerBiezacy: number;
  kosztJednostki: number;
  /** Szacowana odnowa co turę (przy aktualnym max). */
  regenPerTurn: number;
  /** Ile jednostek można werbować przy pełnej puli (floor). */
  werbMaxPrzyPelnejPuli: number;
}

const ROWS: readonly EpokaManpowerRow[] = (epokaTable as { epoki: EpokaManpowerRow[] }).epoki;

const MAX_EPOKA = 10;

type ParamRow = { wartosc?: number };

export interface ManpowerRegenParams {
  /** Procent manpowerMax dodawany co turę (0–100). Domyślnie 10. */
  regenProcMaxPerTurn: number;
  /** Gdy true — brak regen podczas oblężenia. */
  blockWhenBesieged: boolean;
}

const DEFAULT_REGEN: ManpowerRegenParams = {
  regenProcMaxPerTurn: 10,
  blockWhenBesieged: true,
};

/** Parametry odnowy Manpower z miasto-params.json (Panel-B). */
export function loadManpowerRegenParams(
  raw: typeof miastoParams = miastoParams,
): ManpowerRegenParams {
  const pct = (raw as Record<string, ParamRow>).manpower_regen_proc_max_tura?.wartosc;
  const block = (raw as Record<string, ParamRow>).manpower_regen_blok_oblezenie?.wartosc;
  return {
    regenProcMaxPerTurn: typeof pct === 'number' && pct >= 0 ? pct : DEFAULT_REGEN.regenProcMaxPerTurn,
    blockWhenBesieged: block === undefined ? true : block !== 0,
  };
}

/** Bonus cywilizacji wpływający na odnowę poboru (civs.json). */
export interface CivBonusPoborLite {
  typ?: string;
  /** jednostka_specjalna: string[] (tokeny-fix); inne typy bonusow: number. */
  wartosc?: number | string | string[];
  realizuje?: string;
}

/**
 * Mnożnik odnowy rekrutów per cywilizacja (domyślnie 1.0).
 * bonus_pobor_regen +0.35 → ×1.35 (Rzymianie); −0.15 → ×0.85 (Grecy).
 */
export function civManpowerRegenMult(
  bonusy?: readonly CivBonusPoborLite[],
): number {
  let mult = 1;
  if (!bonusy?.length) return mult;
  for (const b of bonusy) {
    if (b.typ === 'bonus_pobor_regen' && typeof b.wartosc === 'number') {
      mult *= 1 + b.wartosc;
    } else if (b.typ === 'mnoznik_pobor_regen' && typeof b.wartosc === 'number') {
      mult *= b.wartosc;
    }
  }
  return Math.max(0.1, mult);
}

/** Ile MP miasto odzyska w tej turze (przed limitem cap). */
export function manpowerRegenGain(
  ludki: number,
  epoka: number,
  params: ManpowerRegenParams = DEFAULT_REGEN,
  regenMult = 1,
): number {
  const max = cityManpowerMax(ludki, epoka);
  if (max <= 0 || params.regenProcMaxPerTurn <= 0) return 0;
  const pct = Math.min(100, params.regenProcMaxPerTurn) / 100;
  return Math.floor(max * pct * Math.max(0, regenMult));
}

/**
 * Koniec tury: uzupełnij Manpower w kierunku max.
 * Model domyślny: +regenProcMaxPerTurn% max/turę (np. 10% → pełna pula w ~10 turach od zera).
 */
export function tickManpowerRegen(
  city: Pick<City, 'population' | 'manpower' | 'oblegane'>,
  epoka: number,
  params: ManpowerRegenParams = DEFAULT_REGEN,
  regenMult = 1,
): number {
  const max = cityManpowerMax(city.population, epoka);
  const cur = cityManpowerCurrent(city, epoka);
  if (cur >= max) return max;
  if (params.blockWhenBesieged && city.oblegane) return cur;
  const gain = manpowerRegenGain(city.population, epoka, params, regenMult);
  if (gain <= 0) return cur;
  return Math.min(max, cur + gain);
}

/** Epoka imperium → wiersz tabeli (clamp 1..10). */
export function epokaManpowerRow(epoka: number): EpokaManpowerRow {
  const e = Math.max(1, Math.min(MAX_EPOKA, Math.floor(epoka) || 1));
  return ROWS.find(r => r.epoka === e) ?? ROWS[0]!;
}

export function clampLudki(population: number): number {
  return Math.max(1, Math.floor(population) || 1);
}

/** Ludność absolutna miasta (ludzie). */
export function cityLudnoscAbsolutna(ludki: number, epoka: number): number {
  const row = epokaManpowerRow(epoka);
  return clampLudki(ludki) * row.ludekNaLudka;
}

/** Etykieta UI: slot populacji miasta → obywatel(e). */
export function formatObywateleLabel(count: number): string {
  const n = Math.max(0, Math.floor(count));
  if (n === 1) return '1 obywatel';
  return `${n} obywateli`;
}

/** Maksymalna pula Manpower przy danej liczbie ludków i epoce. */
export function cityManpowerMax(ludki: number, epoka: number): number {
  const row = epokaManpowerRow(epoka);
  return clampLudki(ludki) * row.manpowerNaLudka;
}

/** Koszt Manpower jednej jednostki wojskowej (= 10% slotu manpower w epoce). */
export function unitManpowerCost(epoka: number): number {
  return epokaManpowerRow(epoka).manpowerNaJednostke;
}

/** Bieżąca pula: zapisana w city.manpower lub domyślnie max. */
export function cityManpowerCurrent(city: Pick<City, 'population' | 'manpower'>, epoka: number): number {
  const max = cityManpowerMax(city.population, epoka);
  if (city.manpower === undefined || !Number.isFinite(city.manpower)) return max;
  return Math.max(0, Math.min(max, Math.floor(city.manpower)));
}

/** Sumy imperium do wpływu (Pobór = ludność abs. + rekruci). */
export interface EmpirePoborTotals {
  sumaLudkow: number;
  ludnoscAbsolutna: number;
  rekruci: number;
  poborRaw: number;
}

export function empireSumaLudkow(
  cities: ReadonlyArray<Pick<City, 'ownerId' | 'population'>>,
  ownerId: number,
): number {
  let suma = 0;
  for (const c of cities) {
    if (c.ownerId !== ownerId) continue;
    suma += clampLudki(c.population);
  }
  return suma;
}

/** Ekwiwalent jednostek z bieżącej puli rekrutów (kanon P-A Power). */
export function rekrutUnitEquivalents(rekruci: number, epoka: number): number {
  const cost = unitManpowerCost(epoka);
  if (cost <= 0) return 0;
  return Math.floor(Math.max(0, rekruci) / cost);
}

export function empirePoborTotals(
  cities: ReadonlyArray<Pick<City, 'ownerId' | 'population' | 'manpower'>>,
  ownerId: number,
  epoka: number,
): EmpirePoborTotals {
  let sumaLudkow = 0;
  let ludnoscAbsolutna = 0;
  let rekruci = 0;
  for (const c of cities) {
    if (c.ownerId !== ownerId) continue;
    sumaLudkow += clampLudki(c.population);
    ludnoscAbsolutna += cityLudnoscAbsolutna(c.population, epoka);
    rekruci += cityManpowerCurrent(c, epoka);
  }
  return { sumaLudkow, ludnoscAbsolutna, rekruci, poborRaw: ludnoscAbsolutna + rekruci };
}

export function cityManpowerSnapshot(
  city: Pick<City, 'population' | 'manpower'>,
  epoka: number,
  regenMult = 1,
): CityManpowerSnapshot {
  const ludki = clampLudki(city.population);
  const row = epokaManpowerRow(epoka);
  const ludnoscAbsolutna = ludki * row.ludekNaLudka;
  const manpowerMax = ludki * row.manpowerNaLudka;
  const kosztJednostki = row.manpowerNaJednostke;
  const manpowerBiezacy = cityManpowerCurrent(city, epoka);
  const regenParams = loadManpowerRegenParams();
  return {
    epoka: row.epoka,
    ludki,
    ludnoscAbsolutna,
    manpowerMax,
    manpowerBiezacy,
    kosztJednostki,
    regenPerTurn: manpowerRegenGain(ludki, epoka, regenParams, regenMult),
    werbMaxPrzyPelnejPuli: kosztJednostki > 0
      ? Math.floor(manpowerBiezacy / kosztJednostki)
      : 0,
  };
}

export function canAffordUnitManpower(
  city: Pick<City, 'population' | 'manpower'>,
  epoka: number,
): boolean {
  const snap = cityManpowerSnapshot(city, epoka);
  return snap.manpowerBiezacy >= snap.kosztJednostki;
}

export type UnitSpawnBlockReason = 'brak_manpower';

export interface UnitSpawnDeduction {
  ok: boolean;
  population: number;
  manpower: number;
  kosztManpower: number;
  reason?: UnitSpawnBlockReason;
}

/**
 * Przy werbie jednostki: −1 ludek (popCost) oraz −kosztJednostki[epoka] z puli Manpower.
 * Zwraca ok:false gdy manpower niewystarczający — jednostka NIE powinna powstać.
 */
export function tryDeductUnitSpawnCosts(
  city: Pick<City, 'population' | 'manpower'>,
  epoka: number,
  popCost = 1,
): UnitSpawnDeduction {
  const kosztManpower = unitManpowerCost(epoka);
  const cur = cityManpowerCurrent(city, epoka);
  if (cur < kosztManpower) {
    return {
      ok: false,
      population: city.population,
      manpower: cur,
      kosztManpower,
      reason: 'brak_manpower',
    };
  }
  return {
    ok: true,
    population: Math.max(1, city.population - popCost),
    manpower: cur - kosztManpower,
    kosztManpower,
  };
}

/**
 * Odwrotność werbu — zwrot kosztu przy rozwiązaniu jednostki (disband).
 * Ludność wraca do miasta docelowego; Manpower — do puli (clamp do max).
 */
export function refundUnitSpawnToCity(
  city: Pick<City, 'population' | 'manpower'>,
  epoka: number,
  popCost = 1,
): { population: number; manpower: number } {
  const mpRefund = unitManpowerCost(epoka);
  const population = city.population + popCost;
  const max = cityManpowerMax(population, epoka);
  const manpower = Math.min(max, cityManpowerCurrent(city, epoka) + mpRefund);
  return { population, manpower };
}

/**
 * Po wzroście ludności: dokład do puli różnicę max; przy spadku — clamp do nowego max.
 */
export function refreshManpowerAfterPopChange(
  city: Pick<City, 'population' | 'manpower'>,
  epoka: number,
  previousPop?: number,
): number {
  const max = cityManpowerMax(city.population, epoka);
  const cur = cityManpowerCurrent(city, epoka);
  if (previousPop !== undefined && previousPop !== city.population) {
    const oldMax = cityManpowerMax(previousPop, epoka);
    if (city.population > previousPop) {
      return Math.min(max, cur + (max - oldMax));
    }
    return Math.min(cur, max);
  }
  return max;
}

/** Po rekrutacji / uzupełnieniu — zwraca nową wartość puli (nie mutuje city). */
export function spendManpower(
  city: Pick<City, 'population' | 'manpower'>,
  epoka: number,
  amount?: number,
): number {
  const cost = amount ?? unitManpowerCost(epoka);
  const cur = cityManpowerCurrent(city, epoka);
  return Math.max(0, cur - cost);
}

/** Skrócony zapis do UI (PL). */
export function formatPopulationAbs(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return (m >= 10 ? Math.round(m) : Math.round(m * 10) / 10) + ' mln';
  }
  if (n >= 1_000) {
    const t = n / 1_000;
    return (t >= 100 ? Math.round(t) : Math.round(t * 10) / 10) + ' tys.';
  }
  return String(n);
}

export function formatManpower(n: number): string {
  return formatPopulationAbs(n);
}

/** Eksport tabeli (testy / narzędzia). */
export function allEpokaManpowerRows(): readonly EpokaManpowerRow[] {
  return ROWS;
}
