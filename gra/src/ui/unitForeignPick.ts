/**
 * unitForeignPick.ts — wybór przy kliknięciu obcej jednostki: karta jednostki
 * vs audiencja dyplomatyczna z właścicielem (spójnie z cityForeignPick.ts).
 * Wzorzec wizualny: cityForeignPick.ts (KANON v1.1).
 */

import { brandIconSvg } from './icons/brandAssets';

export interface UnitForeignPickOptions {
  unitName: string;
  civName: string;
  unitHp?: number;
  unitHpMax?: number;
  /** false = barbarzyńcy (tylko informacja). */
  diplomacyAvailable?: boolean;
  onInfo: () => void;
  onDiplomacy: () => void;
  onCancel?: () => void;
}

let root: HTMLDivElement | null = null;
let keyHandler: ((e: KeyboardEvent) => void) | null = null;

const STYLE_ID = 'civ-ufp-css-v1';

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
@keyframes ufp-fadeIn{from{opacity:0}to{opacity:1}}
.civ-ufp-overlay{
  position:fixed;inset:0;z-index:680;display:flex;align-items:center;justify-content:center;
  padding:16px;background:rgba(4,8,18,0.45);backdrop-filter:blur(2px);
  animation:ufp-fadeIn .18s ease-out;
}
.civ-ufp{
  --gold:#e8d88a;--gold-bright:#f4e6a8;--gold-dim:#c9a84c;--muted:#7a8498;--text:#e8e0c8;--sub:#b8c0cc;
  --panel:linear-gradient(180deg,rgba(22,28,40,.94),rgba(8,10,16,.97));
  --border:rgba(232,216,138,.45);--border-soft:rgba(232,216,138,.22);
  --info:#c9a84c;--diplo:#6a9fd4;
  font:13px "Segoe UI",Tahoma,sans-serif;color:var(--text);
  width:min(380px,calc(100vw - 32px));
  background:var(--panel);backdrop-filter:blur(8px);border:2px solid var(--border);border-radius:14px;
  box-shadow:0 14px 44px rgba(0,0,0,.65),inset 0 1px 0 rgba(232,216,138,.12);
  overflow:hidden;animation:ufp-fadeIn .22s ease-out;
}
.civ-ufp *{box-sizing:border-box;}
.civ-ufp-hdr{
  padding:11px 18px 9px;text-align:center;border-bottom:1px solid var(--border-soft);
  background:linear-gradient(180deg,rgba(232,216,138,.09),transparent);
}
.civ-ufp-kick{font-size:9.5px;letter-spacing:.28em;text-transform:uppercase;color:#b09a55;white-space:nowrap}
.civ-ufp-title{
  font:19px/1.3 Georgia,"Times New Roman",serif;color:var(--gold);letter-spacing:.03em;margin-top:2px;
}
.civ-ufp-sub{font-size:11px;color:var(--sub);margin-top:4px;}
.civ-ufp-body{padding:12px 16px 14px;}
.civ-ufp-prompt{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.14em;text-align:center;margin-bottom:9px;}
.civ-ufp-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}
.civ-ufp-act{
  position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;
  padding:12px 8px 10px;border-radius:10px;cursor:pointer;text-align:center;font:inherit;
  border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03);color:var(--text);
  transition:border-color .15s,background .15s,box-shadow .15s,transform .12s;
}
.civ-ufp-act:hover:not(:disabled){transform:translateY(-1px);}
.civ-ufp-act:active:not(:disabled){transform:translateY(0);}
.civ-ufp-act:disabled{opacity:.45;cursor:not-allowed;}
.civ-ufp-act:focus-visible,.civ-ufp-cancel:focus-visible{
  outline:2px solid var(--gold-bright);outline-offset:2px;
}
.civ-ufp-kb{
  position:absolute;top:6px;right:7px;font-size:9px;font-weight:700;color:#c8b898;
  border:1px solid rgba(232,216,138,.3);border-radius:4px;padding:0 5px;background:rgba(232,216,138,.06);
}
.civ-ufp-act-ic{width:26px;height:26px;margin-top:2px;}
.civ-ufp-act-ic svg{width:100%;height:100%;}
.civ-ufp-act-lbl{font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;}
.civ-ufp-act-desc{font-size:10.5px;color:var(--sub);line-height:1.3;}
.civ-ufp-act-stat{font-size:10px;font-weight:700;margin-top:2px;letter-spacing:.02em;}
.civ-ufp-act.info{border-color:rgba(201,168,76,.4);}
.civ-ufp-act.info .civ-ufp-act-lbl{color:var(--gold);}
.civ-ufp-act.info .civ-ufp-act-stat{color:var(--gold);}
.civ-ufp-act.info .civ-ufp-act-ic{color:var(--gold);}
.civ-ufp-act.info:hover:not(:disabled){border-color:rgba(201,168,76,.75);background:rgba(201,168,76,.08);box-shadow:0 0 12px rgba(201,168,76,.2);}
.civ-ufp-act.diplo{border-color:rgba(106,159,212,.4);}
.civ-ufp-act.diplo .civ-ufp-act-lbl{color:#a8c8ff;}
.civ-ufp-act.diplo .civ-ufp-act-stat{color:#a8c8ff;}
.civ-ufp-act.diplo .civ-ufp-act-ic{color:#a8c8ff;}
.civ-ufp-act.diplo:hover:not(:disabled){border-color:rgba(90,155,212,.75);background:rgba(58,106,208,.08);box-shadow:0 0 12px rgba(58,106,208,.25);}
.civ-ufp-btns{display:flex;justify-content:center;margin-bottom:8px;}
.civ-ufp-cancel{
  border-radius:9px;padding:7px 14px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(255,255,255,.16);color:var(--muted);
  background:rgba(255,255,255,.03);font:inherit;cursor:pointer;
  transition:border-color .15s,color .15s;
}
.civ-ufp-cancel:hover{color:var(--text);border-color:rgba(255,255,255,.3);}
.civ-ufp-cancel svg{width:13px;height:13px;}
.civ-ufp-keys{font-size:9.5px;color:#6a6250;text-align:center;letter-spacing:.05em;}
.civ-ufp-keys b{color:#c8b898;font-weight:600;border:1px solid rgba(232,216,138,.3);border-radius:4px;padding:0 5px;background:rgba(232,216,138,.06);}
@media(max-width:420px){
  .civ-ufp-actions{grid-template-columns:1fr;}
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

export function hideUnitForeignPick(): void {
  detachKeyboard();
  if (root) {
    root.remove();
    root = null;
  }
}

export function isUnitForeignPickOpen(): boolean {
  return root !== null && root.isConnected;
}

export function showUnitForeignPick(opts: UnitForeignPickOptions): void {
  hideUnitForeignPick();
  ensureStyles();

  const diplomacyOk = opts.diplomacyAvailable !== false;

  function pick(fn: () => void): void {
    hideUnitForeignPick();
    fn();
  }

  const overlay = document.createElement('div');
  overlay.className = 'civ-ufp-overlay';
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      hideUnitForeignPick();
      opts.onCancel?.();
    }
  });

  const panel = document.createElement('div');
  panel.className = 'civ-ufp';
  panel.addEventListener('click', (e) => e.stopPropagation());

  const hpStat = opts.unitHp != null && opts.unitHpMax != null
    ? '<span class="civ-ufp-act-stat">HP ' + Math.round(opts.unitHp) + '/' + Math.round(opts.unitHpMax) + '</span>'
    : '';

  panel.innerHTML = `
    <div class="civ-ufp-hdr">
      <div class="civ-ufp-kick">Obca jednostka</div>
      <div class="civ-ufp-title">${esc(opts.unitName)}</div>
      <div class="civ-ufp-sub">${esc(opts.civName)}</div>
    </div>
    <div class="civ-ufp-body">
      <div class="civ-ufp-prompt">Co chcesz zrobić?</div>
      <div class="civ-ufp-actions">
        <button type="button" class="civ-ufp-act info" data-act="info">
          <span class="civ-ufp-kb">1</span>
          <span class="civ-ufp-act-ic">${modalIcon('tb-army', 26)}</span>
          <span class="civ-ufp-act-lbl">Informacja</span>
          <span class="civ-ufp-act-desc">Karta jednostki w panelu mapy</span>
          ${hpStat}
        </button>
        <button type="button" class="civ-ufp-act diplo" data-act="diplo" ${diplomacyOk ? '' : 'disabled title="Barbarzyńcy — brak dyplomacji"'}>
          <span class="civ-ufp-kb">2</span>
          <span class="civ-ufp-act-ic">${modalIcon('tb-diplomacy', 26)}</span>
          <span class="civ-ufp-act-lbl">Dyplomacja</span>
          <span class="civ-ufp-act-desc">${diplomacyOk ? 'Audiencja z ' + esc(opts.civName) : 'Niedostępne'}</span>
        </button>
      </div>
      <div class="civ-ufp-btns">
        <button type="button" class="civ-ufp-cancel" data-act="cancel">${modalIcon('ui-close', 13)}Anuluj</button>
      </div>
      <div class="civ-ufp-keys"><b>1</b> = Informacja · <b>2</b> = Dyplomacja · <b>Esc</b> = Anuluj</div>
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
    hideUnitForeignPick();
    opts.onCancel?.();
  });

  const focusables = diplomacyOk ? [btnInfo, btnDiplo, btnCancel] : [btnInfo, btnCancel];

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  root = overlay;

  btnInfo.focus();

  keyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      hideUnitForeignPick();
      opts.onCancel?.();
      return;
    }
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
}
