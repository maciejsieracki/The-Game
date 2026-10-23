/**
 * portCityUx.ts — moduł przeniesiony w P5.7 runda 3 (`R-RUSTPORT-P5-7-PORT-HUD-CITYPANEL-Q1`; `PORTING-QUEUE.md`
 * wiersz 82 — `cityUxFrame.ts`, cykl C1; `cityPanel.ts` (wiersz 81) — runda 4, rejestruje się w moście
 * `cityPanelUxBridge.ts`, ZAŁOŻENIE P5.7-Z7).
 *
 * Importowany DYNAMICZNIE z `main.ts` (jak `portHudEmpire.ts`/`portNewGame.ts`), żeby `vite build` kompilował moduł.
 * Nie montuje ramki (ZAŁOŻENIE P5.6-Z1, jak P5.3–P5.7 r2).
 */
export * as cityUxFrame from './cityUxFrame';
export * as cityPanelUxBridge from './cityPanelUxBridge';

/** Ścieżki modułów kolejki przeniesionych w P5.7 r3. */
export const PORTED_CITY_UX: readonly string[] = ['cityUxFrame.ts'];
