/**
 * sidePanelEventFilter.ts
 * R-WYDARZENIA-FILTR-KATEGORII — czysta funkcja filtrowania panelu WYDARZENIA wg chipa
 * 🌍 „Inne cyw." Wydzielona z sidePanelHud.ts, bo TEN plik ma zero importów niebundlowalnych
 * w czystym esbuild (sidePanelHud.ts ciągnie icons/brandAssets.ts, który robi `import X from
 * '*.svg?raw'` + `import.meta.glob(...)` — obsługiwane przez Vite, nie przez goły esbuild bez
 * dodatkowych loaderów/pluginów) — dzięki temu testy warstwy UI (tools/*-test.cjs, wzorzec
 * army-merge-dismiss-bounce-test.cjs) mogą zbundlować i przetestować samą logikę filtra bez
 * stubowania ikon.
 */
import type { SidePanelEvent } from './sidePanelHud';

/**
 * Filtruje listę wpisów panelu WYDARZENIA wg stanu chipa 🌍 „Inne cyw.".
 * `showOtherCivsEvents === false` (domyślne, chip wyłączony) → wpisy z
 * `origin === 'other-civs'` (dziś wyłącznie handel AI↔AI) są ukryte.
 * `showOtherCivsEvents === true` → wszystkie wpisy widoczne, bez zmiany kolejności.
 */
export function filterSidePanelEvents(
  events: readonly SidePanelEvent[],
  showOtherCivsEvents: boolean,
): SidePanelEvent[] {
  if (showOtherCivsEvents) return events.slice();
  return events.filter(ev => ev.origin !== 'other-civs');
}
