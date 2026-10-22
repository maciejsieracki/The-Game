//! P6.M14 - `map/territory.ts` (1-145): wektory z URUCHOMIONEGO weba (pin edb8fb56), porownanie
//! BITOWE f64 (NaN/Infinity/-0 zakodowane jako stringi w JSON). Brak pinow wartosci w kodzie testu:
//! oczekiwania pochodza wylacznie z `tests/p6_m14_vectors/territory.json`.

#[path = "p6_m14_vectors/common.rs"]
mod common;

use civ_engine::domain::terrain::{axial_distance, city_range_for_population};
use civ_engine::domain::territory::{
    axial_distance_f64, city_sight_radius, city_territory_radius, is_in_territory,
    is_player_territory_hex, territory_owner_at,
};
use common::*;
use serde_json::Value;

fn data() -> Value {
    load("territory.json")
}

fn border_lookup(d: &Value) -> impl Fn(f64) -> f64 + '_ {
    let table: Vec<(f64, f64)> = arr(d, "border")
        .iter()
        .map(|b| (num(&b["kultura"]), num(&b["ring"])))
        .collect();
    move |k: f64| {
        table
            .iter()
            .find(|(kk, _)| kk.to_bits() == k.to_bits() || (kk.is_nan() && k.is_nan()))
            .map(|(_, ring)| *ring)
            .unwrap_or_else(|| panic!("brak wektora cityBorderRadius dla {k:?}"))
    }
}

#[test]
fn city_territory_radius_matches_web() {
    let d = data();
    let rows = arr(&d, "radius");
    assert!(rows.len() >= 100);
    for (i, c) in rows.iter().enumerate() {
        assert_bits(
            &format!("radius[{i}]"),
            city_territory_radius(&city_node(&c["node"])),
            num(&c["out"]),
        );
    }
}

#[test]
fn axial_distance_matches_web_and_integer_variant() {
    let d = data();
    for (i, c) in arr(&d, "axial").iter().enumerate() {
        let (a, b) = (&c["a"], &c["b"]);
        let (aq, ar, bq, br) = (num(&a[0]), num(&a[1]), num(&b[0]), num(&b[1]));
        let want = num(&c["out"]);
        assert_bits(
            &format!("axial_f64[{i}]"),
            axial_distance_f64(aq, ar, bq, br),
            want,
        );
        if [aq, ar, bq, br].iter().all(|x| x.fract() == 0.0) {
            assert_bits(
                &format!("axial_i32[{i}]"),
                axial_distance(aq as i32, ar as i32, bq as i32, br as i32),
                want,
            );
        }
    }
}

#[test]
fn city_range_for_population_matches_web() {
    let d = data();
    let rows = arr(&d, "range_for_pop");
    assert!(rows.len() >= 20);
    for (i, c) in rows.iter().enumerate() {
        assert_bits(
            &format!("range_for_pop[{i}]"),
            city_range_for_population(num(&c["pop"])),
            num(&c["out"]),
        );
    }
    // Stale CITY_RANGE_MIN/CAP z weba sa zgodne z granicami funkcji z Rust (dane z JSON, nie z kodu).
    let min = num(&d["constants"]["CITY_RANGE_MIN"]);
    let cap = num(&d["constants"]["CITY_RANGE_CAP"]);
    assert_bits("MIN", city_range_for_population(1.0), min);
    assert_bits("CAP", city_range_for_population(1.0e9), cap);
}

#[test]
fn city_sight_radius_matches_web() {
    let d = data();
    let border = border_lookup(&d);
    let rows = arr(&d, "sight");
    assert!(rows.len() >= 300);
    for (i, c) in rows.iter().enumerate() {
        let kultura = opt_num(&c["kultura"]).unwrap_or(0.0); // web: domyslnie kulturaSkumulowana = 0
        assert_bits(
            &format!("sight[{i}]"),
            city_sight_radius(num(&c["pop"]), kultura, &border),
            num(&c["out"]),
        );
    }
}

#[test]
fn territory_owner_at_matches_web() {
    let d = data();
    let rows = arr(&d, "owner_at");
    assert!(rows.len() >= 400);
    let mut some = 0;
    for (i, c) in rows.iter().enumerate() {
        let nodes = territory_nodes(&c["nodes"]);
        let got = territory_owner_at(num(&c["q"]), num(&c["r"]), &nodes);
        assert_eq!(got, c["out"].as_i64(), "owner_at[{i}]");
        some += usize::from(got.is_some());
    }
    assert!(
        some > 50 && some < rows.len(),
        "wektory musza miec trafienia i pudla"
    );
}

#[test]
fn is_in_territory_matches_web() {
    let d = data();
    let (mut yes, mut no) = (0, 0);
    for (i, c) in arr(&d, "in_territory").iter().enumerate() {
        let nodes: Vec<_> = territory_nodes(&c["nodes"])
            .into_iter()
            .map(|t| t.node)
            .collect();
        let got = is_in_territory(num(&c["q"]), num(&c["r"]), &nodes);
        assert_eq!(got, c["out"].as_bool().unwrap(), "in_territory[{i}]");
        if got {
            yes += 1;
        } else {
            no += 1;
        }
    }
    assert!(yes > 0 && no > 0);
}

#[test]
fn is_player_territory_hex_matches_web() {
    let d = data();
    let (mut empty_all, mut full_all) = (0, 0);
    for (i, c) in arr(&d, "player_hex").iter().enumerate() {
        let all = territory_nodes(&c["allNodes"]);
        let player = city_nodes(&c["playerNodes"]);
        let owner = c["playerOwnerId"].as_i64().unwrap_or(0); // web: domyslnie playerOwnerId = 0
        let got = is_player_territory_hex(num(&c["q"]), num(&c["r"]), &player, &all, owner);
        assert_eq!(got, c["out"].as_bool().unwrap(), "player_hex[{i}]");
        if all.is_empty() {
            empty_all += 1;
        } else {
            full_all += 1;
        }
    }
    assert!(
        empty_all > 0 && full_all > 0,
        "obie galezie (lista wszystkich pusta / pelna)"
    );
}

#[test]
fn owner_tie_goes_to_first_node() {
    // Test ksztaltu (bez pinu liczb): dwa wezly tego samego zasiegu w rownej odleglosci -> pierwszy.
    use civ_engine::domain::terrain::CityNode;
    use civ_engine::domain::territory::TerritoryNode;
    let a = TerritoryNode::new(CityNode::city(2, 0, 8.0), 11);
    let b = TerritoryNode::new(CityNode::city(-2, 2, 8.0), 22);
    assert_eq!(territory_owner_at(0, 0, &[a.clone(), b.clone()]), Some(11));
    assert_eq!(territory_owner_at(0, 0, &[b, a]), Some(22));
}
