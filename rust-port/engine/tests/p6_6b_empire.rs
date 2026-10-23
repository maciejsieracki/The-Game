//! P6.6B - `game/empire-city-defaults.ts` (554 linie): wektory z URUCHOMIONEGO weba (pin edb8fb56).
//! Wejscie i wynik kazdego przypadku to pelna lista miast (kanoniczna postac `City`) oraz mapy
//! domyslnych wlascicieli (kolejnosc wstawiania `Map` zachowana), porownywane BITOWO.

#[path = "p6_6b_vectors/common.rs"]
mod common;

use civ_engine::domain::terrain::city_founding::p6_6b::cities::{
    BudowaFocus, BudowaTryb, City, OkolicaFocus,
};
use civ_engine::domain::terrain::city_founding::p6_6b::empire_city_defaults::{
    ai_default_budowa_tryb, apply_podzial_pracy_local_change,
    broadcast_auto_wyzywienie_to_owner_cities, broadcast_budowa_profil_to_owner_cities,
    broadcast_okolica_focus_to_owner_cities, broadcast_poziom_racji_to_owner_cities,
    budowa_profil_equal, fresh_owner_default_budowa_profil,
    fresh_owner_default_budowa_profil_for_owner, fresh_owner_default_okolica_focus,
    fresh_owner_default_podzial_pracy, fresh_owner_default_poziom_racji,
    migrate_budowa_profil_on_load, migrate_okolica_focus_on_load, migrate_podzial_pracy_on_load,
    migrate_poziom_racji_on_load, podzial_pracy_equal, resolve_city_budowa_profil,
    resolve_city_okolica_focus, resolve_city_podzial_pracy, resolve_city_poziom_racji,
    upgrade_budowa_profil_auto_defaults_on_load, CityBudowaProfil, OwnerMap,
};
use common::*;
use serde_json::{json, Value};

fn data() -> Value {
    load("empire.json")
}

fn cities_in(v: &Value) -> Vec<City> {
    v.as_array()
        .expect("cities")
        .iter()
        .map(city_from)
        .collect()
}

fn cities_value(cities: &[City]) -> Value {
    Value::Array(cities.iter().map(city_value).collect())
}

fn profil(v: &Value) -> CityBudowaProfil {
    CityBudowaProfil {
        budowa_focus: BudowaFocus::from_web(v["budowaFocus"].as_str().expect("focus"))
            .expect("focus"),
        budowa_tryb: BudowaTryb::from_web(v["budowaTryb"].as_str().expect("tryb")).expect("tryb"),
    }
}

fn profil_value(p: &CityBudowaProfil) -> Value {
    json!({ "budowaFocus": p.budowa_focus.web_value(), "budowaTryb": p.budowa_tryb.web_value() })
}

fn okolica(v: &Value) -> OkolicaFocus {
    OkolicaFocus::from_web(v.as_str().expect("okolica")).expect("okolica")
}

/// `[[ownerId, wartosc], ...]` -> `OwnerMap` w kolejnosci wstawiania.
fn owner_map<V>(v: &Value, f: impl Fn(&Value) -> V) -> OwnerMap<V> {
    let mut m = OwnerMap::new();
    for pair in v.as_array().expect("mapa") {
        m.set(pair[0].as_i64().expect("owner"), f(&pair[1]));
    }
    m
}

fn saved<V>(v: &Value, f: impl Fn(&Value) -> V) -> Option<Vec<(i64, V)>> {
    (!v.is_null()).then(|| {
        v.as_array()
            .expect("saved")
            .iter()
            .map(|p| (p[0].as_i64().expect("owner"), f(&p[1])))
            .collect()
    })
}

fn map_value<V>(m: &OwnerMap<V>, f: impl Fn(&V) -> Value) -> Value {
    Value::Array(m.entries().iter().map(|(k, v)| json!([k, f(v)])).collect())
}

fn check_migration<V: Clone>(
    label: &str,
    rows: &[Value],
    parse: impl Fn(&Value) -> V,
    render: impl Fn(&V) -> Value,
    run: impl Fn(&mut [City], &mut OwnerMap<V>, Option<&[(i64, V)]>),
) {
    assert!(rows.len() >= 100, "{label}: {}", rows.len());
    let mut with_saved = 0;
    for (i, row) in rows.iter().enumerate() {
        let mut cities = cities_in(&row["cities"]);
        let mut defaults = owner_map(&row["ownerDefaults"], &parse);
        let sv = saved(&row["saved"], &parse);
        run(&mut cities, &mut defaults, sv.as_deref());
        assert_values(
            &format!("{label}[{i}].cities"),
            &cities_value(&cities),
            &row["citiesOut"],
        );
        assert_values(
            &format!("{label}[{i}].ownerDefaults"),
            &map_value(&defaults, &render),
            &row["ownerDefaultsOut"],
        );
        if sv.as_ref().is_some_and(|s| !s.is_empty()) {
            with_saved += 1;
        }
    }
    assert!(
        with_saved >= 20,
        "{label}: gałąź savedDefaults ({with_saved})"
    );
}

