/**
 * setup.ts
 * Unit placement and movement logic for the world map.
 *
 * Exports:
 *   RuntimeUnit               - shared contract for in-game unit instances
 *   keyOf(q, r)               - canonical hex key "q,r"
 *   hexDistance(...)          - axial/cube hex distance
 *   computeStartPlacements()  - hex startowy gracza + pozycje AI (bez jednostek)
 *   placeStartingUnits()        - @deprecated zwraca [] — użyj computeStartPlacements
 *   configureTerrainMovement() - override cost table at runtime (data-driven)
 *   terrainMoveCost()         - movement cost to enter a hex
 *   computeReachable()        - cost-aware (Dijkstra) reachable hexes within ruchLeft
 *   computePath()             - least-cost (Dijkstra) path to destination
 *   pathCost()                - total movement cost of a path
 */

import type { GameMap } from '../types/map';
import type { Hex } from '../types/hex';
import type { GameData } from '../data/loader';
import { TerenBazowy, Nakladka } from '../types/hex';
import { findBestPlayerStartHex } from '../map/startScoring';
import {
  applyRoadMovementModifier,
  ROAD_MOVE_SPEED_MULT as MAPA_ROAD_MULT,
} from '../map/road-movement';

// ---------------------------------------------------------------------------
// River movement bonus
// ---------------------------------------------------------------------------

/**
 * Bonus movement points added to a unit's budget for the current turn when
 * it STARTS its move on a hex that has a river (hex.rzeka.obecna === true).
 * Rivers act as fast corridors: the unit can reach 4 further hexes this turn.
 * The bonus extends reach only -- it does not add stored ruchLeft points.
 */
export const RIVER_MOVE_BONUS = 4;

/** Droga (ulepszenie): ruch 3× szybszy — koszt wejścia ÷ 3 (Dijkstra używa ułamków). */
export const ROAD_MOVE_SPEED_MULT = MAPA_ROAD_MULT;

// ---------------------------------------------------------------------------
// RuntimeUnit - shared contract imported by other modules
// ---------------------------------------------------------------------------

/**
 * A unit instance on the world map at runtime.
 * ownerId 0 = human player, 1..N = AI rivals.
 * typeId = "Jednostka" key from units.json (e.g. "Osadnik").
 */
export interface RuntimeUnit {
  id: string;
  ownerId: number;
  typeId: string;
  /** Model category for this unit (weapon/class type). See categoryOf(). */
  category: string;
  q: number;
  r: number;
  ruch: number;
  ruchLeft: number;
  /** true = ukryta w garnizonie miasta (po Ufort. na heksie własnego miasta). */
  inGarnizon?: boolean;
  /** HP po walce (undefined = pełne z definicji jednostki). */
  hp?: number;
  /** Tura: liczba porażek obrony w tej turze (L2 — 2. = wipe). */
  defLossesThisTurn?: number;
  /** Miasto oblegane — jednostka trzyma oblężenie (ruch zablokowany do końca / szturmu). */
  oblegaCityId?: string;
  /** Mechanizm "Zastąp" (ZASTAP-JEDNOSTKI-PLAN.md): raz na turę na jednostkę.
   *  Resetowana na false na starcie tury gracza (main.ts, obok resetu ruchLeft). */
  replaceUsedThisTurn?: boolean;
  /** TEMAT #15 (Ludy Morza / embarkacja): jednostka LĄDOWA zaokrętowana na
   *  heksie wody (Morze/Wybrzeże). Ustawiane automatycznie po ruchu wg terenu
   *  docelowego (woda→true, ląd→false). Stare save'y bez pola = niezaokrętowana. */
  embarked?: boolean;
  /** C-SENTRY-Q1 wariant A (Maciej 2026-07-25): jednostka „czuwa" — pomija tury
   *  (jak Ufort./Pomiń) do RĘCZNEGO odwołania (ponowny klik akcji Sentry budzi ją)
   *  LUB do AUTOMATYCZNEGO obudzenia, gdy wróg wejdzie w jej pole widzenia
   *  (main.ts, wakeSentryUnitsOnEnemyContact() — wołane raz na koniec każdej
   *  tury, ownerId-agnostyczne). Trwałe między turami poza tym — nic innego nie
   *  czyści tego pola automatycznie. */
  sentry?: boolean;
  /**
   * ŚCIEŻKA A — Pancerz (2026-07-25, patrz game/unit-building-bonuses.ts).
   * Najlepszy % kumulacyjny bonusu Pancerza, jaki ta jednostka KIEDYKOLWIEK
   * osiągnęła (przy produkcji LUB wchodząc do miasta z Kuźnią/Kuźnią żelaza/
   * Wielką Kuźnią). Trwałe — nie znika po wyjściu z miasta ani zburzeniu
   * budynku; tylko rośnie (max), nigdy nie maleje. Ownerid-agnostyczne
   * (gracz i AI identycznie). Stare zapisy bez pola = undefined = 0% (brak
   * bonusu) — patrz unitPancerzBonusProc() w unit-building-bonuses.ts, KAŻDY
   * odczyt tego pola MUSI iść przez te funkcje, nie odczytywać wprost. */
  pancerzBonusProc?: number;
  /**
   * ŚCIEŻKA B — parametry miękkie, wszystko POZA Pancerzem (atak, obrona,
   * atak dystansowy, zdrowie, uderzenie/szarża). Analogicznie do
   * pancerzBonusProc, ale z Koszar/Akademii wojskowej/Warsztatu oblężniczego.
   * Niezależna od pancerzBonusProc — jednostka może mieć różny postęp na
   * każdej ścieżce. Stare zapisy bez pola = 0% — patrz unitParametryBonusProc(). */
  parametryBonusProc?: number;
  /**
   * TRZECI SYSTEM -- doświadczenie bojowe / weterani (2026-07-25, decyzja
   * właściciela, patrz game/veteran.ts). Liczba PRZEŻYTYCH bitew (starć
   * rozstrzygniętych, w których jednostka brała udział i PRZEŻYŁA — zginęła
   * = nie awansuje), zliczana WSPÓLNIE dla wszystkich trybów starć
   * (mapa/pole bitwy/szturm) w JEDNYM miejscu -- post-battle-map.ts
   * applyPostBattleMap() / registerVeteranProgressAfterBattle(), ownerId-
   * -agnostyczne (PARYTET AI: ten sam kod dla gracza i AI). Sufit 2
   * (poziom 3 = maks, "nie projektujemy na zapas" — patrz
   * VETERAN_MAX_BATTLES_TRACKED). Niezależne od pancerzBonusProc /
   * parametryBonusProc (systemy budynkowe) -- trzeci, osobny system, nie
   * zastępuje ani nie miesza się z tamtymi. Stare zapisy bez pola = 0 =
   * poziom 1 (Rekrut), zero premii -- patrz veteranBattlesSurvived()
   * w game/veteran.ts, KAŻDY odczyt tego pola MUSI iść przez tę funkcję
   * (lub veteranLevel()/veteranCombatBonusFrac()), nie odczytywać wprost.
   */
  battlesSurvived?: number;
}

