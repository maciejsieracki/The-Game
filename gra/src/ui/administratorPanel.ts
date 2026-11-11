/**
 * administratorPanel.ts — R-WEB-UI-IMPROVEMENT-AUTOMATION-LOCKED-WITHOUT-ADMIN-Q1 (DODATEK 4, specyfikacja właściciela).
 *
 * Mały panel wyboru administratora, otwierany przyciskiem „Administrator … +” (administrator ulepszeń
 * w panelu budowy, administrator miasta w nagłówku miasta). Mówi graczowi PRZED zatrudnieniem:
 *   (1) czym jest administrator i do czego służy,
 *   (2) jakie daje bonusy (liczby z silnika: administratorBaseEffectsPct / administratorTierScale),
 *   (3) ile kosztuje zatrudnienie i utrzymanie na turę (chipy ikona+liczba, jedno źródło: city-administrator-params.json),
 *   (4) co się dzieje bez administratora i po zatrudnieniu,
 * i dopiero wtedy pozwala kliknąć „Zatrudnij” (nieaktywne przy braku środków, z informacją ile brakuje) albo „Anuluj”.
 * Zatrudniony administrator: ten sam panel pokazuje stan, bonusy i „Zwolnij”.
 *
 * W grze jest JEDEN wariant administratora każdego rodzaju (poziom miasta wynika z budynku administracyjnego,
 * nie z wyboru gracza) — panel nie wymyśla wariantów do wyboru.
 *
 * Escapowanie: dane tekstowe (nazwa miasta, powód blokady) przechodzą przez escapeHtmlText DOKŁADNIE raz;
 * chipy surowców (`resourceAmountChipHtml`) są już HTML-em i NIE są escapowane ponownie.
 */

import { administratorIconHtml, ADMINISTRATOR_ICON_CSS } from './icons/administratorIcon';
import { resourceAmountChipHtml, escapeHtmlText, RESOURCE_CHIP_CSS } from './resourceAmountChip';
import { pushOverlay, popOverlay } from './escapeOverlayStack';
import {
  administratorBaseEffectsPct,
  administratorTierScale,
  administratorDescription,
  improvementAdministratorDescription,
  type AdminTier,
} from '../game/city-administrator';

export type AdministratorPanelKind = 'city' | 'improvements';

/** Dane panelu (wszystkie liczby pochodzą z silnika/JSON przez stan UI z main.ts). */
export interface AdministratorPanelModel {
  kind: AdministratorPanelKind;
  cityName: string;
  hired: boolean;
  working: boolean;
  hireCost: number;
  /** Utrzymanie na turę (Pieniądz) — dla miasta zależy od poziomu budynku administracyjnego. */
  upkeep: number;
  /** Stan skarbca państwa; `null` = nieznany (panel nie liczy braków). */
  treasury: number | null;
  /** Poziom budynku administracyjnego (tylko administrator miasta). */
  tier?: number;
  /** Powód twardej blokady zatrudnienia (np. brak budynku administracyjnego); null = brak. */
  blockReasonText: string | null;
}

export interface AdministratorPanelHooks {
  /** Świeży model (po zatrudnieniu/zwolnieniu); `null` = zamknij panel. */
  getModel: () => AdministratorPanelModel | null;
  onHire: () => boolean;
  onDismiss: () => boolean;
  /** Wołane po zamknięciu panelu (dowolną drogą). */
  onClose?: () => void;
}

export interface AdministratorPanelHandle {
  el: HTMLElement;
  close: () => void;
}

const STYLE_ID = 'civ-administrator-panel-css';
const HOST_CLASS = 'civ-adm-panel-host';
const OVERLAY_ID = 'administrator-panel';

const fmtPct = (v: number): string => String(Math.round(v * 100) / 100).replace('.', ',');

/** Ile brakuje do kosztu zatrudnienia (0 = stać albo skarbiec nieznany). */
export function administratorHireShortfall(m: Pick<AdministratorPanelModel, 'hireCost' | 'treasury'>): number {
  if (m.treasury === null || !Number.isFinite(m.treasury)) return 0;
  return Math.max(0, Math.ceil(m.hireCost - m.treasury));
}

