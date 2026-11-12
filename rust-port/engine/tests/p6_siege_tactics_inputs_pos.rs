//! P6 SIEGE-TAKTYKA K5i-2a2 (R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2A2-Q1): zgodnosc `domain::siege_tactics_inputs_pos` z pinem.
//!
//! Wektory: `p6_siege_tactics_inputs_pos_vectors/vectors.json` z `p6_siege_tactics_inputs_pos_gen.mjs` (wykonanie TEKSTU pinu
//! `07d2fbd72`, strażnik SHA-256 w generatorze). Wejscia tekstowe i NaN/Infinity kodowane tagami `k` (num/str/null/undef).
//! Kazda funkcja ma wolajacego w tescie wektorowym; pokrycie galezi jest liczone i asertowane.

use civ_engine::domain::siege_tactics_blow::HitArc;
use civ_engine::domain::siege_tactics_inputs_pos::{
    battle_unit_difficulty_combat_mult, facing_toward, flank_rear_defense_penalty, is_ford_tile,
    is_shore_adjacent_to_ford, opposite_dir, relative_hit, JsVal,
};
use std::collections::HashMap;

const VECTORS: &str = include_str!("p6_siege_tactics_inputs_pos_vectors/vectors.json");

fn num_from_str(s: &str) -> f64 {
    match s {
        "NaN" => f64::NAN,
        "Infinity" => f64::INFINITY,
        "-Infinity" => f64::NEG_INFINITY,
        other => other.parse::<f64>().expect("liczba w wektorze"),
    }
}

fn val(v: &serde_json::Value) -> JsVal {
    match v["k"].as_str().unwrap() {
        "undef" => JsVal::Undef,
        "null" => JsVal::Null,
        "num" => JsVal::Num(num_from_str(v["v"].as_str().unwrap())),
        "str" => JsVal::Str(v["v"].as_str().unwrap().to_string()),
        other => panic!("nieznany tag {other}"),
    }
}

/// Rownosc dokladna: te same bity (rozroznia -0 i 0), NaN == NaN; napisy wprost.
fn same_val(a: &JsVal, b: &JsVal) -> bool {
    match (a, b) {
        (JsVal::Num(x), JsVal::Num(y)) => (x.is_nan() && y.is_nan()) || x.to_bits() == y.to_bits(),
        _ => a == b,
    }
}

fn arc(s: &str) -> HitArc {
    match s {
        "front" => HitArc::Front,
        "flank" => HitArc::Flank,
        "rear" => HitArc::Rear,
        other => panic!("nieznany kierunek {other}"),
    }
}

fn tm(case: &serde_json::Value) -> HashMap<(i32, i32), u8> {
    case["input"]["cells"]
        .as_object()
        .unwrap()
        .iter()
        .map(|(k, v)| {
            let (c, r) = k.split_once(',').unwrap();
            (
                (c.parse().unwrap(), r.parse().unwrap()),
                v.as_u64().unwrap() as u8,
            )
        })
        .collect()
}

#[derive(Default, Debug)]
struct Cov {
    per_fn: HashMap<String, usize>,
    facing_zero_fallback: usize,
    facing_e: usize,
    facing_w: usize,
    facing_s: usize,
    facing_n: usize,
    facing_default_fallback: usize,
    facing_str_input: usize,
    facing_nan_input: usize,
    opp_str: usize,
    opp_nan: usize,
    hit_front: usize,
    hit_rear: usize,
    hit_flank: usize,
    ford_true: usize,
    ford_false: usize,
    shore_true: usize,
    shore_own_water: usize,
    shore_false_dry: usize,
    diff_fallback: usize,
    diff_own: usize,
    diff_nan_own: usize,
    diff_str_own: usize,
    pen_front: usize,
    pen_flank: usize,
    pen_rear_other: usize,
    pen_missing: usize,
    pen_text: usize,
    pen_nan: usize,
}

