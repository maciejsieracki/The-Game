/**
 * empireBalance.ts
 * Panel "Bilans" (UI plan pkt 2) — zbiorczy bilans zasobow imperium na ture.
 *
 * DOM-only, DECOUPLED: zero importow z game/*; dane podaje silnik przez getBalance()
 * (ma je z ticku tury) + getPlayer()/getTurn().  Dzieki temu modul jest trywialny
 * do testu i nie duplikuje logiki ekonomii.
 *
 * LANE: src/ui/*.  Pokazanie/odswiezenie panelu (po kazdej turze) wpina master/silnik.
 * Source: literalny UTF-8 dla polskich napisow.
 */

export interface EmpireBalance {
  praca: number;
  pieniadz: number;
  nauka: number;
  kultura: number;
  zywnosc: number;
}

export interface PlayerSnapshot {
  skarbiec: number;
  nauka: number;
  era: number;
  badana?: string | null;
}

export interface BalancePanelConfig {
  /** Zbiorczy bilans na ture (sumy z miast gracza) — silnik z ticku tury. */
  getBalance: () => EmpireBalance;
  /** Stan gracza (skarbiec, nauka skumulowana, epoka, badana technologia). */
  getPlayer?: () => PlayerSnapshot;
  /** Numer tury. */
  getTurn?: () => number;
}

let cfg: BalancePanelConfig | null = null;
let rootEl: HTMLDivElement | null = null;

const STYLE_ID = 'civ-balance-css';
function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-bal{position:fixed;top:60px;left:12px;width:210px;z-index:320;
  --gold:#e0b24a;--green:#6bbf59;--red:#d36b5e;--blue:#5a9bd4;--muted:#9aa6b6;
  background:rgba(20,24,32,0.94);color:#e8ebf0;border:1px solid rgba(224,178,74,0.3);
  border-radius:8px;padding:10px 12px;font:13px monospace;box-shadow:0 4px 20px rgba(0,0,0,0.6);}
.civ-bal *{box-sizing:border-box;}
.civ-bal .t{font-size:0.78em;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--gold);
  border-bottom:1px solid rgba(224,178,74,0.25);padding-bottom:4px;margin-bottom:6px;display:flex;justify-content:space-between;}
.civ-bal .r{display:flex;justify-content:space-between;align-items:center;padding:2px 0;}
.civ-bal .r .l{color:var(--muted);} .civ-bal .r .v{font-weight:700;}
.civ-bal .tot{border-top:1px solid rgba(224,178,74,0.2);margin-top:6px;padding-top:6px;font-size:0.85em;}
.civ-bal .tot .r .l{color:var(--muted);}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

function signed(n: number): string { return (n > 0 ? '+' : '') + String(n); }

function row(icon: string, label: string, value: number, colorClass: string): string {
  const head = icon ? icon + ' ' + label : label;
  return '<div class="r"><span class="l">' + head + '</span><span class="v ' + colorClass + '">' + signed(value) + '</span></div>';
}

function render(): void {
  if (rootEl === null || cfg === null) return;
  const b = cfg.getBalance();
  const p = cfg.getPlayer ? cfg.getPlayer() : null;
  const turn = cfg.getTurn ? cfg.getTurn() : null;
  const foodCls = b.zywnosc > 0 ? 'green' : b.zywnosc < 0 ? 'red' : '';
  let html = '<div class="t"><span>Bilans / turę</span>' + (turn !== null ? '<span class="muted">T' + turn + '</span>' : '') + '</div>';
  html += row('\u{1F528}', 'Praca', b.praca, 'gold');
  html += row('\u{1F4B1}', 'Pieniądz', b.pieniadz, 'blue');
  html += row('', 'Nauka', b.nauka, 'blue');
  html += row('\u{1F3AD}', 'Kultura', b.kultura, 'gold');
  html += row('\u{1F35E}', 'Żywność', b.zywnosc, foodCls);
  if (p) {
    html += '<div class="tot">';
    html += '<div class="r"><span class="l">Skarbiec</span><span class="v gold">' + p.skarbiec + '</span></div>';
    html += '<div class="r"><span class="l">Nauka (zapas)</span><span class="v blue">' + p.nauka + '</span></div>';
    html += '<div class="r"><span class="l">Epoka</span><span class="v">' + p.era + '</span></div>';
    if (p.badana) html += '<div class="r"><span class="l">Badana</span><span class="v">' + p.badana + '</span></div>';
    html += '</div>';
  }
  rootEl.innerHTML = html;
}

/** Pokaz panel Bilans. */
export function showBalancePanel(config: BalancePanelConfig): void {
  cfg = config;
  ensureStyles();
  if (rootEl === null) {
    rootEl = document.createElement('div');
    rootEl.className = 'civ-bal';
    document.body.appendChild(rootEl);
  }
  render();
  rootEl.style.display = 'block';
}

/** Odswiez wartosci (np. po zakonczeniu tury). */
export function updateBalancePanel(): void { render(); }

/** Ukryj panel. */
export function hideBalancePanel(): void { if (rootEl !== null) rootEl.style.display = 'none'; }

/** Czy panel widoczny. */
export function isBalancePanelOpen(): boolean { return rootEl !== null && rootEl.style.display !== 'none'; }
