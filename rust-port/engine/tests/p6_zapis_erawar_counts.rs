//! P6-ZAPIS-ERAWAR (runda 1): licznik wojen epoki - zapis/odczyt jak w webie (R-WEB-ERA-WAR-COUNTER-Q1).
//! Funkcje: `recordEraForcedWarParticipation` (war-rules-multiwar.ts:241),
//! `rebuildEraWarCountsFromActivePairs` (:258), `restoreEraWarCounts` (:276), `eraWarCivKey`, `eraWarCountFor`.
//! Wektory: `tests/p6_zapis_erawar_data/zapis.json` - generator: Node 22 + `--experimental-strip-types`,
//! prawdziwe funkcje weba z `origin/main` 679ab078a (jedyny patch: import JSON -> readFileSync).
//! Porownanie: JSON.stringify(Array.from(map.entries())) == serde_json::to_string tablicy par.

use civ_engine::domain::diplomacy_multiwar::{
    era_war_civ_key, era_war_count_for, rebuild_era_war_counts_from_active_pairs,
    record_era_forced_war_participation, restore_era_war_counts, ActiveWarPair, EraWarCounts,
};
use serde_json::{json, Value};
use std::collections::BTreeMap;

const ZAPIS: &str = include_str!("p6_zapis_erawar_data/zapis.json");

/// Web `Array.from(map.entries())` jako JSON (kolejnosc wstawiania zachowana).
fn render(counts: &EraWarCounts) -> String {
    let entries: Vec<Value> = counts
        .entries()
        .iter()
        .map(|(k, n)| json!([k, n]))
        .collect();
    serde_json::to_string(&Value::Array(entries)).expect("render")
}

fn pairs_of(v: &Value) -> Vec<ActiveWarPair> {
    v.as_array()
        .expect("pairs")
        .iter()
        .map(|p| ActiveWarPair {
            attacker_id: p["attackerId"].as_i64().expect("attackerId"),
            target_id: p["targetId"].as_i64().expect("targetId"),
        })
        .collect()
}

fn epoch_fn(epochs: &Value) -> impl Fn(i64) -> i64 + '_ {
    move |oid| epochs[oid.to_string()].as_i64().expect("epoka")
}

fn epochs_fixture() -> Value {
    json!({ "0": 1, "1": 2, "2": 3, "3": 1 })
}

fn ids(pairs: &[(i64, i64)]) -> Vec<ActiveWarPair> {
    pairs
        .iter()
        .map(|&(a, t)| ActiveWarPair {
            attacker_id: a,
            target_id: t,
        })
        .collect()
}

#[test]
fn zapis_vectors_match_web() {
    let cases: Vec<Value> = serde_json::from_str(ZAPIS).expect("wektory sie parsuja");
    let mut seen: BTreeMap<&str, usize> = BTreeMap::new();
    // Stan kumulowany miedzy kolejnymi przypadkami `recordEraForcedWarParticipation` (jak w webie).
    let mut running = EraWarCounts::new();
    for c in &cases {
        let f = c["fn"].as_str().expect("fn");
        let input = &c["in"];
        let want = c["out"].as_str().expect("out");
        *seen.entry(f).or_default() += 1;
        match f {
            "rebuildEraWarCountsFromActivePairs" => {
                let epochs = input["epochs"].clone();
                let got = rebuild_era_war_counts_from_active_pairs(
                    &pairs_of(&input["pairs"]),
                    epoch_fn(&epochs),
                );
                assert_eq!(render(&got), want, "rebuild {input}");
            }
            "restoreEraWarCounts" => {
                let epochs = input["epochs"].clone();
                let saved_raw = &input["saved"];
                // Marker "undefined" = pole nieobecne w zapisie (web: `saved === undefined`).
                let saved: Option<Value> = match saved_raw.as_str() {
                    Some("undefined") => None,
                    _ => Some(saved_raw.clone()),
                };
                let got = restore_era_war_counts(
                    saved.as_ref(),
                    &pairs_of(&input["pairs"]),
                    epoch_fn(&epochs),
                );
                assert_eq!(render(&got), want, "restore {input}");
            }
            "recordEraForcedWarParticipation" => {
                record_era_forced_war_participation(
                    &mut running,
                    input["attackerId"].as_i64().expect("a"),
                    input["targetId"].as_i64().expect("t"),
                    input["attackerEpoch"].as_i64().expect("ea"),
                    input["targetEpoch"].as_i64().expect("et"),
                );
                assert_eq!(render(&running), want, "record {input}");
            }
            "eraWarCountFor" => {
                let mut map = EraWarCounts::new();
                for e in input["counts"].as_array().expect("counts") {
                    map.set(
                        e[0].as_str().expect("k").to_string(),
                        e[1].as_i64().expect("n"),
                    );
                }
                let got = era_war_count_for(
                    &map.to_hash_map(),
                    input["ownerId"].as_i64().expect("o"),
                    input["epoch"].as_i64().expect("e"),
                );
                assert_eq!(got.to_string(), want, "countFor {input}");
            }
            "eraWarCivKey" => {
                let got = era_war_civ_key(
                    input["ownerId"].as_i64().expect("o"),
                    input["epoch"].as_i64().expect("e"),
                );
                assert_eq!(got, want, "civKey {input}");
            }
            other => panic!("nieznana funkcja w wektorach: {other}"),
        }
    }
    assert_eq!(seen["rebuildEraWarCountsFromActivePairs"], 5);
    assert_eq!(seen["restoreEraWarCounts"], 10);
    assert_eq!(seen["recordEraForcedWarParticipation"], 5);
    assert_eq!(seen["eraWarCountFor"], 4);
    assert_eq!(seen["eraWarCivKey"], 4);
}