/** Kategorie cywilne — bez utrzymania, bez głodu wojska, bez ataku miast. */
export const CIVILIAN_CATEGORIES = new Set(['osadnik', 'robotnik', 'zwiadowca']);

/** typeId z units.json — fallback gdy category zapis/load jest błędny (domyslny). */
export const CIVILIAN_TYPE_IDS = new Set(['Zwiadowca', 'Osadnik', 'Robotnik']);

/** Czy jednostka jest cywilna (zwiadowca/osadnik/robotnik). */
export function isCivilianUnit(u: Pick<RuntimeUnit, 'category' | 'typeId'>): boolean {
  if (CIVILIAN_CATEGORIES.has(u.category)) return true;
  return CIVILIAN_TYPE_IDS.has(u.typeId);
}

/**
 * Returns the model category key for a unit given its name, role string,
 * super-unit flag, and (optionally) its combat "Typ" from units.json.  All
 * name/role matching is case-insensitive and done on both name and role.
 * isSuper is checked first and always returns 'super' when true.
 *
 * TEMAT #10B fallback: many Iron-age / foreign-culture units carry no
 * weapon-revealing word in their name or role (e.g. "Piechota hetycka",
 * "Gwardia Ishtar", generic "Wojownik") and used to fall through every
 * name/role keyword check into 'domyslny'. When `typ` is passed and no
 * name/role keyword matched, this now buckets by the units.json "Typ" field
 * (Swordsman -> miecznik, Spearman -> wlocznik, Falangite -> falanga,
 * Mount -> konnica, Distance -> lucznik, Slinger -> procarz, Naval -> galera,
 * Siege -> obleznicza) so real units always resolve to a real model category.
 * "Typ" = "Offensive" is deliberately NOT bucketed here (it already covers two
 * distinct weapon families -- club vs axe -- and picking one would be a
 * guess); those units must be resolved by an explicit name/keyword match
 * instead (see maczugKw/toporKw below). Callers that omit `typ` keep the
 * exact prior behaviour.
 *
 * Valid return values:
 *   'osadnik' | 'miecznik' | 'wlocznik' | 'lucznik' | 'procarz' |
 *   'oszczepnik' | 'maczuga' | 'topor' | 'konnica' | 'rydwan' |
 *   'super' | 'domyslny'
 */
/**
 * Strips Polish diacritics for ASCII-safe substring matching.
 * NFD decomposes most accents into base + combining mark (which we drop).
 * The letter l-with-stroke (U+0142) does not decompose; we map it to 'l'
 * explicitly.  The result is lowercase ASCII (or near-ASCII) for comparison.
 */
function normalizeForMatch(s: string): string {
  // decompose accented chars, then drop combining diacritical marks (U+0300-U+036F)
  const nfd = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  // map l-with-stroke that NFD does not decompose
  return nfd.replace(/[Łł]/g, 'l').toLowerCase();
}

