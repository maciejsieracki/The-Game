//! P6.1E - wektory z URUCHOMIONEGO weba: `civ-names.ts` i `civ-roster.ts` (pin edb8fb56).
//! Wektory: `tests/p6_1e_vectors/web-vectors.json` (generator `gen-p61e-web-vectors.mjs`).
//! Liczby (strumien mulberry32) sa w wektorach TEKSTEM (`String(x)` z JS).

use std::collections::{BTreeMap, HashSet};
use std::sync::OnceLock;

use civ_engine::data::civilizations::{parse_city_names_pools, CityPool};
use civ_engine::domain::city_names;
use civ_engine::domain::civ_names::roster::{
    assign_ai_civ_types, civ_ids_from_roster, make_rng, pick_active_civ_pool,
    rotate_preferred_for_repair_seed, to_uint32, AssignAiCivInput,
};
use civ_engine::domain::civ_names::{
    civ_display_name, cluster_rival_city_name, find_civ_by_ikona_id, foreign_capital_city_name,
    get_miasta_cywilizacji, get_miasta_panstwa, get_nazwy_klastra, miasta_cywilizacji_len,
    nazwy_klastra_len, pick_ai_founded_city_name, player_start_city_name, state_city_name,
    validate_city_names_pools, validate_nazwy_klastra, CityNameRef, CityNamesPoolsData,
    CivNamesDef,
};
use serde_json::Value;

const WEB_VECTORS: &str = include_str!("p6_1e_vectors/web-vectors.json");

fn web() -> &'static Value {
    static WEB: OnceLock<Value> = OnceLock::new();
    WEB.get_or_init(|| serde_json::from_str(WEB_VECTORS).expect("web vectors parse"))
}

fn arr(value: &Value) -> &Vec<Value> {
    value
        .as_array()
        .unwrap_or_else(|| panic!("tablica: {value}"))
}

fn st(value: &Value) -> &str {
    value.as_str().unwrap_or_else(|| panic!("tekst: {value}"))
}

fn strings(value: &Value) -> Vec<String> {
    arr(value).iter().map(|v| st(v).to_owned()).collect()
}

fn opt_strings(value: &Value) -> Option<Vec<String>> {
    if value.is_null() {
        None
    } else {
        Some(strings(value))
    }
}

fn civ_defs(set: &Value) -> Vec<CivNamesDef> {
    arr(set)
        .iter()
        .map(|c| CivNamesDef {
            ikona_id: c["ikonaId"].as_str().map(str::to_owned),
            cywilizacja: c["Cywilizacja"].as_str().map(str::to_owned),
            nazwy_miast: opt_strings(&c["nazwyMiast"]),
            nazwy_klastra: opt_strings(&c["nazwyKlastra"]),
        })
        .collect()
}

fn civ_set(name: &str) -> Vec<CivNamesDef> {
    civ_defs(&web()["names"]["civSets"][name])
}

fn pool_set(name: &str) -> Option<CityNamesPoolsData> {
    match name {
        "real" => Some(parse_city_names_pools().expect("pule")),
        "none" => None,
        "empty" => Some(BTreeMap::new()),
        "synth" => {
            let mut map = BTreeMap::new();
            for (id, entry) in web()["names"]["synthPools"].as_object().expect("pule") {
                map.insert(
                    id.clone(),
                    CityPool {
                        nazwa_pl: st(&entry["nazwa_pl"]).to_owned(),
                        miasta_cywilizacji: strings(&entry["miasta_cywilizacji"]),
                    },
                );
            }
            Some(map)
        }
        other => panic!("zestaw pul {other}"),
    }
}

fn used_set(name: &str) -> Option<HashSet<String>> {
    match name {
        "undef" => None,
        "empty" => Some(HashSet::new()),
        "mixedx" | "many" => Some(
            strings(&web()["names"]["usedVariants"][name])
                .into_iter()
                .collect(),
        ),
        other => panic!("wariant used {other}"),
    }
}

