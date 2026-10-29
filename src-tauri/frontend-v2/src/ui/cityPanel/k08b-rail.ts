/**
 * K08B-1 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08B-Q1, runda 1, partia `rail`): jednostki DOM bloku K08 (pin `edb8fb56`,
 * `gra/src/ui/cityPanel.ts`) — lewa/prawa szyna ikon, pasek „Budynki", zejście na mapę, karta W4.
 * 6 jednostek, 150 LOC (z 24 jednostek DOM bloku K08 = 1 324 LOC; reszta w kolejnych partiach, patrz
 * `dyspozycje/rust-port/p5/P5-8-K08B.md`).
 *
 * PLIK GENEROWANY przez `tools/dom-harness/gen-k08b-port.mjs` (bloki = pin + `k08b-subs.mjs`).
 * Edycja ręczna bloku `// pin edb8fb56 …` … `// pin-end` = FAIL bramki `verify-k08b-copies.mjs`.
 *
 * Zależności: DOM/kontroler przez `requireK08aDeps()` (K08A-Z2: `clearGarrisonPanel`, `rerender`); stan
 * `activeCityPanelTab` przez akcesory K08A; `scalePx` przez `getK07aScalePx` (K08B-Z3); `cfg` z `k05b-host`.
 * Efekty hover (`attachHoverDetail`, `showHoverDetailNow`) z `ui/hoverDetailDock` (moduł UI, nie logika gry).
 */

import { attachHoverDetail, showHoverDetailNow } from '../hoverDetailDock';
import { el } from './k01b-dom';
import { CITY_PANEL_ICON_RAIL_VERT_EM, cityPanelBrandIcon, cityPanelChipIconWrap } from './k01a-fundament';
import { cfg, type City, type GameData } from './k05b-host';
import { buildOwnedBuildingsDetailCard } from './k06b-jednostki';
import { getK07aScalePx } from './k07a-fundament';
import {
  CITY_PANEL_ICONS_LEFT, type CityPanelIconTab, cityRailIconHtml, closeCityView, getK08aActiveCityPanelTab,
  requireK08aDeps, setK08aActiveCityPanelTab,
} from './k08a-fundament';

// ─── Jednostki K08B, partia rail (kopie pinu wygenerowane; markery = bramka verify-k08b-copies.mjs) ─────────────

