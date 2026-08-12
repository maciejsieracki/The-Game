/**
 * barbarians.ts
 * Neutral hostile faction ("barbarzyncy") for The Game -- pure functions only.
 * No DOM, no THREE, no main.ts. Deterministic (all randomness via a seed).
 *
 * Scope (BACKLOG C4): camp spawning, a per-camp unit cap, simple aggression,
 * and movement toward the nearest player unit / city. The engine (SILNIK) wires
 * the returned commands into the turn loop later; this module never mutates
 * shared game state itself -- it returns plain data the caller applies.
 *
 * Owner model:
 *   RuntimeUnit.ownerId 0 = human, 1..N = AI rivals (see units/setup.ts).
 *   Barbarians use a dedicated sentinel owner id BARBARIAN_OWNER_ID (= -1)
 *   so they are never confused with a real player.
 *
 * Geometry / pathing are reused from units/setup.ts (hexDistance, computePath,
 * keyOf) so barbarians move on exactly the same terrain rules as everyone else.
 *
 * Tunable coefficients live in BarbParams. Defaults are in FALLBACK_BARB_PARAMS;
 * loadBarbParams() reads optional overrides from data/ai-params.json (the
 * "barbarzyncy_*" keys). NOTE for DANE/SILNIK: those keys must be added to
 * AI-parametry.xlsx for the panel; until then the fallbacks apply.
 *
 * References:
 *   Spec-AI.md §2.3 (retreat at low HP), §6b (camp = rest/regen),
 *   PROJEKT-GRY-master.md (neutral villages / hostile camps),
 *   units/setup.ts (RuntimeUnit, hexDistance, computePath, keyOf).
 */

import type { GameMap } from '../types/map';
import type { GameData } from '../data/loader';
import { TerenBazowy } from '../types/hex';
import type { City } from './cities';
import { addForeignCityBlocks } from './city-hex-movement';
import type { Hex } from '../types/hex';
import type { RuntimeUnit } from '../units/setup';
import { hexDistance, computePath, keyOf, isWaterTerrain, embarkMoveCost } from '../units/setup';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Sentinel owner id for the barbarian faction.
 * Distinct from human (0) and AI rivals (1..N). Negative by design so any
 * `ownerId >= 0` test treats barbarians as "not a real player".
 */
export const BARBARIAN_OWNER_ID = -1;

/** Returns true when an owner id belongs to the barbarian faction. */
export function isBarbarian(ownerId: number): boolean {
  return ownerId === BARBARIAN_OWNER_ID;
}

// ---------------------------------------------------------------------------
// Data structures
// ---------------------------------------------------------------------------

/**
 * A barbarian camp on the world map.
 * Camps are stationary spawn points. They are neutral terrain features the
 * engine renders; barbarians retreat to and regenerate at their camp (§6b).
 */
export interface BarbCamp {
  /** Unique id (suggested by spawnCamps; engine may reassign). */
  id: string;
  /** Axial hex coordinates of the camp. */
  q: number;
  r: number;
  /**
   * Turns remaining until this camp may spawn its next unit.
   * Decremented by tickCamps(); a spawn happens when it reaches 0.
   */
  spawnCooldown: number;
  /**
   * TEMAT #15 (Ludy Morza): obóz nadmorski (heks Wybrzeża / wysepka).
   * Spawnuje jednostki ZAOKRĘTOWANE na sąsiednim heksie wody.
   * Pole opcjonalne — stare save'y bez pola = obóz lądowy (kompatybilne).
   */
  naval?: boolean;
}

/**
 * A barbarian unit on the map.
 * Extends the shared RuntimeUnit so the engine can pass plain RuntimeUnit[]
 * (then `healthFrac` / `campId` are simply undefined). Barbarian-specific,
 * optional fields let this module reason about retreat and camp ownership
 * without requiring the runtime layer to carry health.
 */
export interface BarbUnit extends RuntimeUnit {
  /**
   * Current health as a fraction of max (0..1). When below
   * params.retreatHpFrac the unit retreats to its nearest camp (§2.3).
   * Omit when HP is not tracked -- the unit then always advances.
   */
  healthFrac?: number;
  /** Id of the camp this unit was spawned from (informational; optional). */
  campId?: string;
  /**
   * TEMAT #15: jednostka Ludów Morza (spawn z obozu nadmorskiego) — prowadzona
   * przez decideSeaPeoplesRaids (rajdy), a nie zwykłą logikę lądową.
   * Utrwalane w save razem z units[] (pole opcjonalne, wstecznie kompatybilne).
   */
  seaRaider?: boolean;
  /**
   * P-BARBARZYNCY-MIASTA-ZACHOWANIE-Q1 RUNDA 4 (3x jednomyślny Evaluator FAIL na
   * rundach 1-3, powód: pojedynczy slot `recentlyClearedCityId` strukturalnie nie
   * mógł wyrazić "odwiedziłem już A i B" -- zapis B kasował A, A wracał do puli,
   * jednostka drgała między A i B w nieskończoność, trzecie miasto NIGDY nie było
   * odwiedzane). Zastąpione ZBIOREM: id WSZYSTKICH miast, które TA jednostka uznała
   * za "oczyszczone" (bez obrońcy na heksie, niemożliwe do zaatakowania ani wejścia
   * -- patrz canUnitOccupyCityHex). Tablica, NIE `Set` -- `save.ts::serializeGame`
   * serializuje `units: RuntimeUnit[]` wprost przez `JSON.stringify` (patrz
   * `setAwareReplacer`, który owszem zamienia `Set` na tablicę PRZY ZAPISIE, ale
   * `deserializeGame` nie ma odwrotnego revivera -- po wczytaniu pole byłoby zwykłą
   * tablicą mimo deklarowanego typu `Set`, cichy rozjazd typu z rzeczywistością).
   * Zwykła tablica `string[]` przechodzi round-trip identycznie jak `campId`/
   * `healthFrac`, bez żadnej specjalnej obsługi. Mutowane bezpośrednio przez
   * decideBarbarianMoves (jedyne świadome odejście od "moduł nigdy nie mutuje
   * stanu" -- pole czysto informacyjne per-jednostka, ten sam wzorzec co
   * `campId`/`healthFrac`). Samo-wygasa PER MIASTO: gdy miasto odzyska obrońcę,
   * filtr (patrz krok 3) przestaje je wykluczać niezależnie od obecności w tym
   * zbiorze. Gdy zbiór wyklucza WSZYSTKIE dostępne (niebronione) miasta -- jednostka
   * odwiedziła każde z nich -- zbiór jest RESETOWANY (patrz krok 3), więc patrol
   * zaczyna kolejne okrążenie zamiast zamarznąć na pełnym zbiorze na stałe. Optional
   * -- stare save'y i testy legacy bez tego pola = brak pamięci, identyczne
   * zachowanie do pierwszego napotkania niebronionego miasta.
   * / EN: id of EVERY city THIS unit has deemed "cleared" (no defender on its hex,
   * unattackable and unenterable -- see canUnitOccupyCityHex). Replaces the single
   * `recentlyClearedCityId` slot from rounds 2-3 (3x unanimous Evaluator FAIL: a
   * single slot cannot express "I've already visited A AND B" -- writing B erased
   * A, A came back into the pool, the unit oscillated between A and B forever, a
   * third city was NEVER visited). Array, NOT a real `Set` -- `save.ts::
   * serializeGame` serializes `units: RuntimeUnit[]` straight through
   * `JSON.stringify` (see `setAwareReplacer`, which does turn a `Set` into an array
   * ON WRITE, but `deserializeGame` has no reviver going back -- after a load the
   * field would silently become a plain array despite the declared `Set` type, a
   * quiet type/reality drift). A plain `string[]` round-trips exactly like
   * `campId`/`healthFrac`, no special handling needed. Mutated directly by
   * decideBarbarianMoves (the one deliberate exception to "this module never
   * mutates state" -- a purely informational per-unit field, same pattern as
   * `campId`/`healthFrac`). Self-expires PER CITY: once a city regains a defender,
   * the step-3 filter stops excluding it regardless of membership in this set.
   * When the set would exclude EVERY available (undefended) city -- the unit has
   * visited each one -- the set is RESET (see step 3), so the patrol starts another
   * lap instead of freezing on a permanently-full set. Optional -- legacy saves/
   * tests without this field simply have no memory yet, identical behaviour up to
   * the first undefended city encountered.
   */
  clearedCityIds?: string[];
}

/**
 * A pending unit spawn produced by tickCamps().
 * The engine turns this into a real RuntimeUnit (resolving stats from
 * units.json) with ownerId = BARBARIAN_OWNER_ID.
 */
export interface BarbSpawn {
  /** Camp that produced the spawn. */
  campId: string;
  /** Spawn location (a free passable land hex next to the camp). */
  q: number;
  r: number;
  /** units.json "Jednostka" key for the spawned barbarian. */
  typeId: string;
  /** TEMAT #15: spawn z obozu nadmorskiego — jednostka startuje ZAOKRĘTOWANA
   *  na heksie wody (silnik ustawia embarked=true i seaRaider=true). */
  embarked?: boolean;
}

/** Move a barbarian unit one step toward (toQ, toR). */
export interface BarbCmdMove {
  type: 'move';
  unitId: string;
  toQ: number;
  toR: number;
}

/** Attack an adjacent player/AI unit (engine resolves via combat.ts). */
export interface BarbCmdAttack {
  type: 'attack';
  unitId: string;
  targetUnitId: string;
}

/**
 * TEMAT #15: rajd Ludów Morza — wejście na heks (toQ,toR) z wrogim ulepszeniem
 * terenu i ZNISZCZENIE go (silnik: hex.ulepszenie = Brak + przenosi jednostkę).
 */
export interface BarbCmdRaid {
  type: 'raid';
  unitId: string;
  toQ: number;
  toR: number;
}

/** Union of barbarian movement-phase commands. */
export type BarbCommand = BarbCmdMove | BarbCmdAttack | BarbCmdRaid;

// ---------------------------------------------------------------------------
// Tunable parameters
// ---------------------------------------------------------------------------

/**
 * All barbarian coefficients. Loaded via loadBarbParams() from ai-params.json
 * with FALLBACK_BARB_PARAMS as defaults.
 */