export function categoryOf(name: string, role: string, isSuper: boolean, typ?: string | null): string {
  if (isSuper) return 'super';
  const n = normalizeForMatch(name ?? '');
  const r = normalizeForMatch(role ?? '');
  // Civilian support units first (so they never collapse to 'domyslny').
  if (n.includes('osadnik') || r.includes('osadnik')) return 'osadnik';
  if (n.includes('robotnik') || n.includes('worker') ||
      n.includes('budown')   || r.includes('robotnik')) return 'robotnik';
  if (n.includes('zwiadowca') || n.includes('scout') ||
      n.includes('zwiad')    || r.includes('zwiadowca')) return 'zwiadowca';
  // Naval.
  if (n.includes('galera') || n.includes('galley') || n.includes('okret') ||
      n.includes('statek')  || r.includes('morsk')  || r.includes('naval')) return 'galera';
  // Mounted / chariots.
  if (n.includes('rydwan') || n.includes('chariot') ||
      r.includes('rydwan') || r.includes('chariot')) return 'rydwan';
  const konnicaKw = ['konnic', 'jezdz', 'jazd', 'kawaler', 'rycerz', 'cavalry', 'horse'];
  if (konnicaKw.some(kw => n.includes(kw) || r.includes(kw))) return 'konnica';
  // Greek phalanx -> distinct 'falanga' BEFORE the generic spearman check.
  if (n.includes('falanga') || n.includes('hoplit') || n.includes('phalanx')) return 'falanga';
  // Roman legionary -> distinct 'legionista' BEFORE the generic swordsman check.
  // GRAFIKA-JEDNOSTKI fix: "Legion Rzymski" nie zawiera 'legionist', dopisano
  // 'legion' zeby kategoria (staty/UI) tez trafila do legionista, spojnie z
  // bespoke modelem buildLegionRzymski w units.ts (buildNamedUnit).
  if (n.includes('legionist') || n.includes('hastati') || n.includes('legion')) return 'legionista';
  const wloczKw = ['wloczn', 'pikinier', 'spear', 'impi'];
  if (wloczKw.some(kw => n.includes(kw) || r.includes(kw))) return 'wlocznik';
  const mieczKw = ['miecz', 'sword', 'gladi', 'khopesh'];
  if (mieczKw.some(kw => n.includes(kw) || r.includes(kw))) return 'miecznik';
  const luczKw = ['luczn', 'archer', 'kusznik', 'crossbow'];
  if (luczKw.some(kw => n.includes(kw) || r.includes(kw))) return 'lucznik';
  const procarKw = ['procarz', 'sling'];
  if (procarKw.some(kw => n.includes(kw) || r.includes(kw))) return 'procarz';
  const oszczepKw = ['oszczep', 'javelin', 'atlatl', 'estolic'];
  if (oszczepKw.some(kw => n.includes(kw) || r.includes(kw))) return 'oszczepnik';
  // 'champi' = the Inca "champi" (star-headed mace) named IN the unit's own
  // name (units.json Uwagi: "maczuga gwiazdzista (champi)") -- same pattern as
  // 'khopesh'/'atlatl' above, not a guess.
  const maczugKw = ['maczug', 'chaska', 'club', 'mace', 'champi'];
  if (maczugKw.some(kw => n.includes(kw) || r.includes(kw))) return 'maczuga';
  const toporKw = ['topor', 'axe'];
  if (toporKw.some(kw => n.includes(kw) || r.includes(kw))) return 'topor';
  // Machiny oblężnicze (by name or by role "Oblężnicza").
  const oblezKw = ['taran', 'katapult', 'oblezn', 'siege', 'battering', 'trebuchet'];
  if (oblezKw.some(kw => n.includes(kw) || r.includes(kw))) return 'obleznicza';
  // "Wojownik tyrreński" (Sea Peoples / Tursza, Typ=Offensive): units.json
  // Uwagi documents the actual weapon as "TOPOR/tasak" -- the historical name
  // itself carries no weapon word, so this is an explicit exception (same
  // precedent as the legionista/hastati name-based special case above), not a
  // guess: it is read straight off the canonical data note.
  if (n.includes('tyrren')) return 'topor';
  // TEMAT #10B: units.json "Typ" fallback -- see the JSDoc above for why
  // "Offensive" is intentionally excluded (ambiguous maczuga/topor).
  if (typ) {
    const t = normalizeForMatch(typ);
    if (t === 'swordsman') return 'miecznik';
    if (t === 'spearman')  return 'wlocznik';
    if (t === 'falangite') return 'falanga';
    if (t === 'mount')     return 'konnica';
    if (t === 'distance')  return 'lucznik';
    if (t === 'slinger')   return 'procarz';
    if (t === 'naval')     return 'galera';
    if (t === 'siege')     return 'obleznicza';
  }
  return 'domyslny';
}

// ---------------------------------------------------------------------------
// listUnitTypes - full gallery list
// ---------------------------------------------------------------------------

