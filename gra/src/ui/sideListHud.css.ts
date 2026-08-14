/**
 * sideListHud.css.ts — wspólny arkusz stylów + logika prezentacyjna dla list bocznych
 * mapy świata (cityListHud.ts „Miasta", armyListHud.ts „Armie") —
 * MIASTA-ARMIE-PANEL-LEWY-2026-08-14, §5 pkt 1 (rekomendacja integratora: TAK, wspólny
 * plik zamiast zduplikowanego `.cl-*`/`.al-*` w obu plikach).
 *
 * Paleta 3b (ta sama co panel imperium, empireDetailPanel.ts): tło kart #171e2a,
 * obramowanie #2b3543, akcent złoty #d9a441, tekst wyciszony #7d8798, kafelek ikony
 * #1d2634, róg kart 7px. Trzecie złoto (`#e0b24a`, stary --gold obu plików) wypada.
 * / EN: shared stylesheet + presentational logic for the map's left-edge slide-out
 * lists (Cities, Armies) — palette 3b, same as the empire panel.
 */

import { SIDE_PANEL_LEFT, SIDE_PANEL_TOP } from './sidePanelLayout';

const TOP_H = SIDE_PANEL_TOP;
const BOTTOM_BAR_H = 56;
const PANEL_W = 340;
const LEFT_INSET = SIDE_PANEL_LEFT;

export const SIDE_LIST_HUD_STYLE_ID = 'civ-side-list-hud-css-v1';

/** Klasa na elemencie roota panelu, OBOK klasy plikowej (`.civ-city-list-hud` / `.civ-army-list-hud`). */
export const SIDE_LIST_ROOT_CLASS = 'civ-side-list-hud';

/** Wstrzykuje wspólny arkusz raz (idempotentne — sprawdza po ID), niezależnie które z
 *  dwóch paneli montuje się jako pierwsze. */
