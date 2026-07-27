/**
 * population-growth-v85.ts — PYTANIE-85: racje 1/2/3, wzrost %, ułamkowy przyrost.
 */
import type { City } from './cities';
import { cityPopulationCap } from './economy';
import type { EconParams, CivEconomyBonus } from './economy';
import {
  spichlerzGrowthBonusPercent,
  spichlerzRationFoodCostMultiplier,
  type SpichlerzCityBonusState,
} from './building-resource-gate';
import { civMatrixParam } from './civ-matrix';
import type { EmpireFoodTickResult } from './empire-food';
import type { EconomyTickResult } from './turn-economy';
import { rebalanceWorkersAfterPopulationChange } from './okolica';
import type { GameMap } from '../types/map';
import type { TerritoryNode } from '../map/territory';
import { refreshManpowerAfterPopChange, civManpowerMults } from './manpower';

export type PoziomRacji = 1 | 2 | 3;

export const DEFAULT_POZIOM_RACJI: PoziomRacji = 2;

export interface RationParams {
  racjeZywnosc1: number;
  racjeZywnosc2: number;
  racjeZywnosc3: number;
  racjeWzrostProc1: number;
  racjeWzrostProc2: number;
  racjeWzrostProc3: number;
}

type Difficulty = 'easy' | 'normal' | 'hard';
interface RawParamRow { easy?: number; normal?: number; hard?: number; }

function pick(row: RawParamRow | undefined, d: Difficulty, fallback: number): number {
  if (!row) return fallback;
  const v = row[d];
  return Number.isFinite(v) ? (v as number) : fallback;
}

export function buildRationParams(
  raw: {
    ekonomia_miasta?: Record<string, RawParamRow>;
    racje_zywnosc_1?: RawParamRow;
    racje_zywnosc_2?: RawParamRow;
    racje_zywnosc_3?: RawParamRow;
    racje_wzrost_proc_1?: RawParamRow;
    racje_wzrost_proc_2?: RawParamRow;
    racje_wzrost_proc_3?: RawParamRow;
  },
  difficulty: Difficulty = 'normal',
): RationParams {
  const section = raw.ekonomia_miasta ?? raw;
  return {
    racjeZywnosc1:    pick(section.racje_zywnosc_1, difficulty, 1),
    racjeZywnosc2:    pick(section.racje_zywnosc_2, difficulty, 2),
    racjeZywnosc3:    pick(section.racje_zywnosc_3, difficulty, 3),
    racjeWzrostProc1: pick(section.racje_wzrost_proc_1, difficulty, 3),
    racjeWzrostProc2: pick(section.racje_wzrost_proc_2, difficulty, 5),
    racjeWzrostProc3: pick(section.racje_wzrost_proc_3, difficulty, 7),
  };
}

export function clampPoziomRacji(n: number): PoziomRacji {
  if (n >= 3) return 3;
  if (n <= 1) return 1;
  return 2;
}

/** Migracja: procentRozwoj 100→3, 70→2, else 1. */
export function migrateProcentRozwojToPoziomRacji(procentRozwoj: number | undefined): PoziomRacji {
  if (procentRozwoj === undefined) return DEFAULT_POZIOM_RACJI;
  if (procentRozwoj >= 90) return 3;
  if (procentRozwoj >= 50) return 2;
  return 1;
}

export function getCityRationLevel(city: Pick<City, 'poziomRacji' | 'procentRozwoj'>): PoziomRacji {
  if (city.poziomRacji !== undefined) return clampPoziomRacji(city.poziomRacji);
  return migrateProcentRozwojToPoziomRacji(city.procentRozwoj);
}

export function rationFoodCostPerPop(level: PoziomRacji, params: RationParams): number {
  if (level === 3) return params.racjeZywnosc3;
  if (level === 1) return params.racjeZywnosc1;
  return params.racjeZywnosc2;
}

export function rationGrowthPercent(level: PoziomRacji, params: RationParams): number {
  if (level === 3) return params.racjeWzrostProc3;
  if (level === 1) return params.racjeWzrostProc1;
  return params.racjeWzrostProc2;
}

export function computeCityRationCost(
  population: number,
  level: PoziomRacji,
  params: RationParams,
  spichlerzState?: SpichlerzCityBonusState,
): number {
  const base = Math.max(0, population) * rationFoodCostPerPop(level, params);
  const mult = spichlerzState ? spichlerzRationFoodCostMultiplier(spichlerzState) : 1;
  return base * mult;
}

