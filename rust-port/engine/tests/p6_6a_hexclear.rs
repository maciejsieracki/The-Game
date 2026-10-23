//! P6.6A - `game/city-hex-clear.ts` (74 linie): wektory z URUCHOMIONEGO weba (pin edb8fb56).
//! `hexToWorkedTile` (turn-economy.ts) jest wstrzykiwany: domkniecie dostaje heks PRZED czyszczeniem
//! i zwraca wynik prawdziwego `hexToWorkedTile` zapisany w wektorze.

#[path = "p6_6a_vectors/common.rs"]
mod common;

use std::cell::RefCell;
use std::collections::BTreeMap;

use civ_engine::data::derived::CityHexClearRulesFile;
use civ_engine::domain::terrain::city_hex_clear::{
    apply_city_founding_to_hex, city_keep_improvement_keys, city_keeps_improvement,
    clear_hex_for_city_center, clear_hex_for_city_center_with, CityCenterHex,
};
use common::*;
use serde_json::Value;

fn data() -> Value {
    load("hexclear.json")
}

#[test]
fn keep_set_and_predicate_match_web() {
    let d = data();
    assert_eq!(
        city_keep_improvement_keys(),
        strings(&d["keepKeys"]).as_slice()
    );
    for (i, row) in arr(&d, "keeps").iter().enumerate() {
        assert_eq!(
            city_keeps_improvement(row["key"].as_str().expect("key")),
            row["out"].as_bool().expect("out"),
            "keeps[{i}] {}",
            row["key"]
        );
    }
}

#[test]
fn clear_hex_for_city_center_matches_web() {
    let d = data();
    let rows = arr(&d, "clear");
    assert!(rows.len() >= 300);
    for (i, row) in rows.iter().enumerate() {
        let mut hex = center_hex(&row["before"]);
        clear_hex_for_city_center(&mut hex, row["arg"].as_bool());
        assert_eq!(
            hex,
            center_hex(&row["after"]),
            "clear[{i}] arg={}",
            row["arg"]
        );
    }
}

fn hex_with(nakladka: &str) -> CityCenterHex {
    CityCenterHex {
        teren: terrain("laka"),
        nakladka: overlay(nakladka),
        ulepszenie: "farma".into(),
        ulepszenia: Some(vec!["farma".into()]),
        zloze: Some("zelazo".into()),
        improvement_key: Some("farma".into()),
        rzeka: false,
    }
}

fn rules_with(deposits: &[&str], brak: &str) -> CityHexClearRulesFile {
    CityHexClearRulesFile {
        meta: Value::Null,
        zostaje_ulepszenia: Vec::new(),
        zostaja_zloza_nakladki: deposits.iter().map(|d| (*d).to_string()).collect(),
        ulepszenie_brak: brak.to_string(),
    }
}

