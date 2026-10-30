//! P6.8D-P2 - `mennica-zloto-grace.ts` (web pin 91dc998a).
//! Wektory z URUCHOMIONEGO weba (`tests/p6_8d_vectors/mennica_zloto_grace.json`, generator
//! `gen-p6-8d-gold-mennica-vectors.mjs` w runie R-RUSTPORT-P6-8D-UTRZYMANIE-OBYWATELI-Q1).
//! Web `Map` zachowuje kolejnosc wstawiania; Rust `BTreeMap` jest posortowany. Kolejnosc
//! nie wplywa na zachowanie (tylko na wyjscie serializacji), wiec wektory sa porownywane
//! po posortowaniu kluczy.

use civ_engine::domain::turn_economy::mennica_zloto_grace::{
    finalize_mennica_zloto_grace_after_tick, owner_zloto_access_for_mennica,
    prepare_mennica_zloto_grace_for_tick, MennicaZlotoGraceSave, MennicaZlotoGraceState,
    MENNICA_ZLOTO_GRACE_TURNS,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_8d_vectors/mennica_zloto_grace.json");

fn root() -> Value {
    serde_json::from_str(VECTORS).expect("wektory parse")
}

fn num(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("liczba"),
        Value::Object(o) => {
            if let Some(s) = o.get("$f") {
                return s.as_str().expect("$f").parse::<f64>().expect("$f parse");
            }
            match o.get("$n").and_then(Value::as_str).expect("$n") {
                "NaN" => f64::NAN,
                "Infinity" => f64::INFINITY,
                "-Infinity" => f64::NEG_INFINITY,
                "-0" => -0.0,
                other => panic!("nieznane $n: {other}"),
            }
        }
        other => panic!("nie liczba: {other}"),
    }
}

/// Wektor `[[owner, value], ...]` (grace jako liczby, hadAccess jako bool) -> posortowane pary.
fn grace_pairs(v: &Value) -> Vec<(i64, u32)> {
    let mut out: Vec<(i64, u32)> = v
        .as_array()
        .expect("tablica")
        .iter()
        .map(|p| (p[0].as_i64().unwrap(), num(&p[1]) as u32))
        .collect();
    out.sort();
    out
}

fn access_pairs(v: &Value) -> Vec<(i64, bool)> {
    let mut out: Vec<(i64, bool)> = v
        .as_array()
        .expect("tablica")
        .iter()
        .map(|p| (p[0].as_i64().unwrap(), p[1].as_bool().unwrap()))
        .collect();
    out.sort();
    out
}

fn save_from(v: &Value) -> MennicaZlotoGraceSave {
    MennicaZlotoGraceSave {
        grace_turns_left: grace_pairs(&v["graceTurnsLeft"]),
        had_access_last_turn: access_pairs(&v["hadAccessLastTurn"]),
    }
}

#[test]
fn constant_matches_web() {
    let r = root();
    assert_eq!(
        MENNICA_ZLOTO_GRACE_TURNS as f64,
        num(&r["constants"]["MENNICA_ZLOTO_GRACE_TURNS"])
    );
    assert_eq!(MENNICA_ZLOTO_GRACE_TURNS, 1);
}