/** Czy przycisk „Zatrudnij” ma być nieaktywny (twarda blokada albo brak środków). */
export function administratorHireDisabled(m: AdministratorPanelModel): boolean {
  return !m.hired && (m.blockReasonText !== null || administratorHireShortfall(m) > 0);
}

function titleFor(m: AdministratorPanelModel): string {
  return m.kind === 'city' ? 'Administrator miasta' : 'Administrator ulepszeń';
}

/** Krótkie „czym jest / do czego służy” — treść opisowa z JSON (jedno źródło), bez żargonu. */
function lead(m: AdministratorPanelModel): string {
  if (m.kind === 'city') {
    return 'Administrator to osoba przypisana do jednego miasta (maksymalnie jeden na miasto). '
      + administratorDescription();
  }
  return 'Administrator to osoba przypisana do jednego miasta (maksymalnie jeden na miasto). '
    + improvementAdministratorDescription();
}

/** Lista bonusów: liczby z `administratorBaseEffectsPct` × skala poziomu (miasto) albo „brak bonusów” (ulepszenia). */
function bonusRows(m: AdministratorPanelModel): string {
  if (m.kind === 'improvements') {
    return '<li data-adm-bonus="auto">Automatyczne ulepszanie terenu w tym mieście — wg profilu wybranego w panelu budowy.</li>'
      + '<li data-adm-bonus="none">Bez dodatkowych bonusów do produkcji, podatków ani korupcji.</li>';
  }
  const tier = (m.tier !== undefined && m.tier >= 1 ? Math.min(3, Math.round(m.tier)) : 1) as AdminTier;
  const scale = administratorTierScale(tier);
  const base = administratorBaseEffectsPct();
  const f = (v: number): string => fmtPct(v * scale);
  return `<li data-adm-bonus="korupcja">Korupcja w mieście: <b>−${f(base.korupcja)}%</b></li>`
    + `<li data-adm-bonus="produkcja">Produkcja miasta: <b>+${f(base.produkcja)}%</b></li>`
    + `<li data-adm-bonus="podatki">Ściągalność podatków miasta: <b>+${f(base.podatki)}%</b></li>`
    + '<li data-adm-bonus="auto">Automatyczna budowa budynków w tym mieście.</li>'
    + `<li class="civ-adm-panel-sub" data-adm-bonus="scale">Poziom budynku administracyjnego: ${tier}`
    + ` (skala ×${String(scale).replace('.', ',')}); wyższy poziom wzmacnia bonusy.</li>`;
}

/** Skutki: co się dzieje bez administratora i po zatrudnieniu. */
function effectRows(m: AdministratorPanelModel): string {
  // Rodzaj gramatyczny: „budowa” (ż.) vs „ulepszanie” (n.) — zgodność orzecznika.
  const what = m.kind === 'city' ? 'automatyczna budowa budynków' : 'automatyczne ulepszanie terenu';
  const on = m.kind === 'city' ? 'włączona' : 'włączone';
  const paused = m.kind === 'city' ? 'wstrzymana' : 'wstrzymane';
  const upkeepChip = resourceAmountChipHtml('pieniadz', String(m.upkeep));
  if (m.hired) {
    return `<li data-adm-effect="state">${m.working
      ? 'Administrator pracuje — ' + what + ' w tym mieście jest ' + on + '.'
      : 'Administrator nie pracuje (brak środków w skarbcu państwa na utrzymanie) — ' + what + ' jest ' + paused + ', dopóki skarbiec nie pokryje utrzymania.'}</li>`
      + `<li data-adm-effect="upkeep">Utrzymanie ${upkeepChip} na turę płaci skarbiec państwa.</li>`
      + `<li data-adm-effect="dismiss">Po zwolnieniu ${what} w tym mieście przestaje działać, a koszt zatrudnienia nie wraca.</li>`;
  }
  return `<li data-adm-effect="without">Bez administratora ${what} w tym mieście jest ${paused} — wszystko robisz ręcznie.</li>`
    + `<li data-adm-effect="after">Po zatrudnieniu ${what} zaczyna działać, a ${upkeepChip} na turę schodzi ze skarbca państwa (nie z zasobów miasta).</li>`
    + '<li data-adm-effect="where">Zwolnisz go w tym samym panelu (przycisk administratora).</li>';
}

