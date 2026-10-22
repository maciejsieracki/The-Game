//! P6.M14 - `map/wonder-placement.ts` (1-119): wektory z URUCHOMIONEGO weba (pin edb8fb56).
//! Oczekiwania wylacznie z `tests/p6_m14_vectors/wonder.json` (kolejnosc wyniku porownywana 1:1).

#[path = "p6_m14_vectors/common.rs"]
mod common;

use civ_engine::domain::hex::HexCoord;
use civ_engine::domain::wonder_placement::{
    list_qualifying_wonder_hexes_for_city, list_qualifying_wonder_hexes_for_owner,
    pick_wonder_hex_for_city, PickWonderHexInput, WonderMapHex, WonderMapPlacementInput,
    WonderPlacementCity,
};
use common::*;
use serde_json::Value;

fn data() -> Value {
    load("wonder.json")
}

fn map(v: &Value) -> Vec<WonderMapHex> {
    v.as_array()
        .unwrap()
        .iter()
        .map(|h| WonderMapHex {
            coords: HexCoord::new(int(&h["q"]), int(&h["r"])),
            terrain: terrain(h["terrain"].as_str().unwrap()),
        })
        .collect()
}

fn wcity(v: &Value) -> WonderPlacementCity {
    WonderPlacementCity {
        q: int(&v["q"]),
        r: int(&v["r"]),
        population: num(&v["population"]),
        is_outpost: opt_bool(&v["isOutpost"]),
        is_fort: opt_bool(&v["isFort"]),
    }
}

#[test]
fn list_for_city_matches_web() {
    let d = data();
    let mut nonempty = 0;
    for (i, c) in arr(&d, "city").iter().enumerate() {
        let m = map(&c["hexes"]);
        let city = wcity(&c["city"]);
        let occupied = coords(&c["occupiedWonderHexes"]);
        let city_hexes = coords(&c["cityHexes"]);
        let got = list_qualifying_wonder_hexes_for_city(&PickWonderHexInput {
            map: &m,
            city: &city,
            occupied_wonder_hexes: &occupied,
            city_hexes: &city_hexes,
        });
        assert_eq!(got, coords(&c["out"]), "city[{i}]");
        nonempty += usize::from(!got.is_empty());
    }
    assert!(nonempty > 40);
}

#[test]
fn pick_matches_web() {
    let d = data();
    let (mut some, mut none) = (0, 0);
    for (i, c) in arr(&d, "pick").iter().enumerate() {
        let m = map(&c["hexes"]);
        let city = wcity(&c["city"]);
        let occupied = coords(&c["occupiedWonderHexes"]);
        let city_hexes = coords(&c["cityHexes"]);
        let got = pick_wonder_hex_for_city(&PickWonderHexInput {
            map: &m,
            city: &city,
            occupied_wonder_hexes: &occupied,
            city_hexes: &city_hexes,
        });
        let want = if c["out"].is_null() {
            None
        } else {
            Some(HexCoord::new(int(&c["out"]["q"]), int(&c["out"]["r"])))
        };
        assert_eq!(got, want, "pick[{i}]");
        if got.is_some() {
            some += 1;
        } else {
            none += 1;
        }
    }
    assert!(some > 0 && none > 0);
}

#[test]
fn list_for_owner_matches_web() {
    let d = data();
    let mut nonempty = 0;
    for (i, c) in arr(&d, "owner").iter().enumerate() {
        let m = map(&c["hexes"]);
        let cities: Vec<_> = arr(c, "playerCities").iter().map(wcity).collect();
        let occupied = coords(&c["occupiedWonderHexes"]);
        let building = coords(&c["buildingWonderHexes"]);
        let city_hexes = coords(&c["cityHexes"]);
        let got = list_qualifying_wonder_hexes_for_owner(&WonderMapPlacementInput {
            map: &m,
            player_cities: &cities,
            occupied_wonder_hexes: &occupied,
            building_wonder_hexes: &building,
            city_hexes: &city_hexes,
        });
        assert_eq!(
            got,
            coords(&c["out"]),
            "owner[{i}] (kolejnosc pierwszego wystapienia)"
        );
        nonempty += usize::from(!got.is_empty());
    }
    assert!(nonempty > 30);
}

#[test]
fn shape_candidates_are_sorted_land_and_exclude_center() {
    // Testy ksztaltu (bez pinow wartosci) na wektorach: kolejnosc dist,q,r; tylko ladowe; bez centrum.
    use civ_engine::domain::terrain::axial_distance;
    let d = data();
    for c in arr(&d, "city") {
        let m = map(&c["hexes"]);
        let city = wcity(&c["city"]);
        let out = coords(&c["out"]);
        let mut prev: Option<(f64, i32, i32)> = None;
        for h in &out {
            let dist = axial_distance(h.q, h.r, city.q, city.r);
            assert!(dist > 0.0, "centrum miasta nie moze byc kandydatem");
            let t = m
                .iter()
                .find(|x| x.coords == *h)
                .expect("heks z mapy")
                .terrain;
            assert!(t.is_land() && t != civ_engine::domain::terrain::TerrainType::Mountains);
            if let Some(p) = prev {
                assert!((dist, h.q, h.r) >= p, "porzadek dist,q,r");
            }
            prev = Some((dist, h.q, h.r));
        }
    }
}
