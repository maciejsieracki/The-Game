//! P6.M02 - jakosc mapy (`newGameMapDefaults.ts:136-190`) z wektorami z URUCHOMIONEGO weba
//! (`tests/p6_m02_vectors/quality.json`, generator `gen-m02-vectors.mjs`). Rodzina jakosci wchodzi
//! do sciezki startu silnika (`main.ts:1770,1774,1788,1799,24140`; `newGameFlow.ts:2044`).

use civ_engine::domain::mapgen::params::{
    bundled_map_quality_from_label, bundled_map_quality_preset, default_map_detail_quality,
    default_render_quality, is_large_map_menu_label, quality_menu_labels, quality_tier_from_label,
    quality_tier_to_label, BundledMapQualityPreset, QualityTier,
};
use serde_json::Value;

const QUALITY: &str = include_str!("p6_m02_vectors/quality.json");

fn web() -> Value {
    serde_json::from_str(QUALITY).expect("wektory parse")
}

fn tier(v: &Value) -> QualityTier {
    QualityTier::from_key(v.as_str().expect("s")).expect("tier web")
}

fn preset(v: &Value) -> BundledMapQualityPreset {
    BundledMapQualityPreset {
        render_quality: tier(&v["renderQuality"]),
        map_detail_quality: tier(&v["mapDetailQuality"]),
    }
}

#[test]
fn constants_match_web() {
    let w = web();
    let labels: Vec<&str> = w["menuLabels"]
        .as_array()
        .expect("arr")
        .iter()
        .map(|x| x.as_str().expect("s"))
        .collect();
    assert_eq!(quality_menu_labels(), labels);
    assert_eq!(default_render_quality(), tier(&w["defaultRenderQuality"]));
    assert_eq!(
        default_map_detail_quality(),
        tier(&w["defaultMapDetailQuality"])
    );
}

#[test]
fn tier_to_label_and_preset_match_web() {
    let w = web();
    for row in w["toLabel"].as_array().expect("arr") {
        assert_eq!(
            quality_tier_to_label(tier(&row["tier"])),
            row["label"].as_str().expect("s")
        );
    }
    for row in w["presets"].as_array().expect("arr") {
        assert_eq!(
            bundled_map_quality_preset(tier(&row["tier"])),
            preset(&row["preset"])
        );
    }
}

#[test]
fn per_label_functions_match_web() {
    let w = web();
    let rows = w["perLabel"].as_array().expect("arr");
    assert!(rows.len() > 80, "za malo etykiet: {}", rows.len());
    for row in rows {
        let l = row["label"].as_str().expect("s");
        assert_eq!(
            quality_tier_from_label(l),
            tier(&row["tier"]),
            "qualityTierFromLabel {l:?}"
        );
        assert_eq!(
            bundled_map_quality_from_label(l),
            preset(&row["bundle"]),
            "bundledMapQualityFromLabel {l:?}"
        );
        assert_eq!(
            is_large_map_menu_label(l),
            row["large"].as_bool().expect("b"),
            "isLargeMapMenuLabel {l:?}"
        );
    }
}

#[test]
fn web_quirk_ignores_z_with_dot() {
    // Zachowanie weba (nie blad portu): `normQualityLabel` nie zamienia `z`-kropka, wiec
    // polskie `Du\u{17c}y` nie jest duza mapa, a ASCII `Duzy` jest (wektor `perLabel`).
    assert!(!is_large_map_menu_label("Du\u{17c}y"));
    assert!(is_large_map_menu_label("Duzy"));
    assert!(is_large_map_menu_label("Ogromny"));
}
