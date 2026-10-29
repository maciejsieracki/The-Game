/**
 * controller/k06aWiring.ts — podłączenie kawałka K06A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K06B-Q1, zadanie dodatkowe dispatchu).
 *
 * Mapper: wejścia kontrolera (`K06aQueriesProvider`, dziś atrapa `MOCK_K06A_QUERIES`) oraz wejścia UI (`K06aUiServices`)
 * → `K06aCfg` i `K06aDeps` (delegatory `setK06aCfg` / `setK06aDeps` w `ui/cityPanel/k06a-fundament.ts`).
 * Wartości reguł gry przychodzą z DTO / silnika (P5.13): mapper tylko przekazuje, niczego nie liczy.
 *
 * Stan K06A (akcesory `getK06aState`, `setK06aActive`, `setK06aPinnedGarrisonCityId`) re-eksportowany jako `k06aStateAccessors`.
 *
 * Granice: produkcyjny wywołujący (panel miasta, blok 9 `switchCity`/`cityTabs`) NIE istnieje — podpięcie = K09 (NIE_ZROBIONE).
 * Atrapa zwraca stałe wartości (MOCK), nie liczy niczego.
 */
import {
  getK06aState,
  setK06aActive,
  setK06aCfg,
  setK06aDeps,
  setK06aPinnedGarrisonCityId,
  type CityK06,
  type CityTabK06,
  type K06aCfg,
  type K06aDeps,
  type OrderStateK06,
  type TileYieldK06,
} from '../ui/cityPanel/k06a-fundament';

/** Wejścia danych dla K06A po stronie kontrolera (DTO / silnik). */
export interface K06aQueriesProvider {
  /** pin: `cfg.getOrderState` — stan porządku miasta z DTO. */
  getOrderState(cityId: string): OrderStateK06 | undefined;
  /** pin: `cfg.getCities` — lista miast z DTO (filtrowana po właścicielu w K06A). */
  getCities(): readonly CityK06[] | undefined;
  /** pin: `cfg.onOkolicaTileAdjust` — komenda zmiany kafla okolicy (opcjonalna). */
  onOkolicaTileAdjust?(cityId: string, q: number, r: number, delta: number): void;
}

/** Usługi UI, z których K06A bierze delegaty (blok 1 i 9 pinu — poza K06A). */
export interface K06aUiServices {
  cityPanelChipIconWrap(name: string, px: number): string;
  tileYield(tile: Parameters<K06aDeps['tileYield']>[0]): TileYieldK06;
  formatCityMapLabel(city: CityK06): string;
  axialToWorld(q: number, r: number, R: number): { x: number; z: number };
  cityTabs(): readonly CityTabK06[];
  activeDrawerTab(): string;
  cityTabIconHtml(tabId: string): string;
  switchCity(dir: -1 | 1): void;
}

/** Mapper: wejścia kontrolera → `K06aCfg`. Funkcje opakowane, żeby K06A nie dostał referencji metod bez `this`. */
export function mapK06aCfg(q: K06aQueriesProvider): K06aCfg {
  return {
    getOrderState: (cityId) => q.getOrderState(cityId),
    getCities: () => q.getCities(),
    onOkolicaTileAdjust: q.onOkolicaTileAdjust
      ? (cityId, qq, rr, delta) => q.onOkolicaTileAdjust?.(cityId, qq, rr, delta)
      : undefined,
  };
}

/** Mapper: usługi UI → `K06aDeps` (kształt identyczny; osobna funkcja = jedno miejsce kontroli zgodności). */
export function mapK06aDeps(u: K06aUiServices): K06aDeps {
  return {
    cityPanelChipIconWrap: (name, px) => u.cityPanelChipIconWrap(name, px),
    tileYield: (tile) => u.tileYield(tile),
    formatCityMapLabel: (city) => u.formatCityMapLabel(city),
    axialToWorld: (q, r, R) => u.axialToWorld(q, r, R),
    cityTabs: () => u.cityTabs(),
    activeDrawerTab: () => u.activeDrawerTab(),
    cityTabIconHtml: (tabId) => u.cityTabIconHtml(tabId),
    switchCity: (dir) => u.switchCity(dir),
  };
}

/** Podłącza K06A: ustawia `cfg` i `deps` modułu. Wywoływać raz przy starcie UI panelu miasta. */
export function installK06aWiring(q: K06aQueriesProvider, u: K06aUiServices): void {
  setK06aCfg(mapK06aCfg(q));
  setK06aDeps(mapK06aDeps(u));
}

/** Akcesory stanu K06A (K06A-Z7) — jedyne miejsce, przez które kontroler/UI zmienia stan panelu miasta. */
export const k06aStateAccessors = {
  getState: getK06aState,
  setActive: setK06aActive,
  setPinnedGarrisonCityId: setK06aPinnedGarrisonCityId,
} as const;

/** Atrapa wejść danych K06A (MOCK): stałe wartości, bez obliczeń. */
export const MOCK_K06A_QUERIES: K06aQueriesProvider = {
  getOrderState: () => ({ szPct: 0, porPct: 0, revoltWarning: false }),
  getCities: () => [],
};

export function createMockK06aQueries(): K06aQueriesProvider {
  return {
    getOrderState: MOCK_K06A_QUERIES.getOrderState,
    getCities: MOCK_K06A_QUERIES.getCities,
  };
}
