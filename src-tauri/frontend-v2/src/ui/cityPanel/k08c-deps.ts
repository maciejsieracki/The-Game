/**
 * k08c-deps.ts (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08C-Q1, runda 1): delegaty K08C dla funkcji pinu `edb8fb56`
 * (`gra/src/ui/cityPanel.ts`), których nie ma w porcie w kształcie pinu. Plik RĘCZNY (poza bramką kopii).
 *
 * Każdy delegat idzie przez `dep(nazwa)` z `k06b-deps.ts` (ten sam obiekt zależności co K06B, `setK06bDeps`).
 * Brak delegatu = wyjątek `K06B: brak delegatu <nazwa>` (cicha wartość domyślna jest zakazana).
 * Reguły gry NIE są tu liczone (P5.13): podział pracy idzie z DTO/silnika przez `controller/k08cWiring.ts`,
 * który składa `readPodzialPracy`/`cityPracaSplit` z portu K04B (`k04b-podzial.ts`) i `splitPraca` silnika.
 *
 * ZAŁOŻENIE K08C-Z1 (nazwy): nazwy delegatów = nazwy funkcji pinu (`readPodzialPracy`, `cityPracaSplit`,
 * `procentPuliImperiumZBudynkow`, `computeView`), żeby ciała kopii pinu były bajt w bajt z pinem.
 */
import { dep } from './k06b-deps';
import { clampPodzialPracyBudynkiPercentK04b, type PodzialPracyBounds } from './k04b-podzial';
import type { PodzialPracySplit } from './k01a-fundament';
import type { City, GameData } from './k05b-host';
import type { CityView } from './k01b-t';
import type { GameMap } from './k05a-fundament';

/** Wynik pinowego `cityPracaSplit` (pin :1361-1377) — pola czytane przez jednostki K08C. */
export interface PracaSplitK08c {
  readonly total: number;
  readonly doBudynkow: number;
  readonly doPuli: number;
  readonly pctBudynki: number;
  readonly pctPuli: number;
}

/** Pin :1022-1033 `readPodzialPracy(city, data)`; delegat (wiring: `k04b-podzial.readPodzialPracyK04b`). */
export const readPodzialPracy = (city: City, data: GameData | null): PodzialPracySplit =>
  dep('readPodzialPracy')(city, data) as PodzialPracySplit;

/** Pin :1361-1377 `cityPracaSplit(city, view, data)`; delegat (wiring: `k04b-podzial.cityPracaSplitK04b`). */
export const cityPracaSplit = (city: City, view: CityView, data: GameData | null): PracaSplitK08c =>
  dep('cityPracaSplit')(city, view, data) as PracaSplitK08c;

/** Pin :557-559 `procentPuliImperiumZBudynkow(procentBudynki)` (dopełnienie do 100 po clampie). */
export const procentPuliImperiumZBudynkow = (procentBudynki: number | undefined | null): number =>
  dep('procentPuliImperiumZBudynkow')(procentBudynki) as number;

/** Pin `computeView(city, map, data)` (widok miasta z silnika); delegat z kontrolera (K08C-Z2: nie liczony w UI). */
export const computeView = (city: City, map: GameMap, data: GameData): CityView | null =>
  dep('computeView')(city, map, data) as CityView | null;

/** K08C-Z5: granice suwaka podziału pracy (pin `game/cities.ts:456-457`: MIN 50, MAX 100) — stała wartość DTO. */
export const K08C_PODZIAL_PRACY_BOUNDS: PodzialPracyBounds = { min: 50, max: 100 };

/** Pin `game/cities.ts:456` `MIN_PODZIAL_PRACY_BUDYNKI_PERCENT`. */
export const MIN_PODZIAL_PRACY_BUDYNKI_PERCENT = K08C_PODZIAL_PRACY_BOUNDS.min;
/** Pin `game/cities.ts:457` `MAX_PODZIAL_PRACY_BUDYNKI_PERCENT`. */
export const MAX_PODZIAL_PRACY_BUDYNKI_PERCENT = K08C_PODZIAL_PRACY_BOUNDS.max;
/** Pin `game/cities.ts:478` `MAX_PROCENT_PULI_IMPERIUM = 100 - MIN_PODZIAL_PRACY_BUDYNKI_PERCENT`. */
export const MAX_PROCENT_PULI_IMPERIUM = 100 - MIN_PODZIAL_PRACY_BUDYNKI_PERCENT;

/** Pin `game/cities.ts:545-551` `clampPodzialPracyBudynkiPercent` — ta sama reguła co K04B z granicami K08C. */
export const clampPodzialPracyBudynkiPercent = (n: number | undefined | null): number =>
  clampPodzialPracyBudynkiPercentK04b(n, K08C_PODZIAL_PRACY_BOUNDS);

/** Nazwy delegatów K08C (do raportu brakujących w `k08cWiring`). */
export const K08C_FN_NAMES = ['readPodzialPracy', 'cityPracaSplit', 'procentPuliImperiumZBudynkow', 'computeView'] as const;
