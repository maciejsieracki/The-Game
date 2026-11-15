//! Producer checks (`RenderViewDto::validate`, `RenderLayersDto::validate`):
//! each invariant has a passing and a failing case with the exact error.
//!
//! Per-field coverage is tabular (Evaluator r1, Z1): every `f64` /
//! `Option<f64>` field gets `NaN`, `+Inf` and `-Inf`
//! ([`every_float_field_rejects_non_finite`]), and the table is checked
//! against the `f64` leaves of the serialized sample
//! ([`float_table_covers_every_f64_field`]), so a new float field fails until
//! it gets a row. Every ranged integer gets its bounds (accepted) and
//! bound + 1 / bound - 1 (rejected) ([`every_ranged_integer_rejects_out_of_range`]).

mod common;

use civ_view_model::*;
use common::*;
use serde_json::Value;
use std::collections::BTreeSet;

fn err(view: &RenderViewDto) -> ViewError {
    view.validate().expect_err("invalid snapshot accepted")
}

/// The same error from the full snapshot and from the split layers checked
/// against their map (both paths share the checks).
fn err_both(view: &RenderViewDto) -> ViewError {
    let full = err(view);
    let (map, layers) = view.clone().split();
    assert_eq!(layers.validate(&map), Err(full.clone()), "split path");
    full
}

#[test]
fn samples_are_valid() {
    sample_view().validate().unwrap();
    sample_view_minimal().validate().unwrap();
    let (map, layers) = sample_view().split();
    layers.validate(&map).unwrap();
}

/// The synthetic size-measurement snapshots satisfy every invariant too
/// (including the `r`-major hex order).
#[test]
fn synthetic_snapshots_are_valid() {
    for s in &SCENARIOS {
        synthetic_view(s)
            .validate()
            .unwrap_or_else(|e| panic!("{}: {e}", s.name));
    }
}

/// Why the float check exists: JSON has no `NaN`/`Infinity`. serde_json
/// writes them as `null` (like `JSON.stringify`), and the snapshot then does
/// not parse back.
#[test]
fn non_finite_float_breaks_json_round_trip() {
    let mut view = sample_view();
    view.units[0].hp = f64::NAN;
    let text = serde_json::to_string(&view).unwrap();
    assert!(text.contains("\"hp\":null"));
    assert!(serde_json::from_str::<RenderViewDto>(&text).is_err());
    assert_eq!(
        err(&view),
        ViewError::NonFinite {
            field: "units[0].hp".into()
        }
    );
}

#[test]
fn contract_version() {
    let mut view = sample_view();
    view.contract_version = CONTRACT_VERSION + 1;
    assert_eq!(
        err(&view),
        ViewError::ContractVersion {
            actual: CONTRACT_VERSION + 1
        }
    );
    // An older version is rejected too (the check is `!=`, not `>`).
    let mut view = sample_view();
    view.contract_version = CONTRACT_VERSION - 1;
    assert_eq!(
        err(&view),
        ViewError::ContractVersion {
            actual: CONTRACT_VERSION - 1
        }
    );
    let (map, mut layers) = sample_view().split();
    layers.contract_version = CONTRACT_VERSION - 1;
    assert_eq!(
        layers.validate(&map),
        Err(ViewError::ContractVersion {
            actual: CONTRACT_VERSION - 1
        })
    );
}

/// `RenderLayersDto::validate` checks the static map it is given as well.
#[test]
fn layers_validate_checks_the_map() {
    let (mut map, layers) = sample_view().split();
    map.seed = f64::NAN;
    assert_eq!(
        layers.validate(&map),
        Err(ViewError::NonFinite {
            field: "map.seed".into()
        })
    );
    let (mut map, layers) = sample_view().split();
    map.hexes[0].rzeka_krawedzie.push(6);
    assert!(matches!(
        layers.validate(&map),
        Err(ViewError::OutOfRange { field, .. }) if field.starts_with("map.hexes[0].rzekaKrawedzie")
    ));
}

