/**
 * save.ts
 * SAVE / LOAD (task F1) -- serialize the live game state to a JSON string and
 * back, plus save-slot helpers backed by IndexedDB.
 *
 * MIGRACJA IDB (Maciej, decyzja właściciela): magazyn zapisów (w tym
 * mapSnapshot -- pełna siatka heksów) przeniesiony z localStorage na
 * IndexedDB -- 10 rotacyjnych slotów autozapisu z pełną mapą w KAŻDYM
 * przekracza budżet localStorage (~5-10 MB/domenę) ~4x szybciej niż przed
 * kompresją kolumnową rundy 2 (8,2x redukcji), a IndexedDB nie ma tego
 * niskiego, twardego limitu. Zapis backendu: src/game/idb-storage.ts (cienki
 * Promise-based wrapper). NOWE zapisy idą WYŁĄCZNIE do IndexedDB; ODCZYT
 * sprawdza IndexedDB, a gdy klucza tam brak -- spada na localStorage pod tym
 * samym kluczem (stare zapisy graczy sprzed tej migracji, wsteczna
 * zgodność bez aktywnej migracji danych -- świadomie NIE kopiujemy starych
 * zapisów do IDB, patrz raport). Skutek: saveToLocal/loadFromLocal/
 * listSaves/deleteLocal/loadSaveSlotMeta są teraz ASYNC (Promise) -- były
 * synchroniczne pod localStorage.
 * / EN: IDB MIGRATION (Maciej, owner decision): save storage (including
 * mapSnapshot -- the full hex grid) moved from localStorage to IndexedDB --
 * 10 rotating autosave slots with a full map in EACH blow the localStorage
 * budget (~5-10 MB/origin) ~4x faster than before round-2's columnar
 * compression (8.2x reduction), and IndexedDB has no such low, hard limit.
 * Backend: src/game/idb-storage.ts (thin Promise-based wrapper). NEW saves
 * go EXCLUSIVELY to IndexedDB; READS check IndexedDB first, falling back to
 * localStorage under the same key when absent (pre-migration player saves --
 * backward compatible without an active data migration, see report for why).
 * Result: saveToLocal/loadFromLocal/listSaves/deleteLocal/loadSaveSlotMeta
 * are now ASYNC (Promise) -- they used to be synchronous under localStorage.
 *
 * Pure / browser-safe logic: no DOM, no THREE, no side effects beyond the
 * explicitly storage-backed helpers (which are guarded so they degrade
 * gracefully when storage is unavailable, e.g. under Node or file://).
 *
 * Exports:
 *   SaveGame             - serializable snapshot of one game in progress
 *   SAVE_VERSION         - current on-disk save format version
 *   SAVE_PREFIX          - storage key prefix for save slots (IDB + legacy localStorage)
 *   serializeGame()      - SaveGame  -> JSON string
 *   deserializeGame()    - JSON string -> SaveGame (validates wersja)
 *   saveToLocal()        - async: write a SaveGame into a named IDB slot,
 *                          returns { ok, reason? } ('quota' | 'other')
 *   loadFromLocal()      - async: read a SaveGame back from a named slot (or null)
 *   listSaves()          - async: list all save slot names (IDB ∪ legacy localStorage)
 *   deleteLocal()        - async: remove a named slot from both backends (pure-safe)
 *
 * INTEGRATOR NOTE (what main.ts must gather to fill a SaveGame):
 *   The live runtime state currently lives as locals inside main.ts.  To build
 *   a SaveGame snapshot the integrator collects:
 *     - tura      <- the `turn` number local (starts at 1).
 *     - seed      <- the `SEED` constant (12345) used by generateMap().
 *     - units     <- the `units: RuntimeUnit[]` array (placeStartingUnits()).
 *     - cities    <- the `cities: City[]` array.
 *     - explored  <- Array.from(explored) -- the `explored: Set<string>` of
 *                    "q,r" fog keys (a Set, so it MUST be spread to an array;
 *                    serializeGame() also defends against a Set slipping in).
 *     - gracz     <- OPTIONAL player economy/treasury snapshot once main.ts
 *                    keeps one as a discrete object (today economy is computed
 *                    per turn via advanceCityEconomy(); leave undefined if so).
 *     - meta      <- OPTIONAL free-form metadata (timestamp, label, map size).
 *     - mapSnapshot <- OPTIONAL (P-WCZYTYWANIE-REGENERUJE-MAPE-OD-ZERA, Maciej
 *                    ECHO A): map/mapSnapshot.ts::serializeMapForSave(map) --
 *                    the full hex grid, captured AFTER any gameplay mutations
 *                    (forest cleared, improvements built, villages looted).
 *                    When present, load builds GameMap directly from it
 *                    (game/load-map-source.ts::loadMapForSave) WITHOUT calling
 *                    the generator. Saves written before this field existed
 *                    lack it -- load falls back to regenerating deterministically
 *                    from `seed` (generateMap(width, height, seed)), exactly as
 *                    before this field was introduced (backward compatible).
 *                    Persist map width/height in `meta` if they are not fixed
 *                    constants on the loading side.
 */