/** Czysty HTML wnętrza panelu (bez kontenera/backdropu) — testowalny bez DOM. */
export function administratorPanelInnerHtml(m: AdministratorPanelModel): string {
  const title = titleFor(m);
  const icon = administratorIconHtml({
    size: 28,
    state: m.hired ? (m.working ? 'ok' : 'idle') : 'ok',
    variant: m.kind,
  });
  const shortfall = administratorHireShortfall(m);
  const costChip = resourceAmountChipHtml('pieniadz', String(m.hireCost));
  const upkeepChip = resourceAmountChipHtml('pieniadz', String(m.upkeep));
  const status = m.hired
    ? (m.working ? 'Zatrudniony — pracuje' : 'Zatrudniony — nie pracuje (brak środków)')
    : 'Niezatrudniony';
  let html = '<div class="civ-adm-panel-head">'
    + `<span class="civ-adm-panel-ic">${icon}</span>`
    + '<div class="civ-adm-panel-headtxt">'
    + `<h3 id="civ-adm-panel-title">${escapeHtmlText(title)}</h3>`
    + `<div class="civ-adm-panel-city" data-adm-city>${escapeHtmlText(m.cityName)} · <span data-adm-status>${escapeHtmlText(status)}</span></div>`
    + '</div>'
    + '<button type="button" class="civ-adm-panel-x" data-adm-panel-cancel aria-label="Zamknij panel administratora">✕</button>'
    + '</div>';
  html += '<div class="civ-adm-panel-body">';
  html += `<p class="civ-adm-panel-lead" data-adm-lead>${escapeHtmlText(lead(m))}</p>`;
  html += '<div class="civ-adm-panel-sec">Bonusy</div>';
  html += `<ul class="civ-adm-panel-list" data-adm-bonuses>${bonusRows(m)}</ul>`;
  html += '<div class="civ-adm-panel-sec">Koszt</div>';
  html += '<div class="civ-adm-panel-costs" data-adm-costs>'
    + `<div data-adm-cost>Zatrudnienie (jednorazowo): <b>${costChip}</b></div>`
    + `<div data-adm-upkeep>Utrzymanie: <b>${upkeepChip}</b> na turę ze skarbca państwa</div>`
    + (m.treasury !== null && !m.hired
      ? `<div class="civ-adm-panel-sub" data-adm-treasury>W skarbcu masz: ${resourceAmountChipHtml('pieniadz', String(Math.floor(m.treasury)))}</div>`
      : '')
    + '</div>';
  html += '<div class="civ-adm-panel-sec">Skutek</div>';
  html += `<ul class="civ-adm-panel-list" data-adm-effects>${effectRows(m)}</ul>`;
  if (!m.hired && m.blockReasonText !== null) {
    html += `<div class="civ-adm-panel-warn" role="alert" data-adm-block>${escapeHtmlText(m.blockReasonText)}</div>`;
  } else if (!m.hired && shortfall > 0) {
    html += `<div class="civ-adm-panel-warn" role="alert" data-adm-shortfall>Brakuje ${resourceAmountChipHtml('pieniadz', String(shortfall))} do zatrudnienia.</div>`;
  }
  html += '</div>';
  html += '<div class="civ-adm-panel-foot">';
  if (m.hired) {
    html += '<button type="button" class="civ-adm-panel-btn civ-adm-panel-btn--danger" data-adm-panel-dismiss>Zwolnij</button>'
      + '<button type="button" class="civ-adm-panel-btn" data-adm-panel-cancel>Zamknij</button>';
  } else {
    const disabled = administratorHireDisabled(m);
    html += `<button type="button" class="civ-adm-panel-btn civ-adm-panel-btn--primary" data-adm-panel-confirm${disabled ? ' disabled aria-disabled="true"' : ''}>Zatrudnij</button>`
      + '<button type="button" class="civ-adm-panel-btn" data-adm-panel-cancel>Anuluj</button>';
  }
  html += '</div>';
  return html;
}

