//! R-RUSTPORT-P6-POWER-AKUMULATORY-WIRING-Q1: adapter zdarzen gry -> akumulatory mocy -> `power_raw_for_owner`.
//!
//! - Wektory: `p6_power_acc_wiring_vectors/vectors.json` (generator `p6_power_acc_wiring_gen.mjs` wykonuje kod
//!   z pinu 07d2fbd72 i sprawdza SHA-256 zrodel). Kazdy przypadek = sekwencja zdarzen gry (wygrana bitwy,
//!   zdobycie barbarzyncow, eliminacja) -> oczekiwane `bitwy_pkt_sum` i `zdobycze_power` wlasciciela.
//! - Wejscie: adaptery `PlayableState::power_record_*` (tu testowane przez `power_raw_for_owner`, nie przez
//!   bezposredni dostep do `war`).
//! - Brak wolajacego w produkcji: adaptery nie maja jeszcze produkcyjnych wywolan (patrz raport temat).

use civ_engine::domain::brake_power::Component;
use civ_engine::domain::playable::PlayableState;
use civ_engine::domain::turn_war_inputs::power_raw_for_owner;
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
    serde_json::from_str(include_str!("p6_power_acc_wiring_vectors/vectors.json")).expect("vectors")
}

fn apply_events(state: &mut PlayableState, events: &[Value]) {
    for ev in events {
        match ev["kind"].as_str().expect("kind") {
            "battle" => state.power_record_battle_win(
                ev["winner"].as_i64().expect("winner"),
                num(&ev["enemy_m"]),
            ),
            "capture" => state.power_record_city_capture(
                ev["new_owner"].as_i64().expect("new_owner"),
                num(&ev["lost_power"]),
                ev["barb_captor"].as_bool().expect("barb_captor"),
            ),
            "elim" => state.power_clear_eliminated_owner(ev["owner"].as_i64().expect("owner")),
            other => panic!("nieznane zdarzenie {other}"),
        }
    }
}

#[test]
fn event_sequences_match_pin_through_power_raw() {
    let v = vectors();
    assert_eq!(
        v["pin"].as_str(),
        Some("07d2fbd72f758705f8e1d59cc4968027ffbafe75")
    );
    let cases = v["cases"].as_array().expect("cases");
    assert!(cases.len() >= 150, "przypadkow: {}", cases.len());
    let mut bitwy_nonzero = 0;
    let mut zdobycze_nonzero = 0;
    for (idx, c) in cases.iter().enumerate() {
        let events = c["events"].as_array().expect("events");
        let owner = c["owner"].as_i64().expect("owner");
        let mut state = PlayableState::empty();
        apply_events(&mut state, events);
        let raw = power_raw_for_owner(&state, owner, 1.0).expect("raw");
        let exp_b = num(&c["expect_bitwy_pkt"]);
        let exp_z = num(&c["expect_zdobycze"]);
        match raw.bitwy_pkt_sum {
            Component::Provided(got) => {
                assert!(same(got, exp_b), "bitwy[{idx}] {c}: {got} != {exp_b}");
                if got != 0.0 {
                    bitwy_nonzero += 1;
                }
            }
            other => panic!("bitwy[{idx}] nie Provided: {other:?}"),
        }
        match raw.zdobycze_power {
            Component::Provided(got) => {
                assert!(same(got, exp_z), "zdobycze[{idx}] {c}: {got} != {exp_z}");
                if got != 0.0 {
                    zdobycze_nonzero += 1;
                }
            }
            other => panic!("zdobycze[{idx}] nie Provided: {other:?}"),
        }
    }
    assert!(bitwy_nonzero >= 30, "bitwy niezerowe: {bitwy_nonzero}");
    assert!(
        zdobycze_nonzero >= 30,
        "zdobycze niezerowe: {zdobycze_nonzero}"
    );
}

#[test]
fn eliminated_owner_reads_real_zero_and_others_keep_sums() {
    let mut state = PlayableState::empty();
    state.power_record_battle_win(1, 4.7);
    state.power_record_battle_win(2, 4.7);
    state.power_record_city_capture(1, 30.0, false);
    state.power_record_city_capture(2, 30.0, true);
    state.power_clear_eliminated_owner(1);
    let gone = power_raw_for_owner(&state, 1, 1.0).expect("raw1");
    assert_eq!(gone.bitwy_pkt_sum, Component::Provided(0.0));
    assert_eq!(gone.zdobycze_power, Component::Provided(0.0));
    let kept = power_raw_for_owner(&state, 2, 1.0).expect("raw2");
    assert_eq!(
        kept.bitwy_pkt_sum,
        Component::Provided(state.war.battle_power_pts_for(2))
    );
    // Barbarzynca jako zdobywca: zdobycze pozostaja zero (brak dziedziczenia Power).
    assert_eq!(kept.zdobycze_power, Component::Provided(0.0));
}

#[test]
fn accumulators_survive_meta_roundtrip_with_web_keys() {
    let mut state = PlayableState::empty();
    state.power_record_battle_win(3, 12.0);
    state.power_record_city_capture(3, 100.0, false);
    let meta: Map<String, Value> = state.war.to_meta_json();
    assert!(meta.contains_key("battlePowerPtsByOwner"));
    assert!(meta.contains_key("zdobyczePowerByOwner"));
    let back = civ_engine::domain::war_turn_state::WarTurnState::from_meta_json(&meta);
    assert_eq!(
        back.battle_power_pts_for(3),
        state.war.battle_power_pts_for(3)
    );
    assert_eq!(back.zdobycze_power_for(3), 100.0);
}
