/**
 * sidePanelHud.ts
 * Panel boczny HUD (D1=C) — wydarzenia z tury (mockup HUD Mapy layout 1E strefa H).
 * Karta jednostki: osobny dock lewy-dół, nad minimapą (Maciej 2026-07-28).
 */

import { brandIconSvg } from './icons/brandAssets';
import { ensureBrandRootTokens, CIV_BRAND_SCOPE_VARS } from './brandTokenVars';
import { UNIT_CONTEXT_PANEL_CSS } from './hexContextTooltip';
import {
  HUD_CONTEXT_PANEL_W_PX,
  HUD_EDGE_PX,
  HUD_ZOOM_EDGE_PX,
  turnStackBottomPx,
} from './hudLayout';
import {
  MINIMAP_EDGE_PX,
  MINIMAP_W_PX,
  unitCardDockBottomPx,
} from './minimapLayout';

export type SidePanelEventKind = 'science' | 'culture' | 'city' | 'unit' | 'enemy' | 'info' | 'diplo';

export interface SidePanelEvent {
  id: string;
  icon: string;
  title: string;
  subtitle?: string;
  kind: SidePanelEventKind;
  blocking?: boolean;
}

export type ContextPanelKind = 'hex' | 'unit';

export interface ContextPanelData {
  kind: ContextPanelKind;
  html: string;
  /** Nadpisanie nagłówka karty (np. „Armia" zamiast „Jednostka"). */
  headLabel?: string;
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
  onEventClick?: (id: string) => void;
  onEventDismiss?: (id: string) => void;
}

export interface SidePanelHudApi {
  /** Wydarzenia — prawy dolny róg. */
  el: HTMLDivElement;
  /** Karta jednostki — lewy dolny róg, nad minimapą. */
  ctxEl: HTMLDivElement;
  update: () => void;
  destroy: () => void;
}

const STYLE_ID = 'civ-side-panel-hud-css-w3-unit-dock3';
/** Wysokość stosu tury (Wykonaj + Koniec tury) nad dolną krawędzią — mockup 1E strefa G. */
const TURN_STACK_H = turnStackBottomPx();
const MINIMAP_EDGE = MINIMAP_EDGE_PX;
const MINIMAP_W = MINIMAP_W_PX;
const unitDockBottom = unitCardDockBottomPx();

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
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-side-panel{position:fixed;bottom:${TURN_STACK_H}px;right:${HUD_EDGE_PX}px;top:auto;z-index:310;width:${HUD_CONTEXT_PANEL_W_PX}px;pointer-events:auto;
  max-height:min(50vh,calc(100vh - ${TURN_STACK_H + 80}px));overflow-y:auto;overflow-x:hidden;
  overscroll-behavior:contain;scrollbar-gutter:stable;
  ${CIV_BRAND_SCOPE_VARS}
  display:flex;flex-direction:column;gap:8px;font:13px var(--civ-font-ui);}
html.civ-ui-zoom-active .civ-side-panel{max-height:50vh;right:${HUD_ZOOM_EDGE_PX}px;}
.civ-side-ctx-dock{position:fixed;left:${MINIMAP_EDGE}px;bottom:${unitDockBottom}px;z-index:308;
  width:min(${MINIMAP_W}px,calc(100vw - ${MINIMAP_EDGE * 2}px));pointer-events:none;
  max-height:min(40vh,calc(100vh - ${unitDockBottom + 80}px));overflow-y:auto;overflow-x:hidden;
  overscroll-behavior:contain;scrollbar-gutter:stable;display:none;
  ${CIV_BRAND_SCOPE_VARS}
  font:13px var(--civ-font-ui);}
.civ-side-ctx-dock.open{display:block;pointer-events:auto;}
html.civ-ui-zoom-active .civ-side-ctx-dock{left:${HUD_ZOOM_EDGE_PX}px;bottom:${unitDockBottom - 4}px;}
.civ-side-panel .sp-header{font-size:10px;color:var(--civ-text-muted);text-transform:uppercase;
  letter-spacing:.24em;text-align:right;padding-right:4px;margin-bottom:2px;}
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
.civ-side-ctx-dock .sp-ctx-card,.civ-side-panel .sp-ctx-card{padding:14px 16px;border-radius:10px;margin-bottom:0;
  background:linear-gradient(180deg,rgba(24,30,42,.98),rgba(10,12,18,.96));
  border:1px solid rgba(212,175,90,.38);box-shadow:0 6px 18px rgba(0,0,0,.45);}
.civ-side-panel .sp-ctx-card{margin-bottom:10px;}
.civ-side-ctx-dock .sp-ctx-card.sp-ctx-interactive,.civ-side-panel .sp-ctx-card.sp-ctx-interactive{pointer-events:auto;}
.civ-side-ctx-dock .sp-ctx-head,.civ-side-panel .sp-ctx-head{font-size:10px;color:var(--civ-text-muted,#a09880);text-transform:uppercase;
  letter-spacing:.22em;margin-bottom:8px;text-align:right;}
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

function kindClass(kind: SidePanelEventKind): string {
  return 'sp-' + kind;
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

function buildContextCardHtml(ctx: ContextPanelData, expanded: boolean): string {
  const interactive = ctx.kind === 'unit';
  const headHtml = `<div class="sp-ctx-head">${ctx.headLabel ?? contextHeadLabel(ctx.kind)}</div>`;
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

    if (unitCtx !== null) {
      ctxEl.innerHTML = buildContextCardHtml(unitCtx, expanded);
      ctxEl.classList.add('open');
      const card = ctxEl.querySelector('.sp-ctx-card');
      if (card) bindContextInteractions(ctxEl, unitCtx);
    } else {
      ctxEl.innerHTML = '';
      ctxEl.classList.remove('open');
    }

    let html = '';
    if (hexCtx !== null) {
      html += buildContextCardHtml(hexCtx, expanded);
    }

    html += '<div class="sp-header">Wydarzenia</div>';

    if (events.length === 0) {
      html += '<div class="sp-placeholder">Brak wydarzeń w tej turze.</div>';
    } else {
      for (const ev of events) {
        const blockCls = ev.blocking ? ' sp-blocking' : '';
        const icInner = eventIconHtml(ev.kind, ev.icon);
        const icoContent = icInner.startsWith('<svg')
          ? icInner
          : `<span class="sp-ico-emoji">${ev.icon || '•'}</span>`;
        html += '<div class="sp-event ' + kindClass(ev.kind) + blockCls + '" data-id="' + ev.id + '">'
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
