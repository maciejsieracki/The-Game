/**
 * diplomacyProposalBanner.ts — wynik negocjacji po evaluateProposal.
 */

import { dipBrandIconHtml, ensureDiploBrandScope } from './diploUiSkin';

const STYLE_ID = 'civ-diplo-prop-banner-css-1e';
let timer: ReturnType<typeof setTimeout> | null = null;
let root: HTMLDivElement | null = null;

function ensureStyles(): void {
  ensureDiploBrandScope();
  document.getElementById('civ-diplo-prop-banner-css')?.remove();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-diplo-prop-banner{position:fixed;top:72px;left:50%;transform:translateX(-50%);z-index:850;
  min-width:280px;max-width:480px;padding:12px 18px;border-radius:12px;
  font:14px 'Segoe UI',Tahoma,sans-serif;display:flex;align-items:flex-start;gap:10px;
  box-shadow:0 10px 32px rgba(0,0,0,.55);animation:civDiploBannerIn .25s ease;}
.civ-diplo-prop-banner .dip-ic{width:22px;height:22px;flex-shrink:0;margin-top:2px;}
.civ-diplo-prop-banner.ok{background:linear-gradient(180deg,rgba(24,48,32,.97),rgba(12,28,18,.97));
  border:2px solid rgba(80,176,112,.45);color:#d8ffe4;}
.civ-diplo-prop-banner.no{background:linear-gradient(180deg,rgba(48,18,18,.97),rgba(24,8,8,.97));
  border:2px solid rgba(200,64,64,.45);color:#ffd8d8;}
.civ-diplo-prop-banner strong{display:block;font-family:Georgia,serif;font-size:1.02em;margin-bottom:4px;}
@keyframes civDiploBannerIn{from{opacity:0;transform:translateX(-50%) translateY(-8px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function showDiplomacyProposalBanner(accepted: boolean, reason: string): void {
  hideDiplomacyProposalBanner();
  ensureStyles();
  root = document.createElement('div');
  root.className = 'civ-diplo-prop-banner ' + (accepted ? 'ok' : 'no');
  const icon = dipBrandIconHtml(accepted ? 'ui-accepted' : 'ui-denied', 24, 'dip-ic') ?? '';
  const head = accepted ? 'Przyjęto' : 'Odrzucono';
  root.innerHTML = icon
    + '<div><strong>' + head + '</strong><span style="font-size:0.9em;opacity:0.92">'
    + esc(reason) + '</span></div>';
  document.body.appendChild(root);
  timer = setTimeout(hideDiplomacyProposalBanner, 4500);
}

export function hideDiplomacyProposalBanner(): void {
  if (timer !== null) { clearTimeout(timer); timer = null; }
  if (root !== null) { root.remove(); root = null; }
}
