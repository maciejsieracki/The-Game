/**
 * armyMergePickPanel.ts — wybór jednostek i sąsiedniego stosu do połączenia (v1.0).
 */

import type { ArmyMergeUnitRow } from './armyMergePanel';
import { pushOverlay, popOverlay } from './escapeOverlayStack';
import { unitIconSvg } from './icons/brandAssets';

export interface MergeTargetOption {
  q: number;
  r: number;
  label: string;
  units: ArmyMergeUnitRow[];
}

export interface ArmyMergePickPanelOpts {
  hexLabel: string;
  sourceUnits: ArmyMergeUnitRow[];
  targets: MergeTargetOption[];
  onMerge: (unitIds: string[], targetQ: number, targetR: number) => void;
  onCancel: () => void;
}

let root: HTMLDivElement | null = null;

const STYLE_ID = 'civ-army-merge-pick-css-v1';

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-ampk-overlay{
  position:fixed;inset:0;z-index:526;display:flex;align-items:center;justify-content:center;
  background:rgba(4,8,18,0.58);backdrop-filter:blur(3px);
}
.civ-ampk{
  --gold:#e8d88a;--muted:#7a8498;--text:#e8ebf0;--sub:#b8c0cc;
  font:13px "Segoe UI",Tahoma,sans-serif;color:var(--text);
  min-width:min(420px,calc(100vw - 28px));max-width:500px;
  background:linear-gradient(165deg,rgba(14,20,36,0.97),rgba(8,12,24,0.98));
  border:1px solid rgba(232,216,138,0.38);border-radius:14px;
  box-shadow:0 20px 56px rgba(0,0,0,0.65);overflow:hidden;
}
.civ-ampk *{box-sizing:border-box;}
.civ-ampk-hdr{padding:16px 18px 10px;text-align:center;border-bottom:1px solid rgba(232,216,138,0.14);}
.civ-ampk-title{font:700 11px Georgia,serif;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);}
.civ-ampk-sub{font-size:11px;color:var(--muted);margin-top:4px;}
.civ-ampk-body{padding:14px 18px;}
.civ-ampk-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px;}
.civ-ampk-units{display:flex;flex-direction:column;gap:5px;margin-bottom:14px;max-height:150px;overflow-y:auto;}
.civ-ampk-u{display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:7px;
  border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);cursor:pointer;}
