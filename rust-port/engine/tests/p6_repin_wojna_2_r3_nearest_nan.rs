//! REPIN-WOJNA-2 R3 - domkniecie r2: `nearest_living_general` przy NaN wspolrzednej KANDYDATA
//! (web `generals.ts:76-82`: `.sort(cmp)[0]`, `cmp = dist(a)-dist(b) || a.id.localeCompare(b.id)`).
//! Wektory: `tests/p6_repin_wojna_2_r3_vectors/nearest-nan.json` z URUCHOMIONEGO weba dc8a3adc
//! (probe: `/tmp/.../scratchpad/nan-probe.mjs`, 400 przypadkow, 328 z NaN u kandydata).

use civ_engine::domain::generals::{nearest_living_general, GeneralUnit};
use serde_json::Value;

const NEAREST_NAN: &str = include_str!("p6_repin_wojna_2_r3_vectors/nearest-nan.json");

fn num(v: &Value) -> f64 {
    v.as_str()
        .expect("liczba jako tekst")
        .parse::<f64>()
        .expect("poprawna liczba")
}

fn unit(v: &Value) -> GeneralUnit {
    let flag = |key: &str| v[key].as_bool().unwrap_or(false);
    GeneralUnit {
        id: v["id"].as_str().expect("id").to_string(),
        owner_id: num(&v["ownerId"]),
        q: num(&v["q"]),
        r: num(&v["r"]),
        is_general: flag("isGeneral"),
        hp: v.get("hp").map(num),
        dead: flag("dead"),
        removed: flag("removed"),
        routed: flag("routed"),
        in_garnizon: flag("inGarnizon"),
        oblega_city_id: None,
        follow_general: flag("followGeneral"),
    }
}

#[test]
fn nearest_living_general_with_nan_candidate_matches_web() {
    let cases: Vec<Value> = serde_json::from_str(NEAREST_NAN).expect("wektory parse");
    assert_eq!(cases.len(), 400);
    let mut with_nan = 0;
    for (i, case) in cases.iter().enumerate() {
        let me = unit(&case["unit"]);
        let roster: Vec<GeneralUnit> = case["roster"]
            .as_array()
            .expect("roster")
            .iter()
            .map(unit)
            .collect();
        if case["roster"]
            .as_array()
            .expect("roster")
            .iter()
            .any(|g| g["q"] == "NaN" || g["r"] == "NaN")
        {
            with_nan += 1;
        }
        let got = nearest_living_general(&me, &roster).map(|g| g.id.clone());
        assert_eq!(
            got.as_deref(),
            case["out"].as_str(),
            "przypadek {i}: {case}"
        );
    }
    assert!(with_nan > 250, "za malo przypadkow z NaN: {with_nan}");
}
