//! P6.1 r2 — `makeRng` z webu (`gra/src/game/civ-roster.ts:10`, mulberry32) wektorami z URUCHOMIONEGO
//! weba (`tests/p6_1_vectors/web-vectors.json`, sekcja `rng`). Ten generator NIE jest LCG z `Rng`.

use civ_engine::domain::rng::Mulberry32;
use serde_json::Value;

const WEB_VECTORS: &str = include_str!("p6_1_vectors/web-vectors.json");

fn web() -> Value {
    serde_json::from_str(WEB_VECTORS).expect("web vectors parse")
}

#[test]
fn mulberry32_matches_web_make_rng_vectors_bit_for_bit() {
    let web = web();
    let rows = web["rng"].as_array().expect("rng");
    assert_eq!(rows.len(), 7);
    for row in rows {
        let seed = row["seed"].as_u64().expect("seed");
        let seed = u32::try_from(seed).expect("seed fits u32");
        let mut stream = Mulberry32::new(seed);
        // Oczekiwane wartości czytamy z tekstu (String(x) w JS), bo serde_json bez `float_roundtrip`
        // nie zachowuje pełnej dokładności double (różnica 1 ulp obserwowana w r2).
        let texts = row["valuesText"].as_array().expect("valuesText");
        assert_eq!(texts.len(), 8);
        for (index, text) in texts.iter().enumerate() {
            let expected: f64 = text.as_str().expect("text").parse().expect("f64 text");
            assert_eq!(stream.next_f64(), expected, "makeRng({seed}) krok {index}");
        }
    }
}

#[test]
fn mulberry32_is_not_the_lcg_stream() {
    // Rozróżnienie: web makeRng != lcgNext. Pierwszy krok LCG dla seed=0 to 1013904223/2^32 ≠ 0.2664...
    let mut stream = Mulberry32::new(0);
    let first = stream.next_f64();
    let lcg_first = f64::from(1_013_904_223_u32) / 4_294_967_296.0;
    assert!((first - lcg_first).abs() > 1e-6);
}
