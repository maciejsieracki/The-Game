//! P4-1F2 `R-RUSTPORT-P4-1F2-TERRITORY-RANGES-R1`: territory ranges of every
//! owner as the web map draws them ([`TerritoryRangesDto`]).
//!
//! Pin `07d2fbd72` (`gra/src/…`):
//! - owner of a hex: `territoryOwnerAt` (`map/territory.ts:122-160`; the
//!   index `territoryOwnerLookup`, `:280-292`, gives the same result by
//!   construction and is not ported) with `cityTerritoryRadius`
//!   (`:89-93`), `cityRangeForPopulation` (`game/okolica.ts:46-50`) and the
//!   constants `CITY_RANGE_MIN` / `CITY_RANGE_CAP` (`okolica.ts:37`, `:40`,
//!   `data/miasto-params.json` `zasieg_okolicy_baza` / `zasieg_okolicy_max`),
//!   `FORT_TERRITORY_RADIUS` / `OUTPOST_TERRITORY_RADIUS` (`territory.ts:75`,
//!   `:77`);
//! - hexes per owner: `collectTerritoryHexKeysByOwner`
//!   (`map/range-hexes.ts:28-53`) over `Object.keys(map.hexes)`, with the fog
//!   filter of `refreshTerritoryBorderOverlay` (`main.ts:15593-15601`):
//!   `isMe(ownerId)` (`main.ts:13748-13750`, the ACTIVE seat `ME()`) → always;
//!   `!fogOn` → always; else `currentVisible()` (`main.ts:12995-13015`) ∪
//!   `fogExploredForRender()`;
//! - border of an owner: `collectTerritoryBoundaryEdges`
//!   (`map/territory-border.ts:76-111`): every side `dir` (order `HEX_DIRS`,
//!   `:9-16`) of a hex of the set whose neighbour is NOT in the same set
//!   (another owner, no owner, off the map or hidden by the fog filter).
//!
//! Inputs are explicit (D-DTO-1 = A: this crate depends on `serde` only, it
//! cannot read `PlayableState`): the engine passes the `map.hexes` key order
//! (`hex_order`, engine `domain/state.rs`, FOG-VIEW), the territory nodes
//! (`buildAllTerritoryNodes`, `main.ts:5667-5678`) and the fog sets of the
//! active seat (`current_visible` / explored, FOG-VIEW).

use std::collections::{HashMap, HashSet};

use serde::{Deserialize, Serialize};

use crate::ids::{HexCoord, OwnerRef};
use crate::overlays::{OwnerHexesDto, TerritoryViewDto};

/// `CITY_RANGE_MIN` (`okolica.ts:37`, `miasto-params.json`
/// `zasieg_okolicy_baza.wartosc`).
pub const CITY_RANGE_MIN: i64 = 5;
/// `CITY_RANGE_CAP` (`okolica.ts:40`, `miasto-params.json`
/// `zasieg_okolicy_max.wartosc`).
pub const CITY_RANGE_CAP: i64 = 15;
/// `FORT_TERRITORY_RADIUS` (`territory.ts:75`).
pub const FORT_TERRITORY_RADIUS: i64 = 5;
/// `OUTPOST_TERRITORY_RADIUS` (`territory.ts:77`).
pub const OUTPOST_TERRITORY_RADIUS: i64 = 3;

/// `HEX_DIRS` (`territory-border.ts:9-16`): the index is the `dir` of
/// [`BorderEdgeDto`].
pub const HEX_DIRS: [(i32, i32); 6] = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)];

/// `order` of a fort / outpost node (`territory.ts:46`): build turn and
/// sequence number; the earlier one wins a contested hex.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct TerritoryNodeOrder {
    /// `turn`.
    pub turn: f64,
    /// `seq`.
    pub seq: f64,
}

