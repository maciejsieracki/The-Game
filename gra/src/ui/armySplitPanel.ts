/**
 * armySplitPanel.ts — rozdzielenie stosu armii na dwa heksy (v1.0).
 */

import type { ArmyMergeUnitRow } from './armyMergePanel';

export interface SplitDestOption {
  q: number;
  r: number;
  label: string;
}

export interface ArmySplitPanelOpts {
  hexLabel: string;
  units: ArmyMergeUnitRow[];
  destHexes: SplitDestOption[];
  onSplit: (unitIds: string[], destQ: number, destR: number) => void;
  onCancel: () => void;
}

let root: HTMLDivElement | null = null;
let keyHandler: ((e: KeyboardEvent) => void) | null = null;

const STYLE_ID = 'civ-army-split-css-v1';

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-asp-overlay{
  position:fixed;inset:0;z-index:525;display:flex;align-items:center;justify-content:center;
  background:rgba(4,8,18,0.58);backdrop-filter:blur(3px);
}
.civ-asp{
  --gold:#e8d88a;--muted:#7a8498;--text:#e8ebf0;--sub:#b8c0cc;
  font:13px "Segoe UI",Tahoma,sans-serif;color:var(--text);
  min-width:min(400px,calc(100vw - 28px));max-width:460px;
  background:linear-gradient(165deg,rgba(14,20,36,0.97),rgba(8,12,24,0.98));
  border:1px solid rgba(232,216,138,0.38);border-radius:14px;
  box-shadow:0 20px 56px rgba(0,0,0,0.65);overflow:hidden;
}
.civ-asp *{box-sizing:border-box;}
.civ-asp-hdr{padding:16px 18px 10px;text-align:center;border-bottom:1px solid rgba(232,216,138,0.14);}
.civ-asp-title{font:700 11px Georgia,serif;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);}
.civ-asp-sub{font-size:11px;color:var(--muted);margin-top:4px;}
.civ-asp-body{padding:14px 18px;}
.civ-asp-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px;}
.civ-asp-units{display:flex;flex-direction:column;gap:5px;margin-bottom:14px;max-height:160px;overflow-y:auto;}
.civ-asp-u{display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:7px;
  border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);cursor:pointer;}
