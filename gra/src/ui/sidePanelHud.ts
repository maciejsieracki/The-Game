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
.civ-side-panel{position:fixed;top:${EVENTS_PANEL_TOP}px;bottom:${EVENTS_PANEL_BOTTOM}px;right:${HUD_EDGE_PX}px;z-index:305;width:${HUD_CONTEXT_PANEL_W_PX}px;pointer-events:auto;
  overflow-y:auto;overflow-x:hidden;
  overscroll-behavior:contain;scrollbar-gutter:stable;
  ${CIV_BRAND_SCOPE_VARS}
  display:flex;flex-direction:column;gap:8px;font:13px var(--civ-font-ui);}
html.civ-ui-zoom-active .civ-side-panel{top:${EVENTS_PANEL_TOP}px;bottom:${EVENTS_PANEL_BOTTOM_ZOOM}px;right:${HUD_ZOOM_EDGE_PX}px;}
.civ-side-ctx-dock{position:fixed;left:${SIDE_PANEL_LEFT};top:${unitCardSafeTopCss()};bottom:${unitCardDockBottomCss()};
  --civ-unit-card-max-right:${unitCardMaxRight};
  z-index:316;width:${unitCardDockWidthCss()};pointer-events:none;
  overflow-y:auto;overflow-x:hidden;
  overscroll-behavior:contain;scrollbar-gutter:stable;display:none;
  transition:width .18s ease;
  ${CIV_BRAND_SCOPE_VARS}
  font:13px var(--civ-font-ui);}
.civ-side-ctx-dock.open{display:block;pointer-events:none;}
.civ-side-ctx-dock.sp-ctx-expanded{width:${unitCardDockExpandedWidthCss()};}
html.civ-ui-zoom-active .civ-side-ctx-dock{left:${SIDE_PANEL_LEFT};
  top:${unitCardSafeTopCss()};
  bottom:calc(${unitCardDockBottomCss(true)} + (var(--civ-ui-zoom, 1) - 1) * ${UNIT_CARD_ZOOM_LIFT_PER_SCALE_PX}px);}
.civ-side-panel .sp-header{font-size:10px;color:var(--civ-text-muted);text-transform:uppercase;
  letter-spacing:.24em;text-align:right;padding-right:4px;margin-bottom:2px;}
.civ-side-panel .sp-toolbar{display:flex;align-items:center;justify-content:flex-end;gap:6px;
  padding:0 4px 2px;margin-bottom:2px;}
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
.civ-side-panel .sp-event{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:10px;
  cursor:pointer;transition:border-color .15s,box-shadow .15s;
  background:linear-gradient(90deg,rgba(200,64,64,.12),rgba(20,26,38,.92));
  border:1px solid rgba(232,216,138,.25);border-left:3px solid var(--tg-red);
  box-shadow:0 6px 16px rgba(0,0,0,.5);}
