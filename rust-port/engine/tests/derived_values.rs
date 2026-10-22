//! Testy KSZTAŁTU i KOMPLETNOŚCI tabel wartości rozwiniętych (P3-19 FLATTEN-MULTIPLIERS).
//!
//! Tabele `data/derived/*.json` są edytowalnym źródłem prawdy dla ręcznego balansu.
//! Te testy NIE sprawdzają zgodności liczb ze wzorem mnożnikowym weba (to blokowałoby
//! ręczny balans). Sprawdzają: każda jednostka/budynek występuje dokładnie raz, klucze
//! zasobów mają właściwy kształt, wartości są dodatnimi liczbami całkowitymi, a kod
//! domeny czyta dokładnie te liczby z tabeli.

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::data::derived::{parse_building_stock_costs, parse_unit_stock_costs, StockMap};
use civ_engine::data::units_combat::parse_units;
use civ_engine::domain::building_costs::canonical_building_costs;
use civ_engine::domain::recruitment::{canonical_recruitment_costs, recruitment_for};

const MOUNT_EXEMPT_UNIT: &str = "Rydwan (woły)";

const KNOWN_STOCK_KEYS: &[&str] = &[
    "drewno",
    "kamien",
    "glina",
    "ruda",
    "ruda_zelaza",
    "ruda_cyny",
    "cegla",
    "ceramika",
    "braz",
    "zelazo",
    "stal",
    "sol",
    "zloto",
    "wegiel",
    "kon",
];

const CANONICAL_BUILDING_IDS: [&str; 42] = [
    "stolarnia",
    "kamieniarski",
    "kuznia",
    "odlewnia_brazu",
    "odlewnia_zelaza",
    "wielka_odlewnia",
    "targowisko",
    "port",
    "port_wielki",
    "spichlerz",
    "spichlerz_ii",
    "garncarnia",
    "cegielnia",
    "kamienne_kregi",
    "swiatynia",
    "biblioteka",
    "studnia",
    "akwedukt",
    "mennica",
    "palisada",
    "mury",
    "koszary",
    "magazyn",
    "stela",
    "palac",
    "palac_ii",
    "palac_iii",
    "kuznia_zelaza",
    "wielka_kuznia",
    "fort",
    "baszta",
    "warsztat_oblezniczy",
    "akademia",
    "teatr",
    "sad",
    "dom_starszyzny",
    "dwor_zarzadcy",
    "pretorium",
    "trybunal",
    "garnizon",
    "laznia_publiczna",
    "akademia_wojskowa",
];

/// Shape helper: lower-case and strip Polish diacritics (the domain key convention).
fn domain_key(name: &str) -> String {
    name.to_lowercase()
        .chars()
        .map(|c| match c {
            'ą' => 'a',
            'ć' => 'c',
            'ę' => 'e',
            'ł' => 'l',
            'ń' => 'n',
            'ó' => 'o',
            'ś' => 's',
            'ź' | 'ż' => 'z',
            other => other,
        })
        .collect()
}

fn keys(map: &StockMap) -> BTreeSet<&str> {
    map.keys().map(String::as_str).collect()
}

#[test]
fn unit_table_has_one_row_per_units_json_record_and_no_extra_rows() {
    let records = parse_units().expect("units.json parses");
    let table = parse_unit_stock_costs().expect("unit table parses");

    assert_eq!(records.len(), 75);
    assert_eq!(table.wiersze.len(), records.len());

    let table_ids: BTreeSet<&str> = table
        .wiersze
        .iter()
        .map(|row| row.jednostka.as_str())
        .collect();
    assert_eq!(
        table_ids.len(),
        table.wiersze.len(),
        "duplicate jednostka rows"
    );
    let record_ids: BTreeSet<&str> = records.iter().map(|r| r.jednostka.as_str()).collect();
    assert_eq!(table_ids, record_ids);
}

