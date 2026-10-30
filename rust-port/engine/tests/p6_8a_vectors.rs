//! P6.8A-P1 (pin webu 91dc998a): porownanie Rust z WEKTORAMI z URUCHOMIONEGO weba.
//!
//! Wektory: `tests/p6_8a_vectors/*.json`, generowane przez
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-8A-PRODUKCJA-KOSZTY-Q1/gen-p6-8a-upgrades-pending-vectors.mjs`
//! (Node 22 + loader TS, bez builda gra/) oraz `gen-p6-8a-structural-variants.mjs`
//! (warianty progu `miasto-params.json`: realny, zero, ujemna, ulamek, napis, null, brak).
//!
//! Kodowanie liczb: liczba calkowita = JSON number; niecalkowita = {"$f": "..."};
//! NaN/Infinity/-0 = {"$n": "..."}. Wejscie `suppressed` i `grupa` jest w wektorach jak w webie;
//! widok typowany Rust: `suppressed` inne niz bool => `None`, `grupa` inne niz napis => `None`
//! (web: `=== true` / `typeof === 'string'` daje ten sam wynik).

use civ_engine::domain::production_units::{
    building_structural_defense_bonus_line, building_structural_defense_bonus_percent,
    city_has_amfiteatr_line, city_has_biblioteka_line, city_has_mur_line, city_has_palac_line,
    city_palac_tier, group_built_building_ids, is_building_suppressed_from_production,
    structural_defense_param_key, upgrade_chain_steps, upgrade_composition_lines,
    upgrade_production_display_name, BuildingGroupLite, BuildingUpgradeLite,
    BUILDING_GROUP_FALLBACK, BUILDING_GROUP_ORDER,
};
use civ_engine::domain::improvements::{
    parse_pending_improvement_id, pending_improvement_id, PendingImprovementEntry,
    PendingImprovementsTurn,
};
use serde_json::Value;

const BU_JSON: &str = include_str!("p6_8a_vectors/building_upgrades.json");
const PENDING_JSON: &str = include_str!("p6_8a_vectors/pending.json");
const STRUCT_REALNY: &str = include_str!("p6_8a_vectors/structural-realny.json");
const STRUCT_ZERO: &str = include_str!("p6_8a_vectors/structural-zero.json");
const STRUCT_UJEMNA: &str = include_str!("p6_8a_vectors/structural-ujemna.json");
const STRUCT_ULAMEK: &str = include_str!("p6_8a_vectors/structural-ulamek.json");
const STRUCT_NAPIS: &str = include_str!("p6_8a_vectors/structural-napis.json");
const STRUCT_NULL: &str = include_str!("p6_8a_vectors/structural-null.json");
const STRUCT_BRAK: &str = include_str!("p6_8a_vectors/structural-brak.json");

fn parse(s: &str) -> Value {
    serde_json::from_str(s).expect("wektor JSON")
}

/// Dekodowanie liczby z kodowania wektora (patrz naglowek pliku).
fn dec(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().expect("liczba"),
        Value::Object(o) => {
            if let Some(s) = o.get("$f") {
                s.as_str().expect("$f").parse::<f64>().expect("$f parse")
            } else {
                match o.get("$n").and_then(Value::as_str).expect("$n") {
                    "NaN" => f64::NAN,
                    "Infinity" => f64::INFINITY,
                    "-Infinity" => f64::NEG_INFINITY,
                    "-0" => -0.0,
                    other => panic!("nieznane $n: {other}"),
                }
            }
        }
        other => panic!("nie-liczba w wektorze: {other:?}"),
    }
}

/// Porownanie liczb: NaN == NaN, -0 == 0 nie rozrozniane (JSON nie koduje roznicy poza $n "-0").
fn same_num(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a == b
}

fn opt_str(v: Option<&Value>) -> Option<String> {
    match v {
        Some(Value::String(s)) => Some(s.clone()),
        _ => None,
    }
}

fn lite_from(v: &Value) -> BuildingUpgradeLite {
    BuildingUpgradeLite {
        id: v["id"].as_str().expect("id").to_string(),
        nazwa: v["nazwa"].as_str().unwrap_or("").to_string(),
        upgrade_from: opt_str(v.get("upgradeFrom")),
        suppressed: match v.get("suppressed") {
            Some(Value::Bool(b)) => Some(*b),
            _ => None,
        },
    }
}

fn lites(list: &Value) -> Vec<BuildingUpgradeLite> {
    list.as_array().expect("lista").iter().map(lite_from).collect()
}

fn built_ids(v: &Value) -> Vec<String> {
    v.as_array()
        .expect("built")
        .iter()
        .map(|x| x.as_str().expect("id").to_string())
        .collect()
}

fn strs(v: &Value) -> Vec<&str> {
    v.as_array()
        .expect("tablica")
        .iter()
        .map(|x| x.as_str().expect("napis"))
        .collect()
}

// ---------------------------------------------------------------------------
// building-upgrades.ts
// ---------------------------------------------------------------------------

#[test]
fn vectors_building_upgrades_suppressed_match_web() {
    let root = parse(BU_JSON);
    let cases = root["suppressed"].as_array().unwrap();
    assert!(cases.len() >= 40, "za malo przypadkow: {}", cases.len());
    for c in cases {
        let rust = is_building_suppressed_from_production(&lite_from(&c["input"]));
        assert_eq!(rust, c["result"].as_bool().unwrap(), "suppressed {}", c["input"]);
    }
}

#[test]
fn vectors_building_upgrades_chain_match_web() {
    let root = parse(BU_JSON);
    let cases = root["chain"].as_array().unwrap();
    assert!(cases.len() >= 200);
    for c in cases {
        let list = lites(&c["list"]);
        let id = c["id"].as_str().unwrap();
        let chain = upgrade_chain_steps(id, &list);
        let got_ids: Vec<&str> = chain.iter().map(|b| b.id.as_str()).collect();
        let got_names: Vec<&str> = chain.iter().map(|b| b.nazwa.as_str()).collect();
        assert_eq!(got_ids, strs(&c["ids"]), "chain ids dla {id}");
        assert_eq!(got_names, strs(&c["nazwy"]), "chain nazwy dla {id}");
    }
}

#[test]
fn vectors_building_upgrades_display_name_match_web() {
    let root = parse(BU_JSON);
    let cases = root["display"].as_array().unwrap();
    assert!(cases.len() >= 200);
    for c in cases {
        let list = lites(&c["list"]);
        let target = lite_from(&c["target"]);
        assert_eq!(
            upgrade_production_display_name(&target, &list),
            c["name"].as_str().unwrap(),
            "display dla {}",
            target.id
        );
    }
}

#[test]
fn vectors_building_upgrades_composition_match_web() {
    let root = parse(BU_JSON);
    for c in root["composition"].as_array().unwrap() {
        let list = lites(&c["list"]);
        let got = upgrade_composition_lines(c["id"].as_str().unwrap(), &list);
        let want: Vec<String> = c["lines"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_str().unwrap().to_string())
            .collect();
        assert_eq!(got, want, "composition dla {}", c["id"]);
    }
}

#[test]
fn vectors_building_upgrades_presence_and_palac_tier_match_web() {
    let root = parse(BU_JSON);
    let cases = root["presence"].as_array().unwrap();
    assert!(cases.len() >= 300);
    for c in cases {
        let owned = built_ids(&c["built"]);
        let refs: Vec<&str> = owned.iter().map(String::as_str).collect();
        assert_eq!(city_has_biblioteka_line(&refs), c["biblioteka"].as_bool().unwrap());
        assert_eq!(city_has_amfiteatr_line(&refs), c["amfiteatr"].as_bool().unwrap());
        assert_eq!(city_has_mur_line(&refs), c["mur"].as_bool().unwrap());
        assert_eq!(city_has_palac_line(&refs), c["palac"].as_bool().unwrap());
        let want_tier = c["palacTier"].as_u64().map(|t| t as u8);
        assert_eq!(city_palac_tier(&refs), want_tier, "palacTier dla {owned:?}");
    }
}

#[test]
fn vectors_building_groups_match_web() {
    let root = parse(BU_JSON);
    let order: Vec<&str> = root["groupOrder"].as_array().unwrap().iter().map(|x| x.as_str().unwrap()).collect();
    assert_eq!(order, BUILDING_GROUP_ORDER.to_vec());
    assert_eq!(root["groupFallback"].as_str().unwrap(), BUILDING_GROUP_FALLBACK);
    let cases = root["groups"].as_array().unwrap();
    assert!(cases.len() >= 230);
    for c in cases {
        let list: Vec<BuildingGroupLite> = c["list"]
            .as_array()
            .unwrap()
            .iter()
            .map(|v| BuildingGroupLite {
                id: v["id"].as_str().unwrap().to_string(),
                grupa: opt_str(v.get("grupa")),
            })
            .collect();
        let owned = built_ids(&c["built"]);
        let refs: Vec<&str> = owned.iter().map(String::as_str).collect();
        let got = group_built_building_ids(&refs, &list);
        let want = c["buckets"].as_array().unwrap();
        assert_eq!(got.len(), want.len(), "liczba grup dla {owned:?}");
        for (g, w) in got.iter().zip(want) {
            assert_eq!(g.grupa, w["grupa"].as_str().unwrap());
            let want_ids: Vec<&str> = w["ids"].as_array().unwrap().iter().map(|x| x.as_str().unwrap()).collect();
            let got_ids: Vec<&str> = g.ids.iter().map(String::as_str).collect();
            assert_eq!(got_ids, want_ids, "ids grupy {}", g.grupa);
        }
    }
}

// ---------------------------------------------------------------------------
// Struktura obrony: prog wartosci z miasto-params.json (realny + warianty).
// ---------------------------------------------------------------------------

fn check_structural(text: &str, variant: &str) {
    let root = parse(text);
    let raw_of = |id: &str| -> Option<f64> {
        let key = structural_defense_param_key(id)?;
        match root["miastoRaw"].get(key) {
            Some(Value::Number(n)) => n.as_f64(),
            _ => None,
        }
    };
    for c in root["cases"].as_array().unwrap() {
        let id = c["buildingId"].as_str().unwrap();
        let raw = raw_of(id);
        let got_pct = building_structural_defense_bonus_percent(id, raw);
        match &c["percent"] {
            Value::Null => assert_eq!(got_pct, None, "[{variant}] procent {id}"),
            v => {
                let want = dec(v);
                let got = got_pct.unwrap_or_else(|| panic!("[{variant}] brak procentu dla {id}"));
                assert!(same_num(got, want), "[{variant}] procent {id}: {got} != {want}");
            }
        }
        let got_line = building_structural_defense_bonus_line(id, raw);
        match &c["line"] {
            Value::Null => assert_eq!(got_line, None, "[{variant}] linia {id}"),
            v => assert_eq!(got_line.as_deref(), v.as_str(), "[{variant}] linia {id}"),
        }
    }
}

#[test]
fn vectors_structural_defense_realny_match_web() {
    check_structural(STRUCT_REALNY, "realny");
}

#[test]
fn vectors_structural_defense_zero_ujemna_ulamek_match_web() {
    check_structural(STRUCT_ZERO, "zero");
    check_structural(STRUCT_UJEMNA, "ujemna");
    check_structural(STRUCT_ULAMEK, "ulamek");
}

#[test]
fn vectors_structural_defense_napis_null_brak_match_web() {
    // Napis '12' i null nie sa liczba w webie (typeof !== 'number') -> brak bonusu; brak klucza -> brak.
    check_structural(STRUCT_NAPIS, "napis");
    check_structural(STRUCT_NULL, "null");
    check_structural(STRUCT_BRAK, "brak");
}

// ---------------------------------------------------------------------------
// pending-improvements.ts: sekwencje operacji (40 scenariuszy x 50 krokow).
// ---------------------------------------------------------------------------

fn entry_from(v: &Value) -> PendingImprovementEntry {
    PendingImprovementEntry {
        hex_key: v["hexKey"].as_str().unwrap().to_string(),
        key: v["key"].as_str().unwrap().to_string(),
        koszt_praca: dec(&v["kosztPraca"]),
        action: v["action"].as_str().unwrap().to_string(),
    }
}

fn same_entry(a: &PendingImprovementEntry, b: &PendingImprovementEntry) -> bool {
    a.hex_key == b.hex_key && a.key == b.key && a.action == b.action && same_num(a.koszt_praca, b.koszt_praca)
}

#[test]
fn vectors_pending_scenarios_match_web() {
    let root = parse(PENDING_JSON);
    let probes: Vec<(String, String)> = root["probes"]
        .as_array()
        .unwrap()
        .iter()
        .map(|p| (p[0].as_str().unwrap().to_string(), p[1].as_str().unwrap().to_string()))
        .collect();
    let scenarios = root["scenarios"].as_array().unwrap();
    assert!(scenarios.len() >= 40);
    let mut ops_total = 0usize;
    for (si, sc) in scenarios.iter().enumerate() {
        let mut state = PendingImprovementsTurn::new();
        for (oi, op) in sc["ops"].as_array().unwrap().iter().enumerate() {
            ops_total += 1;
            let what = format!("scenariusz {si} krok {oi} ({})", op["op"]);
            match op["op"].as_str().unwrap() {
                "add" => state.add(entry_from(&op["entry"])),
                "remove" => {
                    let got = state.remove(op["hexKey"].as_str().unwrap(), op["key"].as_str().unwrap());
                    match (&op["ret"], got) {
                        (Value::Null, None) => {}
                        (v, Some(g)) => assert!(same_entry(&g, &entry_from(v)), "{what}: remove"),
                        (v, g) => panic!("{what}: remove web={v} rust={g:?}"),
                    }
                }
                "commit" => state.commit_turn(),
                "fromSave" => {
                    let rows: Vec<PendingImprovementEntry> =
                        op["rows"].as_array().unwrap().iter().map(entry_from).collect();
                    state = PendingImprovementsTurn::from_save(Some(&rows));
                }
                "probe" => {}
                other => panic!("nieznana operacja {other}"),
            }
            assert_eq!(state.size() as u64, op["size"].as_u64().unwrap(), "{what}: size");
            for (pi, (h, k)) in probes.iter().enumerate() {
                assert_eq!(state.has(h, k), op["has"][pi].as_bool().unwrap(), "{what}: has {h} {k}");
                match (&op["get"][pi], state.get(h, k)) {
                    (Value::Null, None) => {}
                    (v, Some(g)) => assert!(same_entry(g, &entry_from(v)), "{what}: get {h} {k}"),
                    (v, g) => panic!("{what}: get web={v} rust={g:?}"),
                }
            }
            let want_save: Vec<PendingImprovementEntry> =
                op["toSave"].as_array().unwrap().iter().map(entry_from).collect();
            let got_save = state.to_save();
            assert_eq!(got_save.len(), want_save.len(), "{what}: toSave len");
            for (g, w) in got_save.iter().zip(&want_save) {
                assert!(same_entry(g, w), "{what}: toSave {g:?} != {w:?}");
            }
            let want_undo: Vec<&str> = op["undoKeySet"].as_array().unwrap().iter().map(|x| x.as_str().unwrap()).collect();
            let got_undo = state.undo_key_set();
            assert_eq!(got_undo.iter().map(String::as_str).collect::<Vec<_>>(), want_undo, "{what}: undo");
        }
    }
    assert!(ops_total >= 2000, "za malo krokow: {ops_total}");
}

#[test]
fn vectors_pending_id_helpers_match_web() {
    let root = parse(PENDING_JSON);
    let cases = root["ids"].as_array().unwrap();
    assert!(cases.len() >= 5);
    for c in cases {
        if c.get("parsed").is_some() {
            // parsePendingImprovementId(id)
            let id = c["id"].as_str().unwrap();
            let parsed = parse_pending_improvement_id(id);
            match &c["parsed"] {
                Value::Null => assert_eq!(parsed, None, "parse {id}"),
                v => assert_eq!(
                    parsed,
                    Some((
                        v["hexKey"].as_str().unwrap().to_string(),
                        v["key"].as_str().unwrap().to_string()
                    )),
                    "parse {id}"
                ),
            }
        } else {
            // pendingImprovementId(hexKey, key)
            assert_eq!(
                pending_improvement_id(c["hexKey"].as_str().unwrap(), c["key"].as_str().unwrap()),
                c["id"].as_str().unwrap()
            );
        }
    }
}

// ---------------------------------------------------------------------------
// P6.8A-P1 (dokonczenie): buildingStatSummaryLines z mnoznikami unit-building-bonuses.
// ---------------------------------------------------------------------------

fn num_map(v: &Value) -> std::collections::BTreeMap<String, f64> {
    v.as_object()
        .map(|m| m.iter().map(|(k, x)| (k.clone(), dec(x))).collect())
        .unwrap_or_default()
}

#[test]
fn vectors_building_stat_summary_lines_match_web() {
    use civ_engine::domain::combat::unit_building_bonuses::MnoznikBuildingLookup;
    use civ_engine::domain::production_units::building_stat_summary_lines;
    let root = parse(BU_JSON);
    let cases = root["stats"].as_array().unwrap();
    assert!(cases.len() >= 190, "za malo przypadkow stats: {}", cases.len());
    let mut with_lines = 0usize;
    for c in cases {
        let def = &c["def"];
        let id = def["id"].as_str().unwrap();
        let baza = num_map(&def["baza"]);
        let przyrost = num_map(&def["przyrost"]);
        let lookups: Option<Vec<MnoznikBuildingLookup>> = c["buildings"].as_array().map(|items| {
            items
                .iter()
                .map(|b| MnoznikBuildingLookup {
                    id: b["id"].as_str().unwrap().to_string(),
                    baza_mnoznik: b.get("baza").and_then(|x| x.get("mnoznik")).map(dec),
                    upgrade_from: b.get("upgradeFrom").and_then(Value::as_str).map(String::from),
                })
                .collect()
        });
        let got = building_stat_summary_lines(id, &baza, &przyrost, lookups.as_deref());
        let want: Vec<String> = c["lines"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_str().unwrap().to_string())
            .collect();
        if !want.is_empty() {
            with_lines += 1;
        }
        assert_eq!(got, want, "buildingStatSummaryLines dla {id}");
    }
    assert!(with_lines >= 100, "za malo niepustych wynikow: {with_lines}");
}
