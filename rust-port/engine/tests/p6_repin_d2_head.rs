//! REPIN-EKONOMIA-D, partia D2.2b (czesc 1) — testy glowy `cityYieldPerTurn`: Step 2 (Mlyn,
//! Cegielnia), Step 3' (bonus portu `eko_pieniadz_port_proc`) i praca netto (`eko_praca_proc`)
//! z `gra/src/game/economy.ts` (pin `91dc998a`, L849-860, L884-890, L892-903).
//!
//! Wektory: `tests/p6_repin_d2_head_vectors/head-main.json` (1200 przypadkow), generowane
//! URUCHOMIENIEM weba (node 22.22, `--experimental-strip-types`): wycinek `economy-head-slice.mts`
//! (verbatim) + `civ-matrix.ts@91dc998a`. Generator: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-D2-Q1/logs/gen-head.mts`.
//!
//! - `parity_*`: wektory weba, porownanie BIT-W-BIT (`to_bits`, zero ze znakiem, NaN).
//! - `structural_*` / `boundary_*` / `synthetic_*`: galezie wyprowadzone z kodu weba; wartosci
//!   liczone recznie.

use civ_engine::data::civilizations::{CivMatrixFile, Num};
use civ_engine::domain::civ_matrix::load_civ_matrix;
use civ_engine::domain::economy_yield::{
    city_yield_head, CityYieldHeadInput, CityYieldHeadOutput, CityYieldHeadParams,
};
use serde_json::Value;

const HEAD_VECTORS: &str = include_str!("p6_repin_d2_head_vectors/head-main.json");

/// Liczba zakodowana przez generator: `{"f": String(x)}` (`-0` jako `"-0"`, `NaN`, `Infinity`).
fn ef(v: &Value) -> f64 {
    let s = v["f"].as_str().expect("tagged number");
    s.parse::<f64>()
        .unwrap_or_else(|_| panic!("unparsable number {s}"))
}

fn same(got: f64, exp: f64) -> bool {
    (got.is_nan() && exp.is_nan()) || got.to_bits() == exp.to_bits()
}

fn params() -> CityYieldHeadParams {
    CityYieldHeadParams {
        budynek_mlyn_mnoznik_pracy: 2.0,
        budynek_mlyn_bonus_pracy: 2.0,
        budynek_cegielni_bonus_pracy: 0.25,
    }
}

/// Wejscie neutralne: brak wlasciciela, bez Mlyna i Cegielni, bez portu.
fn base_input() -> CityYieldHeadInput<'static> {
    CityYieldHeadInput {
        civ_key: None,
        praca_terenu: 10.0,
        praca_budynkow: 4.0,
        pieniadz_budynkow: 6.0,
        pieniadz_portu: 0.0,
        ma_mlyn: false,
        ma_cegielnia: false,
    }
}

fn run(input: &CityYieldHeadInput<'_>) -> CityYieldHeadOutput {
    city_yield_head(&load_civ_matrix().file, &params(), input)
}

/// Macierz z parametrami Step 2/3' ustawionymi jawnie (mul_proc, bez wierszy cywilizacji).
fn synthetic_matrix(port: f64, praca: f64) -> CivMatrixFile {
    let mut m = load_civ_matrix().file.clone();
    for key in ["eko_pieniadz_port_proc", "eko_praca_proc"] {
        for row in m.cywilizacje.iter_mut() {
            row.params.remove(key);
        }
        m.defaults.remove(key);
    }
    m.defaults
        .insert("eko_pieniadz_port_proc".to_owned(), Num::Float(port));
    m.defaults
        .insert("eko_praca_proc".to_owned(), Num::Float(praca));
    m
}

#[test]
fn parity_head_main_bit_exact() {
    let doc: Value = serde_json::from_str(HEAD_VECTORS).expect("vectors parse");
    let cases = doc["cases"].as_array().expect("cases array");
    assert_eq!(cases.len(), doc["n"].as_u64().unwrap() as usize);
    let matrix = &load_civ_matrix().file;
    let mut checked = 0usize;
    for (idx, case) in cases.iter().enumerate() {
        let i = &case["in"];
        let a = &i["a"];
        let city = &i["city"];
        let ctx = &i["ctx"];
        let p = &i["params"];
        let civ_key: Option<&str> = city["civKey"].as_str();
        let input = CityYieldHeadInput {
            civ_key,
            praca_terenu: ef(&a["pracaTerenu"]),
            praca_budynkow: ef(&a["pracaBudynkow"]),
            pieniadz_budynkow: ef(&a["pieniadzBudynkow"]),
            pieniadz_portu: ef(&a["pieniadzPortu"]),
            ma_mlyn: ctx["maMlyn"].as_bool().unwrap_or(false),
            ma_cegielnia: ctx["maCegielnia"].as_bool().unwrap_or(false),
        };
        let p = CityYieldHeadParams {
            budynek_mlyn_mnoznik_pracy: ef(&p["budynekMlynMnoznikPracy"]),
            budynek_mlyn_bonus_pracy: ef(&p["budynekMlynBonusPracy"]),
            budynek_cegielni_bonus_pracy: ef(&p["budynekCegielniBonusPracy"]),
        };
        let got = city_yield_head(matrix, &p, &input);
        let out = &case["out"];
        let checks = [
            ("pracaBruttoTerenu", got.praca_brutto_terenu),
            ("pieniadzBudynkow", got.pieniadz_budynkow),
            ("pracaBruttoLacznie", got.praca_brutto_lacznie),
            ("pracaNetto", got.praca_netto),
        ];
        for (name, value) in checks {
            let exp = ef(&out[name]);
            assert!(
                same(value, exp),
                "case {idx} field {name}: got {value:?} ({:#x}) expected {exp:?} ({:#x}) civ={civ_key:?}",
                value.to_bits(),
                exp.to_bits()
            );
            checked += 1;
        }
    }
    assert_eq!(checked, cases.len() * 4);
}