export interface BarbParams {
  /** First turn on which barbarians are active (no spawns/moves before it). */
  startTurn: number;
  /** Maximum number of camps allowed on the map at once. */
  maxCamps: number;
  /** A new camp must be at least this many hexes from any player city. */
  minDistFromCity: number;
  /** A new camp must be at least this many hexes from any existing camp. */
  campSpacing: number;
  /** Turns between unit spawns at a camp (reset after a successful spawn). */
  spawnInterval: number;
  /** Max living barbarian units counted within campControlRadius of a camp. */
  unitsPerCamp: number;
  /** Radius (hexes) used to count a camp's "owned" units for the cap. */
  campControlRadius: number;
  /** Chase targets within this many hexes; otherwise idle near the camp. */
  aggroRadius: number;
  /** Health fraction (0..1) below which a unit retreats to its camp. */
  retreatHpFrac: number;
  /** units.json "Jednostka" key used for spawned barbarians. */
  unitTypeId: string;
}

/** Built-in defaults; correct even if ai-params.json carries no barbarian keys. */
export const FALLBACK_BARB_PARAMS: BarbParams = {
  startTurn: 5,
  maxCamps: 6,
  minDistFromCity: 5,
  campSpacing: 6,
  spawnInterval: 6,
  unitsPerCamp: 2,
  campControlRadius: 3,
  aggroRadius: 6,
  retreatHpFrac: 0.3,
  unitTypeId: 'Wojownik',
};

/**
 * Reads barbarian overrides from data.aiParams, falling back to
 * FALLBACK_BARB_PARAMS for any missing key.
 *
 * Tolerant of both `wartosc` (ASCII) and `wartość` (diacritic) value fields,
 * because the JSON encoding has drifted between exports.
 *
 * Recognised keys (add these to AI-parametry.xlsx):
 *   barbarzyncy_start_tura, barbarzyncy_max_obozy, barbarzyncy_min_dystans_miasto,
 *   barbarzyncy_odstep_obozow, barbarzyncy_interwal_spawnu, barbarzyncy_jednostek_na_oboz,
 *   barbarzyncy_zasieg_kontroli, barbarzyncy_zasieg_agresji, barbarzyncy_prog_odwrotu_hp.
 */
export function loadBarbParams(data: GameData): BarbParams {
  return {
    startTurn:         readParam(data, 'barbarzyncy_start_tura',         FALLBACK_BARB_PARAMS.startTurn),
    maxCamps:          readParam(data, 'barbarzyncy_max_obozy',          FALLBACK_BARB_PARAMS.maxCamps),
    minDistFromCity:   readParam(data, 'barbarzyncy_min_dystans_miasto', FALLBACK_BARB_PARAMS.minDistFromCity),
    campSpacing:       readParam(data, 'barbarzyncy_odstep_obozow',      FALLBACK_BARB_PARAMS.campSpacing),
    spawnInterval:     readParam(data, 'barbarzyncy_interwal_spawnu',    FALLBACK_BARB_PARAMS.spawnInterval),
    unitsPerCamp:      readParam(data, 'barbarzyncy_jednostek_na_oboz',  FALLBACK_BARB_PARAMS.unitsPerCamp),
    campControlRadius: readParam(data, 'barbarzyncy_zasieg_kontroli',    FALLBACK_BARB_PARAMS.campControlRadius),
    aggroRadius:       readParam(data, 'barbarzyncy_zasieg_agresji',     FALLBACK_BARB_PARAMS.aggroRadius),
    retreatHpFrac:     readParam(data, 'barbarzyncy_prog_odwrotu_hp',    FALLBACK_BARB_PARAMS.retreatHpFrac),
    unitTypeId:        FALLBACK_BARB_PARAMS.unitTypeId,
  };
}

// ---------------------------------------------------------------------------
// TEMAT #15 — Ludy Morza na morzu: parametry rajdów (wg trudności gry)
// ---------------------------------------------------------------------------

/** Klucz trudności silnika (main.ts `_menuDifficulty`). */
export type SeaRaidDifficulty = 'easy' | 'normal' | 'hard';

/**
 * P-BARBARZYNCY-MIASTA-ZACHOWANIE-Q1 RUNDA 2 (Evaluator, punkt 5): decyzja "czy capture
 * miasta przez barbarzyńców jest w ogóle możliwy na danej trudności" wyciągnięta z main.ts
 * (dawniej inline `_menuDifficulty === 'hard'`) do czystej, testowalnej funkcji -- main.ts
 * ma TYLKO wołać tę funkcję, nie zawierać tej decyzji inline (main.ts miał zero pokrycia
 * wykonawczego przez testy -- source-text .includes() na main.ts nie łapał mutacji
 * usuwających/psujących tę bramkę). easy/normal: brak capture (miasto NIE zmienia
 * właściciela, zero zmian względem zachowania sprzed tej rundy). hard: capture dozwolony
 * (dalsze warunki -- czy walka faktycznie wygrana i miasto oczyszczone z obrońców --
 * sprawdza reszta applyMapBattleOutcome, patrz isCityCaptureBlockedByDefenders niżej).
 * / EN: "is barbarian city capture possible at all at this difficulty" pulled out of
 * main.ts (formerly inline `_menuDifficulty === 'hard'`) into a pure, testable function --
 * main.ts should ONLY call this, not contain the decision inline (main.ts had zero
 * executable test coverage -- source-text .includes() on main.ts didn't catch mutations
 * removing/breaking this gate). easy/normal: no capture (city ownership never changes, no
 * change vs. pre-this-round behaviour). hard: capture allowed (further conditions -- did
 * the battle actually win, was the city cleared of defenders -- are checked by the rest of
 * applyMapBattleOutcome, see isCityCaptureBlockedByDefenders below).
 */
export function shouldAllowBarbCityCapture(difficulty: SeaRaidDifficulty): boolean {
  return difficulty === 'hard';
}

/**
 * P-BARBARZYNCY-MIASTA-ZACHOWANIE-Q1 RUNDA 2 (Evaluator, punkt 5): odpowiednik dzisiejszego
 * main.ts `barbCaptureBlockedByRemainingDefenders`, wyciągnięty do czystej funkcji. Zwraca
 * true TYLKO gdy atakujący jest barbarzyńcą ORAZ na heksie (q,r) wciąż stoi choć jedna
 * jednostka NIE-barbarzyńska (walka wygrana, ale miasto jeszcze nie oczyszczone do zera --
 * np. wielo-jednostkowy garnizon, z którego padł tylko jeden obrońca). Dla gracza/AI
 * (atkOwnerId >= 0, NIE barbarzyńca) zawsze zwraca `false` natychmiast -- funkcja NIE
 * rozróżnia gracza (ownerId=0) od AI (ownerId>=1): oba trafiają w tę samą wczesną gałąź
 * `!isBarbarian(atkOwnerId)`, więc identyczny scenariusz z ownerId=0 i ownerId=1 daje
 * IDENTYCZNY wynik z konstrukcji (patrz asercja parytetu w barb-city-behavior-test.cjs).
 * / EN: pure-function equivalent of today's main.ts `barbCaptureBlockedByRemainingDefenders`.
 * Returns true ONLY when the attacker is a barbarian AND at least one NON-barbarian unit
 * still stands on hex (q,r) (battle won, but the city not yet cleared to zero -- e.g. a
 * multi-unit garrison that lost only one defender). For the player/AI (atkOwnerId >= 0, not
 * a barbarian) it always returns `false` immediately -- the function does NOT distinguish
 * the player (ownerId=0) from AI (ownerId>=1): both hit the same early `!isBarbarian
 * (atkOwnerId)` branch, so an identical scenario with ownerId=0 and ownerId=1 gives an
 * IDENTICAL result by construction (see the parity assertion in barb-city-behavior-test.cjs).
 */
export function isCityCaptureBlockedByDefenders(
  atkOwnerId: number,
  units: readonly RuntimeUnit[],
  q: number,
  r: number,
): boolean {
  if (!isBarbarian(atkOwnerId)) return false;
  return units.some(u => u.q === q && u.r === r && !isBarbarian(u.ownerId));
}

/** Parametry obozów nadmorskich i rajdów Ludów Morza. */
export interface SeaBarbParams {
  /** Maksymalna liczba obozów nadmorskich (osobny limit, obok maxCamps lądowych). */
  maxSeaCamps: number;
  /** Zasięg (heksy) szukania celu rajdu: nadmorskie miasto / ulepszenie terenu. */
  raidRadius: number;
  /**
   * Co ile tur rusza „fala rajdów" (1 = co turę). Wg trudności:
   * easy rzadko (6) / normal średnio (3) / hard często (1) — placeholdery
   * w data/ai-params.json (ludy_morza_rajd_okres_*).
   */
  raidPeriod: number;
}

/** Wbudowane domyślne (trudność normal). */
export const FALLBACK_SEA_BARB_PARAMS: SeaBarbParams = {
  maxSeaCamps: 3,
  raidRadius: 8,
  raidPeriod: 3,
};

/**
 * Czyta parametry Ludów Morza z data/ai-params.json (konwencja `wartosc`),
 * z fallbackami. Klucze:
 *   ludy_morza_max_obozy, ludy_morza_rajd_zasieg,
 *   ludy_morza_rajd_okres_latwy / _normalny / _trudny (intensywność wg trudności).
 */
export function loadSeaBarbParams(
  data: GameData,
  difficulty: SeaRaidDifficulty = 'normal',
): SeaBarbParams {
  const periodKey =
    difficulty === 'easy' ? 'ludy_morza_rajd_okres_latwy'
    : difficulty === 'hard' ? 'ludy_morza_rajd_okres_trudny'
    : 'ludy_morza_rajd_okres_normalny';
  const periodFallback = difficulty === 'easy' ? 6 : difficulty === 'hard' ? 1 : 3;
  return {
    maxSeaCamps: readParam(data, 'ludy_morza_max_obozy',  FALLBACK_SEA_BARB_PARAMS.maxSeaCamps),
    raidRadius:  readParam(data, 'ludy_morza_rajd_zasieg', FALLBACK_SEA_BARB_PARAMS.raidRadius),
    raidPeriod:  Math.max(1, readParam(data, periodKey, periodFallback)),
  };
}

/** Poziom z kreatora (Maciej 2026-07-04). */
export type BarbariansLevel = 'wielu' | 'nieliczni' | 'wylaczeni';

export function barbariansEnabledForLevel(level: BarbariansLevel | undefined): boolean {
  return level !== 'wylaczeni';
}

/** Skala obozów/spawnu dla „Nieliczni”; „Wielu” = parametry z JSON. */
export function scaleBarbParamsForLevel(
  params: BarbParams,
  level: BarbariansLevel | undefined,
): BarbParams {
  if (!level || level === 'wielu') return params;
  if (level === 'wylaczeni') return { ...params, maxCamps: 0 };
  return {
    ...params,
    maxCamps: Math.max(1, Math.ceil(params.maxCamps * 0.45)),
    spawnInterval: Math.ceil(params.spawnInterval * 1.5),
    unitsPerCamp: Math.max(1, params.unitsPerCamp - 1),
  };
}

