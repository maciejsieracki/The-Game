//! R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-2-Q1 (runda 5, mutacje C): czyste helpery pokoju AI<->AI i magazyn
//! próśb zgodne z URUCHOMIONYM webem (origin/main 5dd53e60f, gra/src/game/diplomacy-ai-forced-peace.ts).
//! Wektory: `tests/p6_dyplo_multiwar2_peace_helpers_data/helpers.json`, generator
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-2-Q1/gen-peace-helpers.mts`.
//! Magazyn: `Map` JS - odczyt po kluczu zwraca wpis tego klucza (nie innego).

use civ_engine::domain::diplomacy_ai_forced_peace::*;
use serde_json::Value;

const HELPERS: &str = include_str!("p6_dyplo_multiwar2_peace_helpers_data/helpers.json");

fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("liczba"),
        // Napisy = String(x) z weba; `parse` jest dokladny (serde_json bez float_roundtrip moze zgubic ulp).
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => other.parse::<f64>().expect("liczba w napisie"),
        },
        other => panic!("oczekiwano liczby, jest {other}"),
    }
}

fn same(actual: f64, expected: f64, ctx: &str) {
    let ok = (actual.is_nan() && expected.is_nan()) || actual == expected;
    assert!(ok, "{ctx}: rust={actual} web={expected}");
}

#[test]
fn requester_share_matches_web_vectors() {
    let doc: Value = serde_json::from_str(HELPERS).unwrap();
    let rows = doc["shares"].as_array().unwrap();
    assert_eq!(rows.len(), 293, "liczba wektorow requesterShare");
    for r in rows {
        let rp = num(&r["rp"]);
        let op = num(&r["op"]);
        same(
            requester_share(rp, op),
            num(&r["share"]),
            &format!("requesterShare({rp}, {op})"),
        );
    }
}

#[test]
fn clearly_and_still_losing_thresholds_match_web_vectors() {
    let doc: Value = serde_json::from_str(HELPERS).unwrap();
    let rows = doc["clearly"].as_array().unwrap();
    assert_eq!(rows.len(), 14);
    for r in rows {
        let s = num(&r["s"]);
        assert_eq!(
            is_clearly_losing(s),
            r["clearly"].as_bool().unwrap(),
            "isClearlyLosing({s})"
        );
        assert_eq!(
            is_still_losing(s),
            r["still"].as_bool().unwrap(),
            "isStillLosing({s})"
        );
    }
}

/// Kształt `Kinked` (test-double generatora, gen-forced-peace.mts): wartości z wyrażenia generatora.
/// Węzeł `c == knee` daje to samo z obu gałęzi (`b0 + s*knee + s2*0`), więc `<=` vs `<` jest równoważne.
#[test]
fn kinked_balance_shape_matches_generator_vectors() {
    let doc: Value = serde_json::from_str(HELPERS).unwrap();
    let rows = doc["kinked"].as_array().unwrap();
    assert_eq!(rows.len(), 10);
    for r in rows {
        let b0 = num(&r["b0"]);
        let slope = num(&r["slope"]);
        let knee = num(&r["knee"]);
        let slope2 = num(&r["slope2"]);
        let c = num(&r["c"]);
        let shape = PeaceBalanceShape::Kinked {
            balance0: b0,
            slope,
            knee,
            slope2,
        };
        same(
            shape.balance_for(c),
            num(&r["bal"]),
            &format!("Kinked c={c} knee={knee}"),
        );
    }
}

#[test]
fn request_store_get_returns_entry_of_its_own_key() {
    // Web `Map.get(key)`: wpis tego klucza, nie pierwszy inny.
    let mut store = AiPeaceRequestStore::new();
    assert!(register_ai_peace_request(
        &mut store,
        "1-2",
        1,
        2,
        10.0,
        AiPeaceKind::Pokoj
    ));
    assert!(register_ai_peace_request(
        &mut store,
        "3-4",
        3,
        4,
        11.0,
        AiPeaceKind::Rozejm
    ));
    let r = store.get("3-4").expect("wpis 3-4");
    assert_eq!(r.requester_id, 3);
    assert_eq!(r.other_id, 4);
    assert_eq!(r.since_turn, 11.0);
    assert_eq!(r.kind, AiPeaceKind::Rozejm);
    let first = store.get("1-2").expect("wpis 1-2");
    assert_eq!(first.requester_id, 1);
    assert_eq!(first.kind, AiPeaceKind::Pokoj);
    assert!(store.get("9-9").is_none());
}
