/**
 * cityUnitPick.ts — wybór: panel miasta vs zaznaczenie jednostki (ten sam heks).
 * Decyzja Maciej 2026-07-01 (A2-Q5). Restyling 2026-07-26 (C-DESIGN-Q1=C):
 * ten sam kanon wizualny co cityAttackChoice.ts (KANON v1.1, brand-book) —
 * panel gradient+blur, złote akcenty, ikony brandu zamiast emoji, kafle z
 * numerem klawisza, stopka z klawiszami. Kontrakt danych (CityUnitPickOptions)
 * NIEZMIENIONY poza dodaniem opcjonalnych pól ruchu jednostki — restyling formy,
 * bez zmian logiki wywołującej (main.ts).
 */

import { formatArmiaLabel } from './formatPl';
import { brandIconSvg } from './icons/brandAssets';
import { pushOverlay, popOverlay } from './escapeOverlayStack';

const OVERLAY_ID = 'city-unit-pick';

export interface CityUnitPickOptions {
  cityName: string;
  /** Populacja miasta (Maciej 2026-07-26: dodatkowa informacja na kafel). */
  cityPopulation?: number;
  unitLabel: string;
  /** Łączny % HP jednostki/stosu (suma hp / suma maxHp * 100). */
  unitHealthPercent?: number;
  /** Pozostałe punkty ruchu stosu (min. z jednostek stosu w tej turze). */
  unitRuchLeft?: number;
  /** Maksymalne punkty ruchu stosu (maks. z jednostek stosu). */
  unitRuchMax?: number;
  stackCount?: number;
  onCity: () => void;
  onUnit: () => void;
  onCancel?: () => void;
}

let root: HTMLDivElement | null = null;
let keyHandler: ((e: KeyboardEvent) => void) | null = null;

