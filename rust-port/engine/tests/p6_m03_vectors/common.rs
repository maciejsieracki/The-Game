//! Wspolne narzedzia testow P6.M03 (dolaczane przez `#[path]`; plik lezy w katalogu wektorow,
//! wiec nie jest osobnym crate'em testowym).
#![allow(dead_code)]

use civ_engine::domain::mapgen::masks::ContinentCenter;
use civ_engine::domain::mapgen::prims::{mulberry32_step, mulberry32_unit};
use serde_json::Value;

/// Liczba z tekstu wektora weba (`String(x)` z JS; `-0`, `NaN`, `Infinity` jawnie).
pub fn num(value: &Value) -> f64 {
    let text = value
        .as_str()
        .unwrap_or_else(|| panic!("tekst liczby: {value}"));
    match text {
        "NaN" => f64::NAN,
        "Infinity" => f64::INFINITY,
        "-Infinity" => f64::NEG_INFINITY,
        other => other
            .parse()
            .unwrap_or_else(|_| panic!("zly tekst liczby: {other}")),
    }
}

/// Rownosc bitowa f64 (kazdy `NaN` jest rowny kazdemu `NaN`: JS nie rozroznia ich ladunku).
pub fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a.to_bits() == b.to_bits()
}

pub fn int(value: &Value) -> i64 {
    value
        .as_i64()
        .unwrap_or_else(|| panic!("liczba calkowita: {value}"))
}

pub fn dim(value: &Value) -> u32 {
    u32::try_from(int(value)).expect("wymiar u32")
}

/// `mulberry32(seed)` jak w webie: zwraca kolejne wartosci z `[0, 1)`.
pub fn rng(seed: u32) -> impl FnMut() -> f64 {
    let mut state = seed;
    move || {
        let (next, output) = mulberry32_step(state);
        state = next;
        mulberry32_unit(output)
    }
}

pub fn centers(value: &Value) -> Vec<ContinentCenter> {
    value
        .as_array()
        .expect("centra")
        .iter()
        .map(|row| ContinentCenter {
            nq: num(&row[0]),
            nr: num(&row[1]),
            radius: num(&row[2]),
        })
        .collect()
}

pub fn assert_centers(actual: &[ContinentCenter], expected: &[ContinentCenter], what: &str) {
    assert_eq!(actual.len(), expected.len(), "{what}: liczba centrow");
    for (i, (a, e)) in actual.iter().zip(expected).enumerate() {
        for (name, x, y) in [
            ("nq", a.nq, e.nq),
            ("nr", a.nr, e.nr),
            ("radius", a.radius, e.radius),
        ] {
            assert!(
                same(x, y),
                "{what}: centrum {i}.{name}: rust {x:?} (bity {:#x}) != web {y:?} (bity {:#x})",
                x.to_bits(),
                y.to_bits()
            );
        }
    }
}

/// FNV-1a 64 po bajtach (LE) wzorcow bitowych f64 (ten sam algorytm w `gen-m03-web.mjs`).
pub fn fnv_bits(values: &[f64]) -> String {
    let mut hash: u64 = 0xcbf2_9ce4_8422_2325;
    for value in values {
        for byte in value.to_bits().to_le_bytes() {
            hash ^= u64::from(byte);
            hash = hash.wrapping_mul(0x0000_0100_0000_01b3);
        }
    }
    format!("{hash:016x}")
}
