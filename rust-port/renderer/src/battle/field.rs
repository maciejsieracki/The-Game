//! Part 2 of MOD-14 "battle 3D": the **static battlefield** of
//! `battle/battleScene.ts` (web `edb8fb56`) — tile floor, terrain decoration,
//! dark ground plane, playable-zone margins and gold frame
//! (`_buildBattlefield` `:4462-4876`, `_buildPlayableMarginVisuals`
//! `:4879-4962`), siege wall tiles (`_carveWallTiles` `:3849-3888`), the city
//! interior behind the wall (`_buildSiegeInteriorBuildings` `:3987-4117`,
//! `makeGableRoofGeometry` `:1214-1235`), the deploy zone
//! (`_buildDeployZone` `:11568-11679`, `_initDeployGhostLayer`
//! `:15213-15222`, `_appendDeployCellOutline` `:15246-15274`) and the 3D part
//! of the constructor as data: renderer settings, background, fog, lights,
//! camera (`:3304-3366`) and `_applyCamera` (`:9872-9880`).
//!
//! Input is the battle terrain grid as a DTO ([`TerrainGrid`]): the
//! generator + `_carveBattleBox` + `_fencePlayableZone` belong to the battle
//! domain (P6.13, ZAŁOŻENIE Z-36-3); the scene only reads it (and the siege
//! carve writes the wall column, like the web).
//!
//! Output ([`BattleField`]): one [`Scene`] tree whose traverse order equals
//! the web's `scene.traverse` (the siege wall group of `_placeSiegeWall`,
//! part 3, is not placed here). Objects the unified scene type has no node
//! kind for — `InstancedMesh`, lights, `THREE.Line` — are `Object3D`
//! placeholder nodes (transform, flags) with their payload in typed side
//! tables ([`InstancedMesh`], [`Light`], [`OutlineLine`]) keyed by node id.
//! Geometry the scene `Prim`s cannot express (rotated planes, translated
//! cones, the gable roof, polylines) is the minimal [`FieldGeo`] body
//! (dispatch: `geom/**` unchanged).
//!
//! Deterministic like the web: decoration jitter is `tileJitter`
//! (mulberry32 hash of `(col, row, salt)`, `battle-terrain.ts:811-818`), no
//! random numbers; `Math.sin/cos/tan/asin/atan2` go through
//! [`crate::jsmath`]. Verified bit for bit against the web
//! (`tests/battle3d_field.rs`, `tests/fixtures/battle3d/field.json`).

use std::f64::consts::PI;

use crate::geom::{self, Euler, Mat4 as GMat4, Mesh, Quat as GQuat, Vec3 as GVec3};
use crate::jsmath::{js_asin, js_atan2, js_tan};
use crate::pick::raycast::TriGeometry;
use crate::pick::three::{Mat4, Quat, Sphere, Vec3};
use crate::scene::{
    Geo, GeoBody, MatId, Material, MaterialKind, NodeId, NodeKind, Prim, Scene, Side, ROOT,
};
use crate::terrain::color::Color;

use super::siege_wall::js_round;

// ------------------------------------------------------------ constants

/// `BF_COLS` (`battleScene.ts:618`): full field width in tiles.
pub const BF_COLS: i32 = 68;
/// `BF_ROWS` (`:619`).
pub const BF_ROWS: i32 = 156;
/// `PLAYABLE_COLS = Math.round(BF_COLS * Math.SQRT1_2)` (`:622`).
pub const PLAYABLE_COLS: i32 = 48;
/// `PLAYABLE_ROWS = Math.round(BF_ROWS * Math.SQRT1_2)` (`:623`).
pub const PLAYABLE_ROWS: i32 = 110;
/// `PLAY_COL0 = Math.floor((BF_COLS - PLAYABLE_COLS) / 2)` (`:624`).
pub const PLAY_COL0: i32 = (BF_COLS - PLAYABLE_COLS) / 2;
/// `PLAY_ROW0` (`:625`).
pub const PLAY_ROW0: i32 = (BF_ROWS - PLAYABLE_ROWS) / 2;
/// `PLAY_COL1` (`:626`).
pub const PLAY_COL1: i32 = PLAY_COL0 + PLAYABLE_COLS - 1;
/// `PLAY_ROW1` (`:627`).
pub const PLAY_ROW1: i32 = PLAY_ROW0 + PLAYABLE_ROWS - 1;
/// `PLAY_MID_COL = PLAY_COL0 + Math.floor((PLAYABLE_COLS - 1) / 2)` (`:628`).
pub const PLAY_MID_COL: i32 = PLAY_COL0 + (PLAYABLE_COLS - 1) / 2;
/// `PLAY_MID_ROW` (`:629`).
pub const PLAY_MID_ROW: i32 = PLAY_ROW0 + (PLAYABLE_ROWS - 1) / 2;
/// `MAX_PER_SIDE` (`:676`).
pub const MAX_PER_SIDE: i32 = 120;
/// `RANK_WIDTH` (`:681`).
pub const RANK_WIDTH: i32 = 20;
/// `MAX_RANKS = Math.ceil(MAX_PER_SIDE / RANK_WIDTH)` (`:685`).
pub const MAX_RANKS: i32 = (MAX_PER_SIDE + RANK_WIDTH - 1) / RANK_WIDTH;
/// `DEPLOY_MARGIN` (`:690`).
pub const DEPLOY_MARGIN: i32 = 4;
/// `TILE_S` (`:696`): world size of one tile.
pub const TILE_S: f64 = 1.0;
/// `FRONT_GAP` (`:704`).
pub const FRONT_GAP: i32 = 5;
/// `ATK_FRONT_COL = PLAY_COL0 + Math.floor((PLAYABLE_COLS - FRONT_GAP) / 2)` (`:705`).
pub const ATK_FRONT_COL: i32 = PLAY_COL0 + (PLAYABLE_COLS - FRONT_GAP) / 2;
/// `DEF_FRONT_COL` (`:706`).
pub const DEF_FRONT_COL: i32 = ATK_FRONT_COL + FRONT_GAP;
/// `ATK_COL_STEP` (`:707`).
pub const ATK_COL_STEP: i32 = -1;
/// `DEF_COL_STEP` (`:708`).
pub const DEF_COL_STEP: i32 = 1;
/// `DEPLOY_MID_COL = PLAY_MID_COL` (`:774`).
pub const DEPLOY_MID_COL: i32 = PLAY_MID_COL;
/// `DEPLOY_DEF_MIN_COL = DEPLOY_MID_COL + 1` (`:872`).
pub const DEPLOY_DEF_MIN_COL: i32 = DEPLOY_MID_COL + 1;
/// `TILE_H` (`:905`): tile slab thickness.
pub const TILE_H: f64 = 0.10;
/// `FOREST_CONE_COLOR` (`:1155`).
pub const FOREST_CONE_COLOR: u32 = 0x002f_6b34;
/// `FOREST_CONE_COLOR2` (`:1156`).
pub const FOREST_CONE_COLOR2: u32 = 0x003d_7a3a;
/// `FOREST_TRUNK_COLOR` (`:1157`).
pub const FOREST_TRUNK_COLOR: u32 = 0x005b_4327;
/// `HILL_GRASS_COLOR` (`:1158`).
pub const HILL_GRASS_COLOR: u32 = 0x0052_823f;
/// `SHRUB_COLOR` (`:1159`).
pub const SHRUB_COLOR: u32 = 0x0035_6b2c;
/// `ROCK_COLOR` (`:1160`).
pub const ROCK_COLOR: u32 = 0x006f_7a85;
/// `RIVER_WATER_COLOR` (`:1161`).
pub const RIVER_WATER_COLOR: u32 = 0x003a_86b5;
/// `HILL_GRASS_COLOR_DESERT` (`:1164`).
pub const HILL_GRASS_COLOR_DESERT: u32 = 0x00ca_a863;
/// `SHRUB_COLOR_DESERT` (`:1165`).
pub const SHRUB_COLOR_DESERT: u32 = 0x008a_6f3f;
/// `ROCK_COLOR_DESERT` (`:1166`).
pub const ROCK_COLOR_DESERT: u32 = 0x009c_8a63;
/// `GRASS_TUFT_COLOR_A` (`:1170`).
pub const GRASS_TUFT_COLOR_A: u32 = 0x007a_b84c;
/// `GRASS_TUFT_COLOR_B` (`:1171`).
pub const GRASS_TUFT_COLOR_B: u32 = 0x005c_9a3c;
/// `PEBBLE_COLOR` (`:1172`).
pub const PEBBLE_COLOR: u32 = 0x008a_8478;
/// `TINY_BUSH_COLOR` (`:1173`).
pub const TINY_BUSH_COLOR: u32 = 0x003f_7a34;
/// `GRASS_TUFT_COLOR_A_DESERT` (`:1176`).
pub const GRASS_TUFT_COLOR_A_DESERT: u32 = 0x00c9_ae7a;
/// `GRASS_TUFT_COLOR_B_DESERT` (`:1177`).
pub const GRASS_TUFT_COLOR_B_DESERT: u32 = 0x00b0_8f55;
/// `HILL_LIFT` (`:1180`).
pub const HILL_LIFT: f64 = 0.18;
/// `HILL_BUMP_RADIUS = TILE_S * 0.78` (`:1187`).
pub const HILL_BUMP_RADIUS: f64 = TILE_S * 0.78;
/// `HILL_SUMMIT_Y = HILL_LIFT + 0.16` (`:1195`).
pub const HILL_SUMMIT_Y: f64 = HILL_LIFT + 0.16;
/// `RIVER_DROP` (`:1197`).
pub const RIVER_DROP: f64 = 0.08;
/// `SIEGE_BLDG_BODY_COLORS` (`:1204`).
pub const SIEGE_BLDG_BODY_COLORS: [u32; 5] = [
    0x00cd_b896,
    0x00b8_a179,
    0x00c7_a97e,
    0x00a8_9272,
    0x00bf_ae8c,
];
/// `SIEGE_BLDG_ROOF_COLORS` (`:1205`).
pub const SIEGE_BLDG_ROOF_COLORS: [u32; 4] = [0x008b_4a35, 0x006b_3d2a, 0x009c_6b3f, 0x007a_4530];
/// `BattleScene.WALL_TILE_HP` (`:2417`).
pub const WALL_TILE_HP: f64 = 640.0;
/// `gateHp` after `_carveWallTiles` (`GATE_MAX_HP`, `:3870`).
pub const GATE_MAX_HP: f64 = 400.0;

/// Tile kinds of `battle-terrain.ts:37-46` (`const enum BTerrain`).
pub mod bterrain {
    /// `Plains`.
    pub const PLAINS: u8 = 0;
    /// `Forest`.
    pub const FOREST: u8 = 1;
    /// `Hills`.
    pub const HILLS: u8 = 2;
    /// `River` (impassable).
    pub const RIVER: u8 = 3;
    /// `Ford`.
    pub const FORD: u8 = 4;
    /// `Rocks`.
    pub const ROCKS: u8 = 5;
    /// `Wall` (impassable).
    pub const WALL: u8 = 6;
    /// `Gate` (impassable while closed).
    pub const GATE: u8 = 7;
}
use bterrain::{FORD, FOREST, GATE, HILLS, PLAINS, RIVER, ROCKS, WALL};

