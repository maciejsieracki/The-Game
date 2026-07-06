/**
 * battle-terrain.ts
 *
 * DETERMINISTIC, seeded procedural terrain for the SQUARE tactical battle
 * field (see battleScene.ts). Produces a per-tile terrain map for a COLS x ROWS
 * grid: plains (grass, the default), FOREST clusters, HILLS clusters, a winding
 * RIVER strip crossing the no-man's-land (with a couple of fordable gaps so the
 * field is never fully walled), plus a few scattered ROCK accents.
 *
 * The map is GAMEPLAY data only -- no THREE.js here. battleScene.ts reads it to
 *   (a) render the low-poly decorations (trees / hill bumps / water / rocks),
 *   (b) charge per-tile MOVEMENT cost (forest/hills cost more, river fords are
 *       expensive, plain rivers are impassable), and
 *   (c) feed the DEFENDER's tile terrain into the canonical combat resolver so
 *       a defender on hills/forest gets the SS5j defence bonus and an attacker
 *       striking from a river ford takes the river -25% Atak penalty.
 *
 * Determinism: a tiny xmur3+mulberry32 PRNG seeded from a string. Same seed +
 * same grid size => identical terrain every run (so the watched battle and any
 * smoke/sim agree).
 *
 * ASCII-only source file.
 */

/** The terrain a single battle tile can hold. */
export const enum BTerrain {
  Plains = 0, // grass -- the default open ground
  Forest = 1, // tree cluster: +def vs ranged/cav, costs 2 to enter
  Hills  = 2, // raised ground: +50% def, costs 2 to enter
  River  = 3, // deep water: IMPASSABLE (cannot stand here)
  Ford   = 4, // shallow river crossing: passable but expensive + river attack penalty
  Rocks  = 5, // rocky accent: costs 2, mild cover (treated as plains for combat)
  Wall   = 6, // siege wall tile: IMPASSABLE like River (unit walks on top via walkway, not through)
  Gate   = 7, // gate tile: IMPASSABLE while gateOpen=false; battleScene sets passable when breached
}

/** A generated battle terrain map plus its dimensions. */
export interface BattleTerrainMap {
  cols: number;
  rows: number;
  /** Row-major terrain kind per tile; index = row * cols + col. */
  tiles: Uint8Array;
  /** Convenience: terrain kind at (col,row), Plains if out of range. */
  at(col: number, row: number): BTerrain;
  /** True if a unit may STAND on (col,row) (everything except deep River). */
  passable(col: number, row: number): boolean;
  /** Movement points consumed to ENTER (col,row). River returns Infinity. */
  moveCost(col: number, row: number): number;
  /**
   * The terrain NAME string to hand to combat.ts terrain helpers for a tile.
   * Matches the "Teren" substrings in data/terrain-combat.json so
   * terrainDefenseMultiplier / terrainRiverAttackMultiplier resolve correctly.
   * Plains/rocks map to the open-ground row (no defence bonus).
   */
  combatTerrainName(col: number, row: number): string;
}

// ---------------------------------------------------------------------------
// Seeded PRNG (xmur3 hash -> mulberry32 stream). Deterministic, no globals.
// ---------------------------------------------------------------------------

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build a seeded float[0,1) generator from a string seed. */
function makeRng(seed: string): () => number {
  const s = xmur3(seed);
  return mulberry32(s());
}

// ---------------------------------------------------------------------------
// Movement-cost table (mirrors data/terrain-movement.json intent for the
// battle grid; kept here so the helper is self-contained and combat.ts /
// data files stay read-only). River = impassable wall; Ford = costly crossing.
// ---------------------------------------------------------------------------

const MOVE_COST: Record<number, number> = {
  [BTerrain.Plains]: 1,
  [BTerrain.Forest]: 2, // 1 + forestExtra
  [BTerrain.Hills]:  2,
  [BTerrain.River]:  Infinity, // deep water: cannot enter
  [BTerrain.Ford]:   3, // wade across -- slow
  [BTerrain.Rocks]:  2,
  [BTerrain.Wall]:   Infinity, // wall body: impassable (units walk on walkway above, not through)
  [BTerrain.Gate]:   Infinity, // gate: impassable until breached (battleScene overrides after gateOpen)
};

// Terrain NAME strings whose substrings match data/terrain-combat.json "Teren".
const COMBAT_NAME: Record<number, string> = {
  [BTerrain.Plains]: 'Plaskie (rownina/laka)',
  [BTerrain.Forest]: 'Las',
  [BTerrain.Hills]:  'Wzgorza',
  [BTerrain.River]:  'Rzeka',
  [BTerrain.Ford]:   'Rzeka',
  [BTerrain.Rocks]:  'Plaskie (rownina/laka)',
  [BTerrain.Wall]:   'Plaskie (rownina/laka)', // wall walkway: treated as open ground for combat
  [BTerrain.Gate]:   'Plaskie (rownina/laka)', // gate column: open ground for combat once breached
};

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

