/**
 * siege.ts
 * PURE, deterministic, DOM-free city-siege logic for The Game (4X Civ-style).
 *
 * Task B3: city sieges. This module is SELF-CONTAINED and DECOUPLED -- like
 * economy.ts defines its own EconomyCity, this file defines its own input
 * interfaces (SiegeUnit, SiegeCity) and re-implements the small slice of the
 * canonical combat formula it needs, rather than importing combat.ts (which is
 * owned/edited by a concurrent session). Integration into the turn loop / battle
 * is intentionally NOT done here; the turn-loop/battle can call these functions
 * later.
 *
 * Canon sources (read-only references):
 *   - PROJEKT-GRY-master.md SS5l "KANONICZNY MODEL WALKI" (jedyne zrodlo prawdy):
 *       hit%      = clamp(50 + (Atak - Obrona) * 5, 10, 90)
 *       obrazenia = max(1, Atak - Pancerz + Przebicie) + Uderzenie (tylko R1/szarza)
 *   - PROJEKT-GRY-master.md SS9c "Milicja wieśniaków": miasto atakowane/oblegane
 *       wystawia ~20% mieszkancow jako milicje (chlopi z widlami, ~1/2 Wojownika
 *       Ep. Kamienia).
 *   - data/terrain-combat.json -> "Wzgórza" Bonus Obrona "+50%" (miasto na
 *       wzgorzu => obronca x1.5 Obrony), spojnie z combat.ts terrainDefenseMultiplier.
 *
 * KANON 2026-07-25 (Maciej): obrona miasta dziala WYLACZNIE procentowo teraz
 * (mur +200% / Cytadela +300% lacznie -- miasto-params.json bonus_obrona_mur_proc
 * / bonus_obrona_cytadela_proc, konsumowane przez main.ts structureDefenseBonusFor
 * -> combat.ts structureDefBonusPct oraz battleScene.ts onWallWalkway). Ten modul
 * dublowal ten procent z osobnym PLASKIM bonusem Obrony/Pancerza (WALL_BASE_OBRONA
 * / WALL_PER_LEVEL_OBRONA, patrz combat-params.json "oblężenie") -- zneutralizowany
 * zerowaniem tych dwoch pol w danych (wall_base_obrona=0, wall_per_level_obrona=0),
 * a NIE usuniety z kodu, zeby wallLevel/hasWalls (fakt "miasto ma mur", uzywany
 * m.in. przez siegeAi.ts do oceny sily garnizonu) nadal dzialalo bez zmian API.
 * cityDefenseBonus() ponizej zwraca wiec zawsze obronaBonus=0 / pancerzBonus=0
 * z murow -- fortify_obrona_bonus (fortyfikacja jednostki) i terrainMult (wzgorza)
 * to jedyne nie-zerowe skladniki, jakie ten modul jeszcze dokłada.
 *
 * Design decisions:
 *   1. SiegeUnit mirrors only the combat-relevant fields of a unit (same field
 *      names as data/units.json / combat.ts CombatUnit) so callers can map a
 *      runtime unit or a units.json row onto it with no glue. Wall/terrain
 *      bonuses are applied to the DEFENDER's effective Obrona (and, for walls,
 *      a portion to effective Pancerz) -- the same "defender side" treatment
 *      combat.ts uses for terrain.
 *   2. cityDefenseBonus() returns a structured breakdown plus a single
 *      obronaBonus (flat, added to defender Obrona) and pancerzBonus (flat,
 *      added to defender Pancerz). Walls also expose an obronaMult-style hook
 *      via fortyfikacja for a braced garrison. Since 2026-07-25 the wall's flat
 *      contribution is zero by data (see KANON note above) -- the fields stay
 *      for API stability, but the real wall/Cytadela defence lives in the %
 *      layer (structureDefenseBonusFor / structureDefBonusPct), not here.
 *   3. resolveSiegeAttack() resolves ONE attacker vs the TOP garrison defender
 *      using the SS5l formula family with the city bonus folded into the
 *      defender, returning HP losses / death and attacker losses. It is a
 *      symmetric exchange (attacker hits, defender hits back) like a melee
 *      round in combat.ts, run for a bounded number of rounds.
 *   4. canCaptureCity()/captureCity() are pure: a city whose garrison has no
 *      surviving (HP>0) defender can be captured by an adjacent enemy; ownership
 *      transfers and a NEW city object is returned (no mutation).
 *   5. All numeric constants come from data where available
 *      (WALL_BASE_OBRONA / WALL_PER_LEVEL_OBRONA from combat-params.json,
 *      now zeroed per the 2026-07-25 kanon; HILL_DEFENSE_MULT from
 *      terrain-combat.json) with safe fallbacks baked in.
 *
 * ASCII-only source file (hex escapes used for any non-ASCII), matching combat.ts.
 */

