//! P6 SIEGE-TAKTYKA K5i-2a1 (R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2A1-Q1): zgodnosc `domain::siege_tactics_inputs_terrain` z pinem.
//!
//! Wektory: `p6_siege_tactics_inputs_terrain_vectors/vectors.json`, generowane przez
//! `p6_siege_tactics_inputs_terrain_gen.mjs` (Node 22), ktory WYKONUJE tekst pinu `07d2fbd72`
//! (combat.ts:620-687, city-defense.ts:180-190) ze straznikiem SHA-256. Liczniki galezi sa asertowane.

use civ_engine::domain::siege_tactics_inputs_terrain::{
    city_gated_terrain_multiplier, norm_terrain, parse_defense_bonus_pct,
    terrain_defense_multiplier, terrain_river_attack_multiplier, TerrainEntry,
};
use serde_json::Value;
use std::collections::BTreeMap;

const VECTORS: &str = include_str!("p6_siege_tactics_inputs_terrain_vectors/vectors.json");

fn load() -> Value {
    serde_json::from_str(VECTORS).expect("vectors.json jest poprawnym JSON-em")
}

/// Liczba z wektora: tekst `String(x)` ("NaN", "Infinity", "-0", ...).
fn num(v: &Value) -> f64 {
    match v.as_str().expect("liczba jako tekst") {
        "NaN" => f64::NAN,
        "Infinity" => f64::INFINITY,
        "-Infinity" => f64::NEG_INFINITY,
        s => s.parse::<f64>().expect("liczba w wektorze"),
    }
}

/// Rownosc bitowa, z NaN == NaN (rozroznia +0 i -0).
fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a.to_bits() == b.to_bits()
}

struct OwnedRow {
    t: String,
    b: Option<String>,
}

fn rows(v: &Value) -> Vec<OwnedRow> {
    v.as_array()
        .expect("data")
        .iter()
        .map(|r| OwnedRow {
            t: r["t"].as_str().expect("t").to_string(),
            b: r["b"].as_str().map(str::to_string),
        })
        .collect()
}

fn entries(rows: &[OwnedRow]) -> Vec<TerrainEntry<'_>> {
    rows.iter()
        .map(|r| TerrainEntry {
            teren: &r.t,
            bonus_obrona: r.b.as_deref(),
        })
        .collect()
}

fn fnv64<'a>(items: impl Iterator<Item = &'a str>) -> String {
    let mut h: u64 = 0xcbf2_9ce4_8422_2325;
    for s in items {
        for b in s.bytes() {
            h ^= u64::from(b);
            h = h.wrapping_mul(0x0000_0100_0000_01b3);
        }
        h ^= 0x0a;
        h = h.wrapping_mul(0x0000_0100_0000_01b3);
    }
    format!("{h:016x}")
}

#[test]
fn norm_terrain_wektory() {
    let v = load();
    let cases = v["norm"].as_array().expect("norm");
    assert!(cases.len() >= 500, "norm: {}", cases.len());
    for c in cases {
        let s = c["s"].as_str().expect("s");
        let want = c["out"].as_str().expect("out");
        assert_eq!(norm_terrain(s), want, "norm {s:?}");
    }
}

#[test]
fn norm_terrain_wszystkie_punkty_kodowe() {
    let v = load();
    let outs: Vec<String> = (0u32..=0x10ffff)
        .filter_map(char::from_u32)
        .map(|c| norm_terrain(&c.to_string()))
        .collect();
    assert_eq!(
        outs.len() as u64,
        v["normAllCount"].as_u64().expect("count")
    );
    assert_eq!(
        fnv64(outs.iter().map(String::as_str)),
        v["normAllFnv"].as_str().expect("fnv")
    );
}

#[test]
fn norm_terrain_sekwencje_znakow_laczacych() {
    let v = load();
    let cases = v["seq"].as_array().expect("seq");
    assert!(cases.len() >= 2000, "seq: {}", cases.len());
    for c in cases {
        let s = c["s"].as_str().expect("s");
        let want = c["out"].as_str().expect("out");
        assert_eq!(norm_terrain(s), want, "seq {s:?}");
    }
}

