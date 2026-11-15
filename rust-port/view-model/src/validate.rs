//! Producer-side checks of the contract invariants that the types alone do
//! not enforce (contract §3, §4 pt 3-4): the shape and `r`-major order of
//! `map.hexes` (§3.2, §1.4), parallel lengths, value ranges of the small
//! integer fields, finite floats (JSON has no `NaN`/`Infinity`;
//! `JSON.stringify(NaN)` is `null`) and the `ringHex` format.
//!
//! Ids need no check here: [`crate::ids`] enforces `<= 2^53 - 1` by
//! construction.

use crate::ids::HexCoord;
use crate::map::MapViewDto;
use crate::root::{RenderLayersDto, RenderViewDto, CONTRACT_VERSION};
use crate::{
    BattleViewDto, CityViewDto, FogViewDto, HexDynDto, OverlaysViewDto, OwnerViewDto, StackViewDto,
    UnitViewDto,
};
use std::fmt;

/// Largest `0xRRGGBB` colour.
pub const MAX_COLOR: u32 = 0x00FF_FFFF;
/// Largest `roadMask` (6 edge bits).
pub const MAX_ROAD_MASK: u8 = 0x3F;
/// Largest hex edge index (`RzekaInfo.krawedzie`, `0..=5`).
pub const MAX_EDGE_INDEX: u8 = 5;
/// Largest star / badge level (`0..=3`).
pub const MAX_BADGE_LEVEL: u8 = 3;
/// Largest `CityMapDefenseTier` (`0 | 1 | 2`).
pub const MAX_DEFENSE_TIER: u8 = 2;
/// Largest battle `facing`: web `const enum Dir { N = 0, E = 1, S = 2, W = 3 }`
/// (`battle/battleScene.ts:315-320` @ `07d2fbd72`); renderer `UnitSpawn.facing`
/// "`Dir` 0..3" (`renderer/src/battle/units.rs:524`).
pub const MAX_FACING: i32 = 3;
/// Largest battle tile kind: web `const enum BTerrain { Plains = 0 … Gate = 7 }`
/// (`battle/battle-terrain.ts:37-46` @ `07d2fbd72`); renderer `tile::GATE`
/// (`renderer/src/battle/field.rs:167`).
pub const MAX_BATTLE_TILE: u8 = 7;

/// A violated invariant; `field` is a JSON path such as `units[3].hp`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ViewError {
    /// `contractVersion` differs from [`CONTRACT_VERSION`].
    ContractVersion {
        /// Value found.
        actual: u16,
    },
    /// A collection that must be parallel to `map.hexes` has another length;
    /// also `map.riverRenderPaths`, which is parallel to `map.rivers`
    /// (contract §3.2, D-DTO-4: `riverRenderPaths[i]` is the render path of
    /// `rivers[i]`).
    LengthMismatch {
        /// JSON path.
        field: String,
        /// `map.hexes.len()` (or `cols * rows` for the battle grid, or
        /// `map.rivers.len()` for `map.riverRenderPaths`).
        expected: usize,
        /// Length found.
        actual: usize,
    },
    /// `NaN` or an infinity.
    NonFinite {
        /// JSON path.
        field: String,
    },
    /// An integer outside its allowed range.
    OutOfRange {
        /// JSON path.
        field: String,
        /// Value found.
        value: i64,
        /// Smallest allowed value.
        min: i64,
        /// Largest allowed value.
        max: i64,
    },
    /// `ringHex` is not `#` + 6 lowercase hex digits (`main.ts:4080-4082`).
    BadRingHex {
        /// JSON path.
        field: String,
    },
    /// `map.hexes[i]` is not the hex of the `r`-major, `q`-minor
    /// parallelogram (contract §3.2, §1.4: the web generator loops
    /// `for r in 0..height { for q in 0..width }`, `map/generator.ts:216-219`
    /// @ `07d2fbd72`): the hex at index `i` must be
    /// `(q = i % width, r = i / width)`. This also rules out duplicates and
    /// holes. `hexState` and `fog.state` are parallel to this order.
    HexOrder {
        /// JSON path, `map.hexes[i].coord`.
        field: String,
        /// `(i % width, i / width)`.
        expected: HexCoord,
        /// Coordinate found.
        actual: HexCoord,
    },
}

