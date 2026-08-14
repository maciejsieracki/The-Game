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
  isImprovementAllowedForCiv,
  territoryResourceYieldForImprovement,
  type ImprovementBonus,
  type TerritoryResourceKey,
} from '../game/terrain-improvements';
import {
  galleryTerrainEligible,
  hexHasClayDeposit,
  isFarmBaseTerrain,
  isImprovementBlockedOnForest,
  hasAnimalDeposit,
} from '../map/improvement-build';
import type { ImprovementKey } from '../render/improvements';
// R-ZETON-PASKI (Maciej 2026-07-29): kolory pasków Zdrowia i Ruchu były tu
// wpisane na sztywno w CSS. Wyciągnięte do JEDNEGO źródła prawdy, bo te same
// barwy niesie teraz tabliczka nad żetonem na mapie (render/unitStatPlate.ts) —
// „żeby mapa i panel nie mogły się rozjechać”. Moduł to czyste stałe, nie
// wciąga do UI ani grama THREE.
import {
  VITALS_HP_DARK_CSS,
  VITALS_HP_FULL_CSS,
  VITALS_MOVE_DARK_CSS,
  VITALS_MOVE_FULL_CSS,
} from '../render/unitVitalsPalette';
import {
  hexDepositDisplayLabel,
  hexHiddenDepositHint,
  labelsForImprovementUnlock,
} from '../game/resource-access';
import { isLamaDepositVisibleForCiv } from '../game/livestock-unlock';
import { formatEntityDisplayName } from '../game/display-names';
import type { DaninaLabel } from '../game/danina-nazwa';
import type { UnitCardCombatDisplay } from '../game/unit-card-stats';
import { fieldPower } from '../game/unit-power';
import type { VeteranProgress } from '../game/veteran';
import {
  buildPathLevelIconsRowHtml,
  buildUnitExtraStatusLinesHtml,
  buildUnitVeteranEducationHtml,
  pathStatusRowHasChips,
  unitCardAtkDefLineHtml,
  unitCardStatValueHtml,
  UNIT_CARD_STATUS_CSS,
  pickUnitSufferingFields,
  type UnitCardStatusInput,
  type UnitSufferingStatusFields,
} from './unitCardStatus';
import type { UnitPanelAction } from './unitPanelHud';
import { buildUnitActionBarHtml, UNIT_ACTION_BAR_CSS } from './unitActionBarHtml';
import {
  brandIconSvg,
  mapResourceIconSvg,
  terrainIconSvg,
  unitIconSvg,
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

type CityYieldKey = keyof Pick<TileYield, 'zywnosc' | 'praca' | 'handel'>;
type MagazynYieldKey = keyof Pick<TileYield, 'drewno' | 'kamien'>;
type YieldKey = CityYieldKey | MagazynYieldKey;

/**
 * Decyzja Macieja (2026-07-27): plon heksu strumienia podatkowego (klucz silnika
 * `handel`) nazywa się zawsze **Podatek**. Etykieta może być przekazana przez
 * wolającego (main.ts) — domyślnie też "Podatek".
 *
 * SUROW-TERYT-01: Żywność/Praca/Podatek → ekonomia miasta (workedTiles).
 * Magazyn państwa → ulepszenia `surowiec_ilosc_tura` (auto, bez 👤) PLUS drewno/kamień/
 * glina z tileYield na heksach obrabianych (centrum + 👤) — R-HEX-PLONY-MAGAZYN B.
 */
const CITY_YIELD_ROWS: ReadonlyArray<{ key: CityYieldKey; label: string }> = [
  { key: 'zywnosc', label: 'Żywność' },
  { key: 'praca', label: 'Praca' },
  { key: 'handel', label: 'Podatek' },
];

const RIVER_BONUS: TileYield = { zywnosc: 3, praca: 2, handel: 2, drewno: 0, kamien: 0, glina: 2, ruda: 0, ruda_zelaza: 0 };
const FOREST_BONUS: TileYield = { zywnosc: -1, praca: 3, handel: -1, drewno: 3, kamien: 0, glina: 0, ruda: 0, ruda_zelaza: 0 };

/** Etykiety surowców magazynowych (SUROW-TERYT-01 — `surowiec_ilosc_tura`). */
const TERRITORY_RESOURCE_LABEL: Record<TerritoryResourceKey, string> = {
  drewno: 'Drewno',
  kamien: 'Kamień',
  glina: 'Glina',
  ruda: 'Ruda',
  ruda_zelaza: 'Ruda żelaza',
  ruda_cyny: 'Ruda cyny',
  sol: 'Sól',
  zloto: 'Złoto',
  kon: 'Koń',
};

function territoryResourceIconHtml(key: TerritoryResourceKey): string {
  return `<span class="cp-yield-ic">${mapResourceIconSvg(key, 16)}</span>`;
}

/** Magazyn państwa z ulepszenia (automatycznie, bez 👤). */
function formatTerritoryMagazynPart(key: string, zloze?: string | null): string | null {
  const row = territoryResourceYieldForImprovement(key, zloze);
  if (!row || !(row.amount > 0)) return null;
  const label = TERRITORY_RESOURCE_LABEL[row.resourceKey];
  const icon = territoryResourceIconHtml(row.resourceKey);
  return `${icon} +${row.amount} ${label}/t`;
}

/** Plony magazynowe z terenu (tileYield) — przy 👤 lub centrum miasta (R-HEX-PLONY-MAGAZYN B). */
function formatTerrainMagazynWorkedPart(
  key: 'drewno' | 'kamien' | 'glina',
  amount: number,
): string | null {
  if (!(amount > 0)) return null;
  const label = TERRITORY_RESOURCE_LABEL[key];
  const icon = territoryResourceIconHtml(key);
  return `${icon} +${amount} ${label}/t · przy 👤`;
}

/** Drewno/kamień z terrain-yields — trafia do magazynu przy obrabianiu pola. */
function formatTerrainMagazynWorkedNotes(hex: Hex): string[] {
  const y = fullTileYield(hex);
  const notes: string[] = [];
  const drewno = formatTerrainMagazynWorkedPart('drewno', y.drewno ?? 0);
  if (drewno) notes.push(drewno);
  const kamien = formatTerrainMagazynWorkedPart('kamien', y.kamien ?? 0);
  if (kamien) notes.push(kamien);
  const glina = formatTerrainMagazynWorkedPart('glina', y.glina ?? 0);
  if (glina) notes.push(glina);
  return notes;
}

function formatImprovementDesc(
  key: string,
  hex: Hex,
  esc: (raw: string) => string,
  tag?: string,
): string {
  const name = esc(improvementDisplayName(key));
  const bonus = formatCityBonusParts(improvementBonusForKey(key));
  const mag = formatTerritoryMagazynPart(key, (hex as { zloze?: string }).zloze);
  const unlocks = labelsForImprovementUnlock(key);
  let s = `<b>${name}</b>`;
  if (tag) s += ` (${esc(tag)})`;
  s += ` → plony miasta: ${bonus}`;
  if (mag) {
    s += `<br><span class="cp-magazyn-line">magazyn państwa: ${mag} · bez 👤</span>`;
  }
  if (unlocks.length) s += ` · ${esc(unlocks.join(', '))}`;
  return s;
}

/** Podsumowanie wpływu do magazynu państwa z tego heksa (tylko ulepszenia SUROW-TERYT-01). */
function formatHexMagazynSummary(hex: Hex, esc: (raw: string) => string): string | null {
  const lines: string[] = [];

  for (const key of builtImprovementKeys(hex)) {
    const mag = formatTerritoryMagazynPart(key, (hex as { zloze?: string }).zloze);
    if (!mag) continue;
    lines.push(`${esc(improvementDisplayName(key))}: ${mag} · automatycznie`);
  }

  return lines.length ? lines.join('<br>') : null;
}

function formatCityYieldLine(y: TileYield, empty = '—'): string {
  const parts: string[] = [];
  if ((y.zywnosc ?? 0) > 0) parts.push(`${yieldIconHtml('zywnosc')} ${y.zywnosc}`);
  if ((y.praca ?? 0) > 0) parts.push(`${yieldIconHtml('praca')} ${y.praca}`);
  if ((y.handel ?? 0) > 0) parts.push(`${yieldIconHtml('handel')} ${y.handel}`);
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

function formatCityBonusParts(b: ImprovementBonus): string {
  return formatCityYieldLine(bonusToTileYield(b), '—');
}

function cityYieldOnly(y: TileYield): TileYield {
  return {
    zywnosc: y.zywnosc ?? 0,
    praca: y.praca ?? 0,
    handel: y.handel ?? 0,
    drewno: 0,
    kamien: 0,
    glina: 0,
    ruda: 0,
    ruda_zelaza: 0,
  };
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
    zloze: (hex as { zloze?: string }).zloze,
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
    const bonus = cityYieldOnly(bonusToTileYield(improvementBonusForKey(key)));
    const hasBonus = CITY_YIELD_ROWS.some(({ key: yk }) => (bonus[yk] ?? 0) !== 0);
    if (!hasBonus) continue;
    const name = improvementDisplayName(key);
    const tag = builtSet.has(key) ? 'postawione' : 'złoże / hodowla';
    parts.push({ label: `${name} (${tag})`, delta: bonus });
  }
  return parts;
}

/** Rozbicie plonów miasta: baza + modyfikatory = suma (tylko Żywność/Praca/Podatek). */
function formatCityYieldBreakdownHtml(hex: Hex): string {
  const parts = yieldParts(hex);
  const total = cityYieldOnly(fullTileYield(hex));
  const lines: string[] = [];

  for (const { key, label } of CITY_YIELD_ROWS) {
    const icon = yieldIconHtml(key);
    const baseVal = cityYieldOnly(parts[0]?.delta ?? { zywnosc: 0, praca: 0, handel: 0, drewno: 0, kamien: 0, glina: 0, ruda: 0, ruda_zelaza: 0 })[key] ?? 0;
    const mods = parts.slice(1)
      .map(p => ({ label: p.label, v: cityYieldOnly(p.delta)[key] ?? 0 }))
      .filter(m => m.v !== 0);
    const sumVal = total[key] ?? 0;
    if (sumVal === 0 && baseVal === 0 && mods.length === 0) continue;

    let text = `<b>${sumVal}</b>`;
    text += ` <span class="cp-yield-detail">(${icon} ${label}: ${baseVal}`;
    for (const m of mods) {
      text += ` ${m.v > 0 ? '+' : ''}${m.v} ${m.label}`;
    }
    text += ' · przy 👤)</span>';
    lines.push(yieldDetailLine(`${icon} ${label}`, text));
  }

  if (lines.length === 0) {
    return yieldDetailLine('Plony', '0 — nieużyteczne');
  }
  return lines.join('');
}

function collectResourceLabels(hex: Hex, era: number, playerCivType?: string | null): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (label: string): void => {
    const k = label.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(label);
  };

  if (hex.nakladka === Nakladka.ZlozeLamy && !isLamaDepositVisibleForCiv(playerCivType)) {
    // Lama — tylko cywilizacje andyjskie (Inkowie / Astekowie).
  } else {
    const deposit = hexDepositDisplayLabel(hex, era);
    if (deposit) push(deposit);

    const hidden = hexHiddenDepositHint(hex, era);
    if (hidden) push(hidden);
  }

  for (const key of improvementKeysForHex(hex)) {
    for (const u of labelsForImprovementUnlock(key)) push(u);
  }

  if (hex.nakladka === Nakladka.Las) push('Las (drewno)');
  if (hex.rzeka?.obecna) push('Rzeka');

  return out;
}

