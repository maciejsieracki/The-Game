//! P6.6A - `game/visibility.ts` (328 linie): wektory z URUCHOMIONEGO weba (pin edb8fb56), zbiory
//! porownywane jako posortowane po (q, r) listy kluczy "q,r"; liczby bitowo.

#[path = "p6_6a_vectors/common.rs"]
mod common;

use std::collections::BTreeSet;

use civ_engine::data::units_combat::parse_units;
use civ_engine::domain::pathfinding::ruch_jednostek::{Klucz, RuchMapa, TerenBazowy};
use civ_engine::domain::terrain::visibility::{
    add_explored, all_dry_land_keys, all_hex_keys, all_reveal_land_keys, build_unit_sight_resolver,
    city_sight_radius, compute_player_visibility, compute_visible, compute_visible_along_path,
    compute_visible_at, default_sight, default_sight_from, explored_set_for_render,
    fog_explored_brightness, is_dry_land_teren, is_reveal_land_teren, units_visible_on_map,
    ComputePlayerVisibilityOptions, PlayerVisibilityCity, UnitSight, UnitSightDef,
};
use common::*;
use serde_json::Value;

fn data() -> Value {
    load("visibility.json")
}

fn maps(d: &Value) -> Vec<RuchMapa> {
    arr(d, "maps").iter().map(ruch_map).collect()
}

fn real_defs() -> Vec<UnitSightDef> {
    parse_units()
        .expect("units.json")
        .iter()
        .map(UnitSightDef::from_unit_record)
        .collect()
}

fn custom_defs(d: &Value) -> Vec<UnitSightDef> {
    arr(&d["resolverDefs"], "custom")
        .iter()
        .map(|def| UnitSightDef {
            jednostka: text(&def["Jednostka"]),
            widok_pola: json_number(&def["Widok pola"]),
            ruch: json_number(&def["Ruch"]),
        })
        .collect()
}

fn defs_for(d: &Value, set: &str) -> Vec<UnitSightDef> {
    match set {
        "real" => real_defs(),
        "custom" => custom_defs(d),
        "mixed" => real_defs()
            .into_iter()
            .take(10)
            .chain(custom_defs(d))
            .collect(),
        "empty" => Vec::new(),
        other => panic!("zestaw {other}"),
    }
}

fn border_fn(d: &Value) -> impl Fn(f64) -> f64 + '_ {
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
fn constants_match_running_web() {
    let d = data();
    assert_bits(
        "DEFAULT_SIGHT",
        default_sight(),
        num(&d["constants"]["defaultSight"]),
    );
    assert_bits(
        "FOG_EXPLORED_BRIGHTNESS",
        fog_explored_brightness(),
        num(&d["constants"]["fogBrightness"]),
    );
}

/// Testy ksztaltu `mapGenDefaultSight`: wartosc z danych tylko gdy `> 0`, inaczej wartosc zapasowa.
#[test]
fn default_sight_uses_the_data_value_only_when_positive() {
    let fallback = default_sight() + 7.0;
    assert_bits("dodatnia", default_sight_from(2.5, fallback), 2.5);
    for bad in [0.0, -0.0, -1.0, f64::NAN, f64::NEG_INFINITY] {
        assert_bits("niedodatnia", default_sight_from(bad, fallback), fallback);
    }
    assert_bits(
        "nieskonczona",
        default_sight_from(f64::INFINITY, fallback),
        f64::INFINITY,
    );
}

#[test]
fn compute_visible_at_matches_web() {
    let d = data();
    let ms = maps(&d);
    let rows = arr(&d, "at");
    assert!(rows.len() >= 200);
    for (i, row) in rows.iter().enumerate() {
        let got = compute_visible_at(
            int(&row["q"]),
            int(&row["r"]),
            &ms[row["map"].as_u64().expect("map") as usize],
            num(&row["sight"]),
        );
        assert_eq!(
            key_strings(&got),
            strings(&row["out"]),
            "at[{i}] sight={}",
            row["sight"]
        );
    }
}

#[test]
fn compute_visible_along_path_matches_web() {
    let d = data();
    let ms = maps(&d);
    for (i, row) in arr(&d, "path").iter().enumerate() {
        let path: Vec<(i32, i32)> = arr(row, "path")
            .iter()
            .map(|p| (int(&p["q"]), int(&p["r"])))
            .collect();
        let got = compute_visible_along_path(
            &path,
            &ms[row["map"].as_u64().expect("map") as usize],
            num(&row["sight"]),
        );
        assert_eq!(key_strings(&got), strings(&row["out"]), "path[{i}]");
    }
}

#[test]
fn compute_visible_fixed_sight_matches_web() {
    let d = data();
    let ms = maps(&d);
    for (i, row) in arr(&d, "fixed").iter().enumerate() {
        let us = units(&row["units"]);
        let got = compute_visible(
            &us,
            &ms[row["map"].as_u64().expect("map") as usize],
            UnitSight::Fixed(num(&row["sight"])),
        );
        assert_eq!(key_strings(&got), strings(&row["out"]), "fixed[{i}]");
    }
}

