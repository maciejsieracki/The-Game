/**
 * orderPanel.ts
 * Panel Zadowolenia / Porzadku (UI plan pkt 6).
 * Zadowolenie = Szczescie + Porzadek (Prawo).  Progi: T1 (miasto gorzej pracuje),
 * T2 (bunt).  Zrodlo mechaniki = game/order.ts (dzial MIASTO) — tu PREZENTACJA.
 *
 * DOM-only, DECOUPLED: dane przez hak getOrderState(cityId); bez haka pokazuje
 * reprezentatywny placeholder.
 *
 * LANE: src/ui/*.  Source: literalny UTF-8.
 */

export interface OrderState {
  /** Punkty szczescia (budynki, luksusy, religia...). */
  szczescie: number;
  /** Punkty porzadku / prawa (garnizon, ratusz...). */
  porzadek: number;
  /** Prog T1 — ponizej: miasto gorzej pracuje. */
  progT1: number;
  /** Prog T2 — ponizej: bunt. */
  progT2: number;
  /** Twarda flaga buntu (nadpisuje progi). */
  bunt?: boolean;
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
.civ-order{position:fixed;top:60px;right:12px;width:230px;z-index:320;
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
.civ-order .note{font-size:0.72em;color:var(--muted);margin-top:5px;line-height:1.4;}
.civ-order .ph{font-size:0.64em;color:var(--muted);border:1px solid rgba(224,178,74,0.25);border-radius:3px;padding:0 4px;float:right;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

const PLACEHOLDER: OrderState = { szczescie: 7, porzadek: 5, progT1: 8, progT2: 4, bunt: false };

function tier(s: OrderState): 0 | 1 | 2 {
  const z = s.szczescie + s.porzadek;
  if (s.bunt || z < s.progT2) return 2;
  if (z < s.progT1) return 1;
  return 0;
}

function bar(value: number, max: number, color: string): string {
  const pct = Math.max(0, Math.min(100, Math.round((value / Math.max(1, max)) * 100)));
  return '<div class="bar"><div class="fill" style="width:' + pct + '%;background:' + color + '"></div></div>';
}

function render(): void {
  if (rootEl === null) return;
  const live = cfg && cfg.getOrderState ? cfg.getOrderState(activeCityId) : null;
  const s = live ?? PLACEHOLDER;
  const isPh = live === null;
  const z = s.szczescie + s.porzadek;
  const scale = Math.max(z, s.progT1, 1);
  const tn = tier(s);

  let html = '<div class="t">Zadowolenie / Porządek' + (isPh ? '<span class="ph">podgląd</span>' : '') + '</div>';
  html += '<div class="r"><span class="l">\u{1F600} Szczęście</span><span>' + s.szczescie + '</span></div>';
  html += bar(s.szczescie, scale, 'var(--gold)');
  html += '<div class="r"><span class="l">⚖️ Porządek (Prawo)</span><span>' + s.porzadek + '</span></div>';
  html += bar(s.porzadek, scale, 'var(--green)');
  html += '<div class="r"><span class="l">Zadowolenie (suma)</span><span style="font-weight:700">' + z + '</span></div>';
  html += '<div class="r"><span class="l">Próg T1 / T2</span><span>' + s.progT1 + ' / ' + s.progT2 + '</span></div>';

  if (tn === 0) html += '<div class="status ok">✓ Spokój — miasto pracuje normalnie</div>';
  else if (tn === 1) html += '<div class="status t1">⚠ T1 — miasto pracuje gorzej</div>';
  else html += '<div class="status t2">\u{1F525} T2 — BUNT</div>';

  html += '<div class="note">Poniżej T1: kary do pracy. Poniżej T2: bunt (utrata kontroli). '
    + 'Szczęście z budynków/religii, Porządek z garnizonu/prawa.</div>';
  rootEl.innerHTML = html;
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
  render();
  rootEl.style.display = 'block';
}

/** Przelacz/odswiez dla innego miasta. */
export function updateOrderPanel(cityId?: string): void {
  if (cityId !== undefined) activeCityId = cityId;
  render();
}

/** Ukryj panel. */
export function hideOrderPanel(): void { if (rootEl !== null) rootEl.style.display = 'none'; }

/** Czy widoczny. */
export function isOrderPanelOpen(): boolean { return rootEl !== null && rootEl.style.display !== 'none'; }
