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
 * WORLD-TERRAIN PRESETS: the battle grid can optionally be shaped to echo the
 * WORLD hex the fight is happening on (see `TerrainPreset` / `presetForWorldTerrain`
 * below) -- e.g. a fight on a world "Gory" hex gets a rockier, hillier field
 * than one on a "Rownina" hex. `opts.preset` is OPTIONAL: omit it (as every
 * caller did before this feature) and generation is BIT-FOR-BIT identical to
 * before -- no regression for existing playtests/smoke tests.
 *
 * ASCII-only source file.
 */

// ---------------------------------------------------------------------------
// Terrain kinds
// ---------------------------------------------------------------------------

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

/** Pick `count` rows spread evenly across [1, rows-2] (one per equal band). */
function pickSpreadRows(rng: () => number, rows: number, count: number): number[] {
  const n = Math.max(1, Math.min(count, Math.max(1, rows - 2)));
  const out: number[] = [];
  for (let k = 0; k < n; k++) {
    const loFrac = k / n;
    const hiFrac = (k + 1) / n;
    const rr = Math.floor((loFrac + (hiFrac - loFrac) * rng()) * rows);
    out.push(Math.max(1, Math.min(rows - 2, rr)));
  }
  return out;
}

/** Pick a column uniformly at random from a set of inclusive [lo,hi] ranges,
 *  weighted by each range's width. Ranges with hi<lo are ignored. */
