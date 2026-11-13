//! R-RUSTPORT-P6-ZLOZA-B: wektory z pinu `07d2fbd72f758705f8e1d59cc4968027ffbafe75`
//! dla gałęzi `zloze` funkcji `transferBasketItems` (`gra/src/main.ts:12566`).
//! Wektory generuje `p6_zloza_basket_gen.mjs` (wykonanie fragmentu pinu w node, strażnik SHA-256).

use civ_engine::domain::diplomacy::{BasketItem, BasketItemKind, ZlozeGrant};
use civ_engine::domain::diplomacy_basket::transfer_basket_zloze_grants;
use civ_engine::domain::PlayerId;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_zloza_basket_vectors/vectors.json");

/// SHA-256 pliku `gra/src/main.ts` na pinie (strażnik także w generatorze).
const PIN_MAIN_SHA256: &str = "e80f9cb41d513b92846972a19f2760e08eb4247d6a9b344526d8bc71bd7d5f19";
/// SHA-256 fragmentu `function transferBasketItems(` ... `}` z pinu (wycięty przez generator).
const PIN_FRAGMENT_SHA256: &str =
    "c6f7b25b3d9b745ea12c85acaf7164750ba17357cbac300e169fdd62d6d5b192";
const PIN_COMMIT: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";

fn p(id: i64) -> PlayerId {
    PlayerId::new(id as u64)
}

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("vectors.json")
}

fn grant_from(v: &Value) -> ZlozeGrant {
    ZlozeGrant {
        granter_owner_id: p(v["granterOwnerId"].as_i64().expect("granterOwnerId")),
        grantee_owner_id: p(v["granteeOwnerId"].as_i64().expect("granteeOwnerId")),
        partner_id: p(v["partnerId"].as_i64().expect("partnerId")),
        zloze_id: v["zlozeId"].as_str().expect("zlozeId").to_string(),
        hex_key: v["hexKey"].as_str().expect("hexKey").to_string(),
        active: v["active"].as_bool().expect("active"),
        deal_id: v["dealId"].as_str().map(str::to_string),
    }
}

#[test]
fn pin_identity_is_pinned() {
    let v = vectors();
    assert_eq!(v["pin"]["commit"].as_str(), Some(PIN_COMMIT));
    assert_eq!(v["pin"]["file_sha256"].as_str(), Some(PIN_MAIN_SHA256));
    assert_eq!(
        v["pin"]["fragment_sha256"].as_str(),
        Some(PIN_FRAGMENT_SHA256)
    );
    assert_eq!(v["pin"]["function"].as_str(), Some("transferBasketItems"));
}

#[test]
fn zloze_branch_matches_pin_vectors() {
    let v = vectors();
    let cases = v["cases"].as_array().expect("cases");
    assert!(cases.len() >= 200, "za malo przypadkow: {}", cases.len());
    for case in cases {
        let name = case["name"].as_str().unwrap_or("?");
        let items: Vec<BasketItem> = serde_json::from_value(case["items"].clone())
            .unwrap_or_else(|e| panic!("{name}: items: {e}"));
        let from = p(case["fromOwnerId"].as_i64().expect("fromOwnerId"));
        let to = p(case["toOwnerId"].as_i64().expect("toOwnerId"));
        let deal_id = case["dealId"].as_str();
        let mut grants: Vec<ZlozeGrant> = Vec::new();
        let outcome = transfer_basket_zloze_grants(from, to, &items, deal_id, &mut grants);

        let expected: Vec<ZlozeGrant> = case["expectedGrants"]
            .as_array()
            .expect("expectedGrants")
            .iter()
            .map(grant_from)
            .collect();
        assert_eq!(grants, expected, "przypadek: {name}");
        assert_eq!(outcome.grants_created, expected.len(), "przypadek: {name}");
    }
}

#[test]
fn hex_key_falls_back_to_item_id_only_when_absent() {
    let mut grants = Vec::new();
    let mut with_key = BasketItem::new(BasketItemKind::Deposit, "z1", 1.0);
    with_key.hex_key = Some("h1".to_string());
    let without_key = BasketItem::new(BasketItemKind::Deposit, "z2", 1.0);
    let mut empty_key = BasketItem::new(BasketItemKind::Deposit, "z3", 1.0);
    empty_key.hex_key = Some(String::new());
    transfer_basket_zloze_grants(
        p(1),
        p(2),
        &[with_key, without_key, empty_key],
        None,
        &mut grants,
    );
    let keys: Vec<&str> = grants.iter().map(|g| g.hex_key.as_str()).collect();
    assert_eq!(keys, vec!["h1", "z2", ""]);
}

#[test]
fn non_zloze_kinds_are_reported_not_applied() {
    let mut grants = Vec::new();
    let items = vec![
        BasketItem::new(BasketItemKind::Gold, "zloto", 5.0),
        BasketItem::new(BasketItemKind::Deposit, "z1", 1.0),
        BasketItem::new(BasketItemKind::Gold, "zloto", 3.0),
        BasketItem::new(BasketItemKind::Unit, "u1", 1.0),
    ];
    let outcome = transfer_basket_zloze_grants(p(1), p(2), &items, Some("d1"), &mut grants);
    assert_eq!(outcome.grants_created, 1);
    assert_eq!(grants.len(), 1);
    assert_eq!(
        outcome.skipped_kinds,
        vec![BasketItemKind::Gold, BasketItemKind::Unit]
    );
}

#[test]
fn empty_items_is_noop() {
    let mut grants = Vec::new();
    let outcome = transfer_basket_zloze_grants(p(1), p(2), &[], Some("d1"), &mut grants);
    assert_eq!(outcome.grants_created, 0);
    assert!(outcome.skipped_kinds.is_empty());
    assert!(grants.is_empty());
}
