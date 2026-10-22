//! P6.1 r3 — `first-player-city.ts` (R-PIERWSZE-MIASTO) z wektorami z URUCHOMIONEGO weba
//! (`tests/p6_1_vectors/first-player-city.json`, generator `gen-p61-first-city-vectors.mjs`).

use civ_engine::domain::hex::HexCoord;
use civ_engine::domain::player::{
    is_awaiting_first_player_city, is_hex_in_start_reveal, validate_first_player_city_placement,
    FIRST_CITY_START_REVEAL_DENIED,
};
use civ_engine::domain::{OwnerRef, PlayerId};
use serde_json::Value;

const WEB_VECTORS: &str = include_str!("p6_1_vectors/first-player-city.json");

fn web() -> Value {
    serde_json::from_str(WEB_VECTORS).expect("first-player-city vectors parse")
}

fn owner(value: i64) -> OwnerRef {
    OwnerRef::from_legacy_i64(value).expect("reprezentowalny właściciel")
}

fn hex(value: &Value) -> HexCoord {
    let q = i32::try_from(value["q"].as_i64().expect("q")).expect("q i32");
    let r = i32::try_from(value["r"].as_i64().expect("r")).expect("r i32");
    HexCoord::new(q, r)
}

#[test]
fn denied_message_matches_web_constant() {
    let web = web();
    assert_eq!(
        FIRST_CITY_START_REVEAL_DENIED,
        web["constants"]["FIRST_CITY_START_REVEAL_DENIED"]
            .as_str()
            .expect("constant")
    );
}

#[test]
fn awaiting_first_city_matches_web_for_owner_zero() {
    let web = web();
    let rows = web["awaiting"].as_array().expect("awaiting");
    assert_eq!(rows.len(), 14);
    for row in rows {
        let ever = row["everOwned"].as_bool().expect("everOwned");
        let owners: Vec<OwnerRef> = row["owners"]
            .as_array()
            .expect("owners")
            .iter()
            .map(|v| owner(v.as_i64().expect("owner")))
            .collect();
        let expected = row["awaiting"].as_bool().expect("awaiting");
        let got = is_awaiting_first_player_city(ever, owners, PlayerId::new(0));
        assert_eq!(got, expected, "row {row}");
    }
}

#[test]
fn awaiting_first_city_matches_web_for_explicit_owner_one() {
    let web = web();
    let rows = web["awaitingWithOwnerOne"]
        .as_array()
        .expect("awaitingWithOwnerOne");
    assert_eq!(rows.len(), 14);
    for row in rows {
        let ever = row["everOwned"].as_bool().expect("everOwned");
        let owners: Vec<OwnerRef> = row["owners"]
            .as_array()
            .expect("owners")
            .iter()
            .map(|v| owner(v.as_i64().expect("owner")))
            .collect();
        let expected = row["awaiting"].as_bool().expect("awaiting");
        let got = is_awaiting_first_player_city(ever, owners, PlayerId::new(1));
        assert_eq!(got, expected, "row {row}");
    }
}

#[test]
fn hex_in_start_reveal_matches_web_vectors() {
    let web = web();
    let rows = web["reveal"].as_array().expect("reveal");
    assert_eq!(rows.len(), 108);
    for row in rows {
        let probe = hex(row);
        let awaiting = row["awaiting"].as_bool().expect("awaiting");
        let start = if row["start"].is_null() {
            None
        } else {
            Some(hex(&row["start"]))
        };
        let radius = u32::try_from(row["radius"].as_u64().expect("radius")).expect("u32");
        let expected = row["inReveal"].as_bool().expect("inReveal");
        assert_eq!(
            is_hex_in_start_reveal(probe, awaiting, start, radius),
            expected,
            "row {row}"
        );
    }
}

#[test]
fn validate_placement_matches_web_vectors() {
    let web = web();
    let rows = web["validate"].as_array().expect("validate");
    assert_eq!(rows.len(), 16);
    for row in rows {
        let base_ok = row["baseOk"].as_bool().expect("baseOk");
        let awaiting = row["awaiting"].as_bool().expect("awaiting");
        let in_reveal = row["inStartReveal"].as_bool().expect("inStartReveal");
        let base_reason = row["baseReason"].as_str().expect("baseReason");
        let result = &row["result"];
        let expected_ok = result["ok"].as_bool().expect("ok");
        let expected_reason = result["reason"].as_str().expect("reason");
        let got = validate_first_player_city_placement(awaiting, in_reveal, base_ok, base_reason);
        match got {
            Ok(()) => {
                assert!(expected_ok, "row {row}: web ok=false, rust Ok");
                assert_eq!(expected_reason, "", "row {row}");
            }
            Err(reason) => {
                assert!(!expected_ok, "row {row}: web ok=true, rust Err");
                assert_eq!(reason, expected_reason, "row {row}");
            }
        }
    }
}
