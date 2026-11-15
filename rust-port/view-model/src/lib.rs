//! `civ-view-model` — the render view model (DTO) of
//! `dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md` §3.
//!
//! Producer: `civ-engine`; consumers: `civ-renderer` (in process, through the
//! adapter `renderer/src/view.rs`, topic P4-1G) and the webview UI (JSON).
//! Types only: no game rules, no GPU types (contract §4 pt 1-2).
//!
//! Decisions taken by the orchestrator (contract §7):
//! - D-DTO-1 = A: a separate crate that depends only on `serde`;
//! - D-DTO-2 = B: id newtypes (`<= 2^53 - 1`, see [`ids`]); the adapter maps
//!   them to the renderer's `String` / `i32` / `i64`;
//! - D-DTO-3 = B: the static [`MapViewDto`] once, then [`RenderLayersDto`] in
//!   full ([`RenderViewDto::split`] / [`RenderViewDto::join`]).
//!
//! JSON: every struct is `camelCase` with `deny_unknown_fields`; `Option` is
//! written as an explicit `null` (the key is always present on output). On
//! input an omitted `Option` key reads as `None` (serde's default, kept on
//! purpose: the producer is Rust and always writes the key; requiring it on
//! input would need `deserialize_with` on every `Option` field). Pinned by
//! `tests/json_strict.rs`; technical decision proposed for `REJESTR-RUST.md`
//! (Evaluator r1, Z6). Collections are arrays in the order documented at each
//! field (D-DTO-5); `map.hexes` is `r`-major, `q`-minor (§3.2, §1.4, checked
//! by [`validate_map`]); fog is `0`/`1`/`2` per hex (D-DTO-10 = A, contract
//! recommendation). Web string values cite the pin `07d2fbd72`; the tests
//! check them against a fixture generated from the pin
//! (`tests/fixtures/README.md`).

#![forbid(unsafe_code)]
#![warn(missing_docs)]

pub mod battle;
pub mod ids;
pub mod map;
pub mod overlays;
pub mod owners;
pub mod root;
pub mod units;
pub mod validate;

pub use battle::{
    BattleFortDto, BattleGridDto, BattleSetupDto, BattleSide, BattleUnitSpawnDto, BattleViewDto,
    FortKind, TowerMaterial,
};
pub use ids::{
    CityId, HexCoord, IdOutOfRange, OwnerRef, PlayerId, UnitId, BARBARIAN_OWNER_JSON, MAX_SAFE_ID,
    REBEL_OWNER_JSON,
};
pub use map::{
    FogState, FogViewDto, HexDynDto, HexStaticDto, MapViewDto, Nakladka, RiverKind, RiverPathDto,
    Terrain, Ulepszenie,
};
pub use overlays::{
    BuildHighlightDto, BuildHighlightKind, OkolicaViewDto, OverlaysViewDto, OwnerHexesDto,
    PlacedWonderDto, SelectionDto, SiegeMachineKind, SiegeViewDto, TerritoryViewDto, TileYieldDto,
    TradeMedium, TradeRouteDto, WorkerFieldDto,
};
pub use owners::{
    CityBadgeDto, CityViewDto, MapOutlineKind, OwnerViewDto, ProductionKind, RelationToViewer,
    ViewerDto, WallKind,
};
pub use root::{RenderLayersDto, RenderViewDto, CONTRACT_VERSION};
pub use units::{StackViewDto, StackVitalsDto, UnitViewDto};
pub use validate::{validate_map, ViewError};
