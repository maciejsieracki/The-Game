/**
 * controller/k08eWiring.ts — wiring K08E (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08E-Q1, runda 1, partia `magazyn`).
 *
 * Podłącza delegaty reguł gry K08E (`ui/cityPanel/k08e-deps.ts`) używane przez kopie K08E (`k08e-magazyn.ts`) przez
 * `setK08eDeps`. Wartości przychodzą od wywołującego (silnik / kontroler / harness); wiring NIE liczy reguł gry
 * i NIE wstawia atrap (P5.13). Brak delegatu = wyjątek przy pierwszym wywołaniu (`K08E: brak delegatu …`).
 *
 * Reguły wzrostu/racji (`rationGrowthPercent`, `growthGainPerTurnSlots`, `turnsUntilNextCitizen`) idą przez port
 * reguł K01B (`ustawRegulyKontrolera`, ustawiany przez kontroler), nie przez ten moduł.
 *
 * Granice: produkcyjny wywołujący (panel miasta, blok 9 / `renderOkolicaPanel` …) NIE istnieje — podpięcie = K09 (NIE_ZROBIONE).
 * Wartości pól cfg (`getEmpireFoodTick`, `getMaxSafePoziomRacji`, …) podłącza host przez `K05bCfg` (`k05b-host.ts`), nie tutaj.
 */
import { setK08eDeps, type K08eDeps } from '../ui/cityPanel/k08e-deps';

/** Reguły gry K08E dostarczane przez wywołującego (silnik / kontroler). */
export interface K08eRuleHost {
  /** Pin `buildRationParams(econParams, difficulty)` (`game/population-growth-v85.ts:141`). */
  buildRationParams(econParams: unknown, difficulty: string): ReturnType<K08eDeps['buildRationParams']>;
  /** Pin `cityLudnoscAbsolutna(population, epoch)` (`game/manpower.ts`). */
  cityLudnoscAbsolutna(population: number, epoch: number): number;
}

/** Podłącza delegaty K08E. Wywoływać raz przy starcie UI panelu miasta (po `ustawRegulyKontrolera`). */
export function installK08eWiring(rules: K08eRuleHost): void {
  setK08eDeps({
    buildRationParams: (econParams, difficulty) => rules.buildRationParams(econParams, difficulty),
    cityLudnoscAbsolutna: (population, epoch) => rules.cityLudnoscAbsolutna(population, epoch),
  });
}
