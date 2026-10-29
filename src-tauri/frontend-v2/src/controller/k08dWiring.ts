/**
 * controller/k08dWiring.ts — wiring K08D (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1, runda 1).
 *
 * Podłącza pięć delegatów reguł gry (K08D-Z11: + `mennicaGate`) używane przez kopie K08D (`k08d-handel.ts`, `k08d-slider.ts`) przez
 * `setK08dDeps` (`ui/cityPanel/k08d-deps.ts`). Wartości przychodzą od wywołującego (silnik / kontroler / harness);
 * wiring NIE liczy reguł gry i NIE wstawia atrap (P5.13). Brak któregokolwiek delegatu = wyjątek przy pierwszym
 * wywołaniu (`K08D: brak delegatu …`), nie cicha wartość domyślna.
 *
 * Zależność: `cfg` (pola K08D-Z2: `getCivKey`, `getOwnerHasZlotoAccess`, `getTradeRoutes`, `difficulty`, `data`) i
 * pozostałe wejścia K05B podłącza `installK08cWiring` (`setK05bHost`) albo K09 — ten moduł go NIE nadpisuje.
 *
 * Granice: produkcyjny wywołujący (panel miasta, blok 9) NIE istnieje — podpięcie = K09 (NIE_ZROBIONE).
 */
import { setK08dDeps, type HandelEconParamsK08d, type MennicaGateK08d } from '../ui/cityPanel/k08d-deps';
import type { GameData, TradeRouteK05bDto } from '../ui/cityPanel/k05b-host';

/** Reguły gry dostarczane przez wywołującego (silnik / kontroler). */
export interface K08dRuleHost {
  /** K08D-Z11 (NAPRAW 5): bramka Mennicy (koniunkcje pinu `buildHandelDetailCard`, `cityPanel.ts:10861-10874`). */
  mennicaGate(ownerId: number): MennicaGateK08d;
  /** Pin `religiaSzPunkty` (`cityPanel.ts:3050`) — skala epoki + `proporcjonalneSzczescie` (K08D-Z12). */
  religiaSzPunkty(wskaznik: number, ownerId: number): number;
  /** Pin `kultReligScaleForEra(epoka, loadSocietyScaleParams(data))` z karty religii (`cityPanel.ts:6012-6016`, K08D-Z12). */
  religiaXRelTop(ownerId: number, data: GameData | null): number;
  /** Pin `buildEconParams(data, difficulty)` (`game/turn-economy.ts:317`). */
  buildEconParams(data: GameData, difficulty: string): HandelEconParamsK08d;
  /** Pin `cityHasBibliotekaLine(built)` (`game/building-upgrades.ts:129`). */
  cityHasBibliotekaLine(builtIds: readonly string[]): boolean;
  /** Pin `mnoznikHandelPieniadzForCivByDifficulty` (`game/economy.ts:831`). */
  mnoznikHandelPieniadzForCivByDifficulty(
    civKey: string | null | undefined,
    civs: unknown,
    difficulty: string,
    fallbackScaled: number,
  ): number;
  /** Pin `computeTradeRouteBuildingBonusByCity` (`game/trade-routes.ts:1683`). */
  computeTradeRouteBuildingBonusByCity(routes: readonly TradeRouteK05bDto[]): ReadonlyMap<number, number>;
}

/** Podłącza delegaty K08D. Wywoływać raz przy starcie UI panelu miasta (po `installK08cWiring`). */
export function installK08dWiring(rules: K08dRuleHost): void {
  setK08dDeps({
    mennicaGate: (ownerId) => rules.mennicaGate(ownerId),
    religiaSzPunkty: (wskaznik, ownerId) => rules.religiaSzPunkty(wskaznik, ownerId),
    religiaXRelTop: (ownerId, data) => rules.religiaXRelTop(ownerId, data),
    buildEconParams: (data, difficulty) => rules.buildEconParams(data, difficulty),
    cityHasBibliotekaLine: (builtIds) => rules.cityHasBibliotekaLine(builtIds),
    mnoznikHandelPieniadzForCivByDifficulty: (civKey, civs, difficulty, fallbackScaled) =>
      rules.mnoznikHandelPieniadzForCivByDifficulty(civKey, civs, difficulty, fallbackScaled),
    computeTradeRouteBuildingBonusByCity: (routes) => rules.computeTradeRouteBuildingBonusByCity(routes),
  });
}
