/**
 * K01A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K01A-Q1, runda 3): 82 jednostki kawalka K01 (Fundament) pinu
 * gra/src/ui/cityPanel.ts (edb8fb56) BEZ odwolan do DOM i BEZ importow wartosci logiki gry.
 * Kopia 1:1 linii pinu (numer linii w komentarzu przy kazdej jednostce); dodano wylacznie `export`
 * na deklaracjach najwyzszego poziomu. Importy: tylko ui/ (formatery, ikony, parametry UI).
 * Wybor jednostek: deterministyczny skrypt `tools/dom-harness/k01a-select-lib.mjs` (gate S w run-k01a.mjs).
 * Jednostki z blokadami (R: import wartosci logiki; T: typ obiektowy z logiki; F: zaleznosc od odroczonej;
 * DOM) -> ODROCZONE, lista z powodami w dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K01A-Q1/r3-logi/.
 * ZAŁOŻENIE K01A-Z5: lokalne kopie dwoch aliasow unii literalow (OkolicaFocus, BudowaFocus) z
 * gra/src/game/cities.ts; gate T porownuje je bajtowo z pinem. Typy obiektowe NIE sa kopiowane.
 */
import { signedPl } from '../formatPl';
import { brandIconSvg, mapResourceIconSvg } from '../icons/brandAssets';
import type { BrandIconSize } from '../icons/brandAssets';
import { scienceOwlIconHtml } from '../icons/scienceOwlIcon';
import { UI_PARAMS } from '../uiParams';

// kopia typu (ZAŁOŻENIE K01A-Z5) pin edb8fb56 gra/src/game/cities.ts:45-45
export type OkolicaFocus = 'zrownowazone' | 'zywnosc' | 'produkcja' | 'podatki';

// kopia typu (ZAŁOŻENIE K01A-Z5) pin edb8fb56 gra/src/game/cities.ts:60-66
export type BudowaFocus =
  | 'zrownowazone'
  | 'wzrost'
  | 'wojsko'
  | 'kultura'
  | 'prawo'
  | 'produkcja';

// pin edb8fb56 gra/src/ui/cityPanel.ts:285-291
export interface PodzialHandluSplit {
  procentPieniadz: number;
  procentNauka: number;
  procentLuksus: number;
}

/** Suwak podzialu Pracy (budynki vs pula imperium). */

// pin edb8fb56 gra/src/ui/cityPanel.ts:292-296
export interface PodzialPracySplit {
  procentBudynki: number;
}

/** A unit garrisoned in the city (supplied by the engine via getUnitsAt). */

// pin edb8fb56 gra/src/ui/cityPanel.ts:297-313
export interface GarrisonUnit {
  /** RuntimeUnit id — potrzebny do akcji „Odfortyfikuj" (onLeaveGarrison). */
  id: string;
  nazwa: string;
  category?: string;
  health?: number;
  maxHealth?: number;
  /**
   * C-GARN-Q1 rozszerzenie (Maciej 2026-07-26): czy ta jednostka jest UKRYTA
   * w garnizonie (Ufort., RuntimeUnit.inGarnizon===true) — tylko takie dostają
   * przycisk „Odfortyfikuj". Jednostki po prostu stojące na heksie miasta
   * (niewymagające fortyfikacji) są już sterowalne normalnie z mapy.
   */
  inGarnizon?: boolean;
}

/** Optional hooks the engine may supply so the view reflects real game state. */

// pin edb8fb56 gra/src/ui/cityPanel.ts:860-862
export const CP_EMOJI_DETECT =
  /[\u{1F300}-\u{1FAFF}\u2600-\u27BF✓⚠★⚔⚖👤👥🍞🌾🔥💀😊⏱📈🛕🎭🏛🛠🛡]/u;


// pin edb8fb56 gra/src/ui/cityPanel.ts:871-871
export function signed(n: number): string { return signedPl(n); }

// pin edb8fb56 gra/src/ui/cityPanel.ts:872-878
export function tury(n: number): string {
  const a = Math.abs(n), m10 = a % 10, m100 = a % 100;
  if (a === 1) return 'tura';
  if (m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14)) return 'tury';
  return 'tur';
}
/** Etykieta ETA budowy — null → „brak Pracy”. */

// pin edb8fb56 gra/src/ui/cityPanel.ts:879-888
export function formatBuildEtaLabel(turns: number | null, prefix = '~'): string {
  if (turns === null) return 'brak Pracy';
  return `${prefix}${turns} ${tury(turns)}`;
}

/**
 * Kumulatywny ETA pozycji kolejki (indeks ≥ 1): kiedy budynek będzie gotowy,
 * licząc od bieżącej tury przy stałym dopływie Pracy do budynków.
 * Gdy produkcja wstrzymana — null (nie da się oszacować kolejki).
 */

// pin edb8fb56 gra/src/ui/cityPanel.ts:918-918
export const SCALES: ReadonlyArray<{ label: string; px: number }> = UI_PARAMS.panel_miasta.font_scale;

// pin edb8fb56 gra/src/ui/cityPanel.ts:919-921
export let scalePx = UI_PARAMS.panel_miasta.font_scale_domyslna_px;

/** B: podgląd całej epoki (badania) na dole listy budynków — niezależnie od tech w sandboxie. */

// pin edb8fb56 gra/src/ui/cityPanel.ts:922-926
export let showEraBuildingPreview = false;
try {
  showEraBuildingPreview = sessionStorage.getItem('civ-bld-era-preview') === '1';
} catch { /* ignore */ }


