//! P6.M02 - `generator.ts:762-818,844` (rozmiary swiata) i normalizacja etykiet z wektorami
//! z URUCHOMIONEGO weba (`tests/p6_m02_vectors/{generator,norm}.json`, generator
//! `gen-m02-vectors.mjs` w katalogu runu R-RUSTPORT-P6-M02-PARAMETRY-NOWEJ-GRY-Q1).

use civ_engine::domain::mapgen::params::{
    menu_label_to_dims, norm_pl_menu_label, norm_quality_label, rozmiar_dims,
    rozmiar_from_menu_label, rozmiar_menu_labels, rozmiar_to_dims, RozmiarSwiata,
};
use serde_json::Value;

const GENERATOR: &str = include_str!("p6_m02_vectors/generator.json");
const NORM: &str = include_str!("p6_m02_vectors/norm.json");

fn parse(text: &str) -> Value {
    serde_json::from_str(text).expect("wektory parse")
}

fn all_sizes() -> Vec<RozmiarSwiata> {
    [
        "malenki",
        "maly",
        "standardowy",
        "duzy",
        "ogromny",
        "superogromny",
    ]
    .iter()
    .map(|k| RozmiarSwiata::from_key(k).expect("klucz"))
    .collect()
}

#[test]
fn normalization_matches_web() {
    let rows = parse(NORM);
    let rows = rows.as_array().expect("array");
    assert!(rows.len() > 50, "za malo wektorow: {}", rows.len());
    for row in rows {
        let label = row["label"].as_str().expect("label");
        assert_eq!(
            norm_pl_menu_label(label),
            row["pl"].as_str().expect("pl"),
            "normPlMenuLabel({label:?})"
        );
        assert_eq!(
            norm_quality_label(label),
            row["quality"].as_str().expect("quality"),
            "normQualityLabel({label:?})"
        );
    }
}

#[test]
fn size_dims_and_order_match_web() {
    let web = parse(GENERATOR);
    let dims = &web["rozmiarDims"];
    let order = web["rozmiarKeysOrder"].as_array().expect("order");
    assert_eq!(order.len(), 6);
    for key in order {
        let key = key.as_str().expect("key");
        let size = RozmiarSwiata::from_key(key).expect("rozmiar");
        assert_eq!(size.key(), key);
        let want: Vec<i64> = dims[key]
            .as_array()
            .expect("dims")
            .iter()
            .map(|v| v.as_i64().expect("i64"))
            .collect();
        assert_eq!(rozmiar_dims(size).to_vec(), want, "ROZMIAR_DIMS[{key}]");
        let to_dims = &web["rozmiarToDims"][key];
        assert_eq!(
            rozmiar_to_dims(size),
            (
                to_dims["w"].as_i64().expect("w"),
                to_dims["h"].as_i64().expect("h")
            ),
            "rozmiarToDims({key})"
        );
    }
    assert_eq!(all_sizes().len(), order.len());
}

#[test]
fn menu_labels_match_web() {
    let web = parse(GENERATOR);
    let want: Vec<&str> = web["menuLabels"]
        .as_array()
        .expect("labels")
        .iter()
        .map(|v| v.as_str().expect("str"))
        .collect();
    let got: Vec<&str> = rozmiar_menu_labels().iter().map(String::as_str).collect();
    assert_eq!(got, want);
}

#[test]
fn size_from_menu_label_and_label_to_dims_match_web() {
    let web = parse(GENERATOR);
    let rows = web["fromMenuLabel"].as_array().expect("rows");
    assert!(rows.len() > 50);
    for row in rows {
        let label = row["label"].as_str().expect("label");
        let want_size = row["rozmiar"].as_str().expect("rozmiar");
        assert_eq!(
            rozmiar_from_menu_label(label).key(),
            want_size,
            "rozmiarFromMenuLabel({label:?})"
        );
        assert_eq!(
            menu_label_to_dims(label),
            (
                row["dims"]["w"].as_i64().expect("w"),
                row["dims"]["h"].as_i64().expect("h")
            ),
            "menuLabelToDims({label:?})"
        );
    }
}