/** True when barbarians are active on the given turn number. */
export function barbariansActive(
  turn: number,
  params: BarbParams,
  maxPlayerEra: number = 1,
  level: BarbariansLevel | undefined = 'wielu',
): boolean {
  if (!barbariansEnabledForLevel(level)) return false;
  if (maxPlayerEra >= EPOKA_SREDNIOWIECZE_BARBARZY) return false;
  return turn >= params.startTurn;
}

/** Od epoki Średniowiecze (4) barbarzyńcy wyłączeni — buntownicy mapowi (11=C*). */
export const EPOKA_SREDNIOWIECZE_BARBARZY = 4;

/**
 * Ludy Morza (BACKLOG): w epoce Brąz barbarzyńcy spawnują WYŁĄCZNIE jednostki
 * Ludów Morza (pełne zastąpienie domyślnego 'Wojownik') -- oba typy naprzemiennie,
 * bez zależności od poziomu trudności (decyzja właściciela 2026-07-19).
 * Staty jednostek bez zmian; render po nazwie już wspiera oba modele.
 */
export const LUDY_MORZA_BARB_UNIT_IDS: readonly string[] = ['Wojownik Sherden', 'Wojownik szekelesz'];

/**
 * Wybiera deterministycznie jednostkę Ludów Morza dla danego "ziarna"
 * (np. numeru tury) -- naprzemiennie po parzystości. Bez Math.random.
 */
export function pickBronzeBarbUnit(seed: number): string {
  const idx = ((seed % LUDY_MORZA_BARB_UNIT_IDS.length) + LUDY_MORZA_BARB_UNIT_IDS.length) % LUDY_MORZA_BARB_UNIT_IDS.length;
  return LUDY_MORZA_BARB_UNIT_IDS[idx]!;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Reads a numeric ai-param value tolerant of the wartosc/wartość drift. */
function readParam(data: GameData, key: string, fallback: number): number {
  const entry = data.aiParams[key] as unknown as Record<string, unknown> | undefined;
  if (entry === undefined || entry === null) return fallback;
  const v = entry['wartość'] ?? entry['wartosc'];
  return typeof v === 'number' ? v : fallback;
}

/** Numerical Recipes 32-bit LCG: returns [nextState, float in [0,1)]. */
function lcgNext(state: number): [number, number] {
  const next = (state * 1664525 + 1013904223) >>> 0;
  return [next, next / 0x100000000];
}

/** Terrain that barbarians (land units / camps) can never occupy. */
function isImpassableTerrain(t: TerenBazowy): boolean {
  return t === TerenBazowy.Morze || t === TerenBazowy.Wybrzeze || t === TerenBazowy.Gory;
}

/** Pointy-top axial hex neighbours (matches units/setup.ts). */
const HEX_NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [+1, 0], [-1, 0], [0, +1], [0, -1], [+1, -1], [-1, +1],
] as const;

/** A minimal "has q/r" shape for nearest-target search. */
interface HasQR { q: number; r: number; }

/** Nearest item to (q,r) by hex distance, or undefined when the list is empty. */
function nearest<T extends HasQR>(q: number, r: number, items: T[]): T | undefined {
  let best: T | undefined;
  let bestDist = Infinity;
  for (const it of items) {
    const d = hexDistance(q, r, it.q, it.r);
    if (d < bestDist) { bestDist = d; best = it; }
  }
  return best;
}

/** Set of "q,r" keys occupied by units other than `excludeId` (for pathing). */
function occupiedExcluding(units: RuntimeUnit[], excludeId: string): Set<string> {
  const occ = new Set<string>();
  for (const u of units) {
    if (u.id !== excludeId) occ.add(keyOf(u.q, u.r));
  }
  return occ;
}

/** First hex along the least-cost path toward (destQ,destR), or null. */
function firstStep(
  unit: RuntimeUnit,
  map: GameMap,
  destQ: number,
  destR: number,
  occupied: Set<string>,
  costFn?: (hex: Hex) => number,
): { q: number; r: number } | null {
  const path = computePath(unit, map, destQ, destR, occupied, costFn);
  if (path.length === 0) return null;
  return path[0] ?? null;
}

// ---------------------------------------------------------------------------
// Camp spawning
// ---------------------------------------------------------------------------

/**
 * A city-like input for spacing / movement blocking.
 * RUNDA 2 (Evaluator, punkt 3): `id` dodane, żeby decideBarbarianMoves mogło
 * per-jednostkowo zapamiętać "które miasta ta jednostka uznała za oczyszczone"
 * (patrz BarbUnit.clearedCityIds, zbiór od RUNDY 4) -- realny `City` (main.ts)
 * ZAWSZE ma `id: string`, więc to nie zawęża istniejących wywołań produkcyjnych.
 * / EN: `id` added so decideBarbarianMoves can remember, per unit, "which cities
 * THIS unit has deemed cleared" (see BarbUnit.clearedCityIds, a set as of ROUND 4)
 * -- a real `City` (main.ts) ALWAYS has `id: string`, so this doesn't narrow any
 * existing production call site.
 */
export type CityLike = HasQR & { id: string; ownerId?: number };

/**
 * Picks NEW camp sites and returns them (does not include `existing`).
 *
 * A site is valid when it is: a hex that exists in the map, passable land
 * (not sea/coast/mountain), neutral (wlasciciel === null), at least
 * params.minDistFromCity from every city, and at least params.campSpacing
 * from every existing camp and every other newly-picked site.
 *
 * Candidate order is shuffled deterministically from `seed` (LCG Fisher-Yates),
 * so the same inputs always yield the same camps. New camps start with
 * spawnCooldown = 0 (eligible to spawn on the next tickCamps call).
 *
 * Stops once total camp count would reach params.maxCamps.
 *
 * @returns array of new BarbCamp to append to `existing` (possibly empty).
 */
export function spawnCamps(
  map: GameMap,
  existing: BarbCamp[],
  cities: CityLike[],
  params: BarbParams,
  seed: number,
): BarbCamp[] {
  const slotsLeft = params.maxCamps - existing.length;
  if (slotsLeft <= 0) return [];

  // Collect neutral, passable land candidates that clear the city distance.
  const candidates: { q: number; r: number }[] = [];
  for (const key of Object.keys(map.hexes)) {
    const hex = map.hexes[key];
    if (hex === undefined) continue;
    if (hex.wlasciciel !== null) continue;
    if (isImpassableTerrain(hex.terenBazowy)) continue;

    const { q, r } = hex.coords;
    const tooCloseToCity = cities.some(c => hexDistance(q, r, c.q, c.r) < params.minDistFromCity);
    if (tooCloseToCity) continue;

    candidates.push({ q, r });
  }

  // Deterministic Fisher-Yates shuffle seeded by `seed`.
  let lcg = seed >>> 0;
  for (let i = candidates.length - 1; i > 0; i--) {
    let rnd: number;
    [lcg, rnd] = lcgNext(lcg);
    const j = Math.floor(rnd * (i + 1));
    const tmp = candidates[i]!;
    candidates[i] = candidates[j]!;
    candidates[j] = tmp;
  }

  const placed: { q: number; r: number }[] = existing.map(c => ({ q: c.q, r: c.r }));
  const result: BarbCamp[] = [];

  for (const cand of candidates) {
    if (result.length >= slotsLeft) break;
    const tooClose = placed.some(p => hexDistance(cand.q, cand.r, p.q, p.r) < params.campSpacing);
    if (tooClose) continue;
    placed.push(cand);
    result.push({
      id: `bc_${seed >>> 0}_${existing.length + result.length}`,
      q: cand.q,
      r: cand.r,
      spawnCooldown: 0,
    });
  }

  return result;
}

/**
 * TEMAT #15 (część B): obozy Ludów Morza na WYBRZEŻU / wysepkach.
 *
 * Kandydat na obóz nadmorski: heks neutralny, który jest
 *   (a) Wybrzeżem (płytka woda przy lądzie — plażowy obóz najeźdźców), albo
 *   (b) przejezdnym lądem-wysepką: ≥ 4 z 6 sąsiadów to woda (Morze/Wybrzeże).
 * Reszta reguł jak spawnCamps: dystans od miast (minDistFromCity), odstęp
 * campSpacing od WSZYSTKICH istniejących obozów (lądowych i morskich) oraz
 * między sobą; deterministyczny shuffle LCG z `seed`.
 *
 * Limit: seaParams.maxSeaCamps liczony TYLKO po obozach naval (osobno od
 * lądowego params.maxCamps — obozy nadmorskie są „obok istniejących lądowych").
 *
 * @returns nowe obozy z naval=true (możliwie pusta tablica).
 *
 * R-LUDY-MORZA-Q1=A: silnik NIE woła tej funkcji w epoce Brązu (era 2).
 * Zostaje dla testów historycznych / ewentualnej opcji C (inny model obozu).
 */
export function spawnSeaCamps(
  map: GameMap,
  existing: BarbCamp[],
  cities: CityLike[],
  params: BarbParams,
  seaParams: SeaBarbParams,
  seed: number,
): BarbCamp[] {
  const existingSea = existing.filter(c => c.naval === true).length;
  const slotsLeft = seaParams.maxSeaCamps - existingSea;
  if (slotsLeft <= 0) return [];

  const candidates: { q: number; r: number }[] = [];
  for (const key of Object.keys(map.hexes)) {
    const hex = map.hexes[key];
    if (hex === undefined) continue;
    if (hex.wlasciciel !== null) continue;

    const { q, r } = hex.coords;
    let ok = false;
    if (hex.terenBazowy === TerenBazowy.Wybrzeze) {
      ok = true; // (a) obóz plażowy na płytkiej wodzie
    } else if (!isImpassableTerrain(hex.terenBazowy)) {
      // (b) wysepka: większość sąsiadów to woda
      let waterN = 0;
      for (const [dq, dr] of HEX_NEIGHBORS) {
        const nHex = map.hexes[keyOf(q + dq, r + dr)];
        if (nHex !== undefined && isWaterTerrain(nHex.terenBazowy)) waterN++;
      }
      ok = waterN >= 4;
    }
    if (!ok) continue;

    const tooCloseToCity = cities.some(c => hexDistance(q, r, c.q, c.r) < params.minDistFromCity);
    if (tooCloseToCity) continue;

    candidates.push({ q, r });
  }

  // Deterministyczny Fisher-Yates (LCG) — jak w spawnCamps.
  let lcg = seed >>> 0;
  for (let i = candidates.length - 1; i > 0; i--) {
    let rnd: number;
    [lcg, rnd] = lcgNext(lcg);
    const j = Math.floor(rnd * (i + 1));
    const tmp = candidates[i]!;
    candidates[i] = candidates[j]!;
    candidates[j] = tmp;
  }

  const placed: { q: number; r: number }[] = existing.map(c => ({ q: c.q, r: c.r }));
  const result: BarbCamp[] = [];

  for (const cand of candidates) {
    if (result.length >= slotsLeft) break;
    const tooClose = placed.some(p => hexDistance(cand.q, cand.r, p.q, p.r) < params.campSpacing);
    if (tooClose) continue;
    placed.push(cand);
    result.push({
      id: `bsc_${seed >>> 0}_${existingSea + result.length}`,
      q: cand.q,
      r: cand.r,
      spawnCooldown: 0,
      naval: true,
    });
  }

  return result;
}

