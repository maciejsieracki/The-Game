/**
 * culture-religion.ts
 * City "Kultura" (Culture) + "Religia" (Religion) logic for The Game.
 *
 * Task D3. PURE, deterministic, DOM-free module with its OWN explicit input
 * interfaces -- decoupled exactly like economy.ts (EconomyCity) and siege.ts
 * (SiegeCity / SiegeUnit). It does NOT import any other src/ module: the runtime
 * City (src/game/cities.ts) and the richer types/city.ts are owned/edited by a
 * concurrent session, so we mirror only the fields culture/religion math needs
 * onto local interfaces (CultureCity / ReligionCity) and let callers map their
 * own state on with no glue. Integration into the turn loop is intentionally NOT
 * done here (no wiring into main.ts); the turn loop can call these later.
 *
 * Spec sources / context (read-only references):
 *   - Spec-spoleczenstwo.md SS3 "Kultura": culture accrues each turn (Palac,
 *     Swiatynia, Biblioteka, Amfiteatr, Cuda, Artysta); three cumulative
 *     thresholds expand the city border by +1 hex each; the city's own-culture
 *     share drives a happiness bonus/penalty (100% / >=75% / 50% / <50% / <25%);
 *     conquered tiles convert toward our culture, base + temple/amphitheatre/
 *     library accelerators, capped per turn.
 *   - Spec-spoleczenstwo.md SS4 "Religia": a city's dominant religion is the faith
 *     held by > prog_dominacji (default 50%) of inhabitants; religion spreads to
 *     adjacent cities within a hex radius each turn, faster with a Swiatynia;
 *     temples convert a conquered city toward the owner's religion; no dominant
 *     religion => a small happiness penalty.
 *   - data/society-params.json -> blocks "kultura" and "religia" (data-driven
 *     thresholds + magnitudes; read with safe fallbacks).
 *   - data/civs.json -> cywilizacje[].Cywilizacja, and
 *     society-params.json -> religie_cywilizacji[] maps each civ to its religion
 *     ("Religia / wyznanie"); used to find the owner-civ religion a temple
 *     converts toward.
 *   - data/buildings.json -> "swiatynia" (Swiatynia): kultura + zadowolenie and
 *     (via society-params) culture-conversion + religion-spread/conversion boosts.
 *   - src/game/order.ts (REFERENCE ONLY for the params-loading idiom: per-row
 *     {easy,normal,hard} RawSocietyParam, pick() with finite fallback, frozen
 *     FALLBACK_* constants, load*(society, difficulty)).
 *
 * Determinism: every function is a pure transform of its inputs. Where the spread
 * step needs to pick "which neighbours" deterministically, a tiny seeded LCG is
 * used (mulberry32-style) so the same inputs + seed always yield the same result.
 *
 * Identifiers are ASCII; Polish appears only in comments and in religion/civ
 * string values that must match the JSON data exactly.
 */

// ===========================================================================
// Shared difficulty + raw society-param row shapes (mirror society-params.json)
// ===========================================================================

/** Difficulty key used by every data/*.json param row. */
export type Difficulty = 'easy' | 'normal' | 'hard';

/** One difficulty-scaled parameter row, as stored in society-params.json. */
interface RawSocietyParam {
  easy: number;
  normal: number;
  hard: number;
  jednostka?: string;
  opis?: string;
}

/** "kultura" block of society-params.json (only the keys this module reads). */
interface RawKulturaBlock {
  kultura_prog_zasieg_1?: RawSocietyParam;
  kultura_prog_zasieg_2?: RawSocietyParam;
  kultura_prog_zasieg_3?: RawSocietyParam;
  kultura_zadowolenie_100pct?: RawSocietyParam;
  kultura_zadowolenie_75pct?: RawSocietyParam;
  kultura_zadowolenie_50pct?: RawSocietyParam;
  kultura_kara_zadowolenie_lt50?: RawSocietyParam;
  kultura_kara_zadowolenie_lt25?: RawSocietyParam;
  kultura_konwersja_baza_tura?: RawSocietyParam;
  kultura_konwersja_swiatynia?: RawSocietyParam;
  kultura_konwersja_amfiteatr?: RawSocietyParam;
  kultura_konwersja_biblioteka?: RawSocietyParam;
  kultura_konwersja_cap_tura?: RawSocietyParam;
}

/** "religia" block of society-params.json (only the keys this module reads). */
interface RawReligiaBlock {
  religia_prog_dominacji?: RawSocietyParam;
  religia_szybkosc_szerzenia_bazowa?: RawSocietyParam;
  religia_swiatynia_bonus_szerzenia?: RawSocietyParam;
  religia_szerzenie_max_dystans?: RawSocietyParam;
  religia_zadowolenie_dominujaca?: RawSocietyParam;
  religia_kara_obca?: RawSocietyParam;
  religia_kara_brak_religii?: RawSocietyParam;
  religia_konwersja_bazowa?: RawSocietyParam;
  religia_konwersja_swiatynia?: RawSocietyParam;
}

/** One row of religie_cywilizacji[] (civ -> religion mapping) in society-params.json. */
interface RawReligiaCywilizacjiRow {
  Cywilizacja?: string;
  'Religia / wyznanie'?: string;
  [key: string]: unknown;
}

