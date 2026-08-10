/**
 * fsa-autosave.ts
 * File System Access (FSA) — rotacyjny autozapis do PLIKU na dysku gracza,
 * zamiast do localStorage (R-AUTOZAPIS-QUOTA-STORAGE-Q1, ECHO A).
 * / EN: File System Access rotating autosave — writes a real file on the
 * player's disk instead of localStorage, to avoid the ~5-10 MB browser
 * storage-quota ceiling that large maps (Duży/Ogromny/Super Huge, rosnące
 * pole `explored`) can exceed.
 *
 * Zakres modułu / EN module scope:
 *   - detectFsaAvailability()      -- CZYSTA funkcja środowiska (testowalna
 *                                     bez przeglądarki). Powody braku wsparcia:
 *                                     brak window / protokół file:// / brak
 *                                     secure context / brak showDirectoryPicker.
 *   - autosaveFileName(idx)        -- nazwa pliku rotacji 1..AUTOSAVE_ROT_COUNT,
 *                                     symetryczna do nazw slotów localStorage
 *                                     ('autosave-' + (idx+1)) w main.ts.
 *   - shouldUseFsaAutosave(state)  -- CZYSTA decyzja: FSA vs fallback.
 *   - ensureFsaAutosaveReady()     -- MUSI być wywołane z WNĘTRZA handlera
 *                                     kliknięcia (transient activation) —
 *                                     MDN FileSystemHandle.requestPermission():
 *                                     "Transient user activation is required.
 *                                     The user has to interact with the page
 *                                     or a UI element in order for this
 *                                     feature to work." Wołane raz na START
 *                                     sesji (klik „Rozpocznij grę" / „Kontynuuj"
 *                                     / „Wczytaj grę") — NIE co turę: kolejne
 *                                     zapisy (createWritable/write/close) na
 *                                     już przyznanym uchwycie transient
 *                                     activation NIE wymagają.
 *   - fsaRotatingAutosaveWrite()   -- zapis do kolejnego slotu rotacji na dysku.
 *
 * Fallback: gdy FSA niedostępne / brak zgody / dowolny błąd zapisu —
 * main.ts::doRotatingAutosave() wraca do dotychczasowego saveToLocal()
 * (localStorage). Zero regresji dla graczy bez tej funkcji (Firefox/Safari,
 * file://, zgoda odrzucona).
 */

import { serializeGame, deserializeGame, type SaveGame } from './save';

// ---------------------------------------------------------------------------
// Detekcja środowiska (czysta funkcja — testowalna w Node bez window/DOM).
// / EN: environment detection (pure function — testable in Node, no DOM).
// ---------------------------------------------------------------------------

export type FsaUnavailableReason =
  | 'no-window'
  | 'file-protocol'
  | 'insecure-context'
  | 'no-api';

export interface FsaAvailability {
  available: boolean;
  reason?: FsaUnavailableReason;
}

export interface FsaAvailabilityEnv {
  hasWindow: boolean;
  hasShowDirectoryPicker: boolean;
  protocol: string;
  isSecureContext: boolean;
}

/**
 * Czysta decyzja o wsparciu FSA na podstawie jawnie podanego środowiska —
 * bez dotykania `window`/`location` (testowalne w Node).
 * / EN: pure availability decision from an explicit env snapshot — no direct
 * `window`/`location` access (unit-testable under plain Node).
 */
export function detectFsaAvailability(env: FsaAvailabilityEnv): FsaAvailability {
  if (!env.hasWindow) return { available: false, reason: 'no-window' };
  // File System Access API nie działa pod file:// (wymóg zadania / spec) —
  // sprawdzane PRZED isSecureContext, bo file:// bywa "potencjalnie
  // zaufany" (secure context true), a mimo to showDirectoryPicker jest
  // tam realnie niedostępny/zablokowany.
  // EN: checked BEFORE isSecureContext — file:// can itself report a
  // secure context, yet showDirectoryPicker is unavailable/blocked there.
  if (env.protocol === 'file:') return { available: false, reason: 'file-protocol' };
  if (!env.isSecureContext) return { available: false, reason: 'insecure-context' };
  if (!env.hasShowDirectoryPicker) return { available: false, reason: 'no-api' };
  return { available: true };
}