/// `BT_FLOOR_COLOR[kind]` (`:1130-1139`), `None` for a kind outside the table.
#[must_use]
pub const fn floor_color(kind: u8) -> Option<u32> {
    match kind {
        0 => Some(0x006f_a84a),
        1 => Some(0x003a_6b34),
        2 => Some(0x004a_7838),
        3 => Some(0x003a_86b5),
        4 => Some(0x006a_93a8),
        5 => Some(0x008a_8680),
        6 => Some(0x009a_9080),
        7 => Some(0x007a_6a50),
        _ => None,
    }
}

/// `BT_FLOOR_COLOR_DESERT[kind]` (`:1144-1153`).
#[must_use]
pub const fn floor_color_desert(kind: u8) -> Option<u32> {
    match kind {
        0 => Some(0x00d7_b877),
        1 => Some(0x003a_6b34),
        2 => Some(0x00c9_a662),
        3 => Some(0x003a_86b5),
        4 => Some(0x006a_93a8),
        5 => Some(0x009c_8a63),
        6 => Some(0x009a_9080),
        7 => Some(0x007a_6a50),
        _ => None,
    }
}

// ------------------------------------------------------------ JS helpers

/// `Math.min(a, b)` (NaN-propagating, `-0 < +0`).
fn js_min(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else if a < b || (a == b && a.is_sign_negative()) {
        a
    } else {
        b
    }
}

/// `Math.max(a, b)` (NaN-propagating, `+0 > -0`).
fn js_max(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else if a > b || (a == b && a.is_sign_positive()) {
        a
    } else {
        b
    }
}

/// `ToInt32` of a finite JS number already known to be an integer that fits
/// (`Math.round` of a colour channel).
#[allow(clippy::cast_possible_truncation)]
fn int32(x: f64) -> i32 {
    // Channels are in (-2^31, 2^31): plain truncation is ToInt32 here; NaN is
    // impossible (inputs are finite colours and amounts).
    x as i32
}

/// `tileJitter(col, row, salt)` (`battle-terrain.ts:811-818`): mulberry32
/// seeded from `(col, row, salt)`, in `[0, 1)`.
#[must_use]
#[allow(clippy::cast_possible_wrap)]
pub fn tile_jitter(col: i32, row: i32, salt: i32) -> f64 {
    let a = (col.wrapping_add(1).wrapping_mul(374_761_393)
        ^ row.wrapping_add(1).wrapping_mul(668_265_263)
        ^ salt.wrapping_add(1).wrapping_mul(2_246_822_519_u32 as i32)) as u32;
    let a = (a as i32).wrapping_add(0x6d2b_79f5);
    let au = a as u32;
    let mut t = (a ^ (au >> 15) as i32).wrapping_mul(1 | a);
    let tu = t as u32;
    t = t.wrapping_add((t ^ (tu >> 7) as i32).wrapping_mul(61 | t)) ^ t;
    let tu = t as u32;
    f64::from(tu ^ (tu >> 14)) / 4_294_967_296.0
}

/// `lighten(color, amount)` (`battleScene.ts:19442-19450`).
#[must_use]
pub fn lighten(color: i32, amount: f64) -> i32 {
    let r = f64::from((color >> 16) & 0xff);
    let g = f64::from((color >> 8) & 0xff);
    let b = f64::from(color & 0xff);
    let rr = int32(js_round(r + (255.0 - r) * amount));
    let gg = int32(js_round(g + (255.0 - g) * amount));
    let bb = int32(js_round(b + (255.0 - b) * amount));
    rr.wrapping_shl(16) | gg.wrapping_shl(8) | bb
}

/// `blend(a, b, amount)` (`battleScene.ts:19452-19459`).
#[must_use]
pub fn blend(a: i32, b: i32, amount: f64) -> i32 {
    let (ar, ag, ab) = (
        f64::from((a >> 16) & 0xff),
        f64::from((a >> 8) & 0xff),
        f64::from(a & 0xff),
    );
    let (br, bg, bb) = (
        f64::from((b >> 16) & 0xff),
        f64::from((b >> 8) & 0xff),
        f64::from(b & 0xff),
    );
    let rr = int32(js_round(ar + (br - ar) * amount));
    let gg = int32(js_round(ag + (bg - ag) * amount));
    let bbv = int32(js_round(ab + (bb - ab) * amount));
    rr.wrapping_shl(16) | gg.wrapping_shl(8) | bbv
}

/// `cellToWorld(col, row)` (`:1724-1726`): centre of a tile.
#[must_use]
pub fn cell_to_world(col: f64, row: f64) -> (f64, f64) {
    (col * TILE_S, row * TILE_S)
}

/// `cellBoundsXZ(minCol, minRow, maxCol, maxRow)` (`:1729-1739`):
/// `(xMin, xMax, zMin, zMax)`.
#[must_use]
pub fn cell_bounds_xz(
    min_col: f64,
    min_row: f64,
    max_col: f64,
    max_row: f64,
) -> (f64, f64, f64, f64) {
    let half = TILE_S * 0.5;
    (
        min_col * TILE_S - half,
        max_col * TILE_S + half,
        min_row * TILE_S - half,
        max_row * TILE_S + half,
    )
}

/// `deployClearRanksFor(presetActive)` (`:734-738`).
#[must_use]
pub const fn deploy_clear_ranks_for(preset_active: bool) -> i32 {
    // Math.ceil(MAX_PER_SIDE / 12) on integers.
    let c = (MAX_PER_SIDE + 11) / 12;
    if preset_active {
        let (a, b) = (MAX_RANKS + 4, c + 3);
        if a > b {
            a
        } else {
            b
        }
    } else {
        let (a, b) = (MAX_RANKS + 12, c + 8);
        if a > b {
            a
        } else {
            b
        }
    }
}

/// `battleSafeCols(presetActive)` (`:757-771`).
#[must_use]
pub fn battle_safe_cols(preset_active: bool) -> Vec<(i32, i32)> {
    let ranks = deploy_clear_ranks_for(preset_active);
    let atk_end = ATK_FRONT_COL + (ranks - 1) * ATK_COL_STEP;
    let def_end = DEF_FRONT_COL + (ranks - 1) * DEF_COL_STEP;
    let (atk_lo, atk_hi) = (ATK_FRONT_COL.min(atk_end), ATK_FRONT_COL.max(atk_end));
    let (def_lo, def_hi) = (DEF_FRONT_COL.min(def_end), DEF_FRONT_COL.max(def_end));
    [
        (PLAY_COL0, atk_lo - 1),
        (atk_hi + 1, def_lo - 1),
        (def_hi + 1, PLAY_COL1),
    ]
    .into_iter()
    .filter(|&(lo, hi)| hi >= lo)
    .collect()
}

// ------------------------------------------------------------ terrain DTO

/// The battle terrain grid (`BattleTerrainMap`, `battle-terrain.ts:49-70`)
/// as a DTO: row-major tile kinds, `index = row * cols + col`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TerrainGrid {
    /// `cols`.
    pub cols: i32,
    /// `rows`.
    pub rows: i32,
    /// `tiles` (`Uint8Array`).
    pub tiles: Vec<u8>,
}

impl TerrainGrid {
    /// A grid; `tiles.len()` must be `cols * rows`.
    ///
    /// # Panics
    /// When the length does not match.
    #[must_use]
    pub fn new(cols: i32, rows: i32, tiles: Vec<u8>) -> Self {
        let n = usize::try_from(cols).unwrap_or(0) * usize::try_from(rows).unwrap_or(0);
        assert_eq!(tiles.len(), n, "tiles must be cols * rows");
        Self { cols, rows, tiles }
    }

    /// `at(col, row)`: the kind, `Plains` out of range (`battle-terrain.ts:780-783`).
    #[must_use]
    #[allow(clippy::cast_sign_loss)]
    pub fn at(&self, c: i32, r: i32) -> u8 {
        if c < 0 || c >= self.cols || r < 0 || r >= self.rows {
            return PLAINS;
        }
        self.tiles[(r * self.cols + c) as usize]
    }

    /// `passable(col, row)` (`battle-terrain.ts:790-793`).
    #[must_use]
    pub fn passable(&self, c: i32, r: i32) -> bool {
        let t = self.at(c, r);
        t != RIVER && t != WALL && t != GATE
    }

    /// `tiles[i] = v` on the typed array: writes past the end are dropped
    /// (a `Uint8Array` ignores out-of-range integer indices).
    #[allow(clippy::cast_sign_loss)]
    fn set_index(&mut self, i: i32, v: u8) {
        if i >= 0 {
            if let Some(t) = self.tiles.get_mut(i as usize) {
                *t = v;
            }
        }
    }
}

/// `tileTopY(tm, col, row)` (`:1831-1838`): the walking surface height.
#[must_use]
pub fn tile_top_y(grid: &TerrainGrid, col: i32, row: i32) -> f64 {
    match grid.at(col, row) {
        HILLS => HILL_SUMMIT_Y,
        RIVER | FORD => -RIVER_DROP,
        _ => 0.0,
    }
}

/// Siege fields set by `_carveWallTiles` (`:3849-3888`).
#[derive(Debug, Clone, PartialEq)]
pub struct SiegeLayout {
    /// `siegeWallCol`.
    pub wall_col: i32,
    /// `siegeWallRowLo`.
    pub row_lo: i32,
    /// `siegeWallRowHi`.
    pub row_hi: i32,
    /// `siegeGateCol`.
    pub gate_col: i32,
    /// `siegeGateRow`.
    pub gate_row: i32,
    /// `gateHp`.
    pub gate_hp: f64,
    /// `gateOpen`.
    pub gate_open: bool,
    /// `wallTileHp` (`Map<row, hp>` in insertion order).
    pub wall_tile_hp: Vec<(i32, f64)>,
}

/// `_carveWallTiles()` (`:3849-3888`): marks the wall column (`Wall`) and
/// the two gate rows (`Gate`) and returns the siege fields it sets. Like the
/// web it indexes with `BF_COLS`, whatever `grid.cols` is.
pub fn carve_wall_tiles(grid: &mut TerrainGrid) -> SiegeLayout {
    let wall_col = (BF_COLS - 2).min(DEF_FRONT_COL + 4);
    let (r_lo, r_hi) = (0, BF_ROWS - 1);
    let mid_row = PLAY_MID_ROW;
    let (gate_lo, gate_hi) = (mid_row - 1, mid_row);
    let mut wall_tile_hp = Vec::new();
    for r in r_lo..=r_hi {
        if r >= gate_lo && r <= gate_hi {
            continue;
        }
        wall_tile_hp.push((r, WALL_TILE_HP));
    }
    for r in r_lo..=r_hi {
        let is_gate = r >= gate_lo && r <= gate_hi;
        if (0..BF_COLS).contains(&wall_col) {
            grid.set_index(r * BF_COLS + wall_col, if is_gate { GATE } else { WALL });
        }
    }
    SiegeLayout {
        wall_col,
        row_lo: r_lo,
        row_hi: r_hi,
        gate_col: wall_col,
        gate_row: mid_row,
        gate_hp: GATE_MAX_HP,
        gate_open: false,
        wall_tile_hp,
    }
}

