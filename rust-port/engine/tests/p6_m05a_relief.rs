//! P6.M05A - rozmieszczanie gor i wzgorz wg rankingu szumu: `applyIronMountainsToLandKeys`,
//! `applyCopperHighlandsToLandKeys`, `applyReliefToLandKeys`, `applyReliefByNoiseRank`.
//! Wektory z URUCHOMIONEGO weba: lista zmian wzgledem wejscia + skrot calego stanu.

#[path = "p6_m05a_vectors/common.rs"]
mod common;

use civ_engine::domain::map_generator::WorldType;
use civ_engine::domain::mapgen::relief::{
    apply_copper_highlands_to_land_keys, apply_iron_mountains_to_land_keys,
    apply_relief_by_noise_rank, apply_relief_to_land_keys,
};
use common::{assert_state, cases, cont_map, i, pool_map, s, stat, tier_from_web, typ_from_web, u};
use serde_json::Value;

fn spec_keys(pm: &common::PoolMap, spec: &Value) -> Vec<String> {
    match s(&spec["type"]) {
        "allLand" => pm
            .keys
            .iter()
            .filter(|k| !pm.hexes.get(k).expect("hex").terrain.is_water())
            .cloned()
            .collect(),
        "mass" => {
            let masses = common::masses(pm.id);
            let mut keys = masses[u(&spec["massIdx"])].clone();
            if spec["dup"].as_bool().unwrap_or(false) {
                keys.push(keys[0].clone());
            }
            keys
        }
        "explicit" => spec["keys"]
            .as_array()
            .expect("keys")
            .iter()
            .map(|ix| pm.keys[u(ix)].clone())
            .collect(),
        other => panic!("typ specyfikacji {other}"),
    }
}

#[test]
fn apply_relief_to_land_keys_matches_web() {
    let rows = cases("applyKeys");
    assert!(rows.len() >= 200);
    let (mut changed, mut same, mut kinds) = (0, 0, [0; 3]);
    for case in rows {
        let mut pm = pool_map(u(&case["map"]));
        let base = pm.base.clone();
        let tier = tier_from_web(s(&case["tier"]));
        let keys = spec_keys(&pm, &case["spec"]);
        let (w, h) = (pm.w, pm.h);
        match s(&case["kind"]) {
            "iron" => {
                apply_iron_mountains_to_land_keys(&mut pm.hexes, &pm.scratch, tier, &keys, w, h);
                kinds[0] += 1;
            }
            "copper" => {
                apply_copper_highlands_to_land_keys(&mut pm.hexes, &pm.scratch, tier, &keys, w, h);
                kinds[1] += 1;
            }
            "both" => {
                apply_relief_to_land_keys(&mut pm.hexes, &pm.scratch, tier, &keys, w, h);
                kinds[2] += 1;
            }
            other => panic!("rodzaj {other}"),
        }
        assert_state(
            &base,
            &pm.hexes,
            case,
            &format!("mapa {} {} {}", pm.id, s(&case["tier"]), s(&case["kind"])),
        );
        if case["diff"].as_array().expect("diff").is_empty() {
            same += 1;
        } else {
            changed += 1;
        }
    }
    assert!(changed > 100 && same > 20, "{changed} {same}");
    assert!(kinds.iter().all(|k| *k > 40), "{kinds:?}");
    assert!(stat("applyKeys.spec.explicit") > 50 && stat("applyKeys.spec.mass") > 50);
}

#[test]
fn apply_relief_by_noise_rank_matches_web() {
    let rows = cases("applyRank");
    assert!(rows.len() >= 400);
    let (mut with_cont, mut without_cont, mut typs) = (0, 0, std::collections::HashSet::new());
    let mut changed_total = 0;
    for case in rows {
        let mut pm = pool_map(u(&case["map"]));
        let base = pm.base.clone();
        let tier = tier_from_web(s(&case["tier"]));
        let typ = typ_from_web(s(&case["typ"]));
        let n = i(&case["n"]);
        let variant = i(&case["variant"]);
        let cont = (n > 0).then(|| cont_map(&pm, n, variant));
        let (w, h) = (pm.w, pm.h);
        apply_relief_by_noise_rank(
            &mut pm.hexes,
            &pm.scratch,
            tier,
            w,
            h,
            typ,
            cont.as_ref(),
            n as f64,
        );
        assert_state(
            &base,
            &pm.hexes,
            case,
            &format!("mapa {} {} {}", pm.id, s(&case["tier"]), s(&case["typ"])),
        );
        if cont.is_some() {
            with_cont += 1;
        } else {
            without_cont += 1;
        }
        typs.insert(format!("{typ:?}"));
        changed_total += case["diff"].as_array().expect("diff").len();
    }
    assert!(
        with_cont > 100 && without_cont > 200,
        "{with_cont} {without_cont}"
    );
    assert_eq!(typs.len(), 4);
    assert!(changed_total > 20_000, "{changed_total}");
}

#[test]
fn apply_relief_by_noise_rank_default_arguments_match_web() {
    // web: `typ = 'pangea'`, `continentOf = null`, `nContinents = 0`
    let rows = cases("applyRankDefault");
    assert_eq!(rows.len(), 36);
    for case in rows {
        let mut pm = pool_map(u(&case["map"]));
        let base = pm.base.clone();
        let tier = tier_from_web(s(&case["tier"]));
        let (w, h) = (pm.w, pm.h);
        apply_relief_by_noise_rank(
            &mut pm.hexes,
            &pm.scratch,
            tier,
            w,
            h,
            WorldType::Pangea,
            None,
            0.0,
        );
        assert_state(
            &base,
            &pm.hexes,
            case,
            &format!("mapa {} {}", pm.id, s(&case["tier"])),
        );
    }
}
