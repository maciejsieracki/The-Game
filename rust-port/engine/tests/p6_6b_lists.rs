//! P6.6B - `game/cities.ts`: biblioteka list budowy (`loadBudowaListaBiblioteka`, `newBudowaListaSzablonId`,
//! `defaultBudowaListaNazwa`, `dedupeBudowaLista`). Wektory z URUCHOMIONEGO weba (pin edb8fb56);
//! `Date.now()` weba zwracal ustalone wartosci, a licznik identyfikatorow jest stanem modulu weba -
//! sekwencja `sequence` jest odtwarzana w tej samej kolejnosci na jednym `BudowaListaIdGen`.

#[path = "p6_6b_vectors/common.rs"]
mod common;

use civ_engine::domain::terrain::city_founding::p6_6b::cities::{
    dedupe_budowa_lista, default_budowa_lista_nazwa, load_budowa_lista_biblioteka,
    BudowaListaIdGen, BudowaListaSzablon,
};
use common::*;
use serde_json::{json, Value};

fn szablon_value(s: &BudowaListaSzablon) -> Value {
    json!({ "id": s.id, "nazwa": s.nazwa, "budynki": s.budynki })
}

#[test]
fn id_generator_and_loader_match_web_sequence() {
    let d = load("lists.json");
    let rows = arr(&d, "sequence");
    assert!(rows.len() >= 200);
    let mut gen = BudowaListaIdGen::default();
    let mut legacy_slots = 0;
    let mut ids = 0;
    for (i, row) in rows.iter().enumerate() {
        let nows: Vec<f64> = arr(row, "nows").iter().map(num).collect();
        let mut next = 0_usize;
        let mut now = || {
            let v = nows[next];
            next += 1;
            v
        };
        match row["kind"].as_str().expect("kind") {
            "load" => {
                let meta = (!row["meta"].is_null()).then(|| row["meta"].clone());
                let got = load_budowa_lista_biblioteka(meta.as_ref(), &mut gen, &mut now);
                let got_v = Value::Array(got.iter().map(szablon_value).collect());
                assert_values(&format!("load[{i}]"), &got_v, &row["out"]);
                legacy_slots += nows.len();
            }
            "newId" => {
                let got = gen.new_id(now());
                assert_eq!(got, text(&row["out"]), "newId[{i}]");
                ids += 1;
            }
            other => panic!("rodzaj {other}"),
        }
        assert_eq!(next, nows.len(), "sequence[{i}]: liczba wywolan Date.now");
    }
    assert!(legacy_slots >= 30, "wektor musi pokrywac migracje A/B/C");
    assert!(ids >= 10);
}

#[test]
fn default_nazwa_matches_web() {
    let d = load("lists.json");
    let rows = arr(&d, "defaultNazwa");
    assert!(rows.len() >= 80);
    for (i, row) in rows.iter().enumerate() {
        let bib: Vec<BudowaListaSzablon> = if row.get("fullRange").is_some() {
            let mut bib: Vec<BudowaListaSzablon> = (1..=row["fullRange"].as_u64().expect("n"))
                .map(|n| BudowaListaSzablon {
                    id: "i".into(),
                    nazwa: format!("Lista {n}"),
                    budynki: vec![],
                })
                .collect();
            for extra in row
                .get("extra")
                .and_then(Value::as_array)
                .into_iter()
                .flatten()
            {
                bib.push(BudowaListaSzablon {
                    id: "i".into(),
                    nazwa: text(extra),
                    budynki: vec![],
                });
            }
            bib
        } else {
            arr(row, "bib")
                .iter()
                .map(|s| BudowaListaSzablon {
                    id: text(&s["id"]),
                    nazwa: text(&s["nazwa"]),
                    budynki: vec![],
                })
                .collect()
        };
        assert_eq!(
            default_budowa_lista_nazwa(&bib),
            text(&row["out"]),
            "nazwa[{i}]"
        );
    }
}

#[test]
fn dedupe_matches_web() {
    let d = load("lists.json");
    let rows = arr(&d, "dedupe");
    assert!(rows.len() >= 80);
    for (i, row) in rows.iter().enumerate() {
        assert_eq!(
            dedupe_budowa_lista(&strings(&row["arr"])),
            strings(&row["out"]),
            "dedupe[{i}]"
        );
    }
}
