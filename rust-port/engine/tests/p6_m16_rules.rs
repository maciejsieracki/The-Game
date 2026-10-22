//! P6.M16 - `map/improvement-build.ts` (50-1558): reguly (las / farma / stadnina, warstwy zywnosci,
//! sektory, zloza, hodowla, meta/tech, `hexKeysWithinRadius`). Wektory z URUCHOMIONEGO weba (pin
//! edb8fb56), 0 rozbieznosci; liczby porownywane BITOWO. Kazdy blok liczy tez, ile wynikow bylo
//! "niepustych" (test istotnosci: wektory nie sa trywialne).

#[path = "p6_m16_vectors/common.rs"]
mod common;

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::improvement_build::*;
use civ_engine::domain::improvements::TerrainType;
use civ_engine::domain::start_position::Overlay;
use common::*;
use serde_json::Value;

fn data() -> Value {
    load("rules.json")
}

fn impact_json(i: &Option<ImprovementBuildImpact>) -> Value {
    match i {
        None => Value::Null,
        Some(i) => serde_json::json!({
            "removedImprovements": i.removed_improvements,
            "removesForest": i.removes_forest,
        }),
    }
}

#[test]
fn strip_improvements_when_forest_removed_matches_web() {
    let d = data();
    let rows = arr(&d, "strip_forest_removed");
    let mut shrunk = 0;
    for (i, c) in rows.iter().enumerate() {
        let layers = strs(&c["layers"]);
        let got = strip_improvements_when_forest_removed(&layers);
        assert_eq!(got, strs(&c["out"]), "wiersz {i}");
        if got.len() < layers.len() {
            shrunk += 1;
        }
    }
    assert!(
        shrunk > 20,
        "wektory nie ruszaja warstw zaleznych od lasu: {shrunk}"
    );
}

#[test]
fn legacy_farm_layer_and_strip_match_web() {
    let d = data();
    let mut t = 0;
    for (i, c) in arr(&d, "legacy_farm_layer").iter().enumerate() {
        let got = is_legacy_farm_on_forest_layer(s(&c["key"]), overlay(&c["nakladka"]));
        assert_eq!(got, c["out"].as_bool().unwrap(), "legacy_farm_layer {i}");
        t += usize::from(got);
    }
    assert!(t >= 1, "brak przypadkow prawdziwych: {t}");
    let mut changed = 0;
    for (i, c) in arr(&d, "strip_legacy_farm").iter().enumerate() {
        let layers = strs(&c["layers"]);
        let got = strip_legacy_farm_on_forest(&layers, overlay(&c["nakladka"]));
        assert_eq!(got, strs(&c["out"]), "strip_legacy_farm {i}");
        changed += usize::from(got.len() != layers.len());
    }
    assert!(changed > 10, "farma-relikt nigdy nie usunieta: {changed}");
}

fn legacy_hexes(v: &Value) -> Vec<(String, Option<LegacyFarmHexView>)> {
    arr(v, "hexes")
        .iter()
        .map(|pair| {
            let key = s(&pair[0]).to_owned();
            let view = &pair[1];
            let v = if view.is_null() {
                None
            } else {
                Some(LegacyFarmHexView {
                    nakladka: overlay(&view["nakladka"]),
                    ulepszenie: opt_s(&view["ulepszenie"]),
                    ulepszenia: opt_strs(&view["ulepszenia"]),
                })
            };
            (key, v)
        })
        .collect()
}

fn placed_map(v: &Value) -> Option<BTreeMap<String, Vec<String>>> {
    v.as_object()
        .map(|o| o.iter().map(|(k, val)| (k.clone(), strs(val))).collect())
}

fn report_json(r: &LegacyFarmOnForestReport) -> Value {
    serde_json::json!({
        "changes": r.changes.iter().map(|c| serde_json::json!({
            "hexKey": c.hex_key, "before": c.before, "after": c.after, "fromPlaced": c.from_placed,
        })).collect::<Vec<_>>(),
        "removed": r.removed,
        "scanned": r.scanned,
        "farmsOnOpenTerrain": r.farms_on_open_terrain,
    })
}

