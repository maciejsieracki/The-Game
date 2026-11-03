//! REPIN-DELTA-4 (R-RUSTPORT-REPIN-DELTA-4-Q1): czyste funkcje delty weba `4bbef081d` -> `23dd158e9`
//! weryfikowane wektorami z URUCHOMIONEGO weba (pin 23dd158e9):
//!  * `freshwater.json` - `map/freshwater.ts` (rzeka/jezioro) + `cityHasWaterAccess` (turn-economy.ts:417);
//!  * `sight.json` - `fortSightSources` (fort-territory.ts:359);
//!  * `capsep.json` - `capitalMinSeparation{Proportional,ForMap}` (clusters.ts:1530-1590);
//!  * `topup.json` - `topUpPangeaLandFraction` (gen-helpers.ts:3705-3837).
//! Generator: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-4-Q1/tools/gen-repin4-vectors.mjs`.

use std::collections::{HashMap, HashSet};

use civ_engine::domain::fort_territory::fort_sight_sources;
use civ_engine::domain::freshwater::{lake_hex_set, FreshwaterCtx};
use civ_engine::domain::improvement_build::{terrain_from_web_value, BuildHex, BuildMap};
use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::cluster_layout::{
    capital_min_separation_for_map_pin, capital_min_separation_proportional,
};
use civ_engine::domain::mapgen::landsea::top_up_pangea_land_fraction;
use civ_engine::domain::mapgen::params::MapSizeLabel;
use civ_engine::domain::mapgen::terrain_class::{HexRecord, Nakladka, TerrainHex};
use civ_engine::domain::start_position::Overlay;
use civ_engine::domain::terrain::{FortImprovementType, FortNode};
use civ_engine::domain::turn_economy_health::city_has_water_access;
use serde_json::Value;

const FRESHWATER: &str = include_str!("p6_repin4_vectors/freshwater.json");
const SIGHT: &str = include_str!("p6_repin4_vectors/sight.json");
const CAPSEP: &str = include_str!("p6_repin4_vectors/capsep.json");
const TOPUP: &str = include_str!("p6_repin4_vectors/topup.json");

fn cases(src: &str) -> Vec<Value> {
    let v: Value = serde_json::from_str(src).expect("json");
    assert_eq!(v["pin"].as_str(), Some("23dd158e9"));
    v["cases"].as_array().expect("cases").clone()
}

fn i(v: &Value) -> i32 {
    v.as_i64().expect("int") as i32
}

fn build_map(c: &Value) -> BuildMap {
    let hexes: Vec<BuildHex> = c["hexes"]
        .as_array()
        .unwrap()
        .iter()
        .map(|h| {
            let a = h.as_array().unwrap();
            let mut hx = BuildHex::new(
                i(&a[0]),
                i(&a[1]),
                terrain_from_web_value(a[2].as_str().unwrap()).expect("teren"),
                Overlay::Brak,
            );
            hx.river_present = a[3].as_i64() == Some(1);
            hx
        })
        .collect();
    let rivers: Vec<Vec<(i32, i32)>> = c["riverPaths"]
        .as_array()
        .unwrap()
        .iter()
        .map(|p| {
            p.as_array()
                .unwrap()
                .iter()
                .map(|pt| (i(&pt[0]), i(&pt[1])))
                .collect()
        })
        .collect();
    BuildMap::new(hexes, rivers)
}

#[test]
fn freshwater_matches_web() {
    let all = cases(FRESHWATER);
    let mut with_lakes = 0;
    let mut checked = 0;
    for c in &all {
        let map = build_map(c);
        let kind = c["kind"].as_str().unwrap();
        let lakes: HashSet<String> = lake_hex_set(&map)
            .into_iter()
            .map(|(q, r)| format!("{q},{r}"))
            .collect();
        let want: HashSet<String> = c["lakes"]
            .as_array()
            .unwrap()
            .iter()
            .map(|s| s.as_str().unwrap().to_owned())
            .collect();
        assert_eq!(lakes, want, "zbior jezior, mapa {kind}");
        if !want.is_empty() {
            with_lakes += 1;
        }
        let ctx = FreshwaterCtx::new(&map);
        for q in c["queries"].as_array().unwrap() {
            let (x, y) = (i(&q[0]), i(&q[1]));
            let w = |n: usize| q[n].as_i64() == Some(1);
            assert_eq!(ctx.has_freshwater_access(&map, x, y), w(2), "hasFreshwaterAccess {kind} {x},{y}");
            assert_eq!(ctx.is_freshwater_reserved_hex(&map, x, y), w(3), "reserved {kind} {x},{y}");
            assert_eq!(lakes.contains(&format!("{x},{y}")), w(4), "isLakeHex {kind} {x},{y}");
            assert_eq!(ctx.is_lake_adjacent(x, y), w(5), "isLakeAdjacent {kind} {x},{y}");
            assert_eq!(ctx.has_river_water_access(&map, x, y), w(6), "riverWater {kind} {x},{y}");
            // turn-economy.ts `cityHasWaterAccess` == `hasFreshwaterAccess` (zdrowie miasta).
            assert_eq!(
                city_has_water_access(f64::from(x), f64::from(y), &map),
                w(2),
                "cityHasWaterAccess {kind} {x},{y}"
            );
            checked += 1;
        }
    }
    assert!(with_lakes >= 20, "za malo map z jeziorami: {with_lakes}");
    assert!(checked > 3000, "za malo zapytan: {checked}");
}

