//! P4-1F1 (`R-RUSTPORT-P4-1F1-OVERLAY-TYPES`): shape of the overlay DTOs
//! against the pin `07d2fbd72` (`gra/src/**`).
//!
//! (a) `pathRoute` = `{hexes, turnStops: [{hex, turn}]}` and `turn` checks;
//! (b) `buildHighlight.kind` separates `wonder` from `improvement`;
//! (c) `cultureRange` / `religionRange` = one hex set (owner `0`);
//! (d) `sieges[].campHexes[]` = `{hex, ownerId}`.
//!
//! Pin vectors below were produced by running the pin functions themselves
//! (`git archive 07d2fbd72 gra/src gra/data`, executed with `tsx`) on the
//! inputs written next to each vector; the printed output is pasted as the
//! expected value. The script is quoted in the Operator report
//! (`dyspozycje/autobot/runs/R-RUSTPORT-P4-1F1-OVERLAY-TYPES/01-operator-r1.md`).

mod common;

use civ_view_model::overlays::{PathRouteDto, PathTurnStopDto, SiegeCampDto};
use civ_view_model::*;
use common::*;
use serde_json::{json, Value};
use std::collections::BTreeSet;

/// `"q,r"` web keys → hexes, keeping the order.
fn hexes(keys: &[&str]) -> Vec<HexCoord> {
    keys.iter()
        .map(|k| {
            let (q, r) = k.split_once(',').expect("q,r");
            h(q.parse().unwrap(), r.parse().unwrap())
        })
        .collect()
}

/// Hexes → `"q,r"` keys, in JSON order (what the renderer iterates).
fn keys_of(v: &Value) -> Vec<String> {
    v.as_array()
        .expect("array")
        .iter()
        .map(|x| format!("{},{}", x["q"], x["r"]))
        .collect()
}

/// Map `hexes` of the vectors: keys inserted as
/// `["10,0","11,0","12,0","2,0","3,0","0,0","1,0"]` (so `Object.keys` order is
/// NOT lexicographic: `"10,0"` comes before `"2,0"`).
const MAP_KEYS: [&str; 7] = ["10,0", "11,0", "12,0", "2,0", "3,0", "0,0", "1,0"];

// ---------------------------------------------------------------- (c) ranges

/// `collectCultureRangeHexKeys(map, cities, 0)` (`map/range-hexes.ts:79-98`)
/// with cities `c1 (11,0) owner 0 pop 1`, `c2 (1,0) owner 0 pop 1`,
/// `c3 (3,0) owner 1 pop 1`, `kultura 0` → pin output
/// `["10,0","11,0","12,0","2,0","3,0","0,0","1,0"]` (Set insertion order:
/// city `c1` first, then the keys of `c2` not yet in the set, each in
/// `Object.keys` order). The DTO is that one set, order kept in JSON.
#[test]
fn culture_range_is_one_set_in_web_order() {
    let pin = ["10,0", "11,0", "12,0", "2,0", "3,0", "0,0", "1,0"];
    let mut o = sample_overlays_none();
    o.culture_range = Some(hexes(&pin));
    let v = serde_json::to_value(&o).unwrap();
    assert_eq!(keys_of(&v["cultureRange"]), pin);
    // Not the lexicographic order of a `BTreeSet` (rozpoznanie §5 pt 4).
    let sorted: Vec<String> = pin
        .iter()
        .map(|s| (*s).to_owned())
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect();
    assert_ne!(keys_of(&v["cultureRange"]), sorted);
    let back: OverlaysViewDto = serde_json::from_value(v).unwrap();
    assert_eq!(back, o);
}

/// `collectReligionRangeHexKeys(map, cities, new Map(), null,
/// {szerzenieMaxDystans: 0}, 0)` (`map/range-hexes.ts:101-140`), same cities
/// → pin output `["10,0","11,0","12,0","2,0","3,0","0,0","1,0"]`.
#[test]
fn religion_range_is_one_set_in_web_order() {
    let pin = ["10,0", "11,0", "12,0", "2,0", "3,0", "0,0", "1,0"];
    let mut o = sample_overlays_none();
    o.religion_range = Some(hexes(&pin));
    let v = serde_json::to_value(&o).unwrap();
    assert_eq!(keys_of(&v["religionRange"]), pin);
    assert_eq!(serde_json::from_value::<OverlaysViewDto>(v).unwrap(), o);
}