fn ids() -> Vec<String> {
    strings(&web()["names"]["ids"])
}

#[test]
fn constants_match_web() {
    let c = &web()["names"]["constants"];
    assert_eq!(
        miasta_cywilizacji_len() as u64,
        c["miastaLen"].as_u64().unwrap()
    );
    assert_eq!(
        nazwy_klastra_len() as u64,
        c["klastraLen"].as_u64().unwrap()
    );
    assert_eq!(
        civ_engine::domain::civ_names::city_names_pool_common_len() as u64,
        c["commonLen"].as_u64().unwrap()
    );
    assert_eq!(
        civ_engine::domain::civ_names::city_names_pool_regular_len() as u64,
        c["regularLen"].as_u64().unwrap()
    );
}

#[test]
fn find_klastra_display_validate_match_web() {
    let names = &web()["names"];
    for (set, key) in [("real", 0), ("synth", 1), ("mixed", 2)] {
        let civs = civ_set(set);
        let find = &names["find"][key];
        assert_eq!(st(&find["set"]), set);
        let klastra = &names["klastra"][key];
        let display = &names["display"][key];
        for (i, id) in ids().iter().enumerate() {
            let found = find_civ_by_ikona_id(&civs, id).map(|c| {
                civs.iter()
                    .position(|x| std::ptr::eq(x, c))
                    .expect("indeks")
            });
            assert_eq!(
                found.map_or(-1, |i| i as i64),
                find["out"][i].as_i64().unwrap(),
                "find {set} {id:?}"
            );
            assert_eq!(
                get_nazwy_klastra(&civs, id),
                strings(&klastra["out"][i]),
                "klastra {set} {id:?}"
            );
            assert_eq!(
                civ_display_name(&civs, id),
                st(&display["out"][i]),
                "display {set} {id:?}"
            );
        }
        assert_eq!(
            validate_nazwy_klastra(&civs),
            strings(&names["validateNazwy"][key]["out"]),
            "validate {set}"
        );
    }
    let inline = &names["validateNazwy"][3];
    assert_eq!(st(&inline["set"]), "inline-dupes");
    assert_eq!(
        validate_nazwy_klastra(&civ_defs(&inline["civs"])),
        strings(&inline["out"])
    );
}

