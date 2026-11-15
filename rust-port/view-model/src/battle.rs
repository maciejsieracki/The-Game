//! Battle start (contract §3.8 `BattleViewDto`, "Start").
//!
//! The contract makes the setup the renderer's `BattleUnitsOpts`
//! (`renderer/src/battle/units.rs:842-852`) with `TerrainGrid`
//! (`battle/field.rs:353-360`), `BattleSceneOpts` (`field.rs:1978-1989`),
//! `UnitSpawn` (`units.rs:510-541`) and `FortDto` (`units.rs:726-733`). This
//! crate must not depend on the renderer (D-DTO-1 = A), so the same fields are
//! mirrored here as plain data; the adapter (P4-1G) builds the renderer
//! structs from them. The battle event stream ("Przebieg") is decision D-DTO-7,
//! not taken yet — no type for it here.
//!
//! Web literals cite the pin `07d2fbd72` (`gra/src/…`).

use crate::ids::UnitId;
use serde::{Deserialize, Serialize};

/// Battle side `'atk' | 'def'` (`battle/battleScene.ts:522`, `:1074`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum BattleSide {
    /// `'atk'`.
    Atk,
    /// `'def'`.
    Def,
}

/// City fortification of the battle, `CityFortificationKind`
/// (`game/city-fortification.ts:26`); the battle reads it as `fortKind`
/// (`battle/battleScene.ts:2440`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FortKind {
    /// `'none'`.
    None,
    /// `'palisada'`.
    Palisada,
    /// `'mur'`.
    Mur,
}

/// Tower material `'drewno' | 'kamien'` (`battle/siegeWall.ts:1105`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TowerMaterial {
    /// `'drewno'`.
    Drewno,
    /// `'kamien'`.
    Kamien,
}

/// Battle terrain grid (renderer `TerrainGrid`): `tiles.len() == cols * rows`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BattleGridDto {
    /// `cols`.
    pub cols: i32,
    /// `rows`.
    pub rows: i32,
    /// `tiles` (`Uint8Array`).
    pub tiles: Vec<u8>,
}

/// Wall/tower setup (renderer `FortDto`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BattleFortDto {
    /// `this.fortKind`.
    pub kind: FortKind,
    /// `towerMaterialFor(fortKind)` (`None` = `null`).
    pub tower_material: Option<TowerMaterial>,
    /// `towerRows(…)`.
    pub tower_rows: Vec<i32>,
}

/// One unit at battle start (renderer `UnitSpawn`).
///
/// `ammoLeft`/`ammoMax`: the web uses `Infinity` for unlimited ammunition
/// (`ammoCount`, `battle/battleScene.ts:1434-1448`), which JSON cannot carry
/// (`JSON.stringify(Infinity)` is `null`). The DTO says `None` = unlimited;
/// the adapter maps `None` back to `f64::INFINITY`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BattleUnitSpawnDto {
    /// `bu.id` (adapter: `Display` → `String`).
    pub id: UnitId,
    /// Side.
    pub side: BattleSide,
    /// `bu.kategoria` (model routing; same `category_of` as the map, D-MOD-9).
    pub category: String,
    /// `String(bu.stats?.Jednostka ?? bu.nazwa)`.
    pub model_name: String,
    /// `bu.ownerColor`, `0xRRGGBB`.
    pub owner_color: u32,
    /// Column `q`.
    pub col: i32,
    /// Row `r`.
    pub row: i32,
    /// `facing` (`Dir`).
    pub facing: i32,
    /// `onWallWalkway`.
    pub on_wall_walkway: bool,
    /// `bu.hp`.
    pub hp: f64,
    /// `bu.maxHp`.
    pub max_hp: f64,
    /// `morale` at spawn.
    pub morale: f64,
    /// `moraleMax`.
    pub morale_max: f64,
    /// `ammoLeft` at spawn; `None` = unlimited (`Infinity`).
    pub ammo_left: Option<f64>,
    /// `ammoMax`; `None` = unlimited (`Infinity`).
    pub ammo_max: Option<f64>,
}

/// Battle start (renderer `BattleUnitsOpts` + `BattleSceneOpts` + `FortDto`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BattleSetupDto {
    /// Terrain grid after `generateBattleTerrain` + carving.
    pub grid: BattleGridDto,
    /// `terrainPreset.desertPalette`.
    pub desert_palette: bool,
    /// `opts.siege != null`.
    pub siege: bool,
    /// `opts.deploy === true` with `deployPlayerSide`; `None` = no deploy.
    pub deploy: Option<BattleSide>,
    /// `siege_wall_civ(civ, defCiv)`.
    pub siege_civ: String,
    /// `_playerControlSide()`.
    pub player_side: BattleSide,
    /// Units in the web spawn order.
    pub units: Vec<BattleUnitSpawnDto>,
    /// Wall/tower setup.
    pub fort: BattleFortDto,
}

/// Battle view (contract §3.8).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BattleViewDto {
    /// Start of the battle scene.
    pub setup: BattleSetupDto,
}
