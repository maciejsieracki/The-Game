/**
 * mapToolbarHud.ts — lewy toolbar [C] mapy (mockup HUD Mapy layout 1E).
 * Okrągłe medaliony 52px — bez ramki panelu.
 *
 * Reguła UX (Maciej 2026-07-04): klik poza toolbar → tylko odznacza aktywny tryb.
 * Klik innego medalionu → jednocześnie odznacza stary i aktywuje nowy (jeden klik).
 */

import { iconHtml } from './icons/iconRegistry';
import { scienceOwlIconSized } from './icons/scienceOwlIcon';
import { scienceProgressRingHtml } from './icons/scienceProgressRing';
import { ensureBrandRootTokens, CIV_BRAND_SCOPE_VARS } from './brandTokenVars';
import { TOOLBAR_BTN_PX, TOOLBAR_LEFT_PX, TOOLBAR_TOP_PX } from './hudLayout';

export interface MapToolbarHudConfig {
  onOpenCities?: () => void;
  onOpenScience?: () => void;
  onOpenCulture?: () => void;
  onOpenReligion?: () => void;
  onOpenDiplomacy?: () => void;
  onOpenArmy?: () => void;
  onOpenBuild?: () => void;
  isCityListActive?: () => boolean;
  isArmyListActive?: () => boolean;
  isDiploListActive?: () => boolean;
  isScienceHubActive?: () => boolean;
  /** Postęp badań [0..1] — pierścień na medalionie Nauki. */
  getResearchProgress?: () => number;
  getWarBadge?: () => number;
  isBuildModeActive?: () => boolean;
  isCultureRangeActive?: () => boolean;
  isReligionRangeActive?: () => boolean;
}

export interface MapToolbarHudApi {
  el: HTMLDivElement;
  update: () => void;
  destroy: () => void;
}

const STYLE_ID = 'civ-map-toolbar-hud-css-w2ring2';

/** Re-export geometrii toolbara z hudLayout (kompatybilność importów). */
export { TOOLBAR_BTN_PX, TOOLBAR_LEFT_PX, TOOLBAR_TOP_PX } from './hudLayout';