/** Minimal shape of the society-params.json root that this module reads. */
export interface SocietyParamsLike {
  kultura?: RawKulturaBlock;
  religia?: RawReligiaBlock;
  religie_cywilizacji?: RawReligiaCywilizacjiRow[];
  [key: string]: unknown;
}

/** One row of civs.json cywilizacje[]. */
interface RawCivRow {
  Cywilizacja?: string;
  /** Religion name assigned to this civ (matches society-params religie_cywilizacji). */
  Religia?: string;
  /** Trade -> Money multiplier for this civ (e.g. 2.3 for Greeks). */
  mnoznikHandelPieniadz?: number;
  [key: string]: unknown;
}

/** Minimal shape of civs.json root that this module reads. */
export interface CivsDataLike {
  cywilizacje?: RawCivRow[];
  [key: string]: unknown;
}

/**
 * Read the per-difficulty value of one society param row, falling back to a
 * default when the row (or its value) is missing / non-finite. (Same idiom as
 * order.ts pick().)
 */
function pick(
  row: RawSocietyParam | undefined,
  difficulty: Difficulty,
  fallback: number,
): number {
  if (row === undefined) return fallback;
  const v = row[difficulty];
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

/** Coerce any value to a finite number (NaN/Infinity -> fallback). */
function finiteOr(v: number, fallback = 0): number {
  return Number.isFinite(v) ? v : fallback;
}

/** Clamp x into [lo, hi]. */
function clamp(x: number, lo: number, hi: number): number {
  if (x < lo) return lo;
  if (x > hi) return hi;
  return x;
}

// ===========================================================================
// CULTURE
// ===========================================================================

// ---------------------------------------------------------------------------
// Culture params + fallbacks
// ---------------------------------------------------------------------------

/** Resolved Culture parameters for one difficulty (after loadCultureParams). */
export interface CultureParams {
  /** Cumulative culture needed for border expansion ring 1 (default 100). */
  progZasieg1: number;
  /** Cumulative culture needed for border expansion ring 2 (default 250). */
  progZasieg2: number;
  /** Cumulative culture needed for border expansion ring 3 (default 500). */
  progZasieg3: number;
  /** Happiness bonus when 100% of the city's culture is ours. */
  zadowolenie100: number;
  /** Happiness bonus when >=75% of culture is ours. */
  zadowolenie75: number;
  /** Happiness (neutral) at ~50% own culture. */
  zadowolenie50: number;
  /** Happiness penalty when <50% own culture (negative). */
  karaLt50: number;
  /** Happiness penalty when <25% own culture (negative, larger). */
  karaLt25: number;
  /** Base culture conversion of a conquered city, % per turn. */
  konwersjaBaza: number;
  /** Extra conversion %/turn from a Swiatynia. */
  konwersjaSwiatynia: number;
  /** Extra conversion %/turn from an Amfiteatr. */
  konwersjaAmfiteatr: number;
  /** Extra conversion %/turn from a Biblioteka. */
  konwersjaBiblioteka: number;
  /** Max total conversion %/turn (cap, regardless of building count). */
  konwersjaCapTura: number;
}

/**
 * Sane default Culture params (mirror the "normal" difficulty in the JSON).
 * Border thresholds 100/250/500 are the task-specified fallbacks.
 */
export const FALLBACK_CULTURE_PARAMS: Readonly<CultureParams> = Object.freeze({
  progZasieg1:         100,
  progZasieg2:         250,
  progZasieg3:         500,
  zadowolenie100:      2,
  zadowolenie75:       1,
  zadowolenie50:       0,
  karaLt50:           -1,
  karaLt25:           -2,
  konwersjaBaza:       1,
  konwersjaSwiatynia:  1.5,
  konwersjaAmfiteatr:  1,
  konwersjaBiblioteka: 0.5,
  konwersjaCapTura:    5,
});

/**
 * Resolve CultureParams for a difficulty from a society-params.json object.
 * Reads the top-level "kultura" block; any missing key falls back to the
 * matching FALLBACK_CULTURE_PARAMS value, so a partial / absent block is safe.
 *
 *   import society from '../../data/society-params.json';
 *   const params = loadCultureParams(society, 'normal');
 */
export function loadCultureParams(
  society: SocietyParamsLike | null | undefined,
  difficulty: Difficulty = 'normal',
): CultureParams {
  const k = (society && society.kultura) || {};
  const f = FALLBACK_CULTURE_PARAMS;
  return {
    progZasieg1:         pick(k.kultura_prog_zasieg_1,          difficulty, f.progZasieg1),
    progZasieg2:         pick(k.kultura_prog_zasieg_2,          difficulty, f.progZasieg2),
    progZasieg3:         pick(k.kultura_prog_zasieg_3,          difficulty, f.progZasieg3),
    zadowolenie100:      pick(k.kultura_zadowolenie_100pct,     difficulty, f.zadowolenie100),
    zadowolenie75:       pick(k.kultura_zadowolenie_75pct,      difficulty, f.zadowolenie75),
    zadowolenie50:       pick(k.kultura_zadowolenie_50pct,      difficulty, f.zadowolenie50),
    karaLt50:            pick(k.kultura_kara_zadowolenie_lt50,  difficulty, f.karaLt50),
    karaLt25:            pick(k.kultura_kara_zadowolenie_lt25,  difficulty, f.karaLt25),
    konwersjaBaza:       pick(k.kultura_konwersja_baza_tura,    difficulty, f.konwersjaBaza),
    konwersjaSwiatynia:  pick(k.kultura_konwersja_swiatynia,    difficulty, f.konwersjaSwiatynia),
    konwersjaAmfiteatr:  pick(k.kultura_konwersja_amfiteatr,    difficulty, f.konwersjaAmfiteatr),
    konwersjaBiblioteka: pick(k.kultura_konwersja_biblioteka,   difficulty, f.konwersjaBiblioteka),
    konwersjaCapTura:    pick(k.kultura_konwersja_cap_tura,     difficulty, f.konwersjaCapTura),
  };
}

/**
 * The three cumulative culture thresholds as a sorted ascending array,
 * e.g. [100, 250, 500]. Convenience for callers / UI.
 */
export function cultureThresholds(
  params: CultureParams = FALLBACK_CULTURE_PARAMS,
): [number, number, number] {
  return [params.progZasieg1, params.progZasieg2, params.progZasieg3];
}

// ---------------------------------------------------------------------------
// Culture city input shape (decoupled, like EconomyCity / SiegeCity)
// ---------------------------------------------------------------------------

/**
 * Culture-relevant city state. The runtime City is sparse; we take only what
 * culture math needs. Callers map their own City onto this.
 */
export interface CultureCity {
  /** City id (for caller bookkeeping; not used by the math). */
  id?: string;
  /** Total accumulated culture for this city (>= 0). */
  kulturaSkumulowana: number;
  /**
   * Share of the city's culture that is OURS (the owner's), in [0,1].
   * 1 = full cultural unity; < 0.5 = a foreign culture dominates. Optional;
   * defaults to 1 (a normally-grown city is 100% our culture).
   */
  ownCultureShare?: number;
}

// ---------------------------------------------------------------------------
// cityBorderRadius / accumulateCulture
// ---------------------------------------------------------------------------

/**
 * Border expansion ring level earned by a given accumulated culture.
 *
 *   culture <  prog1        -> 0  (base territory, no expansion yet)
 *   prog1 <= culture < prog2 -> 1
 *   prog2 <= culture < prog3 -> 2
 *   culture >= prog3        -> 3  (max, three expansions)
 *
 * This is the NUMBER OF EXTRA RINGS (+hexes) the culture has unlocked, per
 * Spec SS3 "Ekspansja granic" (three thresholds, automatic). The caller adds it
 * to the city's base territory radius. Pure, deterministic, NaN-safe.
 *
 * @param culturePoints - accumulated culture (City.kulturaSkumulowana).
 * @param params        - CultureParams (defaults to fallbacks 100/250/500).
 * @returns 0 | 1 | 2 | 3
 */
export function cityBorderRadius(
  culturePoints: number,
  params: CultureParams = FALLBACK_CULTURE_PARAMS,
): 0 | 1 | 2 | 3 {
  const c = finiteOr(culturePoints, 0);
  if (c >= params.progZasieg3) return 3;
  if (c >= params.progZasieg2) return 2;
  if (c >= params.progZasieg1) return 1;
  return 0;
}

/** Result of accumulating culture for one turn. */
export interface CultureAccrualResult {
  /** New accumulated culture total. */
  kulturaSkumulowana: number;
  /** Border ring level BEFORE this turn's accrual. */
  poprzedniZasieg: 0 | 1 | 2 | 3;
  /** Border ring level AFTER this turn's accrual. */
  nowyZasieg: 0 | 1 | 2 | 3;
  /** True when this turn's accrual crossed a threshold (border expanded). */
  granicaRozszerzona: boolean;
}

/**
 * Add this turn's culture to a city and report whether a border threshold was
 * crossed. Does NOT mutate the input city (returns a result the caller applies).
 *
 * @param city    - CultureCity (uses kulturaSkumulowana).
 * @param perTurn - culture produced this turn (>= 0; negative treated as 0).
 * @param params  - CultureParams (defaults to fallbacks).
 */
export function accumulateCulture(
  city: CultureCity,
  perTurn: number,
  params: CultureParams = FALLBACK_CULTURE_PARAMS,
): CultureAccrualResult {
  const before = Math.max(0, finiteOr(city.kulturaSkumulowana, 0));
  const gain = Math.max(0, finiteOr(perTurn, 0));
  const after = before + gain;
  const poprzedniZasieg = cityBorderRadius(before, params);
  const nowyZasieg = cityBorderRadius(after, params);
  return {
    kulturaSkumulowana: after,
    poprzedniZasieg,
    nowyZasieg,
    granicaRozszerzona: nowyZasieg > poprzedniZasieg,
  };
}

// ---------------------------------------------------------------------------
// cultureHappiness (culture's contribution to happiness / order)
// ---------------------------------------------------------------------------

/**
 * Culture's contribution to the city's happiness (Zadowolenie), which in turn
 * feeds Order (Porzadek) via order.ts. Driven by the share of OUR culture in the
 * city (Spec SS3 "Wplyw kultury na zadowolenie"):
 *
 *   share == 1.0  -> zadowolenie100   (full unity)
 *   share >= 0.75 -> zadowolenie75
 *   share >= 0.50 -> zadowolenie50    (neutral)
 *   share <  0.50 -> karaLt50         (foreign culture dominates; penalty)
 *   share <  0.25 -> karaLt25         (heavy foreign dominance; bigger penalty)
 *
 * Returns a small signed bonus (positive = happier, negative = unrest). Pure,
 * deterministic, NaN-safe (share clamped to [0,1]; default share = 1).
 *
 * @param city   - CultureCity (uses ownCultureShare; defaults to 1).
 * @param params - CultureParams.
 * @returns signed happiness bonus (point scale).
 */
export function cultureHappiness(
  city: CultureCity,
  params: CultureParams = FALLBACK_CULTURE_PARAMS,
): number {
  const share = clamp(finiteOr(city.ownCultureShare ?? 1, 1), 0, 1);
  if (share < 0.25) return params.karaLt25;
  if (share < 0.5) return params.karaLt50;
  if (share >= 1) return params.zadowolenie100;
  if (share >= 0.75) return params.zadowolenie75;
  return params.zadowolenie50; // 0.50 <= share < 0.75
}

// ---------------------------------------------------------------------------
// convertCulture (conquered-tile cultural conversion, per turn)
// ---------------------------------------------------------------------------

/** Which culture-accelerating buildings a city has (for conversion speed). */
export interface CultureBuildings {
  hasSwiatynia?: boolean;
  hasAmfiteatr?: boolean;
  hasBiblioteka?: boolean;
}

/** Result of one turn of cultural conversion toward our culture. */
export interface CultureConversionResult {
  /** New own-culture share in [0,1] after this turn. */
  ownCultureShare: number;
  /** The per-turn rate actually applied (after cap), as a fraction [0,1]. */
  appliedRate: number;
  /** True once the city is fully converted (share >= 1). */
  fullyConverted: boolean;
}

/**
 * Advance the cultural conversion of a (typically conquered) city by one turn,
 * moving its own-culture share toward 100% (Spec SS3 "Konwersja kulturowa").
 *
 * Rate = base + temple + amphitheatre + library accelerators, summed then capped
 * by konwersjaCapTura. Params store the rates as PERCENT/turn (e.g. 1 == 1%),
 * so they are divided by 100 to step the [0,1] share.
 *
 * @param city      - CultureCity (uses ownCultureShare; defaults to 0 for a
 *                    freshly conquered city with none of our culture).
 * @param buildings - culture buildings present (each adds its accelerator).
 * @param params    - CultureParams.
 */
export function convertCulture(
  city: CultureCity,
  buildings: CultureBuildings,
  params: CultureParams = FALLBACK_CULTURE_PARAMS,
): CultureConversionResult {
  const share = clamp(finiteOr(city.ownCultureShare ?? 0, 0), 0, 1);
  let ratePct = params.konwersjaBaza;
  if (buildings.hasSwiatynia) ratePct += params.konwersjaSwiatynia;
  if (buildings.hasAmfiteatr) ratePct += params.konwersjaAmfiteatr;
  if (buildings.hasBiblioteka) ratePct += params.konwersjaBiblioteka;
  ratePct = clamp(ratePct, 0, params.konwersjaCapTura);
  const appliedRate = ratePct / 100;
  const next = clamp(share + appliedRate, 0, 1);
  return {
    ownCultureShare: next,
    appliedRate,
    fullyConverted: next >= 1,
  };
}

// ===========================================================================
// RELIGION
// ===========================================================================

// ---------------------------------------------------------------------------
// Religion params + fallbacks
// ---------------------------------------------------------------------------

/** Resolved Religion parameters for one difficulty (after loadReligionParams). */
export interface ReligionParams {
  /** Dominance threshold as a PERCENT (default 50 => > 50% is dominant). */
  progDominacjiPct: number;
  /** Base number of adjacent cities reached per turn (no temple). */
  szybkoscSzerzeniaBazowa: number;
  /** Extra adjacent cities reached per turn from a Swiatynia. */
  swiatyniaBonusSzerzenia: number;
  /** Max spread distance in hexes without missionary buildings. */
  szerzenieMaxDystans: number;
  /** Happiness bonus when our religion dominates the city. */
  zadowolenieDominujaca: number;
  /** Happiness penalty when a FOREIGN religion dominates (negative). */
  karaObca: number;
  /** Happiness penalty when NO religion dominates (negative, small). */
  karaBrakReligii: number;
  /** Base religious conversion of a conquered city, % per turn. */
  konwersjaBazaPct: number;
  /** Extra conversion %/turn from a Swiatynia in the converted city. */
  konwersjaSwiatyniaPct: number;
}

/** Sane default Religion params (mirror the "normal" difficulty in the JSON). */
export const FALLBACK_RELIGION_PARAMS: Readonly<ReligionParams> = Object.freeze({
  progDominacjiPct:        50,
  szybkoscSzerzeniaBazowa: 1,
  swiatyniaBonusSzerzenia: 1,
  szerzenieMaxDystans:     3,
  zadowolenieDominujaca:   2,
  karaObca:               -2,
  karaBrakReligii:        -1,
  konwersjaBazaPct:        2,
  konwersjaSwiatyniaPct:   2,
});

/**
 * Resolve ReligionParams for a difficulty from a society-params.json object.
 * Reads the top-level "religia" block; any missing key falls back to the
 * matching FALLBACK_RELIGION_PARAMS value, so a partial / absent block is safe.
 */
export function loadReligionParams(
  society: SocietyParamsLike | null | undefined,
  difficulty: Difficulty = 'normal',
): ReligionParams {
  const r = (society && society.religia) || {};
  const f = FALLBACK_RELIGION_PARAMS;
  return {
    progDominacjiPct:        pick(r.religia_prog_dominacji,             difficulty, f.progDominacjiPct),
    szybkoscSzerzeniaBazowa: pick(r.religia_szybkosc_szerzenia_bazowa,  difficulty, f.szybkoscSzerzeniaBazowa),
    swiatyniaBonusSzerzenia: pick(r.religia_swiatynia_bonus_szerzenia,  difficulty, f.swiatyniaBonusSzerzenia),
    szerzenieMaxDystans:     pick(r.religia_szerzenie_max_dystans,      difficulty, f.szerzenieMaxDystans),
    zadowolenieDominujaca:   pick(r.religia_zadowolenie_dominujaca,     difficulty, f.zadowolenieDominujaca),
    karaObca:                pick(r.religia_kara_obca,                  difficulty, f.karaObca),
    karaBrakReligii:         pick(r.religia_kara_brak_religii,          difficulty, f.karaBrakReligii),
    konwersjaBazaPct:        pick(r.religia_konwersja_bazowa,           difficulty, f.konwersjaBazaPct),
    konwersjaSwiatyniaPct:   pick(r.religia_konwersja_swiatynia,        difficulty, f.konwersjaSwiatyniaPct),
  };
}

// ---------------------------------------------------------------------------
// Civ -> religion lookup (society-params.json religie_cywilizacji + civs.json)
// ---------------------------------------------------------------------------

/**
 * Religion ("Religia / wyznanie") assigned to a civilization. Reads the
 * society-params.json "religie_cywilizacji" table (which carries the religion
 * names) keyed by the civ name as used in civs.json cywilizacje[].Cywilizacja.
 *
 * @param civName - e.g. "Grecy", "Rzymianie".
 * @param society - parsed society-params.json (or any object with the table).
 * @returns the religion name (e.g. "Politeizm olimpijski") or null if unknown.
 */
export function civReligion(
  civName: string | null | undefined,
  society: SocietyParamsLike | null | undefined,
): string | null {
  if (!civName) return null;
  const table = (society && society.religie_cywilizacji) || [];
  for (const row of table) {
    if (row && row.Cywilizacja === civName) {
      const rel = row['Religia / wyznanie'];
      return typeof rel === 'string' && rel.length > 0 ? rel : null;
    }
  }
  return null;
}

/**
 * Validate that a civ name exists in civs.json cywilizacje[]. Useful so callers
 * can confirm the owner civ before looking its religion up. Pure.
 */
export function isKnownCiv(
  civName: string | null | undefined,
  civs: CivsDataLike | null | undefined,
): boolean {
  if (!civName) return false;
  const list = (civs && civs.cywilizacje) || [];
  return list.some((c) => c && c.Cywilizacja === civName);
}

// ---------------------------------------------------------------------------
// ReligionState + dominantReligion
// ---------------------------------------------------------------------------

/**
 * Per-city religion composition. `counts` maps a religion name -> number of
 * adherents (need not equal population; the helpers normalise on the total).
 * A city with an empty `counts` has no religion.
 */
export interface ReligionState {
  /** religion name -> adherent count (>= 0). */
  counts: Record<string, number>;
}

/** Result describing the dominant religion of a city. */
export interface DominantReligionResult {
  /** Dominant religion name, or null when none exceeds the threshold. */
  religion: string | null;
  /** Share [0,1] of the leading religion (0 when the city has no adherents). */
  share: number;
  /**
   * Classification:
   *   'dominant' - one religion > prog_dominacji,
   *   'mixed'    - adherents exist but none is dominant,
   *   'none'     - no adherents at all.
   */
  status: 'dominant' | 'mixed' | 'none';
}

/** Sum of all adherent counts in a ReligionState (finite, >= 0). */
function totalAdherents(state: ReligionState): number {
  let sum = 0;
  for (const k in state.counts) {
    const v = state.counts[k];
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) sum += v;
  }
  return sum;
}