impl fmt::Display for ViewError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ContractVersion { actual } => write!(
                f,
                "contractVersion {actual} differs from {CONTRACT_VERSION}"
            ),
            Self::LengthMismatch {
                field,
                expected,
                actual,
            } => write!(f, "{field}: length {actual}, expected {expected}"),
            Self::NonFinite { field } => write!(f, "{field}: not a finite number"),
            Self::OutOfRange {
                field,
                value,
                min,
                max,
            } => write!(f, "{field}: {value} outside {min}..={max}"),
            Self::BadRingHex { field } => write!(f, "{field}: not #rrggbb"),
            Self::HexOrder {
                field,
                expected,
                actual,
            } => write!(
                f,
                "{field}: ({},{}) where the r-major order expects ({},{})",
                actual.q, actual.r, expected.q, expected.r
            ),
        }
    }
}

impl std::error::Error for ViewError {}

type Check = Result<(), ViewError>;

fn finite(field: impl FnOnce() -> String, value: f64) -> Check {
    if value.is_finite() {
        Ok(())
    } else {
        Err(ViewError::NonFinite { field: field() })
    }
}

fn finite_opt(field: impl FnOnce() -> String, value: Option<f64>) -> Check {
    value.map_or(Ok(()), |v| finite(field, v))
}

fn range(field: impl FnOnce() -> String, value: i64, min: i64, max: i64) -> Check {
    if (min..=max).contains(&value) {
        Ok(())
    } else {
        Err(ViewError::OutOfRange {
            field: field(),
            value,
            min,
            max,
        })
    }
}

fn len(field: &str, expected: usize, actual: usize) -> Check {
    if expected == actual {
        Ok(())
    } else {
        Err(ViewError::LengthMismatch {
            field: field.to_owned(),
            expected,
            actual,
        })
    }
}

fn color(field: impl FnOnce() -> String, value: u32) -> Check {
    range(field, i64::from(value), 0, i64::from(MAX_COLOR))
}

fn badge(field: impl FnOnce() -> String, value: u8) -> Check {
    range(field, i64::from(value), 0, i64::from(MAX_BADGE_LEVEL))
}

fn is_ring_hex(s: &str) -> bool {
    let b = s.as_bytes();
    b.len() == 7
        && b[0] == b'#'
        && b[1..]
            .iter()
            .all(|c| c.is_ascii_digit() || (b'a'..=b'f').contains(c))
}

/// Checks the static map.
///
/// # Errors
/// The first violated invariant.
pub fn validate_map(map: &MapViewDto) -> Check {
    finite(|| "map.seed".into(), map.seed)?;
    // `width * height` of two u32 fits in u64.
    let cells = u64::from(map.width) * u64::from(map.height);
    len(
        "map.hexes",
        usize::try_from(cells).unwrap_or(usize::MAX),
        map.hexes.len(),
    )?;
    // A non-empty `hexes` here implies `width >= 1`.
    let width = usize::try_from(map.width).unwrap_or(usize::MAX).max(1);
    let axis = |v: usize| i32::try_from(v).unwrap_or(i32::MAX);
    for (i, hex) in map.hexes.iter().enumerate() {
        let expected = HexCoord::new(axis(i % width), axis(i / width));
        if hex.coord != expected {
            return Err(ViewError::HexOrder {
                field: format!("map.hexes[{i}].coord"),
                expected,
                actual: hex.coord,
            });
        }
    }
    // `riverRenderPaths[i]` belongs to `rivers[i]` (P4-1B-Q3; web: one render
    // path per `riverPaths[pi]`, `render/scene.ts:1308-1318` @ `07d2fbd72`).
    len(
        "map.riverRenderPaths",
        map.rivers.len(),
        map.river_render_paths.len(),
    )?;
    for (i, hex) in map.hexes.iter().enumerate() {
        for (j, &edge) in hex.rzeka_krawedzie.iter().enumerate() {
            range(
                || format!("map.hexes[{i}].rzekaKrawedzie[{j}]"),
                i64::from(edge),
                0,
                i64::from(MAX_EDGE_INDEX),
            )?;
        }
    }
    Ok(())
}

