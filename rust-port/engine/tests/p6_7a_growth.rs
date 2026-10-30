//! P6.7A - `population-growth-v85.ts` (czyste funkcje) + wejscia `economy.ts` (limit ludnosci).
//! Wektory z URUCHOMIONEGO weba (pin edb8fb56), porownanie BITOWE f64; oczekiwania wylacznie z
//! `tests/p6_7a_vectors/growth.json` i `params.json`. Testy ksztaltu tabel (bez pinow wartosci) sa w
//! `p6_7a_tables.rs`.

#[path = "p6_7a_vectors/common.rs"]
mod common;

use civ_engine::data::civilizations::Num;
use civ_engine::data::derived::{cities_params, wzrost_ludnosci_params};
use civ_engine::domain::city_growth::p6_7a::empire_food::build_empire_food_params;
use civ_engine::domain::city_growth::p6_7a::growth_v85::{
    apply_fractional_growth_v85, apply_hunger_penalty_v85, build_ration_params,
    civ_matrix_growth_difficulty_multiplier, clamp_poziom_racji, compute_city_ration_cost,
    compute_growth_percent_v85, default_poziom_racji, ensure_city_ration_defaults,
    format_wyzwienie_label, get_city_ration_level, growth_gain_per_turn_slots,
    migrate_legacy_ration_level, migrate_procent_rozwoj_to_poziom_racji, ration_food_cost_per_pop,
    ration_growth_percent, resolve_population_matrix_for_civ, resolve_population_matrix_for_civ_in,
    turns_until_next_citizen, wyzywienie_levels, wyzywienie_max, wyzywienie_min, wyzywienie_step,
    GrowthCity, GrowthPercentInput,
};
use civ_engine::domain::city_growth::p6_7a::{
    city_population_cap, game_difficulty_from_web, resolve_population_cap_matrix_delta,
    resolve_population_cap_matrix_delta_in, GameDifficulty, PopCapParams,
};
use civ_engine::domain::civ_matrix::load_civ_matrix;
use civ_engine::domain::terrain::city_founding::p6_6b::cities::City;
use common::*;
use serde_json::{json, Value};

fn growth() -> Value {
    load("growth.json")
}

fn params() -> Value {
    load("params.json")
}

fn level_of(v: &Value, key: &str) -> Option<f64> {
    js_num(&v[key])
}

#[test]
fn constants_match_running_web() {
    let p = params();
    assert_bits("MIN", wyzywienie_min(), num(&p["WYZYWIENIE_MIN"]));
    assert_bits("MAX", wyzywienie_max(), num(&p["WYZYWIENIE_MAX"]));
    assert_bits("STEP", wyzywienie_step(), num(&p["WYZYWIENIE_STEP"]));
    assert_bits(
        "DEFAULT",
        default_poziom_racji(),
        num(&p["DEFAULT_POZIOM_RACJI"]),
    );
    let levels: Vec<f64> = arr(&p, "WYZYWIENIE_LEVELS").iter().map(num).collect();
    let got = wyzywienie_levels();
    assert_eq!(got.len(), levels.len(), "liczba poziomow");
    for (i, (g, w)) in got.iter().zip(&levels).enumerate() {
        assert_bits(&format!("level[{i}]"), *g, *w);
    }
    for pair in arr(&p, "WYZYWIENIE_GROWTH_PCT") {
        let (k, v) = (num(&pair[0]), num(&pair[1]));
        assert_bits(&format!("growth_pct[{k}]"), ration_growth_percent(k), v);
    }
    for pair in arr(&p, "CIV_MATRIX_GROWTH_DIFFICULTY_MULT") {
        let d = game_difficulty_from_web(pair[0].as_str().expect("klucz")).expect("trudnosc");
        assert_bits(
            "diff mult",
            civ_matrix_growth_difficulty_multiplier(Some(d)),
            num(&pair[1]),
        );
    }
}

