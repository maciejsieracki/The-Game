//! REPIN-EKONOMIA-D, partia D2.2a — testy ogona `cityYieldPerTurn` (Step 5-9) z
//! `gra/src/game/economy.ts` (pin `91dc998a`, L908-1009).
//!
//! Wektory: `tests/p6_repin_d2_tail_vectors/tail-main.json` (2400 przypadkow), generowane
//! URUCHOMIENIEM weba (node 22.22, `--experimental-strip-types`): wycinek `economy-tail-slice.mts`
//! (verbatim L908-1009) + `civ-matrix.ts@91dc998a`. Generator: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-D2-Q1/logs/gen-tail.mts`.
//!
//! - `parity_*`: wektory weba, porownanie BIT-W-BIT (znak zera i NaN sprawdzane przez `to_bits`).
//! - `structural_*` / `boundary_*`: galezie logiki wyprowadzone z kodu weba (wartosci liczone
//!   recznie, bez macierzy: klucz cywilizacji `None` lub `""`).

use civ_engine::data::civilizations::{CivMatrixFile, Num};
use civ_engine::domain::civ_matrix::load_civ_matrix;
use civ_engine::domain::economy_yield::{
    city_yield_tail, CityYieldTailInput, CityYieldTailOutput, CityYieldTailParams,
};
use serde_json::Value;

const TAIL_VECTORS: &str = include_str!("p6_repin_d2_tail_vectors/tail-main.json");

/// Liczba zakodowana przez generator: `{"f": String(x)}` (`-0` jako `"-0"`, `NaN`, `Infinity`).
fn ef(v: &Value) -> f64 {
    let s = v["f"].as_str().expect("tagged number");
    s.parse::<f64>()
        .unwrap_or_else(|_| panic!("unparsable number {s}"))
}

fn same(got: f64, exp: f64) -> bool {
    (got.is_nan() && exp.is_nan()) || got.to_bits() == exp.to_bits()
}

fn params() -> CityYieldTailParams {
    CityYieldTailParams {
        korupcja_cap: 0.5,
        mennica_mnoznik_po_walucie: 1.5,
        biblioteka_bonus_nauki: 0.15,
        akademia_bonus_nauki: 0.1,
        garncarnia_bonus_zywnosci: 0.1,
        zywnosc_zuzytka_populacja: 0.5,
    }
}

/// Wejscie neutralne: brak wlasciciela (legacy), bez bonusow, 100 Handlu, 50/50/0 podzialu.
fn base_input() -> CityYieldTailInput<'static> {
    CityYieldTailInput {
        civ_key: None,
        ludnosc: 0.0,
        procent_nauka: 50.0,
        procent_pieniadz: 50.0,
        procent_luksus: 0.0,
        poborca_count: 0,
        handel_terenu: 100.0,
        pieniadz_budynkow: 0.0,
        nauka_budynkow: 10.0,
        zywnosc_terenu: 0.0,
        zywnosc_budynkow: 0.0,
        kultura_budynkow: 0.0,
        strata_fraction: 0.0,
        waluta_odkryta: false,
        ma_mennica: false,
        civ_handel_mult: None,
        premia_handlu_tras: None,
        additional_tax: None,
        civ_nauka_mult: None,
        ma_biblioteka: false,
        ma_akademia: false,
        liczba_garncarni: None,
        wojsko_zuzycie_zywnosci: 0.0,
    }
}

fn run(input: &CityYieldTailInput<'_>) -> CityYieldTailOutput {
    city_yield_tail(&load_civ_matrix().file, input, &params())
}