#[test]
fn parallel_lengths() {
    let mut view = sample_view();
    view.hex_state.pop();
    assert_eq!(
        err(&view),
        ViewError::LengthMismatch {
            field: "hexState".into(),
            expected: 4,
            actual: 3
        }
    );
    let mut view = sample_view();
    view.fog.state.push(FogState::Visible);
    assert_eq!(
        err(&view),
        ViewError::LengthMismatch {
            field: "fog.state".into(),
            expected: 4,
            actual: 5
        }
    );
    // Layers checked against another (well-formed, 2 x 1) map.
    let (mut map, layers) = sample_view().split();
    map.height = 1;
    map.hexes.truncate(2);
    validate_map(&map).unwrap();
    assert_eq!(
        layers.validate(&map),
        Err(ViewError::LengthMismatch {
            field: "hexState".into(),
            expected: 2,
            actual: 4
        })
    );
}

/// Contract §3.2 / §1.4 (Evaluator r1, Z4): `map.hexes` is the
/// `width x height` parallelogram in `r`-major, `q`-minor order, the order
/// `hexState` and `fog.state` are parallel to.
#[test]
fn map_shape_and_order() {
    // Fewer hexes than `width * height`.
    let mut view = sample_view();
    view.map.width = 3;
    assert_eq!(
        err_both(&view),
        ViewError::LengthMismatch {
            field: "map.hexes".into(),
            expected: 6,
            actual: 4
        }
    );
    // `q`-major order (two hexes swapped): the fog would land on wrong hexes.
    let mut view = sample_view();
    view.map.hexes.swap(1, 2);
    assert_eq!(
        err_both(&view),
        ViewError::HexOrder {
            field: "map.hexes[1].coord".into(),
            expected: h(1, 0),
            actual: h(0, 1)
        }
    );
    // A duplicate coordinate (and so a missing one).
    let mut view = sample_view();
    view.map.hexes[3].coord = h(0, 1);
    assert_eq!(
        err_both(&view),
        ViewError::HexOrder {
            field: "map.hexes[3].coord".into(),
            expected: h(1, 1),
            actual: h(0, 1)
        }
    );
    // Shifted origin (the web loop starts at 0, `map/generator.ts:216-217`).
    let mut view = sample_view();
    for hex in &mut view.map.hexes {
        hex.coord.q += 1;
    }
    assert_eq!(
        err_both(&view),
        ViewError::HexOrder {
            field: "map.hexes[0].coord".into(),
            expected: h(0, 0),
            actual: h(1, 0)
        }
    );
    // A non-square map: width 3, height 2 in `r`-major order is valid; the
    // same hexes in `q`-major order are not.
    let r_major: Vec<HexCoord> = (0..2).flat_map(|r| (0..3).map(move |q| h(q, r))).collect();
    let q_major: Vec<HexCoord> = (0..3).flat_map(|q| (0..2).map(move |r| h(q, r))).collect();
    let map_of = |coords: &[HexCoord]| MapViewDto {
        width: 3,
        height: 2,
        seed: 0.0,
        hexes: coords
            .iter()
            .map(|&coord| HexStaticDto {
                coord,
                teren_bazowy: Terrain::Laka,
                rzeka_krawedzie: vec![],
            })
            .collect(),
        rivers: vec![],
        river_render_paths: vec![],
    };
    validate_map(&map_of(&r_major)).unwrap();
    assert_eq!(
        validate_map(&map_of(&q_major)),
        Err(ViewError::HexOrder {
            field: "map.hexes[1].coord".into(),
            expected: h(1, 0),
            actual: h(0, 1)
        })
    );
    // An empty map is consistent with `0 x n`.
    let mut empty = map_of(&[]);
    empty.width = 0;
    validate_map(&empty).unwrap();
    assert_eq!(
        ViewError::HexOrder {
            field: "map.hexes[1].coord".into(),
            expected: h(1, 0),
            actual: h(0, 1)
        }
        .to_string(),
        "map.hexes[1].coord: (0,1) where the r-major order expects (1,0)"
    );
}

/// Sets one float field of the sample.
type FloatSetter = Box<dyn Fn(&mut RenderViewDto, f64)>;

