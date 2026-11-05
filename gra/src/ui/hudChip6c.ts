/**
 * Chip HUD 6C (Design System 1E) — medalion + etykieta PL + wartość + przyrost.
 * Kanon: The Game - HUD Mapy layout (1E).dc.html
 */

import { brandIconSvg } from './icons/brandAssets';
import type { IconId } from './icons/iconRegistry';
import { iconHtml } from './icons/iconRegistry';
import { scienceOwlIconSized } from './icons/scienceOwlIcon';
import { scienceProgressRingHtml } from './icons/scienceProgressRing';
import { signedPl } from './formatPl';

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export type ChipMedVariant = 'gold' | 'science';

export interface Chip6cOpts {
  iconId: IconId;
  /** Nadpisanie assetu brand-book (np. cp-granary zamiast res-food). */
  iconAssetId?: string;
  label: string;
  value: string;
  rate?: string;
  rateWarn?: boolean;
  /** R-WEB-HUD-RESOURCE-DEFICIT-RED-Q1: niedobór → etykieta/wartość/przyrost czerwoną czcionką
   *  (klasa `civ-hud-chip-short`, styl w hud.ts) zamiast złotej. Tylko prezentacja. */
  shortage?: boolean;
  medVariant?: ChipMedVariant;
  valClass?: string;
  act?: string;
  title?: string;
  /** R-WEB-HUD-NUMBER-ABBREV-Q1: pełna (nieskrócona) wartość, np. „Dokładnie: 20 860 (+1 257)" —
   *  dopisywana do `title` i do `aria-label`, gdy value/rate są skrócone („20,9k"). */
  exact?: string;
  /** Postęp badań [0..1] — pierścień wokół medalionu Nauki. */
  researchProgress?: number;
  /** R-WEB-HUD-TOPBAR-GRID-GROSS-NET-Q1: komórka siatki 3+3 — trzy linie (etykieta+wartość /
   *  „brutto" `rate` / „netto" `net`). Brak `net` → układ klasyczny (prawy baner). */
  net?: string;
  /** Znak netto → kolor: 'neg' czerwony (niedobór), 'pos' zielony, 'zero' stonowany. */
  netTone?: 'pos' | 'neg' | 'zero';
  /** Ton (kolor) liczby brutto w banerze: 'neg' czerwony, 'pos' zielony, 'zero' stonowany. */
  rateTone?: 'pos' | 'neg' | 'zero';
  /** R-WEB-HUD-TOPBAR-NO-LABELS-Q1: dopisek do tooltipa — która liczba jest brutto, a która netto. */
  netHint?: string;
}

/** IconId → id realnego assetu brand-book, gdy różny od klucza chipa (patrz iconRegistry.ts). */
const CHIP_ICON_ASSET_ALIAS: Partial<Record<IconId, string>> = {
  'res-resources': 'chip-crate',
};

function chipIconHtml(id: IconId, _medVariant: ChipMedVariant, assetOverride?: string): string {
  if (id === 'res-science' || id === 'tb-science') {
    return scienceOwlIconSized(17);
  }
  const assetId = assetOverride ?? CHIP_ICON_ASSET_ALIAS[id] ?? id;
  const svg = brandIconSvg(assetId, 24);
  if (!svg) return iconHtml(id, 24);
  return svg.replace('<svg ', '<svg class="civ-ic" ');
}