export function ensureSideListHudStyles(): void {
  if (document.getElementById(SIDE_LIST_HUD_STYLE_ID)) return;
  const css = `
.${SIDE_LIST_ROOT_CLASS}{position:fixed;top:${TOP_H};left:${LEFT_INSET};bottom:calc(${BOTTOM_BAR_H}px + 2mm);
  width:min(24vw,${PANEL_W}px);min-width:260px;max-width:calc(100vw - ${LEFT_INSET} - 12px);z-index:311;display:none;flex-direction:column;
  pointer-events:auto;overflow:hidden;
  background:linear-gradient(90deg,rgba(6,10,20,0.97) 0%,rgba(8,14,28,0.92) 88%,rgba(8,14,28,0.85) 100%);
  border-right:1px solid rgba(212,175,90,0.28);box-shadow:6px 0 28px rgba(0,0,0,0.45);
  font:14px 'Segoe UI',Tahoma,sans-serif;color:#e8ebf0;
  --panel:#171e2a;--border:#2b3543;--muted:#7d8798;--gold:#d9a441;--tile:#1d2634;}
.${SIDE_LIST_ROOT_CLASS}.open{display:flex;}
.${SIDE_LIST_ROOT_CLASS} .sl-header{display:flex;align-items:center;gap:.5em;padding:.7em .75em .6em;
  border-bottom:1px solid var(--border);flex-shrink:0;}
.${SIDE_LIST_ROOT_CLASS} .sl-header-ic{color:var(--gold);display:flex;flex-shrink:0;}
.${SIDE_LIST_ROOT_CLASS} .sl-header-ic svg{display:block;}
.${SIDE_LIST_ROOT_CLASS} .sl-title{font-size:0.98em;font-weight:800;letter-spacing:.04em;
  text-transform:uppercase;color:var(--gold);}
.${SIDE_LIST_ROOT_CLASS} .sl-count{font-size:0.78em;color:var(--muted);margin-left:auto;white-space:nowrap;}
.${SIDE_LIST_ROOT_CLASS} .sl-close{background:none;border:none;color:var(--muted);font-size:1.15em;line-height:1;
  cursor:pointer;padding:0.1em 0.25em;border-radius:4px;margin-left:.4em;flex-shrink:0;}
.${SIDE_LIST_ROOT_CLASS} .sl-close:hover{color:var(--gold);background:rgba(217,164,65,0.1);}
.${SIDE_LIST_ROOT_CLASS} .sl-scroll{flex:1;overflow-y:auto;overflow-x:hidden;padding:0.5rem 0.55rem 0.6rem;}
.${SIDE_LIST_ROOT_CLASS} .sl-scroll::-webkit-scrollbar{width:6px;}
.${SIDE_LIST_ROOT_CLASS} .sl-scroll::-webkit-scrollbar-thumb{background:rgba(217,164,65,0.25);border-radius:3px;}
.${SIDE_LIST_ROOT_CLASS} .sl-item{display:flex;gap:.6em;align-items:flex-start;padding:.55em .6em;
  margin-top:.5em;border-radius:7px;background:var(--panel);border:1px solid var(--border);
  cursor:pointer;transition:background .15s,border-color .15s;}
.${SIDE_LIST_ROOT_CLASS} .sl-item:first-of-type{margin-top:.15em;}
.${SIDE_LIST_ROOT_CLASS} .sl-item:hover{background:#1b2330;border-color:rgba(217,164,65,0.5);}
.${SIDE_LIST_ROOT_CLASS} .sl-item.selected{border-color:#78c95a;background:rgba(45,74,48,0.22);
  box-shadow:inset 2px 0 0 #78c95a;}
.${SIDE_LIST_ROOT_CLASS} .sl-ico{width:26px;height:26px;flex-shrink:0;border-radius:6px;background:var(--tile);
  color:var(--gold);display:flex;align-items:center;justify-content:center;margin-top:0.02em;}
.${SIDE_LIST_ROOT_CLASS} .sl-ico svg{display:block;}
.${SIDE_LIST_ROOT_CLASS} .sl-body{flex:1;min-width:0;}
.${SIDE_LIST_ROOT_CLASS} .sl-name-row{display:flex;align-items:center;gap:.5em;justify-content:space-between;}
.${SIDE_LIST_ROOT_CLASS} .sl-name{font-size:14px;font-weight:700;color:var(--gold);line-height:1.25;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;flex:1;}
.${SIDE_LIST_ROOT_CLASS} .sl-meta{font-size:11px;color:var(--muted);margin-top:.2em;display:flex;
  align-items:center;gap:.3em;}
.${SIDE_LIST_ROOT_CLASS} .sl-meta svg{display:block;flex-shrink:0;}
.${SIDE_LIST_ROOT_CLASS} .sl-badges{display:flex;align-items:center;gap:.3em;flex-shrink:0;flex-wrap:wrap;
  justify-content:flex-end;}
.${SIDE_LIST_ROOT_CLASS} .sl-badge{display:inline-flex;align-items:center;font-size:11px;font-weight:700;
  letter-spacing:.02em;padding:.15em .6em;border-radius:999px;white-space:nowrap;border:1px solid transparent;}
.${SIDE_LIST_ROOT_CLASS} .sl-badge.gold{color:#d9a441;border-color:rgba(217,164,65,.55);background:rgba(217,164,65,.12);}
.${SIDE_LIST_ROOT_CLASS} .sl-badge.neutral{color:#9aa4b2;border-color:rgba(154,164,178,.45);background:rgba(154,164,178,.1);}
.${SIDE_LIST_ROOT_CLASS} .sl-badge.blue{color:#8ec5ff;border-color:rgba(142,197,255,.45);background:rgba(142,197,255,.1);}
.${SIDE_LIST_ROOT_CLASS} .sl-badge.green{color:#78c95a;border-color:rgba(120,201,90,.5);background:rgba(120,201,90,.12);
  text-transform:uppercase;}
.${SIDE_LIST_ROOT_CLASS} .sl-empty{border:1px dashed var(--border);border-radius:8px;padding:1.5em 1em;
  margin-top:.3em;display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:.7em;text-align:center;}
.${SIDE_LIST_ROOT_CLASS} .sl-empty-ico{color:var(--muted);opacity:.55;}
.${SIDE_LIST_ROOT_CLASS} .sl-empty-ico svg{display:block;width:34px;height:34px;}
.${SIDE_LIST_ROOT_CLASS} .sl-empty-msg{font-size:.82em;color:var(--muted);line-height:1.45;}
.${SIDE_LIST_ROOT_CLASS} .sl-hint{font-size:0.72em;color:var(--muted);font-style:italic;margin-top:.5em;
  line-height:1.4;padding:0 .1em;}
`;
  const s = document.createElement('style');
  s.id = SIDE_LIST_HUD_STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

export type SideListBadgeVariant = 'gold' | 'neutral' | 'blue' | 'green';

/** Znacznik HTML jednej plakietki stanu (`.sl-badge`) — tekst zawsze literał sterowany
 *  przez nas (nazwy stanów gry, nie dane wpisywane przez gracza), więc bez `esc()`. */
export function sideListBadgeHtml(text: string, variant: SideListBadgeVariant): string {
  return `<span class="sl-badge ${variant}">${text}</span>`;
}

/** Blok stanu pustego (`.sl-empty`) — ramka przerywana + wyciszona ikona + komunikat. */
export function sideListEmptyStateHtml(iconSvg: string, message: string): string {
  return `<div class="sl-empty"><div class="sl-empty-ico">${iconSvg}</div>`
    + `<div class="sl-empty-msg">${message}</div></div>`;
}

/**
 * Plakietka stanu armii — 3 kolory na 4 wzajemnie wykluczające się stany
 * (MIASTA-ARMIE-PANEL-LEWY-2026-08-14 §3.5, zatwierdzone 2026-08-14 przez właściciela):
 * złoto = stan obronny (garnizon / ufortyfikowana w polu), neutralny = uśpiona (sentry,
 * nic nie robi), błękit = auto-eksploracja (działa sama). Zastępuje dawną JEDNĄ klasę
 * `.al-garnizon-badge` (wszystkie cztery stany identycznym złotem, nieodróżnialne).
 * / EN: army status badge — 3 colors for 4 mutually exclusive states, approved 2026-08-14.
 */
export function armyStatusBadge(entry: {
  inGarnizon?: boolean;
  ufortyfikowanyWPolu?: boolean;
  sentry?: boolean;
  autoExplore?: boolean;
}): { text: string; variant: SideListBadgeVariant } | null {
  if (entry.inGarnizon) return { text: 'w garnizonie', variant: 'gold' };
  if (entry.ufortyfikowanyWPolu) return { text: 'ufortyfikowana w polu', variant: 'gold' };
  if (entry.sentry) return { text: 'uśpiona', variant: 'neutral' };
  if (entry.autoExplore) return { text: 'auto-eksploracja', variant: 'blue' };
  return null;
}

/** % wypełnienia paska (0-100, zaokrąglone, spięte do zakresu) — dzielone przez pasek
 *  produkcji (cityListHud) i paski Zdrowie/Ruch (armyListHud). `max<=0` → 0 (bez dzielenia
 *  przez zero). */
export function pctClamped(value: number, max: number): number {
  if (!(max > 0)) return 0;
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

/** Próg (%), poniżej którego liczba HP dostaje kolor ostrzegawczy `#e07a7a`
 *  (MIASTA-ARMIE-PANEL-LEWY-2026-08-14 §3.4: „Liczba HP przy niskim stanie dostaje
 *  #e07a7a, żeby «11/40» czytało się bez patrzenia na pasek" — dokument nie podaje
 *  liczbowego progu; 30% dobrane tak, by objąć podany przykład 11/40=27,5% i nie
 *  ruszać przykładów 38/40, 18/20 pozostających w kolorze domyślnym). */
export const SIDE_LIST_HP_LOW_THRESHOLD_PCT = 30;

/** Kolor liczby HP (`null` = domyślny, bez inline stylu). */
export function hpValueColor(pct: number): string | null {
  return pct < SIDE_LIST_HP_LOW_THRESHOLD_PCT ? '#e07a7a' : null;
}
