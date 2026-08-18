/**
 * population-growth-v85.ts — racje żywności (Wyżywienie 0–6, krok 0,5).
 * Decyzja Macieja 2026-07-30: koszt żywności = poziom Wyżywienia; wzrost z tabeli.
 */
import type { City } from './cities';
import { cityPopulationCap } from './economy';
import type { EconParams, CivEconomyBonus } from './economy';
import {
  cityHasSpichlerzBuilding,
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
import { R_STAWKI_KOSZT_MULT } from './r-stawki-strojenie';

/** Poziom suwaka Wyżywienie: 0 … 6 co 0,5 (koszt żywności na mieszkańca = ta wartość). */
export type PoziomRacji = number;

export const WYZYWIENIE_MIN = 0;
export const WYZYWIENIE_MAX = 6;
/**
 * ⚠️ NIEZMIENNIK — P-ETYKIETA-WZROST-ZAOKRAGLENIE-ROZJAZD (2026-08-09): panel miasta zaokrągla
 * WZROST% przez `Number(x.toFixed(1))` (`formatLiczbaPl` w `ui/formatPl.ts`), plakietka mapy
 * przez `Math.round(x*10)/10` (`formatCityGrowthPercentLabel` w `render/cityMapStatChip.ts`).
 * Te dwa wzory dają IDENTYCZNY wynik dla kroków będących wielokrotnością 0,1 (w tym 0,5) —
 * rozjazd pojawia się dopiero przy krokach generujących NIEPARZYSTE wielokrotności 0,05, np.
 * 0,25 / 0,05 / 0,01 (`0.15` → „0,1%" vs „0,2%", błąd reprezentacji zmiennoprzecinkowej `toFixed`
 * przy remisie zaokrąglenia). `computeGrowthPercentV85()` sumuje sześć składników, z których
 * każdy jest dziś wielokrotnością `WYZYWIENIE_STEP` (0,5) — stąd suma też jest, i parytet
 * panel↔plakietka trzyma się BEZ osobnej naprawy kodu formatującego. Jeśli kiedyś zmienisz ten
 * krok na wartość generującą nieparzyste wielokrotności 0,05 (np. 0,25) — sprawdź NAJPIERW test
 * `gra/tools/city-growth-percent-rounding-parity-test.cjs` (przypina ten niezmiennik i wysypie
 * się przy zmianie kroku) i rozważ ujednolicenie obu formuł zaokrąglenia, bo dopiero wtedy
 * rozjazd staje się realny w grze.
 */
export const WYZYWIENIE_STEP = 0.5;

/** Wszystkie dozwolone poziomy Wyżywienia (0, 0.5, …, 6). */
export const WYZYWIENIE_LEVELS: readonly number[] = Array.from(
  { length: Math.round((WYZYWIENIE_MAX - WYZYWIENIE_MIN) / WYZYWIENIE_STEP) + 1 },
  (_, i) => WYZYWIENIE_MIN + i * WYZYWIENIE_STEP,
);

/** Wzrost ludności (% na turę) per poziom Wyżywienia — decyzja 2026-07-30. */
export const WYZYWIENIE_GROWTH_PCT: Readonly<Record<number, number>> = {
  0: -10,
  0.5: -6,
  1: -2,
  1.5: 0,
  2: 1.5,
  2.5: 3,
  3: 3.5,
  3.5: 4,
  4: 4.5,
  4.5: 5,
  5: 5.5,
  5.5: 6,
  6: 7,
};

/** Domyślne Wyżywienie = 4 (≈ dawna racja 2 przy koszcie 4 żywności). */
export const DEFAULT_POZIOM_RACJI: PoziomRacji = 4;

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

/** @deprecated Tabela Wyżywienie 2026-07-30 — params ignorowane przy koszcie/wzroście; zachowane dla kompatybilności API. */
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
    racjeZywnosc1:    pick(section.racje_zywnosc_1, difficulty, 2),
    racjeZywnosc2:    pick(section.racje_zywnosc_2, difficulty, 4),
    racjeZywnosc3:    pick(section.racje_zywnosc_3, difficulty, 6),
    racjeWzrostProc1: pick(section.racje_wzrost_proc_1, difficulty, 3),
    racjeWzrostProc2: pick(section.racje_wzrost_proc_2, difficulty, 5),
    racjeWzrostProc3: pick(section.racje_wzrost_proc_3, difficulty, 7),
  };
}

/** Przycina do 0…6 co 0,5. */
export function clampPoziomRacji(n: number): PoziomRacji {
  const clamped = Math.min(WYZYWIENIE_MAX, Math.max(WYZYWIENIE_MIN, n));
  return Math.round(clamped / WYZYWIENIE_STEP) * WYZYWIENIE_STEP;
}

