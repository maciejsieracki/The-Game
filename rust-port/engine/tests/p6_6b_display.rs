//! P6.6B - `game/display-names.ts` (311 linii): wektory z URUCHOMIONEGO weba (pin edb8fb56).
//! Oczekiwania pochodza wylacznie z `tests/p6_6b_vectors/display.json`.

#[path = "p6_6b_vectors/common.rs"]
mod common;

use std::collections::HashSet;

use civ_engine::domain::terrain::city_founding::p6_6b::display_names::{
    city_state_label, city_state_separator, clear_city_state_flag_on_capture,
    foreign_capital_map_name, format_city_map_label, format_entity_display_name,
    format_owner_diplo_label, is_cluster_city_state_slot, is_owner_cluster_city_state,
    is_technical_owner_label, resolve_owner_base_name, sanitize_owner_display_base,
    should_force_culture_icon_for_owner, strip_city_state_suffix, CityMapLabelCity,
    CityMapLabelOpts, ClusterSlot, EntityDisplayCtx, ForceCultureIconOpts, OwnerCityRef,
    OwnerCityStateOpts, ResolveOwnerBaseNameInput,
};
use common::*;
use serde_json::Value;

fn data() -> Value {
    load("display.json")
}

fn s(v: &Value) -> Option<&str> {
    v.as_str()
}

/// Wlasciciele klastrowi z wektora (`opts`), jako zbiory i lista miast.
struct OwnerOptsData {
    simplified: Option<HashSet<i64>>,
    typ_copy: Option<HashSet<i64>>,
    cities: Option<Vec<OwnerCityRef>>,
}

fn owner_opts_data(v: &Value) -> Option<OwnerOptsData> {
    if v.is_null() {
        return None;
    }
    let set = |k: &str| {
        v.get(k)
            .map(|a| ids(a).into_iter().collect::<HashSet<i64>>())
    };
    Some(OwnerOptsData {
        simplified: set("simplified"),
        typ_copy: set("typCopy"),
        cities: v.get("cities").map(|a| {
            a.as_array()
                .expect("cities")
                .iter()
                .map(|c| OwnerCityRef {
                    owner_id: c["ownerId"].as_i64().expect("ownerId"),
                    start_city_state: opt_bool(&c["startCityState"]),
                })
                .collect()
        }),
    })
}

fn owner_opts(d: &OwnerOptsData) -> OwnerCityStateOpts<'_> {
    OwnerCityStateOpts {
        simplified_owners: d.simplified.as_ref(),
        typ_copy_owners: d.typ_copy.as_ref(),
        cities: d.cities.as_deref(),
    }
}

#[test]
fn labels_match_running_web() {
    let d = data();
    assert_eq!(city_state_label(), text(&d["constants"]["label"]));
    assert_eq!(city_state_separator(), text(&d["constants"]["separator"]));
}

#[test]
fn format_entity_display_name_matches_web() {
    let d = data();
    let rows = arr(&d, "format");
    assert!(rows.len() >= 140);
    for (i, row) in rows.iter().enumerate() {
        let ctx = EntityDisplayCtx {
            base_name: s(&row["base"]),
            is_city_state: opt_bool(&row["isCs"]),
        };
        assert_eq!(
            format_entity_display_name(&ctx),
            text(&row["out"]),
            "format[{i}]"
        );
    }
}

#[test]
fn strip_city_state_suffix_matches_web() {
    let d = data();
    let rows = arr(&d, "strip");
    assert!(rows.len() >= 40);
    for (i, row) in rows.iter().enumerate() {
        assert_eq!(
            strip_city_state_suffix(&text(&row["name"])),
            text(&row["out"]),
            "strip[{i}]"
        );
    }
}

#[test]
fn is_technical_owner_label_matches_web() {
    let d = data();
    let rows = arr(&d, "technical");
    assert!(rows.len() >= 40);
    let mut trues = 0;
    for (i, row) in rows.iter().enumerate() {
        let got = is_technical_owner_label(s(&row["name"]));
        assert_eq!(got, row["out"].as_bool().expect("out"), "technical[{i}]");
        if got {
            trues += 1;
        }
    }
    assert!(
        trues >= 10 && trues < rows.len(),
        "wektor musi miec oba wyniki"
    );
}

#[test]
fn is_cluster_city_state_slot_matches_web() {
    let d = data();
    let rows = arr(&d, "slot");
    assert_eq!(rows.len(), 27);
    for (i, row) in rows.iter().enumerate() {
        let slot = ClusterSlot {
            is_same_type_rival: opt_bool(&row["rival"]),
            is_cluster_capital: opt_bool(&row["cap"]),
            is_player_capital: opt_bool(&row["player"]),
        };
        assert_eq!(
            is_cluster_city_state_slot(&slot),
            row["out"].as_bool().expect("out"),
            "slot[{i}]"
        );
    }
}

#[test]
fn is_owner_cluster_city_state_matches_web() {
    let d = data();
    let rows = arr(&d, "ownerCs");
    assert!(rows.len() >= 600);
    let mut trues = 0;
    for (i, row) in rows.iter().enumerate() {
        let owner_id = row["ownerId"].as_i64().expect("ownerId");
        let data = owner_opts_data(&row["opts"]);
        let opts = data.as_ref().map(owner_opts);
        let got = is_owner_cluster_city_state(owner_id, opts.as_ref());
        assert_eq!(got, row["out"].as_bool().expect("out"), "ownerCs[{i}]");
        if got {
            trues += 1;
        }
    }
    assert!(trues >= 50, "za malo przypadkow prawdziwych: {trues}");
}

