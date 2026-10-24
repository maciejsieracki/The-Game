/**
 * save-presence.ts
 * R-WEB-LOAD-GAME-REGRESSION-Q1: czy istnieje JAKIKOLWIEK zapis do wczytania.
 *
 * Przyczyna regresji (main.ts, hasAnySaveSlot / openLoadGameDialog): sprawdzenie
 * wyłącznie listSaves() (IndexedDB + legacy localStorage). Autozapis w trybie
 * File System Access zapisuje rotację `civ-autosave-N.json` NA DYSK i nic nie
 * dopisuje do IndexedDB -- więc przy aktywnym autozapisie na dysk przycisk
 * „Wczytaj grę" w menu pauzy/głównym był wyszarzony z „Brak zapisu", mimo że
 * dialog „Wczytaj grę" (saveLoadDialog.ts::summarizeFsaSaveSlots) te pliki
 * widzi i potrafi wczytać.
 *
 * Moduł jest czysty (bez DOM/IDB): zależności wstrzykiwane jako funkcje, żeby
 * test (tools/load-game-regression-test.cjs) mógł uruchomić prawdziwą logikę.
 * / EN: R-WEB-LOAD-GAME-REGRESSION-Q1: whether ANY save exists to load.
 * Pure helper; storage listers are injected so the test runs the real logic.
 */

export interface SavePresenceDeps {
  /** Lista slotów IndexedDB/localStorage (save.ts::listSaves). */
  listSlots: () => Promise<readonly string[]>;
  /** Lista plików rotacji FSA na dysku (fsa-autosave.ts::listFsaAutosaveFiles). */
  listFsaFiles: () => Promise<readonly unknown[]>;
}

/**
 * true, gdy istnieje co najmniej jeden zapis (slot IDB/localStorage LUB plik
 * autozapisu FSA). Nigdy nie rzuca: błąd któregoś źródła = brak tego źródła.
 */
export async function anySavePresent(deps: SavePresenceDeps): Promise<boolean> {
  try {
    if ((await deps.listSlots()).length > 0) return true;
  } catch {
    /* ignore -- źródło IDB/localStorage niedostępne */
  }
  try {
    if ((await deps.listFsaFiles()).length > 0) return true;
  } catch {
    /* ignore -- katalog FSA niedostępny */
  }
  return false;
}
