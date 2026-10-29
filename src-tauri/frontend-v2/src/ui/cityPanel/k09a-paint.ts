/**
 * K09A-3 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K09A-Q1, runda 1, partia `paint`): jednostki K08 przeniesione do K09A
 * z zapisu K08B §3 i K09 (`P5-8-K08B.md` §3 wiersze 62-64; `P5-8-CITYPANEL-PODZIAL.md` §4 K09):
 * `paintCityPanelSections`, `showCityPanel`, `hideCityPanel`. Pin `edb8fb56`, `gra/src/ui/cityPanel.ts`.
 * 3 jednostki, 150 LOC pinu (`paintCityPanelSections` 99 + `showCityPanel` 14 + `hideCityPanel` 5 + markery).
 *
 * Markery `// pin edb8fb56 …` … `// pin-end` = bramka `tools/dom-harness/verify-k09a-copies.mjs`.
 * Efekty ramki/HUD/hover: `requireK09aDeps()` (K09A-Z2). Różnica względem pinu `showCityPanel`: v2 `showCityUxFrame`
 * i `refreshCityUxFrame` nie przyjmują `map` — mapa jest w stanie K06A (K09A-Z4).
 */
import { el } from './k01b-dom';
import { ensureCityPanelStyles } from './k02-styles';
import {
  getK08aActiveCityPanelTab, isProductionPanelTab, resolveK08aActiveCity,
} from './k08a-fundament';
import { renderCityIconLeftRail, renderCivMapChrome } from './k08b-rail';
import { renderBuildingsOwnedRightPanel } from './k08b-owned';
import { renderCivResourceTopBar } from './k08e-topbar';
import { renderOkolica, renderProd } from './k07b-p1';
import { computeView as computeViewK09a } from './k08c-deps';
import { appendPanel } from './k07b-p2';
import { getK06aState, setK06aActive, type CityK06 } from './k06a-fundament';
import { clearGarrisonPanel, getK06bRootEl } from './k06b-garnizon';
import { getK07aScalePx, setK07aActiveCity, setK07aUxSectionRefresh, type CityK07 } from './k07a-fundament';
import type { CityView } from './k01b-t';
import type { GameMap } from './k05a-fundament';
import type { City } from './k05b-host';
import type { CityRefDto } from '../../viewmodel/types';
import type { CityPanelUxMounts } from '../cityPanelUxBridge';
import { renderLeftPanelTab, renderRightPanelTab } from './k09a-tabs';
import { renderCityIconRightRail, readGameDataK09a } from './k09a-rerender';
import { requireK09aDeps } from './k09a-deps';

// ─── Jednostki K09A-3 (kopie pinu wygenerowane ręcznie; markery = bramka verify-k09a-copies.mjs) ─────────────────────

