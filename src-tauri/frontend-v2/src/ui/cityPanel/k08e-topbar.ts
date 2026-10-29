/**
 * K08E-3 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08E-Q1, runda 1, partia `topbar`): górny pasek miasta z pinu `edb8fb56`
 * (`gra/src/ui/cityPanel.ts`) — `capitalBadgeOrButtonHtml` (:10719-10734), `renderCivResourceTopBar` (:10736-10781),
 * `wireTopBarStatDetails` (:6051-6085).
 *
 * PLIK GENEROWANY przez `tools/dom-harness/gen-k08e-port.mjs --batch topbar` (bloki = pin, `k08e-subs.mjs`).
 * Edycja ręczna bloku `// pin edb8fb56 …` … `// pin-end` = FAIL bramki `verify-k08e-copies.mjs`.
 * `switchCity` (pin :10209) = delegat K09 (`k08e-deps.ts`, K08E-Z9); `resolveOrderState` = delegat (K08E-Z8).
 */

import { attachTopBarStat } from './k01b-dom';
import { renderTopBarGarrison } from './k06b-garnizon';
import { cfg, isMeCity, rerender, type City, type GameData } from './k05b-host';
import type { CityView } from './k01b-t';
import type { GameMap } from './k05a-fundament';
import { resolveEmpireSnap } from './k08d-deps';
import {
  buildCityOnlyW3FlankChips, cityPanelTitle, ownerCities, resolveOrderState, switchCity,
} from './k08e-deps';
import { buildTopBarZywnoscDetailCard, buildTopBarRekruciDetailCard, buildTopBarLudnoscDetailCard } from './k08e-karty-a';
import { buildTopBarNaukaDetailCard, buildTopBarKulturaDetailCard, buildPorzadekDetailCard } from './k08e-karty-b';
import { buildTopBarPracaDetailCard } from './k08c-praca';
import { buildTopBarZlotoDetailCard } from './k05b-podzial';
import { buildTopBarReligiaDetailCard } from './k08d-religia';

// ─── Jednostki K08E, partia k08e-topbar.ts (kopie pinu wygenerowane; markery = bramka verify-k08d-copies.mjs) ─────────────

// pin edb8fb56 gra/src/ui/cityPanel.ts:10719-10734
export function capitalBadgeOrButtonHtml(city: City): string {
  const capitalId = cfg.getCapitalCityId?.(city.ownerId) ?? null;
  if (capitalId != null && capitalId === city.id) {
    return `<span class="civ-v-w3-capital-badge" title="Stolica">★ Stolica</span>`;
  }
  if (!isMeCity(city.ownerId) || !cfg.onSetCapital) return '';
  const allCitiesForCapital = cfg.getCities?.() ?? [];
  const capitalCity = capitalId ? allCitiesForCapital.find(c => c.id === capitalId) : null;
  const besieged = !!capitalCity?.oblegane;
  if (besieged) {
    return `<button type="button" class="civ-v-w3-capital-btn" disabled ` +
      `title="Obecna stolica (${capitalCity?.name ?? '?'}) jest oblegana — nie można przenieść">Ustaw jako stolicę</button>`;
  }
  return `<button type="button" class="civ-v-w3-capital-btn" id="civ-v-set-capital" ` +
    `title="Przenieś stolicę do tego miasta (za darmo)">Ustaw jako stolicę</button>`;
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:10736-10781
export function renderCivResourceTopBar(
  mount: HTMLElement,
  city: City,
  view: CityView | null,
  map: GameMap | null,
  data: GameData | null,
  _onClose?: () => void,
): void {
  const flank = view ? buildCityOnlyW3FlankChips(city, view, data, map) : { left: '', right: '' };
  const multi = ownerCities(city).length > 1;
  const navDis = multi ? '' : 'disabled';
  mount.innerHTML =
    `<div class="civ-v-top-stack">` +
    `<div class="civ-v-top-flank-row">` +
    `<div class="civ-v-w3-chips-flank civ-v-w3-chips-left">${flank.left}</div>` +
    `<div class="civ-v-w3-city-col">` +
    `<div class="civ-v-w3-city-badge">` +
    `<button type="button" class="civ-v-w3-city-nav" id="civ-v-city-prev" ${navDis} title="Poprzednie miasto (←)" aria-label="Poprzednie miasto">‹</button>` +
    `<span class="civ-v-w3-city-name">${cityPanelTitle(city)}</span>` +
    `<button type="button" class="civ-v-w3-city-nav" id="civ-v-city-next" ${navDis} title="Następne miasto (→)" aria-label="Następne miasto">›</button>` +
    `<span class="civ-v-w3-city-pop">${city.population}</span>` +
    capitalBadgeOrButtonHtml(city) +
    `</div>` +
    `<div id="civ-v-garrison-row" class="civ-v-garrison-inline"></div>` +
    `</div>` +
    `<div class="civ-v-w3-chips-flank civ-v-w3-chips-right">${flank.right}</div>` +
    `</div>` +
    `</div>`;
  mount.querySelector('#civ-v-city-prev')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    switchCity(-1);
  });
  mount.querySelector('#civ-v-city-next')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    switchCity(1);
  });
  mount.querySelector('#civ-v-set-capital')?.addEventListener('click', () => {
    cfg.onSetCapital?.(city.id);
    rerender();
  });
  const garrisonRow = mount.querySelector('#civ-v-garrison-row') as HTMLElement | null;
  if (garrisonRow) renderTopBarGarrison(garrisonRow, city);
  wireTopBarStatDetails(mount, city, view, map, data);
}
// pin-end

// pin edb8fb56 gra/src/ui/cityPanel.ts:6051-6085
export function wireTopBarStatDetails(
  mount: HTMLElement,
  city: City,
  view: CityView | null,
  map: GameMap | null,
  data: GameData | null,
): void {
  const empire = resolveEmpireSnap(city, map, data);

  attachTopBarStat(mount, 'ludnosc', () => buildTopBarLudnoscDetailCard(city, view, data, map));
  const mpSnap = cfg.getManpowerSnapshot?.(city.id);
  if (mpSnap) {
    attachTopBarStat(mount, 'rekruci', () => buildTopBarRekruciDetailCard(city, mpSnap));
  }

  if (view) {
    attachTopBarStat(mount, 'zywnosc', () => buildTopBarZywnoscDetailCard(city, view, empire, data));
    attachTopBarStat(mount, 'praca', () => buildTopBarPracaDetailCard(city, view, empire, map, data));
    attachTopBarStat(mount, 'zloto', () => buildTopBarZlotoDetailCard(city, view, empire, data));
    attachTopBarStat(mount, 'nauka', () => buildTopBarNaukaDetailCard(city, view, empire, data));
    attachTopBarStat(mount, 'kultura', () => buildTopBarKulturaDetailCard(city, view, empire));
    attachTopBarStat(mount, 'religia', () => buildTopBarReligiaDetailCard(city, view, empire, data));
  }

  if (data) {
    const orderResolved = resolveOrderState(city, data);
    if (orderResolved.state.porPct != null) {
      attachTopBarStat(
        mount,
        'porzadek',
        () => buildPorzadekDetailCard(city, orderResolved.state),
      );
    }
  }
}
// pin-end
