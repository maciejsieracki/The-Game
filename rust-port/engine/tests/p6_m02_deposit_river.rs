//! P6.M02 - `deposit-era.ts` i `riverGenSwitch.ts` z wektorami z URUCHOMIONEGO weba
//! (`tests/p6_m02_vectors/{deposit-era,river-switch}.json`, generator `gen-m02-vectors.mjs`).
//! Web czyta URL i `localStorage`; port dostaje wyluskane lancuchy (wektor zapisuje, co web zobaczyl).

use std::collections::BTreeMap;

use civ_engine::domain::mapgen::params::{
    count_hidden_metal_deposits, ensure_deposit_era_meta, is_deposit_visible,
    metal_deposit_min_era, parse01, parse_phase, visible_zloze, zloze_min_era_for, DepositEraHex,
    RiverGenPhase, RiverGenSwitch,
};
use serde_json::Value;

const DEPOSIT: &str = include_str!("p6_m02_vectors/deposit-era.json");
const RIVER: &str = include_str!("p6_m02_vectors/river-switch.json");

fn parse(text: &str) -> Value {
    serde_json::from_str(text).expect("wektory parse")
}

fn hex_from_web(v: &Value) -> DepositEraHex {
    DepositEraHex {
        zloze: v
            .get("zloze")
            .map(|z| z.as_str().expect("zloze").to_owned()),
        // `zlozeMinEra: null` w webie == brak (`!= null`).
        zloze_min_era: v.get("zlozeMinEra").and_then(Value::as_i64),
    }
}

fn map_from_web(v: &Value) -> BTreeMap<String, DepositEraHex> {
    v.as_object()
        .expect("mapa")
        .iter()
        .map(|(k, h)| (k.clone(), hex_from_web(h)))
        .collect()
}

#[test]
fn metal_deposit_min_era_table_matches_web() {
    let web = parse(DEPOSIT);
    let table = web["metalEra"].as_object().expect("tabela");
    assert_eq!(table.len(), 4);
    for (key, era) in table {
        assert_eq!(
            metal_deposit_min_era(key),
            era.as_i64(),
            "METAL_DEPOSIT_MIN_ERA[{key}]"
        );
    }
    assert_eq!(metal_deposit_min_era("glina"), None);
}

#[test]
fn deposit_visibility_matches_web() {
    let web = parse(DEPOSIT);
    let cases = web["hexCases"].as_array().expect("cases");
    assert!(cases.len() > 100, "za malo wektorow: {}", cases.len());
    for case in cases {
        let hex = hex_from_web(&case["hex"]);
        let ctx = format!("hex={}", case["hex"]);
        assert_eq!(
            zloze_min_era_for(&hex),
            case["minEraFor"].as_i64().expect("n"),
            "zlozeMinEraFor {ctx}"
        );
        for vis in case["vis"].as_array().expect("vis") {
            let era = vis["era"].as_i64().expect("era");
            assert_eq!(
                is_deposit_visible(&hex, era),
                vis["visible"].as_bool().expect("b"),
                "isDepositVisible {ctx} era={era}"
            );
            assert_eq!(
                visible_zloze(&hex, era),
                vis["visibleZloze"].as_str(),
                "visibleZloze {ctx} era={era}"
            );
        }
    }
}

#[test]
fn ensure_meta_and_hidden_count_match_web() {
    let web = parse(DEPOSIT);
    let mut map = map_from_web(&web["ensure"]["before"]);
    let before = map.clone();
    ensure_deposit_era_meta(&mut map);
    assert_eq!(
        map,
        map_from_web(&web["ensure"]["after"]),
        "ensureDepositEraMeta"
    );
    assert_ne!(map, before, "wektor musi realnie zmieniac dane");
    for row in web["hidden"].as_array().expect("hidden") {
        let era = row["era"].as_i64().expect("era");
        assert_eq!(
            count_hidden_metal_deposits(&before, era),
            row["onBefore"].as_i64().expect("n"),
            "countHiddenMetalDeposits(przed) era={era}"
        );
        assert_eq!(
            count_hidden_metal_deposits(&map, era),
            row["onAfter"].as_i64().expect("n"),
            "countHiddenMetalDeposits(po) era={era}"
        );
    }
}

fn phase_from_web(v: &Value) -> Option<RiverGenPhase> {
    v.as_str().map(|s| parse_phase(Some(s)).expect("faza"))
}

#[test]
fn river_switch_matches_web() {
    let web = parse(RIVER);
    let cases = web["cases"].as_array().expect("cases");
    assert!(cases.len() > 1000, "za malo wektorow: {}", cases.len());
    for case in cases {
        let mut switch = RiverGenSwitch::default();
        switch.set_enabled_override(case["enabledOverride"].as_bool());
        switch.set_phase_override(phase_from_web(&case["phaseOverride"]));
        let url = case["url"].as_str();
        let store = case["store"].as_str();
        let ctx = format!(
            "eo={} po={} url={} store={}",
            case["enabledOverride"], case["phaseOverride"], case["url"], case["store"]
        );
        assert_eq!(
            switch.get_enabled(url, store),
            case["enabled"].as_bool().expect("b"),
            "getRiverGenEnabled {ctx}"
        );
        assert_eq!(
            switch.get_phase(url, store).as_str(),
            case["phase"].as_str().expect("s"),
            "getRiverGenPhase {ctx}"
        );
        assert_eq!(
            switch.is_main_only(url, store),
            case["mainOnly"].as_bool().expect("b"),
            "isRiverGenMainOnly {ctx}"
        );
        assert_eq!(
            switch.is_full(url, store),
            case["full"].as_bool().expect("b"),
            "isRiverGenFull {ctx}"
        );
    }
}

#[test]
fn river_switch_without_environment_matches_web() {
    let web = parse(RIVER);
    let none = &web["noEnv"];
    let switch = RiverGenSwitch::default();
    assert_eq!(
        switch.get_enabled(None, None),
        none["enabled"].as_bool().expect("b")
    );
    assert_eq!(
        switch.get_phase(None, None).as_str(),
        none["phase"].as_str().expect("s")
    );
    assert_eq!(
        switch.is_main_only(None, None),
        none["mainOnly"].as_bool().expect("b")
    );
    assert_eq!(
        switch.is_full(None, None),
        none["full"].as_bool().expect("b")
    );
}

#[test]
fn parse_helpers_cover_all_tokens() {
    // Pelny zakres tokenow weba (parse01/parsePhase sa prywatne w webie; pokrycie przez wektory
    // river-switch powyzej, tu bezposrednio na API portu).
    assert_eq!(parse01(None), None);
    assert_eq!(parse01(Some("0")), Some(false));
    assert_eq!(parse01(Some("false")), Some(false));
    assert_eq!(parse01(Some("1")), Some(true));
    assert_eq!(parse01(Some("true")), Some(true));
    assert_eq!(parse01(Some("TRUE")), None);
    assert_eq!(parse_phase(None), None);
    assert_eq!(parse_phase(Some("main")), Some(RiverGenPhase::Main));
    assert_eq!(
        parse_phase(Some("main+medium")),
        Some(RiverGenPhase::MainMedium)
    );
    assert_eq!(parse_phase(Some("all")), Some(RiverGenPhase::All));
    assert_eq!(parse_phase(Some("ALL")), None);
}