/** Id „wirtualnego" obozu dla spawnów Ludów Morza bez obozu naval (Q1=A). */
export const SEA_WAVE_CAMP_ID = 'sea_wave';

/**
 * R-LUDY-MORZA-Q1=A: usuwa obozy nadmorskie (naval) z save — Brąz bez obozów na wodzie.
 */
export function purgeNavalCamps(camps: BarbCamp[]): BarbCamp[] {
  return camps.filter(c => c.naval !== true);
}

/** Woda przy lądzie (≥1 sąsiad nie-woda). */
function isWaterAdjacentToLand(map: GameMap, q: number, r: number): boolean {
  for (const [dq, dr] of HEX_NEIGHBORS) {
    const hex = map.hexes[keyOf(q + dq, r + dr)];
    if (hex !== undefined && !isWaterTerrain(hex.terenBazowy)) return true;
  }
  return false;
}

/** Woda w zasięgu rajdu od nadmorskiego miasta. */
function isWaterNearCoastalCity(
  map: GameMap,
  q: number,
  r: number,
  cities: CityLike[],
  raidRadius: number,
): boolean {
  for (const c of cities) {
    if (!isCoastalCity(map, c)) continue;
    if (hexDistance(q, r, c.q, c.r) <= raidRadius) return true;
  }
  return false;
}

/**
 * R-LUDY-MORZA-Q1=A: spawn zaokrętowanych rajderów Ludów Morza na wodzie (bez obozów naval).
 *
 * Caller filtruje erę (Brąz). Zwraca 0 lub 1 spawn na wywołanie:
 *   - limit żywych: seaParams.maxSeaCamps × params.unitsPerCamp (rajderzy seaRaider/embarked);
 *   - częstotliwość: co params.spawnInterval tur (liczone od startTurn);
 *   - heks: woda (Morze/Wybrzeże), minDistFromCity od miast, wolny, przy lądzie LUB w raidRadius
 *     od nadmorskiego miasta; deterministyczny LCG z `seed`.
 */
export function spawnSeaPeoplesRaiders(
  map: GameMap,
  cities: CityLike[],
  barbUnits: BarbUnit[],
  allUnits: RuntimeUnit[],
  params: BarbParams,
  seaParams: SeaBarbParams,
  turn: number,
  seed: number,
): BarbSpawn[] {
  const alive = barbUnits.filter(u => u.seaRaider === true || u.embarked === true).length;
  const maxAlive = seaParams.maxSeaCamps * params.unitsPerCamp;
  if (alive >= maxAlive) return [];

  if (turn < params.startTurn) return [];
  const turnsSinceStart = turn - params.startTurn;
  if (turnsSinceStart <= 0 || turnsSinceStart % params.spawnInterval !== 0) return [];

  const occupied = new Set<string>();
  for (const u of allUnits) occupied.add(keyOf(u.q, u.r));

  const candidates: { q: number; r: number }[] = [];
  for (const key of Object.keys(map.hexes)) {
    const hex = map.hexes[key];
    if (hex === undefined) continue;
    if (hex.wlasciciel !== null) continue;
    if (!isWaterTerrain(hex.terenBazowy)) continue;

    const { q, r } = hex.coords;
    if (occupied.has(key)) continue;

    const tooCloseToCity = cities.some(c => hexDistance(q, r, c.q, c.r) < params.minDistFromCity);
    if (tooCloseToCity) continue;

    const nearCoast = isWaterAdjacentToLand(map, q, r)
      || isWaterNearCoastalCity(map, q, r, cities, seaParams.raidRadius);
    if (!nearCoast) continue;

    candidates.push({ q, r });
  }

  if (candidates.length === 0) return [];

  let lcg = seed >>> 0;
  for (let i = candidates.length - 1; i > 0; i--) {
    let rnd: number;
    [lcg, rnd] = lcgNext(lcg);
    const j = Math.floor(rnd * (i + 1));
    const tmp = candidates[i]!;
    candidates[i] = candidates[j]!;
    candidates[j] = tmp;
  }

  const spot = candidates[0]!;
  return [{
    campId: SEA_WAVE_CAMP_ID,
    q: spot.q,
    r: spot.r,
    typeId: pickBronzeBarbUnit(turn),
    embarked: true,
  }];
}

// ---------------------------------------------------------------------------
// Camp ticking / unit spawning
// ---------------------------------------------------------------------------

/** Result of advancing all camps one turn. */
export interface TickResult {
  /** Updated camps (new objects; input is not mutated). */
  camps: BarbCamp[];
  /** Units to create this turn (engine instantiates them). */
  spawns: BarbSpawn[];
}

/**
 * Advances every camp one turn:
 *   - decrements spawnCooldown (floored at 0);
 *   - when a camp's cooldown is 0 AND it controls fewer than
 *     params.unitsPerCamp living barbarian units within campControlRadius,
 *     emits one BarbSpawn on a free passable land hex next to the camp and
 *     resets the cooldown to params.spawnInterval;
 *   - if the cooldown is 0 but the cap is reached or no free adjacent hex
 *     exists, the cooldown stays at 0 (the camp retries next turn).
 *
 * Pure: returns new camp objects and a spawn list; never mutates inputs.
 *
 * @param camps      Current camps.
 * @param barbUnits  All living barbarian units (for the per-camp cap).
 * @param allUnits   All units on the map (to avoid spawning onto an occupied hex).
 * @param map        Game map (terrain / hex existence).
 * @param params     Tunable coefficients.
 */
export function tickCamps(
  camps: BarbCamp[],
  barbUnits: BarbUnit[],
  allUnits: RuntimeUnit[],
  map: GameMap,
  params: BarbParams,
): TickResult {
  const occupied = new Set<string>();
  for (const u of allUnits) occupied.add(keyOf(u.q, u.r));

  const outCamps: BarbCamp[] = [];
  const spawns: BarbSpawn[] = [];

  for (const camp of camps) {
    const cd = Math.max(0, camp.spawnCooldown - 1);

    if (cd > 0) {
      outCamps.push({ ...camp, spawnCooldown: cd });
      continue;
    }

    // Cooldown ready: check the per-camp cap.
    const owned = barbUnits.filter(
      u => hexDistance(u.q, u.r, camp.q, camp.r) <= params.campControlRadius,
    ).length;

    if (owned >= params.unitsPerCamp) {
      // At cap -- hold at 0 so it spawns as soon as a slot frees up.
      outCamps.push({ ...camp, spawnCooldown: 0 });
      continue;
    }

    // TEMAT #15: obóz nadmorski spawnuje na sąsiedniej WODZIE (jednostka
    // zaokrętowana). Gdy brak wolnej wody — fallback na ląd (niezaokrętowana).
    let spot: { q: number; r: number } | null = null;
    let embarked = false;
    if (camp.naval === true) {
      spot = freeAdjacentWaterHex(camp.q, camp.r, map, occupied);
      if (spot !== null) embarked = true;
    }
    if (spot === null) spot = freeAdjacentHex(camp.q, camp.r, map, occupied);
    if (spot === null) {
      outCamps.push({ ...camp, spawnCooldown: 0 });
      continue;
    }

    // Spawn one unit and reserve its hex so two camps cannot share it.
    occupied.add(keyOf(spot.q, spot.r));
    spawns.push({
      campId: camp.id,
      q: spot.q,
      r: spot.r,
      typeId: params.unitTypeId,
      ...(embarked ? { embarked: true } : {}),
    });
    outCamps.push({ ...camp, spawnCooldown: params.spawnInterval });
  }

  return { camps: outCamps, spawns };
}

/** Nearest free passable land hex adjacent to (q,r): ring-1 then ring-2, or null. */
function freeAdjacentHex(
  q: number,
  r: number,
  map: GameMap,
  occupied: Set<string>,
): { q: number; r: number } | null {
  // Ring 1.
  for (const [dq, dr] of HEX_NEIGHBORS) {
    const nq = q + dq;
    const nr = r + dr;
    if (isFreeLand(nq, nr, map, occupied)) return { q: nq, r: nr };
  }
  // Ring 2 (deduped), nearest-first by distance to the camp.
  const seen = new Set<string>();
  const ring2: { q: number; r: number }[] = [];
  for (const [dq, dr] of HEX_NEIGHBORS) {
    const mq = q + dq;
    const mr = r + dr;
    for (const [dq2, dr2] of HEX_NEIGHBORS) {
      const nq = mq + dq2;
      const nr = mr + dr2;
      const k = keyOf(nq, nr);
      if (seen.has(k)) continue;
      seen.add(k);
      if (nq === q && nr === r) continue;
      if (isFreeLand(nq, nr, map, occupied)) ring2.push({ q: nq, r: nr });
    }
  }
  ring2.sort((a, b) => hexDistance(a.q, a.r, q, r) - hexDistance(b.q, b.r, q, r));
  return ring2[0] ?? null;
}

/** TEMAT #15: najbliższy wolny heks WODY przy (q,r): ring-1, potem ring-2, lub null. */
function freeAdjacentWaterHex(
  q: number,
  r: number,
  map: GameMap,
  occupied: Set<string>,
): { q: number; r: number } | null {
  const isFreeWater = (nq: number, nr: number): boolean => {
    const k = keyOf(nq, nr);
    const hex = map.hexes[k];
    if (hex === undefined || occupied.has(k)) return false;
    return isWaterTerrain(hex.terenBazowy);
  };
  for (const [dq, dr] of HEX_NEIGHBORS) {
    if (isFreeWater(q + dq, r + dr)) return { q: q + dq, r: r + dr };
  }
  const seen = new Set<string>();
  const ring2: { q: number; r: number }[] = [];
  for (const [dq, dr] of HEX_NEIGHBORS) {
    for (const [dq2, dr2] of HEX_NEIGHBORS) {
      const nq = q + dq + dq2;
      const nr = r + dr + dr2;
      const k = keyOf(nq, nr);
      if (seen.has(k)) continue;
      seen.add(k);
      if (nq === q && nr === r) continue;
      if (isFreeWater(nq, nr)) ring2.push({ q: nq, r: nr });
    }
  }
  ring2.sort((a, b) => hexDistance(a.q, a.r, q, r) - hexDistance(b.q, b.r, q, r));
  return ring2[0] ?? null;
}

