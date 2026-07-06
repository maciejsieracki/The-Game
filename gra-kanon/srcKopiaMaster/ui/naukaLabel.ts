/** Etykieta tekstowa zamiast mikroskopu (🔬) przy zasobie Nauka. */

export const NAUKA_WORD = 'Nauka';

/** Górny pasek zasobów panelu miasta (.civ-v-res-icon). */
export function naukaResWordHtml(): string {
  return `<span class="civ-v-res-word-nauka">${NAUKA_WORD}</span>`;
}

/** HUD mapy (.civ-hud .res .ic). */
export function naukaHudWordHtml(): string {
  return `<span class="ic-word-nauka">${NAUKA_WORD}</span>`;
}

/** Jednostka kosztu badania technologii. */
export function naukaCostSuffix(): string {
  return ' pkt nauki';
}