/**
 * Czytelny komunikat dla gracza — PL, zgodnie z fallbackiem na localStorage.
 * Przyjmuje też przyczyny spoza samej detekcji środowiska (np. 'error' z
 * ensureFsaAutosaveReady()) — każda nieznana/nieobsłużona przyczyna dostaje
 * ten sam ogólny komunikat fallbacku (default poniżej), więc funkcja nigdy
 * nie rzuca ani nie zwraca pustego tekstu.
 */
export function fsaUnavailableMessage(
  reason: FsaUnavailableReason | 'permission-denied' | 'picker-cancelled' | 'picker-error' | 'error' | undefined,
): string {
  switch (reason) {
    case 'file-protocol':
      return 'Autozapis na dysk wymaga uruchomienia gry przez http://localhost (nie działa z pliku otwartego bezpośrednio) — używam dotychczasowego zapisu w przeglądarce.';
    case 'insecure-context':
      return 'Autozapis na dysk wymaga bezpiecznego połączenia (localhost/HTTPS) — używam dotychczasowego zapisu w przeglądarce.';
    case 'no-api':
      return 'Ta przeglądarka nie wspiera zapisu na dysk (dostępne w Chrome/Edge) — używam dotychczasowego zapisu w przeglądarce.';
    case 'no-window':
      return 'Autozapis na dysk niedostępny w tym środowisku — używam dotychczasowego zapisu w przeglądarce.';
    default:
      return 'Autozapis na dysk niedostępny — używam dotychczasowego zapisu w przeglądarce.';
  }
}

/** Wrapper na realne środowisko przeglądarki (tylko client-side). */
export function detectFsaAvailabilityFromWindow(): FsaAvailability {
  if (typeof window === 'undefined') return { available: false, reason: 'no-window' };
  const w = window as unknown as { showDirectoryPicker?: unknown; isSecureContext?: boolean };
  return detectFsaAvailability({
    hasWindow: true,
    hasShowDirectoryPicker: typeof w.showDirectoryPicker === 'function',
    protocol: window.location?.protocol ?? '',
    isSecureContext: !!w.isSecureContext,
  });
}

// ---------------------------------------------------------------------------
// Nazewnictwo plików rotacji (czyste — testowalne).
// / EN: rotation file naming (pure — testable).
// ---------------------------------------------------------------------------

/** MUSI być zgodne z main.ts::AUTOSAVE_ROT_COUNT (10 slotów wstecz). */
export const FSA_AUTOSAVE_ROT_COUNT = 10;
export const FSA_AUTOSAVE_FILE_PREFIX = 'civ-autosave-';
export const FSA_AUTOSAVE_FILE_SUFFIX = '.json';

/**
 * Nazwa pliku dla slotu rotacji 0-based `idx` (zawija się modulo ROT_COUNT).
 * Nie-skończone `idx` (NaN/±Infinity -- np. z uszkodzonego AUTOSAVE_ROT_IDX_KEY
 * w localStorage) degraduje bezpiecznie do slotu 0 zamiast wypisać dosłowne
 * "civ-autosave-NaN.json" na dysk (Evaluator runda 1, N-dodatkowe testy).
 * / EN: file name for 0-based rotation slot `idx` (wraps modulo ROT_COUNT).
 * A non-finite `idx` (NaN/±Infinity -- e.g. a corrupted AUTOSAVE_ROT_IDX_KEY
 * in localStorage) degrades safely to slot 0 instead of writing a literal
 * "civ-autosave-NaN.json" file to disk.
 */
