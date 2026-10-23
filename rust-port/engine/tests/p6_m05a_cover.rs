//! P6.M05A - wymuszanie minimow i sufit przepelnienia komorki: `pickReliefForceHex`,
//! `forceReliefTypeInCell` (+ opakowania), `capMountainOverflowInCell`, `capHighlandOverflowInCell`,
//! `capReliefOverflowInCell`, `capIronCellReliefSpread`, `ensureMassIronGridCoverage`,
//! `ensureMassCopperGridCoverage`. Wektory z URUCHOMIONEGO weba: wynik, lista zmian, skrot stanu,
//! liczba losowan generatora i NASTEPNA wartosc strumienia (dowod zuzycia `rand`).

#[path = "p6_m05a_vectors/common.rs"]
mod common;

use std::collections::HashSet;

use civ_engine::domain::mapgen::relief::{
    cap_highland_overflow_in_cell, cap_iron_cell_relief_spread, cap_mountain_overflow_in_cell,
    cap_relief_overflow_in_cell, ensure_mass_copper_grid_coverage, ensure_mass_iron_grid_coverage,
    force_copper_highlands_in_cell, force_iron_mountains_in_cell, force_relief_in_cell,
    force_relief_type_in_cell, pick_relief_force_hex, ReliefWant,
};
use common::{
    assert_f64, assert_state, cases, cell_from_ref, fv, i, pool_map, s, stat, tier_from_web, u,
    SeedRand,
};

fn want_of(v: &serde_json::Value) -> ReliefWant {
    match s(v) {
        "mountain" => ReliefWant::Mountain,
        "highland" => ReliefWant::Highland,
        other => panic!("want {other}"),
    }
}

#[test]
fn pick_relief_force_hex_matches_web() {
    let rows = cases("pickForce");
    assert!(rows.len() >= 500);
    let (mut some, mut none, mut protect) = (0, 0, 0);
    for case in rows {
        let pm = pool_map(u(&case["map"]));
        let cell = cell_from_ref(&pm, case);
        let avoid: HashSet<String> = case["avoid"]
            .as_array()
            .expect("avoid")
            .iter()
            .map(|k| s(k).to_string())
            .collect();
        let rr = SeedRand::new(i(&case["seed"]));
        let mut rand = || rr.draw();
        let got = pick_relief_force_hex(
            &cell,
            &pm.hexes,
            &pm.scratch,
            pm.w,
            pm.h,
            want_of(&case["want"]),
            &avoid,
            &mut rand,
            i(&case["ph"]) == 1,
            i(&case["pm"]) == 1,
        );
        let what = format!("mapa {} {}", pm.id, s(&case["want"]));
        match (&got, &case["out"]) {
            (None, serde_json::Value::Null) => none += 1,
            (Some(g), want) if !want.is_null() => {
                assert_eq!(*g, (i(&want[0]), i(&want[1])), "{what} wynik");
                some += 1;
            }
            (g, w) => panic!("{what}: {g:?} vs {w}"),
        }
        assert_eq!(rr.calls(), u(&case["calls"]), "{what}: liczba losowan");
        assert_f64(
            rr.draw(),
            fv(&case["next"]),
            &format!("{what}: nastepna wartosc"),
        );
        if i(&case["ph"]) + i(&case["pm"]) > 0 {
            protect += 1;
        }
    }
    assert!(
        some > 400 && none >= 20 && protect > 200,
        "{some} {none} {protect}"
    );
    assert_eq!(i64::from(none), stat("pickForce.null"));
}

