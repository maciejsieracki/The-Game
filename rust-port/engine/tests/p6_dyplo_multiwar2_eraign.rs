//! P6-DYPLOMACJA-MULTIWAR-2 (runda 1, partia A): zgodnosc ERADELAY/ERAIGN z URUCHOMIONYM webem
//! (pin `origin/main` 5dd53e60f, FALA 546-547): `evaluateInterCivWarGate` z `eraTag`,
//! `isEraForcedWarIgnoringR1`, `isWarTreatyBlocked`, progi `eraForcedWarStartTurnsFromEra`.
//! Wektory: `tests/p6_dyplo_multiwar_gates_data/eraign.json` (generator: Node 22 +
//! `--experimental-strip-types`, prawdziwe funkcje weba; jedyny patch to import JSON).
//! Liczby: `String(x)`; NaN porownywane jako NaN; `"undefined"` = brak wartosci (NaN / brak tagu).

use civ_engine::domain::diplomacy_multiwar_gate::*;
use serde_json::Value;

const ERAIGN: &str = include_str!("p6_dyplo_multiwar_gates_data/eraign.json");

fn num(v: &Value) -> f64 {
    if let Some(f) = v.as_f64() {
        return f;
    }
    match v.as_str().expect("liczba jako string") {
        "NaN" | "undefined" => f64::NAN,
        s => s.parse::<f64>().expect("liczba"),
    }
}

fn int(v: &Value) -> i64 {
    v.as_i64().unwrap_or_else(|| num(v) as i64)
}

/// Tag epoki: `null`, brak klucza, `"undefined"` lub nieznana wartosc = `None` (zwykle wypowiedzenie).
fn tag(v: Option<&Value>) -> Option<ForcedEraTag> {
    match v.and_then(Value::as_str) {
        Some("bronze") => Some(ForcedEraTag::Bronze),
        Some("iron") => Some(ForcedEraTag::Iron),
        Some("stone") => Some(ForcedEraTag::Stone),
        _ => None,
    }
}

fn boolv(v: &Value) -> bool {
    match v {
        Value::Bool(b) => *b,
        Value::String(s) => s == "true",
        other => panic!("bool oczekiwany, jest {other}"),
    }
}

#[test]
fn eraign_vectors_match_web() {
    let cases: Vec<Value> = serde_json::from_str(ERAIGN).expect("wektory musza sie parsowac");
    let mut counts: std::collections::BTreeMap<&str, usize> = Default::default();
    for c in &cases {
        let input = &c["in"];
        let out = c["out"].as_str().expect("out jako string").to_string();
        let f = c["fn"].as_str().expect("fn");
        *counts.entry(f).or_default() += 1;
        match f {
            "evaluateInterCivWarGate" => {
                let inp = InterCivWarGateInput {
                    turn: num(&input["turn"]),
                    attacker_era: num(&input["attackerEra"]),
                    attacker_war_count: int(&input["attackerWarCount"]),
                    target_is_player: boolv(&input["targetIsPlayer"]),
                    target_era: num(&input["targetEra"]),
                    target_war_count: int(&input["targetWarCount"]),
                    era_tag: tag(input.get("eraTag")),
                };
                assert_eq!(
                    evaluate_inter_civ_war_gate(&inp).as_web_str(),
                    out,
                    "{input}"
                );
            }
            "isEraForcedWarIgnoringR1" => {
                let got = is_era_forced_war_ignoring_r1(tag(input.get("eraTag")));
                assert_eq!(got.to_string(), out, "{input}");
            }
            "isWarTreatyBlocked" => {
                let got = is_war_treaty_blocked(
                    boolv(&input["eraWar"]),
                    boolv(&input["hasNap"]),
                    boolv(&input["peaceLocked"]),
                    boolv(&input["hasAlliance"]),
                );
                assert_eq!(got.to_string(), out, "{input}");
            }
            "eraForcedWarStartTurnsFromEra" => {
                let got = match input["tag"].as_str().expect("tag") {
                    "bronze" => ERA_FORCED_WAR_START_TURNS_BRONZE,
                    "iron" => ERA_FORCED_WAR_START_TURNS_IRON,
                    other => panic!("nieznany tag {other}"),
                };
                assert_eq!(num(&Value::String(out.clone())), got, "{input}");
            }
            other => panic!("nieznana funkcja {other}"),
        }
    }
    // Liczba z generatora: 8 tur x 5 tagow x 2 x 2 = 160 gate + 5 ignoreR1 + 16 treaty + 2 progi = 183.
    assert_eq!(cases.len(), 183, "liczba wektorow eraign");
    assert_eq!(counts["evaluateInterCivWarGate"], 160);
    assert_eq!(counts["isWarTreatyBlocked"], 16);
}

#[test]
fn era_delay_n_minus_1_n_n_plus_1_for_bronze_and_iron() {
    // Brak tagi (zwykle wypowiedzenie): R1 obowiazuje na 39/40.
    let base = InterCivWarGateInput {
        turn: 39.0,
        attacker_era: 2.0,
        attacker_war_count: 0,
        target_is_player: false,
        target_era: 2.0,
        target_war_count: 0,
        era_tag: None,
    };
    assert_eq!(evaluate_inter_civ_war_gate(&base), WarGateReason::DelayR1);
    // Wojna epoki Brazu/Zelaza omija R1 juz w turze 39 (N-1) i 0.
    for tag_v in [ForcedEraTag::Bronze, ForcedEraTag::Iron] {
        let inp = InterCivWarGateInput {
            era_tag: Some(tag_v),
            ..base
        };
        assert_eq!(evaluate_inter_civ_war_gate(&inp), WarGateReason::Ok);
        let inp0 = InterCivWarGateInput { turn: 0.0, ..inp };
        assert_eq!(evaluate_inter_civ_war_gate(&inp0), WarGateReason::Ok);
    }
    // Kamien NIE omija R1.
    let stone = InterCivWarGateInput {
        era_tag: Some(ForcedEraTag::Stone),
        ..base
    };
    assert_eq!(evaluate_inter_civ_war_gate(&stone), WarGateReason::DelayR1);
    // NaN tury: R1 blokuje nawet przy tagu Brazu? Web: `!(NaN>=40) && !ignore` -> ignore=true -> ok.
    let nan_bronze = InterCivWarGateInput {
        turn: f64::NAN,
        era_tag: Some(ForcedEraTag::Bronze),
        ..base
    };
    assert_eq!(evaluate_inter_civ_war_gate(&nan_bronze), WarGateReason::Ok);
    assert!(!is_era_forced_war_ignoring_r1(None));
    assert!(is_era_forced_war_ignoring_r1(Some(ForcedEraTag::Bronze)));
    assert!(!is_era_forced_war_ignoring_r1(Some(ForcedEraTag::Stone)));
    assert_eq!(ERA_FORCED_WAR_START_TURNS_BRONZE, 20.0);
    assert_eq!(ERA_FORCED_WAR_START_TURNS_IRON, 20.0);
}

#[test]
fn era_war_only_alliance_blocks_treaty() {
    // Wojna epoki: blokuje wylacznie sojusz (NAP/blokada/umowy nie).
    assert!(!is_war_treaty_blocked(true, true, true, false));
    assert!(is_war_treaty_blocked(true, false, false, true));
    // Zwykle wypowiedzenie: NAP albo blokada pokoju blokuje, sojusz sam nie.
    assert!(is_war_treaty_blocked(false, true, false, false));
    assert!(is_war_treaty_blocked(false, false, true, false));
    assert!(!is_war_treaty_blocked(false, false, false, true));
}
