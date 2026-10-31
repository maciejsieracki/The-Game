//! P6.8H2 partia B: `resource-access.ts` (potencjał / dostęp aktywny / etykiety złóż).
//! Wektory z pinu `91dc998a` (bundle esbuild, generator w `tests/p6_8h2_vectors/` i w runie).
//! Dokument tematu: `dyspozycje/rust-port/p6/P6-8H2-DOSTEP-ZASOBOW-B.md`.

use std::collections::{BTreeMap, HashSet};

use civ_engine::domain::improvement_build::{BuildHex, BuildMap};
use civ_engine::domain::improvements::TerrainType;
use civ_engine::domain::resource_access::active_access::{
    get_city_resource_access_for_city, hex_deposit_display_label, hex_hidden_deposit_hint,
    improvement_unlock_active_on_hex, label_for_hex, labels_for_improvement_unlock,
    parse_surowiec_odblokowany, pl_collation_cmp, ResourceAccessCity, ResourceAccessOptions,
    SurowiecRaw,
};
use civ_engine::domain::resource_access::Placed;
use civ_engine::domain::start_position::Overlay;
use civ_engine::domain::terrain::city_range_for_population;
use serde_json::Value;

const CASES: &str = include_str!("p6_8h2_vectors/cases.json");
const VECTORS: &str = include_str!("p6_8h2_vectors/vectors.json");

fn parse(text: &str) -> Value {
    serde_json::from_str(text).expect("wektory P6.8H2 sa poprawnym JSON-em")
}

/// Web liczba: `null`/brak = `None`, `"NaN"` = NaN, liczba = `Some`.
fn num(v: &Value) -> Option<f64> {
    match v {
        Value::Null => None,
        Value::Number(n) => n.as_f64(),
        Value::String(s) if s == "NaN" => Some(f64::NAN),
        other => panic!("nieobslugiwana liczba w wektorze: {other}"),
    }
}

fn terrain(name: &str) -> TerrainType {
    match name {
        "plytkie_morze" => TerrainType::PlytkieMorze,
        "rownina" => TerrainType::Rownina,
        other => panic!("nieznany teren w wektorze: {other}"),
    }
}

fn overlay(v: &Value) -> Overlay {
    match v {
        Value::Null => Overlay::Brak,
        Value::String(s) => Overlay::from_web_value(s)
            .unwrap_or_else(|| panic!("nieznana nakladka w wektorze: {s}")),
        other => panic!("nakladka nie jest napisem: {other}"),
    }
}

/// Heks z wektora (`q`, `r`, `teren`, `nakladka`, `zloze`); `zlozeMinEra` pomijany (Z3).
fn hex_from_case(h: &Value) -> BuildHex {
    let q = h["q"].as_i64().unwrap() as i32;
    let r = h["r"].as_i64().unwrap() as i32;
    let mut hex = BuildHex::new(
        q,
        r,
        terrain(h["teren"].as_str().unwrap()),
        overlay(&h["nakladka"]),
    );
    hex.zloze = h["zloze"].as_str().map(str::to_owned);
    hex
}

fn build_map(hexes: &Value) -> BuildMap {
    let list: Vec<BuildHex> = hexes
        .as_array()
        .unwrap()
        .iter()
        .map(hex_from_case)
        .collect();
    BuildMap::new(list, Vec::new())
}

/// Web `cityBorderRadius(kultura)` z tabeli wektorów (klucz = `String(kultura)`, `NaN` jako "NaN").
fn border_fn(table: &Value) -> impl Fn(f64) -> f64 + '_ {
    move |kultura: f64| {
        let key = if kultura.is_nan() {
            "NaN".to_owned()
        } else {
            format!("{kultura}")
        };
        table[key.as_str()]
            .as_f64()
            .unwrap_or_else(|| panic!("brak wektora cityBorderRadius dla {key}"))
    }
}

enum OwnedPlaced {
    One(String),
    Many(Vec<String>),
}

fn owned_placed(v: &Value) -> Option<Vec<(String, OwnedPlaced)>> {
    if v.is_null() {
        return None;
    }
    Some(
        v.as_array()
            .unwrap()
            .iter()
            .map(|entry| {
                let key = entry[0].as_str().unwrap().to_owned();
                let imp = match &entry[1] {
                    Value::String(s) => OwnedPlaced::One(s.clone()),
                    Value::Array(list) => OwnedPlaced::Many(
                        list.iter()
                            .map(|x| x.as_str().unwrap().to_owned())
                            .collect(),
                    ),
                    other => panic!("nieobslugiwany wpis placed: {other}"),
                };
                (key, imp)
            })
            .collect(),
    )
}

