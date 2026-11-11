//! REPIN-EKONOMIA-CERAMIKA-GARNCARSTWO-Q1 (runda 2): asercje danych i modelu utrzymania surowcowego
//! po synchronizacji z webem `origin/main` = 638e90bea (FALA <= 606).
//! Wartosci oczekiwane sa odczytane z `gra/data/*.json` tego pinu, nie z kodu Rust.

#[path = "../src/data/buildings_tech.rs"]
mod buildings_tech;

use std::collections::BTreeMap;

use buildings_tech::{parse_buildings, parse_tech, parse_wonders};
use civ_engine::domain::turn_economy::economy_upkeep_p2 as eu;

/// Web: `utrzymanie_surowce: { ceramika: 2 }` tylko u czterech budynkow.
#[test]
fn utrzymanie_surowce_ceramika_2_only_on_four_buildings() {
    let buildings = parse_buildings().expect("buildings.json");
    let mut got: Vec<(String, i64)> = buildings
        .iter()
        .filter_map(|b| {
            b.utrzymanie_surowce
                .as_ref()
                .map(|u| (b.id.clone(), u.ceramika.expect("ceramika")))
        })
        .collect();
    got.sort();
    let want = vec![
        ("akwedukt".to_string(), 2),
        ("laznia_publiczna".to_string(), 2),
        ("port".to_string(), 2),
        ("spichlerz_ii".to_string(), 2),
    ];
    assert_eq!(got, want);
}

/// Web `buildingResourceUpkeep` dla Spichlerza Krolewskiego (utrzymanie 2, koszt drewno/kamien/cegla 50):
/// ceramika 2 (stala ilosc) + po 2 szt. na kazdy typ z koszt_surowce (floor(2 x 1)).
#[test]
fn spichlerz_krolewski_upkeep_ceramika_plus_proportional_types() {
    let rec = eu::BuildingRecord {
        id: "spichlerz_ii".to_string(),
        utrzymanie: Some(2.0),
        przyrost_utrzymania: Some(0.0),
        epoka_wejscia: Some(2.0),
        koszt_surowce: Some(
            [("drewno", 50.0), ("kamien", 50.0), ("cegla", 50.0)]
                .into_iter()
                .map(|(k, v)| (k.to_string(), Some(v)))
                .collect(),
        ),
        utrzymanie_surowce: Some([("ceramika".to_string(), Some(2.0))].into_iter().collect()),
    };
    let got = eu::building_resource_upkeep(Some(&rec), 1.0, 1.0);
    let want: BTreeMap<String, f64> = [
        ("cegla", 2.0),
        ("ceramika", 2.0),
        ("drewno", 2.0),
        ("kamien", 2.0),
    ]
    .into_iter()
    .map(|(k, v)| (k.to_string(), v))
    .collect();
    assert_eq!(got, want);
    // Wspolczynnik 0 wylacza utrzymanie surowcowe (web: floor(v x 0) = 0 => brak wpisow).
    assert!(eu::building_resource_upkeep(Some(&rec), 1.0, 0.0).is_empty());
}

/// Web `tech.json`: Garncarstwo = poziom 1, koszt nauki 40 PN, piate po czterech podstawach.
#[test]
fn garncarstwo_fifth_basic_tech_after_four_basics() {
    let file = parse_tech().expect("tech.json");
    let row = file
        .technologie
        .iter()
        .find(|t| t.technologia == "Garncarstwo")
        .expect("Garncarstwo");
    assert_eq!(row.poziom, 1);
    assert_eq!(row.koszt_nauki, 40);
    let mut prereq: Vec<String> = row
        .wymaga_prereq
        .split('+')
        .map(|s| s.trim().to_string())
        .collect();
    prereq.sort();
    let mut want: Vec<String> = [
        "Obróbka drewna",
        "Rolnictwo",
        "Łowiectwo",
        "Oswojenie zwierząt",
    ]
    .iter()
    .map(|s| s.to_string())
    .collect();
    want.sort();
    assert_eq!(prereq, want);
}

/// Web `wonders.json` hamonga: bez martwych bonusow terenowych lowie_rybackie / laka.
#[test]
fn haamonga_has_no_dead_terrain_bonuses() {
    let wonders = parse_wonders().expect("wonders.json");
    let hamonga = wonders
        .cuda
        .iter()
        .find(|c| c.id == "hamonga")
        .expect("hamonga");
    assert!(
        hamonga.bonusy.teren.is_none(),
        "bonusy.teren ma byc usuniete"
    );
}
