/**
 * minimapLayout.ts — wspólna geometria minimapy i docku karty jednostki (Maciej 2026-07-28).
 * Jedno źródło prawdy dla sidePanelHud · minimapHud · hud.ts (util dock).
 */

import { HUD_EDGE_PX } from './hudLayout';

/** Margines od krawędzi viewportu (px) — alias HUD_EDGE_PX. */
export const MINIMAP_EDGE_PX = HUD_EDGE_PX;

/** Miejsce pod pasek zoom/pełny ekran pod minimapą (hud.ts .civ-hud-util-dock). */
export const MINIMAP_UTIL_DOCK_RESERVE_PX = 50;

/** Szerokość / wysokość canvasu minimapy (px). */
export const MINIMAP_W_PX = 280;
export const MINIMAP_H_PX = 170;

/** Obwódka minimapy (border 3px × 2). */
export const MINIMAP_BORDER_PX = 6;

/** Odstęp między górną krawędzią minimapy a dolną krawędzią docku karty jednostki. */
export const UNIT_CARD_ABOVE_MINIMAP_GAP_PX = 28;

/** Dolna krawędź docku karty jednostki od dołu viewportu (px). */
export function unitCardDockBottomPx(): number {
  return MINIMAP_EDGE_PX
    + MINIMAP_UTIL_DOCK_RESERVE_PX
    + MINIMAP_H_PX
    + MINIMAP_BORDER_PX
    + UNIT_CARD_ABOVE_MINIMAP_GAP_PX;
}

/** CSS `bottom` minimapy (px od dołu) — canvas + border, nad util dockiem. */
export function minimapWrapBottomCss(): string {
  return `calc(${MINIMAP_EDGE_PX}px + ${MINIMAP_UTIL_DOCK_RESERVE_PX}px)`;
}