#[test]
fn start_foreign_rival_state_names_match_web() {
    let names = &web()["names"];
    let ids = ids();
    let mut checked = 0;
    for row in arr(&names["start"]) {
        let civs = civ_set(st(&row["cs"]));
        let pools = pool_set(st(&row["ps"]));
        let used = used_set(st(&row["uv"]));
        for (i, id) in ids.iter().enumerate() {
            let got = player_start_city_name(&civs, id, pools.as_ref(), used.as_ref());
            assert_eq!(got, st(&row["out"][i]), "start {row} {id:?}");
            checked += 1;
        }
    }
    for row in arr(&names["foreign"]) {
        let civs = civ_set(st(&row["cs"]));
        let pools = pool_set(st(&row["ps"]));
        let used = used_set(st(&row["uv"]));
        for (i, id) in ids.iter().enumerate() {
            let got = foreign_capital_city_name(&civs, id, pools.as_ref(), used.as_ref());
            assert_eq!(got, st(&row["out"][i]), "foreign {row} {id:?}");
            checked += 1;
        }
    }
    let rivals: Vec<i64> = arr(&names["rivalIndexes"])
        .iter()
        .map(|v| v.as_i64().unwrap())
        .collect();
    for row in arr(&names["rival"]) {
        let civs = civ_set(st(&row["cs"]));
        let pools = pool_set(st(&row["ps"]));
        let used = used_set(st(&row["uv"]));
        for (i, id) in ids.iter().enumerate() {
            for (ri, n) in rivals.iter().enumerate() {
                let got = cluster_rival_city_name(&civs, id, *n, pools.as_ref(), used.as_ref());
                assert_eq!(
                    got,
                    st(&row["out"][i][ri]),
                    "rival {} {} {} {id:?} n={n}",
                    row["cs"],
                    row["ps"],
                    row["uv"]
                );
                checked += 1;
            }
        }
    }
    for row in arr(&names["rivalNoUsed"]) {
        let civs = civ_set(st(&row["cs"]));
        let pools = pool_set(st(&row["ps"]));
        for (i, id) in ids.iter().enumerate() {
            for (ri, n) in rivals.iter().enumerate() {
                let got = cluster_rival_city_name(&civs, id, *n, pools.as_ref(), None);
                assert_eq!(
                    got,
                    st(&row["out"][i][ri]),
                    "rivalNoUsed {} {} {id:?} n={n}",
                    row["cs"],
                    row["ps"]
                );
                checked += 1;
            }
        }
    }
    let state_idx: Vec<i64> = arr(&names["stateIndexes"])
        .iter()
        .map(|v| v.as_i64().unwrap())
        .collect();
    for row in arr(&names["state"]) {
        let civs = civ_set(st(&row["cs"]));
        let pools = pool_set(st(&row["ps"]));
        let used = used_set(st(&row["uv"]));
        for (i, id) in ids.iter().enumerate() {
            for (si, idx) in state_idx.iter().enumerate() {
                let got =
                    state_city_name(&civs, id, *idx, "Fallback", pools.as_ref(), used.as_ref());
                assert_eq!(
                    got,
                    st(&row["out"][i][si]),
                    "state {} {} {} {id:?} i={idx}",
                    row["cs"],
                    row["ps"],
                    row["uv"]
                );
                checked += 1;
            }
        }
    }
    assert!(checked > 8000, "{checked}");
}

#[test]
fn pool_views_ai_founded_and_validation_match_web() {
    let names = &web()["names"];
    let ids = ids();
    for (k, ps) in ["real", "synth", "empty"].iter().enumerate() {
        let pools = pool_set(ps).expect("pule");
        let view = &names["miasta"][k];
        assert_eq!(st(&view["ps"]), *ps);
        for (i, id) in ids.iter().enumerate() {
            assert_eq!(
                get_miasta_cywilizacji(&pools, id),
                strings(&view["cywilizacji"][i]),
                "{ps} {id:?}"
            );
            assert_eq!(
                get_miasta_panstwa(&pools, id),
                strings(&view["panstwa"][i]),
                "{ps} {id:?}"
            );
        }
    }
    for (k, ps) in ["real", "synth"].iter().enumerate() {
        let pools = pool_set(ps).expect("pule");
        let row = &names["aiFounded"][k];
        for (i, id) in ids.iter().enumerate() {
            for (ui, uv) in ["empty", "mixedx", "many"].iter().enumerate() {
                let used = used_set(uv).expect("used");
                assert_eq!(
                    pick_ai_founded_city_name(&pools, id, &used, 4),
                    st(&row["out"][i][ui]),
                    "{ps} {id:?} {uv}"
                );
            }
        }
    }
    let mut idx = 0;
    for cs in ["real", "synth", "mixed"] {
        let civs = civ_set(cs);
        for ps in ["real", "synth", "empty"] {
            let row = &names["validatePools"][idx];
            idx += 1;
            let pools = pool_set(ps).expect("pule");
            assert_eq!(
                validate_city_names_pools(&pools, &civs),
                strings(&row["out"]),
                "validatePools {cs} {ps}"
            );
        }
    }
}

