/**
 * leaderBannersHud.ts — banery liderów (strefa D mockupu HUD Mapy 1E).
 * v1.0: wizualne placeholdery rankingów AI (bez logiki lane CYWILIZACJE).
 */

import { ensureBrandRootTokens, CIV_BRAND_SCOPE_VARS } from './brandTokenVars';
import { brandIconSvg } from './icons/brandAssets';

export interface LeaderBannersHudApi {
  el: HTMLDivElement;
  destroy: () => void;
}

const STYLE_ID = 'civ-leader-banners-css-w2full';

function bannerSvg(kind: 'gold' | 'blue' | 'red'): string {
  if (kind === 'blue') {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3.4"/><path d="M12 4v2.4M12 17.6V20M4 12h2.4M17.6 12H20"/></svg>';
  }
  if (kind === 'red') {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 5 13 13M18.5 5 10.5 13"/></svg>';
  }
  const crown = brandIconSvg('chip-star', 24);
  if (crown) {
    return crown.replace(/\swidth="[^"]*"/, ' width="16"').replace(/\sheight="[^"]*"/, ' height="16"');
  }
  return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 8.5 12 5l5 3.5Z"/><path d="M8.5 13.5v4.5h7v-4.5"/><path d="M6.5 18h11"/></svg>';
}

function ensureStyles(): void {
  ensureBrandRootTokens();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-leader-banners{position:fixed;top:92px;right:20px;z-index:310;display:flex;gap:10px;pointer-events:none;
  ${CIV_BRAND_SCOPE_VARS}}
.civ-leader-banner{width:46px;height:70px;display:flex;justify-content:center;padding-top:8px;
  clip-path:polygon(0 0,100% 0,100% 82%,50% 100%,0 82%);
  border:1px solid rgba(232,216,138,.5);box-shadow:0 6px 14px rgba(0,0,0,.55);}
.civ-leader-banner.gold{background:linear-gradient(180deg,#e0c04a,#9a7420);}
.civ-leader-banner.blue{background:linear-gradient(180deg,#4a7fb0,#26456a);}
.civ-leader-banner.red{background:linear-gradient(180deg,#c05050,#7a2828);}
.civ-leader-banner .lb-ic{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
.civ-leader-banner.gold .lb-ic{background:#2a2208;color:#f0e0a0;}
.civ-leader-banner.blue .lb-ic{background:#e8f0f8;color:#0e2038;}
.civ-leader-banner.red .lb-ic{background:#f4e0e0;color:#4a1414;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

/** Montuje 3 banery liderów (mockup 1E strefa D). */
export function createLeaderBannersHud(): LeaderBannersHudApi {
  ensureStyles();
  const el = document.createElement('div');
  el.className = 'civ-leader-banners';
  el.innerHTML = [
    ['gold', bannerSvg('gold')],
    ['blue', bannerSvg('blue')],
    ['red', bannerSvg('red')],
  ].map(([cls, svg]) =>
    `<div class="civ-leader-banner ${cls}"><span class="lb-ic">${svg}</span></div>`,
  ).join('');
  document.body.appendChild(el);
  return { el, destroy: () => el.remove() };
}
