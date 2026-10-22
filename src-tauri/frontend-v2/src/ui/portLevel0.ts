/**
 * portLevel0.ts — zbiór paneli POZIOMU 0 przeniesionych w P5.2 (`PORTING-QUEUE.md` wiersze 1–15).
 *
 * Importowany DYNAMICZNIE z `main.ts` po instalacji `StaticCatalogDto` (ZAŁOŻENIE P5.2-Z1), dzięki
 * czemu `vite build` kompiluje wszystkie 15 modułów (glob SVG/JPG, `?raw`, JSON ikon). Nie montuje
 * żadnego panelu — wiązanie z ekranem gry to kolejne tematy P5.x.
 */
export * as brandAssets from './icons/brandAssets';
export * as leaderPortraits from './leaderPortraits';
export * as uiParams from './uiParams';
export * as unitInfographic from './unitInfographic';
export * as powerLabels from './power-labels';
export * as unitMiniPreview from './unitMiniPreview';
export * as civBrandDisplay from './civBrandDisplay';
export * as diplomacyAcceptanceBalance from './diplomacyAcceptanceBalance';
export * as techUnlockParse from './techUnlockParse';
export * as minimapHud from './minimapHud';
export * as perfReport from './perfReport';
export * as improvementBuildConfirm from './improvementBuildConfirm';
export * as mapLoadingOverlay from './mapLoadingOverlay';
export * as saveLoadDialog from './saveLoadDialog';
export * as victoryScreen from './victoryScreen';

/** Ścieżki modułów poziomu 0 (kolejność = `PORTING-QUEUE.md` wiersze 1–15). */
export const PORTED_LEVEL0: readonly string[] = [
  'icons/brandAssets.ts',
  'leaderPortraits.ts',
  'uiParams.ts',
  'unitInfographic.ts',
  'power-labels.ts',
  'unitMiniPreview.ts',
  'civBrandDisplay.ts',
  'diplomacyAcceptanceBalance.ts',
  'techUnlockParse.ts',
  'minimapHud.ts',
  'perfReport.ts',
  'improvementBuildConfirm.ts',
  'mapLoadingOverlay.ts',
  'saveLoadDialog.ts',
  'victoryScreen.ts',
];