#[test]
fn pick_relief_force_hex_filters_water_cells_like_web() {
    // Web wola funkcje tylko z ladem, wiec filtr wody sprawdza dopiero wektor z woda w liscie `land`.
    let rows = cases("pickForceWater");
    assert!(rows.len() >= 60);
    for case in rows {
        let pm = pool_map(u(&case["map"]));
        let mut land = cell_from_ref(&pm, case);
        let extra = case["waterExtra"].as_array().expect("waterExtra");
        assert!(!extra.is_empty());
        for p in extra {
            land.push((i(&p[0]), i(&p[1])));
        }
        let rr = SeedRand::new(i(&case["seed"]));
        let mut rand = || rr.draw();
        let got = pick_relief_force_hex(
            &land,
            &pm.hexes,
            &pm.scratch,
            pm.w,
            pm.h,
            want_of(&case["want"]),
            &HashSet::new(),
            &mut rand,
            false,
            false,
        );
        let what = format!("mapa {} {} (woda)", pm.id, s(&case["want"]));
        let want = &case["out"];
        assert!(!want.is_null(), "{what}: wektor bez wyniku");
        assert_eq!(got, Some((i(&want[0]), i(&want[1]))), "{what} wynik");
        assert_eq!(rr.calls(), u(&case["calls"]), "{what}: liczba losowan");
        assert_f64(
            rr.draw(),
            fv(&case["next"]),
            &format!("{what}: nastepna wartosc"),
        );
    }
}

#[test]
fn force_relief_type_in_cell_matches_web() {
    let rows = cases("forceType");
    assert!(rows.len() >= 1000);
    let mut changed = std::collections::HashMap::<String, (u32, u32)>::new();
    for case in rows {
        let mut pm = pool_map(u(&case["map"]));
        let base = pm.base.clone();
        let cell = cell_from_ref(&pm, case);
        let tier = tier_from_web(s(&case["tier"]));
        let rr = SeedRand::new(i(&case["seed"]));
        let mut rand = || rr.draw();
        let (w, h) = (pm.w, pm.h);
        let ret = match s(&case["kind"]) {
            "type-mountain" => force_relief_type_in_cell(
                &cell,
                &mut pm.hexes,
                &pm.scratch,
                w,
                h,
                &mut rand,
                ReliefWant::Mountain,
                fv(&case["minCount"]),
                tier,
            ),
            "type-highland" => force_relief_type_in_cell(
                &cell,
                &mut pm.hexes,
                &pm.scratch,
                w,
                h,
                &mut rand,
                ReliefWant::Highland,
                fv(&case["minCount"]),
                tier,
            ),
            "iron" => force_iron_mountains_in_cell(
                &cell,
                &mut pm.hexes,
                &pm.scratch,
                w,
                h,
                &mut rand,
                tier,
            ),
            "copper" => force_copper_highlands_in_cell(
                &cell,
                &mut pm.hexes,
                &pm.scratch,
                w,
                h,
                &mut rand,
                tier,
            ),
            "both" => force_relief_in_cell(&cell, &mut pm.hexes, &pm.scratch, w, h, &mut rand),
            other => panic!("rodzaj {other}"),
        };
        let what = format!("mapa {} {} {}", pm.id, s(&case["kind"]), s(&case["tier"]));
        assert_eq!(ret, i(&case["ret"]) == 1, "{what}: wynik");
        assert_eq!(rr.calls(), u(&case["calls"]), "{what}: liczba losowan");
        assert_f64(
            rr.draw(),
            fv(&case["next"]),
            &format!("{what}: nastepna wartosc"),
        );
        assert_state(&base, &pm.hexes, case, &what);
        let e = changed.entry(s(&case["kind"]).to_string()).or_default();
        if ret {
            e.0 += 1;
        } else {
            e.1 += 1;
        }
    }
    assert_eq!(changed.len(), 5);
    for (kind, (yes, no)) in &changed {
        assert!(*yes > 100 && *no > 100, "{kind}: {yes} {no}");
    }
}

