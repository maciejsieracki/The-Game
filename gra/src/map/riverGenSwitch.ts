/**
 * Kill-switch generowania rzek w mapgen.
 * FALA 174 — domyślnie główne + średnie (gen phase main+medium + render stage 2).
 * Tylko główne: ?riverGenPhase=main&riverStage=1 · pełny tor: ?riverGenPhase=all&riverStage=5.
 * Wyłączenie gen: ?riverGen=0 lub localStorage civ-river-gen=0.
 * Render: getRiverRenderStage() w scene.ts (osobny przełącznik).
 */

export const RIVER_GEN_STORAGE_KEY = 'civ-river-gen';
export const RIVER_GEN_PHASE_STORAGE_KEY = 'civ-river-gen-phase';

export type RiverGenPhase = 'main' | 'main+medium' | 'all';

let _override: boolean | null = null;
let _phaseOverride: RiverGenPhase | null = null;

/** Worker nie ma localStorage — main thread przekazuje wartość przed startem. */
export function setRiverGenEnabledOverride(enabled: boolean | null): void {
  _override = enabled;
}

export function setRiverGenPhaseOverride(phase: RiverGenPhase | null): void {
  _phaseOverride = phase;
}

function parse01(raw: string | null): boolean | null {
  if (raw === '0' || raw === 'false') return false;
  if (raw === '1' || raw === 'true') return true;
  return null;
}

function parsePhase(raw: string | null): RiverGenPhase | null {
  if (raw === 'main' || raw === 'main+medium' || raw === 'all') return raw;
  return null;
}

/** Czy mapgen ma generować rzeki (ścieżki + oznaczenia hex). */
export function getRiverGenEnabled(): boolean {
  if (_override !== null) return _override;

  if (typeof location !== 'undefined') {
    const fromUrl = parse01(new URLSearchParams(location.search).get('riverGen'));
    if (fromUrl !== null) return fromUrl;
  }

  try {
    if (typeof localStorage !== 'undefined') {
      const fromStore = parse01(localStorage.getItem(RIVER_GEN_STORAGE_KEY));
      if (fromStore !== null) return fromStore;
    }
  } catch { /* private mode / worker */ }

  return true;
}

/** Etap generacji: main = tylko główne · main+medium = główne+średnie · all = pełny tor. */
export function getRiverGenPhase(): RiverGenPhase {
  if (_phaseOverride !== null) return _phaseOverride;

  if (typeof location !== 'undefined') {
    const fromUrl = parsePhase(new URLSearchParams(location.search).get('riverGenPhase'));
    if (fromUrl !== null) return fromUrl;
  }

  try {
    if (typeof localStorage !== 'undefined') {
      const fromStore = parsePhase(localStorage.getItem(RIVER_GEN_PHASE_STORAGE_KEY));
      if (fromStore !== null) return fromStore;
    }
  } catch { /* private mode / worker */ }

  // FALA 174 — główne + średnie (bez krótkich/dekoracyjnych); pełny tor: ?riverGenPhase=all.
  return 'main+medium';
}

export function isRiverGenMainOnly(): boolean {
  return getRiverGenPhase() === 'main';
}

/** Pełny tor: krótkie dopływy + dekoracyjne tributary (etap 3+). */
export function isRiverGenFull(): boolean {
  return getRiverGenPhase() === 'all';
}
