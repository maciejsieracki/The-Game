/**
 * Rejestr ikon Warstwa 1 (3C) — PACZKA FINAL brand-book.
 * SVG: gra/src/ui/icons/brand/ (sync z eksport/ Design).
 */

import { brandIconSvg, type BrandIconSize } from './brandAssets';
import { scienceOwlIconSized } from './scienceOwlIcon';

export type IconId =
  | 'res-food'
  | 'res-work'
  | 'res-treasury'
  | 'res-science'
  | 'res-culture'
  | 'res-religion'
  | 'res-population'
  | 'res-influence'
  | 'res-settlements'
  /** Chip HUD „Surowce" (magazyn państwa) — mapuje na brand-icon 'chip-crate'. */
  | 'res-resources'
  /** TEMAT 14 (Maciej 2026-07-24) — chip HUD „Handel" (dochód z tras handlowych). Mapuje na brand-icon 'cp-trade' (już używany w panelu miasta). */
  | 'res-trade'
  | 'tb-cities'
  | 'tb-science'
  | 'tb-diplomacy'
  | 'tb-army'
  | 'tb-build';

/** IconId → id realnego assetu w manifeście brand-book (gdy różne od klucza IconId). */
const ICON_ID_ALIAS: Partial<Record<IconId, string>> = {
  'res-resources': 'chip-crate',
  'res-trade': 'cp-trade',
};

/**
 * HTML ikony do wstawienia w chip / toolbar.
 * @param size 24 (chip) lub 40 (toolbar)
 */
export function iconHtml(id: IconId, size: BrandIconSize = 24): string {
  if (id === 'res-science' || id === 'tb-science') {
    return scienceOwlIconSized(size);
  }
  const assetId = ICON_ID_ALIAS[id] ?? id;
  const svg = brandIconSvg(assetId, size);
  if (svg) {
    return svg.replace('<svg ', `<svg class="civ-ic civ-ic-${id}" `);
  }
  return '';
}

/** Etykieta PL dla chipów 6C. */
export const ICON_LABELS_PL: Partial<Record<IconId, string>> = {
  'res-food': 'Żywność',
  'res-work': 'Praca',
  'res-treasury': 'Skarbiec',
  'res-science': 'Badania',
  'res-culture': 'Kultura',
  'res-religion': 'Religia',
  'res-population': 'Ludność',
  'res-influence': 'Wpływ',
  'res-settlements': 'Osiedla',
  'res-resources': 'Surowce',
  'res-trade': 'Handel',
};