/**
 * Returns all unit type definitions from data.units as a flat list, deduped by
 * name, suitable for a unit gallery.  Each entry has:
 *   typeId   - the "Jednostka" field value (used as the type key in-game)
 *   category - result of categoryOf() for this unit type
 *   name     - display name (same as typeId for units.json rows)
 */
export function listUnitTypes(
  data: import('../data/loader').GameData,
): { typeId: string; category: string; name: string }[] {
  const seen = new Set<string>();
  const result: { typeId: string; category: string; name: string }[] = [];
  for (const u of data.units) {
    const unitName: string = u.Jednostka ?? '';
    if (seen.has(unitName)) continue;
    seen.add(unitName);
    const role: string = u['Rola (linia)'] ?? '';
    const isSuper: boolean = u['Super-jednostka'] === 'TAK';
    const typ: string = u['Typ'] ?? '';
    result.push({
      typeId: unitName,
      category: categoryOf(unitName, role, isSuper, typ),
      name: unitName,
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Canonical string key for a hex coordinate pair.
 * Matches the key format used in GameMap.hexes: "${q},${r}".
 */
export function keyOf(q: number, r: number): string {
  return `${q},${r}`;
}

/**
 * Axial (cube) hex distance between two hexes.
 * In cube coords: s = -q - r. Distance = max(|dq|, |dr|, |ds|).
 */
export function hexDistance(aq: number, ar: number, bq: number, br: number): number {
  const dq = Math.abs(aq - bq);
  const dr = Math.abs(ar - br);
  const ds = Math.abs((-aq - ar) - (-bq - br));
  return Math.max(dq, dr, ds);
}

// ---------------------------------------------------------------------------
// Internal: simple LCG seeded PRNG
// ---------------------------------------------------------------------------

/** Advances LCG state and returns [nextState, float in [0, 1)]. */
function lcgNext(state: number): [number, number] {
  // Numerical Recipes 32-bit LCG
  const next = ((state * 1664525 + 1013904223) >>> 0);
  return [next, next / 0x100000000];
}

// ---------------------------------------------------------------------------
// Module-level terrain movement cost table (data-driven, overridable)
// ---------------------------------------------------------------------------

/**
 * Default movement costs per base terrain for land units.
 * Wybrzeze is impassable (Infinity) until boats exist -- treated like Morze.
 * Any value >= 90 loaded from config is treated as Infinity (impassable sentinel).
 */
const DEFAULT_TERRAIN_COSTS: Record<TerenBazowy, number> = {
  [TerenBazowy.Laka]:     1,
  [TerenBazowy.Rownina]:  1,
  [TerenBazowy.Pustynia]: 1,
  [TerenBazowy.Wybrzeze]: Infinity,
  [TerenBazowy.Wzgorza]:  2,
  [TerenBazowy.Gory]:     Infinity,
  [TerenBazowy.Morze]:    Infinity,
};

/** Live cost table -- starts as a copy of defaults, overridable via configureTerrainMovement(). */
let _terrainCosts: Record<TerenBazowy, number> = { ...DEFAULT_TERRAIN_COSTS };

/** Extra movement cost added to finite-cost terrain when Nakladka.Las is present. */
let _forestExtra: number = 1;

/**
 * Override the module-level terrain movement cost table at runtime.
 * Call this right after loadGameData() if the JSON carries a terrainMovement block.
 *
 * Any incoming cost value >= 90 is treated as Infinity (impassable sentinel for Excel/JSON).
 * Built-in defaults remain correct even if this is never called.
 *
 * @param costs       Partial map of TerenBazowy -> cost.
 * @param forestExtra Extra cost added to finite base costs when Las overlay is present.
 */
export function configureTerrainMovement(
  costs: Partial<Record<TerenBazowy, number>>,
  forestExtra: number,
): void {
  // Reset to defaults first so removed keys revert to default.
  _terrainCosts = { ...DEFAULT_TERRAIN_COSTS };
  for (const key of Object.keys(costs) as TerenBazowy[]) {
    const v = costs[key];
    if (v !== undefined) {
      _terrainCosts[key] = v >= 90 ? Infinity : v;
    }
  }
  _forestExtra = forestExtra >= 90 ? Infinity : forestExtra;
}

// ---------------------------------------------------------------------------
// Internal: hex terrain scoring for settler placement
// ---------------------------------------------------------------------------

/**
 * Returns a preference score for settler placement.
 * Only true land tiles are legal (score > 0):
 *   Laka=4, Rownina=4, Wzgorza=2, Pustynia=1.
 * Wybrzeze, Morze, and Gory are illegal (score <= 0) and never receive a settler.
 */
function terrainScore(tb: TerenBazowy): number {
  switch (tb) {
    case TerenBazowy.Laka:     return 4;
    case TerenBazowy.Rownina:  return 4;
    case TerenBazowy.Wzgorza:  return 2;
    case TerenBazowy.Pustynia: return 1;
    case TerenBazowy.Wybrzeze: return -1;
    case TerenBazowy.Gory:     return -1;
    case TerenBazowy.Morze:    return -1;
    default:                   return 0;
  }
}

// ---------------------------------------------------------------------------
// computeStartPlacements / placeStartingUnits
// ---------------------------------------------------------------------------

/** Wynik losowania startu — bez jednostek na mapie (A-START-01). */
export interface StartPlacements {
  playerStart: { q: number; r: number };
  aiStarts: Array<{ q: number; r: number; ownerId: number }>;
}

/**
 * Losuje hex startowy gracza i pozycje AI (ownerId 1..N).
 * Żadnych jednostek — tylko współrzędne do mgły, kamery i przyszłych miast AI.
 *
 * Algorithm:
 *   1. Collect all land hexes (score > 0) sorted by preference.
 *   2. Player on {@link findBestPlayerStartHex} — rzeka, pola, góry w okolicy.
 *   3. AI rivals placed greedily from shuffled candidates (min dist 5→2, LCG seed).
 */
export function computeStartPlacements(
  map: GameMap,
  _data: GameData,
  targetAiOverride?: number,
): StartPlacements {
  // --- Collect candidate land hexes ---
  // Only score > 0: Laka, Rownina, Pustynia, Wzgorza.
  // Wybrzeze, Morze, Gory all return score <= 0 and are excluded.
  interface Candidate { q: number; r: number; score: number; }
  const candidates: Candidate[] = [];

  for (const key of Object.keys(map.hexes)) {
    const hex = map.hexes[key];
    if (!hex) continue;
    const score = terrainScore(hex.terenBazowy);
    if (score > 0) {
      candidates.push({ q: hex.coords.q, r: hex.coords.r, score });
    }
  }

  if (candidates.length === 0) {
    return { playerStart: { q: 0, r: 0 }, aiStarts: [] };
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  // --- LCG state from seed ---
  let lcgState = (map.seed >>> 0);

  // --- Player start: najlepszy hex na pierwsze miasto (map/startScoring) ---
  const bestStart = findBestPlayerStartHex(map);
  const playerCandidate = bestStart ?? candidates[0]!;

  const placed: Array<{ q: number; r: number }> = [
    { q: playerCandidate.q, r: playerCandidate.r },
  ];

  // --- AI rivals ---
  const TARGET_AI    = targetAiOverride !== undefined ? Math.max(1, targetAiOverride) : 6;
  const MIN_AI       = Math.min(3, TARGET_AI);
  const ABS_MIN_DIST = 2;

  // Shuffle candidates via LCG Fisher-Yates
  const shuffled = [...candidates];
  for (let i = shuffled.length - 1; i > 0; i--) {
    let rnd: number;
    [lcgState, rnd] = lcgNext(lcgState);
    const j = Math.floor(rnd * (i + 1));
    const tmp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = tmp;
  }

  function attemptPlacement(minDist: number): Array<{ q: number; r: number }> {
    const result: Array<{ q: number; r: number }> = [];
    const localPlaced = [...placed];
    for (const c of shuffled) {
      if (result.length >= TARGET_AI) break;
      const tooClose = localPlaced.some(
        p => hexDistance(c.q, c.r, p.q, p.r) < minDist,
      );
      if (!tooClose) {
        localPlaced.push({ q: c.q, r: c.r });
        result.push({ q: c.q, r: c.r });
      }
    }
    return result;
  }

  let aiPositions: Array<{ q: number; r: number }> = [];
  for (let minDist = 5; minDist >= ABS_MIN_DIST; minDist--) {
    aiPositions = attemptPlacement(minDist);
    if (aiPositions.length >= MIN_AI) break;
  }

  const aiStarts: StartPlacements['aiStarts'] = [];
  let nextOwnerId = 1;
  for (const pos of aiPositions) {
    aiStarts.push({ q: pos.q, r: pos.r, ownerId: nextOwnerId++ });
  }

  return {
    playerStart: { q: playerCandidate.q, r: playerCandidate.r },
    aiStarts,
  };
}

/**
 * @deprecated A-START-01: gra startuje bez jednostek. Użyj {@link computeStartPlacements}.
 * Zachowane dla starych testów importujących nazwę — zwraca pustą tablicę.
 */
export function placeStartingUnits(map: GameMap, data: GameData, targetAiOverride?: number): RuntimeUnit[] {
  computeStartPlacements(map, data, targetAiOverride);
  return [];
}

// ---------------------------------------------------------------------------
// Pointy-top axial hex neighbors (6 directions)
// ---------------------------------------------------------------------------

/**
 * Pointy-top axial hex neighbors (6 directions).
 */
const HEX_NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [+1,  0],
  [-1,  0],
  [ 0, +1],
  [ 0, -1],
  [+1, -1],
  [-1, +1],
] as const;

/** Sąsiednie współrzędne heksa (pointy-top axial). */
export function hexNeighborCoords(q: number, r: number): Array<{ q: number; r: number }> {
  return HEX_NEIGHBORS.map(([dq, dr]) => ({ q: q + dq, r: r + dr }));
}

// ---------------------------------------------------------------------------
// terrainMoveCost
// ---------------------------------------------------------------------------

/**
 * Returns the movement point cost to ENTER the given hex.
 *
 * Base cost by terenBazowy (from the module-level cost table, configurable via
 * configureTerrainMovement()):
 *   Laka     => 1         (default)
 *   Rownina  => 1         (default)
 *   Pustynia => 1         (default)
 *   Wybrzeze => Infinity  (impassable -- shallow sea, no boats yet)
 *   Wzgorza  => 2         (default)
 *   Morze    => Infinity  (impassable)
 *   Gory     => Infinity  (impassable)
 *
 * If hex.nakladka === Nakladka.Las, add forestExtra (+1 by default) to any
 * finite base cost.  Infinity stays Infinity regardless of overlay.
 * hex.ulepszenie === Droga → koszt ÷ {@link ROAD_MOVE_SPEED_MULT} (3× szybciej).
 * hex.ulepszenie === DrogaBrukowana → bonus_ruch z JSON (domyślnie −2 od kosztu).
 */
export function terrainMoveCost(hex: Hex): number {
  const base = _terrainCosts[hex.terenBazowy] ?? 1;
  if (base === Infinity) return Infinity;
  let cost = base;
  if (hex.nakladka === Nakladka.Las) {
    const extra = _forestExtra;
    if (extra === Infinity) return Infinity;
    cost = base + extra;
  }
  return applyRoadMovementModifier(cost, hex);
}

// ---------------------------------------------------------------------------
// Embarkacja (TEMAT #15) — koszt ruchu po wodzie dla jednostek zaokrętowanych
// ---------------------------------------------------------------------------

/** True dla terenu wodnego (Morze / Wybrzeże). */
export function isWaterTerrain(t: TerenBazowy): boolean {
  return t === TerenBazowy.Morze || t === TerenBazowy.Wybrzeze;
}

/** Stały koszt wejścia na heks wody dla jednostki zaokrętowanej (decyzja: stały). */
export const EMBARKED_WATER_MOVE_COST = 1;

/**
 * Koszt ruchu z obsługą wody: heks wodny kosztuje EMBARKED_WATER_MOVE_COST,
 * ląd liczy się jak zwykle (terrainMoveCost). Przekazywany jako costFn do
 * computeReachable/computePath/pathCost dla jednostek, które mogą się
 * zaokrętować (gracz z Żeglugą, Ludy Morza) lub już są na wodzie.
 */
export function embarkMoveCost(hex: Hex): number {
  if (isWaterTerrain(hex.terenBazowy)) return EMBARKED_WATER_MOVE_COST;
  return terrainMoveCost(hex);
}

// ---------------------------------------------------------------------------
// computeReachable
// ---------------------------------------------------------------------------

/**
 * Cost-aware (Dijkstra / uniform-cost) set of hexes reachable within
 * unit.ruchLeft movement points.
 *
 * Rules:
 *   - Cost to enter a neighbor = terrainMoveCost(neighborHex).
 *   - Impassable hexes (cost === Infinity) are never entered.
 *   - Hexes in occupied are blocked (cannot enter).
 *   - Only hexes that exist in map.hexes are considered.
 *   - MIN-MOVE RULE: any hex DIRECTLY adjacent to the unit that is passable
 *     (finite cost) and not occupied is always included in the reachable set
 *     if unit.ruchLeft >= 1, even when its entry cost exceeds ruchLeft.
 *     This lets a unit with movement points always step one tile.
 *   - Returns Set<"q,r">, EXCLUDING the unit's own hex.
 *
 * @param unit     The moving unit (q, r, ruchLeft used).
 * @param map      Game map for hex lookup.
 * @param occupied Set of "q,r" keys blocked by other units.
 * @param costFn   Optional per-hex entry cost override (default terrainMoveCost);
 *                 embarkacja przekazuje embarkMoveCost, by woda była przejezdna.
 */
export function computeReachable(
  unit: RuntimeUnit,
  map: GameMap,
  occupied: Set<string>,
  costFn: (hex: Hex) => number = terrainMoveCost,
): Set<string> {
  const reachable = new Set<string>();

  // Dijkstra: dist map tracks the lowest accumulated cost to reach each hex.
  // We use a simple array-based min-heap approach via a sorted array for
  // determinism and simplicity (map sizes are bounded; this is adequate).
  // Entry: [accumulatedCost, q, r]
  type Entry = [number, number, number];

  // River bonus: if the unit starts on a hex with a river, extend its
  // movement budget by RIVER_MOVE_BONUS for this turn only.
  const startKey = keyOf(unit.q, unit.r);
  const startHexHasRiver = map.hexes[startKey]?.rzeka?.obecna === true;
  const budget = unit.ruchLeft + (startHexHasRiver ? RIVER_MOVE_BONUS : 0);

  const dist = new Map<string, number>();
  dist.set(startKey, 0);

  // MinHeap implemented as a sorted insertion (small maps, acceptable cost).
  // For correctness we use a proper priority queue via array + re-sort on pop.
  const heap: Entry[] = [[0, unit.q, unit.r]];

  // Simple min-heap helpers (binary heap on cost).
  function heapPush(e: Entry): void {
    heap.push(e);
    // Bubble up
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent]![0] <= heap[i]![0]) break;
      const tmp = heap[parent]!;
      heap[parent] = heap[i]!;
      heap[i] = tmp;
      i = parent;
    }
  }

  function heapPop(): Entry | undefined {
    if (heap.length === 0) return undefined;
    const top = heap[0]!;
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      // Bubble down
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = 2 * i + 2;
        let smallest = i;
        if (l < heap.length && heap[l]![0] < heap[smallest]![0]) smallest = l;
        if (r < heap.length && heap[r]![0] < heap[smallest]![0]) smallest = r;
        if (smallest === i) break;
        const tmp = heap[i]!;
        heap[i] = heap[smallest]!;
        heap[smallest] = tmp;
        i = smallest;
      }
    }
    return top;
  }

  while (heap.length > 0) {
    const entry = heapPop();
    if (!entry) break;
    const [cost, cq, cr] = entry;

    const curKey = keyOf(cq, cr);
    // If we already processed this hex with a lower cost, skip stale entry.
    const bestSoFar = dist.get(curKey);
    if (bestSoFar !== undefined && cost > bestSoFar) continue;

    for (const [dq, dr] of HEX_NEIGHBORS) {
      const nq = cq + dq;
      const nr = cr + dr;
      const nKey = keyOf(nq, nr);

      // Hex must exist in the map.
      if (!(nKey in map.hexes)) continue;

      const hex = map.hexes[nKey]!;
      const movCost = costFn(hex);

      // Impassable hexes are never entered.
      if (movCost === Infinity) continue;

      // Occupied hexes block entry.
      if (occupied.has(nKey)) continue;

      const newCost = cost + movCost;

      // Check if within budget (includes river bonus when applicable).
      if (newCost <= budget) {
        const prevDist = dist.get(nKey);
        if (prevDist === undefined || newCost < prevDist) {
          dist.set(nKey, newCost);
          reachable.add(nKey);
          heapPush([newCost, nq, nr]);
        }
      }
    }
  }

  // MIN-MOVE RULE: if the budget is at least 1 (covers river bonus too),
  // any passable, unoccupied direct neighbor is reachable regardless of cost.
  if (budget >= 1) {
    for (const [dq, dr] of HEX_NEIGHBORS) {
      const nq = unit.q + dq;
      const nr = unit.r + dr;
      const nKey = keyOf(nq, nr);

      if (!(nKey in map.hexes)) continue;

      const hex = map.hexes[nKey]!;
      const movCost = costFn(hex);

      // Passable and unoccupied neighbor is always reachable.
      if (movCost !== Infinity && !occupied.has(nKey)) {
        reachable.add(nKey);
      }
    }
  }

  // Exclude the unit's own starting hex.
  reachable.delete(startKey);

  return reachable;
}

