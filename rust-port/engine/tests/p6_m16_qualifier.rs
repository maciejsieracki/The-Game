//! P6.M16 - `createQualifier` / `buildImprovementQualifier` / `createImprovementBuildApi`
//! (`improvement-build.ts:840-1175, 1294-1557`): wektory z URUCHOMIONEGO weba (pin edb8fb56).
//! 160 losowych stanow mapy; dla kazdego: bity kwalifikacji kazdego klucza na kazdym heksie (+ heksy
//! poza mapa), `getQualifyingHexes` (kolejnosc!), `getWorkCost` (BITOWO), `createBuildRequest`,
//! `handleHexClick` + `onSelect`, `getForestBuildBlockReason`.

#[path = "p6_m16_vectors/common.rs"]
mod common;

use std::collections::BTreeMap;

use civ_engine::domain::improvement_build::*;
use common::*;
use serde_json::Value;

fn data() -> Value {
    load("qualifier.json")
}

fn request_json(r: &ImprovementBuildRequest) -> Value {
    serde_json::json!({
        "key": r.key, "q": r.q, "r": r.r, "hexKey": r.hex_key,
        "kosztPraca": r.koszt_praca, "action": r.action,
    })
}

#[test]
fn qualifier_bits_match_web_for_every_key_and_hex() {
    let d = data();
    let keys = strs(&d["keys"]);
    let mut per_key_true: BTreeMap<String, usize> = BTreeMap::new();
    let mut total = 0usize;
    for (ci, case) in arr(&d, "cases").iter().enumerate() {
        let st = state(&case["state"]);
        let qualify = build_improvement_qualifier(&st);
        let queries: Vec<(i32, i32)> = arr(case, "queries")
            .iter()
            .map(|p| (int(&p[0]), int(&p[1])))
            .collect();
        for key in &keys {
            let want = s(&case["qual"][key.as_str()]);
            assert_eq!(want.len(), queries.len());
            let got: String = queries
                .iter()
                .map(|&(q, r)| {
                    if qualify.qualifies(key, q, r) {
                        '1'
                    } else {
                        '0'
                    }
                })
                .collect();
            if got != want {
                let i = got
                    .chars()
                    .zip(want.chars())
                    .position(|(a, b)| a != b)
                    .unwrap();
                panic!(
                    "stan {ci} klucz {key} heks {:?}: rust={} web={}",
                    queries[i],
                    &got[i..=i],
                    &want[i..=i]
                );
            }
            let n = got.matches('1').count();
            total += n;
            *per_key_true.entry(key.clone()).or_default() += n;
        }
    }
    assert!(total > 100_000, "za malo prawdziwych wynikow: {total}");
    // test istotnosci: kazdy klucz z unii ImprovementKey (poza ewidentnie niekwalifikowalnymi) bywa prawdziwy
    for key in [
        "farma",
        "bydlo",
        "owce",
        "lama",
        "kamieniolom",
        "oboz_lowiecki",
        "wyrab",
        "tartak",
        "lodzie_rybackie",
        "droga",
        "droga_brukowana",
        "posterunek",
        "stadnina",
        "kopalnia_miedzi",
        "kopalnia_zelaza",
        "kopalnia_zlota",
        "kopalnia_cyny",
        "irygacja",
        "glinianka",
        "warzelnia_soli",
        "tarasy",
        "fort",
        "xyz",
    ] {
        assert!(
            per_key_true.get(key).copied().unwrap_or(0) > 0,
            "klucz {key} nigdy nie byl prawdziwy w wektorach"
        );
    }
}

