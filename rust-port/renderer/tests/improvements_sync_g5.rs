//! `R-RUSTPORT-P4-1-G5-NORM-OPUS` (R4 gap G5): key normalisation of the
//! improvement layers (`LEGACY_KEY_ALIASES`, `normalizeImprovementKey`),
//! the fallback to `hex.ulepszenie` in `improvementKeysForHex`, and the
//! merged layers of `mergedImprovementLayers`
//! (`renderer/src/improvements/sync/build.rs`).
//!
//! Expected values come from
//! `tests/improvements_sync_g5_vectors/vectors.json`, written by
//! `tests/improvements_sync_g5_gen.mjs`, which EXECUTES the pin `07d2fbd72`
//! text (`git show`):
//! - `gra/src/game/terrain-improvements.ts:32-34` (`LEGACY_KEY_ALIASES`),
//!   `:117-123` (`normalizeImprovementKey`), `:349-353`
//!   (`foodLayerFromAnimalDeposit`), `:358-380` (`improvementKeysForHex`);
//! - `gra/src/main.ts:3126-3137` (`mergedImprovementLayers`);
//! - `gra/src/types/hex.ts:30-39` (`Nakladka`);
//! - `gra/data/terrain-improvements.json` (`IMPROVEMENTS`, `:29`).
//!
//! Every comparison is exact (`Vec<String>` / `Option<String>` equality,
//! order included). Each hex case carries the pin lines it exercises in
//! its `pin` field; the assert message prints it.

use std::collections::HashSet;
use std::path::PathBuf;

use civ_renderer::improvements::sync::build::{
    improvement_keys_for_hex, merged_improvement_layers, normalize_improvement_key, ulepszenie_web,
    IMPROVEMENT_TABLE_KEYS, JS_OBJECT_PROTOTYPE_KEYS, LEGACY_KEY_ALIASES,
};
use civ_renderer::improvements::sync::{
    build_improvement_group, nakladka, ExternalInputs, HexObjectsInput,
};
use civ_renderer::pick::hex::HexCoord;
use civ_renderer::pick::terrain::Terrain;
use civ_view_model as vm;
use serde_json::Value;

fn vectors() -> Value {
    let p = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests/improvements_sync_g5_vectors/vectors.json");
    serde_json::from_str(&std::fs::read_to_string(p).expect("vectors.json")).expect("json")
}

fn strings(v: &Value) -> Vec<String> {
    serde_json::from_value(v.clone()).expect("array of strings")
}

/// One hex case of the vectors as the R4 input. `improvementKey` is
/// carried into `improvement_key` (the pin render path does not read it).
fn hex_input(c: &Value, i: usize) -> HexObjectsInput {
    let ulepszenie: vm::Ulepszenie =
        serde_json::from_value(c["ulepszenie"].clone()).expect("ulepszenie");
    let nak: vm::Nakladka = serde_json::from_value(c["nakladka"].clone()).expect("nakladka");
    HexObjectsInput {
        coord: HexCoord::new(i32::try_from(i).expect("i32"), 0),
        terrain: Terrain::Laka,
        nakladka: nakladka(nak),
        ulepszenia: (!c["ulepszenia"].is_null()).then(|| strings(&c["ulepszenia"])),
        ulepszenie,
        improvement_key: c["improvementKey"].as_str().map(str::to_owned),
        zloze: None,
        village_present: false,
        road_mask: 0,
    }
}

fn hex_cases(v: &Value) -> &Vec<Value> {
    v["hexes"].as_array().expect("hexes")
}

fn case<'a>(v: &'a Value, name: &str) -> (usize, &'a Value) {
    hex_cases(v)
        .iter()
        .enumerate()
        .find(|(_, c)| c["name"] == name)
        .unwrap_or_else(|| panic!("case {name}"))
}

// ------------------------------------------------------------ tables

/// `LEGACY_KEY_ALIASES` (`game/terrain-improvements.ts:32-34`): the Rust
/// table equals the pin table entry by entry, in pin order.
#[test]
fn legacy_key_aliases_match_pin_table() {
    let v = vectors();
    let pin: Vec<(String, String)> =
        serde_json::from_value(v["aliases"]["entries"].clone()).expect("aliases");
    let rust: Vec<(String, String)> = LEGACY_KEY_ALIASES
        .iter()
        .map(|(a, b)| ((*a).to_owned(), (*b).to_owned()))
        .collect();
    assert_eq!(rust, pin);
}

/// Own keys of `IMPROVEMENTS` (`game/terrain-improvements.ts:29`,
/// `gra/data/terrain-improvements.json`), file order.
#[test]
fn improvement_table_keys_match_pin_json() {
    let v = vectors();
    assert_eq!(
        IMPROVEMENT_TABLE_KEYS.to_vec(),
        strings(&v["tableKeys"]["keys"])
    );
}

/// `Object.getOwnPropertyNames(Object.prototype)` used by the pin lookups
/// (`game/terrain-improvements.ts:29`, `:117-123`).
#[test]
fn prototype_keys_match_node() {
    let v = vectors();
    assert_eq!(
        JS_OBJECT_PROTOTYPE_KEYS.to_vec(),
        strings(&v["prototypeKeys"]["keys"])
    );
}

