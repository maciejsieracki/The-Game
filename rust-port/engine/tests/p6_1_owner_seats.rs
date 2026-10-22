//! P6.1 — wektory z URUCHOMIONEGO weba dla `owner-utils.ts` (isMajorAiOwner) i
//! `human-owners.ts` (HumanSeats). Wektory: `tests/p6_1_vectors/web-vectors.json`.
//! Uwaga: id właścicieli spoza {-99, -1, >=0} nie są reprezentowalne w `OwnerRef` (NIE-DOTYCZY).

use civ_engine::domain::player::{is_major_ai_owner, HumanSeats, HUMAN_OWNER_PRIMARY};
use civ_engine::domain::{OwnerRef, PlayerId};
use serde_json::Value;

const WEB_VECTORS: &str = include_str!("p6_1_vectors/web-vectors.json");

fn web() -> Value {
    serde_json::from_str(WEB_VECTORS).expect("web vectors parse")
}

fn owner(value: i64) -> OwnerRef {
    OwnerRef::from_legacy_i64(value).expect("reprezentowalny właściciel")
}

fn player(value: u64) -> PlayerId {
    PlayerId::new(value)
}

#[test]
fn human_owner_primary_matches_web() {
    let web = web();
    assert_eq!(
        HUMAN_OWNER_PRIMARY.get(),
        web["constants"]["HUMAN_OWNER_PRIMARY"].as_u64().unwrap()
    );
}

#[test]
fn stub_constants_are_the_web_sentinels() {
    // Sentynele weba: barbarians.ts:49 (-1), society-breakdown.ts:206 (-99); potwierdzone generatorem.
    let web = web();
    for key in ["barbarian_const", "barbarian_fn", "rebel_const"] {
        assert_eq!(
            web["stubChecks"][key],
            Value::Bool(true),
            "stubChecks.{key}"
        );
    }
    assert_eq!(owner(-1), OwnerRef::Barbarian);
    assert_eq!(owner(-99), OwnerRef::Rebel);
}

#[test]
fn major_ai_owner_matches_web_vectors() {
    let web = web();
    let city_states = [player(2), player(3)];
    let rows = web["majorAi"].as_array().expect("majorAi");
    assert_eq!(rows.len(), 7);
    for row in rows {
        let id = row["owner"].as_i64().expect("owner");
        let expected = row["major"].as_bool().expect("major");
        let got = is_major_ai_owner(owner(id), |p| city_states.contains(&p));
        assert_eq!(got, expected, "isMajorAiOwner({id})");
    }
}

#[test]
fn human_seats_match_web_vectors() {
    let web = web();
    let rows = web["seats"].as_array().expect("seats");
    assert_eq!(rows.len(), 8);
    for row in rows {
        let seats_json = &row["seats"];
        let humans: Vec<PlayerId> = seats_json["humanOwnerIds"]
            .as_array()
            .expect("humanOwnerIds")
            .iter()
            .map(|v| player(v.as_u64().expect("u64")))
            .collect();
        let active = player(seats_json["activeHumanOwnerId"].as_u64().expect("active"));
        let seats = HumanSeats::new(humans, active);

        assert_eq!(
            seats.is_hot_seat(),
            row["isHotSeat"].as_bool().unwrap(),
            "{seats_json}"
        );
        let next = seats.next_human_seat().map(PlayerId::get);
        let want_next = row["nextHumanSeat"].as_u64();
        assert_eq!(next, want_next, "nextHumanSeat {seats_json}");

        for probe in row["owners"].as_array().expect("owners") {
            let id = probe["owner"].as_i64().expect("owner");
            let o = owner(id);
            assert_eq!(
                seats.is_human_owner(o),
                probe["isHuman"].as_bool().unwrap(),
                "isHumanOwner({id}) {seats_json}"
            );
            assert_eq!(
                seats.is_active_human(o),
                probe["isActive"].as_bool().unwrap(),
                "isActiveHuman({id}) {seats_json}"
            );
            assert_eq!(
                seats.is_ai_owner(o),
                probe["isAi"].as_bool().unwrap(),
                "isAiOwner({id}) {seats_json}"
            );
        }
    }
}

#[test]
fn hot_seat_cycles_and_skips_unknown_active() {
    let seats = HumanSeats::new(vec![player(0), player(5), player(7)], player(7));
    assert_eq!(seats.next_human_seat(), Some(player(0)));
    let single = HumanSeats::new(vec![player(0)], player(0));
    assert_eq!(single.next_human_seat(), None);
    assert!(!single.is_hot_seat());
    let stranger = HumanSeats::new(vec![player(0), player(1)], player(9));
    assert_eq!(stranger.next_human_seat(), None);
}
