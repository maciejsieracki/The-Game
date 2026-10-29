/**
 * K09A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K09A-Q1, runda 1): delegaty DOM i haki kontrolera dla jednostek orkiestracji
 * panelu miasta (pin `edb8fb56`, `gra/src/ui/cityPanel.ts`: `switchCity`, `rerender`, `renderCityIconRightRail`,
 * `renderOkolicaPanel`, `renderLeftPanelTab`, `renderRightPanelTab`, `paintCityPanelSections`, `showCityPanel`,
 * `hideCityPanel`).
 *
 * Reguła (P5.13): ten moduł NIE liczy reguł gry i NIE zawiera atrap. Efekty DOM ramki (`showCityUxFrame`,
 * `hideCityUxFrame`, `refreshCityUxFrame`), HUD (`setMapHudChromeSuppressed`), dok hover (`setHoverDetailDocks`)
 * i cięcie cyklu `hideCityPanel` (K09A-Z2) wchodzą przez `setK09aDeps` z wiringu (`controller/k09aWiring.ts`).
 * Brak `setK09aDeps` = wyjątek przy pierwszym wywołaniu DOM (pin zawsze wywołuje te funkcje).
 *
 * Haki `cfg` pinu, których nie ma w `K05bCfg` (`onSwitchCity`, `onRename`, `isAutoManageEnabled`, `onAutoManage`,
 * `onArtView`, `onOpenMapForOkolica`), są w `K09aHooks` (ZAŁOŻENIE K09A-Z3). Brak haku = gałąź pinu `?.` pomijana.
 */
import type { HoverDetailDockMounts } from '../hoverDetailDock';
import type { CityRefDto } from '../../viewmodel/types';
import type { City } from './k05b-host';

/** K09A-Z3: haki `cfg` pinu spoza `K05bCfg` (pin `cfg.onSwitchCity?.(id)` itd.; id = `City.id` v2, number). */
export interface K09aHooks {
  onSwitchCity?: (cityId: number) => void;
  onRename?: (cityId: number, name: string) => void;
  isAutoManageEnabled?: (cityId: number) => boolean;
  onAutoManage?: (cityId: number) => void;
  onArtView?: (cityId: number) => void;
  onOpenMapForOkolica?: (cityId: number) => void;
}

/** Delegaty DOM/ramki/HUD K09A. */
export interface K09aDeps {
  /** Pin `hideCityPanel()` (`cityPanel.ts:11964`); cięcie cyklu rerender↔paint (K09A-Z2): wstawiane przez wiring. */
  hideCityPanel: () => void;
  /** Pin `setHoverDetailDocks(...)` (`ui/hoverDetailDock`). */
  setHoverDetailDocks: (mounts: HoverDetailDockMounts | null) => void;
  /** Pin `setMapHudChromeSuppressed(on)` (`ui/hud`). */
  setMapHudChromeSuppressed: (suppressed: boolean) => void;
  /** Pin `showCityUxFrame(city, map, refresh, onClose)` — v2 bez `map` (K09A-Z4: mapa w stanie K06A). */
  showCityUxFrame: (city: CityRefDto, paint: () => void, onClose: () => void) => void;
  /** Pin `hideCityUxFrame()` (`ui/cityUxFrame`). */
  hideCityUxFrame: () => void;
  /** Pin `refreshCityUxFrame(city, map, refresh)` — v2 bez `map` (K09A-Z4). */
  refreshCityUxFrame: (city: CityRefDto, paint: () => void) => void;
}

let deps: K09aDeps | null = null;
let hooks: K09aHooks = {};

/** Instaluje delegaty K09A (wiring). */
export function setK09aDeps(next: K09aDeps | null): void {
  deps = next;
}

/** K09A-Z2: brak delegatów = wyjątek (cicha utrata efektu DOM byłaby błędem). */
export function requireK09aDeps(): K09aDeps {
  if (deps === null) throw new Error('K09A: brak setK09aDeps (DOM ramki/HUD — pin zawsze je wywołuje)');
  return deps;
}

/** Instaluje haki `cfg` pinu spoza `K05bCfg` (K09A-Z3). */
export function setK09aHooks(next: K09aHooks): void {
  hooks = next;
}

/** Odczyt haków K09A (pin: `cfg.onX?.(…)`). */
export function getK09aHooks(): K09aHooks {
  return hooks;
}

/** Konwencja portu: miasto panelu = `City` z `k05b-host` (id number). */
export type CityK09a = City;