#[test]
fn unit_table_epoch_field_matches_units_json() {
    let records = parse_units().expect("units.json parses");
    let table = parse_unit_stock_costs().expect("unit table parses");
    let by_id: BTreeMap<&str, &str> = records
        .iter()
        .map(|r| (r.jednostka.as_str(), r.epoka.as_str()))
        .collect();

    for row in &table.wiersze {
        assert_eq!(
            by_id.get(row.jednostka.as_str()).copied(),
            Some(row.epoka.as_str()),
            "epoka of {}",
            row.jednostka
        );
        assert!(
            ["Kamień", "Brąz", "Żelazo"].contains(&row.epoka.as_str()),
            "unknown epoka {} for {}",
            row.epoka,
            row.jednostka
        );
    }
}

#[test]
fn unit_table_key_shape_and_positive_integer_values() {
    let records = parse_units().expect("units.json parses");
    let table = parse_unit_stock_costs().expect("unit table parses");
    let by_id: BTreeMap<&str, _> = records.iter().map(|r| (r.jednostka.as_str(), r)).collect();

    for row in &table.wiersze {
        let record = by_id[row.jednostka.as_str()];
        let id = row.jednostka.as_str();

        // Stock keys: the resource named in units.json, plus `kon` for Mount (except the exempt ox chariot).
        let mut expected_stock: BTreeSet<&str> = BTreeSet::new();
        let resource_key = record
            .surowiec
            .as_deref()
            .map(str::trim)
            .filter(|r| !r.is_empty() && *r != "-");
        if let Some(name) = resource_key {
            expected_stock.insert(
                KNOWN_STOCK_KEYS
                    .iter()
                    .copied()
                    .find(|k| *k == domain_key(name))
                    .unwrap_or_else(|| panic!("unknown stock key for {id}")),
            );
        }
        if record.typ == "Mount" && id != MOUNT_EXEMPT_UNIT {
            expected_stock.insert("kon");
        }
        assert_eq!(keys(&row.surowiec), expected_stock, "stock key set of {id}");

        let upkeep_name = record
            .utrzymanie_surowiec
            .as_deref()
            .map(str::trim)
            .filter(|r| !r.is_empty() && *r != "-");
        let expected_upkeep: BTreeSet<&str> = match upkeep_name {
            Some(name) => std::iter::once(
                KNOWN_STOCK_KEYS
                    .iter()
                    .copied()
                    .find(|k| *k == domain_key(name))
                    .unwrap_or_else(|| panic!("unknown upkeep key for {id}")),
            )
            .collect(),
            None => BTreeSet::new(),
        };
        assert_eq!(
            keys(&row.utrzymanie_surowiec),
            expected_upkeep,
            "upkeep key set of {id}"
        );

        for (key, value) in row.surowiec.iter().chain(row.utrzymanie_surowiec.iter()) {
            assert!(*value > 0, "{id}: {key} must be a positive integer");
        }
    }
}

#[test]
fn unit_table_keeps_the_units_json_base_as_provenance() {
    let records = parse_units().expect("units.json parses");
    let table = parse_unit_stock_costs().expect("unit table parses");
    let by_id: BTreeMap<&str, _> = records.iter().map(|r| (r.jednostka.as_str(), r)).collect();

    for row in &table.wiersze {
        let record = by_id[row.jednostka.as_str()];
        assert_eq!(
            row.baza.surowiec, record.surowiec,
            "baza.surowiec of {}",
            row.jednostka
        );
        assert_eq!(
            row.baza.surowiec_ilosc, record.surowiec_ilosc,
            "baza.surowiec_ilosc of {}",
            row.jednostka
        );
        assert_eq!(
            row.baza.utrzymanie_surowiec, record.utrzymanie_surowiec,
            "baza.utrzymanie_surowiec of {}",
            row.jednostka
        );
        assert_eq!(
            row.baza.utrzymanie_surowiec_ilosc, record.utrzymanie_surowiec_ilosc,
            "baza.utrzymanie_surowiec_ilosc of {}",
            row.jednostka
        );
    }
}

