/**
 * portCycleC4.ts — zbiór modułów CYKLU C4 przeniesionych razem w P5.4
 * (`R-RUSTPORT-P5-4-PORT-CYKL-C4-Q1`; `PORTING-QUEUE.md` wiersze 16, 17, 19, 20, 22–25, 35, 45).
 *
 * Importowany DYNAMICZNIE z `main.ts` po instalacji `StaticCatalogDto` (ZAŁOŻENIE P5.2-Z1: `registry.ts`,
 * `sciencePicker.ts`, `techDiscoveryNotice.ts`, adaptery i `scienceHubHud.ts` czytają katalog przy
 * ewaluacji modułu), żeby `vite build` kompilował wszystkie moduły. Nie montuje żadnego panelu —
 * wiązanie z ekranem gry to kolejne tematy P5.x (ZAŁOŻENIE P5.4-Z1, jak P5.3-Z1).
 */
export * as entityCardsRegistry from './entityCards/registry';
export * as techDiscoveryNotice from './techDiscoveryNotice';
export * as entityCardsUnitAdapter from './entityCards/unitAdapter';
export * as sciencePicker from './sciencePicker';
export * as entityCardsBuildingAdapter from './entityCards/buildingAdapter';
export * as scienceHubHud from './scienceHubHud';
export * as entityCardsImprovementAdapter from './entityCards/improvementAdapter';
export * as entityCardsTechnologyAdapter from './entityCards/technologyAdapter';
export * as entityCardsRenderer from './entityCards/renderer';
export * as entityCardsWonderAdapter from './entityCards/wonderAdapter';

/** Ścieżki modułów P5.4 (kolejność = `PORTING-QUEUE.md`). */
export const PORTED_CYCLE_C4: readonly string[] = [
  'entityCards/registry.ts',
  'techDiscoveryNotice.ts',
  'entityCards/unitAdapter.ts',
  'sciencePicker.ts',
  'entityCards/buildingAdapter.ts',
  'scienceHubHud.ts',
  'entityCards/improvementAdapter.ts',
  'entityCards/technologyAdapter.ts',
  'entityCards/renderer.ts',
  'entityCards/wonderAdapter.ts',
];
