/**
 * minimapLayout.ts — wspólna geometria minimapy i docku karty jednostki (Maciej 2026-07-28).
 * Jedno źródło prawdy dla sidePanelHud · minimapHud · hud.ts (util dock).
 */

import { HUD_EDGE_PX, HUD_ZOOM_BOTTOM_PX, HUD_ZOOM_EDGE_PX } from './hudLayout';

/** Margines od krawędzi viewportu (px) — alias HUD_EDGE_PX. */
export const MINIMAP_EDGE_PX = HUD_EDGE_PX;

/** Wysokość paska zoom/pełny ekran nad minimapą (hud.ts .civ-hud-util-dock). */
export const MINIMAP_UTIL_DOCK_H_PX = 46;
/** Odstęp między paskiem zoom a górną krawędzią canvasu minimapy. */
export const MINIMAP_UTIL_DOCK_GAP_PX = 6;

/** @deprecated alias — rezerwa przeniesiona nad minimapę */
export const MINIMAP_UTIL_DOCK_RESERVE_PX = MINIMAP_UTIL_DOCK_H_PX + MINIMAP_UTIL_DOCK_GAP_PX;

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
    + MINIMAP_H_PX
    + MINIMAP_BORDER_PX
    + MINIMAP_UTIL_DOCK_GAP_PX
    + MINIMAP_UTIL_DOCK_H_PX
    + UNIT_CARD_ABOVE_MINIMAP_GAP_PX;
}

/** CSS `bottom` minimapy (px od dołu) — canvas przy dolnej krawędzi stosu. */
export function minimapWrapBottomCss(): string {
  return `${MINIMAP_EDGE_PX}px`;
}

/** CSS `left` docku zoom/pełny ekran — wyrównany z lewą krawędzią minimapy. */
export function utilDockLeftCss(_miniW = MINIMAP_W_PX, zoom = false): string {
  const edge = zoom ? HUD_ZOOM_EDGE_PX : MINIMAP_EDGE_PX;
  return `${edge}px`;
}

/** CSS `bottom` docku zoom/pełny ekran — tuż nad górną krawędzią canvasu minimapy. */
export function utilDockBottomCss(zoom = false): string {
  const edge = zoom ? HUD_ZOOM_BOTTOM_PX : MINIMAP_EDGE_PX;
  return `${edge + MINIMAP_H_PX + MINIMAP_BORDER_PX + MINIMAP_UTIL_DOCK_GAP_PX}px`;
}