/**
 * The leading religion + its share, scanning deterministically (sorted by name
 * to break ties stably). Pure.
 */
function leadingReligion(state: ReligionState): { name: string | null; count: number; total: number } {
  const total = totalAdherents(state);
  if (total <= 0) return { name: null, count: 0, total: 0 };
  let bestName: string | null = null;
  let bestCount = -1;
  for (const k of Object.keys(state.counts).sort()) {
    const v = state.counts[k];
    const c = typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0;
    if (c > bestCount) {
      bestCount = c;
      bestName = k;
    }
  }
  return { name: bestName, count: Math.max(0, bestCount), total };
}

/**
 * Determine a city's dominant religion: the faith whose share exceeds the
 * dominance threshold (Spec SS4, default > 50%). Returns null + 'mixed' when
 * adherents exist but the leader is below the threshold, and null + 'none' when
 * the city has no adherents. Pure, deterministic.
 *
 * @param state  - ReligionState (counts per religion).
 * @param params - ReligionParams (progDominacjiPct, default 50).
 */
export function dominantReligion(
  state: ReligionState,
  params: ReligionParams = FALLBACK_RELIGION_PARAMS,
): DominantReligionResult {
  const { name, count, total } = leadingReligion(state);
  if (total <= 0 || name === null) {
    return { religion: null, share: 0, status: 'none' };
  }
  const share = count / total;
  const threshold = clamp(params.progDominacjiPct, 0, 100) / 100;
  if (share > threshold) {
    return { religion: name, share, status: 'dominant' };
  }
  return { religion: null, share, status: 'mixed' };
}

