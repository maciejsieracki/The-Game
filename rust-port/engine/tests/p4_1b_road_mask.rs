//! P4-1B-Q1 (R-RUSTPORT-P4-1B-Q1-ROADMASK): `compute_road_mask` wzgledem URUCHOMIONEGO kodu pinu
//! `07d2fbd72` (`gra/src/map/road-network.ts`: `ROAD_DIRS` :32-34, `computeRoadMask` :75-86,
//! `roadHexesToRefresh` :170-182).
//!
//! Wektory: `p4_1b_road_mask_vectors/vectors.json`, generator `p4_1b_road_mask_vectors/gen.mjs`
//! (tryb `--check` porownuje plik z pinem; strazniki SHA-256 wycietych fragmentow pinu sa w
//! generatorze i powtorzone nizej).
//!
//! * `combos`: wszystkie 64 kombinacje sasiadow x 3 srodki x (srodek z droga / bez).
//! * `maps`: mapy prostokatne ze stalym ziarnem, maska dla KAZDEGO heksa; sasiad spoza mapy =
//!   brak drogi (web `hexHasRoadAt`, `main.ts:3144-3147`).
//! * zgodnosc `ROAD_DIRS` silnika WYLACZNIE z `mapgen::prims::HEX_DIRECTIONS` (silnik nie zalezy
//!   od renderera).
//! * czulosc WEKTOROW: mutant zdefiniowany w tescie (zamiana dwoch kierunkow) musi dac rozbieznosc.
//!   To NIE jest mutacja kodu produkcyjnego — czulosc samej implementacji potwierdzaja reczne
//!   mutacje `road_network.rs` opisane w raportach rundy (Operator r1: 2, Evaluator r1: 1).

use std::collections::{BTreeSet, HashSet};

use civ_engine::domain::mapgen::prims::HEX_DIRECTIONS;
use civ_engine::domain::road_network::{compute_road_mask, ROAD_DIRS};
use serde_json::Value;

const VECTORS: &str = include_str!("p4_1b_road_mask_vectors/vectors.json");

/// Strazniki SHA-256 fragmentow pinu (te same co `EXPECTED_SHA` w `gen.mjs`).
const PIN_EXCERPTS: [(&str, u64, u64, &str); 3] = [
    (
        "ROAD_DIRS",
        32,
        34,
        "18180afa36a20e52221bd5e67e6147bb0390c993043e23524a6c3bfb26df8598",
    ),
    (
        "computeRoadMask",
        75,
        86,
        "407e65b9fb9b1ecae6e9f2ba55f181b26477f7f97b1042cdbc1971796042e08c",
    ),
    (
        "roadHexesToRefresh",
        170,
        182,
        "0911e3586e6807474b0eb65bbe9d2f52500308824c01436d388bfd0733aa717b",
    ),
];

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("vectors.json")
}

fn int(v: &Value) -> i32 {
    i32::try_from(v.as_i64().expect("liczba calkowita")).expect("i32")
}

fn pair(v: &Value) -> (i32, i32) {
    let a = v.as_array().expect("para");
    assert_eq!(a.len(), 2);
    (int(&a[0]), int(&a[1]))
}

/// Jeden przypadek do sprawdzenia: srodek, zbior heksow z droga, granice mapy (None = bez granic),
/// oczekiwana maska.
struct Case {
    q: i32,
    r: i32,
    roads: HashSet<(i32, i32)>,
    bounds: Option<(i32, i32)>,
    mask: u8,
}

fn has_road(case: &Case, q: i32, r: i32) -> bool {
    if let Some((w, h)) = case.bounds {
        if q < 0 || q >= w || r < 0 || r >= h {
            return false;
        }
    }
    case.roads.contains(&(q, r))
}

fn all_cases(v: &Value) -> Vec<Case> {
    let mut out = Vec::new();
    for c in v["combos"].as_array().expect("combos") {
        out.push(Case {
            q: int(&c["q"]),
            r: int(&c["r"]),
            roads: c["roads"].as_array().unwrap().iter().map(pair).collect(),
            bounds: None,
            mask: u8::try_from(c["mask"].as_u64().unwrap()).unwrap(),
        });
    }
    for m in v["maps"].as_array().expect("maps") {
        let w = int(&m["width"]);
        let h = int(&m["height"]);
        let rows = m["roads"].as_array().unwrap();
        let masks = m["masks"].as_array().unwrap();
        assert_eq!(rows.len(), h as usize);
        assert_eq!(masks.len(), h as usize);
        let mut roads = HashSet::new();
        for (r, row) in rows.iter().enumerate() {
            let row = row.as_str().unwrap();
            assert_eq!(row.len(), w as usize);
            for (q, ch) in row.chars().enumerate() {
                if ch == '1' {
                    roads.insert((q as i32, r as i32));
                }
            }
        }
        for (r, row) in masks.iter().enumerate() {
            let row = row.as_array().unwrap();
            assert_eq!(row.len(), w as usize);
            for (q, mask) in row.iter().enumerate() {
                out.push(Case {
                    q: q as i32,
                    r: r as i32,
                    roads: roads.clone(),
                    bounds: Some((w, h)),
                    mask: u8::try_from(mask.as_u64().unwrap()).unwrap(),
                });
            }
        }
    }
    out
}

