//! P6.M05A - masy ladu, centroid, kwadrat centrum, partycje, liczniki komorek i wskazniki pokrycia.
//! Wektory z URUCHOMIONEGO weba; f64 bitowo.

#[path = "p6_m05a_vectors/common.rs"]
mod common;

use std::collections::HashMap;

use civ_engine::domain::mapgen::relief::{
    assert_relief_grid_coverage, cell_can_host_deposit_package, cell_has_copper_package,
    cell_has_highland, cell_has_iron_package, cell_has_mountain, cell_has_relief_package,
    compute_land_mass_centroid, continent_center_square, copper_grid_coverage_ratio,
    count_highlands_in_cell, count_mountains_in_cell, eligible_deposit_land_count,
    eligible_forest_land_count, eligible_relief_land_count, group_land_mass_keys,
    hex_distance_to_center_square, iron_grid_coverage_ratio, land_hexes_by_coverage_cell,
    land_partition_keys_for_distribution, pick_spread_relief_keys, relief_grid_coverage_ratio,
};
use common::{
    assert_f64, cases, cell_from_ref, cont_map, fv, i, idx_hash, key_of, pool_map, s, stat,
    tier_from_web, typ_from_web, u,
};
use serde_json::Value;

fn pairs(v: &Value) -> Vec<(i64, i64)> {
    v.as_array()
        .expect("pary")
        .iter()
        .map(|p| (i(&p[0]), i(&p[1])))
        .collect()
}

#[test]
fn land_hexes_by_coverage_cell_matches_web() {
    let rows = cases("landCells");
    assert!(rows.len() >= 80);
    let (mut non_empty, mut negative, mut fractional_size) = (0, 0, 0);
    for row in rows {
        let keys: Vec<String> = row["keys"]
            .as_array()
            .expect("keys")
            .iter()
            .map(|k| s(k).to_string())
            .collect();
        // `new Set(keys)`: duplikaty zwijaja sie do pierwszego wystapienia
        let mut seen = std::collections::HashSet::new();
        let set: Vec<String> = keys
            .into_iter()
            .filter(|k| seen.insert(k.clone()))
            .collect();
        let size = fv(&row["cellSize"]);
        let got = land_hexes_by_coverage_cell(&set, size);
        let want = row["out"].as_array().expect("out");
        assert_eq!(got.len(), want.len(), "liczba komorek, rozmiar {size}");
        for ((ck, cell), w) in got.iter().zip(want) {
            assert_eq!(ck, s(&w[0]), "klucz komorki, rozmiar {size}");
            assert_eq!(cell, &pairs(&w[1]), "heksy komorki {ck}, rozmiar {size}");
            if ck.starts_with('-') || ck.contains(",-") {
                negative += 1;
            }
        }
        if !got.is_empty() {
            non_empty += 1;
        }
        if size.fract() != 0.0 {
            fractional_size += 1;
        }
    }
    assert!(non_empty > 50 && negative > 20 && fractional_size > 5);
}

#[test]
fn group_land_mass_keys_matches_web() {
    let rows = cases("masses");
    assert!(rows.len() >= 40);
    let (mut multi, mut total) = (0, 0);
    for row in rows {
        let pm = pool_map(u(&row["map"]));
        let got = group_land_mass_keys(&pm.hexes);
        let want = row["out"].as_array().expect("out");
        assert_eq!(got.len(), want.len(), "mapa {} liczba mas", pm.id);
        for (g, w) in got.iter().zip(want) {
            let idxs: Vec<usize> = w.as_array().expect("masa").iter().map(u).collect();
            let keys: Vec<&String> = idxs.iter().map(|ix| &pm.keys[*ix]).collect();
            assert_eq!(g.iter().collect::<Vec<_>>(), keys, "mapa {} masa", pm.id);
        }
        if got.len() > 1 {
            multi += 1;
        }
        total += got.len();
    }
    assert!(multi > 15 && total > 100, "{multi} {total}");
    assert_eq!(i64::try_from(total).unwrap(), stat("masses.total"));
}

fn keys_for_case(pm: &common::PoolMap, case: &Value) -> Vec<String> {
    if case["massIdx"].is_null() {
        case["keys"]
            .as_array()
            .expect("keys")
            .iter()
            .map(|ix| pm.keys[u(ix)].clone())
            .collect()
    } else {
        common::masses(pm.id)[u(&case["massIdx"])].clone()
    }
}