function pickFromRanges(rng: () => number, ranges: ReadonlyArray<readonly [number, number]>): number {
  const valid = ranges.filter(([lo, hi]) => hi >= lo);
  if (valid.length === 0) return 0;
  const total = valid.reduce((s, [lo, hi]) => s + (hi - lo + 1), 0);
  let t = rng() * total;
  for (const [lo, hi] of valid) {
    const w = hi - lo + 1;
    if (t < w) return lo + Math.floor(t);
    t -= w;
  }
  const last = valid[valid.length - 1]!;
  return last[1];
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
// World-terrain presets: shape the battle grid to echo the world hex the
// fight is happening on. See presetForWorldTerrain() below for the mapping.
// ---------------------------------------------------------------------------

/** River generation strategy for a preset. */
export type RiverMode =
  | 'winding' // today's default: a meandering ~1-2 wide strip + tributary + several fords
  | 'none'    // no river at all
  | 'wide'    // a straight-ish band ~30% of field width, with 2-3 full-width fords
  | 'coast';  // a water strip along ONE edge (top or bottom), no fords needed

/**
 * Generation knobs derived from the world hex under the battle. All
 * multipliers are relative to today's baseline formulas (1 = unchanged).
 * `preset` is optional on GenerateOpts -- omitting it reproduces EXACTLY the
 * pre-existing generation (riverMode 'winding', all multipliers 1).
 */
export interface TerrainPreset {
  forestBlobsMul: number;
  hillBlobsMul: number;
  rockCountMul: number;
  /** Extra radius added to the hill-blob size roll (0 = unchanged; "masywy" for Gory). */
  hillRadiusBoost: number;
  riverMode: RiverMode;
  /** Ford count for 'winding'/'wide' modes; undefined = today's formula. */
  fordCount?: number;
  /**
   * [min,max] SMALL OVAL PONDS (2-4 tiles across, deep River water) scattered
   * on the FLANK column ranges that survive battleScene's deploy-rank carve
   * (owner 2026-07-22 #4: the accidental "torn river ponds" look of the
   * failed wide-river iteration was liked -- "zostawic dla innych terenow,
   * np. laki czy rowniny" -- so Laka/Rownina now get it deliberately).
   * Undefined (every other preset + DEFAULT_PRESET) = no ponds and NO extra
   * rng consumption, keeping those streams untouched.
   */
  lakeCount?: readonly [number, number];
  /** Extra Rocks scattered near the field's outer edges (Wzgorza/Gory "ring"). */
  edgeRocks: boolean;
  /** Hard-zero forest (Pustynia: "ZERO drzew"). */
  noForest: boolean;
  /** battleScene swaps the floor/hill/grass palette for sand tones when true. */
  desertPalette: boolean;
  /**
   * true (Wzgorza/Gory/Pustynia) => generate HILLS as irregular, curved
   * CHAINS of overlapping variable-radius blobs (a wandering ridge/dune line)
   * plus a minority of solitary hillocks scattered across the WHOLE interior,
   * instead of independent single blobs -- reads as a natural mountain/dune
   * range, not scattered dots or (the earlier, owner-rejected 2026-07-22 #3
   * version of this flag) a column concentrated into battleScene's old wide
   * deploy-lane carve, which read as a straight rectangular bar. false
   * (DEFAULT_PRESET, Laka's few gentle hills) => the plain independent-blob
   * whole-interior scatter, byte-for-byte unchanged from before this feature.
   * Edge rocks (see `edgeRocks` below) still use `GenerateOpts.safeCols` for
   * their own, separate flank concentration -- unrelated to this flag.
   */
  biasSafeCols: boolean;
  /**
   * true ONLY for the world "Gory" (mountains) preset -- distinguishes a
   * Gory battlefield from a Wzgorza (hills) one even though both generate
   * the SAME BTerrain.Hills tile kind. combatTerrainName() reads this to
   * report 'Gory' instead of 'Wzgorza' for Hills tiles (C-TEREN-Q1 ETAP 1:
   * without this, every tactical battle on a world Gory hex silently fed
   * combat.ts's terrainDefenseMultiplier the 'Wzgorza' name and got +50%
   * Obrona instead of the promised +75%). Also gates the ETAP 3 cavalry/
   * chariot Gory impassability rule (see moveCostFor/passableFor below).
   * false for every other preset (incl. DEFAULT_PRESET) -- legacy/no-
   * worldTerrain battles are unaffected.
   */
  isMountain: boolean;
}

/** The exact behaviour of every caller before this feature existed. */
export const DEFAULT_PRESET: TerrainPreset = {
  forestBlobsMul: 1,
  hillBlobsMul: 1,
  rockCountMul: 1,
  hillRadiusBoost: 0,
  riverMode: 'winding',
  edgeRocks: false,
  noForest: false,
  desertPalette: false,
  biasSafeCols: false,
  isMountain: false,
};

/**
 * The world hex info a battle preset is derived from. Deliberately a loose
 * shape (not importing types/hex.ts's TerenBazowy) so this module stays
 * standalone/testable -- callers pass hex.terenBazowy as a plain string.
 */
export interface WorldTerrainInput {
  /** TerenBazowy value, case-insensitive ('laka','rownina','wzgorza','gory','pustynia','wybrzeze', ...). */
  baza: string;
  /** Nakladka.Las present on the world hex (forest overlay). */
  las?: boolean;
  /** RzekaInfo.obecna on the world hex (river-on-edges overlay). */
  rzeka?: boolean;
}

/**
 * Map a world hex (baza terrain + las/rzeka overlays) to a battle-terrain
 * generation preset. Owner decision (2026-07-22):
 *   Laka     -> dużo łąki, MALO wzgórz, rzeka zawsze (z brodami)
 *   Rownina  -> płasko, MOZE rzeka (tylko gdy hex ją ma), ZERO gór/wzgórz
 *   Wzgorza  -> DUZO wzgórz + skały przy krawędziach
 *   Gory     -> jeszcze więcej skał/masywów (ale nadal grywalne -- River jest
 *               jedynym nieprzejezdnym typem, Hills/Rocks/Forest kosztuja
 *               ruch ale NIGDY nie blokuja _carveBattleBox connectivity guard)
 *   Pustynia -> piaskowa paleta, wydmy (Hills w kolorze piasku), ZERO drzew i rzek
 *   Wybrzeze -> płasko + pas wody wzdłuż JEDNEJ krawędzi (nie przez środek)
 *   Las (nakladka)   -> gęsty las + trochę wzgórz, NIEZALEZNIE od bazy
 *   Rzeka (nakladka) -> szeroka rzeka (~30% szerokości) z 2-3 brodami,
 *                       nadpisuje riverMode bazy (poza Pustynia/Wybrzeze)
 */
export function presetForWorldTerrain(wt?: WorldTerrainInput): TerrainPreset {
  if (!wt) return DEFAULT_PRESET;
  const baza = (wt.baza || '').trim().toLowerCase();

  let p: TerrainPreset;
  switch (baza) {
    case 'laka':
      p = { forestBlobsMul: 1.1, hillBlobsMul: 0.3, rockCountMul: 0.9, hillRadiusBoost: 0,
            riverMode: 'winding', edgeRocks: false, noForest: false, desertPalette: false, biasSafeCols: false,
            isMountain: false, lakeCount: [2, 4] };
      break;
    case 'rownina':
      p = { forestBlobsMul: 0.5, hillBlobsMul: 0, rockCountMul: 0.6, hillRadiusBoost: 0,
            riverMode: wt.rzeka ? 'winding' : 'none', edgeRocks: false, noForest: false, desertPalette: false, biasSafeCols: false,
            isMountain: false, lakeCount: [0, 2] };
      break;
    case 'wzgorza':
      // 2026-07-22 korekta #2 (za mało wyraźne z dystansu): mocno wyższy
      // hillBlobsMul + hillRadiusBoost + biasSafeCols (koncentracja w
      // widocznych pasach -- patrz TerrainPreset.biasSafeCols) + gęstsze
      // edgeRocks, żeby pole czytało się jako "teren pagórkowaty" nie kropki.
      p = { forestBlobsMul: 0.7, hillBlobsMul: 3.5, rockCountMul: 1.8, hillRadiusBoost: 1,
            riverMode: wt.rzeka ? 'winding' : 'none', edgeRocks: true, noForest: false, desertPalette: false, biasSafeCols: true,
            isMountain: false };
      break;
    case 'gory':
      // proporcjonalnie mocniej niz Wzgorza (owner ask 2026-07-22 #2).
      // isMountain=true (C-TEREN-Q1 ETAP 1/3): the ONLY preset whose Hills
      // tiles report combat name 'Gory' (+75% Obrona, not Wzgorza's +50%)
      // and block cavalry/chariot movement.
      p = { forestBlobsMul: 0.4, hillBlobsMul: 5.0, rockCountMul: 2.6, hillRadiusBoost: 2,
            riverMode: wt.rzeka ? 'winding' : 'none', edgeRocks: true, noForest: false, desertPalette: false, biasSafeCols: true,
            isMountain: true };
      break;
    case 'pustynia':
      p = { forestBlobsMul: 0, hillBlobsMul: 1.3, rockCountMul: 1.4, hillRadiusBoost: 0,
            riverMode: 'none', edgeRocks: false, noForest: true, desertPalette: true, biasSafeCols: true,
            isMountain: false };
      break;
    case 'wybrzeze':
      p = { forestBlobsMul: 0.4, hillBlobsMul: 0, rockCountMul: 0.7, hillRadiusBoost: 0,
            riverMode: 'coast', edgeRocks: false, noForest: false, desertPalette: false, biasSafeCols: false,
            isMountain: false };
      break;
    default:
      p = { ...DEFAULT_PRESET };
  }

  // Las overlay: dense forest + a bit of hills, layered on TOP of whatever
  // baza matched above (independent of it).
  if (wt.las && !p.noForest) {
    p = {
      ...p,
      forestBlobsMul: Math.max(p.forestBlobsMul, 1) * 2.2,
      hillBlobsMul: Math.max(p.hillBlobsMul, 0.4),
    };
  }

  // Rzeka overlay: forces a wide, multi-ford crossing regardless of baza's
  // own river default -- EXCEPT Pustynia (zero rivers, always) and Wybrzeze
  // (already has its own single-edge water feature).
  if (wt.rzeka && !p.noForest && baza !== 'wybrzeze') {
    // lakeCount dropped on purpose: the wide-river preset must have NO water
    // besides the single continuous S-channel (owner 2026-07-22 #4 -- "zadnych
    // odseparowanych plam wody"), so a baza's ponds (Rownina/Laka) are removed.
    p = { ...p, riverMode: 'wide', fordCount: p.fordCount ?? 3, lakeCount: undefined };
  }

  return p;
}

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
  /**
   * Rows kept outside the playable zone at top+bottom (mirrors battleScene's
   * PLAY_ROW0 camera-scroll margin, which _fencePlayableZone always converts
   * to River regardless of what this generator draws there). Only consulted
   * by the 'coast' river preset so its water strip lands INSIDE the visible
   * playable zone instead of the already-watered dead margin. Defaults to 0.
   */
  rowMargin?: number;
  /**
   * Column ranges [loInclusive, hiInclusive] that will remain visible AFTER
   * battleScene's _carveBattleBox deployment-lane clearing (see
   * battleScene.ts `battleSafeCols()`). Only consulted by `preset.edgeRocks`
   * (flank rock concentration) and `preset.lakeCount` (flank pond placement)
   * -- hills (`preset.biasSafeCols`) and the wide river
   * (`preset.riverMode==='wide'`) generate organically across the whole
   * interior since the 2026-07-22 #3 meander correction and no longer read
   * this. DEFAULT_PRESET never reads it either, so passing it alongside the
   * default preset is a no-op (safe to always pass from battleScene).
   */
  safeCols?: ReadonlyArray<readonly [number, number]>;
  /** World-terrain-derived generation preset. Omit for the pre-existing default. */
  preset?: TerrainPreset;
}