/// One row per `f64` / `Option<f64>` field of the contract: the setter and
/// the JSON path the validator must report.
fn float_cases() -> Vec<(FloatSetter, &'static str)> {
    vec![
        (Box::new(|v, x| v.map.seed = x), "map.seed"),
        (Box::new(|v, x| v.owners[1].era = x), "owners[1].era"),
        (
            Box::new(|v, x| v.cities[0].population = x),
            "cities[0].population",
        ),
        (Box::new(|v, x| v.cities[0].level = x), "cities[0].level"),
        (
            Box::new(|v, x| v.cities[0].badge.population = x),
            "cities[0].badge.population",
        ),
        (
            Box::new(|v, x| v.cities[0].badge.growth_percent = Some(x)),
            "cities[0].badge.growthPercent",
        ),
        (
            Box::new(|v, x| v.cities[0].badge.era = x),
            "cities[0].badge.era",
        ),
        (Box::new(|v, x| v.units[1].ruch_max = x), "units[1].ruchMax"),
        (
            Box::new(|v, x| v.units[0].ruch_left = x),
            "units[0].ruchLeft",
        ),
        (Box::new(|v, x| v.units[1].hp = x), "units[1].hp"),
        (
            Box::new(|v, x| v.units[1].hp_max = Some(x)),
            "units[1].hpMax",
        ),
        (
            Box::new(|v, x| v.stacks.vitals_by_rep_id[0].1.ruch_left = x),
            "stacks.vitalsByRepId[0][1].ruchLeft",
        ),
        (
            Box::new(|v, x| v.stacks.vitals_by_rep_id[0].1.ruch_max = x),
            "stacks.vitalsByRepId[0][1].ruchMax",
        ),
        (
            Box::new(|v, x| v.stacks.vitals_by_rep_id[0].1.hp = x),
            "stacks.vitalsByRepId[0][1].hp",
        ),
        (
            Box::new(|v, x| v.stacks.vitals_by_rep_id[0].1.hp_max = x),
            "stacks.vitalsByRepId[0][1].hpMax",
        ),
        (
            Box::new(|v, x| v.stacks.vitals_by_rep_id[0].1.field_power_m = x),
            "stacks.vitalsByRepId[0][1].fieldPowerM",
        ),
        (
            Box::new(|v, x| v.overlays.okolica.as_mut().unwrap().range = x),
            "overlays.okolica.range",
        ),
        (
            Box::new(|v, x| v.overlays.okolica.as_mut().unwrap().yields[1].1.zywnosc = Some(x)),
            "overlays.okolica.yields[1][1].zywnosc",
        ),
        (
            Box::new(|v, x| v.overlays.okolica.as_mut().unwrap().yields[0].1.praca = Some(x)),
            "overlays.okolica.yields[0][1].praca",
        ),
        (
            Box::new(|v, x| v.overlays.okolica.as_mut().unwrap().yields[0].1.handel = Some(x)),
            "overlays.okolica.yields[0][1].handel",
        ),
        (
            Box::new(|v, x| v.battle.as_mut().unwrap().setup.units[0].hp = x),
            "battle.setup.units[0].hp",
        ),
        (
            Box::new(|v, x| v.battle.as_mut().unwrap().setup.units[1].max_hp = x),
            "battle.setup.units[1].maxHp",
        ),
        (
            Box::new(|v, x| v.battle.as_mut().unwrap().setup.units[0].morale = x),
            "battle.setup.units[0].morale",
        ),
        (
            Box::new(|v, x| v.battle.as_mut().unwrap().setup.units[0].morale_max = x),
            "battle.setup.units[0].moraleMax",
        ),
        (
            Box::new(|v, x| v.battle.as_mut().unwrap().setup.units[1].ammo_left = Some(x)),
            "battle.setup.units[1].ammoLeft",
        ),
        (
            Box::new(|v, x| v.battle.as_mut().unwrap().setup.units[0].ammo_max = Some(x)),
            "battle.setup.units[0].ammoMax",
        ),
    ]
}

/// Z1: every float field, alone, with `NaN`, `+Inf` and `-Inf`, is reported
/// at its own path (full snapshot and split layers).
#[test]
fn every_float_field_rejects_non_finite() {
    let cases = float_cases();
    assert_eq!(cases.len(), 26);
    for (set, field) in &cases {
        // A finite value is accepted (the row is not rejected for another
        // reason).
        let mut ok = sample_view();
        set(&mut ok, 0.5);
        ok.validate()
            .unwrap_or_else(|e| panic!("{field} = 0.5: {e}"));
        for bad in [f64::NAN, f64::INFINITY, f64::NEG_INFINITY] {
            let mut view = sample_view();
            set(&mut view, bad);
            assert_eq!(
                err_both(&view),
                ViewError::NonFinite {
                    field: (*field).into()
                },
                "{field} = {bad}"
            );
        }
    }
}

