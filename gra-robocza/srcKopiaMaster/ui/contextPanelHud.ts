/**
 * contextPanelHud.ts — panel kontekstowy (strefa C mockupu HUD Mapy 1E).
 */

import { ensureBrandRootTokens, CIV_BRAND_SCOPE_VARS } from './brandTokenVars';

export interface ContextPanelHudConfig {
  /** Treść HTML; null / pusty → panel ukryty (D17=A). */
  getMessage?: () => string | null;
}

export interface ContextPanelHudApi {
  el: HTMLDivElement;
  update: () => void;
  destroy: () => void;
}

const STYLE_ID = 'civ-context-panel-css-w2full';

function ensureStyles(): void {
  ensureBrandRootTokens();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-context-panel{position:fixed;top:300px;right:20px;z-index:310;width:340px;pointer-events:none;
  ${CIV_BRAND_SCOPE_VARS}
  display:none;
  border:1px solid rgba(212,175,90,0.28);border-radius:12px;
  background:linear-gradient(180deg,rgba(14,18,26,0.96),rgba(8,10,16,0.94));padding:16px 18px;
  box-shadow:0 8px 22px rgba(0,0,0,0.45);}
.civ-context-panel .cp-msg{font-size:12px;letter-spacing:.04em;
  color:var(--civ-text-primary,#e8e0c8);line-height:1.55;text-align:left;}
.civ-context-panel .cp-msg b{color:var(--civ-gold-primary,#e8d88a);font-size:13px;}
.civ-context-panel .cp-msg .cp-sub{margin-top:0.35em;font-size:11px;color:var(--civ-text-muted,#a09880);line-height:1.45;}
.civ-context-panel .cp-msg .cp-lbl{color:var(--civ-text-secondary,#c4b890);font-weight:600;}
.civ-context-panel .cp-msg .cp-total{margin-top:0.5em;font-size:12px;color:var(--civ-text-primary,#e8e0c8);}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

export function createContextPanelHud(config: ContextPanelHudConfig = {}): ContextPanelHudApi {
  ensureStyles();
  const el = document.createElement('div');
  el.className = 'civ-context-panel';
  function render(): void {
    const raw = config.getMessage?.() ?? null;
    if (raw === null || raw.trim() === '') {
      el.style.display = 'none';
      el.innerHTML = '';
      return;
    }
    el.style.display = 'block';
    el.innerHTML = `<div class="cp-msg">${raw}</div>`;
  }
  document.body.appendChild(el);
  render();
  return { el, update: render, destroy: () => el.remove() };
}