#[test]
fn single_source_of_default_level_and_max() {
    // jedno zrodlo: modul czyta DEFAULT_POZIOM_RACJI i WYZYWIENIE_MAX z cities-params.json (P6.6B)
    let c = &cities_params().wejscia_z_innych_modulow_weba;
    assert_bits("default", default_poziom_racji(), c.domyslny_poziom_racji);
    assert_bits("max", wyzywienie_max(), c.wyzywienie_max);
    // nowa tabela NIE kopiuje tych dwoch pol
    let meta = serde_json::to_string(wzrost_ludnosci_params()).expect("json");
    assert!(!meta.contains("domyslny_poziom_racji"));
    assert!(!meta.contains("wyzywienie_max"));
}

#[test]
fn ration_helpers_match_web() {
    for (i, c) in arr(&growth(), "ration").iter().enumerate() {
        let x = num(&c["x"]);
        assert_bits(
            &format!("clamp[{i}] {x}"),
            clamp_poziom_racji(x),
            num(&c["clamp"]),
        );
        assert_bits(
            &format!("cost[{i}] {x}"),
            ration_food_cost_per_pop(x),
            num(&c["cost"]),
        );
        assert_bits(
            &format!("growthPct[{i}] {x}"),
            ration_growth_percent(x),
            num(&c["growthPct"]),
        );
        assert_eq!(
            format_wyzwienie_label(x),
            text(&c["label"]),
            "label[{i}] {x}"
        );
        assert_bits(
            &format!("legacy[{i}] {x}"),
            migrate_legacy_ration_level(x),
            num(&c["legacy"]),
        );
        assert_bits(
            &format!("procent[{i}] {x}"),
            migrate_procent_rozwoj_to_poziom_racji(Some(x)),
            num(&c["procent"]),
        );
    }
    assert_bits(
        "procent undefined",
        migrate_procent_rozwoj_to_poziom_racji(None),
        num(&growth()["procentUndefined"]),
    );
}

#[test]
fn city_ration_level_matches_web() {
    for (i, c) in arr(&growth(), "cityLevel").iter().enumerate() {
        let city = City {
            poziom_racji: level_of(&c["city"], "poziomRacji"),
            procent_rozwoj: level_of(&c["city"], "procentRozwoj"),
            ..City::default()
        };
        assert_bits(
            &format!("level[{i}]"),
            get_city_ration_level(&city),
            num(&c["out"]),
        );
    }
}

#[test]
fn ration_cost_matches_web() {
    for (i, c) in arr(&growth(), "cost").iter().enumerate() {
        let st = opt_spichlerz_state(&c["st"]);
        // Wektory P6.7A (pin edb8fb56) nie maja ownerEra: web domyslnie 1 (mnoznik 1x).
        let got = compute_city_ration_cost(num(&c["pop"]), num(&c["level"]), st.as_ref(), 1.0);
        assert_bits(&format!("cost[{i}]"), got, num(&c["out"]));
    }
}

#[test]
fn population_matrix_matches_web() {
    for (i, c) in arr(&growth(), "matrix").iter().enumerate() {
        let key: Option<&str> = c["civ"].as_str();
        let m = resolve_population_matrix_for_civ(key);
        assert_values(&format!("matrix[{i}]"), &matrix_value(&m), &c["out"]);
        assert_bits(
            &format!("capDelta[{i}]"),
            resolve_population_cap_matrix_delta(key),
            num(&c["capDelta"]),
        );
    }
}

