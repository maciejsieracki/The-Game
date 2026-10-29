//! P6.M05B - tabela balansu `data/derived/mapgen-relief-b.json` i parametry pasm gorskich
//! (`mapGenMountainRangeParams`, map-gen-params-loader.ts:167) z wektorami weba: wariant
//! prawdziwego JSON oraz 5 wariantow uszkodzonego JSON (brak wiersza/sekcji, zakresy, typy).

#[path = "p6_m05b_vectors/common.rs"]
mod common;

use civ_engine::data::derived::{mapgen_relief_b, MAPGEN_RELIEF_B_JSON};
use civ_engine::domain::mapgen::params::DensityTier;
use civ_engine::domain::mapgen::relief::{
    map_gen_mountain_range_params, resolve_mountain_range_params, MountainRangeTierParams,
};
use common::{cases, fv, tier_from};
use serde_json::Value;

fn tier_of(c: &Value) -> DensityTier {
    tier_from(c["tier"].as_str().expect("tier"))
}

fn assert_params(p: MountainRangeTierParams, out: &Value, what: &str) {
    common::assert_f64(
        p.hexy_na_pasmo,
        fv(&out["hexyNaPasmo"]),
        &format!("{what}: hexyNaPasmo"),
    );
    common::assert_f64(
        p.max_pasm_na_mase,
        fv(&out["maxPasmNaMase"]),
        &format!("{what}: maxPasmNaMase"),
    );
    common::assert_f64(
        p.dlugosc_min,
        fv(&out["dlugoscMin"]),
        &format!("{what}: dlugoscMin"),
    );
    common::assert_f64(
        p.dlugosc_max,
        fv(&out["dlugoscMax"]),
        &format!("{what}: dlugoscMax"),
    );
    common::assert_f64(
        p.min_masa_hexow,
        fv(&out["minMasaHexow"]),
        &format!("{what}: minMasaHexow"),
    );
    common::assert_f64(
        p.obrzeze_szansa,
        fv(&out["obrzezeSzansa"]),
        &format!("{what}: obrzezeSzansa"),
    );
}

#[test]
fn real_json_mountain_range_params_match_web() {
    for c in cases("params").iter().filter(|c| c["variant"] == "real") {
        let id = c["id"].as_str().unwrap_or("?");
        let tier = tier_of(c);
        assert_params(map_gen_mountain_range_params(tier), &c["out"], id);
    }
}

#[test]
fn damaged_json_variants_match_web_fallbacks() {
    let mut variants = std::collections::BTreeSet::new();
    for c in cases("params").iter().filter(|c| c["variant"] != "real") {
        let id = c["id"].as_str().unwrap_or("?");
        let tier = tier_of(c);
        let row = if c["row"].is_null() {
            None
        } else {
            Some(&c["row"])
        };
        assert_params(resolve_mountain_range_params(tier, row), &c["out"], id);
        variants.insert(c["variant"].as_str().unwrap_or("?").to_string());
    }
    assert_eq!(
        variants.len(),
        6,
        "warianty uszkodzonego JSON: {variants:?}"
    );
}

#[test]
fn relief_b_table_has_web_source_for_every_leaf() {
    fn walk(v: &Value, path: &str, leaves: &mut usize) {
        match v {
            Value::Object(m) if m.contains_key("wartosc") => {
                *leaves += 1;
                let src = m["zrodlo_web"]
                    .as_str()
                    .unwrap_or_else(|| panic!("{path}: brak zrodlo_web"));
                assert!(
                    src.starts_with("gra/"),
                    "{path}: zrodlo_web musi wskazywac gra/: {src}"
                );
                assert!(m["wartosc"].is_number(), "{path}: wartosc musi byc liczba");
            }
            Value::Object(m) => {
                for (k, child) in m {
                    if k == "meta" {
                        continue;
                    }
                    walk(child, &format!("{path}/{k}"), leaves);
                }
            }
            _ => {}
        }
    }
    let root: Value = serde_json::from_str(MAPGEN_RELIEF_B_JSON).expect("json");
    let mut leaves = 0;
    walk(&root, "", &mut leaves);
    assert!(leaves >= 30, "liczba lisci tabeli: {leaves}");
}

#[test]
fn relief_b_table_parses_with_deny_unknown_fields() {
    let t = mapgen_relief_b();
    assert_eq!(t.siatka_domykanie.min_masa_mop_up.wartosc, 150.0);
    assert_eq!(t.pasma.maks_skupisko_gor_wzgorz.wartosc, 10.0);
    assert_eq!(t.pasma.udzial_gor_wzgorz_w_ladzie_sufit.wartosc, 0.4);
    assert_eq!(t.pasma_fallback.high.dlugosc_max.wartosc, 22.0);
}

#[test]
fn relief_b_table_has_no_non_finite_numbers() {
    let t = mapgen_relief_b();
    let p = &t.pasma;
    for v in [
        p.udzial_gor_wzgorz_w_ladzie_sufit.wartosc,
        p.szum_seed_pasma.wartosc,
        p.szum_kroku_pasma.wartosc,
        p.regrow_mnoznik_celu.wartosc,
    ] {
        assert!(v.is_finite());
    }
}