.civ-side-panel .sp-event:hover{border-color:rgba(232,216,138,.4);}
.civ-side-panel .sp-event.sp-science{border-left-color:#60a8e8;background:linear-gradient(90deg,rgba(96,168,232,.1),rgba(20,26,38,.92));}
.civ-side-panel .sp-event.sp-culture{border-left-color:#c080e0;}
.civ-side-panel .sp-event.sp-city{border-left-color:var(--tg-green);}
.civ-side-panel .sp-event.sp-unit{border-left-color:var(--civ-gold-primary);}
.civ-side-panel .sp-event.sp-enemy,.civ-side-panel .sp-event.sp-blocking{border-left-color:var(--tg-red);}
.civ-side-panel .sp-event.sp-diplo{border-left-color:#6a9fd4;background:linear-gradient(90deg,rgba(106,159,212,.10),rgba(20,26,38,.92));}
.civ-side-panel .sp-event.sp-info{border-left-color:#c9a84c;background:linear-gradient(90deg,rgba(0,0,0,.35),rgba(20,26,38,.92));}
.civ-side-panel .sp-event.sp-blocking{cursor:default;}
.civ-side-panel .sp-ico{width:32px;height:32px;flex:none;border-radius:50%;
  background:var(--tg-medallion-bg);border:1.5px solid var(--tg-gold-dim);
  display:flex;align-items:center;justify-content:center;color:var(--civ-gold-primary);}
.civ-side-panel .sp-ico .sp-ic-svg{width:17px;height:17px;display:block;}
.civ-side-panel .sp-ico-emoji{font-size:16px;line-height:1;}
.civ-side-panel .sp-title{font-size:13px;color:var(--civ-text-primary);}
.civ-side-panel .sp-sub{font-size:11px;color:var(--civ-text-muted);margin-top:2px;}
.civ-side-panel .sp-close{font-size:10px;color:var(--civ-text-muted);cursor:pointer;padding:2px 4px;margin-left:auto;}
.civ-side-panel .sp-close:hover{color:var(--civ-gold-primary);}
.civ-side-panel .sp-placeholder{font-size:10px;color:#7a7055;text-align:right;padding:8px 4px;font-style:italic;line-height:1.4;}
.civ-side-ctx-dock.open .sp-ctx-card{pointer-events:auto;}
.civ-side-ctx-dock .sp-ctx-card,.civ-side-panel .sp-ctx-card{padding:14px 16px 16px;border-radius:10px;margin-bottom:0;
  background:linear-gradient(180deg,rgba(24,30,42,.98),rgba(10,12,18,.96));
  border:1px solid rgba(212,175,90,.38);box-shadow:0 6px 18px rgba(0,0,0,.45);}
.civ-side-panel .sp-ctx-card{margin-bottom:10px;}
.civ-side-ctx-dock .sp-ctx-card.sp-ctx-interactive,.civ-side-panel .sp-ctx-card.sp-ctx-interactive{pointer-events:auto;}
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

function kindClass(ev: SidePanelEvent): string {
  if (ev.negative) return 'sp-enemy';
  return 'sp-' + ev.kind;
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

  const ctxEl = document.createElement('div');
  ctxEl.className = 'civ-side-ctx-dock';

  // R-WYDARZENIA-FILTR-KATEGORII: stan chipa 🌍 „Inne cyw." — zmienna domknięcia,
  // przeżywa update()/tury (nie jest resetowana przy każdym render()).
  let showOtherCivsEvents = false;

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
      ctxEl.innerHTML = buildContextCardHtml(unitCtx, expanded, canCycle);
      ctxEl.classList.add('open');
      if (expanded && unitCtx.expandable) {
        ctxEl.classList.add('sp-ctx-expanded');
      } else {
        ctxEl.classList.remove('sp-ctx-expanded');
      }
      const card = ctxEl.querySelector('.sp-ctx-card');
      if (card) bindContextInteractions(ctxEl, unitCtx);
    } else {
      ctxEl.innerHTML = '';
      ctxEl.classList.remove('open', 'sp-ctx-expanded');
    }

    let html = '';
    if (hexCtx !== null) {
      html += buildContextCardHtml(hexCtx, expanded);
    }

    html += '<div class="sp-header">Wydarzenia</div>';

    const visibleEvents = filterSidePanelEvents(events, showOtherCivsEvents);

    if (!isPlaceholder) {
      html += '<div class="sp-toolbar">'
        + '<button type="button" class="sp-toolbar-chip'
        + (showOtherCivsEvents ? ' sp-toolbar-chip-active' : '')
        + '" data-sp-toggle-other-civs>\u{1F30D} Inne cyw.</button>'
        + (config.onDismissAll !== undefined
          ? '<button type="button" class="sp-toolbar-dismiss-all" data-sp-dismiss-all>Usuń wszystkie</button>'
          : '')
        + '</div>';
    }

    if (visibleEvents.length === 0) {
      html += '<div class="sp-placeholder">Brak wydarzeń w tej turze.</div>';
    } else {
      for (const ev of visibleEvents) {
        const blockCls = ev.blocking ? ' sp-blocking' : '';
        const icInner = eventIconHtml(ev.kind, ev.icon);
        const icoContent = icInner.startsWith('<svg')
          ? icInner
          : `<span class="sp-ico-emoji">${ev.icon || '•'}</span>`;
        html += '<div class="sp-event ' + kindClass(ev) + blockCls + '" data-id="' + ev.id + '">'
          + '<span class="sp-ico">' + icoContent + '</span>'
          + '<div><div class="sp-title">' + ev.title + '</div>'
          + (ev.subtitle !== undefined ? '<div class="sp-sub">' + ev.subtitle + '</div>' : '')
          + '</div>';
        if (!isPlaceholder && !ev.blocking && config.onEventDismiss !== undefined) {
          html += '<span class="sp-close" data-dismiss="' + ev.id + '" title="Zamknij">\u2715</span>';
        }
        html += '</div>';
      }
    }

    el.innerHTML = html;

    if (hexCtx !== null) {
      const card = el.querySelector('.sp-ctx-card');
      if (card) bindContextInteractions(el, hexCtx);
    }

    el.querySelector('[data-sp-toggle-other-civs]')?.addEventListener('click', () => {
      showOtherCivsEvents = !showOtherCivsEvents;
      render();
    });

    el.querySelector('[data-sp-dismiss-all]')?.addEventListener('click', () => {
      config.onDismissAll?.();
      render();
    });

    el.querySelectorAll('.sp-event[data-id]').forEach(chip => {
      chip.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('sp-close')) return;
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
