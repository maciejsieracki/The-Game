/**
 * hexContextTooltip.ts — treść panelu kontekstowego mapy (heks / jednostka, D17=A).
 */
import type { Hex } from '../types/hex';
import { Nakladka, TerenBazowy } from '../types/hex';
import { tileYield, type TileYield } from '../game/economy';
import {
  IMPROVEMENT_KEYS,
  improvementKeysForHex,
  improvementDisplayName,
  improvementBonusForKey,
  normalizeImprovementKey,
  type ImprovementBonus,
} from '../game/terrain-improvements';
import { galleryTerrainEligible } from '../map/improvement-build';
import type { ImprovementKey } from '../render/improvements';
import {
  hexDepositDisplayLabel,
  hexHiddenDepositHint,
  labelsForImprovementUnlock,
} from '../game/resource-access';
import { formatEntityDisplayName } from '../game/display-names';
import type { DaninaLabel } from '../game/danina-nazwa';
import {
  brandIconSvg,
  mapResourceIconSvg,
  terrainIconSvg,
} from './icons/brandAssets';

/** Ikona plonu jako inline-SVG (reskin emoji 🍞🔨💰🪵🪨 → brand). */
function yieldIconSvg(key: YieldKey): string {
  switch (key) {
    case 'zywnosc': return brandIconSvg('res-food', 16);
    case 'praca': return brandIconSvg('res-work', 16);
    case 'handel': return brandIconSvg('res-treasury', 16);
    case 'drewno': return mapResourceIconSvg('drewno', 16);
    case 'kamien': return mapResourceIconSvg('kamień', 16);
  }
}

/** Owija SVG plonu w span, by trzymał rozmiar i wyrównanie w linii tekstu. */
function yieldIconHtml(key: YieldKey): string {
  return `<span class="cp-yield-ic">${yieldIconSvg(key)}</span>`;
}

const TEREN_LABEL: Record<TerenBazowy, string> = {
  [TerenBazowy.Laka]: 'Łąka',
  [TerenBazowy.Rownina]: 'Równina',
  [TerenBazowy.Wzgorza]: 'Wzgórza',
  [TerenBazowy.Gory]: 'Góry',
  [TerenBazowy.Wybrzeze]: 'Wybrzeże',
  [TerenBazowy.Morze]: 'Morze',
  [TerenBazowy.Pustynia]: 'Pustynia',
  [TerenBazowy.Polarny]: 'Polarny',
};

type YieldKey = keyof Pick<TileYield, 'zywnosc' | 'praca' | 'handel' | 'drewno' | 'kamien'>;

/**
 * Decyzja Macieja (2026-07-27): plon heksu strumienia podatkowego (klucz silnika
 * `handel`) nazywa się zawsze **Podatek**. Etykieta może być przekazana przez
 * wolającego (main.ts) — domyślnie też "Podatek".
 */
const YIELD_ROWS: ReadonlyArray<{ key: YieldKey; label: string }> = [
  { key: 'zywnosc', label: 'Żywność' },
  { key: 'praca', label: 'Praca' },
  { key: 'handel', label: 'Podatek' },
  { key: 'drewno', label: 'Drewno' },
  { key: 'kamien', label: 'Kamień' },
];

const RIVER_BONUS: TileYield = { zywnosc: 3, praca: 2, handel: 2, drewno: 0, kamien: 0, glina: 0, ruda: 0, ruda_zelaza: 0 };
const FOREST_BONUS: TileYield = { zywnosc: -1, praca: 3, handel: -1, drewno: 3, kamien: 0, glina: 0, ruda: 0, ruda_zelaza: 0 };

function formatYieldLine(y: TileYield, empty = '—'): string {
  const parts: string[] = [];
  if ((y.zywnosc ?? 0) > 0) parts.push(`${yieldIconHtml('zywnosc')} ${y.zywnosc}`);
  if ((y.praca ?? 0) > 0) parts.push(`${yieldIconHtml('praca')} ${y.praca}`);
  if ((y.handel ?? 0) > 0) parts.push(`${yieldIconHtml('handel')} ${y.handel}`);
  if ((y.drewno ?? 0) > 0) parts.push(`${yieldIconHtml('drewno')} ${y.drewno}`);
  if ((y.kamien ?? 0) > 0) parts.push(`${yieldIconHtml('kamien')} ${y.kamien}`);
  return parts.length ? parts.join(' · ') : empty;
}

