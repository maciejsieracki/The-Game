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

/** Dolna krawędź górnego banera HUD (chipy religji itd.) — ~HUD_TOP_PX + shell + chip. */
export const HUD_MAP_BANNER_BOTTOM_PX = HUD_LEADER_TOP_PX;
/** Odstęp panelu wydarzeń nad stosem Wykonaj / Zakończ turę. */
export const EVENTS_PANEL_ABOVE_TURN_GAP_PX = 12;
/** Odstęp panelu wydarzeń pod górnym banerem HUD. */
export const EVENTS_PANEL_BELOW_TOP_GAP_PX = 10;
/** Wysokość wiersza chipów w prawym banerze (shell + medalion). */
export const HUD_RIGHT_CHIP_ROW_H_PX = 52;
/** Wysokość przycisków Civpedia/Menu (ten sam wiersz co chipy). */
export const HUD_RIGHT_ACTION_ROW_H_PX = 42;
/** Odstęp między chipami a przyciskami Civpedia/Menu (prawy klaster mapy). */
export const HUD_RIGHT_RAIL_ROW_GAP_PX = 8;

/** Dolna krawędź prawego klastra mapy (chipy + Civpedia/Menu w jednym rzędzie) od góry viewportu. */
export function hudRightRailBottomPx(): number {
  return HUD_TOP_PX + Math.max(HUD_RIGHT_CHIP_ROW_H_PX, HUD_RIGHT_ACTION_ROW_H_PX);
}

/** CSS `right` klastra Wiki/Menu w widoku miasta. */
export function cityViewRightClusterRightCss(): string {
  return `calc(${CITY_EDGE_PX}px + min(26vw,${CITY_RIGHT_PANEL_W_PX}px) + ${CITY_RAIL_GAP_PX}px + ${CITY_ICON_RAIL_W_PX}px + ${HUD_GAP_PX}px)`;
}

/** Dolna krawędź stosu bottomBarHud (Wykonaj + Zakończ turę) od dołu viewportu. */
export function turnStackBottomPx(zoom = false): number {
  const edge = zoom ? HUD_ZOOM_EDGE_PX : HUD_EDGE_PX;
  return edge
    + BOTTOM_BAR_WYKONAJ_H_PX
    + HUD_GAP_PX
    + BOTTOM_BAR_END_TURN_H_PX
    + BOTTOM_BAR_TURN_LABEL_H_PX;
}

/** Dolna krawędź panelu wydarzeń — nad stosem tury z odstępem. */
export function eventsPanelBottomPx(zoom = false): number {
  return turnStackBottomPx(zoom) + EVENTS_PANEL_ABOVE_TURN_GAP_PX;
}

/** Górna krawędź panelu wydarzeń — pod prawym klastrem (chipy + akcje) z odstępem. */
export function eventsPanelTopPx(): number {
  return Math.max(
    HUD_MAP_BANNER_BOTTOM_PX,
    hudRightRailBottomPx(),
  ) + EVENTS_PANEL_BELOW_TOP_GAP_PX;
}
