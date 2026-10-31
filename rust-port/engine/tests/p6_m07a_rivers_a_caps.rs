//! P6.M07A (r3) - wektory galezi i capow wzgledem URUCHOMIONEGO weba (pin `edb8fb56`):
//! - `canRiverFlowThrough` (gen-helpers.ts:5862): wszystkie galezie (morze, relief + zrodlo,
//!   block_existing + allow_key, allow_relief_traversal) z nakladkami na heksach wodnych i ladowych;
//! - `mainRiverCoastMouthMaxGapForDims` (:5554): etykieta 'mala' (area < 4800) -> 5, reszta -> 7;
//! - cap petli `repairRiverPathAdjacency` (guard < 64; odleglosci D = 62..67 na otwartym lądzie);
//! - cap dociagania wybrzeza `coastalRiverRenderPath` (guard < 4; mapa bez Morza).
//!
//! Wektory: `p6_m07a_vectors/web-rivers-a.json`, generator
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-M07A-RZEKI-A-SCIEZKI-POLA-Q1/gen-m07a-vectors.mjs`.

#[path = "p6_m07a_vectors/common.rs"]
mod common;

use civ_engine::domain::mapgen::rivers_a::{
    can_river_flow_through, coastal_river_render_path, main_river_coast_mouth_max_gap_for_dims,
    repair_river_path_adjacency,
};
use common::{build_map, cases, load, path_json, path_of};

#[test]
fn can_river_flow_through_matches_web_all_branches() {
    let r = load();
    let cs = cases(&r, "flow");
    let mut block_river_allow_null_false = 0;
    let mut block_river_allow_cell_true = 0;
    let mut block_river_allow_other_false = 0;
    let mut relief_nonsource_blocked = 0;
    let mut relief_allowed_passes = 0;
    let mut sea_false = 0;
    let mut off_map_false = 0;
    for c in cs {
        let idx = c["map"].as_u64().expect("map") as usize;
        let rec = build_map(&r, idx);
        let cell = c["cell"].as_str().expect("cell");
        let src = c["src"].as_str().expect("src");
        let block = c["block"].as_bool().expect("block");
        let allow = c["allow"].as_str();
        let relief = c["relief"].as_bool().expect("relief");
        let ret = c["ret"].as_bool().expect("ret");
        let hex = rec.get(cell);
        let got = can_river_flow_through(hex, cell, src, block, allow, relief);
        assert_eq!(
            got, ret,
            "map={idx} cell={cell} src={src} block={block} allow={allow:?} relief={relief}"
        );
        let river = hex.is_some_and(|h| h.river_present);
        let relief_hex = hex.is_some_and(|h| {
            matches!(
                h.terrain,
                civ_engine::domain::map_generator::Terrain::Mountains
                    | civ_engine::domain::map_generator::Terrain::Hills
            )
        });
        if hex.is_none() {
            off_map_false += 1;
            assert!(!got);
        }
        if block && river {
            match allow {
                None if !got => block_river_allow_null_false += 1,
                Some(a) if a == cell && got => block_river_allow_cell_true += 1,
                Some(a) if a != cell && !got => block_river_allow_other_false += 1,
                _ => {}
            }
        }
        if relief_hex && !relief && cell != src {
            relief_nonsource_blocked += usize::from(!got);
        }
        if relief_hex && relief && got {
            relief_allowed_passes += 1;
        }
        if hex.is_some_and(|h| h.terrain == civ_engine::domain::map_generator::Terrain::Sea) && !got
        {
            sea_false += 1;
        }
    }
    // Pokrycie galezi (lekcja M06B (d)): kazda galaz sterujaca ma liczne przypadki w wektorach.
    assert!(
        block_river_allow_null_false >= 100,
        "block/null: {block_river_allow_null_false}"
    );
    assert!(
        block_river_allow_cell_true >= 100,
        "block/cell: {block_river_allow_cell_true}"
    );
    assert!(
        block_river_allow_other_false >= 100,
        "block/other: {block_river_allow_other_false}"
    );
    assert!(
        relief_nonsource_blocked >= 100,
        "relief blocked: {relief_nonsource_blocked}"
    );
    assert!(
        relief_allowed_passes >= 100,
        "relief passes: {relief_allowed_passes}"
    );
    assert!(sea_false >= 100, "morze: {sea_false}");
    assert!(off_map_false >= 100, "poza mapa: {off_map_false}");
}

#[test]
fn main_river_coast_mouth_gap_matches_web_size_labels() {
    let r = load();
    let cs = cases(&r, "mouthGap");
    let mut mala = 0;
    let mut standard = 0;
    for c in cs {
        let w = c["w"].as_i64().expect("w");
        let h = c["h"].as_i64().expect("h");
        let ret = c["ret"].as_i64().expect("ret");
        assert_eq!(
            main_river_coast_mouth_max_gap_for_dims(w, h),
            ret,
            "w={w} h={h}"
        );
        if ret == 5 {
            mala += 1;
        } else {
            standard += 1;
        }
    }
    assert!(mala >= 50, "galaz Mala bez wektorow: {mala}");
    assert!(standard >= 50, "galaz standardowa bez wektorow: {standard}");
}

#[test]
fn repair_loop_cap_matches_web_n_minus_1_n_n_plus_1() {
    let r = load();
    let cs = cases(&r, "repairCap");
    let mut truncated = 0;
    let mut completed = 0;
    for c in cs {
        let idx = c["map"].as_u64().expect("map") as usize;
        let rec = build_map(&r, idx);
        let path = path_of(&c["path"]);
        let src = c["sourceKey"].as_str().expect("src");
        let got = repair_river_path_adjacency(&path, &rec, src);
        assert_eq!(path_json(&got), c["ret"], "D={} dir={:?}", c["D"], c["dir"]);
        let last = *path.last().expect("cel");
        if got.last() == Some(&last) {
            completed += 1;
        } else {
            truncated += 1;
        }
    }
    // D <= 64 domyka cel; D >= 65 ucina przed celem (cap 64 iteracji).
    assert!(
        completed >= 6 && truncated >= 4,
        "cap: domkniete={completed} ucięte={truncated}"
    );
}

#[test]
fn coastal_extension_cap_matches_web() {
    let r = load();
    let cs = cases(&r, "coastCap");
    assert_eq!(cs.len(), 3, "oczekiwano 3 przypadkow capu wybrzeza");
    for c in cs {
        let idx = c["map"].as_u64().expect("map") as usize;
        let rec = build_map(&r, idx);
        let path = path_of(&c["path"]);
        let got = coastal_river_render_path(&rec, &path);
        assert_eq!(path_json(&got), c["ret"], "path={:?}", c["path"]);
    }
}
