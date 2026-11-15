//! The conversion patterns shared by the whole adapter
//! (`P4-1G-ADAPTER-ROZPOZNANIE.md` §2): coordinates, ids, owners, `seed`
//! and the enums the DTO and the renderer both define.
//!
//! Every enum conversion is an exhaustive `match` without a wildcard: a new
//! DTO variant without a renderer counterpart does not compile, so there is
//! no silent default. Unknown *strings* are rejected one step earlier, when
//! the DTO is parsed (`civ-view-model` enums have no catch-all variant).

use civ_view_model as vm;

use super::ViewAdapterError;
use crate::battle::siege_towers::TowerMaterial;
use crate::battle::units::{BattleSide, FortKind};
use crate::geom::js_num::to_int32;
use crate::models::cities::outline::CityMapOutlineKind;
use crate::models::cities::renderer::CityWallKind;
use crate::models::misc::build_highlight::BuildHighlightHex;
use crate::models::misc::siege::SiegeMachineKind;
use crate::models::misc::trade::TradeMedium;
use crate::models::misc::HexKey;
use crate::pick::hex::HexCoord;
use crate::pick::terrain::Terrain;
use crate::terrain::RiverKind;

// ------------------------------------------------------------ coordinates

/// (a) `pick::hex::HexCoord` — terrain, picking, fog sets of the prisms.
#[must_use]
pub const fn pick_hex(h: vm::HexCoord) -> HexCoord {
    HexCoord::new(h.q, h.r)
}

/// (b) `HexKey = (q, r)` — overlays (`OverlayMap`, `HexKeySet`, worker
/// fields).
#[must_use]
pub const fn hex_key(h: vm::HexCoord) -> HexKey {
    (h.q, h.r)
}

/// (c) the web key `` `${q},${r}` `` — `CityRenderer` / `WonderRenderer`
/// fog sets, siege camp maps (`core::hexutil::hex_key`).
#[must_use]
pub fn hex_key_string(h: vm::HexCoord) -> String {
    crate::core::hexutil::hex_key(pick_hex(h))
}

/// (d) `(q, r)` as JS numbers — `CampUnit { q, r }` and similar `f64`
/// inputs. Every `i32` is exact in `f64`.
#[must_use]
pub fn hex_f64(h: vm::HexCoord) -> (f64, f64) {
    (f64::from(h.q), f64::from(h.r))
}

/// (d) `BuildHighlightHex { q, r }` (`build_highlight.rs:23`).
#[must_use]
pub fn hex_build_highlight(h: vm::HexCoord) -> BuildHighlightHex {
    let (q, r) = hex_f64(h);
    BuildHighlightHex { q, r }
}

// ------------------------------------------------------------ ids

/// `CityId` → the renderer's `String` id (`City.id`, camp maps): decimal,
/// the `Display` of the id (D-DTO-2 = B).
#[must_use]
pub fn city_id_string(id: vm::CityId) -> String {
    id.to_string()
}

/// `UnitId` → the renderer's `String` id (`UnitPickModel.id`,
/// `UnitSpawn.id`).
#[must_use]
pub fn unit_id_string(id: vm::UnitId) -> String {
    id.to_string()
}

// ------------------------------------------------------------ owners

/// Owner as the renderer's `i64` (`build_territory_border_group`,
/// `SiegeMarkerSyncOptions`, `CampUnit.owner_id`): the legacy number
/// (`-99` rebels, `-1` barbarians, player id).
#[must_use]
pub const fn owner_i64(o: vm::OwnerRef) -> i64 {
    o.legacy_i64()
}

/// Owner as the renderer's `i32` (`City.owner_id`, `PlacedWonder.owner_id`,
/// `apply_fog_visibility(player_owner_id)`).
///
/// # Errors
///
/// [`ViewAdapterError::OwnerOutOfI32`] when the legacy number does not fit
/// `i32` (a player id `> i32::MAX`): an error, never a truncation or a
/// saturation.
pub fn owner_i32(o: vm::OwnerRef) -> Result<i32, ViewAdapterError> {
    let value = owner_i64(o);
    i32::try_from(value).map_err(|_| ViewAdapterError::OwnerOutOfI32 { value })
}

/// Owner as a JS number (`CityOkolicaOverlayParams.owner_id`,
/// `sync_worker_field_overlay(…, player_owner_id)`). Exact: the legacy number
/// is within `±(2^53 − 1)`.
#[must_use]
#[allow(clippy::cast_precision_loss)]
pub const fn owner_f64(o: vm::OwnerRef) -> f64 {
    owner_i64(o) as f64
}

