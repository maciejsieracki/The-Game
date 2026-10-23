//! P6.M11 - naprawy ukladu klastrow: twarda separacja stolic, separacja brył, dopakowanie
//! miast-panstw, wyrownanie cwiartek (`clusters.ts:2654-3356`; pin web `edb8fb56`).
//! Fixtures klastrow powstaly z PRAWDZIWYCH funkcji weba i zostaly celowo zepsute (zbyt bliskie
//! stolice, MP przy obcej stolicy, same stolice, jedna cwiartka, brak flagi stolicy), wiec
//! naprawy faktycznie dzialaja (przesuniecia i dropy typow). Mutowane wejscia (`klastry`,
//! `clusterRegions`) i licznik `rand()` sa porownywane z webem.

#[path = "p6_m11_vectors/common.rs"]
mod common;

use civ_engine::domain::hex::HexCoord;
use civ_engine::domain::mapgen::cluster_layout::{
    all_cluster_cities, cluster_body_buffer_radius, cluster_capital_hex,
    enforce_cluster_body_separation_on_klastry, enforce_hard_capital_separation_on_klastry,
    enforce_quarter_spread_on_klastry, foreign_buffers_for_cluster, foreign_repack_anchor,
    repack_all_sparse_cluster_state_cities, repack_cluster_state_cities_if_sparse, SpreadGateOpts,
};
use civ_engine::domain::mapgen::cluster_mass::{
    assign_voronoi_regions, ClusterCity, LandBBox, TypeCluster,
};
use common::*;
use serde_json::Value;

fn fixture(i_: usize) -> &'static Value {
    &web()["cases"]["fixtures"][i_]
}

struct Fx {
    id: &'static str,
    klastry: Vec<TypeCluster>,
    regions: Vec<Vec<HexCoord>>,
    state_count: i64,
    initial: Vec<TypeCluster>,
}

fn load(c: &Value) -> Fx {
    let fx = fixture(u(&c["fixture"]));
    let id = s(&fx["map"]);
    let klastry = clusters_of(&fx["klastry"]);
    let regions = assign_voronoi_regions(lad(id), &hexes(&fx["centers"])).expect("regiony");
    Fx {
        id,
        initial: klastry.clone(),
        klastry,
        regions,
        state_count: i(&fx["stateCount"]),
    }
}

fn gate_of(c: &Value, id: &str) -> Option<SpreadGateOpts> {
    if c["gate"].is_null() {
        return None;
    }
    Some(SpreadGateOpts {
        land_bbox: LandBBox::from_hexes(lad(id)),
        spread_n: i(&c["gate"]["spreadN"]),
    })
}

fn u32_of(v: &Value) -> u32 {
    u32::try_from(i(v)).expect("u32")
}

fn check_after(fx: &Fx, c: &Value, ctx: &str) {
    let want = &c["after"];
    assert_eq!(fx.klastry, clusters_of(&want["klastry"]), "klastry {ctx}");
    assert!(
        regions_match(&fx.regions, &want["regions"]),
        "regiony {ctx}"
    );
}

#[derive(Default)]
struct Stats {
    changed: usize,
    dropped: usize,
    total: usize,
}

fn tally(stats: &mut Stats, fx: &Fx) {
    stats.total += 1;
    if fx.klastry != fx.initial {
        stats.changed += 1;
    }
    if fx.klastry.len() < fx.initial.len() {
        stats.dropped += 1;
    }
}

#[test]
fn fixtures_have_web_shape_and_variety() {
    let cs = cases("fixtures");
    assert!(cs.len() >= 150);
    let mut modes = std::collections::BTreeSet::new();
    for c in cs {
        modes.insert(s(&c["mode"]).to_string());
        let id = s(&c["map"]);
        let ks = clusters_of(&c["klastry"]);
        assert!(ks.len() >= 2);
        let regions = assign_voronoi_regions(lad(id), &hexes(&c["centers"])).expect("regiony");
        assert_eq!(regions.len(), ks.len());
        // wiersz klastra ma jedna rejestracje na region: srodek klastra lezy w swoim regionie
        for (k, r) in ks.iter().zip(&regions) {
            assert!(!r.is_empty() || !lad(id).contains(&k.centrum));
        }
    }
    assert_eq!(modes.len(), 6, "tryby fixtures: {modes:?}");
}