/**
 * Ulepszenia możliwe na tym terenie (bez bramki tech/terytorium — podgląd mapy).
 *
 * P-HEX-TOOLTIP-MOZLIWE-ULEPSZENIA-BRAK-FILTRA-ZLOZA (Maciej 2026-08-14): sam teren bazowy
 * (`galleryTerrainEligible`) to za mało — wiele ulepszeń wymaga też konkretnej nakładki/złoża
 * NA TYM heksie (Las/glina/ruda/sól/żelazo/miedź/złoto/cyna/zwierzę), nie tylko pasującego
 * terenu. Sprawdzenia niżej są lustrzanym odbiciem (wyłącznie części hex-property, bez
 * terytorium/tech/stanu gracza) `createQualifier()`/`qualifies()` w `map/improvement-build.ts`
 * — jedynego autorytatywnego źródła tej logiki. Nie duplikuj warunków ręcznie tam, gdzie
 * istnieje eksportowana funkcja (hexHasClayDeposit, isFarmBaseTerrain,
 * isImprovementBlockedOnForest, hasAnimalDeposit) — reużyj.
 * EN: base terrain alone is not enough — many improvements also require a specific
 * overlay/deposit ON THIS hex (forest/clay/ore/salt/iron/copper/gold/tin/animal), not just a
 * matching terrain type. The checks below mirror (hex-property parts only, no
 * territory/tech/player-state) `createQualifier()`/`qualifies()` in `map/improvement-build.ts`
 * — the one authoritative source for this logic. Reuse the exported helpers instead of
 * duplicating conditions by hand.
 */
