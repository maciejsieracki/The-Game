//! P6.1D - wektory z URUCHOMIONEGO weba (`gra/src/game/city-names-pool.ts`, pin edb8fb56).
//! Wektory: `tests/p6_1d_vectors/web-vectors.json` (generator `gen-p61d-web-vectors.mjs`).

use std::collections::{BTreeMap, HashSet};
use std::sync::OnceLock;

use civ_engine::data::civilizations::{
    parse_city_names_pools, parse_civs, CityNamesPoolsFile, CITY_NAMES_POOLS_JSON, CIVS_JSON,
};
use civ_engine::domain::city_names::{
    city_name_with_suffix, city_names_pool_common_len, city_names_pool_regular_len,
    city_names_pool_state_len, cluster_rival_from_pool, collect_used_city_names,
    collect_used_city_names_from_cities, foreign_capital_from_pool, nazwa_klastra_at,
    nazwy_klastra_len, pick_ai_found_city_name, pick_next_city_name,
    pick_next_city_name_from_names, pick_next_regular_city_name, player_capital_from_pool,
    resolve_state_city_name, rival_pool_index, state_city_name_at, suggest_player_found_city_name,
    validate_city_names_pools, CityNameRef, CivForCityNames,
};
use serde_json::Value;

const WEB_VECTORS: &str = include_str!("p6_1d_vectors/web-vectors.json");

fn web() -> &'static Value {
    static WEB: OnceLock<Value> = OnceLock::new();
    WEB.get_or_init(|| serde_json::from_str(WEB_VECTORS).expect("web vectors parse"))
}

fn cn() -> &'static Value {
    &web()["cityNames"]
}

fn fnv1a64(bytes: &[u8]) -> String {
    let mut h: u64 = 0xcbf2_9ce4_8422_2325;
    for b in bytes {
        h ^= u64::from(*b);
        h = h.wrapping_mul(0x0000_0100_0000_01b3);
    }
    format!("{h:016x}")
}

fn arr(value: &Value) -> &Vec<Value> {
    value.as_array().expect("array")
}

fn strs(value: &Value) -> Vec<String> {
    arr(value)
        .iter()
        .map(|x| x.as_str().expect("str").to_owned())
        .collect()
}

fn set(value: &Value) -> HashSet<String> {
    strs(value).into_iter().collect()
}

fn pools() -> &'static CityNamesPoolsFile {
    static P: OnceLock<CityNamesPoolsFile> = OnceLock::new();
    P.get_or_init(|| parse_city_names_pools().expect("pools parse"))
}

/// Pula z wektora (JSON weba) -> mapa Rust, dla przypadkow z syntetycznymi pulami.
fn pools_from_json(value: &Value) -> CityNamesPoolsFile {
    serde_json::from_value(value.clone()).expect("pools from vector")
}

fn common(id: &str) -> Vec<String> {
    let all = &pools()[id].miasta_cywilizacji;
    all[..all.len().min(110)].to_vec()
}

fn civs_from(value: &Value) -> Vec<CivForCityNames> {
    arr(value)
        .iter()
        .map(|c| CivForCityNames {
            ikona_id: c.get("ikonaId").and_then(Value::as_str).map(str::to_owned),
            nazwy_miast: c.get("nazwyMiast").map(strs),
        })
        .collect()
}

/// Odtwarza zbior zajetych nazw z opisu `usedSpecs` (prefiks kolejki + dodatkowe, `@1`/`@2` = 1./2. nazwa).
fn expand_used(spec: &Value, id: &str) -> HashSet<String> {
    let names = common(id);
    let first = names.first().cloned().unwrap_or_default();
    let second = names.get(1).cloned().unwrap_or_default();
    let prefix = spec["prefix"].as_u64().unwrap() as usize;
    let mut used: HashSet<String> = names.iter().take(prefix).cloned().collect();
    for extra in strs(&spec["extra"]) {
        used.insert(extra.replace("@1", &first).replace("@2", &second));
    }
    used
}

