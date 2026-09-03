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
import { canCaptureCityWithoutBattle } from './siegeDefenders';
import type { Hex } from '../types/hex';
import type { RuntimeUnit } from '../units/setup';
import { hexDistance, computePath, pathCost, keyOf, isWaterTerrain, embarkMoveCost, terrainMoveCost, isCivilianUnit } from '../units/setup';

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

/** Trwała identyfikacja heksu, na którym spawner został wyczyszczony. */
export type ClearedBarbCampHexes = ReadonlySet<string>;

function campHexIsCleared(
  clearedHexes: ClearedBarbCampHexes | undefined,
  q: number,
  r: number,
): boolean {
  return clearedHexes?.has(keyOf(q, r)) === true;
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
   * decideBarbarianMoves (jedno z DWÓCH świadomych odejść od "moduł nigdy nie mutuje
   * stanu" -- drugie to `orphanedAtTurn`, patrz niżej; oba to pola czysto informacyjne
   * per-jednostka, ten sam wzorzec co `campId`/`healthFrac`). Samo-wygasa PER MIASTO: gdy miasto odzyska obrońcę,
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
   * decideBarbarianMoves (one of TWO deliberate exceptions to "this module never
   * mutates state" -- the other is `orphanedAtTurn`, see below; both are purely
   * informational per-unit fields, same pattern as `campId`/`healthFrac`). Self-expires PER CITY: once a city regains a defender,
   * the step-3 filter stops excluding it regardless of membership in this set.
   * When the set would exclude EVERY available (undefended) city -- the unit has
   * visited each one -- the set is RESET (see step 3), so the patrol starts another
   * lap instead of freezing on a permanently-full set. Optional -- legacy saves/
   * tests without this field simply have no memory yet, identical behaviour up to
   * the first undefended city encountered.
   */
  clearedCityIds?: string[];
  /**
   * P-BARBARZYNCY-OSIEROCONE-POSCIG-LIMIT-Q1=B (Maciej): tura, w której TA jednostka
   * została po raz pierwszy uznana za osieroconą (campId wskazuje na obóz nieobecny
   * w `camps`) -- ustawiane PRZY PIERWSZYM wykryciu, nietykane potem dopóki jednostka
   * pozostaje osierocona. Gdy `turn - orphanedAtTurn >= params.orphanedChaseTurnLimit`,
   * jednostka traci nieograniczony chaseRadius (wraca do aggroRadius) -- patrz komentarz
   * `orphaned`/`chaseRadius` w decideBarbarianMoves. Licznik TUR, nie promień pozycyjny
   * (Operator: prostsze, nie wymaga dodatkowego stanu pozycyjnego typu "punkt zniszczenia
   * obozu" -- wystarcza jedna liczba, ten sam wzorzec co `clearedCityIds`/`campId`).
   * Tablica `string[]` obok (`clearedCityIds`) już ustaliła, że zwykłe pola prymitywne
   * na `BarbUnit` przechodzą save/load round-trip bez specjalnej obsługi (JSON.stringify
   * wprost) -- ten `number` idzie tą samą, sprawdzoną drogą. Optional -- stare save'y/testy
   * legacy bez tego pola = brak pamięci, dokładnie zachowanie sprzed tej rundy (patrz
   * komentarz `turn` przy sygnaturze funkcji: brak `turn` u wołającego = `turn` domyślnie 0,
   * `orphanedAtTurn` ustawiane raz na 0 i nigdy nie "dogania" progu -- bit-identyczne z
   * dotychczasowym nieograniczonym pościgiem).
   * / EN: the turn on which THIS unit was FIRST detected as orphaned (its campId points
   * at a camp no longer present in `camps`) -- set on first detection, left untouched
   * while the unit stays orphaned. Once `turn - orphanedAtTurn >= params.
   * orphanedChaseTurnLimit`, the unit loses its unlimited chaseRadius (reverts to
   * aggroRadius) -- see the `orphaned`/`chaseRadius` comment in decideBarbarianMoves. A
   * TURN counter, not a positional radius (Operator's choice: simpler, needs no extra
   * positional state like "camp destruction point" -- a single number suffices, same
   * pattern as `clearedCityIds`/`campId`). The sibling `string[]` field (`clearedCityIds`)
   * already established that plain primitive fields on `BarbUnit` round-trip through
   * save/load with no special handling (straight `JSON.stringify`) -- this `number`
   * travels the same, already-proven path. Optional -- legacy saves/tests without this
   * field simply have no memory yet, exactly the pre-this-round behaviour (see the `turn`
   * comment on the function signature: a caller omitting `turn` gets 0 every call,
   * `orphanedAtTurn` gets set to 0 once and never "catches up" to the limit -- bit-
   * identical to the previous unlimited chase).
   */
  orphanedAtTurn?: number;
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
  /**
   * P-BARBARZYNCY-OSIEROCONE-POSCIG-LIMIT-Q1=B (Maciej): liczba TUR od osierocenia
   * (zniszczenia obozu macierzystego), po której jednostka osierocona traci
   * nieograniczony zasięg pościgu (chaseRadius=Infinity) i wraca do zwykłego
   * aggroRadius -- NIE znika, tylko przestaje mieć nieskończony zasięg. Patrz
   * `orphanedAtTurn` (BarbUnit) i komentarz `turn` przy decideBarbarianMoves.
   * / EN: number of TURNS since being orphaned (home camp destroyed) after
   * which an orphaned unit loses its unlimited chase radius (chaseRadius=
   * Infinity) and reverts to the ordinary aggroRadius -- it does NOT despawn,
   * it simply stops having unlimited reach. See `orphanedAtTurn` (BarbUnit)
   * and the `turn` param comment on decideBarbarianMoves.
   */
  orphanedChaseTurnLimit: number;
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
  orphanedChaseTurnLimit: 10,
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
 *   barbarzyncy_zasieg_kontroli, barbarzyncy_zasieg_agresji, barbarzyncy_prog_odwrotu_hp,
 *   barbarzyncy_limit_tur_osierocony (P-BARBARZYNCY-OSIEROCONE-POSCIG-LIMIT-Q1).
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
    orphanedChaseTurnLimit: readParam(data, 'barbarzyncy_limit_tur_osierocony', FALLBACK_BARB_PARAMS.orphanedChaseTurnLimit),
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
 * RUNDA 3 (Evaluator A, znalezisko U1 -- audyt zbiorczy commitu 93db72e8): CAŁA
 * koniunkcja `barbCanWalkIntoEmptyCity` z main.ts (gałąź `move` barbarzyńców)
 * wyciągnięta do jednej czystej, eksportowanej funkcji -- main.ts ma TYLKO wołać ją
 * W MIEJSCU UŻYCIA, nie składać `destCity !== undefined && shouldAllowBarbCityCapture(...)
 * && canCaptureCityWithoutBattle(...)` inline. Powód: przed tą rundą usunięcie
 * `&& barbAllowCityCapture` z tej koniunkcji inline dawało `tsc` czysty i CAŁY test
 * 89/89 zielony -- bramka trudności (hard-only, P-BARBARZYNCY-PUSTE-MIASTO-PRZEJECIE-Q1=B)
 * nie była chroniona w punkcie faktycznego użycia: test 1c liczył WŁASNĄ kopię formuły
 * zdefiniowaną w pliku testowym (nie kod produkcyjny), test 1d dopasowywał string z
 * miejsca DEKLARACJI zmiennej `barbCanWalkIntoEmptyCity`, która przeżywa mutację, bo
 * zmienna nadal jest gdzieś używana. Ten sam wzorzec co shouldAllowBarbCityCapture
 * wyżej (RUNDA 2, Evaluator punkt 5) -- wyciągnięcie do czystej, bundlowalnej funkcji
 * sprawia, że mutacja WEWNĄTRZ niej jest łapana przez REALNE wykonanie testu na
 * produkcyjnym kodzie, nie przez porównanie source-tekstu.
 * / EN: the WHOLE `barbCanWalkIntoEmptyCity` conjunction from main.ts (barbarian `move`
 * branch) pulled out into a single pure, exported function -- main.ts should ONLY call
 * it AT THE USE SITE, not assemble `destCity !== undefined &&
 * shouldAllowBarbCityCapture(...) && canCaptureCityWithoutBattle(...)` inline. Reason:
 * before this round, removing `&& barbAllowCityCapture` from the inline conjunction
 * gave a clean `tsc` and the ENTIRE test suite green at 89/89 -- the difficulty gate
 * (hard-only, P-BARBARZYNCY-PUSTE-MIASTO-PRZEJECIE-Q1=B) was not protected at the
 * actual use site: test 1c computed its OWN copy of the formula defined in the test
 * file (not production code), test 1d pattern-matched a string at the
 * `barbCanWalkIntoEmptyCity` variable's DECLARATION site, which survives the mutation
 * because the variable is still used somewhere. Same pattern as
 * shouldAllowBarbCityCapture above (ROUND 2, Evaluator point 5) -- pulling it into a
 * pure, bundlable function means a mutation INSIDE it is caught by REAL test execution
 * against production code, not source-text comparison.
 */
export function canBarbarianWalkIntoEmptyCity(
  destCity: City | undefined,
  units: readonly RuntimeUnit[],
  difficulty: SeaRaidDifficulty,
): boolean {
  return destCity !== undefined
    && shouldAllowBarbCityCapture(difficulty)
    && canCaptureCityWithoutBattle(destCity, units);
}

/**
 * RUNDA 3 (Evaluator C, mutacja M10.3 -- audyt zbiorczy commitu 93db72e8): koszt ruchu
 * (w punktach ruchu) rozdzielonego pod-stosu wchodzącego na heks ŻYWEGO obozu
 * barbarzyńskiego (onSplit, main.ts, temat 10) wyciągnięty do czystej, eksportowanej
 * funkcji -- main.ts ma TYLKO wołać ją, nie liczyć `computePath`+`pathCost` inline w
 * miejscu użycia. Powód: przed tą rundą zastąpienie wywołania stałą `1` (ignorowanie
 * realnego kosztu terenu) dawało `tsc` czysty i CAŁY test 89/89 zielony -- testy 4a/4b
 * liczyły TO SAMO wyrażenie DWA RAZY pod różnymi nazwami zmiennych i porównywały kopię
 * z kopią (tautologia analogiczna do 1c/1d powyżej). `moveCostFn`/`occupied` są
 * policzone przez wołającego (main.ts: `moveCostFnForUnit`/`occupiedForMove` --
 * zależą od stanu gry: `cities`, znajomość Żeglugi gracza/AI -- nie da się ich uczynić
 * czystymi bez przeniesienia znacznej części main.ts), ta funkcja liczy WYŁĄCZNIE
 * `computePath`+`pathCost` na już gotowych wynikach, żeby została czysta i bezpośrednio
 * testowalna wprost (bez bundlowania main.ts).
 * / EN: the movement cost (in movement points) for a split sub-stack landing on a
 * LIVING barbarian camp's hex (onSplit, main.ts, topic 10) pulled out into a pure,
 * exported function -- main.ts should ONLY call it, not compute `computePath`+
 * `pathCost` inline at the use site. Reason: before this round, replacing the call
 * with the constant `1` (ignoring the real terrain cost) gave a clean `tsc` and the
 * ENTIRE test suite green at 89/89 -- tests 4a/4b computed the SAME expression TWICE
 * under different variable names and compared a copy against a copy (a tautology
 * analogous to 1c/1d above). `moveCostFn`/`occupied` are computed by the caller
 * (main.ts: `moveCostFnForUnit`/`occupiedForMove` -- depend on game state: `cities`,
 * player/AI Seafaring knowledge -- cannot be made pure without moving a large part of
 * main.ts), this function ONLY computes `computePath`+`pathCost` on the ready-made
 * results, to stay pure and directly testable (without bundling main.ts).
 */
export function splitCampMoveCost(
  mover: RuntimeUnit,
  map: GameMap,
  destQ: number,
  destR: number,
  occupied: Set<string>,
  moveCostFn: ((hex: Hex) => number) | undefined,
): number {
  const path = computePath(mover, map, destQ, destR, occupied, moveCostFn);
  return path.length > 0 ? pathCost(path, map, moveCostFn) : 1;
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

/**
 * Poziom gęstości barbarzyńców z kreatora (R-BARBARZYNCY-USTAWIENIA-NIEZALEZNE-OD-TRUDNOSCI,
 * Maciej 2026-08-13) — osobny suwak w „Zaawansowane opcje", NIEZALEŻNY od głównej
 * trudności gry (`_menuDifficulty`) i od trudności miast-państw
 * (`cityStateDifficultyOverride`, patrz city-state-difficulty.ts) — dokładnie ten
 * sam wzorzec architektoniczny (własne pole w advOpts, nie pochodna trudności).
 * Zastępuje starą skalę 'wielu'|'nieliczni'|'wylaczeni' (Maciej 2026-07-04) skalą
 * 4-poziomową w duchu trudności: Łatwy zawsze daje jakichś barbarzyńców (nigdy
 * zero), Normalny i Trudny kotwiczą na dawnym baseline „Wielu" (JSON/FALLBACK),
 * Brak = pełne wyłączenie (jak dawne „Wyłączeni"). Stare zapisy (save/localStorage)
 * migrowane funkcją migrateBarbariansLevel() poniżej — brak crasha na starym stanie.
 * / EN: barbarian density level from the new-game wizard — its own advanced-option
 * field, INDEPENDENT of game difficulty and city-state difficulty (same
 * architectural pattern as cityStateDifficultyOverride). Replaces the old
 * 'wielu'|'nieliczni'|'wylaczeni' 3-tier scale with a difficulty-shaped 4-tier
 * scale. Old saved values are migrated via migrateBarbariansLevel(), never crash.
 */
export type BarbariansLevel = 'latwy' | 'normalny' | 'trudny' | 'brak';

/** Trudność gry sterująca limitem żywych jednostek jednej chatki. */
export type BarbDifficulty = 'easy' | 'normal' | 'hard';

/** R-BARB-CHATKA-LIMIT-POZIOMY-Q1: Easy=1, Standard=2, Hard=3. */
export function barbarianUnitsPerCampForDifficulty(
  difficulty: BarbDifficulty | undefined,
): number {
  if (difficulty === 'easy') return 1;
  if (difficulty === 'hard') return 3;
  return 2;
}

/** Stara skala (przed 2026-08-13) — WYŁĄCZNIE do migracji starych zapisów/configów. */
export type LegacyBarbariansLevel = 'wielu' | 'nieliczni' | 'wylaczeni';

/**
 * Migruje dowolną starą lub nierozpoznaną wartość na nową 4-poziomową skalę —
 * używana zarówno przy wczytaniu starego zapisu gry (save.ts), jak i starych
 * prefs kreatora (localStorage, newGameFlow.ts migrateAdvanced()).
 * Mapowanie: `wielu` (dawny szczyt gęstości -- w starej skali nie było wyżej)
 * -> `trudny` (odpowiednik "dużo barbarzyńców" w nowej skali, gdzie Trudny =
 * 2x dawny baseline). `nieliczni` (0.45x baseline) -> `normalny` (najbliższy
 * nowy poziom -- porównaj maxCamps/spawnInterval w scaleBarbParamsForLevel).
 * `wylaczeni` -> `brak` (dokładny odpowiednik, oba dają maxCamps=0). Wartość
 * już w nowej skali przechodzi bez zmian. Nierozpoznana/brakująca -> `normalny`
 * (bezpieczny środek skali, nigdy nie crashuje na nieznanym stringu z save'a).
 * / EN: migrates any legacy or unrecognised value onto the new 4-tier scale;
 * used both for old save games (save.ts) and old wizard prefs (localStorage).
 */
export function migrateBarbariansLevel(level: unknown): BarbariansLevel {
  if (level === 'latwy' || level === 'normalny' || level === 'trudny' || level === 'brak') {
    return level;
  }
  if (level === 'wielu') return 'trudny';
  if (level === 'nieliczni') return 'normalny';
  if (level === 'wylaczeni') return 'brak';
  return 'normalny';
}

export function barbariansEnabledForLevel(level: BarbariansLevel | undefined): boolean {
  return level !== 'brak';
}

/**
 * Skalowanie parametrów obozów/spawnu wg poziomu z kreatora. Baseline (`params`,
 * z JSON/FALLBACK_BARB_PARAMS) NIE jest już żadnym z 4 poziomów wprost -- leży
 * pomiędzy Normalny (~1/4 baseline) i Trudny (2x baseline), bo dawne "Wielu" nie
 * miało wyższej opcji nad sobą (patrz migrateBarbariansLevel). Wszystkie
 * mnożniki liczone OD `params` (odczytanego z danych), NIGDY od twardo wpisanych
 * liczb -- balansowanie przez panel Excel/JSON działa identycznie jak przed
 * zmianą (zmienia się tylko sama skala poziomów, nie źródło baseline).
 *   Brak     (=0):   maxCamps=0 -- reszta bez znaczenia, spawn i tak się nie odbywa.
 *   Łatwy    (~0.2x): maxCamps min(1, round(0.2x)) -- zawsze coś, nigdy zero
 *                     (wymóg właściciela); spawnInterval x2 (rzadziej), unitsPerCamp -1 (min 1).
 *   Normalny (~0.25x): maxCamps round(1/4) (min 1) -- ok. 4x mniej niż dawne
 *                     "Wielu" (decyzja właściciela); spawnInterval x1.5, unitsPerCamp -1 (min 1).
 *   Trudny   (~2x):   maxCamps round(x2) -- ok. 2x więcej niż dawne "Wielu"
 *                     (decyzja właściciela, "ma być trudno to ma być trudno");
 *                     spawnInterval /2 (min 1, częściej), unitsPerCamp +1.
 * / EN: scales camp/spawn params by wizard level. The JSON baseline is NOT any
 * single one of the 4 levels -- it sits between Normal (~1/4x) and Hard (2x).
 * All multipliers apply to `params` (data-driven), never to hardcoded numbers.
 */
export function scaleBarbParamsForLevel(
  params: BarbParams,
  level: BarbariansLevel | undefined,
  difficulty?: BarbDifficulty,
): BarbParams {
  const withDifficulty = difficulty === undefined
    ? params
    : { ...params, unitsPerCamp: barbarianUnitsPerCampForDifficulty(difficulty) };
  switch (level) {
    case 'brak':
      return { ...withDifficulty, maxCamps: 0 };
    case 'latwy':
      return {
        ...withDifficulty,
        maxCamps: Math.max(1, Math.round(withDifficulty.maxCamps * 0.2)),
        spawnInterval: Math.max(1, Math.round(withDifficulty.spawnInterval * 2)),
        unitsPerCamp: difficulty === undefined
          ? Math.max(1, withDifficulty.unitsPerCamp - 1)
          : barbarianUnitsPerCampForDifficulty(difficulty),
      };
    case 'trudny':
      return {
        ...withDifficulty,
        maxCamps: Math.max(1, Math.round(withDifficulty.maxCamps * 2)),
        spawnInterval: Math.max(1, Math.round(withDifficulty.spawnInterval / 2)),
        unitsPerCamp: difficulty === undefined
          ? withDifficulty.unitsPerCamp + 1
          : barbarianUnitsPerCampForDifficulty(difficulty),
      };
    case 'normalny':
    default:
      return {
        ...withDifficulty,
        maxCamps: Math.max(1, Math.round(withDifficulty.maxCamps / 4)),
        spawnInterval: Math.max(1, Math.round(withDifficulty.spawnInterval * 1.5)),
        unitsPerCamp: difficulty === undefined
          ? Math.max(1, withDifficulty.unitsPerCamp - 1)
          : barbarianUnitsPerCampForDifficulty(difficulty),
      };
  }
}

/** True when barbarians are active on the given turn number. */
export function barbariansActive(
  turn: number,
  params: BarbParams,
  maxPlayerEra: number = 1,
  level: BarbariansLevel | undefined = 'normalny',
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
  return isWaterTerrain(t) || t === TerenBazowy.Gory;
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

/**
 * R-ARMIA-KONCENTRACJA-AI-BARB-Q1=A: plan lokalnego rally barbarzyńców.
 *
 * To jest faza przygotowania, nie bonus do Mocy: jednostki lądowe tej samej
 * frakcji przypisane do tego samego żywego obozu idą do jego heksu, dopóki
 * kontyngent nie znajdzie się w promieniu 1. Nie ma teleportu ani łączenia z
 * Ludami Morza; obóz jest już kanonicznym punktem odwrotu/regeneracji.
 */
export function planBarbarianRally(
  barbUnits: readonly BarbUnit[],
  camps: readonly BarbCamp[],
  map: GameMap,
  allUnits: readonly RuntimeUnit[],
  cities: readonly CityLike[],
): BarbCommand[] {
  const landCamps = camps.filter(c => c.naval !== true);
  if (landCamps.length === 0) return [];

  const eligible = barbUnits.filter(u =>
    u.ruchLeft > 0
    && u.embarked !== true
    && u.seaRaider !== true
    && u.inGarnizon !== true
    && u.oblegaCityId === undefined
    && !isCivilianUnit(u),
  );
  const byCamp = new Map<string, BarbUnit[]>();
  for (const unit of eligible) {
    const camp = unit.campId !== undefined
      ? landCamps.find(c => c.id === unit.campId)
      : nearest(unit.q, unit.r, landCamps);
    if (camp === undefined) continue;
    const group = byCamp.get(camp.id) ?? [];
    group.push(unit);
    byCamp.set(camp.id, group);
  }

  const commands: BarbCommand[] = [];
  for (const group of byCamp.values()) {
    if (group.length < 2) continue;
    const camp = landCamps.find(c => c.id === (group[0]?.campId ?? ''))
      ?? nearest(group[0]!.q, group[0]!.r, landCamps);
    if (camp === undefined) continue;
    const gathered = group.every(u => hexDistance(u.q, u.r, camp.q, camp.r) <= 1);
    if (gathered) continue;

    for (const unit of group) {
      if (hexDistance(unit.q, unit.r, camp.q, camp.r) <= 1) continue;
      const occupied = addForeignCityBlocks(
        occupiedExcluding([...allUnits], unit.id),
        unit.ownerId,
        cities as readonly Pick<City, 'q' | 'r' | 'ownerId'>[],
      );
      const step = firstStep(unit, map, camp.q, camp.r, occupied);
      if (step !== null) commands.push({ type: 'move', unitId: unit.id, toQ: step.q, toR: step.r });
    }
  }
  return commands;
}

// ---------------------------------------------------------------------------
// F2-PERF (RUNDA 6, Evaluator B) -- spójne składowe lądu (flood-fill), do
// odfiltrowania kandydatów-celów GWARANTOWANIE nieosiągalnych PRZED próbą
// pełnego computePath/Dijkstry.
// ---------------------------------------------------------------------------

/**
 * Etykietuje spójne składowe terenu przechodniego dla jednostek lądowych
 * (BFS/flood-fill), heks -> numer składowej. Kryterium przechodniości to
 * DOKŁADNIE ta sama funkcja kosztu, której używa computePath z domyślnym
 * `costFn` (czyli `terrainMoveCost`, bez podanego `costFn` w wywołaniach
 * `firstStep` w tym pliku) -- nie osobny/duplikowany warunek -- żeby etykiety
 * nigdy nie rozjechały się z tym, co pathfinding naprawdę uznaje za
 * przechodnie (w tym po `configureTerrainMovement()` w runtime).
 *
 * CELOWO bez `occupied` (jednostki na heksach) -- zajęcie jest per-turowe i
 * NIE zmienia topologii lądu, tylko chwilowo blokuje konkretny heks. Spójność
 * terenu jest warunkiem KONIECZNYM dotarcia (różna składowa => dowodliwie
 * nigdy nieosiągalne, żaden układ jednostek tego nie zmieni), ale NIE
 * WYSTARCZAJĄCYM (ta sama składowa może nadal być zablokowana przez
 * `occupied` na konkretnym korytarzu) -- dlatego wynik służy WYŁĄCZNIE jako
 * tani (O(heksy) raz na turę) wstępny filtr PRZED faktycznym
 * firstStep/computePath, nigdy jako jego zamiennik.
 *
 * Koszt: O(liczba heksów mapy) raz na wywołanie decideBarbarianMoves (czyli
 * raz na turę), NIE raz na jednostkę x cel -- to jest właśnie naprawa F2
 * (patrz komentarz przy pętli wyboru celu niżej).
 *
 * / EN: labels connected components of terrain passable to land units (BFS/
 * flood-fill), hex -> component id. The passability criterion is EXACTLY the
 * same cost function computePath uses with its default `costFn` (i.e.
 * `terrainMoveCost`, since every `firstStep` call in this file omits a custom
 * `costFn`) -- not a separate/duplicated check -- so the labels can never
 * drift from what pathfinding actually treats as passable (including after a
 * runtime `configureTerrainMovement()` call).
 *
 * DELIBERATELY ignores `occupied` (units standing on hexes) -- occupation is
 * per-turn and does NOT change land topology, it only blocks one specific hex
 * temporarily. Terrain connectivity is a NECESSARY condition for reachability
 * (different component => provably never reachable, no unit arrangement can
 * change that), but NOT SUFFICIENT (the same component can still be blocked
 * by `occupied` along one particular corridor) -- so the result is used ONLY
 * as a cheap (O(hexes) once per turn) pre-filter BEFORE the real
 * firstStep/computePath call, never as a replacement for it.
 *
 * Cost: O(map hex count) once per decideBarbarianMoves call (i.e. once per
 * turn), NOT once per unit x target -- this is exactly the F2 fix (see the
 * comment at the target-selection loop below).
 */
function computeLandComponents(map: GameMap): Map<string, number> {
  const comp = new Map<string, number>();
  let nextId = 0;
  for (const key of Object.keys(map.hexes)) {
    if (comp.has(key)) continue;
    const hex = map.hexes[key];
    if (hex === undefined || terrainMoveCost(hex) === Infinity) continue;
    const id = nextId++;
    const queue: string[] = [key];
    comp.set(key, id);
    let qi = 0;
    while (qi < queue.length) {
      const curKey = queue[qi++]!;
      const curHex = map.hexes[curKey];
      if (curHex === undefined) continue;
      const cq = curHex.coords.q;
      const cr = curHex.coords.r;
      for (const [dq, dr] of HEX_NEIGHBORS) {
        const nKey = keyOf(cq + dq, cr + dr);
        if (comp.has(nKey)) continue;
        const nHex = map.hexes[nKey];
        if (nHex === undefined || terrainMoveCost(nHex) === Infinity) continue;
        comp.set(nKey, id);
        queue.push(nKey);
      }
    }
  }
  return comp;
}

/**
 * Zbiór id składowych, przez które dany heks (q,r) jest osiągalny jako CEL
 * (nie jako zwykły tranzyt). `computePath` traktuje DESTYNACJĘ jako zawsze
 * "wchodzalną" jako ostatni krok, NIEZALEŻNIE od jej własnego kosztu terenu
 * (patrz computePath/setup.ts: `enterCost = movCost === Infinity ? 1 :
 * movCost`) -- np. miasto teoretycznie na heksie o nieskończonym koszcie
 * WŁASNYM wciąż jest osiągalne, jeśli SĄSIADUJE ze składową, z której
 * jednostka startuje. Dlatego zwracamy: własną składową heksu (gdy przechodni)
 * ORAZ składowe wszystkich sąsiadów -- odpowiednik "wchodzalny jako ostatni
 * krok z tej strony". W praktyce miasta/jednostki zawsze stoją na terenie
 * przechodnim (canFoundCity odrzuca Morze/Wybrzeze/Gory), więc gałąź
 * sąsiedzka jest rzadkim marginesem bezpieczeństwa, nie głównym przypadkiem.
 * / EN: set of component ids through which the given (q,r) hex is reachable
 * AS A DESTINATION (not as ordinary transit). `computePath` always treats the
 * DESTINATION as enterable as the final step, REGARDLESS of its own terrain
 * cost (see computePath/setup.ts: `enterCost = movCost === Infinity ? 1 :
 * movCost`) -- e.g. a city hypothetically sitting on an infinite-cost hex is
 * still reachable if it's ADJACENT to the component the unit starts from.
 * Hence we return: the hex's own component (when passable) PLUS every
 * neighbour's component -- the equivalent of "enterable as the final step
 * from that side". In practice cities/units always stand on passable terrain
 * (canFoundCity rejects Morze/Wybrzeze/Gory), so the neighbour branch is a
 * rare safety margin, not the main case.
 */
function destComponentIds(map: GameMap, comps: Map<string, number>, q: number, r: number): Set<number> {
  const ids = new Set<number>();
  const ownId = comps.get(keyOf(q, r));
  if (ownId !== undefined) ids.add(ownId);
  for (const [dq, dr] of HEX_NEIGHBORS) {
    const nId = comps.get(keyOf(q + dq, r + dr));
    if (nId !== undefined) ids.add(nId);
  }
  return ids;
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
  clearedHexes?: ClearedBarbCampHexes,
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
    // P-BARBARZYNCY-USUWANIE-SEMANTYKA-Q1=A: wejście cywilizacji czyści
    // spawner bezpowrotnie w tej rozgrywce; kolejny losowy spawn nie może
    // ponownie wybrać tego samego heksu.
    if (campHexIsCleared(clearedHexes, q, r)) continue;
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
  clearedHexes?: ClearedBarbCampHexes,
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
    if (campHexIsCleared(clearedHexes, q, r)) continue;
    let ok = false;
    if (hex.terenBazowy === TerenBazowy.PlytkieMorze) {
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

    // Cooldown ready: a living unit keeps its camp slot after marching away.
    // Legacy units without campId retain the former proximity fallback.
    const owned = countCampLivingUnits(camp, barbUnits, params.campControlRadius);

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

/**
 * P-BARBARZYNCY-ELIMINACJA-CYWILIZACJI-Q1=A: minimalny odpowiednik "miasto barbarzyńskie
 * produkuje" (temat 8 batcha 7-10) -- jedno DARMOWE spawnienie jednostki WOJSKOWEJ na
 * miasto, na tych samych zasadach co obóz (cooldown -> spawn -> reset), ale KLUCZOWA różnica:
 * cel spawnu to `City.barbGarrisonSpawnCooldown` (patrz komentarz przy polu, cities.ts), nie
 * `BarbCamp`, i funkcja NIGDY nie dotyka `cityProd`/kolejki Pracy -- "nigdy budynki" jest
 * spełnione PRZEZ KONSTRUKCJĘ (jedyny output to `spawns: BarbCityGarrisonSpawn[]`), nie przez
 * filtrowanie listy kandydatów budynek/jednostka. PURE -- nie mutuje `barbCities`/`barbUnits`;
 * wołający (main.ts) aplikuje `cooldowns` do `city.barbGarrisonSpawnCooldown` i tworzy
 * RuntimeUnit z `spawns`, dokładnie jak przy `tickCamps`/`BarbSpawn`.
 *
 * @param barbCities  Miasta z ownerId===BARBARIAN_OWNER_ID (wołający filtruje).
 * @param barbUnits   Żyjące jednostki barbarzyńskie (do limitu unitsPerCamp w promieniu miasta).
 * @param allUnits    WSZYSTKIE jednostki na mapie (do zajętości heksów spawnu, jak tickCamps).
 * @param map         Mapa gry (do szukania wolnego sąsiedniego heksu).
 * @param params      Te same tunable co obozy -- campControlRadius/unitsPerCamp/spawnInterval/
 *                    unitTypeId reużyte 1:1 (brak nowych osobnych tunable dla miast --
 *                    najprostsze rozwiązanie spełniające wymaganie, KISS, CLAUDE.md §7).
 *
 * / EN: the minimal counterpart of "a barbarian city produces" (topic 8 of the 7-10 batch) --
 * one FREE spawn of a MILITARY unit per city, on the same rules as a camp (cooldown -> spawn
 * -> reset), but with a KEY difference: the spawn's target is `City.barbGarrisonSpawnCooldown`
 * (see the field comment, cities.ts), not a `BarbCamp`, and the function NEVER touches
 * `cityProd`/the Praca queue -- "never buildings" is satisfied BY CONSTRUCTION (the only
 * output is `spawns: BarbCityGarrisonSpawn[]`), not by filtering a building/unit candidate
 * list. PURE -- does not mutate `barbCities`/`barbUnits`; the caller (main.ts) applies
 * `cooldowns` to `city.barbGarrisonSpawnCooldown` and builds a RuntimeUnit from `spawns`,
 * exactly as with `tickCamps`/`BarbSpawn`.
 */
export interface BarbCityGarrisonSpawn {
  /** id of the barbarian-owned City this unit spawned from. */
  cityId: string;
  q: number;
  r: number;
  /** units.json "Jednostka" key for the spawned barbarian. */
  typeId: string;
}

export interface BarbCityGarrisonTickResult {
  spawns: BarbCityGarrisonSpawn[];
  /** cityId -> new value for City.barbGarrisonSpawnCooldown. */
  cooldowns: Map<string, number>;
}

export function tickBarbarianCityGarrisons(
  barbCities: ReadonlyArray<{ id: string; q: number; r: number; barbGarrisonSpawnCooldown?: number }>,
  barbUnits: BarbUnit[],
  allUnits: RuntimeUnit[],
  map: GameMap,
  params: BarbParams,
): BarbCityGarrisonTickResult {
  const occupied = new Set<string>();
  for (const u of allUnits) occupied.add(keyOf(u.q, u.r));

  const spawns: BarbCityGarrisonSpawn[] = [];
  const cooldowns = new Map<string, number>();

  for (const city of barbCities) {
    // Brak pola (miasto świeżo przejęte -- temat 7) = gotowe do spawnu od razu, ten sam
    // konwent co nowy BarbCamp.spawnCooldown=0 w spawnCamps() wyżej.
    // / EN: field absent (freshly-captured city -- topic 7) = spawn-ready immediately,
    // same convention as a new BarbCamp.spawnCooldown=0 in spawnCamps() above.
    const cd = Math.max(0, (city.barbGarrisonSpawnCooldown ?? 0) - 1);

    if (cd > 0) {
      cooldowns.set(city.id, cd);
      continue;
    }

    const owned = barbUnits.filter(
      u => hexDistance(u.q, u.r, city.q, city.r) <= params.campControlRadius,
    ).length;

    if (owned >= params.unitsPerCamp) {
      // Przy limicie -- trzymaj na 0, spawn gotowy natychmiast gdy zwolni się slot
      // (identyczny wzorzec co tickCamps).
      cooldowns.set(city.id, 0);
      continue;
    }

    const spot = freeAdjacentHex(city.q, city.r, map, occupied);
    if (spot === null) {
      cooldowns.set(city.id, 0);
      continue;
    }

    occupied.add(keyOf(spot.q, spot.r));
    spawns.push({ cityId: city.id, q: spot.q, r: spot.r, typeId: params.unitTypeId });
    cooldowns.set(city.id, params.spawnInterval);
  }

  return { spawns, cooldowns };
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

function countCampLivingUnits(
  camp: BarbCamp,
  barbUnits: BarbUnit[],
  campControlRadius: number,
): number {
  return barbUnits.filter(
    u => u.campId === camp.id
      || (u.campId === undefined
        && hexDistance(u.q, u.r, camp.q, camp.r) <= campControlRadius),
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
 *
 *   AKTUALIZACJA (P-BARBARZYNCY-PUSTE-MIASTO-PRZEJECIE-Q1=B, batch tematów 7-10): "brak stanu
 *   terminalnego" opisany wyżej (main.ts:26273, tylko `attack`) jest ZAMKNIĘTY osobnym,
 *   równoległym zleceniem tej samej sesji -- main.ts teraz WOŁA tryAutoCaptureEmptyCityAt
 *   także z komendy `move` (nie tylko `attack`), warunkowo pod shouldAllowBarbCityCapture.
 *   Ta funkcja (decideBarbarianMoves) sama się NIE zmieniła w tym zakresie -- generuje
 *   `move` w stronę pustego miasta dokładnie jak dotychczas (computePath: cel ZAWSZE
 *   przejezdny jako ostatni krok, patrz units/setup.ts), wystarczyło dopiąć aplikację
 *   komendy w main.ts. / EN: UPDATE (P-BARBARZYNCY-PUSTE-MIASTO-PRZEJECIE-Q1=B, batch of
 *   topics 7-10): the "no terminal state" gap noted above (main.ts:26273, `attack` only) is
 *   CLOSED by a separate, parallel task in this same session -- main.ts now also calls
 *   tryAutoCaptureEmptyCityAt from a `move` command (not just `attack`), gated by
 *   shouldAllowBarbCityCapture. This function (decideBarbarianMoves) itself did NOT change
 *   in this respect -- it already generated a `move` toward an undefended city exactly as
 *   before (computePath: the destination is ALWAYS passable as the final step, see units/
 *   setup.ts), only the command's application in main.ts needed wiring.
 * @param turn
 *   P-BARBARZYNCY-OSIEROCONE-POSCIG-LIMIT-Q1=B (Maciej): bieżąca tura gry, do liczenia ile tur
 *   minęło od osierocenia (patrz `orphanedAtTurn`, BarbUnit). `undefined` (wszyscy istniejący
 *   wołający/testy) = domyślnie 0, co czyni pościg osieroconej jednostki NIEOGRANICZONYM
 *   NA ZAWSZE -- identyczne z zachowaniem sprzed tej rundy (gwarancja "legacy unchanged").
 *   / EN: the current game turn, used to count how many turns have passed since a unit was
 *   orphaned (see `orphanedAtTurn`, BarbUnit). `undefined` (all pre-existing callers/tests)
 *   defaults to 0, which makes an orphaned unit's chase UNLIMITED FOREVER -- identical to the
 *   pre-this-round behaviour ("legacy unchanged" guarantee).
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
  turn?: number,
): BarbCommand[] {
  const commands: BarbCommand[] = [];
  const engageOk = canEngageOwner ?? ((_targetOwnerId: number) => true);
  const skipDefenselessCities = difficulty === 'normal' || difficulty === 'hard';
  // P-BARBARZYNCY-OSIEROCONE-POSCIG-LIMIT-Q1=B: `turn` domyślnie 0 gdy pominięty (wszyscy
  // istniejący wołający/testy) -- `orphanedAtTurn` jest wtedy ustawiane raz na 0 i
  // `turnNum - orphanedAtTurn` zawsze wychodzi 0, nigdy nie osiąga orphanedChaseTurnLimit
  // (dodatni) -- bit-identyczne z dotychczasowym nieograniczonym pościgiem, gwarancja
  // "legacy callers unchanged" tym samym wzorcem co `difficulty` wyżej.
  // / EN: `turn` defaults to 0 when omitted (all pre-existing callers/tests) --
  // `orphanedAtTurn` is then set to 0 once and `turnNum - orphanedAtTurn` always comes out
  // 0, never reaching orphanedChaseTurnLimit (positive) -- bit-identical to the previous
  // unlimited chase, same "legacy callers unchanged" guarantee pattern as `difficulty` above.
  const turnNum = turn ?? 0;

  // Only real players are valid targets.
  const enemies = playerUnits.filter(u => !isBarbarian(u.ownerId));

  // All units occupy hexes for pathing (barbs + players).
  const allUnits: RuntimeUnit[] = [...barbUnits, ...enemies];

  // R-ARMIA-KONCENTRACJA-AI-BARB-Q1=A: rally precedes chase/attack. A unit
  // receives at most one command below; once the group is physically gathered
  // at the camp, the existing tactical planner resumes unchanged.
  const rallyCommands = planBarbarianRally(barbUnits, camps, map, allUnits, cities);
  const ralliedUnitIds = new Set(rallyCommands.map(c => c.unitId));
  const rallyCampIds = new Set(
    rallyCommands
      .map(c => barbUnits.find(u => u.id === c.unitId)?.campId)
      .filter((id): id is string => id !== undefined),
  );
  commands.push(...rallyCommands);

  // F2-PERF (RUNDA 6, Evaluator B): etykietowanie spójnych składowych lądu
  // liczone LENIWIE, co najwyżej RAZ na to wywołanie (czyli raz na turę),
  // WSPÓLNE dla wszystkich jednostek barbarzyńskich w tej turze -- nie raz na
  // jednostkę x cel. Patrz doc-comment computeLandComponents/destComponentIds
  // wyżej dla pełnego uzasadnienia poprawności (dlaczego to bezpieczny,
  // konieczny-ale-nie-wystarczający pre-filtr) i komentarz przy pętli wyboru
  // celu niżej dla zmierzonych liczb.
  // / EN: land-component labelling computed LAZILY, at most ONCE per this
  // call (i.e. once per turn), SHARED across every barbarian unit this turn
  // -- not once per unit x target. See the computeLandComponents/
  // destComponentIds doc-comment above for the full correctness rationale
  // (why this is a safe, necessary-but-not-sufficient pre-filter) and the
  // comment at the target-selection loop below for the measured numbers.
  let landComponentsCache: Map<string, number> | null = null;
  const getLandComponents = (): Map<string, number> => {
    landComponentsCache ??= computeLandComponents(map);
    return landComponentsCache;
  };

  for (const unit of barbUnits) {
    if (unit.ruchLeft <= 0) continue;
    if (ralliedUnitIds.has(unit.id) || (unit.campId !== undefined && rallyCampIds.has(unit.campId))) continue;
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
        //
        // F1-LIVELOCK (RUNDA 6, Evaluator A): czyszczenie do PUSTEJ tablicy (jak
        // wyżej w komentarzu RUNDA 4) tworzy na planszy z DOKŁADNIE JEDNYM miastem
        // niebronionym (+ >=1 bronionym) STABILNY 3-turowy cykl: jednostka dociera
        // do jedynego niebronionego miasta -> zapisuje je -> warunek resetu
        // odpala NATYCHMIAST (to JEDYNE niebronione miasto, `every()` na
        // jednoelementowej tablicy) -> zbiór czyszczony do `[]` -> miasto znów
        // "widoczne" jako cel (bo `filtered` w NASTĘPNEJ turze liczony jest z
        // pustym `clearedSet`) -> jednostka wraca do niego -> w nieskończoność,
        // NIGDY nie dociera do bronionego miasta obok. Naprawa: nowe okrążenie
        // zaczyna z WYKLUCZONYM WYŁĄCZNIE ostatnio odwiedzonym miastem (ostatni
        // element `clearedSet`, bo krok zapisu niżej zawsze dopisuje na koniec
        // przez `.push`) -- jednostka nie odbija się z powrotem na miasto, które
        // WŁAŚNIE opuściła, tylko idzie dalej (do bronionego, jeśli nic innego nie
        // zostało). SPROSTOWANIE (RUNDA 7, Evaluator A -- poprzednia wersja tego zdania
        // twierdziła błędnie, że to "dodatkowo usuwa" pełen problem): przy >=2 miastach
        // niebronionych i >=1 bronionym reżim POZOSTAJE NIEROZWIĄZANY. Zweryfikowane
        // wykonaniem: 2 miasta niebronione dają STABILNY cykl o OKRESIE 22 tur (potwierdzone
        // na 300 turach), bronione miasto NIGDY nie zostaje osiągnięte bliżej niż 14 heksów;
        // 3 miasta niebronione dają okres 44 tur, min. 19 heksów. Mechanizm: reset
        // zostawiający WYŁĄCZNIE "ostatnio odwiedzone" natychmiast odsłania "przedostatnie" --
        // 2-cykl zamiast oczekiwanego 3-cyklu. Ta naprawa rozwiązuje WYŁĄCZNIE wąski
        // przypadek DOKŁADNIE 1 miasta niebronionego (patrz tabela 12 reżimów w raporcie
        // rundy 6, rozszerzona niżej w rundzie 7; otwarte pytanie
        // P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1 -- NIE regresja tej rundy, przed naprawą
        // było identycznie źle w tym reżimie).
        // Przy 0 bronionych (RUNDA 4/6b, `filtered` wychodzi puste i tak wraca do
        // fallbacku `civCitiesBase` w TEJ SAMEJ turze) wynik jest DOWIEDLIWIE
        // identyczny co przed tą poprawką -- zapis "arrival" w kroku niżej i tak
        // natychmiast dopisuje z powrotem ostatnio odwiedzone miasto do zbioru
        // (fizyczna obecność jednostki na jego heksie czyni je `nearestCity` tej
        // samej decyzji), więc różnica między "wyczyść do []" a "wyczyść do
        // [ostatnie]" znika w tej samej turze -- sekcja 6b w
        // barb-city-behavior-test.cjs pozostaje zielona bez zmian.
        // / EN: F1-LIVELOCK (ROUND 6, Evaluator A): clearing to an EMPTY array (as
        // in the ROUND 4 comment above) forms a STABLE 3-turn cycle on a board
        // with EXACTLY ONE undefended city (+ >=1 defended): the unit reaches the
        // sole undefended city -> records it -> the reset condition fires
        // IMMEDIATELY (it's the ONLY undefended city, `every()` on a one-element
        // array) -> the set is cleared to `[]` -> the city becomes a "visible"
        // target again (the NEXT turn's `filtered` is computed from an empty
        // `clearedSet`) -> the unit returns to it -> forever, NEVER reaching the
        // defended city nearby. Fix: the new lap starts with ONLY the
        // most-recently-visited city excluded (the set's last element, since the
        // write step below always `.push`es onto the end) -- the unit does not
        // bounce straight back onto the city it just left, it moves on instead
        // (to the defended one, if nothing else remains). CORRECTION (ROUND 7,
        // Evaluator A -- the previous version of this sentence wrongly claimed this
        // "additionally removes" the whole problem): with >=2 undefended cities and
        // >=1 defended one the regime STAYS UNSOLVED. Verified by execution: 2
        // undefended cities produce a STABLE cycle with PERIOD 22 turns (confirmed
        // over 300 turns), the defended city is NEVER reached closer than 14 hexes;
        // 3 undefended cities give a period of 44 turns, min. 19 hexes. Mechanism: a
        // reset that leaves ONLY the "most-recently-visited" city excluded
        // immediately exposes the "second-to-last" one -- a 2-cycle instead of the
        // expected 3-cycle. This fix resolves ONLY the narrow case of EXACTLY 1
        // undefended city (see the 12-regime table in the round-6 report, extended
        // below in round 7; open question
        // P-BARBARZYNCY-KRAZENIE-NIEBRONIONE-Q1 -- NOT a regression of this round,
        // it was equally broken in this regime before the fix). With 0 defended cities
        // (ROUND 4/6b, `filtered` comes out empty and falls straight back to the
        // `civCitiesBase` fallback within the SAME turn) the outcome is PROVABLY
        // identical to before this fix -- the "arrival" write below immediately
        // re-adds the just-visited city to the set anyway (the unit's physical
        // presence on its hex makes it `nearestCity` for that very decision), so
        // the difference between "clear to []" and "clear to [last]" vanishes
        // within the same turn -- section 6b in barb-city-behavior-test.cjs stays
        // green unchanged.
        //
        // RUNDA 7 (Evaluator C) -- rozszerzenie tabeli 12 reżimów o 4. oś i pełną listę
        // bit-identycznych. Oś 4 (pominięta w rejestrze operatora rundy 6): OSIĄGALNOŚĆ
        // bronionego miasta (osiągalne / nieosiągalne -- inna wyspa, brak lądowego ani
        // morskiego połączenia). Lista reżimów bit-identycznych przed/po tej naprawie:
        // zweryfikowana wykonaniem jako WSZYSTKIE reżimy z 0 miast bronionych, niezależnie
        // od liczby niebronionych i stanu raidReady -- realnie 8, nie 3 jak wcześniej
        // wymieniono w rejestrze rundy 6 (fallback `civCitiesBase` w tej samej turze
        // czyni różnicę "wyczyść do []" vs "wyczyść do [ostatnie]" niewidoczną, patrz
        // akapit "Przy 0 bronionych" wyżej -- ten dowód obejmuje KAŻDĄ kombinację
        // niebronione x raidReady przy 0 bronionych, nie tylko 3 wybrane wcześniej próbki).
        //
        // Nowy, łagodny brzegowy przypadek (Evaluator C, NIE naprawiony, tylko
        // udokumentowany): reżim "1 miasto niebronione OSIĄGALNE + >=1 bronione
        // NIEOSIĄGALNE" -- ta naprawa F1 zamienia dawny 3-turowy livelock na TRWAŁE
        // zamrożenie jednostki bez własnego obozu (zweryfikowane: bezczynna od tury 5,
        // 23/25 tur idle). To NIE jest nowa ścieżka błędu wprowadzona przez F1 -- to
        // POSZERZENIE zasięgu już znanego, świadomie-poza-zakresem defektu
        // `if (raidReady) continue` (ten sam, który dokumentuje sprostowanie F3 niżej)
        // na reżim, w którym stary (błędny) reset do `[]` PRZYPADKIEM ciągle odsłaniał
        // osiągalny cel (jedyne niebronione miasto), maskując ten defekt. Naprawa F1
        // zamieniła jeden błąd (livelock) na inny (zamrożenie) -- to NIE jest regresja
        // netto, ale wymaga jawnej dokumentacji, nie ciszy.
        // / EN: ROUND 7 (Evaluator C) -- extends the 12-regime table with a 4th axis and
        // the full bit-identical list. Axis 4 (omitted from the round-6 operator report):
        // REACHABILITY of the defended city (reachable / unreachable -- different island,
        // no land or sea connection). The list of regimes bit-identical before/after this
        // fix: verified by execution as ALL regimes with 0 defended cities, regardless of
        // the number of undefended cities or raidReady state -- actually 8, not 3 as
        // earlier listed in the round-6 report (the `civCitiesBase` fallback within the
        // same turn makes the "clear to []" vs "clear to [last]" difference invisible,
        // see the "With 0 defended cities" paragraph above -- that proof covers EVERY
        // undefended x raidReady combination at 0 defended, not just the 3 sampled
        // originally).
        //
        // New, mild edge case (Evaluator C, NOT fixed, only documented): the regime
        // "1 undefended city REACHABLE + >=1 defended city UNREACHABLE" -- this F1 fix
        // turns the former 3-turn livelock into a PERMANENT freeze for a unit with no
        // camp of its own (verified: idle from turn 5, 23/25 idle turns). This is NOT a
        // new failure path introduced by F1 -- it WIDENS the reach of the already-known,
        // deliberately-out-of-scope `if (raidReady) continue` defect (the same one the F3
        // correction below documents) into a regime where the old (buggy) reset to `[]`
        // HAPPENED to keep exposing a reachable target (the sole undefended city), masking
        // that defect. The F1 fix swapped one bug (livelock) for another (freeze) -- not a
        // net regression, but it requires explicit documentation, not silence.
        const lastVisited = clearedSet[clearedSet.length - 1];
        unit.clearedCityIds = lastVisited !== undefined ? [lastVisited] : [];
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
    // P-BARBARZYNCY-OSIEROCONE-POSCIG-LIMIT-Q1=B: "orphaned" dawał NIEOGRANICZONY
    // (Infinity) zasięg pościgu NA ZAWSZE -- właściciel: dodać realny limit. Wybór
    // Operatora: licznik TUR od pierwszego wykrycia osierocenia (`orphanedAtTurn`,
    // BarbUnit), nie promień pozycyjny od miejsca zniszczenia obozu -- prostsze (jedna
    // liczba, zero dodatkowego stanu pozycyjnego), ten sam wzorzec co `clearedCityIds`.
    // Zapis TYLKO przy pierwszym wykryciu (`?? turnNum`) -- kolejne tury NIE nadpisują
    // już ustawionej wartości, więc licznik faktycznie mierzy czas OD osierocenia, nie
    // "od ostatniej tury bycia osieroconym". Gdy jednostka przestaje być osierocona
    // (nie powinno się zdarzyć w praktyce -- obozy się nie odradzają -- ale defensywnie),
    // pole jest czyszczone, żeby ewentualne przyszłe osierocenie zaczęło liczyć od zera.
    // / EN: "orphaned" used to grant an UNLIMITED (Infinity) chase radius FOREVER -- the
    // owner asked for a real limit. Operator's choice: a TURN counter since first
    // detection (`orphanedAtTurn`, BarbUnit), not a positional radius from the camp's
    // destruction point -- simpler (a single number, zero extra positional state), same
    // pattern as `clearedCityIds`. Written ONLY on first detection (`?? turnNum`) --
    // later turns do NOT overwrite an already-set value, so the counter actually measures
    // time SINCE being orphaned, not "since the last turn of being orphaned". When a unit
    // stops being orphaned (shouldn't happen in practice -- camps never respawn -- but
    // handled defensively), the field is cleared so any future orphaning starts fresh.
    if (orphaned) {
      if (unit.orphanedAtTurn === undefined) unit.orphanedAtTurn = turnNum;
    } else if (unit.orphanedAtTurn !== undefined) {
      unit.orphanedAtTurn = undefined;
    }
    const orphanedChaseExpired = orphaned
      && unit.orphanedAtTurn !== undefined
      && (turnNum - unit.orphanedAtTurn) >= params.orphanedChaseTurnLimit;
    // Osierocona jednostka PO limicie: raidReady liczony BEZ "orphaned" -- wraca do
    // normalnego chaseRadius=aggroRadius (nie 0 -- jednostka nie znika ani nie zamiera,
    // po prostu przestaje mieć nieskończony zasięg, dokładnie jak inne barbarzyńskie
    // jednostki bez pełnego kontyngentu obozu w zasięgu).
    // / EN: an orphaned unit PAST the limit: raidReady computed WITHOUT "orphaned" --
    // reverts to the normal chaseRadius=aggroRadius (not 0 -- the unit does not vanish
    // or freeze, it simply stops having unlimited reach, exactly like any other
    // barbarian unit without a full camp contingent in range).
    const orphanedActive = orphaned && !orphanedChaseExpired;
    const raidReady = orphanedActive || (homeCamp !== undefined && isCampRaidReady(homeCamp, barbUnits, params));
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
    // `continue`).
    //
    // X3 KOREKTA (RUNDA 6, Evaluator B) -- poprzednie zdanie w tym miejscu
    // twierdziło: "Dopiero gdy WSZYSCY kandydaci w zasięgu są nieosiągalni,
    // brak komendy jest akceptowalny (nic więcej nie da się zrobić -- to nie
    // jest bug)". To jest PRAWDĄ TYLKO dla jednostki NIE-raidReady -- dla niej
    // krok 4 (dryf do obozu) faktycznie wykonuje się zaraz PO tej pętli
    // (`if (raidReady) continue;` niżej NIE zwiera obwodu), więc "brak komendy
    // tutaj" i tak kończy się próbą dryfu, nie realnym zamrożeniem. Dla
    // jednostki raidReady zdanie jest FAŁSZEM: `if (raidReady) continue;`
    // pomija krok 4 CAŁKOWICIE (z INNEGO, starszego powodu -- "obóz wysłał
    // rajd, nie ma dokąd wracać", nie ma nic wspólnego z tą pętlą), więc
    // "wszyscy kandydaci nieosiągalni" u jednostki raidReady oznacza REALNIE
    // zero komend do końca gry, nie "nic więcej nie da się zrobić". Evaluator B
    // to udowodnił: jednostka raidReady z ŻYWYM, OSIĄGALNYM obozem (12 heksów,
    // garnizon w promieniu 3) daje 0 komend przez 60 tur, mimo że mogłaby po
    // prostu wrócić do obozu -- `if (raidReady) continue;` blokuje dokładnie tę
    // ścieżkę. To NIE jest regresja tej ani poprzedniej rundy (kod
    // `if(raidReady) continue` jest starszy niż F2) i CELOWO POZA ZAKRESEM tej
    // rundy -- naprawiamy TYLKO fałszywy opis, NIE zachowanie `raidReady`
    // (osobny, nieotwarty jeszcze temat).
    //
    // RUNDA 7 DOPRECYZOWANIE (Evaluator C): powyższe "REALNIE zero komend do końca
    // gry" jest PRZEUOGÓLNIENIEM -- trzyma się WYŁĄCZNIE dla jednostki z żywym,
    // WŁASNYM obozem. Dla jednostki OSIEROCONEJ (`orphaned`, patrz `orphanedActive`
    // wyżej) `raidReady` liczone przez ten człon jest CZASOWE: po
    // `orphanedChaseTurnLimit` turach `orphanedChaseExpired` staje się `true`,
    // `orphanedActive` przechodzi na `false`, `raidReady` przestaje wymuszać
    // pominięcie kroku 4 (o ile brak żywego obozu w zasięgu) -- dla TAKIEJ jednostki
    // krok 4 (dryf) w końcu się odblokowuje, "zero komend na zawsze" NIE zachodzi.
    //
    // F2-PERF (RUNDA 6, Evaluator B) -- KRYTYCZNA regresja wydajności: przy
    // nieosiągalnym najbliższym kandydacie ta pętla próbowała KOLEJNEGO z
    // WSZYSTKICH miast na planszy, każda próba = pełne wywołanie
    // firstStep/computePath (Dijkstra). Na mapie z 60-120 miastami (typowe dla
    // dużej mapy, MAX_MIAST_PANSTWA x klastry + ekspansja AI) i scenariuszu
    // wielowyspowym (obozy barbarzyńskie spawnują na DOWOLNYM lądzie, jedyny
    // warunek to `minDistFromCity>=5` w spawnCamps -- "większość celów
    // nieosiągalna" jest REALNE, nie egzotyczne) zmierzone przez Evaluatora B:
    // do 118x spowolnienie, do ~23s zawieszenia jednej tury. Naprawa: PRZED
    // próbą `firstStep` dla kandydata, tani (O(1) na kandydata, O(heksy mapy)
    // raz na turę -- patrz computeLandComponents/destComponentIds wyżej)
    // filtr odrzuca kandydatów z INNEJ spójnej składowej terenu niż jednostka
    // -- taki kandydat jest DOWIEDLIWIE nieosiągalny (żadna Dijkstra tego nie
    // zmieni), więc pomijamy go BEZ płacenia za pełne przeszukanie. Ta sama
    // składowa NIE gwarantuje osiągalności (occupied może blokować akurat ten
    // korytarz) -- dlatego nadal wołamy `firstStep` dla każdego kandydata w tej
    // samej składowej, filtr tylko ODRZUCA prowizoryczne "z góry niemożliwe",
    // nigdy nie PRZYJMUJE zamiast realnego sprawdzenia. Gdy `unitComp` jest
    // `undefined` (heks jednostki spoza mapy albo o nieskończonym koszcie --
    // brzegowy przypadek, patrz doc-comment destComponentIds) filtr jest
    // POMIJANY CAŁKOWICIE (nie odrzuca żadnego kandydata) -- bezpieczny
    // fallback do starego (wolniejszego, ale zawsze poprawnego) zachowania,
    // zamiast ryzykować fałszywe odrzucenie osiągalnego celu.
    // / EN: F2 (Evaluator A, round 5): BEFORE the fix only `targets[0]` (the
    // globally nearest candidate) was tried; when `firstStep` for it returned
    // `null` (target unreachable, e.g. a defended city across water) and
    // `raidReady` was `true` (chaseRadius = Infinity), the unit issued NO command
    // for the rest of the game -- step 4 (drift to camp) is deliberately skipped
    // when raidReady (`if (raidReady) continue;` below), so there was no fallback
    // at all. Evaluator's proof: 47/60 idle turns. Now we iterate over ALL
    // candidates (sorted ascending by distance) and take the FIRST REACHABLE one
    // within `chaseRadius` -- the list is sorted, so as soon as we hit a
    // candidate beyond range, later ones are too (`break`, not `continue`).
    //
    // X3 CORRECTION (ROUND 6, Evaluator B) -- the sentence that used to sit here
    // claimed: "Only once EVERY candidate in range is unreachable is issuing no
    // command acceptable (nothing more can be done -- not a bug)". That is TRUE
    // ONLY for a NON-raidReady unit -- for it, step 4 (drift to camp) actually
    // runs right AFTER this loop (`if (raidReady) continue;` below does NOT
    // short-circuit), so "no command here" still ends in an attempted drift, not
    // a real freeze. For a raidReady unit the sentence is FALSE: `if (raidReady)
    // continue;` skips step 4 ENTIRELY (for an UNRELATED, older reason -- "the
    // camp sent a raid, there's nowhere to return to" -- nothing to do with this
    // loop), so "every candidate unreachable" for a raidReady unit really does
    // mean zero commands for the rest of the game, not "nothing more can be
    // done". Evaluator B proved this: a raidReady unit with a LIVE, REACHABLE
    // camp (12 hexes away, garrison within radius 3) gives 0 commands for 60
    // turns even though it could simply return to camp -- `if (raidReady)
    // continue;` blocks exactly that path. This is NOT a regression from this or
    // any prior round (the `if(raidReady) continue` code predates F2) and is
    // DELIBERATELY OUT OF SCOPE for this round -- we fix ONLY the false
    // description here, NOT `raidReady` behaviour (a separate, still-open topic).
    //
    // ROUND 7 CLARIFICATION (Evaluator C): the "really does mean zero commands for
    // the rest of the game" claim above is an OVERGENERALIZATION -- it holds ONLY
    // for a unit with a live, OWN camp. For an ORPHANED unit (`orphaned`, see
    // `orphanedActive` above) the `raidReady` this clause computes is TEMPORARY:
    // after `orphanedChaseTurnLimit` turns `orphanedChaseExpired` becomes `true`,
    // `orphanedActive` flips to `false`, and `raidReady` stops forcing step 4 to be
    // skipped (absent a live camp in range) -- for SUCH a unit step 4 (drift)
    // eventually unblocks, so "zero commands forever" does NOT hold.
    //
    // F2-PERF (ROUND 6, Evaluator B) -- CRITICAL performance regression: when the
    // nearest candidate was unreachable, this loop tried the NEXT of ALL cities
    // on the board, each attempt a full firstStep/computePath (Dijkstra) call. On
    // a map with 60-120 cities (typical for a large map, MAX_MIAST_PANSTWA x
    // clusters + AI expansion) and a multi-island scenario (barbarian camps spawn
    // on ANY land, the only condition is `minDistFromCity>=5` in spawnCamps --
    // "most targets unreachable" is REAL, not exotic) Evaluator B measured: up to
    // a 118x slowdown, up to ~23s of stalling on a single turn. Fix: BEFORE
    // trying `firstStep` for a candidate, a cheap (O(1) per candidate, O(map hex
    // count) once per turn -- see computeLandComponents/destComponentIds above)
    // filter rejects candidates on a DIFFERENT land component than the unit --
    // such a candidate is PROVABLY unreachable (no Dijkstra can change that), so
    // it's skipped WITHOUT paying for a full search. The same component does NOT
    // guarantee reachability (`occupied` can still block that one corridor) --
    // so `firstStep` is still called for every same-component candidate, the
    // filter only REJECTS provable impossibilities, it never ACCEPTS in place of
    // the real check. When `unitComp` is `undefined` (unit's hex off-map or
    // infinite-cost -- an edge case, see the destComponentIds doc-comment) the
    // filter is SKIPPED ENTIRELY (rejects no candidate) -- a safe fallback to the
    // old (slower but always correct) behaviour, rather than risking a false
    // rejection of a reachable target.
    let movedToTarget = false;
    const unitComp = getLandComponents().get(keyOf(unit.q, unit.r));
    for (const cand of targets) {
      if (cand.d > chaseRadius) break;
      if (unitComp !== undefined) {
        const candComps = destComponentIds(map, getLandComponents(), cand.q, cand.r);
        if (!candComps.has(unitComp)) continue; // dowiedlnie inna wyspa/kontynent -- pomiń bez Dijkstry / provably a different island/continent -- skip without paying for Dijkstra
      }
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
