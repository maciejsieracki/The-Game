/**
 * controller/k08cWiring.ts — wiring K08C (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08C-Q1, runda 1, zadanie 1 dispatchu).
 *
 * Podłącza trzy wejścia, o które prosi K08B-Z7/K08B-Z2 (`P5-8-K08B.md` §7f-§8) i K08C:
 *   1. `setK08aDeps` — DOM i rerender (K08A-Z2): `rerender` z hosta; `clearGarrisonPanel`, `disposeHoverDetailDock`,
 *      `isCityUxFrameOpen` = REALNE funkcje portu (`k06b-garnizon`, `ui/hoverDetailDock`, `ui/cityUxFrame`).
 *   2. `setK05bHost` — `cfg` (wejścia DTO, `getBuiltBuildingIds`, `getCities`), `readPodzialHandlu`, `isMeCity`, …,
 *      `rules` (reguły gry K05B-Z8). `rules` wchodzi od wywołującego (silnik/kontroler), NIE jest tu wymyślane.
 *   3. `setK06bDeps` — delegaty K06B-Z2 używane przez K08C: podział pracy (`readPodzialPracy`, `cityPracaSplit`,
 *      `procentPuliImperiumZBudynkow`, `computeView`) składany z portu K04B (`k04b-podzial.ts`, DTO, bez `game/`) oraz
 *      szóstka delegatów `k08b-deps.ts` (`sumOwnedBuildingsUpkeep`, `groupBuiltBuildingIds`,
 *      `appendRecruitMilitaryResourceStrip`, `purchasableUnits`, `sortByUnitPowerDescending`, `getUnitDef`).
 *
 * Reguła (P5.13, K08C-Z5): wiring NIE liczy reguł gry. Pięć delegatów regułowych (`sumOwnedBuildingsUpkeep`,
 * `groupBuiltBuildingIds`, `appendRecruitMilitaryResourceStrip`, `purchasableUnits`, `sortByUnitPowerDescending`)
 * dostaje wartość z `services` (silnik) albo NEUTRALNĄ ATRAPĘ bez obliczeń (zwraca `undefined`/`[]`/no-op). Każda
 * atrapa jest w zwracanym `stubbed` — caller (K09) musi ją zastąpić przed produkcją (NIE_ZROBIONE, K09).
 * `getUnitDef` (odczyt z danych statycznych) ma realną implementację: `data.units.find(id)`.
 *
 * Granice: produkcyjny wywołujący (panel miasta, blok 9) NIE istnieje — podpięcie = K09 (NIE_ZROBIONE).
 */
import { setK08aDeps } from '../ui/cityPanel/k08a-fundament';
import { setK05bHost, type City, type GameData, type K05bCfg, type K05bRules } from '../ui/cityPanel/k05b-host';
import { setK06bDeps } from '../ui/cityPanel/k06b-deps';
import {
  cityPracaSplitK04b, procentPuliImperiumZBudynkowK04b, readPodzialPracyK04b,
  type PodzialPracaSplitDto, type PodzialPracyBounds, type PodzialPracySources,
} from '../ui/cityPanel/k04b-podzial';
import { clearGarrisonPanel } from '../ui/cityPanel/k06b-garnizon';
import { disposeHoverDetailDock } from '../ui/hoverDetailDock';
import { isCityUxFrameOpen } from '../ui/cityUxFrame';
import type { CityView } from '../ui/cityPanel/k01b-t';
import type { GameMap } from '../ui/cityPanel/k05a-fundament';
import type { PodzialHandluSplit } from '../ui/cityPanel/k01a-fundament';

/** K08C-Z5: granice suwaka podziału pracy (pin `game/cities.ts:456-457`: MIN 50, MAX 100) — stała wartość DTO. */
export const K08C_PODZIAL_PRACY_BOUNDS: PodzialPracyBounds = { min: 50, max: 100 };

/** Wejścia hosta K08C (kontroler / DTO / silnik). Wszystko wstrzykiwane; wiring nie wymyśla reguł. */
export interface K08cHostInputs {
  /** Pin `rerender()` (blok K09). */
  rerender(): void;
  /** `cfg` pinu (metody DTO); `getBuiltBuildingIds`, `getCities` są czytane przez jednostki K08B/K08C. */
  cfg: K05bCfg;
  /** Pin `cfg.getPodzialPracy?.(city.id)` — hook z DTO (gdy wypełniony). */
  getPodzialPracy?(cityId: number): { readonly procentBudynki: number } | undefined;
  /** Pin `buildEconParams(data).suwaakPracaBudynki` — parametr silnika (wartość, nie reguła). */
  engineSuwaakPracaBudynki(data: GameData | null): number | null;
  /** Pin `splitPraca(praca, frac)` (`game/production.ts:2068-2073`) — podział z silnika dla danego udziału. */
  splitPraca(praca: number, frac: number): PodzialPracaSplitDto;
  /** Pin `computeView(city, map, data)` — widok miasta z silnika. */
  computeView(city: City, map: GameMap, data: GameData): CityView | null;
  readPodzialHandlu(city: City, data: GameData | null): PodzialHandluSplit;
  isMeCity(ownerId: number): boolean;
  adjustHandelSplit(split: PodzialHandluSplit, key: keyof PodzialHandluSplit, value: number): PodzialHandluSplit;
  freshWealthState(): { readonly poziom: number };
  stockResourceLabel(key: string): string;
  /** Reguły gry K05B-Z8 — dostarcza silnik/kontroler (wiring ich nie implementuje). */
  rules: K05bRules;
}