#[test]
fn fort_sight_sources_match_web() {
    let all = cases(SIGHT);
    let mut nonempty = 0;
    for c in &all {
        let forts: Vec<FortNode> = c["forts"]
            .as_array()
            .unwrap()
            .iter()
            .map(|f| FortNode {
                q: i(&f["q"]),
                r: i(&f["r"]),
                owner_id: f["ownerId"].as_i64().unwrap(),
                kind: FortImprovementType::from_web_value(f["type"].as_str().unwrap()).unwrap(),
                contested_useless: f.get("contestedUseless").and_then(Value::as_bool),
            })
            .collect();
        let got: Vec<(i32, i32, f64)> = fort_sight_sources(&forts, c["ownerId"].as_i64().unwrap())
            .into_iter()
            .map(|s| (s.q, s.r, s.radius))
            .collect();
        let want: Vec<(i32, i32, f64)> = c["expected"]
            .as_array()
            .unwrap()
            .iter()
            .map(|s| (i(&s[0]), i(&s[1]), s[2].as_f64().unwrap()))
            .collect();
        if !want.is_empty() {
            nonempty += 1;
        }
        assert_eq!(got, want);
    }
    assert!(nonempty >= 25, "za malo niepustych: {nonempty}");
}

fn size(s: &str) -> MapSizeLabel {
    match s {
        "mala" => MapSizeLabel::Mala,
        "srednia" => MapSizeLabel::Srednia,
        "duza" => MapSizeLabel::Duza,
        "ogromna" => MapSizeLabel::Ogromna,
        "super" => MapSizeLabel::Super,
        other => panic!("rozmiar {other}"),
    }
}

#[test]
fn capital_separation_matches_web() {
    let all = cases(CAPSEP);
    let mut distinct: HashSet<i64> = HashSet::new();
    for c in &all {
        let rozmiar = size(c["rozmiar"].as_str().unwrap());
        let (w, h) = (c["w"].as_i64().unwrap(), c["h"].as_i64().unwrap());
        let want = c["expected"].as_i64().unwrap();
        let got = match c["kind"].as_str().unwrap() {
            "prop" => capital_min_separation_proportional(rozmiar, w, h),
            "forMap" => capital_min_separation_for_map_pin(
                rozmiar,
                w,
                h,
                c["civ"].as_i64(),
                c["land"].as_i64(),
            ),
            other => panic!("rodzaj {other}"),
        };
        distinct.insert(want);
        assert_eq!(got, want, "{c}");
    }
    assert!(distinct.len() > 15, "za malo roznych wartosci: {}", distinct.len());
}

fn terrain_code(ch: char) -> Terrain {
    match ch {
        'M' => Terrain::Sea,
        's' => Terrain::ShallowSea,
        'L' => Terrain::Grassland,
        'R' => Terrain::Plains,
        'H' => Terrain::Hills,
        'D' => Terrain::Desert,
        'G' => Terrain::Mountains,
        'P' => Terrain::Polar,
        other => panic!("kod terenu {other}"),
    }
}

#[test]
fn top_up_pangea_matches_web() {
    let all = cases(TOPUP);
    let mut changed_cases = 0;
    let mut total_added = 0usize;
    for c in &all {
        let (w, h) = (c["W"].as_i64().unwrap(), c["H"].as_i64().unwrap());
        let in_t: Vec<char> = c["inT"].as_str().unwrap().chars().collect();
        let in_n: Vec<char> = c["inN"].as_str().unwrap().chars().collect();
        let scores = c["scores"].as_array().unwrap();
        let mut hexes = HexRecord::new();
        let mut score_map: HashMap<String, f64> = HashMap::new();
        let mut idx = 0usize;
        for r in 0..h {
            for q in 0..w {
                let mut hx = TerrainHex::new(q, r, terrain_code(in_t[idx]));
                hx.overlay = if in_n[idx] == '1' { Nakladka::Las } else { Nakladka::Brak };
                hx.has_deposit = true;
                let key = format!("{q},{r}");
                if let Some(s) = scores[idx].as_f64() {
                    score_map.insert(key.clone(), s);
                }
                hexes.insert(key, hx);
                idx += 1;
            }
        }
        let added = top_up_pangea_land_fraction(
            &mut hexes,
            &score_map,
            c["target"].as_f64().unwrap(),
            w,
            h,
            c["minNb"].as_u64().unwrap() as usize,
            c["maxRounds"].as_u64().unwrap() as usize,
        );
        assert_eq!(added as i64, c["added"].as_i64().unwrap(), "added {}x{} t={}", w, h, c["target"]);
        let out_t: Vec<char> = c["outT"].as_str().unwrap().chars().collect();
        let out_n: Vec<char> = c["outN"].as_str().unwrap().chars().collect();
        let out_z: Vec<char> = c["outZ"].as_str().unwrap().chars().collect();
        let mut idx = 0usize;
        for r in 0..h {
            for q in 0..w {
                let hx = hexes.get(&format!("{q},{r}")).unwrap();
                assert_eq!(hx.terrain, terrain_code(out_t[idx]), "teren {q},{r} ({w}x{h})");
                assert_eq!(hx.overlay == Nakladka::Las, out_n[idx] == '1', "nakladka {q},{r}");
                assert_eq!(hx.has_deposit, out_z[idx] == '1', "zloze {q},{r}");
                idx += 1;
            }
        }
        if added > 0 {
            changed_cases += 1;
        }
        total_added += added;
    }
    assert!(changed_cases >= 50, "za malo scenariuszy z dosypem: {changed_cases}");
    assert!(total_added > 5000, "za malo dosypanych heksow: {total_added}");
}
