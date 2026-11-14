//! P6 WIEZE-CITYTOWERS (etap 2A, R-RUSTPORT-P6-WIEZE-CITYTOWERS-Q1): zgodnosc helperow wiezyczek miejskich
//! z pinem `gra/src/game/city-towers.ts` (commit `07d2fbd72`, SHA-256 `cc715ed6...`).
//!
//! Wektory: `p6_city_towers_vectors/vectors.json`, generowane przez `p6_city_towers_gen.mjs`, ktory WYKONUJE
//! doslowny tekst pinu w Node (transpilacja TypeScript). Test wymaga:
//! * identycznych wynikow dla kazdego przypadku (`towerRows`, `strongestRangedUnitForEra` przez indeks wiersza,
//!   `towerRangeFor`, `missilePower`, `unitReach`, `eraName`, `towerMaterialFor`),
//! * dodatnich licznikow pokrycia dla kazdej galezi (`meta.counts` i wyniki Rusta),
//! * braku `unwrap`/`expect` na sciezkach danych wejsciowych (sprawdzane w module, nie tutaj).

use civ_engine::domain::city_towers::{
    era_name, missile_power, strongest_ranged_unit_for_era, tower_material_for, tower_range_for,
    tower_rows, unit_reach, FortificationKind, TowerMaterial, TowerSlotInput, UnitRow,
    DEFAULT_TOWER_MIN_RANGE,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_city_towers_vectors/vectors.json");

fn load() -> Value {
    serde_json::from_str(VECTORS).expect("vectors.json jest poprawnym JSON-em")
}

fn list<'a>(root: &'a Value, key: &str) -> &'a Vec<Value> {
    root["cases"][key]
        .as_array()
        .unwrap_or_else(|| panic!("brak listy cases.{key}"))
}

fn row(v: &Value) -> UnitRow {
    serde_json::from_value(v.clone()).expect("wiersz jednostki jako mapa klucz -> wartosc")
}

fn opt_row(v: &Value) -> Option<UnitRow> {
    if v.is_null() {
        None
    } else {
        Some(row(v))
    }
}

fn ints(v: &Value) -> Vec<i64> {
    v.as_array()
        .expect("tablica")
        .iter()
        .map(|x| x.as_i64().expect("calkowita"))
        .collect()
}

#[test]
fn tower_rows_match_pin_vectors() {
    let root = load();
    let cases = list(&root, "towerRows");
    assert!(
        cases.len() >= 150,
        "za malo przypadkow towerRows: {}",
        cases.len()
    );
    for c in cases {
        let inp = &c["input"];
        let input = TowerSlotInput {
            row_lo: inp["rowLo"].as_i64().expect("rowLo"),
            row_hi: inp["rowHi"].as_i64().expect("rowHi"),
            gate_row_lo: inp["gateRowLo"].as_i64().expect("gateRowLo"),
            gate_row_hi: inp["gateRowHi"].as_i64().expect("gateRowHi"),
            spacing: inp.get("spacing").and_then(Value::as_i64),
        };
        let got = tower_rows(&input);
        assert_eq!(got, ints(&c["expected"]), "towerRows {}", c["id"]);
    }
}

#[test]
fn strongest_ranged_unit_matches_pin_vectors() {
    let root = load();
    let cases = list(&root, "strongestRangedUnitForEra");
    assert!(
        cases.len() >= 150,
        "za malo przypadkow strongest: {}",
        cases.len()
    );
    for c in cases {
        let units: Vec<UnitRow> = c["units"]
            .as_array()
            .expect("units")
            .iter()
            .map(row)
            .collect();
        let era = c["era"].as_f64().expect("era");
        let civ = c["civ"].as_str();
        let got = strongest_ranged_unit_for_era(&units, era, civ);
        let got_idx = got.and_then(|r| units.iter().position(|u| std::ptr::eq(u, r)));
        let want_idx = c["expectIndex"].as_u64().map(|i| i as usize);
        assert_eq!(
            got_idx, want_idx,
            "strongest {} (era={era}, civ={civ:?})",
            c["id"]
        );
    }
}

#[test]
fn tower_range_matches_pin_vectors() {
    let root = load();
    let cases = list(&root, "towerRangeFor");
    assert!(
        cases.len() >= 100,
        "za malo przypadkow towerRangeFor: {}",
        cases.len()
    );
    for c in cases {
        let unit = opt_row(&c["unit"]);
        let min_range = c["minRange"].as_f64().unwrap_or(DEFAULT_TOWER_MIN_RANGE);
        let got = tower_range_for(unit.as_ref(), min_range);
        let want = c["expected"].as_f64().expect("expected");
        assert_eq!(got, want, "towerRangeFor {}", c["id"]);
    }
}