/// Testy ksztaltu: edycja tabeli (lista zostajacych zloz, napis `Ulepszenie.Brak`) zmienia wynik, a
/// las i gora zachowuja sztywna semantyke weba niezaleznie od tabeli.
#[test]
fn clearing_follows_the_editable_table_but_forest_and_mountain_rules_are_fixed() {
    let all = [
        "zloze_gliny",
        "zloze_rudy",
        "zloze_konia",
        "zloze_owiec",
        "zloze_bydla",
        "zloze_lamy",
    ];
    // pusta lista: kazde zloze ZNIKA, las tez
    let none = rules_with(&[], "x");
    for name in all.iter().chain(["las", "brak"].iter()) {
        let mut h = hex_with(name);
        clear_hex_for_city_center_with(&mut h, Some(false), &none);
        assert_eq!(h.nakladka, overlay("brak"), "{name}");
    }
    // tylko jedno zloze na liscie: tylko ono zostaje
    for kept in all {
        let only = rules_with(&[kept], "x");
        for name in all {
            let mut h = hex_with(name);
            clear_hex_for_city_center_with(&mut h, Some(false), &only);
            let want = if name == kept {
                overlay(name)
            } else {
                overlay("brak")
            };
            assert_eq!(h.nakladka, want, "kept={kept} name={name}");
        }
    }
    // las zostaje zawsze usuniety, nawet gdy tabela (blednie) wymienia "las" jako zloze
    let with_las = rules_with(&["las", "zloze_rudy"], "x");
    let mut h = hex_with("las");
    clear_hex_for_city_center_with(&mut h, Some(false), &with_las);
    assert_eq!(h.nakladka, overlay("brak"));
    // gora (mountainClearsAll) kasuje wszystko i ustawia napis Ulepszenie.Brak z tabeli
    let mut h = hex_with("zloze_rudy");
    clear_hex_for_city_center_with(&mut h, None, &with_las);
    assert_eq!(h.nakladka, overlay("brak"));
    assert_eq!(h.ulepszenie, "x");
    assert!(h.zloze.is_none() && h.improvement_key.is_none());
    assert_eq!(
        h.ulepszenia,
        Some(vec!["farma".to_string()]),
        "warstwy ulepszen nie sa ruszane"
    );
    // nie-gora nie dotyka ulepszen ani zloza/klucza
    let mut h = hex_with("zloze_rudy");
    clear_hex_for_city_center_with(&mut h, Some(false), &none);
    assert_eq!(h.ulepszenie, "farma");
    assert_eq!(h.zloze.as_deref(), Some("zelazo"));
    assert_eq!(h.improvement_key.as_deref(), Some("farma"));
}

#[test]
fn apply_city_founding_to_hex_matches_web() {
    let d = data();
    let rows = arr(&d, "apply");
    assert!(rows.len() >= 200);
    let mut missing = 0;
    for (i, row) in rows.iter().enumerate() {
        let hex_key = parse_key(row["hexKey"].as_str().expect("hexKey"));
        let mut hexes: BTreeMap<(i32, i32), CityCenterHex> = BTreeMap::new();
        hexes.insert(hex_key, center_hex(&row["hexBefore"]));
        let mut center: Option<Value> = if row["prefilled"].as_bool().expect("prefilled") {
            Some(serde_json::json!({ "stary": true }))
        } else {
            None
        };
        let seen: RefCell<Vec<CityCenterHex>> = RefCell::new(Vec::new());
        let snapshot = if row["centerAfter"].is_null() {
            Value::Null
        } else {
            row["centerAfter"].clone()
        };
        apply_city_founding_to_hex(
            &mut center,
            &mut hexes,
            int(&row["q"]),
            int(&row["r"]),
            &|hex: &CityCenterHex| {
                seen.borrow_mut().push(hex.clone());
                snapshot.clone()
            },
        );
        let was_missing = row["missing"].as_bool().expect("missing");
        if was_missing {
            missing += 1;
            assert!(
                seen.borrow().is_empty(),
                "apply[{i}]: brak heksu = brak snapshotu"
            );
        } else {
            // snapshot zrobiony PRZED czyszczeniem, dokladnie raz
            assert_eq!(seen.borrow().len(), 1, "apply[{i}]");
            assert_eq!(
                seen.borrow()[0],
                center_hex(&row["hexBefore"]),
                "apply[{i}] snapshot"
            );
        }
        // web: przy braku heksu centerWorkedTile zostaje bez zmian (w wektorze: centerAfter = stara wartosc
        // albo brak), inaczej = wynik prawdziwego hexToWorkedTile.
        let want_center = if row["centerAfter"].is_null() {
            None
        } else {
            Some(row["centerAfter"].clone())
        };
        assert_eq!(center, want_center, "apply[{i}] center");
        assert_eq!(
            hexes[&hex_key],
            center_hex(&row["hexAfter"]),
            "apply[{i}] hex po zalozeniu"
        );
    }
    assert!(missing >= 10);
}