#[test]
fn parity_tail_main_bit_exact() {
    let doc: Value = serde_json::from_str(TAIL_VECTORS).expect("vectors parse");
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
        let opt = |v: &Value| -> Option<f64> {
            if v.is_object() && v.get("u").is_some() {
                None
            } else {
                Some(ef(v))
            }
        };
        let flag = |v: &Value| v.as_bool().unwrap_or(false);
        let spec = city["specjalisci"].as_array().expect("specjalisci");
        let poborca_count = spec
            .iter()
            .filter(|s| s.as_str() == Some("poborca"))
            .count() as u32;
        let procent = &city["podzial"];
        let input = CityYieldTailInput {
            civ_key,
            ludnosc: ef(&city["ludnosc"]),
            procent_nauka: ef(&procent["procentNauka"]),
            procent_pieniadz: ef(&procent["procentPieniadz"]),
            procent_luksus: ef(&procent["procentLuksus"]),
            poborca_count,
            handel_terenu: ef(&a["handelTerenu"]),
            pieniadz_budynkow: ef(&a["pieniadzBudynkow"]),
            nauka_budynkow: ef(&a["naukaBudynkow"]),
            zywnosc_terenu: ef(&a["zywnoscTerenu"]),
            zywnosc_budynkow: ef(&a["zywnoscBudynkow"]),
            kultura_budynkow: ef(&a["kulturaBudynkow"]),
            strata_fraction: ef(&ctx["strataFraction"]),
            waluta_odkryta: flag(&ctx["walutaOdkryta"]),
            ma_mennica: flag(&ctx["maMennica"]),
            civ_handel_mult: opt(&ctx["civHandelMult"]),
            premia_handlu_tras: opt(&ctx["premiaHandluTrasHandlowych"]),
            additional_tax: opt(&ctx["additionalTax"]),
            civ_nauka_mult: opt(&ctx["civNaukaMult"]),
            ma_biblioteka: flag(&ctx["maBiblioteka"]),
            ma_akademia: flag(&ctx["maAkademia"]),
            liczba_garncarni: opt(&ctx["liczbaGarncarni"]),
            wojsko_zuzycie_zywnosci: ef(&ctx["wojskoZuzycieZywnosci"]),
        };
        let params = CityYieldTailParams {
            korupcja_cap: ef(&p["korupcjaCap"]),
            mennica_mnoznik_po_walucie: ef(&p["mennicaMnoznikPoWalucie"]),
            biblioteka_bonus_nauki: ef(&p["budynekBibliotekaBonusNauki"]),
            akademia_bonus_nauki: ef(&p["budynekAkademiaBonusNauki"]),
            garncarnia_bonus_zywnosci: ef(&p["budynekGarncarniaBonusZywnosci"]),
            zywnosc_zuzytka_populacja: ef(&p["zywnoscZuzytkaPopulacja"]),
        };
        let got = city_yield_tail(matrix, &input, &params);
        let o = &case["out"];
        let pairs = [
            ("pieniadz", got.pieniadz, ef(&o["pieniadz"])),
            ("zywnosc", got.zywnosc, ef(&o["zywnosc"])),
            ("nauka", got.nauka, ef(&o["nauka"])),
            ("luksus", got.luksus, ef(&o["luksus"])),
            ("kultura", got.kultura, ef(&o["kultura"])),
            ("zywnoscBrutto", got.zywnosc_brutto, ef(&o["zywnoscBrutto"])),
            ("handelBrutto", got.handel_brutto, ef(&o["handelBrutto"])),
        ];
        for (name, g, e) in pairs {
            assert!(same(g, e), "case {idx} field {name}: got {g:?} exp {e:?}");
        }
        checked += 1;
    }
    assert_eq!(checked, 2400);
}

#[test]
fn structural_neutral_baseline() {
    let out = run(&base_input());
    assert_eq!(out.handel_brutto, 100.0);
    assert_eq!(out.nauka, 60.0);
    assert_eq!(out.pieniadz, 50.0);
    assert_eq!(out.luksus, 0.0);
}

#[test]
fn structural_mint_needs_both_flags() {
    let mut only_waluta = base_input();
    only_waluta.waluta_odkryta = true;
    assert_eq!(
        run(&only_waluta).pieniadz,
        50.0,
        "walutaOdkryta bez Mennicy"
    );
    let mut only_mennica = base_input();
    only_mennica.ma_mennica = true;
    assert_eq!(
        run(&only_mennica).pieniadz,
        50.0,
        "Mennica bez walutaOdkryta"
    );
    let mut both = base_input();
    both.waluta_odkryta = true;
    both.ma_mennica = true;
    let out = run(&both);
    // handelNetto = 100 * 1.5 = 150 -> 75 Nauki i 75 Pieniedzy.
    assert_eq!(out.pieniadz, 75.0);
    assert_eq!(out.nauka, 85.0);
}

#[test]
fn structural_poborca_adds_two_each() {
    let mut input = base_input();
    input.poborca_count = 2;
    assert_eq!(run(&input).pieniadz, 54.0);
}

