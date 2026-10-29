//! `battle` — MOD-14 "battle 3D" of the P4.4 model catalogue
//! (`dyspozycje/rust-port/p4/P4-4-MODEL-CATALOG.md` §5, row 14; owner
//! decision D-REND-8 = B: the whole 3D battle is part of P4; topic
//! R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q1, document
//! `dyspozycje/rust-port/p4/P4-36-MOD14-BATTLE-3D.md`).
//!
//! CPU port, 1:1 with the web at pin `edb8fb56`:
//!
//! | web file | module | output | round |
//! |---|---|---|---|
//! | `battle/siegeWall.ts` (1 047 LOC) | [`siege_wall`] | [`siege_wall::SiegeWall`]: the wall group as a [`crate::scene::Scene`] + its `userData` contract | 1 |
//! | `battle/battleScene.ts` (static field: `_buildBattlefield`, margins, `_carveWallTiles`, city interior, deploy zone, constructor lights/fog/camera) | [`field`] | [`field::BattleField`]: [`crate::scene::Scene`] + side tables (instanced meshes, lights, outlines) + render metadata | 2 (topic …-Q2) |
//! | `battle/battleScene.ts` (units, dynamics, picking) | — | — | 3–5 (plan in the document) |
//!
//! Only the 3D scene is ported here. Battle game logic (turn order, AI,
//! damage) belongs to `domain/combat.rs` (P6.13) and the DOM UI to P5; the
//! scene takes a battle-state DTO and returns a `Scene` tree.
//!
//! Nothing here needs a GPU; `Math.*` goes through [`crate::jsmath`]. Models
//! are verified against vectors produced by running the web code
//! (`tests/battle3d_siege_wall.rs`, `tests/battle3d_field.rs`,
//! `tests/fixtures/battle3d/`).

pub mod dynamics;
pub mod field;
pub mod siege_wall;
pub mod units;

pub use siege_wall::{
    attach_row_breach_panels, build_siege_wall, build_siege_wall_web_id, SiegeWall, SiegeWallOpts,
    SiegeWallUserData,
};
