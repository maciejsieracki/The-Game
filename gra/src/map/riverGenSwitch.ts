/**
 * Kill-switch generowania rzek w mapgen.
 * FALA 166/167 — Etap A Maciej: domyślnie tylko główne (gen phase main + render stage 1).
 * Pełny tor: ?riverGenPhase=all&riverStage=5 lub localStorage.
 * Wyłączenie gen: ?riverGen=0 lub localStorage civ-river-gen=0.
 * Render: getRiverRenderStage() w scene.ts (osobny przełącznik).
 */

export const RIVER_GEN_STORAGE_KEY = 'civ-river-gen';
export const RIVER_GEN_PHASE_STORAGE_KEY = 'civ-river-gen-phase';

export type RiverGenPhase = 'main' | 'all';

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
  if (raw === 'main' || raw === 'all') return raw;
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

/** Etap generacji: main = tylko główne nurt; all = pełny tor (medium/short/tributary/topUp). */
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

  // FALA 166/167 Etap A — tymczasowo tylko główne (Maciej: czas + wygląd main przed pobocznymi).
  return 'main';
}

export function isRiverGenMainOnly(): boolean {
  return getRiverGenPhase() === 'main';
}