// ---------------------------------------------------------------------------
// religionHappiness (religion's contribution to happiness / order)
// ---------------------------------------------------------------------------

/**
 * Religion's contribution to the city's happiness (which feeds Order), per
 * Spec SS4 "Bonusy za religie dominujaca" / "Kary za obca religie":
 *
 *   our religion dominates       -> +zadowolenieDominujaca
 *   a foreign religion dominates  -> +karaObca           (negative)
 *   no dominant religion          -> +karaBrakReligii    (negative, small)
 *
 * @param state       - ReligionState for the city.
 * @param ownReligion - the owner civ's religion (from civReligion()); may be null.
 * @param params      - ReligionParams.
 * @returns signed happiness bonus (point scale).
 */
export function religionHappiness(
  state: ReligionState,
  ownReligion: string | null,
  params: ReligionParams = FALLBACK_RELIGION_PARAMS,
): number {
  const dom = dominantReligion(state, params);
  if (dom.status === 'none' || dom.status === 'mixed') return params.karaBrakReligii;
  // dominant:
  if (ownReligion !== null && dom.religion === ownReligion) return params.zadowolenieDominujaca;
  return params.karaObca; // a (foreign) religion dominates
}

// ---------------------------------------------------------------------------
// Deterministic RNG (mulberry32) for the spread step
// ---------------------------------------------------------------------------

