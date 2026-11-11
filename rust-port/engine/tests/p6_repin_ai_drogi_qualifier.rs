//! R-RUSTPORT-REPIN-AI-ZAKUP-REALNY-STAN-DROGI-Q1 (runda 3, B): drogi gracza = drogi AI.
//! Wektory z URUCHOMIONEGO weba (origin/main 0c5b227a9, FALA 596 R-WEB-ROAD-BUILD-PLAYER-PARITY-WITH-AI-Q1):
//! `buildImprovementQualifier('droga' | 'droga_brukowana')`, `createImprovementBuildApi().getQualifyingHexes`
//! i `roadBuildBlockReason` na 107 losowych stanach mapy (dla wszystkich zapytan, w tym poza mapa).
//! Generator: tests/p6_repin_ai_drogi_vectors/gen-drogi-vectors.mjs (Node 22).
//!
//! Gracz (`can_build`/`get_qualifying_hexes`) i AI (`sh.qualifies` w `single_pass.rs`) wolaja TEN SAM
//! `Qualifier::qualifies` - test sprawdza, ze jego wynik (oraz powod odmowy) = web po zmianie FALA 596:
//! droga blokowana WYLACZNIE gdy heks juz ma droge (farma + droga = dozwolona warstwa).

#[path = "p6_m16_vectors/common.rs"]
mod common;

use civ_engine::domain::improvement_build::*;
use common::*;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_repin_ai_drogi_vectors/droga-vectors.json");

fn data() -> Value {
    serde_json::from_str(VECTORS).expect("droga-vectors.json parses")
}

#[test]
fn road_qualification_matches_web_player_equals_ai() {
    let d = data();
    let mut n_true = 0usize;
    let mut n_total = 0usize;
    for (ci, case) in arr(&d, "cases").iter().enumerate() {
        let st = state(&case["state"]);
        let qualify = build_improvement_qualifier(&st);
        let api = create_improvement_build_api(&st, None);
        let queries: Vec<(i32, i32)> = arr(case, "queries")
            .iter()
            .map(|p| (int(&p[0]), int(&p[1])))
            .collect();
        for (key, bits) in [
            ("droga", s(&case["droga"])),
            ("droga_brukowana", s(&case["bruk"])),
        ] {
            assert_eq!(bits.len(), queries.len());
            for (i, &(q, r)) in queries.iter().enumerate() {
                let want = &bits[i..=i] == "1";
                assert_eq!(
                    qualify.qualifies(key, q, r),
                    want,
                    "stan {ci} klucz {key} heks ({q},{r})"
                );
                // gracz (can_build) = AI (qualifies): jedna definicja
                assert_eq!(
                    api.can_build(key, q, r),
                    want,
                    "stan {ci} can_build {key} ({q},{r})"
                );
                n_total += 1;
                n_true += usize::from(want);
            }
            let want_hexes: Vec<(i32, i32)> = arr(&case["qualifying"], key)
                .iter()
                .map(|p| (int(&p[0]), int(&p[1])))
                .collect();
            assert_eq!(
                api.get_qualifying_hexes(key),
                want_hexes,
                "stan {ci} getQualifyingHexes {key}"
            );
        }
    }
    assert!(n_total > 15_000, "za malo zapytan: {n_total}");
    assert!(n_true > 500, "za malo prawdziwych: {n_true}");
}

#[test]
fn road_build_block_reason_matches_web() {
    let d = data();
    let mut by_reason: std::collections::BTreeMap<String, usize> = Default::default();
    for (ci, case) in arr(&d, "cases").iter().enumerate() {
        let st = state(&case["state"]);
        let qualify = build_improvement_qualifier(&st);
        let reasons = arr(case, "reasons");
        let queries = arr(case, "queries");
        assert_eq!(reasons.len(), queries.len());
        for (p, want) in queries.iter().zip(reasons) {
            let (q, r) = (int(&p[0]), int(&p[1]));
            let got = qualify.road_build_block_reason(q, r);
            assert_eq!(
                got,
                want.as_str(),
                "stan {ci} heks ({q},{r}): rust={got:?} web={want}"
            );
            *by_reason
                .entry(got.unwrap_or("<dozwolona>").to_string())
                .or_default() += 1;
        }
    }
    // test istotnosci: wszystkie 5 wynikow (4 powody + dozwolona) wystepuja w wektorach
    assert!(by_reason.len() >= 5, "za malo wariantow: {by_reason:?}");
}