/// One territory node, web `TerritoryNode` (`territory.ts:24-47`): a city,
/// an outpost or a fort with its owner.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct TerritoryNodeInput {
    /// `q/r` of the node.
    pub hex: HexCoord,
    /// `ownerId`.
    pub owner_id: OwnerRef,
    /// `pop` (a JS number: `cityRangeForPopulation` floors it).
    pub pop: f64,
    /// `isOutpost`.
    pub is_outpost: bool,
    /// `isFort`.
    pub is_fort: bool,
    /// `order` (forts / outposts only; `undefined` → `None`).
    pub order: Option<TerritoryNodeOrder>,
}

/// One outer side of a territory hex: `dir` indexes [`HEX_DIRS`].
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BorderEdgeDto {
    /// The hex of the owner.
    pub hex: HexCoord,
    /// Side `0..6` ([`HEX_DIRS`] order).
    pub dir: u8,
}

/// The outer border of one owner's (fog-filtered) territory.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct OwnerBorderEdgesDto {
    /// The owner.
    pub owner_id: OwnerRef,
    /// Edges in hex order (that of `by_owner`), then `dir` order — the order
    /// of `collectTerritoryBoundaryEdges`.
    pub edges: Vec<BorderEdgeDto>,
}

/// Territory ranges of every owner seen by the active seat.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct TerritoryRangesDto {
    /// Hexes per owner, owners in `Map` insertion order (first hex in
    /// `map.hexes` key order), hexes in key order.
    pub by_owner: Vec<OwnerHexesDto>,
    /// The border of each `by_owner` entry, same owner order.
    pub borders: Vec<OwnerBorderEdgesDto>,
}

impl TerritoryRangesDto {
    /// The territory part as the existing [`TerritoryViewDto`] (contract
    /// §3.6), which the renderer border group reads.
    #[must_use]
    pub fn territory_view(&self) -> TerritoryViewDto {
        TerritoryViewDto {
            by_owner: self.by_owner.clone(),
        }
    }
}

/// Fog inputs of the filter (`main.ts:15596-15600`) for the ACTIVE seat.
#[derive(Debug, Clone, Copy)]
pub struct TerritoryFogFilter<'a> {
    /// `ME()`: the active human seat.
    pub me: OwnerRef,
    /// `fogOn`.
    pub fog_on: bool,
    /// `currentVisible()` of the active seat.
    pub visible: &'a HashSet<HexCoord>,
    /// `fogExploredForRender()` of the active seat.
    pub explored: &'a HashSet<HexCoord>,
}

impl TerritoryFogFilter<'_> {
    /// `filterHex(key, ownerId)` of `refreshTerritoryBorderOverlay`.
    #[must_use]
    pub fn keeps(&self, hex: HexCoord, owner: OwnerRef) -> bool {
        if owner == self.me {
            return true;
        }
        if !self.fog_on {
            return true;
        }
        self.visible.contains(&hex) || self.explored.contains(&hex)
    }
}

/// `axialDistance` (`territory.ts:57-61`).
#[must_use]
pub fn axial_distance(a: HexCoord, b: HexCoord) -> i64 {
    let (aq, ar, bq, br) = (
        i64::from(a.q),
        i64::from(a.r),
        i64::from(b.q),
        i64::from(b.r),
    );
    let (a_s, b_s) = (-aq - ar, -bq - br);
    ((aq - bq).abs() + (ar - br).abs() + (a_s - b_s).abs()) / 2
}

/// `cityRangeForPopulation(pop)` (`okolica.ts:46-50`).
#[must_use]
pub fn city_range_for_population(population: f64) -> i64 {
    let pop = if population.is_finite() {
        population.floor()
    } else {
        0.0
    };
    if pop <= 0.0 {
        return 0;
    }
    // `pop >= 1` here; `min(max(MIN, pop), CAP)` is in `MIN..=CAP`.
    #[allow(clippy::cast_precision_loss, clippy::cast_possible_truncation)]
    let r = pop.max(CITY_RANGE_MIN as f64).min(CITY_RANGE_CAP as f64) as i64;
    r
}