#[test]
fn norm_terrain_pary_znakow_laczacych_wszystkie() {
    // Kazda para (x, y) niestartowych (ccc>0) w sekwencji "a"+x+y: porzadek ccc jak w Node.
    let v = load();
    let cps: Vec<u32> = v["cccCps"]
        .as_array()
        .expect("cccCps")
        .iter()
        .map(|c| c.as_u64().expect("cp") as u32)
        .collect();
    assert!(cps.len() >= 900, "cccCps: {}", cps.len());
    let chars: Vec<char> = cps.iter().filter_map(|&c| char::from_u32(c)).collect();
    let mut outs: Vec<String> = Vec::with_capacity(chars.len() * chars.len());
    for &x in &chars {
        for &y in &chars {
            outs.push(norm_terrain(&format!("a{x}{y}")));
        }
    }
    assert_eq!(
        outs.len() as u64,
        v["cccPairCount"].as_u64().expect("count")
    );
    assert_eq!(
        fnv64(outs.iter().map(String::as_str)),
        v["cccPairFnv"].as_str().expect("fnv")
    );
}

#[test]
fn parse_defense_bonus_pct_wektory() {
    let v = load();
    let cases = v["bonus"].as_array().expect("bonus");
    assert!(cases.len() >= 300, "bonus: {}", cases.len());
    let (mut none_cnt, mut some_cnt, mut undef_cnt) = (0, 0, 0);
    for c in cases {
        let b = c["b"].as_str();
        if b.is_none() {
            undef_cnt += 1;
        }
        let got = parse_defense_bonus_pct(b);
        match (&c["out"], got) {
            (Value::Null, None) => none_cnt += 1,
            (o, Some(g)) if !o.is_null() => {
                some_cnt += 1;
                assert!(same(num(o), g), "bonus {b:?}: {g} != {o}");
            }
            (o, g) => panic!("bonus {b:?}: oczekiwano {o}, jest {g:?}"),
        }
    }
    assert!(none_cnt > 0 && some_cnt > 0 && undef_cnt > 0);
}

#[test]
fn terrain_defense_multiplier_wektory() {
    let v = load();
    let cases = v["def"].as_array().expect("def");
    assert!(cases.len() >= 500, "def: {}", cases.len());
    let mut counts: BTreeMap<String, u32> = BTreeMap::new();
    for c in cases {
        let data = rows(&c["data"]);
        let got = terrain_defense_multiplier(
            c["terr"].as_str().expect("terr"),
            c["role"].as_str().expect("role"),
            &entries(&data),
        );
        assert!(same(num(&c["out"]), got), "def {c}: got {got}");
        *counts
            .entry(c["br"].as_str().expect("br").to_string())
            .or_default() += 1;
    }
    for k in [
        "def_early",
        "def_no_entry",
        "def_las_bonus",
        "def_las_plain",
        "def_pct",
        "def_pct_null",
    ] {
        assert!(counts.get(k).copied().unwrap_or(0) > 0, "brak galezi {k}");
    }
}

#[test]
fn terrain_river_attack_multiplier_wektory() {
    let v = load();
    let cases = v["river"].as_array().expect("river");
    assert!(cases.len() >= 500, "river: {}", cases.len());
    let mut counts: BTreeMap<String, u32> = BTreeMap::new();
    for c in cases {
        let data = rows(&c["data"]);
        let got = terrain_river_attack_multiplier(
            c["terr"].as_str().expect("terr"),
            &entries(&data),
            num(&c["riverMult"]),
        );
        assert!(same(num(&c["out"]), got), "river {c}: got {got}");
        *counts
            .entry(c["br"].as_str().expect("br").to_string())
            .or_default() += 1;
    }
    for k in ["river_early", "river_not", "river_hit", "river_no_row"] {
        assert!(counts.get(k).copied().unwrap_or(0) > 0, "brak galezi {k}");
    }
}

#[test]
fn city_gated_terrain_multiplier_wektory() {
    let v = load();
    let cases = v["city"].as_array().expect("city");
    assert!(cases.len() >= 500, "city: {}", cases.len());
    let mut counts: BTreeMap<String, u32> = BTreeMap::new();
    for c in cases {
        let data = rows(&c["data"]);
        let got = city_gated_terrain_multiplier(
            c["hasMur"].as_bool().expect("hasMur"),
            c["terr"].as_str().expect("terr"),
            &entries(&data),
        );
        assert!(same(num(&c["out"]), got), "city {c}: got {got}");
        *counts
            .entry(c["br"].as_str().expect("br").to_string())
            .or_default() += 1;
    }
    for k in ["city_no_wall", "city_elev", "city_flat"] {
        assert!(counts.get(k).copied().unwrap_or(0) > 0, "brak galezi {k}");
    }
}