#[test]
fn centroid_center_square_and_distance_match_web() {
    let rows = cases("center");
    assert!(rows.len() >= 200);
    let (mut some, mut none, mut dist_points, mut inside, mut outside) = (0, 0, 0, 0, 0);
    for case in rows {
        let pm = pool_map(u(&case["map"]));
        let keys = keys_for_case(&pm, case);
        let what = format!("mapa {}", pm.id);
        let centroid = compute_land_mass_centroid(&pm.hexes, &keys);
        match (&centroid, &case["centroid"]) {
            (None, Value::Null) => none += 1,
            (Some(c), want) if !want.is_null() => {
                assert_f64(c.0, fv(&want[0]), &format!("{what} centroid q"));
                assert_f64(c.1, fv(&want[1]), &format!("{what} centroid r"));
                some += 1;
            }
            (got, want) => panic!("{what}: centroid {got:?} vs {want}"),
        }
        for sq in case["squares"].as_array().expect("squares") {
            let size = (!sq["size"].is_null()).then(|| fv(&sq["size"]));
            let got = continent_center_square(&pm.hexes, &keys, size);
            match (&got, &sq["out"]) {
                (None, Value::Null) => {}
                (Some(g), want) if !want.is_null() => {
                    let want_keys: Vec<&String> = want["keys"]
                        .as_array()
                        .expect("keys")
                        .iter()
                        .map(|ix| &pm.keys[u(ix)])
                        .collect();
                    assert_eq!(
                        g.keys().iter().collect::<Vec<_>>(),
                        want_keys,
                        "{what} klucze"
                    );
                    let bb = &want["bbox"];
                    assert_f64(g.bbox.q_min, fv(&bb[0]), &format!("{what} bbox qMin"));
                    assert_f64(g.bbox.q_max, fv(&bb[1]), &format!("{what} bbox qMax"));
                    assert_f64(g.bbox.r_min, fv(&bb[2]), &format!("{what} bbox rMin"));
                    assert_f64(g.bbox.r_max, fv(&bb[3]), &format!("{what} bbox rMax"));
                    assert_f64(
                        g.centroid.0,
                        fv(&want["centroid"][0]),
                        &format!("{what} sq centroid q"),
                    );
                    assert_f64(
                        g.centroid.1,
                        fv(&want["centroid"][1]),
                        &format!("{what} sq centroid r"),
                    );
                    for p in sq["dist"].as_array().expect("dist") {
                        let d = hex_distance_to_center_square(fv(&p[0]), fv(&p[1]), Some(g));
                        assert_f64(
                            d,
                            fv(&p[2]),
                            &format!("{what} dystans {} {}", s(&p[0]), s(&p[1])),
                        );
                        dist_points += 1;
                        if d == 0.0 {
                            inside += 1;
                        } else {
                            outside += 1;
                        }
                    }
                }
                (got, want) => panic!("{what}: kwadrat {got:?} vs {want}"),
            }
        }
    }
    assert!(some > 150 && none > 20, "{some} {none}");
    assert!(
        dist_points > 5000 && inside > 500 && outside > 2000,
        "{dist_points} {inside} {outside}"
    );
    // brak kwadratu: odleglosc 0
    let null_sq = cases("nullSquareDist");
    for p in null_sq {
        assert_f64(
            hex_distance_to_center_square(fv(&p[0]), fv(&p[1]), None),
            fv(&p[2]),
            "dystans bez kwadratu",
        );
    }
}

#[test]
fn land_partition_keys_for_distribution_matches_web() {
    let rows = cases("partition");
    assert!(rows.len() >= 400);
    let (mut voronoi, mut masses, mut multi_zone) = (0, 0, 0);
    for case in rows {
        let pm = pool_map(u(&case["map"]));
        let typ = typ_from_web(s(&case["typ"]));
        let n = i(&case["n"]);
        let variant = i(&case["variant"]);
        // `n` w wektorze moze byc wyzerowane (nContinents = 0); formula uzywa pierwotnego `nOrig`
        let cont: Option<HashMap<String, f64>> =
            (variant > 0).then(|| cont_map(&pm, i(&case["nOrig"]), variant));
        let got = land_partition_keys_for_distribution(&pm.hexes, typ, cont.as_ref(), n as f64);
        let what = format!("mapa {} {} wariant {variant}", pm.id, s(&case["typ"]));
        assert_eq!(got.len(), u(&case["zones"]), "{what}: liczba stref");
        let sizes: Vec<usize> = got.iter().map(Vec::len).collect();
        let want_sizes: Vec<usize> = case["sizes"]
            .as_array()
            .expect("sizes")
            .iter()
            .map(u)
            .collect();
        assert_eq!(sizes, want_sizes, "{what}: rozmiary");
        let key_idx: HashMap<&String, usize> =
            pm.keys.iter().enumerate().map(|(a, k)| (k, a)).collect();
        for (z, h) in got.iter().zip(case["hashes"].as_array().expect("hashes")) {
            let idxs: Vec<usize> = z.iter().map(|k| key_idx[k]).collect();
            assert_eq!(idx_hash(&idxs), s(h), "{what}: skrot strefy");
        }
        if got.len() > 1 {
            multi_zone += 1;
        }
        if cont.is_some()
            && n > 0
            && matches!(
                typ,
                civ_engine::domain::map_generator::WorldType::Continents
                    | civ_engine::domain::map_generator::WorldType::Islands
            )
        {
            voronoi += 1;
        } else {
            masses += 1;
        }
    }
    assert!(
        voronoi > 100 && masses > 200 && multi_zone > 150,
        "{voronoi} {masses} {multi_zone}"
    );
    assert_eq!(i64::from(voronoi), stat("partition.voronoiPath"));
}

