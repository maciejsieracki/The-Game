//! P6-CRED-WOJNA-Q1 (runda 2): wektory z pinu 07d2fbd72 dla haka P4 (`chargeWarDeclarationCredibility`,
//! `main.ts:12176-12225`), kolejnosci D4 wzgledem haka D8 oraz S3 dla `umowa_handlowa` przez 3 tury.
//!
//! Generator: `p6_cred_wojna_gen.mjs` (wykonuje tekst pinu, straznik SHA-256 plikow i wycietych fragmentow).
//! Wektory: `p6_cred_wojna_vectors/vectors.json`.
//!
//! Zakres porownania: skutek P4 = licznik "bez wojny" OBU stron (`wiarygodnoscOstatniaWojnaTuraByOwner`)
//! oraz kamienie milowe `wieloletni_pokoj`. Galezie N1/N2 haka (kary, odwet, rozejm, kasowanie oferty) pinu
//! wykonuje generator, ale `CredibilityRegistry::note_war_entered` ich NIE modeluje; te skutki nie sa tu porownywane.
//! S3 idzie wprost przez `StreamDealKind::LegacyTradeAgreement` (bez aliasu `umowa_handlowa`).

use std::collections::{BTreeMap, HashMap};

use civ_engine::domain::credibility::{
    stream_active_tuples, CredibilityEvent, CredibilityParams, CredibilityRegistry, StreamDeal,
    StreamDealKind,
};
use civ_engine::domain::turn_war_dipl_steps::note_war_declarations;
use civ_engine::domain::types::Difficulty;
use civ_engine::domain::war_turn_state::WarTurnState;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_cred_wojna_vectors/vectors.json");
const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
const OWNERS: [i64; 4] = [0, 1, 2, 3];

/// Stan po kroku: (lastWar per wlasciciel, kamienie P4, liczba `wieloletni_pokoj`).
type Snap = (Vec<Option<f64>>, Vec<i64>, Vec<usize>);

/// Niecalkowite liczby wektorow sa tekstem `f64:<hex bitow>` (serde_json bez `float_roundtrip` myli sie o 1 ulp).
fn decode_floats(v: Value) -> Value {
    match v {
        Value::String(s) => match s.strip_prefix("f64:") {
            Some(hex) => {
                let bits = u64::from_str_radix(hex, 16).expect("bity f64");
                Value::from(f64::from_bits(bits))
            }
            None => Value::String(s),
        },
        Value::Array(a) => Value::Array(a.into_iter().map(decode_floats).collect()),
        Value::Object(o) => {
            Value::Object(o.into_iter().map(|(k, x)| (k, decode_floats(x))).collect())
        }
        other => other,
    }
}

fn vectors() -> Value {
    decode_floats(serde_json::from_str(VECTORS).expect("vectors.json"))
}

fn diff(v: &Value) -> Difficulty {
    serde_json::from_value(v.clone()).expect("difficulty")
}

/// `[[owner, wartosc|null], ...]` -> mapa; brak wpisu w pinie = `None` (null).
fn pairs_opt(v: &Value) -> BTreeMap<i64, Option<f64>> {
    v.as_array()
        .expect("tablica par")
        .iter()
        .map(|p| (p[0].as_i64().expect("owner"), p[1].as_f64()))
        .collect()
}

fn lookup_last_war(reg: &CredibilityRegistry, owner: i64) -> Option<f64> {
    reg.last_war_turn
        .iter()
        .find(|(k, _)| *k == owner)
        .map(|(_, v)| *v)
}

fn lookup_p4(reg: &CredibilityRegistry, owner: i64) -> i64 {
    reg.p4_milestones
        .iter()
        .find(|(k, _)| *k == owner)
        .map(|(_, v)| *v as i64)
        .unwrap_or(0)
}

fn wielo_count(reg: &CredibilityRegistry, owner: i64) -> usize {
    reg.events_of(owner)
        .iter()
        .filter(|e| e.typ == CredibilityEvent::WieloletniPokoj)
        .count()
}

#[test]
fn vectors_carry_pin_and_guard_hashes() {
    let v = vectors();
    assert_eq!(v["pin"], PIN);
    assert_eq!(
        v["sha256"]["gra/src/main.ts"],
        "e80f9cb41d513b92846972a19f2760e08eb4247d6a9b344526d8bc71bd7d5f19"
    );
    assert_eq!(
        v["fragSha256"]["chargeWarDeclarationCredibility"],
        "5a29e9f689bf01f53d729c4f6eb3766f38f64b8a18ea4b204df6729dd4623595"
    );
}