#[test]
fn embedded_pool_data_is_byte_identical_to_data_used_for_vectors() {
    let fnv = &web()["dataFnv"];
    assert_eq!(
        fnv["cityNamesPools"],
        fnv1a64(CITY_NAMES_POOLS_JSON.as_bytes())
    );
    assert_eq!(fnv["civs"], fnv1a64(CIVS_JSON.as_bytes()));
    // pule z wektora = pule z danych silnika
    let from_vec: BTreeMap<String, Vec<String>> = cn()["pools"]
        .as_object()
        .unwrap()
        .iter()
        .map(|(k, v)| (k.clone(), strs(&v["miasta_cywilizacji"])))
        .collect();
    let from_data: BTreeMap<String, Vec<String>> = pools()
        .iter()
        .map(|(k, v)| (k.clone(), v.miasta_cywilizacji.clone()))
        .collect();
    assert_eq!(from_vec, from_data);
    assert_eq!(from_data.len(), 15);
}

#[test]
fn pool_length_constants_match_web() {
    let c = &web()["constants"];
    assert_eq!(
        city_names_pool_regular_len() as u64,
        c["regular"].as_u64().unwrap()
    );
    assert_eq!(
        city_names_pool_state_len() as u64,
        c["state"].as_u64().unwrap()
    );
    assert_eq!(
        city_names_pool_common_len() as u64,
        c["common"].as_u64().unwrap()
    );
    assert_eq!(nazwy_klastra_len() as u64, c["klastra"].as_u64().unwrap());
}

#[test]
fn city_name_with_suffix_matches_web() {
    let rows = arr(&cn()["suffix"]);
    assert!(rows.len() >= 40);
    for row in rows {
        let r = arr(row);
        assert_eq!(
            city_name_with_suffix(r[0].as_str().unwrap(), r[1].as_i64().unwrap()),
            r[2].as_str().unwrap(),
            "{r:?}"
        );
    }
}

#[test]
fn nazwa_klastra_at_matches_web() {
    for case in arr(&cn()["klastraAt"]) {
        let names = strs(&case["names"]);
        assert_eq!(
            nazwa_klastra_at(
                &names,
                case["index"].as_i64().unwrap(),
                case["fallback"].as_str().unwrap()
            ),
            case["out"].as_str().unwrap(),
            "{case}"
        );
    }
}

#[test]
fn rival_pool_index_matches_web() {
    let rows = arr(&cn()["rivalIdx"]);
    assert!(rows.len() >= 50);
    for row in rows {
        let r = arr(row);
        assert_eq!(
            rival_pool_index(r[0].as_i64().unwrap(), r[1].as_i64().unwrap()),
            r[2].as_i64().unwrap(),
            "{r:?}"
        );
    }
}

#[test]
fn pick_next_city_name_from_names_matches_web_for_synthetic_queues() {
    let cases = arr(&cn()["pick"]);
    assert!(cases.len() >= 40);
    for case in cases {
        let names = strs(&case["names"]);
        let used = set(&case["used"]);
        let fallback = case["fallback"].as_str();
        assert_eq!(
            pick_next_city_name_from_names(&names, &used, fallback),
            case["out"].as_str().unwrap(),
            "{case}"
        );
    }
}

#[test]
fn pick_capital_foreign_regular_match_web_for_real_pools() {
    let specs = arr(&cn()["usedSpecs"]);
    let rows = arr(&cn()["realPick"]);
    assert!(rows.len() >= 150);
    for row in rows {
        let id = row["civ"].as_str().unwrap();
        let spec = row["spec"].as_i64().unwrap();
        let base = if pools().contains_key(id) {
            id
        } else {
            "grecy"
        };
        let used = if spec < 0 {
            HashSet::new()
        } else {
            expand_used(&specs[spec as usize], base)
        };
        let ctx = format!("{id} spec {spec}");
        assert_eq!(
            pick_next_city_name(pools(), id, &used, Some("FB")),
            row["nextFb"].as_str().unwrap(),
            "{ctx} nextFb"
        );
        assert_eq!(
            pick_next_city_name(pools(), id, &used, None),
            row["nextDefault"].as_str().unwrap(),
            "{ctx} nextDefault"
        );
        assert_eq!(
            pick_next_regular_city_name(pools(), id, &used),
            row["regular"].as_str().unwrap(),
            "{ctx} regular"
        );
        let (cap_used, foreign_used) = if spec < 0 {
            (None, None)
        } else {
            (Some(&used), Some(&used))
        };
        assert_eq!(
            player_capital_from_pool(pools(), id, cap_used),
            row["capital"].as_str().unwrap(),
            "{ctx} capital"
        );
        assert_eq!(
            foreign_capital_from_pool(pools(), id, foreign_used),
            row["foreign"].as_str().unwrap(),
            "{ctx} foreign"
        );
    }
}

