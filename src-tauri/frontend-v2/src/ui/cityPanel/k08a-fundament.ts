/**
 * K08A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08A-Q1, runda 1): jednostki K08 (Handel, magazyn, panel prawy) bez DOM —
 * 15 z 39 jednostek bloku K08 (pin `edb8fb56`, `gra/src/ui/cityPanel.ts`): 10 nie-DOM (r2) + 5 o zależnościach
 * stanu modułu/kontrolera (r3, adaptery K08A-Z2/Z3).
 *
 * PLIK GENEROWANY przez `tools/dom-harness/gen-k08a-port.mjs` (bloki jednostek = pin + `k08a-subs.mjs`).
 * Edycja ręczna bloku `// pin edb8fb56 …` … `// pin-end` = FAIL bramki `verify-k08a-copies.mjs`.
 *
 * Jednostki r2: CityPanelIconTab, CityPanelProductionTab, CityPanelCityParamTab, CITY_PANEL_ICONS_LEFT,
 * CITY_PANEL_ICONS_RIGHT, isProductionPanelTab, CADUCEUS_SVG, cityRailIconHtml, activeCityPanelTab, isCityPanelOpen.
 * Jednostki r3: refreshCityPanelIfOpen, clearCityPanelUxMode, closeCityView, closeCityPanelIfOpen, getOpenCityPanelCityId.
 * NIEPORTOWANE: 24 jednostki DOM (1 324 LOC) → K08B (osobny temat).
 *
 * Konwencja: ciało jednostki = kopia pinu po PIN_TO_PORT_NAMES/LINE_SUBS (`k08a-subs.mjs`). Stan modułu pinu
 * (`uxSectionRefresh`, `activeCity`, `activeMap`, `activeOnClose`) jest w modułach K06A/K07A — K08A czyta i
 * zapisuje go akcesorami. Efekty DOM (`clearGarrisonPanel`, `disposeHoverDetailDock`, `isCityUxFrameOpen`) i
 * `rerender` (cięcie K09) wchodzą przez `setK08aDeps` (K08A-Z2). Ikony marki: import `brandAssets`.
 *
 * ZAŁOŻENIA (K08A-Z1..Z5) i tabela było/jest: `dyspozycje/rust-port/p5/P5-8-K08A.md`.
 */

import { brandIconSvg } from '../icons/brandAssets';
import { getK06aState, setK06aActive } from './k06a-fundament';
import {
  getK07aActiveCity, getK07aUxSectionRefresh, resolveK07aActiveCity, setK07aActiveCity, setK07aUxSectionRefresh,
} from './k07a-fundament';

// ─── K08A-Z2: wstrzykiwane zależności (DOM i rerender kontrolera) ────────────────────────────────────────────────────

export interface K08aDeps {
  /** Pin `rerender()` (blok K09, cięcie P5.8-Z1) — przez kontroler/ctx, NIE przez K08A. */
  rerender: () => void;
  /** Pin `clearGarrisonPanel()` (K06B, DOM). */
  clearGarrisonPanel: () => void;
  /** Pin `disposeHoverDetailDock()` (`ui/hoverDetailDock`, DOM). */
  disposeHoverDetailDock: () => void;
  /** Pin `isCityUxFrameOpen()` (`ui/cityUxFrame`, DOM). */
  isCityUxFrameOpen: () => boolean;
}

let deps: K08aDeps | null = null;

/** Instaluje zależności K08A (most/kontroler). */
export function setK08aDeps(next: K08aDeps | null): void {
  deps = next;
}

/** K08A-Z2: brak `setK08aDeps` = wyjątek (pin zawsze wywołuje te funkcje; cicha utrata efektu byłaby błędem). */
function requireK08aDeps(): K08aDeps {
  if (deps === null) throw new Error('K08A: brak setK08aDeps (rerender/DOM — pin zawsze je wywołuje)');
  return deps;
}

// ─── K08A-Z3: stan modułu (pin `let activeCityPanelTab`) i lustra stanu K06A/K07A ─────────────────────────────────

/** K08A-Z3: akcesor `activeCityPanelTab` (K08B będzie czytać/pisać zakładkę przez akcesory). */
export function getK08aActiveCityPanelTab(): CityPanelIconTab {
  return activeCityPanelTab;
}

export function setK08aActiveCityPanelTab(tab: CityPanelIconTab): void {
  activeCityPanelTab = tab;
}

/**
 * K08A-Z3: pin `activeCity = null; activeMap = null;` (`clearCityPanelUxMode`). Pin trzyma JEDEN `activeCity`;
 * v2 trzyma lustra w K06A (`activeCity`, `activeMap`) i K07A (`activeCity`) — czyszczone razem tu. `activeOnClose`
 * zostaje (pin tego nie zeruje).
 */
function clearActiveCityMirrors(): void {
  setK07aActiveCity(null);
  setK06aActive(null, null, getK06aState().activeOnClose);
}

