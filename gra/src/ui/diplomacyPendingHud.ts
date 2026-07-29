/**
 * diplomacyPendingHud.ts — modal odpowiedzi na propozycję AI (A1-Q18 blocking).
 */

import { dipBrandIconHtml, DIPLO_1E_SHARED_CSS, ensureDiploBrandScope } from './diploUiSkin';

export interface DiplomacyPendingItem {
  id: string;
  civName: string;
  title: string;
  detail: string;
}

const STYLE_ID = 'civ-diplo-pending-css-1e';

function ensureStyles(): void {
  ensureDiploBrandScope();
  document.getElementById('civ-diplo-pending-css')?.remove();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
${DIPLO_1E_SHARED_CSS}
.civ-dip-pend{position:fixed;inset:0;z-index:820;display:flex;align-items:center;justify-content:center;
  background:rgba(5,6,10,.82);font:14px 'Segoe UI',Tahoma,sans-serif;color:#e8e0c8;}
.civ-dip-box{min-width:300px;max-width:420px;background:linear-gradient(180deg,rgba(18,24,32,.98),rgba(8,10,16,.98));
  border:2px solid rgba(232,216,138,.4);border-radius:12px;padding:18px 20px;box-shadow:0 16px 44px rgba(0,0,0,.7);}
.civ-dip-box h2{margin:0 0 8px;font-family:Georgia,serif;font-size:1.1em;color:#e8d88a;display:flex;align-items:center;gap:8px;}
.civ-dip-box h2 .dip-ic{width:20px;height:20px;}
.civ-dip-box p{margin:0 0 14px;font-size:0.86em;color:#c8b898;line-height:1.45;}
.civ-dip-btns{display:flex;gap:8px;}
.civ-dip-btns .dip-gold-btn,.civ-dip-btns .dip-muted-btn{flex:1;justify-content:center;padding:10px;}
.civ-dip-rej{border-color:rgba(200,64,64,.45)!important;color:#e08a8a!important;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

let root: HTMLDivElement | null = null;

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function showDiplomacyPendingModal(
  item: DiplomacyPendingItem,
  onAccept: () => void,
  onReject: () => void,
  opts?: { onNext?: () => void; hasNext?: boolean },
): void {
  hideDiplomacyPendingModal();
  ensureStyles();
  root = document.createElement('div');
  root.className = 'civ-dip-pend';
  const box = document.createElement('div');
  box.className = 'civ-dip-box';
  const dipIc = dipBrandIconHtml('tb-diplomacy', 24, 'dip-ic') ?? '';
  const hasNext = opts?.hasNext === true && opts.onNext != null;
  const nextBtn = hasNext
    ? '<button type="button" class="dip-gold-btn civ-dip-next">Następne</button>'
    : '';
  box.innerHTML = '<h2>' + dipIc + esc(item.title) + '</h2>'
    + '<p>' + esc(item.detail) + '</p>'
    + '<div class="civ-dip-btns">'
    + nextBtn
    + '<button type="button" class="dip-gold-btn civ-dip-acc">Akceptuj</button>'
    + '<button type="button" class="dip-muted-btn civ-dip-rej">Odrzuć</button>'
    + '</div>';
  root.appendChild(box);
  document.body.appendChild(root);
  box.querySelector('.civ-dip-next')?.addEventListener('click', () => {
    hideDiplomacyPendingModal();
    opts?.onNext?.();
  });
  box.querySelector('.civ-dip-acc')?.addEventListener('click', () => {
    hideDiplomacyPendingModal();
    onAccept();
  });
  box.querySelector('.civ-dip-rej')?.addEventListener('click', () => {
    hideDiplomacyPendingModal();
    onReject();
  });
}

export function hideDiplomacyPendingModal(): void {
  if (root !== null) { root.remove(); root = null; }
}
