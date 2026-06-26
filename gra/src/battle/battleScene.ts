/**
 * battleScene.ts
 * Tactical 3D AUTO-battle overlay scene for The Game (SS5h: AI controls both
 * sides, player watches or skips).
 *
 * B7 REWORK -- SQUARE BATTLEFIELD + 4-DIRECTION FACING.
 * The WORLD MAP stays hex (scene.ts / hexutil.ts unchanged); ONLY this tactical
 * battle field was converted from a pointy-top hex grid to a regular SQUARE
 * (NxM) grid of flat tiles. Movement / melee adjacency / ranged reach are now
 * 4-directional (N/E/S/W); distance is Manhattan (in tiles); facing is one of
 * four directions. The turn loop, blow-for-blow pacing, ammo/pilum (B6) and the
 * canonical resolveCombat numbers are UNCHANGED -- only the geometry and the
 * distance/range measurements were swapped from hex to square.
 *
 *   PLACEMENT: the two armies line up FACING each other on opposite ends of the
 *   field in clean vertical COLUMNS, with a clear multi-tile GAP between the
 *   front lines. Attacker on the LEFT (front = EAST, +X). Defender on the RIGHT
 *   (front = WEST, -X).
 *
 *   TURN LOOP (every unit acts once per turn): every unit has movement points =
 *   its "Ruch w bitwie (heksy)" stat (default 2 if missing/0). On its turn the
 *   unit finds the nearest enemy, BFS-paths toward it and WALKS tile-by-tile
 *   (animated) up to its movement points, then on a LATER turn:
 *     - a MELEE unit may attack ONLY if it is ADJACENT (Manhattan dist == 1).
 *     - a RANGED unit (Atak dystansowy > 0 or Zasieg ataku (hex) >= 2) may
 *       attack any enemy within its range (no adjacency needed), while it has
 *       ammunition (B6); once ammo runs out it fights as pure melee.
 *
 * FACING (SS5l): the ATTACKER turns to FACE the tile it strikes (front -> the
 * target). The DEFENDER keeps its OWN facing, so a blow that lands on the
 * defender's side/back is a FLANK / REAR hit -- that arc is passed to the
 * canonical combat math (flankRearDefensePenalty / resolveCombat's
 * attackerPosition) which already applies the SS5l side/back defence penalty.
 *
 * Square-grid geometry (self-contained -- no hexutil):
 *   cellToWorld(col, row)  =>  x = col*S,  z = row*S   (S = TILE_S, tiles touch)
 *   tile = thin flat BoxGeometry(S, TILE_H, S), top face at y = 0.
 *
 * Combat numbers are canonical: the same exported SS5l helpers
 * (hitChance / baseDamage / rangeDamage / counter / flankRearDefensePenalty) and
 * resolveCombat decide each fight's exact HP loss / winner.
 *
 * ASCII-only source file (Polish UI strings via plain ASCII where possible).
 *
 * Public API (UNCHANGED):
 *   constructor(opts: BattleOpts)
 *   play(onFinish: (r: BattleResult) => void): void
 *   skip(): void
 *   dispose(): void
 */

import * as THREE from 'three';
import {
  resolveCombat,
  hitChance,
  baseDamage,
  rangeDamage,
  counterMultiplier,
  terrainDefenseMultiplier,
  terrainRiverAttackMultiplier,
  flankRearDefensePenalty,
} from '../game/combat';
import type { CombatUnit, CombatResult } from '../game/combat';
import { buildUnitModel } from '../render/units';
import {
  BTerrain,
  generateBattleTerrain,
  tileJitter,
  type BattleTerrainMap,
} from './battle-terrain';
import { buildTestArmies } from './testBattle';
import { buildSiegeWall, attachRowBreachPanels } from './siegeWall';
import type { BronzeCiv } from '../render/bronzeCity';

// ---------------------------------------------------------------------------
// SQUARE-GRID FACING (4 directions: N / E / S / W)
//
// NOTE ON facing.ts: the spec asked for a NEW src/battle/facing.ts exposing the
// square Dir/facingToward/relativeHit API. A parallel session had ALREADY created
// src/battle/facing.ts as a HEX (6 pointy-top axial directions) helper for the
// previous hex battle field, and the lane rule forbids overwriting it. The hex
// facing.ts is geometrically incompatible with this square grid, so the square
// 4-direction facing logic lives self-contained HERE instead. It is the exact
// API the spec described (Dir enum N/E/S/W, facingToward, relativeHit) -- only
// the file location differs, to avoid clobbering the other session's work.
//
// Grid convention (matches cellToWorld below): col -> +X (East), row -> +Z.
// On screen the camera looks from +Z toward -Z, so:
//   E = +col (+X)   W = -col (-X)   S = +row (+Z, toward camera)   N = -row (-Z)
// ---------------------------------------------------------------------------

/** The four square-grid facing directions. */
export const enum Dir {
  N = 0, // -row
  E = 1, // +col
  S = 2, // +row
  W = 3, // -col
}

/** Result of classifying an attack against a defender's facing. */
export type FacingHit = 'front' | 'flank' | 'rear';

/** Unit (col,row) delta for each Dir, index === Dir. */
const DIR_DELTA: ReadonlyArray<readonly [number, number]> = [
  [0, -1], // N
  [1, 0],  // E
  [0, 1],  // S
  [-1, 0], // W
];

/**
 * The four orthogonal neighbour steps (N/E/S/W) used for movement, adjacency
 * and BFS on the square grid. Identical order to DIR_DELTA.
 */
const DIRS4: ReadonlyArray<readonly [number, number]> = DIR_DELTA;

/**
 * Pick the facing Dir that best matches the (dCol, dRow) vector pointing from a
 * unit toward a point of interest (its target). The dominant axis wins; ties
 * (|dCol| == |dRow|) prefer the horizontal axis (E/W) so a front line that
 * deploys left/right of the enemy keeps facing across the field. If the vector
 * is zero (target on the same tile) `fallback` (the unit's current facing) is
 * kept so a facing is never clobbered to a default.
 */
export function facingToward(dCol: number, dRow: number, fallback: Dir = Dir.E): Dir {
  if (dCol === 0 && dRow === 0) return fallback;
  if (Math.abs(dCol) >= Math.abs(dRow)) {
    return dCol >= 0 ? Dir.E : Dir.W;
  }
  return dRow >= 0 ? Dir.S : Dir.N;
}

/**
 * Convenience wrapper: facing Dir that points from (fromCol,fromRow) toward
 * (toCol,toRow).
 */
export function facingFromTo(
  fromCol: number,
  fromRow: number,
  toCol: number,
  toRow: number,
  fallback: Dir = Dir.E,
): Dir {
  return facingToward(toCol - fromCol, toRow - fromRow, fallback);
}

/** The diametrically opposite facing (N<->S, E<->W). */
export function oppositeDir(d: Dir): Dir {
  return ((d + 2) % 4) as Dir;
}

/**
 * Classify where an attack lands relative to the DEFENDER's facing.
 *
 *   - the direction FROM the defender TOWARD the attacker is the "incoming" dir;
 *   - if incoming == defender's facing            -> FRONT  (head-on)
 *   - if incoming is the OPPOSITE of the facing    -> REAR   (struck from behind)
 *   - otherwise (the two perpendicular dirs)        -> FLANK (side)
 *
 * Works for any attacker position (adjacent or ranged) -- it is purely the
 * relative direction of the blow, exactly as the SS5l side/back penalty needs.
 */
export function relativeHit(
  defenderFacing: Dir,
  attackerCol: number,
  attackerRow: number,
  defenderCol: number,
  defenderRow: number,
): FacingHit {
  const incoming = facingToward(
    attackerCol - defenderCol,
    attackerRow - defenderRow,
    defenderFacing,
  );
  if (incoming === defenderFacing) return 'front';
  if (incoming === oppositeDir(defenderFacing)) return 'rear';
  return 'flank';
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface BattleUnit {
  id: string;
  nazwa: string;
  kategoria: string;
  ownerColor: number;
  stats: any;
  hp: number;
  maxHp: number;
}

/** Siege-mode options: add a wall across the defender's end of the field. */
export interface SiegeOpts {
  /** Civilization style for the wall mesh (default 'rzym'). */
  civ?: BronzeCiv;
  /**
   * SIEGE v2: defender's civilization (controls the wall mesh style). When
   * provided, overrides `civ`. Use `defCiv` when the attacker's civ is
   * different from the city owner -- the wall should reflect the DEFENDER.
   */
  defCiv?: BronzeCiv;
}

export interface BattleOpts {
  attacker: BattleUnit[];
  defender: BattleUnit[];
  teren: string;
  data?: any;
  onCancel?: () => void;
  /** When set, activates siege mode: a wall + gate are placed near the defender. */
  siege?: SiegeOpts;
  /** Gdy true — faza rozstawiania poprzedza walke; gracz przesuwa jednostki atakujace. */
  deploy?: boolean;
}

export interface BattleResult {
  winner: 'atakujacy' | 'obronca';
  survivors: BattleUnit[];
  log: string[];
}

// ---------------------------------------------------------------------------
// Battlefield layout constants (SQUARE grid)
// ---------------------------------------------------------------------------

// BIG-BATTLE square battlefield (B9): sized for two 60-unit armies that deploy
// in EVEN ranks and clash FAST (front lines <= ~5 tiles apart).
//   - Z (rows) is the RANK axis: tall enough to hold a straight line of up to
//     ~20 figures plus a top/bottom terrain margin.
//   - X (columns) is the clash axis: wide enough for each side's THREE ranks +
//     a no-man's-land thick enough to hold a dense terrain belt, while the
//     fronts still start only FRONT_GAP tiles apart so melee is reached fast.
// The procedural terrain (rivers / forest / hills / rocks) is generated DENSELY
// across the whole field; battleScene then only LIGHTLY clears the exact tiles
// the ranks occupy and guarantees a passable clash corridor across the river
// (see _carveBattleBox), so the lines stand on flat passable ground and can
// reach each other, while terrain survives EVERYWHERE else as obstacles/scenery.
const BF_COLS = 34;   // total columns (clash axis -- 3 ranks/side + terrain belt)
const BF_ROWS = 78;   // total rows (tall rank axis -- +50 per Naster so all units fit; was 28)

// Up to this many units deploy per side. The default test battle ("rzym_grecja"
// preset) puts 84 per side: 40 lead infantry (MAIN_INFANTRY_COUNT) + 20 Oszczepnik
// + 20 Lucznik + 2 Konnica + 2 Rydwan konny (the mounted units deploy on the
// front-rank wings via arrangeFlankCavalry). Headroom is 84 so none of the flank
// cavalry or rear-rank infantry is sliced off before deployment (the slice to
// MAX_PER_SIDE in the builder must be >= the preset's per-side total).
const MAX_PER_SIDE = 84;

// How many figures stand shoulder-to-shoulder in ONE rank (a straight line).
// 60 units => 3 even ranks of 20. Keep <= BF_ROWS minus a small margin so a
// full rank fits centred on the field.
const RANK_WIDTH = 20;

// How many ranks deep one full side can be (ceil(MAX_PER_SIDE / RANK_WIDTH)).
// Drives the rank-clearing band width and the rear-rank column budget.
const MAX_RANKS = Math.ceil(MAX_PER_SIDE / RANK_WIDTH); // 4 for 64 / 20

// Outer columns kept as clean plains by the terrain generator. Small value so
// the rivers / forest / hills generate across nearly the whole field; the rank
// band is cleared separately by _carveBattleBox.
const DEPLOY_MARGIN = 4;

// Tile size in world units. Tiles are flat slabs of side TILE_S placed so they
// TOUCH (cell centre = col*TILE_S, row*TILE_S). 1.0 matches the unit models'
// internal scale (buildUnitModel is sized around 1.0), so figures sit nicely on
// the squares.
const TILE_S = 1.0;

// Front-deployment columns. Both fronts sit close to the field CENTRE so the
// two armies start only a few tiles apart and reach melee quickly; rear ranks
// step OUTWARD toward each side's own edge. FRONT_GAP is the column distance
// between the two front lines (their Manhattan distance on a shared row), kept
// <= 5 per the spec so melee is reached fast. Attacker front faces E (+X),
// defender front faces W (-X).
const FRONT_GAP = 5;                                       // <= 5: tiles between the two fronts (a terrain belt + river sit in this no-man's-land)
const ATK_FRONT_COL = Math.floor((BF_COLS - FRONT_GAP) / 2); // attacker front (left of centre)
const DEF_FRONT_COL = ATK_FRONT_COL + FRONT_GAP;             // defender front (right of centre)
const ATK_COL_STEP  = -1;           // attacker rear ranks step LEFT (toward -X edge)
const DEF_COL_STEP  = 1;            // defender rear ranks step RIGHT (toward +X edge)

const DEFAULT_BATTLE_MOVE  = 2;   // fallback "Ruch w bitwie" when missing/0
const DEFAULT_RANGED_REACH = 2;   // reach for a shooter whose "Zasieg ataku (hex)" is missing

// CHANGE C (ranged KITE): the minimum gap a shooter wants to keep between itself
// and the NEAREST enemy. If an enemy closes to within this many tiles the shooter
// retreats (kites) to restore distance while STAYING within its own range, so it
// keeps shooting instead of being dragged into the melee scrum. 2 => a shooter
// flees the instant an enemy is ADJACENT (dist 1), aiming to stand at dist >= 2.
// It never tries to exceed its range when kiting (a range-2 Oszczepnik kites from
// dist 1 back to exactly dist 2, where it can still shoot next turn).
const RANGED_MIN_GAP = 2;

// SKIRMISH REFINE: the minimum gap a PRIMARY-ranged unit (archer/slinger/
// javelineer) must keep from an enemy OFFENSIVE (melee) unit -- i.e. any enemy
// that is NOT itself primary-ranged and therefore closes to fight. This rule
// takes PRECEDENCE over shooting: if a melee enemy is within MELEE_SAFE_GAP
// (Manhattan), the shooter KITES toward its own rear to restore the gap even if
// that means skipping the shot this turn. >=2 means it backs off the instant a
// melee foe is adjacent (dist 1), aiming to stand at dist >= 2 from it. It does
// NOT apply to enemy ranged units (those are safe to stand near and shoot).
const MELEE_SAFE_GAP = 2;

const TILE_H = 0.10;  // tile slab thickness; top face at y = 0
const UNIT_Y = 0;     // units stand on the top face

// ---------------------------------------------------------------------------
// Combat animation constants
// ---------------------------------------------------------------------------

// NOTE: combat is strictly turn-by-turn. There is NO per-pair "duel to the
// death" loop -- every living unit takes exactly ONE action per turn and a
// melee blow is a single lunge whose counter lands on the target's OWN later
// turn.

// Movement / ranged timings.
const MOVE_STEP_MS    = 240;   // time to walk one tile
const STEP_GAP_MS     = 70;    // tiny pause between consecutive tile steps
const RANGED_FLY_MS   = 380;   // projectile flight time
const RANGED_GAP_MS   = 320;   // pause after a ranged shot resolves
const ACT_GAP_MS      = 160;   // pause between two units activating (light stagger)
const DEATH_FADE_MS   = 500;

// Turn-by-turn single-blow pacing.
// Each TURN every living unit takes exactly ONE action (one move OR one blow).
// A melee blow is a single quick lunge; the target counters on ITS OWN later turn.
const BLOW_LUNGE_MS   = 260;   // attacker lunges in then snaps back (one blow)
const BLOW_HIT_T      = 150;   // moment within the lunge the blow connects
const BLOW_SETTLE_MS  = 220;   // brief settle after a blow before the next unit acts
const TURN_GAP_MS     = 240;   // short breather between full turns

// CHANGE2: the over-head stat bars were too big and obscured the figures.
//   - LENGTH (width along the bar) cut to 40% of the previous 0.80 => 0.32.
//   - THICKNESS (height) made 3x thinner: previous 0.08 / 3 => ~0.0267, so the
//     bars read as delicate slim lines. Both are single constants reused by the
//     fg scaling/anchoring and the vertical stacking (BAR_GAP_Y), so the three
//     stacked bars stay proportional and the green->red / ammo behaviour is
//     untouched -- only their size shrank.
const HPBAR_W = 0.32;          // 40% of the previous 0.80 length
const HPBAR_H = 0.08 / 3;      // 3x thinner than the previous 0.08 thickness
// CHANGE B: the over-head bars floated far too high (1.05 above the tile top --
// nearly double the ~0.55-0.65 model height), so near another figure they read
// as if they belonged to the NEIGHBOUR. Lower the whole stack so its BOTTOM (the
// HP bar, at the group origin) sits JUST above THIS unit's own head. The buildUnitModel
// avatars are ~0.55 tall with the tallest crest reaching ~0.62-0.65 (units.ts), so
// 0.72 clears the head/crest by a hair while keeping the bars unmistakably tied to
// this figure. Billboarding-to-camera and the per-frame Y-follow on terrain/hills
// are unchanged (the hpBarGroup is still re-positioned at tileTop + HPBAR_Y every
// move/flee frame), and the 40%-length / thin-bar sizing (HPBAR_W / HPBAR_H) is kept.
const HPBAR_Y = 0.72;

// ---------------------------------------------------------------------------
// Three stacked over-head bars (camera-billboarded, follow the unit's Y incl.
// the hill-raised standing height). From TOP to BOTTOM (task B reorder):
//   AMMO   (top)  -- BLUE, only for ranged units with ammo capacity; width =
//                    ammoLeft/ammoMax; when empty it reads as an EMPTY BLACK box
//                    (the bg stays a true-black plane so the faction frame does
//                    NOT bleed through and look like a filled bar).
//   MORALE (mid)  -- green->red gradient by current morale fraction (right above HP).
//   HP     (bot)  -- the existing green health bar at the group origin (y=0).
// All three share one billboard group anchored at HPBAR_Y above the unit; the
// HP bar sits at the group origin (y=0) and the other two stack above it.
// ---------------------------------------------------------------------------
const BAR_GAP_Y   = HPBAR_H * 1.35;     // vertical spacing between stacked bars
const MORALEBAR_Y = BAR_GAP_Y;          // morale bar right above HP (middle)
const AMMOBAR_Y   = BAR_GAP_Y * 2;      // ammo bar topmost
const AMMOBAR_COLOR = 0x2f7adf;         // BLUE ammo bar

// ---------------------------------------------------------------------------
// FACTION-COLOUR OUTLINE on the over-head bar stack.
//
// Units carry no per-faction art, so the only on-figure cue to which SIDE a
// unit belongs is a THIN coloured FRAME drawn behind its bar stack. The frame
// is a single slightly-larger quad in the side's colour placed just BEHIND the
// three bars (more negative local Z), so a hair of the colour shows as a delicate
// border around the slim bars. It lives INSIDE the billboard hpBarGroup, so it
// billboards to the camera and follows the unit's Y (terrain/hill) for free --
// exactly like the bars.
//
// SIDE_COLOR is a small lookup keyed by side so MORE ally colours can be added
// later (today there are only two sides -- attacker = RED, defender = BLUE).
// Extend by adding keys here; nothing else needs to change.
const SIDE_COLOR: Record<'atk' | 'def', number> = {
  atk: 0xe53935, // ATTACKER -> red
  def: 0x1e88e5, // DEFENDER -> blue
};
/** Side -> faction outline colour, with a neutral grey fallback. */
function sideColor(side: 'atk' | 'def'): number {
  return SIDE_COLOR[side] ?? 0x9e9e9e;
}
// The coloured frame extends this far (world units) beyond the bar cluster on
// every edge, so only a thin rim of colour is visible around the slim bars.
const BAR_OUTLINE_PAD = HPBAR_H * 0.5;
// Frame sits this far BEHIND the bar backgrounds (more negative local Z) so the
// bars always render in front of their coloured rim.
const BAR_OUTLINE_Z   = -0.004;

// ---------------------------------------------------------------------------
// BATTLE LOG -- how many of the most recent clashes the on-screen panel keeps
// (newest first). At high battle speed many blows resolve per frame; the buffer
// is still hard-capped to this many entries so the panel stays small + readable.
// ---------------------------------------------------------------------------
const CLASH_LOG_MAX = 10;
/** Human side tag shown in the battle-log panel for a unit's side. */
function sideTag(side: 'atk' | 'def'): string {
  return side === 'atk' ? 'atak' : 'obr';
}

// ---------------------------------------------------------------------------
// MORALE + ROUT model (scene-side bookkeeping; resolveCombat untouched).
//
// units.json has no explicit "Morale" stat (its keys are Atak/Obrona/Health/
// "Prog dezercji (% health)"/...), and the codebase convention (src/types/unit.ts)
// is: morale is a 0..100 pool referenced to max Health, and a unit ROUTS when it
// breaks. We therefore start every unit at MORALE_START (full) and lower the
// CURRENT pool as it takes damage and as nearby allies die; when it drops below
// ROUT_MORALE_THRESHOLD of its start the unit routs (flees + counts as OUT).
//
// NEVER-ROUT (elite / "walczy do smierci"): the data marks fight-to-the-death
// units two ways -- a null/blank "Prog dezercji (% health)" (siege.ts: "null =>
// never routs from morale, fights to 0 HP") and an Uwagi note containing
// "walczy do smierci" / "niezlomny". Such units ignore morale rout entirely and
// fight down to 0 HP (matching the human's "units fight to ~0 HP" expectation
// for those that shouldn't break).
// ---------------------------------------------------------------------------
const MORALE_START          = 100;   // every unit starts at full morale
// Morale lost by the victim of a blow, scaled by how big the blow was relative
// to its max HP (a hit that takes 50% HP shakes morale a lot; a scratch little).
const MORALE_HIT_LOSS_SCALE = 100;   // moraleLost = (dmg/maxHp)*100 -- loss off a FIXED 100 (not base): 10% HP lost => -10 morale for everyone (Naster)
// Flat morale hit to nearby SURVIVING allies when a friendly unit dies/routs
// (a "shaken by losses" ripple), within MORALE_DEATH_RADIUS tiles.
const MORALE_ALLY_DEATH_LOSS = 12;
const STALL_TURN_LIMIT = 6;   // tury bez zmiany HP/morale/strat -> rozstrzygnij bitwe (anty-pat)
const MORALE_DEATH_RADIUS    = 3;    // Manhattan tiles within which allies are shaken

// ---------------------------------------------------------------------------
// BATTLE MORALE MODIFIERS (Naster) -- a full set of tunable morale factors,
// all wired around the EXISTING morale model (per-unit morale/moraleMax/
// fleeMorale/neverRout). All values are flat morale points unless noted. GAINS
// clamp to [0, moraleMax]; LOSSES clamp to >=0. "once" effects use per-unit flags.
// ---------------------------------------------------------------------------
const MORALE_FLANK_HIT          = 8;    // extra morale loss to a defender hit in the FLANK
const MORALE_REAR_HIT           = 15;   // extra morale loss to a defender hit in the REAR
const MORALE_CHARGE_HIT         = 15;   // extra morale loss when a MOUNTED attacker's CHARGE blow lands
const MORALE_KILL_GAIN          = 6;    // attacker GAINS morale when its blow kills/routs the defender
const MORALE_ENEMY_BREAK_GAIN   = 5;    // nearby ENEMIES of a fallen/routed unit GAIN morale
const MORALE_SURROUND_HIT       = 10;   // ONCE-per-unit loss when >=3 enemies are adjacent (surrounded)
const MORALE_TERRAIN_RESIST     = 5;    // defensive terrain (hill/forest) lowers the effective flee threshold (holds longer)
const MORALE_ARMY_COLLAPSE_RATIO= 0.40; // if a side's army-morale ratio < this, HP-based morale loss is amplified
const MORALE_ARMY_COLLAPSE_MULT = 1.3;  // multiplier on HP-based morale loss for a collapsing army
const MORALE_GENERAL_AURA       = 0;    // PLACEHOLDER: future +morale aura when a general/leader is nearby (not wired)
const MORALE_GATE_BREACH        = 5;    // wyłom BRAMY: -morale wszystkim obrońcom (jednorazowy)
const MORALE_WALL_BREACH        = 0;    // wyłom MURU (kafel): -morale 0 (per-kafel compounding wyłączone)

// ARMY MORALE (TASK 3) -- a whole side's collective morale ratio:
//   sum(current morale of ALL that side's units) / sum(starting morale of ALL
//   units that side EVER fielded), where DEAD and ROUTED units contribute 0 to
//   the numerator but KEEP their starting morale in the denominator. When a
//   side's ratio falls below ARMY_MORALE_LOSS_THRESHOLD the side LOSES the
//   battle (collective collapse) even if some units still stand. Recomputed each
//   turn / after every loss via _armyMoraleRatio.
const ARMY_MORALE_LOSS_THRESHOLD = 0.25;
// OUT-OF-AMMO FALL-BACK distance (TASK 4): a dry PRIMARY shooter retreats only
// this many tiles toward its own rear, then HOLDS (avoids combat unless an enemy
// reaches it adjacent). It does NOT run to the board edge.
const FALLBACK_TILES = 3;
// PHALANX LINE TOLERANCE (RULE 2 / anti-freeze): how many tiles a phalanx may
// stand AHEAD of the line's laggard before it must pause to let the line catch
// up. >0 means the front does NOT freeze the instant it is one tile ahead -- the
// whole line keeps STEPPING FORWARD together as a thick band, and a unit only
// holds when it is already this far past the slowest phalanx (so a terrain-stuck
// straggler reins the line in without making the front stand idle forever).
const PHALANX_LEAD_TOLERANCE = 2;

// ---------------------------------------------------------------------------
// Terrain floor colours
// ---------------------------------------------------------------------------

const TERRAIN_COLORS: Record<string, number> = {
  laka:     0x5a8a3a,
  rownina:  0x7daa52,
  wzgorza:  0xa08850,
  gory:     0x8a8880,
  pustynia: 0xc8a862,
  wybrzeze: 0xd8c880,
  morze:    0x3068a0,
  las:      0x2e6830,
};

function terrainFloorColor(teren: string): number {
  const key = teren
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '');
  for (const [k, v] of Object.entries(TERRAIN_COLORS)) {
    if (key.includes(k)) return v;
  }
  return 0x6a9448;
}

// ---------------------------------------------------------------------------
// Per-tile terrain colours + low-poly decoration palette (B8).
// Colours imitate the world-map look in render/scene.ts (per-tile ground tint,
// cone tree clusters for forest, raised grass bumps for hills, a blue river
// strip) so the battlefield reads in the same low-poly style.
// ---------------------------------------------------------------------------

const BT_FLOOR_COLOR: Record<number, number> = {
  [BTerrain.Plains]: 0x6fa84a, // open grass (scene.ts Laka)
  [BTerrain.Forest]: 0x3a6b34, // shaded forest floor
  [BTerrain.Hills]:  0x4a7838, // hill grass (scene.ts Wzgorza)
  [BTerrain.River]:  0x3a86b5, // river water (scene.ts RIVER_COLOR)
  [BTerrain.Ford]:   0x6a93a8, // shallow ford -- paler water over a gravel bed
  [BTerrain.Rocks]:  0x8a8680, // rocky ground
  [BTerrain.Wall]:   0x9a9080, // wall base tile -- stone/earth color
  [BTerrain.Gate]:   0x7a6a50, // gate tile -- dark arch floor
};

const FOREST_CONE_COLOR  = 0x2f6b34; // tree crown (scene.ts)
const FOREST_TRUNK_COLOR = 0x5b4327; // tree trunk (scene.ts)
const HILL_GRASS_COLOR   = 0x52823f; // raised grass bump (scene.ts)
const SHRUB_COLOR        = 0x356b2c; // hill shrub
const ROCK_COLOR         = 0x6f7a85; // low-poly rock (scene.ts PEAK_ROCK)
const RIVER_WATER_COLOR  = 0x3a86b5; // water plane

// Elevation lift (world units) applied to a hill tile's slab + its decorations.
const HILL_LIFT  = 0.18;
// The VISIBLE top (summit) of the raised grass dome drawn on a hill tile. The
// half-dome is a SphereGeometry(TILE_S*0.60) placed at y=0 and scaled in Y to
// (HILL_LIFT + 0.16)/(TILE_S*0.60), so its apex sits at exactly HILL_LIFT+0.16.
// Units standing on a hill rest their feet here (see tileTopY). This single
// constant is reused by the bump's Y-scale so the walking surface and the drawn
// dome can never drift apart.
const HILL_SUMMIT_Y = HILL_LIFT + 0.16;
// River/ford tiles sit slightly LOWER so water reads as a sunken channel.
const RIVER_DROP = 0.08;

// ---------------------------------------------------------------------------
// Stat helpers
// ---------------------------------------------------------------------------

function norm(v: unknown, fallback: number): number {
  if (v === null || v === undefined || v === '---' || v === '—' || v === '') return fallback;
  const n = typeof v === 'string' ? parseFloat(v as string) : (v as number);
  return isNaN(n) ? fallback : n;
}

/** Read a stat field tolerating both ASCII and accented JSON key spellings. */
function statField(s: Record<string, unknown>, asciiKey: string, accentKey?: string): unknown {
  if (s[asciiKey] !== undefined) return s[asciiKey];
  if (accentKey && s[accentKey] !== undefined) return s[accentKey];
  return undefined;
}

/**
 * BONUS vs TYPE multiplier (battle-lane, B-units data model). Reads the
 * defender's "Typ" (Swordsman / Spearman / Falangite / Offensive / Distance /
 * Mount) and the attacker's matching "Bonus vs <Typ> %" column, returning a
 * clamped (1 + pct/100) factor. Defaults to 1.0 (no bonus) for missing data.
 * Kept modest + clamped so a single column cannot trivialise a fight.
 */
function attackerBonusVsType(attacker: BattleUnit, defender: BattleUnit): number {
  const dTyp = String((defender.stats as any)?.['Typ'] ?? '').trim();
  if (!dTyp) return 1.0;
  const col = 'Bonus vs ' + dTyp + ' %';
  const raw = (attacker.stats as any)?.[col];
  let pct = typeof raw === 'number' ? raw : parseFloat(String(raw ?? ''));
  if (!Number.isFinite(pct)) pct = 0;
  // Clamp the bonus to a sane band so it stays a tweak, not a one-shot.
  if (pct > 200) pct = 200;
  if (pct < -90) pct = -90;
  return 1 + pct / 100;
}

/**
 * Normalise counters.json rows for resolveCombat.
 *
 * The JSON ships the accented key "Typ atakujacy" (with diacritics) while
 * combat.ts's counterMultiplier reads the ASCII key "Typ atakujacy". This maps
 * the accented spelling onto the ASCII key and drops any row missing the
 * required fields, so the canonical resolver can never hit `undefined.toLowerCase()`.
 */
function normCounters(raw: any[]): any[] {
  if (!Array.isArray(raw)) return [];
  const out: any[] = [];
  for (const c of raw) {
    if (!c || typeof c !== 'object') continue;
    const typA = c['Typ atakujacy'] ?? c['Typ atakujący'];
    const cel  = c['Cel (typ)'];
    if (typeof typA !== 'string' || typeof cel !== 'string') continue; // skip malformed
    out.push({
      'Typ atakujacy':        typA,
      'Cel (typ)':            cel,
      'Bonus':                c['Bonus'] ?? '',
      'Rodzaj (Atak/Obrona)': c['Rodzaj (Atak/Obrona)'] ?? '',
      'Status':               c['Status'] ?? '',
    });
  }
  return out;
}

function toCombatUnit(bu: BattleUnit): CombatUnit {
  const s: Record<string, unknown> = (bu.stats as Record<string, unknown>) ?? {};
  return {
    typNazwa:                    (s['Jednostka'] as string)       ?? bu.kategoria,
    rola:                        (s['Rola (linia)'] as string)    ?? 'Wrecz',
    Atak:                        norm(s['Atak'],                    5),
    Obrona:                      norm(s['Obrona'],                  5),
    Uderzenie:                   norm(s['Uderzenie'],               0),
    Pancerz:                     norm(s['Pancerz'],                 0),
    Przebicie:                   norm(s['Przebicie'],               0),
    Health:                      bu.hp,
    'Prog dezercji (% health)':  norm(statField(s, 'Prog dezercji (% health)', 'Próg dezercji (% health)'), 0.25),
    'Atak dystansowy':           norm(s['Atak dystansowy'],         0),
    'Zasieg ataku (hex)':        (statField(s, 'Zasieg ataku (hex)', 'Zasięg ataku (hex)') as (number | string | null)) ?? null,
    'Ilosc pociskow':            (statField(s, 'Ilosc pociskow', 'Ilość pocisków') as (number | string | null)) ?? null,
    'Ruch w bitwie (heksy)':     (s['Ruch w bitwie (heksy)'] as (number | string | null)) ?? null,
    'Kara obrony z flanki (%)':  norm(s['Kara obrony z flanki (%)'], 50),
    'Kara obrony z tylu (%)':    norm(statField(s, 'Kara obrony z tylu (%)', 'Kara obrony z tyłu (%)'), 80),
  };
}

/** Battle movement points (tiles / turn). Default DEFAULT_BATTLE_MOVE, min 1. */
function movementPoints(bu: BattleUnit): number {
  const s: Record<string, unknown> = (bu.stats as Record<string, unknown>) ?? {};
  const mv = norm(s['Ruch w bitwie (heksy)'], DEFAULT_BATTLE_MOVE);
  return Math.max(1, Math.round(mv));
}

/**
 * Ranged attack reach in TILES (0 for pure melee).
 *
 * A unit counts as RANGED when it has a ranged attack value
 * ("Atak dystansowy" > 0) OR an explicit reach of >= 2 tiles
 * ("Zasieg ataku (hex)" >= 2).  In the shipped data the reach field is
 * frequently null/"---" even for shooters (Lucznik, Procarz...), so when a
 * unit has a ranged-attack value but no explicit reach we fall back to
 * DEFAULT_RANGED_REACH instead of collapsing it to 1 (which would have made
 * archers fight as melee).  Pure melee units (no ranged attack, reach < 2)
 * return 0 and must be ADJACENT to strike. (The data field is historically
 * named "(hex)"; on the square grid it is simply read as a count of tiles.)
 */
function attackRange(bu: BattleUnit): number {
  const s: Record<string, unknown> = (bu.stats as Record<string, unknown>) ?? {};
  const dyst  = norm(s['Atak dystansowy'], 0);
  const reach = norm(statField(s, 'Zasieg ataku (hex)', 'Zasięg ataku (hex)'), 0);
  if (reach >= 2) return Math.round(reach);               // explicit ranged reach
  if (dyst > 0)   return Math.max(DEFAULT_RANGED_REACH, Math.round(reach)); // shooter, default reach
  return 0;                                                // pure melee -> adjacency only
}

/** True for a unit that can strike from a distance (range >= 2, no adjacency required). */
function isRanged(bu: BattleUnit): boolean {
  return attackRange(bu) >= 2;
}

/**
 * Starting throwing-ammunition for a unit ("Ilosc pociskow").
 *
 * Returns the FINITE projectile count when the data gives a real number
 * (e.g. Legionista = 2 pila), otherwise Infinity = unlimited shots. So a
 * pure archer/slinger whose data leaves the field blank keeps firing every
 * turn exactly as before, while a unit with a finite count throws that many
 * ranged blows and then must fight in melee. GRID-AGNOSTIC: no geometry here,
 * so this is identical to the hex version (B6 preserved).
 */
function ammoCount(bu: BattleUnit): number {
  const s: Record<string, unknown> = (bu.stats as Record<string, unknown>) ?? {};
  // B6 FIX: the units.json key carries Polish diacritics ("Ilosc pociskow" with
  // accents). The previous call passed the ASCII spelling as BOTH the ascii and
  // the accent argument, so statField never matched the real key, ammoCount
  // returned Infinity, and a Legionista (Ilosc pociskow = 2) threw pilum FOREVER
  // instead of 2 pila then switching to the sword. Read both spellings so the
  // finite count is found and the unit goes melee once ammo is spent.
  const raw = statField(s, 'Ilosc pociskow', 'Ilość pocisków');
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (raw === null || raw === undefined || raw === '' || !Number.isFinite(n)) {
    return Infinity;            // blank / non-numeric -> unlimited (pure shooters)
  }
  return Math.max(0, Math.floor(n));
}

/**
 * Can this runtime unit fire a RANGED blow right now? True only while it has
 * the base ranged capability AND ammunition remaining. Once ammoLeft hits 0
 * the unit is treated as PURE MELEE everywhere (target picking, in-range
 * test, attack dispatch) -- it closes to adjacency and strikes with its
 * melee Atak. Decision is deliberately grid-agnostic (B6 preserved).
 */
function canShoot(ru: RuntimeBattleUnit): boolean {
  return ru.rangedBase && ru.ammoLeft > 0;
}

/**
 * Is this unit a PRIMARY shooter (skirmisher / archer / slinger) whose main job
 * is to shoot, as opposed to a MELEE unit that merely carries a few throwing
 * weapons (e.g. the Legionista's 2 pila)? The distinction drives the 1A
 * out-of-ammo behaviour: a primary shooter that runs dry FALLS BACK behind its
 * own melee line rather than charging into the scrum, while a melee unit that
 * spent its pila closes to the sword as before.
 *
 * Signal = the model CATEGORY (already normalised by the army builders to
 * 'lucznik' / 'procarz' / 'oszczepnik' for the pure-ranged lines). A NAME
 * fallback covers builders that leave kategoria generic. Legionista / falanga /
 * wlocznik / konnica / rydwan are NEVER primary shooters even when they throw.
 */
function isPrimaryRanged(bu: BattleUnit): boolean {
  if (!isRanged(bu)) return false;
  const cat = normName(String(bu.kategoria ?? ''));
  if (cat === 'lucznik' || cat === 'procarz' || cat === 'oszczepnik') return true;
  if (cat === 'legionista' || cat === 'falanga' || cat === 'wlocznik' ||
      cat === 'miecznik'  || cat === 'maczuga' || cat === 'topor' ||
      cat === 'konnica'   || cat === 'rydwan') return false;
  // Fallback on the unit name for generic categories.
  const n = normName(String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa ?? ''));
  if (n.includes('luczn') || n.includes('archer') || n.includes('kusznik') ||
      n.includes('procarz') || n.includes('sling') ||
      n.includes('oszczep') || n.includes('javelin') || n.includes('atlatl')) return true;
  return false;
}

/** True for a MOUNTED unit (cavalry or chariot) -- belongs on the wings. */
function isMounted(bu: BattleUnit): boolean {
  const cat = normName(String(bu.kategoria ?? ''));
  if (cat === 'konnica' || cat === 'rydwan') return true;
  const n = normName(String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa ?? ''));
  return n.includes('konnic') || n.includes('jazd') || n.includes('jezdz') ||
         n.includes('kawaler') || n.includes('rydwan') || n.includes('chariot') ||
         n.includes('cavalry') || n.includes('horse');
}

/**
 * TRUE for an ANTI-CAVALRY SPEAR unit -- a spearman / phalanx whose role is to
 * counter mounted units (the +50% spear-vs-cavalry bonus in data/counters.json,
 * "Wlocznik" vs "Konnica/Rydwan"). Detected by normalised CATEGORY (wlocznik /
 * falanga) with a NAME fallback so culture variants (Greek phalanx, hoplite,
 * pikemen, sarissa, impi, ...) are caught too. These are the units a cavalry/
 * chariot rider AVOIDS (RULE 1): it shuns the spear wall and rides for the enemy
 * horse and skirmishers instead.
 */
function isAntiCavSpear(bu: BattleUnit): boolean {
  const cat = normName(String(bu.kategoria ?? ''));
  if (cat === 'wlocznik' || cat === 'falanga' || cat === 'pikinier') return true;
  const n = normName(String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa ?? ''));
  return n.includes('wloczn') || n.includes('spear') || n.includes('pike') ||
         n.includes('falang') || n.includes('phalan') || n.includes('hoplit') ||
         n.includes('sarissa') || n.includes('impi') || n.includes('pikin');
}

/**
 * TRUE for a PHALANX unit (Greek phalanx + culture variants: hoplite, sarissa,
 * pike block). RULE 2 keeps these in an EVEN LINE so they are never flanked.
 * Detected by normalised CATEGORY ('falanga') with a NAME fallback. A wlocznik
 * (loose spearman) is anti-cavalry (RULE 1) but is NOT a dense phalanx, so the
 * line-cohesion rule applies only to the falanga family here.
 */
function isPhalanx(bu: BattleUnit): boolean {
  const cat = normName(String(bu.kategoria ?? ''));
  if (cat === 'falanga') return true;
  const n = normName(String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa ?? ''));
  return n.includes('falang') || n.includes('phalan') || n.includes('hoplit') ||
         n.includes('sarissa');
}

/**
 * TRUE for a SIEGE MACHINE unit (Taran / Katapulta / Wieza obleznicza).
 * Only siege machines deal real damage to the gate; regular units deal ~0.
 * Detected by "Typ" === "Siege" in stats (the units.json field set for these
 * three unit types). NAME fallback covers any naming variants.
 */
function isSiegeUnit(bu: BattleUnit): boolean {
  const typ = String((bu.stats as any)?.['Typ'] ?? '').trim();
  if (typ === 'Siege') return true;
  const n = normName(String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa ?? ''));
  return n.includes('taran') || n.includes('katapult') || n.includes('wieza oblezn') ||
         n.includes('battering') || n.includes('catapult') || n.includes('siege tower');
}

/** True if bu is specifically a SIEGE TOWER (wieża oblężnicza), used for wall-climb logic. */
function isSiegeTower(bu: BattleUnit): boolean {
  const n = normName(String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa ?? ''));
  return n.includes('wieza oblezn') || n.includes('siege tower');
}

/**
 * Reorder one side's units so MOUNTED units (cavalry / chariots) deploy on the
 * WINGS -- the top and bottom rows at the two ends of the rank axis -- instead
 * of trailing in a partial rear rank. The placement loop fills the array rank by
 * rank, each rank a straight line of `perRank` rows from top (rowIdx 0) to bottom
 * (rowIdx perRank-1); so the flank slots are the LOW and HIGH rowIdx of the FRONT
 * rank. We split the mounted units half to the top wing, half to the bottom wing
 * of the front rank, with the foot units filling the centre and the rear ranks.
 * Returns a NEW array (input order otherwise preserved). No geometry here.
 */
function arrangeFlankCavalry(units: BattleUnit[]): BattleUnit[] {
  const mounted = units.filter(isMounted);
  if (mounted.length === 0) return units.slice();
  const foot = units.filter(u => !isMounted(u));

  const perRank = Math.max(1, Math.min(RANK_WIDTH, BF_ROWS));
  // Mounted units split evenly to the two wings of the FRONT rank. Cap to half
  // the rank per wing so they never crowd out the whole front line.
  const maxPerWing = Math.max(1, Math.floor(perRank / 2));
  const topCount = Math.min(Math.ceil(mounted.length / 2), maxPerWing);
  const botCount = Math.min(mounted.length - topCount, maxPerWing);
  const topWing = mounted.slice(0, topCount);
  const botWing = mounted.slice(topCount, topCount + botCount);
  // Any mounted beyond the wing cap fall back to the centre with the foot.
  const extraMounted = mounted.slice(topCount + botCount);

  // Front rank = [topWing ... foot/extra centre ... botWing]; the remaining foot
  // forms the rear ranks (appended after the full front rank).
  const centreBudget = Math.max(0, perRank - topWing.length - botWing.length);
  const centre = [...extraMounted, ...foot].slice(0, centreBudget);
  const rear   = [...extraMounted, ...foot].slice(centreBudget);

  return [...topWing, ...centre, ...botWing, ...rear];
}

/**
 * Spear/phalanx-type defenders brace and NEGATE the attacker's charge bonus
 * (Uderzenie) when the attacker moved in. Mirrors the private negatesCharge()
 * rule inside combat.ts so a single blow matches the canonical model.
 */
function bracesAgainstCharge(bu: BattleUnit): boolean {
  const s: Record<string, unknown> = (bu.stats as Record<string, unknown>) ?? {};
  const name = String((s['Jednostka'] as string) ?? bu.kategoria ?? '').toLowerCase();
  return (
    name.includes('wlocznik') ||
    name.includes('falanga') ||
    name.includes('impi') ||
    name.includes('wloczn')
  );
}

/**
 * True for a "fights to the death" unit that IGNORES morale rout and only
 * leaves the field at HP <= 0. Two data signals (matching src/game/siege.ts and
 * the units.json Uwagi convention):
 *   1) a null / blank "Prog dezercji (% health)" -- siege.ts: "null/undefined =>
 *      never routs from morale (fights to 0 HP), e.g. militia/garrison".
 *   2) an Uwagi note containing "walczy do smierci" (fights to death) or
 *      "niezlomny" (unbreakable). The note is matched diacritic-insensitively.
 * Everything else has a finite desertion threshold and CAN rout from morale.
 */
function isNeverRout(bu: BattleUnit): boolean {
  const s: Record<string, unknown> = (bu.stats as Record<string, unknown>) ?? {};
  // Morale-only model (battle-side): never routs only if flagged "fights to
  // death" in Uwagi, or its 'Morale ucieczki' level is blank.
  const flee = statField(s, 'Morale ucieczki', 'Morale ucieczki');
  const fleeBlank = flee === null || flee === undefined || flee === '' || flee === '---' || !Number.isFinite(Number(flee));
  const uwagi = normName(String((s['Uwagi'] as string) ?? ''));
  if (uwagi.includes('walczy do smierci') || uwagi.includes('niezlomny')) return true;
  if (fleeBlank) return true;
  return false;
}

/**
 * Per-unit MORALE rout threshold as a FRACTION (0..1): the unit breaks + flees
 * when its current morale drops below this share of its starting morale. Read
 * from the data column 'Prog ucieczki (% morale)' (accent-tolerant), a percent
 * (e.g. 35 => 0.35). Different units break at different morale per Naster.
 * Falls back to ROUT_MORALE_THRESHOLD when absent/invalid; clamped 5..90%.
 */
function moraleBaseFor(bu: BattleUnit): number {
  const s: Record<string, unknown> = (bu.stats as Record<string, unknown>) ?? {};
  const raw = statField(s, 'Morale bazowe', 'Morale bazowe');
  const v = typeof raw === 'number' ? raw : parseFloat(String(raw));
  if (!Number.isFinite(v)) return MORALE_START;
  return Math.max(10, Math.min(300, v));
}

/** Per-unit ABSOLUTE morale level at which the unit breaks + flees ('Morale ucieczki'). */
function fleeMoraleFor(bu: BattleUnit): number {
  const s: Record<string, unknown> = (bu.stats as Record<string, unknown>) ?? {};
  const raw = statField(s, 'Morale ucieczki', 'Morale ucieczki');
  const v = typeof raw === 'number' ? raw : parseFloat(String(raw));
  if (!Number.isFinite(v)) return 25;
  return Math.max(0, Math.min(295, v));
}

// ---------------------------------------------------------------------------
// Ranged projectile kinds + mesh factory (visual differentiation by weapon)
// ---------------------------------------------------------------------------

/** The kind of flying projectile a ranged attacker fires (visual only). */
type ProjectileKind = 'arrow' | 'javelin' | 'pilum' | 'sling';

/** Strip diacritics + lowercase, matching testBattle's normalizeForMatch. */
function normName(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[łŁ]/g, 'l').toLowerCase();
}

/**
 * Classify the projectile a ranged attacker throws/shoots, from its model
 * CATEGORY (already normalised: 'lucznik'/'procarz'/'oszczepnik'/'legionista'/
 * 'rydwan' ...) with a normalised-NAME fallback so it is robust across both the
 * test-battle and the real-battle BattleUnit builders. Visual ONLY -- never
 * touches combat. Bow units (archers, crossbows, chariot archers) -> 'arrow';
 * slingers -> 'sling' pellet; javelineers -> 'javelin'; Legionista -> 'pilum'
 * (a heavy javelin). Anything unrecognised defaults to the slim arrow.
 */
function projectileKind(bu: BattleUnit): ProjectileKind {
  const s: Record<string, unknown> = (bu.stats as Record<string, unknown>) ?? {};
  const cat  = normName(String(bu.kategoria ?? ''));
  const name = normName(String((s['Jednostka'] as string) ?? bu.nazwa ?? ''));
  const hay  = cat + ' ' + name;
  if (hay.includes('legionist')) return 'pilum';
  if (cat === 'procarz' || hay.includes('procar') || hay.includes('sling')) return 'sling';
  if (cat === 'oszczepnik' || hay.includes('oszczep') || hay.includes('javelin') || hay.includes('atlatl') || hay.includes('estolic')) return 'javelin';
  if (cat === 'lucznik' || cat === 'rydwan' || hay.includes('luczn') || hay.includes('archer') || hay.includes('kusznik') || hay.includes('rydwan') || hay.includes('chariot')) return 'arrow';
  return 'arrow';
}

/**
 * Build the projectile mesh for a given weapon kind, laid out along LOCAL +X
 * (point at the +X end) so the caller can aim it with a single setFromUnitVectors
 * quaternion. Returns the group plus its geometries/materials so the caller can
 * register them for disposal. Dimensions are in world units (TILE_S-relative):
 *
 *   arrow   : VERY thin, SHORT shaft + tiny iron head + small tail fletch.
 *   javelin : clearly LONGER and THICKER shaft + bigger head (>> arrow).
 *   pilum   : heavy javelin -- long thick shaft + a slim iron shank + head.
 *   sling   : a tiny round stone (no shaft).
 */
function makeProjectileMesh(kind: ProjectileKind): {
  group: THREE.Group;
  geos:  THREE.BufferGeometry[];
  mats:  THREE.Material[];
} {
  const group = new THREE.Group();
  const geos:  THREE.BufferGeometry[] = [];
  const mats:  THREE.Material[]       = [];

  // Shared matte materials (no fireball glow): brown wood + grey iron + stone.
  const woodMat  = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.95, metalness: 0.0, emissive: 0x000000 });
  const ironMat  = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.6,  metalness: 0.5, emissive: 0x000000 });

  if (kind === 'sling') {
    // A tiny round stone -- no shaft, just a small low-poly sphere.
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a8378, roughness: 0.9, metalness: 0.0, emissive: 0x000000 });
    const r = TILE_S * 0.05;
    const stoneGeo = new THREE.SphereGeometry(r, 8, 6);
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    stone.castShadow = true;
    group.add(stone);
    geos.push(stoneGeo); mats.push(stoneMat, woodMat, ironMat); // dispose the unused shared mats too
    return { group, geos, mats };
  }

  // Shaft + head dimensions per kind. The ARROW is deliberately MUCH thinner
  // and shorter than the JAVELIN (~3x thinner, ~half the length) so the two
  // read as clearly different weapons in flight.
  let shaftLen: number, shaftR: number, headLen: number, headR: number;
  let headColor: 'wood' | 'iron' = 'iron';
  if (kind === 'arrow') {
    shaftLen = TILE_S * 0.34;   // short
    shaftR   = TILE_S * 0.009;  // very thin
    headLen  = TILE_S * 0.06;
    headR    = shaftR * 2.6;
  } else if (kind === 'javelin') {
    shaftLen = TILE_S * 0.60;   // long
    shaftR   = TILE_S * 0.028;  // thick (>> arrow)
    headLen  = TILE_S * 0.14;
    headR    = shaftR * 2.0;
  } else { // pilum -- heavy javelin
    shaftLen = TILE_S * 0.55;
    shaftR   = TILE_S * 0.024;
    headLen  = TILE_S * 0.13;
    headR    = shaftR * 1.8;
  }

  const shaftGeo = new THREE.CylinderGeometry(shaftR, shaftR, shaftLen, 6);
  const shaft    = new THREE.Mesh(shaftGeo, woodMat);
  shaft.rotation.z = -Math.PI / 2;        // lay along +X
  shaft.castShadow = true;
  group.add(shaft);
  geos.push(shaftGeo);

  const headGeo = new THREE.ConeGeometry(headR, headLen, 6);
  const headMat = headColor === 'iron' ? ironMat : woodMat;
  const head    = new THREE.Mesh(headGeo, headMat);
  head.rotation.z = -Math.PI / 2;
  head.position.x = shaftLen * 0.5 + headLen * 0.5;  // point at the +X tip
  head.castShadow = true;
  group.add(head);
  geos.push(headGeo);

  if (kind === 'pilum') {
    // Slim iron shank between shaft and head (the classic pilum look).
    const shankLen = TILE_S * 0.18;
    const shankR   = shaftR * 0.45;
    const shankGeo = new THREE.CylinderGeometry(shankR, shankR, shankLen, 5);
    const shank    = new THREE.Mesh(shankGeo, ironMat);
    shank.rotation.z = -Math.PI / 2;
    shank.position.x = shaftLen * 0.5 + shankLen * 0.5;
    shank.castShadow = true;
    head.position.x  = shaftLen * 0.5 + shankLen + headLen * 0.5;
    group.add(shank);
    geos.push(shankGeo);
  } else if (kind === 'arrow') {
    // Tiny flat fletching at the tail (-X end): a very small thin cone.
    const fletchLen = TILE_S * 0.05;
    const fletchR   = shaftR * 3.2;
    const fletchGeo = new THREE.ConeGeometry(fletchR, fletchLen, 4);
    const fletch    = new THREE.Mesh(fletchGeo, woodMat);
    fletch.rotation.z = Math.PI / 2;       // flare points back toward -X
    fletch.position.x = -(shaftLen * 0.5);
    group.add(fletch);
    geos.push(fletchGeo);
  }

  mats.push(woodMat, ironMat);
  return { group, geos, mats };
}

// ---------------------------------------------------------------------------
// Square-grid helpers (col,row) -- self-contained, no hexutil.
// ---------------------------------------------------------------------------

/** World position of the CENTRE of tile (col,row). Tiles are TILE_S apart. */
function cellToWorld(col: number, row: number): { x: number; z: number } {
  return { x: col * TILE_S, z: row * TILE_S };
}

function cellKey(col: number, row: number): string { return col + ',' + row; }

/**
 * The Y of the VISIBLE walking surface on tile (col,row) -- the height a unit's
 * FEET rest at so it stands ON the terrain instead of sinking into it. This is
 * the battle-grid analogue of the world map's terrainTopY (render/units.ts):
 *
 *   - Hills  -> HILL_SUMMIT_Y (the apex of the raised grass dome drawn on the
 *               tile). The SAME constant scales the dome, so the surface and the
 *               bump stay locked together.
 *   - River / Ford -> -RIVER_DROP. Deep River is impassable (units never stand
 *               there); a Ford is waded across, so matching the sunken water
 *               slab keeps a unit mid-ford at the channel surface.
 *   - Plains / Forest / Rocks -> 0. Forest trees + rocks are decorations placed
 *               AROUND the figure on flat ground, so the unit stands at y=0.
 *
 * Used by deployment, the move animation (lerped between source + dest tops),
 * melee/ranged anchors and HP-bar/label placement so everything tracks the lift.
 */
function tileTopY(tm: BattleTerrainMap, col: number, row: number): number {
  switch (tm.at(col, row)) {
    case BTerrain.Hills:           return HILL_SUMMIT_Y;
    case BTerrain.River:
    case BTerrain.Ford:            return -RIVER_DROP;
    default:                       return 0; // Plains, Forest, Rocks: flat ground
  }
}

/** Manhattan (4-directional) distance in tiles. */
function manhattan(ac: number, ar: number, bc: number, br: number): number {
  return Math.abs(ac - bc) + Math.abs(ar - br);
}

/**
 * Convert a facing Dir (N/E/S/W) into a Three.js rotation.y (yaw) so the unit
 * model visibly turns to face that grid direction. The model's forward axis is
 * +X at yaw 0, and a positive yaw turns +X toward -Z, hence atan2(-dz, dx) over
 * the direction's WORLD delta (taken from cellToWorld so it matches geometry).
 */
function dirYaw(d: Dir): number {
  const delta = DIR_DELTA[d] ?? DIR_DELTA[Dir.E]!;
  const w = cellToWorld(delta[0], delta[1]);
  return Math.atan2(w.x, w.z); // model front = +Z (twarz ku +Z); obroc +Z w strone kierunku
}

// ---------------------------------------------------------------------------
// Internal runtime unit
// ---------------------------------------------------------------------------

interface RuntimeBattleUnit {
  bu:           BattleUnit;
  group:        THREE.Group;
  hpBarFg:      THREE.Mesh;
  hpBarBg:      THREE.Mesh;
  hpBarGroup:   THREE.Group;
  // MORALE bar (top) -- green->red gradient by current morale fraction.
  moraleBarFg:  THREE.Mesh;
  moraleBarBg:  THREE.Mesh;
  // AMMO bar (middle, BLUE) -- only present/visible for ranged units with
  // finite ammo; tracks ammoLeft/ammoMax and hides when empty/melee-only.
  ammoBarFg:    THREE.Mesh;
  ammoBarBg:    THREE.Mesh;
  ammoBarShown: boolean;  // true only when this unit ever shows an ammo bar (ranged + finite ammo)
  q:            number;   // COLUMN (grid x); kept as `q` to minimise churn
  r:            number;   // ROW (grid z); kept as `r` to minimise churn
  side:         'atk' | 'def';
  dead:         boolean;
  fadingOut:    boolean;
  fadeStart:    number;
  acted:        boolean;
  moveLeft:     number;
  range:        number;   // attack range in tiles (0 => melee adjacency only)
  ranged:       boolean;  // base ranged capability (kept for back-compat)
  rangedBase:   boolean;  // base ranged capability; actual shooting gated by ammoLeft (see canShoot)
  primaryRanged: boolean; // TRUE for a unit whose PRIMARY weapon is ranged (archer/slinger/javelin skirmisher).
                          // FALSE for a melee unit that merely carries throwing ammo (Legionista pilum): such a
                          // unit charges into melee once out of ammo. Drives the 1A out-of-ammo FALL-BACK: a
                          // primary shooter with no ammo retreats behind its own line instead of charging.
  ammoLeft:     number;   // throwing projectiles remaining; 0 => fights as pure melee from here on
  ammoMax:      number;   // starting finite ammo (for the ammo bar fraction); Infinity for pure shooters
  // OUT-OF-AMMO FALL-BACK tracking (TASK 4): when a PRIMARY shooter first runs
  // dry it records the column it stood on (dryCol). It then retreats only until
  // it is FALLBACK_TILES tiles back from that column OR FALLBACK_TILES tiles from
  // the nearest threat, after which heldAfterFallback latches and it HOLDS its
  // ground (no more retreating), fighting only if an enemy reaches it adjacent.
  dryCol:           number;  // side-relative advance column where ammo ran out; -1 until dry
  heldAfterFallback: boolean; // latched once it has fallen back ~3 tiles -> stop retreating
  mounted:      boolean;  // RULE 1: cavalry / chariot -- uses the cavalry target-priority picker
  antiCavSpear: boolean;  // RULE 1: spear/phalanx that counters cavalry -- cavalry avoids these
  phalanx:      boolean;  // RULE 2: phalanx line unit -- keeps the even line / never gets flanked
  facing:       Dir;      // FACING direction (N/E/S/W) toward the enemy line
  // --- Morale / rout (scene-side; resolveCombat untouched) ---
  morale:       number;   // CURRENT morale pool (0..MORALE_START)
  moraleMax:    number;   // starting morale (= MORALE_START) for the rout fraction
  neverRout:    boolean;  // elite / "walczy do smierci": ignores morale, fights to 0 HP
  routed:       boolean;  // has broken and is fleeing -- counts as OUT for victory
  screenLostApplied: boolean; // -50% morale raz, gdy strona straci ostatnia jedn. wrecz
  fleeStuck:    number;   // tury zablokowanej ucieczki -> po 2 znika z pola (nie zamarza)
  surroundApplied:   boolean; // -MORALE_SURROUND_HIT raz, gdy >=3 wrogow przylega (otoczenie)
  fleeMorale:   number;   // rout when morale <= fleeMorale (per-unit 'Morale ucieczki'); moraleMax = per-unit base morale
  removed:      boolean;  // fully removed from the scene (model + bars disposed) after crossing its home edge
  // SIEGE v2: wall walkway flag. Set TRUE for a defender placed on the wall
  // walkway (col = siegeWallCol). Wall defenders STAY ON THE WALL: they never
  // step off voluntarily. They gain +1 shooting range (elevation bonus). They
  // can engage melee attackers standing adjacent at the wall base (col-1) or
  // attackers who climbed via a siege tower (onWallWalkway too).
  // Attackers can also get this flag after mounting via a siege tower.
  onWallWalkway: boolean;
  playerOrder:   { type: 'none' } | { type: 'hold' } | { type: 'move'; col: number; row: number } | { type: 'attack'; targetId: string };
  // --- Tryby recz. sterowania ---
  rangedKite:       boolean; // true = kituje (domyslnie); false = stoi i bije bez cofania
  shootingEnabled:  boolean; // true = uzywa ataku dystansowego; false = idzie wrecz
  // --- GRUPOWANIE (zakres 1-5) ---
  /** Identyfikator grupy (np. "G1"), null gdy nie w grupie. */
  groupId:      string | null;
  /** Wzgledny offset {dc, dr} od centroidu grupy w chwili grupowania (formacja pierwotna). */
  formationOffset: { dc: number; dr: number } | null;
  mats:         THREE.Material[];
  perTokenGeos: THREE.BufferGeometry[];
}

// ---------------------------------------------------------------------------
// Floating damage number
// ---------------------------------------------------------------------------

interface FloatLabel {
  elem:      HTMLDivElement;
  startTime: number;
  duration:  number;
  worldPos:  THREE.Vector3;
  riseRate:  number;
}

// ---------------------------------------------------------------------------
// Default TEST-BATTLE composition (the "T" key battle) -- BRIDGE to testBattle.ts
//
// The test-battle composition + terrain are DATA owned by src/battle/testBattle.ts
// (its PRESETS / buildTestArmies). main.ts::launchTestBattle() lives outside this
// module's edit lane, so on "T" it still hands us its canned 4 Legionista vs 4
// Falanga roster. We DETECT that exact canned signature here and, when seen,
// rebuild BOTH armies from testBattle's DEFAULT preset ("rzym_grecja" = 60 per
// side / 120 total) using the real stat rows from data.units. Any OTHER battle
// (a real in-game fight) passes through completely unchanged.
//
// NOTE for SILNIK: this detect-and-swap is only a bridge so "T" works without
// editing main.ts. main.ts can later build the test battle directly in ONE line
//   const { attacker, defender, teren } = buildTestArmies(data.units);
// and drop the canned 4v4 roster entirely -- that change is out of this lane.
// ---------------------------------------------------------------------------

/**
 * If `opts` is the canned launchTestBattle roster (4 Legionista vs 4 Falanga,
 * ids atk0..atkN / def0..defN), return a fresh BattleOpts whose two armies are
 * rebuilt from testBattle's default preset (buildTestArmies). Otherwise return
 * `opts` unchanged.
 */
function expandTestBattleComposition(opts: BattleOpts): BattleOpts {
  const a = opts.attacker ?? [];
  const d = opts.defender ?? [];
  const units = (opts.data && (opts.data as any).units) as any[] | undefined;

  // Accept both old name ('Legionista') and new name ('Hastati') for backward compat.
  const isCannedSide = (arr: BattleUnit[], idPrefix: string, names: string[]): boolean =>
    arr.length > 0 &&
    arr.length <= 8 && // launchTestBattle ships exactly 4; allow a little slack
    arr.every(u => new RegExp('^' + idPrefix + '\\d+$').test(u.id) && names.includes(u.nazwa));

  const canned =
    Array.isArray(units) &&
    isCannedSide(a, 'atk', ['Hastati', 'Legionista']) &&
    isCannedSide(d, 'def', ['Falanga']);

  if (!canned) return opts;

  // Build the spec'd test battle from testBattle.ts (DEFAULT preset).
  const armies = buildTestArmies(units!);

  // Safety: if the build produced nothing (data missing), keep the originals.
  if (armies.attacker.length === 0 || armies.defender.length === 0) return opts;

  return { ...opts, attacker: armies.attacker, defender: armies.defender, teren: armies.teren };
}

// ---------------------------------------------------------------------------
// BattleScene
// ---------------------------------------------------------------------------

/** Typ formacji grupy. F1=dystans-przod, F2=melee-przod, F3=oblezenie. */
type GroupFormation = 'F1' | 'F2' | 'F3';

export class BattleScene {
  private canvas:   HTMLCanvasElement;
  private overlay:  HTMLDivElement;
  private hint:     HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene:    THREE.Scene;
  private camera:   THREE.PerspectiveCamera;

  // --- PROCEDURAL AUDIO (Web Audio API; no external files) -----------------
  // ONE AudioContext, created LAZILY on the first user gesture (autoplay
  // policy). Everything is GUARDED so a missing/blocked AudioContext never
  // throws (headless/SSR/jsdom has no AudioContext -> silent no-op). Master
  // gain stays low (~0.25 SFX) so rapid battle events don't become a wall of
  // sound; SFX are throttled (min gap + thinned at high speed). A very light
  // ambient bed (drone + soft drum, gain ~0.07) loops while the battle runs.
  private _ac:          AudioContext | null = null;   // null until first gesture
  private _acTried      = false;             // attempted init (don't retry if blocked)
  private _masterGain:  GainNode | null = null;        // SFX bus (~0.25)
  private _ambGain:     GainNode | null = null;        // ambient bus (~0.07)
  private _ambNodes:    Array<{ stop?: () => void }> = []; // ambient oscillators/timers
  private _ambDrumTimer: ReturnType<typeof setInterval> | null = null;
  private _ambTimers:   Array<ReturnType<typeof setInterval>> = []; // all ambient schedulers
  private _audioMuted   = false;             // M-key toggle (default ON => not muted)
  private _audioStarted = false;             // ambient started (after gesture)
  private _lastHitAt    = 0;                 // wall-time of last melee/ranged SFX (throttle)
  private _lastShotAt   = 0;

  // --- Camera dolly-zoom + drag-pan state (B9) ---
  // The camera always looks at camTarget along the fixed unit direction camDir.
  // ZOOM is a DOLLY along camDir (distance from the target), smoothly eased each
  // frame toward camDistTarget and clamped to [camDistMin, camDistMax]. PAN
  // drags camTarget across the ground plane (left-button drag on the canvas).
  private camTarget   = new THREE.Vector3();
  private camDir      = new THREE.Vector3(0, 0.92, 0.92).normalize();
  private camDist     = 30;   // current distance (eased)
  private camDistTarget = 30; // desired distance (set by wheel / +/- keys)
  private camDistMin  = 6;    // closest zoom -- individual figures fill the view
  private camDistMax  = 70;   // farthest zoom -- whole field in shot

  // Drag-pan bookkeeping.
  private panning   = false;
  private panLastX  = 0;
  private panLastY  = 0;

  // --- Faza rozstawiania (deploy) ---
  /** Tryb rozstawiania: gracz przesuwa jednostki przed walka. */
  private deployPhase = false;
  /** Zaznaczona jednostka atakujaca do przeniesienia. */
  private _deploySelected: RuntimeBattleUnit | null = null;
  /** Meshe strefy startowej (podswietlenie kol 0-12). */
  private _deployZoneMeshes: THREE.Mesh[] = [];
  /** Overlay fazy rozstawiania. */
  private _deployOverlay: HTMLDivElement | null = null;
  /** Poczatek klikniecia — do rozrozniania klik vs pan. */
  private _pointerDownPos: { x: number; y: number } | null = null;
  // --- BOX-SELECT (ramka zaznaczenia) ---
  private _boxSelectDiv: HTMLDivElement | null = null;
  private _boxSelectStart: { x: number; y: number } | null = null;
  // --- STEROWANIE RECZNIE (faza walki) ---
  /** Tryb recznego sterowania jednostkami gracza. Domyslnie false = AUTO. */
  private _manualMode = true;
  /** Zaznaczone jednostki gracza (id). */
  private _selectedUnits = new Set<string>();
  /** Dolny pasek kart jednostek (roster). */
  private _rosterBar: HTMLDivElement | null = null;
  /** Przycisk AUTO/RECZNE w HUD. */
  private _manualBtn: HTMLButtonElement | null = null;
  /** Baner trybu (AUTO/RECZNE). */
  private _modeBanner: HTMLDivElement | null = null;
  /** Meshes obwodek zaznaczenia (jeden ring per jednostka). */
  private _selectionRings = new Map<string, THREE.Mesh>();
  // --- GRUPY (zakres 1-5) ---
  /** Mapa groupId -> zbior id jednostek nalezacych do grupy. */
  private _groups = new Map<string, Set<string>>();
  /** Licznik do generowania unikalnych groupId. */
  private _groupCounter = 0;
  // --- PROFESSIONAL HUD (TotalWar-style) ---
  /** Gorny pasek HUD (tura, predkosc, morale, straty). */
  private _topBar: HTMLDivElement | null = null;
  /** Label tury w gornym pasku. */
  private _topTurnLbl: HTMLSpanElement | null = null;
  /** Label predkosci w gornym pasku. */
  private _topSpeedLbl: HTMLSpanElement | null = null;
  /** Paski morale armii (gorny pasek). */
  private _topMoraleA: HTMLDivElement | null = null;
  private _topMoraleD: HTMLDivElement | null = null;
  /** Label strat ATK / DEF. */
  private _topCasA: HTMLSpanElement | null = null;
  private _topCasD: HTMLSpanElement | null = null;
  /** Panel zaznaczonej jednostki (srodek dolnej czesci). */
  private _selPanel: HTMLDivElement | null = null;
  /** Mapa id->element karty rostera (per-unit, NIE per-typ). */
  private _unitCards = new Map<string, HTMLDivElement>();
  /** Licznik strat (padli + uciekli) per strona. */
  private _deadCountA = 0;
  private _deadCountD = 0;
  private _routCountA = 0;
  private _routCountD = 0;

  private atk: RuntimeBattleUnit[] = [];
  private def: RuntimeBattleUnit[] = [];
  private occByKey = new Map<string, RuntimeBattleUnit>();
  /** Oryginalne BattleUnit[] atakujacych — zapisane przy _placeUnits dla potrzeb Reset. */
  private _savedAtkBUs: BattleUnit[] = [];

  // --- Siege state ---
  /** The wall mesh group (siegeWall.ts output), or null in non-siege battles. */
  private siegeWallGroup: THREE.Group | null = null;
  /** Column on the battlefield where the siege wall is placed. */
  private siegeWallCol: number = -1;
  /** Column(s) of the gate tile. */
  private siegeGateCol: number = -1;
  /** Row of the gate tile (centre row). */
  private siegeGateRow: number = -1;
  /** Current HP of the gate (starts at GATE_MAX_HP, 0 = breached). */
  private gateHp: number = 0;
  /** Whether the gate has been breached (HP <= 0). */
  private gateOpen: boolean = false;
  /** Row range of the wall on the battlefield (inclusive). */
  private siegeWallRowLo: number = -1;
  private siegeWallRowHi: number = -1;
  /**
   * SIEGE v2: set of row values where a friendly siege tower has reached the
   * wall base (col = siegeWallCol-1). Attacking infantry adjacent to a tower
   * at these rows may "climb" onto the wall walkway.
   */
  private towerAtWallRows = new Set<number>();
  /** HP per-tile muru (klucz: row). 0 = wyburzony. */
  private wallTileHp = new Map<number, number>();
  /** Max HP pojedynczego kafla muru. */
  private static readonly WALL_TILE_HP = 640;
  /** HUD: pasek HP bramy + kafla muru. */
  private siegeHudDiv: HTMLDivElement | null = null;
  /** Ostatnio atakowany rząd muru (do wyświetlania HP). */
  private lastAttackedWallRow: number = -1;

  private ownedMats: THREE.Material[]       = [];
  private ownedGeos: THREE.BufferGeometry[] = [];

  private animFrameId: number | null = null;
  private started  = false;
  private finished = false;

  // True while a single action (move/attack) animation is running; the turn
  // scheduler waits for it before activating the next unit.
  private busy = false;

  // -------------------------------------------------------------------------
  // BATTLE SPEED (time-scale). Every piece of battle PACING -- tile walks,
  // melee lunges, projectile flight, the _schedule() gaps between actions /
  // turns, death fades and damage labels -- is timed against a VIRTUAL clock
  // (_vNow) instead of the wall clock. The virtual clock advances once per
  // render frame by (wall delta) * SPEED, so multiplying SPEED simply makes
  // virtual time pass faster: the WHOLE battle plays N times quicker while
  // every animation, hit moment and pause keeps its exact relative shape.
  //
  // Crucially this is PURELY a time-scale: resolveCombat / _singleBlow / the
  // hit rolls / damage math never see the speed factor, so the OUTCOME of a
  // battle is identical at 1x / 2x / 4x / 8x / 16x -- only the playback rate
  // changes. Default 1x. The factor can be changed LIVE mid-battle via the
  // overlay button (cycles 1 -> 2 -> 4 -> 8 -> 16 -> 1) and is mirrored by an
  // always-visible on-map HUD label ("Predkosc: Nx").
  //
  // ROOT-CAUSE FIX (speed "didn't work"): the previous _schedule() polled with
  // requestAnimationFrame -- a scheduled gap only resolved when a frame ran, so
  // it could fire at most ONCE per frame (~60/s) no matter the multiplier. The
  // continuous animations (interpolated off vNow) sped up, but the DISCRETE
  // pacing -- the gaps between blows and the turn transitions, which form a
  // self-rescheduling chain -- was frame-capped, so past ~2-4x the battle
  // stopped getting faster. Timers now live in a VIRTUAL-TIME QUEUE drained
  // each frame (_drainTimers): every timer whose due-time has passed within the
  // frame's virtual budget fires THAT frame, with an internal cursor advancing
  // to each due time so a chain of short gaps catches up fully. Throughput now
  // scales linearly to 16x (verified in a /tmp sim).
  private static readonly SPEED_STEPS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512] as const;
  private speedIdx   = 0;            // index into SPEED_STEPS; 0 => 1x default
  private speedMul   = 1;            // current multiplier (SPEED_STEPS[speedIdx])
  private vNow       = 0;            // virtual (speed-scaled) clock in ms
  private vLastWall  = 0;            // last wall-clock timestamp used to advance vNow
  private paused = false;            // P-key pause: when true the virtual clock is frozen
  private _stallSig = ''; private _stallTurns = 0; private _stalled = false;
  private pauseHud: HTMLDivElement | null = null;
  private muteHud:  HTMLDivElement | null = null;  // tiny audio on/off indicator
  private speedBtn:  HTMLButtonElement | null = null; // overlay speed control (cycle button)
  private speedHud:  HTMLDivElement   | null = null;  // always-visible on-map speed label
  // Virtual-time timer queue (replaces per-callback rAF polling). Each entry
  // fires its cb when vNow >= due; _drainTimers() empties it every frame.
  private vTimers: { due: number; cb: () => void; id: number }[] = [];
  private vTimerSeq = 0;             // monotonic id for stable ordering of equal-due timers

  // CHANGE2: master visibility toggle for ALL over-head stat bars (morale/ammo/
  // HP), flipped by the "H" key. Default true (bars shown). When false every
  // living unit's billboard bar GROUP is hidden; toggling back on restores it
  // (dead/removed units stay hidden -- they are skipped). Per-bar visibility
  // (e.g. ammo only for ranged) lives on the child meshes and is untouched, so
  // hiding/showing the parent group preserves the ammo-only-for-ranged rule.
  private barsVisible = true;

  // BATTLE LOG panel (top-RIGHT of the overlay -- the speed HUD + the cycle
  // buttons sit top-LEFT / bottom, so the right edge is free). Shows the last
  // CLASH_LOG_MAX combat clashes, NEWEST on top: "<atk name> (side) -> <def
  // name> (side): -N HP" with "(padl)" if the blow killed the defender or
  // "(rout)" if it broke its morale. clashLogEntries is the rolling buffer
  // (capped at CLASH_LOG_MAX, newest first); _renderClashLog repaints the DOM.
  private clashLog:        HTMLDivElement | null = null;
  private clashLogEntries: string[]             = [];

  // ARMY-MORALE BARS (TASK 5): two vertical meters pinned to the screen EDGES --
  // LEFT = ATTACKER army (red frame), RIGHT = DEFENDER army (blue frame). The
  // inner FILL height = that side's army-morale ratio and its colour runs
  // green -> red as the ratio drops. Updated live each frame by
  // _updateArmyMoraleBars. armyMoraleFill* is the inner coloured fill;
  // armyMoraleLabel* shows the percentage.
  private armyMoraleFillA:  HTMLDivElement | null = null;
  private armyMoraleFillD:  HTMLDivElement | null = null;
  private armyMoraleLabelA: HTMLDivElement | null = null;
  private armyMoraleLabelD: HTMLDivElement | null = null;

  private log:        string[]                            = [];
  private onFinishCb: ((r: BattleResult) => void) | null  = null;
  private onCancelCb: (() => void) | null                 = null;
  // TASK D end-of-battle freeze screen state.
  private _endScreenShown = false;
  private _endWinner: 'atakujacy' | 'obronca' | null = null;
  private _endSurvivors: BattleUnit[] = [];

  private floatLabels:  FloatLabel[]        = [];
  private fadingUnits:  RuntimeBattleUnit[] = [];
  // FUTURE HOOK (data only -- no behaviour now): identity of every unit that has
  // routed, so a future "general rally" feature could bring routed units back.
  // TODO: general rally recovery -- consume this list to respawn rallied units.
  private routedUnits:  { typeId: string; side: 'atk' | 'def'; owner: number }[] = [];
  private projectiles:  { mesh: THREE.Object3D; from: THREE.Vector3; to: THREE.Vector3; t0: number; dur: number; geos: THREE.BufferGeometry[]; mats: THREE.Material[] }[] = [];

  // resolveCombat context
  private terrain:     string;
  private terrainData: any[];
  private counters:    any[];

  // Procedural per-tile battle terrain (B8). Drives rendering, per-tile move
  // cost / passability and the per-tile defender terrain fed to the combat math.
  private terrainMap:  BattleTerrainMap;

  // Turn loop bookkeeping.
  // A TURN is one pass over EVERY living unit (both sides interleaved by
  // initiative). turnOrder is the snapshot of units to act this turn; turnIdx
  // walks it. activeSide is kept only for the opening hint.
  private activeSide: 'atk' | 'def' = 'atk';
  private roundNo = 0;
  private turnOrder: RuntimeBattleUnit[] = [];
  private turnIdx = 0;

  // Engagements that have already traded at least one blow.
  // Keyed by "attackerId>defenderId" so the charge bonus (Uderzenie) is
  // applied ONLY on the very first blow an attacker lands on a given target.
  private engaged = new Set<string>();

  // -------------------------------------------------------------------------
  constructor(opts: BattleOpts) {
    // Default test battle ("T"): swap the canned 4v4 roster for the spec'd
    // 20 Legionista + 10 Oszczepnik + 10 Lucznik per side. No-op for real fights.
    opts = expandTestBattleComposition(opts);

    this.onCancelCb  = opts.onCancel ?? null;
    this.terrain     = opts.teren;
    const d: any     = opts.data ?? {};
    this.terrainData = d.terrainCombat ?? d.terrainData ?? [];
    this.counters    = normCounters(d.counters ?? []);

    // Deterministic procedural terrain for the big square field. Seeded from the
    // battle terrain name so the same matchup terrain reproduces every run.
    this.terrainMap = generateBattleTerrain({
      cols:         BF_COLS,
      rows:         BF_ROWS,
      seed:         'bf:' + opts.teren,
      deployMargin: DEPLOY_MARGIN,
    });
    // Flatten the deploy ranks + the clash corridor to clean plains so the two
    // even lines stand on flat, even ground and reach melee fast; terrain stays
    // on the flanks (top/bottom rows + outer columns) as a backdrop.
    this._carveBattleBox();

    // SIEGE MODE: carve wall tiles into terrainMap before the scene is built.
    if (opts.siege) {
      this._carveWallTiles();
    }

    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position:       'fixed',
      inset:          '0',
      zIndex:         '9999',
      background:     'rgba(0,0,0,0.88)',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'flex-start',
    });
    document.body.appendChild(this.overlay);

    const titleBar = document.createElement('div');
    Object.assign(titleBar.style, {
      color:         '#f0d080',
      fontFamily:    'sans-serif',
      fontSize:      '18px',
      fontWeight:    'bold',
      padding:       '10px 20px 0',
      textAlign:     'center',
      textShadow:    '0 1px 4px #000',
      letterSpacing: '0.04em',
    });
    titleBar.textContent = 'Bitwa Automatyczna -- ' + opts.teren;
    this.overlay.appendChild(titleBar);

    this.hint = document.createElement('div');
    Object.assign(this.hint.style, {
      color:      '#cfe0ff',
      fontFamily: 'sans-serif',
      fontSize:   '13px',
      padding:    '2px 20px 6px',
      textAlign:  'center',
      textShadow: '0 1px 3px #000',
      minHeight:  '16px',
    });
    this.hint.textContent = 'Armie ustawiaja sie naprzeciw siebie...';
    this.overlay.appendChild(this.hint);

    this.canvas = document.createElement('canvas');
    Object.assign(this.canvas.style, {
      flex:     '1',
      width:    '100%',
      display:  'block',
      position: 'relative',
    });
    this.overlay.appendChild(this.canvas);

    // ALWAYS-VISIBLE on-map SPEED indicator (top-left HUD over the battlefield).
    // Shows the live multiplier ("Predkosc: Nx") so the player can read the
    // current battle speed on the map at all times, separate from the cycle
    // button at the bottom. Updated by _setSpeedIdx.
    const speedHud = document.createElement('div');
    Object.assign(speedHud.style, {
      position:      'absolute',
      top:           '56px',
      left:          '14px',
      padding:       '4px 12px',
      background:    'rgba(20,30,20,0.72)',
      color:         '#7be08a',
      fontFamily:    'sans-serif',
      fontSize:      '15px',
      fontWeight:    'bold',
      borderRadius:  '5px',
      border:        '1px solid rgba(123,224,138,0.4)',
      textShadow:    '0 1px 3px #000',
      letterSpacing: '0.04em',
      pointerEvents: 'none',
      zIndex:        '10005',
    });
    this.overlay.appendChild(speedHud);
    this.speedHud = speedHud;

    // PAUSE badge (hidden until P / Pauza button): a clear frozen-state indicator.
    const pauseHud = document.createElement('div');
    Object.assign(pauseHud.style, {
      position: 'absolute', top: '56px', left: '50%', transform: 'translateX(-50%)',
      padding: '5px 16px', background: 'rgba(60,20,20,0.85)', color: '#ffd54a',
      fontFamily: 'sans-serif', fontSize: '17px', fontWeight: 'bold',
      borderRadius: '6px', border: '1px solid rgba(255,213,74,0.6)',
      textShadow: '0 1px 3px #000', letterSpacing: '0.05em',
      pointerEvents: 'none', zIndex: '10006', display: 'none',
    });
    pauseHud.textContent = '|| PAUZA (P)';
    this.overlay.appendChild(pauseHud);
    this.pauseHud = pauseHud;

    // AUDIO indicator (tiny): shows mute state under the speed HUD. Audio only
    // actually starts after the first user gesture (autoplay policy).
    const muteHud = document.createElement('div');
    Object.assign(muteHud.style, {
      position: 'absolute', top: '90px', left: '14px',
      padding: '2px 10px', background: 'rgba(20,30,20,0.6)', color: '#9fb6c9',
      fontFamily: 'sans-serif', fontSize: '11px', borderRadius: '4px',
      border: '1px solid rgba(159,182,201,0.3)', textShadow: '0 1px 2px #000',
      pointerEvents: 'none', zIndex: '10005',
    });
    muteHud.textContent = 'Dzwiek: WL (M)';
    this.overlay.appendChild(muteHud);
    this.muteHud = muteHud;

    // BATTLE LOG panel -- top-RIGHT of the battlefield (the speed HUD is top-left
    // and the cycle/skip/exit buttons are along the bottom, so the right edge is
    // clear). Lists the last CLASH_LOG_MAX clashes, newest on top; small font,
    // semi-transparent dark bg, non-interactive (pointer-events off) so it never
    // eats a drag/zoom on the canvas. Repainted live by _renderClashLog.
    const clashLog = document.createElement('div');
    Object.assign(clashLog.style, {
      position:      'absolute',
      top:           '56px',
      right:         '14px',
      width:         '180px',
      maxHeight:     '46%',
      overflow:      'hidden',
      padding:       '6px 9px',
      background:    'rgba(12,12,16,0.66)',
      color:         '#e8e8ec',
      fontFamily:    'monospace, sans-serif',
      fontSize:      '11px',
      lineHeight:    '1.45',
      borderRadius:  '5px',
      border:        '1px solid rgba(255,255,255,0.16)',
      textShadow:    '0 1px 2px #000',
      pointerEvents: 'none',
      zIndex:        '10005',
      whiteSpace:    'normal',
      wordBreak:     'break-word',
    });
    this.overlay.appendChild(clashLog);
    this.clashLog = clashLog;
    this._renderClashLog(); // paint the empty-state header

    // ARMY-MORALE BARS (TASK 5): a vertical meter on each screen EDGE. LEFT edge
    // = the ATTACKER army with a RED frame; RIGHT edge = the DEFENDER army with a
    // BLUE frame. Each is an outer faction-framed track with a bottom-anchored
    // inner FILL whose height = the side's army-morale ratio and whose colour
    // runs green -> red as it drops, plus a small "%"+label cap. Pinned to the
    // overlay edges, non-interactive, updated live by _updateArmyMoraleBars.
    const makeArmyMoraleBar = (
      side: 'atk' | 'def',
      frameHex: string,
      label: string,
    ): { fill: HTMLDivElement; pct: HTMLDivElement } => {
      const track = document.createElement('div');
      Object.assign(track.style, {
        position:      'absolute',
        top:           '56px',
        bottom:        '64px',
        width:         '24px',
        [side === 'atk' ? 'left' : 'right']: '14px',
        background:    'rgba(10,10,14,0.62)',
        border:        '3px solid ' + frameHex,
        borderRadius:  '7px',
        boxShadow:     '0 0 8px ' + frameHex + '88',
        overflow:      'hidden',
        pointerEvents: 'none',
        zIndex:        '10006',
        display:       'flex',
        flexDirection: 'column',
        justifyContent:'flex-end',
      });
      const fill = document.createElement('div');
      Object.assign(fill.style, {
        width:      '100%',
        height:     '100%',          // updated live (ratio)
        background: '#4caf50',       // updated live (green -> red)
        transition: 'height 160ms linear, background 160ms linear',
      });
      track.appendChild(fill);
      // Caption: side label at the TOP of the track + a live percentage.
      const cap = document.createElement('div');
      Object.assign(cap.style, {
        position:      'absolute',
        top:           '2px',
        left:          '0',
        width:         '100%',
        textAlign:     'center',
        color:         '#fff',
        fontFamily:    'sans-serif',
        fontSize:      '9px',
        fontWeight:    'bold',
        textShadow:    '0 1px 2px #000',
        letterSpacing: '0.02em',
        pointerEvents: 'none',
      });
      cap.textContent = label;
      track.appendChild(cap);
      const pct = document.createElement('div');
      Object.assign(pct.style, {
        position:      'absolute',
        bottom:        '2px',
        left:          '0',
        width:         '100%',
        textAlign:     'center',
        color:         '#fff',
        fontFamily:    'sans-serif',
        fontSize:      '10px',
        fontWeight:    'bold',
        textShadow:    '0 1px 2px #000',
        pointerEvents: 'none',
      });
      pct.textContent = '100%';
      track.appendChild(pct);
      this.overlay.appendChild(track);
      return { fill, pct };
    };
    const barA = makeArmyMoraleBar('atk', '#e53935', 'ATK');
    const barD = makeArmyMoraleBar('def', '#1e88e5', 'OBR');
    this.armyMoraleFillA  = barA.fill;
    this.armyMoraleLabelA = barA.pct;
    this.armyMoraleFillD  = barD.fill;
    this.armyMoraleLabelD = barD.pct;

    // =====================================================================
    // PROFESSIONAL HUD — Total War style (ciemny + zlote akcenty)
    // =====================================================================

    // ----- GORNY PASEK: tura / predkosc / morale obu armii / straty -----
    const topBar = document.createElement('div');
    Object.assign(topBar.style, {
      position:       'absolute',
      top:            '0',
      left:           '0',
      right:          '0',
      height:         '48px',
      background:     'rgba(12,10,8,0.88)',
      borderBottom:   '1px solid #d4af37',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      padding:        '0 14px',
      zIndex:         '10010',
      pointerEvents:  'none',
      gap:            '8px',
    });
    this.overlay.appendChild(topBar);
    this._topBar = topBar;

    // Lewa czesc: tura + predkosc
    const topLeft = document.createElement('div');
    Object.assign(topLeft.style, { display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px' });
    topBar.appendChild(topLeft);

    const turnLbl = document.createElement('span');
    Object.assign(turnLbl.style, { color: '#d4af37', fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 'bold', letterSpacing: '0.04em' });
    turnLbl.textContent = 'TURA 1';
    topLeft.appendChild(turnLbl);
    this._topTurnLbl = turnLbl;

    const speedLbl = document.createElement('span');
    Object.assign(speedLbl.style, { color: '#7be08a', fontFamily: 'sans-serif', fontSize: '12px', fontWeight: 'bold', background: 'rgba(0,60,20,0.5)', padding: '2px 7px', borderRadius: '3px', border: '1px solid rgba(123,224,138,0.35)' });
    speedLbl.textContent = '1x';
    topLeft.appendChild(speedLbl);
    this._topSpeedLbl = speedLbl;

    // Srodek: morale ATK | VS | morale DEF + straty
    const topCenter = document.createElement('div');
    Object.assign(topCenter.style, { display: 'flex', alignItems: 'center', gap: '12px', flex: '1', justifyContent: 'center' });
    topBar.appendChild(topCenter);

    const casA = document.createElement('span');
    Object.assign(casA.style, { color: '#e57373', fontFamily: 'sans-serif', fontSize: '11px', minWidth: '80px', textAlign: 'right' });
    casA.textContent = 'ATK: 0 strat';
    topCenter.appendChild(casA);
    this._topCasA = casA;

    const moraleBlockA = document.createElement('div');
    Object.assign(moraleBlockA.style, { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', minWidth: '64px' });
    const moraleLblA = document.createElement('div');
    Object.assign(moraleLblA.style, { color: '#e53935', fontFamily: 'sans-serif', fontSize: '10px', fontWeight: 'bold' });
    moraleLblA.textContent = 'ATAKUJACY';
    moraleBlockA.appendChild(moraleLblA);
    const moraleTrackA = document.createElement('div');
    Object.assign(moraleTrackA.style, { width: '64px', height: '8px', background: 'rgba(255,255,255,0.12)', borderRadius: '4px', border: '1px solid rgba(229,57,53,0.5)', overflow: 'hidden' });
    const moraleFillA = document.createElement('div');
    Object.assign(moraleFillA.style, { width: '100%', height: '100%', background: '#4caf50', transition: 'width 200ms linear, background 200ms linear' });
    moraleTrackA.appendChild(moraleFillA);
    moraleBlockA.appendChild(moraleTrackA);
    topCenter.appendChild(moraleBlockA);
    this._topMoraleA = moraleFillA;

    const vsLbl = document.createElement('div');
    Object.assign(vsLbl.style, { color: '#d4af37', fontFamily: 'sans-serif', fontSize: '16px', fontWeight: 'bold', letterSpacing: '0.06em' });
    vsLbl.textContent = 'VS';
    topCenter.appendChild(vsLbl);

    const moraleBlockD = document.createElement('div');
    Object.assign(moraleBlockD.style, { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', minWidth: '64px' });
    const moraleLblD = document.createElement('div');
    Object.assign(moraleLblD.style, { color: '#1e88e5', fontFamily: 'sans-serif', fontSize: '10px', fontWeight: 'bold' });
    moraleLblD.textContent = 'OBRONCA';
    moraleBlockD.appendChild(moraleLblD);
    const moraleTrackD = document.createElement('div');
    Object.assign(moraleTrackD.style, { width: '64px', height: '8px', background: 'rgba(255,255,255,0.12)', borderRadius: '4px', border: '1px solid rgba(30,136,229,0.5)', overflow: 'hidden' });
    const moraleFillD = document.createElement('div');
    Object.assign(moraleFillD.style, { width: '100%', height: '100%', background: '#4caf50', transition: 'width 200ms linear, background 200ms linear' });
    moraleTrackD.appendChild(moraleFillD);
    moraleBlockD.appendChild(moraleTrackD);
    topCenter.appendChild(moraleBlockD);
    this._topMoraleD = moraleFillD;

    const casD = document.createElement('span');
    Object.assign(casD.style, { color: '#64b5f6', fontFamily: 'sans-serif', fontSize: '11px', minWidth: '80px', textAlign: 'left' });
    casD.textContent = 'OBR: 0 strat';
    topCenter.appendChild(casD);
    this._topCasD = casD;

    // Prawa czesc (reserved for future controls)
    const topRight = document.createElement('div');
    Object.assign(topRight.style, { minWidth: '120px' });
    topBar.appendChild(topRight);

    // --- DOLNY KLASTER PRZYCISKOW (Total-War style, ikony + skroty) ---
    const cmdBar = document.createElement('div');
    Object.assign(cmdBar.style, {
      position:       'absolute',
      bottom:         '0',
      left:           '50%',
      transform:      'translateX(-50%)',
      display:        'flex',
      alignItems:     'center',
      gap:            '4px',
      padding:        '5px 14px 6px',
      background:     'rgba(10,8,6,0.92)',
      borderTop:      '1px solid #d4af37',
      borderLeft:     '1px solid rgba(212,175,55,0.4)',
      borderRight:    '1px solid rgba(212,175,55,0.4)',
      borderRadius:   '10px 10px 0 0',
      zIndex:         '10012',
      boxShadow:      '0 -2px 18px rgba(0,0,0,0.7)',
    });
    this.overlay.appendChild(cmdBar);

    const makeIconBtn = (
      icon: string,
      shortcut: string,
      tooltip: string,
      bg: string,
      onClick: () => void,
    ): HTMLButtonElement => {
      const btn = document.createElement('button');
      Object.assign(btn.style, {
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        width:          '48px',
        height:         '52px',
        background:     bg,
        border:         '1px solid rgba(212,175,55,0.35)',
        borderRadius:   '6px',
        cursor:         'pointer',
        padding:        '3px 2px 2px',
        transition:     'filter 0.15s, border-color 0.15s',
        boxShadow:      '0 1px 6px rgba(0,0,0,0.5)',
      });
      btn.title = tooltip;
      const iconEl = document.createElement('div');
      Object.assign(iconEl.style, { fontSize: '20px', lineHeight: '1', userSelect: 'none' });
      iconEl.textContent = icon;
      const keyEl = document.createElement('div');
      Object.assign(keyEl.style, { fontSize: '9px', color: 'rgba(212,175,55,0.85)', fontFamily: 'sans-serif', letterSpacing: '0.06em', marginTop: '2px', userSelect: 'none' });
      keyEl.textContent = shortcut;
      btn.appendChild(iconEl);
      btn.appendChild(keyEl);
      btn.addEventListener('mouseenter', () => { btn.style.filter = 'brightness(1.35)'; btn.style.borderColor = '#d4af37'; });
      btn.addEventListener('mouseleave', () => { btn.style.filter = ''; btn.style.borderColor = 'rgba(212,175,55,0.35)'; });
      btn.addEventListener('mousedown', () => { btn.style.filter = 'brightness(0.75)'; });
      btn.addEventListener('mouseup',   () => { btn.style.filter = 'brightness(1.35)'; });
      btn.onclick = onClick;
      return btn;
    };

    const sep = (): HTMLDivElement => {
      const d = document.createElement('div');
      Object.assign(d.style, { width: '1px', height: '40px', background: 'rgba(212,175,55,0.25)', margin: '0 4px', flexShrink: '0' });
      return d;
    };

    // 1. PAUZA (P)
    const btnPause = makeIconBtn('\u23F8', 'P', 'Pauza / Wznow (P)', 'rgba(60,30,90,0.85)', () => { this._togglePause(); });
    cmdBar.appendChild(btnPause);
    this.speedBtn = null;

    // 2. Predkosc MINUS (S)
    const btnSpeedDn = makeIconBtn('\u23EA', 'S-', 'Zmniejsz predkosc (S)', 'rgba(25,50,30,0.85)', () => {
      this._setSpeedIdx(this.speedIdx - 1); this._flashSpeedHud();
    });
    cmdBar.appendChild(btnSpeedDn);

    // 3. Predkosc PLUS (S)
    const btnSpeedUp = makeIconBtn('\u23E9', 'S+', 'Zwieksz predkosc (S)', 'rgba(25,50,30,0.85)', () => {
      this._setSpeedIdx(this.speedIdx + 1); this._flashSpeedHud();
    });
    cmdBar.appendChild(btnSpeedUp);

    cmdBar.appendChild(sep());

    // 4. AUTO <-> RECZNE (R)
    const btnManual = makeIconBtn('\u{1F3AE}', 'R', 'AUTO / Reczne sterowanie (R)', 'rgba(25,35,70,0.85)', () => { this._toggleManualMode(); });
    cmdBar.appendChild(btnManual);
    this._manualBtn = btnManual as unknown as HTMLButtonElement;
    (btnManual as any)._iconEl = btnManual.children[0] as HTMLElement;

    // 5. STOP / Bron pozycji
    const btnHold = makeIconBtn('\u{1F6D1}', 'STOP', 'Stoj / Bron pozycji (zaznaczeni)', 'rgba(70,40,10,0.85)', () => { this._orderHoldSelected(); });
    cmdBar.appendChild(btnHold);

    // 6. WYCOFAJ (W)
    const btnRetreat = makeIconBtn('\u{1F3F3}', 'W', 'Wycofaj zaznaczonych', 'rgba(60,10,10,0.85)', () => { this._orderRetreatSelected(); });
    cmdBar.appendChild(btnRetreat);

    cmdBar.appendChild(sep());

    // 7. PASKI on/off (H)
    const btnBars = makeIconBtn('\u{1F4CA}', 'H', 'Paski HP/Morale on/off (H)', 'rgba(30,30,50,0.85)', () => {
      this.barsVisible = !this.barsVisible;
      for (const ru of [...this.atk, ...this.def]) {
        if (ru.dead || ru.removed) continue;
        ru.hpBarGroup.visible = this.barsVisible;
      }
      btnBars.style.filter = this.barsVisible ? '' : 'grayscale(1) brightness(0.6)';
    });
    cmdBar.appendChild(btnBars);

    // 8. DZWIEK (M)
    const btnSound = makeIconBtn('\u{1F50A}', 'M', 'Dzwiek on/off (M)', 'rgba(30,30,50,0.85)', () => {
      const ev = new KeyboardEvent('keydown', { key: 'm', bubbles: true, cancelable: true });
      window.dispatchEvent(ev);
    });
    cmdBar.appendChild(btnSound);

    cmdBar.appendChild(sep());

    // 9. POMIN -> wynik
    const btnSkip = makeIconBtn('\u23ED', 'POMIN', 'Pomin do wyniku', 'rgba(100,60,0,0.85)', () => { if (!this.finished) this.skip(); });
    cmdBar.appendChild(btnSkip);

    // 10. WYJSCIE
    const btnExit = makeIconBtn('\u274C', 'ESC', 'Wyjdz z bitwy', 'rgba(80,10,10,0.85)', () => {
      this.dispose();
      if (this.onCancelCb) this.onCancelCb();
    });
    cmdBar.appendChild(btnExit);

    this._setSpeedIdx(this.speedIdx);

    // --- PANEL ZAZNACZONEJ JEDNOSTKI ---
    const selPanel = document.createElement('div');
    Object.assign(selPanel.style, {
      position:       'absolute',
      bottom:         '170px',
      right:          '14px',
      width:          '200px',
      background:     'rgba(10,8,6,0.90)',
      border:         '1px solid rgba(212,175,55,0.5)',
      borderRadius:   '8px',
      padding:        '10px 12px',
      zIndex:         '10011',
      fontFamily:     'sans-serif',
      color:          '#e8e0d0',
      display:        'none',
      boxShadow:      '0 2px 16px rgba(0,0,0,0.7)',
    });
    this.overlay.appendChild(selPanel);
    this._selPanel = selPanel;

    // Baner trybu AUTO/RECZNE (gorny srodek) — pozostaje dla kompatybilnosci
    const modeBanner = document.createElement('div');
    Object.assign(modeBanner.style, {
      position: 'absolute',
      top: '52px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(20,40,80,0.82)',
      color: '#aaccff',
      padding: '2px 14px',
      borderRadius: '0 0 7px 7px',
      fontSize: '12px',
      fontWeight: 'bold',
      pointerEvents: 'none',
      display: 'none',
      zIndex: '20',
    });
    modeBanner.textContent = 'TRYB: AUTO';
    this.overlay.appendChild(modeBanner);
    this._modeBanner = modeBanner;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x12100e);
    this.scene.fog = new THREE.FogExp2(0x12100e, 0.012);

    // Camera centred on the SQUARE field. The field spans ~BF_COLS x BF_ROWS
    // world units; frame the whole thing at the DEFAULT zoom, then let the
    // player dolly in (wheel / + key) close enough to read individual figures
    // or out (wheel / - key) to take in both armies. See _onWheel / _onKeyZoom.
    const midCol = (BF_COLS - 1) / 2;
    const midRow = (BF_ROWS - 1) / 2;
    const { x: cx, z: cz } = cellToWorld(midCol, midRow);
    const fieldWorldW = BF_COLS * TILE_S;
    const fieldWorldH = BF_ROWS * TILE_S;
    const fieldSpan   = Math.max(fieldWorldW, fieldWorldH);

    this.camTarget.set(cx, 0, cz);
    // Default framing: whole field comfortably in view.
    this.camDist       = fieldSpan * 1.05;
    this.camDistTarget = this.camDist;
    // Clamp range: in close enough to fill the view with a few figures (units
    // are ~1 unit tall) out to a touch beyond the full-field default.
    this.camDistMin = Math.max(4, fieldSpan * 0.16);
    this.camDistMax = fieldSpan * 1.5;

    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 4000);
    this._applyCamera();

    this.scene.add(new THREE.AmbientLight(0xfff8e0, 0.58));
    const sun = new THREE.DirectionalLight(0xfff5c0, 1.25);
    sun.position.set(cx + 20, 70, cz - 30);
    sun.target.position.set(cx, 0, cz);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far  = 220;
    sun.shadow.camera.left = -fieldWorldW * 0.6;
    sun.shadow.camera.right = fieldWorldW * 0.6;
    sun.shadow.camera.top = fieldWorldH * 0.7;
    sun.shadow.camera.bottom = -fieldWorldH * 0.7;
    this.scene.add(sun);
    this.scene.add(sun.target);
    const fill = new THREE.DirectionalLight(0x8090c0, 0.30);
    fill.position.set(cx - 20, 24, cz + 30);
    this.scene.add(fill);
    // Softer fog so the far half of the big field doesn't grey out.
    this.scene.fog = new THREE.FogExp2(0x12100e, 0.006);

    this._buildBattlefield(opts.teren);
    if (opts.siege) {
      // SIEGE v2: prefer defCiv (defender's civilization) for the wall style.
      this._placeSiegeWall((opts.siege.defCiv ?? opts.siege.civ) ?? 'rzym');
    }
    this._placeUnits(opts.attacker, opts.defender, opts.siege != null);

    // Inicjuj faze rozstawiania jesli opts.deploy === true
    if (opts.deploy === true) {
      this.deployPhase = true;
      this._buildDeployZone();
      this._buildDeployOverlay();
    }

    window.addEventListener('resize', this._onResize);
    // Zoom: mouse wheel over the canvas + the +/- keys (B9).
    this.canvas.addEventListener('wheel', this._onWheel, { passive: false });
    window.addEventListener('keydown', this._onKeyZoom);
    // CHANGE1: "S" cycles battle speed (the on-screen button does not work for
    // the user); CHANGE2: "H" toggles all over-head stat bars. Both listen on
    // WINDOW so they work regardless of focus (there are no typing fields in the
    // battle overlay). Removed again in dispose().
    window.addEventListener('keydown', this._onKeySpeed);
    window.addEventListener('keydown', this._onKeyToggleBars);
    window.addEventListener('keydown', this._onKeyPause);
    window.addEventListener('keydown', this._onKeyManual);
    // AUDIO: "M" toggles all battle audio (SFX + ambient). Bound on WINDOW like
    // S/H/P, guarded by isEditableTarget; removed in dispose().
    window.addEventListener('keydown', this._onKeyMute);
    // AUDIO GESTURE INIT: the AudioContext is created lazily on the FIRST user
    // gesture (autoplay policy). The overlay receives the battle's pointer/key
    // events, so we init/resume on its first pointerdown/keydown. Capture phase +
    // once-ish guard (the handler is idempotent and cheap to re-run).
    window.addEventListener('pointerdown', this._onAudioGesture, true);
    window.addEventListener('keydown', this._onAudioGesture, true);
    // Pan: PRAWY/SRODKOWY przycisk (lub lewy poza trybem recznym) przesuwa kamera.
    // LEWY w trybie RECZNYM = box-select / klik-zaznaczenie.
    this.canvas.addEventListener('pointerdown', this._onPanDown);
    window.addEventListener('pointermove', this._onPanMove);
    window.addEventListener('pointerup', this._onPanUp);
    // Blokuj menu kontekstowe prawego przycisku na canvasie (uzywamy go do pana)
    this.canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());
    this._startLoop();
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  play(onFinish: (result: BattleResult) => void): void {
    this.onFinishCb = onFinish;
    if (this.deployPhase) {
      // Walka nie startuje -- czeka na przycisk "Start" w overlaya rozstawiania
      this.hint.textContent = 'FAZA ROZSTAWIANIA -- klikaj jednostki i pola strefy startowej, potem kliknij Start.';
      return;
    }
    this._startBattle();
  }

  /** Wewnetrzna metoda: rzeczywisty start walki (wywolywana po fazie rozstawiania). */
  private _startBattle(): void {
    this.started    = true;
    this.roundNo    = 0;
    this.activeSide = 'atk';
    this.hint.textContent = 'Bitwa! Co ture KAZDA jednostka rusza sie lub zadaje JEDEN cios. (Zoom: kolko/+- | S:predkosc H:paski P:pauza M:dzwiek)';
    if (this._manualMode && !this._rosterBar) this._buildRosterBar();
    if (this._rosterBar) this._rosterBar.style.display = 'flex';
    this._beginTurn();
  }

  skip(): void {
    if (this.finished) return;
    this.finished = true;
    const result = computeInstantResult(
      this.atk.filter(u => !u.dead),
      this.def.filter(u => !u.dead),
      this.terrain,
      this.terrainData,
      this.counters,
      this.terrainMap,
    );
    for (const line of result.log) this.log.push(line);
    this._showResultBanner(result.winner);
    setTimeout(() => {
      if (this.onFinishCb) this.onFinishCb({ winner: result.winner, survivors: result.survivors, log: this.log });
    }, 1500);
  }

  dispose(): void {
    this.finished = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    window.removeEventListener('resize', this._onResize);
    this.canvas.removeEventListener('wheel', this._onWheel);
    window.removeEventListener('keydown', this._onKeyZoom);
    window.removeEventListener('keydown', this._onKeySpeed);
    window.removeEventListener('keydown', this._onKeyToggleBars);
    window.removeEventListener('keydown', this._onKeyPause);
    window.removeEventListener('keydown', this._onKeyManual);
    window.removeEventListener('keydown', this._onKeyMute);
    window.removeEventListener('pointerdown', this._onAudioGesture, true);
    window.removeEventListener('keydown', this._onAudioGesture, true);
    this.overlay.removeEventListener('pointerdown', this._onAudioGesture);
    this.overlay.removeEventListener('keydown', this._onAudioGesture);
    // AUDIO TEARDOWN: stop ambient, disconnect buses, close the context we made.
    this._teardownAudio();
    this.canvas.removeEventListener('pointerdown', this._onPanDown);
    window.removeEventListener('pointermove', this._onPanMove);
    window.removeEventListener('pointerup', this._onPanUp);

    for (const fl of this.floatLabels) {
      if (fl.elem.parentNode) fl.elem.parentNode.removeChild(fl.elem);
    }
    this.floatLabels = [];

    for (const p of this.projectiles) { for (const g of p.geos) g.dispose(); for (const m of p.mats) m.dispose(); }
    this.projectiles = [];

    for (const ru of [...this.atk, ...this.def]) {
      if (ru.removed) continue; // model resources already disposed when it fled off-map
      for (const m of ru.mats) m.dispose();
      for (const g of ru.perTokenGeos) g.dispose();
    }
    for (const m of this.ownedMats) m.dispose();
    for (const g of this.ownedGeos) g.dispose();
    this.renderer.dispose();

    // The battle-log panel is a child of the overlay, so removing the overlay
    // detaches it too; drop the handle + buffer so nothing dangles after dispose.
    this.clashLog = null;
    this.clashLogEntries = [];

    if (this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay);
    // Wyczysc roster bar jesli istnieje (jest dzieckiem overlay, wiec juz usuniety, ale wyczysc ref)
    this._rosterBar = null;
    this._manualBtn = null;
    this._modeBanner = null;
    this._selectionRings.clear();
  }

  // -------------------------------------------------------------------------
  // Private: clear the deploy RANK BANDS + guarantee a passable clash corridor,
  // WITHOUT flattening the whole middle (so dense terrain survives across the
  // field, per the "za lyso" feedback).
  //
  // The generator paints rivers / forest / hills / rocks DENSELY across the
  // whole field. Here we make the battle both playable AND still terrain-rich:
  //   1) RANK BANDS: clear ONLY the exact columns each side's ranks stand on
  //      (front +/- the rear ranks), across the rank rows + 1 row of slack, to
  //      clean Plains. Units therefore spawn on flat, even, passable ground and
  //      form straight lines -- but terrain butts right up against the lines and
  //      fills the rest of the field (flanks, top/bottom, the no-man's-land).
  //   2) CLASH CORRIDOR: along a few central rows, downgrade any DEEP RIVER in
  //      the no-man's-land to a FORD (passable, costly) so the river can never
  //      fully wall the two armies apart. Forest/hills/rocks there are LEFT in
  //      place (all passable) as the obstacles the armies fight through.
  //   3) CONNECTIVITY GUARD: a flood-fill from the attacker band verifies the
  //      defender band is reachable over passable tiles; if some pathological
  //      terrain still blocks it, punch fords straight across the centre row.
  // -------------------------------------------------------------------------
  private _carveBattleBox(): void {
    const tm = this.terrainMap;
    const tiles = tm.tiles;
    if (!tiles) return;

    const idx = (c: number, r: number) => r * BF_COLS + c;
    const inField = (c: number, r: number) => c >= 0 && c < BF_COLS && r >= 0 && r < BF_ROWS;

    // Rows the centred rank band occupies (+1 row of slack each side).
    const nLine = Math.max(1, Math.min(RANK_WIDTH, BF_ROWS));
    const r0    = Math.floor((BF_ROWS - nLine) / 2);
    const rLo   = Math.max(0, r0 - 1);
    const rHi   = Math.min(BF_ROWS - 1, r0 + nLine);

    // --- 1) Clear ONLY the rank columns to Plains (narrow bands, not a box). ---
    // Attacker ranks step from its front toward the -X edge; defender toward +X.
    const rankCols = new Set<number>();
    for (let k = 0; k < MAX_RANKS; k++) {
      const ac = ATK_FRONT_COL + k * ATK_COL_STEP;
      const dc = DEF_FRONT_COL + k * DEF_COL_STEP;
      if (ac >= 0 && ac < BF_COLS) rankCols.add(ac);
      if (dc >= 0 && dc < BF_COLS) rankCols.add(dc);
    }
    for (let r = rLo; r <= rHi; r++) {
      for (const c of rankCols) tiles[idx(c, r)] = BTerrain.Plains;
    }

    // --- 2) Clash corridor: deep River -> Ford on a few central rows, between
    // the fronts (inclusive). Leaves forest/hills/rocks in place as obstacles. ---
    const corridorHalf = 2; // +/- rows around mid-field that stay crossable
    const midRow = Math.floor((BF_ROWS - 1) / 2);
    const corLo = Math.max(rLo, midRow - corridorHalf);
    const corHi = Math.min(rHi, midRow + corridorHalf);
    const gapLo = Math.min(ATK_FRONT_COL, DEF_FRONT_COL);
    const gapHi = Math.max(ATK_FRONT_COL, DEF_FRONT_COL);
    for (let r = corLo; r <= corHi; r++) {
      for (let c = gapLo; c <= gapHi; c++) {
        if (tiles[idx(c, r)] === BTerrain.River) tiles[idx(c, r)] = BTerrain.Ford;
      }
    }

    // --- 3) Connectivity guard: flood-fill passable tiles from the attacker
    // front; if the defender front is unreachable, punch fords across the centre
    // row so a crossing always exists. ---
    const passableKind = (k: number): boolean => k !== BTerrain.River;
    const startC = ATK_FRONT_COL, startR = midRow;
    const goalC  = DEF_FRONT_COL, goalR  = midRow;
    const reachable = (): boolean => {
      if (!inField(startC, startR) || !inField(goalC, goalR)) return true;
      const seen = new Uint8Array(BF_COLS * BF_ROWS);
      const stack: Array<[number, number]> = [[startC, startR]];
      seen[idx(startC, startR)] = 1;
      while (stack.length) {
        const [c, r] = stack.pop()!;
        if (c === goalC && r === goalR) return true;
        for (const [dc, dr] of DIRS4) {
          const nc = c + dc, nr = r + dr;
          if (!inField(nc, nr) || seen[idx(nc, nr)]) continue;
          if (!passableKind(tiles[idx(nc, nr)] as number)) continue;
          seen[idx(nc, nr)] = 1;
          stack.push([nc, nr]);
        }
      }
      return false;
    };
    if (!reachable()) {
      for (let c = 0; c < BF_COLS; c++) {
        if (tiles[idx(c, midRow)] === BTerrain.River) tiles[idx(c, midRow)] = BTerrain.Ford;
      }
    }
  }

  // -------------------------------------------------------------------------
  // SIEGE: carve wall/gate tiles, place wall mesh, deploy siege armies
  // -------------------------------------------------------------------------

  /**
   * Mark the wall+gate columns in terrainMap as Wall/Gate tiles.
   * Called BEFORE _buildBattlefield so the tile renderer can colour them.
   * Wall position: a few columns from the DEFENDER's front (DEF_FRONT_COL).
   * The wall runs across the full rank band (rows rLo..rHi).
   * Gate: 2 tiles wide, centred on the midRow of the rank band.
   */
  private _carveWallTiles(): void {
    const tm = this.terrainMap;
    const tiles = tm.tiles;
    if (!tiles) return;

    // Wall column: 4 tiles behind DEF_FRONT_COL (toward the +X edge = defender side)
    const wallCol = Math.min(BF_COLS - 2, DEF_FRONT_COL + 4);
    this.siegeWallCol = wallCol;

    // POPRAWKA: mur od krawedzi do krawedzi pola (rzedy 0..BF_ROWS-1)
    const rLo = 0;
    const rHi = BF_ROWS - 1;
    this.siegeWallRowLo = rLo;
    this.siegeWallRowHi = rHi;

    // Brama: 2 rzedy szerokosci, posrodku pola (rzad ≈ BF_ROWS/2)
    const midRow = Math.floor(BF_ROWS / 2);
    const gateRowLo = midRow - 1;
    const gateRowHi = midRow;
    this.siegeGateCol = wallCol;
    this.siegeGateRow = midRow;
    this.gateHp = 400; // GATE_MAX_HP
    this.gateOpen = false;
    // Inicjuj HP per-tile dla kafli BTerrain.Wall (pomijaj bramę)
    this.wallTileHp.clear();
    for (let r = rLo; r <= rHi; r++) {
      if (r >= gateRowLo && r <= gateRowHi) continue;
      this.wallTileHp.set(r, BattleScene.WALL_TILE_HP);
    }

    const idx = (c: number, r: number) => r * BF_COLS + c;
    for (let r = rLo; r <= rHi; r++) {
      const isGate = r >= gateRowLo && r <= gateRowHi;
      // Wall tile: impassable
      if (wallCol >= 0 && wallCol < BF_COLS) {
        tiles[idx(wallCol, r)] = isGate ? BTerrain.Gate : BTerrain.Wall;
      }
    }
  }

  /**
   * Build and place the 3D siege wall mesh in the scene.
   * Called after _buildBattlefield (so the scene exists) and before _placeUnits.
   * The wall runs perpendicular to the field (along Z axis = rows).
   * Its X position corresponds to siegeWallCol * TILE_S.
   * The "face" (blanki) faces -X = toward the attacker (which is the +Z direction
   * in local siege wall coords, since buildSiegeWall faces +Z by default).
   */
  private _placeSiegeWall(civ: import('../render/bronzeCity').BronzeCiv): void {
    const wallCol = this.siegeWallCol;
    if (wallCol < 0) return;

    const rLo = this.siegeWallRowLo;
    const rHi = this.siegeWallRowHi;
    const wallLengthTiles = rHi - rLo + 1;

    const wallGroup = buildSiegeWall(civ, {
      lengthTiles: wallLengthTiles,
      tileSize: TILE_S,
      height: 2.5,
      gateWidthTiles: 2,
    });

    // siegeWall.ts builds the wall along X axis, centred at origin.
    // We need it perpendicular to X (along Z), so rotate 90deg around Y.
    wallGroup.rotation.y = Math.PI / 2;

    // Position: wallCol * TILE_S (X), centred on the rank band (Z)
    const wallCenterRow = (rLo + rHi) / 2;
    const { x: wallX } = cellToWorld(wallCol, 0);
    const { z: wallZ } = cellToWorld(0, wallCenterRow);
    wallGroup.position.set(wallX, 0, wallZ);

    this.scene.add(wallGroup);
    this.siegeWallGroup = wallGroup;

    // Zmiana 2: Rejestruj per-rząd breach panele (wyrwa w murze).
    // gateRowLo/Hi = rząd bramy; panele są ukryte domyślnie, widoczne po wyłomie.
    {
      const _gateRowLo = this.siegeGateRow - 1;
      const _gateRowHi = this.siegeGateRow;
      attachRowBreachPanels(
        wallGroup,
        wallCenterRow,
        rLo,
        rHi,
        _gateRowLo,
        _gateRowHi,
        TILE_S
      );
    }

    // --- HUD: pasek HP bramy i muru ---
    const siegeHud = document.createElement('div');
    Object.assign(siegeHud.style, {
      position: 'absolute', top: '118px', left: '14px',
      padding: '5px 12px', background: 'rgba(20,10,5,0.82)',
      color: '#ffd070', fontFamily: 'monospace, sans-serif', fontSize: '12px',
      borderRadius: '5px', border: '1px solid rgba(255,200,80,0.5)',
      textShadow: '0 1px 2px #000', pointerEvents: 'none', zIndex: '10005',
      lineHeight: '1.6', minWidth: '160px',
    });
    this.overlay.appendChild(siegeHud);
    this.siegeHudDiv = siegeHud;
    this._updateSiegeHud();

    // Register mesh resources for disposal
    wallGroup.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        if (mesh.geometry) this.ownedGeos.push(mesh.geometry as THREE.BufferGeometry);
        const mm = mesh.material;
        if (Array.isArray(mm)) this.ownedMats.push(...mm);
        else if (mm) this.ownedMats.push(mm as THREE.Material);
      }
    });
  }

  /**
   * Move siege machine units (Taran/Katapulta) to the column ADJACENT to the wall
   * (one tile in front of the wall), so they can attack the gate immediately.
   * Called after place() for the attacker side.
   */
  private _repositionSiegeAttackers(): void {
    // SIEGE ATTACKER REPOSITIONING DISABLED:
    // Maszyny oblężnicze (Katapulta/Taran/Wieża) są już rozstawione NA KOŃCU
    // formacji atakującego (za łucznikami) przez _placeUnits z SIEGE_ATK_FRONT_COL=2.
    // Katapulta (zasięg 5) podejdzie do ~5 heksów od muru i zatrzyma się strzelając z dystansu.
    // Taran/Wieża mają zasięg 1 – dojdą do muru/bramy.
    // NIE przesuwamy maszyn pod mur od razu.
  }

  /**
   * Deploy the DEFENDER's units in siege mode:
   *   - Melee (Wrecz) units: placed ON the wall walkway (col = siegeWallCol),
   *     distributed along the wall's rows, skipping the gate.
   *   - All other units: placed BEHIND the wall (columns > siegeWallCol).
   */
  private _placeSiegeDefenders(defenders: BattleUnit[]): RuntimeBattleUnit[] {
    const wallCol = this.siegeWallCol;
    const rLo = this.siegeWallRowLo;
    const rHi = this.siegeWallRowHi;
    const gateRowLo = this.siegeGateRow - 1;
    const gateRowHi = this.siegeGateRow;

    // Separate wall defenders (melee + archers + def catapults) from the rest (mounted, non-cata siege).
    // Archers (isPrimaryRanged but not isMounted/isSiegeUnit) are placed ON the
    // wall walkway together with melee -- they shoot down at attackers from the
    // crown rather than standing behind the wall where their range is blocked.
    // Defender CATAPULTS (kontrbateria) are also placed ON the wall walkway so
    // they can shoot down at attacker catapults (counterbattery, range 6).
    const wallUnits = defenders.filter(u => !isMounted(u) && !isSiegeUnit(u));
    const meleeUnits = wallUnits.filter(u => !isPrimaryRanged(u));
    const archerUnits = wallUnits.filter(u => isPrimaryRanged(u));
    const defCataUnits = defenders.filter(u => isSiegeUnit(u) && this._isCatapult(u));
    const restUnits  = defenders.filter(u => isMounted(u) || (isSiegeUnit(u) && !this._isCatapult(u)));

    const result: RuntimeBattleUnit[] = [];

    // Helper to place a single unit at a given col/row
    const placeOne = (bu: BattleUnit, col: number, row: number, side: 'def', faceDir: Dir): RuntimeBattleUnit => {
      const clampedCol = Math.max(0, Math.min(BF_COLS - 1, col));
      const clampedRow = Math.max(0, Math.min(BF_ROWS - 1, row));

      // Find a free passable spot
      let fCol = clampedCol, fRow = clampedRow;
      if (this.occByKey.has(cellKey(fCol, fRow)) || !this.terrainMap.passable(fCol, fRow)) {
        // Try nearby rows
        let placed = false;
        for (let dr = 1; dr < BF_ROWS && !placed; dr++) {
          for (const rr of [clampedRow + dr, clampedRow - dr]) {
            const rc = Math.max(0, Math.min(BF_ROWS - 1, rr));
            if (!this.occByKey.has(cellKey(fCol, rc)) && this.terrainMap.passable(fCol, rc)) {
              fRow = rc; placed = true; break;
            }
          }
        }
        if (!placed) {
          // Try next col behind wall
          for (let dc = 1; dc < 5 && !placed; dc++) {
            const cc = Math.min(BF_COLS - 1, clampedCol + dc);
            for (let rr = rLo; rr <= rHi && !placed; rr++) {
              if (!this.occByKey.has(cellKey(cc, rr)) && this.terrainMap.passable(cc, rr)) {
                fCol = cc; fRow = rr; placed = true;
              }
            }
          }
        }
      }

      const key = cellKey(fCol, fRow);
      const { x, z } = cellToWorld(fCol, fRow);
      const topY = tileTopY(this.terrainMap, fCol, fRow);

      let group: THREE.Group;
      try {
        const modelName = String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa);
        group = buildUnitModel(bu.kategoria, bu.ownerColor, modelName);
      } catch (_) {
        group = makeFallbackAvatar(bu.ownerColor);
      }
      group.position.set(x, topY, z);
      group.rotation.y = dirYaw(faceDir);
      this.scene.add(group);

      const mats:         THREE.Material[]       = (group.userData['mats']         as THREE.Material[]      ) ?? [];
      const perTokenGeos: THREE.BufferGeometry[] = (group.userData['perTokenGeos'] as THREE.BufferGeometry[]) ?? [];

      const ammo0 = ammoCount(bu);
      const ammoShown = Number.isFinite(ammo0) && ammo0 > 0;
      const bars = makeUnitBars(sideColor(side), ammoShown);
      bars.hpBarGroup.position.set(x, topY + HPBAR_Y, z);
      this.scene.add(bars.hpBarGroup);
      bars.hpBarGroup.traverse(obj => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          if (mesh.geometry) this.ownedGeos.push(mesh.geometry as THREE.BufferGeometry);
          const mm = mesh.material;
          if (Array.isArray(mm)) this.ownedMats.push(...mm);
          else if (mm) this.ownedMats.push(mm as THREE.Material);
        }
      });

      const moraleBase = moraleBaseFor(bu) * 1.5; // obrońcy +50% morale na starcie
      const ru: RuntimeBattleUnit = {
        bu,
        group,
        hpBarFg:     bars.hpBarFg,
        hpBarBg:     bars.hpBarBg,
        hpBarGroup:  bars.hpBarGroup,
        moraleBarFg: bars.moraleBarFg,
        moraleBarBg: bars.moraleBarBg,
        ammoBarFg:   bars.ammoBarFg,
        ammoBarBg:   bars.ammoBarBg,
        ammoBarShown: ammoShown,
        q:          fCol,
        r:          fRow,
        side,
        dead:      false,
        fadingOut: false,
        fadeStart: 0,
        acted:     false,
        moveLeft:  movementPoints(bu),
        range:      attackRange(bu),
        ranged:     isRanged(bu),
        rangedBase: isRanged(bu),
        primaryRanged: isPrimaryRanged(bu),
        ammoLeft:   ammo0,
        ammoMax:    ammo0,
        dryCol:           -1,
        heldAfterFallback: false,
        mounted:      isMounted(bu),
        antiCavSpear: isAntiCavSpear(bu),
        phalanx:      isPhalanx(bu),
        facing:       faceDir,
        morale:      moraleBase,
        moraleMax:   moraleBase,
        neverRout:   isNeverRout(bu),
        fleeMorale:  fleeMoraleFor(bu),
        routed:      false,
        screenLostApplied: false,
        fleeStuck:   0,
        surroundApplied: false,
        removed:    false,
        onWallWalkway: false,
        playerOrder:   { type: 'none' },
        rangedKite:       true,
        shootingEnabled:  true,
        groupId:      null,
        formationOffset: null,
        mats,
        perTokenGeos,
      };
      this._updateMoraleBar(ru);
      this._updateAmmoBar(ru);
      this.occByKey.set(key, ru);
      return ru;
    };

    // 1) Melee on the wall walkway (wall col), SKONCENTROWANE W CENTRUM (±12 rzędów od midRow)
    // Obrońcy skupieni naprzeciw atakujących (którzy też startują na środku).
    const DEFENSE_HALF_SPAN = 12; // pas ±12 rzędów od środka bramy
    const midRow = this.siegeGateRow;
    const centerLo = Math.max(rLo, midRow - DEFENSE_HALF_SPAN);
    const centerHi = Math.min(rHi, midRow + DEFENSE_HALF_SPAN);
    const wallRows: number[] = [];
    for (let r = centerLo; r <= centerHi; r++) {
      if (r >= gateRowLo && r <= gateRowHi) continue; // skip gate
      wallRows.push(r);
    }
    // Place melee + archer + defender catapult units on wall walkway. Wall tiles
    // are BTerrain.Wall (impassable for pathfinding) but we forcibly place them
    // there since they STAND ON TOP of the wall crown. Archers and def catapults
    // go alongside melee, concentrated in the central band around the gate.
    // Def catapults get onWallWalkway=true and range=6 (counterbattery bonus).
    //
    // ROZKŁAD KATAPULT: CENTRUM pasa obrońców (±4 rzędy od midRow).
    // Zmiana 1: katapulty obrońcy skupione w centrum ±4 (były spread po całym pasie).
    const nCata = defCataUnits.length;
    const CATA_HALF_SPAN = 4; // ±4 rzędy od bramy
    const cataRowSet = new Set<number>();
    if (nCata > 0 && wallRows.length > 0) {
      // Wylicz węższy pas centralny dla katapult
      const cataLo = Math.max(centerLo, midRow - CATA_HALF_SPAN);
      const cataHi = Math.min(centerHi, midRow + CATA_HALF_SPAN);
      const cataPool = wallRows.filter(r => r >= cataLo && r <= cataHi);
      const usedPool = cataPool.length > 0 ? cataPool : wallRows; // fallback pełny pas
      for (let ci = 0; ci < nCata; ci++) {
        const idx = nCata > 1
          ? Math.round(ci * (usedPool.length - 1) / (nCata - 1))
          : Math.floor((usedPool.length - 1) / 2);
        const safeIdx = Math.min(Math.max(0, idx), usedPool.length - 1);
        cataRowSet.add(usedPool[safeIdx] as number);
      }
    }
    // Pozostałe rzędy (bez rzędów zarezerwowanych dla katapult) dla melee+łuczników:
    const nonCataRows = wallRows.filter(r => !cataRowSet.has(r));
    // Listy rzędów dla każdej grupy:
    const cataRows = wallRows.filter(r => cataRowSet.has(r));
    // Kolejność na murze: najpierw melee i łucznicy (na wolnych rzędach),
    // potem katapulty (na zarezerwowanych rzędach).
    const meleeArcherUnits = [...meleeUnits, ...archerUnits];
    // Mapowanie indeks→rząd: melee+łucznicy korzystają z nonCataRows (równomiernie),
    // katapulty z cataRows (równomiernie — już wyznaczone jako spread).
    const getRowForUnit = (unitIndex: number, isCata: boolean): number => {
      const fallback = rLo;
      if (isCata) {
        const rows = cataRows;
        if (rows.length === 0) return fallback;
        return rows[unitIndex % rows.length] as number;
      } else {
        const rows = nonCataRows.length > 0 ? nonCataRows : wallRows;
        if (rows.length === 0) return fallback;
        const step = rows.length > 1 ? (rows.length - 1) / Math.max(1, meleeArcherUnits.length - 1) : 0;
        const ri = Math.round(unitIndex * step);
        const clamped = Math.min(Math.max(0, ri), rows.length - 1);
        return rows[clamped] as number;
      }
    };
    // Połączona lista w kolejności: melee+łucznicy, potem katapulty (ale każda
    // ma własny licznik indeksu w swojej grupie):
    let meleeArcherIdx = 0;
    let cataIdx = 0;
    // Iterujemy przez melee+łucznicy+katapulty zachowując oryginalną kolejność
    // jednostek w presecie, ale przypisując im rządy z odpowiednich pul.
    const allWallCrownUnits = [...meleeArcherUnits, ...defCataUnits];
    let wallRowIdx = 0;
    for (const bu of allWallCrownUnits) {
      const isCata = defCataUnits.includes(bu);
      const wr = isCata
        ? getRowForUnit(cataIdx++, true)
        : getRowForUnit(meleeArcherIdx++, false);
      void wallRowIdx; // zachowane dla kompatybilności (nie używane w nowej logice)
      // Forcibly place on wall col (even though terrain is Wall = impassable movement)
      const key = cellKey(wallCol, wr);
      const { x, z } = cellToWorld(wallCol, wr);
      const topY = 2.5; // stand on top of wall (walkY from siegeWall opts.height)

      let group: THREE.Group;
      try {
        const modelName = String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa);
        group = buildUnitModel(bu.kategoria, bu.ownerColor, modelName);
      } catch (_) {
        group = makeFallbackAvatar(bu.ownerColor);
      }
      group.position.set(x, topY, z);
      group.rotation.y = dirYaw(Dir.W); // face attacker
      this.scene.add(group);

      const mats:         THREE.Material[]       = (group.userData['mats']         as THREE.Material[]      ) ?? [];
      const perTokenGeos: THREE.BufferGeometry[] = (group.userData['perTokenGeos'] as THREE.BufferGeometry[]) ?? [];
      const ammo0 = ammoCount(bu);
      const ammoShown = Number.isFinite(ammo0) && ammo0 > 0;
      const bars = makeUnitBars(sideColor('def'), ammoShown);
      bars.hpBarGroup.position.set(x, topY + HPBAR_Y, z);
      this.scene.add(bars.hpBarGroup);
      bars.hpBarGroup.traverse(obj => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          if (mesh.geometry) this.ownedGeos.push(mesh.geometry as THREE.BufferGeometry);
          const mm = mesh.material;
          if (Array.isArray(mm)) this.ownedMats.push(...mm);
          else if (mm) this.ownedMats.push(mm as THREE.Material);
        }
      });

      const moraleBase = moraleBaseFor(bu) * 1.5; // obrońcy +50% morale na starcie
      const ru: RuntimeBattleUnit = {
        bu, group,
        hpBarFg: bars.hpBarFg, hpBarBg: bars.hpBarBg, hpBarGroup: bars.hpBarGroup,
        moraleBarFg: bars.moraleBarFg, moraleBarBg: bars.moraleBarBg,
        ammoBarFg: bars.ammoBarFg, ammoBarBg: bars.ammoBarBg, ammoBarShown: ammoShown,
        q: wallCol, r: wr, side: 'def',
        dead: false, fadingOut: false, fadeStart: 0, acted: false,
        moveLeft: movementPoints(bu),
        // Defender catapult on wall walkway (kontrbateria) gets range 6 (cataRange 5 + 1 elevation).
        range: (this._isCatapult(bu) ? 6 : attackRange(bu)),
        ranged: (this._isCatapult(bu) ? true : isRanged(bu)),
        rangedBase: (this._isCatapult(bu) ? true : isRanged(bu)),
        primaryRanged: isPrimaryRanged(bu),
        ammoLeft: ammo0, ammoMax: ammo0,
        dryCol: -1, heldAfterFallback: false,
        mounted: isMounted(bu), antiCavSpear: isAntiCavSpear(bu), phalanx: isPhalanx(bu),
        facing: Dir.W,
        morale: moraleBase, moraleMax: moraleBase,
        neverRout: isNeverRout(bu), fleeMorale: fleeMoraleFor(bu),
        routed: false, screenLostApplied: false, fleeStuck: 0, surroundApplied: false,
        removed: false, onWallWalkway: true, playerOrder: { type: 'none' },
        rangedKite: true, shootingEnabled: true,
        groupId: null, formationOffset: null,
        mats, perTokenGeos,
      };
      this._updateMoraleBar(ru);
      this._updateAmmoBar(ru);
      this.occByKey.set(key, ru);
      result.push(ru);
    }

    // 2) Rest of defender (mounted, siege machines) behind the wall
    let rearOffset = 0;
    for (const bu of restUnits) {
      const rearCol = Math.min(BF_COLS - 1, wallCol + 2 + Math.floor(rearOffset / (rHi - rLo + 1)));
      const rearRow = rLo + (rearOffset % Math.max(1, rHi - rLo + 1));
      rearOffset++;
      result.push(placeOne(bu, rearCol, rearRow, 'def', Dir.W));
    }

    return result;
  }

  // -------------------------------------------------------------------------
  // Private: battlefield (SQUARE grid of flat tiles)
  // -------------------------------------------------------------------------

  private _buildBattlefield(_teren: string): void {
    const tm = this.terrainMap;

    // Flat SQUARE tile: a thin slab BoxGeometry(S, h, S). A tiny gap (0.98)
    // keeps a faint grid line between adjacent tiles for readability; centres
    // are exactly TILE_S apart so the squares effectively touch. The grass slab
    // top sits at y = 0 (water slabs dip to -RIVER_DROP). The unit WALKING
    // surface, however, follows tileTopY(): on a hill it rises to the dome's
    // summit (HILL_SUMMIT_Y) so the figure stands ON the bump instead of being
    // buried in it; on flat ground it is y = 0 (= UNIT_Y).
    const tileGeo = new THREE.BoxGeometry(TILE_S * 0.98, TILE_H, TILE_S * 0.98);
    this.ownedGeos.push(tileGeo);

    // Material CACHE: thousands of tiles collapse onto a few dozen shared
    // materials keyed by quantised colour, so we don't allocate 1440 materials.
    const matCache = new Map<number, THREE.MeshLambertMaterial>();
    const tileMat = (color: number): THREE.MeshLambertMaterial => {
      const key = color & 0xffffff;
      let m = matCache.get(key);
      if (!m) {
        m = new THREE.MeshLambertMaterial({ color: key });
        matCache.set(key, m);
        this.ownedMats.push(m);
      }
      return m;
    };

    // Decoration tallies for instanced-mesh sizing.
    const FOREST_TREES = 5; // crowns per forest tile
    const HILL_SHRUBS  = 3; // shrubs per hill tile
    let forestTiles = 0, hillTiles = 0, waterTiles = 0, rockTiles = 0;
    for (let i = 0; i < tm.tiles.length; i++) {
      const k = tm.tiles[i] as number;
      if (k === BTerrain.Forest) forestTiles++;
      else if (k === BTerrain.Hills) hillTiles++;
      else if (k === BTerrain.River || k === BTerrain.Ford) waterTiles++;
      else if (k === BTerrain.Rocks) rockTiles++;
    }

    // --- Tile floor (per-tile colour from terrain kind) ---
    for (let col = 0; col < BF_COLS; col++) {
      for (let row = 0; row < BF_ROWS; row++) {
        const kind = tm.at(col, row);
        const checker = ((col + row) % 2 === 0) ? 0.0 : 0.045;
        let c = lighten(BT_FLOOR_COLOR[kind] ?? 0x6fa84a, checker);
        // Faint side tint marks the attacker / defender deploy ground.
        if (col <= ATK_FRONT_COL)      c = lighten(c, 0.05);
        else if (col >= DEF_FRONT_COL) c = blend(c, 0x9090a0, 0.07);

        const mesh = new THREE.Mesh(tileGeo, tileMat(c));
        const { x, z } = cellToWorld(col, row);
        // River/ford slabs sit slightly LOWER so water reads as a channel.
        const isWater = kind === BTerrain.River || kind === BTerrain.Ford;
        const yTop = isWater ? -RIVER_DROP : 0;
        mesh.position.set(x, yTop - TILE_H * 0.5, z);
        mesh.receiveShadow = true;
        this.scene.add(mesh);
      }
    }

    // --- FOREST: instanced cone crowns + thin trunks (scene.ts look) ---
    if (forestTiles > 0) {
      const maxTrees = forestTiles * FOREST_TREES;
      const crownGeo = new THREE.ConeGeometry(TILE_S * 0.20, TILE_S * 0.62, 6);
      const crownMat = new THREE.MeshLambertMaterial({ color: FOREST_CONE_COLOR, flatShading: true });
      const trunkGeo = new THREE.CylinderGeometry(TILE_S * 0.035, TILE_S * 0.05, TILE_S * 0.22, 5);
      const trunkMat = new THREE.MeshLambertMaterial({ color: FOREST_TRUNK_COLOR });
      this.ownedGeos.push(crownGeo, trunkGeo);
      this.ownedMats.push(crownMat, trunkMat);
      const crowns = new THREE.InstancedMesh(crownGeo, crownMat, maxTrees);
      const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, maxTrees);
      crowns.castShadow = true; crowns.receiveShadow = true;
      trunks.castShadow = true;
      const dummy = new THREE.Object3D();
      let ti = 0;
      for (let col = 0; col < BF_COLS; col++) {
        for (let row = 0; row < BF_ROWS; row++) {
          if (tm.at(col, row) !== BTerrain.Forest) continue;
          const { x, z } = cellToWorld(col, row);
          for (let t = 0; t < FOREST_TREES; t++) {
            const jx = (tileJitter(col, row, t * 2) - 0.5) * TILE_S * 0.72;
            const jz = (tileJitter(col, row, t * 2 + 1) - 0.5) * TILE_S * 0.72;
            const sc = 0.7 + tileJitter(col, row, t + 7) * 0.6;
            // trunk
            dummy.position.set(x + jx, TILE_S * 0.11 * sc, z + jz);
            dummy.scale.setScalar(sc);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            trunks.setMatrixAt(ti, dummy.matrix);
            // crown sits on top of the trunk
            dummy.position.set(x + jx, (TILE_S * 0.22 + TILE_S * 0.31) * sc, z + jz);
            dummy.updateMatrix();
            crowns.setMatrixAt(ti, dummy.matrix);
            ti++;
          }
        }
      }
      crowns.count = ti; trunks.count = ti;
      crowns.instanceMatrix.needsUpdate = true;
      trunks.instanceMatrix.needsUpdate = true;
      this.scene.add(trunks);
      this.scene.add(crowns);
    }

    // --- HILLS: instanced raised grass bumps (half-dome) + shrubs ---
    if (hillTiles > 0) {
      const bumpGeo = new THREE.SphereGeometry(TILE_S * 0.60, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const bumpMat = new THREE.MeshLambertMaterial({ color: HILL_GRASS_COLOR, flatShading: true });
      const shrubGeo = new THREE.ConeGeometry(TILE_S * 0.13, TILE_S * 0.34, 6);
      const shrubMat = new THREE.MeshLambertMaterial({ color: SHRUB_COLOR, flatShading: true });
      this.ownedGeos.push(bumpGeo, shrubGeo);
      this.ownedMats.push(bumpMat, shrubMat);
      const bumps  = new THREE.InstancedMesh(bumpGeo, bumpMat, hillTiles);
      const shrubs = new THREE.InstancedMesh(shrubGeo, shrubMat, hillTiles * HILL_SHRUBS);
      bumps.castShadow = true; bumps.receiveShadow = true;
      shrubs.castShadow = true;
      const dummy = new THREE.Object3D();
      let bi = 0, si = 0;
      for (let col = 0; col < BF_COLS; col++) {
        for (let row = 0; row < BF_ROWS; row++) {
          if (tm.at(col, row) !== BTerrain.Hills) continue;
          const { x, z } = cellToWorld(col, row);
          // raised grass dome (sits ON the y=0 surface; its apex = HILL_SUMMIT_Y)
          dummy.position.set(x, 0, z);
          dummy.scale.set(1, HILL_SUMMIT_Y / (TILE_S * 0.60), 1);
          dummy.rotation.set(0, tileJitter(col, row, 3) * Math.PI, 0);
          dummy.updateMatrix();
          bumps.setMatrixAt(bi++, dummy.matrix);
          for (let h = 0; h < HILL_SHRUBS; h++) {
            const jx = (tileJitter(col, row, 10 + h) - 0.5) * TILE_S * 0.5;
            const jz = (tileJitter(col, row, 20 + h) - 0.5) * TILE_S * 0.5;
            dummy.scale.setScalar(0.7 + tileJitter(col, row, 30 + h) * 0.5);
            dummy.position.set(x + jx, HILL_LIFT + 0.10, z + jz);
            dummy.rotation.set(0, 0, 0);
            dummy.updateMatrix();
            shrubs.setMatrixAt(si++, dummy.matrix);
          }
        }
      }
      bumps.count = bi; shrubs.count = si;
      bumps.instanceMatrix.needsUpdate = true;
      shrubs.instanceMatrix.needsUpdate = true;
      this.scene.add(bumps);
      this.scene.add(shrubs);
    }

    // --- RIVER + FORD: a translucent water sheen plane over each water tile ---
    if (waterTiles > 0) {
      const waterGeo = new THREE.BoxGeometry(TILE_S * 0.99, 0.04, TILE_S * 0.99);
      const waterMat = new THREE.MeshLambertMaterial({
        color: RIVER_WATER_COLOR, transparent: true, opacity: 0.78, emissive: 0x0a2a44,
      });
      this.ownedGeos.push(waterGeo);
      this.ownedMats.push(waterMat);
      const water = new THREE.InstancedMesh(waterGeo, waterMat, waterTiles);
      const dummy = new THREE.Object3D();
      let wi = 0;
      for (let col = 0; col < BF_COLS; col++) {
        for (let row = 0; row < BF_ROWS; row++) {
          const k = tm.at(col, row);
          if (k !== BTerrain.River && k !== BTerrain.Ford) continue;
          const { x, z } = cellToWorld(col, row);
          // Ford water sits a touch higher (shallower) than deep river.
          const wy = k === BTerrain.Ford ? -RIVER_DROP * 0.4 : -RIVER_DROP * 0.5;
          dummy.position.set(x, wy, z);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          water.setMatrixAt(wi++, dummy.matrix);
        }
      }
      water.count = wi;
      water.instanceMatrix.needsUpdate = true;
      this.scene.add(water);
    }

    // --- ROCKS: small instanced low-poly boulders on rock tiles ---
    if (rockTiles > 0) {
      const rockGeo = new THREE.IcosahedronGeometry(TILE_S * 0.22, 0);
      const rockMat = new THREE.MeshLambertMaterial({ color: ROCK_COLOR, flatShading: true });
      this.ownedGeos.push(rockGeo);
      this.ownedMats.push(rockMat);
      const rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockTiles * 2);
      rocks.castShadow = true; rocks.receiveShadow = true;
      const dummy = new THREE.Object3D();
      let ri = 0;
      for (let col = 0; col < BF_COLS; col++) {
        for (let row = 0; row < BF_ROWS; row++) {
          if (tm.at(col, row) !== BTerrain.Rocks) continue;
          const { x, z } = cellToWorld(col, row);
          const n = 1 + (tileJitter(col, row, 5) > 0.5 ? 1 : 0);
          for (let b = 0; b < n; b++) {
            const jx = (tileJitter(col, row, 40 + b) - 0.5) * TILE_S * 0.45;
            const jz = (tileJitter(col, row, 50 + b) - 0.5) * TILE_S * 0.45;
            const sc = 0.6 + tileJitter(col, row, 60 + b) * 0.7;
            dummy.position.set(x + jx, TILE_S * 0.10 * sc, z + jz);
            dummy.scale.setScalar(sc);
            dummy.rotation.set(tileJitter(col, row, 70 + b) * Math.PI, tileJitter(col, row, 80 + b) * Math.PI, 0);
            dummy.updateMatrix();
            rocks.setMatrixAt(ri++, dummy.matrix);
          }
        }
      }
      rocks.count = ri;
      rocks.instanceMatrix.needsUpdate = true;
      this.scene.add(rocks);
    }

    // --- Surrounding dark ground plane + side banners ---
    const midCol = (BF_COLS - 1) / 2;
    const midRow = (BF_ROWS - 1) / 2;
    const { x: mx, z: mz } = cellToWorld(midCol, midRow);
    const worldW = BF_COLS * TILE_S;
    const worldH = BF_ROWS * TILE_S;

    const gGeo = new THREE.PlaneGeometry(worldW * 1.5, worldH * 1.7);
    const gMat = new THREE.MeshLambertMaterial({ color: 0x0a0908 });
    this.ownedGeos.push(gGeo);
    this.ownedMats.push(gMat);
    const ground = new THREE.Mesh(gGeo, gMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(mx, -0.16, mz);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Side banners (left = attacker red, right = defender blue).
    const stripH = worldH * 0.9;
    const mkStrip = (color: number, xPos: number) => {
      const sg = new THREE.BoxGeometry(0.20, 1.10, stripH);
      const sm = new THREE.MeshLambertMaterial({ color });
      this.ownedGeos.push(sg);
      this.ownedMats.push(sm);
      const m  = new THREE.Mesh(sg, sm);
      m.position.set(xPos, 0.50, mz);
      this.scene.add(m);
    };
    mkStrip(0xcc3010, cellToWorld(-1, midRow).x - TILE_S * 0.5);
    mkStrip(0x1040c0, cellToWorld(BF_COLS, midRow).x + TILE_S * 0.5);
  }

  // -------------------------------------------------------------------------
  // Private: place units -- two armies FACING each other in COLUMNS, GAP in
  // the middle. Attacker LEFT (front = E / +X), defender RIGHT (front = W / -X).
  // -------------------------------------------------------------------------

  private _placeUnits(attackers: BattleUnit[], defenders: BattleUnit[], siegeMode: boolean = false): void {
    // CLEAN FRONT LINE placement on the SQUARE grid.
    //
    // Both armies form a STRAIGHT vertical front line (a rank) in a single
    // column, facing each other across the field. Because the grid is square
    // (no shear), a rank is simply a constant COLUMN with the row running down
    // the field -- no zig-zag compensation is needed. The first (fullest) rank
    // sits on the front column; overflow steps to rear ranks toward that side's
    // own edge.
    //
    // Each unit's FACING is set toward the enemy front line: attacker -> E,
    // defender -> W, and the model is rotated to show it.
    const place = (
      units:    BattleUnit[],
      side:     'atk' | 'def',
      frontCol: number,
      rankStep: number,    // column step from one rank to the rear rank
      faceDir:  Dir,       // E for attacker, W for defender
    ): RuntimeBattleUnit[] => {
      const clampCol = (c: number): number => Math.max(0, Math.min(BF_COLS - 1, c));
      const clampRow = (r: number): number => Math.max(0, Math.min(BF_ROWS - 1, r));
      const freeOk = (c: number, r: number): boolean =>
        !this.occByKey.has(cellKey(c, r)) && this.terrainMap.passable(c, r);

      // DEPLOYMENT BY ROLE (Naster): ONE continuous melee front line, then a rank
      // of JAVELINEERS, then a rank of ARCHERS behind it; mounted on the wings.
      //   rank 0 (front col) = ALL melee (non-shooter foot) in one wide line
      //   rank 1 = javelineers (kategoria 'oszczep...')
      //   rank 2 = archers/slingers (rest of the primary shooters)
      // Each group is centred on the field; a group wider than the field wraps to
      // an extra rank behind it. Mounted deploy on the wings of the widest line.
      const meleeI:   number[] = [];
      const javI:     number[] = [];
      const arcI:     number[] = [];
      const siegeI:   number[] = []; // maszyny oblężnicze (Taran/Katapulta/Wieża) -- grupowane NA KOŃCU formacji
      const mountIdx: number[] = [];
      units.forEach((u, i) => {
        if (isMounted(u)) { mountIdx.push(i); return; }
        if (isSiegeUnit(u)) { siegeI.push(i); return; } // siege PRZED isPrimaryRanged, bo nie są ranged
        if (!isPrimaryRanged(u)) { meleeI.push(i); return; }
        if (normName(String(u.kategoria ?? '')).includes('oszczep')) { javI.push(i); return; }
        arcI.push(i);
      });

      const idealRow = new Array<number>(units.length);
      const idealCol = new Array<number>(units.length);

      // MAX units per rank (row-axis). Each group is centred on midRow so all
      // groups share the same centre column -- NO wing spreading.
      const MAX_LINE = 12;
      const midRow   = Math.floor(BF_ROWS / 2);

      const layGroup = (list: number[], rankBase: number): number => {
        if (list.length === 0) return 0;
        const per = Math.max(1, Math.min(list.length, MAX_LINE));
        const r0g = midRow - Math.floor(per / 2);
        list.forEach((ui, k) => {
          idealRow[ui] = clampRow(r0g + (k % per));
          idealCol[ui] = clampCol(frontCol + (rankBase + Math.floor(k / per)) * rankStep);
        });
        return Math.ceil(list.length / per);
      };
      let rankBase = 0;
      rankBase += layGroup(meleeI, rankBase); // FRONT: jedna ciagla linia wrecz
      rankBase += layGroup(javI, rankBase);   // za nia: oszczepnicy
      const arcRanks = layGroup(arcI, rankBase); // za nimi: lucznicy
      rankBase += arcRanks;
      const siegeRanks = layGroup(siegeI, rankBase); // NA KOŃCU: maszyny oblężnicze (katapulty/taran/wieże)
      const totalFootRanks = rankBase + siegeRanks;

      // Mounted: CENTRED, ~5 ranks behind the infantry rear -- NOT on the wings.
      const mountColOff = totalFootRanks + 5; // 5 ranks gap behind last foot rank
      const mountPer    = Math.max(1, Math.min(mountIdx.length, MAX_LINE));
      const mountR0     = midRow - Math.floor(mountPer / 2);
      mountIdx.forEach((ui, k) => {
        idealRow[ui] = clampRow(mountR0 + (k % mountPer));
        idealCol[ui] = clampCol(frontCol + (mountColOff + Math.floor(k / mountPer)) * rankStep);
      });

      return units.map((bu, idx) => {
        let row = idealRow[idx]!;
        let col = idealCol[idx]!;

        // Resolve collisions / impassable tiles: try other rows in this unit's
        // own column first, then step to rear columns scanning every row.
        let key = cellKey(col, row);
        if (!freeOk(col, row)) {
          let placed = false;
          const baseCol = col;
          for (let rr = 0; rr < BF_ROWS && !placed; rr++) {
            if (freeOk(baseCol, rr)) { col = baseCol; row = rr; key = cellKey(baseCol, rr); placed = true; }
          }
          for (let extra = 1; extra < BF_COLS && !placed; extra++) {
            for (let rr = 0; rr < BF_ROWS && !placed; rr++) {
              const cc = clampCol(baseCol + extra * rankStep);
              if (freeOk(cc, rr)) { col = cc; row = rr; key = cellKey(cc, rr); placed = true; }
            }
          }
        }

        const { x, z } = cellToWorld(col, row);

        let group: THREE.Group;
        try {
          // Pass the unit NAME so battle figures pick up the same per-culture /
          // per-name distinctions as the map (e.g. Legionista vs Falanga vs the
          // super-units). buildUnitModel falls back to the generic category
          // model when the name carries no cultural marker.
          // Resolve the MODEL by the POLISH "Jednostka" name (the stable model
          // key the renderer/buildNamedUnit match on); bu.nazwa now holds the
          // ENGLISH display name, so use stats['Jednostka'] for dispatch.
          const modelName = String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa);
          group = buildUnitModel(bu.kategoria, bu.ownerColor, modelName);
        } catch (_) {
          group = makeFallbackAvatar(bu.ownerColor);
        }
        // Stand on the VISIBLE top of this tile (hill summit if on a hill) so
        // the figure rests ON the terrain instead of sinking into a raised bump.
        const topY = tileTopY(this.terrainMap, col, row);
        group.position.set(x, topY, z);

        // FACING: straight toward the enemy line (E for attacker, W for defender).
        const facing = faceDir;
        group.rotation.y = dirYaw(facing);
        this.scene.add(group);

        const mats:         THREE.Material[]       = (group.userData['mats']         as THREE.Material[]      ) ?? [];
        const perTokenGeos: THREE.BufferGeometry[] = (group.userData['perTokenGeos'] as THREE.BufferGeometry[]) ?? [];

        const ammo0 = ammoCount(bu);
        // AMMO bar (+ 3-ci slot/ramka) tylko dla jednostek z amunicja > 0; czysto
        // wrecz / nieskonczone strzaly -> tylko 2 paski (HP+morale) i ramka na dwa (Naster).
        const ammoShown = Number.isFinite(ammo0) && ammo0 > 0;
        const bars = makeUnitBars(sideColor(side), ammoShown);
        bars.hpBarGroup.position.set(x, topY + HPBAR_Y, z);
        this.scene.add(bars.hpBarGroup);
        // Register the six bar meshes' geometries + materials for disposal
        // (mesh.geometry / .material), so the three over-head bars are cleaned
        // up with the scene -- same disposal path as the unit model resources.
        bars.hpBarGroup.traverse(obj => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh) {
            if (mesh.geometry) this.ownedGeos.push(mesh.geometry as THREE.BufferGeometry);
            const mm = mesh.material;
            if (Array.isArray(mm)) this.ownedMats.push(...mm);
            else if (mm) this.ownedMats.push(mm as THREE.Material);
          }
        });

        const ru: RuntimeBattleUnit = {
          bu,
          group,
          hpBarFg:     bars.hpBarFg,
          hpBarBg:     bars.hpBarBg,
          hpBarGroup:  bars.hpBarGroup,
          moraleBarFg: bars.moraleBarFg,
          moraleBarBg: bars.moraleBarBg,
          ammoBarFg:   bars.ammoBarFg,
          ammoBarBg:   bars.ammoBarBg,
          ammoBarShown: ammoShown,
          q:          col,
          r:          row,
          side,
          dead:      false,
          fadingOut: false,
          fadeStart: 0,
          acted:     false,
          moveLeft:  movementPoints(bu),
          range:      attackRange(bu),
          ranged:     isRanged(bu),
          rangedBase: isRanged(bu),
          primaryRanged: isPrimaryRanged(bu),
          ammoLeft:   ammo0,
          ammoMax:    ammo0,
          dryCol:           -1,    // TASK 4: set when ammo runs out
          heldAfterFallback: false, // TASK 4: latches after ~3-tile fall-back
          mounted:      isMounted(bu),
          antiCavSpear: isAntiCavSpear(bu),
          phalanx:      isPhalanx(bu),
          facing,
          morale:      moraleBaseFor(bu),
          moraleMax:   moraleBaseFor(bu),
          neverRout:   isNeverRout(bu),
          fleeMorale:  fleeMoraleFor(bu),
          routed:      false,
          screenLostApplied: false,
          fleeStuck:   0,
          surroundApplied: false,
          // A routed unit FLEES toward its OWN home edge using NORMAL movement:
          // attacker -> col 0 (west), defender -> col BF_COLS-1 (east); _fleeStep
          // walks it there one tile per step at normal speed. It is removed from
          // the scene the moment it reaches the home-edge column.
          removed:    false,
          onWallWalkway: false,
          playerOrder:   { type: 'none' },
          rangedKite:       true,
          shootingEnabled:  true,
          groupId:      null,
          formationOffset: null,
          mats,
          perTokenGeos,
        };
        // Initialise the morale bar to full + the ammo bar to its starting fill.
        this._updateMoraleBar(ru);
        this._updateAmmoBar(ru);
        this.occByKey.set(key, ru);
        return ru;
      });
    };

    // Cap each side to MAX_PER_SIDE so the field never overfills (the spec
    // allows up to 20 units per army). Extra units beyond the cap don't deploy.
    // FLANK CAVALRY: reorder each side so mounted units (konnica / rydwan) take
    // the front-rank WING rows (top & bottom ends of the rank axis) rather than
    // trailing in a partial rear rank, so horse/chariots sit on the wings.
    const atkArr = arrangeFlankCavalry(attackers.slice(0, MAX_PER_SIDE));
    const defArr = arrangeFlankCavalry(defenders.slice(0, MAX_PER_SIDE));
    // Zapisz oryginalne dane atakujacych dla potrzeb Reset w fazie deploy
    this._savedAtkBUs = atkArr.slice();
    // SIEGE_ATK_FRONT_COL: kolumna frontu wrecz atakujacego (blisko krawedzi 0 = daleko od muru).
    // Wrecz sa z przodu (frontCol=2), za nimi oszczepnicy, lucznicy, a OSTATNIE szeregi to
    // maszyny obleznicze (siegeI). Step=+1 (rosnace kolumny = kierunek ku murowi).
    // Dystans od frontu (kol 2) do siegeWallCol (kol ~23) wynosi ~21 hexow --
    // katapulta (zasieg 5) zatrzyma sie na kol ~18 i bedzie strzelac z dystansu.
    const SIEGE_ATK_FRONT_COL = 2;  // front wrecz atakujacego -- kol 2 (daleka krawedz)
    const SIEGE_ATK_COL_STEP  = 1;  // krok ROSNACY = ku murowi (katapulty laduja za piechota)
    if (siegeMode && this.siegeWallCol >= 0) {
      // SIEGE DEPLOYMENT
      // Atakujacy: cala armia przy wlasnej krawedzi (kol 2+), formacja wrecz/oszczep/luki/siege;
      //   maszyny sa OSTATNIE (najdalej od muru), ale i tak sa daleko -- beда PODEJSC.
      // Obroncy: wrecz NA MURZE (siegeWallCol), reszta za murem.
      this.atk = place(atkArr, 'atk', SIEGE_ATK_FRONT_COL, SIEGE_ATK_COL_STEP, Dir.E);
      this._repositionSiegeAttackers(); // no-op; zachowany dla kompatybilnosci
      this.def = this._placeSiegeDefenders(defArr);
    } else {
      this.atk = place(atkArr, 'atk', ATK_FRONT_COL, ATK_COL_STEP, Dir.E);
      this.def = place(defArr, 'def', DEF_FRONT_COL, DEF_COL_STEP, Dir.W);
    }
  }

  // -------------------------------------------------------------------------
  // Private: turn loop (every unit acts once per turn)
  // -------------------------------------------------------------------------

  /**
   * Begin one TURN. A turn is a single pass in which EVERY living unit (both
   * sides) takes exactly ONE action -- either a one-tile-at-a-time MOVE toward
   * an attack position (up to its full movement points) OR, if a target is
   * already in reach, a SINGLE blow. Movement is refreshed for every unit at
   * the start of the turn. The whole army keeps acting each turn; the battle
   * NEVER blocks on one pair fighting to the death.
   */
  /** Anty-pat: wykrywa brak postepu (linie sie nie dosiegaja) i konczy bitwe. */
  private _updateStallWatch(): void {
    // W trybie oblezenia atakujacy maszeruje/buduje machiny przez wiele tur bez
    // starcia -- watchdog odpalalyby sie falszywie. Pomijamy inkrementowanie.
    if (this.siegeWallCol >= 0) return;
    let hp = 0, mor = 0, out = 0;
    for (const u of [...this.atk, ...this.def]) {
      hp += Math.max(0, u.bu.hp); mor += Math.max(0, u.morale);
      if (u.dead || u.routed) out++;
    }
    const sig = Math.round(hp) + '|' + Math.round(mor) + '|' + out;
    if (sig === this._stallSig) this._stallTurns++;
    else { this._stallTurns = 0; this._stallSig = sig; }
    if (this._stallTurns >= STALL_TURN_LIMIT) this._stalled = true;
  }

  private _beginTurn(): void {
    if (this.finished) return;
    this._updateStallWatch();
    if (this._checkEnd()) return;
    this.roundNo++;

    // Snapshot of all living, non-routed units for this turn, interleaved
    // atk/def so both sides participate throughout the turn (initiative order).
    // Routed units are INCLUDED so they get a turn to FLEE (normal movement
    // toward their home edge); they never attack (handled in _activateUnit).
    const a = this.atk.filter(u => !u.dead && !u.fadingOut && !u.removed);
    const d = this.def.filter(u => !u.dead && !u.fadingOut && !u.removed);
    const order: RuntimeBattleUnit[] = [];
    const n = Math.max(a.length, d.length);
    for (let i = 0; i < n; i++) {
      const au = a[i];
      const du = d[i];
      if (au) order.push(au);
      if (du) order.push(du);
    }

    // Every unit acts this turn and gets fresh movement points.
    for (const ru of order) {
      ru.acted    = false;
      ru.moveLeft = movementPoints(ru.bu);
    }

    this.turnOrder = order;
    this.turnIdx   = 0;

    this.hint.textContent = 'Tura ' + this.roundNo + ' -- kazda jednostka wykonuje jedna akcje.';

    this._activateNext();
  }

  /**
   * Activate the next unit in this turn's order. When the order is exhausted,
   * a new turn begins. Each unit performs exactly ONE action.
   */
  private _activateNext(): void {
    if (this.finished) return;
    if (this._checkEnd()) return;

    // Find the next unit in the snapshot that is still alive and has not acted.
    let ru: RuntimeBattleUnit | null = null;
    while (this.turnIdx < this.turnOrder.length) {
      const cand = this.turnIdx < this.turnOrder.length ? this.turnOrder[this.turnIdx] : undefined;
      this.turnIdx++;
      // Skip dead / fading / already-acted AND routed units (a unit that broke
      // mid-turn must not take an action).
      // Routed units ARE activated (to flee a few tiles per turn); they never attack.
      if (cand && !cand.dead && !cand.fadingOut && !cand.removed && !cand.acted) { ru = cand; break; }
    }

    if (!ru) {
      // Whole turn done -> start the next turn after a short breather.
      this._schedule(TURN_GAP_MS, () => this._beginTurn());
      return;
    }

    const u = ru;
    this._activateUnit(u, () => {
      u.acted = true;
      // Light stagger so actions play in quick succession without freezing the
      // rest of the army.
      this._schedule(ACT_GAP_MS, () => this._activateNext());
    });
  }

  /**
   * One unit's single action for this turn. The decision SPLITS by unit type:
   *
   *   RANGED (can still shoot -- has a ranged attack/ammo, incl. a Legionista
   *   WHILE it has pila) -> _rangedAction: SHOOT ASAP whenever an enemy sits in
   *   range and is not point-blank; KITE away when an enemy closes inside the
   *   safe gap; otherwise APPROACH only up to the farthest in-range tile. Once a
   *   shooter is out of ammo (canShoot false) it falls through to the MELEE path.
   *
   *   MELEE (or a shooter out of ammo) -> CHANGE D: if an enemy is adjacent,
   *   strike it; otherwise advance by the most DIRECT route toward the nearest
   *   enemy and engage (no aimless lateral wandering).
   *
   * Either way a unit takes exactly ONE action per turn (one move OR one blow);
   * a blow's counter still lands on the target's OWN later turn.
   */
  private _activateUnit(ru: RuntimeBattleUnit, done: () => void): void {
    if (this.finished) { done(); return; }
    if (ru.dead || ru.fadingOut) { done(); return; }

    // ROUTED units FLEE this turn using NORMAL movement toward their home edge
    // and NEVER attack. This branch runs FIRST, before any facing/ranged/melee
    // logic, so a broken unit only ever walks off the field.
    if (ru.routed) { this._fleeStep(ru, done); return; }

    // STEROWANIE RECZNIE: jesli tryb RECZNY i jednostka gracza (atk),
    // sprawdz rozkaz playerOrder PRZED logika AI.
    if (this._manualMode && ru.side === 'atk') {
      const ord = ru.playerOrder;
      if (ord.type === 'hold') {
        // Stoj — nie rob nic w tej turze
        done();
        return;
      }
      if (ord.type === 'move') {
        // Ruch na zadane pole
        const tc = ord.col;
        const tr = ord.row;
        if (tc === ru.q && tr === ru.r) { done(); return; } // juz stoi
        // Jeden krok w kierunku celu (reuz _doMove)
        const dc = Math.sign(tc - ru.q);
        const dr = Math.sign(tr - ru.r);
        let nc = ru.q + dc;
        let nr = ru.r + dr;
        // Jesli pole zajete lub nieprzejezdne, sprobuj po kolumnie, potem po rzedzie
        if (!this.terrainMap.passable(nc, nr) || this.occByKey.has(cellKey(nc, nr))) {
          if (dc !== 0 && (this.terrainMap.passable(ru.q + dc, ru.r)) && !this.occByKey.has(cellKey(ru.q + dc, ru.r))) {
            nc = ru.q + dc; nr = ru.r;
          } else if (dr !== 0 && (this.terrainMap.passable(ru.q, ru.r + dr)) && !this.occByKey.has(cellKey(ru.q, ru.r + dr))) {
            nc = ru.q; nr = ru.r + dr;
          } else {
            done(); return; // zablokowany
          }
        }
        // Wyczysc rozkaz gdy dotarlimy na miejsce
        if (nc === tc && nr === tr) ru.playerOrder = { type: 'none' };
        this._doMove(ru, nc, nr, done);
        return;
      }
      if (ord.type === 'attack') {
        // Atak na konkretny cel
        const tgt = [...this.def].find(u => u.bu.id === ord.targetId && !u.dead && !u.fadingOut);
        if (!tgt) { ru.playerOrder = { type: 'none' }; /* cel martwy */ }
        else {
          const dist = manhattan(ru.q, ru.r, tgt.q, tgt.r);
          if (dist <= Math.max(1, ru.range)) {
            // Cel w zasiegu — atakuj
            this._doAttack(ru, tgt, done);
            return;
          } else {
            // Podejdz o jeden krok
            const dc = Math.sign(tgt.q - ru.q);
            const dr = Math.sign(tgt.r - ru.r);
            let nc = ru.q + dc;
            let nr = ru.r + dr;
            if (!this.terrainMap.passable(nc, nr) || this.occByKey.has(cellKey(nc, nr))) {
              nc = ru.q + dc; nr = ru.r;
              if (!this.terrainMap.passable(nc, nr) || this.occByKey.has(cellKey(nc, nr))) {
                nc = ru.q; nr = ru.r + dr;
              }
            }
            if (nc !== ru.q || nr !== ru.r) this._doMove(ru, nc, nr, done);
            else done();
            return;
          }
        }
      }
      // ord.type === 'none' -> HOLD (stoj, nie przekazuj do AI)
      done();
      return;
    }

    // FACTOR 5 -- SURROUNDED: ONCE per unit, if >=3 enemies are adjacent
    // (Manhattan==1) it takes a one-off morale hit and may rout. The once-flag
    // (surroundApplied) prevents repeat hits / loops.
    if (!ru.surroundApplied && !ru.neverRout) {
      const enemies = ru.side === 'atk' ? this.def : this.atk;
      let adjEnemies = 0;
      for (const e of enemies) {
        if (e.dead || e.fadingOut || e.routed) continue;
        if (manhattan(e.q, e.r, ru.q, ru.r) === 1) adjEnemies++;
      }
      if (adjEnemies >= 3) {
        ru.surroundApplied = true;
        ru.morale = Math.max(0, ru.morale - MORALE_SURROUND_HIT);
        this._updateMoraleBar(ru);
        this._checkRout(ru);
        if (ru.routed) { this._fleeStep(ru, done); return; }
      }
    }

    // Re-orient toward the nearest enemy before acting: this is the unit
    // "picking a new target", so its FRONT tracks the line it engages.
    this._updateFacing(ru);

    // SIEGE v2 -- WALL WALKWAY DEFENDERS: stay on the wall, get +1 range bonus.
    // A unit with onWallWalkway=true NEVER steps off the wall voluntarily. It
    // either shoots (with the elevation range bonus) or fights melee against
    // enemies at the base or on the walkway. No kiting, no advancing.
    if (ru.onWallWalkway) {
      // Defender CATAPULT (kontrbateria): range already set to 6 in _placeSiegeDefenders.
      // No additional range boost needed (already includes elevation).
      const wallRangeBonus = (ru.rangedBase && !this._isCatapult(ru.bu)) ? 1 : 0;
      // Temporarily boost range for this action (elevation = +1 like hills).
      const origRange = ru.range;
      if (wallRangeBonus > 0) ru.range = origRange + wallRangeBonus;

      if (canShoot(ru)) {
        // DEFENDER CATAPULT (kontrbateria): prioritize nearest attacker catapult in range 6.
        let tgt: RuntimeBattleUnit | null = null;
        if (this._isCatapult(ru.bu) && ru.side === 'def') {
          // Find nearest attacker catapult within range 6.
          const enemies = this._enemiesOf(ru);
          let bestCata: RuntimeBattleUnit | null = null;
          let bestCataDist = Infinity;
          for (const e of enemies) {
            if (e.dead || e.fadingOut || e.routed) continue;
            if (!this._isCatapult(e.bu)) continue;
            const dd = manhattan(ru.q, ru.r, e.q, e.r);
            if (dd <= ru.range && dd < bestCataDist) { bestCataDist = dd; bestCata = e; }
          }
          tgt = bestCata ?? this._rangedTargetInRange(ru);
        } else {
          // Shoot: use standard ranged action but DISABLE kiting/movement.
          tgt = this._rangedTargetInRange(ru);
        }
        if (tgt) {
          ru.range = origRange; // restore before doAttack reads it
          this._doAttack(ru, tgt, done);
          return;
        }
        // No target in range (wall range bonus already applied) -> hold.
        ru.range = origRange;
        done();
        return;
      }
      // Melee: check adjacency (includes base-of-wall and on-walkway).
      ru.range = origRange;
      const adj = this._targetInRange(ru);
      if (adj) { this._doAttack(ru, adj, done); return; }
      // Nothing to do this turn -> hold position on the wall.
      done();
      return;
    }

    // SIEGE v2 -- SIEGE TOWER: rejestracja w towerAtWallRows odbywa sie
    // w bloku isSiegeUnit powyzej; tutaj juz nie powielamy.

    // SIEGE v2 -- CLIMB via SIEGE TOWER: attacking infantry adjacent to a siege
    // tower that is at the wall base can step onto the wall walkway.
    if (!ru.onWallWalkway && ru.side === 'atk' && this.siegeWallCol >= 0 &&
        !isSiegeUnit(ru.bu) && !ru.mounted) {
      const wallBase = this.siegeWallCol - 1;
      // Is the unit adjacent to a tower at the wall?
      let canClimb = false;
      if (this.towerAtWallRows.size > 0) {
        for (const [dc, dr] of DIRS4) {
          const nc = ru.q + dc;
          const nr = ru.r + dr;
          if (nc === wallBase && this.towerAtWallRows.has(nr)) {
            canClimb = true; break;
          }
        }
      }
      if (canClimb) {
        // Check that the walkway tile at (wallCol, ru.r) is free.
        const wallCol = this.siegeWallCol;
        const wallRow = ru.r; // same row as the unit
        const wallKey = cellKey(wallCol, wallRow);
        if (!this.occByKey.has(wallKey)) {
          // Climb: move onto walkway. Costs all movement.
          this.occByKey.delete(cellKey(ru.q, ru.r));
          ru.q = wallCol;
          ru.r = wallRow;
          ru.onWallWalkway = true;
          this.occByKey.set(wallKey, ru);
          const { x, z } = cellToWorld(wallCol, wallRow);
          const walkY = 2.5; // wall walk height
          ru.group.position.set(x, walkY, z);
          ru.hpBarGroup.position.set(x, walkY + HPBAR_Y, z);
          ru.moveLeft = 0;
          done();
          return;
        }
      }
    }

    // SIEGE MACHINES: ruch i atak.
    // Taran (battering ram): atakuje TYLKO bramę z dystansu 1.
    // Katapulta (catapult, ranged): atakuje NAJBLIŻSZY kafel Muru z dystansu.
    // Wieża oblężnicza (siege tower): jedzie pod mur, piechota wchodzi po drabinie.
    // Zwykłe jednostki: nie niszczą muru ani bramy.
    if (isSiegeUnit(ru.bu) && ru.side === 'atk' && this.siegeWallCol >= 0) {
      const isRam  = this._isRam(ru.bu);
      const isCata = this._isCatapult(ru.bu);
      const isTower = isSiegeTower(ru.bu);
      if (isRam && !this.gateOpen) {
        // TARAN: jedzie do bramy i uderza gdy dystans 1
        const distToGate = manhattan(ru.q, ru.r, this.siegeGateCol, this.siegeGateRow);
        if (distToGate <= 1) {
          this._attackGate(ru, done);
          return;
        }
        this._advanceToward(ru, this.siegeGateCol, this.siegeGateRow, done);
        return;
      }
      if (isCata && this.wallTileHp.size > 0) {
        // KATAPULTA: strzela w NAJBLIŻSZY żywy kafel muru z zasięgu.
        // FIX 1: NIE rób pathfindingu do impassable kafla muru (BTerrain.Wall).
        // Zamiast tego poruszaj się na tile (wallCol-1, bestRow) = tuż przed murem.
        // FIX 2: Gdy w zasięgu — stój i strzelaj (stop-and-fire), nie idź dalej.
        const wallCol = this.siegeWallCol;
        const cataRange = 5; // zasięg katapulty (decyzja Naster)
        let bestRow = -1, bestDist = Infinity;
        for (const [wr, hp] of this.wallTileHp) {
          if (hp <= 0) continue; // już wyburzony
          const d = manhattan(ru.q, ru.r, wallCol, wr);
          if (d < bestDist) { bestDist = d; bestRow = wr; }
        }
        if (bestRow >= 0 && bestDist <= cataRange) {
          // W zasięgu — strzelaj natychmiast (stop-and-fire), nie ruszaj się.
          this._attackWallTile(ru, bestRow, done);
          return;
        }
        // Poza zasięgiem — podejdź do (wallCol-1, bestRow): kafel PRZED murem (passable).
        if (bestRow >= 0) {
          const approachCol = Math.max(0, wallCol - 1);
          this._advanceToward(ru, approachCol, bestRow, done);
          return;
        }
        // Wszystkie kafle muru wyburzone — atakuj piechurów wroga
      }
      if (isTower) {
        // Wieża: jedzie pod mur (siegeWallCol-1); rejestracja w towerAtWallRows obsługiwana wyżej
        const wallBase = this.siegeWallCol - 1;
        if (ru.q >= wallBase) {
          this.towerAtWallRows.add(ru.r);
          done(); return; // stoi przy murze
        }
        this._advanceToward(ru, wallBase, ru.r, done);
        return;
      }
    }

    // NAPRAWA problem 4 — SIEGE DEFENDER HOLD (early check):
    // Wszyscy obrońcy siege (ranged, cavalry, phalanx, melee) NIGDY nie wychodzą ku wrogom.
    // Strzelają/atakują tylko przyległych; w przeciwnym razie HOLD.
    if (ru.side === 'def' && this.siegeWallCol >= 0) {
      if (canShoot(ru)) {
        const tgt = this._rangedTargetInRange(ru);
        if (tgt) { this._doAttack(ru, tgt, done); }
        else { done(); }
      } else {
        const adj = this._targetInRange(ru);
        if (adj) { this._doAttack(ru, adj, done); }
        else { done(); }
      }
      return;
    }

    // RANGED units (with ammo) use the dedicated kite-and-shoot decision so they
    // shoot the instant they can and back off rather than being pulled into melee.
    // TRYB shootingEnabled=false: idzie wrecz zamiast strzelac.
    if (canShoot(ru) && ru.shootingEnabled !== false) { this._rangedAction(ru, done); return; }

    // 1A OUT OF AMMO -- a PRIMARY shooter (archer/slinger/skirmisher) that has
    // run dry does NOT charge and does NOT run to the board edge (TASK 4): it
    // FALLS BACK ~FALLBACK_TILES tiles toward its own rear, then HOLDS and avoids
    // combat. It fights melee ONLY if an enemy reaches it (adjacent). A melee
    // unit that merely spent its throwing ammo (e.g. a Legionista out of pila)
    // skips this and closes to the sword below.
    if (ru.primaryRanged) {
      // Record the column where it ran dry the first time we get here.
      if (ru.dryCol < 0) ru.dryCol = this._advanceCoord(ru);

      const adj = this._targetInRange(ru); // adjacent enemy (range is now 1, ammo spent)
      if (adj) {
        // An enemy has reached it -> it FIGHTS (melee), whether or not it has a
        // retreat tile. (Holding ground means standing and fighting when caught.)
        this._doAttack(ru, adj, done);
        return;
      }

      // Has it fallen back far enough? Stop once it is FALLBACK_TILES tiles back
      // from where it ran dry, OR FALLBACK_TILES tiles from the nearest threat.
      const movedBack = ru.dryCol - this._advanceCoord(ru); // >0 = retreated this far
      const nearest   = this._nearestEnemy(ru);
      const distThreat = nearest ? manhattan(ru.q, ru.r, nearest.q, nearest.r) : Infinity;
      if (movedBack >= FALLBACK_TILES || distThreat >= FALLBACK_TILES) {
        ru.heldAfterFallback = true;
      }
      if (ru.heldAfterFallback) {
        // HOLD: no enemy adjacent (handled above) -> stand still this turn.
        done();
        return;
      }
      // Still pulling back the first ~3 tiles toward its own rear.
      this._fallBackStep(ru, done);
      return;
    }

    // RULE 1 -- CAVALRY / CHARIOT target priority. A mounted unit rides for the
    // enemy HORSE first, then enemy SKIRMISHERS, then other non-spear melee, and
    // SHUNS the anti-cavalry spear wall (wlocznik / falanga). It attacks a spear
    // only when FORCED (adjacent with no better adjacent target and no maneuver
    // tile that keeps it clear of spears).
    if (ru.mounted) { this._cavalryAction(ru, done); return; }

    // RULE 2 -- PHALANX line cohesion. A phalanx engages an adjacent enemy, but
    // otherwise advances ONLY while staying aligned with its phalanx neighbours
    // (it must not outrun the line) and prefers to keep lateral adjacency (no
    // holes). A lone phalanx falls through to the normal melee advance below.
    if (ru.phalanx) { this._phalanxAction(ru, done); return; }

    // MELEE (CHANGE D): adjacent enemy -> strike now; else advance directly.
    const target0 = this._targetInRange(ru);
    if (target0) {
      this._doAttack(ru, target0, done);
      return;
    }
    this._advanceStep(ru, done);
  }

  // -------------------------------------------------------------------------
  // RULE 1 -- CAVALRY / CHARIOT tactical decision (target priority + spear avoid)
  // -------------------------------------------------------------------------

  /**
   * Priority class of an enemy from a cavalry unit's point of view (lower =
   * more desirable target):
   *   0 = enemy CAVALRY / chariot (ride for the enemy horse first),
   *   1 = enemy RANGED skirmisher (archer/slinger/javelin -- run them down),
   *   2 = other NON-spear melee,
   *   3 = anti-cavalry SPEAR (wlocznik / falanga) -- AVOID; only a forced target.
   */
  private _cavPriority(e: RuntimeBattleUnit): number {
    if (e.mounted)       return 0;
    if (e.primaryRanged) return 1;
    if (e.antiCavSpear)  return 2.5; // worse than other melee, better than nothing
    return 2;
  }

  /**
   * Pick a cavalry unit's preferred target among living enemies: the BEST
   * priority class (cavalry > ranged > other melee), ties broken by nearest then
   * lowest HP. Anti-cavalry spears are ranked WORST so they are chosen only when
   * no other enemy type remains on the field. Returns null if no enemy.
   */
  private _cavalryTarget(ru: RuntimeBattleUnit): RuntimeBattleUnit | null {
    let best: RuntimeBattleUnit | null = null;
    let bestP = Infinity;
    let bestD = Infinity;
    for (const e of this._enemiesOf(ru)) {
      const p = this._cavPriority(e);
      const d = manhattan(ru.q, ru.r, e.q, e.r);
      if (p < bestP ||
          (p === bestP && d < bestD) ||
          (p === bestP && d === bestD && best && e.bu.hp < best.bu.hp)) {
        bestP = p; bestD = d; best = e;
      }
    }
    return best;
  }

  /**
   * Among enemies ADJACENT to this cavalry unit, return the best NON-spear target
   * (so the rider strikes horse/skirmisher/plain-melee in preference to a spear),
   * or null if no adjacent non-spear enemy exists.
   */
  private _cavAdjacentNonSpear(ru: RuntimeBattleUnit): RuntimeBattleUnit | null {
    let best: RuntimeBattleUnit | null = null;
    let bestP = Infinity;
    for (const e of this._enemiesOf(ru)) {
      if (manhattan(ru.q, ru.r, e.q, e.r) !== 1) continue;
      if (e.antiCavSpear) continue;
      const p = this._cavPriority(e);
      if (p < bestP || (p === bestP && best && e.bu.hp < best.bu.hp)) { bestP = p; best = e; }
    }
    return best;
  }

  private _cavalryAction(ru: RuntimeBattleUnit, done: () => void): void {
    if (this.finished) { done(); return; }
    if (ru.dead || ru.fadingOut) { done(); return; }

    // 1) A worthy (non-spear) enemy is adjacent -> strike it now.
    const adjGood = this._cavAdjacentNonSpear(ru);
    if (adjGood) { this._doAttack(ru, adjGood, done); return; }

    // 2) Choose the priority target and try to MANEUVER toward it while shunning
    // the spear wall. If a maneuver step exists, take it (pure move).
    const tgt = this._cavalryTarget(ru);
    if (!tgt) { done(); return; }
    if (this._cavManeuverStep(ru, done, tgt)) return;

    // 3) No spear-clear step improved the approach. If FORCED -- an enemy spear
    // is adjacent and there is no better move -- attack the spear rather than
    // waste the turn (cornered against the wall). Otherwise hold this turn.
    let adjSpear: RuntimeBattleUnit | null = null;
    for (const e of this._enemiesOf(ru)) {
      if (manhattan(ru.q, ru.r, e.q, e.r) === 1) { adjSpear = e; break; }
    }
    if (adjSpear) { this._doAttack(ru, adjSpear, done); return; }
    done();
  }

  /**
   * Step a cavalry unit ONE tile toward its priority target while AVOIDING the
   * enemy spear wall. Scores each free/passable neighbour: it must strictly
   * reduce distance to the target; tiles ADJACENT to an enemy anti-cav spear are
   * heavily penalised so the rider swings around the spears rather than charging
   * into them. Animates the step (then re-evaluates next turn). Returns TRUE if a
   * step was issued (and `done` will be called by the move), FALSE if no
   * improving spear-clear step exists (caller decides whether to attack/hold).
   */
  private _cavManeuverStep(ru: RuntimeBattleUnit, done: () => void, tgt: RuntimeBattleUnit): boolean {
    if (ru.moveLeft <= 0) return false;
    const dNow = manhattan(ru.q, ru.r, tgt.q, tgt.r);

    let best: string | null = null;
    let bestScore = -Infinity;
    for (const [dc, dr] of DIRS4) {
      const nc = ru.q + dc;
      const nr = ru.r + dr;
      if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;
      const nk = cellKey(nc, nr);
      if (this.occByKey.has(nk)) continue;             // occupied
      if (!this.terrainMap.passable(nc, nr)) continue; // deep river

      const dTgt = manhattan(nc, nr, tgt.q, tgt.r);
      if (dTgt >= dNow) continue; // only steps that close on the chosen target

      // Penalise tiles next to an enemy spear (we want to AVOID the spear wall).
      let spearAdj = false;
      for (const e of this._enemiesOf(ru)) {
        if (e.antiCavSpear && manhattan(nc, nr, e.q, e.r) === 1) { spearAdj = true; break; }
      }
      // Closer-to-target dominates; staying clear of spears is a strong bonus.
      const score = (dNow - dTgt) * 10 + (spearAdj ? 0 : 5);
      if (score > bestScore) { bestScore = score; best = nk; }
    }

    if (!best) return false;
    const parts = best.split(',');
    const nc = Number(parts[0]);
    const nr = Number(parts[1]);
    this._doMove(ru, nc, nr, () => {
      if (this.finished) { done(); return; }
      // After the step: if now adjacent to a worthy target, stop (strike next
      // turn); else keep maneuvering while movement remains.
      if (this._cavAdjacentNonSpear(ru)) { done(); return; }
      if (ru.moveLeft > 0) {
        const t2 = this._cavalryTarget(ru);
        if (t2 && this._cavManeuverStep(ru, done, t2)) return;
      }
      done();
    });
    return true;
  }

  // -------------------------------------------------------------------------
  // RULE 2 -- PHALANX line cohesion (even line, never outrun, no gaps)
  // -------------------------------------------------------------------------

  /**
   * The phalanx LINE-FRONT advance coordinate for one side (RULE 2): the advance
   * column of the LAGGARD -- the LEAST-advanced living phalanx on this side,
   * INCLUDING this unit itself and INCLUDING any phalanx delayed by costly
   * terrain (water/forest): a stuck unit literally stands at a low advance column,
   * so taking the minimum over actual positions makes the laggard set the pace
   * even when it is bogged down. The whole line aligns DOWN to this value and
   * WAITS for the straggler; no phalanx is allowed to push more than one tile
   * past it (the shared anti-freeze creep). Returns null if this is the ONLY
   * living phalanx on its side (then it behaves like normal melee). Excludes
   * routed/dead/fading units.
   */
  private _phalanxLineFront(ru: RuntimeBattleUnit): number | null {
    const group = (ru.side === 'atk' ? this.atk : this.def)
      .filter(u => u.phalanx && !u.dead && !u.fadingOut && !u.routed);
    // Need at least one OTHER phalanx for line behaviour; a lone phalanx falls
    // back to normal melee in _phalanxAction.
    if (group.length <= 1) return null;
    let least = Infinity;
    for (const u of group) { const a = this._advanceCoord(u); if (a < least) least = a; }
    return least;
  }

  /**
   * A unit's side-relative ADVANCE coordinate: how far FORWARD (toward the enemy)
   * it stands. Attacker advances to higher col (+col); defender to lower col
   * (-col). Higher = further forward; lower = further back (toward own rear).
   * Used by both the phalanx line-front (RULE 2) and the out-of-ammo fall-back
   * distance (TASK 4).
   */
  private _advanceCoord(ru: RuntimeBattleUnit): number {
    return ru.side === 'atk' ? ru.q : -ru.q;
  }

  /** This unit's own side-relative advance coordinate (see _phalanxLineFront). */
  private _phalanxAdvanceOf(ru: RuntimeBattleUnit): number {
    return this._advanceCoord(ru);
  }

  private _phalanxAction(ru: RuntimeBattleUnit, done: () => void): void {
    if (this.finished) { done(); return; }
    if (ru.dead || ru.fadingOut) { done(); return; }

    // Engage normally: an adjacent enemy is struck this turn.
    const adj = this._targetInRange(ru);
    if (adj) { this._doAttack(ru, adj, done); return; }

    // Lone phalanx (no phalanx neighbours) -> behave like normal melee.
    const lineFront = this._phalanxLineFront(ru);
    if (lineFront === null) { this._advanceStep(ru, done); return; }

    // LINE COHESION (RULE 2, anti-freeze): lineFront is the LAGGARD's advance
    // column (the least-advanced living phalanx, including any unit stuck on
    // costly terrain). The line PRESSES FORWARD as a thick band every turn: a
    // phalanx keeps advancing unless it is already PHALANX_LEAD_TOLERANCE tiles
    // AHEAD of the laggard, in which case it pauses ONE turn so the straggler /
    // rear ranks even up. This deliberately does NOT freeze the whole front the
    // instant a single unit is one tile back (the old bug after front-rank
    // losses) -- a terrain-stuck straggler only reins the line in to a tolerance
    // band, it never stops the advance. _phalanxStep caps the step so a unit
    // never pushes beyond lineFront + PHALANX_LEAD_TOLERANCE.
    const myAdv = this._phalanxAdvanceOf(ru);
    if (myAdv > lineFront + PHALANX_LEAD_TOLERANCE) {
      // Too far ahead of the laggard -> HOLD one turn so the line evens up.
      done();
      return;
    }
    // Within the line band -> advance ONE controlled step that (a) closes on the
    // enemy, (b) prefers keeping lateral phalanx adjacency (no holes), and (c)
    // never overshoots beyond lineFront + PHALANX_LEAD_TOLERANCE (the shared band).
    this._phalanxStep(ru, done, lineFront);
  }

  /**
   * One cohesion-aware forward step for a phalanx. Picks the free/passable
   * neighbour that reduces distance to the nearest enemy, does NOT push the
   * unit's advance beyond lineFront+1 (so it never outruns the line), and prefers
   * tiles that keep it laterally adjacent to a friendly phalanx (closing gaps).
   * Single step; the line advances together over successive turns. Holds (no
   * move) if no compliant step exists.
   */
  private _phalanxStep(ru: RuntimeBattleUnit, done: () => void, lineFront: number): void {
    if (ru.moveLeft <= 0) { done(); return; }
    // Falanga NIE goni skirmisherow (procarze/lucznicy): celuj w najblizszego
    // NIE-dystansowego wroga (linia/wrecz). Gdy zostali sami kitujacy strzelcy
    // -> trzymaj linie, nie ruszaj w poscig (Naster: nierealistyczne).
    let enemy: RuntimeBattleUnit | null = null; let _bd = Infinity;
    for (const e of this._enemiesOf(ru)) {
      if (e.primaryRanged) continue;
      const d = manhattan(ru.q, ru.r, e.q, e.r);
      if (d < _bd) { _bd = d; enemy = e; }
    }
    if (!enemy) { done(); return; }
    const dNow = manhattan(ru.q, ru.r, enemy.q, enemy.r);
    const allies = (ru.side === 'atk' ? this.atk : this.def)
      .filter(u => u !== ru && u.phalanx && !u.dead && !u.fadingOut && !u.routed);

    let best: string | null = null;
    let bestScore = -Infinity;
    for (const [dc, dr] of DIRS4) {
      const nc = ru.q + dc;
      const nr = ru.r + dr;
      if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;
      const nk = cellKey(nc, nr);
      if (this.occByKey.has(nk)) continue;
      if (!this.terrainMap.passable(nc, nr)) continue;

      const dEnemy = manhattan(nc, nr, enemy.q, enemy.r);
      if (dEnemy >= dNow) continue; // must close on the enemy

      // Don't outrun the line: the step's advance coord must stay within the
      // tolerance band of the laggard (front + PHALANX_LEAD_TOLERANCE).
      const stepAdv = ru.side === 'atk' ? nc : -nc;
      if (stepAdv > lineFront + PHALANX_LEAD_TOLERANCE) continue;

      // Prefer keeping lateral adjacency to a friendly phalanx (avoid holes).
      let touchesPhalanx = false;
      for (const a of allies) {
        if (manhattan(nc, nr, a.q, a.r) === 1) { touchesPhalanx = true; break; }
      }
      const score = (dNow - dEnemy) * 10 + (touchesPhalanx ? 6 : 0);
      if (score > bestScore) { bestScore = score; best = nk; }
    }

    if (!best) { done(); return; } // no compliant step -> hold the line this turn
    const parts = best.split(',');
    const nc = Number(parts[0]);
    const nr = Number(parts[1]);
    this._doMove(ru, nc, nr, () => { done(); }); // exactly one controlled step per turn
  }

  // -------------------------------------------------------------------------
  // Private: RANGED tactical decision (CHANGE C -- kite & shoot ASAP)
  //
  // A shooter's single action each turn, in priority order:
  //   1) NEAREST enemy is at a SAFE distance and within range (RANGED_MIN_GAP <=
  //      dist <= range) -> SHOOT it this turn (prefer the nearest valid target).
  //      Do not reposition when it can already fire -- shoot ASAP.
  //   2) An enemy is too close (dist < RANGED_MIN_GAP, i.e. adjacent) -> KITE:
  //      step toward the reachable tile that MAXIMISES distance from the nearest
  //      threat while staying within range (so it can shoot next turn), biased
  //      toward its own back edge / open space, never stepping next to another
  //      enemy. After kiting, if a step opened a safe in-range shot this turn it
  //      still holds fire (one action/turn) -- it shoots next turn.
  //   3) No enemy in range (dist > range) -> APPROACH the nearest enemy by the
  //      most direct step, but STOP at the farthest tile still within range
  //      (never walk to point-blank/adjacent), then shoot on a later turn.
  // -------------------------------------------------------------------------

  private _rangedAction(ru: RuntimeBattleUnit, done: () => void): void {
    if (this.finished) { done(); return; }
    if (ru.dead || ru.fadingOut) { done(); return; }

    const nearest = this._nearestEnemy(ru);
    if (!nearest) { done(); return; }
    const dNear = manhattan(ru.q, ru.r, nearest.q, nearest.r);

    // =====================================================================
    // STRICT DETERMINISTIC RANGED PRIORITY (no oscillation). Exactly ONE of
    // the four branches fires per activation, checked top-down:
    //
    //   1) KITE  -- a melee foe is within MELEE_SAFE_GAP (Manhattan <= 2):
    //               step directly AWAY one tile to restore the gap. The ONLY
    //               reason to move backward while armed.
    //   2) SHOOT -- otherwise, if a target is in firing range: SHOOT and STAY.
    //               Shooting beats moving. (No RANGED_MIN_GAP gate: once the
    //               melee-threat check in (1) has passed, any in-range target
    //               is fair game, even point-blank ranged-vs-ranged.)
    //   3) APPROACH -- otherwise (no target in range): march FORWARD toward
    //               the nearest enemy by the SAME shortest path the melee
    //               units use, stopping the instant a target enters range.
    //   4) (out of ammo never reaches here -- canShoot is false and the
    //       caller routes it to the fall-back path.)
    // =====================================================================

    // 1) STEP BACK -- a melee threat has closed inside MELEE_SAFE_GAP. Step
    // straight BACK along our ADVANCE AXIS (toward our own rear) to restore the
    // gap, keeping our lane; if still in range afterwards we shoot next turn. If
    // cornered (no improving backward tile) don't waste the turn: fire the
    // in-range foe in our face. Enemy RANGED units never trigger this (we are
    // happy to stand near them and shoot).
    // TRYB rangedKite=false: pomijamy krok wstecz, unit bije z miejsca.
    if (ru.primaryRanged && ru.rangedKite !== false) {
      const meleeThreat = this._nearestEnemyMelee(ru);
      if (meleeThreat && manhattan(ru.q, ru.r, meleeThreat.q, meleeThreat.r) <= MELEE_SAFE_GAP) {
        // KITE-AND-SHOOT: step back the MINIMUM needed to a tile from which a
        // target is STILL within range, then FIRE this same turn -- never drift
        // off silently. Pick the single backward tile that maximises the gap to
        // the threat WHILE keeping it (or any enemy) shootable (Manhattan in
        // [1..range]). If no such tile exists, don't move -- just shoot the
        // nearest in-range threat from where we stand.
        const stepKey = this._bestKiteShotStep(ru, meleeThreat);
        if (stepKey) {
          const parts = stepKey.split(',');
          const nc = Number(parts[0]);
          const nr = Number(parts[1]);
          this._doMove(ru, nc, nr, () => {
            if (this.finished) { done(); return; }
            // Shoot from the new tile: prefer the nearest in-range target; else
            // the original melee threat if still within range; else end the turn
            // (the chosen tile guarantees something is in range).
            let tgt = this._rangedTargetInRange(ru);
            if (!tgt && !meleeThreat.dead && !meleeThreat.fadingOut && !meleeThreat.routed
                && manhattan(ru.q, ru.r, meleeThreat.q, meleeThreat.r) <= ru.range) {
              tgt = meleeThreat;
            }
            if (tgt) this._doAttack(ru, tgt, done);
            else done();
          });
          return;
        }
        // Cornered / no backward tile keeps a target in range -> shoot in place.
        const tgt = this._rangedTargetInRange(ru) ?? nearest;
        this._doAttack(ru, tgt, done);
        return;
      }
    }

    // 2) SHOOT and STAY -- any enemy within firing range (no melee foe is inside
    // the safe gap, branch 1 handled that). Shooting has priority over moving.
    if (dNear >= 1 && dNear <= ru.range) {
      const tgt = this._rangedTargetInRange(ru) ?? nearest;
      this._doAttack(ru, tgt, done);
      return;
    }

    // 3) ADVANCE FORWARD -- nothing in range: march along our ADVANCE AXIS toward
    // the enemy front (attacker -> +col/east, defender -> -col/west), keeping our
    // LANE (minimise lateral row change), and STOP the instant any enemy enters
    // firing range (it shoots on a later turn). No BFS-to-adjacency, no sideways
    // detours -- a clean forward step that keeps the skirmisher in its lane.
    this._rangedForwardStep(ru, done);
  }

  /** Advance-axis column DELTA for a side's FORWARD direction toward the enemy:
   *  attacker advances to higher col (+1, east); defender to lower col (-1, west). */
  private _advanceDir(side: 'atk' | 'def'): number {
    return side === 'atk' ? 1 : -1;
  }

  /**
   * RANGED FORWARD ADVANCE (task A): the primary fix for skirmishers drifting
   * sideways. The shooter steps along its side's ADVANCE AXIS toward the enemy
   * front, keeping its current LANE. Each turn it picks the passable neighbour
   * that most reduces the advance-axis (column) distance to the NEAREST enemy,
   * breaking ties by the SMALLEST lateral (row) change so it never fans out. It
   * STOPS the instant any enemy is within firing range (shoots on a later turn).
   * Verified in a /tmp sim: column distance to the enemy line decreases
   * monotonically with ~zero lateral drift, and it halts once in range.
   */
  private _rangedForwardStep(ru: RuntimeBattleUnit, done: () => void): void {
    if (this.finished) { done(); return; }
    if (ru.dead || ru.fadingOut) { done(); return; }
    if (ru.moveLeft <= 0) { done(); return; }

    const nearest = this._nearestEnemy(ru);
    if (!nearest) { done(); return; }
    // Already in range? Stop -- it will shoot next turn (and won't over-close).
    if (manhattan(ru.q, ru.r, nearest.q, nearest.r) <= ru.range) { done(); return; }

    const stepKey = this._bestForwardStep(ru, nearest);
    if (!stepKey) { done(); return; } // walled in: hold for this turn
    const parts = stepKey.split(',');
    const nc = Number(parts[0]);
    const nr = Number(parts[1]);

    this._doMove(ru, nc, nr, () => {
      if (this.finished) { done(); return; }
      const e = this._nearestEnemy(ru);
      if (!e) { done(); return; }
      // The moment we are within range, STOP (don't walk on toward adjacency).
      if (manhattan(ru.q, ru.r, e.q, e.r) <= ru.range) { done(); return; }
      if (ru.moveLeft > 0) this._schedule(STEP_GAP_MS, () => this._rangedForwardStep(ru, done));
      else done();
    });
  }

  /**
   * Choose the single best neighbour to step FORWARD onto for a shooter closing
   * on the enemy front, or null if no usable tile. Scores each free + passable
   * orthogonal neighbour:
   *   - PRIMARY: reduce the ADVANCE-AXIS (column) distance to the nearest enemy
   *     -- a forward step (along _advanceDir) beats a lateral one, which beats a
   *     backward step.
   *   - tie-break: SMALLEST change in lateral row (keep the lane); a step that
   *     also closes the row gap to the enemy edges out a pure-forward step into a
   *     wall, but lateral motion is otherwise minimised so units don't scatter.
   */
  private _bestForwardStep(ru: RuntimeBattleUnit, nearest: RuntimeBattleUnit): string | null {
    const dir = this._advanceDir(ru.side);
    const colDistNow = Math.abs(nearest.q - ru.q);

    let best: string | null = null;
    let bestColDist = Infinity;
    let bestLateral = Infinity;
    for (const [dc, dr] of DIRS4) {
      const nc = ru.q + dc;
      const nr = ru.r + dr;
      if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;
      const nk = cellKey(nc, nr);
      if (this.occByKey.has(nk)) continue;             // occupied
      if (!this.terrainMap.passable(nc, nr)) continue; // deep river

      // Advance-axis (column) distance to the enemy from the candidate tile.
      const colDist = Math.abs(nearest.q - nc);
      // Lateral (row) change from the unit's CURRENT lane -- keep it minimal.
      const lateral = Math.abs(nr - ru.r);
      // Reject tiles that move us AWAY along the advance axis (backward), unless
      // forward is fully blocked and lateral is needed to round an obstacle: we
      // only accept a non-reducing step if it strictly closes the row gap to the
      // enemy lane (so a clogged lane can shuffle one tile toward the foe's row).
      const forwardGain = colDistNow - colDist; // >0 means closer along the axis
      const rowGap     = Math.abs(nearest.r - nr) - Math.abs(nearest.r - ru.r); // <0 means closer in row
      if (forwardGain <= 0 && rowGap >= 0) continue; // neither closes axis nor row
      // dir is informational here; colDist already encodes the correct direction
      // because the enemy sits on the far side along the axis.
      void dir;

      if (colDist < bestColDist || (colDist === bestColDist && lateral < bestLateral)) {
        bestColDist = colDist;
        bestLateral = lateral;
        best = nk;
      }
    }
    return best;
  }

  /**
   * Choose the best neighbour to step BACKWARD onto (toward our own rear, away
   * from the enemy front) when a melee foe has closed inside MELEE_SAFE_GAP --
   * restoring the firing gap while keeping the lane. Returns null if cornered
   * (no passable backward tile that opens the gap). Prefers a pure step along the
   * advance axis toward home; minimises lateral row change. Refuses tiles adjacent
   * to any enemy (never back into a different sword).
   */
  private _bestBackStep(ru: RuntimeBattleUnit): string | null {
    const dir = this._advanceDir(ru.side); // forward dir; we want the OPPOSITE
    const enemies = this._enemiesOf(ru);
    if (enemies.length === 0) return null;
    const threat = this._nearestEnemyMelee(ru) ?? this._nearestEnemy(ru);
    if (!threat) return null;
    const dNow = manhattan(ru.q, ru.r, threat.q, threat.r);

    let best: string | null = null;
    let bestGap = -Infinity;
    let bestLateral = Infinity;
    for (const [dc, dr] of DIRS4) {
      const nc = ru.q + dc;
      const nr = ru.r + dr;
      if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;
      const nk = cellKey(nc, nr);
      if (this.occByKey.has(nk)) continue;
      if (!this.terrainMap.passable(nc, nr)) continue;

      // Never back ONTO a tile adjacent to ANY enemy.
      let dMinAny = Infinity;
      for (const e of enemies) {
        const dd = manhattan(nc, nr, e.q, e.r);
        if (dd < dMinAny) dMinAny = dd;
      }
      if (dMinAny <= 1) continue;

      const gap = manhattan(nc, nr, threat.q, threat.r);
      if (gap <= dNow) continue; // must open the gap from the threat
      // Prefer stepping straight back along the advance axis (col change toward
      // home, i.e. -dir), with minimal lateral row change to keep the lane.
      const movedBackAxis = (nc - ru.q) === -dir; // a pure backward axis step
      const lateral = Math.abs(nr - ru.r);
      // Score: gap opened dominates; a true backward-axis step is preferred via a
      // bonus; smallest lateral breaks remaining ties.
      const gapScore = gap * 100 + (movedBackAxis ? 50 : 0);
      if (gapScore > bestGap || (gapScore === bestGap && lateral < bestLateral)) {
        bestGap = gapScore;
        bestLateral = lateral;
        best = nk;
      }
    }
    return best;
  }

  /**
   * KITE-AND-SHOOT step picker. Choose a SINGLE backward tile (toward our own
   * rear, away from the melee threat) such that AFTER moving there at least one
   * enemy -- ideally the threat itself -- is STILL within firing range (Manhattan
   * in [1..range]) so the kite ENDS WITH A SHOT this same turn. Among qualifying
   * tiles prefer the one that MAXIMISES the gap to the threat (kite as far as we
   * can while staying able to fire), tie-broken toward our own rear / minimal
   * lateral drift. Never steps adjacent to ANY enemy (don't back into a sword).
   * Returns null if no backward tile keeps a target in range (caller then shoots
   * in place instead of wasting the turn).
   */
  private _bestKiteShotStep(ru: RuntimeBattleUnit, threat: RuntimeBattleUnit): string | null {
    const dir = this._advanceDir(ru.side); // forward dir; we want the OPPOSITE
    const enemies = this._enemiesOf(ru);
    if (enemies.length === 0) return null;
    const dNow = manhattan(ru.q, ru.r, threat.q, threat.r);

    let best: string | null = null;
    let bestGap = -Infinity;
    let bestLateral = Infinity;
    for (const [dc, dr] of DIRS4) {
      const nc = ru.q + dc;
      const nr = ru.r + dr;
      if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;
      const nk = cellKey(nc, nr);
      if (this.occByKey.has(nk)) continue;
      if (!this.terrainMap.passable(nc, nr)) continue;

      // Distances FROM the candidate tile.
      let dMinAny = Infinity;
      let inRangeOfSome = false;
      for (const e of enemies) {
        const dd = manhattan(nc, nr, e.q, e.r);
        if (dd < dMinAny) dMinAny = dd;
        if (dd >= 1 && dd <= ru.range) inRangeOfSome = true;
      }
      // Never back ONTO a tile adjacent to ANY enemy.
      if (dMinAny <= 1) continue;
      // Must STILL be able to fire from here (otherwise the kite wastes the turn).
      if (!inRangeOfSome) continue;

      const gap = manhattan(nc, nr, threat.q, threat.r);
      if (gap <= dNow) continue; // must open the gap from the melee threat

      const movedBackAxis = (nc - ru.q) === -dir; // a pure backward axis step
      const lateral = Math.abs(nr - ru.r);
      const gapScore = gap * 100 + (movedBackAxis ? 50 : 0);
      if (gapScore > bestGap || (gapScore === bestGap && lateral < bestLateral)) {
        bestGap = gapScore;
        bestLateral = lateral;
        best = nk;
      }
    }
    return best;
  }

  /**
   * Step BACKWARD one tile at a time along the advance axis to restore the firing
   * gap from an encroaching melee foe (task A priority 1), spending up to the
   * unit's movement this turn. Pure move -- the shot follows on a later turn.
   * Stops once at a safe gap or when no improving backward tile remains.
   */
  private _rangedBackStep(ru: RuntimeBattleUnit, done: () => void): void {
    if (this.finished) { done(); return; }
    if (ru.dead || ru.fadingOut) { done(); return; }
    if (ru.moveLeft <= 0) { done(); return; }

    // Safe already? (nearest melee enemy beyond the safe gap) -> stop.
    const m = this._nearestEnemyMelee(ru);
    if (!m || manhattan(ru.q, ru.r, m.q, m.r) > MELEE_SAFE_GAP) { done(); return; }

    const stepKey = this._bestBackStep(ru);
    if (!stepKey) { done(); return; }
    const parts = stepKey.split(',');
    const nc = Number(parts[0]);
    const nr = Number(parts[1]);

    this._doMove(ru, nc, nr, () => {
      if (this.finished) { done(); return; }
      const m2 = this._nearestEnemyMelee(ru);
      if (!m2 || manhattan(ru.q, ru.r, m2.q, m2.r) > MELEE_SAFE_GAP) { done(); return; }
      if (ru.moveLeft > 0) this._schedule(STEP_GAP_MS, () => this._rangedBackStep(ru, done));
      else done();
    });
  }

  /**
   * Pick the best LEGAL target a shooter may fire at from its CURRENT tile,
   * preferring the NEAREST enemy within [1..range] (ties broken by lower HP so
   * it finishes wounded foes). Returns null if nothing is in range. Distinct
   * from _targetInRange (which prefers lowest HP regardless of distance): the
   * kite logic wants the CLOSEST in-range target, matching "prefer the nearest".
   */
  private _rangedTargetInRange(ru: RuntimeBattleUnit): RuntimeBattleUnit | null {
    let best: RuntimeBattleUnit | null = null;
    let bestD = Infinity;
    for (const e of this._enemiesOf(ru)) {
      const dd = manhattan(ru.q, ru.r, e.q, e.r);
      if (dd < 1 || dd > ru.range) continue;
      if (dd < bestD || (dd === bestD && best && e.bu.hp < best.bu.hp)) {
        bestD = dd; best = e;
      }
    }
    return best;
  }

  /**
   * KITE one tile at a time AWAY from the nearest threat, spending up to the
   * unit's movement this turn. Each step picks the free, passable neighbour that
   * best (a) increases the distance to the nearest enemy, (b) stays within the
   * unit's own range of some enemy when possible (so it can still shoot), and
   * (c) edges toward its own home side / open space, and which is never adjacent
   * to a DIFFERENT enemy (don't retreat into another sword). Stops once it stands
   * at a safe distance (>= RANGED_MIN_GAP) from the nearest enemy or when no step
   * improves the situation / movement runs out. Pure move -- the shot follows on
   * a later turn.
   */
  private _kiteStep(ru: RuntimeBattleUnit, done: () => void): void {
    if (this.finished) { done(); return; }
    if (ru.dead || ru.fadingOut) { done(); return; }
    if (ru.moveLeft <= 0) { done(); return; }
    // rangedKite=false: pomijamy kite, natychmiast done
    if (ru.rangedKite === false) { done(); return; }

    const nearest = this._nearestEnemy(ru);
    if (!nearest) { done(); return; }

    // SKIRMISH REFINE: a PRIMARY shooter kites until it is at least MELEE_SAFE_GAP
    // from the nearest enemy MELEE unit (it tolerates standing near enemy ranged
    // units). Other shooters (e.g. a melee unit momentarily routed through here)
    // use the generic RANGED_MIN_GAP from the nearest enemy of any kind.
    if (this._kiteGapSatisfied(ru)) { done(); return; }

    const stepKey = this._bestKiteStep(ru);
    if (!stepKey) { done(); return; } // cornered / no improving retreat tile
    const parts = stepKey.split(',');
    const nc = Number(parts[0]);
    const nr = Number(parts[1]);

    this._doMove(ru, nc, nr, () => {
      if (this.finished) { done(); return; }
      // Reached a safe gap -> stop (shoot on a later turn).
      if (this._kiteGapSatisfied(ru)) { done(); return; }
      if (ru.moveLeft > 0) this._schedule(STEP_GAP_MS, () => this._kiteStep(ru, done));
      else done();
    });
  }

  /**
   * Choose the single best neighbour tile to KITE onto, or null if none helps.
   * Scores each free + passable orthogonal neighbour:
   *   - PRIMARY: maximise the distance to the NEAREST enemy (open up the gap).
   *   - reject tiles ADJACENT to any enemy (never back into a different melee).
   *   - prefer tiles still within the unit's RANGE of some enemy (so it keeps a
   *     shot next turn) over tiles that flee out of range entirely.
   *   - tie-break toward the unit's OWN home edge (attacker -> lower col / -X;
   *     defender -> higher col / +X) so it retreats toward its side, not sideways.
   */
  /**
   * SKIRMISH REFINE: is this unit currently at a SAFE gap (no need to kite
   * further)? For a PRIMARY shooter, "safe" means the nearest enemy MELEE unit
   * is at least MELEE_SAFE_GAP away (enemy ranged units are tolerated); if no
   * melee enemy remains, it is always safe. For any other unit, fall back to the
   * generic RANGED_MIN_GAP from the nearest enemy of any kind.
   */
  private _kiteGapSatisfied(ru: RuntimeBattleUnit): boolean {
    if (ru.primaryRanged) {
      const m = this._nearestEnemyMelee(ru);
      if (!m) return true;
      return manhattan(ru.q, ru.r, m.q, m.r) >= MELEE_SAFE_GAP;
    }
    const n = this._nearestEnemy(ru);
    if (!n) return true;
    return manhattan(ru.q, ru.r, n.q, n.r) >= RANGED_MIN_GAP;
  }

  private _bestKiteStep(ru: RuntimeBattleUnit): string | null {
    const enemies = this._enemiesOf(ru);
    if (enemies.length === 0) return null;
    // SKIRMISH REFINE: a PRIMARY shooter scores candidate tiles by distance from
    // the nearest enemy MELEE unit (the thing it must escape); other units use
    // the nearest enemy of any kind. The chosen "threat" anchor below.
    const threat = ru.primaryRanged
      ? (this._nearestEnemyMelee(ru) ?? this._nearestEnemy(ru))
      : this._nearestEnemy(ru);
    const dNow = threat ? manhattan(ru.q, ru.r, threat.q, threat.r) : Infinity;

    let best: string | null = null;
    let bestScore = -Infinity;
    for (const [dc, dr] of DIRS4) {
      const nc = ru.q + dc;
      const nr = ru.r + dr;
      if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;
      const nk = cellKey(nc, nr);
      if (this.occByKey.has(nk)) continue;            // occupied
      if (!this.terrainMap.passable(nc, nr)) continue; // deep river

      // Distances FROM the candidate tile: dMinAny = nearest enemy of ANY kind
      // (used to forbid backing into adjacency with any sword), dMinThreat =
      // nearest MELEE enemy for a PRIMARY shooter (the gap we are opening) and
      // the nearest enemy of any kind otherwise.
      let dMinAny = Infinity;
      let dMinThreat = Infinity;
      let inRangeOfSome = false;
      for (const e of enemies) {
        const dd = manhattan(nc, nr, e.q, e.r);
        if (dd < dMinAny) dMinAny = dd;
        const counts = ru.primaryRanged ? !e.primaryRanged : true;
        if (counts && dd < dMinThreat) dMinThreat = dd;
        if (dd >= 1 && dd <= ru.range) inRangeOfSome = true;
      }
      // For a PRIMARY shooter with only ranged foes left, there is no melee to
      // open distance from; fall back to the nearest enemy of any kind.
      if (dMinThreat === Infinity) dMinThreat = dMinAny;
      // Never retreat ONTO a tile adjacent to ANY enemy (that is INTO melee).
      if (dMinAny <= 1) continue;
      // Must actually open the gap vs the threat where we stand now.
      if (dMinThreat <= dNow) continue;

      // Score: distance opened (from the threat) dominates; keeping a shot is a
      // strong bonus; a small bias toward our own home edge breaks ties so we
      // flee backward toward our own rear, not sideways.
      const homeBias = ru.side === 'atk' ? -nc : nc; // atk wants low col, def high col
      const score = dMinThreat * 100 + (inRangeOfSome ? 40 : 0) + homeBias;
      if (score > bestScore) { bestScore = score; best = nk; }
    }
    return best;
  }

  /**
   * 1A FALL-BACK (out-of-ammo primary shooter): pick the best neighbour tile to
   * RETREAT onto -- toward the unit's OWN home edge and behind the friendly
   * melee line -- or null if cornered (no free/passable tile that moves it away
   * from the nearest enemy). Unlike kiting (which wants to keep a shot), this
   * just wants to get OUT of the melee: it maximises distance to the nearest
   * enemy and biases hard toward the home edge, and refuses tiles adjacent to an
   * enemy. With no ammo there is no range to preserve.
   */
  private _bestFallBackStep(ru: RuntimeBattleUnit): string | null {
    const enemies = this._enemiesOf(ru);
    if (enemies.length === 0) return null;
    const nearestNow = this._nearestEnemy(ru);
    const dNow = nearestNow ? manhattan(ru.q, ru.r, nearestNow.q, nearestNow.r) : Infinity;

    let best: string | null = null;
    let bestScore = -Infinity;
    for (const [dc, dr] of DIRS4) {
      const nc = ru.q + dc;
      const nr = ru.r + dr;
      if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;
      const nk = cellKey(nc, nr);
      if (this.occByKey.has(nk)) continue;             // occupied
      if (!this.terrainMap.passable(nc, nr)) continue; // deep river

      let dMin = Infinity;
      for (const e of enemies) {
        const dd = manhattan(nc, nr, e.q, e.r);
        if (dd < dMin) dMin = dd;
      }
      // Never retreat ONTO a tile adjacent to an enemy, and only accept tiles
      // that do not bring us CLOSER to the nearest threat.
      if (dMin <= 1) continue;
      if (dMin < dNow) continue;

      // Strong home-edge bias so the skirmisher streams back behind its line;
      // distance opened is a secondary tie-break.
      const homeBias = ru.side === 'atk' ? -nc : nc; // atk wants low col, def high col
      const score = homeBias * 100 + dMin;
      if (score > bestScore) { bestScore = score; best = nk; }
    }
    return best;
  }

  /**
   * Walk one tile at a time toward the home edge / behind the melee line for an
   * out-of-ammo primary shooter, spending up to its movement this turn. Pure
   * move (no attack); stops when no improving fall-back tile remains. The
   * cornered case (attack instead) is decided by the caller via
   * _bestFallBackStep before this is invoked.
   */
  private _fallBackStep(ru: RuntimeBattleUnit, done: () => void): void {
    if (this.finished) { done(); return; }
    if (ru.dead || ru.fadingOut) { done(); return; }
    if (ru.moveLeft <= 0) { done(); return; }

    const stepKey = this._bestFallBackStep(ru);
    if (!stepKey) { done(); return; }
    const parts = stepKey.split(',');
    const nc = Number(parts[0]);
    const nr = Number(parts[1]);

    this._doMove(ru, nc, nr, () => {
      if (this.finished) { done(); return; }
      if (ru.moveLeft > 0) this._schedule(STEP_GAP_MS, () => this._fallBackStep(ru, done));
      else done();
    });
  }

  /**
   * APPROACH for a shooter that has NO enemy in range yet: march STRAIGHT at the
   * nearest enemy by the shortest path, exactly like a melee unit closing for the
   * kill, and STOP the instant a target enters firing range (it shoots on a later
   * turn). It deliberately drives toward a tile ADJACENT to the nearest enemy --
   * the SAME convergent BFS goal the melee advance uses (_firstStepAlongPathToMelee)
   * -- so the path always heads toward the enemy line and never to some far
   * "farthest-in-range" ring tile or sideways. The instant the unit stands within
   * range it halts (it does NOT walk on to adjacency). A greedy nudge toward the
   * nearest enemy is the fallback when BFS is fully walled in.
   */
  private _rangedApproachStep(ru: RuntimeBattleUnit, done: () => void): void {
    if (this.finished) { done(); return; }
    if (ru.dead || ru.fadingOut) { done(); return; }
    if (ru.moveLeft <= 0) { done(); return; }

    const nearest = this._nearestEnemy(ru);
    if (!nearest) { done(); return; }

    // Already in range? Stop -- it will shoot next turn (and won't over-close).
    if (manhattan(ru.q, ru.r, nearest.q, nearest.r) <= ru.range) { done(); return; }

    // Use the MELEE convergent path (goal = a free tile adjacent to the nearest
    // enemy) so the shooter walks straight at the enemy line. Fall back to a
    // greedy nudge that strictly reduces distance to the nearest enemy.
    const stepKey = this._firstStepTowardMelee(ru) ?? this._stepToward(ru, nearest);
    if (!stepKey) { done(); return; }
    const parts = stepKey.split(',');
    const nc = Number(parts[0]);
    const nr = Number(parts[1]);

    this._doMove(ru, nc, nr, () => {
      if (this.finished) { done(); return; }
      const e = this._nearestEnemy(ru);
      if (!e) { done(); return; }
      // The moment we are within range, STOP (don't walk to adjacency).
      if (manhattan(ru.q, ru.r, e.q, e.r) <= ru.range) { done(); return; }
      if (ru.moveLeft > 0) this._schedule(STEP_GAP_MS, () => this._rangedApproachStep(ru, done));
      else done();
    });
  }

  /**
   * MELEE ADVANCE (CHANGE D): walk one tile at a time toward the NEAREST enemy
   * by the most direct route, spending up to the unit's full movement points
   * this turn, and stop adjacent to it (ready to strike next turn). The route is
   * a BFS shortest path to the nearest free tile ADJACENT to an enemy, so the
   * unit drives straight forward into contact instead of wandering sideways; the
   * greedy fallback only accepts steps that strictly REDUCE distance to the
   * nearest enemy, so there is never any aimless lateral movement. This is a pure
   * move -- the unit does NOT attack even if a step brings it adjacent; it
   * strikes on a LATER turn. (Ranged units never reach here -- they use
   * _rangedAction; a shooter out of ammo falls through to this melee advance.)
   */
  // -------------------------------------------------------------------------
  // SIEGE: gate attack and move-toward-gate helpers
  // -------------------------------------------------------------------------

  /**
   * Siege machine attacks the gate this turn.
   * Deals a fixed damage based on unit Atak stat.
   * When gateHp drops to 0, the gate is breached: the gate mesh
   * portcullis/barrier is hidden, gate tiles become passable.
   */
  private _attackGate(ru: RuntimeBattleUnit, done: () => void): void {
    if (this.gateOpen || this.siegeGateCol < 0) { done(); return; }

    // Damage: siege machine Uderzenie * 2 (Taran: 10*2=20/trafienie -> brama 200 w ~10)
    const imp = Number((ru.bu.stats as any)?.['Uderzenie'] ?? (ru.bu.stats as any)?.['Atak'] ?? 8);
    const dmg = Math.max(12, Math.round(imp * 2));

    // FIX 4: Animacja taranu (ruch do przodu i powrót) + SFX uderzenia
    const gw = cellToWorld(this.siegeGateCol, this.siegeGateRow);
    const gateDir = new THREE.Vector3(
      gw.x - ru.group.position.x,
      0,
      gw.z - ru.group.position.z,
    ).normalize();
    this._animateRam(ru.group, gateDir);
    this._sfxRamImpact();

    // Aplikuj obrażenia
    this.gateHp = Math.max(0, this.gateHp - dmg);
    if (this.gateHp <= 0) {
      this._breachGate();
    } else {
      this._updateSiegeHud();
    }

    ru.acted = true;
    done();
  }

  /** Animacja taranu: ruch do przodu i powrót (trójkąt). */
  private _animateRam(ramMesh: THREE.Object3D, direction: THREE.Vector3): void {
    try {
      const startPos = ramMesh.position.clone();
      const hitPos = startPos.clone().addScaledVector(direction, 0.25);
      const duration = 320; // ms wirtualnych
      const t0 = this._now();

      const animRam = () => {
        if (this.finished) {
          ramMesh.position.copy(startPos);
          return;
        }
        const t = Math.min(1, (this._now() - t0) / duration);
        // Trójkąt: do przodu (t<0.5) potem powrót (t>=0.5)
        const forward = t < 0.5 ? t * 2 : (1 - t) * 2;
        ramMesh.position.lerpVectors(startPos, hitPos, forward);
        if (t >= 1) {
          ramMesh.position.copy(startPos);
          return;
        }
        requestAnimationFrame(animRam);
      };
      requestAnimationFrame(animRam);
    } catch { /* no-op */ }
  }

  /** SFX: ciężkie uderzenie taranu w bramę (boom 55Hz + transient metaliczny). */
  private _sfxRamImpact(): void {
    if (this._sfxOff()) return;
    try {
      const ac = this._ac!; const t = ac.currentTime;
      // Ciężki boom (55Hz)
      const osc = ac.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(60, t);
      osc.frequency.exponentialRampToValueAtTime(28, t + 0.45);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.85, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(g).connect(this._masterGain!);
      osc.start(t); osc.stop(t + 0.52);
      // Krótki metaliczny transient (800Hz)
      const osc2 = ac.createOscillator(); osc2.type = 'sawtooth';
      osc2.frequency.value = 820;
      const g2 = ac.createGain();
      g2.gain.setValueAtTime(0.0001, t);
      g2.gain.exponentialRampToValueAtTime(0.28, t + 0.003);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
      const lp2 = ac.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 2200;
      osc2.connect(lp2).connect(g2).connect(this._masterGain!);
      osc2.start(t); osc2.stop(t + 0.08);
      // Szum trzasku drewna
      const src = ac.createBufferSource(); src.buffer = this._noiseBuf(ac);
      const ng = ac.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.exponentialRampToValueAtTime(0.25, t + 0.005);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      src.connect(ng).connect(this._masterGain!);
      src.start(t); src.stop(t + 0.20);
    } catch { /* no-op */ }
  }

  /** Czy jednostka to Taran (battering ram) — atakuje bramę. */
  private _isRam(bu: BattleUnit): boolean {
    const n = normName(String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa ?? ''));
    return n.includes('taran') || n.includes('battering');
  }

  /** Czy jednostka to Katapulta (dystansowa machina) — niszczy mur. */
  private _isCatapult(bu: BattleUnit): boolean {
    const n = normName(String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa ?? ''));
    return n.includes('katapult') || n.includes('catapult') || n.includes('balist') || n.includes('onager');
  }

  /**
   * Katapulta ostrzeliwuje kafel muru (wallRow). Zadaje damage kaflu.
   * Kafel HP <= 0 -> wyburzenie: kafel staje się BTerrain.Plains (przejezdny).
   */
  private _attackWallTile(ru: RuntimeBattleUnit, wallRow: number, done: () => void): void {
    if (this.siegeWallCol < 0) { done(); return; }
    const rng = Number((ru.bu.stats as any)?.['Atak dystansowy'] ?? 0);
    const base = rng > 0 ? rng : Number((ru.bu.stats as any)?.['Atak'] ?? 8);
    const dmg = Math.max(16, Math.round(base * 2));

    // FIX 3: Animacja pocisku-kamienia katapulty (parabola) + SFX przy uderzeniu
    const aw = cellToWorld(ru.q, ru.r);
    const ww = cellToWorld(this.siegeWallCol, wallRow);
    const fromPos = new THREE.Vector3(aw.x, tileTopY(this.terrainMap, ru.q, ru.r) + 0.8, aw.z);
    const toPos   = new THREE.Vector3(ww.x, 1.5, ww.z); // uderza w mur na wys. 1.5
    this._spawnCatapultBoulder(fromPos, toPos);

    // Aplikuj obrażenia po czasie lotu (700ms)
    this._schedule(700, () => {
      const curHp = this.wallTileHp.get(wallRow) ?? 0;
      const newHp = Math.max(0, curHp - dmg);
      this.wallTileHp.set(wallRow, newHp);
      this.lastAttackedWallRow = wallRow;
      this._updateSiegeHud();
      this._spawnWallLabel(this.siegeWallCol, wallRow, '-' + dmg + ' (mur)', '#ff8800');
      if (newHp <= 0) {
        this._breachWallTile(wallRow);
      }
    });
    ru.acted = true;
    done();
  }

  /** Animacja pocisku kamiennego katapulty: sfera szara lecąca parabolą. */
  private _spawnCatapultBoulder(from: THREE.Vector3, to: THREE.Vector3): void {
    try {
      const geo = new THREE.SphereGeometry(0.32, 7, 7);
      const mat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9, metalness: 0.1 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(from);
      mesh.castShadow = true;
      this.scene.add(mesh);

      const duration = 700; // ms wirtualnego czasu
      const arcHeight = 3.5; // wysoka parabola (lob nad murem)
      const t0 = this._now();

      const animBoulder = () => {
        if (this.finished) {
          this.scene.remove(mesh);
          geo.dispose(); mat.dispose();
          return;
        }
        const t = Math.min(1, (this._now() - t0) / duration);
        const x = from.x + (to.x - from.x) * t;
        const z = from.z + (to.z - from.z) * t;
        const y = from.y + (to.y - from.y) * t + arcHeight * Math.sin(t * Math.PI);
        mesh.position.set(x, y, z);
        if (t >= 1) {
          this.scene.remove(mesh);
          geo.dispose(); mat.dispose();
          this._sfxCatapultImpact(); // SFX przy uderzeniu w mur
          return;
        }
        requestAnimationFrame(animBoulder);
      };
      requestAnimationFrame(animBoulder);
    } catch { /* no-op */ }
  }

  /** SFX: uderzenie kamienia katapulty w mur (boom 80Hz + szum). */
  private _sfxCatapultImpact(): void {
    if (this._sfxOff()) return;
    try {
      const ac = this._ac!; const t = ac.currentTime;
      // Niskie boom (80Hz) zanikające
      const osc = ac.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.35);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.75, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      osc.connect(g).connect(this._masterGain!);
      osc.start(t); osc.stop(t + 0.42);
      // Szum kamienia + okruchów
      const src = ac.createBufferSource(); src.buffer = this._noiseBuf(ac);
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
      const ng = ac.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.exponentialRampToValueAtTime(0.5, t + 0.008);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      src.connect(lp).connect(ng).connect(this._masterGain!);
      src.start(t); src.stop(t + 0.30);
    } catch { /* no-op */ }
  }

  /**
   * Wyburz kafel muru (HP=0): zamień BTerrain.Wall -> BTerrain.Plains.
   * Piechota może teraz tamtędy przejść.
   */
  private _breachWallTile(wallRow: number): void {
    const tiles = this.terrainMap.tiles;
    if (!tiles) return;
    const wallCol = this.siegeWallCol;
    const idx = wallRow * BF_COLS + wallCol;
    if (idx >= 0 && idx < tiles.length) {
      tiles[idx] = BTerrain.Plains;
    }
    this.wallTileHp.delete(wallRow);
    this._spawnWallLabel(wallCol, wallRow, 'MUR WYBURZONY!', '#ff4400');

    // NAPRAWA problem 3: WYRWA — ukryj segment muru (visible=false), dodaj gruz.
    if (this.siegeWallGroup) {
      // Ukryj segment muru dla tego rzędu (per-tile segmenty z buildWallBodySegmented)
      const wallMeshes = this.siegeWallGroup.userData['rowWallMeshes'] as Map<number, THREE.Mesh[]> | undefined;
      if (wallMeshes) {
        const segs = wallMeshes.get(wallRow);
        if (segs) segs.forEach(m => { m.visible = false; });
      }
      // Gruz — kilka małych boxów w miejscu wyłomu (world space).
      const { x: rubbleX, z: rubbleZ } = cellToWorld(wallCol, wallRow);
      const rubbleMat = new THREE.MeshLambertMaterial({ color: 0x6b5040 });
      const rubbleOffsets: [number, number, number, number, number, number][] = [
        [ 0.0,  0.12,  0.1,  0.40, 0.24, 0.35],
        [-0.2,  0.08, -0.1,  0.35, 0.20, 0.30],
        [ 0.3,  0.06,  0.0,  0.32, 0.16, 0.28],
        [-0.1,  0.10,  0.2,  0.28, 0.18, 0.25],
      ];
      for (const [ox, oy, oz, gw, gh, gd] of rubbleOffsets) {
        const geo = new THREE.BoxGeometry(gw, gh, gd);
        const mesh = new THREE.Mesh(geo, rubbleMat);
        mesh.position.set(rubbleX + ox, oy, rubbleZ + oz);
        const angle = (ox * 3.7 + oz * 2.1); // pseudo-deterministyczny obrót
        mesh.rotation.y = angle;
        this.scene.add(mesh);
        this.ownedGeos.push(geo);
        this.ownedMats.push(rubbleMat);
      }
    }

    // ZMIANA 5: obrońca na wyburzonym kaflu cofa się o 1 pole (nie ginie).
    // Katapulty obrońcy (nie mają jak zejść) → giną.
    for (const u of this.def) {
      if (u.dead || u.fadingOut || u.routed) continue;
      if (u.onWallWalkway && u.r === wallRow && u.q === wallCol) {
        if (this._isCatapult(u.bu)) {
          // Katapulta obrońcy na wyburzonym kaflu — niszczymy ją
          u.dead = true;
          u.fadingOut = true;
          u.fadeStart = performance.now();
          this.occByKey.delete(cellKey(u.q, u.r));
        } else {
          // Piechota/łucznik — cofa się o 1 pole w głąb obrony (wallCol+1)
          const retreatCol = Math.min(BF_COLS - 1, wallCol + 1);
          if (!this.occByKey.has(cellKey(retreatCol, wallRow)) && this.terrainMap.passable(retreatCol, wallRow)) {
            this.occByKey.delete(cellKey(u.q, u.r));
            u.q = retreatCol;
            u.r = wallRow;
            const { x, z } = cellToWorld(retreatCol, wallRow);
            const topY = tileTopY(this.terrainMap, retreatCol, wallRow);
            u.group.position.set(x, topY, z);
            u.hpBarGroup.position.set(x, topY + HPBAR_Y, z);
            this.occByKey.set(cellKey(retreatCol, wallRow), u);
          } else {
            // Spróbuj retreatCol+1 lub po prostu pozostań (nie ginie)
            let placed = false;
            for (let dc = 1; dc <= 3 && !placed; dc++) {
              const cc = Math.min(BF_COLS - 1, wallCol + dc);
              for (let dr = 0; dr <= 2 && !placed; dr++) {
                for (const rr of [wallRow + dr, wallRow - dr]) {
                  const rc = Math.max(0, Math.min(BF_ROWS - 1, rr));
                  if (!this.occByKey.has(cellKey(cc, rc)) && this.terrainMap.passable(cc, rc)) {
                    this.occByKey.delete(cellKey(u.q, u.r));
                    u.q = cc; u.r = rc;
                    const { x, z } = cellToWorld(cc, rc);
                    const topY = tileTopY(this.terrainMap, cc, rc);
                    u.group.position.set(x, topY, z);
                    u.hpBarGroup.position.set(x, topY + HPBAR_Y, z);
                    this.occByKey.set(cellKey(cc, rc), u);
                    placed = true;
                  }
                }
              }
            }
          }
          u.onWallWalkway = false; // zszedł z muru
        }
      }
    }

    // Morale: wyłom muru wstrząsa wszystkimi żywymi obrońcami
    for (const u of this.def) {
      if (u.dead || u.fadingOut || u.routed) continue;
      u.morale = Math.max(0, u.morale - MORALE_WALL_BREACH);
      this._updateMoraleBar(u);
      this._checkRout(u);
    }
  }

  /**
   * Open the gate: update terrain passability and hide the gate mesh.
   */
  private _breachGate(): void {
    this.gateOpen = true;
    this._updateSiegeHud();

    // Update terrain tiles: replace Gate with Plains so pathfinding opens up
    const tiles = this.terrainMap.tiles;
    if (tiles && this.siegeGateCol >= 0) {
      const wallCol = this.siegeGateCol;
      const midRow  = this.siegeGateRow;
      const gateRowLo = midRow - 1;
      const gateRowHi = midRow;
      for (let r = gateRowLo; r <= gateRowHi; r++) {
        const idx = r * BF_COLS + wallCol;
        if (idx >= 0 && idx < tiles.length && tiles[idx] === BTerrain.Gate) {
          tiles[idx] = BTerrain.Plains;
        }
      }
    }

    // Zmiana 3: Ukryj całą strukturę bramy — portkulisa + nadproże + most + filary.
    if (this.siegeWallGroup) {
      const gate: THREE.Group | null = this.siegeWallGroup.userData['gate'] as THREE.Group ?? null;
      if (gate) gate.visible = false;

      // Ukryj też nadproże / most / filary bramy:
      // Są to children wallGroup w lokalnym X bliskim 0 (centrum = gateCenterX),
      // które NIE należą do muru bocznego (ich X < gateW/2).
      // gateW = gateWidthTiles * tileSize = 2 * TILE_S = 2.0
      const gateCX  = (this.siegeWallGroup.userData['gateCenterX'] as number) ?? 0;
      const gateHalfW = TILE_S * 1.5; // gateWidthTiles=2, dodaj margines
      this.siegeWallGroup.children.forEach(child => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;                    // pomijaj Grupy (portkulisa)
        const lx = mesh.position.x;
        if (Math.abs(lx - gateCX) < gateHalfW + TILE_S * 0.6) {
          // Sprawdź: czy to element bramny (wyższy niż mur = nadbudówka, lub nadproże przy y≈H)
          const ly = mesh.position.y;
          const wallH = (this.siegeWallGroup!.userData['wallWalkY'] as number) ?? 2.5;
          // Nadproże (lintel): y ≈ wallH; Most (bridge): y ≈ wallH; Wieże bramne: y > wallH/2
          // Nie chcemy ukrywać ościeży/filarów bocznych muru — ale brama jest w centrum.
          if (ly >= wallH * 0.9 || (Math.abs(lx - gateCX) < gateHalfW * 0.9)) {
            mesh.visible = false;
          }
        }
      });
    }
    // Morale: wyłom bramy wstrząsa WSZYSTKIMI żywymi obrońcami (silniejszy efekt)
    for (const u of this.def) {
      if (u.dead || u.fadingOut || u.routed) continue;
      u.morale = Math.max(0, u.morale - MORALE_GATE_BREACH);
      this._updateMoraleBar(u);
      this._checkRout(u);
    }
  }

  /** Wyswietl etykiete tekstowa nad kaflem muru (worldSpace X/Z z col/row). */
  private _spawnWallLabel(wallCol: number, wallRow: number, text: string, color: string): void {
    const el = document.createElement('div');
    el.textContent = text;
    Object.assign(el.style, {
      position: 'absolute', pointerEvents: 'none', color,
      fontFamily: 'sans-serif', fontSize: '13px', fontWeight: 'bold',
      textShadow: '0 0 6px #000, 1px 1px 2px #000',
      whiteSpace: 'nowrap', transform: 'translate(-50%, -50%)', zIndex: '10010',
    });
    this.overlay.appendChild(el);
    const { x, z } = cellToWorld(wallCol, wallRow);
    this.floatLabels.push({
      elem: el, startTime: this.vLastWall, duration: 2000,
      worldPos: new THREE.Vector3(x, 3.2, z),
      riseRate: 0.00012,
    });
  }

  /** Odswierz HUD HP bramy i muru. */
  private _updateSiegeHud(): void {
    if (!this.siegeHudDiv) return;
    const gMax = 400;
    const gCur = this.gateOpen ? 0 : Math.max(0, this.gateHp);
    const gPct = Math.round(gCur / gMax * 100);
    const gBar = '\u2588'.repeat(Math.round(gPct / 10)) + '\u2591'.repeat(10 - Math.round(gPct / 10));
    let wallLine = '';
    if (this.lastAttackedWallRow >= 0) {
      const wCur = Math.max(0, this.wallTileHp.get(this.lastAttackedWallRow) ?? 0);
      const wPct = Math.round(wCur / BattleScene.WALL_TILE_HP * 100);
      const wBar = '\u2588'.repeat(Math.round(wPct / 10)) + '\u2591'.repeat(10 - Math.round(wPct / 10));
      wallLine = `<br>Mur: ${wCur}/${BattleScene.WALL_TILE_HP} ${wBar}`;
    }
    this.siegeHudDiv.innerHTML = `Brama: ${gCur}/${gMax} ${gBar}${wallLine}`;
  }

  /**
   * Advance one step toward a specific target (col, row).
   * Used by siege machines to approach the gate.
   */
  private _advanceToward(ru: RuntimeBattleUnit, targetCol: number, targetRow: number, done: () => void): void {
    if (this.finished) { done(); return; }
    if (ru.dead || ru.fadingOut) { done(); return; }
    if (ru.moveLeft <= 0) { done(); return; }

    // Pick the neighbour tile (4-connected) that is passable and closest to target
    const dirs: [number, number][] = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    let bestKey: string | null = null;
    let bestDist = Infinity;
    for (const [dc, dr] of dirs) {
      const nc = ru.q + dc;
      const nr = ru.r + dr;
      if (nc < 0 || nr < 0 || nc >= BF_COLS || nr >= BF_ROWS) continue;
      if (this.terrainMap.moveCost(nc, nr) === Infinity) continue;
      if (this.occByKey.has(cellKey(nc, nr))) continue;
      const d = Math.abs(nc - targetCol) + Math.abs(nr - targetRow);
      if (d < bestDist) { bestDist = d; bestKey = cellKey(nc, nr); }
    }

    if (!bestKey) { done(); return; }
    const parts = bestKey.split(',');
    const nc = Number(parts[0]);
    const nr = Number(parts[1]);
    this._doMove(ru, nc, nr, done);
  }

  private _advanceStep(ru: RuntimeBattleUnit, done: () => void): void {
    if (this.finished) { done(); return; }
    if (ru.dead || ru.fadingOut) { done(); return; }

    if (ru.moveLeft <= 0) { done(); return; }

    // Already standing where it could attack -> stop moving (it will strike
    // next turn).
    if (this._canAttackFrom(ru, ru.q, ru.r)) { done(); return; }

    const target = this._nearestEnemy(ru);
    if (!target) { done(); return; }

    // BFS the battlefield grid for the shortest path to a tile from which this
    // unit could attack (adjacent for melee, within range for ranged), then
    // take only its FIRST step. This routes around occupied allied tiles
    // instead of stalling like a greedy step would. If BFS finds nothing
    // reachable (fully walled in), fall back to a greedy nudge closer.
    const stepKey = this._firstStepAlongPathToAttack(ru) ?? this._stepToward(ru, target);
    if (!stepKey) {
      // Blocked / cannot get closer this turn.
      done();
      return;
    }
    const parts = stepKey.split(',');
    const nc = Number(parts[0]);
    const nr = Number(parts[1]);

    this._doMove(ru, nc, nr, () => {
      if (this.finished) { done(); return; }
      // Reached an attack position? Stop -- the blow happens on a later turn.
      if (this._canAttackFrom(ru, ru.q, ru.r)) { done(); return; }
      // Otherwise keep advancing while movement remains this turn.
      if (ru.moveLeft > 0) {
        this._schedule(STEP_GAP_MS, () => this._advanceStep(ru, done));
      } else {
        done();
      }
    });
  }

  // -------------------------------------------------------------------------
  // Private: targeting
  // -------------------------------------------------------------------------

  private _enemiesOf(ru: RuntimeBattleUnit): RuntimeBattleUnit[] {
    // Routed units are OUT of the fight -- they are no longer valid targets.
    return (ru.side === 'atk' ? this.def : this.atk).filter(u => !u.dead && !u.fadingOut && !u.routed);
  }

  private _nearestEnemy(ru: RuntimeBattleUnit): RuntimeBattleUnit | null {
    let best: RuntimeBattleUnit | null = null;
    let bestD = Infinity;
    for (const e of this._enemiesOf(ru)) {
      const dd = manhattan(ru.q, ru.r, e.q, e.r);
      if (dd < bestD) { bestD = dd; best = e; }
    }
    return best;
  }

  /**
   * SKIRMISH REFINE: the nearest enemy OFFENSIVE (melee) unit -- one that is NOT
   * itself primary-ranged and therefore closes in to fight (Legionista, Falanga,
   * Wlocznik, Wojownik, maczuga, topor, Konnica, Rydwan, super, ...). These are
   * the threats a shooter must keep MELEE_SAFE_GAP away from. Enemy archers /
   * slingers / javelineers are excluded -- a shooter is happy to stand near them
   * and shoot. Returns null if no melee enemy remains (then only ranged foes are
   * left and the shooter has nothing to flee from). Measured from (col,row).
   */
  private _nearestEnemyMelee(ru: RuntimeBattleUnit, col = ru.q, row = ru.r): RuntimeBattleUnit | null {
    let best: RuntimeBattleUnit | null = null;
    let bestD = Infinity;
    for (const e of this._enemiesOf(ru)) {
      if (e.primaryRanged) continue; // only OFFENSIVE (melee) units threaten the gap
      const dd = manhattan(col, row, e.q, e.r);
      if (dd < bestD) { bestD = dd; best = e; }
    }
    return best;
  }

  /**
   * Re-orient a unit's FACING toward its current nearest enemy and rotate the
   * model to match. Called at the start of each turn and after every step so a
   * unit always presents its FRONT toward the line it is engaging; an enemy
   * that strikes from outside that front arc lands a FLANK or REAR blow (the
   * SS5l flank/rear defence penalty -- see _singleBlow). No-op (facing kept) if
   * the unit has no living enemy or the enemy sits on its own tile.
   */
  private _updateFacing(ru: RuntimeBattleUnit): void {
    const enemy = this._nearestEnemy(ru);
    if (!enemy) return;
    const newFacing = facingFromTo(ru.q, ru.r, enemy.q, enemy.r, ru.facing);
    if (newFacing === ru.facing) return;
    ru.facing = newFacing;
    ru.group.rotation.y = dirYaw(newFacing);
  }

  /**
   * Return an enemy this unit may legally attack from its CURRENT tile, or null.
   *   - melee (range 0): only an ADJACENT enemy (Manhattan distance == 1).
   *   - ranged (range >= 2): any enemy within `range` tiles; prefers lowest HP.
   */
  private _targetInRange(ru: RuntimeBattleUnit): RuntimeBattleUnit | null {
    const enemies = this._enemiesOf(ru);
    if (canShoot(ru)) {
      let best: RuntimeBattleUnit | null = null;
      for (const e of enemies) {
        const dd = manhattan(ru.q, ru.r, e.q, e.r);
        if (dd >= 1 && dd <= ru.range) {
          if (!best || e.bu.hp < best.bu.hp) best = e;
        }
      }
      return best;
    }
    // SIEGE v2 -- MELEE: adjacency includes vertical wall combat.
    // An attacker at (wallCol-1, r) can strike a defender at (wallCol, r) and vice versa.
    // Both units at Manhattan==1 in grid coords: standard adjacency already covers this.
    // Extra case: if ONE unit is onWallWalkway at wallCol and the other is at wallCol-1,
    // they are "adjacent in the vertical sense" even though the tile is BTerrain.Wall.
    let best: RuntimeBattleUnit | null = null;
    for (const e of enemies) {
      const dd = manhattan(ru.q, ru.r, e.q, e.r);
      if (dd === 1) {
        if (!best || e.bu.hp < best.bu.hp) best = e;
      } else if (dd === 0) {
        // Same tile (walkway combat between two units who both climbed) -- treat as melee.
        if (!best || e.bu.hp < best.bu.hp) best = e;
      }
    }
    return best;
  }

  /** Nearest free neighbour tile that reduces distance to `target` (greedy fallback step). */
  private _stepToward(ru: RuntimeBattleUnit, target: RuntimeBattleUnit): string | null {
    let best: string | null = null;
    let bestD = manhattan(ru.q, ru.r, target.q, target.r);
    for (const [dc, dr] of DIRS4) {
      const nc = ru.q + dc;
      const nr = ru.r + dr;
      if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;
      const nk = cellKey(nc, nr);
      if (this.occByKey.has(nk)) continue; // occupied -- cannot enter
      if (!this.terrainMap.passable(nc, nr)) continue; // deep river -- cannot enter
      const dd = manhattan(nc, nr, target.q, target.r);
      if (dd < bestD) { bestD = dd; best = nk; }
    }
    return best;
  }

  /**
   * True if, standing on (col, row), this unit could legally attack a living
   * enemy.
   *   - melee (range 0): an enemy is ADJACENT (Manhattan distance == 1).
   *   - ranged (range >= 2): an enemy is within `ru.range` (and at least 1 away).
   * (col, row) is assumed to be a tile the unit could actually stand on.
   */
  private _canAttackFrom(ru: RuntimeBattleUnit, col: number, row: number): boolean {
    const reach = canShoot(ru) ? ru.range : 1;
    for (const e of this._enemiesOf(ru)) {
      const dd = manhattan(col, row, e.q, e.r);
      if (dd >= 1 && dd <= reach) return true;
    }
    return false;
  }

  /**
   * BFS the battlefield grid for the shortest walkable path from this unit's
   * tile to the NEAREST tile from which it could attack an enemy, and return the
   * FIRST step (a "col,row" key) along that path -- or null if no such tile is
   * reachable.
   *
   * Occupied tiles (allies AND enemies) are impassable walls, so a melee unit
   * cannot walk THROUGH the enemy line; it stops on the free tile next to it.
   * Enemy tiles still define the goal, because a free tile adjacent to (or
   * within range of) an enemy is a valid attack position. Distances here are
   * real grid path lengths, so the unit reliably routes around its own front
   * line instead of deadlocking behind it the way a greedy step would.
   */
  private _firstStepAlongPathToAttack(ru: RuntimeBattleUnit): string | null {
    const startKey = cellKey(ru.q, ru.r);

    // Already standing on an attack position -> handled by the caller, but be safe.
    if (this._canAttackFrom(ru, ru.q, ru.r)) return null;

    // BFS with parent links so we can reconstruct the first step.
    const parent = new Map<string, string | null>();
    parent.set(startKey, null);
    const frontier: Array<{ c: number; r: number }> = [{ c: ru.q, r: ru.r }];

    let goalKey: string | null = null;

    while (frontier.length > 0) {
      const cur = frontier.shift()!;
      for (const [dc, dr] of DIRS4) {
        const nc = cur.c + dc;
        const nr = cur.r + dr;
        if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;
        const nk = cellKey(nc, nr);
        if (parent.has(nk)) continue;          // already seen
        if (this.occByKey.has(nk)) continue;   // occupied -> wall (cannot stand here)
        // SIEGE v2: wall tiles (BTerrain.Wall) are normally impassable but an
        // attacker approaching the base of the siege wall should be able to
        // stand on the tile ADJACENT to the wall (wallCol-1) and attack
        // defenders onWallWalkway. The BFS node at wallCol is NOT walkable (unit
        // cannot physically stand in the wall body), so we stop exploration at
        // the wall column -- but we DO recognise that from (wallCol-1, r) the
        // attacker is within melee reach of a wall-walkway defender at (wallCol,r).
        // The _canAttackFrom check already handles this (Manhattan==1 to defender).
        // We only skip wall tiles from being ENTERED (continued expansion), not
        // from being TARGETED.
        if (!this.terrainMap.passable(nc, nr)) continue; // river / wall body -> cannot stand
        parent.set(nk, cellKey(cur.c, cur.r));
        if (this._canAttackFrom(ru, nc, nr)) { goalKey = nk; frontier.length = 0; break; }
        frontier.push({ c: nc, r: nr });
      }
    }

    if (!goalKey) return null;

    // Walk parent links back from the goal to the tile whose parent is the start.
    let node: string | null = goalKey;
    let prev: string | null = parent.get(node) ?? null;
    while (prev !== null && prev !== startKey) {
      node = prev;
      prev = parent.get(node) ?? null;
    }
    return prev === startKey ? node : null;
  }

  /**
   * BFS the battlefield grid for the shortest walkable path to a free tile that
   * is ADJACENT to ANY living enemy (Manhattan == 1), and return the FIRST step
   * along that path -- or null if no such tile is reachable. This is the MELEE
   * convergent goal (reach = 1 regardless of the unit's own range), so a SHOOTER
   * that reuses it marches STRAIGHT at the enemy line instead of drifting toward
   * a far in-range ring tile. Occupied tiles (allies AND enemies) are walls, so
   * the path stops on the free tile next to the line rather than walking through
   * it. (The caller halts the shooter the instant it is within firing range.)
   */
  private _firstStepTowardMelee(ru: RuntimeBattleUnit): string | null {
    const startKey = cellKey(ru.q, ru.r);
    const enemies = this._enemiesOf(ru);
    if (enemies.length === 0) return null;

    const adjEnemy = (c: number, r: number): boolean => {
      for (const e of enemies) {
        if (manhattan(c, r, e.q, e.r) === 1) return true;
      }
      return false;
    };

    // Already standing next to the line -> no step needed.
    if (adjEnemy(ru.q, ru.r)) return null;

    const parent = new Map<string, string | null>();
    parent.set(startKey, null);
    const frontier: Array<{ c: number; r: number }> = [{ c: ru.q, r: ru.r }];
    let goalKey: string | null = null;

    while (frontier.length > 0) {
      const cur = frontier.shift()!;
      for (const [dc, dr] of DIRS4) {
        const nc = cur.c + dc;
        const nr = cur.r + dr;
        if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;
        const nk = cellKey(nc, nr);
        if (parent.has(nk)) continue;          // already seen
        if (this.occByKey.has(nk)) continue;   // occupied -> wall (cannot stand here)
        if (!this.terrainMap.passable(nc, nr)) continue; // deep river -> wall
        parent.set(nk, cellKey(cur.c, cur.r));
        if (adjEnemy(nc, nr)) { goalKey = nk; frontier.length = 0; break; }
        frontier.push({ c: nc, r: nr });
      }
    }

    if (!goalKey) return null;

    let node: string | null = goalKey;
    let prev: string | null = parent.get(node) ?? null;
    while (prev !== null && prev !== startKey) {
      node = prev;
      prev = parent.get(node) ?? null;
    }
    return prev === startKey ? node : null;
  }

  // -------------------------------------------------------------------------
  // Private: animated single-tile move
  // -------------------------------------------------------------------------

  private _doMove(ru: RuntimeBattleUnit, col: number, row: number, done: () => void): void {
    this.busy = true;
    const oldKey = cellKey(ru.q, ru.r);
    const newKey = cellKey(col, row);
    this.occByKey.delete(oldKey);
    this.occByKey.set(newKey, ru);

    const from = cellToWorld(ru.q, ru.r);
    const to   = cellToWorld(col, row);
    // Capture the VISIBLE tile-top Y at BOTH ends (before ru.q/ru.r move) so the
    // walk interpolates height too: a unit climbing onto a hill smoothly rises
    // to the summit and descends coming off it (mirrors the world-map y-lerp).
    const fromTopY = tileTopY(this.terrainMap, ru.q, ru.r);
    const toTopY   = tileTopY(this.terrainMap, col, row);

    ru.q = col; ru.r = row;
    // Per-tile movement cost (B8): forest/hills cost 2, a river ford costs 3,
    // plains 1 (terrain-movement.json intent). Entering rough ground therefore
    // eats more of this turn's movement budget, so units cross terrain slower.
    // A river ford is finite-but-expensive; deep river is never entered (walled
    // out of pathing). Always spend at least 1 so a unit can take its step.
    const enterCost = Math.max(1, Math.min(this.terrainMap.moveCost(col, row), 99));
    ru.moveLeft = Math.max(0, ru.moveLeft - enterCost);

    // Re-orient toward the nearest enemy from the NEW tile so the FRONT keeps
    // tracking the enemy line as the unit advances. Drives the SS5l facing
    // model used in _singleBlow.
    this._updateFacing(ru);

    const t0 = this._now();
    const step = () => {
      if (this.finished) { this.busy = false; return; }
      const p = Math.min(1, (this._now() - t0) / MOVE_STEP_MS);
      const e = easeOut(p);
      const x = lerp(from.x, to.x, e);
      const z = lerp(from.z, to.z, e);
      // Interpolate the standing height the same way as x/z, then add the hop,
      // so the figure rides the slope between the two tile tops.
      const baseY = lerp(fromTopY, toTopY, e);
      const hop = Math.sin(p * Math.PI) * 0.12;
      ru.group.position.set(x, baseY + hop, z);
      ru.hpBarGroup.position.set(x, baseY + HPBAR_Y, z);
      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        ru.group.position.set(to.x, toTopY, to.z);
        ru.hpBarGroup.position.set(to.x, toTopY + HPBAR_Y, to.z);
        this.busy = false;
        done();
      }
    };
    requestAnimationFrame(step);
  }

  // -------------------------------------------------------------------------
  // Private: attack dispatch -- ONE BLOW per action (turn-by-turn)
  //
  // An attack is a SINGLE blow: one hit roll, one damage application. The
  // target does NOT counter within this action -- it strikes back on ITS OWN
  // turn. Combat therefore resolves gradually, one blow per attacker per turn,
  // while every other unit on the field also acts each turn.
  // -------------------------------------------------------------------------

  private _doAttack(attacker: RuntimeBattleUnit, defender: RuntimeBattleUnit, done: () => void): void {
    if (canShoot(attacker)) this._doRangedAttack(attacker, defender, done);
    else                    this._doMeleeAttack(attacker, defender, done);
  }

  /**
   * Compute ONE blow from attacker against defender using the canonical SS5l
   * formulas (hitChance / baseDamage / rangeDamage / counter), apply the
   * resulting damage to the defender's HP, and start its death/rout if needed.
   *
   * The Uderzenie charge bonus is added ONLY on the very first blow of this
   * particular engagement (attacker -> defender), and only for melee, and only
   * if the defender is not a bracing spear/phalanx. Returns the dealt damage
   * (0 on a miss) so the animation can show a floating '-N'.
   */
  private _singleBlow(attacker: RuntimeBattleUnit, defender: RuntimeBattleUnit, ranged: boolean): number {
    // AUDIO: a melee blow connecting = a metallic clash (ranged shots have their
    // own "whoosh" at firing in _doRangedAttack, so don't double up here).
    if (!ranged) this._sfxMelee();
    const cuA = toCombatUnit(attacker.bu);
    const cuD = toCombatUnit(defender.bu);

    // PER-TILE terrain (B8). The defender's OWN tile decides its terrain defence
    // bonus (hills / forest give the SS5j +50% via terrainDefenseMultiplier);
    // the ATTACKER's tile decides the river-crossing penalty (a unit striking
    // from a river ford gets -25% Atak via terrainRiverAttackMultiplier). Both
    // helpers come straight from combat.ts and match the data/terrain-combat.json
    // "Teren" rows by name, so the per-blow math stays canonical -- only WHICH
    // tile's terrain feeds each modifier changed (was a single battlefield-wide
    // terrain before). Facing/flank (B7) is applied first, exactly as before.
    // SIEGE v2: a defender standing on the wall walkway gets ×3.0 defence bonus
    // (bonus_obrona_mur_proc=200 z miasto-params, mnoznik = 1 + 200/100 = 3.0).
    // NIE uzywamy 'Wzgorza' (+50%) — stosujemy jawny mnoznik x3.0 dla onWallWalkway.
    const defTerrain = defender.onWallWalkway
      ? 'Plaskie (rownina/laka)'   // teren bazowy (x1.0) — mnoznik muru dodany ponizej
      : this.terrainMap.combatTerrainName(defender.q, defender.r);
    const atkTerrain = this.terrainMap.combatTerrainName(attacker.q, attacker.r);
    const terrDefMult  = defender.onWallWalkway
      ? 3.0  // bonus_obrona_mur_proc=200 => x3.0 (miasto-params.json)
      : terrainDefenseMultiplier(defTerrain, cuA.rola, this.terrainData);
    const terrRiverMlt = terrainRiverAttackMultiplier(atkTerrain, this.terrainData);

    // FACING (SS5l): where does this blow land relative to the DEFENDER's
    // facing? Front = no penalty; flank/rear reduce the defender's effective
    // Obrona by the defender's own "Kara obrony z flanki/tylu (%)" before the
    // terrain multiplier (identical order to resolveCombat: Obrona*(1-pen)*terr).
    const hitArc: FacingHit = relativeHit(
      defender.facing, attacker.q, attacker.r, defender.q, defender.r,
    );
    const defPenaltyFrac = flankRearDefensePenalty(cuD, hitArc);
    const defEffObrona   = Math.max(0, cuD.Obrona) * (1 - defPenaltyFrac);

    const defFinalObrona = defEffObrona * terrDefMult;
    const atkEffAtak     = cuA.Atak * terrRiverMlt;
    const ctrAtkVsDef    = counterMultiplier(cuA.typNazwa, cuD.typNazwa, this.counters);

    const hitPct = hitChance(atkEffAtak, defFinalObrona);
    const roll   = Math.random() * 100;
    if (roll >= hitPct) {
      this.log.push(attacker.bu.nazwa + ' chybia w ' + defender.bu.nazwa + ' (' + roll.toFixed(0) + '>=' + hitPct + '%).');
      return 0;
    }

    let rawDmg: number;
    let meleeCharge = false; // FACTOR 2 flag: this blow is a mounted charge's first blow
    if (ranged) {
      const atkDyst = cuA['Atak dystansowy'] * terrRiverMlt;
      rawDmg = rangeDamage(atkDyst, cuD.Pancerz);
    } else {
      // First blow of this engagement = charge (unless defender braces).
      const key = attacker.bu.id + '>' + defender.bu.id;
      const firstBlow = !this.engaged.has(key);
      const isCharge  = firstBlow && !bracesAgainstCharge(defender.bu);
      this.engaged.add(key);
      meleeCharge = isCharge; // FACTOR 2: mounted charge morale hit (set below)
      rawDmg = baseDamage(cuA.Atak, cuD.Pancerz, cuA.Przebicie, cuA.Uderzenie, isCharge);
    }
    // BONUS vs TYPE (battle-lane wiring; combat.ts untouched). The attacker's
    // "Bonus vs <defender.Typ> %" column scales the dealt damage. This REPLACES
    // relying on counters.json for the test battle (counters left intact).
    const bonusVsType = attackerBonusVsType(attacker.bu, defender.bu);
    const dmg = Math.max(1, Math.round(rawDmg * ctrAtkVsDef * bonusVsType));

    defender.bu.hp = Math.max(0, defender.bu.hp - dmg);
    this._updateHpBar(defender);
    const arcTag =
      hitArc === 'flank' ? ' [FLANKA -' + Math.round(defPenaltyFrac * 100) + '% obrony]'
      : hitArc === 'rear' ? ' [TYL -' + Math.round(defPenaltyFrac * 100) + '% obrony]'
      : '';
    this.log.push(
      attacker.bu.nazwa + ' trafia ' + defender.bu.nazwa + arcTag + ' za ' + dmg +
      ' (HP ' + defender.bu.hp + '/' + defender.bu.maxHp + ').',
    );

    // BATTLE MORALE -- extra FLAT morale loss this blow deals on top of the
    // HP-based loss (FACTOR 1 flank/rear + FACTOR 2 mounted charge). Folded into
    // the rout-before-death projection so a blow that breaks morale still routs.
    let extraMorale = 0;
    if (hitArc === 'flank') extraMorale += MORALE_FLANK_HIT;
    else if (hitArc === 'rear') extraMorale += MORALE_REAR_HIT;
    if (!ranged && attacker.mounted && meleeCharge) extraMorale += MORALE_CHARGE_HIT;

    // Death check for the target (one blow affects one unit). HP <= 0 kills it
    // outright (and shakes nearby allies). The old HP-fraction "Prog dezercji"
    // elimination is now handled by the MORALE pool below; a never-rout unit
    // (null threshold / "walczy do smierci") still only dies at HP <= 0.
    // ROUT-BEFORE-DEATH (Naster): cios, ktory zlamalby morale obroncy, sprawia ze
    // PEKA I UCIEKA zamiast ginac -- zmeczone jednostki rotuja, nie bija sie do
    // ostatniego. Tylko cios NIE lamiacy morale moze zabic od razu (nagla smierc
    // jeszcze niezlamanej jednostki). neverRout (berserk/"walczy do smierci") nie pekaja.
    if (!defender.dead && !defender.fadingOut && !defender.routed && !defender.neverRout) {
      const projMorale = defender.morale - MORALE_HIT_LOSS_SCALE * (dmg / Math.max(1, defender.bu.maxHp)) - extraMorale;
      if (projMorale <= defender.fleeMorale) {
        if (defender.bu.hp <= 0) { defender.bu.hp = 1; this._updateHpBar(defender); } // przezywa by uciec
        this._applyMoraleDamage(defender, dmg, extraMorale); // obniza morale (+flanka/tyl/szarza) -> _checkRout -> _startRout
        // FACTOR 3: blow that ROUTED the defender -> attacker GAINS morale.
        if (defender.routed) this._gainMorale(attacker, MORALE_KILL_GAIN);
        this._pushClash(attacker, defender, dmg, 'rout');
        return dmg;
      }
    }

    if (!defender.dead && !defender.fadingOut && !defender.routed) {
      if (defender.bu.hp <= 0) {
        this.log.push('  -> ' + defender.bu.nazwa + ' wyeliminowany');
        this._startFade(defender);
        this._shakeAlliesOnLoss(defender);
        this._boostEnemiesOnBreak(defender); // FACTOR 4: nearby enemies of the fallen gain morale
        // FACTOR 3: this blow KILLED the defender -> attacker GAINS morale.
        this._gainMorale(attacker, MORALE_KILL_GAIN);
        // BATTLE LOG: this blow KILLED the defender -> tag "(padl)".
        this._pushClash(attacker, defender, dmg, 'padl');
        return dmg;
      }
    }

    // MORALE (SS-morale): the blow shakes the victim's morale, scaled by the
    // damage relative to its max HP. If the pool breaks below the rout
    // threshold the unit routs (flees + counts as OUT). resolveCombat is never
    // touched -- this is purely scene-side bookkeeping around the blow.
    this._applyMoraleDamage(defender, dmg, extraMorale);
    // FACTOR 3: if this (non-killing) blow broke the defender's morale -> attacker GAINS.
    if (defender.routed) this._gainMorale(attacker, MORALE_KILL_GAIN);
    // BATTLE LOG: damaging blow that did NOT kill -- tag "(rout)" iff THIS blow
    // just broke the defender's morale (routed flag flipped by _applyMoraleDamage).
    this._pushClash(attacker, defender, dmg, defender.routed ? 'rout' : '');
    return dmg;
  }

  /**
   * Should the DEFENDER strike back in a mutual melee exchange? It counters iff
   * it is still in the fight (not dead/fading/routed after the initiator's blow)
   * AND it is a MELEE combatant: any non-primary-ranged unit melee-counters, and
   * a PRIMARY shooter counters ONLY when CORNERED -- i.e. it can no longer shoot
   * (out of ammo), so it has nothing left but its sidearm. (A primary shooter
   * with ammo just took a hit but does not trade blows in melee.)
   */
  private _defenderCounters(defender: RuntimeBattleUnit, _attacker: RuntimeBattleUnit): boolean {
    if (defender.dead || defender.fadingOut || defender.routed) return false;
    if (defender.bu.hp <= 0) return false;
    if (!defender.primaryRanged) return true;     // melee unit -> always counters
    return !canShoot(defender);                   // ranged unit counters only when cornered (dry)
  }

  // ---- Melee: ONE quick lunge delivering a single blow ----

  private _doMeleeAttack(attacker: RuntimeBattleUnit, defender: RuntimeBattleUnit, done: () => void): void {
    this.busy = true;

    const aw = cellToWorld(attacker.q, attacker.r);
    const dw = cellToWorld(defender.q, defender.r);
    // Attacker turns to FACE the tile it is striking (this is engaging that
    // target). The defender keeps its OWN facing so the player can see when it
    // is being hit in the flank or rear.
    attacker.facing = facingFromTo(attacker.q, attacker.r, defender.q, defender.r, attacker.facing);
    attacker.group.rotation.y = dirYaw(attacker.facing);

    // The attacker lunges in x/z only -- it never leaves its own tile -- so its
    // Y stays at that tile's standing height (hill summit if it stands on one).
    const aHome  = new THREE.Vector3(aw.x, tileTopY(this.terrainMap, attacker.q, attacker.r), aw.z);
    const midX   = (aw.x + dw.x) * 0.5;
    const midZ   = (aw.z + dw.z) * 0.5;
    const aLunge = { x: aw.x + (midX - aw.x) * 0.6, z: aw.z + (midZ - aw.z) * 0.6 };

    let hitDone = false;
    const t0 = this._now();

    const stepAnim = () => {
      if (this.finished) { this.busy = false; return; }
      const localT = this._now() - t0;

      // Land the single blow once we reach the connect moment.
      if (!hitDone && localT >= BLOW_HIT_T) {
        hitDone = true;
        const dmg = this._singleBlow(attacker, defender, false);
        if (dmg > 0 && !defender.dead) this._spawnDamageLabel(defender, dmg);

        // COUNTER-ATTACK (mutual exchange): the DEFENDER strikes back in the same
        // clash IF it is a MELEE unit and survived the initiator's blow. The
        // INITIATOR already got the charge (Uderzenie) on its blow above; the
        // return blow is a PLAIN melee strike (no charge), so we pre-mark the
        // reverse engagement key as already-engaged to deny the defender a charge.
        // A ranged defender does NOT melee-counter unless CORNERED (out of ammo /
        // cannot shoot). resolveCombat is untouched -- this reuses _singleBlow.
        if (this._defenderCounters(defender, attacker)) {
          this.engaged.add(defender.bu.id + '>' + attacker.bu.id); // deny counter the charge
          // Defender turns to face the blow it returns (front exchange for it).
          defender.facing = facingFromTo(defender.q, defender.r, attacker.q, attacker.r, defender.facing);
          defender.group.rotation.y = dirYaw(defender.facing);
          const back = this._singleBlow(defender, attacker, false);
          if (back > 0 && !attacker.dead && !attacker.fadingOut) this._spawnDamageLabel(attacker, back);
        }
      }

      // Lunge forward in the first half, snap back in the second half.
      if (!attacker.dead && !attacker.fadingOut) {
        let ax = aHome.x, az = aHome.z;
        if (localT < BLOW_LUNGE_MS * 0.5) {
          const p = localT / (BLOW_LUNGE_MS * 0.5);
          ax = lerp(aHome.x, aLunge.x, easeOut(p)); az = lerp(aHome.z, aLunge.z, easeOut(p));
        } else if (localT < BLOW_LUNGE_MS) {
          const p = (localT - BLOW_LUNGE_MS * 0.5) / (BLOW_LUNGE_MS * 0.5);
          ax = lerp(aLunge.x, aHome.x, easeIn(p)); az = lerp(aLunge.z, aHome.z, easeIn(p));
        }
        attacker.group.position.set(ax, aHome.y, az);
        attacker.hpBarGroup.position.set(ax, aHome.y + HPBAR_Y, az);
      }

      if (localT >= BLOW_LUNGE_MS) {
        if (!attacker.dead && !attacker.fadingOut) {
          attacker.group.position.set(aHome.x, aHome.y, aHome.z);
          attacker.hpBarGroup.position.set(aHome.x, aHome.y + HPBAR_Y, aHome.z);
        }
        this._schedule(BLOW_SETTLE_MS, () => { this.busy = false; done(); });
        return;
      }
      requestAnimationFrame(stepAnim);
    };
    requestAnimationFrame(stepAnim);
  }

  // ---- Ranged: ONE shot with a flying projectile, single blow on landing ----

  private _doRangedAttack(attacker: RuntimeBattleUnit, defender: RuntimeBattleUnit, done: () => void): void {
    this.busy = true;

    const aw = cellToWorld(attacker.q, attacker.r);
    const dw = cellToWorld(defender.q, defender.r);
    // Shooter turns to FACE its target tile (engaging it).
    attacker.facing = facingFromTo(attacker.q, attacker.r, defender.q, defender.r, attacker.facing);
    attacker.group.rotation.y = dirYaw(attacker.facing);

    // Throwing this pilum costs one round of ammunition. Once it runs out
    // the unit can no longer shoot (canShoot -> false) and fights in melee.
    // (B6: Legionista has Ilosc pociskow = 2 -> throws 2 pila, then sword.)
    if (Number.isFinite(attacker.ammoLeft)) {
      attacker.ammoLeft -= 1;
      this._updateAmmoBar(attacker); // shrink the BLUE ammo bar (empties + hides at 0)
    }

    // Spawn a PROJECTILE (not a glowing fireball) flying from attacker to
    // defender, its shape chosen by the ATTACKER's weapon: a slim ARROW for
    // bow units (much thinner + shorter than a javelin), a longer/thicker
    // JAVELIN for javelineers, a heavy PILUM for the Legionista, or a tiny
    // stone PELLET for slingers. Geometry built point-first along local +X so
    // we can aim it with one quaternion. Matte / no emissive (no fireball).
    // Launch from the shooter's torso and aim at the target's torso, each lifted
    // by its own tile-top so an arrow from/at a unit on a hill leaves/strikes at
    // the right height rather than from the flat base.
    const from = new THREE.Vector3(aw.x, tileTopY(this.terrainMap, attacker.q, attacker.r) + 0.5, aw.z);
    const to   = new THREE.Vector3(dw.x, tileTopY(this.terrainMap, defender.q, defender.r) + 0.5, dw.z);

    const kind = projectileKind(attacker.bu);
    const { group: proj, geos: projGeos, mats: projMats } = makeProjectileMesh(kind);
    proj.position.copy(from);
    // Aim the group's +X (its point) along the flight direction. (A sling
    // pellet is a sphere, so the orientation is harmless for it.)
    const dir = new THREE.Vector3().subVectors(to, from);
    if (dir.lengthSq() > 1e-6) {
      dir.normalize();
      const qq = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
      proj.quaternion.copy(qq);
    }
    this.scene.add(proj);
    this._sfxShot(); // AUDIO: a "whoosh"/twang as the projectile is launched
    this.projectiles.push({
      mesh: proj, from, to, t0: this._now(), dur: RANGED_FLY_MS,
      geos: projGeos, mats: projMats,
    });

    // Apply the single blow when the projectile lands.
    this._schedule(RANGED_FLY_MS, () => {
      if (this.finished) { this.busy = false; return; }
      const dmg = this._singleBlow(attacker, defender, true);
      if (dmg > 0 && !defender.dead && !defender.fadingOut) {
        this._spawnDamageLabel(defender, dmg);
      }
      this._schedule(RANGED_GAP_MS, () => { this.busy = false; done(); });
    });
  }

  // -------------------------------------------------------------------------
  // Private: render loop + per-frame updates
  // -------------------------------------------------------------------------

  private _startLoop(): void {
    const loop = (t: number) => {
      this.animFrameId = requestAnimationFrame(loop);
      // W fazie rozstawiania zamrazamy zegar wirtualny — animacje 3D dzialaja,
      // ale jednostki nie sa aktywowane i czas bitwy nie plynie.
      if (this.deployPhase) {
        this._syncRendererSize();
        this._tickZoom();
        for (const ru of [...this.atk, ...this.def]) {
          if (!ru.dead) ru.hpBarGroup.lookAt(this.camera.position);
        }
        this.renderer.render(this.scene, this.camera);
        return;
      }
      // Advance the speed-scaled virtual clock from the wall clock, THEN drive
      // every battle ticker off that virtual time so animations honour the
      // current speed multiplier (1x/2x/4x/8x) without breaking their shape.
      this._advanceVClock(t);
      // Drain the virtual-time scheduler BEFORE the per-frame tickers so newly
      // due actions are applied this frame (the speed fix -- see _drainTimers).
      this._drainTimers();
      const vt = this._now();
      this._syncRendererSize();
      this._tickZoom();
      this._tickProjectiles(vt);
      this._tickFades(vt);
      this._tickFloatLabels(t); // WALL time: damage numbers persist ~2s real regardless of speed
      this._updateArmyMoraleBars(); // TASK 5: live L/R army-morale meters
      if (this._manualMode) this._updateRosterBar(); // roster odswiezany co klatkę w trybie RECZNYM
      for (const ru of [...this.atk, ...this.def]) {
        if (!ru.dead) ru.hpBarGroup.lookAt(this.camera.position);
      }
      this.renderer.render(this.scene, this.camera);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private _syncRendererSize(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (w === 0 || h === 0) return;
    if (this.renderer.domElement.width !== w || this.renderer.domElement.height !== h) {
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  }

  private _tickProjectiles(t: number): void {
    if (this.projectiles.length === 0) return;
    this.projectiles = this.projectiles.filter(p => {
      const prog = Math.min(1, (t - p.t0) / p.dur);
      const x = lerp(p.from.x, p.to.x, prog);
      const y = lerp(p.from.y, p.to.y, prog) + Math.sin(prog * Math.PI) * 0.6; // arc
      const z = lerp(p.from.z, p.to.z, prog);
      p.mesh.position.set(x, y, z);
      if (prog >= 1) {
        this.scene.remove(p.mesh);
        for (const g of p.geos) g.dispose();
        for (const m of p.mats) m.dispose();
        return false;
      }
      return true;
    });
  }

  private _tickFades(t: number): void {
    if (this.fadingUnits.length === 0) return;
    this.fadingUnits = this.fadingUnits.filter(ru => {
      const p = Math.min(1, (t - ru.fadeStart) / DEATH_FADE_MS);
      for (const m of ru.mats) {
        const lm = m as THREE.MeshLambertMaterial;
        lm.transparent = true;
        lm.opacity     = 1 - p;
        lm.needsUpdate = true;
      }
      ru.group.scale.setScalar(1 - p * 0.6);
      if (p >= 1) {
        ru.dead               = true;
        ru.fadingOut          = false;
        ru.group.visible      = false;
        ru.hpBarGroup.visible = false;
        return false;
      }
      return true;
    });
  }

  private _tickFloatLabels(t: number): void {
    if (this.floatLabels.length === 0) return;
    this.floatLabels = this.floatLabels.filter(fl => {
      const age = t - fl.startTime;
      const p   = Math.min(1, age / fl.duration);
      if (p >= 1) {
        if (fl.elem.parentNode) fl.elem.parentNode.removeChild(fl.elem);
        return false;
      }
      const wp = fl.worldPos.clone();
      wp.y += age * fl.riseRate;
      const sp = worldToScreen(wp, this.camera, this.canvas);
      if (sp) {
        fl.elem.style.left    = sp.x + 'px';
        fl.elem.style.top     = sp.y + 'px';
        fl.elem.style.opacity = String(1 - p * p);
      }
      return true;
    });
  }

  // -------------------------------------------------------------------------
  // Private: helpers
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // BATTLE SPEED: virtual clock + live control
  // -------------------------------------------------------------------------

  /**
   * The VIRTUAL (speed-scaled) clock, in ms. ALL battle pacing reads this
   * instead of performance.now(): start-stamps (move/lunge/projectile/fade/
   * label) and the elapsed comparisons in _schedule / the per-frame tickers
   * all share this single time base, so they stay perfectly consistent when
   * the speed changes mid-flight. Advanced once per render frame in
   * _advanceVClock() by (wall delta) * speedMul.
   */
  private _now(): number { return this.vNow; }

  /** Advance the virtual clock from the wall clock, scaled by speedMul. Called once per frame. */
  private _advanceVClock(wall: number): void {
    if (this.vLastWall === 0) { this.vLastWall = wall; return; }
    let dw = wall - this.vLastWall;
    this.vLastWall = wall;
    if (this.paused) return; // P-key pause: keep wall ref fresh but freeze virtual time
    if (dw < 0) dw = 0;
    // Clamp the wall delta so a backgrounded tab (huge dt) can't teleport the
    // whole battle forward in a single frame; pacing stays smooth on resume.
    if (dw > 100) dw = 100;
    this.vNow += dw * this.speedMul;
  }

  /** Apply a speed step by index into SPEED_STEPS and refresh the button label. */
  private _setSpeedIdx(idx: number): void {
    const steps = BattleScene.SPEED_STEPS;
    this.speedIdx = ((idx % steps.length) + steps.length) % steps.length;
    this.speedMul = steps[this.speedIdx] ?? 1;
    const label = 'Predkosc: ' + this.speedMul + 'x';
    if (this.speedBtn) this.speedBtn.textContent = label;
    if (this.speedHud) this.speedHud.textContent = label; // live on-map indicator
    if (this._topSpeedLbl) this._topSpeedLbl.textContent = this.speedMul + 'x';
  }

  /** Cycle to the next speed step (1 -> 2 -> 4 -> 8 -> 16 -> 32 -> 64 -> 128 -> 1). Safe to call mid-battle. */
  private _cycleSpeed(): void { this._setSpeedIdx(this.speedIdx + 1); }

  // -------------------------------------------------------------------------
  // BATTLE LOG (last CLASH_LOG_MAX clashes, newest first)
  // -------------------------------------------------------------------------

  /**
   * Record one damaging clash for the on-screen battle-log panel. Called from
   * the blow-resolution path AFTER the damage + death/rout outcome is known, so
   * the entry can tag "(padl)" (defender died) or "(rout)" (defender broke). The
   * `dmg` is the HP the blow dealt (this method is only called for dmg > 0).
   * Newest entry goes to the FRONT; the buffer is hard-capped at CLASH_LOG_MAX
   * so it stays small even when many blows resolve in one high-speed frame.
   */
  private _pushClash(
    attacker: RuntimeBattleUnit,
    defender: RuntimeBattleUnit,
    dmg:      number,
    outcome:  '' | 'padl' | 'rout',
  ): void {
    let line =
      attacker.bu.nazwa + ' (' + sideTag(attacker.side) + ') -> ' +
      defender.bu.nazwa + ' (' + sideTag(defender.side) + '): -' + dmg + ' HP';
    if (outcome === 'padl')      line += ' (padl)';
    else if (outcome === 'rout') line += ' (rout)';
    this.clashLogEntries.unshift(line);                  // newest on top
    if (this.clashLogEntries.length > CLASH_LOG_MAX) {
      this.clashLogEntries.length = CLASH_LOG_MAX;        // drop oldest
    }
    this._renderClashLog();
  }

  /** Repaint the battle-log DOM panel from the rolling clashLogEntries buffer. */
  private _renderClashLog(): void {
    const el = this.clashLog;
    if (!el) return;
    const header =
      '<div style="color:#f0d080;font-weight:bold;margin-bottom:3px;letter-spacing:.03em;">' +
      'Ostatnie starcia</div>';
    if (this.clashLogEntries.length === 0) {
      el.innerHTML = header +
        '<div style="opacity:.55;">(brak starc)</div>';
      return;
    }
    const rows = this.clashLogEntries
      .map(s => '<div>' + escapeHtml(s) + '</div>')
      .join('');
    el.innerHTML = header + rows;
  }

  /**
   * Schedule `cb` to fire after `ms` of VIRTUAL (speed-scaled) time. Timers go
   * into a virtual-time queue drained every frame by _drainTimers(); they are
   * NOT polled per-frame with rAF. This is the SPEED FIX: the old rAF poll could
   * only resolve one step of a self-rescheduling chain (turn/action gaps) per
   * frame, so the discrete battle pacing was capped at the frame rate and high
   * speed multipliers had little effect. With the drained queue a chain of short
   * gaps catches up fully within a frame, so tempo scales linearly to 16x.
   */
  private _schedule(ms: number, cb: () => void): void {
    if (this.finished) return;
    this.vTimers.push({ due: this._now() + Math.max(0, ms), cb, id: this.vTimerSeq++ });
  }

  /**
   * Fire every virtual timer whose due-time has passed, called ONCE per frame
   * from the render loop AFTER _advanceVClock. An internal cursor advances vNow
   * to each timer's due time (in due order) within the frame's virtual budget,
   * so a chain of short gaps that all elapse this frame fires fully -- the key
   * to making speed scale past the frame rate. A guard caps the per-frame fire
   * count so a pathological zero-delay self-reschedule can't spin forever.
   */
  private _drainTimers(): void {
    const target = this._now(); // vNow already advanced for this frame
    let guard = 0;
    for (;;) {
      if (this.finished) { this.vTimers.length = 0; return; }
      // Find the earliest-due timer that is due by `target`.
      let best = -1;
      for (let i = 0; i < this.vTimers.length; i++) {
        const t = this.vTimers[i]!;
        if (t.due > target) continue;
        const b = best >= 0 ? this.vTimers[best]! : null;
        if (!b || t.due < b.due || (t.due === b.due && t.id < b.id)) best = i;
      }
      if (best < 0) break;
      const timer = this.vTimers.splice(best, 1)[0]!;
      timer.cb();
      if (++guard > 100000) break; // safety: never spin forever in one frame
    }
  }

  private _updateHpBar(ru: RuntimeBattleUnit): void {
    const ratio = Math.max(0, Math.min(1, ru.bu.hp / ru.bu.maxHp));
    ru.hpBarFg.scale.x    = ratio;
    ru.hpBarFg.position.x = (ratio - 1) * HPBAR_W * 0.5;
    let color: number;
    if (ratio > 0.60) color = 0x30c030;
    else if (ratio > 0.30) color = 0xd0a020;
    else color = 0xd02020;
    (ru.hpBarFg.material as THREE.MeshBasicMaterial).color.setHex(color);
  }

  /**
   * Refresh the TOP (morale) bar: width = current morale fraction, colour a
   * smooth GREEN->RED gradient by that fraction (full = green, low = red), so
   * the player can watch a unit's morale bleed toward red before it routs.
   */
  private _updateMoraleBar(ru: RuntimeBattleUnit): void {
    const frac = ru.moraleMax > 0 ? Math.max(0, Math.min(1, ru.morale / ru.moraleMax)) : 0;
    ru.moraleBarFg.scale.x    = Math.max(0.0001, frac);
    ru.moraleBarFg.position.x = (frac - 1) * HPBAR_W * 0.5;
    // Green (0x30c030) -> yellow -> red (0xd02020) across frac 1 -> 0.
    const r = Math.round(0xd0 + (0x30 - 0xd0) * frac);
    const g = Math.round(0x20 + (0xc0 - 0x20) * frac);
    const b = 0x20;
    (ru.moraleBarFg.material as THREE.MeshBasicMaterial).color.setRGB(r / 255, g / 255, b / 255);
  }

  /**
   * Refresh the TOP (ammo, BLUE) bar for ranged units with ammo capacity:
   * width = ammoLeft / ammoMax. Once ammo is spent the BLUE fill disappears but
   * the bar's BLACK bg box stays visible, so an out-of-ammo shooter reads as a
   * clear EMPTY BLACK rectangle (not the faction-colour frame bleeding through,
   * which used to make an empty ammo bar look filled red/blue). No-op for units
   * that never show an ammo bar (pure melee / unlimited-shot archers).
   */
  private _updateAmmoBar(ru: RuntimeBattleUnit): void {
    if (!ru.ammoBarShown) return;
    const frac = ru.ammoMax > 0 && Number.isFinite(ru.ammoMax)
      ? Math.max(0, Math.min(1, ru.ammoLeft / ru.ammoMax))
      : 0;
    ru.ammoBarFg.scale.x    = Math.max(0.0001, frac);
    ru.ammoBarFg.position.x = (frac - 1) * HPBAR_W * 0.5;
    // Empty -> hide ONLY the blue fill; the black bg box stays so the empty
    // slot reads black (distinct from a filled bar and from the faction frame).
    ru.ammoBarFg.visible = frac > 0;
    ru.ammoBarBg.visible = true;
  }

  /**
   * Apply a morale hit to the VICTIM of a blow, scaled by how hard the blow was
   * relative to its max HP, then rout it if the pool broke. resolveCombat is
   * never touched -- this is pure scene bookkeeping around the blow. Never-rout
   * units still LOSE morale (the bar reddens) but never actually break.
   */
  /**
   * MORALE GAIN (clamped to [0, moraleMax]). Used by FACTOR 3 (kill/rout an
   * enemy) and FACTOR 4 (enemy breaks nearby). Gains NEVER trigger rout, so they
   * cannot cause death/rout loops.
   */
  private _gainMorale(ru: RuntimeBattleUnit, amount: number): void {
    if (ru.dead || ru.fadingOut || ru.routed || amount <= 0) return;
    ru.morale = Math.min(ru.moraleMax, ru.morale + amount);
    this._updateMoraleBar(ru);
  }

  /**
   * FACTOR 4 -- ENEMY BREAKS NEARBY: when a unit dies or routs, every LIVING
   * ENEMY within MORALE_DEATH_RADIUS gains +MORALE_ENEMY_BREAK_GAIN morale
   * (mirror of _shakeAlliesOnLoss but a GAIN to the OPPOSITE side). A pure gain,
   * so it never retriggers rout.
   */
  private _boostEnemiesOnBreak(fallen: RuntimeBattleUnit): void {
    const enemies = (fallen.side === 'atk' ? this.def : this.atk);
    for (const e of enemies) {
      if (e.dead || e.fadingOut || e.routed) continue;
      if (manhattan(e.q, e.r, fallen.q, fallen.r) > MORALE_DEATH_RADIUS) continue;
      this._gainMorale(e, MORALE_ENEMY_BREAK_GAIN);
    }
  }

  /**
   * FACTOR 8 -- GENERAL aura PLACEHOLDER. future: +morale aura when a general/
   * leader unit is nearby. Not wired into behaviour yet.
   */
  private _generalMoraleAura(_ru: RuntimeBattleUnit): number { return MORALE_GENERAL_AURA; }

  private _applyMoraleDamage(victim: RuntimeBattleUnit, dmg: number, extraLoss = 0): void {
    if (victim.dead || victim.fadingOut || victim.routed) return;
    const maxHp = Math.max(1, victim.bu.maxHp);
    let hpLoss  = MORALE_HIT_LOSS_SCALE * (dmg / maxHp);
    // FACTOR 7 -- ARMY-COLLAPSE AURA: an army already in retreat breaks faster.
    // Amplify ONLY the HP-based loss (not the flat flank/rear/charge extras).
    if (this._armyMoraleRatio(victim.side) < MORALE_ARMY_COLLAPSE_RATIO) {
      hpLoss *= MORALE_ARMY_COLLAPSE_MULT;
    }
    const loss = hpLoss + Math.max(0, extraLoss);
    victim.morale = Math.max(0, victim.morale - loss);
    this._updateMoraleBar(victim);
    this._checkRout(victim);
  }

  /**
   * A unit has just died or routed -> shake the morale of nearby SURVIVING
   * ALLIES (a "shaken by losses" ripple), within MORALE_DEATH_RADIUS tiles, and
   * rout any whose morale breaks as a result. Cascading routs are bounded
   * because each shaken ally only ripples further if IT breaks.
   */
  private _shakeAlliesOnLoss(fallen: RuntimeBattleUnit): void {
    const allies = (fallen.side === 'atk' ? this.atk : this.def);
    for (const a of allies) {
      if (a === fallen || a.dead || a.fadingOut || a.routed) continue;
      if (manhattan(a.q, a.r, fallen.q, fallen.r) > MORALE_DEATH_RADIUS) continue;
      a.morale = Math.max(0, a.morale - MORALE_ALLY_DEATH_LOSS);
      this._updateMoraleBar(a);
      this._checkRout(a);
    }
    if (!fallen.primaryRanged) this._checkMeleeScreenLost(fallen.side);
  }

  /**
   * OSLONA WRECZ: gdy strona straci OSTATNIA zywa jednostke do walki wrecz
   * (kazda nie-primaryRanged), jej STRZELCY panikuja -- jednorazowo -50% morale
   * (potem zwykle pekaja i uciekaja). To realistycznie konczy sytuacje, gdy na
   * polu zostaja sami kitujacy strzelcy (i falanga ich nie goni).
   */
  private _checkMeleeScreenLost(side: 'atk' | 'def'): void {
    const arr = side === 'atk' ? this.atk : this.def;
    const hasMelee = arr.some(u => !u.dead && !u.fadingOut && !u.routed && !u.primaryRanged);
    if (hasMelee) return;
    for (const u of arr) {
      if (u.dead || u.fadingOut || u.routed || u.neverRout) continue;
      if (!u.primaryRanged || u.screenLostApplied) continue;
      u.screenLostApplied = true;
      u.morale = Math.max(0, u.morale * 0.5);
      this._updateMoraleBar(u);
      this._checkRout(u);
    }
  }

  /**
   * Rout a unit once its CURRENT morale drops below ROUT_MORALE_THRESHOLD of its
   * start -- unless it is a never-rout (elite / fights-to-death) unit, which
   * ignores morale and only leaves at HP <= 0. A routing unit stops attacking,
   * turns AWAY from the enemy and is sent fleeing toward its own back edge; it
   * counts as OUT for the victory check, so a side loses when all its units are
   * dead OR routed (battles end by morale collapse, not annihilation).
   */
  private _checkRout(ru: RuntimeBattleUnit): void {
    if (ru.routed || ru.dead || ru.fadingOut || ru.neverRout) return;
    // FACTOR 6 -- DEFENSIVE TERRAIN: a unit on a hill/forest (the same terrain
    // that grants the +50% defence via terrainDefenseMultiplier>1) routs LATER,
    // i.e. its effective flee threshold is lowered (so morale must drop further
    // before it breaks). Threshold kept >=0.
    let flee = ru.fleeMorale;
    const terr = this.terrainMap.combatTerrainName(ru.q, ru.r);
    const cu = toCombatUnit(ru.bu);
    if (terrainDefenseMultiplier(terr, cu.rola, this.terrainData) > 1) {
      flee = Math.max(0, ru.fleeMorale - MORALE_TERRAIN_RESIST);
    }
    if (ru.morale > flee) return;
    this._startRout(ru);
  }

  private _startRout(ru: RuntimeBattleUnit): void {
    if (ru.routed || ru.dead || ru.fadingOut) return;
    this._sfxRout(); // AUDIO: a brief falling horn as the unit breaks
    ru.routed = true;
    ru.acted  = true; // never takes another offensive action
    if (!ru.primaryRanged) this._checkMeleeScreenLost(ru.side);
    this._boostEnemiesOnBreak(ru); // FACTOR 4: this unit broke -> nearby enemies gain morale
    // Free its tile immediately so others can path through the gap it leaves and
    // it never blocks tiles while fleeing.
    this.occByKey.delete(cellKey(ru.q, ru.r));
    // Turn to FACE its OWN home edge (away from the enemy): the attacker deploys
    // LEFT so it flees WEST toward the left edge; the defender deploys RIGHT so it
    // flees EAST toward the right edge.
    ru.facing = ru.side === 'atk' ? Dir.W : Dir.E;
    ru.group.rotation.y = dirYaw(ru.facing);
    this.log.push('  -> ' + ru.bu.nazwa + ' ZALAMUJE MORALE i ucieka z pola!');

    // FUTURE HOOK (data only): record this unit's identity so a future "general
    // rally" feature could recover it. No recovery behaviour now.
    // TODO: general rally recovery.
    const s: Record<string, unknown> = (ru.bu.stats as Record<string, unknown>) ?? {};
    const typeId = String((s['Jednostka'] as string) ?? ru.bu.kategoria ?? ru.bu.nazwa ?? '');
    this.routedUnits.push({ typeId, side: ru.side, owner: ru.bu.ownerColor });

    // The unit now FLEES toward its home edge using NORMAL turn-based movement:
    // each turn _beginTurn includes it in the order, refreshes its movement, and
    // _activateUnit routes it to _fleeStep (one or more one-tile moves toward the
    // edge at normal walk speed). It vanishes (removed from scene + ripples morale
    // to allies) the moment it steps onto its home-edge column. No continuous
    // per-frame glide. acted is set above for the CURRENT turn only (reset each
    // turn by _beginTurn), so it gets fresh flee-turns afterwards.
  }

  /**
   * ROUTED unit's per-turn flee action: walk up to its movement points toward its
   * OWN home edge (attacker -> col 0 / west; defender -> col BF_COLS-1 / east) at
   * NORMAL move speed, one tile per step. Prefers the straight-back tile in its
   * current row; if blocked/impassable it tries row +-1, +-2 to route around.
   * Each completed step that lands on the home-edge column removes the unit from
   * the scene (it leaves the field). One tile at a time, chaining via _schedule
   * while moveLeft remains -- mirrors _fallBackStep / _advanceStep.
   */
  private _fleeStep(ru: RuntimeBattleUnit, done: () => void): void {
    if (this.finished) { done(); return; }
    if (ru.dead || ru.fadingOut || ru.removed) { done(); return; }
    if (ru.moveLeft <= 0) { done(); return; }

    const homeCol = ru.side === 'atk' ? 0 : (BF_COLS - 1);

    // Already at (or past) the home edge -> leave the field now.
    const atEdge = ru.side === 'atk' ? (ru.q <= homeCol) : (ru.q >= homeCol);
    if (atEdge) {
      this._removeUnitFromScene(ru);
      this._shakeAlliesOnLoss(ru);
      done();
      return;
    }

    // One column toward home; prefer the same row, then row +-1, +-2 to round
    // any blocker / impassable tile.
    const dir = ru.side === 'atk' ? -1 : 1; // toward home edge along the column axis
    const nc  = ru.q + dir;
    let target: [number, number] | null = null;
    for (const dr of [0, 1, -1, 2, -2]) {
      const nr = ru.r + dr;
      if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;
      if (this.occByKey.has(cellKey(nc, nr))) continue;
      if (!this.terrainMap.passable(nc, nr)) continue;
      target = [nc, nr];
      break;
    }
    if (!target) {
      // Zablokowany (rzeka/teren/jednostki): zrootowany i tak liczy sie jako OUT.
      // Jesli nie moze dojsc do krawedzi przez ~2 tury -> usun, by nie zamarzal.
      ru.fleeStuck = (ru.fleeStuck ?? 0) + 1;
      if (ru.fleeStuck >= 2) { this._removeUnitFromScene(ru); this._shakeAlliesOnLoss(ru); }
      done();
      return;
    }
    ru.fleeStuck = 0;

    this._doMove(ru, target[0], target[1], () => {
      if (this.finished) { done(); return; }
      if (ru.removed || ru.dead) { done(); return; }
      // Reached the home-edge column -> leave the field.
      const reached = ru.side === 'atk' ? (ru.q <= homeCol) : (ru.q >= homeCol);
      if (reached) {
        this._removeUnitFromScene(ru);
        this._shakeAlliesOnLoss(ru);
        done();
        return;
      }
      if (ru.moveLeft > 0) this._schedule(STEP_GAP_MS, () => this._fleeStep(ru, done));
      else done();
    });
  }

  /**
   * Remove a unit FULLY from the scene: detach its model group + over-head bar
   * group from the scene graph and dispose the model's own (non-shared) geometry
   * + materials so a fled/dead unit leaves no GPU residue and can no longer
   * render or block tiles. The bar geometries/materials live in the shared
   * ownedGeos/ownedMats lists (disposed once at scene teardown), so they are only
   * detached + hidden here, never disposed twice. The unit is marked `removed`
   * (and `dead`) so it counts as OUT for the victory check and dispose() skips
   * re-disposing its model resources. Idempotent.
   */
  private _removeUnitFromScene(ru: RuntimeBattleUnit): void {
    if (ru.removed) return;
    ru.removed   = true;
    ru.dead      = true;   // counts as OUT for _checkEnd (already true via routed)
    ru.fadingOut = false;
    this.occByKey.delete(cellKey(ru.q, ru.r));
    this.scene.remove(ru.group);
    this.scene.remove(ru.hpBarGroup);
    ru.group.visible      = false;
    ru.hpBarGroup.visible = false;
    // Dispose only the model's OWN resources (these are unique per unit and are
    // NOT in the shared ownedGeos/ownedMats lists). dispose() guards against
    // touching them again for removed units.
    for (const m of ru.mats) m.dispose();
    for (const g of ru.perTokenGeos) g.dispose();
  }

  private _startFade(ru: RuntimeBattleUnit): void {
    if (ru.fadingOut || ru.dead) return;
    this._sfxDeath(); // AUDIO: a dull thud as the unit falls
    ru.fadingOut = true;
    ru.fadeStart = this._now();
    this.fadingUnits.push(ru);
    this.occByKey.delete(cellKey(ru.q, ru.r));
  }

  private _spawnDamageLabel(ru: RuntimeBattleUnit, dmg: number): void {
    const el = document.createElement('div');
    el.textContent = '-' + dmg;
    Object.assign(el.style, {
      position:      'absolute',
      pointerEvents: 'none',
      color:         '#ff4444',
      fontFamily:    'sans-serif',
      fontSize:      '15px',
      fontWeight:    'bold',
      textShadow:    '0 0 6px #000, 1px 1px 2px #000',
      whiteSpace:    'nowrap',
      transform:     'translate(-50%, -50%)',
      zIndex:        '10010',
    });
    this.overlay.appendChild(el);
    const wp = cellToWorld(ru.q, ru.r);
    // Float the damage number above the unit's HP bar, lifted by its tile-top so
    // it sits over the head even when the unit stands on a raised hill.
    const wpTopY = tileTopY(this.terrainMap, ru.q, ru.r);
    this.floatLabels.push({
      elem:      el,
      startTime: this.vLastWall,
      duration:  2000,
      worldPos:  new THREE.Vector3(wp.x, wpTopY + HPBAR_Y + 0.20, wp.z),
      riseRate:  0.00012,
    });
  }

  // -------------------------------------------------------------------------
  // Private: end of battle
  // -------------------------------------------------------------------------

  /**
   * ARMY MORALE ratio for a side (TASK 3): sum of the CURRENT morale of every
   * unit that side ever fielded, divided by the sum of their STARTING morale.
   * DEAD and ROUTED units contribute 0 to the numerator (they have broken /
   * fallen) but KEEP their starting morale in the denominator -- so losing units
   * drags the ratio down. The full per-side roster lives in this.atk / this.def
   * (units are flagged dead/routed, never removed from the array), so iterating
   * those arrays gives exactly "all units that ever existed". Returns 1.0 for an
   * empty roster (avoids divide-by-zero; an empty side is handled by the
   * all-out branch of _checkEnd anyway).
   */
  private _armyMoraleRatio(side: 'atk' | 'def'): number {
    const arr = side === 'atk' ? this.atk : this.def;
    let cur = 0;
    let start = 0;
    for (const u of arr) {
      start += u.moraleMax;
      // Dead OR routed units contribute 0 current morale.
      if (u.dead || u.fadingOut || u.routed) continue;
      cur += Math.max(0, u.morale);
    }
    if (start <= 0) return 1.0;
    return cur / start;
  }

  /**
   * Live refresh of the two screen-edge ARMY-MORALE bars (TASK 5). Each side's
   * fill height = its army-morale ratio (clamped 0..1) and the fill colour runs
   * GREEN (high) -> YELLOW -> RED (low); the percentage cap is updated too.
   * Cheap enough to call every frame.
   */
  private _updateArmyMoraleBars(): void {
    const paint = (fill: HTMLDivElement | null, lbl: HTMLDivElement | null, ratio: number): void => {
      if (!fill || !lbl) return;
      const r = Math.max(0, Math.min(1, ratio));
      fill.style.height = (r * 100).toFixed(1) + '%';
      const hue = Math.round(120 * r);
      fill.style.background = 'hsl(' + hue + ', 75%, 45%)';
      lbl.textContent = Math.round(r * 100) + '%';
    };
    const ratioA = this._armyMoraleRatio('atk');
    const ratioD = this._armyMoraleRatio('def');
    paint(this.armyMoraleFillA, this.armyMoraleLabelA, ratioA);
    paint(this.armyMoraleFillD, this.armyMoraleLabelD, ratioD);
    // Top-bar morale fills
    if (this._topMoraleA) {
      const r = Math.max(0, Math.min(1, ratioA));
      this._topMoraleA.style.width = (r * 100).toFixed(1) + '%';
      this._topMoraleA.style.background = 'hsl(' + Math.round(120 * r) + ', 75%, 45%)';
    }
    if (this._topMoraleD) {
      const r = Math.max(0, Math.min(1, ratioD));
      this._topMoraleD.style.width = (r * 100).toFixed(1) + '%';
      this._topMoraleD.style.background = 'hsl(' + Math.round(120 * r) + ', 75%, 45%)';
    }
    // Top-bar casualties
    const deadA = this.atk.filter(u => u.dead || u.routed).length;
    const deadD = this.def.filter(u => u.dead || u.routed).length;
    if (this._topCasA) this._topCasA.textContent = 'ATK: ' + deadA + '/' + this.atk.length + ' strat';
    if (this._topCasD) this._topCasD.textContent = 'OBR: ' + deadD + '/' + this.def.length + ' strat';
    if (this._topTurnLbl) this._topTurnLbl.textContent = 'TURA ' + this.roundNo;
    if (this.pauseHud) this.pauseHud.style.display = this.paused ? 'block' : 'none';
  }

  private _checkEnd(): boolean {
    if (this.finished) return true;
    // A unit counts as OUT when dead OR routed (morale collapse). A side loses
    // when ALL its units are dead or routed -- battles end by morale break, not
    // only by annihilation. (Routed units also fade out shortly after, but the
    // victory check treats them as gone the instant they break.)
    let aliveA = this.atk.some(u => !u.dead && !u.fadingOut && !u.routed);
    let aliveD = this.def.some(u => !u.dead && !u.fadingOut && !u.routed);

    // ARMY-MORALE DEFEAT (TASK 3): a side whose collective army-morale ratio has
    // fallen below ARMY_MORALE_LOSS_THRESHOLD is broken as a fighting force and
    // LOSES, even if it still has units on the field. Treat such a side as "not
    // alive" for the win check below. Recomputed here every turn / after losses.
    const ratioA = this._armyMoraleRatio('atk');
    const ratioD = this._armyMoraleRatio('def');
    const brokenA = ratioA < ARMY_MORALE_LOSS_THRESHOLD;
    const brokenD = ratioD < ARMY_MORALE_LOSS_THRESHOLD;
    if (this._stalled && aliveA && aliveD) {
      // Nie rozstrzygaj po stall gdy: (a) tryb oblezenia -- atakujacy maszeruje/
      // buduje machiny wiele tur bez starcia, (b) zerowe straty po obu stronach
      // -- bitwa faktycznie sie nie zaczela.
      const isSiege = this.siegeWallCol >= 0;
      const totalDead = [...this.atk, ...this.def].filter(u => u.dead).length;
      if (!isSiege && totalDead > 0) {
        this.log.push('=== PAT: brak postepu w walce -- rozstrzygniecie po morale armii ===');
        if (ratioA <= ratioD) aliveA = false; else aliveD = false;
      }
    }
    if (brokenA && aliveA) {
      this.log.push('=== Morale armii ATAKUJACEGO zalamane (' + Math.round(ratioA * 100) + '% < 25%) -- armia w rozsypce! ===');
      aliveA = false;
    }
    if (brokenD && aliveD) {
      this.log.push('=== Morale armii OBRONCY zalamane (' + Math.round(ratioD * 100) + '% < 25%) -- armia w rozsypce! ===');
      aliveD = false;
    }

    if (aliveA && aliveD) return false;

    this.finished = true;

    let winner: 'atakujacy' | 'obronca';
    if (aliveA && !aliveD)      winner = 'atakujacy';
    else if (aliveD && !aliveA) winner = 'obronca';
    else {
      // Mutual elimination -- compare remaining HP for a decisive call.
      const hpA = this.atk.reduce((s, u) => s + Math.max(0, u.bu.hp), 0);
      const hpD = this.def.reduce((s, u) => s + Math.max(0, u.bu.hp), 0);
      winner = hpA >= hpD ? 'atakujacy' : 'obronca';
    }

    const survivors = (winner === 'atakujacy' ? this.atk : this.def)
      .filter(u => !u.dead).map(u => u.bu);

    const winMsg = winner === 'atakujacy' ? 'ATAKUJACEGO' : 'OBRONCY';
    this.log.push('=== Koniec bitwy: zwyciestwo ' + winMsg + ' ===');

    // TASK D: FREEZE on an end-of-battle summary screen instead of auto-closing.
    // The battle pauses here (the render loop keeps drawing the frozen field) and
    // the player reviews who won + per-side stats, then clicks "Zakoncz bitwe" to
    // tear down the scene and return to the map. The onFinish result is still
    // delivered (so the map applies the outcome) at the moment they exit.
    this._endWinner    = winner;
    this._endSurvivors = survivors;
    this._showEndScreen(winner);
    return true;
  }

  /**
   * TASK D: per-side end-of-battle stat snapshot. A unit counts as LOST if it is
   * dead OR routed (broke and fled); REMAINING = still alive on the field (not
   * dead, not routed). HP totals are summed over the side's whole roster.
   */
  private _sideEndStats(side: 'atk' | 'def'): {
    total: number; lost: number; remaining: number; hp: number; hpMax: number;
  } {
    const roster = side === 'atk' ? this.atk : this.def;
    let lost = 0, remaining = 0, hp = 0, hpMax = 0;
    for (const u of roster) {
      const out = u.dead || u.routed;
      if (out) lost++; else remaining++;
      hp    += out ? 0 : Math.max(0, u.bu.hp);
      hpMax += Math.max(0, u.bu.maxHp);
    }
    return { total: roster.length, lost, remaining, hp, hpMax };
  }

  /**
   * TASK D-details: per-side unit fates grouped by unit NAME. Three name->count
   * lists: destroyed (dead), routed (broke + fled, not dead) and survived (alive
   * on the field). Used by the "Szczegoly" breakdown panel.
   */
  private _sideUnitFates(side: 'atk' | 'def'): {
    destroyed: Array<{ name: string; n: number }>;
    routed:    Array<{ name: string; n: number }>;
    survived:  Array<{ name: string; n: number }>;
  } {
    const roster = side === 'atk' ? this.atk : this.def;
    const dMap = new Map<string, number>();
    const rMap = new Map<string, number>();
    const sMap = new Map<string, number>();
    for (const u of roster) {
      const name = String(u.bu.nazwa ?? u.bu.kategoria ?? '?');
      const bucket = u.routed ? rMap : (u.dead ? dMap : sMap);
      bucket.set(name, (bucket.get(name) ?? 0) + 1);
    }
    const toArr = (m: Map<string, number>): Array<{ name: string; n: number }> =>
      Array.from(m.entries())
        .map(([name, n]) => ({ name, n }))
        .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
    return { destroyed: toArr(dMap), routed: toArr(rMap), survived: toArr(sMap) };
  }

  /**
   * TASK D-details: full breakdown overlay opened from the end screen's
   * "Szczegoly" button. Two columns (LEFT = attacker, RIGHT = defender), each
   * with three sections (destroyed / routed / survived), every unit listed by
   * name with its count. "Zamknij" closes it back to the summary.
   */
  private _showEndDetails(): void {
    const fA = this._sideUnitFates('atk');
    const fD = this._sideUnitFates('def');

    const back = document.createElement('div');
    Object.assign(back.style, {
      position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.6)', zIndex: '10003',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    });

    const panel = document.createElement('div');
    Object.assign(panel.style, {
      minWidth: '640px', maxWidth: '92%', maxHeight: '86%', overflowY: 'auto',
      padding: '22px 24px', background: 'rgba(18,16,14,0.98)',
      border: '2px solid #c8a050', borderRadius: '10px',
      color: '#f0e8d0', fontFamily: 'serif',
      boxShadow: '0 0 40px rgba(0,0,0,0.85)',
    });

    const head = document.createElement('div');
    head.textContent = 'Szczegoly bitwy';
    Object.assign(head.style, {
      fontSize: '22px', fontWeight: 'bold', color: '#f0e060',
      textAlign: 'center', marginBottom: '14px',
    });
    panel.appendChild(head);

    const cols = document.createElement('div');
    Object.assign(cols.style, { display: 'flex', gap: '24px', alignItems: 'flex-start' });

    const section = (title: string, color: string, items: Array<{ name: string; n: number }>): string => {
      const rows = items.length
        ? items.map(it =>
            '<div style="display:flex;justify-content:space-between;gap:12px;font-size:14px;padding:1px 0;">' +
            '<span>' + escapeHtml(it.name) + '</span><b>x' + it.n + '</b></div>').join('')
        : '<div style="opacity:.5;font-size:13px;">(brak)</div>';
      const total = items.reduce((s, it) => s + it.n, 0);
      return '<div style="margin:10px 0 4px;color:' + color +
        ';font-weight:bold;border-bottom:1px solid rgba(255,255,255,.15);">' +
        title + ' (' + total + ')</div>' + rows;
    };

    const colDiv = (label: string, color: string, f: ReturnType<typeof this._sideUnitFates>): HTMLDivElement => {
      const d = document.createElement('div');
      Object.assign(d.style, { flex: '1', minWidth: '280px' });
      d.innerHTML =
        '<div style="font-size:18px;font-weight:bold;color:' + color +
        ';text-align:center;margin-bottom:6px;">' + label + '</div>' +
        section('Zniszczone', '#ff6b6b', f.destroyed) +
        section('Zrootowane', '#ffd54a', f.routed) +
        section('Ocalale',    '#6ee87a', f.survived);
      return d;
    };

    cols.appendChild(colDiv('ATAKUJACY', '#ff6b6b', fA));
    cols.appendChild(colDiv('OBRONCA',   '#6ba8ff', fD));
    panel.appendChild(cols);

    const btnClose = document.createElement('button');
    btnClose.textContent = 'Zamknij';
    styleButton(btnClose, '#555', '#fff');
    Object.assign(btnClose.style, { display: 'block', margin: '16px auto 0', fontSize: '15px' });
    btnClose.onclick = () => { if (back.parentNode) back.parentNode.removeChild(back); };
    panel.appendChild(btnClose);

    back.appendChild(panel);
    this.overlay.appendChild(back);
  }

  /**
   * TASK D: build + show the frozen END-OF-BATTLE overlay panel. Shows the WINNER
   * and a per-side table (units lost / remaining / HP), plus a clearly labelled
   * "Zakoncz bitwe" button that EXITS the battle via the SAME path as the existing
   * "Wyjscie" control (dispose + onCancel), additionally delivering the battle
   * result through onFinish so the map state is updated. The scene stays frozen
   * until the player clicks it.
   */
  private _showEndScreen(winner: 'atakujacy' | 'obronca'): void {
    if (this._endScreenShown) return;
    this._endScreenShown = true;
    this._sfxVictory(); // AUDIO: short rising fanfare at the end of the battle

    const sA = this._sideEndStats('atk');
    const sD = this._sideEndStats('def');
    const winText = winner === 'atakujacy'
      ? 'Zwyciestwo ATAKUJACEGO!'
      : 'Zwyciestwo OBRONCY!';

    const panel = document.createElement('div');
    Object.assign(panel.style, {
      position:      'absolute',
      top:           '50%',
      left:          '50%',
      transform:     'translate(-50%, -50%)',
      minWidth:      '420px',
      padding:       '24px 28px',
      background:    'rgba(18,16,14,0.96)',
      border:        '2px solid #c8a050',
      borderRadius:  '10px',
      boxShadow:     '0 0 40px rgba(0,0,0,0.8)',
      color:         '#f0e8d0',
      fontFamily:    'serif',
      textAlign:     'center',
      zIndex:        '10002',
    });

    const title = document.createElement('div');
    title.textContent = winText;
    Object.assign(title.style, {
      fontSize:    '30px',
      fontWeight:  'bold',
      color:       '#f0e060',
      textShadow:  '0 0 16px #ff8800, 2px 2px 4px #000',
      marginBottom:'18px',
    });
    panel.appendChild(title);

    const sideRow = (label: string, color: string, s: ReturnType<typeof this._sideEndStats>): string =>
      '<div style="margin:6px 0;">' +
        '<span style="color:' + color + ';font-weight:bold;">' + label + '</span>' +
        ' &mdash; padli/rozbici: <b>' + s.lost + '</b>' +
        ', pozostali na polu: <b>' + s.remaining + '</b>' +
        ' (z ' + s.total + ')' +
        '<br><span style="opacity:.8;font-size:13px;">HP: ' +
        Math.round(s.hp) + ' / ' + Math.round(s.hpMax) + '</span>' +
      '</div>';

    const stats = document.createElement('div');
    Object.assign(stats.style, { fontSize: '16px', lineHeight: '1.5', marginBottom: '20px' });
    stats.innerHTML =
      sideRow('Atakujacy', '#ff6b6b', sA) +
      sideRow('Obronca',   '#6ba8ff', sD);
    panel.appendChild(stats);

    const btnDetails = document.createElement('button');
    btnDetails.textContent = 'Szczegoly';
    styleButton(btnDetails, '#3a4a6a', '#fff');
    Object.assign(btnDetails.style, { fontSize: '15px', padding: '10px 22px', marginRight: '12px' });
    btnDetails.onclick = () => { this._showEndDetails(); };
    panel.appendChild(btnDetails);

    const btnEnd = document.createElement('button');
    btnEnd.textContent = 'Zakoncz bitwe';
    styleButton(btnEnd, '#2f6f4f', '#fff');
    Object.assign(btnEnd.style, { fontSize: '16px', padding: '10px 26px' });
    btnEnd.onclick = () => {
      // Deliver the result (so the map applies the outcome), then tear down the
      // scene via the SAME exit path as the "Wyjscie" button (dispose + onCancel).
      if (this.onFinishCb) {
        this.onFinishCb({ winner: this._endWinner ?? winner, survivors: this._endSurvivors, log: this.log });
      }
      this.dispose();
      if (this.onCancelCb) this.onCancelCb();
    };
    panel.appendChild(btnEnd);

    this.overlay.appendChild(panel);
  }

  private _showResultBanner(winner: 'atakujacy' | 'obronca'): void {
    const banner = document.createElement('div');
    banner.textContent = winner === 'atakujacy'
      ? 'Zwyciestwo atakujacego!'
      : 'Zwyciestwo obroncy!';
    Object.assign(banner.style, {
      position:      'absolute',
      top:           '40%',
      left:          '50%',
      transform:     'translate(-50%, -50%)',
      color:         '#f0e060',
      fontFamily:    'serif',
      fontSize:      '36px',
      fontWeight:    'bold',
      textShadow:    '0 0 20px #ff8800, 2px 2px 4px #000',
      pointerEvents: 'none',
      zIndex:        '10001',
    });
    this.overlay.appendChild(banner);
  }

  // -------------------------------------------------------------------------
  // Private: camera dolly-zoom (B9)
  // -------------------------------------------------------------------------

  /** Place the camera at camTarget + camDir * camDist, looking at camTarget. */
  private _applyCamera(): void {
    const d = Math.max(this.camDistMin, Math.min(this.camDistMax, this.camDist));
    this.camera.position.set(
      this.camTarget.x + this.camDir.x * d,
      this.camTarget.y + this.camDir.y * d,
      this.camTarget.z + this.camDir.z * d,
    );
    this.camera.lookAt(this.camTarget);
  }

  /** Clamp + store a new desired zoom distance. */
  private _setZoomTarget(dist: number): void {
    this.camDistTarget = Math.max(this.camDistMin, Math.min(this.camDistMax, dist));
  }

  /** Ease the current zoom toward its target; called once per render frame. */
  private _tickZoom(): void {
    const diff = this.camDistTarget - this.camDist;
    if (Math.abs(diff) < 0.01) {
      if (this.camDist !== this.camDistTarget) { this.camDist = this.camDistTarget; this._applyCamera(); }
      return;
    }
    this.camDist += diff * 0.18; // smooth approach
    this._applyCamera();
  }

  /** Mouse wheel = dolly zoom, centred on the field target. */
  private readonly _onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    // Scale the step with the current distance so zoom feels even across the
    // whole range; deltaY > 0 (scroll down / away) zooms OUT.
    const factor = Math.exp(e.deltaY * 0.0012);
    this._setZoomTarget(this.camDistTarget * factor);
  };

  /** +/- (and =/_) keys = step zoom in/out. */
  private readonly _onKeyZoom = (e: KeyboardEvent): void => {
    const k = e.key;
    if (k === '+' || k === '=' || k === 'Add') {
      this._setZoomTarget(this.camDistTarget * 0.88); // zoom IN
      e.preventDefault();
    } else if (k === '-' || k === '_' || k === 'Subtract') {
      this._setZoomTarget(this.camDistTarget / 0.88); // zoom OUT
      e.preventDefault();
    }
  };

  /**
   * CHANGE1: the "S" key cycles the battle speed 1 -> 2 -> 4 -> 8 -> 16 -> 1
   * (the same factors / virtual-clock the overlay button drives). It is the
   * REAL control because the on-screen button does not work for the user. Bound
   * on WINDOW so it fires regardless of focus; the battle overlay has no typing
   * fields, but we still bail if the event targets an editable element so it is
   * safe everywhere. The always-visible "Predkosc: Nx" indicator is updated by
   * _setSpeedIdx and briefly confirmed (a short HUD flash) on each change.
   */
  private readonly _onKeySpeed = (e: KeyboardEvent): void => {
    if (e.key !== 's' && e.key !== 'S') return;
    if (isEditableTarget(e.target)) return; // guard against typing fields (none in battle)
    if (e.ctrlKey || e.metaKey || e.altKey) return; // leave browser shortcuts (e.g. Ctrl+S) alone
    e.preventDefault();
    this._cycleSpeed();        // 1 -> 2 -> 4 -> 8 -> 16 -> 1 (updates the indicator)
    this._flashSpeedHud();     // brief confirm on change
  };

  /**
   * CHANGE2: the "H" key toggles ALL over-head stat bars (morale/ammo/HP)
   * visible <-> hidden (default visible) so the slim bars can be dropped when
   * they get in the way of reading the figures. Hides/shows each LIVING unit's
   * billboard bar GROUP; dead/removed units are skipped so their bars stay gone.
   * Child-mesh visibility (ammo only for ranged etc.) is preserved. Bound on
   * WINDOW so it works regardless of focus.
   */
  private readonly _onKeyToggleBars = (e: KeyboardEvent): void => {
    if (e.key !== 'h' && e.key !== 'H') return;
    if (isEditableTarget(e.target)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    this.barsVisible = !this.barsVisible;
    for (const ru of [...this.atk, ...this.def]) {
      if (ru.dead || ru.removed) continue; // keep dead/fled units' bars hidden
      ru.hpBarGroup.visible = this.barsVisible;
    }
  };

  /**
   * "P" key (and the Pauza button) toggle a freeze of the battle: the virtual
   * clock stops advancing (see _advanceVClock), so moves/attacks/projectiles all
   * hold. Camera pan/zoom still work so the player can inspect the frozen field.
   */
  private readonly _onKeyPause = (e: KeyboardEvent): void => {
    if (e.key !== 'p' && e.key !== 'P') return;
    if (isEditableTarget(e.target)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    this._togglePause();
  };

  private _togglePause(): void {
    this.paused = !this.paused;
    if (this.pauseHud) this.pauseHud.style.display = this.paused ? 'block' : 'none';
  }

  // =========================================================================
  // PROCEDURAL AUDIO -- self-contained Web Audio SFX + ambient (no files).
  // Every method below is GUARDED so a missing/blocked AudioContext (headless,
  // SSR, jsdom, autoplay-blocked) NEVER throws -- failures silently no-op.
  // =========================================================================

  /** "M" key: toggle ALL battle audio (SFX + ambient) on/off. Default ON. */
  private readonly _onKeyMute = (e: KeyboardEvent): void => {
    if (e.key !== 'm' && e.key !== 'M') return;
    if (isEditableTarget(e.target)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    this._ensureAudio();
    this._audioMuted = !this._audioMuted;
    if (!this._audioMuted) this._startAmbient();
    try {
      // Duck both buses to 0 when muted (keeps ambient timers alive but silent).
      if (this._masterGain) this._masterGain.gain.value = this._audioMuted ? 0 : 0.25;
      if (this._ambGain)    this._ambGain.gain.value    = this._audioMuted ? 0 : this._ambBaseGain();
    } catch { /* no-op */ }
    if (this.muteHud) this.muteHud.textContent = this._audioMuted ? 'Dzwiek: WYL (M)' : 'Dzwiek: WL (M)';
  };

  /** First-gesture handler: lazily create+resume the AudioContext, start ambient. */
  private readonly _onAudioGesture = (): void => {
    this._ensureAudio();
    this._startAmbient();
  };

  /** Lazily create the single AudioContext + buses on the first user gesture. */
  private _ensureAudio(): void {
    if (this._ac || this._acTried) {
      // Already have one (or tried) -- just make sure it's resumed.
      try { if (this._ac && this._ac.state === 'suspended') void this._ac.resume(); } catch { /* no-op */ }
      return;
    }
    this._acTried = true;
    try {
      const Ctor = (typeof AudioContext !== 'undefined')
        ? AudioContext
        : (typeof window !== 'undefined' ? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext : undefined);
      if (!Ctor) return; // headless / no Web Audio -> silent
      const ac = new Ctor();
      const master = ac.createGain();
      master.gain.value = this._audioMuted ? 0 : 0.25; // LOW SFX bus
      master.connect(ac.destination);
      const amb = ac.createGain();
      amb.gain.value = this._audioMuted ? 0 : this._ambBaseGain();
      amb.connect(ac.destination);
      this._ac = ac; this._masterGain = master; this._ambGain = amb;
      try { if (ac.state === 'suspended') void ac.resume(); } catch { /* no-op */ }
    } catch { this._ac = null; /* blocked -> silent */ }
  }

  /** Ambient bus base gain (very light); faint epoch flavour via terrain hint. */
  private _ambBaseGain(): number { return 0.05; }

  /** A small noise buffer (cached) for percussive/whoosh SFX. */
  private _noiseBuf(ac: AudioContext): AudioBuffer {
    if (this._cachedNoise && this._cachedNoise.sampleRate === ac.sampleRate) return this._cachedNoise;
    const len = Math.floor(ac.sampleRate * 0.4);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this._cachedNoise = buf;
    return buf;
  }
  private _cachedNoise: AudioBuffer | null = null;

  /** True if SFX should be skipped right now (muted / no context). */
  private _sfxOff(): boolean { return this._audioMuted || !this._ac || !this._masterGain; }

  /**
   * MELEE clash: short filtered-noise clack with a quick metallic decay and a
   * little pitch variation. Throttled (min ~40ms gap) and thinned at high speed.
   */
  private _sfxMelee(): void {
    if (this._sfxOff()) return;
    const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    if (now - this._lastHitAt < 40) return;                 // per-frame cap
    if (this.speedMul >= 16 && Math.random() > 0.18) return; // thin the wall of sound
    this._lastHitAt = now;
    try {
      const ac = this._ac!; const t = ac.currentTime;
      // Bright metallic ring: 3 inharmonic partials, each slightly detuned per hit.
      const partials = [2100, 3100, 4500];
      partials.forEach((base, i) => {
        const f = base * (1 + (Math.random() * 2 - 1) * 0.08);
        const osc = ac.createOscillator();
        osc.type = (i === 0) ? 'triangle' : 'sine';
        osc.frequency.value = f;
        const decay = 0.18 + Math.random() * 0.12;          // 0.18..0.30s ring tail
        const peak = (i === 0 ? 0.20 : 0.12) / (1 + i * 0.2); // higher partials quieter
        const g = ac.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak, t + 0.003); // fast attack
        g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
        osc.connect(g).connect(this._masterGain!);
        osc.start(t); osc.stop(t + decay + 0.02);
      });
      // Short bright noise transient = the metallic "clash" onset.
      const src = ac.createBufferSource(); src.buffer = this._noiseBuf(ac);
      const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
      const ng = ac.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.exponentialRampToValueAtTime(0.18, t + 0.002);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      src.connect(hp).connect(ng).connect(this._masterGain!);
      src.start(t); src.stop(t + 0.04);
    } catch { /* no-op */ }
  }

  /** RANGED shot: short descending noise "whoosh"/twang on firing. */
  private _sfxShot(): void {
    if (this._sfxOff()) return;
    const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    if (now - this._lastShotAt < 50) return;
    if (this.speedMul >= 16 && Math.random() > 0.25) return;
    this._lastShotAt = now;
    try {
      const ac = this._ac!; const t = ac.currentTime;
      const dur = 0.18 + Math.random() * 0.04;               // 0.18..0.22s
      // Pitched whistle sweeping down: świst of an arrow/javelin in flight.
      const osc = ac.createOscillator(); osc.type = 'sine';
      const f0 = 1900 * (1 + (Math.random() * 2 - 1) * 0.07);
      const f1 = 650  * (1 + (Math.random() * 2 - 1) * 0.07);
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const og = ac.createGain();
      og.gain.setValueAtTime(0.0001, t);
      og.gain.exponentialRampToValueAtTime(0.30, t + 0.02);   // soft attack
      og.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(og).connect(this._masterGain!);
      osc.start(t); osc.stop(t + dur + 0.02);
      // Airy noise layer = the "air"/whoosh, high bandpass at low gain.
      const src = ac.createBufferSource(); src.buffer = this._noiseBuf(ac);
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 3;
      bp.frequency.setValueAtTime(2300, t);
      bp.frequency.exponentialRampToValueAtTime(1500, t + dur);
      const ng = ac.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.exponentialRampToValueAtTime(0.14, t + 0.03);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(bp).connect(ng).connect(this._masterGain!);
      src.start(t); src.stop(t + dur + 0.02);
    } catch { /* no-op */ }
  }

  /** DEATH: short dull thud (low sine drop + tiny noise body). */
  private _sfxDeath(): void {
    if (this._sfxOff()) return;
    if (this.speedMul >= 16 && Math.random() > 0.3) return;
    try {
      const ac = this._ac!; const t = ac.currentTime;
      const osc = ac.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(150 + Math.random() * 30, t);
      osc.frequency.exponentialRampToValueAtTime(55, t + 0.18);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.8, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      osc.connect(g).connect(this._masterGain!);
      osc.start(t); osc.stop(t + 0.24);
    } catch { /* no-op */ }
  }

  /** ROUT: brief low falling horn tone when a unit breaks. */
  private _sfxRout(): void {
    if (this._sfxOff()) return;
    if (this.speedMul >= 16 && Math.random() > 0.4) return;
    try {
      const ac = this._ac!; const t = ac.currentTime;
      const osc = ac.createOscillator(); osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280 + Math.random() * 30, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.45); // falling
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.45, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(lp).connect(g).connect(this._masterGain!);
      osc.start(t); osc.stop(t + 0.52);
    } catch { /* no-op */ }
  }

  /** VICTORY: short rising 3-note fanfare when the battle ends. */
  private _sfxVictory(): void {
    if (this._sfxOff()) return;
    try {
      const ac = this._ac!; const t0 = ac.currentTime;
      const notes = [392, 523, 659]; // G4, C5, E5 -- rising
      notes.forEach((f, i) => {
        const t = t0 + i * 0.13;
        const osc = ac.createOscillator(); osc.type = 'triangle'; osc.frequency.value = f;
        const g = ac.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        osc.connect(g).connect(this._masterGain!);
        osc.start(t); osc.stop(t + 0.3);
      });
    } catch { /* no-op */ }
  }

  /**
   * AMBIENT bed: a slow low drone + a soft periodic low drum, very low volume.
   * Faint EPOCH flavour from the terrain string (this.terrain) shifts the drone
   * pitch + drum interval a touch. Starts once (after the audio gesture).
   */
  private _startAmbient(): void {
    if (this._audioStarted) return;
    if (!this._ac || !this._ambGain) return;
    this._audioStarted = true;
    try {
      const ac = this._ac; const amb = this._ambGain;
      // Faint epoch/terrain flavour: pick scale root (MIDI) + tempo from terrain.
      // CALM scales (major pentatonic flavours) so swells + melody never grate.
      const ter = (this.terrain || '').toLowerCase();
      let rootMidi = 45;       // A2 (neutral, calm)
      let chordMs  = 6200;     // ~6.2s between pad swells
      let melodyMs = 2500;     // ~2.5s between melody notes
      // pentatonic (major-ish) intervals for the soft melody
      let pentaSteps = [0, 2, 4, 7, 9, 12, 14];
      // chord = root + minor third + fifth (soft, slightly wistful but calm)
      let chordSteps = [0, 3, 7];
      if (/(las|forest|bagno|swamp)/.test(ter))            { rootMidi = 43; chordMs = 7000; melodyMs = 2800; pentaSteps = [0, 2, 5, 7, 9, 12, 14]; chordSteps = [0, 4, 7]; } // mellow, slower
      else if (/(gor|hill|wzg|mount)/.test(ter))           { rootMidi = 48; chordMs = 5500; melodyMs = 2200; pentaSteps = [0, 2, 4, 7, 9, 12, 16]; chordSteps = [0, 4, 7]; } // brighter, airier
      else if (/(pust|desert|step|plain|rownin)/.test(ter)) { rootMidi = 46; chordMs = 6500; melodyMs = 2600; pentaSteps = [0, 2, 4, 7, 11, 12, 14]; chordSteps = [0, 7, 12]; } // open, sparse
      const midiToHz = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);

      // Subtle feedback DELAY for an airy/echo bed (melody routes through this).
      const delay = ac.createDelay(1.0); delay.delayTime.value = 0.38;
      const fb = ac.createGain(); fb.gain.value = 0.25;
      const wet = ac.createGain(); wet.gain.value = 0.18; // low wet
      delay.connect(fb); fb.connect(delay);
      delay.connect(wet); wet.connect(amb);
      this._ambNodes.push({ stop: () => { try { delay.disconnect(); fb.disconnect(); wet.disconnect(); } catch { /* */ } } });

      // ---- PAD via SWELLS: soft chord that fades in/out, overlapping into an
      //      evolving pad. NEVER a continuous held drone (that was the buzz).
      const playChord = (): void => {
        if (this._audioMuted || !this._ac || !this._ambGain) return;
        try {
          const a = this._ac; const t = a.currentTime;
          const atk = 1.5; const rel = 3.5;
          const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 820;
          const g = a.createGain();
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.10, t + atk);          // slow swell in
          g.gain.exponentialRampToValueAtTime(0.0001, t + atk + rel);  // long fade out
          lp.connect(g).connect(this._ambGain);
          const oscs: OscillatorNode[] = [];
          chordSteps.forEach((semis, i) => {
            const o = a.createOscillator();
            o.type = 'sine';
            o.frequency.value = midiToHz(rootMidi - 12 + semis); // an octave below root
            o.detune.value = (i - 1) * 4;                        // gentle spread
            o.connect(lp); o.start(t); o.stop(t + atk + rel + 0.1);
            oscs.push(o);
          });
          this._ambNodes.push({ stop: () => { try { oscs.forEach(o => o.stop()); } catch { /* */ } } });
        } catch { /* no-op */ }
      };

      // ---- MELODY: one soft pentatonic note, sparse, through delay (airy echo).
      let mStep = 0;
      const playNote = (): void => {
        if (this._audioMuted || !this._ac || !this._ambGain) return;
        try {
          const a = this._ac; const t = a.currentTime;
          // wander the pentatonic scale gently (random-ish but calm)
          mStep += (Math.random() < 0.5 ? 1 : -1) + pentaSteps.length;
          const semis = pentaSteps[mStep % pentaSteps.length] ?? 0;
          const hz = midiToHz(rootMidi + 12 + semis); // melody an octave up, soft
          const osc = a.createOscillator();
          osc.type = (Math.random() < 0.5) ? 'sine' : 'triangle';
          osc.frequency.value = hz;
          const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100;
          const g = a.createGain();
          const atk = 0.08; const rel = 1.4;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.06, t + atk);  // low gain, gentle attack
          g.gain.exponentialRampToValueAtTime(0.0001, t + atk + rel);
          osc.connect(lp); lp.connect(g);
          g.connect(this._ambGain);  // dry
          g.connect(delay);          // wet echo
          osc.start(t); osc.stop(t + atk + rel + 0.05);
        } catch { /* no-op */ }
      };

      playChord();
      const chordTimer = setInterval(playChord, chordMs);
      const melTimer   = setInterval(playNote, melodyMs);
      this._ambDrumTimer = melTimer;            // keep legacy field pointing at a live timer
      this._ambTimers.push(chordTimer, melTimer);
    } catch { /* no-op */ }
  }

  /** Stop ambient, disconnect buses, close the context. Called from dispose(). */
  private _teardownAudio(): void {
    try {
      if (this._ambDrumTimer !== null) { clearInterval(this._ambDrumTimer); this._ambDrumTimer = null; }
      for (const tm of this._ambTimers) { try { clearInterval(tm); } catch { /* */ } }
      this._ambTimers = [];
      for (const n of this._ambNodes) { try { n.stop?.(); } catch { /* */ } }
      this._ambNodes = [];
      try { this._ambGain?.disconnect(); } catch { /* */ }
      try { this._masterGain?.disconnect(); } catch { /* */ }
      const ac = this._ac;
      this._ac = null; this._masterGain = null; this._ambGain = null;
      this._audioStarted = false;
      if (ac) { try { void ac.close(); } catch { /* */ } }
    } catch { /* no-op */ }
  }

  /**
   * CHANGE1: briefly highlight the on-map speed indicator to confirm a speed
   * change (a short colour/scale pop that eases back). Scheduled on the WALL
   * clock (setTimeout) so the confirm reads the same at any battle speed.
   */
  private _flashSpeedHud(): void {
    const hud = this.speedHud;
    if (!hud) return;
    hud.style.transition = 'transform 90ms ease-out, background 90ms ease-out';
    hud.style.transform  = 'scale(1.18)';
    hud.style.background  = 'rgba(40,90,40,0.95)';
    setTimeout(() => {
      if (!this.speedHud) return;
      this.speedHud.style.transform  = 'scale(1.0)';
      this.speedHud.style.background = 'rgba(20,30,20,0.72)';
    }, 160);
  }

  // --- Drag-pan: PRAWY lub SRODKOWY przycisk myszy (lub LEWY poza trybem RECZNYM) ---
  // W trybie RECZNYM LEWY button = box-select lub klik-zaznaczenie.
  // W pozostalych sytuacjach LEWY = pan (faza deploy, auto, finished).
  private readonly _onPanDown = (e: PointerEvent): void => {
    // LEWY przycisk w trybie RECZNYM w fazie walki LUB w fazie rozstawiania → box-select (nie pan)
    if (e.button === 0 && ((this._manualMode && !this.deployPhase && this.started && !this.finished) || this.deployPhase)) {
      this._pointerDownPos = { x: e.clientX, y: e.clientY };
      this._boxSelectStart = { x: e.clientX, y: e.clientY };
      return; // panning=false, ale zaczyna box-select
    }
    // PRAWY (2) lub SRODKOWY (1) = pan; LEWY poza trybem recznym = pan
    if (e.button !== 0 && e.button !== 2 && e.button !== 1) return;
    if (e.button === 0) {
      // lewy poza trybem recznym (deploy lub auto)
      this._pointerDownPos = { x: e.clientX, y: e.clientY };
    }
    this.panning  = true;
    this.panLastX = e.clientX;
    this.panLastY = e.clientY;
    if (!this._pointerDownPos) this._pointerDownPos = { x: e.clientX, y: e.clientY };
  };

  private readonly _onPanMove = (e: PointerEvent): void => {
    // Box-select ruch — lewy w manualMode
    if (this._boxSelectStart && e.buttons === 1) {
      const dx = e.clientX - this._boxSelectStart.x;
      const dy = e.clientY - this._boxSelectStart.y;
      if (dx * dx + dy * dy >= 36) {
        // Rysuj overlay
        if (!this._boxSelectDiv) {
          const d = document.createElement('div');
          d.id = 'box-select-overlay';
          Object.assign(d.style, {
            position: 'fixed',
            border: '2px dashed #00ffcc',
            background: 'rgba(0,255,204,0.08)',
            pointerEvents: 'none',
            zIndex: '99999',
          });
          document.body.appendChild(d);
          this._boxSelectDiv = d;
        }
        const x1 = Math.min(this._boxSelectStart.x, e.clientX);
        const y1 = Math.min(this._boxSelectStart.y, e.clientY);
        const x2 = Math.max(this._boxSelectStart.x, e.clientX);
        const y2 = Math.max(this._boxSelectStart.y, e.clientY);
        Object.assign(this._boxSelectDiv.style, {
          left: x1 + 'px', top: y1 + 'px',
          width: (x2 - x1) + 'px', height: (y2 - y1) + 'px',
        });
      }
      return;
    }
    if (!this.panning) return;
    const dx = e.clientX - this.panLastX;
    const dy = e.clientY - this.panLastY;
    this.panLastX = e.clientX;
    this.panLastY = e.clientY;

    // World units per screen pixel scales with zoom distance so panning feels
    // consistent. Screen-right -> field +X; screen-up -> field -Z (away).
    const h = Math.max(1, this.canvas.clientHeight);
    const worldPerPx = (this.camDist * 1.2) / h;
    this.camTarget.x -= dx * worldPerPx;
    this.camTarget.z -= dy * worldPerPx;
    this._applyCamera();
  };

  private readonly _onPanUp = (e: PointerEvent): void => {
    // Zakoncz box-select
    if (this._boxSelectStart && e.button === 0) {
      const startX = this._boxSelectStart.x, startY = this._boxSelectStart.y;
      const endX = e.clientX, endY = e.clientY;
      const distSq = (endX - startX) ** 2 + (endY - startY) ** 2;
      if (this._boxSelectDiv) {
        // Zaznacz jednostki w prostokącie
        this._doBoxSelect(
          Math.min(startX, endX), Math.min(startY, endY),
          Math.max(startX, endX), Math.max(startY, endY),
        );
        document.body.removeChild(this._boxSelectDiv);
        this._boxSelectDiv = null;
      } else if (distSq < 36) {
        // Krotki klik — standardowe zaznaczanie
        if (this.deployPhase) {
          this._onDeployClick(e.clientX, e.clientY);
        } else if (!this.deployPhase && this.started && !this.finished && this._manualMode) {
          this._onBattleClick(e.clientX, e.clientY);
        }
      } else if (this.deployPhase) {
        // Box-select w fazie deploy: zaznacz grupowo do grupowania
        // (uzupelniajace — doBoxSelect juz sie wykonal powyzej)
      }
      this._boxSelectStart = null;
      this._pointerDownPos = null;
      return;
    }

    this.panning = false;
    const isClick = this._pointerDownPos &&
      (() => { const dx = e.clientX - this._pointerDownPos!.x; const dy = e.clientY - this._pointerDownPos!.y; return dx*dx+dy*dy < 36; })();
    // Jesli faza rozstawiania aktywna — sprawdz czy to byl klik (<6px)
    if (this.deployPhase && isClick) {
      this._onDeployClick(e.clientX, e.clientY);
    }
    // Jesli faza walki i tryb RECZNY — obsluz zaznaczanie i rozkazy
    else if (!this.deployPhase && this.started && !this.finished && this._manualMode && isClick) {
      this._onBattleClick(e.clientX, e.clientY);
    }
    this._pointerDownPos = null;
  };

  private readonly _onResize = (): void => { this._syncRendererSize(); };

  // -------------------------------------------------------------------------
  // FAZA ROZSTAWIANIA — metody pomocnicze
  // -------------------------------------------------------------------------

  /**
   * Buduje swiecace plaszczyznki strefy startowej (kol 0..12, wszystkie r,
   * tylko pola przejezdne). Widoczne tylko gdy deployPhase === true.
   */
  private _buildDeployZone(): void {
    const DEPLOY_MAX_COL = 12;
    const geo = new THREE.PlaneGeometry(TILE_S * 0.92, TILE_S * 0.92);
    geo.rotateX(-Math.PI / 2); // poziomo
    this.ownedGeos.push(geo);
    for (let col = 0; col <= DEPLOY_MAX_COL; col++) {
      for (let row = 0; row < BF_ROWS; row++) {
        if (!this.terrainMap.passable(col, row)) continue;
        const mat = new THREE.MeshBasicMaterial({
          color: 0x3399ff,
          transparent: true,
          opacity: 0.22,
          depthWrite: false,
        });
        this.ownedMats.push(mat);
        const mesh = new THREE.Mesh(geo, mat);
        const { x, z } = cellToWorld(col, row);
        mesh.position.set(x, 0.02, z); // lekko nad ziemia
        mesh.visible = true;
        this.scene.add(mesh);
        this._deployZoneMeshes.push(mesh);
      }
    }
  }

  /** Ukrywa/pokazuje meshe strefy startowej. */
  private _setDeployZoneVisible(v: boolean): void {
    for (const m of this._deployZoneMeshes) m.visible = v;
  }

  /**
   * Tworzy DOM overlay fazy rozstawiania z banerkiem, przyciskami
   * Auto-ustaw / Reset / Start.
   */
  private _buildDeployOverlay(): void {
    const div = document.createElement('div');
    div.id = 'deploy-overlay';
    Object.assign(div.style, {
      position:       'absolute',
      left:           '50%',
      bottom:         '70px',
      transform:      'translateX(-50%)',
      background:     'rgba(8,6,4,0.92)',
      border:         '2px solid #d4af37',
      borderRadius:   '10px',
      padding:        '14px 22px',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      gap:            '10px',
      zIndex:         '10020',
      fontFamily:     'sans-serif',
      color:          '#f0d080',
      boxShadow:      '0 0 24px rgba(212,175,55,0.45), 0 4px 20px rgba(0,0,0,0.8)',
    });

    const banner = document.createElement('h2');
    banner.textContent = '\u2694 FAZA ROZSTAWIANIA — ustaw jednostki i kliknij Start';
    Object.assign(banner.style, {
      margin:      '0 0 2px',
      fontSize:    '15px',
      fontWeight:  'bold',
      color:       '#d4af37',
      textAlign:   'center',
      textShadow:  '0 1px 4px #000',
      letterSpacing: '0.04em',
    });
    div.appendChild(banner);

    const hint = document.createElement('div');
    hint.textContent = 'Kliknij jednostke atakujaca, potem pole strefy (niebieskie).';
    Object.assign(hint.style, { fontSize: '11px', color: '#aaa', marginBottom: '2px', textAlign: 'center' });
    div.appendChild(hint);

    // --- 3 FORMACJE ---
    const fmtLbl = document.createElement('div');
    fmtLbl.textContent = 'FORMACJA AUTO-USTAW:';
    Object.assign(fmtLbl.style, { fontSize: '10px', color: '#d4af37', letterSpacing: '0.08em', alignSelf: 'flex-start' });
    div.appendChild(fmtLbl);

    const fmtRow = document.createElement('div');
    Object.assign(fmtRow.style, { display: 'flex', gap: '8px' });
    div.appendChild(fmtRow);

    const makeFmtBtn = (html: string, label: string, bg: string, msg: string): HTMLButtonElement => {
      const b = document.createElement('button');
      Object.assign(b.style, {
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
        background: bg, border: '1px solid rgba(212,175,55,0.45)',
        borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', color: '#e8e0d0', minWidth: '82px',
      });
      b.innerHTML = html;
      b.onclick = () => { this._resetDeployAttacker(); this._showDeployFmtFeedback(hint, msg); };
      return b;
    };

    fmtRow.appendChild(makeFmtBtn(
      '<div style="font-size:18px;">\u{1F3F9}\u{1F5E1}\u{1F40E}</div><div style="font-size:9px;color:#d4af37;">F1 Dystans-przod</div>',
      'F1', 'rgba(30,50,30,0.85)',
      'F1: Lucznicy przod / Melee srodek / Konnica boki'
    ));
    fmtRow.appendChild(makeFmtBtn(
      '<div style="font-size:18px;">\u{1F5E1}\u{1F3F9}\u{1F40E}</div><div style="font-size:9px;color:#d4af37;">F2 Melee-przod</div>',
      'F2', 'rgba(30,30,50,0.85)',
      'F2: Melee przod / Dystansowe tyl / Konnica boki'
    ));
    fmtRow.appendChild(makeFmtBtn(
      '<div style="font-size:18px;">\u{1F3F0}\u{1F3F9}\u{1F40E}</div><div style="font-size:9px;color:#d4af37;">F3 Oblezenie</div>',
      'F3', 'rgba(50,20,10,0.85)',
      'F3: Machiny przod / Lucznicy tyl / Konnica rezerwa'
    ));

    // --- Przyciski glowne ---
    const btnRow = document.createElement('div');
    Object.assign(btnRow.style, { display: 'flex', gap: '10px', marginTop: '2px' });
    div.appendChild(btnRow);

    const btnReset = document.createElement('button');
    btnReset.innerHTML = '\u21BA Reset';
    styleDeployBtn(btnReset, 'rgba(70,40,8,0.88)', '#fff');
    btnReset.onclick = () => { this._resetDeployAttacker(); hint.textContent = 'Jednostki przywrocone do domyslnego rozstawienia.'; };
    btnRow.appendChild(btnReset);

    const btnGroup = document.createElement('button');
    btnGroup.innerHTML = '&#x25C6; Grupuj';
    styleDeployBtn(btnGroup, 'rgba(60,50,0,0.88)', '#ffd700');
    btnGroup.style.border = '1px solid #ffd700';
    btnGroup.title = 'Zaznacz >= 2 jednostki (box-select), potem kliknij Grupuj';
    btnGroup.onclick = () => { this._groupSelected(); hint.textContent = 'Grupowanie zastosowane.'; };
    btnRow.appendChild(btnGroup);

    const btnStart = document.createElement('button');
    btnStart.innerHTML = '\u25B6 Start walki';
    styleDeployBtn(btnStart, 'rgba(80,15,15,0.95)', '#fff');
    btnStart.style.border = '2px solid #d4af37';
    btnStart.style.fontWeight = 'bold';
    btnStart.onclick = () => { this._endDeployPhase(); };
    btnRow.appendChild(btnStart);

    this.overlay.appendChild(div);
    this._deployOverlay = div;
  }

  /** Feedback formacji w fazie rozstawiania. */
  private _showDeployFmtFeedback(hintEl: HTMLElement, msg: string): void {
    hintEl.textContent = 'Formacja: ' + msg;
    hintEl.style.color = '#7be08a';
    setTimeout(() => { hintEl.style.color = '#aaa'; hintEl.textContent = 'Kliknij jednostke atakujaca, potem pole strefy.'; }, 2500);
  }

  /**
   * Obsluguje klik w fazie rozstawiania: najpierw raycast 3D na meshach
   * atakujacych (precyzyjne trafienie w model), potem raycast y=0 do
   * wyznaczenia celu przeniesienia.
   *
   * NAPRAWA BUGU: poprzednia wersja uzywala wylacznie raycastu na plaszczyznie
   * y=0 do wykrywania kliknietych jednostek. Modele 3D maja wysokosc > 0, wiec
   * klikniecie w gornej czesci modelu dawalo pt.z przesuniete o ~0.5 TILE —
   * Math.round zaokraglal do sasiedniego (pustego) kafelka, co przy zaznaczonej
   * jednostce powodowalo jej przeniesienie na bledne pole zamiast ponownego
   * zaznaczenia / wybrania nowej jednostki.
   */
  private _onDeployClick(cx: number, cy: number): void {
    if (!this.deployPhase) return;
    const rect = this.canvas.getBoundingClientRect();
    const ndcX =  ((cx - rect.left) / rect.width)  * 2 - 1;
    const ndcY = -((cy - rect.top)  / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);

    // --- KROK 1: Sprawdz 3D-raycast na meshach atakujacych ---
    // Dzieki temu klikniecie w dowolna czesc modelu (nie tylko podstawe)
    // precyzyjnie identyfikuje jednostke bez bledu perspektywy.
    const atkGroups = this.atk
      .filter(u => !u.dead && !u.removed)
      .map(u => u.group);
    const hits3d = raycaster.intersectObjects(atkGroups, true);
    if (hits3d.length > 0) {
      // Znajdz najblizsza trafiona jednostke atakujaca
      let hitUnit: RuntimeBattleUnit | null = null;
      for (const h of hits3d) {
        let obj: THREE.Object3D | null = h.object;
        while (obj) {
          const found = this.atk.find(u => u.group === obj && !u.dead && !u.removed);
          if (found) { hitUnit = found; break; }
          obj = obj.parent;
        }
        if (hitUnit) break;
      }
      if (hitUnit) {
        this._setDeploySelection(hitUnit);
        return;
      }
    }

    // --- KROK 2: Raycast na plaszczyznę y=0 (cel przeniesienia) ---
    const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const pt = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(ground, pt)) return;

    // Przelicz na kolumne/rzad siatki
    const col = Math.round(pt.x / TILE_S);
    const row = Math.round(pt.z / TILE_S);

    const DEPLOY_MAX_COL = 12;

    // Fallback: sprawdz occByKey (na wypadek gdyby raycast 3D nie trafil —
    // np. jednostka bez mesha; dla bezpieczenstwa zachowujemy ten krok)
    const key = cellKey(col, row);
    const unitAtCell = this.occByKey.get(key);
    if (unitAtCell && unitAtCell.side === 'atk') {
      this._setDeploySelection(unitAtCell);
      return;
    }

    // Jesli jest zaznaczona jednostka i kliknieto wolne pole w strefie
    if (this._deploySelected) {
      const inZone = col >= 0 && col <= DEPLOY_MAX_COL && row >= 0 && row < BF_ROWS;
      const passable = this.terrainMap.passable(col, row);
      const free = !this.occByKey.has(key);
      if (inZone && passable && free) {
        this._moveDeployUnit(this._deploySelected, col, row);
        this._clearDeploySelection();
      }
      // Klik poza strefa lub na zajete pole: jednostka pozostaje zaznaczona
      // (nie znika, nie przenosi sie — gracz musi klikac dalej)
    }
  }

  /** Zaznacza jednostke w fazie rozstawiania (wizualne scale 1.2). */
  private _setDeploySelection(ru: RuntimeBattleUnit): void {
    // Odznacz poprzednia
    if (this._deploySelected) {
      this._deploySelected.group.scale.setScalar(1.0);
    }
    this._deploySelected = ru;
    ru.group.scale.setScalar(1.25);
  }

  /** Odznacza aktualnie zaznaczona jednostke. */
  private _clearDeploySelection(): void {
    if (this._deploySelected) {
      this._deploySelected.group.scale.setScalar(1.0);
    }
    this._deploySelected = null;
  }

  /**
   * Przenosi jednostke atakujaca na nowe pole (col, row).
   * Aktualizuje occByKey, pozycje mesha i pasek HP.
   */
  private _moveDeployUnit(ru: RuntimeBattleUnit, newCol: number, newRow: number): void {
    // Usun stary klucz
    const oldKey = cellKey(ru.q, ru.r);
    this.occByKey.delete(oldKey);
    // Ustaw nowe wspolrzedne
    ru.q = newCol;
    ru.r = newRow;
    const { x, z } = cellToWorld(newCol, newRow);
    const topY = tileTopY(this.terrainMap, newCol, newRow);
    ru.group.position.set(x, topY, z);
    ru.hpBarGroup.position.set(x, topY + HPBAR_Y, z);
    // Wstaw nowy klucz
    this.occByKey.set(cellKey(newCol, newRow), ru);
  }

  /**
   * Reset rozmieszczenia atakujacych — usuwa ich z mapy zajętości,
   * usuwa ich modele z sceny i wywoluje _placeUnits ponownie.
   */
  private _resetDeployAttacker(): void {
    // Usun atakujacych z sceny i occByKey
    for (const ru of this.atk) {
      if (ru.removed) continue;
      this.occByKey.delete(cellKey(ru.q, ru.r));
      this.scene.remove(ru.group);
      this.scene.remove(ru.hpBarGroup);
    }
    this.atk = [];
    // Ponownie wywolaj place dla atakujacych
    const siegeMode = this.siegeWallCol >= 0;
    // Potrzebujemy oryginalnych BattleUnit[] — pobierz z aktualnych def (dziala bo atk byly wyczyszczone)
    // Re-derive from existing def side — atk BattleUnit[] zachowane w closurze opts
    // Najlatwiej: wywolaj ponownie _placeUnits tylko dla atakujacych
    // W tym celu uzyj istniejacych danych z runtime units obrońców
    // UWAGA: przy resecie wywolujemy _placeUnitsAtk — podzbiór _placeUnits
    this._placeUnitsAtkOnly(siegeMode);
    this._clearDeploySelection();
  }

  /**
   * Ustawia tylko atakujacych (dla Reset w fazie deploy).
   * Odtwarza logike z _placeUnits dla strony 'atk'.
   * Korzysta z _savedAtkBUs zapisanych przy _placeUnits.
   */
  private _placeUnitsAtkOnly(siegeMode: boolean): void {
    if (this._savedAtkBUs.length === 0) {
      // Fallback: brak zapisanych danych — powiadom gracza
      if (this._deployOverlay) {
        const hint = this._deployOverlay.querySelector('div') as HTMLDivElement | null;
        if (hint) hint.textContent = 'Brak danych do resetu — uzyj "Start".';
      }
      return;
    }

    // Pomocnicze stale z _placeUnits (siege layout)
    const SIEGE_ATK_FRONT_COL = 2;
    const SIEGE_ATK_COL_STEP  = 1;
    const frontCol = (siegeMode && this.siegeWallCol >= 0) ? SIEGE_ATK_FRONT_COL : ATK_FRONT_COL;
    const rankStep = (siegeMode && this.siegeWallCol >= 0) ? SIEGE_ATK_COL_STEP  : ATK_COL_STEP;

    const clampCol = (c: number): number => Math.max(0, Math.min(BF_COLS - 1, c));
    const clampRow = (r: number): number => Math.max(0, Math.min(BF_ROWS - 1, r));
    const freeOk = (c: number, r: number): boolean =>
      !this.occByKey.has(cellKey(c, r)) && this.terrainMap.passable(c, r);

    const units = this._savedAtkBUs;
    const meleeI: number[] = [], javI: number[] = [], arcI: number[] = [],
          siegeI: number[] = [], mountIdx: number[] = [];
    units.forEach((u, i) => {
      if (isMounted(u)) { mountIdx.push(i); return; }
      if (isSiegeUnit(u)) { siegeI.push(i); return; }
      if (!isPrimaryRanged(u)) { meleeI.push(i); return; }
      if (normName(String(u.kategoria ?? '')).includes('oszczep')) { javI.push(i); return; }
      arcI.push(i);
    });

    const MAX_LINE = 12;
    const midRow = Math.floor(BF_ROWS / 2);
    const idealRow = new Array<number>(units.length);
    const idealCol = new Array<number>(units.length);

    const layGroup = (list: number[], rankBase: number): number => {
      if (list.length === 0) return 0;
      const per = Math.max(1, Math.min(list.length, MAX_LINE));
      const r0g = midRow - Math.floor(per / 2);
      list.forEach((ui, k) => {
        idealRow[ui] = clampRow(r0g + (k % per));
        idealCol[ui] = clampCol(frontCol + (rankBase + Math.floor(k / per)) * rankStep);
      });
      return Math.ceil(list.length / per);
    };
    let rankBase = 0;
    rankBase += layGroup(meleeI, rankBase);
    rankBase += layGroup(javI, rankBase);
    const arcRanks = layGroup(arcI, rankBase);
    rankBase += arcRanks;
    const siegeRanks = layGroup(siegeI, rankBase);
    const totalFootRanks = rankBase + siegeRanks;
    const mountColOff = totalFootRanks + 5;
    const mountPer = Math.max(1, Math.min(mountIdx.length, MAX_LINE));
    const mountR0 = midRow - Math.floor(mountPer / 2);
    mountIdx.forEach((ui, k) => {
      idealRow[ui] = clampRow(mountR0 + (k % mountPer));
      idealCol[ui] = clampCol(frontCol + (mountColOff + Math.floor(k / mountPer)) * rankStep);
    });

    const newAtk: RuntimeBattleUnit[] = [];
    for (let idx = 0; idx < units.length; idx++) {
      const bu = units[idx]!;
      let row = idealRow[idx]!;
      let col = idealCol[idx]!;
      let key = cellKey(col, row);
      if (!freeOk(col, row)) {
        let placed = false;
        const baseCol = col;
        for (let rr = 0; rr < BF_ROWS && !placed; rr++) {
          if (freeOk(baseCol, rr)) { col = baseCol; row = rr; key = cellKey(baseCol, rr); placed = true; }
        }
        for (let extra = 1; extra < BF_COLS && !placed; extra++) {
          for (let rr = 0; rr < BF_ROWS && !placed; rr++) {
            const cc = clampCol(baseCol + extra * rankStep);
            if (freeOk(cc, rr)) { col = cc; row = rr; key = cellKey(cc, rr); placed = true; }
          }
        }
      }
      const { x, z } = cellToWorld(col, row);
      const topY = tileTopY(this.terrainMap, col, row);

      let group: THREE.Group;
      try {
        const modelName = String((bu.stats as any)?.['Jednostka'] ?? bu.nazwa);
        group = buildUnitModel(bu.kategoria, bu.ownerColor, modelName);
      } catch (_) {
        group = makeFallbackAvatar(bu.ownerColor);
      }
      group.position.set(x, topY, z);
      group.rotation.y = dirYaw(Dir.E);
      this.scene.add(group);

      const mats: THREE.Material[] = (group.userData['mats'] as THREE.Material[]) ?? [];
      const perTokenGeos: THREE.BufferGeometry[] = (group.userData['perTokenGeos'] as THREE.BufferGeometry[]) ?? [];

      const ammo0 = ammoCount(bu);
      const ammoShown = Number.isFinite(ammo0) && ammo0 > 0;
      const bars = makeUnitBars(sideColor('atk'), ammoShown);
      bars.hpBarGroup.position.set(x, topY + HPBAR_Y, z);
      this.scene.add(bars.hpBarGroup);
      bars.hpBarGroup.traverse(obj => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          if (mesh.geometry) this.ownedGeos.push(mesh.geometry as THREE.BufferGeometry);
          const mm = mesh.material;
          if (Array.isArray(mm)) this.ownedMats.push(...mm);
          else if (mm) this.ownedMats.push(mm as THREE.Material);
        }
      });

      const moraleBase = moraleBaseFor(bu);
      const ru: RuntimeBattleUnit = {
        bu,
        group,
        hpBarFg:     bars.hpBarFg,
        hpBarBg:     bars.hpBarBg,
        hpBarGroup:  bars.hpBarGroup,
        moraleBarFg: bars.moraleBarFg,
        moraleBarBg: bars.moraleBarBg,
        ammoBarFg:   bars.ammoBarFg,
        ammoBarBg:   bars.ammoBarBg,
        ammoBarShown: ammoShown,
        q:           col,
        r:           row,
        side:        'atk',
        dead:        false,
        fadingOut:   false,
        fadeStart:   0,
        acted:       false,
        moveLeft:    movementPoints(bu),
        range:       attackRange(bu),
        ranged:      isRanged(bu),
        rangedBase:  isRanged(bu),
        primaryRanged: isPrimaryRanged(bu),
        ammoLeft:    ammo0,
        ammoMax:     ammo0,
        dryCol:           -1,
        heldAfterFallback: false,
        mounted:      isMounted(bu),
        antiCavSpear: isAntiCavSpear(bu),
        phalanx:      isPhalanx(bu),
        facing:       Dir.E,
        morale:       moraleBase,
        moraleMax:    moraleBase,
        neverRout:    isNeverRout(bu),
        fleeMorale:   fleeMoraleFor(bu),
        routed:       false,
        screenLostApplied: false,
        fleeStuck:    0,
        surroundApplied: false,
        removed:      false,
        onWallWalkway: false,
        playerOrder:  { type: 'none' },
        rangedKite:       true,
        shootingEnabled:  true,
        groupId:      null,
        formationOffset: null,
        mats,
        perTokenGeos,
      };
      this._updateMoraleBar(ru);
      this._updateAmmoBar(ru);
      this.occByKey.set(key, ru);
      newAtk.push(ru);
    }
    this.atk = newAtk;

    // Powiadom gracza
    if (this._deployOverlay) {
      const hint = this._deployOverlay.querySelector('div') as HTMLDivElement | null;
      if (hint) hint.textContent = 'Jednostki przywrocone do domyslnego rozstawienia.';
    }
  }

  /**
   * Konczy faze rozstawiania — ukrywa overlay i strefe,
   * uruchamia walke.
   */
  private _endDeployPhase(): void {
    this.deployPhase = false;
    this._clearDeploySelection();
    this._setDeployZoneVisible(false);
    if (this._deployOverlay && this._deployOverlay.parentNode) {
      this._deployOverlay.parentNode.removeChild(this._deployOverlay);
      this._deployOverlay = null;
    }
    // Zresetuj vLastWall zeby nie skoczyc czasu po dlugiej fazie deploy
    this.vLastWall = 0;
    this._startBattle();
  }

  // =========================================================================
  // STEROWANIE RECZNIE -- tryb override (RECZNY/AUTO)
  // =========================================================================

  /** Przelacza miedzy trybem AUTO a RECZNYM. */
  private _toggleManualMode(): void {
    this._manualMode = !this._manualMode;
    const label = this._manualMode ? 'RECZNE' : 'AUTO';
    if (this._manualBtn) {
      const iconEl = (this._manualBtn as any)._iconEl as HTMLElement | undefined;
      if (iconEl) iconEl.textContent = this._manualMode ? '\u{1F579}' : '\u{1F3AE}';
      this._manualBtn.style.background = this._manualMode ? 'rgba(100,30,10,0.9)' : 'rgba(25,35,70,0.85)';
      this._manualBtn.style.borderColor = this._manualMode ? 'rgba(212,100,50,0.7)' : 'rgba(212,175,55,0.35)';
    }
    if (this._modeBanner) {
      this._modeBanner.textContent = 'TRYB: ' + label;
      this._modeBanner.style.display = 'block';
      this._modeBanner.style.background = this._manualMode
        ? 'rgba(100,30,10,0.88)' : 'rgba(20,40,80,0.82)';
    }
    if (!this._manualMode) {
      this._clearAllSelection();
      for (const ru of this.atk) ru.playerOrder = { type: 'none' };
    }
    if (this._manualMode && !this._rosterBar) this._buildRosterBar();
    if (this._rosterBar) this._rosterBar.style.display = this._manualMode ? 'flex' : 'none';
    this._updateRosterBar();
    this._updateSelectedPanel();
  }

  /** Klawisz R. */
  private readonly _onKeyManual = (e: KeyboardEvent): void => {
    if (e.key !== 'r' && e.key !== 'R') return;
    if (isEditableTarget(e.target)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (this.deployPhase || !this.started || this.finished) return;
    e.preventDefault();
    this._toggleManualMode();
  };

  /**
   * Obsluguje klikniecie w fazie walki (tryb RECZNY).
   * Zaznaczanie jednostek gracza / wydawanie rozkazow.
   *
   * NAPRAWA: gdy raycast3D trafi na mesh sceniczny (teren/mur/gruz) bez
   * identyfikacji jednostki, nie wracamy od razu — przechodzimy do
   * kliknięcia na puste pole (rozkaz RUCH). Dodatkowo fallback occByKey.
   */
  /**
   * Box-select: zaznacza wszystkie WLASNE (atk) jednostki ktore mieszcza sie
   * w prostokącie ekranowym (x1,y1)-(x2,y2) w pikselach (client coords).
   */
  private _doBoxSelect(x1: number, y1: number, x2: number, y2: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const found: RuntimeBattleUnit[] = [];
    for (const ru of this.atk) {
      if (ru.dead || ru.fadingOut || ru.removed || ru.routed) continue;
      const screen = worldToScreen(ru.group.position, this.camera, this.canvas);
      if (!screen) continue;
      const sx = screen.x + rect.left;
      const sy = screen.y + rect.top;
      if (sx >= x1 && sx <= x2 && sy >= y1 && sy <= y2) found.push(ru);
    }
    if (found.length === 0) {
      // Puste zaznaczenie = odznacz wszystko
      this._clearAllSelection();
      return;
    }
    this._clearAllSelection();
    for (const ru of found) {
      this._selectedUnits.add(ru.bu.id);
      this._addSelectionRing(ru);
    }
    this._updateRosterBar();
    this._updateSelectedPanel();
    this._showOrderFeedback('ZAZNACZONO: ' + found.length);
  }

  private _onBattleClick(cx: number, cy: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const ndcX =  ((cx - rect.left) / rect.width)  * 2 - 1;
    const ndcY = -((cy - rect.top)  / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);

    // Krok 1: Raycast3D na meshach jednostek
    const allGroups = [...this.atk, ...this.def]
      .filter(u => !u.dead && !u.fadingOut)
      .map(u => u.group);
    const hits = raycaster.intersectObjects(allGroups, true);

    let hitUnit: RuntimeBattleUnit | null = null;
    for (const h of hits) {
      let obj: THREE.Object3D | null = h.object;
      while (obj) {
        const found = [...this.atk, ...this.def].find(u => u.group === obj);
        if (found && !found.dead && !found.fadingOut) { hitUnit = found; break; }
        obj = obj.parent;
      }
      if (hitUnit) break;
    }

    if (hitUnit) {
      if (hitUnit.side === 'atk') {
        // Zaznacz jednostke (lub cala grupe jesli jest w grupie; Ctrl = indywidualny rozkaz)
        const individualMode = (window.event instanceof MouseEvent) && (window.event as MouseEvent).ctrlKey;
        this._toggleSelectUnitOrGroup(hitUnit, individualMode);
        return;
      }
      if (hitUnit.side === 'def') {
        // Rozkaz Atak na wroga (dla wszystkich zaznaczonych)
        if (this._selectedUnits.size > 0) {
          for (const id of this._selectedUnits) {
            const u = this.atk.find(u => u.bu.id === id);
            if (u && !u.dead) u.playerOrder = { type: 'attack', targetId: hitUnit.bu.id };
          }
          this._showOrderFeedback('ATAK: ' + hitUnit.bu.nazwa);
        }
        return;
      }
    }

    // Krok 2: Raycast na plaszczyznę y=0 → col/row siatki
    const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const pt = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(ground, pt)) return;
    const col = Math.round(pt.x / TILE_S);
    const row = Math.round(pt.z / TILE_S);
    if (col < 0 || col >= BF_COLS || row < 0 || row >= BF_ROWS) return;

    // Krok 3: Fallback occByKey — jesli raycast3D nie trafile a jest jednostka w tym kaflu
    if (!hitUnit) {
      const cellUnit = this.occByKey.get(cellKey(col, row));
      if (cellUnit && !cellUnit.dead && !cellUnit.fadingOut) {
        if (cellUnit.side === 'atk') {
          const individualMode2 = (window.event instanceof MouseEvent) && (window.event as MouseEvent).ctrlKey;
          this._toggleSelectUnitOrGroup(cellUnit, individualMode2);
          return;
        }
        if (cellUnit.side === 'def' && this._selectedUnits.size > 0) {
          for (const id of this._selectedUnits) {
            const u = this.atk.find(u => u.bu.id === id);
            if (u && !u.dead) u.playerOrder = { type: 'attack', targetId: cellUnit.bu.id };
          }
          this._showOrderFeedback('ATAK: ' + cellUnit.bu.nazwa);
          return;
        }
      }
    }

    // Krok 4: Puste pole — rozkaz Ruch
    if (this._selectedUnits.size > 0) {
      // Wykryj grupy wsrod zaznaczonych, wydaj rozkaz grupowy (z formacja)
      const issuedToGroups = new Set<string>();
      const ids = [...this._selectedUnits];
      const half = Math.floor(ids.length / 2);
      for (let i = 0; i < ids.length; i++) {
        const u = this.atk.find(u => u.bu.id === ids[i]);
        if (!u || u.dead) continue;
        if (u.groupId && !issuedToGroups.has(u.groupId)) {
          // Rozkaz grupowy — zachowaj formacje
          issuedToGroups.add(u.groupId);
          this._orderGroupMove(u.groupId, col, row);
        } else if (!u.groupId) {
          // Jednostka bez grupy — offset w osi row
          const offset = i - half;
          const targetRow = Math.max(0, Math.min(BF_ROWS - 1, row + offset));
          u.playerOrder = { type: 'move', col, row: targetRow };
        }
      }
      this._showOrderFeedback('RUCH: (' + col + ',' + row + ')');
    }
    // Klik bez zaznaczenia — nic
  }

  /** Zaznacza / odznacza pojedyncza jednostke. */
  private _toggleSelectUnit(ru: RuntimeBattleUnit): void {
    if (this._selectedUnits.has(ru.bu.id)) {
      this._selectedUnits.delete(ru.bu.id);
      this._removeSelectionRing(ru);
    } else {
      this._selectedUnits.add(ru.bu.id);
      this._addSelectionRing(ru);
    }
    this._updateRosterBar();
    this._updateSelectedPanel();
  }

  /** Zaznacza cala grupe jednostek (np. z rostera). */
  private _selectGroup(units: RuntimeBattleUnit[]): void {
    this._clearAllSelection();
    for (const u of units) {
      if (!u.dead && !u.fadingOut) {
        this._selectedUnits.add(u.bu.id);
        this._addSelectionRing(u);
      }
    }
    this._updateRosterBar();
    this._updateSelectedPanel();
  }

  /** Wyczysc calkowite zaznaczenie. */
  private _clearAllSelection(): void {
    for (const id of this._selectedUnits) {
      const u = this.atk.find(u => u.bu.id === id);
      if (u) this._removeSelectionRing(u);
    }
    this._selectedUnits.clear();
    this._updateRosterBar();
    this._updateSelectedPanel();
  }

  /** Dodaj swiecacy ring pod jednostka (PlaneGeometry, emissive). */
  private _addSelectionRing(ru: RuntimeBattleUnit): void {
    if (this._selectionRings.has(ru.bu.id)) return;
    const geo = new THREE.RingGeometry(0.45, 0.58, 24);
    geo.rotateX(-Math.PI / 2);
    this.ownedGeos.push(geo);
    // Kolor obwodki: zloty dla jednostek w grupie, cyjan dla zwyklych
    const ringColor = ru.groupId ? 0xffd700 : 0x00ffcc;
    const mat = new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: 0.85, depthWrite: false });
    this.ownedMats.push(mat);
    const ring = new THREE.Mesh(geo, mat);
    ring.position.copy(ru.group.position);
    ring.position.y = 0.03;
    ru.group.add(ring);
    this._selectionRings.set(ru.bu.id, ring);
  }

  /** Usun ring spod jednostki. */
  private _removeSelectionRing(ru: RuntimeBattleUnit): void {
    const ring = this._selectionRings.get(ru.bu.id);
    if (!ring) return;
    ru.group.remove(ring);
    this._selectionRings.delete(ru.bu.id);
  }

  /** Rozkaz STOJ dla zaznaczonych. */
  private _orderHoldSelected(): void {
    if (this._selectedUnits.size === 0) return;
    for (const id of this._selectedUnits) {
      const u = this.atk.find(u => u.bu.id === id);
      if (u && !u.dead) u.playerOrder = { type: 'hold' };
    }
    this._showOrderFeedback('STOJ');
  }

  /** Krotki feedback tekstowy w hint. */
  private _showOrderFeedback(msg: string): void {
    const prev = this.hint.textContent;
    this.hint.textContent = '[RECZNE] ' + msg;
    setTimeout(() => { if (this.hint.textContent === '[RECZNE] ' + msg) this.hint.textContent = prev ?? ''; }, 1500);
  }

  /** Rozkaz WYCOFAJ. */
  private _orderRetreatSelected(): void {
    if (this._selectedUnits.size === 0) return;
    for (const id of this._selectedUnits) {
      const u = this.atk.find(u => u.bu.id === id);
      if (!u || u.dead) continue;
      const retreatCol = Math.max(0, u.q - 6);
      u.playerOrder = { type: 'move', col: retreatCol, row: u.r };
    }
    this._showOrderFeedback('WYCOFAJ');
  }

  /** Aktualizuje panel zaznaczonej jednostki/grupy. */
  private _updateSelectedPanel(): void {
    if (!this._selPanel) return;
    if (!this._manualMode || this._selectedUnits.size === 0) {
      this._selPanel.style.display = 'none'; return;
    }
    const selIds = [...this._selectedUnits];
    const selUnits = selIds.map(id => this.atk.find(u => u.bu.id === id)).filter((u): u is RuntimeBattleUnit => !!u && !u.dead);
    if (selUnits.length === 0) { this._selPanel.style.display = 'none'; return; }
    this._selPanel.style.display = 'block';
    const isSingle = selUnits.length === 1;
    const ru = selUnits[0]!;
    const totalHp = selUnits.reduce((s, u) => s + Math.max(0, u.bu.hp), 0);
    const totalMaxHp = selUnits.reduce((s, u) => s + u.bu.maxHp, 0);
    const hpPct = totalMaxHp > 0 ? Math.round(100 * totalHp / totalMaxHp) : 0;
    const moraleVal: number = isSingle ? ((ru as any).morale ?? 100) : 100;
    const moraleMax: number = isSingle ? ((ru as any).moraleMax ?? 100) : 100;
    const morPct = moraleMax > 0 ? Math.round(100 * moraleVal / moraleMax) : 100;
    const atkStat = (ru.bu.stats as any)?.['Atak'] ?? '?';
    const defStat = (ru.bu.stats as any)?.['Obrona'] ?? '?';
    const icon = this._unitTypeIcon(ru.bu);
    const orderLbl = isSingle ? this._orderLabel(ru) : selUnits.length + ' jednostek';
    // Czy unit jest dystansowy?
    const isRangedUnit = isSingle && (ru.rangedBase || ru.range > 1);
    const kiteOn = isSingle ? ru.rangedKite : true;
    const shootOn = isSingle ? ru.shootingEnabled : true;
    // Informacja o grupie
    const groupIds = [...new Set(selUnits.map(u => u.groupId).filter((g): g is string => !!g))];
    const inGroup = groupIds.length > 0;
    const singleGroup = groupIds.length === 1 ? groupIds[0]! : null;
    const groupLabel = singleGroup
      ? ('<span style="color:#ffd700;font-size:9px;font-weight:bold;">◆ Grupa ' + singleGroup + '</span>')
      : (groupIds.length > 1 ? '<span style="color:#ffd700;font-size:9px;">' + groupIds.length + ' grup</span>' : '');
    const fmtBtnStyle = 'flex:1;background:rgba(30,30,30,0.88);color:#e8e0d0;border:1px solid rgba(212,175,55,0.3);border-radius:4px;padding:3px 2px;cursor:pointer;font-size:9px;';
    this._selPanel.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
        '<div style="font-size:22px;">' + icon + '</div>' +
        '<div><div style="color:#d4af37;font-size:11px;font-weight:bold;">' +
          (isSingle ? ru.bu.nazwa : selUnits.length + ' zaznaczonych') +
        '</div><div style="color:#888;font-size:9px;">' + (isSingle ? ru.bu.kategoria : '') + '</div>' +
        (groupLabel ? '<div>' + groupLabel + '</div>' : '') +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:4px;">' +
        '<div style="display:flex;justify-content:space-between;font-size:9px;color:#aaa;margin-bottom:2px;"><span>HP ' + totalHp + '/' + totalMaxHp + '</span><span>' + hpPct + '%</span></div>' +
        '<div style="width:100%;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;"><div style="width:' + hpPct + '%;height:100%;background:' + (hpPct > 50 ? '#4caf50' : hpPct > 25 ? '#ff9800' : '#f44336') + ';border-radius:3px;"></div></div>' +
      '</div>' +
      (isSingle ?
        '<div style="margin-bottom:4px;"><div style="display:flex;justify-content:space-between;font-size:9px;color:#aaa;margin-bottom:2px;"><span>Morale</span><span>' + morPct + '%</span></div><div style="width:100%;height:5px;background:rgba(255,255,255,0.07);border-radius:3px;overflow:hidden;"><div style="width:' + morPct + '%;height:100%;background:' + (morPct > 50 ? '#9c27b0' : '#f44336') + ';border-radius:3px;"></div></div></div>' : '') +
      '<div style="display:flex;gap:5px;font-size:9px;color:#ccc;margin-bottom:3px;"><span>Atk:' + atkStat + '</span><span>Obr:' + defStat + '</span></div>' +
      '<div style="color:#888;font-size:9px;font-style:italic;margin-bottom:4px;">' + orderLbl + '</div>' +
      '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:3px;">' +
        '<button id="sp-stop" style="flex:1;min-width:38px;background:rgba(70,40,10,0.85);color:#e8e0d0;border:1px solid rgba(212,175,55,0.35);border-radius:4px;padding:3px 4px;cursor:pointer;font-size:10px;">STOJ</button>' +
        '<button id="sp-ret" style="flex:1;min-width:38px;background:rgba(60,10,10,0.85);color:#e8e0d0;border:1px solid rgba(212,175,55,0.35);border-radius:4px;padding:3px 4px;cursor:pointer;font-size:10px;">WYC</button>' +
      '</div>' +
      (!isSingle ?
        '<div style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:3px;">' +
          '<button id="sp-group" style="flex:1;min-width:52px;background:rgba(60,50,0,0.88);color:#ffd700;border:1px solid #ffd700;border-radius:4px;padding:3px 4px;cursor:pointer;font-size:9px;font-weight:bold;">◆ Grupuj</button>' +
          (inGroup ? '<button id="sp-ungroup" style="flex:1;min-width:52px;background:rgba(50,30,0,0.88);color:#cc9900;border:1px solid #cc9900;border-radius:4px;padding:3px 4px;cursor:pointer;font-size:9px;">Rozgrup.</button>' : '') +
        '</div>' +
        '<div style="display:flex;gap:3px;margin-bottom:3px;">' +
          '<button id="sp-f1" title="F1: Lucznicy przod / Melee srodek / Konnica boki" style="' + fmtBtnStyle + '">\u{1F3F9} F1</button>' +
          '<button id="sp-f2" title="F2: Melee przod / Dystans tyl / Konnica boki" style="' + fmtBtnStyle + '">\u{1F5E1} F2</button>' +
          '<button id="sp-f3" title="F3: Machiny przod / Lucznicy tyl / Konnica tyl" style="' + fmtBtnStyle + '">\u{1F3F0} F3</button>' +
        '</div>'
      : '') +
      (isRangedUnit ?
        '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:3px;">' +
          '<button id="sp-kite" title="Kitowanie: unit cofa sie gdy wrog sie zbliza" style="flex:1;min-width:60px;background:' + (kiteOn ? 'rgba(0,80,60,0.85)' : 'rgba(60,10,10,0.85)') + ';color:#e8e0d0;border:1px solid ' + (kiteOn ? '#00cc88' : 'rgba(212,100,50,0.5)') + ';border-radius:4px;padding:3px 4px;cursor:pointer;font-size:9px;">' +
            (kiteOn ? 'Kituj ON' : 'Kituj OFF') +
          '</button>' +
          '<button id="sp-shoot" title="Strzela dystansowo (wylaczone = idzie wrecz)" style="flex:1;min-width:60px;background:' + (shootOn ? 'rgba(0,60,80,0.85)' : 'rgba(60,10,10,0.85)') + ';color:#e8e0d0;border:1px solid ' + (shootOn ? '#00aacc' : 'rgba(212,100,50,0.5)') + ';border-radius:4px;padding:3px 4px;cursor:pointer;font-size:9px;">' +
            (shootOn ? 'Strzal ON' : 'Wrecz') +
          '</button>' +
        '</div>'
      : '') ;
    const stopBtn = this._selPanel.querySelector('#sp-stop') as HTMLButtonElement | null;
    if (stopBtn) stopBtn.onclick = () => { this._orderHoldSelected(); };
    const retBtn = this._selPanel.querySelector('#sp-ret') as HTMLButtonElement | null;
    if (retBtn) retBtn.onclick = () => { this._orderRetreatSelected(); };
    const groupBtn = this._selPanel.querySelector('#sp-group') as HTMLButtonElement | null;
    if (groupBtn) groupBtn.onclick = () => { this._groupSelected(); };
    const ungroupBtn = this._selPanel.querySelector('#sp-ungroup') as HTMLButtonElement | null;
    if (ungroupBtn) ungroupBtn.onclick = () => { this._ungroupSelected(); };
    const f1Btn = this._selPanel.querySelector('#sp-f1') as HTMLButtonElement | null;
    if (f1Btn) f1Btn.onclick = () => {
      if (singleGroup) { this._applyGroupFormation(singleGroup, 'F1'); }
      else { this._groupSelected(); const ng = selUnits[0]?.groupId; if (ng) this._applyGroupFormation(ng, 'F1'); }
    };
    const f2Btn = this._selPanel.querySelector('#sp-f2') as HTMLButtonElement | null;
    if (f2Btn) f2Btn.onclick = () => {
      if (singleGroup) { this._applyGroupFormation(singleGroup, 'F2'); }
      else { this._groupSelected(); const ng = selUnits[0]?.groupId; if (ng) this._applyGroupFormation(ng, 'F2'); }
    };
    const f3Btn = this._selPanel.querySelector('#sp-f3') as HTMLButtonElement | null;
    if (f3Btn) f3Btn.onclick = () => {
      if (singleGroup) { this._applyGroupFormation(singleGroup, 'F3'); }
      else { this._groupSelected(); const ng = selUnits[0]?.groupId; if (ng) this._applyGroupFormation(ng, 'F3'); }
    };
    if (isRangedUnit) {
      const kiteBtn = this._selPanel.querySelector('#sp-kite') as HTMLButtonElement | null;
      if (kiteBtn) kiteBtn.onclick = () => {
        if (isSingle) {
          ru.rangedKite = !ru.rangedKite;
          this._showOrderFeedback(ru.rangedKite ? 'KITUJ: ON' : 'KITUJ: OFF');
        } else {
          const newVal = !selUnits[0]!.rangedKite;
          for (const u of selUnits) u.rangedKite = newVal;
          this._showOrderFeedback(newVal ? 'KITUJ: ON (grupa)' : 'KITUJ: OFF (grupa)');
        }
        this._updateSelectedPanel();
      };
      const shootBtn = this._selPanel.querySelector('#sp-shoot') as HTMLButtonElement | null;
      if (shootBtn) shootBtn.onclick = () => {
        if (isSingle) {
          ru.shootingEnabled = !ru.shootingEnabled;
          this._showOrderFeedback(ru.shootingEnabled ? 'STRZAL: ON' : 'WRECZ');
        } else {
          const newVal = !selUnits[0]!.shootingEnabled;
          for (const u of selUnits) u.shootingEnabled = newVal;
          this._showOrderFeedback(newVal ? 'STRZAL: ON (grupa)' : 'WRECZ (grupa)');
        }
        this._updateSelectedPanel();
      };
    }
  }

  /** Opis rozkazu. */
  private _orderLabel(ru: RuntimeBattleUnit): string {
    const o = ru.playerOrder;
    if (!o || o.type === 'none') return 'Brak rozkazu (AI)';
    if (o.type === 'hold') return 'Stoj';
    if (o.type === 'move') return 'Ruch -> (' + o.col + ',' + o.row + ')';
    if (o.type === 'attack') return 'Atak -> ' + o.targetId;
    return '';
  }


  // -------------------------------------------------------------------------
  // DOLNY ROSTER — karty PER JEDNOSTKA (Total War style)
  // -------------------------------------------------------------------------

  /** Typ jednostki -> ikona unicode */
  private _unitTypeIcon(bu: BattleUnit | { kategoria: string; stats?: any }): string {
    const cat = String((bu as any).kategoria ?? '').toLowerCase().trim();
    if (cat === 'lucznik' || cat === 'kusznik') return '\u{1F3F9}';
    if (cat === 'oszczepnik' || cat === 'procarz') return '\u{1FAE7}';
    if (cat === 'konnica') return '\u{1F40E}';
    if (cat === 'rydwan') return '\u{1F6F5}';
    if (cat === 'falanga' || cat === 'wlocznik') return '\u{1F531}';
    if (cat === 'taran' || cat === 'katapulta' || cat === 'wieza') return '\u{1F3F0}';
    const n = String((bu as any).nazwa ?? '').toLowerCase();
    if (n.includes('luczn') || n.includes('archer') || n.includes('kusznik')) return '\u{1F3F9}';
    if (n.includes('konn') || n.includes('jezdz')) return '\u{1F40E}';
    if (n.includes('oszczep') || n.includes('procarz')) return '\u{1FAE7}';
    return '\u{1F5E1}';
  }

  /** Buduje dolny pasek kart jednostek gracza — PER JEDNOSTKA (nie per typ). */
  private _buildRosterBar(): void {
    if (this._rosterBar) return;
    const bar = document.createElement('div');
    bar.id = 'player-roster-bar';
    Object.assign(bar.style, {
      position:       'absolute',
      bottom:         '64px',
      left:           '0',
      right:          '0',
      height:         '84px',
      background:     'rgba(8,6,4,0.92)',
      borderTop:      '1px solid rgba(212,175,55,0.5)',
      display:        'flex',
      flexDirection:  'row',
      alignItems:     'center',
      gap:            '4px',
      padding:        '4px 10px',
      zIndex:         '10009',
      overflowX:      'auto',
      overflowY:      'hidden',
    });
    this.overlay.appendChild(bar);
    this._rosterBar = bar;
    this._unitCards.clear();
    for (const ru of this.atk) {
      const card = this._createUnitCard(ru);
      bar.appendChild(card);
      this._unitCards.set(ru.bu.id, card);
    }
  }

  /** Tworzy karte jednostki dla rostera. */
  private _createUnitCard(ru: RuntimeBattleUnit): HTMLDivElement {
    const isDead = ru.dead || ru.fadingOut || ru.removed || ru.routed;
    const isSel = this._selectedUnits.has(ru.bu.id);
    const hpPct = ru.bu.maxHp > 0 ? Math.max(0, ru.bu.hp / ru.bu.maxHp) : 0;
    const morPct = (ru as any).moraleMax > 0 ? Math.max(0, ((ru as any).morale ?? 100) / (ru as any).moraleMax) : hpPct;

    const card = document.createElement('div');
    Object.assign(card.style, {
      minWidth:       '58px',
      width:          '58px',
      height:         '74px',
      background:     isSel ? 'rgba(0,200,160,0.22)' : isDead ? 'rgba(20,10,10,0.7)' : 'rgba(18,20,32,0.92)',
      border:         isSel ? '2px solid #00ffcc' : isDead ? '1px solid #333' : '1px solid rgba(212,175,55,0.28)',
      borderRadius:   '6px',
      cursor:         isDead ? 'default' : 'pointer',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'flex-start',
      padding:        '4px 3px 3px',
      userSelect:     'none',
      flexShrink:     '0',
      opacity:        isDead ? '0.38' : '1',
      transition:     'border-color 0.15s, background 0.15s, opacity 0.3s',
    });

    const iconEl = document.createElement('div');
    Object.assign(iconEl.style, { fontSize: '18px', lineHeight: '1.1', marginBottom: '2px' });
    iconEl.textContent = this._unitTypeIcon(ru.bu);
    card.appendChild(iconEl);

    const namEl = document.createElement('div');
    Object.assign(namEl.style, {
      fontSize: '8px', color: isDead ? '#666' : '#d4af37', fontFamily: 'sans-serif',
      textAlign: 'center', lineHeight: '1.1', maxWidth: '54px', overflow: 'hidden',
      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    });
    namEl.textContent = ru.bu.nazwa;
    card.appendChild(namEl);
    // Wskaznik grupy: maly zloty label jezeli jednostka nalezy do grupy
    if (ru.groupId && !isDead) {
      const grpLbl = document.createElement('div');
      Object.assign(grpLbl.style, {
        fontSize: '7px', color: '#ffd700', fontFamily: 'sans-serif',
        textAlign: 'center', lineHeight: '1.0', marginTop: '1px',
      });
      grpLbl.textContent = '◆ ' + ru.groupId;
      card.appendChild(grpLbl);
      (card as any)._grpLbl = grpLbl;
    }

    const hpTrack = document.createElement('div');
    Object.assign(hpTrack.style, { width: '52px', height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '3px', overflow: 'hidden' });
    const hpFill = document.createElement('div');
    Object.assign(hpFill.style, { width: (hpPct * 100).toFixed(1) + '%', height: '100%', background: hpPct > 0.5 ? '#4caf50' : hpPct > 0.25 ? '#ff9800' : '#f44336', transition: 'width 0.25s', borderRadius: '2px' });
    hpTrack.appendChild(hpFill);
    card.appendChild(hpTrack);
    (card as any)._hpFill = hpFill;

    const morTrack = document.createElement('div');
    Object.assign(morTrack.style, { width: '52px', height: '4px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', marginTop: '2px', overflow: 'hidden' });
    const morFill = document.createElement('div');
    Object.assign(morFill.style, { width: (morPct * 100).toFixed(1) + '%', height: '100%', background: morPct > 0.5 ? '#9c27b0' : '#f44336', transition: 'width 0.25s', borderRadius: '2px' });
    morTrack.appendChild(morFill);
    card.appendChild(morTrack);
    (card as any)._morFill = morFill;

    const hpLbl = document.createElement('div');
    Object.assign(hpLbl.style, { fontSize: '8px', color: '#aaa', fontFamily: 'sans-serif', marginTop: '2px' });
    hpLbl.textContent = Math.max(0, Math.round(ru.bu.hp)) + '/' + ru.bu.maxHp;
    card.appendChild(hpLbl);
    (card as any)._hpLbl = hpLbl;

    card.addEventListener('click', () => {
      if (ru.dead || ru.removed) return;
      this._toggleSelectUnit(ru);
    });

    return card;
  }

  /** Odswiez WSZYSTKIE karty rostera (aktualizuj, nie odtwarzaj). */
  private _updateRosterBar(): void {
    if (!this._rosterBar) return;
    for (const ru of this.atk) {
      let card = this._unitCards.get(ru.bu.id);
      if (!card) {
        card = this._createUnitCard(ru);
        this._rosterBar.appendChild(card);
        this._unitCards.set(ru.bu.id, card);
      }
      const isDead = ru.dead || ru.fadingOut || ru.removed || ru.routed;
      const isSel = this._selectedUnits.has(ru.bu.id);
      const hpPct = ru.bu.maxHp > 0 ? Math.max(0, ru.bu.hp / ru.bu.maxHp) : 0;
      const moraleVal: number = (ru as any).morale ?? (hpPct * 100);
      const moraleMax: number = (ru as any).moraleMax ?? 100;
      const morPct = moraleMax > 0 ? Math.max(0, moraleVal / moraleMax) : hpPct;

      card.style.opacity    = isDead ? '0.32' : '1';
      card.style.cursor     = isDead ? 'default' : 'pointer';
      card.style.background = isSel ? 'rgba(0,200,160,0.22)' : isDead ? 'rgba(20,10,10,0.7)' : 'rgba(18,20,32,0.92)';
      const inGrp = !isDead && !!ru.groupId;
      card.style.border     = isSel ? '2px solid #00ffcc' : isDead ? '1px solid #333' : inGrp ? '1px solid rgba(255,215,0,0.5)' : '1px solid rgba(212,175,55,0.28)';
      // Aktualizuj grpLbl jezeli istnieje
      const grpLbl2 = (card as any)._grpLbl as HTMLDivElement | undefined;
      if (grpLbl2) grpLbl2.textContent = ru.groupId ? ('◆ ' + ru.groupId) : '';

      const hpFill = (card as any)._hpFill as HTMLDivElement | undefined;
      if (hpFill) {
        hpFill.style.width = (hpPct * 100).toFixed(1) + '%';
        hpFill.style.background = hpPct > 0.5 ? '#4caf50' : hpPct > 0.25 ? '#ff9800' : '#f44336';
      }
      const morFill = (card as any)._morFill as HTMLDivElement | undefined;
      if (morFill) {
        morFill.style.width = (morPct * 100).toFixed(1) + '%';
        morFill.style.background = morPct > 0.5 ? '#9c27b0' : morPct > 0.25 ? '#ff9800' : '#f44336';
      }
      const hpLbl = (card as any)._hpLbl as HTMLDivElement | undefined;
      if (hpLbl) hpLbl.textContent = Math.max(0, Math.round(ru.bu.hp)) + '/' + ru.bu.maxHp;
    }
  }


  // =========================================================================
  // GRUPOWANIE JEDNOSTEK (zakres 1-5)
  // =========================================================================

  /**
   * Tworzy TRWALA grupe z aktualnie zaznaczonych jednostek.
   * Nadaje im wspolne groupId, zapisuje wzgledne offsety od centroidu
   * (formacja pierwotna) i aktualizuje roster oraz panel.
   */
  private _groupSelected(): void {
    if (this._selectedUnits.size < 2) {
      this._showOrderFeedback('Zaznacz >= 2 jednostki do grupowania');
      return;
    }
    const selUnits = [...this._selectedUnits]
      .map(id => this.atk.find(u => u.bu.id === id))
      .filter((u): u is RuntimeBattleUnit => !!u && !u.dead && !u.removed && !u.routed);
    if (selUnits.length < 2) {
      this._showOrderFeedback('Za malo zywych jednostek do grupowania');
      return;
    }

    // Odgrupuj wszystkich, ktorzy juz sa w grupach (czyszczenie starych grup)
    const affectedGroups = new Set<string>();
    for (const ru of selUnits) {
      if (ru.groupId) affectedGroups.add(ru.groupId);
    }
    for (const gid of affectedGroups) {
      this._disbandGroup(gid);
    }

    // Wyznacz centroid (srednia pozycja) w chwili grupowania
    const centCol = selUnits.reduce((s, u) => s + u.q, 0) / selUnits.length;
    const centRow = selUnits.reduce((s, u) => s + u.r, 0) / selUnits.length;

    // Nadaj nowe groupId
    this._groupCounter++;
    const gid = 'G' + this._groupCounter;
    const memberIds = new Set<string>();

    for (const ru of selUnits) {
      ru.groupId = gid;
      ru.formationOffset = {
        dc: Math.round(ru.q - centCol),
        dr: Math.round(ru.r - centRow),
      };
      memberIds.add(ru.bu.id);
      // Kolor obwodki: zloty dla grupy
      this._refreshUnitRingColor(ru);
    }
    this._groups.set(gid, memberIds);
    this._showOrderFeedback('GRUPA ' + gid + ': ' + selUnits.length + ' jednostek');
    this._updateRosterBar();
    this._updateSelectedPanel();
  }

  /**
   * Rozbiega grupe o podanym groupId.
   * Resetuje groupId i formationOffset wszystkich czlonkow.
   */
  private _disbandGroup(gid: string): void {
    const members = this._groups.get(gid);
    if (!members) return;
    for (const id of members) {
      const ru = this.atk.find(u => u.bu.id === id);
      if (!ru) continue;
      ru.groupId = null;
      ru.formationOffset = null;
      this._refreshUnitRingColor(ru);
    }
    this._groups.delete(gid);
  }

  /**
   * Rozgrupowuje wszsytkie zaznaczone jednostki (kasuje ich grupy).
   */
  private _ungroupSelected(): void {
    const gids = new Set<string>();
    for (const id of this._selectedUnits) {
      const ru = this.atk.find(u => u.bu.id === id);
      if (ru && ru.groupId) gids.add(ru.groupId);
    }
    if (gids.size === 0) {
      this._showOrderFeedback('Zaznaczone jednostki nie sa w grupie');
      return;
    }
    for (const gid of gids) this._disbandGroup(gid);
    this._showOrderFeedback('Rozgrupowano ' + gids.size + ' grup');
    this._updateRosterBar();
    this._updateSelectedPanel();
  }

  /**
   * Odswieza kolor obwodki zaznaczenia dla jednostki (zloty = w grupie, zielony = zaznaczona zwykla).
   */
  private _refreshUnitRingColor(ru: RuntimeBattleUnit): void {
    const ring = this._selectionRings.get(ru.bu.id);
    if (!ring) return;
    const mat = ring.material as THREE.MeshBasicMaterial;
    if (ru.groupId) {
      mat.color.setHex(0xffd700); // zloty = grupa
    } else {
      mat.color.setHex(0x00ffcc); // cyjan = zwykle zaznaczenie
    }
  }

  /**
   * Klikniecie na jednostke: jezeli jest w grupie, zaznacz CALA grupe.
   * Jezeli Ctrl/Shift wcisniety, zaznacz tylko TE jednostke (indywidualny rozkaz).
   */
  private _toggleSelectUnitOrGroup(ru: RuntimeBattleUnit, individual: boolean = false): void {
    if (!individual && ru.groupId) {
      // Zaznacz cala grupe
      const gid = ru.groupId;
      const alreadyAllSelected = this._isWholeGroupSelected(gid);
      if (alreadyAllSelected) {
        // Odznacz cala grupe
        const members = this._groups.get(gid) ?? new Set<string>();
        for (const id of members) {
          const u = this.atk.find(u => u.bu.id === id);
          if (u) { this._selectedUnits.delete(id); this._removeSelectionRing(u); }
        }
      } else {
        // Zaznacz cala grupe (NIE czyszcz reszty — mozna zaznaczac wiele grup)
        const members = this._groups.get(gid) ?? new Set<string>();
        for (const id of members) {
          const u = this.atk.find(u => u.bu.id === id);
          if (u && !u.dead && !u.removed) {
            this._selectedUnits.add(id);
            this._addSelectionRing(u);
            this._refreshUnitRingColor(u);
          }
        }
      }
    } else {
      // Zwykly toggle (indywidualny lub jednostka bez grupy)
      this._toggleSelectUnit(ru);
    }
    this._updateRosterBar();
    this._updateSelectedPanel();
  }

  /** Sprawdza czy WSZYSTKIE zywe czlonkowie grupy sa zaznaczeni. */
  private _isWholeGroupSelected(gid: string): boolean {
    const members = this._groups.get(gid);
    if (!members) return false;
    for (const id of members) {
      const u = this.atk.find(u => u.bu.id === id);
      if (u && !u.dead && !u.removed && !this._selectedUnits.has(id)) return false;
    }
    return true;
  }

  /**
   * Wydaje rozkaz RUCH grupie Z ZACHOWANIEM FORMACJI.
   * Jednostki docieraja do targetCol/targetRow + ich formationOffset.
   */
  private _orderGroupMove(gid: string, targetCol: number, targetRow: number): void {
    const members = this._groups.get(gid);
    if (!members) return;
    for (const id of members) {
      const u = this.atk.find(u => u.bu.id === id);
      if (!u || u.dead || u.removed) continue;
      const off = u.formationOffset ?? { dc: 0, dr: 0 };
      const destCol = Math.max(0, Math.min(BF_COLS - 1, targetCol + off.dc));
      const destRow = Math.max(0, Math.min(BF_ROWS - 1, targetRow + off.dr));
      u.playerOrder = { type: 'move', col: destCol, row: destRow };
    }
  }

  /**
   * Stosuje formacje F1/F2/F3 do grupy o podanym gid.
   * Przesuwa jednostki GRUPY (jesli jestesmy w fazie deploy: fizycznie;
   * w walce: wydaje rozkazy RUCH do nowych pozycji) i aktualizuje formationOffset.
   *
   * Centroid = aktualna srednia pozycja czlonkow grupy.
   * F1: lucznicy/oszczepnicy przod (min col), melee srodek, konnica boki
   * F2: melee przod (min col), dystansowe tyl, konnica boki
   * F3: machiny obleznicze przod, lucznicy tyl, konnica najdalej tyl
   */
  private _applyGroupFormation(gid: string, formation: 'F1' | 'F2' | 'F3'): void {
    const members = this._groups.get(gid);
    if (!members || members.size === 0) return;

    const units = [...members]
      .map(id => this.atk.find(u => u.bu.id === id))
      .filter((u): u is RuntimeBattleUnit => !!u && !u.dead && !u.removed);
    if (units.length === 0) return;

    // Centroid grupy
    const centCol = Math.round(units.reduce((s, u) => s + u.q, 0) / units.length);
    const centRow = Math.round(units.reduce((s, u) => s + u.r, 0) / units.length);
    const midRow  = centRow;

    // Klasyfikacja jednostek
    const mounted  = units.filter(u => u.mounted);
    const siege    = units.filter(u => !u.mounted && isSiegeUnit(u.bu));
    const rangedUs = units.filter(u => !u.mounted && !isSiegeUnit(u.bu) && u.rangedBase);
    const meleeUs  = units.filter(u => !u.mounted && !isSiegeUnit(u.bu) && !u.rangedBase);

    // Przydziel sloty (col-offset, row-offset wzgledem centroidu)
    const slots: Array<[RuntimeBattleUnit, number, number]> = [];

    const addLine = (list: RuntimeBattleUnit[], colOff: number): void => {
      const n = list.length;
      list.forEach((u, i) => {
        const rowOff = i - Math.floor(n / 2);
        slots.push([u, colOff, rowOff]);
      });
    };

    if (formation === 'F1') {
      // F1: dystansowe przod (col-2), melee srodek (col 0), konnica boki (col+2)
      addLine(rangedUs, -2);
      addLine(meleeUs,   0);
      addLine(siege,     2);
      // Konnica na bokach srodkowej linii
      mounted.forEach((u, i) => {
        const side = i % 2 === 0 ? 1 : -1;
        const rowOff = side * (Math.floor(Math.max(rangedUs.length, meleeUs.length) / 2) + 1 + Math.floor(i / 2));
        slots.push([u, 0, rowOff]);
      });
    } else if (formation === 'F2') {
      // F2: melee przod (col-2), dystansowe tyl (col+1), konnica boki
      addLine(meleeUs,  -2);
      addLine(rangedUs,  1);
      addLine(siege,     3);
      mounted.forEach((u, i) => {
        const side = i % 2 === 0 ? 1 : -1;
        const rowOff = side * (Math.floor(Math.max(meleeUs.length, rangedUs.length) / 2) + 1 + Math.floor(i / 2));
        slots.push([u, -2, rowOff]);
      });
    } else { // F3 oblezenie
      // F3: machiny przod (col-2), lucznicy tyl (col 0), konnica najdalej tyl (col+2)
      addLine(siege,    -2);
      addLine(rangedUs,  0);
      addLine(meleeUs,   1);
      addLine(mounted,   3);
    }

    // Zastosuj sloty: wydaj rozkazy ruchu (lub przesuń fizycznie w deploy)
    for (const [u, dc, dr] of slots) {
      const destCol = Math.max(0, Math.min(BF_COLS - 1, centCol + dc));
      const destRow = Math.max(0, Math.min(BF_ROWS - 1, midRow  + dr));
      // Zaktualizuj formationOffset (nowa formacja pierwotna)
      u.formationOffset = { dc, dr };
      if (this.deployPhase) {
        // W fazie deploy: przesuń fizycznie (jak _moveDeployUnit)
        const key = cellKey(u.q, u.r);
        this.occByKey.delete(key);
        u.q = destCol; u.r = destRow;
        const { x, z } = cellToWorld(destCol, destRow);
        const topY = tileTopY(this.terrainMap, destCol, destRow);
        u.group.position.set(x, topY, z);
        u.hpBarGroup.position.set(x, topY + HPBAR_Y, z);
        this.occByKey.set(cellKey(destCol, destRow), u);
      } else {
        // W walce: wydaj rozkaz ruchu
        u.playerOrder = { type: 'move', col: destCol, row: destRow };
      }
    }
    this._showOrderFeedback('Formacja ' + formation + ' zastosowana dla ' + gid);
    this._updateSelectedPanel();
  }


}

// ---------------------------------------------------------------------------
// Instant (skip) resolver -- pure logic, no DOM/THREE rendering
// ---------------------------------------------------------------------------

function computeInstantResult(
  aliveAtk: RuntimeBattleUnit[],
  aliveDef: RuntimeBattleUnit[],
  terrain: string,
  terrainData: any[],
  counters: any[],
  terrainMap?: BattleTerrainMap,
): { winner: 'atakujacy' | 'obronca'; survivors: BattleUnit[]; log: string[] } {
  const log: string[] = [];

  const atkState = aliveAtk.map(u => ({ ru: u, hp: u.bu.hp }));
  const defState = aliveDef.map(u => ({ ru: u, hp: u.bu.hp }));

  const maxWaves = (atkState.length + defState.length) * 6 + 10;
  let wave = 0;

  while (wave < maxWaves) {
    wave++;
    const lA = atkState.filter(u => u.hp > 0);
    const lD = defState.filter(u => u.hp > 0);
    if (lA.length === 0 || lD.length === 0) break;

    const pairs = Math.max(lA.length, lD.length);
    for (let i = 0; i < pairs; i++) {
      const a = lA[i % lA.length];
      const d = lD[i % lD.length];
      if (!a || !d || a.hp <= 0 || d.hp <= 0) continue;

      const cu_a = toCombatUnit(a.ru.bu);
      const cu_d = toCombatUnit(d.ru.bu);
      cu_a.Health = a.hp;
      cu_d.Health = d.hp;

      // FACING (SS5l) for the instant/skip resolve too: classify where the
      // attacker strikes relative to the defender's facing so flank/rear
      // defence penalties match the watched battle.
      const arc = relativeHit(
        d.ru.facing, a.ru.q, a.ru.r, d.ru.q, d.ru.r,
      );

      // Per-tile terrain (B8): the DEFENDER's tile decides its terrain defence
      // bonus in the canonical resolver, falling back to the battlefield-wide
      // terrain name when no map is provided.
      const defTerrain = terrainMap
        ? terrainMap.combatTerrainName(d.ru.q, d.ru.r)
        : terrain;

      const res = resolveCombat(cu_a, cu_d, {
        maxRounds:        30,
        defenderTerrain:  defTerrain,
        terrainData,
        counters,
        attackerPosition: arc,
      });
      for (const line of res.log) log.push(line);

      a.hp = Math.max(0, a.hp - Math.max(0, cu_a.Health - res.attackerHpLeft));
      d.hp = Math.max(0, d.hp - Math.max(0, cu_d.Health - res.defenderHpLeft));
    }
  }

  const survivorsA = atkState.filter(u => u.hp > 0).map(u => ({ ...u.ru.bu, hp: u.hp }));
  const survivorsD = defState.filter(u => u.hp > 0).map(u => ({ ...u.ru.bu, hp: u.hp }));

  let winner: 'atakujacy' | 'obronca';
  let survivors: BattleUnit[];

  if (survivorsA.length > 0 && survivorsD.length === 0) {
    winner = 'atakujacy'; survivors = survivorsA;
  } else if (survivorsD.length > 0 && survivorsA.length === 0) {
    winner = 'obronca'; survivors = survivorsD;
  } else {
    const hpA = survivorsA.reduce((s, u) => s + u.hp, 0);
    const hpD = survivorsD.reduce((s, u) => s + u.hp, 0);
    winner    = hpA >= hpD ? 'atakujacy' : 'obronca';
    survivors = winner === 'atakujacy' ? survivorsA : survivorsD;
  }

  log.push('=== Natychmiastowy wynik: ' + (winner === 'atakujacy' ? 'ATAKUJACY' : 'OBRONCA') + ' wygrywa ===');
  return { winner, survivors, log };
}

// ---------------------------------------------------------------------------
// Fallback avatar
// ---------------------------------------------------------------------------

function makeFallbackAvatar(color: number): THREE.Group {
  const group   = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(0.18, 0.28, 0.12);
  const headGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
  const mat     = new THREE.MeshLambertMaterial({ color });
  const body    = new THREE.Mesh(bodyGeo, mat);
  const head    = new THREE.Mesh(headGeo, mat);
  body.position.y = 0.14;
  head.position.y = 0.35;
  body.castShadow = true;
  head.castShadow = true;
  group.add(body);
  group.add(head);
  group.userData['mats']         = [mat];
  group.userData['perTokenGeos'] = [bodyGeo, headGeo];
  return group;
}

// ---------------------------------------------------------------------------
// HP / Ammo / Morale bar factory
// ---------------------------------------------------------------------------

function makeUnitBars(outlineColor: number, ammoShown: boolean = false): {
  hpBarGroup:  THREE.Group;
  hpBarFg:     THREE.Mesh;
  hpBarBg:     THREE.Mesh;
  ammoBarFg:   THREE.Mesh;
  ammoBarBg:   THREE.Mesh;
  moraleBarFg: THREE.Mesh;
  moraleBarBg: THREE.Mesh;
} {
  const group = new THREE.Group();

  const frameH = (MORALEBAR_Y - 0) + HPBAR_H + BAR_OUTLINE_PAD * 2;
  const frameW = HPBAR_W + BAR_OUTLINE_PAD * 2;
  const frameGeo = new THREE.PlaneGeometry(frameW, frameH);
  const frameMat = new THREE.MeshBasicMaterial({ color: outlineColor, side: THREE.DoubleSide });
  const frame    = new THREE.Mesh(frameGeo, frameMat);
  frame.position.set(0, MORALEBAR_Y * 0.5, BAR_OUTLINE_Z);
  group.add(frame);

  const makeBar = (y: number, fgColor: number): { fg: THREE.Mesh; bg: THREE.Mesh } => {
    const bgGeo = new THREE.PlaneGeometry(HPBAR_W, HPBAR_H);
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x1a1410, side: THREE.DoubleSide });
    const bg    = new THREE.Mesh(bgGeo, bgMat);
    bg.position.y = y;
    group.add(bg);

    const fgGeo = new THREE.PlaneGeometry(HPBAR_W, HPBAR_H * 0.75);
    const fgMat = new THREE.MeshBasicMaterial({ color: fgColor, side: THREE.DoubleSide });
    const fg    = new THREE.Mesh(fgGeo, fgMat);
    fg.position.set(0, y, 0.002);
    group.add(fg);
    return { fg, bg };
  };

  const hp     = makeBar(0,           0x30c030);
  const ammo   = makeBar(AMMOBAR_Y,   AMMOBAR_COLOR);
  const morale = makeBar(MORALEBAR_Y, 0x30c030);

  // Ukryj pasek ammo jesli nie dotyczy tej jednostki
  if (!ammoShown) {
    ammo.fg.visible = false;
    ammo.bg.visible = false;
  }

  return {
    hpBarGroup:  group,
    hpBarFg:     hp.fg,     hpBarBg:     hp.bg,
    ammoBarFg:   ammo.fg,   ammoBarBg:   ammo.bg,
    moraleBarFg: morale.fg, moraleBarBg: morale.bg,
  };
}

// ---------------------------------------------------------------------------
// Project world position to screen pixels
// ---------------------------------------------------------------------------

function worldToScreen(
  worldPos: THREE.Vector3,
  camera:   THREE.PerspectiveCamera,
  canvas:   HTMLCanvasElement,
): { x: number; y: number } | null {
  const v = worldPos.clone().project(camera);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return null;
  return {
    x: ((v.x + 1) / 2) * w,
    y: ((-v.y + 1) / 2) * h,
  };
}

// ---------------------------------------------------------------------------
// Math / colour helpers
// ---------------------------------------------------------------------------

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function easeOut(t: number): number { return 1 - (1 - t) * (1 - t); }
function easeIn(t: number): number  { return t * t; }

function lighten(color: number, amount: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8)  & 0xff;
  const b =  color        & 0xff;
  const rr = Math.round(r + (255 - r) * amount);
  const gg = Math.round(g + (255 - g) * amount);
  const bb = Math.round(b + (255 - b) * amount);
  return (rr << 16) | (gg << 8) | bb;
}

function blend(a: number, b: number, amount: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const rr  = Math.round(ar + (br - ar) * amount);
  const gg  = Math.round(ag + (bg - ag) * amount);
  const bbv = Math.round(ab + (bb - ab) * amount);
  return (rr << 16) | (gg << 8) | bbv;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof (el as any).tagName !== 'string') return false;
  const tag = el.tagName.toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

function styleButton(btn: HTMLElement, bgColor: string, fgColor: string): void {
  Object.assign(btn.style, {
    padding:       '6px 18px',
    background:    bgColor,
    color:         fgColor,
    border:        '1px solid rgba(255,255,255,0.18)',
    borderRadius:  '4px',
    cursor:        'pointer',
    font:          '14px/1.4 sans-serif',
    letterSpacing: '0.03em',
  });
}

/** Alias for styleButton used in deploy overlay. */
function styleDeployBtn(btn: HTMLElement, bgColor: string, fgColor: string): void {
  styleButton(btn, bgColor, fgColor);
}
