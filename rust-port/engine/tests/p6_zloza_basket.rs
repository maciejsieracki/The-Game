//! R-RUSTPORT-P6-ZLOZA-B: wektory z pinu `07d2fbd72f758705f8e1d59cc4968027ffbafe75`
//! dla gałęzi `zloze` funkcji `transferBasketItems` (`gra/src/main.ts:12566`).
//! Wektory generuje `p6_zloza_basket_gen.mjs` (wykonanie fragmentu pinu w node, strażnik SHA-256).
//!
//! Testy gałęzi `tech`, `surowiec_boolean`, `surowiec_ilosc` i `praca` (r2) NIE są wektorami
//! pinu: sprawdzają, że wrapper przekazuje do helperów Rust te same argumenty i kolejność
//! zapisów co pin, oraz że gałęzie bez portu są jawnie raportowane. Wektory pinu dla tych
//! gałęzi wymagają rozszerzenia generatora (poza tym tematem r2).

use std::collections::BTreeMap;

use civ_engine::domain::diplomacy::{
    grant_surowiec_boolean_access, grant_tech_to_owner, normalize_resource_quantity,
    transfer_surowiec_ilosc, BasketItem, BasketItemKind, BasketTransferContext, CityResourceState,
    ZlozeGrant,
};
use civ_engine::domain::diplomacy_basket::{
    transfer_basket_items, BasketTransferOutcome, BasketTransferState,
};
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

/// Stan świata dla wywołań testowych.
#[derive(Default)]
struct Env {
    ctx: BasketTransferContext,
    cities: Vec<CityResourceState>,
    pool: BTreeMap<u64, f64>,
}