#[test]
fn building_table_has_exactly_the_42_canonical_ids_once_each() {
    let table = parse_building_stock_costs().expect("building table parses");
    assert_eq!(table.wiersze.len(), CANONICAL_BUILDING_IDS.len());

    let ids: BTreeSet<&str> = table
        .wiersze
        .iter()
        .map(|row| row.budynek.as_str())
        .collect();
    assert_eq!(ids.len(), table.wiersze.len(), "duplicate budynek rows");
    let expected: BTreeSet<&str> = CANONICAL_BUILDING_IDS.iter().copied().collect();
    assert_eq!(ids, expected);
}

#[test]
fn building_table_key_shape_is_known_resources_and_mirrors_the_base_keys() {
    let table = parse_building_stock_costs().expect("building table parses");

    for row in &table.wiersze {
        let id = row.budynek.as_str();
        assert!((1..=4).contains(&row.epoka_wejscia), "epokaWejscia of {id}");
        assert_eq!(
            keys(&row.koszt_surowce),
            keys(&row.baza_koszt_surowce),
            "stock keys of {id}"
        );
        assert_eq!(
            keys(&row.utrzymanie_surowcowe_na_ture),
            keys(&row.koszt_surowce),
            "building upkeep keys of {id}"
        );
        for key in row.koszt_surowce.keys() {
            assert!(
                KNOWN_STOCK_KEYS.contains(&key.as_str()),
                "{id}: unknown resource key {key}"
            );
        }
        for (key, value) in &row.koszt_surowce {
            assert!(*value > 0, "{id}: {key} must be a positive integer");
        }
    }
}

#[test]
fn building_table_palac_has_no_stock_cost_and_others_do() {
    let table = parse_building_stock_costs().expect("building table parses");
    let palac = table
        .wiersze
        .iter()
        .find(|row| row.budynek == "palac")
        .expect("palac row");
    assert!(palac.koszt_surowce.is_empty());
    assert!(palac.utrzymanie_surowcowe_na_ture.is_empty());

    let stolarnia = table
        .wiersze
        .iter()
        .find(|row| row.budynek == "stolarnia")
        .expect("stolarnia row");
    assert!(!stolarnia.koszt_surowce.is_empty());
}

#[test]
fn domain_recruitment_reads_the_unit_table_values_without_recomputing_them() {
    let table = parse_unit_stock_costs().expect("unit table parses");
    for row in &table.wiersze {
        let unit = recruitment_for(&row.jednostka).expect("canonical unit");
        assert_eq!(
            unit.stock_costs(),
            &row.surowiec,
            "stock of {}",
            row.jednostka
        );
        assert_eq!(
            unit.resource_upkeep_costs(),
            &row.utrzymanie_surowiec,
            "upkeep of {}",
            row.jednostka
        );
    }
    assert_eq!(canonical_recruitment_costs().len(), table.wiersze.len());
}

#[test]
fn domain_building_costs_read_the_building_table_values_without_recomputing_them() {
    let table = parse_building_stock_costs().expect("building table parses");
    let by_id: BTreeMap<&str, &StockMap> = table
        .wiersze
        .iter()
        .map(|row| (row.budynek.as_str(), &row.koszt_surowce))
        .collect();

    let catalog = canonical_building_costs();
    assert_eq!(catalog.len(), table.wiersze.len());
    for cost in &catalog {
        assert_eq!(
            cost.resource_costs(),
            by_id[cost.building_id.as_str()],
            "resource cost of {}",
            cost.building_id
        );
    }
}

// ---------------------------------------------------------------------------
// P3-19 runda 3: tabele Pracy budynków i złota jednostek (KSZTAŁT i KOMPLETNOŚĆ).
// Testy NIE porównują liczb z kosztBudowy / przyrostKosztu / mnożnikiem ery: wartości są
// edytowalne przez właściciela. Sprawdzają komplet wierszy, brak duplikatów, zakres pól
// i to, że kod domeny czyta tabelę bez przeliczania.
// ---------------------------------------------------------------------------