fn placed_view(owned: &[(String, OwnedPlaced)]) -> Vec<(&str, Placed<'_>)> {
    owned
        .iter()
        .map(|(key, imp)| {
            let view = match imp {
                OwnedPlaced::One(s) => Placed::One(s.as_str()),
                OwnedPlaced::Many(list) => Placed::Many(list.as_slice()),
            };
            (key.as_str(), view)
        })
        .collect()
}

fn strings(v: &Value) -> Vec<String> {
    v.as_array()
        .unwrap()
        .iter()
        .map(|x| x.as_str().unwrap().to_owned())
        .collect()
}

/// Web `Object.prototype`-klucze z małych liter, które trafiają do `ZLOZE_LABEL` /
/// `METAL_DEPOSIT_MIN_ERA` jako funkcje (rozbieżność udokumentowana w dokumencie tematu).
const PROTOTYPE_ZLOZE_KEYS: [&str; 2] = ["constructor", "__proto__"];

fn is_prototype_zloze(hex: &Value) -> bool {
    hex["zloze"]
        .as_str()
        .map(|z| z.trim().to_lowercase())
        .is_some_and(|z| PROTOTYPE_ZLOZE_KEYS.contains(&z.as_str()))
}

#[test]
fn city_access_matches_pinned_web_vectors() {
    let cases = parse(CASES);
    let vectors = parse(VECTORS);
    let maps = cases["maps"].as_array().unwrap();
    let city_cases = cases["city"].as_array().unwrap();
    let city_vectors = vectors["city"].as_array().unwrap();
    assert_eq!(city_cases.len(), city_vectors.len());
    let mut checked = 0usize;
    for (case, expected) in city_cases.iter().zip(city_vectors) {
        let map_hexes = &maps[case["mapIdx"].as_u64().unwrap() as usize];
        let map = build_map(map_hexes);
        let owned = owned_placed(&case["placed"]);
        let view = owned.as_deref().map(placed_view);
        let built: Option<Vec<String>> = case["options"]["builtIds"]
            .as_array()
            .map(|ids| ids.iter().map(|x| x.as_str().unwrap().to_owned()).collect());
        let livestock: Option<HashSet<String>> = match &case["options"]["livestock"] {
            Value::String(s) if s == "UNDEF" => None,
            Value::Array(list) => Some(
                list.iter()
                    .map(|x| x.as_str().unwrap().to_owned())
                    .collect(),
            ),
            other => panic!("livestock: {other}"),
        };
        let stock: Option<BTreeMap<String, f64>> =
            case["options"]["stock"].as_object().map(|obj| {
                obj.iter()
                    .map(|(k, v)| (k.clone(), num(v).unwrap()))
                    .collect()
            });
        let kultura = num(&case["kultura"]);
        let city = ResourceAccessCity {
            q: case["q"].as_i64().unwrap() as i32,
            r: case["r"].as_i64().unwrap() as i32,
            population: num(&case["population"]).unwrap(),
            kultura,
        };
        let border = border_fn(&vectors["borderTable"]);
        let options = ResourceAccessOptions {
            built_ids: built.as_deref(),
            empire_livestock_unlocks: livestock.as_ref(),
            empire_stock: stock.as_ref(),
        };
        let got = get_city_resource_access_for_city(
            city,
            &map,
            view.as_deref(),
            case["era"].as_i64().unwrap(),
            &border,
            options,
        );
        assert_eq!(
            got.potential,
            strings(&expected["potential"]),
            "potential: {}",
            case["name"]
        );
        assert_eq!(
            got.active,
            strings(&expected["active"]),
            "active: {}",
            case["name"]
        );
        checked += 1;
    }
    assert_eq!(checked, city_cases.len());
}

#[test]
fn hex_labels_match_pinned_web_vectors_except_documented_prototype_keys() {
    let cases = parse(CASES);
    let vectors = parse(VECTORS);
    let hex_cases = cases["hex"].as_array().unwrap();
    let hex_vectors = vectors["hexLabel"].as_array().unwrap();
    assert_eq!(hex_cases.len(), hex_vectors.len());
    let mut prototype_skipped = 0usize;
    for (case, expected) in hex_cases.iter().zip(hex_vectors) {
        if is_prototype_zloze(&case["hex"]) {
            // Web: `ZLOZE_LABEL['constructor']` = funkcja Object; `METAL_DEPOSIT_MIN_ERA` j.w.
            // Rozbieznosc udokumentowana (ZAŁOŻENIE Z5), nie testowana tu wartosciowo.
            prototype_skipped += 1;
            continue;
        }
        let hex = hex_from_case(&case["hex"]);
        let era = case["era"].as_i64().unwrap();
        let display = expected["display"].as_str().map(str::to_owned);
        let hint = expected["hint"].as_str().map(str::to_owned);
        assert_eq!(
            hex_deposit_display_label(&hex, era),
            display,
            "display: {}",
            case["name"]
        );
        assert_eq!(
            hex_hidden_deposit_hint(&hex, era),
            hint,
            "hint: {}",
            case["name"]
        );
        assert_eq!(
            label_for_hex(&hex, era),
            display,
            "labelForHex: {}",
            case["name"]
        );
    }
    assert_eq!(
        prototype_skipped, 72,
        "liczba przypadkow 'constructor' w wektorach"
    );
}

