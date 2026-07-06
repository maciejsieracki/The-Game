/**
 * unitPanelHud.ts — panel jednostki [H] (A-06 · 1E).
 * Dolny środek mapy strategicznej; statystyki od SILNIK/UNITS.
 */

import {
  ensureMapUnitBrandScope,
  mapUnitCloseBtnHtml,
  MAP_UNIT_1E_SHARED_CSS,
} from './mapUnitHudSkin';
import { unitIconSvg } from './icons/brandAssets';

export interface UnitPanelAction {
  id: string;
  label: string;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}

export interface UnitPanelState {
  name: string;
  subtitle: string;
  icon: string;
  atk: number;
  def: number;
  mov: number;
  rng: number;
  hp: number;
  hpMax: number;
  actions: UnitPanelAction[];
}

export interface UnitPanelHudConfig {
  getUnit: () => UnitPanelState | null;
  onAction: (actionId: string) => void;
  onClose: () => void;
}

export interface UnitPanelHudApi {
  el: HTMLDivElement;
  update: () => void;
  destroy: () => void;
}

const STYLE_ID = 'civ-unit-panel-hud-css-v2-1e';

function ensureStyles(): void {
  ensureMapUnitBrandScope();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
${MAP_UNIT_1E_SHARED_CSS}
.civ-unit-panel{position:fixed;bottom:65px;left:50%;transform:translateX(-50%);z-index:311;
  width:min(540px,calc(100vw - 24px));display:none;
  background:linear-gradient(180deg,rgba(18,24,32,.98),rgba(8,10,16,.96));
  border:2px solid rgba(232,216,138,.32);border-radius:12px;
  box-shadow:0 8px 40px rgba(0,0,0,.75);font-family:var(--civ-font-ui,'Segoe UI',Tahoma,sans-serif);
  color:var(--civ-text-primary,#e8e0c8);overflow:hidden;}
.civ-unit-panel.open{display:block;}
.civ-unit-panel .hdr{display:flex;align-items:center;gap:10px;padding:12px 14px;
  border-bottom:1px solid rgba(232,216,138,.18);background:rgba(8,10,16,.55);}
.civ-unit-panel .hdr .ic{font-size:28px;line-height:1;min-width:32px;text-align:center;}
.civ-unit-panel .hdr .info{flex:1;min-width:0;}
.civ-unit-panel .hdr h2{margin:0;font-family:var(--civ-font-title,Georgia,serif);font-size:1.05em;
  font-weight:400;color:var(--civ-gold-primary,#e8d88a);letter-spacing:.04em;}
.civ-unit-panel .hdr .sub{font-size:0.68em;color:var(--civ-text-muted,#8a8070);margin-top:3px;
  letter-spacing:.04em;text-transform:uppercase;}
.civ-unit-panel .body{padding:12px 14px 14px;}
.civ-unit-panel .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px;}
.civ-unit-panel .actions{display:flex;flex-wrap:wrap;gap:6px;}
.civ-unit-panel .act-danger{border-color:rgba(200,64,64,.45)!important;color:#ffb0b0!important;}
.civ-unit-panel .act-danger:hover:not(:disabled){border-color:rgba(200,64,64,.65)!important;color:#ffd0d0!important;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Panel [H] — pełna karta jednostki na dole mapy. */
export function createUnitPanelHud(config: UnitPanelHudConfig): UnitPanelHudApi {
  ensureStyles();
  const el = document.createElement('div');
  el.className = 'civ-unit-panel';

  function render(): void {
    const u = config.getUnit();
    if (u === null) {
      el.classList.remove('open');
      return;
    }
    el.classList.add('open');
    const hpPct = u.hpMax > 0 ? Math.round((u.hp / u.hpMax) * 100) : 0;
    let html = '<div class="hdr"><span class="ic">' + (u.icon || unitIconSvg(undefined)) + '</span>'
      + '<div class="info"><h2>' + esc(u.name) + '</h2><div class="sub">' + esc(u.subtitle) + '</div></div>'
      + mapUnitCloseBtnHtml('Zamknij panel')
      + '</div>'
      + '<div class="body"><div class="stats">'
      + '<div class="mu-stat"><div class="l">Atak</div><div class="v">' + u.atk + '</div></div>'
      + '<div class="mu-stat"><div class="l">Obrona</div><div class="v">' + u.def + '</div></div>'
      + '<div class="mu-stat"><div class="l">Ruch</div><div class="v">' + u.mov + '</div></div>'
      + '<div class="mu-stat"><div class="l">Zasięg</div><div class="v">' + u.rng + '</div></div>'
      + '</div>'
      + '<div class="mu-hp-lbl"><span>HP</span><span>' + u.hp + ' / ' + u.hpMax + '</span></div>'
      + '<div class="mu-hp-bar"><i style="width:' + hpPct + '%"></i></div>'
      + '<div class="actions">';
    for (const a of u.actions) {
      let cls = a.primary ? 'mu-gold-btn' : 'mu-muted-btn';
      if (a.danger) cls += ' act-danger';
      html += '<button type="button" class="' + cls + '" data-act="' + esc(a.id) + '"'
        + (a.disabled ? ' disabled' : '') + '>' + esc(a.label) + '</button>';
    }
    html += '</div></div>';
    el.innerHTML = html;
    el.querySelector('.mu-close-btn')?.addEventListener('click', () => config.onClose());
    el.querySelectorAll('[data-act]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).getAttribute('data-act');
        if (id !== null) config.onAction(id);
      });
    });
  }

  document.body.appendChild(el);
  render();
  return { el, update: render, destroy: () => el.remove() };
}