/// Borrowed dynamic layers, shared by [`RenderViewDto`] and [`RenderLayersDto`].
struct Layers<'a> {
    contract_version: u16,
    hex_state: &'a [HexDynDto],
    fog: &'a FogViewDto,
    owners: &'a [OwnerViewDto],
    cities: &'a [CityViewDto],
    units: &'a [UnitViewDto],
    stacks: &'a StackViewDto,
    overlays: &'a OverlaysViewDto,
    battle: Option<&'a BattleViewDto>,
}

impl Layers<'_> {
    fn check(&self, hex_count: usize) -> Check {
        if self.contract_version != CONTRACT_VERSION {
            return Err(ViewError::ContractVersion {
                actual: self.contract_version,
            });
        }
        len("hexState", hex_count, self.hex_state.len())?;
        len("fog.state", hex_count, self.fog.state.len())?;
        for (i, h) in self.hex_state.iter().enumerate() {
            range(
                || format!("hexState[{i}].roadMask"),
                i64::from(h.road_mask),
                0,
                i64::from(MAX_ROAD_MASK),
            )?;
        }
        self.check_owners()?;
        self.check_cities()?;
        self.check_units()?;
        self.check_overlays()?;
        self.check_battle()
    }

    fn check_owners(&self) -> Check {
        for (i, o) in self.owners.iter().enumerate() {
            color(|| format!("owners[{i}].color"), o.color)?;
            finite(|| format!("owners[{i}].era"), o.era)?;
            if let Some(ring) = &o.ring_hex {
                if !is_ring_hex(ring) {
                    return Err(ViewError::BadRingHex {
                        field: format!("owners[{i}].ringHex"),
                    });
                }
            }
        }
        Ok(())
    }

    fn check_cities(&self) -> Check {
        for (i, c) in self.cities.iter().enumerate() {
            finite(|| format!("cities[{i}].population"), c.population)?;
            finite(|| format!("cities[{i}].level"), c.level)?;
            let b = &c.badge;
            finite(|| format!("cities[{i}].badge.population"), b.population)?;
            range(
                || format!("cities[{i}].badge.defenseTier"),
                i64::from(b.defense_tier),
                0,
                i64::from(MAX_DEFENSE_TIER),
            )?;
            color(|| format!("cities[{i}].badge.ownerColor"), b.owner_color)?;
            finite_opt(
                || format!("cities[{i}].badge.growthPercent"),
                b.growth_percent,
            )?;
            finite(|| format!("cities[{i}].badge.era"), b.era)?;
        }
        Ok(())
    }

    fn check_units(&self) -> Check {
        for (i, u) in self.units.iter().enumerate() {
            finite(|| format!("units[{i}].ruchMax"), u.ruch_max)?;
            finite(|| format!("units[{i}].ruchLeft"), u.ruch_left)?;
            finite(|| format!("units[{i}].hp"), u.hp)?;
            finite_opt(|| format!("units[{i}].hpMax"), u.hp_max)?;
            badge(|| format!("units[{i}].veteranStars"), u.veteran_stars)?;
            badge(
                || format!("units[{i}].armorBadgeLevel"),
                u.armor_badge_level,
            )?;
            badge(|| format!("units[{i}].softBadgeLevel"), u.soft_badge_level)?;
        }
        for (i, (_, v)) in self.stacks.vitals_by_rep_id.iter().enumerate() {
            let p = |name: &str| format!("stacks.vitalsByRepId[{i}][1].{name}");
            finite(|| p("ruchLeft"), v.ruch_left)?;
            finite(|| p("ruchMax"), v.ruch_max)?;
            finite(|| p("hp"), v.hp)?;
            finite(|| p("hpMax"), v.hp_max)?;
            finite(|| p("fieldPowerM"), v.field_power_m)?;
            badge(|| p("armorBadgeLevel"), v.armor_badge_level)?;
            badge(|| p("softBadgeLevel"), v.soft_badge_level)?;
            range(
                || p("veteranLevel"),
                i64::from(v.veteran_level),
                1,
                i64::from(MAX_BADGE_LEVEL),
            )?;
            badge(|| p("veteranStars"), v.veteran_stars)?;
        }
        Ok(())
    }

    fn check_overlays(&self) -> Check {
        if let Some(ok) = &self.overlays.okolica {
            finite(|| "overlays.okolica.range".into(), ok.range)?;
            for (i, (_, y)) in ok.yields.iter().enumerate() {
                let p = |name: &str| format!("overlays.okolica.yields[{i}][1].{name}");
                finite_opt(|| p("zywnosc"), y.zywnosc)?;
                finite_opt(|| p("praca"), y.praca)?;
                finite_opt(|| p("handel"), y.handel)?;
            }
        }
        if let Some(route) = &self.overlays.path_route {
            // `turn` counts from 1 and grows strictly along `turnStops`
            // (`game/planned-march.ts:116-141`, `:242-268` @ `07d2fbd72`:
            // `turnNum = 1`, a stop is pushed with `turnNum`, then
            // `turnNum++`; the closing stop is pushed only when it differs
            // from the last one).
            let mut min = 1_i64;
            for (i, stop) in route.turn_stops.iter().enumerate() {
                let turn = i64::from(stop.turn);
                range(
                    || format!("overlays.pathRoute.turnStops[{i}].turn"),
                    turn,
                    min,
                    i64::from(u32::MAX),
                )?;
                min = turn + 1;
            }
        }
        Ok(())
    }

    fn check_battle(&self) -> Check {
        let Some(battle) = self.battle else {
            return Ok(());
        };
        let g = &battle.setup.grid;
        range(
            || "battle.setup.grid.cols".into(),
            i64::from(g.cols),
            0,
            i64::from(i32::MAX),
        )?;
        range(
            || "battle.setup.grid.rows".into(),
            i64::from(g.rows),
            0,
            i64::from(i32::MAX),
        )?;
        // Both factors are >= 0 here; the product of two i32 fits in i64.
        let cells = i64::from(g.cols) * i64::from(g.rows);
        let cells = usize::try_from(cells).unwrap_or(usize::MAX);
        len("battle.setup.grid.tiles", cells, g.tiles.len())?;
        for (i, &tile) in g.tiles.iter().enumerate() {
            range(
                || format!("battle.setup.grid.tiles[{i}]"),
                i64::from(tile),
                0,
                i64::from(MAX_BATTLE_TILE),
            )?;
        }
        for (i, u) in battle.setup.units.iter().enumerate() {
            let p = |name: &str| format!("battle.setup.units[{i}].{name}");
            color(|| p("ownerColor"), u.owner_color)?;
            range(
                || p("facing"),
                i64::from(u.facing),
                0,
                i64::from(MAX_FACING),
            )?;
            finite(|| p("hp"), u.hp)?;
            finite(|| p("maxHp"), u.max_hp)?;
            finite(|| p("morale"), u.morale)?;
            finite(|| p("moraleMax"), u.morale_max)?;
            finite_opt(|| p("ammoLeft"), u.ammo_left)?;
            finite_opt(|| p("ammoMax"), u.ammo_max)?;
        }
        Ok(())
    }
}

impl RenderViewDto {
    /// Checks every invariant of the full snapshot.
    ///
    /// # Errors
    /// The first violated invariant.
    pub fn validate(&self) -> Check {
        validate_map(&self.map)?;
        Layers {
            contract_version: self.contract_version,
            hex_state: &self.hex_state,
            fog: &self.fog,
            owners: &self.owners,
            cities: &self.cities,
            units: &self.units,
            stacks: &self.stacks,
            overlays: &self.overlays,
            battle: self.battle.as_ref(),
        }
        .check(self.map.hexes.len())
    }
}

impl RenderLayersDto {
    /// Checks the dynamic layers against the static map they belong to.
    ///
    /// # Errors
    /// The first violated invariant.
    pub fn validate(&self, map: &MapViewDto) -> Check {
        validate_map(map)?;
        Layers {
            contract_version: self.contract_version,
            hex_state: &self.hex_state,
            fog: &self.fog,
            owners: &self.owners,
            cities: &self.cities,
            units: &self.units,
            stacks: &self.stacks,
            overlays: &self.overlays,
            battle: self.battle.as_ref(),
        }
        .check(map.hexes.len())
    }
}