/// Empty pin result (`collectCultureRangeHexKeys` with only the owner-1 city,
/// `collectReligionRangeHexKeys` with no cities → `[]`): the web adds no
/// group (`if (keys.size > 0)`, `main.ts:15633`, `:15643`), so the DTO has no
/// layer: `null`.
#[test]
fn empty_range_is_no_layer() {
    let o = sample_overlays_none();
    let v = serde_json::to_value(&o).unwrap();
    assert_eq!(v["cultureRange"], Value::Null);
    assert_eq!(v["religionRange"], Value::Null);
}

/// The old `[{ownerId, hexes}]` shape is rejected (one set, not per owner).
#[test]
fn per_owner_range_shape_is_rejected() {
    let mut v = serde_json::to_value(sample_view()).unwrap();
    v["overlays"]["cultureRange"] = json!([{ "ownerId": 0, "hexes": [{ "q": 0, "r": 0 }] }]);
    assert!(serde_json::from_value::<RenderViewDto>(v).is_err());
}

/// `collectTerritoryHexKeysByOwner(map, nodes, filter)`
/// (`map/range-hexes.ts:28-53`), nodes `(11,0) pop 1 owner 1`,
/// `(1,0) pop 1 owner 0`; filter = fog rule shape (`owner === 0` always,
/// others only when the hex is "seen": here every key but `"12,0"`) → pin
/// `[[1,["10,0","11,0"]],[0,["2,0","3,0","0,0","1,0"]]]` (owner 1 first:
/// its first hex comes first in `Object.keys`). Without the filter the pin
/// gives `[[1,["10,0","11,0","12,0"]],[0,[…same…]]]`. The territory type is
/// unchanged; the vector pins that JSON keeps the web order.
#[test]
fn territory_keeps_map_insertion_order() {
    let t = TerritoryViewDto {
        by_owner: vec![
            OwnerHexesDto {
                owner_id: player(1),
                hexes: hexes(&["10,0", "11,0"]),
            },
            OwnerHexesDto {
                owner_id: player(0),
                hexes: hexes(&["2,0", "3,0", "0,0", "1,0"]),
            },
        ],
    };
    let v = serde_json::to_value(&t).unwrap();
    assert_eq!(v["byOwner"][0]["ownerId"], json!(1));
    assert_eq!(keys_of(&v["byOwner"][0]["hexes"]), ["10,0", "11,0"]);
    assert_eq!(v["byOwner"][1]["ownerId"], json!(0));
    assert_eq!(
        keys_of(&v["byOwner"][1]["hexes"]),
        ["2,0", "3,0", "0,0", "1,0"]
    );
    assert_eq!(serde_json::from_value::<TerritoryViewDto>(v).unwrap(), t);
    // Every vector key exists in the map of the vectors.
    for k in ["10,0", "11,0", "2,0", "3,0", "0,0", "1,0"] {
        assert!(MAP_KEYS.contains(&k));
    }
}

// ---------------------------------------------------------------- (d) siege