#[test]
fn clear_city_state_flag_on_capture_matches_web() {
    let d = data();
    let rows = arr(&d, "clear");
    assert_eq!(rows.len(), 3);
    for (i, row) in rows.iter().enumerate() {
        let mut flag = opt_bool(&row["before"]);
        let ret = clear_city_state_flag_on_capture(&mut flag);
        assert_eq!(ret, row["ret"].as_bool().expect("ret"), "clear[{i}] ret");
        assert_eq!(flag, opt_bool(&row["after"]), "clear[{i}] after");
    }
}

#[test]
fn should_force_culture_icon_matches_web() {
    let d = data();
    let rows = arr(&d, "force");
    assert!(rows.len() >= 700);
    let mut trues = 0;
    for (i, row) in rows.iter().enumerate() {
        let owner_id = row["ownerId"].as_i64().expect("ownerId");
        let o = &row["opts"];
        let base_data = if o.is_null() {
            None
        } else {
            owner_opts_data(&o["base"])
        };
        let cap_ids: Option<HashSet<i64>> = if o.is_null() {
            None
        } else {
            o.get("clusterCapitalOwnerIds")
                .map(|a| ids(a).into_iter().collect())
        };
        let opts = if o.is_null() {
            None
        } else {
            Some(ForceCultureIconOpts {
                base: base_data.as_ref().map(owner_opts).unwrap_or_default(),
                cluster_capital_owner_ids: cap_ids.as_ref(),
                player_civ_key: s(&o["playerCivKey"]),
                owner_civ_key: s(&o["ownerCivKey"]),
            })
        };
        let got = should_force_culture_icon_for_owner(owner_id, opts.as_ref());
        assert_eq!(got, row["out"].as_bool().expect("out"), "force[{i}]");
        if got {
            trues += 1;
        }
    }
    assert!(trues >= 50, "za malo przypadkow prawdziwych: {trues}");
}

#[test]
fn format_city_map_label_matches_web() {
    let d = data();
    let rows = arr(&d, "mapLabel");
    assert!(rows.len() >= 800);
    let mut capital_names = 0;
    for (i, row) in rows.iter().enumerate() {
        let c = &row["city"];
        let city = CityMapLabelCity {
            name: c["name"].as_str().expect("name"),
            owner_id: c["ownerId"].as_i64().expect("ownerId"),
            start_city_state: opt_bool(&c["startCityState"]),
        };
        let o = &row["opts"];
        let opts = (!o.is_null()).then(|| CityMapLabelOpts {
            player_owner_id: o["playerOwnerId"].as_i64(),
            is_capital: opt_bool(&o["isCapital"]),
            civ_display_name: s(&o["civDisplayName"]),
            is_city_state_owner: opt_bool(&o["isCityStateOwner"]),
        });
        let got = format_city_map_label(&city, opts.as_ref());
        assert_eq!(got, text(&row["out"]), "mapLabel[{i}]");
        if got != city.name {
            capital_names += 1;
        }
    }
    assert!(
        capital_names >= 50,
        "wektor musi pokrywac galaz zmiany nazwy"
    );
}

#[test]
fn format_owner_diplo_label_matches_web() {
    let d = data();
    let rows = arr(&d, "diplo");
    assert!(rows.len() >= 250);
    for (i, row) in rows.iter().enumerate() {
        let data = owner_opts_data(&row["opts"]);
        let opts = data.as_ref().map(owner_opts);
        let got = format_owner_diplo_label(
            &text(&row["base"]),
            row["ownerId"].as_i64().expect("ownerId"),
            opts.as_ref(),
        );
        assert_eq!(got, text(&row["out"]), "diplo[{i}]");
    }
}

#[test]
fn resolve_owner_base_name_matches_web() {
    let d = data();
    let rows = arr(&d, "resolve");
    assert!(rows.len() >= 800);
    let mut distinct = HashSet::new();
    for (i, row) in rows.iter().enumerate() {
        let inp = &row["input"];
        let input = ResolveOwnerBaseNameInput {
            owner_id: inp["ownerId"].as_i64().expect("ownerId"),
            cached: s(&inp["cached"]),
            city_name: s(&inp["cityName"]),
            civ_display_name: s(&inp["civDisplayName"]),
            is_city_state: inp["isCityState"].as_bool().expect("isCityState"),
            is_cluster_capital: opt_bool(&inp["isClusterCapital"]),
        };
        let got = resolve_owner_base_name(&input);
        assert_eq!(got, text(&row["out"]), "resolve[{i}]");
        distinct.insert(got);
    }
    assert!(distinct.len() >= 15, "wektor musi pokrywac rozne wyniki");
}

#[test]
fn sanitize_owner_display_base_matches_web() {
    let d = data();
    let rows = arr(&d, "sanitize");
    assert!(rows.len() >= 300);
    for (i, row) in rows.iter().enumerate() {
        assert_eq!(
            sanitize_owner_display_base(s(&row["base"]), s(&row["civ"])),
            text(&row["out"]),
            "sanitize[{i}]"
        );
    }
}

#[test]
fn foreign_capital_map_name_matches_web() {
    let d = data();
    let rows = arr(&d, "foreign");
    assert!(rows.len() >= 300);
    for (i, row) in rows.iter().enumerate() {
        assert_eq!(
            foreign_capital_map_name(s(&row["city"]), s(&row["civ"])),
            text(&row["out"]),
            "foreign[{i}]"
        );
    }
}
