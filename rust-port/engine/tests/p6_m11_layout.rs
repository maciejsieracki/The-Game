//! P6.M11 - losowy wybor miast, stolica klastra na krawedzi, planowanie klastra, przydzial typow
//! i dominacja lokalnego ladu (`clusters.ts:1801-1846`, `2166-2587`; pin web `edb8fb56`).
//! Wektory z URUCHOMIONEGO weba. Zuzycie strumienia `rand()` jest czescia kontraktu (licznik
//! wywolan rowny webowi), a `region` jest sortowany W MIEJSCU jak w webie (`regionAfter`).

#[path = "p6_m11_vectors/common.rs"]
mod common;

use civ_engine::domain::hex::HexCoord;
use civ_engine::domain::map_generator::GeneratedMap;
use civ_engine::domain::mapgen::cluster_layout::{
    assign_types_to_cluster_centers, build_cluster_cities, build_cluster_cities_simple_fallback,
    build_cluster_cities_with_land_gate, build_cluster_layout_with_edge_capital, centroid_of,
    cluster_capital_pos, enforce_local_land_dominance, is_far_enough, layout_to_cluster_cities,
    pick_capital_hex_in_region, poisson_pick_cities, ClusterCitiesResult, PoissonOpts,
};
use civ_engine::domain::mapgen::cluster_mass::{group_habitable_masses, SeaDist};
use common::*;
use serde_json::Value;

fn map_opt(c: &Value, id: &str) -> Option<&'static GeneratedMap> {
    c["useMap"].as_bool().unwrap().then(|| map_of(id))
}

fn sea_opt(c: &Value, id: &str) -> Option<&'static SeaDist> {
    c["useSea"].as_bool().unwrap().then(|| sea(id))
}

fn u32_of(v: &Value) -> u32 {
    u32::try_from(i(v)).expect("u32")
}

fn assert_cities_result(got: &ClusterCitiesResult, want: &Value, ctx: &str) {
    assert_eq!(got.cities, cities_of(&want["cities"]), "{ctx}: miasta");
    assert_eq!(
        got.pending_state_slots,
        hexes(&want["pending"]),
        "{ctx}: pending"
    );
    assert_eq!(got.growth_slot, opt_hex(&want["growth"]), "{ctx}: growth");
}

#[test]
fn poisson_pick_cities_matches_web() {
    let cs = cases("poisson")
        .iter()
        .chain(cases("poissonExtra").iter())
        .collect::<Vec<_>>();
    assert!(cs.len() >= 250);
    let (mut empty, mut full, mut loose) = (0, 0, 0);
    for c in cs {
        let region = hexes(&c["region"]);
        let opts = PoissonOpts {
            min_dist_from: opt_hex(&c["anchor"]),
            min_dist_from_value: if c["anchorVal"].is_null() {
                None
            } else {
                Some(i(&c["anchorVal"]))
            },
            exclude_hex: opt_hex(&c["exclude"]),
        };
        let mut rng = CountedRand::new(i(&c["seed"]));
        let mut rand = || rng.draw();
        let got = poisson_pick_cities(
            &region,
            i(&c["maxMiast"]),
            i(&c["minDist"]),
            &mut rand,
            &opts,
        );
        assert_eq!(got, hexes(&c["result"]), "{c}");
        assert_eq!(rng.calls, u(&c["randCalls"]), "licznik rand {c}");
        if got.is_empty() {
            empty += 1;
        }
        if got.len() >= 3 {
            full += 1;
        }
        if got.len() < 2 && i(&c["minDist"]) > 5 {
            loose += 1;
        }
    }
    assert!(
        empty > 5 && full > 40 && loose > 0,
        "{empty}/{full}/{loose}"
    );
}

#[test]
fn centroid_and_far_enough_match_web() {
    for c in cases("centroid") {
        let p = centroid_of(&hexes(&c["list"]));
        assert_f64(p.q, fv(&c["q"]), "centroid q");
        assert_f64(p.r, fv(&c["r"]), "centroid r");
    }
    let (mut t, mut f_) = (0, 0);
    for c in cases("farEnough") {
        let got = is_far_enough(hex(&c["c"]), &hexes(&c["others"]), fv(&c["minDist"]));
        assert_eq!(got, c["result"].as_bool().unwrap(), "{c}");
        if got {
            t += 1;
        } else {
            f_ += 1;
        }
    }
    assert!(t > 50 && f_ > 50);
}

