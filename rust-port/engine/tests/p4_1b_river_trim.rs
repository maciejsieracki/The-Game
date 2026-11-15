//! R-RUSTPORT-P4-1B-Q2-RIVER-TRIM: wektory `trimMediumRenderPathAtMain` (pin `07d2fbd72`,
//! `gra/src/map/gen-helpers.ts` :7623-7634 i :8194-8203) dla
//! `rivers_a::render_trim::trim_medium_render_path_at_main`.
//!
//! - Wektory: `p4_1b_river_trim_vectors/vectors.json` (generator `gen.mjs` wykonuje tekst pinu;
//!   straznik SHA-256 wycietych fragmentow w generatorze, skrot powtorzony nizej).
//! - Pokrycie kategorii z dispatchu liczone w tescie (nie deklarowane w JSON).
//! - Czulosc: lokalne mutanty (`&&` -> `||`, prog `3` -> `2`) musza rozjechac sie z wektorami.
//! - Brak produkcyjnego wolajacego: NIE_ZMIERZONO (wolajacy w P4-1B-Q3).

use std::collections::HashSet;

use civ_engine::domain::mapgen::rivers_a::render_trim::trim_medium_render_path_at_main;
use civ_engine::domain::mapgen::rivers_a::RiverCoord;
use serde_json::Value;

const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
const FRAGMENTS_SHA256: &str = "b087f66e08ff5f3e7b4ed9f632b64ed43568519ca61f9820a020149ed545f943";

struct Case {
    name: String,
    path: Vec<RiverCoord>,
    /// Web `mainPaths` po `mp ?? []` (null -> pusty).
    main_paths: Vec<Vec<RiverCoord>>,
    has_null_main: bool,
    expected: Vec<RiverCoord>,
}

fn coords(v: &Value) -> Vec<RiverCoord> {
    v.as_array()
        .expect("tablica wspolrzednych")
        .iter()
        .map(|p| {
            let a = p.as_array().expect("[q, r]");
            assert_eq!(a.len(), 2, "para [q, r]");
            RiverCoord::new(a[0].as_i64().expect("q"), a[1].as_i64().expect("r"))
        })
        .collect()
}

fn load() -> (Value, Vec<Case>) {
    let root: Value = serde_json::from_str(include_str!("p4_1b_river_trim_vectors/vectors.json"))
        .expect("vectors.json");
    let cases = root["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .map(|c| {
            let mut has_null_main = false;
            let main_paths = c["mainPaths"]
                .as_array()
                .expect("mainPaths")
                .iter()
                .map(|mp| {
                    if mp.is_null() {
                        has_null_main = true;
                        Vec::new()
                    } else {
                        coords(mp)
                    }
                })
                .collect();
            Case {
                name: c["name"].as_str().expect("name").to_string(),
                path: coords(&c["path"]),
                main_paths,
                has_null_main,
                expected: coords(&c["expected"]),
            }
        })
        .collect();
    (root, cases)
}

fn main_keys(c: &Case) -> HashSet<RiverCoord> {
    c.main_paths.iter().flatten().copied().collect()
}

#[test]
fn naglowek_pinu_i_straznik_sha() {
    let (root, cases) = load();
    assert_eq!(root["pin"].as_str(), Some(PIN));
    assert_eq!(root["source"].as_str(), Some("gra/src/map/gen-helpers.ts"));
    assert_eq!(root["fragmentsSha256"].as_str(), Some(FRAGMENTS_SHA256));
    let frags = root["fragments"].as_array().expect("fragments");
    let lines: Vec<(String, i64, i64)> = frags
        .iter()
        .map(|f| {
            let l = f["lines"].as_array().expect("lines");
            (
                f["fn"].as_str().expect("fn").to_string(),
                l[0].as_i64().expect("od"),
                l[1].as_i64().expect("do"),
            )
        })
        .collect();
    assert_eq!(
        lines,
        vec![
            ("hexKey".to_string(), 157, 159),
            ("trimMediumTailAlongMain".to_string(), 7623, 7634),
            ("trimMediumRenderPathAtMain".to_string(), 8194, 8203),
        ]
    );
    assert_eq!(root["count"].as_u64(), Some(cases.len() as u64));
    let trimmed = cases
        .iter()
        .filter(|c| c.expected.len() != c.path.len())
        .count();
    assert_eq!(root["trimmedCount"].as_u64(), Some(trimmed as u64));
    assert!(cases.len() >= 150, "wektorow: {}", cases.len());
    assert!(trimmed >= 50, "przyciec: {trimmed}");
}

