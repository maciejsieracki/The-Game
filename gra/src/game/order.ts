/**
 * order.ts
 * City "Porządek" (Order) logic for The Game — pure module, no DOM, no THREE,
 * no imports from other src/ modules. Self-contained for later turn-loop
 * integration (NOT wired into main.ts here).
 *
 * Spec sources / context:
 *   - User spec (task D4): "Porządek = Szczęście + Prawo, progi T1/T2."
 *   - PROJEKT-GRY-master.md (society/stability concept).
 *   - Spec-spoleczenstwo.md §2 (Szczęście / Zadowolenie).
 *   - gra/data/society-params.json  (data-driven thresholds + effect magnitudes;
 *     this module reads a new top-level "porzadek" object, with fallbacks).
 *   - gra/src/game/economy.ts  (REFERENCE ONLY — how Szczęście/Zadowolenie is
 *     represented: net "zadowolenie" points per turn; difficulty keys
 *     easy/normal/hard; the generosity convention easy>normal>hard for bonuses).
 *
 * ───────────────────────────────────────────────────────────────────────────
 * NAMING RECONCILIATION (important — read before editing the formula)
 * ───────────────────────────────────────────────────────────────────────────
 * The current data/spec vocabulary is:
 *   - "Szczęście" (Happiness)  → the existing happiness metric. In the data its
 *     points are called "Zadowolenie" (contentment). economy.ts exposes a
 *     per-turn `zadowolenie` yield. We treat this as the Happiness input.
 *   - "Zadowolenie"            → the contentment points that make up Szczęście.
 *
 * The master design later renamed two concepts:
 *   - Zadowolenie → Porządek   (the contentment/stability composite is now the
 *     formal "Porządek" = Order — which is exactly what this module DERIVES).
 *   - Porządek    → Prawo      (the former governance-order concept is now the
 *     formal "Prawo" = Law — a civic/governance input fed by government, courts,
 *     etc. There is no such field in the current data yet; the turn loop will
 *     supply it later. Until then callers may pass prawo = 0).
 *
 * Reconciled model used here (documented so the rename is unambiguous):
 *   Porządek (Order, OUTPUT)  = f( Szczęście (Happiness, INPUT),
 *                                  Prawo     (Law,       INPUT) )
 *
 *   - `szczescie` (input)  : net Happiness points for the city this turn
 *                            (e.g. economy.ts `zadowolenie`; may be negative).
 *   - `prawo`     (input)  : net Law points for the city this turn (governance /
 *                            courts / stability infrastructure; may be negative;
 *                            pass 0 until the Law subsystem exists).
 *   - Order       (output) : a single stability index on the same point scale.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * FORMULA (simple, clear, deterministic)
 * ───────────────────────────────────────────────────────────────────────────
 *   Order = round( wSzczescie * szczescie + wPrawo * prawo )
 *
 *   with default weights wSzczescie = wPrawo = 0.5, so by default
 *   Order is the average of Happiness and Law (their balanced sum). Weights are
 *   data-driven (porzadek_waga_szczescie / porzadek_waga_prawo) so designers can
 *   tilt the balance without code changes. The result is rounded to an integer
 *   point value (Math.round, deterministic for finite inputs).
 *
 * ───────────────────────────────────────────────────────────────────────────
 * THRESHOLDS T1 / T2 and TIER EFFECTS
 * ───────────────────────────────────────────────────────────────────────────
 *   tier:
 *     Order <  T1            → 'unrest'  (unrest / revolt risk)
 *     T1 <= Order <  T2      → 'neutral' (no modifiers)
 *     Order >= T2            → 'order'   (stability bonus)
 *
 *   effects (multipliers are applied by the caller to production / growth /
 *   trade; revoltRisk is a per-turn probability in [0,1] the caller may roll):
 *     'unrest'  : productionMult < 1, growthMult < 1, tradeMult = 1,
 *                 revoltRisk > 0
 *     'neutral' : productionMult = 1, growthMult = 1, tradeMult = 1,
 *                 revoltRisk = 0
 *     'order'   : productionMult > 1, growthMult = 1, tradeMult > 1,
 *                 revoltRisk = 0
 *
 *   All magnitudes (T1, T2, the unrest penalties + revolt risk, the order
 *   bonuses) are data-driven from society-params.json "porzadek" with the
 *   FALLBACK_* constants below as sane defaults when a key is absent.
 *
 * Difficulty convention follows the rest of society-params.json: "easy" is the
 * most generous to the player (lower unrest threshold, lower penalties + risk,
 * easier-to-reach order bonus that is also slightly larger); "hard" is the
 * harshest.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type Difficulty = 'easy' | 'normal' | 'hard';

/** Order tier classification by the T1/T2 thresholds. */
export type OrderTier = 'unrest' | 'neutral' | 'order';