#[test]
fn hook_p4_counter_matches_pin_for_all_cases() {
    let v = vectors();
    let hook = v["hook"].as_array().expect("hook");
    assert!(hook.len() >= 150, "wektorow haka P4: {} < 150", hook.len());

    let mut recorded = 0usize;
    let mut barbarian = 0usize;
    for c in hook {
        let mut war = WarTurnState::default();
        let prior: Vec<(i64, f64)> = c["lastWarPrior"]
            .as_array()
            .expect("prior")
            .iter()
            .map(|p| (p[0].as_i64().expect("owner"), p[1].as_f64().expect("tura")))
            .collect();
        war.opaque = CredibilityRegistry {
            last_war_turn: prior,
            ..Default::default()
        }
        .to_meta();

        let a = c["pair"][0].as_i64().expect("a");
        let b = c["pair"][1].as_i64().expect("b");
        let turn = c["turn"].as_f64().expect("tura");
        note_war_declarations(&mut war, &[(a, b)], turn).expect("hak P4");

        let after = CredibilityRegistry::from_meta(&war.opaque)
            .expect("rejestr czytelny")
            .last_war_turn;
        let reg = CredibilityRegistry {
            last_war_turn: after,
            ..Default::default()
        };
        let got: BTreeMap<i64, Option<f64>> = OWNERS
            .iter()
            .map(|&o| (o, lookup_last_war(&reg, o)))
            .collect();
        assert_eq!(got, pairs_opt(&c["lastWarAfter"]), "wektor {}", c["id"]);

        if c["barbarian"].as_bool() == Some(true) {
            barbarian += 1;
        } else if got.get(&a).copied().flatten() == Some(turn)
            && got.get(&b).copied().flatten() == Some(turn)
        {
            recorded += 1;
        }
    }
    assert!(
        recorded > 0,
        "niepustosc: zadna wojna nie zapisala licznika"
    );
    assert!(barbarian > 0, "niepustosc: brak pary z barbarzynca");
}

#[test]
fn p4_milestones_and_last_war_match_pin_in_both_orders() {
    let p = CredibilityParams::load();
    let v = vectors();
    let mut pin_differs_from_reverse = 0usize;
    let mut milestone_positive = 0usize;

    for seq in v["ordering"].as_array().expect("ordering") {
        let owners: Vec<i64> = seq["owners"]
            .as_array()
            .expect("owners")
            .iter()
            .map(|x| x.as_i64().expect("owner"))
            .collect();

        // Wynik symulacji Rust dla obu kolejnosci: (lastWar, p4, liczba wieloletni_pokoj) po kazdym kroku.
        let mut rust_runs: Vec<Vec<Snap>> = Vec::new();
        for mode in ["pin", "reverse"] {
            let mut reg = CredibilityRegistry::default();
            let mut run = Vec::new();
            for st in seq["steps"].as_array().expect("steps") {
                let turn = st["turn"].as_f64().expect("tura");
                let wars: Vec<(i64, i64)> = st["wars"]
                    .as_array()
                    .expect("wars")
                    .iter()
                    .map(|w| (w[0].as_i64().expect("a"), w[1].as_i64().expect("b")))
                    .collect();
                let d4 = |reg: &mut CredibilityRegistry| {
                    for &o in &owners {
                        reg.tick_no_war_milestone(o, turn, p).expect("okno P4");
                    }
                };
                let d8 = |reg: &mut CredibilityRegistry| {
                    for &(a, b) in &wars {
                        reg.note_war_entered(a, b, turn);
                    }
                };
                if mode == "pin" {
                    d4(&mut reg);
                    d8(&mut reg);
                } else {
                    d8(&mut reg);
                    d4(&mut reg);
                }

                let snap_rust = (
                    owners
                        .iter()
                        .map(|&o| lookup_last_war(&reg, o))
                        .collect::<Vec<_>>(),
                    owners
                        .iter()
                        .map(|&o| lookup_p4(&reg, o))
                        .collect::<Vec<_>>(),
                    owners
                        .iter()
                        .map(|&o| wielo_count(&reg, o))
                        .collect::<Vec<_>>(),
                );
                let want = &st[mode];
                let want_last: Vec<Option<f64>> = owners
                    .iter()
                    .map(|o| pairs_opt(&want["lastWar"]).get(o).copied().flatten())
                    .collect();
                let want_p4: Vec<i64> = owners
                    .iter()
                    .map(|o| {
                        pairs_opt(&want["p4"])
                            .get(o)
                            .copied()
                            .flatten()
                            .unwrap_or(0.0) as i64
                    })
                    .collect();
                let want_wielo: Vec<usize> = owners
                    .iter()
                    .map(|o| {
                        pairs_opt(&want["wielo"])
                            .get(o)
                            .copied()
                            .flatten()
                            .unwrap_or(0.0) as usize
                    })
                    .collect();
                assert_eq!(
                    snap_rust.0, want_last,
                    "lastWar, seq {} tura {} {mode}",
                    seq["id"], turn
                );
                assert_eq!(
                    snap_rust.1, want_p4,
                    "p4, seq {} tura {} {mode}",
                    seq["id"], turn
                );
                assert_eq!(
                    snap_rust.2, want_wielo,
                    "wielo, seq {} tura {} {mode}",
                    seq["id"], turn
                );
                if snap_rust.1.iter().any(|&m| m > 0) {
                    milestone_positive += 1;
                }
                run.push(snap_rust);
            }
            rust_runs.push(run);
        }
        for (pin_step, rev_step) in rust_runs[0].iter().zip(rust_runs[1].iter()) {
            if pin_step != rev_step {
                pin_differs_from_reverse += 1;
            }
        }
    }
    assert!(
        milestone_positive > 0,
        "niepustosc: brak kamienia milowego P4"
    );
    assert!(
        pin_differs_from_reverse > 0,
        "niepustosc: kolejnosc D4/D8 nie ma wplywu na wynik - test nic nie rozstrzyga"
    );
}

