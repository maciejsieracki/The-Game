//! R-RUSTPORT-P6-ECON-TICK-HEAL-MAXHP-Q1 (pin weba `4bbef081d`): zrodlo `getMaxHp` dla leczenia jednostek w
//! ticku ekonomii (`domain::unit_health`). Wektory z URUCHOMIONEGO weba
//! (`dyspozycje/autobot/runs/R-RUSTPORT-P6-ECON-TICK-HEAL-MAXHP-Q1/gen-p6-heal-maxhp-vectors.mjs`): prawdziwe
//! `effectiveMaxHp`, `veteran*`, `unitParametryBonusFrac`, `tickManpowerUnitReplenishment` w `advanceCityEconomy`.
//! Porownanie BITOWE (wartosc, kolejnosc wywolan `getMaxHp`, HP po leczeniu, pule miast, `onUnitHpChanged`).

#[path = "p6_7b_vectors/common.rs"]
mod common;

use std::cell::RefCell;
use std::collections::BTreeMap;

use civ_engine::data::civilizations::Num;
use civ_engine::data::units_combat::parse_units;
use civ_engine::domain::civ_matrix::load_civ_matrix;
use civ_engine::domain::combat::unit_building_bonuses::{
    unit_parametry_bonus_frac, UnitBuildingProgress,
};
use civ_engine::domain::recruitment::manpower::{
    ManpowerCity, ManpowerDifficulty, ManpowerHealUnit,
};
use civ_engine::domain::turn_economy_advance::{advance_manpower_heal, AdvanceManpowerHealInput};
use civ_engine::domain::unit_health::{
    effective_max_hp, heal_max_hp, js_parse_float, norm_field_val, unit_health, unit_health_value,
    veteran_battles_won, veteran_bonus_frac_for_wins, veteran_combat_bonus_frac,
    veteran_star_count, UnitHealthSource,
};
use common::*;
use serde_json::{json, Value};

const VECTORS: &str = include_str!("p6_heal_maxhp_vectors/maxhp.json");

fn d() -> Value {
    serde_json::from_str(VECTORS).expect("maxhp.json")
}

fn opt_num(v: &Value) -> Option<f64> {
    js_num(v)
}

/// Kanonizacja do porownania BITOWEGO (liczba / "NaN" / "~0.5" -> bity f64).
fn canon(v: &Value) -> Value {
    match v {
        Value::Number(n) => json!(format!("f64:{:016x}", n.as_f64().unwrap().to_bits())),
        Value::String(_) => match js_num(v) {
            Some(x) => json!(format!("f64:{:016x}", x.to_bits())),
            None => v.clone(),
        },
        Value::Array(a) => Value::Array(a.iter().map(canon).collect()),
        Value::Object(o) => Value::Object(o.iter().map(|(k, x)| (k.clone(), canon(x))).collect()),
        other => other.clone(),
    }
}

fn enc_opt(x: Option<f64>) -> Value {
    x.map_or(Value::Null, enc)
}

#[test]
fn norm_field_val_matches_web() {
    let d = d();
    let v = arr(&d, "norm");
    assert_eq!(v.len(), 148);
    for c in v {
        let fb = num(&c["fb"]);
        let got = norm_field_val(c.get("v"), fb);
        assert_bits(&format!("normFieldVal {c}"), got, num(&c["out"]));
    }
}

#[test]
fn js_parse_float_prefixes() {
    assert_eq!(js_parse_float(" 12abc"), 12.0);
    assert_eq!(js_parse_float("1e2"), 100.0);
    assert_eq!(js_parse_float(".5"), 0.5);
    assert_eq!(js_parse_float("5."), 5.0);
    assert_eq!(js_parse_float("1.5e"), 1.5);
    assert_eq!(js_parse_float("-Infinityx"), f64::NEG_INFINITY);
    assert!(js_parse_float("infinity").is_nan());
    assert!(js_parse_float("0x10") == 0.0);
    assert!(js_parse_float("").is_nan());
    assert!(js_parse_float(".").is_nan());
}

#[test]
fn unit_health_value_matches_web() {
    let d = d();
    let v = arr(&d, "defs");
    assert_eq!(v.len(), 196);
    for c in v {
        let got = unit_health_value(Some(&c["def"]));
        assert_bits(&format!("unitHealth {}", c["def"]), got, num(&c["out"]));
    }
    // brak wiersza (`?? {}`) = 30
    assert_bits("unitHealth({})", unit_health_value(None), 30.0);
    assert_bits("unitHealth(None)", unit_health(None), 30.0);
}

#[test]
fn lowercase_health_wins_over_capital_health_in_typed_rows() {
    // Pulapka danych: `units.json` ma `health` (TW v3) i `Health` (legacy) o ROZNYCH wartosciach.
    let units = parse_units().unwrap();
    let w = units.iter().find(|u| u.jednostka == "Wojownik").unwrap();
    assert_eq!((w.health_lc, w.health), (22, 60));
    assert_bits("Wojownik", unit_health(Some(w)), 22.0);
    let differ = units.iter().filter(|u| u.health_lc != u.health).count();
    assert_eq!(differ, 49, "rozbieznych wierszy health vs Health");
}