#[test]
fn reexports_behave_like_web() {
    let r = &web()["names"]["reexports"];
    let suffix: Vec<String> = [1, 2, 3, 10, 11, 12]
        .iter()
        .map(|n| city_names::city_name_with_suffix("Ateny", *n))
        .collect();
    assert_eq!(suffix, strings(&r["suffix"]));
    let to_s = |v: &[String]| v.to_vec();
    assert_eq!(
        [
            civ_engine::domain::civ_names::nazwa_klastra_at(
                &to_s(&["a".into(), String::new(), "c".into()]),
                0,
                "f"
            ),
            civ_engine::domain::civ_names::nazwa_klastra_at(
                &to_s(&["a".into(), String::new(), "c".into()]),
                1,
                "f"
            ),
            civ_engine::domain::civ_names::nazwa_klastra_at(&to_s(&["a".into()]), 5, "f"),
            civ_engine::domain::civ_names::nazwa_klastra_at(&to_s(&["a".into()]), -1, "f"),
        ],
        [
            st(&r["klastraAt"][0]),
            st(&r["klastraAt"][1]),
            st(&r["klastraAt"][2]),
            st(&r["klastraAt"][3])
        ]
    );
    let pools = pool_set("real").expect("pule");
    let atheny: HashSet<String> = ["Ateny".to_owned()].into_iter().collect();
    for (i, id) in ["grecy", "syn_a", "nope"].iter().enumerate() {
        assert_eq!(
            civ_engine::domain::civ_names::pick_next_city_name(&pools, id, &atheny, None),
            st(&r["next"][i][0]),
            "{id}"
        );
        assert_eq!(
            civ_engine::domain::civ_names::pick_next_regular_city_name(&pools, id, &HashSet::new()),
            st(&r["next"][i][1]),
            "{id}"
        );
    }
    let civ_of = |o: i64| {
        if o == 1 {
            "grecy".to_owned()
        } else {
            "rzymianie".to_owned()
        }
    };
    assert_eq!(
        civ_engine::domain::civ_names::suggest_player_found_city_name(
            &pools,
            "grecy",
            &[CityNameRef {
                owner_id: 0,
                name: "Ateny".into()
            }],
            |_| "grecy".to_owned(),
            0
        ),
        st(&r["suggest"])
    );
    assert_eq!(
        civ_engine::domain::civ_names::pick_ai_found_city_name(
            &pools,
            "grecy",
            &[CityNameRef {
                owner_id: 1,
                name: "Ateny".into()
            }],
            |_| "grecy".to_owned(),
            1
        ),
        st(&r["ai"])
    );
    let used = civ_engine::domain::civ_names::collect_used_city_names_from_cities(
        &[
            CityNameRef {
                owner_id: 1,
                name: "Ateny".into(),
            },
            CityNameRef {
                owner_id: 2,
                name: "Rzym".into(),
            },
        ],
        civ_of,
        "grecy",
    );
    let mut got: Vec<String> = used.into_iter().collect();
    got.sort();
    assert_eq!(got, strings(&r["used"]));
    assert_eq!(
        civ_engine::domain::civ_names::pick_next_city_name_from_names(
            &["a".to_owned(), "b".to_owned()],
            &["a".to_owned(), "b".to_owned()].into_iter().collect(),
            Some("fb")
        ),
        st(&r["fromNames"])
    );
}

// ---------------------------------------------------------------------------
// civ-roster.ts
// ---------------------------------------------------------------------------

#[test]
fn civ_ids_from_roster_matches_web() {
    let v = &web()["roster"]["civIdsFromRoster"];
    let input: Vec<Option<String>> = arr(&v["in"])
        .iter()
        .map(|x| x.as_str().map(str::to_owned))
        .collect();
    assert_eq!(civ_ids_from_roster(&input), strings(&v["out"]));
    // dane weba: kolejnosc pliku civs.json
    let civs = civ_engine::data::civilizations::parse_civs().expect("civs");
    let real: Vec<Option<String>> = civs
        .cywilizacje
        .iter()
        .map(|c| Some(c.ikona_id.clone()))
        .collect();
    assert_eq!(civ_ids_from_roster(&real), strings(&v["real"]));
}