// ------------------------------------------------------------ geometry

/// Field geometries the scene [`Prim`]s cannot express (minimal body type
/// of this module; `geom/**` is not changed).
#[derive(Debug, Clone, PartialEq)]
pub enum FieldGeo {
    /// `new PlaneGeometry(w, h)` (XY plane).
    Plane {
        /// Width.
        w: f64,
        /// Height.
        h: f64,
    },
    /// `new PlaneGeometry(w, h).rotateX(-Math.PI / 2)` (lies in XZ).
    FlatPlane {
        /// Width.
        w: f64,
        /// Height.
        h: f64,
    },
    /// `new ConeGeometry(r, h, radial).translate(0, dy, 0)`.
    LiftedCone {
        /// Radius.
        r: f64,
        /// Height.
        h: f64,
        /// Radial segments.
        radial: u32,
        /// Lift.
        dy: f64,
    },
    /// `makeGableRoofGeometry()`.
    GableRoof,
    /// `new BufferGeometry().setFromPoints(points)` (xyz per point).
    Polyline(Vec<f64>),
}

impl GeoBody for FieldGeo {
    fn build(&self) -> Mesh {
        match self {
            Self::Plane { w, h } => geom::plane_geometry(*w, *h, 1, 1),
            Self::FlatPlane { w, h } => {
                let mut m = geom::plane_geometry(*w, *h, 1, 1);
                m.rotate_x(-PI / 2.0);
                m
            }
            Self::LiftedCone { r, h, radial, dy } => {
                let mut m = geom::cone_geometry(*r, *h, *radial, 1, false, 0.0, PI * 2.0);
                m.translate(0.0, *dy, 0.0);
                m
            }
            Self::GableRoof => make_gable_roof_geometry(),
            Self::Polyline(p) => Mesh {
                #[allow(clippy::cast_possible_truncation)]
                positions: p.iter().map(|&v| v as f32).collect(),
                ..Mesh::default()
            },
        }
    }
    fn three_type(&self) -> &'static str {
        match self {
            Self::Plane { .. } | Self::FlatPlane { .. } => "PlaneGeometry",
            Self::LiftedCone { .. } => "ConeGeometry",
            Self::GableRoof | Self::Polyline(_) => "BufferGeometry",
        }
    }
}

/// `makeGableRoofGeometry()` (`:1214-1235`): unit gable roof prism, 6
/// non-indexed triangles, `computeVertexNormals()` (no uv).
#[must_use]
pub fn make_gable_roof_geometry() -> Mesh {
    let a = [-0.5, 0.0, -0.5];
    let b = [0.5, 0.0, -0.5];
    let c = [0.5, 0.0, 0.5];
    let d = [-0.5, 0.0, 0.5];
    let r0 = [-0.5, 1.0, 0.0];
    let r1 = [0.5, 1.0, 0.0];
    let tris: [[[f64; 3]; 3]; 6] = [
        [a, r1, b],
        [a, r0, r1],
        [d, c, r0],
        [c, r1, r0],
        [a, d, r0],
        [b, r1, c],
    ];
    let mut positions = Vec::with_capacity(54);
    for t in tris {
        for p in t {
            for v in p {
                #[allow(clippy::cast_possible_truncation)]
                positions.push(v as f32);
            }
        }
    }
    let mut m = Mesh {
        positions,
        ..Mesh::default()
    };
    m.compute_vertex_normals();
    m
}

/// `geometry.parameters` of a field geometry in three's key order
/// (booleans 0/1; `BufferGeometry` has none).
#[must_use]
pub fn geo_parameters(g: &Geo) -> Vec<f64> {
    if let Some(f) = g.body_as::<FieldGeo>() {
        return match f {
            FieldGeo::Plane { w, h } | FieldGeo::FlatPlane { w, h } => vec![*w, *h, 1.0, 1.0],
            FieldGeo::LiftedCone { r, h, radial, .. } => {
                vec![*r, *h, f64::from(*radial), 1.0, 0.0, 0.0, PI * 2.0]
            }
            FieldGeo::GableRoof | FieldGeo::Polyline(_) => Vec::new(),
        };
    }
    match g.prim() {
        Some(Prim::Box { w, h, d }) => vec![w, h, d, 1.0, 1.0, 1.0],
        Some(Prim::Cylinder {
            rt,
            rb,
            h,
            radial,
            open,
        }) => {
            vec![
                rt,
                rb,
                h,
                f64::from(radial),
                1.0,
                f64::from(u8::from(open)),
                0.0,
                PI * 2.0,
            ]
        }
        Some(Prim::Cone { r, h, radial }) => vec![r, h, f64::from(radial), 1.0, 0.0, 0.0, PI * 2.0],
        Some(Prim::Sphere {
            r,
            ws,
            hs,
            phi_start,
            phi_len,
            theta_start,
            theta_len,
        }) => vec![
            r,
            f64::from(ws),
            f64::from(hs),
            phi_start,
            phi_len,
            theta_start,
            theta_len,
        ],
        Some(Prim::Icosahedron { r, detail }) => vec![r, f64::from(detail)],
        _ => Vec::new(),
    }
}

// ------------------------------------------------------------ side tables

/// A `THREE.InstancedMesh` (placeholder node + payload).
#[derive(Debug, Clone, PartialEq)]
pub struct InstancedMesh {
    /// Placeholder node in [`FieldScene::scene`].
    pub node: NodeId,
    /// Shared geometry.
    pub geo: Geo,
    /// Material slot in `scene.materials`.
    pub material: MatId,
    /// Allocated instances (`instanceMatrix.count`).
    pub capacity: usize,
    /// Drawn instances (`mesh.count`).
    pub count: usize,
    /// `instanceMatrix.array` (`Float32`, 16 per instance, identity-filled).
    pub matrices: Vec<f32>,
    /// `instanceColor.array` (`Float32`, rgb per instance, filled with 1 on
    /// the first `setColorAt`), `None` while never set.
    pub colors: Option<Vec<f32>>,
    /// `boundingSphere` (computed for the ground-pick meshes by
    /// `refreshInstancedPickBounds`), `None` while not computed.
    pub bounding_sphere: Option<Sphere>,
}

const IDENTITY_F32: [f32; 16] = [
    1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0,
];

impl InstancedMesh {
    fn set_matrix_at(&mut self, i: usize, m: &[f32; 16]) {
        self.matrices[i * 16..i * 16 + 16].copy_from_slice(m);
    }

    fn set_color_at(&mut self, i: usize, c: Color) {
        let cap = self.capacity;
        let arr = self.colors.get_or_insert_with(|| vec![1.0; cap * 3]);
        arr[i * 3..i * 3 + 3].copy_from_slice(&c.to_f32());
    }

    /// Instance `i`'s matrix widened to doubles (`getMatrixAt`).
    #[must_use]
    pub fn matrix_at(&self, i: usize) -> Mat4 {
        let mut a = [0.0f32; 16];
        a.copy_from_slice(&self.matrices[i * 16..i * 16 + 16]);
        Mat4::from_f32(&a)
    }

    /// `InstancedMesh.computeBoundingSphere()` (three r169).
    fn compute_bounding_sphere(&mut self) {
        let mesh = self.geo.mesh();
        let geo_sphere =
            TriGeometry::new(mesh.positions.clone(), mesh.indices.clone()).bounding_sphere();
        let mut s = Sphere {
            center: Vec3::new(0.0, 0.0, 0.0),
            radius: -1.0,
        };
        for i in 0..self.count {
            s = sphere_union(s, geo_sphere.apply_matrix4(&self.matrix_at(i)));
        }
        self.bounding_sphere = Some(s);
    }
}

/// `Sphere.expandByPoint(point)`.
fn sphere_expand(mut s: Sphere, p: Vec3) -> Sphere {
    if s.radius < 0.0 {
        return Sphere {
            center: p,
            radius: 0.0,
        };
    }
    let v = p.sub_vec(s.center);
    let len_sq = v.length_sq();
    if len_sq > s.radius * s.radius {
        let len = len_sq.sqrt();
        let delta = (len - s.radius) * 0.5;
        s.center = s.center.add_scaled(v, delta / len);
        s.radius += delta;
    }
    s
}

/// `Sphere.union(sphere)`.
fn sphere_union(s: Sphere, o: Sphere) -> Sphere {
    if o.radius < 0.0 {
        return s;
    }
    if s.radius < 0.0 {
        return o;
    }
    if s.center == o.center {
        return Sphere {
            center: s.center,
            radius: js_max(s.radius, o.radius),
        };
    }
    // setLength(l) = normalize().multiplyScalar(l)
    let v = o.center.sub_vec(s.center).normalize().scale(o.radius);
    let s = sphere_expand(s, o.center.add_vec(v));
    sphere_expand(s, o.center.sub_vec(v))
}

/// Shadow parameters of a `DirectionalLight` (`light.shadow`, three r169
/// `DirectionalLightShadow`: `OrthographicCamera(-5, 5, 5, -5, 0.5, 500)`,
/// `mapSize` 512², bias 0, normalBias 0, radius 1 by default).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct DirectionalShadow {
    /// `mapSize.x`, `mapSize.y`.
    pub map_size: (f64, f64),
    /// `camera.near`.
    pub near: f64,
    /// `camera.far`.
    pub far: f64,
    /// `camera.left`.
    pub left: f64,
    /// `camera.right`.
    pub right: f64,
    /// `camera.top`.
    pub top: f64,
    /// `camera.bottom`.
    pub bottom: f64,
    /// `bias`.
    pub bias: f64,
    /// `normalBias`.
    pub normal_bias: f64,
    /// `radius`.
    pub radius: f64,
}

impl Default for DirectionalShadow {
    fn default() -> Self {
        Self {
            map_size: (512.0, 512.0),
            near: 0.5,
            far: 500.0,
            left: -5.0,
            right: 5.0,
            top: 5.0,
            bottom: -5.0,
            bias: 0.0,
            normal_bias: 0.0,
            radius: 1.0,
        }
    }
}

/// Light class with its class-specific data.
#[derive(Debug, Clone, PartialEq)]
pub enum LightKind {
    /// `AmbientLight`.
    Ambient,
    /// `HemisphereLight` (`color` = sky).
    Hemisphere {
        /// `groundColor` (linear).
        ground: Color,
    },
    /// `DirectionalLight`.
    Directional {
        /// The `target` node when it was added to the scene.
        target_node: Option<NodeId>,
        /// `target.position`.
        target_position: GVec3,
        /// `shadow`.
        shadow: DirectionalShadow,
    },
}

