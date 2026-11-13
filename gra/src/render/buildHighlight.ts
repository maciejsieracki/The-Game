/** Shared visual and eligibility rules for map improvement-build highlights. */
export const MAP_HEX_HIGHLIGHT_BASE_OPACITY = 0.35;
export const MINE_ELIGIBLE_BASE_OPACITY = 0.3;
export const IMPROVEMENT_BUILD_HIGHLIGHT_BRIGHTNESS = 1.2;

/** Opacity is the alpha contribution of the cyan tint; +20% is relative to its previous value. */
export const IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY =
  MAP_HEX_HIGHLIGHT_BASE_OPACITY * IMPROVEMENT_BUILD_HIGHLIGHT_BRIGHTNESS;
export const MINE_BUILD_HIGHLIGHT_OPACITY =
  MINE_ELIGIBLE_BASE_OPACITY * IMPROVEMENT_BUILD_HIGHLIGHT_BRIGHTNESS;

export interface BuildHighlightHex {
  q: number;
  r: number;
}

/**
 * Pending builds remain clickable so the player can undo them during the current turn,
 * but are not build destinations. Keep them out of the placement overlay while leaving
 * the underlying build API/click behavior intact.
 */
export function filterBuildHighlightHexes(
  improvementKey: string,
  hexes: readonly BuildHighlightHex[],
  pendingUndoKeys: ReadonlySet<string>,
): BuildHighlightHex[] {
  return hexes.filter(({ q, r }) => !pendingUndoKeys.has(`${q},${r}:${improvementKey}`));
}
