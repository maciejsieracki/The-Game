//! P6-POWER-ULEPSZENIA (Q1): testy producenta `ulepszenia` (web countImprovementsForOwner, pin 07d2fbd72)
//! vs wektory generowane przez tests/p6_power_improvements_gen.mjs (wykonanie wycietych funkcji weba w node).
//! Strażnik: SHA-256 wycietego kodu weba (`extracted_sha256`) oraz pin i liczba przypadkow musza sie zgadzac.

use std::collections::HashMap;

use civ_engine::domain::brake_power_army::TerritoryCityInput;
use civ_engine::domain::brake_power_improvements::{
    count_improvements_for_nodes, improvement_count_for_build_hex, improvement_count_for_hex,
    ulepszenia_for_owner,
};
use civ_engine::domain::improvements::{improvement_keys_for_hex, HexLike};
use civ_engine::domain::terrain::{CityNode, FortImprovementType, FortNode};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_power_improvements_vectors/vectors.json");
const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
/// SHA-256 wycietego kodu weba (funkcje z pinu, w kolejnosci generatora). Zmiana = wektory wygenerowane od nowa.
const EXTRACTED_SHA256: &str = "3cb3f155986d7c9d141ff171640977328218c5f3a44c325210fd7501fc510b93";
const MIN_CASES: usize = 150;

fn root() -> Value {
    serde_json::from_str(VECTORS).expect("vectors.json musi sie parsowac")
}

fn hex_from_json(v: &Value) -> HexLike {
    HexLike {
        ulepszenie: v
            .get("ulepszenie")
            .and_then(Value::as_str)
            .map(str::to_owned),
        ulepszenia: v.get("ulepszenia").and_then(Value::as_array).map(|a| {
            a.iter()
                .filter_map(|x| x.as_str().map(str::to_owned))
                .collect()
        }),
        ..HexLike::default()
    }
}

fn parse_key(key: &str) -> (i32, i32) {
    let (q, r) = key.split_once(',').expect("klucz heksa q,r");
    (q.parse().expect("q"), r.parse().expect("r"))
}

fn i(v: &Value) -> i64 {
    v.as_i64().expect("liczba calkowita")
}

#[test]
fn vectors_are_pinned_to_expected_source_and_size() {
    let r = root();
    assert_eq!(r["pin"].as_str(), Some(PIN));
    assert_eq!(r["extracted_sha256"].as_str(), Some(EXTRACTED_SHA256));
    let hex = r["hex"].as_array().expect("hex").len();
    let owner = r["owner"].as_array().expect("owner").len();
    assert_eq!(hex + owner, i(&r["total_cases"]) as usize);
    assert!(
        hex + owner >= MIN_CASES,
        "za malo przypadkow: {}",
        hex + owner
    );
}

#[test]
fn improvement_keys_for_hex_match_web_vectors() {
    let cs = root()["hex"].as_array().expect("hex").clone();
    for (idx, c) in cs.iter().enumerate() {
        let hex = hex_from_json(&c["hex"]);
        let expect: Vec<String> = c["expect"]
            .as_array()
            .expect("expect")
            .iter()
            .map(|x| x.as_str().expect("klucz").to_owned())
            .collect();
        assert_eq!(improvement_keys_for_hex(&hex), expect, "hex[{idx}]");
        assert_eq!(
            improvement_count_for_hex(&hex),
            expect.len(),
            "hex[{idx}] count"
        );
    }
}

#[test]
fn ulepszenia_for_owner_matches_web_vectors() {
    let cs = root()["owner"].as_array().expect("owner").clone();
    let mut nonzero = 0usize;
    for (idx, c) in cs.iter().enumerate() {
        let cities: Vec<TerritoryCityInput> = c["cities"]
            .as_array()
            .expect("cities")
            .iter()
            .map(|city| TerritoryCityInput {
                q: i(&city["q"]) as i32,
                r: i(&city["r"]) as i32,
                population: city["population"].as_f64().expect("pop"),
                owner_id: i(&city["ownerId"]),
            })
            .collect();
        let forts: Vec<FortNode> = c["forts"]
            .as_array()
            .expect("forts")
            .iter()
            .map(|f| FortNode {
                q: i(&f["q"]) as i32,
                r: i(&f["r"]) as i32,
                owner_id: i(&f["ownerId"]),
                kind: if f["type"].as_str() == Some("fort") {
                    FortImprovementType::Fort
                } else {
                    FortImprovementType::Posterunek
                },
                contested_useless: f["contestedUseless"].as_bool(),
            })
            .collect();
        let hexes: HashMap<(i32, i32), usize> = c["hexes"]
            .as_object()
            .expect("hexes")
            .iter()
            .map(|(k, v)| (parse_key(k), improvement_count_for_hex(&hex_from_json(v))))
            .collect();
        let owner = i(&c["owner"]);
        let got = ulepszenia_for_owner(&cities, &forts, owner, &|q, r| hexes.get(&(q, r)).copied());
        let expect = i(&c["expect"]) as f64;
        assert_eq!(got, expect, "owner[{idx}]");
        if expect > 0.0 {
            nonzero += 1;
        }
    }
    // Wektory musza obejmowac przypadki niezerowe (inaczej test nic nie dowodzi).
    assert!(nonzero >= 50, "za malo niezerowych przypadkow: {nonzero}");
}

#[test]
fn overlapping_disks_count_each_hex_once() {
    // Dwa miasta obok siebie: wspolny heks liczony raz (web `seen`).
    let nodes = [CityNode::city(0, 0, 5.0), CityNode::city(1, 0, 5.0)];
    let hexes: HashMap<(i32, i32), usize> =
        [((0, 0), 2usize), ((1, 0), 1usize)].into_iter().collect();
    let with_both = count_improvements_for_nodes(&nodes, &|q, r| hexes.get(&(q, r)).copied());
    let only_first = count_improvements_for_nodes(&nodes[..1], &|q, r| hexes.get(&(q, r)).copied());
    assert_eq!(only_first, 3, "miasto (0,0) pop 5 widzi (0,0)=2 i (1,0)=1");
    assert_eq!(with_both, 3, "dodanie sasiada nie dubluje heksow");
}

#[test]
fn no_nodes_means_zero() {
    let got = ulepszenia_for_owner(&[], &[], 0, &|_, _| Some(9));
    assert_eq!(got, 0.0);
}

#[test]
fn build_hex_helper_matches_hex_like() {
    use civ_engine::domain::improvement_build::BuildHex;
    use civ_engine::domain::improvements::TerrainType;
    use civ_engine::domain::start_position::Overlay;
    let mut hex = BuildHex::new(0, 0, TerrainType::Grassland, Overlay::Brak);
    hex.ulepszenia = Some(vec![
        "farma".to_owned(),
        "farma".to_owned(),
        "brak".to_owned(),
    ]);
    let via_build = improvement_count_for_build_hex(&hex);
    let via_like = improvement_keys_for_hex(&HexLike {
        ulepszenia: hex.ulepszenia.clone(),
        ..HexLike::default()
    })
    .len();
    assert_eq!(via_build, via_like);
}