// ---------------------------------------------------------------------------
// Constants (sourced from data/, with safe fallbacks)
// ---------------------------------------------------------------------------

/**
 * Mury (city walls) base defence at level 1 -- ZEROED (Maciej 2026-07-25):
 * wall/Cytadela defence is now PURELY percentage-based (miasto-params.json
 * bonus_obrona_mur_proc / bonus_obrona_cytadela_proc, applied in main.ts
 * structureDefenseBonusFor -> combat.ts structureDefBonusPct / battleScene.ts).
 * Kept as a data-sourced constant (combat-params.json "oblężenie".wall_base_obrona,
 * now 0) rather than deleted, so wallLevel/hasWalls (the "city has a wall" fact,
 * still used e.g. by siegeAi.ts strength estimation) keep working unchanged.
 */
// ---------------------------------------------------------------------------
// Building level scaling (shared with economy.ts)
// ---------------------------------------------------------------------------
import { buildingEffectAtLevel } from './production';
import combatParamsRaw from '../../data/combat-params.json';
import { hitChanceTw, damageTw } from './combat';

const OBL = combatParamsRaw['oblężenie'];

export const WALL_BASE_OBRONA = OBL.wall_base_obrona;

/**
 * Mury (city walls) defence gained per level above 1 -- ZEROED alongside
 * WALL_BASE_OBRONA (see comment above); combat-params.json "oblężenie".wall_per_level_obrona.
 */
export const WALL_PER_LEVEL_OBRONA = OBL.wall_per_level_obrona;

/**
 * Maximum wall level -- buildings.json "mury".maksPoziom (still used to clamp
 * hasWalls/wallLevel; unrelated to the retired flat Obrona/Pancerz bonus above).
 */
export const WALL_MAX_LEVEL = OBL.wall_max_level;

/**
 * Fraction of the wall's Obrona bonus that ALSO hardens the defender's Pancerz
 * (walls give cover, reducing incoming damage, not only dodge). Conservative
 * default; tunable. 0.5 means half the flat wall bonus is added to Pancerz.
 * NOTE: with WALL_BASE_OBRONA/WALL_PER_LEVEL_OBRONA now 0, this fraction is
 * multiplied against a zero base (see cityDefenseBonus below) -- no NaN/divide-
 * by-zero risk (it's a multiplication, not a division), it's just inert until/
 * unless the flat layer is ever revived.
 */
export const WALL_PANCERZ_FRACTION = OBL.wall_pancerz_fraction;

/**
 * Hill (Wzgorza) defence multiplier for a city built on a hill --
 * data/terrain-combat.json "Wzgórza".Bonus Obrona = "+50%". Matches
 * combat.ts terrainDefenseMultiplier (1.5).
 */
export const HILL_DEFENSE_MULT = OBL.hill_defense_mult;

/**
 * Mountain (Gory) defence multiplier (cities normally can't be founded on Gory,
 * but kept for completeness / future). Matches combat.ts (1.75 midpoint of +50-100%).
 */
export const MOUNTAIN_DEFENSE_MULT = OBL.mountain_defense_mult;

/**
 * Fortification bonus to the garrison's Obrona when the city's top defender is
 * "bracing" (a fortified garrison standing inside walls gets an extra edge).
 * Applied as a flat add on top of walls+terrain. Tunable; safe default.
 */
export const FORTIFY_OBRONA_BONUS = OBL.fortify_obrona_bonus;

/**
 * Militia rule (SS9c): fraction of population that auto-defends a besieged city.
 */
export const MILITIA_POP_FRACTION = OBL.militia_pop_fraction;

/**
 * Militia strength vs a Stone-age Warrior (SS9c: "sila ~1/2 wojownika Ep. Kamienia").
 * Stone Warrior baseline (data/units.json "Wojownik"): Atak 6, Obrona 6, Health 30,
 * Uderzenie 4, Pancerz 4. We halve the offensive/defensive stats for militia.
 */
export const MILITIA_STRENGTH_FRACTION = OBL.militia_strength_fraction;