#[test]
fn effective_max_hp_matches_web() {
    let d = d();
    let v = arr(&d, "emh");
    assert_eq!(v.len(), 1176);
    for c in v {
        let got = effective_max_hp(num(&c["b"]), num(&c["p"]), num(&c["v"]));
        assert_bits(&format!("effectiveMaxHp {c}"), got, num(&c["out"]));
    }
}

#[test]
fn veteran_and_parametry_match_web() {
    let d = d();
    for c in arr(&d, "vet") {
        let bs = if c.get("absent").is_some() || c.get("str").is_some() {
            None
        } else {
            opt_num(&c["bs"])
        };
        let out = &c["out"];
        assert_bits("won", veteran_battles_won(bs), num(&out["won"]));
        assert_bits("stars", veteran_star_count(bs), num(&out["stars"]));
        assert_bits("frac", veteran_combat_bonus_frac(bs), num(&out["frac"]));
    }
    for c in arr(&d, "wins") {
        assert_bits(
            &format!("wins {c}"),
            veteran_bonus_frac_for_wins(c["w"].as_f64().unwrap()),
            num(&c["out"]),
        );
    }
    for c in arr(&d, "par") {
        let p = if c.get("absent").is_some() || c.get("str").is_some() {
            None
        } else {
            opt_num(&c["p"])
        };
        let u = UnitBuildingProgress {
            pancerz_bonus_proc: None,
            parametry_bonus_proc: p,
        };
        assert_bits(
            &format!("parametryFrac {c}"),
            unit_parametry_bonus_frac(Some(&u)),
            num(&c["out"]),
        );
    }
}

fn live_of(c: &Value) -> ManpowerHealUnit {
    ManpowerHealUnit {
        id: "live".into(),
        owner_id: 0,
        type_id: text(&c["type"]),
        category: "piechota".into(),
        hp: None,
        hp_max: None,
        parametry_bonus_proc: opt_num(&c["pp"]),
        battles_survived: opt_num(&c["bs"]),
        q: None,
        r: None,
        in_garnizon: None,
    }
}

#[test]
fn get_max_hp_closure_matches_web_on_real_unit_rows() {
    let d = d();
    let units = parse_units().unwrap();
    let src = UnitHealthSource::new(&units);
    let v = arr(&d, "closure");
    assert_eq!(v.len(), 390);
    let (mut n_bonus, mut n_unknown) = (0, 0);
    for c in v {
        let t = text(&c["type"]);
        let want = num(&c["out"]);
        let got = if c["live"].as_bool().unwrap() {
            let live = live_of(c);
            let g = src.max_hp(&t, Some(&live));
            // ta sama sciezka przez gotowy `get_max_hp`
            assert_bits("as_get_max_hp", (src.as_get_max_hp())(&t, &live), g);
            if live.parametry_bonus_proc.unwrap_or(0.0) > 0.0 || live.battles_survived.unwrap_or(0.0) > 0.0 {
                n_bonus += 1;
            }
            g
        } else {
            src.max_hp(&t, None)
        };
        if !units.iter().any(|u| u.jednostka == t) {
            n_unknown += 1;
            assert_bits("brak typu = 30 * (1+bonusy)", heal_max_hp(None, None), 30.0);
        }
        assert_bits(&format!("getMaxHp {c}"), got, want);
    }
    assert!(n_bonus >= 150, "bonusy {n_bonus}");
    assert!(n_unknown >= 12, "nieznane {n_unknown}");
}