.civ-ampk-u.on{border-color:rgba(80,176,112,0.45);background:rgba(80,176,112,0.1);}
.civ-ampk-u input{accent-color:#50b070;}
.civ-ampk-u-ic{font-size:18px;width:24px;text-align:center;}
.civ-ampk-u-name{flex:1;font-size:12px;font-weight:600;color:#f0e8b8;}
.civ-ampk-targets{display:flex;flex-direction:column;gap:6px;margin-bottom:10px;}
.civ-ampk-target{font:inherit;font-size:11px;font-weight:600;cursor:pointer;padding:8px 10px;border-radius:6px;
  border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05);color:var(--sub);text-align:left;}
.civ-ampk-target.on{border-color:rgba(80,176,112,0.55);background:rgba(80,176,112,0.12);color:#c8ffd8;}
.civ-ampk-target-preview{font-size:10px;color:var(--muted);margin-top:4px;font-weight:400;}
.civ-ampk-hint{font-size:11px;color:var(--muted);margin-top:8px;line-height:1.4;}
.civ-ampk-foot{padding:0 18px 16px;display:flex;gap:10px;justify-content:flex-end;}
.civ-ampk-btn{font:inherit;font-size:12px;font-weight:700;cursor:pointer;border-radius:8px;padding:9px 16px;border:1px solid transparent;}
.civ-ampk-btn-go{background:linear-gradient(135deg,rgba(80,176,112,0.85),rgba(50,130,70,0.9));color:#0a120a;}
.civ-ampk-btn-cancel{background:rgba(255,255,255,0.06);color:var(--sub);border-color:rgba(255,255,255,0.14);}
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
  popOverlay('army-merge-pick');
  if (root) {
    root.remove();
    root = null;
  }
}

export function hideArmyMergePickPanel(): void {
  closePanel();
}

export function isArmyMergePickPanelOpen(): boolean {
  return root !== null;
}

export function showArmyMergePickPanel(opts: ArmyMergePickPanelOpts): void {
  closePanel();
  ensureStyles();
  if (opts.sourceUnits.length === 0 || opts.targets.length === 0) return;

  const selected = new Set<string>(opts.sourceUnits.map(u => u.id));
  let targetQ = opts.targets[0]!.q;
  let targetR = opts.targets[0]!.r;

  root = document.createElement('div');
  root.className = 'civ-ampk-overlay';
  root.addEventListener('click', (e) => {
    if (e.target === root) { closePanel(); opts.onCancel(); }
  });

  const box = document.createElement('div');
  box.className = 'civ-ampk';

  function renderInner(): void {
    let uHtml = '';
    for (const u of opts.sourceUnits) {
      const on = selected.has(u.id);
      uHtml += '<label class="civ-ampk-u' + (on ? ' on' : '') + '">'
        + '<input type="checkbox"' + (on ? ' checked' : '') + ' data-uid="' + esc(u.id) + '">'
        + '<span class="civ-ampk-u-ic">' + (u.icon || unitIconSvg(undefined)) + '</span>'
        + '<span class="civ-ampk-u-name">' + esc(u.name) + '</span></label>';
    }
    let tHtml = '';
    for (const t of opts.targets) {
      const on = t.q === targetQ && t.r === targetR;
      const preview = t.units.map(u => u.name).join(', ');
      tHtml += '<button type="button" class="civ-ampk-target' + (on ? ' on' : '') + '" data-tq="' + t.q + '" data-tr="' + t.r + '">'
        + esc(t.label)
        + '<div class="civ-ampk-target-preview">' + esc(preview) + '</div>'
        + '</button>';
    }
    box.innerHTML =
      '<div class="civ-ampk-hdr">'
        + '<div class="civ-ampk-title">Po\u0142\u0105cz armie</div>'
        + '<div class="civ-ampk-sub">Heks ' + esc(opts.hexLabel) + '</div>'
      + '</div>'
      + '<div class="civ-ampk-body">'
        + '<div class="civ-ampk-lbl">Jednostki do przeniesienia</div>'
        + '<div class="civ-ampk-units">' + uHtml + '</div>'
        + '<div class="civ-ampk-lbl">Docelowy stos (s\u0105siad)</div>'
        + '<div class="civ-ampk-targets">' + tHtml + '</div>'
        + '<div class="civ-ampk-hint">Wybrane jednostki wejd\u0105 na s\u0105siedni heks i zostan\u0105 po\u0142\u0105czone ze stosem.</div>'
      + '</div>'
      + '<div class="civ-ampk-foot">'
        + '<button type="button" class="civ-ampk-btn civ-ampk-btn-cancel" data-cancel>Anuluj</button>'
        + '<button type="button" class="civ-ampk-btn civ-ampk-btn-go" data-go>Po\u0142\u0105cz</button>'
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
    box.querySelectorAll('[data-tq]').forEach(btn => {
      btn.addEventListener('click', () => {
        targetQ = Number((btn as HTMLElement).getAttribute('data-tq'));
        targetR = Number((btn as HTMLElement).getAttribute('data-tr'));
        renderInner();
      });
    });
    box.querySelector('[data-cancel]')?.addEventListener('click', () => {
      closePanel();
      opts.onCancel();
    });
    box.querySelector('[data-go]')?.addEventListener('click', () => {
      const ids = [...selected];
      if (ids.length === 0) return;
      closePanel();
      opts.onMerge(ids, targetQ, targetR);
    });
  }

  box.addEventListener('click', (e) => e.stopPropagation());
  root.appendChild(box);
  document.body.appendChild(root);
  renderInner();

  pushOverlay('army-merge-pick', () => {
    closePanel();
    opts.onCancel();
  });
}
