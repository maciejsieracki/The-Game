//! P6.M06B2 - `removeTinyLandIslands` (gen-helpers.ts:4946) i `minTinyIslandHexesForTyp` (:4992)
//! wzgledem wektorow z URUCHOMIONEGO weba (pin `edb8fb56`). Wektory: `p6_m06b2_vectors/web-tiny.json`,
//! generator `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06B2-WYSPY-FINALIZACJA-Q1/gen-m06b2-vectors.mjs`.
//! Przypadki: progi 1..13 na 32 mapach (N-1 / N / N+1 dla kazdego progu typu) oraz 4 typy swiata.

#[path = "p6_m06b2_vectors/common.rs"]
mod common;

use civ_engine::domain::map_generator::WorldType;
use civ_engine::domain::mapgen::landsea::{
    min_tiny_island_hexes_for_typ, remove_tiny_land_islands,
};
use common::{
    build_map, cases, check_input, dump, expected_state, load, map_index, map_rows, s,
    WEB_CASES_TINY,
};
use serde_json::Value;

fn root() -> Value {
    load(WEB_CASES_TINY)
}

fn world_type(name: &str) -> WorldType {
    match name {
        "pangea" => WorldType::Pangea,
        "kontynenty" => WorldType::Continents,
        "wyspy" => WorldType::Islands,
        "ziemia" => WorldType::Earth,
        other => panic!("nieznany typ: {other}"),
    }
}

#[test]
fn min_tiny_island_hexes_for_typ_matches_web() {
    let r = root();
    let cs = cases(&r, "minTyp");
    assert_eq!(cs.len(), 4, "cztery typy swiata");
    for c in cs {
        let typ = s(&c["typ"]);
        let expected: usize = s(&c["out"]).parse().expect("usize");
        assert_eq!(
            min_tiny_island_hexes_for_typ(world_type(typ)),
            expected,
            "minTinyIslandHexesForTyp({typ})"
        );
    }
}

#[test]
fn remove_tiny_land_islands_matches_web() {
    let r = root();
    let cs = cases(&r, "tiny");
    assert!(cs.len() >= 500, "za malo przypadkow tiny: {}", cs.len());
    for c in cs {
        let id = c["id"].as_str().unwrap_or("?");
        let idx = map_index(c);
        check_input(&r, idx, id);
        let mut hx = build_map(&r, idx);
        let min = c["min"].as_u64().expect("min") as usize;
        let ret = remove_tiny_land_islands(&mut hx, min);
        let out = &c["out"];
        assert_eq!(ret as u64, out["ret"].as_u64().expect("ret"), "{id}: zwrot");
        assert_eq!(
            dump(&hx),
            expected_state(&r, idx, &out["diff"]),
            "{id}: stan"
        );
    }
}

/// N-1 / N / N+1 dla kazdego progu typu swiata: istnieje mapa, na ktorej zmiana progu o 1 zmienia wynik.
#[test]
fn tiny_threshold_neighbours_are_discriminated() {
    let r = root();
    let cs = cases(&r, "tiny");
    for n in [4usize, 6, 8, 10] {
        let mut diff_below = 0usize;
        let mut diff_above = 0usize;
        let maps: std::collections::BTreeSet<usize> = cs.iter().map(map_index).collect();
        for mi in maps {
            let ret_at = |mn: usize| -> Option<u64> {
                cs.iter()
                    .find(|c| map_index(c) == mi && c["min"].as_u64() == Some(mn as u64))
                    .map(|c| c["out"]["ret"].as_u64().expect("ret"))
            };
            let (Some(a), Some(b), Some(c)) = (ret_at(n - 1), ret_at(n), ret_at(n + 1)) else {
                continue;
            };
            if a != b {
                diff_below += 1;
            }
            if b != c {
                diff_above += 1;
            }
        }
        assert!(diff_below > 0, "prog {n}: brak mapy rozrozniajacej N-1 / N");
        assert!(diff_above > 0, "prog {n}: brak mapy rozrozniajacej N / N+1");
    }
}

/// Wymog M06B1 (a): wektory obejmuja nakladki (las), rzeki i zloza na heksach wodnych i lądowych.
#[test]
fn tiny_vectors_cover_overlays_rivers_and_deposits_on_water_and_land() {
    let r = root();
    let (mut w_las, mut l_las, mut w_riv, mut l_riv, mut w_zl, mut l_zl) = (0, 0, 0, 0, 0, 0);
    let mut seen = std::collections::BTreeSet::new();
    for c in cases(&r, "tiny") {
        let idx = map_index(c);
        if !seen.insert(idx) {
            continue;
        }
        for row in map_rows(&r, idx) {
            let water = matches!(s(&row[1]), "morze" | "plytkie_morze");
            if s(&row[2]) == "las" {
                if water {
                    w_las += 1
                } else {
                    l_las += 1
                }
            }
            if row[4].as_i64() == Some(1) {
                if water {
                    w_riv += 1
                } else {
                    l_riv += 1
                }
            }
            if row[3].as_i64() == Some(1) {
                if water {
                    w_zl += 1
                } else {
                    l_zl += 1
                }
            }
        }
    }
    assert!(w_las > 0 && l_las > 0, "las: woda={w_las} lad={l_las}");
    assert!(w_riv > 0 && l_riv > 0, "rzeka: woda={w_riv} lad={l_riv}");
    assert!(w_zl > 0 && l_zl > 0, "zloze: woda={w_zl} lad={l_zl}");
}