function ensureStyles(): void {
  ensureBrandRootTokens();
  document.getElementById('civ-map-toolbar-hud-css-v2')?.remove();
  document.getElementById('civ-map-toolbar-hud-css-w2')?.remove();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-map-toolbar{position:fixed;top:${TOOLBAR_TOP_PX}px;left:${TOOLBAR_LEFT_PX}px;z-index:310;
  ${CIV_BRAND_SCOPE_VARS}
  display:flex;flex-direction:column;gap:12px;padding:0;
  background:transparent;border:none;width:auto;font:11px var(--civ-font-ui);}
.civ-map-toolbar .tb{position:relative;width:${TOOLBAR_BTN_PX}px;height:${TOOLBAR_BTN_PX}px;border-radius:50%;cursor:pointer;padding:0;
  border:2px solid var(--tg-gold-dim);background:var(--tg-medallion-bg);
  box-shadow:inset 0 2px 4px rgba(232,216,138,.16),0 4px 10px rgba(0,0,0,.55);
  color:var(--civ-gold-primary);display:flex;align-items:center;justify-content:center;
  transition:border-color .15s,box-shadow .15s,color .15s;}
.civ-map-toolbar .tb.science{border:none;color:#7cb4e4;
  background:radial-gradient(circle at 38% 30%,#12202e,#0a0d14);
  box-shadow:inset 0 2px 4px rgba(90,155,212,.2),0 4px 10px rgba(0,0,0,.55);}
.civ-map-toolbar .tb.science > .civ-science-prog-ring{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}
.civ-map-toolbar .tb.science .tb-ring-wrap{position:relative;width:100%;height:100%;
  display:flex;align-items:center;justify-content:center;z-index:1;}
.civ-map-toolbar .tb:hover{filter:brightness(1.06);}
.civ-map-toolbar .tb.on{border:var(--tg-rant-active);background:rgba(232,216,138,.1);
  box-shadow:inset 0 2px 4px rgba(232,216,138,.2),0 0 20px rgba(232,216,138,.3);color:#f4e6a8;}
.civ-map-toolbar .tb.science.on{border:none;background:radial-gradient(circle at 38% 30%,#1a2838,#0a0d14);
  box-shadow:inset 0 2px 4px rgba(90,155,212,.28),0 0 20px rgba(90,155,212,.35);color:#9ec8f0;}
.civ-map-toolbar .tb.at-war{border-color:rgba(200,64,64,.65);}
.civ-map-toolbar .tb.science .civ-science-owl-ic{width:26px;height:26px;color:#7cb4e4;}
.civ-map-toolbar .tb svg:not(.civ-science-prog-ring),.civ-map-toolbar .tb .civ-ic{width:26px;height:26px;display:block;}
.civ-map-toolbar .badge{position:absolute;top:0;right:0;min-width:14px;height:14px;
  border-radius:7px;background:#c84040;color:#fff;font-size:9px;font-weight:700;
  display:flex;align-items:center;justify-content:center;padding:0 3px;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

function tbIcon(id: 'tb-cities' | 'tb-diplomacy' | 'tb-army' | 'tb-build' | 'tb-science'): string {
  if (id === 'tb-science') return scienceOwlIconSized(26);
  return iconHtml(id, 40).replace(/width="40"/, 'width="26"').replace(/height="40"/, 'height="26"');
}

/** Toolbar imperium — medaliony 1E (strefa B mockupu). */
export function createMapToolbarHud(config: MapToolbarHudConfig): MapToolbarHudApi {
  ensureStyles();
  const el = document.createElement('div');
  el.className = 'civ-map-toolbar';

  function render(): void {
    const wars = config.getWarBadge?.() ?? 0;
    const buildOn = config.isBuildModeActive?.() ?? false;
    const cityListOn = config.isCityListActive?.() ?? false;
    const armyListOn = config.isArmyListActive?.() ?? false;
    const diploListOn = config.isDiploListActive?.() ?? false;
    const scienceOn = config.isScienceHubActive?.() ?? false;
    const researchFrac = config.getResearchProgress?.() ?? 0;
    const scienceRing = scienceProgressRingHtml(researchFrac, 52, 2);

    let html = '';
    html += `<button type="button" class="tb${cityListOn ? ' on' : ''}" data-act="cities" title="Miasto — lista i produkcja">${tbIcon('tb-cities')}</button>`;
    html += `<button type="button" class="tb science${scienceOn ? ' on' : ''}" data-act="science" title="Badania">`
      + `${scienceRing}<span class="tb-ring-wrap">${tbIcon('tb-science')}</span></button>`;
    const diploExtra = (wars > 0 ? ' at-war' : '') + (diploListOn ? ' on' : '');
    html += `<button type="button" class="tb${diploExtra}" data-act="diplo" title="Dyplomacja">${tbIcon('tb-diplomacy')}`
      + (wars > 0 ? `<span class="badge">${wars}</span>` : '') + '</button>';
    html += `<button type="button" class="tb${armyListOn ? ' on' : ''}" data-act="army" title="Wojsko">${tbIcon('tb-army')}</button>`;
    html += `<button type="button" class="tb${buildOn ? ' on' : ''}" data-act="build" title="Budowa ulepszeń">${tbIcon('tb-build')}</button>`;
    el.innerHTML = html;

    const map: Record<string, (() => void) | undefined> = {
      cities: config.onOpenCities,
      science: config.onOpenScience,
      diplo: config.onOpenDiplomacy,
      army: config.onOpenArmy,
      build: config.onOpenBuild,
    };
    el.querySelectorAll('.tb[data-act]').forEach(b => {
      b.addEventListener('click', () => {
        const a = (b as HTMLElement).getAttribute('data-act');
        if (a !== null) map[a]?.();
      });
    });
  }

  document.body.appendChild(el);
  render();
  return { el, update: render, destroy: () => el.remove() };
}
