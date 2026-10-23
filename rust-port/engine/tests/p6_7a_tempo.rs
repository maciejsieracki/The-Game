//! P6.7A - `population-growth-tempo.ts`, `growth-happiness.ts`, `r-stawki-strojenie.ts` oraz wejscia
//! Spichlerza / epoki magazynu. Wektory z URUCHOMIONEGO weba (pin edb8fb56), porownanie BITOWE f64;
//! oczekiwania wylacznie z `tests/p6_7a_vectors/tempo_stawki.json` i `params.json`.

#[path = "p6_7a_vectors/common.rs"]
mod common;

use civ_engine::domain::city_growth::p6_7a::happiness::compute_growth_happiness_netto;
use civ_engine::domain::city_growth::p6_7a::r_stawki::{
    is_research_era_fala2_extra, normalize_research_era, r_stawki_fala1_fala2_mult,
    r_stawki_fala2_mult, r_stawki_koszt_mult, scale_improvement_work_cost, scale_stock_cost_record,
    scaled_wonder_food_cost, scaled_wonder_work_cost,
};
use civ_engine::domain::city_growth::p6_7a::tempo::{
    apply_growth_threshold_pace, PaceArg, WzrostLudnosciPace,
};
use civ_engine::domain::city_growth::p6_7a::{
    city_has_spichlerz_building, magazyn_era_multiplier, spichlerz_growth_bonus_percent,
    spichlerz_ration_food_cost_multiplier,
};
use common::*;
use serde_json::Value;

fn data() -> Value {
    load("tempo_stawki.json")
}

#[test]
fn tempo_threshold_matches_web() {
    for (i, c) in arr(&data(), "tempo").iter().enumerate() {
        let pace = match c.get("pace") {
            Some(k) => PaceArg::Key(
                WzrostLudnosciPace::from_web(k.as_str().expect("klucz")).expect("tempo"),
            ),
            None => PaceArg::Multiplier(num(&c["mult"])),
        };
        let got = apply_growth_threshold_pace(num(&c["prog"]), pace);
        assert_bits(&format!("tempo[{i}]"), got, num(&c["out"]));
    }
}

#[test]
fn pace_table_matches_web() {
    let p = load("params.json");
    for pair in arr(&p, "WZROST_LUDNOSCI_PACE") {
        let k = WzrostLudnosciPace::from_web(pair[0].as_str().expect("klucz")).expect("tempo");
        assert_bits("pace", k.multiplier(), num(&pair[1]));
        assert_eq!(k.web_value(), pair[0].as_str().expect("klucz"));
    }
}

#[test]
fn happiness_matches_web() {
    for (i, c) in arr(&data(), "happiness").iter().enumerate() {
        let got = compute_growth_happiness_netto(
            num(&c["wealth"]),
            c["cer"].as_bool().expect("bool"),
            c["sp"].as_bool().expect("bool"),
        );
        // dwa ostatnie argumenty sa ignorowane (asercja negatywna weba): wynik nie zalezy od nich
        let flipped = compute_growth_happiness_netto(
            num(&c["wealth"]),
            !c["cer"].as_bool().expect("bool"),
            !c["sp"].as_bool().expect("bool"),
        );
        assert_bits(&format!("happiness[{i}]"), got, num(&c["out"]));
        assert_bits(&format!("happiness flipped[{i}]"), flipped, got);
    }
}

#[test]
fn stawki_constants_and_scalars_match_web() {
    let p = load("params.json");
    assert_bits("koszt", r_stawki_koszt_mult(), num(&p["R_STAWKI"]["koszt"]));
    assert_bits("fala2", r_stawki_fala2_mult(), num(&p["R_STAWKI"]["fala2"]));
    assert_bits(
        "fala1fala2",
        r_stawki_fala1_fala2_mult(),
        num(&p["R_STAWKI"]["fala1fala2"]),
    );
    for (i, c) in arr(&data()["stawki"], "scalar").iter().enumerate() {
        let b = num(&c["base"]);
        assert_bits(
            &format!("impr[{i}]"),
            scale_improvement_work_cost(b),
            num(&c["improvement"]),
        );
        assert_bits(
            &format!("wonder[{i}]"),
            scaled_wonder_work_cost(b),
            num(&c["wonderWork"]),
        );
        assert_bits(
            &format!("food[{i}]"),
            scaled_wonder_food_cost(b),
            num(&c["wonderFood"]),
        );
    }
}

#[test]
fn stock_cost_record_matches_web() {
    for (i, c) in arr(&data()["stawki"], "record").iter().enumerate() {
        let raw: Option<Vec<(String, Option<f64>)>> = c["raw"].as_array().map(|entries| {
            entries
                .iter()
                .map(|e| (text(&e[0]), js_num(&e[1])))
                .collect()
        });
        let got = scale_stock_cost_record(raw.as_deref());
        let want: Vec<(String, f64)> = c["out"]
            .as_array()
            .expect("out")
            .iter()
            .map(|e| (text(&e[0]), num(&e[1])))
            .collect();
        assert_eq!(got.len(), want.len(), "record[{i}] liczba kluczy");
        for ((gk, gv), (wk, wv)) in got.iter().zip(&want) {
            assert_eq!(gk, wk, "record[{i}] klucz");
            assert_bits(&format!("record[{i}].{gk}"), *gv, *wv);
        }
    }
}

#[test]
fn research_era_matches_web() {
    for (i, c) in arr(&data(), "era").iter().enumerate() {
        let raw: Option<&str> = c["raw"].as_str();
        assert_eq!(
            normalize_research_era(raw),
            text(&c["norm"]),
            "era[{i}] {:?}",
            c["raw"]
        );
        assert_eq!(
            is_research_era_fala2_extra(raw),
            c["fala2"].as_bool().expect("bool"),
            "fala2[{i}] {:?}",
            c["raw"]
        );
    }
}

#[test]
fn spichlerz_inputs_match_web() {
    let d = data();
    for c in arr(&d, "spichlerz") {
        let built = strings(&c["built"]);
        assert_eq!(
            city_has_spichlerz_building(&built),
            c["has"].as_bool().expect("bool"),
            "{built:?}"
        );
    }
    for (i, c) in arr(&d, "spichlerzStates").iter().enumerate() {
        let st = spichlerz_state(&c["state"]);
        assert_bits(
            &format!("growth[{i}]"),
            spichlerz_growth_bonus_percent(&st),
            num(&c["growth"]),
        );
        assert_bits(
            &format!("cost[{i}]"),
            spichlerz_ration_food_cost_multiplier(&st),
            num(&c["cost"]),
        );
    }
}

#[test]
fn magazyn_era_multiplier_matches_web() {
    let p = load("params.json");
    for c in arr(&p, "magazynEra") {
        assert_bits(
            "era",
            magazyn_era_multiplier(num(&c["era"])),
            num(&c["out"]),
        );
    }
}
