/**
 * unitReplacePicker.ts — modal mechanizmu "Zastąp" (ZASTAP-JEDNOSTKI-PLAN.md).
 * Wzorowany na cityUnitPick.ts (overlay) + karty w stylu unitRecruitCard.ts.
 * Lista zamienników dla JEDNEJ zaznaczonej jednostki (nie całego stosu) —
 * wołane z ArmyStackHud po kliknięciu akcji "Zastąp".
 */
import {
  ensureMapUnitBrandScope,
  mapUnitCloseBtnHtml,
  MAP_UNIT_1E_SHARED_CSS,
} from './mapUnitHudSkin';
import { unitIconSvg } from './icons/brandAssets';

export interface UnitReplaceOption {
  /** Jednostka name (typeId) do wpisania w RuntimeUnit.typeId po wyborze. */
  id: string;
  name: string;
  icon: string;
  /** max(0, koszt_nowej - koszt_starej) w Pieniądzu -- decyzja UX "Zastąp". */
  surcharge: number;
  atk: number;
  def: number;
  hpMax: number;
}

export interface UnitReplacePickerOptions {
  /** Nazwa bieżącej (zastępowanej) jednostki -- nagłówek modala. */
  unitName: string;
  options: readonly UnitReplaceOption[];
  /** Aktualny skarbiec gracza -- do wyszarzenia pozycji nie do sfinansowania. */
  skarb: number;
  onPick: (newTypeId: string) => void;
  onCancel?: () => void;
}

let root: HTMLDivElement | null = null;
let keyHandler: ((e: KeyboardEvent) => void) | null = null;

const STYLE_ID = 'civ-unit-replace-picker-css';

