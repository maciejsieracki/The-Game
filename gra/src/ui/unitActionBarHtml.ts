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
  split:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M12 3v18"/><path d="M8 7 4 11l4 4"/><path d="M16 7l4 4-4 4"/>'
    + '</svg>',
  merge:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M8 7 4 11l4 4"/><path d="M16 7l4 4-4 4"/>'
    + '<path d="M12 3v18"/>'
    + '</svg>',
  sentry:
    '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none">'
    + '<path d="M20.7 14.9A9 9 0 1 1 9.4 3.3a7.2 7.2 0 0 0 11.3 11.6z"/>'
    + '</svg>',
  'scout-explore':
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    + '<circle cx="12" cy="12" r="9"/>'
    + '<path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>'
    + '<path d="m8 8 8 8M16 8l-8 8" stroke-width="1.5" opacity=".35"/>'
    + '</svg>',
};

/** Ikony akcji widoczne w kompaktowej karcie (bez rozwiąż w środku — osobno po prawej). */
const COMPACT_ACTION_ORDER = ['fortify', 'sentry', 'scout-explore', 'split', 'merge', 'replace', 'skip'] as const;

export function buildUnitActionBarHtml(actions: readonly UnitPanelAction[]): string {
  const byId = new Map(actions.map(a => [a.id, a]));
  let html = '<div class="uc-act-bar">';

  for (const id of COMPACT_ACTION_ORDER) {
    const a = byId.get(id);
    if (!a) continue;
    const icon = ACTION_ICONS[id];
    if (!icon) continue;
    const onCls = a.active ? ' uc-act-btn--on' : '';
    const ariaPressed = typeof a.active === 'boolean'
      ? ` aria-pressed="${a.active ? 'true' : 'false'}"`
      : '';
    html += `<button type="button" class="uc-act-btn${onCls}" data-act="${esc(id)}"`
      + ` title="${esc(a.label)}" aria-label="${esc(a.label)}"${ariaPressed}`
      + (a.disabled ? ' disabled' : '')
      + `><span class="uc-act-ic">${icon}</span></button>`;
  }

  // P-BITWA-OBLEZENIE-NIE-ANULUJE-ZAKOLEJKOWANEGO-ATAKU (2026-08-16): 'march-stop'
  // (etykieta „Anuluj atak"/„Zatrzymaj", ustalana w main.ts) NIE była w
  // COMPACT_ACTION_ORDER ani w ACTION_ICONS — była wypychana do `actions[]` (zarówno
  // przez istniejącą gałąź hasPlan, jak i nową siegeCity), ale ta funkcja renderowała
  // TYLKO id ze stałej listy + osobno 'disband' -- akcja realnie NIGDY się nie
  // wyświetlała w DOM, niezależnie od stanu gry (potwierdzone żywym testem headless
  // Chromium, nie tylko czytaniem kodu). Etykieta bywa dynamiczna („Anuluj atak" vs
  // „Zatrzymaj"), więc render jako tekstowy przycisk (jak 'disband'), nie ikona.
  // / EN: 'march-stop' (label "Cancel attack"/"Stop", set in main.ts) was in neither
  // COMPACT_ACTION_ORDER nor ACTION_ICONS -- it was pushed into `actions[]` (both by
  // the pre-existing hasPlan branch and the new siegeCity branch), but this function
  // only rendered ids from the fixed list + 'disband' separately -- the action never
  // actually appeared in the DOM regardless of game state (confirmed via a live
  // headless Chromium test, not just reading the code). The label is dynamic ("Cancel
  // attack" vs "Stop"), so render as a text button (like 'disband'), not an icon.
  const marchStop = byId.get('march-stop');
  if (marchStop) {
    html += `<button type="button" class="uc-act-btn uc-act-text" data-act="march-stop"`
      + ` title="${esc(marchStop.label)}" aria-label="${esc(marchStop.label)}"`
      + (marchStop.disabled ? ' disabled' : '')
      + `>${esc(marchStop.label)}</button>`;
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
  padding:0 8px;border-radius:6px;cursor:pointer;box-sizing:border-box;
  background:rgba(18,22,30,.85);border:1px solid rgba(232,216,138,.22);
  color:rgba(200,192,168,.72);transition:border-color .12s,border-width .12s,background .12s,color .12s,box-shadow .12s;}
.uc-act-btn:hover:not(:disabled):not(.uc-act-btn--on){border-color:rgba(232,216,138,.38);
  background:rgba(28,34,44,.92);color:rgba(220,212,188,.88);}
.uc-act-btn--on{border-width:3px;border-color:var(--civ-gold-primary,#e8d88a);
  background:linear-gradient(180deg,rgba(232,216,138,.22),rgba(232,216,138,.08));
  color:var(--civ-gold-primary,#e8d88a);box-shadow:0 0 12px rgba(232,216,138,.22);}
.uc-act-btn--on:hover:not(:disabled){border-color:#f5e6a8;
  background:linear-gradient(180deg,rgba(232,216,138,.28),rgba(232,216,138,.12));
  box-shadow:0 0 14px rgba(232,216,138,.28);}
.uc-act-btn:disabled{opacity:.38;cursor:not-allowed;color:var(--civ-text-primary,#e8e0c8);}
.uc-act-ic{width:17px;height:17px;display:flex;align-items:center;justify-content:center;}
.uc-act-ic svg{width:100%;height:100%;display:block;}
.uc-act-disband{margin-left:auto;font-size:10px;font-weight:700;letter-spacing:.08em;
  color:#ffb0b0!important;border-color:rgba(200,64,64,.45)!important;min-width:72px;}
.uc-act-disband:hover:not(:disabled){border-color:rgba(200,64,64,.65)!important;color:#ffd0d0!important;}
.uc-act-text{min-width:auto;padding:0 10px;font-size:10px;font-weight:700;letter-spacing:.06em;
  text-transform:uppercase;white-space:nowrap;}
`;
