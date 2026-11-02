//! R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q1 (obrona R1), plaster S9 `manpowerHeal` (`turn-economy.ts:2887-2909`,
//! pin `4bbef081d`) przez `advance_manpower_heal`. Wektory z URUCHOMIONEGO `advanceCityEconomy`
//! (`dyspozycje/autobot/runs/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q1/gen-p6-adv-heal-vectors.mjs`): pule miast tuz
//! przed blokiem leczenia, jednostki przed/po, wywolania `onUnitHpChanged`, wynik `tickManpowerUnitReplenishment`.
//! Macierz cywilizacji ma w wektorze nalozony `matrixPatch` (w prawdziwych danych `mp_max_proc` i
//! `mp_koszt_jednostki_proc` sa wszedzie 0).

#[path = "p6_7b_vectors/common.rs"]
mod common;

use std::collections::BTreeMap;

use civ_engine::data::civilizations::Num;
use civ_engine::domain::civ_matrix::load_civ_matrix;
use civ_engine::domain::recruitment::manpower::{
    ManpowerCity, ManpowerDifficulty, ManpowerHealUnit,
};
use civ_engine::domain::turn_economy_advance::{advance_manpower_heal, AdvanceManpowerHealInput};
use common::*;
use serde_json::{json, Value};

const VECTORS: &str = include_str!("p6_adv_city_econ_vectors/heal.json");

fn opt_num(v: &Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(num(v))
    }
}

fn enc_opt(x: Option<f64>) -> Value {
    x.map_or(Value::Null, enc)
}

/// Kanonizacja do porownania BITOWEGO: liczba JSON i napis "NaN"/"~0.5" -> bity f64 (id jednostek to
/// napisy zaczynajace sie od `u`, wiec nie koliduja z kodowaniem liczb).
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

fn unit_of(u: &Value) -> ManpowerHealUnit {
    ManpowerHealUnit {
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
    }
}

#[test]
fn s9_manpower_heal_matches_web() {
    let d: Value = serde_json::from_str(VECTORS).expect("heal.json");
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

    let (mut n_healed, mut n_pool, mut n_calls, mut n_matrix) = (0, 0, 0, 0);
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
        let mut units: Vec<ManpowerHealUnit> = arr(s, "units").iter().map(unit_of).collect();
        let max_hp: BTreeMap<String, f64> = s["maxHpByType"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, v)| (k.clone(), num(v)))
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
        let get_max_hp = |t: &str| max_hp[t];
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
                get_max_hp: &get_max_hp,
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

        if res.healed_count > 0 {
            n_healed += 1;
        }
        if cities
            .iter()
            .zip(arr(out, "pre"))
            .any(|(c, p)| enc_opt(c.manpower) != p["manpower"])
        {
            n_pool += 1;
        }
        if !out["calls"].as_array().unwrap().is_empty() {
            n_calls += 1;
        }
        if civ_by_owner
            .values()
            .any(|k| ["egipt", "sumer", "celtowie"].contains(&k.as_str()))
            && res.healed_count > 0
        {
            n_matrix += 1;
        }
    }
    // pokrycie: scenariusze realnie leczace, zmieniajace pule, wolajace callback i uzywajace macierzy
    assert!(n_healed >= 100, "healed {n_healed}");
    assert!(n_pool >= 100, "pool {n_pool}");
    assert!(n_calls >= 100, "calls {n_calls}");
    assert!(n_matrix >= 30, "matrix {n_matrix}");
}

#[test]
fn s9_empty_civ_key_and_unknown_owner_are_neutral() {
    // Web `key ? ... : undefined`: pusty klucz = brak nadpisan (mnozniki neutralne), jak brak wpisu.
    let matrix = load_civ_matrix().file.clone();
    let mk = || {
        (
            vec![ManpowerCity {
                manpower: Some(100.0),
                ..ManpowerCity::new("c", 0, 10.0)
            }],
            vec![ManpowerHealUnit {
                id: "u".into(),
                owner_id: 0,
                type_id: "Legionista".into(),
                category: "piechota".into(),
                hp: Some(10.0),
                hp_max: None,
                parametry_bonus_proc: None,
                battles_survived: None,
                q: Some(5),
                r: Some(5),
                in_garnizon: None,
            }],
        )
    };
    let run = |civ: Option<&str>| {
        let (mut c, mut u) = mk();
        let m: BTreeMap<i64, String> = civ.map(|k| (0, k.to_string())).into_iter().collect();
        let max_hp = |_: &str| 100.0;
        advance_manpower_heal(
            &mut c,
            &mut u,
            AdvanceManpowerHealInput {
                difficulty: ManpowerDifficulty::Normal,
                player_era: 1.0,
                owner_era: None,
                matrix: &matrix,
                owner_civ_by_owner_id: &m,
                get_max_hp: &max_hp,
                on_unit_hp_changed: None,
            },
        );
        (c[0].manpower, u[0].hp)
    };
    assert_eq!(run(Some("")), run(None));
}
