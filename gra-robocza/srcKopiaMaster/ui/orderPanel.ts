/**
 * orderPanel.ts
 * Panel Zadowolenia / Porządku (UI plan pkt 6).
 * Model procentowy B2: SzPct + PrawPct → PorPct.
 *
 * DOM-only, DECOUPLED: dane przez hak getOrderState(cityId).
 *
 * LANE: src/ui/*.  Source: literalny UTF-8.
 */

import type { SocietyLine } from '../game/society-breakdown';
import { brandIconSvg } from './icons/brandAssets';

export interface OrderState {
  /** Legacy pkt szczęścia (kompat). */
  szczescie: number;
  /** Legacy pkt prawa / pole porzadek historyczne. */
  porzadek: number;
  /** Procent Szczęścia (1C). */
  szPct?: number;
  /** Procent Prawa. */
  prawPct?: number;
  /** Procent Porządku łączny. */
  porPct?: number;
  /** Etykieta tieru (Ład, Bunt…). */
  bandLabel?: string;
  /** Rozpiska Szczęścia +/-. */
  szLines?: SocietyLine[];
  /** Rozpiska Prawa +/-. */
  prawLines?: SocietyLine[];
  /** Progi legacy (kompat). */
  progT1: number;
  progT2: number;
  /** Twarda flaga buntu migracji tej tury. */
  bunt?: boolean;
  /** B2-Q12=C: tury grace przed rebelią. */
  revoltGraceRemaining?: number | null;
  revoltWarning?: boolean;
  rebelState?: boolean;
}

export interface OrderPanelConfig {
  getOrderState?: (cityId: string) => OrderState | null;
}

let cfg: OrderPanelConfig | null = null;
let rootEl: HTMLDivElement | null = null;
let activeCityId = '';

const STYLE_ID = 'civ-order-css';
function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-order{position:fixed;top:60px;right:12px;width:260px;z-index:320;
  --gold:#e0b24a;--green:#6bbf59;--orange:#d98a3a;--red:#d36b5e;--muted:#9aa6b6;
  background:rgba(20,24,32,0.94);color:#e8ebf0;border:1px solid rgba(224,178,74,0.3);
  border-radius:8px;padding:10px 12px;font:13px monospace;box-shadow:0 4px 20px rgba(0,0,0,0.6);}
.civ-order *{box-sizing:border-box;}
.civ-order .t{font-size:0.78em;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--gold);
  border-bottom:1px solid rgba(224,178,74,0.25);padding-bottom:4px;margin-bottom:6px;}