export interface GrowthPercentBreakdown {
  total: number;
  racje: number;
  maleMiasto: number;
  spichlerz: number;
  zdrowie: number;
  szczescie: number;
  cywilizacja: number;
}

export interface GrowthPercentInput {
  population: number;
  poziomRacji: PoziomRacji;
  zdrowie: number;
  szczescieNetto: number;
  wealthPoziom: number;
  spichlerzState: SpichlerzCityBonusState;
  civKey?: string | null;
  rationParams: RationParams;
}

/** WZROST% — suma składników (PYTANIE-85, brak capa Q8). */
export function computeGrowthPercentV85(input: GrowthPercentInput): GrowthPercentBreakdown {
  const racje = rationGrowthPercent(input.poziomRacji, input.rationParams);
  const maleMiasto = Math.max(0, 6 - input.population);
  const spichlerz = spichlerzGrowthBonusPercent(input.spichlerzState);
  const zdrowie = Math.floor(Math.max(0, input.zdrowie) / 10);
  const happinessPool = input.szczescieNetto + Math.floor(Math.max(0, input.wealthPoziom) / 10);
  const szczescie = Math.floor(happinessPool / 10);
  const civRaw = input.civKey ? civMatrixParam(input.civKey, 'lud_wzrost_proc') : 0;
  const cywilizacja = Math.round(civRaw * 100);
  const total = racje + maleMiasto + spichlerz + zdrowie + szczescie + cywilizacja;
  return { total, racje, maleMiasto, spichlerz, zdrowie, szczescie, cywilizacja };
}

export interface FractionalGrowthResult {
  nowaLudnosc: number;
  wzrostUlamkowy: number;
  wzrost: boolean;
  ubytek: boolean;
}

/**
 * Ułamkowy wzrost: ludność × WZROST% / 100 kumuluje się na wzrostUlamkowy.
 * Tylko gdy miasto nakarmione w tej turze (fed=true).
 */
export function applyFractionalGrowthV85(
  city: Pick<City, 'population' | 'wzrostUlamkowy'>,
  growthPct: number,
  fed: boolean,
  maAkwedukt: boolean,
  econParams: Pick<EconParams, 'akweduktProgLudnosci' | 'akweduktMaxLudnosci'>,
): FractionalGrowthResult {
  let pop = city.population;
  let frac = city.wzrostUlamkowy ?? 0;
  let wzrost = false;
  let ubytek = false;

  if (fed && growthPct > 0 && pop > 0) {
    const popCap = cityPopulationCap(maAkwedukt, econParams);
    if (pop < popCap) {
      frac += pop * growthPct / 100;
      while (frac >= 1 && pop < popCap) {
        pop += 1;
        frac -= 1;
        wzrost = true;
      }
    }
  }

  return { nowaLudnosc: pop, wzrostUlamkowy: frac, wzrost, ubytek };
}

/** Głód: 1 tura bez pełnej dopłaty → −1 ludność (min 1). */
export function applyHungerPenaltyV85(
  population: number,
  fed: boolean,
  turyBezDoplaty: number,
): { nowaLudnosc: number; turyBezDoplaty: number; ubytek: boolean } {
  if (fed) {
    return { nowaLudnosc: population, turyBezDoplaty: 0, ubytek: false };
  }
  const nextTury = (turyBezDoplaty ?? 0) + 1;
  if (nextTury >= 1 && population > 1) {
    return { nowaLudnosc: population - 1, turyBezDoplaty: 0, ubytek: true };
  }
  return { nowaLudnosc: population, turyBezDoplaty: nextTury, ubytek: false };
}

export function ensureCityRationDefaults(city: City): void {
  if (city.poziomRacji === undefined) {
    city.poziomRacji = migrateProcentRozwojToPoziomRacji(city.procentRozwoj);
  } else {
    city.poziomRacji = clampPoziomRacji(city.poziomRacji);
  }
  if (city.wzrostUlamkowy === undefined) city.wzrostUlamkowy = 0;
  if (city.turyBezDoplaty === undefined) city.turyBezDoplaty = 0;
}

export interface CentralFoodFedSnapshot {
  perOwner: ReadonlyArray<{
    perCityRows: ReadonlyArray<{
      cityId: string;
      name?: string;
      wzrostProcent?: number;
      breakdown?: GrowthPercentBreakdown;
      nakarmione?: boolean;
    }>;
    fedByCityId: ReadonlyMap<string, boolean>;
  }>;
}

