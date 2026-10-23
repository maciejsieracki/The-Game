/**
 * portNewGame.ts — moduł przeniesiony w P5.7 runda 2 (`R-RUSTPORT-P5-7-PORT-HUD-CITYPANEL-Q1`; `PORTING-QUEUE.md`
 * wiersz 29 — `newGameFlow.ts`).
 *
 * Importowany DYNAMICZNIE z `main.ts` po instalacji `StaticCatalogDto` i `NewGameQueriesProvider` (ZAŁOŻENIE P5.2-Z1:
 * `newGameFlow.ts` czyta `UI_PARAMS` i stałe katalogu przy ewaluacji modułu), żeby `vite build` kompilował moduł.
 * Nie montuje kreatora (ZAŁOŻENIE P5.6-Z1, jak P5.3–P5.7 r1).
 */
export * as newGameFlow from './newGameFlow';

/** Ścieżki modułów kolejki przeniesionych w P5.7 r2. */
export const PORTED_NEW_GAME: readonly string[] = ['newGameFlow.ts'];
