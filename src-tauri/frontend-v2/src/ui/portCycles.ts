/**
 * portCycles.ts — zbiór modułów przeniesionych w P5.6 (`R-RUSTPORT-P5-6-PORT-CYKLE-C1235-Q1`; `PORTING-QUEUE.md`
 * wiersze 69, 70, 73 — cykl C2; 75 — `hexContextTooltip.ts`; 76, 77 — cykl C5; 83 — `preBattle.ts`) oraz nowe pliki
 * pomocnicze tej paczki (`unitVitalsPalette.ts` — kopia bajtowa `gra/src/render/unitVitalsPalette.ts`;
 * `armyStackHudSuppression.ts` — most `preBattle.ts` → `hud.ts`, ZAŁOŻENIE P5.6-Z3).
 *
 * Importowany DYNAMICZNIE z `main.ts` po instalacji `StaticCatalogDto` (ZAŁOŻENIE P5.2-Z1: `diplomacyAudience.ts`,
 * `diplomacyNegotiationModal.ts`, `diplomacyTradeBasket.ts` czytają katalog przy ewaluacji modułu), żeby `vite build`
 * kompilował wszystkie moduły. Nie montuje żadnego panelu (ZAŁOŻENIE P5.6-Z1, jak P5.3–P5.5).
 */
export * as diplomacyAudience from './diplomacyAudience';
export * as diplomacyNegotiationModal from './diplomacyNegotiationModal';
export * as diplomacyTradeBasket from './diplomacyTradeBasket';
export * as hexContextTooltip from './hexContextTooltip';
export * as sidePanelHud from './sidePanelHud';
export * as sidePanelEventFilter from './sidePanelEventFilter';
export * as preBattle from './preBattle';
export * as unitVitalsPalette from './unitVitalsPalette';
export * as armyStackHudSuppression from './armyStackHudSuppression';

/** Ścieżki modułów kolejki przeniesionych w P5.6 (kolejność = `PORTING-QUEUE.md`). */
export const PORTED_CYCLES: readonly string[] = [
  'diplomacyAudience.ts',
  'diplomacyNegotiationModal.ts',
  'diplomacyTradeBasket.ts',
  'hexContextTooltip.ts',
  'sidePanelHud.ts',
  'sidePanelEventFilter.ts',
  'preBattle.ts',
];