#[test]
fn api_qualifying_hexes_and_work_cost_match_web() {
    let d = data();
    let keys = strs(&d["keys"]);
    let mut nonempty = 0usize;
    let mut checked = 0usize;
    for (ci, case) in arr(&d, "cases").iter().enumerate() {
        let st = state(&case["state"]);
        let api = create_improvement_build_api(&st, None);
        assert_eq!(
            api.has_hex_click_handler(),
            case["api"]["has_click"].as_bool().unwrap()
        );
        for key in &keys {
            // `qualifying` zawiera losowy podzbior kluczy per stan (rozmiar wektorow)
            if case["api"]["qualifying"].get(key.as_str()).is_some() {
                let want: Vec<(i32, i32)> = arr(&case["api"]["qualifying"], key)
                    .iter()
                    .map(|p| (int(&p[0]), int(&p[1])))
                    .collect();
                let got = api.get_qualifying_hexes(key);
                assert_eq!(got, want, "stan {ci} klucz {key}");
                nonempty += usize::from(!got.is_empty());
                checked += 1;
            }
            assert_bits(
                &format!("koszt {key}"),
                api.get_work_cost(key),
                num(&case["api"]["work_cost"][key.as_str()]),
            );
        }
        for (i, r) in arr(&case["api"], "requests").iter().enumerate() {
            let (key, q, rr) = (s(&r["key"]), int(&r["q"]), int(&r["r"]));
            assert_eq!(
                api.can_build(key, q, rr),
                r["can_build"].as_bool().unwrap(),
                "can_build {ci}/{i}"
            );
            let got = api.create_build_request(key, q, rr);
            match (&got, r["req"].is_null()) {
                (None, true) => {}
                (Some(req), false) => {
                    assert_eq!(request_json(req)["key"], r["req"]["key"]);
                    assert_eq!(request_json(req)["hexKey"], r["req"]["hexKey"]);
                    assert_eq!(request_json(req)["action"], r["req"]["action"]);
                    assert_bits("req.koszt", req.koszt_praca, num(&r["req"]["kosztPraca"]));
                    assert_eq!(req.q, int(&r["req"]["q"]));
                    assert_eq!(req.r, int(&r["req"]["r"]));
                }
                _ => panic!(
                    "create_build_request {ci}/{i}: rust={got:?} web={}",
                    r["req"]
                ),
            }
        }
    }
    assert!(nonempty > 1000 && checked > 3000, "{nonempty} {checked}");
}

#[test]
fn api_hex_click_and_on_select_match_web() {
    let d = data();
    let (mut requests, mut handlers) = (0usize, 0usize);
    for (ci, case) in arr(&d, "cases").iter().enumerate() {
        let st = state(&case["state"]);
        for (ai, click) in arr(case, "clicks").iter().enumerate() {
            let active = opt_s(&click["active_key"]);
            let api = create_improvement_build_api(&st, active.as_deref());
            let mut calls = 0usize;
            let mut total_calls = 0usize;
            for (ri, res) in arr(click, "results").iter().enumerate() {
                let (q, r) = (int(&res["q"]), int(&res["r"]));
                if res["res"].as_str() == Some("NO_HANDLER") {
                    assert!(!api.has_hex_click_handler(), "{ci}/{ai}/{ri}");
                    continue;
                }
                handlers += 1;
                assert!(api.has_hex_click_handler());
                let before = calls;
                let mut cb = |_: &ImprovementBuildRequest| calls += 1;
                let got = api.handle_hex_click(q, r, Some(&mut cb));
                assert_eq!(
                    calls - before,
                    res["called"].as_u64().unwrap() as usize,
                    "onSelect {ci}/{ai}/{ri}"
                );
                total_calls += calls - before;
                match (&got, res["res"].is_null()) {
                    (None, true) => {}
                    (Some(req), false) => {
                        requests += 1;
                        let w = &res["res"];
                        assert_eq!(req.key, s(&w["key"]));
                        assert_eq!(req.hex_key, s(&w["hexKey"]));
                        assert_eq!(req.action, s(&w["action"]));
                        assert_eq!((req.q, req.r), (int(&w["q"]), int(&w["r"])));
                        assert_bits("click.koszt", req.koszt_praca, num(&w["kosztPraca"]));
                    }
                    _ => panic!("klik {ci}/{ai}/{ri}: rust={got:?} web={}", res["res"]),
                }
            }
            if !api.has_hex_click_handler() {
                assert_eq!(click["calls_total"].as_u64().unwrap(), 0);
            } else {
                assert_eq!(total_calls, click["calls_total"].as_u64().unwrap() as usize);
            }
        }
    }
    assert!(requests > 50 && handlers > 500, "{requests} {handlers}");
}

fn reason_name(r: Option<ForestBlockReason>) -> Value {
    match r {
        None => Value::Null,
        Some(x) => Value::String(format!("{x:?}")),
    }
}

#[test]
fn forest_build_block_reason_matches_web() {
    let d = data();
    let mut seen: BTreeMap<String, usize> = BTreeMap::new();
    for (ci, case) in arr(&d, "cases").iter().enumerate() {
        let st = state(&case["state"]);
        for (name, key) in [
            ("tartak", ForestBuildKey::Tartak),
            ("wyrab", ForestBuildKey::Wyrab),
        ] {
            let got = reason_name(get_forest_build_block_reason(&st, key));
            assert_eq!(got, case["reasons"][name], "stan {ci} {name}");
            *seen.entry(got.to_string()).or_default() += 1;
        }
    }
    // wektory pokrywaja wiele roznych powodow (w tym null)
    assert!(seen.len() >= 4, "zbyt malo roznych powodow: {seen:?}");
}