#[test]
fn unlock_activity_matches_pinned_web_vectors() {
    let cases = parse(CASES);
    let vectors = parse(VECTORS);
    let unlock_cases = cases["unlock"].as_array().unwrap();
    let unlock_vectors = vectors["unlock"].as_array().unwrap();
    assert_eq!(unlock_cases.len(), unlock_vectors.len());
    for (case, expected) in unlock_cases.iter().zip(unlock_vectors) {
        let hex = hex_from_case(&case["hex"]);
        let key = case["key"].as_str().unwrap();
        assert_eq!(
            improvement_unlock_active_on_hex(key, &hex),
            expected["active"].as_bool().unwrap(),
            "unlock key={key} hex={}",
            case["hex"]["name"]
        );
    }
}

#[test]
fn labels_for_improvement_unlock_match_pinned_web_vectors() {
    let vectors = parse(VECTORS);
    for entry in vectors["labelsUnlock"].as_array().unwrap() {
        let key = entry["key"].as_str().unwrap();
        let expected = strings(&entry["labels"]);
        assert_eq!(
            labels_for_improvement_unlock(Some(key)),
            expected,
            "key={key:?}"
        );
    }
    assert!(labels_for_improvement_unlock(None).is_empty());
}

#[test]
fn polish_collation_matches_locale_compare_over_label_universe() {
    let vectors = parse(VECTORS);
    let pairs = vectors["plPairs"].as_array().unwrap();
    assert_eq!(pairs.len(), 900);
    for pair in pairs {
        let a = pair[0].as_str().unwrap();
        let b = pair[1].as_str().unwrap();
        let expected = pair[2].as_i64().unwrap();
        let got = match pl_collation_cmp(a, b) {
            std::cmp::Ordering::Less => -1,
            std::cmp::Ordering::Equal => 0,
            std::cmp::Ordering::Greater => 1,
        };
        assert_eq!(got, expected, "localeCompare({a:?}, {b:?}, 'pl')");
    }
}

#[test]
fn surowiec_parse_branches() {
    assert!(parse_surowiec_odblokowany(SurowiecRaw::Absent).is_empty());
    assert!(parse_surowiec_odblokowany(SurowiecRaw::One("")).is_empty());
    assert_eq!(
        parse_surowiec_odblokowany(SurowiecRaw::One("bydlo")),
        ["bydlo"]
    );
    assert_eq!(
        parse_surowiec_odblokowany(SurowiecRaw::One("[\"bydlo\",\"owce\"]")),
        ["bydlo", "owce"]
    );
    assert_eq!(
        parse_surowiec_odblokowany(SurowiecRaw::One("  [\"x\"]")),
        ["x"]
    );
    assert!(parse_surowiec_odblokowany(SurowiecRaw::One("[]")).is_empty());
    // Niepoprawny JSON -> surowy napis (web `return [raw]`).
    assert_eq!(
        parse_surowiec_odblokowany(SurowiecRaw::One("[bad")),
        ["[bad"]
    );
    // JS `String(1)` = "1", `String(null)` = "null".
    assert_eq!(
        parse_surowiec_odblokowany(SurowiecRaw::One("[1,null]")),
        ["1", "null"]
    );
    let list = vec!["a".to_owned(), String::new()];
    assert_eq!(parse_surowiec_odblokowany(SurowiecRaw::List(&list)), list);
}

/// Granice odległości N-1 / N / N+1 względem zasięgu miasta (`hexDistance > sight`).
#[test]
fn sight_boundary_n_minus_1_n_n_plus_1() {
    let sight = city_range_for_population(3.0);
    assert!(sight >= 1.0, "zasieg miasta dla pop=3 musi byc > 0");
    let border = |_: f64| 0.0;
    for (distance, expected) in [(sight - 1.0, true), (sight, true), (sight + 1.0, false)] {
        let d = distance as i32;
        let hex = BuildHex::new(d, 0, TerrainType::Plains, Overlay::Brak);
        let map = BuildMap::new(vec![hex], Vec::new());
        let key = format!("{d},0");
        let placed = [(key.as_str(), Placed::One("kopalnia_zlota"))];
        let city = ResourceAccessCity {
            q: 0,
            r: 0,
            population: 3.0,
            kultura: Some(0.0),
        };
        let got = get_city_resource_access_for_city(
            city,
            &map,
            Some(&placed),
            99,
            &border,
            ResourceAccessOptions::default(),
        );
        assert_eq!(
            got.active.iter().any(|l| l == "Złoto"),
            expected,
            "odleglosc {d} przy zasiegu {sight}"
        );
    }
}

