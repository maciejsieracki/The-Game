/**
 * k08e-deps.ts (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08E-Q1, runda 1): delegaty K08E dla reguł gry używanych przez
 * kopie pinu `edb8fb56` (`gra/src/ui/cityPanel.ts`) w partiach `k08e-*.ts`. Plik RĘCZNY (poza bramką kopii).
 *
 * P5.13: reguły gry NIE są liczone w UI. Reguły wzrostu/racji idą przez istniejący port reguł K01B (`reguly()`,
 * wstrzykiwany przez kontroler), reszta przez własny rejestr `setK08eDeps` (K08E-Z2). Brak delegatu = wyjątek
 * jawny (`K08E: brak delegatu …`), cicha wartość domyślna zakazana.
 *
 * Źródła pinu (do porównania przez harness):
 *   buildRationParams        — `game/population-growth-v85.ts:141` (`buildRationParams(econParams, difficulty)`);
 *   rationGrowthPercent      — `game/population-growth-v85.ts:195` (port K01B: `reguly().rationGrowthPercent`);
 *   growthGainPerTurnSlots   — pin import `game/population-growth-v85` (port K01B: `reguly().growthGainPerTurnSlots`);
 *   turnsUntilNextCitizen    — pin import `game/population-growth-v85` (port K01B: `reguly().turnsUntilNextCitizen`);
 *   cityLudnoscAbsolutna     — `game/manpower.ts` (pin import; liczba osób z obywateli wg epoki).
 */
import type { OrderStateK } from './k03-model';
import type { PoziomRacjiK, RationParamsK } from './k01b-dto';
import { reguly } from './k01b-reguly';
import type { City, GameData } from './k05b-host';
import type { CityView } from './k01b-t';
import type { GameMap } from './k05a-fundament';

/** K08E-Z3: stałe pinu `population-growth-v85.ts:27-44` (kopia wartości; te same co `WYZYWIENIE_SKALA` w K04C). */
export const WYZYWIENIE_MIN = 0;
export const WYZYWIENIE_MAX = 6;
export const WYZYWIENIE_STEP = 0.5;

/** Delegaty K08E, których implementacja dostarcza host/wiring (`controller/k08eWiring.ts`). */
export interface K08eDeps {
  /** Pin `buildRationParams(econParams, difficulty)` (`game/population-growth-v85.ts:141`) — reguła racji. */
  buildRationParams(econParams: unknown, difficulty: string): RationParamsK;
  /** Pin `cityLudnoscAbsolutna(population, epoch)` (`game/manpower.ts`) — ludność w osobach (reguła epoki). */
  cityLudnoscAbsolutna(population: number, epoch: number): number;
  /**
   * Pin `resolveOrderState(city, data)` (`cityPanel.ts:3084`) — K08E-Z8: stan porządku z SILNIKA (`cfg.getOrderState`),
   * a przy jego braku wynik lokalny. Port nie ma `computeOrderStateLocal` (K03-Z3: porządek wyłącznie z silnika);
   * host musi zwrócić `fromEngine` zgodnie z tym, skąd dane.
   */
  resolveOrderState(city: City, data: GameData): { state: OrderStateK; fromEngine: boolean };
  /** Pin `switchCity(dir)` (`cityPanel.ts:10209`) — przełączenie miasta; cięcie K09 (K08E-Z9): delegat hosta. */
  switchCity(dir: -1 | 1): void;
  /** Pin `resolveCityHealth(city, map, data)` (`cityPanel.ts:3281`) — zdrowie miasta (reguła; wynik z silnika/hosta). */
  resolveCityHealth(city: City, map: GameMap, data: GameData): CityHealthK08e;
  /** Pin `porPctBand(por)` (`game/society-breakdown.ts`) — klucz pasma porządku (reguła). */
  porPctBand(por: number): string;
  /** Pin `POR_BAND_LABELS[band]` (tabela etykiet pasm z danych gry; K08E-Z11). */
  porBandLabel(band: string): string;
  /** Pin `ownerCities(city)` (`cityPanel.ts`, miasta tego samego właściciela) — K08E-Z12 (identyfikatory silnika). */
  ownerCities(city: City): readonly City[];
  /** Pin `cityPanelTitle(city)` — tytuł miasta w pasku (K08E-Z12). */
  cityPanelTitle(city: City): string;
  /** Pin `buildCityOnlyW3FlankChips(city, view, data, map)` — chipy boków paska (K08E-Z12, presentacja z DTO hosta). */
  buildCityOnlyW3FlankChips(
    city: City, view: CityView, data: GameData | null, map: GameMap | null,
  ): { readonly left: string; readonly right: string };
}