/// `cityTerritoryRadius(node)` (`territory.ts:89-93`).
#[must_use]
pub fn city_territory_radius(node: &TerritoryNodeInput) -> i64 {
    if node.is_fort {
        FORT_TERRITORY_RADIUS
    } else if node.is_outpost {
        OUTPOST_TERRITORY_RADIUS
    } else {
        city_range_for_population(node.pop)
    }
}

/// `territoryOwnerAt(q, r, nodes)` (`territory.ts:122-160`): the nearest
/// city in radius (tie → first node); only if no city covers the hex, the
/// fort / outpost rule (both with `order` → earlier build, else nearer).
#[must_use]
pub fn territory_owner_at(hex: HexCoord, nodes: &[TerritoryNodeInput]) -> Option<OwnerRef> {
    let mut best_city: Option<(OwnerRef, i64)> = None;
    let mut best_fort: Option<OwnerRef> = None;
    let mut best_fort_dist = i64::MAX;
    let mut best_fort_order: Option<TerritoryNodeOrder> = None;
    for node in nodes {
        let radius = city_territory_radius(node);
        let dist = axial_distance(hex, node.hex);
        if dist > radius {
            continue;
        }
        if node.is_fort || node.is_outpost {
            let better = match (best_fort, node.order, best_fort_order) {
                (Some(_), Some(o), Some(b)) => {
                    if o.turn == b.turn {
                        o.seq < b.seq
                    } else {
                        o.turn < b.turn
                    }
                }
                _ => dist < best_fort_dist,
            };
            if better {
                best_fort_dist = dist;
                best_fort = Some(node.owner_id);
                best_fort_order = node.order;
            }
        } else if best_city.is_none_or(|(_, d)| dist < d) {
            best_city = Some((node.owner_id, dist));
        }
    }
    best_city.map(|(o, _)| o).or(best_fort)
}

/// The [`TerritoryRangesDto`] of the active seat.
///
/// `hex_order` is `Object.keys(map.hexes)` (every hex of the map once, in
/// key order); `nodes` is `buildAllTerritoryNodes()` in its order.
#[must_use]
pub fn territory_ranges_dto(
    hex_order: &[HexCoord],
    nodes: &[TerritoryNodeInput],
    fog: &TerritoryFogFilter<'_>,
) -> TerritoryRangesDto {
    let mut by_owner: Vec<OwnerHexesDto> = Vec::new();
    let mut slot: HashMap<OwnerRef, usize> = HashMap::new();
    for &hex in hex_order {
        let Some(owner) = territory_owner_at(hex, nodes) else {
            continue;
        };
        if !fog.keeps(hex, owner) {
            continue;
        }
        let i = *slot.entry(owner).or_insert_with(|| {
            by_owner.push(OwnerHexesDto {
                owner_id: owner,
                hexes: Vec::new(),
            });
            by_owner.len() - 1
        });
        by_owner[i].hexes.push(hex);
    }
    let borders = by_owner
        .iter()
        .map(|o| OwnerBorderEdgesDto {
            owner_id: o.owner_id,
            edges: owner_border_edges(&o.hexes),
        })
        .collect();
    TerritoryRangesDto { by_owner, borders }
}

/// The outer edges of one owner's hex list (`collectTerritoryBoundaryEdges`
/// without the world geometry): a side is a border iff its neighbour is not
/// in the same list.
#[must_use]
pub fn owner_border_edges(hexes: &[HexCoord]) -> Vec<BorderEdgeDto> {
    let set: HashSet<HexCoord> = hexes.iter().copied().collect();
    let mut seen: HashSet<HexCoord> = HashSet::new();
    let mut edges = Vec::new();
    for &hex in hexes {
        // A JS `Set` iterates each key once.
        if !seen.insert(hex) {
            continue;
        }
        for (dir, &(dq, dr)) in (0u8..).zip(HEX_DIRS.iter()) {
            let n = HexCoord::new(hex.q + dq, hex.r + dr);
            if set.contains(&n) {
                continue;
            }
            edges.push(BorderEdgeDto { hex, dir });
        }
    }
    edges
}