/** CSS panelu (wstrzykiwany raz; zawiera style ikony i chipa, by panel działał bez zależności od kolejności otwarcia). */
export const ADMINISTRATOR_PANEL_CSS = `
.${HOST_CLASS}{position:fixed;inset:0;z-index:1200;display:flex;align-items:center;justify-content:center;padding:16px;
font-family:var(--tg-font-ui,'Segoe UI',Tahoma,sans-serif);color:var(--tg-text-primary,#e8e0c8);}
.${HOST_CLASS} .civ-adm-panel-back{position:absolute;inset:0;background:rgba(2,3,6,.62);}
.${HOST_CLASS} .civ-adm-panel{position:relative;box-sizing:border-box;width:min(380px,100%);max-height:calc(100vh - 32px);overflow:auto;
border:2px solid var(--tg-gold-primary,#e8d88a);border-radius:var(--tg-radius-panel,12px);
background:var(--tg-panel-grad,linear-gradient(180deg,rgba(18,24,32,.98),rgba(8,10,16,.98)));box-shadow:0 12px 40px rgba(0,0,0,.6);}
.${HOST_CLASS} .civ-adm-panel-head{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid rgba(232,216,138,.24);}
.${HOST_CLASS} .civ-adm-panel-headtxt{flex:1;min-width:0;}
.${HOST_CLASS} h3{margin:0;font:600 17px var(--tg-font-title,Georgia,serif);color:#f4e6a8;}
.${HOST_CLASS} .civ-adm-panel-city{font-size:11.5px;color:var(--tg-text-muted,#a89f88);margin-top:2px;}
.${HOST_CLASS} .civ-adm-panel-x{flex:none;width:28px;height:28px;border-radius:8px;border:1px solid rgba(232,216,138,.4);
background:#11161f;color:var(--tg-gold-primary,#e8d88a);cursor:pointer;font:inherit;}
.${HOST_CLASS} .civ-adm-panel-body{padding:10px 14px 4px;font-size:12.5px;line-height:1.45;}
.${HOST_CLASS} .civ-adm-panel-lead{margin:0 0 6px;}
.${HOST_CLASS} .civ-adm-panel-sec{margin:10px 0 4px;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--tg-gold-primary,#e8d88a);font-weight:700;}
.${HOST_CLASS} .civ-adm-panel-list{margin:0;padding-left:18px;}
.${HOST_CLASS} .civ-adm-panel-list li{margin:2px 0;}
.${HOST_CLASS} .civ-adm-panel-sub{color:var(--tg-text-muted,#a89f88);font-size:11.5px;}
.${HOST_CLASS} .civ-adm-panel-costs div{margin:2px 0;}
.${HOST_CLASS} .civ-adm-panel-warn{margin:10px 0 2px;padding:6px 8px;border-radius:6px;border:1px solid #c0392b;background:rgba(192,57,43,.16);color:#ffb4a8;}
.${HOST_CLASS} .civ-adm-panel-foot{display:flex;gap:8px;justify-content:flex-end;padding:10px 14px 14px;}
.${HOST_CLASS} .civ-adm-panel-btn{padding:7px 16px;border-radius:8px;border:1px solid rgba(232,216,138,.45);background:linear-gradient(180deg,#1b2230,#0c1018);
color:var(--tg-gold-primary,#e8d88a);font:600 13px inherit;cursor:pointer;}
.${HOST_CLASS} .civ-adm-panel-btn--primary{background:linear-gradient(180deg,#3a5a2c,#223a18);border-color:#7fbf5a;color:#e8f6d8;}
.${HOST_CLASS} .civ-adm-panel-btn--danger{border-color:#c0392b;color:#ffb4a8;}
.${HOST_CLASS} .civ-adm-panel-btn:disabled{opacity:.45;cursor:not-allowed;}
.${HOST_CLASS} .civ-adm-panel-btn:focus-visible,.${HOST_CLASS} .civ-adm-panel-x:focus-visible{outline:2px solid #f4e6a8;outline-offset:2px;}
[data-theme="light"] .${HOST_CLASS} .civ-adm-panel{background:#faf6e8;color:#2a2418;}
[data-theme="light"] .${HOST_CLASS} h3{color:#5a4208;}
${ADMINISTRATOR_ICON_CSS}
${RESOURCE_CHIP_CSS}
`;

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const st = document.createElement('style');
  st.id = STYLE_ID;
  st.textContent = ADMINISTRATOR_PANEL_CSS;
  document.head.appendChild(st);
}