#[test]
fn structural_additional_tax_clamped_at_zero_and_nan_propagates() {
    let mut neg = base_input();
    neg.additional_tax = Some(-5.0);
    assert_eq!(
        run(&neg).handel_brutto,
        100.0,
        "ujemny podatek z pracy obcinany do 0"
    );
    let mut pos = base_input();
    pos.additional_tax = Some(12.7);
    assert_eq!(run(&pos).handel_brutto, 112.0);
    let mut nan = base_input();
    nan.additional_tax = Some(f64::NAN);
    assert!(
        run(&nan).handel_brutto.is_nan(),
        "Math.max(0, NaN) = NaN w webie"
    );
}

#[test]
fn structural_premia_only_when_positive() {
    let mut neg = base_input();
    neg.premia_handlu_tras = Some(-3.0);
    assert_eq!(run(&neg).handel_brutto, 100.0);
    let mut pos = base_input();
    pos.premia_handlu_tras = Some(10.0);
    assert_eq!(run(&pos).handel_brutto, 110.0);
}

#[test]
fn structural_legacy_civ_handel_mult_only_without_owner() {
    let mut legacy = base_input();
    legacy.civ_handel_mult = Some(2.0);
    assert_eq!(run(&legacy).handel_brutto, 200.0);
    let mut empty_key = base_input();
    empty_key.civ_key = Some("");
    empty_key.civ_handel_mult = Some(2.0);
    assert_eq!(
        run(&empty_key).handel_brutto,
        200.0,
        "pusty klucz = brak wlasciciela"
    );
}

#[test]
fn structural_biblioteka_and_akademia_are_additive() {
    let mut input = base_input();
    input.procent_nauka = 100.0;
    input.procent_pieniadz = 0.0;
    input.nauka_budynkow = 0.0;
    input.ma_biblioteka = true;
    input.ma_akademia = true;
    // addytywnie: 100 * (1 + 0.15 + 0.10) = 125; multiplikatywnie byloby 126.
    assert_eq!(run(&input).nauka, 125.0);
}

#[test]
fn structural_civ_nauka_mult_without_owner() {
    let mut input = base_input();
    input.civ_nauka_mult = Some(1.5);
    // floor((50 + 10) * 1.5) = 90
    assert_eq!(run(&input).nauka, 90.0);
}

#[test]
fn boundary_nan_strata_reaches_money_but_not_gross_trade() {
    let mut input = base_input();
    input.strata_fraction = f64::NAN;
    let out = run(&input);
    assert_eq!(out.handel_brutto, 100.0);
    assert!(out.pieniadz.is_nan(), "js_min(NaN, cap) = NaN");
}

#[test]
fn structural_korupcja_cap_limits_strata() {
    let mut input = base_input();
    input.strata_fraction = 0.9;
    // strata = min(0.9, 0.5) = 0.5 -> handelNetto = 50 -> pieniadz 25
    assert_eq!(run(&input).pieniadz, 25.0);
}

#[test]
fn structural_garncarnia_food_and_consumption() {
    let mut input = base_input();
    input.zywnosc_terenu = 10.0;
    input.liczba_garncarni = Some(3.0);
    input.ludnosc = 5.0;
    let out = run(&input);
    // brutto = 10 * (1 + 0.1 * 3) = 13; netto = 13 - (5 * 0.5) = 10.5 -> 10
    assert_eq!(out.zywnosc_brutto, 13.0);
    assert_eq!(out.zywnosc, 10.0);
}

/// Klucze macierzy czytane przez ogon (Step 4-9). Usuwane z wierszy i z `defaults`, zeby test
/// kontrolowal wartosc wylacznie przez `defaults` (wiersz `grecy` bez pola => domyslna).
const TAIL_KEYS: &[&str] = &[
    "eko_handel_brutto_proc",
    "eko_korupcja_proc",
    "eko_luksus_proc",
    "eko_nauka_proc",
    "eko_pieniadz_proc",
    "eko_zywnosc_proc",
    "eko_kultura_proc",
];

/// Syntetyczna, NIEZEROWA i NIECALKOWITA macierz (mul_proc: baza * (1 + v)) dla luksusu, zywnosci
/// i kultury. Pozostale klucze `eko_*` = 0 (neutralne). Dane z wlasnego testu, nie z gry.
fn synthetic_matrix(luksus: f64, zywnosc: f64, kultura: f64) -> CivMatrixFile {
    let mut m = load_civ_matrix().file.clone();
    for key in TAIL_KEYS {
        for row in m.cywilizacje.iter_mut() {
            row.params.remove(*key);
        }
        m.defaults.remove(*key);
    }
    m.defaults
        .insert("eko_luksus_proc".to_owned(), Num::Float(luksus));
    m.defaults
        .insert("eko_zywnosc_proc".to_owned(), Num::Float(zywnosc));
    m.defaults
        .insert("eko_kultura_proc".to_owned(), Num::Float(kultura));
    m
}

