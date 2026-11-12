//! R-RUSTPORT-P6-POWER-BITWY-ZDOBYCZE-Q1: akumulatory per wlasciciel dla skladnikow mocy `bitwy` i `zdobycze`.
//!
//! - Wektory: `p6_power_battle_acc_vectors/vectors.json` (generator `p6_power_battle_acc_gen.mjs` wykonuje kod
//!   z pinu 07d2fbd72 i sprawdza SHA-256 zrodel). Kazdy przypadek = sekwencja zdarzen (wygrana bitwy,
//!   zdobycie barbarzyncow, eliminacja) -> oczekiwany akumulator wlasciciela.
//! - Zgodnosc wsteczna: `p6_power_battle_acc_vectors/legacy_meta.json` (zapis sprzed akumulatorow) laduje sie
//!   z pustymi akumulatorami i nie dopisuje nowych kluczy przy ponownym zapisie.
//! - Wejscie do mocy: `power_raw_for_owner` podaje `bitwy_pkt_sum` / `zdobycze_power` jako `Provided` z akumulatorow.

use civ_engine::domain::brake_power::Component;
use civ_engine::domain::playable::PlayableState;
use civ_engine::domain::turn_war_inputs::power_raw_for_owner;
use civ_engine::domain::war_turn_state::{managed_meta_keys, WarTurnState};
use serde_json::{Map, Value};

fn num(v: &Value) -> f64 {
    match v {
        Value::String(s) => match s.as_str() {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => other.parse().expect("liczba w wektorze"),
        },
        other => other.as_f64().expect("liczba w wektorze"),
    }
}

fn same(got: f64, exp: f64) -> bool {
    (got.is_nan() && exp.is_nan()) || got == exp
}

fn vectors() -> Value {
    serde_json::from_str(include_str!("p6_power_battle_acc_vectors/vectors.json")).expect("vectors")
}

fn apply_events(w: &mut WarTurnState, events: &[Value]) {
    for ev in events {
        match ev["kind"].as_str().expect("kind") {
            "battle" => {
                w.record_battle_win(ev["winner"].as_i64().expect("winner"), num(&ev["enemy_m"]))
            }
            "capture" => w.record_capture_power_gain(
                ev["new_owner"].as_i64().expect("new_owner"),
                num(&ev["lost_power"]),
                ev["barb_captor"].as_bool().expect("barb_captor"),
            ),
            "elim" => w.clear_power_accumulators_for_owner(ev["owner"].as_i64().expect("owner")),
            other => panic!("nieznane zdarzenie {other}"),
        }
    }
}

#[test]
fn accumulator_sequences_match_pin_vectors() {
    let v = vectors();
    let cases = v["cases"].as_array().expect("cases");
    assert!(cases.len() >= 150, "przypadkow: {}", cases.len());
    let mut bitwy_nonzero = 0;
    let mut zdobycze_nonzero = 0;
    for (idx, c) in cases.iter().enumerate() {
        let events = c["events"].as_array().expect("events");
        let owner = c["owner"].as_i64().expect("owner");
        let mut w = WarTurnState::default();
        apply_events(&mut w, events);
        let got_b = w.battle_power_pts_for(owner);
        let got_z = w.zdobycze_power_for(owner);
        let exp_b = num(&c["expect_bitwy_pkt"]);
        let exp_z = num(&c["expect_zdobycze"]);
        assert!(same(got_b, exp_b), "bitwy[{idx}] {c}: {got_b} != {exp_b}");
        assert!(
            same(got_z, exp_z),
            "zdobycze[{idx}] {c}: {got_z} != {exp_z}"
        );
        if got_b != 0.0 {
            bitwy_nonzero += 1;
        }
        if got_z != 0.0 {
            zdobycze_nonzero += 1;
        }
    }
    // Wektory musza obejmowac oba akumulatory z niezerowym wynikiem (nie tylko puste przypadki).
    assert!(bitwy_nonzero >= 30, "bitwy niezerowe: {bitwy_nonzero}");
    assert!(
        zdobycze_nonzero >= 30,
        "zdobycze niezerowe: {zdobycze_nonzero}"
    );
}

#[test]
fn empty_state_reads_as_real_zero() {
    let w = WarTurnState::default();
    assert_eq!(w.battle_power_pts_for(1), 0.0);
    assert_eq!(w.zdobycze_power_for(1), 0.0);
    // Pusty stan nie zapisuje kluczy (format sprzed zmiany bez zmian).
    let meta = w.to_meta_json();
    assert!(!meta.contains_key("battlePowerPtsByOwner"));
    assert!(!meta.contains_key("zdobyczePowerByOwner"));
}