/** Default maximum exchange rounds in a single siege attack before a stalemate. */
export const SIEGE_MAX_ROUNDS = OBL.siege_max_rounds;

// ---------------------------------------------------------------------------
// Siege-specific unit snapshot (decoupled mirror of units.json combat fields)
// ---------------------------------------------------------------------------

/**
 * Combat-relevant snapshot of a single unit for siege math.
 * Field names mirror data/units.json / combat.ts CombatUnit so a runtime unit
 * (or a units.json row) maps on with no translation layer.
 */
export interface SiegeUnit {
  /** Unit type name ("Jednostka" in units.json), e.g. "Wojownik", "Falanga". */
  typNazwa: string;

  /** Tactical role ("Rola (linia)"): 'Wrecz' | 'Dystans' | 'Flanka' | 'Wsparcie' | 'Morska'. */
  rola: string;

  /** Attack stat -- hit chance (TW meleeAttack). */
  Atak: number;

  /** Defence stat -- dodge side of hit chance (TW meleeDefence). Wall/terrain bonuses add here. */
  Obrona: number;

  /** Charge bonus (TW chargeBonus). */
  Uderzenie: number;

  /** Armour (TW armor) -- reduces incoming damage. Part of the wall bonus hardens this. */
  Pancerz: number;

  /** Armour penetration (TW piercing). */
  Przebicie: number;

  /** Weapon base damage (TW weaponDamage) -- distinct from Atak/meleeAttack in TW formula. */
  weaponDamage: number;

  /** Current / max HP for this combat instance. */
  Health: number;

  /**
   * Rout threshold as a fraction [0..1] of starting Health ("Prog dezercji (% health)").
   * null/undefined => never routs from morale (fights to 0 HP), e.g. militia/garrison.
   */
  progDezercji?: number | null;

  /** If true the unit ignores the rout threshold and fights to HP <= 0. */
  unbreakable?: boolean;
}

// ---------------------------------------------------------------------------
// Siege city input shape (decoupled, like EconomyCity)
// ---------------------------------------------------------------------------

/**
 * Siege-relevant city state.
 *
 * The runtime City (src/game/cities.ts) is { id, ownerId, q, r, name, population, ... }.
 * We define our own input interface here with exactly the fields siege math needs
 * (owner, position, walls, garrison, terrain, population for militia) rather than
 * editing cities.ts or types/city.ts.
 */
export interface SiegeCity {
  /** City id (carried through capture for caller bookkeeping). */
  id: string;

  /** Current owner id (number, matching runtime City.ownerId). */
  ownerId: number;

  /** Axial hex position of the city centre. */
  q: number;
  r: number;

  /**
   * Wall (Mury) level. 0 = no walls. 1..WALL_MAX_LEVEL otherwise.
   * Convenience flag hasWalls is derived from this if omitted.
   */
  wallLevel: number;

  /** Optional explicit "has walls" flag; if omitted, derived from wallLevel > 0. */
  hasWalls?: boolean;

  /**
   * Garrison units defending the city, ordered by defending priority
   * (index 0 = the unit that takes the next attack -- the "top" defender).
   * Units with Health <= 0 are treated as removed.
   */
  garrison: SiegeUnit[];

  /** Base terrain the city occupies ("Wzgórza", "Równina", etc.). Optional. */
  terrain?: string;

  /** Whether the city's top defender is fortified/bracing (extra Obrona). */
  fortified?: boolean;

  /** Current population -- used to derive militia strength (SS9c). Optional. */
  population?: number;
}

// ---------------------------------------------------------------------------
// Parameters for cityDefenseBonus (optionally data-driven)
// ---------------------------------------------------------------------------

export interface SiegeParams {
  /** Wall base Obrona at level 1. Default WALL_BASE_OBRONA (from buildings.json). */
  wallBaseObrona?: number;
  /** Wall Obrona gained per level above 1. Default WALL_PER_LEVEL_OBRONA. */
  wallPerLevelObrona?: number;
  /** Fraction of wall Obrona that also hardens Pancerz. Default WALL_PANCERZ_FRACTION. */
  wallPancerzFraction?: number;
  /** Hill defence multiplier. Default HILL_DEFENSE_MULT (from terrain-combat.json). */
  hillDefenseMult?: number;
  /** Mountain defence multiplier. Default MOUNTAIN_DEFENSE_MULT. */
  mountainDefenseMult?: number;
  /** Flat Obrona bonus when fortified. Default FORTIFY_OBRONA_BONUS. */
  fortifyObronaBonus?: number;
}

