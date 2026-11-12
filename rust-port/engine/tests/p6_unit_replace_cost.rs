//! P6-UNIT-REPLACE-L3-KOSZT (dlug L-3, etap 4): koszt Pieniadza i max_hp po zamianie = pin 07d2fbd72.
//!
//! Wektory: `p6_unit_replace_cost_vectors/unit-replace-cost-vectors.json`, generowane przez
//! `gen-unit-replace-cost-vectors.mjs` (node wykonuje tekst pinu: unitMoneyCost, applyUnitCostPace,
//! applyDifficultyCostMultiplier, effectiveMaxHp, veteranCombatBonusFrac, unitHealth).
//!
//! Testy:
//! 1. `koszt_pieniadza_lancuch_zgodny_z_pinem` - port `unit_money_cost_web` na wektorach pinu
//!    (rabat cywilizacji, tempo, trudnosc, wlasciciel).
//! 2. `max_hp_zgodne_z_pinem` - `unit_health_value` (klucz `health`) + `replace_max_hp` na wektorach.
//! 3. `tabela_produkcyjna_koszt_i_hp_z_danych_pinu` - raport rozbieznosci DANYCH (units.json Rust vs pin):
//!    koszt bazowy i zdrowie. Rozbieznosci nie sa rozstrzygane tutaj (decyzja gameplay, zadanie 27).

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::building_costs::repin_b2::{unit_money_cost_web, CostMarker, MarkerValue};
use civ_engine::domain::recruitment::army_merge::UnitCostPace;
use civ_engine::domain::types::Difficulty;
use civ_engine::domain::unit_health::unit_health_value;
use civ_engine::domain::unit_replace_cost::{replace_max_hp, ReplaceUnitProgress};
use civ_engine::domain::unit_replace_defs::{
    production_base_gold, production_replace_defs_for_civ,
};
use civ_engine::domain::unit_replace_wiring::ReplaceUnitDef;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_unit_replace_cost_vectors/unit-replace-cost-vectors.json");

/// Straznik pina: SHA-256 tekstu funkcji pinu 07d2fbd72 uzytego przez generator (meta.textSha256).
/// Zmiana wektorow (regeneracja z innego pina) wymaga swiadomej zmiany tej stalej.
const EXPECTED_TEXT_SHA256: &str =
    "6d734a83d43db62b2a95ef0cbb2c1d1995b2a2b78d7dc227a0440e9941569e69";

fn parse_vectors() -> Value {
    let doc: Value = serde_json::from_str(VECTORS).expect("wektory kosztu i HP parsuja sie");
    assert_eq!(
        doc["meta"]["textSha256"].as_str(),
        Some(EXPECTED_TEXT_SHA256),
        "wektory pochodza z innego tekstu pinu"
    );
    doc
}

fn same_f64(got: f64, expected: f64) -> bool {
    if expected == 0.0 {
        return got == 0.0;
    }
    got.to_bits() == expected.to_bits() || (got - expected).abs() < 1e-12
}

fn num(v: &Value) -> f64 {
    v.as_f64().expect("liczba w wektorze")
}

fn difficulty_of(key: &str) -> Difficulty {
    match key {
        "normal" => Difficulty::Normal,
        "easy" => Difficulty::Easy,
        "hard" => Difficulty::Hard,
        other => panic!("nieznana trudnosc w wektorze: {other}"),
    }
}

/// Tempo jak w web: napis = klucz, liczba = mnoznik, null = brak (`undefined`).
fn pace_of(v: &Value) -> Option<UnitCostPace<'_>> {
    match v {
        Value::Null => None,
        Value::String(s) => Some(UnitCostPace::Key(s.as_str())),
        Value::Number(n) => Some(UnitCostPace::Multiplier(n.as_f64().expect("mnoznik"))),
        other => panic!("nieoczekiwane tempo w wektorze: {other}"),
    }
}

fn marker_value(v: &Value) -> MarkerValue {
    match v.as_f64() {
        Some(n) => MarkerValue::Number(n),
        None => MarkerValue::NotNumber,
    }
}