function listTerrainPossibleImprovements(hex: Hex, playerCivType?: string | null): string[] {
  const active = new Set(improvementKeysForHex(hex));
  const teren = hex.terenBazowy;
  const nakladka = hex.nakladka;
  const zloze = (hex as { zloze?: string }).zloze;
  const out: string[] = [];
  for (const key of IMPROVEMENT_KEYS) {
    if (active.has(key)) continue;
    if (!isImprovementAllowedForCiv(key, playerCivType)) continue;
    if (!galleryTerrainEligible(key as ImprovementKey, teren)) continue;
    // Ulepszenia zablokowane pod lasem (irygacja/tarasy — trzeba najpierw wyrąbać);
    // tartak/wyrąb/glinianka/obóz łowiecki/farma MOGĄ stać na Lesie — wyjątki żyją w tej funkcji.
    if (isImprovementBlockedOnForest(key, nakladka)) continue;
    if (key === 'bydlo' && nakladka !== Nakladka.ZlozeBydla) continue;
    if (key === 'owce' && nakladka !== Nakladka.ZlozeOwiec) continue;
    if (key === 'lama' && nakladka !== Nakladka.ZlozeLamy) continue;
    if (key === 'farma' && !isFarmBaseTerrain(teren, nakladka)) continue;
    if (key === 'tartak' && nakladka !== Nakladka.Las) continue;
    if (key === 'wyrab' && nakladka !== Nakladka.Las) continue;
    if (key === 'glinianka' && !hexHasClayDeposit(hex)) continue;
    if (key === 'oboz_lowiecki' && nakladka !== Nakladka.Las && !hasAnimalDeposit(nakladka)) continue;
    if (key === 'warzelnia_soli' && teren !== TerenBazowy.Wybrzeze && zloze !== 'sol') continue;
    if (key === 'kopalnia_zelaza' && zloze !== 'zelazo') continue;
    if (key === 'kopalnia_miedzi'
      && zloze !== 'miedz' && nakladka !== Nakladka.ZlozeRudy && zloze !== 'ruda') continue;
    if (key === 'kopalnia_zlota' && zloze !== 'zloto') continue;
    if (key === 'kopalnia_cyny' && zloze !== 'cyna') continue;
    const bonus = formatCityBonusParts(improvementBonusForKey(key));
    const mag = formatTerritoryMagazynPart(key);
    const unlocks = labelsForImprovementUnlock(key);
    let line = `<b>${improvementDisplayName(key)}</b> → plony miasta: ${bonus}`;
    if (mag) line += ` · magazyn państwa: ${mag} · bez 👤`;
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
  /** typCywilizacji gracza — bramka widoczności lamy. */
  playerCivType?: string | null;
  /**
   * R-HEX-PLONY-MAGAZYN B: plony drewno/kamień/glina z terenu trafiają do magazynu
   * tylko przy 👤 (lub centrum miasta). Bez tego — nie pokazuj „przy 👤" na gołym heksie.
   */
  hexWorkedForMagazyn?: boolean;
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
  const teren = TEREN_LABEL[hex.terenBazowy] ?? esc(String(hex.terenBazowy));
  const resources = collectResourceLabels(hex, era, input.playerCivType);
  const built = builtImprovementKeys(hex);
  const implicitKeys = improvementKeysForHex(hex).filter(k => !built.includes(k));
  const possible = listTerrainPossibleImprovements(hex, input.playerCivType);

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
    const builtDesc = built.map((key) => formatImprovementDesc(key, hex, esc, 'postawione')).join('<br>');
    lines.push(subLine('Ulepszenia postawione', builtDesc));
  }

  if (implicitKeys.length > 0) {
    const impDesc = implicitKeys.map((key) => {
      const bonus = formatCityBonusParts(improvementBonusForKey(key));
      return `<b>${esc(improvementDisplayName(key))}</b> (naturalne) → plony miasta: ${bonus}`;
    }).join('<br>');
    lines.push(subLine('Hodowla / złoże aktywne', impDesc));
  }

  if (built.length === 0 && implicitKeys.length === 0) {
    lines.push(subLine('Ulepszenie', 'brak — goły teren'));
  }

  const magazynSummary = formatHexMagazynSummary(hex, esc);
  const terrainMagazyn = input.hexWorkedForMagazyn
    ? formatTerrainMagazynWorkedNotes(hex)
    : [];
  if (magazynSummary || terrainMagazyn.length > 0) {
    lines.push('<div class="cp-yield-head">Do magazynu państwa</div>');
    const parts: string[] = [];
    if (magazynSummary) parts.push(magazynSummary);
    if (terrainMagazyn.length) {
      parts.push(terrainMagazyn.map(n => `<span class="cp-magazyn-line">${n}</span>`).join('<br>'));
    }
    lines.push(`<div class="cp-sub cp-magazyn-block">${parts.join('<br>')}</div>`);
  }

  lines.push('<div class="cp-yield-head">Plony miasta — rozbicie (przy 👤)</div>');
  lines.push(formatCityYieldBreakdownHtml(hex));
  lines.push(`<div class="cp-total">Razem (miasto): ${formatCityYieldLine(cityYieldOnly(fullTileYield(hex)), '0')}</div>`);
  lines.push('<div class="cp-sub cp-yield-foot">Żywność · Praca · Podatek → ekonomia miasta (przy 👤). Magazyn → ulepszenia (Tartak, Kamieniołom… — auto) + drewno/kamień/glina z terenu (przy 👤 lub centrum).</div>');

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

export interface UnitContextTooltipInput extends UnitSufferingStatusFields {
  displayName: string;
  /** Podtytuł pod nazwą (np. „2 jednostki na heksie"). */
  headMeta?: string;
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
  /** Doświadczenie bojowe — poziom 1–3 z veteran.ts. */
  veteranProgress?: VeteranProgress | null;
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
  /** Zasięg ataku (z definicji jednostki). */
  zasieg?: number;
  /** Kompakt (domyślnie) vs rozszerzony panel boczny. */
  expanded?: boolean;
  /** Pokaż przycisk „Więcej szczegółów” w treści (nad paskiem akcji). */
  expandable?: boolean;
  /** Karty jednostek na stosie (widoczne gdy length > 1). */
  stackCards?: ReadonlyArray<{
    id: string;
    name: string;
    icon: string;
    hp: number;
    hpMax: number;
    ruchLeft: number;
    ruchMax: number;
    active: boolean;
  }>;
  /** Przyciski akcji (kompakt + rozszerzony, na dole karty). */
  actions?: ReadonlyArray<UnitPanelAction>;
  esc: (raw: string) => string;
}

function formatCardHp(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function unitCardStatusFromTooltip(u: UnitContextTooltipInput): UnitCardStatusInput {
  return {
    parametryPathPp: u.parametryPathPp,
    pancerzPathPp: u.pancerzPathPp,
    veteranProgress: u.veteranProgress,
    veteranBadgeLabel: u.veteranBadgeLabel,
    veteranStarsTooltip: u.veteranStarsTooltip,
    veteranExperienceLine: u.veteranExperienceLine,
    veteranPanelExplanation: u.veteranPanelExplanation,
    inGarnizon: u.inGarnizon,
    sentry: u.sentry,
    ufortyfikowanyWPolu: u.ufortyfikowanyWPolu,
    oblegaCityName: u.oblegaCityName,
    // R-STATUS-PRZYCZYNA-CIERPIENIA-Q1=C: głód wojska + deficyt Złota.
    ...pickUnitSufferingFields(u),
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
  const metaHtml = u.headMeta
    ? `<div class="uc-unit-head-meta">${u.esc(u.headMeta)}</div>`
    : '';
  const emblem = u.ownerEmblemHtml
    ? `<span class="uc-owner-emblem">${u.ownerEmblemHtml}</span>`
    : '';
  return `<div class="uc-unit-head cp-unit-head">${emblem}`
    + `<div class="uc-unit-head-info"><b>${u.esc(u.displayName)}</b>${metaHtml}${subHtml}</div></div>`;
}

function buildUnitExpandButtonHtml(expanded: boolean): string {
  const label = expanded ? 'Mniej szczegółów' : 'Więcej szczegółów';
  return `<button type="button" class="sp-ctx-expand" data-sp-expand>${label}</button>`;
}

function buildUnitStackBarHtml(pct: number, kind: 'hp' | 'mov'): string {
  const width = Math.max(0, Math.min(100, Math.round(pct)));
  return `<div class="sp-unit-stack-bar sp-unit-stack-bar-${kind}"><i style="width:${width}%"></i></div>`;
}

function buildUnitStackCardsHtml(
  cards: NonNullable<UnitContextTooltipInput['stackCards']>,
  esc: (raw: string) => string,
): string {
  if (cards.length <= 1) return '';
  let html = '<div class="sp-unit-stack">';
  for (const c of cards) {
    const hpPct = c.hpMax > 0 ? (c.hp / c.hpMax) * 100 : 0;
    const movPct = c.ruchMax > 0 ? (c.ruchLeft / c.ruchMax) * 100 : 0;
    html += `<div class="sp-unit-stack-card${c.active ? ' on' : ''}" data-unit="${esc(c.id)}" role="button" tabindex="0">`
      + `<div class="sp-unit-stack-ic">${c.icon || unitIconSvg(undefined)}</div>`
      + `<div class="sp-unit-stack-name">${esc(c.name)}</div>`
      + '<div class="sp-unit-stack-bars">'
      + buildUnitStackBarHtml(hpPct, 'hp')
      + buildUnitStackBarHtml(movPct, 'mov')
      + '</div>'
      + `<div class="sp-unit-stack-meta">${Math.round(c.hp)}/${c.hpMax} · ${c.ruchLeft}/${c.ruchMax}</div>`
      + '</div>';
  }
  return html + '</div>';
}

function unitCurrentHp(u: UnitContextTooltipInput): number {
  if (u.hp != null) return u.hp;
  return u.combat.hpMaxEffective;
}

function buildUnitVitalsHtml(u: UnitContextTooltipInput): string {
  const hpMax = u.combat.hpMaxEffective;
  const hpCur = unitCurrentHp(u);
  const hpPct = hpMax > 0 ? (hpCur / hpMax) * 100 : 0;
  let html = '<div class="sp-unit-vitals">';
  html += '<div class="sp-unit-vital-row">'
    + '<div class="sp-unit-vital-lbl"><span class="sp-unit-vital-l">Zdrowie</span>'
    + `<span class="sp-unit-vital-v">${Math.round(hpCur)}/${formatCardHp(hpMax)}</span></div>`
    + buildUnitStackBarHtml(hpPct, 'hp')
    + '</div>';
  if (!u.readOnly) {
    const movPct = u.ruchMax > 0 ? (u.ruchLeft / u.ruchMax) * 100 : 0;
    html += '<div class="sp-unit-vital-row">'
      + '<div class="sp-unit-vital-lbl"><span class="sp-unit-vital-l">Ruch</span>'
      + `<span class="sp-unit-vital-v">${u.ruchLeft}/${u.ruchMax}</span></div>`
      + buildUnitStackBarHtml(movPct, 'mov')
      + '</div>';
  }
  return html + '</div>';
}

function buildUnitForcesHtml(u: UnitContextTooltipInput): string {
  const { combat } = u;
  // BUG-TOOLTIP-MOC-NIEPELNA (2026-08-08): wzór kanoniczny fieldPower() ma 8 pól
  // wejściowych; brakowało tu weaponDamage/piercing/chargeBonus/missileAttack —
  // luka 0-19,5 pkt Mocy, mediana 7 pkt, niezerowa dla 73/75 jednostek w
  // units.json (zerowa dla Zwiadowcy i Wieży oblężniczej; przedział 18-19,5 pkt
  // to tylko 8/75 jednostek, nie wartość typowa). Wszystkie 8 pól czytane z tej samej konwencji "*Effective"
  // (softFrac budynki+weteran) co atakEffective/obronaEffective, dla spójności
  // wewnątrz tego tooltipa.
  const power = fieldPower({
    meleeAttack: combat.atakEffective,
    meleeDefence: combat.obronaEffective,
    armor: combat.pancerzEffective,
    health: combat.hpMaxEffective,
    weaponDamage: combat.weaponDamageEffective,
    piercing: combat.piercingEffective,
    chargeBonus: combat.chargeBonusEffective,
    missileAttack: combat.missileAttackEffective,
  });
  return '<div class="sp-unit-forces">'
    + '<div class="sp-unit-forces-head">Siły zastosowane</div>'
    + `<div class="sp-unit-forces-line"><span class="sp-unit-forces-l">Atak / obrona</span>`
    + `<span class="sp-unit-forces-v">${unitCardAtkDefLineHtml(combat)}</span></div>`
    + `<div class="sp-unit-forces-line"><span class="sp-unit-forces-l">Pancerz</span>`
    + `<span class="sp-unit-forces-v">${unitCardStatValueHtml(combat.pancerzEffective, combat.pancerzBase)}</span></div>`
    + `<div class="sp-unit-forces-line sp-unit-forces-power"><span class="sp-unit-forces-l">Moc pola</span>`
    + `<span class="sp-unit-forces-v">Atak ${power.attack} · Obrona ${power.defense} · Razem ${power.total}</span></div>`
    + '</div>';
}

function buildUnitExpandedStatsHtml(u: UnitContextTooltipInput): string {
  const { combat } = u;
  const rows: Array<{ label: string; html: string }> = [
    { label: 'Atak', html: unitCardStatValueHtml(combat.atakEffective, combat.atakBase) },
    { label: 'Obrona', html: unitCardStatValueHtml(combat.obronaEffective, combat.obronaBase) },
    { label: 'Pancerz', html: unitCardStatValueHtml(combat.pancerzEffective, combat.pancerzBase) },
    { label: 'HP max', html: unitCardStatValueHtml(combat.hpMaxEffective, combat.hpMaxBase) },
    { label: 'Zasięg', html: `<span class="uc-stat-eff">${u.zasieg ?? 0}</span>` },
    { label: 'Ruch max', html: `<span class="uc-stat-eff">${u.ruchMax}</span>` },
  ];
  let html = '<div class="sp-unit-expanded-stats-head">Statystyki jednostki</div>'
    + '<div class="sp-unit-expanded-stats">';
  for (const row of rows) {
    html += `<span class="sp-unit-stat"><span class="sp-unit-stat-l">${row.label}</span>`
      + `<span class="sp-unit-stat-v">${row.html}</span></span>`;
  }
  return html + '</div>';
}

export const UNIT_CONTEXT_PANEL_CSS = `
${UNIT_CARD_STATUS_CSS}
.sp-unit-vitals{display:flex;flex-direction:column;gap:8px;margin:8px 0 6px;}
.sp-unit-vital-row{display:flex;flex-direction:column;gap:3px;}
.sp-unit-vital-lbl{display:flex;justify-content:space-between;align-items:baseline;font-size:10px;line-height:1.3;}
.sp-unit-vital-l{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:var(--civ-text-muted,#a09880);}
.sp-unit-vital-v{font-size:10px;color:var(--civ-text-primary,#e8e0c8);font-weight:600;}
.sp-unit-forces{margin:6px 0 4px;padding-top:6px;border-top:1px solid rgba(212,175,90,.12);}
.sp-unit-forces-head{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:var(--civ-text-muted,#8a8070);margin-bottom:6px;}
.sp-unit-forces-line{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:11px;line-height:1.45;margin:2px 0;}
.sp-unit-forces-l{font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:var(--civ-text-muted,#a09880);flex:0 0 auto;}
.sp-unit-forces-v{color:var(--civ-text-primary,#e8e0c8);text-align:right;}
.sp-unit-forces-power .sp-unit-forces-v{font-size:10px;color:var(--civ-gold-primary,#d4c080);}
.sp-unit-expanded-stats-head{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:var(--civ-text-muted,#8a8070);margin:10px 0 6px;}
.sp-unit-expanded-stats{display:grid;grid-template-columns:1fr 1fr;gap:6px 10px;margin:0 0 6px;}
.sp-unit-stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 10px;margin:8px 0 4px;}
.sp-unit-stat{display:flex;flex-direction:column;gap:2px;font-size:11px;line-height:1.35;}
.sp-unit-stat-l{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:var(--civ-text-muted,#a09880);}
.sp-unit-stat-v{color:var(--civ-text-primary,#e8e0c8);}
.sp-unit-stack{display:flex;gap:6px;overflow-x:auto;margin:10px 0 6px;padding-bottom:4px;scrollbar-width:thin;}
.sp-unit-stack-card{flex:0 0 auto;width:76px;padding:6px 4px;border-radius:8px;cursor:pointer;
  border:1px solid rgba(212,175,90,.22);background:rgba(16,20,28,.85);text-align:center;}
.sp-unit-stack-card.on{border-color:rgba(212,175,90,.55);box-shadow:0 0 10px rgba(212,175,90,.12);}
.sp-unit-stack-ic{font-size:18px;line-height:1;min-height:20px;}
.sp-unit-stack-name{font-size:9px;font-weight:600;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sp-unit-stack-bars{display:flex;flex-direction:column;gap:3px;margin-top:5px;padding:0 3px;}
.sp-unit-stack-bar{height:4px;background:rgba(0,0,0,.38);border-radius:2px;overflow:hidden;}
.sp-unit-stack-bar i{display:block;height:100%;border-radius:2px;}
.sp-unit-stack-bar-hp i{background:linear-gradient(90deg,${VITALS_HP_DARK_CSS},${VITALS_HP_FULL_CSS});}
.sp-unit-stack-bar-mov i{background:linear-gradient(90deg,${VITALS_MOVE_DARK_CSS},${VITALS_MOVE_FULL_CSS});}
.sp-unit-stack-meta{font-size:8px;color:var(--civ-text-muted,#8a8070);margin-top:4px;}
.uc-unit-head-meta{font-size:10px;color:var(--civ-text-muted,#a09880);margin-top:3px;font-weight:400;}
${UNIT_ACTION_BAR_CSS}
.sp-unit-card-body{display:flex;flex-direction:column;gap:0;}
.sp-unit-card-expanded .sp-unit-card-cols{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px 14px;align-items:start;}
.sp-unit-card-expanded .sp-unit-card-col{min-width:0;}
.sp-unit-card-expanded .sp-unit-card-col-detail{border-left:1px solid rgba(212,175,90,.18);padding-left:12px;}
.sp-unit-card-foot{display:flex;flex-direction:column;gap:0;margin-top:8px;}
.sp-unit-card-expanded .sp-unit-card-foot{margin-top:8px;}
.sp-unit-card-expanded .sp-unit-stack{flex-wrap:wrap;overflow-x:visible;justify-content:flex-start;}
.sp-ctx-expand{display:block;width:100%;margin-top:10px;padding:6px 10px;border-radius:6px;
  border:1px solid rgba(212,175,90,.35);background:rgba(20,26,36,.75);
  color:var(--civ-gold-primary,#e8d88a);font-size:10px;letter-spacing:.12em;text-transform:uppercase;
  cursor:pointer;font-family:inherit;text-align:center;}
.sp-ctx-expand:hover{border-color:rgba(212,175,90,.55);background:rgba(28,34,46,.9);}
.sp-army-sel-lbl{font-size:10px;color:var(--civ-text-muted,#a09880);margin:8px 0 4px;letter-spacing:.04em;}
.sp-army-sel-lbl b{color:var(--civ-gold-primary,#e8d88a);font-weight:600;}
`;

function buildArmySelectedUnitLabelHtml(
  cards: NonNullable<UnitContextTooltipInput['stackCards']>,
  esc: (raw: string) => string,
): string {
  const active = cards.find(c => c.active);
  if (!active) return '';
  return `<div class="sp-army-sel-lbl">Wybrana jednostka: <b>${esc(active.name)}</b></div>`;
}

function buildUnitDetailExtrasHtml(u: UnitContextTooltipInput, statusInput: UnitCardStatusInput): string {
  const parts: string[] = [buildUnitExpandedStatsHtml(u)];

  const extra = buildUnitExtraStatusLinesHtml(statusInput);
  if (extra) parts.push(`<div class="cp-sub">${extra}</div>`);

  const vetEdu = buildUnitVeteranEducationHtml(statusInput);
  if (vetEdu) parts.push(`<div class="cp-sub">${vetEdu}</div>`);

  if (u.buildingBonusLabel && !pathStatusRowHasChips(statusInput)) {
    parts.push(subLine('Ulepszenia (budynki)', u.esc(u.buildingBonusLabel)));
  }

  return parts.join('');
}

function buildUnitCompactBodyHtml(u: UnitContextTooltipInput, statusInput: UnitCardStatusInput): string {
  const isArmy = (u.stackCards?.length ?? 0) > 1;
  const lines: string[] = [buildUnitHeadHtml(u)];

  if (isArmy && u.stackCards) {
    lines.push(buildUnitStackCardsHtml(u.stackCards, u.esc));
  } else {
    lines.push(buildUnitVitalsHtml(u));
    lines.push(buildUnitForcesHtml(u));
    lines.push(buildPathLevelIconsRowHtml(statusInput));
  }

  return lines.join('');
}

function buildUnitExpandedBodyHtml(u: UnitContextTooltipInput, statusInput: UnitCardStatusInput): string {
  const isArmy = (u.stackCards?.length ?? 0) > 1;
  let basicCol = buildUnitHeadHtml(u);
  let detailCol = '';

  if (isArmy && u.stackCards) {
    basicCol += buildUnitStackCardsHtml(u.stackCards, u.esc);
    detailCol += buildArmySelectedUnitLabelHtml(u.stackCards, u.esc);
    detailCol += buildUnitVitalsHtml(u);
    detailCol += buildUnitForcesHtml(u);
    detailCol += buildPathLevelIconsRowHtml(statusInput);
  } else {
    basicCol += buildUnitVitalsHtml(u);
    basicCol += buildUnitForcesHtml(u);
    basicCol += buildPathLevelIconsRowHtml(statusInput);
  }

  detailCol += buildUnitDetailExtrasHtml(u, statusInput);

  return '<div class="sp-unit-card-cols">'
    + `<div class="sp-unit-card-col sp-unit-card-col-basic">${basicCol}</div>`
    + `<div class="sp-unit-card-col sp-unit-card-col-detail">${detailCol}</div>`
    + '</div>';
}

export function buildUnitContextTooltipHtml(u: UnitContextTooltipInput): string {
  const statusInput = unitCardStatusFromTooltip(u);
  const expanded = u.expanded === true;
  const bodyHtml = expanded
    ? buildUnitExpandedBodyHtml(u, statusInput)
    : buildUnitCompactBodyHtml(u, statusInput);

  const footer: string[] = [];
  if (u.expandable) {
    footer.push(buildUnitExpandButtonHtml(expanded));
  }
  if (u.actions && u.actions.length > 0) {
    footer.push(buildUnitActionBarHtml(u.actions));
  }

  const footHtml = footer.length
    ? `<div class="sp-unit-card-foot">${footer.join('')}</div>`
    : '';

  return `<div class="sp-unit-card-body${expanded ? ' sp-unit-card-expanded' : ''}">${bodyHtml}${footHtml}</div>`;
}
