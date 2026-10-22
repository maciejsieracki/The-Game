//! P6.M15 (R-RUSTPORT-P6-M15-DROGI-RUCH-REGULY-Q1): port `road-movement.ts` i `collectRoadKeys`
//! (`improvement-build.ts:1559-1569`). Wektory z URUCHOMIONEGO weba (pin `edb8fb56`,
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-M15-DROGI-RUCH-REGULY-Q1/gen-m15-vectors.mjs`).
//! Testy kształtu nie pinują wartości tabel; wartości sprawdza wektor z weba i `verify-m15-vectors.py`.

use std::fs;
use std::path::PathBuf;

use civ_engine::data::derived::{parse_road_movement_multipliers, ruch_jednostek_params};
use civ_engine::domain::improvements::HexLike;
use civ_engine::domain::pathfinding::ruch_jednostek::{
    apply_road_movement_modifier as ruch_apply, RuchHex, TerenBazowy,
};
use civ_engine::domain::roads::{
    apply_road_movement_modifier, collect_road_keys, hex_has_road, is_road_improvement_key,
    road_bruk_min_move_cost, road_bruk_move_speed_mult, road_min_move_cost, road_move_speed_mult,
};
use serde_json::Value;

fn load(name: &str) -> Value {
    let p = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests/p6_m15_vectors")
        .join(name);
    let text = fs::read_to_string(&p).unwrap_or_else(|e| panic!("brak {}: {e}", p.display()));
    serde_json::from_str(&text).unwrap_or_else(|e| panic!("zly JSON {}: {e}", p.display()))
}

fn rows(v: &Value) -> &Vec<Value> {
    v.as_array().expect("tablica")
}

fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("f64"),
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            "-0" => -0.0,
            // `str::parse` jest poprawnie zaokraglony (serde_json bez float_roundtrip - nie).
            other => other
                .parse::<f64>()
                .unwrap_or_else(|e| panic!("zla liczba {other}: {e}")),
        },
        other => panic!("to nie liczba: {other}"),
    }
}

fn assert_bits(label: &str, got: f64, want: f64) {
    let same = (got.is_nan() && want.is_nan()) || got.to_bits() == want.to_bits();
    assert!(same, "{label}: rust={got:?} web={want:?}");
}

fn hex_like(v: &Value) -> HexLike {
    HexLike {
        ulepszenie: v
            .get("ulepszenie")
            .and_then(Value::as_str)
            .map(str::to_owned),
        ulepszenia: v.get("ulepszenia").and_then(Value::as_array).map(|items| {
            items
                .iter()
                .map(|s| s.as_str().expect("warstwa tekstowa").to_owned())
                .collect()
        }),
        nakladka: None,
        zloze: None,
    }
}

fn ruch_hex(v: &Value) -> RuchHex {
    let mut hex = RuchHex::new(TerenBazowy::Laka);
    hex.ulepszenie = v
        .get("ulepszenie")
        .and_then(Value::as_str)
        .map(str::to_owned);
    hex.ulepszenia = hex_like(v).ulepszenia;
    hex
}

#[test]
fn constants_match_web() {
    let web = load("constants.json");
    assert_bits(
        "ROAD_MOVE_SPEED_MULT",
        road_move_speed_mult(),
        num(&web["ROAD_MOVE_SPEED_MULT"]),
    );
    assert_bits(
        "ROAD_BRUK_MOVE_SPEED_MULT",
        road_bruk_move_speed_mult(),
        num(&web["ROAD_BRUK_MOVE_SPEED_MULT"]),
    );
    assert_bits(
        "ROAD_MIN_MOVE_COST",
        road_min_move_cost(),
        num(&web["ROAD_MIN_MOVE_COST"]),
    );
    assert_bits(
        "ROAD_BRUK_MIN_MOVE_COST",
        road_bruk_min_move_cost(),
        num(&web["ROAD_BRUK_MIN_MOVE_COST"]),
    );
}

#[test]
fn is_road_key_matches_web() {
    let data = load("is_road_key.json");
    assert!(!rows(&data).is_empty());
    for row in rows(&data) {
        let key = row["key"].as_str().expect("key");
        assert_eq!(
            is_road_improvement_key(key),
            row["out"].as_bool().expect("out"),
            "klucz {key:?}"
        );
    }
}

#[test]
fn has_road_matches_web() {
    let data = load("has_road.json");
    assert!(rows(&data).len() > 300);
    let mut roads = 0;
    for (i, row) in rows(&data).iter().enumerate() {
        let want = row["out"].as_bool().expect("out");
        assert_eq!(
            hex_has_road(&hex_like(&row["hex"])),
            want,
            "wiersz {i}: {}",
            row["hex"]
        );
        roads += usize::from(want);
    }
    // Kształt wektora: oba wyniki wystepuja (inaczej test nic nie mierzy).
    assert!(roads > 0 && roads < rows(&data).len());
}

#[test]
fn apply_modifier_matches_web_bitwise() {
    let data = load("apply_modifier.json");
    assert!(rows(&data).len() > 10_000);
    let mut changed = 0;
    for (i, row) in rows(&data).iter().enumerate() {
        let cost = num(&row["cost"]);
        let want = num(&row["out"]);
        let got = apply_road_movement_modifier(cost, &hex_like(&row["hex"]));
        assert_bits(
            &format!("wiersz {i} cost={cost:?} hex={}", row["hex"]),
            got,
            want,
        );
        if got.to_bits() != cost.to_bits() && !(got.is_nan() && cost.is_nan()) {
            changed += 1;
        }
    }
    assert!(changed > 0, "wektor nie zawiera zadnej drogi");
}

/// Modul `ruch_jednostek` (P6.4) ma wlasna kopie modyfikatora na `RuchHex`; musi dawac te same
/// bity co web, wiec i te same bity co ten modul.
#[test]
fn p64_ruch_modifier_agrees_with_roads_module() {
    let data = load("apply_modifier.json");
    for (i, row) in rows(&data).iter().enumerate() {
        let cost = num(&row["cost"]);
        let want = num(&row["out"]);
        assert_bits(
            &format!("ruch wiersz {i}"),
            ruch_apply(cost, &ruch_hex(&row["hex"])),
            want,
        );
    }
}

#[test]
fn collect_road_keys_matches_web_order() {
    let data = load("collect_road_keys.json");
    assert!(rows(&data).len() > 100);
    let mut with_roads = 0;
    let mut reordered = 0;
    for (i, row) in rows(&data).iter().enumerate() {
        let entries: Vec<(String, HexLike)> = row["entries"]
            .as_array()
            .expect("entries")
            .iter()
            .map(|pair| {
                (
                    pair[0].as_str().expect("klucz").to_owned(),
                    hex_like(&pair[1]),
                )
            })
            .collect();
        let want: Vec<String> = row["out"]
            .as_array()
            .expect("out")
            .iter()
            .map(|k| k.as_str().expect("klucz").to_owned())
            .collect();
        let got = collect_road_keys(&entries);
        assert_eq!(got, want, "wiersz {i}");
        with_roads += usize::from(!want.is_empty());
        // Kolejnosc wyniku rozni sie od kolejnosci wstawiania (klucze-indeksy JS przodem).
        let insertion: Vec<&String> = entries
            .iter()
            .filter(|(_, hex)| hex_has_road(hex))
            .map(|(k, _)| k)
            .collect();
        let mut dedup: Vec<&String> = Vec::new();
        for key in insertion {
            if !dedup.contains(&key) {
                dedup.push(key);
            }
        }
        if dedup.len() == want.len() && dedup.iter().zip(&want).any(|(a, b)| *a != b) {
            reordered += 1;
        }
    }
    assert!(with_roads > 0);
    assert!(
        reordered > 0,
        "wektor nie sprawdza kolejnosci kluczy-indeksow JS"
    );
}

#[test]
fn road_table_shape_and_key_names() {
    let table = parse_road_movement_multipliers().expect("tabela drog");
    assert_eq!(table.wiersze.len(), 4);
    let names = &ruch_jednostek_params().teren;
    assert!(!names.ulepszenie_droga.is_empty() && !names.ulepszenie_droga_brukowana.is_empty());
    assert_ne!(names.ulepszenie_droga, names.ulepszenie_droga_brukowana);
    assert!(is_road_improvement_key(&names.ulepszenie_droga));
    assert!(is_road_improvement_key(&names.ulepszenie_droga_brukowana));
    // Dzielnik bruku jest wiekszy niz zwyklej drogi (bruk szybszy) - wlasciwosc reguly, nie pin.
    assert!(road_bruk_move_speed_mult() > road_move_speed_mult());
    assert!(road_bruk_min_move_cost() > 0.0 && road_bruk_min_move_cost() < 1.0);
}

#[test]
fn roads_source_has_no_numeric_data_literals() {
    // Brak literalow danych/mnoznikow w kodzie modulu (poza 0/1 i 0.0 jako neutralnymi).
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("src/domain/roads.rs");
    let text = fs::read_to_string(path).expect("roads.rs");
    for (n, line) in text.lines().enumerate() {
        let code = line.split("//").next().unwrap_or("");
        let mut token = String::new();
        for ch in code.chars().chain(std::iter::once(' ')) {
            if ch.is_ascii_alphanumeric() || ch == '_' || ch == '.' {
                token.push(ch);
                continue;
            }
            let starts_digit = token.chars().next().is_some_and(|c| c.is_ascii_digit());
            if starts_digit {
                assert!(
                    matches!(token.as_str(), "0" | "1" | "0.0"),
                    "roads.rs:{} literal liczbowy {token}",
                    n + 1
                );
            }
            token.clear();
        }
    }
}
