/**
 * cityForeignPick.ts — wybór przy kliknięciu obcego miasta: informacja o heksie/mieście
 * vs audiencja dyplomatyczna z właścicielem (Maciej 2026-07-26).
 * Wzorzec wizualny: cityUnitPick.ts (KANON v1.1).
 */

import { brandIconSvg } from './icons/brandAssets';
import { pushOverlay, popOverlay } from './escapeOverlayStack';

const OVERLAY_ID = 'city-foreign-pick';

export interface CityForeignPickOptions {
  cityName: string;
  civName: string;
  cityPopulation?: number;
  /** false = barbarzyńcy (tylko informacja). */
  diplomacyAvailable?: boolean;
  onInfo: () => void;
  onDiplomacy: () => void;
  onCancel?: () => void;
}

let root: HTMLDivElement | null = null;
let keyHandler: ((e: KeyboardEvent) => void) | null = null;

const STYLE_ID = 'civ-cfp-css-v1';

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
@keyframes cfp-fadeIn{from{opacity:0}to{opacity:1}}
.civ-cfp-overlay{
  position:fixed;inset:0;z-index:680;display:flex;align-items:center;justify-content:center;
  padding:16px;background:rgba(4,8,18,0.45);backdrop-filter:blur(2px);
  animation:cfp-fadeIn .18s ease-out;
}
.civ-cfp{
  --gold:#e8d88a;--gold-bright:#f4e6a8;--gold-dim:#c9a84c;--muted:#7a8498;--text:#e8e0c8;--sub:#b8c0cc;
  --panel:linear-gradient(180deg,rgba(22,28,40,.94),rgba(8,10,16,.97));
  --border:rgba(232,216,138,.45);--border-soft:rgba(232,216,138,.22);
  --info:#c9a84c;--diplo:#6a9fd4;
  font:13px "Segoe UI",Tahoma,sans-serif;color:var(--text);
  width:min(380px,calc(100vw - 32px));
  background:var(--panel);backdrop-filter:blur(8px);border:2px solid var(--border);border-radius:14px;
  box-shadow:0 14px 44px rgba(0,0,0,.65),inset 0 1px 0 rgba(232,216,138,.12);
  overflow:hidden;animation:cfp-fadeIn .22s ease-out;
}
.civ-cfp *{box-sizing:border-box;}
.civ-cfp-hdr{
  padding:11px 18px 9px;text-align:center;border-bottom:1px solid var(--border-soft);
  background:linear-gradient(180deg,rgba(232,216,138,.09),transparent);
}
.civ-cfp-kick{font-size:9.5px;letter-spacing:.28em;text-transform:uppercase;color:#b09a55;white-space:nowrap}
.civ-cfp-title{
  font:19px/1.3 Georgia,"Times New Roman",serif;color:var(--gold);letter-spacing:.03em;margin-top:2px;
}
.civ-cfp-sub{font-size:11px;color:var(--sub);margin-top:4px;}
.civ-cfp-body{padding:12px 16px 14px;}
.civ-cfp-prompt{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.14em;text-align:center;margin-bottom:9px;}
.civ-cfp-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}
.civ-cfp-act{
  position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;
  padding:12px 8px 10px;border-radius:10px;cursor:pointer;text-align:center;font:inherit;
  border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03);color:var(--text);
  transition:border-color .15s,background .15s,box-shadow .15s,transform .12s;
}
.civ-cfp-act:hover:not(:disabled){transform:translateY(-1px);}
.civ-cfp-act:active:not(:disabled){transform:translateY(0);}
.civ-cfp-act:disabled{opacity:.45;cursor:not-allowed;}
.civ-cfp-act:focus-visible,.civ-cfp-cancel:focus-visible{
  outline:2px solid var(--gold-bright);outline-offset:2px;
}
.civ-cfp-kb{
  position:absolute;top:6px;right:7px;font-size:9px;font-weight:700;color:#c8b898;
  border:1px solid rgba(232,216,138,.3);border-radius:4px;padding:0 5px;background:rgba(232,216,138,.06);
}
.civ-cfp-act-ic{width:26px;height:26px;margin-top:2px;}
.civ-cfp-act-ic svg{width:100%;height:100%;}
.civ-cfp-act-lbl{font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;}
.civ-cfp-act-desc{font-size:10.5px;color:var(--sub);line-height:1.3;}
.civ-cfp-act-stat{font-size:10px;font-weight:700;margin-top:2px;letter-spacing:.02em;}
.civ-cfp-act.info{border-color:rgba(201,168,76,.4);}
.civ-cfp-act.info .civ-cfp-act-lbl{color:var(--gold);}
.civ-cfp-act.info .civ-cfp-act-stat{color:var(--gold);}
.civ-cfp-act.info .civ-cfp-act-ic{color:var(--gold);}
.civ-cfp-act.info:hover:not(:disabled){border-color:rgba(201,168,76,.75);background:rgba(201,168,76,.08);box-shadow:0 0 12px rgba(201,168,76,.2);}
.civ-cfp-act.diplo{border-color:rgba(106,159,212,.4);}
.civ-cfp-act.diplo .civ-cfp-act-lbl{color:#a8c8ff;}
.civ-cfp-act.diplo .civ-cfp-act-stat{color:#a8c8ff;}
.civ-cfp-act.diplo .civ-cfp-act-ic{color:#a8c8ff;}
.civ-cfp-act.diplo:hover:not(:disabled){border-color:rgba(90,155,212,.75);background:rgba(58,106,208,.08);box-shadow:0 0 12px rgba(58,106,208,.25);}
.civ-cfp-btns{display:flex;justify-content:center;margin-bottom:8px;}
.civ-cfp-cancel{
  border-radius:9px;padding:7px 14px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(255,255,255,.16);color:var(--muted);
  background:rgba(255,255,255,.03);font:inherit;cursor:pointer;
  transition:border-color .15s,color .15s;
}
.civ-cfp-cancel:hover{color:var(--text);border-color:rgba(255,255,255,.3);}
.civ-cfp-cancel svg{width:13px;height:13px;}
.civ-cfp-keys{font-size:9.5px;color:#6a6250;text-align:center;letter-spacing:.05em;}
.civ-cfp-keys b{color:#c8b898;font-weight:600;border:1px solid rgba(232,216,138,.3);border-radius:4px;padding:0 5px;background:rgba(232,216,138,.06);}
@media(max-width:420px){
  .civ-cfp-actions{grid-template-columns:1fr;}
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

function modalIcon(id: string, size: number = 26): string {
  return brandIconSvg(id, size) || '';
}

function detachKeyboard(): void {
  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }
}

export function hideCityForeignPick(): void {
  detachKeyboard();
  popOverlay(OVERLAY_ID);
  if (root) {
    root.remove();
    root = null;
  }
}

export function isCityForeignPickOpen(): boolean {
  return root !== null && root.isConnected;
}

export function showCityForeignPick(opts: CityForeignPickOptions): void {
  hideCityForeignPick();
  ensureStyles();

  const diplomacyOk = opts.diplomacyAvailable !== false;

  function pick(fn: () => void): void {
    hideCityForeignPick();
    fn();
  }

  const overlay = document.createElement('div');
  overlay.className = 'civ-cfp-overlay';
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      hideCityForeignPick();
      opts.onCancel?.();
    }
  });

  const panel = document.createElement('div');
  panel.className = 'civ-cfp';
  panel.addEventListener('click', (e) => e.stopPropagation());

  const popStat = opts.cityPopulation != null
    ? '<span class="civ-cfp-act-stat">Ludność ' + Math.round(opts.cityPopulation) + '</span>'
    : '';

  panel.innerHTML = `
    <div class="civ-cfp-hdr">
      <div class="civ-cfp-kick">Obce miasto</div>
      <div class="civ-cfp-title">${esc(opts.cityName)}</div>
      <div class="civ-cfp-sub">${esc(opts.civName)}</div>
    </div>
    <div class="civ-cfp-body">
      <div class="civ-cfp-prompt">Co chcesz zrobić?</div>
      <div class="civ-cfp-actions">
        <button type="button" class="civ-cfp-act info" data-act="info">
          <span class="civ-cfp-kb">1</span>
          <span class="civ-cfp-act-ic">${modalIcon('tb-cities', 26)}</span>
          <span class="civ-cfp-act-lbl">Informacja</span>
          <span class="civ-cfp-act-desc">Heks i miasto w panelu mapy</span>
          ${popStat}
        </button>
        <button type="button" class="civ-cfp-act diplo" data-act="diplo" ${diplomacyOk ? '' : 'disabled title="Barbarzyńcy — brak dyplomacji"'}>
          <span class="civ-cfp-kb">2</span>
          <span class="civ-cfp-act-ic">${modalIcon('tb-diplomacy', 26)}</span>
          <span class="civ-cfp-act-lbl">Dyplomacja</span>
          <span class="civ-cfp-act-desc">${diplomacyOk ? 'Audiencja z ' + esc(opts.civName) : 'Niedostępne'}</span>
        </button>
      </div>
      <div class="civ-cfp-btns">
        <button type="button" class="civ-cfp-cancel" data-act="cancel">${modalIcon('ui-close', 13)}Anuluj</button>
      </div>
      <div class="civ-cfp-keys"><b>1</b> = Informacja · <b>2</b> = Dyplomacja · <b>Esc</b> = Anuluj</div>
    </div>
  `;

  const btnInfo = panel.querySelector<HTMLButtonElement>('[data-act="info"]')!;
  const btnDiplo = panel.querySelector<HTMLButtonElement>('[data-act="diplo"]')!;
  const btnCancel = panel.querySelector<HTMLButtonElement>('[data-act="cancel"]')!;
  btnInfo.addEventListener('click', () => pick(opts.onInfo));
  if (diplomacyOk) {
    btnDiplo.addEventListener('click', () => pick(opts.onDiplomacy));
  }
  btnCancel.addEventListener('click', () => {
    hideCityForeignPick();
    opts.onCancel?.();
  });

  const focusables = diplomacyOk ? [btnInfo, btnDiplo, btnCancel] : [btnInfo, btnCancel];

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  root = overlay;

  btnInfo.focus();

  keyHandler = (e: KeyboardEvent) => {
    if (e.key === '1') {
      e.preventDefault();
      pick(opts.onInfo);
      return;
    }
    if (e.key === '2' && diplomacyOk) {
      e.preventDefault();
      pick(opts.onDiplomacy);
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const active = document.activeElement as HTMLElement | null;
      const idx = focusables.indexOf(active as HTMLButtonElement);
      const dir = (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 1;
      const next = idx === -1 ? 0 : (idx + dir + focusables.length) % focusables.length;
      focusables[next]!.focus();
    }
  };
  document.addEventListener('keydown', keyHandler);
  pushOverlay(OVERLAY_ID, () => {
    hideCityForeignPick();
    opts.onCancel?.();
  });
}