#[test]
fn liczniki_pokrycia_zgodne_z_generatorem() {
    let v = load();
    let counts = v["counts"].as_object().expect("counts");
    assert_eq!(counts.len(), 13);
    assert!(counts.values().all(|n| n.as_u64().unwrap_or(0) > 0));
}

// Straznik generatora (zarzut Evaluatora): SHA-256 pliku generatora jest przypiety.
// Dryf generatora (zmiana bez regeneracji vectors.json i bez aktualizacji stalej) -> blad testu.
const GEN_SRC: &[u8] = include_bytes!("p6_siege_tactics_inputs_terrain_gen.mjs");
const GEN_SHA256: &str = "ae2f13a11d153265d82f635640447e0d7aa148f63659685e3df6b9eb435714e4";

/// SHA-256 (FIPS 180-4) w czystym Rust, bez zaleznosci: hex malymi literami.
fn sha256_hex(data: &[u8]) -> String {
    const K: [u32; 64] = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4,
        0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe,
        0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f,
        0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
        0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
        0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116,
        0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
        0xc67178f2,
    ];
    let mut h: [u32; 8] = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab,
        0x5be0cd19,
    ];
    let bit_len = (data.len() as u64).wrapping_mul(8);
    let mut msg = data.to_vec();
    msg.push(0x80);
    while msg.len() % 64 != 56 {
        msg.push(0);
    }
    msg.extend_from_slice(&bit_len.to_be_bytes());
    for chunk in msg.chunks_exact(64) {
        let mut w = [0u32; 64];
        for (i, word) in w.iter_mut().enumerate().take(16) {
            *word = u32::from_be_bytes([
                chunk[4 * i],
                chunk[4 * i + 1],
                chunk[4 * i + 2],
                chunk[4 * i + 3],
            ]);
        }
        for i in 16..64 {
            let s0 = w[i - 15].rotate_right(7) ^ w[i - 15].rotate_right(18) ^ (w[i - 15] >> 3);
            let s1 = w[i - 2].rotate_right(17) ^ w[i - 2].rotate_right(19) ^ (w[i - 2] >> 10);
            w[i] = w[i - 16]
                .wrapping_add(s0)
                .wrapping_add(w[i - 7])
                .wrapping_add(s1);
        }
        let [mut a, mut b, mut c, mut d, mut e, mut f, mut g, mut hh] = h;
        for i in 0..64 {
            let s1 = e.rotate_right(6) ^ e.rotate_right(11) ^ e.rotate_right(25);
            let ch = (e & f) ^ (!e & g);
            let t1 = hh
                .wrapping_add(s1)
                .wrapping_add(ch)
                .wrapping_add(K[i])
                .wrapping_add(w[i]);
            let s0 = a.rotate_right(2) ^ a.rotate_right(13) ^ a.rotate_right(22);
            let maj = (a & b) ^ (a & c) ^ (b & c);
            let t2 = s0.wrapping_add(maj);
            hh = g;
            g = f;
            f = e;
            e = d.wrapping_add(t1);
            d = c;
            c = b;
            b = a;
            a = t1.wrapping_add(t2);
        }
        for (x, y) in h.iter_mut().zip([a, b, c, d, e, f, g, hh]) {
            *x = x.wrapping_add(y);
        }
    }
    h.iter().map(|x| format!("{x:08x}")).collect()
}

#[test]
fn sha256_wektor_wzorcowy() {
    // FIPS 180-4: SHA-256("abc") oraz SHA-256 pustego wejscia.
    assert_eq!(
        sha256_hex(b"abc"),
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
    assert_eq!(
        sha256_hex(b""),
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
}

#[test]
fn generator_straznik_sha256() {
    assert_eq!(
        sha256_hex(GEN_SRC),
        GEN_SHA256,
        "generator p6_siege_tactics_inputs_terrain_gen.mjs zmieniony: zregeneruj vectors.json i zaktualizuj GEN_SHA256"
    );
}