#[test]
fn wektory_zgodne_z_pinem_i_pokrycie_galezi() {
    let v: serde_json::Value = serde_json::from_str(VECTORS).expect("vectors.json");
    let cases = v["cases"].as_array().unwrap();
    assert!(
        cases.len() >= 500,
        "minimum 500 przypadkow, jest {}",
        cases.len()
    );
    let mut cov = Cov::default();

    for case in cases {
        let id = case["id"].as_str().unwrap();
        let f = case["fn"].as_str().unwrap();
        let i = &case["input"];
        let e = &case["expect"];
        *cov.per_fn.entry(f.to_string()).or_default() += 1;
        match f {
            "facingToward" => {
                let (c, r, fb) = (val(&i["dCol"]), val(&i["dRow"]), val(&i["fallback"]));
                let got = facing_toward(&c, &r, &fb);
                let want = val(&e["dir"]);
                assert!(same_val(&got, &want), "{id}: {got:?} != {want:?}");
                if matches!((&c, &r), (JsVal::Num(a), JsVal::Num(b)) if *a == 0.0 && *b == 0.0) {
                    cov.facing_zero_fallback += 1;
                }
                if fb == JsVal::Undef {
                    cov.facing_default_fallback += 1;
                }
                if matches!(c, JsVal::Str(_)) || matches!(r, JsVal::Str(_)) {
                    cov.facing_str_input += 1;
                }
                if c.to_number().is_nan() || r.to_number().is_nan() {
                    cov.facing_nan_input += 1;
                }
                match got {
                    JsVal::Num(1.0) => cov.facing_e += 1,
                    JsVal::Num(3.0) => cov.facing_w += 1,
                    JsVal::Num(2.0) => cov.facing_s += 1,
                    JsVal::Num(0.0) => cov.facing_n += 1,
                    _ => {}
                }
            }
            "oppositeDir" => {
                let d = val(&i["d"]);
                let got = JsVal::Num(opposite_dir(&d));
                let want = val(&e["dir"]);
                assert!(same_val(&got, &want), "{id}: {got:?} != {want:?}");
                if matches!(d, JsVal::Str(_)) {
                    cov.opp_str += 1;
                }
                if let JsVal::Num(x) = got {
                    if x.is_nan() {
                        cov.opp_nan += 1;
                    }
                }
            }
            "relativeHit" => {
                let got = relative_hit(
                    &val(&i["facing"]),
                    &val(&i["ac"]),
                    &val(&i["ar"]),
                    &val(&i["dc"]),
                    &val(&i["dr"]),
                );
                assert_eq!(got, arc(e["hit"].as_str().unwrap()), "{id}: relativeHit");
                match got {
                    HitArc::Front => cov.hit_front += 1,
                    HitArc::Rear => cov.hit_rear += 1,
                    HitArc::Flank => cov.hit_flank += 1,
                }
            }
            "isFordTile" => {
                let cells = tm(case);
                let at = |c: i32, r: i32| *cells.get(&(c, r)).unwrap_or(&0);
                let col = i["col"].as_i64().unwrap() as i32;
                let row = i["row"].as_i64().unwrap() as i32;
                let got = is_ford_tile(&at, col, row);
                assert_eq!(got, e["v"].as_bool().unwrap(), "{id}: isFordTile");
                if got {
                    cov.ford_true += 1;
                } else {
                    cov.ford_false += 1;
                }
            }
            "isShoreAdjacentToFord" => {
                let cells = tm(case);
                let at = |c: i32, r: i32| *cells.get(&(c, r)).unwrap_or(&0);
                let col = i["col"].as_i64().unwrap() as i32;
                let row = i["row"].as_i64().unwrap() as i32;
                let got = is_shore_adjacent_to_ford(&at, col, row);
                assert_eq!(
                    got,
                    e["v"].as_bool().unwrap(),
                    "{id}: isShoreAdjacentToFord"
                );
                let own = at(col, row);
                if got {
                    cov.shore_true += 1;
                } else if own == 3 || own == 4 {
                    cov.shore_own_water += 1;
                } else {
                    cov.shore_false_dry += 1;
                }
            }
            "battleUnitDifficultyCombatMult" => {
                let fb = val(&i["fallback"]);
                let unit = &i["unit"];
                let field = if unit["has"].as_bool().unwrap() {
                    Some(val(&unit["v"]))
                } else {
                    None
                };
                let got = battle_unit_difficulty_combat_mult(field.as_ref(), &fb);
                let want = val(&e["v"]);
                assert!(same_val(&got, &want), "{id}: {got:?} != {want:?}");
                match &field {
                    None | Some(JsVal::Undef) | Some(JsVal::Null) => cov.diff_fallback += 1,
                    Some(JsVal::Num(x)) => {
                        cov.diff_own += 1;
                        if x.is_nan() {
                            cov.diff_nan_own += 1;
                        }
                    }
                    Some(JsVal::Str(_)) => cov.diff_str_own += 1,
                }
            }
            "flankRearDefensePenalty" => {
                let (fl, re) = (val(&i["flank"]), val(&i["rear"]));
                let pos = i["position"].as_str().unwrap();
                let got = JsVal::Num(flank_rear_defense_penalty(&fl, &re, pos));
                let want = val(&e["v"]);
                assert!(
                    same_val(&got, &want),
                    "{id}: {got:?} != {want:?} ({fl:?} {re:?} {pos})"
                );
                let used = if pos == "flank" { &fl } else { &re };
                if pos == "front" {
                    cov.pen_front += 1;
                } else {
                    if pos == "flank" {
                        cov.pen_flank += 1;
                    } else if pos != "rear" {
                        cov.pen_rear_other += 1;
                    }
                    match used {
                        JsVal::Undef | JsVal::Null => cov.pen_missing += 1,
                        JsVal::Str(_) => cov.pen_text += 1,
                        JsVal::Num(x) if x.is_nan() => cov.pen_nan += 1,
                        _ => {}
                    }
                }
            }
            other => panic!("{id}: nieznana funkcja {other}"),
        }
    }

    eprintln!("pokrycie K5i-2a2: {cov:?}");
    for f in [
        "facingToward",
        "oppositeDir",
        "relativeHit",
        "isFordTile",
        "isShoreAdjacentToFord",
        "battleUnitDifficultyCombatMult",
        "flankRearDefensePenalty",
    ] {
        assert!(
            cov.per_fn.get(f).copied().unwrap_or(0) >= 100,
            "{f}: za malo wywolan w wektorach"
        );
    }
    macro_rules! pos {
        ($($n:ident),+) => { $( assert!(cov.$n > 0, concat!("brak pokrycia: ", stringify!($n))); )+ };
    }
    pos!(
        facing_zero_fallback,
        facing_e,
        facing_w,
        facing_s,
        facing_n,
        facing_default_fallback,
        facing_str_input,
        facing_nan_input,
        opp_str,
        opp_nan,
        hit_front,
        hit_rear,
        hit_flank,
        ford_true,
        ford_false,
        shore_true,
        shore_own_water,
        shore_false_dry,
        diff_fallback,
        diff_own,
        diff_nan_own,
        diff_str_own,
        pen_front,
        pen_flank,
        pen_rear_other,
        pen_missing,
        pen_text,
        pen_nan
    );
}
