//! R-RUSTPORT-REPIN-EKONOMIA-CERAMIKA-GARNCARSTWO-Q1 (runda 4): parytet Rust <-> URUCHOMIONY web 638e90bea.
//!
//! Wektory `p6_repin_ekonomia_ceramika_vectors/web.json` generuje URUCHOMIONY kod weba
//! (`dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-CERAMIKA-GARNCARSTWO-Q1/gen-repin-ekonomia-ceramika-vectors.mjs`):
//! `economy-upkeep.ts buildingResourceUpkeep` (utrzymanie_surowce + model proporcjonalny, 43 budynki x 4 poziomy x 5
//! wspolczynnikow), `playerState.ts techCost/parsePrereqs/availableTechs/cheapestAvailable` (Garncarstwo 5. po czterech
//! podstawach, 40 PN) oraz `wonders-data.ts sumWonderCityYieldsForOwner/getWonderById` (Ha'amonga bez martwych bonusow
//! terenowych). Testy NIE asercjonuja na samym JSON, tylko porownuja wynik funkcji Rust z wynikiem funkcji weba.

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::data::buildings_tech::{parse_buildings, parse_tech, parse_wonders};
use civ_engine::domain::player::PlayerRules;
use civ_engine::domain::turn_economy::economy_upkeep_p2 as eu;
use civ_engine::domain::turn_economy_inputs_wonders::sum_wonder_city_yields_for_owner;
use civ_engine::domain::turn_economy_tick::building_record_of;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_repin_ekonomia_ceramika_vectors/web.json");

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("web.json")
}

fn arr<'a>(v: &'a Value, k: &str) -> &'a Vec<Value> {
    v[k].as_array()
        .unwrap_or_else(|| panic!("brak tablicy {k}"))
}

fn strings(v: &Value) -> Vec<String> {
    v.as_array()
        .expect("tablica")
        .iter()
        .map(|s| s.as_str().expect("napis").to_owned())
        .collect()
}

fn record_map(v: &Value) -> BTreeMap<String, f64> {
    v.as_object()
        .expect("obiekt")
        .iter()
        .map(|(k, x)| (k.clone(), x.as_f64().expect("liczba")))
        .collect()
}

/// Web `buildingResourceUpkeep(rec, level, ratio)` dla kazdego budynku, poziomu i wspolczynnika.
#[test]
fn building_resource_upkeep_matches_running_web() {
    let d = vectors();
    let buildings = parse_buildings().expect("buildings.json");
    let mut n_ceramika = 0;
    let mut n_nonempty = 0;
    for row in arr(&d, "upkeep") {
        let id = row["id"].as_str().unwrap();
        let level = row["level"].as_f64().unwrap();
        let ratio = row["ratio"].as_f64().unwrap();
        let b = buildings
            .iter()
            .find(|b| b.id == id)
            .unwrap_or_else(|| panic!("brak budynku {id} w Rust"));
        let got = eu::building_resource_upkeep(Some(&building_record_of(b)), level, ratio);
        let want = record_map(&row["out"]);
        assert_eq!(got, want, "{id} level={level} ratio={ratio}");
        n_ceramika += usize::from(want.contains_key("ceramika"));
        n_nonempty += usize::from(!want.is_empty());
    }
    // test nie jest pusty: ceramika (4 budynki x 4 poziomy x 4 niezerowe wspolczynniki) oraz model proporcjonalny
    assert!(n_ceramika >= 60, "ceramika {n_ceramika}");
    assert!(n_nonempty >= 400, "niepuste {n_nonempty}");
    assert_eq!(buildings.len() * 20, arr(&d, "upkeep").len());
}

/// Web `buildingResourceUpkeep(rec)` z pominietymi `level`/`ratio` = domyslne (1, DEFAULT ratio).
#[test]
fn building_resource_upkeep_defaults_match_running_web() {
    let d = vectors();
    assert_eq!(
        d["defaultRatio"].as_f64().unwrap(),
        eu::DEFAULT_BUILDING_RESOURCE_UPKEEP_RATIO
    );
    let buildings = parse_buildings().expect("buildings.json");
    for row in arr(&d, "upkeepDefault") {
        let id = row["id"].as_str().unwrap();
        let b = buildings.iter().find(|b| b.id == id).unwrap();
        let got = eu::building_resource_upkeep(
            Some(&building_record_of(b)),
            1.0,
            eu::DEFAULT_BUILDING_RESOURCE_UPKEEP_RATIO,
        );
        assert_eq!(got, record_map(&row["out"]), "{id} domyslne");
    }
}

