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
 *   saveToLocal()        - write a SaveGame into a named localStorage slot
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
 *   The map itself is NOT stored here: it is regenerated deterministically from
 *   `seed` on load (generateMap(width, height, seed)).  Persist map width/height
 *   in `meta` if they are not fixed constants on the loading side.
 */

import type { RuntimeUnit } from '../units/setup';
import type { City } from './cities';

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

/** Slot szybkiego zapisu (Ctrl+S) — zawsze ten sam klucz, osobno od nazwanych sejwów. */
export const AUTOSAVE_SLOT_ID = 'autosave';

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

  /** E1: jeden tier jakości mapy (bundled preset). */
  mapQuality?: 'low' | 'medium' | 'high';
  /** Jakość renderu GPU (denormalizacja z mapQuality; legacy save). */
  renderQuality?: 'low' | 'medium' | 'high';
  /** Szczegółowość dekoracji mapy 3D (denormalizacja z mapQuality; legacy save). */
  mapDetailQuality?: 'low' | 'medium' | 'high';
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
    meta: obj.meta,
    mapQuality: obj2.mapQuality,
    renderQuality: obj2.renderQuality,
    mapDetailQuality: obj2.mapDetailQuality,
  };
  return save;
}

// ---------------------------------------------------------------------------
// saveToLocal
// ---------------------------------------------------------------------------

/**
 * Serializes a SaveGame and writes it into a named localStorage slot.
 *
 * The stored key is SAVE_PREFIX + slot.  Returns true on success, false when:
 *   - localStorage is unavailable (typeof localStorage === 'undefined' etc.),
 *   - the write throws (e.g. quota exceeded).
 *
 * Browser-safe: never throws; reports failure via the boolean return.
 */
export function saveToLocal(slot: string, s: SaveGame): boolean {
  const storage = getStorage();
  if (storage === null) return false;
  try {
    storage.setItem(SAVE_PREFIX + slot, serializeGame(s));
    return true;
  } catch {
    return false;
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