export interface PostCentralGrowthOpts {
  cities: City[];
  econ: EconomyTickResult;
  efResult: CentralFoodFedSnapshot;
  map: GameMap;
  territoryNodes: readonly TerritoryNode[];
  econParams: Pick<EconParams, 'akweduktProgLudnosci' | 'akweduktMaxLudnosci'>;
  rationParams: RationParams;
  ownerCivByOwnerId?: ReadonlyMap<number, string>;
  spichlerzByCity?: ReadonlyMap<string, SpichlerzCityBonusState>;
  happinessByCityId?: ReadonlyMap<string, number>;
  builtByCity?: ReadonlyMap<string, readonly string[]>;
  ownerEraByOwner?: ReadonlyMap<number, number>;
  civBonusyByOwner?: ReadonlyMap<number, readonly CivEconomyBonus[]>;
}

/** Wzrost ułamkowy + głód — po centrali (nakarmione z fedByCityId). */
export function applyPostCentralPopulationGrowth(opts: PostCentralGrowthOpts): void {
  const {
    cities, econ, efResult, map, territoryNodes, econParams, rationParams,
    ownerCivByOwnerId, spichlerzByCity, happinessByCityId, builtByCity,
    ownerEraByOwner, civBonusyByOwner,
  } = opts;

  for (const ownerTick of efResult.perOwner) {
    for (const row of ownerTick.perCityRows) {
      const city = cities.find(c => c.id === row.cityId);
      const tick = econ.perCity.find(t => t.cityId === row.cityId);
      if (!city || !tick || tick.oblegany) continue;

      row.name = city.name;

      const fed = ownerTick.fedByCityId.get(row.cityId) ?? false;
      const spichlerz = spichlerzByCity?.get(row.cityId) ?? {
        ceramikaActive: tick.spichlerzCeramika ?? false,
        solActive: tick.spichlerzSol ?? false,
        maSpichlerzPop: tick.maSpichlerz ?? false,
        maSpichlerzIIPop: tick.maSpichlerzII ?? false,
      };
      const builtIds = builtByCity?.get(city.id) ?? [];
      const maAkwedukt = builtIds.includes('akwedukt');
      const happiness = happinessByCityId?.get(row.cityId) ?? 0;
      const breakdown = computeGrowthPercentV85({
        population: city.population,
        poziomRacji: getCityRationLevel(city),
        zdrowie: tick.zdrowie,
        szczescieNetto: happiness,
        wealthPoziom: city.wealthState?.poziom ?? 1,
        spichlerzState: spichlerz,
        civKey: ownerCivByOwnerId?.get(city.ownerId) ?? null,
        rationParams,
      });
      row.wzrostProcent = breakdown.total;
      row.breakdown = breakdown;
      row.nakarmione = fed;

      const before = city.population;
      const hunger = applyHungerPenaltyV85(city.population, fed, city.turyBezDoplaty ?? 0);
      city.turyBezDoplaty = hunger.turyBezDoplaty;
      city.population = hunger.nowaLudnosc;

      const growth = applyFractionalGrowthV85(
        { population: city.population, wzrostUlamkowy: city.wzrostUlamkowy },
        fed ? breakdown.total : 0,
        fed,
        maAkwedukt,
        econParams,
      );
      city.population = growth.nowaLudnosc;
      city.wzrostUlamkowy = growth.wzrostUlamkowy;

      tick.ludnoscPo = city.population;
      tick.wzrost = growth.wzrost;
      tick.ubytek = hunger.ubytek;
      tick.wzrostProcent = breakdown.total;
      tick.wzrostUlamkowyPo = city.wzrostUlamkowy;
      tick.magazynPoTurze = city.wzrostUlamkowy;

      if (city.population !== before) {
        rebalanceWorkersAfterPopulationChange(city, map, before, city.population, territoryNodes);
        const ownerEra = ownerEraByOwner?.get(city.ownerId) ?? 1;
        const mpMults = civManpowerMults(civBonusyByOwner?.get(city.ownerId));
        city.manpower = refreshManpowerAfterPopChange(city, ownerEra, before, mpMults.maxMult);
      }

      if (growth.wzrost) econ.growth += 1;
      if (hunger.ubytek) econ.starved += 1;
    }
  }
}

export type ApplyCentralFoodGrowthOpts = Omit<PostCentralGrowthOpts, 'efResult'>;

/** Wzrost ułamkowy + głód — po advanceEmpireFood (nakarmione z fedByCityId). */
export function applyCentralFoodPopulationGrowth(
  efResult: EmpireFoodTickResult,
  opts: ApplyCentralFoodGrowthOpts,
): void {
  applyPostCentralPopulationGrowth({ ...opts, efResult });
}