/// A light (placeholder node + payload; position / `castShadow` on the node).
#[derive(Debug, Clone, PartialEq)]
pub struct Light {
    /// Placeholder node.
    pub node: NodeId,
    /// Class.
    pub kind: LightKind,
    /// `color` (linear).
    pub color: Color,
    /// `intensity`.
    pub intensity: f64,
}

impl Light {
    /// `light.type` of three r169.
    #[must_use]
    pub const fn three_type(&self) -> &'static str {
        match self.kind {
            LightKind::Ambient => "AmbientLight",
            LightKind::Hemisphere { .. } => "HemisphereLight",
            LightKind::Directional { .. } => "DirectionalLight",
        }
    }
}

/// Dashes of a `LineDashedMaterial`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Dash {
    /// `dashSize`.
    pub dash_size: f64,
    /// `gapSize`.
    pub gap_size: f64,
    /// `scale`.
    pub scale: f64,
}

/// A `THREE.Line` deploy-cell outline (placeholder node + payload).
#[derive(Debug, Clone, PartialEq)]
pub struct OutlineLine {
    /// Placeholder node.
    pub node: NodeId,
    /// `BufferGeometry().setFromPoints(5 points)`.
    pub geo: Geo,
    /// Material slot (`LineBasicMaterial`; `LineDashedMaterial` when `dash`).
    pub material: MatId,
    /// Dash parameters of a `LineDashedMaterial`.
    pub dash: Option<Dash>,
    /// `lineDistance` attribute (`computeLineDistances`, dashed only).
    pub line_distances: Option<Vec<f32>>,
}

/// The scene being built plus the side tables of the placeholder nodes.
#[derive(Debug, Clone, PartialEq)]
pub struct FieldScene {
    /// The tree (root = `THREE.Scene`).
    pub scene: Scene,
    /// Instanced meshes in creation order.
    pub instanced: Vec<InstancedMesh>,
    /// Lights in creation order.
    pub lights: Vec<Light>,
    /// Deploy-cell outlines in creation order.
    pub lines: Vec<OutlineLine>,
    /// `_battleGroundPickMeshes` (tiles, hill bumps, water).
    pub ground_pick: Vec<NodeId>,
    /// `_deployZoneMeshes`.
    pub deploy_zone_meshes: Vec<NodeId>,
    /// `_deployVisualGroup`.
    pub deploy_group: Option<NodeId>,
    /// `_deployGhostGroup`.
    pub deploy_ghost_group: Option<NodeId>,
}

impl Default for FieldScene {
    fn default() -> Self {
        Self::new()
    }
}

/// `THREE.Object3D` used as `dummy` for `setMatrixAt` (`updateMatrix` →
/// `Float32` store).
#[derive(Clone, Copy)]
struct Dummy {
    pos: GVec3,
    quat: GQuat,
    scale: GVec3,
}

impl Dummy {
    fn new() -> Self {
        Self {
            pos: GVec3::new(0.0, 0.0, 0.0),
            quat: GQuat::default(),
            scale: GVec3::new(1.0, 1.0, 1.0),
        }
    }
    fn pos(&mut self, x: f64, y: f64, z: f64) {
        self.pos = GVec3::new(x, y, z);
    }
    fn rot(&mut self, x: f64, y: f64, z: f64) {
        self.quat = GQuat::from_euler(Euler::xyz(x, y, z));
    }
    fn scale(&mut self, x: f64, y: f64, z: f64) {
        self.scale = GVec3::new(x, y, z);
    }
    fn scalar(&mut self, s: f64) {
        self.scale(s, s, s);
    }
    #[allow(clippy::cast_possible_truncation)]
    fn matrix(&self) -> [f32; 16] {
        let m = GMat4::compose(self.pos, self.quat, self.scale);
        let mut out = [0.0f32; 16];
        for (o, v) in out.iter_mut().zip(m.e.iter()) {
            *o = *v as f32;
        }
        out
    }
}

fn basic_transparent(color: u32, opacity: f64, depth_write: bool) -> Material {
    let mut m = Material::basic(color);
    m.transparent = true;
    m.opacity = opacity;
    m.depth_write = depth_write;
    m
}

impl FieldScene {
    /// An empty `THREE.Scene`.
    #[must_use]
    pub fn new() -> Self {
        Self {
            scene: Scene::new(),
            instanced: Vec::new(),
            lights: Vec::new(),
            lines: Vec::new(),
            ground_pick: Vec::new(),
            deploy_zone_meshes: Vec::new(),
            deploy_group: None,
            deploy_ghost_group: None,
        }
    }

    /// The instanced mesh of a placeholder node.
    #[must_use]
    pub fn instanced_at(&self, node: NodeId) -> Option<&InstancedMesh> {
        self.instanced.iter().find(|m| m.node == node)
    }

    /// The light of a placeholder node.
    #[must_use]
    pub fn light_at(&self, node: NodeId) -> Option<&Light> {
        self.lights.iter().find(|l| l.node == node)
    }

    /// The outline of a placeholder node.
    #[must_use]
    pub fn line_at(&self, node: NodeId) -> Option<&OutlineLine> {
        self.lines.iter().find(|l| l.node == node)
    }

    fn mesh(&mut self, parent: NodeId, geo: impl Into<Geo>, mat: MatId) -> NodeId {
        self.scene.mesh(parent, geo, mat)
    }

    fn new_instanced(&mut self, geo: impl Into<Geo>, material: MatId, capacity: usize) -> usize {
        // Detached until `add_instanced` (the web adds after filling).
        let node = self.scene.push(None, NodeKind::Object3D);
        let mut matrices = Vec::with_capacity(capacity * 16);
        for _ in 0..capacity {
            matrices.extend_from_slice(&IDENTITY_F32);
        }
        self.instanced.push(InstancedMesh {
            node,
            geo: geo.into(),
            material,
            capacity,
            count: capacity,
            matrices,
            colors: None,
            bounding_sphere: None,
        });
        self.instanced.len() - 1
    }

    fn add(&mut self, node: NodeId) {
        self.scene.attach(ROOT, node);
    }

    fn add_instanced(&mut self, idx: usize) -> NodeId {
        let node = self.instanced[idx].node;
        self.add(node);
        node
    }

    fn shadows_of(&mut self, idx: usize, cast: bool, receive: bool) {
        let node = self.instanced[idx].node;
        self.scene.shadows(node, cast, receive);
    }

