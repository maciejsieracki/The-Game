/**
 * portLevel1a.ts — zbiór paneli POZIOMU 1 (bez cyklu) przeniesionych w P5.3
 * (`R-RUSTPORT-P5-3-PORT-LEVEL1A-Q1`; `PORTING-QUEUE.md` wiersze 18, 21, 26, 27, 28, 31, 33, 34, 36–44).
 *
 * Importowany DYNAMICZNIE z `main.ts` po instalacji `StaticCatalogDto` (ZAŁOŻENIE P5.2-Z1), żeby
 * `vite build` kompilował wszystkie moduły. Nie montuje żadnego panelu — wiązanie z ekranem gry to
 * kolejne tematy P5.x (ZAŁOŻENIE P5.3-Z1).
 */
export * as unitCardStatus from './unitCardStatus';
export * as diplomacyDealDisplay from './diplomacyDealDisplay';
export * as orderPanel from './orderPanel';
export * as unitRecruitCard from './unitRecruitCard';
export * as cityAttackChoice from './cityAttackChoice';
export * as postBattleSummary from './postBattleSummary';
export * as siegeMapPanel from './siegeMapPanel';
export * as diploUiSkin from './diploUiSkin';
export * as iconRegistry from './icons/iconRegistry';
export * as mapUnitHudSkin from './mapUnitHudSkin';
export * as armyMergePanel from './armyMergePanel';
export * as wikiBookIcon from './icons/wikiBookIcon';
export * as powerOverlayHud from './powerOverlayHud';
export * as armyListHud from './armyListHud';
export * as bottomBarHud from './bottomBarHud';
export * as cityListHud from './cityListHud';
export * as empireOverlayHud from './empireOverlayHud';

/** Ścieżki modułów P5.3 (kolejność = `PORTING-QUEUE.md`). */
export const PORTED_LEVEL1A: readonly string[] = [
  'unitCardStatus.ts',
  'diplomacyDealDisplay.ts',
  'orderPanel.ts',
  'unitRecruitCard.ts',
  'cityAttackChoice.ts',
  'postBattleSummary.ts',
  'siegeMapPanel.ts',
  'diploUiSkin.ts',
  'icons/iconRegistry.ts',
  'mapUnitHudSkin.ts',
  'armyMergePanel.ts',
  'icons/wikiBookIcon.ts',
  'powerOverlayHud.ts',
  'armyListHud.ts',
  'bottomBarHud.ts',
  'cityListHud.ts',
  'empireOverlayHud.ts',
];