#[test]
fn make_rng_streams_match_web_for_every_seed() {
    let r = &web()["roster"];
    for (i, seed) in arr(&r["seeds"]).iter().enumerate() {
        let seed = seed.as_i64().expect("ziarno calkowite");
        let mut rng = make_rng(seed);
        for (k, expected) in arr(&r["makeRng"][i]).iter().enumerate() {
            let got = rng.next_f64();
            let want: f64 = st(expected).parse().expect("liczba");
            assert_eq!(got.to_bits(), want.to_bits(), "seed {seed} krok {k}");
        }
    }
    // ToUint32: modulo 2^32, takze dla ujemnych
    assert_eq!(to_uint32(-1), u32::MAX);
    assert_eq!(to_uint32(4_294_967_296), 0);
    assert_eq!(to_uint32(4_294_967_297), 1);
    assert_eq!(to_uint32(-4_294_967_296), 0);
}

fn roster_ids(name: &str) -> Vec<String> {
    strings(&web()["roster"]["rosters"][name])
}

#[test]
fn pick_active_civ_pool_matches_web() {
    let rows = arr(&web()["roster"]["pool"]);
    assert!(rows.len() > 1000);
    for row in rows {
        let ids = roster_ids(st(&row["r"]));
        let pref = opt_strings(&row["pref"]);
        let got = pick_active_civ_pool(
            &ids,
            st(&row["player"]),
            row["types"].as_i64().unwrap(),
            row["numAi"].as_i64().unwrap(),
            row["seed"].as_i64().unwrap(),
            pref.as_deref(),
        );
        assert_eq!(got, strings(&row["out"]), "{row}");
    }
}

#[test]
fn rotate_preferred_matches_web() {
    let rows = arr(&web()["roster"]["rotate"]);
    assert!(rows.len() > 100);
    for row in rows {
        let pref = strings(&row["pref"]);
        let got = rotate_preferred_for_repair_seed(&pref, row["seed"].as_i64().unwrap());
        assert_eq!(got, strings(&row["out"]), "{row}");
    }
}

#[test]
fn assign_ai_civ_types_matches_web() {
    let rows = arr(&web()["roster"]["assign"]);
    assert!(rows.len() > 500);
    for row in rows {
        let input = AssignAiCivInput {
            all_civ_ids: roster_ids(st(&row["r"])),
            player_civ_id: st(&row["player"]).to_owned(),
            ai_owner_ids: arr(&row["owners"])
                .iter()
                .map(|v| v.as_i64().unwrap())
                .collect(),
            aktywne_typy: row["types"].as_i64().unwrap(),
            seed: row["seed"].as_i64().unwrap(),
            preferred_civ_ids: opt_strings(&row["pref"]),
        };
        let got: Vec<(i64, String)> = assign_ai_civ_types(&input).into_iter().collect();
        let want: Vec<(i64, String)> = arr(&row["out"])
            .iter()
            .map(|e| (e[0].as_i64().unwrap(), st(&e[1]).to_owned()))
            .collect();
        assert_eq!(got, want, "{row}");
    }
}

#[test]
fn assign_invariants_hold_on_real_roster() {
    // Test ksztaltu (bez pinow wartosci): gracz nigdy nie dostaje swojego typu dla AI, a liczba
    // roznych typow AI nie przekracza limitu aktywnych typow - 1.
    let civs = civ_engine::data::civilizations::parse_civs().expect("civs");
    let all: Vec<String> = civs
        .cywilizacje
        .iter()
        .map(|c| c.ikona_id.clone())
        .collect();
    for seed in 0..50 {
        for types in [3, 5, 7, 9] {
            let input = AssignAiCivInput {
                all_civ_ids: all.clone(),
                player_civ_id: all[0].clone(),
                ai_owner_ids: (1..=8).collect(),
                aktywne_typy: types,
                seed,
                preferred_civ_ids: None,
            };
            let map = assign_ai_civ_types(&input);
            assert_eq!(map.len(), 8);
            let distinct: HashSet<&String> = map.values().collect();
            assert!((distinct.len() as i64) < types, "seed {seed} types {types}");
            assert!(!map.values().any(|c| *c == all[0]));
        }
    }
}
