/**
 * empire-food.ts — centralny magazyn żywności (PYTANIE-85).
 *
 * Kolejność tury: suma bilansów lokalnych → nadwyżki do centrali → dopłaty miastom
 * → koszt wojska → zmiana stanu magazynu. Wzrost ludności w population-growth-v85.ts.
 */
import type { EconomyTickResult, EconUnit } from './turn-economy';
import type { UpkeepParams, UnitFoodTable } from './economy-upkeep';
import { militaryFoodConsumptionWithSpichlerz } from './turn-economy';
import { SPICHLERZ_EMPIRE_CAP_I, SPICHLERZ_EMPIRE_CAP_II_FULL, resolveSpichlerzCityBonusState } from './building-resource-gate';
import type { SpichlerzCityBonusState } from './building-resource-gate';
import {
  buildRationParams,
  type GrowthPercentBreakdown,
  type RationParams,
} from './population-growth-v85';

export interface EmpireFoodState {
  /** Centralny magazyn żywności imperium (PYTANIE-85). */
  zapasyPanstwa: number;
  /** @deprecated migracja — nie używane w logice V85. */
  procentRozwoj?: number;
  turyUjemnychZapasow: number;
}

export interface EmpireFoodParams {
  /** Baza capu magazynu centralnego 🍞. */
  centralCapBaza: number;
  /** Dodatek capu za każdy budynek Magazyn w imperium. */
  centralCapBonusMagazyn: number;
  glodWojskaHpFrac: number;
  glodWojskaKarencjaTur: number;
  /** Mnożnik statów bojowych (bez armor) gdy glodWojska — domyślnie 0.75. */
  glodWojskaStatMult: number;
  rationParams: RationParams;
}

export interface EmpireFoodCityRow {
  cityId: string;
  name: string;
  produkcja: number;
  kosztRacji: number;
  bilans: number;
  wzrostProcent: number;
  nakarmione: boolean;
  breakdown?: GrowthPercentBreakdown;
}

export interface EmpireFoodTick {
  ownerId: number;
  /** Uprawa i hodowla — suma produkcji brutto miast. */
  uprawaHodowla: number;
  /** Wyżywienie ludności — suma kosztów racji. */
  wyzwienieLudnosci: number;
  /** Nadwyżka — produkcja − wyżywienie (przed dopłatami). */
  nadwyzka: number;
  /** Pomoc miastom — dopłaty z magazynu do miast na minusie. */
  pomocMiastom: number;
  /** Spichlerz stolicy — pula po pomocy miastom, przed wojskiem. */
  spichlerzStolicy: number;
  /** Wojsko — koszt żywności armii. */
  wojsko: number;
  /** Przyrost zapasów — zmiana stanu magazynu w tej turze. */
  przyrostZapasow: number;
  zapasyPrzed: number;
  zapasyPo: number;
  maxCap: number;
  kosztArmii: number;
  glodWojska: boolean;
  turyUjemnychZapasowPo: number;
  glodWojskaAtrycjaAktywna: boolean;
  /** @deprecated alias do uprawaHodowla */
  zywnoscBrutto: number;
  /** @deprecated */
  doRozwoju: number;
  /** @deprecated */
  doPanstwa: number;
  perCityRows: EmpireFoodCityRow[];
  fedByCityId: Map<string, boolean>;
}

export interface EmpireFoodTickResult {
  perOwner: EmpireFoodTick[];
  byOwner: Map<number, EmpireFoodTick>;
}

type Difficulty = 'easy' | 'normal' | 'hard';
interface RawParamRow { easy?: number; normal?: number; hard?: number; }

function pick(row: RawParamRow | undefined, d: Difficulty, fallback: number): number {
  if (!row) return fallback;
  const v = row[d];
  return Number.isFinite(v) ? (v as number) : fallback;
}

export function buildEmpireFoodParams(
  raw: {
    ekonomia_miasta?: Record<string, RawParamRow>;
    globalne?: Record<string, RawParamRow>;
    glod_wojska_hp_frac?: RawParamRow;
    glod_wojska_karencja_tur?: RawParamRow;
    glod_wojska_stat_mult?: RawParamRow;
    magazyn_centralny_baza_zywnosc?: RawParamRow;
    magazyn_centralny_bonus_zywnosc_na_budynek?: RawParamRow;
  },
  difficulty: Difficulty = 'normal',
): EmpireFoodParams {
  const em = raw.ekonomia_miasta ?? raw;
  const gl = raw.globalne ?? raw;
  return {
    centralCapBaza: pick(
      gl.magazyn_centralny_baza_zywnosc ?? em.magazyn_centralny_baza_zywnosc,
      difficulty, 500,
    ),
    centralCapBonusMagazyn: pick(
      gl.magazyn_centralny_bonus_zywnosc_na_budynek ?? em.magazyn_centralny_bonus_zywnosc_na_budynek,
      difficulty, 100,
    ),
    glodWojskaHpFrac: pick(em.glod_wojska_hp_frac, difficulty, 0.08),
    glodWojskaKarencjaTur: pick(em.glod_wojska_karencja_tur, difficulty, 3),
    glodWojskaStatMult: pick(em.glod_wojska_stat_mult, difficulty, 0.75),
    rationParams: buildRationParams(raw, difficulty),
  };
}