/**
 * Resolve a minimal "mury" record from a parsed buildings.json array so callers
 * can derive the canonical wall constants from data instead of the baked-in
 * fallbacks. Pure; returns the constants object usable as SiegeParams.
 *
 * Accepts the raw buildings array (each row shaped like buildings.json entries
 * with id/baza.obrona/przyrost.obrona). Unknown shapes fall back to constants.
 *
 * NOTE (2026-07-25): buildings.json "mury".baza/przyrost.obrona are now 0 (the
 * flat building bonus was retired -- see KANON note at the top of this file),
 * so this will resolve to {wallBaseObrona: 0, wallPerLevelObrona: 0} for the
 * real game data. Kept for API stability / tests; not called from main.ts.
 */
export function wallParamsFromBuildings(
  buildings: ReadonlyArray<{
    id?: string;
    baza?: { obrona?: number };
    przyrost?: { obrona?: number };
    maksPoziom?: number;
  }>,
): Pick<SiegeParams, 'wallBaseObrona' | 'wallPerLevelObrona'> {
  const mury = buildings.find((b) => b && b.id === 'mury');
  const base = mury?.baza?.obrona;
  const per = mury?.przyrost?.obrona;
  return {
    wallBaseObrona: typeof base === 'number' ? base : WALL_BASE_OBRONA,
    wallPerLevelObrona: typeof per === 'number' ? per : WALL_PER_LEVEL_OBRONA,
  };
}

// ---------------------------------------------------------------------------
// SS5l core formula bits (re-implemented locally; combat.ts NOT imported)
// ---------------------------------------------------------------------------

/**
 * Canonical hit chance (SS5l):  clamp(50 + (atk - def) * 5, 10, 90).
 * Returns an integer percentage in [10, 90].
 */
export function hitChance(atk: number, def: number): number {
  const raw = 50 + (atk - def) * 5;
  return Math.max(10, Math.min(90, raw));
}

/**
 * Canonical per-hit damage (SS5l):
 *   max(1, Atak - Pancerz + Przebicie) + (isChargeRound ? Uderzenie : 0)
 */
export function baseDamage(
  atk: number,
  panc: number,
  przeb: number,
  uderzenie: number,
  isChargeRound: boolean,
): number {
  const base = Math.max(1, atk - panc + przeb);
  return base + (isChargeRound ? uderzenie : 0);
}

// ---------------------------------------------------------------------------
// City defence bonus
// ---------------------------------------------------------------------------

export interface CityDefenseBonus {
  /** Flat bonus added to the top defender's Obrona (walls + fortification). */
  obronaBonus: number;
  /** Flat bonus added to the top defender's Pancerz (wall cover). */
  pancerzBonus: number;
  /** Multiplier applied to the (Obrona + obronaBonus) total from terrain. */
  terrainMult: number;
  /** Convenience: terrainMult expressed as the effective Obrona multiplier. */
  // (kept separate from obronaBonus so callers can inspect each contribution)
  /** Breakdown for UI/debug/tests. */
  breakdown: {
    wallObrona: number;
    wallPancerz: number;
    fortify: number;
    terrain: string;
    terrainMult: number;
    hasWalls: boolean;
    wallLevel: number;
  };
}

/**
 * Compute the city's defensive bonus for its garrison in a siege.
 *
 * Combines:
 *   - Wall (Mury) flat Obrona: wallBaseObrona + (wallLevel - 1) * wallPerLevelObrona
 *     (only when wallLevel >= 1 / hasWalls), part of which also hardens Pancerz.
 *     RETIRED 2026-07-25 -- wallBaseObrona/wallPerLevelObrona are 0 by data now
 *     (see KANON note at top of file), so this term is always 0 in the real
 *     game; the actual wall/Cytadela defence (+200%/+300%) is applied elsewhere
 *     as a percentage (main.ts structureDefenseBonusFor -> combat.ts
 *     structureDefBonusPct / battleScene.ts onWallWalkway), not by this module.
 *   - Fortification flat Obrona when city.fortified (unrelated to walls; unchanged).
 *   - Terrain multiplier (hills x1.5, mountains x1.75) applied to the
 *     Obrona total -- mirrors combat.ts terrainDefenseMultiplier.
 *
 * Pure. Returns the bonus object; callers fold it into the defender via
 * applyCityBonus() (or use resolveSiegeAttack which does so internally).
 */
