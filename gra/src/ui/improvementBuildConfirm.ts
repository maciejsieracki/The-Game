/**
 * improvementBuildConfirm.ts — potwierdzenie zastąpienia ulepszeń / lasu przy budowie z mapy.
 */

import type { ImprovementBuildImpact } from '../map/improvement-build';
import { formatImprovementBuildImpactList } from '../map/improvement-build';
import { improvementDisplayName } from '../game/terrain-improvements';

let overlay: HTMLDivElement | null = null;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function ensureStyles(): void {
  if (document.getElementById('civ-imp-build-confirm-style')) return;
  const style = document.createElement('style');
  style.id = 'civ-imp-build-confirm-style';
  style.textContent = `
.civ-imp-build-confirm-back{position:fixed;inset:0;z-index:460;background:rgba(0,0,0,.55);
  display:flex;align-items:center;justify-content:center;padding:16px;}
.civ-imp-build-confirm{width:400px;max-width:92vw;border-radius:12px;border:2px solid rgba(232,216,138,.45);
  background:linear-gradient(180deg,#2a2418,#1a1610);padding:18px 20px;color:#e8dcc8;
  box-shadow:0 12px 40px rgba(0,0,0,.5);font-family:system-ui,sans-serif;}
.civ-imp-build-confirm h3{margin:0 0 10px;font-family:Georgia,serif;color:#e8d88a;font-size:16px;}
.civ-imp-build-confirm p{margin:0 0 8px;font-size:13px;line-height:1.45;color:#c8b898;}
.civ-imp-build-confirm p strong{color:#e8d88a;}
.civ-imp-build-btns{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;}
.civ-imp-build-btns button{height:32px;padding:0 16px;border-radius:8px;cursor:pointer;font-size:13px;}
.civ-imp-build-cancel{border:1px solid rgba(232,216,138,.3);color:#c8b898;background:transparent;}
.civ-imp-build-cancel:hover{border-color:#e8d88a;color:#e8d88a;}
.civ-imp-build-ok{border:1px solid rgba(232,216,138,.6);color:#2e2708;background:#e8d88a;font-weight:600;}
.civ-imp-build-ok:hover{background:#f4e6a8;}
`;
  document.head.appendChild(style);
}

/** Modal: „Zastąpić X przez Y?” — lista tego, co zniknie z heksa. */
export function showImprovementBuildConfirmModal(
  newKey: string,
  impact: ImprovementBuildImpact,
  onConfirm: () => void,
): void {
  ensureStyles();
  if (overlay !== null) overlay.remove();

  const newLabel = improvementDisplayName(newKey);
  const removedList = formatImprovementBuildImpactList(impact);
  const removedHtml = removedList
    ? `<p>Zniknie: <strong>${esc(removedList)}</strong></p>`
    : '';

  overlay = document.createElement('div');
  overlay.className = 'civ-imp-build-confirm-back';
  overlay.innerHTML =
    '<div class="civ-imp-build-confirm" role="dialog" aria-modal="true">' +
      '<h3>Zastąpić ulepszenie?</h3>' +
      `<p>Postawić <strong>${esc(newLabel)}</strong> na tym polu?</p>` +
      removedHtml +
      '<div class="civ-imp-build-btns">' +
        '<button type="button" class="civ-imp-build-cancel">Anuluj</button>' +
        '<button type="button" class="civ-imp-build-ok">Zastąp</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);

  const close = (): void => {
    overlay?.remove();
    overlay = null;
  };

  overlay.querySelector('.civ-imp-build-cancel')?.addEventListener('click', close);
  overlay.querySelector('.civ-imp-build-ok')?.addEventListener('click', () => {
    close();
    onConfirm();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
}
