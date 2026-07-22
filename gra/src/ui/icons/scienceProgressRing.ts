/**
 * Pierścień postępu badań na ikonie Nauki (HUD).
 * Złoto = pozostała część; niebieski rośnie zgodnie z ruchem wskazówek od góry.
 */

/** Zgodne z --tg-gold-dim (rant medalionu przed pierścieniem postępu). */
const RING_GOLD = '#a08030';
const RING_BLUE = '#5a9bd4';

/** SVG pierścienia [0..1] — fraction=0 całe złote, fraction=1 całe niebieskie. */
export function scienceProgressRingHtml(
  fraction: number,
  size: number,
  strokeWidth = 2.5,
): string {
  const f = Math.max(0, Math.min(1, fraction));
  const cx = size / 2;
  const r = cx - strokeWidth / 2;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - f);
  return `<svg class="civ-science-prog-ring" viewBox="0 0 ${size} ${size}" aria-hidden="true">`
    + `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${RING_GOLD}" stroke-width="${strokeWidth}"/>`
    + `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${RING_BLUE}" stroke-width="${strokeWidth}"`
    + ` stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${dashOffset.toFixed(2)}"`
    + ` transform="rotate(-90 ${cx} ${cx})"/>`
    + `</svg>`;
}