/**
 * Inputs to the Order computation for a single city this turn.
 * Self-contained: this module does NOT import the City/economy types — the
 * caller maps its own state onto these two point-scale fields.
 */
export interface OrderInputs {
  /** Net Happiness ("Szczęście" / "Zadowolenie") points; may be negative. */
  szczescie: number;
  /** Net Law ("Prawo") points; may be negative. Pass 0 if no Law subsystem. */
  prawo: number;
}

/** Resolved Order parameters for one difficulty (after loadOrderParams). */
export interface OrderParams {
  /** Weight applied to Szczęście in the Order sum. */
  wagaSzczescie: number;
  /** Weight applied to Prawo in the Order sum. */
  wagaPrawo: number;
  /** T1: below this Order value the city is in 'unrest'. */
  progT1: number;
  /** T2: at/above this Order value the city gains the 'order' bonus. */
  progT2: number;
  /** Unrest production penalty as a fraction (negative, e.g. -0.15). */
  karaProdukcjaT1: number;
  /** Unrest growth penalty as a fraction (negative, e.g. -0.25). */
  karaWzrostT1: number;
  /** Unrest revolt risk per turn as a probability in [0,1] (e.g. 0.10). */
  ryzykoBuntuT1: number;
  /** Order production bonus as a fraction (positive, e.g. 0.10). */
  bonusProdukcjaT2: number;
  /** Order trade bonus as a fraction (positive, e.g. 0.10). */
  bonusHandelT2: number;
}

/** Per-tier multiplicative/risk effects derived from OrderParams. */
export interface OrderEffects {
  /** Multiplier on production (Praca). 1 = no effect. */
  productionMult: number;
  /** Multiplier on population growth speed. 1 = no effect. */
  growthMult: number;
  /** Multiplier on trade (Handel). 1 = no effect. */
  tradeMult: number;
  /** Per-turn revolt probability in [0,1]. 0 = no risk. */
  revoltRisk: number;
}

// ---------------------------------------------------------------------------
// Fallback constants (used when a porzadek key is missing from the JSON)
// ---------------------------------------------------------------------------

/** Sane default Order params (mirror the "normal" difficulty in the JSON). */
export const FALLBACK_ORDER_PARAMS: Readonly<OrderParams> = Object.freeze({
  wagaSzczescie:    0.5,
  wagaPrawo:        0.5,
  progT1:           0,
  progT2:           6,
  karaProdukcjaT1: -0.15,
  karaWzrostT1:    -0.25,
  ryzykoBuntuT1:    0.10,
  bonusProdukcjaT2: 0.10,
  bonusHandelT2:    0.10,
});

// ---------------------------------------------------------------------------
// Raw JSON shapes (mirrors data/society-params.json param-row convention)
// ---------------------------------------------------------------------------

/** One difficulty-scaled parameter row, as stored in society-params.json. */
interface RawSocietyParam {
  easy: number;
  normal: number;
  hard: number;
  jednostka?: string;
  opis?: string;
}

/** The new top-level "porzadek" object inside society-params.json. */
interface RawPorzadekBlock {
  porzadek_waga_szczescie?: RawSocietyParam;
  porzadek_waga_prawo?: RawSocietyParam;
  porzadek_prog_t1?: RawSocietyParam;
  porzadek_prog_t2?: RawSocietyParam;
  porzadek_kara_produkcja_t1?: RawSocietyParam;
  porzadek_kara_wzrost_t1?: RawSocietyParam;
  porzadek_ryzyko_buntu_t1?: RawSocietyParam;
  porzadek_bonus_produkcja_t2?: RawSocietyParam;
  porzadek_bonus_handel_t2?: RawSocietyParam;
}

