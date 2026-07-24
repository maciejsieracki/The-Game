/**
 * diploUiSkin.ts — wspólny skin 1E dla modułów dyplomacji (P1 reskin).
 */
import { brandIconSvg, civIconSvg, type BrandIconSize } from './icons/brandAssets';
import civMapJson from './icons/brand/civ-icon-map.json';
import { CIV_BRAND_SCOPE_VARS, ensureBrandRootTokens } from './brandTokenVars';
import { leaderPortraitUrl } from './leaderPortraits';

export function ensureDiploBrandScope(): void {
  ensureBrandRootTokens();
}

export function dipBrandIconHtml(id: string, size: BrandIconSize = 24, cls = 'dip-ic'): string {
  const svg = brandIconSvg(id, size);
  if (!svg) return '';
  return svg.replace('<svg ', `<svg class="${cls}" `);
}

export function tierDipIconId(tier: number): string {
  const t = Math.max(0, Math.min(4, Math.round(tier)));
  if (t === 0) return 'dip-war';
  if (t === 1) return 'dip-war-strip';
  if (t === 2) return 'dip-peace';
  if (t === 3) return 'dip-pact';
  return 'dip-alliance';
}

export function pennantTone(tier: number): 'gold' | 'neutral' | 'war' {
  const t = Math.max(0, Math.min(4, Math.round(tier)));
  if (t <= 1) return 'war';
  if (t >= 4) return 'gold';
  return 'neutral';
}

export function resolveCivIconIdFromName(displayName: string): string {
  const norm = displayName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  const map = (civMapJson as { map: Record<string, string> }).map;
  if (map[norm]) return norm;
  for (const key of Object.keys(map)) {
    if (key === '_default') continue;
    if (norm.includes(key) || key.includes(norm)) return key;
  }
  return 'grecy';
}

export function civPennantHtml(civName: string, tier: number, large = false): string {
  const iconId = resolveCivIconIdFromName(civName);
  return civPennantHtmlById(iconId, undefined, tier, large);
}

/** Proporczyk z ikonaId + opcjonalnym kolorem nacji (ramka). */
export function civPennantHtmlById(
  iconId: string,
  kolorHex: string | undefined,
  tier: number,
  large = false,
): string {
  const svg = civIconSvg(iconId, 24);
  const ic = svg
    ? svg.replace('<svg ', '<svg class="dip-pennant-civ-ic" ')
    : dipBrandIconHtml('tb-diplomacy', 24, 'dip-pennant-civ-ic');
  const tone = pennantTone(tier);
  const cls = large ? 'dip-pennant dip-pennant-lg' : 'dip-pennant';
  const borderStyle = kolorHex
    ? ` style="border-color:${kolorHex};box-shadow:0 0 8px ${kolorHex}55"`
    : '';
  return `<span class="${cls} ${tone}"${borderStyle}><span class="dip-pennant-inner">${ic}</span></span>`;
}

/** Medalion lidera (mockup 1E — audiencja, hero 150px). */
export function civLeaderMedallionHtml(civName: string): string {
  const iconId = resolveCivIconIdFromName(civName);
  return civLeaderMedallionHtmlById(iconId, undefined);
}

/**
 * Hero audiencji — duży emblem + ramka w kolorHex nacji. `era` (opcjonalne, patrz
 * dyspozycja PORTRETY-WLADCOW-2026-07-23 KROK 2 pkt 2c) -- gdy podane i leaderPortraits.ts
 * ma plik dla tej civ/epoki, w środku medalionu ląduje portret zamiast ikony SVG. Fallback
 * obowiązkowy: brak portretu -> dotychczasowa ikona civIconSvg, bez zmian.
 *
 * `forceCultureIcon` (R-MP-PORTRET, Maciej 2026-07-24) — gdy `true`, POMIŃ portret niezależnie
 * od `era` i pokaż ikonę-symbol kultury (civIconSvg). Miasta-państwa klastra NIE mogą dostać
 * nowego portretu-zdjęcia władcy głównej cywilizacji (10-11 MP tej samej kultury wyglądałoby
 * identycznie jak gracz/główne AI) — wołający ustawia to dla ownerów rozpoznanych jako
 * miasto-państwo (isOwnerClusterCityState). Gracz/główne AI: bez zmian (forceCultureIcon=false/undefined).
 */
export function civLeaderMedallionHtmlById(
  iconId: string,
  kolorHex: string | undefined,
  era?: number,
  forceCultureIcon?: boolean,
): string {
  const portraitUrl = (!forceCultureIcon && era !== undefined) ? leaderPortraitUrl(iconId, era) : null;
  let ic: string;
  if (portraitUrl) {
    ic = `<img class="dip-leader-ic" src="${portraitUrl}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">`;
  } else {
    const svg = civIconSvg(iconId, 72);
    ic = svg
      ? svg.replace('<svg ', '<svg class="dip-leader-ic" ')
      : dipBrandIconHtml('tb-diplomacy', 72, 'dip-leader-ic');
  }
  const border = kolorHex ?? 'var(--tg-gold-primary,#e8d88a)';
  const glow = kolorHex ? `${kolorHex}33` : 'rgba(232,216,138,.2)';
  const style = ` style="border-color:${border};box-shadow:inset 0 3px 8px ${glow},0 0 40px ${glow}"`;
  return `<div class="dip-leader-medallion"${style}>${ic}</div>`;
}