/// Runda 2: macierz SYNTETYCZNA. W prawdziwym `civ-matrix.json` `lud_spadek_proc` i `lud_zdrowie_proc` sa
/// rowne 0 dla kazdej cywilizacji, wiec klamry `max(0, 1 + x)` byly nieosiagalne. Web uruchomiony na
/// `loadCivMatrix()` zmienionym w miejscu (patrz `gen-p67a-vectors.mjs`, sekcja (e)); tu ta sama zmiana
/// (`patch`) nakladana na kopie wbudowanej macierzy Rust.
#[test]
fn population_matrix_synthetic_matches_web() {
    fn to_num(v: &Value) -> Num {
        let x = num(v);
        if x.fract() == 0.0 && x.abs() < 9.0e15 {
            Num::Int(x as i64)
        } else {
            Num::Float(x)
        }
    }
    let edge = load("edge.json");
    let mut reached_negative = 0usize;
    for (i, case) in arr(&edge, "matrixSynth").iter().enumerate() {
        let mut matrix = load_civ_matrix().file.clone();
        for (k, v) in case["patch"]["defaults"].as_object().expect("defaults") {
            matrix.defaults.insert(k.clone(), to_num(v));
        }
        for pr in arr(&case["patch"], "rows") {
            let id = text(&pr["ikonaId"]);
            let row = matrix
                .cywilizacje
                .iter_mut()
                .find(|c| c.ikona_id == id)
                .expect("wiersz");
            for (k, v) in pr["params"].as_object().expect("params") {
                row.params.insert(k.clone(), to_num(v));
            }
        }
        for (j, c) in arr(case, "cases").iter().enumerate() {
            let key: Option<&str> = c["civ"].as_str();
            let m = resolve_population_matrix_for_civ_in(&matrix, key);
            assert_values(&format!("synth[{i}][{j}]"), &matrix_value(&m), &c["out"]);
            assert_bits(
                &format!("synthCap[{i}][{j}]"),
                resolve_population_cap_matrix_delta_in(&matrix, key),
                num(&c["capDelta"]),
            );
            if m.hunger_loss_multiplier == 0.0 || m.health_growth_multiplier == 0.0 {
                reached_negative += 1;
            }
        }
    }
    // test kontrolny wektorow: galaz klamry rzeczywiscie osiagnieta (inaczej wektor nic nie domyka)
    assert!(
        reached_negative > 0,
        "wektory nie osiagaja klamry max(0, ...)"
    );
}

#[test]
fn difficulty_multiplier_matches_web() {
    for c in arr(&growth(), "diffMult") {
        assert_bits(
            "mult",
            civ_matrix_growth_difficulty_multiplier(difficulty(&c["d"])),
            num(&c["out"]),
        );
    }
}

#[test]
fn population_cap_matches_web() {
    let p = params();
    for (i, c) in arr(&growth(), "popCap").iter().enumerate() {
        let d = game_difficulty_from_web(c["d"].as_str().expect("d")).expect("trudnosc");
        let from_data = PopCapParams::for_difficulty(d);
        let e = &p["popCapEcon"][c["d"].as_str().expect("d")];
        assert_bits(
            "ak prog",
            from_data.akwedukt_prog_ludnosci,
            num(&e["akweduktProgLudnosci"]),
        );
        assert_bits(
            "sp prog",
            from_data.spichlerz_prog_ludnosci,
            num(&e["spichlerzProgLudnosci"]),
        );
        assert_bits(
            "ak max",
            from_data.akwedukt_max_ludnosci,
            num(&e["akweduktMaxLudnosci"]),
        );
        let delta = if absent(&c["delta"]) {
            0.0
        } else {
            num(&c["delta"])
        };
        let got = city_population_cap(
            c["ak"].as_bool().expect("bool"),
            c["sp"].as_bool().expect("bool"),
            &from_data,
            delta,
        );
        assert_bits(&format!("cap[{i}]"), got, num(&c["out"]));
    }
    for (i, c) in arr(&growth(), "popCapCustom").iter().enumerate() {
        let pr = PopCapParams {
            akwedukt_prog_ludnosci: num(&c["params"]["akweduktProgLudnosci"]),
            spichlerz_prog_ludnosci: num(&c["params"]["spichlerzProgLudnosci"]),
            akwedukt_max_ludnosci: num(&c["params"]["akweduktMaxLudnosci"]),
        };
        let delta = if absent(&c["delta"]) {
            0.0
        } else {
            num(&c["delta"])
        };
        let got = city_population_cap(
            c["ak"].as_bool().expect("bool"),
            c["sp"].as_bool().expect("bool"),
            &pr,
            delta,
        );
        assert_bits(&format!("capCustom[{i}]"), got, num(&c["out"]));
    }
}