import type { RuntimeUnit } from '../units/setup';
import type { City } from './cities';
import type { TradeRoute } from './trade-routes';
import { isValidMapSnapshot, type SerializedMapData } from '../map/mapSnapshot';
import { idbGetItem, idbSetItem, idbRemoveItem, idbListKeys, idbIsAvailable } from './idb-storage';

/**
 * B3 (Evaluator, migracja IDB runda 2): re-export -- UI (saveLoadDialog.ts)
 * dotychczas zależy WYŁĄCZNIE od save.ts, nigdy bezpośrednio od
 * idb-storage.ts (ten plik jest szczegółem implementacyjnym save.ts);
 * `isIdbAvailable` utrzymuje tę granicę zamiast dokładać nową krawędź
 * importu ui/ -> game/idb-storage. Patrz idb-storage.ts::idbIsAvailable dla
 * pełnego opisu.
 * / EN: re-export -- the UI (saveLoadDialog.ts) so far depends ONLY on
 * save.ts, never directly on idb-storage.ts (an implementation detail of
 * save.ts); `isIdbAvailable` keeps that boundary instead of adding a new
 * ui/ -> game/idb-storage import edge. See idb-storage.ts::idbIsAvailable
 * for the full description.
 */
export { idbIsAvailable as isIdbAvailable };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Current save format version.  Bumped whenever the SaveGame shape changes in
 * a backward-incompatible way; deserializeGame() rejects unknown majors.
 */
export const SAVE_VERSION = 2;

/** localStorage key prefix under which save slots are stored. */
export const SAVE_PREFIX = 'thegame.save.';

/** Meta-klucz: ostatnio wczytany / zapisany slot (Kontynuuj). */
export const LAST_PLAYED_SLOT_KEY = 'thegame.save._lastPlayed';

/**
 * Prefiks odróżniający wskaźnik „ostatnio grane" wskazujący na plik File
 * System Access (dysk) od zwykłego slotu localStorage. R-AUTOZAPIS-QUOTA-
 * STORAGE-Q1 (Evaluator runda 1, BLOKER B2): przed tą zmianą autozapis na
 * dysk wołał setLastPlayedSlotId(slot) z kluczem localStorage-'owym mimo że
 * NIC nie zapisał do localStorage -- getLastPlayedSlotId() albo cicho
 * wczytywał STARY/CUDZY zapis spod tego samego klucza w localStorage, albo
 * (gdy klucza brak) spadał na mostRecentSaveSlotId(). Wartość zapisana pod
 * LAST_PLAYED_SLOT_KEY z tym prefiksem NIE jest slotem localStorage -- to
 * "fsa:" + nazwa pliku (patrz fsa-autosave.ts::autosaveFileName()).
 * / EN: prefix distinguishing a "last played" pointer that targets a File
 * System Access (disk) file from an ordinary localStorage slot. Before this
 * fix, the disk-autosave branch called setLastPlayedSlotId(slot) with a
 * localStorage-shaped key despite writing nothing to localStorage --
 * getLastPlayedSlotId() would either silently resolve a STALE/UNRELATED
 * localStorage save under that same key, or (when absent) fall through to
 * mostRecentSaveSlotId(). A value stored under LAST_PLAYED_SLOT_KEY with
 * this prefix is NOT a localStorage slot -- it is "fsa:" + file name (see
 * fsa-autosave.ts::autosaveFileName()).
 */
export const FSA_SLOT_PREFIX = 'fsa:';

/** Slot szybkiego zapisu (Ctrl+S) — zawsze ten sam klucz, osobno od nazwanych sejwów. */
export const AUTOSAVE_SLOT_ID = 'autosave';

/**
 * Prefiks klucza META — MAŁY nagłówek zapisu (label/tura/savedAt/kontekst),
 * zapisywany OSOBNO od pełnej treści zapisu (Defekt C, runda 2). MUSI być
 * rozłączny z SAVE_PREFIX ('thegame.save.') — `listSaves()` iteruje WSZYSTKIE
 * klucze zaczynające się od SAVE_PREFIX i traktuje resztę jako nazwę slotu;
 * klucz meta pod prefiksem, który sam zaczyna się od SAVE_PREFIX, pojawiłby
 * się tam jako fałszywy dodatkowy "slot". UWAGA (runda 3, Evaluator): wcześniej
 * ta stała brzmiała 'thegame.save.meta.' — mimo komentarza obok twierdzącego
 * inaczej, ten string DALEJ zaczyna się od 'thegame.save.', więc BYŁ
 * podprefiksem i `listSaves()` faktycznie zwracał fantomowy slot
 * `meta.<realSlot>`. Prefiks poniżej ('thegame.savemeta.', bez kropki po
 * "save") nie zaczyna się od SAVE_PREFIX — sprawdź `!SAVE_META_PREFIX.
 * startsWith(SAVE_PREFIX)`, patrz asercja w map-snapshot-load-test.cjs.
 * / EN: META key prefix — a SMALL save header (label/tura/savedAt/context),
 * stored SEPARATELY from the full save body (Defect C, round 2). MUST be
 * disjoint from SAVE_PREFIX ('thegame.save.') — `listSaves()` iterates ALL
 * keys starting with SAVE_PREFIX and treats the remainder as the slot name;
 * a meta key under a prefix that itself starts with SAVE_PREFIX would show up
 * there as a bogus extra "slot". NOTE (round 3, Evaluator): this constant used
 * to read 'thegame.save.meta.' — despite the adjacent comment claiming
 * otherwise, that string still starts with 'thegame.save.', so it WAS a
 * sub-prefix and `listSaves()` really did return a phantom `meta.<realSlot>`
 * slot. The prefix below ('thegame.savemeta.', no dot after "save") does not
 * start with SAVE_PREFIX -- verified by `!SAVE_META_PREFIX.
 * startsWith(SAVE_PREFIX)`, see the assertion in map-snapshot-load-test.cjs.
 */
