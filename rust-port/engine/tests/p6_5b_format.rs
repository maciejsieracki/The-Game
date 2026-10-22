//! P6.5B - formaty UI z `manpower.ts` (`formatPopulationAbs`, `formatManpower`, `formatObywateleLabel`),
//! semantyka `Number#toString` i kolejnosc `localeCompare` (ASCII) z wektorami z URUCHOMIONEGO weba
//! (`tests/p6_5b_vectors/format.json`, pin edb8fb56).

#[path = "p6_5b_vectors/common.rs"]
mod common;

use civ_engine::domain::recruitment::manpower::{
    format_manpower, format_obywatele_label, format_population_abs, js_number_to_string,
    locale_compare,
};
use common::{list, load, num};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_5b_vectors/format.json");

fn root() -> Value {
    load(VECTORS)
}

#[test]
fn number_to_string_matches_web() {
    let root = root();
    let (mut exponent, mut fractional, mut negative) = (0, 0, 0);
    for case in list(&root["cases"]["fmt"]["numberToString"], "numberToString") {
        let x = num(&case["x"]);
        let want = case["out"].as_str().expect("out");
        assert_eq!(js_number_to_string(x), want, "String({x:?})");
        exponent += usize::from(want.contains('e'));
        fractional += usize::from(want.contains('.'));
        negative += usize::from(want.starts_with('-'));
    }
    assert!(exponent > 100 && fractional > 100 && negative > 50);
}

#[test]
fn population_formats_match_web() {
    let root = root();
    let (mut mln, mut tys, mut plain) = (0, 0, 0);
    for case in list(
        &root["cases"]["fmt"]["formatPopulationAbs"],
        "formatPopulationAbs",
    ) {
        let x = num(&case["x"]);
        let want = case["out"].as_str().expect("out");
        assert_eq!(format_population_abs(x), want, "formatPopulationAbs({x:?})");
        assert_eq!(
            format_manpower(x),
            case["mp"].as_str().expect("mp"),
            "formatManpower({x:?})"
        );
        mln += usize::from(want.ends_with(" mln"));
        tys += usize::from(want.ends_with(" tys."));
        plain += usize::from(!want.ends_with(" mln") && !want.ends_with(" tys."));
    }
    assert!(mln > 100 && tys > 100 && plain > 50);
}

#[test]
fn citizen_label_matches_web() {
    let root = root();
    let (mut singular, mut plural) = (0, 0);
    for case in list(
        &root["cases"]["fmt"]["formatObywateleLabel"],
        "formatObywateleLabel",
    ) {
        let x = num(&case["x"]);
        let want = case["out"].as_str().expect("out");
        assert_eq!(
            format_obywatele_label(x),
            want,
            "formatObywateleLabel({x:?})"
        );
        if want == "1 obywatel" {
            singular += 1;
        } else {
            plural += 1;
        }
    }
    assert!(singular >= 3 && plural > 100);
}

#[test]
fn locale_compare_matches_web_for_ascii() {
    let root = root();
    let collate = &root["cases"]["collate"];
    let (mut less, mut equal, mut greater) = (0, 0, 0);
    for case in list(&collate["pairs"], "pairs") {
        let a = case["a"].as_str().expect("a");
        let b = case["b"].as_str().expect("b");
        let want = i32::try_from(case["out"].as_i64().expect("out")).expect("i32");
        assert_eq!(locale_compare(a, b), want, "localeCompare({a:?}, {b:?})");
        match want {
            -1 => less += 1,
            0 => equal += 1,
            1 => greater += 1,
            other => panic!("localeCompare zwrocil {other}"),
        }
    }
    assert!(less > 1000 && equal > 50 && greater > 1000);
}

#[test]
fn locale_compare_table_is_the_measured_primary_order() {
    let root = root();
    let measured = root["cases"]["collate"]["primaryOrder"]
        .as_str()
        .expect("primaryOrder");
    assert_eq!(
        civ_engine::data::derived::locale_compare_ascii().kolejnosc_podstawowa,
        measured,
        "locale-compare-ascii.json = kolejnosc zmierzona w uruchomionym Node"
    );
}