/** Usługi regułowe K06B (silnik); brakujące = neutralna atrapa (zob. `stubbed`). */
export interface K08cRuleServices {
  sumOwnedBuildingsUpkeep?: (...args: unknown[]) => unknown;
  groupBuiltBuildingIds?: (...args: unknown[]) => unknown;
  appendRecruitMilitaryResourceStrip?: (...args: unknown[]) => unknown;
  purchasableUnits?: (...args: unknown[]) => unknown;
  sortByUnitPowerDescending?: (units: unknown, key: (u: unknown) => unknown) => unknown;
}

/** Nazwy delegatów K06B, które wiring K08C dostarcza (szóstka `k08b-deps.ts`). */
export const K08C_K06B_NAMES = [
  'sumOwnedBuildingsUpkeep', 'groupBuiltBuildingIds', 'appendRecruitMilitaryResourceStrip',
  'purchasableUnits', 'sortByUnitPowerDescending', 'getUnitDef',
] as const;

/** Neutralne atrapy (K08C-Z5): wartości bez obliczeń reguł. */
const NEUTRAL: Record<Exclude<keyof K08cRuleServices, never>, (...args: any[]) => unknown> = {
  sumOwnedBuildingsUpkeep: () => undefined,
  groupBuiltBuildingIds: () => [],
  appendRecruitMilitaryResourceStrip: () => undefined,
  purchasableUnits: () => [],
  sortByUnitPowerDescending: (units: unknown) => (Array.isArray(units) ? [...units] : []),
};

/** Źródła podziału pracy miasta (pin :1022-1030 kolejność: hook → zapis → parametr silnika). */
function podzialSources(h: K08cHostInputs, city: City, data: GameData | null): PodzialPracySources {
  const ext = city as unknown as { podzialPracy?: { procentBudynki: number }; podziałPracy?: { procentBudynki: number } };
  return {
    hook: h.getPodzialPracy?.(city.id) ?? null,
    stored: ext.podzialPracy ?? ext.podziałPracy ?? null,
    engineParam: h.engineSuwaakPracaBudynki(data),
  };
}

/** Wynik instalacji: nazwy delegatów na atrapach (cel produkcyjny: pusta lista, po K09). */
export interface K08cWiringResult {
  readonly stubbed: readonly string[];
}

/** Podłącza K08A (DOM/rerender), K05B (host) i K06B (delegaty K08C). Wywoływać raz przy starcie UI panelu miasta. */
export function installK08cWiring(h: K08cHostInputs, services: K08cRuleServices = {}): K08cWiringResult {
  setK08aDeps({
    rerender: () => h.rerender(),
    clearGarrisonPanel: () => clearGarrisonPanel(),
    disposeHoverDetailDock: () => disposeHoverDetailDock(),
    isCityUxFrameOpen: () => isCityUxFrameOpen(),
  });

  setK05bHost({
    cfg: h.cfg,
    readPodzialHandlu: (city, data) => h.readPodzialHandlu(city, data),
    isMeCity: (ownerId) => h.isMeCity(ownerId),
    adjustHandelSplit: (split, key, value) => h.adjustHandelSplit(split, key, value),
    freshWealthState: () => h.freshWealthState(),
    stockResourceLabel: (key) => h.stockResourceLabel(key),
    rerender: () => h.rerender(),
    rules: h.rules,
  });

  const stubbed: string[] = [];
  const rule = (name: keyof K08cRuleServices): ((...args: any[]) => unknown) => {
    const svc = services[name];
    if (typeof svc === 'function') return svc as (...args: any[]) => unknown;
    stubbed.push(name);
    return NEUTRAL[name];
  };

  const bounds = K08C_PODZIAL_PRACY_BOUNDS;
  setK06bDeps({
    readPodzialPracy: (city: City, data: GameData | null) => readPodzialPracyK04b(podzialSources(h, city, data), bounds),
    cityPracaSplit: (city: City, view: CityView, data: GameData | null) => {
      const src = podzialSources(h, city, data);
      const pct = readPodzialPracyK04b(src, bounds).procentBudynki;
      return cityPracaSplitK04b(h.splitPraca(view.praca, pct / 100), src, bounds);
    },
    procentPuliImperiumZBudynkow: (procentBudynki: number | undefined | null) =>
      procentPuliImperiumZBudynkowK04b(procentBudynki, bounds),
    computeView: (city: City, map: GameMap, data: GameData) => h.computeView(city, map, data),
    sumOwnedBuildingsUpkeep: rule('sumOwnedBuildingsUpkeep'),
    groupBuiltBuildingIds: rule('groupBuiltBuildingIds'),
    appendRecruitMilitaryResourceStrip: rule('appendRecruitMilitaryResourceStrip'),
    purchasableUnits: rule('purchasableUnits'),
    sortByUnitPowerDescending: rule('sortByUnitPowerDescending'),
    // Odczyt z danych statycznych (bez reguł): `data.units` po id.
    getUnitDef: (data: GameData | null, id: string) => data?.units.find((u) => (u as { id: string }).id === id),
  });

  return { stubbed };
}
