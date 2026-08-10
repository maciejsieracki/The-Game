/**
 * civElimNotice.ts — modal „ELIMINACJA!" dla wchłonięcia dyplomatycznego (miasto-państwo lub
 * major AI), R-BRAK-KOMUNIKATU-ELIMINACJA-CYWILIZACJI, RUNDA 5.
 *
 * Runda 5 (Maciej, ECHO B+C): komunikat eliminacji przez wchłonięcie dyplomatyczne trafia jako
 * karta side-panelu „Wydarzenia" (dyskretna, widoczna od razu — patrz recordCivElimEvent w
 * main.ts); kliknięcie karty otwiera TEN modal z pełną treścią. W odróżnieniu od
 * cityCaptureNotice.ts (podbój bojowy — modal ma dwa wyjścia: „Wejdź do miasta"/„Wróć na
 * mapę"), tu nie ma naturalnego "wejścia do niczego" (wchłonięcie dyplomatyczne nie daje
 * jednego świeżo zdobytego miasta do otwarcia) — jeden przycisk „OK", zamyka i nigdzie nie
 * prowadzi. Struktura wzorowana na triumphCityStateNotice.ts (najprostszy istniejący modal
 * jednoprzyciskowy w tym katalogu — host wyśrodkowany, backdrop klikalny-do-zamknięcia, karta
 * ze złotym obramowaniem zastąpionym tu czerwonym wariantem ostrzegawczym).
 *
 * EN: diplomatic-annex ELIMINATION modal — opened by clicking the side-panel "Events" card
 * (Round 5, owner decision B+C). Unlike cityCaptureNotice.ts (combat conquest — two exits),
 * there's no "enter city" here (diplomatic annexation doesn't hand you one freshly captured
 * city to open), so a single "OK" button that just closes. Modeled on
 * triumphCityStateNotice.ts, the simplest existing single-button modal in this folder —
 * centered host, click-to-close backdrop, card — with the gold border swapped for a red
 * warning variant.
 */

export interface CivElimNoticeOpts {
  /** Etykieta wyeliminowanej cywilizacji/miasta-państwa. */
  civLabel: string;
  /** Szczegóły (liczba miast wchłoniętych itd.) — dokładnie treść dawnego scalonego toastu. */
  details: string;
  onClose?: () => void;
}

const STYLE_ID = 'civ-elim-notice-css-v1';
const HOST_ID = 'civ-elim-notice-host';

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
#${HOST_ID}{position:fixed;inset:0;z-index:930;display:flex;align-items:center;justify-content:center;
  padding:20px;pointer-events:none;}
#${HOST_ID} .cen-backdrop{position:fixed;inset:0;background:rgba(2,3,6,.68);pointer-events:auto;}
#${HOST_ID} .cen-card{position:relative;width:min(460px,94vw);border-radius:14px;overflow:hidden;
  pointer-events:auto;font:14px 'Segoe UI',Tahoma,sans-serif;color:#e8e0c8;
  border:2px solid #e8a8a8;background:linear-gradient(180deg,rgba(40,18,18,.98),rgba(14,6,6,.99));
  box-shadow:0 0 48px rgba(232,138,138,.28),0 22px 60px rgba(0,0,0,.8);}
#${HOST_ID} .cen-hd{text-align:center;padding:22px 24px 12px;}
#${HOST_ID} .cen-kick{font-size:10.5px;letter-spacing:.3em;text-transform:uppercase;color:#e8a8a8;}
#${HOST_ID} .cen-ttl{font-family:Georgia,serif;font-size:28px;margin-top:6px;color:#f4b8b8;
  text-shadow:0 0 18px rgba(244,168,168,.35);}
#${HOST_ID} .cen-sub{font-size:14px;color:#e8e0c8;margin-top:8px;font-weight:600;}
#${HOST_ID} .cen-bd{padding:6px 26px 22px;display:flex;flex-direction:column;gap:12px;}
#${HOST_ID} .cen-details{font-size:12.5px;color:#c8b8b8;line-height:1.6;text-align:center;}
#${HOST_ID} .cen-btnrow{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:4px;}
#${HOST_ID} .cen-btn{border-radius:9px;padding:10px 26px;font-size:12px;font-weight:700;letter-spacing:.06em;
  text-transform:uppercase;white-space:nowrap;cursor:pointer;border:1px solid #6a1212;border-top-color:#f8a8a8;
  color:#2e0808;background:linear-gradient(180deg,#f0a888,#b94a28);}
#${HOST_ID} .cen-btn:hover{box-shadow:0 0 14px rgba(232,138,138,.4);}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Modal ELIMINACJA! — nagłówek, nazwa cywilizacji, szczegóły, jeden przycisk OK. */
export function showCivElimNotice(opts: CivElimNoticeOpts): void {
  ensureStyles();
  document.getElementById(HOST_ID)?.remove();

  const civ = (opts.civLabel ?? '').trim() || 'Cywilizacja';
  const details = (opts.details ?? '').trim();

  const host = document.createElement('div');
  host.id = HOST_ID;

  const backdrop = document.createElement('div');
  backdrop.className = 'cen-backdrop';

  const close = () => { host.remove(); opts.onClose?.(); };
  backdrop.addEventListener('click', close);

  const card = document.createElement('div');
  card.className = 'cen-card';
  card.innerHTML = `<div class="cen-hd">
      <div class="cen-kick">Dyplomacja</div>
      <div class="cen-ttl">ELIMINACJA!</div>
      <div class="cen-sub">${esc(civ)}</div></div>
    <div class="cen-bd">
      ${details ? `<div class="cen-details">${esc(details)}</div>` : ''}
      <div class="cen-btnrow"><button type="button" class="cen-btn" data-act="close">OK</button></div>
    </div>`;

  card.querySelector('[data-act="close"]')?.addEventListener('click', close);
  card.addEventListener('click', (e) => e.stopPropagation());

  host.appendChild(backdrop);
  host.appendChild(card);
  document.body.appendChild(host);
}

export function hideCivElimNotice(): void {
  document.getElementById(HOST_ID)?.remove();
}
