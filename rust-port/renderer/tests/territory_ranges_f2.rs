//! R-RUSTPORT-P4-1F2-TERRITORY-RANGES-R1: territory ranges of every owner
//! (`civ_view_model::territory_ranges_view`) and their adapter
//! (`renderer::view::overlays::territory_ranges_*`).
//!
//! Expected values come from `territory_ranges_f2_vectors/vectors.json`,
//! written by `territory_ranges_f2_gen.mjs`, which EXECUTES the pin
//! `07d2fbd72` (`map/territory.ts`, `map/range-hexes.ts`,
//! `map/territory-border.ts`, `render/hexutil.ts`, `game/okolica.ts:37-50`,
//! the fog filter `main.ts:15593-15601`). Scenarios: 2 owners with and
//! without fog, the active seat `ME()` = 0 and = 1 (hotseat), nothing seen,
//! population edge cases, forts / outposts with and without `order`,
//! barbarians and rebels, and >= 12 nodes (the web index path of
//! `territoryOwnerLookup`).

use std::collections::HashSet;

use civ_renderer::models::misc::range::{
    build_territory_border_group, TerritoryBorderParams, TERRITORY_BORDER_BAND_WIDTH,
    TERRITORY_BORDER_OPACITY,
};
use civ_renderer::models::misc::territory::collect_territory_boundary_edges;
use civ_renderer::models::misc::OverlayMap;
use civ_renderer::pick::hex::{axial_to_world, HexCoord as PickHex, HEX_R};
use civ_renderer::pick::terrain::Terrain;
use civ_renderer::view::overlays::{
    territory_ranges_border_edges, territory_ranges_border_group, territory_ranges_by_owner,
};
use civ_renderer::view::{self, MapUiState, OverlayAdapterError};
use civ_view_model as vm;
use civ_view_model::territory_ranges_view as tr;
use serde_json::Value;

const VECTORS: &str = include_str!("territory_ranges_f2_vectors/vectors.json");

fn vectors() -> Value {
    serde_json::from_str(VECTORS).unwrap()
}

fn owner_ref(v: &Value) -> vm::OwnerRef {
    vm::OwnerRef::from_legacy_i64(v.as_i64().unwrap()).unwrap()
}

fn coord(v: &Value) -> vm::HexCoord {
    let a = v.as_array().unwrap();
    vm::HexCoord::new(
        i32::try_from(a[0].as_i64().unwrap()).unwrap(),
        i32::try_from(a[1].as_i64().unwrap()).unwrap(),
    )
}

fn coords(v: &Value) -> Vec<vm::HexCoord> {
    v.as_array().unwrap().iter().map(coord).collect()
}

struct Scenario {
    name: String,
    hexes: Vec<vm::HexCoord>,
    nodes: Vec<tr::TerritoryNodeInput>,
    me: vm::OwnerRef,
    fog_on: bool,
    visible: HashSet<vm::HexCoord>,
    explored: HashSet<vm::HexCoord>,
    /// `[(owner, hexes)]` of the pin.
    by_owner: Vec<(i64, Vec<vm::HexCoord>)>,
    /// `[(owner, [(v0Key, v1Key)])]` of the pin.
    borders: Vec<(i64, Vec<(String, String)>)>,
}