/// Zestaw markerow z wektora -> `CostMarker` (rabat liczy kod Rust, nie helper testowy).
fn markers_of(set: &Value) -> Vec<CostMarker<'_>> {
    set.as_array()
        .expect("zestaw markerow")
        .iter()
        .map(|m| CostMarker {
            cel: m["cel"].as_str(),
            wartosc: marker_value(&m["wartosc"]),
            realizuje: m["realizuje"].as_str(),
            matrix_param_id: m["matrixParamId"].as_str(),
        })
        .collect()
}

#[test]
fn koszt_pieniadza_lancuch_zgodny_z_pinem() {
    let doc = parse_vectors();
    let sets = doc["markerSets"].as_object().expect("markerSets");
    let cases = doc["money"].as_array().expect("money");
    assert!(cases.len() >= 200, "wektory kosztu: {}", cases.len());
    let mut mismatches = Vec::new();
    for case in cases {
        let set_name = case["markers"].as_str().expect("markers");
        let markers = markers_of(&sets[set_name]);
        let unit = case["unit"].as_str().expect("unit");
        let base = num(&case["base"]);
        let owner = case["owner"].as_i64().expect("owner");
        let diff = difficulty_of(case["diff"].as_str().expect("diff"));
        let got = unit_money_cost_web(
            base,
            &markers,
            pace_of(&case["pace"]),
            owner,
            diff,
            Some(unit),
        );
        let expected = num(&case["out"]);
        if !same_f64(got, expected) {
            mismatches.push(format!(
                "unit={unit} base={base} markers={set_name} pace={} owner={owner} diff={diff:?}: got={got} expected={expected}",
                case["pace"]
            ));
        }
    }
    assert!(
        mismatches.is_empty(),
        "rozbieznosci z pinem ({}): {:?}",
        mismatches.len(),
        &mismatches[..mismatches.len().min(10)]
    );
}

#[test]
fn max_hp_zgodne_z_pinem() {
    let doc = parse_vectors();
    let cases = doc["hp"].as_array().expect("hp");
    assert!(cases.len() >= 200, "wektory HP: {}", cases.len());
    let mut mismatches = Vec::new();
    for case in cases {
        let def = &case["def"];
        // Zdrowie bazowe liczone jak web unitHealth(def): klucz `health` przed `Health`.
        let base = unit_health_value(Some(def));
        let expected_base = num(&case["baseHealth"]);
        if !same_f64(base, expected_base) {
            mismatches.push(format!(
                "unit={} baseHealth: got={base} expected={expected_base}",
                case["unit"]
            ));
            continue;
        }
        let progress = ReplaceUnitProgress {
            parametry_bonus_proc: case["parametryBonusProc"].as_f64(),
            battles_survived: case["battlesSurvived"].as_f64(),
        };
        let got = replace_max_hp(base, progress);
        let expected = num(&case["out"]);
        if !same_f64(got, expected) {
            mismatches.push(format!(
                "unit={} progress={progress:?}: got={got} expected={expected}",
                case["unit"]
            ));
        }
    }
    assert!(
        mismatches.is_empty(),
        "rozbieznosci HP z pinem ({}): {:?}",
        mismatches.len(),
        &mismatches[..mismatches.len().min(10)]
    );
}

#[test]
fn tabela_produkcyjna_koszt_i_hp_z_danych_pinu() {
    let doc = parse_vectors();
    let pin: BTreeMap<String, (Option<f64>, f64)> = doc["pinData"]
        .as_array()
        .expect("pinData")
        .iter()
        .map(|row| {
            (
                row["unit"].as_str().expect("unit").to_owned(),
                (row["base"].as_f64(), num(&row["baseHealth"])),
            )
        })
        .collect();
    // Bez markerow, tempo `niski`, trudnosc Normal: koszt tabeli = koszt bazowy po skali epoki.
    let table = production_replace_defs_for_civ("", "niski", Difficulty::Normal);
    let mut data_diff = Vec::new();
    for (unit, (pin_base, pin_health)) in &pin {
        let Some(def) = table.get(unit) else {
            data_diff.push(format!("{unit}: brak w units.json Rust"));
            continue;
        };
        if let Some(base) = pin_base {
            if !same_f64(def.money_cost, *base) {
                data_diff.push(format!("{unit}: koszt Rust={} pin={base}", def.money_cost));
            }
        }
        if !same_f64(def.max_hp, *pin_health) {
            data_diff.push(format!(
                "{unit}: health Rust={} pin={pin_health}",
                def.max_hp
            ));
        }
    }
    // Rozbieznosci to DANE (units.json Rust vs pin), nie port: wypisane, nie rozstrzygane.
    eprintln!(
        "ROZBIEZNOSCI DANYCH (koszt/health, {} pozycji):\n{}",
        data_diff.len(),
        data_diff.join("\n")
    );
    assert!(
        table.len() >= 70,
        "tabela produkcyjna: {} jednostek",
        table.len()
    );
}