function bonusToTileYield(b: ImprovementBonus): TileYield {
  return {
    zywnosc: b.zywnosc ?? 0,
    praca: b.praca ?? 0,
    handel: (b.handel ?? 0) + (b.pieniadz ?? 0),
    drewno: b.drewno ?? 0,
    kamien: b.kamien ?? 0,
    glina: b.glina ?? 0,
    ruda: 0,
    ruda_zelaza: 0,
  };
}

function formatBonusParts(b: ImprovementBonus): string {
  return formatYieldLine(bonusToTileYield(b), '—');
}

function subLine(label: string, value: string): string {
  return `<div class="cp-sub"><span class="cp-lbl">${label}:</span> ${value}</div>`;
}

function yieldDetailLine(label: string, value: string): string {
  return `<div class="cp-yield-row"><span class="cp-yield-lbl">${label}</span> ${value}</div>`;
}

function builtImprovementKeys(hex: Hex): string[] {
  return improvementKeysForHex(hex);
}

function terrainBaseYield(hex: Hex): TileYield {
  return tileYield({
    terenBazowy: hex.terenBazowy,
    nakladka: Nakladka.Brak,
    maRzeke: false,
  });
}

function fullTileYield(hex: Hex): TileYield {
  return tileYield({
    terenBazowy: hex.terenBazowy,
    nakladka: hex.nakladka ?? Nakladka.Brak,
    maRzeke: !!(hex.rzeka && hex.rzeka.obecna),
    ulepszeniaKeys: improvementKeysForHex(hex),
  });
}

interface YieldPart {
  label: string;
  delta: TileYield;
}

/** Składowe plonów — teren, las, rzeka, ulepszenia / złoża hodowlane. */
function yieldParts(hex: Hex): YieldPart[] {
  const parts: YieldPart[] = [
    { label: 'teren bazowy', delta: terrainBaseYield(hex) },
  ];
  if (hex.nakladka === Nakladka.Las) {
    parts.push({ label: 'las', delta: { ...FOREST_BONUS } });
  }
  if (hex.rzeka?.obecna) {
    parts.push({ label: 'rzeka', delta: { ...RIVER_BONUS } });
  }
  const builtSet = new Set(builtImprovementKeys(hex));
  for (const key of improvementKeysForHex(hex)) {
    const bonus = bonusToTileYield(improvementBonusForKey(key));
    const hasBonus = YIELD_ROWS.some(({ key: yk }) => (bonus[yk] ?? 0) !== 0);
    if (!hasBonus) continue;
    const name = improvementDisplayName(key);
    const tag = builtSet.has(key) ? 'postawione' : 'złoże / hodowla';
    parts.push({ label: `${name} (${tag})`, delta: bonus });
  }
  return parts;
}

/** Rozbicie per typ surowca: baza + modyfikatory = suma. */
function formatYieldBreakdownHtml(
  hex: Hex,
  rows: ReadonlyArray<{ key: YieldKey; label: string }> = YIELD_ROWS,
): string {
  const parts = yieldParts(hex);
  const total = fullTileYield(hex);
  const lines: string[] = [];

  for (const { key, label } of rows) {
    const icon = yieldIconHtml(key);
    const baseVal = parts[0]?.delta[key] ?? 0;
    const mods = parts.slice(1)
      .map(p => ({ label: p.label, v: p.delta[key] ?? 0 }))
      .filter(m => m.v !== 0);
    const sumVal = total[key] ?? 0;
    if (sumVal === 0 && baseVal === 0 && mods.length === 0) continue;

    let text = `<b>${sumVal}</b>`;
    text += ` <span class="cp-yield-detail">(${icon} ${label}: ${baseVal}`;
    for (const m of mods) {
      text += ` ${m.v > 0 ? '+' : ''}${m.v} ${m.label}`;
    }
    text += ')</span>';
    lines.push(yieldDetailLine(`${icon} ${label}`, text));
  }

  if (lines.length === 0) {
    return yieldDetailLine('Plony', '0 — nieużyteczne');
  }
  return lines.join('');
}