#[test]
fn state_city_name_at_matches_web() {
    let rows = arr(&cn()["stateAt"]);
    assert!(rows.len() >= 100);
    for row in rows {
        let id = row["civ"].as_str().unwrap();
        let idx = row["index"].as_i64().unwrap();
        let base = if pools().contains_key(id) {
            id
        } else {
            "grecy"
        };
        let p3: HashSet<String> = common(base).into_iter().take(3).collect();
        assert_eq!(
            state_city_name_at(pools(), id, idx, "FB", None),
            row["none"].as_str().unwrap(),
            "{id} {idx} none"
        );
        assert_eq!(
            state_city_name_at(pools(), id, idx, "FB", Some(&HashSet::new())),
            row["empty"].as_str().unwrap(),
            "{id} {idx} empty"
        );
        assert_eq!(
            state_city_name_at(pools(), id, idx, "FB", Some(&p3)),
            row["p3"].as_str().unwrap(),
            "{id} {idx} p3"
        );
    }
}

#[test]
fn cluster_rival_from_pool_matches_web() {
    let rows = arr(&cn()["rivals"]);
    assert!(rows.len() >= 100);
    for row in rows {
        let id = row["civ"].as_str().unwrap();
        let rv = row["rival"].as_i64().unwrap();
        let base = if pools().contains_key(id) {
            id
        } else {
            "grecy"
        };
        let p4: HashSet<String> = common(base).into_iter().take(4).collect();
        assert_eq!(
            cluster_rival_from_pool(pools(), id, rv, None),
            row["none"].as_str().unwrap(),
            "{id} {rv} none"
        );
        assert_eq!(
            cluster_rival_from_pool(pools(), id, rv, Some(&HashSet::new())),
            row["empty"].as_str().unwrap(),
            "{id} {rv} empty"
        );
        assert_eq!(
            cluster_rival_from_pool(pools(), id, rv, Some(&p4)),
            row["p4"].as_str().unwrap(),
            "{id} {rv} p4"
        );
    }
}

#[test]
fn resolve_state_city_name_matches_web() {
    let civs = civs_from(&cn()["civsOnlyNames"]);
    let no_greek: CityNamesPoolsFile = pools()
        .iter()
        .filter(|(k, _)| k.as_str() != "grecy")
        .map(|(k, v)| (k.clone(), v.clone()))
        .collect();
    let rows = arr(&cn()["resolve"]);
    assert!(rows.len() >= 150);
    let a_ateny: HashSet<String> = ["A", "Ateny"].iter().map(|s| (*s).to_owned()).collect();
    for row in rows {
        let p: Option<&CityNamesPoolsFile> = match row["pools"].as_str().unwrap() {
            "full" => Some(pools()),
            "nogreek" => Some(&no_greek),
            "none" => None,
            other => panic!("nieznany rodzaj puli {other}"),
        };
        let id = row["civ"].as_str().unwrap();
        let idx = row["index"].as_i64().unwrap();
        let ctx = format!("{} {id} {idx}", row["pools"]);
        assert_eq!(
            resolve_state_city_name(p, &civs, id, idx, "FB", None),
            row["none"].as_str().unwrap(),
            "{ctx} none"
        );
        assert_eq!(
            resolve_state_city_name(p, &civs, id, idx, "FB", Some(&HashSet::new())),
            row["empty"].as_str().unwrap(),
            "{ctx} empty"
        );
        assert_eq!(
            resolve_state_city_name(p, &civs, id, idx, "FB", Some(&a_ateny)),
            row["used1"].as_str().unwrap(),
            "{ctx} used1"
        );
    }
}

