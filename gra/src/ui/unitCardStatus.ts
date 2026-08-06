/**
 * unitCardStatus.ts — wspólny wiersz statusów karty jednostki (C-OBCE-JEDN-KARTA).
 * Kolejność ścieżek: koszary · kuźnia · weteran.
 */
import {
  armorPathBadgeLevel,
  softPathBadgeLevel,
  type PathBadgeLevel,
} from '../game/unit-building-bonuses';
import { veteranStarCount, type VeteranProgress } from '../game/veteran';
import type { UnitCardCombatDisplay } from '../game/unit-card-stats';
import { brandIconSvg } from './icons/brandAssets';
import { formatLiczbaPl } from './formatPl';

export const PATH_BADGE_COLOR: Readonly<Record<1 | 2 | 3, string>> = {
  1: '#c9762c',
  2: '#9aa8b6',
  3: '#e8c84a',
};

function pathBadgeColor(level: PathBadgeLevel): string {
  if (level === 0) return '#5a5040';
  return PATH_BADGE_COLOR[level];
}

/**
 * R-STATUS-PRZYCZYNA-CIERPIENIA-Q1=C (Maciej 2026-08-06) — komplet pól OBU
 * przyczyn cierpienia jednostki. Wydzielone do osobnego interfejsu, bo ten sam
 * zestaw wchodzi do trzech kart (panel jednostki, panel stosu, tooltip heksu)
 * i do `UnitCardStatusInput` — jedna definicja zamiast czterech kopii.
 */
export interface UnitSufferingStatusFields {
  /** Poziom trudności (etykieta PL: „łatwy” / „normalny” / „trudny”) — kontekst liczb. */
  poziomTrudnosciLabel?: string;
  /** GŁÓD WOJSKA — isArmyHungry(ownerId): zapasy Żywności państwa < 0 po koszcie armii. */
  glodWojska?: boolean;
  /** Mnożnik statów bojowych (bez pancerza) przy głodzie — econ-params `glod_wojska_stat_mult`. */
  glodWojskaStatMult?: number;
  /** Ułamek maxHP traconego co turę atrycji głodu — econ-params `glod_wojska_hp_frac`. */
  glodWojskaHpFrac?: number;
  /** Atrycja HP z głodu już trwa — isArmyStarving(ownerId). */
  glodWojskaAtrycjaAktywna?: boolean;
  /** Ile tur zostało do startu atrycji głodu — getArmyStarvationCountdown(); null = nie dotyczy. */
  glodWojskaTurDoAtrycji?: number | null;
  /** DEFICYT ZŁOTA — isGoldDeficit(ownerId): Skarbiec właściciela < 0 po zbankowaniu tury. */
  zlotoDeficyt?: boolean;
  /** Mnożnik statów bojowych (bez pancerza) przy deficycie — econ-params `zloto_deficyt_stat_mult`. */
  zlotoDeficytStatMult?: number;
  /** Ułamek maxHP traconego co turę atrycji deficytu — econ-params `zloto_deficyt_hp_frac`. */
  zlotoDeficytHpFrac?: number;
  /** Atrycja HP z deficytu Złota już trwa — isGoldDeficitStarving(ownerId). */
  zlotoDeficytAtrycjaAktywna?: boolean;
  /** Ile tur zostało do startu atrycji deficytu — getGoldDeficitCountdown(); null = nie dotyczy. */
  zlotoDeficytTurDoAtrycji?: number | null;
}

/** Przepisuje komplet pól cierpienia z dowolnego nośnika do wejścia karty. */
export function pickUnitSufferingFields(
  src: UnitSufferingStatusFields,
): UnitSufferingStatusFields {
  return {
    poziomTrudnosciLabel: src.poziomTrudnosciLabel,
    glodWojska: src.glodWojska,
    glodWojskaStatMult: src.glodWojskaStatMult,
    glodWojskaHpFrac: src.glodWojskaHpFrac,
    glodWojskaAtrycjaAktywna: src.glodWojskaAtrycjaAktywna,
    glodWojskaTurDoAtrycji: src.glodWojskaTurDoAtrycji,
    zlotoDeficyt: src.zlotoDeficyt,
    zlotoDeficytStatMult: src.zlotoDeficytStatMult,
    zlotoDeficytHpFrac: src.zlotoDeficytHpFrac,
    zlotoDeficytAtrycjaAktywna: src.zlotoDeficytAtrycjaAktywna,
    zlotoDeficytTurDoAtrycji: src.zlotoDeficytTurDoAtrycji,
  };
}