fn percent_input(v: &Value) -> GrowthPercentInput {
    GrowthPercentInput {
        population: num(&v["population"]),
        poziom_racji: num(&v["poziomRacji"]),
        zdrowie: num(&v["zdrowie"]),
        szczescie_netto: num(&v["szczescieNetto"]),
        wealth_poziom: num(&v["wealthPoziom"]),
        spichlerz_state: spichlerz_state(&v["spichlerzState"]),
        civ_key: opt_text(&v["civKey"]),
        difficulty: difficulty_or_none(&v["difficulty"]),
        ration_params: ration_params(&v["rationParams"]),
        citizen_resource_growth_pct: js_num(&v["citizenResourceGrowthPct"]),
        population_matrix: v.get("populationMatrix").map(matrix),
    }
}

fn difficulty_or_none(v: &Value) -> Option<GameDifficulty> {
    v.as_str()
        .map(|s| game_difficulty_from_web(s).expect("trudnosc"))
}

#[test]
fn growth_percent_matches_web() {
    for (i, c) in arr(&growth(), "percent").iter().enumerate() {
        let got = compute_growth_percent_v85(&percent_input(&c["in"]));
        assert_values(&format!("percent[{i}]"), &breakdown_value(&got), &c["out"]);
    }
}

#[test]
fn fractional_growth_matches_web() {
    for (i, c) in arr(&growth(), "fractional").iter().enumerate() {
        let econ = PopCapParams {
            akwedukt_prog_ludnosci: num(&c["econ"]["akweduktProgLudnosci"]),
            spichlerz_prog_ludnosci: num(&c["econ"]["spichlerzProgLudnosci"]),
            akwedukt_max_ludnosci: num(&c["econ"]["akweduktMaxLudnosci"]),
        };
        let delta = if absent(&c["delta"]) {
            0.0
        } else {
            num(&c["delta"])
        };
        let got = apply_fractional_growth_v85(
            num(&c["city"]["population"]),
            js_num(&c["city"]["wzrostUlamkowy"]),
            num(&c["growthPct"]),
            c["fed"].as_bool().expect("bool"),
            c["ak"].as_bool().expect("bool"),
            &econ,
            c["sp"].as_bool().expect("bool"),
            delta,
        );
        let want = &c["out"];
        assert_bits(
            &format!("pop[{i}]"),
            got.nowa_ludnosc,
            num(&want["nowaLudnosc"]),
        );
        assert_bits(
            &format!("frac[{i}]"),
            got.wzrost_ulamkowy,
            num(&want["wzrostUlamkowy"]),
        );
        assert_eq!(
            got.wzrost,
            want["wzrost"].as_bool().expect("bool"),
            "wzrost[{i}]"
        );
        assert_eq!(
            got.ubytek,
            want["ubytek"].as_bool().expect("bool"),
            "ubytek[{i}]"
        );
        // funkcja nie mutuje wejscia: `cityAfter` weba == `city`
        assert_values(&format!("cityAfter[{i}]"), &c["cityAfter"], &c["city"]);
    }
}

#[test]
fn gain_and_turns_match_web() {
    let g = growth();
    for (i, c) in arr(&g, "gain").iter().enumerate() {
        let got = growth_gain_per_turn_slots(
            num(&c["pop"]),
            num(&c["pct"]),
            c["fed"].as_bool().expect("bool"),
            c["cap"].as_bool().expect("bool"),
        );
        assert_bits(&format!("gain[{i}]"), got, num(&c["out"]));
    }
    for (i, c) in arr(&g, "turns").iter().enumerate() {
        let got = turns_until_next_citizen(Some(num(&c["frac"])), num(&c["gain"]));
        match (&c["out"], got) {
            (o, None) => assert!(o.get("isNull").is_some(), "turns[{i}] web={o} rust=null"),
            (o, Some(x)) => assert_bits(&format!("turns[{i}]"), x, num(o)),
        }
    }
    // `wzrostUlamkowy ?? 0` (null)
    let got = turns_until_next_citizen(None, 0.5);
    assert!(g["turnsNullFracOut"].get("isNull").is_none());
    assert_bits(
        "turns null frac",
        got.expect("liczba"),
        num(&g["turnsNullFracOut"]),
    );
}

