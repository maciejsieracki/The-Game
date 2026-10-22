/**
 * controller/diagnostics.ts — stan diagnostyczny dla `perfReport.ts` (P5.2, D-UI-7).
 *
 * Rozstrzygnięcie tymczasowe orkiestratora (D-UI-7): narzędzia deweloperskie bez sond WebGL —
 * `perfReport.ts` dostaje tylko typy/strukturę (`MapGenPhaseTimingsDto`, `SceneBuildTimingsDto`)
 * oraz ten stan (stempel builda, przełącznik rzek) zamiast importów `buildInfo.ts` i
 * `map/riverGenSwitch.ts`. Do czasu decyzji D-UI-7 dane dostarcza atrapa MOCK.
 */
import type { PerfDiagnosticsDto } from '../viewmodel/types';

let current: PerfDiagnosticsDto | null = null;

export function installPerfDiagnostics(d: PerfDiagnosticsDto): void {
  current = d;
}

export function perfDiagnostics(): PerfDiagnosticsDto {
  if (current === null) {
    throw new Error('frontend-v2: PerfDiagnosticsDto nie zainstalowany (installPerfDiagnostics przed użyciem perfReport)');
  }
  return current;
}
