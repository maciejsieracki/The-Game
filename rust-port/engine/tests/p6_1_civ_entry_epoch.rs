//! P6.1 — wektory z URUCHOMIONEGO weba (`gra/src/game/civ-entry-epoch.ts`, pin edb8fb56).
//! Wektory: `tests/p6_1_vectors/web-vectors.json` (generator: `gen-p61-web-vectors.mjs`
//! w katalogu runu R-RUSTPORT-P6-1-STAN-STARTOWY-Q1).

use civ_engine::domain::unit_epoch::{
    civ_entry_epoch, civ_ids_available_at_game_epoch, game_epoch_index,
    is_civ_available_at_game_epoch, parse_game_epoch_id, CivEntryRow, Epoch, GAME_EPOCH_ORDER,
};
use serde_json::Value;

const WEB_VECTORS: &str = include_str!("p6_1_vectors/web-vectors.json");

fn web() -> Value {
    serde_json::from_str(WEB_VECTORS).expect("web vectors parse")
}

/// Oczekiwana epoka z tekstu wektora (niezależnie od funkcji testowanej).
fn expected_epoch(id: &str) -> Epoch {
    match id {
        "kamien" => Epoch::Stone,
        "braz" => Epoch::Bronze,
        "zelazo" => Epoch::Iron,
        other => panic!("nieoczekiwany wynik weba: {other}"),
    }
}

fn str_list(value: &Value) -> Vec<&str> {
    value
        .as_array()
        .expect("array")
        .iter()
        .map(|item| item.as_str().expect("string"))
        .collect()
}

#[test]
fn game_epoch_order_matches_web() {
    assert_eq!(GAME_EPOCH_ORDER, [Epoch::Stone, Epoch::Bronze, Epoch::Iron]);
    let web = web();
    let order = str_list(&web["constants"]["GAME_EPOCH_ORDER"]);
    let mapped: Vec<Epoch> = order.iter().copied().map(expected_epoch).collect();
    assert_eq!(mapped, GAME_EPOCH_ORDER.to_vec());
}

#[test]
fn game_epoch_index_matches_web_for_every_probe() {
    let web = web();
    let index = web["constants"]["gameEpochIndex"]
        .as_object()
        .expect("object");
    assert!(!index.is_empty());
    for (id, expected) in index {
        let expected = expected.as_u64().expect("u64") as usize;
        assert_eq!(game_epoch_index(id), expected, "gameEpochIndex({id:?})");
    }
}

#[test]
fn strict_epoch_ids_reject_non_canonical_spellings() {
    // Web: dokładne dopasowanie GAME_EPOCH_ORDER.includes — brak trim, brak wielkich liter, brak angielskich nazw.
    for id in ["Kamien", " braz", "stone", "", "Kamień", "iron"] {
        assert_eq!(parse_game_epoch_id(id), None, "{id:?}");
        assert_eq!(game_epoch_index(id), GAME_EPOCH_ORDER.len(), "{id:?}");
    }
}

#[test]
fn civ_entry_epoch_matches_web_vectors() {
    let web = web();
    let rows = web["civEntry"].as_array().expect("civEntry");
    assert!(rows.len() >= 16);
    for row in rows {
        let input = &row["input"];
        let direct = input.get("epokaWejscia").and_then(Value::as_str);
        let legacy_owned: Option<Vec<&str>> = input.get("epokiStartowe").map(str_list);
        let legacy = legacy_owned.as_deref();
        let got = civ_entry_epoch(direct, legacy);
        let want = expected_epoch(row["entry"].as_str().expect("entry"));
        assert_eq!(got, want, "getCivEpokaWejscia({input})");
    }
}

#[test]
fn civ_availability_matches_web_vectors_for_every_game_epoch() {
    let web = web();
    let rows = web["civEntry"].as_array().expect("civEntry");
    for row in rows {
        let input = &row["input"];
        let direct = input.get("epokaWejscia").and_then(Value::as_str);
        let legacy_owned: Option<Vec<&str>> = input.get("epokiStartowe").map(str_list);
        let civ = CivEntryRow {
            ikona_id: None,
            epoka_wejscia: direct,
            epoki_startowe: legacy_owned.as_deref(),
        };
        for (game, expected) in row["available"].as_object().expect("available") {
            let expected = expected.as_bool().expect("bool");
            assert_eq!(
                is_civ_available_at_game_epoch(civ, game),
                expected,
                "isCivAvailableAtGameEpoch({input}, {game:?})"
            );
        }
    }
}

#[test]
fn civ_ids_available_match_web_roster_vectors() {
    let web = web();
    let roster_rows = [
        ("A", Some("kamien"), None),
        ("B", Some("braz"), None),
        ("C", Some("zelazo"), None),
        ("D", None, Some(vec!["braz", "zelazo"])),
        ("", Some("kamien"), None), // web: brak ikonaId -> pominięty
        ("E", None, Some(vec!["xyz"])),
    ];
    let legacy_slices: Vec<Option<&[&str]>> = roster_rows
        .iter()
        .map(|(_, _, legacy)| legacy.as_deref())
        .collect();
    let rows: Vec<CivEntryRow<'_>> = roster_rows
        .iter()
        .zip(legacy_slices.iter())
        .map(|((id, direct, _), legacy)| CivEntryRow {
            ikona_id: if id.is_empty() { None } else { Some(*id) },
            epoka_wejscia: *direct,
            epoki_startowe: *legacy,
        })
        .collect();
    for (game, expected) in web["rosterAvail"].as_object().expect("rosterAvail") {
        let expected: Vec<&str> = str_list(expected);
        assert_eq!(
            civ_ids_available_at_game_epoch(&rows, game),
            expected,
            "civIdsAvailableAtGameEpoch(roster, {game:?})"
        );
    }
}
