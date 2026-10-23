/**
 * portHudEmpire.ts — zbiór modułów przeniesionych w P5.7 runda 1 (`R-RUSTPORT-P5-7-PORT-HUD-CITYPANEL-Q1`;
 * `PORTING-QUEUE.md` wiersze 78, 79, 80 — cykl C3: `empireDetailPanel.ts`, `empireDetailTypes.ts`, `hud.ts`;
 * 32 — `sceneTimingReport.ts`, D-UI-7 bez sond WebGL).
 *
 * Importowany DYNAMICZNIE z `main.ts` po instalacji `StaticCatalogDto` i `EmpireQueriesProvider` (ZAŁOŻENIE P5.2-Z1:
 * `empireDetailPanel.ts` czyta stałe katalogu przy ewaluacji modułu), żeby `vite build` kompilował wszystkie moduły.
 * Nie montuje żadnego panelu (ZAŁOŻENIE P5.6-Z1, jak P5.3–P5.6). Ewaluacja `hud.ts` rejestruje most
 * `armyStackHudSuppression.ts` (P5.6-Z3).
 */
export * as empireDetailPanel from './empireDetailPanel';
export * as empireDetailTypes from './empireDetailTypes';
export * as hud from './hud';
export * as sceneTimingReport from './sceneTimingReport';

/** Ścieżki modułów kolejki przeniesionych w P5.7 r1 (kolejność = `PORTING-QUEUE.md`). */
export const PORTED_HUD_EMPIRE: readonly string[] = [
  'sceneTimingReport.ts',
  'empireDetailPanel.ts',
  'empireDetailTypes.ts',
  'hud.ts',
];