// pin edb8fb56 gra/src/ui/cityPanel.ts:11756-11853
export function paintCityPanelSections(
  mounts: CityPanelUxMounts,
  city: City,
  map: GameMap,
  refresh: () => void,
  onClose?: () => void,
): void {
  const st = getK06aState();
  // pin: `pinnedGarrisonCityId` (string) vs `city.id` (number w v2, K08D-Z10): porównanie tożsame z K06B.
  if (st.pinnedGarrisonCityId !== null && st.pinnedGarrisonCityId !== (city.id as unknown as string)) {
    clearGarrisonPanel();
  }
  setK07aUxSectionRefresh(refresh);
  setK07aActiveCity(city as unknown as CityK07);
  setK06aActive(city as unknown as CityK06, map, onClose ?? st.activeOnClose);
  ensureCityPanelStyles();

  requireK09aDeps().setHoverDetailDocks(
    mounts.leftDetailDock || mounts.detailDock
      ? { left: mounts.leftDetailDock ?? null, right: mounts.detailDock ?? null }
      : null,
  );

  const sp = getK07aScalePx() + 'px';
  mounts.top.style.fontSize = sp;
  mounts.left.style.fontSize = sp;
  if (mounts.leftIconRail) mounts.leftIconRail.style.fontSize = sp;
  if (mounts.rightIconRail) mounts.rightIconRail.style.fontSize = sp;
  if (mounts.leftDetailDock) mounts.leftDetailDock.style.fontSize = sp;
  if (mounts.detailDock) mounts.detailDock.style.fontSize = sp;
  mounts.right.style.fontSize = sp;

  const data = readGameDataK09a();
  const view = data ? computeViewK09a(city, map, data) : null;

  mounts.top.innerHTML = '';
  const topScope = el('div', 'civ-cs civ-ux-panel-scope');
  mounts.top.appendChild(topScope);
  renderCivResourceTopBar(topScope, city, view, map, data, onClose);

  if (mounts.leftIconRail) {
    renderCityIconLeftRail(mounts.leftIconRail);
  }
  if (mounts.rightIconRail) {
    renderCityIconRightRail(mounts.rightIconRail, city);
  }

  if (mounts.mapChrome) {
    mounts.mapChrome.innerHTML = '';
    renderCivMapChrome(mounts.mapChrome, city, onClose);
    renderOkolica(mounts.mapChrome, city as unknown as CityK07, map);
  }

  mounts.left.innerHTML = '';
  const leftScope = el('div', 'civ-cs civ-ux-panel-scope civ-v-left-col');
  leftScope.style.display = 'flex';
  leftScope.style.flexDirection = 'column';
  leftScope.style.minHeight = '0';
  leftScope.style.height = '100%';
  mounts.left.appendChild(leftScope);

  renderProd(appendPanel(leftScope, 'cs-prod'), city as unknown as CityK07, view);

  const leftMainEl = el('div', 'civ-v-left-main');
  leftMainEl.id = 'cs-left-main';
  leftScope.appendChild(leftMainEl);
  const tab = getK08aActiveCityPanelTab();
  if (isProductionPanelTab(tab)) {
    renderLeftPanelTab(leftMainEl, tab, city, map, view, data);
  } else {
    leftMainEl.style.display = 'none';
  }

  mounts.right.innerHTML = '';
  const rightScope = el('div', 'civ-cs civ-ux-panel-scope civ-v-right-col');
  mounts.right.appendChild(rightScope);

  const mainEl = el('div', 'civ-v-right-main');
  mainEl.id = 'cs-right-main';
  rightScope.appendChild(mainEl);
  if (tab === 'budowa') {
    // P-PRODUKCJA-BUDYNKI-WYBUDOWANE-PRAWA-KOLUMNA (Maciej 2026-08-12): zakładka
    // Budowa reużywa prawą kolumnę (dziś pustą przy tej zakładce) pod listę
    // wybudowanych budynków, żeby lewa kolumna mogła oddać "Dostępne do budowy"
    // pełną wysokość. / EN: Budowa tab reuses the right column (empty today for
    // this tab) for the built-buildings list, freeing full height on the left.
    mainEl.style.display = '';
    mainEl.style.flex = '1 1 auto';
    renderBuildingsOwnedRightPanel(mainEl, city, data);
  } else if (isProductionPanelTab(tab)) {
    mainEl.style.display = 'none';
    mainEl.innerHTML = '';
  } else {
    mainEl.style.display = '';
    mainEl.style.flex = '1 1 auto';
    renderRightPanelTab(mainEl, tab, city, map, view, data);
  }

  const footEl = rightScope.querySelector('#cs-surowce-foot');
  if (footEl) footEl.remove();
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11948-11961
export function showCityPanel(city: City, map: GameMap, onClose: () => void): void {
  const root = getK06bRootEl();
  if (root) root.style.display = 'none';
  setK07aActiveCity(city as unknown as CityK07);
  setK06aActive(city as unknown as CityK06, map, onClose);
  ensureCityPanelStyles();
  requireK09aDeps().setMapHudChromeSuppressed(true);
  const refresh = () => {
    const c = resolveK08aActiveCity();
    if (!c || getK06aState().activeMap === null) return;
    // K09A-Z4: pin `refreshCityUxFrame(c, activeMap, refresh)` — mapa pozostaje w stanie K06A, v2 jej nie przyjmuje.
    requireK09aDeps().refreshCityUxFrame(c as unknown as CityRefDto, refresh);
  };
  requireK09aDeps().showCityUxFrame(city as unknown as CityRefDto, refresh, onClose);
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11964-11968
export function hideCityPanel(): void {
  requireK09aDeps().hideCityUxFrame();
  requireK09aDeps().setMapHudChromeSuppressed(false);
  const root = getK06bRootEl();
  if (root) root.style.display = 'none';
}
// pin-end