/// Web `techCost` + `parsePrereqs` dla KAZDEJ technologii (w tym Garncarstwo = 40 PN).
#[test]
fn tech_cost_and_prereqs_match_running_web() {
    let d = vectors();
    let tech = parse_tech().expect("tech.json");
    let rules = PlayerRules::load().expect("player rules");
    assert_eq!(tech.technologie.len(), arr(&d, "costs").len());
    for row in arr(&d, "costs") {
        let id = row["id"].as_str().unwrap();
        let t = tech
            .technologie
            .iter()
            .find(|t| t.technologia == id)
            .unwrap_or_else(|| panic!("brak techu {id}"));
        assert_eq!(
            civ_engine::domain::player::tech_cost(t) as f64,
            row["cost"].as_f64().unwrap(),
            "koszt {id}"
        );
        assert_eq!(
            rules.parse_prereqs(t),
            strings(&row["prereq"]),
            "prereq {id}"
        );
    }
    let garn = arr(&d, "costs")
        .iter()
        .find(|r| r["id"] == "Garncarstwo")
        .expect("Garncarstwo w wektorach weba");
    assert_eq!(garn["cost"].as_f64().unwrap(), 40.0);
}

/// Web `availableTechs` / `cheapestAvailable` dla 16 podzbiorow czterech podstaw (+ stan z pelnym poziomem 1):
/// Garncarstwo staje sie dostepne dopiero po WSZYSTKICH czterech (5. po czterech podstawach).
#[test]
fn garncarstwo_availability_matches_running_web() {
    let d = vectors();
    let tech = parse_tech().expect("tech.json");
    let rules = PlayerRules::load().expect("player rules");
    let mut n_with = 0;
    let mut n_without = 0;
    for row in arr(&d, "availability") {
        let done: BTreeSet<String> = strings(&row["done"]).into_iter().collect();
        let got: Vec<String> = rules
            .available_techs(&tech.technologie, &done, None)
            .iter()
            .map(|t| t.technologia.clone())
            .collect();
        let want = strings(&row["available"]);
        assert_eq!(got, want, "availableTechs done={done:?}");
        assert_eq!(
            rules.cheapest_available(&tech.technologie, &done, None),
            row["cheapest"].as_str().map(str::to_owned),
            "cheapestAvailable done={done:?}"
        );
        if want.iter().any(|t| t == "Garncarstwo") {
            n_with += 1;
        } else {
            n_without += 1;
        }
    }
    // dostepne wylacznie przy pelnym zestawie czterech podstaw (1 z 16 podzbiorow + stan z calym poziomem 1 nie ma juz
    // Garncarstwa jako dostepnego tylko, gdy nie bylo go na liscie): wektor ma oba przypadki
    assert!(n_with >= 1, "Garncarstwo nigdy dostepne");
    assert!(n_without >= 15, "Garncarstwo dostepne za wczesnie");
}

/// Web `sumWonderCityYieldsForOwner` dla kazdego cudu i er + obecnosc bonusow terenowych (Ha'amonga bez martwych).
#[test]
fn wonders_city_yields_and_terrain_bonuses_match_running_web() {
    let d = vectors();
    let wonders = parse_wonders().expect("wonders.json");
    assert_eq!(wonders.cuda.len(), arr(&d, "wonders").len());
    for row in arr(&d, "wonders") {
        let id = row["id"].as_str().unwrap();
        let cud = wonders
            .cuda
            .iter()
            .find(|c| c.id == id)
            .unwrap_or_else(|| panic!("brak cudu {id}"));
        let got_teren: Vec<String> = cud
            .bonusy
            .teren
            .as_ref()
            .map(|t| t.iter().map(|b| b.typ_terenu.clone()).collect())
            .unwrap_or_default();
        assert_eq!(got_teren, strings(&row["terenTypes"]), "bonusy.teren {id}");
        assert_eq!(
            !got_teren.is_empty(),
            row["hasTeren"].as_bool().unwrap(),
            "hasTeren {id}"
        );
        for e in arr(row, "cityByEra") {
            let era = e["era"].as_f64().unwrap();
            let got = sum_wonder_city_yields_for_owner(&wonders, &[id.to_owned()], era);
            let w = &e["sum"];
            let f = |k: &str| w[k].as_f64().unwrap();
            let want = [
                f("pieniadz"),
                f("zywnosc"),
                f("nauka"),
                f("kultura"),
                f("zadowolenie"),
                f("praca"),
                f("obrona"),
            ];
            let have = [
                got.pieniadz,
                got.zywnosc,
                got.nauka,
                got.kultura,
                got.zadowolenie,
                got.praca,
                got.obrona,
            ];
            assert_eq!(have, want, "{id} era={era}");
        }
    }
    let ham = arr(&d, "wonders")
        .iter()
        .find(|w| w["id"] == "hamonga")
        .expect("hamonga w wektorach weba");
    assert!(
        !ham["hasTeren"].as_bool().unwrap(),
        "web: Ha'amonga bez bonusow terenowych"
    );
    assert!(strings(&ham["terenTypes"])
        .iter()
        .all(|t| t != "lowie_rybackie" && t != "laka"));
}