export interface GenerateOpts {
  cols: number;
  rows: number;
  seed?: string;
  /**
   * Columns at each end kept as clean PLAINS for deployment (no terrain spawns
   * there) so both armies have open passable ground to line up on.
   */
  deployMargin?: number;
}

/**
 * Generate a deterministic battle terrain map.
 *
 * DENSITY (B9 "za lyso" fix): the field is now richly terraformed, not bare --
 * comparable to the world map. Layout philosophy:
 *   - A MAIN winding RIVER runs top-to-bottom through the central band (the
 *     no-man's-land), 1-2 tiles wide, plus a shorter TRIBUTARY branch that peels
 *     off toward one flank. BOTH get FORD gaps so units always have crossings.
 *   - MANY FOREST clusters scatter across the WHOLE field (both halves), not
 *     just the flanks, with a couple of larger woods.
 *   - MANY HILL clusters form raised strongpoints across the field.
 *   - A generous scatter of ROCK accents on the open ground.
 *   - The outer `deployMargin` columns on each side stay PLAINS for deployment;
 *     battleScene additionally clears the exact rank bands and guarantees a
 *     passable clash corridor, so denser terrain never makes the battle
 *     unplayable.
 */
export function generateBattleTerrain(opts: GenerateOpts): BattleTerrainMap {
  const cols = Math.max(4, Math.floor(opts.cols));
  const rows = Math.max(4, Math.floor(opts.rows));
  const seed = opts.seed ?? 'battle';
  const deployMargin = Math.max(0, opts.deployMargin ?? Math.round(cols * 0.18));

  const rng = makeRng(seed + ':' + cols + 'x' + rows);
  const tiles = new Uint8Array(cols * rows); // 0 = Plains everywhere to start
  const idx = (c: number, r: number) => r * cols + c;
  const inDeploy = (c: number) => c < deployMargin || c >= cols - deployMargin;

  // The river is confined to the central band so deployment columns stay dry.
  const midCol = Math.floor(cols / 2);
  const riverLo = deployMargin + 2;
  const riverHi = cols - deployMargin - 3;

  // --- 1) MAIN RIVER: a winding 1-2 wide vertical strip through the centre. ---
  const meander = Math.max(2, Math.round(cols * 0.10)); // how far it wiggles
  let riverCol = midCol + (Math.floor(rng() * (meander + 1)) - Math.floor(meander / 2));
  const riverColForRow: number[] = new Array(rows);
  for (let r = 0; r < rows; r++) {
    // Random walk, clamped to stay in the central band (never into deploy zones).
    const drift = Math.floor(rng() * 3) - 1; // -1, 0, +1
    riverCol += drift;
    if (riverCol < riverLo) riverCol = riverLo;
    if (riverCol > riverHi) riverCol = riverHi;
    riverColForRow[r] = riverCol;
    tiles[idx(riverCol, r)] = BTerrain.River;
    // Wider river: frequently 2 tiles across for a broader channel.
    if (rng() < 0.45 && riverCol + 1 <= riverHi) tiles[idx(riverCol + 1, r)] = BTerrain.River;
  }

  // --- 1b) TRIBUTARY: a shorter branch that peels off the main river toward a
  // flank over the middle rows, adding a second water feature to cross. ---
  const tribRowLo = Math.floor(rows * 0.30);
  const tribRowHi = Math.floor(rows * 0.70);
  const tribDir = rng() < 0.5 ? -1 : 1; // toward -X or +X flank
  let tribCol = riverColForRow[Math.floor((tribRowLo + tribRowHi) / 2)] ?? midCol;
  for (let r = tribRowLo; r <= tribRowHi && r < rows; r++) {
    // Step diagonally toward the chosen flank, with a little wobble.
    tribCol += tribDir * (rng() < 0.7 ? 1 : 0);
    const lo = deployMargin + 1;
    const hi = cols - deployMargin - 2;
    if (tribCol < lo) tribCol = lo;
    if (tribCol > hi) tribCol = hi;
    if (!inDeploy(tribCol)) tiles[idx(tribCol, r)] = BTerrain.River;
  }

  // --- 2) FORDS: several rows whose river tile(s) become Ford crossings. The
  // main river gets multiple fords (biased to the centre so centred armies can
  // cross), guaranteeing the river never fully walls the field. ---
  const fordCount = Math.max(3, Math.round(rows / 6)); // many more crossings
  const fordRows = new Set<number>();
  let guard = 0;
  while (fordRows.size < fordCount && guard++ < rows * 6) {
    // bias fords toward the vertical middle so they are usable by centred armies
    const rr = Math.floor((0.18 + rng() * 0.64) * rows);
    if (rr > 0 && rr < rows - 1) fordRows.add(rr);
  }
  // Always include the exact centre row as a guaranteed central crossing.
  fordRows.add(Math.floor((rows - 1) / 2));
  for (const r of fordRows) {
    for (let c = 0; c < cols; c++) {
      if (tiles[idx(c, r)] === BTerrain.River) tiles[idx(c, r)] = BTerrain.Ford;
    }
  }

  // --- helper: stamp a roughly circular blob of a terrain kind. ---
  const stampBlob = (cc: number, cr: number, radius: number, kind: BTerrain) => {
    const rad2 = radius * radius;
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const c = cc + dc, r = cr + dr;
        if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
        if (inDeploy(c)) continue; // keep deployment ground clean
        if (dc * dc + dr * dr > rad2) continue;
        // soft edge: skip ~25% of fringe tiles for an organic outline
        if (dc * dc + dr * dr > rad2 * 0.55 && rng() < 0.35) continue;
        const i = idx(c, r);
        if (tiles[i] === BTerrain.River || tiles[i] === BTerrain.Ford) continue; // never overwrite water
        tiles[i] = kind;
      }
    }
  };

  // The terraformable interior (between the deploy margins), used to spread
  // clusters across the WHOLE field rather than only hugging the river.
  const interiorLo = deployMargin;
  const interiorSpan = Math.max(1, cols - 2 * deployMargin);
  const randInteriorCol = () => interiorLo + Math.floor(rng() * interiorSpan);

  // --- 3) FOREST clusters: many woods scattered across the whole field, with a
  // couple of larger stands. Density scales with field area. ---
  const fieldArea = cols * rows;
  const forestBlobs = Math.max(6, Math.round(fieldArea / 90)); // ~10-11 on 34x28
  for (let b = 0; b < forestBlobs; b++) {
    const cr = 1 + Math.floor(rng() * (rows - 2));
    const cc = randInteriorCol();
    // Mostly radius 1-2, with the occasional larger wood (radius 3).
    const radius = rng() < 0.22 ? 3 : 1 + Math.floor(rng() * 2);
    stampBlob(cc, cr, radius, BTerrain.Forest);
  }

  // --- 4) HILLS clusters: raised strongpoints across the field. ---
  const hillBlobs = Math.max(5, Math.round(fieldArea / 120)); // ~8 on 34x28
  for (let b = 0; b < hillBlobs; b++) {
    const cr = 1 + Math.floor(rng() * (rows - 2));
    const cc = randInteriorCol();
    const radius = rng() < 0.20 ? 3 : 1 + Math.floor(rng() * 2);
    stampBlob(cc, cr, radius, BTerrain.Hills);
  }

  // --- 5) ROCK accents: a generous scatter of single tiles on open ground. ---
  const rockCount = Math.max(8, Math.round(fieldArea / 60)); // ~16 on 34x28
  for (let k = 0; k < rockCount; k++) {
    const c = randInteriorCol();
    const r = Math.floor(rng() * rows);
    if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
    if (inDeploy(c)) continue;
    const i = idx(c, r);
    if (tiles[i] === BTerrain.Plains) tiles[i] = BTerrain.Rocks;
  }

  const at = (c: number, r: number): BTerrain => {
    if (c < 0 || c >= cols || r < 0 || r >= rows) return BTerrain.Plains;
    return tiles[idx(c, r)] as BTerrain;
  };

  return {
    cols,
    rows,
    tiles,
    at,
    passable: (c, r) => {
      const t = at(c, r);
      return t !== BTerrain.River && t !== BTerrain.Wall && t !== BTerrain.Gate;
    },
    moveCost: (c, r) => MOVE_COST[at(c, r)] ?? 1,
    combatTerrainName: (c, r) => COMBAT_NAME[at(c, r)] ?? 'Plaskie (rownina/laka)',
  };
}

/** Small deterministic per-tile jitter in [0,1) for decoration placement. */
export function tileJitter(col: number, row: number, salt: number): number {
  // mulberry32 seeded from a hash of (col,row,salt) -- stable per tile.
  let a = (Math.imul(col + 1, 374761393) ^ Math.imul(row + 1, 668265263) ^ Math.imul(salt + 1, 2246822519)) >>> 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