/** Minimal shape of the society-params.json root that this module reads. */
export interface SocietyParamsLike {
  porzadek?: RawPorzadekBlock;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// loadOrderParams
// ---------------------------------------------------------------------------

/**
 * Read the per-difficulty value of one society param row, falling back to a
 * default when the row (or the value) is missing / non-finite.
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

/**
 * Resolve OrderParams for the given difficulty from a society-params.json
 * object. Reads the top-level "porzadek" block; any missing key falls back to
 * the matching FALLBACK_ORDER_PARAMS value, so a partial or absent block is
 * always safe.
 *
 *   import societyParams from '../../data/society-params.json';
 *   const params = loadOrderParams(societyParams, 'normal');
 *
 * @param society    - parsed society-params.json (or any object with a
 *                     "porzadek" block); pass null/undefined to get fallbacks.
 * @param difficulty - 'easy' | 'normal' | 'hard' (default 'normal').
 */
export function loadOrderParams(
  society: SocietyParamsLike | null | undefined,
  difficulty: Difficulty = 'normal',
): OrderParams {
  const p = (society && society.porzadek) || {};
  const f = FALLBACK_ORDER_PARAMS;
  return {
    wagaSzczescie:    pick(p.porzadek_waga_szczescie,    difficulty, f.wagaSzczescie),
    wagaPrawo:        pick(p.porzadek_waga_prawo,        difficulty, f.wagaPrawo),
    progT1:           pick(p.porzadek_prog_t1,           difficulty, f.progT1),
    progT2:           pick(p.porzadek_prog_t2,           difficulty, f.progT2),
    karaProdukcjaT1:  pick(p.porzadek_kara_produkcja_t1, difficulty, f.karaProdukcjaT1),
    karaWzrostT1:     pick(p.porzadek_kara_wzrost_t1,    difficulty, f.karaWzrostT1),
    ryzykoBuntuT1:    pick(p.porzadek_ryzyko_buntu_t1,   difficulty, f.ryzykoBuntuT1),
    bonusProdukcjaT2: pick(p.porzadek_bonus_produkcja_t2, difficulty, f.bonusProdukcjaT2),
    bonusHandelT2:    pick(p.porzadek_bonus_handel_t2,   difficulty, f.bonusHandelT2),
  };
}

// ---------------------------------------------------------------------------
// computeOrder
// ---------------------------------------------------------------------------

/**
 * Compute the city's Order (Porządek) from Happiness + Law.
 *
 *   Order = round( wagaSzczescie * szczescie + wagaPrawo * prawo )
 *
 * Pure and deterministic: same inputs + params always yield the same integer.
 * Non-finite inputs are coerced to 0 so the result is always a finite integer.
 *
 * @param inputs - { szczescie, prawo } point values for the city this turn.
 * @param params - resolved OrderParams (from loadOrderParams). Optional; uses
 *                 FALLBACK_ORDER_PARAMS when omitted.
 * @returns      - the Order value as an integer (point scale).
 */
export function computeOrder(
  inputs: OrderInputs,
  params: OrderParams = FALLBACK_ORDER_PARAMS,
): number {
  const szczescie = Number.isFinite(inputs.szczescie) ? inputs.szczescie : 0;
  const prawo     = Number.isFinite(inputs.prawo)     ? inputs.prawo     : 0;
  const raw = params.wagaSzczescie * szczescie + params.wagaPrawo * prawo;
  return Math.round(raw);
}

// ---------------------------------------------------------------------------
// orderTier
// ---------------------------------------------------------------------------

/**
 * Classify an Order value into a tier using the T1/T2 thresholds.
 *
 *   Order <  T1        → 'unrest'
 *   T1 <= Order <  T2  → 'neutral'
 *   Order >= T2        → 'order'
 *
 * Guards a degenerate config where T2 <= T1 by treating any non-unrest value as
 * 'order' (so the bands never overlap ambiguously).
 *
 * @param order  - the Order value (e.g. from computeOrder).
 * @param params - resolved OrderParams. Optional; uses FALLBACK_ORDER_PARAMS.
 */
export function orderTier(
  order: number,
  params: OrderParams = FALLBACK_ORDER_PARAMS,
): OrderTier {
  if (order < params.progT1) return 'unrest';
  if (order >= params.progT2) return 'order';
  return 'neutral';
}

// ---------------------------------------------------------------------------
// orderEffects
// ---------------------------------------------------------------------------

/**
 * Resolve the per-turn effects for a given tier.
 *
 *   'unrest'  → production & growth penalised; revolt risk > 0; trade unaffected.
 *   'neutral' → all multipliers 1; no risk.
 *   'order'   → production & trade bonus; growth unaffected; no risk.
 *
 * Penalties in OrderParams are stored as negative fractions and bonuses as
 * positive fractions; this converts them to multipliers (1 + fraction) and
 * clamps multipliers to a non-negative floor of 0 (a penalty can never make a
 * multiplier negative).
 *
 * @param tier   - 'unrest' | 'neutral' | 'order' (e.g. from orderTier).
 * @param params - resolved OrderParams. Optional; uses FALLBACK_ORDER_PARAMS.
 */
export function orderEffects(
  tier: OrderTier,
  params: OrderParams = FALLBACK_ORDER_PARAMS,
): OrderEffects {
  switch (tier) {
    case 'unrest':
      return {
        productionMult: Math.max(0, 1 + params.karaProdukcjaT1),
        growthMult:     Math.max(0, 1 + params.karaWzrostT1),
        tradeMult:      1,
        revoltRisk:     clamp01(params.ryzykoBuntuT1),
      };
    case 'order':
      return {
        productionMult: 1 + params.bonusProdukcjaT2,
        growthMult:     1,
        tradeMult:      1 + params.bonusHandelT2,
        revoltRisk:     0,
      };
    case 'neutral':
    default:
      return {
        productionMult: 1,
        growthMult:     1,
        tradeMult:      1,
        revoltRisk:     0,
      };
  }
}

// ---------------------------------------------------------------------------
// evaluateOrder — convenience one-shot (compute + tier + effects)
// ---------------------------------------------------------------------------

/** Combined Order result for one city this turn. */
export interface OrderResult {
  order: number;
  tier: OrderTier;
  effects: OrderEffects;
}

/**
 * One-shot helper for the turn loop: compute Order, its tier, and the effects.
 * Pure and deterministic.
 *
 * @param inputs - { szczescie, prawo }.
 * @param params - resolved OrderParams. Optional; uses FALLBACK_ORDER_PARAMS.
 */
export function evaluateOrder(
  inputs: OrderInputs,
  params: OrderParams = FALLBACK_ORDER_PARAMS,
): OrderResult {
  const order = computeOrder(inputs, params);
  const tier = orderTier(order, params);
  const effects = orderEffects(tier, params);
  return { order, tier, effects };
}

// ---------------------------------------------------------------------------
// internal
// ---------------------------------------------------------------------------

/** Clamp a number to [0, 1] (used for revolt probability). */
function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}