function collectResourceLabels(hex: Hex, era: number): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (label: string): void => {
    const k = label.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(label);
  };

  const deposit = hexDepositDisplayLabel(hex, era);
  if (deposit) push(deposit);

  const hidden = hexHiddenDepositHint(hex, era);
  if (hidden) push(hidden);

  for (const key of improvementKeysForHex(hex)) {
    for (const u of labelsForImprovementUnlock(key)) push(u);
  }

  if (hex.nakladka === Nakladka.Las) push('Las (drewno)');
  if (hex.rzeka?.obecna) push('Rzeka');

  return out;
}

/** Ulepszenia możliwe na tym terenie (bez bramki tech — podgląd mapy). */
function listTerrainPossibleImprovements(hex: Hex): string[] {
  const active = new Set(improvementKeysForHex(hex));
  const teren = hex.terenBazowy;
  const out: string[] = [];
  for (const key of IMPROVEMENT_KEYS) {
    if (active.has(key)) continue;
    if (!galleryTerrainEligible(key as ImprovementKey, teren)) continue;
    if (key === 'bydlo' && hex.nakladka !== Nakladka.ZlozeBydla) continue;
    if (key === 'owce' && hex.nakladka !== Nakladka.ZlozeOwiec) continue;
    if (key === 'lama' && hex.nakladka !== Nakladka.ZlozeLamy) continue;
    const bonus = formatBonusParts(improvementBonusForKey(key));
    const unlocks = labelsForImprovementUnlock(key);
    let line = `<b>${improvementDisplayName(key)}</b> → ${bonus}`;
    if (unlocks.length) line += ` · odblok. ${unlocks.join(', ')}`;
    out.push(line);
    if (out.length >= 10) break;
  }
  return out;
}

export interface HexContextTooltipInput {
  q: number;
  r: number;
  hex: Hex;
  cityName?: string | null;
  /** Miasto-państwo klastra — dopisek w etykiecie (Maciej 2026-07-07). */
  cityIsCityState?: boolean;
  /** Etykieta cywilizacji właściciela (obce miasto). */
  cityOwnerLabel?: string | null;
  /** Ludność miasta (gdy znana z odkrycia). */
  cityPopulation?: number | null;
  currentEra?: number;
  /**
   * Etykieta strumienia podatkowego (zawsze "Podatek" od 2026-07-27); opcjonalna
   * dla kompatybilności wołających.
   */
  daninaLabel?: DaninaLabel;
  esc: (raw: string) => string;
}

export function buildHexContextTooltipHtml(input: HexContextTooltipInput): string {
  const { q, r, hex, esc, cityName } = input;
  const era = input.currentEra ?? 99;
  const yieldRows = YIELD_ROWS;
  const teren = TEREN_LABEL[hex.terenBazowy] ?? esc(String(hex.terenBazowy));
  const resources = collectResourceLabels(hex, era);
  const built = builtImprovementKeys(hex);
  const implicitKeys = improvementKeysForHex(hex).filter(k => !built.includes(k));
  const possible = listTerrainPossibleImprovements(hex);

  const lines: string[] = [];

  const terrainIc = `<span class="cp-terrain-ic">${terrainIconSvg(String(hex.terenBazowy), 18)}</span>`;
  lines.push(`<div class="cp-hero-names">${terrainIc}${esc(teren)}</div>`);
  lines.push(`<div class="cp-hero-sub">heks (${q}, ${r})</div>`);

  if (resources.length > 0) {
    const withIcons = resources.map((r) => {
      const ic = `<span class="cp-res-ic">${mapResourceIconSvg(r, 16)}</span>`;
      return `${ic}${esc(r)}`;
    });
    lines.push(subLine('Surowce / zasoby', withIcons.join(' · ')));
  } else {
    lines.push(subLine('Surowce / zasoby', 'brak złoża'));
  }

  if (built.length > 0) {
    const builtDesc = built.map((key) => {
      const name = esc(improvementDisplayName(key));
      const bonus = formatBonusParts(improvementBonusForKey(key));
      const unlocks = labelsForImprovementUnlock(key);
      let s = `<b>${name}</b> → ${bonus}`;
      if (unlocks.length) s += ` · ${esc(unlocks.join(', '))}`;
      return s;
    }).join('<br>');
    lines.push(subLine('Ulepszenia postawione', builtDesc));
  }

  if (implicitKeys.length > 0) {
    const impDesc = implicitKeys.map((key) => {
      const name = esc(improvementDisplayName(key));
      const bonus = formatBonusParts(improvementBonusForKey(key));
      return `<b>${name}</b> (naturalne) → ${bonus}`;
    }).join('<br>');
    lines.push(subLine('Hodowla / złoże aktywne', impDesc));
  }

  if (built.length === 0 && implicitKeys.length === 0) {
    lines.push(subLine('Ulepszenie', 'brak — goły teren'));
  }

  lines.push('<div class="cp-yield-head">Plony — rozbicie</div>');
  lines.push(formatYieldBreakdownHtml(hex, yieldRows));
  lines.push(`<div class="cp-total">Razem: ${formatYieldLine(fullTileYield(hex), '0')}</div>`);

  if (possible.length > 0) {
    lines.push('<div class="cp-yield-head">Możliwe ulepszenia (teren)</div>');
    for (const p of possible) {
      lines.push(`<div class="cp-sub cp-possible">${p}</div>`);
    }
  }

  if (cityName) {
    const label = formatEntityDisplayName({ baseName: cityName, isCityState: input.cityIsCityState });
    lines.push(subLine('Miasto', esc(label)));
    if (input.cityOwnerLabel) {
      lines.push(subLine('Właściciel', esc(input.cityOwnerLabel)));
    }
    if (input.cityPopulation != null) {
      lines.push(subLine('Ludność', String(Math.round(input.cityPopulation))));
    }
  }

  return lines.join('');
}