/** Wynik pinowego `resolveCityHealth` — pola czytane przez kartę Ludność (K08E-Z13). */
export interface CityHealthK08e {
  readonly total: number;
  readonly lines: readonly { readonly label: string; readonly value: number; readonly [key: string]: unknown }[];
  readonly fromEngine: boolean;
}

let deps: Partial<K08eDeps> | null = null;

/** Ustawia delegaty K08E (merge z poprzednimi). Wywoływane przez `controller/k08eWiring.ts`. */
export function setK08eDeps(next: Partial<K08eDeps>): void {
  deps = { ...(deps ?? {}), ...next };
}

/** Delegat K08E; brak = wyjątek `K08E: brak delegatu <nazwa>`. */
function depK08e<K extends keyof K08eDeps>(name: K): K08eDeps[K] {
  const f = deps?.[name];
  if (f === undefined) throw new Error(`K08E: brak delegatu ${String(name)} (setK08eDeps)`);
  return f as K08eDeps[K];
}

/** Delegat K08E: parametry racji z ekonomii (pin `buildRationParams`). */
export const buildRationParams = (econParams: unknown, difficulty: string): RationParamsK =>
  depK08e('buildRationParams')(econParams, difficulty);

/** Delegat K08E: ludność absolutna w osobach (pin `cityLudnoscAbsolutna`). */
export const cityLudnoscAbsolutna = (population: number, epoch: number): number =>
  depK08e('cityLudnoscAbsolutna')(population, epoch);

/** Pin `rationGrowthPercent(level, params)` — port reguł K01B (`reguly()`, brak cichego fallbacku). */
export const rationGrowthPercent = (level: PoziomRacjiK, params?: RationParamsK): number =>
  reguly().rationGrowthPercent(level, params);

/** Pin `growthGainPerTurnSlots(...)` — port reguł K01B (`reguly()`). */
export const growthGainPerTurnSlots = (population: number, growthPct: number, fed: boolean, atPopCap: boolean): number =>
  reguly().growthGainPerTurnSlots(population, growthPct, fed, atPopCap);

/** Pin `turnsUntilNextCitizen(frac, gain)` — port reguł K01B (`reguly()`). */
export const turnsUntilNextCitizen = (wzrostUlamkowy: number, gainPerTurn: number): number | null =>
  reguly().turnsUntilNextCitizen(wzrostUlamkowy, gainPerTurn);

/** Delegat K08E: stan porządku miasta (K08E-Z8, pin `resolveOrderState`). */
export const resolveOrderState = (city: City, data: GameData): { state: OrderStateK; fromEngine: boolean } =>
  depK08e('resolveOrderState')(city, data);

/** Delegat K08E: przełączenie miasta (K08E-Z9, cięcie K09; pin `switchCity`). */
export const switchCity = (dir: -1 | 1): void => depK08e('switchCity')(dir);

/** Delegat K08E: zdrowie miasta (K08E-Z13, pin `resolveCityHealth`). */
export const resolveCityHealth = (city: City, map: GameMap, data: GameData): CityHealthK08e =>
  depK08e('resolveCityHealth')(city, map, data);
/** Delegat K08E: klucz pasma porządku (pin `porPctBand`). */
export const porPctBand = (por: number): string => depK08e('porPctBand')(por);
/** Delegat K08E: etykieta pasma porządku (K08E-Z11, pin `POR_BAND_LABELS`). */
export const porBandLabel = (band: string): string => depK08e('porBandLabel')(band);
/** Delegat K08E: miasta tego samego właściciela (K08E-Z12, pin `ownerCities`). */
export const ownerCities = (city: City): readonly City[] => depK08e('ownerCities')(city);
/** Delegat K08E: tytuł miasta (K08E-Z12, pin `cityPanelTitle`). */
export const cityPanelTitle = (city: City): string => depK08e('cityPanelTitle')(city);
/** Delegat K08E: chipy boków paska miasta (K08E-Z12, pin `buildCityOnlyW3FlankChips`). */
export const buildCityOnlyW3FlankChips = (
  city: City, view: CityView, data: GameData | null, map: GameMap | null,
): { readonly left: string; readonly right: string } => depK08e('buildCityOnlyW3FlankChips')(city, view, data, map);

/** Nazwy delegatów K08E (do raportu brakujących w `k08eWiring`). */
export const K08E_FN_NAMES = [
  'buildRationParams', 'cityLudnoscAbsolutna', 'resolveOrderState', 'switchCity', 'resolveCityHealth',
  'porPctBand', 'porBandLabel', 'ownerCities', 'cityPanelTitle', 'buildCityOnlyW3FlankChips',
] as const;