#[test]
fn cell_counters_and_packages_match_web() {
    let rows = cases("cellCounts");
    assert!(rows.len() > 700);
    let (mut iron_yes, mut iron_no, mut copper_yes, mut copper_no, mut host_yes, mut host_no) =
        (0, 0, 0, 0, 0, 0);
    let mut relief_yes = 0;
    for case in rows {
        let pm = pool_map(u(&case["map"]));
        let tier = tier_from_web(s(&case["tier"]));
        let mut cell = cell_from_ref(&pm, case);
        for p in pairs(&case["extra"]) {
            cell.push(p);
        }
        let what = format!("mapa {} {}", pm.id, s(&case["tier"]));
        assert_eq!(
            count_mountains_in_cell(&cell, &pm.hexes),
            fv_n(&case["mtn"]),
            "{what} gory"
        );
        assert_eq!(
            count_highlands_in_cell(&cell, &pm.hexes),
            fv_n(&case["hi"]),
            "{what} wzgorza"
        );
        assert_eq!(
            cell_has_mountain(&cell, &pm.hexes),
            i(&case["hasM"]) == 1,
            "{what} hasM"
        );
        assert_eq!(
            cell_has_highland(&cell, &pm.hexes),
            i(&case["hasH"]) == 1,
            "{what} hasH"
        );
        let iron = cell_has_iron_package(&cell, &pm.hexes, tier);
        let copper = cell_has_copper_package(&cell, &pm.hexes, tier);
        assert_eq!(iron, i(&case["iron"]) == 1, "{what} iron");
        assert_eq!(copper, i(&case["copper"]) == 1, "{what} copper");
        let medium = civ_engine::domain::mapgen::params::DensityTier::Medium;
        assert_eq!(
            cell_has_iron_package(&cell, &pm.hexes, medium),
            i(&case["ironDef"]) == 1,
            "{what} ironDef"
        );
        assert_eq!(
            cell_has_copper_package(&cell, &pm.hexes, medium),
            i(&case["copperDef"]) == 1,
            "{what} copperDef"
        );
        let relief = cell_has_relief_package(&cell, &pm.hexes);
        assert_eq!(relief, i(&case["relief"]) == 1, "{what} relief");
        assert_eq!(
            eligible_relief_land_count(&cell, &pm.hexes),
            fv_n(&case["eligRelief"]),
            "{what} eligRelief"
        );
        assert_eq!(
            eligible_deposit_land_count(&cell, &pm.hexes),
            fv_n(&case["eligDep"]),
            "{what} eligDep"
        );
        let min_land = fv_n(&case["minLand"]);
        let host = cell_can_host_deposit_package(&cell, &pm.hexes, min_land);
        assert_eq!(host, i(&case["canHost"]) == 1, "{what} canHost");
        assert_eq!(
            eligible_forest_land_count(&cell, &pm.hexes),
            fv_n(&case["eligForest"]),
            "{what} eligForest"
        );
        let bump = |yes: &mut i32, no: &mut i32, v: bool| if v { *yes += 1 } else { *no += 1 };
        bump(&mut iron_yes, &mut iron_no, iron);
        bump(&mut copper_yes, &mut copper_no, copper);
        bump(&mut host_yes, &mut host_no, host);
        if relief {
            relief_yes += 1;
        }
    }
    assert!(iron_yes > 200 && iron_no > 200 && copper_yes > 200 && copper_no > 200);
    assert!(host_yes > 100 && host_no > 100 && relief_yes > 50);
}

#[test]
fn cell_can_host_deposit_package_at_the_min_land_boundary_matches_web() {
    // `eligible < minLand` dla minLand = (liczba kwalifikujacych sie heksow) - 1 / 0 / + 1
    let rows = cases("canHostEdge");
    assert!(rows.len() > 2000);
    let (mut yes, mut no) = (0, 0);
    for case in rows {
        let pm = pool_map(u(&case["map"]));
        let mut cell = cell_from_ref(&pm, case);
        for p in pairs(&case["extra"]) {
            cell.push(p);
        }
        let min_land = fv_n(&case["minLand"]);
        let got = cell_can_host_deposit_package(&cell, &pm.hexes, min_land);
        assert_eq!(
            got,
            i(&case["out"]) == 1,
            "mapa {} minLand {min_land}",
            pm.id
        );
        if got {
            yes += 1;
        } else {
            no += 1;
        }
    }
    assert!(yes > 500 && no > 500, "{yes} {no}");
}