export function autosaveFileName(idx: number): string {
  const safeIdx = Number.isFinite(idx) ? idx : 0;
  const n = (((Math.trunc(safeIdx) % FSA_AUTOSAVE_ROT_COUNT) + FSA_AUTOSAVE_ROT_COUNT) % FSA_AUTOSAVE_ROT_COUNT);
  return FSA_AUTOSAVE_FILE_PREFIX + (n + 1) + FSA_AUTOSAVE_FILE_SUFFIX;
}

// ---------------------------------------------------------------------------
// Decyzja FSA vs fallback (czysta).
// / EN: FSA-vs-fallback decision (pure).
// ---------------------------------------------------------------------------

export interface FsaReadinessState {
  availability: FsaAvailability;
  hasDirectoryHandle: boolean;
  permissionGranted: boolean;
}

/** True gdy wolno pisać przez FSA; false => wołający ma użyć localStorage. */
export function shouldUseFsaAutosave(state: FsaReadinessState): boolean {
  return state.availability.available && state.hasDirectoryHandle && state.permissionGranted;
}

// ---------------------------------------------------------------------------
// Stan w pamięci modułu (żyje przez całą sesję karty/strony).
// / EN: in-memory module state (lives for the page/tab's lifetime).
// ---------------------------------------------------------------------------

// Minimalny lokalny typ FS Access — lib.dom.d.ts z used TS target go nie
// zawiera; unikamy `any` w publicznym API modułu.
// EN: minimal local FS Access typing — not present in this TS target's
// lib.dom.d.ts; avoids `any` on the module's public surface.
interface FsaDirectoryHandleLike {
  getFileHandle(name: string, opts?: { create?: boolean }): Promise<FsaFileHandleLike>;
  queryPermission?(opts: { mode: string }): Promise<string>;
  requestPermission?(opts: { mode: string }): Promise<string>;
  /** Nazwy wpisów katalogu -- do listowania zapisanych plików rotacji (B1: odczyt). */
  keys?(): AsyncIterableIterator<string>;
}
interface FsaFileHandleLike {
  createWritable(): Promise<FsaWritableLike>;
  /** Odczyt zawartości pliku -- do listy zapisów oraz Wczytaj (B1: odczyt z dysku). */
  getFile?(): Promise<{ text(): Promise<string> }>;
}
interface FsaWritableLike {
  write(data: string): Promise<void>;
  close(): Promise<void>;
}

let liveDirHandle: FsaDirectoryHandleLike | null = null;
let liveAvailability: FsaAvailability = { available: false, reason: 'no-window' };
let livePermissionGranted = false;

/** Migawka gotowości — do decyzji shouldUseFsaAutosave() z main.ts. */
export function getFsaReadinessState(): FsaReadinessState {
  return {
    availability: liveAvailability,
    hasDirectoryHandle: liveDirHandle !== null,
    permissionGranted: livePermissionGranted,
  };
}

// ---------------------------------------------------------------------------
// IndexedDB — persystencja uchwytu katalogu MIĘDZY sesjami/restartami
// przeglądarki (FileSystemDirectoryHandle jest structured-cloneable, więc
// nadaje się do zapisu w IndexedDB; localStorage tego NIE obsługuje).
// / EN: IndexedDB persistence of the directory handle across sessions/
// browser restarts (FileSystemDirectoryHandle is structured-cloneable, so
// it can live in IndexedDB; localStorage cannot hold it).
// ---------------------------------------------------------------------------

const FSA_IDB_NAME = 'thegame-fsa';
const FSA_IDB_STORE = 'handles';
const FSA_IDB_KEY = 'autosaveDir';

function openFsaIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('brak indexedDB')); return; }
    const req = indexedDB.open(FSA_IDB_NAME, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(FSA_IDB_STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGetHandle(): Promise<FsaDirectoryHandleLike | null> {
  try {
    const db = await openFsaIdb();
    return await new Promise((resolve) => {
      const tx = db.transaction(FSA_IDB_STORE, 'readonly');
      const req = tx.objectStore(FSA_IDB_STORE).get(FSA_IDB_KEY);
      req.onsuccess = () => resolve((req.result as FsaDirectoryHandleLike | undefined) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}

/**
 * N6 (Evaluator runda 1): odczyt IndexedDB rozpoczęty PRZY STARCIE MODUŁU
 * (nie wewnątrz ensureFsaAutosaveReady() wołanego z kliknięcia), żeby łańcuch
 * transient activation z kliknięcia gracza (~5s okna wg MDN) nie tracił czasu
 * na czekanie na I/O IndexedDB przed showDirectoryPicker()/requestPermission().
 * Do czasu kliknięcia (render menu, animacje) promise zwykle zdąży się
 * rozwiązać, więc `await` na nim w ensureFsaAutosaveReady() jest praktycznie
 * natychmiastowy. Bezpieczne pod Node/bez indexedDB -- idbGetHandle() sam
 * degraduje do null.
 * / EN: IndexedDB read kicked off AT MODULE LOAD TIME (not inside the
 * click-triggered ensureFsaAutosaveReady()), so the transient-activation
 * chain from the player's click (~5s window per MDN) doesn't burn time
 * waiting on IndexedDB I/O before showDirectoryPicker()/requestPermission().
 * By the time the player actually clicks (menu render, animations), this
 * promise has normally already settled, so awaiting it inside
 * ensureFsaAutosaveReady() is effectively instant. Safe under Node/without
 * indexedDB -- idbGetHandle() itself degrades to null.
 */
const preloadedIdbHandlePromise: Promise<FsaDirectoryHandleLike | null> = idbGetHandle();

async function idbPutHandle(handle: FsaDirectoryHandleLike): Promise<void> {
  try {
    const db = await openFsaIdb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(FSA_IDB_STORE, 'readwrite');
      tx.objectStore(FSA_IDB_STORE).put(handle, FSA_IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch { /* ignore -- degrade: kolejna sesja po prostu poprosi o wybór katalogu ponownie */ }
}

// ---------------------------------------------------------------------------
// ensureFsaAutosaveReady — WOŁAJ WYŁĄCZNIE z wnętrza handlera kliknięcia.
// / EN: ensureFsaAutosaveReady — CALL ONLY from inside a click handler.
// ---------------------------------------------------------------------------

export type FsaReadyFailReason =
  | FsaUnavailableReason
  | 'permission-denied'
  | 'picker-cancelled'
  /**
   * N5 (Evaluator runda 1): showDirectoryPicker() rzucił coś INNEGO niż
   * anulowanie przez gracza (np. SecurityError z braku transient
   * activation) -- odróżnione od 'picker-cancelled', żeby diagnostyka nie
   * myliła świadomego "Anuluj" gracza z realnym błędem środowiska.
   * / EN: showDirectoryPicker() threw something OTHER than the player
   * cancelling (e.g. a SecurityError from missing transient activation) --
   * distinguished from 'picker-cancelled' so diagnostics don't conflate the
   * player's deliberate Cancel with a real environment error.
   */
  | 'picker-error'
  | 'error';

export interface FsaReadyResult {
  ok: boolean;
  reason?: FsaReadyFailReason;
}

/**
 * Przygotowuje FSA autozapis do użycia w bieżącej sesji karty:
 *  1. sprawdza wsparcie środowiska;
 *  2. odzyskuje zapamiętany katalog z IndexedDB, a jeśli go brak — pokazuje
 *     showDirectoryPicker() (RÓWNIEŻ wymaga transient activation — dlatego
 *     ta cała funkcja musi żyć w tym samym kliknięciu);
 *  3. queryPermission()/requestPermission({mode:'readwrite'}) — jeśli
 *     zgoda przetrwała z poprzedniej sesji, requestPermission rozwiązuje się
 *     natychmiast bez pokazywania dodatkowego okna (patrz komentarz nagłówka
 *     pliku) — z perspektywy gracza to wciąż JEDNO kliknięcie.
 *
 * Nigdy nie rzuca — porażka zwraca { ok:false, reason } i wołający
 * (main.ts) ma fallback na localStorage.
 */
export async function ensureFsaAutosaveReady(): Promise<FsaReadyResult> {
  liveAvailability = detectFsaAvailabilityFromWindow();
  if (!liveAvailability.available) return { ok: false, reason: liveAvailability.reason };

  try {
    // N6: liveDirHandle (już gotowy w tej sesji karty) albo preładowany
    // odczyt IndexedDB rozpoczęty przy starcie modułu -- patrz komentarz przy
    // preloadedIdbHandlePromise. Zwykle rozwiązany już w momencie kliknięcia.
    let handle: FsaDirectoryHandleLike | null = liveDirHandle ?? await preloadedIdbHandlePromise;
    if (!handle) {
      const w = window as unknown as {
        showDirectoryPicker: (opts?: { id?: string; mode?: string; startIn?: string }) => Promise<FsaDirectoryHandleLike>;
      };
      try {
        handle = await w.showDirectoryPicker({ id: 'thegame-autosave', mode: 'readwrite', startIn: 'documents' });
      } catch (pickErr) {
        // N5: rozróżnij anulowanie przez gracza (AbortError -- świadomy
        // wybór, brak komunikatu wyżej w main.ts) od realnego błędu pickera
        // (np. SecurityError bez transient activation) -- ten drugi trafia
        // do diagnostyki jako 'picker-error', nie milczy pod tym samym kodem.
        // / EN: distinguish the player cancelling (AbortError -- deliberate
        // choice, no message shown higher up in main.ts) from a real picker
        // error (e.g. SecurityError without transient activation) -- the
        // latter surfaces to diagnostics as 'picker-error' instead of
        // silently reusing the same code.
        if (pickErr instanceof DOMException && pickErr.name === 'AbortError') {
          return { ok: false, reason: 'picker-cancelled' };
        }
        console.warn('[FSA] showDirectoryPicker blad:', pickErr);
        return { ok: false, reason: 'picker-error' };
      }
      await idbPutHandle(handle);
    }

    let state: string | undefined = await handle.queryPermission?.({ mode: 'readwrite' });
    if (state !== 'granted') {
      state = await handle.requestPermission?.({ mode: 'readwrite' });
    }
    if (state !== 'granted') {
      livePermissionGranted = false;
      return { ok: false, reason: 'permission-denied' };
    }

    liveDirHandle = handle;
    livePermissionGranted = true;
    return { ok: true };
  } catch (err) {
    livePermissionGranted = false;
    console.warn('[FSA] ensureFsaAutosaveReady blad:', err);
    return { ok: false, reason: 'error' };
  }
}

// ---------------------------------------------------------------------------
// Zapis rotacyjny do pliku na dysku.
// / EN: rotating write to a file on disk.
// ---------------------------------------------------------------------------

export interface FsaWriteResult {
  ok: boolean;
  reason?: 'not-ready' | 'error';
}

/**
 * Zapisuje `s` do pliku rotacji `idx` w zapamiętanym katalogu. NIE wymaga
 * transient activation (tylko requestPermission/showDirectoryPicker tego
 * wymagają) — bezpieczne wołanie z automatycznego cyklu tury.
 *
 * N4/N7 (Evaluator runda 1): najczęstszy realny scenariusz utraty dostępu to
 * karta odłożona dłużej w tle -- Chrome cofa wtedy jednorazowe "Zezwól tym
 * razem" (tylko "Zezwól przy każdej wizycie", Chrome 122+, przetrwa). Przy
 * PIERWSZYM niepowodzeniu zapisu zerujemy tu `livePermissionGranted`, żeby
 * shouldUseFsaAutosave() od razu (bez kolejnej zbędnej próby) kierował
 * kolejne tury na fallback localStorage -- main.ts (wołający) pokazuje
 * graczowi jednorazowy komunikat o degradacji.
 * / EN: the most common real-world loss-of-access scenario is the tab sitting
 * backgrounded for a while -- Chrome then revokes the one-time "Allow this
 * time" grant (only "Allow on every visit", Chrome 122+, survives that). On
 * the FIRST write failure we zero `livePermissionGranted` here so
 * shouldUseFsaAutosave() immediately (no further wasted attempt) routes
 * subsequent turns to the localStorage fallback -- main.ts (the caller)
 * shows the player a one-time degradation message.
 */
export async function fsaRotatingAutosaveWrite(idx: number, s: SaveGame): Promise<FsaWriteResult> {
  if (!liveDirHandle || !livePermissionGranted) return { ok: false, reason: 'not-ready' };
  try {
    const fileHandle = await liveDirHandle.getFileHandle(autosaveFileName(idx), { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(serializeGame(s));
    await writable.close();
    return { ok: true };
  } catch (err) {
    livePermissionGranted = false;
    console.warn('[FSA] fsaRotatingAutosaveWrite blad:', err);
    return { ok: false, reason: 'error' };
  }
}

// ---------------------------------------------------------------------------
// B1 (Evaluator runda 1, BLOKER): odczyt zapisów z katalogu FSA -- bez tego
// autozapis na dysk był write-only (gracz nie mógł nigdy wczytać tego, co
// zapisano). listFsaAutosaveFiles() wylicza pliki rotacji w zapamiętanym
// katalogu; loadFsaAutosaveFile() czyta jeden z nich z powrotem na SaveGame.
// / EN: reading saves back from the FSA directory -- without this, the disk
// autosave was write-only (the player could never load what got saved).
// listFsaAutosaveFiles() enumerates rotation files in the remembered
// directory; loadFsaAutosaveFile() reads one of them back into a SaveGame.
// ---------------------------------------------------------------------------

export interface FsaSaveFileRef {
  /** Pełna nazwa pliku na dysku, np. "civ-autosave-3.json". */
  fileName: string;
  /** 0-based indeks rotacji odtworzony z nazwy pliku (odwrotność autosaveFileName). */
  idx: number;
}

/**
 * Wylicza pliki rotacji `civ-autosave-N.json` w zapamiętanym katalogu FSA.
 * Zwraca [] gdy katalog niegotowy / brak zgody / przeglądarka nie wspiera
 * `dirHandle.keys()` / dowolny błąd odczytu -- nigdy nie rzuca (ta sama
 * konwencja co reszta modułu: wołający ma fallback na localStorage).
 */
export async function listFsaAutosaveFiles(): Promise<FsaSaveFileRef[]> {
  if (!liveDirHandle || !livePermissionGranted) return [];
  if (typeof liveDirHandle.keys !== 'function') return [];
  const out: FsaSaveFileRef[] = [];
  try {
    for await (const name of liveDirHandle.keys()) {
      if (!name.startsWith(FSA_AUTOSAVE_FILE_PREFIX) || !name.endsWith(FSA_AUTOSAVE_FILE_SUFFIX)) continue;
      const mid = name.slice(FSA_AUTOSAVE_FILE_PREFIX.length, name.length - FSA_AUTOSAVE_FILE_SUFFIX.length);
      const n = parseInt(mid, 10);
      if (!Number.isFinite(n)) continue;
      out.push({ fileName: name, idx: n - 1 });
    }
  } catch (err) {
    console.warn('[FSA] listFsaAutosaveFiles blad:', err);
  }
  return out;
}

/**
 * Czyta surowy tekst pliku `fileName` z zapamiętanego katalogu FSA.
 * Zwraca null przy dowolnym niepowodzeniu (nigdy nie rzuca).
 */
export async function readFsaAutosaveFile(fileName: string): Promise<string | null> {
  if (!liveDirHandle || !livePermissionGranted) return null;
  try {
    const fileHandle = await liveDirHandle.getFileHandle(fileName);
    if (typeof fileHandle.getFile !== 'function') return null;
    const file = await fileHandle.getFile();
    return await file.text();
  } catch (err) {
    console.warn('[FSA] readFsaAutosaveFile blad:', err);
    return null;
  }
}

/**
 * Czyta i deserializuje plik `fileName` z katalogu FSA na SaveGame.
 * Zwraca null gdy plik nieczytelny albo JSON nieprawidłowy/niekompatybilny
 * (deserializeGame rzuca -- łapane tutaj, nigdy nie propaguje).
 */
export async function loadFsaAutosaveFile(fileName: string): Promise<SaveGame | null> {
  const text = await readFsaAutosaveFile(fileName);
  if (text === null) return null;
  try {
    return deserializeGame(text);
  } catch (err) {
    console.warn('[FSA] loadFsaAutosaveFile: deserializeGame blad:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// N8 (Evaluator runda 1, nota): hooki WYŁĄCZNIE do testów Node
// (tools/fsa-autosave-test.cjs, bundlowany bezpośrednio z tego pliku
// źródłowego esbuildem). Sprawdzono repo pod kątem istniejącej konwencji
// odseparowania testowych hooków od modułów produkcyjnych (wzorce
// `ForTests`/`__TEST__`/`process.env.NODE_ENV`) -- src/game/fsa-autosave.ts
// jest JEDYNYM plikiem w src/ z takim eksportem, więc nie ma tu ustalonej
// konwencji do powielenia. Zamiast wymyślać nową (ryzyko rozjazdu z resztą
// projektu), zostawiamy je jako zwykłe nazwane eksporty z podkreśleniem +
// tym komentarzem: main.ts NIGDZIE ich nie importuje (żaden call site poza
// tools/fsa-autosave-test.cjs), więc Rollup/Vite (tree-shaking eksportów
// nieużywanych przez graf importów od main.ts) usuwa je z bundla
// produkcyjnego -- nie zweryfikowane tu realnym `vite build` (poza zakresem
// dozwolonych bramek tej rundy), świadomie przyjęte na tej podstawie.
// / EN: hooks EXCLUSIVELY for Node tests (tools/fsa-autosave-test.cjs,
// bundled directly from this source file via esbuild). Checked the repo for
// an existing convention separating test-only hooks from production modules
// (`ForTests`/`__TEST__`/`process.env.NODE_ENV` patterns) -- this file is
// the ONLY one in src/ with such an export, so there's no established
// convention to reuse here. Rather than invent a new one (risking drift from
// the rest of the project), these stay as plain underscore-prefixed named
// exports + this comment: main.ts never imports them (no call site outside
// tools/fsa-autosave-test.cjs), so Rollup/Vite (tree-shaking exports unused
// by the import graph reachable from main.ts) strips them from the
// production bundle -- not verified here with an actual `vite build` (out of
// this round's approved gates), knowingly accepted on that basis.
// ---------------------------------------------------------------------------

/** Test/diagnostyka: resetuje stan modułu (nie dotyka IndexedDB/dysku). */
export function _resetFsaStateForTests(): void {
  liveDirHandle = null;
  liveAvailability = { available: false, reason: 'no-window' };
  livePermissionGranted = false;
}

/**
 * Test/diagnostyka: wstrzykuje stan modułu bez przechodzenia przez prawdziwy
 * showDirectoryPicker()/IndexedDB -- do testowania listFsaAutosaveFiles() /
 * readFsaAutosaveFile() / loadFsaAutosaveFile() / fsaRotatingAutosaveWrite()
 * pod plain Node z podstawionym (mock) uchwytem katalogu.
 */
export function _setFsaStateForTests(opts: {
  dirHandle: FsaDirectoryHandleLike | null;
  permissionGranted: boolean;
}): void {
  liveAvailability = { available: true };
  liveDirHandle = opts.dirHandle;
  livePermissionGranted = opts.permissionGranted;
}
