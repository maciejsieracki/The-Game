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