    /// `_buildBattlefield(_teren)` (`:4462-4876`) + `_buildPlayableMarginVisuals`
    /// (`:4879-4962`, incl. `refreshInstancedPickBounds`).
    #[allow(clippy::too_many_lines, clippy::cast_sign_loss)]
    pub fn build_battlefield(&mut self, tm: &TerrainGrid, desert: bool) {
        self.ground_pick.clear();
        let floor = |k: u8| {
            if desert {
                floor_color_desert(k)
            } else {
                floor_color(k)
            }
        };
        let hill_color = if desert {
            HILL_GRASS_COLOR_DESERT
        } else {
            HILL_GRASS_COLOR
        };
        let shrub_color = if desert {
            SHRUB_COLOR_DESERT
        } else {
            SHRUB_COLOR
        };
        let rock_color = if desert {
            ROCK_COLOR_DESERT
        } else {
            ROCK_COLOR
        };
        let tuft_a = if desert {
            GRASS_TUFT_COLOR_A_DESERT
        } else {
            GRASS_TUFT_COLOR_A
        };
        let tuft_b = if desert {
            GRASS_TUFT_COLOR_B_DESERT
        } else {
            GRASS_TUFT_COLOR_B
        };
        let bush_color = if desert {
            SHRUB_COLOR_DESERT
        } else {
            TINY_BUSH_COLOR
        };

        let tile_geo = Prim::bx(TILE_S * 0.995, TILE_H, TILE_S * 0.995);
        let mut mat_cache: Vec<(u32, MatId)> = Vec::new();

        const FOREST_TREES: i32 = 7;
        const HILL_SHRUBS: i32 = 4;
        let (mut forest_tiles, mut hill_tiles, mut water_tiles, mut rock_tiles) =
            (0usize, 0usize, 0usize, 0usize);
        for &k in &tm.tiles {
            match k {
                FOREST => forest_tiles += 1,
                HILLS => hill_tiles += 1,
                RIVER | FORD => water_tiles += 1,
                ROCKS => rock_tiles += 1,
                _ => {}
            }
        }

        // --- tile floor ---
        for col in 0..BF_COLS {
            for row in 0..BF_ROWS {
                let kind = tm.at(col, row);
                let checker = if (col + row) % 2 == 0 { 0.0 } else { 0.022 };
                #[allow(clippy::cast_possible_wrap)]
                let mut c = lighten(floor(kind).unwrap_or(0x006f_a84a) as i32, checker);
                let variance_step = (tile_jitter(col, row, 101) * 7.0).floor() - 3.0;
                let variance = variance_step * 0.0225;
                c = if variance >= 0.0 {
                    lighten(c, variance)
                } else {
                    blend(c, 0, -variance)
                };
                if col <= ATK_FRONT_COL {
                    c = lighten(c, 0.05);
                } else if col >= DEF_FRONT_COL {
                    c = blend(c, 0x0090_90a0, 0.07);
                }
                let key = (c & 0x00ff_ffff) as u32;
                let mat = if let Some(&(_, m)) = mat_cache.iter().find(|(k, _)| *k == key) {
                    m
                } else {
                    let m = self.scene.add_material(Material::standard(key, 0.0, 0.95));
                    mat_cache.push((key, m));
                    m
                };
                let id = self.mesh(ROOT, tile_geo, mat);
                let (x, z) = cell_to_world(f64::from(col), f64::from(row));
                let is_water = kind == RIVER || kind == FORD;
                let y_top = if is_water { -RIVER_DROP } else { 0.0 };
                self.scene.set_pos(id, x, y_top - TILE_H * 0.5, z);
                self.scene.receive_shadow(id);
                self.ground_pick.push(id);
            }
        }

        // --- forest ---
        if forest_tiles > 0 {
            let max_trees = forest_tiles * FOREST_TREES as usize;
            let crown_geo = Prim::cone(TILE_S * 0.20, TILE_S * 0.62, 6);
            let crown_mat = self.scene.lambert_mat(0x00ff_ffff, true);
            let trunk_geo = Prim::cyl(TILE_S * 0.035, TILE_S * 0.05, TILE_S * 0.22, 5);
            let trunk_mat = self
                .scene
                .add_material(Material::lambert(FOREST_TRUNK_COLOR));
            let crowns = self.new_instanced(crown_geo, crown_mat, max_trees);
            let trunks = self.new_instanced(trunk_geo, trunk_mat, max_trees);
            self.shadows_of(crowns, true, true);
            self.shadows_of(trunks, true, false);
            let mut dummy = Dummy::new();
            let color_a = Color::from_hex(FOREST_CONE_COLOR);
            let color_b = Color::from_hex(FOREST_CONE_COLOR2);
            let mut ti = 0usize;
            for col in 0..BF_COLS {
                for row in 0..BF_ROWS {
                    if tm.at(col, row) != FOREST {
                        continue;
                    }
                    let (x, z) = cell_to_world(f64::from(col), f64::from(row));
                    for t in 0..FOREST_TREES {
                        let jx = (tile_jitter(col, row, t * 2) - 0.5) * TILE_S * 0.72;
                        let jz = (tile_jitter(col, row, t * 2 + 1) - 0.5) * TILE_S * 0.72;
                        let sc = 0.7 + tile_jitter(col, row, t + 7) * 0.6;
                        dummy.pos(x + jx, TILE_S * 0.11 * sc, z + jz);
                        dummy.scalar(sc);
                        dummy.rot(0.0, 0.0, 0.0);
                        self.instanced[trunks].set_matrix_at(ti, &dummy.matrix());
                        dummy.pos(x + jx, (TILE_S * 0.22 + TILE_S * 0.31) * sc, z + jz);
                        self.instanced[crowns].set_matrix_at(ti, &dummy.matrix());
                        let c = if tile_jitter(col, row, t + 50) < 0.5 {
                            color_a
                        } else {
                            color_b
                        };
                        self.instanced[crowns].set_color_at(ti, c);
                        ti += 1;
                    }
                }
            }
            self.instanced[crowns].count = ti;
            self.instanced[trunks].count = ti;
            self.add_instanced(trunks);
            self.add_instanced(crowns);
        }

        // --- hills ---
        if hill_tiles > 0 {
            let bump_geo = Prim::Sphere {
                r: HILL_BUMP_RADIUS,
                ws: 8,
                hs: 5,
                phi_start: 0.0,
                phi_len: PI * 2.0,
                theta_start: 0.0,
                theta_len: PI * 0.5,
            };
            let bump_mat = self.scene.lambert_mat(hill_color, true);
            let shrub_geo = Prim::cone(TILE_S * 0.13, TILE_S * 0.34, 6);
            let shrub_mat = self.scene.lambert_mat(shrub_color, true);
            let bumps = self.new_instanced(bump_geo, bump_mat, hill_tiles);
            let shrubs =
                self.new_instanced(shrub_geo, shrub_mat, hill_tiles * HILL_SHRUBS as usize);
            self.shadows_of(bumps, true, true);
            self.shadows_of(shrubs, true, false);
            let mut dummy = Dummy::new();
            let (mut bi, mut si) = (0usize, 0usize);
            for col in 0..BF_COLS {
                for row in 0..BF_ROWS {
                    if tm.at(col, row) != HILLS {
                        continue;
                    }
                    let (x, z) = cell_to_world(f64::from(col), f64::from(row));
                    dummy.pos(x, 0.0, z);
                    dummy.scale(1.0, HILL_SUMMIT_Y / HILL_BUMP_RADIUS, 1.0);
                    dummy.rot(0.0, tile_jitter(col, row, 3) * PI, 0.0);
                    self.instanced[bumps].set_matrix_at(bi, &dummy.matrix());
                    bi += 1;
                    for h in 0..HILL_SHRUBS {
                        let jx = (tile_jitter(col, row, 10 + h) - 0.5) * TILE_S * 0.5;
                        let jz = (tile_jitter(col, row, 20 + h) - 0.5) * TILE_S * 0.5;
                        dummy.scalar(0.7 + tile_jitter(col, row, 30 + h) * 0.5);
                        dummy.pos(x + jx, HILL_LIFT + 0.10, z + jz);
                        dummy.rot(0.0, 0.0, 0.0);
                        self.instanced[shrubs].set_matrix_at(si, &dummy.matrix());
                        si += 1;
                    }
                }
            }
            self.instanced[bumps].count = bi;
            self.instanced[shrubs].count = si;
            let bn = self.add_instanced(bumps);
            self.add_instanced(shrubs);
            self.ground_pick.push(bn);
        }

        // --- river + ford water sheen ---
        if water_tiles > 0 {
            let water_geo = Prim::bx(TILE_S * 0.99, 0.04, TILE_S * 0.99);
            let mut wm = Material::lambert(RIVER_WATER_COLOR);
            wm.transparent = true;
            wm.opacity = 0.78;
            wm.emissive = Color::from_hex(0x000a_2a44);
            let water_mat = self.scene.add_material(wm);
            let water = self.new_instanced(water_geo, water_mat, water_tiles);
            let mut dummy = Dummy::new();
            let mut wi = 0usize;
            for col in 0..BF_COLS {
                for row in 0..BF_ROWS {
                    let k = tm.at(col, row);
                    if k != RIVER && k != FORD {
                        continue;
                    }
                    let (x, z) = cell_to_world(f64::from(col), f64::from(row));
                    let wy = if k == FORD {
                        -RIVER_DROP * 0.4
                    } else {
                        -RIVER_DROP * 0.5
                    };
                    dummy.pos(x, wy, z);
                    dummy.scale(1.0, 1.0, 1.0);
                    self.instanced[water].set_matrix_at(wi, &dummy.matrix());
                    wi += 1;
                }
            }
            self.instanced[water].count = wi;
            let wn = self.add_instanced(water);
            self.ground_pick.push(wn);
        }

        // --- rocks ---
        if rock_tiles > 0 {
            let rock_geo = Prim::Icosahedron {
                r: TILE_S * 0.22,
                detail: 0,
            };
            let rock_mat = self.scene.lambert_mat(rock_color, true);
            let rocks = self.new_instanced(rock_geo, rock_mat, rock_tiles * 2);
            self.shadows_of(rocks, true, true);
            let mut dummy = Dummy::new();
            let mut ri = 0usize;
            for col in 0..BF_COLS {
                for row in 0..BF_ROWS {
                    if tm.at(col, row) != ROCKS {
                        continue;
                    }
                    let (x, z) = cell_to_world(f64::from(col), f64::from(row));
                    let n = 1 + i32::from(tile_jitter(col, row, 5) > 0.5);
                    for b in 0..n {
                        let jx = (tile_jitter(col, row, 40 + b) - 0.5) * TILE_S * 0.45;
                        let jz = (tile_jitter(col, row, 50 + b) - 0.5) * TILE_S * 0.45;
                        let sc = 0.6 + tile_jitter(col, row, 60 + b) * 0.7;
                        dummy.pos(x + jx, TILE_S * 0.10 * sc, z + jz);
                        dummy.scalar(sc);
                        dummy.rot(
                            tile_jitter(col, row, 70 + b) * PI,
                            tile_jitter(col, row, 80 + b) * PI,
                            0.0,
                        );
                        self.instanced[rocks].set_matrix_at(ri, &dummy.matrix());
                        ri += 1;
                    }
                }
            }
            self.instanced[rocks].count = ri;
            self.add_instanced(rocks);
        }

        // --- grass tufts (playable rectangle only) ---
        {
            const GRASS_CAP: usize = 8000;
            const BLADES_PER_TUFT: i32 = 3;
            const MAX_TUFTS_PER_TILE: i32 = 2;
            let mut grass_tiles = 0u32;
            for col in PLAY_COL0..=PLAY_COL1 {
                for row in PLAY_ROW0..=PLAY_ROW1 {
                    let k = tm.at(col, row);
                    if k == PLAINS || k == HILLS {
                        grass_tiles += 1;
                    }
                }
            }
            if grass_tiles > 0 {
                let raw_slots = f64::from(grass_tiles) * f64::from(MAX_TUFTS_PER_TILE);
                #[allow(clippy::cast_precision_loss)]
                let keep_prob = js_min(
                    1.0,
                    GRASS_CAP as f64 / (raw_slots * f64::from(BLADES_PER_TUFT)),
                );
                let max_blades = GRASS_CAP;
                let blade_geo = Geo::body(FieldGeo::LiftedCone {
                    r: TILE_S * 0.016,
                    h: TILE_S * 0.20,
                    radial: 3,
                    dy: TILE_S * 0.10,
                });
                let grass_mat = self.scene.lambert_mat(0x00ff_ffff, true);
                let grass = self.new_instanced(blade_geo, grass_mat, max_blades);
                self.shadows_of(grass, false, false);
                let color_a = Color::from_hex(tuft_a);
                let color_b = Color::from_hex(tuft_b);
                let mut dummy = Dummy::new();
                let mut gi = 0usize;
                'outer: for col in PLAY_COL0..=PLAY_COL1 {
                    for row in PLAY_ROW0..=PLAY_ROW1 {
                        let k = tm.at(col, row);
                        if k != PLAINS && k != HILLS {
                            continue;
                        }
                        let (x, z) = cell_to_world(f64::from(col), f64::from(row));
                        let base_y = if k == HILLS { HILL_LIFT } else { 0.0 };
                        for tft in 0..MAX_TUFTS_PER_TILE {
                            if tile_jitter(col, row, 200 + tft) >= keep_prob {
                                continue;
                            }
                            let cx = (tile_jitter(col, row, 210 + tft * 3) - 0.5) * TILE_S * 0.8;
                            let cz = (tile_jitter(col, row, 211 + tft * 3) - 0.5) * TILE_S * 0.8;
                            for b in 0..BLADES_PER_TUFT {
                                if gi >= max_blades {
                                    break 'outer;
                                }
                                let salt = 220 + tft * 10 + b * 7;
                                let jx = cx + (tile_jitter(col, row, salt) - 0.5) * TILE_S * 0.10;
                                let jz =
                                    cz + (tile_jitter(col, row, salt + 1) - 0.5) * TILE_S * 0.10;
                                let sc = 0.6 + tile_jitter(col, row, salt + 2) * 0.8;
                                dummy.pos(x + jx, base_y, z + jz);
                                dummy.rot(
                                    (tile_jitter(col, row, salt + 3) - 0.5) * 0.5,
                                    tile_jitter(col, row, salt + 4) * PI * 2.0,
                                    (tile_jitter(col, row, salt + 5) - 0.5) * 0.5,
                                );
                                dummy.scalar(sc);
                                self.instanced[grass].set_matrix_at(gi, &dummy.matrix());
                                let c = if tile_jitter(col, row, salt + 6) < 0.5 {
                                    color_a
                                } else {
                                    color_b
                                };
                                self.instanced[grass].set_color_at(gi, c);
                                gi += 1;
                            }
                        }
                    }
                }
                self.instanced[grass].count = gi;
                self.add_instanced(grass);
            }
        }

