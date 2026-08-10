/**
 * cityCaptureNotice.ts — tabliczka po zdobyciu miasta.
 * Styl spójny z cityAttackChoice / siegeMapPanel.
 */

import { brandIconSvg } from './icons/brandAssets';
import { pushOverlay, popOverlay } from './escapeOverlayStack';

const OVERLAY_ID = 'city-capture-notice';

let root: HTMLDivElement | null = null;
let keyHandler: ((e: KeyboardEvent) => void) | null = null;

const STYLE_ID = 'civ-city-capture-css-v2';

export interface CityCaptureNoticeOpts {
  /** Otwórz panel miasta (przycisk „Wejdź do miasta"). */
  onEnterCity?: () => void;
  /** Zostań na mapie (przycisk „Wróć na mapę"). */
  onStayOnMap?: () => void;
  /** R-BRAK-KOMUNIKATU-ELIMINACJA-CYWILIZACJI=A: gdy podane, to przejęcie wyeliminowało
   *  ostatnie miasto tej cywilizacji — modal dostaje nagłówek ELIMINACJA! zamiast osobnego
   *  toastu, który ginąłby pod tym modalem (ten sam wzorzec kolizji co Triumf zjednoczenia). */
  eliminatedCivLabel?: string;
  /** RUNDA 3, Defekt C: szczegóły łupu eliminacji (liczba przejętych tech + zdobyte Power) —
   *  stary toast (przed d7718ad5) niósł tę treść, nowy modal ją tracił. Pokazywane tylko gdy
   *  `eliminatedCivLabel` jest podane.
   *  EN: elimination loot details (copied tech count + captured Power) — the pre-d7718ad5
   *  toast carried this, the new modal dropped it. Shown only when `eliminatedCivLabel` is set. */
  eliminatedDetails?: string;
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
@keyframes ccn-in{from{opacity:0;transform:scale(.97) translateY(6px)}to{opacity:1;transform:none}}
.civ-ccn-overlay{
  position:fixed;inset:0;z-index:660;display:flex;align-items:center;justify-content:center;
  background:rgba(4,8,18,0.62);backdrop-filter:blur(3px);animation:ccn-in .22s ease-out;
}
.civ-ccn{
  --gold:#e8d88a;--gold-dim:#c9a84c;--muted:#7a8498;--text:#e8ebf0;
  --panel:linear-gradient(165deg,rgba(14,20,36,0.97),rgba(8,12,24,0.98));
  font:13px "Segoe UI",Tahoma,sans-serif;color:var(--text);
  min-width:min(360px,calc(100vw - 32px));max-width:420px;
  background:var(--panel);border:1px solid rgba(232,216,138,0.42);border-radius:14px;
  box-shadow:0 20px 60px rgba(0,0,0,0.65);overflow:hidden;animation:ccn-in .28s ease-out;
  text-align:center;
}
.civ-ccn *{box-sizing:border-box;}
.civ-ccn-hdr{padding:22px 22px 18px;}
.civ-ccn-ic{
  display:flex;align-items:center;justify-content:center;margin-bottom:10px;line-height:0;
}
.civ-ccn-ic .siege-modal-ic{width:48px;height:48px;color:var(--gold);}
.civ-ccn-title{
  font:700 12px/1.2 Georgia,serif;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);
}
.civ-ccn-name{font-size:20px;font-weight:700;color:#f0e8b8;margin:10px 0 0;}
.civ-ccn.civ-ccn-elim .civ-ccn-title{color:var(--gold);font-size:14px;}
.civ-ccn-elim-sub{font-size:12px;color:var(--gold-dim);margin:8px 0 0;line-height:1.4;}
.civ-ccn-foot{padding:0 22px 22px;}
.civ-ccn-actions{display:flex;flex-direction:column;gap:8px;}
.civ-ccn-btn{
  font:inherit;font-size:12px;font-weight:700;cursor:pointer;width:100%;
  padding:10px 16px;border-radius:8px;
}
.civ-ccn-btn-primary{
  border:1px solid rgba(232,216,138,0.35);
  background:linear-gradient(135deg,rgba(232,216,138,0.22),rgba(201,168,76,0.18));
  color:#f0e8b8;
}
.civ-ccn-btn-primary:hover{filter:brightness(1.08);}
.civ-ccn-btn-secondary{
  border:1px solid rgba(122,132,152,0.35);
  background:rgba(12,16,26,0.55);
  color:#b8c0d0;
}
.civ-ccn-btn-secondary:hover{background:rgba(20,26,40,0.75);color:#e2e6ec;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function modalIcon(id: string, size: 20 | 24 = 24): string {
  const svg = brandIconSvg(id, size);
  return svg ? svg.replace('<svg ', '<svg class="siege-modal-ic" ') : '';
}

function close(): void {
  popOverlay(OVERLAY_ID);
  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }
  if (root) {
    root.remove();
    root = null;
  }
}

/** Tabliczka po zdobyciu miasta — tytuł, nazwa, wybór: panel miasta lub mapa. */
export function showCityCaptureNotice(
  cityName: string,
  opts?: CityCaptureNoticeOpts,
): void {
  close();
  ensureStyles();

  const enter = () => {
    close();
    opts?.onEnterCity?.();
  };
  const stay = () => {
    close();
    opts?.onStayOnMap?.();
  };

  const eliminated = opts?.eliminatedCivLabel;
  const eliminatedDetails = opts?.eliminatedDetails;

  root = document.createElement('div');
  root.className = 'civ-ccn-overlay';
  root.addEventListener('click', (e) => {
    if (e.target === root) stay();
  });

  const box = document.createElement('div');
  box.className = 'civ-ccn' + (eliminated ? ' civ-ccn-elim' : '');
  box.innerHTML =
    '<div class="civ-ccn-hdr">' +
      '<div class="civ-ccn-ic">' + modalIcon('cp-buildings', 24) + '</div>' +
      '<div class="civ-ccn-title">' + (eliminated ? 'ELIMINACJA!' : 'Miasto zdobyte') + '</div>' +
      '<div class="civ-ccn-name">' + esc(cityName) + '</div>' +
      (eliminated
        ? '<div class="civ-ccn-elim-sub">' + esc(eliminated) + ' — ostatnie miasto przejęte, cywilizacja wyeliminowana</div>'
          + (eliminatedDetails
            ? '<div class="civ-ccn-elim-sub">' + esc(eliminatedDetails) + '</div>'
            : '')
        : '') +
    '</div>' +
    '<div class="civ-ccn-foot">' +
      '<div class="civ-ccn-actions">' +
        '<button type="button" class="civ-ccn-btn civ-ccn-btn-primary" data-enter>Wejdź do miasta</button>' +
        '<button type="button" class="civ-ccn-btn civ-ccn-btn-secondary" data-stay>Wróć na mapę</button>' +
      '</div>' +
    '</div>';

  box.querySelector('[data-enter]')?.addEventListener('click', enter);
  box.querySelector('[data-stay]')?.addEventListener('click', stay);
  box.addEventListener('click', (e) => e.stopPropagation());
  root.appendChild(box);
  document.body.appendChild(root);

  keyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      enter();
    }
  };
  document.addEventListener('keydown', keyHandler);
  pushOverlay(OVERLAY_ID, stay);
}

export function hideCityCaptureNotice(): void {
  close();
}

export function isCityCaptureNoticeOpen(): boolean {
  return root !== null;
}