/** True when (q,r) exists, is passable land, and is not occupied. */
function isFreeLand(q: number, r: number, map: GameMap, occupied: Set<string>): boolean {
  const k = keyOf(q, r);
  const hex = map.hexes[k];
  if (hex === undefined) return false;
  if (occupied.has(k)) return false;
  return !isImpassableTerrain(hex.terenBazowy);
}

/**
 * Liczba żyjących jednostek barbarzyńskich w zasięgu kontroli obozu
 * (ten sam promień co tickCamps — campControlRadius).
 */
function countCampGarrison(
  camp: BarbCamp,
  barbUnits: BarbUnit[],
  campControlRadius: number,
): number {
  return barbUnits.filter(
    u => hexDistance(u.q, u.r, camp.q, camp.r) <= campControlRadius,
  ).length;
}

/**
 * Obóz „gotowy do rajdu": ma pełny kontyngent bojowników.
 * „Dwie jednostki" (Maciej 2026-08-02) = unitsPerCamp (domyślnie 2) żywych
 * wojowników w promieniu campControlRadius — nie osadnicy, nie rajderzy morscy
 * (ci mają decideSeaPeoplesRaids).
 */
export function isCampRaidReady(
  camp: BarbCamp,
  barbUnits: BarbUnit[],
  params: BarbParams,
): boolean {
  const landUnits = barbUnits.filter(
    u => u.seaRaider !== true && u.embarked !== true,
  );
  return countCampGarrison(camp, landUnits, params.campControlRadius) >= params.unitsPerCamp;
}