#[test]
fn plan_and_remove_legacy_farms_match_web() {
    let d = data();
    let (mut removed, mut open, mut from_placed) = (0, 0, 0);
    for (i, c) in arr(&d, "plan_legacy").iter().enumerate() {
        let hexes = legacy_hexes(c);
        let placed = placed_map(&c["placed"]);
        let got = plan_legacy_farm_on_forest_removal(&hexes, placed.as_ref());
        assert_eq!(report_json(&got), c["out"], "plan {i}");
        removed += got.removed;
        open += got.farms_on_open_terrain;
        from_placed += got.changes.iter().filter(|x| x.from_placed).count();
    }
    assert!(
        removed > 20 && open > 5 && from_placed > 5,
        "{removed} {open} {from_placed}"
    );

    for (i, c) in arr(&d, "remove_legacy").iter().enumerate() {
        let hexes = legacy_hexes(c);
        let mut placed = placed_map(&c["placed"]).unwrap();
        let mut calls: Vec<(String, Vec<String>)> = Vec::new();
        let mut cb = |key: &str, layers: &[String]| calls.push((key.to_owned(), layers.to_vec()));
        let got = remove_legacy_farms_on_forest(&hexes, &mut placed, Some(&mut cb));
        assert_eq!(report_json(&got), c["out"], "remove {i}");
        let want_calls: Vec<(String, Vec<String>)> = arr(c, "calls")
            .iter()
            .map(|x| (s(&x[0]).to_owned(), strs(&x[1])))
            .collect();
        assert_eq!(calls, want_calls, "callbacki {i}");
        let want_placed = placed_map(&c["placed_after"]).unwrap();
        assert_eq!(placed, want_placed, "placed po {i}");

        // bez callbacka: ten sam raport i stan
        let mut placed2 = placed_map(&c["placed"]).unwrap();
        let got2 = remove_legacy_farms_on_forest(&hexes, &mut placed2, None);
        assert_eq!(
            report_json(&got2),
            c["report_no_callback"],
            "remove bez cb {i}"
        );
        assert_eq!(placed2, placed_map(&c["placed_after_no_callback"]).unwrap());
    }
}

#[test]
fn farm_and_owce_base_terrain_match_web() {
    let d = data();
    let (mut f, mut o) = (0, 0);
    for c in arr(&d, "farm_base_terrain") {
        let got = is_farm_base_terrain(terrain(&c["teren"]), overlay(&c["nakladka"]));
        assert_eq!(got, c["out"].as_bool().unwrap(), "{c}");
        f += usize::from(got);
    }
    for c in arr(&d, "owce_base_terrain") {
        let got = is_owce_base_terrain(terrain(&c["teren"]), overlay(&c["nakladka"]));
        assert_eq!(got, c["out"].as_bool().unwrap(), "{c}");
        o += usize::from(got);
    }
    assert!(f > 0 && o > 0);
}

#[test]
fn forest_blocking_and_hints_match_web() {
    let d = data();
    let mut blocked = 0;
    for c in arr(&d, "forest_blocked") {
        let got = is_improvement_blocked_on_forest(s(&c["key"]), overlay(&c["nakladka"]));
        assert_eq!(got, c["out"].as_bool().unwrap(), "{c}");
        blocked += usize::from(got);
    }
    assert!(blocked >= 4, "zbyt malo zablokowanych: {blocked}");
    for c in arr(&d, "stadnina_blocked") {
        let got = is_stadnina_blocked_on_forest(s(&c["key"]), overlay(&c["nakladka"]));
        assert_eq!(got, c["out"].as_bool().unwrap());
    }
    for c in arr(&d, "forest_hint") {
        assert_eq!(
            get_improvement_forest_block_hint(s(&c["key"])),
            s(&c["out"])
        );
    }
}

#[test]
fn replaced_by_build_and_impact_match_web() {
    let d = data();
    let mut nonempty = 0;
    for (i, c) in arr(&d, "replaced_by_build").iter().enumerate() {
        let got = improvements_replaced_by_build(s(&c["key"]), &strs(&c["existing"]));
        assert_eq!(got, strs(&c["out"]), "replaced {i}");
        nonempty += usize::from(!got.is_empty());
    }
    assert!(nonempty > 200, "zbyt malo niepustych zamian: {nonempty}");
    let (mut some, mut none) = (0, 0);
    for (i, c) in arr(&d, "impact").iter().enumerate() {
        let got = compute_improvement_build_impact(
            s(&c["key"]),
            terrain(&c["teren"]),
            overlay(&c["nakladka"]),
            &strs(&c["existing"]),
        );
        assert_eq!(impact_json(&got), c["out"], "impact {i}");
        if got.is_some() {
            some += 1;
        } else {
            none += 1;
        }
    }
    assert!(some > 500 && none > 500, "{some} {none}");
}