#[test]
fn s3_trade_stream_umowa_handlowa_three_turns_matches_pin() {
    let p = CredibilityParams::load();
    let v = vectors();
    let mut trade_present = 0usize;
    let mut trade_absent = 0usize;

    for c in v["s3"].as_array().expect("s3") {
        let d = diff(&c["difficulty"]);
        let id = format!("s3-{}", c["id"].as_i64().expect("id"));
        let n_items = c["nItems"].as_u64().expect("nItems") as usize;
        let deal = StreamDeal {
            id: id.clone(),
            kind: StreamDealKind::LegacyTradeAgreement,
            parties: (0, 1),
            cyclic_len: n_items,
        };
        let mut reg = CredibilityRegistry::default();

        for t in c["turns"].as_array().expect("turns") {
            let deliveries: HashMap<usize, Option<bool>> = t["deliveries"]
                .as_array()
                .expect("deliveries")
                .iter()
                .map(|x| (x[0].as_u64().expect("idx") as usize, x[1].as_bool()))
                .collect();
            let delivery_ok = |deal_id: &str, idx: usize| -> Option<bool> {
                if deal_id == id {
                    deliveries.get(&idx).copied().flatten()
                } else {
                    None
                }
            };
            let active = stream_active_tuples(std::slice::from_ref(&deal), &delivery_ok);
            reg.update_streams_this_turn(&active, d, p);

            for (idx, owner) in [0i64, 1].iter().enumerate() {
                let mut want: Vec<(String, String, f64, f64)> = t["streams"][idx][1]
                    .as_array()
                    .expect("streams")
                    .iter()
                    .map(|e| {
                        (
                            e[0].as_str().expect("klucz").to_owned(),
                            e[1].as_str().expect("typ").to_owned(),
                            e[2].as_f64().expect("wartoscNaTure"),
                            e[3].as_f64().expect("sumaAktywna"),
                        )
                    })
                    .collect();
                let mut got: Vec<(String, String, f64, f64)> = reg
                    .streams
                    .iter()
                    .find(|(k, _)| k == owner)
                    .map(|(_, entries)| entries.as_slice())
                    .unwrap_or(&[])
                    .iter()
                    .map(|(k, e)| {
                        (
                            k.clone(),
                            e.typ.web_key().to_owned(),
                            e.value_per_turn,
                            e.active_sum,
                        )
                    })
                    .collect();
                want.sort_by(|x, y| x.0.cmp(&y.0));
                got.sort_by(|x, y| x.0.cmp(&y.0));
                assert_eq!(
                    got, want,
                    "S3 wektor {id} tura {} wlasciciel {owner}",
                    t["turn"]
                );
            }

            let key = format!("1_{}", "strumien_handel");
            let owner0_has_trade = reg
                .streams
                .iter()
                .find(|(k, _)| *k == 0)
                .map(|(_, entries)| entries.iter().any(|(k, _)| *k == key))
                .unwrap_or(false);
            if owner0_has_trade {
                trade_present += 1;
            } else {
                trade_absent += 1;
            }
        }
    }
    assert!(
        trade_present > 0,
        "niepustosc: strumien handlu nigdy nie naliczyl"
    );
    assert!(
        trade_absent > 0,
        "niepustosc: strumien handlu nigdy nie zostal przerwany dostawa"
    );
}
