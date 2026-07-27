/**
 * unitCardStatus.ts — wspólny wiersz statusów karty jednostki (C-OBCE-JEDN-KARTA).
 * Kolejność ścieżek: koszary · kuźnia · weteran.
 */
import {
  armorPathBadgeLevel,
  softPathBadgeLevel,
  type PathBadgeLevel,
} from '../game/unit-building-bonuses';
import type { UnitCardCombatDisplay } from '../game/unit-card-stats';

export const PATH_BADGE_COLOR: Readonly<Record<1 | 2 | 3, string>> = {
  1: '#c9762c',
  2: '#9aa8b6',
  3: '#e8c84a',
};

export interface UnitCardStatusInput {
  /** % ścieżki B (parametry / koszary). */
  parametryPathPp?: number;
  /** % ścieżki A (pancerz / kuźnia). */
  pancerzPathPp?: number;
  veteranBadgeLabel?: string;
  veteranStarsTooltip?: string;
  veteranExperienceLine?: string;
  veteranPanelExplanation?: string;
  inGarnizon?: boolean;
  sentry?: boolean;
  ufortyfikowanyWPolu?: boolean;
  oblegaCityName?: string;
  esc: (raw: string) => string;
}

function formatCardStatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** C-UNIT-CARD-Q1=C — efektywna duża + baza małym (gdy różne). */
export function unitCardStatValueHtml(effective: number, base: number): string {
  const eff = formatCardStatNum(effective);
  const effRounded = Math.round(effective * 10);
  const baseRounded = Math.round(base * 10);
  if (effRounded === baseRounded) {
    return `<span class="uc-stat-eff">${eff}</span>`;
  }
  return `<span class="uc-stat-eff">${eff}</span>`
    + `<span class="uc-stat-base">baza ${formatCardStatNum(base)}</span>`;
}

export function unitCardAtkDefLineHtml(combat: UnitCardCombatDisplay): string {
  return `${unitCardStatValueHtml(combat.atakEffective, combat.atakBase)}`
    + ' / '
    + `${unitCardStatValueHtml(combat.obronaEffective, combat.obronaBase)}`;
}

export function pathBadgeChipHtml(
  icon: string,
  label: string,
  level: PathBadgeLevel,
  pct: number,
  esc: (raw: string) => string,
): string {
  if (level === 0) return '';
  const color = PATH_BADGE_COLOR[level];
  return `<span class="uc-path-badge" style="color:${color};font-weight:600;">`
    + `${icon} ${esc(label)} +${pct}%</span>`;
}

/** Wiersz koszary · kuźnia · weteran (kolejność OBOWIĄZKOWA). */
export function buildPathStatusRowHtml(input: UnitCardStatusInput): string {
  const esc = input.esc;
  const softPct = input.parametryPathPp ?? 0;
  const armorPct = input.pancerzPathPp ?? 0;
  const chips: string[] = [];

  const koszary = pathBadgeChipHtml(
    '🛡',
    'Koszary',
    softPathBadgeLevel({ parametryBonusProc: softPct }),
    softPct,
    esc,
  );
  if (koszary) chips.push(koszary);

  const kuznia = pathBadgeChipHtml(
    '⚒',
    'Kuźnia',
    armorPathBadgeLevel({ pancerzBonusProc: armorPct }),
    armorPct,
    esc,
  );
  if (kuznia) chips.push(kuznia);

  if (input.veteranBadgeLabel) {
    const tip = esc(input.veteranStarsTooltip ?? input.veteranBadgeLabel);
    chips.push(
      `<span class="uc-veteran-badge" style="color:#f4d35e;font-weight:600;" title="${tip}">`
        + `${esc(input.veteranBadgeLabel)}</span>`,
    );
  }

  if (chips.length === 0) return '';
  return `<div class="uc-path-status">${chips.join(' · ')}</div>`;
}