#[test]
fn format_impact_list_matches_web() {
    let d = data();
    for c in arr(&d, "format_impact") {
        let imp = ImprovementBuildImpact {
            removed_improvements: strs(&c["impact"]["removedImprovements"]),
            removes_forest: c["impact"]["removesForest"].as_bool().unwrap(),
        };
        assert_eq!(format_improvement_build_impact_list(&imp), s(&c["out"]));
    }
}

#[test]
fn mine_keys_tarasy_civ_and_food_keys_match_web() {
    let d = data();
    for c in arr(&d, "mine_key") {
        let key = opt_s(&c["key"]);
        assert_eq!(
            is_mine_improvement_key(key.as_deref()),
            c["out"].as_bool().unwrap(),
            "{c}"
        );
    }
    for key in strs(&d["mine_keys_set"]) {
        assert!(is_mine_improvement_key(Some(&key)), "{key}");
    }
    for key in strs(&d["food_layer_keys_set"]) {
        assert!(is_food_layer_key(&key), "{key}");
    }
    let mut t = 0;
    for c in arr(&d, "tarasy_civ") {
        let civ = opt_s(&c["civ"]);
        let got = is_tarasy_civ(civ.as_deref());
        assert_eq!(got, c["out"].as_bool().unwrap(), "{c}");
        t += usize::from(got);
    }
    assert!(t >= 5, "tarasy_civ: {t}");
}

#[test]
fn deposit_rules_match_web() {
    let d = data();
    let (mut clay, mut reserve) = (0, 0);
    for c in arr(&d, "deposit_hex") {
        let hex = deposit_hex(&c["hex"]);
        assert_eq!(
            has_blocking_deposit_for_farm(&hex),
            c["blocking_farm"].as_bool().unwrap()
        );
        assert_eq!(
            hex_has_clay_deposit(&hex),
            c["clay"].as_bool().unwrap(),
            "{c}"
        );
        assert_eq!(
            hex_has_deposit_reserve(&hex),
            c["reserve"].as_bool().unwrap(),
            "{c}"
        );
        clay += usize::from(hex_has_clay_deposit(&hex));
        reserve += usize::from(hex_has_deposit_reserve(&hex));
    }
    assert!(clay > 20 && reserve > 100, "{clay} {reserve}");
    let mut allowed = 0;
    for c in arr(&d, "deposit_allows") {
        let hex = deposit_hex(&c["hex"]);
        let got = deposit_allows_player_improvement(s(&c["key"]), &hex);
        assert_eq!(got, c["out"].as_bool().unwrap(), "{c}");
        allowed += usize::from(got);
    }
    assert!(allowed > 50, "deposit_allows: {allowed}");
    for c in arr(&d, "animal_deposit") {
        assert_eq!(
            has_animal_deposit(overlay(&c["nakladka"])),
            c["out"].as_bool().unwrap()
        );
    }
}

#[test]
fn can_add_food_layer_matches_web() {
    let d = data();
    let (mut yes, mut no) = (0, 0);
    for (i, c) in arr(&d, "food_layer").iter().enumerate() {
        let got = can_add_food_layer(&strs(&c["existing"]), s(&c["new_key"]));
        assert_eq!(got, c["out"].as_bool().unwrap(), "food_layer {i}: {c}");
        if got {
            yes += 1;
        } else {
            no += 1;
        }
    }
    assert!(yes > 300 && no > 300, "{yes} {no}");
}

