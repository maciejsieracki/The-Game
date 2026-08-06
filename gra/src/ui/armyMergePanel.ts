/**
 * armyMergePanel.ts — makieta połączenia armii (v1.0).
 * Dwa stosy → jeden stos na heksie. Styl spójny z cityAttackChoice / preBattle.
 */

import { pushOverlay, popOverlay } from './escapeOverlayStack';
import { unitIconSvg } from './icons/brandAssets';
import { formatArmiaLabel } from './formatPl';

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

const STYLE_ID = 'civ-army-merge-css-v1';

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
@keyframes amp-in{from{opacity:0;transform:scale(.97) translateY(8px)}to{opacity:1;transform:none}}
.civ-amp-overlay{
  position:fixed;inset:0;z-index:520;display:flex;align-items:center;justify-content:center;
  background:rgba(4,8,18,0.58);backdrop-filter:blur(3px);animation:amp-in .2s ease-out;
}
.civ-amp{
  --gold:#e8d88a;--gold-dim:#c9a84c;--muted:#7a8498;--text:#e8ebf0;--sub:#b8c0cc;
  --merge:#50b070;--panel:linear-gradient(165deg,rgba(14,20,36,0.97),rgba(8,12,24,0.98));
  font:13px "Segoe UI",Tahoma,sans-serif;color:var(--text);
  min-width:min(440px,calc(100vw - 28px));max-width:520px;
  background:var(--panel);border:1px solid rgba(232,216,138,0.38);border-radius:14px;
  box-shadow:0 20px 56px rgba(0,0,0,0.65);overflow:hidden;animation:amp-in .26s ease-out;
}
.civ-amp *{box-sizing:border-box;}
.civ-amp-hdr{padding:16px 20px 12px;text-align:center;border-bottom:1px solid rgba(232,216,138,0.14);
  background:linear-gradient(180deg,rgba(232,216,138,0.07),transparent);}
.civ-amp-orn{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:6px;}
.civ-amp-orn i{display:block;height:1px;width:40px;background:linear-gradient(90deg,transparent,var(--gold-dim));}
.civ-amp-orn i.r{background:linear-gradient(270deg,transparent,var(--gold-dim));}
.civ-amp-title{font:700 11px/1.2 Georgia,serif;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);}
.civ-amp-sub{font-size:11px;color:var(--muted);margin-top:4px;}
.civ-amp-body{padding:16px 18px 14px;display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:start;}
.civ-amp-col{border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:10px;background:rgba(255,255,255,0.03);}
.civ-amp-col-h{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px;}
.civ-amp-row{display:flex;align-items:center;gap:8px;padding:6px 4px;border-radius:6px;
  border:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.15);margin-bottom:5px;}
.civ-amp-row:last-child{margin-bottom:0;}
.civ-amp-row-ic{font-size:20px;line-height:1;width:28px;text-align:center;}
.civ-amp-row-meta{flex:1;min-width:0;}
.civ-amp-row-name{font-size:12px;font-weight:700;color:#f0e8b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.civ-amp-row-mv{font-size:10px;color:var(--muted);margin-top:2px;}
.civ-amp-row.new{border-color:rgba(80,176,112,0.35);background:rgba(80,176,112,0.08);}
.civ-amp-mid{display:flex;flex-direction:column;align-items:center;justify-content:center;padding-top:28px;gap:6px;}
.civ-amp-arrow{font-size:28px;color:var(--gold-dim);line-height:1;}
.civ-amp-mid-lbl{font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;text-align:center;}
.civ-amp-result{margin:0 18px 12px;padding:8px 12px;border-radius:8px;text-align:center;
  font-size:12px;color:#c8ffd8;background:rgba(80,176,112,0.1);border:1px solid rgba(80,176,112,0.28);}
.civ-amp-foot{padding:0 18px 16px;display:flex;gap:12px;justify-content:space-between;align-items:stretch;}
.civ-amp-btn{flex:1;font:inherit;font-size:12px;font-weight:700;cursor:pointer;border-radius:8px;padding:10px 14px;border:1px solid transparent;text-align:center;min-width:0;}
.civ-amp-btn:hover{filter:brightness(1.08);}
.civ-amp-btn-merge{background:linear-gradient(135deg,rgba(80,176,112,0.85),rgba(50,130,70,0.9));color:#0a120a;border-color:rgba(120,220,140,0.5);}
.civ-amp-btn-sep{background:rgba(255,255,255,0.06);color:var(--sub);border-color:rgba(255,255,255,0.14);}
@media(max-width:480px){
  .civ-amp-body{grid-template-columns:1fr;}
  .civ-amp-mid{padding:4px 0;flex-direction:row;}
  .civ-amp-arrow{transform:rotate(90deg);}
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
    ? u.ruchLeft + '/' + u.ruchMax + ' ruch'
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
    '<div class="civ-amp-body">' +
      '<div class="civ-amp-col">' +
        '<div class="civ-amp-col-h">Na polu (' + opts.existing.length + ')</div>' +
        (opts.existing.length > 0
          ? opts.existing.map(u => unitRowHtml(u, false)).join('')
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
    '<div class="civ-amp-result">' + esc(resultLabel) + '</div>' +
    '<div class="civ-amp-foot">' +
      '<button type="button" class="civ-amp-btn civ-amp-btn-sep" data-act="sep">Zostaw osobno</button>' +
      '<button type="button" class="civ-amp-btn civ-amp-btn-merge" data-act="merge">Po\u0142\u0105cz armie</button>' +
    '</div>';

  box.querySelector('[data-act="merge"]')?.addEventListener('click', () => pick(opts.onMerge));
  box.querySelector('[data-act="sep"]')?.addEventListener('click', () => pick(opts.onSeparate));
  box.addEventListener('click', (e) => e.stopPropagation());

  root.appendChild(box);
  document.body.appendChild(root);

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
