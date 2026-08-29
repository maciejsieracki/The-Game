/**
 * triumphCityStateNotice.ts — modal „TRIUMF!" po zjednoczeniu miast-państw tej
 * tej samej kultury co gracz (P-PODBOJ-MIAST-PANSTW-TRIUMF-POPUP-Q1=A).
 *
 * Strukturalnie wzorowany na `wonderCompletedNotice.ts` (host wyśrodkowany na
 * ekranie, backdrop półprzezroczysty klikalny-do-zamknięcia, karta ze złotym
 * wariantem „mine" — laur/gold glow, nagłówek z ikoną SVG, tytuł serif,
 * podtytuł, rząd przycisków). Wyłącznie wariant złoty (triumf gracza jest
 * zawsze jego własnym sukcesem) i jeden przycisk „Rozumiem" wymagający
 * kliknięcia, żeby modal zniknął — poprzedni toast (`showHintMessage`) dało
 * się przeoczyć i był nadpisywany przez inny toast wołany chwilę wcześniej.
 *
 * Czysta prezentacja — treść (civLabel/cityName) liczona w main.ts; sens
 * tekstu zgodny z `buildTriumphCityStateUnificationMessage()`
 * (`game/triumph-city-state.ts`), tu tylko rozbity na tytuł + podtytuł + opis
 * zamiast jednego zdania w toaście.
 *
 * Wpięty w escapeOverlayStack (Evaluator FAIL 4fc770ee, znalezisko #4, Maciej 2026-08-14): ma
 * realny przycisk zamknięcia („Rozumiem"), więc kwalifikuje się identycznie jak naprawione
 * panele — commit 4fc770ee błędnie pominął go jako „bloker decyzyjny bez przycisku zamknięcia".
 * / EN: wired into escapeOverlayStack — it has a real close button ("Understood"), so it
 * qualifies the same as the panels fixed in 4fc770ee, which wrongly skipped it as "a decision
 * blocker with no close button".
 */

import { pushOverlay, popOverlay } from './escapeOverlayStack';

export interface TriumphCityStateNoticeOpts {
  civLabel: string;
  cityName: string;
  onClose?: () => void;
}

const STYLE_ID = 'civ-triumph-cs-notice-css-v1';
const HOST_ID = 'civ-triumph-cs-notice-host';
const TITLE_ID = 'civ-triumph-cs-notice-title';

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
#${HOST_ID}{position:fixed;inset:0;z-index:930;display:flex;align-items:center;justify-content:center;
  padding:20px;pointer-events:none;}
#${HOST_ID} .tn-backdrop{position:fixed;inset:0;background:rgba(2,3,6,.68);pointer-events:auto;}
#${HOST_ID} .tn-card{position:relative;width:min(520px,94vw);border-radius:14px;overflow:hidden;
  pointer-events:auto;font:14px 'Segoe UI',Tahoma,sans-serif;color:#e8e0c8;
  border:2px solid #f4e6a8;background:linear-gradient(180deg,rgba(40,34,18,.98),rgba(14,11,6,.99));
  box-shadow:0 0 48px rgba(232,216,138,.3),0 22px 60px rgba(0,0,0,.8);}
#${HOST_ID} .tn-nh{text-align:center;padding:20px 24px 12px;}
#${HOST_ID} .tn-kick{font-size:10.5px;letter-spacing:.3em;text-transform:uppercase;color:#e8d88a;}
#${HOST_ID} .tn-ttl{font-family:Georgia,serif;font-size:30px;margin-top:6px;color:#f4e6a8;
  text-shadow:0 0 18px rgba(244,230,168,.4);}
#${HOST_ID} .tn-sub{font-size:14px;color:#e8e0c8;margin-top:8px;font-weight:600;}
#${HOST_ID} .tn-nb{padding:6px 26px 22px;display:flex;flex-direction:column;gap:12px;}
#${HOST_ID} .tn-body{font-size:12.5px;color:#c8b898;line-height:1.6;text-align:center;}
#${HOST_ID} .tn-btnrow{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:4px;}
#${HOST_ID} .tn-btn{border-radius:9px;padding:10px 26px;font-size:12px;font-weight:700;letter-spacing:.06em;
  text-transform:uppercase;white-space:nowrap;cursor:pointer;border:1px solid #6a5212;border-top-color:#f8eea8;
  color:#2e2708;background:linear-gradient(180deg,#f0dc88,#b99a28);}
#${HOST_ID} .tn-btn:hover{box-shadow:0 0 14px rgba(232,216,138,.4);}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function laurelSvg(): string {
  return '<svg width="52" height="30" viewBox="0 0 54 30" fill="none" stroke="#e8d88a" stroke-width="1.6" style="margin:0 auto;display:block">'
    + '<path d="M6 26C10 18 12 10 12 4M12 4c2 4 1 9-1 12M12 4c3 3 7 4 10 4M48 26C44 18 42 10 42 4M42 4c-2 4-1 9 1 12M42 4c-3 3-7 4-10 4"></path>'
    + '<circle cx="27" cy="12" r="5"></circle><path d="M27 7v-3M27 20v3"></path></svg>';
}

/**
 * Buduje jedyną kartę komunikatu triumfu. Eksport jest celowy: regresja może
 * sprawdzić kontrakt karty bez odtwarzania całego hooka przejęcia miasta.
 */
export function buildTriumphCityStateNoticeMarkup(civLabel: string, cityName: string): string {
  const civ = (civLabel ?? '').trim() || 'Twoja cywilizacja';
  const city = (cityName ?? '').trim() || 'miasto';
  return `<div class="tn-nh">${laurelSvg()}
      <div class="tn-kick">Triumf</div>
      <div class="tn-ttl" id="${TITLE_ID}">TRIUMF!</div>
      <div class="tn-sub">${esc(civ)} zjednoczeni!</div></div>
    <div class="tn-nb">
      <div class="tn-body">Zjednoczyłeś całą kulturę ${esc(civ)}.<br>Ostatnie miasto-państwo — ${esc(city)} — znalazło się pod Twoją władzą.</div>
      <div class="tn-btnrow"><button type="button" class="tn-btn" data-act="close">Rozumiem</button></div>
    </div>`;
}

export function showTriumphCityStateNotice(opts: TriumphCityStateNoticeOpts): void {
  ensureStyles();
  // Jedno zdarzenie przejęcia może przejść przez więcej niż jedną ścieżkę
  // powiadomień. Nie twórz drugiego modala, dopóki pierwszy czeka na
  // potwierdzenie gracza.
  if (document.getElementById(HOST_ID)) return;

  const civ = (opts.civLabel ?? '').trim() || 'Twoja cywilizacja';
  const city = (opts.cityName ?? '').trim() || 'miasto';

  const host = document.createElement('div');
  host.id = HOST_ID;

  const backdrop = document.createElement('div');
  backdrop.className = 'tn-backdrop';

  const close = () => { popOverlay('triumph-city-state-notice'); host.remove(); opts.onClose?.(); };
  backdrop.addEventListener('click', close);
  pushOverlay('triumph-city-state-notice', close);

  const card = document.createElement('div');
  card.className = 'tn-card';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-labelledby', TITLE_ID);
  card.innerHTML = buildTriumphCityStateNoticeMarkup(civ, city);

  card.querySelector('[data-act="close"]')?.addEventListener('click', close);

  host.appendChild(backdrop);
  host.appendChild(card);
  document.body.appendChild(host);
}

export function hideTriumphCityStateNotice(): void {
  popOverlay('triumph-city-state-notice');
  document.getElementById(HOST_ID)?.remove();
}
