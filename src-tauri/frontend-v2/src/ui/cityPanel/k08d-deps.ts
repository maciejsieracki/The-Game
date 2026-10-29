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
import type { City, GameData, K05bCfg, TradeRouteK05bDto } from './k05b-host';
import type { EmpireHudSnap } from './k01a-fundament';
import type { GameMap } from './k05a-fundament';
import { dep } from './k06b-deps';

/**
 * K08D-Z9 (odpowiedź na zarzut Evaluatora, runda 2): wymagane pole `cfg` (K08D-Z2). Pin używa `cfg.X?.(…) ?? wartość`
 * (cicha wartość domyślna, np. dostęp do złota = `true`); port NIE podstawia wartości domyślnej — brak pola = wyjątek
 * `K08D: brak pola cfg …`. Reguła gry (bramka Mennicy) nie może zależeć od cichej atrapy.
 */
export function cfgK08dRequired<K extends 'getOwnerHasZlotoAccess'>(
  c: K05bCfg,
  name: K,
): NonNullable<K05bCfg[K]> {
  const f = c[name];
  if (f === undefined) throw new Error(`K08D: brak pola cfg ${name} (K08D-Z2)`);
  return f as NonNullable<K05bCfg[K]>;
}

/** Pola czytane przez kopię `buildHandelDetailCard` z wyniku pinowego `buildEconParams` (P5.13: wartości, nie reguły). */
export interface HandelEconParamsK08d {
  readonly korupcjaWspolczynnikDystansu: number;
  readonly korupcjaWspolczynnikMiast: number;
  readonly korupcjaCap: number;
  readonly mennicaMnoznikPoWalucie: number;
}

/**
 * K08D-Z11 (runda 3, NAPRAW 5, P5.13): wynik bramki Mennicy liczony PO STRONIE DELEGATU `mennicaGate` (host / K09), nie w UI.
 * Pola = koniunkcje pinu `buildHandelDetailCard` (`cityPanel.ts:10861-10874`): budynek Mennicy w imperium
 * (`maMennicaBudynek`), mnożnik aktywny (budynek && dostęp do złota && Waluta) i „śpi" (budynek && Waluta && brak złota).
 */
export interface MennicaGateK08d {
  readonly maMennicaBudynek: boolean;
  readonly mennicaAktywna: boolean;
  readonly mennicaSpiZBrakuZlota: boolean;
}

/** Kontrakt delegatów reguł K08D (dostarcza wiring/host; UI ich nie implementuje). */
export interface K08dDeps {
  mennicaGate(ownerId: number): MennicaGateK08d;
  /** Pin `religiaSzPunkty(wskaznik, ownerId)` (:3050) — punkty Szczęścia wpływu religii (reguła skali epoki). */
  religiaSzPunkty(wskaznik: number, ownerId: number): number;
  /** Pin `kultReligScaleForEra(epoka, loadSocietyScaleParams(...))` z tekstu karty religii (:6012-6016) — reguła. */
  religiaXRelTop(ownerId: number, data: GameData | null): number;
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

/** Delegat K08D: punkty Szczęścia religii (K08D-Z12, reguła pinu `religiaSzPunkty`). */
export const religiaSzPunkty = (wskaznik: number, ownerId: number): number => depK08d('religiaSzPunkty')(wskaznik, ownerId);

/** Delegat K08D: skala religii w tekście karty (K08D-Z12, reguła pinu). */
export const religiaXRelTop = (ownerId: number, data: GameData | null): number => depK08d('religiaXRelTop')(ownerId, data);

/**
 * Snapshot imperium (pin `resolveEmpireSnap`, :1637) — delegat K08C przez rejestr K06B (`dep`, ten sam co `k08c-deps.ts`);
 * K08D-Z12: nie duplikujemy wiringu, mapa (`_map`) nieczytana przez delegat.
 */
export const resolveEmpireSnap = (city: City, map: GameMap | null, data: GameData | null): EmpireHudSnap =>
  dep('resolveEmpireSnap')(city, map, data) as EmpireHudSnap;

/** Delegat bramki Mennicy (K08D-Z11): UI czyta gotowe pola, nie składa koniunkcji. */
export const mennicaGate = (ownerId: number): MennicaGateK08d => depK08d('mennicaGate')(ownerId);

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

/**
 * Pin `computeTradeRouteBuildingBonusByCity(routes)` — premia handlowa per miasto (trasy z budynkiem).
 * KONTRAKT ID (K08D-Z10, pomiar runda 2): pin zwraca `Map<string, number>` (`game/trade-routes.ts:1683-1686`, klucze =
 * `fromCityId`/`toCityId: string`, `game/trade-routes.ts:102-103`; `City.id: string`, `game/cities.ts:835`), a port K05B
 * trzyma `City.id: number` (`k05b-host.ts:7`). Delegat zwraca `ReadonlyMap<number, number>` w modelu portu. Host (K09)
 * MUSI przemapować id silnika na id portu. Rozbieżność NIE_ZROBIONE w tej rundzie (zmiana modelu K05B poza allowlistą).
 */
export const computeTradeRouteBuildingBonusByCity = (
  routes: readonly TradeRouteK05bDto[],
): ReadonlyMap<number, number> => depK08d('computeTradeRouteBuildingBonusByCity')(routes);

/** Pin `game/danina-nazwa.ts:21` `daninaLabelAccusative` — stała `'podatek'` (ten sam wynik co pin, bez reguł). */
export const daninaLabelAccusative = (_label?: string): 'podatek' => 'podatek';

/** Nazwy delegatów K08D (do raportu brakujących w `k08dWiring`). */
export const K08D_FN_NAMES = [
  'mennicaGate',
  'religiaSzPunkty',
  'religiaXRelTop',
  'buildEconParams',
  'cityHasBibliotekaLine',
  'mnoznikHandelPieniadzForCivByDifficulty',
  'computeTradeRouteBuildingBonusByCity',
] as const;