fn fv_n(v: &Value) -> f64 {
    v.as_f64().unwrap_or_else(|| panic!("liczba: {v}"))
}

fn ratio_keys(pm: &common::PoolMap, case: &Value) -> Vec<String> {
    let masses = common::masses(pm.id);
    let mut keys: Vec<String> = if case["all"].as_bool().unwrap_or(false) {
        masses.iter().flatten().cloned().collect()
    } else {
        masses[u(&case["massIdx"])].clone()
    };
    if case["dup"].as_bool().unwrap_or(false) {
        keys.push(keys[0].clone());
    }
    keys
}

#[test]
fn grid_coverage_ratios_match_web() {
    let rows = cases("ratios");
    assert!(rows.len() > 150);
    let (mut full, mut partial, mut asserted, mut not_asserted) = (0, 0, 0, 0);
    for case in rows {
        let pm = pool_map(u(&case["map"]));
        let tier = tier_from_web(s(&case["tier"]));
        let keys = ratio_keys(&pm, case);
        let medium = civ_engine::domain::mapgen::params::DensityTier::Medium;
        let what = format!("mapa {} {}", pm.id, s(&case["tier"]));
        for row in case["iron"].as_array().expect("iron") {
            let cs = fv(&row[0]);
            let a = iron_grid_coverage_ratio(&keys, &pm.hexes, cs, tier);
            assert_f64(a, fv(&row[1]), &format!("{what} iron {}", s(&row[0])));
            assert_f64(
                iron_grid_coverage_ratio(&keys, &pm.hexes, cs, medium),
                fv(&row[2]),
                &format!("{what} iron(def) {}", s(&row[0])),
            );
            if a == 1.0 {
                full += 1;
            } else {
                partial += 1;
            }
        }
        for row in case["copper"].as_array().expect("copper") {
            let cs = fv(&row[0]);
            assert_f64(
                copper_grid_coverage_ratio(&keys, &pm.hexes, cs, tier),
                fv(&row[1]),
                &format!("{what} copper {}", s(&row[0])),
            );
            assert_f64(
                copper_grid_coverage_ratio(&keys, &pm.hexes, cs, medium),
                fv(&row[2]),
                &format!("{what} copper(def) {}", s(&row[0])),
            );
        }
        for row in case["relief"].as_array().expect("relief") {
            let iron_size = fv(&row[1]);
            let copper_size = (!row[2].is_null()).then(|| fv(&row[2]));
            assert_f64(
                relief_grid_coverage_ratio(&keys, &pm.hexes, iron_size, copper_size),
                fv(&row[3]),
                &format!("{what} relief {}", s(&row[0])),
            );
        }
        let asserted_now = assert_relief_grid_coverage(&keys, &pm.hexes, tier);
        assert_eq!(asserted_now, i(&case["assert"]) == 1, "{what} assert");
        if asserted_now {
            asserted += 1;
        } else {
            not_asserted += 1;
        }
    }
    assert!(full > 100 && partial > 100 && asserted > 40 && not_asserted > 40);
}

#[test]
fn pick_spread_relief_keys_matches_web() {
    let rows = cases("pickSpread");
    assert!(rows.len() >= 400);
    let (mut nonempty, mut empty, mut dup) = (0, 0, 0);
    for case in rows {
        let cands: Vec<(String, f64)> = case["cands"]
            .as_array()
            .expect("cands")
            .iter()
            .map(|c| (s(&c[0]).to_string(), fv(&c[1])))
            .collect();
        let got = pick_spread_relief_keys(&cands, fv(&case["count"]), fv(&case["minDist"]));
        let want: Vec<String> = case["out"]
            .as_array()
            .expect("out")
            .iter()
            .map(|k| s(k).to_string())
            .collect();
        assert_eq!(
            got,
            want,
            "count {} minDist {}",
            s(&case["count"]),
            s(&case["minDist"])
        );
        if got.is_empty() {
            empty += 1;
        } else {
            nonempty += 1;
        }
        let mut uniq = cands.iter().map(|c| &c.0).collect::<Vec<_>>();
        uniq.sort();
        uniq.dedup();
        if uniq.len() < cands.len() {
            dup += 1;
        }
    }
    assert!(
        nonempty > 200 && empty > 50 && dup > 10,
        "{nonempty} {empty} {dup}"
    );
    let _ = key_of(0, 0);
}
