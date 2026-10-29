/**
 * controller/cityPanelWiring.ts — JEDEN punkt instalacji panelu miasta (P5-8 K09B, R-RUSTPORT-P5-8-CITYPANEL-K09B-Q1,
 * zadanie (1) dispatchu).
 *
 * `installCityPanelWiring(host)` wykonuje w jednej kolejności:
 *   1. `installK08cWiring`  — K08A (DOM/rerender tymczasowy), K05B host, K06B (delegaty K08C);
 *   2. K06B `clearPinnedDetail` (delegat DOM, dług K09B-D1 zamknięty tutaj);
 *   3. `installK06aWiring`  — cfg/deps K06A (zapytania z id przez `toEngineCityId`, zadanie (2));
 *   4. `installK07bWiring`  — K07B (cfg: hooki string-id opakowane `engineIdHook`) + K07A deps;
 *   5. `setK07aExt`         — adaptery K07A-Z4 (K09B-D2: części bez portu = głośny wyjątek, nie `undefined`);
 *   6. `installK08dWiring`  — delegaty reguł K08D;
 *   7. `installK08eWiring`  — delegaty reguł K08E;
 *   8. `installK09aWiring`  — DOM ramki/HUD, haki K09A, NADPISUJE `rerender` K08A (musi być PO kroku 1, K09A-Z1);
 *   9. opakowanie `showCityUxFrame` (ZAŁOŻENIE K09B-Z1, patrz `cityPanelUxImpl`);
 *  10. `registerCityPanelUx` — rejestracja implementacji mostu `cityPanelUxBridge.ts` (ZAŁOŻENIE P5.7-Z7).
 *
 * Reguły (P5.13): instalator NIE liczy reguł gry i NIE dostarcza własnych atrap. Wejścia przychodzą od wywołującego
 * (`CityPanelWiringHost`). Atrapy pozostające w jednostkach (K08C-Z5 `NEUTRAL`, K07B `MOCK_K07B_FNS`) są raportowane
 * w wyniku (`k08cStubbed`, `k07bMissing`). Brak wejścia wymaganego przez DOM nie jest zastępowany wartością domyślną.
 */
import { installK08cWiring, type K08cHostInputs, type K08cRuleServices, type K08cWiringResult } from './k08cWiring';
import { installK06aWiring, type K06aQueriesProvider, type K06aUiServices } from './k06aWiring';
import { installK07bWiring, type K07bDataProvider, type K07bServices } from './k07bWiring';
import { installK08dWiring, type K08dRuleHost } from './k08dWiring';
import { installK08eWiring, type K08eRuleHost } from './k08eWiring';
import { installK09aWiring, type K09aWiringHost } from './k09aWiring';
import { K06B_PORT_DELEGATES } from './cityPanelK06bDelegates';
import { engineIdHook, toEngineCityId } from './cityIdAdapter';
import { setK06bDeps } from '../ui/cityPanel/k06b-deps';
import { showEraBuildingPreview } from '../ui/cityPanel/k01a-fundament';
import { clearPinnedDetail as clearHoverPinnedDetail } from '../ui/hoverDetailDock';
import {
  getK06aState, headerOrderBadge as headerOrderBadgeK06, drawerTabButtons as drawerTabButtonsK06,
  navigateCityPanel as navigateK06a, type CityK06,
} from '../ui/cityPanel/k06a-fundament';
import { clearCityPanelUxMode as clearK08a } from '../ui/cityPanel/k08a-fundament';
import { paintCityPanelSections as paintK09a } from '../ui/cityPanel/k09a-paint';
import { requireK09aDeps, setK09aDeps } from '../ui/cityPanel/k09a-deps';
import { setK07aExt, type CityK07, type K07aCfg, type K07aExt } from '../ui/cityPanel/k07a-fundament';
import { daninaLabelForCity as daninaLabelK01 } from '../ui/cityPanel/k01b-t';
import { resolveEmpireSnapK } from '../ui/cityPanel/k04c-model';
import type { City } from '../ui/cityPanel/k05b-host';
import type { GameMap } from '../ui/cityPanel/k05a-fundament';
import { registerCityPanelUx, type CityPanelUxImpl } from '../ui/cityPanelUxBridge';

/** Wejścia całego panelu miasta (kontroler / DTO / silnik). Każde pole jest wymagane; brak = błąd typu. */
export interface CityPanelWiringHost {
  /** K08C: `cfg`, `rules` (K05B-Z8), wejścia DTO i `rerender` (tymczasowy, nadpisany przez K09A). */
  k08c: K08cHostInputs;
  /** K08C: usługi reguł K06B (brakujące → atrapy K08C-Z5, raportowane w `k08cStubbed`). */
  k08cServices?: K08cRuleServices;
  /** K07A/K07B: dane kontrolera (miasta DTO, stolica, `cfg` pinu). */
  k07b: K07bDataProvider;
  /** K07B: usługi reguł (brakujące → atrapy, raportowane w `k07bMissing`). */
  k07bServices?: K07bServices;
  /** K06A: zapytania (id silnika = string) i usługi UI. */
  k06a: { queries: K06aQueriesProvider; ui: K06aUiServices };
  /** K08D: reguły gry (silnik / kontroler). */
  k08d: K08dRuleHost;
  /** K08E: reguły gry (silnik / kontroler). */
  k08e: K08eRuleHost;
  /** K09A: haki `cfg` pinu spoza `K05bCfg` (id portu = number). */
  k09a: K09aWiringHost;
}