#[test]
fn work_table_has_exactly_the_42_buildings_once_each_and_positive_values() {
    use civ_engine::data::derived::parse_building_work_costs;

    let table = parse_building_work_costs().expect("work table parses");
    let ids: BTreeSet<&str> = table
        .wiersze
        .iter()
        .map(|row| row.budynek.as_str())
        .collect();
    assert_eq!(table.wiersze.len(), 42, "one work row per building");
    assert_eq!(ids.len(), table.wiersze.len(), "no duplicate work rows");
    for row in &table.wiersze {
        assert!(
            row.praca_bazowa > 0,
            "praca_bazowa of {} must be > 0",
            row.budynek
        );
        assert!(
            matches!(row.baza.mnoznik_ery, 1 | 2 | 4),
            "provenance era factor of {} must be 1, 2 or 4",
            row.budynek
        );
    }
}

#[test]
fn work_table_is_read_by_the_domain_without_recomputation() {
    use civ_engine::data::derived::parse_building_work_costs;

    let table = parse_building_work_costs().expect("work table parses");
    let by_id: BTreeMap<&str, (u32, u32)> = table
        .wiersze
        .iter()
        .map(|row| (row.budynek.as_str(), (row.praca_bazowa, row.praca_przyrost)))
        .collect();
    for cost in civ_engine::domain::building_costs::canonical_building_costs() {
        assert_eq!(
            (cost.base_work, cost.work_increment),
            by_id[cost.building_id.as_str()],
            "work values of {}",
            cost.building_id
        );
    }
}

#[test]
fn gold_table_has_exactly_the_75_units_once_each_and_known_eras() {
    use civ_engine::data::derived::parse_unit_gold_costs;

    let units = parse_units().expect("units.json parses");
    let table = parse_unit_gold_costs().expect("gold table parses");
    let ids: BTreeSet<&str> = table
        .wiersze
        .iter()
        .map(|row| row.jednostka.as_str())
        .collect();
    assert_eq!(table.wiersze.len(), 75, "one gold row per unit");
    assert_eq!(ids.len(), table.wiersze.len(), "no duplicate gold rows");
    for record in &units {
        assert!(
            ids.contains(record.jednostka.as_str()),
            "gold row missing for {}",
            record.jednostka
        );
    }
    for row in &table.wiersze {
        assert!(
            matches!(row.epoka.as_str(), "Kamień" | "Brąz" | "Żelazo"),
            "epoka of {} is one of the three eras",
            row.jednostka
        );
    }
}

#[test]
fn domain_recruitment_reads_the_gold_table_without_recomputation() {
    use civ_engine::data::derived::parse_unit_gold_costs;

    let table = parse_unit_gold_costs().expect("gold table parses");
    let by_id: BTreeMap<&str, (u32, u32)> = table
        .wiersze
        .iter()
        .map(|row| {
            (
                row.jednostka.as_str(),
                (row.pieniadz_koszt, row.utrzymanie_pieniadz_ture),
            )
        })
        .collect();
    for unit in civ_engine::domain::recruitment::canonical_recruitment_costs() {
        assert_eq!(
            (unit.gold_cost, unit.gold_upkeep),
            by_id[unit.unit_id.as_str()],
            "gold values of {}",
            unit.unit_id
        );
    }
}

// ---------------------------------------------------------------------------
// Runda 4 (P3-19): KSZTAŁT i KOMPLETNOŚĆ tabel wierszy 12-18, 25 oraz osi (b).
// Nie porównują liczb ze wzorem weba. Sprawdzają: każdy budynek x każdy poziom 1..maks
// (lub każda jednostka / technologia / cud / ulepszenie / epoka) występuje dokładnie raz,
// każda kombinacja osi (b) występuje dokładnie raz, wartości są liczbami >= 0 (>= 1 dla Pracy),
// osie w pliku zgadzają się z listą stanów, a lookup zwraca wartość dla każdego klucza.
// ---------------------------------------------------------------------------

use civ_engine::data::buildings_tech::{parse_buildings, parse_wonders};
use civ_engine::data::derived::{
    parse_building_gold_upkeep, parse_building_work_states, parse_improvement_work, parse_racje,
    parse_research_costs, parse_storage_caps, parse_unit_food, parse_unit_gold_states,
    parse_wonder_work,
};