/** A deterministic [0,1) generator from a 32-bit seed (mulberry32). */
export function makeRng(seed: number): () => number {
  let a = (finiteOr(seed, 0) >>> 0) || 1;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// spreadReligion (pressure to adjacent cities)
// ---------------------------------------------------------------------------

/** A neighbouring city that can receive religious pressure. */
export interface ReligionNeighbor {
  /** Neighbour city id. */
  id: string;
  /** Hex distance from the source city (>= 1). */
  distance: number;
  /** Current religion composition of the neighbour. */
  state: ReligionState;
  /** Neighbour population (caps how many adherents can be added). Optional. */
  population?: number;
}

/** A single spread event applied to one neighbour. */
export interface ReligionSpreadEvent {
  /** Neighbour id that received pressure. */
  id: string;
  /** Religion that spread into it. */
  religion: string;
  /** Adherents added this turn (>= 0). */
  added: number;
  /** Neighbour's new ReligionState after the pressure. */
  state: ReligionState;
}

/** Result of one turn of religious spread from a source city. */
export interface ReligionSpreadResult {
  /** Per-neighbour events that actually received pressure. */
  events: ReligionSpreadEvent[];
  /** How many neighbours were reached this turn (events.length). */
  reached: number;
}

/**
 * Spread the SOURCE city's dominant religion to adjacent cities for one turn
 * (Spec SS4 "Dominacja i szerzenie sie religii").
 *
 * Rules:
 *   - Only a city with a dominant religion spreads (the religion that dominates).
 *   - Eligible neighbours are those within szerzenieMaxDystans hexes.
 *   - The number reached this turn = base + (temple ? swiatyniaBonus : 0), but
 *     never more than the eligible neighbour count. Nearest neighbours are
 *     prioritised; ties are broken deterministically (by id, then by a seeded
 *     RNG so the choice among equals is stable and reproducible).
 *   - Each reached neighbour gains `pressure` adherents of the source religion
 *     (1 per turn by default, capped so it never exceeds the neighbour's
 *     population when population is given).
 *
 * Does NOT mutate inputs: each event carries a fresh neighbour state.
 *
 * @param source        - { dominant religion of the source } -- pass the source
 *                        city's ReligionState; its dominant faith is what spreads.
 * @param neighbors     - candidate adjacent cities (with distances).
 * @param params        - ReligionParams.
 * @param opts          - { hasSwiatynia, pressure, seed } tuning knobs.
 */
export function spreadReligion(
  source: ReligionState,
  neighbors: ReligionNeighbor[],
  params: ReligionParams = FALLBACK_RELIGION_PARAMS,
  opts: { hasSwiatynia?: boolean; pressure?: number; seed?: number } = {},
): ReligionSpreadResult {
  const dom = dominantReligion(source, params);
  if (dom.status !== 'dominant' || dom.religion === null) {
    return { events: [], reached: 0 };
  }
  const religion = dom.religion;
  const maxDist = params.szerzenieMaxDystans;
  const pressure = Math.max(0, finiteOr(opts.pressure ?? 1, 1));

  // Eligible neighbours within range.
  const eligible = neighbors.filter(
    (n) => n && Number.isFinite(n.distance) && n.distance >= 1 && n.distance <= maxDist,
  );

  // How many can we reach this turn?
  let slots = params.szybkoscSzerzeniaBazowa + (opts.hasSwiatynia ? params.swiatyniaBonusSzerzenia : 0);
  slots = Math.max(0, Math.floor(finiteOr(slots, 0)));
  if (slots > eligible.length) slots = eligible.length;

  // Deterministic ordering: nearest first, then by id, then a stable seeded
  // jitter so equal candidates resolve reproducibly.
  const rng = makeRng((opts.seed ?? 0) >>> 0);
  const jitter = new Map<string, number>();
  for (const n of eligible) jitter.set(n.id, rng());
  const ordered = eligible.slice().sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    if (a.id !== b.id) return a.id < b.id ? -1 : 1;
    return (jitter.get(a.id) ?? 0) - (jitter.get(b.id) ?? 0);
  });

  const events: ReligionSpreadEvent[] = [];
  for (let i = 0; i < slots; i++) {
    const n = ordered[i];
    if (!n) break;
    const current = (n.state && n.state.counts && n.state.counts[religion]) || 0;
    let added = pressure;
    if (typeof n.population === 'number' && Number.isFinite(n.population)) {
      const room = Math.max(0, n.population - totalAdherents(n.state));
      // allow growth at least up to room; if the religion already present,
      // still cap total adherents by population.
      added = Math.min(added, Math.max(0, room));
    }
    const nextCounts: Record<string, number> = { ...n.state.counts, [religion]: current + added };
    events.push({ id: n.id, religion, added, state: { counts: nextCounts } });
  }

  return { events, reached: events.length };
}