#[test]
fn cluster_helpers_match_web() {
    let cs = cases("clusterHelpers");
    assert!(cs.len() >= 150);
    for (fi, c) in cs.iter().enumerate() {
        let ks = clusters_of(&fixture(fi)["klastry"]);
        let caps: Vec<Option<HexCoord>> = ks.iter().map(cluster_capital_hex).collect();
        let want_caps: Vec<Option<HexCoord>> =
            c["caps"].as_array().unwrap().iter().map(opt_hex).collect();
        assert_eq!(caps, want_caps, "stolice {fi}");
        for (k, w) in ks.iter().zip(c["all"].as_array().unwrap()) {
            assert_eq!(all_cluster_cities(k), hexes(w), "miasta {fi}");
        }
        let rb = i(&c["rb"]) as f64;
        for (ki, w) in c["buffers"].as_array().unwrap().iter().enumerate() {
            let got = foreign_buffers_for_cluster(&ks, ki, rb);
            let w = w.as_array().unwrap();
            assert_eq!(got.len(), w.len(), "bufory {fi}/{ki}");
            for (b, x) in got.iter().zip(w) {
                assert_eq!((b.q, b.r), (i(&x[0]) as i32, i(&x[1]) as i32));
                assert_f64(b.radius, fv(&x[2]), "promien bufora");
            }
        }
        let player = caps[0];
        for a in c["anchors"].as_array().unwrap() {
            let ki = u(&a["ki"]);
            let cap = caps[ki].expect("stolica");
            let got = foreign_repack_anchor(ki, cap, player, i(&a["md"]));
            assert_eq!(got, anchor_of(&a["result"]), "anchor {fi}/{ki} {a}");
        }
    }
    // Przypadki brzegowe: klaster bez miast, bez flagi stolicy, ze stolica na drugiej pozycji.
    let edge = cases("clusterHelpersEdge");
    assert_eq!(edge.len(), 3);
    for e in edge {
        let k = TypeCluster {
            typ_index: 0,
            typ: "x".into(),
            centrum: HexCoord::new(0, 0),
            miasta: cities_of(&e["miasta"]),
            pending_state_slots: None,
            growth_slot: None,
        };
        assert_eq!(cluster_capital_hex(&k), opt_hex(&e["cap"]), "{e}");
    }
    for a in cases("foreignAnchorEdge") {
        let cap = hex(&a["cap"]);
        let player = opt_hex(&a["player"]);
        let got = foreign_repack_anchor(u(&a["ki"]), cap, player, i(&a["md"]));
        assert_eq!(usize::from(got.is_some()), u(&a["result"]), "{a}");
    }
    // bufor body-sep: ceil(S / 2) (zgodny z funkcja czysta)
    assert!((cluster_body_buffer_radius(15.0) - 8.0).abs() < f64::EPSILON);
}

#[test]
fn hard_capital_separation_matches_web() {
    let cs = cases("repair_hard");
    assert!(cs.len() >= 150);
    let mut st = Stats::default();
    let (mut with_gate, mut skipped_sep) = (0, 0);
    for c in cs {
        let mut fx = load(c);
        let id = fx.id;
        let mut rng = CountedRand::new(i(&c["randSeed"]));
        let mut rand = || rng.draw();
        let gate = gate_of(c, id);
        enforce_hard_capital_separation_on_klastry(
            &mut fx.klastry,
            &mut fx.regions,
            map_of(id),
            &mut rand,
            c["useSea"].as_bool().unwrap().then(|| sea(id)),
            i(&c["minSea"]) as f64,
            fv(&c["minSep"]),
            i(&c["minDystObcy"]),
            lad(id),
            cache(id),
            u32_of(&c["seed"]),
            fx.state_count,
            center_of(id),
            i(&c["minMp"]),
            gate.as_ref(),
        );
        check_after(&fx, c, &format!("hard {c}"));
        assert_eq!(rng.calls, u(&c["randCalls"]), "licznik rand {c}");
        tally(&mut st, &fx);
        if gate.is_some() {
            with_gate += 1;
        }
        let ms = fv(&c["minSep"]);
        if !ms.is_finite() || ms <= 0.0 {
            skipped_sep += 1;
        }
    }
    assert!(st.changed > 50, "zmienione {}/{}", st.changed, st.total);
    assert!(st.dropped > 20, "usuniete typy {}/{}", st.dropped, st.total);
    assert!(with_gate > 40 && skipped_sep > 5);
}

