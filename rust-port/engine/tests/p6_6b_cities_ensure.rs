//! P6.6B - `game/cities.ts`: `ensureCityPodzialDefaults` i `ensureCitySaveDefaults`. Wektory z URUCHOMIONEGO
//! weba (pin edb8fb56). Zaleznosci poza plikami tej czesci (`readCityFoodBuffer`, `ensureCityRationDefaults`)
//! sa wstrzykiwane: ich wyniki pochodza z PRAWDZIWEGO kodu weba (zapisane w wektorze), a test sprawdza
//! liczbe, kolejnosc i argumenty wywolan.

#[path = "p6_6b_vectors/common.rs"]
mod common;

use std::cell::Cell;

use civ_engine::domain::terrain::city_founding::p6_6b::cities::{
    ensure_city_podzial_defaults, ensure_city_save_defaults, FoodBuffer, SaveDefaultsDeps,
};
use common::*;
use serde_json::Value;

#[test]
fn ensure_city_podzial_defaults_matches_web() {
    let d = load("cities.json");
    let rows = arr(&d, "podzial");
    assert!(rows.len() >= 300);
    let mut handel_override = 0;
    for (i, row) in rows.iter().enumerate() {
        let mut city = city_from(&row["city"]);
        let food = city.magazyn_zywnosci;
        if city.podzial_handlu_override == Some(true) {
            handel_override += 1;
        }
        ensure_city_podzial_defaults(&mut city);
        assert!(
            food_eq(food, city.magazyn_zywnosci),
            "podzial[{i}]: magazyn dotkniety"
        );
        assert_values(
            &format!("podzial[{i}]"),
            &without_food(city_value(&city)),
            &without_food(row["out"].clone()),
        );
    }
    assert!(
        handel_override >= 50,
        "wektor musi pokrywac override Handlu"
    );
}

#[test]
fn ensure_city_save_defaults_matches_web() {
    let d = load("cities.json");
    let rows = arr(&d, "save");
    assert!(rows.len() >= 700, "{}", rows.len());
    let mut migrated_auto = 0;
    let mut upgraded_override = 0;
    let mut food_kinds = std::collections::BTreeSet::new();
    for (i, row) in rows.iter().enumerate() {
        let mut city = city_from(&row["city"]);
        if city.budowa_tryb.map(|t| t.web_value()) == Some("auto") {
            migrated_auto += 1;
        }
        if city.ulepszenia_override == Some(true) {
            upgraded_override += 1;
        }
        let input_food = city.magazyn_zywnosci;
        food_kinds.insert(match input_food {
            None => "brak",
            Some(FoodBuffer::Number(_)) => "liczba",
            Some(FoodBuffer::Legacy { .. }) => "obiekt",
            Some(FoodBuffer::Other) => "inne",
        });
        let want_buf = num(&row["foodBuf"]);
        let buf_calls = Cell::new(0_u32);
        let ration_calls = Cell::new(0_u32);
        let ration = &row["ration"];
        {
            let read = |arg: Option<&FoodBuffer>| -> f64 {
                buf_calls.set(buf_calls.get() + 1);
                assert!(
                    food_eq(arg.copied(), input_food),
                    "save[{i}]: argument readCityFoodBuffer"
                );
                assert_eq!(
                    ration_calls.get(),
                    0,
                    "save[{i}]: readCityFoodBuffer przed ration"
                );
                want_buf
            };
            let mut ensure_ration =
                |c: &mut civ_engine::domain::terrain::city_founding::p6_6b::cities::City| {
                    ration_calls.set(ration_calls.get() + 1);
                    // magazyn jest juz znormalizowany PRZED wywolaniem ration (kolejnosc jak w webie)
                    assert!(
                        matches!(c.magazyn_zywnosci, Some(FoodBuffer::Number(_))),
                        "save[{i}]: ration wolane przed normalizacja magazynu"
                    );
                    c.poziom_racji = js_num(&ration["poziomRacji"]);
                    c.ration_migrated_v114 = opt_bool(&ration["rationMigratedV114"]);
                    c.wzrost_ulamkowy = js_num(&ration["wzrostUlamkowy"]);
                    c.tury_bez_doplaty = js_num(&ration["turyBezDoplaty"]);
                };
            let mut deps = SaveDefaultsDeps {
                read_city_food_buffer: &read,
                ensure_city_ration_defaults: &mut ensure_ration,
            };
            ensure_city_save_defaults(&mut city, &mut deps);
        }
        assert_eq!(buf_calls.get(), 1, "save[{i}]: readCityFoodBuffer raz");
        assert_eq!(
            ration_calls.get(),
            1,
            "save[{i}]: ensureCityRationDefaults raz"
        );
        assert_values(&format!("save[{i}]"), &city_value(&city), &row["out"]);
    }
    assert!(migrated_auto >= 80, "legacy 'auto': {migrated_auto}");
    assert!(
        upgraded_override >= 300,
        "override ulepszen: {upgraded_override}"
    );
    assert_eq!(
        food_kinds.len(),
        4,
        "wszystkie rodzaje magazynu: {food_kinds:?}"
    );
}

#[test]
fn ensure_city_save_defaults_is_idempotent_on_web_outputs() {
    // wynik weba przepuszczony drugi raz przez port (z ta sama zaleznoscia ration) nie zmienia sie:
    // port nie dopisuje pol, ktorych web nie dopisuje (kazdy wektor `out` jest punktem stalym).
    let d = load("cities.json");
    let rows = arr(&d, "save");
    for (i, row) in rows.iter().enumerate().take(200) {
        let mut city = city_from(&row["out"]);
        let before = city_value(&city);
        let read = |arg: Option<&FoodBuffer>| match arg {
            Some(FoodBuffer::Number(x)) => x.max(0.0),
            other => panic!("save[{i}]: magazyn po ensure to liczba, jest {other:?}"),
        };
        let out: &Value = &row["out"];
        let mut ensure_ration =
            |c: &mut civ_engine::domain::terrain::city_founding::p6_6b::cities::City| {
                c.poziom_racji = js_num(&out["poziomRacji"]);
                c.ration_migrated_v114 = opt_bool(&out["rationMigratedV114"]);
                c.wzrost_ulamkowy = js_num(&out["wzrostUlamkowy"]);
                c.tury_bez_doplaty = js_num(&out["turyBezDoplaty"]);
            };
        let mut deps = SaveDefaultsDeps {
            read_city_food_buffer: &read,
            ensure_city_ration_defaults: &mut ensure_ration,
        };
        ensure_city_save_defaults(&mut city, &mut deps);
        assert_values(&format!("idempotent[{i}]"), &city_value(&city), &before);
    }
}