#[test]
fn livestock_dependency_matches_web() {
    let d = data();
    let l = &d["livestock"];
    for c in arr(l, "inca") {
        let civ = opt_s(&c["civ"]);
        assert_eq!(
            is_inca_civ(civ.as_deref()),
            c["inca"].as_bool().unwrap(),
            "{c}"
        );
        assert_eq!(
            is_new_world_civ(civ.as_deref()),
            c["new_world"].as_bool().unwrap(),
            "{c}"
        );
    }
    let mut some = 0;
    for c in arr(l, "key_from") {
        let got = livestock_key_from_improvement(s(&c["key"]));
        assert_eq!(got, opt_s(&c["out"]), "{c}");
        some += usize::from(got.is_some());
    }
    assert!(some >= 4, "{some}");
    let (mut yes, mut no) = (0, 0);
    for c in arr(l, "allowed") {
        let civ = opt_s(&c["civ"]);
        let got = is_livestock_allowed(civ.as_deref(), s(&c["key"]), num(&c["era"]));
        assert_eq!(got, c["out"].as_bool().unwrap(), "{c}");
        if got {
            yes += 1;
        } else {
            no += 1;
        }
    }
    assert!(yes > 100 && no > 20, "allowed {yes} {no}");
    let (mut yes, mut no) = (0, 0);
    for c in arr(l, "unlocked") {
        let got = is_livestock_unlocked_for_placement(
            s(&c["key"]),
            overlay(&c["nakladka"]),
            c["trade"].as_bool().unwrap(),
            num(&c["stock"]),
        );
        assert_eq!(got, c["out"].as_bool().unwrap(), "{c}");
        if got {
            yes += 1;
        } else {
            no += 1;
        }
    }
    assert!(yes > 100 && no > 20, "unlocked {yes} {no}");
    for c in arr(l, "visible") {
        let civ = opt_s(&c["civ"]);
        let got =
            is_improvement_visible_in_build_panel(s(&c["key"]), civ.as_deref(), opt_num(&c["era"]));
        assert_eq!(got, c["out"].as_bool().unwrap(), "{c}");
    }
}

#[test]
fn hex_keys_within_radius_matches_web() {
    let d = data();
    let mut nonempty = 0;
    for (i, c) in arr(&d, "keys_within_radius").iter().enumerate() {
        let hexes: Vec<BuildHex> = arr(c, "hexes")
            .iter()
            .map(|p| BuildHex::new(int(&p[0]), int(&p[1]), TerrainType::Laka, Overlay::Brak))
            .collect();
        let map = BuildMap::new(hexes, vec![]);
        let got = hex_keys_within_radius(int(&c["cq"]), int(&c["cr"]), num(&c["rad"]), &map);
        assert_eq!(got, strs(&c["out"]), "wiersz {i}");
        nonempty += usize::from(!got.is_empty());
    }
    assert!(nonempty > 100, "{nonempty}");
}

#[test]
fn hex_has_road_matches_web() {
    let d = data();
    let mut yes = 0;
    for c in arr(&d, "has_road") {
        let mut hex = BuildHex::new(0, 0, TerrainType::Laka, Overlay::Brak);
        hex.ulepszenie = opt_s(&c["hex"]["ulepszenie"]);
        hex.ulepszenia = opt_strs(&c["hex"]["ulepszenia"]);
        let got = hex_has_road(&hex);
        assert_eq!(got, c["out"].as_bool().unwrap(), "{c}");
        yes += usize::from(got);
    }
    assert!(yes > 30, "{yes}");
}

#[test]
fn improvement_meta_and_tech_gate_match_web() {
    let d = data();
    let mut some = 0;
    for c in arr(&d, "meta") {
        let key = s(&c["key"]);
        let got = get_improvement_meta(key);
        let out = &c["out"];
        match (&got, out.is_null()) {
            (None, true) => {}
            (Some(m), false) => {
                some += 1;
                assert_eq!(m.key, s(&out["key"]));
                assert_eq!(m.nazwa, s(&out["nazwa"]));
                assert_bits(key, m.koszt_praca, num(&out["kosztPraca"]));
                assert_eq!(m.tech_id, opt_s(&out["techId"]), "{key}");
                assert_eq!(m.typ, s(&out["typ"]));
            }
            _ => panic!("meta {key}: rust={got:?} web={out}"),
        }
    }
    assert!(some >= 20, "meta: {some}");
    let (mut yes, mut no) = (0, 0);
    for c in arr(&d, "tech_unlocked") {
        let researched: BTreeSet<String> = strs(&c["researched"]).into_iter().collect();
        let got = is_improvement_tech_unlocked(s(&c["key"]), &researched);
        assert_eq!(got, c["out"].as_bool().unwrap(), "{c}");
        if got {
            yes += 1;
        } else {
            no += 1;
        }
    }
    assert!(yes > 100 && no > 100, "{yes} {no}");
}

#[test]
fn work_cost_scale_matches_web() {
    use civ_engine::domain::improvements::scale_terrain_improvement_work_cost;
    let d = data();
    for c in arr(&d, "work_cost_scale") {
        let base = num(&c["base"]);
        let eras = [None, Some(1.0), Some(2.0), Some(3.0), Some(4.0)];
        for (era, want) in eras.iter().zip(arr(c, "era")) {
            assert_bits(
                "scale",
                scale_terrain_improvement_work_cost(base, *era),
                num(want),
            );
        }
    }
}
