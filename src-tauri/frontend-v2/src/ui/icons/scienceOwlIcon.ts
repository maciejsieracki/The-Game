/**
 * Ikona badań — sowa z biretem (Design: res-science / tb-science).
 * SVG line-art, skaluje się przez currentColor + CSS (.civ-science-owl-ic).
 */

import resScience24 from './brand/tier1/res-science-24.svg?raw';

const OWL_CLASS = 'civ-science-owl-ic';

function normalizeOwlSvg(raw: string, size?: number): string {
  let out = raw
    .replace(/stroke="#5a9bd4"/gi, 'stroke="currentColor"')
    .replace(/stroke="#e8d88a"/gi, 'stroke="currentColor"');
  if (size != null) {
    out = out.replace(/\swidth="[^"]*"/, ` width="${size}"`);
    out = out.replace(/\sheight="[^"]*"/, ` height="${size}"`);
  }
  out = out.replace(/stroke-width="1\.5"/, 'stroke-width="2"');
  const head = out.slice(0, out.indexOf('>') + 1);
  if (!/\bclass="/.test(head)) {
    out = out.replace('<svg ', `<svg class="${OWL_CLASS}" `);
  } else if (!out.includes(OWL_CLASS)) {
    out = out.replace(/class="/, `class="${OWL_CLASS} `);
  }
  return out;
}

export const SCIENCE_OWL_SVG = normalizeOwlSvg(resScience24);

/** HTML do wstawienia w przycisk toolbaru / nagłówki. */
export function scienceOwlIconHtml(): string {
  return SCIENCE_OWL_SVG;
}

/** Sowa z jawnym rozmiarem (px). */
export function scienceOwlIconSized(size: number): string {
  return normalizeOwlSvg(resScience24, size);
}
