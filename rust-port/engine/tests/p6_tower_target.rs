//! P6 TOWER-TARGET (R-RUSTPORT-P6-TOWER-TARGET-Q1): zgodnosc `pick_tower_target` z `pickTowerTarget`
//! (pin `07d2fbd72`, `gra/src/game/city-towers.ts`).
//!
//! Wektory: `p6_tower_target_vectors/vectors.json`, generowane przez `p6_tower_target_gen.mjs`, ktory WYKONUJE
//! doslowny tekst pinu w harnessie Node (straznik SHA-256 fragmentow). Test wymaga:
//! * identycznego indeksu wyboru (`-1` = brak celu) dla kazdego przypadku (porownanie bit-w-bit wyniku),
//! * identycznego rozkladu kategorii pokrycia jak `meta.categories` (przeliczonego z wejsc, nie z kodu Rust),
//! * co najmniej 150 przypadkow, w tym remisy odleglosci i remisy HP.

use civ_engine::domain::siege_tactics_tower::{pick_tower_target, TowerTarget};
use std::collections::BTreeMap;

const VECTORS: &str = include_str!("p6_tower_target_vectors/vectors.json");

/// Liczba JS: `"NaN"` w wektorach koduje `NaN` (JSON nie ma NaN).
fn num_or_nan(v: &serde_json::Value) -> f64 {
    match v {
        serde_json::Value::String(s) if s == "NaN" => f64::NAN,
        other => other.as_f64().expect("liczba lub \"NaN\""),
    }
}

fn enemy(v: &serde_json::Value) -> TowerTarget {
    TowerTarget {
        q: v["q"].as_i64().expect("q"),
        r: v["r"].as_i64().expect("r"),
        hp: num_or_nan(&v["hp"]),
        dead: v.get("dead").and_then(|d| d.as_bool()).unwrap_or(false),
    }
}

/// Kategorie pokrycia przeliczone z WEJSC i wyniku Rust (ta sama definicja co w generatorze).
fn categories(
    tq: i64,
    tr: i64,
    range: f64,
    enemies: &[TowerTarget],
    got: Option<usize>,
) -> Vec<&'static str> {
    let dist = |e: &TowerTarget| ((tq - e.q).abs() + (tr - e.r).abs()) as f64;
    let mut out = vec![if got.is_none() { "none" } else { "pick" }];
    if enemies
        .iter()
        .any(|e| e.dead && dist(e) >= 1.0 && dist(e) <= range)
    {
        out.push("dead:skipped");
    }
    if enemies.iter().any(|e| dist(e) == 0.0) {
        out.push("self:skipped");
    }
    if range.is_nan() {
        out.push("range:nan");
    }
    if enemies.iter().any(|e| e.hp.is_nan()) {
        out.push("hp:nan");
    }
    let cand: Vec<&TowerTarget> = enemies
        .iter()
        .filter(|e| !e.dead && dist(e) >= 1.0 && dist(e) <= range)
        .collect();
    if cand.iter().any(|e| dist(e) == range) {
        out.push("range:edge");
    }
    if !cand.is_empty() {
        let min_d = cand.iter().map(|e| dist(e)).fold(f64::INFINITY, f64::min);
        let tied: Vec<&&TowerTarget> = cand.iter().filter(|e| dist(e) == min_d).collect();
        if tied.len() > 1 {
            out.push("tie:dist");
            let min_hp = tied.iter().map(|e| e.hp).fold(f64::INFINITY, f64::min);
            let hp_tied = tied.iter().filter(|e| e.hp == min_hp).count();
            if hp_tied > 1 {
                out.push("tie:full");
            } else {
                out.push("tie:hp");
            }
        }
    }
    out
}

#[test]
fn pick_tower_target_zgodny_z_pinem_na_wektorach() {
    let doc: serde_json::Value = serde_json::from_str(VECTORS).expect("vectors.json");
    let cases = doc["cases"].as_array().expect("cases");
    assert!(cases.len() >= 150, "za malo przypadkow: {}", cases.len());

    let mut tally: BTreeMap<String, usize> = BTreeMap::new();
    let mut mismatches: Vec<String> = Vec::new();
    for c in cases {
        let tq = c["tower"]["q"].as_i64().expect("tower.q");
        let tr = c["tower"]["r"].as_i64().expect("tower.r");
        let range = num_or_nan(&c["range"]);
        let enemies: Vec<TowerTarget> = c["enemies"]
            .as_array()
            .expect("enemies")
            .iter()
            .map(enemy)
            .collect();
        let got = pick_tower_target(tq, tr, range, &enemies);
        let got_i64 = got.map_or(-1, |i| i as i64);
        let want = c["expect"].as_i64().expect("expect");
        if got_i64 != want {
            mismatches.push(format!("{}: rust={} pin={}", c["id"], got_i64, want));
        }
        for k in categories(tq, tr, range, &enemies, got) {
            *tally.entry(k.to_string()).or_insert(0) += 1;
        }
    }
    assert!(
        mismatches.is_empty(),
        "rozbieznosci wyboru celu: {:?}",
        mismatches
    );

    let meta = doc["meta"]["categories"]
        .as_object()
        .expect("meta.categories");
    for (k, v) in meta {
        let want = v.as_u64().expect("licznik") as usize;
        let got = tally.get(k).copied().unwrap_or(0);
        assert_eq!(got, want, "kategoria {k}: rust={got} pin={want}");
    }
    assert_eq!(
        tally.len(),
        meta.len(),
        "zbior kategorii rozni sie od pinu: {tally:?}"
    );
    assert!(
        tally.get("tie:dist").copied().unwrap_or(0) >= 20,
        "za malo remisow odleglosci"
    );
    assert!(
        tally.get("tie:full").copied().unwrap_or(0) >= 5,
        "za malo pelnych remisow (dist+hp)"
    );
}

#[test]
fn pick_tower_target_reguly_jawnie() {
    let t = |q, r, hp, dead| TowerTarget { q, r, hp, dead };
    // Najblizszy wygrywa niezaleznie od HP.
    let e = [t(3, 0, 1.0, false), t(1, 0, 9.0, false)];
    assert_eq!(pick_tower_target(0, 0, 5.0, &e), Some(1));
    // Remis odleglosci -> mniej HP.
    let e = [t(1, 0, 5.0, false), t(0, 1, 2.0, false)];
    assert_eq!(pick_tower_target(0, 0, 5.0, &e), Some(1));
    // Pelny remis (odleglosc i HP) -> pierwszy w liscie.
    let e = [t(1, 0, 2.0, false), t(0, 1, 2.0, false)];
    assert_eq!(pick_tower_target(0, 0, 5.0, &e), Some(0));
    // Martwy pominiety; wlasny kafel (d=0) pominiety; zasieg wlacznie (d==range).
    let e = [t(1, 0, 1.0, true), t(0, 0, 1.0, false), t(2, 0, 1.0, false)];
    assert_eq!(pick_tower_target(0, 0, 2.0, &e), Some(2));
    assert_eq!(pick_tower_target(0, 0, 1.0, &e), None);
    // Zasieg NaN: JS `d > NaN` = fałsz, wiec nic nie jest odrzucone zasiegiem.
    let e = [t(9, 9, 1.0, false)];
    assert_eq!(pick_tower_target(0, 0, f64::NAN, &e), Some(0));
    // Pusta lista -> brak celu (-1 w pinie).
    assert_eq!(pick_tower_target(0, 0, 5.0, &[]), None);
}