#[test]
fn pick_capital_hex_in_region_matches_web() {
    let cs = cases("pickCapital")
        .iter()
        .chain(cases("pickCapitalExtra").iter())
        .collect::<Vec<_>>();
    assert!(cs.len() >= 500);
    let (mut some, mut none) = (0, 0);
    let (mut changed, mut unchanged, mut with_rand, mut empty_regions) = (0, 0, 0, 0);
    for c in cs {
        let id = s(&c["map"]);
        let mut region = hexes(&c["region"]);
        let before = region.clone();
        let mut rng = CountedRand::new(i(&c["seed"]));
        let mut rand = || rng.draw();
        let got = pick_capital_hex_in_region(
            &mut region,
            pt(&c["blob"]),
            &mut rand,
            map_opt(c, id),
            sea_opt(c, id),
            i(&c["minSea"]) as f64,
            anchor_of(&c["anchor"]),
            &hexes(&c["prior"]),
            i(&c["minSep"]) as f64,
        );
        assert_eq!(got, opt_hex(&c["result"]), "{c}");
        assert_eq!(rng.calls, u(&c["randCalls"]), "licznik rand {c}");
        assert!(
            region_matches(&region, &c["regionAfter"]),
            "region po wywolaniu {c}"
        );
        assert_eq!(
            region != before,
            c["changed"].as_bool().unwrap(),
            "changed {c}"
        );
        if region != before {
            changed += 1;
        } else {
            unchanged += 1;
        }
        if got.is_some() {
            some += 1;
        } else {
            none += 1;
        }
        if rng.calls > 0 {
            with_rand += 1;
        }
        if before.is_empty() {
            empty_regions += 1;
        }
    }
    assert!(some > 250 && none > 5, "{some}/{none}");
    // Aliasing `seaPool === region`: region zmienia kolejnosc W MIEJSCU (web), a czesc wywolan
    // dostaje nowa tablice (filtr) i region zostaje nietkniety.
    assert!(changed > 15 && unchanged > 100, "{changed}/{unchanged}");
    assert!(
        with_rand > 150,
        "komparator losowal w {with_rand} wywolaniach"
    );
    assert!(empty_regions > 0);
}

#[test]
fn layout_with_edge_capital_matches_web() {
    let cs = cases("layout");
    assert!(cs.len() >= 200);
    let (mut some, mut none) = (0, 0);
    for c in cs {
        let id = s(&c["map"]);
        let mut region = hexes(&c["region"]);
        let mut rng = CountedRand::new(i(&c["randSeed"]));
        let mut rand = || rng.draw();
        let got = build_cluster_layout_with_edge_capital(
            &mut region,
            hex(&c["centrum"]),
            i(&c["count"]),
            i(&c["minDist"]),
            &mut rand,
            anchor_of(&c["anchor"]),
            if c["growthReserve"].is_null() {
                None
            } else {
                Some(i(&c["growthReserve"]))
            },
            map_opt(c, id),
            if c["seed"].is_null() {
                None
            } else {
                Some(u32_of(&c["seed"]))
            },
            sea_opt(c, id),
            i(&c["minSea"]) as f64,
            &hexes(&c["prior"]),
            i(&c["minSep"]) as f64,
        );
        assert_eq!(rng.calls, u(&c["randCalls"]), "licznik rand {c}");
        assert!(
            region_matches(&region, &c["regionAfter"]),
            "region po wywolaniu {c}"
        );
        match (&got, &c["result"]) {
            (None, Value::Null) => none += 1,
            (Some(l), w) => {
                some += 1;
                assert_eq!(l.capital, hex(&w["capital"]), "{c}");
                assert_eq!(l.state_cities, hexes(&w["state"]), "{c}");
                assert_eq!(l.growth_slot, opt_hex(&w["growth"]), "{c}");
                assert_eq!(
                    layout_to_cluster_cities(l),
                    cities_of(&c["cities"]),
                    "layoutToClusterCities {c}"
                );
            }
            (g, w) => panic!("rozbieznosc null: rust {g:?} web {w} ({c})"),
        }
    }
    assert!(some > 100 && none > 20, "{some}/{none}");
}