#[test]
fn hunger_penalty_matches_web() {
    for (i, c) in arr(&growth(), "hunger").iter().enumerate() {
        let tury = if absent(&c["tury"]) {
            None
        } else {
            js_num(&c["tury"])
        };
        let mult = if absent(&c["mult"]) {
            1.0
        } else {
            num(&c["mult"])
        };
        let debt = if absent(&c["debt"]) {
            0.0
        } else {
            num(&c["debt"])
        };
        let got = apply_hunger_penalty_v85(
            num(&c["pop"]),
            c["fed"].as_bool().expect("bool"),
            tury,
            mult,
            debt,
        );
        let want = &c["out"];
        assert_bits(
            &format!("pop[{i}]"),
            got.nowa_ludnosc,
            num(&want["nowaLudnosc"]),
        );
        assert_bits(
            &format!("tury[{i}]"),
            got.tury_bez_doplaty,
            num(&want["turyBezDoplaty"]),
        );
        assert_eq!(
            got.ubytek,
            want["ubytek"].as_bool().expect("bool"),
            "ubytek[{i}]"
        );
        assert_bits(
            &format!("debt[{i}]"),
            got.hunger_loss_ulamkowy,
            num(&want["hungerLossUlamkowy"]),
        );
    }
}

#[test]
fn ensure_city_ration_defaults_matches_web() {
    for (i, c) in arr(&growth(), "ensure").iter().enumerate() {
        let mut gc: GrowthCity = growth_city(&c["city"]);
        ensure_city_ration_defaults(&mut gc);
        let got = json!({
            "poziomRacji": enc(gc.city.poziom_racji.expect("ustawione")),
            "rationMigratedV114": gc.city.ration_migrated_v114.expect("ustawione"),
            "wzrostUlamkowy": enc(gc.city.wzrost_ulamkowy.expect("ustawione")),
            "turyBezDoplaty": enc(gc.city.tury_bez_doplaty.expect("ustawione")),
            "hungerLossUlamkowy": enc(gc.hunger_loss_ulamkowy.expect("ustawione")),
        });
        let after = &c["after"];
        let want = json!({
            "poziomRacji": after["poziomRacji"],
            "rationMigratedV114": after["rationMigratedV114"],
            "wzrostUlamkowy": after["wzrostUlamkowy"],
            "turyBezDoplaty": after["turyBezDoplaty"],
            "hungerLossUlamkowy": after["hungerLossUlamkowy"],
        });
        assert_values(&format!("ensure[{i}]"), &got, &want);
    }
}

#[test]
fn build_params_match_web() {
    for (i, c) in arr(&growth(), "build").iter().enumerate() {
        let d = game_difficulty_from_web(c["d"].as_str().expect("d")).expect("trudnosc");
        let raw = decode_raw(&if c["raw"] == Value::String("econ".to_string()) {
            params()["econParamsRawForBuild"].clone()
        } else {
            c["raw"].clone()
        });
        let ration = build_ration_params(&raw, d);
        assert_values(
            &format!("ration[{i}]"),
            &ration_params_value(&ration),
            &c["ration"],
        );
        let food = build_empire_food_params(&raw, d);
        assert_values(
            &format!("food[{i}]"),
            &json!({
                "centralCapBaza": enc(food.central_cap_baza),
                "centralCapBonusMagazyn": enc(food.central_cap_bonus_magazyn),
                "glodWojskaHpFrac": enc(food.glod_wojska_hp_frac),
                "glodWojskaKarencjaTur": enc(food.glod_wojska_karencja_tur),
                "glodWojskaStatMult": enc(food.glod_wojska_stat_mult),
                "rationParams": ration_params_value(&food.ration_params),
            }),
            &c["food"],
        );
    }
    let raw = json!({});
    let d = GameDifficulty::default();
    assert_eq!(d, GameDifficulty::Normal);
    let g = growth();
    assert_values(
        "ration default",
        &ration_params_value(&build_ration_params(&raw, d)),
        &g["buildDefaultDifficulty"]["ration"],
    );
}