/// Liczba rozbieznosci implementacji `f` z wektorami.
fn mismatches(cases: &[Case], f: impl Fn(i32, i32, &dyn Fn(i32, i32) -> bool) -> u8) -> usize {
    cases
        .iter()
        .filter(|c| f(c.q, c.r, &|q, r| has_road(c, q, r)) != c.mask)
        .count()
}

#[test]
fn pin_metadata_and_sha_guards() {
    let v = vectors();
    assert_eq!(v["pin"], "07d2fbd72");
    assert_eq!(v["source"], "gra/src/map/road-network.ts");
    let ex = v["excerpts"].as_array().unwrap();
    assert_eq!(ex.len(), PIN_EXCERPTS.len());
    for (e, (name, from, to, sha)) in ex.iter().zip(PIN_EXCERPTS) {
        assert_eq!(e["name"], name);
        assert_eq!(e["from"].as_u64(), Some(from));
        assert_eq!(e["to"].as_u64(), Some(to));
        assert_eq!(e["sha256"], sha, "straznik SHA {name}");
    }
}

#[test]
fn road_dirs_match_pin_and_hex_directions() {
    let v = vectors();
    let pin: Vec<(i32, i32)> = v["road_dirs"]
        .as_array()
        .unwrap()
        .iter()
        .map(pair)
        .collect();
    assert_eq!(
        pin,
        ROAD_DIRS.to_vec(),
        "ROAD_DIRS vs pin road-network.ts:32-34"
    );
    assert_eq!(
        ROAD_DIRS, HEX_DIRECTIONS,
        "ROAD_DIRS vs mapgen::prims::HEX_DIRECTIONS"
    );
}

#[test]
fn combos_cover_all_64_neighbour_sets_per_center() {
    let v = vectors();
    let combos = v["combos"].as_array().unwrap();
    assert!(combos.len() >= 64);
    let mut seen: BTreeSet<(i32, i32, bool, u8)> = BTreeSet::new();
    for c in combos {
        let (q, r) = (int(&c["q"]), int(&c["r"]));
        let roads: HashSet<(i32, i32)> = c["roads"].as_array().unwrap().iter().map(pair).collect();
        let center = roads.contains(&(q, r));
        let mut bits = 0u8;
        for (i, (dq, dr)) in ROAD_DIRS.iter().enumerate() {
            if roads.contains(&(q + dq, r + dr)) {
                bits |= 1 << i;
            }
        }
        seen.insert((q, r, center, bits));
    }
    let centers: BTreeSet<(i32, i32, bool)> = seen.iter().map(|&(q, r, c, _)| (q, r, c)).collect();
    assert!(!centers.is_empty());
    for (q, r, c) in centers {
        let n = seen
            .iter()
            .filter(|&&(a, b, d, _)| (a, b, d) == (q, r, c))
            .count();
        assert_eq!(n, 64, "srodek ({q},{r}) droga={c}: pokrycie 64 kombinacji");
    }
}

#[test]
fn maps_have_enough_hexes_and_edges() {
    let v = vectors();
    let mut hexes = 0usize;
    let mut edge_with_road_cut = 0usize;
    for m in v["maps"].as_array().unwrap() {
        let w = int(&m["width"]);
        let h = int(&m["height"]);
        hexes += (w * h) as usize;
        let rows = m["roads"].as_array().unwrap();
        for (r, row) in rows.iter().enumerate() {
            for q in 0..w {
                let r = r as i32;
                if (q == 0 || q == w - 1 || r == 0 || r == h - 1)
                    && row.as_str().unwrap().as_bytes()[q as usize] == b'1'
                {
                    edge_with_road_cut += 1;
                }
            }
        }
    }
    assert!(hexes >= 200, "heksow na mapach: {hexes}");
    assert!(edge_with_road_cut > 0, "brak brzegowych heksow z droga");
}