function ensureStyles(): void {
  ensureMapUnitBrandScope();
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
${MAP_UNIT_1E_SHARED_CSS}
@keyframes urp-in{from{opacity:0;transform:scale(.97) translateY(8px)}to{opacity:1;transform:none}}
.civ-urp-overlay{
  position:fixed;inset:0;z-index:690;display:flex;align-items:center;justify-content:center;
  padding:16px;background:rgba(4,8,18,0.5);backdrop-filter:blur(2px);
  animation:urp-in .18s ease-out;font-family:var(--civ-font-ui,'Segoe UI',Tahoma,sans-serif);
}
.civ-urp{
  width:min(420px,calc(100vw - 32px));max-height:min(640px,calc(100vh - 48px));
  display:flex;flex-direction:column;
  background:linear-gradient(165deg,rgba(14,20,36,0.98),rgba(8,12,24,0.99));
  border:1px solid rgba(232,216,138,0.38);border-radius:12px;
  box-shadow:0 16px 48px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.06);
  color:var(--civ-text-primary,#e8e0c8);overflow:hidden;animation:urp-in .22s ease-out;
}
.civ-urp-hdr{display:flex;align-items:center;justify-content:space-between;gap:8px;
  padding:12px 14px;border-bottom:1px solid rgba(232,216,138,0.16);}
.civ-urp-title{font-family:var(--civ-font-title,Georgia,serif);font-size:1em;color:var(--civ-gold-primary,#e8d88a);}
.civ-urp-sub{font-size:0.68em;color:var(--civ-text-muted,#8a8070);margin-top:2px;}
.civ-urp-list{overflow-y:auto;padding:10px 14px 14px;display:flex;flex-direction:column;gap:8px;}
.civ-urp-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;cursor:pointer;
  border:1px solid rgba(232,216,138,.18);background:rgba(255,255,255,.03);
  transition:border-color .15s,background .15s;}
.civ-urp-item:hover:not(.disabled){border-color:rgba(232,216,138,.5);background:rgba(255,255,255,.06);}
.civ-urp-item.disabled{opacity:.5;cursor:not-allowed;}
.civ-urp-ic{width:2.3em;height:2.3em;flex:none;border-radius:50%;
  border:2px solid rgba(160,128,48,.6);background:radial-gradient(circle at 38% 30%,#1a2230,#0a0d14);
  display:flex;align-items:center;justify-content:center;color:#e8d88a;}
.civ-urp-ic svg{width:1.3em;height:1.3em;display:block;}
.civ-urp-body{flex:1;min-width:0;}
.civ-urp-name{font-size:0.86em;font-weight:600;color:#e8e0c8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.civ-urp-stats{font-size:0.68em;color:#8a8070;margin-top:2px;}
.civ-urp-cost{font-size:0.78em;font-weight:700;color:var(--civ-gold-primary,#e8d88a);white-space:nowrap;text-align:right;}
.civ-urp-cost.free{color:#7ad0a0;}
.civ-urp-cost.short{color:#e08a6a;}
.civ-urp-empty{padding:18px 14px;text-align:center;color:#8a8070;font-size:0.82em;}
`;
  document.head.appendChild(s);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function detachKeyboard(): void {
  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }
}

export function hideUnitReplacePicker(): void {
  detachKeyboard();
  if (root) {
    root.remove();
    root = null;
  }
}

export function isUnitReplacePickerOpen(): boolean {
  return root !== null && root.isConnected;
}

/** Modal wyboru zamiennika (mechanizm "Zastąp") -- jedna karta stosu, nie cały stos. */
export function showUnitReplacePicker(opts: UnitReplacePickerOptions): void {
  hideUnitReplacePicker();
  ensureStyles();

  const overlay = document.createElement('div');
  overlay.className = 'civ-urp-overlay';
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      hideUnitReplacePicker();
      opts.onCancel?.();
    }
  });

  const panel = document.createElement('div');
  panel.className = 'civ-urp';
  panel.addEventListener('click', (e) => e.stopPropagation());

  const hdr = document.createElement('div');
  hdr.className = 'civ-urp-hdr';
  hdr.innerHTML =
    '<div><div class="civ-urp-title">Zastąp — ' + esc(opts.unitName) + '</div>' +
    '<div class="civ-urp-sub">Dopłata = koszt nowej − koszt starej · zużywa ruch tej tury</div></div>';
  hdr.appendChild(document.createRange().createContextualFragment(mapUnitCloseBtnHtml('Anuluj')));
  panel.appendChild(hdr);
  hdr.querySelector('.mu-close-btn')?.addEventListener('click', () => {
    hideUnitReplacePicker();
    opts.onCancel?.();
  });

  const list = document.createElement('div');
  list.className = 'civ-urp-list';

  if (opts.options.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'civ-urp-empty';
    empty.textContent = 'Brak dostępnych zamienników tego typu.';
    list.appendChild(empty);
  }

  for (const o of opts.options) {
    const affordable = opts.skarb >= o.surcharge;
    const item = document.createElement('div');
    item.className = 'civ-urp-item' + (affordable ? '' : ' disabled');
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');

    const ic = document.createElement('div');
    ic.className = 'civ-urp-ic';
    ic.innerHTML = o.icon || unitIconSvg(undefined);
    item.appendChild(ic);

    const body = document.createElement('div');
    body.className = 'civ-urp-body';
    const name = document.createElement('div');
    name.className = 'civ-urp-name';
    name.textContent = o.name;
    body.appendChild(name);
    const stats = document.createElement('div');
    stats.className = 'civ-urp-stats';
    stats.textContent = `Atak ${o.atk} · Obrona ${o.def} · HP ${o.hpMax}`;
    body.appendChild(stats);
    item.appendChild(body);

    const cost = document.createElement('div');
    cost.className = 'civ-urp-cost' + (o.surcharge === 0 ? ' free' : affordable ? '' : ' short');
    cost.innerHTML = o.surcharge === 0 ? 'bez dopłaty' : `${o.surcharge} 💰`;
    if (!affordable) cost.title = `Za mało Pieniądza (${opts.skarb}/${o.surcharge})`;
    item.appendChild(cost);

    const pick = (): void => {
      if (!affordable) return;
      hideUnitReplacePicker();
      opts.onPick(o.id);
    };
    item.addEventListener('click', pick);
    item.addEventListener('keydown', (ev: Event) => {
      const ke = ev as KeyboardEvent;
      if (ke.key === 'Enter' || ke.key === ' ') { ke.preventDefault(); pick(); }
    });

    list.appendChild(item);
  }

  panel.appendChild(list);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  root = overlay;

  keyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      hideUnitReplacePicker();
      opts.onCancel?.();
    }
  };
  document.addEventListener('keydown', keyHandler);
}