const PACE_AXIS: [&str; 3] = ["niski", "normalny", "wysoki"];
const TRYB_AXIS: [&str; 5] = [
    "normalny",
    "latwy_gracz",
    "latwy_ai",
    "trudny_gracz",
    "trudny_ai",
];
const ZNIZKA_BUDYNKI_AXIS: [f64; 2] = [0.0, 0.2];
const ZNIZKA_REKRUT_AXIS: [f64; 2] = [0.0, 0.1];
const POZIOM_TRUDNOSCI_AXIS: [&str; 3] = ["easy", "normal", "hard"];

fn znizka_key(z: f64) -> i64 {
    (z * 1000.0).round() as i64
}

fn expected_work_keys() -> BTreeSet<(String, String, i64)> {
    let mut out = BTreeSet::new();
    for p in PACE_AXIS {
        for t in TRYB_AXIS {
            for z in ZNIZKA_BUDYNKI_AXIS {
                out.insert((p.to_string(), t.to_string(), znizka_key(z)));
            }
        }
    }
    out
}

#[test]
fn building_work_states_cover_each_building_level_and_axis_combination_exactly_once() {
    let buildings = parse_buildings().expect("buildings.json parses");
    let table = parse_building_work_states().expect("building work states parse");

    let expected_rows: usize = buildings.iter().map(|b| b.maks_poziom as usize).sum();
    assert_eq!(expected_rows, 65, "42 budynki, poziomy 1..maks");
    assert_eq!(table.wiersze.len(), expected_rows);
    assert_eq!(table.osie["pace"], serde_json::json!(PACE_AXIS));
    assert_eq!(table.osie["tryb"], serde_json::json!(TRYB_AXIS));

    let mut seen = BTreeSet::new();
    for row in &table.wiersze {
        let b = buildings
            .iter()
            .find(|b| b.id == row.budynek)
            .expect("budynek exists in buildings.json");
        assert!(row.poziom >= 1 && i64::from(row.poziom) <= b.maks_poziom);
        assert!(
            seen.insert((row.budynek.clone(), row.poziom)),
            "duplicate row"
        );
        assert_eq!(row.wartosci.len(), 30, "3 pace x 5 tryb x 2 zniżki");
        let keys: BTreeSet<(String, String, i64)> = row
            .wartosci
            .iter()
            .map(|w| {
                (
                    w.pace.clone(),
                    w.tryb.clone(),
                    znizka_key(w.znizka_cywilizacji),
                )
            })
            .collect();
        assert_eq!(keys, expected_work_keys(), "axis combinations exactly once");
        for w in &row.wartosci {
            assert!(w.praca >= 1, "Praca budynku >= 1");
            assert_eq!(
                table.lookup(
                    &row.budynek,
                    row.poziom,
                    &w.pace,
                    &w.tryb,
                    w.znizka_cywilizacji
                ),
                Some(w.praca),
                "lookup returns the stored value"
            );
        }
    }
    assert_eq!(
        table.lookup("stolarnia", 99, "niski", "normalny", 0.0),
        None,
        "unknown level"
    );
}

#[test]
fn unit_gold_states_cover_each_unit_and_axis_combination_exactly_once() {
    let units = parse_units().expect("units.json parses");
    let table = parse_unit_gold_states().expect("unit gold states parse");

    assert_eq!(units.len(), 75);
    assert_eq!(table.wiersze.len(), 75);
    let axis: Vec<f64> = serde_json::from_value(table.osie["znizka_rekrutacji"].clone())
        .expect("znizka_rekrutacji axis is a list of numbers");
    assert_eq!(axis, ZNIZKA_REKRUT_AXIS.to_vec());

    let mut ids = BTreeSet::new();
    let mut expected = BTreeSet::new();
    for p in PACE_AXIS {
        for t in TRYB_AXIS {
            for z in ZNIZKA_REKRUT_AXIS {
                expected.insert((p.to_string(), t.to_string(), znizka_key(z)));
            }
        }
    }
    for row in &table.wiersze {
        assert!(ids.insert(row.jednostka.clone()), "duplicate jednostka");
        assert_eq!(row.wartosci.len(), 30);
        let keys: BTreeSet<(String, String, i64)> = row
            .wartosci
            .iter()
            .map(|w| {
                (
                    w.pace.clone(),
                    w.tryb.clone(),
                    znizka_key(w.znizka_rekrutacji),
                )
            })
            .collect();
        assert_eq!(keys, expected);
        for w in &row.wartosci {
            assert_eq!(
                table.lookup(&row.jednostka, &w.pace, &w.tryb, w.znizka_rekrutacji),
                Some(w.pieniadz)
            );
        }
    }
    for u in &units {
        assert!(
            ids.contains(&u.jednostka),
            "every units.json unit has a row"
        );
    }
}