impl Env {
    fn run(
        &mut self,
        from: PlayerId,
        to: PlayerId,
        items: &[BasketItem],
        deal: Option<&str>,
        grants: &mut Vec<ZlozeGrant>,
        skala: i64,
    ) -> BasketTransferOutcome {
        let capital = |_: PlayerId| -> Option<String> { None };
        let mut state = BasketTransferState {
            context: &mut self.ctx,
            cities: &mut self.cities,
            praca_pool_by_owner: &mut self.pool,
            capital_city_for: &capital,
            pn_praca_skala: skala,
        };
        transfer_basket_items(from, to, items, deal, grants, &mut state)
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
        let outcome = Env::default().run(from, to, &items, deal_id, &mut grants, 1);

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
    Env::default().run(
        p(1),
        p(2),
        &[with_key, without_key, empty_key],
        None,
        &mut grants,
        1,
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
        BasketItem::new(BasketItemKind::Food, "zywnosc", 4.0),
    ];
    let outcome = Env::default().run(p(1), p(2), &items, Some("d1"), &mut grants, 1);
    assert_eq!(outcome.grants_created, 1);
    assert_eq!(grants.len(), 1);
    assert_eq!(
        outcome.skipped_kinds,
        vec![
            BasketItemKind::Gold,
            BasketItemKind::Unit,
            BasketItemKind::Food
        ]
    );
}

#[test]
fn miasto_item_has_no_port_and_does_not_deserialize() {
    // Pin `case 'miasto'` (main.ts:12648) nie ma odpowiednika: brak wariantu BasketItemKind.
    let r = serde_json::from_str::<BasketItem>(r#"{"typ":"miasto","id":"c1","ilosc":1}"#);
    assert!(r.is_err(), "miasto nie powinno być reprezentowane w Rust");
}

#[test]
fn empty_items_is_noop() {
    let mut grants = Vec::new();
    let outcome = Env::default().run(p(1), p(2), &[], Some("d1"), &mut grants, 1);
    assert_eq!(outcome.grants_created, 0);
    assert!(outcome.skipped_kinds.is_empty());
    assert!(outcome.unported_side_effects.is_empty());
    assert!(grants.is_empty());
}

#[test]
fn tech_wrapper_passes_context_like_helper() {
    let mut env = Env::default();
    let before = env.ctx.clone();
    let expected = grant_tech_to_owner("t1", p(2), &before);
    let mut grants = Vec::new();
    let items = vec![BasketItem::new(BasketItemKind::Technology, "t1", 1.0)];
    let outcome = env.run(p(1), p(2), &items, None, &mut grants, 1);
    assert_eq!(env.ctx, expected.context);
    assert!(grants.is_empty());
    assert!(outcome.unported_side_effects.is_empty());
}

#[test]
fn tech_for_owner_zero_reports_unported_side_effects_only_when_granted() {
    let mut env = Env::default();
    let items = vec![BasketItem::new(BasketItemKind::Technology, "t1", 1.0)];
    let granted = grant_tech_to_owner("t1", p(0), &env.ctx).granted;
    let mut grants = Vec::new();
    let outcome = env.run(p(1), p(0), &items, None, &mut grants, 1);
    assert_eq!(outcome.unported_side_effects.is_empty(), !granted);
}

#[test]
fn boolean_resource_wrapper_passes_context_like_helper() {
    let mut env = Env::default();
    let expected = grant_surowiec_boolean_access("zelazo", p(1), p(2), &env.ctx);
    let mut grants = Vec::new();
    let items = vec![BasketItem::new(
        BasketItemKind::BooleanResource,
        "zelazo",
        1.0,
    )];
    env.run(p(1), p(2), &items, None, &mut grants, 1);
    assert_eq!(env.ctx, expected.context);
}

#[test]
fn quantity_resource_floors_to_step_before_transfer() {
    let mut env = Env {
        cities: vec![
            CityResourceState {
                id: "c1".into(),
                owner_id: p(1),
                resources: BTreeMap::from([("zboze".to_string(), 50.0)]),
            },
            CityResourceState {
                id: "c2".into(),
                owner_id: p(2),
                resources: BTreeMap::new(),
            },
        ],
        ..Env::default()
    };
    let normalized = normalize_resource_quantity("zboze", 7.9, None);
    let expected = transfer_surowiec_ilosc("zboze", normalized, p(1), p(2), None, &env.cities);
    let mut grants = Vec::new();
    let items = vec![BasketItem::new(
        BasketItemKind::QuantityResource,
        "zboze",
        7.9,
    )];
    env.run(p(1), p(2), &items, None, &mut grants, 1);
    let after: Vec<BTreeMap<String, f64>> =
        env.cities.iter().map(|c| c.resources.clone()).collect();
    let want: Vec<BTreeMap<String, f64>> = expected
        .cities
        .iter()
        .map(|c| c.resources.clone())
        .collect();
    assert_eq!(after, want);
}

#[test]
fn praca_moves_pool_with_clamp_like_pin() {
    let mut env = Env {
        pool: BTreeMap::from([(1, 10.0), (2, 0.0)]),
        ..Env::default()
    };
    let mut grants = Vec::new();
    let items = vec![BasketItem::new(BasketItemKind::Work, "praca", 3.0)];
    env.run(p(1), p(2), &items, None, &mut grants, 1);
    assert_eq!(env.pool.get(&1), Some(&7.0));
    assert_eq!(env.pool.get(&2), Some(&3.0));

    // Pula dawcy za mała: od dawcy max(0, 2-5) = 0, odbiorca +5 (pin: setOwnerPracaPool clamp).
    env.pool = BTreeMap::from([(1, 2.0), (2, 0.0)]);
    let items = vec![BasketItem::new(BasketItemKind::Work, "praca", 5.0)];
    env.run(p(1), p(2), &items, None, &mut grants, 1);
    assert_eq!(env.pool.get(&1), Some(&0.0));
    assert_eq!(env.pool.get(&2), Some(&5.0));
}

#[test]
fn praca_uses_skala_and_handles_same_owner_in_pin_order() {
    let mut env = Env {
        pool: BTreeMap::from([(1, 10.0)]),
        ..Env::default()
    };
    let mut grants = Vec::new();
    let items = vec![BasketItem::new(BasketItemKind::Work, "praca", 3.0)];
    // skala 2 -> praca = 6
    env.run(p(1), p(2), &items, None, &mut grants, 2);
    assert_eq!(env.pool.get(&1), Some(&4.0));
    assert_eq!(env.pool.get(&2), Some(&6.0));

    // from == to, pin: from = max(0, 4-3) = 1, potem to = max(0, 1+3) = 4.
    let mut env = Env {
        pool: BTreeMap::from([(1, 4.0)]),
        ..Env::default()
    };
    env.run(p(1), p(1), &items, None, &mut grants, 1);
    assert_eq!(env.pool.get(&1), Some(&4.0));
}
