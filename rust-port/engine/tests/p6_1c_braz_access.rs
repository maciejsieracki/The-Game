//! P6.1C - `braz-access.ts` (+ `normalizeImprovementKey` z `terrain-improvements.ts`, od ktorego
//! zalezy) z wektorami z URUCHOMIONEGO weba (`tests/p6_1c_vectors/braz.json`).

use civ_engine::domain::start_position::{
    city_has_piec_hutniczy, empire_has_kopalnia_miedzi, has_braz_access,
    web_normalize_improvement_key, EmpireStockArg, PlacedImprovement,
};
use serde_json::Value;
use std::collections::BTreeMap;

const BRAZ: &str = include_str!("p6_1c_vectors/braz.json");

fn vectors() -> Value {
    serde_json::from_str(BRAZ).expect("braz vectors parse")
}

fn strings(value: &Value) -> Vec<String> {
    value
        .as_array()
        .expect("array")
        .iter()
        .map(|v| v.as_str().expect("string").to_owned())
        .collect()
}

fn placed(value: &Value) -> PlacedImprovement {
    match value {
        Value::String(text) => PlacedImprovement::Single(text.clone()),
        Value::Array(_) => PlacedImprovement::Layers(strings(value)),
        other => panic!("nieobslugiwana warstwa {other}"),
    }
}

#[test]
fn normalize_improvement_key_matches_web() {
    let vectors = vectors();
    let rows = vectors["normalize"].as_array().expect("normalize");
    assert_eq!(rows.len(), 37);
    for row in rows {
        let raw = row["raw"].as_str().expect("raw");
        let expected = row["result"].as_str().map(str::to_owned);
        assert_eq!(web_normalize_improvement_key(raw), expected, "raw={raw:?}");
    }
    // null/undefined: w Rust brak argumentu; web zwraca undefined (null w JSON)
    for row in vectors["normalizeNullish"].as_array().expect("nullish") {
        assert!(row["result"].is_null(), "web: null/undefined -> undefined");
    }
}

#[test]
fn normalize_improvement_key_known_keys_equal_data_keys() {
    // Klucze ulepszen z weba (IMPROVEMENT_KEYS, bez `_`) musza byc rozpoznane przez dane Rust.
    let vectors = vectors();
    let keys = strings(&vectors["improvementKeys"]);
    assert_eq!(keys.len(), 22);
    for key in keys {
        assert_eq!(
            web_normalize_improvement_key(&key),
            Some(key.clone()),
            "{key}"
        );
    }
}

#[test]
fn prototype_keys_are_out_of_domain_and_do_not_change_braz_outcome() {
    // Web zwraca klucze prototypu JS (`constructor`...) jako "istniejace" ulepszenia - artefakt JS.
    // Rust ich nie zna (None). Wynik empireHasKopalniaMiedzi (porownanie z kopalnia_miedzi) jest
    // w obu przypadkach ten sam - wektor `proto` w `copper`.
    let vectors = vectors();
    for row in vectors["normalizeProtoOutOfDomain"]
        .as_array()
        .expect("proto")
    {
        let raw = row["raw"].as_str().expect("raw");
        assert_eq!(web_normalize_improvement_key(raw), None, "{raw}");
        assert_ne!(row["result"].as_str(), Some("kopalnia_miedzi"), "{raw}");
    }
}

#[test]
fn empire_has_kopalnia_miedzi_matches_web() {
    let vectors = vectors();
    let rows = vectors["copper"].as_array().expect("copper");
    assert_eq!(rows.len(), 13);
    let mut trues = 0;
    for row in rows {
        let label = row["label"].as_str().expect("label");
        let expected = row["result"].as_bool().expect("result");
        let got = if row["hasMap"].as_bool().expect("hasMap") {
            let values: Vec<PlacedImprovement> = row["values"]
                .as_array()
                .expect("values")
                .iter()
                .map(placed)
                .collect();
            empire_has_kopalnia_miedzi(Some(values.iter()))
        } else {
            empire_has_kopalnia_miedzi(None::<std::slice::Iter<'_, PlacedImprovement>>)
        };
        assert_eq!(got, expected, "{label}");
        if expected {
            trues += 1;
        }
    }
    assert!(
        trues > 0 && trues < rows.len(),
        "wektory musza zawierac true i false"
    );
}

#[test]
fn city_has_piec_hutniczy_matches_web() {
    let vectors = vectors();
    let rows = vectors["piec"].as_array().expect("piec");
    assert_eq!(rows.len(), 7);
    for row in rows {
        let ids = strings(&row["builtIds"]);
        assert_eq!(
            city_has_piec_hutniczy(&ids),
            row["result"].as_bool().expect("result"),
            "{ids:?}"
        );
    }
}

#[test]
fn has_braz_access_matches_web() {
    let vectors = vectors();
    let rows = vectors["access"].as_array().expect("access");
    assert_eq!(rows.len(), 60);
    let mut trues = 0;
    for row in rows {
        let built = if row["builtIds"].is_null() {
            None
        } else {
            Some(strings(&row["builtIds"]))
        };
        let stock_map: BTreeMap<String, f64> = match row["stock"]["kind"].as_str().expect("kind") {
            "record" => row["stock"]["value"]
                .as_object()
                .expect("record")
                .iter()
                .map(|(key, value)| (key.clone(), value.as_f64().expect("liczba")))
                .collect(),
            _ => BTreeMap::new(),
        };
        let arg = match row["stock"]["kind"].as_str().expect("kind") {
            "record" => EmpireStockArg::Stock(&stock_map),
            "map" => EmpireStockArg::PlacedImprovementsMap,
            _ => EmpireStockArg::Absent,
        };
        let expected = row["result"].as_bool().expect("result");
        assert_eq!(
            has_braz_access(arg, built.as_deref()),
            expected,
            "row {row}"
        );
        if expected {
            trues += 1;
        }
    }
    assert!(
        trues > 0 && trues < rows.len(),
        "wektory musza zawierac true i false"
    );
}

#[test]
fn bootstrap_table_values_equal_web_constants() {
    // Parytet BOOTSTRAPU tabel `start-*.json` z webem. Swiadoma zmiana balansu w tabeli rozjezdza
    // ten test i wektory (zob. P6-1C.md §5); ksztalt tabel bez pinow wartosci: p6_1c_tables.rs.
    let cluster: Value = serde_json::from_str(include_str!("p6_1c_vectors/cluster-start.json"))
        .expect("cluster-start vectors parse");
    let table = civ_engine::data::derived::start_braz_access();
    assert_eq!(
        table.budynek_odlewnia_brazu.wartosc,
        cluster["constants"]["PIEC_HUTNICZY_BUILDING_ID"]
            .as_str()
            .expect("id")
    );
    assert_eq!(
        table.ulepszenie_zrodlo_miedzi.wartosc,
        cluster["constants"]["KOPALNIA_MIEDZI_KEY"]
            .as_str()
            .expect("key")
    );
    let llama = civ_engine::data::derived::start_llama_params();
    assert_eq!(
        u64::from(llama.promien_regionu_startowego.wartosc),
        cluster["constants"]["LLAMA_START_RADIUS"]
            .as_u64()
            .expect("radius")
    );
    assert_eq!(
        u64::from(llama.zloza_na_start.wartosc),
        cluster["constants"]["LLAMA_PER_START"]
            .as_u64()
            .expect("per start")
    );
}
