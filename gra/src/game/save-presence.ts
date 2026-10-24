/**
 * save-presence.ts
 * R-WEB-LOAD-GAME-REGRESSION-Q1: czy istnieje JAKIKOLWIEK zapis do wczytania.
 *
 * Przyczyna regresji (main.ts, hasAnySaveSlot / openLoadGameDialog): sprawdzenie
 * wyłącznie listSaves() (IndexedDB + legacy localStorage). Autozapis w trybie
 * File System Access zapisuje rotację `civ-autosave-N.json` NA DYSK i nic nie
 * dopisuje do IndexedDB -- więc przy aktywnym autozapisie na dysk przycisk
 * „Wczytaj grę" był wyszarzony z „Brak zapisu".
 *
 * Dodatkowo po przeładowaniu strony lista plików FSA jest pusta, dopóki gracz
 * nie kliknie (bootstrap FSA wymaga gestu), więc trzecim źródłem jest samo
 * ZAPAMIĘTANIE katalogu autozapisu (uchwyt w IDB). Kliknięcie „Wczytaj" wtedy
 * robi bootstrap i listuje; gdy katalog jest pusty, gracz dostaje komunikat.
 *
 * Moduł jest czysty (bez DOM): zależności wstrzykiwane jako funkcje, żeby
 * test (tools/load-game-regression-test.cjs) uruchamiał prawdziwą logikę.
 * / EN: pure helper; storage sources are injected so the test runs real logic.
 */

export type SavePresenceSource = 'slots' | 'fsa-files' | 'fsa-dir';

export interface SavePresenceDeps {
  /** Lista slotów IndexedDB/localStorage (save.ts::listSaves). */
  listSlots: () => Promise<readonly string[]>;
  /** Lista plików rotacji FSA na dysku (fsa-autosave.ts::listFsaAutosaveFiles). */
  listFsaFiles: () => Promise<readonly unknown[]>;
  /** Czy katalog autozapisu FSA jest zapamiętany (fsa-autosave.ts::hasRememberedFsaDirectory). */
  hasRememberedFsaDir: () => Promise<boolean>;
  /** Wołane, gdy któreś źródło rzuci (błąd nie znika cicho). */
  onSourceError?: (source: SavePresenceSource, err: unknown) => void;
}

/**
 * true, gdy istnieje co najmniej jeden zapis (slot IDB/localStorage, plik
 * autozapisu FSA LUB zapamiętany katalog FSA). Nigdy nie rzuca: błąd któregoś
 * źródła = brak tego źródła (plus zgłoszenie przez onSourceError).
 */
export async function anySavePresent(deps: SavePresenceDeps): Promise<boolean> {
  const report = (source: SavePresenceSource, err: unknown): void => {
    try { deps.onSourceError?.(source, err); } catch { /* raport nie może zepsuć odczytu */ }
  };
  try {
    if ((await deps.listSlots()).length > 0) return true;
  } catch (err) {
    report('slots', err);
  }
  try {
    if ((await deps.listFsaFiles()).length > 0) return true;
  } catch (err) {
    report('fsa-files', err);
  }
  try {
    if (await deps.hasRememberedFsaDir()) return true;
  } catch (err) {
    report('fsa-dir', err);
  }
  return false;
}

export interface SavePresenceCache {
  /** Ostatnio znany stan (synchroniczny; do renderu menu). */
  get(): boolean;
  /** Przelicza stan i zwraca WYNIK TEGO przeliczenia; cache ustawia tylko, gdy nie został nadpisany nowszym zdarzeniem. */
  refresh(): Promise<boolean>;
  /** Udany zapis = zapis istnieje. Unieważnia przeliczenia, które wystartowały wcześniej. */
  markPresent(): void;
}

/**
 * Cache stale-while-revalidate z ochroną przed wyścigiem: każde przeliczenie
 * dostaje numer generacji; wynik starszego (wolniejszego) przeliczenia nie
 * nadpisuje cache, jeśli w międzyczasie wystartowało nowsze albo był markPresent().
 * / EN: generation counter -- a slower, older refresh never overwrites a newer
 * result or a markPresent() that happened after it started.
 */
export function createSavePresenceCache(deps: SavePresenceDeps): SavePresenceCache {
  let value = false;
  let generation = 0;
  return {
    get: () => value,
    refresh: async () => {
      const my = ++generation;
      const result = await anySavePresent(deps);
      if (my === generation) value = result;
      return result;
    },
    markPresent: () => {
      generation++;
      value = true;
    },
  };
}