#[test]
fn unit_sight_resolver_and_compute_visible_match_web() {
    let d = data();
    let ms = maps(&d);
    let rows = arr(&d, "resolver");
    assert!(rows.len() >= 200);
    for (i, row) in rows.iter().enumerate() {
        let defs = defs_for(&d, row["set"].as_str().expect("set"));
        let resolver = build_unit_sight_resolver(&defs, opt_num(&row["citySight"]));
        let us = units(&row["units"]);
        let sights: Vec<f64> = us.iter().map(&resolver).collect();
        let want = arr(row, "sights");
        assert_eq!(sights.len(), want.len());
        for (j, (g, w)) in sights.iter().zip(want).enumerate() {
            assert_bits(&format!("resolver[{i}].sight[{j}]"), *g, num(w));
        }
        let got = compute_visible(
            &us,
            &ms[row["map"].as_u64().expect("map") as usize],
            UnitSight::Resolver(&*resolver),
        );
        assert_eq!(key_strings(&got), strings(&row["out"]), "resolver[{i}]");
    }
}

#[test]
fn add_explored_and_render_sets_match_web() {
    let d = data();
    for (i, row) in arr(&d, "explored").iter().enumerate() {
        let mut explored = key_set(&row["before"]);
        add_explored(&mut explored, &key_set(&row["visible"]));
        assert_eq!(
            key_strings(&explored),
            strings(&row["out"]),
            "explored[{i}]"
        );
    }
    for (i, row) in arr(&d, "render").iter().enumerate() {
        let explored = key_set(&row["explored"]);
        let land = key_set(&row["land"]);
        let got =
            explored_set_for_render(&explored, &land, row["reveal"].as_bool().expect("reveal"));
        assert_eq!(key_strings(&got), strings(&row["out"]), "render[{i}]");
        if !row["reveal"].as_bool().expect("reveal") {
            assert_eq!(got, explored, "render[{i}] bez reveal = explored");
        }
    }
}

#[test]
fn key_listings_and_terrain_predicates_match_web() {
    let d = data();
    let ms = maps(&d);
    for (i, row) in arr(&d, "keys").iter().enumerate() {
        let m = &ms[row["map"].as_u64().expect("map") as usize];
        assert_eq!(
            key_vec_strings(&all_hex_keys(m)),
            strings(&row["all"]),
            "all[{i}]"
        );
        assert_eq!(
            key_vec_strings(&all_reveal_land_keys(m)),
            strings(&row["reveal"]),
            "reveal[{i}]"
        );
        assert_eq!(
            key_vec_strings(&all_dry_land_keys(m)),
            strings(&row["dry"]),
            "dry[{i}]"
        );
    }
    let rows = arr(&d, "terrainPredicates");
    assert_eq!(rows.len(), 8);
    for row in rows {
        let t: TerenBazowy = ruch_terrain(row["teren"].as_str().expect("teren"));
        assert_eq!(
            is_reveal_land_teren(t),
            row["reveal"].as_bool().expect("reveal")
        );
        assert_eq!(is_dry_land_teren(t), row["dry"].as_bool().expect("dry"));
    }
}

#[test]
fn compute_player_visibility_matches_web() {
    let d = data();
    let ms = maps(&d);
    let resolver = build_unit_sight_resolver(&real_defs(), None);
    let border = border_fn(&d);
    let rows = arr(&d, "player");
    assert!(rows.len() >= 200);
    let (mut with_start, mut non_empty) = (0, 0);
    for (i, row) in rows.iter().enumerate() {
        let us = units(&row["units"]);
        let cities: Vec<PlayerVisibilityCity> = arr(row, "cities")
            .iter()
            .map(|c| PlayerVisibilityCity {
                q: int(&c["q"]),
                r: int(&c["r"]),
                population: num(&c["population"]),
                kultura: opt_num(&c["kultura"]),
            })
            .collect();
        let start = if row["startHex"].is_null() {
            None
        } else {
            with_start += 1;
            Some((int(&row["startHex"]["q"]), int(&row["startHex"]["r"])))
        };
        let opts = ComputePlayerVisibilityOptions {
            map: &ms[row["map"].as_u64().expect("map") as usize],
            player_units: &us,
            player_cities: &cities,
            unit_sight: &*resolver,
            start_hex: start,
            start_reveal_radius: opt_num(&row["startRevealRadius"]),
        };
        let got = compute_player_visibility(&opts, &border);
        if !got.is_empty() {
            non_empty += 1;
        }
        assert_eq!(key_strings(&got), strings(&row["out"]), "player[{i}]");
    }
    assert!(
        with_start >= 50 && non_empty >= 100,
        "{with_start}/{non_empty}"
    );
}

#[test]
fn city_sight_radius_reexport_matches_web() {
    let d = data();
    let border = border_fn(&d);
    for row in d["citySightExport"].as_array().expect("citySightExport") {
        assert_bits(
            "citySightRadius",
            city_sight_radius(num(&row["pop"]), num(&row["kultura"]), &border),
            num(&row["out"]),
        );
    }
}

#[test]
fn units_visible_on_map_matches_web() {
    let d = data();
    for (i, row) in arr(&d, "onMap").iter().enumerate() {
        let us = units(&row["units"]);
        let visible: BTreeSet<Klucz> = key_set(&row["visible"]);
        let got: Vec<String> = units_visible_on_map(&us, &visible, row["owner"].as_i64())
            .iter()
            .map(|u| u.id.clone())
            .collect();
        assert_eq!(got, strings(&row["out"]), "onMap[{i}]");
    }
}