#[test]
fn body_separation_matches_web() {
    let cs = cases("repair_body");
    assert!(cs.len() >= 150);
    let mut st = Stats::default();
    let mut skipped = 0;
    for c in cs {
        let mut fx = load(c);
        let id = fx.id;
        let mut rng = CountedRand::new(i(&c["randSeed"]));
        let mut rand = || rng.draw();
        let gate = gate_of(c, id);
        let s_cluster = fv(&c["sCluster"]);
        enforce_cluster_body_separation_on_klastry(
            &mut fx.klastry,
            &mut fx.regions,
            map_of(id),
            &mut rand,
            c["useSea"].as_bool().unwrap().then(|| sea(id)),
            i(&c["minSea"]) as f64,
            s_cluster,
            i(&c["minSep"]) as f64,
            i(&c["minDystObcy"]),
            lad(id),
            cache(id),
            u32_of(&c["seed"]),
            fx.state_count,
            center_of(id),
            i(&c["minMp"]),
            fv(&c["buf"]),
            gate.as_ref(),
        );
        check_after(&fx, c, &format!("body {c}"));
        assert_eq!(rng.calls, u(&c["randCalls"]), "licznik rand {c}");
        tally(&mut st, &fx);
        if !s_cluster.is_finite() || s_cluster <= 0.0 {
            skipped += 1;
        }
    }
    assert!(st.changed > 50, "zmienione {}/{}", st.changed, st.total);
    assert!(st.dropped > 15, "usuniete typy {}/{}", st.dropped, st.total);
    assert!(skipped > 5);
}

#[test]
fn repack_one_matches_web() {
    let cs = cases("repair_repackOne")
        .iter()
        .chain(cases("repair_repackOneExtra").iter())
        .collect::<Vec<_>>();
    assert!(cs.len() >= 200);
    let mut st = Stats::default();
    for c in cs {
        let mut fx = load(c);
        let id = fx.id;
        repack_cluster_state_cities_if_sparse(
            &mut fx.klastry,
            &fx.regions,
            u(&c["ki"]),
            fx.state_count,
            i(&c["minDystObcy"]),
            lad(id),
            u32_of(&c["seed"]),
            i(&c["buf"]) as f64,
            center_of(id),
            i(&c["minMp"]),
        );
        check_after(&fx, c, &format!("repackOne {c}"));
        tally(&mut st, &fx);
    }
    assert!(st.changed > 10, "zmienione {}/{}", st.changed, st.total);
}

#[test]
fn repack_all_matches_web() {
    let cs = cases("repair_repackAll")
        .iter()
        .chain(cases("repair_repackAllExtra").iter())
        .collect::<Vec<_>>();
    assert!(cs.len() >= 100);
    let mut st = Stats::default();
    for c in cs {
        let mut fx = load(c);
        let id = fx.id;
        repack_all_sparse_cluster_state_cities(
            &mut fx.klastry,
            &fx.regions,
            fx.state_count,
            i(&c["minDystObcy"]),
            lad(id),
            u32_of(&c["seed"]),
            i(&c["buf"]) as f64,
            center_of(id),
            i(&c["minMp"]),
        );
        check_after(&fx, c, &format!("repackAll {c}"));
        tally(&mut st, &fx);
    }
    assert!(st.changed > 15, "zmienione {}/{}", st.changed, st.total);
}

#[test]
fn quarter_spread_matches_web() {
    let cs = cases("repair_quarter");
    assert!(cs.len() >= 110);
    let mut st = Stats::default();
    let mut centrum_moved = 0;
    for c in cs {
        let mut fx = load(c);
        let id = fx.id;
        let mut rng = CountedRand::new(i(&c["randSeed"]));
        let mut rand = || rng.draw();
        enforce_quarter_spread_on_klastry(
            &mut fx.klastry,
            &fx.regions,
            map_of(id),
            cache(id),
            lad(id),
            &LandBBox::from_hexes(lad(id)),
            i(&c["nNeeded"]),
            &mut rand,
            c["useSea"].as_bool().unwrap().then(|| sea(id)),
            i(&c["minSea"]) as f64,
            i(&c["minSep"]) as f64,
            i(&c["minDystObcy"]),
            u32_of(&c["seed"]),
            fx.state_count,
            center_of(id),
            i(&c["minMp"]),
            i(&c["buf"]) as f64,
        );
        check_after(&fx, c, &format!("quarter {c}"));
        assert_eq!(rng.calls, u(&c["randCalls"]), "licznik rand {c}");
        tally(&mut st, &fx);
        if fx
            .klastry
            .iter()
            .zip(&fx.initial)
            .any(|(a, b)| a.centrum != b.centrum)
        {
            centrum_moved += 1;
        }
    }
    assert!(st.changed > 10, "zmienione {}/{}", st.changed, st.total);
    assert!(
        centrum_moved > 5,
        "przesuniete centrum klastra: {centrum_moved}"
    );
}

#[allow(dead_code)]
fn _types(_: ClusterCity) {}
