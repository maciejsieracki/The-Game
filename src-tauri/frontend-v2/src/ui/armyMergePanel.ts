/**
 * armyMergePanel.ts — makieta połączenia armii (v1.0).
 * Dwa stosy → jeden stos na heksie. Styl spójny z cityAttackChoice / preBattle.
 * v1.1 (R-WEB-ARMY-MERGE-PANEL-LIST-VISIBILITY-Q1): panel mieści się w oknie, nagłówek i
 * przyciski stale w kadrze, przewija się tylko lista „Na polu” (siatka 3 kolumny × 5 rzędów
 * jak w armySplitPanel), stały licznik „Na polu · Dołącza · Razem” (jedno źródło liczby
 * z paskiem „Armia — N jednostek”) i wskaźnik „jeszcze N poniżej”. Logika łączenia bez zmian.
 */

import { pushOverlay, popOverlay } from './escapeOverlayStack';
import { unitIconSvg } from './icons/brandAssets';
import { formatArmiaLabel, formatJednostkiCount, formatLiczbaPl } from './formatPl';
import { armyStackCardLabel, sortArmyStackGeneralsFirst } from './armyStackLabel';

export interface ArmyMergeUnitRow {
  id: string;
  name: string;
  icon?: string;
  ruchLeft?: number;
  ruchMax?: number;
  /** Rola dowódcy (tylko dla generała/wodza) — wtedy etykieta to „Rola — typ". */
  commanderTitle?: 'Wódz' | 'Generał';
}

export interface ArmyMergePanelOpts {
  hexLabel: string;
  /** Jednostki już stojące na heksie (bez przybywającej). */
  existing: ArmyMergeUnitRow[];
  /** Jednostka, która właśnie weszła / ma dołączyć. */
  arriving: ArmyMergeUnitRow;
  /** Liczba przybywających (gdy >1 — etykieta „Skład (N)”). */
  arrivingCount?: number;
  /** Cofnięcie ruchu przy „Zostaw osobno”. */
  rejectFrom?: { q: number; r: number };
  moveCost?: number;
  onMerge: () => void;
  onSeparate: () => void;
}

let root: HTMLDivElement | null = null;
let keyHandler: ((e: KeyboardEvent) => void) | null = null;
let rosterResizeObserver: ResizeObserver | null = null;