// pin edb8fb56 gra/src/ui/cityPanel.ts:927-939
export function setShowEraBuildingPreview(on: boolean): void {
  showEraBuildingPreview = on;
  try {
    sessionStorage.setItem('civ-bld-era-preview', on ? '1' : '0');
  } catch { /* ignore */ }
}

/**
 * Domyslny podzial Daniny netto nowego miasta — MUSI byc zgodny z
 * DEFAULT_PODZIAL_HANDLU w game/cities.ts oraz z econ-params.json.
 * 20% Nauka / 60% Skarbiec / 20% Zamoznosc (decyzja Maciej 2026-07-25, PYTANIE 74 = A;
 * dawniej 20/70/10).
 */

// pin edb8fb56 gra/src/ui/cityPanel.ts:940-946
export const DEFAULT_PODZIAL_HANDLU: PodzialHandluSplit = {
  procentPieniadz: 60,
  procentNauka: 20,
  procentLuksus: 20,
};

/** Domyslny podzial Pracy (70% budynki). */

// pin edb8fb56 gra/src/ui/cityPanel.ts:947-949
export const DEFAULT_PODZIAL_PRACY: PodzialPracySplit = { procentBudynki: 70 };

/** Etykieta suwaka handlu karmiącego pulę zamożności (UI — bez „Społ.” / „Wealth”). */

// pin edb8fb56 gra/src/ui/cityPanel.ts:950-955
export const HANDEL_ZAMOZNOSC_LABEL = 'Zamożność';

/**
 * Tymczasowy placeholder UI — docelowo korupcja z silnika (dystans od stolicy, liczba miast, cap).
 * TODO(produkt): pełny model korupcji — od czego zależy, czy gracz może redukować (budynek, tech, porządek).
 */

// pin edb8fb56 gra/src/ui/cityPanel.ts:956-957
export const HANDEL_KORUPCJA_PCT_PLACEHOLDER = 5;


// pin edb8fb56 gra/src/ui/cityPanel.ts:958-967
export interface HandelChipEstimates {
  brutto: number;
  korupcja: number;
  netto: number;
  skarb: number;
  nauka: number;
  zam: number;
}

/** Szacunek strumieni handlu do chipów (netto po korupcji, potem split suwaków). */

// pin edb8fb56 gra/src/ui/cityPanel.ts:1075-1107
export interface EmpireHudSnap {
  /** Pula Pracy imperium (zapas — załóż miasto, ulepszenia / projekty mapy). */
  pracaPool?: number;
  /** Suma Pracy / turę (wszystkie miasta), NETTO — już po odjęciu `pracaUpkeep`. */
  pracaRate?: number;
  /** Civ-wide utrzymanie Pracy za ulepszenia surowcowe terenu (tartak/kamieniołom/
   *  glinianka/kopalnie/warzelnia soli/stadnina), już wliczone (odjęte) w `pracaRate`. */
  pracaUpkeep?: number;
  zloto?: number;
  zlotoRate?: number;
  nauka?: number;
  naukaRate?: number;
  zywnoscReserve?: number;
  zywnoscRate?: number;
  kulturaRate?: number;
  /** Kultura nagromadzona całej cywilizacji (ZAPAS, nie tempo — jak na HUD mapy). */
  kultura?: number;
  /** Suma wiernych religii państwa (imperium). */
  religionStock?: number;
  /** Suma szerzenia wiernych / turę (wszystkie miasta). */
  religionRate?: number;
  stateReligion?: string | null;
  religionSharePct?: number;
  /** Rozbicie skarbca imperium (jak HUD — bilans netto / turę). */
  bogactwoWplywyBrutto?: number;
  bogactwoHandel?: number;
  bogactwoUtrzymanieBudynkow?: number;
  bogactwoUtrzymanieSurowcowBudynkow?: Record<string, number>;
  bogactwoUtrzymanieJednostek?: number;
  bogactwoRate?: number;
}

/** Bilans pieniędzy jednego miasta — tylko przychody/koszty tego grodu. */

