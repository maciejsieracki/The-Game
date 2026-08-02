/**
 * Kill-switch generowania rzek w mapgen.
 * FALA 165 — Etap B przywracania: domyślnie WŁĄCZONE (gen rzek w danych mapy).
 * Etap A (optymalizacja perf „Rzeki — główne") nadal otwarty — Pangea może być wolna.
 * Wyłączenie: ?riverGen=0 lub localStorage civ-river-gen=0.
 * Render: getRiverRenderStage() w scene.ts (osobny przełącznik, Etap C).
 */

export const RIVER_GEN_STORAGE_KEY = 'civ-river-gen';

let _override: boolean | null = null;

/** Worker nie ma localStorage — main thread przekazuje wartość przed startem. */
export function setRiverGenEnabledOverride(enabled: boolean | null): void {
  _override = enabled;
}

function parse01(raw: string | null): boolean | null {
  if (raw === '0' || raw === 'false') return false;
  if (raw === '1' || raw === 'true') return true;
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

  return true; // FALA 165 Etap B: domyślnie generuj rzeki
}