#[test]
fn e2e_heal_with_rust_get_max_hp_matches_web() {
    let d = d();
    let units_db = parse_units().unwrap();
    let src = UnitHealthSource::new(&units_db);
    let get_max_hp = src.as_get_max_hp();
    let mut matrix = load_civ_matrix().file.clone();
    for (civ, params) in d["matrixPatch"].as_object().unwrap() {
        let row = matrix
            .cywilizacje
            .iter_mut()
            .find(|c| &c.ikona_id == civ)
            .unwrap_or_else(|| panic!("brak cywilizacji {civ}"));
        for (k, v) in params.as_object().unwrap() {
            let n = v.as_f64().unwrap();
            let val = if n.fract() == 0.0 {
                Num::Int(n as i64)
            } else {
                Num::Float(n)
            };
            row.params.insert(k.clone(), val);
        }
    }

    let (mut n_healed, mut n_bonus_heal, mut n_calls, mut n_asked) = (0, 0, 0, 0);
    let scenarios = arr(&d, "scenarios");
    assert_eq!(scenarios.len(), 400);
    for s in scenarios {
        let name = text(&s["name"]);
        let out = &s["out"];
        let mut cities: Vec<ManpowerCity> = arr(out, "pre")
            .iter()
            .map(|c| ManpowerCity {
                id: text(&c["id"]),
                owner_id: c["ownerId"].as_i64().unwrap(),
                population: num(&c["population"]),
                manpower: opt_num(&c["manpower"]),
                q: c["q"].as_i64().unwrap() as i32,
                r: c["r"].as_i64().unwrap() as i32,
                oblegane: c["oblegane"].as_bool(),
            })
            .collect();
        let mut units: Vec<ManpowerHealUnit> = arr(s, "units")
            .iter()
            .map(|u| ManpowerHealUnit {
                id: text(&u["id"]),
                owner_id: u["ownerId"].as_i64().unwrap(),
                type_id: text(&u["typeId"]),
                category: text(&u["category"]),
                hp: opt_num(&u["hp"]),
                hp_max: opt_num(&u["hpMax"]),
                parametry_bonus_proc: opt_num(&u["parametryBonusProc"]),
                battles_survived: opt_num(&u["battlesSurvived"]),
                q: u["q"].as_i64().map(|x| x as i32),
                r: u["r"].as_i64().map(|x| x as i32),
                in_garnizon: u["inGarnizon"].as_bool(),
            })
            .collect();
        let civ_by_owner: BTreeMap<i64, String> = s["civByOwner"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, v)| (k.parse().unwrap(), text(v)))
            .collect();
        let era_by_owner: Option<BTreeMap<i64, f64>> = s["eraByOwner"].as_object().map(|o| {
            o.iter()
                .map(|(k, v)| (k.parse().unwrap(), num(v)))
                .collect()
        });
        let era_fn = |o: i64| era_by_owner.as_ref().unwrap()[&o];
        let difficulty = match text(&s["difficulty"]).as_str() {
            "easy" => ManpowerDifficulty::Easy,
            "normal" => ManpowerDifficulty::Normal,
            _ => ManpowerDifficulty::Hard,
        };
        let asked: RefCell<Vec<Value>> = RefCell::new(Vec::new());
        let spy = |t: &str, u: &ManpowerHealUnit| {
            let v = get_max_hp(t, u);
            asked.borrow_mut().push(json!([u.id, enc(v)]));
            v
        };
        let mut calls: Vec<Value> = Vec::new();
        let mut on_changed = |id: &str, hp: f64, hp_max: f64| {
            calls.push(json!([id, enc(hp), enc(hp_max)]));
        };
        let res = advance_manpower_heal(
            &mut cities,
            &mut units,
            AdvanceManpowerHealInput {
                difficulty,
                player_era: num(&s["playerEra"]),
                owner_era: if era_by_owner.is_some() {
                    Some(&era_fn)
                } else {
                    None
                },
                matrix: &matrix,
                owner_civ_by_owner_id: &civ_by_owner,
                get_max_hp: &spy,
                on_unit_hp_changed: Some(&mut on_changed),
            },
        );

        assert_eq!(
            res.healed_count as u64,
            out["healedCount"].as_u64().unwrap(),
            "{name}: healedCount"
        );
        assert_eq!(
            canon(&enc(res.total_mp_spent)),
            canon(&out["totalMpSpent"]),
            "{name}: totalMpSpent"
        );
        let got_units: Vec<Value> = units
            .iter()
            .map(|u| json!({"id": u.id, "hp": enc_opt(u.hp), "hpMax": enc_opt(u.hp_max)}))
            .collect();
        assert_eq!(
            canon(&Value::Array(got_units)),
            canon(&out["units"]),
            "{name}: units"
        );
        let got_mp: Vec<Value> = cities.iter().map(|c| enc_opt(c.manpower)).collect();
        assert_eq!(
            canon(&Value::Array(got_mp)),
            canon(&out["cityManpower"]),
            "{name}: pule miast"
        );
        assert_eq!(
            canon(&Value::Array(calls)),
            canon(&out["calls"]),
            "{name}: onUnitHpChanged"
        );
        let asked = asked.into_inner();
        assert_eq!(
            canon(&Value::Array(asked.clone())),
            canon(&out["asked"]),
            "{name}: getMaxHp (kolejnosc i wartosci)"
        );

        n_asked += asked.len();
        if res.healed_count > 0 {
            n_healed += 1;
            let has_bonus = arr(s, "units").iter().any(|u| {
                js_num(&u["parametryBonusProc"]).unwrap_or(0.0) > 0.0
                    || js_num(&u["battlesSurvived"]).unwrap_or(0.0) > 0.0
            });
            if has_bonus {
                n_bonus_heal += 1;
            }
        }
        if !out["calls"].as_array().unwrap().is_empty() {
            n_calls += 1;
        }
    }
    assert!(n_healed >= 250, "healed {n_healed}");
    assert!(n_bonus_heal >= 200, "healed z bonusami {n_bonus_heal}");
    assert!(n_calls >= 250, "calls {n_calls}");
    assert!(n_asked >= 1500, "getMaxHp wywolan {n_asked}");
}