        // --- tiny clutter: pebbles + bushes on playable plains ---
        {
            let mut plains_tiles = 0usize;
            for col in PLAY_COL0..=PLAY_COL1 {
                for row in PLAY_ROW0..=PLAY_ROW1 {
                    if tm.at(col, row) == PLAINS {
                        plains_tiles += 1;
                    }
                }
            }
            if plains_tiles > 0 {
                const PEBBLE_CHANCE: f64 = 0.10;
                const BUSH_CHANCE: f64 = 0.06;
                let pebble_geo = Prim::Icosahedron {
                    r: TILE_S * 0.045,
                    detail: 0,
                };
                let pebble_mat = self.scene.lambert_mat(PEBBLE_COLOR, true);
                let bush_geo = Geo::body(FieldGeo::LiftedCone {
                    r: TILE_S * 0.09,
                    h: TILE_S * 0.16,
                    radial: 5,
                    dy: TILE_S * 0.08,
                });
                let bush_mat = self.scene.lambert_mat(bush_color, true);
                let pebbles = self.new_instanced(pebble_geo, pebble_mat, plains_tiles);
                let bushes = self.new_instanced(bush_geo, bush_mat, plains_tiles);
                self.shadows_of(pebbles, false, true);
                self.shadows_of(bushes, true, true);
                let mut dummy = Dummy::new();
                let (mut pi, mut bi2) = (0usize, 0usize);
                for col in PLAY_COL0..=PLAY_COL1 {
                    for row in PLAY_ROW0..=PLAY_ROW1 {
                        if tm.at(col, row) != PLAINS {
                            continue;
                        }
                        let (x, z) = cell_to_world(f64::from(col), f64::from(row));
                        if tile_jitter(col, row, 300) < PEBBLE_CHANCE {
                            let jx = (tile_jitter(col, row, 301) - 0.5) * TILE_S * 0.7;
                            let jz = (tile_jitter(col, row, 302) - 0.5) * TILE_S * 0.7;
                            let sc = 0.7 + tile_jitter(col, row, 303) * 0.8;
                            dummy.pos(x + jx, TILE_S * 0.02 * sc, z + jz);
                            dummy.scalar(sc);
                            dummy.rot(
                                tile_jitter(col, row, 304) * PI,
                                tile_jitter(col, row, 305) * PI,
                                0.0,
                            );
                            self.instanced[pebbles].set_matrix_at(pi, &dummy.matrix());
                            pi += 1;
                        }
                        if tile_jitter(col, row, 310) < BUSH_CHANCE {
                            let jx = (tile_jitter(col, row, 311) - 0.5) * TILE_S * 0.7;
                            let jz = (tile_jitter(col, row, 312) - 0.5) * TILE_S * 0.7;
                            let sc = 0.6 + tile_jitter(col, row, 313) * 0.6;
                            dummy.pos(x + jx, 0.0, z + jz);
                            dummy.scalar(sc);
                            dummy.rot(0.0, tile_jitter(col, row, 314) * PI * 2.0, 0.0);
                            self.instanced[bushes].set_matrix_at(bi2, &dummy.matrix());
                            bi2 += 1;
                        }
                    }
                }
                self.instanced[pebbles].count = pi;
                self.instanced[bushes].count = bi2;
                self.add_instanced(pebbles);
                self.add_instanced(bushes);
            }
        }

        // --- dark ground plane ---
        let mid_col = f64::from(BF_COLS - 1) / 2.0;
        let mid_row = f64::from(BF_ROWS - 1) / 2.0;
        let (mx, mz) = cell_to_world(mid_col, mid_row);
        let world_w = f64::from(BF_COLS) * TILE_S;
        let world_h = f64::from(BF_ROWS) * TILE_S;
        let g_mat = self.scene.add_material(Material::lambert(0x0005_0505));
        let ground = self.mesh(
            ROOT,
            Geo::body(FieldGeo::Plane {
                w: world_w * 2.2,
                h: world_h * 2.2,
            }),
            g_mat,
        );
        self.scene.node(ground).rot_x(-PI / 2.0);
        self.scene.set_pos(ground, mx, -0.16, mz);
        self.scene.receive_shadow(ground);