#[test]
fn building_gold_upkeep_has_one_row_per_building_level() {
    let buildings = parse_buildings().expect("buildings parse");
    let table = parse_building_gold_upkeep().expect("upkeep parses");
    let expected: usize = buildings.iter().map(|b| b.maks_poziom as usize).sum();
    assert_eq!(table.wiersze.len(), expected);
    let mut seen = BTreeSet::new();
    for row in &table.wiersze {
        assert!(
            seen.insert((row.budynek.clone(), row.poziom)),
            "duplicate row"
        );
        assert!(buildings.iter().any(|b| b.id == row.budynek));
    }
}

#[test]
fn unit_food_has_twelve_states_per_unit_and_integer_hundredths() {
    let units = parse_units().expect("units parse");
    let table = parse_unit_food().expect("unit food parses");
    assert_eq!(table.wiersze.len(), units.len());
    assert_eq!(
        table.osie["poziom_trudnosci"],
        serde_json::json!(POZIOM_TRUDNOSCI_AXIS)
    );
    for row in &table.wiersze {
        assert_eq!(row.wartosci.len(), 12, "2 stany x 2 terytoria x 3 poziomy");
        let keys: BTreeSet<(String, String, String)> = row
            .wartosci
            .iter()
            .map(|w| {
                (
                    w.stan.clone(),
                    w.terytorium.clone(),
                    w.poziom_trudnosci.clone(),
                )
            })
            .collect();
        assert_eq!(keys.len(), 12, "each state exactly once");
        for w in &row.wartosci {
            let diff = (f64::from(w.zywnosc_setne) - w.zywnosc_dokladnie * 100.0).abs();
            assert!(diff < 1e-6, "setne = dokladnie x 100 (spójność kolumn)");
        }
    }
}

#[test]
fn racje_cover_every_half_step_from_zero_to_six_once() {
    let table = parse_racje().expect("racje parse");
    assert_eq!(table.wiersze.len(), 13);
    let mut seen = BTreeSet::new();
    for row in &table.wiersze {
        assert!(seen.insert(row.poziom_racji.to_bits()), "duplicate poziom");
        assert!((0.0..=6.0).contains(&row.poziom_racji));
    }
}

#[test]
fn research_costs_cover_each_tech_tempo_and_axis_once() {
    let table = parse_research_costs().expect("research parse");
    assert_eq!(table.wiersze.len(), 32);
    let mut names = BTreeSet::new();
    for row in &table.wiersze {
        assert!(
            names.insert(row.technologia.clone()),
            "duplicate technologia"
        );
        assert_eq!(row.wartosci.len(), 15, "3 tempa x 5 trybów");
        let keys: BTreeSet<(String, String)> = row
            .wartosci
            .iter()
            .map(|w| (w.tempo.clone(), w.tryb.clone()))
            .collect();
        assert_eq!(keys.len(), 15);
        assert!(row.wartosci.iter().all(|w| w.koszt >= 1));
    }
}

#[test]
fn improvement_and_wonder_tables_cover_every_entry_once() {
    let imp = parse_improvement_work().expect("improvement parse");
    assert_eq!(imp.wiersze.len(), 22);
    let names: BTreeSet<&str> = imp.wiersze.iter().map(|r| r.ulepszenie.as_str()).collect();
    assert_eq!(names.len(), 22, "no duplicate ulepszenie");

    let wonders = parse_wonders().expect("wonders parse");
    let table = parse_wonder_work().expect("wonder work parse");
    assert_eq!(table.wiersze.len(), wonders.cuda.len());
    let ids: BTreeSet<&str> = table.wiersze.iter().map(|r| r.cud.as_str()).collect();
    assert_eq!(ids.len(), table.wiersze.len());
    for w in &wonders.cuda {
        assert!(
            ids.contains(w.id.as_str()),
            "every wonders.json cud has a row"
        );
    }
}

