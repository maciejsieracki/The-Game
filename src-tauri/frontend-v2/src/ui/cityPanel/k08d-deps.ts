/**
 * k08d-deps.ts (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1, runda 1): delegaty K08D dla reguł gry używanych przez
 * kopie pinu `edb8fb56` (`gra/src/ui/cityPanel.ts`) w partiach `k08d-handel.ts` i `k08d-slider.ts`. Plik RĘCZNY (poza bramką kopii).
 *
 * P5.13: reguły gry NIE są liczone w UI. Każdy delegat idzie przez własny rejestr `setK08dDeps` (osobny od `k06b-deps`,
 * żeby nie nadpisywać delegatów K08C; K08D-Z1). Brak delegatu = wyjątek jawny (cicha wartość domyślna zakazana).
 *
 * Źródła pinu (do porównania przez harness):
 *   buildEconParams            — `game/turn-economy.ts:317` (`buildEconParams(data, difficulty)`);
 *   cityHasBibliotekaLine      — `game/building-upgrades.ts:129`;
 *   mnoznikHandelPieniadzForCivByDifficulty — `game/economy.ts:831`;
 *   computeTradeRouteBuildingBonusByCity    — `game/trade-routes.ts:1683`;
 *   daninaLabelAccusative      — `game/danina-nazwa.ts:21` (stała `'podatek'`, bez reguł: tu jako stała pinu).
 */
import type { GameData, TradeRouteK05bDto } from './k05b-host';

/** Pola czytane przez kopię `buildHandelDetailCard` z wyniku pinowego `buildEconParams` (P5.13: wartości, nie reguły). */
export interface HandelEconParamsK08d {
  readonly korupcjaWspolczynnikDystansu: number;
  readonly korupcjaWspolczynnikMiast: number;
  readonly korupcjaCap: number;
  readonly mennicaMnoznikPoWalucie: number;
}

/** Kontrakt delegatów reguł K08D (dostarcza wiring/host; UI ich nie implementuje). */
export interface K08dDeps {
  buildEconParams(data: GameData, difficulty: string): HandelEconParamsK08d;
  cityHasBibliotekaLine(builtIds: readonly string[]): boolean;
  mnoznikHandelPieniadzForCivByDifficulty(
    civKey: string | null | undefined,
    civs: unknown,
    difficulty: string,
    fallbackScaled: number,
  ): number;
  computeTradeRouteBuildingBonusByCity(routes: readonly TradeRouteK05bDto[]): ReadonlyMap<number, number>;
}

let deps: Partial<K08dDeps> | null = null;

/** Ustawia delegaty K08D (merge z poprzednimi). Wywoływane przez `controller/k08dWiring.ts`. */
export function setK08dDeps(next: Partial<K08dDeps>): void {
  deps = { ...(deps ?? {}), ...next };
}

/** Delegat K08D; brak = wyjątek `K08D: brak delegatu <nazwa>`. */
function depK08d<K extends keyof K08dDeps>(name: K): K08dDeps[K] {
  const f = deps?.[name];
  if (f === undefined) throw new Error(`K08D: brak delegatu ${String(name)} (setK08dDeps)`);
  return f as K08dDeps[K];
}

/** Pin `buildEconParams(data, difficulty)` — parametry korupcji i mnożnika Mennicy (wartości silnika). */
export const buildEconParams = (data: GameData, difficulty: string): HandelEconParamsK08d =>
  depK08d('buildEconParams')(data, difficulty);

/** Pin `cityHasBibliotekaLine(built)` — czy miasto ma linię Biblioteki (reguła budynków). */
export const cityHasBibliotekaLine = (builtIds: readonly string[]): boolean =>
  depK08d('cityHasBibliotekaLine')(builtIds);

/** Pin `mnoznikHandelPieniadzForCivByDifficulty(civKey, civs, difficulty, fallback)` — mnożnik Waluty+Mennicy. */
export const mnoznikHandelPieniadzForCivByDifficulty = (
  civKey: string | null | undefined,
  civs: unknown,
  difficulty: string,
  fallbackScaled: number,
): number => depK08d('mnoznikHandelPieniadzForCivByDifficulty')(civKey, civs, difficulty, fallbackScaled);

/** Pin `computeTradeRouteBuildingBonusByCity(routes)` — premia handlowa per miasto (trasy z budynkiem). */
export const computeTradeRouteBuildingBonusByCity = (
  routes: readonly TradeRouteK05bDto[],
): ReadonlyMap<number, number> => depK08d('computeTradeRouteBuildingBonusByCity')(routes);

/** Pin `game/danina-nazwa.ts:21` `daninaLabelAccusative` — stała `'podatek'` (ten sam wynik co pin, bez reguł). */
export const daninaLabelAccusative = (_label?: string): 'podatek' => 'podatek';

/** Nazwy delegatów K08D (do raportu brakujących w `k08dWiring`). */
export const K08D_FN_NAMES = [
  'buildEconParams',
  'cityHasBibliotekaLine',
  'mnoznikHandelPieniadzForCivByDifficulty',
  'computeTradeRouteBuildingBonusByCity',
] as const;
