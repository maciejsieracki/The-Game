/**
 * tools/dom-harness/k09b-fixture.ts — fikstura miasta dla `run-k09b-wiring.mjs` (P5-8 K09B, runda 2, poprawka zarzutu 2).
 * Typ z `viewmodel/types.ts` (`CityRefDto`), nie ad hoc. Kontrola typów: `tsc --noEmit` z tym plikiem
 * (patrz P5-8-K09B.md §9). Wartości celowo niepodobne do neutralnych atrap hosta.
 */
import type { CityRefDto } from '../../src/viewmodel/types';

export const CITY_FIXTURE: CityRefDto = {
  id: 7,
  owner: 3,
  q: 4,
  r: -2,
  name: 'Miasto-K09B',
  mapLabel: 'K09B',
  population: 11,
  isCapital: true,
  isMine: true,
};
