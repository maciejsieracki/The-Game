/**
 * mapGenProgress.ts — wspólny raport postępu generacji mapy (UI overlay + worker).
 */

/** Liczba etapów widocznych w overlay „Tworzenie świata”. */
export const MAP_GEN_PHASE_TOTAL = 10;

export type MapGenProgressCallback = (
  faza: string,
  pct: number,
  phaseNum?: number,
  phaseTotal?: number,
) => void;

/** Etykiety faz (1-based) — spójne między main thread a workerem. */
export const MAP_GEN_PHASE_LABELS = {
  prep: 'Przygotowanie siatki',
  terrain: 'Klimat i teren bazowy',
  landSea: 'Ląd i ocean',
  relief: 'Relief (góry i wzgórza)',
  coast: 'Wybrzeże',
  riversMain: 'Rzeki — główne',
  riversFill: 'Rzeki — uzupełnianie',
  forest: 'Las i roślinność',
  deposits: 'Złoża mineralne',
  starts: 'Pozycje startowe',
} as const;

/**
 * Raportuje postęp w obrębie jednej fazy (localPct 0–100) jako globalny pasek 0–99.
 * Faza `phaseNum` jest 1-based; `phaseTotal` domyślnie MAP_GEN_PHASE_TOTAL.
 */
export function reportMapGenPhase(
  onProgress: MapGenProgressCallback | undefined,
  phaseNum: number,
  faza: string,
  localPct: number,
  phaseTotal: number = MAP_GEN_PHASE_TOTAL,
): void {
  if (!onProgress) return;
  const clampedLocal = Math.max(0, Math.min(100, localPct));
  const globalPct = ((phaseNum - 1) + clampedLocal / 100) / phaseTotal * 100;
  const capped = phaseNum >= phaseTotal && clampedLocal >= 100
    ? 100
    : Math.min(99, Math.round(globalPct));
  onProgress(faza, capped, phaseNum, phaseTotal);
}