#[test]
fn wektory_pinu_trim_medium_render_path_at_main() {
    let (_, cases) = load();
    for c in &cases {
        let got = trim_medium_render_path_at_main(&c.path, &c.main_paths);
        assert_eq!(got, c.expected, "wektor {}", c.name);
        // Wynik jest prefiksem wejscia (funkcja tylko zdejmuje z konca).
        assert_eq!(&c.path[..got.len()], got.as_slice(), "prefiks: {}", c.name);
    }
}

/// Liczniki pokrycia kategorii z dispatchu, liczone z danych wejsciowych (nie z nazw).
#[test]
fn pokrycie_kategorii() {
    let (_, cases) = load();
    let mut len_lt3 = 0;
    let mut empty_main = 0;
    let mut null_main = 0;
    let mut tail_on_main = [0usize; 4]; // 0, 1, 2, >=3 koncowych heksow na main (len >= 3, main niepusty)
    let mut only_last = 0;
    let mut only_prev = 0;
    let mut all_on_main = 0;
    let mut dup_main = 0;
    for c in &cases {
        let keys = main_keys(c);
        let n_main: usize = c.main_paths.iter().map(Vec::len).sum();
        if n_main > keys.len() {
            dup_main += 1;
        }
        if c.has_null_main {
            null_main += 1;
        }
        if c.path.len() < 3 {
            len_lt3 += 1;
            continue;
        }
        if keys.is_empty() {
            empty_main += 1;
            continue;
        }
        let k = c.path.iter().rev().take_while(|p| keys.contains(p)).count();
        tail_on_main[k.min(3)] += 1;
        let n = c.path.len();
        let last = keys.contains(&c.path[n - 1]);
        let prev = keys.contains(&c.path[n - 2]);
        if last && !prev {
            only_last += 1;
        }
        if prev && !last {
            only_prev += 1;
        }
        if k == n {
            all_on_main += 1;
            assert_eq!(c.expected.len(), 2, "cala na main -> 2 heksy: {}", c.name);
        }
    }
    let report = format!(
        "len<3={len_lt3} pusty_main={empty_main} null_main={null_main} ogon={tail_on_main:?} \
         tylko_ostatni={only_last} tylko_przedostatni={only_prev} cala={all_on_main} dup={dup_main}"
    );
    assert!(len_lt3 >= 10, "{report}");
    assert!(empty_main >= 10, "{report}");
    assert!(null_main >= 3, "{report}");
    assert!(tail_on_main.iter().all(|&x| x >= 10), "{report}");
    assert!(only_last >= 10, "{report}");
    assert!(only_prev >= 5, "{report}");
    assert!(all_on_main >= 5, "{report}");
    assert!(dup_main >= 10, "{report}");
}

/// Mutant: `&&` -> `||` w warunku petli.
fn mutant_or(path: &[RiverCoord], keys: &HashSet<RiverCoord>) -> Vec<RiverCoord> {
    if path.len() < 3 || keys.is_empty() {
        return path.to_vec();
    }
    let mut out = path.to_vec();
    while out.len() >= 3 {
        let n = out.len();
        if keys.contains(&out[n - 1]) || keys.contains(&out[n - 2]) {
            out.pop();
        } else {
            break;
        }
    }
    out
}

/// Mutant: prog `3` -> `2` (w strazniku wejscia i w petli).
fn mutant_two(path: &[RiverCoord], keys: &HashSet<RiverCoord>) -> Vec<RiverCoord> {
    if path.len() < 2 || keys.is_empty() {
        return path.to_vec();
    }
    let mut out = path.to_vec();
    while out.len() >= 2 {
        let n = out.len();
        if keys.contains(&out[n - 1]) && keys.contains(&out[n - 2]) {
            out.pop();
        } else {
            break;
        }
    }
    out
}

#[test]
fn czulosc_mutanty_rozjezdzaja_sie_z_wektorami() {
    let (_, cases) = load();
    let diff = |f: fn(&[RiverCoord], &HashSet<RiverCoord>) -> Vec<RiverCoord>| {
        cases
            .iter()
            .filter(|c| f(&c.path, &main_keys(c)) != c.expected)
            .count()
    };
    let d_or = diff(mutant_or);
    let d_two = diff(mutant_two);
    assert!(d_or >= 10, "mutant && -> || wykryty tylko {d_or} razy");
    assert!(d_two >= 5, "mutant 3 -> 2 wykryty tylko {d_two} razy");
}
