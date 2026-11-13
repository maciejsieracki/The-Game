/**
 * R-WEB-MEMORY-LEAKS-FIX-Q1 — opt-in diagnostyka pamięci renderera.
 *
 * Włączana WYŁĄCZNIE parametrem URL `?memdebug=1`. Bez niego `logRendererMemoryAtTurnEnd`
 * kończy się na jednym porównaniu boolowskim — zero wpływu na grę (żadnych zapisów stanu,
 * żadnych zmian renderu). Z parametrem: jedna linia `console.log` na końcu każdej tury
 * z licznikami `renderer.info.memory.geometries/textures` i `renderer.info.programs.length`
 * (+ opcjonalne liczniki dodatkowe, np. cache plakietek miast).
 *
 * Cel: właściciel porównuje trend liczników z tury na turę (przed/po poprawce M1–M3).
 * / EN: opt-in (`?memdebug=1`) per-turn renderer memory counters; no-op otherwise.
 */
import type * as THREE from 'three';

let cached: boolean | null = null;

/** Czy diagnostyka `?memdebug=1` jest włączona (wynik liczony raz na sesję). */
export function isMemDebugEnabled(): boolean {
  if (cached !== null) return cached;
  try {
    cached = typeof location !== 'undefined'
      && new URLSearchParams(location.search).get('memdebug') === '1';
  } catch {
    cached = false;
  }
  return cached;
}

/**
 * Wypisz liczniki pamięci renderera na koniec tury — tylko przy `?memdebug=1`.
 * @param renderer główny renderer mapy
 * @param turn     numer tury (po przejściu)
 * @param extra    dodatkowe liczniki (nazwa → liczba), np. z CityRenderer
 */
export function logRendererMemoryAtTurnEnd(
  renderer: THREE.WebGLRenderer,
  turn: number,
  extra?: Record<string, number>,
): void {
  if (!isMemDebugEnabled()) return;
  try {
    const mem = renderer.info.memory;
    const programs = renderer.info.programs?.length ?? -1;
    let line = '[memdebug] koniec tury=' + turn
      + ' · geometries=' + mem.geometries
      + ' · textures=' + mem.textures
      + ' · programs=' + programs;
    if (extra) {
      for (const [k, v] of Object.entries(extra)) line += ' · ' + k + '=' + v;
    }
    const perf = (performance as unknown as { memory?: { usedJSHeapSize?: number } }).memory;
    if (perf && typeof perf.usedJSHeapSize === 'number') {
      line += ' · jsHeapMB=' + (perf.usedJSHeapSize / (1024 * 1024)).toFixed(1);
    }
    console.log(line);
  } catch (err) {
    console.warn('[memdebug] odczyt liczników nie powiódł się', err);
  }
}