#[test]
fn build_cluster_cities_matches_web() {
    let cs = cases("cities");
    assert!(cs.len() >= 200);
    let (mut empty_result, mut with_state) = (0, 0);
    for c in cs {
        let id = s(&c["map"]);
        let mut region = hexes(&c["region"]);
        let mut rng = CountedRand::new(i(&c["randSeed"]));
        let mut rand = || rng.draw();
        let got = build_cluster_cities(
            &mut region,
            hex(&c["centrum"]),
            i(&c["count"]),
            i(&c["minDist"]),
            &mut rand,
            anchor_of(&c["anchor"]),
            if c["seed"].is_null() {
                None
            } else {
                Some(u32_of(&c["seed"]))
            },
            map_opt(c, id),
            sea_opt(c, id),
            i(&c["minSea"]) as f64,
            &hexes(&c["prior"]),
            i(&c["minSep"]) as f64,
        );
        assert_cities_result(&got, &c["result"], &format!("{c}"));
        assert_eq!(rng.calls, u(&c["randCalls"]), "licznik rand {c}");
        assert!(
            region_matches(&region, &c["regionAfter"]),
            "region po wywolaniu {c}"
        );
        if got.cities.is_empty() {
            empty_result += 1;
        }
        if got.cities.len() > 1 {
            with_state += 1;
        }
    }
    assert!(
        empty_result > 3 && with_state > 80,
        "{empty_result}/{with_state}"
    );
}

#[test]
fn simple_fallback_matches_web() {
    let cs = cases("fallback");
    assert!(cs.len() >= 200);
    let (mut empty_result, mut with_state) = (0, 0);
    for c in cs {
        let id = s(&c["map"]);
        let mut region = hexes(&c["region"]);
        let got = build_cluster_cities_simple_fallback(
            &mut region,
            hex(&c["centrum"]),
            i(&c["count"]),
            i(&c["minDist"]),
            anchor_of(&c["anchor"]),
            u32_of(&c["seed"]),
            map_opt(c, id),
            sea_opt(c, id),
            i(&c["minSea"]) as f64,
            &hexes(&c["prior"]),
            i(&c["minSep"]) as f64,
        );
        assert_cities_result(&got, &c["result"], &format!("{c}"));
        assert!(
            region_matches(&region, &c["regionAfter"]),
            "region po wywolaniu {c}"
        );
        if got.cities.is_empty() {
            empty_result += 1;
        }
        if got.cities.len() > 1 {
            with_state += 1;
        }
    }
    assert!(
        empty_result > 3 && with_state > 80,
        "{empty_result}/{with_state}"
    );
}

#[test]
fn cities_with_land_gate_match_web() {
    let cs = cases("landGate");
    assert!(cs.len() >= 100);
    let (mut some, mut none, mut moved) = (0, 0, 0);
    for c in cs {
        let id = s(&c["map"]);
        let mut region = hexes(&c["region"]);
        let centrum = hex(&c["centrum"]);
        let mut rng = CountedRand::new(i(&c["randSeed"]));
        let mut rand = || rng.draw();
        let got = build_cluster_cities_with_land_gate(
            map_of(id),
            &mut region,
            centrum,
            i(&c["count"]),
            i(&c["minDist"]),
            &mut rand,
            anchor_of(&c["anchor"]),
            u32_of(&c["seed"]),
            cache(id),
            &hexes(&c["existing"]),
            i(&c["minClusterDist"]) as f64,
            sea_opt(c, id),
            i(&c["minSea"]) as f64,
            &hexes(&c["prior"]),
            i(&c["minSep"]) as f64,
        );
        assert_eq!(rng.calls, u(&c["randCalls"]), "licznik rand {c}");
        assert!(
            region_matches(&region, &c["regionAfter"]),
            "region po wywolaniu {c}"
        );
        match (&got, &c["result"]) {
            (None, Value::Null) => none += 1,
            (Some(g), w) => {
                some += 1;
                assert_eq!(g.cities, cities_of(&w["cities"]), "{c}");
                assert_eq!(g.pending_state_slots, hexes(&w["pending"]), "{c}");
                assert_eq!(g.growth_slot, opt_hex(&w["growth"]), "{c}");
                assert_eq!(g.centrum, hex(&w["centrum"]), "{c}");
                if g.centrum != centrum {
                    moved += 1;
                }
            }
            (g, w) => panic!("rozbieznosc null: rust {g:?} web {w} ({c})"),
        }
    }
    assert!(some > 50, "{some}/{none}");
    assert!(moved > 0 || none > 0, "ani razu nie zmieniono srodka");
}

#[test]
fn capital_pos_matches_web() {
    let cs = cases("capitalPos");
    assert!(cs.len() >= 50);
    for c in cs {
        let got = cluster_capital_pos(&cities_of(&c["cities"]), hex(&c["fb"]));
        assert_eq!(got, hex(&c["result"]), "{c}");
    }
}