fn scenarios() -> Vec<Scenario> {
    vectors()["scenarios"]
        .as_array()
        .unwrap()
        .iter()
        .map(|s| Scenario {
            name: s["name"].as_str().unwrap().to_owned(),
            hexes: coords(&s["hexes"]),
            nodes: s["nodes"]
                .as_array()
                .unwrap()
                .iter()
                .map(|n| tr::TerritoryNodeInput {
                    hex: vm::HexCoord::new(
                        i32::try_from(n["q"].as_i64().unwrap()).unwrap(),
                        i32::try_from(n["r"].as_i64().unwrap()).unwrap(),
                    ),
                    owner_id: owner_ref(&n["ownerId"]),
                    pop: n["pop"].as_f64().unwrap(),
                    is_outpost: n["isOutpost"].as_bool().unwrap(),
                    is_fort: n["isFort"].as_bool().unwrap(),
                    order: (!n["order"].is_null()).then(|| tr::TerritoryNodeOrder {
                        turn: n["order"]["turn"].as_f64().unwrap(),
                        seq: n["order"]["seq"].as_f64().unwrap(),
                    }),
                })
                .collect(),
            me: owner_ref(&s["me"]),
            fog_on: s["fogOn"].as_bool().unwrap(),
            visible: coords(&s["visible"]).into_iter().collect(),
            explored: coords(&s["explored"]).into_iter().collect(),
            by_owner: s["byOwner"]
                .as_array()
                .unwrap()
                .iter()
                .map(|o| (o["ownerId"].as_i64().unwrap(), coords(&o["hexes"])))
                .collect(),
            borders: s["borders"]
                .as_array()
                .unwrap()
                .iter()
                .map(|b| {
                    let edges = b["edges"]
                        .as_array()
                        .unwrap()
                        .iter()
                        .map(|e| {
                            (
                                e[0].as_str().unwrap().to_owned(),
                                e[1].as_str().unwrap().to_owned(),
                            )
                        })
                        .collect();
                    (b["ownerId"].as_i64().unwrap(), edges)
                })
                .collect(),
        })
        .collect()
}

fn produce(s: &Scenario) -> vm::TerritoryRangesDto {
    let fog = tr::TerritoryFogFilter {
        me: s.me,
        fog_on: s.fog_on,
        visible: &s.visible,
        explored: &s.explored,
    };
    tr::territory_ranges_dto(&s.hexes, &s.nodes, &fog)
}

/// Every scenario of the pin is non-trivial: the vectors cover 2+ owners,
/// fog that hides foreign hexes, and >= 12 nodes.
#[test]
fn vectors_cover_the_cases() {
    let all = scenarios();
    assert_eq!(all.len(), 8);
    assert!(all.iter().all(|s| !s.by_owner.is_empty()));
    assert!(all.iter().any(|s| s.nodes.len() >= 12));
    assert!(all.iter().filter(|s| s.by_owner.len() >= 2).count() >= 6);
    let total_edges: usize = all
        .iter()
        .flat_map(|s| s.borders.iter().map(|b| b.1.len()))
        .sum();
    assert!(total_edges > 3500, "{total_edges}");
    // Fog really hides: with the same nodes, fog on + ME() = 0 keeps fewer
    // hexes of owner 1 than fog off, and all of owner 0.
    let by = |n: &str| all.iter().find(|s| s.name == n).unwrap();
    let count = |s: &Scenario, o: i64| {
        s.by_owner
            .iter()
            .find(|e| e.0 == o)
            .map_or(0, |e| e.1.len())
    };
    let off = by("two_owners_fog_off");
    let on0 = by("two_owners_fog_on_me0");
    let on1 = by("two_owners_fog_on_me1");
    assert!(count(on0, 1) < count(off, 1));
    assert_eq!(count(on0, 0), count(off, 0));
    assert!(count(on1, 0) < count(off, 0));
    assert_eq!(count(on1, 1), count(off, 1));
}

/// `CITY_RANGE_MIN/CAP`, fort and outpost radii equal the pin values.
#[test]
fn constants_match_pin() {
    let c = &vectors()["constants"];
    assert_eq!(c["cityRangeMin"].as_i64().unwrap(), tr::CITY_RANGE_MIN);
    assert_eq!(c["cityRangeCap"].as_i64().unwrap(), tr::CITY_RANGE_CAP);
    assert_eq!(
        c["fortTerritoryRadius"].as_i64().unwrap(),
        tr::FORT_TERRITORY_RADIUS
    );
    assert_eq!(
        c["outpostTerritoryRadius"].as_i64().unwrap(),
        tr::OUTPOST_TERRITORY_RADIUS
    );
}

/// `by_owner` = `collectTerritoryHexKeysByOwner` with the fog filter of the
/// active seat: owners in `Map` insertion order, hexes in key order.
#[test]
fn by_owner_matches_pin() {
    for s in scenarios() {
        let dto = produce(&s);
        let got: Vec<(i64, Vec<vm::HexCoord>)> = dto
            .by_owner
            .iter()
            .map(|o| (o.owner_id.legacy_i64(), o.hexes.clone()))
            .collect();
        assert_eq!(got, s.by_owner, "{}", s.name);
        // The adapter `Map` is the same.
        let map = territory_ranges_by_owner(&dto);
        let flat: Vec<(i64, Vec<(i32, i32)>)> = map
            .iter()
            .map(|(o, set)| (*o, set.iter().collect()))
            .collect();
        let want: Vec<(i64, Vec<(i32, i32)>)> = s
            .by_owner
            .iter()
            .map(|(o, h)| (*o, h.iter().map(|c| (c.q, c.r)).collect()))
            .collect();
        assert_eq!(flat, want, "{}", s.name);
    }
}