export interface UnitCardStatusInput extends UnitSufferingStatusFields {
  /** % ścieżki B (parametry / koszary). */
  parametryPathPp?: number;
  /** % ścieżki A (pancerz / kuźnia). */
  pancerzPathPp?: number;
  /** Doświadczenie bojowe (poziom 1–3) — opcjonalnie zamiast samej etykiety. */
  veteranProgress?: VeteranProgress | null;
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

function pathLevelDotsHtml(level: PathBadgeLevel | number, activeColor: string): string {
  const lvl = Math.max(0, Math.min(3, level));
  const dots = ([1, 2, 3] as const).map((i) => {
    const on = i <= lvl;
    return `<span class="uc-lvl-dot${on ? ' on' : ''}"${on ? ` style="color:${activeColor}"` : ''}>●</span>`;
  }).join('');
  return `<span class="uc-lvl-dots">${dots}</span>`;
}

function pathIconCell(iconHtml: string, dotsHtml: string, title: string): string {
  return `<span class="uc-path-icon" title="${title}">${iconHtml}${dotsHtml}</span>`;
}

/** Kompaktowy wiersz ikon: koszary · kuźnia · doświadczenie z poziomami 1-2-3. */
export function buildPathLevelIconsRowHtml(input: UnitCardStatusInput): string {
  const esc = input.esc;
  const softLvl = softPathBadgeLevel({ parametryBonusProc: input.parametryPathPp ?? 0 });
  const armorLvl = armorPathBadgeLevel({ pancerzBonusProc: input.pancerzPathPp ?? 0 });
  const vetStars = veteranStarCount(input.veteranProgress ?? null);

  const koszaryIc = brandIconSvg('bld-koszary', 16) || '🛡';
  const kuzniaIc = brandIconSvg('bld-kuznia', 16) || '⚒';
  const vetIc = '<span class="uc-vet-ic">★</span>';
  const vetTip = input.veteranStarsTooltip
    ? esc(input.veteranStarsTooltip)
    : 'Doświadczenie bojowe';

  const cells = [
    pathIconCell(
      `<span class="uc-path-ic">${koszaryIc}</span>`,
      pathLevelDotsHtml(softLvl, pathBadgeColor(softLvl)),
      'Wyszkolenie (koszary)',
    ),
    pathIconCell(
      `<span class="uc-path-ic">${kuzniaIc}</span>`,
      pathLevelDotsHtml(armorLvl, pathBadgeColor(armorLvl)),
      'Pancerz ścieżka (kuźnia)',
    ),
    pathIconCell(vetIc, pathLevelDotsHtml(vetStars, '#f4d35e'), vetTip),
  ];
  return `<div class="uc-path-icons-row">${cells.join('')}</div>`;
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

/** Odmiana „tura” po liczebniku: 1 turę / 2–4 tury / 5+ tur. */
function turyPl(n: number): string {
  if (n === 1) return '1 turę';
  const dziesiatki = n % 100;
  const jednosci = n % 10;
  const maloMnogie = jednosci >= 2 && jednosci <= 4 && !(dziesiatki >= 12 && dziesiatki <= 14);
  return `${n} ${maloMnogie ? 'tury' : 'tur'}`;
}

/**
 * R-STATUS-PRZYCZYNA-CIERPIENIA-Q1=C — jeden wiersz opisu przyczyny cierpienia.
 *
 * ZASADA WŁAŚCICIELA (CLAUDE.md): każda liczba ma NAZWANY parametr, jednostkę
 * i kontekst. Dlatego wiersz zawsze mówi CO jest mnożone / tracone, JAKI
 * parametr z `gra/data/econ-params.json` za to odpowiada, w JAKIEJ jednostce
 * i na JAKIM poziomie trudności.
 */
function sufferingStatusLineHtml(opts: {
  esc: (raw: string) => string;
  naglowek: string;
  przyczyna: string;
  statMult?: number;
  statMultParam: string;
  hpFrac?: number;
  hpFracParam: string;
  atrycjaAktywna?: boolean;
  turDoAtrycji?: number | null;
  poziomTrudnosciLabel?: string;
  klasa: string;
}): string {
  const esc = opts.esc;
  const czlony: string[] = [`${esc(opts.naglowek)} — ${esc(opts.przyczyna)}`];

  if (typeof opts.statMult === 'number' && opts.statMult > 0 && opts.statMult < 1) {
    const ubytekProc = formatLiczbaPl((1 - opts.statMult) * 100, 1);
    czlony.push(
      `Atak / Obrona / HP bojowe × ${formatLiczbaPl(opts.statMult, 2)}`
        + ` = −${ubytekProc}% wartości bojowej (bez Pancerza; parametr `
        + `<code>${esc(opts.statMultParam)}</code>, mnożnik)`,
    );
  }

  if (typeof opts.hpFrac === 'number' && opts.hpFrac > 0) {
    const procMaxHp = formatLiczbaPl(opts.hpFrac * 100, 1);
    const atrycja = `−${procMaxHp}% maxHP na turę`
      + ` (parametr <code>${esc(opts.hpFracParam)}</code>, ułamek maxHP)`;
    if (opts.atrycjaAktywna) {
      czlony.push(`atrycja HP TRWA: ${atrycja}`);
    } else if (typeof opts.turDoAtrycji === 'number' && opts.turDoAtrycji > 0) {
      czlony.push(`atrycja HP za ${turyPl(opts.turDoAtrycji)}: ${atrycja}`);
    } else {
      czlony.push(`po karencji atrycja HP: ${atrycja}`);
    }
  }

  // Kontekst liczb podany RAZ na końcu wiersza — parametry econ-params.json są
  // rozpisane per poziom trudności, więc bez tego nie wiadomo, których wartości
  // dotyczy wiersz (zasada „każda liczba ma parametr, jednostkę i kontekst”).
  const kontekst = opts.poziomTrudnosciLabel
    ? ` <span class="uc-suffer-ctx">wartości dla poziomu trudności: `
      + `${esc(opts.poziomTrudnosciLabel)}</span>`
    : '';

  return `<div class="uc-extra-status ${opts.klasa}">Status: ${czlony.join('; ')}.${kontekst}</div>`;
}

/** Garnizon, czuwaj, fortyfikacja w polu, oblężenie, głód wojska, deficyt Złota. */
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
    lines.push(`<div class="uc-extra-status">Status: ufortyfikowana w polu (+50% Obrony)</div>`);
  }
  if (input.oblegaCityName) {
    lines.push(`<div class="uc-extra-status">Status: oblega ${esc(input.oblegaCityName)}</div>`);
  }
  // R-STATUS-PRZYCZYNA-CIERPIENIA-Q1=C: przyczyny cierpienia — osobny wiersz na
  // każdą, dokładnie jak mapa daje osobną ikonę. Gdy obie aktywne — dwa wiersze.
  if (input.glodWojska) {
    lines.push(sufferingStatusLineHtml({
      esc,
      naglowek: 'głód wojska',
      przyczyna: 'zapasy Żywności państwa < 0 po koszcie armii',
      statMult: input.glodWojskaStatMult,
      statMultParam: 'glod_wojska_stat_mult',
      hpFrac: input.glodWojskaHpFrac,
      hpFracParam: 'glod_wojska_hp_frac',
      atrycjaAktywna: input.glodWojskaAtrycjaAktywna,
      turDoAtrycji: input.glodWojskaTurDoAtrycji,
      poziomTrudnosciLabel: input.poziomTrudnosciLabel,
      klasa: 'uc-suffer-glod',
    }));
  }
  if (input.zlotoDeficyt) {
    lines.push(sufferingStatusLineHtml({
      esc,
      naglowek: 'deficyt Złota',
      przyczyna: 'Skarbiec państwa < 0 po zbankowaniu tury',
      statMult: input.zlotoDeficytStatMult,
      statMultParam: 'zloto_deficyt_stat_mult',
      hpFrac: input.zlotoDeficytHpFrac,
      hpFracParam: 'zloto_deficyt_hp_frac',
      atrycjaAktywna: input.zlotoDeficytAtrycjaAktywna,
      turDoAtrycji: input.zlotoDeficytTurDoAtrycji,
      poziomTrudnosciLabel: input.poziomTrudnosciLabel,
      klasa: 'uc-suffer-zloto',
    }));
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
.uc-path-icons-row{display:flex;align-items:center;gap:12px;margin:8px 0 4px;flex-wrap:wrap;}
.uc-path-icon{display:inline-flex;align-items:center;gap:4px;font-size:11px;line-height:1;}
.uc-path-ic,.uc-vet-ic{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;}
.uc-path-ic svg{width:16px;height:16px;display:block;}
.uc-vet-ic{color:#f4d35e;font-size:13px;line-height:1;}
.uc-lvl-dots{display:inline-flex;gap:1px;font-size:8px;letter-spacing:0;}
.uc-lvl-dot{color:rgba(120,110,90,.45);}
.uc-lvl-dot.on{color:inherit;}
.uc-path-status{margin:6px 0 0;font-size:0.72em;line-height:1.45;letter-spacing:.02em;}
.uc-path-badge,.uc-veteran-badge{white-space:nowrap;}
.uc-veteran-xp{margin:4px 0 0;font-size:0.68em;color:#c8b878;line-height:1.4;}
.uc-veteran-edu{margin:2px 0 0;font-size:0.65em;color:#a89868;line-height:1.4;}
.uc-extra-status{margin:3px 0 0;font-size:0.68em;color:var(--civ-text-muted,#8a8070);line-height:1.4;}
/* R-STATUS-PRZYCZYNA-CIERPIENIA-Q1=C — kolory zgodne z ikonami na mapie:
   czerwień czaszki głodu (#e01e1e) i złoto przekreślonej monety (#e8c84a). */
.uc-extra-status.uc-suffer-glod{color:#e06a60;}
.uc-extra-status.uc-suffer-zloto{color:#e0bf5a;}
.uc-extra-status code{font-family:ui-monospace,Consolas,monospace;font-size:0.94em;opacity:.85;}
.uc-suffer-ctx{color:var(--civ-text-muted,#8a8070);opacity:.9;}
.uc-stat-eff{font-weight:700;color:var(--civ-text-primary,#e8e0c8);}
.uc-stat-base{font-weight:400;font-size:0.85em;color:var(--civ-text-muted,#8a8070);margin-left:4px;}
.uc-unit-head{display:flex;align-items:flex-start;gap:10px;margin-bottom:4px;}
.uc-unit-head .uc-owner-emblem{flex:0 0 auto;width:40px;height:40px;line-height:0;overflow:hidden;position:relative;}
.uc-unit-head .uc-owner-emblem .dip-leader-medallion{width:40px!important;height:40px!important;margin:0;
  overflow:hidden;border-width:2px;box-shadow:none!important;}
.uc-unit-head .uc-owner-emblem .dip-leader-ic{width:100%!important;height:100%!important;}
.uc-unit-head .uc-owner-emblem.uc-owner-barb{display:flex;align-items:center;justify-content:center;
  width:40px;height:40px;border-radius:50%;border:2px solid rgba(180,60,60,.55);
  background:rgba(40,12,12,.75);color:#e07070;}
.uc-unit-head .uc-owner-emblem.uc-owner-barb svg{width:22px;height:22px;}
.uc-unit-head-info{flex:1;min-width:0;}
.uc-unit-head-info b{color:var(--civ-gold-primary,#e8d88a);font-size:13px;}
.uc-unit-head-sub{margin-top:2px;font-size:11px;color:var(--civ-text-muted,#a09880);line-height:1.35;}
`;