// ---------------------------------------------------------------------------
// happinessBreakdown -- wizualny rozklad populacji wg nastroju (ADDYTYWNE)
// ---------------------------------------------------------------------------

/**
 * Wizualny rozklad populacji na 3 grupy nastrojow.
 * PURE, deterministyczny, NaN-safe. Tylko dla UI -- NIE wplywa na mechanike gry.
 */
export interface HappinessBreakdown {
  zadowoleni: number;
  kontentni: number;
  niezadowoleni: number;
}

/**
 * Rozloz `population` mieszkancow na trzy grupy wg `szczescie` (netto Happiness).
 *
 * Heurystyka (liniowa, symetryczna):
 *   happy_frac = clamp( szczescie / (2 * max_happiness), 0, 1 )
 *     gdzie max_happiness = 10  (stala; odpowiada "doskonalemu" szczesciu)
 *   unhappy_frac = clamp( -szczescie / (2 * max_happiness), 0, 1 )
 *
 *   zadowoleni   = floor(population * happy_frac)
 *   niezadowoleni = floor(population * unhappy_frac)
 *   kontentni    = population - zadowoleni - niezadowoleni  (bierze reszte)
 *
 * Przyklad: population=10, szczescie=+5 -> happy_frac=0.25 -> zadowoleni=2,
 *           niezadowoleni=0, kontentni=8.
 * Przyklad: population=10, szczescie=-5 -> unhappy_frac=0.25 -> niezadowoleni=2,
 *           zadowoleni=0, kontentni=8.
 * Przyklad: population=10, szczescie=0  -> zadowoleni=0, niezadowoleni=0, kontentni=10.
 *
 * Gwarancje:
 *   - zadowoleni + kontentni + niezadowoleni == population (dla population >= 0)
 *   - population <= 0 -> same zera
 *   - NaN wejsc -> same zera
 *
 * @param population - liczba mieszkancow (nieujemna; <= 0 -> same zera)
 * @param szczescie  - netto Happiness tej tury (moze byc ujemne)
 * @returns HappinessBreakdown sumujacy sie do population
 */
export function happinessBreakdown(
  population: number,
  szczescie: number,
): HappinessBreakdown {
  const pop = Number.isFinite(population) && population > 0 ? Math.floor(population) : 0;
  if (pop <= 0) return { zadowoleni: 0, kontentni: 0, niezadowoleni: 0 };

  const hap = Number.isFinite(szczescie) ? szczescie : 0;

  // Skala: szczescie >= 20 -> cala populacja zadowolona; <= -20 -> cala niezadowolona
  const MAX_HAP = 20;
  const happyFrac   = Math.min(1, Math.max(0,  hap / MAX_HAP));
  const unhappyFrac = Math.min(1, Math.max(0, -hap / MAX_HAP));

  const zadowoleni    = Math.floor(pop * happyFrac);
  const niezadowoleni = Math.floor(pop * unhappyFrac);
  const kontentni     = pop - zadowoleni - niezadowoleni;

  return { zadowoleni, kontentni, niezadowoleni };
}
