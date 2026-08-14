/**
 * cityListHud.ts — lista miast gracza na mapie świata (po kliknięciu medalionu Miasta
 * w toolbarze). Reskin do palety 3b — MIASTA-ARMIE-PANEL-LEWY-2026-08-14 §4: karta
 * zamiast płaskiego wiersza, zero emoji (🏛️/👥/🔨 → SVG z brandu), pasmo podsumowania
 * (hero „N miast" + 2 boxy) nad listą, linia produkcji rozbita na pasek postępu.
 * Style współdzielone z armyListHud.ts przez sideListHud.css.ts.
 */

import { pushOverlay, popOverlay } from './escapeOverlayStack';
import { bindHudPanelOutsideDismiss } from './hudPanelDismiss';
import { brandIconSvg } from './icons/brandAssets';
import { formatMiastaCount, formatKolejkiCount } from './formatPl';
import {
  SIDE_LIST_ROOT_CLASS,
  ensureSideListHudStyles,
  sideListBadgeHtml,
  sideListEmptyStateHtml,
  pctClamped,
  type SideListBadgeVariant,
} from './sideListHud.css';

export interface CityListEntry {
  id: string;
  name: string;
  population: number;
  /**
   * Rozbite z dawnego sklejonego `productionLine` („Stolarnia • 8/20 🔨") na 3 pola
   * (MIASTA-ARMIE-PANEL-LEWY-2026-08-14 §5.2, zatwierdzone bez fallbacku) — pasek
   * postępu i wyrównana liczba potrzebują osobnych wartości, nie stringa do parsowania.
   * Obecne razem, gdy front kolejki istnieje; nieobecne, gdy kolejka pusta lub miasto
   * nie ma zdolności produkcji (patrz `productionQueueEmpty`).
   */
  productionName?: string;
  /** Postęp (pkt Pracy) zainwestowany we front kolejki. */
  productionProgress?: number;
  /** Koszt (pkt Pracy) frontu kolejki. */
  productionMax?: number;
  /** Kolejka pusta, ale miasto MA zdolność produkcji — dostaje plakietkę neutralną
   *  „kolejka pusta" zamiast paska (dawne `cityHasActionableProduction` bez frontu). */
  productionQueueEmpty?: boolean;
  /** Np. „Garnizon: 2". */
  metaLine?: string;
  /** Liczba jednostek w garnizonie miasta (surowa wartość) — suma w boksie
   *  „GARNIZONY" pasma podsumowania; `metaLine` zostaje tekstem per-wiersz. */
  garrison?: number;
  /** Czy to stolica gracza (capitalCityIdForOwner) — plakietka „stolica"
   *  (MIASTA-ARMIE-PANEL-LEWY-2026-08-14 §5.3, zatwierdzone). */
  isCapital?: boolean;
}

export interface CityListHudConfig {
  getCities: () => CityListEntry[];
  onSelectCity: (cityId: string) => void;
  /** Po zamknięciu listy (✕, Esc, ponowne kliknięcie medalionu). */
  onClose?: () => void;
}

export interface CityListHudApi {
  el: HTMLDivElement;
  isOpen: () => boolean;
  toggle: () => void;
  show: () => void;
  hide: () => void;
  update: () => void;
  destroy: () => void;
}

const STYLE_ID = 'civ-city-list-hud-css-v3';

/** CSS wyłącznie tego panelu: pasmo podsumowania (hero) + pasek postępu produkcji.
 *  Reszta (karta, kafelek, nagłówek, plakietki, stan pusty) — sideListHud.css.ts. */