.civ-order .r{display:flex;justify-content:space-between;padding:2px 0;}
.civ-order .r .l{color:var(--muted);}
.civ-order .bar{height:8px;background:#111518;border:1px solid rgba(224,178,74,0.2);border-radius:3px;overflow:hidden;margin:4px 0;position:relative;}
.civ-order .fill{height:100%;}
.civ-order .status{margin-top:7px;padding:5px 8px;border-radius:4px;font-size:0.82em;font-weight:700;text-align:center;}
.civ-order .ok{background:rgba(107,191,89,0.15);color:var(--green);border:1px solid rgba(107,191,89,0.4);}
.civ-order .t1{background:rgba(217,138,58,0.15);color:var(--orange);border:1px solid rgba(217,138,58,0.4);}
.civ-order .t2{background:rgba(211,107,94,0.18);color:var(--red);border:1px solid rgba(211,107,94,0.5);}
.civ-order .crit{background:rgba(211,50,50,0.22);color:#ff8888;border:1px solid rgba(255,80,80,0.55);}
.civ-order .note{font-size:0.72em;color:var(--muted);margin-top:5px;line-height:1.4;}
.civ-order .ph{font-size:0.64em;color:var(--muted);border:1px solid rgba(224,178,74,0.25);border-radius:3px;padding:0 4px;float:right;}
.civ-order .lines{font-size:0.72em;color:var(--muted);margin:3px 0 6px;line-height:1.35;}
.civ-order .lines .pos{color:var(--green);}
.civ-order .lines .neg{color:var(--red);}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

const PLACEHOLDER: OrderState = {
  szczescie: 7,
  porzadek: 5,
  szPct: 58,
  prawPct: 42,
  porPct: 50,
  bandLabel: 'Napięcie',
  progT1: 8,
  progT2: 4,
  bunt: false,
};

export function orderTierUi(s: OrderState): 0 | 1 | 2 {
  if (s.rebelState || s.bunt) return 2;
  if (s.revoltWarning || (s.porPct !== undefined && s.porPct < 10)) return 2;
  if (s.porPct !== undefined) {
    if (s.porPct < 30) return 2;
    if (s.porPct < 70) return 1;
    return 0;
  }
  const z = s.szczescie + s.porzadek;
  if (s.bunt || z < s.progT2) return 2;
  if (z < s.progT1) return 1;
  return 0;
}

function orderBarHtml(value: number, max = 100, color: string, barClass = 'bar', fillClass = 'fill'): string {
  const pct = Math.max(0, Math.min(100, Math.round((value / Math.max(1, max)) * 100)));
  return '<div class="' + barClass + '"><div class="' + fillClass + '" style="width:' + pct + '%;background:' + color + '"></div></div>';
}

function linesHtml(lines: SocietyLine[] | undefined, max = 5, pfx = ''): string {
  if (!lines || lines.length === 0) return '';
  const slice = lines.slice(0, max);
  return '<div class="' + pfx + 'lines">' + slice.map(l => {
    const cls = l.value >= 0 ? 'pos' : 'neg';
    const sign = l.value >= 0 ? '+' : '';
    return `<div class="${cls}">${l.label}: ${sign}${l.value}</div>`;
  }).join('') + (lines.length > max ? '<div>…</div>' : '') + '</div>';
}

/** HTML sekcji Porządek — używane przez overlay i panel miasta (B2-Q2). */
export function buildOrderSectionHtml(
  s: OrderState,
  opts?: {
    isPlaceholder?: boolean;
    cssPrefix?: string;
    skipTitle?: boolean;
    /** Ukryj rozpiskę +/- (szczegóły w hover dock). */
    skipLines?: boolean;
    /** Ukryj „Szybkie działania…” (szczegóły w hover dock). */
    skipNote?: boolean;
  },
): string {
  const isPh = opts?.isPlaceholder ?? false;
  const pfx = opts?.cssPrefix ?? '';
  const tn = orderTierUi(s);
  const usePct = s.porPct !== undefined;

  let html = opts?.skipTitle
    ? ''
    : '<div class="' + pfx + 't">Porządek' + (isPh ? '<span class="' + pfx + 'ph">szacunek</span>' : '') + '</div>';

  if (usePct) {
    html += '<div class="' + pfx + 'r"><span class="' + pfx + 'l">Szczęście</span><span><b>' + Math.round(s.szPct ?? 0) + '%</b></span></div>';
    html += orderBarHtml(s.szPct ?? 0, 100, 'var(--gold)', pfx + 'bar', pfx + 'fill');
    if (!opts?.skipLines) html += linesHtml(s.szLines, 6, pfx);
    html += '<div class="' + pfx + 'r"><span class="' + pfx + 'l">Prawo</span><span><b>' + Math.round(s.prawPct ?? 0) + '%</b></span></div>';
    html += orderBarHtml(s.prawPct ?? 0, 100, 'var(--green)', pfx + 'bar', pfx + 'fill');
    if (!opts?.skipLines) html += linesHtml(s.prawLines, 6, pfx);
    html += '<div class="' + pfx + 'r"><span class="' + pfx + 'l">Porządek łącznie</span><span style="font-weight:700">' + Math.round(s.porPct ?? 0) + '%</span></div>';
    html += orderBarHtml(s.porPct ?? 0, 100, 'var(--gold)', pfx + 'bar', pfx + 'fill');
  } else {
    const scale = Math.max(s.szczescie + s.porzadek, s.progT1, s.progT2, 1);
    html += '<div class="' + pfx + 'r"><span class="' + pfx + 'l">' + brandIconSvg('chip-happiness', 16) + ' Szczęście</span><span>' + s.szczescie + '</span></div>';
    html += orderBarHtml(s.szczescie, scale, 'var(--gold)', pfx + 'bar', pfx + 'fill');
    html += '<div class="' + pfx + 'r"><span class="' + pfx + 'l">' + brandIconSvg('cp-order', 16) + ' Prawo</span><span>' + s.porzadek + '</span></div>';
    html += orderBarHtml(s.porzadek, scale, 'var(--green)', pfx + 'bar', pfx + 'fill');
  }

  if (s.revoltWarning && s.revoltGraceRemaining != null && s.revoltGraceRemaining > 0) {
    html += '<div class="' + pfx + 'status crit">' + brandIconSvg('chip-warning', 16) + ' Grozi bunt! ' + s.revoltGraceRemaining + ' tur(y) na reakcję</div>';
  } else if (s.rebelState) {
    html += '<div class="' + pfx + 'status t2">Rebelia — miasto pod kontrolą rebeliantów</div>';
  } else if (tn === 0) {
    html += '<div class="' + pfx + 'status ok">' + brandIconSvg('ui-check', 16) + ' ' + (s.bandLabel ?? 'Spokój') + '</div>';
  } else if (tn === 1) {
    html += '<div class="' + pfx + 'status t1">' + brandIconSvg('chip-warning', 16) + ' ' + (s.bandLabel ?? 'Napięcie') + '</div>';
  } else {
    html += '<div class="' + pfx + 'status t2">' + brandIconSvg('chip-rebellion', 16) + ' ' + (s.bandLabel ?? 'Bunt') + '</div>';
  }

  if (!opts?.skipNote) {
    html += '<div class="' + pfx + 'note">Szybkie działania: obniż podatki (Luksus) lub stacjonuj wojsko (Prawo).</div>';
  }
  return html;
}

function render(): void {
  if (rootEl === null) return;
  const live = cfg && cfg.getOrderState ? cfg.getOrderState(activeCityId) : null;
  const s = live ?? PLACEHOLDER;
  rootEl.innerHTML = buildOrderSectionHtml(s, { isPlaceholder: live === null });
}

/** Pokaz panel dla miasta. */
export function showOrderPanel(cityId: string, config: OrderPanelConfig): void {
  cfg = config;
  activeCityId = cityId;
  ensureStyles();
  if (rootEl === null) {
    rootEl = document.createElement('div');
    rootEl.className = 'civ-order';
    document.body.appendChild(rootEl);
  }
  rootEl.style.display = 'block';
  render();
}

export function hideOrderPanel(): void {
  if (rootEl) rootEl.style.display = 'none';
}

export function refreshOrderPanel(): void {
  render();
}