#[test]
fn assign_types_matches_web() {
    let cs = cases("assignTypes");
    assert!(cs.len() >= 150);
    let (mut synthetic, mut empty_centers) = (0, 0);
    for c in cs {
        let id = s(&c["map"]);
        let masses = group_habitable_masses(lad(id));
        let roster: Vec<String> = c["roster"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| s(x).to_string())
            .collect();
        let mut rng = CountedRand::new(i(&c["seed"]));
        let mut rand = || rng.draw();
        let centrumy = hexes(&c["centrumy"]);
        let got = assign_types_to_cluster_centers(
            &centrumy,
            &masses,
            s(&c["playerKlucz"]),
            &roster,
            &mut rand,
        );
        let want: Vec<String> = c["result"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| s(x).to_string())
            .collect();
        assert_eq!(got, want, "{c}");
        assert_eq!(rng.calls, u(&c["randCalls"]), "licznik rand {c}");
        if got.iter().any(|k| k.starts_with("typ")) {
            synthetic += 1;
        }
        if centrumy.is_empty() {
            empty_centers += 1;
        }
    }
    // Sciezka `typ${ci}` (brak typow w rosterze) i pusta lista srodkow (wynik ma 1 element).
    assert!(
        synthetic > 5 && empty_centers > 0,
        "{synthetic}/{empty_centers}"
    );
}

#[test]
fn enforce_local_land_dominance_matches_web() {
    let cs = cases("localDominance")
        .iter()
        .chain(cases("localDominanceExtra").iter())
        .collect::<Vec<_>>();
    assert!(cs.len() >= 250);
    let (mut relocated, mut threw, mut dropped_keys) = (0, 0, 0);
    for c in cs {
        let id = s(&c["map"]);
        let before = hexes(&c["centrumy"]);
        let mut centrumy = before.clone();
        let mut regiony =
            civ_engine::domain::mapgen::cluster_mass::assign_voronoi_regions(lad(id), &centrumy)
                .expect("regiony");
        let keys: Vec<String> = c["keys"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| s(x).to_string())
            .collect();
        let mut rng = CountedRand::new(i(&c["seed"]));
        let mut rand = || rng.draw();
        let got = enforce_local_land_dominance(
            map_of(id),
            &mut centrumy,
            &mut regiony,
            &keys,
            lad(id),
            cache(id),
            &mut rand,
            i(&c["minDist"]) as f64,
            center_of(id),
            c["useSea"].as_bool().unwrap().then(|| sea(id)),
            i(&c["minSea"]) as f64,
        );
        assert_eq!(rng.calls, u(&c["randCalls"]), "licznik rand {c}");
        assert_eq!(c["threw"].as_bool().unwrap(), got.is_none(), "{c}");
        // Mutacja WEJSC w miejscu (jak w webie).
        assert_eq!(centrumy, hexes(&c["mutCentrumy"]), "wejsciowe centrumy {c}");
        assert!(
            regions_match(&regiony, &c["mutRegiony"]),
            "wejsciowe regiony {c}"
        );
        let Some(got) = got else {
            threw += 1;
            continue;
        };
        let want = &c["result"];
        assert_eq!(got.centrumy, hexes(&want["centrumy"]), "{c}");
        assert!(regions_match(&got.regiony, &want["regiony"]), "regiony {c}");
        let want_keys: Vec<String> = want["keys"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| s(x).to_string())
            .collect();
        assert_eq!(got.aktywne_klucze, want_keys, "{c}");
        if centrumy != before {
            relocated += 1;
        }
        if got.aktywne_klucze.len() != keys.len() {
            dropped_keys += 1;
        }
    }
    assert!(relocated > 30, "relokacje: {relocated}");
    let _ = (threw, dropped_keys);
    // Pusta lista srodkow: web rzuca TypeError (`centrumy[0]!.q`), port zwraca None.
    let e = &web()["cases"]["localDominanceEmpty"];
    assert!(e["threw"].as_bool().unwrap());
    let id = s(&e["map"]);
    let mut rng = CountedRand::new(1);
    let mut rand = || rng.draw();
    let none = enforce_local_land_dominance(
        map_of(id),
        &mut [],
        &mut [],
        &[],
        lad(id),
        cache(id),
        &mut rand,
        8.0,
        center_of(id),
        None,
        0.0,
    );
    assert!(none.is_none());
}

#[allow(dead_code)]
fn _types(_: HexCoord) {}