        self.build_playable_margin_visuals();
    }

    /// `_buildPlayableMarginVisuals()` (`:4879-4962`).
    fn build_playable_margin_visuals(&mut self) {
        let ts = TILE_S;
        let pad = ts * 3.0;
        let inner = ts * 0.15;
        let corner = ts * 0.5;
        let half = ts * 0.5;
        let field_x_min = -half;
        let field_x_max = f64::from(BF_COLS - 1) * ts + half;
        let field_z_min = -half;
        let field_z_max = f64::from(BF_ROWS - 1) * ts + half;
        let play_x_min = f64::from(PLAY_COL0) * ts - half;
        let play_x_max = f64::from(PLAY_COL1) * ts + half;
        let play_z_min = f64::from(PLAY_ROW0) * ts - half;
        let play_z_max = f64::from(PLAY_ROW1) * ts + half;
        let rects = [
            (
                field_x_min - pad,
                play_x_min + inner,
                play_z_min - corner,
                play_z_max + corner,
            ),
            (
                play_x_max - inner,
                field_x_max + pad,
                play_z_min - corner,
                play_z_max + corner,
            ),
            (
                field_x_min - pad,
                field_x_max + pad,
                field_z_min - pad,
                play_z_min + inner,
            ),
            (
                field_x_min - pad,
                field_x_max + pad,
                play_z_max - inner,
                field_z_max + pad,
            ),
        ];
        for (x_min, x_max, z_min, z_max) in rects {
            let (w, h) = (x_max - x_min, z_max - z_min);
            if w <= 0.05 || h <= 0.05 {
                continue;
            }
            let m = self
                .scene
                .add_material(basic_transparent(0x0003_0303, 0.94, false));
            let id = self.mesh(ROOT, Geo::body(FieldGeo::FlatPlane { w, h }), m);
            self.scene
                .set_pos(id, (x_min + x_max) * 0.5, 0.04, (z_min + z_max) * 0.5);
            self.scene.render_order(id, 5);
        }
        let frame_w = f64::from(PLAYABLE_COLS) * ts;
        let frame_h = f64::from(PLAYABLE_ROWS) * ts;
        let (fx, fz) = cell_to_world(f64::from(PLAY_MID_COL), f64::from(PLAY_MID_ROW));
        let mut fm = basic_transparent(0x00d4_af37, 0.35, false);
        fm.side = Side::Double;
        let fm = self.scene.add_material(fm);
        let frame = self.mesh(
            ROOT,
            Geo::body(FieldGeo::FlatPlane {
                w: frame_w + ts * 0.12,
                h: frame_h + ts * 0.12,
            }),
            fm,
        );
        self.scene.set_pos(frame, fx, 0.038, fz);
        self.scene.render_order(frame, 6);

        // refreshInstancedPickBounds(this._battleGroundPickMeshes)
        let pick = self.ground_pick.clone();
        for node in pick {
            if let Some(m) = self.instanced.iter_mut().find(|m| m.node == node) {
                m.compute_bounding_sphere();
            }
        }
    }

    /// `_buildSiegeInteriorBuildings()` (`:3987-4117`); `wall_col` /
    /// `gate_row` are `siegeWallCol` / `siegeGateRow` (−1 when not a siege).
    #[allow(
        clippy::too_many_lines,
        clippy::cast_sign_loss,
        clippy::cast_possible_truncation
    )]
    pub fn build_siege_interior_buildings(
        &mut self,
        tm: &TerrainGrid,
        wall_col: i32,
        gate_row: i32,
    ) {
        if wall_col < 0 {
            return;
        }
        let col_lo = wall_col + 5;
        let col_hi = PLAY_COL1 - 1;
        let row_lo = PLAY_ROW0 + 2;
        let row_hi = PLAY_ROW1 - 2;
        if col_hi < col_lo || row_hi < row_lo {
            return;
        }
        const STREET_HALF: i32 = 3;
        const STEP_COL: usize = 3;
        const STEP_ROW: usize = 3;
        const BUILDING_CAP: usize = 38;
        let mut plots: Vec<(i32, i32, i32)> = Vec::new();
        for col in (col_lo..=col_hi).step_by(STEP_COL) {
            for row in (row_lo..=row_hi).step_by(STEP_ROW) {
                if (row - gate_row).abs() <= STREET_HALF {
                    continue;
                }
                if tm.at(col, row) != PLAINS {
                    continue;
                }
                if tile_jitter(col, row, 901) > 0.82 {
                    continue;
                }
                plots.push((col, row, (row - gate_row).abs()));
            }
        }
        if plots.is_empty() {
            return;
        }
        plots.sort_by_key(|p| p.2); // Array.prototype.sort is stable (ES2019)
        plots.truncate(BUILDING_CAP);
        let n = plots.len();

        let body_geo = Prim::bx(1.0, 1.0, 1.0);
        let gable_geo = Geo::body(FieldGeo::GableRoof);
        let body_mat = self
            .scene
            .add_material(Material::standard(0x00ff_ffff, 0.0, 0.92));
        let gable_mat = self
            .scene
            .add_material(Material::standard(0x00ff_ffff, 0.0, 0.88));
        let flat_mat = self
            .scene
            .add_material(Material::standard(0x00ff_ffff, 0.0, 0.88));
        let bodies = self.new_instanced(body_geo, body_mat, n);
        let gables = self.new_instanced(gable_geo, gable_mat, n);
        let flats = self.new_instanced(body_geo, flat_mat, n);
        self.shadows_of(bodies, true, true);
        self.shadows_of(gables, true, false);
        self.shadows_of(flats, true, false);
        let mut dummy = Dummy::new();
        let (mut gi, mut fi) = (0usize, 0usize);
        for (i, &(col, row, _)) in plots.iter().enumerate() {
            let (x, z) = cell_to_world(f64::from(col), f64::from(row));
            let px = x + (tile_jitter(col, row, 902) - 0.5) * TILE_S * 0.8;
            let pz = z + (tile_jitter(col, row, 903) - 0.5) * TILE_S * 0.8;
            let is_public = i < 2;
            let size_roll = tile_jitter(col, row, 904);
            let (w, d, body_h, roof_h) = if is_public {
                (1.5 + size_roll * 0.3, 1.1 + size_roll * 0.2, 1.7, 0.55)
            } else if size_roll < 0.33 {
                (0.55, 0.5, 0.85, 0.35)
            } else if size_roll < 0.7 {
                (0.72, 0.6, 1.0, 0.4)
            } else {
                (0.85, 0.7, 1.15, 0.45)
            };
            let yaw = tile_jitter(col, row, 905) * PI * 2.0;
            dummy.pos(px, body_h / 2.0, pz);
            dummy.rot(0.0, yaw, 0.0);
            dummy.scale(w, body_h, d);
            self.instanced[bodies].set_matrix_at(i, &dummy.matrix());
            let nb = SIEGE_BLDG_BODY_COLORS.len();
            let b_idx = ((tile_jitter(col, row, 906) * nb as f64).floor() as usize) % nb;
            let b_jit = (tile_jitter(col, row, 907) - 0.5) * 0.14;
            #[allow(clippy::cast_possible_wrap)]
            let body_c = lighten(SIEGE_BLDG_BODY_COLORS[b_idx] as i32, b_jit) as u32;
            self.instanced[bodies].set_color_at(i, Color::from_hex(body_c));

            let roof_roll = tile_jitter(col, row, 908);
            let nr = SIEGE_BLDG_ROOF_COLORS.len();
            let r_idx = ((tile_jitter(col, row, 909) * nr as f64).floor() as usize) % nr;
            let r_jit = (tile_jitter(col, row, 910) - 0.5) * 0.12;
            #[allow(clippy::cast_possible_wrap)]
            let roof_c =
                Color::from_hex(lighten(SIEGE_BLDG_ROOF_COLORS[r_idx] as i32, r_jit) as u32);
            if roof_roll < 0.62 {
                dummy.pos(px, body_h, pz);
                dummy.rot(0.0, yaw, 0.0);
                dummy.scale(w * 1.06, roof_h, d * 1.06);
                self.instanced[gables].set_matrix_at(gi, &dummy.matrix());
                self.instanced[gables].set_color_at(gi, roof_c);
                gi += 1;
            } else {
                dummy.pos(px, body_h + roof_h * 0.4, pz);
                dummy.rot(0.0, yaw, 0.0);
                dummy.scale(w * 1.08, roof_h * 0.8, d * 1.08);
                self.instanced[flats].set_matrix_at(fi, &dummy.matrix());
                self.instanced[flats].set_color_at(fi, roof_c);
                fi += 1;
            }
        }
        self.instanced[bodies].count = n;
        self.instanced[gables].count = gi;
        self.instanced[flats].count = fi;
        self.add_instanced(bodies);
        if gi > 0 {
            self.add_instanced(gables);
        }
        if fi > 0 {
            self.add_instanced(flats);
        }
    }

    /// `_buildDeployZone()` (`:11568-11679`) for the player's side.
    pub fn build_deploy_zone(&mut self, tm: &TerrainGrid, side: DeploySide) {
        let mid_col = DEPLOY_MID_COL;
        let mid_row = PLAY_MID_ROW;
        let world_h = f64::from(PLAYABLE_ROWS) * TILE_S;
        let boundary_x = f64::from(mid_col) * TILE_S - TILE_S * 0.5;
        let zone_z = f64::from(mid_row) * TILE_S;
        let atk = side == DeploySide::Atk;
        let player_col0 = if atk { PLAY_COL0 } else { DEPLOY_DEF_MIN_COL };
        let player_col_end = if atk { mid_col } else { PLAY_COL1 + 1 };
        let enemy_col0 = if atk { mid_col } else { PLAY_COL0 };
        let enemy_col_end = if atk { PLAY_COL1 + 1 } else { mid_col };
        let player_w = f64::from(player_col_end - player_col0) * TILE_S;
        let enemy_w = f64::from(enemy_col_end - enemy_col0) * TILE_S;
        let player_center_x = f64::from(player_col0) * TILE_S + player_w * 0.5 - TILE_S * 0.5;
        let enemy_center_x = f64::from(enemy_col0) * TILE_S + enemy_w * 0.5 - TILE_S * 0.5;

        let group = self.scene.detached_group();
        self.scene.node(group).set_name("deployVisuals");

        let bright_mat = self
            .scene
            .add_material(basic_transparent(0x00c8_e8ff, 0.16, false));
        let bright = self.mesh(
            group,
            Geo::body(FieldGeo::FlatPlane {
                w: player_w,
                h: world_h,
            }),
            bright_mat,
        );
        self.scene.set_pos(bright, player_center_x, 0.035, zone_z);
        self.deploy_zone_meshes.push(bright);

        let tile_geo = Geo::body(FieldGeo::FlatPlane {
            w: TILE_S * 0.94,
            h: TILE_S * 0.94,
        });
        for col in player_col0..player_col_end {
            for row in PLAY_ROW0..=PLAY_ROW1 {
                if !tm.passable(col, row) {
                    continue;
                }
                let mat = self
                    .scene
                    .add_material(basic_transparent(0x0044_bbff, 0.28, false));
                let mesh = self.mesh(group, tile_geo.clone(), mat);
                let (x, z) = cell_to_world(f64::from(col), f64::from(row));
                self.scene.set_pos(mesh, x, 0.045, z);
                self.deploy_zone_meshes.push(mesh);
            }
        }

        let fog_geo = Geo::body(FieldGeo::FlatPlane {
            w: enemy_w,
            h: world_h,
        });
        let fog_mat = self
            .scene
            .add_material(basic_transparent(0x000a_0a12, 0.58, false));
        let fog = self.mesh(group, fog_geo.clone(), fog_mat);
        self.scene.set_pos(fog, enemy_center_x, 0.055, zone_z);
        self.deploy_zone_meshes.push(fog);
        let fog2_mat = self
            .scene
            .add_material(basic_transparent(0x0060_6878, 0.22, false));
        let fog2 = self.mesh(group, fog_geo, fog2_mat);
        self.scene.set_pos(fog2, enemy_center_x, 0.06, zone_z);
        self.deploy_zone_meshes.push(fog2);

        let line_mat = self
            .scene
            .add_material(basic_transparent(0x00d4_af37, 0.92, true));
        let line = self.mesh(group, Prim::bx(0.10, 0.18, world_h * 0.98), line_mat);
        self.scene.set_pos(line, boundary_x, 0.09, zone_z);
        self.deploy_zone_meshes.push(line);

        for (color, dx) in [
            (0x0030_60c0, if atk { -0.12 } else { 0.12 }),
            (0x00cc_4030, if atk { 0.12 } else { -0.12 }),
        ] {
            let em = self
                .scene
                .add_material(basic_transparent(color, 0.65, true));
            let edge = self.mesh(group, Prim::bx(0.04, 0.12, world_h * 0.96), em);
            self.scene.set_pos(edge, boundary_x + dx, 0.085, zone_z);
            self.deploy_zone_meshes.push(edge);
        }

        self.add(group);
        self.deploy_group = Some(group);
    }

    /// `_initDeployGhostLayer()` (`:15213-15222`): the empty `deployGhosts`
    /// group (`renderOrder` 500) the deploy previews draw into.
    pub fn init_deploy_ghost_layer(&mut self) {
        if self.deploy_ghost_group.is_some() {
            return;
        }
        let g = self.scene.add_group(ROOT);
        self.scene.node(g).set_name("deployGhosts");
        self.scene.render_order(g, 500);
        self.deploy_ghost_group = Some(g);
    }

    /// `_appendDeployCellOutline(minCol, minRow, maxCol, maxRow, color,
    /// opacity, dashed)` (`:15246-15274`): a closed 5-point `THREE.Line` on the
    /// tile edges at `tileTopY + 0.08`; no-op without the ghost layer.
    #[allow(clippy::too_many_arguments, clippy::cast_possible_truncation)]
    pub fn append_deploy_cell_outline(
        &mut self,
        tm: &TerrainGrid,
        min_col: i32,
        min_row: i32,
        max_col: i32,
        max_row: i32,
        color: u32,
        opacity: f64,
        dashed: bool,
    ) {
        let Some(ghost) = self.deploy_ghost_group else {
            return;
        };
        let (x_min, x_max, z_min, z_max) = cell_bounds_xz(
            f64::from(min_col),
            f64::from(min_row),
            f64::from(max_col),
            f64::from(max_row),
        );
        let y_lift = 0.08;
        let y00 = tile_top_y(tm, min_col, min_row) + y_lift;
        let y10 = tile_top_y(tm, max_col, min_row) + y_lift;
        let y11 = tile_top_y(tm, max_col, max_row) + y_lift;
        let y01 = tile_top_y(tm, min_col, max_row) + y_lift;
        let pts = vec![
            x_min, y00, z_min, x_max, y10, z_min, x_max, y11, z_max, x_min, y01, z_max, x_min, y00,
            z_min,
        ];
        let mut m = Material::new(MaterialKind::LineBasic, Some(color));
        m.transparent = true;
        m.opacity = opacity;
        let material = self.scene.add_material(m);
        let dash = dashed.then_some(Dash {
            dash_size: TILE_S * 0.22,
            gap_size: TILE_S * 0.14,
            scale: 1.0,
        });
        // computeLineDistances(): running sum of segment lengths of the
        // Float32 positions read back as doubles.
        let line_distances = dashed.then(|| {
            let p32: Vec<f64> = pts.iter().map(|&v| f64::from(v as f32)).collect();
            let mut d = [0.0f64; 5];
            for i in 1..5 {
                let a = Vec3::new(p32[(i - 1) * 3], p32[(i - 1) * 3 + 1], p32[(i - 1) * 3 + 2]);
                let b = Vec3::new(p32[i * 3], p32[i * 3 + 1], p32[i * 3 + 2]);
                d[i] = d[i - 1] + a.distance_to(b);
            }
            d.iter().map(|&v| v as f32).collect()
        });
        let node = self.scene.add_object3d(ghost);
        self.lines.push(OutlineLine {
            node,
            geo: Geo::body(FieldGeo::Polyline(pts)),
            material,
            dash,
            line_distances,
        });
    }
}

// ------------------------------------------------------------ constructor (3D)

/// Which side the player deploys (`deployPlayerSide`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DeploySide {
    /// `'atk'` (left half).
    Atk,
    /// `'def'` (right half).
    Def,
}

/// `renderer` settings of the constructor (`:3304-3311`) as data.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct RendererSettings {
    /// `shadowMap.enabled`.
    pub shadow_map_enabled: bool,
    /// `shadowMap.type` (`THREE.PCFSoftShadowMap` = 2).
    pub shadow_map_type: u32,
    /// `toneMapping` (`THREE.ACESFilmicToneMapping` = 4).
    pub tone_mapping: u32,
    /// `toneMappingExposure`.
    pub tone_mapping_exposure: f64,
}

/// `RendererSettings` of the battle (`:3305-3311`); the pixel ratio is
/// `window.devicePixelRatio` (runtime, not part of the scene).
pub const BATTLE_RENDERER: RendererSettings = RendererSettings {
    shadow_map_enabled: true,
    shadow_map_type: 2,
    tone_mapping: 4,
    tone_mapping_exposure: 1.05,
};

/// `scene.background` + `scene.fog` (`:3314-3315`, final fog `:3359`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct SceneEnv {
    /// `scene.background` (linear `THREE.Color`).
    pub background: Color,
    /// `FogExp2.color` (linear).
    pub fog_color: Color,
    /// `FogExp2.density` (the constructor sets 0.012, then replaces it by
    /// 0.005 — only the final fog exists).
    pub fog_density: f64,
}

/// The battle camera: `PerspectiveCamera(48, 1, 0.1, 4000)` + the dolly
/// state of `BattleScene` (`camTarget`, `camDir`, `camDist*`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct BattleCamera {
    /// `fov` (degrees).
    pub fov: f64,
    /// `aspect` (1 until `_onResize`/`_syncRendererSize`).
    pub aspect: f64,
    /// `near`.
    pub near: f64,
    /// `far`.
    pub far: f64,
    /// `zoom`.
    pub zoom: f64,
    /// `camera.position`.
    pub position: Vec3,
    /// `camera.quaternion`.
    pub quaternion: Quat,
    /// `camera.rotation` (XYZ, kept in sync with the quaternion).
    pub rotation: Vec3,
    /// `camera.up`.
    pub up: Vec3,
    /// `camTarget`.
    pub target: Vec3,
    /// `camDir` (unit).
    pub dir: Vec3,
    /// `camDist`.
    pub dist: f64,
    /// `camDistTarget`.
    pub dist_target: f64,
    /// `camDistMin`.
    pub dist_min: f64,
    /// `camDistMax`.
    pub dist_max: f64,
}