// ---------------------------------------------------------------------------
// computePath
// ---------------------------------------------------------------------------

/**
 * Least-cost path (Dijkstra) from the unit's current hex to (destQ, destR),
 * using terrainMoveCost as the edge weight (cost to enter each hex).
 *
 * Rules:
 *   - Neighbors: pointy-top axial set (HEX_NEIGHBORS).
 *   - A hex is passable iff it exists in map.hexes AND terrainMoveCost is
 *     finite AND is not in occupied -- EXCEPT the destination is always
 *     allowed as the final step regardless of occupied.
 *   - Tracks parent pointers during Dijkstra; reconstructs path on arrival.
 *   - If dest is only reachable via the min-move rule as a direct neighbor,
 *     [dest] is returned.
 *
 * Returns: ordered list of hexes AFTER the start, ending at dest.
 *          i.e. [first-step, ..., dest].  Start hex is NOT included.
 *          Returns [] if dest == start OR dest is unreachable.
 *
 * SEARCH RADIUS CAP: an unreachable dest (different continent, sealed by
 * mountains/sea, etc.) would otherwise make Dijkstra flood every reachable
 * hex before giving up (O(continent size) per call). Neighbors farther from
 * the start than (2x beeline distance to dest + PATH_SEARCH_RADIUS_BUFFER)
 * are pruned from the frontier -- generous enough for realistic detours
 * (coastlines, mountain passes) while bounding worst-case search size
 * regardless of true reachability.
 *
 * Pure function -- no DOM, no THREE, no side effects.
 */