export function freshEmpireFoodState(_procentRozwojDefault = 100): EmpireFoodState {
  return { zapasyPanstwa: 0, turyUjemnychZapasow: 0 };
}

function countMagazynByOwner(
  perCity: EconomyTickResult['perCity'],
  builtByCity?: ReadonlyMap<string, readonly string[]>,
): Map<number, number> {
  const out = new Map<number, number>();
  if (!builtByCity) return out;
  const seen = new Set<string>();
  for (const tick of perCity) {
    if (seen.has(tick.cityId)) continue;
    seen.add(tick.cityId);
    if ((builtByCity.get(tick.cityId) ?? []).includes('magazyn')) {
      out.set(tick.ownerId, (out.get(tick.ownerId) ?? 0) + 1);
    }
  }
  return out;
}

function computeCentralFoodCap(
  ownerId: number,
  perCity: EconomyTickResult['perCity'],
  magazynCount: number,
  params: EmpireFoodParams,
): number {
  let spichlerzCap = 0;
  for (const tick of perCity) {
    if (tick.ownerId !== ownerId || tick.oblegany) continue;
    if (tick.maSpichlerzII) spichlerzCap += SPICHLERZ_EMPIRE_CAP_II_FULL;
    else if (tick.maSpichlerz) spichlerzCap += SPICHLERZ_EMPIRE_CAP_I;
  }
  return params.centralCapBaza
    + params.centralCapBonusMagazyn * magazynCount
    + spichlerzCap;
}

export function advanceEmpireFood(
  econ: EconomyTickResult,
  units: ReadonlyArray<EconUnit>,
  states: Map<number, EmpireFoodState>,
  upkeep: UpkeepParams,
  params: EmpireFoodParams,
  foodTable: UnitFoodTable = {},
  builtByCity?: ReadonlyMap<string, readonly string[]>,
): EmpireFoodTickResult {
  const magazynCountByOwner = countMagazynByOwner(econ.perCity, builtByCity);
  const perOwner: EmpireFoodTick[] = [];
  const byOwner = new Map<number, EmpireFoodTick>();

  const ownerIds = new Set<number>([
    ...econ.perCity.map(t => t.ownerId),
    ...states.keys(),
    ...units.map(u => u.ownerId),
  ]);

  for (const ownerId of ownerIds) {
    const st = states.get(ownerId) ?? freshEmpireFoodState();
    if (!states.has(ownerId)) states.set(ownerId, st);

    const zapasyPrzed = st.zapasyPanstwa;
    let central = zapasyPrzed;
    let uprawaHodowla = 0;
    let wyzwienieLudnosci = 0;
    let pomocMiastom = 0;
    const deficits: Array<{ cityId: string; need: number; name: string }> = [];
    const perCityRows: EmpireFoodCityRow[] = [];
    const fedByCityId = new Map<string, boolean>();

    for (const tick of econ.perCity) {
      if (tick.ownerId !== ownerId || tick.oblegany) continue;
      const produkcja = tick.zywnoscBrutto ?? Math.max(0, tick.zywnoscNetto + (tick.kosztRacji ?? 0));
      const kosztRacji = tick.kosztRacji ?? 0;
      const bilans = tick.bilansLokalny ?? (produkcja - kosztRacji);
      uprawaHodowla += produkcja;
      wyzwienieLudnosci += kosztRacji;

      perCityRows.push({
        cityId: tick.cityId,
        name: tick.cityId,
        produkcja,
        kosztRacji,
        bilans,
        wzrostProcent: tick.wzrostProcent ?? 0,
        nakarmione: false,
      });

      if (bilans >= 0) {
        central += bilans;
        fedByCityId.set(tick.cityId, true);
      } else {
        deficits.push({ cityId: tick.cityId, need: -bilans, name: tick.cityId });
      }
    }

    for (const d of deficits) {
      const covered = Math.min(d.need, Math.max(0, central));
      central -= covered;
      pomocMiastom += covered;
      const fed = covered >= d.need;
      fedByCityId.set(d.cityId, fed);
      const row = perCityRows.find(r => r.cityId === d.cityId);
      if (row) row.nakarmione = fed;
    }

    const nadwyzka = uprawaHodowla - wyzwienieLudnosci;
    const spichlerzStolicy = central;
    const kosztArmii = militaryFoodConsumptionWithSpichlerz(units, ownerId, upkeep, foodTable);
    central -= kosztArmii;
    const przyrostZapasow = central - zapasyPrzed;

    const maxCap = computeCentralFoodCap(
      ownerId, econ.perCity, magazynCountByOwner.get(ownerId) ?? 0, params,
    );
    if (central > maxCap) central = maxCap;
    if (central < 0) central = central; // ujemne zapasy dozwolone (głód wojska)

    st.zapasyPanstwa = central;
    _maxCapByOwner.set(ownerId, maxCap);

    const turyUjemnychZapasowPrzed = st.turyUjemnychZapasow ?? 0;
    const turyUjemnychZapasowPo = central < 0 ? turyUjemnychZapasowPrzed + 1 : 0;
    st.turyUjemnychZapasow = turyUjemnychZapasowPo;

    const tick: EmpireFoodTick = {
      ownerId,
      uprawaHodowla,
      wyzwienieLudnosci,
      nadwyzka,
      pomocMiastom,
      spichlerzStolicy,
      wojsko: kosztArmii,
      przyrostZapasow,
      zapasyPrzed,
      zapasyPo: central,
      maxCap,
      kosztArmii,
      glodWojska: central < 0,
      turyUjemnychZapasowPo,
      glodWojskaAtrycjaAktywna: turyUjemnychZapasowPo >= params.glodWojskaKarencjaTur,
      zywnoscBrutto: uprawaHodowla,
      doRozwoju: 0,
      doPanstwa: nadwyzka,
      perCityRows,
      fedByCityId,
    };
    perOwner.push(tick);
    byOwner.set(ownerId, tick);
  }

  _setLastEmpireFoodTicks(byOwner);
  return { perOwner, byOwner };
}