.civ-asp-u.on{border-color:rgba(107,196,232,0.45);background:rgba(107,196,232,0.1);}
.civ-asp-u input{accent-color:#6bc4e8;}
.civ-asp-u-ic{font-size:18px;width:24px;text-align:center;}
.civ-asp-u-name{flex:1;font-size:12px;font-weight:600;color:#f0e8b8;}
.civ-asp-dests{display:flex;flex-wrap:wrap;gap:6px;}
.civ-asp-dest{font:inherit;font-size:11px;font-weight:600;cursor:pointer;padding:6px 10px;border-radius:6px;
  border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05);color:var(--sub);}
.civ-asp-dest.on{border-color:rgba(232,216,138,0.55);background:rgba(232,216,138,0.12);color:var(--gold);}
.civ-asp-dest:disabled{opacity:.35;cursor:not-allowed;}
.civ-asp-hint{font-size:11px;color:var(--muted);margin-top:10px;line-height:1.4;}
.civ-asp-foot{padding:0 18px 16px;display:flex;gap:10px;justify-content:flex-end;}
.civ-asp-btn{font:inherit;font-size:12px;font-weight:700;cursor:pointer;border-radius:8px;padding:9px 16px;border:1px solid transparent;}
.civ-asp-btn-go{background:linear-gradient(135deg,rgba(107,196,232,0.85),rgba(60,140,200,0.9));color:#081018;}
.civ-asp-btn-cancel{background:rgba(255,255,255,0.06);color:var(--sub);border-color:rgba(255,255,255,0.14);}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function closePanel(): void {
  if (keyHandler) {
    document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  }
  if (root) {
    root.remove();
    root = null;
  }
}

export function hideArmySplitPanel(): void {
  closePanel();
}

export function isArmySplitPanelOpen(): boolean {
  return root !== null;
}

export function showArmySplitPanel(opts: ArmySplitPanelOpts): void {
  closePanel();
  ensureStyles();

  if (opts.units.length < 2 || opts.destHexes.length === 0) return;

  const selected = new Set<string>([opts.units[opts.units.length - 1]!.id]);
  let destQ = opts.destHexes[0]!.q;
  let destR = opts.destHexes[0]!.r;

  root = document.createElement('div');
  root.className = 'civ-asp-overlay';
  root.addEventListener('click', (e) => {
    if (e.target === root) { closePanel(); opts.onCancel(); }
  });

  const box = document.createElement('div');
  box.className = 'civ-asp';

  function renderInner(): void {
    let uHtml = '';
    for (const u of opts.units) {
      const on = selected.has(u.id);
      uHtml += '<label class="civ-asp-u' + (on ? ' on' : '') + '">'
        + '<input type="checkbox"' + (on ? ' checked' : '') + ' data-uid="' + esc(u.id) + '">'
        + '<span class="civ-asp-u-ic">' + esc(u.icon ?? '\u2694\uFE0F') + '</span>'
        + '<span class="civ-asp-u-name">' + esc(u.name) + '</span></label>';
    }
    let dHtml = '';
    for (const d of opts.destHexes) {
      const on = d.q === destQ && d.r === destR;
      dHtml += '<button type="button" class="civ-asp-dest' + (on ? ' on' : '') + '" data-dq="' + d.q + '" data-dr="' + d.r + '">'
        + esc(d.label) + '</button>';
    }
    box.innerHTML =
      '<div class="civ-asp-hdr">'
        + '<div class="civ-asp-title">Rozdziel armi\u0119</div>'
        + '<div class="civ-asp-sub">Heks ' + esc(opts.hexLabel) + '</div>'
      + '</div>'
      + '<div class="civ-asp-body">'
        + '<div class="civ-asp-lbl">Wybierz jednostki do od\u0142ączenia</div>'
        + '<div class="civ-asp-units">' + uHtml + '</div>'
        + '<div class="civ-asp-lbl">Docelowy heks (s\u0105siad)</div>'
        + '<div class="civ-asp-dests">' + dHtml + '</div>'
        + '<div class="civ-asp-hint">Na heksie \u0179r\u00f3d\u0142owym musi zosta\u0107 co najmniej 1 jednostka.</div>'
      + '</div>'
      + '<div class="civ-asp-foot">'
        + '<button type="button" class="civ-asp-btn civ-asp-btn-cancel" data-cancel>Anuluj</button>'
        + '<button type="button" class="civ-asp-btn civ-asp-btn-go" data-go>Rozdziel</button>'
      + '</div>';

    box.querySelectorAll('[data-uid]').forEach(inp => {
      inp.addEventListener('change', () => {
        const id = (inp as HTMLInputElement).getAttribute('data-uid');
        if (!id) return;
        if ((inp as HTMLInputElement).checked) selected.add(id);
        else selected.delete(id);
        renderInner();
      });
    });
    box.querySelectorAll('[data-dq]').forEach(btn => {
      btn.addEventListener('click', () => {
        destQ = Number((btn as HTMLElement).getAttribute('data-dq'));
        destR = Number((btn as HTMLElement).getAttribute('data-dr'));
        renderInner();
      });
    });
    box.querySelector('[data-cancel]')?.addEventListener('click', () => {
      closePanel();
      opts.onCancel();
    });
    box.querySelector('[data-go]')?.addEventListener('click', () => {
      const ids = [...selected];
      const stay = opts.units.length - ids.length;
      if (ids.length === 0 || stay < 1) return;
      closePanel();
      opts.onSplit(ids, destQ, destR);
    });
  }

  box.addEventListener('click', (e) => e.stopPropagation());
  root.appendChild(box);
  document.body.appendChild(root);
  renderInner();

  keyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closePanel();
      opts.onCancel();
    }
  };
  document.addEventListener('keydown', keyHandler);
}
