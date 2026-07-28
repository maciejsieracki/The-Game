/**
 * sidePanelLayout.ts — JEDNO wspólne źródło prawdy dla pozycji paneli otwieranych
 * z lewego toolbara mapy (mapToolbarHud.ts): Miasta, Badania (scienceHubHud +
 * sciencePicker dock), Dyplomacja, Wojsko, Civpedia (wikiHubHud).
 *
 * Zgłoszenie właściciela (Maciej, 2026-07-26, playtest): panele nachodziły na
 * przyciski toolbara (left za mały) i panel Badań dodatkowo zachodził na górny
 * pasek chipów (top za mały — było 56px, hardkodowane osobno w 6 plikach jako
 * `calc(58px + 10px)` / `TOP_H = 56`, niezgodne z realną geometrią toolbara).
 *
 * Reguła: left = prawa krawędź medalionów toolbara (TOOLBAR_LEFT_PX + TOOLBAR_BTN_PX,
 * patrz mapToolbarHud.ts) + margines; top = top toolbara (już z zapasem pod górnym
 * paskiem chipów hud.ts, `.civ-hud-banner-left`: top 16px + ok. 50px wiersza chipów).
 * Wszystkie panele boczne mają używać `SIDE_PANEL_LEFT` / `SIDE_PANEL_TOP` zamiast
 * własnych, osobno wyliczanych stałych.
 */

import {
  SIDE_PANEL_LEFT_MARGIN_PX,
  TOOLBAR_BTN_PX,
  TOOLBAR_LEFT_PX,
  TOOLBAR_TOP_PX,
} from './hudLayout';

/** Lewa krawędź paneli bocznych (px) — prawa krawędź toolbara + margines. */
export const SIDE_PANEL_LEFT_PX = TOOLBAR_LEFT_PX + TOOLBAR_BTN_PX + SIDE_PANEL_LEFT_MARGIN_PX;
/** j.w., gotowe do wstawienia w CSS (`left:${SIDE_PANEL_LEFT}`). */
export const SIDE_PANEL_LEFT = `${SIDE_PANEL_LEFT_PX}px`;

/** Górna krawędź paneli bocznych (px) — zgodna z top toolbara, czyści pasek chipów. */
export const SIDE_PANEL_TOP_PX = TOOLBAR_TOP_PX;
/** j.w., gotowe do wstawienia w CSS (`top:${SIDE_PANEL_TOP}`). */
export const SIDE_PANEL_TOP = `${SIDE_PANEL_TOP_PX}px`;
