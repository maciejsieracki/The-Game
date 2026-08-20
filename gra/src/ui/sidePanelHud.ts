/**
 * sidePanelHud.ts
 * Panel boczny HUD (D1=C) — wydarzenia z tury (mockup HUD Mapy layout 1E strefa H).
 * Karta jednostki: osobny dock lewy-dół, nad minimapą (Maciej 2026-07-28).
 */

import { brandIconSvg } from './icons/brandAssets';
import { ensureBrandRootTokens, CIV_BRAND_SCOPE_VARS } from './brandTokenVars';
import { UNIT_CONTEXT_PANEL_CSS } from './hexContextTooltip';
import {
  eventsPanelBottomPx,
  eventsPanelTopPx,
  HUD_CONTEXT_PANEL_W_PX,
  HUD_EDGE_PX,
  HUD_ZOOM_EDGE_PX,
} from './hudLayout';
import {
  MINIMAP_EDGE_PX,
  UNIT_CARD_ZOOM_LIFT_PER_SCALE_PX,
  unitCardDockBottomCss,
  unitCardDockExpandedWidthCss,
  unitCardDockWidthCss,
  unitCardSafeTopCss,
} from './minimapLayout';
import { SIDE_PANEL_LEFT, SIDE_PANEL_LEFT_PX } from './sidePanelLayout';
import { isDiploObscuringUnitDock } from './unitCtxDockDiploGate';
import { filterSidePanelEvents } from './sidePanelEventFilter';

export type SidePanelEventKind = 'science' | 'culture' | 'city' | 'unit' | 'enemy' | 'info' | 'diplo';

export interface SidePanelEvent {
  id: string;
  icon: string;
  title: string;
  subtitle?: string;
  kind: SidePanelEventKind;
  blocking?: boolean;
  /** SPICH-AUTO-Q1: wymusza czerwony styl (jak wydarzenia negatywne). */
  negative?: boolean;
  /** R-WYDARZENIA-FILTR-KATEGORII: wpis „nie-nasz" (dziś wyłącznie handel AI↔AI) —
   * chip 🌍 „Inne cyw." (domyślnie wyłączony) go filtruje. Wszystkie inne źródła
   * SidePanelEvent są już filtrowane w silniku do par z udziałem gracza, więc nie
   * potrzebują tego pola. */
  origin?: 'other-civs';
}

export type ContextPanelKind = 'hex' | 'unit';

export interface ContextPanelData {
  kind: ContextPanelKind;
  html: string;
  /** Własna jednostka gracza — karta pokazuje strzałki cyklowania ◀▶ zamiast nagłówka
   * (R-KARTA-JEDNOSTKI-STRZALKI-CYKL, Maciej 2026-08-09). */
  ownUnit?: boolean;
  /** Jednostka — przycisk „Więcej szczegółów” w panelu bocznym. */
  expandable?: boolean;
  /** Przycisk rozwijania jest już w html (nad paskiem akcji). */
  expandInHtml?: boolean;
}

export interface SidePanelHudConfig {
  getEvents?: () => SidePanelEvent[];
  /** @deprecated użyj getContextPanel */
  getHexContext?: () => string | null;
  /** Karta kontekstu mapy (heks / jednostka) nad wydarzeniami. */
  getContextPanel?: () => ContextPanelData | null;
  onContextExpand?: () => void;
  isContextExpanded?: () => boolean;
  onContextAction?: (actionId: string) => void;
  onContextSelectUnit?: (unitId: string) => void;
  /** Strzałki ◀▶ karty własnej jednostki — cyklowanie do sąsiedniej armii gracza. */
  onContextCycleUnit?: (delta: -1 | 1) => void;
  /** Czy jest >1 armia gracza do cyklowania (steruje disabled strzałek). */
  canContextCycleUnit?: () => boolean;
  onEventClick?: (id: string) => void;
  onEventDismiss?: (id: string) => void;
  /** R-WYDARZENIA-FILTR-KATEGORII: „Usuń wszystkie" — silnik decyduje co to znaczy
   * (patrz main.ts clearAllSidePanelEvents: iteruje NIEfiltrowaną listę, więc kasuje
   * też wpisy ukryte chipem 🌍 „Inne cyw." — to jest zamierzone). */
  onDismissAll?: () => void;
}

export interface SidePanelHudApi {
  /** Wydarzenia — prawy dolny róg. */
  el: HTMLDivElement;
  /** Karta jednostki — lewy dolny róg, nad minimapą. */
  ctxEl: HTMLDivElement;
  update: () => void;
  destroy: () => void;
}

const STYLE_ID = 'civ-side-panel-hud-css-w10-ctx-passthrough';
const EVENTS_PANEL_TOP = eventsPanelTopPx();
const EVENTS_PANEL_BOTTOM = eventsPanelBottomPx();
const EVENTS_PANEL_BOTTOM_ZOOM = eventsPanelBottomPx(true);
const MINIMAP_EDGE = MINIMAP_EDGE_PX;

function eventIconHtml(kind: SidePanelEventKind, fallback: string): string {
  const map: Partial<Record<SidePanelEventKind, string>> = {
    city: 'cp-labor',
    enemy: 'chip-warning',
    science: 'res-science',
    culture: 'res-culture',
    unit: 'tb-army',
    diplo: 'tb-diplomacy',
  };
  const id = map[kind];
  if (id) {
    const svg = brandIconSvg(id, 24);
    if (svg) {
      return svg.replace('<svg ', '<svg class="sp-ic-svg" ');
    }
  }
  return fallback;
}