#[test]
fn podzial_pracy_functions_match_web() {
    let d = data();
    let p = &d["podzial"];
    assert_values(
        "fresh",
        &podzial_value(&fresh_owner_default_podzial_pracy()),
        &p["fresh"],
    );
    for (i, row) in arr(p, "equal").iter().enumerate() {
        assert_eq!(
            podzial_pracy_equal(&podzial(&row["a"]), &podzial(&row["b"])),
            row["out"].as_bool().expect("out"),
            "equal[{i}]"
        );
    }
    let rows = arr(p, "resolve");
    assert!(rows.len() >= 300);
    for (i, row) in rows.iter().enumerate() {
        let c = &row["city"];
        let city = City {
            owner_id: c["ownerId"].as_i64().expect("owner"),
            podzial_pracy: c.get("podzialPracy").map(podzial),
            podzial_pracy_override: opt_bool(&c["podzialPracyOverride"]),
            ..City::default()
        };
        let od = (!row["ownerDefault"].is_null()).then(|| podzial(&row["ownerDefault"]));
        let fb = (!row["fallback"].is_null()).then(|| podzial(&row["fallback"]));
        let got = resolve_city_podzial_pracy(&city, od.as_ref(), fb.as_ref());
        assert_values(&format!("resolve[{i}]"), &podzial_value(&got), &row["out"]);
    }
    let rows = arr(p, "local");
    assert!(rows.len() >= 150);
    for (i, row) in rows.iter().enumerate() {
        let od = (!row["ownerDefault"].is_null()).then(|| podzial(&row["ownerDefault"]));
        let got = apply_podzial_pracy_local_change(js_num(&row["raw"]), od.as_ref());
        let want = &row["out"];
        assert_eq!(
            got.podzial_pracy_override,
            want["podzialPracyOverride"].as_bool().expect("o"),
            "local[{i}] override"
        );
        match (&got.podzial_pracy, want.get("podzialPracy")) {
            (None, None) => {}
            (Some(g), Some(w)) => {
                assert_values(&format!("local[{i}]"), &podzial_value(g), w);
            }
            other => panic!("local[{i}]: {other:?}"),
        }
    }
}

#[test]
fn podzial_pracy_migration_matches_web() {
    let d = data();
    check_migration(
        "migratePodzial",
        arr(&d["podzial"], "migrate"),
        podzial,
        podzial_value,
        migrate_podzial_pracy_on_load,
    );
}

#[test]
fn okolica_focus_functions_match_web() {
    let d = data();
    let o = &d["okolica"];
    assert_eq!(
        fresh_owner_default_okolica_focus().web_value(),
        text(&o["fresh"])
    );
    let rows = arr(o, "resolve");
    assert!(rows.len() >= 250);
    for (i, row) in rows.iter().enumerate() {
        let c = &row["city"];
        let city = City {
            okolica_focus: opt_text(&c["okolicaFocus"]).map(|s| okolica(&json!(s))),
            okolica_focus_override: opt_bool(&c["okolicaFocusOverride"]),
            ..City::default()
        };
        let od = opt_text(&row["ownerDefault"]).map(|s| okolica(&json!(s)));
        assert_eq!(
            resolve_city_okolica_focus(&city, od).web_value(),
            text(&row["out"]),
            "resolve[{i}]"
        );
    }
    let rows = arr(o, "broadcast");
    assert!(rows.len() >= 150);
    for (i, row) in rows.iter().enumerate() {
        let mut cities = cities_in(&row["cities"]);
        broadcast_okolica_focus_to_owner_cities(
            &mut cities,
            row["ownerId"].as_i64().expect("owner"),
            okolica(&row["focus"]),
        );
        assert_values(
            &format!("broadcast[{i}]"),
            &cities_value(&cities),
            &row["out"],
        );
    }
    check_migration(
        "migrateOkolica",
        arr(o, "migrate"),
        okolica,
        |f| json!(f.web_value()),
        migrate_okolica_focus_on_load,
    );
}