/** Pojedynczy chip 6C (poziomy wiersz z separatorem po). */
export function chip6cHtml(opts: Chip6cOpts): string {
  const med = opts.medVariant ?? (opts.iconId === 'res-science' ? 'science' : 'gold');
  const clickCls = (opts.act ? ' civ-hud-chip-click' : '') + (opts.shortage ? ' civ-hud-chip-short' : '');
  const titleTxt = (opts.title ?? opts.label) + (opts.exact ? ' · ' + opts.exact : '')
    + (opts.netHint ? ' · ' + opts.netHint : '');
  const ariaAttr = opts.exact ? ` aria-label="${escHtml(opts.label + ': ' + opts.exact)}"` : '';
  const actAttr = opts.act
    ? ` data-act="${opts.act}" role="button" tabindex="0" title="${escHtml(titleTxt)}"${ariaAttr}`
    : '';
  const valCls = opts.valClass ?? (med === 'science' ? ' science' : '');
  const rateCls = opts.rateWarn ? ' warn' : '';
  const showRing = opts.iconId === 'res-science' && opts.researchProgress !== undefined;
  const medInner = showRing
    ? `${scienceProgressRingHtml(opts.researchProgress!, 30, 1)}<span class="civ-hud-chip-med-ic">${chipIconHtml(opts.iconId, med, opts.iconAssetId)}</span>`
    : chipIconHtml(opts.iconId, med, opts.iconAssetId);
  const medCls = showRing ? `${med} civ-science-med-ring` : med;
  if (opts.net !== undefined) {
    // R-WEB-HUD-TOPBAR-NO-LABELS-Q1: w banerze BEZ słów „brutto"/„netto". Linia 1 = etykieta;
    // linia 2 = DUŻA liczba całkowita + OBOK dwie liczby przyrostu: najpierw brutto, potem netto
    // (same liczby ze znakiem, rozdzielone ukośnikiem). Znaczenie obu liczb jest w tooltipie (netHint).
    const netT = opts.netTone ?? 'zero';
    const rateT = opts.rateTone ?? 'zero';
    const figs = opts.rate !== undefined
      ? `<span class="civ-hud-chip-figs"><span class="civ-hud-chip-rate ${rateT}${rateCls}">${opts.rate}</span>`
        + `<span class="civ-hud-chip-fsep" aria-hidden="true">/</span>`
        + `<span class="civ-hud-chip-net ${netT}">${opts.net}</span></span>`
      : `<span class="civ-hud-chip-figs"><span class="civ-hud-chip-net ${netT}">${opts.net}</span></span>`;
    return `<span class="civ-hud-chip civ-hud-chip-cell${clickCls}"${actAttr}>`
      + `<span class="civ-hud-chip-med ${medCls}">${medInner}</span>`
      + `<span class="civ-hud-chip-body">`
      + `<span class="civ-hud-chip-top"><span class="civ-hud-chip-lbl">${opts.label}</span></span>`
      + `<span class="civ-hud-chip-line"><span class="civ-hud-chip-val${valCls}">${opts.value}</span>${figs}</span>`
      + `</span></span>`;
  }
  let html = `<span class="civ-hud-chip${clickCls}"${actAttr}>`
    + `<span class="civ-hud-chip-med ${medCls}">${medInner}</span>`
    + `<span class="civ-hud-chip-lbl">${opts.label}</span>`
    + `<span class="civ-hud-chip-val${valCls}">${opts.value}</span>`;
  if (opts.rate !== undefined) {
    html += `<span class="civ-hud-chip-rate${rateCls}">${opts.rate}</span>`;
  }
  html += '</span>';
  return html;
}

export function chip6cSep(): string {
  return '<span class="civ-hud-chip-sep" aria-hidden="true"></span>';
}

/**
 * R-WEB-HUD-GROSS-NET-REST-Q1 — JEDNA wspólna konwencja zapisu „BRUTTO → NETTO" dla tooltipów
 * HUD (prawy baner) i karty miasta: `BRUTTO +12 → NETTO +9 jednostka/turę`. Tylko prezentacja;
 * liczby podaje wywołujący z tych samych pól HUD-state co wartości widoczne na chipie.
 */
export function formatGrossNet(gross: number, net: number, unit?: string): string {
  return `BRUTTO ${signedPl(gross)} \u2192 NETTO ${signedPl(net)}${unit ? ' ' + unit : ''}`;
}