#[test]
fn zapis_odczyt_roundtrip_keeps_order_and_values() {
    let epochs = epochs_fixture();
    let mut counts = EraWarCounts::new();
    record_era_forced_war_participation(&mut counts, 1, 2, 2, 3);
    record_era_forced_war_participation(&mut counts, 0, 1, 1, 2);
    let saved = Value::Array(
        counts
            .entries()
            .iter()
            .map(|(k, n)| json!([k, n]))
            .collect(),
    );
    let back = restore_era_war_counts(Some(&saved), &[], epoch_fn(&epochs));
    assert_eq!(back, counts);
    assert_eq!(render(&back), render(&counts));
}

#[test]
fn stary_zapis_bez_pola_odbudowuje_z_aktywnych_par() {
    let epochs = epochs_fixture();
    let pairs = ids(&[(1, 2), (3, 0)]);
    let got = restore_era_war_counts(None, &pairs, epoch_fn(&epochs));
    let want = rebuild_era_war_counts_from_active_pairs(&pairs, epoch_fn(&epochs));
    assert_eq!(got, want);
    // Obie strony pary = 1 w bieżącej epoce; reszta = 0 (brak wpisu).
    assert_eq!(got.get("1:2"), Some(1));
    assert_eq!(got.get("2:3"), Some(1));
    assert_eq!(got.get("3:1"), Some(1));
    assert_eq!(got.get("0:1"), Some(1));
    assert_eq!(era_war_count_for(&got.to_hash_map(), 9, 9), 0);
}

#[test]
fn zapis_z_licznikami_przywraca_bit_w_bit() {
    let epochs = epochs_fixture();
    let saved = json!([["1:2", 5], ["0:1", 0], ["2:3", 2]]);
    // Aktywne pary są ignorowane, gdy pole istnieje (web: tablica -> odczyt, nie odbudowa).
    let got = restore_era_war_counts(Some(&saved), &ids(&[(1, 2)]), epoch_fn(&epochs));
    assert_eq!(render(&got), r#"[["1:2",5],["0:1",0],["2:3",2]]"#);
}

#[test]
fn pusta_lista_daje_pusty_licznik() {
    let epochs = epochs_fixture();
    let got = restore_era_war_counts(Some(&json!([])), &ids(&[(1, 2)]), epoch_fn(&epochs));
    assert!(got.is_empty());
    assert_eq!(got.len(), 0);
}

#[test]
fn nieprawidlowy_typ_pola_wraca_do_odbudowy() {
    let epochs = epochs_fixture();
    let pairs = ids(&[(1, 2)]);
    let want = rebuild_era_war_counts_from_active_pairs(&pairs, epoch_fn(&epochs));
    for bad in [
        json!(null),
        json!("x"),
        json!(7),
        json!({ "1:2": 3 }),
        json!(true),
    ] {
        let got = restore_era_war_counts(Some(&bad), &pairs, epoch_fn(&epochs));
        assert_eq!(got, want, "typ {bad}");
    }
}

#[test]
fn niepoprawne_wpisy_sa_pomijane() {
    let epochs = epochs_fixture();
    let saved = json!([
        ["1:2", 2],
        "bad",
        ["2:3", "1"],
        [7, 1],
        ["0:1"],
        ["3:1", null],
        ["5:1", 3]
    ]);
    let got = restore_era_war_counts(Some(&saved), &[], epoch_fn(&epochs));
    assert_eq!(render(&got), r#"[["1:2",2],["5:1",3]]"#);
}

#[test]
fn powtorzony_klucz_ma_ostatnia_wartosc_i_pierwsza_pozycje() {
    let epochs = epochs_fixture();
    let saved = json!([["1:2", 2], ["0:1", 1], ["1:2", 5]]);
    let got = restore_era_war_counts(Some(&saved), &[], epoch_fn(&epochs));
    assert_eq!(render(&got), r#"[["1:2",5],["0:1",1]]"#);
}

#[test]
fn ulamek_jest_pomijany_swiadome_odstepstwo() {
    // Web zachowałby 1.5; Rust trzyma liczniki całkowite (i64), więc ułamek jest pomijany.
    let epochs = epochs_fixture();
    let saved = json!([["1:2", 1.5], ["0:1", 2.0]]);
    let got = restore_era_war_counts(Some(&saved), &[], epoch_fn(&epochs));
    assert_eq!(render(&got), r#"[["0:1",2]]"#);
}

#[test]
fn liczby_poza_2_53_sa_pomijane_swiadome_odstepstwo() {
    // Web (zweryfikowane Node 22.22 na prawdziwym restoreEraWarCounts z origin/main 679ab078a)
    // zachowuje 1e20 i 2^53 jako wartości. Rust odrzuca liczby całkowite o module > 2^53-1
    // (P6-ZAPIS-ERAWAR.md, ODSTĘPSTWO nr 1). Zapisy web nie produkują takich wartości.
    let epochs = epochs_fixture();
    let saved = json!([
        ["1:2", 1e20],
        ["2:3", 9007199254740992i64],
        ["0:1", 9007199254740991i64]
    ]);
    let got = restore_era_war_counts(Some(&saved), &[], epoch_fn(&epochs));
    assert_eq!(render(&got), r#"[["0:1",9007199254740991]]"#);
}

#[test]
fn napastnik_rowny_celowi_podwaja_wpis() {
    // Web: dwa sekwencyjne `Map.set` pod ten sam klucz -> +2 (zachowane 1:1).
    let mut counts = EraWarCounts::new();
    record_era_forced_war_participation(&mut counts, 2, 2, 3, 3);
    assert_eq!(counts.get("2:3"), Some(2));
    assert_eq!(counts.len(), 1);
}