/** Obóz macierzysty jednostki: campId albo najbliższy obóz w zasięgu kontroli. */
function homeCampForUnit(
  unit: BarbUnit,
  camps: BarbCamp[],
  campControlRadius: number,
): BarbCamp | undefined {
  if (unit.campId) {
    const byId = camps.find(c => c.id === unit.campId);
    if (byId !== undefined) return byId;
  }
  let best: BarbCamp | undefined;
  let bestDist = Infinity;
  for (const c of camps) {
    const d = hexDistance(unit.q, unit.r, c.q, c.r);
    if (d <= campControlRadius && d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

/**
 * P-BARBARZYNCY-USUWANIE-SEMANTYKA-Q1 (odpowiedź właściciela, 2026-08-12): obóz
 * jest niszczony przez WEJŚCIE (najechanie) jednostki -- gracza LUB AI -- na
 * jego heks. To ZASTĘPUJE poprzednią mechanikę (`pruneEmptyCampsAfterCombat`,
 * wyzwalacz = zliczanie garnizonu w promieniu po walce) -- Evaluator znalazł w
 * niej realną regresję (asymetria identyfikacji vs decyzji), a właściciel
 * ustalił wprost, że to była w ogóle zła mechanika, nie do poprawki parametru.
 * Analogia: wioski neutralne w main.ts (`checkVillageRewardAt`) -- pierwsze
 * wejście na heks = trwały efekt na heksie. Różnica: bez nagrody, i dotyczy
 * KAŻDEJ cywilizacji (nie tylko gracza) -- wołający (main.ts) musi sam
 * wykluczyć jednostki barbarzyńskie, ta funkcja tego nie robi (przyjmuje samo
 * (q, r), bez informacji o właścicielu wchodzącej jednostki).
 *
 * Zniszczenie obozu NIE dotyka jednostek barbarzyńskich już zaspawnowanych na
 * mapie (`units`) -- te walczą dalej normalnie, niezależnie od losu obozu po
 * zaspawnowaniu. Jedyny efekt: obóz znika z `camps`, więc tickCamps()
 * przestaje z niego spawnować NOWE jednostki.
 *
 * Czysta funkcja: nie mutuje `camps`, zwraca nową listę.
 * / EN: a camp is destroyed by a unit -- player OR AI -- ENTERING its hex.
 * This REPLACES the previous mechanic (`pruneEmptyCampsAfterCombat`, trigger =
 * garrison count within a radius after combat) -- the Evaluator found a real
 * regression in it (identification vs. decision asymmetry), and the owner
 * determined outright that it was simply the wrong mechanic, not a parameter
 * to tune. Mirrors neutral villages in main.ts (`checkVillageRewardAt`): first
 * entry onto the hex = a permanent effect. Difference: no reward, and it
 * applies to every civilization (not just the player) -- the caller (main.ts)
 * must exclude barbarian-owned movers itself; this function takes only (q, r)
 * and has no notion of who is entering.
 *
 * Destroying a camp never touches barbarian units already spawned on the map
 * (`units`) -- they keep fighting normally, independent of their home camp's
 * fate after spawning. The only effect: the camp disappears from `camps`, so
 * tickCamps() stops spawning NEW units from it. Pure: does not mutate `camps`.
 *
 * @param camps  Obozy PRZED usunięciem.
 * @param q, r   Heks, na który właśnie weszła (dokończyła ruch) jednostka.
 * @returns nowa lista obozów (bez zniszczonego, jeśli jakiś tam był) + id zniszczonego obozu (albo null).
 */
export function destroyCampAt(
  camps: BarbCamp[],
  q: number,
  r: number,
): { camps: BarbCamp[]; destroyedCampId: string | null } {
  const idx = camps.findIndex(c => c.q === q && c.r === r);
  if (idx === -1) return { camps: camps.slice(), destroyedCampId: null };
  const destroyedCampId = camps[idx]!.id;
  const kept = camps.slice(0, idx).concat(camps.slice(idx + 1));
  return { camps: kept, destroyedCampId };
}

// ---------------------------------------------------------------------------
// Aggression / movement
// ---------------------------------------------------------------------------

/**
 * Decides one command per barbarian unit for the movement phase.
 *
 * Per unit, in priority order:
 *   1. Low HP (healthFrac < params.retreatHpFrac): step toward the nearest
 *      camp (§2.3 retreat to regenerate). If already adjacent, no command.
 *   2. Adjacent enemy (player/AI) unit: attack it.
 *   3. A target (enemy unit or city) within params.aggroRadius — OR, when the
 *      unit's home camp is raid-ready (>= unitsPerCamp living land warriors in
 *      campControlRadius), ANY distance to the nearest civilization target:
 *      step toward the nearest enemy unit or city.
 *   4. Otherwise idle: if more than 1 hex from the home camp, step back toward
 *      it; if no camps exist, no command.
 *
 * Units with ruchLeft <= 0 are skipped. Enemy targets are any non-barbarian
 * unit; barbarians never target each other. Pure -- returns commands only.
 *
 * @param barbUnits   Barbarian units to move.
 * @param playerUnits All non-barbarian units (targets). Barbarians are filtered out.
 * @param cities      All cities (targets / raid objectives).
 * @param camps       Barbarian camps (retreat / idle anchors).
 * @param map         Game map for pathing.
 * @param params      Tunable coefficients.
 * @param canEngageOwner
 *   C-BARB-Q1/Q2 (Maciej 2026-07-26): war-state gate for the ATTACK decision --
 *   same bramka as ai.ts's aiCanEngageOwner (main.ts wires it to
 *   getDiploRelation(BARBARIAN_OWNER_ID, targetOwnerId).status === 'wojna').
 *   Barbarians are always at war with every non-barbarian owner (see main.ts
 *   getDiploRelation), so this is a rule, not a hard-coded exception -- omitted
 *   (tests, legacy callers) it defaults to "always engageable", identical to
 *   the previous unconditional behaviour.
 * @param difficulty
 *   P-BARBARZYNCY-MIASTA-ZACHOWANIE-Q1=A (Maciej 2026-08-12): ECHO -- trzy
 *   poziomy trudności = ISTNIEJĄCY suwak gry (_menuDifficulty), NIE nowe
 *   ustawienie. `undefined` (wszyscy istniejący wołający/testy) = LEGACY
 *   zachowanie, bit-identyczne z easy -- żadna nowa gałąź kodu się nie
 *   uruchamia (gwarancja "easy bez zmian"). 'normal'/'hard': miasto BEZ
 *   żadnej jednostki broniącej na jego heksie (sprawdzone przez `playerUnits`)
 *   przestaje być celem "chase" (krok 3) -- po oczyszczeniu miasta z obrońców
 *   jednostka celuje w NASTĘPNE najbliższe miasto/jednostkę, zamiast tkwić
 *   przy tym samym (właściciel: "na średnim poziomie jeżeli jedno miasto
 *   udaje mi się zniszczyć jednostki idą do kolejnego miasta"). Dla 'hard' to
 *   dodatkowo za darmo wyklucza WŁASNE (już przejęte) miasto barbarzyńców --
 *   `civCities` już filtruje `isBarbarian(c.ownerId)` niezależnie od tego pola.
 *   / EN: three difficulty levels = the EXISTING game slider (_menuDifficulty),
 *   not a new setting. `undefined` (all pre-existing callers/tests) = LEGACY
 *   behaviour, bit-identical to easy -- no new code path runs (guarantees
 *   "easy unchanged"). 'normal'/'hard': a city with NO defending unit on its
 *   hex (checked via `playerUnits`) stops being a chase target (step 3) -- once
 *   cleared of defenders the unit heads for the next-nearest city/unit instead
 *   of camping the same one.
 *
 *   RUNDA 2 (Evaluator jednomyślny FAIL na rundzie 1, punkty 2+3) -- pierwsza wersja
 *   filtra wykluczała WSZYSTKIE niebronione miasta GLOBALNIE (dla każdej jednostki,
 *   niezależnie od tego, kto/czy w ogóle je "oczyścił"), co miało dwa realne skutki:
 *   (a) gdy WSZYSTKIE miasta w zasięgu były niebronione, lista celów stawała się
 *   pusta -- jednostka raid-ready (chaseRadius=Infinity, pomija krok 4 "drift do domu")
 *   zamierała na stałe, bez ŻADNEGO rozkazu; (b) jednostka po oczyszczeniu miasta A
 *   szła do OBOZU zamiast do miasta B, bo B (i każde inne niebronione miasto) też było
 *   globalnie wykluczone, plus oscylacja gdy gracz przesuwał JEDEN garnizon między
 *   dwoma miastami (dowolne z nich na przemian wykluczane w zależności od tego, gdzie
 *   akurat stoi). Naprawa: wykluczenie jest teraz PER JEDNOSTKA (`unit.
 *   recentlyClearedCityId`, patrz BarbUnit), nie globalne -- i ma jawny fallback: gdy
 *   przefiltrowana lista wyszłaby pusta, filtr się NIE stosuje (pełna lista miast jako
 *   cel), więc jednostka nigdy nie zamiera z braku jakiegokolwiek celu.
 *   / EN: ROUND 2 (unanimous Evaluator FAIL on round 1, points 2+3) -- the first
 *   version of the filter excluded EVERY undefended city GLOBALLY (for every unit,
 *   regardless of who -- if anyone -- actually cleared it), which had two real
 *   consequences: (a) when EVERY city in range was undefended, the target list went
 *   empty -- a raid-ready unit (chaseRadius=Infinity, skips step 4 "drift home") froze
 *   permanently with NO command at all; (b) a unit that had just cleared city A headed
 *   for CAMP instead of city B, because B (and every other undefended city) was also
 *   globally excluded, plus oscillation when the player shuffled ONE garrison between
 *   two cities (whichever one currently lacks it gets excluded, alternating). Fix: the
 *   exclusion is now PER UNIT (`unit.recentlyClearedCityId`, see BarbUnit), not global
 *   -- with an explicit fallback: when the filtered list would be empty, the filter is
 *   skipped entirely (full city list as candidates), so a unit never freezes for lack
 *   of any target.
 *
 *   RUNDA 3 (Evaluator A/B/C jednomyślnie, livelock) -- zapamiętanie zaczęło czekać
 *   na faktyczne DOTARCIE (hexDistance<=1), nie na sam wybór celu w danej turze. To
 *   WYDŁUŻYŁO okres oscylacji A<->B, ale jej NIE usunęło -- pojedynczy slot wciąż
 *   mógł zapamiętać tylko JEDNO miasto naraz, więc zapis B kasował A, A wracało do
 *   puli, trzecie miasto NIGDY nie było odwiedzane (3x jednomyślny FAIL).
 *   / EN: ROUND 3 (Evaluator A/B/C unanimous, livelock) -- the memory write started
 *   waiting for the unit to actually REACH (hexDistance<=1) the target, not merely
 *   pick it as this turn's target. This LENGTHENED the A<->B oscillation period but
 *   did NOT remove it -- a single slot could still remember only ONE city at a
 *   time, so writing B erased A, A came back into the pool, a third city was NEVER
 *   visited (3x unanimous FAIL).
 *
 *   RUNDA 4 -- pojedynczy slot (`recentlyClearedCityId`) zastąpiony ZBIOREM
 *   (`unit.clearedCityIds`, patrz BarbUnit) zdolnym pamiętać WIELE odwiedzonych
 *   miast naraz. Fallback z rundy 2 NIEZMIENIONY (`civCities = filtered.length > 0
 *   ? filtered : civCitiesBase`) -- gdy zbiór wyklucza WSZYSTKIE dostępne
 *   (niebronione) miasta, jednostka odwiedziła każde z nich; zbiór jest wtedy
 *   RESETOWANY, żeby patrol zaczął kolejne okrążenie zamiast zamarznąć na trwale
 *   pełnym zbiorze (patrz komentarz przy resetowaniu niżej). WYNIK: ograniczony,
 *   ale realny postęp -- jednostka odwiedza WSZYSTKIE niebronione miasta po kolei,
 *   cyklicznie, zamiast utknąć w wahadle 2 miast. To NIE jest pełne zakończenie
 *   tematu: main.ts:26273 pokazuje, że przejęcie miasta przez barbarzyńcę idzie
 *   WYŁĄCZNIE przez komendę `attack` na przyległego wroga -- miasto bez obrońcy nie
 *   ma czego atakować, więc dla tej jednostki nie istnieje stan terminalny (ABC
 *   "puste miasto trwale odporne na przejęcie", nierozstrzygnięte, poza zakresem tej
 *   rundy -- patrz PYTANIA-OTWARTE.md, runda 3 tego tematu).
 *   / EN: ROUND 4 -- the single slot (`recentlyClearedCityId`) is replaced by a SET
 *   (`unit.clearedCityIds`, see BarbUnit) able to remember MULTIPLE visited cities
 *   at once. The round-2 fallback is UNCHANGED (`civCities = filtered.length > 0 ?
 *   filtered : civCitiesBase`) -- when the set excludes EVERY available
 *   (undefended) city, the unit has visited each one; the set is then RESET so the
 *   patrol starts another lap instead of freezing on a permanently-full set (see
 *   the reset comment below). RESULT: limited but real progress -- the unit visits
 *   EVERY undefended city in turn, cyclically, instead of getting stuck in a
 *   2-city pendulum. This is NOT a full close-out of the topic: main.ts:26273 shows
 *   that a barbarian capturing a city only ever happens via an `attack` command on
 *   an adjacent enemy -- an undefended city has nothing to attack, so there is no
 *   terminal state for this unit (open ABC "undefended city permanently immune to
 *   capture", out of scope for this round -- see PYTANIA-OTWARTE.md, round 3 of
 *   this topic).
 */
export function decideBarbarianMoves(
  barbUnits: BarbUnit[],
  playerUnits: RuntimeUnit[],
  cities: CityLike[],
  camps: BarbCamp[],
  map: GameMap,
  params: BarbParams,
  canEngageOwner?: (targetOwnerId: number) => boolean,
  difficulty?: SeaRaidDifficulty,
): BarbCommand[] {
  const commands: BarbCommand[] = [];
  const engageOk = canEngageOwner ?? ((_targetOwnerId: number) => true);
  const skipDefenselessCities = difficulty === 'normal' || difficulty === 'hard';

  // Only real players are valid targets.
  const enemies = playerUnits.filter(u => !isBarbarian(u.ownerId));

  // All units occupy hexes for pathing (barbs + players).
  const allUnits: RuntimeUnit[] = [...barbUnits, ...enemies];

  for (const unit of barbUnits) {
    if (unit.ruchLeft <= 0) continue;
    // TEMAT #15: jednostki Ludów Morza (rajderzy / zaokrętowane) prowadzi
    // decideSeaPeoplesRaids — logika lądowa ich nie rusza.
    if (unit.embarked === true || unit.seaRaider === true) continue;

    const occ = addForeignCityBlocks(
      occupiedExcluding(allUnits, unit.id),
      unit.ownerId,
      cities as Pick<City, 'q' | 'r' | 'ownerId'>[],
    );

    // 1. Retreat when wounded.
    if (unit.healthFrac !== undefined && unit.healthFrac < params.retreatHpFrac) {
      const camp = nearest(unit.q, unit.r, camps);
      if (camp !== undefined && hexDistance(unit.q, unit.r, camp.q, camp.r) > 1) {
        const step = firstStep(unit, map, camp.q, camp.r, occ);
        if (step !== null) {
          commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
        }
      }
      continue;
    }

    // 2. Attack an adjacent enemy unit -- gated by the same war-state rule as
    // the rest of the engine (canEngageOwner), not a hard-coded !isBarbarian
    // bypass (C-BARB-Q1/Q2). Barbarians are always at war with everyone, so in
    // practice this changes nothing observable -- it routes through the rule
    // instead of around it.
    const adjacentEnemy = enemies.find(
      e => hexDistance(unit.q, unit.r, e.q, e.r) === 1 && engageOk(e.ownerId),
    );
    if (adjacentEnemy !== undefined) {
      commands.push({ type: 'attack', unitId: unit.id, targetUnitId: adjacentEnemy.id });
      continue;
    }

    // 3. Chase the nearest civilization target (unit or city).
    const nearestEnemyUnit = nearest(unit.q, unit.r, enemies);
    // Bazowa lista: własne (barbarzyńskie) miasta zawsze poza celami -- niezależnie
    // od trudności/pamięci niżej. / EN: base list: own (barbarian) cities are always
    // out of scope -- independent of difficulty/memory below.
    const civCitiesBase = cities.filter(c => !(c.ownerId !== undefined && isBarbarian(c.ownerId)));
    let civCities = civCitiesBase;
    if (skipDefenselessCities) {
      // RUNDA 4: wykluczenie PER JEDNOSTKA przez ZBIÓR (nie pojedynczy slot) --
      // miasto bez obrońcy wypada z celów gdy jego id jest w `unit.clearedCityIds`
      // (dowolne z wielu odwiedzonych, nie tylko "ostatnie"); inne niebronione
      // miasta (nigdy nieodwiedzone przez TĘ jednostkę, albo odzyskały obrońcę)
      // zostają poprawnymi celami. Patrz komentarz `difficulty` przy sygnaturze.
      // / EN: ROUND 4: PER-UNIT exclusion via a SET (not a single slot) -- a
      // defenceless city drops out of targets once its id is in
      // `unit.clearedCityIds` (any of potentially many visited, not just "the last
      // one"); other undefended cities (never visited by THIS unit, or now
      // defended again) stay valid targets. See the `difficulty` comment on the
      // signature.
      const clearedSet = unit.clearedCityIds ?? [];
      const filtered = civCitiesBase.filter(c => {
        const undefended = !enemies.some(e => e.q === c.q && e.r === c.r);
        if (!undefended) return true;
        return !clearedSet.includes(c.id);
      });
      // F1 (Evaluator A, runda 5): warunek resetu musi patrzeć WYŁĄCZNIE na miasta
      // NIEBRONIONE -- stary warunek `filtered.length === 0` był osiągalny tylko
      // gdy na planszy NIE ISTNIEJE żadne miasto bronione (bronione miasto
      // przechodzi filtr `filtered` bezwarunkowo, patrz `if (!undefended) return
      // true;` wyżej), mimo że dokumentacja "RUNDA 4" przy sygnaturze funkcji mówi
      // wprost: reset gdy zbiór wyklucza WSZYSTKIE DOSTĘPNE (niebronione) miasta.
      // Na realnej planszy z garnizonami (prawie zawsze istnieje choć jedno
      // bronione miasto) stary warunek nigdy się nie odpalał. Poprawka liczy
      // zbiór miast niebronionych osobno i resetuje, gdy WSZYSTKIE z nich są w
      // `clearedSet` -- niezależnie od tego, czy jeszcze istnieje jakieś bronione.
      // Guard `undefendedCities.length > 0` chroni przed reset-em w kółko (co
      // turę) na planszy bez ŻADNEGO niebronionego miasta -- `every()` na pustej
      // tablicy jest z definicji `true`, co bez guarda resetowałoby zbiór, który i
      // tak nie ma nic realnego do zresetowania.
      // / EN: F1 (Evaluator A, round 5): the reset condition must look ONLY at
      // UNDEFENDED cities -- the old `filtered.length === 0` condition was only
      // reachable when NO defended city existed on the board at all (a defended
      // city always passes the `filtered` filter unconditionally, see `if
      // (!undefended) return true;` above), even though the "ROUND 4" doc-comment
      // on the function signature literally says: reset once the set excludes
      // EVERY AVAILABLE (undefended) city. On a real board with garrisons (almost
      // always at least one defended city) the old condition never fired. The fix
      // counts undefended cities separately and resets once ALL of them are in
      // `clearedSet`, regardless of whether a defended city still exists. The
      // `undefendedCities.length > 0` guard prevents resetting every single turn
      // on a board with NO undefended city at all -- `every()` on an empty array
      // is vacuously `true`, which without the guard would keep resetting a set
      // that has nothing real to reset.
      const undefendedCities = civCitiesBase.filter(c => !enemies.some(e => e.q === c.q && e.r === c.r));
      if (undefendedCities.length > 0 && undefendedCities.every(c => clearedSet.includes(c.id))) {
        // RUNDA 4: zbiór wykluczyłby WSZYSTKIE dostępne (niebronione) miasta -- ta
        // jednostka odwiedziła już każde z nich. Reset zbioru = patrol zaczyna
        // KOLEJNE OKRĄŻENIE (A -> B -> C -> A -> ...), zamiast trwale zamarznąć na
        // pełnym zbiorze (co dawałoby: fallback niżej ZAWSZE aktywny, cel = zawsze
        // dosłownie najbliższe miasto, czyli w praktyce jednostka na stałe "obozuje"
        // przy ostatnio odwiedzonym, nigdy nie wracając do pozostałych). To jest
        // ŚWIADOMY, OGRANICZONY wynik tej rundy (odwiedza wszystkie miasta po
        // kolei, cyklicznie), NIE pełne zakończenie tematu -- patrz doc-comment
        // "RUNDA 4" przy sygnaturze funkcji (ABC "puste miasto trwale odporne na
        // przejęcie" pozostaje otwarte, poza zakresem).
        // / EN: the set would exclude EVERY available (undefended) city -- this
        // unit has already visited each one. Resetting the set = the patrol starts
        // ANOTHER LAP (A -> B -> C -> A -> ...) instead of freezing permanently on
        // a full set (which would mean: the fallback below is ALWAYS active,
        // target = always literally the nearest city, i.e. in practice the unit
        // permanently "camps" next to the last one visited, never returning to the
        // others). This is a DELIBERATE, LIMITED outcome of this round (visits
        // every city in turn, cyclically), NOT a full close-out of the topic --
        // see the "ROUND 4" doc-comment on the function signature (the open ABC
        // "undefended city permanently immune to capture" stays open, out of
        // scope).
        unit.clearedCityIds = [];
      }
      // Fallback niezmieniony od rundy 2 (potwierdzony przez 3 rundy Evaluatorów):
      // gdy przefiltrowana lista wyszłaby pusta, filtr się NIE stosuje (pełna lista
      // jako fallback), żeby jednostka raid-ready nigdy nie zamarła bez celu.
      // / EN: fallback unchanged since round 2 (confirmed across 3 rounds of
      // Evaluators): when the filtered list would come out empty, the filter is
      // NOT applied (full list as fallback), so a raid-ready unit never freezes
      // with no target at all.
      civCities = filtered.length > 0 ? filtered : civCitiesBase;
    }
    const nearestCity = nearest(unit.q, unit.r, civCities);
    // RUNDA 3 (Evaluator A/B/C jednomyślnie, livelock): zapamiętanie musi czekać na
    // faktyczne DOTARCIE (hexDistance<=1) do miasta -- nie na sam fakt bycia
    // wybranym jako cel w tej turze. Stary zapis (bezwarunkowy, co turę, na
    // podstawie samego "to jest teraz najbliższy cel") tworzył stabilny 2-cykl:
    // wykluczenie A odsłaniało B (memory=A), następna decyzja wykluczała B
    // odsłaniając A z powrotem (memory=B) -- jednostka drgała między A i B w
    // nieskończoność, z zerowym postępem netto, nawet na statycznej planszy bez
    // ruchu gracza (zgłoszone przez wszystkich 3 Evaluatorów niezależnie).
    // Teraz: dopóki jednostka nie jest przyległa do celu, pamięć zostaje
    // NIETKNIĘTA -- ten sam cel pozostaje wybierany co turę (monotoniczny postęp),
    // wykluczenie następuje dopiero po realnym dotarciu.
    // / EN: ROUND 3 (Evaluator A/B/C unanimous, livelock): the memory write must
    // wait for the unit to actually REACH (hexDistance<=1) the city -- not merely
    // being picked as this turn's target. The old write (unconditional, every
    // turn, based purely on "this is currently the nearest target") formed a
    // stable 2-cycle: excluding A exposed B (memory=A), the next decision
    // excluded B exposing A again (memory=B) -- the unit oscillated between A and
    // B forever with zero net progress, even on a static board with no player
    // movement (independently reported by all 3 Evaluators). Now: as long as the
    // unit is not adjacent to the target, memory is left UNTOUCHED -- the same
    // target keeps being picked turn after turn (monotonic progress), exclusion
    // only happens after actually arriving.
    if (skipDefenselessCities && nearestCity !== undefined
        && hexDistance(unit.q, unit.r, nearestCity.q, nearestCity.r) <= 1
        && !enemies.some(e => e.q === nearestCity.q && e.r === nearestCity.r)) {
      // RUNDA 4: dopisz do ZBIORU zamiast nadpisać pojedynczy slot -- poprzednio
      // odwiedzone miasta (np. A po dotarciu do B) NIE są kasowane. `unit.
      // clearedCityIds` mogło zostać właśnie zresetowane wyżej (pełne okrążenie) --
      // stąd `?? []`, nie zakładaj że tablica już istnieje.
      // / EN: append to the SET instead of overwriting a single slot -- previously
      // visited cities (e.g. A, after reaching B) are NOT erased. `unit.
      // clearedCityIds` may have just been reset above (a full lap completed) --
      // hence `?? []`, don't assume the array already exists.
      if (unit.clearedCityIds === undefined) unit.clearedCityIds = [];
      if (!unit.clearedCityIds.includes(nearestCity.id)) {
        unit.clearedCityIds.push(nearestCity.id);
      }
    }
    // F2 (Evaluator A, runda 5): WSZYSTKIE miasta z `civCities` jako kandydaci
    // celu, nie tylko `nearestCity` -- jeśli najbliższy kandydat okaże się
    // nieosiągalny (patrz pętla reachability niżej), próbujemy kolejnego z tej
    // samej, posortowanej listy zamiast zamierać bez komendy.
    // / EN: F2 (Evaluator A, round 5): ALL cities from `civCities` as target
    // candidates, not just `nearestCity` -- if the nearest candidate turns out
    // unreachable (see the reachability loop below), we try the next one from
    // this same sorted list instead of freezing with no command.
    const targets: { q: number; r: number; d: number }[] = [];
    if (nearestEnemyUnit !== undefined) {
      targets.push({ q: nearestEnemyUnit.q, r: nearestEnemyUnit.r, d: hexDistance(unit.q, unit.r, nearestEnemyUnit.q, nearestEnemyUnit.r) });
    }
    for (const c of civCities) {
      targets.push({ q: c.q, r: c.r, d: hexDistance(unit.q, unit.r, c.q, c.r) });
    }
    targets.sort((a, b) => a.d - b.d);
    const homeCamp = homeCampForUnit(unit, camps, params.campControlRadius);
    // P-BARBARZYNCY-OSIEROCONE-Q1: `homeCamp === undefined` ma DWIE różne
    // przyczyny, które trzeba rozróżnić -- mylenie ich zepsuło test istniejący
    // PRZED tą rundą (barbarians-test.cjs 6d "drifts toward camp when idle
    // and away"):
    //   (A) jednostka MA campId, ale obóz o tym id już nie istnieje w `camps`
    //       -- to jest scenariusz specyfikacji: "obóz zniszczony, stare
    //       jednostki nadal atakują". campId nadany przy spawnie jest trwały
    //       (destroyCampAt strukturalnie nie dotyka `units`, patrz sekcja 3
    //       barb-camp-destruction-test.cjs), więc campId wskazujący na obóz
    //       nieobecny w `camps` jednoznacznie oznacza "mój obóz zniszczono".
    //   (B) jednostka NIE MA campId (albo pusty) i po prostu jest poza
    //       campControlRadius od JAKIEGOKOLWIEK żywego obozu -- to zwykłe
    //       "daleko od domu", istniejące zachowanie (drift do najbliższego
    //       obozu w kroku 4), NIEZWIĄZANE ze zniszczeniem obozu -- musi
    //       zostać nietknięte.
    // Tylko (A) dostaje nieograniczony chaseRadius i pomija krok 4 (nie ma
    // dokąd wracać). (B) zachowuje dokładnie stare zachowanie.
    // / EN: `homeCamp === undefined` has TWO distinct causes that must be
    // told apart -- conflating them broke a PRE-EXISTING test (barbarians-
    // test.cjs 6d "drifts toward camp when idle and away"):
    //   (A) the unit HAS a campId, but no camp with that id exists in
    //       `camps` anymore -- this is the spec scenario: "camp destroyed,
    //       old units keep attacking". campId assigned at spawn is
    //       permanent (destroyCampAt structurally never touches `units`,
    //       see barb-camp-destruction-test.cjs section 3), so a campId
    //       pointing at a camp absent from `camps` unambiguously means "my
    //       camp was destroyed".
    //   (B) the unit has NO campId (or empty) and is simply outside
    //       campControlRadius of any living camp -- ordinary "far from
    //       home", pre-existing behaviour (drift to nearest camp in step 4),
    //       UNRELATED to camp destruction -- must stay untouched.
    // Only (A) gets unlimited chaseRadius and skips step 4 (nowhere to
    // return to). (B) keeps the exact old behaviour.
    const orphaned = Boolean(unit.campId) && !camps.some(c => c.id === unit.campId);
    const raidReady = orphaned || (homeCamp !== undefined && isCampRaidReady(homeCamp, barbUnits, params));
    const chaseRadius = raidReady ? Infinity : params.aggroRadius;
    // F2 (Evaluator A, runda 5): PRZED poprawką próbowano wyłącznie `targets[0]`
    // (globalnie najbliższego kandydata); gdy `firstStep` dla niego zwracał
    // `null` (cel nieosiągalny, np. bronione miasto za wodą) a `raidReady` było
    // `true` (chaseRadius = Infinity), jednostka nie wydawała ŻADNEJ komendy do
    // końca gry -- krok 4 (dryf do obozu) jest świadomie pomijany przy raidReady
    // (`if (raidReady) continue;` niżej), więc nie było żadnego fallbacku. Dowód
    // Evaluatora: 47/60 tur bezczynności. Teraz iterujemy po WSZYSTKICH
    // kandydatach (posortowanych rosnąco wg odległości) i bierzemy PIERWSZEGO
    // OSIĄGALNEGO w zasięgu `chaseRadius` -- lista jest posortowana, więc jak
    // tylko trafimy kandydata poza zasięgiem, dalsi też odpadają (`break`, nie
    // `continue`). Dopiero gdy WSZYSCY kandydaci w zasięgu są nieosiągalni, brak
    // komendy jest akceptowalny (nic więcej nie da się zrobić -- to nie jest bug).
    // / EN: F2 (Evaluator A, round 5): BEFORE the fix only `targets[0]` (the
    // globally nearest candidate) was tried; when `firstStep` for it returned
    // `null` (target unreachable, e.g. a defended city across water) and
    // `raidReady` was `true` (chaseRadius = Infinity), the unit issued NO command
    // for the rest of the game -- step 4 (drift to camp) is deliberately skipped
    // when raidReady (`if (raidReady) continue;` below), so there was no fallback
    // at all. Evaluator's proof: 47/60 idle turns. Now we iterate over ALL
    // candidates (sorted ascending by distance) and take the FIRST REACHABLE one
    // within `chaseRadius` -- the list is sorted, so as soon as we hit a
    // candidate beyond range, later ones are too (`break`, not `continue`). Only
    // once EVERY candidate in range is unreachable is issuing no command
    // acceptable (nothing more can be done -- not a bug).
    let movedToTarget = false;
    for (const cand of targets) {
      if (cand.d > chaseRadius) break;
      const step = firstStep(unit, map, cand.q, cand.r, occ);
      if (step !== null) {
        commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
        movedToTarget = true;
        break;
      }
    }
    if (movedToTarget) continue;

    // 4. Idle: drift back toward the home camp (tylko gdy obóz nie wysłał rajdu).
    if (raidReady) continue;
    const homeCampIdle = homeCamp ?? nearest(unit.q, unit.r, camps);
    if (homeCampIdle !== undefined && hexDistance(unit.q, unit.r, homeCampIdle.q, homeCampIdle.r) > 1) {
      const step = firstStep(unit, map, homeCampIdle.q, homeCampIdle.r, occ);
      if (step !== null) {
        commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
      }
    }
  }

  return commands;
}

// ---------------------------------------------------------------------------
// TEMAT #15 (część C) — rajdy Ludów Morza
// ---------------------------------------------------------------------------

/** Cel rajdu: heks z wrogim (posiadanym) ulepszeniem terenu. */
export interface SeaRaidTarget {
  q: number;
  r: number;
}

/**
 * Zbiera cele rajdów: heksy z ulepszeniem terenu innym niż 'brak'.
 * Ulepszenia budują wyłącznie gracz/AI (barbarzyńcy nie budują), więc każde
 * zbudowane ulepszenie jest prawomocnym celem — bez potrzeby śledzenia
 * właściciela heksa. Kolejność deterministyczna (iteracja po kluczach mapy).
 */
export function collectSeaRaidTargets(map: GameMap): SeaRaidTarget[] {
  const out: SeaRaidTarget[] = [];
  for (const key of Object.keys(map.hexes)) {
    const hex = map.hexes[key];
    if (hex === undefined) continue;
    const ul = (hex as { ulepszenie?: unknown }).ulepszenie;
    if (typeof ul === 'string' && ul !== 'brak') {
      out.push({ q: hex.coords.q, r: hex.coords.r });
    }
  }
  return out;
}

/** Miasto nadmorskie = heks miasta ma ≥1 sąsiada-wodę (cel podejścia rajdu). */
export function isCoastalCity(map: GameMap, city: HasQR): boolean {
  for (const [dq, dr] of HEX_NEIGHBORS) {
    const hex = map.hexes[keyOf(city.q + dq, city.r + dr)];
    if (hex !== undefined && isWaterTerrain(hex.terenBazowy)) return true;
  }
  return false;
}

/** Najbliższy heks wody na mapie względem (q,r) — powrót rajdera w morze. */
function nearestWaterHexOnMap(map: GameMap, q: number, r: number): { q: number; r: number } | undefined {
  let best: { q: number; r: number } | undefined;
  let bestDist = Infinity;
  for (const key of Object.keys(map.hexes)) {
    const hex = map.hexes[key];
    if (hex === undefined || !isWaterTerrain(hex.terenBazowy)) continue;
    const d = hexDistance(q, r, hex.coords.q, hex.coords.r);
    if (d < bestDist) { bestDist = d; best = { q: hex.coords.q, r: hex.coords.r }; }
  }
  return best;
}

/**
 * Decyzje rajdowe Ludów Morza — jedna komenda na jednostkę seaRaider.
 * Deterministyczne (żadnego Math.random; wybory przez nearest / kolejność wejścia).
 *
 * Stan wynika z terenu (embarked utrzymuje silnik — applyEmbarkStateAfterMove):
 *
 * NA WODZIE (embarked):
 *   1. „Fala rajdów" tylko co seaParams.raidPeriod tur (intensywność wg
 *      trudności; 1 = co turę). Poza falą — jednostka dryfuje (brak komendy).
 *   2. Cel = najbliższe wrogie ulepszenie terenu LUB nadmorskie miasto w
 *      promieniu raidRadius. Ulepszenie sąsiednie → komenda 'raid' (wejście
 *      + zniszczenie + auto-zejście na ląd). Inaczej krok ku celowi po wodzie
 *      (koszt embarkMoveCost); wejście na ląd = automatyczny desant.
 *   3. Brak celu → brak komendy (czeka na morzu).
 *
 * NA LĄDZIE (desant po rajdzie):
 *   1. Wróg obok → atak (jak barbarzyńcy).
 *   2. Wrogie ulepszenie w zasięgu → 'raid' (sąsiednie) albo krok ku niemu.
 *   3. Nic do złupienia („po zniszczeniu ulepszenia / nieudanym szturmie") →
 *      krok z powrotem ku najbliższej wodzie (auto-zaokrętowanie na wodzie).
 */
export function decideSeaPeoplesRaids(
  seaUnits: BarbUnit[],
  playerUnits: RuntimeUnit[],
  cities: CityLike[],
  raidTargets: SeaRaidTarget[],
  map: GameMap,
  seaParams: SeaBarbParams,
  turn: number,
  // C-BARB-Q1/Q2 (Maciej 2026-07-26): war-state gate for the ashore ATTACK
  // decision -- see decideBarbarianMoves for the full rationale. Optional so
  // existing callers/tests keep the previous "always engageable" behaviour.
  canEngageOwner?: (targetOwnerId: number) => boolean,
): BarbCommand[] {
  const commands: BarbCommand[] = [];
  const engageOk = canEngageOwner ?? ((_targetOwnerId: number) => true);
  const enemies = playerUnits.filter(u => !isBarbarian(u.ownerId));
  const allUnits: RuntimeUnit[] = [...seaUnits, ...enemies];
  const raidWave = seaParams.raidPeriod <= 1 || turn % seaParams.raidPeriod === 0;
  const coastalCities = cities.filter(c => isCoastalCity(map, c));

  for (const unit of seaUnits) {
    if (unit.ruchLeft <= 0) continue;

    const occ = addForeignCityBlocks(
      occupiedExcluding(allUnits, unit.id),
      unit.ownerId,
      cities as Pick<City, 'q' | 'r' | 'ownerId'>[],
    );

    const nearestImpr = nearest(unit.q, unit.r, raidTargets);
    const imprDist = nearestImpr !== undefined
      ? hexDistance(unit.q, unit.r, nearestImpr.q, nearestImpr.r)
      : Infinity;

    if (unit.embarked === true) {
      // --- NA WODZIE ---
      if (!raidWave) continue;

      const nearestCity = nearest(unit.q, unit.r, coastalCities);
      const cityDist = nearestCity !== undefined
        ? hexDistance(unit.q, unit.r, nearestCity.q, nearestCity.r)
        : Infinity;

      // Sąsiednie ulepszenie → rajd (desant + zniszczenie).
      if (nearestImpr !== undefined && imprDist === 1 && !occ.has(keyOf(nearestImpr.q, nearestImpr.r))) {
        commands.push({ type: 'raid', unitId: unit.id, toQ: nearestImpr.q, toR: nearestImpr.r });
        continue;
      }

      // Najbliższy cel w zasięgu rajdu → krok (po wodzie; ląd = desant).
      const targets: { q: number; r: number; d: number }[] = [];
      if (nearestImpr !== undefined && imprDist <= seaParams.raidRadius) {
        targets.push({ q: nearestImpr.q, r: nearestImpr.r, d: imprDist });
      }
      if (nearestCity !== undefined && cityDist <= seaParams.raidRadius) {
        targets.push({ q: nearestCity.q, r: nearestCity.r, d: cityDist });
      }
      targets.sort((a, b) => a.d - b.d);
      const target = targets[0];
      if (target !== undefined) {
        const step = firstStep(unit, map, target.q, target.r, occ, embarkMoveCost);
        if (step !== null) {
          commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
        }
      }
      continue;
    }

    // --- NA LĄDZIE (desant) ---
    // 1. Atak na wroga obok (jak barbarzyńcy lądowi) -- ta sama bramka canEngageOwner.
    const adjacentEnemy = enemies.find(
      e => hexDistance(unit.q, unit.r, e.q, e.r) === 1 && engageOk(e.ownerId),
    );
    if (adjacentEnemy !== undefined) {
      commands.push({ type: 'attack', unitId: unit.id, targetUnitId: adjacentEnemy.id });
      continue;
    }

    // 2. Wrogie ulepszenie w zasięgu → rajd lub krok ku niemu.
    if (nearestImpr !== undefined && imprDist <= seaParams.raidRadius) {
      if (imprDist === 1 && !occ.has(keyOf(nearestImpr.q, nearestImpr.r))) {
        commands.push({ type: 'raid', unitId: unit.id, toQ: nearestImpr.q, toR: nearestImpr.r });
        continue;
      }
      const step = firstStep(unit, map, nearestImpr.q, nearestImpr.r, occ, embarkMoveCost);
      if (step !== null) {
        commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
        continue;
      }
    }

    // 3. Powrót w morze (auto-zaokrętowanie po wejściu na wodę).
    const water = nearestWaterHexOnMap(map, unit.q, unit.r);
    if (water !== undefined) {
      const step = firstStep(unit, map, water.q, water.r, occ, embarkMoveCost);
      if (step !== null) {
        commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
      }
    }
  }

  return commands;
}
