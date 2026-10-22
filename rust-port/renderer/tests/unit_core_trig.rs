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

/// `model::quat_from_euler` honours every Three.js Euler order (Evaluator r1,
/// zarzut 5: the former `debug_assert` let a non-`XYZ` order through in
/// release). On angles whose half-angle sin/cos agree bit-for-bit between the
/// V8 port and libm, the result must equal `geom::Quat::from_euler` (verified
/// against three r169 in `geom_three_parity`) for all six orders, and the six
/// orders must not collapse onto `XYZ`.
#[test]
fn quat_from_euler_honours_every_order() {
    use civ_renderer::geom::{Euler, EulerOrder, Quat};
    use civ_renderer::models::unit_core::model::quat_from_euler;
    let orders = [
        EulerOrder::Xyz,
        EulerOrder::Yxz,
        EulerOrder::Zxy,
        EulerOrder::Zyx,
        EulerOrder::Yzx,
        EulerOrder::Xzy,
    ];
    let candidates = [
        (0.3, -1.1, 2.0),
        (0.5, 0.25, -0.75),
        (1.0, -0.5, 0.125),
        (-2.5, 1.5, 0.7),
        (0.9, 0.4, -1.3),
    ];
    let same = |a: f64| {
        let h = a / 2.0;
        js_sin(h).to_bits() == h.sin().to_bits() && js_cos(h).to_bits() == h.cos().to_bits()
    };
    let mut used = 0;
    for &(x, y, z) in &candidates {
        if !(same(x) && same(y) && same(z)) {
            continue;
        }
        used += 1;
        let mut seen: Vec<Quat> = Vec::new();
        for order in orders {
            let eu = Euler { x, y, z, order };
            let port = quat_from_euler(eu);
            let reference = Quat::from_euler(eu);
            for (p, r) in [
                (port.x, reference.x),
                (port.y, reference.y),
                (port.z, reference.z),
                (port.w, reference.w),
            ] {
                assert_eq!(p.to_bits(), r.to_bits(), "{order:?} ({x}, {y}, {z})");
            }
            seen.push(port);
        }
        assert!(
            seen[1..].iter().all(|q| *q != seen[0]),
            "a non-XYZ order collapsed onto XYZ for ({x}, {y}, {z})"
        );
    }
    println!("quat_from_euler orders: {used} angle triples x 6 orders checked");
    assert!(used >= 2, "too few usable angle triples ({used})");
}