// ---------------------------------------------------------------------------
// convertViaTemple (temple-driven religious conversion toward owner religion)
// ---------------------------------------------------------------------------

/** Result of one turn of religious conversion in a city. */
export interface ReligionConversionResult {
  /** New ReligionState after this turn's conversion. */
  state: ReligionState;
  /** Adherents converted to the target religion this turn (>= 0). */
  converted: number;
  /** Effective conversion rate applied this turn, as a fraction [0,1]. */
  appliedRate: number;
  /** Target religion adherents' share [0,1] after conversion. */
  targetShare: number;
  /** True once the target religion holds the whole city. */
  fullyConverted: boolean;
}

/**
 * Convert a city's population toward the owner civ's religion for one turn
 * (Spec SS4 "Konwersja religijna podbitych miast"). A Swiatynia speeds it up, so
 * a temple converts strictly faster than no temple (when there is anyone left to
 * convert).
 *
 * Mechanics:
 *   - rate%/turn = konwersjaBazaPct + (hasTemple ? konwersjaSwiatyniaPct : 0).
 *   - The number converted = round(rate/100 * convertibleAdherents), at least 1
 *     when a fractional amount rounds to 0 but some non-target adherents remain
 *     (so progress never stalls), but never more than the convertible pool.
 *   - Converted adherents are moved FROM other religions (largest first,
 *     deterministically) TO the target religion.
 *
 * Pure; returns a fresh state.
 *
 * @param state          - the city's ReligionState.
 * @param targetReligion - the owner civ's religion to convert toward (from
 *                         civReligion()); if null/empty, nothing happens.
 * @param hasTemple      - whether the city has a Swiatynia (speeds conversion).
 * @param params         - ReligionParams.
 */
