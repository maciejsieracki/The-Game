/**
 * controller/k07bWiring.ts — podłączenie kawałka K07B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K07B-Q1, runda 3, zadanie dodatkowe dispatchu).
 *
 * Trzy elementy:
 *   1. `mapCityK07` — adapter `CityRefDto → CityK07` (K07B-Z7). Pola DTO mapowane 1:1; pola pinu spoza DTO
 *      (`oblegane`) pozostają nieobecne (NIE_ZMIERZONO w DTO — brak pola w `viewmodel/types.ts`).
 *   2. `chipDeltaStockHtmlK07` — wiernik pinu `buildChipDeltaStockHtml` (`gra/src/game/empire-hud-totals.ts:90`, DOM-free)
 *      dla delegatu `chipDeltaStockHtml` K07A (K07A-Z2). Porównanie z prawdziwą funkcją pinu: harness `run-k07b-units.mjs`.
 *   3. `installK07bWiring` — ustawia `setK07aDeps` i `setK07bDeps`. Każdy delegat K07B dostaje wartość z jednego z trzech
 *      źródeł (w tej kolejności): usługi wstrzyknięte przez wywołującego (`services`), realna implementacja v2 dla
 *      funkcji bez zależności spoza v2 (`V2_REAL`), atrapa `MOCK_K07B_FNS` (stałe wartości, bez obliczeń).
 *      Zwracana lista `missing` = brakujące delegaty (cel: pusta — brak wyjątków `dep()` przy wywołaniu jednostek).
 *
 * Granice (P5.13): mapper i atrapy NIC nie liczą; reguły gry (`cityPracaSplit`, `resolveCityHealth`, `resolveOrderState`,
 * `loadOrderParams`, `growthGainPerTurnSlots`, …) przychodzą z `services` (kontroler / silnik) albo z atrapy.
 * Produkcyjny wywołujący (panel miasta, blok 9) NIE istnieje — podpięcie = K09 (NIE_ZROBIONE).
 */
import { setK07aDeps, type CityK07, type K07aDeps } from '../ui/cityPanel/k07a-fundament';
import {
  K07B_FN_NAMES,
  k07bMissingDeps,
  setK07bDeps,
  type K07bDeps,
} from '../ui/cityPanel/k07b-deps';
import { el } from '../ui/cityPanel/k01b-dom';
import { cityPanelChipIconWrap, tury } from '../ui/cityPanel/k01a-fundament';
import { rangeName } from '../ui/cityPanel/k05a-fundament';
import { szLinesDoWyswietlenia } from '../ui/cityPanel/k01b-t';
import { orderBandEffectShort } from '../ui/cityPanel/k01b-r';
import { orderTierUi } from '../ui/orderPanel';
import { resourceTextClass } from '../ui/resourceColors';
import { isCityUxFrameOpen } from '../ui/cityUxFrame';
import type { CityRefDto } from '../viewmodel/types';

export type K07bFn = (...args: any[]) => any;
/** Nazwa delegatu K07B (funkcja `dep(…)`). */
export type K07bDepName = (typeof K07B_FN_NAMES)[number];

/** K07B-Z7: adapter DTO → `CityK07` (pola czytane przez jednostki K07B/K07A). */
export function mapCityK07(c: CityRefDto): CityK07 {
  return { id: String(c.id), ownerId: c.owner, name: c.name, population: c.population };
}

/* ─── Wiernik `buildChipDeltaStockHtml` (pin `gra/src/game/empire-hud-totals.ts:60-99`) ──────────────────────────── */

/** Pin `fmtChipRate` (`empire-hud-totals.ts:66-71`): kopia 1:1 (bez zmian logiki). */
function fmtChipRateK07(n: number): { html: string; cls: string } {
  if (n === 0) return { html: '', cls: '' };
  const cls = n > 0 ? 'green' : 'red';
  const html = n > 0 ? `+${n}` : String(n);
  return { html, cls };
}

/** Pin `buildChipDeltaStockHtml` (`empire-hud-totals.ts:90-99`): kopia 1:1, dla delegatu `chipDeltaStockHtml` K07A. */
export function chipDeltaStockHtmlK07(civRate?: number, civStock?: number): string {
  const d = civRate !== undefined ? fmtChipRateK07(Math.round(civRate)) : { html: '', cls: '' };
  const deltaHtml = d.html ? `<span class="civ-v-w3-chip-delta ${d.cls}">${d.html}</span>` : '';
  const stockHtml = civStock !== undefined ? `<span class="civ-v-w3-chip-stock">(${Math.round(civStock)})</span>` : '';
  return deltaHtml + stockHtml;
}

/* ─── Wejścia danych (kontroler / DTO) ─────────────────────────────────────────────────────────────────────────────── */

/** Wartości z kontrolera: miasta (DTO), stolica, „moje” miasto, konfiguracja (`cfg` pinu, metody czytane przez K07B). */
export interface K07bDataProvider {
  /** pin `cfg.getCities?.() ?? []` (`:10725`). */
  getCities(): readonly CityRefDto[];
  /** pin `cfg.getCapitalCityId?.(ownerId) ?? null` (`:10720`). */
  getCapitalCityId(ownerId: number): string | null;
  /** pin `cfg.isMe?.(ownerId) ?? (ownerId === 0)` (`:617-619`) — fallback liczy wiring. */
  isMe?(ownerId: number): boolean;
  /** pin `!cfg.onSetCapital` (`:10724`). */
  canSetCapital: boolean;
  /** pin `cfg` (metody czytane przez K07B; brakujące = atrapa `MOCK_K07B_CFG`). */
  cfg: Record<string, any>;
  /** pin `gameData()` (`:626`) — dane statyczne gry (wartość, nie reguła). */
  gameData(): unknown;
  /** pin `activeMap` (zmienna modułu, `:10118`) — mapa aktywna lub null. */
  activeMap(): unknown;
  /** pin `POR_BAND_LABELS` (stała pasm porządku). */
  porBandLabels?: Record<string, string>;
}