impl BattleCamera {
    /// A fresh `PerspectiveCamera(48, 1, 0.1, 4000)` with the class-field
    /// defaults of `BattleScene` (`:2080-2085`: target 0, dir
    /// `(0, 0.92, 0.92).normalize()`, dist 30, min 3, max 70).
    #[must_use]
    pub fn new() -> Self {
        Self {
            fov: 48.0,
            aspect: 1.0,
            near: 0.1,
            far: 4000.0,
            zoom: 1.0,
            position: Vec3::new(0.0, 0.0, 0.0),
            quaternion: Quat::IDENTITY,
            rotation: Vec3::new(0.0, 0.0, 0.0),
            up: Vec3::new(0.0, 1.0, 0.0),
            target: Vec3::new(0.0, 0.0, 0.0),
            dir: Vec3::new(0.0, 0.92, 0.92).normalize(),
            dist: 30.0,
            dist_target: 30.0,
            dist_min: 3.0,
            dist_max: 70.0,
        }
    }

    /// `_applyCamera()` (`:9872-9880`): position on the dolly line (distance
    /// clamped), then `camera.lookAt(camTarget)`.
    pub fn apply(&mut self) {
        let d = js_max(self.dist_min, js_min(self.dist_max, self.dist));
        self.position = Vec3::new(
            self.target.x + self.dir.x * d,
            self.target.y + self.dir.y * d,
            self.target.z + self.dir.z * d,
        );
        // Object3D.lookAt for a camera: _m1.lookAt(worldPosition, target, up).
        let m = Mat4::look_at(self.position, self.target, self.up);
        self.quaternion = Quat::from_rotation_matrix(&m);
        self.rotation = euler_xyz_from_quaternion(self.quaternion);
    }

    /// `matrixWorld` after `updateMatrixWorld()` (no parent).
    #[must_use]
    pub fn world_matrix(&self) -> Mat4 {
        Mat4::compose(self.position, self.quaternion, Vec3::new(1.0, 1.0, 1.0))
    }

    /// `projectionMatrix` (`updateProjectionMatrix`, no view offset / film offset).
    #[must_use]
    pub fn projection_matrix(&self) -> Mat4 {
        let top = self.near * js_tan(PI / 180.0 * 0.5 * self.fov) / self.zoom;
        let height = 2.0 * top;
        let width = self.aspect * height;
        let left = -0.5 * width;
        Mat4::make_perspective(left, left + width, top, top - height, self.near, self.far)
    }
}

impl Default for BattleCamera {
    fn default() -> Self {
        Self::new()
    }
}

/// `Euler.setFromQuaternion(q, 'XYZ')` (via `makeRotationFromQuaternion` +
/// `setFromRotationMatrix`).
#[must_use]
pub fn euler_xyz_from_quaternion(q: Quat) -> Vec3 {
    let m = Mat4::compose(Vec3::new(0.0, 0.0, 0.0), q, Vec3::new(1.0, 1.0, 1.0));
    let te = &m.e;
    let (m11, m12, m13) = (te[0], te[4], te[8]);
    let (m22, m23) = (te[5], te[9]);
    let (m32, m33) = (te[6], te[10]);
    let y = js_asin(js_max(-1.0, js_min(1.0, m13)));
    if m13.abs() < 0.999_999_9 {
        Vec3::new(js_atan2(-m23, m33), y, js_atan2(-m12, m11))
    } else {
        Vec3::new(js_atan2(m32, m22), y, 0.0)
    }
}

/// Options of the 3D part of `new BattleScene(opts)`.
#[derive(Debug, Clone, PartialEq)]
pub struct BattleSceneOpts {
    /// The terrain grid after `generateBattleTerrain` + `_carveBattleBox` +
    /// `_fencePlayableZone` (`:2686-2703`; ZAŁOŻENIE Z-36-3).
    pub grid: TerrainGrid,
    /// `terrainPreset.desertPalette` (`:2676`).
    pub desert_palette: bool,
    /// `opts.siege != null` (wall carve + city interior; the wall mesh
    /// itself is part 3).
    pub siege: bool,
    /// `opts.deploy === true` with `deployPlayerSide` (default `'atk'`).
    pub deploy: Option<DeploySide>,
}

/// The static battlefield: scene + render metadata.
#[derive(Debug, Clone, PartialEq)]
pub struct BattleField {
    /// Scene tree and side tables.
    pub field: FieldScene,
    /// Renderer settings.
    pub renderer: RendererSettings,
    /// Background and fog.
    pub env: SceneEnv,
    /// Camera after the constructor's `_applyCamera`.
    pub camera: BattleCamera,
    /// The terrain grid after `_carveWallTiles` (siege).
    pub grid: TerrainGrid,
    /// Siege fields (`None` when not a siege).
    pub siege: Option<SiegeLayout>,
}

/// The 3D part of `new BattleScene(opts)` (`:2702-2708`, `:3304-3389`) with
/// empty armies: siege carve, renderer/background/fog, camera, lights,
/// order-line groups, battlefield, city interior, deploy zone + ghost layer.
/// The siege wall (`_placeSiegeWall`) and units are part 3.
#[must_use]
pub fn build_battle_scene(opts: BattleSceneOpts) -> BattleField {
    let mut grid = opts.grid;
    let siege = opts.siege.then(|| carve_wall_tiles(&mut grid));
    let mut f = FieldScene::new();

    let bg = Color::from_hex(0x0005_070b);
    let env = SceneEnv {
        background: bg,
        fog_color: Color::from_hex(0x0005_070b),
        fog_density: 0.005,
    };

    let (cx, cz) = cell_to_world(f64::from(PLAY_MID_COL), f64::from(PLAY_MID_ROW));
    let field_world_w = f64::from(BF_COLS) * TILE_S;
    let field_world_h = f64::from(BF_ROWS) * TILE_S;
    let field_span = js_max(field_world_w, field_world_h);
    let play_world_w = f64::from(PLAYABLE_COLS) * TILE_S;
    let play_world_h = f64::from(PLAYABLE_ROWS) * TILE_S;
    let play_span = js_max(play_world_w, play_world_h);
    let mut camera = BattleCamera::new();
    camera.target = Vec3::new(cx, 0.0, cz);
    camera.dist = play_span * 0.92;
    camera.dist_target = camera.dist;
    camera.dist_min = js_max(2.0, play_span * 0.07);
    camera.dist_max = field_span * 1.65;
    camera.apply();

    // Lights (`:3339-3357`).
    let ambient = f.scene.add_object3d(ROOT);
    f.lights.push(Light {
        node: ambient,
        kind: LightKind::Ambient,
        color: Color::from_hex(0x00ff_f8e0),
        intensity: 0.45,
    });
    let hemi = f.scene.add_object3d(ROOT);
    f.scene.set_pos(hemi, 0.0, 1.0, 0.0); // Object3D.DEFAULT_UP
    f.lights.push(Light {
        node: hemi,
        kind: LightKind::Hemisphere {
            ground: Color::from_hex(0x004a_4030),
        },
        color: Color::from_hex(0x00bf_d4ff),
        intensity: 0.35,
    });
    let sun = f.scene.add_object3d(ROOT);
    f.scene.set_pos(sun, cx + 20.0, 70.0, cz - 30.0);
    f.scene.cast_shadow(sun);
    let sun_target = f.scene.add_object3d(ROOT);
    f.scene.set_pos(sun_target, cx, 0.0, cz);
    f.lights.push(Light {
        node: sun,
        kind: LightKind::Directional {
            target_node: Some(sun_target),
            target_position: GVec3::new(cx, 0.0, cz),
            shadow: DirectionalShadow {
                map_size: (2048.0, 2048.0),
                near: 1.0,
                far: 220.0,
                left: -field_world_w * 0.6,
                right: field_world_w * 0.6,
                top: field_world_h * 0.7,
                bottom: -field_world_h * 0.7,
                ..DirectionalShadow::default()
            },
        },
        color: Color::from_hex(0x00ff_e8b0),
        intensity: 1.15,
    });
    let fill = f.scene.add_object3d(ROOT);
    f.scene.set_pos(fill, cx - 20.0, 24.0, cz + 30.0);
    f.lights.push(Light {
        node: fill,
        kind: LightKind::Directional {
            target_node: None,
            target_position: GVec3::new(0.0, 0.0, 0.0),
            shadow: DirectionalShadow::default(),
        },
        color: Color::from_hex(0x0080_90c0),
        intensity: 0.30,
    });

    // Order-line groups (`:3361-3366`; filled by part 3).
    let order_lines = f.scene.add_group(ROOT);
    f.scene.node(order_lines).set_name("orderLines");
    let order_preview = f.scene.add_group(order_lines);
    f.scene.node(order_preview).set_name("orderPreview");

    f.build_battlefield(&grid, opts.desert_palette);
    if let Some(s) = &siege {
        // `_placeSiegeWall` (part 3) would add the wall group here.
        f.build_siege_interior_buildings(&grid, s.wall_col, s.gate_row);
    }
    if let Some(side) = opts.deploy {
        f.build_deploy_zone(&grid, side);
        f.init_deploy_ghost_layer();
    }
    BattleField {
        field: f,
        renderer: BATTLE_RENDERER,
        env,
        camera,
        grid,
        siege,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn constants_follow_their_web_formulas() {
        assert_eq!(
            f64::from(PLAYABLE_COLS),
            js_round(f64::from(BF_COLS) * std::f64::consts::FRAC_1_SQRT_2)
        );
        assert_eq!(
            f64::from(PLAYABLE_ROWS),
            js_round(f64::from(BF_ROWS) * std::f64::consts::FRAC_1_SQRT_2)
        );
        assert_eq!(MAX_RANKS, 6);
        assert_eq!(
            (PLAY_COL0, PLAY_ROW0, PLAY_COL1, PLAY_ROW1),
            (10, 23, 57, 132)
        );
        assert_eq!(
            (PLAY_MID_COL, PLAY_MID_ROW, ATK_FRONT_COL, DEF_FRONT_COL),
            (33, 77, 31, 36)
        );
    }

    #[test]
    fn tile_jitter_is_in_unit_interval() {
        for c in -3..70 {
            for s in [0, 7, 101, 901, 2_000_000_000] {
                let v = tile_jitter(c, c * 3 - 1, s);
                assert!((0.0..1.0).contains(&v));
            }
        }
    }

    #[test]
    fn carve_ignores_writes_past_a_short_grid() {
        let mut g = TerrainGrid::new(4, 4, vec![0; 16]);
        let s = carve_wall_tiles(&mut g);
        assert_eq!(s.wall_col, 40);
        assert!(g.tiles.iter().all(|&t| t == 0));
        assert_eq!(s.wall_tile_hp.len(), 154);
    }
}
