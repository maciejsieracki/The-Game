//! REPIN-EKONOMIA-D1, wektory brzegowe (odpowiedz na zarzut R2: w `web-vectors.json` brak -0, 1e300, 2^53).
//!
//! Wektory: `tests/p6_repin_d_work_tax_vectors/web-vectors-edge.json`, generowane URUCHOMIENIEM
//! `gra/src/game/work-tax.ts` z pinu `91dc998a` (node 22.22, `--experimental-strip-types`);
//! generator: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-D-Q1/logs/gen-vectors-edge.mts`.
//!
//! Liczby zapisane jako `{"f": String(x)}` (`-0` jako `"-0"`). Porownanie BIT-W-BIT (`to_bits`),
//! wiec znak zera jest sprawdzany; NaN porownywany jako NaN.

use civ_engine::domain::work_tax::{
    convert_work_pool_to_tax, serialize_pending_work_tax, tax_for_work_amount,
};
use serde_json::Value;

const EDGE_VECTORS: &str = include_str!("p6_repin_d_work_tax_vectors/web-vectors-edge.json");

fn edge() -> Value {
    serde_json::from_str(EDGE_VECTORS).expect("edge vectors parse")
}

/// Dekodowanie liczby brzegowej: `{"f": "<String(x)>"}` -> f64 (Rust parsuje tekst JS bez straty).
fn ef(v: &Value) -> f64 {
    let s = v["f"].as_str().expect("tagged number");
    s.parse::<f64>()
        .unwrap_or_else(|_| panic!("unparsable edge number {s}"))
}

fn same(got: f64, exp: f64) -> bool {
    (got.is_nan() && exp.is_nan()) || got.to_bits() == exp.to_bits()
}

#[test]
fn edge_tax_for_work_amount_bitexact() {
    let w = edge();
    let cases = w["tax"].as_array().unwrap();
    assert_eq!(cases.len(), 484);
    for c in cases {
        let got = tax_for_work_amount(ef(&c["w"]), ef(&c["r"]));
        let exp = ef(&c["out"]);
        assert!(
            same(got, exp),
            "w={} r={} got={got:?} exp={exp:?}",
            c["w"],
            c["r"]
        );
    }
}

#[test]
fn edge_convert_work_pool_to_tax_bitexact() {
    let w = edge();
    let cases = w["convert"].as_array().unwrap();
    assert_eq!(cases.len(), 1024);
    for c in cases {
        let got = convert_work_pool_to_tax(
            ef(&c["pool"]),
            ef(&c["req"]),
            ef(&c["rate"]),
            c["enabled"].as_bool().unwrap(),
        );
        let exp = &c["out"];
        assert!(same(got.work_remaining, ef(&exp["workRemaining"])), "{c}");
        assert!(same(got.work_spent, ef(&exp["workSpent"])), "{c}");
        assert!(same(got.tax_gained, ef(&exp["taxGained"])), "{c}");
    }
}

#[test]
fn edge_serialize_pending_work_tax_bitexact() {
    let w = edge();
    let cases = w["serialize"].as_array().unwrap();
    assert_eq!(cases.len(), 22);
    for c in cases {
        let pending: Vec<(f64, f64)> = c["pending"]
            .as_array()
            .unwrap()
            .iter()
            .map(|p| (ef(&p[0]), ef(&p[1])))
            .collect();
        let exp: Vec<(f64, f64)> = c["out"]
            .as_array()
            .unwrap()
            .iter()
            .map(|p| (ef(&p[0]), ef(&p[1])))
            .collect();
        let got = serialize_pending_work_tax(&pending);
        assert_eq!(got.len(), exp.len(), "{c}");
        for (g, e) in got.iter().zip(exp.iter()) {
            assert!(same(g.0, e.0) && same(g.1, e.1), "{c}");
        }
    }
}