import {
  buildPathStatusRowHtml,
  buildUnitExtraStatusLinesHtml,
  buildUnitVeteranEducationHtml,
  pathStatusRowHasChips,
  unitCardAtkDefLineHtml,
  unitCardStatValueHtml,
  type UnitCardStatusInput,
} from './unitCardStatus';
import type { UnitCardCombatDisplay } from '../game/unit-card-stats';

export interface UnitContextTooltipInput {
  displayName: string;
  /** Medalion portretu / sygnet właściciela (C-OBCE-JEDN-Q2). */
  ownerEmblemHtml?: string;
  q: number;
  r: number;
  ruchLeft: number;
  ruchMax: number;
  /** Efektywne staty bojowe (C-UNIT-CARD-Q1–Q3). */
  combat: UnitCardCombatDisplay;
  hp?: number;
  category?: string;
  inGarnizon?: boolean;
  /** Właściciel (obca jednostka) — etykieta cywilizacji / miasta-państwa. */
  ownerLabel?: string;
  /** Status relacji gracza z właścicielem (obca jednostka). */
  relationLabel?: string;
  /** Tylko odczyt — ukrywa ruch (podgląd obcej jednostki). */
  readOnly?: boolean;
  /**
   * Sciezki ulepszen jednostek (2026-07-25, game/unit-building-bonuses.ts):
   * etykieta typu "Pancerz +30% · Parametry +20%" (unitBuildingBonusLabel()),
   * lub pusty string / undefined gdy jednostka nie zdobyla jeszcze zadnego
   * bonusu budynkowego. Pokazuje graczowi SKAD wynikaja podniesione staty.
   */
  buildingBonusLabel?: string;
  /** % ścieżki B (parametry) — do ikon koszar w wierszu statusów. */
  parametryPathPp?: number;
  /** % ścieżki A (pancerz) — do ikon kuźni w wierszu statusów. */
  pancerzPathPp?: number;
  /**
   * TRZECI SYSTEM -- doświadczenie bojowe / weterani (2026-07-25,
   * game/veteran.ts). Etykieta gotowa z veteranBadgeLabel(), np.
   * "★★ Doświadczony +10%" / "★★★ Weteran +20%"; undefined/pusty string na
   * poziomie 1 (Rekrut, brak odznaki -- świadomie, patrz veteran.ts).
   * Renderowana OSOBNĄ linią, złotym stylem inline -- WIZUALNIE ODRÓŻNIALNA
   * od buildingBonusLabel (odznaki budynkowe: kropki + kolorowa obwódka na
   * żetonie, tekst "Pancerz +X% · Parametry +Y%" bez specjalnego koloru tutaj).
   */
  veteranBadgeLabel?: string;
  /** Krótki tooltip na ★ (title HTML). */
  veteranStarsTooltip?: string;
  /**
   * C-OBCE-JEDN-Q3 B — pełniejsze wyjaśnienie do karty obcej jednostki (Q1).
   * Gdy brak — buildUnitContextTooltipHtml samo nie pokazuje bloku edukacji.
   */
  veteranPanelExplanation?: string;
  /** Linia doświadczenia bojowego (veteranExperienceLine). */
  veteranExperienceLine?: string;
  sentry?: boolean;
  ufortyfikowanyWPolu?: boolean;
  oblegaCityName?: string;
  esc: (raw: string) => string;
}