/** Czy wiersz ścieżek ma jakiekolwiek chipy (koszary/kuźnia/weteran). */
export function pathStatusRowHasChips(input: UnitCardStatusInput): boolean {
  const softPct = input.parametryPathPp ?? 0;
  const armorPct = input.pancerzPathPp ?? 0;
  if (softPathBadgeLevel({ parametryBonusProc: softPct }) > 0) return true;
  if (armorPathBadgeLevel({ pancerzBonusProc: armorPct }) > 0) return true;
  if (input.veteranBadgeLabel) return true;
  return false;
}

/** Garnizon, czuwaj, fortyfikacja w polu, oblężenie. */
export function buildUnitExtraStatusLinesHtml(input: UnitCardStatusInput): string {
  const esc = input.esc;
  const lines: string[] = [];
  if (input.inGarnizon) {
    lines.push(`<div class="uc-extra-status">Status: w garnizonie miasta</div>`);
  }
  if (input.sentry) {
    lines.push(`<div class="uc-extra-status">Status: czuwa (nie budzi się na ruch wroga)</div>`);
  }
  if (input.ufortyfikowanyWPolu) {
    lines.push(`<div class="uc-extra-status">Status: ufortyfikowana w polu</div>`);
  }
  if (input.oblegaCityName) {
    lines.push(`<div class="uc-extra-status">Status: oblega ${esc(input.oblegaCityName)}</div>`);
  }
  return lines.join('');
}

export function buildUnitVeteranEducationHtml(input: UnitCardStatusInput): string {
  const esc = input.esc;
  const parts: string[] = [];
  if (input.veteranExperienceLine) {
    parts.push(
      `<div class="uc-veteran-xp">${esc(input.veteranExperienceLine)}</div>`,
    );
  }
  if (input.veteranPanelExplanation) {
    parts.push(
      `<div class="uc-veteran-edu">${esc(input.veteranPanelExplanation)}</div>`,
    );
  }
  return parts.join('');
}

/** Pełna sekcja statusów (ścieżki + XP + edukacja + extra) — bez duplikatu buildingBonusLabel. */
export function buildUnitCardStatusSectionHtml(input: UnitCardStatusInput): string {
  const pathRow = buildPathStatusRowHtml(input);
  const vetEdu = buildUnitVeteranEducationHtml(input);
  const extra = buildUnitExtraStatusLinesHtml(input);
  return pathRow + vetEdu + extra;
}

export const UNIT_CARD_STATUS_CSS = `
.uc-path-status{margin:6px 0 0;font-size:0.72em;line-height:1.45;letter-spacing:.02em;}
.uc-path-badge,.uc-veteran-badge{white-space:nowrap;}
.uc-veteran-xp{margin:4px 0 0;font-size:0.68em;color:#c8b878;line-height:1.4;}
.uc-veteran-edu{margin:2px 0 0;font-size:0.65em;color:#a89868;line-height:1.4;}
.uc-extra-status{margin:3px 0 0;font-size:0.68em;color:var(--civ-text-muted,#8a8070);line-height:1.4;}
.uc-stat-eff{font-weight:700;color:var(--civ-text-primary,#e8e0c8);}
.uc-stat-base{font-weight:400;font-size:0.85em;color:var(--civ-text-muted,#8a8070);margin-left:4px;}
.uc-unit-head{display:flex;align-items:flex-start;gap:10px;margin-bottom:4px;}
.uc-unit-head .uc-owner-emblem{flex:0 0 auto;width:40px;height:40px;line-height:0;}
.uc-unit-head .uc-owner-emblem .dip-leader-medallion{width:40px;height:40px;}
.uc-unit-head .uc-owner-emblem.uc-owner-barb{display:flex;align-items:center;justify-content:center;
  width:40px;height:40px;border-radius:50%;border:2px solid rgba(180,60,60,.55);
  background:rgba(40,12,12,.75);color:#e07070;}
.uc-unit-head .uc-owner-emblem.uc-owner-barb svg{width:22px;height:22px;}
.uc-unit-head-info{flex:1;min-width:0;}
.uc-unit-head-info b{color:var(--civ-gold-primary,#e8d88a);font-size:13px;}
.uc-unit-head-sub{margin-top:2px;font-size:11px;color:var(--civ-text-muted,#a09880);line-height:1.35;}
`;
