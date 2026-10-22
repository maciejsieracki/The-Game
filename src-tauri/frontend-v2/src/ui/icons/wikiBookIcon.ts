/** Ikona Wiki — Design ui-wiki.svg (brand-book szata-sync 2026-07-03). */
import { brandIconSvg } from './brandAssets';

const FALLBACK = `<svg class="civ-wiki-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5C4.7 19 4 18.3 4 17.5Z"/><path d="M20 5.5C20 4.7 19.3 4 18.5 4H13v15h5.5c.8 0 1.5-.7 1.5-1.5Z"/><path d="M6.5 8h2.5M15 8h2.5"/></svg>`;

/** HTML ikony Wiki @16|24|26|40 (currentColor, akcent z CSS rodzica). */
export function wikiBookIcon(pixelSize: 16 | 24 | 26 | 40 = 24): string {
  const brandSize: 24 | 40 = pixelSize >= 40 ? 40 : 24;
  let svg = brandIconSvg('ui-wiki', brandSize);
  if (!svg) {
    svg = FALLBACK.replace(/width="[^"]*"/, '').replace(/height="[^"]*"/, '');
  }
  if (!svg.includes('class="civ-wiki-ic"')) {
    svg = svg.replace('<svg ', '<svg class="civ-wiki-ic" aria-hidden="true" ');
  }
  svg = svg.replace(/width="[^"]*"/, ` width="${pixelSize}"`);
  svg = svg.replace(/height="[^"]*"/, ` height="${pixelSize}"`);
  return svg;
}