#[test]
fn step_sequences_match_web_vectors() {
    let r = root();
    let cases = r["cases"].as_array().unwrap();
    let mut sequences = 0;
    for case in cases {
        let Some(steps) = case.get("steps") else {
            continue;
        };
        sequences += 1;
        let name = case["name"].as_str().unwrap();
        let owners: Vec<i64> = case["owners"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| v.as_i64().unwrap())
            .collect();
        let mut state = MennicaZlotoGraceState::new();
        for (si, step) in steps.as_array().unwrap().iter().enumerate() {
            let ctx = format!("{name} krok {si}");
            let access = |oid: i64| step["access"][oid.to_string()].as_bool().unwrap_or(false);
            let step_owners: Vec<i64> = step["owners"]
                .as_array()
                .unwrap()
                .iter()
                .map(|v| v.as_i64().unwrap())
                .collect();
            assert_eq!(step_owners, owners, "{ctx} owners");

            prepare_mennica_zloto_grace_for_tick(&mut state, &owners, access);
            // grace po prepare (pelna mapa, w tym wpisy 0)
            let mut after_prepare: Vec<(i64, u32)> = state
                .grace_turns_left
                .iter()
                .map(|(k, v)| (*k, *v))
                .collect();
            after_prepare.sort();
            assert_eq!(
                after_prepare,
                grace_pairs(&step["afterPrepareGrace"]),
                "{ctx} afterPrepareGrace"
            );

            // resolver (owner_zloto_access_for_mennica) po prepare
            for pair in step["resolved"].as_array().unwrap() {
                let oid = pair[0].as_i64().unwrap();
                let expected = pair[1].as_bool().unwrap();
                assert_eq!(
                    owner_zloto_access_for_mennica(oid, &state, access),
                    expected,
                    "{ctx} resolved owner {oid}"
                );
            }

            finalize_mennica_zloto_grace_after_tick(&mut state, &owners, access);
            let ser = state.serialize();
            let exp = &step["serialized"];
            assert_eq!(
                ser.grace_turns_left,
                grace_pairs(&exp["graceTurnsLeft"]),
                "{ctx} grace po finalize"
            );
            assert_eq!(
                ser.had_access_last_turn,
                access_pairs(&exp["hadAccessLastTurn"]),
                "{ctx} hadAccess po finalize"
            );
        }
    }
    assert_eq!(sequences, 8, "liczba sekwencji mennicy");
}

#[test]
fn restore_clear_and_null_match_web() {
    let r = root();
    let case = r["cases"]
        .as_array()
        .unwrap()
        .iter()
        .find(|c| c["name"] == "restoreClear")
        .expect("restoreClear");
    let mut st = MennicaZlotoGraceState::new();
    st.grace_turns_left.insert(4, 1);
    st.had_access_last_turn.insert(4, true);
    let from = save_from(&case["restoreFrom"]);
    st.restore(Some(&from));
    let restored = st.serialize();
    assert_eq!(
        restored.grace_turns_left,
        grace_pairs(&case["restored"]["graceTurnsLeft"])
    );
    assert_eq!(
        restored.had_access_last_turn,
        access_pairs(&case["restored"]["hadAccessLastTurn"])
    );
    // stan z poprzedniej tury (klucz 4) zostal wyczyszczony przez restore
    assert!(!st.grace_turns_left.contains_key(&4));

    st.clear();
    let after_clear = st.serialize();
    assert!(after_clear.grace_turns_left.is_empty() && after_clear.had_access_last_turn.is_empty());
    assert_eq!(
        after_clear.grace_turns_left,
        grace_pairs(&case["afterClear"]["graceTurnsLeft"])
    );

    let mut s2 = MennicaZlotoGraceState::new();
    s2.grace_turns_left.insert(1, 1);
    s2.restore(None);
    let s2ser = s2.serialize();
    assert!(s2ser.grace_turns_left.is_empty() && s2ser.had_access_last_turn.is_empty());
    assert_eq!(
        s2ser.grace_turns_left,
        grace_pairs(&case["restoreNull"]["graceTurnsLeft"])
    );
}

#[test]
fn grace_is_exactly_one_turn_after_loss() {
    // Utrata dostepu po tym, jak byl: laska 1 tura, potem brak (PYTANIE-77-DOP=B).
    let mut st = MennicaZlotoGraceState::new();
    let owners = [1i64];
    let have = |_: i64| true;
    let lost = |_: i64| false;
    prepare_mennica_zloto_grace_for_tick(&mut st, &owners, have);
    finalize_mennica_zloto_grace_after_tick(&mut st, &owners, have);
    prepare_mennica_zloto_grace_for_tick(&mut st, &owners, lost);
    assert!(
        owner_zloto_access_for_mennica(1, &st, lost),
        "tura laski: dostep"
    );
    finalize_mennica_zloto_grace_after_tick(&mut st, &owners, lost);
    prepare_mennica_zloto_grace_for_tick(&mut st, &owners, lost);
    assert!(
        !owner_zloto_access_for_mennica(1, &st, lost),
        "po lasce: brak dostepu"
    );
}

#[test]
fn restore_roundtrip_is_identity() {
    let mut st = MennicaZlotoGraceState::new();
    st.grace_turns_left.insert(3, 1);
    st.grace_turns_left.insert(1, 0);
    st.had_access_last_turn.insert(3, false);
    let saved = st.serialize();
    let mut back = MennicaZlotoGraceState::new();
    back.restore(Some(&saved));
    assert_eq!(back, st);
}
