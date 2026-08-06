/**
 * cityListHud.ts — lista miast gracza na mapie świata (po kliknięciu 🏛 w toolbarze).
 * Styl jak lewa kolumna panelu miasta (Produkcja).
 */

import { pushOverlay, popOverlay } from './escapeOverlayStack';
import { bindHudPanelOutsideDismiss } from './hudPanelDismiss';
import { SIDE_PANEL_LEFT, SIDE_PANEL_TOP } from './sidePanelLayout';

export interface CityListEntry {
  id: string;
  name: string;
  population: number;
  /** Np. „Stolarnia • 8/20 🔨” lub „Kolejka pusta”. */
  productionLine?: string;
  /** Np. „Garnizon: 2”. */
  metaLine?: string;
}

export interface CityListHudConfig {
  getCities: () => CityListEntry[];
  onSelectCity: (cityId: string) => void;
  /** Po zamknięciu listy (✕, Esc, ponowne 🏛). */
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

const STYLE_ID = 'civ-city-list-hud-css-v2';
const TOP_H = SIDE_PANEL_TOP;
const BOTTOM_BAR_H = 56;
const PANEL_W = 340;
/** Prawa krawędź toolbara mapy + margines (sidePanelLayout.ts) — lista nie zasłania przycisków. */
const LEFT_INSET = SIDE_PANEL_LEFT;

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-city-list-hud{position:fixed;top:${TOP_H};left:${LEFT_INSET};bottom:calc(${BOTTOM_BAR_H}px + 2mm);
  width:min(24vw,${PANEL_W}px);min-width:260px;max-width:calc(100vw - ${LEFT_INSET} - 12px);z-index:311;display:none;flex-direction:column;
  pointer-events:auto;overflow:hidden;
  background:linear-gradient(90deg,rgba(6,10,20,0.97) 0%,rgba(8,14,28,0.92) 88%,rgba(8,14,28,0.85) 100%);
  border-right:1px solid rgba(212,175,90,0.28);box-shadow:6px 0 28px rgba(0,0,0,0.45);
  font:14px 'Segoe UI',Tahoma,sans-serif;color:#e8ebf0;
  --panel:#1e2430;--border:#2e3848;--muted:#8b97a8;--gold:#e0b24a;}
.civ-city-list-hud.open{display:flex;}
.civ-city-list-hud .cl-scroll{flex:1;overflow-y:auto;overflow-x:hidden;padding:0.45rem 0.5rem 0.55rem;}
.civ-city-list-hud .cl-scroll::-webkit-scrollbar{width:6px;}
.civ-city-list-hud .cl-scroll::-webkit-scrollbar-thumb{background:rgba(212,175,90,0.25);border-radius:3px;}
.civ-city-list-hud .panel{background:var(--panel);border:1px solid var(--border);border-radius:6px;
  padding:0.38em 0.52em;box-shadow:0 1px 0 rgba(255,255,255,0.03);}
.civ-city-list-hud .ptitle{font-size:0.74em;font-weight:700;text-transform:uppercase;letter-spacing:.06em;
  color:var(--gold);border-bottom:1px solid var(--border);padding-bottom:0.18em;margin-bottom:0.35em;
  display:flex;justify-content:space-between;align-items:center;gap:0.5em;}
.civ-city-list-hud .cl-close{background:none;border:none;color:var(--muted);font-size:1.15em;line-height:1;
  cursor:pointer;padding:0.1em 0.25em;border-radius:4px;}
.civ-city-list-hud .cl-close:hover{color:var(--gold);background:rgba(224,178,74,0.1);}
.civ-city-list-hud .cl-empty{font-size:0.82em;color:var(--muted);line-height:1.45;padding:0.2em 0.1em;}
.civ-city-list-hud .cl-item{display:flex;gap:0.55em;align-items:flex-start;padding:0.45em 0.35em;
  margin-top:0.28em;border-radius:5px;border:1px solid transparent;cursor:pointer;transition:background .15s,border-color .15s;}
.civ-city-list-hud .cl-item:first-of-type{margin-top:0.15em;}
.civ-city-list-hud .cl-item:hover{background:rgba(224,178,74,0.08);border-color:rgba(224,178,74,0.35);}
.civ-city-list-hud .cl-ico{font-size:1.35em;line-height:1;flex-shrink:0;margin-top:0.05em;}
.civ-city-list-hud .cl-body{flex:1;min-width:0;}
.civ-city-list-hud .cl-name{font-size:1.05em;font-weight:700;color:var(--gold);line-height:1.2;}
.civ-city-list-hud .cl-pop{font-size:0.78em;color:var(--muted);margin-top:0.12em;}
.civ-city-list-hud .cl-prod{font-size:0.78em;color:#d4cba0;margin-top:0.18em;line-height:1.35;}
.civ-city-list-hud .cl-meta{font-size:0.72em;color:var(--muted);margin-top:0.1em;}
.civ-city-list-hud .cl-hint{font-size:0.72em;color:var(--muted);font-style:italic;margin-top:0.45em;line-height:1.4;}
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
  el.className = 'civ-city-list-hud';
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
    const scroll = document.createElement('div');
    scroll.className = 'cl-scroll';
    const panel = document.createElement('div');
    panel.className = 'panel';
    const titleRow = document.createElement('div');
    titleRow.className = 'ptitle';
    const titleLbl = document.createElement('span');
    titleLbl.textContent = 'Miasta';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'cl-close';
    closeBtn.title = 'Zamknij listę (Esc)';
    closeBtn.setAttribute('aria-label', 'Zamknij listę miast');
    closeBtn.textContent = '\u2715';
    closeBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      closeList();
    });
    titleRow.appendChild(titleLbl);
    titleRow.appendChild(closeBtn);
    panel.appendChild(titleRow);

    if (cities.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'cl-empty';
      empty.textContent = 'Brak miast w imperium — załóż pierwsze miasto na mapie.';
      panel.appendChild(empty);
    } else {
      for (const c of cities) {
        const row = document.createElement('div');
        row.className = 'cl-item';
        row.setAttribute('role', 'button');
        row.tabIndex = 0;
        row.title = 'Wejdź do miasta ' + c.name;
        const ico = document.createElement('span');
        ico.className = 'cl-ico';
        ico.textContent = '\u{1F3DB}\uFE0F';
        const body = document.createElement('div');
        body.className = 'cl-body';
        const name = document.createElement('div');
        name.className = 'cl-name';
        name.textContent = c.name;
        body.appendChild(name);
        const pop = document.createElement('div');
        pop.className = 'cl-pop';
        pop.textContent = '\u{1F465} ' + String(c.population) + ' mieszk.';
        body.appendChild(pop);
        if (c.productionLine) {
          const prod = document.createElement('div');
          prod.className = 'cl-prod';
          prod.textContent = c.productionLine;
          body.appendChild(prod);
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
        panel.appendChild(row);
      }
      const hint = document.createElement('div');
      hint.className = 'cl-hint';
      hint.textContent = 'Kliknij miasto, aby wejść. ✕ lub Esc — powrót na mapę. Ponowne 🏛 — zamknij listę.';
      panel.appendChild(hint);
    }

    scroll.appendChild(panel);
    el.innerHTML = '';
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