#[test]
fn budowa_profil_functions_match_web() {
    let d = data();
    let b = &d["budowa"];
    assert_values(
        "fresh",
        &profil_value(&fresh_owner_default_budowa_profil()),
        &b["fresh"],
    );
    assert_eq!(ai_default_budowa_tryb().web_value(), text(&b["aiTryb"]));
    for (i, row) in arr(b, "equal").iter().enumerate() {
        assert_eq!(
            budowa_profil_equal(&profil(&row["a"]), &profil(&row["b"])),
            row["out"].as_bool().expect("out"),
            "equal[{i}]"
        );
    }
    let rows = arr(b, "resolve");
    assert!(rows.len() >= 300);
    for (i, row) in rows.iter().enumerate() {
        let c = &row["city"];
        let city = City {
            budowa_focus: opt_text(&c["budowaFocus"])
                .map(|s| BudowaFocus::from_web(&s).expect("f")),
            budowa_tryb: opt_text(&c["budowaTryb"]).map(|s| BudowaTryb::from_web(&s).expect("t")),
            budowa_focus_override: opt_bool(&c["budowaFocusOverride"]),
            ..City::default()
        };
        let od = (!row["ownerDefault"].is_null()).then(|| profil(&row["ownerDefault"]));
        let got = resolve_city_budowa_profil(&city, od.as_ref());
        assert_values(&format!("resolve[{i}]"), &profil_value(&got), &row["out"]);
    }
    let rows = arr(b, "broadcast");
    assert!(rows.len() >= 150);
    for (i, row) in rows.iter().enumerate() {
        let mut cities = cities_in(&row["cities"]);
        broadcast_budowa_profil_to_owner_cities(
            &mut cities,
            row["ownerId"].as_i64().expect("owner"),
            &profil(&row["profil"]),
        );
        assert_values(
            &format!("broadcast[{i}]"),
            &cities_value(&cities),
            &row["out"],
        );
    }
    check_migration(
        "migrateBudowa",
        arr(b, "migrate"),
        profil,
        profil_value,
        migrate_budowa_profil_on_load,
    );
    let rows = arr(b, "forOwner");
    assert!(rows.len() >= 30);
    for (i, row) in rows.iter().enumerate() {
        let barb = ids(&row["barb"]);
        let got = fresh_owner_default_budowa_profil_for_owner(
            row["ownerId"].as_i64().expect("owner"),
            &|id| barb.contains(&id),
        );
        assert_values(&format!("forOwner[{i}]"), &profil_value(&got), &row["out"]);
    }
}

#[test]
fn upgrade_budowa_profil_auto_defaults_matches_web() {
    let d = data();
    let rows = arr(&d["budowa"], "upgrade");
    assert!(rows.len() >= 150);
    let mut upgraded_total = 0;
    let mut skipped_player = 0;
    for (i, row) in rows.iter().enumerate() {
        let mut cities = cities_in(&row["cities"]);
        let mut defaults = owner_map(&row["ownerDefaults"], profil);
        let barb = ids(&row["barb"]);
        if defaults.has(0) {
            skipped_player += 1;
        }
        let upgraded =
            upgrade_budowa_profil_auto_defaults_on_load(&mut cities, &mut defaults, &|id| {
                barb.contains(&id)
            });
        assert_eq!(upgraded, ids(&row["upgraded"]), "upgrade[{i}].upgraded");
        assert_values(
            &format!("upgrade[{i}].cities"),
            &cities_value(&cities),
            &row["citiesOut"],
        );
        assert_values(
            &format!("upgrade[{i}].ownerDefaults"),
            &map_value(&defaults, profil_value),
            &row["ownerDefaultsOut"],
        );
        upgraded_total += upgraded.len();
        assert!(!upgraded.contains(&0), "gracz (0) nie moze byc podniesiony");
    }
    assert!(upgraded_total >= 100, "upgraded: {upgraded_total}");
    assert!(
        skipped_player >= 30,
        "przypadki z graczem: {skipped_player}"
    );
}

#[test]
fn poziom_racji_functions_match_web() {
    let d = data();
    let r = &d["racji"];
    assert_bits(
        "fresh",
        fresh_owner_default_poziom_racji(),
        num(&r["fresh"]),
    );
    let rows = arr(r, "resolve");
    assert!(rows.len() >= 250);
    for (i, row) in rows.iter().enumerate() {
        let c = &row["city"];
        let city = City {
            poziom_racji: js_num(&c["poziomRacji"]),
            poziom_racji_override: opt_bool(&c["poziomRacjiOverride"]),
            ..City::default()
        };
        assert_bits(
            &format!("resolve[{i}]"),
            resolve_city_poziom_racji(&city, js_num(&row["ownerDefault"])),
            num(&row["out"]),
        );
    }
    let rows = arr(r, "broadcast");
    assert!(rows.len() >= 150);
    for (i, row) in rows.iter().enumerate() {
        let mut cities = cities_in(&row["cities"]);
        broadcast_poziom_racji_to_owner_cities(
            &mut cities,
            row["ownerId"].as_i64().expect("owner"),
            num(&row["poziom"]),
        );
        assert_values(
            &format!("broadcast[{i}]"),
            &cities_value(&cities),
            &row["out"],
        );
    }
    let rows = arr(r, "broadcastAuto");
    assert!(rows.len() >= 150);
    for (i, row) in rows.iter().enumerate() {
        let mut cities = cities_in(&row["cities"]);
        broadcast_auto_wyzywienie_to_owner_cities(
            &mut cities,
            row["ownerId"].as_i64().expect("owner"),
        );
        assert_values(&format!("auto[{i}]"), &cities_value(&cities), &row["out"]);
    }
    check_migration(
        "migrateRacji",
        arr(r, "migrate"),
        num,
        |x| enc(*x),
        migrate_poziom_racji_on_load,
    );
}
