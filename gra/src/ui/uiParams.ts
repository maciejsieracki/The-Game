/**
 * uiParams.ts
 * Single typed entry point for the UI parameter panel (Civ-UI).
 *
 * Chain:  UI-parametry.xlsx  --(eksport celowany)-->  data/ui-params.json  -->  THIS module  -->  cityPanel.ts / mainMenu.ts
 *
 * Naster edits UI-parametry.xlsx; a targeted export writes data/ui-params.json
 * (NEVER the full export-data.py -- that would regenerate every JSON and clobber
 * other sessions' work).  The UI modules import UI_PARAMS from here, so changing
 * a number in the Excel (then re-exporting the JSON) changes the running game.
 *
 * LANE: src/ui/* + data/ui-params.json.  Pure data, no DOM, no game logic.
 */

import raw from '../../data/ui-params.json';

/** One selectable font-scale step for the city view. */
export interface UiFontScale {
  /** Button label (ASCII). */
  label: string;
  /** Root font size in px applied to the city overlay. */
  px: number;
}

/** One adjustable global menu setting (audio/video/UI). */
export interface UiMenuSetting {
  key: string;
  label: string;
  opts: string[];
  descs: string[];
  /** Default selected index into opts/descs. */
  domyslny: number;
}

/** One gameplay setting shown in the new-game wizard (newGameFlow.ts). */
export interface UiNowaGraSetting {
  key: string;
  label: string;
  opts: string[];
  descs: string[];
  /** Default selected index into opts/descs. */
  domyslny: number;
}

/** Parameters consumed by the city view (cityPanel.ts). */
export interface UiPanelMiasta {
  /** Wykup (rush-buy) gold cost = ceil(remainingPraca * this). */
  rush_cost_mnoznik: number;
  /** Okolica hex neighbourhood radius (rings around the city centre). */
  okolica_promien: number;
  /** Okolica hex radius in px. */
  okolica_hex_px: number;
  /** Font-scale steps offered in the header. */
  font_scale: UiFontScale[];
  /** Default font size in px on open. */
  font_scale_domyslna_px: number;
}

/** Parameters consumed by the main menu (mainMenu.ts). */
export interface UiMenu {
  /** Numer wersji pokazywany w menu i w stopce, np. „0.5”. Jedno źródło prawdy. */
  wersja: string;
  /**
   * Etap rozwoju pokazywany w stopce obok numeru, np. „alfa”, „beta”, „” dla wydania.
   * Wprowadzony 2026-07-26 (Maciej: „to już nie jest prototyp 0.1”), bo stopka miała
   * zahardkodowane „prototyp v0.1”, niezależne od `wersja` w danych.
   */
  etap?: string;
  /**
   * Czas (ms) liniowego podgłaśniania muzyki intro (menu główne) przy PIERWSZYM
   * starcie strony: utwór startuje od razu przy głośności 0 i rośnie do
   * poziomu z preferencji gracza przez ten czas. Kolejne powroty do menu nie
   * używają fade-in. Patrz resumeIntroMusic() w main.ts.
   */
  muzyka_fade_in_ms: number;
  /**
   * Opóźnienie (ms) przed PIERWSZYM startem muzyki intro (menu główne) w tej
   * sesji strony. Kolejne powroty do menu — bez opóźnienia (patrz
   * resumeIntroMusic() w main.ts). Nie dotyczy crossfade ani muzyki gry.
   */
  muzyka_opoznienie_startu_ms?: number;
  ustawienia: UiMenuSetting[];
}

/** Parameters consumed by the new-game wizard (newGameFlow.ts). */
export interface UiNowaGra {
  ustawienia: UiNowaGraSetting[];
}

/** Full UI parameter bundle. */
export interface UiParams {
  panel_miasta: UiPanelMiasta;
  menu: UiMenu;
  nowa_gra: UiNowaGra;
}

/** Typed, ready-to-use UI parameters loaded from data/ui-params.json. */
export const UI_PARAMS: UiParams = raw as unknown as UiParams;
