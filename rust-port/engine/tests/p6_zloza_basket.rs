//! R-RUSTPORT-P6-ZLOZA-B: wektory z pinu `07d2fbd72f758705f8e1d59cc4968027ffbafe75`
//! dla funkcji `transferBasketItems` (`gra/src/main.ts:12566`).
//! Wektory generuje `p6_zloza_basket_gen.mjs` (wykonanie fragmentu pinu w node, strażniki SHA-256).
//!
//! - `cases` (r2): gałąź `zloze` oraz `jednostka` (no-op), wektory `expectedGrants`.
//! - `state_cases` (r3): gałęzie `tech`, `surowiec_boolean`, `surowiec_ilosc`, `praca` (i `zloze`,
//!   `jednostka` w mieszance) wykonane na kodzie pinu z rejestrującym harnessem stanu. Porównujemy
//!   stan po wykonaniu: `researchedByOwner`, `surowiecBooleanGrants`, `cities[].surowce`, pulę Pracy
//!   oraz `zlozeGrants`. Efekty poza portem (`player.zbadane`, epoki dla gracza 0) nie są porównywane;
//!   Rust raportuje je jako `unported_side_effects`.
//! - Gałęzie `zloto`, `zywnosc`, `miasto` NIE są tu wykonywane (zakres poza r3).

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::diplomacy::{
    grant_surowiec_boolean_access, grant_tech_to_owner, normalize_resource_quantity,
    transfer_surowiec_ilosc, BasketItem, BasketItemKind, BasketTransferContext, CityResourceState,
    ResourceAccessGrant, ZlozeGrant,
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
/// SHA-256 pliku `gra/src/game/diplomacy-basket-transfer.ts` na pinie (transpilowany przez generator).
const PIN_BASKET_TRANSFER_SHA256: &str =
    "c2a9c5f4bc5681bc2d767a386fcecf319a448555789ae6b4b046de34f5dedd1e";
/// SHA-256 pliku `gra/src/game/diplomacy-value-catalog.ts` na pinie (strażnik generatora).
const PIN_VALUE_CATALOG_SHA256: &str =
    "e02be22a57284b7cc5aeb59e8116ba3f403d787e15d3e0c3604689ef9245449c";
/// SHA-256 wyciętych bloków katalogu wartości (HANDEL_SUROWCE_KROK10, diplomacyHandelSurowiecKrok,
/// diplomacyPnPraca, diplomacyNormalizeSurowiecIlosc) użytych przez generator.
const PIN_VALUE_CATALOG_EXTRACT_SHA256: &str =
    "201fa9c0000deb5d8afe974ae4b4301a6c4d2482c957a9a439ca99ba012649eb";

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
    /// Pin: `capitalCityIdForOwner(ownerId)` — mapa właściciel → id stolicy (puste = brak).
    capital: BTreeMap<u64, String>,
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
        let capital_map = &self.capital;
        let capital = |id: PlayerId| -> Option<String> { capital_map.get(&id.get()).cloned() };
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

/// Buduje stan z przypadku `state_cases` (pole `init`).
fn env_from_state_case(case: &Value) -> Env {
    let init = &case["init"];
    let mut ctx = BasketTransferContext::default();
    for (owner, techs) in init["researched"].as_object().expect("researched") {
        let set: BTreeSet<String> = techs
            .as_array()
            .expect("techs")
            .iter()
            .map(|t| t.as_str().expect("tech id").to_string())
            .collect();
        ctx.researched_by_owner
            .insert(p(owner.parse().expect("owner id")), set);
    }
    ctx.resource_grants =
        serde_json::from_value::<Vec<ResourceAccessGrant>>(init["grants"].clone()).expect("grants");
    let cities: Vec<CityResourceState> =
        serde_json::from_value(init["cities"].clone()).expect("cities");
    let pool = object_f64_map(&init["pool"]);
    let capital = init["capital"]
        .as_object()
        .expect("capital")
        .iter()
        .map(|(o, id)| {
            (
                o.parse().expect("owner id"),
                id.as_str().expect("city id").to_string(),
            )
        })
        .collect();
    Env {
        ctx,
        cities,
        pool,
        capital,
    }
}

/// Obiekt JSON `{"<owner>": liczba}` → mapa właściciel → f64.
fn object_f64_map(v: &Value) -> BTreeMap<u64, f64> {
    v.as_object()
        .expect("owner->number object")
        .iter()
        .map(|(o, n)| (o.parse().expect("owner id"), n.as_f64().expect("number")))
        .collect()
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
    assert_eq!(
        v["pin"]["basket_transfer_file_sha256"].as_str(),
        Some(PIN_BASKET_TRANSFER_SHA256)
    );
    assert_eq!(
        v["pin"]["value_catalog_file_sha256"].as_str(),
        Some(PIN_VALUE_CATALOG_SHA256)
    );
    assert_eq!(
        v["pin"]["value_catalog_extract_sha256"].as_str(),
        Some(PIN_VALUE_CATALOG_EXTRACT_SHA256)
    );
}

/// r3: gałęzie tech / surowiec_boolean / surowiec_ilosc / praca na kodzie pinu, stan po wykonaniu.
#[test]
fn state_branches_match_pin_vectors() {
    let v = vectors();
    let cases = v["state_cases"].as_array().expect("state_cases");
    assert!(
        cases.len() >= 150,
        "za malo przypadkow stanu: {}",
        cases.len()
    );

    // Każda z czterech gałęzi musi wystąpić w wektorach z efektem (nie tylko jako no-op).
    let count_kind = |typ: &str| {
        cases
            .iter()
            .filter(|c| {
                c["items"]
                    .as_array()
                    .expect("items")
                    .iter()
                    .any(|i| i["typ"].as_str() == Some(typ))
            })
            .count()
    };
    for typ in ["tech", "surowiec_boolean", "surowiec_ilosc", "praca"] {
        assert!(count_kind(typ) >= 20, "za malo przypadkow dla gałęzi {typ}");
    }

    // r4 (zarzut EVAL r3 1-2): pokrycie EFEKTU na miastach, nie tylko obecności gałęzi.
    // Przypadek liczy się, gdy po wykonaniu pinu zmienia się `cities[].surowce`.
    let city_surowce = |city_list: &Value, id: &str| -> Option<Value> {
        city_list
            .as_array()?
            .iter()
            .find(|c| c["id"].as_str() == Some(id))
            .map(|c| c["surowce"].clone())
    };
    let ilosc_cases: Vec<&Value> = cases
        .iter()
        .filter(|c| {
            c["items"]
                .as_array()
                .expect("items")
                .iter()
                .any(|i| i["typ"].as_str() == Some("surowiec_ilosc"))
        })
        .collect();
    let changed = |c: &Value| c["expected"]["cities"] != c["init"]["cities"];
    let ilosc_effect = ilosc_cases.iter().filter(|c| changed(c)).count();
    assert!(
        ilosc_effect >= 40,
        "za malo przypadkow surowiec_ilosc ze zmiana miast: {ilosc_effect}"
    );
    // Zbiórka z co najmniej dwóch miast dawcy w jednym przypadku (kolejność dawców ma znaczenie).
    let multi_donor = ilosc_cases
        .iter()
        .filter(|c| {
            let from = c["fromOwnerId"].as_i64();
            let donors_changed = c["init"]["cities"]
                .as_array()
                .expect("cities")
                .iter()
                .filter(|city| city["ownerId"].as_i64() == from)
                .filter(|city| {
                    let id = city["id"].as_str().unwrap_or_default();
                    city_surowce(&c["expected"]["cities"], id) != Some(city["surowce"].clone())
                })
                .count();
            donors_changed >= 2
        })
        .count();
    assert!(
        multi_donor >= 10,
        "za malo zbiorek z kilku miast dawcy: {multi_donor}"
    );
    // Normalizacja klucza (trim/lowercase) widoczna w stanie miast.
    let normalized_effect = ilosc_cases
        .iter()
        .filter(|c| {
            changed(c)
                && c["items"].as_array().expect("items").iter().any(|i| {
                    i["typ"].as_str() == Some("surowiec_ilosc")
                        && i["id"]
                            .as_str()
                            .is_some_and(|id| id != id.trim().to_lowercase())
                })
        })
        .count();
    assert!(
        normalized_effect >= 6,
        "za malo przypadkow z niekanoniczным kluczem i efektem: {normalized_effect}"
    );
    // Nazwane przypadki: remis dawców, stolica jako biorca, zbiórka z trzech miast, normalizacja.
    for name in [
        "ilosc: remis dawcow wg id, biorca = pierwszy bez stolicy",
        "ilosc: remis dawcow wg id, biorca = stolica odb_a",
        "ilosc: zbiorka z trzech miast (90,30,50) rozbita na dawcow",
        "ilosc: zbiorka czesciowa z kilku miast (brak wystarczajacego zapasu)",
        "ilosc: normalizacja klucza (trim + lowercase) w stanie miast",
    ] {
        let case = cases
            .iter()
            .find(|c| c["name"].as_str() == Some(name))
            .unwrap_or_else(|| panic!("brak nazwanego przypadku: {name}"));
        assert!(changed(case), "nazwany przypadek bez efektu: {name}");
    }

    for case in cases {
        let name = case["name"].as_str().unwrap_or("?");
        let items: Vec<BasketItem> = serde_json::from_value(case["items"].clone())
            .unwrap_or_else(|e| panic!("{name}: items: {e}"));
        let from = p(case["fromOwnerId"].as_i64().expect("fromOwnerId"));
        let to = p(case["toOwnerId"].as_i64().expect("toOwnerId"));
        let deal_id = case["dealId"].as_str();
        let skala = case["pnPracaSkala"].as_i64().expect("pnPracaSkala");
        let mut env = env_from_state_case(case);
        let mut grants: Vec<ZlozeGrant> = Vec::new();
        let outcome = env.run(from, to, &items, deal_id, &mut grants, skala);

        let expected = &case["expected"];
        let want_grants: Vec<ZlozeGrant> = expected["zlozeGrants"]
            .as_array()
            .expect("zlozeGrants")
            .iter()
            .map(grant_from)
            .collect();
        assert_eq!(grants, want_grants, "zloze: {name}");
        assert_eq!(
            outcome.grants_created,
            want_grants.len(),
            "liczba grantów: {name}"
        );

        let got_researched: BTreeMap<String, Vec<String>> = env
            .ctx
            .researched_by_owner
            .iter()
            .map(|(o, s)| (o.get().to_string(), s.iter().cloned().collect()))
            .collect();
        let want_researched: BTreeMap<String, Vec<String>> = expected["researchedByOwner"]
            .as_object()
            .expect("researchedByOwner")
            .iter()
            .map(|(o, arr)| {
                (
                    o.clone(),
                    arr.as_array()
                        .expect("techs")
                        .iter()
                        .map(|t| t.as_str().expect("tech").to_string())
                        .collect(),
                )
            })
            .collect();
        assert_eq!(got_researched, want_researched, "technologie: {name}");

        let want_access: Vec<ResourceAccessGrant> =
            serde_json::from_value(expected["surowiecBooleanGrants"].clone())
                .expect("surowiecBooleanGrants");
        assert_eq!(
            env.ctx.resource_grants, want_access,
            "dostęp do surowca: {name}"
        );

        let want_cities: Vec<CityResourceState> =
            serde_json::from_value(expected["cities"].clone()).expect("cities");
        assert_eq!(env.cities, want_cities, "surowce miast: {name}");

        assert_eq!(
            env.pool,
            object_f64_map(&expected["pool"]),
            "pula Pracy: {name}"
        );
    }
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
    // r4: dla AI (owner 2) efekt uboczny jest raportowany tylko, gdy tech faktycznie przyznano.
    assert_eq!(outcome.unported_side_effects.is_empty(), !expected.granted);
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

/// r4 (zarzut EVAL r3 5): tech dla AI (owner != 0) raportuje własne efekty uboczne pina
/// (`aiResearchDone`, `syncOwnerEraFromResearch`, `refreshCityRenderIfEraChanged`).
#[test]
fn tech_for_ai_owner_reports_ai_side_effects_only_when_granted() {
    let mut env = Env::default();
    let items = vec![BasketItem::new(BasketItemKind::Technology, "t1", 1.0)];
    let granted = grant_tech_to_owner("t1", p(2), &env.ctx).granted;
    let mut grants = Vec::new();
    let outcome = env.run(p(1), p(2), &items, None, &mut grants, 1);
    assert_eq!(outcome.unported_side_effects.is_empty(), !granted);
    assert!(
        granted,
        "t1 musi dać się przyznać AI, inaczej test jest pusty"
    );
    assert_eq!(outcome.unported_side_effects.len(), 1);
    assert!(outcome.unported_side_effects[0].starts_with("tech_ai:"));
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