export function cityDefenseBonus(
  city: SiegeCity,
  params: SiegeParams = {},
): CityDefenseBonus {
  const wallBase = params.wallBaseObrona ?? WALL_BASE_OBRONA;
  const wallPer = params.wallPerLevelObrona ?? WALL_PER_LEVEL_OBRONA;
  const wallPancFrac = params.wallPancerzFraction ?? WALL_PANCERZ_FRACTION;
  const hillMult = params.hillDefenseMult ?? HILL_DEFENSE_MULT;
  const mtnMult = params.mountainDefenseMult ?? MOUNTAIN_DEFENSE_MULT;
  const fortifyBonus = params.fortifyObronaBonus ?? FORTIFY_OBRONA_BONUS;

  const hasWalls = city.hasWalls ?? city.wallLevel > 0;
  const level = hasWalls ? Math.max(1, Math.min(WALL_MAX_LEVEL, city.wallLevel || 1)) : 0;

  // Wall flat Obrona bonus (linear): wallBase + wallPer * (level-1), matching
  // buildingEffectAtLevel pattern. Both are 0 by data (see KANON note above),
  // so this term stays 0 in the real game.
  const wallObrona = hasWalls ? Math.round(buildingEffectAtLevel(wallBase, wallPer, level)) : 0;
  // Part of the wall bonus hardens Pancerz (cover).
  const wallPancerz = Math.round(wallObrona * wallPancFrac);

  // Fortification flat bonus.
  const fortify = city.fortified ? fortifyBonus : 0;

  // Terrain multiplier (defender side), same family as combat.ts.
  const terrainMult = terrainDefenseMult(city.terrain ?? '', hillMult, mtnMult);

  return {
    obronaBonus: wallObrona + fortify,
    pancerzBonus: wallPancerz,
    terrainMult,
    breakdown: {
      wallObrona,
      wallPancerz,
      fortify,
      terrain: city.terrain ?? '',
      terrainMult,
      hasWalls,
      wallLevel: level,
    },
  };
}

/**
 * Defender-side terrain multiplier for a city tile.
 * Hills -> hillMult, Mountains -> mtnMult, everything else -> 1.0.
 * Diacritic-insensitive (hill name with or without accents both match).
 */
export function terrainDefenseMult(
  terrain: string,
  hillMult: number = HILL_DEFENSE_MULT,
  mtnMult: number = MOUNTAIN_DEFENSE_MULT,
): number {
  if (!terrain) return 1.0;
  // NFD-decompose, strip combining marks (U+0300..U+036F), lowercase.
  // Built via RegExp from an ASCII string so the source file stays ASCII-only
  // (matching combat.ts convention); equivalent to /[̀-ͯ]/g.
  const COMBINING_MARKS = new RegExp('[\\u0300-\\u036F]', 'g');
  const t = terrain.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase();
  if (t.includes('gory')) return mtnMult;
  if (t.includes('wzg')) return hillMult;
  return 1.0;
}

/**
 * Fold a CityDefenseBonus into a defender SiegeUnit, returning a NEW unit with
 * boosted effective Obrona and Pancerz. Pure (does not mutate the input).
 *
 * effObrona  = (Obrona + obronaBonus) * terrainMult
 * effPancerz =  Pancerz + pancerzBonus
 */
export function applyCityBonus(defender: SiegeUnit, bonus: CityDefenseBonus): SiegeUnit {
  const effObrona = (defender.Obrona + bonus.obronaBonus) * bonus.terrainMult;
  return {
    ...defender,
    Obrona: effObrona,
    Pancerz: defender.Pancerz + bonus.pancerzBonus,
  };
}

// ---------------------------------------------------------------------------
// Militia (SS9c) -- derive a militia defender from population
// ---------------------------------------------------------------------------

/** Stone-age Warrior baseline (TW v3 from units.json "Wojownik") used to scale militia. */
const STONE_WARRIOR: Readonly<SiegeUnit> = {
  typNazwa: 'Wojownik',
  rola: 'Wrecz',
  Atak: 4,
  Obrona: 4,
  Uderzenie: 2,
  Pancerz: 2,
  Przebicie: 1,
  weaponDamage: 4,
  Health: 17,
  progDezercji: 0.4,
};