#[test]
fn structural_mlyn_then_cegielnia_order() {
    // Mlyn: 10*2+2 = 22; Cegielnia po Mlynie: 22*1.25 = 27.5 (odwrotna kolejnosc dalaby 27).
    let mut input = base_input();
    input.ma_mlyn = true;
    input.ma_cegielnia = true;
    let got = run(&input);
    assert!(same(got.praca_brutto_terenu, 27.5));
    assert!(same(got.praca_brutto_lacznie, 31.5));
}

#[test]
fn structural_no_mlyn_no_cegielnia_is_identity() {
    let got = run(&base_input());
    assert!(same(got.praca_brutto_terenu, 10.0));
    assert!(same(got.praca_netto, 14.0));
    assert!(same(got.pieniadz_budynkow, 6.0));
}

#[test]
fn structural_cegielnia_alone_scales_terrain_only() {
    let mut input = base_input();
    input.ma_cegielnia = true;
    let got = run(&input);
    assert!(same(got.praca_brutto_terenu, 12.5));
    assert!(same(got.praca_brutto_lacznie, 16.5));
}

#[test]
fn structural_port_bonus_needs_owner_and_matrix() {
    // Bez wlasciciela bonus portu nie dziala nawet przy niezerowej macierzy.
    let m = synthetic_matrix(0.5, 0.0);
    let mut input = base_input();
    input.pieniadz_portu = 10.0;
    let got = city_yield_head(&m, &params(), &input);
    assert!(same(got.pieniadz_budynkow, 6.0));
    // Pusty klucz (`""`) tez jest bez wlasciciela.
    input.civ_key = Some("");
    let got = city_yield_head(&m, &params(), &input);
    assert!(same(got.pieniadz_budynkow, 6.0));
}

#[test]
fn synthetic_port_matrix_applied_to_port_income_only() {
    // 6 + 10 * 0.5 = 11; praca nie zmieniona (eko_praca_proc = 0).
    let m = synthetic_matrix(0.5, 0.0);
    let mut input = base_input();
    input.civ_key = Some("grecy");
    input.pieniadz_portu = 10.0;
    let got = city_yield_head(&m, &params(), &input);
    assert!(same(got.pieniadz_budynkow, 11.0));
    assert!(same(got.praca_netto, 14.0));
}

#[test]
fn boundary_port_nan_propagates_into_pieniadz() {
    // Web: `portRaw !== 0` dla NaN jest prawdziwe, wiec NaN wchodzi do Pieniadza budynkow.
    let m = synthetic_matrix(f64::NAN, 0.0);
    let mut input = base_input();
    input.civ_key = Some("grecy");
    input.pieniadz_portu = 10.0;
    let got = city_yield_head(&m, &params(), &input);
    assert!(got.pieniadz_budynkow.is_nan());
}

#[test]
fn boundary_port_zero_keeps_negative_zero_bits() {
    // Web: `portRaw !== 0` dla +0 i -0 jest falszywe, wiec Pieniadz -0 zostaje -0 (bity).
    let m = synthetic_matrix(-0.0, 0.0);
    let mut input = base_input();
    input.civ_key = Some("grecy");
    input.pieniadz_budynkow = -0.0;
    input.pieniadz_portu = 10.0;
    let got = city_yield_head(&m, &params(), &input);
    assert_eq!(got.pieniadz_budynkow.to_bits(), (-0.0f64).to_bits());
}

#[test]
fn boundary_port_zero_skips_bonus_even_for_infinite_port_income() {
    // Web: `portRaw !== 0` jest falszywe, wiec Infinity * 0 = NaN NIE trafia do Pieniadza.
    let m = synthetic_matrix(0.0, 0.0);
    let mut input = base_input();
    input.civ_key = Some("grecy");
    input.pieniadz_portu = f64::INFINITY;
    let got = city_yield_head(&m, &params(), &input);
    assert!(same(got.pieniadz_budynkow, 6.0));
}

#[test]
fn synthetic_praca_matrix_applied_to_brutto_sum() {
    // 14 * (1 + 0.1) = 15.4 (mul_proc); bez wlasciciela bez mnoznika.
    let m = synthetic_matrix(0.0, 0.1);
    let mut input = base_input();
    input.civ_key = Some("grecy");
    let got = city_yield_head(&m, &params(), &input);
    assert!(same(got.praca_netto, 14.0 * (1.0 + 0.1)));
    input.civ_key = None;
    let got = city_yield_head(&m, &params(), &input);
    assert!(same(got.praca_netto, 14.0));
}

#[test]
fn synthetic_praca_matrix_uses_brutto_after_mlyn() {
    // Praca netto liczona od pracy brutto po Mlynie i Cegielni: (10*2+2)*1.25 + 4 = 31.5 -> *1.1.
    let m = synthetic_matrix(0.0, 0.1);
    let mut input = base_input();
    input.civ_key = Some("grecy");
    input.ma_mlyn = true;
    input.ma_cegielnia = true;
    let got = city_yield_head(&m, &params(), &input);
    assert!(same(got.praca_netto, 31.5 * (1.0 + 0.1)));
}
