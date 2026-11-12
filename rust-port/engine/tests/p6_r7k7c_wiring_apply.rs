//! P6-WIRE-WAR-R7K7-C: wektory pinu dla `apply_dipl_deltas_to_state` (skarbce i pule Pracy).
//!
//! Zrodlo: `p6_r7k7c_wiring_vectors/apply-vectors.json`, generowane przez `gen-apply-vectors.mjs`, ktory
//! WYKONUJE TEKST pina (gra/src/main.ts @ 07d2fbd72): ownerTreasury, add (buildDiploTreasury),
//! ownerPracaPool i setOwnerPracaPool. Floaty jako hex bitow IEEE-754 (porownanie bit-w-bit).
//! Strazniki SHA: pin_file_sha256 i snippet_sha256 w JSON (sprawdzane przy generacji).
//!
//! ZAKRES (granica swiadoma): tylko `apply` (treasury + praca). Wektory D3 `tickCyclicResourceTradeDeals`
//! NIE sa tu: wycinek pina (closure z activeDeals/ownerResourceStock) wymaga przeróbki harnessu -> NIE_ZMIERZONO.

use std::collections::BTreeMap;

use civ_engine::domain::playable::{PlayableGame, PlayableState, StartGameParams};
use civ_engine::domain::turn_war_dipl_steps::apply_dipl_deltas_to_state;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_r7k7c_wiring_vectors/apply-vectors.json");
const AI_OWNER: i64 = 2;

fn bits_to_f64(hex: &str) -> f64 {
    f64::from_bits(u64::from_str_radix(hex, 16).expect("hex bitow"))
}

fn base_state() -> (PlayableState, i64) {
    let game = PlayableGame::new(StartGameParams {
        seed: 7,
        ..StartGameParams::default()
    })
    .expect("scenariusz startowy");
    let st = game.state().clone();
    let human = st
        .players
        .iter()
        .find(|p| p.is_human)
        .map(|p| p.id.get() as i64)
        .expect("gracz ludzki");
    assert_ne!(human, AI_OWNER, "wektory zakladaja odrebne id gracza i AI");
    (st, human)
}

#[test]
fn apply_matches_pin_vectors_bit_for_bit() {
    let doc: Value = serde_json::from_str(VECTORS).expect("json wektorow");
    assert_eq!(doc["pin"], "07d2fbd72f758705f8e1d59cc4968027ffbafe75");
    let vectors = doc["vectors"].as_array().expect("vectors");
    assert!(
        vectors.len() >= 150,
        "wektory apply: {} < 150",
        vectors.len()
    );

    let (base, human) = base_state();
    let (mut n_treasury, mut n_praca) = (0usize, 0usize);
    for v in vectors {
        let kind = v["kind"].as_str().unwrap();
        let is_human = v["owner"] == "human";
        let owner = if is_human { human } else { AI_OWNER };
        let start = bits_to_f64(v["start_bits"].as_str().unwrap());
        let delta = bits_to_f64(v["delta_bits"].as_str().unwrap());
        let has_entry = v["has_entry"].as_bool().unwrap();
        let expect = v["expect"].as_str().unwrap();

        let mut st = base.clone();
        let mut treasury = BTreeMap::new();
        let mut praca = BTreeMap::new();
        match (kind, is_human) {
            ("treasury", true) => {
                st.economy.treasury = start;
                treasury.insert(owner, delta);
                n_treasury += 1;
            }
            ("treasury", false) => {
                if has_entry {
                    st.economy.ai_treasury_by_owner.insert(owner as u64, start);
                }
                treasury.insert(owner, delta);
                n_treasury += 1;
            }
            ("praca", false) => {
                if has_entry {
                    st.economy.praca_pool_by_owner.insert(owner as u64, start);
                }
                praca.insert(owner, delta);
                n_praca += 1;
            }
            other => panic!("nieobslugiwany wektor {other:?}"),
        }

        let res = apply_dipl_deltas_to_state(&mut st, &treasury, &praca);
        if expect == "error" {
            assert!(res.is_err(), "wektor {v}: oczekiwany blad");
            continue;
        }
        res.unwrap_or_else(|e| panic!("wektor {v}: {e}"));
        let want = bits_to_f64(expect);
        let got = match (kind, is_human) {
            ("treasury", true) => st.economy.treasury,
            ("treasury", false) => st.economy.ai_treasury_by_owner[&(owner as u64)],
            _ => st.economy.praca_pool_by_owner[&(owner as u64)],
        };
        assert_eq!(
            got.to_bits(),
            want.to_bits(),
            "wektor {v}: got {got:?} want {want:?} (start {start:?}, delta {delta:?})"
        );
    }
    assert!(
        n_treasury >= 100 && n_praca >= 40,
        "pokrycie: skarbce {n_treasury}, praca {n_praca}"
    );
}