export const SAVE_META_PREFIX = 'thegame.savemeta.';

function saveMetaKey(slot: string): string {
  return SAVE_META_PREFIX + slot;
}

/**
 * Nagłówek zapisu (Defekt C, runda 2) — dokładnie te pola, których potrzebuje
 * dialog „Wczytaj grę" (saveLoadDialog.ts::summarizeSaveSlots) do wyrenderowania
 * listy slotów, BEZ pełnego `JSON.parse` całej treści zapisu (który przy
 * mapSnapshot potrafi ważyć setki KB nawet po kompresji rundy 2 — zbędny
 * koszt tylko po to, żeby pokazać etykietę i turę). Pola dobrane 1:1 z tego,
 * co dziś czyta `saveContextLine()`.
 * / EN: save header (Defect C, round 2) — exactly the fields the "Load game"
 * dialog (saveLoadDialog.ts::summarizeSaveSlots) needs to render the slot
 * list, WITHOUT a full `JSON.parse` of the entire save body (which, even
 * compressed post-round-2, can still be hundreds of KB with a mapSnapshot —
 * a needless cost just to show a label and turn number). Fields chosen 1:1
 * from what `saveContextLine()` reads today.
 */
export interface SaveSlotMeta {
  label: string;
  tura: number;
  savedAt: string;
  mapSize: string;
  /** Surowy klucz typu świata (np. 'kontynenty') — etykieta PL rozwiązywana przy renderze (UI concern). */
  worldType: string;
  civId: string;
  unitsCount: number;
  citiesCount: number;
  seed: number;
  /** 'playtest' albo '' (brak specjalnego pochodzenia). */
  saveOrigin: string;
}

/** Wyciąga pola kontekstu zapisu (współdzielone przez SaveSlotMeta i saveContextLine). */
export function extractSaveContextFields(g: SaveGame): Omit<SaveSlotMeta, 'label' | 'tura' | 'savedAt'> {
  const meta = g.meta as Record<string, unknown> | undefined;
  const ngp = meta?.newGameParams as {
    mapSize?: string;
    worldType?: string;
    typSwiata?: string;
    civId?: string;
  } | undefined;
  return {
    mapSize: String(ngp?.mapSize ?? meta?.loadMapSize ?? '—'),
    worldType: String(ngp?.worldType ?? ngp?.typSwiata ?? meta?.loadTypSwiata ?? ''),
    civId: String(ngp?.civId ?? meta?.loadCivId ?? '—'),
    unitsCount: Array.isArray(g.units) ? g.units.length : 0,
    citiesCount: Array.isArray(g.cities) ? g.cities.length : 0,
    seed: typeof g.seed === 'number' ? g.seed : 0,
    saveOrigin: meta?.saveOrigin === 'playtest' ? 'playtest' : '',
  };
}

/** Buduje nagłówek zapisu (SaveSlotMeta) z pełnego SaveGame — wołane przy KAŻDYM saveToLocal. */
export function buildSaveSlotMeta(s: SaveGame): SaveSlotMeta {
  const meta = s.meta as Record<string, unknown> | undefined;
  return {
    label: typeof meta?.label === 'string' ? meta.label.trim() : '',
    tura: s.tura,
    savedAt: typeof meta?.savedAt === 'string' ? meta.savedAt : '',
    ...extractSaveContextFields(s),
  };
}

/**
 * Czyta nagłówek zapisu z osobnego klucza meta (Defekt C) — MAŁY JSON.parse
 * zamiast pełnego zapisu. Zwraca null, gdy klucz nie istnieje (stary zapis
 * sprzed tej naprawy — wołający ma fallbackować na pełne `loadFromLocal` +
 * `saveContextLine`, patrz saveLoadDialog.ts) albo jest uszkodzony.
 *
 * MIGRACJA IDB: async -- sprawdza IndexedDB jako pierwsze (nowe zapisy),
 * gdy klucza tam brak spada na localStorage (stare zapisy sprzed migracji).
 */
