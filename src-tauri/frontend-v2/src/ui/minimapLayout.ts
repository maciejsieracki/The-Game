/**
 * minimapLayout.ts — wspólna geometria minimapy i docku karty jednostki (Maciej 2026-07-28).
 * Jedno źródło prawdy dla sidePanelHud · minimapHud · hud.ts (util dock).
 */

import {
  HUD_EDGE_PX,
  HUD_ZOOM_BOTTOM_PX,
  HUD_ZOOM_EDGE_PX,
  MINIMAP_TOOL_BTN_PX,
  MINIMAP_TOOL_GAP_PX,
} from './hudLayout';
import { SIDE_PANEL_TOP_PX } from './sidePanelLayout';

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

/** Szerokość wąskiej karty jednostki (px) — domyślnie = minimapa. */
export const UNIT_CARD_BASE_W_PX = MINIMAP_W_PX;
/** Dodatkowa szerokość kolumny szczegółów przy „Więcej szczegółów” (px). */
export const UNIT_CARD_EXPAND_EXTRA_W_PX = 280;
/** Szerokość rozszerzonej karty jednostki (px) — podstawa + kolumna szczegółów. */
export const UNIT_CARD_EXPANDED_W_PX = UNIT_CARD_BASE_W_PX + UNIT_CARD_EXPAND_EXTRA_W_PX;

/** Obwódka minimapy (border 3px × 2). */
export const MINIMAP_BORDER_PX = 6;

/** Liczba przycisków w kolumnie narzędzi obok minimapy (minimapHud.ts). */
const MINIMAP_TOOL_BTN_COUNT = 4;

/** Odstęp między górną krawędzią paska zoom/pełny ekran a dolną krawędzią docku karty jednostki. */
export const UNIT_CARD_ABOVE_MINIMAP_GAP_PX = 12;

/** Odstęp pod lewym toolbarem / pod górnym banerem HUD (px). */
export const UNIT_CARD_SAFE_TOP_GAP_PX = 8;

/**
 * Dodatkowy lift karty jednostki przy zoom UI >100% (body transform:scale).
 * Wartość w px na każdy +1.0 powyżej 1.0 — używane w CSS calc(var(--civ-ui-zoom)).
 */
export const UNIT_CARD_ZOOM_LIFT_PER_SCALE_PX = 100;

/** Wysokość canvasu minimapy z obwódką (px). */
export function minimapCanvasHeightPx(): number {
  return MINIMAP_H_PX + MINIMAP_BORDER_PX;
}

/** Szacowana wysokość kolumny przycisków obok minimapy (px). */
export function minimapToolsColumnHeightPx(): number {
  const n = MINIMAP_TOOL_BTN_COUNT;
  return n * MINIMAP_TOOL_BTN_PX + (n - 1) * MINIMAP_TOOL_GAP_PX;
}

/** Wysokość wrapa minimapy — max(canvas + border, kolumna narzędzi). */
export function minimapWrapHeightPx(): number {
  return Math.max(minimapCanvasHeightPx(), minimapToolsColumnHeightPx());
}

function minimapEdgePx(zoom = false): number {
  return zoom ? HUD_ZOOM_BOTTOM_PX : MINIMAP_EDGE_PX;
}

/** Górna krawędź paska zoom/pełny ekran od dołu viewportu (px). */
export function utilDockTopPx(zoom = false): number {
  const edge = minimapEdgePx(zoom);
  return edge
    + MINIMAP_H_PX
    + MINIMAP_BORDER_PX
    + MINIMAP_UTIL_DOCK_GAP_PX
    + MINIMAP_UTIL_DOCK_H_PX;
}

/** Górna krawędź safe area karty jednostki (px) — pod toolbarem / banerem HUD. */
export function unitCardSafeTopPx(): number {
  return SIDE_PANEL_TOP_PX + UNIT_CARD_SAFE_TOP_GAP_PX;
}

/** CSS `top` safe area karty jednostki. */
export function unitCardSafeTopCss(): string {
  return `${unitCardSafeTopPx()}px`;
}

/** Dolna krawędź docku karty jednostki od dołu viewportu (px) — nad paskiem zoom. */
export function unitCardDockBottomPx(zoom = false): number {
  return utilDockTopPx(zoom) + UNIT_CARD_ABOVE_MINIMAP_GAP_PX;
}

/** CSS `bottom` docku karty jednostki. */
export function unitCardDockBottomCss(zoom = false): string {
  return `${unitCardDockBottomPx(zoom)}px`;
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

/** CSS `width` docku karty jednostki — wąska karta. */
export function unitCardDockWidthCss(): string {
  return `min(${UNIT_CARD_BASE_W_PX}px,calc(100vw - var(--civ-unit-card-max-right, 0px)))`;
}

/** CSS `width` docku karty jednostki — rozszerzona w prawo. */
export function unitCardDockExpandedWidthCss(): string {
  return `min(${UNIT_CARD_EXPANDED_W_PX}px,calc(100vw - var(--civ-unit-card-max-right, 0px)))`;
}
