//! P6.M06B1 - tabela `data/derived/mapgen-coast.json`: kazdy lisc ma `zrodlo_web` (gen-helpers.ts),
//! a wartosci sa rowne literalom z weba (wykrywa dryf tabeli wzgledem pinu `edb8fb56`).

use civ_engine::data::derived::{mapgen_coast, MAPGEN_COAST_JSON};
use serde_json::Value;

/// Lisc tabeli: obiekt z `wartosc` i `zrodlo_web` (wzor `StartValue`).
fn leaves(v: &Value, path: &str, out: &mut Vec<(String, Value)>) {
    match v {
        Value::Object(map) if map.contains_key("wartosc") => {
            out.push((path.to_string(), v.clone()));
        }
        Value::Object(map) => {
            for (k, child) in map {
                if k == "meta" {
                    continue;
                }
                leaves(child, &format!("{path}/{k}"), out);
            }
        }
        _ => {}
    }
}

#[test]
fn coast_table_every_leaf_has_web_source() {
    let root: Value = serde_json::from_str(MAPGEN_COAST_JSON).expect("json parse");
    let mut found = Vec::new();
    leaves(&root, "", &mut found);
    assert_eq!(found.len(), 10, "liczba lisci tabeli M06B1");
    for (path, leaf) in &found {
        let src = leaf["zrodlo_web"]
            .as_str()
            .unwrap_or_else(|| panic!("{path}: brak zrodlo_web"));
        assert!(
            src.starts_with("gra/src/map/gen-helpers.ts:"),
            "{path}: zrodlo_web spoza gen-helpers.ts: {src}"
        );
    }
}

#[test]
fn coast_table_values_match_web_literals() {
    let t = mapgen_coast();
    assert_eq!(
        t.zatoki_oceanu.dzielnik_skali.wartosc, 6.0,
        "gen-helpers.ts:4651"
    );
    assert_eq!(
        t.zatoki_oceanu.bufor_min_dodatek.wartosc, 2.0,
        "gen-helpers.ts:4652"
    );
    assert_eq!(
        t.zatoki_oceanu.bufor_gorny_dodatek.wartosc, 14.0,
        "gen-helpers.ts:4652"
    );
    assert_eq!(
        t.dolina_rzezby.min_sasiadow_rzezby.wartosc, 2,
        "gen-helpers.ts:4746"
    );
    assert_eq!(
        t.dolina_rzezby.min_sasiadow_suchych.wartosc, 3,
        "gen-helpers.ts:4746"
    );
    assert_eq!(
        t.finalizacja.max_przebiegow_domyslne.wartosc, 3,
        "gen-helpers.ts:4791"
    );
    assert_eq!(
        t.wciecia.przebiegi_wygladzania.wartosc, 12,
        "gen-helpers.ts:4852"
    );
    assert_eq!(
        t.wciecia.prog_sasiadow_ladu.wartosc, 4,
        "gen-helpers.ts:4858"
    );
    assert_eq!(
        t.wciecia.szerokosc_wybrzeza_domyslna.wartosc, 2,
        "gen-helpers.ts:4844"
    );
    assert_eq!(
        t.cypel_ujscia.prog_sasiadow_morza.wartosc, 5,
        "gen-helpers.ts:4930"
    );
}
