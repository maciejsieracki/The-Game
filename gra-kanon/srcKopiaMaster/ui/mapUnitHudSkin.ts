/**
 * mapUnitHudSkin.ts — wspólny skin 1E dla panelu jednostki / stosu armii (A-06).
 */
import { brandIconSvg } from './icons/brandAssets';
import { CIV_BRAND_SCOPE_VARS, ensureBrandRootTokens } from './brandTokenVars';

export function ensureMapUnitBrandScope(): void {
  ensureBrandRootTokens();
}

export function mapUnitBrandIconHtml(id: string, size: 24 | 40 = 24, cls = 'mu-ic'): string {
  const svg = brandIconSvg(id, size);
  if (!svg) return '';
  return svg.replace('<svg ', `<svg class="${cls}" `);
}

export function mapUnitCloseBtnHtml(title = 'Zamknij'): string {
  const ic = mapUnitBrandIconHtml('ui-close', 24, 'mu-close-ic');
  return ic
    ? `<button type="button" class="mu-close-btn" title="${title}" aria-label="${title}">${ic}</button>`
    : `<button type="button" class="mu-close-btn" title="${title}" aria-label="${title}">×</button>`;
}

/** Wspólne klasy 1E — panel jednostki + stos armii. */
export const MAP_UNIT_1E_SHARED_CSS = `
${CIV_BRAND_SCOPE_VARS}
.mu-close-btn{background:none;border:none;color:var(--civ-text-muted,#8a8070);cursor:pointer;padding:0.15em;
  border-radius:6px;display:inline-flex;align-items:center;justify-content:center;line-height:1;}
.mu-close-btn:hover{color:var(--civ-gold-primary,#e8d88a);background:rgba(232,216,138,.1);}
.mu-close-ic{width:18px;height:18px;display:block;}
.mu-ic{display:block;flex-shrink:0;}
.mu-outline-btn{display:inline-flex;align-items:center;justify-content:center;gap:0.35em;
  padding:0.35em 0.75em;border-radius:var(--civ-radius-btn,8px);cursor:pointer;
  font-family:var(--civ-font-ui,'Segoe UI',Tahoma,sans-serif);font-size:0.72em;font-weight:600;
  letter-spacing:.06em;text-transform:uppercase;border:1px solid rgba(232,216,138,.35);
  background:linear-gradient(180deg,rgba(24,30,42,.92),rgba(12,16,24,.92));color:var(--civ-text-pergament,#c8b898);}
.mu-outline-btn:hover:not(:disabled){border-color:rgba(232,216,138,.55);color:var(--civ-gold-primary,#e8d88a);}
.mu-outline-btn:disabled{opacity:.35;cursor:not-allowed;}
.mu-outline-btn .mu-ic{width:14px;height:14px;}
.mu-outline-btn.accent-blue{border-color:rgba(107,196,232,.45);color:#c8e8ff;}
.mu-outline-btn.accent-blue:hover:not(:disabled){border-color:rgba(107,196,232,.65);}
.mu-outline-btn.accent-violet{border-color:rgba(176,140,224,.45);color:#e8d0ff;}
.mu-outline-btn.accent-violet:hover:not(:disabled){border-color:rgba(176,140,224,.65);}
.mu-gold-btn{display:inline-flex;align-items:center;justify-content:center;gap:0.35em;
  min-width:64px;padding:0.55em 0.85em;border-radius:var(--civ-radius-btn,8px);cursor:pointer;
  font-family:var(--civ-font-ui,'Segoe UI',Tahoma,sans-serif);font-size:0.72em;font-weight:700;
  letter-spacing:.08em;text-transform:uppercase;border:1px solid rgba(232,216,138,.45);
  background:linear-gradient(180deg,rgba(232,216,138,.22),rgba(232,216,138,.08));color:var(--civ-gold-primary,#e8d88a);}
.mu-gold-btn:hover:not(:disabled){background:linear-gradient(180deg,rgba(232,216,138,.32),rgba(232,216,138,.14));}
.mu-gold-btn:disabled{opacity:.35;pointer-events:none;}
.mu-muted-btn{display:inline-flex;align-items:center;justify-content:center;gap:0.35em;
  min-width:64px;padding:0.55em 0.85em;border-radius:var(--civ-radius-btn,8px);cursor:pointer;
  font-family:var(--civ-font-ui,'Segoe UI',Tahoma,sans-serif);font-size:0.72em;font-weight:600;
  letter-spacing:.06em;text-transform:uppercase;border:1px solid rgba(140,150,165,.35);
  background:rgba(40,48,60,.5);color:#c8d0dc;}
.mu-muted-btn:hover:not(:disabled){border-color:rgba(232,216,138,.35);color:var(--civ-text-primary,#e8e0c8);}
.mu-muted-btn:disabled{opacity:.35;pointer-events:none;}
.mu-stat{background:linear-gradient(180deg,rgba(18,24,32,.96),rgba(8,10,16,.92));
  border:1px solid rgba(232,216,138,.22);border-radius:8px;padding:6px 4px;text-align:center;}
.mu-stat .l{font-size:8px;color:var(--civ-text-muted,#8a8070);text-transform:uppercase;letter-spacing:.12em;}
.mu-stat .v{font-family:var(--civ-font-title,Georgia,serif);font-size:15px;font-weight:400;
  color:var(--civ-gold-primary,#e8d88a);margin-top:3px;line-height:1.1;}
.mu-hp-lbl{font-size:9px;color:var(--civ-text-muted,#8a8070);margin-bottom:4px;display:flex;
  justify-content:space-between;letter-spacing:.08em;text-transform:uppercase;}
.mu-hp-bar{height:10px;background:rgba(255,255,255,.07);border-radius:5px;overflow:hidden;
  border:1px solid rgba(232,216,138,.12);}
.mu-hp-bar i{display:block;height:100%;background:linear-gradient(90deg,#1a6020,#50b070);}
`;