export async function loadSaveSlotMeta(slot: string): Promise<SaveSlotMeta | null> {
  let raw = await idbGetItem(saveMetaKey(slot));
  if (raw === null) {
    const storage = getStorage();
    if (storage !== null) {
      try {
        raw = storage.getItem(saveMetaKey(slot));
      } catch {
        raw = null;
      }
    }
  }
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const p = parsed as Partial<SaveSlotMeta>;
    if (typeof p.tura !== 'number') return null;
    return {
      label: typeof p.label === 'string' ? p.label : '',
      tura: p.tura,
      savedAt: typeof p.savedAt === 'string' ? p.savedAt : '',
      mapSize: typeof p.mapSize === 'string' ? p.mapSize : '—',
      worldType: typeof p.worldType === 'string' ? p.worldType : '',
      civId: typeof p.civId === 'string' ? p.civId : '—',
      unitsCount: typeof p.unitsCount === 'number' ? p.unitsCount : 0,
      citiesCount: typeof p.citiesCount === 'number' ? p.citiesCount : 0,
      seed: typeof p.seed === 'number' ? p.seed : 0,
      saveOrigin: typeof p.saveOrigin === 'string' ? p.saveOrigin : '',
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// SaveGame -- the serializable snapshot
// ---------------------------------------------------------------------------

/**
 * A complete, JSON-serializable snapshot of a game in progress.
 *
 * Everything here is plain JSON (numbers, strings, arrays, plain objects) so
 * that JSON.stringify / JSON.parse round-trip without loss.  Notably `explored`
 * is a string[] rather than a Set<string>, because Sets do not survive JSON --
 * the integrator converts the runtime `Set<string>` to an array (and back).
 */
export interface SaveGame {
  /** Save format version; must match SAVE_VERSION to load. */
  wersja: number;

  /** Current turn number (the `turn` local in main.ts; starts at 1). */
  tura: number;

  /**
   * Map generation seed.  Optional only for forward flexibility; in practice
   * it should always be present so the map can be regenerated on load.
   */
  seed?: number;

  /** All units on the map (the live `units: RuntimeUnit[]`). */
  units: RuntimeUnit[];

  /** All founded cities (the live `cities: City[]`). */
  cities: City[];

  /**
   * Fog-of-war explored hex keys ("q,r").  Stored as an array; the runtime
   * holds a Set<string> -- convert with Array.from(explored) on save and
   * new Set(save.explored) on load.
   */
  explored: string[];

  /**
   * Optional player economy / treasury snapshot.  Loosely typed (`any`)
   * because main.ts does not yet keep a single discrete player-economy object
   * (economy is derived per turn).  Fill once such a structure exists.
   */
  gracz?: any;

  /**
   * P6: Per-city production queues (cityId -> CityProduction serialized).
   * Stored as plain object for JSON compatibility.
   */
  cityProd?: Record<string, any>;

  /**
   * P6: Per-city built building ids (cityId -> string[]).
   */
  cityBuilt?: Record<string, string[]>;

  /**
   * P6: AI research progress (ownerId -> zbadane tech ids).
   * Stored as array of [ownerId, zbadane[]] pairs for JSON compatibility.
   */
  aiResearchDone?: Array<[number, string[]]>;

  /**
   * P6: Diplomacy relations (key "a_b" -> Relation serialized).
   */
  diploRelations?: Record<string, any>;

  /**
   * A3-P0-2: aktywny marsz (legacy — pierwszy / ostatni planowany).
   * Pełna mapa w `plannedMarches` (SAVE_VERSION ≥ 2).
   */
  autoMarch?: { leaderId: string; destQ: number; destR: number };

  /** A3: wszystkie zaplanowane marsze gracza (unitId → cel). */
  plannedMarches?: Record<string, { destQ: number; destR: number; attackUnitId?: string }>;

  /** Optional free-form metadata: timestamp, label, map dimensions, etc. */
  meta?: any;

  /**
   * Handel E3: aktywne trasy handlowe gracz<->obca cywilizacja (trade-routes.ts).
   * Opcjonalne — starszy zapis bez tego pola normalizuje się do [] (jak inne
   * opcjonalne kolekcje: cityProd/cityBuilt/diploRelations), bez bumpu SAVE_VERSION.
   */
  tradeRoutes?: TradeRoute[];

  /** E1: jeden tier jakości mapy (bundled preset). */
  mapQuality?: 'low' | 'medium' | 'high';
  /** Jakość renderu GPU (denormalizacja z mapQuality; legacy save). */
  renderQuality?: 'low' | 'medium' | 'high';
  /** Szczegółowość dekoracji mapy 3D (denormalizacja z mapQuality; legacy save). */
  mapDetailQuality?: 'low' | 'medium' | 'high';

  /**
   * P-WCZYTYWANIE-REGENERUJE-MAPE-OD-ZERA (Maciej, ECHO A): pełna siatka
   * heksów w chwili zapisu (map/mapSnapshot.ts::serializeMapForSave). Gdy
   * obecne, wczytanie buduje mapę wprost stąd — BEZ wołania generatora
   * (game/load-map-source.ts::loadMapForSave). Opcjonalne wyłącznie dla
   * wstecznej zgodności: stare zapisy (przed tą zmianą) go nie mają i
   * wczytują się dokładnie jak dziś — regeneracją z `seed`.
   * / EN: full hex grid at save time. When present, load builds the map
   * straight from it -- WITHOUT calling the generator. Optional solely for
   * backward compatibility: saves written before this field existed lack it
   * and load exactly as before -- regenerated from `seed`.
   */
  mapSnapshot?: SerializedMapData;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * JSON.stringify replacer that turns any Set into a plain array so a snapshot
 * survives serialization even if a Set slipped through (e.g. an explored Set
 * was assigned to SaveGame.explored without conversion).  All other values are
 * passed through unchanged.
 */
function setAwareReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Set) {
    return Array.from(value as Set<unknown>);
  }
  return value;
}

/**
 * Reads the major version of a parsed save object defensively.
 * Returns NaN when the field is missing or not a finite number.
 */
function readVersion(obj: unknown): number {
  if (obj !== null && typeof obj === 'object' && 'wersja' in obj) {
    const v = (obj as { wersja: unknown }).wersja;
    if (typeof v === 'number' && Number.isFinite(v)) {
      return v;
    }
  }
  return NaN;
}

/**
 * Returns the live Storage object if localStorage is usable in this runtime,
 * otherwise null.  Guards against:
 *   - localStorage being undefined (Node, web worker, file:// in some engines),
 *   - access throwing (sandboxed iframes, disabled storage).
 * This keeps every localStorage helper pure-safe: they never throw on a
 * platform that lacks storage -- they simply report failure.
 */
function getStorage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// serializeGame
// ---------------------------------------------------------------------------

/**
 * Serializes a SaveGame to a JSON string.
 *
 * The `wersja` field is normalized to SAVE_VERSION so callers do not have to
 * remember to stamp it.  Any Set encountered during stringify is converted to
 * an array (see setAwareReplacer) -- e.g. a stray explored Set still produces
 * valid JSON.
 *
 * Pure: no side effects, no I/O.
 */
export function serializeGame(s: SaveGame): string {
  const stamped: SaveGame = { ...s, wersja: SAVE_VERSION };
  return JSON.stringify(stamped, setAwareReplacer);
}

// ---------------------------------------------------------------------------
// deserializeGame
// ---------------------------------------------------------------------------

/**
 * Parses a JSON string back into a SaveGame and validates the format version.
 *
 * Throws Error when:
 *   - the input is not valid JSON,
 *   - the parsed value is not an object,
 *   - `wersja` is missing / not a number,
 *   - `wersja` is newer than SAVE_VERSION (cannot safely load a future format).
 *
 * Older versions (wersja < SAVE_VERSION) are accepted: callers may migrate.
 * The returned `explored` is left as parsed (an array); convert to a Set in
 * the integrator with `new Set(save.explored)`.
 *
 * Pure: no side effects, no I/O.
 */
export function deserializeGame(json: string): SaveGame {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    throw new Error('deserializeGame: niepoprawny JSON (' + String(e) + ')');
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('deserializeGame: oczekiwano obiektu zapisu');
  }

  const ver = readVersion(parsed);
  if (Number.isNaN(ver)) {
    throw new Error('deserializeGame: brak lub niepoprawne pole wersja');
  }
  if (ver > SAVE_VERSION) {
    throw new Error(
      'deserializeGame: wersja zapisu ' + ver +
      ' jest nowsza niz obslugiwana ' + SAVE_VERSION,
    );
  }

  // Defensive normalization: guarantee the array-shaped fields are arrays so
  // downstream code never crashes on a malformed but version-valid payload.
  const obj = parsed as Partial<SaveGame> & { wersja: number };
  const obj2 = parsed as any;
  const save: SaveGame = {
    wersja: ver,
    tura: typeof obj.tura === 'number' ? obj.tura : 1,
    seed: typeof obj.seed === 'number' ? obj.seed : undefined,
    units: Array.isArray(obj.units) ? (obj.units as RuntimeUnit[]) : [],
    cities: Array.isArray(obj.cities) ? (obj.cities as City[]) : [],
    explored: Array.isArray(obj.explored) ? (obj.explored as string[]) : [],
    gracz: obj.gracz,
    cityProd:       obj2.cityProd,
    cityBuilt:      obj2.cityBuilt,
    aiResearchDone: Array.isArray(obj2.aiResearchDone) ? obj2.aiResearchDone : undefined,
    diploRelations: obj2.diploRelations,
    autoMarch: obj2.autoMarch,
    plannedMarches: obj2.plannedMarches,
    tradeRoutes: Array.isArray(obj2.tradeRoutes) ? obj2.tradeRoutes : undefined,
    meta: obj.meta,
    mapQuality: obj2.mapQuality,
    renderQuality: obj2.renderQuality,
    mapDetailQuality: obj2.mapDetailQuality,
    // Stary zapis (sprzed tej naprawy) nie ma tego pola -- undefined tutaj
    // jest SYGNAŁEM dla loadMapForSave, żeby wrócić do regeneracji z seed
    // (wsteczna kompatybilność). Malformowany snapshot traktujemy tak samo
    // jak brak -- isValidMapSnapshot go odrzuca zamiast wywalać się dalej
    // na czytaniu np. hexes.
    mapSnapshot: isValidMapSnapshot(obj2.mapSnapshot) ? obj2.mapSnapshot : undefined,
  };
  return save;
}

