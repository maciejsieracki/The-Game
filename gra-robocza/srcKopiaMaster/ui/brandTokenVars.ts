/**
 * Warstwa 1 — wspólne tokeny CSS (decyzje 1B, 2C, 4C, 5C).
 * Kanon: brand-book/eksport/tokens.css → gra/src/ui/icons/brand/tokens.css (PACZKA FINAL).
 * Używane przez mainMenu.ts, newGameFlow.ts, victoryScreen.ts (Etap W1).
 */

import brandTokensCss from './icons/brand/tokens.css?raw';

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

/** :root — zmienne globalne (wstrzykiwane raz na dokument). */
export const CIV_BRAND_ROOT_CSS = brandTokensCss + CIV_ALIASES_CSS;

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

const ROOT_STYLE_ID = 'civ-brand-root-css';

/** Jednorazowe wstrzyknięcie :root tokenów. */
export function ensureBrandRootTokens(): void {
  if (document.getElementById(ROOT_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = ROOT_STYLE_ID;
  style.textContent = CIV_BRAND_ROOT_CSS;
  document.head.appendChild(style);
}