/** Stare batony 1|2|3 → Wyżywienie 2|4|6 (koszt żywności). */
export function migrateLegacyRationLevel(old: number): PoziomRacji {
  if (old === 1) return 2;
  if (old === 2) return 4;
  if (old === 3) return 6;
  return clampPoziomRacji(old);
}

/** Migracja: procentRozwoj 0–100 → Wyżywienie 0–6. */
export function migrateProcentRozwojToPoziomRacji(procentRozwoj: number | undefined): PoziomRacji {
  if (procentRozwoj === undefined) return DEFAULT_POZIOM_RACJI;
  return clampPoziomRacji((procentRozwoj / 100) * WYZYWIENIE_MAX);
}

export function getCityRationLevel(city: Pick<City, 'poziomRacji' | 'procentRozwoj' | 'rationMigratedV114'>): PoziomRacji {
  if (city.poziomRacji !== undefined) return clampPoziomRacji(city.poziomRacji);
  return migrateProcentRozwojToPoziomRacji(city.procentRozwoj);
}

/** Koszt żywności na mieszkańca = poziom Wyżywienia × R-STAWKI-STROJENIE. */
export function rationFoodCostPerPop(level: PoziomRacji, _params?: RationParams): number {
  return clampPoziomRacji(level) * R_STAWKI_KOSZT_MULT;
}

/** Wzrost ludności (%/turę) z tabeli Wyżywienie. */
export function rationGrowthPercent(level: PoziomRacji, _params?: RationParams): number {
  const key = clampPoziomRacji(level);
  return WYZYWIENIE_GROWTH_PCT[key] ?? 0;
}

export function formatWyzwienieLabel(level: PoziomRacji): string {
  const v = clampPoziomRacji(level);
  return Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',');
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
  /** R-ZUZYCIE-SUROWCOW-OBYWATELE: suma kary Rozwoju za brakujące surowce budowlane obywateli. */
  zaopatrzenie: number;
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
  /**
   * R-ZUZYCIE-SUROWCOW-OBYWATELE (Maciej 2026-08-10): suma kary Rozwoju (%) za surowce
   * budowlane obywateli brakujące w magazynie centralnym imperium (-1%/surowiec brakujący,
   * binarne per surowiec, ECHO Q3=A) — niezależna od kanału Szczęścia, dodawana WPROST do
   * sumy sześciu (teraz siedmiu) składników, nie skalowana przez `/10` jak `szczescie`.
   * Wołający dostarcza już zsumowaną wartość —
   * `resolveCitizenResourceCoverage(era, empireStock).growthPctDelta`
   * (`citizen-resource-upkeep.ts`). Brak (undefined) = 0, bez zmiany zachowania.
   */
  citizenResourceGrowthPct?: number;
}

/** WZROST% — suma składników (PYTANIE-85, brak capa Q8). */
export function computeGrowthPercentV85(input: GrowthPercentInput): GrowthPercentBreakdown {
  const racje = rationGrowthPercent(input.poziomRacji, input.rationParams);
  const maleMiasto = Math.max(0, 6 - input.population);
  const spichlerz = spichlerzGrowthBonusPercent(input.spichlerzState);
  const zdrowie = Math.floor(Math.max(0, input.zdrowie) / 10);
  // szczescieNetto (ordPct.sz.netto / happinessByCityId) already includes Wealth via haWealth
  // (wealthZadowolenie). wealthPoziom stays in GrowthPercentInput for API/save compat only.
  const szczescie = Math.floor(Math.max(0, input.szczescieNetto) / 10);
  const civRaw = input.civKey ? civMatrixParam(input.civKey, 'lud_wzrost_proc') : 0;
  const cywilizacja = Math.round(civRaw * 100);
  const zaopatrzenie = input.citizenResourceGrowthPct ?? 0;
  const total = racje + maleMiasto + spichlerz + zdrowie + szczescie + cywilizacja + zaopatrzenie;
  return { total, racje, maleMiasto, spichlerz, zdrowie, szczescie, cywilizacja, zaopatrzenie };
}

export interface FractionalGrowthResult {
  nowaLudnosc: number;
  wzrostUlamkowy: number;
  wzrost: boolean;
  ubytek: boolean;
}

/**
 * Ułamkowy wzrost/spadek: ludność × WZROST% / 100 kumuluje się na wzrostUlamkowy.
 * Tylko gdy miasto nakarmione w tej turze (fed=true).
 *
 * `maSpichlerz` = R-SPICHLERZ-CAP-LUDNOSCI-ETAP (2026-08-09): sam fakt posiadania Spichlerza
 * (I lub II), niezależnie od Akweduktu — środkowy stopień drabinki capu (cap=8 zamiast 5).
 */
