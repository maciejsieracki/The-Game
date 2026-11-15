//! Q4 `R-RUSTPORT-P4-1G-Q4-ADAPTER-BATTLE`: the battle start, DTO → renderer
//! input (`P4-1G-ADAPTER-ROZPOZNANIE.md` §3.8, §7).
//!
//! `BattleSetupDto` (`view-model/src/battle.rs:119`) → [`BattleUnitsOpts`]
//! (`battle/units.rs:842-853`) + [`FortDto`] (`units.rs:726-733`), the two
//! arguments of [`crate::battle::units::build_battle_scene_with_units_fort`].
//! Pin `07d2fbd72` (`gra/src/battle/battleScene.ts`):
//! - `grid` → [`TerrainGrid`]: the grid after `generateBattleTerrain` +
//!   carving (`_buildBattlefield(opts.teren)`, `:3478`);
//! - `desert_palette` → `this._desertPalette = terrainPreset.desertPalette`
//!   (`:2782`);
//! - `siege` → `if (opts.siege)` (`:3479`);
//! - `deploy` → `this._deployMode = opts.deploy === true` with
//!   `this._deployPlayerSideOpt = opts.deployPlayerSide ?? 'atk'`
//!   (`:3484-3485`): `Some(side)` ↔ deploy mode on that side;
//! - `siege_civ` → `(opts.siege.defCiv ?? opts.siege.civ) ?? 'rzym'`
//!   (`:3480`, resolved by the producer, [`crate::battle::units::siege_wall_civ`]);
//! - `player_side` → `_playerControlSide()` = `this._deployPlayerSideOpt`
//!   (`:12396-12397`);
//! - `units[]` → [`UnitSpawn`] in the web spawn order; `ammoLeft` /
//!   `ammoMax` are `ammo0 = ammoCount(bu)` (`:4512`, `:4553-4554`), which is
//!   `Infinity` for unlimited ammunition (`:1444-1446`). JSON cannot carry
//!   `Infinity`, so the DTO says `None` (`view-model/src/battle.rs:76-80`) and
//!   this adapter maps `None` back to [`f64::INFINITY`];
//! - `fort` → [`FortDto`]: `this.fortKind` (`:2440`, `:2741`),
//!   `towerMaterialFor(this.fortKind)` (`:4160`; `null` ↔ `None`, kept as
//!   `None` — the web returns before placing towers, `:4161`) and
//!   `towerRows(…)` (`:4169-4173`).
//!
//! No game rules: `towerMaterialFor` / `towerRows` / `ammoCount` /
//! `siege_wall_civ` are the producer's; the adapter neither recomputes nor
//! checks them. A DTO the renderer input cannot represent (a grid whose
//! `tiles` length is not `cols * rows`, which [`TerrainGrid::new`] would
//! panic on; a siege without a wall civ; a deploy side other than the
//! player side) is reported as
//! [`BattleAdapterError`], never replaced by a default.

use civ_view_model as vm;

use super::convert::{battle_side, fort_kind, tower_material, unit_id_string};
use crate::battle::field::{BattleSceneOpts, DeploySide, TerrainGrid};
use crate::battle::units::{BattleUnitsOpts, FortDto, UnitSpawn};

/// A battle DTO the renderer input cannot represent. Reported, never
/// replaced by a default.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BattleAdapterError {
    /// `grid.cols` / `grid.rows` negative, or `grid.tiles.len()` not
    /// `cols * rows` (the renderer's [`TerrainGrid`] invariant).
    GridSize {
        /// `grid.cols`.
        cols: i32,
        /// `grid.rows`.
        rows: i32,
        /// `grid.tiles.len()`.
        tiles: usize,
    },
    /// `siege == true` with an empty `siege_civ`: the producer resolves the
    /// wall civ with the `'rzym'` fallback (`battleScene.ts:3480`), so an
    /// empty key is a missing value, not a fallback case.
    MissingSiegeCiv,
    /// `deploy == Some(side)` with `player_side != side`. In the web both
    /// come from one field: `_deployPlayerSideOpt = opts.deployPlayerSide
    /// ?? 'atk'` (`battleScene.ts:3485`) is the deploy side and
    /// `_playerControlSide()` (`:12396-12397`), so the web cannot produce
    /// this pair.
    DeploySideMismatch {
        /// `deploy` side.
        deploy: vm::BattleSide,
        /// `player_side`.
        player_side: vm::BattleSide,
    },
}

impl std::fmt::Display for BattleAdapterError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::GridSize { cols, rows, tiles } => {
                write!(f, "battle grid {cols}x{rows} with {tiles} tiles")
            }
            Self::MissingSiegeCiv => write!(f, "siege battle without a wall civ"),
            Self::DeploySideMismatch {
                deploy,
                player_side,
            } => write!(
                f,
                "deploy side {deploy:?} differs from player side {player_side:?}"
            ),
        }
    }
}