#[test]
fn accumulators_roundtrip_through_meta_with_web_keys() {
    let mut w = WarTurnState::default();
    w.record_battle_win(2, 7.9);
    w.record_battle_win(1, 3.0);
    w.record_battle_win(2, 2.0);
    w.record_capture_power_gain(3, 12.5, false);
    let meta = w.to_meta_json();
    assert_eq!(
        meta.get("battlePowerPtsByOwner"),
        Some(&serde_json::json!([[2, 9], [1, 3]])),
        "kolejnosc wstawiania jak Map weba"
    );
    assert_eq!(
        meta.get("zdobyczePowerByOwner"),
        Some(&serde_json::json!([[3, 12.5]]))
    );
    let back = WarTurnState::from_meta_json(&meta);
    assert_eq!(back, w);
    assert_eq!(back.battle_power_pts_for(2), 9.0);
    assert_eq!(back.zdobycze_power_for(3), 12.5);
}

#[test]
fn zero_and_negative_captures_do_not_accumulate() {
    let mut w = WarTurnState::default();
    // barbarianCapturedPowerGain(lost, true) = 0 -> brak wpisu; gain > 0 jest wymagany (web `if (powerGain > 0)`).
    w.record_capture_power_gain(1, 50.0, true);
    w.record_capture_power_gain(1, 0.0, false);
    w.record_capture_power_gain(1, -4.0, false);
    w.record_capture_power_gain(1, f64::NAN, false);
    assert!(w.zdobycze_power_by_owner.is_empty());
    assert_eq!(w.zdobycze_power_for(1), 0.0);
}

#[test]
fn elimination_clears_only_that_owner() {
    let mut w = WarTurnState::default();
    w.record_battle_win(1, 5.0);
    w.record_battle_win(2, 5.0);
    w.record_capture_power_gain(1, 9.0, false);
    w.record_capture_power_gain(2, 9.0, false);
    w.clear_power_accumulators_for_owner(1);
    assert_eq!(w.battle_power_pts_for(1), 0.0);
    assert_eq!(w.zdobycze_power_for(1), 0.0);
    assert_eq!(w.battle_power_pts_for(2), 5.0);
    assert_eq!(w.zdobycze_power_for(2), 9.0);
}

#[test]
fn accumulator_keys_are_managed_meta_keys() {
    let keys = managed_meta_keys();
    assert!(keys.iter().any(|k| k == "battlePowerPtsByOwner"));
    assert!(keys.iter().any(|k| k == "zdobyczePowerByOwner"));
}

#[test]
fn legacy_save_without_accumulator_keys_loads_and_resaves_unchanged() {
    let legacy: Map<String, Value> =
        serde_json::from_str(include_str!("p6_power_battle_acc_vectors/legacy_meta.json"))
            .expect("legacy fixture");
    assert!(!legacy.contains_key("battlePowerPtsByOwner"));
    let w = WarTurnState::from_meta_json(&legacy);
    assert!(w.battle_power_pts_by_owner.is_empty());
    assert!(w.zdobycze_power_by_owner.is_empty());
    assert_eq!(w.battle_power_pts_for(1), 0.0);
    let resaved = w.to_meta_json();
    assert!(!resaved.contains_key("battlePowerPtsByOwner"));
    assert!(!resaved.contains_key("zdobyczePowerByOwner"));
    // Istniejace klucze zapisu przechodza bez zmian.
    assert_eq!(
        resaved.get("bronzeEraEnterTurnByOwner"),
        legacy.get("bronzeEraEnterTurnByOwner")
    );
}

#[test]
fn power_raw_takes_bitwy_and_zdobycze_from_accumulators() {
    let mut state = PlayableState::empty();
    state.war.record_battle_win(1, 4.7);
    state.war.record_battle_win(1, 2.0);
    state.war.record_capture_power_gain(1, 30.0, false);
    let raw = power_raw_for_owner(&state, 1, 1.0).expect("raw");
    assert_eq!(raw.bitwy_pkt_sum, Component::Provided(6.0));
    assert_eq!(raw.wygrane_bitwy, Component::Provided(0.0));
    assert_eq!(raw.zdobycze_power, Component::Provided(30.0));
    // Inny wlasciciel: realne zero (nie brak danych).
    let other = power_raw_for_owner(&state, 2, 1.0).expect("raw2");
    assert_eq!(other.bitwy_pkt_sum, Component::Provided(0.0));
    assert_eq!(other.zdobycze_power, Component::Provided(0.0));
}
