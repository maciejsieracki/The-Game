/**
 * Chip HUD 6C (Design System 1E) — medalion + etykieta PL + wartość + przyrost.
 * Kanon: The Game - HUD Mapy layout (1E).dc.html
 */

import { brandIconSvg } from './icons/brandAssets';
import type { IconId } from './icons/iconRegistry';
import { iconHtml } from './icons/iconRegistry';
import { scienceOwlIconSized } from './icons/scienceOwlIcon';
import { scienceProgressRingHtml } from './icons/scienceProgressRing';

export type ChipMedVariant = 'gold' | 'science';

export interface Chip6cOpts {
  iconId: IconId;
  label: string;
  value: string;
  rate?: string;
  rateWarn?: boolean;
  medVariant?: ChipMedVariant;
  valClass?: string;
  act?: string;
  title?: string;
  /** Postęp badań [0..1] — pierścień wokół medalionu Nauki. */
  researchProgress?: number;
}

/** IconId → id realnego assetu brand-book, gdy różny od klucza chipa (patrz iconRegistry.ts). */
const CHIP_ICON_ASSET_ALIAS: Partial<Record<IconId, string>> = {
  'res-resources': 'chip-crate',
};

function chipIconHtml(id: IconId, _medVariant: ChipMedVariant): string {
  if (id === 'res-science' || id === 'tb-science') {
    return scienceOwlIconSized(17);
  }
  const assetId = CHIP_ICON_ASSET_ALIAS[id] ?? id;
  const svg = brandIconSvg(assetId, 24);
  if (!svg) return iconHtml(id, 24);
  return svg.replace('<svg ', '<svg class="civ-ic" ');
}

/** Pojedynczy chip 6C (poziomy wiersz z separatorem po). */
export function chip6cHtml(opts: Chip6cOpts): string {
  const med = opts.medVariant ?? (opts.iconId === 'res-science' ? 'science' : 'gold');
  const clickCls = opts.act ? ' civ-hud-chip-click' : '';
  const actAttr = opts.act
    ? ` data-act="${opts.act}" role="button" tabindex="0" title="${opts.title ?? opts.label}"`
    : '';
  const valCls = opts.valClass ?? (med === 'science' ? ' science' : '');
  const rateCls = opts.rateWarn ? ' warn' : '';
  const showRing = opts.iconId === 'res-science' && opts.researchProgress !== undefined;
  const medInner = showRing
    ? `${scienceProgressRingHtml(opts.researchProgress!, 30, 1)}<span class="civ-hud-chip-med-ic">${chipIconHtml(opts.iconId, med)}</span>`
    : chipIconHtml(opts.iconId, med);
  const medCls = showRing ? `${med} civ-science-med-ring` : med;
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
