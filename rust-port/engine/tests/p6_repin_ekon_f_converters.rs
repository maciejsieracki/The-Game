//! REPIN-EKONOMIA-F partia 2 (R-RUSTPORT-REPIN-EKONOMIA-F-FALA500-Q1): konwertery po FALI 500-517.
//! Web `origin/main` `16c0509f6`, `gra/src/game/converters.ts` (cegla x2, Cegielnia +50% WYJSCIA/epoke,
//! odlewnie 25->50 cykli x m(e)). Wektory z uruchomionego weba: `p6_turn_econ_res_vectors/pipeline.json`
//! (generator `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-F-FALA500-Q1/gen-ekonf-converters-vectors.mjs`);
//! tu: progi N-1/N/N+1, NaN/Inf, brak kluczy i brzegi sterujace (mutacje).

use std::collections::BTreeMap;

use civ_engine::domain::building_costs::p6_7b::StockRecord;
use civ_engine::domain::turn_economy_resources::{
    converter_output_multiplier_for_era, converter_throughput_for_era, run_converter,
    run_converter_with_output_multiplier, run_converters, ConverterReason, ConverterRecipe,
    CONVERTER_FOUNDRY_ERA_RECIPE_IDS, DEFAULT_CONVERTER_RECIPES,
};

fn recipe(id: &str) -> &'static ConverterRecipe {
    DEFAULT_CONVERTER_RECIPES
        .iter()
        .find(|r| r.id == id)
        .expect("receptura")
}

fn stock(pairs: &[(&str, f64)]) -> StockRecord {
    pairs.iter().map(|(k, v)| ((*k).to_owned(), *v)).collect()
}

#[test]
fn cegla_x2_recipe_and_flat_fallbacks() {
    assert_eq!(recipe("cegielnia").output_amount, 2.0);
    for r in DEFAULT_CONVERTER_RECIPES.iter() {
        assert_eq!(r.throughput_fallback, 50.0, "fallback {}", r.id);
    }
    // 2 glina + 1 drewno -> 2 cegly na cykl.
    let got = run_converter(
        recipe("cegielnia"),
        &stock(&[("glina", 10.0), ("drewno", 5.0)]),
        3.0,
        1000.0,
    );
    assert_eq!(got.cykle, 3.0);
    assert_eq!(got.produced, 6.0);
    assert_eq!(got.stores["cegla"], 6.0);
    assert_eq!(got.stores["glina"], 4.0);
    assert_eq!(got.stores["drewno"], 2.0);
}

#[test]
fn output_multiplier_thresholds_n_minus_1_n_n_plus_1() {
    let f = |e: f64| converter_output_multiplier_for_era("cegielnia", e);
    // era <= 1 / NaN / +-Inf / ujemne -> 1
    for e in [
        f64::NAN,
        f64::INFINITY,
        f64::NEG_INFINITY,
        -3.0,
        0.0,
        0.999,
        1.0,
    ] {
        assert_eq!(f(e), 1.0, "era {e}");
    }
    assert_eq!(f(1.001), 1.0); // floor(1.001) = 1
    assert_eq!(f(1.999), 1.0);
    assert_eq!(f(2.0), 1.5);
    assert_eq!(f(2.001), 1.5);
    assert_eq!(f(2.999), 1.5);
    assert_eq!(f(3.0), 2.0);
    assert_eq!(f(4.0), 2.5);
    assert_eq!(f(5.0), 3.0);
    // receptury bez skalowania wyjscia -> 1 niezaleznie od epoki
    for id in ["garncarnia", "huta", "odlewnia_brazu", "nieznany", ""] {
        assert_eq!(converter_output_multiplier_for_era(id, 5.0), 1.0, "{id}");
    }
}

