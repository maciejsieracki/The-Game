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
import type { PoziomRacjiK, RationParamsK } from './k01b-dto';
import { reguly } from './k01b-reguly';

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

/** Nazwy delegatów K08E (do raportu brakujących w `k08eWiring`). */
export const K08E_FN_NAMES = ['buildRationParams', 'cityLudnoscAbsolutna'] as const;