/// `borders` = `collectTerritoryBoundaryEdges(set, makeAxialHexCenterFn())`
/// of every owner, edge for edge (vertex keys `toFixed(5)`, in order).
#[test]
fn borders_match_pin() {
    for s in scenarios() {
        let dto = produce(&s);
        let edges =
            territory_ranges_border_edges(&dto).unwrap_or_else(|e| panic!("{}: {e}", s.name));
        let got: Vec<(i64, Vec<(String, String)>)> = edges
            .iter()
            .map(|(o, es)| {
                (
                    *o,
                    es.iter()
                        .map(|e| (e.v0_key.clone(), e.v1_key.clone()))
                        .collect(),
                )
            })
            .collect();
        assert_eq!(got, s.borders, "{}", s.name);
        // The DTO: every listed side has a neighbour outside the owner set
        // (another owner, no owner, off the map or hidden by fog), and every
        // such side is listed.
        for (o, b) in dto.by_owner.iter().zip(&dto.borders) {
            let set: HashSet<vm::HexCoord> = o.hexes.iter().copied().collect();
            for e in &b.edges {
                let (dq, dr) = tr::HEX_DIRS[usize::from(e.dir)];
                let n = vm::HexCoord::new(e.hex.q + dq, e.hex.r + dr);
                assert!(set.contains(&e.hex), "{}", s.name);
                assert!(!set.contains(&n), "{}: inner side listed", s.name);
            }
            let inner_free: usize = o
                .hexes
                .iter()
                .map(|h| {
                    tr::HEX_DIRS
                        .iter()
                        .filter(|(dq, dr)| !set.contains(&vm::HexCoord::new(h.q + dq, h.r + dr)))
                        .count()
                })
                .sum();
            assert_eq!(b.edges.len(), inner_free, "{}", s.name);
        }
    }
}

/// The renderer's own rule on the pin hex sets gives the pin edges too (the
/// adapter check is not vacuous).
#[test]
fn renderer_rule_matches_pin_edges() {
    let center = |q: i32, r: i32| Some(axial_to_world(PickHex { q, r }, HEX_R));
    for s in scenarios() {
        for ((o, hexes), (bo, want)) in s.by_owner.iter().zip(&s.borders) {
            assert_eq!(o, bo);
            let set = view::range_hex_key_set(hexes);
            let got: Vec<(String, String)> = collect_territory_boundary_edges(&set, &center)
                .into_iter()
                .map(|e| (e.v0_key, e.v1_key))
                .collect();
            assert_eq!(&got, want, "{} owner {o}", s.name);
        }
    }
}

fn overlay_map(hexes: &[vm::HexCoord]) -> OverlayMap {
    OverlayMap {
        hexes: hexes.iter().map(|h| ((h.q, h.r), Terrain::Laka)).collect(),
        seed: None,
    }
}

fn owners_for(dto: &vm::TerritoryRangesDto, me: vm::OwnerRef) -> Vec<vm::OwnerViewDto> {
    dto.by_owner
        .iter()
        .enumerate()
        .map(|(i, o)| vm::OwnerViewDto {
            owner_id: o.owner_id,
            color: 0x10_2030 + u32::try_from(i).unwrap(),
            civ_icon_id: "x".to_owned(),
            bronze_civ: "egypt".to_owned(),
            era: 1.0,
            is_city_state: false,
            is_barbarian: o.owner_id == vm::OwnerRef::Barbarian,
            ring_hex: None,
            display_name: None,
            map_outline_kind: None,
            capital_city_id: None,
            relation_to_viewer: if o.owner_id == me {
                vm::RelationToViewer::Own
            } else {
                vm::RelationToViewer::Wojna
            },
        })
        .collect()
}