// ------------------------------------------------------------ seed

/// `map.seed | 0` → `TerrainInput.seed` (`terrain/mod.rs`): JavaScript
/// `ToInt32`, the shared [`crate::geom::js_num`] function (wraps modulo
/// `2^32`; `NaN`/`±Infinity` → `0`), not Rust's saturating `as i32`.
#[must_use]
pub fn seed_i32(seed: f64) -> i32 {
    to_int32(seed)
}

// ------------------------------------------------------------ enums

/// `Terrain` (`map.rs:12`) → `pick::terrain::Terrain` (same 8 variants).
#[must_use]
pub const fn terrain(t: vm::Terrain) -> Terrain {
    match t {
        vm::Terrain::Laka => Terrain::Laka,
        vm::Terrain::Rownina => Terrain::Rownina,
        vm::Terrain::Wzgorza => Terrain::Wzgorza,
        vm::Terrain::Gory => Terrain::Gory,
        vm::Terrain::PlytkieMorze => Terrain::PlytkieMorze,
        vm::Terrain::Morze => Terrain::Morze,
        vm::Terrain::Pustynia => Terrain::Pustynia,
        vm::Terrain::Polarny => Terrain::Polarny,
    }
}

/// `RiverKind` (`map.rs:78`) → `terrain::RiverKind`.
#[must_use]
pub const fn river_kind(k: vm::RiverKind) -> RiverKind {
    match k {
        vm::RiverKind::Main => RiverKind::Main,
        vm::RiverKind::Medium => RiverKind::Medium,
        vm::RiverKind::Short => RiverKind::Short,
        vm::RiverKind::Tributary => RiverKind::Tributary,
    }
}

/// `WallKind` (`owners.rs:49`) → `CityWallKind` (`cities.ts:275`).
#[must_use]
pub const fn city_wall_kind(k: vm::WallKind) -> CityWallKind {
    match k {
        vm::WallKind::None => CityWallKind::None,
        vm::WallKind::Palisada => CityWallKind::Palisada,
        vm::WallKind::Stone => CityWallKind::Stone,
    }
}

/// `MapOutlineKind` (`owners.rs:11`) → `CityMapOutlineKind`.
#[must_use]
pub const fn map_outline_kind(k: vm::MapOutlineKind) -> CityMapOutlineKind {
    match k {
        vm::MapOutlineKind::Player => CityMapOutlineKind::Player,
        vm::MapOutlineKind::War => CityMapOutlineKind::War,
        vm::MapOutlineKind::Neutral => CityMapOutlineKind::Neutral,
        vm::MapOutlineKind::Ally => CityMapOutlineKind::Ally,
    }
}

/// `TradeMedium` (`overlays.rs:71`) → `models::misc::trade::TradeMedium`.
#[must_use]
pub const fn trade_medium(m: vm::TradeMedium) -> TradeMedium {
    match m {
        vm::TradeMedium::Lad => TradeMedium::Lad,
        vm::TradeMedium::Morze => TradeMedium::Morze,
    }
}

/// `SiegeMachineKind` (`overlays.rs:12`) → `models::misc::siege`.
#[must_use]
pub const fn siege_machine_kind(k: vm::SiegeMachineKind) -> SiegeMachineKind {
    match k {
        vm::SiegeMachineKind::Taran => SiegeMachineKind::Taran,
        vm::SiegeMachineKind::Wieza => SiegeMachineKind::Wieza,
    }
}

/// `BattleSide` (`battle.rs:20`) → `battle::units::BattleSide`.
#[must_use]
pub const fn battle_side(s: vm::BattleSide) -> BattleSide {
    match s {
        vm::BattleSide::Atk => BattleSide::Atk,
        vm::BattleSide::Def => BattleSide::Def,
    }
}

/// `FortKind` (`battle.rs:32`) → `battle::units::FortKind`.
#[must_use]
pub const fn fort_kind(k: vm::FortKind) -> FortKind {
    match k {
        vm::FortKind::None => FortKind::None,
        vm::FortKind::Palisada => FortKind::Palisada,
        vm::FortKind::Mur => FortKind::Mur,
    }
}

/// `TowerMaterial` (`battle.rs:44`) → `battle::siege_towers::TowerMaterial`.
#[must_use]
pub const fn tower_material(m: vm::TowerMaterial) -> TowerMaterial {
    match m {
        vm::TowerMaterial::Drewno => TowerMaterial::Drewno,
        vm::TowerMaterial::Kamien => TowerMaterial::Kamien,
    }
}
