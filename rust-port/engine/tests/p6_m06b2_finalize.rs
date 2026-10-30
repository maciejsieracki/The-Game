//! P6.M06B2 - `finalizeLandMassAfterCoast` (gen-helpers.ts:5050) wzgledem wektorow z URUCHOMIONEGO
//! weba (pin `edb8fb56`). Wektory: `p6_m06b2_vectors/web-finalize.json`, generator
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06B2-WYSPY-FINALIZACJA-Q1/gen-m06b2-vectors.mjs`.
//! Przypadki: 12 map (18x18), 4 typy swiata, `coastPasses` 1/2/3/domyslne, `maxInlandPoolSize` brak/8.

#[path = "p6_m06b2_vectors/common.rs"]
mod common;

use civ_engine::data::derived::mapgen_landmass;
use civ_engine::domain::map_generator::WorldType;
use civ_engine::domain::mapgen::landsea::{
    finalize_land_mass_after_coast, finalize_land_mass_after_coast_default,
    min_tiny_island_hexes_for_typ, purge_open_ocean_land_specks, remove_tiny_land_islands,
};
use common::{
    build_map, cases, check_input, dims, dump, expected_state, load, map_index, WEB_CASES_FINALIZE,
};
use serde_json::Value;

fn root() -> Value {
    load(WEB_CASES_FINALIZE)
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

/// `coastPasses` z wektora: `null` = brak argumentu (domyslne 2 z JSON), inaczej liczba.
fn coast_passes(c: &Value) -> usize {
    match c["coastPasses"].as_u64() {
        Some(n) => n as usize,
        None => {
            mapgen_landmass()
                .sprzatanie
                .wybrzeze_przebiegi_domyslne
                .wartosc
        }
    }
}

fn pool(c: &Value) -> Option<usize> {
    c["pool"].as_u64().map(|n| n as usize)
}

#[test]
fn finalize_land_mass_after_coast_matches_web() {
    let r = root();
    let cs = cases(&r, "finalize");
    assert!(cs.len() >= 300, "za malo przypadkow finalize: {}", cs.len());
    for c in cs {
        let id = c["id"].as_str().unwrap_or("?");
        let idx = map_index(c);
        check_input(&r, idx, id);
        let (w, h) = dims(c);
        let mut hx = build_map(&r, idx);
        let ret = finalize_land_mass_after_coast(
            &mut hx,
            world_type(c["typ"].as_str().expect("typ")),
            w,
            h,
            pool(c),
            coast_passes(c),
        );
        let out = &c["out"];
        assert_eq!(ret as u64, out["ret"].as_u64().expect("ret"), "{id}: zwrot");
        assert_eq!(
            dump(&hx),
            expected_state(&r, idx, &out["diff"]),
            "{id}: stan"
        );
    }
}

/// Wariant domyslny (bez opcjonalnych argumentow) = jawne wywolanie z wartosciami z JSON.
#[test]
fn finalize_default_wrapper_equals_explicit_default_on_vectors() {
    let r = root();
    for c in cases(&r, "finalize") {
        if c["coastPasses"].as_u64().is_some() || pool(c).is_some() {
            continue;
        }
        let idx = map_index(c);
        let (w, h) = dims(c);
        let typ = world_type(c["typ"].as_str().expect("typ"));
        let mut a = build_map(&r, idx);
        let mut b = build_map(&r, idx);
        let ra = finalize_land_mass_after_coast_default(&mut a, typ, w, h);
        let rb = finalize_land_mass_after_coast(&mut b, typ, w, h, None, coast_passes(c));
        assert_eq!(ra, rb, "zwrot wrappera");
        assert_eq!(dump(&a), dump(&b), "stan wrappera");
    }
}

/// Dowod nieobserwowalnosci capu petli (`pass < 3`, JSON `przebiegi_maks`): od drugiego przebiegu
/// `removeTiny` + `purge` nie zmieniaja juz stanu (zaden izolowany lad nie powstaje po purge, a skladowe
/// >= progu zostaja). Test sprawdza te wlasnosc na kazdej mapie wektorowej dla kazdego typu.
#[test]
fn land_mass_loop_second_pass_is_noop_on_vectors() {
    let r = root();
    for c in cases(&r, "finalize") {
        if c["coastPasses"].as_u64().is_some() || pool(c).is_some() {
            continue;
        }
        let idx = map_index(c);
        let typ = world_type(c["typ"].as_str().expect("typ"));
        let min = min_tiny_island_hexes_for_typ(typ);
        let mut hx = build_map(&r, idx);
        remove_tiny_land_islands(&mut hx, min);
        purge_open_ocean_land_specks(&mut hx);
        let before = dump(&hx);
        assert_eq!(
            remove_tiny_land_islands(&mut hx, min),
            0,
            "{}: tiny w 2. przebiegu",
            c["id"]
        );
        assert_eq!(
            purge_open_ocean_land_specks(&mut hx),
            0,
            "{}: purge w 2. przebiegu",
            c["id"]
        );
        assert_eq!(dump(&hx), before, "{}: stan", c["id"]);
    }
}

/// Limity N-1 / N / N+1 dla `coastPasses` (przekazywane do finalizeCoastAndInlandWater): istnieje mapa,
/// na ktorej zmiana o 1 zmienia wynik (cp 1 vs 2 oraz cp 2 vs 3).
#[test]
fn coast_passes_neighbours_are_discriminated() {
    let r = root();
    let cs = cases(&r, "finalize");
    let find = |mi: usize, typ: &str, cp: u64, pl: Option<u64>| -> Option<&Value> {
        cs.iter().find(|c| {
            map_index(c) == mi
                && c["typ"].as_str() == Some(typ)
                && c["coastPasses"].as_u64() == Some(cp)
                && c["pool"].as_u64() == pl
        })
    };
    let mut d12 = 0usize;
    let mut d23 = 0usize;
    for c in cs.iter().filter(|c| c["coastPasses"].as_u64() == Some(1)) {
        let mi = map_index(c);
        let typ = c["typ"].as_str().expect("typ");
        let pl = c["pool"].as_u64();
        let (Some(a), Some(b), Some(d)) = (
            find(mi, typ, 1, pl),
            find(mi, typ, 2, pl),
            find(mi, typ, 3, pl),
        ) else {
            continue;
        };
        if a["out"] != b["out"] {
            d12 += 1;
        }
        if b["out"] != d["out"] {
            d23 += 1;
        }
    }
    assert!(d12 > 0, "brak mapy rozrozniajacej coastPasses 1 / 2");
    assert!(d23 > 0, "brak mapy rozrozniajacej coastPasses 2 / 3");
}