function ensureStyles(): void {
  ensureSideListHudStyles();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-city-list-hud .cl-sum{padding:.7em .75em .55em;border-bottom:1px solid var(--border);flex-shrink:0;}
.civ-city-list-hud .cl-sum-big{font-size:20px;font-weight:800;color:var(--gold);}
.civ-city-list-hud .cl-sum-sub{font-size:12px;color:var(--muted);margin-top:.25em;}
.civ-city-list-hud .cl-sum-boxes{display:grid;grid-template-columns:1fr 1fr;gap:.6em;margin-top:.6em;}
.civ-city-list-hud .cl-sum-box{border:1px solid var(--border);border-radius:7px;padding:.5em .6em;background:var(--panel);}
.civ-city-list-hud .cl-sum-box .k{font-size:9px;letter-spacing:.08em;color:var(--muted);font-weight:700;text-transform:uppercase;}
.civ-city-list-hud .cl-sum-box .v{font-size:13px;font-weight:600;margin-top:.3em;color:#e8ebf0;}
.civ-city-list-hud .cl-sum-box .v b{font-weight:800;}
.civ-city-list-hud .cl-prod-row{display:flex;justify-content:space-between;align-items:baseline;
  margin-top:.35em;font-size:.82em;gap:.5em;}
.civ-city-list-hud .cl-prod-name{color:#d4cba0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;}
.civ-city-list-hud .cl-prod-count{color:#e8ebf0;font-weight:700;flex-shrink:0;}
.civ-city-list-hud .cl-prod-empty{font-size:.82em;color:#d4cba0;margin-top:.35em;}
.civ-city-list-hud .cl-prodbar{height:6px;border-radius:999px;background:rgba(0,0,0,.35);margin-top:.25em;overflow:hidden;}
.civ-city-list-hud .cl-prodbar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#6a4010,#d9a441);transition:width .2s;}
.civ-city-list-hud .cl-meta{font-size:11px;color:var(--muted);margin-top:.2em;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

let api: CityListHudApi | null = null;

export function createCityListHud(config: CityListHudConfig): CityListHudApi {
  ensureStyles();
  if (api !== null) api.destroy();

  const el = document.createElement('div');
  el.className = `civ-city-list-hud ${SIDE_LIST_ROOT_CLASS}`;
  document.body.appendChild(el);

  let open = false;
  let unbindOutside: (() => void) | null = null;

  function closeList(): void {
    if (!open) return;
    open = false;
    el.classList.remove('open');
    popOverlay('city-list');
    unbindOutside?.();
    unbindOutside = null;
    config.onClose?.();
  }

  function render(): void {
    const cities = config.getCities();

    const header = document.createElement('div');
    header.className = 'sl-header';
    header.innerHTML = `<span class="sl-header-ic">${brandIconSvg('tb-cities', 18)}</span>`
      + `<span class="sl-title">Miasta</span>`;
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'sl-close';
    closeBtn.title = 'Zamknij listę (Esc)';
    closeBtn.setAttribute('aria-label', 'Zamknij listę miast');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      closeList();
    });
    header.appendChild(closeBtn);

    const scroll = document.createElement('div');
    scroll.className = 'sl-scroll';

    if (cities.length === 0) {
      scroll.innerHTML = sideListEmptyStateHtml(
        brandIconSvg('tb-cities', 32),
        'Brak miast w imperium — załóż pierwsze miasto na mapie.',
      );
    } else {
      for (const c of cities) {
        const row = document.createElement('div');
        row.className = 'sl-item';
        row.setAttribute('role', 'button');
        row.tabIndex = 0;
        row.title = 'Wejdź do miasta ' + c.name;

        const ico = document.createElement('span');
        ico.className = 'sl-ico';
        ico.innerHTML = brandIconSvg('tb-cities', 18);

        const body = document.createElement('div');
        body.className = 'sl-body';

        const badges: Array<{ text: string; variant: SideListBadgeVariant }> = [];
        if (c.isCapital) badges.push({ text: 'stolica', variant: 'gold' });
        if (c.productionQueueEmpty) badges.push({ text: 'kolejka pusta', variant: 'neutral' });

        const nameRow = document.createElement('div');
        nameRow.className = 'sl-name-row';
        const name = document.createElement('div');
        name.className = 'sl-name';
        name.textContent = c.name;
        name.title = c.name;
        nameRow.appendChild(name);
        if (badges.length > 0) {
          const badgesWrap = document.createElement('span');
          badgesWrap.className = 'sl-badges';
          badgesWrap.innerHTML = badges.map(b => sideListBadgeHtml(b.text, b.variant)).join('');
          nameRow.appendChild(badgesWrap);
        }
        body.appendChild(nameRow);

        const pop = document.createElement('div');
        pop.className = 'sl-meta';
        pop.innerHTML = `<span>${brandIconSvg('res-population', 12)}</span><span>${String(c.population)} mieszk.</span>`;
        body.appendChild(pop);

        if (c.productionName !== undefined
          && typeof c.productionProgress === 'number'
          && typeof c.productionMax === 'number') {
          const prodRow = document.createElement('div');
          prodRow.className = 'cl-prod-row';
          const prodName = document.createElement('span');
          prodName.className = 'cl-prod-name';
          prodName.textContent = c.productionName;
          const prodCount = document.createElement('span');
          prodCount.className = 'cl-prod-count';
          prodCount.textContent = `${Math.round(c.productionProgress)}/${c.productionMax}`;
          prodRow.appendChild(prodName);
          prodRow.appendChild(prodCount);
          body.appendChild(prodRow);

          const bar = document.createElement('div');
          bar.className = 'cl-prodbar';
          const fill = document.createElement('i');
          fill.style.width = pctClamped(c.productionProgress, c.productionMax) + '%';
          bar.appendChild(fill);
          body.appendChild(bar);
        } else if (c.productionQueueEmpty) {
          const prodEmpty = document.createElement('div');
          prodEmpty.className = 'cl-prod-empty';
          prodEmpty.textContent = 'Kolejka pusta';
          body.appendChild(prodEmpty);
        }

        if (c.metaLine) {
          const meta = document.createElement('div');
          meta.className = 'cl-meta';
          meta.textContent = c.metaLine;
          body.appendChild(meta);
        }

        row.appendChild(ico);
        row.appendChild(body);
        const go = () => {
          config.onSelectCity(c.id);
        };
        row.addEventListener('click', go);
        row.addEventListener('keydown', (ev: KeyboardEvent) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            go();
          }
        });
        scroll.appendChild(row);
      }
      const hint = document.createElement('div');
      hint.className = 'sl-hint';
      hint.textContent = 'Kliknij miasto, aby wejść. ✕ lub Esc — powrót na mapę. Ponowne 🏛 — zamknij listę.';
      scroll.appendChild(hint);
    }

    el.innerHTML = '';
    el.appendChild(header);

    // Pasmo podsumowania (hero „N miast" + 2 boxy) — NIE renderuje się przy zerze miast
    // (MIASTA-ARMIE-PANEL-LEWY-2026-08-14 §4.2: „0 miast" powtarzałoby stan pusty).
    if (cities.length > 0) {
      const totalPop = cities.reduce((s, c) => s + c.population, 0);
      const activeQueues = cities.filter(c => c.productionName !== undefined).length;
      const totalGarrison = cities.reduce((s, c) => s + (c.garrison ?? 0), 0);
      const sum = document.createElement('div');
      sum.className = 'cl-sum';
      sum.innerHTML = `<div class="cl-sum-big">${formatMiastaCount(cities.length)}</div>`
        + `<div class="cl-sum-sub">${totalPop} mieszk. · ${formatKolejkiCount(activeQueues)} w toku</div>`
        + `<div class="cl-sum-boxes">`
        + `<div class="cl-sum-box"><div class="k">W budowie</div><div class="v"><b>${activeQueues}</b> z ${cities.length}</div></div>`
        + `<div class="cl-sum-box"><div class="k">Garnizony</div><div class="v"><b>${totalGarrison}</b> jedn.</div></div>`
        + `</div>`;
      el.appendChild(sum);
    }

    el.appendChild(scroll);
  }

  function show(): void {
    open = true;
    render();
    el.classList.add('open');
    pushOverlay('city-list', closeList);
    unbindOutside?.();
    unbindOutside = bindHudPanelOutsideDismiss(
      el,
      () => open,
      closeList,
      '[data-act="cities"]',
    );
  }

  function hide(): void {
    closeList();
  }

  function toggle(): void {
    if (open) closeList();
    else show();
  }

  function update(): void {
    if (open) render();
  }

  function destroy(): void {
    popOverlay('city-list');
    unbindOutside?.();
    unbindOutside = null;
    el.remove();
    if (api?.el === el) api = null;
  }

  api = { el, isOpen: () => open, toggle, show, hide, update, destroy };
  return api;
}

export function getCityListHud(): CityListHudApi | null {
  return api;
}

export function isCityListHudOpen(): boolean {
  return api?.isOpen() ?? false;
}

export function toggleCityListHud(): void {
  api?.toggle();
}

export function showCityListHud(): void {
  api?.show();
}

export function hideCityListHud(): void {
  api?.hide();
}

export function refreshCityListHudIfOpen(): void {
  api?.update();
}

export function destroyCityListHud(): void {
  api?.destroy();
  api = null;
}
