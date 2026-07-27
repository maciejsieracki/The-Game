/**
 * Pasek ikon akcji jednostki (fortyfikuj, zastąp, czuwaj, pomiń, rozwiąż) —
 * wspólny dla kompaktowej karty bocznej i (historycznie) armyStackHud.
 */
import type { UnitPanelAction } from './unitPanelHud';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const ACTION_ICONS: Partial<Record<string, string>> = {
  fortify:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M4 21V10l3-2.5V6h2v1.5L12 5l3 2.5V6h2v1.5l3 2.5v11z"/>'
    + '<path d="M4 21h16M9.5 21v-5h5v5"/>'
    + '</svg>',
  'unfortify-all':
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M4 21V10l3-2.5V6h2v1.5L12 5l3 2.5V6h2v1.5l3 2.5v11z"/>'
    + '<path d="M4 21h16M9.5 21v-5h5v5"/>'
    + '</svg>',
  replace:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M7.5 3v14"/><path d="M4.5 6 7.5 3l3 3"/>'
    + '<path d="M16.5 21V7"/><path d="M19.5 18l-3 3-3-3"/>'
    + '</svg>',
  skip:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M5 5l6.5 7-6.5 7"/><path d="M12.5 5l6.5 7-6.5 7"/>'
    + '</svg>',
  sentry:
    '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none">'
    + '<path d="M20.7 14.9A9 9 0 1 1 9.4 3.3a7.2 7.2 0 0 0 11.3 11.6z"/>'
    + '</svg>',
};

/** Ikony akcji widoczne w kompaktowej karcie (bez rozwiąż w środku — osobno po prawej). */
const COMPACT_ACTION_ORDER = ['fortify', 'replace', 'sentry', 'skip'] as const;

export function buildUnitActionBarHtml(actions: readonly UnitPanelAction[]): string {
  const byId = new Map(actions.map(a => [a.id, a]));
  let html = '<div class="uc-act-bar">';

  for (const id of COMPACT_ACTION_ORDER) {
    const a = byId.get(id);
    if (!a) continue;
    const icon = ACTION_ICONS[id];
    if (!icon) continue;
    html += `<button type="button" class="uc-act-btn" data-act="${esc(id)}"`
      + ` title="${esc(a.label)}" aria-label="${esc(a.label)}"`
      + (a.disabled ? ' disabled' : '')
      + `><span class="uc-act-ic">${icon}</span></button>`;
  }

  const disband = byId.get('disband');
  if (disband) {
    html += `<button type="button" class="uc-act-btn uc-act-disband" data-act="disband"`
      + ` title="${esc(disband.label)}" aria-label="${esc(disband.label)}"`
      + (disband.disabled ? ' disabled' : '')
      + `>${esc(disband.label)}</button>`;
  }

  html += '</div>';
  return html;
}

export const UNIT_ACTION_BAR_CSS = `
.uc-act-bar{display:flex;align-items:center;gap:6px;margin-top:10px;padding-top:10px;
  border-top:1px solid rgba(212,175,90,.28);flex-wrap:wrap;}
.uc-act-btn{display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:34px;
  padding:0 8px;border-radius:6px;cursor:pointer;
  background:rgba(18,22,30,.85);border:1px solid rgba(232,216,138,.28);color:var(--civ-text-primary,#e8e0c8);
  transition:border-color .12s,background .12s;}
.uc-act-btn:hover:not(:disabled){border-color:rgba(232,216,138,.5);background:rgba(32,38,48,.95);}
.uc-act-btn:disabled{opacity:.38;cursor:not-allowed;}
.uc-act-ic{width:17px;height:17px;display:flex;align-items:center;justify-content:center;}
.uc-act-ic svg{width:100%;height:100%;display:block;}
.uc-act-disband{margin-left:auto;font-size:10px;font-weight:700;letter-spacing:.08em;
  color:#ffb0b0!important;border-color:rgba(200,64,64,.45)!important;min-width:72px;}
.uc-act-disband:hover:not(:disabled){border-color:rgba(200,64,64,.65)!important;color:#ffd0d0!important;}
`;