#[test]
fn cap_overflow_in_cell_matches_web() {
    let rows = cases("capCell");
    assert!(rows.len() >= 1000);
    let mut changed = std::collections::HashMap::<String, (u32, u32)>::new();
    for case in rows {
        let mut pm = pool_map(u(&case["map"]));
        let base = pm.base.clone();
        let cell = cell_from_ref(&pm, case);
        let tier = tier_from_web(s(&case["tier"]));
        let ret = match s(&case["kind"]) {
            "mtn" => cap_mountain_overflow_in_cell(&cell, &mut pm.hexes, &pm.scratch, tier, false),
            "hi" => cap_highland_overflow_in_cell(&cell, &mut pm.hexes, &pm.scratch, tier, false),
            "mtn-spread" => {
                cap_mountain_overflow_in_cell(&cell, &mut pm.hexes, &pm.scratch, tier, true)
            }
            "hi-spread" => {
                cap_highland_overflow_in_cell(&cell, &mut pm.hexes, &pm.scratch, tier, true)
            }
            "relief" => cap_relief_overflow_in_cell(&cell, &mut pm.hexes, &pm.scratch, tier),
            other => panic!("rodzaj {other}"),
        };
        let what = format!("mapa {} {} {}", pm.id, s(&case["kind"]), s(&case["tier"]));
        assert_eq!(ret, i(&case["ret"]) == 1, "{what}: wynik");
        assert_state(&base, &pm.hexes, case, &what);
        let e = changed.entry(s(&case["kind"]).to_string()).or_default();
        if ret {
            e.0 += 1;
        } else {
            e.1 += 1;
        }
    }
    assert_eq!(changed.len(), 5);
    for (kind, (yes, no)) in &changed {
        assert!(*yes > 50 && *no > 50, "{kind}: {yes} {no}");
    }
}

#[test]
fn cap_iron_cell_relief_spread_matches_web() {
    let rows = cases("capSpread");
    assert!(rows.len() >= 150);
    let mut changed = 0;
    for case in rows {
        let mut pm = pool_map(u(&case["map"]));
        let base = pm.base.clone();
        let masses = common::masses(pm.id);
        let tier = tier_from_web(s(&case["tier"]));
        cap_iron_cell_relief_spread(
            &mut pm.hexes,
            &pm.scratch,
            tier,
            &masses[u(&case["massIdx"])],
        );
        assert_state(
            &base,
            &pm.hexes,
            case,
            &format!("mapa {} {}", pm.id, s(&case["tier"])),
        );
        if !case["diff"].as_array().expect("diff").is_empty() {
            changed += 1;
        }
    }
    assert!(changed > 60, "{changed}");
}

#[test]
fn ensure_mass_grid_coverage_matches_web() {
    let rows = cases("ensureMass");
    assert!(rows.len() >= 600);
    let mut seen = std::collections::HashMap::<String, (u32, u32)>::new();
    for case in rows {
        let mut pm = pool_map(u(&case["map"]));
        let base = pm.base.clone();
        let masses = common::masses(pm.id);
        let mass = &masses[u(&case["massIdx"])];
        let tier = tier_from_web(s(&case["tier"]));
        let skip_cap = i(&case["skipCap"]) == 1;
        let rr = SeedRand::new(i(&case["seed"]));
        let mut rand = || rr.draw();
        let (w, h) = (pm.w, pm.h);
        let fixed = match s(&case["kind"]) {
            "iron" => ensure_mass_iron_grid_coverage(
                &mut pm.hexes,
                &pm.scratch,
                tier,
                w,
                h,
                mass,
                &mut rand,
                skip_cap,
            ),
            "copper" => ensure_mass_copper_grid_coverage(
                &mut pm.hexes,
                &pm.scratch,
                tier,
                w,
                h,
                mass,
                &mut rand,
                skip_cap,
            ),
            other => panic!("rodzaj {other}"),
        };
        let what = format!(
            "mapa {} {} {} skipCap={skip_cap}",
            pm.id,
            s(&case["kind"]),
            s(&case["tier"])
        );
        assert_f64(
            fixed,
            case["fixed"].as_f64().expect("fixed"),
            &format!("{what}: fixed"),
        );
        assert_eq!(rr.calls(), u(&case["calls"]), "{what}: liczba losowan");
        assert_f64(
            rr.draw(),
            fv(&case["next"]),
            &format!("{what}: nastepna wartosc"),
        );
        assert_state(&base, &pm.hexes, case, &what);
        let key = format!("{}-{}", s(&case["kind"]), skip_cap);
        let e = seen.entry(key).or_default();
        if fixed > 0.0 {
            e.0 += 1;
        } else {
            e.1 += 1;
        }
    }
    assert_eq!(seen.len(), 4);
    for (kind, (yes, no)) in &seen {
        assert!(*yes > 50 && *no > 30, "{kind}: {yes} {no}");
    }
}