// pin edb8fb56 gra/src/ui/cityPanel.ts:1451-1456
export function growthBreakdownRow(label: string, value: number, showZero = false): string {
  if (!showZero && value === 0) return '';
  const cls = value > 0 ? 'pos' : value < 0 ? 'neg' : 'muted';
  return `<div class="growth-bd-row ${cls}"><span>${label}</span><span>${signed(value)}%</span></div>`;
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:1457-1460
export function fmtDecPl(n: number, digits = 2): string {
  return n.toFixed(digits).replace('.', ',');
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:1461-1469
export function pluralTur(n: number): string {
  if (n === 1) return 'turę';
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'tury';
  return 'tur';
}

/** SPICH-AUTO-Q1: fed z ticku imperium — bez fałszywego „nakarmione” przy deficycie Spichlerza. */

// pin edb8fb56 gra/src/ui/cityPanel.ts:1481-1485
export function effectiveGrowthPctForUi(wzrostProcent: number, fed: boolean): number {
  return fed ? wzrostProcent : 0;
}

/** R-ETYKIETA-MIASTA-WZROST-PROCENT — WZROST% miasta dla plakietki na mapie świata. */

// pin edb8fb56 gra/src/ui/cityPanel.ts:1678-1684
export function fmtResDelta(n: number): { html: string; cls: string } {
  if (n === 0) return { html: '', cls: '' };
  const cls = n > 0 ? 'green' : 'red';
  const html = n > 0 ? `+${n}` : String(n);
  return { html, cls };
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:1685-1693
export function resInteractiveAttrs(statId: string, hint: string, rail = false): { cls: string; attrs: string } {
  const railCls = rail ? ' civ-v-res-rail-item' : '';
  return {
    cls: `civ-v-res-item${railCls} civ-v-res-interactive`,
    attrs: ` data-res-stat="${statId}" tabindex="0" role="button" aria-label="${hint.replace(/"/g, '&quot;')}"`,
  };
}

/** Kromka chleba — game-icons.net/delapouite/bread-slice (CC BY 3.0) */

// pin edb8fb56 gra/src/ui/cityPanel.ts:1694-1698
export const LOAF_SVG =
  '<svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">' +
  '<path d="M233.2 25.36c-57-.02-109.1.58-119.7 2.23C61.74 35.66 35.44 154.9 80.21 155.9c-20.75 110.9-24.36 222.6-17.9 332.9 105.49 6.7 281.39 13.4 386.89 2.2 3.5-107.7 4.3-217.4-30.8-328.5 53.3-9.6 20.4-131.04-18.8-134.9-11.8-1.16-93.2-2.22-166.4-2.24zM126.6 57.8c1.5-.09 3.2.56 4.7 2.21 6.1 6.68 5.3 23.36 0 24.89-3.4.93-10.8-6.89-12.1-13.01-1.4-6.86 2.7-13.82 7.4-14.09zm201.5 31.11c5.7.25 11.9 12.69 10.3 19.89-1.3 5.3-8.7 8.4-12.1 5.3-5.3-4.9-6.1-22.06 0-24.86.6-.25 1.2-.36 1.8-.33zm83.2 35.99c3.8 0 5 6 1.8 10.7-5.3 7.7-20.9 15.6-22.1 10.1-1.2-5.4 12.8-19.4 19.5-20.7.3-.1.5-.1.8-.1zm-252.5 15.3c.8 0 1.5.1 2.3.4 7.6 2.9 15.2 17.4 9.5 21-5.7 3.5-19.5-6.8-20.7-13.9-.5-3.7 3.8-7.3 8.2-7.5h.7zm76.6 54.8c.5 0 1 .1 1.4.3 6.1 2.8 5.3 20 0 24.9-3.4 3.1-10.8 0-12.1-5.3-1.6-7.2 4.6-19.7 10.3-19.9h.4zm136.9 9.4c.5 0 1 .1 1.5.4 5.2 3.5 4.5 25.2 0 31.4-2.8 3.9-9.1 0-10.1-6.7-1.5-9.2 3.8-24.8 8.6-25.1zm-196.7 51.5c.4 0 .9.1 1.3.3 6.1 2.8 5.3 20 0 24.9-3.4 3.1-10.8 0-12.1-5.3-1.6-7.2 4.6-19.7 10.3-19.9h.5zm227.1 28.9c6.5.1 15.6 12.5 14.8 19.3-.6 4.5-8.3 6.9-12.7 3.7-6.5-4.9-9.8-20.9-3.4-22.8.4-.1.8-.2 1.3-.2zm-103.9 9.9c7.3.1 17.6 9.2 17.7 15.2 0 4.3-8.2 8-13.5 5.8-8-3.3-13.9-17.6-7.1-20.5.9-.4 1.9-.5 2.9-.5zm-166.3 46c2.4-.1 4.4.3 5.5 1.2 4.1 3.6-10.2 13.5-19.4 14.5-6.1.5-11-4-8.1-7.5 3.3-3.9 14.7-8 22-8.2zm149.7 49.2c4.4.3 9.2 14.5 7.9 22.8-1 6-6.6 9.6-9.2 6-4-5.6-4.6-25.2 0-28.4.4-.3.9-.4 1.3-.4zm-173.9 44.3c1.5 0 2.9.4 3.8 1.6 4 5.4-5 20.1-12 21.9-4.43 1.1-9.45-5.2-8.05-10.5 1.77-6.2 10.55-12.9 16.25-13zm316.2 5.6h.6c5.4 0 4.5 16.9-.6 24.9-3.4 5.2-10.8 6.8-12.1 2.3-1.8-6.9 6-26.1 12.1-27.2z"/>' +
  '</svg>';


// pin edb8fb56 gra/src/ui/cityPanel.ts:1699-1703
export function loafIconHtml(extraClass = ''): string {
  const cls = extraClass ? `civ-v-loaf-ic ${extraClass}` : 'civ-v-loaf-ic';
  return `<span class="${cls}">${LOAF_SVG}</span>`;
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:1704-1722
export function resGlobalLocal(
  icon: string,
  mainVal: string,
  cityDelta: number,
  mainCls: string,
  hint: string,
  statId?: string,
  rail = false,
): string {
  const d = fmtResDelta(Math.round(cityDelta));
  const ia = statId ? resInteractiveAttrs(statId, hint, rail) : { cls: rail ? 'civ-v-res-item civ-v-res-rail-item' : 'civ-v-res-item', attrs: '' };
  return `<span class="${ia.cls}"${ia.attrs} title="${hint.replace(/"/g, '&quot;')}">` +
    `<span class="civ-v-res-icon">${icon}</span>` +
    `<span class="civ-v-res-val ${mainCls}">${mainVal}</span>` +
    (d.html ? `<span class="civ-v-res-delta ${d.cls}">${d.html}</span>` : '') +
    `</span>`;
}

/** Górny pasek: pula pracy + dwa dopiski (budynki / pula imperium). */

// pin edb8fb56 gra/src/ui/cityPanel.ts:1744-1754
export function resLocalOnly(icon: string, val: string, cls: string, hint: string, statId?: string, rail = false): string {
  const ia = statId ? resInteractiveAttrs(statId, hint, rail) : { cls: rail ? 'civ-v-res-item civ-v-res-rail-item' : 'civ-v-res-item', attrs: '' };
  return `<span class="${ia.cls}"${ia.attrs} title="${hint.replace(/"/g, '&quot;')}">` +
    `<span class="civ-v-res-icon">${icon}</span>` +
    `<span class="civ-v-res-val ${cls}">${val}</span></span>`;
}

// ---------------------------------------------------------------------------
// Scoped styles (injected once, namespaced under .civ-cs so the game is safe)
// ---------------------------------------------------------------------------


// pin edb8fb56 gra/src/ui/cityPanel.ts:1755-1757
export const STYLE_ID = 'civ-city-screen-css-w3-hudfix';

/** Rozmiar samej ikonki (emoji/SVG) na pasku zakładek — w em względem font-size mountu. */

// pin edb8fb56 gra/src/ui/cityPanel.ts:1758-1759
export const CITY_PANEL_ICON_GLYPH_EM = 4.5;
/** Pionowy słupek zakładek — ~50% rozmiaru bazowego. */

// pin edb8fb56 gra/src/ui/cityPanel.ts:1760-1761
export const CITY_PANEL_ICON_RAIL_VERT_EM = CITY_PANEL_ICON_GLYPH_EM * 0.5;
/** Ile wierszy list (budynki, jednostki) widocznych bez przewijania — reszta w scrollu. */

// pin edb8fb56 gra/src/ui/cityPanel.ts:1762-1763
export const LIST_SCROLL_VISIBLE = 3;
/** Kompaktowy wiersz katalogu budowy (ikona + nazwa + Buduj). */

// pin edb8fb56 gra/src/ui/cityPanel.ts:1764-1765
export const LIST_ROW_HEIGHT_COMPACT = 2.35;
/** Kolejka rekrutacji w panelu Produkcja — max widocznych wierszy (reszta scroll). */

// pin edb8fb56 gra/src/ui/cityPanel.ts:1766-1767
export const RECRUIT_QUEUE_VISIBLE = 5;
/** Kolejka budowy (pozycje po bieżącym projekcie) — max widocznych wierszy. */

// pin edb8fb56 gra/src/ui/cityPanel.ts:1768-1769
export const BUILD_QUEUE_VISIBLE = 4;
/** Wysokość jednego wiersza kolejki rekrutacji/budowy (em). */

// pin edb8fb56 gra/src/ui/cityPanel.ts:1770-1771
export const QUEUE_ROW_EM = 2.75;
/** Panel Buduj / Rekrutacja — więcej pozycji na ekranie. */

// pin edb8fb56 gra/src/ui/cityPanel.ts:1772-1772
export const LIST_SCROLL_VISIBLE_CATALOG = 8;

// pin edb8fb56 gra/src/ui/cityPanel.ts:1773-1774
export const LIST_ROW_HEIGHT_EM = 2.75;


// pin edb8fb56 gra/src/ui/cityPanel.ts:1775-1776
export type CityDrawerTab = 'plony' | 'produkcja' | 'miasto' | 'okolica';


// pin edb8fb56 gra/src/ui/cityPanel.ts:1777-1783
export const CITY_TABS: { id: CityDrawerTab; short: string }[] = [
  { id: 'plony', short: 'Plony' },
  { id: 'produkcja', short: 'Produkcja' },
  { id: 'miasto', short: 'Miasto' },
  { id: 'okolica', short: 'Okolica' },
];


// pin edb8fb56 gra/src/ui/cityPanel.ts:1784-1790
export const CITY_TAB_BRAND_ICONS: Record<CityDrawerTab, string> = {
  plony: 'cp-granary',
  produkcja: 'cp-labor',
  miasto: 'cp-order',
  okolica: 'res-settlements',
};


// pin edb8fb56 gra/src/ui/cityPanel.ts:1791-1792
export let activeDrawerTab: CityDrawerTab = 'plony';


// pin edb8fb56 gra/src/ui/cityPanel.ts:1793-1799
export function cityPanelBrandIcon(id: string, size: BrandIconSize = 24, cls = 'civ-cs-ic'): string {
  const svg = brandIconSvg(id, size);
  if (!svg) return '';
  return svg.replace('<svg ', `<svg class="${cls}" `);
}

/** Ikona chip/pasek w panelu miasta — brand-book 1E (bez emoji). */

// pin edb8fb56 gra/src/ui/cityPanel.ts:1800-1803
export function cityPanelChipIcon(id: string, size: BrandIconSize = 18): string {
  return cityPanelBrandIcon(id, size, 'civ-cs-chip-ic');
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:1804-1809
export function cityPanelChipIconWrap(id: string, size: BrandIconSize = 18): string {
  const ic = cityPanelChipIcon(id, size);
  return ic ? `<span class="civ-cs-chip-ic-wrap">${ic}</span>` : '';
}

/** Emoji → brand SVG wraps in detail cards, notes, formulas (C1b). */

// pin edb8fb56 gra/src/ui/cityPanel.ts:1810-1839
export const CP_INLINE_EMOJI_BRAND: Record<string, string> = {
  '🔨': 'res-work',
  '💰': 'res-treasury',
  '🎭': 'res-culture',
  '🛕': 'res-religion',
  '👥': 'res-population',
  '👤': 'chip-manpower',
  '⚔': 'tb-army',
  '🏛': 'cp-buildings',
  // P-PRACA-PANEL-EMOJI-ZAMIAST-IKON-Q1: skrzynka „Ulepszenia" — TA SAMA ikona `chip-crate`,
  // która została zatwierdzona dla tego pojęcia w P-PRACA-PANEL-IKONY-NIESPOJNE-Q1 (żadnego
  // nowego assetu). Bez tego wpisu `cpInlineIcons()` przepuszczało 📦 nietknięte przez CAŁĄ
  // ścieżkę helperów (`gridDetailRow`, `appendDetailAlgo`, `el()`), więc „ściąga" panelu
  // Pracy i karta paska górnego pokazywały goły glif mimo poprawnie działającego reskinu.
  '📦': 'chip-crate',
  '🛠': 'tb-build',
  '📈': 'cp-trade',
  '😊': 'chip-happiness',
  '⏱': 'chip-map',
  '🌾': 'chip-grain',
  '✓': 'chip-star',
  '⚠': 'chip-warning',
  '🔥': 'chip-rebellion',
  '💀': 'chip-death',
  '⚖': 'cp-order',
  '★': 'chip-star',
  '🔒': 'ui-lock',
  '🛡': 'chip-garrison',
};


// pin edb8fb56 gra/src/ui/cityPanel.ts:1840-1850
export function cpInlineIcons(text: string): string {
  if (!text || (!CP_EMOJI_DETECT.test(text) && !text.includes('🍞'))) return text;
  let out = text;
  out = out.replace(/🍞/g, `<span class="civ-cs-inline-loaf">${loafIconHtml('civ-v-loaf-chip')}</span>`);
  for (const [emoji, brandId] of Object.entries(CP_INLINE_EMOJI_BRAND)) {
    const wrap = cityPanelChipIconWrap(brandId, 14);
    if (wrap) out = out.split(emoji).join(wrap);
  }
  return out;
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:1856-1862
export function statChipBrand(iconId: string, label: string, value: string, cls: string): string {
  const ic = cityPanelChipIconWrap(iconId);
  const head = ic ? `${ic}<span>${label}</span>` : label;
  return `<span class="chip"><span class="cl">${head}</span><span class="cv ${cls}">${value}</span></span>`;
}

/** Chipy bilansu plonów (W4 / B-02) — zawsze SVG brand, bez emoji. */

// pin edb8fb56 gra/src/ui/cityPanel.ts:1879-1883
export function psiRowLabel(iconId: string, text: string, title?: string): string {
  const t = title ? ` title="${title.replace(/"/g, '&quot;')}"` : '';
  return `${cityPanelChipIconWrap(iconId, 16)}<span${t}>${text}</span>`;
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:1884-1888
export function cityTabIconHtml(tab: CityDrawerTab): string {
  const ic = cityPanelBrandIcon(CITY_TAB_BRAND_ICONS[tab], 24, 'civ-cs-tab-ic');
  return ic ? `<span class="civ-cs-tab-ic-wrap">${ic}</span>` : '';
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:1889-1895
export const OKOLICA_FOCUS_BRAND: Record<OkolicaFocus, string> = {
  zywnosc: 'field-food',
  produkcja: 'field-production',
  podatki: 'field-tax',
  zrownowazone: 'field-balanced',
};


// pin edb8fb56 gra/src/ui/cityPanel.ts:1896-1902
export const OKOLICA_FOCUS_SHORT: Record<OkolicaFocus, string> = {
  zywnosc: 'Żyw.',
  produkcja: 'Prod.',
  podatki: 'Podat.',
  zrownowazone: 'Zrówn.',
};


// pin edb8fb56 gra/src/ui/cityPanel.ts:1903-1911
export const BUDOWA_FOCUS_BRAND: Record<BudowaFocus, string> = {
  wzrost: 'field-food',
  wojsko: 'tb-army',
  kultura: 'res-culture',
  prawo: 'cp-order',
  produkcja: 'res-work',
  zrownowazone: 'field-balanced',
};


// pin edb8fb56 gra/src/ui/cityPanel.ts:1912-1920
export const BUDOWA_FOCUS_SHORT: Record<BudowaFocus, string> = {
  wzrost: 'Wzrost',
  wojsko: 'Wojsko',
  kultura: 'Kultura',
  prawo: 'Prawo',
  produkcja: 'Prod.',
  zrownowazone: 'Zrówn.',
};


// pin edb8fb56 gra/src/ui/cityPanel.ts:1921-1929
export const BUDOWA_FOCUS_TITLE: Record<BudowaFocus, string> = {
  wzrost: 'Wzrost — żywność i zdrowie',
  wojsko: 'Wojsko — koszary, obrona',
  kultura: 'Kultura — pomniki i kultura',
  prawo: 'Prawo — administracja i porządek',
  produkcja: 'Produkcja — Praca i warsztaty',
  zrownowazone: 'Zrównoważony rozwój',
};


// pin edb8fb56 gra/src/ui/cityPanel.ts:1930-1933
export function okolicaProfileIconHtml(iconId: string, size: BrandIconSize = 24): string {
  return cityPanelBrandIcon(iconId, size, 'okolica-profile-ic');
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:3015-3033
export function PH(): string {
  return '<span class="muted" style="font-size:0.66em;border:1px solid var(--border);border-radius:3px;padding:0 0.3em;">podgląd</span>';
}

// ---------------------------------------------------------------------------
// Lewa kolumna — społeczeństwo (B2: Mieszkańcy, Porządek, Zdrowie)
// ---------------------------------------------------------------------------

/**
 * G15 (Evaluator runda 1, zarzut 6) — JEDNO zaokrąglenie PREZENTACYJNE punktów Szczęścia.
 *
 * `proporcjonalneSzczescie` celowo NIE zaokrągla (zaokrąglenie w modelu byłoby strojeniem
 * liczby właściciela — `society-breakdown.ts:487`), więc przy nieparzystym `x` linia
 * Kultury/Religii niesie ułamek (x=23, udział 1/3 → −7,666666666666666). Karta Religii
 * pokazywała ten sam wkład zaokrąglony do −7,7, a wiersz rozpiski surowy — dwie różne
 * liczby dla tej samej rzeczy w JEDNYM panelu. Od teraz obie strony przechodzą przez tę
 * funkcję. Wartość w modelu (`netto`, `szPct`) zostaje dokładna — zaokrąglamy wyłącznie
 * to, co widzi gracz.
 */

// pin edb8fb56 gra/src/ui/cityPanel.ts:3034-3038
export function szPktDisplay(v: number): number {
  return Math.round(v * 10) / 10;
}

/** Kopia linii rozpiski Szczęścia do WYŚWIETLENIA — wartości przez `szPktDisplay`. */

// pin edb8fb56 gra/src/ui/cityPanel.ts:3760-3774
export function isMapResourceLabel(n: string): boolean {
  return (
    n.includes('byd') || n.includes('glin') || n.includes('ceg') ||
    n.includes('koń') || n.includes('kon') || n.includes('horse') ||
    n.includes('sól') || n.includes('sol') || n.includes('salt') ||
    n.includes('drewn') || n.includes('las') ||
    n.includes('kamie') || n.includes('kamien') ||
    n.includes('ruda') || n.includes('braz') || n.includes('brąz') ||
    n.includes('żelaz') || n.includes('zelaz') ||
    n.includes('złot') || n.includes('zlot') ||
    n.includes('owc') || n.includes('lama') ||
    n.includes('węgiel') || n.includes('wegiel') || n.includes('miedz') || n.includes('stal')
  );
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:3775-3787
export function resourceBrandKey(nazwa: string): string | null {
  const n = nazwa.toLowerCase();
  if (n.includes('byd')) return 'res-cattle';
  if (n.includes('glin') || n.includes('ceg')) return 'res-clay';
  if (n.includes('koń') || n.includes('kon') || n.includes('horse')) return 'res-horses';
  if (n.includes('sól') || n.includes('sol') || n.includes('salt')) return 'res-salt';
  if (n.includes('drewn')) return 'chip-crate';
  if (n.includes('kamie') || n.includes('kamien')) return 'tb-build';
  if (n.includes('ruda') || n.includes('braz')) return 'res-work';
  if (n.includes('owc')) return 'res-cattle';
  return 'chip-crate';
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:3788-3803
export function resourceBrandIconHtml(nazwa: string): string {
  const n = nazwa.toLowerCase();
  // Surowce mapy → dedykowana ikona res-* (resources-map/), reskin z generyków.
  if (isMapResourceLabel(n)) {
    const mapSvg = mapResourceIconSvg(nazwa, 18);
    if (mapSvg) return `<span class="civ-w4-res-ic">${mapSvg}</span>`;
  }
  const key = resourceBrandKey(nazwa) ?? 'chip-crate';
  const svg = brandIconSvg(key, 24);
  if (svg) {
    const sized = svg.replace('<svg ', '<svg width="18" height="18" ');
    return `<span class="civ-w4-res-ic">${sized}</span>`;
  }
  return `<span class="civ-w4-res-ic">${cityPanelChipIcon('chip-crate', 18)}</span>`;
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:3804-3807
export function resourceIcon(nazwa: string): string {
  return resourceBrandIconHtml(nazwa);
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:4222-4229
export function statChip(icon: string, label: string, value: string, cls: string): string {
  const iconPart = icon.startsWith('<')
    ? `<span class="civ-cs-chip-ic-wrap">${icon}</span>`
    : icon;
  const head = iconPart ? `${iconPart}<span>${label}</span>` : label;
  return `<span class="chip"><span class="cl">${head}</span><span class="cv ${cls}">${value}</span></span>`;
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:4230-4233
export function pctSubheadHtml(brandId: string, text: string): string {
  return `${cityPanelChipIconWrap(brandId, 14)}<span>${text}</span>`;
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:4234-4235
export type TabIndicatorChip = { icon: string; label: string; value: string; cls?: string; title?: string };


// pin edb8fb56 gra/src/ui/cityPanel.ts:4352-4356
export function shortIndLabel(text: string, max = 13): string {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:4376-4377
export type BreakdownLine = { label: string; value: number; neg?: boolean };


// pin edb8fb56 gra/src/ui/cityPanel.ts:6155-6160
export const CS_RES_STRIP_ORDER: readonly string[] = [
  'drewno', 'kamien', 'glina', 'ruda', 'ruda_zelaza', 'ruda_cyny', 'cegla', 'braz', 'zelazo', 'stal',
];

/** Rdzeń paska budowy — ZAWSZE widoczny, także przy 0 (podstawowe materiały budowlane),
 *  żeby UI surowców był obecny od tury 1 (C-SURUI=A, Maciej 2026-07-24). */

// pin edb8fb56 gra/src/ui/cityPanel.ts:6161-6163
export const CS_RES_STRIP_CORE: ReadonlySet<string> = new Set(['drewno', 'kamien']);

/** Rozmiar ikon surowców na pasku budowy/rekrutacji (2× względem pierwotnych 16px). */

// pin edb8fb56 gra/src/ui/cityPanel.ts:6164-6172
export const CS_RES_STRIP_ICON_PX = 32;

/**
 * SUROW-UI-B1: pasek „ikona + ilość" surowców magazynowanych (pula PAŃSTWA ownera) —
 * forma uproszczona wg mockupu (Total War-style, bez przyrostu/turę — w mieście liczy
 * się tylko „ile mam"). C-SURUI=A: rdzeń (drewno+kamień) pokazywany ZAWSZE, także przy 0;
 * pozostałe surowce tylko gdy owner ma > 0 (żeby nie zaśmiecać zerami metali/rud epok, których
 * jeszcze nie ma). Dzięki temu pasek jest widoczny od startu gry, a nie chowa się przy pustej puli.
 */

// pin edb8fb56 gra/src/ui/cityPanel.ts:6471-6477
export function yieldBrandIconHtml(brandId: string, size: BrandIconSize = 14): string {
  if (brandId === 'loaf') return `<span class="civ-cs-inline-loaf">${loafIconHtml('civ-v-loaf-chip')}</span>`;
  if (brandId === 'science-owl') return `<span class="civ-cs-chip-ic-wrap">${scienceOwlIconHtml()}</span>`;
  return cityPanelChipIconWrap(brandId, size);
}

/** Poziom budynku do wyświetlenia w katalogu / karcie (C-PRZYROST=A — jak silnik). */

// pin edb8fb56 gra/src/ui/cityPanel.ts:6635-6636
export const BUILDING_UPKEEP_ZERO_LABEL = 'utrzymanie zero';


// pin edb8fb56 gra/src/ui/cityPanel.ts:6776-6788
export function formatConverterAmount(v: number): string {
  const r1 = Math.round(v * 10) / 10;
  return Number.isInteger(r1) ? String(r1) : fmtDecPl(r1, 1);
}

/**
 * Wiersz HTML „bilansu produkcji" konwertera — wejścia na pomarańczowo, wyjście
 * na zielono (N6, Maciej werdykt runda 1: odcień wejść odróżnialny od koloru
 * utrzymania `bld-owned-upkeep`, plus prefiks „Prod.:" — rozdzielenie
 * SEMANTYCZNE, nie tylko strukturalne, „kosztu utrzymania" od „kosztu
 * produkcji"). Decyzja prowizoryczna orkiestratora pod presją czasu (Maciej
 * upoważnił pracę autonomiczną bez ABC) — może zostać odwrócona na jego słowo.
 */

// pin edb8fb56 gra/src/ui/cityPanel.ts:6812-6813
export type BuildingReqChipKind = 'tech' | 'stock' | 'other';


// pin edb8fb56 gra/src/ui/cityPanel.ts:6814-6820
export interface BuildingReqChip {
  label: string;
  met: boolean;
  iconHtml?: string;
  kind: BuildingReqChipKind;
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:6965-6969
export function buildingReqChipSpan(chip: Pick<BuildingReqChip, 'label' | 'met' | 'iconHtml'>): string {
  const cls = chip.met ? 'bld-req-chip met' : 'bld-req-chip unmet';
  return `<span class="${cls}">${chip.iconHtml ?? ''}${chip.label}</span>`;
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:6970-6973
export function buildingRequirementChipsHtml(chips: BuildingReqChip[]): string {
  return chips.map(c => buildingReqChipSpan(c)).join('');
}


// pin edb8fb56 gra/src/ui/cityPanel.ts:6974-6979
export const BUILDING_REQ_SECTION_LABELS: Record<BuildingReqChipKind, string> = {
  tech: 'Wymagane badania',
  stock: 'Wymagane surowce',
  other: 'Wymagane warunki',
};


// pin edb8fb56 gra/src/ui/cityPanel.ts:7136-7137
export const EPOCH_LABEL: Record<number, string> = { 1: 'Kamień', 2: 'Brąz', 3: 'Żelazo' };


// pin edb8fb56 gra/src/ui/cityPanel.ts:7138-7142
export function epochLabelNum(n: number): string {
  return EPOCH_LABEL[n] ?? `Epoka ${n}`;
}

/** Świątynia/kolumny — emblemat „Cuda świata” (KANON 1E, ten sam glif co dawny toolbar). */

// pin edb8fb56 gra/src/ui/cityPanel.ts:7143-7153
export function isEmptyDataVal(v: unknown): boolean {
  return v == null || v === '' || v === '—' || v === '-';
}

/**
 * Ukrywa wewnętrzne notatki decyzyjne (PYTANIE/DECYZJA/DEC-...) przed graczem, gdy CAŁA
 * notatka jest wewnętrzna (nic legalnego do pokazania). Odniesienia „ABC-<numer>:"
 * współistniejące z legalnym tekstem w tej samej notatce (np. „kończy Epokę 1; ABC-7:
 * Popalnia brązu na mapie") NIE mają trafiać tutaj — patrz `stripInlineDevAnnotations()`
 * niżej i P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1 runda 2.
 */

// pin edb8fb56 gra/src/ui/cityPanel.ts:7154-7191
export function isDevOnlyPlayerText(text: string): boolean {
  const t = text.trim();
  return /^PYTANIE\s+\d+/i.test(t)
    || /^DECYZJA\b/i.test(t)
    || /^DEC-\d{8}/i.test(t)
    || /\bpatrz\s+unit-building-bonuses/i.test(t);
}

/**
 * NAPRAWA (P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1, runda 2): runda 1 dodała rozpoznawanie
 * wzorca „ABC-<numer>" do `isDevOnlyPlayerText()` (funkcja odrzucająca CAŁĄ notatkę),
 * co spowodowało REGRES — dla `tech.json` Brązownictwo, Uwagi = „kończy Epokę 1; ABC-7:
 * Popalnia brązu na mapie", cała notatka znikała graczowi, w tym legalna część „kończy
 * Epokę 1", nie tylko dev-adnotacja „ABC-7: ...". Naprawa: wzorzec „ABC-<numer>:" (wraz z
 * otaczającą interpunkcją, np. „; ABC-7: ...", aż do końca zdania/stringa) jest tu
 * WYCINANY, a reszta notatki (legalny tekst) zostaje — analogicznie do już istniejącego
 * wzorca „PYTANIE ...=.../(Maciej daty)" niżej.
 *
 * NAPRAWA 2 (P-BUDYNKI-UWAGI-ABC-CZESCIOWY-WYCIEK-Q1): dwie dodatkowe klasy wycieku,
 * potwierdzone realnymi wpisami `uwagi` w `buildings.json`:
 *
 * 1. Partial-strip do pierwszej kropki — powyższy regex `[^.]*\.?` wycinał notatkę dev
 *    tylko do PIERWSZEGO zdania, więc notatka wielozdaniowa (np. Port, linia ok. 442:
 *    „ABC-20 B: ... . LANCUCH W GORE: ... . Pole 'przyrost' ... martwe. Budowla portowa
 *    ...") zostawiała środkowe zdania dev-tekstu graczowi. Naprawa: gdy w całym tekście
 *    są ≥2 kropki, adnotację „ABC-<numer>:" wycinamy od jej początku AŻ DO POCZĄTKU
 *    OSTATNIEGO zdania całego tekstu (traktowanego jako potencjalnie legalna końcówka),
 *    zamiast tylko do najbliższej kropki — patrz `boundary` niżej. Gdy marker sam
 *    znajduje się w tym ostatnim zdaniu (albo kropek jest <2), zachowanie jest identyczne
 *    jak dawniej (wycięcie tylko jednego zdania z markerem) — zero regresu dla
 *    dotychczasowych, jednozdaniowych przypadków (w tym wszystkie istniejące wpisy
 *    `tech.json`).
 * 2. Brak dwukropka po numerze ABC — adnotacje parentetyczne w stylu „(merge bez zmian,
 *    ABC-21 B)." (numer ABC na KOŃCU nawiasu, bez dwukropka zaraz po nim) w ogóle nie
 *    pasowały do wzorca `ABC-\d+...\s*:`. Naprawa: osobny krok wycina W CAŁOŚCI każdy
 *    nawias `(...)`, który zawiera gdziekolwiek w środku wzorzec „ABC-<numer>[litera]"
 *    — niezależnie od pozycji dwukropka (a właściwie jego braku) wewnątrz nawiasu.
 */

// pin edb8fb56 gra/src/ui/cityPanel.ts:7192-7229
export function stripInlineDevAnnotations(text: string): string {
  let out = text
    .replace(/^PYTANIE\s+\d+\s*=\s*[ABC]\s*\([^)]*\)\s*:?\s*/i, '')
    .replace(/\bPYTANIE\s+\d+\s*=\s*[ABC]\s*\([^)]*\)/gi, '')
    .replace(/\(Maciej\s+\d{4}-\d{2}-\d{2}\)/g, '')
    .replace(/\bdecyzj[aą]\s+Maciej\s+\d{4}-\d{2}-\d{2}/gi, '')
    // Adnotacja ABC- w nawiasie, NIEZALEŻNIE od pozycji dwukropka (a właściwie jego
    // braku) w środku, np. „(merge bez zmian, ABC-21 B)." — cały nawias wycinany.
    .replace(/\s*\([^()]*\bABC-\d+(?:\s?[A-Za-z])?\b[^()]*\)/gi, '');

  // Adnotacja ABC- z dwukropkiem: „ABC-<numer>[litera]: ...". Może obejmować więcej niż
  // jedno zdanie (ciąg dev-tekstu bez własnego markera w kolejnych zdaniach — patrz opis
  // NAPRAWA 2 pkt 1 wyżej). Wycinamy od początku markera (wraz z otaczającą interpunkcją)
  // do początku OSTATNIEGO zdania całego tekstu — chyba że marker sam jest w tym ostatnim
  // zdaniu (albo kropek jest <2), wtedy jak dawniej: tylko to jedno zdanie z markerem.
  const leadRe = /[\s;,.]*\bABC-\d+(?:\s?[A-Za-z])?\s*:\s*/i;
  const m = leadRe.exec(out);
  if (m) {
    const spanStart = m.index;
    const markerStart = out.indexOf('ABC-', spanStart);
    const dots = [];
    for (let i = 0; i < out.length; i++) if (out[i] === '.') dots.push(i);
    // Początek ostatniego zdania = tuż po przedostatniej kropce; przy <2 kropkach cały
    // tekst liczy się jako „ostatnie zdanie" (boundary=0 -> zawsze stara ścieżka niżej).
    const secondLastDot = dots.length >= 2 ? dots[dots.length - 2] : undefined;
    const boundary = secondLastDot !== undefined ? secondLastDot + 1 : 0;
    if (markerStart < boundary) {
      out = out.slice(0, spanStart) + ' ' + out.slice(boundary);
    } else {
      out = out.replace(/[\s;,.]*\bABC-\d+(?:\s?[A-Za-z])?\s*:\s*[^.]*\.?/i, ' ');
    }
  }

  return out
    .replace(/\s{2,}/g, ' ')
    .trim();
}
