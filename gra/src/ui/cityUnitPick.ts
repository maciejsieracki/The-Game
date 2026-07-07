/**
 * cityUnitPick.ts — wybór: panel miasta vs zaznaczenie jednostki (ten sam heks).
 * Decyzja Maciej 2026-07-01 (A2-Q5).
 */

export interface CityUnitPickOptions {
  cityName: string;
  unitLabel: string;
  stackCount?: number;
  onCity: () => void;
  onUnit: () => void;
  onCancel?: () => void;
}

let root: HTMLDivElement | null = null;
let keyHandler: ((e: KeyboardEvent) => void) | null = null;

const STYLE_ID = 'civ-city-unit-pick-css';

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
@keyframes cup-in{from{opacity:0;transform:scale(.96) translateY(8px)}to{opacity:1;transform:none}}
.civ-cup-overlay{
  position:fixed;inset:0;z-index:680;display:flex;align-items:center;justify-content:center;
  padding:16px;background:rgba(4,8,18,0.45);backdrop-filter:blur(2px);
  animation:cup-in .2s ease-out;
}
.civ-cup{
  --gold:#e8d88a;--gold-dim:#c9a84c;--muted:#7a8498;--text:#e8ebf0;
  font:13px "Segoe UI",Tahoma,sans-serif;color:var(--text);
  width:min(300px,calc(100vw - 32px));
  background:linear-gradient(165deg,rgba(14,20,36,0.98),rgba(8,12,24,0.99));
  border:1px solid rgba(232,216,138,0.38);border-radius:12px;
  box-shadow:0 16px 48px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.06);
  overflow:hidden;animation:cup-in .24s ease-out;
}
.civ-cup *{box-sizing:border-box;}
.civ-cup-hdr{padding:12px 16px 10px;text-align:center;border-bottom:1px solid rgba(232,216,138,0.12);}
.civ-cup-title{font:700 10px/1.2 Georgia,serif;letter-spacing:.12em;text-transform:uppercase;color:var(--gold-dim);}
.civ-cup-sub{font-size:11px;color:var(--muted);margin-top:4px;}
.civ-cup-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px;}
.civ-cup-act{
  display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 8px;
  border-radius:10px;cursor:pointer;border:1px solid rgba(255,255,255,0.1);
  background:rgba(255,255,255,0.04);color:var(--text);font:inherit;
  transition:border-color .15s,background .15s,transform .12s;
}
.civ-cup-act:hover{border-color:rgba(232,216,138,0.45);background:rgba(255,255,255,0.07);transform:translateY(-1px);}
.civ-cup-act:active{transform:translateY(0);}
.civ-cup-act-ic{font-size:28px;line-height:1;}
.civ-cup-act-lbl{font-size:12px;font-weight:700;color:var(--gold);}
.civ-cup-act-desc{font-size:9px;color:var(--muted);text-align:center;line-height:1.3;}
.civ-cup-act.unit:hover{border-color:rgba(107,196,232,0.45);background:rgba(107,196,232,0.08);}
.civ-cup-act.unit .civ-cup-act-lbl{color:#a8d4ff;}
.civ-cup-foot{padding:0 12px 12px;text-align:center;}
.civ-cup-cancel{
  font:inherit;font-size:10px;cursor:pointer;padding:5px 12px;
  background:none;border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:var(--muted);
}
.civ-cup-cancel:hover{color:var(--text);border-color:rgba(255,255,255,0.22);}
`;
  document.head.appendChild(s);
}

function detachKeyboard(): void {
  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }
}

export function hideCityUnitPick(): void {
  detachKeyboard();
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

  const hdr = document.createElement('div');
  hdr.className = 'civ-cup-hdr';
  hdr.innerHTML =
    '<div class="civ-cup-title">Co wybierasz?</div>' +
    '<div class="civ-cup-sub">Na tym heksie jest miasto i wojsko</div>';
  panel.appendChild(hdr);

  const actions = document.createElement('div');
  actions.className = 'civ-cup-actions';

  function pick(fn: () => void): void {
    hideCityUnitPick();
    fn();
  }

  const btnCity = document.createElement('button');
  btnCity.type = 'button';
  btnCity.className = 'civ-cup-act city';
  btnCity.innerHTML =
    '<span class="civ-cup-act-ic">\u{1F3DB}</span>' +
    '<span class="civ-cup-act-lbl">Miasto</span>' +
    '<span class="civ-cup-act-desc">' + escapeHtml(opts.cityName) + '</span>';
  btnCity.onclick = () => pick(opts.onCity);

  const btnUnit = document.createElement('button');
  btnUnit.type = 'button';
  btnUnit.className = 'civ-cup-act unit';
  const stackHint = opts.stackCount && opts.stackCount > 1
    ? 'Stos \u00d7' + String(opts.stackCount)
    : 'Zaznacz i rozkazuj';
  btnUnit.innerHTML =
    '<span class="civ-cup-act-ic">\u2694</span>' +
    '<span class="civ-cup-act-lbl">Jednostka</span>' +
    '<span class="civ-cup-act-desc">' + escapeHtml(opts.unitLabel) + '<br>' + stackHint + '</span>';
  btnUnit.onclick = () => pick(opts.onUnit);

  actions.appendChild(btnCity);
  actions.appendChild(btnUnit);
  panel.appendChild(actions);

  const foot = document.createElement('div');
  foot.className = 'civ-cup-foot';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'civ-cup-cancel';
  cancel.textContent = 'Anuluj (Esc)';
  cancel.onclick = () => {
    hideCityUnitPick();
    opts.onCancel?.();
  };
  foot.appendChild(cancel);
  panel.appendChild(foot);

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  root = overlay;

  keyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      hideCityUnitPick();
      opts.onCancel?.();
    } else if (e.key === '1') {
      e.preventDefault();
      pick(opts.onCity);
    } else if (e.key === '2') {
      e.preventDefault();
      pick(opts.onUnit);
    }
  };
  document.addEventListener('keydown', keyHandler);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