// ─── Jednostki K08A (kopie pinu wygenerowane; markery = bramka verify-k08a-copies.mjs) ───────────────────────────────

// pin edb8fb56 gra/src/ui/cityPanel.ts:10337-10346
export function refreshCityPanelIfOpen(): void {
  if (getK07aUxSectionRefresh()) {
    resolveK07aActiveCity();
    getK07aUxSectionRefresh()?.();
    return;
  }
  if (!isCityPanelOpen()) return;
  resolveK07aActiveCity();
  requireK08aDeps().rerender();
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:10367-10374
export function clearCityPanelUxMode(): void {
  requireK08aDeps().clearGarrisonPanel();
  setK07aUxSectionRefresh(null);
  activeCityPanelTab = 'budowa';
  clearActiveCityMirrors();
  // activeMap = null: zerowane razem z activeCity w clearActiveCityMirrors() (K08A-Z3)
  requireK08aDeps().disposeHoverDetailDock();
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:10694-10698
export function closeCityView(onClose?: () => void): void {
  clearCityPanelUxMode();
  if (onClose) onClose();
  else getK06aState().activeOnClose();
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11540-11549
export type CityPanelIconTab =
  | 'budowa'
  | 'rekrutacja'
  | 'spichlerz'
  | 'handel'
  | 'praca'
  | 'porzadek'
  | 'zdrowie'
  | 'kultura'
  | 'religia';
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11551-11551
export type CityPanelProductionTab = 'budowa' | 'rekrutacja';
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11552-11552
export type CityPanelCityParamTab = Exclude<CityPanelIconTab, CityPanelProductionTab>;
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11554-11557
export const CITY_PANEL_ICONS_LEFT: { id: CityPanelProductionTab; iconId: string; title: string }[] = [
  { id: 'budowa', iconId: 'cp-buildings', title: 'Budowa — dostępne i w mieście' },
  { id: 'rekrutacja', iconId: 'cp-recruit', title: 'Jednostki do rekrutacji' },
];
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11559-11571
export const CITY_PANEL_ICONS_RIGHT: { id: CityPanelCityParamTab; iconId: string; title: string }[] = [
  { id: 'spichlerz', iconId: 'cp-granary', title: 'Wyżywienie i wzrost — suwak 0–6' },
  // Tytuł poniżej to fallback modułowej stałej — DYSPOZYCJA 85 (Maciej 2026-07-26):
  // realny tooltip gracza podmienia renderCityIconRightRail() na "Podział daniny/podatku"
  // (daninaLabelGenitive), więc ten string nigdy nie trafia na ekran. Celowo bez słowa
  // "handel" mimo to — Handel jest WYŁĄCZNIE zakładką imperium, nie miasta.
  { id: 'handel', iconId: 'cp-trade', title: 'Podział daniny/podatku i zamożność — suwaki Skarb / Nauka / Zamożność' },
  { id: 'praca', iconId: 'cp-labor', title: 'Podział pracy — budynki i pula imperium' },
  { id: 'porzadek', iconId: 'cp-order', title: 'Społeczeństwo i porządek' },
  { id: 'zdrowie', iconId: 'cp-health', title: 'Zdrowie miasta' },
  { id: 'kultura', iconId: 'cp-culture', title: 'Kultura — granice i progi' },
  { id: 'religia', iconId: 'cp-religion', title: 'Religia — wiara i szerzenie' },
];
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11573-11575
export function isProductionPanelTab(tab: CityPanelIconTab): tab is CityPanelProductionTab {
  return tab === 'budowa' || tab === 'rekrutacja';
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11577-11585
export const CADUCEUS_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<line x1="12" y1="9.2" x2="12" y2="21.5"/>' +
  '<circle cx="12" cy="7.4" r="1.35" fill="currentColor" stroke="none"/>' +
  '<path d="M12 8.6 C8.2 6.2 5.2 7.1 4 9.2"/>' +
  '<path d="M12 8.6 C15.8 6.2 18.8 7.1 20 9.2"/>' +
  '<path d="M9.6 10.8 C7.2 13.2 7.8 16.8 12 19.2"/>' +
  '<path d="M14.4 10.8 C16.8 13.2 16.2 16.8 12 19.2"/>' +
  '</svg>';
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11587-11591
export function cityRailIconHtml(iconId: string): string {
  const svg = brandIconSvg(iconId, 24);
  if (!svg) return '';
  return svg.replace('<svg ', '<svg class="civ-cp-rail-ic" ');
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11593-11593
let activeCityPanelTab: CityPanelIconTab = 'budowa';
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11971-11976
export function closeCityPanelIfOpen(): boolean {
  if (!isCityPanelOpen()) return false;
  requireK08aDeps().clearGarrisonPanel();
  getK06aState().activeOnClose();
  return true;
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11979-11981
export function isCityPanelOpen(): boolean {
  return requireK08aDeps().isCityUxFrameOpen();
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11984-11986
export function getOpenCityPanelCityId(): string | null {
  return getK07aActiveCity()?.id ?? null;
}
// pin-end