// ---------------------------------------------------------------------------
// saveToLocal
// ---------------------------------------------------------------------------

/**
 * Why a save write to localStorage failed. 'quota' means the browser's
 * storage limit was hit (typically QuotaExceededError) -- a case callers may
 * want to surface differently from a generic/unexpected failure ('other').
 */
export type SaveToLocalFailReason = 'quota' | 'other';

/** Result of {@link saveToLocal}: success flag plus, on failure, why. */
export interface SaveToLocalResult {
  ok: boolean;
  reason?: SaveToLocalFailReason;
}

/**
 * True when `err` looks like a browser storage-quota-exceeded error.
 * Covers the DOMException `.name` used by Chromium/Safari
 * ('QuotaExceededError') and legacy `.code` values (22 per the old
 * `DOMException` constants table, 1014 on pre-Quantum Firefox).
 */
function isQuotaExceededError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { name?: unknown; code?: unknown };
  if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') return true;
  return e.code === 22 || e.code === 1014;
}

/**
 * Serializes a SaveGame and writes it into a named IndexedDB slot.
 *
 * The stored key is SAVE_PREFIX + slot.  Returns { ok: true } on success,
 * { ok: false, reason } when:
 *   - IndexedDB is unavailable -> reason 'other',
 *   - the write rejects because the browser's storage quota is exceeded
 *     -> reason 'quota',
 *   - the write rejects for any other reason -> reason 'other'.
 *
 * MIGRACJA IDB: NOWE zapisy idą WYŁĄCZNIE do IndexedDB (nie do localStorage
 * -- to właśnie ten podwójny zapis, gdyby istniał, odtworzyłby problem
 * budżetu, który ta migracja rozwiązuje). Async -- była synchroniczna pod
 * localStorage.
 *
 * Browser-safe: never throws; reports failure via the returned result.
 */
