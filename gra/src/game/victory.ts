/**
 * victory.ts
 * Victory / defeat condition checks (warunki zwyciestwa).
 *
 * Implements PROJEKT-GRY-master.md par. 8d. Conditions are meant to be
 * evaluated once per finished turn by the engine; this module only computes
 * the result and never mutates state.
 *
 * Two victory kinds are supported in v0.1:
 *
 *   1. 'dominacja' (Dominacja wlasnego typu, par. 8d.1) -- the start-game goal.
 *      The player wins when EVERY rival player whose civ type equals the
 *      player's own type has been eliminated. A rival is "eliminated" only
 *      when it has ZERO cities left (every city destroyed -- not just the
 *      capital: capturing a capital seizes its treasury but the rival moves
 *      the capital to a surviving city and respawns its super-unit there).
 *
 *   2. 'nauka' (Zwyciestwo naukowe / kosmiczne, par. 8d.2) -- final epoch.
 *      In the last epoch (Robotow), once the player has all techs and the
 *      spaceship is finished, the player wins. This module takes those two
 *      facts as pre-computed booleans (epokaKoncowa, naukaUkonczona).
 *
 * A defeat ('przegrana', par. 8d, point 2 of the impl summary) is reported
 * when the player has no cities and no settlers left (nothing to rebuild from).
 *
 * Pure logic -- no DOM, no THREE, no side effects, ASCII-only.
 *
 * Exports:
 *   VictoryPlayer  - minimal player shape this module needs
 *   VictoryInput   - input bundle for checkVictory()
 *   VictoryResult  - successful outcome (winner + kind)
 *   playersOfType()- rival players sharing a given civ type
 *   citiesOf()     - cities owned by a given player id
 *   isEliminated() - whether a player has zero cities
 *   checkVictory() - main per-turn evaluation
 */

import type { City } from './cities';

// ---------------------------------------------------------------------------
// Input / output shapes
// ---------------------------------------------------------------------------

/**
 * Minimal player projection required to decide victory.
 *
 * Decoupled on purpose from src/types/player.ts so this module stays pure and
 * does not pull in TechState / Skarbiec etc. The caller maps its richer Player
 * objects down to this shape (id -> number, typCywilizacji -> string tag,
 * isAI -> ai).
 */
export interface VictoryPlayer {
  /** Numeric player id, matching City.ownerId. */
  id: number;
  /** Civ-type tag (e.g. 'grecy', 'rzymianie'); compared by equality. */
  typCywilizacji: string;
  /** Whether this player is AI-controlled. */
  ai: boolean;
}

/**
 * Everything checkVictory() needs for one evaluation.
 */
export interface VictoryInput {
  /** All players still tracked by the game (eliminated ones may be omitted or kept). */
  players: VictoryPlayer[];
  /** All cities currently alive on the map. A destroyed city is simply absent. */
  cities: City[];
  /** Id of the player we are evaluating victory/defeat for. */
  gracz: number;
  /** True when the game is in the final epoch (Epoka Robotow). Optional, default false. */
  epokaKoncowa?: boolean;
  /** True when the evaluated player has completed the science/spaceship goal. Optional, default false. */
  naukaUkonczona?: boolean;
  /**
   * Number of settlers (osadnicy) the evaluated player still owns.
   * Used only for the optional defeat check: a player with no cities AND no
   * settlers has nothing to rebuild from and is defeated. Optional, default 0.
   */
  liczbaOsadnikow?: number;
}