/// Straznik pina dla sekcji `productionMoney`: SHA-256 tekstu funkcji produkcyjnych (macierz cywilizacji,
/// `civProductionCostBonusyForCivKey`) i pliku `civ-matrix.json` uzytych przez generator.
const EXPECTED_PRODUCTION_SHA256: &str =
    "250c5c695dd3532468475a71d0e365d6f414f0af40d05896227df2b861806eb4";

/// Tabela PRODUKCYJNA (`production_replace_defs_for_civ`, ta sama droga co komenda gracza) vs pin:
/// cywilizacje z rabatem i tempem oraz `""` (brak wiersza macierzy), tempo i trudnosc.
/// Przypadki z rozbieznoscia DANYCH (baza kosztu Rust != pin) sa wypisywane i pomijane, nie ukrywane.
#[test]
fn tabela_produkcyjna_koszt_zgodny_z_pinem_per_cywilizacja() {
    let doc = parse_vectors();
    assert_eq!(
        doc["meta"]["productionTextSha256"].as_str(),
        Some(EXPECTED_PRODUCTION_SHA256),
        "wektory produkcyjne pochodza z innego tekstu pinu"
    );
    let cases = doc["productionMoney"].as_array().expect("productionMoney");
    assert!(cases.len() >= 200, "wektory produkcyjne: {}", cases.len());

    let mut tables: BTreeMap<(String, String, String), BTreeMap<String, ReplaceUnitDef>> =
        BTreeMap::new();
    let mut compared = 0usize;
    let mut zulusi_discounted = 0usize;
    let mut data_skipped: BTreeSet<String> = BTreeSet::new();
    let mut mismatches = Vec::new();
    for case in cases {
        let civ = case["civ"].as_str().expect("civ");
        let unit = case["unit"].as_str().expect("unit");
        let pace = case["pace"].as_str().expect("pace");
        let diff = case["diff"].as_str().expect("diff");
        let base = num(&case["base"]);
        let expected = num(&case["out"]);
        if !production_base_gold(unit).is_some_and(|rust| same_f64(rust, base)) {
            data_skipped.insert(unit.to_owned());
            continue;
        }
        let table = tables
            .entry((civ.to_owned(), pace.to_owned(), diff.to_owned()))
            .or_insert_with(|| production_replace_defs_for_civ(civ, pace, difficulty_of(diff)));
        let Some(def) = table.get(unit) else {
            mismatches.push(format!("{unit}: brak w tabeli produkcyjnej"));
            continue;
        };
        compared += 1;
        if civ == "zulusi" && expected != base {
            zulusi_discounted += 1;
        }
        if !same_f64(def.money_cost, expected) {
            mismatches.push(format!(
                "civ={civ} unit={unit} pace={pace} diff={diff}: got={} expected={expected}",
                def.money_cost
            ));
        }
    }
    eprintln!(
        "PARYTET PRODUKCYJNY: porownano {compared} przypadkow, zulusi z rabatem/tempem {zulusi_discounted}; \
         POMINIETE (rozbieznosc DANYCH units.json, baza Rust != pin): {data_skipped:?}"
    );
    assert!(
        mismatches.is_empty(),
        "rozbieznosci produkcyjne z pinem ({}): {:?}",
        mismatches.len(),
        &mismatches[..mismatches.len().min(10)]
    );
    assert!(
        compared >= 200,
        "porownane przypadki produkcyjne: {compared}"
    );
    assert!(
        zulusi_discounted >= 20,
        "przypadki z rabatem i tempem (zulusi): {zulusi_discounted}"
    );
}
