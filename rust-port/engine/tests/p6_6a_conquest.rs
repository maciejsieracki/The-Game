//! P6.6A - `game/conquest-stability.ts` (191 linii): wektory z URUCHOMIONEGO weba (pin edb8fb56).
//! Zaleznosci spoza zakresu (`convertCulture`, `convertViaTemple`, `sameCultureCircle`) sa wstrzykiwane
//! domknieciami, ktore SPRAWDZAJA argumenty wzgledem zapisanych wywolan prawdziwego kodu weba.

#[path = "p6_6a_vectors/common.rs"]
mod common;

use std::cell::Cell;

use civ_engine::domain::terrain::conquest_stability::{
    clear_city_culture_mix, conquest_no_garrison_law_penalty, conquest_revolt_risk_multiplier,
    conquest_unstable_happiness_penalty, culture_buildings_from_ids, is_conquest_unstable,
    is_foreign_culture_dominant, on_city_captured_culture, religion_buildings_from_ids,
    tick_city_culture_religion, CityCaptureCultureOpts, CityCultureMix, CultureBuildings,
    CultureCity, ReligionBuildings, ReligionConversion,
};
use common::*;
use serde_json::Value;

fn data() -> Value {
    load("conquest.json")
}

fn culture_flags(v: &Value) -> CultureBuildings {
    CultureBuildings {
        has_amfiteatr: v["hasAmfiteatr"].as_bool().expect("flag"),
        has_biblioteka: v["hasBiblioteka"].as_bool().expect("flag"),
        has_palac: v["hasPalac"].as_bool().expect("flag"),
        has_stela: v["hasStela"].as_bool().expect("flag"),
        has_sad: v["hasSad"].as_bool().expect("flag"),
        has_laznia: v["hasLaznia"].as_bool().expect("flag"),
    }
}

fn religion_flags(v: &Value) -> ReligionBuildings {
    ReligionBuildings {
        has_swiatynia: v["hasSwiatynia"].as_bool().expect("flag"),
        has_kamienne_kregi: v["hasKamienneKregi"].as_bool().expect("flag"),
    }
}

#[test]
fn thresholds_match_web() {
    let d = data();
    for (i, row) in arr(&d, "foreign").iter().enumerate() {
        assert_eq!(
            is_foreign_culture_dominant(num(&row["share"])),
            row["out"].as_bool().expect("out"),
            "foreign[{i}]"
        );
    }
    for (i, row) in arr(&d, "unstable").iter().enumerate() {
        assert_eq!(
            is_conquest_unstable(
                num(&row["share"]),
                row["foreignReligion"].as_bool().expect("fr")
            ),
            row["out"].as_bool().expect("out"),
            "unstable[{i}]"
        );
    }
}

#[test]
fn revolt_multiplier_and_deprecated_penalties_match_web() {
    let d = data();
    let rows = arr(&d, "revolt");
    assert!(rows.len() >= 100);
    for (i, row) in rows.iter().enumerate() {
        assert_bits(
            &format!("revolt[{i}]"),
            conquest_revolt_risk_multiplier(
                num(&row["share"]),
                row["foreignReligion"].as_bool().expect("fr"),
                num(&row["garnizon"]),
            ),
            num(&row["out"]),
        );
    }
    for (i, row) in arr(&d, "deprecated").iter().enumerate() {
        let (s, f, g) = (
            num(&row["share"]),
            row["foreignReligion"].as_bool().expect("fr"),
            num(&row["garnizon"]),
        );
        assert_bits(
            &format!("happiness[{i}]"),
            conquest_unstable_happiness_penalty(s, f),
            num(&row["happiness"]),
        );
        assert_bits(
            &format!("law[{i}]"),
            conquest_no_garrison_law_penalty(s, f, g),
            num(&row["law"]),
        );
    }
}

#[test]
fn building_flags_match_web() {
    let d = data();
    let rows = arr(&d, "buildings");
    assert!(rows.len() >= 200);
    for (i, row) in rows.iter().enumerate() {
        let ids = strings(&row["ids"]);
        assert_eq!(
            culture_buildings_from_ids(&ids),
            culture_flags(&row["culture"]),
            "culture[{i}] {ids:?}"
        );
        assert_eq!(
            religion_buildings_from_ids(&ids),
            religion_flags(&row["religion"]),
            "religion[{i}] {ids:?}"
        );
    }
}

fn mix(v: &Value) -> CityCultureMix {
    CityCultureMix {
        own_culture_share: opt_num(&v["own"]),
        kultura_own_share: opt_num(&v["kult"]),
    }
}

