/**
 * manpower.ts — ludność absolutna i pula Manpower per miasto (EKONOMIA).
 *
 * Model (Maciej 2026):
 *   - city.population = liczba „ludków” (1–10), bez zmian semantyki wzrostu.
 *   - epoka imperium (1–10) → mnożniki z epoka-ludnosc-manpower.json.
 *   - ludnoscAbs = ludki × ludekNaLudka[epoka]
 *   - manpowerMax = ludki × manpowerNaLudka[epoka]  (= 10% ludnoscAbs)
 *   - koszt 1 jednostki = manpowerNaJednostke[epoka] (= manpowerNaLudka; 1 ludek = 1 jednostka przy pełnej puli)
 *
 * Faza 2: odejmowanie przy rekrutacji z puli imperium (tryDeductUnitSpawnCostsEmpire).
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
  /** Procent manpowerMax dodawany co turę (0–100). Domyślnie 2. */
  regenProcMaxPerTurn: number;
  /** Gdy true — brak regen podczas oblężenia. */
  blockWhenBesieged: boolean;
}

const DEFAULT_REGEN: ManpowerRegenParams = {
  regenProcMaxPerTurn: 2,
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
 * bonus_pobor_regen +1.0 → ×2 (Rzymianie); −0.15 → ×0.85 (Grecy).
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

/**
 * Mnożnik puli Manpower per obywatela (domyślnie 1.0).
 * mnoznik_manpower_max 2.0 → ×2 (Rzymianie); bonus_pobor_pula +1.0 → ×2.
 */
export function civManpowerMaxMult(
  bonusy?: readonly CivBonusPoborLite[],
): number {
  let mult = 1;
  if (!bonusy?.length) return mult;
  for (const b of bonusy) {
    if (b.typ === 'bonus_pobor_pula' && typeof b.wartosc === 'number') {
      mult *= 1 + b.wartosc;
    } else if (b.typ === 'mnoznik_manpower_max' && typeof b.wartosc === 'number') {
      mult *= b.wartosc;
    }
  }
  return Math.max(0.1, mult);
}

/** Mnożniki Manpower z bonusów cywilizacji (regen + max/koszt). */
export function civManpowerMults(
  bonusy?: readonly CivBonusPoborLite[],
): { regenMult: number; maxMult: number } {
  return {
    regenMult: civManpowerRegenMult(bonusy),
    maxMult: civManpowerMaxMult(bonusy),
  };
}

function scaledManpower(base: number, maxMult: number): number {
  return Math.floor(base * Math.max(0.1, maxMult));
}

/** Ile MP miasto odzyska w tej turze (przed limitem cap). */
export function manpowerRegenGain(
  ludki: number,
  epoka: number,
  params: ManpowerRegenParams = DEFAULT_REGEN,
  regenMult = 1,
  maxMult = 1,
): number {
  const max = cityManpowerMax(ludki, epoka, maxMult);
  if (max <= 0 || params.regenProcMaxPerTurn <= 0) return 0;
  const pct = Math.min(100, params.regenProcMaxPerTurn) / 100;
  return Math.floor(max * pct * Math.max(0, regenMult));
}

/**
 * Koniec tury: uzupełnij Manpower w kierunku max.
 * Model domyślny: +regenProcMaxPerTurn% max/turę (np. 2% → pełna pula w ~50 turach od zera).
 */
export function tickManpowerRegen(
  city: Pick<City, 'population' | 'manpower' | 'oblegane'>,
  epoka: number,
  params: ManpowerRegenParams = DEFAULT_REGEN,
  regenMult = 1,
  maxMult = 1,
): number {
  const max = cityManpowerMax(city.population, epoka, maxMult);
  const cur = cityManpowerCurrent(city, epoka, maxMult);
  if (cur >= max) return max;
  if (params.blockWhenBesieged && city.oblegane) return cur;
  const gain = manpowerRegenGain(city.population, epoka, params, regenMult, maxMult);
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
export function cityManpowerMax(ludki: number, epoka: number, maxMult = 1): number {
  const row = epokaManpowerRow(epoka);
  return scaledManpower(clampLudki(ludki) * row.manpowerNaLudka, maxMult);
}

/** typeId z units.json (pole Jednostka) — zwiadowca nie zużywa puli Manpower. */
export const SCOUT_TYPE_ID = 'Zwiadowca';

export function isScoutTypeId(typeId: string | undefined): boolean {
  return typeId === SCOUT_TYPE_ID;
}

/** Koszt Manpower jednej jednostki wojskowej (= pełny slot manpower w epoce × bonus cyw.). */
export function unitManpowerCost(epoka: number, maxMult = 1): number {
  return scaledManpower(epokaManpowerRow(epoka).manpowerNaJednostke, maxMult);
}

/** Koszt Manpower per typ jednostki (Zwiadowca = 0; reszta jak unitManpowerCost). */
export function unitManpowerCostForType(
  typeId: string | undefined,
  epoka: number,
  maxMult = 1,
): number {
  if (isScoutTypeId(typeId)) return 0;
  return unitManpowerCost(epoka, maxMult);
}

/** Bieżąca pula: zapisana w city.manpower lub domyślnie max. */
export function cityManpowerCurrent(
  city: Pick<City, 'population' | 'manpower'>,
  epoka: number,
  maxMult = 1,
): number {
  const max = cityManpowerMax(city.population, epoka, maxMult);
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
export function rekrutUnitEquivalents(rekruci: number, epoka: number, maxMult = 1): number {
  const cost = unitManpowerCost(epoka, maxMult);
  if (cost <= 0) return 0;
  return Math.floor(Math.max(0, rekruci) / cost);
}

export function empirePoborTotals(
  cities: ReadonlyArray<Pick<City, 'ownerId' | 'population' | 'manpower'>>,
  ownerId: number,
  epoka: number,
  maxMult = 1,
): EmpirePoborTotals {
  let sumaLudkow = 0;
  let ludnoscAbsolutna = 0;
  let rekruci = 0;
  for (const c of cities) {
    if (c.ownerId !== ownerId) continue;
    sumaLudkow += clampLudki(c.population);
    ludnoscAbsolutna += cityLudnoscAbsolutna(c.population, epoka);
    rekruci += cityManpowerCurrent(c, epoka, maxMult);
  }
  return { sumaLudkow, ludnoscAbsolutna, rekruci, poborRaw: ludnoscAbsolutna + rekruci };
}

export function cityManpowerSnapshot(
  city: Pick<City, 'population' | 'manpower'>,
  epoka: number,
  regenMult = 1,
  maxMult = 1,
): CityManpowerSnapshot {
  const ludki = clampLudki(city.population);
  const row = epokaManpowerRow(epoka);
  const ludnoscAbsolutna = ludki * row.ludekNaLudka;
  const manpowerMax = scaledManpower(ludki * row.manpowerNaLudka, maxMult);
  const kosztJednostki = scaledManpower(row.manpowerNaJednostke, maxMult);
  const manpowerBiezacy = cityManpowerCurrent(city, epoka, maxMult);
  const regenParams = loadManpowerRegenParams();
  return {
    epoka: row.epoka,
    ludki,
    ludnoscAbsolutna,
    manpowerMax,
    manpowerBiezacy,
    kosztJednostki,
    regenPerTurn: manpowerRegenGain(ludki, epoka, regenParams, regenMult, maxMult),
    werbMaxPrzyPelnejPuli: kosztJednostki > 0
      ? Math.floor(manpowerBiezacy / kosztJednostki)
      : 0,
  };
}

export function canAffordUnitManpower(
  city: Pick<City, 'population' | 'manpower'>,
  epoka: number,
  maxMult = 1,
  typeId?: string,
): boolean {
  const cost = unitManpowerCostForType(typeId, epoka, maxMult);
  if (cost <= 0) return true;
  return cityManpowerCurrent(city, epoka, maxMult) >= cost;
}

/** Suma bieżącej puli rekrutów imperium (wszystkie miasta ownera). */
export function empireManpowerCurrent(
  cities: ReadonlyArray<Pick<City, 'ownerId' | 'population' | 'manpower'>>,
  ownerId: number,
  epoka: number,
  maxMult = 1,
): number {
  return empirePoborTotals(cities, ownerId, epoka, maxMult).rekruci;
}

type CityRecruitFields = Pick<City, 'id' | 'ownerId' | 'population' | 'manpower'>;

/** Ściąga Manpower z puli imperium (suma city.manpower) — bez wiązania z miastem rekrutującym. */
export function deductManpowerFromEmpire(
  cities: CityRecruitFields[],
  ownerId: number,
  epoka: number,
  amount: number,
  maxMult = 1,
): boolean {
  if (amount <= 0) return true;
  if (empireManpowerCurrent(cities, ownerId, epoka, maxMult) < amount) return false;
  let remaining = amount;
  const ownerCities = cities.filter(c => c.ownerId === ownerId);
  const sorted = [...ownerCities].sort((a, b) => {
    const curDiff = cityManpowerCurrent(b, epoka, maxMult) - cityManpowerCurrent(a, epoka, maxMult);
    return curDiff !== 0 ? curDiff : a.id.localeCompare(b.id);
  });
  for (const c of sorted) {
    if (remaining <= 0) break;
    const cur = cityManpowerCurrent(c, epoka, maxMult);
    const take = Math.min(cur, remaining);
    if (take > 0) {
      c.manpower = cur - take;
      remaining -= take;
    }
  }
  return remaining <= 0;
}

/** Zwraca Manpower do puli imperium (rozdziela po miastach z wolnym cap). */
export function refundManpowerToEmpire(
  cities: CityRecruitFields[],
  ownerId: number,
  epoka: number,
  amount: number,
  maxMult = 1,
): void {
  if (amount <= 0) return;
  let remaining = amount;
  const ownerCities = cities.filter(c => c.ownerId === ownerId);
  const sorted = [...ownerCities].sort((a, b) => {
    const roomA = cityManpowerMax(a.population, epoka, maxMult)
      - cityManpowerCurrent(a, epoka, maxMult);
    const roomB = cityManpowerMax(b.population, epoka, maxMult)
      - cityManpowerCurrent(b, epoka, maxMult);
    const roomDiff = roomB - roomA;
    return roomDiff !== 0 ? roomDiff : a.id.localeCompare(b.id);
  });
  for (const c of sorted) {
    if (remaining <= 0) break;
    const max = cityManpowerMax(c.population, epoka, maxMult);
    const cur = cityManpowerCurrent(c, epoka, maxMult);
    const room = max - cur;
    if (room <= 0) continue;
    const add = Math.min(room, remaining);
    c.manpower = cur + add;
    remaining -= add;
  }
}

/**
 * Werb jednostki: koszt tylko z puli Manpower imperium (suma po miastach).
 * Ludność miasta (obywatele) NIE maleje przy rekrutacji — spada wyłącznie przy zakładaniu miasta.
 */
export function canAffordUnitManpowerEmpire(
  cities: ReadonlyArray<CityRecruitFields>,
  ownerId: number,
  _recruitingCity: CityRecruitFields,
  epoka: number,
  _popCost = 0,
  maxMult = 1,
  typeId?: string,
): boolean {
  const kosztManpower = unitManpowerCostForType(typeId, epoka, maxMult);
  if (kosztManpower <= 0) return true;
  return empireManpowerCurrent(cities, ownerId, epoka, maxMult) >= kosztManpower;
}

/** Odejmuje koszt rekrutów z puli imperium. Mutuje `cities`. */
export function tryDeductUnitSpawnCostsEmpire(
  cities: CityRecruitFields[],
  recruitingCityId: string,
  ownerId: number,
  epoka: number,
  _popCost = 0,
  maxMult = 1,
  typeId?: string,
): UnitSpawnDeduction {
  const recruitingCity = cities.find(c => c.id === recruitingCityId && c.ownerId === ownerId);
  const kosztManpower = unitManpowerCostForType(typeId, epoka, maxMult);
  const recruitingMp = recruitingCity
    ? cityManpowerCurrent(recruitingCity, epoka, maxMult)
    : 0;
  const recruitingPop = recruitingCity?.population ?? 0;
  if (!recruitingCity) {
    return {
      ok: false,
      population: 0,
      manpower: 0,
      kosztManpower,
      reason: 'brak_manpower',
    };
  }
  if (kosztManpower > 0 && !deductManpowerFromEmpire(cities, ownerId, epoka, kosztManpower, maxMult)) {
    return {
      ok: false,
      population: recruitingPop,
      manpower: recruitingMp,
      kosztManpower,
      reason: 'brak_manpower',
    };
  }

  return {
    ok: true,
    population: recruitingPop,
    manpower: cityManpowerCurrent(recruitingCity, epoka, maxMult),
    kosztManpower,
  };
}

export type UnitSpawnBlockReason = 'brak_manpower' | 'brak_ludnosci';

export interface UnitSpawnDeduction {
  ok: boolean;
  population: number;
  manpower: number;
  kosztManpower: number;
  reason?: UnitSpawnBlockReason;
}

/**
 * Werb jednostki (pojedyncze miasto — testy / legacy): tylko −koszt Manpower z puli miasta.
 * W grze używaj tryDeductUnitSpawnCostsEmpire (pula imperium).
 */
export function tryDeductUnitSpawnCosts(
  city: Pick<City, 'population' | 'manpower'>,
  epoka: number,
  popCost = 0,
  maxMult = 1,
  typeId?: string,
): UnitSpawnDeduction {
  const kosztManpower = unitManpowerCostForType(typeId, epoka, maxMult);
  const cur = cityManpowerCurrent(city, epoka, maxMult);
  if (cur < kosztManpower) {
    return {
      ok: false,
      population: city.population,
      manpower: cur,
      kosztManpower,
      reason: 'brak_manpower',
    };
  }
  if (popCost > 0 && city.population <= popCost) {
    return {
      ok: false,
      population: city.population,
      manpower: cur,
      kosztManpower,
      reason: 'brak_ludnosci',
    };
  }
  return {
    ok: true,
    population: city.population - popCost,
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
  popCap?: number,
  maxMult = 1,
  typeId?: string,
): { population: number; manpower: number } {
  const mpRefund = unitManpowerCostForType(typeId, epoka, maxMult);
  const rawPop = city.population + popCost;
  const population = popCap != null ? Math.min(popCap, rawPop) : rawPop;
  const max = cityManpowerMax(population, epoka, maxMult);
  const manpower = Math.min(max, cityManpowerCurrent(city, epoka, maxMult) + mpRefund);
  return { population, manpower };
}

/**
 * Po wzroście ludności: dokład do puli różnicę max; przy spadku — clamp do nowego max.
 */
export function refreshManpowerAfterPopChange(
  city: Pick<City, 'population' | 'manpower'>,
  epoka: number,
  previousPop?: number,
  maxMult = 1,
): number {
  const max = cityManpowerMax(city.population, epoka, maxMult);
  const cur = cityManpowerCurrent(city, epoka, maxMult);
  if (previousPop !== undefined && previousPop !== city.population) {
    const oldMax = cityManpowerMax(previousPop, epoka, maxMult);
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
  maxMult = 1,
): number {
  const cost = amount ?? unitManpowerCost(epoka, maxMult);
  const cur = cityManpowerCurrent(city, epoka, maxMult);
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