/** Outcome of a victory check. */
export interface VictoryResult {
  /** Player id that won, or -- for a defeat -- the player id that lost. */
  winner: number;
  /**
   * 'dominacja' -- eliminated all rivals of own type (par. 8d.1).
   * 'nauka'     -- science / spaceship victory in the final epoch (par. 8d.2).
   * 'przegrana' -- the evaluated player was eliminated (no cities, no settlers).
   */
  rodzaj: 'dominacja' | 'nauka' | 'przegrana';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the RIVAL players that share the given civ type.
 *
 * "Rival" excludes the player identified by exceptId (normally the evaluated
 * player). The type comparison is a plain string equality on typCywilizacji.
 *
 * @param players  full player list
 * @param typ      civ-type tag to match
 * @param exceptId optional player id to exclude (self)
 */
export function playersOfType(
  players: VictoryPlayer[],
  typ: string,
  exceptId?: number,
): VictoryPlayer[] {
  const out: VictoryPlayer[] = [];
  for (const p of players) {
    if (p.typCywilizacji !== typ) {
      continue;
    }
    if (exceptId !== undefined && p.id === exceptId) {
      continue;
    }
    out.push(p);
  }
  return out;
}

/**
 * Returns the cities owned by the given player id.
 *
 * @param playerId owner id to match against City.ownerId
 * @param cities   all alive cities
 */
export function citiesOf(playerId: number, cities: City[]): City[] {
  const out: City[] = [];
  for (const c of cities) {
    if (c.ownerId === playerId) {
      out.push(c);
    }
  }
  return out;
}

/**
 * A player is eliminated (par. 8d.1) precisely when it owns no cities.
 * Destroying every city -- not merely capturing the capital -- is what
 * eliminates a player.
 *
 * @param playerId player to test
 * @param cities   all alive cities
 */
export function isEliminated(playerId: number, cities: City[]): boolean {
  return citiesOf(playerId, cities).length === 0;
}

// ---------------------------------------------------------------------------
// Main check
// ---------------------------------------------------------------------------

/**
 * Evaluates victory / defeat for input.gracz, per par. 8d.
 *
 * Resolution order (first match wins), mirroring par. 8d "Sprawdzanie warunkow":
 *   1. Domination of own type -- every rival of the player's own civ type has
 *      zero cities. Requires at least one such rival to exist (you cannot win
 *      by domination if there were never any same-type rivals to eliminate).
 *   2. Player defeat -- the evaluated player has no cities and no settlers.
 *   3. Science / spaceship victory -- final epoch and the science goal done.
 *
 * Returns the matching VictoryResult, or null when the game continues.
 *
 * Note: domination is checked before the player's own defeat so that an
 * exchange in which the last same-type rival and the player both lose their
 * final city on the same turn still resolves as a domination victory for the
 * player (the rivals are gone). Adjust ordering here if a different tie-break
 * is desired.
 */
export function checkVictory(input: VictoryInput): VictoryResult | null {
  const { players, cities, gracz } = input;

  // Resolve the evaluated player's civ type (needed for domination).
  let graczTyp: string | null = null;
  for (const p of players) {
    if (p.id === gracz) {
      graczTyp = p.typCywilizacji;
      break;
    }
  }

  // --- 1. Domination of own type (par. 8d.1) -------------------------------
  if (graczTyp !== null) {
    const rywale = playersOfType(players, graczTyp, gracz);
    if (rywale.length > 0) {
      let wszyscyWyeliminowani = true;
      for (const r of rywale) {
        if (!isEliminated(r.id, cities)) {
          wszyscyWyeliminowani = false;
          break;
        }
      }
      if (wszyscyWyeliminowani) {
        return { winner: gracz, rodzaj: 'dominacja' };
      }
    }
  }

  // --- 2. Player defeat (par. 8d impl summary, point 2) --------------------
  // Eliminated = no cities. Optionally also require no settlers, so a player
  // who still has an osadnik to re-found a city is not declared defeated.
  const osadnicy = input.liczbaOsadnikow ?? 0;
  if (isEliminated(gracz, cities) && osadnicy === 0) {
    return { winner: gracz, rodzaj: 'przegrana' };
  }

  // --- 3. Science / spaceship victory (par. 8d.2) --------------------------
  const epokaKoncowa = input.epokaKoncowa ?? false;
  const naukaUkonczona = input.naukaUkonczona ?? false;
  if (epokaKoncowa && naukaUkonczona) {
    return { winner: gracz, rodzaj: 'nauka' };
  }

  // Game continues.
  return null;
}
