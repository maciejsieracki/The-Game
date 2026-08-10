/**
 * save.ts
 * SAVE / LOAD (task F1) -- serialize the live game state to a JSON string and
 * back, plus optional localStorage slot helpers.
 *
 * Pure / browser-safe logic: no DOM, no THREE, no side effects beyond the
 * explicitly localStorage-backed helpers (which are guarded so they degrade
 * gracefully when localStorage is unavailable, e.g. under Node or file://).
 *
 * Exports:
 *   SaveGame             - serializable snapshot of one game in progress
 *   SAVE_VERSION         - current on-disk save format version
 *   SAVE_PREFIX          - localStorage key prefix for save slots
 *   serializeGame()      - SaveGame  -> JSON string
 *   deserializeGame()    - JSON string -> SaveGame (validates wersja)
 *   saveToLocal()        - write a SaveGame into a named localStorage slot,
 *                          returns { ok, reason? } ('quota' | 'other')
 *   loadFromLocal()      - read a SaveGame back from a named slot (or null)
 *   listSaves()          - list all save slot names found in localStorage
 *   deleteLocal()        - remove a named slot (convenience; pure-safe)
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
 * zapisywany OSOBNO od pełnej treści zapisu (Defekt C, runda 2). Celowo NIE
 * jest podprefiksem SAVE_PREFIX (nie `SAVE_PREFIX + slot + '.meta'`) —
 * `listSaves()` iteruje WSZYSTKIE klucze zaczynające się od SAVE_PREFIX i
 * traktuje resztę jako nazwę slotu; klucz meta pod tym samym prefiksem
 * pojawiłby się tam jako fałszywy dodatkowy "slot" (`<realSlot>.meta`).
 * Osobny prefiks eliminuje kolizję bez zmiany `listSaves()`.
 * / EN: META key prefix — a SMALL save header (label/tura/savedAt/context),
 * stored SEPARATELY from the full save body (Defect C, round 2).
 * Deliberately NOT a sub-prefix of SAVE_PREFIX (not
 * `SAVE_PREFIX + slot + '.meta'`) — `listSaves()` iterates ALL keys starting
 * with SAVE_PREFIX and treats the remainder as the slot name; a meta key
 * under that same prefix would show up there as a bogus extra "slot"
 * (`<realSlot>.meta`). A separate prefix avoids the collision without
 * touching `listSaves()`.
 */
export const SAVE_META_PREFIX = 'thegame.save.meta.';

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
 */
export function loadSaveSlotMeta(slot: string): SaveSlotMeta | null {
  const storage = getStorage();
  if (storage === null) return null;
  let raw: string | null;
  try {
    raw = storage.getItem(saveMetaKey(slot));
  } catch {
    return null;
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
 * Serializes a SaveGame and writes it into a named localStorage slot.
 *
 * The stored key is SAVE_PREFIX + slot.  Returns { ok: true } on success,
 * { ok: false, reason } when:
 *   - localStorage is unavailable (typeof localStorage === 'undefined' etc.)
 *     -> reason 'other',
 *   - the write throws because the browser's storage quota is exceeded
 *     -> reason 'quota',
 *   - the write throws for any other reason -> reason 'other'.
 *
 * Browser-safe: never throws; reports failure via the returned result.
 */
export function saveToLocal(slot: string, s: SaveGame): SaveToLocalResult {
  const storage = getStorage();
  if (storage === null) return { ok: false, reason: 'other' };
  try {
    storage.setItem(SAVE_PREFIX + slot, serializeGame(s));
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
      storage.setItem(saveMetaKey(slot), JSON.stringify(buildSaveSlotMeta(s)));
    } catch {
      /* ignore -- best-effort, patrz komentarz wyżej / see comment above */
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: isQuotaExceededError(err) ? 'quota' : 'other' };
  }
}

// ---------------------------------------------------------------------------
// loadFromLocal
// ---------------------------------------------------------------------------

/**
 * Reads a SaveGame back from a named localStorage slot.
 *
 * Returns the parsed SaveGame, or null when:
 *   - localStorage is unavailable,
 *   - the slot does not exist,
 *   - the stored JSON is invalid or fails version validation.
 *
 * Browser-safe: never throws; any deserialize error collapses to null.
 */
export function loadFromLocal(slot: string): SaveGame | null {
  const storage = getStorage();
  if (storage === null) return null;
  let raw: string | null;
  try {
    raw = storage.getItem(SAVE_PREFIX + slot);
  } catch {
    return null;
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
 * Lists the slot names of all saves currently stored in localStorage.
 *
 * Scans every key, keeps those starting with SAVE_PREFIX, and strips the prefix
 * so callers get bare slot names (the same strings passed to saveToLocal).
 * Results are sorted for stable display.
 *
 * Returns [] when localStorage is unavailable or holds no saves.
 * Browser-safe: never throws.
 */
export function listSaves(): string[] {
  const storage = getStorage();
  if (storage === null) return [];
  const slots: string[] = [];
  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key !== null && key.startsWith(SAVE_PREFIX)) {
        slots.push(key.slice(SAVE_PREFIX.length));
      }
    }
  } catch {
    return [];
  }
  slots.sort();
  return slots;
}

// ---------------------------------------------------------------------------
// deleteLocal
// ---------------------------------------------------------------------------

/**
 * Removes a named save slot from localStorage.
 *
 * Returns true when the removal call completed (whether or not the slot
 * existed), false when localStorage is unavailable or the call throws.
 * Convenience companion to saveToLocal; browser-safe, never throws.
 */
export function deleteLocal(slot: string): boolean {
  const storage = getStorage();
  if (storage === null) return false;
  try {
    storage.removeItem(SAVE_PREFIX + slot);
    try { storage.removeItem(saveMetaKey(slot)); } catch { /* ignore -- best-effort */ }
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Last played slot (Kontynuuj)
// ---------------------------------------------------------------------------

export function getLastPlayedSlotId(): string | null {
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
    return loadFromLocal(raw) ? raw : null;
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