export function tierBadgeHtml(tier: number, label: string): string {
  const icon = dipBrandIconHtml(tierDipIconId(tier), 24, 'dip-tier-ic');
  const t = Math.max(0, Math.min(4, Math.round(tier)));
  let cls = 'neutral';
  if (t === 0) cls = 'war';
  else if (t === 1) cls = 'hostile';
  else if (t === 3) cls = 'friendly';
  else if (t === 4) cls = 'ally';
  return `<span class="dip-tier-badge ${cls}">${icon}<span>${label}</span></span>`;
}

export function dipCloseBtnHtml(title = 'Zamknij'): string {
  const ic = dipBrandIconHtml('ui-close', 24, 'dip-close-ic');
  return ic
    ? `<button type="button" class="dip-close-btn" title="${title}" aria-label="${title}">${ic}</button>`
    : `<button type="button" class="dip-close-btn" title="${title}" aria-label="${title}">×</button>`;
}

/** Wspólne klasy 1E — dołącz na początku bloku CSS każdego modułu dyplo. */
export const DIPLO_1E_SHARED_CSS = `
${CIV_BRAND_SCOPE_VARS}
.dip-pennant{width:48px;height:60px;flex-shrink:0;display:flex;justify-content:center;padding-top:7px;
  clip-path:polygon(0 0,100% 0,100% 82%,50% 100%,0 82%);
  border:1px solid rgba(232,216,138,.5);box-shadow:0 4px 10px rgba(0,0,0,.35);}
.dip-pennant-lg{width:56px;height:68px;padding-top:8px;}
.dip-pennant.gold{background:linear-gradient(180deg,#e0c04a,#9a7420);}
.dip-pennant.neutral{background:linear-gradient(180deg,#4a7fb0,#26456a);}
.dip-pennant.war{background:linear-gradient(180deg,var(--tg-red,#c84040),#7a2828);}
.dip-pennant-inner{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
.dip-pennant.gold .dip-pennant-inner{background:#2a2208;color:#f0e0a0;}
.dip-pennant.neutral .dip-pennant-inner{background:#e8f0f8;color:#0e2038;}
.dip-pennant.war .dip-pennant-inner{background:#f4e0e0;color:#4a1414;}
.dip-pennant-civ-ic{width:16px;height:16px;display:block;}
.dip-leader-medallion{width:150px;height:150px;border-radius:50%;margin:0 auto;
  background:radial-gradient(circle at 40% 34%,#2a2416,#12100a);
  border:3px solid var(--tg-gold-primary,#e8d88a);
  box-shadow:inset 0 3px 8px rgba(232,216,138,.25),0 0 40px rgba(232,216,138,.2);
  display:flex;align-items:center;justify-content:center;color:#f4e6a8;}
.dip-leader-ic{width:72px;height:72px;display:block;}
.dip-tier-badge{display:inline-flex;align-items:center;gap:6px;font-size:0.72em;font-weight:700;
  letter-spacing:.08em;text-transform:uppercase;border-radius:14px;padding:4px 10px;white-space:nowrap;}
.dip-tier-badge .dip-tier-ic{width:14px;height:14px;flex-shrink:0;}
.dip-tier-badge.war{color:#e08a8a;border:1px solid rgba(200,64,64,.5);background:rgba(200,64,64,.08);}
.dip-tier-badge.hostile{color:var(--tg-orange,#d08030);border:1px solid rgba(210,120,30,.45);background:rgba(210,120,30,.08);}
.dip-tier-badge.neutral{color:var(--civ-text-pergament,#c8b898);border:1px solid rgba(232,216,138,.28);background:rgba(255,255,255,.03);}
.dip-tier-badge.friendly{color:#a8d8b8;border:1px solid rgba(80,176,112,.35);background:rgba(80,176,112,.06);}
.dip-tier-badge.ally{color:#7ad0a0;border:1px solid rgba(80,176,112,.4);background:rgba(80,176,112,.1);}
.dip-close-btn{background:none;border:none;color:var(--tg-text-muted,#8a8070);cursor:pointer;padding:0.15em;
  border-radius:6px;display:inline-flex;align-items:center;justify-content:center;line-height:1;}
.dip-close-btn:hover{color:var(--tg-gold-primary,#e8d88a);background:rgba(232,216,138,.1);}
.dip-close-ic{width:18px;height:18px;display:block;}
.dip-ic{display:block;}
.dip-gold-btn{display:inline-flex;align-items:center;justify-content:center;gap:0.35em;
  padding:0.45em 0.85em;border-radius:var(--tg-radius-btn,8px);cursor:pointer;
  font-family:var(--tg-font-ui,'Segoe UI',Tahoma,sans-serif);font-size:0.78em;font-weight:700;
  letter-spacing:.08em;text-transform:uppercase;border:1px solid rgba(232,216,138,.45);
  background:linear-gradient(180deg,rgba(232,216,138,.18),rgba(232,216,138,.06));color:var(--tg-gold-primary,#e8d88a);}
.dip-gold-btn:hover{background:linear-gradient(180deg,rgba(232,216,138,.28),rgba(232,216,138,.12));}
.dip-muted-btn{display:inline-flex;align-items:center;justify-content:center;gap:0.35em;
  padding:0.45em 0.85em;border-radius:var(--tg-radius-btn,8px);cursor:pointer;
  font-family:var(--tg-font-ui,'Segoe UI',Tahoma,sans-serif);font-size:0.78em;font-weight:600;
  letter-spacing:.06em;border:1px solid rgba(140,150,165,.35);background:rgba(40,48,60,.5);color:#c8d0dc;}
.dip-muted-btn:hover{border-color:rgba(232,216,138,.35);color:var(--tg-text-primary,#e8e0c8);}
`;