/**
 * Build a militia defender for a city (SS9c): ~20% of population stand to defend,
 * each with ~1/2 the strength of a Stone-age Warrior. We model the whole militia
 * as a single pooled SiegeUnit whose Health scales with the number of militiamen,
 * and whose offensive/defensive stats are halved. Militia never routs from morale
 * (defends to the last). Returns null when there is no population to draw on.
 *
 * Pure; deterministic.
 */
export function makeMilitia(
  population: number,
  popFraction: number = MILITIA_POP_FRACTION,
  strengthFraction: number = MILITIA_STRENGTH_FRACTION,
): SiegeUnit | null {
  const count = Math.floor(Math.max(0, population) * popFraction);
  if (count <= 0) return null;
  return {
    typNazwa: 'Milicja',
    rola: 'Wrecz',
    Atak: Math.max(1, Math.round(STONE_WARRIOR.Atak * strengthFraction)),
    Obrona: Math.max(1, Math.round(STONE_WARRIOR.Obrona * strengthFraction)),
    Uderzenie: Math.max(0, Math.round(STONE_WARRIOR.Uderzenie * strengthFraction)),
    Pancerz: Math.max(0, Math.round(STONE_WARRIOR.Pancerz * strengthFraction)),
    Przebicie: 0,
    weaponDamage: Math.max(1, Math.round(STONE_WARRIOR.weaponDamage * strengthFraction)),
    // Pool HP: each militiaman contributes a share of the Warrior's HP, halved.
    Health: Math.max(1, Math.round(count * STONE_WARRIOR.Health * strengthFraction)),
    progDezercji: null, // militia defends to the last
    unbreakable: true,
  };
}

/**
 * Return the effective garrison for defending a city: the real garrison, and if
 * it is empty, the auto-raised militia (SS9c) when population allows. Pure.
 */
export function effectiveGarrison(
  city: SiegeCity,
  popFraction: number = MILITIA_POP_FRACTION,
): SiegeUnit[] {
  const alive = city.garrison.filter((u) => u.Health > 0);
  if (alive.length > 0) return alive;
  const militia = makeMilitia(city.population ?? 0, popFraction);
  return militia ? [militia] : [];
}

// ---------------------------------------------------------------------------
// Siege attack resolution
// ---------------------------------------------------------------------------

export interface SiegeAttackOpts {
  /** Defence parameters (wall/terrain constants). */
  params?: SiegeParams;
  /**
   * Deterministic RNG returning a float in [0, 1). Default Math.random.
   * Inject a seeded RNG in tests for determinism.
   */
  rng?: () => number;
  /** Max exchange rounds before a stalemate. Default SIEGE_MAX_ROUNDS. */
  maxRounds?: number;
  /**
   * If true, auto-raise militia (SS9c) when the garrison is empty so an
   * undefended-but-populated city still resists. Default true.
   */
  useMilitia?: boolean;
}

export interface SiegeAttackResult {
  /** Who prevailed in this single engagement. */
  outcome: 'attackerWins' | 'defenderWins' | 'stalemate';
  /** Attacker HP remaining (>= 0). */
  attackerHpLeft: number;
  /** Defender HP remaining (>= 0). */
  defenderHpLeft: number;
  /** HP the defender lost this engagement. */
  defenderHpLoss: number;
  /** HP the attacker lost this engagement. */
  attackerHpLoss: number;
  /** Whether the engaged defender died (HP <= 0). */
  defenderDied: boolean;
  /** Whether the attacker died (HP <= 0). */
  attackerDied: boolean;
  /** The defender that was engaged (with city bonus folded in), for inspection. */
  engagedDefender: SiegeUnit | null;
  /** The city defence bonus that was applied. */
  appliedBonus: CityDefenseBonus;
  /** Number of exchange rounds fought. */
  rounds: number;
  /** Step log for UI/debug. */
  log: string[];
}

/**
 * Resolve ONE attacker engaging the TOP garrison defender of a city, with the
 * city's defensive bonus (walls + terrain + fortification) folded into the
 * defender. Uses the SS5l formula family (hitChance / baseDamage). The attacker
 * and the defender trade blows each round (attacker first, then the defender
 * strikes back if still alive) until one dies, the defender routs, or maxRounds
 * is reached.
 *
 * Does NOT mutate inputs. Returns the outcome (defender HP loss / death, attacker
 * losses) so the turn loop can apply the result. If the garrison is empty and
 * useMilitia is true, an auto-raised militia (SS9c) defends; if there is also no
 * militia, the city is undefended -> immediate attackerWins with the attacker
 * unharmed (the caller can then capture via captureCity).
 *
 * @param attacker  the attacking unit (snapshot)
 * @param city      the besieged city
 * @param opts      optional context (params, rng, maxRounds, useMilitia)
 */
