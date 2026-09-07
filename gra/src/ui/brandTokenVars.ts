/**
 * Warstwa 1 — wspólne tokeny CSS (decyzje 1B, 2C, 4C, 5C).
 * Kanon: brand-book/eksport/tokens.css → gra/src/ui/icons/brand/tokens.css (PACZKA FINAL).
 * Używane przez mainMenu.ts, newGameFlow.ts, victoryScreen.ts (Etap W1).
 */

import brandTokensCss from './icons/brand/tokens.css?raw';
import { RESOURCE_COLOR_ROOT_CSS } from './resourceColors';

/** Alias --civ-* → --tg-* (kompatybilność istniejącego lane UI). */
const CIV_ALIASES_CSS = `
:root {
  --civ-bg-deep: var(--tg-bg-deep);
  --civ-panel-bg: var(--tg-panel-bg);
  --civ-gold-primary: var(--tg-gold-primary);
  --civ-gold-dim: var(--tg-gold-dim);
  --civ-gold-border: rgba(232, 216, 138, 0.22);
  --civ-gold-border-strong: rgba(232, 216, 138, 0.45);
  --civ-text-primary: var(--tg-text-primary);
  --civ-text-muted: var(--tg-text-muted);
  --civ-text-pergament: #c8b898;
  --civ-science: var(--tg-science-blue);
  --civ-danger: var(--tg-red);
  --civ-success: var(--tg-green);
  --civ-wiki-accent: #a8c878;
  --civ-font-title: var(--tg-font-title);
  --civ-font-ui: var(--tg-font-ui);
  --civ-radius-btn: var(--tg-radius-btn);
  --civ-radius-panel: var(--tg-radius-panel);
}
`;

/** Globalne scrollbary — złoty thumb na czarnym tracku (Maciej 2026-07-28). */
const CIV_GLOBAL_SCROLLBAR_CSS = `
html {
  scrollbar-width: thin;
  scrollbar-color: #e0b24a #0a0e14;
}
html * {
  scrollbar-width: thin;
  scrollbar-color: #e0b24a #0a0e14;
}
html::-webkit-scrollbar,
html *::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
html::-webkit-scrollbar-track,
html *::-webkit-scrollbar-track {
  background: #0a0e14;
}
html::-webkit-scrollbar-thumb,
html *::-webkit-scrollbar-thumb {
  background: #e0b24a;
  border-radius: 5px;
  border: 2px solid #0a0e14;
}
html::-webkit-scrollbar-thumb:hover,
html *::-webkit-scrollbar-thumb:hover {
  background: #d4af5a;
}
html::-webkit-scrollbar-button,
html *::-webkit-scrollbar-button {
  background: #0a0e14;
  border: 1px solid #1a1f28;
}
html::-webkit-scrollbar-button:hover,
html *::-webkit-scrollbar-button:hover {
  background: #141a22;
}
html::-webkit-scrollbar-corner,
html *::-webkit-scrollbar-corner {
  background: #0a0e14;
}
`;

/** :root — zmienne globalne (wstrzykiwane raz na dokument). */
export const CIV_BRAND_ROOT_CSS = brandTokensCss + CIV_ALIASES_CSS + RESOURCE_COLOR_ROOT_CSS + CIV_GLOBAL_SCROLLBAR_CSS;

/** Alias lokalny w scope menu/kreator (kompatybilność ze starymi var(--gold)). */
export const CIV_BRAND_SCOPE_VARS = `
  --civ-wiki-accent: #a8c878;
  --gold: var(--civ-gold-primary);
  --gold-light: var(--civ-gold-primary);
  --gold-dim: var(--civ-gold-dim);
  --bg-deep: var(--civ-bg-deep);
  --bg-card: var(--civ-panel-bg);
  --bg-card-h: #1a2230;
  --bg-sel: rgba(232, 216, 138, 0.08);
  --border-subtle: var(--civ-gold-border);
  --border-mid: var(--civ-gold-border-strong);
  --border-strong: rgba(232, 216, 138, 0.65);
  --text-primary: var(--civ-text-primary);
  --text-secondary: var(--civ-text-muted);
  --text-muted: #6a6458;
  --text-gold: var(--civ-gold-primary);
  --tx: var(--civ-text-primary);
  --tx2: var(--civ-text-muted);
  --tx-muted: #6a6458;
  --bd-sub: var(--civ-gold-border);
  --bd-mid: var(--civ-gold-border-strong);
  --bd-strong: rgba(232, 216, 138, 0.65);
  --radius: var(--civ-radius-btn);
  --radius-lg: var(--civ-radius-panel);
`;

const ROOT_STYLE_ID = 'civ-brand-root-css-w3-res';

/** Jednorazowe wstrzyknięcie :root tokenów. */
export function ensureBrandRootTokens(): void {
  document.getElementById('civ-brand-root-css')?.remove();
  document.getElementById('civ-brand-root-css-w2-scroll')?.remove();
  if (document.getElementById(ROOT_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = ROOT_STYLE_ID;
  style.textContent = CIV_BRAND_ROOT_CSS;
  document.head.appendChild(style);
}
