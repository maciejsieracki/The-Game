//! P6.5B - `tickManpowerUnitReplenishment` (+ prywatne `allocateProportionalReplenishment`) z wektorami
//! z URUCHOMIONEGO weba (`tests/p6_5b_vectors/replenish.json`, pin edb8fb56). Wektory zapisuja tez
//! protokol domkniec: kolejnosc wywolan `resolveOwnerEra`, `resolveOwnerBonusy`, `getMaxHp`
//! (z `hp`/`hpMax` jednostki w chwili wywolania) i `onUnitHpChanged`.

#[path = "p6_5b_vectors/common.rs"]
mod common;

use std::cell::RefCell;
use std::collections::HashMap;

use civ_engine::domain::recruitment::manpower::{
    tick_manpower_unit_replenishment, CivBonusPoborLite, ManpowerDifficulty, ManpowerHealUnit,
};
use common::{
    assert_cities, assert_heal_units, assert_opt_same, assert_same, bonusy, cities, heal_units,
    list, load, num, opt_num, raw_miasto,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_5b_vectors/replenish.json");

fn root() -> Value {
    load(VECTORS)
}

fn difficulty(name: &str) -> ManpowerDifficulty {
    match name {
        "easy" => ManpowerDifficulty::Easy,
        "normal" => ManpowerDifficulty::Normal,
        "hard" => ManpowerDifficulty::Hard,
        other => panic!("trudnosc {other}"),
    }
}

/// `[[klucz, wartosc], ...]` -> mapa (klucz liczbowy).
fn pairs_by_owner(value: &Value) -> HashMap<i64, &Value> {
    list(value, "pary")
        .iter()
        .map(|pair| (pair[0].as_i64().expect("owner"), &pair[1]))
        .collect()
}

#[test]
fn replenishment_matches_web_state_results_and_closure_protocol() {
    let root = root();
    let (mut healed_any, mut partial, mut none, mut callbacks) = (0, 0, 0, 0);
    let (mut stale_hp_max, mut multi_owner) = (0, 0);
    for (n, case) in list(&root["cases"]["cases"], "cases").iter().enumerate() {
        let mut all_cities = cities(&case["cities"]);
        let mut units = heal_units(&case["units"]);
        let units_before = units.clone();
        let cities_before = all_cities.clone();
        let era = pairs_by_owner(&case["era"]);
        let bon = pairs_by_owner(&case["bonusy"]);
        let max_hp = pairs_by_owner_str(&case["maxHp"]);
        let era_calls = RefCell::new(Vec::<i64>::new());
        let bon_calls = RefCell::new(Vec::<i64>::new());
        let hp_calls = RefCell::new(Vec::<(String, String, Option<f64>, Option<f64>)>::new());
        let cb_calls = RefCell::new(Vec::<(String, f64, f64)>::new());
        let raw = case.get("raw").map(raw_miasto);

        let resolve_era = |owner: i64| {
            era_calls.borrow_mut().push(owner);
            num(era[&owner])
        };
        let resolve_bon = |owner: i64| -> Option<Vec<CivBonusPoborLite>> {
            bon_calls.borrow_mut().push(owner);
            bonusy(Some(bon[&owner]))
        };
        let get_max_hp = |type_id: &str, unit: &ManpowerHealUnit| {
            hp_calls
                .borrow_mut()
                .push((type_id.to_owned(), unit.id.clone(), unit.hp, unit.hp_max));
            num(max_hp[unit.id.as_str()])
        };
        let mut record = |id: &str, hp: f64, hp_max: f64| {
            cb_calls.borrow_mut().push((id.to_owned(), hp, hp_max));
        };
        let with_cb = case["withCb"].as_bool().expect("withCb");
        let got = tick_manpower_unit_replenishment(
            &mut all_cities,
            &mut units,
            difficulty(case["difficulty"].as_str().expect("difficulty")),
            &resolve_era,
            &resolve_bon,
            None,
            &get_max_hp,
            raw.as_ref(),
            if with_cb { Some(&mut record) } else { None },
        );

        let want = &case["out"];
        assert_eq!(
            got.healed_count as u64,
            want["result"]["healedCount"].as_u64().expect("healedCount"),
            "case {n}: healedCount"
        );
        assert_same(
            "totalMpSpent",
            got.total_mp_spent,
            num(&want["result"]["totalMpSpent"]),
        );
        assert_cities(
            &format!("case {n} miasta"),
            &all_cities,
            &cities(&want["cities"]),
        );
        assert_heal_units(
            &format!("case {n} jednostki"),
            &units,
            &heal_units(&want["units"]),
        );

        let want_era: Vec<i64> = list(&want["eraCalls"], "eraCalls")
            .iter()
            .map(|o| o.as_i64().expect("owner"))
            .collect();
        let want_bon: Vec<i64> = list(&want["bonCalls"], "bonCalls")
            .iter()
            .map(|o| o.as_i64().expect("owner"))
            .collect();
        assert_eq!(
            *era_calls.borrow(),
            want_era,
            "case {n}: wywolania resolveOwnerEra"
        );
        assert_eq!(
            *bon_calls.borrow(),
            want_bon,
            "case {n}: wywolania resolveOwnerBonusy"
        );

        let want_hp = list(&want["hpCalls"], "hpCalls");
        let got_hp = hp_calls.borrow();
        assert_eq!(
            got_hp.len(),
            want_hp.len(),
            "case {n}: liczba wywolan getMaxHp"
        );
        for (g, w) in got_hp.iter().zip(want_hp) {
            assert_eq!(g.0, w["typeId"].as_str().expect("typeId"), "case {n}");
            assert_eq!(g.1, w["id"].as_str().expect("id"), "case {n}");
            assert_opt_same("getMaxHp.hp", g.2, opt_num(w.get("hp")));
            assert_opt_same("getMaxHp.hpMax", g.3, opt_num(w.get("hpMax")));
        }

        let want_cb = list(&want["cbCalls"], "cbCalls");
        let got_cb = cb_calls.borrow();
        assert_eq!(
            got_cb.len(),
            want_cb.len(),
            "case {n}: liczba wywolan onUnitHpChanged"
        );
        for (g, w) in got_cb.iter().zip(want_cb) {
            assert_eq!(g.0, w[0].as_str().expect("id"), "case {n}");
            assert_same("cb.hp", g.1, num(&w[1]));
            assert_same("cb.hpMax", g.2, num(&w[2]));
        }

        // pokrycie: przypadki istotne dla algorytmu
        healed_any += usize::from(got.healed_count > 0);
        callbacks += got_cb.len();
        none += usize::from(got.healed_count == 0);
        let spent_all = cities_before
            .iter()
            .zip(&all_cities)
            .any(|(b, a)| b.manpower != a.manpower);
        partial += usize::from(spent_all && got.healed_count > 0);
        multi_owner += usize::from(want_era.len() > 1);
        stale_hp_max += usize::from(
            units_before
                .iter()
                .zip(&units)
                .any(|(b, a)| b.hp_max != a.hp_max),
        );
    }
    assert!(healed_any > 200, "zdrowienie w {healed_any} przypadkach");
    assert!(none > 50 && partial > 100 && multi_owner > 50);
    assert!(stale_hp_max > 100 && callbacks > 500);
}

fn pairs_by_owner_str(value: &Value) -> HashMap<&str, &Value> {
    list(value, "pary")
        .iter()
        .map(|pair| (pair[0].as_str().expect("id"), &pair[1]))
        .collect()
}
