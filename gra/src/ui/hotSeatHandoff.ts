/**
 * hotSeatHandoff.ts
 * R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1 — pełnoekranowa zasłona przekazania kontroli między
 * fotelami hot-seatu. Projekt: `dyspozycje/autobot/runs/
 * R-HOTSEAT-ETAP5-RECON-SWITCH-HUMAN-Q1/01-operator-runda1-analiza.md` §3 (kontrakt §3.3,
 * analiza bezpieczeństwa synchroniczności §3.2).
 *
 * Wzorzec skopiowany z `ui/preBattle.ts` (scrim + overlay, oba `document.createElement` +
 * `appendChild(document.body)`) i `ui/escapeOverlayStack.ts` (`pushOverlay`/`popOverlay` —
 * NIE wynajdujemy własnego mechanizmu Escape/z-index-warstw, §3.1 recon).
 *
 * Escape CELOWO bez akcji — `onClose` przekazane do `pushOverlay` jest pustą funkcją.
 * Ekran NIE może zostać pominięty bez kliknięcia "Kontynuuj" (recon §3.3): to jest
 * ostatnia linia obrony "zero śladu fotela A widocznego fotelowi B", bezpieczeństwo przez
 * politykę, nie tylko przez fizykę silnika (switchActiveHuman() jest i tak w pełni
 * synchroniczne, §3.2 — Escape nie powinien w ogóle być dostępną drogą ucieczki z tego
 * konkretnego overlaya).
 *
 * Z-index: `.pb-map-scrim` (preBattle.ts) = 9899, `.pb-overlay` = 9900, hint toast w
 * gałęzi `isPreBattleOpen()` main.ts = 9950 (najwyższa dotąd używana wartość w src/,
 * świeżo zweryfikowane grepem `z-index` w tej rundzie — recon §3.3 flagował to jako
 * "do sprawdzenia"). Handoff musi przykryć WSZYSTKO, w tym ewentualny niedomknięty
 * modal, jako ostatnia linia obrony — 9970 (scrim) / 9980 (overlay) bije obie.
 */

import { pushOverlay, popOverlay } from './escapeOverlayStack';
import { civIconSvg } from './icons/brandAssets';

export interface HotSeatHandoffInfo {
  /** np. "Gracz 1" / nazwa cywilizacji fotela odchodzącego. */
  fromLabel: string;
  /** np. "Gracz 2" / nazwa cywilizacji nowego aktywnego fotela. */
  toLabel: string;
  /** ikonaId cywilizacji nowego aktywnego — spójność z civIconSvg (preBattle.ts wzorzec). */
  toCivIconId?: string;
}

const SCRIM_CLASS = 'hot-seat-handoff-scrim';
const OVERLAY_CLASS = 'hot-seat-handoff-overlay';
const OVERLAY_ID = 'hot-seat-handoff';

let stylesInjected = false;
let scrimEl: HTMLDivElement | null = null;
let overlayEl: HTMLDivElement | null = null;
let activeOnContinue: (() => void) | null = null;

function ensureStyles(): void {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
.${SCRIM_CLASS}{position:fixed;inset:0;z-index:9970;background:#05060a;pointer-events:none;}
.${OVERLAY_CLASS}{position:fixed;inset:0;z-index:9980;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:22px;
  background:radial-gradient(ellipse at center,rgba(24,26,38,0.97) 0%,rgba(6,7,12,0.99) 72%);
  color:#f0e6c8;font-family:Arial,sans-serif;text-align:center;pointer-events:auto;}
.${OVERLAY_CLASS} .hsh-icon{width:96px;height:96px;display:flex;align-items:center;
  justify-content:center;filter:drop-shadow(0 6px 18px rgba(0,0,0,0.6));}
.${OVERLAY_CLASS} .hsh-icon svg{width:100%;height:100%;}
.${OVERLAY_CLASS} .hsh-from{font-size:14px;opacity:0.65;letter-spacing:0.04em;
  text-transform:uppercase;}
.${OVERLAY_CLASS} .hsh-to{font-size:30px;font-weight:700;margin:0;}
.${OVERLAY_CLASS} .hsh-btn{margin-top:12px;padding:14px 34px;font-size:16px;font-weight:600;
  color:#1a1408;background:linear-gradient(#ffe08a,#e8b84b);border:1px solid #a97c1f;
  border-radius:8px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.45);}
.${OVERLAY_CLASS} .hsh-btn:hover{filter:brightness(1.06);}
.${OVERLAY_CLASS} .hsh-hint{font-size:12px;opacity:0.55;max-width:360px;}
`;
  document.head.appendChild(style);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]!));
}

function buildOverlay(info: HotSeatHandoffInfo, onContinue: () => void): HTMLDivElement {
  const el = document.createElement('div');
  el.className = OVERLAY_CLASS;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  const iconHtml = info.toCivIconId
    ? `<div class="hsh-icon">${civIconSvg(info.toCivIconId, 96)}</div>`
    : '';
  el.innerHTML = `
    ${iconHtml}
    <div class="hsh-from">${escapeHtml(info.fromLabel)} zakończył turę</div>
    <h1 class="hsh-to">Przekazanie kontroli: ${escapeHtml(info.toLabel)}</h1>
    <p class="hsh-hint">Odsuń się od ekranu — kliknij, gdy grający ${escapeHtml(info.toLabel)} jest gotowy.</p>
    <button type="button" class="hsh-btn">Kliknij aby kontynuować</button>
  `;
  const btn = el.querySelector('.hsh-btn') as HTMLButtonElement | null;
  btn?.addEventListener('click', () => onContinue());
  return el;
}

/**
 * Pokazuje pełnoekranową zasłonę przekazania kontroli. Montuje scrim + overlay
 * SYNCHRONICZNIE (jak `showPreBattle()`, §3.1/§3.2 recon) — bezpieczne wołać przed lub po
 * `switchActiveHuman()`, bo cała ta funkcja jest sama w sobie synchroniczna (zero
 * `await`/`Promise`/`setTimeout`) — przeglądarka nie może wymalować klatki pomiędzy.
 *
 * `onContinue` jest wołane WYŁĄCZNIE kliknięciem przycisku — Escape (via `pushOverlay`
 * poniżej) jest celowo no-opem.
 */
export function showHotSeatHandoff(info: HotSeatHandoffInfo, onContinue: () => void): void {
  hideHotSeatHandoff();
  ensureStyles();
  scrimEl = document.createElement('div');
  scrimEl.className = SCRIM_CLASS;
  scrimEl.setAttribute('aria-hidden', 'true');
  document.body.appendChild(scrimEl);
  activeOnContinue = onContinue;
  overlayEl = buildOverlay(info, () => activeOnContinue?.());
  document.body.appendChild(overlayEl);
  pushOverlay(OVERLAY_ID, () => { /* Escape celowo bez akcji — patrz docstring modułu */ });
}

export function hideHotSeatHandoff(): void {
  if (overlayEl !== null) {
    overlayEl.remove();
    overlayEl = null;
  }
  if (scrimEl !== null) {
    scrimEl.remove();
    scrimEl = null;
  }
  activeOnContinue = null;
  popOverlay(OVERLAY_ID);
}

export function isHotSeatHandoffOpen(): boolean {
  return overlayEl !== null;
}