fn city_list(value: &Value) -> Vec<CityNameRef> {
    arr(value)
        .iter()
        .map(|c| CityNameRef {
            owner_id: c["ownerId"].as_i64().unwrap(),
            name: c["name"].as_str().unwrap().to_owned(),
        })
        .collect()
}

fn civ_of() -> impl Fn(i64) -> String {
    let map: BTreeMap<i64, String> = cn()["collectCivOf"]
        .as_object()
        .unwrap()
        .iter()
        .map(|(k, v)| (k.parse().unwrap(), v.as_str().unwrap().to_owned()))
        .collect();
    move |owner| {
        map.get(&owner)
            .cloned()
            .unwrap_or_else(|| "inna".to_owned())
    }
}

#[test]
fn collect_used_city_names_matches_web() {
    let cities = city_list(&cn()["collectCityList"]);
    let names: Vec<String> = cities.iter().map(|c| c.name.clone()).collect();
    let owners: Vec<i64> = cities.iter().map(|c| c.owner_id).collect();
    for case in arr(&cn()["collect"]) {
        let target = case["target"].as_str().unwrap();
        assert_eq!(
            collect_used_city_names_from_cities(&cities, civ_of(), target),
            set(&case["byCities"]),
            "{target} byCities"
        );
        assert_eq!(
            collect_used_city_names(&names, &owners, civ_of(), target),
            set(&case["byArrays"]),
            "{target} byArrays"
        );
        assert_eq!(
            collect_used_city_names(&names, &owners[..3], civ_of(), target),
            set(&case["byArraysShortOwners"]),
            "{target} byArraysShortOwners"
        );
    }
}

#[test]
fn suggest_and_ai_founding_names_match_web() {
    let lists: Vec<Vec<CityNameRef>> = arr(&cn()["suggestCityLists"])
        .iter()
        .map(city_list)
        .collect();
    let cases = arr(&cn()["suggest"]);
    assert!(cases.len() >= 15);
    for case in cases {
        let cities = &lists[case["cities"].as_u64().unwrap() as usize];
        let civ = case["civ"].as_str().unwrap();
        assert_eq!(
            suggest_player_found_city_name(pools(), civ, cities, civ_of(), 0),
            case["suggest"].as_str().unwrap()
        );
        assert_eq!(
            suggest_player_found_city_name(pools(), civ, cities, civ_of(), 99),
            case["suggestOther"].as_str().unwrap()
        );
        for (owner, expected) in [0, 1, 2, 3, 7, -5].iter().zip(arr(&case["ai"])) {
            assert_eq!(
                pick_ai_found_city_name(pools(), civ, cities, civ_of(), *owner),
                expected.as_str().unwrap(),
                "ai owner {owner}"
            );
        }
    }
}

#[test]
fn validate_city_names_pools_matches_web() {
    let cases = arr(&cn()["validate"]);
    assert!(cases.len() >= 10);
    let mut non_empty = 0;
    for case in cases {
        let p = pools_from_json(&case["pools"]);
        let civs = civs_from(&case["civs"]);
        let got = validate_city_names_pools(&p, &civs);
        assert_eq!(got, strs(&case["out"]), "{}", case["name"]);
        non_empty += usize::from(!got.is_empty());
    }
    assert!(non_empty >= 8);
    // dane silnika: 0 bledow (pule == nazwyMiast w civs.json)
    let civs: Vec<CivForCityNames> = parse_civs()
        .expect("civs")
        .cywilizacje
        .iter()
        .map(|c| CivForCityNames {
            ikona_id: Some(c.ikona_id.clone()),
            nazwy_miast: Some(c.nazwy_miast.clone()),
        })
        .collect();
    assert_eq!(
        validate_city_names_pools(pools(), &civs),
        Vec::<String>::new()
    );
}