export function convertViaTemple(
  state: ReligionState,
  targetReligion: string | null,
  hasTemple: boolean,
  params: ReligionParams = FALLBACK_RELIGION_PARAMS,
): ReligionConversionResult {
  const total = totalAdherents(state);
  const cloneCounts: Record<string, number> = {};
  for (const k in state.counts) {
    const v = state.counts[k];
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) cloneCounts[k] = v;
  }

  const ratePct = Math.max(
    0,
    params.konwersjaBazaPct + (hasTemple ? params.konwersjaSwiatyniaPct : 0),
  );
  const appliedRate = ratePct / 100;

  // Nothing to do: no target, no people, or already fully target.
  const targetCount = (targetReligion && cloneCounts[targetReligion]) || 0;
  const convertible = total - targetCount; // adherents of OTHER religions
  if (!targetReligion || total <= 0 || convertible <= 0) {
    const share = total > 0 ? targetCount / total : 0;
    return {
      state: { counts: cloneCounts },
      converted: 0,
      appliedRate,
      targetShare: share,
      fullyConverted: total > 0 && convertible <= 0,
    };
  }

  // How many to convert this turn.
  let toConvert = Math.round(appliedRate * convertible);
  if (toConvert <= 0 && appliedRate > 0) toConvert = 1; // never stall
  toConvert = Math.min(toConvert, convertible);

  // Pull converts from the largest non-target religions first (deterministic).
  let remaining = toConvert;
  const donors = Object.keys(cloneCounts)
    .filter((k) => k !== targetReligion && cloneCounts[k]! > 0)
    .sort((a, b) => {
      const dv = (cloneCounts[b]! - cloneCounts[a]!);
      if (dv !== 0) return dv;
      return a < b ? -1 : 1; // stable tie-break by name
    });
  for (const k of donors) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, cloneCounts[k]!);
    cloneCounts[k]! -= take;
    if (cloneCounts[k]! <= 0) delete cloneCounts[k];
    remaining -= take;
  }
  const actuallyConverted = toConvert - remaining;
  cloneCounts[targetReligion] = targetCount + actuallyConverted;

  const newTotal = totalAdherents({ counts: cloneCounts });
  const newTargetCount = cloneCounts[targetReligion] || 0;
  const targetShare = newTotal > 0 ? newTargetCount / newTotal : 0;
  return {
    state: { counts: cloneCounts },
    converted: actuallyConverted,
    appliedRate,
    targetShare,
    fullyConverted: targetShare >= 1,
  };
}