function ensureStyles(): void {
  ensureBrandRootTokens();
  document.getElementById('civ-side-panel-hud-css')?.remove();
  document.getElementById('civ-side-panel-hud-css-w2')?.remove();
  document.getElementById('civ-side-panel-hud-css-w2full')?.remove();
  document.getElementById('civ-side-panel-hud-css-w3-zoom-cap')?.remove();
  document.getElementById('civ-side-panel-hud-css-w3-unit-dock2')?.remove();
  document.getElementById('civ-side-panel-hud-css-w3-unit-dock3')?.remove();
  document.getElementById('civ-side-panel-hud-css-w3-unit-dock4')?.remove();
  document.getElementById('civ-side-panel-hud-css-w5-events-pin')?.remove();
  document.getElementById('civ-side-panel-hud-css-w7-unit-lift')?.remove();
  document.getElementById('civ-side-panel-hud-css-w8-unit-safe-rect')?.remove();
  document.getElementById('civ-side-panel-hud-css-w9-unit-expand-h')?.remove();
  if (document.getElementById(STYLE_ID)) return;
  const unitCardMaxRight = `${SIDE_PANEL_LEFT_PX + MINIMAP_EDGE}px`;
  const css = `
.civ-side-panel{position:fixed;top:${EVENTS_PANEL_TOP}px;bottom:${EVENTS_PANEL_BOTTOM}px;right:${HUD_EDGE_PX}px;z-index:305;width:${HUD_CONTEXT_PANEL_W_PX}px;pointer-events:none;
  /* P-BITWA-MARSZ-POTEM-ATAK-NIE-KOLEJKUJE Przyczyna A runda 1 (2026-08-15): kontener jest
     wysoki na cały pion mapy (top..bottom), ale karty wydarzeń wypełniają go tylko częściowo —
     reszta to przezroczyste tło pokazujące canvas. pointer-events:auto na CAŁYM prostokącie
     połykało klik gracza w tę pustą przestrzeń, mimo że wizualnie widać było mapę. Kontener
     zostaje pointer-events:none na stałe; scroll (runda 2, patrz .sp-scroll niżej) i realna,
     widoczna treść (karty/pasek narzędzi) dostają auto z powrotem osobno.
     EN: container spans the full panel height but event cards only fill part of it — the rest
     is transparent background showing the canvas through. pointer-events:auto on the WHOLE
     rectangle swallowed clicks landing in that empty space. Container stays pointer-events:none
     permanently; scroll (round 2, see .sp-scroll below) and real, visible content (cards/
     toolbar) get auto back separately. */
  ${CIV_BRAND_SCOPE_VARS}
  font:13px var(--civ-font-ui);}
html.civ-ui-zoom-active .civ-side-panel{top:${EVENTS_PANEL_TOP}px;bottom:${EVENTS_PANEL_BOTTOM_ZOOM}px;right:${HUD_ZOOM_EDGE_PX}px;}
.civ-side-panel .sp-scroll{
  /* Przyczyna A runda 2 (Evaluator FAIL na d8c3bc78, 2026-08-15): overflow-y:auto/scrollbar-
     gutter przeniesione z ZEWNĘTRZNEGO kontenera (.civ-side-panel, pointer-events:none) na TEN
     wewnętrzny wrapper (pointer-events:auto). height:max-content dopasowuje wrapper do realnej
     wysokości treści — gdy wydarzeń mało, wrapper jest niski i pusty „ogon" kontenera POD nim
     zostaje bez elementu z pointer-events:auto, więc klik nadal przechodzi do canvasu (fix
     rundy 1 nienaruszony). max-height:100% ogranicza wrapper do wysokości kontenera — gdy
     wydarzeń dużo (>~11, collectTurnEvents() w main.ts bez limitu), wrapper wypełnia cały pion
     i STAJE SIĘ scrollowalny (kółko myszy + pasek przewijania łapalne), bo to on, nie kontener,
     niesie pointer-events:auto.
     EN: overflow-y:auto/scrollbar-gutter moved from the OUTER container (.civ-side-panel,
     pointer-events:none) onto this inner wrapper (pointer-events:auto). height:max-content
     sizes the wrapper to real content height — few events -> short wrapper, the empty "tail"
     below it carries no pointer-events:auto element, so clicks still pass through to the canvas
     (round-1 fix intact). max-height:100% caps the wrapper at the container's height — many
     events (>~11, collectTurnEvents() in main.ts has no cap) -> wrapper fills the full column
     and BECOMES scrollable (wheel + draggable scrollbar work), because it — not the container —
     carries pointer-events:auto. */
  pointer-events:auto;height:max-content;max-height:100%;
  overflow-y:auto;overflow-x:hidden;
  overscroll-behavior:contain;scrollbar-gutter:stable;
  display:flex;flex-direction:column;gap:8px;width:100%;box-sizing:border-box;}
.civ-side-ctx-dock{position:fixed;left:${SIDE_PANEL_LEFT};top:${unitCardSafeTopCss()};bottom:${unitCardDockBottomCss()};
  --civ-unit-card-max-right:${unitCardMaxRight};
  z-index:316;width:${unitCardDockWidthCss()};pointer-events:none;
  display:none;
  transition:width .18s ease;
  ${CIV_BRAND_SCOPE_VARS}
  font:13px var(--civ-font-ui);}
.civ-side-ctx-dock.open{display:block;pointer-events:none;}
.civ-side-ctx-dock.sp-ctx-expanded{width:${unitCardDockExpandedWidthCss()};}
.civ-side-ctx-dock .sp-ctx-scroll{
  /* P-SIDEPANEL-CTX-DOCK-SCROLL-MARTWY (2026-08-16): ten sam wzorzec naprawy co
     .civ-side-panel .sp-scroll (Przyczyna A runda 2, commit e975cbc9) — overflow-y:auto/
     scrollbar-gutter przeniesione z ZEWNĘTRZNEGO kontenera (.civ-side-ctx-dock,
     pointer-events:none, bez zmian) na TEN wewnętrzny wrapper (pointer-events:auto). Recon
     potwierdził realny (nie hipotetyczny) trigger przepełnienia: karta armii
     (buildUnitStackCardsHtml w hexContextTooltip.ts, zasilana przez playerStackAt() w main.ts,
     BEZ limitu liczby jednostek w stosie) renderuje jeden wiersz .sp-unit-stack-card na każdą
     jednostkę na heksie — przy kilkunastu+ jednostkach w jednej armii karta łatwo przekracza
     wysokość doku (top..bottom liczone z unitCardSafeTopCss()/unitCardDockBottomCss(), typowo
     kilkaset px). height:max-content dopasowuje wrapper do realnej wysokości treści (mała karta
     -> krótki wrapper, pusty „ogon" doku pod nim nadal przepuszcza klik do canvasu — fix rundy 1
     Przyczyny A pozostaje nienaruszony wzorcem). max-height:100% ogranicza wrapper do wysokości
     doku -> rozbudowany stos jednostek wypełnia cały pion i STAJE SIĘ scrollowalny (kółko myszy
     + pasek przewijania łapalne), bo to wrapper, nie kontener, niesie pointer-events:auto.
     EN: same fix pattern as .civ-side-panel .sp-scroll (Przyczyna A round 2, commit e975cbc9) —
     overflow-y:auto/scrollbar-gutter moved from the OUTER container (.civ-side-ctx-dock,
     pointer-events:none, unchanged) onto this inner wrapper (pointer-events:auto). Recon
     confirmed a real (not hypothetical) overflow trigger: the army stack card
     (buildUnitStackCardsHtml in hexContextTooltip.ts, fed by playerStackAt() in main.ts, with NO
     cap on unit count) renders one .sp-unit-stack-card row per unit on the hex — a dozen-plus
     stacked units easily exceeds the dock's height (top..bottom from unitCardSafeTopCss()/
     unitCardDockBottomCss(), typically a few hundred px). height:max-content sizes the wrapper to
     real content height (short card -> short wrapper, the empty "tail" below it still passes
     clicks to the canvas — round-1 fix stays intact by the same pattern). max-height:100% caps
     the wrapper at the dock's height -> a large stack fills the full column and BECOMES
     scrollable (wheel + draggable scrollbar work), since the wrapper — not the container —
     carries pointer-events:auto. */
  pointer-events:auto;height:max-content;max-height:100%;
  overflow-y:auto;overflow-x:hidden;
  overscroll-behavior:contain;scrollbar-gutter:stable;
  width:100%;box-sizing:border-box;}
html.civ-ui-zoom-active .civ-side-ctx-dock{left:${SIDE_PANEL_LEFT};
  top:${unitCardSafeTopCss()};
  bottom:calc(${unitCardDockBottomCss(true)} + (var(--civ-ui-zoom, 1) - 1) * ${UNIT_CARD_ZOOM_LIFT_PER_SCALE_PX}px);}
.civ-side-panel .sp-header{font-size:10px;color:var(--civ-text-muted);text-transform:uppercase;
  letter-spacing:.24em;text-align:right;padding-right:4px;margin-bottom:2px;}
.civ-side-panel .sp-toolbar{display:flex;align-items:center;justify-content:flex-end;gap:6px;
  padding:0 4px 2px;margin-bottom:2px;pointer-events:auto;}
.civ-side-panel .sp-toolbar-chip{font:10px var(--civ-font-ui);letter-spacing:.06em;
  color:var(--civ-text-muted);background:rgba(20,26,38,.7);border:1px solid rgba(232,216,138,.22);
  border-radius:999px;padding:3px 9px;cursor:pointer;transition:border-color .15s,color .15s,background .15s;}
.civ-side-panel .sp-toolbar-chip:hover{border-color:rgba(232,216,138,.4);}
.civ-side-panel .sp-toolbar-chip.sp-toolbar-chip-active{color:var(--civ-gold-primary);
  border-color:var(--civ-gold-primary);background:rgba(232,216,138,.14);}
.civ-side-panel .sp-toolbar-dismiss-all{font:10px var(--civ-font-ui);letter-spacing:.06em;
  color:var(--civ-text-muted);background:transparent;border:1px solid rgba(232,216,138,.22);
  border-radius:999px;padding:3px 9px;cursor:pointer;transition:border-color .15s,color .15s;}
.civ-side-panel .sp-toolbar-dismiss-all:hover{border-color:var(--tg-red);color:var(--tg-red);}
/* R-TRZY-KARTY-WDROZENIE-Q1 runda 2, Karta 3 (2026-08-20): blokująca vs informacyjna —
   różnica jest w KSZTAŁCIE i GRUBOŚCI rantu (--tg-border-blocking), nie w kolorystyce.
   Jedyny dopuszczony drugi kolor to lewa krawędź karty informacyjnej: złoto (neutralna/
   korzystna) albo --tg-orange (niekorzystna: wojna, utrata szlaku, eliminacja) — patrz
   isAdverseInfoEvent() niżej. Kanon złota zostaje jedynym akcentem wszędzie indziej. */
.civ-side-panel .sp-event{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;
  cursor:pointer;transition:border-color .15s,box-shadow .15s,background .15s;pointer-events:auto;
  background:linear-gradient(180deg,rgba(20,26,34,.96),rgba(10,13,19,.96));
  border:1px solid rgba(232,216,138,.28);border-left:3px solid var(--tg-gold-primary);}
.civ-side-panel .sp-event:hover{border-color:rgba(232,216,138,.45);}
.civ-side-panel .sp-event:focus-visible{outline:2px solid var(--tg-focus-ring,var(--tg-gold-primary));outline-offset:2px;}
.civ-side-panel .sp-event.sp-info-adverse{border-left-color:var(--tg-orange);}
.civ-side-panel .sp-kicker{display:block;font-size:8.5px;letter-spacing:.18em;text-transform:uppercase;
  color:var(--civ-text-muted);font-weight:700;}

/* Blokująca — rozwinięta: dokładnie jedna, zawsze pierwsza w kolejce (kolejka, nie stos). */
.civ-side-panel .sp-event.sp-blocking.sp-expanded{cursor:default;flex-direction:column;align-items:stretch;
  padding:0;gap:0;overflow:hidden;
  border:var(--tg-border-blocking,3px) solid var(--tg-gold-primary);border-radius:12px;
  background:linear-gradient(180deg,rgba(30,24,20,.99),rgba(10,10,14,.99));
  box-shadow:0 12px 32px rgba(0,0,0,.65),var(--tg-glow-gold);}
.civ-side-panel .sp-blk-stripe{height:5px;flex:none;
  background:repeating-linear-gradient(135deg,var(--tg-gold-primary) 0 10px,var(--tg-gold-dim) 10px 20px);}
.civ-side-panel .sp-blk-body{display:flex;align-items:flex-start;gap:11px;padding:13px 14px 11px;}
.civ-side-panel .sp-blk-kicker-row{display:flex;align-items:center;gap:8px;}
.civ-side-panel .sp-badge-decision{font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:#0c1018;
  background:linear-gradient(180deg,#ffe08a,#e0b24a);border-radius:4px;padding:2px 7px;font-weight:700;
  white-space:nowrap;}
.civ-side-panel .sp-blk-hint{font-size:10.5px;color:#a89a80;}
.civ-side-panel .sp-event.sp-expanded .sp-ico{width:42px;height:42px;border-radius:10px;
  border:2px solid var(--tg-gold-primary);background:var(--tg-medallion-bg);}
.civ-side-panel .sp-event.sp-expanded .sp-ico .sp-ic-svg{width:22px;height:22px;}
.civ-side-panel .sp-event.sp-expanded .sp-title{font-family:var(--tg-font-title);font-size:16px;color:#f4e6a8;
  line-height:1.24;}
.civ-side-panel .sp-event.sp-expanded .sp-sub{font-size:12px;color:#e0d4b8;margin-top:5px;}
.civ-side-panel .sp-action-bar{display:flex;flex-direction:column;gap:7px;padding:11px 14px 13px;
  border-top:2px solid rgba(232,216,138,.32);background:rgba(232,216,138,.07);}
.civ-side-panel .sp-action-row{display:flex;gap:8px;flex-wrap:wrap;}
.civ-side-panel .sp-action-btn{flex:1;min-width:110px;padding:9px 12px;font-size:12px;text-align:center;
  font-family:var(--civ-font-ui);}
.civ-side-panel .sp-action-btn:focus-visible{outline:2px solid var(--tg-focus-ring,var(--tg-gold-primary));outline-offset:2px;}
.civ-side-panel .sp-action-ignore{align-self:flex-start;padding:4px 2px;border:0;background:transparent;
  color:var(--civ-text-muted);font-size:11.5px;cursor:pointer;font-family:inherit;text-decoration:underline;
  text-underline-offset:3px;}
.civ-side-panel .sp-action-ignore:hover{color:#c8b898;}
.civ-side-panel .sp-action-ignore:focus-visible{outline:2px solid var(--tg-focus-ring,var(--tg-gold-primary));outline-offset:2px;}

/* Blokująca — zwinięta w kolejce (druga i kolejne): „Rozpatrz →", rant 2px. */
.civ-side-panel .sp-event.sp-blocking.sp-collapsed{padding:10px 12px;border:2px solid rgba(232,216,138,.55);
  border-left:2px solid rgba(232,216,138,.55);border-radius:10px;
  background:linear-gradient(180deg,rgba(28,24,22,.9),rgba(12,12,16,.9));}
.civ-side-panel .sp-event.sp-collapsed:hover{border-color:var(--tg-gold-primary);box-shadow:0 0 16px rgba(232,216,138,.28);}
.civ-side-panel .sp-event.sp-collapsed .sp-ico{width:28px;height:28px;border-radius:8px;
  border:1px solid rgba(232,216,138,.4);background:#26201a;}
.civ-side-panel .sp-event.sp-collapsed .sp-ico .sp-ic-svg{width:15px;height:15px;}
.civ-side-panel .sp-event.sp-collapsed .sp-title{font-family:var(--tg-font-title);font-size:14.5px;color:#f4e6a8;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.civ-side-panel .sp-collapsed-cta{flex:none;font-size:11.5px;color:var(--tg-gold-primary);font-weight:700;
  white-space:nowrap;margin-left:auto;}

/* Informacyjna — pozioma i niska, rant 1px + akcent 3px na lewej krawędzi, zero poświaty. */
.civ-side-panel .sp-event:not(.sp-blocking) .sp-ico{width:28px;height:28px;border-radius:8px;
  border:1px solid rgba(232,216,138,.24);background:#1a2230;}
.civ-side-panel .sp-event:not(.sp-blocking) .sp-ico .sp-ic-svg{width:15px;height:15px;opacity:.9;}
.civ-side-panel .sp-event:not(.sp-blocking) .sp-title{font-family:var(--tg-font-title);font-size:13.5px;
  color:#f4e6a8;margin-top:2px;}
.civ-side-panel .sp-event:not(.sp-blocking) .sp-sub{font-size:11px;color:#c8b898;margin-top:1px;}

.civ-side-panel .sp-ico{width:32px;height:32px;flex:none;border-radius:50%;
  background:var(--tg-medallion-bg);border:1.5px solid var(--tg-gold-dim);
  display:flex;align-items:center;justify-content:center;color:var(--civ-gold-primary);}
.civ-side-panel .sp-ico .sp-ic-svg{width:17px;height:17px;display:block;}
.civ-side-panel .sp-ico-emoji{font-size:16px;line-height:1;}
.civ-side-panel .sp-title{font-size:13px;color:var(--civ-text-primary);}
.civ-side-panel .sp-sub{font-size:11px;color:var(--civ-text-muted);margin-top:2px;}
.civ-side-panel .sp-close{font-size:10px;color:var(--civ-text-muted);cursor:pointer;padding:2px 4px;margin-left:auto;
  border-radius:6px;}
.civ-side-panel .sp-close:hover{color:var(--civ-gold-primary);}
.civ-side-panel .sp-close:focus-visible{outline:2px solid var(--tg-focus-ring,var(--tg-gold-primary));outline-offset:2px;}
.civ-side-panel .sp-toolbar-chip:focus-visible,.civ-side-panel .sp-toolbar-dismiss-all:focus-visible{
  outline:2px solid var(--tg-focus-ring,var(--tg-gold-primary));outline-offset:2px;}
.civ-side-panel .sp-placeholder{font-size:10px;color:#7a7055;text-align:right;padding:8px 4px;font-style:italic;line-height:1.4;}
.civ-side-ctx-dock.open .sp-ctx-card{pointer-events:auto;}
.civ-side-ctx-dock .sp-ctx-card,.civ-side-panel .sp-ctx-card{padding:14px 16px 16px;border-radius:10px;margin-bottom:0;
  background:linear-gradient(180deg,rgba(24,30,42,.98),rgba(10,12,18,.96));
  border:1px solid rgba(212,175,90,.38);box-shadow:0 6px 18px rgba(0,0,0,.45);}
.civ-side-panel .sp-ctx-card{margin-bottom:10px;}
.civ-side-ctx-dock .sp-ctx-card.sp-ctx-interactive,.civ-side-panel .sp-ctx-card{pointer-events:auto;}
.civ-side-ctx-dock .sp-ctx-head,.civ-side-panel .sp-ctx-head{font-size:10px;color:var(--civ-text-muted,#a09880);text-transform:uppercase;
  letter-spacing:.22em;margin-bottom:8px;text-align:right;}
.civ-side-ctx-dock .sp-ctx-nav,.civ-side-panel .sp-ctx-nav{display:flex;gap:8px;margin-bottom:10px;}
.civ-side-ctx-dock .sp-ctx-nav-arr,.civ-side-panel .sp-ctx-nav-arr{flex:1 1 0;padding:6px 10px;border-radius:6px;
  border:1px solid rgba(212,175,90,.35);background:rgba(20,26,36,.75);
  color:var(--civ-gold-primary,#e8d88a);font-size:13px;line-height:1;
  cursor:pointer;font-family:inherit;text-align:center;}
.civ-side-ctx-dock .sp-ctx-nav-arr:hover,.civ-side-panel .sp-ctx-nav-arr:hover{border-color:rgba(212,175,90,.55);background:rgba(28,34,46,.9);}
.civ-side-ctx-dock .sp-ctx-nav-arr:disabled,.civ-side-panel .sp-ctx-nav-arr:disabled{opacity:.35;cursor:default;}
.civ-side-ctx-dock .cp-msg,.civ-side-panel .sp-ctx-card .cp-msg{font-size:12px;color:var(--civ-text-primary,#e8e0c8);line-height:1.55;text-align:left;}
.civ-side-ctx-dock .sp-ctx-expand,.civ-side-panel .sp-ctx-expand{display:block;width:100%;margin-top:10px;padding:6px 10px;border-radius:6px;
  border:1px solid rgba(212,175,90,.35);background:rgba(20,26,36,.75);
  color:var(--civ-gold-primary,#e8d88a);font-size:10px;letter-spacing:.12em;text-transform:uppercase;
  cursor:pointer;font-family:inherit;text-align:center;}
.civ-side-ctx-dock .sp-ctx-expand:hover,.civ-side-panel .sp-ctx-expand:hover{border-color:rgba(212,175,90,.55);background:rgba(28,34,46,.9);}
.civ-side-ctx-dock .cp-hero-names,.civ-side-panel .sp-ctx-card .cp-hero-names{font-size:15px;font-weight:700;color:var(--civ-gold-primary,#e8d88a);
  line-height:1.4;margin-bottom:4px;}
.civ-side-ctx-dock .cp-hero-sub,.civ-side-panel .sp-ctx-card .cp-hero-sub{font-size:10px;color:var(--civ-text-muted,#a09880);margin-bottom:8px;}
.civ-side-ctx-dock .cp-sub,.civ-side-panel .sp-ctx-card .cp-sub{margin-top:0.35em;font-size:11px;color:var(--civ-text-muted,#a09880);line-height:1.45;}
.civ-side-ctx-dock .cp-lbl,.civ-side-panel .sp-ctx-card .cp-lbl{color:var(--civ-text-secondary,#c4b890);font-weight:600;}
.civ-side-ctx-dock .cp-total,.civ-side-panel .sp-ctx-card .cp-total{margin-top:0.5em;font-size:12px;color:var(--civ-text-primary,#e8e0c8);}
.civ-side-ctx-dock .cp-yield-head,.civ-side-panel .sp-ctx-card .cp-yield-head{margin-top:0.65em;font-size:10px;text-transform:uppercase;
  letter-spacing:.18em;color:var(--civ-gold-primary,#c4b890);font-weight:600;}
.civ-side-ctx-dock .cp-yield-row,.civ-side-panel .sp-ctx-card .cp-yield-row{margin-top:0.25em;font-size:11px;color:var(--civ-text-primary,#e8e0c8);line-height:1.45;}
.civ-side-ctx-dock .cp-yield-lbl,.civ-side-panel .sp-ctx-card .cp-yield-lbl{color:var(--civ-text-secondary,#c4b890);font-weight:600;}
.civ-side-ctx-dock .cp-yield-detail,.civ-side-panel .sp-ctx-card .cp-yield-detail{color:var(--civ-text-muted,#a09880);font-size:10px;}
.civ-side-ctx-dock .cp-magazyn-line,.civ-side-panel .sp-ctx-card .cp-magazyn-line{color:#9ec8e8;font-size:10px;}
.civ-side-ctx-dock .cp-magazyn-block,.civ-side-panel .sp-ctx-card .cp-magazyn-block{color:#b8d4ec;font-size:11px;line-height:1.5;}
.civ-side-ctx-dock .cp-yield-foot,.civ-side-panel .sp-ctx-card .cp-yield-foot{margin-top:0.35em;font-size:9px;color:var(--civ-text-muted,#8a8070);line-height:1.4;}
.civ-side-ctx-dock .cp-possible,.civ-side-panel .sp-ctx-card .cp-possible{margin-top:0.2em;font-size:10px;line-height:1.4;}
.civ-side-ctx-dock .cp-unit-head,.civ-side-panel .sp-ctx-card .cp-unit-head{margin-top:0.65em;padding-top:0.55em;border-top:1px solid rgba(212,175,90,.22);}
.civ-side-ctx-dock .cp-sep,.civ-side-panel .sp-ctx-card .cp-sep{height:1px;margin:0.55em 0;background:rgba(212,175,90,.22);}
${UNIT_CONTEXT_PANEL_CSS}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

const PLACEHOLDER_EVENTS: SidePanelEvent[] = [
  {
    id: 'ph-prod',
    icon: '',
    title: 'Produkcja: Rzym',
    subtitle: 'Kolejka pusta — wybierz budynek',
    kind: 'city',
  },
];

/** R-TRZY-KARTY-WDROZENIE-Q1 runda 2: jedyny drugi kolor karty informacyjnej — pomarańcz
 * dla niekorzystnych (wojna, utrata szlaku, eliminacja), złoto (domyślne) dla reszty. */
function isAdverseInfoEvent(ev: SidePanelEvent): boolean {
  return ev.negative === true || ev.kind === 'enemy';
}

/** Karta buntu w toku (nie ostrzeżenie przed buntem) — jedyna z przyciskiem „Zignoruj".
 * Dopasowanie po prefiksie id, bo dzisiejszy SidePanelEvent nie niesie osobnego pola —
 * main.ts produkuje 'revolt-' + city.id dla buntu i 'revolt-warn-' + city.id dla
 * ostrzeżenia (poza allowlistą tej rundy, patrz raport). */
function isIgnorableRevoltEvent(ev: SidePanelEvent): boolean {
  return ev.blocking === true && ev.id.startsWith('revolt-') && !ev.id.startsWith('revolt-warn-');
}

/** Prosta polska pluralizacja dla licznika kolejki („1 wymaga" / „2 wymagają"). */
function pluralPl(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

function resolveContextPanel(config: SidePanelHudConfig): ContextPanelData | null {
  const panel = config.getContextPanel?.() ?? null;
  if (panel !== null && panel.html.trim() !== '') return panel;
  const legacy = config.getHexContext?.() ?? null;
  if (legacy !== null && legacy.trim() !== '') {
    return { kind: 'hex', html: legacy };
  }
  return null;
}

function contextHeadLabel(kind: ContextPanelKind): string {
  return kind === 'hex' ? 'Pole mapy — kliknięty heks' : 'Jednostka';
}

function buildContextCardHtml(ctx: ContextPanelData, expanded: boolean, canCycle = false): string {
  const interactive = ctx.kind === 'unit';
  let headHtml = '';
  if (ctx.kind === 'hex') {
    headHtml = `<div class="sp-ctx-head">${contextHeadLabel(ctx.kind)}</div>`;
  } else if (ctx.ownUnit === true) {
    // R-KARTA-JEDNOSTKI-STRZALKI-CYKL (Maciej 2026-08-09): nagłówek „Jednostka" usunięty
    // dla obu kart jednostki (własna/cudza); w jego miejsce, TYLKO dla własnej jednostki,
    // strzałki cyklowania do sąsiedniej armii gracza — reużywają istniejący cykl HUD ◀▶.
    const disabledAttr = canCycle ? '' : ' disabled';
    headHtml = '<div class="sp-ctx-nav">'
      + `<button type="button" class="sp-ctx-nav-arr" data-sp-cycle="-1"${disabledAttr} aria-label="Poprzednia jednostka">◀</button>`
      + `<button type="button" class="sp-ctx-nav-arr" data-sp-cycle="1"${disabledAttr} aria-label="Następna jednostka">▶</button>`
      + '</div>';
  }
  let html = `<div class="sp-ctx-card${interactive ? ' sp-ctx-interactive' : ''}">`
    + headHtml
    + `<div class="cp-msg">${ctx.html}</div>`;
  if (ctx.kind === 'unit' && ctx.expandable && !ctx.expandInHtml) {
    const label = expanded ? 'Mniej szczegółów' : 'Więcej szczegółów';
    html += `<button type="button" class="sp-ctx-expand" data-sp-expand>${label}</button>`;
  }
  html += '</div>';
  return html;
}

/** Montuje panel wydarzeń (mockup 1E strefa H). */
export function createSidePanelHud(config: SidePanelHudConfig): SidePanelHudApi {
  ensureStyles();

  const el = document.createElement('div');
  el.className = 'civ-side-panel';

  // Przyczyna A runda 2: wrapper scrollowalny/klikalny, dziecko trwałe .civ-side-panel —
  // render() wypełnia TEN element (scrollEl.innerHTML), nie el.innerHTML, żeby el (kontener,
  // pointer-events:none) nigdy nie stracił tego jedynego dziecka. el.querySelector(All) dalej
  // działa bez zmian, bo przeszukuje CAŁE poddrzewo, niezależnie od tej dodatkowej warstwy.
  // EN: persistent scrollable/clickable wrapper child of .civ-side-panel — render() fills THIS
  // element (scrollEl.innerHTML), not el.innerHTML, so el (the pointer-events:none container)
  // never loses its one child. el.querySelector(All) below keeps working unchanged since it
  // searches the whole subtree regardless of this extra layer.
  const scrollEl = document.createElement('div');
  scrollEl.className = 'sp-scroll';
  el.appendChild(scrollEl);

  const ctxEl = document.createElement('div');
  ctxEl.className = 'civ-side-ctx-dock';

  // P-SIDEPANEL-CTX-DOCK-SCROLL-MARTWY (2026-08-16): ten sam wzorzec co scrollEl wyżej —
  // wrapper scrollowalny/klikalny, dziecko trwałe .civ-side-ctx-dock. render() wypełnia TEN
  // element (ctxScrollEl.innerHTML), nie ctxEl.innerHTML, żeby ctxEl (kontener,
  // pointer-events:none) nigdy nie stracił tego jedynego dziecka. ctxEl.querySelector(All) dalej
  // działa bez zmian, bo przeszukuje CAŁE poddrzewo, niezależnie od tej dodatkowej warstwy.
  // EN: same pattern as scrollEl above — persistent scrollable/clickable wrapper child of
  // .civ-side-ctx-dock. render() fills THIS element (ctxScrollEl.innerHTML), not ctxEl.innerHTML,
  // so ctxEl (the pointer-events:none container) never loses its one child.
  // ctxEl.querySelector(All) keeps working unchanged since it searches the whole subtree
  // regardless of this extra layer.
  const ctxScrollEl = document.createElement('div');
  ctxScrollEl.className = 'sp-ctx-scroll';
  ctxEl.appendChild(ctxScrollEl);

  // R-WYDARZENIA-FILTR-KATEGORII: stan chipa 🌍 „Inne cyw." — zmienna domknięcia,
  // przeżywa update()/tury (nie jest resetowana przy każdym render()).
  let showOtherCivsEvents = false;

  // Wspólne dla trzech kart (DYSPOZYCJA-WDROZENIE.md §5): Esc zamyka karty niezobowiązujące.
  // Tylko informacyjne (blokujące nie mają zamknięcia poza akcją/Zignoruj) — delegacja na
  // el, żeby działać niezależnie od tego, który element w danym momencie ma fokus.
  el.addEventListener("keydown", (e: Event) => {
    const ke = e as KeyboardEvent;
    if (ke.key !== "Escape") return;
    const origin = ke.target as HTMLElement | null;
    const card = origin?.closest(".sp-event:not(.sp-blocking)[data-id]");
    if (!card) return;
    const id = card.getAttribute("data-id");
    if (id !== null) {
      config.onEventDismiss?.(id);
      render();
    }
  });

  function bindContextInteractions(root: HTMLElement, ctx: ContextPanelData): void {
    root.querySelector('[data-sp-expand]')?.addEventListener('click', () => {
      config.onContextExpand?.();
      render();
    });
    root.querySelectorAll('[data-act]').forEach(btn => {
      btn.addEventListener('click', () => {
        if ((btn as HTMLButtonElement).disabled) return;
        const id = (btn as HTMLElement).getAttribute('data-act');
        if (id) config.onContextAction?.(id);
      });
    });
    root.querySelectorAll('[data-sp-cycle]').forEach(btn => {
      btn.addEventListener('click', () => {
        if ((btn as HTMLButtonElement).disabled) return;
        const raw = (btn as HTMLElement).getAttribute('data-sp-cycle');
        const delta: -1 | 1 = raw === '-1' ? -1 : 1;
        config.onContextCycleUnit?.(delta);
      });
    });
    if (ctx.kind !== 'unit') return;
    root.querySelectorAll('[data-unit]').forEach(chip => {
      const go = () => {
        const id = (chip as HTMLElement).getAttribute('data-unit');
        if (id) config.onContextSelectUnit?.(id);
      };
      chip.addEventListener('click', go);
      chip.addEventListener('keydown', (ev: Event) => {
        const ke = ev as KeyboardEvent;
        if (ke.key === 'Enter') { ke.preventDefault(); go(); }
      });
    });
  }

  function render(): void {
    const events = config.getEvents?.() ?? PLACEHOLDER_EVENTS;
    const isPlaceholder = config.getEvents === undefined;
    const ctx = resolveContextPanel(config);
    const expanded = config.isContextExpanded?.() ?? false;

    const unitCtx = ctx?.kind === 'unit' ? ctx : null;
    const hexCtx = ctx?.kind === 'hex' ? ctx : null;
    const hideUnitDock = unitCtx !== null && isDiploObscuringUnitDock();

    if (unitCtx !== null && !hideUnitDock) {
      const canCycle = config.canContextCycleUnit?.() ?? false;
      // P-SIDEPANEL-CTX-DOCK-SCROLL-MARTWY: wypełniamy ctxScrollEl (wrapper pointer-events:auto),
      // NIE ctxEl (kontener pointer-events:none) — patrz komentarz przy deklaracji ctxScrollEl.
      // EN: fill ctxScrollEl (pointer-events:auto wrapper), NOT ctxEl (pointer-events:none
      // container) — see comment at the ctxScrollEl declaration.
      ctxScrollEl.innerHTML = buildContextCardHtml(unitCtx, expanded, canCycle);
      ctxEl.classList.add('open');
      if (expanded && unitCtx.expandable) {
        ctxEl.classList.add('sp-ctx-expanded');
      } else {
        ctxEl.classList.remove('sp-ctx-expanded');
      }
      const card = ctxEl.querySelector('.sp-ctx-card');
      if (card) bindContextInteractions(ctxEl, unitCtx);
    } else {
      ctxScrollEl.innerHTML = '';
      ctxEl.classList.remove('open', 'sp-ctx-expanded');
    }

    let html = '';
    if (hexCtx !== null) {
      html += buildContextCardHtml(hexCtx, expanded);
    }

    const visibleEvents = filterSidePanelEvents(events, showOtherCivsEvents);
    // R-TRZY-KARTY-WDROZENIE-Q1 runda 2: kolejka, nie stos — blokujące ZAWSZE przed
    // informacyjnymi, niezależnie od kolejności zgłoszenia (DYSPOZYCJA-WDROZENIE.md
    // §4, założenie 1). Kolejność WEWNĄTRZ każdej z dwóch grup pozostaje bez zmian
    // (kolejność zwrócona przez getEvents()/filterSidePanelEvents).
    const blockingEvents = visibleEvents.filter(ev => ev.blocking === true);
    const infoEvents = visibleEvents.filter(ev => ev.blocking !== true);
    const orderedEvents = [...blockingEvents, ...infoEvents];

    if (isPlaceholder) {
      html += '<div class="sp-header">Wydarzenia</div>';
    } else {
      const counterParts: string[] = [];
      if (blockingEvents.length > 0) {
        counterParts.push(blockingEvents.length + ' ' + pluralPl(blockingEvents.length, 'wymaga decyzji', 'wymagają decyzji'));
      }
      if (infoEvents.length > 0) {
        counterParts.push(infoEvents.length + ' ' + pluralPl(infoEvents.length, 'informacyjna', 'informacyjne'));
      }
      html += '<div class="sp-header">' + (counterParts.length > 0 ? counterParts.join(' · ') : 'Wydarzenia') + '</div>';
    }

    if (!isPlaceholder) {
      html += '<div class="sp-toolbar">'
        + '<button type="button" class="sp-toolbar-chip'
        + (showOtherCivsEvents ? ' sp-toolbar-chip-active' : '')
        + '" data-sp-toggle-other-civs>\u{1F30D} Inne cyw.</button>'
        // Hurtowe zamknięcie dotyczy TYLKO informacyjnych (§4) — dlatego etykieta i warunek
        // widoczności patrzą na infoEvents, nie na wszystkie wydarzenia; patrz handler
        // [data-sp-dismiss-all] niżej, który celowo NIE woła config.onDismissAll.
        + (config.onEventDismiss !== undefined && infoEvents.length > 0
          ? '<button type="button" class="sp-toolbar-dismiss-all" data-sp-dismiss-all>Zamknij wszystkie informacyjne</button>'
          : '')
        + '</div>';
    }

    if (orderedEvents.length === 0) {
      html += '<div class="sp-placeholder">Brak wydarzeń w tej turze.</div>';
    } else {
      let blockingSeen = 0;
      for (const ev of orderedEvents) {
        const icInner = eventIconHtml(ev.kind, ev.icon);
        const icoContent = icInner.startsWith('<svg')
          ? icInner
          : `<span class="sp-ico-emoji">${ev.icon || '•'}</span>`;

        if (ev.blocking === true) {
          blockingSeen += 1;
          if (blockingSeen === 1) {
            // Rozwinięta — zawsze dokładnie jedna, pierwsza blokująca w kolejce.
            const ignorable = isIgnorableRevoltEvent(ev);
            html += '<div class="sp-event sp-blocking sp-expanded" data-id="' + ev.id + '">'
              + '<div class="sp-blk-stripe"></div>'
              + '<div class="sp-blk-body">'
              + '<span class="sp-ico">' + icoContent + '</span>'
              + '<div>'
              + '<div class="sp-blk-kicker-row"><span class="sp-badge-decision">Wymaga decyzji</span>'
              + (blockingEvents.length > 1 ? '<span class="sp-blk-hint">1 z ' + blockingEvents.length + '</span>' : '')
              + '</div>'
              + '<div class="sp-title">' + ev.title + '</div>'
              + (ev.subtitle !== undefined ? '<div class="sp-sub">' + ev.subtitle + '</div>' : '')
              + '</div></div>'
              + '<div class="sp-action-bar"><div class="sp-action-row">'
              + '<button type="button" class="sp-action-btn tg-btn-primary" data-sp-open="' + ev.id + '">Otwórz →</button>'
              + '</div>'
              + (ignorable
                ? '<button type="button" class="sp-action-ignore" data-sp-ignore="' + ev.id + '">Zignoruj — bunt potrwa dalej</button>'
                : '')
              + '</div>'
              + '</div>';
          } else {
            // Zwinięta w kolejce — „Rozpatrz →", rant 2px (patrz sp-blocking.sp-collapsed w CSS).
            html += '<div class="sp-event sp-blocking sp-collapsed" data-id="' + ev.id + '">'
              + '<span class="sp-ico">' + icoContent + '</span>'
              + '<div class="sp-title">' + ev.title + '</div>'
              + '<span class="sp-collapsed-cta">Rozpatrz →</span>'
              + '</div>';
          }
          continue;
        }

        const adverseCls = isAdverseInfoEvent(ev) ? ' sp-info-adverse' : '';
        html += '<div class="sp-event' + adverseCls + '" data-id="' + ev.id + '">'
          + '<span class="sp-ico">' + icoContent + '</span>'
          + '<div><span class="sp-kicker">Wydarzenie</span>'
          + '<div class="sp-title">' + ev.title + '</div>'
          + (ev.subtitle !== undefined ? '<div class="sp-sub">' + ev.subtitle + '</div>' : '')
          + '</div>';
        if (!isPlaceholder && config.onEventDismiss !== undefined) {
          html += '<span class="sp-close" data-dismiss="' + ev.id + '" title="Zamknij" aria-label="Zamknij powiadomienie">✕</span>';
        }
        html += '</div>';
      }
    }

    scrollEl.innerHTML = html;

    if (hexCtx !== null) {
      const card = el.querySelector('.sp-ctx-card');
      if (card) bindContextInteractions(el, hexCtx);
    }

    el.querySelector('[data-sp-toggle-other-civs]')?.addEventListener('click', () => {
      showOtherCivsEvents = !showOtherCivsEvents;
      render();
    });

    el.querySelector('[data-sp-dismiss-all]')?.addEventListener('click', () => {
      // R-TRZY-KARTY-WDROZENIE-Q1: hurtowe zamknięcie dotyczy TYLKO informacyjnych — iterujemy
      // per-id przez onEventDismiss (istniejący miękki dismiss), NIE wołamy config.onDismissAll,
      // bo ten dziś czyści też blokujące (main.ts clearAllSidePanelEvents/
      // handleSidePanelEventDismiss iterują collectTurnEvents() bez rozróżnienia blocking).
      for (const ev of infoEvents) config.onEventDismiss?.(ev.id);
      render();
    });

    // Klikalna cała karta: informacyjne (zawsze) i zwinięte blokujące w kolejce („Rozpatrz →").
    // Rozwinięta karta blokująca (.sp-expanded) NIE jest klikalna jako całość — akcje żyją
    // wyłącznie w pasie akcji (data-sp-open / data-sp-ignore niżej), zgodnie z makietą.
    el.querySelectorAll('.sp-event[data-id]:not(.sp-expanded)').forEach(chip => {
      chip.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.closest('.sp-close')) return;
        const id = (chip as HTMLElement).getAttribute('data-id');
        if (id !== null) config.onEventClick?.(id);
      });
    });

    el.querySelectorAll('.sp-close[data-dismiss]').forEach(btn => {
      btn.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        const id = (btn as HTMLElement).getAttribute('data-dismiss');
        if (id !== null) {
          config.onEventDismiss?.(id);
          render();
        }
      });
    });

    el.querySelectorAll('[data-sp-open]').forEach(btn => {
      btn.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        const id = (btn as HTMLElement).getAttribute('data-sp-open');
        if (id !== null) config.onEventClick?.(id);
      });
    });

    // „Zignoruj — bunt potrwa dalej" (ECHO właściciela 2026-08-20, punkt 2): trzecie, świadome
    // wyjście z karty buntu. Woła DOKŁADNIE ten sam miękki dismiss co ✕ na karcie informacyjnej
    // (config.onEventDismiss) — main.ts (handleSidePanelEventDismiss, gałąź domyślna) już dziś
    // dla id 'revolt-*' robi dismissedSidePanelEventIds.add(id), czyszczone na końcu KAŻDEJ
    // tury — czyli karta wraca w kolejnej turze, jeśli bunt nadal trwa: dokładnie „bunt potrwa
    // dalej", zero zmian w main.ts potrzebnych.
    el.querySelectorAll('[data-sp-ignore]').forEach(btn => {
      btn.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        const id = (btn as HTMLElement).getAttribute('data-sp-ignore');
        if (id !== null) {
          config.onEventDismiss?.(id);
          render();
        }
      });
    });
  }

  render();
  return {
    el,
    ctxEl,
    update: render,
    destroy: () => {
      el.remove();
      ctxEl.remove();
    },
  };
}