/// `campOwnerByHex(['1,0','1,0','0,1'], units, keyOf, 5)`
/// (`render/siegeCampSync.ts:30-47`) with units
/// `[(1,0) owner 5, (1,0) owner 2, (0,1) owner 3, (0,1) owner 3]` → pin
/// `[["1,0",2],["0,1",3]]`: the first unit on the hex whose owner is not the
/// city owner (`5`). The DTO carries it per camp entry, duplicates kept.
#[test]
fn camp_owner_per_entry_matches_pin() {
    let siege = SiegeViewDto {
        city_id: cid(7),
        city_hex: h(0, 0),
        camp_hexes: vec![
            SiegeCampDto {
                hex: h(1, 0),
                owner_id: player(2),
            },
            SiegeCampDto {
                hex: h(1, 0),
                owner_id: player(2),
            },
            SiegeCampDto {
                hex: h(0, 1),
                owner_id: player(3),
            },
        ],
        ready_machines: vec![
            SiegeMachineKind::Taran,
            SiegeMachineKind::Wieza,
            SiegeMachineKind::Taran,
        ],
    };
    let v = serde_json::to_value(&siege).unwrap();
    assert_eq!(
        v["campHexes"],
        json!([
            { "hex": { "q": 1, "r": 0 }, "ownerId": 2 },
            { "hex": { "q": 1, "r": 0 }, "ownerId": 2 },
            { "hex": { "q": 0, "r": 1 }, "ownerId": 3 },
        ])
    );
    // `machinesByCampHex(camps, ['taran','wieza','taran'])` → pin
    // `[["1,0",["taran","wieza"]],["0,1",["taran"]]]`: round-robin over the
    // entry list (duplicates count), so the list length must stay 3.
    let camps = &siege.camp_hexes;
    let mut by_hex: Vec<(HexCoord, Vec<SiegeMachineKind>)> = Vec::new();
    for (i, kind) in siege.ready_machines.iter().enumerate() {
        let hk = camps[i % camps.len()].hex;
        match by_hex.iter_mut().find(|(k, _)| *k == hk) {
            Some((_, list)) => list.push(*kind),
            None => by_hex.push((hk, vec![*kind])),
        }
    }
    assert_eq!(
        by_hex,
        vec![
            (
                h(1, 0),
                vec![SiegeMachineKind::Taran, SiegeMachineKind::Wieza]
            ),
            (h(0, 1), vec![SiegeMachineKind::Taran]),
        ]
    );
    assert_eq!(serde_json::from_value::<SiegeViewDto>(v).unwrap(), siege);
}

/// Mutation guard: a camp entry without its owner (the old `campHexes:
/// [{q, r}]` shape) is rejected.
#[test]
fn camp_without_owner_is_rejected() {
    let mut v = serde_json::to_value(sample_view()).unwrap();
    v["sieges"][0]["campHexes"] = json!([{ "q": 1, "r": 0 }]);
    assert!(serde_json::from_value::<RenderViewDto>(v.clone()).is_err());
    v["sieges"][0]["campHexes"] = json!([{ "hex": { "q": 1, "r": 0 } }]);
    let err = serde_json::from_value::<RenderViewDto>(v).expect_err("no owner accepted");
    assert!(err.to_string().contains("ownerId"), "{err}");
}

// ---------------------------------------------------------- (b) build highlight

/// One kind per branch of `refreshBuildHighlight` (`main.ts:16351-16395`):
/// a wonder (`activeWonderId`, `:16363-16367`) and an improvement
/// (`IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY`, `:16391-16395`) are distinct
/// kinds, so the renderer can pick the opacity.
#[test]
fn wonder_and_improvement_are_distinct_kinds() {
    let w = serde_json::to_value(BuildHighlightKind::Wonder).unwrap();
    let i = serde_json::to_value(BuildHighlightKind::Improvement).unwrap();
    assert_eq!(w, json!("wonder"));
    assert_eq!(i, json!("improvement"));
    assert_ne!(w, i);
}

/// Mutation guard: the removed `generic` kind is rejected, so a wonder can
/// no longer travel as `generic`.
#[test]
fn generic_kind_is_rejected() {
    let mut v = serde_json::to_value(sample_view()).unwrap();
    v["overlays"]["buildHighlight"]["kind"] = json!("generic");
    let err = serde_json::from_value::<RenderViewDto>(v).expect_err("generic accepted");
    assert!(err.to_string().contains("generic"), "{err}");
}

// ---------------------------------------------------------------- (a) route

fn view_with_stops(turns: &[u32]) -> RenderViewDto {
    let mut view = sample_view();
    let route = PathRouteDto {
        hexes: vec![h(1, 0), h(1, 1), h(0, 1), h(0, 0)],
        turn_stops: turns
            .iter()
            .zip([h(1, 1), h(0, 1), h(0, 0)])
            .map(|(&turn, hex)| PathTurnStopDto { hex, turn })
            .collect(),
    };
    view.overlays.path_route = Some(route);
    view
}

