//! R-RUSTPORT-P6-WIRE-WAR-R7K7B: wektory z pinu `07d2fbd72f758705f8e1d59cc4968027ffbafe75`
//! dla `deactivateZlozeGrantsForDeal` i `syncRelationFromDeals` (wycinek z jawnym stanem).
//! Wektory generuje `p6_r7k7b_zloze_sync_gen.mjs` (wykonanie tekstu pinu w node, strażnik SHA-256).

use civ_engine::domain::diplomacy::{
    deactivate_zloze_grants_for_deal, sync_relation_status_from_deals, ActiveDeal, RelationStatus,
    TreatyKind, ZlozeGrant,
};
use civ_engine::domain::PlayerId;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_r7k7b_vectors/vectors.json");

fn p(id: i64) -> PlayerId {
    PlayerId::new(id as u64)
}

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("vectors.json")
}

fn as_i64(v: &Value) -> i64 {
    v.as_i64().expect("liczba calkowita")
}

fn grant_from(v: &Value) -> ZlozeGrant {
    ZlozeGrant {
        granter_owner_id: p(as_i64(&v["granterOwnerId"])),
        grantee_owner_id: p(as_i64(&v["granteeOwnerId"])),
        partner_id: p(as_i64(&v["partnerId"])),
        zloze_id: v["zlozeId"].as_str().expect("zlozeId").to_string(),
        hex_key: v["hexKey"].as_str().expect("hexKey").to_string(),
        active: v["active"].as_bool().expect("active"),
        deal_id: v["dealId"].as_str().map(str::to_string),
    }
}

fn deal_from(v: &Value) -> ActiveDeal {
    let kind: TreatyKind =
        serde_json::from_value(v["rodzaj"].clone()).expect("rodzaj traktatu z pinu");
    let strony = v["strony"].as_array().expect("strony");
    ActiveDeal::new(kind, p(as_i64(&strony[0])), p(as_i64(&strony[1])), 1, None)
}

fn status_from(v: &Value) -> RelationStatus {
    serde_json::from_value(v.clone()).expect("status relacji z pinu")
}

#[test]
fn vectors_meet_minimum_counts_and_pin() {
    let v = vectors();
    assert_eq!(v["meta"]["pin"], "07d2fbd72f758705f8e1d59cc4968027ffbafe75");
    let deact = v["deactivate"].as_array().expect("deactivate");
    let sync = v["sync"].as_array().expect("sync");
    assert!(deact.len() >= 150, "deactivate: {} < 150", deact.len());
    assert!(sync.len() >= 150, "sync: {} < 150", sync.len());
}

#[test]
fn deactivate_zloze_grants_for_deal_matches_pin_vectors() {
    let v = vectors();
    let mut hits = 0usize;
    for case in v["deactivate"].as_array().expect("deactivate") {
        let grants: Vec<ZlozeGrant> = case["grants"]
            .as_array()
            .expect("grants")
            .iter()
            .map(grant_from)
            .collect();
        let deal_id = case["dealId"].as_str().expect("dealId");
        let expected: Vec<ZlozeGrant> = case["expected"]
            .as_array()
            .expect("expected")
            .iter()
            .map(grant_from)
            .collect();
        let got = deactivate_zloze_grants_for_deal(&grants, deal_id);
        assert_eq!(got, expected, "przypadek {}", case["name"]);
        if grants
            .iter()
            .any(|g| g.active && g.deal_id.as_deref() == Some(deal_id))
        {
            hits += 1;
        }
    }
    assert!(hits > 0, "wektory musza zawierac trafienia deala");
}

#[test]
fn sync_relation_from_deals_matches_pin_vectors() {
    let v = vectors();
    let mut changed = 0usize;
    for case in v["sync"].as_array().expect("sync") {
        let a = p(as_i64(&case["a"]));
        let b = p(as_i64(&case["b"]));
        let current = status_from(&case["status"]);
        let deals: Vec<ActiveDeal> = case["deals"]
            .as_array()
            .expect("deals")
            .iter()
            .map(deal_from)
            .collect();
        let expected = status_from(&case["expected"]);
        // None = web nie wola setDiploRelation, status zostaje.
        let got = sync_relation_status_from_deals(current, &deals, a, b).unwrap_or(current);
        assert_eq!(got, expected, "przypadek {}", case["name"]);
        if got != current {
            changed += 1;
        }
    }
    assert!(changed > 0, "wektory musza zawierac zmiany statusu");
}
