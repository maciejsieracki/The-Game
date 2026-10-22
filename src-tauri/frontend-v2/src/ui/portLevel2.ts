/**
 * portLevel2.ts — zbiór modułów przeniesionych w P5.5 (`R-RUSTPORT-P5-5-PORT-POZIOM2-Q1`;
 * `PORTING-QUEUE.md` wiersze 46–68 oraz 71, 72, 74): PRZECHODNIE poziomu 1 spoza P5.3, poziom 2 bez cyklu
 * i moduły poziomu 3 bez cyklu, których każda zależność UI jest po tym porcie w `frontend-v2`.
 *
 * Importowany DYNAMICZNIE z `main.ts` po instalacji `StaticCatalogDto` (ZAŁOŻENIE P5.2-Z1: `buildModeHud.ts`,
 * `techTreeView.ts`, `wikiHubHud.ts` czytają katalog przy ewaluacji modułu), żeby `vite build` kompilował
 * wszystkie moduły. Nie montuje żadnego panelu — wiązanie z ekranem gry to kolejne tematy P5.x
 * (ZAŁOŻENIE P5.5-Z1, jak P5.3-Z1/P5.4-Z1).
 */
export * as leaderBannersHud from './leaderBannersHud';
export * as cityCaptureNotice from './cityCaptureNotice';
export * as cityForeignPick from './cityForeignPick';
export * as cityUnitPick from './cityUnitPick';
export * as gamePauseMenu from './gamePauseMenu';
export * as hotSeatHandoff from './hotSeatHandoff';
export * as mainMenu from './mainMenu';
export * as unitForeignPick from './unitForeignPick';
export * as buildModeHud from './buildModeHud';
export * as diplomacyPanel from './diplomacyPanel';
export * as techTreeView from './techTreeView';
export * as unitInfoCard from './unitInfoCard';
export * as wikiHubHud from './wikiHubHud';
export * as unitPanelHud from './unitPanelHud';
export * as contextPanelHud from './contextPanelHud';
export * as diplomacyProposalBanner from './diplomacyProposalBanner';
export * as hudChip6c from './hudChip6c';
export * as mapToolbarHud from './mapToolbarHud';
export * as armyMergePickPanel from './armyMergePickPanel';
export * as armySplitPanel from './armySplitPanel';
export * as diplomacyPendingHud from './diplomacyPendingHud';
export * as interHumanDiplomacyHud from './interHumanDiplomacyHud';
export * as unitReplacePicker from './unitReplacePicker';
export * as armyStackHud from './armyStackHud';
export * as diploListHud from './diploListHud';
export * as unitActionBarHtml from './unitActionBarHtml';

/** Ścieżki modułów P5.5 (kolejność = `PORTING-QUEUE.md`). */
export const PORTED_LEVEL2: readonly string[] = [
  'leaderBannersHud.ts',
  'cityCaptureNotice.ts',
  'cityForeignPick.ts',
  'cityUnitPick.ts',
  'gamePauseMenu.ts',
  'hotSeatHandoff.ts',
  'mainMenu.ts',
  'unitForeignPick.ts',
  'buildModeHud.ts',
  'diplomacyPanel.ts',
  'techTreeView.ts',
  'unitInfoCard.ts',
  'wikiHubHud.ts',
  'unitPanelHud.ts',
  'contextPanelHud.ts',
  'diplomacyProposalBanner.ts',
  'hudChip6c.ts',
  'mapToolbarHud.ts',
  'armyMergePickPanel.ts',
  'armySplitPanel.ts',
  'diplomacyPendingHud.ts',
  'interHumanDiplomacyHud.ts',
  'unitReplacePicker.ts',
  'armyStackHud.ts',
  'diploListHud.ts',
  'unitActionBarHtml.ts',
];