export function resolveSiegeAttack(
  attacker: SiegeUnit,
  city: SiegeCity,
  opts: SiegeAttackOpts = {},
): SiegeAttackResult {
  const rng = opts.rng ?? (() => Math.random());
  const maxRounds = opts.maxRounds ?? SIEGE_MAX_ROUNDS;
  const useMilitia = opts.useMilitia ?? true;
  const params = opts.params ?? {};

  const log: string[] = [];
  const bonus = cityDefenseBonus(city, params);

  // Pick the top defender (real garrison first, else militia if enabled).
  const garrison = useMilitia
    ? effectiveGarrison(city)
    : city.garrison.filter((u) => u.Health > 0);

  const rawDefender = garrison[0];

  // Undefended city: attacker prevails without a fight.
  if (!rawDefender) {
    log.push('Miasto bez garnizonu -- atakujacy wkracza bez walki.');
    return {
      outcome: 'attackerWins',
      attackerHpLeft: attacker.Health,
      defenderHpLeft: 0,
      defenderHpLoss: 0,
      attackerHpLoss: 0,
      defenderDied: false,
      attackerDied: false,
      engagedDefender: null,
      appliedBonus: bonus,
      rounds: 0,
      log,
    };
  }

  // Fold the city bonus into the defender (boosted Obrona + Pancerz).
  const defender = applyCityBonus(rawDefender, bonus);

  const atkStartHp = attacker.Health;
  const defStartHp = defender.Health;
  let hpAtk = attacker.Health;
  let hpDef = defender.Health;

  const routDef =
    !defender.unbreakable && defender.progDezercji != null
      ? defender.progDezercji * defStartHp
      : 0;
  const routAtk =
    !attacker.unbreakable && attacker.progDezercji != null
      ? attacker.progDezercji * atkStartHp
      : 0;

  log.push(
    `Oblezenie ${city.id}: ATK ${attacker.typNazwa} (Atak ${attacker.Atak}) vs ` +
      `DEF ${defender.typNazwa} (Obrona ${defender.Obrona.toFixed(1)}, Pancerz ${defender.Pancerz}) ` +
      `[mury+teren: +${bonus.obronaBonus} Obrona, x${bonus.terrainMult} teren, +${bonus.pancerzBonus} Pancerz]`,
  );

  let rounds = 0;
  let defRouted = false;
  let atkRouted = false;

  while (hpAtk > 0 && hpDef > 0 && !defRouted && !atkRouted) {
    rounds++;
    if (rounds > maxRounds) {
      log.push('Limit rund -- impas.');
      break;
    }

    const isCharge = rounds === 1; // attacker charges in R1 (SS5l szarza)

    // Attacker strikes the (boosted) defender.
    const atkHit = hitChanceTw(attacker.Atak, defender.Obrona, isCharge ? attacker.Uderzenie : 0);
    const atkRoll = rng() * 100;
    if (atkRoll < atkHit) {
      const dmg = damageTw(
        attacker.weaponDamage,
        defender.Pancerz,
        attacker.Przebicie,
        attacker.Uderzenie,
        isCharge,
      );
      hpDef -= dmg;
      log.push(
        `R${rounds} ATK trafia (${atkRoll.toFixed(1)}<${atkHit}%) -> ${dmg} obr.${isCharge ? ' (+Uderzenie)' : ''} DEF HP ${hpDef}`,
      );
    } else {
      log.push(`R${rounds} ATK chybia (${atkRoll.toFixed(1)}>=${atkHit}%).`);
    }

    // Defender strikes back if still alive (the wall does not attack; the unit does).
    if (hpDef > 0) {
      const defHit = hitChanceTw(defender.Atak, attacker.Obrona, 0);
      const defRoll = rng() * 100;
      if (defRoll < defHit) {
        const dmg = damageTw(
          defender.weaponDamage,
          attacker.Pancerz,
          defender.Przebicie,
          0,
          false,
        );
        hpAtk -= dmg;
        log.push(
          `R${rounds} DEF trafia (${defRoll.toFixed(1)}<${defHit}%) -> ${dmg} obr. ATK HP ${hpAtk}`,
        );
      } else {
        log.push(`R${rounds} DEF chybia (${defRoll.toFixed(1)}>=${defHit}%).`);
      }
    }

    // Rout checks (death handled by the loop condition).
    if (hpDef > 0 && routDef > 0 && hpDef < routDef) {
      defRouted = true;
      log.push(`DEF ucieka! HP ${hpDef} < prog ${routDef}`);
    }
    if (hpAtk > 0 && routAtk > 0 && hpAtk < routAtk) {
      atkRouted = true;
      log.push(`ATK ucieka! HP ${hpAtk} < prog ${routAtk}`);
    }
  }

  const attackerDied = hpAtk <= 0;
  const defenderDied = hpDef <= 0;
  const atkDown = attackerDied || atkRouted;
  const defDown = defenderDied || defRouted;

  let outcome: SiegeAttackResult['outcome'];
  if (defDown && !atkDown) outcome = 'attackerWins';
  else if (atkDown && !defDown) outcome = 'defenderWins';
  else if (atkDown && defDown) outcome = 'defenderWins'; // city holds if both fall
  else outcome = 'stalemate';

  log.push(
    `=== ${outcome} | rundy ${rounds} | ATK HP ${Math.max(0, hpAtk)} DEF HP ${Math.max(0, hpDef)} ===`,
  );

  return {
    outcome,
    attackerHpLeft: Math.max(0, hpAtk),
    defenderHpLeft: Math.max(0, hpDef),
    defenderHpLoss: Math.max(0, defStartHp - Math.max(0, hpDef)),
    attackerHpLoss: Math.max(0, atkStartHp - Math.max(0, hpAtk)),
    defenderDied,
    attackerDied,
    engagedDefender: defender,
    appliedBonus: bonus,
    rounds,
    log,
  };
}