impl std::error::Error for BattleAdapterError {}

/// The renderer inputs of one battle start: the two arguments of
/// `build_battle_scene_with_units_fort(opts, &fort)`.
#[derive(Debug, Clone, PartialEq)]
pub struct BattleInputs {
    /// `new BattleScene(opts)` with armies.
    pub opts: BattleUnitsOpts,
    /// `fortKind` + `towerMaterialFor` + `towerRows`.
    pub fort: FortDto,
}

/// `ammoLeft` / `ammoMax`: `None` (unlimited, `Infinity` in the web,
/// `battleScene.ts:1446`) → [`f64::INFINITY`]; a finite count unchanged.
#[must_use]
pub const fn ammo(v: Option<f64>) -> f64 {
    match v {
        Some(n) => n,
        None => f64::INFINITY,
    }
}

/// `deployPlayerSide` → [`DeploySide`].
#[must_use]
pub const fn deploy_side(s: vm::BattleSide) -> DeploySide {
    match s {
        vm::BattleSide::Atk => DeploySide::Atk,
        vm::BattleSide::Def => DeploySide::Def,
    }
}

/// `grid` → [`TerrainGrid`].
///
/// # Errors
///
/// [`BattleAdapterError::GridSize`] when a size is negative or the tile
/// count is not `cols * rows`.
pub fn terrain_grid(g: &vm::BattleGridDto) -> Result<TerrainGrid, BattleAdapterError> {
    let err = || BattleAdapterError::GridSize {
        cols: g.cols,
        rows: g.rows,
        tiles: g.tiles.len(),
    };
    let cols = usize::try_from(g.cols).map_err(|_| err())?;
    let rows = usize::try_from(g.rows).map_err(|_| err())?;
    if cols.checked_mul(rows) != Some(g.tiles.len()) {
        return Err(err());
    }
    Ok(TerrainGrid {
        cols: g.cols,
        rows: g.rows,
        tiles: g.tiles.clone(),
    })
}

/// One `units[]` entry → [`UnitSpawn`] (fields 1:1; `id` as its decimal
/// string; ammunition via [`ammo`]).
#[must_use]
pub fn unit_spawn(u: &vm::BattleUnitSpawnDto) -> UnitSpawn {
    UnitSpawn {
        id: unit_id_string(u.id),
        side: battle_side(u.side),
        category: u.category.clone(),
        model_name: u.model_name.clone(),
        owner_color: u.owner_color,
        col: u.col,
        row: u.row,
        facing: u.facing,
        on_wall_walkway: u.on_wall_walkway,
        hp: u.hp,
        max_hp: u.max_hp,
        morale: u.morale,
        morale_max: u.morale_max,
        ammo_left: ammo(u.ammo_left),
        ammo_max: ammo(u.ammo_max),
    }
}

/// `fort` → [`FortDto`] (enums 1:1, `tower_material: None` stays `None` =
/// `towerMaterialFor(…) === null`, rows unchanged).
#[must_use]
pub fn battle_fort(f: &vm::BattleFortDto) -> FortDto {
    FortDto {
        kind: fort_kind(f.kind),
        tower_material: f.tower_material.map(tower_material),
        tower_rows: f.tower_rows.clone(),
    }
}

/// `BattleSetupDto` → [`BattleInputs`].
///
/// # Errors
///
/// [`BattleAdapterError`] for a grid of the wrong size, a siege without
/// a wall civ, or a deploy side that is not the player side.
pub fn battle_inputs(s: &vm::BattleSetupDto) -> Result<BattleInputs, BattleAdapterError> {
    if s.siege && s.siege_civ.is_empty() {
        return Err(BattleAdapterError::MissingSiegeCiv);
    }
    if let Some(d) = s.deploy {
        if d != s.player_side {
            return Err(BattleAdapterError::DeploySideMismatch {
                deploy: d,
                player_side: s.player_side,
            });
        }
    }
    let opts = BattleUnitsOpts {
        field: BattleSceneOpts {
            grid: terrain_grid(&s.grid)?,
            desert_palette: s.desert_palette,
            siege: s.siege,
            deploy: s.deploy.map(deploy_side),
        },
        siege_civ: s.siege_civ.clone(),
        player_side: battle_side(s.player_side),
        units: s.units.iter().map(unit_spawn).collect(),
    };
    Ok(BattleInputs {
        opts,
        fort: battle_fort(&s.fort),
    })
}

/// `BattleViewDto` → [`BattleInputs`] of its `setup`.
///
/// # Errors
///
/// As [`battle_inputs`].
pub fn battle_view_inputs(v: &vm::BattleViewDto) -> Result<BattleInputs, BattleAdapterError> {
    battle_inputs(&v.setup)
}