/// `units[3]`, `yields[0][1]` → `units[]`, `yields[][]`.
fn normalize(path: &str) -> String {
    let mut out = String::new();
    let mut in_index = false;
    for c in path.chars() {
        match c {
            '[' => {
                in_index = true;
                out.push('[');
            }
            ']' => {
                in_index = false;
                out.push(']');
            }
            _ if in_index => {}
            _ => out.push(c),
        }
    }
    out
}

/// Paths of every `f64` leaf (serde_json keeps an `f64` as a float number,
/// `2.0` included; integers stay integers).
fn f64_leaves(v: &Value, path: &str, out: &mut BTreeSet<String>) {
    match v {
        Value::Number(n) if n.is_f64() => {
            out.insert(normalize(path));
        }
        Value::Array(items) => {
            for (i, item) in items.iter().enumerate() {
                f64_leaves(item, &format!("{path}[{i}]"), out);
            }
        }
        Value::Object(map) => {
            for (k, item) in map {
                let p = if path.is_empty() {
                    k.clone()
                } else {
                    format!("{path}.{k}")
                };
                f64_leaves(item, &p, out);
            }
        }
        _ => {}
    }
}

/// Z1 completeness: the table rows are exactly the `f64` fields of the
/// snapshot (every `Option<f64>` is `Some` somewhere in [`sample_view`]).
#[test]
fn float_table_covers_every_f64_field() {
    let mut in_json = BTreeSet::new();
    f64_leaves(
        &serde_json::to_value(sample_view()).unwrap(),
        "",
        &mut in_json,
    );
    let in_table: BTreeSet<String> = float_cases().iter().map(|c| normalize(c.1)).collect();
    assert_eq!(in_table.len(), float_cases().len(), "duplicate row");
    assert_eq!(in_json, in_table);
    assert_eq!(in_json.len(), 26);
}

/// Sets one integer field of the sample.
type IntSetter = Box<dyn Fn(&mut RenderViewDto, i64)>;

fn u8_of(x: i64) -> u8 {
    u8::try_from(x).expect("u8 test value")
}

fn u32_of(x: i64) -> u32 {
    u32::try_from(x).expect("u32 test value")
}

fn i32_of(x: i64) -> i32 {
    i32::try_from(x).expect("i32 test value")
}

/// One row per ranged integer: setter, JSON path, `min`, `max`, and whether
/// `min - 1` fits the Rust type (`u8` / `u32` at `0` cannot go lower).
///
/// The bounds are the contract values written out (not the crate's `MAX_*`
/// constants), so a changed constant fails here: `0xRRGGBB`; `roadMask` 6
/// edge bits; edge index `0..=5`; stars / badge levels `0..=3` and
/// `veteranLevel` `1..=3` (`game/armyMerge.ts:1103-1126`); `CityMapDefenseTier`
/// `0 | 1 | 2`; battle `Dir` `0..=3` and `BTerrain` `0..=7` (the last three
/// are also tied to the pin fixture in `tests/pin_vectors.rs`).
fn int_cases() -> Vec<(IntSetter, &'static str, i64, i64, bool)> {
    let badge = 3;
    let color = 0x00FF_FFFF;
    vec![
        (
            Box::new(|v, x| v.map.hexes[2].rzeka_krawedzie[0] = u8_of(x)),
            "map.hexes[2].rzekaKrawedzie[0]",
            0,
            5,
            false,
        ),
        (
            Box::new(|v, x| v.hex_state[1].road_mask = u8_of(x)),
            "hexState[1].roadMask",
            0,
            0x3F,
            false,
        ),
        (
            Box::new(|v, x| v.owners[0].color = u32_of(x)),
            "owners[0].color",
            0,
            color,
            false,
        ),
        (
            Box::new(|v, x| v.cities[0].badge.defense_tier = u8_of(x)),
            "cities[0].badge.defenseTier",
            0,
            2,
            false,
        ),
        (
            Box::new(|v, x| v.cities[0].badge.owner_color = u32_of(x)),
            "cities[0].badge.ownerColor",
            0,
            color,
            false,
        ),
        (
            Box::new(|v, x| v.units[1].veteran_stars = u8_of(x)),
            "units[1].veteranStars",
            0,
            badge,
            false,
        ),
        (
            Box::new(|v, x| v.units[0].armor_badge_level = u8_of(x)),
            "units[0].armorBadgeLevel",
            0,
            badge,
            false,
        ),
        (
            Box::new(|v, x| v.units[1].soft_badge_level = u8_of(x)),
            "units[1].softBadgeLevel",
            0,
            badge,
            false,
        ),
        (
            Box::new(|v, x| v.stacks.vitals_by_rep_id[0].1.armor_badge_level = u8_of(x)),
            "stacks.vitalsByRepId[0][1].armorBadgeLevel",
            0,
            badge,
            false,
        ),
        (
            Box::new(|v, x| v.stacks.vitals_by_rep_id[0].1.soft_badge_level = u8_of(x)),
            "stacks.vitalsByRepId[0][1].softBadgeLevel",
            0,
            badge,
            false,
        ),
        (
            Box::new(|v, x| v.stacks.vitals_by_rep_id[0].1.veteran_level = u8_of(x)),
            "stacks.vitalsByRepId[0][1].veteranLevel",
            1,
            badge,
            true,
        ),
        (
            Box::new(|v, x| v.stacks.vitals_by_rep_id[0].1.veteran_stars = u8_of(x)),
            "stacks.vitalsByRepId[0][1].veteranStars",
            0,
            badge,
            false,
        ),
        (
            Box::new(|v, x| v.battle.as_mut().unwrap().setup.grid.tiles[5] = u8_of(x)),
            "battle.setup.grid.tiles[5]",
            0,
            7,
            false,
        ),
        (
            Box::new(|v, x| v.battle.as_mut().unwrap().setup.units[1].owner_color = u32_of(x)),
            "battle.setup.units[1].ownerColor",
            0,
            color,
            false,
        ),
        (
            Box::new(|v, x| v.battle.as_mut().unwrap().setup.units[0].facing = i32_of(x)),
            "battle.setup.units[0].facing",
            0,
            3,
            true,
        ),
    ]
}

