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
  /** RUNDA 3, Defekt C: szczegóły łupu eliminacji, JEDNA linia tekstu.
   *  R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1: to jest już WYŁĄCZNIE ścieżka zapasowa — gdy
   *  wołający poda `reportRows`, modal renderuje WIERSZE i tego pola nie pokazuje wcale
   *  (jeden sklejony string nie da się „ułożyć", patrz GOAL 2 dispatchu). Pole zostaje,
   *  bo tę samą treść niosą toasty (kapitulacja głodowa, szturm muru, zdobywca-AI), gdzie
   *  wiersze nie mają gdzie się wyrenderować.
   *  EN: single-line fallback only — when `reportRows` is given, the modal renders ROWS and
   *  never shows this string. Kept because the toasts still need a one-liner. */
  eliminatedDetails?: string;
  /** R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1 (GOAL 2): STRUKTURALNY bilans zdobycia — lista
   *  pozycji etykieta/wartość renderowana jako osobne WIERSZE, nie jeden `<div>` z jednym
   *  sklejonym zdaniem. Pozycje zerowe buduje się po stronie wołającego (main.ts) i po
   *  prostu ich tu nie ma — modal renderuje dokładnie to, co dostał.
   *  EN: structural capture balance — label/value rows, not one glued sentence. */
  reportRows?: readonly CaptureReportRow[];
}

/**
 * R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1 (GOAL 2) — jedna pozycja raportu zdobycia.
 *
 * `label` i `value` są ROZŁĄCZNE: etykieta nazywa zasób („Złoto ze skarbca"), wartość niesie
 * liczbę ze znakiem („+1234"). Dzięki temu nie da się powtórzyć jednostki w obu polach naraz
 * (defekt E2 dispatchu: „Nauka: +16 nauki"), a modal może je ustawić w dwóch kolumnach.
 * `tone` steruje wyłącznie kolorem wartości — nie zmienia treści.
 * EN: one capture-report line; label and value are disjoint so the unit can never be repeated.
 */