// ===========================================================================
// TRADE MULTIPLIER FROM RELIGION (per-city)
// ===========================================================================

/**
 * Result of cityTradeMultiplier: the religion-sourced trade/money multiplier
 * for a city, plus diagnostic fields for the caller.
 */
export interface TradeMultResult {
  /**
   * The effective trade multiplier this city earns from religion.
   *   > 1  when the owner civ's religion dominates and the gate is open.
   *   = 1  in all other cases (no bonus -- neutral baseline).
   */
  multiplier: number;
  /**
   * The raw mnoznikHandelPieniadz value from civs.json for the owner civ
   * (regardless of the gate or dominant-religion check). Useful for UI display.
   * null when the owner civ is not found in civs.json or the field is missing.
   */
  civBaseMultiplier: number | null;
  /**
   * Which religion is currently dominant in the city (or null when none).
   * Matches the dominant-religion check result.
   */
  dominantReligion: string | null;
  /**
   * Whether the religion multiplier was actually applied (gate open AND
   * dominant religion matches the owner civ's religion).
   */
  applied: boolean;
}

/**
 * Compute the per-city trade/money multiplier that comes from religion dominance.
 *
 * Mechanics (per CYWILIZACJE-do-MASTER_mnoznik-handel-pole.md + EKONOMIA.md):
 *   - Each civ has a mnoznikHandelPieniadz in civs.json (e.g. Grecy = 2.3).
 *   - The multiplier applies to a CITY only when:
 *       (a) the gate is open (caller passes gated = true -- represents
 *           Waluta + Mennica tech/building requirement; gate logic lives in
 *           the turn loop, NOT here), AND
 *       (b) the city's dominant religion is the OWNER civ's religion.
 *   - Otherwise the function returns multiplier = 1 (no change).
 *
 * Pure, deterministic, no side effects. Reads civs.json via CivsDataLike.
 * Missing JSON keys fall back gracefully (null / 1.0).
 *
 * MISSING PARAMS NOTE: society-params.json has no dedicated
 * "religia_mnoznik_handel_*" row -- the per-civ values live in civs.json
 * (mnoznikHandelPieniadz). If that field is absent for a civ the multiplier
 * falls back to FALLBACK_TRADE_MULT (1.0 -- neutral, no bonus, no penalty).
 *
 * @param cityReligion - current ReligionState of the city.
 * @param ownerCivName - name of the city owner's civilization (e.g. "Grecy").
 * @param civs         - parsed civs.json (or any CivsDataLike).
 * @param religionParams - ReligionParams (for dominance threshold).
 * @param gated        - true when Waluta+Mennica requirement is satisfied;
 *                       false (default) -> multiplier = 1 even if religion matches.
 * @returns TradeMultResult
 */
export const FALLBACK_TRADE_MULT = 1;

export function cityTradeMultiplier(
  cityReligion: ReligionState,
  ownerCivName: string | null | undefined,
  civs: CivsDataLike | null | undefined,
  religionParams: ReligionParams = FALLBACK_RELIGION_PARAMS,
  gated = false,
): TradeMultResult {
  // Find the owner civ row in civs.json.
  const civList = (civs && civs.cywilizacje) || [];
  let civRow: RawCivRow | null = null;
  if (ownerCivName) {
    for (const row of civList) {
      if (row && row.Cywilizacja === ownerCivName) { civRow = row; break; }
    }
  }

  // Read the raw civ-level trade multiplier (mnoznikHandelPieniadz).
  let civBaseMultiplier: number | null = null;
  if (civRow !== null) {
    const v = civRow.mnoznikHandelPieniadz;
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
      civBaseMultiplier = v;
    }
  }

  // Determine the city's dominant religion.
  const dom = dominantReligion(cityReligion, religionParams);
  const domReligion = dom.status === 'dominant' ? dom.religion : null;

  // Owner civ's religion (from civs.json row, falling back to null).
  let ownerReligion: string | null = null;
  if (civRow !== null) {
    const r = civRow.Religia;
    if (typeof r === 'string' && r.length > 0) ownerReligion = r;
  }

  // Apply only when gate is open AND dominant religion == owner civ religion.
  const religionMatches =
    domReligion !== null &&
    ownerReligion !== null &&
    domReligion === ownerReligion;

  const applied = gated && religionMatches && civBaseMultiplier !== null;
  const multiplier = applied ? (civBaseMultiplier as number) : FALLBACK_TRADE_MULT;

  return { multiplier, civBaseMultiplier, dominantReligion: domReligion, applied };
}