/**
 * Generate a deterministic battle terrain map.
 *
 * DENSITY (B9 "za lyso" fix): the field is now richly terraformed, not bare --
 * comparable to the world map. Layout philosophy:
 *   - A MAIN winding RIVER runs top-to-bottom through the central band (the
 *     no-man's-land), 1-2 tiles wide, plus a shorter TRIBUTARY branch that peels
 *     off toward one flank. BOTH get FORD gaps so units always have crossings.
 *     (This is the 'winding' preset -- see TerrainPreset.riverMode for the
 *     'none'/'wide'/'coast' alternatives driven by the world hex.)
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
  const rowMargin = Math.max(0, Math.floor(opts.rowMargin ?? 0));
  const preset = opts.preset ?? DEFAULT_PRESET;

  const rng = makeRng(seed + ':' + cols + 'x' + rows);
  const tiles = new Uint8Array(cols * rows); // 0 = Plains everywhere to start
  const idx = (c: number, r: number) => r * cols + c;
  const inDeploy = (c: number) => c < deployMargin || c >= cols - deployMargin;

  // The river is confined to the central band so deployment columns stay dry.
  const midCol = Math.floor(cols / 2);
  const riverLo = deployMargin + 2;
  const riverHi = cols - deployMargin - 3;

  // The terraformable interior (between the deploy margins), used to spread
  // clusters across the WHOLE field rather than only hugging the river. Moved
  // above the river block so 'wide' river generation can also use it.
  const interiorLo = deployMargin;
  const interiorSpan = Math.max(1, cols - 2 * deployMargin);
  const randInteriorCol = () => interiorLo + Math.floor(rng() * interiorSpan);

  // safeCols: column ranges that survive battleScene's post-generation
  // deploy-lane carve (see GenerateOpts.safeCols doc). Only ever consulted
  // by branches gated on an explicit preset flag (riverMode/biasSafeCols/
  // edgeRocks), all false on DEFAULT_PRESET -- so its mere presence never
  // perturbs the legacy RNG stream.
  const safeCols = opts.safeCols && opts.safeCols.length > 0 ? opts.safeCols : undefined;

  if (preset.riverMode === 'winding') {
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
    const fordCount = preset.fordCount ?? Math.max(3, Math.round(rows / 6)); // many more crossings
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
  } else if (preset.riverMode === 'wide') {
    // --- RZEKA overlay: ONE CONTINUOUS S-SHAPED CHANNEL (owner spec
    // 2026-07-22 #4, verbatim: "Rzeka musi miec kontynuacje przez cala
    // odleglosc [...] w ksztalcie litery S i jest ciagla, ale nie rowna i
    // zmeandrowana"). The previous iteration's channel got chopped into
    // disconnected ponds by battleScene's deploy-rank carve; the fix is
    // two-sided: (a) here, a channel whose water body is provably 4-connected
    // (centre step clamped to +/-2 per row, every row's span overlaps the
    // previous row's span by >=1 column, width never below 3), and (b) in
    // battleScene._carveBattleBox, preset battles now DOWNGRADE River under
    // the deploy rank bands to FORD (still water, passable) instead of
    // erasing it to Plains -- so the channel is never interrupted anywhere.
    //
    // Shape: the centre column follows a gentle sine -- 2-3 "zakola" (half-
    // periods) across the PLAYABLE rows (rowMargin..rows-1-rowMargin), so the
    // visible field shows a full S (2 bends) or an S plus one extra curl (3).
    // Amplitude ~25-30% of the central band (owner: 25-35% of the interior).
    // Per-row deterministic tileJitter roughs up the centre (+/-1) and EACH
    // BANK independently (+/-1) so the edges are ragged, while the width
    // itself breathes 3-6 tiles on a slower wave. Continuity is re-enforced
    // explicitly afterwards, so no amount of jitter can tear the channel.
    const availSpan = Math.max(6, riverHi - riverLo + 1);
    const amplitude = Math.max(4, Math.round(availSpan * 0.25));
    const centreBase = riverLo + Math.floor(availSpan / 2);
    const playRows = Math.max(8, rows - 2 * rowMargin);
    const zakola = 2 + Math.floor(rng() * 2); // 2-3 gentle bends over the visible field
    const wavelength = Math.max(24, Math.round((2 * playRows) / zakola));
    const phase = rng() * Math.PI * 2;
    let prevCentre = centreBase;
    let prevC0 = -1, prevC1 = -1;
    for (let r = 0; r < rows; r++) {
      const sine = Math.sin(((r - rowMargin) / wavelength) * Math.PI * 2 + phase);
      const cJit = (tileJitter(r, 0, 811) - 0.5) * 2; // [-1,1] wobble off the pure sinusoid
      let centre = Math.round(centreBase + sine * amplitude + cJit * 1.2);
      // Row-to-row step clamp: the channel centre wanders at most +/-2
      // columns per row (owner spec: bank continuity, no sideways teleports).
      if (centre > prevCentre + 2) centre = prevCentre + 2;
      else if (centre < prevCentre - 2) centre = prevCentre - 2;
      if (centre < riverLo) centre = riverLo;
      if (centre > riverHi) centre = riverHi;
      prevCentre = centre;
      // Width breathes 3-6 on a slower, phase-shifted wave + per-row jitter.
      const wSine = Math.sin(((r - rowMargin) / (wavelength * 0.47)) * Math.PI * 2 + phase * 1.7);
      const wJit = (tileJitter(r, 1, 812) - 0.5) * 1.6;
      const width = Math.max(3, Math.min(6, Math.round(4.5 + wSine * 1.3 + wJit)));
      let c0 = centre - (width >> 1);
      let c1 = c0 + width - 1;
      // Ragged banks: independent +/-1 jitter per bank (owner: "brzegi
      // nierowne, jitter +/-1 kafla").
      const j0 = tileJitter(r, 2, 813);
      const j1 = tileJitter(r, 3, 814);
      c0 += j0 < 0.33 ? -1 : j0 > 0.66 ? 1 : 0;
      c1 += j1 < 0.33 ? -1 : j1 > 0.66 ? 1 : 0;
      if (c1 - c0 < 2) { c0 = centre - 1; c1 = centre + 1; } // never thinner than 3
      // Keep inside the central band (deploy margins stay dry), preserving width.
      if (c0 < riverLo) { c1 += riverLo - c0; c0 = riverLo; }
      if (c1 > riverHi) { c0 -= c1 - riverHi; c1 = riverHi; }
      c0 = Math.max(riverLo, c0);
      c1 = Math.min(riverHi, c1);
      // HARD continuity guarantee: this row's span must overlap the previous
      // row's span by >=1 column (4-neighbourhood connectivity of the water
      // body), whatever the jitter/clamps did. Widening toward the previous
      // span stays inside [riverLo,riverHi] because that span was inside too.
      if (prevC0 >= 0) {
        if (c0 > prevC1) c0 = prevC1;
        if (c1 < prevC0) c1 = prevC0;
      }
      for (let c = c0; c <= c1; c++) tiles[idx(c, r)] = BTerrain.River;
      prevC0 = c0; prevC1 = c1;
    }

    // Fords: 2-3 crossings (owner spec) at the channel's NATURAL narrow
    // points -- seed rows spread evenly across the PLAYABLE rows (so no
    // crossing is wasted inside the fenced camera margin), each snapped to
    // the narrowest row in a small window, then converted to Ford in a band
    // 2-3 rows deep (the owner's "szer. 2-3 kafle"). The ford spans the full
    // channel width there -- it must, to be crossable.
    const fordCount = preset.fordCount ?? (2 + Math.floor(rng() * 2)); // 2-3
    const playR0 = Math.min(rows - 2, rowMargin + 2);
    const playR1 = Math.max(playR0, rows - 3 - rowMargin);
    const fordBand = (playR1 - playR0 + 1) / fordCount;
    for (let k = 0; k < fordCount; k++) {
      const r0 = playR0 + Math.floor(fordBand * (k + 0.2 + rng() * 0.6));
      let bestR = r0, bestCount = Infinity;
      for (let dr = -5; dr <= 5; dr++) {
        const rr = Math.max(playR0, Math.min(playR1, r0 + dr));
        let cnt = 0;
        for (let c = 0; c < cols; c++) if (tiles[idx(c, rr)] === BTerrain.River) cnt++;
        if (cnt > 0 && cnt < bestCount) { bestCount = cnt; bestR = rr; }
      }
      const depth = 2 + (rng() < 0.5 ? 0 : 1); // 2-3 rows deep
      for (let dr = 0; dr < depth; dr++) {
        const r = Math.min(playR1, bestR + dr);
        for (let c = 0; c < cols; c++) {
          if (tiles[idx(c, r)] === BTerrain.River) tiles[idx(c, r)] = BTerrain.Ford;
        }
      }
    }
  } else if (preset.riverMode === 'coast') {
    // --- WYBRZEZE: a water strip along ONE edge (top or bottom row band),
    // spanning the FULL width. Placed just inside the playable zone (using
    // rowMargin) so it's visible during play, not hidden in the always-watered
    // camera-scroll margin. No fords -- it's a coastline, not a crossing. ---
    const rowLo = Math.min(rows - 1, rowMargin);
    const rowHi = Math.max(rowLo, rows - 1 - rowMargin);
    const stripRows = Math.max(3, Math.round((rowHi - rowLo + 1) * 0.14));
    const north = rng() < 0.5;
    const r0 = north ? rowLo : Math.max(rowLo, rowHi - stripRows + 1);
    const r1 = north ? Math.min(rowHi, rowLo + stripRows - 1) : rowHi;
    for (let r = r0; r <= r1; r++) {
      for (let c = 0; c < cols; c++) tiles[idx(c, r)] = BTerrain.River;
    }
  }
  // preset.riverMode === 'none' -> no water tiles at all (ROWNINA/PUSTYNIA default).

  // --- LAKES (Laka 2-4 / Rownina 0-2, owner 2026-07-22 #4): small OVAL PONDS
  // of deep River water, 2-4 tiles across, scattered on the FLANK column
  // ranges that survive battleScene's deploy-rank carve -- so they never sit
  // under a formation (the carve would turn them into odd ford-puddles), never
  // land in the clash corridor, and being tiny local blobs on the flanks they
  // can never wall attacker from defender (the _carveBattleBox BFS guard stays
  // as the hard net regardless). Gated on preset.lakeCount, so every preset
  // without ponds (incl. DEFAULT_PRESET -> legacy) consumes NO extra rng. ---
  if (preset.lakeCount) {
    const [lakeLoN, lakeHiN] = preset.lakeCount;
    const nLakes = lakeLoN + Math.floor(rng() * (lakeHiN - lakeLoN + 1));
    const flankRanges: ReadonlyArray<readonly [number, number]> =
      safeCols && safeCols.length >= 2
        ? [safeCols[0]!, safeCols[safeCols.length - 1]!]
        : [[interiorLo, interiorLo + interiorSpan - 1]];
    const lakeR0 = Math.min(rows - 3, rowMargin + 2);
    const lakeR1 = Math.max(lakeR0, rows - 3 - rowMargin);
    for (let k = 0; k < nLakes; k++) {
      const cc = pickFromRanges(rng, flankRanges);
      const cr = lakeR0 + Math.floor(rng() * (lakeR1 - lakeR0 + 1));
      const rx = 1 + (rng() < 0.4 ? 1 : 0); // ellipse radii 1-2 => ponds 2-4 tiles across
      const ry = 1 + (rng() < 0.4 ? 1 : 0);
      for (let dr = -ry; dr <= ry; dr++) {
        for (let dc = -rx; dc <= rx; dc++) {
          const c = cc + dc, r = cr + dr;
          if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
          if (inDeploy(c)) continue;
          const norm = (dc * dc) / (rx * rx + 0.3) + (dr * dr) / (ry * ry + 0.3);
          if (norm > 1) continue;
          // ragged fringe (deterministic per tile) for an organic pond outline
          if (norm > 0.5 && tileJitter(c, r, 815) < 0.35) continue;
          tiles[idx(c, r)] = BTerrain.River;
        }
      }
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

  // --- 3) FOREST clusters: many woods scattered across the whole field, with a
  // couple of larger stands. Density scales with field area (and the preset's
  // forestBlobsMul -- Pustynia forces 0 via noForest). ---
  const fieldArea = cols * rows;
  const forestBlobs = preset.noForest
    ? 0
    : Math.round(Math.max(6, Math.round(fieldArea / 70)) * preset.forestBlobsMul); // ~13-14 on 34x28 baseline
  for (let b = 0; b < forestBlobs; b++) {
    const cr = 1 + Math.floor(rng() * (rows - 2));
    const cc = randInteriorCol();
    // Mostly radius 1-2, with the occasional larger wood (radius 3).
    const radius = rng() < 0.22 ? 3 : 1 + Math.floor(rng() * 2);
    stampBlob(cc, cr, radius, BTerrain.Forest);
  }

  // --- 4) HILLS: raised strongpoints across the field. hillRadiusBoost (Gory)
  // grows blobs into bigger "masywy" without touching passability -- Hills
  // always cost 2 to enter, never Infinity, so density alone never blocks a
  // crossing (only River/Wall/Gate do; see BattleScene._carveBattleBox).
  //
  // biasSafeCols (Wzgorza/Gory/Pustynia) now selects an IRREGULAR CHAIN
  // generator instead of the old safeCols column-concentration (owner
  // correction 2026-07-22 #3: "wzgorza MEANDRUJACE/NIEROWNOMIERNE, a nie
  // pasek-linia" -- concentrating blob centres into the 3 narrow columns
  // that survived _carveBattleBox's old wide carve read as straight
  // rectangular bars). _carveBattleBox now only lightly clears the deploy
  // lanes for preset battles (see battleScene.ts), so hills have the WHOLE
  // interior to occupy again -- no column bias is needed to stay visible.
  // Each CHAIN is a short random-walk of overlapping blobs (curved
  // "pasmo"/ridge, not a straight line): the walk steps mostly along the rank
  // axis with a wandering column drift so it snakes instead of running
  // parallel to the front. A minority of the budget is spent on solitary
  // hillocks scattered anywhere in the interior ("trochę pojedynczych
  // pagórków rozrzuconych po polu", owner spec). Other presets (Laka's few
  // gentle hills, DEFAULT_PRESET) keep the original plain independent-blob
  // scatter unchanged -- this is what LEGACY (no worldTerrain) always used,
  // since biasSafeCols is false there, so legacy stays bit-for-bit. ---
  const hillBlobs = Math.round(Math.max(5, Math.round(fieldArea / 100)) * preset.hillBlobsMul); // ~10 on 34x28 baseline
  if (preset.biasSafeCols) {
    const loneCount = Math.round(hillBlobs * 0.25);
    const chainBudget = hillBlobs - loneCount;
    const chainCount = Math.max(1, Math.min(5, Math.round(chainBudget / 3)));
    let placed = 0;
    for (let ch = 0; ch < chainCount && placed < chainBudget; ch++) {
      let cc = randInteriorCol();
      let cr = 1 + Math.floor(rng() * (rows - 2));
      const colDrift = rng() < 0.5 ? -1 : 1; // overall lean of this chain, left or right
      const links = Math.min(2 + Math.floor(rng() * 4), chainBudget - placed); // 2-5 links per chain
      for (let li = 0; li < links; li++) {
        const radius = (rng() < 0.25 ? 3 : 1 + Math.floor(rng() * 2)) + preset.hillRadiusBoost;
        stampBlob(cc, cr, radius, BTerrain.Hills);
        placed++;
        // Step to the next link: mostly along the rank axis, wandering in
        // columns (not a fixed direction) so the ridge curves.
        cr += Math.round(rows * 0.10) + Math.floor(rng() * 3) - 1;
        cc += colDrift * (rng() < 0.6 ? 1 : 0) + (Math.floor(rng() * 3) - 1);
        cc = Math.max(interiorLo, Math.min(interiorLo + interiorSpan - 1, cc));
        cr = Math.max(1, Math.min(rows - 2, cr));
      }
    }
    for (let k = placed; k < hillBlobs; k++) {
      const cr = 1 + Math.floor(rng() * (rows - 2));
      const cc = randInteriorCol();
      const radius = 1 + preset.hillRadiusBoost;
      stampBlob(cc, cr, radius, BTerrain.Hills);
    }
  } else {
    for (let b = 0; b < hillBlobs; b++) {
      const cr = 1 + Math.floor(rng() * (rows - 2));
      const cc = randInteriorCol();
      const radius = (rng() < 0.20 ? 3 : 1 + Math.floor(rng() * 2)) + preset.hillRadiusBoost;
      stampBlob(cc, cr, radius, BTerrain.Hills);
    }
  }

  // --- 5) ROCK accents: a generous scatter of single tiles on open ground. ---
  const rockCount = Math.round(Math.max(8, Math.round(fieldArea / 50)) * preset.rockCountMul); // ~19 on 34x28 baseline
  for (let k = 0; k < rockCount; k++) {
    const c = randInteriorCol();
    const r = Math.floor(rng() * rows);
    if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
    if (inDeploy(c)) continue;
    const i = idx(c, r);
    if (tiles[i] === BTerrain.Plains) tiles[i] = BTerrain.Rocks;
  }

  // --- 5b) EDGE ROCKS (Wzgorza/Gory): a DENSE extra scatter so the flanks
  // read as rocky highland MASSES, not scattered single boulders (2026-07-22
  // owner review). Same battleScene deploy-lane-carve problem as hills (see
  // HILL_BIAS_PROB comment above): when safeCols is available we concentrate
  // this entirely into its outermost (flank) ranges -- exactly the columns
  // that (a) survive the carve and (b) sit at the field's edges, matching
  // "skały wokol krawedzi" precisely. Falls back to the old edge-of-interior
  // heuristic when safeCols isn't supplied. ---
  if (preset.edgeRocks) {
    if (safeCols && safeCols.length >= 2) {
      const flankRanges: ReadonlyArray<readonly [number, number]> = [safeCols[0]!, safeCols[safeCols.length - 1]!];
      const edgeRockCount = Math.round(rockCount * 2.2); // dense masses, not dots
      for (let k = 0; k < edgeRockCount; k++) {
        const c = pickFromRanges(rng, flankRanges);
        const r = Math.floor(rng() * rows);
        if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
        if (inDeploy(c)) continue;
        const i = idx(c, r);
        if (tiles[i] === BTerrain.Plains) tiles[i] = BTerrain.Rocks;
      }
    } else {
      const edgeColBand = Math.max(2, Math.round(interiorSpan * 0.16));
      const edgeRockCount = Math.round(rockCount * 0.6);
      for (let k = 0; k < edgeRockCount; k++) {
        const nearLeft = rng() < 0.5;
        const c = nearLeft
          ? interiorLo + Math.floor(rng() * edgeColBand)
          : (cols - deployMargin) - 1 - Math.floor(rng() * edgeColBand);
        const nearTop = rng() < 0.5;
        const rowBand = Math.max(2, Math.round(rows * 0.16));
        const r = nearTop ? Math.floor(rng() * rowBand) : rows - 1 - Math.floor(rng() * rowBand);
        if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
        if (inDeploy(c)) continue;
        const i = idx(c, r);
        if (tiles[i] === BTerrain.Plains) tiles[i] = BTerrain.Rocks;
      }
    }
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
    // C-TEREN-Q1 ETAP 1: on an isMountain (world "Gory") preset, Hills tiles
    // report the 'Gory' combat name instead of 'Wzgorza' so combat.ts's
    // terrainDefenseMultiplier resolves the +75% Gory bonus (not +50%
    // Wzgorza) for a defender standing there. Every other preset (incl.
    // DEFAULT_PRESET / legacy no-worldTerrain battles) keeps 'Wzgorza',
    // byte-for-byte unchanged.
    combatTerrainName: (c, r) => {
      const t = at(c, r);
      if (t === BTerrain.Hills && preset.isMountain) return 'Gory';
      return COMBAT_NAME[t] ?? 'Plaskie (rownina/laka)';
    },
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