export async function saveToLocal(slot: string, s: SaveGame): Promise<SaveToLocalResult> {
  try {
    await idbSetItem(SAVE_PREFIX + slot, serializeGame(s));
  } catch (err) {
    return { ok: false, reason: isQuotaExceededError(err) ? 'quota' : 'other' };
  }
  // Defekt C: nagłówek OSOBNO, żeby dialog "Wczytaj grę" nie musiał
  // parsować pełnego zapisu tylko po label/tura/savedAt. Best-effort —
  // niepowodzenie zapisu meta (np. quota w tym samym oddechu, mało
  // prawdopodobne przy jego rozmiarze) NIE cofa głównego zapisu, który
  // już się powiódł; wołający dostaje ok:true, a summarizeSaveSlots()
  // fallbackuje na pełne parsowanie, gdy klucz meta brakuje.
  // / EN: Defect C: header stored SEPARATELY so the "Load game" dialog
  // doesn't need to parse the full save just for label/turn/savedAt.
  // Best-effort — a meta-write failure (e.g. quota in the same breath,
  // unlikely given its size) does NOT roll back the main save, which
  // already succeeded; the caller still gets ok:true, and
  // summarizeSaveSlots() falls back to full parsing when the meta key is
  // missing.
  try {
    await idbSetItem(saveMetaKey(slot), JSON.stringify(buildSaveSlotMeta(s)));
  } catch {
    // Runda 3 (Evaluator): porażka zapisu NIE była nettoowana ze starym
    // kluczem meta z poprzedniego zapisu tego samego slotu -- ten stary
    // klucz zostawał nietknięty, więc summarizeSaveSlots() czytał
    // NIEAKTUALNE dane (stara tura/label) zamiast fallbackować na pełne
    // parsowanie. Usuwamy STARY klucz meta (best-effort -- idbRemoveItem
    // nigdy nie rzuca), żeby brak klucza (nie stary klucz) wymusił poprawny
    // fallback.
    // / EN: round 3 (Evaluator): a write failure did NOT clear the STALE
    // meta key left over from this slot's previous save -- that stale key
    // stayed untouched, so summarizeSaveSlots() read OUTDATED data (old
    // turn/label) instead of falling back to full parsing. Remove the
    // STALE meta key (best-effort -- idbRemoveItem never rejects), so a
    // MISSING key (not a stale one) drives the correct fallback.
    await idbRemoveItem(saveMetaKey(slot));
    // P-INDEXEDDB-MENU-KONTYNUUJ-MARTWE, znalezisko F2 (Evaluator, 2026-08-12):
    // czyszczenie samego klucza IDB nie wystarcza -- loadSaveSlotMeta() po
    // nieudanym odczycie z IDB (raw === null) SPADA na legacy localStorage pod
    // TYM SAMYM kluczem (saveMetaKey(slot)). Jeśli ten slot miał kiedyś zapis
    // meta sprzed migracji IDB, stary wpis w localStorage "zmartwychwstaje" --
    // dialog "Wczytaj grę" pokazuje STARĄ etykietę/turę dla NOWSZEGO zapisu
    // (sama treść zapisu w IDB jest poprawna, tylko wyświetlane metadane są
    // przestarzałe). Czyścimy więc RÓWNIEŻ legacy klucz localStorage, tym samym
    // wzorcem co deleteLocal() niżej (best-effort, nie rzuca).
    // / EN: P-INDEXEDDB-MENU-KONTYNUUJ-MARTWE, finding F2 (Evaluator,
    // 2026-08-12): clearing the IDB key alone is not enough -- after a failed
    // IDB read (raw === null), loadSaveSlotMeta() FALLS BACK to legacy
    // localStorage under the SAME key (saveMetaKey(slot)). If this slot ever
    // had a pre-IDB-migration meta entry, that stale localStorage entry
    // "resurrects" -- the "Load game" dialog shows the OLD label/turn for the
    // NEWER save (the save body in IDB is fine, only the displayed metadata is
    // stale). So also clear the legacy localStorage key, same pattern as
    // deleteLocal() below (best-effort, never throws).
    const storage = getStorage();
    if (storage !== null) {
      try { storage.removeItem(saveMetaKey(slot)); } catch { /* ignore -- best-effort */ }
    }
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// loadFromLocal
// ---------------------------------------------------------------------------

/**
 * Reads a SaveGame back from a named save slot.
 *
 * MIGRACJA IDB: sprawdza IndexedDB jako pierwsze (nowe zapisy); gdy klucza
 * tam brak, spada na localStorage pod tym samym kluczem (wsteczna zgodność
 * dla zapisów sprzed migracji -- świadomie bez aktywnego kopiowania do IDB).
 *
 * Returns the parsed SaveGame, or null when:
 *   - neither backend has the slot,
 *   - the stored JSON is invalid or fails version validation.
 *
 * Browser-safe: never throws; any deserialize error collapses to null.
 */
export async function loadFromLocal(slot: string): Promise<SaveGame | null> {
  let raw = await idbGetItem(SAVE_PREFIX + slot);
  if (raw === null) {
    const storage = getStorage();
    if (storage !== null) {
      try {
        raw = storage.getItem(SAVE_PREFIX + slot);
      } catch {
        raw = null;
      }
    }
  }
  if (raw === null) return null;
  try {
    return deserializeGame(raw);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// listSaves
// ---------------------------------------------------------------------------

/**
 * Lists the slot names of all saves currently stored.
 *
 * MIGRACJA IDB: unia kluczy z IndexedDB (nowe zapisy) i localStorage (stare
 * zapisy sprzed migracji) -- gracz nie traci widoczności starych sejwów.
 * Scans every matching key, keeps those starting with SAVE_PREFIX, and
 * strips the prefix so callers get bare slot names (the same strings passed
 * to saveToLocal). Results are sorted for stable display, de-duplicated
 * (a slot resaved after the migration exists in IDB only, but a slot never
 * touched since stays in localStorage only -- either way it appears once).
 *
 * FANTOM `_lastPlayed` (Maciej/Evaluator): LAST_PLAYED_SLOT_KEY =
 * SAVE_PREFIX + '_lastPlayed' -- w odróżnieniu od SAVE_META_PREFIX (rozłączny
 * z SAVE_PREFIX, patrz komentarz przy tej stałej) ten klucz CELOWO dzieli
 * prefiks z prawdziwymi slotami zapisu, więc po odcięciu SAVE_PREFIX zostaje
 * '_lastPlayed' i bez tego filtra trafiłby do wyniku jako fałszywy dodatkowy
 * slot -- dokładnie ten sam wzorzec, który summarizeSaveSlots()
 * (saveLoadDialog.ts) już stosuje przy renderze listy (`slotId.startsWith('_')`).
 * Odrzucamy więc każdy klucz, którego nazwa slotu (po odcięciu SAVE_PREFIX)
 * zaczyna się od '_' -- to sam LAST_PLAYED_SLOT_KEY dziś, ale reguła obejmuje
 * też każdy przyszły meta-wskaźnik zapisany pod tym samym schematem nazw.
 * / EN: PHANTOM `_lastPlayed` (Maciej/Evaluator): LAST_PLAYED_SLOT_KEY =
 * SAVE_PREFIX + '_lastPlayed' -- unlike SAVE_META_PREFIX (disjoint from
 * SAVE_PREFIX, see the comment by that constant) this key DELIBERATELY
 * shares the prefix with real save slots, so stripping SAVE_PREFIX leaves
 * '_lastPlayed' behind, and without this filter it would show up in the
 * result as a bogus extra slot -- the exact same pattern
 * summarizeSaveSlots() (saveLoadDialog.ts) already applies when rendering
 * the list (`slotId.startsWith('_')`). So we reject any key whose slot name
 * (after stripping SAVE_PREFIX) starts with '_' -- today that's just
 * LAST_PLAYED_SLOT_KEY, but the rule also covers any future meta pointer
 * saved under the same naming scheme. See guard assertion in
 * map-snapshot-load-test.cjs.
 *
 * Returns [] when both backends are unavailable or hold no saves.
 * Browser-safe: never throws.
 */
export async function listSaves(): Promise<string[]> {
  const slots = new Set<string>();
  const idbKeys = await idbListKeys();
  for (const key of idbKeys) {
    if (!key.startsWith(SAVE_PREFIX)) continue;
    const slot = key.slice(SAVE_PREFIX.length);
    if (slot.startsWith('_')) continue;
    slots.add(slot);
  }
  const storage = getStorage();
  if (storage !== null) {
    try {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key === null || !key.startsWith(SAVE_PREFIX)) continue;
        const slot = key.slice(SAVE_PREFIX.length);
        if (slot.startsWith('_')) continue;
        slots.add(slot);
      }
    } catch {
      /* ignore -- IDB results (if any) still stand */
    }
  }
  return Array.from(slots).sort();
}

// ---------------------------------------------------------------------------
// deleteLocal
// ---------------------------------------------------------------------------

/**
 * Removes a named save slot from BOTH backends (IndexedDB and legacy
 * localStorage) -- a slot may exist in either depending on when it was last
 * written (MIGRACJA IDB), so a full delete must clear both to actually make
 * the slot disappear from listSaves()/loadFromLocal().
 *
 * Returns true when at least one backend's removal call completed (whether
 * or not the slot existed there), false when both are unavailable or throw.
 * Convenience companion to saveToLocal; browser-safe, never throws.
 */
export async function deleteLocal(slot: string): Promise<boolean> {
  let ok = false;
  try {
    await idbRemoveItem(SAVE_PREFIX + slot);
    await idbRemoveItem(saveMetaKey(slot));
    ok = true;
  } catch {
    /* idbRemoveItem is designed to never reject -- defensive only */
  }
  const storage = getStorage();
  if (storage !== null) {
    try {
      storage.removeItem(SAVE_PREFIX + slot);
      try { storage.removeItem(saveMetaKey(slot)); } catch { /* ignore -- best-effort */ }
      ok = true;
    } catch {
      /* localStorage unavailable/throws -- the IDB removal above still stands */
    }
  }
  return ok;
}

// ---------------------------------------------------------------------------
// Last played slot (Kontynuuj)
// ---------------------------------------------------------------------------

/**
 * MIGRACJA IDB: wskaźnik "ostatnio grane" SAM ZOSTAJE w localStorage
 * (świadoma decyzja zakresu -- to mały string, kilkadziesiąt bajtów, nie
 * przyczynia się do budżetu quota, który ta migracja rozwiązuje). Funkcja
 * jednak MUSI stać się async, bo waliduje wskaźnik przez `loadFromLocal()`
 * (teraz async -- sprawdza IndexedDB).
 * / EN: the "last played" pointer itself STAYS in localStorage (a deliberate
 * scoping decision -- it's a tiny string, a few dozen bytes, not a
 * contributor to the quota budget this migration solves). The function must
 * still become async because it validates the pointer via `loadFromLocal()`
 * (now async -- checks IndexedDB).
 */
export async function getLastPlayedSlotId(): Promise<string | null> {
  const storage = getStorage();
  if (storage === null) return null;
  try {
    const raw = storage.getItem(LAST_PLAYED_SLOT_KEY);
    if (!raw || !raw.trim()) return null;
    // Wskaźnik na plik FSA (dysk) -- walidacja wymagałaby odczytu async z
    // katalogu na dysku, którego ta czysto-synchroniczna funkcja nie może
    // wykonać. Zwracamy wskaźnik bez walidacji; wołający (loadGameFromSlot
    // w main.ts) i tak obsługuje brak/niewczytywalność pliku łagodnie.
    // / EN: pointer to an FSA (disk) file -- validating it would need an
    // async read from the disk directory, which this purely-synchronous
    // function cannot perform. Return the pointer unvalidated; the caller
    // (main.ts::loadGameFromSlot) already degrades gracefully when the file
    // is missing or fails to load.
    if (raw.startsWith(FSA_SLOT_PREFIX)) return raw;
    return (await loadFromLocal(raw)) ? raw : null;
  } catch {
    return null;
  }
}

export function setLastPlayedSlotId(slotId: string): void {
  const storage = getStorage();
  if (storage === null) return;
  try {
    storage.setItem(LAST_PLAYED_SLOT_KEY, slotId);
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Slot ID helpers
// ---------------------------------------------------------------------------

/** Bezpieczny klucz localStorage z etykiety gracza. */
export function slotSlugFromLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return `zapis-${Date.now()}`;
  const base = trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return base || `zapis-${Date.now()}`;
}

/**
 * Nowy slot — zawsze unikalny (nie nadpisuje innej gry o podobnej nazwie).
 * Ten sam slug + timestamp zapobiega kolizji „Grecja tura 5" z dwóch sesji.
 */
export function uniqueSlotIdFromLabel(label: string): string {
  return `${slotSlugFromLabel(label)}-${Date.now().toString(36)}`;
}

export interface SaveIntegrityIssue {
  code: string;
  message: string;
}

/** Sprawdza, czy zapis ma dane do odtworzenia mapy (bez stanu runtime). */
export function checkSaveIntegrity(g: SaveGame): SaveIntegrityIssue[] {
  const issues: SaveIntegrityIssue[] = [];
  if (typeof g.seed !== 'number' || g.seed <= 0) {
    issues.push({ code: 'no_seed', message: 'brak seed mapy' });
  }
  const meta = g.meta as Record<string, unknown> | undefined;
  const ngp = meta?.newGameParams as { civId?: string; mapSize?: string; typSwiata?: string } | undefined;
  const hasFullParams = ngp && typeof ngp.civId === 'string';
  const hasLegacyMeta = typeof meta?.loadTypSwiata === 'string' && typeof meta?.loadMapSize === 'string';
  if (!hasFullParams && !hasLegacyMeta) {
    issues.push({ code: 'no_map_meta', message: 'brak parametrów mapy (stary zapis sprzed kreatora)' });
  }
  if (!Array.isArray(g.cities)) {
    issues.push({ code: 'no_cities', message: 'brak miast w zapisie' });
  }
  return issues;
}
