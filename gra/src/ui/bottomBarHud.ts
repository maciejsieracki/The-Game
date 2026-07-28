/**
 * bottomBarHud.ts — dolny pasek [I]/[I2]: WYKONAJ + Koniec tury (A1-Q9=A, A1-Q10).
 * WYKONAJ = pierwsze oczekujące wydarzenie; koniec tury zawsze dostępny (Maciej 2026-07-06).
 */

import { brandIconSvg } from './icons/brandAssets';
import { ensureBrandRootTokens, CIV_BRAND_SCOPE_VARS } from './brandTokenVars';
import {
  BOTTOM_BAR_END_TURN_H_PX,
  BOTTOM_BAR_WYKONAJ_H_PX,
  HUD_EDGE_PX,
  HUD_GAP_PX,
  HUD_ZOOM_EDGE_PX,
} from './hudLayout';

export interface BottomBarHudConfig {
  getTurn: () => number;
  getYearLabel?: () => string;
  onExecutePending?: () => void;
  onEndTurn?: () => void;
  /** false tylko gdy playtest / game over (domyślnie true). */
  canEndTurn?: () => boolean;
  /** Liczba oczekujących wydarzeń (do stanu WYKONAJ). */
  getBlockingCount?: () => number;
  /** Ukryj przycisk końca tury (playtest walki). */
  hideEndTurn?: () => boolean;
}

export interface BottomBarHudApi {
  el: HTMLDivElement;
  update: () => void;
  destroy: () => void;
}

const STYLE_ID = 'civ-bottom-bar-hud-css-w2full';

function ensureStyles(): void {
  ensureBrandRootTokens();
  document.getElementById('civ-bottom-bar-hud-css')?.remove();
  document.getElementById('civ-bottom-bar-hud-css-w2')?.remove();
  document.getElementById('civ-bottom-bar-hud-css-w2b')?.remove();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-bottom-bar{position:fixed;bottom:${HUD_EDGE_PX}px;right:${HUD_EDGE_PX}px;z-index:310;width:200px;height:auto;
  ${CIV_BRAND_SCOPE_VARS}
  background:transparent;border:none;display:flex;flex-direction:column;align-items:stretch;
  padding:0;gap:${HUD_GAP_PX}px;font:12px var(--civ-font-ui);}
html.civ-ui-zoom-active .civ-bottom-bar{bottom:${HUD_ZOOM_EDGE_PX}px;right:${HUD_ZOOM_EDGE_PX}px;}
.civ-bottom-bar .spacer{display:none}
.civ-bottom-bar .wykonaj{height:${BOTTOM_BAR_WYKONAJ_H_PX}px;padding:0 18px;border-radius:9px;font-size:13px;font-weight:600;
  letter-spacing:.16em;text-transform:uppercase;cursor:pointer;width:100%;
  border:2px solid rgba(232,216,138,.4);color:var(--civ-gold-primary);
  background:linear-gradient(180deg,#161c28,#0a0d14);font-family:var(--civ-font-ui);}
.civ-bottom-bar .wykonaj.on{animation:civ-wyk-glow 1.5s infinite;border-color:rgba(240,160,64,.75);
  color:#ffc080;background:rgba(208,128,48,.08);border-color:rgba(208,128,48,.55);}
.civ-bottom-bar .wykonaj:disabled{opacity:.35;cursor:not-allowed;pointer-events:none;border-color:rgba(255,255,255,.12);color:var(--civ-text-muted);}
.civ-bottom-bar .end-turn{min-width:0;width:100%;height:${BOTTOM_BAR_END_TURN_H_PX}px;padding:5px 18px;
  display:flex;flex-direction:row;align-items:center;justify-content:center;gap:10px;
  background:linear-gradient(180deg,#f0dc88,#b99a28);
  border:1px solid #6a5212;border-top-color:#f8eea8;border-radius:9px;cursor:pointer;color:#2e2708;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 6px 18px rgba(232,216,138,.22);font-family:var(--civ-font-ui);}
.civ-bottom-bar .end-turn:hover:not(:disabled){filter:brightness(1.04);}
.civ-bottom-bar .end-turn.is-disabled{opacity:.38;cursor:not-allowed;filter:grayscale(.5);box-shadow:none;}
.civ-bottom-bar .end-turn:disabled{opacity:.38;cursor:not-allowed;filter:grayscale(.5);box-shadow:none;}
.civ-bottom-bar .et-meta{display:none;}
.civ-bottom-bar .et-action{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;
  text-transform:uppercase;letter-spacing:.14em;color:#2e2708;}
.civ-bottom-bar .et-turn-lbl{text-align:center;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#8a8070;margin-top:2px;}
@keyframes civ-wyk-glow{0%,100%{box-shadow:none}50%{box-shadow:0 0 16px rgba(208,128,48,.5)}}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

/** Dolny pasek akcji tury (D1B strefa I). */
export function createBottomBarHud(config: BottomBarHudConfig): BottomBarHudApi {
  ensureStyles();
  const el = document.createElement('div');
  el.className = 'civ-bottom-bar';

  function render(): void {
    const blocking = config.getBlockingCount?.() ?? 0;
    const hideEnd = config.hideEndTurn?.() ?? false;
    const canEnd = !hideEnd && (config.canEndTurn?.() ?? true);
    const wykOn = blocking > 0;
    const turn = config.getTurn();
    const year = config.getYearLabel?.() ?? '';

    const endArrow = brandIconSvg('ui-end-turn', 24) || brandIconSvg('ui-play', 24) || '';
    const arrowHtml = endArrow
      ? endArrow.replace(/\swidth="[^"]*"/, ' width="18"').replace(/\sheight="[^"]*"/, ' height="18"')
      : '<span aria-hidden="true">▶</span>';

    const endVisuallyDisabled = hideEnd || !canEnd;

    el.innerHTML = '<button type="button" class="wykonaj' + (wykOn ? ' on' : '') + '" data-wykonaj'
      + (wykOn ? '' : ' disabled') + '>Wykonaj</button>'
      + (hideEnd ? '' : (
        '<button type="button" class="end-turn'
        + (endVisuallyDisabled ? ' is-disabled' : '')
        + '" data-end aria-disabled="' + (endVisuallyDisabled ? 'true' : 'false') + '">'
        + '<span class="et-action">' + arrowHtml + '<span>Zakończ turę</span></span></button>'
      ))
      + '<div class="et-turn-lbl">Tura ' + turn + (year ? ' · ' + year : '') + '</div>';

    el.querySelector('[data-wykonaj]')?.addEventListener('click', () => {
      if (wykOn) config.onExecutePending?.();
    });
    el.querySelector('[data-end]')?.addEventListener('click', () => {
      if (config.hideEndTurn?.()) return;
      config.onEndTurn?.();
    });
  }

  document.body.appendChild(el);
  render();
  return { el, update: render, destroy: () => el.remove() };
}