// pin edb8fb56 gra/src/ui/cityPanel.ts:9273-9293
export function renderOwnedBuildingsBar(mount: HTMLElement, city: City, data: GameData | null): void {
  mount.innerHTML = '';
  const built = cfg.getBuiltBuildingIds?.(city.id);
  const count = built?.length ?? 0;
  const bar = el('button', 'bld-owned-bar');
  bar.type = 'button';
  bar.setAttribute('aria-label', `Budynki w mieście (${count}) — pokaż szczegóły`);
  const left = el('span');
  left.innerHTML = `${cityPanelChipIconWrap('cp-buildings', 16)}<span>Budynki w mieście (${count})</span>`;
  left.style.cssText = 'display:inline-flex;align-items:center;gap:0.4em;';
  bar.appendChild(left);
  const chev = el('span', 'bld-owned-chevron');
  chev.textContent = 'ℹ szczegóły';
  bar.appendChild(chev);
  bar.addEventListener('click', (e) => {
    e.stopPropagation();
    showHoverDetailNow(bar, () => buildOwnedBuildingsDetailCard(city, data), 'left');
  });
  attachHoverDetail(bar, () => buildOwnedBuildingsDetailCard(city, data), 280, 'left');
  mount.appendChild(bar);
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:10700-10710
export function renderCityExitFooter(mount: HTMLElement, onClose?: () => void): void {
  const wrap = el('div', 'civ-v-exit-foot');
  wrap.innerHTML =
    `<button type="button" class="civ-v-exit-map-btn civ-v-exit-foot-btn" data-city-exit title="Wróć na mapę świata (Esc)">` +
    `<span class="civ-v-exit-ic">${cityPanelBrandIcon('menu-exit', 24)}</span>` +
    `<span>Wróć na mapę</span>` +
    `</button>` +
    `<span class="civ-v-exit-foot-hint">Esc — szybkie zamknięcie</span>`;
  wrap.querySelector('[data-city-exit]')?.addEventListener('click', () => closeCityView(onClose));
  mount.appendChild(wrap);
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:10783-10791
export function renderCityIconLeftRail(mount: HTMLElement): void {
  mount.innerHTML = '';
  const scope = el('div', 'civ-cs civ-ux-panel-scope');
  mount.appendChild(scope);
  const iconMount = el('div', 'civ-v-icon-rail-mount');
  iconMount.id = 'cs-icon-rail-left';
  scope.appendChild(iconMount);
  renderCityIconRail(iconMount, CITY_PANEL_ICONS_LEFT, true, true);
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11056-11079
export function renderCivMapChrome(mount: HTMLElement, city: City, onClose?: () => void): void {
  mount.innerHTML =
    `<div class="civ-v-map-bottom-stack">` +
    `<div class="civ-v-exit-bottom-row">` +
    `<button type="button" class="civ-v-exit-map-btn" id="civ-v-map-close" title="Wróć na mapę świata (Esc)">` +
    `<span class="civ-v-exit-ic">${cityPanelBrandIcon('menu-exit', 24)}</span>` +
    `<span>Wróć na mapę</span>` +
    `</button>` +
    `<span class="civ-v-exit-foot-hint">Esc — szybkie wyjście</span>` +
    `</div>` +
    `<div id="cs-okolica-center" class="civ-v-okolica-center">` +
    `<div id="cs-okhead-ux" class="ptitle civ-v-okolica-head"></div>` +
    `<div id="cs-oktoolbar-ux" class="okolica-toolbar okolica-toolbar-map"></div>` +
    `<div id="cs-okmode" class="okolica-mode-hint civ-v-okmode-map"></div>` +
    `</div>` +
    `</div>` +
    `<div id="cs-okolica-aux" hidden aria-hidden="true">` +
    `<div id="cs-oksurowce" class="okolica-surowce-host"></div>` +
    `<div id="cs-okolica" class="okolica-grid-host"></div>` +
    `<div id="cs-okstats" class="okstats is-collapsed"></div>` +
    `<div id="cs-okhint" class="okhint is-collapsed"></div>` +
    `</div>`;
  mount.querySelector('#civ-v-map-close')?.addEventListener('click', () => closeCityView(onClose));
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11605-11649
export function renderCityIconRail(
  mount: HTMLElement,
  items: ReadonlyArray<{ id: CityPanelIconTab; iconId: string; title: string }>,
  vertical = false,
  w3Medallions = false,
): void {
  mount.innerHTML = '';
  const railCls = vertical
    ? (w3Medallions ? 'civ-v-icon-rail civ-v-icon-rail-vert civ-v-icon-rail-w3' : 'civ-v-icon-rail civ-v-icon-rail-vert')
    : 'civ-v-icon-rail';
  const rail = el('div', railCls);
  const iconPx = vertical && !w3Medallions ? Math.round(getK07aScalePx() * CITY_PANEL_ICON_RAIL_VERT_EM) : 0;
  for (const item of items) {
    const btn = el('button', `civ-v-icon-btn${getK08aActiveCityPanelTab() === item.id ? ' on' : ''}`);
    btn.type = 'button';
    btn.title = item.title;
    btn.setAttribute('aria-label', item.title);
    btn.setAttribute('aria-pressed', getK08aActiveCityPanelTab() === item.id ? 'true' : 'false');
    const glyph = el('span', 'civ-v-icon-glyph');
    glyph.innerHTML = cityRailIconHtml(item.iconId);
    if (w3Medallions) {
      glyph.style.width = '26px';
      glyph.style.height = '26px';
      glyph.style.fontSize = '';
    } else if (vertical) {
      glyph.style.width = '24px';
      glyph.style.height = '24px';
      glyph.style.fontSize = '';
    } else if (iconPx > 0) {
      glyph.style.fontSize = iconPx + 'px';
      glyph.style.width = iconPx + 'px';
      glyph.style.height = iconPx + 'px';
    }
    btn.appendChild(glyph);
    btn.addEventListener('click', () => {
      if (getK08aActiveCityPanelTab() !== item.id) {
        requireK08aDeps().clearGarrisonPanel();
        setK08aActiveCityPanelTab(item.id);
        requireK08aDeps().rerender();
      }
    });
    rail.appendChild(btn);
  }
  mount.appendChild(rail);
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:11651-11666
export function withW4TabCard(
  parent: HTMLElement,
  id: string | undefined,
  city: City,
  render: (body: HTMLElement) => void,
  opts?: { scrollable?: boolean },
): void {
  const cardCls = opts?.scrollable ? 'civ-w4-tab-card civ-w4-tab-card--scroll' : 'civ-w4-tab-card';
  const card = el('div', cardCls);
  if (id) card.id = id;
  const bodyCls = opts?.scrollable ? 'civ-w4-tab-body civ-w4-tab-body--scroll' : 'civ-w4-tab-body';
  const body = el('div', bodyCls);
  card.appendChild(body);
  parent.appendChild(card);
  render(body);
}
// pin-end
