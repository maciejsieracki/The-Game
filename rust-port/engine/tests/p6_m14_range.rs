//! P6.M14 - `map/range-hexes.ts` (1-115): wektory z URUCHOMIONEGO weba (pin edb8fb56).
//! `cityBorderRadius` i `dominantReligion` (P6.16) sa dostarczane przez wywolujacego (Z5); test podaje
//! im WYNIKI prawdziwych funkcji weba z tabel w `range.json` (nie reimplementacje).

#[path = "p6_m14_vectors/common.rs"]
mod common;

use std::collections::BTreeMap;

use civ_engine::domain::territory::{
    collect_culture_range_hex_keys, collect_religion_range_hex_keys,
    collect_territory_hex_keys_by_owner, DominantReligion, DominantStatus, HexOwnerFilter,
    RangeCityInput, ReligionState,
};
use common::*;
use serde_json::Value;

fn data() -> Value {
    load("range.json")
}

fn range_cities(v: &Value) -> Vec<RangeCityInput> {
    v.as_array()
        .unwrap()
        .iter()
        .map(|c| RangeCityInput {
            id: c["id"].as_str().unwrap().to_string(),
            q: int(&c["q"]),
            r: int(&c["r"]),
            owner_id: c["ownerId"].as_i64().unwrap(),
            population: num(&c["population"]),
            kultura: num(&c["kultura"]),
            is_outpost: opt_bool(&c["isOutpost"]),
            is_fort: opt_bool(&c["isFort"]),
        })
        .collect()
}

fn religion_state(v: &Value) -> ReligionState {
    ReligionState {
        counts: v["counts"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, x)| (k.clone(), num(x)))
            .collect(),
    }
}

fn sorted(set: impl IntoIterator<Item = String>) -> Vec<String> {
    let mut v: Vec<String> = set.into_iter().collect();
    v.sort();
    v
}

#[test]
fn territory_keys_by_owner_match_web() {
    let d = data();
    let mut nonempty = 0;
    for (i, c) in arr(&d, "by_owner").iter().enumerate() {
        let keys = strings(&c["keys"]);
        let nodes = territory_nodes(&c["nodes"]);
        let deny_owners: Vec<i64> = c["filter"]["denyOwners"]
            .as_array()
            .map(|a| a.iter().map(|x| x.as_i64().unwrap()).collect())
            .unwrap_or_default();
        let deny_keys: Vec<String> = c["filter"]["denyKeys"]
            .as_array()
            .map(|_| strings(&c["filter"]["denyKeys"]))
            .unwrap_or_default();
        let filter_fn = |key: &str, owner: i64| {
            !deny_owners.contains(&owner) && !deny_keys.iter().any(|k| k == key)
        };
        let filter: Option<&HexOwnerFilter<'_>> = if c["filter"].is_object() {
            Some(&filter_fn)
        } else {
            None
        };
        let got = collect_territory_hex_keys_by_owner(&keys, &nodes, filter);
        let want = c["out"].as_object().unwrap();
        assert_eq!(got.len(), want.len(), "by_owner[{i}] liczba wlascicieli");
        for (owner, set) in &got {
            let w = strings(&want[&owner.to_string()]);
            assert_eq!(
                sorted(set.iter().cloned()),
                sorted(w),
                "by_owner[{i}] owner {owner}"
            );
        }
        nonempty += usize::from(!got.is_empty());
    }
    assert!(nonempty > 5);
}

#[test]
fn culture_range_matches_web() {
    let d = data();
    let borders: Vec<(f64, f64)> = arr(&d, "border")
        .iter()
        .map(|b| (num(&b["kultura"]), num(&b["ring"])))
        .collect();
    let border = |k: f64| {
        borders
            .iter()
            .find(|(kk, _)| kk.to_bits() == k.to_bits() || (kk.is_nan() && k.is_nan()))
            .map(|(_, r)| *r)
            .unwrap_or_else(|| panic!("brak wektora cityBorderRadius dla {k:?}"))
    };
    let mut nonempty = 0;
    for (i, c) in arr(&d, "culture").iter().enumerate() {
        let keys = strings(&c["keys"]);
        let cities = range_cities(&c["cities"]);
        let owner = c["ownerId"].as_i64().unwrap_or(0); // web: domyslnie ownerId = 0
        let got = collect_culture_range_hex_keys(&keys, &cities, owner, &border);
        assert_eq!(
            sorted(got.iter().cloned()),
            sorted(strings(&c["out"])),
            "culture[{i}]"
        );
        nonempty += usize::from(!got.is_empty());
    }
    assert!(nonempty > 10);
}

#[test]
fn religion_range_matches_web() {
    let d = data();
    let dom_rows = arr(&d, "dominant");
    let mut nonempty = 0;
    for (i, c) in arr(&d, "religion").iter().enumerate() {
        let keys = strings(&c["keys"]);
        let cities = range_cities(&c["cities"]);
        let relig: BTreeMap<String, ReligionState> = c["relig"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, v)| (k.clone(), religion_state(v)))
            .collect();
        let prog = num(&c["progDominacjiPct"]);
        let dominant = |rel: &ReligionState| -> DominantReligion {
            let row = dom_rows
                .iter()
                .find(|r| {
                    num(&r["progDominacjiPct"]) == prog && religion_state(r).counts == rel.counts
                })
                .unwrap_or_else(|| panic!("brak wektora dominantReligion dla {:?}", rel.counts));
            let res = &row["result"];
            DominantReligion {
                religion: res["religion"].as_str().map(str::to_string),
                status: match res["status"].as_str().unwrap() {
                    "none" => DominantStatus::None,
                    "mixed" => DominantStatus::Mixed,
                    "dominant" => DominantStatus::Dominant,
                    other => panic!("status {other}"),
                },
            }
        };
        let owner = c["ownerId"].as_i64().unwrap_or(0);
        let got = collect_religion_range_hex_keys(
            &keys,
            &cities,
            &relig,
            c["stateReligion"].as_str(),
            opt_num(&c["szerzenieMaxDystans"]),
            &dominant,
            owner,
        );
        assert_eq!(
            sorted(got.iter().cloned()),
            sorted(strings(&c["out"])),
            "religion[{i}]"
        );
        nonempty += usize::from(!got.is_empty());
    }
    assert!(nonempty > 15);
}