export function applyFractionalGrowthV85(
  city: Pick<City, 'population' | 'wzrostUlamkowy'>,
  growthPct: number,
  fed: boolean,
  maAkwedukt: boolean,
  econParams: Pick<EconParams, 'akweduktProgLudnosci' | 'spichlerzProgLudnosci' | 'akweduktMaxLudnosci'>,
  maSpichlerz: boolean = false,
): FractionalGrowthResult {
  let pop = city.population;
  let frac = city.wzrostUlamkowy ?? 0;
  let wzrost = false;
  let ubytek = false;

  if (fed && growthPct !== 0 && pop > 0) {
    const popCap = cityPopulationCap(maAkwedukt, maSpichlerz, econParams);
    if (growthPct > 0 && pop < popCap) {
      frac += pop * growthPct / 100;
      while (frac >= 1 && pop < popCap) {
        pop += 1;
        frac -= 1;
        wzrost = true;
      }
    } else if (growthPct < 0 && pop > 1) {
      frac -= pop * (-growthPct) / 100;
      while (frac >= 1 && pop > 1) {
        pop -= 1;
        frac -= 1;
        ubytek = true;
      }
    }
  }

  return { nowaLudnosc: pop, wzrostUlamkowy: frac, wzrost, ubytek };
}

/** Przyrost ułamkowy (sloty obywateli) w jednej turze przy nakarmieniu. */
export function growthGainPerTurnSlots(
  population: number,
  growthPct: number,
  fed: boolean,
  atPopCap: boolean,
): number {
  if (!fed || growthPct === 0 || population <= 0) return 0;
  if (growthPct > 0 && atPopCap) return 0;
  return population * growthPct / 100;
}