#[test]
fn missile_power_and_unit_reach_match_pin_vectors() {
    let root = load();
    for c in list(&root, "missilePower") {
        let u = row(&c["unit"]);
        assert_eq!(
            missile_power(&u),
            c["expected"].as_f64().expect("expected"),
            "missilePower {}",
            c["id"]
        );
    }
    for c in list(&root, "unitReach") {
        let u = row(&c["unit"]);
        assert_eq!(
            unit_reach(&u),
            c["expected"].as_f64().expect("expected"),
            "unitReach {}",
            c["id"]
        );
    }
}

#[test]
fn era_name_and_material_match_pin_vectors() {
    let root = load();
    for c in list(&root, "eraName") {
        let era = c["era"].as_f64().expect("era");
        let want = c["expected"].as_str();
        assert_eq!(era_name(era), want, "eraName {}", c["id"]);
    }
    for c in list(&root, "towerMaterialFor") {
        let kind = match c["kind"].as_str().expect("kind") {
            "palisada" => FortificationKind::Palisada,
            "mur" => FortificationKind::Mur,
            _ => FortificationKind::Inny,
        };
        let got = tower_material_for(kind).map(|m| match m {
            TowerMaterial::Drewno => "drewno",
            TowerMaterial::Kamien => "kamien",
        });
        assert_eq!(got, c["expected"].as_str(), "towerMaterialFor {}", c["id"]);
    }
}

#[test]
fn coverage_counters_are_nonzero_for_every_branch() {
    let root = load();
    let counts = &root["meta"]["counts"];
    for tag in [
        "nonempty",
        "gate_skip",
        "short_wall",
        "spacing_default",
        "spacing_custom",
        "spacing_clamped",
        "none",
        "era_direct",
        "era_fallback",
        "national_hit",
        "national_excluded",
        "tie_power",
        "atak_fallback",
        "epoka_fallback",
        "era_round",
        "era_clamp",
        "no_unit",
        "above_min",
        "below_min",
        "fractional",
    ] {
        let n = counts[tag].as_u64().unwrap_or(0);
        assert!(n > 0, "licznik pokrycia {tag} = 0");
    }
}

#[test]
fn vector_outcomes_cover_both_branches() {
    // Pokrycie liczone z oczekiwanych wynikow pinu (wektorow); zgodnosc z Rustem sprawdzaja testy powyzej.
    let root = load();
    let rows = list(&root, "towerRows");
    let non_empty = rows
        .iter()
        .filter(|c| c["expected"].as_array().is_some_and(|a| !a.is_empty()))
        .count();
    assert!(non_empty > 0, "towerRows nigdy nie zwraca wiezyczek");
    let strong = list(&root, "strongestRangedUnitForEra");
    let some = strong
        .iter()
        .filter(|c| !c["expectIndex"].is_null())
        .count();
    let none = strong.len() - some;
    assert!(some > 0 && none > 0, "strongest: some={some} none={none}");
    let fallback = strong
        .iter()
        .filter(|c| {
            c["tags"]
                .as_array()
                .is_some_and(|t| t.iter().any(|x| x == "era_fallback"))
        })
        .count();
    assert!(
        fallback > 0,
        "brak przypadku cofania sie do wczesniejszej epoki"
    );
}

#[test]
fn fixed_tie_and_fallback_cases_present() {
    let root = load();
    let ids: Vec<&str> = list(&root, "strongestRangedUnitForEra")
        .iter()
        .filter_map(|c| c["id"].as_str())
        .collect();
    for want in [
        "SR-fix-remis-zasieg",
        "SR-fix-remis-kolejnosc",
        "SR-fix-cofanie-zelazo",
        "SR-fix-narodowy-obcy",
        "SR-fix-atak-fallback",
        "SR-fix-brak",
    ] {
        assert!(ids.contains(&want), "brak jawnego przypadku {want}");
    }
}

#[test]
fn nan_era_yields_no_unit() {
    let units: Vec<UnitRow> = vec![row(&serde_json::json!({
        "Rola (linia)": "Dystans", "missileAttack": 3, "Zasięg ataku (hex)": 2, "Epoka": "Kamień"
    }))];
    assert!(strongest_ranged_unit_for_era(&units, f64::NAN, None).is_none());
    assert!(era_name(f64::NAN).is_none());
}