/** Wynik instalacji: listy atrap pozostających w jednostkach (cel produkcyjny: pusto). */
export interface CityPanelWiringResult {
  readonly k08cStubbed: readonly string[];
  readonly k07bMissing: readonly string[];
}

/**
 * ZAŁOŻENIE K09B-Z1: `showCityUxFrame` (ramka) najpierw woła `hideCityUxFrame` → `clearCityPanelUxMode`, które zeruje
 * `activeMap` K06A, a dopiero potem malowanie. Pin przekazuje `map` jawnie; most v2 (`CityPanelUxImpl`) go nie przenosi.
 * Dlatego opakowanie `showCityUxFrame` zapamiętuje mapę PRZED wejściem w ramkę i tylko na czas pokazu. Malowanie
 * `paintK09a` przywraca stan K06A (`setK06aActive(city, map, onClose)`). Usunięcie tej luki = rozszerzenie sygnatury
 * mostu o `map` (poza allowlistą tego tematu: `ui/cityUxFrame.ts`, `ui/cityPanelUxBridge.ts`) — dług K09B-D3.
 */
let mapForPaintDuringShow: GameMap | null = null;

/**
 * Implementacja mostu `cityPanelUxBridge.ts`. Mapa: najpierw zapamiętana na czas pokazu (K09B-Z1), w pozostałych
 * przypadkach stan K06A. Brak mapy = wyjątek (pin zawsze ma mapę w tym miejscu; cicha wartość byłaby błędem).
 * Identyczność `CityRefDto` ↔ `City`: w v2 oba mają `id: number` (K08D-Z10 dotyczy wyłącznie id silnika, nie portu).
 */
export const cityPanelUxImpl: CityPanelUxImpl = {
  paintCityPanelSections(mounts, city, refresh, onClose) {
    const map = mapForPaintDuringShow ?? getK06aState().activeMap;
    if (map === null) {
      throw new Error('CityPanelWiring: brak mapy (K06A activeMap) przy malowaniu sekcji panelu miasta; showCityPanel musi ustawić mapę');
    }
    paintK09a(mounts, city as unknown as City, map, refresh, onClose);
  },
  clearCityPanelUxMode: () => clearK08a(),
  navigateCityPanel: (dir) => navigateK06a(dir),
};

/** Opakowanie zapytań K06A: id portu (number) → id silnika (string) na granicy (`toEngineCityId`). */
function k06aQueriesWithEngineIds(q: K06aQueriesProvider): K06aQueriesProvider {
  return {
    getOrderState: (cityId) => q.getOrderState(toEngineCityId(cityId)),
    getCities: () => q.getCities(),
    onOkolicaTileAdjust: q.onOkolicaTileAdjust
      ? (cityId, qq, rr, delta) => q.onOkolicaTileAdjust?.(toEngineCityId(cityId), qq, rr, delta)
      : undefined,
  };
}

/** Hooki `cfg` K07A/K07B typowane `(cityId: string)` w pinie: opakowanie id na granicy (zadanie (2)). */
const K07_ENGINE_ID_HOOKS = ['getOrderState', 'getReligionState', 'getManpowerSnapshot', 'getMaxSafePoziomRacji'] as const;
function k07bCfgWithEngineIds(cfg: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...cfg };
  for (const key of K07_ENGINE_ID_HOOKS) {
    const fn = cfg[key];
    if (typeof fn === 'function') out[key] = engineIdHook(fn as (cityId: string, ...rest: unknown[]) => unknown);
  }
  return out;
}

/** Pobranie funkcji z `cfg` (pin: `cfg.x?.()`): brak = `undefined` (gałąź pinu pominięta), nie wartość domyślna. */
function cfgFn<T>(cfg: Record<string, unknown>, name: string): T | undefined {
  const f = cfg[name];
  return typeof f === 'function' ? (f as T) : undefined;
}

/** `GameData` z K05B (wejście reguł K08C/K08E). */
type GameDataK05b = NonNullable<Parameters<K08cHostInputs['readPodzialHandlu']>[1]>;

/** Delegat K07A bez portu w v2: głośny błąd z nazwą długu (nie `undefined`, nie cicha wartość). */
function niePodpiete(name: string, dlug: string): (...args: unknown[]) => never {
  return () => {
    throw new Error(`CityPanelWiring: ${name} nie jest jeszcze podpięte w v2 (dług ${dlug})`);
  };
}

