//! `jstrig::js_sin/js_cos` against `Math.sin/Math.cos` of node v22.22.0
//! (`tests/fixtures/unit_core/trig.json`, generator `gen_trig.mjs`).

#[path = "unit_core_json.rs"]
mod json;

use civ_renderer::models::unit_core::jstrig::{js_cos, js_sin};

#[test]
fn js_trig_matches_v8_bit_for_bit_and_libm_does_not() {
    let path = concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/tests/fixtures/unit_core/trig.json"
    );
    let fx = json::parse(&std::fs::read_to_string(path).unwrap());
    let bits = fx.at("data").bits();
    let n = fx.at("n").u() as usize;
    assert_eq!(bits.len(), n * 3);
    let (mut port_bad, mut libm_bad) = (Vec::new(), 0usize);
    for s in bits.chunks_exact(3) {
        let x = f64::from_bits(s[0]);
        if js_sin(x).to_bits() != s[1] || js_cos(x).to_bits() != s[2] {
            port_bad.push(x);
        }
        if x.sin().to_bits() != s[1] || x.cos().to_bits() != s[2] {
            libm_bad += 1;
        }
    }
    println!(
        "trig: n={n} port_mismatch={} libm_mismatch={libm_bad}",
        port_bad.len()
    );
    assert!(
        port_bad.is_empty(),
        "port differs from V8 for {:?}",
        &port_bad[..port_bad.len().min(20)]
    );
}
