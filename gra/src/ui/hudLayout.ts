/**
 * hudLayout.ts — jedno źródło prawdy dla marginesów HUD mapy i miasta (mockup 1E, FALA 60).
 */

// MAPA (mockup HUD Mapy 1E)
export const HUD_EDGE_PX = 20;
export const HUD_TOP_PX = 16;
export const HUD_GAP_PX = 10;
export const HUD_GAP_MD_PX = 12;
export const HUD_POWER_TOP_PX = 10;
export const HUD_CONTEXT_PANEL_W_PX = 300;
export const HUD_LEADER_TOP_PX = 92;
export const HUD_ZOOM_EDGE_PX = 10;
export const HUD_ZOOM_BOTTOM_PX = 16;

// MIASTO (mockup Ekran Miasto 1E)
export const CITY_EDGE_PX = 32;
export const CITY_RAIL_TOP_PX = 10;
export const CITY_RAIL_GAP_PX = 16;
export const CITY_RIGHT_PANEL_W_PX = 300;
export const CITY_LEFT_PANEL_W_PX = 340;
export const CITY_ICON_RAIL_W_PX = 46;
export const CITY_LEFT_ICON_RAIL_W_PX = 56;

// TOOLBAR (mockup B)
export const TOOLBAR_LEFT_PX = 22;
export const TOOLBAR_TOP_PX = 104;
export const TOOLBAR_BTN_PX = 52;
export const SIDE_PANEL_LEFT_MARGIN_PX = 12;

// Minimapa — przyciski narzędzi obok canvasu
export const MINIMAP_TOOL_BTN_PX = 40;
export const MINIMAP_TOOL_GAP_PX = 10;

/** Wysokości stosu dolnego paska (bottomBarHud) — do wyliczenia turnStackBottomPx. */
export const BOTTOM_BAR_WYKONAJ_H_PX = 52;
export const BOTTOM_BAR_END_TURN_H_PX = 60;
export const BOTTOM_BAR_TURN_LABEL_H_PX = 30;

/** CSS `left` docku zoom/pełny ekran obok minimapy. */
export function utilDockLeftCss(miniW: number, zoom = false): string {
  const edge = zoom ? HUD_ZOOM_EDGE_PX : HUD_EDGE_PX;
  return `calc(${edge}px + ${miniW}px + ${MINIMAP_TOOL_GAP_PX}px + ${MINIMAP_TOOL_BTN_PX}px)`;
}

/** CSS `bottom` docku zoom/pełny ekran. */
export function utilDockBottomCss(zoom = false): string {
  return `${zoom ? HUD_ZOOM_BOTTOM_PX : HUD_EDGE_PX}px`;
}

/** CSS `right` klastra Wiki/Menu w widoku miasta. */
export function cityViewRightClusterRightCss(): string {
  return `calc(${CITY_EDGE_PX}px + min(26vw,${CITY_RIGHT_PANEL_W_PX}px) + ${CITY_RAIL_GAP_PX}px + ${CITY_ICON_RAIL_W_PX}px + ${HUD_GAP_PX}px)`;
}

/** Dolna krawędź panelu wydarzeń — nad stosem bottomBarHud (Wykonaj + Zakończ turę). */
export function turnStackBottomPx(): number {
  return HUD_EDGE_PX
    + BOTTOM_BAR_WYKONAJ_H_PX
    + HUD_GAP_PX
    + BOTTOM_BAR_END_TURN_H_PX
    + BOTTOM_BAR_TURN_LABEL_H_PX;
}