#[test]
fn compute_road_mask_matches_pin_vectors() {
    let v = vectors();
    let cases = all_cases(&v);
    assert!(cases.len() >= 64 + 200);
    for c in &cases {
        let got = compute_road_mask(c.q, c.r, |q, r| has_road(c, q, r));
        assert_eq!(got, c.mask, "maska ({},{}) bounds={:?}", c.q, c.r, c.bounds);
        assert!(got <= 0x3F);
    }
    // Kombinacje bez granic: pelna gwiazda (0x3F) musi wystapic, wiec wszystkie 6 bitow da sie
    // ustawic naraz.
    let full_star_on_unbounded = cases
        .iter()
        .filter(|c| c.bounds.is_none() && c.mask == 0x3F)
        .count();
    assert!(full_star_on_unbounded > 0);
}

#[test]
fn map_edge_masks_have_out_of_map_bits_cleared() {
    // Jawnie (nie tylko przez rownosc masek): na heksach brzegowych map z pinu bit kierunku,
    // ktorego sasiad lezy poza mapa, jest WYZEROWANY (sasiad poza mapa = brak drogi,
    // `main.ts:3144-3147`). Liczymy tez, ze takie bity faktycznie wystepuja w wektorach.
    let v = vectors();
    let mut out_of_map_bits = 0usize;
    let mut edge_hexes_with_road_neighbours_inside = 0usize;
    for c in all_cases(&v) {
        let Some((w, h)) = c.bounds else { continue };
        let mut on_edge = false;
        for (i, (dq, dr)) in ROAD_DIRS.iter().enumerate() {
            let (nq, nr) = (c.q + dq, c.r + dr);
            if nq < 0 || nq >= w || nr < 0 || nr >= h {
                on_edge = true;
                out_of_map_bits += 1;
                assert_eq!(
                    c.mask & (1 << i),
                    0,
                    "({},{}) kierunek {i}: sasiad ({nq},{nr}) poza mapa {w}x{h}, a bit ustawiony",
                    c.q,
                    c.r
                );
            }
        }
        if on_edge && c.mask != 0 {
            edge_hexes_with_road_neighbours_inside += 1;
        }
    }
    assert!(out_of_map_bits > 0, "brak kierunkow poza mapa w wektorach");
    assert!(
        edge_hexes_with_road_neighbours_inside > 0,
        "brak heksow brzegowych z niezerowa maska (obciecie niewidoczne)"
    );
}

#[test]
fn refresh_vectors_agree_with_mask_bit_order() {
    // `roadHexesToRefresh` (pin :170-182) = [srodek] + sasiedzi z droga w kolejnosci ROAD_DIRS;
    // wyliczone z maski Rust musi sie zgadzac z pinem (drugi niezalezny odczyt kolejnosci bitow).
    let v = vectors();
    for c in v["combos"].as_array().unwrap() {
        let (q, r) = (int(&c["q"]), int(&c["r"]));
        let roads: HashSet<(i32, i32)> = c["roads"].as_array().unwrap().iter().map(pair).collect();
        let mask = compute_road_mask(q, r, |a, b| roads.contains(&(a, b)));
        let mut expect = vec![(q, r)];
        for (i, (dq, dr)) in ROAD_DIRS.iter().enumerate() {
            if mask & (1 << i) != 0 {
                expect.push((q + dq, r + dr));
            }
        }
        let pin: Vec<(i32, i32)> = c["refresh"].as_array().unwrap().iter().map(pair).collect();
        assert_eq!(pin, expect, "refresh ({q},{r})");
    }
}

#[test]
fn vectors_detect_swapped_direction_order_mutant() {
    // Dowodzi czulosci wektorow (mutant lokalny w tescie), nie kodu produkcyjnego.
    let v = vectors();
    let cases = all_cases(&v);
    let mut swapped = ROAD_DIRS;
    swapped.swap(0, 1);
    let mutant = |q: i32, r: i32, has: &dyn Fn(i32, i32) -> bool| -> u8 {
        let mut m = 0u8;
        for (i, (dq, dr)) in swapped.iter().enumerate() {
            if has(q + dq, r + dr) {
                m |= 1 << i;
            }
        }
        m
    };
    assert!(
        mismatches(&cases, mutant) > 0,
        "wektory nie wykrywaja mutanta kolejnosci kierunkow"
    );
    let original = |q: i32, r: i32, has: &dyn Fn(i32, i32) -> bool| compute_road_mask(q, r, has);
    assert_eq!(mismatches(&cases, original), 0);
}