// --- Runtime accessors (HUD) ---

let _lastTicks = new Map<number, EmpireFoodTick>();
let _statesRef = new Map<number, EmpireFoodState>();
let _maxCapByOwner = new Map<number, number>();

export function bindEmpireFoodRuntime(states: Map<number, EmpireFoodState>): void {
  _statesRef = states;
}

export function getEmpireFoodReserve(ownerId: number): number {
  return _statesRef.get(ownerId)?.zapasyPanstwa ?? 0;
}

export function getEmpireFoodMaxCap(ownerId: number): number {
  return _maxCapByOwner.get(ownerId) ?? 0;
}

/** @deprecated PYTANIE-85 — suwak usunięty. */
export function getEmpireFoodSplit(_ownerId: number): number {
  return 100;
}

/**
 * Głód wojska — osłabienie statów bojowych (bez armor) gdy zapasy < 0 po koszcie armii.
 * Wcześniejsze niż isArmyStarving (atrycja HP po karencji).
 */
export function isArmyHungry(ownerId: number): boolean {
  return _lastTicks.get(ownerId)?.glodWojska ?? false;
}

/** Atrycja HP wojska — aktywna PO karencji glodWojskaKarencjaTur tur ujemnych zapasów. */
export function isArmyStarving(ownerId: number): boolean {
  return _lastTicks.get(ownerId)?.glodWojskaAtrycjaAktywna ?? false;
}

export function getArmyStarvationCountdown(ownerId: number, karencjaTur: number): number | null {
  const t = _lastTicks.get(ownerId);
  if (!t || t.zapasyPo >= 0 || t.glodWojskaAtrycjaAktywna) return null;
  return Math.max(1, karencjaTur - t.turyUjemnychZapasowPo);
}

export function getLastEmpireFoodTick(ownerId: number): EmpireFoodTick | undefined {
  return _lastTicks.get(ownerId);
}

export function _setLastEmpireFoodTicks(ticks: Map<number, EmpireFoodTick>): void {
  _lastTicks = ticks;
}

export function clearLastEmpireFoodTicks(): void {
  _lastTicks = new Map();
  _maxCapByOwner = new Map();
}

/** @deprecated PYTANIE-85 */
export function computeEmpireFoodNetDelta(
  brutto: number,
  kosztArmii: number,
  _pctRozwoj: number,
  _spichlerzCount: number,
  _params: EmpireFoodParams,
): number {
  return brutto - kosztArmii;
}

/** @deprecated PYTANIE-85 */
export function computeEmpireFoodNetDeltaFromCityFoods(
  cityFoods: ReadonlyArray<{ zywnoscNetto: number; procentRozwoj?: number }>,
  kosztArmii: number,
  _spichlerzCount: number,
  _params: EmpireFoodParams,
): number {
  let sum = 0;
  for (const c of cityFoods) sum += c.zywnoscNetto;
  return sum - kosztArmii;
}

/** @deprecated PYTANIE-85 */
export function computeEmpireFoodMaxCap(
  _spichlerzCount: number,
  params: EmpireFoodParams,
): number {
  return params.centralCapBaza;
}

/** @deprecated */
export function clampFoodSplitPct(n: number): number {
  return Math.min(100, Math.max(0, n));
}

/** @deprecated */
export function getCityFoodSplit(
  city: { procentRozwoj?: number; poziomRacji?: number },
  _defaultPct = 100,
): number {
  return city.poziomRacji !== undefined ? city.poziomRacji * 33 : 100;
}

export {
  applyPostCentralPopulationGrowth,
  applyPostCentralPopulationGrowth as applyCentralFoodPopulationGrowth,
  type PostCentralGrowthOpts as ApplyCentralFoodGrowthOpts,
} from './population-growth-v85';
