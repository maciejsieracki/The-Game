/**
 * wonderCompletedNotice.ts — powiadomienie „Cud ukończony” (TEMAT #16, klatka C).
 * Dwa warianty: nasz (złoty, laur) vs cudzy/wyścig przegrany (czerwony, „Rozumiem”).
 * Czysta prezentacja — dane liczone w main.ts z realnego stanu (completedWorldWonders/placedWorldWonders).
 *
 * Wpięty w escapeOverlayStack (Evaluator FAIL 4fc770ee, znalezisko #4, Maciej 2026-08-14): ma
 * realny przycisk zamknięcia („Zamknij"), więc kwalifikuje się identycznie jak naprawione
 * panele — commit 4fc770ee błędnie pominął go jako „bloker decyzyjny bez przycisku zamknięcia".
 * / EN: wired into escapeOverlayStack — it has a real close button ("Close"), so it qualifies
 * the same as the panels fixed in 4fc770ee, which wrongly skipped it as "a decision blocker
 * with no close button".
 */

import { pushOverlay, popOverlay } from './escapeOverlayStack';

export interface WonderCompletedNoticeOpts {
  variant: 'mine' | 'rival';
  nazwa: string;
  locationLabel: string; // np. "Rodos · Tura 57 · Grecy — Ty" / "Tyr · Tura 38 · Fenicjanie"
  bodyHtml: string;      // efekty (mine) lub info o przegranym wyścigu (rival)
  noteHtml?: string;
  onShowOnMap?: () => void;
  onClose?: () => void;
}

const STYLE_ID = 'civ-wonder-notice-css-v1';
const HOST_ID = 'civ-wonder-notice-host';

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
#${HOST_ID}{position:fixed;inset:0;z-index:920;display:flex;align-items:center;justify-content:center;
  padding:20px;pointer-events:none;}
#${HOST_ID} .wn-backdrop{position:fixed;inset:0;background:rgba(2,3,6,.6);pointer-events:auto;}
#${HOST_ID} .wn-card{position:relative;width:min(480px,94vw);border-radius:14px;overflow:hidden;
  box-shadow:0 22px 60px rgba(0,0,0,.75);pointer-events:auto;font:14px 'Segoe UI',Tahoma,sans-serif;color:#e8e0c8;}
#${HOST_ID} .wn-card.mine{border:2px solid #f4e6a8;background:linear-gradient(180deg,rgba(40,34,18,.98),rgba(14,11,6,.99));
  box-shadow:0 0 40px rgba(232,216,138,.25),0 22px 60px rgba(0,0,0,.75);}
#${HOST_ID} .wn-card.rival{border:2px solid rgba(200,90,70,.55);background:linear-gradient(180deg,rgba(34,16,14,.98),rgba(12,7,6,.99));}
#${HOST_ID} .wn-nh{text-align:center;padding:16px 20px 12px;}
#${HOST_ID} .wn-kick{font-size:10px;letter-spacing:.28em;text-transform:uppercase;}
#${HOST_ID} .wn-ttl{font-family:Georgia,serif;font-size:24px;margin-top:4px;}
#${HOST_ID} .wn-sub{font-size:11.5px;color:#c8b898;margin-top:4px;}
#${HOST_ID} .wn-nb{padding:10px 22px 16px;display:flex;flex-direction:column;gap:10px;}
#${HOST_ID} .wn-fx{font-size:11.5px;color:#e8e0c8;line-height:1.55;text-align:center;}
#${HOST_ID} .wn-nt{font-size:10px;color:#8a8070;text-align:center;line-height:1.5;}
#${HOST_ID} .wn-btnrow{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:2px;}
#${HOST_ID} .wn-btn{border-radius:9px;padding:8px 15px;font-size:11px;font-weight:700;letter-spacing:.06em;
  text-transform:uppercase;white-space:nowrap;cursor:pointer;border:2px solid rgba(232,216,138,.4);color:#e8d88a;
  background:linear-gradient(180deg,#161c28,#0a0d14);}
#${HOST_ID} .wn-btn:hover{border-color:#e8d88a;box-shadow:0 0 10px rgba(232,216,138,.3);}
#${HOST_ID} .wn-btn.primary{border:1px solid #6a5212;border-top-color:#f8eea8;color:#2e2708;
  background:linear-gradient(180deg,#f0dc88,#b99a28);}
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
  return '<svg width="46" height="26" viewBox="0 0 54 30" fill="none" stroke="#e8d88a" stroke-width="1.6" style="margin:0 auto;display:block">'
    + '<path d="M6 26C10 18 12 10 12 4M12 4c2 4 1 9-1 12M12 4c3 3 7 4 10 4M48 26C44 18 42 10 42 4M42 4c-2 4-1 9 1 12M42 4c-3 3-7 4-10 4"></path>'
    + '<circle cx="27" cy="12" r="5"></circle><path d="M27 7v-3M27 20v3"></path></svg>';
}

function rivalSvg(): string {
  return '<svg width="34" height="26" viewBox="0 0 40 30" fill="none" stroke="#e08a8a" stroke-width="1.6" style="margin:0 auto;display:block">'
    + '<path d="M8 26h24M12 26V10l8-6 8 6v16"></path><path d="M14 4 26 16M26 4 14 16" stroke-width="2"></path></svg>';
}

export function showWonderCompletedNotice(opts: WonderCompletedNoticeOpts): void {
  ensureStyles();
  document.getElementById(HOST_ID)?.remove();

  const host = document.createElement('div');
  host.id = HOST_ID;

  const backdrop = document.createElement('div');
  backdrop.className = 'wn-backdrop';

  const close = () => { popOverlay('wonder-completed-notice'); host.remove(); opts.onClose?.(); };
  backdrop.addEventListener('click', close);
  pushOverlay('wonder-completed-notice', close);

  const mine = opts.variant === 'mine';
  const card = document.createElement('div');
  card.className = 'wn-card ' + (mine ? 'mine' : 'rival');
  const btns: string[] = [];
  if (mine) {
    if (opts.onShowOnMap) btns.push('<button type="button" class="wn-btn primary" data-act="map">Pokaż na mapie</button>');
    btns.push('<button type="button" class="wn-btn" data-act="close">Zamknij</button>');
  } else {
    btns.push('<button type="button" class="wn-btn" data-act="close">Rozumiem</button>');
  }
  card.innerHTML = `<div class="wn-nh">${mine ? laurelSvg() : rivalSvg()}
      <div class="wn-kick" style="color:${mine ? '#e8d88a' : '#e08a8a'}">${mine ? 'Cud ukończony' : 'Cud rywala'}</div>
      <div class="wn-ttl" style="color:${mine ? '#f4e6a8' : '#e8c8c8'}">${esc(opts.nazwa)}</div>
      <div class="wn-sub">${esc(opts.locationLabel)}</div></div>
    <div class="wn-nb">
      <div class="wn-fx">${opts.bodyHtml}</div>
      ${opts.noteHtml ? `<div class="wn-nt">${opts.noteHtml}</div>` : ''}
      <div class="wn-btnrow">${btns.join('')}</div>
    </div>`;

  card.querySelector('[data-act="close"]')?.addEventListener('click', close);
  card.querySelector('[data-act="map"]')?.addEventListener('click', () => {
    opts.onShowOnMap?.();
    close();
  });

  host.appendChild(backdrop);
  host.appendChild(card);
  document.body.appendChild(host);
}

export function hideWonderCompletedNotice(): void {
  popOverlay('wonder-completed-notice');
  document.getElementById(HOST_ID)?.remove();
}