#[test]
fn on_city_captured_culture_matches_web_with_injected_circle() {
    let d = data();
    let rows = arr(&d, "captured");
    assert!(rows.len() >= 400);
    let (mut circles_true, mut circles_false) = (0, 0);
    for (i, row) in rows.iter().enumerate() {
        let mut city = mix(&row["before"]);
        let keys = row["keys"].clone();
        let civ_key = move |owner: i64| -> String {
            keys[owner.to_string()].as_str().unwrap_or("").to_string()
        };
        let circle = row["circle"].clone();
        let called = Cell::new(false);
        let same_circle = |a: &str, b: &str| -> bool {
            called.set(true);
            assert!(
                !circle.is_null(),
                "captured[{i}]: nieoczekiwane sameCultureCircle({a:?}, {b:?})"
            );
            assert_eq!(a, circle["a"].as_str().expect("a"), "captured[{i}] a");
            assert_eq!(b, circle["b"].as_str().expect("b"), "captured[{i}] b");
            circle["out"].as_bool().expect("out")
        };
        let mode = row["mode"].as_str().expect("mode");
        let opts_none;
        let opts_empty = CityCaptureCultureOpts::default();
        let opts_keys = CityCaptureCultureOpts {
            civ_key_for_owner: Some(&civ_key),
        };
        let opts = match mode {
            "none" => {
                opts_none = None;
                opts_none
            }
            "empty" => Some(&opts_empty),
            "keys" => Some(&opts_keys),
            other => panic!("tryb {other}"),
        };
        on_city_captured_culture(
            &mut city,
            row["newOwner"].as_i64(),
            row["prevOwner"].as_i64(),
            opts,
            &same_circle,
        );
        assert_eq!(
            called.get(),
            !circle.is_null(),
            "captured[{i}] wywolanie sameCultureCircle"
        );
        if !circle.is_null() {
            if circle["out"].as_bool().expect("out") {
                circles_true += 1;
            } else {
                circles_false += 1;
            }
        }
        let want = mix(&row["after"]);
        assert_opt_bits(
            &format!("captured[{i}].own"),
            city.own_culture_share,
            want.own_culture_share,
        );
        assert_opt_bits(
            &format!("captured[{i}].kult"),
            city.kultura_own_share,
            want.kultura_own_share,
        );
    }
    assert!(
        circles_true >= 5 && circles_false >= 5,
        "{circles_true}/{circles_false}"
    );
}

#[test]
fn clear_city_culture_mix_removes_both_fields() {
    let mut city = CityCultureMix {
        own_culture_share: Some(0.3),
        kultura_own_share: Some(0.4),
    };
    clear_city_culture_mix(&mut city);
    assert_eq!(city, CityCultureMix::default());
}

#[test]
fn tick_city_culture_religion_matches_web_with_injected_conversions() {
    let d = data();
    let rows = arr(&d, "tick");
    assert!(rows.len() >= 400);
    let (mut culture_seen, mut religion_seen) = (0, 0);
    for (i, row) in rows.iter().enumerate() {
        let ids = strings(&row["ids"]);
        let id_refs: Vec<&str> = ids.iter().map(String::as_str).collect();
        let difficulty = text(&row["difficulty"]);
        let culture_calls = Cell::new(0_u32);
        let religion_calls = Cell::new(0_u32);
        let culture_call = row["cultureCall"].clone();
        let religion_call = row["religionCall"].clone();

        let convert_culture = |cc: &CultureCity, b: &CultureBuildings, cp: &String| -> f64 {
            culture_calls.set(culture_calls.get() + 1);
            assert!(
                !culture_call.is_null(),
                "tick[{i}]: nieoczekiwane convertCulture"
            );
            assert_eq!(
                cp,
                &text(&culture_call["difficulty"]),
                "tick[{i}] cultureParams"
            );
            assert_bits(
                &format!("tick[{i}].cc.share"),
                cc.own_culture_share.expect("ownCultureShare"),
                num(&culture_call["share"]),
            );
            assert_bits(
                &format!("tick[{i}].cc.kultura"),
                cc.kultura_skumulowana,
                0.0,
            );
            assert_eq!(
                *b,
                culture_flags(&culture_call["buildings"]),
                "tick[{i}] cultureBuildings"
            );
            num(&culture_call["out"])
        };
        let convert_via_temple = |state: &Value,
                                  target: &str,
                                  b: &ReligionBuildings,
                                  rp: &String|
         -> ReligionConversion<Value> {
            religion_calls.set(religion_calls.get() + 1);
            assert!(
                !religion_call.is_null(),
                "tick[{i}]: nieoczekiwane convertViaTemple"
            );
            assert_eq!(
                rp,
                &text(&religion_call["difficulty"]),
                "tick[{i}] religionParams"
            );
            assert_eq!(state, &religion_call["state"], "tick[{i}] state");
            assert_eq!(
                target,
                religion_call["target"].as_str().expect("target"),
                "tick[{i}] target"
            );
            assert_eq!(
                *b,
                religion_flags(&religion_call["buildings"]),
                "tick[{i}] religionBuildings"
            );
            ReligionConversion {
                state: religion_call["outState"].clone(),
                converted: num(&religion_call["outConverted"]),
            }
        };

        let got = tick_city_culture_religion(
            num(&row["share"]),
            row["religion"].clone(),
            &id_refs,
            row["owner"].as_str(),
            row["foreign"].as_bool().expect("foreign"),
            &difficulty,
            &difficulty,
            &convert_culture,
            &convert_via_temple,
        );
        assert_eq!(
            culture_calls.get(),
            u32::from(!culture_call.is_null()),
            "tick[{i}] wywolania kultury"
        );
        assert_eq!(
            religion_calls.get(),
            u32::from(!religion_call.is_null()),
            "tick[{i}] wywolania religii"
        );
        culture_seen += culture_calls.get();
        religion_seen += religion_calls.get();
        let want = &row["out"];
        assert_bits(
            &format!("tick[{i}].share"),
            got.own_culture_share,
            num(&want["ownCultureShare"]),
        );
        assert_bits(
            &format!("tick[{i}].rate"),
            got.culture_rate_applied,
            num(&want["cultureRateApplied"]),
        );
        assert_bits(
            &format!("tick[{i}].converted"),
            got.religion_converted,
            num(&want["religionConverted"]),
        );
        assert_eq!(
            got.religion_state, want["religionState"],
            "tick[{i}] religionState"
        );
    }
    assert!(
        culture_seen >= 100 && religion_seen >= 50,
        "{culture_seen}/{religion_seen}"
    );
}