/// `setPathRoute([{q: u.q, r: u.r}, ...plan.fullPath], { turnStops })`
/// (`main.ts:31175-31178`): JSON `{hexes, turnStops: [{hex, turn}]}`.
#[test]
fn path_route_json_shape() {
    let v = serde_json::to_value(sample_path_route()).unwrap();
    assert_eq!(
        v,
        json!({
            "hexes": [{ "q": 1, "r": 0 }, { "q": 1, "r": 1 }, { "q": 0, "r": 1 }],
            "turnStops": [
                { "hex": { "q": 1, "r": 1 }, "turn": 1 },
                { "hex": { "q": 0, "r": 1 }, "turn": 2 },
            ],
        })
    );
}

/// Mutation guard: a turn stop without `turn` is rejected.
#[test]
fn turn_stop_without_turn_is_rejected() {
    let mut v = serde_json::to_value(sample_view()).unwrap();
    v["overlays"]["pathRoute"]["turnStops"][0] = json!({ "hex": { "q": 1, "r": 1 } });
    let err = serde_json::from_value::<RenderViewDto>(v).expect_err("no turn accepted");
    assert!(err.to_string().contains("turn"), "{err}");
}

/// The old plain-list `pathRoute` shape is rejected.
#[test]
fn plain_list_route_is_rejected() {
    let mut v = serde_json::to_value(sample_view()).unwrap();
    v["overlays"]["pathRoute"] = json!([{ "q": 1, "r": 0 }, { "q": 1, "r": 1 }]);
    assert!(serde_json::from_value::<RenderViewDto>(v).is_err());
}

/// Valid `turn` sequences (`game/planned-march.ts:116-141`, `:242-268`):
/// start at 1, strictly increasing; gaps are possible (`turnNum++` without
/// a push when `i === 0` or the previous hex is already the last stop), and
/// an empty list (`fullPath` empty / unit already at the destination).
#[test]
fn valid_turns_are_accepted() {
    for turns in [&[][..], &[1], &[1, 2], &[1, 3], &[2], &[1, 2, 5]] {
        let view = view_with_stops(turns);
        view.validate().unwrap_or_else(|e| panic!("{turns:?}: {e}"));
        let (map, layers) = view.split();
        layers.validate(&map).unwrap();
    }
}

/// `turn` = 0, a repeated or a decreasing turn is rejected with the exact
/// field and bounds, on both validation paths.
#[test]
fn invalid_turns_are_rejected() {
    let cases: [(&[u32], usize, i64, i64); 4] = [
        (&[0], 0, 0, 1),
        (&[1, 1], 1, 1, 2),
        (&[2, 1], 1, 1, 3),
        (&[1, 3, 3], 2, 3, 4),
    ];
    for (turns, idx, value, min) in cases {
        let view = view_with_stops(turns);
        let want = ViewError::OutOfRange {
            field: format!("overlays.pathRoute.turnStops[{idx}].turn"),
            value,
            min,
            max: i64::from(u32::MAX),
        };
        assert_eq!(view.validate(), Err(want.clone()), "{turns:?}");
        let (map, layers) = view.split();
        assert_eq!(layers.validate(&map), Err(want), "{turns:?} split");
    }
}

/// `turn: u32` rejects negative and fractional JSON numbers at parse time.
#[test]
fn turn_is_an_unsigned_integer() {
    for bad in [json!(-1), json!(1.5)] {
        let mut v = serde_json::to_value(sample_view()).unwrap();
        v["overlays"]["pathRoute"]["turnStops"][0]["turn"] = bad.clone();
        assert!(
            serde_json::from_value::<RenderViewDto>(v).is_err(),
            "{bad} accepted"
        );
    }
}

/// The contract version moved with this shape change.
#[test]
fn contract_version_bumped() {
    assert_eq!(CONTRACT_VERSION, 2);
}
