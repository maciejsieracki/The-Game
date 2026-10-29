/**
 * K09A-2 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K09A-Q1, runda 1, partia `tabs`): jednostki DOM K08 przeniesione do K09A
 * z zapisu K08B §3 (`P5-8-K08B.md` §3, wiersze 59-64): `renderOkolicaPanel`, `renderLeftPanelTab`, `renderRightPanelTab`.
 * Pin `edb8fb56`, `gra/src/ui/cityPanel.ts`. 3 jednostki, 96 LOC pinu.
 *
 * Markery `// pin edb8fb56 …` … `// pin-end` = bramka `tools/dom-harness/verify-k09a-copies.mjs`.
 * Stan: `activeCityPanelTab` nie jest czytany w tych jednostkach (przekazywany parametrem `tab`).
 */
import { el } from './k01b-dom';
import type { CityPanelCityParamTab, CityPanelProductionTab } from './k08a-fundament';
import { withW4TabCard } from './k08b-rail';
import { renderPurchasableUnits } from './k08b-purchase';
import { renderMagazyn } from './k08e-magazyn';
import { renderHandelSlidersPanel } from './k08d-slider';
import { renderWealth } from './k08d-wealth';
import { renderPodzialPracy } from './k08c-podzial';
import { renderReligia } from './k08d-religia';
import { renderBuildSplitPanel, renderOkolica, renderSpoleczenstwo, renderZdrowie, renderKultura } from './k07b-p1';
import type { CityK07 } from './k07a-fundament';
import type { CityView } from './k01b-t';
import type { GameMap } from './k05a-fundament';
import { cfg, type City, type GameData } from './k05b-host';

// ─── Jednostki K09A-2 (kopie pinu wygenerowane ręcznie; markery = bramka verify-k09a-copies.mjs) ─────────────────────

// pin edb8fb56 gra/src/ui/cityPanel.ts:11595-11603
export function renderOkolicaPanel(mount: HTMLElement, city: City, map: GameMap): void {
  mount.innerHTML =
    `<div id="cs-okmode" class="okolica-mode-hint"></div>` +
    `<div id="cs-oksurowce" class="okolica-surowce-host"></div>` +
    `<div id="cs-okolica" class="okolica-grid-host"></div>` +
    `<div id="cs-okstats" class="okstats is-collapsed"></div>` +
    `<div id="cs-okhint" class="okhint is-collapsed"></div>`;
  renderOkolica(mount, city as unknown as CityK07, map);
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11668-11696
export function renderLeftPanelTab(
  mount: HTMLElement,
  tab: CityPanelProductionTab,
  city: City,
  map: GameMap,
  view: CityView | null,
  data: GameData | null,
): void {
  mount.classList.toggle('civ-v-left-main-split', tab === 'budowa' || tab === 'rekrutacja');
  mount.innerHTML = '';
  switch (tab) {
    case 'budowa':
      renderBuildSplitPanel(mount, city as unknown as CityK07, data, view);
      break;
    case 'rekrutacja':
      withW4TabCard(mount, 'cs-units', city, body => {
        body.classList.add('civ-v-recruit-body');
        renderPurchasableUnits(body, city, data, {
          w4: true,
          // Ten sam flex-fill co lista budynków; nagłówek i pasek zasobów zostają stałe,
          // a lista jest jedynym przewijanym obszarem.
          scrollFill: true,
        });
      }, { scrollable: true });
      break;
    default:
      mount.appendChild(el('div', 'muted', '—'));
  }
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11698-11750
export function renderRightPanelTab(
  mount: HTMLElement,
  tab: CityPanelCityParamTab,
  city: City,
  map: GameMap,
  view: CityView | null,
  data: GameData | null,
): void {
  mount.classList.remove('civ-v-right-main-split');
  mount.innerHTML = '';
  switch (tab) {
    case 'spichlerz':
      withW4TabCard(mount, 'cs-magazyn', city, body => renderMagazyn(body, city, view));
      break;
    case 'handel':
      withW4TabCard(mount, undefined, city, body => {
        const slidersHost = el('div', 'civ-handel-sliders-host');
        const wealthHost = el('div', 'civ-handel-wealth-host');
        body.appendChild(slidersHost);
        body.appendChild(wealthHost);
        renderHandelSlidersPanel(slidersHost, city, view, data);
        renderWealth(wealthHost, city, data, view);
      }, { scrollable: true });
      break;
    case 'praca':
      withW4TabCard(mount, 'cs-praca', city, body => {
        if (cfg.onPodzialPracyChange) {
          renderPodzialPracy(body, city, view, data);
        } else {
          body.appendChild(el('div', 'muted', 'Podział pracy niedostępny (brak hooka silnika).'));
        }
      });
      break;
    case 'porzadek':
      if (data) {
        withW4TabCard(mount, 'cs-spoleczenstwo', city, body => renderSpoleczenstwo(body, city as unknown as CityK07, data));
      } else mount.appendChild(el('div', 'muted', 'Brak danych społeczeństwa'));
      break;
    case 'zdrowie':
      if (data) {
        withW4TabCard(mount, 'cs-zdrowie', city, body => renderZdrowie(body, city as unknown as CityK07, map, data));
      } else mount.appendChild(el('div', 'muted', 'Brak danych zdrowia'));
      break;
    case 'kultura':
      withW4TabCard(mount, 'cs-kultura', city, body => renderKultura(body, city as unknown as CityK07, view));
      break;
    case 'religia':
      withW4TabCard(mount, 'cs-religia', city, body => renderReligia(body, city, view, data));
      break;
    default:
      mount.appendChild(el('div', 'muted', '—'));
  }
}
// pin-end