/// Z1 / Z4: every ranged integer accepts `min` and `max` and rejects
/// `max + 1` (and `min - 1` where the type allows it) at its own path.
#[test]
fn every_ranged_integer_rejects_out_of_range() {
    let cases = int_cases();
    assert_eq!(cases.len(), 15);
    for (set, field, min, max, below) in &cases {
        for good in [*min, *max] {
            let mut view = sample_view();
            set(&mut view, good);
            view.validate()
                .unwrap_or_else(|e| panic!("{field} = {good}: {e}"));
        }
        let mut bad = vec![*max + 1];
        if *below {
            bad.push(*min - 1);
        }
        for value in bad {
            let mut view = sample_view();
            set(&mut view, value);
            assert_eq!(
                err_both(&view),
                ViewError::OutOfRange {
                    field: (*field).into(),
                    value,
                    min: *min,
                    max: *max
                },
                "{field} = {value}"
            );
        }
    }
}

/// Unlimited ammunition is `None` (web `Infinity`), which is valid.
#[test]
fn unlimited_ammo_is_none() {
    let view = sample_view();
    let spawn = &view.battle.as_ref().unwrap().setup.units[1];
    assert_eq!(spawn.ammo_left, None);
    let tree = serde_json::to_value(&view).unwrap();
    assert_eq!(
        tree["battle"]["setup"]["units"][1]["ammoLeft"],
        serde_json::Value::Null
    );
    view.validate().unwrap();
}

#[test]
fn battle_grid_length() {
    let mut view = sample_view();
    view.battle.as_mut().unwrap().setup.grid.tiles.pop();
    assert_eq!(
        err(&view),
        ViewError::LengthMismatch {
            field: "battle.setup.grid.tiles".into(),
            expected: 6,
            actual: 5
        }
    );
    for (cols, rows, field) in [
        (-1, 2, "battle.setup.grid.cols"),
        (3, -1, "battle.setup.grid.rows"),
    ] {
        let mut view = sample_view();
        let grid = &mut view.battle.as_mut().unwrap().setup.grid;
        grid.cols = cols;
        grid.rows = rows;
        assert_eq!(
            err(&view),
            ViewError::OutOfRange {
                field: field.into(),
                value: -1,
                min: 0,
                max: i64::from(i32::MAX)
            }
        );
    }
}

#[test]
fn error_messages_name_the_field() {
    let mut view = sample_view();
    view.units[1].hp = f64::NAN;
    assert_eq!(err(&view).to_string(), "units[1].hp: not a finite number");
}