const STYLE_ID = 'civ-cup-css-v2';

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
@keyframes cup-fadeIn{from{opacity:0}to{opacity:1}}
.civ-cup-overlay{
  position:fixed;inset:0;z-index:680;display:flex;align-items:center;justify-content:center;
  padding:16px;background:rgba(4,8,18,0.45);backdrop-filter:blur(2px);
  animation:cup-fadeIn .18s ease-out;
}
.civ-cup{
  --gold:#e8d88a;--gold-bright:#f4e6a8;--gold-dim:#c9a84c;--muted:#7a8498;--text:#e8e0c8;--sub:#b8c0cc;
  --panel:linear-gradient(180deg,rgba(22,28,40,.94),rgba(8,10,16,.97));
  --border:rgba(232,216,138,.45);--border-soft:rgba(232,216,138,.22);
  --city:#c9a84c;--unit:#3a6ad0;
  font:13px "Segoe UI",Tahoma,sans-serif;color:var(--text);
  width:min(360px,calc(100vw - 32px));
  background:var(--panel);backdrop-filter:blur(8px);border:2px solid var(--border);border-radius:14px;
  box-shadow:0 14px 44px rgba(0,0,0,.65),inset 0 1px 0 rgba(232,216,138,.12);
  overflow:hidden;animation:cup-fadeIn .22s ease-out;
}
.civ-cup *{box-sizing:border-box;}
.civ-cup-hdr{
  padding:11px 18px 9px;text-align:center;border-bottom:1px solid var(--border-soft);
  background:linear-gradient(180deg,rgba(232,216,138,.09),transparent);
}
.civ-cup-kick{font-size:9.5px;letter-spacing:.28em;text-transform:uppercase;color:#b09a55;white-space:nowrap}
.civ-cup-title{
  font:19px/1.3 Georgia,"Times New Roman",serif;color:var(--gold);letter-spacing:.03em;margin-top:2px;
}
.civ-cup-body{padding:12px 16px 14px;}
.civ-cup-prompt{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.14em;text-align:center;margin-bottom:9px;}
.civ-cup-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}
.civ-cup-act{
  position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;
  padding:12px 8px 10px;border-radius:10px;cursor:pointer;text-align:center;font:inherit;
  border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03);color:var(--text);
  transition:border-color .15s,background .15s,box-shadow .15s,transform .12s;
}
.civ-cup-act:hover{transform:translateY(-1px);}
.civ-cup-act:active{transform:translateY(0);}
.civ-cup-act:focus-visible,.civ-cup-cancel:focus-visible{
  outline:2px solid var(--gold-bright);outline-offset:2px;
}
.civ-cup-kb{
  position:absolute;top:6px;right:7px;font-size:9px;font-weight:700;color:#c8b898;
  border:1px solid rgba(232,216,138,.3);border-radius:4px;padding:0 5px;background:rgba(232,216,138,.06);
}
.civ-cup-act-ic{width:26px;height:26px;margin-top:2px;}
.civ-cup-act-ic svg{width:100%;height:100%;}
.civ-cup-act-lbl{font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;}
.civ-cup-act-desc{font-size:10.5px;color:var(--sub);line-height:1.3;}
.civ-cup-act-stat{font-size:10px;font-weight:700;margin-top:2px;letter-spacing:.02em;}
.civ-cup-act.city{border-color:rgba(201,168,76,.4);}
.civ-cup-act.city .civ-cup-act-lbl{color:var(--gold);}
.civ-cup-act.city .civ-cup-act-stat{color:var(--gold);}
.civ-cup-act.city .civ-cup-act-ic{color:var(--gold);}
.civ-cup-act.city:hover{border-color:rgba(201,168,76,.75);background:rgba(201,168,76,.08);box-shadow:0 0 12px rgba(201,168,76,.2);}
.civ-cup-act.unit{border-color:rgba(58,106,208,.4);}
.civ-cup-act.unit .civ-cup-act-lbl{color:#a8c8ff;}
.civ-cup-act.unit .civ-cup-act-stat{color:#a8c8ff;}
.civ-cup-act.unit .civ-cup-act-ic{color:#a8c8ff;}
.civ-cup-act.unit:hover{border-color:rgba(90,155,212,.75);background:rgba(58,106,208,.08);box-shadow:0 0 12px rgba(58,106,208,.25);}
.civ-cup-btns{display:flex;justify-content:center;margin-bottom:8px;}
.civ-cup-cancel{
  border-radius:9px;padding:7px 14px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(255,255,255,.16);color:var(--muted);
  background:rgba(255,255,255,.03);font:inherit;cursor:pointer;
  transition:border-color .15s,color .15s;
}
.civ-cup-cancel:hover{color:var(--text);border-color:rgba(255,255,255,.3);}
.civ-cup-cancel svg{width:13px;height:13px;}
.civ-cup-keys{font-size:9.5px;color:#6a6250;text-align:center;letter-spacing:.05em;}
.civ-cup-keys b{color:#c8b898;font-weight:600;border:1px solid rgba(232,216,138,.3);border-radius:4px;padding:0 5px;background:rgba(232,216,138,.06);}
@media(max-width:420px){
  .civ-cup-actions{grid-template-columns:1fr;}
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
  const svg = brandIconSvg(id, size);
  return svg || '';
}

function detachKeyboard(): void {
  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }
}

export function hideCityUnitPick(): void {
  detachKeyboard();
  popOverlay(OVERLAY_ID);
  if (root) {
    root.remove();
    root = null;
  }
}

export function isCityUnitPickOpen(): boolean {
  return root !== null && root.isConnected;
}

export function showCityUnitPick(opts: CityUnitPickOptions): void {
  hideCityUnitPick();
  ensureStyles();

  function pick(fn: () => void): void {
    hideCityUnitPick();
    fn();
  }

  const overlay = document.createElement('div');
  overlay.className = 'civ-cup-overlay';
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      hideCityUnitPick();
      opts.onCancel?.();
    }
  });

  const panel = document.createElement('div');
  panel.className = 'civ-cup';
  panel.addEventListener('click', (e) => e.stopPropagation());

  const cityStat = opts.cityPopulation != null
    ? '<span class="civ-cup-act-stat">Ludność ' + Math.round(opts.cityPopulation) + '</span>'
    : '';

  const stackHint = opts.stackCount && opts.stackCount > 1
    ? formatArmiaLabel(opts.stackCount)
    : '';
  const unitStatParts: string[] = [];
  if (opts.unitHealthPercent != null) {
    unitStatParts.push('HP ' + Math.round(opts.unitHealthPercent) + '%');
  }
  if (opts.unitRuchMax != null && opts.unitRuchMax > 0) {
    const left = Math.max(0, Math.round(opts.unitRuchLeft ?? 0));
    unitStatParts.push('Ruch ' + left + '/' + Math.round(opts.unitRuchMax));
  }
  const unitStat = unitStatParts.length > 0
    ? '<span class="civ-cup-act-stat">' + unitStatParts.join(' · ') + '</span>'
    : '';

  panel.innerHTML = `
    <div class="civ-cup-hdr">
      <div class="civ-cup-kick">Ten sam heks</div>
      <div class="civ-cup-title">Co wybierasz?</div>
    </div>
    <div class="civ-cup-body">
      <div class="civ-cup-prompt">Miasto i wojsko na tym samym polu</div>
      <div class="civ-cup-actions">
        <button type="button" class="civ-cup-act city" data-act="city">
          <span class="civ-cup-kb">1</span>
          <span class="civ-cup-act-ic">${modalIcon('tb-cities', 26)}</span>
          <span class="civ-cup-act-lbl">Miasto</span>
          <span class="civ-cup-act-desc">${esc(opts.cityName)}</span>
          ${cityStat}
        </button>
        <button type="button" class="civ-cup-act unit" data-act="unit">
          <span class="civ-cup-kb">2</span>
          <span class="civ-cup-act-ic">${modalIcon('tb-army', 26)}</span>
          <span class="civ-cup-act-lbl">Jednostka</span>
          <span class="civ-cup-act-desc">${esc(opts.unitLabel)}${stackHint ? '<br>' + esc(stackHint) : ''}</span>
          ${unitStat}
        </button>
      </div>
      <div class="civ-cup-btns">
        <button type="button" class="civ-cup-cancel" data-act="cancel">${modalIcon('ui-close', 13)}Anuluj</button>
      </div>
      <div class="civ-cup-keys"><b>1</b> = Miasto · <b>2</b> = Jednostka · <b>Esc</b> = Anuluj</div>
    </div>
  `;

  const btnCity = panel.querySelector<HTMLButtonElement>('[data-act="city"]')!;
  const btnUnit = panel.querySelector<HTMLButtonElement>('[data-act="unit"]')!;
  const btnCancel = panel.querySelector<HTMLButtonElement>('[data-act="cancel"]')!;
  btnCity.addEventListener('click', () => pick(opts.onCity));
  btnUnit.addEventListener('click', () => pick(opts.onUnit));
  btnCancel.addEventListener('click', () => {
    hideCityUnitPick();
    opts.onCancel?.();
  });

  const focusables = [btnCity, btnUnit, btnCancel];

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  root = overlay;

  btnCity.focus();

  keyHandler = (e: KeyboardEvent) => {
    if (e.key === '1') {
      e.preventDefault();
      pick(opts.onCity);
      return;
    }
    if (e.key === '2') {
      e.preventDefault();
      pick(opts.onUnit);
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
    hideCityUnitPick();
    opts.onCancel?.();
  });
}