/// `sight > 0` jest bramką: miasto bez zasięgu (pop 0 / NaN) nie widzi nic.
#[test]
fn zero_sight_disables_access_and_potential() {
    let hex = BuildHex::new(0, 0, TerrainType::Plains, Overlay::ZlozeKonia);
    let map = BuildMap::new(vec![hex], Vec::new());
    let border = |_: f64| 0.0;
    for population in [0.0, f64::NAN] {
        let city = ResourceAccessCity {
            q: 0,
            r: 0,
            population,
            kultura: None,
        };
        let got = get_city_resource_access_for_city(
            city,
            &map,
            None,
            99,
            &border,
            ResourceAccessOptions::default(),
        );
        assert!(got.active.is_empty(), "pop={population}");
        assert!(got.potential.is_empty(), "pop={population}");
    }
}

/// Potencjał (złoże) znika, gdy ten sam surowiec jest już aktywny (ABC-19 A).
#[test]
fn active_label_removes_same_label_from_potential() {
    let hex = BuildHex::new(1, 0, TerrainType::Plains, Overlay::ZlozeKonia);
    let map = BuildMap::new(vec![hex], Vec::new());
    let border = |_: f64| 0.0;
    let city = ResourceAccessCity {
        q: 0,
        r: 0,
        population: 3.0,
        kultura: Some(0.0),
    };
    let before = get_city_resource_access_for_city(
        city,
        &map,
        None,
        99,
        &border,
        ResourceAccessOptions::default(),
    );
    assert_eq!(before.potential, ["Koń"]);
    assert!(before.active.is_empty());
    let mut stock = BTreeMap::new();
    stock.insert("braz".to_owned(), 1.0);
    let placed_owned = [("1,0".to_owned(), OwnedPlaced::One("stadnina".to_owned()))];
    let placed = placed_view(&placed_owned);
    let after = get_city_resource_access_for_city(
        city,
        &map,
        Some(&placed),
        99,
        &border,
        ResourceAccessOptions {
            built_ids: None,
            empire_livestock_unlocks: None,
            empire_stock: Some(&stock),
        },
    );
    assert_eq!(after.active, ["Brąz", "Koń"]);
    assert!(after.potential.is_empty());
}

/// Gałąź `if let Some(unlocks)`: `kon` z precomputed odblokowania imperium daje etykietę.
#[test]
fn livestock_unlock_kon_gate_branch() {
    let map = BuildMap::new(Vec::new(), Vec::new());
    let border = |_: f64| 0.0;
    let city = ResourceAccessCity {
        q: 0,
        r: 0,
        population: 3.0,
        kultura: Some(0.0),
    };
    let mut unlocks = HashSet::new();
    unlocks.insert("kon".to_owned());
    let with = get_city_resource_access_for_city(
        city,
        &map,
        None,
        99,
        &border,
        ResourceAccessOptions {
            built_ids: None,
            empire_livestock_unlocks: Some(&unlocks),
            empire_stock: None,
        },
    );
    assert_eq!(with.active, ["Koń"]);
    let mut other = HashSet::new();
    other.insert("owce".to_owned());
    let without = get_city_resource_access_for_city(
        city,
        &map,
        None,
        99,
        &border,
        ResourceAccessOptions {
            built_ids: None,
            empire_livestock_unlocks: Some(&other),
            empire_stock: None,
        },
    );
    assert!(without.active.is_empty());
}

/// Granice N-1 / N / N+1 dla potencjalu (zloze w zasiegu, bez dostepu aktywnego).
#[test]
fn potential_sight_boundary_n_minus_1_n_n_plus_1() {
    let sight = city_range_for_population(3.0);
    let border = |_: f64| 0.0;
    for (distance, expected) in [(sight - 1.0, true), (sight, true), (sight + 1.0, false)] {
        let d = distance as i32;
        let mut hex = BuildHex::new(d, 0, TerrainType::Plains, Overlay::Brak);
        hex.zloze = Some("zloto".to_owned());
        let map = BuildMap::new(vec![hex], Vec::new());
        let city = ResourceAccessCity {
            q: 0,
            r: 0,
            population: 3.0,
            kultura: Some(0.0),
        };
        let got = get_city_resource_access_for_city(
            city,
            &map,
            None,
            99,
            &border,
            ResourceAccessOptions::default(),
        );
        assert_eq!(
            got.potential.iter().any(|l| l == "Złoto"),
            expected,
            "potencjal: odleglosc {d} przy zasiegu {sight}"
        );
    }
}