/// The group from the ranges DTO is the web `buildTerritoryBorderGroup` of
/// `byOwner` (gate, colours and parameters as `territory_border_group`).
#[test]
fn border_group_from_ranges() {
    for s in scenarios() {
        let dto = produce(&s);
        let map = overlay_map(&s.hexes);
        let owners = owners_for(&dto, s.me);
        let viewer = vm::ViewerDto {
            owner_id: s.me,
            fog_active: s.fog_on,
        };
        let on = MapUiState::WEB_INITIAL;
        let got = territory_ranges_border_group(&map, &dto, &owners, &viewer, &on)
            .unwrap()
            .unwrap();
        let by_owner = territory_ranges_by_owner(&dto);
        let colors = view::territory_colors(&dto.territory_view(), &owners, &viewer).unwrap();
        let civ = |o: i64| colors[&o].civ;
        let rel = |o: i64| colors[&o].relation;
        let want = build_territory_border_group(
            &map,
            &by_owner,
            &civ,
            TerritoryBorderParams {
                band_width: Some(TERRITORY_BORDER_BAND_WIDTH),
                opacity: Some(TERRITORY_BORDER_OPACITY),
                relation_band_width: None,
            },
            Some(&rel),
        );
        assert_eq!(got, want, "{}", s.name);
        // Two meshes per owner (border + relation band).
        assert_eq!(got.objects.len(), 2 * dto.by_owner.len(), "{}", s.name);
        let off = MapUiState {
            territory_border_visible: false,
            ..on
        };
        assert_eq!(
            territory_ranges_border_group(&map, &dto, &owners, &viewer, &off).unwrap(),
            None
        );
    }
}

/// A producer that lists a side between two hexes of the SAME owner (no
/// neighbour of another owner) or drops an outer side is rejected.
#[test]
fn adapter_rejects_wrong_borders() {
    let s = &scenarios()[0];
    let dto = produce(s);
    // Extra inner side: the first hex's side towards a same-owner neighbour.
    let mut bad = dto.clone();
    let o = &bad.by_owner[0];
    let set: HashSet<vm::HexCoord> = o.hexes.iter().copied().collect();
    let (hex, dir) = o
        .hexes
        .iter()
        .find_map(|h| {
            (0u8..6).find_map(|d| {
                let (dq, dr) = tr::HEX_DIRS[usize::from(d)];
                set.contains(&vm::HexCoord::new(h.q + dq, h.r + dr))
                    .then_some((*h, d))
            })
        })
        .unwrap();
    bad.borders[0].edges.push(vm::BorderEdgeDto { hex, dir });
    let owner = dto.by_owner[0].owner_id.legacy_i64();
    assert_eq!(
        territory_ranges_border_edges(&bad),
        Err(OverlayAdapterError::TerritoryBorderMismatch { owner })
    );
    // Missing outer side.
    let mut bad = dto.clone();
    bad.borders[0].edges.pop();
    assert_eq!(
        territory_ranges_border_edges(&bad),
        Err(OverlayAdapterError::TerritoryBorderMismatch { owner })
    );
    // Owners out of order.
    let mut bad = dto.clone();
    bad.borders.swap(0, 1);
    assert_eq!(
        territory_ranges_border_edges(&bad),
        Err(OverlayAdapterError::TerritoryBorderOwners)
    );
    // `dir` out of range.
    let mut bad = dto;
    bad.borders[0].edges[0].dir = 6;
    assert_eq!(
        territory_ranges_border_edges(&bad),
        Err(OverlayAdapterError::TerritoryBorderMismatch { owner })
    );
}

/// JSON shape of the DTO (camelCase, strict).
#[test]
fn dto_json_round_trip() {
    let dto = produce(&scenarios()[1]);
    let v = serde_json::to_value(&dto).unwrap();
    let keys: Vec<&str> = v.as_object().unwrap().keys().map(String::as_str).collect();
    assert_eq!(keys, ["borders", "byOwner"]);
    assert_eq!(
        v["borders"][0]["edges"][0]
            .as_object()
            .unwrap()
            .keys()
            .collect::<Vec<_>>(),
        ["dir", "hex"]
    );
    let back: vm::TerritoryRangesDto = serde_json::from_value(v).unwrap();
    assert_eq!(back, dto);
}