#[test]
fn storage_caps_cover_each_era_and_difficulty_once() {
    let table = parse_storage_caps().expect("storage parse");
    assert_eq!(table.wiersze.len(), 3);
    for row in &table.wiersze {
        let diffs: BTreeSet<&str> = row
            .wartosci
            .iter()
            .map(|w| w.poziom_trudnosci.as_str())
            .collect();
        assert_eq!(diffs.len(), 3);
        assert!(diffs.iter().all(|d| POZIOM_TRUDNOSCI_AXIS.contains(d)));
    }
}

#[test]
fn trade_multipliers_cover_each_constant_once_with_values() {
    use civ_engine::data::derived::parse_trade_multipliers;
    use civ_engine::domain::trade::{
        port_sea_trade_bonus_pieniadz, trade_route_building_bonus_rate,
    };
    let table = parse_trade_multipliers().expect("trade multipliers parse");
    let ids: BTreeSet<&str> = table.wiersze.iter().map(|r| r.id.as_str()).collect();
    assert_eq!(table.wiersze.len(), 6);
    assert_eq!(ids.len(), 6);
    let row = |id: &str| {
        table
            .wiersze
            .iter()
            .find(|r| r.id == id)
            .unwrap_or_else(|| panic!("brak wiersza {id}"))
    };
    // Wektory Rust-autorskie: wartosci z weba edb8fb56 (zob. dowody runu).
    assert_eq!(
        row("TRADE_ROUTE_INTERNATIONAL_MULTIPLIER").wartosc,
        Some(2.0)
    );
    assert_eq!(row("TRADE_ROUTE_INCOME_HALF_DIVISOR").wartosc, Some(2.0));
    assert_eq!(row("FALLBACK_TRADE_MULT").wartosc, Some(1.0));
    assert_eq!(row("TRADE_ROUTE_BUILDING_BONUS_RATE").wartosc, Some(0.05));
    assert_eq!(row("PORT_SEA_TRADE_BONUS_PIENIADZ").wartosc, Some(1.0));
    let delta = row("MNOZNIK_HANDEL_TRUDNOSC_DELTA");
    assert_eq!(delta.klasa, "b");
    assert_eq!(delta.wartosc, None);
    let by_difficulty = delta
        .wartosci_po_trudnosci
        .as_ref()
        .expect("wiersz klasy b ma wartosci po trudnosci");
    assert_eq!(by_difficulty.len(), 3);
    assert_eq!(by_difficulty.get("easy"), Some(&0.5));
    assert_eq!(by_difficulty.get("normal"), Some(&0.0));
    assert_eq!(by_difficulty.get("hard"), Some(&-0.5));
    // Klasa a: dokladnie jedna wartosc, brak mapy po trudnosci.
    assert!(table
        .wiersze
        .iter()
        .filter(|r| r.klasa == "a")
        .all(|r| r.wartosc.is_some() && r.wartosci_po_trudnosci.is_none()));
    // Status kazdego wiersza: ROZWINIETE (czytany w domenie) albo BEZ MECHANIKI.
    assert!(table
        .wiersze
        .iter()
        .all(|r| r.rust.starts_with("BEZ MECHANIKI") || r.rust.starts_with("ROZWINI")));
    assert_eq!(
        table
            .wiersze
            .iter()
            .filter(|r| r.rust.starts_with("ROZWINI"))
            .count(),
        2
    );
    // Wiazanie domeny: wartosci odczytywane z tabeli daja wektory weba.
    assert_eq!(trade_route_building_bonus_rate(), 0.05);
    assert_eq!(port_sea_trade_bonus_pieniadz(), 1);
}