let current: { host: HTMLElement; close: () => void } | null = null;

/** Czy panel administratora jest otwarty (dla bram „klik poza panelem”). */
export function isAdministratorPanelOpen(): boolean {
  return current !== null && current.host.isConnected;
}

/** Otwiera panel wyboru administratora (jeden naraz). Zamykanie: Esc (stos nakładek), tło, ✕/Anuluj/Zamknij. */
export function openAdministratorPanel(hooks: AdministratorPanelHooks): AdministratorPanelHandle | null {
  const first = hooks.getModel();
  if (!first) return null;
  if (current) current.close();
  ensureStyle();
  const prevFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const host = document.createElement('div');
  host.className = HOST_CLASS;
  host.setAttribute('data-adm-panel-host', '');
  const back = document.createElement('div');
  back.className = 'civ-adm-panel-back';
  back.setAttribute('data-adm-panel-back', '');
  const dlg = document.createElement('div');
  dlg.className = 'civ-adm-panel';
  dlg.setAttribute('role', 'dialog');
  dlg.setAttribute('aria-modal', 'true');
  dlg.setAttribute('aria-labelledby', 'civ-adm-panel-title');
  dlg.tabIndex = -1;
  host.appendChild(back);
  host.appendChild(dlg);
  document.body.appendChild(host);

  let closed = false;
  const close = (): void => {
    if (closed) return;
    closed = true;
    popOverlay(OVERLAY_ID);
    host.remove();
    if (current && current.host === host) current = null;
    try { prevFocus?.focus(); } catch { /* element zniknął */ }
    hooks.onClose?.();
  };

  const render = (focusSel?: string): void => {
    const m = hooks.getModel();
    if (!m) { close(); return; }
    dlg.setAttribute('data-adm-kind', m.kind);
    dlg.setAttribute('data-adm-hired', m.hired ? '1' : '0');
    dlg.innerHTML = administratorPanelInnerHtml(m);
    dlg.querySelectorAll('[data-adm-panel-cancel]').forEach(b => b.addEventListener('click', close));
    dlg.querySelector('[data-adm-panel-confirm]')?.addEventListener('click', () => {
      const cur = hooks.getModel();
      if (!cur || cur.hired || administratorHireDisabled(cur)) return; // guard: bez środków/blokady — bez zatrudnienia
      hooks.onHire();
      render('[data-adm-panel-dismiss]');
    });
    dlg.querySelector('[data-adm-panel-dismiss]')?.addEventListener('click', () => {
      hooks.onDismiss();
      render('[data-adm-panel-confirm]');
    });
    const target = (focusSel ? dlg.querySelector<HTMLElement>(focusSel) : null)
      ?? dlg.querySelector<HTMLElement>('button:not([disabled]):not(.civ-adm-panel-x)')
      ?? dlg;
    target.focus();
  };

  back.addEventListener('pointerdown', (e) => { e.stopPropagation(); close(); });
  back.addEventListener('click', (e) => e.stopPropagation());
  // Prosty trap fokusu (Tab krąży po przyciskach panelu).
  dlg.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const items = Array.from(dlg.querySelectorAll<HTMLElement>('button:not([disabled])'));
    if (items.length === 0) return;
    const firstEl = items[0]!;
    const lastEl = items[items.length - 1]!;
    if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
    else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
  });

  pushOverlay(OVERLAY_ID, close);
  current = { host, close };
  render();
  return { el: host, close };
}