function formatCardHp(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function unitCardStatusFromTooltip(u: UnitContextTooltipInput): UnitCardStatusInput {
  return {
    parametryPathPp: u.parametryPathPp,
    pancerzPathPp: u.pancerzPathPp,
    veteranBadgeLabel: u.veteranBadgeLabel,
    veteranStarsTooltip: u.veteranStarsTooltip,
    veteranExperienceLine: u.veteranExperienceLine,
    veteranPanelExplanation: u.veteranPanelExplanation,
    inGarnizon: u.inGarnizon,
    sentry: u.sentry,
    ufortyfikowanyWPolu: u.ufortyfikowanyWPolu,
    oblegaCityName: u.oblegaCityName,
    esc: u.esc,
  };
}

function buildUnitHeadHtml(u: UnitContextTooltipInput): string {
  const subs: string[] = [];
  if (u.ownerLabel) subs.push(`Właściciel: ${u.esc(u.ownerLabel)}`);
  if (u.relationLabel) subs.push(`Relacja: ${u.esc(u.relationLabel)}`);
  const subHtml = subs.length
    ? `<div class="uc-unit-head-sub">${subs.join(' · ')}</div>`
    : '';
  const emblem = u.ownerEmblemHtml
    ? `<span class="uc-owner-emblem">${u.ownerEmblemHtml}</span>`
    : '';
  return `<div class="uc-unit-head cp-unit-head">${emblem}`
    + `<div class="uc-unit-head-info"><b>${u.esc(u.displayName)}</b>${subHtml}</div></div>`;
}

export function buildUnitContextTooltipHtml(u: UnitContextTooltipInput): string {
  const statusInput = unitCardStatusFromTooltip(u);
  const pathRow = buildPathStatusRowHtml(statusInput);
  const hasPathChips = pathStatusRowHasChips(statusInput);

  const lines: string[] = [buildUnitHeadHtml(u)];

  if (u.hp != null && u.combat.hpMaxEffective > 0) {
    const hpLine = `${Math.round(u.hp)}/${formatCardHp(u.combat.hpMaxEffective)}`
      + (u.combat.hpMaxEffective !== u.combat.hpMaxBase
        ? ` <span class="uc-stat-base">(baza ${formatCardHp(u.combat.hpMaxBase)})</span>`
        : '');
    lines.push(subLine('Punkty życia', hpLine));
  }
  lines.push(subLine('Atak / obrona', unitCardAtkDefLineHtml(u.combat)));
  lines.push(subLine('Pancerz', unitCardStatValueHtml(u.combat.pancerzEffective, u.combat.pancerzBase)));
  if (!u.readOnly) {
    lines.push(subLine('Ruch', `${u.ruchLeft}/${u.ruchMax}`));
  }

  if (pathRow) {
    lines.push(`<div class="cp-sub">${pathRow}</div>`);
  } else if (u.veteranBadgeLabel) {
    const tip = u.esc(u.veteranStarsTooltip ?? u.veteranBadgeLabel);
    lines.push(
      `<div class="cp-sub uc-veteran-badge" style="color:#f4d35e;font-weight:600;" title="${tip}">`
        + `${u.esc(u.veteranBadgeLabel)}</div>`,
    );
  }

  const vetEdu = buildUnitVeteranEducationHtml(statusInput);
  if (vetEdu) lines.push(`<div class="cp-sub">${vetEdu}</div>`);

  const extra = buildUnitExtraStatusLinesHtml(statusInput);
  if (extra) lines.push(`<div class="cp-sub">${extra}</div>`);

  if (u.buildingBonusLabel && !hasPathChips) {
    lines.push(subLine('Ulepszenia (budynki)', u.esc(u.buildingBonusLabel)));
  }

  return lines.join('');
}