/** Usługi (reguły i sterowanie) wstrzykiwane przez wywołującego; brakujące → atrapa/realna implementacja. */
export type K07bServices = Partial<Record<K07bDepName, K07bFn>>;

/* ─── Atrapy (MOCK): stałe wartości, bez obliczeń ─────────────────────────────────────────────────────────────────── */

/** Atrapa `cfg` (pusta: metody zwracają `undefined`; wartości liczbowe 0 tam, gdzie kod czyta je wprost). */
export const MOCK_K07B_CFG: Record<string, any> = {
  difficulty: 'normal',
  getCultureState: () => undefined,
  getEmpireFoodTick: () => undefined,
  getMaxSafePoziomRacji: () => undefined,
  getBudowaState: () => undefined,
  getCityWorkedRange: () => undefined,
  getEpoch: () => 0,
  getOkolicaState: () => undefined,
  getOrderState: () => undefined,
  getTreasury: () => 0,
  getUnitsAt: () => [],
  getUnlockedTechs: () => [],
  getWorkedTiles: () => [],
};

/** Atrapy delegatów: wartości neutralne (puste listy, `undefined`, zera). Nie liczą reguł. */
export const MOCK_K07B_FNS: Record<K07bDepName, K07bFn> = Object.fromEntries(
  K07B_FN_NAMES.map((n) => [n, (..._a: unknown[]) => undefined]),
) as Record<K07bDepName, K07bFn>;
MOCK_K07B_FNS.activeMap = () => null;
MOCK_K07B_FNS.gameData = () => null;
MOCK_K07B_FNS.resolveCityHealth = () => ({ total: 0, lines: [], fromEngine: false });
// K07B-Z8 (obrona r3): neutralne KSZTAŁTY zwrotów, bez liczenia reguł — jednostki destrukturyzują/czytają pola.
// Bez tego `renderSpoleczenstwo` (`const { state, fromEngine } = resolveOrderState(…)`) i `renderProd` (`getProd(…).kolejka`)
// rzucają TypeError na domyślnych atrapach (smoke sekcja D run-k07b-units.mjs). Pusty stan = „brak danych”, badge PH.
MOCK_K07B_FNS.resolveOrderState = () => ({ state: {}, fromEngine: false });
MOCK_K07B_FNS.getProd = () => ({ kolejka: [], wstrzymana: false });
MOCK_K07B_FNS.buildableProduction = () => [];
MOCK_K07B_FNS.renderBuildList = () => undefined;
MOCK_K07B_FNS.el = (tag: string, cls?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
};

/** Realne implementacje v2 dla funkcji bez zależności spoza v2 (K01/K05/resourceColors/cityUxFrame). */
const V2_REAL: Partial<Record<K07bDepName, K07bFn>> = {
  el: (tag: any, cls?: string, html?: string) => el(tag, cls, html),
  cityPanelChipIconWrap: (id: string, size?: number) => cityPanelChipIconWrap(id, size as any),
  tury: (n: number) => tury(n),
  rangeName: (R: number) => rangeName(R),
  szLinesDoWyswietlenia: (lines: any) => szLinesDoWyswietlenia(lines),
  orderBandEffectShort: (band: string) => orderBandEffectShort(band),
  orderTierUi: (s: any) => orderTierUi(s),
  resourceTextClass: (key: any) => resourceTextClass(key),
  isCityUxFrameOpen: () => isCityUxFrameOpen(),
};

/* ─── Instalacja ───────────────────────────────────────────────────────────────────────────────────────────────────── */

/** Mapper: wejścia danych K07B → `K07aDeps` (delegaty K07A: stolica, miasta, „moje”, chip W3). */
export function mapK07aDeps(data: K07bDataProvider): K07aDeps {
  return {
    isMe: (ownerId) => (data.isMe ? data.isMe(ownerId) : ownerId === 0),
    getCapitalCityId: (ownerId) => data.getCapitalCityId(ownerId) ?? null,
    getCities: () => data.getCities().map(mapCityK07),
    canSetCapital: data.canSetCapital,
    chipDeltaStockHtml: (civRate, civStock) => chipDeltaStockHtmlK07(civRate, civStock),
  };
}

/** Podłącza K07A i K07B. Zwraca listę brakujących delegatów K07B (cel: pusta). */
export function installK07bWiring(data: K07bDataProvider, services: K07bServices = {}): { missing: string[] } {
  setK07aDeps(mapK07aDeps(data));
  const cfg = { ...MOCK_K07B_CFG, ...data.cfg };
  const porBandLabels = data.porBandLabels ?? {};
  const deps: K07bDeps = {
    ...MOCK_K07B_FNS,
    ...V2_REAL,
    ...services,
    cfg,
    POR_BAND_LABELS: porBandLabels,
    gameData: () => data.gameData(),
    activeMap: () => data.activeMap(),
  };
  setK07bDeps(deps);
  return { missing: k07bMissingDeps(deps) };
}