const PATH_SEARCH_RADIUS_BUFFER = 12;

export function computePath(
  unit: RuntimeUnit,
  map: GameMap,
  destQ: number,
  destR: number,
  occupied: Set<string>,
  costFn: (hex: Hex) => number = terrainMoveCost,
): { q: number; r: number }[] {
  const startKey = keyOf(unit.q, unit.r);
  const destKey  = keyOf(destQ, destR);

  // Destination must exist in the map to be reachable.
  if (!(destKey in map.hexes)) return [];

  // Trivial case: already there.
  if (startKey === destKey) return [];

  // Search radius cap (see doc comment above). Destination distance is
  // always <= this bound, so the destination itself is never pruned.
  const maxSearchRadius =
    hexDistance(unit.q, unit.r, destQ, destR) * 2 + PATH_SEARCH_RADIUS_BUFFER;

  // Dijkstra: dist + parent maps.
  // Entry: [accumulatedCost, q, r]
  type Entry = [number, number, number];

  const dist   = new Map<string, number>();
  const parent = new Map<string, string>();

  dist.set(startKey, 0);
  parent.set(startKey, '');

  const heap: Entry[] = [[0, unit.q, unit.r]];

  function heapPush(e: Entry): void {
    heap.push(e);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p]![0] <= heap[i]![0]) break;
      const tmp = heap[p]!;
      heap[p] = heap[i]!;
      heap[i] = tmp;
      i = p;
    }
  }

  function heapPop(): Entry | undefined {
    if (heap.length === 0) return undefined;
    const top = heap[0]!;
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = 2 * i + 2;
        let smallest = i;
        if (l < heap.length && heap[l]![0] < heap[smallest]![0]) smallest = l;
        if (r < heap.length && heap[r]![0] < heap[smallest]![0]) smallest = r;
        if (smallest === i) break;
        const tmp = heap[i]!;
        heap[i] = heap[smallest]!;
        heap[smallest] = tmp;
        i = smallest;
      }
    }
    return top;
  }

  let found = false;

  while (heap.length > 0) {
    const entry = heapPop();
    if (!entry) break;
    const [cost, cq, cr] = entry;

    const curKey = keyOf(cq, cr);

    // Stale entry check.
    const bestSoFar = dist.get(curKey);
    if (bestSoFar !== undefined && cost > bestSoFar) continue;

    // Early exit once destination is settled.
    if (curKey === destKey) {
      found = true;
      break;
    }

    for (const [dq, dr] of HEX_NEIGHBORS) {
      const nq   = cq + dq;
      const nr   = cr + dr;
      const nKey = keyOf(nq, nr);

      // Radius cap: keep the frontier from spilling past a generous
      // multiple of the beeline distance (prevents flooding the whole
      // reachable landmass when dest is on another continent/sealed off).
      if (hexDistance(unit.q, unit.r, nq, nr) > maxSearchRadius) continue;

      // Already settled with optimal cost.
      if (dist.has(nKey) && dist.get(nKey)! <= cost) continue;

      // Hex must exist in the map.
      if (!(nKey in map.hexes)) continue;

      const hex = map.hexes[nKey]!;
      const movCost = costFn(hex);

      if (nKey === destKey) {
        // Destination: always passable as final step.
        // Use its terrain cost but do not block due to occupied.
        const enterCost = movCost === Infinity ? 1 : movCost;
        const newCost = cost + enterCost;
        const prevDist = dist.get(nKey);
        if (prevDist === undefined || newCost < prevDist) {
          dist.set(nKey, newCost);
          parent.set(nKey, curKey);
          heapPush([newCost, nq, nr]);
        }
        continue;
      }

      // Non-destination: impassable terrain and occupied block.
      if (movCost === Infinity) continue;
      if (occupied.has(nKey)) continue;

      const newCost = cost + movCost;
      const prevDist = dist.get(nKey);
      if (prevDist === undefined || newCost < prevDist) {
        dist.set(nKey, newCost);
        parent.set(nKey, curKey);
        heapPush([newCost, nq, nr]);
      }
    }
  }

  // Destination not reached.
  if (!found && !parent.has(destKey)) return [];

  // Reconstruct path by walking parent pointers from dest back to start.
  const path: { q: number; r: number }[] = [];
  let cur = destKey;
  while (cur !== startKey) {
    const parts = cur.split(',');
    path.push({ q: Number(parts[0]), r: Number(parts[1]) });
    const prev = parent.get(cur);
    if (prev === undefined) return []; // broken chain -- unreachable
    cur = prev;
  }
  path.reverse();

  return path;
}

// ---------------------------------------------------------------------------
// pathCost
// ---------------------------------------------------------------------------

/**
 * Returns the total movement cost of a path: the sum of terrainMoveCost for
 * each hex in the path (the entered hexes, not the origin).
 *
 * If a hex key is missing from map.hexes, its cost is treated as 0.
 * Used by the move handler to deduct movement points after a move.
 *
 * @param path  Array of hexes after the start (as returned by computePath).
 * @param map   Game map for hex lookup.
 */
export function pathCost(
  path: { q: number; r: number }[],
  map: GameMap,
  costFn: (hex: Hex) => number = terrainMoveCost,
): number {
  let total = 0;
  for (const { q, r } of path) {
    const key = keyOf(q, r);
    const hex = map.hexes[key];
    if (hex) {
      const c = costFn(hex);
      total += c === Infinity ? 0 : c;
    }
    // missing hex treated as 0 per spec
  }
  return total;
}
