//! P6.7B - przeglad calego Unicode przez klucz `stripDiacriticsLower` (NFD, wyciecie U+0300-U+036F, trim,
//! male litery) w `unitStockCost`. Wektor `nfd.json` = prawdziwe `unitStockCost` weba dla KAZDEGO punktu
//! kodowego U+0000..U+10FFFF (poza zastepczymi); zapisane sa tylko punkty, dla ktorych klucz roznil sie od
//! samego znaku (`null` = brak klucza: znak pusty po trim albo rowny `-`). Pozostale maja dawac klucz == znak.

#[path = "p6_7b_vectors/common.rs"]
mod common;

use std::collections::BTreeMap;

use civ_engine::domain::building_costs::p6_7b::{unit_stock_cost, EpochInput, UnitStockCostSource};
use common::*;

fn key_for(ch: &str) -> Option<String> {
    let unit = UnitStockCostSource {
        jednostka: None,
        typ: None,
        epoka: EpochInput::Number(1.0),
        surowiec: Some(ch.to_string()),
        surowiec_ilosc: Some(1.0),
    };
    let out = unit_stock_cost(Some(&unit));
    assert!(out.len() <= 1, "wiecej niz jeden klucz dla {ch:?}");
    out.into_keys().next()
}

#[test]
fn nfd_strip_matches_running_web_for_every_code_point() {
    let d = load("nfd.json");
    let changed: BTreeMap<u32, Option<String>> = arr(&d, "changed")
        .iter()
        .map(|p| (p[0].as_u64().expect("cp") as u32, opt_text(&p[1])))
        .collect();
    assert!(changed.len() > 1000, "za malo zmienionych punktow");
    let mut checked = 0u32;
    let mut exact = 0u32;
    let mut case_skew: Vec<u32> = Vec::new();
    let mut divergent: Vec<String> = Vec::new();
    for cp in 0..=0x10FFFFu32 {
        let Some(ch) = char::from_u32(cp) else {
            continue; // zastepcze (U+D800..U+DFFF) nie sa napisami Rust
        };
        checked += 1;
        let s = ch.to_string();
        let want = match changed.get(&cp) {
            Some(w) => w.clone(),
            None => Some(s.clone()),
        };
        let got = key_for(&s);
        if got == want {
            exact += 1;
            continue;
        }
        // Jedyna dopuszczalna klasa rozbieznosci: skosnosc wersji Unicode tabel wielkosci liter. Biblioteka
        // standardowa Rust (nowszy Unicode) zna pare wielka/mala litera, ktorej Node z wektora (Unicode 16.0)
        // jeszcze nie zna: web zostawia znak bez zmian, Rust zamienia go na mala litere.
        let lowered = ch.to_lowercase().collect::<String>();
        if want.as_deref() == Some(s.as_str())
            && got.as_deref() == Some(lowered.as_str())
            && lowered != s
        {
            case_skew.push(cp);
        } else {
            divergent.push(format!("U+{cp:04X} rust={got:?} web={want:?}"));
        }
    }
    assert_eq!(u64::from(checked), d["total"].as_u64().expect("total"));
    assert!(
        divergent.is_empty(),
        "{} rozbieznosci poza skosnoscia wersji Unicode, pierwsze: {:#?}",
        divergent.len(),
        &divergent[..divergent.len().min(60)]
    );
    eprintln!(
        "nfd: sprawdzono {checked} punktow kodowych, zgodnych {exact}, skosnosc wersji Unicode (wielkosc liter) {}",
        case_skew.len()
    );
    assert!(
        case_skew.len() < 200,
        "skosnosc wersji Unicode wieksza niz oczekiwana: {}",
        case_skew.len()
    );
}

#[test]
fn nfd_strip_matches_running_web_for_random_sequences() {
    let d = load("nfd.json");
    let cases = arr(&d, "sequences");
    assert!(cases.len() >= 6000);
    let mut mismatches: Vec<String> = Vec::new();
    for c in cases {
        let input = text(&c[0]);
        let want = opt_text(&c[1]);
        let got = key_for(&input);
        if got != want {
            mismatches.push(format!("{input:?} rust={got:?} web={want:?}"));
        }
    }
    eprintln!(
        "nfd sekwencje: {} rozbieznosci z {}",
        mismatches.len(),
        cases.len()
    );
    assert!(
        mismatches.is_empty(),
        "{} rozbieznosci, pierwsze: {:#?}",
        mismatches.len(),
        &mismatches[..mismatches.len().min(30)]
    );
}