// ---------------------------------------------------------------------------
// Capture
// ---------------------------------------------------------------------------

/**
 * A city can be captured when it has NO surviving garrison defender
 * (every garrison unit has Health <= 0, or the garrison is empty).
 *
 * Militia is NOT counted here: militia is a transient battle defender (SS9c),
 * not a standing garrison. A city defended only by militia must first have that
 * militia defeated in resolveSiegeAttack; once the standing garrison is empty,
 * the city is capturable by an adjacent enemy.
 *
 * Pure / side-effect free.
 */
export function canCaptureCity(city: SiegeCity): boolean {
  const aliveGarrison = city.garrison.filter((u) => u.Health > 0);
  return aliveGarrison.length === 0;
}

/**
 * Transfer ownership of an undefended city to a new owner.
 *
 * Returns a NEW SiegeCity with ownerId = newOwner. Does NOT mutate the input.
 * On capture the garrison is cleared (the previous defenders are gone) and
 * fortification is reset. If the city still has a surviving garrison this is a
 * no-op that returns the original city unchanged (you must defeat the garrison
 * first via resolveSiegeAttack).
 *
 * @param city      the besieged city
 * @param newOwner  the capturing player's id
 */
export function captureCity(city: SiegeCity, newOwner: number): SiegeCity {
  if (!canCaptureCity(city)) {
    return city; // cannot capture a defended city
  }
  return {
    ...city,
    ownerId: newOwner,
    garrison: [],
    fortified: false,
  };
}

/**
 * Convenience: returns true when `attacker` (owned by attackerOwnerId) is allowed
 * to capture `city` -- i.e. the city is undefended AND the attacker is an enemy
 * (different owner) AND adjacent. Adjacency is checked with axial hex distance == 1.
 *
 * Pure.
 */
export function canEnemyCapture(
  city: SiegeCity,
  attackerOwnerId: number,
  attackerQ: number,
  attackerR: number,
): boolean {
  if (attackerOwnerId === city.ownerId) return false;
  if (!canCaptureCity(city)) return false;
  return hexDistanceAxial(attackerQ, attackerR, city.q, city.r) === 1;
}

/**
 * Axial hex distance (pointy-top, q/r), self-contained so this module has no
 * dependency on units/setup.ts. Same cube formula used across the project.
 */
export function hexDistanceAxial(q1: number, r1: number, q2: number, r2: number): number {
  const x1 = q1;
  const z1 = r1;
  const y1 = -x1 - z1;
  const x2 = q2;
  const z2 = r2;
  const y2 = -x2 - z2;
  return (Math.abs(x1 - x2) + Math.abs(y1 - y2) + Math.abs(z1 - z2)) / 2;
}