/** Ile tur do +1 obywatela przy stałym tempie (null = brak wzrostu). Ułamek <1 zostaje w buforze. */
export function turnsUntilNextCitizen(
  wzrostUlamkowy: number,
  gainPerTurn: number,
): number | null {
  if (gainPerTurn <= 0) return null;
  const frac = wzrostUlamkowy ?? 0;
  if (frac >= 1) return 0;
  return Math.ceil((1 - frac) / gainPerTurn);
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
  if (!city.rationMigratedV114) {
    if (city.poziomRacji !== undefined
      && Number.isInteger(city.poziomRacji)
      && city.poziomRacji >= 1
      && city.poziomRacji <= 3) {
      city.poziomRacji = migrateLegacyRationLevel(city.poziomRacji);
    } else if (city.poziomRacji === undefined && city.procentRozwoj !== undefined) {
      city.poziomRacji = migrateProcentRozwojToPoziomRacji(city.procentRozwoj);
    }
    city.rationMigratedV114 = true;
  }
  if (city.poziomRacji === undefined) {
    city.poziomRacji = DEFAULT_POZIOM_RACJI;
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
  econParams: Pick<EconParams, 'akweduktProgLudnosci' | 'spichlerzProgLudnosci' | 'akweduktMaxLudnosci'>;
  rationParams: RationParams;
  ownerCivByOwnerId?: ReadonlyMap<number, string>;
  spichlerzByCity?: ReadonlyMap<string, SpichlerzCityBonusState>;
  happinessByCityId?: ReadonlyMap<string, number>;
  builtByCity?: ReadonlyMap<string, readonly string[]>;
  ownerEraByOwner?: ReadonlyMap<number, number>;
  civBonusyByOwner?: ReadonlyMap<number, readonly CivEconomyBonus[]>;
  /**
   * R-ZUZYCIE-SUROWCOW-OBYWATELE (Maciej 2026-08-10): kara Rozwoju (%) per miasto za surowce
   * budowlane obywateli brakujące w magazynie centralnym imperium — `citizen-resource-upkeep.ts`
   * `resolveCitizenResourceCoverage(...).growthPctDelta`, wyliczona RAZ per miasto per turę przez
   * wołającego (main.ts, ten sam magazyn dla każdego miasta jednego ownera). Brak hooka → 0 (bez
   * zmiany zachowania, wsteczna kompatybilność).
   */
  citizenGrowthPctByCityId?: ReadonlyMap<string, number>;
  /**
   * P-AUTO-WYZYWIENIE-BUG2 (Maciej ECHO A): wołany PO faktycznym przyroście populacji
   * TEGO miasta w tej turze (nie tylko gdy zmienia się procent wzrostu) -- domyka lukę,
   * w której `applyLiveSafeRationForCity` (main.ts) przeliczał bezpieczny poziom Racji
   * RAZ, PRZED tym przyrostem, więc poziom uznany za bezpieczny w turze N stawał się
   * deficytowy w N+1 (koszt Racji skaluje się z populacją). Callback zamiast importu
   * main.ts -- population-growth-v85.ts nie zna `applyLiveSafeRationForCity` (uniknięcie
   * cyklicznego importu main.ts <-> population-growth-v85.ts).
   * / EN: called AFTER this city's population actually grew this turn (not merely when
   * the growth percent is computed) -- closes the gap where `applyLiveSafeRationForCity`
   * (main.ts) validated the safe ration level ONCE, BEFORE this growth, so a level judged
   * safe in turn N became a deficit in N+1 (ration cost scales with population). Callback
   * instead of importing main.ts -- avoids a circular import.
   */
  onCityPopulationChanged?: (cityId: string) => void;
  /**
   * P-HEKS-SPOR-SASIAD runda 2 nota B (Maciej 2026-08-13): heksy przegrane na rzecz
   * bliższego miasta TEGO SAMEGO właściciela, per cityId —
   * `computeLostToNearerSiblingByCity(cities, map)`, liczone RAZ przez wołającego
   * (main.ts) przed wywołaniem tej funkcji. Bez tego hooka rebalans po wzroście
   * populacji w trybie ręcznym mógł (rzadko) posadzić 👤 na spornym polu -- odczyt
   * jest fail-closed (bez podwójnego liczenia), ale slot robotnika marnował się
   * po cichu. Brak hooka -> undefined -> `rebalanceWorkersAfterPopulationChange`
   * dostaje `excludeHexKeys=undefined`, zachowanie identyczne jak przed rundą 2.
   * / EN: hexes lost to a closer same-owner sibling city, per cityId -- computed
   * ONCE by the caller before this call. Without it the manual-mode rebalance
   * after population growth could occasionally seat a worker on a contested tile.
   */
  excludeHexKeysByCity?: ReadonlyMap<string, ReadonlySet<string>>;
}

/** Wzrost ułamkowy + głód — po centrali (nakarmione z fedByCityId). */
export function applyPostCentralPopulationGrowth(opts: PostCentralGrowthOpts): void {
  const {
    cities, econ, efResult, map, territoryNodes, econParams, rationParams,
    ownerCivByOwnerId, spichlerzByCity, happinessByCityId, builtByCity,
    ownerEraByOwner, civBonusyByOwner, citizenGrowthPctByCityId,
    onCityPopulationChanged, excludeHexKeysByCity,
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
      // R-SPICHLERZ-CAP-LUDNOSCI-ETAP (2026-08-09, runda 2, B1): sam fakt posiadania
      // Spichlerza w DOWOLNYM tierze (I lub II) — NIE `spichlerz.maSpichlerzPop`, bo to
      // flaga zależna od drainu Ceramiki w tej turze (inny mechanizm), a Spichlerz II
      // usuwa 'spichlerz' z builtIds przy ulepszeniu (upgradeFrom w buildings.json).
      const maSpichlerzBuilding = cityHasSpichlerzBuilding(builtIds);
      const happiness = happinessByCityId?.get(row.cityId) ?? 0;
      const citizenGrowthPct = citizenGrowthPctByCityId?.get(row.cityId) ?? 0;
      const breakdown = computeGrowthPercentV85({
        population: city.population,
        poziomRacji: getCityRationLevel(city),
        zdrowie: tick.zdrowie,
        szczescieNetto: happiness,
        wealthPoziom: city.wealthState?.poziom ?? 1,
        spichlerzState: spichlerz,
        civKey: ownerCivByOwnerId?.get(city.ownerId) ?? null,
        rationParams,
        citizenResourceGrowthPct: citizenGrowthPct,
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
        maSpichlerzBuilding,
      );
      city.population = growth.nowaLudnosc;
      city.wzrostUlamkowy = growth.wzrostUlamkowy;

      tick.ludnoscPo = city.population;
      tick.wzrost = growth.wzrost;
      tick.ubytek = hunger.ubytek || growth.ubytek;
      tick.wzrostProcent = breakdown.total;
      tick.wzrostUlamkowyPo = city.wzrostUlamkowy;
      tick.magazynPoTurze = city.wzrostUlamkowy;

      if (city.population !== before) {
        rebalanceWorkersAfterPopulationChange(
          city, map, before, city.population, territoryNodes,
          excludeHexKeysByCity?.get(city.id),
        );
        const ownerEra = ownerEraByOwner?.get(city.ownerId) ?? 1;
        const mpMults = civManpowerMults(civBonusyByOwner?.get(city.ownerId));
        city.manpower = refreshManpowerAfterPopChange(city, ownerEra, before, mpMults.maxMult);
        // P-AUTO-WYZYWIENIE-BUG2: populacja TEGO miasta faktycznie się zmieniła w tej
        // turze -- przelicz bezpieczny poziom Racji NA ŻYWO, PO przyroście (patrz komentarz
        // przy `onCityPopulationChanged` w PostCentralGrowthOpts wyżej).
        onCityPopulationChanged?.(city.id);
      }

      if (growth.wzrost) econ.growth += 1;
      if (hunger.ubytek || growth.ubytek) econ.starved += 1;
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
