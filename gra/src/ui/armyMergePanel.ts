/**
 * armyMergePanel.ts — makieta połączenia armii (v1.0).
 * Dwa stosy → jeden stos na heksie. Styl spójny z cityAttackChoice / preBattle.
 */

import { pushOverlay, popOverlay } from './escapeOverlayStack';
import { unitIconSvg } from './icons/brandAssets';
import { formatArmiaLabel, formatLiczbaPl } from './formatPl';

export interface ArmyMergeUnitRow {
  id: string;
  name: string;
  icon?: string;
  ruchLeft?: number;
  ruchMax?: number;
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
  const css = `
@keyframes amp-in{from{opacity:0;transform:scale(.97) translateY(8px)}to{opacity:1;transform:none}}
.civ-amp-overlay{
  position:fixed;inset:0;z-index:520;display:flex;align-items:center;justify-content:center;
  padding:24px;box-sizing:border-box;overflow:hidden;
  background:rgba(4,8,18,0.58);backdrop-filter:blur(3px);animation:amp-in .2s ease-out;
}
.civ-amp{
  --gold:#e8d88a;--gold-dim:#c9a84c;--muted:#7a8498;--text:#e8ebf0;--sub:#b8c0cc;
  --merge:#50b070;--panel:linear-gradient(165deg,rgba(14,20,36,0.97),rgba(8,12,24,0.98));
  font:13px "Segoe UI",Tahoma,sans-serif;color:var(--text);
  box-sizing:border-box;width:min(1080px,100%);min-width:min(720px,100%);max-width:1080px;
  max-height:calc(100vh - 48px);max-height:calc(100dvh - 48px);
  min-height:0;display:flex;flex-direction:column;
  background:var(--panel);border:1px solid rgba(232,216,138,0.38);border-radius:14px;
  box-shadow:0 20px 56px rgba(0,0,0,0.65);overflow:hidden;animation:amp-in .26s ease-out;
}
.civ-amp *{box-sizing:border-box;}
.civ-amp-hdr{flex:0 0 auto;padding:16px 20px 12px;text-align:center;border-bottom:1px solid rgba(232,216,138,0.14);
  background:linear-gradient(180deg,rgba(232,216,138,0.07),transparent);}
.civ-amp-orn{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:6px;}
.civ-amp-orn i{display:block;height:1px;width:40px;background:linear-gradient(90deg,transparent,var(--gold-dim));}
.civ-amp-orn i.r{background:linear-gradient(270deg,transparent,var(--gold-dim));}
.civ-amp-title{font:700 11px/1.2 Georgia,serif;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);}
.civ-amp-sub{font-size:11px;color:var(--muted);margin-top:4px;}
.civ-amp-roster-shell{position:relative;display:flex;flex:1 1 auto;min-width:0;min-height:0;overflow:hidden;}
.civ-amp-body{flex:1 1 auto;min-width:0;min-height:0;overflow-y:auto;overflow-x:hidden;
  padding:12px 34px 14px 18px;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:10px;align-items:start;
  scrollbar-width:none;}
.civ-amp-body::-webkit-scrollbar{display:none;}
.civ-amp-scrollbar{--amp-thumb-size:28px;appearance:none;-webkit-appearance:none;writing-mode:vertical-lr;direction:ltr;
  position:absolute;z-index:2;top:10px;right:8px;bottom:10px;width:12px;height:auto;margin:0;padding:0;
  border:0;border-radius:8px;background:rgba(232,216,138,0.12);cursor:pointer;touch-action:none;}
.civ-amp-scrollbar::-webkit-slider-runnable-track{width:12px;background:rgba(232,216,138,0.12);border-radius:8px;}
.civ-amp-scrollbar::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:var(--amp-thumb-size);border:3px solid #101729;
  border-radius:8px;background:#c9a84c;box-shadow:0 0 0 1px rgba(232,216,138,0.5);}
.civ-amp-scrollbar::-moz-range-track{width:12px;background:rgba(232,216,138,0.12);border-radius:8px;}
.civ-amp-scrollbar::-moz-range-thumb{width:6px;height:var(--amp-thumb-size);border:3px solid #101729;
  border-radius:8px;background:#c9a84c;box-shadow:0 0 0 1px rgba(232,216,138,0.5);}
.civ-amp-scrollbar:hover::-webkit-slider-thumb{background:#e8d88a;}
.civ-amp-scrollbar:hover::-moz-range-thumb{background:#e8d88a;}
.civ-amp-col{min-width:0;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px;background:rgba(255,255,255,0.03);}
.civ-amp-col-h{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px;}
.civ-amp-units{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;}
.civ-amp-row{display:flex;align-items:center;gap:8px;padding:6px 4px;border-radius:6px;
  border:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.15);min-width:0;}
.civ-amp-row-ic{font-size:18px;line-height:1;width:24px;flex:0 0 24px;text-align:center;}
.civ-amp-row-meta{flex:1;min-width:0;}
.civ-amp-row-name{font-size:12px;font-weight:700;color:#f0e8b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.civ-amp-row-mv{font-size:10px;color:var(--muted);margin-top:2px;}
.civ-amp-row.new{border-color:rgba(80,176,112,0.35);background:rgba(80,176,112,0.08);}
.civ-amp-mid{display:flex;flex-direction:column;align-items:center;justify-content:center;padding-top:28px;gap:6px;}
.civ-amp-arrow{font-size:28px;color:var(--gold-dim);line-height:1;}
.civ-amp-mid-lbl{font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;text-align:center;}
.civ-amp-result{flex:0 0 auto;margin:0 18px 12px;padding:8px 12px;border-radius:8px;text-align:center;
  font-size:12px;color:#c8ffd8;background:rgba(80,176,112,0.1);border:1px solid rgba(80,176,112,0.28);}
.civ-amp-foot{flex:0 0 auto;padding:10px 18px;display:flex;gap:12px;justify-content:space-between;align-items:stretch;
  background:rgba(7,11,20,0.96);border-bottom:1px solid rgba(232,216,138,0.14);}
.civ-amp-btn{flex:1;font:inherit;font-size:12px;font-weight:700;cursor:pointer;border-radius:8px;padding:10px 14px;border:1px solid transparent;text-align:center;min-width:0;}
.civ-amp-btn:hover{filter:brightness(1.08);}
.civ-amp-btn-merge{background:linear-gradient(135deg,rgba(80,176,112,0.85),rgba(50,130,70,0.9));color:#0a120a;border-color:rgba(120,220,140,0.5);}
.civ-amp-btn-sep{background:rgba(255,255,255,0.06);color:var(--sub);border-color:rgba(255,255,255,0.14);}
@media(max-width:760px){
  .civ-amp{min-width:0;width:100%;}
  .civ-amp-body{grid-template-columns:1fr;}
  .civ-amp-mid{padding:4px 0;flex-direction:row;}
  .civ-amp-arrow{transform:rotate(90deg);}
  .civ-amp-units{grid-template-columns:repeat(2,minmax(0,1fr));}
}
@media(max-width:420px){.civ-amp-units{grid-template-columns:1fr;}}
@media(max-height:500px){
  .civ-amp-overlay{align-items:flex-start;padding:28px;}
  .civ-amp{max-height:calc(100vh - 56px);max-height:calc(100dvh - 56px);}
}
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
  return (
    '<div class="civ-amp-row' + (isNew ? ' new' : '') + '">' +
      '<div class="civ-amp-row-ic">' + (u.icon || unitIconSvg(undefined)) + '</div>' +
      '<div class="civ-amp-row-meta">' +
        '<div class="civ-amp-row-name">' + esc(u.name) + '</div>' +
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

  const box = document.createElement('div');
  box.className = 'civ-amp';
  box.innerHTML =
    '<div class="civ-amp-hdr">' +
      '<div class="civ-amp-orn"><i></i><span>\u{1F517}</span><i class="r"></i></div>' +
      '<div class="civ-amp-title">Po\u0142\u0105czenie armii</div>' +
      '<div class="civ-amp-sub">Heks ' + esc(opts.hexLabel) + '</div>' +
    '</div>' +
    '<div class="civ-amp-foot">' +
      '<button type="button" class="civ-amp-btn civ-amp-btn-sep" data-act="sep">Zostaw osobno</button>' +
      '<button type="button" class="civ-amp-btn civ-amp-btn-merge" data-act="merge">Po\u0142\u0105cz armie</button>' +
    '</div>' +
    '<div class="civ-amp-result">' + esc(resultLabel) + '</div>' +
    '<div class="civ-amp-roster-shell">' +
    '<div class="civ-amp-body" id="civ-amp-roster">' +
      '<div class="civ-amp-col">' +
        '<div class="civ-amp-col-h">Na polu (' + opts.existing.length + ')</div>' +
        (opts.existing.length > 0
          ? '<div class="civ-amp-units">' + opts.existing.map(u => unitRowHtml(u, false)).join('') + '</div>'
          : '<div class="civ-amp-row-mv" style="padding:4px">—</div>') +
      '</div>' +
      '<div class="civ-amp-mid">' +
        '<span class="civ-amp-arrow">\u2192</span>' +
        '<span class="civ-amp-mid-lbl">do\u0142\u0105cza</span>' +
      '</div>' +
      '<div class="civ-amp-col">' +
        '<div class="civ-amp-col-h">Przybywa</div>' +
        unitRowHtml(opts.arriving, true) +
      '</div>' +
    '</div>' +
    '<input class="civ-amp-scrollbar" type="range" min="0" max="1000" step="1" value="0"' +
      ' aria-label="Przewijanie listy jednostek" aria-controls="civ-amp-roster">' +
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

  const roster = box.querySelector<HTMLDivElement>('.civ-amp-body');
  const scrollbar = box.querySelector<HTMLInputElement>('.civ-amp-scrollbar');
  if (roster && scrollbar) {
    let draggingScrollbar = false;
    const syncScrollbar = () => {
      const maxScroll = Math.max(0, roster.scrollHeight - roster.clientHeight);
      scrollbar.disabled = maxScroll <= 0;
      scrollbar.value = maxScroll > 0 ? String(Math.round(roster.scrollTop / maxScroll * 1000)) : '0';
      const thumbSize = Math.min(roster.clientHeight, Math.max(24,
        roster.clientHeight * roster.clientHeight / Math.max(roster.clientHeight, roster.scrollHeight)));
      scrollbar.style.setProperty('--amp-thumb-size', thumbSize + 'px');
    };
    roster.addEventListener('scroll', syncScrollbar, { passive: true });
    scrollbar.addEventListener('input', () => {
      const maxScroll = Math.max(0, roster.scrollHeight - roster.clientHeight);
      roster.scrollTop = Number(scrollbar.value) / 1000 * maxScroll;
    });
    const setScrollbarFromPointer = (clientY: number) => {
      const rect = scrollbar.getBoundingClientRect();
      const thumbSize = parseFloat(scrollbar.style.getPropertyValue('--amp-thumb-size')) || 24;
      const start = rect.top + thumbSize / 2;
      const end = rect.bottom - thumbSize / 2;
      const fraction = end > start ? Math.max(0, Math.min(1, (clientY - start) / (end - start))) : 0;
      scrollbar.value = String(Math.round(fraction * 1000));
      scrollbar.dispatchEvent(new Event('input', { bubbles: true }));
    };
    scrollbar.addEventListener('pointerdown', (event) => {
      if (scrollbar.disabled) return;
      event.preventDefault();
      draggingScrollbar = true;
      scrollbar.setPointerCapture(event.pointerId);
      setScrollbarFromPointer(event.clientY);
    });
    scrollbar.addEventListener('pointermove', (event) => {
      if (draggingScrollbar) setScrollbarFromPointer(event.clientY);
    });
    const endScrollbarDrag = () => { draggingScrollbar = false; };
    scrollbar.addEventListener('pointerup', endScrollbarDrag);
    scrollbar.addEventListener('pointercancel', endScrollbarDrag);
    rosterResizeObserver = new ResizeObserver(syncScrollbar);
    rosterResizeObserver.observe(roster);
    requestAnimationFrame(syncScrollbar);
  }

  // R-MERGE-DISMISS: patrz komentarz przy click-outside powyzej -- Escape to
  // dismiss, nie "Zostaw osobno" (ktore bouncowaloby jednostke).
  pushOverlay('army-merge', () => pick(opts.onMerge));

  keyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      pick(opts.onMerge);
    }
  };
  document.addEventListener('keydown', keyHandler);
}