/** Adaptery K07A-Z4 (`setK07aExt`) z wejść hosta i portów K06A/K01B/K04C. Bez reguł gry (P5.13). */
function buildK07aExt(host: CityPanelWiringHost, cfgRec: Record<string, unknown>): K07aExt {
  const cfg: K07aCfg = {
    getEpoch: cfgFn<NonNullable<K07aCfg['getEpoch']>>(cfgRec, 'getEpoch'),
    getMaxSafePoziomRacji: cfgFn<NonNullable<K07aCfg['getMaxSafePoziomRacji']>>(cfgRec, 'getMaxSafePoziomRacji'),
    getReligionState: cfgFn<NonNullable<K07aCfg['getReligionState']>>(cfgRec, 'getReligionState'),
    getManpowerSnapshot: cfgFn<NonNullable<K07aCfg['getManpowerSnapshot']>>(cfgRec, 'getManpowerSnapshot'),
    getTreasury: cfgFn<NonNullable<K07aCfg['getTreasury']>>(cfgRec, 'getTreasury'),
    getOrderState: cfgFn<NonNullable<K07aCfg['getOrderState']>>(cfgRec, 'getOrderState'),
  };
  const k08c = host.k08c;
  return {
    cfg,
    isMeCity: (ownerId) => k08c.isMeCity(ownerId),
    ownerCities: (city) => host.k08e.ownerCities(city as unknown as City) as unknown as CityK07[],
    cityPanelTitle: (city) => host.k08e.cityPanelTitle(city as unknown as City),
    headerOrderBadge: (city) => headerOrderBadgeK06(city as unknown as CityK06),
    drawerTabButtons: () => drawerTabButtonsK06(),
    formatManpower: (n) => k08c.rules.formatManpower(n),
    daninaLabelForCity: (city) => daninaLabelK01(city as unknown as Parameters<typeof daninaLabelK01>[0]) as unknown as string,
    resolveEmpireSnap: (city, _map, _data) =>
      resolveEmpireSnapK(k08c.getEmpireHud?.(city.ownerId), k08c.cfg.getTreasury?.(city.ownerId) ?? undefined),
    // Brak portu w v2 (dług K09B-D2): pin `cityPracaSplit` (K04B/K08C) — podział pracy dla K07A.
    cityPracaSplit: niePodpiete('K07A cityPracaSplit', 'K09B-D2'),
    // Typy `GameData` K05A (`k05a-fundament`) i K05B (`k05b-host`) są rozbieżne (dług K09B-D5): seam jawny.
    readPodzialHandlu: (city, data) => k08c.readPodzialHandlu(city as unknown as City, data as unknown as GameDataK05b),
    // Brak portu w v2 (dług K09B-D2): `game/empire-hud-totals` nie istnieje w `src/` (pin: `civWideSixStatsFromEmpireSnap`).
    civWideSixStatsFromEmpireSnap: niePodpiete('civWideSixStatsFromEmpireSnap', 'K09B-D2') as K07aExt['civWideSixStatsFromEmpireSnap'],
    resolveOrderState: (city, data) =>
      host.k08e.resolveOrderState(city as unknown as City, data as unknown as GameDataK05b) as unknown as ReturnType<K07aExt['resolveOrderState']>,
  };
}

/** Podłącza cały panel miasta. Wywoływać raz przy starcie UI (jeden punkt wejścia, zadanie (1)). */
export function installCityPanelWiring(host: CityPanelWiringHost): CityPanelWiringResult {
  const k08c: K08cWiringResult = installK08cWiring(host.k08c, host.k08cServices);
  // K06B: delegaty z kopii portu (wygenerowane, K09B-Z2) + DOM kasowania przypiętego szczegółu.
  // K09B-Z3: `getShowEraBuildingPreview` = odczyt żywego stanu k01a (`export let showEraBuildingPreview`).
  setK06bDeps({
    ...K06B_PORT_DELEGATES,
    clearPinnedDetail: () => clearHoverPinnedDetail(),
    getShowEraBuildingPreview: () => showEraBuildingPreview,
  });
  installK06aWiring(k06aQueriesWithEngineIds(host.k06a.queries), host.k06a.ui);
  const cfgRec = k07bCfgWithEngineIds(host.k07b.cfg);
  const k07b = installK07bWiring({ ...host.k07b, cfg: cfgRec }, host.k07bServices);
  setK07aExt(buildK07aExt(host, cfgRec));
  installK08dWiring(host.k08d);
  installK08eWiring(host.k08e);
  installK09aWiring(host.k09a);
  // ZAŁOŻENIE K09B-Z1: opakowanie `showCityUxFrame` zapamiętuje mapę przed wejściem w ramkę.
  const k09a = requireK09aDeps();
  setK09aDeps({
    ...k09a,
    showCityUxFrame: (city, paint, onClose) => {
      mapForPaintDuringShow = getK06aState().activeMap;
      try {
        k09a.showCityUxFrame(city, paint, onClose);
      } finally {
        mapForPaintDuringShow = null;
      }
    },
  });
  registerCityPanelUx(cityPanelUxImpl);
  return { k08cStubbed: k08c.stubbed, k07bMissing: k07b.missing };
}