#[test]
fn foundry_throughput_is_era_multiplied_and_others_flat() {
    for id in CONVERTER_FOUNDRY_ERA_RECIPE_IDS {
        assert_eq!(converter_throughput_for_era(id, 50.0, 1.0), 50.0);
        assert_eq!(converter_throughput_for_era(id, 50.0, 1.999), 50.0);
        assert_eq!(converter_throughput_for_era(id, 50.0, 2.0), 75.0);
        assert_eq!(converter_throughput_for_era(id, 50.0, 3.0), 100.0);
        assert_eq!(converter_throughput_for_era(id, 50.0, 5.0), 150.0);
        assert_eq!(converter_throughput_for_era(id, 50.0, f64::NAN), 50.0);
        assert_eq!(converter_throughput_for_era(id, 50.0, f64::INFINITY), 50.0);
        assert_eq!(converter_throughput_for_era(id, 50.0, -1.0), 50.0);
    }
    // huta i cegielnia: cykle plaskie
    for id in ["huta", "cegielnia"] {
        assert_eq!(converter_throughput_for_era(id, 50.0, 5.0), 50.0, "{id}");
    }
    // garncarnia: +10% bazy/epoke addytywnie (bez zmian vs pin)
    assert_eq!(converter_throughput_for_era("garncarnia", 50.0, 1.0), 50.0);
    let g3 = converter_throughput_for_era("garncarnia", 50.0, 3.0);
    assert!((g3 - 60.0).abs() < 1e-9, "garncarnia era 3 = {g3}");
}

#[test]
fn run_converter_output_multiplier_affects_limit_stores_and_produced() {
    let r = recipe("cegielnia");
    let s = stock(&[("glina", 100.0), ("drewno", 100.0), ("cegla", 90.0)]);
    // pojemnosc 100, wolne 10; outPerCykl = 2*1.5 = 3 -> limit wyjscia floor(10/3) = 3
    let got = run_converter_with_output_multiplier(r, &s, 50.0, 100.0, 1.5);
    assert_eq!(got.cykle, 3.0);
    assert_eq!(got.produced, 9.0);
    assert_eq!(got.stores["cegla"], 99.0);
    // N-1/N/N+1 pojemnosci: wolne = 5 -> floor(5/3) = 1; wolne = 6 -> 2; wolne = 7 -> 2
    for (cap, want) in [(95.0, 1.0), (96.0, 2.0), (97.0, 2.0)] {
        let g = run_converter_with_output_multiplier(r, &s, 50.0, cap, 1.5);
        assert_eq!(g.cykle, want, "cap {cap}");
    }
    // pelny magazyn gdy wolne < outPerCykl
    let full = run_converter_with_output_multiplier(r, &s, 50.0, 92.0, 1.5);
    assert_eq!(full.cykle, 0.0);
    assert_eq!(full.reason, ConverterReason::PelnyMagazyn);
    // zly mnoznik (NaN, 0, ujemny, Inf) -> 1
    for bad in [f64::NAN, 0.0, -2.0, f64::INFINITY, f64::NEG_INFINITY] {
        let a = run_converter_with_output_multiplier(r, &s, 50.0, 100.0, bad);
        let b = run_converter(r, &s, 50.0, 100.0);
        assert_eq!(a, b, "mnoznik {bad}");
    }
    // zuzycie wejsc NIE zalezy od mnoznika wyjscia
    let a = run_converter_with_output_multiplier(r, &s, 2.0, 1000.0, 3.0);
    assert_eq!(a.consumed["glina"], 4.0);
    assert_eq!(a.consumed["drewno"], 2.0);
    assert_eq!(a.produced, 12.0);
}

#[test]
fn run_converters_reads_out_mult_key_and_defaults_to_one() {
    let recipes = [*recipe("cegielnia")];
    let s = stock(&[("glina", 100.0), ("drewno", 100.0)]);
    let mut t: BTreeMap<String, f64> = BTreeMap::new();
    t.insert("cegielnia".to_owned(), 4.0);
    // brak klucza '#outMult' -> 1 : 4 cykle * 2 = 8
    let base = run_converters(&recipes, &s, &t, &|_| 1000.0);
    assert_eq!(base["cegla"], 8.0);
    // z kluczem 2.0 -> 16
    t.insert("cegielnia#outMult".to_owned(), 2.0);
    let scaled = run_converters(&recipes, &s, &t, &|_| 1000.0);
    assert_eq!(scaled["cegla"], 16.0);
    // przepustowosc bez wpisu -> fallback 50, mnoznik nadal czytany
    let mut only_mult: BTreeMap<String, f64> = BTreeMap::new();
    only_mult.insert("cegielnia#outMult".to_owned(), 1.5);
    let s2 = stock(&[("glina", 1000.0), ("drewno", 1000.0)]);
    let r = run_converters(&recipes, &s2, &only_mult, &|_| 1000.0);
    assert_eq!(r["cegla"], 150.0); // 50 cykli * 2 * 1.5
}