/// `Ulepszenie` web strings (`types/hex.ts:45-54`): the serde name of the
/// DTO enum and [`ulepszenie_web`] agree for every variant.
#[test]
fn ulepszenie_web_matches_dto_names() {
    for u in [
        vm::Ulepszenie::Brak,
        vm::Ulepszenie::Farma,
        vm::Ulepszenie::Irygacja,
        vm::Ulepszenie::Kopalnia,
        vm::Ulepszenie::Droga,
        vm::Ulepszenie::DrogaBrukowana,
        vm::Ulepszenie::Pastwisko,
        vm::Ulepszenie::Tartak,
    ] {
        assert_eq!(
            serde_json::to_value(u).expect("serialize"),
            Value::String(ulepszenie_web(u).to_owned())
        );
    }
}

// ------------------------------------------------------------ normalize

/// `normalizeImprovementKey(raw)` (`game/terrain-improvements.ts:117-123`)
/// for every alias, table key, prototype name, `Ulepszenie` value, `''`,
/// `'brak'` and unknown keys.
#[test]
fn normalize_improvement_key_matches_pin() {
    let v = vectors();
    let cases = v["normalize"]["cases"].as_array().expect("cases");
    assert!(cases.len() >= 44, "{}", cases.len());
    for c in cases {
        let raw = c["raw"].as_str().expect("raw");
        let want = c["out"].as_str();
        assert_eq!(normalize_improvement_key(raw), want, "raw {raw:?}");
    }
}

/// Every alias of the pin table has a normalize vector and a hex vector
/// (`game/terrain-improvements.ts:32-34`, `:119`).
#[test]
fn every_alias_has_vectors() {
    let v = vectors();
    let raws: HashSet<&str> = v["normalize"]["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .map(|c| c["raw"].as_str().expect("raw"))
        .collect();
    for (old, new) in LEGACY_KEY_ALIASES {
        assert!(raws.contains(old), "normalize vector for {old}");
        assert_eq!(normalize_improvement_key(old), Some(new));
        let (i, c) = case(&v, &format!("alias_list_{old}"));
        assert_eq!(
            improvement_keys_for_hex(&hex_input(c, i)),
            vec![new.to_owned()],
            "{}",
            c["pin"]
        );
    }
}

// ------------------------------------------------------------ per hex

/// `improvementKeysForHex(hex)` (`game/terrain-improvements.ts:358-380`)
/// for every hex case.
#[test]
fn improvement_keys_for_hex_matches_pin() {
    let v = vectors();
    for (i, c) in hex_cases(&v).iter().enumerate() {
        assert_eq!(
            improvement_keys_for_hex(&hex_input(c, i)),
            strings(&c["keysForHex"]),
            "{} ({})",
            c["name"],
            c["pin"]
        );
    }
}

/// `mergedImprovementLayers(hexKey)` (`main.ts:3126-3137`) for every hex
/// case: normalised keys, deposit layer, then the placed layers as stored.
#[test]
fn merged_improvement_layers_match_pin() {
    let v = vectors();
    for (i, c) in hex_cases(&v).iter().enumerate() {
        assert_eq!(
            merged_improvement_layers(&hex_input(c, i)),
            strings(&c["merged"]),
            "{} ({})",
            c["name"],
            c["pin"]
        );
    }
}

/// Fallback order (`game/terrain-improvements.ts:365-379`): a non-empty
/// `ulepszenia` decides alone; `hex.ulepszenie` only when it is absent or
/// empty.
#[test]
fn fallback_only_without_ulepszenia() {
    let v = vectors();
    for (name, want) in [
        ("ulepszenia_over_ulepszenie", vec!["tartak"]),
        ("ulepszenia_all_unknown_no_fallback", vec![]),
        ("fallback_absent_farma", vec!["farma"]),
        ("fallback_empty_tartak", vec!["tartak"]),
        ("fallback_absent_pastwisko", vec!["bydlo"]),
        ("fallback_absent_kopalnia", vec![]),
        ("fallback_absent_brak", vec![]),
    ] {
        let (i, c) = case(&v, name);
        assert_eq!(strings(&c["keysForHex"]), want, "vector {name}");
        assert_eq!(improvement_keys_for_hex(&hex_input(c, i)), want, "{name}");
    }
}

/// `HexDynDto.improvement_key` is not an input of `improvementKeysForHex`
/// (`game/terrain-improvements.ts:358-364`): changing it changes nothing.
#[test]
fn improvement_key_is_not_read() {
    let v = vectors();
    for name in ["improvement_key_not_read", "improvement_key_alias_not_read"] {
        let (i, c) = case(&v, name);
        let mut h = hex_input(c, i);
        let with = merged_improvement_layers(&h);
        h.improvement_key = None;
        assert_eq!(merged_improvement_layers(&h), with, "{name}");
        assert_eq!(with, strings(&c["merged"]), "{name}");
    }
}

/// The fallback reaches the render: a hex with only `ulepszenie` set gets
/// an improvement group from `build_improvement_group` (`spawnImprovementMesh`,
/// `main.ts:17043-17071`), one with `'brak'` / an unknown key gets none.
#[test]
fn fallback_layers_feed_the_improvement_group() {
    let v = vectors();
    let ext = ExternalInputs {
        show_resource_deposit_overlay: false,
        lama_deposit_visible: false,
        zloze_hidden: HashSet::new(),
        deposit_overlay_suppressed: HashSet::new(),
        preserves_hill_relief: HashSet::new(),
    };
    for (name, some) in [
        ("fallback_absent_farma", true),
        ("fallback_absent_pastwisko", true),
        ("fallback_absent_brak", false),
        ("fallback_absent_kopalnia", false),
    ] {
        let (i, c) = case(&v, name);
        let g = build_improvement_group(&hex_input(c, i), 12345, &ext);
        assert_eq!(g.is_some(), some, "{name}");
    }
}