/// Wejscie z wlascicielem `grecy` (truthy civKey), bez udzialu Nauki i Pieniedzy z handlu.
fn owned_isolated_input() -> CityYieldTailInput<'static> {
    let mut input = base_input();
    input.civ_key = Some("grecy");
    input.procent_nauka = 0.0;
    input.procent_pieniadz = 0.0;
    input.nauka_budynkow = 0.0;
    input
}

#[test]
fn synthetic_luksus_matrix_applied_then_floored() {
    // luksusRaw = floor(33) = 33; 33 * (1 + 0.37) = 45.21 -> floor 45 (bez floor: 45.21).
    let m = synthetic_matrix(0.37, 0.41, 0.23);
    let mut input = owned_isolated_input();
    input.procent_luksus = 100.0;
    input.handel_terenu = 33.0;
    let out = city_yield_tail(&m, &input, &params());
    assert!(same(out.luksus, 45.0), "luksus = {:?}", out.luksus);
}

#[test]
fn synthetic_zywnosc_matrix_applied_to_brutto_and_netto() {
    // zywnoscBrutto = floor(33 * (1 + 0.41)) = floor(46.53) = 46; netto (ludnosc 0) = 46.
    let m = synthetic_matrix(0.37, 0.41, 0.23);
    let mut input = owned_isolated_input();
    input.zywnosc_terenu = 33.0;
    let out = city_yield_tail(&m, &input, &params());
    assert!(
        same(out.zywnosc_brutto, 46.0),
        "brutto = {:?}",
        out.zywnosc_brutto
    );
    assert!(same(out.zywnosc, 46.0), "netto = {:?}", out.zywnosc);
}

#[test]
fn synthetic_kultura_matrix_applied_and_floored() {
    // kultura = floor(33 * (1 + 0.23)) = floor(40.59) = 40.
    let m = synthetic_matrix(0.37, 0.41, 0.23);
    let mut input = owned_isolated_input();
    input.kultura_budynkow = 33.0;
    let out = city_yield_tail(&m, &input, &params());
    assert!(same(out.kultura, 40.0), "kultura = {:?}", out.kultura);
}

#[test]
fn synthetic_matrix_ignored_without_owner() {
    // Brak wlasciciela (civKey None): zadna macierz nie jest czytana, wartosci bazowe.
    let m = synthetic_matrix(0.37, 0.41, 0.23);
    let mut input = base_input();
    input.procent_nauka = 0.0;
    input.procent_pieniadz = 0.0;
    input.nauka_budynkow = 0.0;
    input.procent_luksus = 100.0;
    input.handel_terenu = 33.0;
    input.zywnosc_terenu = 33.0;
    input.kultura_budynkow = 33.0;
    let out = city_yield_tail(&m, &input, &params());
    assert!(same(out.luksus, 33.0));
    assert!(same(out.zywnosc_brutto, 33.0));
    assert!(same(out.kultura, 33.0));
}

#[test]
fn boundary_premia_zero_with_negative_zero_trade_is_positive_zero() {
    // Web: premia > 0 false => brak dodawania; Math.max(0, 0) = +0; -0 + +0 = +0.
    // Mutant `premia >= 0` dodaje +0 do -0 => +0, potem ten sam wynik: rownowaznosc bitowa.
    let mut input = base_input();
    input.handel_terenu = -0.0;
    input.pieniadz_budynkow = -0.0;
    input.premia_handlu_tras = Some(0.0);
    let out = run(&input);
    assert!(
        same(out.handel_brutto, 0.0),
        "handel = {:?}",
        out.handel_brutto
    );
}

#[test]
fn boundary_additional_tax_negative_zero_is_positive_zero() {
    // Math.max(0, -0) = +0 (spec JS). Test pilnuje, ze js_max w Rust zachowuje ten znak.
    let mut input = base_input();
    input.handel_terenu = -0.0;
    input.pieniadz_budynkow = -0.0;
    input.additional_tax = Some(-0.0);
    let out = run(&input);
    assert!(
        same(out.handel_brutto, 0.0),
        "handel = {:?}",
        out.handel_brutto
    );
}