const STYLE_ID = 'civ-army-merge-css-v1';

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  // Tokeny: brand-book (icons/brand/tokens.css, --tg-*) z fallbackami = wartosci kanonu.
  const css = `
@keyframes amp-in{from{opacity:0;transform:scale(.97) translateY(8px)}to{opacity:1;transform:none}}
.civ-amp-overlay{
  position:fixed;inset:0;z-index:520;display:flex;align-items:center;justify-content:center;
  padding:24px;box-sizing:border-box;overflow:hidden;
  background:rgba(4,8,18,0.58);backdrop-filter:blur(3px);animation:amp-in .2s ease-out;
}
.civ-amp{
  --gold:var(--tg-gold-primary,#e8d88a);--gold-dim:var(--tg-gold-dim,#a08030);
  --muted:var(--tg-text-muted,#8a8070);--text:var(--tg-text-primary,#e8e0c8);--sub:#b8b09a;
  --ring:var(--tg-focus-ring,var(--tg-gold-primary,#e8d88a));
  --merge:#50b070;--amp-row:46px;--amp-gap:6px;--amp-pad:4px;
  --amp-grid-full:calc(5*var(--amp-row) + 4*var(--amp-gap) + 2*var(--amp-pad) + 2px);
  --amp-grid-min:calc(2*var(--amp-row) + var(--amp-gap) + 2*var(--amp-pad) + 2px);
  font:13px var(--tg-font-ui,"Segoe UI",Tahoma,sans-serif);color:var(--text);
  box-sizing:border-box;width:min(640px,100%);
  max-height:calc(100vh - 48px);max-height:calc(100dvh - 48px);
  min-height:0;display:flex;flex-direction:column;
  background:var(--tg-panel-grad,linear-gradient(165deg,rgba(14,20,36,0.97),rgba(8,12,24,0.98)));
  border:1px solid rgba(232,216,138,0.38);border-radius:var(--tg-radius-panel,14px);
  box-shadow:0 20px 56px rgba(0,0,0,0.65);overflow:hidden;animation:amp-in .26s ease-out;
}
.civ-amp *{box-sizing:border-box;}
.civ-amp-hdr{flex:0 0 auto;padding:14px 20px 10px;text-align:center;border-bottom:1px solid rgba(232,216,138,0.14);
  background:linear-gradient(180deg,rgba(232,216,138,0.07),transparent);}
.civ-amp-orn{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:6px;}
.civ-amp-orn i{display:block;height:1px;width:40px;background:linear-gradient(90deg,transparent,var(--gold-dim));}
.civ-amp-orn i.r{background:linear-gradient(270deg,transparent,var(--gold-dim));}
.civ-amp-title{font:700 12px/1.2 var(--tg-font-title,Georgia,serif);letter-spacing:.12em;text-transform:uppercase;color:var(--gold);}
.civ-amp-sub{font-size:11px;color:var(--muted);margin-top:4px;}
.civ-amp-foot{flex:0 0 auto;padding:10px 18px;display:flex;gap:12px;justify-content:space-between;align-items:stretch;
  background:rgba(7,11,20,0.96);border-bottom:1px solid rgba(232,216,138,0.14);}
.civ-amp-btn{flex:1;font:inherit;font-size:12px;font-weight:700;cursor:pointer;border-radius:8px;padding:10px 14px;border:1px solid transparent;text-align:center;min-width:0;}
.civ-amp-btn:hover{filter:brightness(1.08);}
.civ-amp-btn:focus-visible{outline:2px solid var(--ring);outline-offset:3px;}
.civ-amp-btn-merge{background:linear-gradient(135deg,rgba(80,176,112,0.85),rgba(50,130,70,0.9));color:#0a120a;border-color:rgba(120,220,140,0.5);}
.civ-amp-btn-sep{background:rgba(255,255,255,0.06);color:var(--sub);border-color:rgba(255,255,255,0.14);}
.civ-amp-result{flex:0 0 auto;margin:10px 18px 0;padding:7px 12px;border-radius:8px;text-align:center;
  color:#c8ffd8;background:rgba(80,176,112,0.1);border:1px solid rgba(80,176,112,0.28);}
.civ-amp-result-main{font-size:12px;font-weight:700;}
.civ-amp-sum{font-size:11px;color:var(--sub);margin-top:3px;}
.civ-amp-sum b{color:var(--gold);font-weight:700;font-variant-numeric:tabular-nums;}
.civ-amp-body{flex:1 1 auto;min-width:0;min-height:0;overflow-y:auto;overflow-x:hidden;padding:10px 18px 14px;
  scrollbar-width:thin;scrollbar-color:var(--gold-dim) transparent;}
.civ-amp-sec{min-width:0;}
.civ-amp-col-h{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px;}
.civ-amp-wrap{position:relative;}
.civ-amp-units{position:relative;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:var(--amp-row);gap:var(--amp-gap);
  padding:var(--amp-pad);overflow-y:auto;overflow-x:hidden;
  max-height:clamp(var(--amp-grid-min),calc(100vh - 430px),var(--amp-grid-full));
  max-height:clamp(var(--amp-grid-min),calc(100dvh - 430px),var(--amp-grid-full));
  border:1px solid rgba(255,255,255,0.08);border-radius:10px;background:rgba(0,0,0,0.18);
  scrollbar-width:thin;scrollbar-color:var(--gold-dim) transparent;}
.civ-amp-units:focus-visible{outline:2px solid var(--ring);outline-offset:2px;}
.civ-amp-wrap.has-more::after{content:"";position:absolute;left:1px;right:1px;bottom:1px;height:26px;border-radius:0 0 9px 9px;
  background:linear-gradient(180deg,transparent,rgba(8,12,24,0.92));pointer-events:none;}
.civ-amp-more{display:block;width:100%;margin:4px 0 0;padding:0;height:18px;font:inherit;font-size:11px;font-weight:700;
  color:var(--gold);background:none;border:0;cursor:pointer;text-align:center;visibility:hidden;}
.civ-amp-more.on{visibility:visible;}
.civ-amp-more:focus-visible{outline:2px solid var(--ring);outline-offset:1px;border-radius:4px;}
.civ-amp-row{display:flex;align-items:center;gap:8px;padding:0 8px;border-radius:8px;
  border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.03);min-width:0;}
.civ-amp-row-ic{font-size:18px;line-height:1;width:24px;height:24px;flex:0 0 24px;display:inline-flex;align-items:center;justify-content:center;}
.civ-amp-row-ic svg{width:24px;height:24px;}
.civ-amp-row-meta{flex:1;min-width:0;}
.civ-amp-row-name{font-size:12px;font-weight:700;color:#f0e8b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.civ-amp-row-mv{font-size:10px;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.civ-amp-row.new{border-color:rgba(80,176,112,0.35);background:rgba(80,176,112,0.08);}
.civ-amp-row.cmd .civ-amp-row-name{color:#ffe27a;font-weight:800;}
.civ-amp-mid{display:flex;align-items:center;justify-content:center;gap:6px;height:26px;}
.civ-amp-arrow{font-size:16px;color:var(--gold-dim);line-height:1;}
.civ-amp-mid-lbl{font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;text-align:center;}
.civ-amp-units.arr{overflow:visible;max-height:none;}
@media(max-width:559px){
  .civ-amp-units{grid-template-columns:repeat(2,minmax(0,1fr));}
  .civ-amp-foot{gap:8px;padding:8px 12px;}
  .civ-amp-btn{padding:9px 8px;}
  .civ-amp-result{margin:8px 12px 0;}
  .civ-amp-body{padding:8px 12px 12px;}
}
@media(max-width:359px){.civ-amp-units{grid-template-columns:1fr;}}
@media(max-height:500px){
  .civ-amp-overlay{align-items:flex-start;padding:28px;}
  .civ-amp{max-height:calc(100vh - 56px);max-height:calc(100dvh - 56px);}
}
@media(prefers-reduced-motion:reduce){.civ-amp-overlay,.civ-amp{animation:none;}}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function unitRowHtml(u: ArmyMergeUnitRow, isNew: boolean): string {
  const mv = u.ruchMax !== undefined && u.ruchLeft !== undefined
    ? formatLiczbaPl(u.ruchLeft, 2) + '/' + formatLiczbaPl(u.ruchMax, 2) + ' ruch'
    : '';
  // Generał/wódz: etykieta „Generał — Wojownik” (rola + typ), jak na karcie stosu.
  const label = armyStackCardLabel(u);
  return (
    '<div class="civ-amp-row' + (isNew ? ' new' : '') + (u.commanderTitle ? ' cmd' : '') + '" role="listitem">' +
      '<div class="civ-amp-row-ic" aria-hidden="true">' + (u.icon || unitIconSvg(undefined)) + '</div>' +
      '<div class="civ-amp-row-meta">' +
        '<div class="civ-amp-row-name">' + esc(label) + '</div>' +
        (mv ? '<div class="civ-amp-row-mv">' + esc(mv) + '</div>' : '') +
      '</div>' +
    '</div>'
  );
}

function detachKeyboard(): void {
  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }
}

function closePanel(): void {
  popOverlay('army-merge');
  detachKeyboard();
  rosterResizeObserver?.disconnect();
  rosterResizeObserver = null;
  if (root) {
    root.remove();
    root = null;
  }
}

function pick(fn: () => void): void {
  closePanel();
  fn();
}

export function hideArmyMergePanel(): void {
  closePanel();
}

export function isArmyMergePanelOpen(): boolean {
  return root !== null;
}

export function showArmyMergePanel(opts: ArmyMergePanelOpts): void {
  closePanel();
  ensureStyles();

  const arriveN = opts.arrivingCount ?? 1;
  const total = opts.existing.length + arriveN;
  const resultLabel = formatArmiaLabel(total) + ' na ' + opts.hexLabel;

  root = document.createElement('div');
  root.className = 'civ-amp-overlay';
  // R-MERGE-DISMISS (2026-07-26, zgloszenie blokujace: "zwiadowca cofa sie do
  // miasta na koniec tury"): klik w tlo NIE moze byc rownowazny "Zostaw osobno"
  // (opts.onSeparate) -- ta akcja ma efekt uboczny assignBounceHexesForUnits w
  // main.ts, ktory PRZESUWA wlasnie przybyla jednostke z powrotem w strone
  // punktu, z ktorego wyszla (lub na sasiedni heks, jesli zajety). Ten panel
  // potrafi wyskoczyc odlozony (flushDeferredMergePrompts, main.ts) dokladnie
  // na przelomie tury/ruchu gracza -- przypadkowy klik w mapie tuz po tym
  // (gracz nie zdazyl zauwazyc modala) dotychczas SAMOCZYNNIE teleportowal
  // jednostke, ktora gracz przed chwila wyslal w nowe miejsce. Dismiss (klik w
  // tlo / Escape) ma byc NIEDESTRUKCYJNY -- domyslnie "Polacz" (onMerge), ktory
  // NIE rusza zadnej jednostki (jednostki i tak juz stoja razem na heksie;
  // "Polacz" tylko synchronizuje pulę ruchu/zaznaczenie), w przeciwienstwie do
  // "Zostaw osobno".
  root.addEventListener('click', (e) => {
    if (e.target === root) pick(opts.onMerge);
  });

  const fieldN = opts.existing.length;
  const box = document.createElement('div');
  box.className = 'civ-amp';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-labelledby', 'civ-amp-title');
  // Jedno zrodlo liczby: fieldN + arriveN = total -> pasek „Armia — N”, licznik i naglowki sekcji.
  box.innerHTML =
    '<div class="civ-amp-hdr">' +
      '<div class="civ-amp-orn" aria-hidden="true"><i></i><span>\u{1F517}</span><i class="r"></i></div>' +
      '<div class="civ-amp-title" id="civ-amp-title">Połączenie armii</div>' +
      '<div class="civ-amp-sub">Heks ' + esc(opts.hexLabel) + '</div>' +
    '</div>' +
    '<div class="civ-amp-foot">' +
      '<button type="button" class="civ-amp-btn civ-amp-btn-sep" data-act="sep">Zostaw osobno</button>' +
      '<button type="button" class="civ-amp-btn civ-amp-btn-merge" data-act="merge">Połącz armie</button>' +
    '</div>' +
    '<div class="civ-amp-result" role="status" aria-live="polite">' +
      '<div class="civ-amp-result-main">' + esc(resultLabel) + '</div>' +
      '<div class="civ-amp-sum" data-total="' + total + '" data-field="' + fieldN + '" data-arrive="' + arriveN + '">' +
        'Na polu: <b>' + fieldN + '</b> · Dołącza: <b>' + arriveN + '</b> · Razem: <b>' + total + '</b>' +
      '</div>' +
    '</div>' +
    '<div class="civ-amp-body" id="civ-amp-roster">' +
      '<div class="civ-amp-sec" data-sec="field">' +
        '<div class="civ-amp-col-h">Na polu (' + fieldN + ')</div>' +
        (fieldN > 0
          ? '<div class="civ-amp-wrap">' +
              '<div class="civ-amp-units" role="list" tabindex="0" aria-label="Jednostki na polu: ' + fieldN + '">' +
                sortArmyStackGeneralsFirst(opts.existing).map(u => unitRowHtml(u, false)).join('') +
              '</div>' +
            '</div>' +
            '<button type="button" class="civ-amp-more" tabindex="-1" aria-hidden="true"></button>'
          : '<div class="civ-amp-row-mv" style="padding:4px">—</div>') +
      '</div>' +
      '<div class="civ-amp-mid" aria-hidden="true">' +
        '<span class="civ-amp-arrow">▼</span>' +
        '<span class="civ-amp-mid-lbl">dołącza</span>' +
      '</div>' +
      '<div class="civ-amp-sec" data-sec="arrive">' +
        '<div class="civ-amp-col-h">Przybywa (' + arriveN + ')</div>' +
        '<div class="civ-amp-units arr" role="list" aria-label="Jednostki dołączające: ' + arriveN + '">' +
          unitRowHtml(opts.arriving, true) +
        '</div>' +
      '</div>' +
    '</div>';

  box.querySelector('[data-act="merge"]')?.addEventListener('click', () => pick(opts.onMerge));
  box.querySelector('[data-act="sep"]')?.addEventListener('click', () => pick(opts.onSeparate));
  box.addEventListener('click', (e) => e.stopPropagation());

  root.appendChild(box);
  // UI zoom in hud.ts applies transform:scale() to <body>. A fixed-position
  // descendant of that transformed body is fixed to its transformed bounds,
  // not the browser viewport, which can push the modal/CTA outside the screen
  // at 150%. Mount the modal as a sibling of body so fixed/inset/max-height use
  // the real viewport while the game canvas and HUD remain scaled below it.
  document.documentElement.appendChild(root);

  // Wskaznik „jeszcze N ponizej”: liczy kafelki, ktore nie mieszcza sie w pelni w oknie listy;
  // znika po dojsciu do konca (lub gdy lista nie wymaga przewijania).
  const grid = box.querySelector<HTMLDivElement>('[data-sec="field"] .civ-amp-units');
  const more = box.querySelector<HTMLButtonElement>('.civ-amp-more');
  const wrap = box.querySelector<HTMLDivElement>('[data-sec="field"] .civ-amp-wrap');
  if (grid && more && wrap) {
    const syncMore = () => {
      const limit = grid.scrollTop + grid.clientHeight + 1;
      let below = 0;
      grid.querySelectorAll<HTMLElement>('.civ-amp-row').forEach((row) => {
        if (row.offsetTop + row.offsetHeight > limit) below++;
      });
      const show = grid.scrollHeight - grid.clientHeight > 1 && below > 0;
      more.classList.toggle('on', show);
      wrap.classList.toggle('has-more', show);
      more.textContent = show ? '▼ jeszcze ' + formatJednostkiCount(below) : '';
      more.dataset.below = String(show ? below : 0);
      more.tabIndex = show ? 0 : -1;
      more.setAttribute('aria-hidden', show ? 'false' : 'true');
      more.setAttribute('aria-label', show ? 'Przewiń w dół: jeszcze ' + formatJednostkiCount(below) : '');
    };
    grid.addEventListener('scroll', syncMore, { passive: true });
    more.addEventListener('click', () => {
      grid.scrollTo({ top: grid.scrollHeight, behavior: 'auto' });
      grid.focus({ preventScroll: true });
      syncMore();
    });
    if (typeof ResizeObserver !== 'undefined') {
      rosterResizeObserver = new ResizeObserver(syncMore);
      rosterResizeObserver.observe(grid);
    }
    syncMore();
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(syncMore);
  }

  // R-MERGE-DISMISS: patrz komentarz przy click-outside powyzej -- Escape to
  // dismiss, nie "Zostaw osobno" (ktore bouncowaloby jednostke).
  pushOverlay('army-merge', () => pick(opts.onMerge));

  keyHandler = (e: KeyboardEvent) => {
    // Enter na sfokusowanym przycisku wykonuje jego wlasna akcje (np. „Zostaw osobno”).
    if (e.key === 'Enter' && (e.target as HTMLElement | null)?.tagName !== 'BUTTON') {
      e.preventDefault();
      pick(opts.onMerge);
    }
  };
  document.addEventListener('keydown', keyHandler);
  box.querySelector<HTMLButtonElement>('[data-act="merge"]')?.focus({ preventScroll: true });
}