export interface CaptureReportRow {
  label: string;
  value: string;
  tone?: 'gain' | 'loss' | 'info';
  /** Grupa semantyczna pozycji: co przejęliśmy / łup / co przepadło. Modal renderuje
   *  WSZYSTKIE grupy; karta w panelu WYDARZENIA skraca się do samego łupu, bo karta ma
   *  nieść treść skróconą, a pełną pokazuje modal po kliknięciu (ten sam podział co
   *  `recordCivElimEvent` ↔ `civElimNotice.ts`). Render ignoruje to pole. */
  group?: 'przejete' | 'lup' | 'strata';
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
.civ-ccn-rows{margin:14px 0 0;text-align:left;}
.civ-ccn-rows-hdr{
  font:700 10px/1.2 Georgia,serif;letter-spacing:.14em;text-transform:uppercase;
  color:var(--gold-dim);padding:0 0 6px;border-bottom:1px solid rgba(232,216,138,0.24);
}
.civ-ccn-row{
  display:flex;align-items:baseline;justify-content:space-between;gap:14px;
  padding:7px 1px;border-bottom:1px solid rgba(232,216,138,0.10);font-size:12px;line-height:1.35;
}
.civ-ccn-row:last-child{border-bottom:none;}
.civ-ccn-row-lbl{color:var(--muted);flex:0 0 auto;}
.civ-ccn-row-val{color:var(--text);font-weight:700;text-align:right;flex:1 1 auto;}
.civ-ccn-row-gain .civ-ccn-row-val{color:#9fe0a4;}
.civ-ccn-row-loss .civ-ccn-row-val{color:#e0a49f;}
.civ-ccn-row-info .civ-ccn-row-val{color:#e8d88a;}
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

/**
 * R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1 (GOAL 2, „Tryb trzeci" reguły przeciw samooszukiwaniu):
 * KAŻDA pozycja dostaje WŁASNY element `.civ-ccn-row` z osobnymi `<span>` na etykietę i na
 * wartość. To jest różnica strukturalna, nie kosmetyczna — dopóki treść była jednym stringiem
 * w jednym `<div class="civ-ccn-elim-sub">`, żadne „ułożenie" nie było możliwe.
 * Pusta lista → pusty string (nagłówek „Bilans" też się nie pojawia).
 * EN: every entry becomes its own row element with separate label/value spans.
 */
function reportRowsHtml(rows: readonly CaptureReportRow[] | undefined): string {
  if (!rows || rows.length === 0) return '';
  const body = rows.map(r =>
    '<div class="civ-ccn-row civ-ccn-row-' + (r.tone ?? 'info') + '">'
      + '<span class="civ-ccn-row-lbl">' + esc(r.label) + '</span>'
      + '<span class="civ-ccn-row-val">' + esc(r.value) + '</span>'
    + '</div>').join('');
  return '<div class="civ-ccn-rows">'
    + '<div class="civ-ccn-rows-hdr">Bilans zdobycia</div>'
    + body
    + '</div>';
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
  const reportRows = opts?.reportRows;
  const hasRows = (reportRows?.length ?? 0) > 0;

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
          // Ścieżka zapasowa: jeden sklejony string pokazujemy WYŁĄCZNIE gdy wołający nie dał
          // wierszy (GOAL 2 — inaczej ta sama treść byłaby na ekranie dwa razy).
          + (eliminatedDetails && !hasRows
            ? '<div class="civ-ccn-elim-sub">' + esc(eliminatedDetails) + '</div>'
            : '')
        : '') +
      reportRowsHtml(reportRows) +
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

/**
 * R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1 (GOAL 3, ECHO 2 = „1+2") — TRWAŁY raport zdobycia,
 * otwierany PO TURACH z karty w panelu WYDARZENIA, a nie w chwili zdobycia.
 *
 * Różni się od `showCityCaptureNotice` wyłącznie tym, czego w tym momencie zrobić nie można:
 * nie ma „Wejdź do miasta" (miasto mogło już zmienić właściciela), został jeden przycisk
 * zamknięcia. Treść to te same WIERSZE etykieta/wartość — jedno źródło, dwa momenty pokazania.
 * EN: the same label/value rows, shown later from the Events panel; single close button.
 */
export function showCaptureReportNotice(opts: {
  title: string;
  cityName: string;
  subtitle?: string;
  rows: readonly CaptureReportRow[];
}): void {
  close();
  ensureStyles();

  root = document.createElement('div');
  root.className = 'civ-ccn-overlay';
  root.addEventListener('click', (e) => { if (e.target === root) close(); });

  const box = document.createElement('div');
  box.className = 'civ-ccn civ-ccn-elim';
  box.innerHTML =
    '<div class="civ-ccn-hdr">' +
      '<div class="civ-ccn-ic">' + modalIcon('cp-buildings', 24) + '</div>' +
      '<div class="civ-ccn-title">' + esc(opts.title) + '</div>' +
      '<div class="civ-ccn-name">' + esc(opts.cityName) + '</div>' +
      (opts.subtitle ? '<div class="civ-ccn-elim-sub">' + esc(opts.subtitle) + '</div>' : '') +
      reportRowsHtml(opts.rows) +
    '</div>' +
    '<div class="civ-ccn-foot">' +
      '<div class="civ-ccn-actions">' +
        '<button type="button" class="civ-ccn-btn civ-ccn-btn-primary" data-close>Zamknij</button>' +
      '</div>' +
    '</div>';

  box.querySelector('[data-close]')?.addEventListener('click', () => close());
  box.addEventListener('click', (e) => e.stopPropagation());
  root.appendChild(box);
  document.body.appendChild(root);

  keyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      close();
    }
  };
  document.addEventListener('keydown', keyHandler);
  pushOverlay(OVERLAY_ID, close);
}

export function hideCityCaptureNotice(): void {
  close();
}

export function isCityCaptureNoticeOpen(): boolean {
  return root !== null;
}
